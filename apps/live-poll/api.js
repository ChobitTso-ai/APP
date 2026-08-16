/* =========================================================
   即時投票 —— 後端連線（主持端 index.html 與觀眾端 join.html 共用）

   後端是掛在使用者自己 Google 帳號下的 Apps Script（程式碼：docs/voting-backend.gs），
   資料存在使用者自己的 Google 試算表。部署步驟見 docs/VOTING_SETUP.md。

   一律用 JSONP（<script> 標籤）呼叫，理由：
   - 首頁的統計功能已經用同一套模式跑很久，確定可行
   - 不必處理 CORS 預檢，Apps Script 的重新導向也不會出問題
   題目 JSON 可能塞不進網址，所以太長時先切塊上傳（action=up）再送正式請求。
   ========================================================= */

/* ⬇⬇⬇ 部署好 Apps Script 後，把 /exec 網址填進這裡 ⬇⬇⬇ */
const POLL_ENDPOINT = '';

const ENDPOINT_OVERRIDE_KEY = 'lp_endpoint_override';

/** 實際要用的後端網址：程式碼裡的常數優先，其次才是主持端暫時填的測試網址。 */
function pollEndpoint() {
  if (POLL_ENDPOINT) return POLL_ENDPOINT;
  try { return localStorage.getItem(ENDPOINT_OVERRIDE_KEY) || ''; } catch (e) { return ''; }
}

/** 只有主持人自己暫時填了網址、程式碼裡卻還沒填——這種狀態觀眾端會連不上，要提醒。 */
function endpointIsTemporary() {
  return !POLL_ENDPOINT && !!pollEndpoint();
}

/** 一次 JSONP 呼叫。後端回 { error: '...' } 時轉成 reject。 */
function jsonp(params, timeoutMs) {
  return new Promise(function (resolve, reject) {
    const url = pollEndpoint();
    if (!url) { reject(new Error('尚未設定投票後端網址')); return; }

    const cb = 'lpcb_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    const script = document.createElement('script');
    let done = false;

    const timer = setTimeout(function () {
      finish(function () { reject(new Error('連線逾時，請確認網路與後端網址')); });
    }, timeoutMs || 25000);

    function finish(fn) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { delete window[cb]; } catch (e) { window[cb] = undefined; }
      if (script.parentNode) script.parentNode.removeChild(script);
      fn();
    }

    window[cb] = function (data) {
      finish(function () {
        if (data && data.error) reject(new Error(data.error));
        else resolve(data || {});
      });
    };
    script.onerror = function () {
      finish(function () { reject(new Error('連不上投票後端，請確認網址與部署設定')); });
    };

    const q = new URLSearchParams();
    Object.keys(params).forEach(function (k) {
      if (params[k] !== undefined && params[k] !== null) q.set(k, params[k]);
    });
    q.set('callback', cb);
    script.src = url + '?' + q.toString();
    document.head.appendChild(script);
  });
}

/**
 * 送出一次請求。payload 會序列化成 JSON：
 * 短的直接放在網址參數 p，長的先切塊上傳再以 up/upn 引用。
 */
async function apiSend(action, payload, extra) {
  const raw = JSON.stringify(payload || {});
  const params = Object.assign({ action: action }, extra || {});

  // 網址長度保守抓 1500（中文一個字編碼後是 9 個字元，很快就爆）
  if (encodeURIComponent(raw).length < 1500) {
    params.p = raw;
    return jsonp(params);
  }

  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const CHUNK = 1200;
  const parts = [];
  for (let i = 0; i < raw.length; i += CHUNK) parts.push(raw.slice(i, i + CHUNK));
  for (let i = 0; i < parts.length; i++) {
    await jsonp({ action: 'up', id: id, i: i, d: parts[i] });
  }
  params.up = id;
  params.upn = parts.length;
  return jsonp(params);
}

/** 純讀取的請求（參數少，直接走網址）。 */
function apiGet(action, extra) {
  return jsonp(Object.assign({ action: action }, extra || {}));
}
