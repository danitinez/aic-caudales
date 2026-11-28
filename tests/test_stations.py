import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

import requests

from scrapper.stations_gatherer import LISTING_URL, parse_station_flow, parse_station_links
from stations_scraper import publish_station_flows

LISTING = """
<a href="estaciones-detalle?a=26&amp;z=1702278334">Ver Detalle</a>
<a href="estaciones-detalle?a=126&amp;z=1475110325">Ver Detalle</a>
"""


def detail(label, value, date="27/11/2026"):
    return f"""
    <span id="body_lblnombre">ESTACIÓN AIC</span>
    <div id="body_TabMediciones_TabMed0"><table>
      <tr><td>Altura Río/Lago</td><td>1.4 m</td></tr>
      <tr><td>{label}</td><td>{value}</td></tr>
      <tr><td>(última actualización: {date})</td><td></td></tr>
    </table></div>
    """


class TestStationFlows(unittest.TestCase):
    def test_detail_links_use_tokens_from_the_listing(self):
        self.assertEqual(parse_station_links(LISTING)["26"],
                         "https://www.aic.gob.ar/sitio/estaciones-detalle?a=26&z=1702278334")

    def test_station_readings_preserve_kind_value_and_source_date(self):
        reading = parse_station_flow(detail("Caudal Medio Diario", "413,5 m3/s"))
        self.assertEqual(reading, {
            "station_name": "ESTACIÓN AIC", "kind": "daily_mean",
            "flow_m3s": 413.5, "source_updated_on": "2026-11-27",
        })
        zero = parse_station_flow(detail("Caudal Calculado curvaHQ", "0 m³/s"))
        self.assertEqual(zero["flow_m3s"], 0)
        self.assertEqual(zero["kind"], "rating_curve")
        self.assertIsNone(parse_station_flow(detail("Caudal Medio Diario", "----")))

    def test_partial_refresh_keeps_previous_reading_after_request_failure(self):
        station_links = parse_station_links(LISTING)
        sections = {"pichi": "26", "portezuelo": "126"}
        pages = {
            LISTING_URL: LISTING,
            station_links["26"]: detail("Caudal Medio Diario", "413 m3/s"),
            station_links["126"]: detail("Caudal Calculado curvaHQ", "13 m3/s"),
        }

        def fetch_second_run(url):
            if url == station_links["26"]:
                raise requests.Timeout()
            if url == station_links["126"]:
                return detail("Caudal Calculado curvaHQ", "14 m3/s", "28/11/2026")
            return pages[url]

        with TemporaryDirectory() as directory:
            output = Path(directory) / "station_flows.json"
            with patch("stations_scraper.fetch_html", side_effect=pages.__getitem__):
                publish_station_flows(sections, output)
            with patch("stations_scraper.fetch_html", side_effect=fetch_second_run):
                publish_station_flows(sections, output)
            data = json.loads(output.read_text())["sections"]

        self.assertEqual(data["pichi"]["source_updated_on"], "2026-11-27")
        self.assertEqual(data["portezuelo"]["flow_m3s"], 14)
