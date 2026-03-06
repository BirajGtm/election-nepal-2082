"use client";
import { useState } from "react";

const INITIAL_SHOW = 5;

export default function WonSeats({ winners }) {
  const [showAll, setShowAll] = useState(false);

  if (!winners || winners.length === 0) return null;

  const visible = showAll ? winners : winners.slice(0, INITIAL_SHOW);
  const hasMore = winners.length > INITIAL_SHOW;

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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {visible.map((winner, idx) => (
          <div
            key={idx}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-2 hover:border-emerald-500/30 transition-all group relative overflow-hidden"
            style={{
              borderLeftColor: winner.partyColor,
              borderLeftWidth: "3px",
            }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-5 rounded-xl transition-opacity"
              style={{ background: winner.partyColor }}
            />

            <div className="flex items-center gap-2">
              {winner.partyLogoUrl ? (
                <div className="w-7 h-7 rounded-full overflow-hidden bg-white flex-shrink-0 border border-gray-700">
                  <img
                    src={winner.partyLogoUrl}
                    alt={winner.party}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0"
                  style={{ background: winner.partyColor + "33" }}
                />
              )}
              <span
                className="text-xs font-medium truncate"
                style={{ color: winner.partyColor }}
                title={winner.party}
              >
                {winner.party || "Independent"}
              </span>
            </div>

            <p
              className="text-sm font-semibold text-white leading-tight"
              title={winner.name}
            >
              {winner.name}
            </p>
            <p
              className="text-xs text-gray-500 truncate"
              title={winner.constituency}
            >
              {winner.constituency}
            </p>

            <div className="absolute top-2 right-2">
              <span className="text-xs bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded font-medium border border-emerald-500/20">
                WON
              </span>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll((p) => !p)}
          className="mt-4 flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${showAll ? "rotate-180" : ""}`}
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
          {showAll ? "Show less" : `Show all ${winners.length} winners`}
        </button>
      )}
    </section>
  );
}
