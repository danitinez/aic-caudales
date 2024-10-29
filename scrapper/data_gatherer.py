from bs4 import BeautifulSoup
import locale
from datetime import datetime

class DataGatherer:
    
    def __init__(self, html_content):
        self.html_content = html_content
        self.fecha_actualizacion = ""
        self.fecha_act_as_date = None
        self.rows = []
        self.dates = []
        self.portezuelo = []
        self.el_chanar = []
        self.picun = []
        self.arroyito = []
        self.chanar_arroyito = []
        self._parse_html()
        print(self.rows)
        # self._parse_data()

    def _parse_html(self):
        # with open(self.html_content, 'r') as f:
        #     html_doc = f.read()
        html_doc = self.html_content
        soup = BeautifulSoup(html_doc, 'html.parser')
        table = soup.find(id="body_TablaCaudales")
        self.fecha_actualizacion = soup.find(id="body_LabelFecha").get_text().strip()
        self.rows = table.find_all("tr")
        # Set locale to Spanish
        locale.setlocale(locale.LC_ALL, 'es_ES.UTF-8')  # or 'Spanish' depending on your system

        date_string = self.fecha_actualizacion
        # Remove the day name and 'de' words as they're not needed for parsing
        cleaned_date = date_string.split(", ")[1]

        # Parse the date using Spanish locale
        self.fecha_act_as_date = datetime.strptime(cleaned_date, "%d de %B de %Y").date()


    def gather_data(self, rows_slice):
        data = []
        row1 = rows_slice[0]
        row2 = rows_slice[1]

        # Skip first value in first row
        row1 = row1.find_all("td")[1:]
        values1 = [float(td.get_text().strip()) for td in row1]

        # Get values from second row
        row2 = row2.find_all("td")
        values2 = [float(td.get_text().strip()) for td in row2]

        # Append second value of second row
        data.append(values1[0])

        # Take third through length of values2 of values1 and average with corresponding values of values2
        for i in range(len(values2)):
            avg = (values1[i + 1] + values2[i]) / 2
            data.append(avg)

        return data

    def _parse_data(self):
        self.dates = [str(td.get_text().strip()) for td in self.rows[1].find_all('td')]
        self.portezuelo = self.gather_data(self.rows[2:4])
        self.el_chanar = self.gather_data(self.rows[4:6])
        self.picun = self.gather_data(self.rows[6:8])
        self.arroyito = self.gather_data(self.rows[8:10])
        self.chanar_arroyito = self.gather_data(self.rows[10:12])

    def get_dates(self):
        return self.dates

    def get_portezuelo(self):
        return self.portezuelo

    def get_el_chanar(self):
        return self.el_chanar

    def get_picun(self):
        return self.picun

    def get_arroyito(self):
        return self.arroyito

    def get_chanar_arroyito(self):
        return self.chanar_arroyito
    
    def get_filename(self):
        return self.fecha_act_as_date.strftime("docs/%d_%m_%Y.json")

    def get_data(self):
        return {
            "last_update": self.fecha_actualizacion,
            "dates": self.dates,
            "portezuelo": self.portezuelo,
            "el_chanar": self.el_chanar,
            "picun": self.picun,
            "arroyito": self.arroyito,
            "chanar_arroyito": self.chanar_arroyito
        }