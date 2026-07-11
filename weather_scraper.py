import os
import re
import json
import requests
from dataclasses import asdict
from datetime import date, datetime
from zoneinfo import ZoneInfo
from scrapper.weather_gatherer import WeatherGatherer, BASE_URL
from scrapper.weather_models import Weather

SECTION_CITIES = {
    "portezuelo_grande": "1082",       # Añelo
    "el_chanar": "1015",               # El Chañar
    "pichi_picun_leufu": "1077",       # Picún Leufú
    "arroyito": "1021",                # El Chocón
    "el_chanar_arroyito": "1054",      # Neuquén (confluence)
}
CITY_IDS = sorted(set(SECTION_CITIES.values()))

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; aic-caudales-scraper)"}
HIDDEN_FIELD_NAMES = (
    "__EVENTTARGET", "__EVENTARGUMENT", "__LASTFOCUS",
    "__VIEWSTATE", "__VIEWSTATEGENERATOR", "__EVENTVALIDATION",
)


def _extract_hidden_fields(html):
    fields = {}
    for name in HIDDEN_FIELD_NAMES:
        match = re.search(
            rf'<input type="hidden" name="{re.escape(name)}"[^>]*value="([^"]*)"', html
        )
        fields[name] = match.group(1) if match else ""
    return fields


def fetch_city_html(session, city_id):
    response = session.get(BASE_URL, headers=HEADERS)
    response.raise_for_status()
    response.encoding = "utf-8"

    form = _extract_hidden_fields(response.text)
    form["ctl00$body$cmbZona"] = city_id
    form["ctl00$body$ButtonPostback"] = "Postback"

    response = session.post(BASE_URL, data=form, headers=HEADERS)
    response.raise_for_status()
    response.encoding = "utf-8"
    return response.text


def save_data_as_json(weather, file_path):
    def default_serializer(obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        raise TypeError(f"Type {type(obj)} not serializable")

    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "w") as json_file:
        json.dump(asdict(weather), json_file, indent=4, default=default_serializer)


def update_latest_json_symlink(path, filename):
    symlink_path = os.path.join(path, "weather.json")
    if os.path.islink(symlink_path):
        os.remove(symlink_path)
    os.symlink(filename, symlink_path)


def assert_data_is_complete(weather, expected_city_count):
    if len(weather.cities) != expected_city_count:
        raise SystemExit(
            f"Refusing to save: parsed {len(weather.cities)} cities "
            f"but expected {expected_city_count}."
        )
    for city in weather.cities:
        if len(city.days) != 6:
            raise SystemExit(
                f"Refusing to save: city {city.city_name} has {len(city.days)} "
                "forecast days, expected 6."
            )


def print_weather_data(weather):
    print("\n===== WEATHER =====")
    print(f"Version: {weather.version}")
    print(f"Last Update: {weather.last_update.isoformat()}")
    print("====================")
    for city in weather.cities:
        first = city.days[0]
        print(
            f"{city.city_name:<20} {first.date.isoformat()} "
            f"dia={first.day.temperature}C noche={first.night.temperature}C "
            f"viento={first.day.wind}km/h"
        )
    print("====================\n")


if __name__ == "__main__":
    github_docs_dir = "docs/"
    gatherer = WeatherGatherer()
    today = datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")).date()

    session = requests.Session()
    cities = []
    for city_id in CITY_IDS:
        html = fetch_city_html(session, city_id)
        cities.append(gatherer.parse(html, city_id, today))

    data = Weather(
        version="v1.0.0",
        last_update=today,
        section_cities=SECTION_CITIES,
        cities=cities,
    )

    print_weather_data(data)

    assert_data_is_complete(data, expected_city_count=len(CITY_IDS))

    filename = data.last_update.strftime("weather_%d_%m_%Y.json")
    file_path = github_docs_dir + filename
    save_data_as_json(data, file_path)
    update_latest_json_symlink(github_docs_dir, filename)

    print(f"JSON file created: {file_path}")
    print(f"Symlink updated: {github_docs_dir}weather.json -> {filename}")
