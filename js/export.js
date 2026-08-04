/* TeamDraft v2 — exports
 * - buildCsv       : tidy, one row per player per chosen match (human-friendly)
 * - buildMatchCsv  : one row per chosen match with team-total features (ML)
 * - buildMatchJson : nested JSON per chosen match with full vectors (ML)
 * All only include CHOSEN matches that have a recorded result.
 */
window.TD = window.TD || {};

TD.exporter = (function () {
  const STATS = ["positioning", "attack", "defense", "stamina"];

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

  const teamTotals = (players) => {
    const t = { positioning: 0, attack: 0, defense: 0, stamina: 0 };
    for (const p of players) for (const k of STATS) t[k] += Number(p[k]) || 0;
    return t;
  };

  const eligible = (matches) =>
    matches.filter((m) => m.chosenDraftId && m.result && m.draft);

  /* -------------------- tidy: one row per player per match --------------- */
  const TIDY_HEADERS = [
    "match_date", "match_id", "balance_score", "algorithm", "balance_mode",
    "team", "team_goals", "opponent_goals", "outcome",
    "player_name", "positioning", "attack", "defense", "stamina",
  ];
  function buildCsv(matches, playersById) {
    const rows = [TIDY_HEADERS.join(",")];
    for (const m of eligible(matches)) {
      const d = m.draft;
      const gA = Number(m.result.teamAGoals);
      const gB = Number(m.result.teamBGoals);
      const emit = (ids, team, goals, opp) => {
        for (const id of ids) {
          const p = playersById[id];
          if (!p) continue;
          rows.push(
            [
              fmtDate(m.datetime), m.id, d.balanceScore ?? "", d.algorithm || "",
              d.balanceMode || "linear", team, goals, opp, outcome(goals, opp),
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

  /* ---------------- ML: one row per match with team features ------------- */
  const MATCH_HEADERS = [
    "match_date", "match_id", "algorithm", "balance_mode", "balance_score",
    "teamA_players", "teamB_players",
    "A_pos", "A_att", "A_def", "A_sta",
    "B_pos", "B_att", "B_def", "B_sta",
    "diff_pos", "diff_att", "diff_def", "diff_sta",
    "teamA_goals", "teamB_goals", "margin", "winner",
  ];
  function matchRow(m, playersById) {
    const d = m.draft;
    const teamA = d.teamAPlayerIds.map((id) => playersById[id]).filter(Boolean);
    const teamB = d.teamBPlayerIds.map((id) => playersById[id]).filter(Boolean);
    const A = teamTotals(teamA);
    const B = teamTotals(teamB);
    const gA = Number(m.result.teamAGoals);
    const gB = Number(m.result.teamBGoals);
    const winner = gA > gB ? "A" : gB > gA ? "B" : "draw";
    return {
      match_date: fmtDate(m.datetime), match_id: m.id,
      algorithm: d.algorithm || "", balance_mode: d.balanceMode || "linear",
      balance_score: d.balanceScore ?? "",
      teamA_players: teamA.map((p) => p.name).join("; "),
      teamB_players: teamB.map((p) => p.name).join("; "),
      A_pos: A.positioning, A_att: A.attack, A_def: A.defense, A_sta: A.stamina,
      B_pos: B.positioning, B_att: B.attack, B_def: B.defense, B_sta: B.stamina,
      diff_pos: Math.abs(A.positioning - B.positioning),
      diff_att: Math.abs(A.attack - B.attack),
      diff_def: Math.abs(A.defense - B.defense),
      diff_sta: Math.abs(A.stamina - B.stamina),
      teamA_goals: gA, teamB_goals: gB, margin: Math.abs(gA - gB), winner,
    };
  }
  function buildMatchCsv(matches, playersById) {
    const rows = [MATCH_HEADERS.join(",")];
    for (const m of eligible(matches)) {
      const r = matchRow(m, playersById);
      rows.push(MATCH_HEADERS.map((h) => esc(r[h])).join(","));
    }
    return rows.join("\n");
  }

  /* ---------------- ML: nested JSON with full player vectors ------------- */
  function buildMatchJson(matches, playersById) {
    const vec = (p) => ({
      name: p.name, positioning: p.positioning, attack: p.attack,
      defense: p.defense, stamina: p.stamina,
    });
    const out = eligible(matches).map((m) => {
      const d = m.draft;
      const teamA = d.teamAPlayerIds.map((id) => playersById[id]).filter(Boolean);
      const teamB = d.teamBPlayerIds.map((id) => playersById[id]).filter(Boolean);
      const gA = Number(m.result.teamAGoals);
      const gB = Number(m.result.teamBGoals);
      return {
        match_id: m.id,
        date: fmtDate(m.datetime),
        algorithm: d.algorithm || "",
        balance_mode: d.balanceMode || "linear",
        balance_score: d.balanceScore ?? null,
        weights: d.weights || null,
        teamA: teamA.map(vec),
        teamB: teamB.map(vec),
        teamA_totals: teamTotals(teamA),
        teamB_totals: teamTotals(teamB),
        result: { teamA_goals: gA, teamB_goals: gB, margin: Math.abs(gA - gB), winner: gA > gB ? "A" : gB > gA ? "B" : "draw" },
      };
    });
    return JSON.stringify(out, null, 2);
  }

  function download(filename, text, type) {
    const blob = new Blob([text], { type: (type || "text/csv") + ";charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return { buildCsv, buildMatchCsv, buildMatchJson, download };
})();
