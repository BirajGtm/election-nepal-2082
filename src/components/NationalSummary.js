export default function NationalSummary({
  summary,
  selectedParty,
  onSelectParty,
}) {
  if (!summary || summary.length === 0) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-2xl w-full max-w-5xl mx-auto backdrop-blur-sm relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="bg-blue-600 w-2 h-6 rounded-full inline-block animate-pulse"></span>
          National Summary
        </h2>
        {selectedParty && (
          <button
            onClick={() => onSelectParty(null)}
            className="flex items-center gap-2 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 hover:border-sky-500/50 rounded-full transition-all text-sm font-medium"
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
            Clear Filter
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {summary.map((partyObj, idx) => {
          const isSelected = selectedParty === partyObj.party;
          const cardClass = `bg-gray-800/50 hover:bg-gray-800 transition-all border rounded-lg p-4 flex flex-col items-center text-center group cursor-pointer ${
            isSelected
              ? "border-2 scale-105 shadow-lg shadow-white/5 ring-2 ring-white/10"
              : "border-gray-700/50 border-t-[3px] opacity-90 hover:opacity-100"
          } ${selectedParty && !isSelected ? "opacity-40 grayscale" : ""}`;

          return (
            <div
              key={idx}
              className={cardClass}
              style={{
                borderTopColor: isSelected ? undefined : partyObj.partyColor,
                borderColor: isSelected ? partyObj.partyColor : undefined,
              }}
              onClick={() => onSelectParty(isSelected ? null : partyObj.party)}
              title={`Click to see constituencies where ${partyObj.party} is leading`}
            >
              {partyObj.partyLogoUrl && (
                <div className="w-10 h-10 mb-2 rounded-full overflow-hidden bg-white flex-shrink-0 border border-gray-600">
                  <img
                    src={partyObj.partyLogoUrl}
                    alt={partyObj.party}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <span
                className={`text-sm font-medium transition-colors mb-2 line-clamp-2 min-h-[40px] flex items-center justify-center ${isSelected ? "text-white" : "text-gray-300 group-hover:text-white"}`}
              >
                {partyObj.party}
              </span>
              <div className="flex gap-4 w-full justify-center">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Won
                  </span>
                  <span className="text-xl font-bold text-emerald-400">
                    {partyObj.won}
                  </span>
                </div>
                <div className="w-px bg-gray-700"></div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Lead
                  </span>
                  <span className="text-xl font-bold text-blue-400">
                    {partyObj.leading}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
