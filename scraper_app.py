import os
import requests
import json
import random
from scrapper.data_gatherer import DataGatherer

def fetch_html(url):
    response = requests.get(url)
    response.raise_for_status()  # Raises an HTTPError if the HTTP request returned an unsuccessful status code
    return response.text

def save_data_as_json(caudales, file_path):
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w') as json_file:
        json.dump(caudales, json_file, indent=4)

if __name__ == "__main__":

    cache_buster = random.randint(0, 99999)
    url = "http://www.aic.gov.ar/sitio/caudales?cache_buster={cache_buster}"  # Replace with the actual URL
    html_content = fetch_html(url)

    data_gatherer = DataGatherer(html_content)
    data = data_gatherer.get_data()
    print(json.dumps(data, indent=4))
    save_data_as_json(data_gatherer.get_data(), "caudales/caudales.json")  