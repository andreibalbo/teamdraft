/* TeamDraft v2 — exports (supports 2 or 3 teams)
 * - buildCsv       : one row per player per GAME (human-friendly, tidy)
 * - buildMatchCsv  : one row per GAME (pairing) with team-total features (ML)
 * - buildMatchJson : nested JSON per match (teams + games) for ML
 * A 2-team match has 1 game; a 3-team match has 3 games (A×B, A×C, B×C).
 * Each enriched match carries: { ...match, draft, games:[{a,b,ga,gb}] }.
 */
window.TD = window.TD || {};

TD.exporter = (function () {
  const STATS = ["positioning", "attack", "defense", "stamina"];

  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const fmtDate = (ts) => (ts ? new Date(ts).toISOString().slice(0, 10) : "");
  const teamLetter = (i) => String.fromCharCode(65 + i);
  const teamIdsOf = (d) =>
    d.teams && d.teams.length ? d.teams : [d.teamAPlayerIds || [], d.teamBPlayerIds || []];

  function outcome(mine, theirs) {
    if (mine > theirs) return "win";
    if (mine < theirs) return "loss";
    return "draw";
  }
  const totals = (players) => {
    const t = { positioning: 0, attack: 0, defense: 0, stamina: 0 };
    for (const p of players) for (const k of STATS) t[k] += Number(p[k]) || 0;
    return t;
  };
  const eligible = (matches) => matches.filter((m) => m.draft && m.games && m.games.length);

  // Resolve each team's player objects for a match's chosen draft.
  const resolveTeams = (m, byId) =>
    teamIdsOf(m.draft).map((ids) => ids.map((id) => byId[id]).filter(Boolean));

  /* -------------------- tidy: one row per player per game ---------------- */
  const TIDY_HEADERS = [
    "match_date", "match_id", "num_teams", "game", "balance_score", "algorithm", "balance_mode",
    "team", "team_goals", "opponent", "opponent_goals", "outcome",
    "player_name", "positioning", "attack", "defense", "stamina",
  ];
  function buildCsv(matches, byId) {
    const rows = [TIDY_HEADERS.join(",")];
    for (const m of eligible(matches)) {
      const d = m.draft;
      const teams = resolveTeams(m, byId);
      const nTeams = teams.length;
      for (const g of m.games) {
        const gameLabel = `${teamLetter(g.a)}_vs_${teamLetter(g.b)}`;
        const emit = (idx, goals, opp, oppIdx) => {
          for (const p of teams[idx]) {
            rows.push(
              [
                fmtDate(m.datetime), m.id, nTeams, gameLabel, d.balanceScore ?? "",
                d.algorithm || "", d.balanceMode || "linear",
                teamLetter(idx), goals, teamLetter(oppIdx), opp, outcome(goals, opp),
                p.name, p.positioning, p.attack, p.defense, p.stamina,
              ].map(esc).join(",")
            );
          }
        };
        emit(g.a, g.ga, g.gb, g.b);
        emit(g.b, g.gb, g.ga, g.a);
      }
    }
    return rows.join("\n");
  }

  /* ---------------- ML: one row per game with team features -------------- */
  const MATCH_HEADERS = [
    "match_date", "match_id", "num_teams", "game", "algorithm", "balance_mode", "balance_score",
    "home_team", "away_team", "home_size", "away_size",
    "home_pos", "home_att", "home_def", "home_sta",
    "away_pos", "away_att", "away_def", "away_sta",
    "diff_pos", "diff_att", "diff_def", "diff_sta",
    "home_goals", "away_goals", "margin", "winner",
  ];
  function buildMatchCsv(matches, byId) {
    const rows = [MATCH_HEADERS.join(",")];
    for (const m of eligible(matches)) {
      const d = m.draft;
      const teams = resolveTeams(m, byId);
      for (const g of m.games) {
        const H = totals(teams[g.a]);
        const A = totals(teams[g.b]);
        const winner = g.ga > g.gb ? teamLetter(g.a) : g.gb > g.ga ? teamLetter(g.b) : "draw";
        const r = {
          match_date: fmtDate(m.datetime), match_id: m.id, num_teams: teams.length,
          game: `${teamLetter(g.a)}_vs_${teamLetter(g.b)}`,
          algorithm: d.algorithm || "", balance_mode: d.balanceMode || "linear",
          balance_score: d.balanceScore ?? "",
          home_team: teamLetter(g.a), away_team: teamLetter(g.b),
          home_size: teams[g.a].length, away_size: teams[g.b].length,
          home_pos: H.positioning, home_att: H.attack, home_def: H.defense, home_sta: H.stamina,
          away_pos: A.positioning, away_att: A.attack, away_def: A.defense, away_sta: A.stamina,
          diff_pos: Math.abs(H.positioning - A.positioning),
          diff_att: Math.abs(H.attack - A.attack),
          diff_def: Math.abs(H.defense - A.defense),
          diff_sta: Math.abs(H.stamina - A.stamina),
          home_goals: g.ga, away_goals: g.gb, margin: Math.abs(g.ga - g.gb), winner,
        };
        rows.push(MATCH_HEADERS.map((h) => esc(r[h])).join(","));
      }
    }
    return rows.join("\n");
  }

  /* ---------------- ML: nested JSON (teams + games) --------------------- */
  function buildMatchJson(matches, byId) {
    const vec = (p) => ({
      name: p.name, positioning: p.positioning, attack: p.attack,
      defense: p.defense, stamina: p.stamina,
    });
    const out = eligible(matches).map((m) => {
      const d = m.draft;
      const teams = resolveTeams(m, byId);
      return {
        match_id: m.id,
        date: fmtDate(m.datetime),
        num_teams: teams.length,
        algorithm: d.algorithm || "",
        balance_mode: d.balanceMode || "linear",
        balance_score: d.balanceScore ?? null,
        weights: d.weights || null,
        teams: teams.map((t, i) => ({ team: teamLetter(i), players: t.map(vec), totals: totals(t) })),
        games: m.games.map((g) => ({
          home: teamLetter(g.a), away: teamLetter(g.b),
          home_goals: g.ga, away_goals: g.gb, margin: Math.abs(g.ga - g.gb),
          winner: g.ga > g.gb ? teamLetter(g.a) : g.gb > g.ga ? teamLetter(g.b) : "draw",
        })),
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
