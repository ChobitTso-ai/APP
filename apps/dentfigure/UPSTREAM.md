# Upstream: FigureLab

DentFigure derives from **FigureLab** by Michael Baffour Awuah, used under the MIT
licence. This file records exactly which upstream revision DentFigure is built on,
how that revision was verified, and how to sync with upstream later.

## Pinned revision

| Field | Value |
| --- | --- |
| Upstream repository | `mbaffour/FigureLab` — https://github.com/mbaffour/FigureLab |
| Default branch | `master` |
| **Pinned commit SHA** | **`e30779666948db7026706d10dd8ae3ae868f9fa0`** |
| Pinned commit subject | `Splitting a merge produces the row it promises, and the merge control is reachable` |
| Pinned commit date | 2026-09-15 17:58:48 −0500 |
| Declared application version | **3.16.0** (`APP_VERSION`, `figure_lab.html:2437`) |
| Nearest release tag | `v3.16.0` = `639c20a876c834ce24388a838c28471a7d7ee909` |
| Distance from that tag | **2 commits ahead** |
| Licence | MIT — Copyright (c) 2026 Michael Baffour Awuah |
| Concept DOI | [10.5281/zenodo.21269456](https://doi.org/10.5281/zenodo.21269456) |
| v3.16.0 DOI | [10.5281/zenodo.22779380](https://doi.org/10.5281/zenodo.22779380) |
| Author ORCID | [0009-0007-9036-413X](https://orcid.org/0009-0007-9036-413X) |

### Why the pin is a commit, not the tag

The pinned commit is **two commits ahead of the `v3.16.0` tag**:

1. `7c23573` — Record the v3.16.0 Zenodo DOI
2. `e307796` — Splitting a merge produces the row it promises, and the merge control is reachable

The second carries a real, unreleased behaviour change. `APP_VERSION`,
`CITATION.cff` and the README all still say `3.16.0`, so **the version string alone
does not identify this code** — the SHA does. Anything that claims to reproduce this
baseline must cite `e30779666948db7026706d10dd8ae3ae868f9fa0`.

The pin is that commit rather than the tag because that is the tree the baseline test
run below actually executed. Pinning to a revision we did not run would make the
"469 passed" claim unverifiable.

> Note: upstream tags every release (`v3.1.0` … `v3.16.0`, 19 release tags at the time
> of pinning), so tag-based pinning is available for future syncs. This baseline simply
> chose the tested tree.

## Baseline verification

Run against the pinned commit, with no modification to any upstream file:

| Field | Value |
| --- | --- |
| Result | **469 passed, 0 failed, 0 skipped, 0 flaky** |
| Total tests | 469 across 33 `*.spec.js` files |
| Wall time | 3.6 minutes |
| Exit code | 0 |
| Runner | `@playwright/test` **1.60.0** (resolved from upstream's `^1.49.0`) |
| Node | v22.22.2 |
| Browser | Chromium (Playwright build **1194**) |
| Reporter JSON | every test recorded `status: "expected"` |

### Environment deviation — read this before comparing numbers

Playwright 1.60.0 expects Chromium build **1223**, and the container used for this
baseline ships build **1194**, with no `chrome-headless-shell` variant. Upstream's CI
installs its own browser (`npx playwright install --with-deps chromium`) and so does
not hit this.

Rather than edit `tests/playwright.config.js`, the run used an **override config
stored outside the upstream tree** that inherits upstream's config verbatim and only
adds `launchOptions.executablePath` pointing at the available Chromium, plus a JSON
reporter. **No upstream file was modified, and the upstream browser stack was not
changed.** The deviation is:

- full Chromium 1194 headless, instead of headless-shell 1223.

This is disclosed because the suite contains a `deviceScaleFactor` 1-vs-2 measurement
integrity test whose whole point is byte-level canvas determinism. It passed, but it
passed on a different browser build than upstream CI uses. **Re-run on the upstream
browser before treating the 469 as a cross-environment golden number.**

## Sync policy

1. `upstream/figurelab/` holds an **untouched** snapshot of the pinned revision. Do
   not edit anything in it. It exists so that "did we break it, or was it always like
   that?" is answerable by diff.
   **The snapshot must stay complete enough to run its own suite.** The first attempt
   copied only `figure_lab.html`, `LICENSE`, `figurelab-sw.js`, `CITATION.cff` and
   `tests/`, and the run silently dropped to **460 passed** — `encoding.spec.js` reads
   `README.md`, `index.html` and `.zenodo.json` as raw bytes, and skips the checks for
   files it cannot find. Nine tests disappeared without a single failure, which is
   exactly how a baseline quietly stops meaning anything. After adding those three
   files the count is 469 again. When updating the pin, re-check the total, not just
   that nothing failed.
2. **Do not add an upstream git remote.** DentFigure lives inside the App hub
   repository (`apps/dentfigure/`), whose history has nothing in common with
   FigureLab's — a remote would only invite a merge that cannot work. Sync by cloning
   upstream separately and diffing against the snapshot:
   ```
   git clone https://github.com/mbaffour/FigureLab /tmp/figurelab
   diff /tmp/figurelab/figure_lab.html apps/dentfigure/upstream/figurelab/figure_lab.html
   ```
3. **Port selectively.** Once DentFigure is translated and carries dental templates,
   merging upstream's `figure_lab.html` wholesale stops being meaningful. Read the
   upstream changelog, decide per change, port deliberately.
4. Upstream moves fast — v3.9.0 to v3.16.0 landed between 24 July and 15 September
   2026. Expect drift, and re-check before each DentFigure release. Prioritise
   **export-geometry and integrity fixes**: several v3.16.0 entries are corrections to
   exactly the DPI/physical-size maths DentFigure depends on (one dialog was
   reporting sizes 2.03× out).
5. When updating the pin, update this file and re-run the baseline in the same commit.

## Attribution obligations

MIT requires the copyright notice and permission notice to survive in copies and
substantial portions. See `NOTICE.md` and `LICENSE`. FigureLab's own in-app credits
and its `©`/citation text must not be stripped from ported code.

**Separately:** 123 of the 210 icons embedded in `figure_lab.html` are third-party
artwork under CC0-1.0, CC-BY-3.0, CC-BY-4.0 and MIT — *not* under FigureLab's MIT
grant. 41 of them carry an attribution obligation. See `THIRD_PARTY_LICENSES.md`.
