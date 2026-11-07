/* 縮網址 v1.0：後端（docs/stats-backend.gs 的「縮網址」區塊）＋管理頁（apps/short-link/）＋公開轉址頁（s/）

   後端跟首頁的使用統計是同一支 Apps Script、同一個試算表（使用者不想多開試算表），
   doGet 看有沒有 action 參數分流——所以這裡也驗「統計照常運作、不會被縮網址影響」。

   後端是 Google Apps Script，測試環境連不到 Google，所以：
   ‧ 把 **真正的** stats-backend.gs（整支）放進 Node 的 vm 裡跑，SpreadsheetApp 等換成記憶體裡的假試算表
     ——假試算表會模仿 Google 試算表的自動轉型（"007" 變數字 7、"=" 開頭變公式），
       用來驗證後端寫入時的 ' 前綴真的有擋住。
   ‧ 瀏覽器端的 JSONP 請求用 page.route 攔下來，轉給 vm 裡的 doGet，回傳它真正的輸出。
   所以「建立 → QR code → 掃描 → 轉址 → 點擊 +1」整條路是真的走過一遍，只有試算表是假的。

   QR code 用 jsQR（另一套獨立的解碼器）解回網址，確認印出去掃得到、掃到的是對的網址。 */
const { chromium } = require('playwright-core');
const vm = require('vm'), fs = require('fs'), path = require('path');
const jsQR = require('jsqr');
const { BASE, LOGIN, chromePath, OUT } = require('./env');
let pass = 0, fail = 0;
function ok(n, c, d){ if(c){pass++;console.log('  ✓',n+(d?'  → '+d:''));} else {fail++;console.log('  ✗ FAIL:',n+(d?'  → '+d:''));} }

const BACKEND = path.join(__dirname, '..', 'docs', 'stats-backend.gs');
const MANAGER = BASE + '/apps/short-link/index.html';
const S = BASE + '/s/';
const ENDPOINT = 'https://script.google.com/macros/s/TESTSHORT/exec';

/* ───────── 假的 Google Apps Script 環境 ───────── */
function makeGas(){
  const sheets = new Map(), props = {}, cache = new Map(), logs = [];
  /* 模仿試算表把輸入的字串自動轉型：' 開頭＝純文字（' 不算在值裡）、數字字串變數字、= 開頭變公式 */
  const coerce = (v) => {
    if (typeof v !== 'string') return v;
    if (v.startsWith("'")) return v.slice(1);
    if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    if (v.startsWith('=')) return '#公式:' + v;
    return v;
  };
  class Range {
    constructor(sh, r, c, nr, nc){ Object.assign(this, { sh, r, c, nr, nc }); }
    getValues(){
      const out = [];
      for (let i = 0; i < this.nr; i++){
        const row = this.sh.rows[this.r - 1 + i] || [];
        const o = [];
        for (let j = 0; j < this.nc; j++){ const v = row[this.c - 1 + j]; o.push(v === undefined ? '' : v); }
        out.push(o);
      }
      return out;
    }
    getValue(){ return this.getValues()[0][0]; }
    setValues(vals){
      vals.forEach((row, i) => {
        const R = this.sh.rows[this.r - 1 + i] || (this.sh.rows[this.r - 1 + i] = []);
        row.forEach((v, j) => { R[this.c - 1 + j] = coerce(v); });
      });
      return this;
    }
    setValue(v){ return this.setValues([[v]]); }
    getDisplayValue(){ return String(this.getValue()); }
    setNumberFormat(){ return this; }
  }
  class Sheet {
    constructor(name){ this.name = name; this.rows = []; }
    appendRow(vals){ this.rows.push(vals.map(coerce)); return this; }
    getLastRow(){ return this.rows.length; }
    getMaxRows(){ return 1000; }
    getRange(r, c, nr = 1, nc = 1){
      if (typeof r === 'string') return new Proxy({}, { get: () => function(){ return this; } }); // 'A1:B1' 這種只拿來設格式
      if (r < 1 || c < 1 || nr < 1) throw new Error('範圍不正確'); return new Range(this, r, c, nr, nc);
    }
    deleteRow(r){ this.rows.splice(r - 1, 1); }
    setFrozenRows(){}
    setColumnWidth(){}
    clearContents(){ this.rows = []; }
  }
  const ss = {
    getSheetByName: (n) => sheets.get(n) || null,
    insertSheet: (n) => { const s = new Sheet(n); sheets.set(n, s); return s; },
  };
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (k) => (k in props ? props[k] : null),
      setProperty: (k, v) => { props[k] = String(v); },
    }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock: () => {}, releaseLock: () => {} }) },
    CacheService: { getScriptCache: () => ({
      get: (k) => (cache.has(k) ? cache.get(k) : null),
      put: (k, v) => cache.set(k, String(v)),
      remove: (k) => cache.delete(k),
    }) },
    ContentService: {
      MimeType: { JAVASCRIPT: 'javascript', JSON: 'json' },
      createTextOutput: (s) => ({ s, mime: null, setMimeType(m){ this.mime = m; return this; }, getContent(){ return this.s; } }),
    },
    Logger: { log: (m) => logs.push(String(m)) },
    Utilities: { formatDate: (d) => new Date(d).toISOString().slice(0, 10) },
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(BACKEND, 'utf8'), ctx, { filename: 'stats-backend.gs' });
  const raw = (params) => ctx.doGet({ parameter: params });
  const call = (params) => JSON.parse(raw(params).getContent());
  const links = () => sheets.get('短網址');
  const rowOf = (code) => (links() ? links().rows.slice(1).find(r => String(r[0]).toLowerCase() === code) : null);
  const CDate = vm.runInContext('Date', ctx);   // vm 裡的 Date（instanceof 要用同一個）
  return { ctx, CDate, raw, call, props, cache, logs, sheets, links, rowOf,
           clicksOf: (code) => { const r = rowOf(code); return r ? Number(r[6]) || 0 : null; } };
}

/* ───────── 瀏覽器端：把後端與目的地都接到假的 ───────── */
async function newCtx(browser, gas, { endpoint = ENDPOINT, authed = true, opts = {}, goBackend } = {}){
  const ctx = await browser.newContext({ serviceWorkers: 'block', acceptDownloads: true, ...opts });
  const calls = [];
  await ctx.route('https://script.google.com/**', async (route) => {
    const u = new URL(route.request().url());
    const params = Object.fromEntries(u.searchParams);
    if (!u.pathname.includes('/TESTSHORT/')) {             // 首頁的統計端點
      return route.fulfill({ contentType: 'text/javascript', body: `${params.callback}({"visits":1,"apps":{}});` });
    }
    calls.push(params);
    if (goBackend) { const r = await goBackend(route, params); if (r) return; }
    const out = gas.raw(params);
    await route.fulfill({ contentType: out.mime === 'javascript' ? 'text/javascript' : 'application/json', body: out.getContent() });
  });
  await ctx.route('**/apps/short-link/config.js', (r) =>
    r.fulfill({ contentType: 'text/javascript', body: `window.SHORTLINK_ENDPOINT = ${JSON.stringify(endpoint)};` }));
  await ctx.route('https://example.org/**', (r) =>
    r.fulfill({ contentType: 'text/html', body: '<title>目標頁</title><h1>到了</h1>' }));
  if (authed) await ctx.addInitScript(() => localStorage.setItem('nckuh_endo_authed', '1'));
  return { ctx, calls };
}

const shown = (p, sel) => p.$eval(sel, (e) => getComputedStyle(e).display !== 'none' && !e.closest('[hidden]')).catch(() => false);
const text = (p, sel) => p.$eval(sel, (e) => e.textContent.trim());

/* 把 canvas 縮成最寬 480 再取像素，交給 jsQR 在 Node 這邊解碼 */
async function decodeCanvas(page, sel){
  const img = await page.$eval(sel, (c) => {
    const k = Math.min(1, 480 / c.width);
    const t = document.createElement('canvas');
    t.width = Math.round(c.width * k); t.height = Math.round(c.height * k);
    const x = t.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(c, 0, 0, t.width, t.height);
    return { w: t.width, h: t.height, d: Array.from(x.getImageData(0, 0, t.width, t.height).data) };
  });
  const r = jsQR(Uint8ClampedArray.from(img.d), img.w, img.h);
  return r ? r.data : null;
}

async function visit(ctx, url){
  const p = await ctx.newPage();
  p.on('dialog', (d) => { fail++; console.log('  ✗ 轉址頁跳出對話框：', d.message()); d.dismiss(); });
  await p.goto(url);
  return p;
}

(async () => {
  /* ═════════ 一、後端（不開瀏覽器）═════════ */
  console.log('— 後端：設定金鑰 —');
  {
    const g = makeGas();
    ok('ping：還沒設定金鑰時 ready=false', g.call({ action: 'ping' }).ready === false);
    ok('還沒 setup 就看清單 → nokey', g.call({ action: 'list', key: 'x' }).code === 'nokey');
    const key = g.ctx.setupShortlink();
    ok('setupShortlink 產生 xxxx-xxxx 格式的金鑰（沒有 0/o/1/l/i）', /^[a-hj-km-np-z2-9]{4}-[a-hj-km-np-z2-9]{4}$/.test(key), key);
    ok('金鑰存在指令碼屬性 ADMIN_KEY，不在程式碼裡', g.props.ADMIN_KEY === key &&
       !fs.readFileSync(BACKEND, 'utf8').includes(key));
    ok('執行記錄顯示金鑰', g.logs.some(l => l.includes(key)));
    ok('setup 建好兩個工作表與標題列', g.links().rows[0][0] === '代號' && g.sheets.get('點擊紀錄').rows[0][1] === '代號');
    ok('再執行一次 setupShortlink 沿用同一組金鑰', g.ctx.setupShortlink() === key);
    ok('ping：設定後 ready=true', g.call({ action: 'ping' }).ready === true);

    console.log('— 後端：金鑰檢查 —');
    ok('沒帶金鑰不能建立', g.call({ action: 'create', url: 'https://example.org/' }).code === 'badkey');
    ok('金鑰錯誤不能建立', g.call({ action: 'create', key: 'nope', url: 'https://example.org/' }).code === 'badkey');
    ok('金鑰錯誤不能看清單', g.call({ action: 'list', key: 'nope' }).code === 'badkey');
    ok('金鑰錯誤不能刪除', g.call({ action: 'delete', key: 'nope', code: 'x' }).code === 'badkey');
    ok('轉址不需要金鑰', g.call({ action: 'go', code: 'whatever' }).notFound === true);

    console.log('— 後端：建立 —');
    const K = { key };
    let r = g.call({ action: 'create', ...K, url: 'https://example.org/a' });
    ok('不填代號自動產生 5 碼', /^[a-hj-km-np-z2-9]{5}$/.test(r.link && r.link.code), r.link && r.link.code);
    const codes = new Set();
    for (let i = 0; i < 60; i++) codes.add(g.call({ action: 'create', ...K, url: 'https://example.org/' + i }).link.code);
    ok('連建 60 個自動代號都不重複', codes.size === 60);
    r = g.call({ action: 'create', ...K, url: 'https://example.org/rct', code: '  RCT-2026 ', title: '年會', by: 'Tso' });
    ok('自訂代號轉小寫、去空白', r.link.code === 'rct-2026');
    ok('重複代號擋下（不分大小寫）', g.call({ action: 'create', ...K, url: 'https://example.org/', code: 'Rct-2026' }).code === 'taken');
    r = g.call({ action: 'create', ...K, url: 'https://example.org/007', code: '007' });
    ok('代號 007 在試算表裡仍是文字 "007"（不會被轉成數字 7）', g.rowOf('007') && g.rowOf('007')[0] === '007',
       JSON.stringify(g.rowOf('007') && g.rowOf('007')[0]));
    ok('之後用 007 找得到', g.call({ action: 'go', code: '007', peek: '1' }).url === 'https://example.org/007');
    g.call({ action: 'create', ...K, url: 'https://example.org/f', code: 'formula', title: '=IMPORTXML("http://evil","//a")' });
    ok('「=」開頭的標題存成純文字，不會變成公式', g.rowOf('formula')[2] === '=IMPORTXML("http://evil","//a")', g.rowOf('formula')[2]);
    ['-ab', 'ab-', 'a b', 'a_b', '中文', 'x'.repeat(33), 'a/b'].forEach(c =>
      ok(`不合法的代號「${c.length > 12 ? c.slice(0, 8) + '…' : c}」擋下`,
         g.call({ action: 'create', ...K, url: 'https://example.org/', code: c }).code === 'badcode'));
    ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<script>alert(1)</script>', 'ftp://example.org/',
     'example.org', 'https://exa mple.org/', 'https://', 'https://example.org/\u0000x', 'https://example.org/' + 'a'.repeat(2000), '']
      .forEach(u => ok(`不合法的網址擋下：${JSON.stringify(u.length > 40 ? u.slice(0, 40) + '…' : u)}`,
         g.call({ action: 'create', ...K, url: u }).code === 'badurl'));
    ok('大寫的 HTTPS:// 也接受', !!g.call({ action: 'create', ...K, url: 'HTTPS://Example.org/X' }).link);

    console.log('— 後端：轉址與點擊次數 —');
    ok('找不到 → notFound', g.call({ action: 'go', code: 'nope' }).notFound === true);
    ok('空代號 → notFound', g.call({ action: 'go' }).notFound === true);
    r = g.call({ action: 'go', code: 'rct-2026' });
    ok('找到 → 回目標網址與標題', r.url === 'https://example.org/rct' && r.title === '年會');
    ok('點擊次數 +1', g.clicksOf('rct-2026') === 1);
    ok('最後點擊時間有記', g.rowOf('rct-2026')[7] instanceof g.CDate);
    ok('點擊紀錄多一列（只有時間＋代號兩欄）', g.sheets.get('點擊紀錄').rows.length === 2 &&
       g.sheets.get('點擊紀錄').rows[1].length === 2 && g.sheets.get('點擊紀錄').rows[1][1] === 'rct-2026');
    g.call({ action: 'go', code: 'RCT-2026' });
    ok('代號不分大小寫，再 +1', g.clicksOf('rct-2026') === 2);
    g.call({ action: 'go', code: 'rct-2026', peek: '1' });
    ok('peek（預覽）不計次', g.clicksOf('rct-2026') === 2);

    console.log('— 後端：直接在試算表手動加一列 —');
    g.links().appendRow(['Manual', 'https://example.org/manual']);
    ok('只填代號與網址也能轉（代號不分大小寫）', g.call({ action: 'go', code: 'manual' }).url === 'https://example.org/manual');
    ok('其他欄空白也能計次', g.clicksOf('manual') === 1);
    const listed = g.call({ action: 'list', ...K }).links.find(l => l.code === 'manual');
    ok('清單裡看得到手動加的', !!listed && listed.clicks === 1 && listed.title === '');
    g.links().appendRow(['evil', 'javascript:alert(document.domain)']);
    r = g.call({ action: 'go', code: 'evil' });
    ok('有人在試算表填 javascript: → 拒絕轉址', r.code === 'badurl' && !r.url, JSON.stringify(r));
    ok('拒絕的不計次', !g.clicksOf('evil'));

    console.log('— 後端：清單、近 7 天 —');
    const clog = g.sheets.get('點擊紀錄');
    const D = g.CDate;
    clog.appendRow([new D(Date.now() - 8 * 86400000), "'rct-2026"]);
    clog.appendRow([new D(Date.now() - 6 * 86400000), "'rct-2026"]);
    const L = g.call({ action: 'list', ...K });
    const rl = L.links.find(l => l.code === 'rct-2026');
    ok('清單有點擊次數、建立者、時間', rl.clicks === 2 && rl.by === 'Tso' && rl.created > 0 && rl.last > 0);
    ok('近 7 天：兩次剛點的＋6 天前的＝3，8 天前的不算', rl.week === 3, String(rl.week));

    console.log('— 後端：修改、刪除 —');
    r = g.call({ action: 'update', ...K, code: 'rct-2026', url: 'https://example.org/new', title: '年會（改）' });
    ok('改目標網址', r.link && r.link.url === 'https://example.org/new' && r.link.title === '年會（改）');
    ok('改了之後轉到新網址', g.call({ action: 'go', code: 'rct-2026', peek: '1' }).url === 'https://example.org/new');
    ok('改網址不會歸零點擊次數', g.clicksOf('rct-2026') === 2);
    ok('改成 javascript: 擋下', g.call({ action: 'update', ...K, code: 'rct-2026', url: 'javascript:alert(1)' }).code === 'badurl');
    ok('改不存在的 → notfound', g.call({ action: 'update', ...K, code: 'nope', url: 'https://example.org/' }).code === 'notfound');
    const before = g.links().rows.length;
    ok('刪除', g.call({ action: 'delete', ...K, code: '007' }).ok === true && g.links().rows.length === before - 1);
    ok('刪掉的轉址 → notFound', g.call({ action: 'go', code: '007' }).notFound === true);
    ok('再刪一次 → notfound', g.call({ action: 'delete', ...K, code: '007' }).code === 'notfound');
    const c0 = g.clicksOf('manual');
    g.call({ action: 'go', code: 'manual' });
    ok('刪掉前面的列之後，其他短網址計次仍記在正確那一列', g.clicksOf('manual') === c0 + 1);
    ok('刪除不會帶走點擊紀錄', g.sheets.get('點擊紀錄').rows.length > 3);
    ok('刪掉的代號可以再建立', !!g.call({ action: 'create', ...K, url: 'https://example.org/again', code: '007' }).link);

    console.log('— 後端：與使用統計共用同一支程式 —');
    const st0 = g.call({});
    ok('沒有 action 的請求照舊回統計數字', typeof st0.visits === 'number' && typeof st0.apps === 'object' && !('sl' in st0), JSON.stringify(st0));
    g.call({ event: 'visit', new: '1' });
    g.call({ event: 'open', app: 'short-link' });
    const st1 = g.call({});
    ok('造訪 +1、開啟縮網址 +1 照常計數', st1.visits === 1 && st1.uniques === 1 && st1.apps['short-link'] === 1, JSON.stringify(st1));
    ok('統計的工作表（stats／總覽／每日）與縮網址的工作表並存',
       ['stats', '總覽', '每日', '短網址', '點擊紀錄'].every(n => g.sheets.has(n)), [...g.sheets.keys()].join('、'));
    ok('統計請求不會動到短網址的點擊次數', g.clicksOf('manual') === c0 + 1);
    ok('縮網址的回應都帶 sl 版本標記（前端靠它認出後端已更新）',
       g.call({ action: 'ping' }).sl === '1.0' && g.call({ action: 'go', code: 'nope' }).sl === '1.0' &&
       g.call({ action: 'list', key: 'x' }).sl === '1.0');

    console.log('— 後端：其他 —');
    ok('不認得的 action → 錯誤', !!g.call({ action: 'hack' }).error);
    const evilCb = g.raw({ action: 'ping', callback: 'alert(1)//' });
    ok('callback 名稱不合法時不包成 JSONP（不能拿來注入程式）', evilCb.mime === 'json' && evilCb.getContent().startsWith('{'));
    ok('合法 callback 回 JSONP', g.raw({ action: 'ping', callback: 'cb_1' }).getContent().startsWith('cb_1('));
    for (let i = 0; i < 30; i++) g.call({ action: 'list', key: 'wrong' });
    ok('金鑰連錯 30 次後，連正確的金鑰也暫時擋下', g.call({ action: 'list', ...K }).code === 'locked');
    g.cache.clear();
    ok('時間過了（快取清掉）就恢復', Array.isArray(g.call({ action: 'list', ...K }).links));
    const oldKey = key, newKey = g.ctx.resetShortlinkKey();
    ok('resetShortlinkKey 換新金鑰、舊的失效', newKey !== oldKey && g.call({ action: 'list', key: oldKey }).code === 'badkey' &&
       Array.isArray(g.call({ action: 'list', key: newKey }).links));
    ok('showShortlinkKey 顯示目前的金鑰', g.ctx.showShortlinkKey() === newKey);
  }

  /* ═════════ 二、瀏覽器 ═════════ */
  const browser = await chromium.launch({ executablePath: chromePath() });

  console.log('— 登入保護：管理頁要登入，轉址頁不用 —');
  {
    const g = makeGas(); g.ctx.setupShortlink();
    g.call({ action: 'create', key: g.props.ADMIN_KEY, url: 'https://example.org/open', code: 'open' });
    const { ctx } = await newCtx(browser, g, { authed: false });
    const p = await ctx.newPage();
    await p.goto(MANAGER);
    await p.waitForURL(u => !u.pathname.includes('short-link'), { timeout: 5000 }).catch(() => {});
    ok('未登入直開管理頁 → 導回登入頁', new URL(p.url()).pathname === '/', p.url());
    const q = await visit(ctx, S + '?open');
    await q.waitForURL('https://example.org/open', { timeout: 8000 }).catch(() => {});
    ok('未登入點短網址 → 照樣轉到目的地', q.url() === 'https://example.org/open', q.url());
    await ctx.close();
  }

  console.log('— 首頁卡片 —');
  {
    const g = makeGas(); g.ctx.setupShortlink();
    const { ctx } = await newCtx(browser, g);
    const page = await ctx.newPage();
    page.on('pageerror', e => { fail++; console.log('  ✗ PAGE ERROR:', e.message); });
    await page.goto(LOGIN);
    await page.waitForSelector('.app-card');
    const card = await page.$('.app-card:has-text("縮網址")');
    ok('首頁有「縮網址」卡片', !!card);
    ok('卡片圖示是線條 QR 圖示（不是 emoji）', !!(await card.$('.app-icon svg use[href="#i-qr"]')));
    ok('卡片帶色系代號 qr', await card.getAttribute('data-ic') === 'qr');
    ok('放在「手機」分類', /手機/.test(await card.textContent()));
    const [np] = await Promise.all([ctx.waitForEvent('page'), card.click({ force: true })]);
    await np.waitForLoadState();
    ok('點卡片開新分頁到縮網址', /apps\/short-link\/index\.html(\?|$)/.test(np.url()), np.url().replace(BASE, ''));
    ok('標題是「縮網址 v1.0」', await np.title() === '縮網址 v1.0');
    await ctx.close();
  }

  console.log('— 還沒接上後端 —');
  {
    const g = makeGas();
    const { ctx } = await newCtx(browser, g, { endpoint: '' });
    const p = await ctx.newPage();
    await p.goto(MANAGER);
    ok('管理頁顯示設定說明', await shown(p, '#setupWarn') && /SHORTLINK_SETUP/.test(await text(p, '#setupWarn')));
    ok('不顯示建立表單與金鑰輸入', !(await shown(p, '#main')) && !(await shown(p, '#keyPanel')));
    const q = await visit(ctx, S + '?abc');
    await q.waitForSelector('#vInfo:not([hidden])');
    ok('轉址頁顯示「服務尚未設定」', /尚未設定/.test(await text(q, '#vInfo')));
    await ctx.close();
  }

  console.log('— 試算表那邊還是舊的純統計程式（回應沒有 sl 標記）—');
  {
    const g = makeGas();
    const STATS_ONLY = { visits: 12, uniques: 3, logins: 4, apps: {} };   // 舊後端看到 action 也照樣回這個
    const { ctx } = await newCtx(browser, g, { goBackend: async (route, params) => {
      await route.fulfill({ contentType: 'text/javascript', body: `${params.callback}(${JSON.stringify(STATS_ONLY)});` });
      return true;
    } });
    await ctx.addInitScript(() => localStorage.setItem('nckuh_endo_sl_key', 'some-key'));
    const p = await ctx.newPage();
    await p.goto(MANAGER);
    await p.waitForSelector('#oldWarn:not([hidden])');
    ok('管理頁提示「統計試算表的程式還沒更新」', /還沒更新/.test(await text(p, '#oldWarn')) && /SHORTLINK_SETUP/.test(await text(p, '#oldWarn')));
    ok('不會把統計數字誤當成空的短網址清單', !(await shown(p, '#main')) && !(await shown(p, '#keyPanel')));
    const q = await visit(ctx, S + '?abc');
    await q.waitForSelector('#vInfo:not([hidden])');
    ok('轉址頁顯示「服務尚未啟用」、不會誤報找不到', /尚未啟用/.test(await text(q, '#vInfo')) && q.url().startsWith(S));
    await ctx.close();
  }

  console.log('— 後端網址＝首頁統計的網址（同一支程式）—');
  {
    const cfg = fs.readFileSync(path.join(__dirname, '..', 'apps', 'short-link', 'config.js'), 'utf8');
    const appjs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
    const a = (cfg.match(/SHORTLINK_ENDPOINT\s*=\s*'([^']*)'/) || [])[1];
    const b = (appjs.match(/const STATS_ENDPOINT\s*=\s*'([^']*)'/) || [])[1];
    ok('config.js 的 SHORTLINK_ENDPOINT 與 app.js 的 STATS_ENDPOINT 一致', !!a && a === b, a);
    ok('舊的獨立後端檔已移除（避免有人照舊文件多開一個試算表）',
       !fs.existsSync(path.join(__dirname, '..', 'docs', 'shortlink-backend.gs')));
  }

  /* 主要流程共用同一個後端 */
  const g = makeGas();
  const KEY = g.ctx.setupShortlink();
  const { ctx, calls } = await newCtx(browser, g, { opts: { viewport: { width: 1180, height: 900 } } });
  const page = await ctx.newPage();
  page.on('pageerror', e => { fail++; console.log('  ✗ PAGE ERROR:', e.message); });
  let dialogAnswer = null;          // 只掛一個 dialog 處理器；要回答前先設好
  page.on('dialog', d => { const a = dialogAnswer; dialogAnswer = null; if (a) d.accept(); else d.dismiss(); });

  console.log('— 建立金鑰 —');
  await page.goto(MANAGER);
  await page.waitForSelector('#keyPanel:not([hidden])');
  ok('第一次開：要求輸入建立金鑰', await shown(page, '#keyPanel') && !(await shown(page, '#main')));
  await page.fill('#keyInput', 'wrong-key');
  await page.click('#keyGo');
  await page.waitForSelector('#keyMsg:not([hidden])');
  ok('金鑰錯誤 → 提示且不進入', /不正確/.test(await text(page, '#keyMsg')) && !(await shown(page, '#main')));
  ok('錯的金鑰不會被記住', await page.evaluate(() => localStorage.getItem('nckuh_endo_sl_key')) === null);
  await page.fill('#keyInput', KEY);
  await page.click('#keyGo');
  await page.waitForSelector('#main:not([hidden])');
  ok('金鑰正確 → 進入管理頁', await shown(page, '#main') && !(await shown(page, '#keyPanel')));
  ok('記在這台裝置', await page.evaluate(() => localStorage.getItem('nckuh_endo_sl_key')) === KEY);
  ok('空清單提示', /還沒有短網址/.test(await text(page, '#listEmpty')));
  await page.reload();
  await page.waitForSelector('#main:not([hidden])');
  ok('重新整理後不用再輸入', !(await shown(page, '#keyPanel')));

  console.log('— 建立短網址 —');
  ok('代號預覽顯示完整短網址', (await text(page, '#codePreview')) === 'localhost:8765/s/?（自動產生）');
  await page.fill('#fUrl', 'example.org/target?x=1&y=中文');
  await page.fill('#fCode', 'RCT-2026');
  ok('打代號時預覽跟著變', (await text(page, '#codePreview')) === 'localhost:8765/s/?rct-2026');
  await page.fill('#fTitle', '年會報名表單');
  await page.fill('#fBy', 'Tso');
  await page.click('#createBtn');
  await page.waitForSelector('#result:not([hidden])');
  const SHORT = S + '?rct-2026';
  ok('建立完成顯示短網址', (await text(page, '#resultUrl')) === 'localhost:8765/s/?rct-2026');
  const row = g.rowOf('rct-2026');
  ok('少打 https:// 自動補上，中文自動編碼', row && row[1] === 'https://example.org/target?x=1&y=%E4%B8%AD%E6%96%87', row && row[1]);
  ok('標題與建立者存進試算表', row && row[2] === '年會報名表單' && row[3] === 'Tso');
  ok('表單清空（建立者保留）', (await page.inputValue('#fUrl')) === '' && (await page.inputValue('#fCode')) === '' &&
     (await page.inputValue('#fBy')) === 'Tso');
  ok('清單多一筆', (await page.$$('#list .item')).length === 1);
  const decoded = await decodeCanvas(page, '#resultQr');
  ok('建立完成的 QR code 用 jsQR 解得出來，就是這個短網址', decoded === SHORT, decoded);

  console.log('— 建立：防呆 —');
  const tryCreate = async (url, code) => {
    await page.fill('#fUrl', url); await page.fill('#fCode', code || '');
    await page.click('#createBtn');
    await page.waitForFunction(() => !document.getElementById('createBtn').disabled);
    await page.waitForTimeout(50);
    return (await shown(page, '#createMsg')) ? await text(page, '#createMsg') : '';
  };
  const nCalls = calls.length;
  ok('代號重複（前端先擋）', /已經有人用了/.test(await tryCreate('https://example.org/', 'rct-2026')));
  ok('javascript: 網址擋下', /網址格式不對/.test(await tryCreate('javascript:alert(1)')));
  ok('不合法的代號擋下', /代號只能用/.test(await tryCreate('https://example.org/', 'ab_c')));
  ok('不能把短網址再縮一次', /已經是短網址/.test(await tryCreate(SHORT)));
  ok('以上都沒送到後端', calls.length === nCalls);
  g.call({ action: 'create', key: KEY, url: 'https://example.org/other', code: 'taken-by-other' });
  ok('別人剛建好的代號（清單還沒更新）→ 後端擋下並顯示', /已經有人用了/.test(await tryCreate('https://example.org/', 'taken-by-other')));
  await page.fill('#fUrl', 'https://example.org/auto');
  await page.fill('#fCode', '');
  await page.click('#createBtn');
  await page.waitForFunction(() => document.querySelectorAll('#list .item').length === 2);
  const auto = await page.$eval('#result', e => e.dataset.code);
  ok('不填代號 → 自動產生 5 碼', /^[a-hj-km-np-z2-9]{5}$/.test(auto), auto);

  console.log('— QR code 對話框 —');
  await page.click('#list .item[data-code="rct-2026"] [data-act=qr]');
  await page.waitForSelector('#qrDlg[open]');
  const dims = () => page.$eval('#qrBig', c => ({ w: c.width, h: c.height }));
  let d = await dims();
  ok('下載用的 QR 約 1000px 以上', d.w >= 900 && d.w <= 1024, `${d.w}×${d.h}`);
  ok('預設下方加標題與網址（圖比較高）', d.h > d.w);
  ok('加了字的 QR 仍解得出來', await decodeCanvas(page, '#qrBig') === SHORT);
  await page.click('#qrCaption');
  d = await dims();
  ok('取消勾選 → 正方形', d.h === d.w);
  ok('純 QR 也解得出來', await decodeCanvas(page, '#qrBig') === SHORT);
  ok('QR 是白底（深色模式也一樣好掃）', await page.$eval('#qrBig', c => {
    const p = c.getContext('2d').getImageData(2, 2, 1, 1).data; return p[0] === 255 && p[1] === 255 && p[2] === 255;
  }));
  let [dl] = await Promise.all([page.waitForEvent('download'), page.click('#qrPng')]);
  let buf = fs.readFileSync(await dl.path());
  ok('下載 PNG：檔頭是 PNG', buf.slice(1, 4).toString() === 'PNG', dl.suggestedFilename());
  ok('PNG 檔名帶代號', dl.suggestedFilename() === 'qr-rct-2026.png' || dl.suggestedFilename() === 'download', dl.suggestedFilename());
  [dl] = await Promise.all([page.waitForEvent('download'), page.click('#qrSvg')]);
  const svg = fs.readFileSync(await dl.path(), 'utf8');
  ok('下載 SVG：是向量 QR（白底黑點）', /<svg[\s\S]*<path[\s\S]*fill="black"/.test(svg) && /fill="white"/.test(svg));
  await page.click('#qrCaption');
  await page.click('#qrClose');

  console.log('— 點短網址 → 轉址＋計次 —');
  let q = await visit(ctx, SHORT);
  await q.waitForURL(/example\.org\/target/, { timeout: 8000 }).catch(() => {});
  ok('轉到目標網址', q.url() === 'https://example.org/target?x=1&y=%E4%B8%AD%E6%96%87', q.url());
  ok('點擊 +1', g.clicksOf('rct-2026') === 1);
  await q.goBack().catch(() => {});
  ok('是 replace 不是 push（按上一頁不會又回到轉址頁、再被轉一次）', !q.url().startsWith(S), q.url());
  await q.close();
  q = await visit(ctx, S + '?RCT-2026&fbclid=IwAR0abc');
  await q.waitForURL(/example\.org/, { timeout: 8000 }).catch(() => {});
  ok('大寫＋FB 追加的 fbclid 參數也認得', /example\.org\/target/.test(q.url()) && g.clicksOf('rct-2026') === 2);
  await q.close();
  q = await visit(ctx, S + '?c=rct-2026');
  await q.waitForURL(/example\.org/, { timeout: 8000 }).catch(() => {});
  ok('?c=代號 的寫法也可以', /example\.org\/target/.test(q.url()) && g.clicksOf('rct-2026') === 3);
  await q.close();

  console.log('— 預覽（網址後面加 +）—');
  q = await visit(ctx, SHORT + '+');
  await q.waitForSelector('#vPeek:not([hidden])');
  ok('顯示目的地與標題、不跳轉', /example\.org\/target/.test(await text(q, '#peekUrl')) &&
     (await text(q, '#peekTitle')) === '年會報名表單' && q.url().startsWith(S));
  ok('預覽不計次', g.clicksOf('rct-2026') === 3);
  ok('「前往」按鈕連到目的地', (await q.$eval('#peekGo', a => a.href)) === 'https://example.org/target?x=1&y=%E4%B8%AD%E6%96%87');
  await q.close();

  console.log('— 轉址頁的其他狀況 —');
  q = await visit(ctx, S + '?nope');
  await q.waitForSelector('#vNotFound:not([hidden])');
  ok('不存在的代號 → 找不到', (await text(q, '#nfCode')) === 'nope');
  await q.close();
  q = await visit(ctx, S + '?%E4%B8%AD%E6%96%87');
  await q.waitForSelector('#vNotFound:not([hidden])');
  ok('不合法的代號直接說找不到（不送後端）', !calls.some(c => c.action === 'go' && /中/.test(c.code || '')));
  await q.close();
  q = await visit(ctx, S);
  await q.waitForSelector('#vInfo:not([hidden])');
  ok('沒有代號 → 說明這是轉址頁', /接代號/.test(await text(q, '#vInfo')));
  await q.close();
  q = await visit(ctx, S + '?rct-2026).');
  await q.waitForURL(/example\.org/, { timeout: 8000 }).catch(() => {});
  ok('從文章複製多帶到的「).」也能轉', /example\.org\/target/.test(q.url()) && g.clicksOf('rct-2026') === 4);
  await q.close();

  console.log('— 轉址頁：就算後端被竄改回傳 javascript: 也不執行 —');
  {
    const g2 = makeGas(); g2.ctx.setupShortlink();
    const { ctx: c2 } = await newCtx(browser, g2, { goBackend: async (route, params) => {
      if (params.action === 'go' && params.code === 'evil') {
        await route.fulfill({ contentType: 'text/javascript', body: `${params.callback}({"url":"javascript:alert(document.domain)","sl":"1.0"});` });
        return true;
      }
    } });
    const e = await visit(c2, S + '?evil');
    await e.waitForSelector('#vError:not([hidden])');
    await e.waitForTimeout(300);
    ok('顯示錯誤、留在轉址頁、沒有跳出 alert', e.url().startsWith(S) && /格式不正確/.test(await text(e, '#errMsg')));
    await c2.close();
  }

  console.log('— 轉址頁：連不上後端 → 可重試 —');
  {
    let down = true;
    const g3 = makeGas(); g3.ctx.setupShortlink();
    g3.call({ action: 'create', key: g3.props.ADMIN_KEY, url: 'https://example.org/retry', code: 'retry' });
    const { ctx: c3 } = await newCtx(browser, g3, { goBackend: async (route) => { if (down) { await route.abort(); return true; } } });
    const e = await visit(c3, S + '?retry');
    await e.waitForSelector('#vError:not([hidden])');
    ok('顯示「暫時連不上」與重試鈕', /連不上/.test(await text(e, '#vError')) && await shown(e, '#retry'));
    down = false;
    await e.click('#retry');
    await e.waitForURL('https://example.org/retry', { timeout: 8000 }).catch(() => {});
    ok('網路恢復後按重試 → 轉到目的地', e.url() === 'https://example.org/retry');
    await c3.close();
  }

  console.log('— 清單：點擊次數、排序、搜尋 —');
  for (let i = 0; i < 5; i++) g.call({ action: 'go', code: auto });            // 自動代號那個點 5 次
  g.links().appendRow(['sheet-added', 'https://example.org/sheet', '在試算表手動加的']);
  await page.click('#refreshBtn');
  await page.waitForFunction(() => document.querySelectorAll('#list .item').length === 4);
  ok('重新整理後看得到試算表手動加的那筆', !!(await page.$('#list .item[data-code="sheet-added"]')));
  const meta = await text(page, '#list .item[data-code="rct-2026"] .item-meta');
  ok('顯示點擊 4 次、近 7 天 4、最後點擊、建立者', /👆 4 次/.test(meta) && /近 7 天 4/.test(meta) && /最後 剛剛/.test(meta) && /Tso/.test(meta), meta);
  ok('沒人點過的顯示「還沒有人點過」', /還沒有人點過/.test(await text(page, '#list .item[data-code="sheet-added"] .item-meta')));
  ok('總計列', /共 4 個短網址 · 總點擊 9 次/.test(await text(page, '#summary')), await text(page, '#summary'));
  await page.selectOption('#sort', 'clicks');
  let order = await page.$$eval('#list .item', els => els.map(e => e.dataset.code));
  ok('依點擊最多排序', order[0] === auto && order[1] === 'rct-2026', order.join(','));
  await page.reload(); await page.waitForSelector('#list .item');
  ok('排序方式記得', (await page.inputValue('#sort')) === 'clicks');
  await page.selectOption('#sort', 'new');
  await page.fill('#search', '年會');
  order = await page.$$eval('#list .item', els => els.map(e => e.dataset.code));
  ok('搜尋標題', order.join() === 'rct-2026');
  await page.fill('#search', 'example.org/sheet');
  ok('搜尋目標網址', (await page.$$eval('#list .item', els => els.map(e => e.dataset.code))).join() === 'sheet-added');
  await page.fill('#search', 'zzz-沒有');
  ok('搜不到有提示', /找不到符合/.test(await text(page, '#listEmpty')));
  await page.fill('#search', '');
  await page.evaluate(() => { document.querySelector('#list').dataset.mark = '1'; });

  console.log('— 清單內容防 XSS —');
  g.links().appendRow(['xss', 'https://example.org/"><img src=x onerror=alert(1)>', '<img src=x onerror="window.__xss=1">', '<b>x</b>']);
  await page.click('#refreshBtn');
  await page.waitForSelector('#list .item[data-code="xss"]');
  await page.waitForTimeout(200);
  ok('標題、網址、建立者裡的 HTML 只當文字顯示', await page.evaluate(() => !window.__xss &&
     !document.querySelector('#list img') && document.querySelector('#list .item[data-code="xss"] .item-title').textContent.includes('<img')));

  console.log('— 複製 —');
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
  await page.click('#list .item[data-code="rct-2026"] [data-act=copy]');
  await page.waitForTimeout(150);
  ok('複製到剪貼簿的是完整短網址', await page.evaluate(() => navigator.clipboard.readText()) === SHORT);

  console.log('— 編輯目標網址 —');
  await page.click('#list .item[data-code="rct-2026"] [data-act=edit]');
  await page.waitForSelector('#editDlg[open]');
  ok('編輯框帶入目前的網址與標題', (await page.inputValue('#eUrl')).startsWith('https://example.org/target') &&
     (await page.inputValue('#eTitle')) === '年會報名表單');
  await page.fill('#eUrl', 'javascript:alert(1)');
  await page.click('#editSave');
  await page.waitForSelector('#editMsg:not([hidden])');
  ok('改成 javascript: 擋下', /網址格式不對/.test(await text(page, '#editMsg')));
  await page.fill('#eUrl', 'https://example.org/changed');
  await page.fill('#eTitle', '年會報名（新表單）');
  await page.click('#editSave');
  await page.waitForFunction(() => !document.getElementById('editDlg').open);
  ok('清單更新', /example\.org\/changed/.test(await text(page, '#list .item[data-code="rct-2026"] .item-dest')) &&
     /新表單/.test(await text(page, '#list .item[data-code="rct-2026"] .item-title')));
  q = await visit(ctx, SHORT);
  await q.waitForURL('https://example.org/changed', { timeout: 8000 }).catch(() => {});
  ok('同一個短網址（同一張 QR）現在轉到新網址', q.url() === 'https://example.org/changed', q.url());
  await q.close();

  console.log('— 刪除 —');
  dialogAnswer = null;              // 先按取消
  await page.click('#list .item[data-code="rct-2026"] [data-act=del]');
  await page.waitForTimeout(200);
  ok('確認框按取消 → 不刪', !!(await page.$('#list .item[data-code="rct-2026"]')) && !!g.rowOf('rct-2026'));
  dialogAnswer = true;
  await page.click('#list .item[data-code="rct-2026"] [data-act=del]');
  await page.waitForFunction(() => !document.querySelector('#list .item[data-code="rct-2026"]'));
  ok('確認後從清單與試算表移除', !g.rowOf('rct-2026'));
  q = await visit(ctx, SHORT);
  await q.waitForSelector('#vNotFound:not([hidden])');
  ok('刪掉的短網址 → 找不到', true);
  await q.close();

  console.log('— 金鑰被換掉 —');
  g.ctx.resetShortlinkKey();
  await page.click('#refreshBtn');
  await page.waitForSelector('#keyPanel:not([hidden])');
  ok('管理者 resetKey 後 → 要求重新輸入', /重新輸入/.test(await text(page, '#keyMsg')) && !(await shown(page, '#main')));
  ok('舊金鑰從這台裝置清掉', await page.evaluate(() => localStorage.getItem('nckuh_endo_sl_key')) === null);
  await page.fill('#keyInput', g.props.ADMIN_KEY);
  await page.click('#keyGo');
  await page.waitForSelector('#main:not([hidden])');
  ok('輸入新金鑰後恢復', (await page.$$('#list .item')).length === 4);

  console.log('— 截圖（給使用者看）—');
  await page.fill('#fUrl', 'https://forms.gle/AbCdEf123456');
  await page.fill('#fCode', 'endo-meeting');
  await page.fill('#fTitle', '牙髓病科 12 月晨會簽到');
  await page.click('#createBtn');
  await page.waitForSelector('#result:not([hidden])');
  await page.screenshot({ path: path.join(OUT, 'short-link-desktop.png'), fullPage: true });
  await page.click('#list .item[data-code="endo-meeting"] [data-act=qr]');
  await page.waitForSelector('#qrDlg[open]');
  await page.screenshot({ path: path.join(OUT, 'short-link-qr.png') });
  await page.click('#qrClose');

  console.log('— 手機寬度 —');
  for (const scheme of ['light', 'dark']) {
    const m = await ctx.newPage();
    await m.setViewportSize({ width: 375, height: 812 });
    await m.emulateMedia({ colorScheme: scheme });
    await m.goto(MANAGER);
    await m.waitForSelector('#list .item');
    ok(`管理頁 375px（${scheme}）沒有橫向捲動`, await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (scheme === 'dark') ok('深色模式底色是深的', await m.evaluate(() => getComputedStyle(document.body).backgroundColor) === 'rgb(14, 18, 23)');
    await m.screenshot({ path: path.join(OUT, `short-link-mobile-${scheme}.png`), fullPage: true });
    await m.goto(S + '?nope');
    await m.waitForSelector('#vNotFound:not([hidden])');
    ok(`轉址頁 375px（${scheme}）沒有橫向捲動`, await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await m.close();
  }

  await ctx.close();
  await browser.close();
  console.log(`\n通過 ${pass}，失敗 ${fail}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
