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
assets/         LOGO（TS 標誌）、favicon、PWA 圖示
manifest.webmanifest / sw.js   首頁 PWA（可加入主畫面、離線開得起來）
apps/<slug>/    各個 App，一個資料夾一個 App，入口一律 index.html
  vendor/       該 App 用到的第三方函式庫（本地檔案，不用 CDN）
tests/          案例標記工具端到端測試（`./tests/run.sh` 一次跑完）
docs/ADDING_APPS.md           App 上架規則（檢查清單版）
docs/STATS_SETUP.md           使用統計設定步驟；後端程式碼 docs/stats-backend.gs
.github/workflows/pages.yml   合併到 main 自動部署 GitHub Pages
```

- 首頁卡片由 `app.js` 最上方的 `APPS` 陣列產生。佔位卡片是 `{ ...wipSlot }`
  （🚧 施工中）；真正的 App 卡片格式：
  `{ name:'工具名', desc:'一句話說明', icon:'📷', url:'apps/<slug>/index.html', added:'YYYY-MM-DD', updated:'YYYY-MM-DD' }`
  （`added` 是**首次**上架日，最新的自動掛 🆕〔60 天內〕，**改版時不要動它**；
  `updated` 是最後改版日，改版時填今天，自動掛 🔄〔14 天內〕，🆕 優先於 🔄；
  瀏覽次數最高的自動掛 🔥）
- **卡片分兩區**（`GROUPS`）：`group:'mobile'` 是「📱 手機也能用」——只放
  自己做成 PWA 的 App；`group:'desktop'` 是「💻 電腦操作」（預設）。
  每區用施工中佔位補滿 4 張，桌機剛好一排。
- **登入狀態存 `localStorage`（key：`nckuh_endo_authed`，值 `'1'`）——
  不能改用 `sessionStorage`：首頁以 `noopener` 新分頁開 App，
  `sessionStorage` 帶不過去，會把登入過的人誤擋。**
- 已上線 App：`apps/case-marker/`（案例標記工具 v1.5：IndexedDB 自動保存、
  復原、HEIC 轉檔、雙指縮放、常用標籤庫、文字方塊、調色盤、組圖、浮水印、
  乾淨版匯出、批次匯出 zip、PPTX 投影片匯出；v1.4 組圖進階版面
  〔欄數／間距／背景色／標題位置與字級〕、每格取景焦點拖曳、組圖專案
  儲存與載入〔IndexedDB projects store，DB 升到 v2〕；v1.5 圖層順序
  〔帶到最前／送到最後〕、拉平〔任意角度微調旋轉並外擴補白〕、
  Logo／簽名圖片浮水印〔設定內上傳，位置／大小／透明度可調，
  縮到長邊 400 存 localStorage〕；v1.6 PWA〔manifest.webmanifest、
  sw.js〔network-first，離線可用〕、icon-192/512、apple-touch-icon，
  可加入主畫面像 App〕；v1.7 色彩對齊〔選基準照＋在兩張照片點對應同色處，
  1 點＝von Kries 對角白平衡、2 點＝每通道線性 out=a·in+b 併修曝光，
  以 LUT 逐像素套用；幾何不變故標記座標不受影響〕；v1.8 整包備份／還原
  〔zip：backup.json＋photos/*.jpg，含標記／標題／取景／組圖專案／設定；
  還原採「附加」不覆蓋既有照片，照片 id 重新配發〕、遮蔽工具
  〔拖框套用馬賽克或模糊，弱／中／強，可連續遮多處、可復原〕、
  加入照片時以 canvas 重新編碼移除 EXIF／GPS 中繼資料；v1.9 病例分組
  〔IndexedDB cases store，DB 升到 v3；**刻意採代號制，只有 code／note，
  不設姓名與病歷號欄位**——資料全在本機，外流也無法直接識別病患；
  病例列篩選、多選指定、新照片自動歸入目前病例、刪除病例不刪照片、
  備份／還原含病例且以代號比對避免重複；組圖分頁同步有病例篩選與徽章；
  caseId 指向已刪除病例時視為「未分類」避免照片半隱形；v2.0 匯入縮圖
  〔settings.importMax 預設長邊 2560，12MP 匯入 5.5s→0.4s、體積約 1/4；
  可選原尺寸〕、儲存空間顯示與 70% 起警示、**存檔失敗一定提示且可點徽章重試**
  〔idbPut 接 onerror/onabort/oncomplete，只有確認成功才清 needSave，
  失敗會保留待存標記下次重試——先前呼叫後就清掉，失敗即永久遺失〕、
  復原快照不存 srcData〔改用 bmpToDataUrl 於復原時重建，單張省上百 MB〕、
  病例備註顯示、照片庫拖曳排序〔監聽掛 document，拖曳中不重建 DOM〕；
  v2.1 單一病例匯出〔buildArchive({caseId}) 共用備份邏輯，只收該病例的照片、
  該病例本身與「照片全屬該病例」的組圖專案；meta 帶 scope/caseCode。
  匯入沿用既有「📥 還原」——格式相同、以代號比對故不會重複建病例，
  可支援醫師標記→小編後製→回傳的接力協作〕；v2.2 新功能徽章
  〔NEW_FEATURES 清單＋NEW_SINCE 門檻；近期新增的功能按鈕掛紅色「新」，
  點過即永久消失〔localStorage cm_seen_new〕，另有可關閉的提示列列出未用過的
  新功能——因為有些按鈕平常隱藏（如匯出此病例要選定病例才出現）。
  **加新功能時記得在 NEW_FEATURES 補一筆並調整 NEW_SINCE。**〕、
  切到背景／離開頁面時立刻補寫存檔〔visibilitychange＋pagehide → flushNow；
  自動存檔原本延遲 400ms，來不及寫就切走會遺失〕；v2.3 牙齒對齊
  〔在基準照與目標照上各點**同兩個解剖標記**（例如左右犬齒尖），由兩組對應點
  解出相似變換〔旋轉＋等比縮放＋平移〕重繪目標照，再以直方圖法求「完全落在
  有效影像內的最大矩形」自動裁掉旋轉留下的白邊；可選基準照一併裁成同框，
  兩張各自都能復原。幾何改變故標記座標一併換算〔遮罩外的標記捨棄〕。
  **刻意不做全自動特徵比對**〔要載 8MB WASM、口內照可靠度低、醫師本來就
  想自己指定標記〕；只能修旋轉／大小／位置，不同角度拍攝的透視差異修不了，
  UI 有明講〕；v2.4 取景焦點換算〔**修既有 bug**：幾何一改（裁切／旋轉／拉平／
  牙齒對齊），`state.colFocus` 還停在舊座標，組圖會框到別的地方。新增
  `remapFocus(id, fn)`，四個地方都接上，落在新畫面外就取消焦點回到置中〕、
  取點放大鏡〔取點畫布在手機上只有 ~290px 寬，手指移動 1px ≈ 原圖 8.7px 又會
  擋住目標；改成「按住→拖曳微調→放開才落點」，旁邊顯示 132px 圓形放大鏡
  〔`attachPicker()` 共用，色彩對齊與牙齒對齊四個取點畫布都套用；
  取點畫布要設 `touch-action:none` 否則拖曳會捲動視窗〕〕〕。
  **多人即時協作需要後端、
  病患照片會離開裝置，屬不同風險層級，未做；要做需先確認主機、資料落點與資安審查。**
  透視校正經評估暫緩
  〔工程大、臨床用途邊際、手機拖四角體驗差〕，如日後要做再單獨一批）、
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
   - **既有測試先跑過**：`./tests/run.sh`（會自己起本機伺服器、第一次自動
     `npm install`）。案例標記工具的四組端到端測試在 `tests/*.test.js`，
     改完一定要全綠再送出；新功能請在 `tests/` 補一組，寫法與陷阱見
     `tests/README.md`。
   - 新 App 另外寫腳本：登入 → 點卡片 → 確認新分頁開到工具頁、標題正確，
     再對工具本身做基本操作測試並截圖。
     （Chromium 執行檔在 `/opt/pw-browsers/chromium-*/chrome-linux/chrome`，
     不要跑 `playwright install`。）
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
- **`[hidden]` 會被自訂 class 的 display 蓋掉**（`.btn{display:inline-flex}`、
  `.new-hint{display:flex}` 都踩過兩次）：案例標記工具已加全域
  `[hidden]{display:none !important;}` 根絕；新專案要留意同一陷阱。
  驗證時要看 `getComputedStyle(el).display`，不能只看有沒有 hidden 屬性。
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
  （標題、徽章、頁尾、程式註解四處同步），並把 `app.js` 中該 App 的
  `updated` 改成當天（`added` 不動）。
- 使用者偏好直接合併上線（會說「合併吧」）；夜間自主工作時先用
  Playwright 完整測過再合併，並在總結時交代測了什麼。
- **使用統計**：首頁以 JSONP 呼叫 Google Apps Script（`app.js` 最上方的
  `STATS_ENDPOINT`），計數存在使用者自己的 Google 試算表；留空即停用，
  失敗一律靜默降級不影響網站。後端程式碼與步驟見 `docs/`。
  **公開／私有分界**：首頁只顯示「造訪人次」與各 App 的「瀏覽次數」；
  不重複訪客與登入次數只在試算表後台看得到。
- 首頁（登入、卡片版型、LOGO、樣式）的調整由「首頁對話」負責，
  App 對話只動自己 `apps/<slug>/` 的檔案＋`APPS` 卡片登記，避免互踩。
