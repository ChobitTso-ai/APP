/* ===========================================================
   DentFigure — 功能精簡層
   ===========================================================
   與另外兩支分工:
     i18n-zh-TW.js   只改文字
     fixes.js        修上游的 bug
     trim-features.js(本檔)  隱藏牙科用不到的功能

   做法是「隱藏 UI」而不是「刪除程式」。理由:

   1. index.html 是由 make-index.py 從釘選快照產生的,動程式碼等於要在
      產生流程裡做 19,088 行的手術,每次同步上游都要重做一次。
   2. 這些功能的實作與 render / 匯出 / 存檔路徑交織在一起(例如 im.lut
      會進 serializeSession、進 undo 快照、進匯出的 metadata CSV)。
      拔掉實作要改動核心路徑,風險遠大於收益。
   3. 隱藏是可逆的。下面 TRIM 設定裡把某一項改成 false 就回來了。

   代價要講清楚:功能只是看不到,不是不存在。載入舊的存檔檔案時,裡面
   若帶有 LUT 設定,渲染仍會套用——只是介面上沒有地方可以改它。對「給
   科內同仁用、不要被用不到的東西干擾」這個目的,這樣就夠了。
   =========================================================== */
(function () {
  'use strict';

  /* 要精簡掉哪些。改成 false 即可讓該組功能回來。
     決定來源:Dr.Tso 2026-09/10 的臨床判斷。
       保留 流程圖(PRISMA/CONSORT/魚骨圖)——牙科論文常用
       保留 存活曲線(Kaplan–Meier)——植體存活率、根管成功率會用
       刪除 螢光/LUT/明視野——顯微鏡影像才用得到 */
  const TRIM = {
    fluorescence: true,   // 螢光 LUT、通道合併、通道拆列、自動判定通道、明視野預設
  };

  const HIDE_CLASS = 'df-trimmed';

  // [hidden] 會被自訂 class 的 display 蓋掉(CLAUDE.md 記錄過兩次),用 !important
  const style = document.createElement('style');
  style.textContent = `.${HIDE_CLASS}{display:none !important}`;
  document.head.appendChild(style);

  /* 靜態 markup 裡的控制項。用 onclick 屬性當選擇器——它直接寫著函式名,
     比 class 或位置穩定(上游改版時函式名不太會動)。 */
  const SELECTORS = [
    'button[onclick="autoDetectChannels()"]',            // 🎨 自動判定通道
    'button[onclick="applyQuickPreset(\'fluorescence\')"]',  // 🔬 螢光(快速上手預設)
    'button[onclick="applyQuickPreset(\'brightfield\')"]',   // 🔭 明視野(同上)
    'button[data-splitch]',                              // 通道拆成一列
    '.f-add-ch',                                         // ＋加入通道(檔案輸入)
  ];

  /* 每格面板抽屜裡的區塊,由 renderImgList() 動態產生。
     結構是 <div class="sec-lbl">標題</div> 後面跟著該區的控制項,
     直到下一個 .sec-lbl 為止——所以整區一起隱藏。
     比對用原文,因為 i18n 可能已經把它換成中文,也可能還沒。 */
  const SECTIONS = ['Fluorescence LUT', 'Channels (screen blend)', '螢光偽色表'];

  function hide(el) {
    if (el && el.classList && !el.classList.contains(HIDE_CLASS)) el.classList.add(HIDE_CLASS);
  }

  function trimSections(root) {
    const labels = root.querySelectorAll ? root.querySelectorAll('.sec-lbl') : [];
    for (const lbl of labels) {
      const txt = (lbl.textContent || '').replace(/\s+/g, ' ').trim();
      if (!SECTIONS.some(s => txt.startsWith(s))) continue;
      hide(lbl);
      // 隱藏同層後續節點,直到下一個 .sec-lbl
      let n = lbl.nextElementSibling;
      while (n && !n.classList.contains('sec-lbl')) {
        hide(n);
        n = n.nextElementSibling;
      }
    }
  }

  function trim(root) {
    if (!root || !TRIM.fluorescence) return;
    try {
      for (const sel of SELECTORS) {
        if (root.matches && root.matches(sel)) hide(root);
        const found = root.querySelectorAll ? root.querySelectorAll(sel) : [];
        for (const el of found) {
          // .f-add-ch 是藏在按鈕裡的 file input,要隱藏的是外層按鈕
          hide(el.classList.contains('f-add-ch') ? (el.closest('button') || el) : el);
        }
      }
      trimSections(root);
    } catch (e) {
      // 精簡層絕不能弄壞 app:出錯就讓功能留著
      console.warn('[trim] 略過一次:', e && e.message);
    }
  }

  /* 指令面板(⌘K)也要一起拿掉,否則隱藏了按鈕、使用者還是搜得到並執行。
     CMD_REGISTRY 是頂層 const,在 classic script 的全域語彙環境裡,
     同一個 realm 的其他 script 用裸名取得得到(但 window.CMD_REGISTRY 取不到)。 */
  function trimCommands() {
    if (!TRIM.fluorescence) return;
    try {
      if (typeof CMD_REGISTRY === 'undefined' || !Array.isArray(CMD_REGISTRY)) return;
      const drop = /channel|LUT|fluorescence|brightfield|merge into a row|unmix/i;
      let n = 0;
      for (let i = CMD_REGISTRY.length - 1; i >= 0; i--) {
        const c = CMD_REGISTRY[i];
        const hay = `${(c && c.label) || ''} ${(c && c.keys) || ''}`;
        if (drop.test(hay)) { CMD_REGISTRY.splice(i, 1); n++; }
      }
      window.__dfTrim.commandsRemoved = n;
    } catch (e) {
      console.warn('[trim] 指令面板未精簡:', e && e.message);
    }
  }

  window.__dfTrim = { config: TRIM, commandsRemoved: 0, retrim: () => trim(document.body) };

  function start() {
    trim(document.body);
    trimCommands();
    try {
      new MutationObserver(muts => {
        for (const m of muts) {
          for (const node of m.addedNodes) if (node.nodeType === 1) trim(node);
        }
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) {
      console.warn('[trim] MutationObserver 無法啟動:', e && e.message);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
