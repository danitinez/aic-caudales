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


def update_latest_json_symlink(path, filename):
    # Create a symbolic link called "latest.json" that points to the file_path
    symlink_path = os.path.join(path, "latest.json")
    if os.path.islink(symlink_path):
        os.remove(symlink_path)
    os.symlink(filename, symlink_path)

def print_sections_data(sections):
    """Print the scraped data in a readable format"""
    print(f"\n===== WATER FLOW DATA =====")
    print(f"Version: {sections.version}")
    print(f"Last Update: {sections.last_update.strftime('%d %B, %Y')}")
    print(f"==========================")
    
    for section in sections.sections:
        print(f"\n[{section.order}] {section.title} (ID: {section.id})")
        print(f"  {'Type':<10} {'Date':<12} {'Min':<6} {'Max':<6} {'Dispensed':<9}")
        print(f"  {'-'*45}")
        
        for level in section.levels:
            date_str = level.date.strftime("%d/%m/%Y")
            min_val = str(level.min) if level.min is not None else "-"
            max_val = str(level.max) if level.max is not None else "-"
            dispensed = str(level.dispensed) if level.dispensed is not None else "-"
            
            print(f"  {level.type:<10} {date_str:<12} {min_val:<6} {max_val:<6} {dispensed:<9}")
    
    print("\n==========================\n")

if __name__ == "__main__":
    github_docs_dir = "docs/"
    cache_buster = random.randint(0, 99999)
    url = f"http://www.aic.gov.ar/sitio/caudales?cache_buster={cache_buster}"  # Replace with the actual URL
    html_content = fetch_html(url)

    data_gatherer = DataGatherer()
    sections = data_gatherer.parse(html_content)
    
    # Print the scraped data
    print_sections_data(sections)
    
    filename = sections.last_update.strftime("%d_%m_%Y.json")
    save_data_as_json(sections, github_docs_dir + filename)
    update_latest_json_symlink(github_docs_dir, filename)
