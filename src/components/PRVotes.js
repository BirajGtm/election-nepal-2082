const PR_TOTAL_SEATS = 110;
const THRESHOLD_PCT = 0.03;

function predictPRSeats(prParties) {
  const totalVotes = prParties.reduce((s, p) => s + p.prVotes, 0);
  if (totalVotes === 0) return [];

  const threshold = totalVotes * THRESHOLD_PCT;

  const eligible = prParties.filter((p) => p.prVotes >= threshold);
  const ineligible = prParties.filter((p) => p.prVotes < threshold);

  const eligibleTotal = eligible.reduce((s, p) => s + p.prVotes, 0);

  // Distribute 110 seats proportionally (Hare quota / largest remainder)
  const rawSeats = eligible.map((p) => ({
    ...p,
    raw: (p.prVotes / eligibleTotal) * PR_TOTAL_SEATS,
  }));

  // Floor seats first
  let distributed = rawSeats.map((p) => ({ ...p, seats: Math.floor(p.raw) }));
  let remaining = PR_TOTAL_SEATS - distributed.reduce((s, p) => s + p.seats, 0);

  // Give remaining seats to parties with largest remainders
  distributed
    .map((p, i) => ({ i, rem: p.raw - p.seats }))
    .sort((a, b) => b.rem - a.rem)
    .slice(0, remaining)
    .forEach(({ i }) => distributed[i].seats++);

  return {
    eligible: distributed,
    ineligible,
    totalVotes,
    threshold,
  };
}

export default function PRVotes({ nationalSummary }) {
  if (!nationalSummary || nationalSummary.length === 0) return null;

  const prParties = nationalSummary
    .filter((p) => p.prVotes > 0)
    .sort((a, b) => b.prVotes - a.prVotes);

  if (prParties.length === 0) return null;

  const maxVotes = prParties[0].prVotes;
  const totalVotes = prParties.reduce((s, p) => s + p.prVotes, 0);
  const prediction = predictPRSeats(prParties);

  const fmt = (n) => n.toLocaleString("en-US");
  const pct = (n) => ((n / totalVotes) * 100).toFixed(1);

  function getColor(p) {
    if (p.partyColor) return p.partyColor;
    if (p.party.includes("राष्ट्रिय स्वतन्त्र पार्टी")) return "#03A9F4";
    if (p.party.includes("नेपाली कांग्रेस")) return "#22c55e";
    if (p.party.includes("एमाले")) return "#E53935";
    if (p.party.includes("नेपाली कम्युनिष्ट")) return "#C62828";
    if (
      p.party.includes("राष्ट्रिय प्रजातन्त्र") ||
      p.party.includes("राप्रपा")
    )
      return "#FF9800";
    return "#9E9E9E";
  }

  return (
    <section className="mb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          सामानुपातिक मत
        </h2>
        <span className="bg-purple-500/10 text-purple-400 text-sm font-medium px-3 py-1 rounded-full border border-purple-500/20">
          PR Votes
        </span>
        <span className="text-xs text-gray-500 ml-auto tabular-nums">
          Total: {fmt(totalVotes)} votes
        </span>
      </div>

      {/* Vote Bar Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        {prParties.map((p, idx) => {
          const color = getColor(p);
          const barWidth = Math.max((p.prVotes / maxVotes) * 100, 2);
          const isEligible = p.prVotes >= prediction.threshold;

          return (
            <div key={idx} className={isEligible ? "" : "opacity-50"}>
              <div className="flex items-center gap-3 mb-1.5">
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
                <span
                  className="text-sm font-medium text-gray-200 flex-1 truncate"
                  title={p.party}
                >
                  {p.party}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isEligible && (
                    <span className="text-xs text-red-400 border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 rounded">
                      Below threshold
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {pct(p.prVotes)}%
                  </span>
                  <span className="text-sm font-bold text-white tabular-nums">
                    {fmt(p.prVotes)}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden ml-10">
                <div
                  className="h-full rounded-full"
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

      {/* PR Seat Prediction */}
      {prediction.eligible && prediction.eligible.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-bold text-white">PR Seat Prediction</h3>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
              {PR_TOTAL_SEATS} seats · 3% threshold
            </span>
          </div>

          {/* Threshold note */}
          <p className="text-xs text-gray-500 mb-4">
            Threshold: {fmt(Math.ceil(prediction.threshold))} votes (
            {THRESHOLD_PCT * 100}% of total).{" "}
            {prediction.ineligible.length > 0 && (
              <span className="text-red-400">
                {prediction.ineligible.length} part
                {prediction.ineligible.length > 1 ? "ies" : "y"} eliminated.
              </span>
            )}
          </p>

          <div className="space-y-3">
            {prediction.eligible.map((p, idx) => {
              const color = getColor(p);
              const barWidth = Math.max((p.seats / PR_TOTAL_SEATS) * 100, 2);

              return (
                <div key={idx} className="flex items-center gap-3">
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-sm font-medium text-gray-200 truncate"
                        title={p.party}
                      >
                        {p.party}
                      </span>
                      <span
                        className="text-base font-bold tabular-nums flex-shrink-0 ml-2"
                        style={{ color }}
                      >
                        {p.seats} seats
                      </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${barWidth}%`,
                          background: `linear-gradient(90deg, ${color}99, ${color})`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-600 mt-4">
            * Prediction based on current partial PR votes using Hare quota with
            largest remainder method. Final distribution may vary.
          </p>
        </div>
      )}
    </section>
  );
}
