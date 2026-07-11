import os
import shutil
import json
import requests
from dataclasses import asdict
from datetime import date, datetime
from scrapper.lakes_gatherer import LakesGatherer, LISTING_URL, DETAIL_URL
from scrapper.lakes_models import Reservoirs


def fetch_html(url):
    response = requests.get(url)
    response.raise_for_status()
    # The AIC pages are UTF-8; set it explicitly so accented reservoir names
    # (Alicurá, El Chañar) decode correctly even without chardet installed.
    response.encoding = "utf-8"
    return response.text


def save_data_as_json(reservoirs, file_path):
    def default_serializer(obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        raise TypeError(f"Type {type(obj)} not serializable")

    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "w") as json_file:
        json.dump(asdict(reservoirs), json_file, indent=4, default=default_serializer)


def update_latest_json_alias(path, filename):
    """Publish a real copy of the newest dated file as the stable "lakes.json" alias."""
    alias_path = os.path.join(path, "lakes.json")
    # If the alias is still an old symlink pointing at the dated file, copyfile
    # would truncate the source through the link; remove it first.
    if os.path.lexists(alias_path):
        os.remove(alias_path)
    shutil.copyfile(os.path.join(path, filename), alias_path)


MEASUREMENT_FIELDS = (
    "crown", "max_level", "max_normal", "current_level", "min_normal",
    "min_extraordinary", "inflow", "spilled", "turbined", "total_released",
    "diverted",
)


def assert_data_is_complete(reservoirs, expected_count):
    """Refuse to publish a partial scrape.

    The detail pages carry no date, so we cannot detect stale cached data the
    way the caudales scraper does. Instead we guard against parse failures: we
    must get one entry per listed reservoir, and each must expose at least one
    measurement. (Diversion structures like El Chañar have no water level, so we
    can't require current_level specifically.) Raising SystemExit makes the CI
    step exit non-zero so the existing lakes.json is left untouched.
    """
    if len(reservoirs.reservoirs) != expected_count:
        raise SystemExit(
            f"Refusing to save: parsed {len(reservoirs.reservoirs)} reservoirs "
            f"but the listing had {expected_count}."
        )
    empty = [
        r.name for r in reservoirs.reservoirs
        if all(getattr(r, f) is None for f in MEASUREMENT_FIELDS)
    ]
    if empty:
        raise SystemExit(
            f"Refusing to save: no data parsed for {', '.join(empty)}."
        )


def print_reservoirs_data(reservoirs):
    print("\n===== RESERVOIR LEVELS =====")
    print(f"Version: {reservoirs.version}")
    print(f"Last Update: {reservoirs.last_update.isoformat()}")
    print("============================")
    for r in reservoirs.reservoirs:
        print(
            f"[{r.order}] {r.name:<20} "
            f"nivel={r.current_level} msnm  "
            f"entrante={r.inflow}  erogado={r.total_released} m³/s"
        )
    print("============================\n")


if __name__ == "__main__":
    github_docs_dir = "docs/"
    gatherer = LakesGatherer()

    listing_html = fetch_html(LISTING_URL)
    pairs = gatherer.parse_listing(listing_html)
    if not pairs:
        raise SystemExit("No reservoirs found in the AIC listing page.")

    reservoirs = []
    for order, (a, z) in enumerate(pairs):
        detail_html = fetch_html(DETAIL_URL.format(a=a, z=z))
        reservoirs.append(gatherer.parse_detail(detail_html, order))

    data = Reservoirs(
        version="v1.0.0",
        last_update=datetime.now().date(),
        reservoirs=reservoirs,
    )

    print_reservoirs_data(data)

    # Only publish a full scrape; never overwrite good data with a partial one.
    assert_data_is_complete(data, expected_count=len(pairs))

    filename = data.last_update.strftime("lakes_%d_%m_%Y.json")
    file_path = github_docs_dir + filename
    save_data_as_json(data, file_path)
    update_latest_json_alias(github_docs_dir, filename)

    print(f"JSON file created: {file_path}")
    print(f"Alias updated: {github_docs_dir}lakes.json (copy of {filename})")
