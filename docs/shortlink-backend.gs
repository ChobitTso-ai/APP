/**
 * NCKUH ENDO · App 中心 —— 縮網址後端（Google Apps Script）v1.0
 *
 * 用途：讓「縮網址」App 把「代號 → 目標網址」存進**你自己的 Google 試算表**，
 *       並記錄每個短網址被點了幾次。部署步驟見 docs/SHORTLINK_SETUP.md。
 *
 * 會自動維護兩個工作表：
 *   短網址     每個短網址一列（代號／目標網址／標題／建立者／時間／點擊次數／最後點擊）
 *              ——**也可以直接在這裡手動新增一列**，填代號與目標網址就能用
 *   點擊紀錄   每點一次一列（時間／代號），只記這兩欄，不記任何點擊者的資料
 *
 * 前端一律以 JSONP（<script> 標籤）呼叫，因此全部走 doGet（同統計與即時投票）。
 *
 * ── 安全 ───────────────────────────────────────────────────
 * ‧ 轉址（action=go）不需要任何密碼——短網址本來就是要給沒登入的人點的。
 * ‧ 建立／修改／刪除／看清單一律要「建立金鑰」（存在指令碼屬性 ADMIN_KEY，
 *   **不寫在程式碼裡、不進 repo**）。App 中心的 NCKUH/ENDO 帳密寫在公開的
 *   原始碼裡，等於公開的；若不另設金鑰，任何人都能拿本站網域做釣魚轉址。
 * ‧ 只接受 http:// 與 https:// 的目標網址（擋 javascript: 這類會在本站執行程式的網址）；
 *   轉址頁 s/index.html 也會再檢查一次。
 * ‧ 寫進試算表的文字一律加 ' 前綴當純文字存，避免「=」開頭的標題被當成公式執行，
 *   也避免 007 這種代號被轉成數字 7。
 * ‧ 金鑰連錯 30 次，15 分鐘內全部擋下（防猜）。
 */

const SHEET_LINKS  = '短網址';
const SHEET_CLICKS = '點擊紀錄';
const API_VERSION  = '1.0';
const KEY_PROP     = 'ADMIN_KEY';

const LINK_HEAD  = ['代號', '目標網址', '標題', '建立者', '建立時間', '更新時間', '點擊次數', '最後點擊'];
const CLICK_HEAD = ['時間', '代號'];
const C = { code: 0, url: 1, title: 2, by: 3, created: 4, updated: 5, clicks: 6, last: 7 }; // 0 起算的欄位

/* 代號：小寫英文、數字、連字號，1～32 字，頭尾不能是連字號 */
const CODE_RE = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;
/* 自動產生的代號：去掉容易看錯的 0/o/1/l/i，5 碼約 2,800 萬種 */
const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const CODE_LEN = 5;

const MAX_URL   = 2000;
const MAX_TITLE = 100;
const MAX_BY    = 30;
const MAX_BAD_KEY  = 30;    // 金鑰連錯幾次就暫停
const BAD_KEY_TTL  = 900;   // 暫停 15 分鐘（秒）
const MAX_LOG_SCAN = 50000; // 算「近 7 天」時最多往回看幾筆點擊紀錄

/* =========================================================
   入口
   ========================================================= */

function doGet(e) {
  const params = (e && e.parameter) || {};
  return reply(safeRoute(params), params.callback);
}

function safeRoute(params) {
  try {
    return route(params);
  } catch (err) {
    const out = { error: String(err && err.message ? err.message : err) };
    if (err && err.code) out.code = err.code;
    return out;
  }
}

function reply(data, callback) {
  const json = JSON.stringify(data);
  if (callback && /^[A-Za-z_$][\w$]*$/.test(callback)) {
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function route(params) {
  const action = String(params.action || 'ping');
  switch (action) {
    case 'ping':   return { ok: true, version: API_VERSION, ready: !!getKey() };
    case 'go':     return actionGo(params);       // 轉址（公開）：回目標網址並 +1
    case 'list':   return actionList(params);     // 清單與點擊統計（需金鑰）
    case 'create': return actionCreate(params);   // 建立（需金鑰）
    case 'update': return actionUpdate(params);   // 改目標網址／標題（需金鑰）
    case 'delete': return actionDelete(params);   // 刪除（需金鑰）
    default:       throw fail('不認得的 action：' + action, 'badaction');
  }
}

/* =========================================================
   各個動作
   ========================================================= */

/** 轉址：找到就回 { url, title } 並記一次點擊；peek=1 只看不記（預覽用）。 */
function actionGo(params) {
  const code = normCode(params.code);
  if (!code) return { notFound: true };
  const sh = linksSheet();
  const row = findRow(sh, code);
  if (row < 0) return { notFound: true };

  const r = sh.getRange(row, 1, 1, LINK_HEAD.length).getValues()[0];
  const url = String(r[C.url] || '').trim();
  if (!isHttpUrl(url)) throw fail('這個短網址的目標網址格式不正確（只接受 http/https）', 'badurl');

  const out = { url: url, title: String(r[C.title] || '') };
  if (!params.peek) countClick(sh, row, code);
  return out;
}

function actionList(params) {
  requireKey(params);
  const week = weekCounts();
  const links = readAll(linksSheet())
    .filter(function (r) { return String(r[C.code]).trim() !== ''; })
    .map(function (r) {
      const l = toLink(r);
      l.week = week[l.code] || 0;
      return l;
    });
  return { links: links, version: API_VERSION };
}

function actionCreate(params) {
  requireKey(params);
  const url   = cleanUrl(params.url);
  const title = cleanText(params.title, MAX_TITLE);
  const by    = cleanText(params.by, MAX_BY);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = linksSheet();
    const used = codeSet(sh);
    let code;
    if (params.code) {
      code = String(params.code).trim().toLowerCase();
      if (!CODE_RE.test(code)) {
        throw fail('代號只能用小寫英文、數字與連字號（1～32 個字，頭尾不能是連字號）', 'badcode');
      }
      if (used[code]) throw fail('代號「' + code + '」已經有人用了，請換一個', 'taken');
    } else {
      for (let i = 0; i < 30 && !code; i++) {
        const c = randomCode();
        if (!used[c]) code = c;
      }
      if (!code) throw fail('產生代號失敗，請再試一次');
    }

    const now = new Date();
    sh.appendRow([asText(code), asText(url), asText(title), asText(by), now, now, 0, '']);
    return { link: { code: code, url: url, title: title, by: by,
                     created: now.getTime(), updated: now.getTime(), clicks: 0, last: 0, week: 0 } };
  } finally {
    lock.releaseLock();
  }
}

function actionUpdate(params) {
  requireKey(params);
  const code = normCode(params.code);
  if (!code) throw fail('找不到這個短網址', 'notfound');
  const url   = params.url   !== undefined ? cleanUrl(params.url) : null;
  const title = params.title !== undefined ? cleanText(params.title, MAX_TITLE) : null;

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = linksSheet();
    const row = findRow(sh, code);
    if (row < 0) throw fail('找不到這個短網址（可能已被刪除）', 'notfound');
    const range = sh.getRange(row, 1, 1, LINK_HEAD.length);
    const r = range.getValues()[0];
    if (url !== null)   sh.getRange(row, C.url + 1).setValue(asText(url));
    if (title !== null) sh.getRange(row, C.title + 1).setValue(asText(title));
    const now = new Date();
    sh.getRange(row, C.updated + 1).setValue(now);
    const l = toLink(r);
    if (url !== null) l.url = url;
    if (title !== null) l.title = title;
    l.updated = now.getTime();
    l.week = weekCounts()[code] || 0;
    return { link: l };
  } finally {
    lock.releaseLock();
  }
}

function actionDelete(params) {
  requireKey(params);
  const code = normCode(params.code);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = linksSheet();
    const row = code ? findRow(sh, code) : -1;
    if (row < 0) throw fail('找不到這個短網址（可能已被刪除）', 'notfound');
    sh.deleteRow(row);
    // 點擊紀錄保留（那是歷史資料）；代號從此空出來，可以再被建立
    return { ok: true, code: code };
  } finally {
    lock.releaseLock();
  }
}

/* =========================================================
   點擊統計
   ========================================================= */

/** 點擊 +1。拿不到鎖就不記（轉址比計數重要，不能讓人卡在轉址頁）。 */
function countClick(sh, row, code) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(4000)) return;
  try {
    // 等鎖的期間可能有人刪掉別列、整列往上移，所以重新確認一次
    if (normCode(sh.getRange(row, 1).getValue()) !== code) {
      row = findRow(sh, code);
      if (row < 0) return;
    }
    const cell = sh.getRange(row, C.clicks + 1, 1, 2);
    const v = cell.getValues()[0];
    const now = new Date();
    cell.setValues([[(Number(v[0]) || 0) + 1, now]]);
    clicksSheet().appendRow([now, asText(code)]);
  } finally {
    lock.releaseLock();
  }
}

/** 近 7 天每個代號被點幾次（從「點擊紀錄」最後面往回算）。 */
function weekCounts() {
  const sh = clicksSheet();
  const last = sh.getLastRow();
  if (last < 2) return {};
  const from = Math.max(2, last - MAX_LOG_SCAN + 1);
  const vals = sh.getRange(from, 1, last - from + 1, 2).getValues();
  const since = Date.now() - 7 * 86400000;
  const out = {};
  vals.forEach(function (v) {
    if (toMs(v[0]) >= since) {
      const c = normCode(v[1]);
      if (c) out[c] = (out[c] || 0) + 1;
    }
  });
  return out;
}

/* =========================================================
   金鑰
   ========================================================= */

function getKey() {
  return PropertiesService.getScriptProperties().getProperty(KEY_PROP) || '';
}

function requireKey(params) {
  const real = getKey();
  if (!real) {
    throw fail('後端還沒設定建立金鑰：請在 Apps Script 執行一次 setup（見 docs/SHORTLINK_SETUP.md）', 'nokey');
  }
  const cache = CacheService.getScriptCache();
  const bad = Number(cache.get('badkey') || 0);
  if (bad >= MAX_BAD_KEY) throw fail('金鑰錯誤次數太多，請 15 分鐘後再試', 'locked');
  if (String(params.key || '').trim() !== real) {
    cache.put('badkey', String(bad + 1), BAD_KEY_TTL);
    throw fail('建立金鑰不正確', 'badkey');
  }
}

function makeKey() {
  let s = '';
  for (let i = 0; i < 8; i++) s += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
  return s.slice(0, 4) + '-' + s.slice(4);
}

/**
 * 第一次使用：在 Apps Script 編輯器選這個函式按 ▶ 執行。
 * 會建好兩個工作表，並產生一組建立金鑰（已經有就沿用），顯示在下方「執行記錄」。
 */
function setup() {
  linksSheet();
  clicksSheet();
  let key = getKey();
  if (!key) {
    key = makeKey();
    PropertiesService.getScriptProperties().setProperty(KEY_PROP, key);
  }
  Logger.log('建立金鑰：' + key + '　（請記下來，分享給要建立短網址的同事）');
  return key;
}

/** 忘記金鑰時執行：在「執行記錄」顯示目前的金鑰。 */
function showKey() {
  const key = getKey();
  Logger.log(key ? '建立金鑰：' + key : '還沒有金鑰，請先執行 setup');
  return key;
}

/** 金鑰外流或同事離職時執行：換一組新的，舊的立刻失效。 */
function resetKey() {
  const key = makeKey();
  PropertiesService.getScriptProperties().setProperty(KEY_PROP, key);
  Logger.log('新的建立金鑰：' + key + '　（舊金鑰已失效）');
  return key;
}

/* =========================================================
   試算表
   ========================================================= */

function linksSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_LINKS);
  if (!sh) {
    sh = ss.insertSheet(SHEET_LINKS);
    sh.appendRow(LINK_HEAD);
    sh.setFrozenRows(1);
    // 代號與網址欄設成純文字：手動在試算表輸入 007 也不會變成 7
    try { sh.getRange(1, 1, sh.getMaxRows(), 3).setNumberFormat('@'); } catch (e) { /* 格式只是保險 */ }
  }
  return sh;
}

function clicksSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_CLICKS);
  if (!sh) {
    sh = ss.insertSheet(SHEET_CLICKS);
    sh.appendRow(CLICK_HEAD);
    sh.setFrozenRows(1);
  }
  return sh;
}

function readAll(sh) {
  const n = sh.getLastRow() - 1;
  if (n <= 0) return [];
  return sh.getRange(2, 1, n, LINK_HEAD.length).getValues();
}

function codeColumn(sh) {
  const n = sh.getLastRow() - 1;
  if (n <= 0) return [];
  return sh.getRange(2, 1, n, 1).getValues().map(function (r) { return normCode(r[0]); });
}

/** 回傳列號（含標題列，從 1 起算）；找不到回 -1。代號不分大小寫。 */
function findRow(sh, code) {
  const codes = codeColumn(sh);
  for (let i = 0; i < codes.length; i++) if (codes[i] === code) return i + 2;
  return -1;
}

function codeSet(sh) {
  const set = {};
  codeColumn(sh).forEach(function (c) { if (c) set[c] = true; });
  return set;
}

function toLink(r) {
  return {
    code: normCode(r[C.code]),
    url: String(r[C.url] || '').trim(),
    title: String(r[C.title] || ''),
    by: String(r[C.by] || ''),
    created: toMs(r[C.created]),
    updated: toMs(r[C.updated]),
    clicks: Number(r[C.clicks]) || 0,
    last: toMs(r[C.last]),
  };
}

/* =========================================================
   小工具
   ========================================================= */

function fail(msg, code) {
  const e = new Error(msg);
  if (code) e.code = code;
  return e;
}

function normCode(v) {
  return String(v === undefined || v === null ? '' : v).trim().toLowerCase();
}

function isHttpUrl(s) {
  return /^https?:\/\/[^\s\/?#]+[^\s]*$/i.test(s) && !/[\u0000-\u001f\u007f]/.test(s);
}

function cleanUrl(v) {
  const s = String(v || '').trim();
  if (!s) throw fail('請填目標網址', 'badurl');
  if (s.length > MAX_URL) throw fail('網址太長（上限 ' + MAX_URL + ' 個字元）', 'badurl');
  if (!isHttpUrl(s)) throw fail('目標網址要以 http:// 或 https:// 開頭，且不能有空白', 'badurl');
  return s;
}

function cleanText(v, max) {
  return String(v || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

/** 寫進試算表當純文字：' 前綴不會出現在儲存格的值裡，但能擋住公式與自動轉型。 */
function asText(s) {
  s = String(s || '');
  return s ? "'" + s : '';
}

function toMs(v) {
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v;
  if (!v) return 0;
  const t = Date.parse(v);
  return isNaN(t) ? 0 : t;
}

function randomCode() {
  let s = '';
  for (let i = 0; i < CODE_LEN; i++) s += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
  return s;
}
