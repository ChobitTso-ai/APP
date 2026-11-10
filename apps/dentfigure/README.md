# DentFigure(開發中)

臨床／牙科影像的期刊圖組版工具,衍生自 [FigureLab](https://github.com/mbaffour/FigureLab)(MIT)。

**已上架**,在 App 中心「💻 電腦操作」區。
網址:`https://chobittso-ai.github.io/APP/apps/dentfigure/index.html`

## 這裡有什麼

| 路徑 | 內容 |
|---|---|
| `index.html` | **App 本體。由 `make-index.py` 從快照產生,不要手改** |
| `i18n-zh-TW.js` | 繁體中文字典與翻譯層 |
| `fixes.js` | 上游 bug 的修正層(拖放匯入、套範本後殘留的逐條間距) |
| `trim-features.js` | 隱藏用不到的功能(螢光／LUT／明視野) |
| `privacy.js` | 本機資料透明化:存了什麼、存在哪、怎麼清 |
| `dental-templates.js` | **牙科範本**:套版面並依序填入每格的階段名稱 |
| `make-index.py` | 從快照產生 `index.html`(四個轉換、掛五個附加層) |
| `LICENSE` | MIT(僅適用本資料夾),並保留上游的著作權聲明 |
| `NOTICE.md` | 上游署名、引用方式、DentFigure 的署名慣例 |
| `THIRD_PARTY_LICENSES.md` | 第三方授權盤點 —— **含 41 個需署名的圖示** |
| `UPSTREAM.md` | 釘選的 commit SHA、基線測試結果、同步政策 |
| `docs/ARCHITECTURE_CURRENT.md` | 上游 11 個子系統拆解、風險登記、「不要動」清單 |
| `docs/MIGRATION_PLAN.md` | 範圍決定與 M0–M3 計畫 |
| `upstream/figurelab/` | **釘選快照,一個字元都不要改** |

## 中文化怎麼運作

上游 33 個 spec 檔中有 **27 個斷言英文 UI 字串**,就地翻譯 `figure_lab.html`
會打爛那 469 筆回歸測試 —— 那是這個專案唯一的安全網。

所以 `index.html` 是「快照 + 四個明確轉換」,中文是執行時由 `i18n-zh-TW.js`
以**完整字串精確比對**替換上去的。與上游的差異只有四行:

```
$ diff upstream/figurelab/figure_lab.html index.html
> <script>if(localStorage.getItem('nckuh_endo_authed')!=='1')location.replace('../../');</script>
< <title>FigureLab</title>
> <title>DentFigure — 臨床影像組版</title>
< if('serviceWorker' in navigator) navigator.serviceWorker.register('figurelab-sw.js')…
> /* DentFigure: service worker 註冊已停用 */
> <script src="i18n-zh-TW.js"></script>
```

改字典之後不必重跑 `make-index.py`;只有換上游版本才需要:

```bash
# 1. 把新版上游檔案放進 upstream/figurelab/  2. 更新 UPSTREAM.md 的 SHA
python3 apps/dentfigure/make-index.py
./tests/run.sh dentfigure
```

### 翻譯的兩條鐵則

**一、只做完整字串精確比對。** 改成子字串替換,使用者輸入的檔名、面板標號、
病例代號會被一起改掉 —— 那是無聲的資料損壞。`tests/dentfigure-i18n.test.js`
有兩項專門驗證這件事。

**二、品牌名與使用者輸入在結構上受保護。** `.logo` 子樹一律不翻。這是踩過的:
字典收了 `'Lab' → '實驗室'`(佈景名稱),結果 logo 變成「Figure實驗室」。
只把字刪掉不夠,下次有人加一個同樣泛用的短字就又中招。

**刻意不翻**:字型名、檔案格式(PNG/TIFF/PDF)、期刊名、色盤名、產品名,
以及上游頁尾的署名與引用連結(見 `NOTICE.md`)。

## 牙科範本

上游的 8 個範本只設格狀幾何(Nature 2×2 之類)。牙科病例圖真正花時間的是
「每一格代表治療過程的哪一步」,而且順序固定,所以 `dental-templates.js`
在套版面的同時**依面板順序填入階段名稱**(填 `tag`,會畫在面板上;
`captionNote` 不會畫出來,只餵圖說產生器,一併帶上)。

| 範本 | 格數 | 階段 |
|---|---|---|
| 根管治療 | 4 | 術前 PA · 工作長度 · 充填後 · 追蹤 |
| 根管治療 | 6 | 術前 PA · 術前臨床照 · 工作長度 · 主牙膠試放 · 充填後 · 追蹤 |
| 再治療 | 4 | 術前 PA · 移除舊充填物 · 充填後 · 追蹤 |
| 根尖手術 | 6 | 術前 PA · 翻瓣 · 根尖切除 · 逆充填 · 縫合 · 追蹤 |
| 再生治療 | 4 | 術前 PA · 根管消毒 · 封填 · 追蹤 |
| 縱向追蹤 | 4 | 術前 · 術後即刻 · 6 個月 · 12 個月 |
| 口內照 | 5 | 正面 · 右側 · 左側 · 上頜咬合面 · 下頜咬合面 |

**階段名稱是草案**:取自牙科病例報告常見的記錄順序,沒有依據任何特定指引,
也尚未經臨床確認。要改就改 `dental-templates.js` 的 `tags` 陣列(一行一個),
單次使用則直接在「影像」清單各面板的 Tag 欄改。

**刻意不做影像辨識**:名稱是依面板順序填的,不是判讀影像內容。與案例標記
工具的標準照模板同一個原則 —— 要靠 ML 模型、需要病患照片訓練驗證,而這個
repo 是公開的;階段或左右側認錯是臨床錯誤。UI 上有寫明由使用者確認。

旁邊的「貼齊(無空隙)／留空隙」是間距快捷,寬度仍可在「排列」裡微調。
兩者都會重設逐條間距覆寫,否則按了不會有反應(見 `fixes.js` 修正 2)。

## 範圍

做:中文化、牙科病例範本、安全的本機儲存、併入 App 中心。

不做:DICOM / CBCT、Cornerstone3D、TypeScript + Vite 建置。

維持單一 HTML 檔、無建置步驟,是這支 App 能與其他四支一樣住在 `apps/` 底下的原因;
理由與取捨見 `docs/MIGRATION_PLAN.md` §1。

## 基線

上游 `e30779666948db7026706d10dd8ae3ae868f9fa0`(v3.16.0 + 2 commits)。

**469 筆測試全數通過,0 失敗。** 執行方式與環境偏差揭露見 `UPSTREAM.md`。

```bash
cd apps/dentfigure/upstream/figurelab/tests
npm ci && npx playwright install chromium && npm test
```

這組測試與 App 中心根目錄的 `./tests/run.sh` 互相獨立,不會互相影響。

## 授權注意事項

`upstream/figurelab/figure_lab.html` 內嵌 210 個圖示,**其中 123 個是第三方作品,
不在 FigureLab 的 MIT 授權範圍內**;41 個(Servier Medical Art 的 CC-BY-3.0 與
DBCLS 的 CC-BY-4.0)帶署名義務,而且義務會跟著圖示進到匯出的成品裡。
清單見 `THIRD_PARTY_LICENSES.md` §4.2。

本資料夾的署名一律用:

```
© 2026 Tso KY · MIT · derived from FigureLab by M. B. Awuah
```

**不要用 `© Tso KY - All Rights Reserved`** —— 那串字適用於 App 中心其他自行撰寫的
工具,但在這裡會與 MIT 自相矛盾,也會涵蓋到不屬於本專案的程式碼。原因見 `NOTICE.md`。
