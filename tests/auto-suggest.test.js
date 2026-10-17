/* v2.6 依學過的排列建議（實驗）
   ⚠ 這裡用的是「合成的假 X 光」，只能驗證機制（比對、指派、把握度、統計、隱私、邊界），
   **不能代表真實根尖片的準確度**——真實準確度要看使用者自己畫面上的累計「保留比例」。
   合成資料的參數在跑之前就定好，不為了讓數字好看而調整。 */
const { chromium } = require('playwright-core');
const { URL, LOGIN, chromePath, OUT } = require('./env');
let pass = 0, fail = 0;
function ok(n, c, d){ if(c){pass++;console.log('  ✓',n+(d?'  → '+d:''));} else {fail++;console.log('  ✗ FAIL:',n+(d?'  → '+d:''));} }
function info(n, d){ console.log('  ℹ',n+'  → '+d); }

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath() });
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 1000 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => { fail++; console.log('  ✗ PAGE ERROR:', e.message); });
  const dialogs = [];
  page.on('dialog', async d => { dialogs.push(d.message()); await d.accept(); });
  await page.goto(LOGIN);
  await page.evaluate(() => localStorage.setItem('nckuh_endo_authed','1'));
  await page.goto(URL);
  await page.evaluate(() => new Promise(r => { if (window.idb) { idb.close(); idb=null; } const q=indexedDB.deleteDatabase('caseMarker'); q.onsuccess=q.onerror=q.onblocked=()=>r(); }));
  await page.evaluate(() => { const k=localStorage.getItem('nckuh_endo_authed'); localStorage.clear(); localStorage.setItem('nckuh_endo_authed', k); });
  await page.reload();
  await page.waitForFunction(() => typeof state !== 'undefined');

  // ── 合成「根尖片」產生器 ──
  // 解剖（每一格固定的結構）：由格子編號決定；左右對稱的兩格互為「水平鏡像」，
  //   而且每張都有偏一側的補綴物，所以鏡像不會長得一樣。
  // 病人差異：位置／大小的抖動、對比與亮度、雜訊。同一病人追蹤前後只多一點小抖動。
  await page.evaluate(() => {
    const rng = seed => { let s = seed >>> 0; return () => (s = (s*1664525 + 1013904223) >>> 0) / 4294967296; };
    const mirror = i => i <= 6 ? 6 - i : (i <= 10 ? 17 - i : 28 - i);          // 0↔6, 7↔10, 11↔17
    const kind = i => [2,3,4,13,14,15].includes(i) ? 'ant' : (i >= 7 && i <= 10 ? 'bw' : 'post');
    const dims = i => kind(i) === 'ant' ? [200, 300] : (kind(i) === 'bw' ? [300, 214] : [300, 200]);
    window.__film = (slot, patient, visit, perturb) => {
      const [w, h] = dims(slot);
      const m = mirror(slot), canon = Math.min(slot, m), flip = slot > m;
      const ra = rng(5000 + canon*101);
      const teeth = [];
      for(let k=0;k<6;k++) teeth.push({ x:0.1+0.8*(k+ra()*0.6)/6, y:0.3+0.4*ra(), rw:0.05+0.07*ra(), rh:0.12+0.2*ra(), v:150+80*ra() });
      const rest = { x:0.15+0.25*ra(), y:0.25+0.2*ra(), w:0.12+0.1*ra(), h:0.05+0.05*ra() };   // 偏一側的補綴物
      const rp = rng(patient*977 + slot*13), rv = rng(patient*977 + slot*13 + (visit+1)*100003);
      const jit = (r, s) => (r() - 0.5) * 2 * s;
      const con = 0.75 + 0.5*rp(), off = (rp() - 0.5)*40;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d');
      const grad = g.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, '#2a2a2a'); grad.addColorStop(1, '#484848');
      g.fillStyle = grad; g.fillRect(0, 0, w, h);
      const X = x => (flip ? 1 - x : x) * w;
      teeth.forEach(t => {
        const dx = jit(rp, perturb) + jit(rv, 0.05), dy = jit(rp, perturb) + jit(rv, 0.05), ds = 1 + jit(rp, perturb);
        const v = Math.max(30, Math.min(255, t.v*con + off));
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.beginPath(); g.ellipse(X(t.x + dx), (t.y + dy)*h, t.rw*w*ds, t.rh*h*ds, 0, 0, 7); g.fill();
      });
      { const dx = jit(rp, perturb) + jit(rv, 0.05), dy = jit(rp, perturb) + jit(rv, 0.05);
        const rx = flip ? 1 - (rest.x + dx) - rest.w : rest.x + dx;
        g.fillStyle = '#f4f4f4'; g.fillRect(rx*w, (rest.y + dy)*h, rest.w*w, rest.h*h); }
      const im = g.getImageData(0, 0, w, h), d = im.data;
      for(let i=0;i<d.length;i+=4){ const n = (rv() + rv() + rv() - 1.5) * 16; d[i] += n; d[i+1] += n; d[i+2] += n; }
      g.putImageData(im, 0, 0);
      return c;
    };
    window.__mirror = mirror;
    window.__importSeries = async (prefix, patient, visit, perturb, order) => {
      const items = [];
      for(let s=0;s<18;s++){
        const c = __film(s, patient, visit, perturb);
        const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.95));
        items.push(new File([blob], prefix + '_' + String(s).padStart(2,'0') + '.jpg', { type:'image/jpeg' }));
      }
      const r = rng(order);                                            // 打亂匯入順序：不能靠順序猜
      for(let i=items.length-1;i>0;i--){ const j = Math.floor(r()*(i+1)); [items[i], items[j]] = [items[j], items[i]]; }
      const dt = new DataTransfer(); items.forEach(f => dt.items.add(f));
      const inp = document.getElementById('fileIn'); inp.files = dt.files; inp.dispatchEvent(new Event('change'));
    };
    window.__mkCase = (code, prefix) => {
      const c = { id:'case_' + code, code:code, note:'', ts:Date.now() };
      state.cases.unshift(c); caseWrite(c);
      state.photos.forEach(p => { if(p.name.indexOf(prefix) === 0) p.caseId = c.id; });
      state.pickCase = c.id; renderCollage();
      return c.id;
    };
    window.__score = prefix => {                                       // 目前格子裡有幾格是對的
      const a = slotArr('fmx18'); let right = 0, placed = 0, mir = 0, wrongSlots = [];
      a.forEach((id, i) => {
        if(!id) return; placed++;
        const p = photoById(id), k = parseInt(p.name.split('_')[1], 10);
        if(p.name.indexOf(prefix) === 0 && k === i) right++;
        else { if(p.name.indexOf(prefix) === 0 && k === __mirror(i)) mir++; wrongSlots.push(i); }
      });
      return { right:right, placed:placed, mirrorErr:mir, wrongSlots:wrongSlots };
    };
  });
  const importSeries = async (prefix, patient, visit, perturb, order) => {
    const before = await page.evaluate(() => state.photos.length);
    await page.evaluate(a => __importSeries(...a), [prefix, patient, visit, perturb, order]);
    await page.waitForFunction(n => state.photos.length === n + 18, before, { timeout: 60000 });
  };

  console.log('— 匈牙利演算法：真的求「總分最高」，不是貪婪 —');
  const hu = await page.evaluate(() => ({
    greedyTrap: assignMax([[0.9, 0.85], [0.85, 0.0]]),             // 貪婪會先拿 0.9 再被迫拿 0（總 0.9），最佳是 1.7
    tall: assignMax([[0.9, 0.1], [0.8, 0.7], [0.2, 0.6]]),           // 3 張照片、2 格 → 列多於欄
    wide: assignMax([[0.1, 0.9, 0.2], [0.8, 0.7, 0.1]]),             // 2 張照片、3 格 → 欄多於列
    empty: assignMax([]), noCols: assignMax([[], []]) }));
  ok('貪婪陷阱：選總分最高的配對', JSON.stringify(hu.greedyTrap) === '[1,0]', JSON.stringify(hu.greedyTrap));
  ok('照片比格子多：留下最不合的那張', JSON.stringify(hu.tall) === '[0,1,-1]', JSON.stringify(hu.tall));
  ok('格子比照片多', JSON.stringify(hu.wide) === '[1,0]', JSON.stringify(hu.wide));
  ok('空輸入不當掉', JSON.stringify(hu.empty) === '[]' && JSON.stringify(hu.noCols) === '[-1,-1]');

  console.log('— 合成片的前提檢查：左右鏡像的兩格真的是鏡像、而且不一樣 —');
  const mir = await page.evaluate(() => {
    const px = c => { const g = c.getContext('2d'); return g.getImageData(0,0,c.width,c.height).data; };
    // 同一病人、同一次、零抖動：slot 0 與 slot 6 應互為水平鏡像
    const a = __film(0, 1, 0, 0), b = __film(6, 1, 0, 0);
    const pa = px(a), pb = px(b), w = a.width, h = a.height;
    let diffMirror = 0, diffSame = 0;
    for(let y=0;y<h;y+=7) for(let x=0;x<w;x+=7){
      const i = (y*w + x)*4, j = (y*w + (w-1-x))*4;
      diffMirror += Math.abs(pa[i] - pb[j]); diffSame += Math.abs(pa[i] - pb[i]);
    }
    return { diffMirror:diffMirror, diffSame:diffSame };
  });
  ok('鏡像後幾乎重合（差異遠小於不鏡像時）', mir.diffMirror < mir.diffSame * 0.5, `鏡像差 ${mir.diffMirror} vs 直接比 ${mir.diffSame}`);

  console.log('— 進入模板、尚未學過任何排列 —');
  await page.click('#tabGrid');
  await page.click('#btnTplFmx18');
  ok('「建議」按鈕有「新」徽章', await page.evaluate(() => { const el = document.getElementById('btnTplSuggest'); return el.classList.contains('is-new') && getComputedStyle(el,'::after').content.includes('新'); }));
  ok('摘要顯示還沒學過', (await page.textContent('#tplLearn')).includes('還沒學過任何排列'));
  await page.click('#btnTplSuggest');
  ok('沒學過時，提示先手動排並確認', (await page.textContent('#tplMsg')).includes('還沒有學過'));

  console.log('— 學習：把病人 A 的一組（18 張，打亂順序匯入）按正確位置放好，按「這個排列正確」 —');
  await importSeries('sA', 1, 0, 0.12, 11);
  await page.evaluate(() => { const a = slotArr('fmx18'); state.photos.forEach(p => { if(p.name.indexOf('sA_') === 0) a[parseInt(p.name.split('_')[1], 10)] = p.id; }); renderCollage(); });
  ok('18 格都放好了', await page.evaluate(() => slotArr('fmx18').every(Boolean)));
  await page.click('#btnTplLearn');
  const learn1 = await page.evaluate(() => ({ msg: document.getElementById('tplMsg').textContent, m: memGet().tpl.fmx18, sum: document.getElementById('tplLearn').textContent }));
  ok('18 格各記下 1 個範例', Object.keys(learn1.m).length === 18 && Object.values(learn1.m).every(l => l.length === 1), learn1.msg);
  ok('摘要更新', learn1.sum.includes('已學過 18／18 格的範例（共 18 個）'), learn1.sum);
  await page.click('#btnTplLearn');
  ok('同一組重複按確認，不會重複記範例', await page.evaluate(() => Object.values(memGet().tpl.fmx18).every(l => l.length === 1)));
  await page.click('#btnTplClear');

  console.log('— 不同病人 B（跨病人，最難的情況）：只記了 A，去建議 B —');
  await importSeries('sB', 2, 0, 0.12, 22);
  await page.evaluate(() => __mkCase('B', 'sB_'));
  await page.click('#btnTplSuggest');
  const sb = await page.evaluate(() => ({ s: __score('sB_'), msg: document.getElementById('tplMsg').textContent,
    dup: new Set(slotArr('fmx18').filter(Boolean)).size === slotArr('fmx18').filter(Boolean).length }));
  info('跨病人弱差異（合成資料）', `放了 ${sb.s.placed} 格，對 ${sb.s.right} 格，鏡像誤放 ${sb.s.mirrorErr} 格；其餘 ${18 - sb.s.placed} 格留空`);
  ok('沒有任何照片或格子被重複使用', sb.dup);
  ok('跨病人：放進去的幾乎都是對的（寧可留空，不亂放）', sb.s.placed - sb.s.right <= 1 && sb.s.placed >= 1, `放 ${sb.s.placed}、錯 ${sb.s.placed - sb.s.right}`);
  ok('只放了病例 B 的照片（篩選範圍有效）', await page.evaluate(() => slotArr('fmx18').filter(Boolean).every(id => photoById(id).name.indexOf('sB_') === 0)));
  ok('提示明講不是影像辨識、通常同病人才準、左右側容易搞混', sb.msg.includes('不是影像辨識') && sb.msg.includes('同一個病人') && sb.msg.includes('左右側'), sb.msg.slice(0, 70));
  ok('沒放的格子會回報最高相似度（方便用真實資料校準）', /沒放的最高只有 \d+%/.test(sb.msg), sb.msg.match(/（沒放的[^）]*）/) && sb.msg.match(/（沒放的[^）]*）/)[0]);
  ok('每個被放的格子都有把握度徽章', await page.locator('.tpl-slot .cf').count() === sb.s.placed);
  await page.screenshot({ path: OUT + '/v26-suggest-cross.png' });
  await page.click('#btnTplClear');

  console.log('— 壓力測試：病人之間的差異逐步加大（記憶只有 A）——合成資料，只看「退化得多快」 —');
  console.log('    ⚠ 上面 0.12 的跨病人情況太好分（每格的結構在所有病人之間共用）；真實根尖片的差異大得多');
  const stress = { wrong: 0, placed: 0 };
  for(const [pfx, pat, lvl] of [['sC', 3, 0.25], ['sD', 4, 0.40], ['sE', 5, 0.60]]){
    await importSeries(pfx, pat, 0, lvl, 40 + pat);
    await page.evaluate(a => __mkCase(a[0], a[0] + '_'), [pfx]);
    await page.click('#btnTplSuggest');
    const r = await page.evaluate(p => {
      const sc = __score(p + '_'), a = slotArr('fmx18'), R = [], W = [];
      a.forEach((id, i) => { if(!id) return; const c = slotConf.fmx18[i], k = parseInt(photoById(id).name.split('_')[1], 10); (k === i ? R : W).push(c.score); });
      const avg = x => x.length ? (x.reduce((s, v) => s + v, 0) / x.length) : NaN;
      const hi = a.map((id, i) => id && slotConf.fmx18[i].score >= SUG_OK ? (parseInt(photoById(id).name.split('_')[1], 10) === i ? 'R' : 'W') : null).filter(Boolean);
      sc.avgRight = avg(R); sc.avgWrong = avg(W); sc.hiRight = hi.filter(x => x === 'R').length; sc.hiWrong = hi.filter(x => x === 'W').length;
      return sc;
    }, pfx);
    stress.wrong += r.placed - r.right; stress.placed += r.placed;
    info('差異強度 ' + lvl, `放 ${r.placed} 格，對 ${r.right} 格（${Math.round(r.right/18*100)}%），鏡像誤放 ${r.mirrorErr}；平均把握度 對=${r.avgRight.toFixed(2)} 錯=${r.avgWrong.toFixed(2)}；把握度≥${60}% 的：對 ${r.hiRight} 錯 ${r.hiWrong}`);
    await page.click('#btnTplClear');
  }

  ok('壓力測試：寧可留空，不亂放（三組差異共放的錯誤格數 ≤ 2）', stress.wrong <= 2, `共放 ${stress.placed} 格，錯 ${stress.wrong} 格`);

  console.log('— 同一病人追蹤前後 A′（補綴物與牙形一致）—');
  await importSeries('sF', 1, 1, 0.12, 33);
  await page.evaluate(() => __mkCase('FU', 'sF_'));
  await page.click('#btnTplSuggest');
  const sf = await page.evaluate(() => ({ s: __score('sF_'), conf: Object.values(slotConf.fmx18).map(c => c.score) }));
  info('同病人追蹤（合成資料）', `放了 ${sf.s.placed} 格，對 ${sf.s.right} 格；把握度 ${Math.min(...sf.conf).toFixed(2)}~${Math.max(...sf.conf).toFixed(2)}`);
  ok('同病人追蹤：幾乎全對', sf.s.right >= 16, sf.s.right + '／18');
  ok('同病人追蹤的把握度都在門檻以上', Math.min(...sf.conf) >= 0.6);
  const confCls = await page.evaluate(() => Array.from(document.querySelectorAll('.tpl-slot .cf')).map(e => e.className.replace('cf ', '')));
  ok('把握度徽章有分色（高／中；低的根本不會放）', confCls.every(c => ['hi','mid'].includes(c)), [...new Set(confCls)].join(','));
  await page.screenshot({ path: OUT + '/v26-suggest-followup.png' });

  console.log('— 把握度徽章：手動動過的格子不再顯示「建議」 —');
  const nb = await page.locator('.tpl-slot .cf').count();
  await page.click('.tpl-slot[data-slot="3"] .x');
  ok('清掉一格後，那格的徽章消失', await page.locator('.tpl-slot .cf').count() === nb - 1, `${nb} → ${nb - 1}`);
  await page.click('#pickGrid .thumb:not(.sel) >> nth=0');            // 把剛清掉的那張手動放回去（唯一沒放的）
  ok('手動放回的照片不帶「建議」徽章（即使是同一張）', await page.locator('.tpl-slot .cf').count() === nb - 1);
  ok('第 4 格確實有放回去', await page.evaluate(() => !!slotArr('fmx18')[3]));

  console.log('— 累計「保留比例」：你改了幾格，統計就記幾格 —');
  // 先整理成已知狀態：清空 → 重新建議 → 故意交換兩格 → 確認
  await page.click('#btnTplClear');
  await page.evaluate(() => { lastSuggest = null; });
  await page.click('#btnTplSuggest');
  const pre = await page.evaluate(() => {
    const a = slotArr('fmx18'); const placed = a.filter(Boolean).length;
    const t = a[0]; a[0] = a[1]; a[1] = t;                               // 故意換掉兩格
    renderCollage();
    let kept = 0, sug = 0; for(const k in lastSuggest.map){ sug++; if(a[k] === lastSuggest.map[k]) kept++; }
    return { placed:placed, sug:sug, kept:kept, before: JSON.parse(JSON.stringify(memGet().stat.fmx18 || { sug:0, kept:0 })) };
  });
  await page.click('#btnTplLearn');
  const post = await page.evaluate(() => ({ st: memGet().stat.fmx18, msg: document.getElementById('tplMsg').textContent, sum: document.getElementById('tplLearn').textContent }));
  ok('累計建議格數 = 本次建議格數', post.st.sug === pre.before.sug + pre.sug, `${post.st.sug}`);
  ok('累計保留格數 = 沒被你改的格數', post.st.kept === pre.before.kept + pre.kept, `${post.st.kept}（改了 ${pre.sug - pre.kept} 格）`);
  ok('改了 2 格 → 保留比建議少 2', pre.sug - pre.kept === 2, `${pre.kept}／${pre.sug}`);
  ok('訊息與摘要顯示保留比例', post.msg.includes('你保留了') && /\d+%/.test(post.sum), post.sum);
  ok('確認後 lastSuggest 重置（下次重新計）', await page.evaluate(() => lastSuggest === null));

  console.log('— 不動你已經放好的格子 —');
  await page.click('#btnTplClear');
  const keep = await page.evaluate(() => {
    const a = slotArr('fmx18'), wrong = state.photos.find(p => p.name.indexOf('sF_09') === 0);   // 故意手動放一張到第 6 格
    a[5] = wrong.id; renderCollage();
    return { wrongId: wrong.id };
  });
  await page.click('#btnTplSuggest');
  const k2 = await page.evaluate(id => { const a = slotArr('fmx18'); return { at5: a[5], count: a.filter(x => x === id).length }; }, keep.wrongId);
  ok('手動放的第 6 格沒被覆蓋', k2.at5 === keep.wrongId);
  ok('那張照片沒被重複放進別格', k2.count === 1);

  console.log('— 門檻：形狀像不夠，雜訊圖不會被硬放 —');
  ok('結構相關性門檻 R_MIN ≥ 0.20（白雜訊相關性雜訊約 0.04 的 4.8 倍）', await page.evaluate(() => R_MIN >= 0.2), await page.evaluate(() => R_MIN));
  await page.click('#btnTplClear');
  const junk = await page.evaluate(async () => {
    // 3 張純雜訊圖（長寬比 3:2，與後牙根尖片相同）＋一張純色圖；格子數遠多於它們，且正確的照片已被清空出池
    const files = [];
    for(let k=0;k<4;k++){
      const c = document.createElement('canvas'); c.width = 300; c.height = 200;
      const g = c.getContext('2d'), im = g.createImageData(300, 200);
      for(let i=0;i<im.data.length;i+=4){ const v = k === 3 ? 90 : Math.random()*255; im.data[i] = im.data[i+1] = im.data[i+2] = v; im.data[i+3] = 255; }
      g.putImageData(im, 0, 0);
      const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.95));
      files.push(new File([blob], 'junk_' + k + '.jpg', { type:'image/jpeg' }));
    }
    const dt = new DataTransfer(); files.forEach(f => dt.items.add(f));
    const inp = document.getElementById('fileIn'); inp.files = dt.files; inp.dispatchEvent(new Event('change'));
  });
  await page.waitForFunction(() => state.photos.filter(p => p.name.indexOf('junk_') === 0).length === 4);
  await page.evaluate(() => { __mkCase('JK', 'junk_'); });
  await page.click('#btnTplSuggest');
  const jr = await page.evaluate(() => ({ placed: slotArr('fmx18').filter(Boolean).length, msg: document.getElementById('tplMsg').textContent }));
  ok('雜訊圖與純色圖都不夠像，一張都沒放', jr.placed === 0, jr.placed + ' 張；' + jr.msg.slice(0, 50));
  ok('明講沒有夠像的照片', jr.msg.includes('沒有任何一張'), jr.msg);

  console.log('— 雜訊誤放率（200 張隨機雜訊 × 已學過的全部範例） —');
  const fp = await page.evaluate(() => {
    let s = 777; const r = () => (s = (s*1664525 + 1013904223) >>> 0) / 4294967296;
    const mem = memGet().tpl.fmx18, exs = [];
    Object.keys(mem).forEach(k => mem[k].forEach(e => exs.push(decDesc(e))));
    let falsePos = 0, maxScore = 0;
    for(let n=0;n<200;n++){
      const c = document.createElement('canvas'); c.width = 300; c.height = 200;       // 與後牙根尖片同長寬比：形狀分拿滿
      const g = c.getContext('2d'), im = g.createImageData(300, 200);
      for(let i=0;i<im.data.length;i+=4){ const v = r()*255; im.data[i] = im.data[i+1] = im.data[i+2] = v; im.data[i+3] = 255; }
      g.putImageData(im, 0, 0);
      const d = photoDesc({ bmp:c });
      let best = 0; exs.forEach(e => { const sc = descSim(d, e); if(sc > best) best = sc; });
      maxScore = Math.max(maxScore, best); if(best >= SUG_MIN) falsePos++;
    }
    return { falsePos:falsePos, maxScore:maxScore, ex:exs.length };
  });
  info('雜訊對全部範例的最高分', fp.maxScore.toFixed(3) + '（比對 ' + fp.ex + ' 個範例）');
  ok('200 張雜訊一張都不會被放進去', fp.falsePos === 0, fp.falsePos + '／200');

  console.log('— 範例數量上限（每格最多記 6 個，舊的先丟）—');
  const cap = await page.evaluate(async () => {
    state.pickCase = 'all';
    for(let k=0;k<8;k++){
      const c = __film(0, 100 + k, 0, 0.2);
      const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.95));
      const f = new File([blob], 'cap_' + k + '.jpg', { type:'image/jpeg' });
      const dt = new DataTransfer(); dt.items.add(f);
      const before = state.photos.length;
      const inp = document.getElementById('fileIn'); inp.files = dt.files; inp.dispatchEvent(new Event('change'));
      while(state.photos.length === before) await new Promise(r => setTimeout(r, 30));
      state.colSlots.fmx18 = []; slotArr('fmx18')[0] = state.photos.find(p => p.name.indexOf('cap_' + k) === 0).id;
      document.getElementById('btnTplLearn').click();
    }
    return { n: memGet().tpl.fmx18[0].length };
  });
  ok('第 1 格範例數被限制在 6 個', cap.n === 6, cap.n + '');

  console.log('— 隱私：記下的是小特徵，不是照片、檔名、病例代號 —');
  const priv = await page.evaluate(async () => {
    const raw = localStorage.getItem('cm_tplmem');
    // base64 字母表沒有底線，所以含底線的檔名／代號不可能「剛好」出現在特徵資料裡；
    // （照片 id 像 p13 太短，會隨機撞上 base64，改用下面的結構檢查證明沒有 id 欄位）
    const names = state.photos.map(p => p.name).concat(state.cases.map(c => 'case_' + c.code)).filter(n => n.indexOf('_') >= 0);
    const leak = names.filter(n => raw.indexOf(n) >= 0);
    const meta = JSON.parse(raw);
    const r = await buildArchive({});
    const un = window.fflate.unzipSync(new Uint8Array(await r.blob.arrayBuffer()));
    const bk = new TextDecoder().decode(un['backup.json']);
    const ex = Object.values(meta.tpl.fmx18)[0][0];
    return { bytes: raw.length, leak: leak, keys: Object.keys(meta).sort().join(','), exKeys: Object.keys(ex).sort().join(','),
             inBackup: bk.indexOf('cm_tplmem') >= 0 || bk.indexOf('"tpl"') >= 0, q: ex.q.length };
  });
  ok('儲存內容不含任何檔名／照片 id／病例代號', priv.leak.length === 0, priv.leak.join(',') || '無');
  ok('只有版本、範例特徵與統計', priv.keys === 'stat,tpl,v', priv.keys);
  ok('每個範例只有 q（24×24 位元組）、m、a', priv.exKeys === 'a,m,q' && priv.q === 768, priv.exKeys + '／' + priv.q);
  ok('整體很小（< 300KB）', priv.bytes < 300000, (priv.bytes/1024).toFixed(0) + 'KB');
  ok('不進備份檔', !priv.inBackup);

  console.log('— 清除學習資料 —');
  await page.click('#btnTplForget');
  const fg = await page.evaluate(() => ({ raw: JSON.parse(localStorage.getItem('cm_tplmem')), sum: document.getElementById('tplLearn').textContent, conf: Object.keys(slotConf).length }));
  ok('學習資料清空', Object.keys(fg.raw.tpl).length === 0 && Object.keys(fg.raw.stat).length === 0);
  ok('摘要回到「還沒學過」', fg.sum.includes('還沒學過任何排列'));
  await page.click('#btnTplClear');
  await page.click('#btnTplSuggest');
  ok('清除後再建議，會要求先學', (await page.textContent('#tplMsg')).includes('還沒有學過'));

  console.log('— 重新整理後學習資料還在（存在 localStorage） —');
  await page.evaluate(() => { state.pickCase = 'all'; slotArr('fmx18')[0] = state.photos.find(p => p.name.indexOf('sA_00') === 0).id; document.getElementById('btnTplLearn').click(); });
  await page.evaluate(async () => { flushNow(); await new Promise(r => setTimeout(r, 900)); });
  await page.reload();
  await page.waitForFunction(() => state.photos.length > 0, null, { timeout: 20000 });
  await page.click('#tabGrid'); await page.click('#btnTplFmx18');
  ok('重整後摘要仍顯示已學過', (await page.textContent('#tplLearn')).includes('已學過 1／18'), await page.textContent('#tplLearn'));

  console.log('— 一般組圖不受影響 —');
  await page.click('.tplb[data-tpl=""]');
  ok('切回一般組圖後，格子地圖與建議按鈕都收起來', await page.evaluate(() => getComputedStyle(document.getElementById('tplBox')).display === 'none'));

  console.log(`\n結果：${pass} 通過, ${fail} 失敗`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('SCRIPT ERROR:', e); process.exit(1); });
