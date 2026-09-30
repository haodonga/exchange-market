const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const app = document.getElementById('app');
const pageViews = ['market', 'community', 'mine', 'trades'];
const currentView = () => pageViews.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'market';
const S = {
  user: null, items: [], offers: { incoming: [], outgoing: [] }, view: currentView(),
  auth: 'login', cat: '全部', q: '', sort: 'newest', modal: null, deleteTarget: null,
  mode: 'item', preview: null, drafts: {}, pending: {}, passwordVisible: false, returnFocus: null,
  handover: null, places: [], placesLoaded: false, placesError: false, placeArea: 'all'
};
const categories = ['家居', '数码', '书籍', '服饰', '植物', '其他'];
const e = value => String(value ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[c]));
const yuan = value => `¥${Number(value || 0).toLocaleString(I18N.locale)}`;
const mine = item => item.ownerId === S.user?.id;
const get = id => S.items.find(item => item.id === id);
const initials = name => ((name || '?').trim()[0] || '?').toUpperCase();
const translated = value => e(I18N.t(value));
async function api(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) { const error = Error(result.error || '操作未完成，请稍后重试。'); error.status = response.status; throw error; }
  return result;
}
function toast(message, kind = '') {
  const element = document.createElement('div'); element.className = `toast ${kind}`;
  element.textContent = I18N.t(message); $('#toast-region').append(element);
  setTimeout(() => element.remove(), 4500);
}
async function init() {
  try { const [session] = await Promise.all([api('/api/session'), loadPlaces()]); S.user = session.user; if (S.user) await refresh(); render(); }
  catch { S.user = null; render(); toast('连接服务失败，请确认本地服务已启动，然后刷新页面。', 'error'); }
}
async function loadPlaces() {
  try { S.places = (await api('/api/meeting-places')).places || []; S.placesError = false; }
  catch { S.placesError = true; }
  S.placesLoaded = true;
}
const tile = () => '<span class="rainbow-tile" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>';
const btn = (text, action, data = '', klass = 'primary') => `<button type="${action === 'submit' ? 'submit' : 'button'}" class="button ${klass}" data-action="${action}" ${data}>${e(text)}${klass === 'primary' || klass === 'pink' ? tile() : ''}</button>`;
const avatar = user => `<span class="avatar" aria-hidden="true">${e(initials(user?.name))}</span>`;
const brandMark = () => '<img class="brand-logo" src="/assets/swapbook-logo.png" width="44" height="44" alt="" aria-hidden="true"><span class="brand-name" data-user-content>NZswap</span>';
const pic = (item, klass = 'photo') => `<div class="${klass} ${e(item.color || '')}" data-user-content>${item.imageUrl ? `<img src="${e(item.imageUrl)}" alt="${e(item.title)}" loading="lazy">` : '<b class="item-placeholder" aria-hidden="true">↔</b>'}</div>`;
const feedback = () => '<p class="form-feedback" role="alert" hidden></p>';
function auth() {
  const register = S.auth === 'register';
  return `<main class="auth"><section class="auth-sky"><div class="brand">${brandMark()}</div><div class="auth-copy"><p class="kicker">邻里交换 · 好物新生</p><h1><span class="headline-line">让好物</span><span class="headline-line">再次心动。</span></h1><p>发布你的闲置，遇见另一个人的刚刚好。</p></div><img src="/assets/swapbook-community-illustration.png" alt="邻里交换物品的卡通插画" class="auth-photo"><p class="photo-caption">让一件闲置，开启下一段日常。</p></section><section class="auth-panel"><div class="brand mobile">${brandMark()}</div><form id="auth-form" data-draft-key="auth-${S.auth}" class="pillow auth-box"><p class="kicker">从一件好物开始</p><h2>${register ? '加入交换俱乐部' : '欢迎回来'}</h2><p class="muted">${register ? '创建账户，开始让好物继续流转。' : '登录后继续你的交换旅程。'}</p><div class="tabs" role="group" aria-label="账户操作"><button type="button" aria-pressed="${!register}" class="${!register ? 'active' : ''}" data-action="auth" data-mode="login">登录</button><button type="button" aria-pressed="${register}" class="${register ? 'active' : ''}" data-action="auth" data-mode="register">注册</button></div>${register ? '<label>昵称<input required name="name" autocomplete="nickname" minlength="2" maxlength="24" placeholder="例如：小林"></label>' : ''}<label>邮箱<input required type="email" name="email" autocomplete="email" maxlength="120" placeholder="you@example.com"></label><label for="auth-password">密码</label><div class="password-field"><input id="auth-password" required type="${S.passwordVisible ? 'text' : 'password'}" name="password" autocomplete="${register ? 'new-password' : 'current-password'}" minlength="6" maxlength="128" placeholder="至少 6 位"><button type="button" class="password-toggle" data-action="password" aria-controls="auth-password" aria-pressed="${S.passwordVisible}">${S.passwordVisible ? '隐藏密码' : '显示密码'}</button></div><p class="form-hint">${register ? '密码需为 6–128 位。请使用你自己的邮箱注册。' : '使用注册邮箱登录，或选择下方演示账号体验。'}</p>${feedback()}${btn(register ? '创建账户' : '登录', 'submit')}<div class="demo"><p>体验演示账号</p><div class="demo-actions"><button type="button" data-action="demo" data-account="mia">Mia</button><button type="button" data-action="demo" data-account="ken">Ken</button></div><small>点击填入账号，再按登录。演示数据为大家共享。</small></div></form></section></main>`;
}
function nav() {
  const count = S.offers.incoming.filter(offer => offer.status === 'pending').length;
  return `<header><button type="button" class="brand brand-button" data-action="view" data-view="market" aria-label="返回市场">${brandMark()}</button><nav aria-label="主导航">${[['market', '逛市场'], ['community', '社区交换'], ['mine', '我的物品'], ['trades', '交易请求']].map(([view, label]) => `<button type="button" class="${S.view === view ? 'active' : ''}" ${S.view === view ? 'aria-current="page"' : ''} data-action="view" data-view="${view}">${label}${view === 'trades' && count ? ` <i>${count}</i>` : ''}</button>`).join('')}</nav><div class="account">${avatar(S.user)}<span data-user-content>${e(S.user.name)}</span><button type="button" data-action="logout">退出</button></div></header>`;
}
function product(item) {
  const owner = item.owner || {};
  return `<article class="product">${pic(item)}<div><div class="meta"><span>${translated(item.category)}</span><span data-user-content>${e(item.condition)}</span></div><h3 data-user-content>${e(item.title)}</h3><p data-user-content>${e(item.description)}</p><div class="product-foot"><span data-user-content>${avatar(owner)}${e(owner.name)}</span><b>${yuan(item.price)}<small class="price-label">参考价</small></b></div>${mine(item) ? '<button type="button" class="button neutral" disabled>这是你的物品</button>' : btn('交换它', 'offer', `data-id="${e(item.id)}"`)}</div></article>`;
}
function filteredItems() {
  const query = S.q.trim().toLocaleLowerCase();
  return S.items.filter(item => (S.cat === '全部' || item.category === S.cat) && (!query || `${item.title} ${item.description} ${item.category} ${I18N.t(item.category)}`.toLocaleLowerCase().includes(query))).sort((a, b) => S.sort === 'price-low' ? a.price - b.price : S.sort === 'price-high' ? b.price - a.price : b.createdAt - a.createdAt);
}
function results() {
  const items = filteredItems();
  if (items.length) return items.map(product).join('');
  if (!S.items.length) return `<div class="empty-state"><span aria-hidden="true">↔</span><h3>市场正在等第一件好物</h3><p>发布你想分享的闲置，让邻里的交换从这里开始。</p>${btn('发布第一件物品', 'view', 'data-view="mine"', 'soft')}</div>`;
  return `<div class="empty-state"><span aria-hidden="true">↔</span><h3>暂时没有找到</h3><p>没有找到匹配的好物，换一个关键词试试。</p>${btn('清除筛选', 'reset', '', 'soft')}</div>`;
}
function howItWorks() {
  return `<section class="how-it-works" aria-label="如何交换"><div class="how-step"><b class="step-number">01</b><div><h3>发现好物</h3><p>按类别挑选，找到日常需要。</p></div></div><div class="how-step"><b class="step-number">02</b><div><h3>提出交换</h3><p>拿物品交换，或给出现金报价。</p></div></div><div class="how-step"><b class="step-number">03</b><div><h3>约好交接</h3><p>物主同意后，在站内留言并确认交接地点。</p></div></div></section>`;
}
function market() {
  const cats = ['全部', ...new Set([...categories.filter(category => S.items.some(item => item.category === category)), ...S.items.map(item => item.category)])];
  return `<main><section class="hero"><div class="hero-copy"><p class="kicker">邻里交换 · 好物新生</p><h1><span class="headline-line">让好物</span><span class="headline-line">再次心动。</span></h1><p>用一件你愿意分享的物品，换一件真正需要的。也可以用现金报价，礼貌地问一问。</p><div class="hero-buttons">${btn('发布我的物品', 'view', 'data-view="mine"')} ${btn('开始挑选', 'jump', '', 'pink')}</div><p class="hero-note">从你的书架、厨房和生活里，找到下一次交换。</p></div><aside class="hero-media"><div class="hero-stamp" aria-hidden="true">GOOD THINGS<br>GO AROUND ↗</div><img class="hero-photo" src="/assets/swapbook-hero-illustration.png" alt="书籍、相机与杯子组成的好物交换卡通插画" fetchpriority="high"><div class="photo-caption"><b>下一站，新主人。</b><small>每一件物品，都值得被再次喜欢。</small></div></aside></section>${howItWorks()}<section class="listing" id="listing" aria-labelledby="listing-title"><div class="section-head"><div><p class="kicker">去发现，去交换</p><h2 id="listing-title">市场里的新发现</h2></div><div class="market-tools"><label class="search"><span aria-hidden="true">⌕</span><input id="search" type="search" value="${e(S.q)}" placeholder="搜索物品或类别" aria-label="搜索物品或类别" autocomplete="off"></label><label class="sort-control"><span>排序</span><select id="sort" aria-label="物品排序"><option value="newest" ${S.sort === 'newest' ? 'selected' : ''}>最新发布</option><option value="price-low" ${S.sort === 'price-low' ? 'selected' : ''}>价格从低到高</option><option value="price-high" ${S.sort === 'price-high' ? 'selected' : ''}>价格从高到低</option></select></label></div></div><div class="filters" role="group" aria-label="按类别筛选">${cats.map(category => `<button type="button" class="${S.cat === category ? 'active' : ''}" aria-pressed="${S.cat === category}" data-action="cat" data-cat="${e(category)}">${e(category)}</button>`).join('')}</div><p class="results-summary" id="results-summary" role="status" aria-live="polite">${translated(`找到 ${filteredItems().length} 件好物`)}</p><div class="grid" id="market-results">${results()}</div></section><section class="community-banner"><img src="/assets/swapbook-community-illustration.png" alt="邻里交换物品的卡通插画" loading="lazy"><div class="community-copy"><p class="kicker">少一点闲置，多一点连接</p><h2>好物不止一段故事。</h2><p>一件读完的书，一台闲置的相机，或一只陪过你的杯子。分享你不再需要的，让它继续参与别人的生活。</p>${btn('走进社区交换', 'view', 'data-view="community"', 'soft')}</div></section></main>`;
}
function community() {
  return `<main class="page community-page"><section class="community-hero"><div class="community-copy"><p class="kicker">社区交换 · 在身边发生</p><h1>好物近一点，<br>邻里亲一点。</h1><p>从身边的一件闲置开始，向同一社区的人分享。先在线找到彼此需要的，接受交换后在站内留言，并从平台指定的奥克兰地点中约好交接。</p><div class="hero-buttons">${btn('发布我的物品', 'view', 'data-view="mine"')} ${btn('逛逛市场', 'view', 'data-view="market"', 'soft')}</div></div><figure class="community-scene"><img src="/assets/swapbook-community-illustration.png" alt="邻居在社区分享书籍和日常物品的卡通交换场景"><figcaption>把闲置留给需要它的人，把新故事留在社区。</figcaption></figure></section><section class="community-guide" aria-labelledby="community-guide-title"><div class="section-head"><div><p class="kicker">一起让交换更顺利</p><h2 id="community-guide-title">从线上心动，到线下交接。</h2></div></div><div class="community-guide-grid"><article class="pillow"><b class="step-number">01</b><h3>把物品说清楚</h3><p>发布实际照片，注明使用情况和瑕疵。选一个真实的参考价，也说清楚你想交换什么。</p></article><article class="pillow"><b class="step-number">02</b><h3>先回应，再约定</h3><p>查看交易请求，确认物品或报价是否合适。达成一致后，在站内留言商量时间，提议指定地点并由双方确认。</p></article><article class="pillow"><b class="step-number">03</b><h3>当面确认，完成交接</h3><p>到双方确认的地点见面，检查物品情况，再按约定交换或付款。有变化时在站内提前留言。</p></article></div><p class="community-note">网站记录物品、交换请求和交接留言。指定地点须经双方确认，付款仍由双方自行安排。</p></section>${placesSection()}<section class="community-invite pillow"><div><p class="kicker">你的第一件，就是一个新开始</p><h2>看看家里，哪件好物可以出发？</h2><p>读完的书、闲置的小家电、不再使用的日常用品，都可以拥有下一位主人。</p></div>${btn('整理我的交换清单', 'view', 'data-view="mine"')}</section></main>`;
}
function minePage() {
  const items = S.items.filter(mine);
  return `<main class="page"><div class="title"><p class="kicker">我的小小交换铺</p><h1>我的交换清单</h1><p>让别人清楚地知道你的物品是什么样子，也让它更容易遇到新主人。</p></div><div class="cols"><section class="pillow form"><h2>发布一件物品</h2><p class="form-hint">带上清晰的实拍图和真实描述，让交换更容易开始。</p><form id="item-form" data-draft-key="item"><label>物品名称<input required name="title" minlength="2" maxlength="48" placeholder="例如：手冲咖啡壶"></label><div class="two"><label>类别<select name="category">${categories.map(category => `<option value="${category}">${category}</option>`).join('')}</select></label><label>成色<input required name="condition" maxlength="32" placeholder="例如：九成新"></label></div><label>描述<textarea required name="description" minlength="4" maxlength="240" rows="4" placeholder="品牌、尺寸、使用情况…" aria-describedby="description-hint"></textarea></label><p id="description-hint" class="form-hint">写下尺寸、使用情况和瑕疵，最多 240 字。</p><label>现金参考价（元）<input required name="price" type="number" min="1" max="1000000" step="1" inputmode="numeric" placeholder="例如：120" aria-describedby="price-hint"></label><p id="price-hint" class="form-hint">参考价方便比较，最终交换或报价由双方商量。</p><label class="upload"><input id="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label="添加物品照片"><span>${S.preview ? `<img src="${e(S.preview)}" alt="图片预览">` : '＋'}</span><em>${S.preview ? '点击可替换图片' : '添加实拍图（可选，3MB 内）'}</em></label><div class="upload-actions" ${S.preview ? '' : 'hidden'}><button type="button" data-action="remove-image">移除图片</button></div><p class="form-hint">支持 JPG、PNG、WebP、GIF，图片小于 3MB。</p>${feedback()}${btn('发布到市场', 'submit')}<p class="form-hint">切换页面时保留本次草稿，发布成功后清空。</p></form></section><section class="pillow my-items"><div class="row"><h2>正在上架</h2><b>${items.length} 件</b></div>${items.length ? items.map(item => `<article class="mini">${pic(item, 'mini-pic')}<div><b data-user-content>${e(item.title)}</b><p><span>${translated(item.category)}</span> · <span data-user-content>${e(item.condition)}</span> · ${yuan(item.price)}</p></div><button type="button" data-action="delete" data-id="${e(item.id)}" aria-label="${e(I18N.t('下架物品'))}: ${e(item.title)}">×</button></article>`).join('') : '<div class="empty-state"><h3>从第一件好物开始</h3><p>你还没有上架物品。发布第一件，交换就可以开始了。</p></div>'}</section></div></main>`;
}
const areaLabels = { all: '全部区域', central: '中区', north: '北岸', east: '东区', west: '西区', south: '南区' };
const getOffer = id => [...S.offers.incoming, ...S.offers.outgoing].find(offer => offer.id === id);
const placeById = id => S.places.find(place => place.id === id);
const placeName = place => place ? (I18N.lang === 'en' ? place.name : place.nameZh || place.name) : I18N.t('尚未选择地点');
const meetingPoint = place => I18N.lang === 'en' ? place.meetingPointEn : place.meetingPointZh;
const handoverData = offer => ({ placeId: null, revision: 0, proposedBy: null, confirmedBy: [], messages: [], ...(offer.handover || {}) });
const participants = offer => [offer.proposer?.id || offer.proposerId, offer.targetItem?.owner?.id || offer.ownerId].filter(Boolean);
function locationConfirmed(offer) {
  const handover = handoverData(offer), ids = [...new Set(participants(offer))];
  return Boolean(handover.placeId && ids.length === 2 && ids.every(id => handover.confirmedBy.includes(id)));
}
function handoverStatus(offer) {
  const handover = handoverData(offer);
  if (!handover.placeId) return '待选交接地点';
  if (locationConfirmed(offer)) return '地点已确认';
  return handover.confirmedBy.includes(S.user?.id) ? '等待对方确认地点' : '请确认交接地点';
}
function mergeOffer(offer) {
  if (!offer) return;
  for (const direction of ['incoming', 'outgoing']) S.offers[direction] = S.offers[direction].map(existing => existing.id === offer.id ? offer : existing);
}
function placeLinks(place) {
  return `<div class="place-links"><a href="${e(place.mapUrl)}" target="_blank" rel="noopener noreferrer">查看地图 ↗</a><a href="${e(place.sourceUrl)}" target="_blank" rel="noopener noreferrer">地点资料 ↗</a></div>`;
}
function placeDetails(place) {
  if (!place) return '<p class="form-hint">选择地点后查看地址和集合点建议。</p>';
  return `<div class="place-preview-content"><b data-user-content>${e(placeName(place))}</b>${I18N.lang !== 'en' && place.name !== place.nameZh ? `<small data-user-content>${e(place.name)}</small>` : ''}<p data-user-content>${e(place.address)}</p><p><span>集合点建议：</span><span data-user-content>${e(meetingPoint(place))}</span></p>${placeLinks(place)}</div>`;
}
function placeCards() {
  if (!S.placesLoaded) return '<p class="empty">正在加载交接地点…</p>';
  if (S.placesError) return `<div class="empty-state"><p>交接地点暂时无法加载，请稍后重试。</p>${btn('重新加载地点', 'reload-places', '', 'soft')}</div>`;
  const list = S.places.filter(place => S.placeArea === 'all' || place.area === S.placeArea);
  return list.map(place => `<article class="place-card"><div class="place-card-head"><span class="place-area">${translated(areaLabels[place.area] || '公共地点')}</span><h3 data-user-content>${e(placeName(place))}</h3></div>${I18N.lang !== 'en' ? `<small data-user-content>${e(place.name)}</small>` : ''}<p data-user-content>${e(place.address)}</p><p class="place-meeting-point"><b>集合点建议：</b><span data-user-content>${e(meetingPoint(place))}</span></p>${placeLinks(place)}</article>`).join('') || '<p class="empty">这个区域暂时没有指定地点。</p>';
}
function placesSection() {
  return `<section class="places-section" aria-labelledby="places-title"><div class="section-head"><div><p class="kicker">奥克兰 · 平台指定交接地点</p><h2 id="places-title">在这里，把交换带到身边。</h2></div></div><p class="places-intro">接受交换后，可在交易请求中选定以下公园或公共地点，留言约好时间，并由双方确认同一地点。</p><div class="place-area-filters filters" role="group" aria-label="按奥克兰区域筛选">${Object.entries(areaLabels).map(([area, label]) => `<button type="button" class="${S.placeArea === area ? 'active' : ''}" aria-pressed="${S.placeArea === area}" data-action="place-area" data-area="${area}">${e(label)}</button>`).join('')}</div><div class="place-grid" id="community-places">${placeCards()}</div><p class="form-hint">地图用于查看位置，现场开放情况请查看地点资料。具体见面时间与集合点由双方在站内留言确认。</p></section>`;
}
function handoverSummary(offer) {
  const handover = handoverData(offer), place = placeById(handover.placeId);
  return `<span class="handover-state ${locationConfirmed(offer) ? 'confirmed' : 'pending'}">${translated(handoverStatus(offer))}</span>${place ? `<small data-user-content>${e(placeName(place))}</small>` : '<small>接受后可在站内留言，商量时间与指定地点。</small>'}${btn('协商交接', 'handover', `data-id="${e(offer.id)}"`, 'soft')}`;
}
function locationStateCard(offer) {
  const handover = handoverData(offer), place = placeById(handover.placeId), confirmed = locationConfirmed(offer), mineConfirmed = handover.confirmedBy.includes(S.user?.id);
  return `<div class="handover-location-card ${confirmed ? 'confirmed' : 'pending'}"><div class="location-state-head"><span class="location-status ${confirmed ? 'confirmed' : 'pending'}">${translated(handoverStatus(offer))}</span>${handover.revision ? `<small>${translated(`第 ${handover.revision} 版`)}</small>` : ''}</div>${place ? placeDetails(place) : '<p>先从指定地点中提出一个建议，再与对方商量交接时间。</p>'}${handover.placeId ? `<div class="location-confirmation"><span class="${mineConfirmed ? 'is-confirmed' : ''}">${translated(mineConfirmed ? '你已确认' : '你待确认')}</span><span class="${confirmed || (handover.confirmedBy.length && !mineConfirmed) ? 'is-confirmed' : ''}">${translated(confirmed || (handover.confirmedBy.length && !mineConfirmed) ? '对方已确认' : '对方待确认')}</span></div>${!mineConfirmed && !confirmed ? btn('确认这个交接地点', 'confirm-place', `data-revision="${e(handover.revision)}" ${S.pending['handover-confirm'] ? 'disabled' : ''}`) : ''}` : ''}<p class="form-hint">更换地点会重新开始双方确认。地点确认不代表交接或付款已完成。</p></div>`;
}
function placeOptions(selected = '') {
  return `<option value="">请选择交接地点</option>${Object.entries(areaLabels).filter(([area]) => area !== 'all').map(([area, label]) => {
    const options = S.places.filter(place => place.area === area);
    return options.length ? `<optgroup label="${translated(label)}">${options.map(place => `<option value="${e(place.id)}" ${place.id === selected ? 'selected' : ''} data-user-content>${e(placeName(place))}</option>`).join('')}</optgroup>` : '';
  }).join('')}`;
}
function messageSender(offer, message) {
  if (message.senderId === S.user?.id) return I18N.t('你');
  if (message.senderId === (offer.proposer?.id || offer.proposerId)) return offer.proposer?.name || I18N.t('对方');
  return offer.targetItem?.owner?.name || I18N.t('对方');
}
function handoverMessages(offer) {
  const messages = handoverData(offer).messages;
  if (!messages.length) return '<p class="chat-empty">还没有留言。先选个地点，或留言商量合适的时间。</p>';
  return messages.slice().sort((a, b) => a.createdAt - b.createdAt).map(message => {
    const system = message.kind !== 'message', place = placeById(message.placeId), time = new Date(message.createdAt);
    const content = system ? `<p class="message-text"><span>${translated(message.kind === 'place-proposed' ? '提议了交接地点' : '确认了交接地点')}</span>${place ? `：<b data-user-content>${e(placeName(place))}</b>` : ''}${message.revision ? `<small>${translated(`第 ${message.revision} 版`)}</small>` : ''}</p>` : `<p class="message-text" data-user-content>${e(message.text)}</p>`;
    return `<article class="message-entry ${system ? 'system' : message.senderId === S.user?.id ? 'mine' : ''}" data-message-id="${e(message.id)}"><div class="message-meta"><b data-user-content>${e(messageSender(offer, message))}</b><time datetime="${e(time.toISOString())}">${e(time.toLocaleString(I18N.locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }))}</time></div>${content}</article>`;
  }).join('');
}
function handoverModal() {
  const offer = getOffer(S.handover);
  if (!offer || offer.status !== 'accepted') { S.handover = null; return ''; }
  const handover = handoverData(offer), item = offer.targetItem || {}, other = offer.proposer?.id === S.user?.id ? offer.targetItem?.owner : offer.proposer;
  return `<div class="shade" data-action="close"><section class="modal handover-modal" role="dialog" aria-modal="true" aria-labelledby="handover-title" tabindex="-1"><button type="button" class="x" data-action="close" aria-label="关闭">×</button><div class="handover-heading"><p class="kicker">把交换约在身边</p><h2 id="handover-title">协商交接</h2><p><b data-user-content>${e(item.title || I18N.t('一件物品'))}</b> · <span>与</span> <b data-user-content>${e(other?.name || I18N.t('对方'))}</b> <span>协商</span></p></div><div class="handover-tools">${I18N.controls()}<button type="button" class="button soft chat-refresh" data-action="refresh-handover" ${S.pending['handover-refresh'] ? 'disabled' : ''}>刷新协商记录</button></div><p id="handover-update-status" class="form-hint" role="status" aria-live="polite"></p><p id="handover-action-error" class="form-feedback" role="alert" hidden></p><div class="handover-layout"><section class="handover-location" aria-labelledby="location-title"><h3 id="location-title">交接地点</h3><div id="handover-state-region">${locationStateCard(offer)}</div><form id="handover-location-form" class="handover-picker" data-draft-key="handover-place-${e(offer.id)}"><label for="handover-place">提议指定地点<select id="handover-place" name="placeId" required ${S.places.length ? '' : 'disabled'}>${placeOptions(handover.placeId)}</select></label><div class="place-preview" id="handover-place-preview">${placeDetails(placeById(handover.placeId))}</div>${S.placesError ? `<p class="places-error form-hint" data-place-load-error>交接地点暂时无法加载，请稍后重试。</p>${btn('重新加载地点', 'reload-places', 'data-place-load-retry', 'soft')}` : ''}<p class="form-hint">提议即表示你确认此地点；对方仍须确认。再次提议会清除旧地点的确认。</p>${feedback()}${btn('提议并确认此地点', 'submit', S.places.length ? '' : 'disabled')}</form></section><section class="handover-chat" aria-labelledby="messages-title"><div class="chat-head"><h3 id="messages-title">交接留言</h3><small>仅交易双方可见</small></div><div class="message-list" id="handover-messages" aria-label="双方的协商记录" tabindex="0">${handoverMessages(offer)}</div><form id="handover-message-form" class="message-compose" data-draft-key="handover-message-${e(offer.id)}"><label for="handover-message">给对方留言<textarea id="handover-message" name="text" required maxlength="500" rows="4" placeholder="例如：周六下午 2 点可以吗？我们在入口见面。" aria-describedby="handover-message-hint"></textarea></label><div class="compose-meta"><p id="handover-message-hint" class="form-hint">可以商量时间和集合点，或说明物品交接细节。</p><span class="message-count" id="handover-message-count">0 / 500</span></div>${feedback()}${btn('发送留言', 'submit')}</form></section></div><p class="handover-note">双方确认同一地点后，再按留言约定的时间见面。付款方式由双方协商。</p></section></div>`;
}
function updateMessageCount() {
  const input = $('#handover-message'), count = $('#handover-message-count');
  if (input && count) count.textContent = `${input.value.length} / 500`;
}
function updatePlacePreview() {
  const preview = $('#handover-place-preview'), select = $('#handover-place');
  if (!preview || !select) return;
  preview.innerHTML = placeDetails(placeById(select.value)); I18N.apply(preview);
}
function updateHandover(status = '', scrollToEnd = false) {
  const offer = getOffer(S.handover);
  if (offer && $('.handover-modal')) {
    const region = $('#handover-state-region'), list = $('#handover-messages');
    region.innerHTML = locationStateCard(offer); I18N.apply(region);
    const scroll = list.scrollTop, nearBottom = list.scrollHeight - list.clientHeight - scroll < 40;
    list.innerHTML = handoverMessages(offer); I18N.apply(list);
    list.scrollTop = scrollToEnd || nearBottom ? list.scrollHeight : scroll;
    if (status) $('#handover-update-status').textContent = I18N.t(status);
  }
  $$('.handover-summary').forEach(summary => { const current = getOffer(summary.dataset.id); if (current) { summary.innerHTML = handoverSummary(current); I18N.apply(summary); } });
  syncHandoverButtons();
}
const handoverPending = () => S.pending['handover-location-form'] || S.pending['handover-message-form'] || S.pending['handover-confirm'];
function syncHandoverButtons() {
  const mutation = Boolean(handoverPending()), refresh = Boolean(S.pending['handover-refresh']);
  const refreshButton = $('.handover-modal .chat-refresh'), close = $('.handover-modal .x'), confirm = $('.handover-modal [data-action="confirm-place"]');
  if (refreshButton) refreshButton.disabled = mutation || refresh;
  if (close) close.disabled = mutation;
  if (confirm) confirm.disabled = mutation || refresh;
  const locationButton = $('#handover-location-form button[type="submit"]'), messageButton = $('#handover-message-form button[type="submit"]');
  if (locationButton) locationButton.disabled = mutation || refresh || !S.places.length;
  if (messageButton) messageButton.disabled = mutation || refresh;
}
function offerCard(offer, incoming) {
  const item = offer.targetItem || {};
  const heading = incoming ? `${offer.proposer?.name || I18N.t('用户')} 想交换「${item.title || ''}」` : `你想交换「${item.title || ''}」`;
  const line = offer.type === 'cash' ? `${incoming ? '现金报价' : '你的报价为'} ${yuan(offer.cashAmount)}` : incoming ? `用「${offer.offeredItem?.title || I18N.t('一件物品')}」交换` : `你用「${offer.offeredItem?.title || I18N.t('一件物品')}」提出交换`;
  return `<article class="deal"><div><span class="status ${e(offer.status)}">${e(({ pending: '等待回应', accepted: '已同意', declined: '未同意' })[offer.status] || '')}</span><time datetime="${e(new Date(offer.createdAt).toISOString())}">${new Date(offer.createdAt).toLocaleDateString(I18N.locale)}</time></div><h3 data-user-content>${translated(heading)}</h3><p data-user-content>${translated(line)}</p>${offer.status === 'accepted' ? `<div class="handover-summary" data-id="${e(offer.id)}">${handoverSummary(offer)}</div>` : ''}${incoming && offer.status === 'pending' ? `<footer>${btn('同意', 'decision', `data-id="${e(offer.id)}" data-status="accepted"`)}<button type="button" class="button soft" data-action="decision" data-id="${e(offer.id)}" data-status="declined">婉拒</button></footer>` : ''}</article>`;
}
function trades() {
  return `<main class="page"><div class="title"><p class="kicker">每次交换，都从一句回应开始</p><h1>交易请求</h1><p>物主可在这里同意或婉拒请求；接受后，双方可在站内留言并从指定的奥克兰公共地点中协商交接。</p></div><div class="cols"><section class="pillow"><div class="row"><h2>收到的请求</h2><b class="orb">${S.offers.incoming.filter(offer => offer.status === 'pending').length}</b></div>${S.offers.incoming.map(offer => offerCard(offer, true)).join('') || '<p class="empty">暂时还没有人对你的物品发出请求。</p>'}</section><section class="pillow"><div class="row"><h2>我发出的请求</h2><b class="orb pink-orb">${S.offers.outgoing.length}</b></div>${S.offers.outgoing.map(offer => offerCard(offer, false)).join('') || `<div class="empty-state"><p>去市场挑一件喜欢的物品，发出请求吧。</p>${btn('开始挑选', 'view', 'data-view="market"', 'soft')}</div>`}</section></div></main>`;
}
function modal() {
  const item = get(S.modal);
  if (!item) { S.modal = null; return ''; }
  const choices = S.items.filter(mine);
  return `<div class="shade" data-action="close"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="offer-title" tabindex="-1"><button type="button" class="x" data-action="close" aria-label="关闭">×</button><p class="kicker">向好物发出邀请</p><h2 id="offer-title">把喜欢的带回家</h2><div class="wanted">${pic(item, 'wanted-pic')}<span><b data-user-content>${e(item.title)}</b><small data-user-content>${translated(`物主：${item.owner?.name || ''} · 参考 ${yuan(item.price)}`)}</small></span></div><div class="switch" role="group" aria-label="选择交易方式"><button type="button" aria-pressed="${S.mode === 'item'}" class="${S.mode === 'item' ? 'active' : ''}" data-action="mode" data-mode="item">拿物品交换</button><button type="button" aria-pressed="${S.mode === 'cash'}" class="${S.mode === 'cash' ? 'active' : ''}" data-action="mode" data-mode="cash">给现金报价</button></div><form id="offer-form" data-draft-key="offer-${e(S.modal)}-${S.mode}">${S.mode === 'item' ? (choices.length ? `<div class="choices">${choices.map((choice, index) => `<label><input type="radio" name="offeredItemId" value="${e(choice.id)}" ${!index ? 'checked' : ''}>${pic(choice, 'choice-pic')}<span><b data-user-content>${e(choice.title)}</b><small><span data-user-content>${e(choice.condition)}</span> · ${yuan(choice.price)}</small></span></label>`).join('')}</div>` : `<div class="empty-state"><p>先去「我的物品」发布一件可交换的物品吧。</p>${btn('发布我的物品', 'view', 'data-view="mine"', 'soft')}</div>`) : `<label class="cash">你的报价 <span>¥ <input name="cashAmount" required type="number" min="1" max="1000000" step="1" inputmode="numeric" value="${e(item.price)}"></span></label>`}<p class="modal-note">提交后，物主会在交易请求中看到你的提议。</p>${feedback()}<footer><button type="button" class="button soft" data-action="close">取消</button>${btn('发送请求', 'submit', choices.length || S.mode === 'cash' ? '' : 'disabled', choices.length || S.mode === 'cash' ? 'primary' : 'neutral')}</footer></form></section></div>`;
}
function deleteModal() {
  const item = get(S.deleteTarget);
  if (!item) { S.deleteTarget = null; return ''; }
  return `<div class="shade" data-action="close"><section class="modal confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="remove-title" tabindex="-1"><button type="button" class="x" data-action="close" aria-label="关闭">×</button><p class="kicker">管理我的物品</p><h2 id="remove-title">确认下架这件物品？</h2><p class="remove-item-name" data-user-content>${e(item.title)}</p><p>下架后将不再出现在市场中。已有请求会保留记录。</p><p class="form-feedback" role="alert" hidden></p><footer><button type="button" class="button soft" data-action="close">取消</button>${btn('确认下架', 'confirm-delete')}</footer></section></div>`;
}
function siteFooter() {
  return `<footer class="site-footer"><div class="brand">${brandMark()}</div><p>让好物继续流转，让生活多一点刚刚好。</p><small>接受交换后可在站内留言并确认指定地点，付款由双方自行安排。</small></footer>`;
}
function captureDrafts() {
  $$('form[data-draft-key]').forEach(form => {
    S.drafts[form.dataset.draftKey] = [...form.elements].filter(field => field.name && field.type !== 'file' && !['submit', 'button'].includes(field.type)).map(field => ({ name: field.name, type: field.type, value: field.value, checked: field.checked }));
  });
}
function restoreDrafts() {
  $$('form[data-draft-key]').forEach(form => {
    for (const saved of S.drafts[form.dataset.draftKey] || []) {
      for (const field of form.elements) {
        if (field.name !== saved.name) continue;
        if (['radio', 'checkbox'].includes(saved.type)) { if (field.value === saved.value) field.checked = saved.checked; }
        else field.value = saved.value;
      }
    }
  });
}
function render(capture = true) {
  if (capture) captureDrafts();
  app.innerHTML = S.user ? `<div class="site">${nav()}${S.view === 'mine' ? minePage() : S.view === 'trades' ? trades() : S.view === 'community' ? community() : market()}${siteFooter()}</div>${S.handover ? handoverModal() : S.modal ? modal() : S.deleteTarget ? deleteModal() : ''}` : auth();
  const hasDialog = Boolean($('.modal'));
  $(S.user ? '.account' : '.auth-panel').insertAdjacentHTML('afterbegin', I18N.controls());
  I18N.apply(app); restoreDrafts(); bind(); updatePlacePreview(); updateMessageCount();
  if ($('.site')) { $('.site').inert = hasDialog; if (hasDialog) $('.site').setAttribute('aria-hidden', 'true'); }
  document.body.classList.toggle('modal-open', hasDialog);
  if (hasDialog) requestAnimationFrame(() => $('.modal .x')?.focus());
  for (const form of $$('form')) if (S.pending[form.id]) markPending(form, true);
  syncHandoverButtons();
}
function updateResults() {
  const grid = $('#market-results'); if (!grid) return;
  grid.innerHTML = results(); I18N.apply(grid);
  $('#results-summary').textContent = I18N.t(`找到 ${filteredItems().length} 件好物`);
  $$('.filters button').forEach(button => { const selected = S.cat === button.dataset.cat; button.classList.toggle('active', selected); button.setAttribute('aria-pressed', selected); });
}
function bind() {
  $('#auth-form')?.addEventListener('submit', login);
  $('#item-form')?.addEventListener('submit', add);
  $('#offer-form')?.addEventListener('submit', sendOffer);
  $('#handover-location-form')?.addEventListener('submit', proposePlace);
  $('#handover-message-form')?.addEventListener('submit', sendMessage);
  $('#handover-place')?.addEventListener('change', updatePlacePreview);
  $('#handover-message')?.addEventListener('input', updateMessageCount);
  $('#image')?.addEventListener('change', image);
  $('#search')?.addEventListener('input', event => { S.q = event.target.value; updateResults(); });
  $('#sort')?.addEventListener('change', event => { S.sort = event.target.value; updateResults(); });
}
function closeDialog() {
  if (S.pending['offer-form'] || S.pending.delete || handoverPending()) return;
  S.modal = null; S.deleteTarget = null; S.handover = null; render();
  const previous = S.returnFocus;
  const match = $$('[data-action]').find(button => button.dataset.action === previous?.action && button.dataset.id === previous?.id);
  (match || $('nav .active'))?.focus(); S.returnFocus = null;
}
function navigate(view) {
  if (!pageViews.includes(view) || S.pending['offer-form'] || S.pending.delete || handoverPending()) return;
  captureDrafts(); S.view = view; S.modal = null; S.deleteTarget = null; S.handover = null;
  if (location.hash !== '#' + view) location.hash = view;
  render(false); window.scrollTo({ top: 0, behavior: 'instant' });
}
async function act(event) {
  const button = event.target.closest('[data-action]');
  if (!button || !app.contains(button) || button.disabled) return;
  const action = button.dataset.action;
  if (action === 'submit') return;
  if (action === 'language') { I18N.set(button.dataset.language); return render(); }
  if (action === 'password') { S.passwordVisible = !S.passwordVisible; $('#auth-password').type = S.passwordVisible ? 'text' : 'password'; button.textContent = I18N.t(S.passwordVisible ? '隐藏密码' : '显示密码'); button.setAttribute('aria-pressed', S.passwordVisible); return; }
  if (action === 'demo') {
    captureDrafts(); S.auth = 'login'; render(false); const name = button.dataset.account;
    $('#auth-form [name="email"]').value = `${name}@swap.local`; $('#auth-form [name="password"]').value = `${name}123`;
    $('#auth-form button[type="submit"]').focus(); return;
  }
  if (action === 'auth') { captureDrafts(); S.auth = button.dataset.mode; return render(false); }
  if (action === 'view') return navigate(button.dataset.view);
  if (action === 'place-area') {
    S.placeArea = button.dataset.area; $('#community-places').innerHTML = placeCards(); I18N.apply($('#community-places'));
    $$('.place-area-filters button').forEach(option => { option.classList.toggle('active', option.dataset.area === S.placeArea); option.setAttribute('aria-pressed', option.dataset.area === S.placeArea); }); return;
  }
  if (action === 'reload-places') {
    if (S.pending.places) return; S.pending.places = true; button.disabled = true;
    await loadPlaces();
    if ($('#community-places')) { $('#community-places').innerHTML = placeCards(); I18N.apply($('#community-places')); }
    if ($('#handover-place')) {
      const select = $('#handover-place'); const selected = select.value || handoverData(getOffer(S.handover)).placeId;
      select.innerHTML = placeOptions(selected); select.disabled = !S.places.length;
      I18N.apply(select); updatePlacePreview(); updateHandover();
      const picker = $('#handover-location-form');
      if (!S.placesError) { picker.querySelector('[data-place-load-error]')?.remove(); picker.querySelector('[data-place-load-retry]')?.remove(); }
      picker.querySelector('button[type="submit"]').disabled = !S.places.length;
    }
    delete S.pending.places; if (button.isConnected) button.disabled = false; return;
  }
  if (action === 'handover') {
    const offer = getOffer(button.dataset.id); if (!offer || offer.status !== 'accepted') return;
    S.returnFocus = { action: 'handover', id: offer.id }; S.handover = offer.id; S.modal = null; S.deleteTarget = null; S.view = 'trades'; location.hash = 'trades'; return render();
  }
  if (action === 'refresh-handover' || action === 'confirm-place') return handoverAction(action, button);
  if (action === 'cat') { S.cat = button.dataset.cat; return updateResults(); }
  if (action === 'reset') { S.q = ''; S.cat = '全部'; S.sort = 'newest'; $('#search').value = ''; $('#sort').value = 'newest'; updateResults(); $('#search').focus(); return; }
  if (action === 'jump') return $('#listing')?.scrollIntoView({ behavior: 'smooth' });
  if (action === 'remove-image') { S.preview = null; return render(); }
  if (action === 'offer' || action === 'delete') {
    S.handover = null;
    S.returnFocus = { action, id: button.dataset.id };
    if (action === 'offer') { S.modal = button.dataset.id; S.mode = 'item'; } else S.deleteTarget = button.dataset.id;
    return render();
  }
  if (action === 'close') { if (button.tagName === 'BUTTON' || event.target === button) closeDialog(); return; }
  if (action === 'mode') { if (!S.pending['offer-form']) { S.mode = button.dataset.mode; render(); } return; }
  if (handoverPending() || S.pending[action] || !['logout', 'confirm-delete', 'decision'].includes(action)) return;
  S.pending[action] = true; if (action === 'confirm-delete') S.pending.delete = true; button.disabled = true;
  try {
    if (action === 'logout') {
      await api('/api/auth/logout', { method: 'POST', body: '{}' });
      Object.assign(S, { user: null, items: [], offers: { incoming: [], outgoing: [] }, view: 'market', modal: null, deleteTarget: null, handover: null, preview: null, drafts: {}, q: '', cat: '全部', passwordVisible: false });
      history.replaceState(null, '', '#market');
      render(false); toast('已安全退出。');
    }
    if (action === 'confirm-delete') {
      await api('/api/items/' + encodeURIComponent(S.deleteTarget), { method: 'DELETE' });
      await refresh(); S.deleteTarget = null; render(); toast('物品已下架。'); $('nav .active')?.focus();
    }
    if (action === 'decision') {
      const result = await api('/api/offers/' + encodeURIComponent(button.dataset.id), { method: 'PATCH', body: JSON.stringify({ status: button.dataset.status }) });
      if (result.offer) mergeOffer(result.offer); else await refresh();
      if (button.dataset.status === 'accepted') { S.handover = button.dataset.id; S.returnFocus = { action: 'handover', id: button.dataset.id }; }
      render(); toast(button.dataset.status === 'accepted' ? '已接受交换，继续商量交接地点和时间。' : '已婉拒这次交换。');
    }
  } catch (error) {
    const panel = $('.confirm-dialog .form-feedback');
    if (action === 'confirm-delete' && panel) { panel.hidden = false; panel.textContent = I18N.t(error.message); }
    else toast(error.message, 'error');
  } finally { delete S.pending[action]; delete S.pending.delete; if (button.isConnected) button.disabled = false; }
}
async function refresh() {
  const [items, offers] = await Promise.all([api('/api/items'), api('/api/offers')]);
  S.items = items.items; S.offers = offers;
}
function markPending(form, pending) {
  form.setAttribute('aria-busy', String(pending)); const button = form.querySelector('button[type="submit"]');
  if (!button) return;
  if (pending) { if (!button.dataset.label) button.dataset.label = button.innerHTML; button.disabled = true; button.textContent = I18N.t('正在处理…'); }
  else if (button.dataset.label) { button.disabled = false; button.innerHTML = button.dataset.label; delete button.dataset.label; }
}
async function submitForm(form, operation) {
  if (S.pending[form.id]) return;
  S.pending[form.id] = true; const message = form.querySelector('.form-feedback');
  if (message) { message.hidden = true; message.textContent = ''; } markPending(form, true); syncHandoverButtons();
  try { await operation(); }
  catch (error) {
    if (error.status === 409 && form.id.startsWith('handover-')) { try { await reloadHandover(); } catch {} }
    const current = document.getElementById(form.id)?.querySelector('.form-feedback');
    if (current) { current.hidden = false; current.textContent = I18N.t(error.message); current.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    else toast(error.message, 'error');
  } finally { delete S.pending[form.id]; const current = document.getElementById(form.id); if (current) markPending(current, false); syncHandoverButtons(); }
}
async function login(event) {
  event.preventDefault(); const form = event.currentTarget, payload = Object.fromEntries(new FormData(form));
  await submitForm(form, async () => {
    S.user = (await api(S.auth === 'register' ? '/api/auth/register' : '/api/auth/login', { method: 'POST', body: JSON.stringify(payload) })).user;
    await refresh(); S.drafts = {}; S.passwordVisible = false; render(false); toast('欢迎来到 NZswap！');
  });
}
const readImage = file => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
async function image(event) {
  const input = event.currentTarget, file = input.files[0]; if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) { input.value = ''; return toast('只支持 PNG、JPG、WebP 或 GIF 图片。', 'error'); }
  if (file.size >= 3 * 1024 * 1024) { input.value = ''; return toast('图片需小于 3MB。', 'error'); }
  try {
    S.preview = await readImage(file); const preview = input.closest('.upload'); if (!preview.isConnected) return;
    preview.querySelector('span').innerHTML = `<img src="${e(S.preview)}" alt="${translated('图片预览')}">`;
    preview.querySelector('em').textContent = I18N.t('点击可替换图片'); $('.upload-actions').hidden = false;
  } catch { toast('图片读取失败，请重新选择。', 'error'); }
}
async function add(event) {
  event.preventDefault(); const form = event.currentTarget, payload = Object.fromEntries(new FormData(form));
  await submitForm(form, async () => {
    if (S.preview) payload.imageUrl = (await api('/api/uploads', { method: 'POST', body: JSON.stringify({ imageData: S.preview }) })).imageUrl;
    await api('/api/items', { method: 'POST', body: JSON.stringify(payload) });
    S.preview = null; delete S.drafts.item; form.reset(); await refresh(); render(false); toast('物品已发布到市场。');
  });
}
async function sendOffer(event) {
  event.preventDefault(); const form = event.currentTarget, payload = Object.fromEntries(new FormData(form)), target = S.modal, mode = S.mode;
  await submitForm(form, async () => {
    await api('/api/offers', { method: 'POST', body: JSON.stringify({ targetItemId: target, type: mode, ...payload }) });
    delete S.drafts[form.dataset.draftKey]; S.modal = null; await refresh(); S.view = 'trades'; location.hash = 'trades'; render(false); toast('请求已发送，等待物主回应。'); $('nav .active')?.focus();
  });
}
async function reloadHandover() {
  S.offers = await api('/api/offers'); updateHandover();
}
async function handoverAction(action, button) {
  if (handoverPending() || S.pending['handover-refresh']) return;
  const id = S.handover, key = action === 'confirm-place' ? 'handover-confirm' : 'handover-refresh';
  if (!getOffer(id)) return;
  S.pending[key] = true; button.disabled = true; syncHandoverButtons();
  const errorPanel = $('#handover-action-error'); if (errorPanel) { errorPanel.hidden = true; errorPanel.textContent = ''; }
  try {
    if (action === 'confirm-place') {
      const result = await api('/api/offers/' + encodeURIComponent(id) + '/handover', { method: 'PATCH', body: JSON.stringify({ action: 'confirm', revision: Number(button.dataset.revision) }) });
      mergeOffer(result.offer); updateHandover('已确认当前交接地点。', true);
    } else { await reloadHandover(); updateHandover('已刷新协商记录。'); }
  } catch (error) {
    if (error.status === 409) { try { await reloadHandover(); } catch {} }
    const current = $('#handover-action-error');
    if (current && S.handover === id) { current.hidden = false; current.textContent = I18N.t(error.message); } else toast(error.message, 'error');
  } finally {
    delete S.pending[key]; if (button.isConnected) button.disabled = false;
    if (S.handover === id) { updateHandover(); if (action === 'confirm-place' && !button.isConnected) $('#handover-message')?.focus(); }
    syncHandoverButtons();
  }
}
async function proposePlace(event) {
  event.preventDefault(); if (handoverPending() || S.pending['handover-refresh']) return;
  const form = event.currentTarget, id = S.handover, placeId = new FormData(form).get('placeId'), revision = handoverData(getOffer(id)).revision;
  await submitForm(form, async () => {
    const result = await api('/api/offers/' + encodeURIComponent(id) + '/handover', { method: 'PATCH', body: JSON.stringify({ action: 'propose', placeId, revision }) });
    mergeOffer(result.offer); updateHandover('地点已提议，等待对方确认。', true);
  });
}
async function sendMessage(event) {
  event.preventDefault(); if (handoverPending() || S.pending['handover-refresh']) return;
  const form = event.currentTarget, id = S.handover, originalText = form.elements.text.value, text = originalText.trim();
  await submitForm(form, async () => {
    const result = await api('/api/offers/' + encodeURIComponent(id) + '/messages', { method: 'POST', body: JSON.stringify({ text }) });
    mergeOffer(result.offer);
    const current = $('#handover-message');
    if (current && current.value === originalText) { current.value = ''; delete S.drafts[form.dataset.draftKey]; }
    updateMessageCount(); updateHandover('留言已发送。', true); current?.focus();
  });
}
app.addEventListener('click', act);
window.addEventListener('hashchange', () => {
  if (currentView() === S.view) return;
  if (S.pending['offer-form'] || S.pending.delete || handoverPending()) { history.replaceState(null, '', '#' + S.view); return; }
  navigate(currentView());
});
document.addEventListener('keydown', event => {
  const dialog = $('.modal'); if (!dialog) return;
  if (event.key === 'Escape') { event.preventDefault(); closeDialog(); return; }
  if (event.key !== 'Tab') return;
  const fields = [...dialog.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(field => !field.hidden && field.getClientRects().length);
  if (!fields.length) { event.preventDefault(); dialog.focus(); return; }
  const first = fields[0], last = fields[fields.length - 1];
  if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
});
init();
