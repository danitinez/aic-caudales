# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project does

Scrapes daily water flow (caudales) data from `aic.gov.ar/sitio/caudales` and publishes it as JSON + a React dashboard on GitHub Pages. The `caudales` branch is the working branch — CI commits scraped data directly to it every 4 hours.

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

`scraper_app.py` fetches the AIC HTML page → `DataGatherer.parse()` extracts the table (`#body_TablaCaudales`) → saves a dated JSON file to `docs/DD_MM_YYYY.json` and updates `docs/latest.json` (a symlink to the most recent file).

The data model is:
- `Sections` → list of `Section` (id, title, order, levels)
- `Section.levels` → list of `Level` (type: `"dispensed"` | `"programmed"`, date, min, max, dispensed)
- Each section has one `dispensed` level (yesterday's actual flow) and five `programmed` levels (upcoming min/max forecasts)

Parsing relies on `es_ES.UTF-8` locale to parse Spanish month names in the date string (e.g., "domingo, 21 de julio de 2025").

### Frontend

The React app (`front/src/`) fetches `latest.json` and `min_max_levels.json` at runtime (relative URLs, since it's served from `docs/`). `min_max_levels.json` contains historical min/max bounds per section used for gauge rendering. The built output is committed into `docs/` and served via GitHub Pages at `danitinez.github.io/aic-caudales/`.

The Vite base path is set to `/aic-caudales/` to match the GitHub Pages subpath.

### Feedback form (email)

`front/src/components/FeedbackForm.jsx` is an in-page contact form. Since GitHub Pages is static (no backend), it POSTs submissions to **Web3Forms** (`https://api.web3forms.com/submit`), which emails them to **info@develope.ar**. The footer's "Enviar opiniones" link scrolls to it (`#opiniones`).

The `ACCESS_KEY` in that file is a **public** Web3Forms routing key — it only directs mail to that inbox, grants no account/inbox access, and is exposed in the client bundle regardless, so it's safe to commit. To change the destination inbox or rotate the key, get a new one at https://web3forms.com and replace the constant. A honeypot `botcheck` field provides basic spam protection.

### CI

`.github/workflows/main.yml` runs on the `caudales` branch every 4 hours:
1. Runs `python scraper_app.py` (requires `es_ES.UTF-8` locale)
2. Copies `front/dist/*` → `docs/`
3. Commits and pushes any changes to `docs/`

### iOS (ios/)

A SwiftPM package (`AicNetwork` module) in `ios/Caudales/Modules/` — nascent, no Swift source files committed yet.
