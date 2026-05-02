import os
import requests
from dotenv import load_dotenv

load_dotenv()

AIO_USERNAME = os.getenv("ADAFRUIT_USERNAME", "")
AIO_KEY = os.getenv("ADAFRUIT_API_KEY", "")
DASHBOARD_KEY = os.getenv("ADAFRUIT_DASHBOARD_KEY", "")
BASE_URL = f"https://io.adafruit.com/api/v2/{AIO_USERNAME}"

HEADERS = {"X-AIO-Key": AIO_KEY}

FEED_KEYS = [
    "temperature", "gauge", "signal", "fan-speed",
    "remote", "logs", "led-switch", "relay-switch",
    "lock-status", "pin-fail-count",
]


def get_feeds_from_blocks(dashboard_key: str = DASHBOARD_KEY):
    """Fetch last_value for each feed directly — blocks API returns null for toggle feeds."""
    feeds = []
    for key in FEED_KEYS:
        try:
            r = requests.get(f"{BASE_URL}/feeds/{key}", headers=HEADERS, timeout=5)
            if r.status_code == 200:
                data = r.json()
                feeds.append({
                    "key": data.get("key"),
                    "name": data.get("name"),
                    "last_value": data.get("last_value"),
                })
            else:
                feeds.append({"key": key, "name": key, "last_value": None})
        except Exception:
            feeds.append({"key": key, "name": key, "last_value": None})
    return feeds


def send_feed_data(feed_key: str, value: str):
    r = requests.post(
        f"{BASE_URL}/feeds/{feed_key}/data",
        headers=HEADERS,
        json={"value": value}
    )
    r.raise_for_status()
    return r.json()


def get_feed_history(feed_key: str, limit: int = 100):
    """Fetch historical data points for a feed from Adafruit IO."""
    r = requests.get(
        f"{BASE_URL}/feeds/{feed_key}/data",
        headers=HEADERS,
        params={"limit": min(limit, 1000)},
        timeout=10,
    )
    r.raise_for_status()
    return r.json()


def get_dashboard_blocks(dashboard_key: str = DASHBOARD_KEY):
    r = requests.get(f"{BASE_URL}/dashboards/{dashboard_key}/blocks", headers=HEADERS)
    r.raise_for_status()
    return r.json()
