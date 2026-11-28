"""Publish the latest AIC station flow for each configured dashboard section."""

import json
from pathlib import Path
from tempfile import NamedTemporaryFile

import requests

from scrapper.aic_http import fetch_html
from scrapper.stations_gatherer import LISTING_URL, parse_station_flow, parse_station_links

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "docs" / "station_flows.json"


def previous_readings(path):
    try:
        sections = json.loads(path.read_text(encoding="utf-8")).get("sections")
        return sections if isinstance(sections, dict) else {}
    except (FileNotFoundError, ValueError, AttributeError):
        return {}


def publish_station_flows(section_stations, output):
    station_links = parse_station_links(fetch_html(LISTING_URL))
    previous = previous_readings(output)
    sections = {}
    refreshed = 0

    for section_id, station_id in section_stations.items():
        old = previous.get(section_id)
        if not isinstance(old, dict) or old.get("station_id") != station_id:
            old = None
        try:
            detail_url = station_links[station_id]
            reading = parse_station_flow(fetch_html(detail_url))
            if reading is None:
                raise ValueError("no dated flow reading available")
        except (KeyError, requests.RequestException, ValueError) as error:
            print(f"{section_id} (AIC station {station_id}): {type(error).__name__}: {error}")
            if old:
                sections[section_id] = old
            continue

        if old and old.get("source_updated_on", "") > reading["source_updated_on"]:
            sections[section_id] = old
            continue
        sections[section_id] = {"station_id": station_id, "detail_url": detail_url, **reading}
        refreshed += 1

    if not refreshed:
        raise SystemExit("AIC did not provide an up-to-date flow reading for any configured station.")
    if sections == previous:
        print("AIC station flows are unchanged.")
        return

    temporary = None
    try:
        with NamedTemporaryFile(mode="w", dir=output.parent, encoding="utf-8", delete=False) as file:
            temporary = Path(file.name)
            json.dump({"version": "1.0.0", "sections": sections}, file, indent=2, ensure_ascii=False)
            file.write("\n")
        temporary.replace(output)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    print(f"Published {len(sections)} AIC station flows ({refreshed} checked for updates).")


if __name__ == "__main__":
    config = json.loads((ROOT / "sections_config.json").read_text(encoding="utf-8"))
    publish_station_flows(
        {section["id"]: section["aic_station_id"] for section in config["sections"] if "aic_station_id" in section},
        OUTPUT,
    )
