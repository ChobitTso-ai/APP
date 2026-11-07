/* v2.8 版面：手機＝底部分類工具列（A）／寬螢幕＝側邊導覽軌＋工具欄＋屬性面板（E）
   兩者共用同一份 DOM，只靠 CSS 切換——所以既有測試（走桌機路徑）不用改。這裡驗證新版面本身。 */
const { chromium } = require('playwright-core');
const { URL, LOGIN, chromePath, OUT } = require('./env');
let pass = 0, fail = 0;
function ok(n, c, d){ if(c){pass++;console.log('  ✓',n+(d?'  → '+d:''));} else {fail++;console.log('  ✗ FAIL:',n+(d?'  → '+d:''));} }
const inView = (b, w, h) => b && b.x >= -0.5 && b.y >= -0.5 && b.x + b.width <= w + 0.5 && b.y + b.height <= h + 0.5;

async function boot(ctx){
  const page = await ctx.newPage();
  page.on('pageerror', e => { fail++; console.log('  ✗ PAGE ERROR:', e.message); });
  page.on('dialog', async d => { await d.accept(); });
  await page.goto(LOGIN);
  await page.evaluate(() => localStorage.setItem('nckuh_endo_authed','1'));
  await page.goto(URL);
  await page.evaluate(() => new Promise(r => { if (window.idb) { idb.close(); idb=null; } const q=indexedDB.deleteDatabase('caseMarker'); q.onsuccess=q.onerror=q.onblocked=()=>r(); }));
  await page.evaluate(() => { const k=localStorage.getItem('nckuh_endo_authed'); localStorage.clear(); localStorage.setItem('nckuh_endo_authed', k); });
  await page.reload();
  await page.waitForFunction(() => typeof state !== 'undefined');
  await page.evaluate(async () => {
    const files = [];
    for(let i=0;i<3;i++){
      const c = document.createElement('canvas'); c.width = 800; c.height = 600;
      const g = c.getContext('2d'); g.fillStyle = `hsl(${i*100},45%,52%)`; g.fillRect(0,0,800,600);
      g.fillStyle = '#fff'; g.fillRect(250,200,300,200);
      const blob = await new Promise(r => c.toBlob(r, 'image/png'));
      files.push(new File([blob], ['RCT-16_正面','RCT-16_右側','RCT-16_左側'][i] + '.png', { type:'image/png' }));
    }
    const dt = new DataTransfer(); files.forEach(f => dt.items.add(f));
    const inp = document.getElementById('fileIn'); inp.files = dt.files; inp.dispatchEvent(new Event('change'));
  });
  await page.waitForFunction(() => state.photos.length === 3, null, { timeout: 30000 });
  return page;
}
async function openEdit(page){
  await page.evaluate(() => { document.querySelector('#libGrid .thumb').click(); });
  await page.waitForSelector('#vEdit.on');
  await page.waitForTimeout(150);
}
const noHOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath() });

  /* ════════════════ 手機（390×844）＝ A ════════════════ */
  console.log('════ 手機 390×844 ════');
  const mctx = await browser.newContext({ viewport:{ width:390, height:844 }, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  const m = await boot(mctx);

  console.log('— 照片庫：底部導覽列（Material 式） —');
  const nav = await m.locator('nav').boundingBox();
  ok('導覽列釘在畫面最下面', Math.abs(nav.y + nav.height - 844) < 2 && nav.width >= 389, JSON.stringify({ y:Math.round(nav.y), h:Math.round(nav.height) }));
  ok('導覽列沒有圓角（舊樣式殘留）', await m.evaluate(() => getComputedStyle(document.querySelector('nav')).borderRadius === '0px'));
  ok('三個主頁面都在（照片庫／標記／組圖）', (await m.locator('nav button:visible').count()) === 3);
  ok('目前頁面有膠囊指示', await m.evaluate(() => document.querySelector('#tabLib .np') && getComputedStyle(document.querySelector('#tabLib .np')).backgroundColor !== 'rgba(0, 0, 0, 0)'));
  ok('版權宣告仍在畫面上，而且沒被導覽列蓋住',
     await m.evaluate(() => { const f = document.querySelector('footer'), n = document.querySelector('nav').getBoundingClientRect(); const r = f.getBoundingClientRect();
       return /©Tso KY - All Rights Reserved/.test(f.textContent) && r.bottom <= n.top + 1 && r.height > 0; }),
     await m.evaluate(() => { const n = document.querySelector('nav').getBoundingClientRect(), r = document.querySelector('footer').getBoundingClientRect(); return `導覽列高 ${Math.round(n.height)}px，頁尾底 ${Math.round(r.bottom)} / 導覽列頂 ${Math.round(n.top)}`; }));
  ok('頁面沒有橫向捲動', await noHOverflow(m));
  await m.screenshot({ path: OUT + '/v28-phone-lib.png' });

  console.log('— 進入標記畫面：頂列＋底部分類列 —');
  await openEdit(m);
  ok('頂部標題列隱藏（改用標記畫面自己的上方列）', await m.evaluate(() => getComputedStyle(document.querySelector('header')).display === 'none'));
  ok('底部導覽列在標記畫面隱藏（由分類列取代）', await m.locator('nav').isHidden());
  const ex = await m.locator('#btnExport').boundingBox(), un = await m.locator('#btnUndo').boundingBox();
  ok('★「匯出」不用滑就看得到（原本藏在橫向捲動的工具列最右邊）', inView(ex, 390, 844), JSON.stringify({ x:Math.round(ex.x), w:Math.round(ex.width) }));
  ok('★「復原」不用滑就看得到', inView(un, 390, 844));
  ok('版權宣告在標記畫面隱藏（但頁面上仍存在）', await m.evaluate(() => getComputedStyle(document.querySelector('footer')).display === 'none' && /©Tso KY/.test(document.querySelector('footer').textContent)));
  ok('標題顯示照片名稱與張數', (await m.textContent('#edTitle')) === 'RCT-16_正面' && /照片 1 \/ 3/.test(await m.textContent('#edSub')), await m.textContent('#edSub'));
  const cvh = (await m.locator('.canvas-wrap').boundingBox()).height;
  ok('照片區佔螢幕一半以上', cvh >= 844 * 0.5, Math.round(cvh) + 'px');
  ok('頁面沒有橫向捲動', await noHOverflow(m));

  console.log('— 底部分類列：5 個類別，點類別才展開該類工具 —');
  ok('分類列有 5 個類別', (await m.locator('.dk').count()) === 5);
  ok('預設是「標記」', await m.evaluate(() => document.querySelector('.dk.on').getAttribute('data-g') === 'mark'));
  const vis = async () => m.evaluate(() => Array.from(document.querySelectorAll('.tb')).filter(b => b.getBoundingClientRect().width > 0 && getComputedStyle(b).display !== 'none').map(b => b.id || b.getAttribute('data-mode')));
  const v0 = await vis();
  ok('標記類別只顯示 5 個工具', v0.join(',') === 'red,blue,yellow,text,select', v0.join(','));
  const tiles = await m.locator('.tg.on .tb').evaluateAll(els => els.map(e => Math.round(e.getBoundingClientRect().width)));
  ok('工具磚平均分配（各佔 1/5 寬）', tiles.every(w => Math.abs(w - 78) <= 2), tiles.join(','));
  const expect = { adjust:['crop','tilt','btnRotL','btnRotR'], mask:['mask'], align:['btnAlign','btnTeeth'], more:['btnSet','btnToGrid'] };
  for(const g of Object.keys(expect)){
    await m.click(`.dk[data-g="${g}"]`);
    const v = await vis();
    ok(`「${g}」類別的工具都在、而且都在畫面內`, v.join(',') === expect[g].join(','), v.join(','));
    const allIn = await m.locator('.tg.on .tb').evaluateAll((els, vw) => els.every(e => { const b = e.getBoundingClientRect(); return b.x >= 0 && b.x + b.width <= vw; }), 390);
    ok(`  └ 沒有任何一顆被切掉或要橫向滑`, allIn);
  }
  const allTools = await m.evaluate(() => document.querySelectorAll('.tb').length);
  ok('原本工具列的工具一顆都沒少（13 顆＋「組圖」捷徑）', allTools === 14, allTools + '');

  console.log('— 切類別不會誤新增標記 —');
  await m.click('.dk[data-g="mark"]');
  await m.click('.tool[data-mode="blue"]');
  ok('標記類別選了「觀察」', await m.evaluate(() => state.mode === 'blue'));
  await m.click('.dk[data-g="adjust"]');
  ok('離開標記類別後，模式改成「移動」', await m.evaluate(() => state.mode === 'select'));
  const bx = await m.locator('#edCanvas').boundingBox();
  const n0 = await m.evaluate(() => cur().markers.length);
  await m.mouse.click(bx.x + bx.width/2, bx.y + bx.height/2);
  ok('在調整類別點照片，不會新增標記', await m.evaluate(n => cur().markers.length === n, n0));
  await m.click('.dk[data-g="mark"]');
  ok('回到標記類別，還原剛才選的「觀察」', await m.evaluate(() => state.mode === 'blue'));
  await m.waitForTimeout(450);          // 既有行為：空白處 350ms 內連點同一處＝雙擊還原縮放、會吞掉第二下；真人切類別不會這麼快
  await m.mouse.click(bx.x + bx.width/2, bx.y + bx.height/2);
  ok('回到標記類別後點照片會新增標記', await m.evaluate(n => cur().markers.length === n + 1, n0));
  ok('新增後有選取中的標記，浮動列出現', await m.evaluate(() => state.selMk >= 0 && document.getElementById('markerBar').classList.contains('on')));
  const mb = await m.locator('#markerBar').boundingBox();
  ok('浮動標記列的按鈕不再被擠成直排（文字不折行）', await m.evaluate(() => Array.from(document.querySelectorAll('#markerBar .btn')).every(b => b.getBoundingClientRect().height < 56)));
  ok('浮動標記列完整放得下（不用橫向捲動）', await m.evaluate(() => { const f = document.getElementById('markerBar'); return f.scrollWidth <= f.clientWidth + 1; }));
  await m.click('.dk[data-g="adjust"]');
  ok('離開標記類別會取消選取，浮動列跟著收起', await m.evaluate(() => state.selMk === -1 && !document.getElementById('markerBar').classList.contains('on')));
  await m.click('.dk[data-g="mark"]');

  console.log('— 進行到一半的裁切，切類別等於取消 —');
  await m.click('.dk[data-g="adjust"]');
  await m.click('.tool[data-mode="crop"]');
  ok('進入裁切', await m.evaluate(() => state.mode === 'crop' && !!state.crop));
  await m.click('.dk[data-g="align"]');
  ok('切到別的類別，裁切被取消', await m.evaluate(() => state.mode === 'select' && !state.crop));
  await m.click('.dk[data-g="mark"]');

  console.log('— 新功能徽章：工具被收起來，要掛在類別上 —');
  ok('「對齊」類別有紅點（牙齒對齊是新功能、還沒看過）', await m.evaluate(() => document.querySelector('.dk[data-g="align"]').classList.contains('has-new')));
  ok('其他類別沒有紅點', await m.evaluate(() => !document.querySelector('.dk[data-g="mark"]').classList.contains('has-new') && !document.querySelector('.dk[data-g="adjust"]').classList.contains('has-new')));
  await m.click('.dk[data-g="align"]');
  ok('展開後，牙齒對齊本身有「新」徽章', await m.evaluate(() => document.getElementById('btnTeeth').classList.contains('is-new')));
  await m.click('#btnTeeth'); await m.waitForSelector('#geoModal.on'); await m.click('#btnGeoNo');
  ok('點過之後，類別上的紅點消失', await m.evaluate(() => !document.querySelector('.dk[data-g="align"]').classList.contains('has-new')));
  await m.click('.dk[data-g="mark"]');

  console.log('— 復原在頂列 —');
  const n1 = await m.evaluate(() => cur().markers.length);
  await m.mouse.click(bx.x + bx.width*0.3, bx.y + bx.height*0.4);
  ok('新增一個標記後復原可按', await m.locator('#btnUndo').isEnabled());
  await m.click('#btnUndo');
  ok('按頂列的復原，標記減回去', await m.evaluate(n => cur().markers.length === n, n1));

  console.log('— 上一張／下一張（畫布左上的膠囊） —');
  ok('膠囊顯示 1 / 3', (await m.textContent('#edName')) === '1 / 3');
  await m.click('#btnNext');
  ok('下一張 → 第 2 張', (await m.textContent('#edName')) === '2 / 3' && (await m.textContent('#edTitle')) === 'RCT-16_右側');
  await m.click('#btnPrev');
  ok('上一張 → 回到第 1 張', (await m.textContent('#edName')) === '1 / 3');
  const pg = await m.locator('.pager').boundingBox();
  ok('膠囊在畫布裡面（不會跟下方工具搶位置）', pg.y >= (await m.locator('.canvas-wrap').boundingBox()).y);

  console.log('— 更多：設定、組圖 —');
  await m.screenshot({ path: OUT + '/v28-phone-edit.png' });
  await m.click('.dk[data-g="more"]');
  await m.click('#btnSet'); await m.waitForSelector('#setModal.on');
  ok('「設定」可以開', true);
  await m.click('#btnSetOk');
  await m.click('#btnToGrid');
  ok('「組圖」捷徑會到組圖頁', await m.evaluate(() => document.getElementById('vGrid').classList.contains('on') && document.body.getAttribute('data-view') === 'grid'));
  ok('組圖頁有底部導覽列', await m.locator('nav').isVisible());
  ok('組圖頁沒有橫向捲動', await noHOverflow(m));
  await m.screenshot({ path: OUT + '/v28-phone-grid.png' });
  await m.click('#tabEdit');
  ok('從導覽列回「標記」', await m.evaluate(() => document.getElementById('vEdit').classList.contains('on')));
  await m.click('#btnEdBack');
  ok('返回箭頭回照片庫', await m.evaluate(() => document.getElementById('vLib').classList.contains('on') && document.body.getAttribute('data-view') === 'lib'));
  await mctx.close();

  /* ════════════════ 橫放的手機（844×390） ════════════════ */
  console.log('════ 橫放手機 844×390 ════');
  const lctx = await browser.newContext({ viewport:{ width:844, height:390 }, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  const l = await boot(lctx);
  await openEdit(l);
  const lcv = await l.locator('.canvas-wrap').boundingBox();
  ok('橫放時仍是手機版面（分類列在、側欄不在）', await l.locator('.dock').isVisible() && await l.locator('.insp').isHidden());
  ok('橫放時把高度留給照片（≥ 150px）', lcv.height >= 150, Math.round(lcv.height) + 'px');
  ok('橫放時匯出與復原在畫面內', inView(await l.locator('#btnExport').boundingBox(), 844, 390) && inView(await l.locator('#btnUndo').boundingBox(), 844, 390));
  ok('橫放時頁面沒有橫向捲動', await noHOverflow(l));
  await l.screenshot({ path: OUT + '/v28-phone-landscape.png' });
  await lctx.close();

  /* ════════════════ 桌機（1280×800）＝ E ════════════════ */
  console.log('════ 桌機 1280×800 ════');
  const dctx = await browser.newContext({ viewport:{ width:1280, height:800 }, deviceScaleFactor:1.5 });
  const d = await boot(dctx);
  console.log('— 左側導覽軌 —');
  const hb = await d.locator('header').boundingBox();
  ok('頂列變成左側導覽軌（窄、貫穿整個高度）', hb.x === 0 && hb.width >= 80 && hb.width <= 90 && hb.height >= 799, `${Math.round(hb.width)}×${Math.round(hb.height)}`);
  const tb = await d.locator('nav button').evaluateAll(els => els.map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y)]; }));
  ok('三個頁面由上往下排在軌道裡', tb.length === 3 && tb[0][1] < tb[1][1] && tb[1][1] < tb[2][1] && tb.every(p => p[0] < 84), JSON.stringify(tb));
  ok('版本號仍看得到（部署驗證用）', (await d.textContent('.ver')) === 'v2.8' && await d.locator('.ver').isVisible());
  ok('導覽軌上不是「釘在底部」的導覽列', await d.evaluate(() => getComputedStyle(document.querySelector('nav')).position !== 'fixed'));
  ok('照片庫頁沒有橫向捲動', await noHOverflow(d));
  await d.screenshot({ path: OUT + '/v28-desktop-lib.png' });

  await openEdit(d);
  console.log('— 標記畫面：工具欄＋畫布＋屬性面板＋縮圖列 —');
  ok('分類列在寬螢幕隱藏', await d.locator('.dock').isHidden());
  ok('導覽軌在標記畫面仍在（不像手機那樣隱藏）', await d.locator('header').isVisible());
  const visD = await d.evaluate(() => Array.from(document.querySelectorAll('.tb')).filter(b => b.getBoundingClientRect().width > 0 && getComputedStyle(b).display !== 'none').length);
  ok('13 顆工具全部展開（「組圖」捷徑只給手機用）', visD === 13, visD + '');
  const geo = await d.evaluate(() => {
    const r = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
    return { tools:r('.toolbar'), cv:r('.canvas-wrap'), insp:r('.insp'), film:r('.film'), bar:r('.ed-bar') };
  });
  ok('由左到右：工具欄 → 畫布 → 屬性面板', geo.tools.right <= geo.cv.left + 0.5 && geo.cv.right <= geo.insp.left + 0.5, `${Math.round(geo.tools.right)} ≤ ${Math.round(geo.cv.left)}，${Math.round(geo.cv.right)} ≤ ${Math.round(geo.insp.left)}`);
  ok('上方列在畫布上、縮圖列在畫布下', geo.bar.bottom <= geo.cv.top + 0.5 && geo.cv.bottom <= geo.film.top + 0.5);
  ok('畫布夠大（寬 > 800）', geo.cv.width > 800, Math.round(geo.cv.width) + '×' + Math.round(geo.cv.height));
  const toolsFit = await d.evaluate(() => { const t = document.querySelector('.toolbar'); return t.scrollHeight <= t.clientHeight + 2; });
  ok('800px 高的視窗裡，13 顆工具不用捲動就全看得到', toolsFit, await d.evaluate(() => document.querySelector('.toolbar').scrollHeight + '/' + document.querySelector('.toolbar').clientHeight));
  ok('匯出與復原在上方列', inView(await d.locator('#btnExport').boundingBox(), 1280, 800) && inView(await d.locator('#btnUndo').boundingBox(), 1280, 800));
  ok('沒有手機專用的返回箭頭（導覽軌負責）', await d.locator('#btnEdBack').isHidden());
  ok('頁面沒有橫向捲動', await noHOverflow(d));

  console.log('— 屬性面板 —');
  ok('還沒有標記：顯示提示', (await d.textContent('#inspH')).includes('（0）') && await d.locator('#inspHint').isVisible() && await d.locator('#inspSel').isHidden());
  const dbx = await d.locator('#edCanvas').boundingBox();
  await d.click('.tool[data-mode="red"]');
  await d.mouse.click(dbx.x + dbx.width*0.4, dbx.y + dbx.height*0.5);
  await d.mouse.click(dbx.x + dbx.width*0.6, dbx.y + dbx.height*0.5);
  ok('標題與清單隨標記增加', (await d.textContent('#inspH')).includes('（2）') && (await d.locator('#inspList .row').count()) === 2);
  ok('剛新增的標記自動被選取，顯示編輯區', await d.locator('#inspSel').isVisible() && await d.locator('#inspList .row.on').count() === 1);
  ok('清單的類型標籤正確（需處理）', (await d.locator('#inspList .row small').first().textContent()) === '需處理');
  ok('寬螢幕不顯示畫布上的浮動標記列（屬性面板取代）', await d.evaluate(() => getComputedStyle(document.getElementById('markerBar')).display === 'none'));
  await d.click('#inspList .row >> nth=0');
  ok('點清單的列＝選取那個標記', await d.evaluate(() => state.selMk === 0));
  await d.fill('#inspText', '#16 近心齲'); await d.press('#inspText', 'Enter');
  const edited = await d.evaluate(() => ({ t: cur().markers[0].text, u: cur().undo.length }));
  ok('在面板改文字會套用到標記', edited.t === '#16 近心齲', edited.t);
  ok('改文字有進復原堆疊', edited.u >= 3, edited.u + '');
  ok('清單同步顯示新文字', (await d.locator('#inspList .row .t').first().textContent()) === '#16 近心齲');
  await d.click('#inspSw button >> nth=5');
  ok('點色塊會換顏色', await d.evaluate(() => cur().markers[0].color.toLowerCase() === '#1e88e5'));
  ok('清單的點跟著變色、類型變「觀察」', (await d.locator('#inspList .row small').first().textContent()) === '觀察');
  await d.click('#inspBack');
  ok('「最後」把標記送到最底層', await d.evaluate(() => cur().markers.length === 2 && cur().markers[0].text === '#16 近心齲' && state.selMk === 0));
  await d.click('#inspList .row >> nth=1'); await d.click('#inspFront');
  ok('「最前」把標記帶到最上層', await d.evaluate(() => state.selMk === 1));
  await d.click('#inspDone');
  ok('「完成」取消選取、編輯區收起', await d.evaluate(() => state.selMk === -1) && await d.locator('#inspSel').isHidden());
  await d.click('#inspList .row >> nth=0'); await d.click('#inspDel');
  ok('「刪除」移除標記', await d.evaluate(() => cur().markers.length === 1) && (await d.locator('#inspList .row').count()) === 1);
  await d.click('#btnUndo');
  ok('刪除後可以用上方列的復原救回來', await d.evaluate(() => cur().markers.length === 2));
  await d.click('#inspList .row >> nth=0');

  console.log('— 面板沒變就不重繪（draw() 拖曳時每一格都會呼叫） —');
  const churn = await d.evaluate(() => {
    const first = document.querySelector('#inspList .row'), film = document.querySelector('#filmStrip .th');
    for(let i=0;i<30;i++) draw();
    return document.querySelector('#inspList .row') === first && document.querySelector('#filmStrip .th') === film;
  });
  ok('連續呼叫 30 次 draw()，清單與縮圖列的 DOM 都是同一批（沒有重建）', churn);
  const keepFocus = await d.evaluate(() => { const i = document.getElementById('inspText'); i.focus(); for(let k=0;k<5;k++) draw(); return document.activeElement === i; });
  ok('輸入框有焦點時 draw() 不會把焦點搶走', keepFocus);

  console.log('— 縮圖列 —');
  ok('縮圖數＝照片數', (await d.locator('#filmStrip .th').count()) === 3);
  ok('目前這張有藍框', await d.evaluate(() => document.querySelector('#filmStrip .th.on small').textContent === 'RCT-16_正面'));
  await d.click('#filmStrip .th >> nth=2');
  ok('點縮圖切換照片', (await d.textContent('#edTitle')) === 'RCT-16_左側' && (await d.textContent('#edName')) === '3 / 3');
  ok('藍框跟著移動', await d.evaluate(() => document.querySelector('#filmStrip .th.on small').textContent === 'RCT-16_左側'));
  ok('切到另一張，屬性面板換成那張的標記', (await d.textContent('#inspH')).includes('（0）'));
  await d.click('#filmStrip .th >> nth=0');
  ok('切回來，標記還在', (await d.textContent('#inspH')).includes('（2）'));
  await d.screenshot({ path: OUT + '/v28-desktop-edit.png' });

  console.log('— 既有操作在寬螢幕仍可用 —');
  await d.click('#btnExport'); await d.waitForSelector('#expModal.on');
  ok('匯出視窗可以開', true);
  await d.click('#btnCloseExp');
  await d.click('#tabGrid');
  ok('從導覽軌切到組圖', await d.evaluate(() => document.getElementById('vGrid').classList.contains('on')));
  ok('組圖頁沒有橫向捲動', await noHOverflow(d));
  await d.screenshot({ path: OUT + '/v28-desktop-grid.png' });
  await d.click('#tabEdit');

  console.log('— 跨斷點縮放：手機 ↔ 寬螢幕 —');
  await d.setViewportSize({ width:390, height:844 });
  await d.waitForTimeout(250);
  ok('縮到手機寬度：屬性面板與縮圖列收起、分類列出現', await d.locator('.insp').isHidden() && await d.locator('.film').isHidden() && await d.locator('.dock').isVisible());
  ok('縮到手機寬度：導覽列在標記畫面隱藏', await d.locator('nav').isHidden());
  ok('縮到手機寬度：照片仍畫得出來（畫布有尺寸）', await d.evaluate(() => { const c = document.getElementById('edCanvas'); return c.width > 0 && c.height > 0; }));
  await d.setViewportSize({ width:1280, height:800 });
  await d.waitForTimeout(250);
  ok('放大回寬螢幕：屬性面板重新出現且內容完整', await d.locator('.insp').isVisible() && (await d.locator('#inspList .row').count()) === 2);
  ok('放大回寬螢幕：縮圖列重新出現', (await d.locator('#filmStrip .th').count()) === 3);
  await dctx.close();

  console.log(`\n結果：${pass} 通過, ${fail} 失敗`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('SCRIPT ERROR:', e); process.exit(1); });
