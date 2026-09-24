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
   · 影像提示預設關閉，開關在右上角 */
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

async function authed(browser){
  const ctx = await browser.newContext({ viewport:{ width:414, height:900 } });
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

    const rows = await p.$$eval('#tblFirstAid tr', ns => ns.length);
    ok('現場急救速查表有表頭＋6 列', rows === 7, rows + ' 列');
    const refs = await p.$$eval('#listRefs li', ns => ns.length);
    ok('參考文獻列出 4 篇 IADT 2020', refs === 4, refs + ' 篇');
    ok('頁尾有免責聲明', /不能取代臨床判斷/.test(await p.textContent('#txtDisclaimer')));
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
      (await p.textContent('#treeQ')).includes('影像上有看到什麼異常'));
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
      (await p.textContent('#treeQ')).includes('影像上看到什麼'));
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
      (await p.textContent('#treeQ')).includes('影像上有看到什麼異常'));

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
      (await p.textContent('#treeQ')).includes('影像上有看到牙根的斷裂線'));
    await p.click('#treeOpts .opt >> nth=0');           // 有斷裂線
    await p.waitForSelector('#screenDx:not([hidden])');
    ok('★ 乳牙：搖動＋有斷裂線 → 牙根斷裂',
      (await p.textContent('#dxNameZh')) === '牙根斷裂' &&
      (await p.textContent('#dxDentition')) === '乳牙');
  }

  /* ── 8. 查閱模式與搜尋 ── */
  {
    await p.click('#btnBrowse');
    await p.waitForSelector('#screenBrowse:not([hidden])');
    const n = await p.$$eval('#browseList .dx-item', ns => ns.length);
    ok('列表共 26 種診斷（恆牙 14＋乳牙 12）', n === 26, n + ' 種');
    ok('★ ⚡ 有圖例說明（先前是沒有解釋的紅點）',
      await p.isVisible('#browseLegend') &&
      /時間急迫/.test(await p.textContent('#browseLegend')) &&
      /不能等 X 光/.test(await p.textContent('#browseLegend')));
    ok('★ 急迫標記用 ⚡ 而不是紅點',
      (await p.$$eval('.urgent-dot', ns => ns.map(x => x.textContent.trim()))).every(t => t === '⚡'));
    ok('查閱頁的返回鍵在頂列', await p.isVisible('#btnBack'));

    await p.fill('#dxSearch', '脫位');
    await p.waitForTimeout(120);
    const m = await p.$$eval('#browseList .dx-item b', ns => ns.map(x => x.textContent.trim()));
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
    await p.click('#browseList .dx-item >> nth=0');
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
    await p.click('#browseList .dx-item >> nth=0');
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
    await p.click('#browseList .dx-item >> nth=0');
    await p.waitForSelector('#screenDx:not([hidden])');
    ok('牙釉質裂紋：IADT 不要求例行追蹤',
      /不要求例行追蹤/.test(await p.textContent('#dxFollowUp')));
    ok('不需追蹤時隱藏日期計算器', !(await p.isVisible('#cardSchedule .calc')));
  }

  /* ── 15. 缺圖時版面不壞 ── */
  {
    const ph = await p.$$eval('.dx-fig .ph', ns => ns.map(n => n.textContent.trim()));
    ok('插圖未上傳時顯示佔位文字', ph.length === 1 && ph[0] === '插圖尚未上傳', ph.join());
    const h = await p.$eval('.dx-fig', n => n.getBoundingClientRect().height);
    ok('佔位框仍撐出版面高度（版面不塌）', h > 100, h + 'px');
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
      ok("新分頁標題正確", /牙外傷處置指南 v1\.1/.test(await np.title()), await np.title());
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
