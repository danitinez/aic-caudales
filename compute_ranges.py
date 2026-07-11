"""Compute historical min/max flow ranges per section from all scraped JSON files.

Walks every dated docs/DD_MM_YYYY.json, dedupes observations by (section, date),
and reports the observed range per section so docs/min_max_levels.json can be
kept honest. Dispensed values (actual delivered flow) are the primary signal;
programmed forecasts are shown alongside for comparison.

Usage:
    python compute_ranges.py            # print report
    python compute_ranges.py --json     # print min_max_levels.json-shaped output
    python compute_ranges.py --write    # rewrite docs/min_max_levels.json in place
"""

import glob
import json
import os
import re
import sys
import unicodedata

ROOT = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(ROOT, "docs")
DATED_FILE = re.compile(r"^\d{2}_\d{2}_\d{4}\.json$")

with open(os.path.join(ROOT, "sections_config.json")) as f:
    ID_ALIASES = json.load(f).get("legacy_id_aliases", {})


def slugify(name):
    # Old v1.0.0 files only have "name" ("El Chañar + Arroyito");
    # map it to the id that was current at scrape time. ID_ALIASES then
    # brings it forward to the modern id.
    normalized = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    return normalized.lower().replace(" ", "_")


def load_observations():
    # section_id -> date -> value
    dispensed = {}
    # section_id -> date -> (min, max) forecast
    programmed = {}
    files = sorted(glob.glob(os.path.join(DOCS, "*.json")))
    n_files = 0

    for path in files:
        if not DATED_FILE.match(os.path.basename(path)):
            continue
        try:
            with open(path) as f:
                data = json.load(f)
            sections = data["sections"]
        except (json.JSONDecodeError, KeyError, TypeError):
            print(f"warning: skipping unparsable file {path}", file=sys.stderr)
            continue
        n_files += 1

        for section in sections:
            sid = section.get("id") or slugify(section["name"])
            sid = ID_ALIASES.get(sid, sid)
            for level in section.get("levels", []):
                date = level.get("date")
                if not date:
                    continue
                if level.get("type") == "dispensed" and level.get("dispensed") is not None:
                    try:
                        val = float(level["dispensed"])
                    except (ValueError, TypeError):
                        continue
                    dispensed.setdefault(sid, {})[date] = val
                elif level.get("type") == "programmed" and level.get("min") is not None:
                    # Old files sometimes have min/max swapped — normalize.
                    lo, hi = sorted((level["min"], level["max"]))
                    # Same forecast date appears in up to 5 files; last write wins,
                    # which is the most recent (closest-to-date) forecast.
                    programmed.setdefault(sid, {})[date] = (lo, hi)

    return dispensed, programmed, n_files


def fmt(v):
    return f"{v:g}"


def main():
    dispensed, programmed, n_files = load_observations()

    try:
        with open(os.path.join(DOCS, "min_max_levels.json")) as f:
            current = json.load(f)
    except OSError:
        current = {}

    as_json = "--json" in sys.argv
    write = "--write" in sys.argv
    result = {"version": current.get("version", "1.0.0")}

    if not as_json:
        print(f"Analyzed {n_files} dated files\n")
        header = (
            f"{'section':<22} {'días':>5}  {'dispensed range':>17}  "
            f"{'programmed range':>17}  {'current file':>14}"
        )
        print(header)
        print("-" * len(header))

    all_sids = sorted(set(dispensed) | set(programmed))
    for sid in all_sids:
        d_vals = list(dispensed.get(sid, {}).values())
        p_ranges = list(programmed.get(sid, {}).values())

        d_min = min(d_vals) if d_vals else None
        d_max = max(d_vals) if d_vals else None
        p_min = min(lo for lo, _ in p_ranges) if p_ranges else None
        p_max = max(hi for _, hi in p_ranges) if p_ranges else None

        # Historic range = actually dispensed flows. Programmed forecasts are
        # reported for comparison but don't define the range (they may never
        # have materialized). Fall back to them only if no dispensed data.
        result[sid] = {
            "min": int(d_min if d_min is not None else p_min),
            "max": int(d_max if d_max is not None else p_max),
        }

        if not as_json:
            cur = current.get(sid)
            cur_s = f"{cur['min']}–{cur['max']}" if cur else "—"
            d_s = f"{fmt(d_min)}–{fmt(d_max)}" if d_vals else "—"
            p_s = f"{fmt(p_min)}–{fmt(p_max)}" if p_ranges else "—"
            print(f"{sid:<22} {len(d_vals):>5}  {d_s:>17}  {p_s:>17}  {cur_s:>14}")

    if as_json:
        print(json.dumps(result, indent=4, ensure_ascii=False))

    if write:
        out = os.path.join(DOCS, "min_max_levels.json")
        with open(out, "w") as f:
            json.dump(result, f, indent=4, ensure_ascii=False)
            f.write("\n")
        print(f"\nWrote {out}")


if __name__ == "__main__":
    main()
