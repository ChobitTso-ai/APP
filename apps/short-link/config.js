/* 縮網址 —— 後端網址（管理頁 apps/short-link/index.html 與轉址頁 s/index.html 共用這一份）

   縮網址與首頁的使用統計是**同一支 Google Apps Script、同一個試算表**
   （程式碼 docs/stats-backend.gs 的「縮網址」區塊；使用者不想多開試算表），
   所以這裡的網址＝app.js 最上方的 STATS_ENDPOINT，兩邊要一起改。
   設定步驟見 docs/SHORTLINK_SETUP.md。

   試算表那邊若還是舊的純統計程式，回應不會帶 sl 標記：
   管理頁顯示「統計試算表的程式還沒更新」、轉址頁顯示「服務尚未啟用」，不會壞。 */
window.SHORTLINK_ENDPOINT = 'https://script.google.com/macros/s/AKfycbz0Tsxy73JrOXF9WSDmn7Q4GxEyceCnpFPOnDO0DF8rVGrJOATZDWflvQkJhu_jIsQ/exec';
