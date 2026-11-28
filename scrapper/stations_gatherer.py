import re
from datetime import datetime
from urllib.parse import urljoin, urlsplit

from bs4 import BeautifulSoup

LISTING_URL = "https://www.aic.gob.ar/sitio/estaciones"
DETAIL_PATH = "/sitio/estaciones-detalle"
DETAIL_QUERY = re.compile(r"a=(\d+)&z=(\d+)")
UPDATE_DATE = re.compile(r"última actualización:\s*(\d{2}/\d{2}/\d{4})", re.IGNORECASE)
FLOW_VALUE = re.compile(r"(\d+(?:[.,]\d+)?)\s*m[3³]/s", re.IGNORECASE)
FLOW_TYPES = {
    "caudalmedido": "measured",
    "caudal calculado curvahq": "rating_curve",
    "caudal medio diario": "daily_mean",
}


def parse_station_links(html):
    soup = BeautifulSoup(html, "html.parser")
    stations = {}
    for link in soup.select("a[href]"):
        url = urlsplit(urljoin(LISTING_URL, link["href"]))
        if (url.scheme, url.netloc, url.path) != ("https", "www.aic.gob.ar", DETAIL_PATH):
            continue
        match = DETAIL_QUERY.fullmatch(url.query)
        if match is None or link.get_text(strip=True) != "Ver Detalle":
            continue
        stations[match[1]] = url.geturl()
    return stations


def parse_station_flow(html):
    soup = BeautifulSoup(html, "html.parser")
    station = soup.select_one("#body_lblnombre")
    table = soup.select_one("#body_TabMediciones_TabMed0 table")
    if station is None or table is None:
        raise ValueError("AIC station detail did not contain its name and measurements table")

    name = station.get_text(" ", strip=True)
    updated = UPDATE_DATE.search(table.get_text(" ", strip=True))
    if not name or updated is None:
        return None
    readings = {}
    for row in table.select("tr"):
        cells = row.find_all("td", recursive=False)
        if len(cells) != 2:
            continue
        label, value = (cell.get_text(" ", strip=True) for cell in cells)
        kind = FLOW_TYPES.get(" ".join(label.casefold().split()))
        match = FLOW_VALUE.fullmatch(value)
        if kind and match:
            readings[kind] = float(match[1].replace(",", "."))

    for kind in FLOW_TYPES.values():
        if kind in readings:
            return {
                "station_name": name,
                "kind": kind,
                "flow_m3s": readings[kind],
                "source_updated_on": datetime.strptime(updated[1], "%d/%m/%Y").date().isoformat(),
            }
    return None
