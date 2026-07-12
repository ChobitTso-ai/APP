/* =========================================================
   App 中心 —— 登入 + App 入口首頁
   ========================================================= */

/* ---- 登入設定（前端擋一般人用，非安全機制）---- */
const AUTH = { username: 'NCKUH', password: 'ENDO' };
const SESSION_KEY = 'nckuh_endo_authed';

/* ---- App 清單：之後直接在這裡增減即可 ----
   name  : App 名稱
   desc  : 一句話說明
   icon  : emoji 圖示
   url   : 點「開啟」後前往的網址（先用 # 佔位）
*/
const APPS = [
  { name: '血糖控制計算', desc: '依體重與血糖值估算胰島素劑量，快速給藥參考。', icon: '🩸', url: '#' },
  { name: '甲狀腺劑量換算', desc: 'Levothyroxine 劑量與追蹤時程換算工具。', icon: '💊', url: '#' },
  { name: '衛教單張', desc: '糖尿病、甲狀腺等衛教資料，可直接分享給病人。', icon: '📄', url: '#' },
  { name: '門診預約查詢', desc: '查詢內分泌科門診時段與線上預約連結。', icon: '📅', url: '#' },
  { name: 'HbA1c 換算', desc: '糖化血色素與平均血糖互相換算。', icon: '📈', url: '#' },
  { name: 'BMI / 代謝評估', desc: '身高體重計算 BMI 與代謝症候群風險。', icon: '⚖️', url: '#' },
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

if (sessionStorage.getItem(SESSION_KEY) === '1') {
  showPortal();
}

/* ---- 登入 ---- */
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value;
  if (u === AUTH.username && p === AUTH.password) {
    sessionStorage.setItem(SESSION_KEY, '1');
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
  sessionStorage.removeItem(SESSION_KEY);
  loginForm.reset();
  showLogin();
});

/* ---- 產生 App 卡片 ---- */
function renderApps(list) {
  appGrid.innerHTML = '';
  list.forEach((app) => {
    const card = document.createElement('article');
    card.className = 'app-card';

    card.innerHTML = `
      <div class="app-icon">${app.icon}</div>
      <div class="app-name">${escapeHtml(app.name)}</div>
      <div class="app-desc">${escapeHtml(app.desc)}</div>
      <div class="app-actions">
        <button class="app-btn open" type="button">開啟</button>
        <button class="app-btn share" type="button">分享</button>
      </div>
    `;

    const open = () => openApp(app);
    card.addEventListener('click', open);
    card.querySelector('.open').addEventListener('click', (e) => { e.stopPropagation(); open(); });
    card.querySelector('.share').addEventListener('click', (e) => { e.stopPropagation(); shareApp(app); });

    appGrid.appendChild(card);
  });

  appCount.textContent = APPS.length;
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
