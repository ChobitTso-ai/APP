/* 縮網址 —— 後端網址（管理頁 apps/short-link/index.html 與轉址頁 s/index.html 共用這一份）

   後端是掛在使用者自己 Google 帳號下的 Apps Script（程式碼：docs/shortlink-backend.gs），
   短網址與點擊次數存在使用者自己的 Google 試算表。部署步驟見 docs/SHORTLINK_SETUP.md。

   ⬇⬇⬇ 部署好 Apps Script 後，把 /exec 網址填進下面的引號裡 ⬇⬇⬇
   （留空 = 還沒設定：管理頁會顯示設定說明，轉址頁會顯示「服務尚未設定」） */
window.SHORTLINK_ENDPOINT = '';
