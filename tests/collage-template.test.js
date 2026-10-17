/* v2.5 標準照模板（依牙位排版）：根尖片 18 張／口內照 5 張
   重點：照片真的放在對的格子（從輸出畫布取像素驗證）、X 光不被裁切、空格留灰、
   專案存檔／備份還原後排版還在、刪照片會清格子。 */
const { chromium } = require('playwright-core');
const { execSync } = require('child_process');
const { URL, LOGIN, chromePath, OUT } = require('./env');
let pass = 0, fail = 0;
function ok(n, c, d){ if(c){pass++;console.log('  ✓',n+(d?'  → '+d:''));} else {fail++;console.log('  ✗ FAIL:',n+(d?'  → '+d:''));} }
const dist = (a, b) => Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]) + Math.abs(a[2]-b[2]);

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath() });
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 1000 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => { fail++; console.log('  ✗ PAGE ERROR:', e.message); });
  const dialogs = []; let prompts = [];
  page.on('dialog', async d => {
    dialogs.push(d.message());
    if(d.type() === 'prompt') await d.accept(prompts.length ? prompts.shift() : '');
    else await d.accept();
  });
  await page.goto(LOGIN);
  await page.evaluate(() => localStorage.setItem('nckuh_endo_authed','1'));
  await page.goto(URL);
  await page.evaluate(() => new Promise(r => { if (window.idb) { idb.close(); idb=null; } const q=indexedDB.deleteDatabase('caseMarker'); q.onsuccess=q.onerror=q.onblocked=()=>r(); }));
  await page.evaluate(() => { const k=localStorage.getItem('nckuh_endo_authed'); localStorage.clear(); localStorage.setItem('nckuh_endo_authed', k); });
  await page.reload();
  await page.waitForFunction(() => typeof state !== 'undefined');

  console.log('— 準備 19 張「X 光」：每張一個獨一無二的顏色，長寬比有橫有直有方 —');
  // 編號 i%3：0＝橫（2:1）、1＝直（1:2）、2＝方；顏色由編號決定，之後用顏色反查「這格放的是哪一張」
  await page.evaluate(async () => {
    const files = [];
    for(let i=0;i<19;i++){
      const kind = i % 3;
      const w = kind===0 ? 600 : kind===1 ? 300 : 450, h = kind===0 ? 300 : kind===1 ? 600 : 450;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d'); g.fillStyle = `hsl(${(i*19)%360},85%,52%)`; g.fillRect(0,0,w,h);
      const blob = await new Promise(r => c.toBlob(r,'image/jpeg',0.95));
      files.push(new File([blob], 'xr'+String(i).padStart(2,'0')+'.jpg', {type:'image/jpeg'}));
    }
    const dt = new DataTransfer(); files.forEach(f => dt.items.add(f));
    const inp = document.getElementById('fileIn'); inp.files = dt.files; inp.dispatchEvent(new Event('change'));
  });
  await page.waitForFunction(() => state.photos.length === 19, null, { timeout: 60000 });
  ok('19 張照片匯入', true);

  // 之後所有「這格放的是哪一張」都用這個對照表：照片 id → 期望顏色與長寬比
  const helpers = () => page.evaluate(() => {
    window.__expect = {};
    const cv = document.createElement('canvas'); cv.width = cv.height = 1;
    const g = cv.getContext('2d');
    state.photos.forEach(p => {
      const i = parseInt(p.name.slice(2,4), 10);
      g.fillStyle = `hsl(${(i*19)%360},85%,52%)`; g.fillRect(0,0,1,1);
      const d = g.getImageData(0,0,1,1).data;
      window.__expect[p.id] = { rgb:[d[0],d[1],d[2]], kind:i%3, i:i, name:p.name };
    });
    // 以輸出畫布像素取樣：回傳某格某位置（相對於格子的 0~1）的顏色
    window.__sample = (c, tid, slot, fx, fy) => {
      const t = TEMPLATES[tid], GAP = state.colOpt.gap, u = t.u, pad = GAP < 8 ? 8 : GAP, sl = t.slots[slot];
      const x = pad + sl.x*u + GAP/2, y = pad + sl.y*u + GAP/2, w = sl.w*u - GAP, h = sl.h*u - GAP;
      const d = c.getContext('2d').getImageData(Math.round(x + w*fx), Math.round(y + h*fy), 1, 1).data;
      return [d[0], d[1], d[2]];
    };
  });
  await helpers();

  console.log('— 進入組圖分頁，找到模板按鈕 —');
  await page.click('#tabGrid');
  const badge = await page.evaluate(() => {
    const el = document.getElementById('btnTplFmx18');
    return el.classList.contains('is-new') && getComputedStyle(el,'::after').content.includes('新');
  });
  ok('「根尖片 18 張」按鈕有「新」徽章（標籤按鈕也要吃得到徽章樣式）', badge);
  ok('提示列列出新功能', (await page.textContent('#newHintTxt')).includes('標準照模板'));
  ok('一般狀態下不顯示格子地圖', await page.evaluate(() => getComputedStyle(document.getElementById('tplBox')).display === 'none'));
  ok('一般狀態下不顯示「照片顯示／格子名稱」選項', await page.evaluate(() => getComputedStyle(document.getElementById('optFitRow')).display === 'none'));

  console.log('— 選根尖片 18 張模板 —');
  await page.click('#btnTplFmx18');
  ok('格式切成 tpl:fmx18', await page.evaluate(() => state.colFormat === 'tpl:fmx18'));
  ok('格子地圖出現', await page.evaluate(() => getComputedStyle(document.getElementById('tplBox')).display !== 'none'));
  ok('18 個格子', await page.locator('.tpl-slot').count() === 18);
  ok('標題改成「點格子，再點照片放進去」', (await page.textContent('#pickTitle')).includes('18 格'));
  ok('「照片顯示／格子名稱」選項出現', await page.evaluate(() => getComputedStyle(document.getElementById('optFitRow')).display !== 'none'));
  ok('第 1 格是目前要放的格子', await page.locator('.tpl-slot.act').getAttribute('data-slot') === '0');
  ok('點過後「新」徽章消失', !(await page.evaluate(() => document.getElementById('btnTplFmx18').classList.contains('is-new'))));
  ok('「一般組圖」那排的格式按鈕全部熄燈', await page.evaluate(() => document.querySelectorAll('.fmt.on').length === 0));

  console.log('— 照順序點 18 張，應依序填進 1~18 格 —');
  for(let k=0;k<18;k++) await page.click(`#pickGrid .thumb >> nth=${k}`);
  const order = await page.evaluate(() => ({ slots: slotArr('fmx18').slice(), lib: state.photos.map(p => p.id) }));
  ok('18 格全部有照片', order.slots.every(Boolean));
  ok('順序＝點選順序', order.slots.every((id, i) => id === order.lib[i]));
  ok('沒有任何一格被放兩次', new Set(order.slots).size === 18);
  ok('縮圖上的序號是格子編號', await page.evaluate(() => document.querySelector('#pickGrid .thumb:nth-child(18) .ord').textContent === '18'));
  ok('已填滿時沒有「目前格子」', await page.locator('.tpl-slot.act').count() === 0);

  console.log('— 格子滿了再點第 19 張 —');
  dialogs.length = 0;
  await page.click('#pickGrid .thumb >> nth=18');
  ok('提示格子都滿了', dialogs.some(m => m.includes('格子都滿了')), dialogs[0]);
  ok('第 19 張沒有被偷偷放進去', await page.evaluate(() => !slotArr('fmx18').includes(state.photos[18].id)));

  console.log('— 點格子再點照片＝替換 —');
  const rep = await page.evaluate(() => ({ old: slotArr('fmx18')[4], neu: state.photos[18].id }));
  await page.click('.tpl-slot[data-slot="4"]');
  ok('點格子後它變成目前格子', await page.locator('.tpl-slot.act').getAttribute('data-slot') === '4');
  await page.click('#pickGrid .thumb >> nth=18');
  const after = await page.evaluate(() => slotArr('fmx18').slice());
  ok('第 5 格換成新照片', after[4] === rep.neu);
  ok('被換掉的照片變成沒放進任何格子', !after.includes(rep.old));
  ok('其他 17 格不受影響', after.filter((id, i) => i !== 4).every((id, i) => id === order.slots[i < 4 ? i : i + 1]));

  console.log('— 再點一次已放入的照片＝拿出來；格子的 ✕ 也可以清 —');
  await page.click('#pickGrid .thumb >> nth=18');
  ok('再點一次就拿出來', await page.evaluate(() => slotArr('fmx18')[4] === null));
  ok('並且目前格子回到那一格', await page.locator('.tpl-slot.act').getAttribute('data-slot') === '4');
  const oldIdx = await page.evaluate(id => state.photos.findIndex(p => p.id === id), rep.old);
  await page.click(`#pickGrid .thumb >> nth=${oldIdx}`);
  ok('被換掉的照片可以放回原來的格子', await page.evaluate(id => slotArr('fmx18')[4] === id, rep.old));
  await page.click('.tpl-slot[data-slot="0"] .x');
  ok('格子 ✕ 清空那一格', await page.evaluate(() => slotArr('fmx18')[0] === null));
  ok('✕ 不會誤觸「點格子」（目前格子是被清的那格）', await page.locator('.tpl-slot.act').getAttribute('data-slot') === '0');

  console.log('— 清空與「依照片庫順序自動填入」 —');
  await page.click('#btnTplClear');
  ok('清空後全部是空格', await page.evaluate(() => slotArr('fmx18').every(x => x === null)));
  await page.click('#btnTplAuto');
  const auto = await page.evaluate(() => ({ slots: slotArr('fmx18').slice(), lib: state.photos.map(p => p.id), msg: document.getElementById('tplMsg').textContent }));
  ok('自動填入 18 格，順序＝照片庫順序', auto.slots.every((id, i) => id === auto.lib[i]));
  ok('提示還有 1 張放不下', auto.msg.includes('還有 1 張放不下'), auto.msg);
  ok('提示明講不會辨識內容、請檢查', auto.msg.includes('不會辨識內容'), auto.msg);

  console.log('— 輸出畫布：每一格放的是對的照片 —');
  const geo = await page.evaluate(() => {
    const t = TEMPLATES.fmx18, c = buildTemplateCollage('fmx18', true), GAP = state.colOpt.gap, pad = Math.max(8, GAP);
    const a = slotArr('fmx18');
    const rows = a.map((id, i) => ({ i:i, got: __sample(c, 'fmx18', i, 0.5, 0.5), want: __expect[id].rgb }));
    // 兩個咬翼群組中間的空隙（單位座標 x 3~4、y 1~2.3）應該是背景色
    const gx = Math.round(pad + 3.5*t.u), gy = Math.round(pad + 1.65*t.u);
    const gap = Array.from(c.getContext('2d').getImageData(gx, gy, 1, 1).data).slice(0,3);
    return { w:c.width, h:c.height, rows:rows, gap:gap, pad:pad, u:t.u };
  });
  const bad = geo.rows.filter(r => dist(r.got, r.want) > 60);
  ok('18 格的中心顏色都是被指定的那張照片', bad.length === 0,
     bad.length ? '放錯：' + bad.map(r => r.i+1).join(',') : '全部相符');
  ok('輸出尺寸＝7 單位寬 × 3.3 單位高 ＋ 邊距', geo.w === 7*geo.u + 2*geo.pad && geo.h === Math.round(3.3*geo.u + 2*geo.pad), geo.w + '×' + geo.h);
  ok('兩組咬翼片中間留空（背景色）', dist(geo.gap, [255,255,255]) < 12, JSON.stringify(geo.gap));

  console.log('— X 光預設「完整顯示」：不裁切 —');
  const fit = await page.evaluate(() => {
    const a = slotArr('fmx18');
    // 找一張橫的（2:1）與一張直的（1:2），它們都放在「正方形」格子裡
    const wide = a.findIndex(id => __expect[id].kind === 0 && TEMPLATES.fmx18.slots[a.indexOf(id)].w === 1);
    const tall = a.findIndex(id => __expect[id].kind === 1 && TEMPLATES.fmx18.slots[a.indexOf(id)].w === 1);
    const c = buildTemplateCollage('fmx18', true);
    const bar = [20, 23, 28];
    return { wide:wide, tall:tall,
      wideTop: __sample(c, 'fmx18', wide, 0.5, 0.04), wideMid: __sample(c, 'fmx18', wide, 0.5, 0.5),
      tallLeft: __sample(c, 'fmx18', tall, 0.04, 0.5), tallMid: __sample(c, 'fmx18', tall, 0.5, 0.5),
      wideWant: __expect[a[wide]].rgb, bar: bar };
  });
  ok('橫的照片：上緣是深色底（整張縮進去，沒被裁）', dist(fit.wideTop, fit.bar) < 25, JSON.stringify(fit.wideTop));
  ok('橫的照片：中間是照片本身', dist(fit.wideMid, fit.wideWant) < 60);
  ok('直的照片：左緣是深色底（沒被裁）', dist(fit.tallLeft, fit.bar) < 25, JSON.stringify(fit.tallLeft));
  await page.selectOption('#optFit', 'cover');
  const cov = await page.evaluate(() => {
    const a = slotArr('fmx18'), wide = a.findIndex(id => __expect[id].kind === 0 && TEMPLATES.fmx18.slots[a.indexOf(id)].w === 1);
    return { top: __sample(buildTemplateCollage('fmx18', true), 'fmx18', wide, 0.5, 0.04), want: __expect[a[wide]].rgb };
  });
  ok('改成「填滿格子」後上緣就是照片（會裁切，由使用者自己選）', dist(cov.top, cov.want) < 60, JSON.stringify(cov.top));
  ok('填滿模式下才出現每格取景控制', await page.locator('#selList .focus').count() === 18);
  await page.selectOption('#optFit', '');
  ok('完整顯示時不出現取景控制（調了也沒用）', await page.locator('#selList .focus').count() === 0);

  console.log('— 空格 —');
  const emp = await page.evaluate(() => {
    slotArr('fmx18')[10] = null;
    renderCollage();                                   // 直接改了狀態，要重畫清單
    const c = buildTemplateCollage('fmx18', true);
    return { center: __sample(c, 'fmx18', 10, 0.5, 0.5), png: c.toDataURL('image/png') };
  });
  require('fs').writeFileSync(OUT + '/v25-fmx18.png', Buffer.from(emp.png.split(',')[1], 'base64'));
  ok('空格是淡灰色（不是別張照片）', dist(emp.center, [232,235,238]) < 14, JSON.stringify(emp.center));

  console.log('— 格子名稱（牙位標示） —');
  const lbl = await page.evaluate(() => {
    // 找一張方形照片，它在正方形格子裡填滿；左上角若有名稱，會是深色標籤底
    const a = slotArr('fmx18'), sq = a.findIndex((id, i) => id && __expect[id].kind === 2 && TEMPLATES.fmx18.slots[i].w === 1);
    const probe = (c) => __sample(c, 'fmx18', sq, 0.045, 0.085);
    state.colOpt.slotLabel = '';  const off = probe(buildTemplateCollage('fmx18', true));
    state.colOpt.slotLabel = '1'; const on  = probe(buildTemplateCollage('fmx18', true));
    state.colOpt.slotLabel = '0'; const no  = probe(buildTemplateCollage('fmx18', true));
    state.colOpt.slotLabel = '';
    return { off:off, on:on, no:no, want: __expect[a[sq]].rgb };
  });
  ok('根尖片預設不加牙位名稱（跟你給的範例一樣）', dist(lbl.off, lbl.want) < 60, JSON.stringify(lbl.off));
  ok('選「顯示牙位名稱」後出現深色標籤', lbl.on.every(v => v < 120) && dist(lbl.on, lbl.want) > 100, JSON.stringify(lbl.on));
  ok('選「不顯示」時不出現標籤', dist(lbl.no, lbl.want) < 60);
  await page.screenshot({ path: OUT + '/v25-grid-tab.png' });

  console.log('— 每格標題清單依格子順序、預設提示是牙位名稱 —');
  const sel = await page.evaluate(() => ({
    n: document.querySelectorAll('#selList .sel-row').length,
    first: document.querySelector('#selList .sel-row input').placeholder,
    no: Array.from(document.querySelectorAll('#selList .sel-row .no')).map(e => e.textContent).slice(0, 3) }));
  ok('列出 17 張（第 11 格是空的）', sel.n === 17, sel.n + '');
  ok('標題欄的提示是該格牙位', sel.first === '右上臼齒 17–16', sel.first);
  ok('序號是格子編號（不是 1,2,3 重編）', sel.no.join(',') === '1,2,3');

  console.log('— 版面幾何：格子不重疊、都在畫布內 —');
  const lay = await page.evaluate(() => {
    const out = {};
    Object.keys(TEMPLATES).forEach(tid => {
      const t = TEMPLATES[tid]; let overlap = 0, outside = 0;
      t.slots.forEach((a, i) => {
        if(a.x < 0 || a.y < 0 || a.x + a.w > t.w + 1e-9 || a.y + a.h > t.h + 1e-9) outside++;
        t.slots.forEach((b, j) => { if(j > i && a.x < b.x + b.w - 1e-9 && b.x < a.x + a.w - 1e-9 && a.y < b.y + b.h - 1e-9 && b.y < a.y + a.h - 1e-9) overlap++; });
      });
      out[tid] = { n:t.slots.length, overlap:overlap, outside:outside };
    });
    return out;
  });
  ok('根尖片 18 格，無重疊、無超出', lay.fmx18.n === 18 && lay.fmx18.overlap === 0 && lay.fmx18.outside === 0, JSON.stringify(lay.fmx18));
  ok('口內照 5 格，無重疊、無超出', lay.intra5.n === 5 && lay.intra5.overlap === 0 && lay.intra5.outside === 0, JSON.stringify(lay.intra5));

  console.log('— 匯出視窗（產生組圖）—');
  await page.evaluate(() => document.getElementById('expImg').removeAttribute('src'));
  await page.click('#btnBuild');
  await page.waitForSelector('#expModal.on');
  await page.waitForFunction(() => document.getElementById('expImg').naturalWidth > 0);
  ok('預覽出現', await page.evaluate(() => document.getElementById('expImg').naturalWidth) > 1000);
  await page.click('#btnCloseExp');

  console.log('— 組圖專案：存起來、載入後格子位置（含空格）一模一樣 —');
  const savedSlots = await page.evaluate(() => slotArr('fmx18').slice());
  prompts = ['根尖片測試'];
  await page.click('#btnProjSave');
  await page.waitForFunction(() => document.querySelectorAll('#projList .proj-row').length === 1);
  const rec = await page.evaluate(async () => { const r = await projAll(); return r[0]; });
  ok('專案記下格式與格子', rec.format === 'tpl:fmx18' && !!rec.slots && rec.slots.fmx18.length === 18);
  ok('sel 是已放入的照片（17 張）', rec.sel.length === 17);
  await page.click('#btnTplClear');
  await page.click('#projList .proj-row button >> nth=0');
  const loaded = await page.evaluate(() => slotArr('fmx18').slice());
  ok('載入後每一格都回到原位（含空格）', JSON.stringify(loaded) === JSON.stringify(savedSlots));
  ok('載入後還在模板模式', await page.evaluate(() => state.colFormat === 'tpl:fmx18'));

  console.log('— 重新整理後載入專案 —');
  await page.evaluate(async () => { flushNow(); await new Promise(r => setTimeout(r, 900)); });
  await page.reload();
  await page.waitForFunction(() => state.photos.length === 19, null, { timeout: 20000 });
  await page.click('#tabGrid');
  ok('重整後預設回到一般組圖', await page.evaluate(() => state.colFormat === 'std'));
  await page.click('#projList .proj-row button >> nth=0');
  await helpers();
  const reloaded = await page.evaluate(() => ({ f: state.colFormat, s: slotArr('fmx18').slice() }));
  ok('重整後載入專案，格式與格子都回來', reloaded.f === 'tpl:fmx18' && JSON.stringify(reloaded.s) === JSON.stringify(savedSlots));

  console.log('— 整包備份 → 還原：專案裡的格子要換成新照片 id —');
  const oldIds = await page.evaluate(() => state.photos.map(p => p.id));
  await page.evaluate(async () => {
    const r = await buildArchive({});
    const f = new File([r.blob], 'b.zip', { type:'application/zip' });
    const dt = new DataTransfer(); dt.items.add(f);
    const inp = document.getElementById('restoreIn'); inp.files = dt.files; inp.dispatchEvent(new Event('change'));
  });
  await page.waitForFunction(() => state.photos.length === 38, null, { timeout: 60000 });
  const restored = await page.evaluate(async (old) => {
    const rows = await projAll();
    const pr = rows.find(r => /（還原）$/.test(r.name));
    const ids = state.photos.map(p => p.id);
    return pr && { slots: pr.slots && pr.slots.fmx18, fmt: pr.format,
      allNew: pr.slots.fmx18.filter(Boolean).every(id => ids.includes(id) && !old.includes(id)) };
  }, oldIds);
  ok('還原出一個專案', !!restored);
  ok('專案格式仍是模板', restored && restored.fmt === 'tpl:fmx18');
  ok('格子裡的照片 id 都換成新的、而且存在', restored && restored.allNew);
  ok('空格的位置保持不變', restored && JSON.stringify(restored.slots.map(x => x === null)) === JSON.stringify(savedSlots.map(x => x === null)));

  console.log('— 刪照片會清掉它所在的格子 —');
  const victim = await page.evaluate(() => { const id = slotArr('fmx18')[2]; return { id:id, idx:state.photos.findIndex(p => p.id === id) }; });
  await page.click('#tabLib');
  await page.locator('#libGrid .thumb').nth(victim.idx).locator('.del').click();
  await page.waitForFunction(id => !state.photos.some(p => p.id === id), victim.id);
  ok('被刪的照片不再佔著格子', await page.evaluate(id => !slotArr('fmx18').includes(id) && slotArr('fmx18')[2] === null, victim.id));
  await page.click('#tabGrid');

  console.log('— 匯出投影片：模板模式整張組圖放同一頁 —');
  const [dl] = await Promise.all([ page.waitForEvent('download', { timeout: 60000 }), page.click('#btnPptx') ]);
  const pp = OUT + '/v25.pptx'; await dl.saveAs(pp);
  const slides = parseInt(execSync(`python3 -c "
import zipfile
z=zipfile.ZipFile('${pp}')
print(len([n for n in z.namelist() if n.startswith('ppt/slides/slide') and n.endswith('.xml')]))
"`).toString().trim(), 10);
  ok('投影片＝封面 1 頁 ＋ 組圖 1 頁', slides === 2, slides + ' 頁');
  await page.waitForFunction(() => document.getElementById('busyModal').classList.contains('on') === false);

  console.log('— 口內照 5 張模板 —');
  await page.click('#btnTplIntra5');
  ok('5 個格子', await page.locator('.tpl-slot').count() === 5);
  ok('口內照預設顯示格子名稱', await page.evaluate(() => tplShowLabel('intra5') === true));
  ok('口內照預設「填滿」', await page.evaluate(() => tplFit('intra5') === 'cover'));
  ok('每個模板各自記格子（根尖片的設定沒被洗掉）', await page.evaluate(() => slotArr('fmx18').filter(Boolean).length === 16));
  await page.click('#btnTplAuto');
  const intra = await page.evaluate(() => {
    const a = slotArr('intra5'), c = buildTemplateCollage('intra5', true), t = TEMPLATES.intra5;
    const GAP = state.colOpt.gap, pad = Math.max(8, GAP);
    return {
      names: t.slots.map(s => s.name),
      ok: a.map((id, i) => ({ i:i, d:Math.abs(__sample(c,'intra5',i,0.5,0.5).reduce((s,v,k)=>s+Math.abs(v-__expect[id].rgb[k]),0)) })),
      corner: Array.from(c.getContext('2d').getImageData(pad + 20, pad + 20, 1, 1).data).slice(0,3),
      w:c.width, h:c.height };
  });
  ok('順序是 正面→右→左→上顎→下顎', intra.names.join('、') === '正面、右側面、左側面、上顎咬合面、下顎咬合面', intra.names.join('、'));
  ok('5 格都放了對的照片', intra.ok.every(r => r.d < 60), JSON.stringify(intra.ok.map(r => r.d)));
  ok('十字形：左上角是留白（背景色）', intra.corner.every(v => v > 240), JSON.stringify(intra.corner));
  await page.screenshot({ path: OUT + '/v25-intra5.png' });

  console.log('— 切回一般組圖：原本的組圖功能不受影響 —');
  await page.click('.tplb[data-tpl=""]');
  ok('切回一般版型', await page.evaluate(() => state.colFormat === 'std' && !curTplId()));
  ok('格子地圖收起來', await page.evaluate(() => getComputedStyle(document.getElementById('tplBox')).display === 'none'));
  ok('標題變回「最多 8 張」', (await page.textContent('#pickTitle')).includes('最多 8 張'));
  ok('標準組圖按鈕重新亮燈', await page.evaluate(() => document.querySelector('.fmt.on').getAttribute('data-fmt') === 'std'));
  await page.click('#btnClearSel');
  await page.click('#pickGrid .thumb >> nth=0');
  await page.click('#pickGrid .thumb >> nth=1');
  ok('一般模式：點 2 張可以產生', await page.locator('#btnBuild').isEnabled());
  const std = await page.evaluate(() => { const c = buildCollage(state.colSel.slice(), 'std', true); return c.width + '×' + c.height; });
  ok('一般組圖輸出尺寸與以前一樣（2 欄）', std.startsWith('2460×'), std);
  await page.click('.fmt[data-fmt="row"]');
  ok('點一般版型按鈕仍可切換', await page.evaluate(() => state.colFormat === 'row'));
  await page.click('.tplb[data-tpl="fmx18"]');
  await page.click('.tplb[data-tpl=""]');
  ok('離開模板後回到剛才用的一般版型（並排），不是亂跳', await page.evaluate(() => state.colFormat === 'row'));

  console.log('— 手機尺寸：格子地圖看得清楚 —');
  await page.click('.tplb[data-tpl="fmx18"]');
  await page.setViewportSize({ width: 390, height: 844 });
  const phone = await page.evaluate(() => {
    const m = document.getElementById('tplMap').getBoundingClientRect();
    const s = document.querySelector('.tpl-slot[data-slot="0"]').getBoundingClientRect();
    return { w:Math.round(m.width), h:Math.round(m.height), cw:Math.round(s.width), ch:Math.round(s.height),
             overflowX: document.documentElement.scrollWidth > window.innerWidth + 1 };
  });
  ok('地圖寬度塞得進手機畫面', phone.w <= 390 && !phone.overflowX, JSON.stringify(phone));
  ok('單格至少 40px 寬（點得到、看得到）', phone.cw >= 40, phone.cw + 'px');
  await page.locator('#tplBox').screenshot({ path: OUT + '/v25-map-phone.png' });

  console.log(`\n結果：${pass} 通過, ${fail} 失敗`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('SCRIPT ERROR:', e); process.exit(1); });
