/**
 * NCKUH ENDO · App 中心 —— 即時投票後端（Google Apps Script）
 *
 * 用途：讓「即時投票」App 把題目與作答結果存進**你自己的 Google 試算表**。
 *       主持人在 App 裡建立投票 → 產生 6 位數 PIN → 觀眾用手機掃 QR 作答 →
 *       主持人看即時結果。全部資料都在你的 Google Drive，不經過任何第三方。
 *
 * 會自動維護三個工作表：
 *   投票       每一場投票一列（PIN／標題／狀態／管理碼／設定與題目）
 *   作答紀錄   每人每題一列（可直接看、可自行篩選排序）
 *   結果彙總   按下「結束並封存」時寫入的人類可讀結果
 *
 * 部署步驟見 docs/VOTING_SETUP.md。
 *
 * 前端一律以 JSONP（<script> 標籤）呼叫，因此全部走 doGet；
 * 題目較長時前端會先把 JSON 切塊上傳（action=up）再送出正式請求。
 *
 * ── 隱私與安全 ─────────────────────────────────────────────
 * ‧ 觀眾端不需要登入，所以「PIN 就是唯一的門檻」——這個工具只適合
 *   教學問答與一般意見調查，**不要拿來投任何個資或敏感內容**。
 * ‧ 讀取結果、修改題目一律需要「管理碼」，光有 PIN 看不到結果。
 * ‧ 匿名模式不會存任何暱稱；裝置代號只是隨機字串，用來防止重複投票。
 * ‧ 計分題的正確答案**不會下發給觀眾端**，評分在這裡（伺服器）做，
 *   避免看網頁原始碼就知道答案。
 */

const SHEET_POLLS   = '投票';
const SHEET_VOTES   = '作答紀錄';
const SHEET_SUMMARY = '結果彙總';

const CACHE_TTL   = 21600; // 快取 6 小時（Apps Script 上限）
const UPLOAD_TTL  = 600;   // 切塊上傳的暫存 10 分鐘
const API_VERSION = '1.0';

const MAX_TEXTS   = 300;   // 每題文字答案在快取中最多留幾筆（試算表永遠是完整的）

/* =========================================================
   入口
   ========================================================= */

function doGet(e) {
  const params = (e && e.parameter) || {};
  return reply(safeRoute(params), params.callback);
}

function doPost(e) {
  const params = (e && e.parameter) || {};
  // 若有 POST body（JSON）就併進參數，讓未來的客戶端也能用 POST
  try {
    if (e && e.postData && e.postData.contents) {
      const body = JSON.parse(e.postData.contents);
      Object.keys(body).forEach(function (k) {
        params[k] = typeof body[k] === 'string' ? body[k] : JSON.stringify(body[k]);
      });
    }
  } catch (err) { /* body 不是 JSON 就忽略，照參數處理 */ }
  return reply(safeRoute(params), params.callback);
}

function safeRoute(params) {
  try {
    return route(params);
  } catch (err) {
    return { error: String(err && err.message ? err.message : err) };
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

/* =========================================================
   路由
   ========================================================= */

function route(params) {
  const action = String(params.action || 'ping');

  switch (action) {
    case 'ping':    return { ok: true, version: API_VERSION };
    case 'up':      return actionUpload(params);       // 切塊上傳一段 JSON
    case 'create':  return actionCreate(params);       // 建立投票 → 回 PIN + 管理碼
    case 'update':  return actionUpdate(params);       // 改題目（需管理碼）
    case 'get':     return actionGet(params);          // 觀眾取題（不含正確答案）
    case 'submit':  return actionSubmit(params);       // 觀眾送出作答
    case 'results': return actionResults(params);      // 主持人看結果（需管理碼）
    case 'close':   return actionClose(params, true);  // 結束並封存（需管理碼）
    case 'reopen':  return actionClose(params, false); // 重新開放（需管理碼）
    default:        throw new Error('不認得的 action：' + action);
  }
}

/* =========================================================
   切塊上傳（題目 JSON 可能很長，GET 網址塞不下）
   ========================================================= */

function actionUpload(params) {
  const id = requireStr(params.id, 'id');
  const i  = Number(params.i);
  if (!(i >= 0)) throw new Error('切塊序號不正確');
  CacheService.getScriptCache().put('up_' + id + '_' + i, String(params.d || ''), UPLOAD_TTL);
  return { ok: true, i: i };
}

/** 取出這次請求的資料：直接放在 p 參數，或先切塊上傳（up=<id>&upn=<塊數>）。 */
function getPayload(params) {
  let raw;
  if (params.up) {
    const id = String(params.up);
    const n  = Number(params.upn) || 0;
    const cache = CacheService.getScriptCache();
    const keys = [];
    for (let i = 0; i < n; i++) keys.push('up_' + id + '_' + i);
    const got = cache.getAll(keys);
    const parts = [];
    for (let i = 0; i < n; i++) {
      const v = got['up_' + id + '_' + i];
      if (v === null || v === undefined) throw new Error('上傳的資料過期了，請再送出一次');
      parts.push(v);
    }
    cache.removeAll(keys);
    raw = parts.join('');
  } else {
    raw = String(params.p || '');
  }
  if (!raw) return {};
  return JSON.parse(raw);
}

/* =========================================================
   建立 / 修改投票
   ========================================================= */

function actionCreate(params) {
  const data = getPayload(params);
  const questions = normalizeQuestions(data.questions);
  if (!questions.length) throw new Error('至少要有一題');

  const title  = String(data.title || '未命名投票').slice(0, 200);
  const config = normalizeConfig(data.config);

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = pollsSheet();
    const pin = newPin(sheet);
    const key = newKey();
    sheet.appendRow([
      pin,
      new Date(),
      title,
      '進行中',
      key,
      0,
      JSON.stringify(config),
      JSON.stringify(questions),
    ]);
    cacheDrop(pin);
    return { ok: true, pin: pin, key: key, title: title };
  } finally {
    lock.releaseLock();
  }
}

function actionUpdate(params) {
  const data = getPayload(params);
  const pin  = requirePin(params.pin || data.pin);
  const row  = findPollRow(pin);
  requireKey(row, params.key || data.key);

  const questions = normalizeQuestions(data.questions);
  if (!questions.length) throw new Error('至少要有一題');
  const title  = String(data.title || row.title).slice(0, 200);
  const config = normalizeConfig(data.config);

  const sheet = pollsSheet();
  sheet.getRange(row.rowIndex, 3).setValue(title);
  sheet.getRange(row.rowIndex, 7).setValue(JSON.stringify(config));
  sheet.getRange(row.rowIndex, 8).setValue(JSON.stringify(questions));
  cacheDrop(pin);
  return { ok: true, pin: pin, title: title };
}

/* =========================================================
   觀眾：取題目
   ========================================================= */

function actionGet(params) {
  const pin = requirePin(params.pin);
  const row = findPollRow(pin);
  return {
    ok: true,
    pin: pin,
    title: row.title,
    status: row.status,
    config: row.config,
    // 正確答案在這裡被拔掉，觀眾端拿不到（看原始碼也偷不到答案）
    questions: row.questions.map(stripAnswer),
  };
}

function stripAnswer(q) {
  const out = {};
  Object.keys(q).forEach(function (k) {
    if (k !== 'answer') out[k] = q[k];
  });
  return out;
}

/* =========================================================
   觀眾：送出作答
   ========================================================= */

function actionSubmit(params) {
  const data = getPayload(params);
  const pin  = requirePin(params.pin || data.pin);
  const row  = findPollRow(pin);

  if (row.status !== '進行中') throw new Error('這場投票已經結束了');

  const config    = row.config;
  const questions = row.questions;
  const answers   = Array.isArray(data.answers) ? data.answers : [];
  const elapsed   = Array.isArray(data.elapsed) ? data.elapsed : [];
  const token     = String(data.token || '').slice(0, 40) || ('anon-' + Utilities.getUuid().slice(0, 8));
  const nickname  = config.named ? String(data.nickname || '').trim().slice(0, 40) : '';

  if (config.named && !nickname) throw new Error('這場投票需要填暱稱');

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const agg = loadAgg(pin, row);

    // 重複投票不算錯誤（前端要用不同的畫面處理），所以不放 error 欄位
    if (config.onceOnly && agg.voters.hasOwnProperty(token)) {
      return { ok: false, duplicate: true, message: '這台裝置已經投過這場投票了' };
    }

    const now = new Date();
    const rows = [];
    const detail = [];
    let total = 0;
    let maxTotal = 0;

    for (let i = 0; i < questions.length; i++) {
      const q   = questions[i];
      const ans = answers[i];
      const g   = grade(q, ans, config, elapsed[i]);

      total    += g.score;
      maxTotal += g.max;

      rows.push([
        now,
        pin,
        row.title,
        token,
        nickname || '（匿名）',
        i + 1,
        q.text,
        answerLabel(q, ans),
        g.correct === null ? '' : (g.correct ? '✔ 正確' : '✘ 錯誤'),
        g.max ? g.score : '',
        JSON.stringify(ans === undefined ? null : ans),
      ]);

      detail.push({ correct: g.correct, score: g.score, max: g.max, answer: q.answer === undefined ? null : q.answer });
      tally(agg, i, q, ans);
    }

    // 一次寫入（比逐列 appendRow 快很多）
    const votes = votesSheet();
    votes.getRange(votes.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);

    agg.voters[token] = nickname || '（匿名）';
    agg.n = Object.keys(agg.voters).length;
    if (maxTotal > 0) {
      agg.board.push({ name: nickname || '（匿名）', token: token, score: total, max: maxTotal });
    }
    saveAgg(pin, agg);

    pollsSheet().getRange(row.rowIndex, 6).setValue(agg.n);

    const out = { ok: true, count: agg.n };
    if (maxTotal > 0) {
      out.score = total;
      out.max = maxTotal;
      out.detail = detail;
    }
    if (config.showResult === 'after') out.results = summarize(row, agg);
    return out;
  } finally {
    lock.releaseLock();
  }
}

/* =========================================================
   主持人：結果 / 結束
   ========================================================= */

function actionResults(params) {
  const pin = requirePin(params.pin);
  const row = findPollRow(pin);
  requireKey(row, params.key);
  const agg = loadAgg(pin, row);
  const out = summarize(row, agg);
  out.ok = true;
  out.pin = pin;
  out.title = row.title;
  out.status = row.status;
  out.config = row.config;
  out.questions = row.questions; // 主持人看得到正確答案
  return out;
}

function actionClose(params, close) {
  const pin = requirePin(params.pin);
  const row = findPollRow(pin);
  requireKey(row, params.key);
  pollsSheet().getRange(row.rowIndex, 4).setValue(close ? '已結束' : '進行中');
  cacheDropRow(pin);
  if (close) writeSummary(row, loadAgg(pin, row));
  return { ok: true, status: close ? '已結束' : '進行中' };
}

/**
 * 把彙總結果整理成前端要畫的形狀。
 * 注意：彙總放在 stat，不要叫 questions——actionResults 還要另外回傳
 * 「題目定義」給主持人（含正確答案），兩個同名會互相蓋掉。
 */
function summarize(row, agg) {
  const board = agg.board.slice().sort(function (a, b) { return b.score - a.score; }).slice(0, 20);
  return {
    count: agg.n,
    stat: row.questions.map(function (q, i) {
      const a = agg.q[i] || emptyQAgg();
      const item = { type: q.type, text: q.text, counts: a.counts, answered: a.answered };
      if (q.type === 'scale') item.average = a.cnt ? Math.round((a.sum / a.cnt) * 100) / 100 : null;
      if (q.type === 'text')  item.texts = a.texts;
      return item;
    }),
    leaderboard: board,
  };
}

/* =========================================================
   評分（在伺服器做，觀眾端拿不到答案）
   ========================================================= */

function grade(q, ans, config, elapsedSec) {
  const noScore = { correct: null, score: 0, max: 0 };
  if (config.scoring === 'none') return noScore;
  if (q.type === 'text' || q.type === 'scale') return noScore;
  if (q.answer === null || q.answer === undefined || q.answer === '') return noScore;

  const pts = Number(q.points) > 0 ? Number(q.points) : 10;
  const ok  = isCorrect(q, ans);
  if (!ok) return { correct: false, score: 0, max: pts };

  // 答對＋速度：六成是答對分，四成照剩餘時間給
  const limit = Number(config.timeLimit) || 0;
  if (config.scoring === 'speed' && limit > 0) {
    const used  = Math.max(0, Math.min(limit, Number(elapsedSec) || limit));
    const bonus = pts * 0.4 * (1 - used / limit);
    return { correct: true, score: Math.round(pts * 0.6 + bonus), max: pts };
  }
  return { correct: true, score: pts, max: pts };
}

function isCorrect(q, ans) {
  if (q.type === 'multi') {
    const a = toIndexList(ans);
    const b = toIndexList(q.answer);
    if (a.length !== b.length || !a.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  if (ans === null || ans === undefined || ans === '') return false;
  return Number(ans) === Number(q.answer);
}

function toIndexList(v) {
  if (!Array.isArray(v)) return [];
  return v.map(Number).filter(function (n) { return !isNaN(n); })
          .sort(function (x, y) { return x - y; });
}

/* =========================================================
   即時彙總（存 CacheService，試算表才是永久紀錄）
   ========================================================= */

function emptyQAgg() {
  return { counts: {}, sum: 0, cnt: 0, answered: 0, texts: [] };
}

function tally(agg, i, q, ans) {
  if (!agg.q[i]) agg.q[i] = emptyQAgg();
  const a = agg.q[i];
  if (ans === null || ans === undefined || ans === '') return;
  a.answered++;

  if (q.type === 'multi') {
    toIndexList(ans).forEach(function (idx) {
      a.counts[idx] = (a.counts[idx] || 0) + 1;
    });
  } else if (q.type === 'text') {
    if (a.texts.length < MAX_TEXTS) a.texts.push(String(ans).slice(0, 500));
  } else {
    const k = String(ans);
    a.counts[k] = (a.counts[k] || 0) + 1;
    if (q.type === 'scale') { a.sum += Number(ans) || 0; a.cnt++; }
  }
}

function loadAgg(pin, row) {
  const cached = CacheService.getScriptCache().get('agg_' + pin);
  if (cached) {
    try { return JSON.parse(cached); } catch (err) { /* 壞掉就重建 */ }
  }
  return rebuildAgg(pin, row);
}

function saveAgg(pin, agg) {
  try {
    CacheService.getScriptCache().put('agg_' + pin, JSON.stringify(agg), CACHE_TTL);
  } catch (err) {
    // 超過快取單筆上限（100KB）就不快取，下次從試算表重建，功能不受影響
  }
}

/** 快取不在時（例如 Apps Script 重啟）從「作答紀錄」重建彙總。 */
function rebuildAgg(pin, row) {
  const agg = { n: 0, voters: {}, q: [], board: [] };
  const sheet = votesSheet();
  const last = sheet.getLastRow();
  if (last < 2) return agg;

  const values = sheet.getRange(2, 1, last - 1, 11).getValues();
  const scores = {}; // token → {score, max, name}

  for (let r = 0; r < values.length; r++) {
    const v = values[r];
    if (String(v[1]) !== String(pin)) continue;

    const token = String(v[3]);
    const name  = String(v[4]);
    const qi    = Number(v[5]) - 1;
    const q     = row.questions[qi];
    if (!q) continue;

    let ans = null;
    try { ans = JSON.parse(v[10]); } catch (err) { ans = v[7]; }
    tally(agg, qi, q, ans);

    agg.voters[token] = name;
    if (!scores[token]) scores[token] = { name: name, token: token, score: 0, max: 0 };
    scores[token].score += Number(v[9]) || 0;
    if (v[8] !== '') scores[token].max += Number(q.points) > 0 ? Number(q.points) : 10;
  }

  agg.n = Object.keys(agg.voters).length;
  Object.keys(scores).forEach(function (t) {
    if (scores[t].max > 0) agg.board.push(scores[t]);
  });
  saveAgg(pin, agg);
  return agg;
}

/* =========================================================
   結果彙總工作表（按「結束並封存」時寫入，給人看的）
   ========================================================= */

function writeSummary(row, agg) {
  const sheet = summarySheet();
  const out = [];
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');

  out.push(['━━━ ' + row.title + ' ━━━', 'PIN ' + row.pin, '封存於 ' + stamp, '回覆 ' + agg.n + ' 人']);
  out.push(['題號', '題目', '選項／答案', '票數']);

  row.questions.forEach(function (q, i) {
    const a = agg.q[i] || emptyQAgg();
    if (q.type === 'text') {
      const texts = a.texts || [];
      if (!texts.length) out.push([i + 1, q.text, '（無人作答）', '']);
      texts.forEach(function (t, k) { out.push([k === 0 ? i + 1 : '', k === 0 ? q.text : '', t, '']); });
      return;
    }
    const labels = optionLabels(q);
    labels.forEach(function (label, k) {
      const mark = isAnswerIndex(q, k) ? '★ ' : '';
      out.push([k === 0 ? i + 1 : '', k === 0 ? q.text : '', mark + label, a.counts[String(k)] || 0]);
    });
    if (q.type === 'scale') {
      out.push(['', '', '平均', a.cnt ? Math.round((a.sum / a.cnt) * 100) / 100 : '']);
    }
  });

  if (agg.board.length) {
    const board = agg.board.slice().sort(function (x, y) { return y.score - x.score; });
    out.push(['', '', '', '']);
    out.push(['排名', '參與者', '得分', '滿分']);
    board.forEach(function (b, i) { out.push([i + 1, b.name, b.score, b.max]); });
  }
  out.push(['', '', '', '']);

  sheet.getRange(sheet.getLastRow() + 1, 1, out.length, 4).setValues(out);
}

function optionLabels(q) {
  if (q.type === 'scale') {
    const min = Number(q.scaleMin) || 1;
    const max = Number(q.scaleMax) || 5;
    const list = [];
    for (let v = min; v <= max; v++) list.push(String(v));
    return list;
  }
  return (q.options || []).map(String);
}

function isAnswerIndex(q, k) {
  if (q.answer === null || q.answer === undefined || q.answer === '') return false;
  if (q.type === 'multi') return toIndexList(q.answer).indexOf(k) !== -1;
  if (q.type === 'scale') return false;
  return Number(q.answer) === k;
}

function answerLabel(q, ans) {
  if (ans === null || ans === undefined || ans === '') return '（未作答）';
  if (q.type === 'text' || q.type === 'scale') return String(ans);
  if (q.type === 'multi') {
    const list = toIndexList(ans);
    if (!list.length) return '（未作答）';
    return list.map(function (i) { return optionText(q, i); }).join('、');
  }
  return optionText(q, ans);
}

function optionText(q, i) {
  const opts = q.options || [];
  const n = Number(i);
  return opts[n] !== undefined ? String(opts[n]) : ('選項 ' + (n + 1));
}

/* =========================================================
   投票資料的讀寫
   ========================================================= */

function findPollRow(pin) {
  const cached = CacheService.getScriptCache().get('row_' + pin);
  if (cached) {
    try { return JSON.parse(cached); } catch (err) { /* 壞掉就重讀 */ }
  }
  const sheet = pollsSheet();
  const last = sheet.getLastRow();
  if (last < 2) throw new Error('找不到這組 PIN：' + pin);

  const values = sheet.getRange(2, 1, last - 1, 8).getValues();
  for (let r = 0; r < values.length; r++) {
    if (String(values[r][0]) !== String(pin)) continue;
    const row = {
      rowIndex: r + 2,
      pin: String(values[r][0]),
      title: String(values[r][2]),
      status: String(values[r][3]),
      key: String(values[r][4]),
      config: parseJson(values[r][6], {}),
      questions: parseJson(values[r][7], []),
    };
    row.config = normalizeConfig(row.config);
    CacheService.getScriptCache().put('row_' + pin, JSON.stringify(row), CACHE_TTL);
    return row;
  }
  throw new Error('找不到這組 PIN：' + pin);
}

function cacheDropRow(pin) { CacheService.getScriptCache().remove('row_' + pin); }
function cacheDrop(pin) {
  const cache = CacheService.getScriptCache();
  cache.remove('row_' + pin);
  cache.remove('agg_' + pin);
}

function newPin(sheet) {
  const used = {};
  const last = sheet.getLastRow();
  if (last >= 2) {
    sheet.getRange(2, 1, last - 1, 1).getValues().forEach(function (r) { used[String(r[0])] = true; });
  }
  for (let i = 0; i < 200; i++) {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    if (!used[pin]) return pin;
  }
  throw new Error('產生 PIN 失敗，請把「投票」工作表裡用不到的舊場次刪掉');
}

/** 管理碼：去掉容易看錯的 0/O/1/I，方便手抄。 */
function newKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

function requireKey(row, key) {
  if (!key || String(key).toUpperCase().trim() !== String(row.key).toUpperCase().trim()) {
    throw new Error('管理碼不正確，看不到這場投票的結果');
  }
}

function requirePin(pin) {
  const s = String(pin || '').trim();
  if (!/^\d{6}$/.test(s)) throw new Error('PIN 要是 6 位數字');
  return s;
}

function requireStr(v, name) {
  const s = String(v || '').trim();
  if (!s) throw new Error('缺少參數：' + name);
  return s;
}

function parseJson(v, fallback) {
  try { return JSON.parse(v); } catch (err) { return fallback; }
}

/* =========================================================
   資料整理（前端傳什麼都不能弄壞後端）
   ========================================================= */

function normalizeConfig(c) {
  c = c || {};
  const scoring = ['none', 'correct', 'speed'].indexOf(c.scoring) !== -1 ? c.scoring : 'none';
  return {
    named: !!c.named,
    onceOnly: c.onceOnly !== false,
    scoring: scoring,
    showResult: c.showResult === 'never' ? 'never' : 'after',
    timeLimit: Math.max(0, Math.min(600, Number(c.timeLimit) || 0)),
  };
}

const TYPES = ['single', 'truefalse', 'multi', 'scale', 'text'];

function normalizeQuestions(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 100).map(function (q) {
    q = q || {};
    const type = TYPES.indexOf(q.type) !== -1 ? q.type : 'single';
    const out = {
      type: type,
      text: String(q.text || '').slice(0, 500),
      points: Math.max(0, Math.min(1000, Number(q.points) || 10)),
    };

    if (type === 'truefalse') {
      out.options = ['是', '否'];
    } else if (type === 'single' || type === 'multi') {
      out.options = (Array.isArray(q.options) ? q.options : [])
        .slice(0, 10).map(function (o) { return String(o || '').slice(0, 200); });
    } else if (type === 'scale') {
      out.scaleMin = Math.max(0, Math.min(9, Number(q.scaleMin) || 1));
      out.scaleMax = Math.max(out.scaleMin + 1, Math.min(10, Number(q.scaleMax) || 5));
      out.scaleMinLabel = String(q.scaleMinLabel || '').slice(0, 40);
      out.scaleMaxLabel = String(q.scaleMaxLabel || '').slice(0, 40);
      out.options = optionLabels(out);
    }

    if (type === 'multi') {
      const a = toIndexList(q.answer);
      if (a.length) out.answer = a;
    } else if (type === 'single' || type === 'truefalse') {
      if (q.answer !== null && q.answer !== undefined && q.answer !== '') out.answer = Number(q.answer);
    }
    return out;
  }).filter(function (q) { return q.text; });
}

/* =========================================================
   工作表
   ========================================================= */

function pollsSheet() {
  return ensureSheet(SHEET_POLLS,
    ['PIN', '建立時間', '標題', '狀態', '管理碼', '回覆人數', '設定JSON', '題目JSON'],
    [90, 150, 300, 80, 90, 90, 260, 420]);
}

function votesSheet() {
  return ensureSheet(SHEET_VOTES,
    ['時間', 'PIN', '投票標題', '裝置代號', '暱稱', '題號', '題目', '答案', '正確', '得分', '原始值'],
    [150, 80, 220, 200, 120, 60, 320, 260, 70, 60, 120]);
}

function summarySheet() {
  return ensureSheet(SHEET_SUMMARY, ['', '', '', ''], [90, 340, 300, 90]);
}

function ensureSheet(name, headers, widths) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (sheet) return sheet;

  sheet = ss.insertSheet(name);
  if (headers && headers.join('')) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
      .setFontWeight('bold').setBackground('#eef2ff');
    sheet.setFrozenRows(1);
  }
  if (widths) widths.forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });

  // 新試算表預設的「工作表1」若還是空的就順手刪掉
  const first = ss.getSheetByName('工作表1') || ss.getSheetByName('Sheet1');
  if (first && first.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(first);
  return sheet;
}

/* =========================================================
   維護用（在編輯器裡手動執行，不會被前端呼叫）
   ========================================================= */

/** 建立三個工作表；部署前可以先跑一次確認權限沒問題。 */
function setup() {
  pollsSheet(); votesSheet(); summarySheet();
  SpreadsheetApp.getActiveSpreadsheet().toast('工作表已就緒', '即時投票後端', 5);
}

/** 清掉所有快取（改了程式或手動改過試算表之後跑一下）。 */
function clearCache() {
  const sheet = pollsSheet();
  const last = sheet.getLastRow();
  if (last < 2) return;
  const cache = CacheService.getScriptCache();
  sheet.getRange(2, 1, last - 1, 1).getValues().forEach(function (r) {
    cache.remove('row_' + r[0]);
    cache.remove('agg_' + r[0]);
  });
}
