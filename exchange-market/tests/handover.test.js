const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

const serverFile = path.resolve(__dirname, '..', 'server.js');

async function unusedPort() {
  const socket = net.createServer();
  socket.listen(0, '127.0.0.1');
  await once(socket, 'listening');
  const port = socket.address().port;
  await new Promise((resolve, reject) => socket.close(error => error ? reject(error) : resolve()));
  return port;
}

async function startServer(dataDir, port) {
  const child = spawn(process.execPath, [serverFile], {
    cwd: path.dirname(serverFile),
    env: { ...process.env, SWAPBOOK_DATA_DIR: dataDir, PORT: String(port), HOST: '127.0.0.1' },
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error(`Isolated server startup timed out: ${output}`)), 10000);
    child.stdout.on('data', chunk => {
      output += chunk.toString();
      if (output.includes('Swapbook full-stack app:')) { clearTimeout(timeout); resolve(); }
    });
    child.stderr.on('data', chunk => { output += chunk.toString(); });
    child.once('error', error => { clearTimeout(timeout); reject(error); });
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Isolated server exited with ${code}: ${output}`)); });
  }).catch(error => { child.kill(); throw error; });
  return child;
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  const exited = once(child, 'exit');
  child.kill();
  await exited;
}

test('accepted offers coordinate private, versioned Auckland handovers', { timeout: 45000 }, async t => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'swapbook-handover-'));
  const port = await unusedPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  let server;
  t.after(async () => {
    await stopServer(server);
    const cleanupPath = path.resolve(dataDir);
    assert.equal(path.dirname(cleanupPath), path.resolve(os.tmpdir()));
    assert.ok(path.basename(cleanupPath).startsWith('swapbook-handover-'));
    await fs.rm(cleanupPath, { recursive: true, force: true });
  });
  server = await startServer(dataDir, port);

  async function request(method, endpoint, body, cookie) {
    const headers = { 'Content-Type': 'application/json' };
    if (cookie) headers.Cookie = cookie;
    const response = await fetch(`${baseUrl}${endpoint}`, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json(), headers: response.headers };
  }
  async function register(name) {
    const result = await request('POST', '/api/auth/register', { name, email: `${name.toLowerCase()}@handover.test`, password: 'test-password' });
    assert.equal(result.status, 201);
    return { ...result.body.user, cookie: result.headers.get('set-cookie').split(';')[0] };
  }
  async function publish(user, title) {
    const result = await request('POST', '/api/items', { title, category: '家居', condition: 'Like new', description: 'Real item used by an isolated handover test.', price: 25, imageUrl: '' }, user.cookie);
    assert.equal(result.status, 201);
    return result.body.item;
  }
  const owner = await register('Owner');
  const proposer = await register('Proposer');
  const stranger = await register('Stranger');
  const target = await publish(owner, 'Owner lamp');
  const offered = await publish(proposer, 'Proposer chair');
  const created = await request('POST', '/api/offers', { targetItemId: target.id, type: 'item', offeredItemId: offered.id }, proposer.cookie);
  assert.equal(created.status, 201);
  const offerId = created.body.offer.id;
  const messagesUrl = `/api/offers/${offerId}/messages`;
  const handoverUrl = `/api/offers/${offerId}/handover`;
  let places;

  await t.test('public catalogue and empty legacy-compatible handover', async () => {
    const result = await request('GET', '/api/meeting-places');
    assert.equal(result.status, 200);
    places = result.body.places;
    assert.ok(places.length >= 2);
    assert.equal(new Set(places.map(place => place.id)).size, places.length);
    assert.ok(places.every(place => place.name && place.address && place.mapUrl && place.sourceUrl));
    assert.deepEqual(created.body.offer.handover, { placeId: null, revision: 0, proposedBy: null, confirmedBy: [], updatedAt: null, messages: [] });
    const items = await request('GET', '/api/items');
    assert.equal(items.body.items.length, 2, 'isolated database starts without placeholder products');
  });

  await t.test('pending offers and unauthenticated or unrelated users cannot write', async () => {
    assert.equal((await request('POST', messagesUrl, { text: 'Pending message' }, owner.cookie)).status, 409);
    assert.equal((await request('PATCH', handoverUrl, { action: 'propose', placeId: places[0].id, revision: 0 }, proposer.cookie)).status, 409);
    assert.equal((await request('POST', messagesUrl, { text: 'Private message' })).status, 401);
    assert.equal((await request('PATCH', handoverUrl, { action: 'confirm', revision: 0 })).status, 401);
    assert.equal((await request('GET', '/api/offers')).status, 401);
    assert.equal((await request('POST', messagesUrl, { text: 'Intrusion' }, stranger.cookie)).status, 403);
    assert.equal((await request('PATCH', handoverUrl, { action: 'confirm', revision: 0 }, stranger.cookie)).status, 403);
    const strangerOffers = await request('GET', '/api/offers', undefined, stranger.cookie);
    assert.deepEqual(strangerOffers.body, { incoming: [], outgoing: [] });
    assert.equal((await request('PATCH', `/api/offers/${offerId}`, { status: 'accepted' }, proposer.cookie)).status, 403);
    const accepted = await request('PATCH', `/api/offers/${offerId}`, { status: 'accepted' }, owner.cookie);
    assert.equal(accepted.status, 200);
    assert.equal(accepted.body.offer.status, 'accepted');
  });

  await t.test('place proposal requires a catalogue entry and explicit current version', async () => {
    assert.equal((await request('PATCH', handoverUrl, { action: 'confirm', revision: 0 }, proposer.cookie)).status, 409);
    assert.equal((await request('PATCH', handoverUrl, { action: 'propose', placeId: 'unapproved-private-address', revision: 0 }, owner.cookie)).status, 400);
    for (const revision of [undefined, null, '0', -1, 1.5]) {
      assert.equal((await request('PATCH', handoverUrl, { action: 'propose', placeId: places[0].id, revision }, owner.cookie)).status, 400);
    }
    assert.equal((await request('PATCH', handoverUrl, { action: 'unknown', revision: 0 }, owner.cookie)).status, 400);
    const proposed = await request('PATCH', handoverUrl, { action: 'propose', placeId: places[0].id, revision: 0 }, owner.cookie);
    assert.equal(proposed.status, 200);
    const handover = proposed.body.offer.handover;
    assert.equal(handover.placeId, places[0].id);
    assert.equal(handover.revision, 1);
    assert.equal(handover.proposedBy, owner.id);
    assert.deepEqual(handover.confirmedBy, [owner.id]);
    assert.equal(handover.messages[0].kind, 'place-proposed');
    assert.equal(handover.messages[0].revision, 1);
    assert.equal(proposed.body.offer.status, 'accepted');
    assert.equal((await request('PATCH', handoverUrl, { action: 'confirm', revision: 0 }, proposer.cookie)).status, 409);
  });

  await t.test('both parties confirm, repeated confirmation is idempotent, changes reset consent', async () => {
    const confirmed = await request('PATCH', handoverUrl, { action: 'confirm', revision: 1 }, proposer.cookie);
    assert.equal(confirmed.status, 200);
    assert.deepEqual(confirmed.body.offer.handover.confirmedBy, [owner.id, proposer.id]);
    assert.equal(confirmed.body.offer.handover.messages.length, 2);
    assert.equal(confirmed.body.offer.handover.messages[1].kind, 'place-confirmed');
    const duplicate = await request('PATCH', handoverUrl, { action: 'confirm', revision: 1 }, proposer.cookie);
    assert.equal(duplicate.status, 200);
    assert.deepEqual(duplicate.body.offer.handover, confirmed.body.offer.handover);
    const changed = await request('PATCH', handoverUrl, { action: 'propose', placeId: places[1].id, revision: 1 }, proposer.cookie);
    assert.equal(changed.status, 200);
    assert.equal(changed.body.offer.handover.revision, 2);
    assert.equal(changed.body.offer.handover.placeId, places[1].id);
    assert.deepEqual(changed.body.offer.handover.confirmedBy, [proposer.id]);
    assert.equal((await request('PATCH', handoverUrl, { action: 'confirm', revision: 1 }, owner.cookie)).status, 409);
    const latest = await request('PATCH', handoverUrl, { action: 'confirm', revision: 2 }, owner.cookie);
    assert.equal(latest.status, 200);
    assert.equal(latest.body.offer.status, 'accepted', 'location confirmation must not mark the exchange complete');
  });

  await t.test('messages keep user text, reject invalid or overlong input, and remain private', async () => {
    for (const text of [undefined, null, 3, {}, ['text']]) {
      assert.equal((await request('POST', messagesUrl, { text }, owner.cookie)).status, 400);
    }
    assert.equal((await request('POST', messagesUrl, { text: '   ' }, owner.cookie)).status, 400);
    assert.equal((await request('POST', messagesUrl, { text: '字'.repeat(501) }, owner.cookie)).status, 400);
    const plainText = '<img src=x onerror=alert(1)> Can we meet at 2 pm? & bring a bag.';
    const posted = await request('POST', messagesUrl, { text: `  ${plainText}  ` }, proposer.cookie);
    assert.equal(posted.status, 200);
    const message = posted.body.offer.handover.messages.at(-1);
    assert.equal(message.text, plainText, 'API stores user input as plain text; rendering must escape it');
    assert.equal(message.senderId, proposer.id);
    assert.equal(message.kind, 'message');
    assert.ok(Number.isFinite(message.createdAt));
    assert.equal((await request('POST', messagesUrl, { text: '字'.repeat(500) }, owner.cookie)).status, 200);
    assert.equal((await request('POST', messagesUrl, { text: '👋'.repeat(500) }, owner.cookie)).status, 200);
    const incoming = await request('GET', '/api/offers', undefined, owner.cookie);
    const outgoing = await request('GET', '/api/offers', undefined, proposer.cookie);
    assert.deepEqual(incoming.body.incoming[0].handover, outgoing.body.outgoing[0].handover);
    const privateView = await request('GET', '/api/offers', undefined, stranger.cookie);
    assert.deepEqual(privateView.body, { incoming: [], outgoing: [] });
    assert.equal((await request('POST', messagesUrl, { text: 'Not allowed' }, stranger.cookie)).status, 403);
    assert.equal((await request('PATCH', handoverUrl, { action: 'confirm', revision: 2 }, stranger.cookie)).status, 403);
  });

  await t.test('simultaneous proposals allow one winner per revision', async () => {
    const attempts = await Promise.all([
      request('PATCH', handoverUrl, { action: 'propose', placeId: places[0].id, revision: 2 }, owner.cookie),
      request('PATCH', handoverUrl, { action: 'propose', placeId: places[1].id, revision: 2 }, proposer.cookie)
    ]);
    assert.deepEqual(attempts.map(result => result.status).sort(), [200, 409]);
    const winner = attempts.find(result => result.status === 200);
    assert.equal(winner.body.offer.handover.revision, 3);
    assert.equal(winner.body.offer.handover.confirmedBy.length, 1);
  });

  await t.test('a body arriving late cannot confirm an outdated place', async () => {
    let finishBody;
    const responsePromise = new Promise((resolve, reject) => {
      const pending = http.request(`${baseUrl}${handoverUrl}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: proposer.cookie } }, response => {
        let responseText = '';
        response.setEncoding('utf8');
        response.on('data', chunk => { responseText += chunk; });
        response.on('end', () => resolve({ status: response.statusCode, body: JSON.parse(responseText) }));
      });
      pending.on('error', reject);
      pending.write('{"action":"confirm",');
      finishBody = () => pending.end('"revision":3}');
    });
    const changed = await request('PATCH', handoverUrl, { action: 'propose', placeId: places[0].id, revision: 3 }, owner.cookie);
    assert.equal(changed.status, 200);
    finishBody();
    const stale = await responsePromise;
    assert.equal(stale.status, 409);
    const offers = await request('GET', '/api/offers', undefined, owner.cookie);
    assert.equal(offers.body.incoming[0].handover.revision, 4);
    assert.deepEqual(offers.body.incoming[0].handover.confirmedBy, [owner.id]);
  });

  await t.test('messages and confirmations survive restart, old accepted records normalize without data loss', async () => {
    const before = await request('GET', '/api/offers', undefined, owner.cookie);
    const handoverBefore = before.body.incoming.find(offer => offer.id === offerId).handover;
    await stopServer(server);
    server = null;
    const databaseFile = path.join(dataDir, 'database.json');
    const snapshot = JSON.parse(await fs.readFile(databaseFile, 'utf8'));
    const legacy = { ...snapshot.offers.find(offer => offer.id === offerId), id: 'o_a1234567890123456789', existingField: 'preserve old record' };
    delete legacy.handover;
    snapshot.offers.push(legacy);
    await fs.writeFile(databaseFile, JSON.stringify(snapshot));
    server = await startServer(dataDir, port);
    const after = await request('GET', '/api/offers', undefined, owner.cookie);
    assert.equal(after.status, 200, 'session persists in isolated database');
    assert.deepEqual(after.body.incoming.find(offer => offer.id === offerId).handover, handoverBefore);
    const oldView = after.body.incoming.find(offer => offer.id === legacy.id);
    assert.equal(oldView.existingField, 'preserve old record');
    assert.equal(oldView.targetItemId, target.id);
    assert.deepEqual(oldView.handover, { placeId: null, revision: 0, proposedBy: null, confirmedBy: [], updatedAt: null, messages: [] });
    const oldUpdate = await request('PATCH', `/api/offers/${legacy.id}/handover`, { action: 'propose', placeId: places[0].id, revision: 0 }, proposer.cookie);
    assert.equal(oldUpdate.status, 200);
    assert.equal(oldUpdate.body.offer.existingField, 'preserve old record');
    assert.equal(oldUpdate.body.offer.handover.revision, 1);
  });
});
