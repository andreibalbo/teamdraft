# TeamDraft — hosted (static) version

A single-page app that splits a list of players into two balanced teams.
No server: plain HTML/JS, runs on GitHub Pages, data in the browser
(localStorage) or in Firebase Firestore.

## Run it locally

Because it uses plain `<script>` tags, you can just open `index.html` in a
browser. For the most reliable behaviour, serve it:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Login: **admin / 123456** (change in `js/config.js`).

## Files

```
index.html          app shell + login
css/styles.css      sliders, soccer pitch
js/config.js        login, weight range, storage backend, Firebase config
js/store.js         data layer (localStorage OR Firestore, same API)
js/algorithms.js    balance score + genetic + brute-force splitters
js/lineup.js        defense/midfield/attack formation
js/export.js        CSV export of chosen matches
js/app.js           UI + navigation
```

## Data model

`groups → players / matches → drafts`. A player has `positioning`
(0 = defensive, 100 = offensive), `attack`, `defense`, `stamina` (all 0–100).
A match selects a subset of the group's players. A draft splits them into two
teams using per-stat weights (0–5). One draft per match can be marked *chosen*
and given a final score (goals).

## Choosing the algorithm

When generating a draft you pick:

- **Brute force** — evaluates every even split, returns the optimal one.
  Deterministic. Auto-disabled above 24 players (too many combinations).
- **Genetic** — a fast approximation (port of the original Python engine).
  Good for large player counts.

Both use the same balance-score formula, so their scores are comparable.

## CSV export

The "CSV" button on a group's Matches tab downloads all *chosen* matches that
have a recorded result, one row per player per match (date, score, outcome,
balance, algorithm, and each player's stats).

## Switching to Firebase (cloud sync)

By default data lives in the browser (`localStorage`) — great for one device.
For cloud storage / multiple devices:

1. Create a free Firebase project at <https://console.firebase.google.com>.
2. **Build → Firestore Database → Create database**.
3. **Project settings → Your apps → Web app** — copy the `firebaseConfig`
   object into `FIREBASE_CONFIG` in `js/config.js`, and set
   `STORAGE_BACKEND: "firebase"`. (The web config is **not** a secret.)
4. **Build → Authentication → Get started → Sign-in method → Anonymous →
   Enable → Save.** The app signs in anonymously so requests carry an auth
   token.
5. **Build → Firestore Database → Rules**, paste the rules below, **Publish**:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

6. For the live site, add your domain: **Authentication → Settings →
   Authorized domains → Add domain →** `<user>.github.io`. (`localhost` is
   already authorized for local testing.)

You do **not** create collections manually — Firestore creates them
automatically the first time the app writes data.

### Local testing requires a server (with Firebase)

Opening `index.html` via `file://` will make Firebase Auth fail (no valid
origin). Serve it instead:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy on GitHub Pages

This is the `hosted-version` branch. In the GitHub repo:

**Settings → Pages → Build and deployment → Deploy from a branch →
Branch: `hosted-version` / `(root)` → Save.**

The site publishes at `https://<user>.github.io/<repo>/`. All paths are
relative, so it works under that subpath.
