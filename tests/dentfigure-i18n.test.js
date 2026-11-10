/* DentFigure 中文化層的回歸測試。
 *
 * 這組測試要守住三件事,每一件都踩過或差點踩到:
 *
 * 1. 翻譯層不能弄壞 app。它是在 app 的 script 之後才跑的一個 DOM 走訪,
 *    只要有一個例外沒接住,整個介面就停在半翻譯狀態。
 * 2. 翻譯只能做「完整字串精確比對」。若改成子字串替換,使用者輸入的
 *    檔名、面板標籤、病例代號會被一起改掉——那是無聲的資料損壞。
 * 3. 上游快照必須維持原封不動。27 個上游 spec 檔斷言英文 UI 字串,
 *    快照一旦被翻到,那 469 筆測試就不再有意義。
 */
const { chromium } = require('playwright-core');
const { DENTFIG, LOGIN, chromePath } = require('./env');
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(n, c, d){ if(c){pass++;console.log('  ✓',n+(d?'  → '+d:''));} else {fail++;console.log('  ✗ FAIL:',n+(d?'  → '+d:''));} }

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath() });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => {
    if (m.type() === 'error' && !/Failed to load resource|net::ERR|favicon/i.test(m.text()))
      errs.push('console.error: ' + m.text());
  });

  console.log('\n— 登入守衛 —');
  await page.goto(LOGIN);
  await page.evaluate(() => localStorage.removeItem('nckuh_endo_authed'));
  await page.goto(DENTFIG);
  await page.waitForLoadState('domcontentloaded');
  ok('未登入直開會被導回登入頁', !/apps\/dentfigure/.test(page.url()), page.url().replace(/^https?:\/\/[^/]+/, ''));

  await page.evaluate(() => localStorage.setItem('nckuh_endo_authed', '1'));
  await page.goto(DENTFIG);
  await page.waitForFunction(() => typeof render === 'function' && typeof _commitImage === 'function');
  await page.waitForTimeout(400);
  ok('已登入可正常開啟', /apps\/dentfigure/.test(page.url()));

  console.log('\n— 首頁卡片(上架)—');
  // CLAUDE.md 上架流程第 5 步:登入 → 點卡片 → 確認新分頁開到工具頁、標題正確
  await page.goto(LOGIN);
  await page.evaluate(() => localStorage.setItem('nckuh_endo_authed', '1'));
  await page.reload();
  await page.waitForSelector('.app-card');
  const card = await page.evaluate(() => {
    const c = [...document.querySelectorAll('.app-card')]
      .find(e => /DentFigure/i.test(e.textContent));
    if (!c) return null;
    const app = APPS.find(a => /dentfigure/i.test(a.url || ''));
    return { name: c.querySelector('.app-name')?.textContent.trim(), url: app && app.url,
             slug: app && slugOf(app), group: app && app.group, wip: !!(app && app.wip) };
  });
  ok('首頁出現 DentFigure 卡片', !!card, card ? card.name : '找不到');
  ok('卡片不是施工中佔位', card && !card.wip);
  ok('放在「電腦操作」區', card && card.group === 'desktop', card && card.group);
  // 住在 apps/ 底下,slugOf 的正則才比得中 —— 這是瀏覽次數與 🆕 徽章的前提
  ok('統計代號抓得到', card && card.slug === 'dentfigure', card && card.slug);

  const cardEl = await page.$('.app-card:has-text("DentFigure")');
  const [popup] = await Promise.all([
    ctx.waitForEvent('page'),
    cardEl.click({ force: true }),   // 卡片有覆蓋層會攔截 pointer events
  ]);
  await popup.waitForLoadState('domcontentloaded');
  await popup.waitForFunction(() => typeof render === 'function');
  await popup.waitForTimeout(400);
  const popTitle = await popup.title();
  ok('點卡片會開新分頁到工具頁', /apps\/dentfigure/.test(popup.url()), popup.url().replace(/^.*\/APP/, ''));
  ok('新分頁標題正確', /臨床影像組版/.test(popTitle), popTitle);
  await popup.close();

  await page.goto(DENTFIG);
  await page.waitForFunction(() => typeof render === 'function' && typeof _commitImage === 'function');
  await page.waitForTimeout(400);

  console.log('\n— 翻譯層 —');
  const t = await page.evaluate(() => ({
    title: document.title,
    loaded: typeof window.__i18n === 'object',
    dict: window.__i18n ? Object.keys(window.__i18n.dict).length : 0,
  }));
  ok('翻譯層有載入', t.loaded, `字典 ${t.dict} 筆`);
  ok('頁面標題已中文化', /臨床影像組版/.test(t.title), t.title);

  const heads = await page.evaluate(() =>
    [...document.querySelectorAll('summary')].slice(0, 9).map(s => s.textContent.trim()));
  const want = ['影像','排列','範本','裁切與比例','標註與繪圖','外觀','測量','檢查','匯出'];
  const hit = want.filter(w => heads.some(h => h.includes(w)));
  ok('九個主工作區塊都已中文化', hit.length === 9, `${hit.length}/9 · ${heads.slice(0,4).join(' / ')}`);

  console.log('\n— app 本身仍正常運作 —');
  await page.evaluate(async () => {
    const mk = i => { const c=document.createElement('canvas'); c.width=c.height=100;
      const x=c.getContext('2d'); const g=40+i*50;
      x.fillStyle=`rgb(${g},${g},${g})`; x.fillRect(0,0,100,100);
      x.fillStyle='#fff'; x.fillRect(10,10,20,20); return c.toDataURL('image/png'); };
    for (let i=0;i<4;i++) {
      const src = mk(i);
      await new Promise(res => { const img=new Image();
        img.onload=()=>{ _commitImage(img, src, `panel${i}.png`); res(); }; img.src=src; });
    }
    sv('cols','2'); sv('rows','2'); onLayoutChange(); render();
  });
  const st = await page.evaluate(() => {
    const c = document.getElementById('fig-canvas');
    return { n: images.length, w: c.width, h: c.height };
  });
  ok('可以植入 4 個面板', st.n === 4, `${st.n} 個`);
  ok('畫布有實際算出尺寸', st.w > 0 && st.h > 0, `${st.w}×${st.h}`);

  const exp = await page.evaluate(() => {
    const c = renderExportCanvas(300);
    return { w: c.width, h: c.height };
  });
  ok('300 DPI 匯出畫布產生成功', exp.w > st.w && exp.h > st.h, `${exp.w}×${exp.h}`);

  console.log('\n— 精確比對:使用者資料不可被翻譯 —');
  const safe = await page.evaluate(() => {
    // 面板標號是使用者資料。字典裡有 'Label' → '標號',若改成子字串替換,
    // 名為 "Label" 的檔案或標籤就會被改掉。
    images[0].name = 'Export';          // 與字典的 'Export' → '匯出' 完全同字
    images[1].name = 'my Export file';  // 含字典字串,但整串不同
    renderImgList();
    const rows = [...document.querySelectorAll('#img-list')].map(e => e.textContent).join(' ');
    return { keptExact: images[0].name, keptPartial: images[1].name, listHas: rows.includes('my Export file') };
  });
  ok('使用者資料在 model 中未被改寫', safe.keptExact === 'Export' && safe.keptPartial === 'my Export file');
  ok('含字典字串的檔名不被部分替換', safe.listHas, safe.keptPartial);

  // 踩過:字典收了 'Lab' → '實驗室'(佈景名),把 <div class="logo">Figure<span>Lab</span></div>
  // 也翻掉,logo 變成「Figure實驗室」。現在 .logo 在結構上受保護,字典寫錯也不會再中。
  const brand = await page.evaluate(() => {
    const el = document.querySelector('.logo');
    return { text: el ? el.textContent.trim() : '(找不到 .logo)' };
  });
  ok('品牌名不被翻譯', !/[一-鿿]/.test(brand.text), brand.text);

  const guarded = await page.evaluate(() => {
    // 即使字典裡真的有這個字,.logo 子樹也不該被動到
    window.__i18n.dict['__BRANDTEST__'] = '中文';
    const el = document.querySelector('.logo');
    const span = document.createElement('span');
    span.textContent = '__BRANDTEST__';
    el.appendChild(span);
    window.__i18n.retranslate();
    const got = span.textContent;
    span.remove();
    return got;
  });
  ok('.logo 子樹在結構上受保護', guarded === '__BRANDTEST__', guarded);

  console.log('\n— 拖放檔案:放在哪裡都要能匯入 —');
  // 使用者回報:把圖片拖到網頁上沒有匯入,整頁變成那張圖,編輯中的版面消失。
  // 原因是上游只在 #drop-zone 掛 dragover/drop 並 preventDefault,document
  // 層級沒有攔截,所以放在別處瀏覽器就導航到那個檔案。fixes.js 補了一層。
  const dropAt = (sel, name) => page.evaluate(async ([sel, name]) => {
    const el = document.querySelector(sel);
    if (!el) return { err: '找不到 ' + sel };
    const dt = new DataTransfer();
    const c = document.createElement('canvas'); c.width = 60; c.height = 40;
    c.getContext('2d').fillRect(0, 0, 60, 40);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    dt.items.add(new File([blob], name + '.png', { type: 'image/png' }));
    el.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
    const ev = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt });
    el.dispatchEvent(ev);
    await new Promise(r => setTimeout(r, 900));
    return { prevented: ev.defaultPrevented, names: images.filter(Boolean).map(i => i.name) };
  }, [sel, name]);

  await page.evaluate(() => { images.length = 0; renderImgList(); });
  for (const [sel, name, label] of [
    ['#drop-zone', 'z', '虛線小方框'],
    ['#ann-canvas', 'c', '圖的畫布'],
    ['body', 'b', '頁面空白處'],
  ]) {
    const r = await dropAt(sel, name);
    ok(`拖到${label}不會被瀏覽器開走`, r.prevented === true);
    ok(`拖到${label}真的匯入了`, (r.names || []).includes(name + '.png'), (r.names || []).join(','));
  }
  const after = await page.evaluate(() => images.filter(Boolean).map(i => i.name));
  const dup = after.filter((n, i) => after.indexOf(n) !== i);
  // #drop-zone 有自己的處理器,document 層那條若沒判斷 defaultPrevented 就會加兩次
  ok('同一個檔案不會被加入兩次', dup.length === 0, dup.join(',') || '無重複');

  console.log('\n— 本機資料透明化(M1)—');
  // 上游三層儲存預設都寫入病患影像,而且使用者看不到。實測過的情境:
  // 醫師甲關掉分頁後 fl-autosave-v2 留下含影像的資料,醫師乙開同一網址會
  // 看到「Recover unsaved session」,按下去就取回甲的病患影像。
  // 這一層不禁止儲存(病例本來就不會一次做完),而是讓殘留不再隱形。
  const stat = () => page.evaluate(() => {
    const e = document.getElementById('df-ld-stat');
    return e ? e.textContent.trim() : '(找不到面板)';
  });
  ok('存檔區出現「本機資料」面板', await page.evaluate(() => !!document.getElementById('df-local-data')));
  ok('面板講明資料存在這台電腦', await page.evaluate(() => {
    const e = document.getElementById('df-local-data');
    return !!e && /這台電腦/.test(e.textContent) && /不會自動清除/.test(e.textContent);
  }));

  // 放一張圖等自動存檔寫入,面板要反映出來
  await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 800; c.height = 600;
    c.getContext('2d').fillRect(0, 0, 800, 600);
    const s = c.toDataURL('image/png');
    await new Promise(r => { const im = new Image(); im.onload = () => { _commitImage(im, s, 'm1.png'); r(); }; im.src = s; });
    localStorage.setItem('fl-user-name', '張醫師');     // 個人資訊
    localStorage.setItem('fl-gemini-key', 'AIzaFAKE');  // 憑證
    localStorage.setItem('fl-theme', 'lab');            // 純偏好
    render();
  });
  await page.waitForTimeout(3600);
  await page.evaluate(() => window.__dfPrivacy.refresh());
  await page.waitForTimeout(300);
  const withData = await stat();
  ok('面板顯示存了幾張影像', /影像/.test(withData), withData);

  const sv = await page.evaluate(() => window.__dfPrivacy.survey());
  ok('偵測到自動存檔含影像', sv.hasAutosave === true && sv.imgs > 0, `${sv.imgs} 張 / ${sv.bytes} bytes`);

  await page.evaluate(async () => { await window.__dfPrivacy.clearLocal(); await window.__dfPrivacy.refresh(); });
  await page.waitForTimeout(300);
  ok('清除後面板顯示沒有資料', /沒有存放任何資料/.test(await stat()), await stat());

  // 清除的判準是「資料 vs 偏好」,不是「全清」
  const keys = await page.evaluate(() => ({
    autosave: localStorage.getItem('fl-autosave-v2'),
    name: localStorage.getItem('fl-user-name'),
    key: localStorage.getItem('fl-gemini-key'),
    theme: localStorage.getItem('fl-theme'),
    auth: localStorage.getItem('nckuh_endo_authed'),
  }));
  ok('清除未存檔內容(含影像)', keys.autosave === null);
  ok('清除使用者姓名(會寫進圖說)', keys.name === null);
  ok('清除 API 金鑰', keys.key === null);
  ok('保留佈景偏好', keys.theme === 'lab');
  ok('保留登入狀態(清掉會把人踢出去)', keys.auth === '1');

  console.log('\n— 功能精簡:螢光／LUT／明視野 —');
  // 臨床判斷(Dr.Tso):顯微鏡影像才用得到,牙科用不上,刪掉讓介面清爽。
  // 做法是隱藏 UI 不是拔實作——實作與 render/匯出/存檔路徑交織,拔掉風險
  // 遠大於收益,而且 index.html 是從快照產生的,動程式碼每次同步都要重做。
  await page.evaluate(() => { const d = document.querySelector('#img-list details'); if (d) d.open = true; });
  await page.waitForTimeout(500);
  const shown = sel => page.evaluate(s => [...document.querySelectorAll(s)]
    .filter(e => getComputedStyle(e).display !== 'none' && e.offsetParent !== null).length, sel);
  const exists = sel => page.evaluate(s => document.querySelectorAll(s).length, sel);

  for (const [sel, label] of [
    ['button[onclick="autoDetectChannels()"]', '自動判定通道'],
    ["button[onclick=\"applyQuickPreset('fluorescence')\"]", '螢光預設'],
    ["button[onclick=\"applyQuickPreset('brightfield')\"]", '明視野預設'],
    ['.f-lut', 'LUT 色表按鈕'],
    ['button[data-splitch]', '通道拆成一列'],
  ]) {
    const n = await exists(sel), v = await shown(sel);
    ok(`${label}已隱藏`, n > 0 && v === 0, `存在 ${n} 個,顯示 ${v} 個`);
  }
  // 只隱藏按鈕不夠:指令面板(⌘K)搜得到就還是執行得了
  const removed = await page.evaluate(() => window.__dfTrim && window.__dfTrim.commandsRemoved);
  ok('指令面板也移除了螢光相關指令', removed > 0, `${removed} 筆`);
  // 精簡層絕不能弄壞核心功能
  const stillWorks = await page.evaluate(() => { const c = renderExportCanvas(300); return c.width > 0 && c.height > 0; });
  ok('精簡後匯出仍正常', stillWorks);

  console.log('\n— 上游範本按鈕:整顆替換,不用片段詞條 —');
  /* 原本把 `Single<br>column` 拆成 'Single'→單張、'column'→欄 兩個片段詞條,
     畫面上變成「單張／欄」,而它其實是「單欄直排」。片段詞條是這個檔案
     自己明令禁止的做法(單字鍵會誤傷任何整段文字剛好相同的元素)。*/
  const tplBtns = await page.evaluate(() => {
    const g = id => document.querySelector(`button[onclick="applyTemplate('${id}')"]`);
    const txt = id => { const b = g(id); return b ? b.innerHTML : null; };
    return {
      singlecol: txt('singlecol'), tworow: txt('tworow'), science: txt('science1col'),
      nature: txt('nature2x2'),
      // onclick 必須原封不動,按鈕才還按得動
      onclickIntact: !!g('singlecol') && g('singlecol').getAttribute('onclick') === "applyTemplate('singlecol')",
    };
  });
  ok('單欄範本不再是「單張／欄」', tplBtns.singlecol === '單欄<br>直排', tplBtns.singlecol);
  ok('雙列範本翻得通順', tplBtns.tworow === '雙列<br>橫帶', tplBtns.tworow);
  ok('期刊名保留原文', tplBtns.science === 'Science<br>單欄' && tplBtns.nature === 'Nature<br>2×2',
     tplBtns.science + ' / ' + tplBtns.nature);
  ok('整顆替換沒有動到 onclick', tplBtns.onclickIntact);
  ok('危險的單字片段詞條已移除', await page.evaluate(() =>
    ['Single','column','strip'].every(k => !(k in window.__i18n.dict))));
  // JS 產生的空清單文字也要翻到(走 MutationObserver 那條路)
  const noSaved = await page.evaluate(() => {
    renderSavedTemplates();
    return document.getElementById('saved-templates-list').textContent.trim();
  });
  await page.waitForTimeout(150);
  const noSaved2 = await page.evaluate(() =>
    document.getElementById('saved-templates-list').textContent.trim());
  ok('「還沒有存過範本」有翻到', noSaved2 === '還沒有存過範本', noSaved2 || noSaved);

  console.log('\n— 牙科範本 —');
  // 每個範本套用後:版面幾何要變、每格要帶入階段名稱(tag,會畫在面板上)
  const tplMeta = await page.evaluate(() => {
    const d = window.__dfDental;
    return d ? d.TEMPLATES.map(t => ({ id:t.id, n:t.tags.length, cols:t.cols, rows:t.rows })) : null;
  });
  ok('牙科範本層已載入', !!tplMeta, tplMeta ? `${tplMeta.length} 個範本` : '找不到');
  ok('範本按鈕有出現在範本區', await exists('#df-dental-grid .tpl-btn') === tplMeta.length,
     `${await exists('#df-dental-grid .tpl-btn')} 顆`);
  ok('每個範本的格數都容納得下', tplMeta.every(t => t.cols * t.rows >= t.n));

  // 先把面板數補到 6,才測得到最大的那幾個範本
  await page.evaluate(async () => {
    const mk = i => { const c=document.createElement('canvas'); c.width=c.height=80;
      const x=c.getContext('2d'); x.fillStyle=`rgb(${30+i*30},${30+i*30},${30+i*30})`;
      x.fillRect(0,0,80,80); return c.toDataURL('image/png'); };
    while (images.length < 6) {
      const i = images.length, src = mk(i);
      await new Promise(res => { const img=new Image();
        img.onload=()=>{ _commitImage(img, src, `pa${i}.png`); res(); }; img.src=src; });
    }
  });
  ok('面板補到 6 個', await page.evaluate(() => images.length) === 6);

  for (const t of tplMeta) {
    const r = await page.evaluate(id => {
      images.forEach(im => { im.tag = ''; im.captionNote = ''; });   // 每個範本從乾淨狀態測
      window.__dfDental.apply(id);
      const d = window.__dfDental.TEMPLATES.find(x => x.id === id);
      const n = Math.min(images.length, d.tags.length);
      return {
        cols: parseInt(document.getElementById('cols').value),
        rows: parseInt(document.getElementById('rows').value),
        tags: images.slice(0, n).map(im => im.tag),
        want: d.tags.slice(0, n),
        // tag 才是畫在面板上的那個欄位;captionNote 不會畫出來
        capsFilled: images.slice(0, n).every(im => (im.captionNote || '').trim().length > 0),
      };
    }, t.id);
    ok(`${t.id}:套用了 ${t.cols}×${t.rows} 版面`, r.cols === t.cols && r.rows === t.rows,
       `${r.cols}×${r.rows}`);
    ok(`${t.id}:階段名稱依序填入 tag`, JSON.stringify(r.tags) === JSON.stringify(r.want),
       r.tags.join(' · '));
    ok(`${t.id}:captionNote 也帶到了`, r.capsFilled);
  }

  // 影像比範本格數少時,要只填前 N 格、不能憑空生出面板
  const fewer = await page.evaluate(() => {
    const keep = images.slice(0, 2); images.length = 0; keep.forEach(i => images.push(i));
    images.forEach(im => { im.tag = ''; });
    window.__dfDental.apply('rct4');
    return { n: images.length, tags: images.map(im => im.tag) };
  });
  ok('影像少於格數時不會多生面板', fewer.n === 2, `${fewer.n} 個`);
  ok('只填得到的前 2 格', JSON.stringify(fewer.tags) === JSON.stringify(['術前 PA','工作長度']),
     fewer.tags.join(' · '));

  // 間距快捷:貼齊 / 留空隙
  const gaps = await page.evaluate(() => {
    window.__dfDental.setGap(0);
    const tight = [document.getElementById('gap-h').value, document.getElementById('gap-v').value];
    window.__dfDental.setGap(6);
    const loose = [document.getElementById('gap-h').value, document.getElementById('gap-v').value];
    return { tight, loose };
  });
  ok('「貼齊」把兩個方向的間距設為 0', gaps.tight.join(',') === '0,0', gaps.tight.join('×'));
  ok('「留空隙」設回正值', gaps.loose.every(v => parseInt(v) > 0), gaps.loose.join('×'));

  /* 修正 2 的回歸測試:逐條間距覆寫必須被重設。
     沒有這一條,使用者把某一條間距改成 40px 之後,套任何範本那一條都還是
     40px —— 範本設的間距對它沒有作用,而且看不出為什麼。 */
  /* 覆蓋既有標籤前要先問。病例做到一半被範本清掉,比沒有範本更糟。
     (Playwright 預設會自動取消 dialog,所以「不接 dialog」＝使用者按取消) */
  await page.evaluate(() => { images.forEach((im,i) => { im.tag = '我自己打的'+i; }); });
  const dismissed = await page.evaluate(() => {
    window.__dfDental.apply('rct4');                 // confirm 回 false → 應該整個放棄
    return images.map(im => im.tag);
  });
  ok('有既有標籤時按取消 → 一個字都沒被改',
     dismissed.every((t,i) => t === '我自己打的'+i), dismissed.join(' · '));
  page.once('dialog', d => d.accept());
  const accepted = await page.evaluate(() => {
    window.__dfDental.apply('rct4');
    return images.map(im => im.tag);
  });
  ok('按確定才覆蓋', accepted[0] === '術前 PA', accepted.join(' · '));

  const stale = await page.evaluate(() => {
    images.forEach(im => { im.tag = ''; });          // 先清掉,才不會被確認框擋住
    // 模擬使用者開了進階間距並改掉第一條
    advancedSpacing = true;
    const asEl = document.getElementById('advanced-spacing'); if (asEl) asEl.checked = true;
    colGaps = [40];
    const before = { adv: advancedSpacing, gaps: colGaps && colGaps.slice() };
    window.__dfDental.apply('rct4');
    const afterDental = { adv: advancedSpacing, gaps: colGaps };
    // 上游的內建範本按鈕走的是 applyTemplate(),由 fixes.js 包起來
    advancedSpacing = true; colGaps = [40];
    if (asEl) asEl.checked = true;
    applyTemplate('nature2x2');
    const afterBuiltin = { adv: advancedSpacing, gaps: colGaps };
    return { before, afterDental, afterBuiltin };
  });
  ok('前置條件:覆寫確實設得進去', stale.before.adv === true && stale.before.gaps[0] === 40);
  ok('牙科範本會清掉逐條間距覆寫',
     stale.afterDental.adv === false && stale.afterDental.gaps === null);
  ok('上游內建範本也被補上同樣的重設(fixes.js 修正 2)',
     stale.afterBuiltin.adv === false && stale.afterBuiltin.gaps === null);
  const fixList = await page.evaluate(() => window.__dfFixes && window.__dfFixes.applied);
  ok('修正清單含這一條', Array.isArray(fixList) &&
     fixList.includes('apply-template-resets-gutter-overrides'), (fixList || []).join(', '));

  console.log('\n— 上游快照必須維持原封不動 —');
  const snap = path.join(__dirname, '..', 'apps', 'dentfigure', 'upstream', 'figurelab', 'figure_lab.html');
  const snapSrc = fs.readFileSync(snap, 'utf8');
  ok('快照沒有被掛上翻譯層', !snapSrc.includes('i18n-zh-TW.js'));
  ok('快照沒有被加上登入守衛', !snapSrc.includes('nckuh_endo_authed'));
  ok('快照標題仍是上游原文', snapSrc.includes('<title>FigureLab</title>'));
  ok('快照沒有被掛上行為修正層', !snapSrc.includes('fixes.js'));
  ok('快照沒有被掛上功能精簡層', !snapSrc.includes('trim-features.js'));
  ok('快照沒有被掛上隱私層', !snapSrc.includes('privacy.js'));
  ok('快照沒有被掛上牙科範本層', !snapSrc.includes('dental-templates.js'));
  const appSrc = fs.readFileSync(path.join(__dirname,'..','apps','dentfigure','index.html'), 'utf8');
  const dl = appSrc.split('\n').length - snapSrc.split('\n').length;
  ok('index.html 與快照只差掛載用的那幾行', dl >= 1 && dl <= 7, `多 ${dl} 行`);

  console.log('\n— 編碼(中文化最容易踩的坑)—');
  const i18nBuf = fs.readFileSync(path.join(__dirname,'..','apps','dentfigure','i18n-zh-TW.js'));
  ok('i18n 檔沒有 UTF-8 BOM', !(i18nBuf[0]===0xEF && i18nBuf[1]===0xBB && i18nBuf[2]===0xBF));
  let validUtf8 = true;
  try { new TextDecoder('utf-8', { fatal: true }).decode(i18nBuf); } catch(e){ validUtf8 = false; }
  ok('i18n 檔是合法 UTF-8', validUtf8);
  // CP1252 誤讀 UTF-8 的典型殘骸:â€” Â· ä¸­ 之類
  ok('i18n 檔沒有 mojibake', !/Ã[-¿]|â€|Â[ -¿]/.test(i18nBuf.toString('utf8')));

  ok('全程沒有 JS 錯誤', errs.length === 0, errs.slice(0,3).join(' | ') || '無');

  await browser.close();
  console.log(`\n通過 ${pass} 項，失敗 ${fail} 項`);
  process.exit(fail ? 1 : 0);
})();
