import os
import requests
import json
from dataclasses import asdict
from datetime import date, datetime
import random
from scrapper.data_gatherer import DataGatherer

def fetch_html(url):
    response = requests.get(url)
    response.raise_for_status()  # Raises an HTTPError if the HTTP request returned an unsuccessful status code
    return response.text

def save_data_as_json(caudales, file_path):
    # Custom serialization function
    def default_serializer(obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        raise TypeError(f"Type {type(obj)} not serializable")

    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w') as json_file:
        json.dump(asdict(caudales), json_file, indent=4, default=default_serializer)

    # Create a symbolic link called "latest" that points to the file_path
    symlink_path = os.path.join(os.path.dirname(file_path), "latest")
    if os.path.islink(symlink_path):
        os.remove(symlink_path)
    os.symlink(file_path, symlink_path)

    

def add_link_to_index(json_filename, html_file_path):
    # Extract the date from the filename
    # date_str = os.path.splitext(json_filename)[0]
    # date_obj = datetime.strptime(date_str, "%d_%m_%Y")
    # formatted_date = date_obj.strftime("%B %d, %Y")
    with open(html_file_path, 'r') as html_file:
        if json_filename in html_file.read():
            print(f"Date {json_filename} already exists in the HTML file.")
            return

    # Create the link HTML line
    link_line = f'<a href="{json_filename}">{json_filename}</a><br>\n'

    # Append the link to the HTML file
    with open(html_file_path, 'a') as html_file:
        html_file.write(link_line)


if __name__ == "__main__":

    cache_buster = random.randint(0, 99999)
    url = "http://www.aic.gov.ar/sitio/caudales?cache_buster={cache_buster}"  # Replace with the actual URL
    html_content = fetch_html(url)

    data_gatherer = DataGatherer()
    sections = data_gatherer.parse(html_content)
    
    filename = sections.last_update.strftime("%d_%m_%Y.json")
    save_data_as_json(sections, "docs/" + filename)
    add_link_to_index(filename, "docs/index.html")


#