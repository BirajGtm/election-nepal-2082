"use client";
import { useState } from "react";

function PartyWinCard({ party, wins }) {
  const [open, setOpen] = useState(false);
  const first = wins[0];

  return (
    <div
      className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden transition-all hover:border-gray-700"
      style={{ borderTopColor: first.partyColor, borderTopWidth: "3px" }}
    >
      {/* Party Header — always visible */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-3 p-4 group"
      >
        <div className="flex items-center gap-3">
          {first.partyLogoUrl ? (
            <div className="w-9 h-9 rounded-full overflow-hidden bg-white flex-shrink-0 border border-gray-700">
              <img
                src={first.partyLogoUrl}
                alt={party}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="w-9 h-9 rounded-full flex-shrink-0"
              style={{ background: first.partyColor + "33" }}
            />
          )}
          <div className="text-left">
            <p
              className="text-sm font-semibold text-white leading-tight truncate max-w-[180px]"
              title={party}
            >
              {party || "Independent"}
            </p>
            <p className="text-xs text-gray-500">
              {wins.length} seat{wins.length > 1 ? "s" : ""} won
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xl font-bold"
            style={{ color: first.partyColor }}
          >
            {wins.length}
          </span>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Winner List — collapsible */}
      {open && (
        <div className="border-t border-gray-800 divide-y divide-gray-800/60">
          {wins.map((w, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-2.5 gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {w.candidateImgUrl && (
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 border border-gray-700 flex-shrink-0">
                    <img
                      src={w.candidateImgUrl}
                      alt={w.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-white truncate">
                    {w.name}
                  </span>
                  <span className="text-xs text-gray-500 truncate">
                    {w.constituency}
                  </span>
                </div>
              </div>
              <span className="text-xs bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 flex-shrink-0 font-medium">
                WON
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WonSeats({ winners }) {
  if (!winners || winners.length === 0) return null;

  // Group by party
  const byParty = {};
  winners.forEach((w) => {
    const key = w.party || "Independent";
    if (!byParty[key]) byParty[key] = [];
    byParty[key].push(w);
  });

  // Sort parties by win count desc
  const parties = Object.entries(byParty).sort(
    (a, b) => b[1].length - a[1].length,
  );

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span className="text-emerald-400">✓</span> Won Seats
        </h2>
        <span className="bg-emerald-500/10 text-emerald-400 text-sm font-medium px-3 py-1 rounded-full border border-emerald-500/20">
          {winners.length} declared
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {parties.map(([party, wins]) => (
          <PartyWinCard key={party} party={party} wins={wins} />
        ))}
      </div>
    </section>
  );
}
