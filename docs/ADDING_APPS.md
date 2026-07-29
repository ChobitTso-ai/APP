# App 中心建構模式與上架規則

這份文件是本專案的**正式運作模式**。任何人（或任何 Claude 對話）要把一個 App
加進 App 中心，照這份文件做就能順利上線。

## 零、整體架構（先看懂再動手）

```
使用者 → https://chobittso-ai.github.io/APP/
              │ 登入（NCKUH / ENDO，前端擋一般人）
              ▼
         首頁（App 入口）── index.html + styles.css + app.js
              │ 點卡片「開啟」（新分頁）／「分享」（複製連結）
              ▼
         各個 App ── apps/<代號>/index.html（每個 App 一個資料夾）
```

- **首頁只做一件事**：登入 + 陳列 App 卡片。App 本體一律放 `apps/` 底下。
- **卡片清單**只有一個來源：`app.js` 最上面的 `APPS` 陣列。
- **部署全自動**：合併進 `main` → GitHub Actions 部署 Pages → 網站更新。
  沒有其他上線途徑，也不需要手動部署。

## 壹、PR 分批進入模式（開發流程）

每個 App 獨立開發、獨立進版，彼此不互相卡住：

1. **一個 App＝一個分支＝一個 PR**。從最新 `main` 開分支：
   `git checkout -b app/<代號> origin/main`
2. PR 內容只含：`apps/<代號>/` 的檔案 + `app.js` 登記卡片（+ 必要時 README 一行）。
   **不要在同一個 PR 裡動首頁樣式或其他 App**。
3. Push 後開 draft PR 到 `main`，描述寫清楚 App 用途與驗證方式。
4. 開發期間 `main` 若前進，自己 rebase / merge main 解衝突（衝突幾乎都在
   `APPS` 陣列——保留別人的卡片，把自己的卡片加上去即可）。
5. 審核合併進 `main` → 自動部署 → **合併即上架**。

首頁本身的調整（樣式、文案、功能）也走同樣模式：一個主題一個 PR。

## 貳、檔案放哪

每個 App 一個資料夾，放在 `apps/` 底下，入口一律叫 `index.html`：

```
apps/
  你的-app-代號/        ← 全小寫英文與連字號，例如 case-marker
    index.html          ← App 入口（必要）
    style.css           ← 其他資源放同資料夾，用相對路徑引用
    script.js
```

規則：

1. **自給自足**：App 只能引用自己資料夾內的檔案，不可引用外部 CDN（離線也要能開）。
2. **不要動根目錄**：`index.html`、`styles.css`、`app.js`（首頁三檔）只有「登記卡片」時才改 `app.js`，其他一律不碰。
3. **響應式**：手機直向要能正常使用。

## 參、接上首頁（登記卡片）

打開根目錄 `app.js`，找到 `APPS` 陣列，**把一格施工中佔位換成你的 App**：

```js
// 把其中一個 { ...wipSlot } 換成：
{ name: 'App 名稱', desc: '一句話說明（20 字內）', icon: '🦷', url: 'apps/你的-app-代號/index.html', added: '2026-07-29', group: 'desktop' },
```

- `icon`：一個 emoji。
- `url`：一律用相對路徑，直接指到 `apps/<代號>/index.html`。不要寫絕對網址。
- 佔位格不夠用就直接在陣列尾端加新物件；佔位格太多可以刪。
- 換掉佔位格（沒有 `wip` 旗標）後，卡片自動出現「開啟／分享」按鈕。
- `added`：**首次**上架日期（第一次進 App 中心的那天）。最新上架的 App 會自動掛
  **🆕 新上架**（60 天後自動消失）。
  ⚠️ **改版時絕對不要動 `added`**——改了會讓 🆕 跳到舊 App 上，語意就錯了。
- `updated`：最後改版日期。**App 出新版時把它改成當天**，卡片會掛
  **🔄 已更新**（14 天後自動消失）。第一次上架可以不填。
  同時符合 🆕 與 🔄 時只顯示 🆕。
- 瀏覽次數最高的 App 會自動掛 🔥，不用手動指定。
- `group`：卡片放哪一區。
  - `'mobile'`（📱 手機也能用）——**只有做成 PWA 的 App 才放這區**
    （自己有 `manifest.webmanifest` + `sw.js`，手機能「加入主畫面」）
  - `'desktop'`（💻 電腦操作）——其餘工具，沒填時的預設值
  - 兩區各補「施工中」佔位卡片湊成 4 張（桌機剛好一排）；新 App 上架時
    換掉自己那區的一格佔位即可。

## 肆、登入保護（必要）

首頁的登入只擋「首頁」，直接輸入 App 網址會繞過登入。
所以每個 App 的 `index.html` 都要在 `<head>` 最前面加這一行（原樣複製即可）：

```html
<script>if(localStorage.getItem('nckuh_endo_authed')!=='1')location.replace('../../');</script>
```

未登入的人打開 App 會被送回登入頁；在首頁登入過的人直接使用。
這與首頁相同，是「擋一般人」等級的保護，不是資安等級。

> 注意是 `localStorage`，不是 `sessionStorage`——首頁用新分頁開 App，
> `sessionStorage` 帶不過去，會把登入過的人誤擋。

## 伍、風格（建議，不強制）

首頁是深色玻璃擬態風。App 內部風格不強制一致，但建議至少：

- 深色底（可直接沿用首頁的變數值：背景 `#0a0e1a`、文字 `#eaf0ff`、主色 `#5b8cff`）
- 左上角放一個「← 回 App 中心」連結，指向 `../../`

## 陸、合併前檢查清單

- [ ] `apps/<代號>/index.html` 存在，檔案自給自足、無外部 CDN
- [ ] `app.js` 的 `APPS` 已登記，`url` 為 `apps/<代號>/index.html` 相對路徑
- [ ] `index.html` 開頭有登入保護 script（`localStorage` 版）
- [ ] 手機寬度（375px）版面不破
- [ ] 從首頁點「開啟」能進入 App、點「分享」能複製連結
- [ ] PR 只含這一個 App 的變更
- [ ] **改版時**：`app.js` 該 App 的 `updated` 已改成今天（`added` 保持不動）
