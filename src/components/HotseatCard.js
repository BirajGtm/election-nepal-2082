export default function HotseatCard({ result, isPinned, onTogglePin, winner }) {
  if (!result || !result.candidates) return null;

  const topCandidates = result.candidates.slice(0, 3);
  const othersVotes = result.candidates
    .slice(3)
    .reduce((acc, c) => acc + c.votes, 0);

  return (
    <div
      className={`bg-gray-900 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group flex flex-col h-full relative ${
        winner
          ? "border-2 border-amber-400 shadow-amber-500/20 hover:shadow-amber-500/30"
          : "border border-gray-800 hover:border-gray-700"
      }`}
    >
      <button
        onClick={() => onTogglePin && onTogglePin(result.slug)}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-gray-900/50 hover:bg-gray-800 text-gray-400 hover:text-yellow-400 transition-colors"
        title={isPinned ? "Unpin constituency" : "Pin constituency"}
      >
        <svg
          className={`w-5 h-5 ${isPinned ? "text-yellow-400 fill-current" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          ></path>
        </svg>
      </button>

      <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 p-4 border-b border-gray-800/80 pr-12">
        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
          {result.label}
        </h3>
        <p className="text-sm text-gray-400 capitalize">
          {result.englishDistrict || result.district} District
        </p>
        {winner && (
          <span className="inline-flex items-center gap-1 mt-1.5 text-xs bg-amber-400/15 text-amber-400 px-2 py-0.5 rounded-full border border-amber-400/30 font-medium">
            <span>🏆</span> {winner.name} won
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col gap-3">
        {topCandidates.map((c, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-700/50"
            style={{
              borderLeftColor: c.partyColor || "#4B5563",
              borderLeftWidth: "4px",
            }}
          >
            <div className="flex items-center gap-3">
              {c.partyLogoUrl ? (
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white flex-shrink-0 border border-gray-600">
                  <img
                    src={c.partyLogoUrl}
                    alt={c.party}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${idx === 0 ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" : "bg-gray-800 text-gray-400 border border-gray-700"}`}
                >
                  {idx + 1}
                </div>
              )}
              <div className="flex flex-col overflow-hidden">
                <span
                  className={`font-medium text-sm truncate ${idx === 0 ? "text-white" : "text-gray-300"}`}
                  title={c.romanizedName || c.name}
                >
                  {c.name}
                </span>
                <span
                  className="text-xs text-gray-500 truncate max-w-[140px]"
                  title={c.party}
                >
                  {c.party}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span
                className={`font-bold tabular-nums ${idx === 0 ? "text-emerald-400 text-lg" : "text-gray-300"}`}
              >
                {c.votes.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
        {othersVotes > 0 && (
          <div className="mt-2 text-center text-xs text-gray-500">
            + {othersVotes.toLocaleString()} votes for other candidates
          </div>
        )}
      </div>
    </div>
  );
}
