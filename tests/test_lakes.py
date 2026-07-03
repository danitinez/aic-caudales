import unittest
from scrapper.lakes_gatherer import LakesGatherer


class TestLakesGatherer(unittest.TestCase):

    def setUp(self):
        self.gatherer = LakesGatherer()

    def _read(self, name):
        with open(f"tests/{name}", encoding="utf-8") as f:
            return f.read()

    def test_parse_listing_returns_unique_pairs(self):
        pairs = self.gatherer.parse_listing(self._read("embalses_listing.html"))
        # 9 reservoirs, de-duplicated (each is linked twice in the page).
        self.assertEqual(len(pairs), 9)
        self.assertEqual(len(pairs), len(set(pairs)))
        self.assertIn(("8", "1577860616"), pairs)  # El Chocón

    def test_parse_dammed_reservoir(self):
        reservoir = self.gatherer.parse_detail(
            self._read("embalse_el_chocon.html"), order=0
        )
        self.assertEqual(reservoir.name, "El Chocón")
        self.assertEqual(reservoir.id, "el_chocon")
        self.assertEqual(reservoir.crown, 386.0)
        self.assertEqual(reservoir.current_level, 373.28)
        self.assertEqual(reservoir.min_extraordinary, 367.0)
        self.assertEqual(reservoir.inflow, 430.0)
        self.assertEqual(reservoir.total_released, 465.0)

    def test_parse_inflow_with_time_suffix(self):
        # Mari Menuco's row is "Caudal Entrante (8:00 hs)"; the time suffix must
        # be stripped so it still maps to inflow.
        reservoir = self.gatherer.parse_detail(
            self._read("embalse_mari_menuco.html"), order=5
        )
        self.assertEqual(reservoir.inflow, 29.0)
        self.assertEqual(reservoir.turbined, 30.0)

    def test_parse_caudal_a_as_diverted(self):
        # Los Barreales' "Caudal a Mari Menuco (8:00 hs)" is a diversion flow.
        reservoir = self.gatherer.parse_detail(
            self._read("embalse_los_barreales.html"), order=4
        )
        self.assertEqual(reservoir.inflow, 70.0)
        self.assertEqual(reservoir.diverted, 29.0)

    def test_parse_diversion_structure(self):
        # Portezuelo Grande has no water level, uses "Caudal Erogado" and a
        # "Caudal Derivado a Los Barreales" row.
        reservoir = self.gatherer.parse_detail(
            self._read("embalse_portezuelo.html"), order=8
        )
        self.assertEqual(reservoir.name, "Portezuelo Grande")
        self.assertIsNone(reservoir.current_level)
        self.assertEqual(reservoir.inflow, 77.74)
        self.assertEqual(reservoir.total_released, 8.0)
        self.assertEqual(reservoir.diverted, 70.0)


if __name__ == "__main__":
    unittest.main()
