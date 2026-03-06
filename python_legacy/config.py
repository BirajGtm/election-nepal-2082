"""Configuration for reddit-ghanti bot."""

import os
import json
from dotenv import load_dotenv

load_dotenv()

# Reddit credentials
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID", "")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET", "")
REDDIT_USERNAME = os.getenv("REDDIT_USERNAME", "")
REDDIT_PASSWORD = os.getenv("REDDIT_PASSWORD", "")
REDDIT_POST_IDS = [x.strip() for x in os.getenv("REDDIT_POST_IDS", "").split(",") if x.strip()]
REDDIT_USER_AGENT = f"reddit-ghanti:v1.0 (by /u/{REDDIT_USERNAME})"

# Scraping
UPDATE_INTERVAL_SECONDS = int(os.getenv("UPDATE_INTERVAL_SECONDS", "300"))
REQUEST_TIMEOUT = 15
USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0"
MAX_WORKERS = 20  # parallel fetch threads


def _load_districts() -> list[str]:
    """Load district names from districts.json."""
    path = os.path.join(os.path.dirname(__file__), "districts.json")
    with open(path) as f:
        data = json.load(f)
    return [d["district"] for d in data]

def _load_voters() -> dict[str, int]:
    """Load total voters for each constituency from districts.json."""
    path = os.path.join(os.path.dirname(__file__), "districts.json")
    try:
        with open(path) as f:
            data = json.load(f)
        voters = {}
        for d in data:
            dist = d["district"].lower()
            for c_num, count in d.get("voters", {}).items():
                voters[f"{dist}-{c_num}"] = count
        return voters
    except FileNotFoundError:
        return {}


ALL_DISTRICTS: list[str] = _load_districts()
TOTAL_VOTERS: dict[str, int] = _load_voters()

# Hotseats — key races to highlight (district-num format)
HOTSEAT_KEYS: frozenset[str] = frozenset({
    "jhapa-5",
    "sarlahi-4",
    "chitwan-2",
    "rukum-east-1",
    "sunsari-1",
    "bhaktapur-2",
    "tanahun-1",
    "kathmandu-3",
    "chitwan-3",
    "gorkha-1",
    "dhading-1",
    "gulmi-1",
    "rautahat-4",
    "myagdi-1",
})
