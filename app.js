/* =========================================================
   App 中心 —— 登入 + App 入口首頁（Bento 儀表板版）
   ========================================================= */

/* ---- 登入設定（前端擋一般人用，非安全機制）---- */
const AUTH = { username: 'NCKUH', password: 'ENDO' };
// localStorage（非 sessionStorage）：App 以新分頁開啟也要讀得到登入狀態
const SESSION_KEY = 'nckuh_endo_authed';

/* ---- 統計後端（Google Apps Script Web App 的 /exec 網址）----
   設定步驟見 docs/STATS_SETUP.md。留空 = 停用統計，網站其他功能不受影響。 */
const STATS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbz0Tsxy73JrOXF9WSDmn7Q4GxEyceCnpFPOnDO0DF8rVGrJOATZDWflvQkJhu_jIsQ/exec';
const VISITOR_KEY = 'nckuh_endo_vid';

/* ---- 這台裝置的偏好（只存在這個瀏覽器，不上傳）---- */
const FAV_KEY = 'nckuh_endo_favs';            // 我的最愛：App 代號陣列（JSON），依加入順序
const HOT_KEY = 'nckuh_endo_hot';             // 上次統計的最多人用 App：統計回來前先用它排版，避免畫面跳動
const TIP_OFF_KEY = 'nckuh_endo_a2hs_tip_off'; // 「加到主畫面」提示列已關閉
const FAVHINT_OFF_KEY = 'nckuh_endo_favhint_off'; // 「怎麼用我的最愛」提示已關閉

/* ---- App 清單：之後直接在這裡增減即可 ----
   name  : App 名稱
   desc  : 一句話說明
   icon  : 圖示。填 index.html 裡線條圖示的代號（camera、poll、aid、pdf、slides、
           figure、tooth…，對應 <symbol id="i-代號">）；也可以直接填一個 emoji
   url   : 點「開啟」後前往的網址。可以是 apps/<slug>/index.html，
           也可以是完整外部網址（同一個 origin 才共用得到登入狀態）
   slug  : App 代號，統計與我的最愛用。放在 apps/ 底下可不填（會從 url 推導）；
           **外部網址的 App 一定要填**，否則瀏覽次數不會計、🆕 也判斷不到
   added : 首次上架日期 YYYY-MM-DD——**改版時不要動它**（最新上架的掛 🆕）
   updated : 最後改版日期 YYYY-MM-DD——App 出新版時改成當天（近期改版的掛 🔄）
   group : 'mobile' = 手機上就順手好用；'desktop' = 電腦操作（預設）。
           卡片上顯示成標籤，上方可依此篩選
   pwa   : true = App 自己有 manifest＋sw.js，可以單獨「加入主畫面」（卡片會標示）
   wip   : true = 施工中佔位（首頁合併成一格「N 個工具建置中」）
*/
const wipSlot = { name: '施工中', desc: '保留欄位，App 建置完成後開放。', icon: '🚧', url: '#', wip: true };
const APPS = [
  // 手機也能用
  { name: '案例標記工具', desc: '照片標記、裁切旋轉與案例組圖，一鍵匯出分享。', icon: 'camera', url: 'apps/case-marker/index.html', added: '2026-07-12', updated: '2026-11-07', group: 'mobile', pwa: true },
  { name: '即時投票', desc: '事先設定好題目，現場掃 QR 用手機作答，即時看結果。', icon: 'poll', url: 'apps/live-poll/index.html', added: '2026-08-16', updated: '2026-08-18', group: 'mobile' },
  { name: '牙外傷處置指南', desc: '依 IADT 2020 ＋ AAE 2026 查診斷與處置，中英切換、自動算回診日。', icon: 'aid', url: 'apps/dental-trauma-guide/index.html', added: '2026-09-23', updated: '2026-11-02', group: 'mobile', pwa: true },
  { name: '縮網址', desc: '把長網址變短、產生 QR code，看每個連結被點了幾次。', icon: 'qr', url: 'apps/short-link/index.html', added: '2026-11-07', group: 'mobile' },

  // 電腦操作
  { name: 'PDF工具箱', desc: '合併、分割、遮蔽個資、旋轉、加解密、浮水印與圖片轉檔，全程本機處理。', icon: 'pdf', url: 'apps/pdf-toolbox/index.html', added: '2026-07-13', updated: '2026-11-02', group: 'desktop' },
  { name: '牙髓病科專科 PPT 製作器', desc: '上傳照片 ZIP，依學會範本自動套版產出結訓／口試 PPT。', icon: 'slides', url: 'apps/endo-ppt-generator/index.html', added: '2026-07-24', updated: '2026-11-02', group: 'desktop' },
  { name: 'DentFigure 臨床組圖', desc: '把 X 光片與臨床照排成期刊等級的組圖，可標號、比例尺與遮蔽個資。', icon: 'figure', url: 'apps/dentfigure/index.html', added: '2026-09-19', updated: '2026-09-19', group: 'desktop' },
  { ...wipSlot, group: 'desktop' },
];

/* ---- 分類（卡片標籤＋上方篩選）---- */
const GROUPS = [
  {
    id: 'mobile', label: '手機', tag: '手機也能用', icon: 'phone',
    desc: '在手機上就順手好用的工具；有些還能「加入主畫面」，像一般 App 一樣點開就用、離線也打得開。',
  },
  {
    id: 'desktop', label: '電腦', tag: '電腦操作', icon: 'desktop',
    desc: '處理檔案、需要較大畫面的工具，建議在電腦上使用；所有檔案都在自己的電腦裡處理，不會上傳。',
  },
];

/* 🆕 徽章：只掛在「上架日期最新」且在這個天數內的 App */
const NEW_BADGE_DAYS = 60;
/* 🔄 徽章：改版日期在這個天數內的 App（🆕 優先，同時符合時只顯示 🆕） */
const UPDATED_BADGE_DAYS = 14;
const NEWEST_SLUG = newestSlug(); // 需在 render 之前算好（函式宣告已提升）

/* ---- 元素 ---- */
const $ = (id) => document.getElementById(id);
const loginScreen = $('loginScreen');
const loginForm   = $('loginForm');
const loginError  = $('loginError');
const portal      = $('portal');
const appGroups   = $('appGroups');
const appSearch   = $('appSearch');
const emptyHint   = $('emptyHint');
const appCount    = $('appCount');
const logoutBtn   = $('logoutBtn');
const toast       = $('toast');
const heroSub     = $('heroSub');
const viewSeg     = $('viewSeg');
const viewDesc    = $('viewDesc');
const favStrip    = $('favStrip');
const installBtn  = $('installBtn');
const installTip  = $('installTip');
const installSheet = $('installSheet');

/* ---- 畫面狀態 ---- */
let view = 'all';            // 'all' | 'mobile' | 'desktop' | 'fav'
let latestStats = null;      // 最近一次拿到的統計數字
let statsState = STATS_ENDPOINT ? 'loading' : 'off'; // 'loading' | 'ok' | 'fail' | 'off'
let deferredPrompt = null;   // Android／電腦版 Chrome 的「安裝」事件，留著給一鍵安裝用

/* ---- 小工具：localStorage 可能被擋（無痕、清除資料），一律包 try ---- */
function readPref(key) { try { return localStorage.getItem(key); } catch { return null; } }
function writePref(key, val) {
  try { if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, val); } catch {}
}

/* ---- 進入畫面判斷 ---- */
function showPortal() {
  loginScreen.hidden = true;
  portal.hidden = false;
  render();
  updateInstallUI();
}
function showLogin() {
  portal.hidden = true;
  loginScreen.hidden = false;
}

/* ---- 登入 ---- */
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const u = $('username').value.trim();
  const p = $('password').value;
  if (u === AUTH.username && p === AUTH.password) {
    localStorage.setItem(SESSION_KEY, '1');
    loginError.hidden = true;
    showPortal();
    trackLogin();
  } else {
    loginError.hidden = false;
    loginForm.classList.remove('shake');
    void loginForm.offsetWidth; // 重觸動畫
    loginForm.classList.add('shake');
  }
});

/* ---- 登出 ---- */
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  loginForm.reset();
  showLogin();
});

/* =========================================================
   畫面
   ========================================================= */

const groupOf = (app) => app.group || 'desktop';
const groupById = (id) => GROUPS.find((g) => g.id === id) || GROUPS[GROUPS.length - 1];

/* 圖示：線條圖示代號 → <svg>；其他（emoji）照原樣顯示 */
function iconKey(icon) {
  const key = String(icon || '');
  return /^[a-z][a-z0-9-]*$/.test(key) ? key : 'emoji';
}
function iconHtml(icon) {
  const key = String(icon || '');
  if (/^[a-z][a-z0-9-]*$/.test(key) && document.getElementById('i-' + key)) {
    return `<svg class="ic" aria-hidden="true"><use href="#i-${key}"/></svg>`;
  }
  return escapeHtml(key);
}
const svg = (id) => `<svg class="ic" aria-hidden="true"><use href="#i-${id}"/></svg>`;

function render() {
  const q = appSearch.value.trim().toLowerCase();
  const match = (a) => !q || a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q);
  const realAll = APPS.filter((a) => !a.wip);
  const favs = favList();

  renderSeg(realAll, favs);

  // 依篩選與搜尋挑出要顯示的
  let list = APPS.filter(match);
  if (view === 'mobile' || view === 'desktop') list = list.filter((a) => groupOf(a) === view);
  let apps = list.filter((a) => !a.wip);
  let wipCount = list.length - apps.length;
  if (view === 'fav') {
    apps = favs.map((k) => apps.find((a) => favKey(a) === k)).filter(Boolean);
    wipCount = 0;
  }

  // 篩選說明
  if (view === 'mobile' || view === 'desktop') {
    viewDesc.innerHTML = phrased(groupById(view).desc);
    viewDesc.hidden = false;
  } else if (view === 'fav') {
    viewDesc.innerHTML = phrased('常用的工具收在這裡，只存在這台裝置的這個瀏覽器。');
    viewDesc.hidden = false;
  } else {
    viewDesc.hidden = true;
  }

  renderFavStrip(view === 'all' && !q ? favs : null);

  // 便當盒：「全部」且沒在搜尋時才用主角格＋造訪格的不對稱版面，其餘一律整齊排
  const bento = view === 'all' && !q && apps.length >= 3;
  appGroups.classList.toggle('flat', !bento);
  appGroups.innerHTML = '';
  const tiles = [];
  let rest = apps;
  if (bento) {
    const feat = pickFeature(apps);
    tiles.push(makeCard(feat, { feature: true }));
    rest = apps.filter((a) => a !== feat);
    if (statsState === 'loading' || statsState === 'ok') tiles.push(makeStatTile());
  }
  rest.forEach((a) => tiles.push(makeCard(a)));
  if (wipCount) {
    const soon = makeSoonTile(wipCount);
    fillLastRow(soon, tiles.length - (bento ? 1 : 0), bento);
    tiles.push(soon);
  }
  if (view === 'fav' && !apps.length && !q) tiles.push(makeEmptyFav());
  tiles.forEach((t) => appGroups.appendChild(t));

  // 頁首說明、頁尾計數：正式 App 與施工中分開；隨搜尋過濾即時反映
  const realN = realAll.length;
  const wipN = APPS.length - realN;
  heroSub.textContent = `${realN} 個工具上線中` + (wipN ? ` · ${wipN} 個建置中` : '');
  const shownReal = list.filter((a) => !a.wip).length;
  const shownWip = list.length - shownReal;
  appCount.textContent = `共 ${shownReal} 個 App` + (shownWip ? ` · ${shownWip} 項建置中` : '') + ' · ';
  emptyHint.hidden = !(q && !apps.length && !wipCount);

  fillHits();
}

/* 上方篩選列：只建一次，之後只更新數字與選取狀態（避免按鈕重建掉焦點） */
function renderSeg(realAll, favs) {
  const counts = {
    all: realAll.length,
    mobile: realAll.filter((a) => groupOf(a) === 'mobile').length,
    desktop: realAll.filter((a) => groupOf(a) === 'desktop').length,
    fav: favs.length,
  };
  if (!viewSeg.children.length) {
    const opts = [
      { id: 'all', label: '全部' },
      ...GROUPS.map((g) => ({ id: g.id, label: g.label, icon: g.icon })),
      { id: 'fav', label: '最愛', long: '我的', icon: 'star' },
    ];
    opts.forEach((o) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.view = o.id;
      // 手機上「我的」藏起來，四顆按鈕才排得下
      b.innerHTML = `${o.icon ? svg(o.icon) : ''}<span>${o.long ? `<span class="long">${o.long}</span>` : ''}${escapeHtml(o.label)}</span><span class="n"></span>`;
      b.addEventListener('click', () => { view = o.id; render(); });
      viewSeg.appendChild(b);
    });
  }
  viewSeg.querySelectorAll('button').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.view === view));
    b.querySelector('.n').textContent = counts[b.dataset.view];
  });
}

/* 主角格：統計上最多人用的（沒有統計時用上次記住的）→ 最新上架 → 第一個 */
function pickFeature(apps) {
  const hot = currentHotSlug() || readPref(HOT_KEY);
  return apps.find((a) => slugOf(a) && slugOf(a) === hot)
      || apps.find((a) => slugOf(a) && slugOf(a) === NEWEST_SLUG)
      || apps[0];
}

/* 最後一排補滿：建置中那格往右延伸到排尾，畫面不留空洞。
   small = 主角格之外的一般磚塊數量（造訪格也算一格）。
   四欄：主角格佔左邊 2×2，右邊兩欄先吃掉 4 格，之後每排 4 格；兩欄：主角格獨佔兩排。 */
function fillLastRow(tile, small, bento) {
  let f4, f2;
  if (bento) {
    if (small >= 4) f4 = 4 - ((small - 4) % 4);
    else f4 = (4 - small) === 2 ? 2 : 1;
  } else {
    f4 = 4 - (small % 4);
  }
  f2 = 2 - (small % 2);
  tile.style.setProperty('--f4', f4);
  tile.style.setProperty('--f2', f2);
}

function makeCard(app, { feature = false } = {}) {
  const card = document.createElement('article');
  card.className = 'tile app-card' + (feature ? ' feature' : '');
  card.dataset.ic = iconKey(app.icon); // 每個 App 一個色系（styles.css 的 [data-ic]）
  card.tabIndex = 0;
  card.setAttribute('aria-label', app.name);
  const slug = slugOf(app);
  const g = groupById(groupOf(app));
  const fav = isFav(app);
  const hot = feature && currentHotSlug() === slug;

  const favBtn = `<button class="ibtn fav" type="button" data-fav="${escapeHtml(favKey(app))}"
      aria-pressed="${fav}" aria-label="${fav ? '移出我的最愛' : '加入我的最愛'}" title="${fav ? '移出我的最愛' : '加入我的最愛'}">${svg('star')}</button>`;
  const tags = `<span class="tag">${svg(g.icon)}${escapeHtml(g.tag)}</span>`
    + (app.pwa ? `<span class="tag pwa" title="打開這個工具後，可以單獨加到手機桌面">${svg('addhome')}可加入主畫面</span>` : '');
  const hits = `<div class="app-hits" data-slug="${escapeHtml(slug)}" hidden></div>`;

  if (feature) {
    card.innerHTML = `
      <div class="tile-top"><div class="app-icon">${iconHtml(app.icon)}</div>${favBtn}</div>
      ${hot ? '<span class="eyebrow">🔥 最多人用</span>' : ''}
      <div class="app-name">${escapeHtml(app.name)}${badgeFor(app)}</div>
      <p class="app-desc">${escapeHtml(app.desc)}</p>
      <div class="tile-tags">${tags}</div>
      ${hits}
      <div class="feat-acts">
        <button class="pill app-btn open" type="button">開啟 ${svg('arrow')}</button>
        <button class="pill app-btn share" type="button">${svg('share')}分享</button>
      </div>`;
  } else {
    card.innerHTML = `
      <div class="tile-top"><div class="app-icon">${iconHtml(app.icon)}</div>${favBtn}</div>
      <div class="app-name">${escapeHtml(app.name)}${badgeFor(app)}</div>
      <p class="app-desc">${escapeHtml(app.desc)}</p>
      <div class="tile-tags">${tags}</div>
      <div class="tile-foot">
        ${hits}
        <button class="ibtn app-btn share" type="button" aria-label="分享「${escapeHtml(app.name)}」" title="分享">${svg('share')}</button>
        <button class="ibtn app-btn open" type="button" aria-label="開啟「${escapeHtml(app.name)}」" title="開啟">${svg('arrow')}</button>
      </div>`;
  }

  const open = () => openApp(app);
  card.addEventListener('click', open);
  card.addEventListener('keydown', (e) => {
    if (e.target === card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(); }
  });
  card.querySelector('.open').addEventListener('click', (e) => { e.stopPropagation(); open(); });
  card.querySelector('.share').addEventListener('click', (e) => { e.stopPropagation(); shareApp(app); });
  card.querySelector('.fav').addEventListener('click', (e) => { e.stopPropagation(); toggleFav(app); });
  return card;
}

function makeStatTile() {
  const t = document.createElement('div');
  t.className = 'tile stat';
  t.id = 'statsBar';
  const v = latestStats ? Number(latestStats.visits || 0).toLocaleString('zh-Hant') : '–';
  t.innerHTML = `<span class="k">首頁造訪</span><span class="v" id="statVisits">${v}</span><span class="s">人次</span>`;
  return t;
}

function makeSoonTile(n) {
  const t = document.createElement('div');
  t.className = 'tile app-card wip';
  t.innerHTML = `
    <div class="app-icon">${svg('plus')}</div>
    <div class="app-name">${n} 個工具建置中</div>
    <p class="app-desc">完成後會出現在這裡</p>`;
  t.addEventListener('click', () => showToast('施工中，敬請期待'));
  return t;
}

function makeEmptyFav() {
  const t = document.createElement('div');
  t.className = 'tile wip empty-fav';
  t.innerHTML = `
    <div class="app-icon">${svg('star')}</div>
    <div class="app-name">還沒有最愛的工具</div>
    <p class="app-desc">點任何一張卡片右上角的 ☆，就會收進這裡。</p>`;
  return t;
}

/* =========================================================
   我的最愛（存在這台裝置的 localStorage，不上傳）
   ========================================================= */
function favKey(app) { return slugOf(app) || app.url; }
function favList() {
  let arr = [];
  try { arr = JSON.parse(readPref(FAV_KEY) || '[]'); } catch {}
  if (!Array.isArray(arr)) return [];
  // 下架的 App 自動略過
  const keys = new Set(APPS.filter((a) => !a.wip).map(favKey));
  return arr.filter((k) => keys.has(k));
}
function isFav(app) { return favList().includes(favKey(app)); }
function toggleFav(app) {
  const k = favKey(app);
  const list = favList();
  const i = list.indexOf(k);
  if (i >= 0) list.splice(i, 1); else list.push(k);
  writePref(FAV_KEY, JSON.stringify(list));
  showToast(i >= 0 ? `已把「${app.name}」移出我的最愛` : `已把「${app.name}」加入我的最愛`);
  render();
  const btn = appGroups.querySelector(`.fav[data-fav="${CSS.escape(k)}"]`);
  if (btn) btn.classList.add('pop');
}

function renderFavStrip(favs) {
  if (!favs) { favStrip.hidden = true; return; }
  favStrip.innerHTML = '';
  if (favs.length) {
    favStrip.innerHTML = `<h3>${svg('star')}我的最愛</h3><div class="fav-row"></div>`;
    const row = favStrip.querySelector('.fav-row');
    favs.forEach((k) => {
      const app = APPS.find((a) => !a.wip && favKey(a) === k);
      if (!app) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'fav-chip';
      b.dataset.ic = iconKey(app.icon);
      b.innerHTML = `<span class="app-icon">${iconHtml(app.icon)}</span>${escapeHtml(app.name)}`;
      b.addEventListener('click', () => openApp(app));
      row.appendChild(b);
    });
    favStrip.hidden = false;
  } else if (readPref(FAVHINT_OFF_KEY) !== '1') {
    favStrip.innerHTML = `<div class="fav-hint">${svg('star')}<p>${phrased('點卡片右上角的 ☆，常用的工具會排在這裡，一點就開。')}</p>
      <button class="tip-x" type="button" aria-label="不再提示">${svg('close')}</button></div>`;
    favStrip.querySelector('.tip-x').addEventListener('click', () => {
      writePref(FAVHINT_OFF_KEY, '1');
      favStrip.hidden = true;
    });
    favStrip.hidden = false;
  } else {
    favStrip.hidden = true;
  }
}

/* =========================================================
   開啟／分享
   ========================================================= */
/* App 改版後瀏覽器常常還抓到舊版（GitHub Pages 會讓瀏覽器快取一段時間）。
   網址帶上該 App 的日期，改版後就是不同的網址，一定會重新抓。
   分享出去的連結不加，保持乾淨。 */
function versionedUrl(app) {
  const v = app.updated || app.added;
  if (!v) return app.url;
  return app.url + (app.url.includes('?') ? '&' : '?') + 'v=' + encodeURIComponent(v);
}

function openApp(app) {
  if (!app.url || app.url === '#') {
    showToast(`「${app.name}」尚未設定連結`);
    return;
  }
  trackOpen(app);
  window.open(versionedUrl(app), '_blank', 'noopener');
}

/* 分享：手機上叫出系統分享選單（可直接傳 LINE），其他情況複製連結 */
function shareApp(app) {
  const link = (!app.url || app.url === '#')
    ? homeUrl()
    : new URL(app.url, location.href).href;

  if (navigator.share && isTouchDevice()) {
    navigator.share({ title: app.name, text: app.desc, url: link }).catch(() => {});
    return;
  }
  copyText(link, () => showToast(`已複製「${app.name}」連結`));
}

function copyText(text, done) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}

function fallbackCopy(text, cb) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); cb(); }
  catch { showToast('複製失敗，請手動複製'); }
  document.body.removeChild(ta);
}

/* ---- 搜尋 ---- */
appSearch.addEventListener('input', render);

/* ---- Toast ---- */
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.hidden = true; }, 250);
  }, 2200);
}

/* =========================================================
   加入主畫面
   · Android／電腦版 Chrome、Edge：攔下 beforeinstallprompt，教學框裡給「一鍵加入」
   · iPhone／iPad：沒有一鍵安裝的 API，只能教步驟（Safari 分享 → 加入主畫面）
   · LINE／Facebook／IG 內建瀏覽器不能加入主畫面，要先叫他改用瀏覽器開
   · 已經是從桌面圖示開的（standalone）就不再顯示
   ========================================================= */
const UA = navigator.userAgent;
const IS_IOS = /iPad|iPhone|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const IS_ANDROID = /Android/i.test(UA);
const IN_APP = /\bLine\//i.test(UA) ? 'LINE'
  : /FBAN|FBAV|FB_IAB/.test(UA) ? 'Facebook'
  : /Instagram/.test(UA) ? 'Instagram'
  : /MicroMessenger/i.test(UA) ? '微信'
  : null;

function isStandalone() {
  return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
}
function isTouchDevice() { return IS_IOS || IS_ANDROID; }
function homeUrl() { return location.origin + location.pathname.replace(/index\.html$/, ''); }

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  updateInstallUI();
});
window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  if (installSheet.open) installSheet.close();
  showToast('已加入！之後從桌面圖示就能直接打開');
  updateInstallUI();
});

function updateInstallUI() {
  const sa = isStandalone();
  installBtn.hidden = sa;
  installTip.hidden = sa || !isTouchDevice() || readPref(TIP_OFF_KEY) === '1';
}

function setPlatform(p) {
  installSheet.querySelectorAll('.plat-tabs [data-plat]').forEach((b) => {
    b.setAttribute('aria-selected', String(b.dataset.plat === p));
  });
  installSheet.querySelectorAll('.steps').forEach((ol) => { ol.hidden = ol.dataset.plat !== p; });
}

function openInstallSheet() {
  $('oneTapInstall').hidden = !deferredPrompt;

  $('inAppWarn').hidden = !IN_APP;
  if (IN_APP) {
    $('inAppName').textContent = IN_APP;
    // LINE 認得這個參數：網址帶 openExternalBrowser=1 就會改用手機的預設瀏覽器開
    const ext = $('openExternal');
    ext.hidden = IN_APP !== 'LINE';
    ext.href = homeUrl() + '?openExternalBrowser=1';
  }

  setPlatform(IS_IOS ? 'ios' : IS_ANDROID ? 'android' : 'desktop');

  const pwaApps = APPS.filter((a) => a.pwa && !a.wip).map((a) => `「${a.name}」`);
  const note = $('pwaAppsNote');
  note.hidden = !pwaApps.length;
  note.textContent = `個別工具也能單獨加到桌面：${pwaApps.join('')}——先打開那個工具，再照同樣步驟做。`;

  if (typeof installSheet.showModal === 'function') installSheet.showModal();
  else installSheet.setAttribute('open', '');
}
function closeInstallSheet() {
  if (typeof installSheet.close === 'function') installSheet.close();
  else installSheet.removeAttribute('open');
}

installBtn.addEventListener('click', openInstallSheet);
$('installTipGo').addEventListener('click', openInstallSheet);
$('installTipClose').addEventListener('click', () => {
  writePref(TIP_OFF_KEY, '1');
  installTip.hidden = true;
  showToast('之後可以從右上角的按鈕找到教學');
});
$('sheetClose').addEventListener('click', closeInstallSheet);
installSheet.addEventListener('click', (e) => { if (e.target === installSheet) closeInstallSheet(); }); // 點背景關閉
installSheet.querySelectorAll('.plat-tabs [data-plat]').forEach((b) => {
  b.addEventListener('click', () => setPlatform(b.dataset.plat));
});
$('copyHome').addEventListener('click', () => copyText(homeUrl(), () => showToast('已複製網址，貼到 Safari 或 Chrome 打開')));
$('oneTapInstall').addEventListener('click', async () => {
  const p = deferredPrompt;
  if (!p) return;
  deferredPrompt = null;
  $('oneTapInstall').hidden = true;
  try {
    await p.prompt();
    const r = await p.userChoice;
    if (r && r.outcome === 'accepted') closeInstallSheet();
  } catch {}
});

/* =========================================================
   使用統計（匿名計數，資料存在自己的 Google 試算表）
   ========================================================= */

/* 這台裝置的匿名記號：用來算「不重複訪客」，不含任何個資 */
function getVisitor() {
  let id = readPref(VISITOR_KEY);
  const isNew = !id;
  if (isNew) {
    id = (Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
    writePref(VISITOR_KEY, id);
  }
  return { id, isNew };
}

/* JSONP 呼叫後端（Apps Script 不支援跨網域 fetch，用 <script> 標籤取得） */
function statsCall(params) {
  return new Promise((resolve) => {
    if (!STATS_ENDPOINT) { resolve(null); return; }

    const cbName = 'nckuhStats' + Math.random().toString(36).slice(2, 10);
    const script = document.createElement('script');
    let done = false;

    const cleanup = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      delete window[cbName];
      script.remove();
    };
    const timer = setTimeout(() => { cleanup(); resolve(null); }, 8000);

    window[cbName] = (data) => { cleanup(); resolve(data); };
    script.onerror = () => { cleanup(); resolve(null); };

    const query = new URLSearchParams({ ...params, callback: cbName }).toString();
    script.src = STATS_ENDPOINT + (STATS_ENDPOINT.includes('?') ? '&' : '?') + query;
    document.head.appendChild(script);
  });
}

/* App 代號：優先用卡片上顯式的 slug 欄位（放在 apps/ 外面的 App 必填），
   沒填才從 url（apps/<slug>/index.html）推導 */
function slugOf(app) {
  if (app.slug) return app.slug;
  const m = /^apps\/([^/]+)\//.exec(app.url || '');
  return m ? m[1] : '';
}

/* 卡片徽章：🆕 最新上架 優先於 🔄 近期改版 */
function badgeFor(app) {
  if (app.wip) return '';
  if (slugOf(app) && slugOf(app) === NEWEST_SLUG) {
    return ` <span class="badge-new" title="最新上架">🆕 新上架</span>`;
  }
  const t = Date.parse(app.updated || '');
  if (!isNaN(t) && (Date.now() - t) / 86400000 <= UPDATED_BADGE_DAYS) {
    return ` <span class="badge-updated" title="近期有新版本">🔄 已更新</span>`;
  }
  return '';
}

/* 最新上架的 App 代號（超過 NEW_BADGE_DAYS 天就不再標 🆕） */
function newestSlug() {
  let slug = null;
  let newest = -Infinity;
  APPS.forEach((a) => {
    if (a.wip || !a.added) return;
    const t = Date.parse(a.added);
    if (!isNaN(t) && t > newest) { newest = t; slug = slugOf(a); }
  });
  if (!slug) return null;
  const days = (Date.now() - newest) / 86400000;
  return days <= NEW_BADGE_DAYS ? slug : null;
}

/* 統計上瀏覽次數最高的 App（還沒有統計或全是 0 → null） */
function currentHotSlug() {
  const apps = (latestStats && latestStats.apps) || {};
  let hot = null;
  let n = 0;
  Object.keys(apps).forEach((s) => { if (apps[s] > n) { n = apps[s]; hot = s; } });
  return hot;
}

function applyStats(data) {
  if (!data || data.error) {
    if (statsState === 'loading') { statsState = 'fail'; if (!portal.hidden) render(); }
    return;
  }
  latestStats = data;
  statsState = 'ok';
  const hot = currentHotSlug();
  if (hot) writePref(HOT_KEY, hot);
  if (!portal.hidden) render();
}

/* 把統計數字填進各張卡片（首頁只公開造訪人次與各 App 瀏覽次數） */
function fillHits() {
  if (!latestStats) return;
  const fmt = (n) => Number(n || 0).toLocaleString('zh-Hant');
  const apps = latestStats.apps || {};
  const hot = currentHotSlug();
  document.querySelectorAll('.app-hits').forEach((el) => {
    const slug = el.dataset.slug;
    if (!slug) return;
    const n = apps[slug] || 0;
    const isHot = slug === hot;
    if (el.closest('.feature')) {
      el.innerHTML = `<b>${fmt(n)}</b>次瀏覽`;
    } else {
      el.textContent = `${isHot ? '🔥 ' : ''}瀏覽 ${fmt(n)} 次`;
    }
    el.classList.toggle('hot', isHot);
    el.hidden = false;
  });
}

function trackVisit() {
  const v = getVisitor();
  statsCall({ event: 'visit', new: v.isNew ? '1' : '0', uid: v.id }).then(applyStats);
}
function trackLogin() {
  statsCall({ event: 'login', uid: getVisitor().id }).then((d) => { if (d) applyStats(d); });
}
function trackOpen(app) {
  const slug = slugOf(app);
  if (slug) statsCall({ event: 'open', app: slug, uid: getVisitor().id }).then((d) => { if (d) applyStats(d); });
}

/* 依標點把說明切成片語，每段不斷行——避免中文斷在詞中間（例：「打得／開」） */
function phrased(text) {
  const marks = '，。；、）」！？';
  const parts = [];
  let buf = '';
  for (const ch of String(text)) {
    buf += ch;
    if (marks.includes(ch)) { parts.push(buf); buf = ''; }
  }
  if (buf) parts.push(buf);
  return parts.map((s) => `<span class="nb">${escapeHtml(s)}</span>`).join('');
}

/* ---- 安全輸出 ---- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* ---- 啟動（放在最後：上面的 const／let 都宣告好了才呼叫，避免 TDZ）---- */
if (localStorage.getItem(SESSION_KEY) === '1') showPortal();
updateInstallUI();
trackVisit();
