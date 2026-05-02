import os
import requests

AIO_USERNAME = os.getenv("ADAFRUIT_USERNAME", "Bong_Bong")
AIO_KEY = os.getenv("ADAFRUIT_API_KEY", "<ADAFRUIT_API_KEY>")
BASE_URL = f"https://io.adafruit.com/api/v2/{AIO_USERNAME}"

HEADERS = {"X-AIO-Key": AIO_KEY}


def get_feeds_from_blocks(dashboard_key: str = "nothing"):
    """Extract feed last_value from dashboard blocks (only accessible API for Bong_Bong)."""
    blocks = get_dashboard_blocks(dashboard_key)
    if not isinstance(blocks, list):
        blocks = [blocks]
    feeds = []
    for block in blocks:
        for bf in block.get("block_feeds", []):
            feed = bf.get("feed", {})
            feeds.append({
                "key": feed.get("key"),
                "name": feed.get("name"),
                "last_value": feed.get("last_value"),
                "block_type": block.get("visual_type"),
            })
    return feeds


def send_feed_data(feed_key: str, value: str):
    r = requests.post(
        f"{BASE_URL}/feeds/{feed_key}/data",
        headers=HEADERS,
        json={"value": value}
    )
    r.raise_for_status()
    return r.json()


def get_dashboard_blocks(dashboard_key: str = "nothing"):
    r = requests.get(f"{BASE_URL}/dashboards/{dashboard_key}/blocks", headers=HEADERS)
    r.raise_for_status()
    return r.json()
