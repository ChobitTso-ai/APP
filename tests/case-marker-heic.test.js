/* 案例標記工具 v2.7：HEIC 匯入改用 heic-to
   heic2any 的 libheif 停在 2023 年，iOS 18 拍的 24MP HEIC（含 HDR gain map）會
   ERR_LIBHEIF format not supported。那種檔做不出小的合成樣本，所以這裡用小的真 HEIC
   驗證匯入流程，再把「載入的是 heic-to」釘住。 */
const { chromium } = require('playwright-core');
const { URL, LOGIN, chromePath } = require('./env');
const fs = require('fs');
const path = require('path');
let pass = 0, fail = 0;
function ok(n, c, d){ if(c){pass++;console.log('  ✓',n+(d?'  → '+d:''));} else {fail++;console.log('  ✗ FAIL:',n+(d?'  → '+d:''));} }

// 320×240、左半紅右半藍（pillow-heif／libheif 產生，820 bytes）
const HEIC_B64 = fs.readFileSync(path.join(__dirname, 'fixtures', 'sample.heic')).toString('base64');

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath() });
  const ctx = await browser.newContext({ serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', e => { fail++; console.log('  ✗ PAGE ERROR:', e.message); });
  const dialogs = [];
  page.on('dialog', async d => { dialogs.push(d.message()); await d.accept(); });

  await page.goto(LOGIN);
  await page.evaluate(() => localStorage.setItem('nckuh_endo_authed','1'));
  await page.goto(URL);
  await page.evaluate(() => new Promise(r => { if (window.idb) { idb.close(); idb = null; } const q = indexedDB.deleteDatabase('caseMarker'); q.onsuccess=q.onerror=q.onblocked=()=>r(); }));
  await page.reload();
  await page.waitForFunction(() => typeof state !== 'undefined');

  console.log('— 延遲載入 —');
  ok('選檔框接受 .heic／.heif', await page.evaluate(() => {
    const a = document.getElementById('fileIn').accept;
    return a.includes('.heic') && a.includes('.heif');
  }));
  ok('還沒遇到 HEIC 前不載入解碼器', await page.evaluate(() =>
    typeof HeicTo === 'undefined' && !document.querySelector('script[src*="heic"]')));

  console.log('— 匯入 HEIC —');
  await page.evaluate(async (b64) => {
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const c = document.createElement('canvas'); c.width = 200; c.height = 100;
    const g = c.getContext('2d'); g.fillStyle = '#0a0'; g.fillRect(0, 0, 200, 100);
    const jpg = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.9));
    const dt = new DataTransfer();
    // type 空字串：Windows 上的 Chrome 選 .heic 就是這樣
    dt.items.add(new File([bin], 'IMG_0001.HEIC', { type: '' }));
    dt.items.add(new File([new Uint8Array([1, 2, 3, 4, 5])], 'bad.heic', { type: 'image/heic' }));
    dt.items.add(new File([jpg], 'after.jpg', { type: 'image/jpeg' }));
    const inp = document.getElementById('fileIn'); inp.files = dt.files; inp.dispatchEvent(new Event('change'));
  }, HEIC_B64);
  await page.waitForFunction(() => state.photos.length === 2
    && !document.getElementById('busyModal').classList.contains('on'), null, { timeout: 60000 });

  const names = await page.evaluate(() => state.photos.map(p => p.name).join(','));
  ok('type 空字串的 .HEIC 認得、順序照選檔順序', names === 'IMG_0001,after', names);
  ok('壞掉的 HEIC 跳出提示並點名，其餘照常加入',
    dialogs.length === 1 && /bad\.heic/.test(dialogs[0]), dialogs.join(' | '));
  ok('解碼用 heic-to（新版 libheif），沒有載入舊的 heic2any', await page.evaluate(() =>
    typeof HeicTo === 'function' && typeof heic2any === 'undefined'
    && !!document.querySelector('script[src$="vendor/heic-to.js"]')));

  const px = await page.evaluate(() => {
    const c = state.photos[0].bmp;
    const g = c.getContext('2d');
    return { w: c.width, h: c.height,
      L: [...g.getImageData(60, 120, 1, 1).data.slice(0, 3)],
      R: [...g.getImageData(260, 120, 1, 1).data.slice(0, 3)] };
  });
  const isRed = p => p[0] > 170 && p[1] < 90 && p[2] < 90;
  const isBlue = p => p[2] > 170 && p[0] < 90 && p[1] < 120;
  ok('解碼尺寸正確 320×240', px.w === 320 && px.h === 240, `${px.w}×${px.h}`);
  ok('解碼顏色正確（左紅右藍）', isRed(px.L) && isBlue(px.R), `L=${px.L} R=${px.R}`);

  console.log('— 存檔後重整還在 —');
  await page.waitForFunction(() => Object.keys(needSave).length === 0, null, { timeout: 15000 });
  await page.reload();
  await page.waitForFunction(() => typeof state !== 'undefined' && state.photos.length === 2, null, { timeout: 15000 });
  const px2 = await page.evaluate(() => {
    const p = state.photos.find(x => x.name === 'IMG_0001');
    const c = document.createElement('canvas'); c.width = 320; c.height = 240;
    const g = c.getContext('2d'); g.drawImage(p.bmp, 0, 0);
    return { L: [...g.getImageData(60, 120, 1, 1).data.slice(0, 3)], R: [...g.getImageData(260, 120, 1, 1).data.slice(0, 3)] };
  });
  ok('重整後 HEIC 轉來的照片仍在、內容正確', isRed(px2.L) && isBlue(px2.R), `L=${px2.L} R=${px2.R}`);

  console.log('— PWA 離線快取清單 —');
  const sw = fs.readFileSync(path.join(__dirname, '..', 'apps', 'case-marker', 'sw.js'), 'utf8');
  ok('sw.js 預先快取 heic-to、不再列舊的 heic2any',
    sw.includes('./vendor/heic-to.js') && !sw.includes('heic2any'));
  const core = JSON.parse(sw.match(/var CORE = (\[[\s\S]*?\]);/)[1]);
  const missing = await page.evaluate(async (list) => {
    const bad = [];
    for (const u of list) { const r = await fetch(new window.URL(u, location.href)); if (!r.ok) bad.push(u); }
    return bad;
  }, core);
  ok('sw.js 預先快取清單裡的檔案都存在（少一個 addAll 會整批失敗）', missing.length === 0, missing.join(',') || `${core.length} 個`);

  await browser.close();
  console.log(`\n結果：${pass} 通過, ${fail} 失敗`);
  process.exit(fail ? 1 : 0);
})();
