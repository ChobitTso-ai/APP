#!/usr/bin/env python3
"""從釘選的上游快照產生 apps/dentfigure/index.html。

    python3 apps/dentfigure/make-index.py

為什麼要有這支腳本:

DentFigure 不直接修改 upstream/figurelab/figure_lab.html —— 上游 33 個 spec
檔中有 27 個斷言英文 UI 字串,就地中文化會打爛那 469 筆回歸測試,而那是這個
專案唯一的安全網。

所以 index.html 是「快照 + 四個明確定義的轉換」。同步上游新版時的流程是:

    1. 重新抓上游檔案放進 upstream/figurelab/
    2. 更新 UPSTREAM.md 的 SHA
    3. 跑這支腳本
    4. 跑 ./tests/run.sh dentfigure

不必逐處比對散落各地的修改。每個轉換都用 assert 確認目標存在,上游改了結構
就會直接失敗,而不是安靜地產生一個少了登入守衛的檔案。
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
SNAPSHOT = HERE / 'upstream' / 'figurelab' / 'figure_lab.html'
OUTPUT = HERE / 'index.html'

GUARD = ("<script>if(localStorage.getItem('nckuh_endo_authed')!=='1')"
         "location.replace('../../');</script>")


def transform(src: str) -> str:
    # 1) 登入保護。必須是 <head> 裡的第一個 script,未登入直開網址會被導回登入頁。
    #    ../../ 是因為這支 App 住在 apps/dentfigure/,往回兩層剛好是 App 中心根目錄。
    assert src.count('<head>') == 1, '找不到唯一的 <head>'
    src = src.replace('<head>', '<head>\n' + GUARD, 1)

    # 2) 分頁標題。
    assert src.count('<title>FigureLab</title>') == 1, '找不到上游的 <title>'
    src = src.replace('<title>FigureLab</title>',
                      '<title>DentFigure — 臨床影像組版</title>', 1)

    # 3) 停用上游的 service worker 註冊。
    #    App 中心根目錄的 sw.js 註冊在 /APP/ scope,已經涵蓋這個路徑;再掛一個
    #    巢狀 SW 只會製造 scope 衝突。而且上游 sw 的預快取清單指向
    #    ./figure_lab.html,在這個位置根本不存在,每次載入都會噴 404。
    #    日後若要把 DentFigure 做成 PWA,應該刻意加一支自己的,而不是沿用這個。
    sw_old = "if('serviceWorker' in navigator) navigator.serviceWorker.register('figurelab-sw.js').catch(()=>{});"
    sw_new = "/* DentFigure: service worker 註冊已停用,見 make-index.py 第 3 項轉換 */"
    assert src.count(sw_old) == 1, '找不到上游的 service worker 註冊'
    src = src.replace(sw_old, sw_new, 1)

    # 4) 掛上中文化層。放在 app 的 script 之後,DOM 與所有函式都已就緒。
    assert src.count('</body>') == 1, '找不到唯一的 </body>'
    src = src.replace('</body>', '<script src="i18n-zh-TW.js"></script>\n</body>', 1)

    return src


def main() -> int:
    if not SNAPSHOT.exists():
        print(f'找不到快照: {SNAPSHOT}', file=sys.stderr)
        return 1
    src = SNAPSHOT.read_text(encoding='utf-8')
    out = transform(src)
    OUTPUT.write_text(out, encoding='utf-8')

    added = out.count('\n') - src.count('\n')
    print(f'已產生 {OUTPUT.relative_to(HERE.parent.parent)}')
    print(f'  快照 {len(src):,} bytes → 產出 {len(out):,} bytes(多 {added} 行)')
    print('  轉換:登入守衛 · 中文標題 · 停用 service worker · 掛載 i18n')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
