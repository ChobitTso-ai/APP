# Third-party licences

Inventory of every third-party component in DentFigure, as of the baseline commit
(FigureLab `e30779666948db7026706d10dd8ae3ae868f9fa0`, v3.16.0+2).

**Update this file in the same change that adds a dependency or a bundled asset.**

---

## 1. Runtime dependencies

**None.**

The application is a single HTML file that fetches no stylesheet, script, font or
image from the network. Verified at the baseline commit:

- no `<link rel="stylesheet">`, no `@import`, no `fonts.googleapis.com` / `fonts.gstatic.com`
- no bundled `node_modules`, no vendored library directory
- the two display typefaces are *named* in CSS font stacks only — a font name costs
  no request, and users who have them installed get the intended look

This is a deliberate upstream property and a hard requirement for DentFigure's
local-first design. It should be enforced by the network-honesty test described in
`docs/MIGRATION_PLAN.md`.

### Outbound network calls that do exist

All are user-initiated and opt-in. None runs on load; none is telemetry.

| Site | Destination | Trigger |
| --- | --- | --- |
| `figure_lab.html:2615` | arbitrary URL pasted by the user | user pastes an image URL |
| `figure_lab.html:16186`, `:16217` | `generativelanguage.googleapis.com` (Google Gemini) | user supplies an API key and clicks Generate |
| `figure_lab.html:16265` | `http://127.0.0.1:7860` (local Automatic1111) | user configures a local Stable Diffusion endpoint |

Two further `fetch()` calls (`:10465`, `:16504`) read `blob:`/`data:` URLs the app
itself produced; they leave neither the page nor the machine.

> **Clinical risk — carry this into DentFigure's threat model.** The Gemini path
> uploads image bytes to Google. Under `DentFigure_PROJECT_HANDOFF.md` §9.2 that path
> must be unreachable for `primary-research-image` assets, which includes every
> patient radiograph, CBCT-derived panel and clinical photograph. Inheriting the
> feature without gating it would let a patient image leave the machine.

---

## 2. Development-only dependencies

Not shipped to users. Installed under `tests/`.

| Package | Version | Licence | Source |
| --- | --- | --- | --- |
| `@playwright/test` | 1.60.0 | Apache-2.0 | https://github.com/microsoft/playwright |
| `playwright` | 1.60.0 | Apache-2.0 | https://github.com/microsoft/playwright |
| `playwright-core` | 1.60.0 | Apache-2.0 | https://github.com/microsoft/playwright |

(`figurelab-tests@1.0.0` is the private local test package itself, not a dependency.)

Upstream declares `@playwright/test: ^1.49.0`; 1.60.0 is what that range resolved to
for the baseline run.

---

## 3. Derived source code

| Component | Licence | Holder |
| --- | --- | --- |
| FigureLab (`figure_lab.html` and supporting files) | MIT | Copyright (c) 2026 Michael Baffour Awuah |

Full text and citation details in `NOTICE.md`. Pinning details in `UPSTREAM.md`.

---

## 4. Embedded icon artwork — **attribution obligations live here**

`figure_lab.html` embeds **210** SVG icons in its `SCIENCE_ICONS` table. They do not
share one licence.

| Licence | Count | Attribution required? | Attributed to |
| --- | --- | --- | --- |
| *original* (MIT with FigureLab) | 87 | No | FigureLab |
| CC0-1.0 | 81 | No | Bioicons contributors |
| CC-BY-3.0 | **36** | **Yes** | Servier Medical Art |
| CC-BY-4.0 | **5** | **Yes** | DBCLS |
| MIT | 1 | No | Bioicons contributors |
| **Total** | **210** | **41 require attribution** | |

Each icon carries its own `lic:{spdx, author, src}` record in the source. Upstream
enforces an allowlist in code and in a test:

```js
const ICON_LICENSES_ALLOWED = ['original','CC0-1.0','MIT','CC-BY-3.0','CC-BY-4.0','public-domain'];
const ICON_LICENSES_ATTRIB  = ['CC-BY-3.0','CC-BY-4.0'];   // these require a credit line
```

**CC-BY-SA is deliberately excluded** and must remain excluded: share-alike can be
read as reaching the figure the icon is placed into, which is not a risk to hand an
author about to submit a manuscript.

### 4.1 Licensors

- **Servier Medical Art** — https://smart.servier.com/ — CC-BY-3.0
- **DBCLS** (Database Center for Life Science / TogoTV) — https://togotv.dbcls.jp/en/pics.html — CC-BY-4.0
- **Bioicons** — https://bioicons.com/ — CC0-1.0 and MIT

### 4.2 The 41 icons that require a credit line

**CC-BY-3.0 — Servier Medical Art (36):**
Adipocyte 1 · Antibodies · Antibody · Antibody Ligand 1 · Antibody Radio Tag 2 ·
Cap Pipette · Cell Culture Equipment 1 · Cell Epidermis 1 · Cell Scraper ·
Counting Chamber Lemaur · Counting Raster · Double Concave Lens · Double Convex Lens ·
Drug Capsule 2 · Drug Tablet 3 · Enzyme Blue · Erythrocyte · Falciform Erythrocyte 2 ·
Falciform Erythrocytes · Fibrin 1 · Glass Slide Flat · Glass Slide Top ·
Glassslide Top · Glassslideflat · Hexagon Lightpink · Implant · Ions Blue ·
Keratinocyte 1 · Liver · Negative Meniscus Lens · Neonatal Cardiomyocytes 1 ·
Ointment · Patch · Pessary · Protein 1 · Tight Junction 2

**CC-BY-4.0 — DBCLS (5):**
Alpha Helix · Fission Yeast · Honey Bee Eggs · Nematode Simplified · Ring Tweezers

### 4.3 Obligation DentFigure must not drop

If a figure uses one of those 41 icons, the credit must reach the reader — not merely
sit in this file. Upstream generates a credit line; **any DentFigure export path,
submission ZIP or template that can carry an icon must carry its credit too.**

Note for the dental roadmap: none of the 210 icons is dental. Any dental icon set
added later needs its own licence review before it is embedded, and its own row here.

---

## 5. Test fixtures

`tests/fixtures/` contains synthetic TIFF images, a GenBank sample and a mojibake
sample, generated by upstream (`make_time_fixtures.py`) for regression testing. They
carry no patient data and no third-party licence claim.

**Rule for DentFigure:** DICOM fixtures must be synthetic or formally de-identified,
with documented provenance and licensing. Never commit real patient DICOM.

---

## 6. Additions to review before they ship

The project scope was reduced on 2026-09-16 (see `docs/MIGRATION_PLAN.md` §1): no
DICOM, no Cornerstone3D, no build toolchain. **DentFigure therefore stays at zero
runtime dependencies**, which is what lets it live in `apps/dentfigure/` alongside the
App hub's other single-file tools and deploy with no build step.

If that changes, every new package needs its own row here with the version actually
locked, before it ships. Do not assume a package is MIT because the project it belongs
to is described as MIT — verify per package, per version.

One addition *is* expected in this scope: **dental icons.** None of the 210 embedded
icons is dental. Any dental icon set added later needs its own licence review and its
own row in §4, and must respect the CC-BY-SA exclusion above.
