import re
from bs4 import BeautifulSoup
from datetime import date, timedelta
from .weather_models import CityWeather, DayForecast, HalfDay

BASE_URL = "https://www.aic.gob.ar/sitio/extendido"

ROW_LABELS = ("Cielo", "Estado", "Temperatura", "Viento", "Ráfagas", "Dirección", "Presión")


def _int_or_none(text):
    if not text:
        return None
    match = re.search(r"-?\d+", text)
    return int(match.group()) if match else None


def _icon_code(td):
    img = td.find("img")
    if not img or not img.get("src"):
        return None
    match = re.search(r"/(\d+)\s", img["src"])
    return int(match.group(1)) if match else None


class WeatherGatherer:

    def parse(self, html_content, city_id, today):
        soup = BeautifulSoup(html_content, "html.parser")

        selected = soup.find("option", selected=True)
        if not selected or selected.get("value") != str(city_id):
            got = selected.get("value") if selected else None
            raise ValueError(
                f"Expected city {city_id} to be selected but got {got}. "
                "The AIC site may have fallen back to its default city."
            )
        city_name = selected.get_text().strip()

        headers = sorted(
            soup.find_all("span", id=re.compile(r"^body_lblnormal\d+$")),
            key=lambda s: int(re.search(r"\d+$", s["id"]).group()),
        )
        tbodies = [
            soup.find(id="body_grillanormal0"),
            soup.find(id="body_grillanormal1"),
        ]
        if len(headers) != 6 or any(tb is None for tb in tbodies):
            raise ValueError(
                f"Unexpected extended-forecast layout for city {city_id}: "
                f"{len(headers)} day headers, tbodies present={[tb is not None for tb in tbodies]}."
            )

        dates = self._infer_dates(headers, today)

        days = []
        col = 0
        for tbody in tbodies:
            rows_by_label = self._rows_by_label(tbody)
            for j in range(3):
                day_half = self._build_half_day(rows_by_label, j, night=False)
                night_half = self._build_half_day(rows_by_label, j, night=True)
                days.append(DayForecast(date=dates[col], day=day_half, night=night_half))
                col += 1

        return CityWeather(city_id=str(city_id), city_name=city_name, days=days)

    def _rows_by_label(self, tbody):
        rows_by_label = {}
        for tr in tbody.find_all("tr"):
            label_td = tr.find("td", class_="th2")
            label = label_td.get_text().strip() if label_td else ""
            if label not in ROW_LABELS:
                continue
            data_tds = [td for td in tr.find_all("td") if td is not label_td]
            rows_by_label[label] = data_tds
        return rows_by_label

    def _build_half_day(self, rows_by_label, col, night):
        half = HalfDay()
        idx = 1 if night else 0

        cielo_tds = rows_by_label.get("Cielo")
        if cielo_tds:
            divs = cielo_tds[col].find_all("div", class_="col-xs-6")
            half.icon_code = _icon_code(divs[idx]) if len(divs) > idx else None

        def cell_text(label):
            tds = rows_by_label.get(label)
            if not tds:
                return ""
            divs = tds[col].find_all("div", class_="col-xs-6")
            return divs[idx].get_text().strip() if len(divs) > idx else ""

        half.estado = cell_text("Estado")
        half.temperature = _int_or_none(cell_text("Temperatura"))
        half.wind = _int_or_none(cell_text("Viento"))
        half.gusts = _int_or_none(cell_text("Ráfagas"))
        half.direction = cell_text("Dirección")
        half.pressure = _int_or_none(cell_text("Presión"))
        return half

    def _infer_dates(self, headers, today):
        first_day_of_month = _int_or_none(headers[0].get_text())
        if first_day_of_month is None:
            raise ValueError(f"Could not parse day header: {headers[0].get_text()!r}")

        anchor = None
        for candidate in (today - timedelta(days=1), today, today + timedelta(days=1)):
            if candidate.day == first_day_of_month:
                anchor = candidate
                break
        if anchor is None:
            raise ValueError(
                f"First forecast day-of-month ({first_day_of_month}) doesn't match "
                f"today ({today}) within +/-1 day."
            )

        dates = [anchor]
        for span in headers[1:]:
            expected = dates[-1] + timedelta(days=1)
            day_of_month = _int_or_none(span.get_text())
            if day_of_month != expected.day:
                raise ValueError(
                    f"Forecast day header {span.get_text()!r} doesn't match expected date {expected}."
                )
            dates.append(expected)
        return dates
