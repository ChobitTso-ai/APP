/* 牙外傷處置指南的端到端測試

   最關鍵的幾項是「臨床數字不能被改壞」：
   · 內縮性脫位手術復位後固定 4 週（不是坊間常寫的 2 週）
   · 未成熟根 4 週內無再萌出就矯正復位（不是 8 週）
   · 保存液順序是 牛奶 → HBSS → 唾液 → 生理食鹽水（牛奶第一，不是 HBSS）
   · 乳牙脫落絕對不再植
   這幾條一旦被「順手改回」常見說法，App 就會給錯建議，所以直接斷言在測試裡。

   介面上釘住的幾點（v1.1 依 Dr.Tso 實際試用的回饋改的）：
   · 開啟 App 直接是第一題，沒有首頁
   · 返回鍵在固定頂列（放頁尾的話診斷頁要捲到底才找得到）
   · ⚡ 有圖例說明（先前是沒有任何解釋的紅點）
   · 影像提示預設關閉，開關在右上角

   v1.2 再加的：
   · 問影像所見的題目要明講「X 光片」（先前寫「影像上…」，看不出是要拍片）
   · 分水嶺題目的選項掛示意圖；圖還沒到就**整塊隱藏**，不留佔位空框
   · 查閱改成兩欄插圖卡片，依恆牙／乳牙與損傷類型分區
   · 第一題底下有「加到手機主畫面」的三步驟 */
const { chromium } = require('playwright-core');
const { BASE, LOGIN, chromePath, OUT } = require('./env');
const path = require('path');

const APP = BASE + '/apps/dental-trauma-guide/index.html';
let pass = 0, fail = 0;
function ok(n, c, d){ if(c){pass++;console.log('  ✓',n+(d?'  → '+d:''));} else {fail++;console.log('  ✗ FAIL:',n+(d?'  → '+d:''));} }

/* 統計端點在測試環境連不到 Google，一律攔掉 */
async function stubStats(ctx){
  await ctx.route('https://script.google.com/**', route =>
    route.fulfill({ status:200, contentType:'text/javascript', body:'void 0;' }));
}

/* serviceWorkers:'block'——這個 App 是 PWA，sw.js 用 network-first 攔所有 GET。
   Service Worker 一旦接手，page.route() 就攔不到圖片請求（請求是從 SW 發的），
   插圖的攔截測試會永遠等不到。這一檔測的是畫面行為，不測離線快取，直接關掉。 */
async function authed(browser){
  const ctx = await browser.newContext({ viewport:{ width:414, height:900 }, serviceWorkers:'block' });
  await stubStats(ctx);
  const p = await ctx.newPage();
  await p.goto(LOGIN);
  await p.evaluate(() => localStorage.setItem('nckuh_endo_authed','1'));
  return { ctx, p };
}

/* 每一段測試都從乾淨的第一題開始，且確定影像提示是關的 */
async function reset(p){
  await p.evaluate(() => localStorage.setItem('dtg_mode','normal'));
  await p.reload();
  await p.waitForSelector('#treeQ');
  await p.waitForFunction(() =>
    document.getElementById('treeQ').textContent.includes('恆牙還是乳牙'));
}

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath() });

  /* ── 1. 登入保護 ── */
  {
    const ctx = await browser.newContext();
    await stubStats(ctx);
    const p = await ctx.newPage();
    await p.goto(LOGIN);
    await p.evaluate(() => localStorage.removeItem('nckuh_endo_authed'));
    await p.goto(APP);
    await p.waitForLoadState('domcontentloaded');
    ok('未登入直開工具頁會被導回登入頁', !/dental-trauma-guide/.test(p.url()), p.url().split('/').slice(-2).join('/'));
    await ctx.close();
  }

  const { ctx, p } = await authed(browser);
  await p.goto(APP);
  await p.waitForSelector('#treeQ');

  /* ── 2. 開啟 App 的畫面 ── */
  {
    ok('★ 開啟 App 直接就是第一題（沒有首頁）',
      (await p.textContent('#treeQ')).includes('恆牙還是乳牙'));
    ok('★ 第一題沒有東西可以返回，返回鍵隱藏', await p.isHidden('#btnBack'));
    ok('★ 右上角有「提示」與「查閱」',
      await p.isVisible('#btnHints') && await p.isVisible('#btnBrowse'));
    ok('★ 影像提示預設是關的', !(await p.evaluate(() =>
      document.getElementById('btnHints').classList.contains('on'))));
    ok('★ 已移除「立即處理」與紅旗卡片',
      await p.$('#emergencyCard') === null && await p.$('#listRedFlags') === null);
    ok('★ 已移除三張模式卡片', (await p.$$('.mode-card')).length === 0);

    ok('第一題底下掛著參考資料', await p.isVisible('#refBlocks'));
    const names = await p.$$eval('#storageRow .media b', ns => ns.map(n => n.textContent.trim()));
    ok('保存液依 IADT 偏好順序，牛奶排第一',
      names[0].startsWith('牛奶') && names[1].startsWith('HBSS') &&
      names[2].startsWith('唾液') && names[3].startsWith('生理食鹽水'), names.join(' → '));
    ok('自來水標示為禁止', /✗/.test(names[4]) && await p.$('#storageRow .media.no') !== null);
    await p.waitForFunction(() =>
      [...document.querySelectorAll('#storageRow .fig img')].every(i => i.complete));
    const media = await p.$$eval('#storageRow .fig img',
      ns => ns.map(i => [i.getAttribute('src'), i.naturalWidth > 0]));
    ok('★ 五張保存液插圖全部載得到', media.length === 5 && media.every(m => m[1]),
      media.filter(m => !m[1]).map(m => m[0]).join() || '5/5');

    const rows = await p.$$eval('#tblFirstAid tr', ns => ns.length);
    ok('現場急救速查表有表頭＋6 列', rows === 7, rows + ' 列');
    const refs = await p.$$eval('#listRefs li', ns => ns.map(n => n.textContent));
    ok('參考文獻列出 4 篇 IADT 2020 ＋ 1 篇 AAE 2026', refs.length === 5, refs.length + ' 篇');
    ok('★ AAE 2026 的出處完整（J Endod 52(8) ＋ DOI）',
      refs.some(t => /J Endod\. 2026;52\(8\):1237–1253/.test(t)
                  && /10\.1016\/j\.joen\.2026\.04\.002/.test(t)));
    ok('★ 並註明 AAE 只涵蓋恆牙', refs.some(t => /僅涵蓋恆牙/.test(t)));
    ok('★ 副標題反映兩份指引',
      /IADT 2020/.test(await p.textContent('#txtAppTagline')) &&
      /AAE 2026/.test(await p.textContent('#txtAppTagline')));
    ok('頁尾有免責聲明', /不能取代臨床判斷/.test(await p.textContent('#txtDisclaimer')));

    // v1.2：加到手機主畫面的三步驟。用瀏覽器開的時候要看得到。
    ok('★ 有「加到手機主畫面」的說明', await p.isVisible('#cardInstall'));
    const steps = await p.$$eval('#listInstall li', ns => ns.map(x => x.textContent.trim()));
    ok('★ 三個步驟：瀏覽器開啟 → 分享 → 加入主畫面',
      steps.length === 3 && /瀏覽器/.test(steps[0]) &&
      /分享/.test(steps[1]) && /加入主畫面/.test(steps[2]), steps.length + ' 步');
    ok('說明有提到 iPhone 與 Android 的差別',
      /Safari/.test(steps[0]) && /Chrome/.test(steps[0]));
    ok('版本號是 v2.0', /v2\.0/.test(await p.title()) &&
      /v2\.0/.test(await p.textContent('footer')));
  }

  /* ── 3. 中英文切換 ── */
  {
    await p.click('#btnLang');
    await p.waitForFunction(() => document.getElementById('txtAppName').textContent === 'Dental Trauma Guide');
    ok('切到英文：標題與題目都換語言',
      (await p.textContent('#treeQ')).toLowerCase().includes('permanent or primary'));
    ok('右上角兩顆也換語言',
      /Hints/.test(await p.textContent('#btnHints')) &&
      /List/.test(await p.textContent('#btnBrowse')));
    // 無障礙屬性也要跟著換。先前寫死在 HTML，切英文螢幕閱讀器仍讀中文。
    ok('★ 返回鍵的 aria-label 切成英文',
      (await p.getAttribute('#btnBack', 'aria-label')) === 'Back');
    ok('★ 語言鍵的 aria-label 切成英文',
      (await p.getAttribute('#btnLang', 'aria-label')) === 'Switch language');
    ok('★ 查閱鍵的 title 切成英文',
      (await p.getAttribute('#btnBrowse', 'title')) === 'Browse by diagnosis');
    ok('英文的保存液第一項是 Milk',
      (await p.textContent('#storageRow .media b')).trim().startsWith('Milk'));
    ok('語言偏好存進 localStorage',
      (await p.evaluate(() => localStorage.getItem('dtg_lang'))) === 'en');

    await p.reload();
    await p.waitForSelector('#treeQ');
    ok('重新載入後仍是英文', (await p.textContent('#txtAppName')) === 'Dental Trauma Guide');
    await p.click('#btnLang');
    await p.waitForFunction(() => document.getElementById('txtAppName').textContent === '牙外傷處置指南');
    ok('切回中文', true);
  }

  /* ── 4. 一般模式（預設）：不出現影像檢查那一關 ── */
  {
    await reset(p);
    // 恆牙 → 整顆掉出來 → 脫落
    await p.click('#treeOpts .opt >> nth=0');           // 恆牙
    ok('進入第二題後返回鍵出現', await p.isVisible('#btnBack'));
    await p.waitForFunction(() => document.getElementById('treeQ').textContent.includes('齒槽窩'));
    await p.click('#treeOpts .opt >> nth=0');           // 整顆掉出來，牙齒在手上
    await p.waitForSelector('#screenDx:not([hidden])');
    ok('恆牙→整顆掉出來 導到「脫落」', (await p.textContent('#dxNameZh')) === '脫落');
    ok('★ 脫落不經影像節點（時間急迫）', await p.isVisible('#dxUrgentBanner'));
    ok('急迫橫幅明講不要為了等 X 光延誤',
      /不要為了等 X 光延誤/.test(await p.textContent('#txtUrgentNoWait')));
    ok('★ 診斷頁的返回鍵在頂列（不用捲到底）', await p.isVisible('#btnBack'));
    await p.click('#btnBack');
    await p.waitForSelector('#screenTree:not([hidden])');
    ok('頂列返回退回上一題', (await p.textContent('#treeQ')).includes('齒槽窩'));

    // 恆牙 → 牙冠完整 → 位置正常 → 不搖但叩痛 → 直接問影像所見
    await p.click('#btnTreeRestart');
    await p.waitForFunction(() => document.getElementById('treeQ').textContent.includes('恆牙還是乳牙'));
    await p.click('#treeOpts .opt >> nth=0');           // 恆牙
    await p.click('#treeOpts .opt >> nth=2');           // 還在嘴裡
    await p.click('#treeOpts .opt >> nth=1');           // 不是整段一起動
    await p.click('#treeOpts .opt >> nth=1');           // 牙冠完整
    await p.click('#treeOpts .opt >> nth=3');           // 位置正常
    await p.click('#treeOpts .opt >> nth=1');           // 不太搖但叩痛
    await p.waitForSelector('#screenTree:not([hidden])');
    ok('★ 一般模式不出現影像檢查那一關', await p.isHidden('#screenImaging'));
    ok('★ 直接在「影像所見」選 finding',
      (await p.textContent('#treeQ')).includes('X 光片上有看到什麼異常'));
    await p.click('#treeOpts .opt >> nth=1');           // 完全沒有異常
    await p.waitForSelector('#screenDx:not([hidden])');
    ok('★ 不搖＋影像無異常 才導到「震盪」', (await p.textContent('#dxNameZh')) === '震盪');
    ok('震盪不是時間急迫', !(await p.isVisible('#dxUrgentBanner')));
    ok('★ 影像提示的內容沒有消失，診斷頁仍有「建議影像」',
      /建議影像/.test(await p.textContent('#paneClinical')) &&
      /根尖片/.test(await p.textContent('#paneClinical')));

    await p.click('#btnBack');
    await p.waitForSelector('#screenTree:not([hidden])');
    await p.click('#treeOpts .opt >> nth=0');           // 有牙根斷裂線
    await p.waitForSelector('#screenDx:not([hidden])');
    ok('★ 不搖＋影像有斷裂線 導到「牙根斷裂」', (await p.textContent('#dxNameZh')) === '牙根斷裂');
  }

  /* ── 5. 找不到牙齒要先排除內縮，不能直接當脫落 ── */
  {
    await reset(p);
    await p.click('#treeOpts .opt >> nth=0');           // 恆牙
    await p.click('#treeOpts .opt >> nth=1');           // 找不到牙齒
    await p.waitForSelector('#screenTree:not([hidden])');
    ok('★ 找不到牙齒導到影像所見（不是直接當脫落）',
      (await p.textContent('#treeQ')).includes('X 光片上看到什麼'));
    await p.click('#treeOpts .opt >> nth=1');           // 牙齒還在骨內
    await p.waitForSelector('#screenDx:not([hidden])');
    ok('★ 影像顯示牙齒還在骨內 → 內縮性脫位，不是脫落',
      (await p.textContent('#dxNameZh')) === '內縮性脫位');
  }

  /* ── 6. 開啟影像提示 ── */
  {
    await reset(p);
    await p.click('#btnHints');
    await p.waitForFunction(() => document.getElementById('treeQ').textContent.includes('有沒有以下任何一項'));
    ok('★ 開啟提示後第一關變成紅旗排除', true);
    ok('提示鍵呈開啟狀態', await p.evaluate(() =>
      document.getElementById('btnHints').classList.contains('on')));
    ok('模式偏好存進 localStorage',
      (await p.evaluate(() => localStorage.getItem('dtg_mode'))) === 'hints');

    // 有紅旗 → 先送急診
    await p.click('#treeOpts .opt >> nth=0');
    await p.waitForSelector('#screenResult:not([hidden])');
    ok('★ 有紅旗導到「先處理醫療急症」', (await p.textContent('#resultTitle')).includes('先處理醫療急症'));
    ok('急診頁仍交代脫落牙可同時泡保存液',
      /脫落的恆牙/.test(await p.textContent('#resultBody')) &&
      /牛奶/.test(await p.textContent('#resultBody')));
    await p.click('#btnBack');
    await p.waitForSelector('#screenTree:not([hidden])');

    // 同一條路，開了提示就多出影像檢查那一關
    await p.click('#treeOpts .opt >> nth=1');           // 紅旗都沒有
    await p.click('#treeOpts .opt >> nth=0');           // 恆牙
    await p.click('#treeOpts .opt >> nth=2');           // 還在嘴裡
    await p.click('#treeOpts .opt >> nth=1');
    await p.click('#treeOpts .opt >> nth=1');           // 牙冠完整
    await p.click('#treeOpts .opt >> nth=3');           // 位置正常
    await p.click('#treeOpts .opt >> nth=1');           // 不太搖但叩痛
    await p.waitForSelector('#screenImaging:not([hidden])');
    ok('★ 開啟提示後，同一條路會多出影像檢查那一關', true);
    ok('影像節點說明為什麼非拍不可',
      /不會搖也可能是牙根斷裂/.test(await p.textContent('#imgWhy')));
    ok('用詞是「X 光」不是「片子」', !/片子/.test(await p.textContent('#screenImaging')));
    const films = await p.$$eval('#imgFilms li', ns => ns.map(n => n.textContent.trim()));
    ok('列出要拍不同水平與垂直角度的根尖片',
      films.some(f => /不同水平與垂直角度/.test(f)), films.length + ' 項');

    // 「還沒拍」的出口
    await p.click('#imgOpts .opt >> nth=1');
    await p.waitForSelector('#screenPending:not([hidden])');
    ok('★「還沒拍」給出在拿到 X 光之前可以做什麼',
      /不要因為初診敏感性測試陰性就做根管治療/.test(await p.textContent('#pendingBody')));
    ok('「在拿到 X 光之前」的用詞',
      (await p.textContent('#screenPending')).includes('在拿到 X 光之前'));
    ok('接回的按鈕寫「X 光好了」',
      (await p.textContent('#btnPendingNext')).includes('X 光好了'));
    await p.click('#btnPendingNext');
    await p.waitForSelector('#screenTree:not([hidden])');
    ok('X 光好了接回影像所見那一題',
      (await p.textContent('#treeQ')).includes('X 光片上有看到什麼異常'));

    // 乳牙：IADT 明文不需照影像的診斷
    await p.click('#btnTreeRestart');
    await p.click('#treeOpts .opt >> nth=1');           // 紅旗都沒有
    await p.click('#treeOpts .opt >> nth=1');           // 乳牙
    await p.click('#treeOpts .opt >> nth=2');
    await p.click('#treeOpts .opt >> nth=1');
    await p.click('#treeOpts .opt >> nth=1');           // 牙冠完整
    await p.click('#treeOpts .opt >> nth=3');           // 位置正常
    await p.waitForFunction(() => document.getElementById('treeQ').textContent.includes('齦溝'));
    ok('乳牙動搖度題點出震盪與半脫位的分界是齦溝出血',
      /齦溝不出血/.test(await p.textContent('#treeHint')));
    await p.click('#treeOpts .opt >> nth=1');           // 搖動度正常、不出血
    await p.waitForSelector('#screenImaging:not([hidden])');
    ok('★ 乳牙震盪：明寫這個診斷不需要照影像', await p.isVisible('#imgNotNeeded'));
    ok('★ 並說明理由（不要對小孩做不必要的曝照）',
      /不需要基準影像/.test(await p.textContent('#imgWhy')) &&
      /不必要的曝照/.test(await p.textContent('#imgWhy')));
    ok('不需照影像時不顯示拍攝清單', !(await p.isVisible('#imgFilmsBox')));
    await p.click('#imgOpts .opt >> nth=0');
    await p.waitForSelector('#screenDx:not([hidden])');
    ok('導到乳牙震盪', (await p.textContent('#dxNameZh')) === '震盪' &&
      (await p.textContent('#dxDentition')) === '乳牙');

    // 關掉提示
    await p.click('#btnHints');
    await p.waitForFunction(() => document.getElementById('treeQ') &&
      document.getElementById('treeQ').textContent.includes('恆牙還是乳牙'));
    ok('★ 關掉提示後第一題回到恆牙／乳牙', true);
    ok('模式偏好跟著改',
      (await p.evaluate(() => localStorage.getItem('dtg_mode'))) === 'normal');
  }

  /* ── 7. 乳牙牙根斷裂：舊流程到不了，靠影像所見分出來 ── */
  {
    await reset(p);
    await p.click('#treeOpts .opt >> nth=1');           // 乳牙
    await p.click('#treeOpts .opt >> nth=2');           // 還在嘴裡
    await p.click('#treeOpts .opt >> nth=1');
    await p.click('#treeOpts .opt >> nth=1');           // 牙冠完整
    await p.click('#treeOpts .opt >> nth=3');           // 位置正常
    await p.click('#treeOpts .opt >> nth=0');           // 搖動度增加、齦溝出血
    await p.waitForSelector('#screenTree:not([hidden])');
    ok('★ 乳牙半脫位這條要看影像所見（與牙根斷裂臨床重疊）',
      (await p.textContent('#treeQ')).includes('X 光片上有看到牙根的斷裂線'));
    await p.click('#treeOpts .opt >> nth=0');           // 有斷裂線
    await p.waitForSelector('#screenDx:not([hidden])');
    ok('★ 乳牙：搖動＋有斷裂線 → 牙根斷裂',
      (await p.textContent('#dxNameZh')) === '牙根斷裂' &&
      (await p.textContent('#dxDentition')) === '乳牙');
  }

  /* ── 7b. 示意圖機制：圖在就顯示、載不到就整塊隱藏 ──
     兩種狀態都要測。缺圖那一側**不能靠「repo 裡剛好沒有圖」來測**——
     圖補齊之後那種斷言會反過來永遠等不到（踩過）。改成攔截請求。 */
  {
    const toFractureSurface = async () => {
      await reset(p);
      await p.click('#treeOpts .opt >> nth=0');         // 恆牙
      await p.click('#treeOpts .opt >> nth=2');         // 還在嘴裡
      await p.click('#treeOpts .opt >> nth=1');         // 單顆牙
      await p.click('#treeOpts .opt >> nth=0');         // 有斷裂或缺角
      await p.waitForFunction(() =>
        document.getElementById('treeQ').textContent.includes('斷面看得到什麼'));
    };

    // (1) 插圖已在 repo 裡 → 五個選項各自長出縮圖
    await toFractureSurface();
    await p.waitForFunction(() =>
      document.querySelectorAll('#treeOpts .opt-fig img').length === 5);
    ok('★ 五個選項各自長出縮圖', true);
    // img.complete 在「載好」與「載失敗」都會變 true，所以先等它，再看 naturalWidth。
    // 直接看 naturalWidth 會在還沒載完時誤判成失敗（踩過）。
    await p.waitForFunction(() =>
      [...document.querySelectorAll('#treeOpts .opt-fig img')].every(i => i.complete));
    const real = await p.$$eval('#treeOpts .opt-fig img',
      ns => ns.every(i => i.naturalWidth > 0));
    ok('縮圖是真的載進來的（naturalWidth > 0）', real);
    const boxed = await p.$eval('#treeOpts .opt-fig', n => n.getBoundingClientRect().width > 20);
    ok('縮圖有實際寬度（不是 0 × 0）', boxed);

    // 每個選項掛的是不同的圖——掛成同一張就失去分辨的意義
    const srcs = await p.$$eval('#treeOpts .opt-fig img', ns => ns.map(i => i.getAttribute('src')));
    ok('★ 五個選項掛的是五張不同的圖', new Set(srcs).size === 5, srcs.length + ' 張 / ' + new Set(srcs).size + ' 種');

    await p.click('#btnBrowse');
    await p.waitForSelector('#screenBrowse:not([hidden])');
    await p.waitForFunction(() =>
      document.querySelectorAll('#browseList .dx-card-fig img').length === 26);
    await p.waitForFunction(() =>
      [...document.querySelectorAll('#browseList .dx-card-fig img')].every(i => i.complete));
    const bad = await p.$$eval('#browseList .dx-card-fig img',
      ns => ns.filter(i => !i.naturalWidth).map(i => i.getAttribute('src')));
    ok('★ 查閱 26 張卡片的插圖全部載得到（檔名沒拼錯）', bad.length === 0,
      bad.join() || '26/26');

    // (2) 圖載不到 → 整塊拿掉、退回純文字，不留佔位空框
    await p.route('**/assets/dx/*.svg', r => r.abort());
    await toFractureSurface();
    await p.waitForFunction(() =>
      document.querySelectorAll('#treeOpts .opt-fig').length === 0);
    ok('★ 圖載不到時選項不留佔位空框',
      (await p.$$('#treeOpts .opt.has-fig')).length === 0 &&
      (await p.$$eval('#treeOpts .opt', ns => ns.length)) === 5);

    await p.click('#btnBrowse');
    await p.waitForFunction(() =>
      document.querySelectorAll('#browseList .dx-card-fig').length === 0);
    ok('★ 圖載不到時查閱卡片退回純文字，不留空框',
      (await p.$$('#browseList .dx-card')).length === 26);
    await p.unroute('**/assets/dx/*.svg');
  }

  /* ── 7c. 乳牙內縮方向：兩張 X 光示意圖（v1.5 新到）──
     這一題只靠文字很難懂（影像表現跟直覺相反），圖是重點。 */
  {
    await reset(p);
    await p.click('#treeOpts .opt >> nth=1');          // 乳牙
    await p.click('#treeOpts .opt >> nth=2');          // 還在嘴裡
    await p.click('#treeOpts .opt >> nth=1');          // 單顆牙
    await p.click('#treeOpts .opt >> nth=1');          // 牙冠完整
    await p.click('#treeOpts .opt >> nth=2');          // 變短甚至看不到
    await p.waitForFunction(() =>
      document.getElementById('treeQ').textContent.includes('根尖往哪個方向'));
    await p.waitForFunction(() =>
      document.querySelectorAll('#treeOpts .opt-fig img').length === 2);
    await p.waitForFunction(() =>
      [...document.querySelectorAll('#treeOpts .opt-fig img')].every(i => i.complete));
    const got = await p.$$eval('#treeOpts .opt-fig img',
      ns => ns.map(i => [i.getAttribute('src'), i.naturalWidth > 0]));
    ok('★ 乳牙內縮方向兩個選項都有圖且載得到',
      got.length === 2 && got.every(g => g[1]),
      got.map(g => g[0] + (g[1] ? '' : ' ✗')).join(' / '));
    ok('★ 兩張是不同的圖（朝唇側骨板 vs 朝恆牙牙胚）',
      got[0][0] !== got[1][0] &&
      /intrusion-apex-labial/.test(got[0][0]) && /intrusion-apex-germ/.test(got[1][0]));
    ok('★ 題目提示講明影像表現跟直覺相反',
      /跟直覺相反/.test(await p.textContent('#treeHint')));
  }

  /* ── 7d. 縮圖要夠大才分得出斷面顏色（54×68 實測不夠）── */
  {
    await reset(p);
    await p.click('#treeOpts .opt >> nth=0');
    await p.click('#treeOpts .opt >> nth=2');
    await p.click('#treeOpts .opt >> nth=1');
    await p.click('#treeOpts .opt >> nth=0');
    await p.waitForFunction(() =>
      document.getElementById('treeQ').textContent.includes('斷面看得到什麼'));
    const box = await p.$eval('#treeOpts .opt-fig',
      n => { const r = n.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
    ok('★ 選項縮圖至少 72×92', box[0] >= 72 && box[1] >= 92, box.join('×'));
  }

  /* ── 7e. 畫了的圖都要被用到（v1.6 補）──
     先前只斷言「有引用的圖都載得到」，沒斷言反向，結果 care/ 有 7 張、
     dx/base-open-apex 共 8 張畫好了卻從來沒顯示過，一路閒置到 v1.5 才發現。
     這條掃 assets/ 的實際檔案，逐一比對程式碼裡的引用。 */
  {
    const fs = require('fs');
    const path = require('path');
    const root = path.join(__dirname, '..', 'apps', 'dental-trauma-guide');
    const walk = d => fs.readdirSync(path.join(root, 'assets', d))
      .filter(f => f.endsWith('.svg')).map(f => d + '/' + f);
    const have = [...walk('dx'), ...walk('care'), ...walk('misc')];
    const code = ['app.js', 'data/common.js', 'data/permanent.js', 'data/primary.js']
      .map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
    const unused = have.filter(f => !code.includes(f));
    ok('★ assets/ 底下每一張圖都有被程式碼引用',
      unused.length === 0, unused.join(', ') || have.length + ' 張全部有用到');

    // icon-master.svg 是 PNG 的來源檔，不該被頁面引用，但必須存在
    ok('icon-master.svg 存在（PWA 圖示的來源檔）',
      fs.existsSync(path.join(root, 'assets', 'icon-master.svg')));
  }

  /* ── 7f. 新接進來的四處插圖實際顯示得出來 ── */
  {
    await reset(p);
    await p.click('details:has(#faSteps) summary');
    await p.waitForFunction(() =>
      [...document.querySelectorAll('#faSteps .fa-step-fig img')].every(i => i.complete));
    const steps = await p.$$eval('#faSteps .fa-step-fig img',
      ns => ns.map(i => [i.getAttribute('src'), i.naturalWidth > 0]));
    ok('★ 現場急救四步驟四張圖都在且載得到',
      steps.length === 4 && steps.every(x => x[1]),
      steps.filter(x => !x[1]).map(x => x[0]).join() || '4/4');
    ok('四步驟有編號 1–4',
      (await p.$$eval('#faSteps .fa-step-n', ns => ns.map(n => n.textContent))).join('') === '1234');

    await p.click('details:has(#apexFigs) summary');
    await p.waitForFunction(() =>
      [...document.querySelectorAll('#apexFigs img')].every(i => i.complete));
    const apex = await p.$$eval('#apexFigs img',
      ns => ns.map(i => [i.getAttribute('src'), i.naturalWidth > 0]));
    ok('★ 根尖成熟度三張圖都在且載得到（成熟／未成熟／放大對照）',
      apex.length === 3 && apex.every(x => x[1]),
      apex.map(x => x[0].split('/').pop()).join(' '));
    ok('說明講到未成熟根可能自行血管再生',
      /血管再生/.test(await p.textContent('#apexBody')));
  }

  /* ── 7g. 手機版面（v1.8）──
     用最窄的常見機型 375px 跑，檢查兩件在桌機上看不出來的事：
     頁面會不會橫向溢出、點擊目標夠不夠大。
     先前頂列四顆只有 34–36px（Apple HIG 下限是 44），而且 <400px 時
     「提示」「查閱」的文字會被藏掉只剩 emoji，觸控又沒有 hover 看不到 title。 */
  {
    const mob = await browser.newContext({
      viewport:{ width:375, height:667 }, deviceScaleFactor:2,
      isMobile:true, hasTouch:true, serviceWorkers:'block'
    });
    await stubStats(mob);
    const mp = await mob.newPage();
    await mp.goto(LOGIN);
    await mp.evaluate(() => localStorage.setItem('nckuh_endo_authed','1'));
    await mp.evaluate(() => localStorage.setItem('dtg_mode','normal'));
    await mp.goto(APP);
    await mp.waitForSelector('#treeQ');

    const scan = () => mp.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const inScroller = el => {
        for (let q = el.parentElement; q && q !== document.body; q = q.parentElement){
          const ox = getComputedStyle(q).overflowX;
          if (ox === 'auto' || ox === 'scroll') return true;
        }
        return false;
      };
      const wide = [], small = [];
      document.querySelectorAll('body *').forEach(el => {
        if (!el.getClientRects().length || inScroller(el)) return;
        const b = el.getBoundingClientRect();
        if (b.width > vw + 1 || b.right > vw + 1)
          wide.push((el.id ? '#' + el.id : el.tagName.toLowerCase()) + ' w=' + Math.round(b.width));
      });
      document.querySelectorAll('button, summary, input').forEach(el => {
        if (!el.getClientRects().length) return;
        const b = el.getBoundingClientRect();
        if (b.height < 44 || b.width < 40)
          small.push((el.id ? '#' + el.id : '.' + String(el.className).split(' ')[0]) +
                     ' ' + Math.round(b.width) + '×' + Math.round(b.height));
      });
      return { overflow: document.documentElement.scrollWidth > vw + 1,
               wide: [...new Set(wide)], small: [...new Set(small)] };
    });

    let r = await scan();
    ok('★ 375px 下首頁不會橫向溢出', !r.overflow && r.wide.length === 0, r.wide.join(' '));
    ok('★ 375px 下的按鈕都達到 44px 觸控下限', r.small.length === 0, r.small.join(' ｜ '));

    // <400px 時不可以把「提示」「查閱」的文字藏掉——emoji 看不出是什麼
    const labels = await mp.$$eval('.chip-btn span:last-child',
      ns => ns.map(n => [n.textContent.trim(), getComputedStyle(n).display]));
    ok('★ 375px 下「提示」「查閱」仍看得到文字，不是只剩 emoji',
      labels.length === 2 && labels.every(l => l[1] !== 'none' && l[0].length > 0),
      labels.map(l => l[0] + '(' + l[1] + ')').join(' '));

    // 診斷頁是內容最密的一頁，也要掃一次
    await mp.click('#btnBrowse');
    await mp.waitForSelector('#screenBrowse:not([hidden])');
    await mp.click('#browseList .dx-card >> nth=0');
    await mp.waitForSelector('#screenDx:not([hidden])');
    r = await scan();
    ok('★ 375px 下診斷頁不會橫向溢出', !r.overflow && r.wide.length === 0, r.wide.join(' '));
    ok('診斷頁的按鈕也都達到 44px', r.small.length === 0, r.small.join(' ｜ '));
    await mob.close();
  }

  /* ── 7h. 寬螢幕診斷頁兩欄（v1.9）──
     ≥1024px：左欄醫師版／家屬版，右欄固定放追蹤時程與計算器。
     最容易出事的四個地方：
       ① display:grid 蓋掉 [hidden]，隱藏中的診斷頁跑出來（CLAUDE.md 記過這個坑）
       ② 右欄卡片會自己捲——按了「產生回診時程」結果卻落在看不到的地方
       ③ 右欄是同一個元素重複使用，換診斷時停在上一個診斷捲到的位置
       ④ 平板直向（834）與手機不該受影響 */
  {
    const wide = await browser.newContext({ viewport:{ width:1280, height:800 }, serviceWorkers:'block' });
    await stubStats(wide);
    const wp = await wide.newPage();
    await wp.goto(LOGIN);
    await wp.evaluate(() => localStorage.setItem('nckuh_endo_authed','1'));
    await wp.evaluate(() => localStorage.setItem('dtg_mode','normal'));
    await wp.goto(APP);
    await wp.waitForSelector('#treeQ');

    ok('★ 寬螢幕停在決策樹時，診斷頁仍是隱藏的（grid 沒有蓋掉 [hidden]）',
      await wp.evaluate(() => getComputedStyle(document.getElementById('screenDx')).display) === 'none');

    const openW = async q => {
      await wp.click('#btnBrowse');
      await wp.waitForSelector('#screenBrowse:not([hidden])');
      await wp.fill('#dxSearch', q);
      await wp.waitForTimeout(200);
      await wp.click('#browseList .dx-card >> nth=0');
      await wp.waitForSelector('#screenDx:not([hidden])');
      await wp.waitForTimeout(250);
    };
    ok('查閱頁的內容區維持原寬度（只有診斷頁放寬）',
      await wp.evaluate(() => { document.getElementById('btnBrowse').click();
        return Math.round(document.querySelector('.wrap').getBoundingClientRect().width); }) <= 860);

    await openW('內縮性');
    const g = await wp.evaluate(() => {
      const c = document.getElementById('paneClinical').getBoundingClientRect();
      const s = document.getElementById('cardSchedule').getBoundingClientRect();
      return { side: s.left >= c.right - 1, pos: getComputedStyle(document.getElementById('cardSchedule')).position,
               overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
    });
    ok('★ 1280px：追蹤時程在醫師版的右邊（兩欄）', g.side);
    ok('右欄是 sticky', g.pos === 'sticky', g.pos);
    ok('兩欄版面沒有橫向溢出', !g.overflow);

    await wp.evaluate(() => window.scrollTo(0, 1400));
    await wp.waitForTimeout(250);
    const stay = await wp.evaluate(() => {
      const s = document.getElementById('cardSchedule').getBoundingClientRect();
      const bar = document.querySelector('.topbar').getBoundingClientRect();
      return { top: Math.round(s.top), bar: Math.round(bar.bottom), vh: innerHeight };
    });
    ok('★ 捲左欄時右欄一直看得到，而且沒有鑽到頂列底下',
      stay.top >= stay.bar - 1 && stay.top < stay.vh, '右欄頂 ' + stay.top + ' ／ 頂列底 ' + stay.bar);

    // ② 算出時程後，結果開頭要在右欄可見範圍內
    await wp.evaluate(() => window.scrollTo(0, 0));
    await wp.fill('#injuryDate', '2026-03-01');
    await wp.click('#btnCalc');
    await wp.waitForSelector('#scheduleOut:not([hidden])');
    await wp.waitForTimeout(700);                     // 等 smooth 捲動結束
    const seen = await wp.evaluate(() => {
      const c = document.getElementById('cardSchedule').getBoundingClientRect();
      const r1 = document.querySelector('#tblSchedule tr:nth-child(2)').getBoundingClientRect();
      return r1.top >= c.top - 1 && r1.bottom <= c.bottom + 1;
    });
    ok('★ 按「產生回診時程」後，第一次回診那一列在右欄裡看得到', seen);

    // ③ 換診斷時右欄要回到頂端
    await wp.evaluate(() => { document.getElementById('cardSchedule').scrollTop = 400; });
    await openW('側向');
    ok('★ 換到另一個診斷，右欄從頂端開始（不會停在上一個診斷捲到的地方）',
      await wp.$eval('#cardSchedule', c => c.scrollTop) === 0);
    await wide.close();

    // ④ 平板直向：維持單欄
    const tab = await browser.newContext({ viewport:{ width:834, height:1000 }, serviceWorkers:'block' });
    await stubStats(tab);
    const tp = await tab.newPage();
    await tp.goto(LOGIN);
    await tp.evaluate(() => localStorage.setItem('nckuh_endo_authed','1'));
    await tp.goto(APP);
    await tp.waitForSelector('#treeQ');
    await tp.click('#btnBrowse');
    await tp.waitForSelector('#screenBrowse:not([hidden])');
    await tp.click('#browseList .dx-card >> nth=0');
    await tp.waitForSelector('#screenDx:not([hidden])');
    const single = await tp.evaluate(() => {
      const c = document.getElementById('paneClinical').getBoundingClientRect();
      const s = document.getElementById('cardSchedule').getBoundingClientRect();
      return s.top >= c.bottom - 1 && getComputedStyle(document.getElementById('cardSchedule')).position !== 'sticky';
    });
    ok('★ 平板直向 834px 維持單欄（追蹤時程在內容下方、不 sticky）', single);
    await tab.close();
  }

  /* ── 7i. 文字對比度（v2.0 改成淺色之後加）──
     逐一量畫面上每一段可見文字的實際對比度：一般文字 ≥4.5:1、大字 ≥3:1（WCAG AA）。
     深色改淺色時最容易出事的是「寫死的白字」——例如舊版的 .sec-list strong{color:#fff}，
     換成白底後所有粗體臨床重點會直接消失。以後改顏色改到看不清楚，這條會紅。 */
  {
    const scanContrast = pg => pg.evaluate(() => {
      const lum = ([r, g, b]) => {
        const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const parse = t => { const m = t.match(/[\d.]+/g); return m ? m.map(Number) : null; };
      const bgOf = el => {
        for (let e = el; e; e = e.parentElement){
          const c = parse(getComputedStyle(e).backgroundColor);
          if (c && (c.length < 4 || c[3] > 0.5)) return c.slice(0, 3);
        }
        return [244, 246, 249];
      };
      const bad = [];
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()){
        const t = n.textContent.trim();
        const el = n.parentElement;
        if (!t || !el || !el.getClientRects().length) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
        const L1 = lum(parse(cs.color).slice(0, 3)), L2 = lum(bgOf(el));
        const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        const fs = parseFloat(cs.fontSize), big = fs >= 24 || (fs >= 18.66 && +cs.fontWeight >= 700);
        if (ratio < (big ? 3 : 4.5)) bad.push(ratio.toFixed(2) + '「' + t.slice(0, 12) + '」');
      }
      return [...new Set(bad)];
    });

    await reset(p);
    await p.click('details:has(#faSteps) summary');
    await p.click('details:has(#storageRow) summary');
    let bad = await scanContrast(p);
    ok('★ 首頁（含急救四步驟、保存液）所有文字對比度達 WCAG AA', bad.length === 0, bad.slice(0, 5).join(' ｜ '));

    await p.click('#btnBrowse');
    await p.waitForSelector('#screenBrowse:not([hidden])');
    bad = await scanContrast(p);
    ok('查閱頁所有文字對比度達標', bad.length === 0, bad.slice(0, 5).join(' ｜ '));

    await p.fill('#dxSearch', '內縮性');
    await p.waitForTimeout(150);
    await p.click('#browseList .dx-card >> nth=0');
    await p.waitForSelector('#screenDx:not([hidden])');
    await p.fill('#injuryDate', '2026-03-01');
    await p.click('#btnCalc');
    await p.waitForSelector('#scheduleOut:not([hidden])');
    bad = await scanContrast(p);
    ok('★ 診斷頁醫師版（含 AAE 附註、回診表）所有文字對比度達標', bad.length === 0, bad.slice(0, 5).join(' ｜ '));

    await p.click('#btnAudPublic');
    await p.waitForSelector('#panePublic:not([hidden])');
    bad = await scanContrast(p);
    ok('診斷頁家屬版所有文字對比度達標', bad.length === 0, bad.slice(0, 5).join(' ｜ '));
    await p.click('#btnAudClinical');
    // 搜尋框在診斷頁上是隱藏的，要回到查閱頁才清得掉（9c 踩過同一個坑）。
    // 不清的話下一段查閱測試只會看到「內縮性」那 2 筆。
    await p.click('#btnBack');
    await p.waitForSelector('#screenBrowse:not([hidden])');
    await p.fill('#dxSearch', '');
  }

  /* ── 8. 查閱模式與搜尋 ── */
  {
    await p.click('#btnBrowse');
    await p.waitForSelector('#screenBrowse:not([hidden])');
    const n = await p.$$eval('#browseList .dx-card', ns => ns.length);
    ok('列表共 26 種診斷（恆牙 14＋乳牙 12）', n === 26, n + ' 種');
    const secs = await p.$$eval('#browseList .browse-sec', ns => ns.map(x => x.textContent.trim()));
    ok('★ 依恆牙／乳牙分大區', secs.join('｜') === '恆牙｜乳牙', secs.join('｜'));
    const grps = await p.$$eval('#browseList .group-title', ns => ns.map(x => x.textContent.trim()));
    ok('★ 分區標題用臨床講法（牙齒與齒槽骨折斷／震盪與脫位傷／完全脫落）',
      grps.length === 6 && grps[0] === '牙齒與齒槽骨折斷' &&
      grps[1] === '震盪與脫位傷' && grps[2] === '完全脫落', grps.join('｜'));
    const cols = await p.$eval('#browseList .dx-grid',
      n => getComputedStyle(n).gridTemplateColumns.split(' ').length);
    ok('★ 卡片兩欄排列（手機一屏掃得完）', cols === 2, cols + ' 欄');
    ok('★ ⚡ 有圖例說明（先前是沒有解釋的紅點）',
      await p.isVisible('#browseLegend') &&
      /時間急迫/.test(await p.textContent('#browseLegend')) &&
      /不能等 X 光/.test(await p.textContent('#browseLegend')));
    ok('★ 急迫標記用 ⚡ 而不是紅點',
      (await p.$$eval('.urgent-dot', ns => ns.map(x => x.textContent.trim()))).every(t => t === '⚡'));
    ok('查閱頁的返回鍵在頂列', await p.isVisible('#btnBack'));

    await p.fill('#dxSearch', '脫位');
    await p.waitForTimeout(120);
    const m = await p.$$eval('#browseList .dx-card .nm', ns => ns.map(x => x.textContent.trim()));
    ok('搜尋「脫位」找得到半脫位／外突性／側向／內縮性（恆牙乳牙各 4）',
      m.length === 8 && m.every(x => /脫位/.test(x)), m.length + ' 筆');

    await p.fill('#dxSearch', 'zzzz');
    await p.waitForTimeout(120);
    ok('查無結果時顯示提示', await p.isVisible('#browseEmpty'));
    await p.fill('#dxSearch', '');
  }

  /* ── 9. 關鍵臨床數字（被改壞就會給錯建議）── */
  {
    await p.fill('#dxSearch', '內縮性');
    await p.waitForTimeout(120);
    await p.click('#browseList .dx-card >> nth=0');
    await p.waitForSelector('#screenDx:not([hidden])');
    ok('開到恆牙內縮性脫位', (await p.textContent('#dxNameZh')) === '內縮性脫位');

    const clin = await p.textContent('#paneClinical');
    ok('★ 手術復位後固定 4 週（不是 2 週）',
      /手術復位後以被動柔性固定裝置固定 4 週/.test(clin));
    ok('★ 未成熟根 4 週內無再萌出就矯正復位（不是 8 週）',
      /未成熟牙若 4 週內沒有再萌出，開始矯正復位/.test(clin));
    ok('成熟根 <3mm 的 8 週與未成熟根的 4 週分開寫',
      /撞入 <3 mm[^。]*8 週內沒有再萌出/.test(clin));
    ok('成熟牙根管治療約 2 週開始', /約 2 週、或牙齒位置一允許操作時就開始/.test(clin));
    ok('脫位頁附牙髓測試判讀警告',
      /第一次敏感性測試陰性，不等於牙髓壞死/.test(clin));

    /* ── 9b. 兩份指引並列（v1.4）──
       主幹仍是 IADT，AAE 只是附註；如果哪天有人把主值換成 AAE 的 2 週，
       上面那條「固定 4 週」的斷言會先擋下來。 */
    const notes = await p.$$eval('#paneClinical .aae-note', ns => ns.map(n => n.textContent));
    ok('★ 內縮性脫位有 AAE 附註', notes.length === 1, notes.length + ' 則');
    ok('★ 附註誠實交代 AAE 自身兩表不一致（Table 3 寫 2 週、Table 5 拆在 4 週）',
      /Table 3/.test(notes[0]) && /2 週/.test(notes[0]) &&
      /Table 5/.test(notes[0]) && /4 週/.test(notes[0]), notes[0] || '');
    ok('★ 附註有 AAE 2026 標籤，跟 IADT 主文區隔得開',
      (await p.textContent('#paneClinical .aae-tag')).trim() === 'AAE 2026');
    const fu = await p.textContent('#dxFollowUp');
    ok('★ 追蹤時程也列出 AAE 的版本', /脫位追蹤時程四類共用/.test(fu) && /6–8 週/.test(fu));
  }

  /* ── 9c. 一致的地方不要加註（不然整頁都是註，反而看不到真正的差異）── */
  {
    await p.click('#btnBack');
    await p.waitForSelector('#screenBrowse:not([hidden])');
    await p.fill('#dxSearch', '齒槽骨骨折');
    await p.waitForTimeout(150);
    await p.click('#browseList .dx-card >> nth=0');
    await p.waitForSelector('#screenDx:not([hidden])');
    ok('開到恆牙齒槽骨骨折', (await p.textContent('#dxNameZh')) === '齒槽骨骨折');
    ok('★ 兩份指引一致的診斷完全沒有 AAE 附註',
      (await p.$$('#screenDx .aae-note')).length === 0);
  }

  /* ── 9d. 乳牙要明講 AAE 沒有涵蓋，不能讓「沒附註」被讀成「兩份一致」── */
  {
    await p.click('#btnBack');
    await p.waitForSelector('#screenBrowse:not([hidden])');
    await p.fill('#dxSearch', '');
    await p.fill('#dxSearch', '震盪');
    await p.waitForTimeout(150);
    const names = await p.$$eval('#browseList .dx-card .nm', ns => ns.map(x => x.textContent.trim()));
    await p.click('#browseList .dx-card >> nth=' + (names.length - 1));   // 最後一筆是乳牙
    await p.waitForSelector('#screenDx:not([hidden])');
    ok('開到乳牙震盪', (await p.textContent('#dxDentition')) === '乳牙');
    const note = await p.textContent('#dxFollowUp .aae-note');
    ok('★ 乳牙頁明講 AAE 2026 只涵蓋恆牙、本頁單一來源是 IADT-3',
      /只涵蓋/.test(note) && /恆牙/.test(note) && /IADT-3/.test(note), note);

    // 後面的區段（醫師版／家屬版、回診日期）預期停在恆牙內縮性脫位，交還畫面
    await p.click('#btnBack');
    await p.waitForSelector('#screenBrowse:not([hidden])');
    await p.fill('#dxSearch', '內縮性');
    await p.waitForTimeout(150);
    await p.click('#browseList .dx-card >> nth=0');
    await p.waitForSelector('#screenDx:not([hidden])');
    ok('回到恆牙內縮性脫位（交還給後續區段）',
      (await p.textContent('#dxNameZh')) === '內縮性脫位' &&
      (await p.textContent('#dxDentition')) === '恆牙');
  }

  /* ── 10. 醫師版／家屬版 ── */
  {
    ok('預設顯示醫師版', await p.isVisible('#paneClinical') && !(await p.isVisible('#panePublic')));
    await p.click('#btnAudPublic');
    await p.waitForSelector('#panePublic:not([hidden])');
    ok('切到家屬版：醫師版隱藏', !(await p.isVisible('#paneClinical')));
    ok('家屬版是白話（不要自己把牙齒拉出來）',
      /不要自己想把牙齒拉出來/.test(await p.textContent('#panePublic')));
    await p.click('#btnAudClinical');
  }

  /* ── 11. 回診日期計算 ── */
  {
    await p.fill('#injuryDate', '2026-03-01');
    await p.click('#btnCalc');
    await p.waitForSelector('#scheduleOut:not([hidden])');
    const rows = await p.$$eval('#tblSchedule tr', ns =>
      ns.slice(1).map(r => Array.from(r.cells).map(c => c.textContent.trim())));
    ok('內縮性脫位 6 次回診', rows.length === 6, rows.length + ' 次');
    ok('2 週 = 2026-03-15', rows[0][1] === '2026-03-15', rows[0][1]);
    ok('4 週 = 2026-03-29 且標記拆固定裝置',
      rows[1][1] === '2026-03-29' && rows[1][0].includes('✂'), rows[1][0] + ' ' + rows[1][1]);
    ok('1 年 = 2027-03-01', rows[5][1] === '2027-03-01', rows[5][1]);

    // 從查閱列表開的診斷，返回要回列表
    await p.click('#btnBack');
    await p.waitForSelector('#screenBrowse:not([hidden])');
    ok('★ 從查閱列表開的診斷，返回回到列表', true);

    // 區間型時間點（6–8 週）要顯示成日期區間
    await p.fill('#dxSearch', '牙釉質斷裂');
    await p.waitForTimeout(120);
    await p.click('#browseList .dx-card >> nth=0');
    await p.fill('#injuryDate', '2026-03-01');
    await p.click('#btnCalc');
    await p.waitForSelector('#scheduleOut:not([hidden])');
    const r0 = await p.$eval('#tblSchedule tr:nth-child(2) td:nth-child(2)', n => n.textContent.trim());
    ok('6–8 週顯示為日期區間 2026-04-12 ~ 2026-04-26',
      r0 === '2026-04-12 ~ 2026-04-26', r0);
  }

  /* ── 12. 病歷草稿 ── */
  {
    await ctx.grantPermissions(['clipboard-read','clipboard-write']);
    await p.click('#btnCopyNote');
    await p.waitForSelector('#toast:not([hidden])');
    const note = await p.evaluate(() => navigator.clipboard.readText());
    ok('草稿含標題與受傷日期', /【牙外傷處置紀錄】/.test(note) && /受傷日期：2026-03-01/.test(note));
    ok('草稿含中英文診斷名', /牙釉質斷裂 \/ Enamel fracture/.test(note));
    ok('草稿含固定裝置欄位', /固定裝置：不需固定/.test(note));
    ok('草稿含回診時程與出處', /回診時程/.test(note) && /IADT-1 Table 2/.test(note));
    ok('草稿不殘留 ** 標記', !/\*\*/.test(note));
  }

  /* ── 13. 乳牙脫落：不可再植 ── */
  {
    await reset(p);
    await p.click('#treeOpts .opt >> nth=1');           // 乳牙
    await p.waitForFunction(() => document.getElementById('treeQ').textContent.includes('齒槽窩'));
    await p.click('#treeOpts .opt >> nth=0');           // 整顆掉出來，牙齒有帶來
    await p.waitForSelector('#screenDx:not([hidden])');
    ok('乳牙脫落頁', (await p.textContent('#dxNameZh')) === '脫落' &&
      (await p.textContent('#dxDentition')) === '乳牙');
    ok('★ 明寫乳牙不可再植',
      /脫落的乳牙不可以再植/.test(await p.textContent('#paneClinical')));
    ok('乳牙脫落只追蹤 6–8 週一次', (await p.$$eval('#dxFollowUp .fu-list li', ns => ns.length)) === 1);
    ok('另註明 6 歲時再確認恆牙萌出', /6 歲時/.test(await p.textContent('#dxFollowUp')));

    await p.click('#btnAudPublic');
    await p.waitForSelector('#panePublic:not([hidden])');
    ok('家屬版有回家照顧（chlorhexidine）',
      /chlorhexidine/.test(await p.textContent('#panePublic')));
    await p.click('#btnAudClinical');
  }

  /* ── 14. 不需追蹤的診斷：不顯示日期計算 ── */
  {
    await p.click('#btnBrowse');
    await p.fill('#dxSearch', '裂紋');
    await p.waitForTimeout(120);
    await p.click('#browseList .dx-card >> nth=0');
    await p.waitForSelector('#screenDx:not([hidden])');
    ok('牙釉質裂紋：IADT 不要求例行追蹤',
      /不要求例行追蹤/.test(await p.textContent('#dxFollowUp')));
    ok('不需追蹤時隱藏日期計算器', !(await p.isVisible('#cardSchedule .calc')));
  }

  /* ── 15. 診斷頁的插圖：有圖就顯示，載不到才顯示佔位文字 ── */
  {
    await p.waitForFunction(() => {
      const i = document.querySelector('.dx-fig img');
      return i && i.naturalWidth > 0;
    });
    ok('診斷頁顯示插圖', true);
    const h = await p.$eval('.dx-fig', n => n.getBoundingClientRect().height);
    ok('插圖框撐出版面高度（版面不塌）', h > 100, h + 'px');

    // 載不到時（檔案還沒補、或被擋掉）要退成佔位文字，不能留空洞
    await p.route('**/assets/dx/*.svg', r => r.abort());
    await p.reload();
    await p.waitForSelector('#screenTree');
    await p.click('#btnBrowse');
    await p.waitForSelector('#screenBrowse:not([hidden])');
    await p.click('#browseList .dx-card >> nth=0');
    await p.waitForSelector('#screenDx:not([hidden])');
    const ph = await p.$$eval('.dx-fig .ph', ns => ns.map(n => n.textContent.trim()));
    ok('★ 插圖載不到時顯示佔位文字', ph.length === 1 && ph[0] === '插圖尚未上傳', ph.join());
    const h2 = await p.$eval('.dx-fig', n => n.getBoundingClientRect().height);
    ok('佔位狀態下版面高度仍在', h2 > 100, h2 + 'px');
    await p.unroute('**/assets/dx/*.svg');
  }

  /* ── 16. hidden 屬性沒有被自訂 class 蓋掉（別的 App 踩過兩次）── */
  {
    const d = await p.evaluate(() => getComputedStyle(document.getElementById('panePublic')).display);
    ok('[hidden] 的 computed display 真的是 none', d === 'none', d);
  }

  /* ── 17. 從首頁卡片點進來（CLAUDE.md 要求的上架驗證）── */
  {
    const home = await ctx.newPage();
    await home.goto(LOGIN);
    await home.waitForSelector('.app-card .app-name');
    // .app-name 裡除了名稱還有 🆕 徽章，所以比對開頭而不是整串相等
    const idx = await home.$$eval('.app-card .app-name', ns =>
      ns.findIndex(n => n.textContent.trim().startsWith('牙外傷處置指南')));
    ok('首頁卡片已登記「牙外傷處置指南」', idx >= 0, 'index ' + idx);

    if (idx >= 0){
      const card = (await home.$$('.app-card'))[idx];
      ok('卡片在「手機也能用」區',
        await card.evaluate(n => n.closest('section').textContent.includes('手機也能用')));
      // 卡片有覆蓋層攔 pointer events，要 force；window.open 帶 noopener，
      // 新分頁要監聽 context 的 page 事件而不是 popup。
      const opened = ctx.waitForEvent('page');
      await card.click({ force: true });
      const np = await opened;
      await np.waitForLoadState('domcontentloaded');
      ok('點卡片開到工具頁', /dental-trauma-guide/.test(np.url()), np.url().split('/').slice(-2).join('/'));
      ok("新分頁標題正確", /牙外傷處置指南 v2\.0/.test(await np.title()), await np.title());
      await np.close();
    }
    await home.close();
  }

  await reset(p);
  await p.screenshot({ path: path.join(OUT, 'dental-trauma-open.png'), fullPage: false });

  await browser.close();
  console.log('\n  通過 ' + pass + ' 項，失敗 ' + fail + ' 項');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
