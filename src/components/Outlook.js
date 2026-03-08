export default function Outlook({ data }) {
  if (
    !data ||
    !data.results ||
    !data.nationalSummary ||
    data.results.length === 0
  )
    return null;

  const totalConstituencies = 165;
  const reportingConstituencies = data.results.filter(
    (c) => c.candidates && c.candidates.length > 0 && c.candidates[0].votes > 0,
  ).length;

  if (reportingConstituencies === 0) {
    return (
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 mb-8 text-sm text-gray-400">
        <strong className="text-gray-300">Outlook:</strong> Waiting for the
        first verified results to begin predictive modeling.
      </div>
    );
  }

  // Calculate total valid votes currently counted
  let totalValidVotes = 0;
  data.results.forEach((c) => {
    if (c.candidates) {
      c.candidates.forEach((cand) => {
        totalValidVotes += cand.votes;
      });
    }
  });

  // Calculate total votes for the leading party across all constituencies
  const topPartyObj = data.nationalSummary[0] || null;
  let leadingPartyTotalVotes = 0;
  if (
    topPartyObj &&
    topPartyObj.party !== "अन्य" &&
    topPartyObj.party !== "Others"
  ) {
    data.results.forEach((c) => {
      if (c.candidates) {
        c.candidates.forEach((cand) => {
          if (
            cand.party === topPartyObj.party ||
            cand.enPartyName === topPartyObj.party ||
            topPartyObj.party.includes(cand.party)
          ) {
            leadingPartyTotalVotes += cand.votes;
          }
        });
      }
    });
  }

  const topPartyPercentage =
    totalValidVotes > 0
      ? ((leadingPartyTotalVotes / totalValidVotes) * 100).toFixed(1)
      : 0;

  // Calculate PR Eligible Parties
  const PR_TOTAL_SEATS = 110;
  const THRESHOLD_PCT = 0.03;

  const totalPRVotes = data.nationalSummary.reduce(
    (sum, p) => sum + (p.prVotes || 0),
    0,
  );
  const prThreshold = totalPRVotes * THRESHOLD_PCT;

  // Eligible: passes 3% PR threshold and is NOT an independent candidate
  const eligibleParties = data.nationalSummary.filter(
    (p) => (p.prVotes || 0) >= prThreshold && p.party !== "स्वतन्त्र",
  );
  const eligiblePRTotal = eligibleParties.reduce(
    (sum, p) => sum + (p.prVotes || 0),
    0,
  );

  const rawPRSeats = eligibleParties.map((p) => ({
    party: p.party,
    raw:
      eligiblePRTotal > 0 ? (p.prVotes / eligiblePRTotal) * PR_TOTAL_SEATS : 0,
  }));

  // Apply Hare Quota (Largest Remainder)
  const flooredPRSeats = rawPRSeats.map((p) => ({
    ...p,
    seats: Math.floor(p.raw),
  }));
  const remainingPRSeats =
    PR_TOTAL_SEATS - flooredPRSeats.reduce((s, p) => s + p.seats, 0);

  flooredPRSeats
    .map((p, i) => ({ i, rem: p.raw - p.seats }))
    .sort((a, b) => b.rem - a.rem)
    .slice(0, remainingPRSeats)
    .forEach(({ i }) => flooredPRSeats[i].seats++);

  const prSeatsMap = {};
  flooredPRSeats.forEach((p) => {
    prSeatsMap[p.party] = p.seats;
  });

  // Calculate Total Predicted Seats per Party
  const partyPredictions = data.nationalSummary
    .filter((p) => p.party !== "स्वतन्त्र")
    .map((p) => {
      const won = p.won || 0;
      // Safe leads: Comfortable (35-60%) + Landslide (>60%)
      const safeLeads =
        (p.margins?.comfortable || 0) + (p.margins?.landslide || 0);
      const prSeats = prSeatsMap[p.party] || 0;
      const totalPredicted = won + safeLeads + prSeats;
      return {
        party: p.party,
        logoUrl: p.partyLogoUrl,
        partyColor: p.partyColor,
        won,
        safeLeads,
        prSeats,
        totalPredicted,
      };
    })
    .filter((p) => p.totalPredicted > 0)
    .sort((a, b) => b.totalPredicted - a.totalPredicted);

  return (
    <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-900/40 rounded-xl p-5 mb-8 relative overflow-hidden shadow-lg backdrop-blur-sm">
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl"></div>

      <div className="flex items-center gap-2 mb-4">
        <strong className="text-white tracking-wide uppercase text-xs bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
          Seat Prediction Overview
        </strong>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-5 max-h-96 overflow-y-auto pr-2">
        {partyPredictions.map((pp, idx) => (
          <div
            key={idx}
            className="bg-gray-900/60 p-3 rounded-lg border border-gray-800 flex flex-col justify-between gap-2 transition-all hover:bg-gray-800/80"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-700 bg-white shadow-sm">
                {pp.logoUrl ? (
                  <img
                    src={pp.logoUrl}
                    alt={pp.party}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: pp.partyColor }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4
                  className="text-white font-medium text-sm truncate leading-tight"
                  title={pp.party}
                >
                  {pp.party}
                </h4>
              </div>
              <div className="text-right shrink-0">
                <div
                  className="text-2xl font-black leading-none"
                  style={{ color: pp.partyColor || "#fff" }}
                >
                  {pp.totalPredicted}
                </div>
              </div>
            </div>
            <div className="flex justify-between text-[11px] text-gray-400 border-t border-gray-800/50 pt-2 px-1">
              <span className="flex flex-col items-center">
                <span className="uppercase tracking-wider">Won</span>
                <span className="text-gray-300 font-bold">{pp.won}</span>
              </span>
              <span className="flex flex-col items-center">
                <span className="uppercase tracking-wider">Safe Leads</span>
                <span className="text-gray-300 font-bold">{pp.safeLeads}</span>
              </span>
              <span className="flex flex-col items-center">
                <span className="uppercase tracking-wider">PR</span>
                <span className="text-gray-300 font-bold">{pp.prSeats}</span>
              </span>
            </div>
          </div>
        ))}
        {partyPredictions.length === 0 && (
          <div className="col-span-full text-center text-sm text-gray-500 py-4">
            No parties have met the PR or FPTP criteria for predictions yet.
          </div>
        )}
      </div>

      <p className="text-sm md:text-base leading-relaxed text-blue-100/80 mt-4 border-t border-blue-900/40 pt-4">
        Out of the{" "}
        <span className="text-white font-medium">
          {totalValidVotes.toLocaleString()}
        </span>{" "}
        valid votes counted so far,{" "}
        <span className="text-white font-bold">
          {topPartyObj?.party || "the leading party"}
        </span>{" "}
        has secured{" "}
        <span className="text-white font-medium">
          {leadingPartyTotalVotes.toLocaleString()}
        </span>{" "}
        votes, representing{" "}
        <span className="text-white font-bold text-lg">
          {topPartyPercentage}%
        </span>{" "}
        of the total popular vote.
      </p>
    </div>
  );
}
