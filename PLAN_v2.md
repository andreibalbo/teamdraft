# TeamDraft v2 — Build Plan

A rebuild of TeamDraft as a **static HTML/JS app on GitHub Pages** backed by **Firebase Firestore**, with the team-balancing **genetic algorithm ported to run in the browser**. No Rails, no Python container, no server to maintain.

---

## 1. Goals & scope

Keep the same mental model as the current app, just simpler to host:

- **Login** — hardcoded `admin` / `123456` for now (upgrade path: Firebase Auth).
- **Groups** — e.g. "Monday Football". A group owns players and matches.
- **Players** — belong to a group. Fields: `name`, `positioning` (0 = pure defensive, 100 = pure offensive), `defense`, `attack`, `stamina` — all ints 0–100.
- **Matches** — belong to a group, and select a subset of that group's players (e.g. 16 of 30 play today).
- **Draft** — for a match, pick a **weight (0–5, default 1)** per stat (positioning, attack, defense, stamina), **choose the algorithm (Brute force or Genetic)**, then split the selected players into two balanced teams and store the result with its balance score. Multiple drafts can be generated per match.
- **Chosen draft + result** — mark one draft of a match as **chosen**, then record the actual result as **goals** (team A vs team B).
- **CSV export** — export all chosen matches of a group (score + player names) to a CSV file.
- **Lineup view** — arrange each drafted team into defense / midfield / attack rows by positioning (the "soccer court" from v1).

---

## 2. Architecture

```
Browser (GitHub Pages, static)
 ├─ index.html            login + app shell
 ├─ css/ (Tailwind via CDN or prebuilt)
 ├─ js/
 │   ├─ firebase.js       init + Firestore handle
 │   ├─ auth.js           hardcoded login, session flag
 │   ├─ store.js          all Firestore reads/writes (data layer)
 │   ├─ ga.js             genetic algorithm (port of Python engine)
 │   ├─ lineup.js         defense/mid/attack formation logic
 │   ├─ ui/               render functions per screen
 │   └─ app.js            router + wiring
 └─ (Firestore SDK loaded from gstatic CDN)
        │
        ▼
Firebase Firestore (free Spark tier)
```

No build step is required if we use the Firebase CDN modules and Tailwind's Play CDN. Optional later: a small Vite build for bundling.

---

## 3. Data model (Firestore)

Firestore is document-based. Proposed collection layout (subcollections keep everything scoped to a group):

```
groups (collection)
  {groupId}
    name: string
    category: "society" | "soccer" | "indoor"
    description: string
    createdAt: timestamp

    players (subcollection)
      {playerId}
        name: string
        positioning: number   // 0-100
        defense: number       // 0-100
        attack: number        // 0-100
        stamina: number       // 0-100

    matches (subcollection)
      {matchId}
        datetime: timestamp
        playerIds: string[]        // players selected for this match
        chosenDraftId: string|null // which draft was actually played
        result: {                  // filled in after the match is played
          teamAGoals: number,
          teamBGoals: number
        } | null
        createdAt: timestamp

        drafts (subcollection)
          {draftId}
            teamAPlayerIds: string[]
            teamBPlayerIds: string[]
            weights: { positioning, attack, defense, stamina }  // 0-5 each
            algorithm: "brute" | "genetic"    // which algo produced it
            balanceScore: number
            createdAt: timestamp
```

This mirrors your Rails schema (`groups → players / matches → drafts`) one-to-one. Player stats are snapshotted by reference (draft stores IDs), same as v1.

**Positioning ranges** (kept from v1, used for the lineup view):
- defensive: 0–35
- midfield: 36–65
- attacking: 66–100

---

## 4. Genetic algorithm in JS (port of `teamdraft_engine`)

A faithful port of your Python `deap`-based GA — no external library needed, it's ~120 lines of plain JS.

**Representation.** One binary chromosome of length N (N = players in the match). Gene `i` = 1 → player i on team A, 0 → team B. (Identical to the Python encoding.)

**Fitness** (identical formula to `TeamBalanceScoreCalculator`):
```
for each stat s in {positioning, attack, defense, stamina}:
    diff_s = |sumA_s − sumB_s| / max(sumA_s, sumB_s, 1)
score = 1 − ( Σ (diff_s × weight_s) / Σ weight_s )     // higher = more balanced
```
Team-size imbalance > 1 → fitness 0 (hard penalty, same as v1).

**GA loop** (mirrors `eaSimple`):
- population size 200, generations 100 (tunable)
- tournament selection (size 3)
- two-point crossover, cxpb 0.7
- bit-flip mutation, indpb 0.05, mutpb 0.2
- return best individual → team A / team B / score

**Determinism note.** Because it's a GA, results can vary run-to-run. I'll run a few restarts and keep the best, so results feel stable.

Runs entirely on the client in well under a second for typical match sizes.

### 4b. Brute-force algorithm (new)

At draft time you choose **Brute force** or **Genetic**. Brute force enumerates every valid even split and returns the one with the highest balance score — **guaranteed optimal**, fully deterministic. Uses the *same* fitness formula as the GA, so scores are directly comparable.

- For N selected players, it evaluates the `C(N, floor(N/2))` even splits (fixing player 0 to team A to avoid mirror duplicates). N=16 → ~6,435 splits; N=20 → ~92,378; both run in well under a second.
- Safety cap: if N is large enough that the count would be too big (e.g. N > 24), the UI disables brute force and suggests GA, so the browser never hangs.
- The chosen `algorithm` is stored on each draft, so results show which method produced them.

---

## 5. Auth

- `index.html` shows a login form. On submit, compare against hardcoded `admin` / `123456`, set an in-memory + `sessionStorage` "logged in" flag, reveal the app.
- **Caveat:** on a static site the credentials live in the JS source, so this is obscurity, not real security. Fine for a private hobby app.
- **Upgrade path:** swap to Firebase Auth (email/password or Google) with almost no change to the rest of the app; Firestore security rules then lock data to authed users.

---

## 6. Firestore security (important even for a hobby app)

Default test-mode rules leave the DB world-writable. Plan:
- Start in test mode to build fast.
- Before "launch", tighten rules. Since real auth isn't in place yet, options are (a) add Firebase Anonymous/Auth and gate all writes behind `request.auth != null`, or (b) accept the risk for a private, unlinked project.
- I'll document the exact rules to paste in the Firebase console.

---

## 7. Screens / UX flow

1. **Login** → app shell.
2. **Groups list** — create / rename / delete; click a group to open it.
3. **Group detail** — two tabs: **Players** and **Matches**.
   - Players tab: table with name + 4 stats, add/edit/delete. Stat inputs as 0–100 sliders or number fields; positioning shown with a DEF↔ATT hint.
   - Matches tab: list matches, create a match (pick datetime + check the players playing today).
4. **Match detail** — shows selected players; **"Generate Draft"** button opens the **weights modal** (4 stats, 0–5, default 1) with an **algorithm toggle (Brute force / Genetic)**, runs it, saves the draft. Lists all drafts generated for this match, each showing its algorithm + balance score.
5. **Draft result** — team A vs team B with per-team stat totals, the balance score, and the **soccer-court lineup** (defense/mid/attack rows per team). Re-generate to try again. A **"Choose this draft"** button marks it as the match's `chosenDraftId`.
6. **Match result entry** — once a draft is chosen, the match detail shows a small form to enter final **goals** (team A vs team B). Saved to `match.result`; the match is then flagged as "played" with its scoreline.
7. **Group export** — a **"Export CSV"** button on the group screen downloads all *chosen* matches (see §7b).

Styling: Tailwind (Play CDN) to match the clean look of v1; reuse the soccer court background image already in `teamdraft_app/app/assets/images/soccer_court.png`.

**Mobile responsive (required).** Mobile-first design — the app is built for phone use first, then enhanced for tablet/desktop via Tailwind breakpoints (`sm:` / `md:` / `lg:`). Specifics:
- `<meta name="viewport" content="width=device-width, initial-scale=1">` so it scales correctly.
- Touch-friendly targets: large tap areas for player selection, sliders (not tiny number spinners) for 0–100 stats.
- Data tables (players, drafts) collapse into stacked cards on narrow screens.
- Weights modal and the soccer-court lineup both sized to fit a phone viewport (lineup scales/rotates gracefully on small screens).
- Test at ~360px width up to desktop.

### 7b. CSV export design (suggestions)

I recommend a **tidy / long format: one row per player per chosen match**. It's the most flexible — opens cleanly in Excel/Sheets and lets you analyze per-player win rates, average teammate strength, etc. Only chosen matches with a recorded result are included.

Suggested columns:

```
match_date, match_id, balance_score, algorithm,
team, team_goals, opponent_goals, outcome,      # outcome = win/loss/draw
player_name, positioning, attack, defense, stamina
```

Alternative if you'd rather have **one row per match** (wide/summary format):

```
match_date, team_a_goals, team_b_goals, winner, balance_score, algorithm,
team_a_players, team_b_players               # names joined by "; "
```

Generated fully client-side (build a string, trigger a download) — no server needed. **Default: the tidy per-player format**; I can add a toggle for the summary format too. Filename e.g. `MondayFootball_matches_2026-07-20.csv`.

---

## 8. File-by-file build order

1. `index.html` + Tailwind + Firebase CDN wiring, login screen.
2. `firebase.js` — project config + Firestore init.
3. `store.js` — CRUD for groups, players, matches, drafts.
4. Groups + Group detail UI (players CRUD first).
5. Matches (create + player selection).
6. `ga.js` (genetic) + `brute.js` (brute force), sharing one fitness function + unit sanity test.
7. Draft generation (weights modal + algorithm toggle → run → save) + result view + list of drafts per match.
8. Choose-draft + result-entry (goals) on the match screen.
9. `lineup.js` + soccer court rendering.
10. `export.js` — CSV export of chosen matches (tidy format).
11. Firestore security rules + README with GitHub Pages + Firebase setup steps.

---

## 9. What I need from you to build

- A **Firebase project** (free). You create it, enable **Firestore**, and paste me the web-app config object (apiKey, projectId, etc.). It's safe to put in client code. I can walk you through this step-by-step when we start.
- Confirmation of the CSV format (tidy per-player, per §7b) — or whether you want the summary format / a toggle for both.

---

## 10. Open questions / decisions deferred

- Weight range: v1 modal used `min 0, step 0.1`; you specified **0–5 integer**. I'll use 0–5 (default 1) — confirm integer vs. decimals allowed.
- Multi-user later? (Currently single admin. Firestore + Firebase Auth makes multi-user easy when you want it.)
- Do you want match/draft **history** kept (multiple drafts per match) or just the latest? (Schema supports history; UI can show just the latest.)

---

*Next step: once you approve this and share the Firebase config, I'll scaffold the app in this folder following the build order above.*
