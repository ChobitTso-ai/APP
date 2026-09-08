# 測試（案例標記工具、PDF工具箱）

Playwright 端到端測試。**這些測試是防呆用的：改完 App 後跑一次，
確認沒有把既有功能弄壞。**（以前放在暫存資料夾，容器回收就不見，所以收進 repo。）

## 怎麼跑

```bash
./tests/run.sh              # 全部
./tests/run.sh geo-align    # 只跑某一組（檔名前綴）
```

`run.sh` 會自己起一個本機靜態伺服器（預設 8765，跑完關掉），第一次會自動
`npm install`（只裝 `playwright-core`，約 3MB）。全部通過會印「全部通過 ✅」，
有失敗會回傳非 0 的離開碼。

## 各組測什麼

| 檔案 | 內容 |
|---|---|
| `geo-align.test.js` | v2.3 牙齒對齊：取點座標換算、解出的旋轉／縮放、對齊後解剖點是否重合、四角有沒有白邊、標記換算、復原、不裁切選項、單張照片擋下、重整後持久化 |
| `case-export.test.js` | v2.1 單一病例匯出：只收該病例的照片與組圖專案、meta 的 scope/caseCode、醫師→小編→回傳的接力流程不會重複建病例 |
| `backup-regress.test.js` | 整包備份／還原、遮蔽、病例分組、匯入尺寸設定、儲存空間、復原快照不含 srcData 等核心功能 |
| `new-badges.test.js` | 新功能徽章（出現／用過消失／重整後記得）、提示列、切到背景立刻補寫存檔、`[hidden]` 全域規則 |
| `pdf-toolbox.test.js` | PDF工具箱 v2.2：登入保護、四個分頁切換、頁面縮圖、依範圍選取、旋轉與橫向自動轉正、刪除、擷取、壓縮、頁碼在四種旋轉角度的位置、復原（含堆疊上限）、遮蔽視窗縮放平移、遮蔽框單獨選取與刪除、未套用就關閉會確認、遮蔽頁解析度、圖片拖曳排序、圖片轉 PDF、PDF 轉圖片打包 zip、合併回歸。**最關鍵的三項**：①把遮蔽後的成品用 pdf.js 讀回來檢查文字圖層，確認被遮的字真的從檔案裡消失、沒遮的頁文字仍在；②先遮蔽再旋轉後取樣像素，確認黑塊落在旋轉後的正確位置、原位置沒有殘留；③在放大狀態下用滑鼠實際拖框，確認存下來的相對座標與滑鼠位置吻合 |

## 環境變數

| 變數 | 預設 | 用途 |
|---|---|---|
| `PORT` | `8765` | 本機伺服器的埠 |
| `BASE_URL` | `http://localhost:8765` | 要測的站台（可指到別處） |
| `CHROMIUM_PATH` | 自動尋找 | Chromium 執行檔 |
| `PLAYWRIGHT_BROWSERS_PATH` | `/opt/pw-browsers` | 到哪裡找已安裝的瀏覽器 |

雲端開發環境已預先裝好 Chromium，**不要跑 `playwright install`**。

## 寫新測試時注意（都踩過）

- **判斷有沒有隱藏要看 `getComputedStyle(el).display`**，不能只看 `hidden` 屬性——
  自訂 class 的 `display` 會蓋掉 `[hidden]`。
- **清 IndexedDB 前要先 `idb.close()`**，否則 `deleteDatabase` 會永遠 blocked。
- **匯出預覽**：`#expImg` 會殘留上一張圖，斷言前先 `removeAttribute('src')`
  再等 `naturalWidth > 0`。
- **首頁卡片**要 `click({ force:true })`（有覆蓋層攔 pointer events）。
- **dialog 處理器只掛一個**（`page.on` 與 `page.once` 同時掛會互相搶）；
  要餵 `prompt` 的內容，必須在觸發點擊**之前**準備好。
- **量測效能要在頁面內量**（`page.evaluate` 內部計時），不要量 Playwright 的來回時間。
- 下載檔名在 headless 會是 `download`，不要斷言中文檔名，改驗 zip 內容。
