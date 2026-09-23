# Claude ↔ CODEX 交班規則

有些工作（目前是插圖繪製）交給 CODEX 做。**CODEX 不碰 git**，
檔案由 Dr.Tso 用 GitHub 網頁搬運。這份文件定義兩邊的邊界與交接方式，
免得同一批檔案被兩邊互改。

## 流程

```
Claude 寫規格書  →  docs/handoff/*-spec.md  （進 repo，版本控管）
       ↓ Dr.Tso 把規格貼進 CODEX 對話
CODEX 產出檔案   →  CODEX 自己的本機交班資料夾
       ↓ Dr.Tso 用 GitHub 網頁 Add file → Upload files 拖進 repo
Claude 整合      →  驗收、接進 App、跑測試、commit、push、開 PR、合併
```

## 分工邊界（最重要，違反就會衝突）

| | Claude | CODEX |
|---|---|---|
| 規格書 `docs/handoff/` | 寫 | 讀 |
| 素材檔（`.svg` 等） | 讀、驗收、必要時微調 | 產出 |
| App 程式碼（`index.html`／`app.js`／`styles.css`／`tests/`） | 改 | **不要碰** |
| git（commit／push／PR／合併） | 全部 | **不要碰** |

CODEX 只負責產檔案，不要順手幫忙改程式碼或動 git——Claude 同時在改同一批
檔案，動到就會衝突。

## 規格書的寫法

- 一個工作一份，放 `docs/handoff/<主題>-spec.md`。
- 內容要能**獨立閱讀**：CODEX 每次都是從零開始，看不到這邊的對話。
- 一定要寫「完成前自我檢查」段落，列出可以用 grep／ls 驗證的硬條件，
  否則交回來的東西很難一次到位。
- 規格改了就改規格書本身，不要只在對話裡講——下次重產會用回舊規格。

## 上傳檔案時的注意事項

- 落地資料夾已經先建好（裡面放 `.gitkeep`），直接進該資料夾按
  **Add file → Upload files** 拖檔案即可。
- 檔名必須與規格書完全一致，程式是照檔名找檔的。
- **有版權的參考資料不要上傳**：本 repo 是 public，commit 之後即使刪除，
  git 歷史裡仍然留著。參考圖請直接貼在 CODEX 對話裡。

## 目前的交班工作

| 規格書 | 主題 | 落地位置 |
|---|---|---|
| `dental-trauma-art-spec.md` | 牙外傷指南的 22 張向量插圖 | `apps/dental-trauma-guide/assets/` |
