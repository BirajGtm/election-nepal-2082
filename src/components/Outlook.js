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

  // Calculate top party projections
  // Use nationalSummary which is already sorted by leading+won
  const topPartyObj = data.nationalSummary[0] || null;
  let topPartyText = "";
  if (
    topPartyObj &&
    topPartyObj.party !== "अन्य" &&
    topPartyObj.party !== "Others"
  ) {
    const currentScore = topPartyObj.leading + topPartyObj.won;
    const projectedSeats = Math.round(
      (currentScore / reportingConstituencies) * totalConstituencies,
    );

    // Cap at 165
    const safeProjected = Math.min(totalConstituencies, projectedSeats);

    topPartyText = `${topPartyObj.party} is projected to secure ${safeProjected} seats if current margins hold. `;
  }

  // Calculate total votes for the leading party across all constituencies
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

  // Calculate the percentage share
  const topPartyPercentage =
    totalValidVotes > 0
      ? ((leadingPartyTotalVotes / totalValidVotes) * 100).toFixed(1)
      : 0;

  return (
    <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-900/40 rounded-xl p-5 mb-8 relative overflow-hidden shadow-lg backdrop-blur-sm">
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl"></div>
      <p className="text-sm md:text-base leading-relaxed text-blue-100/80">
        <strong className="text-white tracking-wide uppercase text-xs mr-2 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
          Outlook
        </strong>
        With{" "}
        <span className="text-white font-medium">
          {reportingConstituencies}
        </span>{" "}
        out of{" "}
        <span className="text-white font-medium">{totalConstituencies}</span>{" "}
        constituencies currently reporting, {topPartyText}
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
