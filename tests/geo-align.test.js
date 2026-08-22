/* v2.3 牙齒對齊測試 */
const { chromium } = require('playwright-core');
const { URL, LOGIN, chromePath, OUT: SP } = require('./env');
let pass = 0, fail = 0;
function ok(n, c, d){ if(c){pass++;console.log('  ✓',n+(d?'  → '+d:''));} else {fail++;console.log('  ✗ FAIL:',n+(d?'  → '+d:''));} }

// 基準照：藍底，標記點 (100,150) 與 (300,150)
// 目標照：綠底，同樣兩個解剖點在 (150,100) 與 (250,200)
//   → 相似變換應為 縮放 1.414、旋轉 -45°
const REF_PTS = [[100,150],[300,150]];
const TGT_PTS = [[150,100],[250,200]];

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath() });
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 1000 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => { fail++; console.log('  ✗ PAGE ERROR:', e.message); });
  page.on('dialog', async d => { console.log('    [dialog]', d.message()); await d.accept(); });
  await page.goto(LOGIN);
  await page.evaluate(() => localStorage.setItem('nckuh_endo_authed','1'));
  await page.goto(URL);
  await page.evaluate(() => new Promise(r => { if (window.idb) { idb.close(); idb=null; } const q=indexedDB.deleteDatabase('caseMarker'); q.onsuccess=q.onerror=q.onblocked=()=>r(); }));
  await page.evaluate(() => { const k=localStorage.getItem('nckuh_endo_authed'); localStorage.clear(); localStorage.setItem('nckuh_endo_authed', k); });
  await page.reload();
  await page.waitForFunction(() => typeof state !== 'undefined');

  console.log('— 準備兩張含已知解剖標記的照片 —');
  await page.evaluate(async ({REF_PTS, TGT_PTS}) => {
    const mk = async (bg, pts, name) => {
      const c = document.createElement('canvas'); c.width=400; c.height=300;
      const g = c.getContext('2d');
      g.fillStyle = bg; g.fillRect(0,0,400,300);
      // 加一點紋理，避免整片同色讓斷言失去意義
      g.fillStyle = 'rgba(255,255,255,.18)';
      for(let i=0;i<400;i+=40) g.fillRect(i,0,12,300);
      pts.forEach(([x,y]) => { g.fillStyle='#000'; g.beginPath(); g.arc(x,y,6,0,7); g.fill(); });
      const blob = await new Promise(r => c.toBlob(r,'image/png'));
      return new File([blob], name, {type:'image/png'});
    };
    const files = [ await mk('#1e78c8', REF_PTS, 'ref.png'), await mk('#28b450', TGT_PTS, 'tgt.png') ];
    const dt = new DataTransfer(); files.forEach(f => dt.items.add(f));
    const inp = document.getElementById('fileIn'); inp.files = dt.files; inp.dispatchEvent(new Event('change'));
  }, {REF_PTS, TGT_PTS});
  await page.waitForFunction(() => state.photos.length === 2);
  ok('兩張照片匯入', true);

  // 開啟第二張（目標照）
  await page.click('#libGrid .thumb >> nth=1');
  await page.waitForSelector('#vEdit.on');
  const curName = await page.evaluate(() => cur().name);
  ok('編輯中的是目標照', curName.indexOf('tgt') === 0, curName);

  console.log('— 在目標照中心放一個標記，之後檢查換算 —');
  await page.evaluate(() => {
    const p = cur();
    p.markers.push({ x:0.5, y:0.5, lx:0.6, ly:0.35, text:'測試', color:'red' });
    draw();
  });

  console.log('— 新功能徽章 —');
  const badge = await page.evaluate(() => {
    const el = document.getElementById('btnTeeth');
    return el.classList.contains('is-new') && getComputedStyle(el,'::after').content.includes('新');
  });
  ok('🦷 牙齒對齊 有「新」徽章', badge);

  console.log('— 開啟牙齒對齊視窗 —');
  await page.click('#btnTeeth');
  await page.waitForSelector('#geoModal.on');
  ok('視窗開啟', true);
  ok('基準照片預設為另一張', await page.evaluate(() => photoById(geo2.refId).name.indexOf('ref') === 0));
  ok('未取點時「套用」是停用的', await page.locator('#btnGeoOk').isDisabled());

  // 以真實滑鼠點擊取點（同時驗證座標換算）
  const clickOn = async (sel, nx, ny) => {
    const b = await page.locator(sel).boundingBox();
    await page.mouse.click(b.x + b.width*nx, b.y + b.height*ny);
  };
  console.log('— 取 4 個對應點 —');
  await clickOn('#geoCvA', REF_PTS[0][0]/400, REF_PTS[0][1]/300);
  await clickOn('#geoCvA', REF_PTS[1][0]/400, REF_PTS[1][1]/300);
  ok('基準照取 2 點後，仍要求在目標照取點',
     (await page.textContent('#geoStep')).includes('要對齊的照片'));
  await clickOn('#geoCvB', TGT_PTS[0][0]/400, TGT_PTS[0][1]/300);
  await clickOn('#geoCvB', TGT_PTS[1][0]/400, TGT_PTS[1][1]/300);

  const picks = await page.evaluate(() => ({ a: geo2.a, b: geo2.b }));
  const near = (v, t, tol) => Math.abs(v - t) <= tol;
  ok('點擊座標換算正確（基準 1）', near(picks.a[0].nx*400, 100, 4) && near(picks.a[0].ny*300, 150, 4),
     `(${(picks.a[0].nx*400).toFixed(1)}, ${(picks.a[0].ny*300).toFixed(1)})`);
  ok('點擊座標換算正確（目標 2）', near(picks.b[1].nx*400, 250, 4) && near(picks.b[1].ny*300, 200, 4),
     `(${(picks.b[1].nx*400).toFixed(1)}, ${(picks.b[1].ny*300).toFixed(1)})`);

  console.log('— 解出的相似變換 —');
  const g = await page.evaluate(() => {
    const r = geoResult();
    return r && { deg: r.m.deg, scale: r.m.scale, rect: r.rect,
      p0: applyMat(r.m, 150, 100), p1: applyMat(r.m, 250, 200) };
  });
  ok('取滿 4 點後可套用', await page.locator('#btnGeoOk').isEnabled());
  ok('旋轉角度 ≈ -45°', near(g.deg, -45, 2), g.deg.toFixed(2) + '°');
  ok('縮放 ≈ 1.414', near(g.scale, 1.4142, 0.03), g.scale.toFixed(4));
  ok('目標點 1 對齊到基準點 1', near(g.p0.x, 100, 5) && near(g.p0.y, 150, 5),
     `(${g.p0.x.toFixed(1)}, ${g.p0.y.toFixed(1)}) 應為 (100, 150)`);
  ok('目標點 2 對齊到基準點 2', near(g.p1.x, 300, 5) && near(g.p1.y, 150, 5),
     `(${g.p1.x.toFixed(1)}, ${g.p1.y.toFixed(1)}) 應為 (300, 150)`);
  ok('算出自動裁切框', !!g.rect && g.rect.w > 0.1 && g.rect.h > 0.1,
     g.rect ? `x=${g.rect.x.toFixed(3)} y=${g.rect.y.toFixed(3)} w=${g.rect.w.toFixed(3)} h=${g.rect.h.toFixed(3)}` : 'null');
  ok('資訊列顯示旋轉／縮放／輸出尺寸', /旋轉.*縮放.*輸出/.test(await page.textContent('#geoInfo')),
     await page.textContent('#geoInfo'));
  await page.screenshot({ path: SP + '/v23-geo-modal.png' });

  console.log('— 會被裁掉的標記要事先提醒 —');
  const warn = await page.evaluate(() => {
    const p = cur();
    p.markers.push({ x:0.02, y:0.02, lx:0.1, ly:0.1, text:'角落', color:'blue' });  // 一定在裁切框外
    renderGeo();
    const txt = document.getElementById('geoInfo').textContent;
    p.markers.pop(); renderGeo();
    return txt;
  });
  ok('落在框外的標記會事先提醒', /有 1 個標記會落在範圍外/.test(warn), warn);

  console.log('— 套用 —');
  const before = await page.evaluate(() => ({ w: bw(cur().bmp), h: bh(cur().bmp), n: cur().markers.length, undo: cur().undo.length }));
  const rect = g.rect;
  await page.click('#btnGeoOk');
  await page.waitForFunction(() => !document.getElementById('geoModal').classList.contains('on'));
  const after = await page.evaluate(() => {
    const p = cur();
    const r = state.photos.find(q => q.name.indexOf('ref') === 0);
    // 取輸出四角的顏色，檢查有沒有殘留白邊
    const c = document.createElement('canvas'); c.width = bw(p.bmp); c.height = bh(p.bmp);
    c.getContext('2d').drawImage(p.bmp, 0, 0);
    const d = c.getContext('2d');
    const px = (x,y) => Array.from(d.getImageData(x,y,1,1).data).slice(0,3);
    return {
      w: bw(p.bmp), h: bh(p.bmp), n: p.markers.length, mk: p.markers[0],
      refW: bw(r.bmp), refH: bh(r.bmp),
      corners: [px(1,1), px(c.width-2,1), px(1,c.height-2), px(c.width-2,c.height-2)],
      srcOk: typeof p.srcData === 'string' && p.srcData.indexOf('data:image/jpeg') === 0,
      undo: p.undo.length
    };
  });
  ok('輸出尺寸＝基準照 × 裁切框', Math.abs(after.w - Math.round(400*rect.w)) <= 1 && Math.abs(after.h - Math.round(300*rect.h)) <= 1,
     `${after.w}×${after.h}`);
  ok('基準照被裁成同一個框（同尺寸）', after.refW === after.w && after.refH === after.h,
     `基準 ${after.refW}×${after.refH} / 目標 ${after.w}×${after.h}`);
  const white = after.corners.filter(c => c[0] > 235 && c[1] > 235 && c[2] > 235);
  ok('四角沒有旋轉留下的白邊', white.length === 0, JSON.stringify(after.corners));
  ok('已寫回 srcData（JPEG）', after.srcOk);
  ok('推入復原快照', after.undo === before.undo + 1, `${before.undo} → ${after.undo}`);

  console.log('— 標記換算 —');
  ok('標記保留', after.n === 1, `${after.n} 個`);
  // 目標照中心 (200,150) → 基準照 (200,150) → 裁切後正規化
  const expX = (0.5 - rect.x)/rect.w, expY = (0.5 - rect.y)/rect.h;
  ok('標記位置換算正確', near(after.mk.x, expX, 0.02) && near(after.mk.y, expY, 0.02),
     `(${after.mk.x.toFixed(3)}, ${after.mk.y.toFixed(3)}) 應為 (${expX.toFixed(3)}, ${expY.toFixed(3)})`);
  ok('標記其他欄位保留', after.mk.text === '測試' && after.mk.color === 'red');

  console.log('— 對齊後兩張的解剖點應落在同一處 —');
  const coincide = await page.evaluate(() => {
    // 在兩張圖上找黑點的重心，比較位置
    const centroid = (bmp) => {
      const c = document.createElement('canvas'); c.width = bw(bmp); c.height = bh(bmp);
      c.getContext('2d').drawImage(bmp, 0, 0);
      const d = c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      let sx=0, sy=0, n=0;
      for(let i=0, k=0; i<d.length; i+=4, k++){
        if(d[i]<70 && d[i+1]<70 && d[i+2]<70){ sx += k % c.width; sy += Math.floor(k/c.width); n++; }
      }
      return n ? { x:sx/n, y:sy/n, n:n, w:c.width, h:c.height } : null;
    };
    const p = cur();
    const r = state.photos.find(q => q.name.indexOf('ref') === 0);
    return { t: centroid(p.bmp), r: centroid(r.bmp) };
  });
  ok('兩張都還看得到解剖點', !!coincide.t && !!coincide.r, JSON.stringify(coincide));
  if(coincide.t && coincide.r){
    ok('解剖點重心重合（誤差 < 4px）',
       near(coincide.t.x, coincide.r.x, 4) && near(coincide.t.y, coincide.r.y, 4),
       `目標(${coincide.t.x.toFixed(1)}, ${coincide.t.y.toFixed(1)}) vs 基準(${coincide.r.x.toFixed(1)}, ${coincide.r.y.toFixed(1)})`);
  }
  await page.screenshot({ path: SP + '/v23-geo-after.png' });

  console.log('— 復原 —');
  await page.click('#btnUndo');
  const undone = await page.evaluate(() => ({ w: bw(cur().bmp), h: bh(cur().bmp), n: cur().markers.length, mk: cur().markers[0] }));
  ok('復原還原尺寸', undone.w === before.w && undone.h === before.h, `${undone.w}×${undone.h}`);
  ok('復原還原標記座標', near(undone.mk.x, 0.5, 0.001) && near(undone.mk.y, 0.5, 0.001));
  // 註：基準照有自己的復原堆疊，這裡沒有還原它，所以下一輪的基準照是已裁切的尺寸
  const refDim = await page.evaluate(() => {
    const r = state.photos.find(q => q.name.indexOf('ref') === 0);
    return { w: bw(r.bmp), h: bh(r.bmp) };
  });
  await page.click('#btnTeeth');
  await page.waitForSelector('#geoModal.on');

  console.log('— 不裁切選項 —');
  await clickOn('#geoCvA', REF_PTS[0][0]/400, REF_PTS[0][1]/300);
  await clickOn('#geoCvA', REF_PTS[1][0]/400, REF_PTS[1][1]/300);
  await clickOn('#geoCvB', TGT_PTS[0][0]/400, TGT_PTS[0][1]/300);
  await clickOn('#geoCvB', TGT_PTS[1][0]/400, TGT_PTS[1][1]/300);
  await page.uncheck('#geoCrop');
  ok('取消自動裁切後，「基準照也裁」一併停用', await page.locator('#geoCropRef').isDisabled());
  ok('不裁切時無裁切框', await page.evaluate(() => geoResult().rect === null));
  await page.click('#btnGeoOk');
  await page.waitForFunction(() => !document.getElementById('geoModal').classList.contains('on'));
  const noCrop = await page.evaluate(() => {
    const p = cur(), r = state.photos.find(q => q.name.indexOf('ref') === 0);
    const c = document.createElement('canvas'); c.width = bw(p.bmp); c.height = bh(p.bmp);
    c.getContext('2d').drawImage(p.bmp, 0, 0);
    const d = c.getContext('2d');
    return { w: bw(p.bmp), h: bh(p.bmp), refW: bw(r.bmp), corner: Array.from(d.getImageData(1,1,1,1).data).slice(0,3) };
  });
  ok('不裁切時輸出＝基準照尺寸', noCrop.w === refDim.w && noCrop.h === refDim.h,
     `${noCrop.w}×${noCrop.h}，基準 ${refDim.w}×${refDim.h}`);
  ok('不裁切時基準照未被動到', noCrop.refW === refDim.w, `${noCrop.refW}`);
  ok('不裁切時角落是白色留邊', noCrop.corner.every(v => v > 235), JSON.stringify(noCrop.corner));
  await page.click('#btnUndo');

  console.log('— 組圖取景焦點要跟著幾何一起換算 —');
  const foc = await page.evaluate(() => {
    const p = cur(), r = state.photos.find(q => q.name.indexOf('ref') === 0);
    const out = {};
    // 中央的焦點：對齊後應該還在中央附近
    state.colFocus[p.id] = { fx:0.5, fy:0.5 };
    state.colFocus[r.id] = { fx:0.5, fy:0.5 };
    geo2.a = [{nx:0.25,ny:0.5},{nx:0.75,ny:0.5}];
    geo2.b = [{nx:0.375,ny:0.333},{nx:0.625,ny:0.667}];
    geo2.autoCrop = true; geo2.cropRef = true;
    renderGeo();
    const rect = geoResult().rect;
    document.getElementById('btnGeoOk').onclick();
    out.tgt = state.colFocus[p.id] || null;
    out.ref = state.colFocus[r.id] || null;
    out.exp = { fx:(0.5-rect.x)/rect.w, fy:(0.5-rect.y)/rect.h };
    return out;
  });
  ok('目標照的取景焦點已換算', foc.tgt && near(foc.tgt.fx, foc.exp.fx, 0.02) && near(foc.tgt.fy, foc.exp.fy, 0.02),
     JSON.stringify(foc.tgt) + ' 應為 ' + JSON.stringify(foc.exp));
  ok('基準照的取景焦點也換算', foc.ref && near(foc.ref.fx, foc.exp.fx, 0.02) && near(foc.ref.fy, foc.exp.fy, 0.02),
     JSON.stringify(foc.ref));
  const focOut = await page.evaluate(() => {
    const p = cur();
    state.colFocus[p.id] = { fx:0.02, fy:0.02 };     // 角落，對齊後一定在框外
    geo2.a = [{nx:0.25,ny:0.5},{nx:0.75,ny:0.5}];
    geo2.b = [{nx:0.375,ny:0.333},{nx:0.625,ny:0.667}];
    geo2.autoCrop = true; renderGeo();
    document.getElementById('btnGeoOk').onclick();
    return state.colFocus[p.id] || null;
  });
  ok('落在框外的焦點會取消（回到置中）', focOut === null, JSON.stringify(focOut));
  await page.click('#btnUndo');

  console.log('— 裁切／旋轉／拉平也要換算焦點（原本都沒處理） —');
  const g2 = await page.evaluate(() => {
    const p = cur(), out = {};
    // 旋轉 90°：焦點 (0.2,0.3) 順時針後應為 (1-0.3, 0.2)
    state.colFocus[p.id] = { fx:0.2, fy:0.3 };
    document.getElementById('btnRotR').onclick();
    out.rot = state.colFocus[p.id];
    document.getElementById('btnUndo').onclick();
    // 裁切：取右下半，(0.75,0.75) → (0.5,0.5)
    state.colFocus[p.id] = { fx:0.75, fy:0.75 };
    state.crop = { x:0.5, y:0.5, w:0.5, h:0.5 };
    document.getElementById('btnCropOk').onclick();
    out.crop = state.colFocus[p.id];
    document.getElementById('btnUndo').onclick();
    // 拉平：轉一個角度，焦點應該跟著移動而不是原地不動
    state.colFocus[p.id] = { fx:0.2, fy:0.2 };
    state.mode = 'tilt'; state.tilt = 12;
    document.getElementById('btnTiltOk').onclick();
    out.tilt = state.colFocus[p.id];
    document.getElementById('btnUndo').onclick();
    return out;
  });
  ok('旋轉 90° 後焦點正確', g2.rot && near(g2.rot.fx, 0.7, 0.001) && near(g2.rot.fy, 0.2, 0.001), JSON.stringify(g2.rot));
  ok('裁切後焦點正確', g2.crop && near(g2.crop.fx, 0.5, 0.001) && near(g2.crop.fy, 0.5, 0.001), JSON.stringify(g2.crop));
  ok('拉平後焦點有跟著換算', g2.tilt && !(near(g2.tilt.fx, 0.2, 0.001) && near(g2.tilt.fy, 0.2, 0.001)), JSON.stringify(g2.tilt));

  console.log('— 取點放大鏡（手機上手指會擋住） —');
  await page.click('#btnTeeth');
  await page.waitForSelector('#geoModal.on');
  const magHidden = await page.evaluate(() => getComputedStyle(document.getElementById('pickMag')).display);
  ok('平常不顯示', magHidden === 'none', magHidden);
  const bb = await page.locator('#geoCvA').boundingBox();
  await page.mouse.move(bb.x + bb.width*0.3, bb.y + bb.height*0.5);
  await page.mouse.down();
  const magOn = await page.evaluate(() => {
    const el = document.getElementById('pickMag');
    const c = document.getElementById('pickMagCv');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let ink = 0;
    for(let i=0;i<d.length;i+=4) if(d[i]>40 || d[i+1]>40 || d[i+2]>40) ink++;
    return { disp: getComputedStyle(el).display, ink: ink, box: el.getBoundingClientRect().width };
  });
  ok('按住時出現放大鏡', magOn.disp === 'block', magOn.disp);
  ok('放大鏡有畫出內容（不是空白）', magOn.ink > 1000, magOn.ink + ' 個像素');
  ok('放大鏡尺寸 132px', Math.round(magOn.box) === 132, magOn.box + '');
  const notYet = await page.evaluate(() => geo2.a.length);
  ok('按住還沒落點', notYet === 0, notYet + '');
  // 拖曳微調後放開才落點
  await page.mouse.move(bb.x + bb.width*0.25, bb.y + bb.height*0.5);
  await page.mouse.up();
  const picked = await page.evaluate(() => ({ n: geo2.a.length, nx: geo2.a[0] && geo2.a[0].nx,
    disp: getComputedStyle(document.getElementById('pickMag')).display }));
  ok('放開才落點', picked.n === 1, picked.n + '');
  ok('落點取的是放開時的位置（拖曳有效）', near(picked.nx, 0.25, 0.02), picked.nx);
  ok('放開後放大鏡收起來', picked.disp === 'none', picked.disp);
  await page.click('#btnGeoNo');

  console.log('— 只有一張照片時擋下 —');
  const guarded = await page.evaluate(() => {
    const saved = state.photos.slice();
    state.photos = [state.photos.find(p => p.id === state.curId)];
    let msg = null; const old = window.alert; window.alert = m => { msg = m; };
    document.getElementById('btnTeeth').click();
    window.alert = old;
    const opened = document.getElementById('geoModal').classList.contains('on');
    state.photos = saved;
    return { msg: msg, opened: opened };
  });
  ok('只有一張照片會提示且不開視窗', !guarded.opened && /至少 2 張/.test(guarded.msg || ''), guarded.msg);

  console.log('— 重新整理後仍在（有寫入 IndexedDB） —');
  await page.evaluate(async () => { flushNow(); await new Promise(r => setTimeout(r, 900)); });
  await page.reload();
  await page.waitForFunction(() => state.photos.length === 2, null, { timeout: 20000 });
  ok('重新整理後兩張照片都還在', true);

  console.log('— 徽章：用過就消失 —');
  ok('點過 🦷 後徽章已消失', await page.evaluate(() => !document.getElementById('btnTeeth').classList.contains('is-new')));

  console.log(`\n結果：${pass} 通過, ${fail} 失敗`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('SCRIPT ERROR:', e); process.exit(1); });
