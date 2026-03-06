"""Scrape district-level results from election.ratopati.com."""

from __future__ import annotations

import re
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field

import requests
from bs4 import BeautifulSoup

from config import ALL_DISTRICTS, USER_AGENT, REQUEST_TIMEOUT, MAX_WORKERS

log = logging.getLogger(__name__)

NEPALI_DIGITS = "०१२३४५६७८९"
_NEP_TO_ENG = str.maketrans(NEPALI_DIGITS, "0123456789")

BASE_URL = "https://election.ratopati.com/district"


@dataclass
class CandidateResult:
    name: str
    party: str
    votes: int


@dataclass
class PartySummary:
    party: str
    won: int
    leading: int


@dataclass
class ConstituencyResult:
    label: str       # e.g. "Kaski 1"
    slug: str        # e.g. "kaski-1"
    district: str    # e.g. "Kaski"
    candidates: list[CandidateResult] = field(default_factory=list)
    error: str | None = None


def nepali_to_int(text: str) -> int:
    cleaned = re.sub(r"[,\s]", "", text.translate(_NEP_TO_ENG))
    if not cleaned:
        return 0
    try:
        return int(cleaned)
    except ValueError:
        return 0


def _parse_district_page(html: str, district: str) -> list[ConstituencyResult]:
    """Parse a district page and extract all constituency results."""
    soup = BeautifulSoup(html, "html.parser")
    results: list[ConstituencyResult] = []

    cards = soup.select(".election-card")
    for card in cards:
        # Get constituency slug from header link
        header_link = card.select_one(".candidate-card-header h3 a")
        if not header_link:
            continue

        href = header_link.get("href", "")
        # href like "https://election.ratopati.com/constituency/kaski-1"
        slug = href.rstrip("/").rsplit("/", 1)[-1].lower()

        # Extract constituency number from slug
        parts = slug.rsplit("-", 1)
        num = parts[-1] if len(parts) > 1 else "?"
        label = f"{district} {num}"

        result = ConstituencyResult(label=label, slug=slug, district=district)

        # Parse candidates
        for row in card.select(".candidate-row"):
            title_el = row.select_one(".title a")
            name = title_el.get_text(strip=True) if title_el else "?"

            # Party name is a text node inside .candidate-media > div
            party = "?"
            media_div = row.select_one(".candidate-media > div")
            if media_div:
                # Party name is a direct text node (not inside any child element)
                texts = list(media_div.stripped_strings)
                # Last text is typically the party name (after the candidate name)
                party = texts[-1] if texts else "?"

            votes_el = row.select_one(".votes")
            votes = nepali_to_int(votes_el.get_text(strip=True)) if votes_el else 0

            result.candidates.append(CandidateResult(name=name, party=party, votes=votes))

        result.candidates.sort(key=lambda c: c.votes, reverse=True)
        results.append(result)

    return results


def _fetch_district(district: str, session: requests.Session) -> list[ConstituencyResult]:
    """Fetch and parse a district page."""
    slug = district.lower().replace(" ", "-")
    url = f"{BASE_URL}/{slug}"
    try:
        resp = session.get(url, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        return _parse_district_page(resp.text, district)
    except requests.RequestException as e:
        log.warning("Failed %s: %s", district, e)
        return [ConstituencyResult(
            label=district, slug=slug, district=district, error=str(e),
        )]


def fetch_national_summary(session: requests.Session | None = None) -> list[PartySummary]:
    """Fetch the overall party summary (Won/Leading) from the homepage."""
    if session is None:
        session = requests.Session()
        session.headers.update({"User-Agent": USER_AGENT})

    url = "https://election.ratopati.com/"
    try:
        resp = session.get(url, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        summary: list[PartySummary] = []
        for card in soup.select(".parties-card"):
            title_el = card.select_one(".title")
            if not title_el:
                continue
            party_name = title_el.get_text(strip=True)

            table = card.find("table")
            if not table:
                continue

            rows = table.find_all("tr")
            if len(rows) < 2:
                continue

            data_row = rows[1]
            cols = data_row.find_all("td")
            if len(cols) < 2:
                continue

            won = nepali_to_int(cols[0].get_text(strip=True))
            leading = nepali_to_int(cols[1].get_text(strip=True))

            if won > 0 or leading > 0:
                summary.append(PartySummary(party=party_name, won=won, leading=leading))
        
        return summary
    except Exception as e:
        log.warning("Failed to fetch national summary: %s", e)
        return []


def scrape_all() -> list[ConstituencyResult]:
    """Scrape all districts in parallel, return flat list of constituency results."""
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    all_results: dict[str, list[ConstituencyResult]] = {}

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(_fetch_district, d, session): d for d in ALL_DISTRICTS}
        for future in as_completed(futures):
            district = futures[future]
            try:
                results = future.result()
            except Exception as e:
                log.warning("Error %s: %s", district, e)
                slug = district.lower().replace(" ", "-")
                results = [ConstituencyResult(
                    label=district, slug=slug, district=district, error=str(e),
                )]
            all_results[district] = results

    # Flatten in original district order
    flat: list[ConstituencyResult] = []
    for d in ALL_DISTRICTS:
        flat.extend(all_results.get(d, []))

    ok = sum(1 for r in flat if not r.error)
    log.info("Scraped %d districts → %d constituencies (%d ok)", len(ALL_DISTRICTS), len(flat), ok)
    return flat


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    results = scrape_all()
    with_votes = [r for r in results if r.candidates and r.candidates[0].votes > 0]
    print(f"\n{len(with_votes)} constituencies with votes:")
    for r in with_votes:
        c1 = r.candidates[0]
        print(f"  {r.label}: {c1.name} — {c1.party} — {c1.votes:,}")
