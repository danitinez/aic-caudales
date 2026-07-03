import re
import unicodedata
from bs4 import BeautifulSoup
from .lakes_models import Reservoirs, Reservoir

# AIC embalses pages live on the .gob.ar domain (the caudales scraper uses
# .gov.ar — they are NOT interchangeable; use what is confirmed to work here).
LISTING_URL = "https://www.aic.gob.ar/sitio/embalses"
DETAIL_URL = "https://www.aic.gob.ar/sitio/embalses-detalle?a={a}&z={z}"

# Each listing row links to a detail page as embalses-detalle?a=<id>&z=<token>.
# The z token is a per-reservoir value baked into the listing page; only the
# exact value works (a wrong/absent z redirects back to the listing), so we
# always scrape the listing first to obtain fresh (a, z) pairs.
_LINK_RE = re.compile(r"embalses-detalle\?a=(\d+)&(?:amp;)?z=(\d+)")

# Maps normalised Spanish labels from the detail data grid to Reservoir fields.
# Not every reservoir exposes every row: dammed lakes report levels + flows,
# while run-of-river / diversion structures (El Chañar, Portezuelo Grande) have
# no level and use "Caudal Erogado" instead of "Caudal Total Erogado". Parsing
# is therefore label-driven and missing fields stay None.
LABEL_MAP = {
    "coronamiento": "crown",
    "nivel maximo": "max_level",
    "nivel maximo normal": "max_normal",
    "nivel actual": "current_level",
    "nivel minimo normal": "min_normal",
    "nivel minimo extraordinario": "min_extraordinary",
    "caudal entrante": "inflow",
    "caudal vertido": "spilled",
    "caudal turbinado": "turbined",
    "caudal total erogado": "total_released",
    "caudal erogado": "total_released",
}


class LakesGatherer:

    def parse_listing(self, html_content):
        """Return the unique (a, z) string pairs found in the listing page.

        Each reservoir is linked twice (map popup + list view); dict.fromkeys
        de-duplicates while preserving first-seen order.
        """
        return list(dict.fromkeys(_LINK_RE.findall(html_content)))

    def parse_detail(self, html_content, order):
        """Parse a single reservoir detail page into a Reservoir."""
        soup = BeautifulSoup(html_content, "html.parser")
        name = soup.find(id="body_lblnombre").get_text().strip()

        reservoir = Reservoir(id=self._slug(name), name=name, order=order)

        grid = soup.find(id="body_TabSintesis_TabDatos_grilla")
        for tr in grid.find_all("tr"):
            cells = [c.get_text().strip() for c in tr.find_all(["td", "th"])]
            cells = [c for c in cells if c]
            if len(cells) < 2:
                continue
            label = self._normalize(cells[0])
            # Diversion flows carry a destination in the label — Portezuelo's
            # "Caudal Derivado a Los Barreales" and Los Barreales' "Caudal a Mari
            # Menuco" — so match those by prefix rather than exact label.
            field_name = LABEL_MAP.get(label)
            if field_name is None and (
                label.startswith("caudal derivado") or label.startswith("caudal a ")
            ):
                field_name = "diverted"
            if field_name:
                setattr(reservoir, field_name, self._parse_value(cells[1]))

        return reservoir

    def _parse_value(self, text):
        """Extract the leading number from e.g. '373.28 msnm' or '430 m³/s'."""
        match = re.search(r"-?\d+(?:[.,]\d+)?", text)
        if not match:
            return None
        return float(match.group(0).replace(",", "."))

    def _normalize(self, text):
        # Drop measurement-time suffixes like "(8:00 hs)" that some rows carry
        # (e.g. "Caudal Entrante (8:00 hs)") so labels match the map.
        text = re.sub(r"\(.*?\)", "", text)
        text = self._remove_accents(text.lower()).strip()
        return re.sub(r"\s+", " ", text)

    def _slug(self, name):
        return self._remove_accents(name.lower()).replace(" ", "_")

    def _remove_accents(self, input_str):
        nfkd_form = unicodedata.normalize("NFKD", input_str)
        return "".join(c for c in nfkd_form if not unicodedata.combining(c))
