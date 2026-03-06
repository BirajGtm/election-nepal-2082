const PR_TOTAL_SEATS = 110;
const THRESHOLD_PCT = 0.03;

function calcPredictions(prParties) {
  const totalVotes = prParties.reduce((s, p) => s + p.prVotes, 0);
  if (totalVotes === 0) return { seatsMap: {}, threshold: 0, totalVotes: 0 };

  const threshold = totalVotes * THRESHOLD_PCT;
  const eligible = prParties.filter((p) => p.prVotes >= threshold);
  const eligibleTotal = eligible.reduce((s, p) => s + p.prVotes, 0);

  const rawSeats = eligible.map((p) => ({
    party: p.party,
    raw: (p.prVotes / eligibleTotal) * PR_TOTAL_SEATS,
  }));

  const floored = rawSeats.map((p) => ({ ...p, seats: Math.floor(p.raw) }));
  let remaining = PR_TOTAL_SEATS - floored.reduce((s, p) => s + p.seats, 0);
  floored
    .map((p, i) => ({ i, rem: p.raw - p.seats }))
    .sort((a, b) => b.rem - a.rem)
    .slice(0, remaining)
    .forEach(({ i }) => floored[i].seats++);

  const seatsMap = {};
  floored.forEach((p) => (seatsMap[p.party] = p.seats));
  return { seatsMap, threshold, totalVotes };
}

export default function PRVotes({ nationalSummary }) {
  if (!nationalSummary || nationalSummary.length === 0) return null;

  const prParties = nationalSummary
    .filter((p) => p.prVotes > 0)
    .sort((a, b) => b.prVotes - a.prVotes);

  if (prParties.length === 0) return null;

  const { seatsMap, threshold, totalVotes } = calcPredictions(prParties);
  const maxVotes = prParties[0].prVotes;

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
    <section className="mb-8">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          सामानुपातिक मत
        </h2>
        <span className="bg-purple-500/10 text-purple-400 text-sm font-medium px-3 py-1 rounded-full border border-purple-500/20">
          PR Votes · {PR_TOTAL_SEATS} seats
        </span>
        <span className="text-xs text-gray-500 ml-auto tabular-nums">
          Total: {fmt(totalVotes)} · Threshold: {pct(threshold)}% (
          {fmt(Math.ceil(threshold))} votes)
        </span>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        {prParties.map((p, idx) => {
          const color = getColor(p);
          const barWidth = Math.max((p.prVotes / maxVotes) * 100, 2);
          const isEligible = p.prVotes >= threshold;
          const predictedSeats = seatsMap[p.party];

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
                <div className="flex items-center gap-2 flex-shrink-0 text-right">
                  {isEligible ? (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                      style={{
                        color,
                        borderColor: color + "55",
                        background: color + "15",
                      }}
                    >
                      ~{predictedSeats} seats
                    </span>
                  ) : (
                    <span className="text-xs text-red-400 border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 rounded">
                      Below 3%
                    </span>
                  )}
                  <span className="text-xs text-gray-500 w-10 text-right">
                    {pct(p.prVotes)}%
                  </span>
                  <span className="text-sm font-bold text-white tabular-nums w-20 text-right">
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
      <p className="text-xs text-gray-600 mt-2 text-right">
        * Seat prediction based on current partial votes using Hare quota
        method. Final result may vary.
      </p>
    </section>
  );
}
