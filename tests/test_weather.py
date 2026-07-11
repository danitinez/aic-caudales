import unittest
from datetime import date
from scrapper.weather_gatherer import WeatherGatherer


class TestWeatherGatherer(unittest.TestCase):

    def setUp(self):
        self.gatherer = WeatherGatherer()

    def _read(self, name):
        with open(f"tests/{name}", encoding="utf-8") as f:
            return f.read()

    def test_parse_neuquen(self):
        city = self.gatherer.parse(
            self._read("extendido_neuquen.html"), city_id="1054", today=date(2026, 7, 10)
        )
        self.assertEqual(city.city_id, "1054")
        self.assertEqual(city.city_name, "Neuquén")
        self.assertEqual(len(city.days), 6)

        expected_dates = [date(2026, 7, d) for d in range(10, 16)]
        self.assertEqual([d.date for d in city.days], expected_dates)

        first = city.days[0]
        self.assertEqual(first.day.temperature, 6)
        self.assertEqual(first.night.temperature, 3)
        self.assertEqual(first.day.wind, 19)
        self.assertEqual(first.night.wind, 21)
        self.assertEqual(first.day.icon_code, 1202)
        self.assertEqual(first.night.icon_code, 2202)
        self.assertEqual(first.day.estado, "Lluvias y Chaparrones Aislados")
        self.assertEqual(first.day.direction, "E")
        self.assertEqual(first.night.direction, "SE")
        self.assertEqual(first.day.gusts, 26)
        self.assertEqual(first.day.pressure, 1019)

        last = city.days[5]
        self.assertEqual(last.date, date(2026, 7, 15))
        self.assertEqual(last.day.temperature, 11)
        self.assertEqual(last.night.temperature, 2)

    def test_parse_el_chocon(self):
        city = self.gatherer.parse(
            self._read("extendido_chocon.html"), city_id="1021", today=date(2026, 7, 10)
        )
        self.assertEqual(city.city_id, "1021")
        self.assertEqual(city.city_name, "El Chocón")
        self.assertEqual(city.days[0].day.temperature, 6)
        self.assertEqual(city.days[0].day.wind, 23)

    def test_wrong_city_selected_raises(self):
        # If the requested city doesn't match the one echoed back by the site,
        # it likely fell back to its default (Neuquén) — refuse to trust it.
        with self.assertRaises(ValueError):
            self.gatherer.parse(
                self._read("extendido_neuquen.html"), city_id="1021", today=date(2026, 7, 10)
            )

    def test_today_a_day_after_first_header_still_resolves(self):
        # today can be one day ahead of the server (e.g. CI clock drift or a
        # late-night run); the anchor search allows +/-1 day.
        city = self.gatherer.parse(
            self._read("extendido_neuquen.html"), city_id="1054", today=date(2026, 7, 11)
        )
        self.assertEqual(city.days[0].date, date(2026, 7, 10))


if __name__ == "__main__":
    unittest.main()
