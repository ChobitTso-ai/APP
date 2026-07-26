/**
 * NCKUH ENDO · App 中心 —— 統計後端（Google Apps Script）
 *
 * 用途：把首頁的造訪／不重複訪客／登入／各 App 開啟次數存進 Google 試算表，
 *       並回傳目前數字給首頁顯示。
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

const SHEET_NAME = 'stats';

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
    const sheet = getStatsSheet();
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

    if (changed) writeCounts(sheet, counts);
    return toPayload(counts);
  } finally {
    lock.releaseLock();
  }
}

function getStatsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, 3).setValues([['項目', '次數', '最後更新']]);
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
  sheet.getRange(2, 3).setValue(new Date()); // 最後更新時間
}

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
