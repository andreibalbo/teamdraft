/* TeamDraft v2 — configuration
 * ---------------------------------------------------------------------------
 * Storage backend:
 *   - "local"    : browser localStorage (no setup, single device). DEFAULT.
 *   - "firebase" : Firestore (cloud, multi-device). Fill FIREBASE_CONFIG first.
 *
 * To switch to Firebase:
 *   1. Create a free Firebase project, enable Firestore.
 *   2. Copy the web-app config object into FIREBASE_CONFIG below.
 *   3. Set STORAGE_BACKEND to "firebase".
 * (The Firebase web config is safe to commit — it is not a secret.)
 */
window.TD = window.TD || {};

TD.config = {
  STORAGE_BACKEND: "firebase", // "local" | "firebase"

  // Login for LOCAL mode only (obscurity, not security).
  // In "firebase" mode these are IGNORED — login uses your Firebase
  // Email/Password account instead, and no password is stored in this file.
  ADMIN_USER: "admin",
  ADMIN_PASS: "123123",

  // Draft settings.
  WEIGHT_MIN: 0,
  WEIGHT_MAX: 5,
  WEIGHT_DEFAULT: 1,
  BRUTE_FORCE_MAX_PLAYERS: 24, // above this, brute force is disabled (too slow)

  // Paste your Firebase web config here when ready.
  FIREBASE_CONFIG: {
    apiKey: "AIzaSyCXep6zNzpZ6DNt83VySQCYAbpywJrEuuY",
    authDomain: "teamdraft-1afa4.firebaseapp.com",
    projectId: "teamdraft-1afa4",
    storageBucket: "teamdraft-1afa4.firebasestorage.app",
    messagingSenderId: "922953693306",
    appId: "1:922953693306:web:728b319efc808c9ca763c3"
  },
};

// Initialize the Firebase app exactly once (safe to call repeatedly).
TD.initFirebase = function () {
  if (typeof firebase === "undefined" || !firebase.firestore || !firebase.auth) {
    throw new Error("Firebase SDK not loaded (need app, firestore and auth).");
  }
  if (!firebase.apps.length) firebase.initializeApp(TD.config.FIREBASE_CONFIG);
  return firebase.app();
};
