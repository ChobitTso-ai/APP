# CLAUDE.md — App 中心開發交接說明

這個 repo 是「NCKUH ENDO · App 中心」：一個純靜態（HTML/CSS/JS，無建置工具）的
App 入口網站，正式站台部署在 **https://chobittso-ai.github.io/APP/**。
使用者（Tso KY）會陸續把單檔網頁型工具交給你併入這個 App 中心，
以下是已驗證可行的完整流程，照做即可。
**上架的完整規則（含檢查清單）另見 `docs/ADDING_APPS.md`，兩份文件互相對照。**

## 架構速覽

```
index.html      登入畫面 + App 入口（帳號 NCKUH / 密碼 ENDO，前端簡易驗證）
styles.css      深色玻璃擬態樣式
app.js          APPS 清單（卡片）、登入、搜尋、分享
assets/         LOGO（TS 標誌）與 favicon
apps/<slug>/    各個 App，一個資料夾一個 App，入口一律 index.html
  vendor/       該 App 用到的第三方函式庫（本地檔案，不用 CDN）
docs/ADDING_APPS.md           App 上架規則（檢查清單版）
.github/workflows/pages.yml   合併到 main 自動部署 GitHub Pages
```

- 首頁卡片由 `app.js` 最上方的 `APPS` 陣列產生。佔位卡片是 `{ ...wipSlot }`
  （🚧 施工中）；真正的 App 卡片格式：
  `{ name:'工具名', desc:'一句話說明', icon:'📷', url:'apps/<slug>/index.html' }`
- **登入狀態存 `localStorage`（key：`nckuh_endo_authed`，值 `'1'`）——
  不能改用 `sessionStorage`：首頁以 `noopener` 新分頁開 App，
  `sessionStorage` 帶不過去，會把登入過的人誤擋。**
- 已上線 App：`apps/case-marker/`（案例標記工具 v1.2：IndexedDB 自動保存、
  復原、HEIC 轉檔、雙指縮放、常用標籤庫、組圖、浮水印、批次匯出 zip）、
  `apps/pdf-toolbox/`（PDF工具箱：合併與分割，pdf-lib 本地 vendor）。

## 併入新網頁工具的標準流程

1. **放檔案**：使用者給的單檔 HTML 原樣放到 `apps/<英文-slug>/index.html`
   （slug 用小寫英文加連字號）。若工具需要第三方函式庫，用 `npm pack <pkg>`
   抓下來放 `apps/<slug>/vendor/`，並在程式裡「首次使用才動態注入 <script>」
   延遲載入（參考 case-marker 的 `loadHeic()` / `loadFflate()`），不要用 CDN。
2. **加登入保護（必要，別漏）**：工具頁 `<head>` 最前面加這一行，
   未登入直開網址會被導回登入頁：
   ```html
   <script>if(localStorage.getItem('nckuh_endo_authed')!=='1')location.replace('../../');</script>
   ```
3. **上卡片**：在 `app.js` 的 `APPS` 陣列，把第一個 `{ ...wipSlot }` 換成
   真卡片（真 App 在前、施工中在後）；沒有佔位了就直接往前插。
4. **改 README**：檔案結構區塊補一行新 App 的說明。
5. **本機驗證**（一定要做）：
   - `python3 -m http.server 8765 --directory <repo根目錄> &`
   - 用 playwright-core（scratchpad `npm install playwright-core`，
     Chromium 執行檔在 `/opt/pw-browsers/chromium-*/chrome-linux/chrome`，
     不要跑 `playwright install`）寫腳本：登入 → 點卡片 → 確認新分頁開到
     工具頁、標題正確，再對工具本身做基本操作測試並截圖。
   - 順帶驗證登入保護：未登入直開工具頁網址，應被導回登入頁。
6. **提交**：在指定的 `claude/...` 工作分支 commit → push → 開 draft PR →
   轉 ready → 合併進 main。合併會自動觸發 `pages.yml` 部署，約 1 分鐘生效。
   若 PR 顯示衝突，通常是 main 又動過 `app.js`：fetch main 合併回來、
   手動解 `APPS` 陣列那段即可（原則：保留彼此的卡片）。
7. **確認部署**：用 GitHub Actions API 查 `pages.yml` 最新一次 run 是否
   `success`，並抓 main 上的檔案內容確認版本。

## 這個環境的已知陷阱（都踩過）

- **容器代理擋 github.io**：無法從這個環境直接開正式站台（curl/WebFetch 都
  403），線上驗證以「部署 run success ＋ main 檔案內容正確」為準。
- **容器代理也擋 CDN**（cdnjs.cloudflare.com 等回 403）：函式庫改從 npm
  registry 抓（在允許清單內）——`npm pack <套件>@<版本>` 後從 tgz 解出
  `package/dist/*.min.js`（UMD 版，與 CDN 檔內容相同）放進 vendor/。
- **Playwright 點首頁卡片**要用 `card.click({ force:true })`（卡片有覆蓋層
  攔截 pointer events）；`window.open` 帶 `noopener`，等新分頁要監聽
  context 的 `page` 事件而不是 `popup`。
- **pkill 會殺到自己**：Bash 指令字串若含被 pkill 比對的關鍵字，整個 shell
  會被殺（exit 144）。pkill 要單獨執行、且比對字串不要出現在同一條指令。
- **測試前清 IndexedDB**：頁面本身持有連線時 `indexedDB.deleteDatabase` 會
  永遠 blocked——先 `idb.close()`（case-marker 的全域連線變數叫 `idb`）
  再刪，並同時掛 `onblocked`。
- **匯出預覽斷言**：`#expImg` 會殘留上一張圖，斷言尺寸前先
  `removeAttribute('src')` 再等 `naturalWidth > 0`。
- **Pages 是 workflow 部署**（Source = GitHub Actions，使用者已在網頁設定
  過一次）。Actions 的 token 不能建立 Pages 站台也不能 workflow_dispatch
  （403 Resource not accessible），要重跑部署就往 main 合一個 commit。
- **對話貼圖拿不到檔案**：使用者貼在對話裡的圖片不會落地成檔案；需要原始
  圖檔時請使用者用 GitHub 網頁「Add file → Upload files」傳進 repo。

## 慣例

- 全站介面文字用繁體中文；工具頁保留原作者的版權宣告
  （©Tso KY - All Rights Reserved），功能改版時把版本號 +0.1
  （標題、徽章、頁尾、程式註解四處同步）。
- 使用者偏好直接合併上線（會說「合併吧」）；夜間自主工作時先用
  Playwright 完整測過再合併，並在總結時交代測了什麼。
- 首頁（登入、卡片版型、LOGO、樣式）的調整由「首頁對話」負責，
  App 對話只動自己 `apps/<slug>/` 的檔案＋`APPS` 卡片登記，避免互踩。
