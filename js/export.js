/* TeamDraft v2 — CSV export
 * Tidy format: one row per player per CHOSEN match with a recorded result.
 */
window.TD = window.TD || {};

TD.exporter = (function () {
  const HEADERS = [
    "match_date", "match_id", "balance_score", "algorithm",
    "team", "team_goals", "opponent_goals", "outcome",
    "player_name", "positioning", "attack", "defense", "stamina",
  ];

  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const fmtDate = (ts) => (ts ? new Date(ts).toISOString().slice(0, 10) : "");

  function outcome(mine, theirs) {
    if (mine > theirs) return "win";
    if (mine < theirs) return "loss";
    return "draw";
  }

  // groupName, matches[], playersById map, and a getDraft(matchId, draftId) fn.
  function buildCsv(matches, playersById) {
    const rows = [HEADERS.join(",")];

    for (const m of matches) {
      if (!m.chosenDraftId || !m.result || !m.draft) continue;
      const d = m.draft;
      const gA = Number(m.result.teamAGoals);
      const gB = Number(m.result.teamBGoals);

      const emit = (ids, team, goals, opp) => {
        for (const id of ids) {
          const p = playersById[id];
          if (!p) continue;
          rows.push(
            [
              fmtDate(m.datetime), m.id, (d.balanceScore ?? "").toString(),
              d.algorithm || "", team, goals, opp, outcome(goals, opp),
              p.name, p.positioning, p.attack, p.defense, p.stamina,
            ].map(esc).join(",")
          );
        }
      };
      emit(d.teamAPlayerIds, "A", gA, gB);
      emit(d.teamBPlayerIds, "B", gB, gA);
    }
    return rows.join("\n");
  }

  function download(filename, text) {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return { buildCsv, download };
})();
