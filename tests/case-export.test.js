const { chromium } = require('playwright-core');
const { URL, LOGIN, chromePath, OUT: SP } = require('./env');
const { execSync } = require('child_process');
let pass = 0, fail = 0;
function ok(n, c, d){ if(c){pass++;console.log('  ✓',n+(d?'  → '+d:''));} else {fail++;console.log('  ✗ FAIL:',n+(d?'  → '+d:''));} }
const meta = z => JSON.parse(execSync(`python3 -c "
import zipfile,sys
z=zipfile.ZipFile('${z}')
sys.stdout.write(z.read('backup.json').decode())
"`).toString());
const names = z => execSync(`python3 -c "
import zipfile
z=zipfile.ZipFile('${z}')
print('\\n'.join(z.namelist()))
"`).toString().trim().split('\n');

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath() });
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => { fail++; console.log('  ✗ PAGE ERROR:', e.message); });
  let prompts = [], lastDialog = '';
  page.on('dialog', async d => {
    lastDialog = d.message();
    if(d.type()==='prompt'){ await d.accept(prompts.length ? prompts.shift() : ''); } else await d.accept();
  });

  await page.goto(LOGIN);
  await page.evaluate(() => localStorage.setItem('nckuh_endo_authed','1'));
  await page.goto(URL);
  await page.evaluate(() => new Promise(r => { if (window.idb) { idb.close(); idb = null; } const q = indexedDB.deleteDatabase('caseMarker'); q.onsuccess=q.onerror=q.onblocked=()=>r(); }));
  await page.reload();
  await page.waitForFunction(() => typeof state !== 'undefined');

  const addPhotos = (n, tag) => page.evaluate(async ({n, tag}) => {
    const files = [];
    for(let i=0;i<n;i++){
      const c = document.createElement('canvas'); c.width=300; c.height=200;
      const g = c.getContext('2d'); g.fillStyle=`hsl(${i*60},50%,50%)`; g.fillRect(0,0,300,200);
      g.fillStyle='#fff'; g.font='28px sans-serif'; g.fillText(tag+i, 20, 50);
      const blob = await new Promise(r => c.toBlob(r,'image/jpeg',0.9));
      files.push(new File([blob], tag+i+'.jpg', {type:'image/jpeg'}));
    }
    const dt = new DataTransfer(); files.forEach(f => dt.items.add(f));
    const inp = document.getElementById('fileIn'); inp.files = dt.files; inp.dispatchEvent(new Event('change'));
  }, {n, tag});

  console.log('— 準備：兩個病例＋未分類 —');
  await addPhotos(2, 'U');                       // 未分類 2 張
  await page.waitForFunction(() => state.photos.length === 2);
  prompts = ['RCT-16', '上顎正中根管再治療'];
  await page.click('#btnCaseNew');
  await page.waitForFunction(() => state.cases.length === 1);
  await addPhotos(3, 'A');                       // 自動歸入 RCT-16
  await page.waitForFunction(() => state.photos.length === 5);
  prompts = ['IMP-24', '植體'];
  await page.click('#btnCaseNew');
  await page.waitForFunction(() => state.cases.length === 2);
  await addPhotos(2, 'B');                       // 自動歸入 IMP-24
  await page.waitForFunction(() => state.photos.length === 7);
  ok('建立 2 病例（3＋2 張）與 2 張未分類', await page.evaluate(() => {
    const a = state.cases.find(c=>c.code==='RCT-16'), b = state.cases.find(c=>c.code==='IMP-24');
    return photosOfCase(a.id).length===3 && photosOfCase(b.id).length===2 && photosOfCase('none').length===2;
  }));

  console.log('— 匯出按鈕的顯示規則 —');
  await page.click('.case-chip[data-case=all]');
  ok('「全部」時不顯示匯出此病例', !(await page.locator('#btnCaseExport').isVisible()));
  await page.click('.case-chip[data-case=none]');
  ok('「未分類」時不顯示', !(await page.locator('#btnCaseExport').isVisible()));
  await page.click('.case-chip:has-text("RCT-16")');
  ok('選定病例時顯示', await page.locator('#btnCaseExport').isVisible());
  ok('按鈕顯示張數', (await page.textContent('#btnCaseExport')).includes('3'), await page.textContent('#btnCaseExport'));
  await page.click('#btnSelMode');
  ok('選取模式下隱藏', !(await page.locator('#btnCaseExport').isVisible()));
  await page.click('#btnSelCancel');

  console.log('— 匯出單一病例 —');
  // 先在 RCT-16 的一張照片加標記與組圖標題，確認一併帶出
  await page.click('#libGrid .thumb >> nth=0');
  await page.waitForSelector('#vEdit.on');
  const bx = await page.locator('#edCanvas').boundingBox();
  await page.mouse.click(bx.x + bx.width/2, bx.y + bx.height/2);
  await page.waitForFunction(() => cur().markers.length === 1);
  await page.click('#tabLib');
  await page.click('.case-chip:has-text("RCT-16")');
  await page.waitForTimeout(700);

  const dlP = page.waitForEvent('download', { timeout: 20000 });
  await page.click('#btnCaseExport');
  const dl = await dlP;
  const caseZip = SP + '/case-only.zip';
  await dl.saveAs(caseZip);
  const m = meta(caseZip);
  const nm = names(caseZip);
  ok('匯出檔為有效 zip 且含 backup.json', nm.includes('backup.json'));
  ok('scope 標記為 case', m.scope === 'case', m.scope);
  ok('caseCode 正確', m.caseCode === 'RCT-16', m.caseCode);
  ok('只含該病例的 3 張照片（不含其他 4 張）', m.photos.length === 3, `${m.photos.length} 張`);
  ok('zip 內照片檔數一致', nm.filter(x=>x.startsWith('photos/')).length === 3);
  ok('只帶 1 個病例（不含 IMP-24）', (m.cases||[]).length === 1 && m.cases[0].code === 'RCT-16');
  ok('照片的 caseId 都指向該病例', m.photos.every(p => p.caseId === m.cases[0].id));
  ok('標記有一併帶出', m.photos.some(p => (p.markers||[]).length === 1));
  ok('病例資料仍不含姓名／病歷號', !JSON.stringify(m.cases).match(/name|patient|chart|病歷|姓名/i));

  console.log('— 對照：整包備份仍是全部 —');
  const dlP2 = page.waitForEvent('download', { timeout: 20000 });
  await page.click('#btnBackup');
  const dl2 = await dlP2;
  const fullZip = SP + '/full.zip';
  await dl2.saveAs(fullZip);
  const m2 = meta(fullZip);
  ok('整包備份含全部 7 張', m2.photos.length === 7, `${m2.photos.length} 張`);
  ok('整包備份 scope 為 all', m2.scope === 'all', m2.scope);
  ok('整包備份含 2 個病例', (m2.cases||[]).length === 2);

  console.log('— 小編情境：另一台裝置匯入單一病例 —');
  const ctx2 = await browser.newContext({ acceptDownloads: true });
  const page2 = await ctx2.newPage();
  page2.on('pageerror', e => { fail++; console.log('  ✗ PAGE2 ERROR:', e.message); });
  let lastDialog2 = '';
  page2.on('dialog', async d => { lastDialog2 = d.message(); await d.accept(); });
  await page2.goto(LOGIN);
  await page2.evaluate(() => localStorage.setItem('nckuh_endo_authed','1'));
  await page2.goto(URL);
  await page2.waitForFunction(() => typeof state !== 'undefined');
  ok('新裝置一開始沒有任何資料', await page2.evaluate(() => state.photos.length === 0 && state.cases.length === 0));

  await page2.setInputFiles('#restoreIn', caseZip);
  await page2.waitForFunction(() => state.photos.length === 3, null, { timeout: 25000 });
  await page2.waitForTimeout(800);
  ok('匯入 3 張（只有該病例）', await page2.evaluate(() => state.photos.length === 3));
  ok('病例一併建立', await page2.evaluate(() => state.cases.length === 1 && state.cases[0].code === 'RCT-16'));
  ok('照片正確歸入該病例', await page2.evaluate(() => {
    const cid = state.cases[0].id;
    return state.photos.filter(p => p.caseId === cid).length === 3;
  }));
  ok('標記有跟著過來', await page2.evaluate(() => state.photos.some(p => p.markers.length === 1)));
  ok('備註一併帶入', await page2.evaluate(() => (state.cases[0].note||'').includes('上顎正中')));
  ok('匯入訊息說明是病例檔', /匯入病例/.test(lastDialog2), lastDialog2.slice(0,40));

  console.log('— 小編改完回傳，醫師端匯入不會重複建病例 —');
  await page2.click('.case-chip:has-text("RCT-16")');
  await page2.click('#libGrid .thumb >> nth=0');
  await page2.waitForSelector('#vEdit.on');
  const bx2 = await page2.locator('#edCanvas').boundingBox();
  await page2.click('.tool[data-mode=blue]');
  await page2.mouse.click(bx2.x + bx2.width/3, bx2.y + bx2.height/3);
  await page2.waitForFunction(() => cur().markers.length >= 1);
  await page2.click('#tabLib');
  await page2.click('.case-chip:has-text("RCT-16")');
  await page2.waitForTimeout(700);
  const dlP3 = page2.waitForEvent('download', { timeout: 20000 });
  await page2.click('#btnCaseExport');
  const dl3 = await dlP3;
  const backZip = SP + '/case-back.zip';
  await dl3.saveAs(backZip);

  const casesBefore = await page.evaluate(() => state.cases.length);
  await page.setInputFiles('#restoreIn', backZip);
  await page.waitForFunction(() => state.photos.length === 10, null, { timeout: 25000 });
  await page.waitForTimeout(900);
  ok('醫師端匯入回傳檔（照片附加，不覆蓋原有）', await page.evaluate(() => state.photos.length === 10));
  ok('不會重複建立病例（仍 2 個）', await page.evaluate(() => state.cases.length) === casesBefore, `${await page.evaluate(() => state.cases.length)} 個`);
  ok('回傳的照片歸入同一個 RCT-16', await page.evaluate(() => {
    const c = state.cases.find(x => x.code === 'RCT-16');
    return photosOfCase(c.id).length === 6;      // 原 3 ＋ 回傳 3
  }));

  console.log('— 回歸 —');
  await page.reload();
  await page.waitForFunction(() => state.photos.length === 10, null, { timeout: 25000 });
  ok('重新整理後資料完整', await page.evaluate(() => state.photos.length === 10 && state.cases.length === 2));
  await page.click('.case-chip:has-text("RCT-16")');
  await page.screenshot({ path: SP + '/v21-case-export.png' });

  console.log(`\n結果：${pass} 通過, ${fail} 失敗`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('SCRIPT ERROR:', e); process.exit(1); });
