"use client";

import { useEffect, useState, useMemo } from "react";
import NationalSummary from "@/components/NationalSummary";
import HotseatCard from "@/components/HotseatCard";
import Outlook from "@/components/Outlook";
import WonSeats from "@/components/WonSeats";
import defaultHotseats from "@/data/hotseats.json";

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParty, setSelectedParty] = useState(null);

  const [pinnedSlugs, setPinnedSlugs] = useState([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("savedHotseats");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setPinnedSlugs(parsed);
        } else {
          setPinnedSlugs(defaultHotseats);
        }
      } catch (e) {
        setPinnedSlugs(defaultHotseats);
      }
    } else {
      setPinnedSlugs(defaultHotseats);
    }
  }, []);

  const togglePin = (slug) => {
    setPinnedSlugs((prev) => {
      const newPins = prev.includes(slug)
        ? prev.filter((p) => p !== slug)
        : [...prev, slug];
      localStorage.setItem("savedHotseats", JSON.stringify(newPins));
      return newPins;
    });
  };

  const [timeToReload, setTimeToReload] = useState(180);

  const fetchData = async () => {
    try {
      if (!data) setLoading(true);
      const res = await fetch("/api/scrape");
      if (!res.ok) throw new Error("Failed to fetch data");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "API Error");
      setData(json);
      setLastUpdated(new Date());
      setTimeToReload(180); // Reset timer on successful fetch
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // 180000 ms = 3 minutes
    const interval = setInterval(fetchData, 180000);

    // Timer interval (1 second)
    const countdownInterval = setInterval(() => {
      setTimeToReload((prev) => (prev > 0 ? prev - 1 : 180));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, []);

  const [hotseats, filteredResults] = useMemo(() => {
    if (!data?.results) return [[], []];

    // Sort all results first: Counted data available first, then alphabetically.
    const sortedAll = [...data.results].sort((a, b) => {
      const aCounted = a.candidates.length > 0 && a.candidates[0].votes > 0;
      const bCounted = b.candidates.length > 0 && b.candidates[0].votes > 0;

      if (aCounted && !bCounted) return -1;
      if (!aCounted && bCounted) return 1;

      return a.label.localeCompare(b.label);
    });

    const hotseatsList = sortedAll.filter((c) => pinnedSlugs.includes(c.slug));

    const query = searchQuery.toLowerCase().trim();

    // Handle Party Filtering
    if (selectedParty) {
      const partyFiltered = sortedAll.filter((res) => {
        if (!res.candidates || res.candidates.length === 0) return false;
        // Check if the 1st rank's party matches
        return res.candidates[0].party === selectedParty;
      });
      return [[], partyFiltered]; // Return empty hotseats when filtering by party
    }

    if (!query) return [hotseatsList, sortedAll];

    const searchFiltered = sortedAll.filter((res) => {
      // Search by constituency name (Nepali or English)
      if (res.label.toLowerCase().includes(query)) return true;
      if (
        res.englishDistrict &&
        res.englishDistrict.toLowerCase().includes(query)
      )
        return true;
      if (res.slug.toLowerCase().includes(query)) return true;

      // Search by candidate name or party (Nepali or English)
      return res.candidates.some((c) => {
        const nameMatch = c.name?.toLowerCase().includes(query);
        const romanMatch = c.romanizedName?.toLowerCase().includes(query);
        const partyMatch = c.party?.toLowerCase().includes(query);
        return nameMatch || romanMatch || partyMatch;
      });
    });

    return [[], searchFiltered]; // Return empty hotseats when searching
  }, [data, searchQuery, pinnedSlugs, selectedParty]);

  const isFiltering = searchQuery.length > 0 || selectedParty !== null;

  return (
    <main className="min-h-screen bg-[#050505] text-gray-200 font-[family-name:var(--font-geist-sans)] selection:bg-blue-500/30">
      {/* Sticky Top Navbar for Search */}
      <div className="sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-md border-b border-gray-800/80 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo / Title Area */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium tracking-wider whitespace-nowrap">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Nepal Elections 2082
            </div>

            <a
              href="https://election.ratopati.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="animated-badge-border text-xs text-gray-300 hover:text-white"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full transition-colors">
                <span>Data Source:</span>
                <img
                  src="https://npcdn.ratopati.com/election/media/setting/ratopati-logo_zD9OASMMFx.png"
                  alt="Ratopati Logo"
                  className="h-3.5 object-contain transition-all"
                />
              </span>
            </a>

            <a
              href="https://www.reddit.com/r/Nepali_Millennials/comments/1rly2w4/live_nepal_election_2082_live_poll_updates/"
              target="_blank"
              rel="noopener noreferrer"
              className="animated-badge-border text-xs text-gray-300 hover:text-orange-400"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full transition-colors">
                <svg
                  className="w-3.5 h-3.5 text-orange-500 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                </svg>
                <span>Original Contributor&apos;s Post on Reddit</span>
              </span>
            </a>

            {/* Sync Status moved to sticky bar */}
            <div className="flex items-center gap-3 text-xs text-gray-400 whitespace-nowrap">
              <span>
                Updated:{" "}
                <span className="font-bold text-gray-200">
                  {lastUpdated
                    ? lastUpdated.toLocaleTimeString()
                    : "Fetching..."}
                </span>
              </span>
              {loading && data ? (
                <span className="text-blue-400 flex items-center gap-1">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Syncing
                </span>
              ) : (
                data && (
                  <span className="text-gray-500 flex items-center gap-1">
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    Refresh in {Math.floor(timeToReload / 60)}:
                    {(timeToReload % 60).toString().padStart(2, "0")}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Search Input Floating/Sticky */}
          <div className="relative w-full sm:w-96 md:w-[28rem]">
            <input
              type="text"
              placeholder="Search by Person, Party or District..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value && selectedParty) setSelectedParty(null);
              }}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg pl-10 pr-10 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-500 shadow-inner text-sm"
            />
            <svg
              className="w-5 h-5 absolute left-3 top-3 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-gray-500 hover:text-white"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-900/20 border border-red-900 text-red-400 p-4 rounded-lg mb-8">
            <strong className="font-bold">Error:</strong> {error}
          </div>
        )}

        {loading && !data ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-400 uppercase tracking-widest text-sm animate-pulse">
              Loading Results
            </p>
          </div>
        ) : data ? (
          <div className="space-y-12 animate-in fade-in duration-700">
            {/* Won Seats Section - HIDE WHEN SEARCHING/FILTERING */}
            {!searchQuery &&
              !selectedParty &&
              data.winners &&
              data.winners.length > 0 && <WonSeats winners={data.winners} />}

            {/* Outlook Projection Section - HIDE WHEN SEARCHING TEXT */}
            {!searchQuery && !selectedParty && <Outlook data={data} />}

            {/* National Summary Section - HIDE WHEN SEARCHING TEXT */}
            {!searchQuery && (
              <section>
                <NationalSummary
                  summary={data.nationalSummary}
                  selectedParty={selectedParty}
                  onSelectParty={(party) => {
                    setSelectedParty(party);
                    if (party && searchQuery) setSearchQuery("");
                  }}
                />
              </section>
            )}

            {/* Hot Battles Section - HIDE WHEN FILTERING/SEARCHING */}
            {isClient && !isFiltering && hotseats.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-3xl font-bold text-white tracking-tight">
                    Hot Battles
                  </h2>
                  <span className="bg-gray-800 text-gray-300 text-sm font-medium px-3 py-1 rounded-full border border-gray-700">
                    {hotseats.length} tracked
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {hotseats.map((hs) => (
                    <HotseatCard
                      key={hs.slug}
                      result={hs}
                      isPinned={true}
                      onTogglePin={togglePin}
                    />
                  ))}
                </div>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-800 to-transparent mt-12"></div>
              </section>
            )}

            {/* All/Filtered Results Section */}
            <section>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {selectedParty
                      ? `Leading for ${selectedParty}`
                      : searchQuery
                        ? "Search Results"
                        : "All Constituencies"}
                  </h2>
                  {isClient && (
                    <span className="bg-gray-800 text-gray-300 text-sm font-medium px-3 py-1 rounded-full border border-gray-700">
                      {filteredResults.length} seat
                      {filteredResults.length !== 1 && "s"}
                    </span>
                  )}
                </div>
              </div>

              {isClient && filteredResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredResults.map((hs) => (
                    <HotseatCard
                      key={hs.slug}
                      result={hs}
                      isPinned={pinnedSlugs.includes(hs.slug)}
                      onTogglePin={togglePin}
                    />
                  ))}
                </div>
              ) : isClient ? (
                <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800 border-dashed">
                  <p className="text-gray-500 text-lg">No results found.</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedParty(null);
                    }}
                    className="mt-4 text-blue-400 hover:text-blue-300 underline"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : null}
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
