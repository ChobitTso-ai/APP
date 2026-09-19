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

  // 給測試與偵錯用
  window.__dfFixes = { applied: ['document-wide-file-drop'] };
})();
