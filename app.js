/* =========================================================
   App 中心 —— 登入 + App 入口首頁
   ========================================================= */

/* ---- 登入設定（前端擋一般人用，非安全機制）---- */
const AUTH = { username: 'NCKUH', password: 'ENDO' };
// localStorage（非 sessionStorage）：App 以新分頁開啟也要讀得到登入狀態
const SESSION_KEY = 'nckuh_endo_authed';

/* ---- App 清單：之後直接在這裡增減即可 ----
   name  : App 名稱
   desc  : 一句話說明
   icon  : emoji 圖示
   url   : 點「開啟」後前往的網址（先用 # 佔位）
   wip   : true = 施工中佔位卡片（不顯示開啟/分享按鈕）
*/
const wipSlot = { name: '施工中', desc: '保留欄位，App 建置完成後開放。', icon: '🚧', url: '#', wip: true };
const APPS = [
  { name: '案例標記工具', desc: '照片標記、裁切旋轉與案例組圖，一鍵匯出分享。', icon: '📷', url: 'apps/case-marker/index.html' },
  { name: 'PDF工具箱', desc: 'PDF 合併與分割，全程本機處理保護隱私。', icon: '🛠️', url: 'apps/pdf-toolbox/index.html' },
  { ...wipSlot },
  { ...wipSlot },
  { ...wipSlot },
  { ...wipSlot },
];

/* ---- 元素 ---- */
const loginScreen = document.getElementById('loginScreen');
const loginForm   = document.getElementById('loginForm');
const loginError  = document.getElementById('loginError');
const portal      = document.getElementById('portal');
const appGrid     = document.getElementById('appGrid');
const appSearch   = document.getElementById('appSearch');
const emptyHint   = document.getElementById('emptyHint');
const appCount    = document.getElementById('appCount');
const logoutBtn   = document.getElementById('logoutBtn');
const toast       = document.getElementById('toast');

/* ---- 進入畫面判斷 ---- */
function showPortal() {
  loginScreen.hidden = true;
  portal.hidden = false;
  renderApps(APPS);
}
function showLogin() {
  portal.hidden = true;
  loginScreen.hidden = false;
}

if (localStorage.getItem(SESSION_KEY) === '1') {
  showPortal();
}

/* ---- 登入 ---- */
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value;
  if (u === AUTH.username && p === AUTH.password) {
    localStorage.setItem(SESSION_KEY, '1');
    loginError.hidden = true;
    showPortal();
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

/* ---- 產生 App 卡片 ---- */
function renderApps(list) {
  appGrid.innerHTML = '';
  list.forEach((app) => {
    const card = document.createElement('article');
    card.className = app.wip ? 'app-card wip' : 'app-card';

    const actions = app.wip
      ? `<div class="wip-badge">🚧 建置中，敬請期待</div>`
      : `<div class="app-actions">
          <button class="app-btn open" type="button">開啟</button>
          <button class="app-btn share" type="button">分享</button>
        </div>`;

    card.innerHTML = `
      <div class="app-icon">${app.icon}</div>
      <div class="app-name">${escapeHtml(app.name)}</div>
      <div class="app-desc">${escapeHtml(app.desc)}</div>
      ${actions}
    `;

    if (app.wip) {
      card.addEventListener('click', () => showToast('施工中，敬請期待'));
    } else {
      const open = () => openApp(app);
      card.addEventListener('click', open);
      card.querySelector('.open').addEventListener('click', (e) => { e.stopPropagation(); open(); });
      card.querySelector('.share').addEventListener('click', (e) => { e.stopPropagation(); shareApp(app); });
    }

    appGrid.appendChild(card);
  });

  // 頁尾計數：正式 App 與施工中分開；隨搜尋過濾即時反映
  const real = list.filter((a) => !a.wip).length;
  const building = list.length - real;
  appCount.textContent = `共 ${real} 個 App` + (building ? ` · ${building} 項建置中` : '') + ' · ';
  emptyHint.hidden = list.length !== 0;
}

/* ---- 開啟 App ---- */
function openApp(app) {
  if (!app.url || app.url === '#') {
    showToast(`「${app.name}」尚未設定連結`);
    return;
  }
  window.open(app.url, '_blank', 'noopener');
}

/* ---- 分享 App（複製連結）---- */
function shareApp(app) {
  const link = (!app.url || app.url === '#')
    ? location.href
    : new URL(app.url, location.href).href;

  const done = () => showToast(`已複製「${app.name}」連結`);
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(link).then(done).catch(() => fallbackCopy(link, done));
  } else {
    fallbackCopy(link, done);
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
appSearch.addEventListener('input', () => {
  const q = appSearch.value.trim().toLowerCase();
  const filtered = APPS.filter((a) =>
    a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)
  );
  renderApps(filtered);
});

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

/* ---- 安全輸出 ---- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
