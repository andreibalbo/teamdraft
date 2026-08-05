/* TeamDraft v2 — UI + router (mobile-first) */
window.TD = window.TD || {};

TD.app = (function () {
  const store = TD.store;
  const cfg = TD.config;
  const $ = (id) => document.getElementById(id);

  const state = { screen: "groups", groupId: null, matchId: null, tab: "players" };

  /* ------------------------------- helpers ------------------------------- */
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  const pct = (n) => Math.round((Number(n) || 0) * 100);
  const fmtDate = (ts) =>
    ts ? new Date(ts).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "";
  const toLocalInput = (ts) => {
    const d = ts ? new Date(ts) : new Date();
    const off = d.getTimezoneOffset();
    return new Date(d - off * 60000).toISOString().slice(0, 16);
  };
  const posTag = (p) => {
    const t = TD.lineup.positionOf(p);
    const color = { DEF: "bg-blue-100 text-blue-700", MID: "bg-amber-100 text-amber-700", ATT: "bg-red-100 text-red-700" }[t];
    return `<span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${color}">${t}</span>`;
  };

  /* ------------------ multi-team helpers (2 or 3 teams) ------------------ */
  const teamLetter = (i) => String.fromCharCode(65 + i); // 0->A, 1->B, 2->C
  // Firestore rejects arrays-of-arrays, so team lists are stored as an
  // index-keyed map { "0": [...], "1": [...] }. Convert to/from an array here.
  const teamsToStore = (arr) => arr.reduce((o, ids, i) => ((o[i] = ids), o), {});
  // Player-id arrays for each team, generalised + backward compatible with
  // old drafts that stored teamAPlayerIds / teamBPlayerIds or a raw array.
  const draftTeamIds = (d) => {
    if (Array.isArray(d.teams)) return d.teams;
    if (d.teams && typeof d.teams === "object")
      return Object.keys(d.teams).map(Number).sort((a, b) => a - b).map((k) => d.teams[k]);
    return [d.teamAPlayerIds || [], d.teamBPlayerIds || []];
  };
  const draftTeamCount = (d) => draftTeamIds(d).length;
  // Round-robin pairings for K teams: [[0,1]] for 2, [[0,1],[0,2],[1,2]] for 3.
  const pairings = (k) => {
    const out = [];
    for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) out.push([i, j]);
    return out;
  };
  // Read a match's games in the generalised shape, migrating the old
  // 2-team result:{teamAGoals,teamBGoals} into a single game if needed.
  const readGames = (match) => {
    if (Array.isArray(match.games)) return match.games;
    if (match.result)
      return [{ a: 0, b: 1, ga: match.result.teamAGoals ?? 0, gb: match.result.teamBGoals ?? 0 }];
    return null;
  };

  function modal(html) {
    const host = $("modal-host");
    host.innerHTML = `
      <div class="fixed inset-0 bg-black/50 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4" data-close="bg">
        <div class="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-lg max-h-[92vh] overflow-y-auto">
          ${html}
        </div>
      </div>`;
    host.querySelector("[data-close=bg]").addEventListener("click", (e) => {
      if (e.target.dataset.close === "bg") closeModal();
    });
  }
  const closeModal = () => ($("modal-host").innerHTML = "");

  function toast(msg) {
    const t = document.createElement("div");
    t.className =
      "fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm px-4 py-2 rounded-full z-50 shadow";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }

  /* ------------------------------ navigation ----------------------------- */
  function go(screen, params = {}) {
    Object.assign(state, { screen }, params);
    render();
  }
  function back() {
    if (state.screen === "match") go("group", { matchId: null, tab: "matches" });
    else if (state.screen === "group") go("groups", { groupId: null });
  }

  async function render() {
    const view = $("view");
    const backBtn = $("back-btn");
    backBtn.classList.toggle("hidden", state.screen === "groups");
    view.innerHTML = `<div class="text-center text-slate-400 py-10">Loading…</div>`;
    try {
      if (state.screen === "groups") await renderGroups(view);
      else if (state.screen === "group") await renderGroup(view);
      else if (state.screen === "match") await renderMatch(view);
    } catch (e) {
      view.innerHTML = `<div class="text-red-600 p-4">Error: ${esc(e.message)}</div>`;
      console.error(e);
    }
  }

  /* ------------------------------- GROUPS -------------------------------- */
  async function renderGroups(view) {
    $("title").textContent = "Groups";
    const groups = await store.listGroups();
    view.innerHTML = `
      <button id="add-group" class="w-full bg-primary text-white rounded-xl py-3 font-semibold mb-4 active:scale-[.99]">+ New group</button>
      <div class="flex flex-col gap-3">
        ${
          groups.length
            ? groups
                .map(
                  (g) => `
          <div class="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 cursor-pointer" data-open="${g.id}">
            <div class="flex-1">
              <div class="font-semibold">${esc(g.name)}</div>
              <div class="text-xs text-slate-500">${esc(g.category || "")}${g.description ? " · " + esc(g.description) : ""}</div>
            </div>
            <button class="text-slate-400 p-2" data-edit="${g.id}">✎</button>
            <span class="text-slate-300">›</span>
          </div>`
                )
                .join("")
            : `<p class="text-center text-slate-400 py-8">No groups yet. Create your first one.</p>`
        }
      </div>`;

    $("add-group").onclick = () => groupModal();
    view.querySelectorAll("[data-open]").forEach((el) =>
      el.addEventListener("click", (e) => {
        if (e.target.dataset.edit) return;
        go("group", { groupId: el.dataset.open, tab: "players" });
      })
    );
    view.querySelectorAll("[data-edit]").forEach((el) =>
      el.addEventListener("click", async (e) => {
        e.stopPropagation();
        const g = (await store.listGroups()).find((x) => x.id === el.dataset.edit);
        groupModal(g);
      })
    );
  }

  function groupModal(g) {
    const editing = !!g;
    modal(`
      <div class="p-5">
        <h2 class="text-lg font-bold mb-4">${editing ? "Edit" : "New"} group</h2>
        <label class="block text-sm font-medium mb-1">Name</label>
        <input id="g-name" class="border rounded-lg w-full px-3 py-2 mb-3" value="${esc(g?.name || "")}" placeholder="Monday Football" />
        <label class="block text-sm font-medium mb-1">Category</label>
        <select id="g-cat" class="border rounded-lg w-full px-3 py-2 mb-3">
          ${["soccer", "society", "indoor"].map((c) => `<option ${g?.category === c ? "selected" : ""}>${c}</option>`).join("")}
        </select>
        <label class="block text-sm font-medium mb-1">Description</label>
        <input id="g-desc" class="border rounded-lg w-full px-3 py-2 mb-4" value="${esc(g?.description || "")}" />
        <div class="flex gap-2">
          ${editing ? `<button id="g-del" class="text-red-600 px-3 py-2">Delete</button>` : ""}
          <div class="flex-1"></div>
          <button data-close="bg" onclick="TD.app._closeModal()" class="px-4 py-2">Cancel</button>
          <button id="g-save" class="bg-primary text-white rounded-lg px-4 py-2 font-semibold">Save</button>
        </div>
      </div>`);
    $("g-save").onclick = async () => {
      const data = { name: $("g-name").value.trim(), category: $("g-cat").value, description: $("g-desc").value.trim() };
      if (!data.name) return toast("Name required");
      if (editing) await store.updateGroup(g.id, data);
      else await store.createGroup(data);
      closeModal();
      render();
    };
    if (editing)
      $("g-del").onclick = async () => {
        if (!confirm("Delete this group and all its players/matches?")) return;
        await store.deleteGroup(g.id);
        closeModal();
        go("groups", { groupId: null });
      };
  }

  /* ------------------------------- GROUP --------------------------------- */
  async function renderGroup(view) {
    const groups = await store.listGroups();
    const group = groups.find((g) => g.id === state.groupId);
    if (!group) return go("groups");
    $("title").textContent = group.name;

    const tab = state.tab || "players";
    view.innerHTML = `
      <div class="flex bg-white rounded-xl p-1 mb-4 shadow-sm">
        <button data-tab="players" class="flex-1 py-2 rounded-lg text-sm font-semibold ${tab === "players" ? "bg-primary text-white" : "text-slate-500"}">Players</button>
        <button data-tab="matches" class="flex-1 py-2 rounded-lg text-sm font-semibold ${tab === "matches" ? "bg-primary text-white" : "text-slate-500"}">Matches</button>
      </div>
      <div id="tab-body"></div>`;
    view.querySelectorAll("[data-tab]").forEach((b) =>
      b.addEventListener("click", () => go("group", { tab: b.dataset.tab }))
    );

    if (tab === "players") await renderPlayersTab($("tab-body"), group);
    else await renderMatchesTab($("tab-body"), group);
  }

  async function renderPlayersTab(body, group) {
    const players = await store.listPlayers(group.id);
    body.innerHTML = `
      <button id="add-player" class="w-full bg-primary text-white rounded-xl py-3 font-semibold mb-3">+ Add player</button>
      <div class="flex flex-col gap-2">
        ${
          players.length
            ? players
                .map(
                  (p) => `
          <div class="bg-white rounded-xl shadow-sm p-3" data-player="${p.id}">
            <div class="flex items-center gap-2">
              <span class="font-semibold flex-1">${esc(p.name)}</span>
              ${posTag(p)}
              <button class="text-slate-400 px-2" data-edit="${p.id}">✎</button>
            </div>
            <div class="grid grid-cols-4 gap-1 mt-2 text-center text-xs">
              ${statPill("POS", p.positioning)}${statPill("ATT", p.attack)}${statPill("DEF", p.defense)}${statPill("STA", p.stamina)}
            </div>
          </div>`
                )
                .join("")
            : `<p class="text-center text-slate-400 py-8">No players yet.</p>`
        }
      </div>`;
    $("add-player").onclick = () => playerModal(group.id);
    body.querySelectorAll("[data-edit]").forEach((el) =>
      el.addEventListener("click", async () => {
        const p = (await store.listPlayers(group.id)).find((x) => x.id === el.dataset.edit);
        playerModal(group.id, p);
      })
    );
  }
  const statPill = (label, v) =>
    `<div class="bg-slate-100 rounded py-1"><div class="text-[9px] text-slate-400">${label}</div><div class="font-bold">${v}</div></div>`;

  function playerModal(gid, p) {
    const editing = !!p;
    const slider = (id, label, val, hint) => `
      <div class="mb-4">
        <div class="flex justify-between text-sm font-medium mb-1">
          <span>${label} ${hint ? `<span class="text-slate-400 font-normal">${hint}</span>` : ""}</span>
          <span id="${id}-val" class="font-bold text-primary">${val}</span>
        </div>
        <input id="${id}" type="range" min="0" max="100" value="${val}" class="w-full" />
      </div>`;
    modal(`
      <div class="p-5">
        <h2 class="text-lg font-bold mb-4">${editing ? "Edit" : "Add"} player</h2>
        <input id="p-name" class="border rounded-lg w-full px-3 py-3 mb-4 text-base" value="${esc(p?.name || "")}" placeholder="Player name" />
        ${slider("p-pos", "Positioning", p?.positioning ?? 50, "0 = defensive · 100 = offensive")}
        ${slider("p-att", "Attack", p?.attack ?? 50)}
        ${slider("p-def", "Defense", p?.defense ?? 50)}
        ${slider("p-sta", "Stamina", p?.stamina ?? 50)}
        <div class="flex gap-2 mt-2">
          ${editing ? `<button id="p-del" class="text-red-600 px-3 py-2">Delete</button>` : ""}
          <div class="flex-1"></div>
          <button onclick="TD.app._closeModal()" class="px-4 py-2">Cancel</button>
          <button id="p-save" class="bg-primary text-white rounded-lg px-4 py-2 font-semibold">Save</button>
        </div>
      </div>`);
    ["p-pos", "p-att", "p-def", "p-sta"].forEach((id) => {
      const el = $(id);
      el.addEventListener("input", () => ($(id + "-val").textContent = el.value));
    });
    $("p-save").onclick = async () => {
      const data = {
        name: $("p-name").value.trim(),
        positioning: +$("p-pos").value,
        attack: +$("p-att").value,
        defense: +$("p-def").value,
        stamina: +$("p-sta").value,
      };
      if (!data.name) return toast("Name required");
      if (editing) await store.updatePlayer(gid, p.id, data);
      else await store.createPlayer(gid, data);
      closeModal();
      render();
    };
    if (editing)
      $("p-del").onclick = async () => {
        if (!confirm("Delete this player?")) return;
        await store.deletePlayer(gid, p.id);
        closeModal();
        render();
      };
  }

  async function renderMatchesTab(body, group) {
    const matches = await store.listMatches(group.id);
    body.innerHTML = `
      <div class="flex gap-2 mb-3">
        <button id="add-match" class="flex-1 bg-primary text-white rounded-xl py-3 font-semibold">+ New match</button>
        <button id="export-csv" class="bg-white border rounded-xl py-3 px-4 font-semibold text-primary">⬇ Export</button>
      </div>
      <div class="flex flex-col gap-2">
        ${
          matches.length
            ? matches
                .map((m) => {
                  const games = readGames(m);
                  const played = games
                    ? games.length === 1
                      ? `${games[0].ga}–${games[0].gb}`
                      : `${games.length} games`
                    : "";
                  return `
          <div class="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 cursor-pointer" data-match="${m.id}">
            <div class="flex-1">
              <div class="font-semibold">${fmtDate(m.datetime)}</div>
              <div class="text-xs text-slate-500">${(m.playerIds || []).length} players${m.chosenDraftId ? " · draft chosen" : ""}</div>
            </div>
            ${played ? `<span class="font-bold text-primary">${played}</span>` : ""}
            <span class="text-slate-300">›</span>
          </div>`;
                })
                .join("")
            : `<p class="text-center text-slate-400 py-8">No matches yet.</p>`
        }
      </div>`;
    $("add-match").onclick = () => matchModal(group.id);
    $("export-csv").onclick = () => exportMenu(group);
    body.querySelectorAll("[data-match]").forEach((el) =>
      el.addEventListener("click", () => go("match", { matchId: el.dataset.match }))
    );
  }

  async function matchModal(gid, m) {
    const editing = !!m;
    const players = await store.listPlayers(gid);
    const selected = new Set(m?.playerIds || []);
    // "Same as last match": most recent match's roster (only when creating new).
    const lastMatch = editing ? null : (await store.listMatches(gid))[0];
    modal(`
      <div class="p-5">
        <h2 class="text-lg font-bold mb-4">${editing ? "Edit" : "New"} match</h2>
        <label class="block text-sm font-medium mb-1">Date & time</label>
        <input id="m-dt" type="datetime-local" class="border rounded-lg w-full px-3 py-2 mb-4" value="${toLocalInput(m?.datetime)}" />
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-medium">Players playing</span>
          <span id="m-count" class="text-sm text-primary font-bold">${selected.size}</span>
        </div>
        ${
          lastMatch && (lastMatch.playerIds || []).length
            ? `<button id="m-samelast" class="w-full text-sm border rounded-lg py-2 mb-2 text-primary">⟳ Same players as last match (${lastMatch.playerIds.length})</button>`
            : ""
        }
        <div class="flex flex-col gap-1 max-h-64 overflow-y-auto border rounded-lg p-1">
          ${
            players.length
              ? players
                  .map(
                    (p) => `
            <label class="flex items-center gap-2 p-2 rounded-lg active:bg-slate-100">
              <input type="checkbox" class="m-pick w-5 h-5" value="${p.id}" ${selected.has(p.id) ? "checked" : ""} />
              <span class="flex-1">${esc(p.name)}</span>${posTag(p)}
            </label>`
                  )
                  .join("")
              : `<p class="text-slate-400 text-sm p-3">Add players to this group first.</p>`
          }
        </div>
        <div class="flex gap-2 mt-4">
          ${editing ? `<button id="m-del" class="text-red-600 px-3 py-2">Delete</button>` : ""}
          <div class="flex-1"></div>
          <button onclick="TD.app._closeModal()" class="px-4 py-2">Cancel</button>
          <button id="m-save" class="bg-primary text-white rounded-lg px-4 py-2 font-semibold">Save</button>
        </div>
      </div>`);
    const picks = () => Array.from(document.querySelectorAll(".m-pick"));
    const updateCount = () => ($("m-count").textContent = picks().filter((x) => x.checked).length);
    picks().forEach((c) => c.addEventListener("change", updateCount));
    if ($("m-samelast"))
      $("m-samelast").onclick = () => {
        const ids = new Set(lastMatch.playerIds);
        picks().forEach((c) => (c.checked = ids.has(c.value)));
        updateCount();
      };
    $("m-save").onclick = async () => {
      const playerIds = picks().filter((c) => c.checked).map((c) => c.value);
      const datetime = new Date($("m-dt").value).getTime();
      if (!datetime) return toast("Pick a date");
      if (playerIds.length < 2) return toast("Select at least 2 players");
      if (editing) await store.updateMatch(gid, m.id, { datetime, playerIds });
      else await store.createMatch(gid, { datetime, playerIds });
      closeModal();
      render();
    };
    if (editing)
      $("m-del").onclick = async () => {
        if (!confirm("Delete this match?")) return;
        await store.deleteMatch(gid, m.id);
        closeModal();
        go("group", { matchId: null, tab: "matches" });
      };
  }

  /* -------------------------------- MATCH -------------------------------- */
  async function renderMatch(view) {
    const gid = state.groupId;
    const match = await store.getMatch(gid, state.matchId);
    if (!match) return go("group", { tab: "matches" });
    $("title").textContent = "Match";

    const allPlayers = await store.listPlayers(gid);
    const byId = Object.fromEntries(allPlayers.map((p) => [p.id, p]));
    const matchPlayers = (match.playerIds || []).map((id) => byId[id]).filter(Boolean);
    const drafts = await store.listDrafts(gid, match.id);

    view.innerHTML = `
      <div class="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-semibold">${fmtDate(match.datetime)}</div>
            <div class="text-xs text-slate-500">${matchPlayers.length} players</div>
          </div>
          <button id="edit-match" class="text-sm text-primary">Edit</button>
        </div>
      </div>

      ${resultCard(match, drafts)}

      <button id="gen-draft" class="w-full bg-primary text-white rounded-xl py-3 font-semibold mb-4">⚡ Generate draft</button>

      <div id="drafts" class="flex flex-col gap-4">
        ${drafts.length ? drafts.map((d) => draftCard(d, byId, match)).join("") : `<p class="text-center text-slate-400 py-6">No drafts yet. Generate one.</p>`}
      </div>`;

    $("edit-match").onclick = () => matchModal(gid, match);
    $("gen-draft").onclick = () => draftModal(gid, match, matchPlayers);

    // choose / delete / lineup toggles
    view.querySelectorAll("[data-choose]").forEach((b) =>
      b.addEventListener("click", async () => {
        // switching the chosen draft changes the teams, so clear any result
        await store.updateMatch(gid, match.id, { chosenDraftId: b.dataset.choose, games: null, result: null });
        render();
      })
    );
    view.querySelectorAll("[data-deldraft]").forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("Delete this draft?")) return;
        const patch = match.chosenDraftId === b.dataset.deldraft ? { chosenDraftId: null, games: null, result: null } : {};
        await store.deleteDraft(gid, match.id, b.dataset.deldraft);
        if (Object.keys(patch).length) await store.updateMatch(gid, match.id, patch);
        render();
      })
    );
    view.querySelectorAll("[data-lineup]").forEach((b) =>
      b.addEventListener("click", () => {
        const el = view.querySelector(`#lineup-${b.dataset.lineup}`);
        el.classList.toggle("hidden");
      })
    );
    view.querySelectorAll("[data-editdraft]").forEach((b) =>
      b.addEventListener("click", () => {
        const d = drafts.find((x) => x.id === b.dataset.editdraft);
        editDraftModal(gid, match, d, byId, matchPlayers);
      })
    );
    const rf = $("result-form");
    if (rf)
      rf.addEventListener("submit", async (e) => {
        e.preventDefault();
        const chosen = drafts.find((d) => d.id === match.chosenDraftId);
        const k = draftTeamCount(chosen);
        const games = pairings(k).map(([i, j]) => ({
          a: i,
          b: j,
          ga: +rf.querySelector(`[data-goal="${i}-${j}-a"]`).value || 0,
          gb: +rf.querySelector(`[data-goal="${i}-${j}-b"]`).value || 0,
        }));
        // keep legacy result populated for 2-team matches (compat)
        const patch = { games };
        if (k === 2) patch.result = { teamAGoals: games[0].ga, teamBGoals: games[0].gb };
        await store.updateMatch(gid, match.id, patch);
        toast("Result saved");
        render();
      });
  }

  function resultCard(match, drafts) {
    if (!match.chosenDraftId) return "";
    const chosen = drafts.find((d) => d.id === match.chosenDraftId);
    if (!chosen) return "";
    const k = draftTeamCount(chosen);
    const games = readGames(match) || [];
    const goalsFor = (i, j) => {
      const g = games.find((x) => x.a === i && x.b === j);
      return g ? { ga: g.ga, gb: g.gb } : { ga: 0, gb: 0 };
    };
    const rows = pairings(k)
      .map(([i, j]) => {
        const { ga, gb } = goalsFor(i, j);
        return `
        <div class="flex items-center justify-center gap-2" data-game="${i}-${j}">
          <span class="text-sm font-semibold w-14 text-right">Team ${teamLetter(i)}</span>
          <input data-goal="${i}-${j}-a" type="number" min="0" value="${ga}" class="border rounded-lg w-14 py-2 text-center text-lg font-bold" />
          <span class="text-slate-400 font-bold">–</span>
          <input data-goal="${i}-${j}-b" type="number" min="0" value="${gb}" class="border rounded-lg w-14 py-2 text-center text-lg font-bold" />
          <span class="text-sm font-semibold w-14">Team ${teamLetter(j)}</span>
        </div>`;
      })
      .join("");
    return `
      <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
        <div class="text-sm font-semibold text-emerald-800 mb-3">Chosen draft — ${k === 2 ? "final score" : "match scores"}</div>
        <form id="result-form" class="flex flex-col gap-3">
          ${rows}
          <div class="flex justify-center mt-1">
            <button class="bg-emerald-600 text-white rounded-lg px-5 py-2 font-semibold">Save</button>
          </div>
        </form>
      </div>`;
  }

  function draftCard(d, byId, match) {
    const chosen = match.chosenDraftId === d.id;
    const teams = draftTeamIds(d).map((ids) => ids.map((id) => byId[id]).filter(Boolean));
    const k = teams.length;
    const sizes = teams.map((t) => t.length);
    const uneven = Math.max(...sizes) !== Math.min(...sizes);
    const algoLabel =
      d.algorithm === "brute" ? "Brute force" : d.algorithm === "manual" ? "Manual" : "Genetic";

    const teamCol = (team, i) => `
      <div class="flex-1 min-w-0">
        <div class="font-bold text-sm mb-1">Team ${teamLetter(i)} <span class="text-slate-400 font-normal">(${team.length})</span></div>
        ${team
          .map((p) => `<div class="flex items-center gap-1 text-sm py-0.5">${posTag(p)}<span class="truncate">${esc(p.name)}</span></div>`)
          .join("")}
      </div>`;
    const avgRow = (team) => {
      const a = TD.algo.teamAverages(team);
      const r = (x) => Math.round(x);
      return `avg POS ${r(a.positioning)} · ATT ${r(a.attack)} · DEF ${r(a.defense)} · STA ${r(a.stamina)}`;
    };
    const cols = teams
      .map((t, i) => teamCol(t, i))
      .join(`<div class="w-px bg-slate-200"></div>`);
    const avgGrid = teams.map((t) => `<div>${avgRow(t)}</div>`).join("");
    const pitches = teams
      .map((t, i) => `<div><div class="text-xs font-bold text-center mb-1">Team ${teamLetter(i)}</div>${pitch(t)}</div>`)
      .join("");

    return `
      <div class="bg-white rounded-xl shadow-sm p-4 ${chosen ? "ring-2 ring-emerald-500" : ""}">
        <div class="flex items-center gap-2 mb-3 flex-wrap">
          <span class="text-xs bg-slate-100 rounded px-2 py-1">${algoLabel}</span>
          <span class="text-xs bg-slate-100 rounded px-2 py-1">${k} teams</span>
          ${d.balanceMode === "squared" ? `<span class="text-xs bg-sky-100 text-sky-700 rounded px-2 py-1" title="Balances each stat evenly">Even</span>` : ""}
          <span class="text-xs font-bold ${pct(d.balanceScore) >= 95 ? "text-emerald-600" : "text-amber-600"}">Balance ${pct(d.balanceScore)}%</span>
          ${chosen ? `<span class="text-xs bg-emerald-100 text-emerald-700 rounded px-2 py-1 font-semibold">CHOSEN</span>` : ""}
          <div class="flex-1"></div>
          <button data-deldraft="${d.id}" class="text-slate-400 text-sm">🗑</button>
        </div>
        <div class="flex gap-3">${cols}</div>
        <div class="grid gap-3 mt-2 text-[11px] text-slate-500" style="grid-template-columns:repeat(${k},minmax(0,1fr))">
          ${avgGrid}
        </div>
        ${uneven ? `<div class="text-[11px] text-sky-600 mt-1">Uneven teams — balanced by per-player average (larger teams rotate a substitute).</div>` : ""}
        <div class="flex gap-2 mt-3">
          <button data-lineup="${d.id}" class="text-sm border rounded-lg px-3 py-1.5 flex-1">⚽ Lineup</button>
          <button data-editdraft="${d.id}" class="text-sm border rounded-lg px-3 py-1.5 flex-1">✎ Edit teams</button>
          ${chosen ? "" : `<button data-choose="${d.id}" class="text-sm bg-emerald-600 text-white rounded-lg px-3 py-1.5 flex-1 font-semibold">Choose this</button>`}
        </div>
        <div id="lineup-${d.id}" class="hidden mt-3 grid gap-2" style="grid-template-columns:repeat(${k},minmax(0,1fr))">
          ${pitches}
        </div>
      </div>`;
  }

  // Pitch drawn with attack at top, defense at bottom, and a fixed goalkeeper
  // + goal at the bottom centre so the orientation is unmistakable.
  function pitch(team) {
    const [def, mid, att] = TD.lineup.formation(team);
    const row = (players, label) =>
      `<div class="flex justify-center items-center gap-1 flex-wrap min-h-[22px]">${players
        .map((p) => `<span class="pitch-chip">${esc(p.name.split(" ")[0])}</span>`)
        .join("")}</div>`;
    return `
      <div class="pitch relative p-2 pb-8 flex flex-col justify-between gap-2 h-52">
        <div class="absolute top-1 right-1 text-[8px] font-bold text-white/80 tracking-wide">ATTACK ▲</div>
        ${row(att)}${row(mid)}${row(def)}
        <div class="absolute bottom-6 left-1 text-[8px] font-bold text-white/80 tracking-wide">DEF ▼</div>
        <div class="goal"></div>
        <div class="gk-badge" title="Goalkeeper">🧤</div>
      </div>`;
  }

  // Manually reassign players between teams (A/B[/C]) or bench (Out) — works
  // even after a draft is chosen (late arrivals, swaps, no-shows).
  function editDraftModal(gid, match, draft, byId, matchPlayers) {
    const teamIds = draftTeamIds(draft);
    const k = teamIds.length;
    const options = []; // e.g. ["A","B","out"] or ["A","B","C","out"]
    for (let i = 0; i < k; i++) options.push(teamLetter(i));
    options.push("out");

    const teamOfPlayer = (pid) => {
      for (let i = 0; i < k; i++) if (teamIds[i].includes(pid)) return teamLetter(i);
      return "out";
    };
    const assign = {};
    matchPlayers.forEach((p) => (assign[p.id] = teamOfPlayer(p.id)));

    const activeCls = (v) =>
      v === "out"
        ? "bg-slate-400 text-white"
        : ["bg-primary text-white", "bg-indigo-600 text-white", "bg-rose-600 text-white"][options.indexOf(v)] ||
          "bg-primary text-white";
    const segBtn = (pid, v) =>
      `<button data-assign="${pid}" data-val="${v}" class="px-2.5 py-1.5 ${assign[pid] === v ? activeCls(v) : "bg-white text-slate-500"}">${v === "out" ? "Out" : v}</button>`;
    const rows = matchPlayers
      .map(
        (p) => `
      <div class="flex items-center gap-2 py-1.5 border-b last:border-0">
        <span class="flex-1 text-sm truncate min-w-0">${posTag(p)} ${esc(p.name)}</span>
        <div class="flex rounded-lg overflow-hidden border text-xs">${options.map((v) => segBtn(p.id, v)).join("")}</div>
      </div>`
      )
      .join("");

    modal(`
      <div class="p-5">
        <h2 class="text-lg font-bold mb-1">Edit teams</h2>
        <p class="text-xs text-slate-500 mb-3">Move players between teams or bench. <span id="ed-count"></span></p>
        <div class="max-h-[55vh] overflow-y-auto border rounded-lg px-2">${rows}</div>
        <div class="flex gap-2 mt-4">
          <div class="flex-1"></div>
          <button onclick="TD.app._closeModal()" class="px-4 py-2">Cancel</button>
          <button id="ed-save" class="bg-primary text-white rounded-lg px-4 py-2 font-semibold">Save teams</button>
        </div>
      </div>`);

    const host = $("modal-host");
    const refresh = () => {
      $("ed-count").textContent = options
        .filter((v) => v !== "out")
        .map((v) => `${v}: ${Object.values(assign).filter((x) => x === v).length}`)
        .join(" · ");
    };
    host.querySelectorAll("[data-assign]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const pid = btn.dataset.assign;
        assign[pid] = btn.dataset.val;
        host.querySelectorAll(`[data-assign="${pid}"]`).forEach((b2) => {
          const v = b2.dataset.val;
          b2.className = `px-2.5 py-1.5 ${assign[pid] === v ? activeCls(v) : "bg-white text-slate-500"}`;
        });
        refresh();
      })
    );
    refresh();

    $("ed-save").onclick = async () => {
      const newTeams = [];
      for (let i = 0; i < k; i++)
        newTeams.push(matchPlayers.filter((p) => assign[p.id] === teamLetter(i)).map((p) => p.id));
      if (newTeams.some((t) => !t.length)) return toast("Each team needs at least 1 player");
      const stats = (ids) => ids.map((id) => byId[id]).filter(Boolean);
      const score = TD.algo.scoreTeams(newTeams.map(stats), draft.weights || {}, draft.balanceMode);
      const patch = {
        teams: teamsToStore(newTeams), // index-keyed map (Firestore-safe)
        algorithm: "manual",
        balanceScore: Math.round(score * 10000) / 10000,
      };
      if (k === 2) {
        patch.teamAPlayerIds = newTeams[0];
        patch.teamBPlayerIds = newTeams[1];
      }
      await store.updateDraft(gid, match.id, draft.id, patch);
      closeModal();
      render();
    };
  }

  function draftModal(gid, match, matchPlayers) {
    const n = matchPlayers.length;
    const bruteOk = n <= cfg.BRUTE_FORCE_MAX_PLAYERS;
    const combos = TD.algo.bruteCombinations(n);
    const wInput = (id, label) => `
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm">${label}</label>
        <input id="${id}" type="number" min="${cfg.WEIGHT_MIN}" max="${cfg.WEIGHT_MAX}" step="1" value="${cfg.WEIGHT_DEFAULT}"
          class="border rounded-lg w-16 px-2 py-1.5 text-center" />
      </div>`;
    modal(`
      <div class="p-5">
        <h2 class="text-lg font-bold mb-1">Generate draft</h2>
        <p class="text-xs text-slate-500 mb-3"><span id="gd-sub">${n} players → two teams.</span> Weights ${cfg.WEIGHT_MIN}–${cfg.WEIGHT_MAX}.</p>

        <div class="text-sm font-medium mb-2">Number of teams</div>
        <div class="flex rounded-lg overflow-hidden border mb-4">
          <button type="button" data-teams="2" class="flex-1 py-2 text-sm font-semibold bg-primary text-white">2 teams</button>
          <button type="button" data-teams="3" class="flex-1 py-2 text-sm font-semibold bg-white text-slate-500">3 teams</button>
        </div>

        ${wInput("w-pos", "Positioning")}
        ${wInput("w-att", "Attack")}
        ${wInput("w-def", "Defense")}
        ${wInput("w-sta", "Stamina")}
        <div class="mt-4" id="algo-section">
          <div class="text-sm font-medium mb-2">Algorithm</div>
          <label id="algo-brute-lbl" class="flex items-center gap-2 p-2 border rounded-lg mb-2 ${bruteOk ? "" : "opacity-40"}">
            <input type="radio" name="algo" value="brute" ${bruteOk ? "checked" : "disabled"} />
            <span class="flex-1 text-sm">Brute force <span class="text-slate-400" id="brute-note">— optimal, ${bruteOk ? combos.toLocaleString() + " splits" : "too many players"}</span></span>
          </label>
          <label class="flex items-center gap-2 p-2 border rounded-lg">
            <input type="radio" name="algo" value="genetic" ${bruteOk ? "" : "checked"} />
            <span class="flex-1 text-sm">Genetic <span class="text-slate-400">— fast, approximate</span></span>
          </label>
          <p id="algo-note" class="text-xs text-slate-400 mt-1 hidden">3-team drafts use the genetic algorithm.</p>
        </div>
        <label class="flex items-center gap-2 p-2 border rounded-lg mt-3">
          <input type="checkbox" id="even-balance" class="w-5 h-5" checked />
          <span class="flex-1 text-sm">Balance each stat evenly <span class="text-slate-400">— penalise big gaps in any single stat</span></span>
        </label>
        <div class="flex gap-2 mt-5">
          <div class="flex-1"></div>
          <button onclick="TD.app._closeModal()" class="px-4 py-2">Cancel</button>
          <button id="run-draft" class="bg-primary text-white rounded-lg px-4 py-2 font-semibold">Generate</button>
        </div>
      </div>`);

    let numTeams = 2;
    const host = $("modal-host");
    host.querySelectorAll("[data-teams]").forEach((b) =>
      b.addEventListener("click", () => {
        numTeams = +b.dataset.teams;
        host.querySelectorAll("[data-teams]").forEach((x) => {
          const on = +x.dataset.teams === numTeams;
          x.className = `flex-1 py-2 text-sm font-semibold ${on ? "bg-primary text-white" : "bg-white text-slate-500"}`;
        });
        const perTeam = Math.floor(n / numTeams);
        $("gd-sub").textContent = `${n} players → ${numTeams} teams (~${perTeam} each).`;
        // 3 teams => genetic only
        const three = numTeams === 3;
        $("algo-brute-lbl").classList.toggle("opacity-40", three || !bruteOk);
        const bruteRadio = host.querySelector('input[name=algo][value=brute]');
        const genRadio = host.querySelector('input[name=algo][value=genetic]');
        bruteRadio.disabled = three || !bruteOk;
        if (three || !bruteOk) genRadio.checked = true;
        $("algo-note").classList.toggle("hidden", !three);
      })
    );

    $("run-draft").onclick = async () => {
      const weights = {
        positioning: +$("w-pos").value,
        attack: +$("w-att").value,
        defense: +$("w-def").value,
        stamina: +$("w-sta").value,
      };
      if (Object.values(weights).every((v) => !v)) return toast("Set at least one weight above 0");
      if (n < numTeams) return toast(`Need at least ${numTeams} players`);
      const algorithm = numTeams === 3 ? "genetic" : document.querySelector("input[name=algo]:checked").value;
      const mode = $("even-balance").checked ? "squared" : "linear";
      const btn = $("run-draft");
      btn.textContent = "Working…";
      btn.disabled = true;
      await new Promise((r) => setTimeout(r, 30)); // let the UI paint
      // Always shuffle first so tie-breaking (esp. brute force) varies each run.
      const players = TD.algo.shuffle(matchPlayers).map((p) => ({
        id: p.id, positioning: p.positioning, attack: p.attack, defense: p.defense, stamina: p.stamina,
      }));

      let teamsIds, score;
      if (numTeams === 2 && algorithm === "brute") {
        const res = TD.algo.brute(players, weights, mode);
        teamsIds = [res.teamA.map((p) => p.id), res.teamB.map((p) => p.id)];
        score = res.score;
      } else if (numTeams === 2) {
        const res = TD.algo.genetic(players, weights, mode);
        teamsIds = [res.teamA.map((p) => p.id), res.teamB.map((p) => p.id)];
        score = res.score;
      } else {
        const res = TD.algo.geneticMulti(players, weights, mode, numTeams);
        teamsIds = res.teams.map((t) => t.map((p) => p.id));
        score = res.score;
      }

      const payload = {
        teams: teamsToStore(teamsIds), // index-keyed map (Firestore-safe)
        numTeams,
        weights,
        algorithm,
        balanceMode: mode,
        balanceScore: Math.round(score * 10000) / 10000,
      };
      if (numTeams === 2) {
        payload.teamAPlayerIds = teamsIds[0]; // legacy compat
        payload.teamBPlayerIds = teamsIds[1];
      }
      await store.createDraft(gid, match.id, payload);
      closeModal();
      render();
    };
  }

  /* -------------------------------- EXPORT ------------------------------- */
  // Gather chosen matches (with their chosen draft) + player lookup for a group.
  async function collectChosen(group) {
    const players = await store.listPlayers(group.id);
    const byId = Object.fromEntries(players.map((p) => [p.id, p]));
    const matches = await store.listMatches(group.id);
    const enriched = [];
    for (const m of matches) {
      if (!m.chosenDraftId || !readGames(m)) continue;
      const drafts = await store.listDrafts(group.id, m.id);
      const draft = drafts.find((d) => d.id === m.chosenDraftId);
      if (draft) enriched.push({ ...m, draft, games: readGames(m) });
    }
    return { byId, enriched };
  }
  const safeName = (s) => (s || "group").replace(/[^\w-]+/g, "_");
  const today = () => new Date().toISOString().slice(0, 10);

  function exportMenu(group) {
    const item = (id, title, sub) =>
      `<button id="${id}" class="w-full text-left border rounded-lg p-3 mb-2">
         <div class="font-semibold text-sm">${title}</div>
         <div class="text-xs text-slate-500">${sub}</div>
       </button>`;
    modal(`
      <div class="p-5">
        <h2 class="text-lg font-bold mb-3">Export & backup</h2>
        <div class="text-xs font-semibold text-slate-400 mb-1">MATCH DATA (chosen matches with results)</div>
        ${item("ex-tidy", "Per-player CSV", "One row per player per match — human-friendly")}
        ${item("ex-match", "Per-match CSV (ML)", "One row per match with team totals, diffs, result")}
        ${item("ex-json", "Match JSON (ML)", "Full feature vectors + outcomes for training")}
        <div class="text-xs font-semibold text-slate-400 mb-1 mt-3">FULL DATASET</div>
        ${item("ex-backup", "Backup all data (JSON)", "Everything — groups, players, matches, drafts")}
        ${item("ex-import", "Import backup…", "Restore from a backup file (merges/overwrites by id)")}
        <input id="ex-file" type="file" accept="application/json,.json" class="hidden" />
        <div class="flex justify-end mt-2">
          <button onclick="TD.app._closeModal()" class="px-4 py-2">Close</button>
        </div>
      </div>`);

    const matchExport = async (kind) => {
      const { byId, enriched } = await collectChosen(group);
      if (!enriched.length) return toast("No chosen matches with a result yet");
      const base = `${safeName(group.name)}_${today()}`;
      if (kind === "tidy")
        TD.exporter.download(`${base}_players.csv`, TD.exporter.buildCsv(enriched, byId));
      else if (kind === "match")
        TD.exporter.download(`${base}_matches.csv`, TD.exporter.buildMatchCsv(enriched, byId));
      else
        TD.exporter.download(`${base}_matches.json`, TD.exporter.buildMatchJson(enriched, byId), "application/json");
      toast(`Exported ${enriched.length} match(es)`);
    };
    $("ex-tidy").onclick = () => matchExport("tidy");
    $("ex-match").onclick = () => matchExport("match");
    $("ex-json").onclick = () => matchExport("json");

    $("ex-backup").onclick = async () => {
      const tree = await store.exportAll();
      TD.exporter.download(`teamdraft_backup_${today()}.json`, JSON.stringify(tree, null, 2), "application/json");
      toast("Backup downloaded");
    };
    $("ex-import").onclick = () => $("ex-file").click();
    $("ex-file").onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!confirm("Import backup? This overwrites entries with the same id.")) return;
      try {
        const tree = JSON.parse(await file.text());
        await store.importAll(tree);
        closeModal();
        toast("Backup imported");
        go("groups", { groupId: null });
      } catch (err) {
        toast("Import failed: " + err.message);
      }
    };
  }

  /* --------------------------------- AUTH -------------------------------- */
  function showApp() {
    $("login").classList.add("hidden");
    $("app").classList.remove("hidden");
    go("groups", { groupId: null, matchId: null });
  }
  function showLogin() {
    $("app").classList.add("hidden");
    $("login").classList.remove("hidden");
  }
  const loginError = (msg) => {
    const el = $("login-error");
    if (msg) el.textContent = msg;
    el.classList.remove("hidden");
  };

  function initTheme() {
    const btn = $("theme-btn");
    const apply = () => (btn.textContent = document.documentElement.classList.contains("dark") ? "☀️" : "🌙");
    apply();
    btn.addEventListener("click", () => {
      const dark = document.documentElement.classList.toggle("dark");
      try {
        localStorage.setItem("td_theme", dark ? "dark" : "light");
      } catch (e) {}
      apply();
    });
  }

  function initAuth() {
    $("back-btn").addEventListener("click", back);
    initTheme();

    if (cfg.STORAGE_BACKEND === "firebase") initFirebaseAuth();
    else initLocalAuth();
  }

  // Firebase Email/Password: one shared account, sessions persist across reloads.
  function initFirebaseAuth() {
    TD.initFirebase(); // must run before firebase.auth()

    const userInput = $("login-user");
    userInput.placeholder = "Email";
    userInput.type = "email";

    firebase.auth().onAuthStateChanged((user) => (user ? showApp() : showLogin()));

    $("login-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      $("login-error").classList.add("hidden");
      try {
        await firebase
          .auth()
          .signInWithEmailAndPassword($("login-user").value.trim(), $("login-pass").value);
        // onAuthStateChanged shows the app
      } catch (err) {
        loginError("Login failed: " + (err.code || err.message));
      }
    });
    $("logout-btn").addEventListener("click", () => firebase.auth().signOut());
  }

  // Local (localStorage) mode: simple hardcoded gate, no cloud.
  function initLocalAuth() {
    if (sessionStorage.getItem("td_auth") === "1") showApp();
    $("login-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = $("login-user").value === cfg.ADMIN_USER && $("login-pass").value === cfg.ADMIN_PASS;
      if (ok) {
        sessionStorage.setItem("td_auth", "1");
        showApp();
      } else {
        loginError();
      }
    });
    $("logout-btn").addEventListener("click", () => {
      sessionStorage.removeItem("td_auth");
      showLogin();
    });
  }

  return {
    init() {
      initAuth();
    },
    _closeModal: closeModal,
  };
})();

document.addEventListener("DOMContentLoaded", () => TD.app.init());
