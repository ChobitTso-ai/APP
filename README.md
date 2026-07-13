# NCKUH ENDO · App 中心

**正式網站：https://chobittso-ai.github.io/APP/**（合併到 `main` 後由 GitHub Actions 自動部署）

登入後進入的 App 入口首頁 —— 純 HTML / CSS / JavaScript，不需建置工具。
點卡片開啟各個 App，或按「分享」把連結複製給其他人使用。

## 快速開始

直接用瀏覽器打開 `index.html`，或起一個本機伺服器：

```bash
python3 -m http.server 8000
# 打開 http://localhost:8000
```

## 登入

- 帳號：`NCKUH`
- 密碼：`ENDO`

> 注意：這是前端擋一般人用的簡單驗證，帳密寫在 `app.js` 中，看得到原始碼就看得到帳密。
> 不是真正的安全機制；若要保護敏感資料，需改接後端驗證。

## 新增 / 修改 App

打開 `app.js`，編輯最上面的 `APPS` 陣列即可：

```js
const APPS = [
  { name: 'App 名稱', desc: '一句話說明', icon: '🩸', url: 'https://…' },
  // 再往下加…
];
```

- `url` 填 `#` 時，卡片會顯示「尚未設定連結」。
- 「分享」按鈕會複製該 App 的連結到剪貼簿。

## 併入新工具的標準流程

之前做好的單檔 HTML 小工具，照以下步驟併入 App 中心（案例標記工具、PDF工具箱都是這樣做的）：

1. **建目錄**：工具放到 `apps/<工具名>/index.html`（英文小寫加連字號，例如 `pdf-toolbox`）。
2. **函式庫本地化**：工具若從 CDN 載入函式庫（cdnjs、unpkg 等），下載到 `apps/<工具名>/vendor/`，
   並把 `<script src>` 改成相對路徑（例如 `vendor/pdf-lib.min.js`）。
   這樣 GitHub Pages 部署後不依賴外部 CDN，也不怕 CDN 掛掉或被網路環境封鎖。
   - **若開發環境無法直連 CDN**（例如雲端環境網路政策擋 cdnjs 回 403）：改從 npm registry 抓同一份檔案——
     `npm pack <套件名>@<版本>` 下載官方套件，再從 tgz 解出 `dist/` 裡的 minified 檔（UMD 版），內容與 CDN 相同。
     例：`npm pack pdf-lib@1.17.1` → 解出 `package/dist/pdf-lib.min.js`。
3. **上架**：編輯 `app.js` 的 `APPS` 陣列，用新工具取代一個 `{ ...wipSlot }` 施工中欄位，
   `url` 填 `apps/<工具名>/index.html`。
4. **更新 README**：在下方「檔案結構」補上一行。
5. **驗證**：`python3 -m http.server 8000` 起本機伺服器，開啟工具頁確認函式庫從本地載入成功
   （console 不應出現載入失敗訊息）。

## 風格

現代深色科技感：深藍黑漸層底、玻璃擬態卡片、霓虹藍紫點綴，卡片 hover 發光。

## 檔案結構

```
index.html   登入畫面 + App 入口
styles.css   深色玻璃擬態樣式
app.js       登入驗證、App 清單與卡片、搜尋、分享
apps/        各個 App 的頁面
  case-marker/index.html   案例標記工具（照片標記、裁切、組圖匯出）
  pdf-toolbox/index.html   PDF工具箱（合併與分割，本機處理）
```
