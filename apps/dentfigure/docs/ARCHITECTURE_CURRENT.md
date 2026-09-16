# Current architecture — inherited FigureLab

Inventory of `figure_lab.html` as pinned at `e30779666948db7026706d10dd8ae3ae868f9fa0`
(v3.16.0 + 2 commits). **Descriptive, not aspirational** — this is what the code does
today, so that a later refactor can be checked against it.

Line references are to the pinned `upstream/figurelab/figure_lab.html`.

---

## 0. Shape of the file

| Region | Lines | Size |
| --- | --- | --- |
| `<head>` | 1–12 | — |
| `<style>` | 13–447 | 435 lines of CSS |
| `<body>` markup | 449–2432 | ~1,984 lines |
| `<script>` — **one block** | 2433–19086 | 16,653 lines |
| **Total** | **19,088** | **1,464,408 bytes** |

Supporting files: `index.html` (58 KB marketing/landing page, separate from the app)
and `figurelab-sw.js` (optional network-first service worker for the hosted copy).

Everything in the script block shares **one global scope**:

| | Count |
| --- | --- |
| Top-level `let` (mutable globals) | **98** |
| Top-level `const` | 84 |
| Top-level `function` declarations | **651** |
| `id="…"` attributes in markup | 372 |
| …of which read back as state via `gv`/`gi`/`gc` | **91** |
| Inline `onclick=` handlers in markup | **259** |

There are no modules, no classes for the domain model, no build step and no imports.
Functions call each other directly by global name; the markup calls them through
`onclick`. This is the single most important fact about the codebase: **there is no
seam anywhere.** Any two features can reach each other.

---

## 1. Application state

State lives in **three places at once**, which is the central structural problem.

### 1.1 JavaScript globals

The domain model proper:

| Global | Line | Holds |
| --- | --- | --- |
| `images[]` | 2451 | grid panels — the primary model |
| `freeformElements[]` | 2509 | freeform-mode objects (image, text, shape, chart, genemap, flowchart, connector, paint, icon) |
| `annotations[]` | 2452 | canvas-level annotations |
| `measurements[]` | 2526 | recorded ROI/line/count results |
| `undoStack[]` / `redoStack[]` | 2464–65 | history (cap 80) |
| `colGaps` / `rowGaps` / `advancedSpacing` | 2499–2501 | per-gutter spacing overrides |
| `labelOffsets` | 2468 | dragged label positions |
| `layoutMode` | 2508 | `'grid'` \| `'freeform'` |
| `reproLog[]` | 17801 | provenance action log |
| `zoom`, `selectedPanel`, `selectedElems`, `activeTool`, … | various | view/interaction state |

Roughly 40 further globals are transient interaction state — `panelDragState`,
`gutterDragState`, `annResizeState`, `elemRotateState`, `_sbResizeState`,
`panelRotState`, … — one per drag gesture. Upstream v3.16.0 fixed a class of bug
where four of these were never cleared if the pointer was released off-canvas, which
is exactly the failure mode this pattern invites.

A panel object (`_commitImage`, 3274) carries ~45 flat fields — identity, pixels,
crop, transform, display, scale bar, label offsets, spans, channels, panel
annotations — with no nesting and no schema.

### 1.2 The DOM as a state store — the critical finding

**91 distinct form controls are the authoritative store for layout, style and export
settings.** There is no JavaScript object holding them. They are read on demand:

```js
const gv = id => document.getElementById(id)?.value ?? '';   // 12303
const gi = id => parseInt(gv(id)) || 0;                       // 12308
const gc = id => document.getElementById(id)?.checked ?? false; // 12309
```

`render()` reads ~25 of them directly (5756–5797) every frame. Consequences:

- **`render()` cannot run without a live DOM.** No unit test, no server-side render,
  no worker.
- **Undo must snapshot the DOM.** `captureLayout()` (8457) walks a hard-coded id list
  and `applyLayoutSnapshot()` (8465) writes it back.
- **Saving must serialise the DOM.** `serializeSession()` (11758) reads the same ids.
- Those three id lists (`_layoutTextIds`, `_layoutCheckIds`, and the inline list in
  `serializeSession`) are **maintained separately and can drift**. v3.16.0 fixed
  exactly that: templates and share links silently dropped `colGaps`/`rowGaps`.

### 1.3 Caches hung off model objects

Panels and elements carry lazily-built caches — `_adjCache`/`_adjKey`,
`_cropCache`/`_cropKey`, `_compCache`, `_chartCache`, `_genemapCache`, `_paintCanvas`
— invalidated by comparing a recomputed key string. Undo and serialisation must strip
them (`cloneImageForUndo` 8423, `cloneElemForUndo` 8430). **Forgetting to invalidate
is a live footgun**; the code does it by hand at ~6 call sites.

---

## 2. Image import pipeline

`addFiles()` (3089) → decode → optional pre-crop → `_commitImage()` (3252).

1. **Decode by type.** SVG keeps its source text (`_loadSVGFile`, 3075) so it can be
   re-emitted as vector on export. TIFF is decoded by a **hand-written decoder inside
   the file** — raw/LZW/PackBits/Deflate, strips and tiles, 8/16/32-bit, big- and
   little-endian, CMYK, palette, bilevel, multipage, JPEG-in-TIFF
   (`lzwDecodeTIFF`, 2995 and neighbours).
2. **Retain native samples.** For 16-bit and float TIFFs the original samples are kept
   on `im.raw` alongside the 8-bit display bitmap, capped at `RAW_PIXEL_CAP = 24e6`
   pixels (2681). This is what makes honest measurement possible (§7).
3. **Read calibration and acquisition time from metadata** — ImageJ, OME-XML, and
   TIFF resolution tags — producing `{umPerPx, source, deltaT, acqTime, timeSource}`.
4. **Guess the channel** from the filename (`_detectChannel`, 3311): DAPI/GFP/RFP/Cy5/
   Merge/BF, each mapped to a LUT.
5. **Optional pre-crop** on import (`_openPreCrop`, 3145), queued so multiple files
   are handled one at a time.
6. **Commit.** `_commitImage` builds the panel object, assigns the next free letter
   (`nextLabel`, 3297), pushes an undo step, logs `addImage` to `reproLog`, re-renders.

Entry points: drop zone, file input, clipboard paste, and paste-from-URL.

**Gaps against DentFigure's needs:** no DICOM. No SHA-256 of source bytes. No asset
class. No privacy state. Original filename is stored and is serialised into saved
sessions — a PHI leak path, since filenames routinely carry names and chart numbers.

---

## 3. Grid and freeform layout

Two modes behind one `render()`, switched by `layoutMode` and `setLayoutMode()` (12548).

### Grid (default)

Canvas size is computed, not measured:

```
totalW = rowLblW + mLeft + cols*panelW + totalGapsW(cols, gapH) + mRight
totalH = titleH + mTop + colLblH + rows*panelH + totalGapsH(rows, gapV) + mBtm
```
(5780–5781)

Gutters may be uniform or **individually overridden**: `colGaps`/`rowGaps` are
`Array(n-1)` of `number|null`, resized to the grid by `syncGapArrays()` (5628), summed
by `totalGapsW/H` (5644–45) and `spanGapsW/H` (5647–48) for panels that span cells.
Gutters are draggable directly on the canvas (`gutterAtPoint` 5686, `setGutter` 5706)
with `+`/`−` chips.

Panels support `colSpan`/`rowSpan`. Empty grid slots are `null` in `images[]` and are
preserved through save/load, so a deliberately blank cell keeps its place.

### Freeform

`freeformElements[]` of absolutely-positioned objects with `x/y/w/h/zIndex/rotation`,
supporting rubber-band select, multi-select drag, snap guides, alignment and
distribution, format painting, and z-ordering. Element types go well beyond images:
charts (bar/line/scatter/box/violin/beeswarm/heatmap/Kaplan–Meier), flowcharts with
anchored connectors (PRISMA/CONSORT/fishbone), SBOL gene maps and genetic circuits,
paint layers, and the icon library.

**For DentFigure:** the grid engine is the valuable part and is straightforward to
extract. The freeform engine is large, and most of its element types (SBOL, plasmid
maps, Kaplan–Meier) have no dental use. It should be inherited, not rewritten, and not
extended.

---

## 4. Rendering pipeline

**One function renders everything:** `render(targetCanvas, exportScale, opts)` (5724),
~1,000 lines.

- No arguments → on-screen preview at logical size into `#fig-canvas`.
- `targetCanvas` + `exportScale` → off-screen supersampled export render.

This single-path design is why the export matches the preview, and **it must be
preserved.** Splitting preview and export into two code paths would reintroduce the
whole class of "looked right, exported wrong" bugs.

Mechanics:

- All drawing is in **logical units**; one outer `ctx.setTransform(S,0,0,S,0,0)`
  (5785) scales to backing pixels. Nothing downstream knows the export scale.
- `opts.skipLabels` may be `true` (skip all text — SVG export re-emits it as vector)
  or **a predicate** (PDF export skips only text its embedded base-14 font cannot
  represent, so unrepresentable text stays in the raster instead of being mangled or
  silently dropped).
- Per-render side-channel arrays are rebuilt each frame for hit-testing:
  `panelBounds`, `figTextItems`, `_sbBars`, `_insetFrames`, `_insetConnectors`,
  `_lastFrames`, `_lastCells`.
- **Two-layer preview.** `#fig-canvas` is the analysis buffer at `deviceScaleFactor`
  1; `#fig-canvas-hd` (6161–6178) is a crisp devicePixelRatio copy drawn after the
  user pauses. The split exists so **HiDPI display never corrupts measurement** — and
  it is covered by a test asserting the analysis buffer is byte-identical at dSF 1 and 2.
- Redraws are debounced via `scheduleRender(d=250)` (5618) on a rAF handle.
- Annotations are drawn to a separate overlay canvas (`drawAnnOverlay`, 8724) on
  screen, but composited into the main canvas for export.

---

## 5. Annotations

Two distinct systems, deliberately:

| | Canvas annotations | Panel-bound annotations |
| --- | --- | --- |
| Stored in | `annotations[]` (2452) | `im.panelAnns[]` per panel |
| Coordinates | figure canvas | **fractional, relative to the panel** |
| On panel reorder | stay put | **follow the panel** |
| Created by | tool buttons | double-click inside a panel |

Fractional panel-relative coordinates are the right model and the one DentFigure
should keep: a panel can be moved, resized or re-laid-out without its arrows drifting.

Shapes: arrow, line, rect, ellipse, text (with halo), inset markers, brackets.
Drawn by `drawAnnotationSingle` (8606) / `drawShape` (9870) / `drawAnnotations` (9827).
A layer panel allows rename/hide/lock.

Text annotations are held out of the raster and written as real `<text>` in SVG and as
PDF text operators where the base-14 font allows, so labels stay editable and never
pixelate.

---

## 6. Crop and transform

**Fully non-destructive.** The source bitmap is never modified.

Stored per panel: `cropT/L/B/R` as **percentages** (0–100), `cropAngle` in degrees,
`cropShape` (`rect` | ellipse | …), plus `rotate`, `flipH`, `flipV`.

`_cropGeomOf(iw, ih, cl, ct, cr, cb, angDeg)` (6206) is the pure geometry kernel. It
returns the source rect **and the forward/inverse maps** `toSrc` / `toFrame`, plus
`corners()` for the tilted region. Because the rotation is rigid, lengths are
preserved and the straightened canvas stays 1:1 with source pixels — which is what
keeps calibrated measurement valid through a tilt.

- `_cropOverflows` (6235) detects a tilted crop reaching outside the image and shows
  it in the editor rather than letting it surface as transparent corners in the export.
- `_straightenImg` (6243) resamples a tilted region upright, cached by
  `_cropStraight` (6257) on a key string.
- `_cropDraw` (6270) is the single accessor every blit site uses, so the tilted and
  untilted paths cannot drift apart.

This is the cleanest, most extractable subsystem in the file: pure functions, no DOM,
no globals. **It should be the first thing lifted into a module.**

---

## 7. Measurement

The most scientifically careful subsystem, and the one whose *design philosophy*
DentFigure most needs to inherit.

`handleMeasureTool` (17217) → `_measureCtx` (17433) → `measureAndShowROI` (17440) /
`measureAndShowLineProfile` (17510) / `countCellsROI` (17825).

Three behaviours worth preserving verbatim:

1. **Measure native samples, not the display.** When `im.raw` is present and matches
   the committed pixels, statistics are computed on the acquisition-bit-depth samples
   *before* any brightness/contrast/gamma/LUT, and the result is labelled with the
   real bit depth. Otherwise it reports on the 8-bit display and says so
   (`_MEASURE_DISCLAIMER`, 17256 vs `_RAW_MEASURE_NOTE`, 17273).
2. **Withhold rather than guess.** `_panelSourceMap` maps figure-canvas pixels back to
   source pixels. When it cannot — rotated, flipped, shape-cropped or a channel merge —
   µm² is **not reported**, with an explicit reason. Multiplying canvas pixels by µm/px
   would be wrong by the display scale, often 5–50×.
3. **Report what was actually measured.** A selection extending past the panel reports
   the pixel count actually summed, and flags saturation at the sensor maximum.

For a tilted crop, a selection that is axis-aligned on screen is a quad in the source,
and is measured as a quad (`_rawStatsQuad`) rather than as a bounding rect that would
sweep in unselected pixels.

**Dental caveat that must be added:** this machinery gives *pixel* honesty. It says
nothing about projection geometry. PA and panoramic radiographs carry magnification
and distortion; millimetres derived from them are not true anatomical millimetres
regardless of how careful the pixel maths is. DICOM pixel spacing is reliable in a way
a calibrated JPEG is not, and the UI must say so.

---

## 8. Audit and integrity

| Function | Line | Does |
| --- | --- | --- |
| `checkCompliance` | 8055 | journal-preset check: DPI, physical size, type size, AI disclosure |
| `doExportPreflight` | 4019 | pre-save dialog: true pixel dimensions, physical size, effective DPI |
| `runDuplicateScan` | 17061 | panel-level duplicate detection |
| `_regionDupScan` | 16929 | **region-level** duplicate detection |
| `auditConsistency` | 10112 | style homogenizer (freeform) |
| `logAction` / `reproLog` | 17802 | append-only action log |

Duplicate detection is genuinely engineered: 32 px thumbnails, a dihedral sweep over 8
transforms so a rotated or mirrored reuse is still caught, then keypoint + patch NCC
matching for partial-region reuse, with measured (not guessed) thresholds
(`_RDUP_T = 0.80`, 16796). Blank panels are excluded rather than guessed at.

Upstream's stated integrity stance, which DentFigure inherits: **no p-value or
statistical inference is ever computed**, pixel edits are non-destructive overlays,
and AI content is disclosed as a warning and never as a pass/fail.

**Provenance gaps — the significant ones for DentFigure:**

- `reproLog` is **not serialised into a saved session** (confirmed: it does not appear
  in `serializeSession`). Save, reload, and the entire action history is gone.
- The only SHA-256 in the file (18303–18313) hashes the **canonical figure settings**,
  not source pixels. There is **no hash of any source asset**.
- There is **no privacy or PHI subsystem at all.** One command-palette entry mentions
  "redact" as a synonym for a cover patch. Nothing tracks whether a source was
  reviewed for visible identifiers.

---

## 9. Export

`renderExportCanvas(dpi, opts)` (10250) supersamples through `render()`, then a
per-format writer runs.

### The dimension maths — treat as golden

```js
function _exportScaleFor(dpi){                      // 10210
  const mm = getTargetWidthMm(), lw = canvasLogicalW || 1;
  if (mm > 0) return (mm/25.4) * dpi / lw;          // printed width drives it
  return Math.max(1, dpi/96);                        // else one logical px = 1/96"
}

function _effDpiForPixels(px, scale){               // 10244
  const mm = getTargetWidthMm();
  if (mm > 0) return Math.max(1, Math.round(px/(mm/25.4)));
  return Math.max(1, Math.round(scale*96));
}
```

`scale*96` and the real DPI **are equal only when no printed width is chosen.**
Confusing the two is not hypothetical: in v3.16.0 the Save dialog announced
2131 × 2069 px / 180 × 175 mm for a file that was really 1051 × 1020 px / 89 × 86 mm —
2.03× out, on the last screen before the file is written. Everything that writes
physical size into a file (PNG `pHYs`, TIFF `XResolution`, PDF `/MediaBox`) must use
`_effDpiForPixels`.

A 60 MP cap (`MAXPX = 60e6`, 10253) degrades scale rather than failing, and reports
the **effective** DPI it actually achieved.

### Formats

| Format | Writer | Notes |
| --- | --- | --- |
| PNG | canvas | `pHYs` physical-size chunk |
| JPEG / WebP | canvas | |
| TIFF | `exportTIFF` (11149) | true target pixel dimensions, not just a DPI tag |
| PDF | ~10800 | hand-written; base-14 font resources, real text operators, correct `/MediaBox`, y-up coordinates, escaped strings, multipage |
| SVG | `exportSVG` (10981) | labels, inset outlines and connectors as real vector |
| PPTX | | editable slide export |
| CSV | `exportCSV` (5586) | panel metadata |
| R / Python | `exportR` (12089), `exportPython` (12143) | reproducibility scripts |

TIFF and PDF are written **by hand, byte by byte, with no library**. The test suite
reflects that: it reads exports back with pdf.js and asserts the xref table matches
the objects written. **Do not touch these without the tests.**

---

## 10. Session save/load

`serializeSession(bundleImages)` (11758) → plain JSON. `applySession(s)` (11838)
restores it. `saveJSON` / `loadJSON` wrap them.

Two modes: **bundled** (image `src` data URLs included — self-contained, large) and
**lightweight** (settings only; re-drop the files). AI-generated images keep their
pixels even in lightweight mode, because a user photo can be re-dropped and a
generation cannot be reproduced.

Persistence: `localStorage` autosave under `fl-autosave-v2` (17585) with crash
recovery, and IndexedDB `figurelab`/`sessions` (17646) for named sessions.

**Three defects DentFigure must fix before building on this:**

1. **No `schemaVersion`.** The serialised object carries no version field at all.
   `applySession` duck-types every branch (`if (s.layout) …`). There is no way to
   detect an old file, migrate it, or refuse a newer one. `DentFigure_PROJECT_HANDOFF.md`
   §10 requires `schemaVersion` and `appVersion` — **this is the single highest-value
   fix available, and it gets harder every release.**
2. **`reproLog` is not saved**, so provenance does not survive a round trip.
3. **Original filenames are serialised** (`name:im.name`), and filenames carry PHI.
   The handoff (§10) requires a neutral display alias with the original kept
   out of exports.

`measurements[]` *is* saved. `undoStack`/`redoStack` are not — history does not
survive a reload, which is normal and fine.

---

## 11. Undo / redo

Whole-state snapshots, not commands.

`snapshotState()` (8475) captures `images` (deep-ish via `cloneImageForUndo`),
`annotations`, `freeformElements` (via `cloneElemForUndo`), **`captureLayout()` — the
DOM**, `colGaps`, `rowGaps`, `labelOffsets`, `advancedSpacing`, `layoutMode`.
`restoreState()` (8487) writes it all back, including into the DOM.

- `pushUndo()` (8506) snapshots and schedules an autosave. Cap **80** steps (8505);
  a new step clears the redo stack.
- Clone helpers strip caches and deep-copy nested structures so a snapshot can never
  share an object with the live model — with type-specific rules for paint, chart,
  genemap and connector elements.
- Form controls get **one undo step per gesture** via arm-on-pointerdown/keydown,
  commit-on-change (`_armUndo`, 8524–8530), using a capture-phase document listener
  and a CSS selector allowlist (`_UNDO_SEL`).

**Costs.** Snapshots are O(state) in time and memory, and `images` entries retain live
`img` element references, so 80 steps over a large figure is not cheap. It works here
because panels number in the tens. **A CBCT volume must never enter an undo snapshot.**

**Coverage gap:** undoability depends on `pushUndo()` being called by hand at every
mutation site, and on `_UNDO_SEL` matching the control. A control added outside those
selectors is silently not undoable. v3.16.0 fixed exactly this for journal presets,
which rewrote panel size, gaps, fonts and export width with no undo entry — "trying a
house style to see what it looked like was a one-way door."

---

## 12. Test suite

33 `*.spec.js` files, **469 tests**, Playwright against `file://`, `workers: 1` for
determinism. Baseline: **469 passed, 0 failed** (see `../UPSTREAM.md`).

Any uncaught page error or `console.error` fails the suite. `encoding.spec.js` never
opens a browser — it reads repo files as **bytes**, checking for CP1252 mojibake, a
UTF-8 BOM, invalid UTF-8, a missing `<meta charset>`, and version disagreement across
release files. It exists because a PowerShell round-trip once double-encoded 519
em-dashes and the entire suite still passed: nothing was looking at bytes.

The suite's centre of gravity is precision, not coverage of clicks: export geometry,
PDF internals, coordinate round-trips, and the dSF 1-vs-2 measurement-integrity
assertion. **This is the asset that makes a refactor survivable.**

---

## 13. Technical debt and risk register

Ordered by risk to DentFigure.

| # | Risk | Evidence | Impact |
| --- | --- | --- | --- |
| 1 | **No session `schemaVersion`** | `serializeSession` 11758 | Cannot migrate or reject project files. Compounds every release. |
| 2 | **DOM is the state store** | 91 ids via `gv`/`gi`/`gc`; `captureLayout` 8457 | Blocks unit tests, workers, and any non-DOM render. The main obstacle to modularisation. |
| 3 | **No privacy/PHI layer** | one "redact" synonym in the whole file | Must be built from nothing; the product is unshippable to clinicians without it. |
| 4 | **Gemini path uploads image bytes** | 16186, 16217 | A patient image can leave the machine. Must be gated by asset class before any clinical use. |
| 5 | **Provenance does not persist** | `reproLog` absent from `serializeSession` | Contradicts the provenance-first principle. |
| 6 | **No source hashing** | only a settings hash, 18303 | Cannot prove a panel came from a given file. |
| 7 | **Filenames (PHI) are serialised** | `name:im.name`, 11775 | Direct leak path into saved and shared files. |
| 7b | **All three persistence layers store image pixels by default** | autosave `write(true)` 17597; named sessions `serializeSession(true)` 17671, 17682 (hard-coded); `saveJSON` bundles unless told otherwise 11822 | On a shared clinic machine, `localStorage` survives browser close and reboot, and `checkAutosave()` (17618) offers the next user a **Restore** button that reinstates the previous patient's images. Not a network leak — a device-residency and multi-user exposure. Only the download path has a lightweight option at all; the two on-device layers have none. |
| 8 | **One 16,653-line global scope** | 98 globals, 651 functions, 259 inline `onclick` | No seam; every change is global-blast-radius. |
| 9 | **Undo cost is O(state)** | `snapshotState` 8475, cap 80 | Will not survive volumetric data. |
| 10 | **Hand-rolled TIFF/PDF/SVG writers** | `exportTIFF` 11149, PDF ~10800 | High-value, high-risk, well-tested. Do not touch casually. |
| 11 | **Manual cache invalidation** | `_adjKey`/`_cropKey` at ~6 sites | Stale-render bugs on any new transform. |
| 12 | **Transient drag state as globals** | ~40 `*State` globals | Already produced the stranded-drag bugs fixed in v3.16.0. |
| 13 | **Version string does not identify the code** | `APP_VERSION` 3.16.0 at HEAD+2 | Pin by SHA, always. |
| 14 | **Three parallel "what is state" lists** | `_layoutTextIds`, `_layoutCheckIds`, `serializeSession` | Already caused dropped `colGaps` in templates and share links. |

## 14. What to keep, unchanged

Not everything here is debt. These are correct and hard-won:

- **One `render()` for preview and export.** The reason exports match the screen.
- **The crop geometry kernel** (`_cropGeomOf`) — pure, invertible, rigid.
- **Non-destructive transforms** throughout; the source bitmap is never rewritten.
- **The analysis/display canvas split** that keeps HiDPI from corrupting measurement.
- **Measurement that withholds a number it cannot justify** rather than guessing.
- **Per-icon licence records with an allowlist enforced by a test.**
- **Fractional panel-relative annotation coordinates.**
- **The 469-test suite**, especially its export-geometry and byte-level assertions.
