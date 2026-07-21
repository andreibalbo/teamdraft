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
        <button id="export-csv" class="bg-white border rounded-xl py-3 px-4 font-semibold text-primary">⬇ CSV</button>
      </div>
      <div class="flex flex-col gap-2">
        ${
          matches.length
            ? matches
                .map((m) => {
                  const played = m.result ? `${m.result.teamAGoals}–${m.result.teamBGoals}` : "";
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
    $("export-csv").onclick = () => exportGroup(group);
    body.querySelectorAll("[data-match]").forEach((el) =>
      el.addEventListener("click", () => go("match", { matchId: el.dataset.match }))
    );
  }

  async function matchModal(gid, m) {
    const editing = !!m;
    const players = await store.listPlayers(gid);
    const selected = new Set(m?.playerIds || []);
    modal(`
      <div class="p-5">
        <h2 class="text-lg font-bold mb-4">${editing ? "Edit" : "New"} match</h2>
        <label class="block text-sm font-medium mb-1">Date & time</label>
        <input id="m-dt" type="datetime-local" class="border rounded-lg w-full px-3 py-2 mb-4" value="${toLocalInput(m?.datetime)}" />
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-medium">Players playing</span>
          <span id="m-count" class="text-sm text-primary font-bold">${selected.size}</span>
        </div>
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
    picks().forEach((c) =>
      c.addEventListener("change", () => ($("m-count").textContent = picks().filter((x) => x.checked).length))
    );
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
        await store.updateMatch(gid, match.id, { chosenDraftId: b.dataset.choose });
        render();
      })
    );
    view.querySelectorAll("[data-deldraft]").forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("Delete this draft?")) return;
        const patch = match.chosenDraftId === b.dataset.deldraft ? { chosenDraftId: null, result: null } : {};
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
    const rf = $("result-form");
    if (rf)
      rf.addEventListener("submit", async (e) => {
        e.preventDefault();
        const teamAGoals = +$("goals-a").value;
        const teamBGoals = +$("goals-b").value;
        await store.updateMatch(gid, match.id, { result: { teamAGoals, teamBGoals } });
        toast("Result saved");
        render();
      });
  }

  function resultCard(match, drafts) {
    if (!match.chosenDraftId) return "";
    const chosen = drafts.find((d) => d.id === match.chosenDraftId);
    if (!chosen) return "";
    const r = match.result || { teamAGoals: 0, teamBGoals: 0 };
    return `
      <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
        <div class="text-sm font-semibold text-emerald-800 mb-2">Chosen draft — final score</div>
        <form id="result-form" class="flex items-center justify-center gap-3">
          <div class="text-center">
            <div class="text-xs text-slate-500 mb-1">Team A</div>
            <input id="goals-a" type="number" min="0" value="${r.teamAGoals ?? 0}" class="border rounded-lg w-16 py-2 text-center text-xl font-bold" />
          </div>
          <span class="text-2xl font-bold text-slate-400">–</span>
          <div class="text-center">
            <div class="text-xs text-slate-500 mb-1">Team B</div>
            <input id="goals-b" type="number" min="0" value="${r.teamBGoals ?? 0}" class="border rounded-lg w-16 py-2 text-center text-xl font-bold" />
          </div>
          <button class="bg-emerald-600 text-white rounded-lg px-4 py-2 font-semibold ml-2">Save</button>
        </form>
      </div>`;
  }

  function draftCard(d, byId, match) {
    const chosen = match.chosenDraftId === d.id;
    const teamA = d.teamAPlayerIds.map((id) => byId[id]).filter(Boolean);
    const teamB = d.teamBPlayerIds.map((id) => byId[id]).filter(Boolean);
    const sA = TD.algo.teamStats(teamA);
    const sB = TD.algo.teamStats(teamB);
    const algoLabel = d.algorithm === "brute" ? "Brute force" : "Genetic";

    const teamCol = (name, team) => `
      <div class="flex-1">
        <div class="font-bold text-sm mb-1">${name}</div>
        ${team
          .map((p) => `<div class="flex items-center gap-1 text-sm py-0.5">${posTag(p)}<span class="truncate">${esc(p.name)}</span></div>`)
          .join("")}
      </div>`;
    const statsRow = (s) =>
      `POS ${s.positioning} · ATT ${s.attack} · DEF ${s.defense} · STA ${s.stamina}`;

    return `
      <div class="bg-white rounded-xl shadow-sm p-4 ${chosen ? "ring-2 ring-emerald-500" : ""}">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-xs bg-slate-100 rounded px-2 py-1">${algoLabel}</span>
          <span class="text-xs font-bold ${pct(d.balanceScore) >= 95 ? "text-emerald-600" : "text-amber-600"}">Balance ${pct(d.balanceScore)}%</span>
          ${chosen ? `<span class="text-xs bg-emerald-100 text-emerald-700 rounded px-2 py-1 font-semibold">CHOSEN</span>` : ""}
          <div class="flex-1"></div>
          <button data-deldraft="${d.id}" class="text-slate-400 text-sm">🗑</button>
        </div>
        <div class="flex gap-3">
          ${teamCol("Team A", teamA)}
          <div class="w-px bg-slate-200"></div>
          ${teamCol("Team B", teamB)}
        </div>
        <div class="grid grid-cols-2 gap-3 mt-2 text-[11px] text-slate-500">
          <div>${statsRow(sA)}</div><div>${statsRow(sB)}</div>
        </div>
        <div class="flex gap-2 mt-3">
          <button data-lineup="${d.id}" class="text-sm border rounded-lg px-3 py-1.5 flex-1">⚽ Lineup</button>
          ${chosen ? "" : `<button data-choose="${d.id}" class="text-sm bg-emerald-600 text-white rounded-lg px-3 py-1.5 flex-1 font-semibold">Choose this</button>`}
        </div>
        <div id="lineup-${d.id}" class="hidden mt-3 grid grid-cols-2 gap-2">
          ${pitch(teamA)}${pitch(teamB)}
        </div>
      </div>`;
  }

  function pitch(team) {
    const [def, mid, att] = TD.lineup.formation(team);
    const row = (players) =>
      `<div class="flex justify-center gap-1 flex-wrap min-h-[24px]">${players
        .map((p) => `<span class="bg-white/90 text-[10px] font-semibold rounded px-1.5 py-0.5 shadow">${esc(p.name.split(" ")[0])}</span>`)
        .join("")}</div>`;
    return `
      <div class="pitch p-2 flex flex-col justify-between gap-3 h-40">
        ${row(att)}${row(mid)}${row(def)}
      </div>`;
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
        <p class="text-xs text-slate-500 mb-4">${n} players → two teams. Weights ${cfg.WEIGHT_MIN}–${cfg.WEIGHT_MAX}.</p>
        ${wInput("w-pos", "Positioning")}
        ${wInput("w-att", "Attack")}
        ${wInput("w-def", "Defense")}
        ${wInput("w-sta", "Stamina")}
        <div class="mt-4">
          <div class="text-sm font-medium mb-2">Algorithm</div>
          <label class="flex items-center gap-2 p-2 border rounded-lg mb-2 ${bruteOk ? "" : "opacity-40"}">
            <input type="radio" name="algo" value="brute" ${bruteOk ? "checked" : "disabled"} />
            <span class="flex-1 text-sm">Brute force <span class="text-slate-400">— optimal, ${bruteOk ? combos.toLocaleString() + " splits" : "too many players"}</span></span>
          </label>
          <label class="flex items-center gap-2 p-2 border rounded-lg">
            <input type="radio" name="algo" value="genetic" ${bruteOk ? "" : "checked"} />
            <span class="flex-1 text-sm">Genetic <span class="text-slate-400">— fast, approximate</span></span>
          </label>
        </div>
        <div class="flex gap-2 mt-5">
          <div class="flex-1"></div>
          <button onclick="TD.app._closeModal()" class="px-4 py-2">Cancel</button>
          <button id="run-draft" class="bg-primary text-white rounded-lg px-4 py-2 font-semibold">Generate</button>
        </div>
      </div>`);
    $("run-draft").onclick = async () => {
      const weights = {
        positioning: +$("w-pos").value,
        attack: +$("w-att").value,
        defense: +$("w-def").value,
        stamina: +$("w-sta").value,
      };
      if (Object.values(weights).every((v) => !v)) return toast("Set at least one weight above 0");
      const algorithm = document.querySelector("input[name=algo]:checked").value;
      const btn = $("run-draft");
      btn.textContent = "Working…";
      btn.disabled = true;
      // let the UI paint before a heavy sync computation
      await new Promise((r) => setTimeout(r, 30));
      const players = matchPlayers.map((p) => ({
        id: p.id, positioning: p.positioning, attack: p.attack, defense: p.defense, stamina: p.stamina,
      }));
      const res = algorithm === "brute" ? TD.algo.brute(players, weights) : TD.algo.genetic(players, weights);
      await store.createDraft(gid, match.id, {
        teamAPlayerIds: res.teamA.map((p) => p.id),
        teamBPlayerIds: res.teamB.map((p) => p.id),
        weights,
        algorithm,
        balanceScore: Math.round(res.score * 10000) / 10000,
      });
      closeModal();
      render();
    };
  }

  /* -------------------------------- EXPORT ------------------------------- */
  async function exportGroup(group) {
    const players = await store.listPlayers(group.id);
    const byId = Object.fromEntries(players.map((p) => [p.id, p]));
    const matches = await store.listMatches(group.id);
    const enriched = [];
    for (const m of matches) {
      if (!m.chosenDraftId || !m.result) continue;
      const drafts = await store.listDrafts(group.id, m.id);
      const draft = drafts.find((d) => d.id === m.chosenDraftId);
      if (draft) enriched.push({ ...m, draft });
    }
    if (!enriched.length) return toast("No chosen matches with a result yet");
    const csv = TD.exporter.buildCsv(enriched, byId);
    const safe = (group.name || "group").replace(/[^\w-]+/g, "_");
    TD.exporter.download(`${safe}_matches_${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast(`Exported ${enriched.length} match(es)`);
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

  function initAuth() {
    $("back-btn").addEventListener("click", back);

    if (cfg.STORAGE_BACKEND === "firebase") initFirebaseAuth();
    else initLocalAuth();
  }

  // Firebase Email/Password: one shared account, sessions persist across reloads.
  function initFirebaseAuth() {
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
