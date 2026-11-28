import requests


def fetch_html(url):
    response = requests.get(url, timeout=15)
    response.raise_for_status()
    # AIC's public station and reservoir pages use UTF-8.
    response.encoding = "utf-8"
    return response.text
