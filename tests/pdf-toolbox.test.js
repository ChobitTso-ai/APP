/* PDF工具箱 v2.1 端到端測試
   重點是遮蔽：驗證被遮的內容是「真的從檔案裡消失」，而不是蓋一塊黑色上去。
   其餘涵蓋頁面縮圖、旋轉／自動轉正、刪除、依範圍選取、擷取、頁碼、
   圖片轉 PDF、PDF 轉圖片。 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const { PDFBOX, LOGIN, chromePath, OUT } = require('./env');

let pass = 0, fail = 0;
function ok(n, c, d) {
  if (c) { pass++; console.log('  ✓', n + (d ? '  → ' + d : '')); }
  else { fail++; console.log('  ✗ FAIL:', n + (d ? '  → ' + d : '')); }
}

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath() });
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => { fail++; console.log('  ✗ PAGE ERROR:', e.message); });
  page.on('dialog', async d => { await d.accept(); });

  await page.goto(LOGIN);
  await page.evaluate(() => localStorage.setItem('nckuh_endo_authed', '1'));
  await page.goto(PDFBOX);
  await page.waitForFunction(() => typeof PDFLib !== 'undefined' && typeof switchTab === 'function');

  console.log('— 登入保護 —');
  {
    const p2 = await ctx.newPage();
    await p2.goto(LOGIN);
    await p2.evaluate(() => localStorage.removeItem('nckuh_endo_authed'));
    await p2.goto(PDFBOX);
    await p2.waitForLoadState('domcontentloaded');
    await p2.waitForTimeout(400);
    ok('未登入直開工具頁會被導回登入頁', !/pdf-toolbox/.test(p2.url()), p2.url());
    await p2.close();
    await page.evaluate(() => localStorage.setItem('nckuh_endo_authed', '1'));
  }

  console.log('— 分頁切換 —');
  for (const t of ['split', 'editor', 'convert', 'merge']) {
    await page.click(`.tab[data-tab="${t}"]`);
    const active = await page.evaluate(id => {
      const el = document.getElementById(id);
      return el && el.classList.contains('active') &&
             getComputedStyle(el).display !== 'none';
    }, t + 'Tab');
    ok(`切到「${t}」分頁`, active);
  }

  // ---- 造一份測試 PDF：第1頁機密、第2/4頁一般、第3頁橫向 ----
  const pdfBytes = await page.evaluate(async () => {
    const doc = await PDFLib.PDFDocument.create();
    const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    const mk = (w, h, text) => {
      const p = doc.addPage([w, h]);
      p.drawText(text, { x: 60, y: h - 100, size: 28, font, color: PDFLib.rgb(0, 0, 0) });
    };
    mk(595, 842, 'SECRET-ALPHA');
    mk(595, 842, 'PUBLIC-TWO');
    mk(842, 595, 'PUBLIC-THREE');   // 橫向
    mk(595, 842, 'PUBLIC-FOUR');
    return Array.from(await doc.save());
  });
  console.log(`  · 測試 PDF ${pdfBytes.length} bytes / 4 頁`);

  const loadIntoEditor = async () => {
    await page.click('.tab[data-tab="editor"]');
    await page.evaluate((arr) => {
      const blob = new Blob([new Uint8Array(arr)], { type: 'application/pdf' });
      const f = new File([blob], 'test.pdf', { type: 'application/pdf' });
      const dt = new DataTransfer();
      dt.items.add(f);
      const inp = document.getElementById('editorFileInput');
      inp.files = dt.files;
      inp.dispatchEvent(new Event('change'));
    }, pdfBytes);
    await page.waitForFunction(() => typeof editorPages !== 'undefined' && editorPages.length === 4,
      null, { timeout: 30000 });
  };

  console.log('— 編輯分頁：載入與縮圖 —');
  await loadIntoEditor();
  ok('載入後有 4 頁', await page.evaluate(() => editorPages.length) === 4);
  ok('上傳區收起、編輯區展開', await page.evaluate(() =>
    document.getElementById('editorUploadArea').hidden &&
    getComputedStyle(document.getElementById('editorContent')).display !== 'none'));

  await page.waitForFunction(
    () => document.querySelectorAll('#editorGrid .page-thumb img').length >= 4,
    null, { timeout: 30000 });
  const thumbOk = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('#editorGrid .page-thumb img')];
    return imgs.length >= 4 && imgs.every(i => i.naturalWidth > 20);
  });
  ok('四頁縮圖都畫出來了（不是佔位圖）', thumbOk);

  console.log('— 選取與範圍 —');
  await page.fill('#editorRangeInput', '2, 4');
  await page.click('button:has-text("依範圍選取")');
  ok('「2, 4」選到第 2、4 頁', await page.evaluate(() =>
    editorPages.map((p, i) => p.selected ? i + 1 : 0).filter(Boolean).join(',') === '2,4'));

  ok('沒選取時操作鈕是停用的', await page.evaluate(() => {
    editorPages.forEach(p => p.selected = false);
    updateEditorSelInfo();
    return document.getElementById('btnDel').disabled;
  }));

  console.log('— 旋轉與自動轉正 —');
  await page.evaluate(() => { editorPages[1].selected = true; renderEditorGrid(); });
  await page.click('#btnRotR');
  ok('第 2 頁右轉後 rotation = 90', await page.evaluate(() => editorPages[1].rotation) === 90);

  await page.click('button:has-text("橫向頁自動轉正")');
  ok('橫向的第 3 頁被轉正（rotation = 90）',
    await page.evaluate(() => editorPages[2].rotation) === 90);
  ok('直向頁不會被亂轉',
    await page.evaluate(() => editorPages[0].rotation) === 0);

  await page.click('button:has-text("還原所有變更")');
  ok('還原後所有旋轉歸零、頁數回到 4', await page.evaluate(() =>
    editorPages.length === 4 && editorPages.every(p => p.rotation === 0)));

  console.log('— 遮蔽框會跟著旋轉一起轉 —');
  ok('轉 90° 後座標換算正確', await page.evaluate(() => {
    const r = { x: 0.1, y: 0.2, w: 0.3, h: 0.4, mode: 'black' };
    const a = rotateRect(r, 90);
    // 轉四次應該回到原點
    const back = rotateRect(rotateRect(rotateRect(a, 90), 90), 90);
    const near = (x, y) => Math.abs(x - y) < 1e-9;
    return near(a.x, 1 - 0.2 - 0.4) && near(a.y, 0.1) && near(a.w, 0.4) && near(a.h, 0.3)
        && near(back.x, r.x) && near(back.y, r.y) && near(back.w, r.w) && near(back.h, r.h);
  }));

  console.log('— 刪除頁面 —');
  await page.evaluate(() => { editorPages[3].selected = true; renderEditorGrid(); });
  await page.click('#btnDel');
  await page.waitForFunction(() => editorPages.length === 3);
  ok('刪除第 4 頁後剩 3 頁', await page.evaluate(() => editorPages.length) === 3);
  ok('刪掉的是 PUBLIC-FOUR 那頁（srcIndex 3 不在了）',
    await page.evaluate(() => !editorPages.some(p => p.srcIndex === 3)));

  console.log('— 🔒 遮蔽：內容是不是真的被拿掉 —');
  await loadIntoEditor();   // 重新載入乾淨的 4 頁
  const redactResult = await page.evaluate(async () => {
    // 在第 1 頁「SECRET-ALPHA」的位置蓋一塊
    editorPages[0].redactions = [{ x: 0.02, y: 0.04, w: 0.8, h: 0.18, mode: 'black' }];

    const bytes = await buildEditedPdf(editorPages, {
      compress: false,
      pageNumber: true,
      pageNumberPos: 'center',
      pageNumberFmt: 'total',
    });

    // 用 pdf.js 把成品讀回來，直接看文字圖層
    const doc = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
    const texts = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const pg = await doc.getPage(i);
      const tc = await pg.getTextContent();
      texts.push(tc.items.map(it => it.str).join(''));
    }

    // 再把第 1 頁畫出來，取遮蔽區中心的顏色
    const pg1 = await doc.getPage(1);
    const vp = pg1.getViewport({ scale: 1 });
    const c = document.createElement('canvas');
    c.width = Math.round(vp.width);
    c.height = Math.round(vp.height);
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, c.height);
    await pg1.render({ canvasContext: g, viewport: vp }).promise;
    const px = g.getImageData(Math.round(c.width * 0.3), Math.round(c.height * 0.12), 1, 1).data;

    return { numPages: doc.numPages, texts, px: [px[0], px[1], px[2]], size: bytes.length };
  });

  const all = redactResult.texts.join(' | ');
  ok('成品有 4 頁', redactResult.numPages === 4);
  ok('SECRET-ALPHA 已從檔案裡消失（不是被蓋住）',
    !all.includes('SECRET-ALPHA'), `文字圖層：${all.slice(0, 120)}`);
  ok('遮蔽區域實際是黑的',
    redactResult.px.every(v => v < 40), `RGB(${redactResult.px.join(',')})`);
  ok('沒遮蔽的頁面文字仍然保留（沒被整份光柵化）',
    all.includes('PUBLIC-TWO') && all.includes('PUBLIC-THREE'));
  ok('頁碼有寫進去', /1 \/ 4/.test(all), all.slice(0, 120));

  console.log('— 擷取成新檔 —');
  const extractResult = await page.evaluate(async () => {
    const pick = [editorPages[1], editorPages[2]];
    const bytes = await buildEditedPdf(pick, { compress: false, pageNumber: false });
    const doc = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
    const texts = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const pg = await doc.getPage(i);
      texts.push((await pg.getTextContent()).items.map(it => it.str).join(''));
    }
    return { numPages: doc.numPages, texts };
  });
  ok('擷取 2 頁 → 成品就是 2 頁', extractResult.numPages === 2);
  ok('擷取到的是指定的那兩頁',
    extractResult.texts.join('|').includes('PUBLIC-TWO') &&
    extractResult.texts.join('|').includes('PUBLIC-THREE'));

  console.log('— 壓縮（整份轉影像） —');
  const compressed = await page.evaluate(async () => {
    const bytes = await buildEditedPdf(editorPages, {
      compress: true, dpi: 100, quality: 0.6, pageNumber: false,
    });
    const doc = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
    let text = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const pg = await doc.getPage(i);
      text += (await pg.getTextContent()).items.map(it => it.str).join('');
    }
    return { numPages: doc.numPages, text };
  });
  ok('壓縮後頁數不變', compressed.numPages === 4);
  ok('壓縮後文字變成影像（文字圖層是空的）', compressed.text.trim() === '',
    JSON.stringify(compressed.text.slice(0, 60)));

  console.log('— 匯出按鈕（真的觸發下載） —');
  await page.evaluate(() => {
    editorPages.forEach(p => { p.redactions = []; });
    document.getElementById('optCompress').checked = false;
    document.getElementById('optPageNumber').checked = false;
    document.getElementById('editorFileNameOut').value = 'e2e_out';
  });
  const [dl] = await Promise.all([
    page.waitForEvent('download', { timeout: 60000 }),
    page.click('#editorExportButton'),
  ]);
  const outPath = path.join(OUT, 'e2e_out.pdf');
  await dl.saveAs(outPath);
  const dlSize = fs.statSync(outPath).size;
  ok('匯出檔案下載成功', dl.suggestedFilename() === 'e2e_out.pdf' && dlSize > 500,
    `${dl.suggestedFilename()} ${dlSize} bytes`);

  console.log('— 分割分頁也要有真縮圖 —');
  await page.click('.tab[data-tab="split"]');
  await page.evaluate((arr) => {
    const blob = new Blob([new Uint8Array(arr)], { type: 'application/pdf' });
    const f = new File([blob], 'split.pdf', { type: 'application/pdf' });
    const dt = new DataTransfer();
    dt.items.add(f);
    const inp = document.getElementById('splitFileInput');
    inp.files = dt.files;
    inp.dispatchEvent(new Event('change'));
  }, pdfBytes);
  await page.waitForFunction(
    () => document.querySelectorAll('#pageGrid .page-thumb img').length >= 4,
    null, { timeout: 30000 });
  ok('分割分頁的頁面卡片是真縮圖', await page.evaluate(() =>
    [...document.querySelectorAll('#pageGrid .page-thumb img')].every(i => i.naturalWidth > 20)));

  console.log('— 圖片轉 PDF —');
  await page.click('.tab[data-tab="convert"]');
  await page.evaluate(async () => {
    const files = [];
    for (let i = 0; i < 3; i++) {
      const c = document.createElement('canvas');
      c.width = 400; c.height = 300;
      const g = c.getContext('2d');
      g.fillStyle = `hsl(${i * 100}, 60%, 50%)`;
      g.fillRect(0, 0, 400, 300);
      const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.9));
      files.push(new File([blob], `photo${i}.jpg`, { type: 'image/jpeg' }));
    }
    const dt = new DataTransfer();
    files.forEach(f => dt.items.add(f));
    const inp = document.getElementById('imgFileInput');
    inp.files = dt.files;
    inp.dispatchEvent(new Event('change'));
  });
  await page.waitForFunction(() => imgItems.length === 3);
  ok('加入 3 張圖片', await page.evaluate(() => imgItems.length) === 3);
  ok('版面設定區出現', await page.evaluate(() =>
    getComputedStyle(document.getElementById('img2pdfControls')).display !== 'none'));

  const [dl2] = await Promise.all([
    page.waitForEvent('download', { timeout: 60000 }),
    page.click('#img2pdfButton'),
  ]);
  const imgPdfPath = path.join(OUT, 'images.pdf');
  await dl2.saveAs(imgPdfPath);
  const imgPdfBytes = Array.from(fs.readFileSync(imgPdfPath));
  const imgPdfPages = await page.evaluate(async (arr) => {
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(arr) }).promise;
    return doc.numPages;
  }, imgPdfBytes);
  ok('3 張圖片 → 3 頁 PDF', imgPdfPages === 3, `${fs.statSync(imgPdfPath).size} bytes`);

  console.log('— PDF 轉圖片 —');
  await page.click('.sub-tab[data-sub="pdf2img"]');
  await page.evaluate((arr) => {
    const blob = new Blob([new Uint8Array(arr)], { type: 'application/pdf' });
    const f = new File([blob], 'p2i.pdf', { type: 'application/pdf' });
    const dt = new DataTransfer();
    dt.items.add(f);
    const inp = document.getElementById('p2iFileInput');
    inp.files = dt.files;
    inp.dispatchEvent(new Event('change'));
  }, pdfBytes);
  await page.waitForFunction(() => p2iPdfjs && p2iPdfjs.numPages === 4, null, { timeout: 30000 });

  await page.fill('#p2iRange', '1-2');
  const [dl3] = await Promise.all([
    page.waitForEvent('download', { timeout: 60000 }),
    page.click('#pdf2imgButton'),
  ]);
  const zipPath = path.join(OUT, 'p2i.zip');
  await dl3.saveAs(zipPath);
  const zipSize = fs.statSync(zipPath).size;
  ok('多頁轉圖片會打包成 zip',
    dl3.suggestedFilename().endsWith('.zip') && zipSize > 500,
    `${dl3.suggestedFilename()} ${zipSize} bytes`);

  const zipNames = await page.evaluate(async (arr) => {
    const lib = await loadFflate();
    const entries = lib.unzipSync(new Uint8Array(arr));
    return Object.keys(entries);
  }, Array.from(fs.readFileSync(zipPath)));
  ok('zip 裡是指定範圍的 2 張圖', zipNames.length === 2, zipNames.join(', '));

  console.log('— 頁碼在旋轉頁上的位置換算 —');
  ok('四種角度都算得出合理座標', await page.evaluate(async () => {
    const doc = await PDFLib.PDFDocument.create();
    const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    for (const rot of [0, 90, 180, 270]) {
      const p = doc.addPage([595, 842]);
      p.setRotation(PDFLib.degrees(rot));
      const pos = placePageNumber(p, '1 / 4', font, 10, 'center', 28);
      if (!(pos.x >= 0 && pos.x <= 595 && pos.y >= 0 && pos.y <= 842)) return false;
      if (pos.rotate !== rot) return false;
    }
    return true;
  }));

  console.log('— [hidden] 不會被自訂 class 蓋掉 —');
  ok('隱藏的面板 computed display 是 none', await page.evaluate(() => {
    const el = document.getElementById('img2pdfPane');
    return el.hidden && getComputedStyle(el).display === 'none';
  }));

  await page.screenshot({ path: path.join(OUT, 'pdf-toolbox.png'), fullPage: false });
  await browser.close();

  console.log(`\n通過 ${pass} 項，失敗 ${fail} 項`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
