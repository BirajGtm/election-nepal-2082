"""Format scraped election results into Reddit markdown."""

from __future__ import annotations

import logging
from collections import defaultdict
from datetime import datetime, timezone, timedelta

from scraper import ConstituencyResult, PartySummary
from config import TOTAL_VOTERS

log = logging.getLogger(__name__)

NPT = timezone(timedelta(hours=5, minutes=45))

PARTY_EMOJI: dict[str, str] = {
    "नेपाली कांग्रेस": "🌳",
    "नेपाली काँग्रेस": "🌳",
    "नेकपा (एमाले)": "☀️",
    "नेपाली कम्युनिष्ट पार्टी": "⭐",
    "राष्ट्रिय स्वतन्त्र पार्टी": "🔔",
    "राष्ट्रिय प्रजातन्त्र पार्टी": "👑",
    "उज्यालो नेपाल पार्टी": "💡",
    "जनमत पार्टी": "📢",
    "नेपाल मजदुर किसान पार्टी": "🥁",
    "श्रम संस्कृति पार्टी": "🪨",
    "जय मातृभूमि पार्टी": "🤱",
    "नेपाल कम्युनिस्ट पार्टी (माओवादी)": "🥀"
}


def _party_emoji(party: str) -> str:
    return PARTY_EMOJI.get(party, "•")


def _vote_str(votes: int) -> str:
    return f"{votes:,}" if votes > 0 else "-"


def _has_votes(r: ConstituencyResult) -> bool:
    return (
        not r.error
        and len(r.candidates) > 0
        and r.candidates[0].votes > 0
    )


def _format_row(r: ConstituencyResult) -> str:
    total_voters = TOTAL_VOTERS.get(r.slug, 0)
    total_counted = sum(c.votes for c in r.candidates)
    
    label_str = f"**{r.label}**"
    if total_voters > 0 and total_counted > 0:
        pct = (total_counted / total_voters) * 100
        pct = min(pct, 100.0)
        label_str += f" ({pct:.1f}%)"

    c1 = r.candidates[0]
    col1 = f"{_party_emoji(c1.party)} {c1.name} ({_vote_str(c1.votes)})"

    col2 = "-"
    if len(r.candidates) > 1 and r.candidates[1].votes > 0:
        c2 = r.candidates[1]
        col2 = f"{_party_emoji(c2.party)} {c2.name} ({_vote_str(c2.votes)})"

    col3 = "-"
    if len(r.candidates) > 2 and r.candidates[2].votes > 0:
        c3 = r.candidates[2]
        col3 = f"{_party_emoji(c3.party)} {c3.name} ({_vote_str(c3.votes)})"

    col4 = "-"
    if len(r.candidates) > 3 and r.candidates[3].votes > 0:
        c4 = r.candidates[3]
        col4 = f"{_party_emoji(c4.party)} {c4.name} ({_vote_str(c4.votes)})"

    return f"| {label_str} | {col1} | {col2} | {col3} | {col4} |"


def format_comment(
    all_results: list[ConstituencyResult],
    national_summary: list[PartySummary],
    hotseat_keys: frozenset[str],
) -> str:
    """Build the full Reddit comment body."""
    lines: list[str] = []

    # Calculate party votes from district results
    party_votes: dict[str, int] = defaultdict(int)
    for r in all_results:
        if not _has_votes(r):
            continue
        for c in r.candidates:
            party_votes[c.party] += c.votes

    # Display National Summary Table
    if national_summary:
        lines.append("| Party | Won | Leading | Total Votes |")
        lines.append("|:------|:---:|:-------:|------------:|")
        
        # Sort national summary by Won then Leading then Votes
        sorted_summary = sorted(
            national_summary, 
            key=lambda p: (p.won, p.leading, party_votes.get(p.party, 0)), 
            reverse=True
        )
        
        for p in sorted_summary:
            votes = party_votes.get(p.party, 0)
            lines.append(f"| {_party_emoji(p.party)} {p.party} | {p.won} | {p.leading} | {_vote_str(votes)} |")
        lines.append("")

    # Split into hotseats vs rest
    hotseats = [r for r in all_results if r.slug in hotseat_keys and _has_votes(r)]
    non_hotseats = [r for r in all_results if r.slug not in hotseat_keys and _has_votes(r)]

    if hotseats:
        lines.append("# Hotseats 🔥")
        lines.append("| Constituency | Leading | Runner-up | 3rd | 4th |")
        lines.append("|:-------------|:--------|:----------|:----|:----|")
        for r in hotseats:
            lines.append(_format_row(r))
        lines.append("")

    if non_hotseats:
        lines.append("# Other Constituencies")
        lines.append("| Constituency | Leading | Runner-up | 3rd | 4th |")
        lines.append("|:-------------|:--------|:----------|:----|:----|")
        
        # Sort by district, then by constituency number
        sorted_non_hotseats = sorted(non_hotseats, key=lambda x: (x.district, x.label))
        for r in sorted_non_hotseats:
            lines.append(_format_row(r))
        lines.append("")

    now = datetime.now(NPT).strftime("%Y-%m-%d %H:%M NPT")
    lines.append(f"*Last Updated: {now}*")
    lines.append("")
    lines.append("*Source: [election.ratopati.com](https://election.ratopati.com) • Auto-updated*")

    return "\n".join(lines)
