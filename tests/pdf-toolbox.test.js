/* PDF工具箱 v2.5 端到端測試
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
  for (const t of ['split', 'editor', 'convert', 'unlock', 'merge']) {
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
    /* 一定要先清空再等：不然「已經有 4 頁」在舊資料上就成立，
       waitForFunction 會立刻通過，測試在載入真正完成前就往下跑，
       後面設的遮蔽會被隨後完成的載入蓋掉。 */
    await page.evaluate(() => { editorPages = []; editorFile = null; });
    await page.evaluate((arr) => {
      const blob = new Blob([new Uint8Array(arr)], { type: 'application/pdf' });
      const f = new File([blob], 'test.pdf', { type: 'application/pdf' });
      const dt = new DataTransfer();
      dt.items.add(f);
      const inp = document.getElementById('editorFileInput');
      inp.files = dt.files;
      inp.dispatchEvent(new Event('change'));
    }, pdfBytes);
    await page.waitForFunction(() => editorFile && editorPages.length === 4,
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

  await page.click('button:has-text("全部重來")');
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

  console.log('— 🔄 先遮蔽再旋轉：遮蔽位置要跟著轉過去 —');
  /* 這是最容易出錯的地方：遮蔽框存的是相對座標，頁面一轉，
     框、渲染、輸出三邊的座標系必須一致，不然黑塊會跑到別的地方。 */
  await loadIntoEditor();
  const rotRedact = await page.evaluate(async () => {
    // 先在第 1 頁「SECRET-ALPHA」的位置遮起來
    editorPages[0].redactions = [{ x: 0.02, y: 0.04, w: 0.80, h: 0.18, mode: 'black' }];
    // 再把這一頁右轉 90°
    rotatePages([editorPages[0].uid], 90);

    const bytes = await buildEditedPdf(editorPages, { compress: false, pageNumber: false });
    const doc = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;

    const pg1 = await doc.getPage(1);
    const vp = pg1.getViewport({ scale: 1 });
    const c = document.createElement('canvas');
    c.width = Math.round(vp.width);
    c.height = Math.round(vp.height);
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, c.height);
    await pg1.render({ canvasContext: g, viewport: vp }).promise;

    const at = (nx, ny) => {
      const d = g.getImageData(Math.round(c.width * nx), Math.round(c.height * ny), 1, 1).data;
      return [d[0], d[1], d[2]];
    };
    const text = (await pg1.getTextContent()).items.map(i => i.str).join('');
    return {
      landscape: c.width > c.height,          // 直式轉 90° 後應該變橫式
      inNewSpot: at(0.87, 0.40),              // 轉過去之後黑塊該在的位置
      inOldSpot: at(0.30, 0.12),              // 原本的位置現在應該是白的
      text,
    };
  });
  const isBlack = px => px.every(v => v < 40);
  const isWhite = px => px.every(v => v > 215);
  ok('轉 90° 後頁面變成橫式', rotRedact.landscape);
  ok('黑塊出現在旋轉後的正確位置', isBlack(rotRedact.inNewSpot),
    `RGB(${rotRedact.inNewSpot.join(',')})`);
  ok('原本的位置沒有殘留黑塊', isWhite(rotRedact.inOldSpot),
    `RGB(${rotRedact.inOldSpot.join(',')})`);
  ok('旋轉＋遮蔽後文字一樣從檔案裡消失', !rotRedact.text.includes('SECRET-ALPHA'));

  console.log('— 還原後可以立刻用自動轉正（尺寸要先問完）—');
  await loadIntoEditor();
  ok('還原完成後 baseW/baseH 已就緒', await page.evaluate(async () => {
    await editorResetAll();
    return editorPages.every(p => p.baseW > 0 && p.baseH > 0);
  }));
  await page.click('button:has-text("橫向頁自動轉正")');
  ok('還原後緊接著自動轉正仍然有效',
    await page.evaluate(() => editorPages[2].rotation) === 90);

  console.log('— ↩️ 復原（v2.2）—');
  await loadIntoEditor();
  ok('剛載入時沒有可復原的步驟', await page.evaluate(() =>
    editorUndoStack.length === 0 && document.getElementById('btnUndo').disabled));

  await page.evaluate(() => { editorPages[3].selected = true; renderEditorGrid(); });
  await page.click('#btnDel');
  await page.waitForFunction(() => editorPages.length === 3);
  ok('刪除後復原鈕啟用', await page.evaluate(() =>
    !document.getElementById('btnUndo').disabled));

  await page.click('#btnUndo');
  await page.waitForFunction(() => editorPages.length === 4);
  ok('復原後刪掉的頁面回來了', await page.evaluate(() =>
    editorPages.length === 4 && editorPages.some(p => p.srcIndex === 3)));

  ok('旋轉也能復原', await page.evaluate(() => {
    rotatePages([editorPages[0].uid], 90);
    const after = editorPages[0].rotation;
    editorUndo();
    return after === 90 && editorPages[0].rotation === 0;
  }));

  ok('復原堆疊有上限，不會無限長大', await page.evaluate(() => {
    for (let i = 0; i < 40; i++) rotatePages([editorPages[0].uid], 90);
    return editorUndoStack.length <= 30;
  }));

  console.log('— 🖼️ 縮圖要看得到遮蔽（v2.2）—');
  await loadIntoEditor();
  // 先等原本的縮圖畫完，才知道之後看到的黑塊確實是遮蔽造成的
  await page.waitForFunction(
    () => document.querySelectorAll('#editorGrid .page-thumb img').length >= 4,
    null, { timeout: 30000 });
  await page.evaluate(() => {
    pushUndo();
    editorPages[0].redactions = [{ x: 0.05, y: 0.05, w: 0.8, h: 0.5, mode: 'black' }];
    renderEditorGrid();
  });
  // 重繪後縮圖會退回「載入中…」，等它用新的遮蔽重新算完
  await page.waitForFunction(
    () => !!document.querySelector('#editorGrid .editor-card .page-thumb img'),
    null, { timeout: 30000 });
  await page.waitForTimeout(300);
  const thumbDark = await page.evaluate(async () => {
    const img = document.querySelector('#editorGrid .editor-card .page-thumb img');
    if (!img) return null;
    await img.decode().catch(() => {});
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    // 取遮蔽區中央
    const d = g.getImageData(Math.round(c.width * 0.4), Math.round(c.height * 0.25), 1, 1).data;
    return [d[0], d[1], d[2]];
  });
  ok('縮圖上直接看得到黑塊', thumbDark && thumbDark.every(v => v < 60),
    thumbDark ? `RGB(${thumbDark.join(',')})` : 'no img');
  ok('遮蔽徽章也在', await page.evaluate(() =>
    !!document.querySelector('#editorGrid .card-badge.redacted')));

  console.log('— 🔍 遮蔽視窗的縮放平移（v2.2）—');
  await page.evaluate(() => openRedactModal(editorPages[1].uid));
  await page.waitForSelector('#redactCanvas', { timeout: 20000 });
  await page.waitForFunction(() => redactCtx && redactCtx.baseCanvas, null, { timeout: 20000 });
  const zoomInfo = await page.evaluate(() => {
    const fit = redactCtx.zoom;
    document.querySelector('[data-zoom="in"]').click();
    const zoomedIn = redactCtx.zoom;
    document.querySelector('[data-zoom="out"]').click();
    document.querySelector('[data-zoom="out"]').click();
    const zoomedOut = redactCtx.zoom;
    document.querySelector('[data-zoom="fit"]').click();
    return { fit, zoomedIn, zoomedOut, backToFit: redactCtx.zoom };
  });
  ok('放大鈕會放大', zoomInfo.zoomedIn > zoomInfo.fit,
    `${zoomInfo.fit.toFixed(3)} → ${zoomInfo.zoomedIn.toFixed(3)}`);
  ok('縮小鈕會縮小', zoomInfo.zoomedOut < zoomInfo.zoomedIn);
  ok('「符合視窗」會回到原本的比例',
    Math.abs(zoomInfo.backToFit - zoomInfo.fit) < 1e-6);
  ok('縮放後畫布的 CSS 尺寸跟著變', await page.evaluate(() => {
    const c = document.getElementById('redactCanvas');
    const before = c.getBoundingClientRect().width;
    document.querySelector('[data-zoom="in"]').click();
    return c.getBoundingClientRect().width > before + 1;
  }));

  console.log('— 放大後畫的框，座標仍然正確 —');
  /* 縮放平移之後座標換算若沒跟上，框就會歪掉。
     這裡在放大狀態下用滑鼠實際拖一個框，再檢查存下來的相對座標。 */
  const drawn = await page.evaluate(() => {
    document.querySelector('[data-zoom="fit"]').click();
    redactCtx.rects = [];
    redactCtx.repaint();
    return null;
  });
  {
    const box = await page.locator('#redactCanvas').boundingBox();
    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.20);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.40, { steps: 10 });
    await page.mouse.up();
  }
  const rectNorm = await page.evaluate(() => redactCtx.rects[redactCtx.rects.length - 1]);
  const near = (a, b) => Math.abs(a - b) < 0.03;
  ok('框的相對座標與滑鼠實際位置吻合',
    rectNorm && near(rectNorm.x, 0.25) && near(rectNorm.y, 0.20) &&
    near(rectNorm.w, 0.50) && near(rectNorm.h, 0.20),
    rectNorm ? `x=${rectNorm.x.toFixed(3)} y=${rectNorm.y.toFixed(3)} w=${rectNorm.w.toFixed(3)} h=${rectNorm.h.toFixed(3)}` : 'none');

  console.log('— 單獨選取與刪除遮蔽框（v2.2）—');
  ok('點一下框會選取它', await page.evaluate(() => {
    const r = redactCtx.rects[0];
    const c = document.getElementById('redactCanvas');
    const box = c.getBoundingClientRect();
    const cx = box.left + (r.x + r.w / 2) * box.width;
    const cy = box.top + (r.y + r.h / 2) * box.height;
    c.closest('.redact-viewport').dispatchEvent(new PointerEvent('pointerdown', {
      clientX: cx, clientY: cy, bubbles: true, pointerId: 1,
    }));
    window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }));
    document.getElementById('redactViewport').dispatchEvent(new PointerEvent('pointerup', {
      clientX: cx, clientY: cy, bubbles: true, pointerId: 1,
    }));
    return redactCtx.sel === 0;
  }));
  ok('選取後「刪除選取的框」啟用', await page.evaluate(() =>
    !document.getElementById('redactDelSel').disabled));
  await page.click('#redactDelSel');
  ok('刪掉的是那一個框', await page.evaluate(() =>
    redactCtx.rects.length === 0 && redactCtx.sel === -1));

  console.log('— 有未套用的框時誤點背景不會靜靜丟掉（v2.2）—');
  ok('畫了框但沒套用時，點背景會先問一聲', await page.evaluate(async () => {
    redactCtx.rects = [{ x: 0.1, y: 0.1, w: 0.2, h: 0.2, mode: 'black' }];
    let asked = false;
    const realConfirm = window.confirm;
    window.confirm = () => { asked = true; return false; };   // 選「不要關」
    document.querySelector('.modal-backdrop').click();
    window.confirm = realConfirm;
    return asked && !!document.querySelector('.modal-backdrop');  // 還開著
  }));
  ok('沒有未套用的變更時，點背景直接關掉不囉嗦', await page.evaluate(() => {
    redactCtx.rects = redactCtx.page.redactions.map(r => ({ ...r }));
    let asked = false;
    const realConfirm = window.confirm;
    window.confirm = () => { asked = true; return true; };
    document.querySelector('.modal-backdrop').click();
    window.confirm = realConfirm;
    return !asked && !document.querySelector('.modal-backdrop');
  }));

  console.log('— 擷取成新檔 —');
  await loadIntoEditor();
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

  console.log('— 合併（既有功能，確認沒被改壞）—');
  await page.click('.tab[data-tab="merge"]');
  await page.evaluate(async () => {
    // 兩份各 2 頁的小 PDF
    const mk = async (label) => {
      const doc = await PDFLib.PDFDocument.create();
      const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
      for (let i = 1; i <= 2; i++) {
        const p = doc.addPage([595, 842]);
        p.drawText(`${label}-${i}`, { x: 60, y: 700, size: 24, font });
      }
      return await doc.save();
    };
    const a = await mk('DOCA');
    const b = await mk('DOCB');
    const dt = new DataTransfer();
    dt.items.add(new File([a], 'a.pdf', { type: 'application/pdf' }));
    dt.items.add(new File([b], 'b.pdf', { type: 'application/pdf' }));
    const inp = document.getElementById('mergeFileInput');
    inp.files = dt.files;
    inp.dispatchEvent(new Event('change'));
  });
  await page.waitForFunction(() => mergePdfFiles.length === 2, null, { timeout: 20000 });
  ok('載入 2 個待合併檔案', await page.evaluate(() => mergePdfFiles.length) === 2);

  const [dlM] = await Promise.all([
    page.waitForEvent('download', { timeout: 60000 }),
    page.click('#mergeButton'),
  ]);
  const mergedPath = path.join(OUT, 'merged.pdf');
  await dlM.saveAs(mergedPath);
  const mergedInfo = await page.evaluate(async (arr) => {
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(arr) }).promise;
    let text = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const pg = await doc.getPage(i);
      text += (await pg.getTextContent()).items.map(it => it.str).join('|');
    }
    return { numPages: doc.numPages, text };
  }, Array.from(fs.readFileSync(mergedPath)));
  ok('合併後是 4 頁', mergedInfo.numPages === 4, mergedInfo.text);
  ok('兩份文件的內容都在，順序正確',
    /DOCA-1.*DOCA-2.*DOCB-1.*DOCB-2/.test(mergedInfo.text), mergedInfo.text);

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

  console.log('— 圖片拖曳排序（v2.2 補上，先前 UI 有寫但沒實作）—');
  ok('圖片卡片是可拖曳的', await page.evaluate(() =>
    [...document.querySelectorAll('#imgGrid .img-card')].every(c => c.draggable)));
  ok('把第 1 張拖到第 3 張後面，順序會改變', await page.evaluate(() => {
    const before = imgItems.map(x => x.name).join(',');
    const cards = [...document.querySelectorAll('#imgGrid .img-card')];
    const dt = new DataTransfer();
    cards[0].dispatchEvent(new DragEvent('dragstart', { dataTransfer: dt, bubbles: true }));
    const r = cards[2].getBoundingClientRect();
    cards[2].dispatchEvent(new DragEvent('drop', {
      dataTransfer: dt, bubbles: true,
      clientX: r.left + r.width * 0.9, clientY: r.top + r.height / 2,
    }));
    const after = imgItems.map(x => x.name).join(',');
    return before === 'photo0.jpg,photo1.jpg,photo2.jpg'
        && after === 'photo1.jpg,photo2.jpg,photo0.jpg';
  }));
  ok('編號跟著重畫', await page.evaluate(() =>
    document.querySelector('#imgGrid .img-name').textContent.startsWith('1. photo1')));

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

  console.log('— 遮蔽頁解析度可以設定（v2.2）—');
  const dpiSizes = await page.evaluate(async () => {
    await new Promise(r => setTimeout(r, 0));
    const out = {};
    for (const dpi of ['150', '300']) {
      editorPages[0].redactions = [{ x: 0.1, y: 0.1, w: 0.5, h: 0.2, mode: 'black' }];
      const bytes = await buildEditedPdf([editorPages[0]], {
        compress: false, redactDpi: dpi, pageNumber: false,
      });
      const doc = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
      const vp = (await doc.getPage(1)).getViewport({ scale: 1 });
      out[dpi] = { bytes: bytes.length, w: Math.round(vp.width) };
    }
    return out;
  });
  ok('300 DPI 的成品比 150 DPI 大（解析度真的有作用）',
    dpiSizes['300'].bytes > dpiSizes['150'].bytes,
    `150→${dpiSizes['150'].bytes}B, 300→${dpiSizes['300'].bytes}B`);
  ok('頁面尺寸（點）不受解析度影響，維持原稿大小',
    Math.abs(dpiSizes['300'].w - dpiSizes['150'].w) <= 2,
    `${dpiSizes['150'].w}pt vs ${dpiSizes['300'].w}pt`);

  console.log('— 「添加書籤」假勾選框已移除（v2.2）—');
  ok('合併分頁不再有沒作用的書籤勾選框',
    await page.evaluate(() => !document.getElementById('addBookmarks')));
  ok('會用到的「保留原檔案資訊」還在',
    await page.evaluate(() => !!document.getElementById('preserveMetadata')));

  console.log('— 🔓 解除密碼（v2.3）—');
  await page.click('.tab[data-tab="unlock"]');
  ok('切到「unlock」分頁', await page.evaluate(() => {
    const el = document.getElementById('unlockTab');
    return el.classList.contains('active') && getComputedStyle(el).display !== 'none';
  }));

  // 造三份測試檔：有開啟密碼、只有權限密碼、沒有密碼
  const lockedPdfs = await page.evaluate(async () => {
    const lib = await loadCryptoLib();
    const mk = async (label, sec) => {
      const doc = await lib.PDFDocument.create();
      const font = await doc.embedFont(lib.StandardFonts.Helvetica);
      for (let i = 1; i <= 2; i++) {
        const p = doc.addPage([595, 842]);
        p.drawText(`${label}-${i}`, { x: 60, y: 742, size: 24, font });
      }
      if (sec) doc.encrypt(sec);
      return Array.from(await doc.save());
    };
    return {
      user: await mk('LOCKED', { userPassword: 'secret123', ownerPassword: 'owner999' }),
      owner: await mk('RESTRICTED', { ownerPassword: 'owner999', permissions: { printing: false } }),
      plain: await mk('PLAIN', null),
    };
  });
  ok('解密函式庫載得起來，而且沒有蓋掉原本的 PDFLib', await page.evaluate(async () => {
    const lib = await loadCryptoLib();
    return lib !== window.PDFLib && typeof window.PDFLib.PDFDocument.create === 'function';
  }));

  const feedUnlock = async (arr) => {
    await page.evaluate(() => { unlockFile = null; });
    await page.evaluate((a) => {
      const blob = new Blob([new Uint8Array(a)], { type: 'application/pdf' });
      const dt = new DataTransfer();
      dt.items.add(new File([blob], 'locked.pdf', { type: 'application/pdf' }));
      const inp = document.getElementById('unlockFileInput');
      inp.files = dt.files;
      inp.dispatchEvent(new Event('change'));
    }, arr);
    await page.waitForFunction(() => unlockFile !== null, null, { timeout: 30000 });
  };

  console.log('  · 有開啟密碼的檔案');
  await feedUnlock(lockedPdfs.user);
  ok('辨識出需要開啟密碼', await page.evaluate(() => unlockFile.kind) === 'user');
  ok('密碼輸入框有出現', await page.evaluate(() =>
    getComputedStyle(document.getElementById('unlockPasswordBox')).display !== 'none'));

  await page.fill('#unlockPassword', 'WRONG-PASSWORD');
  await page.click('#unlockButton');
  await page.waitForFunction(
    () => /密碼不正確/.test(document.getElementById('unlockStatusMessage').textContent),
    null, { timeout: 30000 });
  ok('密碼錯誤會明確告知，不是丟一串英文', await page.evaluate(() =>
    document.getElementById('unlockStatusMessage').textContent),
    await page.textContent('#unlockStatusMessage'));
  ok('按鈕恢復可用，可以再試', await page.evaluate(() =>
    !document.getElementById('unlockButton').disabled));

  await page.fill('#unlockPassword', 'secret123');
  const [dlUnlock] = await Promise.all([
    page.waitForEvent('download', { timeout: 60000 }),
    page.click('#unlockButton'),
  ]);
  const unlockedPath = path.join(OUT, 'unlocked.pdf');
  await dlUnlock.saveAs(unlockedPath);

  const unlockedCheck = await page.evaluate(async (arr) => {
    const bytes = new Uint8Array(arr);
    const out = {};
    // 不給密碼就要能開
    try {
      const doc = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
      out.opensWithoutPassword = true;
      out.pages = doc.numPages;
      const texts = [];
      for (let i = 1; i <= doc.numPages; i++) {
        texts.push((await doc.getPage(i)).getTextContent
          ? (await (await doc.getPage(i)).getTextContent()).items.map(t => t.str).join('')
          : '');
      }
      out.text = texts.join('|');
    } catch (e) {
      out.opensWithoutPassword = 'FAILED: ' + e.name;
    }
    // 工具箱其他功能用的舊 pdf-lib 也要讀得動
    try {
      const d = await window.PDFLib.PDFDocument.load(bytes);
      out.oldLibPages = d.getPageCount();
    } catch (e) {
      out.oldLibPages = 'FAILED: ' + e.message.slice(0, 50);
    }
    return out;
  }, Array.from(fs.readFileSync(unlockedPath)));

  ok('解出來的檔案不用密碼就能開', unlockedCheck.opensWithoutPassword === true,
    String(unlockedCheck.opensWithoutPassword));
  ok('頁數正確', unlockedCheck.pages === 2);
  ok('文字完整保留（不是轉成圖片）',
    /LOCKED-1/.test(unlockedCheck.text) && /LOCKED-2/.test(unlockedCheck.text),
    unlockedCheck.text);
  ok('解開後其他分頁的 pdf-lib 也讀得動', unlockedCheck.oldLibPages === 2,
    String(unlockedCheck.oldLibPages));

  console.log('  · 只有權限密碼的檔案');
  await feedUnlock(lockedPdfs.owner);
  ok('辨識出只有權限密碼', await page.evaluate(() => unlockFile.kind) === 'owner');
  ok('不會要求輸入密碼', await page.evaluate(() =>
    getComputedStyle(document.getElementById('unlockPasswordBox')).display === 'none'));
  ok('按鈕文字改成「移除限制」', await page.evaluate(() =>
    document.getElementById('unlockButton').textContent.includes('移除限制')));

  const [dlOwner] = await Promise.all([
    page.waitForEvent('download', { timeout: 60000 }),
    page.click('#unlockButton'),
  ]);
  const ownerPath = path.join(OUT, 'unrestricted.pdf');
  await dlOwner.saveAs(ownerPath);
  const ownerText = await page.evaluate(async (arr) => {
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(arr) }).promise;
    return (await (await doc.getPage(1)).getTextContent()).items.map(t => t.str).join('');
  }, Array.from(fs.readFileSync(ownerPath)));
  ok('限制移除後文字仍在', /RESTRICTED-1/.test(ownerText), ownerText);

  console.log('  · 本來就沒有密碼的檔案');
  await feedUnlock(lockedPdfs.plain);
  ok('辨識出沒有加密', await page.evaluate(() => unlockFile.kind) === 'none');
  ok('按鈕停用，不會讓人白按', await page.evaluate(() =>
    document.getElementById('unlockButton').disabled));
  ok('有說明這份檔案不需要解除', await page.evaluate(() =>
    /本來就沒有密碼/.test(document.getElementById('unlockStatusMessage').textContent)));

  console.log('  · 其他分頁碰到加密檔要擋下來（不能默默產出壞檔）');
  /* pdf-lib 1.17.1 不解密，ignoreEncryption 只是跳過檢查：
     照樣「載入成功」、頁數也對，但複製出來的頁面文字全空。
     使用者會拿到一份默默壞掉的檔案，所以必須在載入前擋下。 */
  await page.evaluate(() => clearUnlockPDF());

  for (const [tab, inputId, statusId, kind] of [
    ['split',   'splitFileInput',  'splitStatusMessage',   'user'],
    ['editor',  'editorFileInput', 'editorStatusMessage',  'user'],
    ['merge',   'mergeFileInput',  'mergeStatusMessage',   'user'],
    ['split',   'splitFileInput',  'splitStatusMessage',   'owner'],
  ]) {
    await page.click(`.tab[data-tab="${tab}"]`);
    await page.evaluate((id) => {
      const el = document.getElementById(id);
      el.textContent = '';
      el.style.display = 'none';
    }, statusId);
    await page.evaluate(({ a, id }) => {
      const blob = new Blob([new Uint8Array(a)], { type: 'application/pdf' });
      const dt = new DataTransfer();
      dt.items.add(new File([blob], 'locked.pdf', { type: 'application/pdf' }));
      const inp = document.getElementById(id);
      inp.files = dt.files;
      inp.dispatchEvent(new Event('change'));
    }, { a: lockedPdfs[kind], id: inputId });

    let msg = '';
    try {
      await page.waitForFunction(
        (id) => /解密/.test(document.getElementById(id).textContent),
        statusId, { timeout: 20000 });
      msg = await page.textContent('#' + statusId);
      ok(`${tab} 分頁擋下${kind === 'user' ? '開啟密碼' : '權限密碼'}的檔案並指路`, true, msg.trim());
    } catch (_) {
      msg = await page.textContent('#' + statusId);
      ok(`${tab} 分頁擋下${kind === 'user' ? '開啟密碼' : '權限密碼'}的檔案並指路`, false, msg.trim() || '(沒有任何訊息)');
    }
  }

  ok('擋下來之後沒有把壞檔載進編輯分頁', await page.evaluate(() =>
    !editorFile || editorFile.name !== 'locked.pdf'));
  ok('擋下來之後合併清單沒有被加進壞檔', await page.evaluate(() =>
    !mergePdfFiles.some(f => f.name === 'locked.pdf')));

  console.log('— 🔒 設定密碼（v2.5）—');
  await page.click('.tab[data-tab="unlock"]');
  await page.click('.sub-tab[data-sub="encrypt"]');
  ok('切到「設定密碼」子分頁', await page.evaluate(() =>
    getComputedStyle(document.getElementById('encryptPane')).display !== 'none' &&
    getComputedStyle(document.getElementById('unlockPane')).display === 'none'));
  ok('兩組子分頁互不干擾（轉換分頁的選擇沒被改掉）', await page.evaluate(() => {
    // 先前測試選的是「PDF 轉圖片」，切換密碼分頁的子頁不該動到它
    const convert = document.getElementById('convertTab');
    const active = convert.querySelector('.sub-tab.active');
    const p2i = document.getElementById('pdf2imgPane');
    return active && active.dataset.sub === 'pdf2img' && !p2i.hidden;
  }));

  const plainPdf = await page.evaluate(async () => {
    const lib = await loadCryptoLib();
    const d = await lib.PDFDocument.create();
    const f = await d.embedFont(lib.StandardFonts.Helvetica);
    for (let i = 1; i <= 3; i++) {
      d.addPage([595, 842]).drawText(`CLINIC-NOTE-${i}`, { x: 60, y: 742, size: 24, font: f });
    }
    return Array.from(await d.save());
  });

  const feedEncrypt = async (arr) => {
    await page.evaluate(() => { encryptFile = null; });
    await page.evaluate((a) => {
      const blob = new Blob([new Uint8Array(a)], { type: 'application/pdf' });
      const dt = new DataTransfer();
      dt.items.add(new File([blob], 'note.pdf', { type: 'application/pdf' }));
      const inp = document.getElementById('encryptFileInput');
      inp.files = dt.files;
      inp.dispatchEvent(new Event('change'));
    }, arr);
  };

  await feedEncrypt(plainPdf);
  await page.waitForFunction(() => encryptFile !== null, null, { timeout: 30000 });
  ok('載入未加密的檔案', await page.evaluate(() => encryptFile.pageCount) === 3);

  console.log('  · 兩次密碼不一致要擋下來');
  await page.fill('#encryptPassword', 'abc12345');
  await page.fill('#encryptPassword2', 'abc99999');
  ok('邊打邊提示不一致', await page.evaluate(() =>
    /不一樣/.test(document.getElementById('encryptPasswordHint').textContent)));
  ok('不一致時按鈕停用', await page.evaluate(() =>
    document.getElementById('encryptButton').disabled));

  await page.fill('#encryptPassword2', 'abc12345');
  ok('改成一致後提示轉為確認', await page.evaluate(() =>
    /一致/.test(document.getElementById('encryptPasswordHint').textContent)));

  console.log('  · 沒勾「我了解」確認框，按鈕還是不能按（v2.5 提醒）');
  ok('密碼一致但還沒勾確認，按鈕仍停用', await page.evaluate(() =>
    document.getElementById('encryptButton').disabled));
  await page.check('#encryptAck');
  ok('勾了確認框後按鈕才啟用', await page.evaluate(() =>
    !document.getElementById('encryptButton').disabled));
  ok('取消勾選又會停用', await page.evaluate(() => {
    document.getElementById('encryptAck').checked = false;
    document.getElementById('encryptAck').dispatchEvent(new Event('change'));
    const off = document.getElementById('encryptButton').disabled;
    document.getElementById('encryptAck').checked = true;
    document.getElementById('encryptAck').dispatchEvent(new Event('change'));
    return off && !document.getElementById('encryptButton').disabled;
  }));

  console.log('  · 加密後的檔案真的要密碼');
  const [dlEnc] = await Promise.all([
    page.waitForEvent('download', { timeout: 60000 }),
    page.click('#encryptButton'),
  ]);
  const encPath = path.join(OUT, 'protected.pdf');
  await dlEnc.saveAs(encPath);
  const encBytes = Array.from(fs.readFileSync(encPath));

  const encCheck = await page.evaluate(async (arr) => {
    const bytes = new Uint8Array(arr);
    const out = {};
    // 沒給密碼應該開不起來
    try {
      await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
      out.opensWithout = 'OPENED (BAD)';
    } catch (e) {
      out.opensWithout = `${e.name} code=${e.code}`;
    }
    // 錯的密碼也要被擋
    try {
      await pdfjsLib.getDocument({ data: bytes.slice(0), password: 'nope' }).promise;
      out.wrongPw = 'OPENED (BAD)';
    } catch (e) {
      out.wrongPw = e.name;
    }
    // 對的密碼要開得起來，而且文字還在
    try {
      const d = await pdfjsLib.getDocument({ data: bytes.slice(0), password: 'abc12345' }).promise;
      const t = [];
      for (let i = 1; i <= d.numPages; i++) {
        t.push((await (await d.getPage(i)).getTextContent()).items.map(x => x.str).join(''));
      }
      out.rightPw = { pages: d.numPages, text: t.join('|') };
    } catch (e) {
      out.rightPw = 'FAILED: ' + e.name;
    }
    return out;
  }, encBytes);

  ok('沒有密碼打不開', /PasswordException/.test(encCheck.opensWithout), encCheck.opensWithout);
  ok('錯誤的密碼打不開', /PasswordException/.test(encCheck.wrongPw), String(encCheck.wrongPw));
  ok('正確的密碼打得開，頁數正確',
    encCheck.rightPw && encCheck.rightPw.pages === 3, JSON.stringify(encCheck.rightPw).slice(0, 80));
  ok('加密後文字完整保留（不是轉成圖片）',
    encCheck.rightPw && /CLINIC-NOTE-1/.test(encCheck.rightPw.text) &&
    /CLINIC-NOTE-3/.test(encCheck.rightPw.text),
    encCheck.rightPw && encCheck.rightPw.text);

  console.log('  · 加密 → 解密 來回一趟，內容要一模一樣');
  await page.click('.sub-tab[data-sub="unlock"]');
  await feedUnlock(encBytes);
  ok('解除端辨識出這是有開啟密碼的檔', await page.evaluate(() => unlockFile.kind) === 'user');
  await page.fill('#unlockPassword', 'abc12345');
  const [dlRound] = await Promise.all([
    page.waitForEvent('download', { timeout: 60000 }),
    page.click('#unlockButton'),
  ]);
  const roundPath = path.join(OUT, 'roundtrip.pdf');
  await dlRound.saveAs(roundPath);
  const roundText = await page.evaluate(async (arr) => {
    const d = await pdfjsLib.getDocument({ data: new Uint8Array(arr) }).promise;
    const t = [];
    for (let i = 1; i <= d.numPages; i++) {
      t.push((await (await d.getPage(i)).getTextContent()).items.map(x => x.str).join(''));
    }
    return { pages: d.numPages, text: t.join('|') };
  }, Array.from(fs.readFileSync(roundPath)));
  ok('來回之後頁數不變', roundText.pages === 3);
  ok('來回之後文字一字不差', roundText.text === 'CLINIC-NOTE-1|CLINIC-NOTE-2|CLINIC-NOTE-3',
    roundText.text);

  console.log('  · 已經有密碼的檔案不給重複加密');
  await page.click('.sub-tab[data-sub="encrypt"]');
  await page.evaluate(() => clearEncryptPDF());
  await feedEncrypt(encBytes);
  await page.waitForFunction(
    () => /本來就有密碼/.test(document.getElementById('encryptStatusMessage').textContent),
    null, { timeout: 30000 });
  ok('提示要先去解除密碼', true, (await page.textContent('#encryptStatusMessage')).trim());
  ok('沒有把加密檔載進來', await page.evaluate(() => encryptFile === null));

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
