# NCKUH ENDO · App 中心

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

## 風格

現代深色科技感：深藍黑漸層底、玻璃擬態卡片、霓虹藍紫點綴，卡片 hover 發光。

## 檔案結構

```
index.html   登入畫面 + App 入口
styles.css   深色玻璃擬態樣式
app.js       登入驗證、App 清單與卡片、搜尋、分享
```
