#!/bin/sh
# 跑案例標記工具的端到端測試。
#   ./tests/run.sh                 跑全部
#   ./tests/run.sh geo-align       只跑某一組（檔名前綴即可）
# 會自動起一個本機靜態伺服器（預設 8765），跑完關掉。
set -e
DIR=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$DIR/.." && pwd)
PORT=${PORT:-8765}
export BASE_URL=${BASE_URL:-http://localhost:8765}

# 少任何一個套件就補裝（舊容器只裝過 playwright-core，後來縮網址測試多了 jsqr）
if [ ! -d "$DIR/node_modules/playwright-core" ] || [ ! -d "$DIR/node_modules/jsqr" ]; then
  echo "→ 安裝測試用套件 playwright-core、jsqr（第一次才需要）"
  (cd "$DIR" && npm install --silent)
fi

SRV=""
if ! curl -sf "http://localhost:$PORT/index.html" >/dev/null 2>&1; then
  python3 -m http.server "$PORT" --directory "$ROOT" >/dev/null 2>&1 &
  SRV=$!
  trap 'if [ -n "$SRV" ]; then kill "$SRV" 2>/dev/null || true; fi' EXIT INT TERM
  n=0
  until curl -sf "http://localhost:$PORT/index.html" >/dev/null 2>&1; do
    n=$((n+1)); [ "$n" -gt 60 ] && { echo "伺服器起不來"; exit 1; }
    sleep 0.3
  done
fi

if [ $# -gt 0 ]; then
  FILES=""
  for a in "$@"; do FILES="$FILES $DIR/$a"*.test.js; done
else
  FILES="$DIR"/*.test.js
fi

bad=0
for f in $FILES; do
  echo ""
  echo "════ $(basename "$f") ════"
  if node "$f"; then :; else bad=$((bad+1)); fi
done

echo ""
if [ "$bad" -eq 0 ]; then echo "全部通過 ✅"; else echo "有 $bad 組失敗 ❌"; fi
exit "$bad"
