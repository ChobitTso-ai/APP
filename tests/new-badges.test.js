const { chromium } = require('playwright-core');
const { URL, LOGIN, chromePath, OUT: SP } = require('./env');
let pass = 0, fail = 0;
function ok(n, c, d){ if(c){pass++;console.log('  ✓',n+(d?'  → '+d:''));} else {fail++;console.log('  ✗ FAIL:',n+(d?'  → '+d:''));} }

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath() });
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => { fail++; console.log('  ✗ PAGE ERROR:', e.message); });
  let prompts = [];
  page.on('dialog', async d => {
    if(d.type()==='prompt'){ await d.accept(prompts.length ? prompts.shift() : ''); } else await d.accept();
  });
  await page.goto(LOGIN);
  await page.evaluate(() => localStorage.setItem('nckuh_endo_authed','1'));
  await page.goto(URL);
  await page.evaluate(() => new Promise(r => { if (window.idb) { idb.close(); idb=null; } const q=indexedDB.deleteDatabase('caseMarker'); q.onsuccess=q.onerror=q.onblocked=()=>r(); }));
  await page.evaluate(() => { const k=localStorage.getItem('nckuh_endo_authed'); localStorage.clear(); localStorage.setItem('nckuh_endo_authed', k); });
  await page.reload();
  await page.waitForFunction(() => typeof state !== 'undefined');

  const addPhotos = (n, tag) => page.evaluate(async ({n, tag}) => {
    const files = [];
    for(let i=0;i<n;i++){
      const c = document.createElement('canvas'); c.width=300; c.height=200;
      const g = c.getContext('2d'); g.fillStyle=`hsl(${i*70},50%,50%)`; g.fillRect(0,0,300,200);
      const blob = await new Promise(r => c.toBlob(r,'image/jpeg',0.9));
      files.push(new File([blob], tag+i+'.jpg', {type:'image/jpeg'}));
    }
    const dt = new DataTransfer(); files.forEach(f => dt.items.add(f));
    const inp = document.getElementById('fileIn'); inp.files = dt.files; inp.dispatchEvent(new Event('change'));
  }, {n, tag});

  const hasBadge = id => page.evaluate(i => {
    const el = document.getElementById(i);
    if(!el) return null;
    return el.classList.contains('is-new') &&
           getComputedStyle(el, '::after').content !== 'none';
  }, id);

  console.log('— 首次開啟：新功能有徽章 —');
  ok('🦷 牙齒對齊 有「新」徽章', await hasBadge('btnTeeth'));
  ok('提示列顯示', await page.locator('#newHint').isVisible());
  const hintTxt = await page.textContent('#newHintTxt');
  ok('提示列列出新功能名稱', hintTxt.includes('匯出此病例') && hintTxt.includes('牙齒對齊'), hintTxt);
  ok('舊版（< NEW_SINCE）功能不再提示', !hintTxt.includes('照片排序') && !(await hasBadge('btnSortMode')), hintTxt);

  console.log('— 徽章是真的畫出來（::after 內容） —');
  const badgeContent = await page.evaluate(() =>
    getComputedStyle(document.getElementById('btnTeeth'), '::after').content);
  ok('徽章 ::after 內容為「新」', badgeContent.includes('新'), badgeContent);

  console.log('— 隱藏的按鈕也會有徽章（選定病例後才出現） —');
  await addPhotos(2, 'A');
  await page.waitForFunction(() => state.photos.length === 2);
  prompts = ['CASE-X', ''];
  await page.click('#btnCaseNew');
  await page.waitForFunction(() => state.cases.length === 1);
  ok('📤 匯出此病例 出現後帶徽章', await hasBadge('btnCaseExport'));

  console.log('— 用過一次就消失 —');
  await page.click('.case-chip[data-case=all]');
  await page.click('#libGrid .thumb >> nth=0');
  await page.waitForSelector('#vEdit.on');
  await page.click('#btnTeeth');
  await page.waitForSelector('#geoModal.on');
  await page.click('#btnGeoNo');
  ok('點過「牙齒對齊」後徽章消失', !(await hasBadge('btnTeeth')));
  ok('其他功能的徽章仍在', await hasBadge('btnCaseExport'));
  await page.click('#tabLib');
  const hint2 = await page.textContent('#newHintTxt');
  ok('提示列同步移除已用過的項目', !hint2.includes('牙齒對齊') && hint2.includes('匯出此病例'), hint2);

  console.log('— 重新整理後仍記得 —');
  await page.evaluate(async () => { flushNow(); await new Promise(r => setTimeout(r, 900)); });
  await page.reload();
  await page.waitForFunction(() => typeof state !== 'undefined');
  await page.waitForTimeout(600);
  ok('重新整理後「牙齒對齊」仍無徽章（已記住）', !(await hasBadge('btnTeeth')));
  ok('未用過的仍有徽章', await page.evaluate(() => unseenFeatures().some(f => f.el === 'btnCaseExport')));

  console.log('— 提示列可關閉且不再出現 —');
  ok('提示列還在', await page.locator('#newHint').isVisible());
  await page.click('#newHintX');
  ok('關閉後隱藏', !(await page.locator('#newHint').isVisible()));
  await page.reload();
  await page.waitForFunction(() => typeof state !== 'undefined');
  await page.waitForTimeout(500);
  ok('重新整理後不再顯示提示列', !(await page.locator('#newHint').isVisible()));
  ok('但按鈕徽章仍在（提示與徽章互相獨立）', await page.evaluate(() => {
    // 選到病例才會顯示匯出鈕
    return unseenFeatures().some(f => f.el === 'btnCaseExport');
  }));

  console.log('— 回歸：核心功能不受影響 —');
  await page.click('#tabLib');
  await page.click('.case-chip[data-case=all]');   // 照片都在「未分類」，先切回全部
  const diag = await page.evaluate(() => ({ photos: state.photos.length, cases: state.cases.length, cur: state.curCase, thumbs: document.querySelectorAll('#libGrid .thumb').length }));
  ok('照片仍在（重新整理後還原）', diag.photos === 2, JSON.stringify(diag));
  if(diag.photos === 0){ await addPhotos(1, 'R'); await page.waitForFunction(() => state.photos.length >= 1); await page.click('.case-chip[data-case=all]'); }
  await page.click('#libGrid .thumb >> nth=0');
  await page.waitForSelector('#vEdit.on');
  const bx = await page.locator('#edCanvas').boundingBox();
  await page.mouse.click(bx.x + bx.width/2, bx.y + bx.height/2);
  await page.waitForFunction(() => cur().markers.length === 1);
  ok('標記功能正常', true);
  await page.evaluate(() => document.getElementById('expImg').removeAttribute('src'));
  await page.click('#btnExport');
  await page.waitForSelector('#expModal.on');
  await page.waitForFunction(() => document.getElementById('expImg').naturalWidth > 0);
  ok('匯出正常', true);
  await page.click('#btnCloseExp');
  await page.click('#tabLib');
  await page.screenshot({ path: SP + '/v22-badges.png' });

  console.log('— 切到背景會立刻補寫（避免延遲存檔遺失） —');
  const bg = await page.evaluate(async () => {
    const p = state.photos[0];
    p.name = 'BG_FLUSH_TEST';
    markDirty(p);                                   // 排定 400ms 後才寫
    const pendingBefore = pendingSaveCount();
    document.dispatchEvent(new Event('visibilitychange'));  // 模擬切到背景
    await new Promise(r => setTimeout(r, 700));
    return { pendingBefore: pendingBefore, pendingAfter: pendingSaveCount() };
  });
  ok('變更當下有待存資料', bg.pendingBefore >= 1, `${bg.pendingBefore} 筆`);
  ok('轉入背景後立刻寫入完成', bg.pendingAfter === 0, `剩 ${bg.pendingAfter} 筆`);
  await page.reload();
  await page.waitForFunction(() => state.photos.length >= 1, null, { timeout: 20000 });
  ok('背景補寫的內容確實入庫', await page.evaluate(() => state.photos.some(p => p.name === 'BG_FLUSH_TEST')));

  console.log('— [hidden] 全域規則對各類元件都生效 —');
  const hiddenOk = await page.evaluate(() => {
    const ids = ['newHint','saveWarn','btnAssign','btnSelCancel','btnSortDone'];
    return ids.map(id => {
      const el = document.getElementById(id);
      if(!el) return [id, 'missing'];
      el.hidden = true;
      return [id, getComputedStyle(el).display];
    });
  });
  hiddenOk.forEach(([id, disp]) => ok(`${id} 設 hidden 後 display 為 none`, disp === 'none', disp));

  console.log(`\n結果：${pass} 通過, ${fail} 失敗`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('SCRIPT ERROR:', e); process.exit(1); });
