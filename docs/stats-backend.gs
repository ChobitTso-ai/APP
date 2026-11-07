/**
 * NCKUH ENDO · App 中心 —— 統計後端（Google Apps Script）
 *
 * 用途：把首頁的造訪／不重複訪客／登入／各 App 開啟次數存進 Google 試算表，
 *       並回傳目前數字給首頁顯示（首頁只公開「造訪人次」）。
 *
 * 會自動維護三個工作表：
 *   總覽   給人看的儀表板（造訪／不重複／登入／各 App 次數）
 *   每日   每天一列的趨勢（日期／造訪／登入）
 *   stats  原始計數（程式讀寫用，不必手動編輯）
 *
 * 部署步驟見 docs/STATS_SETUP.md。
 *
 * 前端以 JSONP（<script> 標籤）呼叫，因此一律走 doGet：
 *   ?callback=fn                      → 只讀取目前數字
 *   ?callback=fn&event=visit&new=1    → 造訪 +1（new=1 時不重複訪客也 +1）
 *   ?callback=fn&event=login          → 登入次數 +1
 *   ?callback=fn&event=open&app=slug  → 該 App 開啟次數 +1
 *
 * 只存匿名計數，不記錄 IP、不記錄任何個人資料。
 */

const SHEET_DATA = 'stats';      // 原始計數
const SHEET_VIEW = '總覽';        // 儀表板
const SHEET_DAILY = '每日';       // 每日趨勢

/* App 代號 → 顯示名稱（新增 App 時補一行；沒對到就直接顯示代號） */
const APP_NAMES = {
  'case-marker': '案例標記工具',
  'pdf-toolbox': 'PDF工具箱',
  'endo-ppt-generator': '牙髓病科專科 PPT 製作器',
  'live-poll': '即時投票',
};

function doGet(e) {
  const params = (e && e.parameter) || {};
  let data;
  try {
    data = handleRequest(params);
  } catch (err) {
    data = { error: String(err && err.message ? err.message : err) };
  }

  const json = JSON.stringify(data);
  const callback = params.callback;

  // JSONP：包成函式呼叫，前端用 <script> 載入即可跨網域取得
  if (callback && /^[A-Za-z_$][\w$]*$/.test(callback)) {
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function handleRequest(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000); // 避免同時寫入互相蓋掉
  try {
    const sheet = getDataSheet();
    const counts = readCounts(sheet);
    const event = params.event;
    let changed = false;

    if (event === 'visit') {
      counts.visits = (counts.visits || 0) + 1;
      if (params['new'] === '1') counts.uniques = (counts.uniques || 0) + 1;
      changed = true;
    } else if (event === 'login') {
      counts.logins = (counts.logins || 0) + 1;
      changed = true;
    } else if (event === 'open' && params.app) {
      const key = 'app:' + String(params.app).replace(/[^\w-]/g, '').slice(0, 40);
      counts[key] = (counts[key] || 0) + 1;
      changed = true;
    }

    if (changed) {
      writeCounts(sheet, counts);
      bumpDaily(event);
      updateDashboard(counts);
    }
    return toPayload(counts);
  } finally {
    lock.releaseLock();
  }
}

/* ---------- 原始計數（stats 工作表）---------- */

function getDataSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_DATA);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_DATA);
    sheet.getRange(1, 1, 1, 2).setValues([['項目', '次數']]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readCounts(sheet) {
  const counts = {};
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    values.forEach(function (row) {
      if (row[0]) counts[String(row[0])] = Number(row[1]) || 0;
    });
  }
  return counts;
}

function writeCounts(sheet, counts) {
  const keys = Object.keys(counts).sort();
  if (!keys.length) return;
  const rows = keys.map(function (k) { return [k, counts[k]]; });
  sheet.getRange(2, 1, rows.length, 2).setValues(rows);
}

/* ---------- 儀表板（總覽 工作表）---------- */

function updateDashboard(counts) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_VIEW);
  const isNew = !sh;
  if (isNew) {
    sh = ss.insertSheet(SHEET_VIEW, 0); // 放在最前面，打開試算表先看到
  }

  const appKeys = Object.keys(counts).filter(function (k) { return k.indexOf('app:') === 0; }).sort();

  const rows = [];
  rows.push(['NCKUH ENDO · App 中心　使用統計', '']);
  rows.push(['最後更新', Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy/MM/dd HH:mm')]);
  rows.push(['', '']);
  rows.push(['整體', '次數']);
  rows.push(['造訪人次（首頁有公開顯示）', counts.visits || 0]);
  rows.push(['不重複訪客（約略裝置數）', counts.uniques || 0]);
  rows.push(['登入次數', counts.logins || 0]);
  rows.push(['', '']);
  rows.push(['各 App 開啟次數', '次數']);

  if (appKeys.length) {
    appKeys.forEach(function (k) {
      const slug = k.slice(4);
      rows.push([APP_NAMES[slug] || slug, counts[k]]);
    });
  } else {
    rows.push(['（尚未有人開啟 App）', 0]);
  }

  sh.clearContents();
  sh.getRange(1, 1, rows.length, 2).setValues(rows);

  // 版面：只在建立時設定一次，避免每次請求都做多餘的格式化
  if (isNew) {
    sh.setColumnWidth(1, 280);
    sh.setColumnWidth(2, 120);
    sh.getRange('A1:B1').merge();
    sh.getRange('A1').setFontSize(14).setFontWeight('bold');
    sh.getRange('A4:B4').setFontWeight('bold');
    sh.getRange('A9:B9').setFontWeight('bold');
    sh.getRange('B:B').setHorizontalAlignment('right');
    sh.setFrozenRows(2);
  }
}

/* ---------- 每日趨勢（每日 工作表）---------- */

function bumpDaily(event) {
  if (event !== 'visit' && event !== 'login') return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_DAILY);
  if (!sh) {
    sh = ss.insertSheet(SHEET_DAILY);
    sh.getRange(1, 1, 1, 3).setValues([['日期', '造訪', '登入']]);
    sh.setFrozenRows(1);
  }

  const today = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');
  const lastRow = sh.getLastRow();
  const col = event === 'visit' ? 2 : 3;

  // 日期是遞增的，今天一定是最後一列（或還沒建立）
  if (lastRow >= 2 && String(sh.getRange(lastRow, 1).getDisplayValue()) === today) {
    const cell = sh.getRange(lastRow, col);
    cell.setValue((Number(cell.getValue()) || 0) + 1);
  } else {
    const row = [today, 0, 0];
    row[col - 1] = 1;
    sh.appendRow(row);
  }
}

/* ---------- 回傳給前端 ---------- */

function toPayload(counts) {
  const apps = {};
  Object.keys(counts).forEach(function (k) {
    if (k.indexOf('app:') === 0) apps[k.slice(4)] = counts[k];
  });
  return {
    visits: counts.visits || 0,
    uniques: counts.uniques || 0,
    logins: counts.logins || 0,
    apps: apps
  };
}
