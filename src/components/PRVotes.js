export default function PRVotes({ nationalSummary }) {
  if (!nationalSummary || nationalSummary.length === 0) return null;

  // Only show parties with PR votes, sorted highest first
  const prParties = nationalSummary
    .filter((p) => p.prVotes > 0)
    .sort((a, b) => b.prVotes - a.prVotes);

  if (prParties.length === 0) return null;

  const maxVotes = prParties[0].prVotes;
  const totalVotes = prParties.reduce((sum, p) => sum + p.prVotes, 0);

  const fmt = (n) => n.toLocaleString("en-US");
  const pct = (n) => ((n / totalVotes) * 100).toFixed(1);

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          सामानुपातिक मत
        </h2>
        <span className="bg-purple-500/10 text-purple-400 text-sm font-medium px-3 py-1 rounded-full border border-purple-500/20">
          PR Votes
        </span>
        <span className="text-xs text-gray-500 ml-auto">
          Total: {fmt(totalVotes)} votes
        </span>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        {prParties.map((p, idx) => {
          const barWidth = Math.max((p.prVotes / maxVotes) * 100, 2);
          const partyPct = pct(p.prVotes);

          // Determine color from partyColor in the data or fallback
          let color = p.partyColor || "#9E9E9E";
          if (!p.partyColor) {
            if (p.party.includes("राष्ट्रिय स्वतन्त्र पार्टी"))
              color = "#03A9F4";
            else if (p.party.includes("नेपाली कांग्रेस")) color = "#22c55e";
            else if (p.party.includes("एमाले")) color = "#E53935";
            else if (p.party.includes("नेपाली कम्युनिष्ट")) color = "#C62828";
            else if (
              p.party.includes("राष्ट्रिय प्रजातन्त्र") ||
              p.party.includes("राप्रपा")
            )
              color = "#FF9800";
          }

          return (
            <div key={idx} className="group">
              <div className="flex items-center gap-3 mb-1.5">
                {/* Logo */}
                {p.logoUrl ? (
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-white flex-shrink-0 border border-gray-700">
                    <img
                      src={p.logoUrl}
                      alt={p.party}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex-shrink-0"
                    style={{ background: color + "33" }}
                  />
                )}

                {/* Party name */}
                <span
                  className="text-sm font-medium text-gray-200 flex-1 truncate"
                  title={p.party}
                >
                  {p.party}
                </span>

                {/* Vote count + % */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-500">{partyPct}%</span>
                  <span className="text-sm font-bold text-white tabular-nums">
                    {fmt(p.prVotes)}
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden ml-10">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${barWidth}%`,
                    background: `linear-gradient(90deg, ${color}cc, ${color})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
