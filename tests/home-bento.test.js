/* 首頁 Bento 版：主角格／造訪格／補滿最後一排、篩選與搜尋、我的最愛、加入主畫面
   統計端點與 GitHub Pages 在測試環境都連不到，一律攔下來。 */
const { chromium } = require('playwright-core');
const { LOGIN, chromePath } = require('./env');
let pass = 0, fail = 0;
function ok(n, c, d){ if(c){pass++;console.log('  ✓',n+(d?'  → '+d:''));} else {fail++;console.log('  ✗ FAIL:',n+(d?'  → '+d:''));} }

const STATS = { visits: 1284, apps: { 'case-marker': 128, 'live-poll': 25, 'dental-trauma-guide': 41,
  'pdf-toolbox': 96, 'endo-ppt-generator': 30, 'dentfigure': 12 } };
const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const LINE = IOS.replace('Safari/604.1', 'Safari Line/14.0.0');
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: IOS };

async function newCtx(browser, { stats = STATS, opts = {}, prefs = {}, init } = {}){
  const ctx = await browser.newContext(opts);
  await ctx.route('https://script.google.com/**', async route => {
    if (!stats) return route.abort();
    const cb = new URL(route.request().url()).searchParams.get('callback');
    await route.fulfill({ contentType: 'text/javascript', body: `${cb}(${JSON.stringify(stats)});` });
  });
  // 開啟 App 的新分頁不用真的載入工具（它們有自己的測試）
  await ctx.route('**/apps/**', r => r.fulfill({ contentType: 'text/html', body: '<title>stub</title>' }));
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  page.on('pageerror', e => { fail++; console.log('  ✗ PAGE ERROR:', e.message); });
  await page.goto(LOGIN);
  await page.evaluate(p => {
    localStorage.clear();
    localStorage.setItem('nckuh_endo_authed', '1');
    Object.entries(p).forEach(([k, v]) => localStorage.setItem(k, v));
  }, prefs);
  await page.reload();
  await page.waitForSelector('.app-card');
  await page.waitForTimeout(stats ? 500 : 900);
  return { ctx, page };
}

const featureSlug = p => p.$eval('.tile.feature .app-hits', e => e.dataset.slug);
const shown = (p, sel) => p.$eval(sel, e => getComputedStyle(e).display !== 'none').catch(() => false);

/* 最後一排有沒有空洞：每一列的磚塊寬度加總要等於整列 */
const holes = p => p.evaluate(() => {
  const g = document.getElementById('appGroups');
  const gr = g.getBoundingClientRect();
  const tiles = [...g.children].map(t => t.getBoundingClientRect());
  const tops = [...new Set(tiles.map(r => Math.round(r.top)))].sort((a, b) => a - b);
  const bad = [];
  tops.forEach(t => {
    // 主角格跨兩列：凡是蓋到這一列的磚塊都算進來
    const covering = tiles.filter(r => r.top <= t + 1 && r.bottom > t + 2);
    const w = covering.reduce((s, r) => s + r.width, 0);
    const gap = parseFloat(getComputedStyle(g).columnGap) * (covering.length - 1);
    if (Math.abs(w + gap - gr.width) > 2) bad.push(`y=${t} 寬 ${Math.round(w + gap)}/${Math.round(gr.width)}`);
  });
  return bad;
});

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath() });

  /* ───────── 一、便當盒版面 ───────── */
  {
    const { ctx, page } = await newCtx(browser, { opts: { viewport: { width: 1280, height: 900 } } });
    console.log('— 版面（電腦，四欄）—');
    ok('主角格是瀏覽次數最高的 App', await featureSlug(page) === 'case-marker', await featureSlug(page));
    ok('主角格掛「🔥 最多人用」', /最多人用/.test(await page.$eval('.tile.feature', e => e.textContent)));
    ok('主角格顯示大數字 128', /128/.test(await page.$eval('.tile.feature .app-hits', e => e.textContent)));
    ok('造訪格顯示 1,284', (await page.$eval('#statVisits', e => e.textContent)) === '1,284');
    ok('建置中合併成一格「2 個工具建置中」',
       (await page.$$('.tile.wip')).length === 1 && /2 個工具建置中/.test(await page.$eval('.tile.wip', e => e.textContent)));
    ok('每一排都補滿、沒有空洞', (await holes(page)).length === 0, (await holes(page)).join('; ') || '無空洞');
    ok('線條圖示：主角格是 <svg>', !!(await page.$('.tile.feature .app-icon svg')));
    ok('記住最多人用的 App（下次統計回來前先用）',
       await page.evaluate(() => localStorage.getItem('nckuh_endo_hot')) === 'case-marker');
    ok('icon 填 emoji 也照樣顯示', await page.evaluate(() => iconHtml('🚑') === '🚑' && iconHtml('camera').includes('<svg')));
    ok('不認得的代號當文字顯示、不會變成空白 svg', await page.evaluate(() => iconHtml('nope') === 'nope'));
    ok('頁首說明：6 個上線、2 個建置中', /6 個工具上線中 · 2 個建置中/.test(await page.$eval('#heroSub', e => e.textContent)));

    console.log('— 鍵盤：Tab 到磚塊按 Enter 會開啟 —');
    await page.focus('.tile.feature');
    const [np] = await Promise.all([ctx.waitForEvent('page'), page.keyboard.press('Enter')]);
    ok('開到主角格的 App', /case-marker/.test(np.url()), np.url().replace(/^.*\/apps/, 'apps'));
    await np.close();

    console.log('— 篩選 —');
    await page.click('#viewSeg [data-view=mobile]');
    let names = await page.$$eval('.app-card:not(.wip) .app-name', ns => ns.map(n => n.childNodes[0].textContent.trim()));
    ok('手機：只剩三個手機 App', names.length === 3 && names.includes('即時投票') && !names.includes('PDF工具箱'), names.join('、'));
    ok('手機：建置中只算手機那格', /1 個工具建置中/.test(await page.$eval('.tile.wip', e => e.textContent)));
    ok('手機：有分類說明', await shown(page, '#viewDesc'));
    ok('手機：整齊排列（沒有主角格）', !(await page.$('.tile.feature')));
    await page.click('#viewSeg [data-view=desktop]');
    names = await page.$$eval('.app-card:not(.wip) .app-name', ns => ns.map(n => n.childNodes[0].textContent.trim()));
    ok('電腦：三個電腦 App', names.length === 3 && names.includes('PDF工具箱'), names.join('、'));
    ok('篩選鈕數字：全部 6／手機 3／電腦 3',
       (await page.$$eval('#viewSeg .n', ns => ns.map(n => n.textContent))).slice(0, 3).join() === '6,3,3');
    await page.click('#viewSeg [data-view=all]');

    console.log('— 搜尋 —');
    await page.fill('#appSearch', 'PDF');
    ok('搜 PDF：只剩 PDF工具箱', (await page.$$('.app-card:not(.wip)')).length === 1);
    await page.fill('#appSearch', '不存在的工具zzz');
    ok('搜不到時顯示提示', await shown(page, '#emptyHint'));
    await page.fill('#appSearch', '');
    ok('清空搜尋恢復主角格', !!(await page.$('.tile.feature')));
    await ctx.close();
  }

  /* ───────── 二、統計連不上 ───────── */
  {
    console.log('— 統計連不上：主角格改用最新上架、造訪格拿掉 —');
    const { ctx, page } = await newCtx(browser, { stats: null, opts: { viewport: { width: 1280, height: 900 } } });
    const newest = await page.evaluate(() => NEWEST_SLUG);
    ok('主角格＝最新上架', await featureSlug(page) === newest, newest);
    ok('沒有造訪格', !(await page.$('#statsBar')));
    ok('仍然沒有空洞', (await holes(page)).length === 0, (await holes(page)).join('; ') || '無空洞');
    await ctx.close();

    const r = await newCtx(browser, { stats: null, prefs: { nckuh_endo_hot: 'pdf-toolbox' }, opts: { viewport: { width: 1280, height: 900 } } });
    ok('有記住上次最多人用的 → 先用它當主角格', await featureSlug(r.page) === 'pdf-toolbox');
    await r.ctx.close();
  }

  /* ───────── 三、我的最愛 ───────── */
  {
    console.log('— 我的最愛 —');
    const { ctx, page } = await newCtx(browser, { opts: { viewport: { width: 1280, height: 900 } } });
    ok('一開始顯示「怎麼用」提示', /右上角的 ☆/.test(await page.$eval('#favStrip', e => e.textContent)));
    await page.click('.app-card:has-text("PDF工具箱") .fav');
    await page.click('.app-card:has-text("即時投票") .fav');
    ok('星星變成已加入', await page.$eval('.app-card:has-text("PDF工具箱") .fav', e => e.getAttribute('aria-pressed')) === 'true');
    ok('存進 localStorage（依加入順序）',
       await page.evaluate(() => localStorage.getItem('nckuh_endo_favs')) === '["pdf-toolbox","live-poll"]');
    let chips = await page.$$eval('#favStrip .fav-chip', cs => cs.map(c => c.textContent.trim()));
    ok('最上面多一排我的最愛', chips.join() === 'PDF工具箱,即時投票', chips.join('、'));
    ok('篩選鈕「最愛 2」', (await page.$eval('#viewSeg [data-view=fav] .n', e => e.textContent)) === '2');

    await page.reload(); await page.waitForSelector('.app-card'); await page.waitForTimeout(400);
    chips = await page.$$eval('#favStrip .fav-chip', cs => cs.map(c => c.textContent.trim()));
    ok('重新整理後還在', chips.join() === 'PDF工具箱,即時投票');

    const [np] = await Promise.all([ctx.waitForEvent('page'), page.click('#favStrip .fav-chip >> nth=0')]);
    ok('點最愛直接開啟', /pdf-toolbox/.test(np.url()));
    await np.close();

    await page.click('#viewSeg [data-view=fav]');
    const names = await page.$$eval('.app-card:not(.wip) .app-name', ns => ns.map(n => n.childNodes[0].textContent.trim()));
    ok('「我的最愛」篩選只顯示兩個', names.join() === 'PDF工具箱,即時投票', names.join('、'));
    ok('篩選時不重複顯示最愛那一排', await page.$eval('#favStrip', e => e.hidden));
    await page.click('.app-card:has-text("PDF工具箱") .fav');
    await page.click('.app-card:has-text("即時投票") .fav');
    ok('全部移除後顯示空狀態', /還沒有最愛的工具/.test(await page.$eval('#appGroups', e => e.textContent)));
    ok('localStorage 清成空陣列', await page.evaluate(() => localStorage.getItem('nckuh_endo_favs')) === '[]');

    await page.evaluate(() => localStorage.setItem('nckuh_endo_favs', '["已下架的工具","dentfigure","{壞掉'));
    await page.reload(); await page.waitForSelector('.app-card');
    ok('壞掉的資料不會讓首頁掛掉', (await page.$$('.app-card')).length > 0);
    await page.evaluate(() => localStorage.setItem('nckuh_endo_favs', '["已下架的工具","dentfigure"]'));
    await page.reload(); await page.waitForSelector('.app-card'); await page.waitForTimeout(300);
    chips = await page.$$eval('#favStrip .fav-chip', cs => cs.map(c => c.textContent.trim()));
    ok('下架的 App 自動略過', chips.join() === 'DentFigure 臨床組圖', chips.join('、'));

    await page.evaluate(() => localStorage.setItem('nckuh_endo_favs', '[]'));
    await page.reload(); await page.waitForSelector('#favStrip .tip-x');
    await page.click('#favStrip .tip-x');
    await page.reload(); await page.waitForSelector('.app-card'); await page.waitForTimeout(300);
    ok('「怎麼用」提示關掉後不再出現', await page.$eval('#favStrip', e => e.hidden));
    await ctx.close();
  }

  /* ───────── 四、加入主畫面 ───────── */
  {
    console.log('— 電腦版 Chrome —');
    const { ctx, page } = await newCtx(browser, { opts: { viewport: { width: 1280, height: 900 } } });
    ok('頂欄有「加入主畫面」', await shown(page, '#installBtn'));
    ok('電腦不顯示手機提示列', !(await shown(page, '#installTip')));
    await page.click('#installBtn');
    ok('教學框打開', await page.$eval('#installSheet', d => d.open));
    ok('預設選「電腦」', await page.$eval('.plat-tabs [aria-selected=true]', b => b.dataset.plat) === 'desktop');
    ok('只顯示電腦步驟', await shown(page, '.steps[data-plat=desktop]') && !(await shown(page, '.steps[data-plat=ios]')));
    ok('沒有安裝事件時不顯示一鍵按鈕', !(await shown(page, '#oneTapInstall')));
    ok('有列出可單獨加入的工具', /案例標記工具.*牙外傷處置指南/.test(await page.$eval('#pwaAppsNote', e => e.textContent)));
    await page.click('.plat-tabs [data-plat=ios]');
    ok('切到 iPhone 分頁', await shown(page, '.steps[data-plat=ios]') && !(await shown(page, '.steps[data-plat=desktop]')));
    await page.click('#sheetClose');
    ok('× 關閉', !(await page.$eval('#installSheet', d => d.open)));

    console.log('— 瀏覽器給了安裝事件（Android／電腦 Chrome）→ 一鍵加入 —');
    await page.evaluate(() => {
      window.__prompted = 0;
      const e = new Event('beforeinstallprompt', { cancelable: true });
      e.prompt = () => { window.__prompted++; return Promise.resolve(); };
      e.userChoice = Promise.resolve({ outcome: 'accepted' });
      window.dispatchEvent(e);
    });
    await page.click('#installBtn');
    ok('出現一鍵加入', await shown(page, '#oneTapInstall'));
    await page.click('#oneTapInstall');
    await page.waitForTimeout(200);
    ok('呼叫了瀏覽器的安裝視窗', await page.evaluate(() => window.__prompted) === 1);
    ok('接受後教學框自動關閉', !(await page.$eval('#installSheet', d => d.open)));
    await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
    ok('安裝完成有提示', /已加入/.test(await page.$eval('#toast', e => e.textContent)));
    await ctx.close();
  }
  {
    console.log('— iPhone Safari —');
    const { page, ctx } = await newCtx(browser, { opts: PHONE });
    ok('手機顯示「加到桌面」提示列', await shown(page, '#installTip'));
    ok('頁面沒有橫向捲動', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    ok('四顆篩選鈕都在畫面內',
       await page.$eval('#viewSeg', s => s.scrollWidth <= s.clientWidth + 1));
    ok('手機兩欄也沒有空洞', (await holes(page)).length === 0, (await holes(page)).join('; ') || '無空洞');
    await page.click('#installTipGo');
    ok('預設選 iPhone 分頁', await page.$eval('.plat-tabs [aria-selected=true]', b => b.dataset.plat) === 'ios');
    ok('Safari 不顯示 LINE 警告', !(await shown(page, '#inAppWarn')));
    ok('步驟有「加入主畫面」', /加入主畫面/.test(await page.$eval('.steps[data-plat=ios]', e => e.textContent)));
    await page.mouse.click(5, 5); // 點背景
    ok('點背景關閉', !(await page.$eval('#installSheet', d => d.open)));
    await page.click('#installTipClose');
    await page.reload(); await page.waitForSelector('.app-card'); await page.waitForTimeout(300);
    ok('關掉提示列後不再出現', !(await shown(page, '#installTip')));
    ok('頂欄按鈕還在（隨時找得到教學）', await shown(page, '#installBtn'));
    await ctx.close();
  }
  {
    console.log('— 從 LINE 打開 —');
    const { page, ctx } = await newCtx(browser, { opts: { ...PHONE, userAgent: LINE } });
    await page.click('#installTipGo');
    ok('提醒 LINE 內建瀏覽器不能加', await shown(page, '#inAppWarn') && /LINE/.test(await page.$eval('#inAppWarn', e => e.textContent)));
    const href = await page.$eval('#openExternal', a => a.href);
    ok('「用瀏覽器開啟」帶 openExternalBrowser=1', /\?openExternalBrowser=1$/.test(href) && !/index\.html/.test(href), href);
    await ctx.close();
  }
  {
    console.log('— 已經從桌面圖示打開（standalone）—');
    const { page, ctx } = await newCtx(browser, { opts: PHONE,
      init: () => { Object.defineProperty(navigator, 'standalone', { get: () => true }); } });
    ok('不再顯示「加入主畫面」按鈕', !(await shown(page, '#installBtn')));
    ok('不再顯示提示列', !(await shown(page, '#installTip')));
    await ctx.close();
  }

  await browser.close();
  console.log(`\n通過 ${pass}，失敗 ${fail}`);
  process.exit(fail ? 1 : 0);
})();
