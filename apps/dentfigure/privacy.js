/* ===========================================================
   DentFigure — 本機資料透明化層(M1)
   ===========================================================
   四層分工:
     i18n-zh-TW.js     只改文字
     fixes.js          修上游的 bug
     trim-features.js  隱藏用不到的功能
     privacy.js(本檔)  讓「這台電腦存了什麼」看得見、說得清、清得掉

   ── 為什麼需要這一層 ──────────────────────────────────

   上游有三層儲存,全部預設把影像像素寫進去,而且使用者看不到:

     自動存檔   localStorage  每次變動後 2.5 秒 / 每 30 秒 / 關頁面前
     具名專案   IndexedDB     按「存入範本庫」時
     下載存檔   使用者的硬碟   按「儲存」時,預設含影像

   關鍵在 localStorage 與 IndexedDB **關掉瀏覽器不會清、重開機也還在**。

   實測過的情境(診間共用電腦):
     醫師甲做完病例關掉分頁 → fl-autosave-v2 留下 74,898 bytes,含 2 張影像
     醫師乙開同一個網址     → 浮出「↺ Recover unsaved session from …?」
     按下 Restore           → 取回醫師甲的病患影像

   這不是網路外洩(影像從沒上傳過),是**裝置殘留 + 多人共用**。

   ── 這一層做什麼 ─────────────────────────────────────

   不禁止儲存——病例本來就不會一次做完。重點是讓殘留不再隱形:

     1. 存檔區常駐面板:本機目前存了幾張影像、多大,一句話講明存在哪
     2. 一鍵清除本機資料(保留登入狀態與佈景偏好)
     3. 存檔時明確告知:下載的檔案本身含病患影像 / 範本庫存在這台電腦
     4. 復原提示列加警告:這可能是前一位使用者留下的

   做法一律是「包裝上游函式 + 加 UI」,不改 figure_lab.html——
   index.html 由 make-index.py 從釘選快照產生,動原始碼每次同步都要重做。
   =========================================================== */
(function () {
  'use strict';

  const LS_AUTOSAVE = 'fl-autosave-v2';

  /* 清除時保留哪些。判準是「這是顯示偏好,還是資料」。
     保留:純偏好,換人用也無妨,清掉只是徒增麻煩(佈景會跳回預設、
           導覽會再跑一次、登入會被踢掉)。
     清除:工作內容、個人資訊與憑證——
       fl-autosave-v2  未存檔的版面,含病患影像(這一層存在的主因)
       fl-user-name    使用者自己的名字,會被寫進圖說;共用電腦上
                       不該留給下一個人,否則可能掛錯署名
       fl-gemini-key   API 金鑰。AI 路徑雖已在 trim-features.js 隱藏,
                       但若曾設定過就該能清掉
     名單外的 fl-* 一律當成資料清除——寧可多清,不要漏掉未知的新鍵。 */
  const LS_KEEP = [
    'nckuh_endo_authed',                                   // 登入狀態
    'fl-theme', 'fl-bg-anim',                              // 外觀
    'fl-seen-version', 'fl-hints-seen', 'fl-tour-done', 'fl-paint-notice',  // 提示已讀
    'fl-autosave-enabled', 'fl-precrop-import',            // 功能開關
    'fl-ai-backend', 'fl-ai-model', 'fl-ai-size', 'fl-ai-aspect',  // AI 選項(已隱藏)
  ];

  const fmtMB = b => b < 1024 ? b + ' B'
    : b < 1024 * 1024 ? (b / 1024).toFixed(0) + ' KB'
    : (b / 1024 / 1024).toFixed(1) + ' MB';

  /* ── 量一下本機到底存了什麼 ───────────────────────── */
  // 只算「會被清除的資料」。刻意保留的偏好(佈景、登入狀態)不計入——
  // 否則清除後面板還顯示「約 10 B」,看起來像沒清乾淨。
  async function survey() {
    let lsBytes = 0, lsImgs = 0, hasAutosave = false;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !/^fl-/.test(k) || LS_KEEP.includes(k)) continue;
        const v = localStorage.getItem(k) || '';
        lsBytes += v.length;
        const n = (v.match(/data:image\//g) || []).length;
        lsImgs += n;
        if (k === LS_AUTOSAVE && n > 0) hasAutosave = true;
      }
    } catch (e) { /* 私密視窗等情況讀不到,當作沒有 */ }

    let dbCount = 0, dbBytes = 0, dbImgs = 0;
    try {
      if (typeof _dbAll === 'function') {
        const all = await _dbAll();
        dbCount = all.length;
        for (const rec of all) {
          const s = JSON.stringify(rec.data || {});
          dbBytes += s.length;
          dbImgs += (s.match(/data:image\//g) || []).length;
        }
      }
    } catch (e) { /* 讀不到就當作 0,不要讓面板壞掉 */ }

    return { lsBytes, lsImgs, hasAutosave, dbCount, dbBytes, dbImgs,
             bytes: lsBytes + dbBytes, imgs: lsImgs + dbImgs };
  }

  /* ── 清除 ─────────────────────────────────────────── */
  async function clearLocal() {
    let lsRemoved = 0, dbRemoved = 0;
    try {
      const kill = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && /^fl-/.test(k) && !LS_KEEP.includes(k)) kill.push(k);
      }
      for (const k of kill) { localStorage.removeItem(k); lsRemoved++; }
    } catch (e) { /* 清不掉就回報 0,下面的 survey 會顯示實情 */ }
    try {
      if (typeof _dbAll === 'function' && typeof _dbDel === 'function') {
        const all = await _dbAll();
        for (const rec of all) { await _dbDel(rec.id); dbRemoved++; }
      }
    } catch (e) { /* 同上 */ }
    return { lsRemoved, dbRemoved };
  }

  /* ── 存檔區的常駐面板 ─────────────────────────────── */
  let panel = null;

  function buildPanel() {
    // 掛在「Save / load your work」那個 .sec-lbl 底下。privacy.js 在 i18n
    // 之前載入,所以這裡看到的還是原文;保險起見兩種都比對。
    const lbl = [...document.querySelectorAll('.sec-lbl')].find(e => {
      const t = (e.textContent || '').trim();
      return t.startsWith('Save / load your work') || t.startsWith('儲存／載入你的工作');
    });
    if (!lbl || !lbl.parentNode) return null;

    const box = document.createElement('div');
    box.id = 'df-local-data';
    box.style.cssText = [
      'margin:6px 0 8px', 'padding:8px 9px', 'border-radius:6px',
      'border:1px solid var(--border2,#3a4150)', 'background:var(--surf2,#222833)',
      'font-size:10px', 'line-height:1.55', 'color:var(--muted,#9aa4b2)',
    ].join(';');
    box.innerHTML =
      '<div style="font-weight:600;color:var(--text,#dfe5ec);margin-bottom:3px">💾 本機資料</div>' +
      '<div id="df-ld-stat">檢查中…</div>' +
      '<div style="margin-top:4px">這些資料存在<b style="color:var(--text,#dfe5ec)">這台電腦的瀏覽器裡</b>，' +
      '不會上傳到任何地方；但<b style="color:var(--warn,#e0a93a)">關掉瀏覽器也不會自動清除</b>。' +
      '共用電腦請在離開前清除。</div>' +
      '<button id="df-ld-clear" class="btn" style="width:100%;justify-content:center;margin-top:6px;font-size:10px">' +
      '🗑 清除本機資料</button>';

    lbl.parentNode.insertBefore(box, lbl.nextSibling);

    box.querySelector('#df-ld-clear').addEventListener('click', async () => {
      const s = await survey();
      if (!s.bytes) { say('本機沒有需要清除的資料'); return; }
      const msg = `確定清除這台電腦上的 DentFigure 資料？\n\n` +
        `· 自動存檔${s.hasAutosave ? '（含影像）' : ''}\n` +
        `· 已儲存的專案 ${s.dbCount} 個\n` +
        `· 合計約 ${fmtMB(s.bytes)}${s.imgs ? `，含 ${s.imgs} 張影像` : ''}\n\n` +
        `登入狀態與佈景設定會保留。這個動作無法復原。`;
      if (!window.confirm(msg)) return;
      const r = await clearLocal();
      await refresh();
      say(`已清除：localStorage ${r.lsRemoved} 項、已儲存專案 ${r.dbRemoved} 個`, 'ok');
    });
    return box;
  }

  function say(msg, type) {
    if (typeof toast === 'function') toast(msg, type || '');
    else console.log('[privacy]', msg);
  }

  async function refresh() {
    if (!panel) return;
    const el = panel.querySelector('#df-ld-stat');
    if (!el) return;
    const s = await survey();
    if (!s.bytes) {
      el.innerHTML = '<span style="color:var(--ok,#3dd68c)">目前沒有存放任何資料</span>';
      return;
    }
    const bits = [];
    if (s.imgs) bits.push(`<b style="color:var(--warn,#e0a93a)">${s.imgs} 張影像</b>`);
    bits.push(`約 ${fmtMB(s.bytes)}`);
    if (s.dbCount) bits.push(`已儲存專案 ${s.dbCount} 個`);
    el.innerHTML = '目前存放：' + bits.join(' · ');
  }

  /* ── 包裝上游的存檔函式,加上「存在哪裡」的說明 ──────── */
  function wrapSaves() {
    // 下載存檔:bundled 的檔案本身就是病患資料,要先說清楚
    if (typeof window.saveJSON === 'function' && !window.saveJSON.__dfWrapped) {
      const orig = window.saveJSON;
      const wrapped = function (bundleImages) {
        const bundled = bundleImages !== false;
        if (bundled) {
          const n = (typeof images !== 'undefined' ? images.filter(Boolean).length : 0);
          const okGo = window.confirm(
            `這個檔案會把 ${n} 張影像的完整內容一起存進去。\n\n` +
            `也就是說，這個 .json 檔本身就帶有病患影像——` +
            `轉寄、放雲端或存到共用磁碟等同把影像一起送出去。\n\n` +
            `若只是要保留版面設定，請改用「🪶 儲存（僅設定）」。\n\n` +
            `確定要含影像儲存嗎？`);
          if (!okGo) return;
        }
        const r = orig.apply(this, arguments);
        say(bundled ? '已下載到這台電腦（檔案內含影像）' : '已下載到這台電腦（僅設定，不含影像）', 'ok');
        setTimeout(refresh, 300);
        return r;
      };
      wrapped.__dfWrapped = true;
      window.saveJSON = wrapped;
    }

    // 具名專案:存進這台電腦的 IndexedDB
    if (typeof window.saveToLibrary === 'function' && !window.saveToLibrary.__dfWrapped) {
      const orig = window.saveToLibrary;
      const wrapped = function () {
        const r = orig.apply(this, arguments);
        Promise.resolve(r).then(() => {
          say('已存入這台電腦的瀏覽器（不會上傳；共用電腦請記得清除）', 'ok');
          refresh();
        }).catch(() => {});
        return r;
      };
      wrapped.__dfWrapped = true;
      window.saveToLibrary = wrapped;
    }
  }

  /* ── 復原提示列:可能是別人留下的 ───────────────────── */
  function warnRecoveryBar(node) {
    if (!node || node.nodeType !== 1) return;
    const txt = node.textContent || '';
    if (!/Recover unsaved session|復原未儲存/.test(txt)) return;
    if (node.querySelector('.df-recover-warn')) return;
    const span = node.querySelector('span');
    if (!span) return;
    const warn = document.createElement('div');
    warn.className = 'df-recover-warn';
    warn.style.cssText = 'font-size:10px;color:var(--warn,#e0a93a);margin-top:3px;max-width:430px;line-height:1.45';
    warn.textContent = '⚠ 這是這台電腦上次未存檔的內容。若為共用電腦，可能屬於前一位使用者——'
      + '不確定時請選「Dismiss」，並用存檔區的「清除本機資料」清掉。';
    span.appendChild(warn);
  }

  /* ── 啟動 ─────────────────────────────────────────── */
  function start() {
    try {
      panel = buildPanel();
      refresh();
      wrapSaves();
      // 自動存檔每 30 秒寫一次,面板跟著更新才會反映實情
      setInterval(refresh, 30000);
      new MutationObserver(muts => {
        for (const m of muts) for (const n of m.addedNodes) warnRecoveryBar(n);
      }).observe(document.body, { childList: true, subtree: true });
      // 掛載當下提示列可能已經在了
      document.querySelectorAll('div').forEach(warnRecoveryBar);
    } catch (e) {
      // 這一層絕不能弄壞 app
      console.warn('[privacy] 啟動失敗,功能不受影響:', e && e.message);
    }
  }

  window.__dfPrivacy = { survey, clearLocal, refresh, fmtMB };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
