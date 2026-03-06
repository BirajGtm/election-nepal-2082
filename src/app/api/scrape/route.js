import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

const NEPALI_DIGITS = "०१२३४५६७८९";
const EN_DIGITS = "0123456789";

function nepaliToInt(text) {
  if (!text) return 0;
  let cleaned = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "," || char === " ") continue;
    const index = NEPALI_DIGITS.indexOf(char);
    if (index !== -1) {
      cleaned += EN_DIGITS[index];
    } else {
      cleaned += char;
    }
  }
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

const BASE_URL = "https://election.ratopati.com/district";

// Load districts
function getDistricts() {
  const filePath = path.join(process.cwd(), "src", "data", "districts.json");
  const fileData = fs.readFileSync(filePath, "utf8");
  const districtsData = JSON.parse(fileData);
  return districtsData.map((d) =>
    d.district.toLowerCase().replace(/\s+/g, "-"),
  );
}

// Load metadata Map
let constituencyMapCache = null;
function getConstituencyMap() {
  if (constituencyMapCache) return constituencyMapCache;
  const filePath = path.join(
    process.cwd(),
    "src",
    "data",
    "constituencies.json",
  );
  const fileData = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(fileData);
  const map = {};

  parsed.constituencies.forEach((c) => {
    const slug = `${c.englishDistrict.toLowerCase().replace(/\s+/g, "-")}-${c.constituency}`;
    map[slug] = c;
  });

  constituencyMapCache = map;
  return map;
}

async function fetchNationalSummary() {
  try {
    const res = await fetch("https://election.ratopati.com/", {
      cache: "no-store",
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const summary = [];

    $(".parties-card").each((_, card) => {
      const party = $(card).find(".title").text().trim();
      const rows = $(card).find("table tr");
      if (rows.length < 2) return;
      const cols = $(rows[1]).find("td");
      if (cols.length < 2) return;

      const won = nepaliToInt($(cols[0]).text().trim());
      const leading = nepaliToInt($(cols[1]).text().trim());

      if (won > 0 || leading > 0) {
        summary.push({ party, won, leading });
      }
    });
    return summary;
  } catch (error) {
    console.error("Failed to fetch national summary", error);
    return [];
  }
}

function parseDistrictPage(html, district) {
  const $ = cheerio.load(html);
  const results = [];
  const metaMap = getConstituencyMap();

  $(".election-card").each((_, card) => {
    const headerLink = $(card).find(".candidate-card-header h3 a");
    if (!headerLink.length) return;

    const href = headerLink.attr("href") || "";
    const hrefParts = href.replace(/\/$/, "").split("/");
    const slug = hrefParts[hrefParts.length - 1].toLowerCase();

    const slugParts = slug.split("-");
    const num = slugParts.length > 1 ? slugParts[slugParts.length - 1] : "?";

    const districtFormatted = district
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("-")
      .replace("-", " ");
    const label = `${districtFormatted} ${num}`;

    const meta = metaMap[slug] || null;

    const candidates = [];
    $(card)
      .find(".candidate-row")
      .each((_, row) => {
        const titleEl = $(row).find(".title a");
        const name = titleEl.length ? titleEl.text().trim() : "?";

        const mediaDiv = $(row).find(".candidate-media > div");
        let party = "?";
        if (mediaDiv.length) {
          let texts = [];
          mediaDiv.contents().each((_, el) => {
            if (el.nodeType === 3) {
              const text = $(el).text().trim();
              if (text) texts.push(text);
            }
          });
          if (texts.length > 0) party = texts[texts.length - 1];
        }

        const votesEl = $(row).find(".votes");
        const votes = votesEl.length ? nepaliToInt(votesEl.text().trim()) : 0;

        let candidateMeta = null;
        if (meta && meta.candidates) {
          // Find matching candidate in metadata by either name or party
          candidateMeta = meta.candidates.find(
            (c) => c.name === name || c.partyName === party,
          );
        }

        // Fallback manual checks for major parties if metadata wasn't matched perfectly
        let partyLogoUrl = candidateMeta?.partyLogoUrl || null;
        let partyColor = candidateMeta?.partyColor || "#9E9E9E";
        let romanizedName = candidateMeta?.romanizedName || name;
        let enPartyName = "?";

        if (party.includes("राष्ट्रिय स्वतन्त्र पार्टी")) {
          partyLogoUrl =
            partyLogoUrl ||
            "https://election.onlinekhabar.com/wp-content/uploads/2022/11/Ghanti.jpg";
          partyColor = "#03A9F4";
          enPartyName = "Rastriya Swatantra Party";
        } else if (party.includes("नेपाली कांग्रेस")) {
          partyLogoUrl =
            partyLogoUrl ||
            "https://election.onlinekhabar.com/wp-content/uploads/2026/02/Congress.jpg";
          partyColor = "#22c55e";
          enPartyName = "Nepali Congress";
        } else if (party.includes("एमाले")) {
          partyLogoUrl =
            partyLogoUrl ||
            "https://election.onlinekhabar.com/wp-content/uploads/2026/02/UML.jpg";
          partyColor = "#E53935";
          enPartyName = "CPN (UML)";
        } else if (party.includes("नेपाली कम्युनिष्ट पार्टी")) {
          partyLogoUrl =
            partyLogoUrl ||
            "https://election.onlinekhabar.com/wp-content/uploads/2026/02/Nepali-Communist-party.jpg";
          partyColor = "#C62828";
          enPartyName = "Nepal Communist Party";
        } else if (party.includes("श्रम संस्कृति पार्टी")) {
          partyLogoUrl =
            partyLogoUrl ||
            "https://election.onlinekhabar.com/wp-content/uploads/2026/02/Shram-Sanskriti-party.jpg";
          partyColor = "#8D6E63";
          enPartyName = "Shram Sanskriti Party";
        } else if (
          party.includes("राष्ट्रिय प्रजातन्त्र पार्टी") ||
          party.includes("राप्रपा")
        ) {
          partyLogoUrl =
            partyLogoUrl ||
            "https://election.onlinekhabar.com/wp-content/uploads/2026/02/RPP.jpg";
          partyColor = "#FF9800";
          enPartyName = "Rastriya Prajatantra Party";
        }

        if (candidateMeta && candidateMeta.partyName !== "स्वतन्त्र") {
          enPartyName = candidateMeta.partyName; // we'll use fallback english maps on frontend if needed, but english search will catch romanized
        }

        candidates.push({
          name,
          party,
          votes,
          partyLogoUrl,
          partyColor,
          romanizedName,
          enPartyName,
        });
      });

    candidates.sort((a, b) => b.votes - a.votes);
    results.push({
      label,
      slug,
      district,
      candidates,
      englishDistrict: meta ? meta.englishDistrict : districtFormatted,
    });
  });

  return results;
}

async function fetchDistrict(district) {
  try {
    const res = await fetch(`${BASE_URL}/${district}`); // removed no-store for individual districts to avoid hammering if requested rapidly, but Next.js behavior handles this in GET
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const html = await res.text();
    return parseDistrictPage(html, district);
  } catch (error) {
    console.error(`Failed to fetch district ${district}:`, error);
    return [];
  }
}

// Helper to chunk promises to avoid overwhelming the server
async function fetchAllDistrictsConcurrently(districts, concurrency = 15) {
  const results = [];
  for (let i = 0; i < districts.length; i += concurrency) {
    const chunk = districts.slice(i, i + concurrency);
    const chunkPromises = chunk.map((d) => fetchDistrict(d));
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }
  return results.flat();
}

export const revalidate = 0; // Ensures API is always dynamic

let cachedData = null;
let lastFetchTime = 0;
let fetchPromise = null;

async function performScrape() {
  try {
    const allDistricts = getDistricts();

    const [nationalSummary, allConstituencies] = await Promise.all([
      fetchNationalSummary(),
      fetchAllDistrictsConcurrently(allDistricts, 20),
    ]);

    // Ensure we sort alphabetically or by district for predictability
    allConstituencies.sort((a, b) => a.label.localeCompare(b.label));

    // Determine all actual leading parties based on constituencies
    const leadingCounts = {};
    allConstituencies.forEach((c) => {
      if (
        c.candidates &&
        c.candidates.length > 0 &&
        c.candidates[0].votes > 0
      ) {
        const party = c.candidates[0].party;
        leadingCounts[party] = (leadingCounts[party] || 0) + 1;
      }
    });

    // Remove 'अन्य' (Others) from the scraped summary
    let baseSummary = nationalSummary.filter(
      (ps) =>
        !ps.party.includes("अन्य") && !ps.party.toLowerCase().includes("other"),
    );

    // Add any party that is leading but wasn't in the explicit top summary
    Object.keys(leadingCounts).forEach((party) => {
      const exists = baseSummary.find(
        (p) =>
          p.party === party ||
          party.includes(p.party) ||
          p.party.includes(party),
      );
      if (!exists) {
        baseSummary.push({ party, won: 0, leading: leadingCounts[party] });
      }
    });

    baseSummary.sort((a, b) => b.leading - a.leading);

    // Enhance National Summary colors and logos
    const enrichedSummary = baseSummary.map((ps) => {
      let partyColor = "#9E9E9E";
      let partyLogoUrl = null;
      if (ps.party.includes("राष्ट्रिय स्वतन्त्र पार्टी")) {
        partyColor = "#03A9F4";
        partyLogoUrl =
          "https://election.onlinekhabar.com/wp-content/uploads/2022/11/Ghanti.jpg";
      } else if (ps.party.includes("नेपाली कांग्रेस")) {
        partyColor = "#22c55e";
        partyLogoUrl =
          "https://election.onlinekhabar.com/wp-content/uploads/2026/02/Congress.jpg";
      } else if (ps.party.includes("एमाले")) {
        partyColor = "#E53935";
        partyLogoUrl =
          "https://election.onlinekhabar.com/wp-content/uploads/2026/02/UML.jpg";
      } else if (ps.party.includes("नेपाली कम्युनिष्ट पार्टी")) {
        partyColor = "#C62828";
        partyLogoUrl =
          "https://election.onlinekhabar.com/wp-content/uploads/2026/02/Nepali-Communist-party.jpg";
      } else if (ps.party.includes("श्रम संस्कृति पार्टी")) {
        partyColor = "#8D6E63";
        partyLogoUrl =
          "https://election.onlinekhabar.com/wp-content/uploads/2026/02/Shram-Sanskriti-party.jpg";
      } else if (
        ps.party.includes("राष्ट्रिय प्रजातन्त्र पार्टी") ||
        ps.party.includes("राप्रपा")
      ) {
        partyColor = "#FF9800";
        partyLogoUrl =
          "https://election.onlinekhabar.com/wp-content/uploads/2026/02/RPP.jpg";
      }

      return { ...ps, partyColor, partyLogoUrl };
    });

    cachedData = {
      success: true,
      nationalSummary: enrichedSummary,
      results: allConstituencies,
    };
    lastFetchTime = Date.now();
  } catch (error) {
    console.error("Background scrape error:", error);
  } finally {
    fetchPromise = null;
  }
}

export async function GET() {
  const now = Date.now();

  try {
    // If no cache exists, we must block on the first fetch
    if (!cachedData) {
      if (!fetchPromise) {
        fetchPromise = performScrape();
      }
      await fetchPromise;
      if (!cachedData) throw new Error("Failed to initialize scrape data");
      return NextResponse.json(cachedData, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }

    // If cache is older than 2 minutes (120,000ms), trigger background refresh
    if (now - lastFetchTime > 120000) {
      if (!fetchPromise) {
        fetchPromise = performScrape(); // Non-blocking!
      }
    }

    // Immediately return whatever is cached (stale-while-revalidate pattern)
    return NextResponse.json(cachedData, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
