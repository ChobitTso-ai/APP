# DentFigure(開發中)

臨床／牙科影像的期刊圖組版工具,衍生自 [FigureLab](https://github.com/mbaffour/FigureLab)(MIT)。

> **這支 App 尚未上架。** 目前只有基線(Assignment 001):釘選的上游快照與盤點文件。
> 這個資料夾**刻意還沒有 `index.html`**,因為建立它需要加入登入守衛與中文化,
> 兩者都是功能性改動,不屬於本階段。`app.js` 的 `APPS` 也還沒有對應卡片。
> 上架是 M2 的工作,見 `docs/MIGRATION_PLAN.md`。

## 這裡有什麼

| 路徑 | 內容 |
|---|---|
| `LICENSE` | MIT(僅適用本資料夾),並保留上游的著作權聲明 |
| `NOTICE.md` | 上游署名、引用方式、DentFigure 的署名慣例 |
| `THIRD_PARTY_LICENSES.md` | 第三方授權盤點 —— **含 41 個需署名的圖示** |
| `UPSTREAM.md` | 釘選的 commit SHA、基線測試結果、同步政策 |
| `docs/ARCHITECTURE_CURRENT.md` | 上游 11 個子系統拆解、風險登記、「不要動」清單 |
| `docs/MIGRATION_PLAN.md` | 範圍決定與 M0–M3 計畫 |
| `upstream/figurelab/` | **釘選快照,一個字元都不要改** |

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
