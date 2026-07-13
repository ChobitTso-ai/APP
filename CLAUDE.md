# NCKUH ENDO · App 中心

純 HTML / CSS / JavaScript 的 App 入口網站，無建置工具。合併到 `main` 後由 GitHub Actions 自動部署到 GitHub Pages（https://chobittso-ai.github.io/APP/）。

## 結構

- `index.html` / `styles.css` / `app.js`：登入畫面與 App 入口首頁
- `apps/<工具名>/index.html`：各個獨立小工具（單檔 HTML）
- `apps/<工具名>/vendor/`：該工具用到的第三方函式庫（本地副本）

## 併入新工具（使用者上傳單檔 HTML 時的標準流程）

1. 複製到 `apps/<工具名>/index.html`，目錄名用英文小寫加連字號。
2. 把 CDN `<script src>` 改成本地 `vendor/` 相對路徑，函式庫下載到 `apps/<工具名>/vendor/`。
   - 雲端環境若被網路政策擋住 CDN（cdnjs 等回 403），從 npm registry 抓：
     `npm pack <套件>@<版本>` 後從 tgz 解出 `package/dist/*.min.js`（UMD 版，與 CDN 檔相同）。
     npm registry 在此環境的允許清單內。
3. 在 `app.js` 的 `APPS` 陣列用新工具取代一個 `{ ...wipSlot }`，並補 README「檔案結構」。
4. 驗證：本機伺服器 + headless Chromium 載入頁面，確認函式庫本地載入成功，例如：
   `python3 -m http.server 8901 & /opt/pw-browsers/chromium --headless --no-sandbox --virtual-time-budget=3000 --enable-logging=stderr --dump-dom http://127.0.0.1:8901/apps/<工具名>/index.html 2>&1 | grep CONSOLE`

## 注意

- 登入只是前端簡單擋人（帳密在 `app.js`），不是安全機制。
- 繁體中文（台灣用語）撰寫 UI 文案、commit 訊息與文件。
