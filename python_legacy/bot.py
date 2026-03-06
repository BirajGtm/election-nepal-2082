"""Reddit bot that updates a comment with live election stats."""

from __future__ import annotations

import sys
import time
import logging

import praw

from config import (
    REDDIT_CLIENT_ID,
    REDDIT_CLIENT_SECRET,
    REDDIT_USERNAME,
    REDDIT_PASSWORD,
    REDDIT_POST_IDS,
    REDDIT_USER_AGENT,
    UPDATE_INTERVAL_SECONDS,
    HOTSEAT_KEYS,
)
from scraper import scrape_all, fetch_national_summary
from formatter import format_comment

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("bot")


def create_reddit() -> praw.Reddit:
    if not all([REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD]):
        log.error("Missing Reddit credentials. Set them in .env")
        sys.exit(1)

    reddit = praw.Reddit(
        client_id=REDDIT_CLIENT_ID,
        client_secret=REDDIT_CLIENT_SECRET,
        username=REDDIT_USERNAME,
        password=REDDIT_PASSWORD,
        user_agent=REDDIT_USER_AGENT,
    )
    log.info("Authenticated as u/%s", reddit.user.me())
    return reddit


def update_posts(reddit: praw.Reddit, body: str) -> None:
    if not REDDIT_POST_IDS:
        log.error("No REDDIT_POST_IDS set. Set them in .env")
        sys.exit(1)

    for post_id in REDDIT_POST_IDS:
        try:
            post = reddit.submission(id=post_id)
            post.edit(body)
            log.info("Post %s updated (%d chars)", post_id, len(body))
        except Exception as e:
            log.error("Failed to update post %s: %s", post_id, e)


_last_data: str | None = None


def _data_fingerprint(body: str) -> str:
    """Table rows only (skip timestamp)."""
    return "\n".join(line for line in body.splitlines() if not line.startswith("*"))


def run_once(reddit: praw.Reddit) -> None:
    global _last_data

    national_summary = fetch_national_summary()
    all_results = scrape_all()
    body = format_comment(all_results, national_summary, HOTSEAT_KEYS)

    fingerprint = _data_fingerprint(body)
    if fingerprint == _last_data:
        log.info("No data change, skipping update")
        return

    update_posts(reddit, body)
    _last_data = fingerprint


def main() -> None:
    if "--dry-run" in sys.argv:
        log.info("DRY RUN — scraping and printing, not posting to Reddit")
        national_summary = fetch_national_summary()
        all_results = scrape_all()
        body = format_comment(all_results, national_summary, HOTSEAT_KEYS)
        print(body)
        return

    reddit = create_reddit()

    log.info("Starting bot loop (interval: %ds)", UPDATE_INTERVAL_SECONDS)
    while True:
        try:
            run_once(reddit)
        except Exception:
            log.exception("Error in update cycle")

        log.info("Sleeping %ds...", UPDATE_INTERVAL_SECONDS)
        time.sleep(UPDATE_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
