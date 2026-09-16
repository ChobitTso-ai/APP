/* ===========================================================
   DentFigure — 繁體中文介面層 (zh-TW)
   ===========================================================
   為什麼用「執行時字典替換」而不是直接改 figure_lab.html:

   上游 33 個 spec 檔中有 27 個斷言英文 UI 字串(例如 honesty.spec.js
   斷言 /Nature\/Science\/Cell/)。就地翻譯會打爛大半個回歸測試套件,
   而那套測試正是這個專案唯一的安全網。

   改成這樣之後:
   - upstream/figurelab/figure_lab.html 維持原封不動,469 筆測試繼續綠
   - 與上游的差異只有「一份副本 + 一個附加 script」,同步上游修正時
     只要重新複製檔案再掛上這支,不必逐處比對上千個散落的修改
   - 字典是純資料,任何人都能讀、能改、能看出漏翻哪些

   規則:
   - **完整字串精確比對**。絕不做子字串替換 —— 那會把使用者輸入的
     檔名、標籤、病例代號一起改掉。
   - 沒收錄的字串維持英文,不會亂翻。
   - 只改文字節點與少數屬性(title / placeholder / aria-label),
     不碰 input.value、textarea 內容等使用者資料。

   翻譯範圍(第一批):九個主工作區塊、按鈕、欄位標籤、下拉選項、
   tooltip。app 內建的 changelog 與 FAQ 長文暫不翻 —— 字數佔大半,
   但對「判斷這個工具哪裡要改」沒有幫助。

   偵錯:主控台輸入 __i18n.missing() 可列出畫面上還沒翻到的字串。
   =========================================================== */
(function () {
  'use strict';

  const DICT = {
    // ── 九個主工作區塊(左側導覽,最重要)──────────────
    'Images': '影像',
    'Arrange': '排列',
    'Templates': '範本',
    'Crop & Scale': '裁切與比例',
    'Annotate & Draw': '標註與繪圖',
    'Look': '外觀',
    'Measure': '測量',
    'Check': '檢查',
    'Export': '匯出',

    // ── 影像匯入 ───────────────────────────────────
    'Drop images here': '把影像拖曳到這裡',
    'Drop images to get started.': '拖入影像即可開始。',
    'Drop or click to add images': '拖曳或點擊以加入影像',
    'Paste image from clipboard': '從剪貼簿貼上影像',
    'Pasted image': '貼上的影像',
    'Crop images as I import them': '匯入時就先裁切',
    'On import': '匯入時',
    'Smart import': '智慧匯入',
    'What import reads': '匯入會讀取的資訊',
    'Images & formats': '影像與格式',
    'Opens TIFF files': '可開啟 TIFF 檔',
    '↕ Sort by name': '↕ 依檔名排序',
    '⤷ Parse names': '⤷ 解析檔名',
    '⤷ Label from fields': '⤷ 用欄位產生標籤',
    'filename parser': '檔名解析器',
    'file name': '檔名',
    'File name': '檔名',
    'Image 1 / 1': '影像 1 / 1',
    'Waiting for your image…': '等待影像…',
    'Preview will appear here': '預覽會顯示在這裡',
    'No figure rendered': '尚未產生圖',

    // ── 版面與排列 ─────────────────────────────────
    'Layout': '版面',
    'Columns': '欄數',
    'Rows': '列數',
    'Panel width (px)': '面板寬度(px)',
    'Panel height (px)': '面板高度(px)',
    'Canvas size (px)': '畫布尺寸(px)',
    'Canvas mode': '畫布模式',
    'Canvas': '畫布',
    'H gap (px)': '水平間距(px)',
    'V gap (px)': '垂直間距(px)',
    'Margins (px)': '邊界(px)',
    'Per-gutter spacing': '個別間距調整',
    'Spacing & labels': '間距與標籤',
    'Space panels apart': '拉開面板間距',
    'Tighten spacing': '縮小間距',
    '⇲ Tighten spacing': '⇲ 縮小間距',
    '⥒ Tighten spacing': '⥒ 縮小間距',
    'Reset gutters': '間距回復預設',
    '↺ Reset gutters to uniform': '↺ 間距全部回復一致',
    '⊞ Fit grid to panels': '⊞ 格線配合面板數',
    '❖ Fit grid to panels': '❖ 格線配合面板數',
    '⤢ Fit panels to images': '⤢ 面板配合影像比例',
    '✨ Auto-arrange panels': '✨ 自動排列面板',
    '▭ Insert blank cell': '▭ 插入空白格',
    'blank cells': '空白格',
    'duplicate row / column': '複製列／欄',
    'Freeform mode': '自由排版模式',
    '⇱ Pop out to free layout': '⇱ 切換到自由排版',
    'Pop out to free layout': '切換到自由排版',
    '✦ Freeform': '✦ 自由排版',
    '⊞ Grid': '⊞ 格狀',
    'Grid': '格狀',
    'grid': '格狀',
    'mini grid map': '縮圖版面圖',
    'Panel map': '面板配置圖',

    // ── 面板標籤與標題 ─────────────────────────────
    'Panel labels': '面板標號',
    'Panel Labels (A, B, C…)': '面板標號(A、B、C…)',
    'Panel tags': '面板標籤',
    'Show tags': '顯示標籤',
    'Label': '標號',
    'Label format': '標號格式',
    'labels': '標籤',
    'Labels': '標籤',
    '⊞ Labels': '⊞ 標籤',
    'Column labels': '欄標題',
    'Row labels': '列標題',
    'Row / column header style': '列／欄標題樣式',
    'Toggle row/col labels': '切換列／欄標題',
    'Figure title': '圖標題',
    'Title': '標題',
    'Axis labels': '軸標題',
    'Bold labels': '標籤粗體',
    'Same as panel labels': '與面板標號相同',
    '🔤 Relabel A, B, C…': '🔤 重新編號 A、B、C…',
    'Relabel A, B, C…': '重新編號 A、B、C…',
    'Group bands': '群組色帶',
    'band across the columns': '橫跨各欄',
    'band down the rows': '縱貫各列',
    'label only': '僅標籤',
    'solid bar': '實心色條',
    'square bracket': '方括號',
    'i ii iii': 'i ii iii',
    'Caption note': '圖說備註',
    'Figure caption helper': '圖說輔助',
    'Figure notes (not exported)': '圖的備註(不會匯出)',

    // ── 裁切與變形 ─────────────────────────────────
    'Crop': '裁切',
    'Per-panel crop': '個別面板裁切',
    '✂ Crop a panel…': '✂ 裁切面板…',
    '✂ Visual Crop': '✂ 視覺化裁切',
    '✂ Crop Editor': '✂ 裁切編輯器',
    '✓ Apply Crop': '✓ 套用裁切',
    '↺ Reset all crops': '↺ 全部裁切還原',
    'Reset all crops': '全部裁切還原',
    '▦ Batch crop all images…': '▦ 批次裁切全部影像…',
    '⊞ Multi-crop into panels…': '⊞ 一張切成多個面板…',
    '⛶ Crop to fill cells': '⛶ 裁切以填滿格子',
    '⬜ Crop to same pixel size': '⬜ 裁成相同像素尺寸',
    '⚖ Crop to same physical area (µm)': '⚖ 裁成相同實際面積(µm)',
    'Crop to match': '裁切對齊',
    'Draw crop to set size': '拖曳框選以設定尺寸',
    'Draw a region to set the size': '拖曳一個範圍來設定尺寸',
    'Keep full image': '保留完整影像',
    '▣ Trim borders': '▣ 去除黑白邊',
    '▣ Trim borders on all panels': '▣ 所有面板去除黑白邊',
    'Straighten': '拉正',
    'Straighten to upright': '拉正為水平',
    'Rotate photos': '旋轉照片',
    'Rotate 90 degrees clockwise': '順時針旋轉 90 度',
    'Rotate 90 degrees anticlockwise': '逆時針旋轉 90 度',
    'rotate handle': '旋轉控制點',
    'any angle': '任意角度',
    'upright': '拉正',
    'Aspect': '長寬比',
    '▭ Ratio': '▭ 比例',
    'ratio lock': '鎖定比例',
    'free': '自由',
    "this panel's cell": '此面板的格子',
    'Resampling': '重新取樣',
    '⤢ Rescale…': '⤢ 重設尺寸…',
    'Rescale…': '重設尺寸…',
    'Pixel target': '目標像素',
    'Fill': '填滿',
    'Fit to window': '符合視窗',
    '⊡ Fit': '⊡ 符合',

    // ── 比例尺與校正 ───────────────────────────────
    'Scale bars & calibration': '比例尺與校正',
    '🔬 Scale Calibration': '🔬 比例尺校正',
    '🔬 Calibrate from image': '🔬 從影像校正',
    'Calibrate': '校正',
    '⚠ calibrate': '⚠ 待校正',
    'How do I calibrate a panel?': '如何校正一個面板?',
    'Two-point calibration': '兩點校正',
    'Click the first point…': '點選第一個點…',
    'Known length:': '已知長度:',
    'Scale auto-calibration': '比例自動校正',
    'Bar height (px)': '比例尺高度(px)',
    'Auto SB': '自動比例尺',
    'SB': '比例尺',
    '≡ Same bar on all calibrated': '≡ 已校正的面板用同一比例尺',
    'Objective preset': '物鏡預設值',
    'Field of view': '視野範圍',
    'Reference panel': '基準面板',
    'Reference': '基準',
    'Largest panel': '最大的面板',
    'Smallest panel': '最小的面板',
    'Narrowest (highest mag)': '最窄(倍率最高)',
    'Widest view (lowest mag)': '最寬(倍率最低)',
    'Matched panels': '已對齊的面板',
    'µm/px': 'µm/px',
    'unit': '單位',
    'mm': 'mm',
    'nm': 'nm',

    // ── 影像調整 ───────────────────────────────────
    '🎚 Image adjustments': '🎚 影像調整',
    '🎚 More…': '🎚 更多…',
    'Adjust': '調整',
    'Brightness': '亮度',
    'Contrast': '對比',
    'Gamma': 'Gamma',
    'Gamma correction': 'Gamma 校正',
    'Black / White point': '黑點／白點',
    'Black': '黑點',
    'White': '白點',
    'Auto contrast': '自動對比',
    'Auto-stretch': '自動延展',
    'Grayscale': '灰階',
    'Invert': '反相',
    'Opacity': '不透明度',
    'Reset adjustments': '調整值還原',
    'Match panel brightness': '統一面板亮度',
    '🎯 Match background': '🎯 統一背景色',
    '📊 Normalize histograms': '📊 統一直方圖',
    'Threshold': '閾值',
    '▨ Clipped': '▨ 溢出像素',
    '▨ clipped-pixel preview': '▨ 溢出像素預覽',
    '⚡ Exposure analysis': '⚡ 曝光分析',
    '⚡ Exposure Analysis': '⚡ 曝光分析',
    'Fluorescence LUT': '螢光偽色表',
    'Fluorescence LUTs': '螢光偽色表',
    '🔬 Fluorescence': '🔬 螢光',
    '🔭 Brightfield': '🔭 明視野',
    'Add channel': '加入通道',
    'Channel names': '通道名稱',
    '🎨 Auto-channels': '🎨 自動判定通道',
    'Split-channel row': '通道拆成一列',
    'Magenta': '洋紅',
    'Green': '綠',
    'Colour': '顏色',
    'Color': '顏色',
    'Background': '背景',
    'BG': '背景',
    'Remove white bg': '移除白色背景',
    'Honest background removal': '誠實的背景移除',

    // ── 標註與繪圖 ─────────────────────────────────
    'Annotate': '標註',
    'Annotations': '標註',
    '📌 Panel annotations': '📌 面板標註',
    '📌 Panel mode (annotations follow panels)': '📌 面板模式(標註跟著面板走)',
    'Add text onto a panel': '在面板上加文字',
    '↗ Arrow': '↗ 箭頭',
    '↔ Arrow2': '↔ 雙向箭頭',
    'Arrow': '箭頭',
    'Arrow annotation': '箭頭標註',
    '╱ Line': '╱ 直線',
    'Line': '直線',
    '□ Rect': '□ 矩形',
    'Rectangle': '矩形',
    '○ Ellipse': '○ 橢圓',
    'Ellipse': '橢圓',
    'T Text': 'T 文字',
    'Text': '文字',
    '⬜ TextBox': '⬜ 文字方塊',
    '↖ Select': '↖ 選取',
    'Select / move': '選取／移動',
    'Cancel / deselect': '取消／取消選取',
    'Exit tool / deselect': '離開工具／取消選取',
    'Halo': '外框光暈',
    'Show text': '顯示文字',
    'Show': '顯示',
    '🔍 Inset': '🔍 放大插圖',
    'Inset': '放大插圖',
    'Inset box': '放大插圖框',
    '⧉ Add linked inset…': '⧉ 加入連動放大圖…',
    'Connect outline to inset': '外框與放大圖連線',
    'Outline inset regions on the parent': '在原圖上框出放大範圍',
    '◪ Spotlight': '◪ 聚光標示',
    '◢ Spotlight': '◢ 聚光標示',
    '◧ Before/after': '◧ 前後對照',
    'Before/after slider': '前後對照滑桿',
    '🩹 Cover patch (honest replace)': '🩹 遮蔽色塊(誠實遮蓋)',
    'Cover patch': '遮蔽色塊',
    '🖌 Paint layer (non-destructive)': '🖌 繪圖圖層(非破壞性)',
    'Paint layer': '繪圖圖層',
    'Insert icon': '插入圖示',
    'Icon colour': '圖示顏色',
    'Science icon library': '科學圖示庫',
    '⎸ Add splice marker': '⎸ 加入接合標記',
    'Gel/blot splice marker': '膠片／墨點接合標記',
    'Significance brackets': '顯著性括號',
    'Reference / threshold lines': '參考線／閾值線',
    'Layer:': '圖層:',
    'Align:': '對齊:',
    'Distribute:': '分佈:',
    'Space:': '間距:',
    'Group & ungroup': '群組／解除群組',
    'Format painter': '複製格式',
    '⚖ Homogenize styles': '⚖ 統一樣式',
    'Snap to grid': '貼齊格線',
    '⊞ Snap': '⊞ 貼齊',
    'Snap size (px)': '貼齊間隔(px)',
    'Snap to 45° / square': '貼齊 45°／正方',
    'Nudge element (1px)': '微調元件(1px)',
    'Nudge 10px': '微調 10px',
    'Delete selected': '刪除選取項',
    'Delete selected elements': '刪除選取的元件',
    'Select all elements': '全選元件',
    '✕ Clear all elements': '✕ 清除所有元件',
    'Elements': '元件',

    // ── 測量 ───────────────────────────────────────
    'Measurement & quantification': '測量與定量',
    '📐 Measure ROI': '📐 測量 ROI',
    '⬚ ROI': '⬚ ROI',
    '📏 Profile': '📏 剖面',
    '📈 Line profile': '📈 線剖面',
    '🔢 Count': '🔢 計數',
    '⊢ Ruler': '⊢ 尺規',
    '📐 Level': '📐 水平',
    'Count:': '計數:',
    'Honest measurements': '誠實的測量',
    'Measured on': '測量基準',
    'absolute': '絕對值',
    'in native units.': '以原始單位。',
    '⬇ Export Measurements CSV': '⬇ 匯出測量結果 CSV',
    '⬇ Export measurements': '⬇ 匯出測量結果',

    // ── 檢查與稽核 ─────────────────────────────────
    'Audit': '稽核',
    'Actionable audit': '可處理的稽核結果',
    '⚖ Full audit': '⚖ 完整稽核',
    '🔍 Deep figure audit': '🔍 深度圖檢查',
    '✓ Check journal compliance': '✓ 檢查期刊規格',
    'Journal house style': '期刊樣式',
    'Journal preset': '期刊預設值',
    'House styles': '期刊樣式',
    '🧬 Duplication check': '🧬 重複影像檢查',
    '🧬 Duplicate-panel self-check.': '🧬 重複面板自我檢查。',
    '⧉ Compare panels': '⧉ 比對面板',
    'Before you submit': '投稿前確認',
    'Accessibility & disclosure': '無障礙與揭露',
    'Colour-vision-deficiency preview': '色覺障礙預覽',
    '👁 CVD': '👁 色覺模擬',
    'Normal vision': '正常色覺',
    'Deuteranopia (red-green)': '綠色盲(紅綠)',
    'Protanopia (red-green)': '紅色盲(紅綠)',
    'Tritanopia (blue-yellow)': '藍黃色盲',
    'Export preflight': '匯出前檢查',

    // ── 匯出 ───────────────────────────────────────
    'Export DPI': '匯出 DPI',
    'Printed width': '印刷寬度',
    'Printed width in millimetres.': '以毫米為單位的印刷寬度。',
    'Resolution': '解析度',
    'Export & print quality': '匯出與印刷品質',
    '⤓ Save figure': '⤓ 儲存圖',
    'Save dialog': '儲存對話框',
    'Render figure': '產生圖',
    '⟳ Render': '⟳ 產生',
    'Re-render': '重新產生',
    '↓ PNG': '↓ PNG',
    '↓ TIFF': '↓ TIFF',
    '↓ PDF': '↓ PDF',
    '↓ PDF±': '↓ PDF±',
    '↓ SVG': '↓ SVG',
    'Export PNG': '匯出 PNG',
    'PNG — lossless raster': 'PNG — 無損點陣',
    'TIFF — uncompressed (journals)': 'TIFF — 未壓縮(期刊用)',
    'PDF — lossless': 'PDF — 無損',
    'PDF — compact (JPEG)': 'PDF — 壓縮(JPEG)',
    'PDF (lossless)': 'PDF(無損)',
    'Lossless PDF': '無損 PDF',
    'Lossless (Flate)': '無損(Flate)',
    'SVG — vector labels': 'SVG — 向量標籤',
    'JPEG — small, lossy': 'JPEG — 檔小、有損',
    'WebP — small, lossy': 'WebP — 檔小、有損',
    '📄 Multi-page PDF': '📄 多頁 PDF',
    'Multi-page PDF': '多頁 PDF',
    'Rows per page': '每頁列數',
    '📊 Export editable PowerPoint (.pptx)': '📊 匯出可編輯 PowerPoint(.pptx)',
    'Editable PowerPoint (.pptx)': '可編輯 PowerPoint(.pptx)',
    'Editable PowerPoint export': '可編輯 PowerPoint 匯出',
    '⬙ Batch Export Panels': '⬙ 批次匯出各面板',
    '📦 Export submission package (ZIP)': '📦 匯出投稿封包(ZIP)',
    'Submission package': '投稿封包',
    'Submission-ready by default': '預設即符合投稿需求',
    '⬇ CSV Metadata': '⬇ 中繼資料 CSV',
    '⬇ Blot metadata CSV': '⬇ 墨點中繼資料 CSV',
    'Source Data CSV': '原始資料 CSV',
    '📋 Reproducibility Log': '📋 可重現性紀錄',
    'Per-panel processing history': '各面板的處理歷程',
    'Scripts & Reproducibility': '腳本與可重現性',
    'R script': 'R 腳本',
    'Python script': 'Python 腳本',
    '📄 Publication': '📄 出版用',
    '72 DPI (screen)': '72 DPI(螢幕)',
    '150 DPI': '150 DPI',
    '300 DPI (print)': '300 DPI(印刷)',
    '600 DPI (journal)': '600 DPI(期刊)',
    '1200 DPI (line art)': '1200 DPI(線稿)',
    '72 (screen)': '72(螢幕)',
    '300 (print)': '300(印刷)',
    '600 (journal)': '600(期刊)',
    '1200 (line art)': '1200(線稿)',

    // ── 儲存與載入 ─────────────────────────────────
    'Save': '儲存',
    'Save session': '儲存工作階段',
    'Save session JSON': '儲存工作階段 JSON',
    '💾 Save': '💾 儲存',
    '💾 Save (bundled)': '💾 儲存(含影像)',
    '🪶 Save (settings only)': '🪶 儲存(僅設定)',
    '📂 Load': '📂 載入',
    '📂 Load a session': '📂 載入工作階段',
    'Load example figure': '載入範例圖',
    '✨ Load example figure': '✨ 載入範例圖',
    '✨ Try the example figure': '✨ 試試範例圖',
    'Save / load your work': '儲存／載入你的工作',
    'Saving your work': '儲存你的工作',
    'Saving & reproducibility': '儲存與可重現性',
    'Session library': '工作階段資料庫',
    'Autosave & crash recovery': '自動存檔與當機復原',
    'lightweight sessions': '輕量工作階段',
    'Nothing is bundled.': '不含任何影像資料。',
    '🔗 Share settings link': '🔗 分享設定連結',
    'Layout templates': '版面範本',
    'Saved templates': '已存範本',
    'Starter templates': '起始範本',
    '⊞ Start from a template': '⊞ 從範本開始',
    'Save this layout as a template': '把目前版面存成範本',
    '＋ Save current to library': '＋ 存入範本庫',
    '＋ Add region': '＋ 加入範圍',
    '＋ Add band': '＋ 加入色帶',
    'Template name…': '範本名稱…',

    // ── 通用按鈕與操作 ─────────────────────────────
    'Apply': '套用',
    'Apply to all': '套用到全部',
    '⤳ To all': '⤳ 套用到全部',
    '⤳ To group': '⤳ 套用到群組',
    'Cancel': '取消',
    '✕ Cancel': '✕ 取消',
    'Cancel export': '取消匯出',
    'Done': '完成',
    'Got it': '知道了',
    'Close': '關閉',
    'Close help': '關閉說明',
    'Dismiss tip': '關閉提示',
    'Delete': '刪除',
    '✕ Del': '✕ 刪除',
    '✕ Clear': '✕ 清除',
    '✕ New': '✕ 新建',
    '✎ Edit': '✎ 編輯',
    '⎘ Copy': '⎘ 複製',
    'Duplicate': '複製一份',
    '↩ Undo': '↩ 復原',
    '↪ Redo': '↪ 重做',
    'Undo': '復原',
    'Redo': '重做',
    '↶ Undo region': '↶ 復原此範圍',
    '↺ Reset': '↺ 還原',
    'Update': '更新',
    'Run': '執行',
    'Open': '開啟',
    'Import': '匯入',
    '⬆ Import': '⬆ 匯入',
    '⬇ Export': '⬇ 匯出',
    'Add to figure': '加入圖中',
    '+ Add': '＋ 新增',
    '+ Insert into canvas': '＋ 插入畫布',
    '✓ All': '✓ 全部',
    '✓ Next image': '✓ 下一張',
    '→ Skip': '→ 略過',
    '→ Skip image': '→ 略過此張',
    '→ Skip & Add': '→ 略過並加入',
    '⏹ Finish now': '⏹ 立即結束',
    '☑ Show only ticked': '☑ 只顯示勾選的',
    'Show only ticked': '只顯示勾選的',
    '👁 Show all': '👁 顯示全部',
    'Show a subset': '只顯示部分面板',
    '🗑 Delete hidden panels…': '🗑 刪除隱藏的面板…',
    'Delete hidden panels': '刪除隱藏的面板',
    'Zoom in/out': '放大／縮小',
    '100% zoom': '100% 縮放',
    'Pan canvas': '平移畫布',
    'Pan the canvas': '平移畫布',
    'Command palette': '指令面板',
    '⌨ Keyboard Shortcuts': '⌨ 鍵盤快速鍵',
    'Keyboard shortcuts': '鍵盤快速鍵',
    'Shortcuts (?)': '快速鍵(?)',
    '❔ Help & FAQ': '❔ 說明與常見問題',
    'Help & FAQ': '說明與常見問題',
    'Help and FAQ': '說明與常見問題',
    'FAQ': '常見問題',
    'Getting Started': '開始使用',
    'Quick start': '快速上手',
    '🧭 Quick tour': '🧭 快速導覽',
    'guided tour': '導覽',
    'Use Cases': '使用情境',
    'Troubleshooting': '疑難排解',
    'Tip': '提示',
    'Tip:': '提示:',
    'Note': '注意',
    'Theme': '佈景',
    'Figure themes': '圖的佈景',
    'One-click themes': '一鍵套用佈景',
    'Cycle theme: Light, Lab, Dark': '切換佈景:亮色、實驗室、暗色',
    '⚙ Customize': '⚙ 自訂',
    'Make it yours': '個人化設定',
    'Style': '樣式',
    'Format': '格式',
    'Position': '位置',
    'Size': '尺寸',
    'Size (px)': '尺寸(px)',
    'Width': '寬度',
    'Len': '長度',
    'Corner': '角落',
    'Top': '上',
    'Bottom': '下',
    'Left': '左',
    'Right': '右',
    'Center': '置中',
    '☰ Center': '☰ 置中',
    '⯇ Left': '⯇ 靠左',
    '⯈ Right': '⯈ 靠右',
    'Top Left': '左上',
    'Top Right': '右上',
    'Bottom Left': '左下',
    'Bottom Right': '右下',
    '↖ TL': '↖ 左上',
    '↗ TR': '↗ 右上',
    '↘ BR': '↘ 右下',
    '↙ BL': '↙ 左下',
    'Font': '字型',
    'Font family': '字型',
    'Font size': '字級',
    'Fnt': '字型',
    'Typography': '字體設定',
    'Bold': '粗體',
    'bold': '粗體',
    'Italic': '斜體',
    'italic': '斜體',
    'System Sans': '系統無襯線',
    'Default': '預設',
    'Auto': '自動',
    '✨ Auto': '✨ 自動',
    'none': '無',
    '— none': '— 無',
    'Panel border': '面板外框',
    'Border inset': '外框內縮',
    'black': '黑',
    'white': '白',
    'Gray': '灰',
    'px': 'px',
    'Advanced': '進階',
    'Simple / Advanced mode': '簡易／進階模式',
    'Tools': '工具',
    'Tool': '工具',
    'Action': '動作',
    'Data': '資料',
    'Series': '資料列',
    'Type': '類型',
    'Shape': '形狀',
    'Prompt': '提示詞',
    'Model': '模型',
    'Backend': '後端',
    'Your name': '你的名字',
    'Plate': '培養皿／板',
    'Key': '圖例',
    '▤ Key': '▤ 圖例',
    '▤ A channel key': '▤ 通道圖例',
    '▦ Lane labels': '▦ 泳道標籤',
    '↕ MW ladder': '↕ 分子量標記',
    'Blot / gel tools': '墨點／膠片工具',
    'legend': '圖例',
    'Privacy & data': '隱私與資料',
    '🔒 Zero network requests.': '🔒 完全不發出網路請求。',
    'entirely on your machine': '完全在你的電腦上',
    '⚖ Credits': '⚖ 致謝',
    '⚖ Credits & attribution': '⚖ 致謝與署名',
    'Cite': '引用',
    'GitHub': 'GitHub',
    'Bioicons': 'Bioicons',
    'Fixed.': '已修正。',
    'Fixed:': '已修正:',

    // ── 圖表(牙科用得到的是長條、散佈、存活曲線)──────
    '📊 Chart': '📊 統計圖',
    '⚙ Edit chart…': '⚙ 編輯統計圖…',
    'Chart type': '圖表類型',
    'Bar': '長條圖',
    'Grouped': '分組',
    'Grouped bar': '分組長條圖',
    'Stacked': '堆疊',
    'Stacked bar': '堆疊長條圖',
    'Scatter': '散佈圖',
    'Box': '盒鬚圖',
    'Box & whisker': '盒鬚圖',
    'Violin': '小提琴圖',
    'Beeswarm': '蜂群圖',
    'Beeswarm (dots)': '蜂群圖(散點)',
    'Heatmap': '熱圖',
    'Survival': '存活曲線',
    'Survival (Kaplan–Meier)': '存活曲線(Kaplan–Meier)',
    'Heatmaps & survival curves': '熱圖與存活曲線',
    'Data charts from a CSV': '從 CSV 產生統計圖',
    'Error bars': '誤差線',
    'SD (n−1)': '標準差 SD(n−1)',
    'SEM (SD/√n)': '標準誤 SEM(SD/√n)',
    'from a column': '取自某一欄',
    'X / category column': 'X／分類欄',
    'X title': 'X 軸標題',
    'Y title': 'Y 軸標題',
    'Y columns': 'Y 資料欄',
    'Time col': '時間欄',
    'Event col (1/0)': '事件欄(1/0)',
    'Group col (optional)': '分組欄(選填)',
    'Median': '中位數',
    'midpoint': '中點',
    '≈ Mean': '≈ 平均',
    'OLS linear fit': '最小平方線性迴歸',
    'show eq + R²': '顯示方程式與 R²',
    'show values': '顯示數值',
    'Show every data point': '顯示每一個資料點',
    'points': '資料點',
    'log X': 'X 軸取對數',
    'log Y': 'Y 軸取對數',
    'Colour scale': '色階',
    'Viridis (sequential)': 'Viridis(連續)',
    'Magma (sequential)': 'Magma(連續)',
    'Blues (sequential)': 'Blues(連續)',
    'Diverging (blue–white–red)': '發散(藍–白–紅)',
    'Palette': '色盤',
    'Okabe–Ito (colourblind-safe)': 'Okabe–Ito(色盲友善)',
    'Tol bright': 'Tol 明亮',
    'Monochrome': '單色',
    'Mono': '單色',
    '✛ Axes': '✛ 座標軸',

    // ── 流程圖與基因圖(牙科幾乎用不到,但介面看得到)──
    '➜ Pathway': '➜ 流程圖',
    '⌥ Fishbone': '⌥ 魚骨圖',
    '⬇ PRISMA': '⬇ PRISMA',
    '⬇ CONSORT': '⬇ CONSORT',
    'Flowcharts with real connectors': '帶連接線的流程圖',
    'Route': '走線',
    'straight': '直線',
    'elbow ⌐': '直角 ⌐',
    'elbow ∟': '直角 ∟',
    'goes to': '指向',
    'Connect': '連接',
    '🧬 Gene map': '🧬 基因圖譜',
    '🧬 Linear': '🧬 線性',
    '⭕ Plasmid': '⭕ 質體',
    '⚙ Edit map…': '⚙ 編輯圖譜…',
    'Gene maps & circuits': '基因圖譜與線路',
    'Gene maps & genetic circuits': '基因圖譜與遺傳線路',
    'Topology': '拓撲',
    'Linear': '線性',
    'Linear construct': '線性構築',
    'Circular': '環狀',
    'Circular (plasmid)': '環狀(質體)',
    'Backbone length (bp)': '骨架長度(bp)',
    'Length bp': '長度 bp',
    'bp ruler': 'bp 尺規',
    'split by strand': '依股別分開',
    'Glyph colours': '符號顏色',
    'SBOL Visual (by feature type)': 'SBOL Visual(依特徵類型)',
    '+ Add feature': '＋ 加入特徵',
    '📄 GenBank / FASTA…': '📄 GenBank / FASTA…',
    'GenBank / FASTA': 'GenBank / FASTA',

    // ── 面板組合與投影 ─────────────────────────────
    '⬆ Max projection': '⬆ 最大值投影',
    '⬆ Max and mean projections': '⬆ 最大值與平均值投影',
    'Combine ticked panels': '合併勾選的面板',
    '⧉ Every N': '⧉ 每隔 N 個',
    '⇉ From tags': '⇉ 依標籤',
    '⏱ Tag from acquisition time': '⏱ 依拍攝時間標記',
    'ImageJ frame interval': 'ImageJ 影格間隔',
    'Single': '單張',
    'strip': '連續帶',
    'column': '欄',
    'each image = a column': '每張影像 = 一欄',
    'each image = a row': '每張影像 = 一列',

    // ── 期刊版面預設(保留期刊名與 mm,只翻描述)────
    '89 mm — single column (Nature, eLife)': '89 mm — 單欄(Nature、eLife)',
    '183 mm — double column (Nature, eLife)': '183 mm — 雙欄(Nature、eLife)',
    '85 mm — single column (Cell)': '85 mm — 單欄(Cell)',
    '174 mm — double column (Cell)': '174 mm — 雙欄(Cell)',
    '83 mm — single column (PLOS)': '83 mm — 單欄(PLOS)',
    '173 mm — double column (PLOS)': '173 mm — 雙欄(PLOS)',
    '55 mm — 1 column (Science)': '55 mm — 單欄(Science)',
    '120 mm — 2 column (Science)': '120 mm — 雙欄(Science)',
    '183.5 mm — 3 column (Science)': '183.5 mm — 三欄(Science)',
    '180 mm — full width (PNAS/EMBO)': '180 mm — 滿版(PNAS/EMBO)',
    'Free (whatever the canvas gives)': '不限(依畫布而定)',
    'Deliverable presets': '成品預設值',
    'Poster': '海報',
    'Poster (large type)': '海報(大字級)',
    'Supp.': '補充資料',
    '1-col': '單欄',
    '1-up': '單張',
    '2-row': '雙列',
    'Panel A': '面板 A',
    'Panel B': '面板 B',
    'Panel C': '面板 C',

    // ── 佈景 ───────────────────────────────────────
    'Fluorescence (dark)': '螢光(深色)',
    'Grayscale for print': '印刷灰階',
    'High contrast': '高對比',
    // 'Lab' 刻意不收:它太短太泛用。收了之後 <div class="logo">Figure<span>Lab</span></div>
    // 的 Lab 也被換掉,logo 變成「Figure實驗室」。SKIP_SEL 已在結構上保護 .logo,
    // 但這種字還是不該進字典 —— 換個上游版本、換個 class 名就又中招了。

    // ── 補漏 ───────────────────────────────────────
    'Rotate:': '旋轉:',
    'Save:': '儲存:',
    'Gap to figure (px)': '與圖的距離(px)',
    'pick…': '選擇…',
    '→ end': '→ 單向',
    '↔ both': '↔ 雙向',
    'i ii iii': 'i ii iii',
    '• Counter': '• 計數器',
    '⬚ ROI': '⬚ ROI',
    '150 DPI': '150 DPI',
    'PNG · TIFF · JPG · any image format': 'PNG · TIFF · JPG · 任何影像格式',
    '…or paste one with Ctrl/⌘+V': '…或用 Ctrl/⌘+V 貼上',
    'R=render · Ctrl+Z/Y=undo/redo · Ctrl+S=save · Ctrl+scroll=zoom · Space+drag=pan':
      'R=產生 · Ctrl+Z/Y=復原/重做 · Ctrl+S=儲存 · Ctrl+滾輪=縮放 · 空白鍵+拖曳=平移',

    // ── AI 生成(M1 將移除此路徑:它會把影像上傳到 Google)──
    '✦ AI Generate': '✦ AI 生成',
    '✦ Generate Caption': '✦ 產生圖說',
    '✦ Generate via API': '✦ 透過 API 生成',
    '🎨 Generate with your Gemini account': '🎨 用你的 Gemini 帳號生成',
    '🤖 Polish with on-device AI': '🤖 用裝置端 AI 潤稿',
    'On-device AI caption polish': '裝置端 AI 圖說潤稿',
    '⚡ Edit via API': '⚡ 透過 API 編輯',
    '✨ Edit in Gemini': '✨ 在 Gemini 中編輯',
    '↩ Revert AI edit': '↩ 還原 AI 編輯',
    '⧉ Variation': '⧉ 變化版本',
    '⧉ Re-copy prompt': '⧉ 重新複製提示詞',
    '⧉ Use selection as style reference (API)': '⧉ 以選取項作為風格參考(API)',
    'Suggested subjects': '建議主題',
    "Don't save the key (this session only)": '不要儲存金鑰(僅此次工作階段)',
    'Gemini API key': 'Gemini API 金鑰',
    'Local endpoint': '本機端點',
    'Icon (flat vector)': '圖示(平面向量)',
    'Medical illustration': '醫學插圖',
    'Scientific diagram': '科學示意圖',
    'Molecular schematic': '分子示意圖',
    'Cell biology illustration': '細胞生物學插圖',
    'Textbook illustration': '教科書插圖',
    'Infographic style': '資訊圖表風格',
    'BioRender-style cartoon': 'BioRender 風格卡通',
    'Cover art': '封面圖',
    'Show all 210 icons': '顯示全部 210 個圖示',
    '169 icons': '169 個圖示',
    '210 icons': '210 個圖示',
    'CC0 and MIT only': '僅 CC0 與 MIT',

    // ── 常見問題(標題,內文暫不翻)────────────────
    'Is my data uploaded anywhere?': '我的資料會被上傳到任何地方嗎?',
    'Does FigureLab work offline?': '可以離線使用嗎?',
    'Which browsers work best?': '哪些瀏覽器最適合?',
    'Is it free? Is it open source?': '免費嗎?是開源的嗎?',
    'What image formats can I import?': '可以匯入哪些影像格式?',
    'What can I export, and which format should I use?': '可以匯出什麼?該選哪種格式?',
    'How do I calibrate a panel?': '如何校正一個面板?',
    'Can I match the physical scale across several panels?': '可以讓多個面板的實際比例一致嗎?',
    'What DPI should I use for journal submission?': '投稿該用多少 DPI?',
    'What is the difference between PDF and PDF (lossless)?': 'PDF 與 PDF(無損)差在哪?',
    'How do I get a clean white background for print?': '如何取得適合印刷的乾淨白背景?',
    'Do my images get saved in the session JSON?': '我的影像會被存進工作階段 JSON 嗎?',
    'How do I save and reload a figure?': '如何儲存與重新載入一張圖?',
    'Can I reproduce a figure programmatically?': '可以用程式重現一張圖嗎?',
    'Can FigureLab write my figure caption?': '可以自動產生圖說嗎?',
    'A panel won’t drag to reorder.': '面板拖不動、無法重新排序。',
    "A panel won't drag to reorder.": '面板拖不動、無法重新排序。',
    'My annotations moved or look wrong after I changed the layout.': '改完版面後標註跑掉或顯示不正確。',
    'Should I use FigureLab instead of ImageJ/FIJI for analysis?': '分析工作該用這個取代 ImageJ/FIJI 嗎?',
    'Do measurements read my real pixel values, or what’s on screen?': '測量讀的是真實像素值,還是畫面上顯示的?',
    'How should I cite FigureLab?': '該如何引用 FigureLab?',
    'What is FigureLab?': 'FigureLab 是什麼?',
    'The interface at a glance': '介面總覽',
    'Core workflow, step by step': '核心流程,一步一步來',
    '60-second quick start': '60 秒快速上手',
    '1. Add and arrange panels': '1. 加入並排列面板',
    '2. Adjust each panel': '2. 調整各個面板',
    '3. Add a calibrated scale bar': '3. 加上校正過的比例尺',
    '4. Label the panels': '4. 為面板編號',
    '5. Space panels apart': '5. 調整面板間距',
    '6. Annotate': '6. 加上標註',
    '7. Export': '7. 匯出',
    'Build a publication-ready figure': '做出可投稿的圖',
    'Friendly figure editor': '好上手的組版工具',
    'Start screen': '起始畫面',
    'PWA install': '安裝為應用程式',
  };

  // 屬性文字(tooltip / 佔位提示)
  const ATTR_DICT = {
    'Search icons — cell, arrow, mouse…': '搜尋圖示 —— 細胞、箭頭、滑鼠…',
    'Type a command… (export, render, theme, preset, help)': '輸入指令…(匯出、產生、佈景、預設、說明)',
    'Type text, Enter to place…': '輸入文字,按 Enter 放置…',
    'Type text… (Enter saves · Shift+Enter = new line · Esc cancels)': '輸入文字…(Enter 儲存 · Shift+Enter 換行 · Esc 取消)',
    'Caption will appear here…': '圖說會顯示在這裡…',
    'Optional title…': '標題(選填)…',
    'Antibody dilutions, conditions, reviewer comments…': '抗體稀釋倍數、條件、審稿意見…',
    'Template name…': '範本名稱…',
    'box text': '方塊文字',
    'label': '標籤',
    'figure': 'figure',
    'e.g. Lab style': '例:實驗室樣式',
    'e.g. Michael': '例:王小明',
    'e.g. Plate 1': '例:第 1 板',
    'About Export DPI': '關於匯出 DPI',
    'About printed width': '關於印刷寬度',
    'About panel labels': '關於面板標號',
    'About panel tags': '關於面板標籤',
    'About scale bars': '關於比例尺',
    'About export formats': '關於匯出格式',
    'About sessions': '關於工作階段',
    'About the session library': '關於工作階段資料庫',
    'About themes': '關於佈景',
    'About house styles': '關於期刊樣式',
    'About group bands': '關於群組色帶',
    'About matching': '關於對齊',
    'About projections': '關於投影合成',
    'About reference lines': '關於參考線',
    'About significance marks': '關於顯著性標記',
    'About splice markers': '關於接合標記',
    'About showing a subset': '關於只顯示部分面板',
    'About caption help': '關於圖說輔助',
    'About the feature table': '關於特徵表',
    'Close': '關閉',
    'Close help': '關閉說明',
    'Dismiss tip': '關閉提示',
    'Command palette': '指令面板',
    'Help and FAQ': '說明與常見問題',
    'Cancel export': '取消匯出',
    'Cycle theme: Light, Lab, Dark': '切換佈景:亮色、實驗室、暗色',
    'Rotate 90 degrees clockwise': '順時針旋轉 90 度',
    'Rotate 90 degrees anticlockwise': '逆時針旋轉 90 度',
    'Rotate photos': '旋轉照片',
    'Straighten to upright': '拉正為水平',
  };

  /* 整句替換 —— 給被 <b>/<i>/<em> 切開的句子用。
   *
   * 為什麼需要:提示列的原文是
   *   <span>💡 <b>Tip:</b> Drag the divider <i>between</i> panels to space them out …</span>
   * 這在 DOM 裡是五個文字節點。逐節點翻會得到「拖曳分隔線 between panels to
   * space them out」這種中英夾雜的句子 —— 比整句維持英文更難讀,因為中文語序
   * 與英文不同,片段拼不回通順的句子。
   *
   * key 是整個元素 textContent 正規化後的字串,value 是新的 innerHTML。
   * 只有在元素底下沒有互動性子節點時才替換(見 safeToReplace),否則換掉
   * innerHTML 會把事件監聽一起弄丟。
   */
  const SENTENCE_DICT = {
    '💡 Tip: Drag the divider between panels to space them out · Double-click a panel to add text · ⊞ Labels toggles headers.':
      '💡 <b>提示:</b> 拖曳面板<i>之間</i>的分隔線可以調整間距 · 在面板上點兩下可加入文字 · ⊞ 標籤可切換列／欄標題。',
  };

  // 這些標籤是純排版用的,換掉不會弄丟任何行為
  const INLINE_OK = /^(B|I|EM|STRONG|SPAN|BR|CODE|KBD|SMALL|SUP|SUB|U)$/;

  const ATTRS = ['title', 'placeholder', 'aria-label'];
  const SKIP_TAGS = /^(SCRIPT|STYLE|TEXTAREA|CANVAS)$/;

  // 結構性保護:這些子樹內一律不翻,與字典內容無關。
  //
  // .logo 在這裡是真的踩過:字典收了 'Lab' → '實驗室'(佈景名稱),結果
  // <div class="logo">Figure<span>Lab</span></div> 的 Lab 也被換掉,logo 變成
  // 「Figure實驗室」。已把 'Lab' 從字典移除,但光靠這樣不夠 —— 下次有人加一個
  // 同樣泛用的短字就又中招。品牌名與使用者輸入要在結構上受保護。
  //
  // .img-label-input / [contenteditable] 是使用者輸入的面板標號與文字,
  // 那是資料,不是介面。
  const SKIP_SEL = '.logo, [data-no-i18n], [contenteditable="true"]';

  const norm = s => String(s).replace(/\s+/g, ' ').trim();
  const missing = new Set();

  function protectedNode(el) {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      if (n.matches && n.matches(SKIP_SEL)) return true;
    }
    return false;
  }

  function translateTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const jobs = [];
    let n;
    while ((n = walker.nextNode())) {
      const p = n.parentNode;
      if (!p || SKIP_TAGS.test(p.nodeName)) continue;
      if (protectedNode(p)) continue;
      const raw = n.nodeValue;
      const key = norm(raw);
      if (!key || !/[A-Za-z]{2}/.test(key)) continue;
      const hit = DICT[key];
      if (hit === undefined) { if (key.length <= 70) missing.add(key); continue; }
      // 保留原本的前後空白,否則相鄰的行內元素會黏在一起
      const lead = raw.match(/^\s*/)[0];
      const tail = raw.match(/\s*$/)[0];
      jobs.push([n, lead + hit + tail]);
    }
    for (const [node, text] of jobs) node.nodeValue = text;
  }

  function translateAttrs(el) {
    if (!el || el.nodeType !== 1 || !el.getAttribute) return;
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (!v) continue;
      const hit = ATTR_DICT[norm(v)] || DICT[norm(v)];
      if (hit !== undefined && hit !== v) el.setAttribute(a, hit);
    }
  }

  // 只有子樹全是純排版標籤、且沒有 id/onclick/事件掛點時,才可以整段換掉
  function safeToReplace(el) {
    for (const d of el.querySelectorAll('*')) {
      if (!INLINE_OK.test(d.nodeName)) return false;
      if (d.id || d.getAttribute('onclick') || d.getAttribute('for')) return false;
    }
    return true;
  }

  function translateSentences(root) {
    if (!root.querySelectorAll) return;
    const cands = root.querySelectorAll('span, p, div, li, small');
    for (const el of cands) {
      if (protectedNode(el)) continue;
      const hit = SENTENCE_DICT[norm(el.textContent)];
      if (hit === undefined) continue;
      if (!safeToReplace(el)) continue;
      el.innerHTML = hit;
    }
  }

  function translate(root) {
    if (!root) return;
    try {
      translateSentences(root);
      translateTextNodes(root);
      if (root.nodeType === 1) translateAttrs(root);
      const all = root.querySelectorAll ? root.querySelectorAll('[title],[placeholder],[aria-label]') : [];
      for (const el of all) translateAttrs(el);
    } catch (e) {
      // 翻譯層絕不能弄壞 app:出錯就讓介面維持英文
      console.warn('[i18n] 略過一次翻譯:', e && e.message);
    }
  }

  function start() {
    translate(document.body);
    // JS 動態產生的內容(toast、面板清單、對話框)在這裡補翻
    try {
      new MutationObserver(muts => {
        for (const m of muts) {
          for (const node of m.addedNodes) {
            if (node.nodeType === 1) translate(node);
            else if (node.nodeType === 3) {
              const key = norm(node.nodeValue);
              const hit = DICT[key];
              if (hit !== undefined) node.nodeValue = hit;
            }
          }
        }
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) {
      console.warn('[i18n] MutationObserver 無法啟動,動態內容維持英文:', e && e.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // 偵錯用:__i18n.missing() 列出畫面上還沒翻到的字串
  window.__i18n = {
    dict: DICT,
    attrDict: ATTR_DICT,
    missing() {
      const list = [...missing].sort();
      console.log(`[i18n] 尚未翻譯 ${list.length} 個字串(已翻 ${Object.keys(DICT).length} 個):`);
      console.log(list.join('\n'));
      return list;
    },
    retranslate() { translate(document.body); },
  };
})();
