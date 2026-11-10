/* DentFigure — 牙科範本(第五層)
   ═══════════════════════════════════════════════════════════════════════════

   上游的 8 個範本是期刊版型(Nature 2×2、Cell 2×3…),只設格狀幾何。
   牙科病例圖的差別在於「每一格代表治療過程的哪一步」——那是真正花時間
   手打的部分,而且順序固定。所以這一層做兩件上游沒有的事:

     1. 套用版面(欄列數、面板比例、間距)
     2. **自動填入每一格的階段名稱**(畫在面板上的 tag)

   ── 為什麼填 tag 而不是 caption note ──────────────────────────────────
   上游每個面板有兩個文字欄位,差別很大:
     · `tag`         → 畫在面板上(標題寫 "Tag (shown on the panel)")
     · `captionNote` → **不會畫出來**,只餵圖說產生器(寫 "not rendered")
   要在圖上看到「術前 PA」必須寫 tag。兩個都填:tag 給讀者看,
   captionNote 讓自動產生的圖說也帶得到階段名稱。

   ── 階段名稱是草案,不是臨床規範 ──────────────────────────────────────
   下面的名稱取自牙科病例報告常見的記錄順序,**沒有依據任何特定指引**,
   也沒有經過使用者確認。每一格的文字在「影像」清單的 Tag 欄可以直接改,
   要永久改就改這個檔案的 `tags` 陣列(一行一個)。
   UI 上有寫明這點。

   ── 刻意不做影像辨識 ──────────────────────────────────────────────────
   名稱是依**面板順序**填進去的,不是看影像內容判斷的。順序對不對由使用者
   確認(與案例標記工具的標準照模板同一個原則:要靠 ML 模型、需要病患照片
   訓練驗證,而 repo 是公開的;左右側／階段認錯是臨床錯誤)。

   不改 figure_lab.html —— index.html 由 make-index.py 從釘選快照產生。
*/
(function () {
  'use strict';

  // ── 範本定義 ───────────────────────────────────────────────────────────
  // tags 的長度＝這個範本預期的格數。cols×rows 要容納得下。
  // panelW/panelH 是面板比例:根尖片直放約 3:4(250×330),
  // 臨床照多為橫幅 4:3(300×225),混合用的取方形折衷。
  const DENTAL_TEMPLATES = [
    {
      id: 'rct4', btn: '根管治療<br>4 格',
      hint: '術前 PA → 工作長度 → 充填後 → 追蹤',
      tags: ['術前 PA', '工作長度', '充填後', '追蹤'],
      cols: 4, rows: 1, panelW: 250, panelH: 330, gapH: 2, gapV: 2,
    },
    {
      id: 'rct6', btn: '根管治療<br>6 格',
      hint: '加入術前臨床照與主牙膠試放',
      tags: ['術前 PA', '術前臨床照', '工作長度', '主牙膠試放', '充填後', '追蹤'],
      cols: 3, rows: 2, panelW: 250, panelH: 330, gapH: 2, gapV: 2,
    },
    {
      id: 'retx4', btn: '再治療<br>4 格',
      hint: '術前 PA → 移除舊充填物 → 充填後 → 追蹤',
      tags: ['術前 PA', '移除舊充填物', '充填後', '追蹤'],
      cols: 4, rows: 1, panelW: 250, panelH: 330, gapH: 2, gapV: 2,
    },
    {
      id: 'apicoect6', btn: '根尖手術<br>6 格',
      hint: '影像與術中照混合,面板取方形',
      tags: ['術前 PA', '翻瓣', '根尖切除', '逆充填', '縫合', '追蹤'],
      cols: 3, rows: 2, panelW: 280, panelH: 280, gapH: 3, gapV: 3,
    },
    {
      id: 'regen4', btn: '再生治療<br>4 格',
      hint: '術前 PA → 根管消毒 → 封填 → 追蹤',
      tags: ['術前 PA', '根管消毒', '封填', '追蹤'],
      cols: 4, rows: 1, panelW: 250, panelH: 330, gapH: 2, gapV: 2,
    },
    {
      id: 'followup4', btn: '縱向追蹤<br>4 格',
      hint: '同一顆牙不同時間點',
      tags: ['術前', '術後即刻', '6 個月', '12 個月'],
      cols: 4, rows: 1, panelW: 250, panelH: 330, gapH: 2, gapV: 2,
    },
    {
      id: 'intraoral5', btn: '口內照<br>5 格',
      hint: '橫排;上游只支援均勻格狀,排不出十字形',
      tags: ['正面', '右側', '左側', '上頜咬合面', '下頜咬合面'],
      cols: 5, rows: 1, panelW: 300, panelH: 225, gapH: 3, gapV: 3,
    },
  ];

  const MARGIN = { top: 26, left: 40, btm: 16, right: 16 };
  const GAP_LOOSE = 6;   // 「留空隙」用的預設值,之後可在排列面板微調

  // ── 共用:重設逐條間距覆寫 ─────────────────────────────────────────────
  /* 為什麼每次套版面都要做這件事:
     `colGaps`/`rowGaps` 是「第 n 條間距另外指定」的覆寫陣列,`advancedSpacing`
     是它的總開關。繪圖時 colGaps 只被截短／補 null(上游 5629 行),所以舊的
     覆寫會照 index 直接套到新版面的間距上,範本設的 gapH 對那幾條完全沒作用。
     上游的 loadTemplate 有重設(註解寫得很清楚),applyTemplate 沒有 ——
     那個不一致在 fixes.js 補。這裡自己一定要做對。

     三個都是頂層 let,在 classic script 的全域語彙環境裡用裸名存取得到
     (window.colGaps 取不到,與 trim-features.js 取 CMD_REGISTRY 同一個手法)。*/
  function resetGutterOverrides() {
    try {
      if (typeof colGaps !== 'undefined') colGaps = null;            // eslint-disable-line no-undef
      if (typeof rowGaps !== 'undefined') rowGaps = null;            // eslint-disable-line no-undef
      if (typeof advancedSpacing !== 'undefined') advancedSpacing = false; // eslint-disable-line no-undef
    } catch (e) { /* 上游改了宣告方式就算了,版面仍然套得上去 */ }
    const el = document.getElementById('advanced-spacing');
    if (el) el.checked = false;
  }

  // ── 套用一個牙科範本 ───────────────────────────────────────────────────
  function applyDentalTemplate(id) {
    const t = DENTAL_TEMPLATES.find(x => x.id === id);
    if (!t) return;

    // 1) 範本一律是格狀圖;自由排版下要先切回來(上游的範本區也是這個行為)
    const modeEl = document.getElementById('layout-mode');
    if (modeEl && modeEl.value !== 'grid') {
      modeEl.value = 'grid';
      if (typeof setLayoutMode === 'function') setLayoutMode('grid');
    }

    // 2) 覆蓋既有 tag 前先問。病例做到一半被清掉比沒有範本更糟。
    const imgs = (typeof images !== 'undefined' && Array.isArray(images)) ? images : []; // eslint-disable-line no-undef
    const n = Math.min(imgs.length, t.tags.length);
    const willOverwrite = imgs.slice(0, n).some(im => (im.tag || '').trim());
    if (willOverwrite &&
        !confirm('有面板已經填了標籤,套用範本會蓋掉。要繼續嗎?')) return;

    // 3) 版面幾何
    const sval = (k, v) => { const el = document.getElementById(k); if (el) el.value = v; };
    sval('cols', t.cols);     sval('rows', t.rows);
    sval('panel-w', t.panelW); sval('panel-h', t.panelH);
    sval('gap-h', t.gapH);    sval('gap-v', t.gapV);
    sval('m-top', MARGIN.top); sval('m-left', MARGIN.left);
    sval('m-btm', MARGIN.btm); sval('m-right', MARGIN.right);
    resetGutterOverrides();

    // 4) 階段名稱,**依面板順序**填入
    for (let i = 0; i < n; i++) {
      imgs[i].tag = t.tags[i];
      // captionNote 不會畫出來,但自動產生的圖說會用到,所以一併帶上
      if (!(imgs[i].captionNote || '').trim()) imgs[i].captionNote = t.tags[i];
    }

    if (typeof renderImgList === 'function') renderImgList();
    if (typeof onLayoutChange === 'function') onLayoutChange();
    if (typeof scheduleRender === 'function') scheduleRender(0);

    // 5) 老實回報填了幾格 —— 數量不符時使用者要知道
    let msg;
    if (!imgs.length)            msg = `已套用版面(${t.tags.length} 格)。加入影像後再按一次就會帶入階段名稱。`;
    else if (n < t.tags.length)  msg = `已套用版面,填了前 ${n} 格;這個範本預期 ${t.tags.length} 格。`;
    else                         msg = `已套用「${t.btn.replace(/<br>/g, ' ')}」,${n} 格都帶入階段名稱。`;
    if (typeof toast === 'function') toast(msg, n && n < t.tags.length ? 'warn' : 'ok');
  }

  // ── 間距快捷:貼齊 / 留空隙 ─────────────────────────────────────────────
  /* 使用者要求:「分格的圖片應該要能決定貼在一起沒空隙,或是中間有空隙的
     排版模式,可調整空隙寬度」。寬度本來就能在排列面板輸入,缺的是
     「一鍵貼齊/一鍵分開」。一併重設逐條覆寫,否則按了沒反應。*/
  function setGap(px) {
    ['gap-h', 'gap-v'].forEach(k => { const el = document.getElementById(k); if (el) el.value = px; });
    resetGutterOverrides();
    if (typeof onLayoutChange === 'function') onLayoutChange();
    if (typeof scheduleRender === 'function') scheduleRender(0);
    if (typeof toast === 'function') {
      toast(px === 0 ? '面板已貼齊(無空隙)' : `面板間距 ${px}px(可在「排列」裡微調)`, 'ok');
    }
  }

  // ── 注入 UI ────────────────────────────────────────────────────────────
  function mount() {
    const grid = document.querySelector('#templates-acc .tpl-grid');
    if (!grid || document.getElementById('df-dental-tpl')) return;

    const wrap = document.createElement('div');
    wrap.id = 'df-dental-tpl';
    wrap.innerHTML =
      '<div class="divider"></div>' +
      '<div class="sec-lbl">牙科範本</div>' +
      '<div class="tpl-grid" id="df-dental-grid"></div>' +
      '<div style="font-size:10px;color:var(--muted);line-height:1.5;margin-top:5px">' +
        '階段名稱是<b>依面板順序</b>填入的,不是判讀影像內容 —— 請自行確認每格放對了。' +
        '名稱可在「影像」清單各面板的 Tag 欄直接改。' +
        '<br><span style="color:var(--warn)">名稱為初版草案,取自常見的記錄順序,尚未經臨床確認;' +
        '請依貴科慣用詞修改。</span>' +
      '</div>' +
      '<div class="sec-lbl" style="margin-top:8px">面板間距</div>' +
      '<div style="display:flex;gap:5px">' +
        '<button class="btn" id="df-gap-tight" style="flex:1;justify-content:center">貼齊(無空隙)</button>' +
        '<button class="btn" id="df-gap-loose" style="flex:1;justify-content:center">留空隙</button>' +
      '</div>';

    const g = wrap.querySelector('#df-dental-grid');
    DENTAL_TEMPLATES.forEach(t => {
      const b = document.createElement('button');
      b.className = 'tpl-btn';
      b.dataset.dentalTpl = t.id;
      b.innerHTML = t.btn;
      b.title = t.hint + '\n(' + t.tags.join(' · ') + ')';
      b.addEventListener('click', () => applyDentalTemplate(t.id));
      g.appendChild(b);
    });
    wrap.querySelector('#df-gap-tight').addEventListener('click', () => setGap(0));
    wrap.querySelector('#df-gap-loose').addEventListener('click', () => setGap(GAP_LOOSE));

    grid.insertAdjacentElement('afterend', wrap);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  // 給測試與主控台用
  window.__dfDental = { TEMPLATES: DENTAL_TEMPLATES, apply: applyDentalTemplate, setGap };
})();
