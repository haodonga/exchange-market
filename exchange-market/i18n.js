// Interface translations. User-written item titles and descriptions stay as entered.
const I18N = (() => {
  let lang = 'zh';
  try { lang = localStorage.getItem('swapbook-language') === 'en' ? 'en' : 'zh'; } catch {}
  const dictionary = {
    '欢迎来到 NZswap！': 'Welcome to NZswap!',
    '物主同意后，在站内留言并确认交接地点。': 'Once accepted, use messages here to agree on a handover place.',
    '从身边的一件闲置开始，向同一社区的人分享。先在线找到彼此需要的，接受交换后在站内留言，并从平台指定的奥克兰地点中约好交接。': 'Share something you no longer use with your community. Find what each other needs online, then use messages here to arrange a handover at one of our listed Auckland places.',
    '查看交易请求，确认物品或报价是否合适。达成一致后，在站内留言商量时间，提议指定地点并由双方确认。': 'Review the item or cash offer. Once accepted, discuss a time in messages, propose a listed place, and have both people confirm it.',
    '到双方确认的地点见面，检查物品情况，再按约定交换或付款。有变化时在站内提前留言。': 'Meet at the place you both confirmed, check the item, then exchange or pay as agreed. Send a message here if plans change.',
    '网站记录物品、交换请求和交接留言。指定地点须经双方确认，付款仍由双方自行安排。': 'The website records listings, offers and handover messages. Both people must confirm the listed place. Payment is arranged directly.',
    '物主可在这里同意或婉拒请求；接受后，双方可在站内留言并从指定的奥克兰公共地点中协商交接。': 'Accept or decline offers here. Once accepted, use messages to arrange a handover at one of the listed Auckland public places.',
    '接受交换后可在站内留言并确认指定地点，付款由双方自行安排。': 'After accepting, use messages to confirm a listed handover place. Arrange payment directly.',
    '全部区域': 'All areas', '中区': 'Central', '北岸': 'North Shore', '东区': 'East', '西区': 'West', '南区': 'South',
    '公共地点': 'Public place', '尚未选择地点': 'No place selected',
    '待选交接地点': 'Choose a handover place', '地点已确认': 'Place confirmed',
    '等待对方确认地点': 'Waiting for the other person', '请确认交接地点': 'Please confirm the place',
    '查看地图 ↗': 'Open map ↗', '地点资料 ↗': 'Place details ↗',
    '选择地点后查看地址和集合点建议。': 'Select a place to see its address and suggested meeting point.',
    '集合点建议：': 'Suggested meeting point:',
    '正在加载交接地点…': 'Loading handover places…',
    '交接地点暂时无法加载，请稍后重试。': 'Could not load handover places. Please try again.',
    '重新加载地点': 'Reload places', '这个区域暂时没有指定地点。': 'No listed places in this area yet.',
    '奥克兰 · 平台指定交接地点': 'AUCKLAND · LISTED HANDOVER PLACES',
    '在这里，把交换带到身边。': 'Bring your next swap close to home.',
    '接受交换后，可在交易请求中选定以下公园或公共地点，留言约好时间，并由双方确认同一地点。': 'After accepting a swap, choose one of these parks or public places from your offer, discuss a time in messages, and both confirm the same place.',
    '按奥克兰区域筛选': 'Filter by Auckland area',
    '地图用于查看位置，现场开放情况请查看地点资料。具体见面时间与集合点由双方在站内留言确认。': 'Use the map for directions and place details for opening information. Agree on the time and exact meeting point in messages.',
    '接受后可在站内留言，商量时间与指定地点。': 'After accepting, use messages to agree on a time and a listed place.',
    '协商交接': 'Arrange handover', '先从指定地点中提出一个建议，再与对方商量交接时间。': 'Propose one of the listed places, then discuss a handover time together.',
    '你已确认': 'You confirmed', '你待确认': 'Awaiting your confirmation',
    '对方已确认': 'Other person confirmed', '对方待确认': 'Awaiting the other person',
    '确认这个交接地点': 'Confirm this place',
    '更换地点会重新开始双方确认。地点确认不代表交接或付款已完成。': 'Changing the place resets both confirmations. Confirming a place does not mark the handover or payment as completed.',
    '请选择交接地点': 'Select a handover place', '你': 'You', '对方': 'The other person',
    '还没有留言。先选个地点，或留言商量合适的时间。': 'No messages yet. Pick a place or send a message to discuss a time.',
    '提议了交接地点': 'Proposed a handover place', '确认了交接地点': 'Confirmed the handover place',
    '把交换约在身边': 'MAKE THE HANDOVER LOCAL', '与': 'with', '协商': '',
    '刷新协商记录': 'Refresh conversation', '交接地点': 'Handover place', '提议指定地点': 'Propose a listed place',
    '提议即表示你确认此地点；对方仍须确认。再次提议会清除旧地点的确认。': 'Proposing a place also confirms it for you. The other person must still confirm. A new proposal clears earlier confirmations.',
    '提议并确认此地点': 'Propose and confirm this place', '交接留言': 'Handover messages',
    '仅交易双方可见': 'Visible only to both participants', '双方的协商记录': 'Handover conversation',
    '给对方留言': 'Message the other person',
    '例如：周六下午 2 点可以吗？我们在入口见面。': 'e.g. Would Saturday at 2 pm work? Shall we meet at the entrance?',
    '可以商量时间和集合点，或说明物品交接细节。': 'Discuss a time, an exact meeting point, or details about the handover.',
    '发送留言': 'Send message',
    '双方确认同一地点后，再按留言约定的时间见面。付款方式由双方协商。': 'Once you both confirm the same place, meet at the time agreed in messages. Agree on payment directly.',
    '已接受交换，继续商量交接地点和时间。': 'Swap accepted. Continue arranging a place and time.',
    '已确认当前交接地点。': 'You confirmed the current handover place.', '已刷新协商记录。': 'Conversation refreshed.',
    '地点已提议，等待对方确认。': 'Place proposed. Waiting for the other person to confirm.', '留言已发送。': 'Message sent.',
    '只有交易双方可以协商地点和留言。': 'Only the two participants can arrange a handover and send messages.',
    '接受请求后才能协商交易地点和留言。': 'Accept the offer before arranging a handover or sending messages.',
    '留言内容必须是文字。': 'The message must be text.', '请先填写留言内容。': 'Write a message first.',
    '留言不能超过 500 个字符。': 'Messages can contain up to 500 characters.',
    '地点操作不正确。': 'Invalid place action.', '地点版本不正确，请刷新后重试。': 'Invalid place version. Refresh and try again.',
    '交易地点已更新，请查看最新地点后重试。': 'The handover place has changed. Review the latest place and try again.',
    '请选择平台指定的交易地点。': 'Choose one of the listed handover places.', '请先提议一个交易地点。': 'Propose a handover place first.',
    '邻里交换 · 好物新生': 'LOCAL SWAPS · NEW STORIES',
    '让好物': 'Good things', '再次心动。': 'go around.',
    '邻里交换物品的卡通插画': 'Cartoon illustration of neighbors swapping everyday items',
    '书籍、相机与杯子组成的好物交换卡通插画': 'Cartoon illustration of books, a camera and a cup ready to swap',
    '让一件闲置，开启下一段日常。': 'Let something unused start a new everyday story.',
    '从一件好物开始': 'START WITH SOMETHING GOOD', '账户操作': 'Account actions',
    '隐藏密码': 'Hide password', '显示密码': 'Show password',
    '密码需为 6–128 位。请使用你自己的邮箱注册。': 'Use 6–128 characters and register with your own email address.',
    '使用注册邮箱登录，或选择下方演示账号体验。': 'Sign in with your registered email or try a demo account below.',
    '体验演示账号': 'Try a demo account',
    '点击填入账号，再按登录。演示数据为大家共享。': 'Click to fill in the account, then sign in. Demo data is shared.',
    '返回市场': 'Back to marketplace', '主导航': 'Main navigation',
    '社区交换': 'Community', '参考价': 'Reference price',
    '市场正在等第一件好物': 'The first good thing starts with you',
    '发布你想分享的闲置，让邻里的交换从这里开始。': 'List something you can share and start swapping with your neighbors.',
    '发布第一件物品': 'List the first item', '暂时没有找到': 'No matches yet', '清除筛选': 'Reset filters',
    '如何交换': 'How swapping works', '发现好物': 'Find something good',
    '按类别挑选，找到日常需要。': 'Explore categories and find what you need.',
    '提出交换': 'Make an offer', '拿物品交换，或给出现金报价。': 'Offer an item in exchange or propose a cash amount.',
    '约好交接': 'Arrange a handover', '物主同意后，双方自行安排交接。': 'Once accepted, arrange the handover together.',
    '从你的书架、厨房和生活里，找到下一次交换。': 'Your next swap could start on your shelf, in your kitchen, or in your everyday life.',
    '下一站，新主人。': 'Next stop: a new home.',
    '每一件物品，都值得被再次喜欢。': 'Every good thing deserves to be loved again.',
    '去发现，去交换': 'FIND IT. SWAP IT.', '排序': 'Sort', '物品排序': 'Sort items',
    '最新发布': 'Newest first', '价格从低到高': 'Price: low to high', '价格从高到低': 'Price: high to low',
    '按类别筛选': 'Filter by category', '少一点闲置，多一点连接': 'LESS CLUTTER. MORE CONNECTION.',
    '好物不止一段故事。': 'Good things have more stories to tell.',
    '一件读完的书，一台闲置的相机，或一只陪过你的杯子。分享你不再需要的，让它继续参与别人的生活。': 'A book you have finished, an unused camera, a familiar cup. Share what you no longer need and let it become part of someone else’s life.',
    '走进社区交换': 'Explore community swaps',
    '社区交换 · 在身边发生': 'COMMUNITY SWAPS · CLOSE TO HOME',
    '好物近一点，': 'Good things nearby.', '邻里亲一点。': 'Neighbors a little closer.',
    '从身边的一件闲置开始，向同一社区的人分享。先在线找到彼此需要的，再约好时间和地点，让交换自然地发生。': 'Start with something you no longer use and share it with your community. Find what each other needs online, then agree on a time and place to exchange.',
    '逛逛市场': 'Browse the marketplace',
    '邻居在社区分享书籍和日常物品的卡通交换场景': 'Cartoon scene of neighbors exchanging books and everyday items',
    '把闲置留给需要它的人，把新故事留在社区。': 'Pass unused things to someone who needs them. Keep the next story close to home.',
    '一起让交换更顺利': 'MAKE THE NEXT SWAP A GOOD ONE',
    '从线上心动，到线下交接。': 'From an online find to a local handover.',
    '把物品说清楚': 'Describe it honestly',
    '发布实际照片，注明使用情况和瑕疵。选一个真实的参考价，也说清楚你想交换什么。': 'Add real photos and describe wear and flaws. Give a realistic reference price and explain what you would like in exchange.',
    '先回应，再约定': 'Respond, then arrange',
    '查看交易请求，确认物品或报价是否合适。达成一致后，双方通过已有联系方式商量时间与地点。': 'Review the item or cash offer. Once you agree, use your existing contact details to arrange a time and place together.',
    '当面确认，完成交接': 'Check it at the handover',
    '选择双方方便的公共场所，检查物品情况，再按约定交换或付款。有变化时提前告知对方。': 'Meet in a convenient public place, check the item, then exchange or pay as agreed. Let the other person know if plans change.',
    '网站负责记录物品和交换请求。联系、交接与付款由双方自行安排。': 'The website records listings and offers. Contact, handover and payment are arranged directly between both people.',
    '你的第一件，就是一个新开始': 'YOUR FIRST ITEM IS A NEW BEGINNING',
    '看看家里，哪件好物可以出发？': 'What is ready for its next home?',
    '读完的书、闲置的小家电、不再使用的日常用品，都可以拥有下一位主人。': 'Finished books, unused small appliances and everyday things you no longer need can all find a new owner.',
    '整理我的交换清单': 'Start my swap collection', '我的小小交换铺': 'MY LITTLE SWAP SHOP',
    '带上清晰的实拍图和真实描述，让交换更容易开始。': 'Clear photos and honest descriptions make a good swap easier.',
    '写下尺寸、使用情况和瑕疵，最多 240 字。': 'Include size, wear and flaws, up to 240 characters.',
    '参考价方便比较，最终交换或报价由双方商量。': 'A reference price helps compare items. Agree on the final swap or amount together.',
    '添加物品照片': 'Add an item photo', '移除图片': 'Remove photo',
    '支持 JPG、PNG、WebP、GIF，图片小于 3MB。': 'JPG, PNG, WebP or GIF, smaller than 3 MB.',
    '切换页面时保留本次草稿，发布成功后清空。': 'Your draft stays when you change pages and clears after publishing.',
    '从第一件好物开始': 'Start with your first good thing',
    '每次交换，都从一句回应开始': 'EVERY SWAP STARTS WITH A RESPONSE',
    '向好物发出邀请': 'MAKE AN OFFER', '选择交易方式': 'Choose an offer type',
    '管理我的物品': 'MANAGE MY ITEMS', '确认下架这件物品？': 'Remove this listing?',
    '下架后将不再出现在市场中。已有请求会保留记录。': 'It will no longer appear in the marketplace. Existing offer records will remain.',
    '确认下架': 'Remove listing', '让好物继续流转，让生活多一点刚刚好。': 'Keep good things moving. Find what fits your everyday life.',
    '交换与付款由双方自行协商，请如实描述物品。': 'Agree on exchanges and payments directly. Describe your items honestly.',
    '正在处理…': 'Working…',
    '换物记': 'NZswap', '把喜欢的': 'Bring home', '交换': 'something ', '回来。': 'you love.',
    '发布你的闲置，遇见另一个人的刚刚好。': 'Give your unused treasures a new home. Find something just right for you.',
    '彩虹礼物盒': 'Rainbow gift box', '加入交换俱乐部': 'Join the swap club', '欢迎回来': 'Welcome back',
    '创建账户，开始让好物继续流转。': 'Create an account and give good things a second life.',
    '登录后继续你的交换旅程。': 'Sign in to continue your swapping journey.',
    '登录': 'Sign in', '注册': 'Sign up', '昵称': 'Display name', '例如：小林': 'e.g. Alex',
    '邮箱': 'Email', '密码': 'Password', '至少 6 位': 'At least 6 characters', '创建账户': 'Create account',
    '演示物主：': 'Demo accounts:', '或': 'or', '逛市场': 'Marketplace', '我的物品': 'My items',
    '交易请求': 'Offers', '退出': 'Sign out', '这是你的物品': 'Your item', '交换它': 'Make an offer',
    '好东西': 'Good things', '不该被忘记。': 'deserve a new home.',
    '用一件你愿意分享的物品，换一件真正需要的。也可以用现金报价，礼貌地问一问。': 'Swap something you can share for something you need. You can also make a cash offer.',
    '发布我的物品': 'List an item', '开始挑选': 'Explore items', '正在等待新主人': 'waiting for a new owner',
    '市场里的新发现': 'Discover your next treasure', '搜索物品或类别': 'Search items or categories',
    '全部': 'All', '数码': 'Electronics', '家居': 'Home', '书籍': 'Books', '植物': 'Plants', '服饰': 'Clothing', '其他': 'Other',
    '没有找到匹配的好物，换一个关键词试试。': 'No matching items. Try another search.',
    '我的交换清单': 'My swap collection',
    '让别人清楚地知道你的物品是什么样子，也让它更容易遇到新主人。': 'Describe your item clearly to help it find its next owner.',
    '发布一件物品': 'List a new item', '物品名称': 'Item name', '例如：手冲咖啡壶': 'e.g. Pour-over coffee pot',
    '类别': 'Category', '成色': 'Condition', '例如：九成新': 'e.g. Like new', '描述': 'Description',
    '品牌、尺寸、使用情况…': 'Brand, size, how it has been used…', '现金参考价（元）': 'Reference price (CNY)',
    '例如：120': 'e.g. 120', '图片预览': 'Image preview', '点击可替换图片': 'Click to replace image',
    '添加实拍图（可选，3MB 内）': 'Add a photo (optional, up to 3 MB)', '发布到市场': 'Publish item',
    '正在上架': 'Active listings', '你还没有上架物品。发布第一件，交换就可以开始了。': 'No items yet. List your first item to start swapping.',
    '等待回应': 'Pending', '已同意': 'Accepted', '未同意': 'Declined', '用户': 'User', '一件物品': 'an item',
    '已达成一致，请自行安排交接。': 'Offer accepted. Please arrange the handover directly.',
    '同意': 'Accept', '婉拒': 'Decline',
    '物主可在这里同意或婉拒请求；达成一致后，双方自行安排交接和付款。': 'Accept or decline offers here. Once agreed, arrange handover and payment directly.',
    '收到的请求': 'Received offers', '我发出的请求': 'Sent offers',
    '暂时还没有人对你的物品发出请求。': 'You have not received any offers yet.',
    '去市场挑一件喜欢的物品，发出请求吧。': 'Find something you like in the marketplace and make an offer.',
    '把喜欢的带回家': 'Bring home something you love', '拿物品交换': 'Swap an item', '给现金报价': 'Offer cash',
    '先去「我的物品」发布一件可交换的物品吧。': 'List an item in My items before making a swap offer.',
    '你的报价': 'Your offer', '提交后，物主会在交易请求中看到你的提议。': 'The owner will see your offer in their received offers.',
    '取消': 'Cancel', '发送请求': 'Send offer', '关闭': 'Close', '下架物品': 'Remove listing',
    '已安全退出。': 'You have signed out.', '物品已下架。': 'Item removed from the marketplace.',
    '已同意这次交换。': 'Offer accepted.', '已婉拒这次交换。': 'Offer declined.', '欢迎来到换物记！': 'Welcome to NZswap!',
    '物品已发布到市场。': 'Your item is now listed.', '请求已发送，等待物主回应。': 'Offer sent. Waiting for the owner to respond.',
    '图片读取失败，请重新选择。': 'Could not read the image. Please select it again.',
    '连接服务失败，请确认本地服务已启动，然后刷新页面。': 'Could not connect. Check that the server is running, then refresh the page.',
    '操作未完成，请稍后重试。': 'Could not complete the action. Please try again.',
    'Failed to fetch': 'Could not connect to the server. Please try again.',
    '请求内容过大，请选择小于 3MB 的图片。': 'Request too large. Choose an image smaller than 3 MB.',
    '请求格式不正确。': 'Invalid request format.', '昵称至少需要 2 个字符。': 'Display name must contain at least 2 characters.',
    '请输入有效的邮箱地址。': 'Enter a valid email address.', '密码需要 6 至 128 个字符。': 'Password must contain 6 to 128 characters.',
    '这个邮箱已经注册，请直接登录。': 'This email is already registered. Please sign in.', '邮箱或密码不正确。': 'Incorrect email or password.',
    '请先登录后再进行此操作。': 'Please sign in first.', '只支持 PNG、JPG、WebP 或 GIF 图片。': 'Only PNG, JPG, WebP and GIF images are supported.',
    '图片需小于 3MB。': 'Image must be smaller than 3 MB.',
    '请完整填写物品名称、类别、成色和描述。': 'Complete the item name, category, condition and description.',
    '请输入合理的参考价格。': 'Enter a valid reference price.', '图片地址不正确。': 'Invalid image address.',
    '找不到这件物品。': 'Item not found.', '只能下架自己的物品。': 'You can only remove your own items.',
    '这件物品还有待处理的请求，请先回应后再下架。': 'Respond to pending offers before removing this item.',
    '目标物品已下架或不存在。': 'This item is no longer available.', '不能向自己的物品发起请求。': 'You cannot make an offer on your own item.',
    '交易方式不正确。': 'Invalid offer type.', '你已经向这件物品发出过待处理的请求。': 'You already have a pending offer for this item.',
    '请选择你自己仍在上架的物品。': 'Choose one of your active listings.', '请输入合理的现金报价。': 'Enter a valid cash offer.',
    '找不到这条请求。': 'Offer not found.', '只有物主可以回应这条请求。': 'Only the item owner can respond to this offer.',
    '这条请求已被处理。': 'This offer has already been handled.', '只能同意或拒绝请求。': 'Choose accept or decline.',
    '接口不存在。': 'Endpoint not found.', '页面不存在。': 'Page not found.', '禁止访问。': 'Access denied.',
    '服务器暂时无法处理请求。': 'The server could not process this request.'
  };
  function t(text) {
    if (lang !== 'en') return text;
    const trimmed = text.trim();
    if (Object.prototype.hasOwnProperty.call(dictionary, trimmed)) return text.replace(trimmed, dictionary[trimmed]);
    const rules = [
      [/^第 (\d+) 版$/, (_, count) => `Version ${count}`],
      [/^找到 (\d+) 件好物$/, (_, count) => `${count} ${count === '1' ? 'item' : 'items'} found`],
      [/^(\d+) 件好物$/, (_, count) => `${count} items`],
      [/^(\d+) 件$/, (_, count) => `${count} items`],
      [/^物主：(.*) · 参考 (.*)$/, (_, owner, price) => `Owner: ${owner} · Reference ${price}`],
      [/^(.*) 想交换「(.*)」$/, (_, name, title) => `${name} made an offer on “${title}”`],
      [/^你想交换「(.*)」$/, (_, title) => `Your offer on “${title}”`],
      [/^现金报价 (.*)$/, (_, amount) => `Cash offer: ${amount}`],
      [/^你的报价为 (.*)$/, (_, amount) => `Your cash offer: ${amount}`],
      [/^用「(.*)」交换$/, (_, title) => `Swap for “${title}”`],
      [/^你用「(.*)」提出交换$/, (_, title) => `You offered “${title}” in exchange`]
    ];
    for (const [pattern, replace] of rules) if (pattern.test(trimmed)) return text.replace(trimmed, trimmed.replace(pattern, replace));
    return text;
  }
  function apply(root) {
    root.querySelectorAll('select option').forEach(option => {
      if (!option.hasAttribute('value')) option.value = option.textContent;
    });
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement.closest('[data-user-content],.product h3,.product p,.mini b,.wanted b,.choices b,.account>span')) continue;
      node.textContent = t(node.textContent);
    }
    root.querySelectorAll('[placeholder],[alt],[aria-label]').forEach(el => {
      if (el.closest('[data-user-content]')) return;
      for (const attr of ['placeholder','alt','aria-label']) {
        if (el.hasAttribute(attr)) el.setAttribute(attr, t(el.getAttribute(attr)));
      }
    });
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.title = lang === 'en' ? 'NZswap · Find your next treasure' : 'NZswap · 交换你真正需要的';
  }
  function controls() {
    return `<div class="language-switch" role="group" aria-label="${lang === 'en' ? 'Language' : '语言'}"><button type="button" data-action="language" data-language="zh" aria-pressed="${lang === 'zh'}">中文</button><button type="button" data-action="language" data-language="en" aria-pressed="${lang === 'en'}">English</button></div>`;
  }
  function set(value) {
    lang = value === 'en' ? 'en' : 'zh';
    try { localStorage.setItem('swapbook-language', lang); } catch {}
  }
  return { t, apply, controls, set, get lang() { return lang; }, get locale() { return lang === 'en' ? 'en-US' : 'zh-CN'; } };
})();
