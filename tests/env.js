/* 測試共用環境設定
   · 網址：預設 http://localhost:8765（run.sh 會起本機伺服器），可用 BASE_URL 覆蓋
   · Chromium：優先用 CHROMIUM_PATH，其次在 PLAYWRIGHT_BROWSERS_PATH（預設
     /opt/pw-browsers）底下找已安裝的 chromium，都找不到就交給 playwright 自己找。
     不要跑 `playwright install`——雲端環境已預先裝好。
   · 產出（截圖、下載的 zip）放 tests/out/，不進版控。 */
const fs = require("fs"), path = require("path");

const BASE = process.env.BASE_URL || "http://localhost:8765";

function chromePath(){
  if(process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  let dirs = [];
  try{ dirs = fs.readdirSync(root).filter(d => /^chromium(-\d+)?$/.test(d)).sort().reverse(); }catch(e){}
  const rel = [
    "chrome-linux/chrome",
    "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
    "chrome-win/chrome.exe"
  ];
  for(const d of dirs) for(const r of rel){
    const p = path.join(root, d, r);
    if(fs.existsSync(p)) return p;
  }
  return undefined;                 // undefined → playwright 用自己下載的那份
}

const OUT = path.join(__dirname, "out");
fs.mkdirSync(OUT, { recursive: true });

module.exports = {
  BASE,
  URL: BASE + "/apps/case-marker/index.html",
  LOGIN: BASE + "/index.html",
  chromePath,
  OUT
};
