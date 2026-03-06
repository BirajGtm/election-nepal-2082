import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from bs4 import BeautifulSoup
import re

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

NEPALI_DIGITS = "०१२३४५६७८९"
_NEP_TO_ENG = str.maketrans(NEPALI_DIGITS, "0123456789")

def nepali_to_int(text: str) -> int:
    cleaned = re.sub(r"[,\s]", "", text.translate(_NEP_TO_ENG))
    if not cleaned:
        return 0
    try:
        return int(cleaned)
    except ValueError:
        return 0

def fetch_voter_count(district: str, const_num: int) -> tuple[str, int, int]:
    slug = f"{district.lower()}-{const_num}"
    url = f"https://election.ratopati.com/constituency/{slug}"
    try:
        res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=15)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, "html.parser")
        for block in soup.find_all('li'):
            text = block.get_text(separator=" ", strip=True)
            if "जम्मा मतदाता" in text:
                parts = text.split()
                voters = nepali_to_int(parts[0])
                log.info(f"Fetched {slug}: {voters}")
                return (district, const_num, voters)
    except Exception as e:
        log.error(f"Error fetching {slug}: {e}")
    return (district, const_num, 0)

def main():
    with open("districts.json", "r") as f:
        data = json.load(f)
    
    tasks = []
    with ThreadPoolExecutor(max_workers=20) as executor:
        for d in data:
            dist = d['district']
            num = d['num']
            for i in range(1, num + 1):
                tasks.append(executor.submit(fetch_voter_count, dist, i))
        
        results = {}
        for future in as_completed(tasks):
            dist, const_num, voters = future.result()
            if dist not in results:
                results[dist] = {}
            results[dist][str(const_num)] = voters
    
    for d in data:
        dist = d['district']
        if dist in results:
            # Sort the voters dictionary by numeric constituency ID
            sorted_voters = {k: results[dist][k] for k in sorted(results[dist].keys(), key=int)}
            d['voters'] = sorted_voters
            
    with open("districts.json", "w") as f:
        json.dump(data, f, indent=2)
        
    log.info("Updated districts.json")

if __name__ == "__main__":
    main()
