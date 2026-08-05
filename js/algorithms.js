/* TeamDraft v2 — team balancing
 * ---------------------------------------------------------------------------
 * Shared balance-score (fitness), plus two algorithms that both maximise it:
 *   - genetic()  : GA port of the original Python engine (approximate)
 *   - brute()    : exhaustive optimal split (deterministic, small N only)
 *
 * A "player" here is { id, positioning, attack, defense, stamina }.
 * "weights" is { positioning, attack, defense, stamina } (numbers >= 0).
 */
window.TD = window.TD || {};

TD.algo = (function () {
  const STATS = ["positioning", "attack", "defense", "stamina"];

  function teamStats(team) {
    const s = { positioning: 0, attack: 0, defense: 0, stamina: 0 };
    for (const p of team)
      for (const k of STATS) s[k] += Number(p[k]) || 0;
    return s;
  }

  /* Balance score in [0,1], higher = more balanced.
   * mode "linear"  : weighted sum of per-stat differences (original formula).
   * mode "squared" : weighted sum of SQUARED per-stat differences, then
   *                  sqrt-ed back to the same scale. Penalises any single
   *                  large per-stat gap more, so imbalance is spread evenly
   *                  across stats instead of concentrated in one. */
  function balanceScore(statsA, statsB, weights, mode) {
    const totalW = STATS.reduce((t, k) => t + (Number(weights[k]) || 0), 0);
    if (totalW === 0) return 0;
    let weighted = 0;
    for (const k of STATS) {
      const w = Number(weights[k]) || 0;
      const denom = Math.max(statsA[k], statsB[k]) || 1;
      const diff = Math.abs(statsA[k] - statsB[k]) / denom; // in [0,1]
      weighted += (mode === "squared" ? diff * diff : diff) * w;
    }
    const norm = weighted / totalW; // in [0,1]
    return mode === "squared" ? 1 - Math.sqrt(norm) : 1 - norm;
  }

  // Per-player averages (mean of each stat). Using averages instead of sums
  // means uneven teams (e.g. 8 v 7) are balanced by per-player strength, not
  // by total — so the short-handed team isn't forced to be stronger. For even
  // teams the /n cancels and the score is identical to the sum-based one.
  function teamAverages(team) {
    const n = team.length || 1;
    const s = teamStats(team);
    return {
      positioning: s.positioning / n,
      attack: s.attack / n,
      defense: s.defense / n,
      stamina: s.stamina / n,
    };
  }

  // Generalised balance score for K teams (K >= 2), on per-player averages.
  // For each stat we take the MEAN normalised difference over all team pairs,
  // then weight + combine. For K = 2 this is exactly scoreSplit / the 2-team
  // formula (a single pair), so nothing changes for existing 2-team drafts.
  function scoreTeams(teams, weights, mode) {
    const totalW = STATS.reduce((t, k) => t + (Number(weights[k]) || 0), 0);
    if (totalW === 0) return 0;
    const avgs = teams.map(teamAverages);
    const K = avgs.length;
    let weighted = 0;
    for (const k of STATS) {
      const w = Number(weights[k]) || 0;
      if (!w) continue;
      let pairSum = 0, pairs = 0;
      for (let i = 0; i < K; i++)
        for (let j = i + 1; j < K; j++) {
          const denom = Math.max(avgs[i][k], avgs[j][k]) || 1;
          const diff = Math.abs(avgs[i][k] - avgs[j][k]) / denom; // in [0,1]
          pairSum += mode === "squared" ? diff * diff : diff;
          pairs++;
        }
      weighted += (pairs ? pairSum / pairs : 0) * w;
    }
    const norm = weighted / totalW;
    return mode === "squared" ? 1 - Math.sqrt(norm) : 1 - norm;
  }

  function scoreSplit(teamA, teamB, weights, mode) {
    return scoreTeams([teamA, teamB], weights, mode);
  }

  // Fisher-Yates shuffle (returns a new array; does not mutate input).
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ------------------------------- Brute force --------------------------- */
  // Enumerate every even split. Fix player 0 to team A to skip mirror dupes.
  function brute(players, weights, mode) {
    const n = players.length;
    if (n < 2) throw new Error("Need at least 2 players.");
    const half = Math.floor(n / 2); // team A size (n even -> n/2, odd -> floor)
    const rest = players.slice(1);
    const pickA = half - 1; // remaining spots on A after fixing player 0

    let best = null;
    // choose pickA members of `rest` for team A
    const combo = [];
    (function choose(start, needed) {
      if (needed === 0) {
        const aIdx = new Set(combo);
        const teamA = [players[0]];
        const teamB = [];
        rest.forEach((p, i) => (aIdx.has(i) ? teamA : teamB).push(p));
        const score = scoreSplit(teamA, teamB, weights, mode);
        if (!best || score > best.score) best = { teamA, teamB, score };
        return;
      }
      for (let i = start; i <= rest.length - needed; i++) {
        combo.push(i);
        choose(i + 1, needed - 1);
        combo.pop();
      }
    })(0, pickA);

    return best;
  }

  function bruteCombinations(n) {
    if (n < 2) return 0;
    const half = Math.floor(n / 2);
    // C(n-1, half-1)
    let k = half - 1,
      m = n - 1,
      c = 1;
    if (k < 0 || k > m) return 0;
    k = Math.min(k, m - k);
    for (let i = 0; i < k; i++) c = (c * (m - i)) / (i + 1);
    return Math.round(c);
  }

  /* --------------------------------- GA ---------------------------------- */
  // Chromosome: array of 0/1, gene i => player i on team A (1) or B (0).
  function genetic(players, weights, mode, opts) {
    const o = Object.assign(
      { populationSize: 200, generations: 100, cxpb: 0.7, mutpb: 0.2, indpb: 0.05, restarts: 3 },
      opts || {}
    );
    const n = players.length;
    if (n < 2) throw new Error("Need at least 2 players.");

    const evaluate = (ind) => {
      const teamA = [],
        teamB = [];
      for (let i = 0; i < n; i++) (ind[i] === 1 ? teamA : teamB).push(players[i]);
      if (Math.abs(teamA.length - teamB.length) > 1) return 0; // size penalty
      return scoreSplit(teamA, teamB, weights, mode);
    };

    const randInd = () => Array.from({ length: n }, () => (Math.random() < 0.5 ? 1 : 0));
    const tournament = (pop, fits, k = 3) => {
      let best = -1;
      for (let i = 0; i < k; i++) {
        const c = (Math.random() * pop.length) | 0;
        if (best === -1 || fits[c] > fits[best]) best = c;
      }
      return pop[best].slice();
    };

    let globalBest = null;
    for (let r = 0; r < o.restarts; r++) {
      let pop = Array.from({ length: o.populationSize }, randInd);
      let fits = pop.map(evaluate);

      for (let g = 0; g < o.generations; g++) {
        const next = [];
        while (next.length < o.populationSize) {
          let a = tournament(pop, fits),
            b = tournament(pop, fits);
          if (Math.random() < o.cxpb) {
            // two-point crossover
            let p1 = (Math.random() * n) | 0,
              p2 = (Math.random() * n) | 0;
            if (p1 > p2) [p1, p2] = [p2, p1];
            for (let i = p1; i < p2; i++) {
              const t = a[i];
              a[i] = b[i];
              b[i] = t;
            }
          }
          for (const child of [a, b]) {
            if (Math.random() < o.mutpb)
              for (let i = 0; i < n; i++)
                if (Math.random() < o.indpb) child[i] = child[i] ? 0 : 1;
            next.push(child);
          }
        }
        pop = next.slice(0, o.populationSize);
        fits = pop.map(evaluate);
      }

      let bi = 0;
      for (let i = 1; i < fits.length; i++) if (fits[i] > fits[bi]) bi = i;
      if (!globalBest || fits[bi] > globalBest.score)
        globalBest = { ind: pop[bi].slice(), score: fits[bi] };
    }

    const teamA = [],
      teamB = [];
    globalBest.ind.forEach((g, i) => (g === 1 ? teamA : teamB).push(players[i]));
    return { teamA, teamB, score: globalBest.score };
  }

  /* --------------------- Multi-team genetic (K >= 2) --------------------- */
  // Chromosome: int[] with each gene in [0, numTeams). Individuals start as a
  // balanced round-robin assignment and only ever undergo SWAP mutation, so
  // every candidate keeps balanced team sizes (differ by at most 1) — no size
  // penalty needed. Returns { teams: [players[]...], score }.
  function geneticMulti(players, weights, mode, numTeams, opts) {
    const o = Object.assign(
      { populationSize: 160, generations: 140, restarts: 4, swaps: 2 },
      opts || {}
    );
    const n = players.length;
    numTeams = numTeams || 2;
    if (n < numTeams) throw new Error("Need at least " + numTeams + " players.");

    const balancedInit = () => {
      const a = Array.from({ length: n }, (_, i) => i % numTeams);
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    const teamsOf = (ind) => {
      const t = Array.from({ length: numTeams }, () => []);
      ind.forEach((g, i) => t[g].push(players[i]));
      return t;
    };
    const evaluate = (ind) => scoreTeams(teamsOf(ind), weights, mode);
    const swapMutate = (ind) => {
      const c = ind.slice();
      for (let s = 0; s < o.swaps; s++) {
        const i = (Math.random() * n) | 0;
        const j = (Math.random() * n) | 0;
        if (c[i] !== c[j]) [c[i], c[j]] = [c[j], c[i]];
      }
      return c;
    };
    const tournament = (pop, fits, k = 3) => {
      let b = -1;
      for (let i = 0; i < k; i++) {
        const c = (Math.random() * pop.length) | 0;
        if (b < 0 || fits[c] > fits[b]) b = c;
      }
      return pop[b];
    };

    let best = null;
    for (let r = 0; r < o.restarts; r++) {
      let pop = Array.from({ length: o.populationSize }, balancedInit);
      let fits = pop.map(evaluate);
      for (let g = 0; g < o.generations; g++) {
        let bi = 0;
        for (let i = 1; i < fits.length; i++) if (fits[i] > fits[bi]) bi = i;
        const next = [pop[bi].slice()]; // elitism
        while (next.length < o.populationSize) next.push(swapMutate(tournament(pop, fits)));
        pop = next;
        fits = pop.map(evaluate);
      }
      let bi = 0;
      for (let i = 1; i < fits.length; i++) if (fits[i] > fits[bi]) bi = i;
      if (!best || fits[bi] > best.score) best = { ind: pop[bi].slice(), score: fits[bi] };
    }
    return { teams: teamsOf(best.ind), score: best.score };
  }

  return {
    STATS, teamStats, teamAverages, balanceScore, scoreSplit, scoreTeams,
    shuffle, brute, bruteCombinations, genetic, geneticMulti,
  };
})();
