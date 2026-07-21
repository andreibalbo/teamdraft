/* TeamDraft v2 — lineup / formation
 * Splits a team into [defense, midfield, attack] rows by positioning,
 * mirroring the original DraftService::LineUp logic.
 */
window.TD = window.TD || {};

TD.lineup = (function () {
  const RANGES = { defensive: [0, 35], midfield: [36, 65], attacking: [66, 100] };

  function positionOf(p) {
    const v = Number(p.positioning);
    if (v <= 35) return "DEF";
    if (v <= 65) return "MID";
    return "ATT";
  }

  // Returns [defenseRow, midfieldRow, attackRow].
  function formation(players) {
    const sorted = players.slice().sort((a, b) => a.positioning - b.positioning);
    const total = sorted.length;
    if (total === 0) return [[], [], []];

    if (total <= 4) {
      const mid = Math.ceil(total / 2);
      return [sorted.slice(0, mid), [], sorted.slice(mid)];
    }
    const base = Math.floor(total / 3);
    const rem = total % 3;
    const defSize = base + (rem > 0 ? 1 : 0);
    const midSize = base + (rem > 1 ? 1 : 0);
    let i = 0;
    const def = sorted.slice(i, (i += defSize));
    const midR = sorted.slice(i, (i += midSize));
    const att = sorted.slice(i);
    return [def, midR, att];
  }

  return { formation, positionOf, RANGES };
})();
