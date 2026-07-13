# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project does

Scrapes daily water flow (caudales) data from `aic.gov.ar/sitio/caudales` and publishes it as JSON + a React dashboard on GitHub Pages. The `caudales` branch is the working branch — a Raspberry Pi runs the scraping pipeline every 4 hours (`scripts/run_publish_on_pi.sh` via systemd, see `deploy/README.md`) and commits scraped data directly to it.

## Commands

### Python scraper

```bash
source .venv/bin/activate   # or: source activate
python scraper_app.py       # run the scraper manually
python -m unittest tests/test_scraper.py  # run tests (must run from repo root)
```

### Frontend (front/)

```bash
cd front
npm install
npm run dev      # local dev server
npm run build    # build to dist/ (CI then copies dist/* → docs/)
npm run lint
```

## Architecture

### Data pipeline

`scraper_app.py` fetches the AIC HTML page → `DataGatherer.parse()` extracts the table (`#body_TablaCaudales`) → saves a dated JSON file to `docs/DD_MM_YYYY.json` and rewrites `docs/latest.json` (a real-file copy of the most recent dated file — same pattern for `lakes.json` and `weather.json`; these aliases were symlinks in the past, never reintroduce symlinks under `docs/`).

The data model is:
- `Sections` → list of `Section` (id, title, order, levels)
- `Section.levels` → list of `Level` (type: `"dispensed"` | `"programmed"`, date, min, max, dispensed)
- Each section has one `dispensed` level (yesterday's actual flow) and five `programmed` levels (upcoming min/max forecasts)

Parsing relies on `es_ES.UTF-8` locale to parse Spanish month names in the date string (e.g., "domingo, 21 de julio de 2025").

### Section ids and river grouping

`sections_config.json` (repo root) is the single source of truth for section ids and river grouping. `sections` is ordered to match the AIC table's row order — `DataGatherer` assigns `Section.id` by **table row position**, not by scraping the title (`section.title` is still scraped and kept in the output JSON for reference, but ids are hardcoded). If AIC adds/removes/reorders a table row, `DataGatherer.parse()` raises `ValueError` rather than guessing — update `sections_config.json` to match, keeping the `sections` array's own position untouched (it must keep mirroring the physical table row order). Each section's `display_order` is a separate, purely visual field — it controls the on-screen order within its river group (`front/src/config.js`'s `RIVER_GROUPS`) independently of the array position used for id assignment, so the two can differ (e.g. reordering Arroyito before Pichi Picún Leufú on screen without touching how ids map to table rows). `rivers` defines the three basins (`limay`, `neuquen`, `rio_negro`) in display order; each section has a `river_id`. `legacy_id_aliases` maps old ids (e.g. the pre-rename `el_chanar_+_arroyito`) to current ones, so historical dated JSONs and any not-yet-refreshed published files still resolve correctly — `compute_ranges.py` (Python) and `front/src/config.js` (`normalizeId`, frontend) both apply it.

`lakes` (same file) maps embalse/reservoir ids — slugified from the scraped name by `LakesGatherer._slug` (`scrapper/lakes_gatherer.py`), not hardcoded like section ids — to a `river_id`, in upstream→downstream display order. Unlike `sections`, this array carries no row-position meaning; it exists purely to group `LakesSection.jsx` (`front/src/components/`) into the same river headers used for caudal sections, via `LAKE_RIVER_GROUPS` in `front/src/config.js`. A reservoir AIC adds that isn't yet in `lakes` falls back into an "other" group rather than being dropped, same pattern as `RIVER_GROUPS`'s `otherIds` handling in `App.jsx`.

### Frontend

The React app (`front/src/`) fetches `latest.json`, `min_max_levels.json`, and `weather.json` at runtime (relative URLs, since it's served from `docs/`), normalizing any ids through `normalizeId` (`front/src/config.js`). `min_max_levels.json` contains historical min/max bounds per section used for gauge rendering. River groups (`RIVER_GROUPS` in `front/src/config.js`) and display strings (`front/src/i18n/es.json`, looked up via `t()` in `front/src/i18n/index.js`) are both derived from `sections_config.json` — no section/river names are hardcoded in components. The built output is committed into `docs/` and served via GitHub Pages at `danitinez.github.io/aic-caudales/`.

The Vite base path is set to `/aic-caudales/` to match the GitHub Pages subpath. The dev server's `server.fs.allow` is widened to the repo root so it can serve `sections_config.json` from outside `front/`.

### Basin map (mini maps + modal)

Each caudal section card shows a clickable mini map (`front/src/components/BasinMap.jsx`) of the Limay/Neuquén/Negro basin with that section's river stretch highlighted; clicking opens a modal zoomed to the stretch (with a "whole basin" toggle). The SVG (`front/src/assets/basin-map.svg`) is generated, not hand-drawn:

- `scripts/build_basin_data.py` — fetches real geometry from OpenStreetMap (province polygon, river centerlines chained/simplified from OSM ways, lake polygons), snaps dams onto the river lines and writes `scripts/basin_map_data.json` (committed; ODbL attribution required, shown in the modal). Only re-run to refresh geometry; downloads cache in `<tmp>/aic-basin-cache`.
- `scripts/gen_basin_map.py` — renders the SVG from that JSON offline. River stretches get `id="tramo-<section_id>"` matching `sections_config.json`, per-section zoom viewBoxes are embedded as `data-vb-<section_id>` attributes on the svg root, and labels/markers sit in `<g class="map-labels">`/`<g class="map-markers">` so the mini rendering can hide them. Rerun after changing labels/marker positions.

`BasinMap.jsx` imports the SVG with Vite's `?raw`, toggles the highlight by string-replacing the tramo's class, and reads the `data-vb-*` viewBoxes for the modal zoom. Map colors are `--map-*` CSS vars defined in `front/src/index.css` (light + dark). A section id without a tramo on the map renders no mini (same fallback spirit as `otherIds`).

### Feedback form (email)

`front/src/components/FeedbackForm.jsx` is an in-page contact form. Since GitHub Pages is static (no backend), it POSTs submissions to **Web3Forms** (`https://api.web3forms.com/submit`), which emails them to **info@develope.ar**. The footer's "Enviar opiniones" link scrolls to it (`#opiniones`).

The `ACCESS_KEY` in that file is a **public** Web3Forms routing key — it only directs mail to that inbox, grants no account/inbox access, and is exposed in the client bundle regardless, so it's safe to commit. To change the destination inbox or rotate the key, get a new one at https://web3forms.com and replace the constant. A honeypot `botcheck` field provides basic spam protection.

### Publishing (Raspberry Pi + CI fallback)

The primary data pipeline runs on a Raspberry Pi: a systemd timer (`deploy/systemd/aic-caudales.timer`, every 4 hours UTC) runs `scripts/run_publish_on_pi.sh` in a dedicated automation clone, which pulls `caudales`, runs `scraper_app.py` (requires `es_ES.UTF-8` locale), `compute_ranges.py --write`, then `lakes_scraper.py` and `weather_scraper.py` (these two are non-fatal on failure), and commits/pushes any `docs/` changes. Setup and operations: `deploy/README.md`.

`.github/workflows/main.yml` is a manual emergency fallback (`workflow_dispatch` only, no schedule) that runs the same data pipeline plus a `front/dist/` → `docs/` copy.

### iOS (ios/)

A SwiftPM package (`AicNetwork` module) in `ios/Caudales/Modules/` — nascent, no Swift source files committed yet.
