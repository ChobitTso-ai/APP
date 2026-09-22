/* 首頁卡片的代號與徽章（🆕 新上架 / 🔄 已更新）
   重點：App 可以不住在 apps/ 底下——外部網址的卡片用 slug 欄位指定代號，
   統計與 🆕 都要照常運作，且既有四支 App 的代號必須完全不變
   （統計試算表已在用這些代號累計，代號一變歷史數字就斷掉）。 */
const { chromium } = require('playwright-core');
const { LOGIN, chromePath } = require('./env');
let pass = 0, fail = 0;
function ok(n, c, d){ if(c){pass++;console.log('  ✓',n+(d?'  → '+d:''));} else {fail++;console.log('  ✗ FAIL:',n+(d?'  → '+d:''));} }

const today = new Date().toISOString().slice(0, 10);
/* 刻意用不可能與真實 App 撞名的代號——先前用 dentfigure，DentFigure 真的上架後就撞了 */
const EXTERNAL = 'https://chobittso-ai.github.io/zz-external-fixture/';

/* 統計端點在測試環境連不到 Google：一律攔下來，順便記錄送出的事件 */
async function stubStats(ctx, seen){
  await ctx.route('https://script.google.com/**', async route => {
    const u = new URL(route.request().url());
    seen.push(Object.fromEntries(u.searchParams));
    const cb = u.searchParams.get('callback');
    await route.fulfill({ status: 200, contentType: 'text/javascript',
      body: `${cb}({"visits":10,"uniques":5,"logins":5,"apps":{"case-marker":7,"zz-external-fixture":3}});` });
  });
}

/* 外部 App 的網址也攔下來（沙箱連不到 github.io），避免開新分頁卡住 */
async function stubExternal(ctx){
  await ctx.route('https://chobittso-ai.github.io/**', route =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<title>DentFigure 測試替身</title>' }));
}

/* 在 app.js 的 APPS 陣列最前面插一張「外部網址」卡片 */
async function injectExternalCard(ctx, { withSlug }){
  await ctx.route('**/app.js', async route => {
    const res = await route.fetch();
    let body = await res.text();
    const slugField = withSlug ? ` slug: 'zz-external-fixture',` : '';
    body = body.replace('const APPS = [', `const APPS = [
      { name: '測試外部工具', desc: '外部網址測試用。', icon: '🧪', url: '${EXTERNAL}',${slugField} added: '${today}', group: 'desktop' },`);
    await route.fulfill({ status: 200, contentType: 'text/javascript', body });
  });
}

const loginAndRender = async (page) => {
  await page.goto(LOGIN);
  await page.evaluate(() => localStorage.setItem('nckuh_endo_authed', '1'));
  await page.reload();
  await page.waitForFunction(() => document.querySelectorAll('.app-card').length > 0);
};

/* 每張正式卡片的：名稱、代號、徽章 */
const cardInfo = (page) => page.$$eval('.app-card:not(.wip)', els => els.map(e => ({
  name: e.querySelector('.app-name').childNodes[0].textContent.trim(),
  slug: e.querySelector('.app-hits') ? e.querySelector('.app-hits').dataset.slug : null,
  badge: e.querySelector('.badge-new') ? 'new' : (e.querySelector('.badge-updated') ? 'updated' : null),
})));

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath() });

  /* ───────── 一、現況回歸：既有四支 App 的代號不可變 ───────── */
  {
    const seen = [];
    const ctx = await browser.newContext();
    await stubStats(ctx, seen);
    const page = await ctx.newPage();
    page.on('pageerror', e => { fail++; console.log('  ✗ PAGE ERROR:', e.message); });
    await loginAndRender(page);

    console.log('— 既有 App 的代號（統計試算表靠這些累計，不可變動）—');
    const slugs = await page.evaluate(() =>
      APPS.filter(a => !a.wip).map(a => ({ name: a.name, slug: slugOf(a), url: a.url })));
    slugs.forEach(s => console.log(`    ${s.slug.padEnd(20)} ← ${s.url}`));
    const expect = ['case-marker', 'pdf-toolbox', 'endo-ppt-generator', 'live-poll', 'dentfigure'];
    expect.forEach(s => ok(`代號 ${s} 仍存在且未變`, slugs.some(x => x.slug === s)));
    ok('沒有任何正式 App 的代號是空字串', slugs.every(s => s.slug !== ''),
       slugs.filter(s => !s.slug).map(s => s.name).join(',') || '全部有代號');

    console.log('— 自家 App 仍能取得 🆕（最新上架者）—');
    const cards = await cardInfo(page);
    const newest = await page.evaluate(() => NEWEST_SLUG);
    ok('NEWEST_SLUG 不是 null', newest !== null, String(newest));
    ok('🆕 掛在最新上架的那張卡片上',
       cards.filter(c => c.badge === 'new').length === 1 &&
       cards.find(c => c.badge === 'new').slug === newest,
       cards.map(c => `${c.name}:${c.badge || '—'}`).join(' | '));

    console.log('— 卡片的 data-slug 與代號一致 —');
    ok('每張正式卡片都有非空的 data-slug', cards.every(c => c.slug));
    await ctx.close();
  }

  /* ───────── 二、外部網址 App（有 slug 欄位）───────── */
  {
    const seen = [];
    const ctx = await browser.newContext();
    await stubStats(ctx, seen);
    await stubExternal(ctx);
    await injectExternalCard(ctx, { withSlug: true });
    const page = await ctx.newPage();
    page.on('pageerror', e => { fail++; console.log('  ✗ PAGE ERROR:', e.message); });
    await loginAndRender(page);

    console.log('— 外部網址卡片：代號來自 slug 欄位 —');
    const ext = await page.evaluate(() => {
      const a = APPS.find(x => x.name === '測試外部工具');
      return { slug: slugOf(a), url: a.url };
    });
    ok('slugOf() 取得 zz-external-fixture（路徑比不中時改用 slug 欄位）', ext.slug === 'zz-external-fixture', ext.slug || '(空)');
    ok('網址確實是外部完整網址', /^https:\/\//.test(ext.url), ext.url);

    console.log('— 它是最新上架 → 🆕 掛在它身上 —');
    const cards = await cardInfo(page);
    const withNew = cards.filter(c => c.badge === 'new');
    ok('NEWEST_SLUG 指向外部 App', await page.evaluate(() => NEWEST_SLUG) === 'zz-external-fixture');
    ok('恰好一張卡片有 🆕', withNew.length === 1, cards.map(c => `${c.name}:${c.badge || '—'}`).join(' | '));
    ok('🆕 在「測試外部工具」上', withNew[0] && withNew[0].name === '測試外部工具');
    ok('外部卡片的 data-slug 是 zz-external-fixture',
       cards.find(c => c.name === '測試外部工具').slug === 'zz-external-fixture');
    ok('既有 App 的代號不受影響',
       ['case-marker','pdf-toolbox','endo-ppt-generator','live-poll','dentfigure'].every(s => cards.some(c => c.slug === s)));

    console.log('— 瀏覽次數：開啟外部 App 會送出代號 —');
    const before = seen.filter(s => s.event === 'open').length;
    const [pop] = await Promise.all([
      ctx.waitForEvent('page'),
      page.$$eval('.app-card:not(.wip)', els => {
        const c = [...els].find(e => e.querySelector('.app-name').textContent.includes('測試外部工具'));
        c.querySelector('.open').click();
      }),
    ]);
    await pop.close();
    await page.waitForFunction(n => true, null);
    await page.waitForTimeout(600);
    const opens = seen.filter(s => s.event === 'open');
    ok('有送出 open 事件（先前因代號為空會整個跳過）', opens.length === before + 1, JSON.stringify(opens));
    ok('送出的 app 參數是 zz-external-fixture', opens.some(o => o.app === 'zz-external-fixture'));

    console.log('— 顯示端：統計回來的次數對得上外部 App —');
    ok('外部卡片顯示「瀏覽 3 次」',
       /瀏覽\s*3\s*次/.test(await page.$eval('.app-hits[data-slug=zz-external-fixture]', e => e.textContent)));
    await ctx.close();
  }

  /* ───────── 三、外部網址但忘了填 slug：只影響它自己 ───────── */
  {
    const seen = [];
    const ctx = await browser.newContext();
    await stubStats(ctx, seen);
    await stubExternal(ctx);
    await injectExternalCard(ctx, { withSlug: false });
    const page = await ctx.newPage();
    page.on('pageerror', e => { fail++; console.log('  ✗ PAGE ERROR:', e.message); });
    await loginAndRender(page);

    console.log('— 沒填 slug 的外部 App（記錄現況，不應波及其他卡片）—');
    const cards = await cardInfo(page);
    ok('它自己拿不到代號（所以 slug 欄位是必填）',
       cards.find(c => c.name === '測試外部工具').slug === '');
    ok('自家五支 App 的代號仍然正確',
       ['case-marker','pdf-toolbox','endo-ppt-generator','live-poll','dentfigure'].every(s => cards.some(c => c.slug === s)));
    ok('不會有多張卡片同時掛 🆕', cards.filter(c => c.badge === 'new').length <= 1,
       cards.map(c => `${c.name}:${c.badge || '—'}`).join(' | '));
    await ctx.close();
  }

  await browser.close();
  console.log(`\n通過 ${pass}，失敗 ${fail}`);
  process.exit(fail ? 1 : 0);
})();
