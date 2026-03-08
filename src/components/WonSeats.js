"use client";
import { useState, useEffect } from "react";

function WinnerDrawer({ party, wins, partyColor, partyLogoUrl, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-sm bg-gray-950 border-l border-gray-800 z-50 flex flex-col shadow-2xl"
        style={{ animation: "slideIn 0.25s ease-out" }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 p-4 border-b border-gray-800"
          style={{ borderTopColor: partyColor, borderTopWidth: "3px" }}
        >
          {partyLogoUrl ? (
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-gray-700 flex-shrink-0">
              <img
                src={partyLogoUrl}
                alt={party}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-full flex-shrink-0"
              style={{ background: partyColor + "44" }}
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white truncate text-sm" title={party}>
              {party || "Independent"}
            </p>
            <p className="text-xs text-gray-400">
              {wins.length} seat{wins.length !== 1 ? "s" : ""} won
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800"
            title="Close (Esc)"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Winner list — scrollable */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-800/60">
          {wins.map((w, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <span className="text-xs text-gray-600 w-5 text-right flex-shrink-0">
                {i + 1}
              </span>
              {w.candidateImgUrl ? (
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 border border-gray-700 flex-shrink-0">
                  <img
                    src={w.candidateImgUrl}
                    alt={w.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
                  {(w.name || "?")[0]}
                </div>
              )}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium text-white truncate">
                  {w.name}
                </span>
                <span className="text-xs text-gray-500 truncate">
                  {w.constituency}
                </span>
              </div>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 flex-shrink-0 font-medium">
                WON
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

export default function WonSeats({ winners }) {
  const [selectedParty, setSelectedParty] = useState(null);

  if (!winners || winners.length === 0) return null;

  // Group by party
  const byParty = {};
  winners.forEach((w) => {
    const key = w.party || "Independent";
    if (!byParty[key]) byParty[key] = [];
    byParty[key].push(w);
  });

  // Sort by win count desc
  const parties = Object.entries(byParty).sort(
    (a, b) => b[1].length - a[1].length,
  );

  const drawerData = selectedParty
    ? {
        party: selectedParty,
        wins: byParty[selectedParty],
        partyColor: byParty[selectedParty][0]?.partyColor || "#6b7280",
        partyLogoUrl: byParty[selectedParty][0]?.partyLogoUrl || null,
      }
    : null;

  return (
    <>
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-emerald-400">✓</span> Won Seats
          </h2>
          <span className="bg-emerald-500/10 text-emerald-400 text-sm font-medium px-3 py-1 rounded-full border border-emerald-500/20">
            {winners.length} declared
          </span>
        </div>

        {/* Compact horizontal party strip */}
        <div className="flex flex-wrap gap-3">
          {parties.map(([party, wins]) => {
            const first = wins[0];
            const color = first?.partyColor || "#6b7280";
            const isActive = selectedParty === party;
            return (
              <button
                key={party}
                onClick={() => setSelectedParty(isActive ? null : party)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all text-left group ${
                  isActive
                    ? "bg-gray-800 border-gray-600 shadow-lg scale-[1.03]"
                    : "bg-gray-900/60 border-gray-800 hover:bg-gray-800/70 hover:border-gray-700"
                }`}
                style={{ borderTopColor: color, borderTopWidth: "3px" }}
                title={`Click to see all ${wins.length} wins for ${party}`}
              >
                {first?.partyLogoUrl ? (
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-white border border-gray-700 flex-shrink-0">
                    <img
                      src={first.partyLogoUrl}
                      alt={party}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex-shrink-0"
                    style={{ background: color + "44" }}
                  />
                )}
                <div className="flex flex-col min-w-0">
                  <span
                    className="text-xs font-medium text-gray-300 group-hover:text-white truncate max-w-[130px]"
                    title={party}
                  >
                    {party || "Independent"}
                  </span>
                  <span
                    className="text-lg font-black leading-tight"
                    style={{ color }}
                  >
                    {wins.length}
                    <span className="text-xs font-normal text-gray-500 ml-1">
                      seats
                    </span>
                  </span>
                </div>
                {/* Arrow hint */}
                <svg
                  className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 flex-shrink-0 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            );
          })}
        </div>
      </section>

      {drawerData && (
        <WinnerDrawer
          party={drawerData.party}
          wins={drawerData.wins}
          partyColor={drawerData.partyColor}
          partyLogoUrl={drawerData.partyLogoUrl}
          onClose={() => setSelectedParty(null)}
        />
      )}
    </>
  );
}
