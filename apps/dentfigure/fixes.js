/* ===========================================================
   DentFigure — 行為修正層
   ===========================================================
   與 i18n-zh-TW.js 分開:那支只改文字,這支改行為。

   這裡放的是「上游有問題、但 DentFigure 等不到上游修」的補丁。
   每一條都要註明:症狀、原因、為什麼在這裡修而不是改 figure_lab.html。

   一律不改 upstream/figurelab/figure_lab.html —— 上游 33 個 spec 檔中有
   27 個斷言英文 UI 字串,改動快照會打爛那 469 筆回歸測試。
   =========================================================== */
(function () {
  'use strict';

  /* ── 修正 1:把圖片拖到畫布上,瀏覽器會把圖開走 ──────────────

     症狀(使用者回報,已重現):
       拖一張圖片到網頁上 → 沒有匯入,整個頁面變成那張圖。
       正在編輯的版面就這樣消失。

     原因:
       上游只在 #drop-zone(左上角那個虛線小方框)掛了 dragover/drop
       並呼叫 preventDefault()。document 層級沒有任何攔截,所以放在
       別處時瀏覽器就執行預設行為 —— 導航到那個檔案。

       實測 defaultPrevented:
         #drop-zone   true   ✓ app 接手
         #ann-canvas  false  ✗ 瀏覽器開啟圖片
         #fig-canvas  false  ✗
         body         false  ✗

       畫布是畫面上最大、最像「要把圖放這裡」的區域,卻是會把工作
       弄丟的那一個。

     做法:
       在 document 上補一層 capture=false 的 dragover/drop,只在拖曳
       內容含有檔案時攔截,並把圖片交給 app 既有的 addFiles()。
       #drop-zone 自己的處理器先跑,已經 preventDefault 的就跳過,
       避免同一批檔案被加入兩次。

     為什麼不改 figure_lab.html:見檔頭。
     這條值得回報給上游,但 DentFigure 現在就需要它能用。
  */
  const hasFiles = dt => !!dt && Array.prototype.includes.call(dt.types || [], 'Files');

  // 拖曳中給整個視窗一個視覺提示,讓人知道放哪裡都可以
  let hintEl = null;
  function showHint(on) {
    if (on && !hintEl) {
      hintEl = document.createElement('div');
      hintEl.id = 'df-drop-hint';
      hintEl.textContent = '放開即可加入影像';
      hintEl.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:99999', 'pointer-events:none',
        'border:3px dashed var(--accent,#4da3ff)', 'border-radius:10px',
        'background:rgba(77,163,255,.07)', 'display:flex',
        'align-items:flex-end', 'justify-content:center', 'padding-bottom:34px',
        'font:600 15px/1.4 system-ui,sans-serif', 'color:var(--accent,#4da3ff)',
        'text-shadow:0 1px 3px rgba(0,0,0,.6)',
      ].join(';');
      document.body.appendChild(hintEl);
    } else if (!on && hintEl) {
      hintEl.remove();
      hintEl = null;
    }
  }

  let dragDepth = 0;

  document.addEventListener('dragenter', e => {
    if (!hasFiles(e.dataTransfer)) return;
    dragDepth++;
    showHint(true);
  });

  document.addEventListener('dragleave', e => {
    if (!hasFiles(e.dataTransfer)) return;
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) showHint(false);
  });

  // 沒有這一條,drop 不會觸發 —— 瀏覽器規定要先擋掉 dragover 的預設行為
  document.addEventListener('dragover', e => {
    if (!hasFiles(e.dataTransfer)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  });

  document.addEventListener('drop', e => {
    if (!hasFiles(e.dataTransfer)) return;
    dragDepth = 0;
    showHint(false);
    // #drop-zone 自己的處理器先跑過了,別再加一次
    if (e.defaultPrevented) return;
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || !files.length) return;
    if (typeof addFiles === 'function') {
      addFiles(files);
    } else if (typeof window.addFiles === 'function') {
      window.addFiles(files);
    }
  });

  /* ── 修正 2:套用內建範本後,上一張圖的逐條間距還留著 ──────────

     症狀:
       勾「Advanced spacing」並把某一條間距改成例如 40px,再按任何一個
       內建範本按鈕(Nature 2×2 等)→ 範本設的 gapH/gapV 對那一條沒有
       作用,40px 照舊;而且「Advanced spacing」還是開著的。

     原因:
       `colGaps`/`rowGaps` 是「第 n 條間距另外指定」的覆寫陣列。繪圖時
       只會把長度截短或補 null:

         if(colGaps){ colGaps.length=Math.max(0,cols-1); … }   (上游 5629 行)

       所以舊陣列會照 index 直接套到新版面的間距上。

       上游自己知道這件事 —— `saveTemplate` 的註解寫著「掉了逐條間距的
       範本會載成另一張圖,舊的覆寫還留著,它自己的間距就沒作用」,
       而 `loadTemplate`(載入自存範本)確實有重設:

         colGaps = …; rowGaps = …; advancedSpacing = !!t.advancedSpacing;

       但 `applyTemplate`(內建那 8 顆按鈕)**沒有**。同一個已知問題,
       兩條路只防了一條。

     做法:
       包裝 applyTemplate:先重設覆寫,再呼叫原本的。不改上游程式。
       牙科範本自己在 dental-templates.js 裡做同一件事。

     為什麼不改 figure_lab.html:見檔頭。這條也值得回報給上游。
  */
  if (typeof window.applyTemplate === 'function') {
    const origApplyTemplate = window.applyTemplate;
    window.applyTemplate = function (name) {
      try {
        // 三個都是頂層 let,classic script 之間用裸名存取得到
        if (typeof colGaps !== 'undefined') colGaps = null;                   // eslint-disable-line no-undef
        if (typeof rowGaps !== 'undefined') rowGaps = null;                   // eslint-disable-line no-undef
        if (typeof advancedSpacing !== 'undefined') advancedSpacing = false;  // eslint-disable-line no-undef
      } catch (e) { /* 上游改了宣告方式就算了,範本仍然套得上去 */ }
      const el = document.getElementById('advanced-spacing');
      if (el) el.checked = false;
      return origApplyTemplate.apply(this, arguments);
    };
  }

  // 給測試與偵錯用
  window.__dfFixes = {
    applied: ['document-wide-file-drop', 'apply-template-resets-gutter-overrides'],
  };
})();
