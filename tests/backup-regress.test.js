/* 回歸：這次把備份重構成 buildArchive({caseId})，需確認整包備份／還原與相關功能未受影響 */
const { chromium } = require('playwright-core');
const { URL, LOGIN, chromePath, OUT: SP } = require('./env');
const { execSync } = require('child_process');
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
      const c = document.createElement('canvas'); c.width=400; c.height=300;
      const g = c.getContext('2d'); g.fillStyle=`hsl(${i*70},50%,50%)`; g.fillRect(0,0,400,300);
      for(let x=0;x<200;x+=4){ g.fillStyle=(x%8===0)?'#000':'#fff'; g.fillRect(x,0,4,300); }
      const blob = await new Promise(r => c.toBlob(r,'image/jpeg',0.9));
      files.push(new File([blob], tag+i+'.jpg', {type:'image/jpeg'}));
    }
    const dt = new DataTransfer(); files.forEach(f => dt.items.add(f));
    const inp = document.getElementById('fileIn'); inp.files = dt.files; inp.dispatchEvent(new Event('change'));
  }, {n, tag});

  console.log('— 建立含病例、標記、組圖專案、設定的完整資料 —');
  await addPhotos(2, 'N');
  await page.waitForFunction(() => state.photos.length === 2);
  prompts = ['CASE-A', '測試備註'];
  await page.click('#btnCaseNew');
  await page.waitForFunction(() => state.cases.length === 1);
  await addPhotos(2, 'C');
  await page.waitForFunction(() => state.photos.length === 4);
  // 標記
  await page.click('#libGrid .thumb >> nth=0');
  await page.waitForSelector('#vEdit.on');
  const bx = await page.locator('#edCanvas').boundingBox();
  await page.mouse.click(bx.x+bx.width/2, bx.y+bx.height/2);
  await page.waitForFunction(() => cur().markers.length === 1);
  // 設定（診所名）
  await page.click('#btnSet'); await page.waitForSelector('#setModal.on');
  await page.fill('#setClinic', 'NCKUH ENDO'); await page.click('#btnSetOk');
  // 組圖專案
  await page.click('#tabGrid');
  await page.click('#pickGrid .thumb >> nth=0');
  await page.click('#pickGrid .thumb >> nth=1');
  await page.locator('.sel-row >> nth=0').locator('input').fill('術前');
  prompts = ['回歸專案'];
  await page.click('#btnProjSave');
  await page.waitForFunction(() => document.querySelectorAll('#projList .proj-row').length === 1);
  await page.click('#tabLib');
  await page.waitForTimeout(800);
  ok('資料齊備（4 張／1 病例／1 專案／設定）', await page.evaluate(() =>
    state.photos.length===4 && state.cases.length===1 && settings.clinic==='NCKUH ENDO'));

  console.log('— 整包備份（重構後） —');
  const dlP = page.waitForEvent('download', { timeout: 20000 });
  await page.click('#btnBackup');
  const zp = SP + '/regress-full.zip';
  await (await dlP).saveAs(zp);
  const m = JSON.parse(execSync(`python3 -c "
import zipfile,sys
z=zipfile.ZipFile('${zp}')
sys.stdout.write(z.read('backup.json').decode())
"`).toString());
  ok('含 4 張照片', m.photos.length === 4, `${m.photos.length}`);
  ok('含病例', (m.cases||[]).length === 1);
  ok('含組圖專案', (m.projects||[]).length === 1, `${(m.projects||[]).length}`);
  ok('含設定（診所名）', m.settings && m.settings.clinic === 'NCKUH ENDO');
  ok('含標記', m.photos.some(p => (p.markers||[]).length === 1));
  ok('含組圖標題', m.photos.some(p => p.title === '術前'));
  ok('scope=all', m.scope === 'all');

  console.log('— 清空後還原 —');
  await page.evaluate(() => new Promise(r => { if (window.idb) { idb.close(); idb=null; } const q=indexedDB.deleteDatabase('caseMarker'); q.onsuccess=q.onerror=q.onblocked=()=>r(); }));
  await page.reload();
  await page.waitForFunction(() => typeof state !== 'undefined');
  await page.waitForTimeout(500);
  ok('清空成功', await page.evaluate(() => state.photos.length===0 && state.cases.length===0));
  await page.setInputFiles('#restoreIn', zp);
  await page.waitForFunction(() => state.photos.length === 4, null, { timeout: 25000 });
  await page.waitForTimeout(900);
  ok('還原 4 張照片', true);
  ok('還原病例與備註', await page.evaluate(() => state.cases.length===1 && state.cases[0].code==='CASE-A' && (state.cases[0].note||'').includes('測試備註')));
  ok('還原照片歸屬', await page.evaluate(() => { const c=state.cases[0]; return photosOfCase(c.id).length===2; }));
  ok('還原標記', await page.evaluate(() => state.photos.some(p => p.markers.length===1)));
  await page.click('#tabGrid');
  await page.waitForFunction(() => document.querySelectorAll('#projList .proj-row').length >= 1, null, { timeout: 8000 });
  ok('還原組圖專案', (await page.textContent('#projList .proj-row .pname')).includes('回歸專案'));
  await page.click('#tabLib');

  console.log('— v2.0 功能仍在 —');
  ok('匯入尺寸設定預設 2560', await page.evaluate(() => settings.importMax === 2560));
  ok('儲存空間可查詢', await page.evaluate(() => refreshStorage().then(s => !!s)));
  ok('病例備註顯示', await (async()=>{ await page.click('.case-chip:has-text("CASE-A")'); return page.locator('#caseNote').isVisible(); })());
  await page.click('.case-chip[data-case=all]');
  await page.click('#btnSortMode');
  ok('排序模式可進入', await page.evaluate(() => state.sortMode === true));
  await page.click('#btnSortDone');
  // 復原快照不含 base64
  await page.click('#libGrid .thumb >> nth=0');
  await page.waitForSelector('#vEdit.on');
  await page.evaluate(() => { const p=cur(); for(let i=0;i<5;i++) pushUndo(p); });
  ok('復原快照不含 srcData', await page.evaluate(() => cur().undo.every(u => !u.srcData)));
  // 遮蔽仍可用
  await page.click('.tool[data-mode=mask]');
  ok('遮蔽工具可開啟', await page.locator('#maskBar').evaluate(el => el.classList.contains('on')));
  await page.click('#btnMaskNo');
  // 匯出
  await page.evaluate(() => document.getElementById('expImg').removeAttribute('src'));
  await page.click('#btnExport');
  await page.waitForSelector('#expModal.on');
  await page.waitForFunction(() => document.getElementById('expImg').naturalWidth > 0);
  ok('單張匯出正常', true);
  await page.click('#btnCloseExp');

  console.log(`\n結果：${pass} 通過, ${fail} 失敗`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('SCRIPT ERROR:', e); process.exit(1); });
