/* DentFigure 中文化層的回歸測試。
 *
 * 這組測試要守住三件事,每一件都踩過或差點踩到:
 *
 * 1. 翻譯層不能弄壞 app。它是在 app 的 script 之後才跑的一個 DOM 走訪,
 *    只要有一個例外沒接住,整個介面就停在半翻譯狀態。
 * 2. 翻譯只能做「完整字串精確比對」。若改成子字串替換,使用者輸入的
 *    檔名、面板標籤、病例代號會被一起改掉——那是無聲的資料損壞。
 * 3. 上游快照必須維持原封不動。27 個上游 spec 檔斷言英文 UI 字串,
 *    快照一旦被翻到,那 469 筆測試就不再有意義。
 */
const { chromium } = require('playwright-core');
const { DENTFIG, LOGIN, chromePath } = require('./env');
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(n, c, d){ if(c){pass++;console.log('  ✓',n+(d?'  → '+d:''));} else {fail++;console.log('  ✗ FAIL:',n+(d?'  → '+d:''));} }

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath() });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => {
    if (m.type() === 'error' && !/Failed to load resource|net::ERR|favicon/i.test(m.text()))
      errs.push('console.error: ' + m.text());
  });

  console.log('\n— 登入守衛 —');
  await page.goto(LOGIN);
  await page.evaluate(() => localStorage.removeItem('nckuh_endo_authed'));
  await page.goto(DENTFIG);
  await page.waitForLoadState('domcontentloaded');
  ok('未登入直開會被導回登入頁', !/apps\/dentfigure/.test(page.url()), page.url().replace(/^https?:\/\/[^/]+/, ''));

  await page.evaluate(() => localStorage.setItem('nckuh_endo_authed', '1'));
  await page.goto(DENTFIG);
  await page.waitForFunction(() => typeof render === 'function' && typeof _commitImage === 'function');
  await page.waitForTimeout(400);
  ok('已登入可正常開啟', /apps\/dentfigure/.test(page.url()));

  console.log('\n— 翻譯層 —');
  const t = await page.evaluate(() => ({
    title: document.title,
    loaded: typeof window.__i18n === 'object',
    dict: window.__i18n ? Object.keys(window.__i18n.dict).length : 0,
  }));
  ok('翻譯層有載入', t.loaded, `字典 ${t.dict} 筆`);
  ok('頁面標題已中文化', /臨床影像組版/.test(t.title), t.title);

  const heads = await page.evaluate(() =>
    [...document.querySelectorAll('summary')].slice(0, 9).map(s => s.textContent.trim()));
  const want = ['影像','排列','範本','裁切與比例','標註與繪圖','外觀','測量','檢查','匯出'];
  const hit = want.filter(w => heads.some(h => h.includes(w)));
  ok('九個主工作區塊都已中文化', hit.length === 9, `${hit.length}/9 · ${heads.slice(0,4).join(' / ')}`);

  console.log('\n— app 本身仍正常運作 —');
  await page.evaluate(async () => {
    const mk = i => { const c=document.createElement('canvas'); c.width=c.height=100;
      const x=c.getContext('2d'); const g=40+i*50;
      x.fillStyle=`rgb(${g},${g},${g})`; x.fillRect(0,0,100,100);
      x.fillStyle='#fff'; x.fillRect(10,10,20,20); return c.toDataURL('image/png'); };
    for (let i=0;i<4;i++) {
      const src = mk(i);
      await new Promise(res => { const img=new Image();
        img.onload=()=>{ _commitImage(img, src, `panel${i}.png`); res(); }; img.src=src; });
    }
    sv('cols','2'); sv('rows','2'); onLayoutChange(); render();
  });
  const st = await page.evaluate(() => {
    const c = document.getElementById('fig-canvas');
    return { n: images.length, w: c.width, h: c.height };
  });
  ok('可以植入 4 個面板', st.n === 4, `${st.n} 個`);
  ok('畫布有實際算出尺寸', st.w > 0 && st.h > 0, `${st.w}×${st.h}`);

  const exp = await page.evaluate(() => {
    const c = renderExportCanvas(300);
    return { w: c.width, h: c.height };
  });
  ok('300 DPI 匯出畫布產生成功', exp.w > st.w && exp.h > st.h, `${exp.w}×${exp.h}`);

  console.log('\n— 精確比對:使用者資料不可被翻譯 —');
  const safe = await page.evaluate(() => {
    // 面板標號是使用者資料。字典裡有 'Label' → '標號',若改成子字串替換,
    // 名為 "Label" 的檔案或標籤就會被改掉。
    images[0].name = 'Export';          // 與字典的 'Export' → '匯出' 完全同字
    images[1].name = 'my Export file';  // 含字典字串,但整串不同
    renderImgList();
    const rows = [...document.querySelectorAll('#img-list')].map(e => e.textContent).join(' ');
    return { keptExact: images[0].name, keptPartial: images[1].name, listHas: rows.includes('my Export file') };
  });
  ok('使用者資料在 model 中未被改寫', safe.keptExact === 'Export' && safe.keptPartial === 'my Export file');
  ok('含字典字串的檔名不被部分替換', safe.listHas, safe.keptPartial);

  // 踩過:字典收了 'Lab' → '實驗室'(佈景名),把 <div class="logo">Figure<span>Lab</span></div>
  // 也翻掉,logo 變成「Figure實驗室」。現在 .logo 在結構上受保護,字典寫錯也不會再中。
  const brand = await page.evaluate(() => {
    const el = document.querySelector('.logo');
    return { text: el ? el.textContent.trim() : '(找不到 .logo)' };
  });
  ok('品牌名不被翻譯', !/[一-鿿]/.test(brand.text), brand.text);

  const guarded = await page.evaluate(() => {
    // 即使字典裡真的有這個字,.logo 子樹也不該被動到
    window.__i18n.dict['__BRANDTEST__'] = '中文';
    const el = document.querySelector('.logo');
    const span = document.createElement('span');
    span.textContent = '__BRANDTEST__';
    el.appendChild(span);
    window.__i18n.retranslate();
    const got = span.textContent;
    span.remove();
    return got;
  });
  ok('.logo 子樹在結構上受保護', guarded === '__BRANDTEST__', guarded);

  console.log('\n— 上游快照必須維持原封不動 —');
  const snap = path.join(__dirname, '..', 'apps', 'dentfigure', 'upstream', 'figurelab', 'figure_lab.html');
  const snapSrc = fs.readFileSync(snap, 'utf8');
  ok('快照沒有被掛上翻譯層', !snapSrc.includes('i18n-zh-TW.js'));
  ok('快照沒有被加上登入守衛', !snapSrc.includes('nckuh_endo_authed'));
  ok('快照標題仍是上游原文', snapSrc.includes('<title>FigureLab</title>'));
  const appSrc = fs.readFileSync(path.join(__dirname,'..','apps','dentfigure','index.html'), 'utf8');
  const dl = appSrc.split('\n').length - snapSrc.split('\n').length;
  ok('index.html 與快照只差掛載用的那幾行', dl >= 1 && dl <= 4, `多 ${dl} 行`);

  console.log('\n— 編碼(中文化最容易踩的坑)—');
  const i18nBuf = fs.readFileSync(path.join(__dirname,'..','apps','dentfigure','i18n-zh-TW.js'));
  ok('i18n 檔沒有 UTF-8 BOM', !(i18nBuf[0]===0xEF && i18nBuf[1]===0xBB && i18nBuf[2]===0xBF));
  let validUtf8 = true;
  try { new TextDecoder('utf-8', { fatal: true }).decode(i18nBuf); } catch(e){ validUtf8 = false; }
  ok('i18n 檔是合法 UTF-8', validUtf8);
  // CP1252 誤讀 UTF-8 的典型殘骸:â€” Â· ä¸­ 之類
  ok('i18n 檔沒有 mojibake', !/Ã[-¿]|â€|Â[ -¿]/.test(i18nBuf.toString('utf8')));

  ok('全程沒有 JS 錯誤', errs.length === 0, errs.slice(0,3).join(' | ') || '無');

  await browser.close();
  console.log(`\n通過 ${pass} 項，失敗 ${fail} 項`);
  process.exit(fail ? 1 : 0);
})();
