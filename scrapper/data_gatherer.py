from bs4 import BeautifulSoup
import json
import locale
import os
from dataclasses import asdict
from datetime import datetime, timedelta
from .models import Sections, Section, Level

CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sections_config.json")


def _load_default_section_ids():
    with open(CONFIG_PATH) as f:
        return [s["id"] for s in json.load(f)["sections"]]


class DataGatherer:

    def __init__(self, section_ids=None):
        self.section_ids = section_ids if section_ids is not None else _load_default_section_ids()

    def _build_date(self, date_string):
        # Set locale to Spanish
        locale.setlocale(locale.LC_ALL, 'es_ES.UTF-8')  # or 'Spanish' depending on your system
        # Remove the day name and 'de' words as they're not needed for parsing
        cleaned_date = date_string.strip().split(", ")[1]
        # Parse the date using Spanish locale
        return datetime.strptime(cleaned_date, "%d de %B de %Y").date()

    def parse(self, html_content):
        # sections = Sections()
        soup = BeautifulSoup(html_content, 'html.parser')
        table = soup.find(id="body_TablaCaudales")

        # Get the last update date
        last_update = self._build_date(soup.find(id="body_LabelFecha").get_text())
        
        trs = table.find_all("tr")
        dates_td_str = [td.get_text() for td in trs[1].find_all("td")]
        dates = [datetime.strptime(date, "%d/%m/%Y").date() for date in dates_td_str]

        # Sanity check: the dispensed date (dates[0]) must be exactly 1 day before last_update.
        # If not, the page is serving stale cached table data under a fresh header date.
        expected_dispensed_date = last_update - timedelta(days=1)
        if dates[0] != expected_dispensed_date:
            raise ValueError(
                f"Inconsistent data from AIC: header says {last_update} "
                f"but table dispensed date is {dates[0]} "
                f"(expected {expected_dispensed_date}). "
                "The site may be serving cached data."
            )

        row_count = (len(trs) - 2) // 2
        if row_count != len(self.section_ids):
            titles = [
                tr.find("td", class_="HeaderCaudalesFila").get_text().strip()
                for tr in trs[2::2] if tr.find("td", class_="HeaderCaudalesFila")
            ]
            raise ValueError(
                f"AIC table has {row_count} sections but sections_config.json defines "
                f"{len(self.section_ids)}. Scraped titles: {titles}. "
                "Update sections_config.json to match the table."
            )

        sections = []
        for i in range(2, len(trs), 2):
            tr_n = trs[i]
            tr_n_plus_1 = trs[i + 1]

            section = self._build_section(tr_n, tr_n_plus_1, dates, order=(i-2)/2)
            sections.append(section)

        return Sections(version="v1.2.0", last_update=last_update, sections=sections)

    def _build_section(self, tr1, tr2, dates, order):
        section = Section()
        section.order = int(order)
        section.title = tr1.find("td", class_="HeaderCaudalesFila").get_text().strip()
        section.id = self.section_ids[int(order)]

        # Build Levels        
        levels = []

        # Dispensed level
        dispensed = tr1.find("td", class_="ErogadoCaudalesFila").get_text().strip()
        levels.append(Level("dispensed", dates[0], dispensed=dispensed))
        tds1 = tr1.find_all("td")
        tds2 = tr2.find_all("td")
        for i in range(len(tds2)-1):
            max = int(tds1[i+2].get_text().strip())
            min = int(tds2[i].get_text().strip())
            levels.append(Level("programmed", dates[i+1], min=min, max=max))

        section.levels = levels
        return section
