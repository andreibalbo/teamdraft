/* TeamDraft v2 — data layer
 * ---------------------------------------------------------------------------
 * One async CRUD API, two interchangeable backends (localStorage / Firestore),
 * selected by TD.config.STORAGE_BACKEND.
 *
 * Data shape (same in both backends):
 *   groups/{id}
 *     { name, category, description, createdAt }
 *     players/{id}  { name, positioning, defense, attack, stamina }
 *     matches/{id}  { datetime, playerIds[], chosenDraftId, result, createdAt }
 *       drafts/{id} { teamAPlayerIds[], teamBPlayerIds[], weights, algorithm,
 *                     balanceScore, createdAt }
 */
window.TD = window.TD || {};

TD.store = (function () {
  const uid = () =>
    (crypto.randomUUID && crypto.randomUUID()) ||
    Date.now().toString(36) + Math.random().toString(36).slice(2);

  /* ----------------------------- localStorage ---------------------------- */
  const Local = (function () {
    const KEY = "teamdraft_v2";

    function readAll() {
      try {
        return JSON.parse(localStorage.getItem(KEY)) || { groups: {} };
      } catch (e) {
        return { groups: {} };
      }
    }
    function writeAll(db) {
      localStorage.setItem(KEY, JSON.stringify(db));
    }
    const sortByCreated = (arr) =>
      arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    return {
      async listGroups() {
        const db = readAll();
        return sortByCreated(
          Object.entries(db.groups).map(([id, g]) => ({ id, ...strip(g) }))
        );
      },
      async createGroup(data) {
        const db = readAll();
        const id = uid();
        db.groups[id] = { ...data, createdAt: Date.now(), players: {}, matches: {} };
        writeAll(db);
        return id;
      },
      async updateGroup(id, data) {
        const db = readAll();
        Object.assign(db.groups[id], data);
        writeAll(db);
      },
      async deleteGroup(id) {
        const db = readAll();
        delete db.groups[id];
        writeAll(db);
      },

      async listPlayers(gid) {
        const db = readAll();
        const players = (db.groups[gid] || {}).players || {};
        return Object.entries(players)
          .map(([id, p]) => ({ id, ...p }))
          .sort((a, b) => a.name.localeCompare(b.name));
      },
      async createPlayer(gid, data) {
        const db = readAll();
        const id = uid();
        db.groups[gid].players[id] = { ...data };
        writeAll(db);
        return id;
      },
      async updatePlayer(gid, id, data) {
        const db = readAll();
        Object.assign(db.groups[gid].players[id], data);
        writeAll(db);
      },
      async deletePlayer(gid, id) {
        const db = readAll();
        delete db.groups[gid].players[id];
        writeAll(db);
      },

      async listMatches(gid) {
        const db = readAll();
        const matches = (db.groups[gid] || {}).matches || {};
        return Object.entries(matches)
          .map(([id, m]) => ({ id, ...strip(m) }))
          .sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
      },
      async getMatch(gid, id) {
        const db = readAll();
        const m = ((db.groups[gid] || {}).matches || {})[id];
        return m ? { id, ...strip(m) } : null;
      },
      async createMatch(gid, data) {
        const db = readAll();
        const id = uid();
        db.groups[gid].matches[id] = {
          ...data,
          chosenDraftId: null,
          result: null,
          createdAt: Date.now(),
          drafts: {},
        };
        writeAll(db);
        return id;
      },
      async updateMatch(gid, id, data) {
        const db = readAll();
        Object.assign(db.groups[gid].matches[id], data);
        writeAll(db);
      },
      async deleteMatch(gid, id) {
        const db = readAll();
        delete db.groups[gid].matches[id];
        writeAll(db);
      },

      async listDrafts(gid, mid) {
        const db = readAll();
        const drafts = (((db.groups[gid] || {}).matches || {})[mid] || {}).drafts || {};
        return sortByCreated(Object.entries(drafts).map(([id, d]) => ({ id, ...d })));
      },
      async createDraft(gid, mid, data) {
        const db = readAll();
        const id = uid();
        db.groups[gid].matches[mid].drafts[id] = { ...data, createdAt: Date.now() };
        writeAll(db);
        return id;
      },
      async updateDraft(gid, mid, id, data) {
        const db = readAll();
        Object.assign(db.groups[gid].matches[mid].drafts[id], data);
        writeAll(db);
      },
      async deleteDraft(gid, mid, id) {
        const db = readAll();
        delete db.groups[gid].matches[mid].drafts[id];
        writeAll(db);
      },

      async exportAll() {
        return readAll();
      },
      async importAll(tree) {
        if (!tree || typeof tree !== "object" || !tree.groups) throw new Error("Invalid backup file.");
        writeAll(tree);
      },
    };

    // drop nested subcollections when returning a doc
    function strip(obj) {
      const { players, matches, drafts, ...rest } = obj;
      return rest;
    }
  })();

  /* ------------------------------- Firestore ----------------------------- */
  const Firebase = (function () {
    let db = null;
    let authPromise = null;

    function ensure() {
      if (db) return db;
      TD.initFirebase();
      db = firebase.firestore();
      return db;
    }

    // Every operation waits until a user is signed in (via the login screen),
    // so requests carry an auth token required by the security rules.
    async function ready() {
      ensure();
      if (!authPromise) {
        authPromise = new Promise((resolve, reject) => {
          firebase.auth().onAuthStateChanged((user) => {
            if (user) resolve(user); // stays pending until logged in
          }, reject);
        });
      }
      await authPromise;
      return db;
    }

    const col = (path) => db.collection(path);
    const snap = (s) => s.docs.map((d) => ({ id: d.id, ...d.data() }));

    const gPath = (gid) => `groups/${gid}`;
    const pCol = (gid) => `${gPath(gid)}/players`;
    const mCol = (gid) => `${gPath(gid)}/matches`;
    const dCol = (gid, mid) => `${mCol(gid)}/${mid}/drafts`;

    return {
      async listGroups() {
        await ready();
        return snap(await col("groups").orderBy("createdAt").get());
      },
      async createGroup(data) {
        await ready();
        const ref = await col("groups").add({ ...data, createdAt: Date.now() });
        return ref.id;
      },
      async updateGroup(id, data) {
        await ready();
        await col("groups").doc(id).update(data);
      },
      async deleteGroup(id) {
        await ready();
        await col("groups").doc(id).delete();
      },

      async listPlayers(gid) {
        await ready();
        return snap(await col(pCol(gid)).orderBy("name").get());
      },
      async createPlayer(gid, data) {
        await ready();
        return (await col(pCol(gid)).add(data)).id;
      },
      async updatePlayer(gid, id, data) {
        await ready();
        await col(pCol(gid)).doc(id).update(data);
      },
      async deletePlayer(gid, id) {
        await ready();
        await col(pCol(gid)).doc(id).delete();
      },

      async listMatches(gid) {
        await ready();
        return snap(await col(mCol(gid)).orderBy("datetime", "desc").get());
      },
      async getMatch(gid, id) {
        await ready();
        const d = await col(mCol(gid)).doc(id).get();
        return d.exists ? { id: d.id, ...d.data() } : null;
      },
      async createMatch(gid, data) {
        await ready();
        const ref = await col(mCol(gid)).add({
          ...data,
          chosenDraftId: null,
          result: null,
          createdAt: Date.now(),
        });
        return ref.id;
      },
      async updateMatch(gid, id, data) {
        await ready();
        await col(mCol(gid)).doc(id).update(data);
      },
      async deleteMatch(gid, id) {
        await ready();
        await col(mCol(gid)).doc(id).delete();
      },

      async listDrafts(gid, mid) {
        await ready();
        return snap(await col(dCol(gid, mid)).orderBy("createdAt").get());
      },
      async createDraft(gid, mid, data) {
        await ready();
        return (await col(dCol(gid, mid)).add({ ...data, createdAt: Date.now() })).id;
      },
      async updateDraft(gid, mid, id, data) {
        await ready();
        await col(dCol(gid, mid)).doc(id).update(data);
      },
      async deleteDraft(gid, mid, id) {
        await ready();
        await col(dCol(gid, mid)).doc(id).delete();
      },

      // Portable backup: same nested shape as the localStorage backend, so a
      // backup taken here can be restored into local mode and vice versa.
      async exportAll() {
        await ready();
        const tree = { groups: {} };
        const gs = await col("groups").orderBy("createdAt").get();
        for (const g of gs.docs) {
          const gd = { ...g.data(), players: {}, matches: {} };
          (await col(pCol(g.id)).get()).forEach((p) => (gd.players[p.id] = p.data()));
          const ms = await col(mCol(g.id)).get();
          for (const m of ms.docs) {
            const md = { ...m.data(), drafts: {} };
            (await col(dCol(g.id, m.id)).get()).forEach((d) => (md.drafts[d.id] = d.data()));
            gd.matches[m.id] = md;
          }
          tree.groups[g.id] = gd;
        }
        return tree;
      },
      async importAll(tree) {
        if (!tree || typeof tree !== "object" || !tree.groups) throw new Error("Invalid backup file.");
        await ready();
        for (const [gid, g] of Object.entries(tree.groups)) {
          const { players = {}, matches = {}, ...gdata } = g;
          await col("groups").doc(gid).set(gdata);
          for (const [pid, p] of Object.entries(players)) await col(pCol(gid)).doc(pid).set(p);
          for (const [mid, m] of Object.entries(matches)) {
            const { drafts = {}, ...mdata } = m;
            await col(mCol(gid)).doc(mid).set(mdata);
            for (const [did, d] of Object.entries(drafts)) await col(dCol(gid, mid)).doc(did).set(d);
          }
        }
      },
    };
  })();

  return TD.config.STORAGE_BACKEND === "firebase" ? Firebase : Local;
})();
