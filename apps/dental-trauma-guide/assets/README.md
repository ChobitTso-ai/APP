# Dental Trauma Guide — 素材資料夾

插圖由 CODEX 繪製、由 Dr.Tso 用 GitHub 網頁上傳到這裡，Claude 負責整合進 App。
完整繪圖規格見 `docs/handoff/dental-trauma-art-spec.md`（那份是唯一權威，
要改規格改那份，不要只改這裡）。

## 上傳位置

| 放哪裡 | 放什麼 |
|---|---|
| `dx/` | 16 張診斷插圖（`base-*`、`fx-*`、`lux-*`、`avulsion.svg`） |
| `care/` | 5 張急救與處置插圖（`hold-crown` … `apex-open-vs-closed`） |
| 本資料夾 | `icon-master.svg`（1024×1024 App 圖示主檔，PNG 由 Claude 轉） |

檔名要與規格書**完全一致**（小寫、連字號），App 是照檔名去找圖的，
拼錯不會報錯，只會顯示佔位框。

## 圖還沒到也不影響

App 找不到圖時會顯示佔位框，版面不會壞。圖一張一張補進來即可，
不必等整批到齊。

## 不要放這裡的東西

- **有版權的參考圖**（IADT 原圖、教科書或期刊掃描）。
  這個 repo 是 public，一旦 commit 就等於公開散布，而且刪掉之後
  git 歷史裡還留著。參考圖請直接貼在 CODEX 對話裡，不要進 repo。
- 可識別病患的臨床照。
