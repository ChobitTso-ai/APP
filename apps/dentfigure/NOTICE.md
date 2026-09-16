# NOTICE

DentFigure incorporates and derives from third-party open-source work. This notice
records the attributions that must travel with the software. It supplements, and does
not replace, `LICENSE` and `THIRD_PARTY_LICENSES.md`.

---

## FigureLab

DentFigure is derived from **FigureLab**, a browser-based tool for assembling
publication-quality scientific figures.

- **Author:** Michael Baffour Awuah ([ORCID 0009-0007-9036-413X](https://orcid.org/0009-0007-9036-413X)),
  Ramsey Lab, Department of Biology, Texas A&M University
- **Source:** https://github.com/mbaffour/FigureLab
- **Licence:** MIT
- **Version incorporated:** 3.16.0 (+2 commits), pinned at commit
  `e30779666948db7026706d10dd8ae3ae868f9fa0` — see `UPSTREAM.md`

```
MIT License

Copyright (c) 2026 Michael Baffour Awuah

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Citing FigureLab

FigureLab is citable software with a Zenodo DOI. Work that relies on inherited
FigureLab functionality should cite it:

> Awuah, M. B. *FigureLab: a browser-based tool for assembling publication-quality
> scientific figures.* https://doi.org/10.5281/zenodo.21269456

The concept DOI above always resolves to the latest version; version 3.16.0 is
[10.5281/zenodo.22779380](https://doi.org/10.5281/zenodo.22779380).

---

## Embedded scientific icon artwork

`figure_lab.html` embeds 210 SVG icons. **87 are FigureLab's own line art**, MIT with
the project. **123 are third-party artwork under their own licences** — CC0-1.0,
CC-BY-3.0, CC-BY-4.0 and MIT. FigureLab's MIT grant does not cover them.

**41 of those icons (all CC-BY-3.0 or CC-BY-4.0) require attribution wherever they
are used, including inside an exported figure.**

Attributed parties:

- **Servier Medical Art** — https://smart.servier.com/ — CC-BY-3.0 (36 icons)
- **DBCLS** (Database Center for Life Science, TogoTV) — https://togotv.dbcls.jp/en/pics.html — CC-BY-4.0 (5 icons)
- **Bioicons contributors** — https://bioicons.com/ — CC0-1.0 (81 icons) and MIT (1 icon)

Per-icon SPDX identifiers, authors and source URLs are recorded in the `lic` field of
each entry in the `SCIENCE_ICONS` table, and enumerated in `THIRD_PARTY_LICENSES.md`.

> Upstream deliberately excludes CC-BY-SA artwork, on the reasoning that share-alike
> could be read as reaching the figure the icon is placed into — a hazard to hand an
> author who is about to submit a manuscript. **DentFigure retains that exclusion.**

---

## Development-only dependencies

The application itself has **no runtime dependencies**: no CDN, no remote font, no
remote script, no analytics. The following are used only to build and test it and are
not shipped to users:

- **Playwright** (`@playwright/test`) — Apache-2.0 — end-to-end test runner

See `THIRD_PARTY_LICENSES.md` for the full dependency inventory.

---

## Attribution convention for DentFigure's own surfaces

Decided at the baseline; applies to every DentFigure-authored page, footer, About
box, export credit and README badge.

**Use:**

```
© 2026 Tso KY · MIT · derived from FigureLab by M. B. Awuah
```

**Do not use `© Tso KY — All Rights Reserved` on DentFigure.** That string is correct
for Tso KY's other, independently written tools, but on DentFigure it would be wrong
twice over:

1. It contradicts the MIT licence this project is released under — MIT is precisely a
   grant of most of those rights, not a reservation of them.
2. It would assert reserved rights over code Tso KY did not write. DentFigure ships
   `figure_lab.html` in full, so most of the current codebase is Awuah's.

Nothing here restricts Tso KY's own copyright: it sits at the top of `LICENSE` and
covers every DentFigure contribution. The upstream notice sits alongside it because
MIT requires it, not instead of it.

### What is legally required vs. what is convention

| | Required by MIT? |
| --- | --- |
| The upstream copyright + permission notice in `LICENSE` | **Yes** |
| Credit line in the application UI | No — convention |
| Keeping the Zenodo citation path reachable | No — academic convention |

The UI credit and the citation dialog are kept anyway: FigureLab is citable research
software with a DOI, the cost of keeping them is near zero, and a publication tool
that hides its own provenance would be a poor advertisement for a product whose
selling point is provenance.

At the baseline this is already satisfied — `upstream/figurelab/figure_lab.html` is
unmodified and still carries its footer credit (line 2431) and `openCite()` dialog.
The convention above applies when DentFigure starts rendering its own chrome.

## Scope of this notice

This notice covers the state of `apps/dentfigure/` at the baseline commit. **It must be
updated in the same change that adds any new dependency, bundled asset, or icon pack.**

The project scope was reduced on 2026-09-16 (see `docs/MIGRATION_PLAN.md` §1), so no
DICOM or medical-imaging library is planned. The addition most likely to need an entry
here is a **dental icon set** — none of the 210 embedded icons is dental, and a new
pack would carry its own licence and possibly its own attribution obligation.
