from bs4 import BeautifulSoup
import locale
from dataclasses import asdict
from datetime import datetime
from .models import Sections, Section, Level
import unicodedata

class DataGatherer:
    
    def __init__(self):
        pass

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
        
        #dates handlind
        trs = table.find_all("tr")
        dates_td_str = [td.get_text() for td in trs[1].find_all("td")]
        dates = [datetime.strptime(date, "%d/%m/%Y").date() for date in dates_td_str]
        
        sections = []
        for i in range(2, len(trs), 2):
            tr_n = trs[i]
            tr_n_plus_1 = trs[i + 1]
            
            section = self._build_section(tr_n, tr_n_plus_1, dates, order=(i-2)/2)
            sections.append(section)

        return Sections(version="v1.1.0", last_update=last_update, sections=sections)    

    def _build_section(self, tr1, tr2, dates, order):
        section = Section()
        section.order = int(order)
        section.title = tr1.find("td", class_="HeaderCaudalesFila").get_text().strip()
        section.id = self.remove_accents(section.title.lower().replace(" ", "_"))

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
    
    def remove_accents(self, input_str):
        nfkd_form = unicodedata.normalize('NFKD', input_str)
        return "".join([c for c in nfkd_form if not unicodedata.combining(c)])
