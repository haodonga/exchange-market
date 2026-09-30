/*
 * Swapbook local server
 * - dependency-free Node.js HTTP API
 * - JSON persistence in ./data/database.json
 * - cookie session auth, password hashing, image upload storage
 */
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || '127.0.0.1';
const DATA_DIR = process.env.SWAPBOOK_DATA_DIR ? path.resolve(process.env.SWAPBOOK_DATA_DIR) : path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const DATABASE_FILE = path.join(DATA_DIR, 'database.json');
const MEETING_PLACES_FILE = path.join(ROOT, 'meeting-places.json');
const MAX_BODY_BYTES = 4 * 1024 * 1024;
const SESSION_DAYS = 14;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.json': 'application/json; charset=utf-8'
};

const id = (prefix) => `${prefix}_${crypto.randomBytes(10).toString('hex')}`;
const now = () => Date.now();
const publicUser = (user) => user && ({ id: user.id, name: user.name, email: user.email, joinedAt: user.joinedAt });
const cleanText = (value, max) => String(value ?? '').trim().slice(0, max);
const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validId = (value) => /^[a-z]_[a-f0-9]{20}$/.test(value || '');

function passwordRecord(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function passwordMatches(password, record) {
  const [salt, expected] = String(record || '').split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  return actual.length === expected.length && crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

function seedDatabase() {
  const mia = { id: 'u_7a5ac1a2d9520f1c40e7', name: 'Mia', email: 'mia@swap.local', password: passwordRecord('mia123'), joinedAt: '2026-09-01T09:00:00.000Z' };
  const ken = { id: 'u_01e7d3e28701b1ec0a13', name: 'Ken', email: 'ken@swap.local', password: passwordRecord('ken123'), joinedAt: '2026-09-03T09:00:00.000Z' };
  const items = [];
  return { users: [mia, ken], items, offers: [], sessions: [] };
}

async function ensureDatabase() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.mkdir(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(DATABASE_FILE)) await fsp.writeFile(DATABASE_FILE, JSON.stringify(seedDatabase(), null, 2));
  const parsed = JSON.parse(await fsp.readFile(DATABASE_FILE, 'utf8'));
  for (const key of ['users', 'items', 'offers', 'sessions']) if (!Array.isArray(parsed[key])) parsed[key] = [];
  return parsed;
}

let db;
let meetingPlaces = [];
let writeQueue = Promise.resolve();
function persist() {
  const snapshot = JSON.stringify(db, null, 2);
  writeQueue = writeQueue.then(() => fsp.writeFile(DATABASE_FILE, snapshot));
  return writeQueue;
}

function sendJson(response, status, payload, extraHeaders = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders });
  response.end(JSON.stringify(payload));
}
function sendError(response, status, message) { return sendJson(response, status, { error: message }); }
function cookieMap(request) {
  return Object.fromEntries(String(request.headers.cookie || '').split(';').map(part => part.trim().split('=').map(decodeURIComponent)).filter(([key]) => key));
}
function currentUser(request) {
  const sessionId = cookieMap(request).swapbook_session;
  const session = db.sessions.find(entry => entry.id === sessionId && entry.expiresAt > now());
  return session ? db.users.find(user => user.id === session.userId) : null;
}
async function createSession(user) {
  db.sessions = db.sessions.filter(entry => entry.expiresAt > now());
  const session = { id: crypto.randomBytes(30).toString('base64url'), userId: user.id, expiresAt: now() + SESSION_DAYS * 86400000 };
  db.sessions.push(session); await persist(); return session;
}
function sessionCookie(session) { return `swapbook_session=${encodeURIComponent(session.id)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}`; }
function expiredCookie() { return 'swapbook_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'; }
async function readJson(request) {
  let total = 0; const chunks = [];
  for await (const chunk of request) { total += chunk.length; if (total > MAX_BODY_BYTES) throw new Error('请求内容过大，请选择小于 3MB 的图片。'); chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); }
  catch { throw new Error('请求格式不正确。'); }
}
function findItem(itemId) { return db.items.find(item => item.id === itemId && item.active); }
function itemView(item) { return { ...item, owner: publicUser(db.users.find(user => user.id === item.ownerId)) }; }
function handoverView(offer) {
  const stored = offer.handover && typeof offer.handover === 'object' && !Array.isArray(offer.handover) ? offer.handover : {};
  const participants = [offer.ownerId, offer.proposerId];
  return {
    ...stored,
    placeId: typeof stored.placeId === 'string' ? stored.placeId : null,
    revision: Number.isSafeInteger(stored.revision) && stored.revision >= 0 ? stored.revision : 0,
    proposedBy: participants.includes(stored.proposedBy) ? stored.proposedBy : null,
    confirmedBy: Array.isArray(stored.confirmedBy) ? [...new Set(stored.confirmedBy.filter(userId => participants.includes(userId)))] : [],
    updatedAt: Number.isFinite(stored.updatedAt) ? stored.updatedAt : null,
    messages: Array.isArray(stored.messages) ? stored.messages : []
  };
}
function offerView(offer) {
  return { ...offer, handover: handoverView(offer), targetItem: itemView(db.items.find(item => item.id === offer.targetItemId) || { title: '已下架物品', ownerId: offer.ownerId }), offeredItem: offer.offeredItemId ? itemView(db.items.find(item => item.id === offer.offeredItemId) || { title: '已下架物品', ownerId: offer.proposerId }) : null, proposer: publicUser(db.users.find(user => user.id === offer.proposerId)) };
}
function validImagePath(value) { return !value || (/^\/uploads\/[a-z0-9_-]+\.(png|jpg|webp|gif)$/.test(value)); }

async function handleApi(request, response, url) {
  const pathname = url.pathname;
  const user = currentUser(request);
  if (request.method === 'GET' && pathname === '/api/session') return sendJson(response, 200, { user: publicUser(user) });
  if (request.method === 'GET' && pathname === '/api/meeting-places') return sendJson(response, 200, { places: meetingPlaces });
  if (request.method === 'POST' && pathname === '/api/auth/register') {
    const body = await readJson(request); const name = cleanText(body.name, 24); const email = cleanText(body.email, 120).toLowerCase(); const password = String(body.password || '');
    if (name.length < 2) return sendError(response, 400, '昵称至少需要 2 个字符。');
    if (!validEmail(email)) return sendError(response, 400, '请输入有效的邮箱地址。');
    if (password.length < 6 || password.length > 128) return sendError(response, 400, '密码需要 6 至 128 个字符。');
    if (db.users.some(entry => entry.email === email)) return sendError(response, 409, '这个邮箱已经注册，请直接登录。');
    const account = { id: id('u'), name, email, password: passwordRecord(password), joinedAt: new Date().toISOString() }; db.users.push(account); const session = await createSession(account);
    return sendJson(response, 201, { user: publicUser(account) }, { 'Set-Cookie': sessionCookie(session) });
  }
  if (request.method === 'POST' && pathname === '/api/auth/login') {
    const body = await readJson(request); const email = cleanText(body.email, 120).toLowerCase(); const password = String(body.password || ''); const account = db.users.find(entry => entry.email === email);
    if (!account || !passwordMatches(password, account.password)) return sendError(response, 401, '邮箱或密码不正确。');
    const session = await createSession(account); return sendJson(response, 200, { user: publicUser(account) }, { 'Set-Cookie': sessionCookie(session) });
  }
  if (request.method === 'POST' && pathname === '/api/auth/logout') {
    if (user) { const sessionId = cookieMap(request).swapbook_session; db.sessions = db.sessions.filter(entry => entry.id !== sessionId); await persist(); }
    return sendJson(response, 200, { ok: true }, { 'Set-Cookie': expiredCookie() });
  }
  if (request.method === 'GET' && pathname === '/api/items') return sendJson(response, 200, { items: db.items.filter(item => item.active).sort((a, b) => b.createdAt - a.createdAt).map(itemView) });
  if (!user) return sendError(response, 401, '请先登录后再进行此操作。');
  if (request.method === 'POST' && pathname === '/api/uploads') {
    const body = await readJson(request); const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(String(body.imageData || ''));
    if (!match) return sendError(response, 400, '只支持 PNG、JPG、WebP 或 GIF 图片。');
    const buffer = Buffer.from(match[2], 'base64'); if (!buffer.length || buffer.length > 3 * 1024 * 1024) return sendError(response, 400, '图片需小于 3MB。');
    const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }[match[1]];
    const filename = `${id('img')}.${ext}`; await fsp.writeFile(path.join(UPLOAD_DIR, filename), buffer); return sendJson(response, 201, { imageUrl: `/uploads/${filename}` });
  }
  if (request.method === 'POST' && pathname === '/api/items') {
    const body = await readJson(request); const title = cleanText(body.title, 48); const category = cleanText(body.category, 20); const condition = cleanText(body.condition, 32); const description = cleanText(body.description, 240); const price = Number(body.price); const imageUrl = cleanText(body.imageUrl, 120);
    if (title.length < 2 || !category || !condition || description.length < 4) return sendError(response, 400, '请完整填写物品名称、类别、成色和描述。');
    if (!Number.isFinite(price) || price <= 0 || price > 100000000) return sendError(response, 400, '请输入合理的参考价格。');
    if (!validImagePath(imageUrl)) return sendError(response, 400, '图片地址不正确。');
    const item = { id: id('i'), ownerId: user.id, title, category, condition, description, price: Math.round(price), imageUrl: imageUrl || null, emoji: '📦', color: 'purple', createdAt: now(), active: true }; db.items.push(item); await persist(); return sendJson(response, 201, { item: itemView(item) });
  }
  const deleteItem = /^\/api\/items\/([^/]+)$/.exec(pathname);
  if (request.method === 'DELETE' && deleteItem) {
    const item = findItem(deleteItem[1]); if (!item) return sendError(response, 404, '找不到这件物品。'); if (item.ownerId !== user.id) return sendError(response, 403, '只能下架自己的物品。');
    if (db.offers.some(offer => offer.targetItemId === item.id && offer.status === 'pending')) return sendError(response, 409, '这件物品还有待处理的请求，请先回应后再下架。');
    item.active = false; await persist(); return sendJson(response, 200, { ok: true });
  }
  if (request.method === 'GET' && pathname === '/api/offers') {
    const incoming = db.offers.filter(offer => offer.ownerId === user.id).sort((a, b) => b.createdAt - a.createdAt).map(offerView);
    const outgoing = db.offers.filter(offer => offer.proposerId === user.id).sort((a, b) => b.createdAt - a.createdAt).map(offerView);
    return sendJson(response, 200, { incoming, outgoing });
  }
  if (request.method === 'POST' && pathname === '/api/offers') {
    const body = await readJson(request); const target = findItem(body.targetItemId); const type = body.type;
    if (!target) return sendError(response, 404, '目标物品已下架或不存在。'); if (target.ownerId === user.id) return sendError(response, 400, '不能向自己的物品发起请求。');
    if (!['item', 'cash'].includes(type)) return sendError(response, 400, '交易方式不正确。');
    if (db.offers.some(offer => offer.targetItemId === target.id && offer.proposerId === user.id && offer.status === 'pending')) return sendError(response, 409, '你已经向这件物品发出过待处理的请求。');
    const offer = { id: id('o'), targetItemId: target.id, ownerId: target.ownerId, proposerId: user.id, type, status: 'pending', createdAt: now(), respondedAt: null };
    if (type === 'item') { const offered = findItem(body.offeredItemId); if (!offered || offered.ownerId !== user.id) return sendError(response, 400, '请选择你自己仍在上架的物品。'); offer.offeredItemId = offered.id; }
    else { const amount = Number(body.cashAmount); if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) return sendError(response, 400, '请输入合理的现金报价。'); offer.cashAmount = Math.round(amount); }
    db.offers.push(offer); await persist(); return sendJson(response, 201, { offer: offerView(offer) });
  }
  const offerMessages = /^\/api\/offers\/([^/]+)\/messages$/.exec(pathname);
  const offerHandover = /^\/api\/offers\/([^/]+)\/handover$/.exec(pathname);
  if ((request.method === 'POST' && offerMessages) || (request.method === 'PATCH' && offerHandover)) {
    const body = await readJson(request);
    // Resolve and validate the latest state after reading the body. No await occurs
    // between the revision check and the mutation, so simultaneous proposals cannot
    // overwrite an intervening proposal or confirm a superseded location.
    const offerId = (offerMessages || offerHandover)[1];
    const offer = db.offers.find(entry => entry.id === offerId);
    if (!offer) return sendError(response, 404, '找不到这条请求。');
    if (offer.ownerId !== user.id && offer.proposerId !== user.id) return sendError(response, 403, '只有交易双方可以协商地点和留言。');
    if (offer.status !== 'accepted') return sendError(response, 409, '接受请求后才能协商交易地点和留言。');
    const handover = handoverView(offer);
    if (offerMessages) {
      if (!body || typeof body.text !== 'string') return sendError(response, 400, '留言内容必须是文字。');
      const messageText = body.text.trim();
      if (!messageText) return sendError(response, 400, '请先填写留言内容。');
      if ([...messageText].length > 500) return sendError(response, 400, '留言不能超过 500 个字符。');
      const timestamp = now();
      handover.messages.push({ id: id('m'), senderId: user.id, kind: 'message', text: messageText, createdAt: timestamp });
      handover.updatedAt = timestamp;
    } else {
      if (!body || !['propose', 'confirm'].includes(body.action)) return sendError(response, 400, '地点操作不正确。');
      if (!Number.isSafeInteger(body.revision) || body.revision < 0) return sendError(response, 400, '地点版本不正确，请刷新后重试。');
      if (body.revision !== handover.revision) return sendError(response, 409, '交易地点已更新，请查看最新地点后重试。');
      if (body.action === 'propose') {
        if (typeof body.placeId !== 'string' || !meetingPlaces.some(place => place.id === body.placeId)) return sendError(response, 400, '请选择平台指定的交易地点。');
        const timestamp = now();
        handover.placeId = body.placeId;
        handover.revision += 1;
        handover.proposedBy = user.id;
        handover.confirmedBy = [user.id];
        handover.updatedAt = timestamp;
        handover.messages.push({ id: id('m'), senderId: user.id, kind: 'place-proposed', text: '', placeId: handover.placeId, revision: handover.revision, createdAt: timestamp });
      } else {
        if (!handover.placeId) return sendError(response, 409, '请先提议一个交易地点。');
        if (handover.confirmedBy.includes(user.id)) return sendJson(response, 200, { offer: offerView(offer) });
        const timestamp = now();
        handover.confirmedBy.push(user.id);
        handover.updatedAt = timestamp;
        handover.messages.push({ id: id('m'), senderId: user.id, kind: 'place-confirmed', text: '', placeId: handover.placeId, revision: handover.revision, createdAt: timestamp });
      }
    }
    offer.handover = handover;
    await persist();
    return sendJson(response, 200, { offer: offerView(offer) });
  }
  const offerAction = /^\/api\/offers\/([^/]+)$/.exec(pathname);
  if (request.method === 'PATCH' && offerAction) {
    const body = await readJson(request);
    const offer = db.offers.find(entry => entry.id === offerAction[1]); if (!offer) return sendError(response, 404, '找不到这条请求。'); if (offer.ownerId !== user.id) return sendError(response, 403, '只有物主可以回应这条请求。'); if (offer.status !== 'pending') return sendError(response, 409, '这条请求已被处理。');
    if (!body || !['accepted', 'declined'].includes(body.status)) return sendError(response, 400, '只能同意或拒绝请求。');
    offer.status = body.status; offer.respondedAt = now(); await persist(); return sendJson(response, 200, { offer: offerView(offer) });
  }
  return sendError(response, 404, '接口不存在。');
}

async function staticFile(request, response, url) {
  const relativePath = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
  if (!['index.html', 'app.js', 'i18n.js', 'style.css'].includes(relativePath) && !/^(assets|uploads)\/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp|gif|svg|ico)$/.test(relativePath)) return sendError(response, 404, '页面不存在。');
  const resolved = path.resolve(ROOT, relativePath);
  if (!resolved.startsWith(ROOT + path.sep) && resolved !== path.join(ROOT, 'index.html')) return sendError(response, 403, '禁止访问。');
  try { const body = await fsp.readFile(resolved); response.writeHead(200, { 'Content-Type': MIME[path.extname(resolved).toLowerCase()] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' }); response.end(body); }
  catch { sendError(response, 404, '页面不存在。'); }
}

async function main() {
  db = await ensureDatabase();
  meetingPlaces = JSON.parse(await fsp.readFile(MEETING_PLACES_FILE, 'utf8'));
  if (!Array.isArray(meetingPlaces) || meetingPlaces.some(place => !place || typeof place.id !== 'string' || !place.id || typeof place.name !== 'string') || new Set(meetingPlaces.map(place => place.id)).size !== meetingPlaces.length) throw new Error('交易地点配置不正确。');
  http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || '127.0.0.1'}`);
    try { if (url.pathname.startsWith('/api/')) await handleApi(request, response, url); else await staticFile(request, response, url); }
    catch (error) { console.error(error); if (!response.headersSent) sendError(response, 500, error.message || '服务器暂时无法处理请求。'); else response.end(); }
  }).listen(PORT, HOST, () => console.log(`Swapbook full-stack app: http://${HOST}:${PORT}`));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
