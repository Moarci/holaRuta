# HelloAbroad (DE-EN Edition) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship HelloAbroad, a DE→EN travel-English edition of HolaRuta, as a new `de-en` learn-track + `hello-abroad` edition, reachable at its own URL and installable as its own PWA, without touching HolaRuta's existing behavior for any other track/edition.

**Architecture:** Edition-based reuse (no fork). A new entry in `config.js`'s `TRACKS` map plus a new entry in `editions/registry.js` drive 100% of the existing SRS/matcher/speech/stats pipeline (already track-agnostic). New surface area is limited to: one new data category, one new config field (`categoryAllowlist`) enforced at 4 read sites, storage-key namespacing (bug fix required by this change), a small `tracks` allowlist edit in two existing arrays, and a second PWA manifest.

**Tech Stack:** Vanilla JS (IIFE modules on `window.SC`), Node's built-in test runner (`node --test`, zero deps), static hosting (GitHub Pages), no build step required for this feature (edition selection is runtime `?edition=` query-param based).

## Global Constraints

- Zero new runtime dependencies (repo has none; `esbuild`/`@supabase/supabase-js` are unrelated to this feature).
- `de-es` (default track) behavior and storage keys MUST NOT change for existing users — every change here is additive/opt-in by track.
- No code comments explaining WHAT code does — only WHY, and only where non-obvious (matches this repo's existing comment style; look at any file you touch for the pattern before writing new comments).
- Every new/changed file keeps the repo's existing IIFE/`window.SC` module convention — do not introduce ES modules, bundlers, or classes where the surrounding file uses closures/functions.
- Run `npm test` after every task that touches a Node-testable file (`config.js`, `store.js`, `data.js`, `matcher.js` — anything required by `test/*.test.js`). `app.js`/`ui.js` are NOT requireable in the Node test harness (they assume a browser `document`/DOM) — those tasks are verified manually in-browser instead; say so explicitly, do not invent a fake automated test for them.

## Parallelization Map

Tasks 1, 2, 3, and 6 touch **disjoint files** and have no code dependency on each other landing first (each references only literal strings like `"de-en"`/`"hello-abroad"` that are already fixed by this plan) — safe to run fully in parallel, in separate worktrees if desired.

Tasks 4 and 5 **both edit `app.js`** (different line ranges — Task 4 also touches `ui.js`). Running them in separate worktrees risks a merge conflict on `app.js`. Recommended: run Task 4 and Task 5 **sequentially** (Task 4 then Task 5), or hand both to the same agent/session back-to-back. Do not isolate them into two parallel worktrees expecting an automatic clean merge.

Task 6 (PWA identity) is independent of everything except needing the literal string `"hello-abroad"` (already fixed) — safe to parallelize with 1/2/3.

Task 7 (final integration) depends on **all** of 1–6 being merged. It is the only hard barrier in this plan.

```
Task1 ─┐
Task2 ─┤
Task3 ─┼─ (parallel-safe, disjoint files) ──┐
Task6 ─┘                                     ├─→ Task7 (integration, needs everything)
Task4 → Task5  (sequential, shared app.js) ──┘
```

---

### Task 1: `de-en` track + `hello-abroad` edition + `categoryAllowlist` config field

**Files:**
- Modify: `config.js:63-80` (add `categoryAllowlist` to `DEFAULT`, add `"de-en"` to `TRACKS`)
- Modify: `editions/registry.js:167` (insert new `"hello-abroad"` entry before the closing `};` of `EDITIONS`)
- Test: `test/sc.test.js` (new `describe`/`test` block at the end of the file)

**Interfaces:**
- Produces: `SC.track.TRACKS["de-en"]` → `{ id: "de-en", learnLang: "en", nativeLangs: ["de"], cardNativeLang: null, ttsLocale: "en-US" }`.
- Produces: `SC.config.categoryAllowlist` — `string[] | null`, consumed by Task 5's `isCategoryAllowed()` helper in `app.js`.
- Produces: `SC.editions["hello-abroad"]` — consumed at runtime via `?edition=hello-abroad` (existing mechanism in `editions/registry.js:171-179`, unchanged).

- [ ] **Step 1: Add `categoryAllowlist` to `config.js` DEFAULT**

Edit `config.js`, in the `DEFAULT` object (right after the existing `track: null,` line, config.js:65):

```js
    // Lern-Track: "de-es" (Standard, Reise) | "es-en" (Locals, Englisch lernen) |
    // "de-en" (HelloAbroad, Reiseenglisch). null = Standard "de-es".
    track: null,
    // Kategorie-Filter fürs Lernen-Tab/Suche/Editor/Stats: null = alle Kategorien
    // sichtbar (Standard, unverändert für bestehende Editionen). Eine Edition mit
    // schmalerem Themenumfang (z.B. HelloAbroad) setzt eine explizite Liste
    // erlaubter Kategorie-IDs.
    categoryAllowlist: null,
  };
```

(Replace the closing `};` of `DEFAULT` accordingly — this just adds one field before the existing closing brace.)

- [ ] **Step 2: Add the `de-en` track to `TRACKS`**

Edit `config.js:77-80`, change:

```js
  var TRACKS = {
    "de-es": { id: "de-es", learnLang: "es", nativeLangs: ["de", "en"], cardNativeLang: null, ttsLocale: "es-419" },
    "es-en": { id: "es-en", learnLang: "en", nativeLangs: ["es", "en"], cardNativeLang: "es", ttsLocale: "en-US" },
  };
```

to:

```js
  var TRACKS = {
    "de-es": { id: "de-es", learnLang: "es", nativeLangs: ["de", "en"], cardNativeLang: null, ttsLocale: "es-419" },
    "es-en": { id: "es-en", learnLang: "en", nativeLangs: ["es", "en"], cardNativeLang: "es", ttsLocale: "en-US" },
    // HelloAbroad: DE-Muttersprachler lernt Reiseenglisch. cardNativeLang: null
    // (wie de-es) -> Frage folgt der UI-Sprache (Deutsch); learnLang "en" -> die
    // gelernte Antwort ist card.en (in data.js bereits zu 100% befüllt).
    "de-en": { id: "de-en", learnLang: "en", nativeLangs: ["de"], cardNativeLang: null, ttsLocale: "en-US" },
  };
```

- [ ] **Step 3: Add the `hello-abroad` edition entry**

Edit `editions/registry.js`, insert immediately before the closing `};` of `EDITIONS` (i.e. right after the existing `medellin: { ... },` block, editions/registry.js:166-167):

```js
    // HelloAbroad: eigenständiger DE-EN-Reiseenglisch-Ableger für 50-60+
    // (siehe docs/superpowers/specs/2026-07-18-helloabroad-design.md). Bewusst
    // KEIN "HolaRuta"-Bezug im brandName. categoryAllowlist beschränkt das
    // Lernen-Tab auf die 10 MVP-Reisebereiche (siehe Task 3 für "flughafen").
    "hello-abroad": {
      edition: "hello-abroad",
      brandName: "HelloAbroad",
      accent: { brand: "#2F6B70", brandInk: "#1F4A4E" },
      partner: null,
      logo: null,
      defaultDestination: null,
      appUrl: "https://moarci.github.io/holaRuta/hello-abroad/",
      track: "de-en",
      taskTab: false,
      teacherTab: false,
      sync: null,
      categoryAllowlist: [
        "basics", "talk", "flughafen", "grenze", "hotel", "hostel",
        "essen", "trinken", "compras", "dinero", "banco",
        "verkehr", "rumbo", "auto", "farmacia", "notfall",
      ],
    },
  };
```

- [ ] **Step 4: Write the failing tests**

Append to `test/sc.test.js` (after the last existing `test(...)` block, keep using the same `test`/`assert` already imported at the top of the file):

```js
// ---------- de-en track (HelloAbroad) ----------
test("SC.track.TRACKS: de-en Eintrag existiert mit korrekten Feldern", () => {
  // config.js ist DOM-frei (reines Merge/Daten) und daher genau wie data.js
  // direkt im Node-Testrunner ladbar.
  require(path.join(SRC, "config.js"));
  const track = globalThis.window.SC.track;
  assert.ok(track && track.TRACKS && track.TRACKS["de-en"], "TRACKS.de-en fehlt");
  assert.deepEqual(track.TRACKS["de-en"], {
    id: "de-en", learnLang: "en", nativeLangs: ["de"], cardNativeLang: null, ttsLocale: "en-US",
  });
});

test("matcher.check: de-en-Track prüft gegen card.en, nicht card.es", () => {
  // Isolierter Stub statt vollem config.js-Require: matcher.js liest nur
  // window.SC.track.learnLang()/.cardNativeLang() (siehe matcher.js:45-59).
  const prevTrack = globalThis.window.SC.track;
  globalThis.window.SC.track = { learnLang: () => "en", cardNativeLang: () => null };
  const card = { de: "Hallo", en: "Hello", es: "Hola" };
  assert.equal(matcher.check("Hello", card, "learn").correct, true);
  assert.equal(matcher.check("Hola", card, "learn").correct, false);
  globalThis.window.SC.track = prevTrack; // Testisolation: anderen Tests nicht beeinflussen
});
```

- [ ] **Step 5: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL on both new tests — `TRACKS.de-en fehlt` (assertion) and the matcher test failing because `learnLang()` still falls back to `"es"` behavior not yet wired for `"en"` comparison against `card.en` (before Step 1-2 land, `TRACKS["de-en"]` is `undefined`).

- [ ] **Step 6: Apply Steps 1-3 (implementation)**

(Already written above — apply the edits to `config.js` and `editions/registry.js`.)

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all existing tests plus the 2 new ones green.

- [ ] **Step 8: Commit**

```bash
git add config.js editions/registry.js test/sc.test.js
git commit -m "feat(hello-abroad): add de-en track, hello-abroad edition, categoryAllowlist config field"
```

---

### Task 2: Track-namespaced storage keys (+ es-en legacy migration)

**Files:**
- Modify: `store.js:9-25` (namespace the 6 key constants by track id)
- Test: Create `test/store.test.js`

**Interfaces:**
- Consumes: `window.SC.track.id()` (from Task 1 — but gracefully falls back to `"de-es"` if `SC.track` isn't loaded, matching the existing pattern in `matcher.js:45-48`).
- Produces: no new public API — `SC.store`'s existing methods (`saveProgress`, `loadProgress`, etc.) are unchanged; only the underlying `localStorage` key strings change for non-`de-es` tracks.

- [ ] **Step 1: Write the failing test**

Create `test/store.test.js`:

```js
/*
 * store.test.js – Storage-Key-Namensraum je Lern-Track. Node hat kein
 * localStorage: minimaler In-Memory-Stub reicht, store.js ruft ihn nur
 * innerhalb von Funktionen auf (kein Top-Level-Zugriff außer den neuen
 * TRACK_ID/TRACK_NS-Konstanten, die window.SC.track lesen, nicht localStorage).
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

function freshLocalStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    _map: map,
  };
}

function loadStoreWithTrack(trackId) {
  delete require.cache[require.resolve(path.join(__dirname, "..", "store.js"))];
  globalThis.window = { SC: { track: { id: () => trackId } } };
  globalThis.localStorage = freshLocalStorage();
  require(path.join(__dirname, "..", "store.js"));
  return { store: globalThis.window.SC.store, localStorage: globalThis.localStorage };
}

test("store: de-es (Standard) nutzt unpräfixierte Legacy-Keys, unverändert", () => {
  const { store, localStorage } = loadStoreWithTrack("de-es");
  store.saveProgress({ x: 1 });
  assert.equal(localStorage.getItem("spanischcard.progress.v2"), JSON.stringify({ x: 1 }));
});

test("store: de-en (HelloAbroad) nutzt einen eigenen, namensraum-getrennten Key", () => {
  const { store, localStorage } = loadStoreWithTrack("de-en");
  store.saveProgress({ x: 2 });
  assert.equal(localStorage.getItem("spanischcard.de-en.progress.v2"), JSON.stringify({ x: 2 }));
  assert.equal(localStorage.getItem("spanischcard.progress.v2"), null); // kein Bluten in den de-es-Key
});

test("store: es-en migriert einmalig bestehende Legacy-Daten (bestehende ingles-pro/venue-en-Nutzer verlieren keinen Fortschritt)", () => {
  const preSeeded = freshLocalStorage();
  preSeeded.setItem("spanischcard.progress.v2", JSON.stringify({ legacy: true }));
  globalThis.localStorage = preSeeded;
  globalThis.window = { SC: { track: { id: () => "es-en" } } };
  delete require.cache[require.resolve(path.join(__dirname, "..", "store.js"))];
  require(path.join(__dirname, "..", "store.js"));
  assert.equal(globalThis.localStorage.getItem("spanischcard.es-en.progress.v2"), JSON.stringify({ legacy: true }));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/store.test.js`
Expected: FAIL — `store.js` doesn't yet export via a Node-safe path / keys aren't namespaced yet (first test may even fail to find `globalThis.window.SC.store` depending on current top-level assumptions; the important failure is the second/third test's namespaced-key assertions).

- [ ] **Step 3: Implement the namespacing + migration**

Edit `store.js:9-25`, change:

```js
  const PROGRESS_KEY = "spanischcard.progress.v2";
  const SETTINGS_KEY = "spanischcard.settings.v1";
  const USERCARDS_KEY = "spanischcard.usercards.v1";
  const GAMESTATS_KEY = "spanischcard.gamestats.v1";
  const TASKS_KEY = "spanischcard.tasks.v1"; // abonnierte Aufgaben (mehrere parallel)
  const FAVORITES_KEY = "spanischcard.favorites.v1"; // „Mi léxico": gemerkte Wörter/Sätze
```

to:

```js
  // Track-Namespace: verhindert, dass zwei Editionen mit unterschiedlicher
  // Lernrichtung (z.B. de-es/HolaRuta und de-en/HelloAbroad) unter derselben
  // Origin denselben Fortschritt teilen (Karten-IDs sind identisch, nur
  // learnLang unterscheidet sich). de-es (Standard) bleibt UNPRÄFIXIERT
  // (Rückwärtskompatibilität, keine Migration für die meisten Nutzer). config.js
  // läuft synchron VOR allen deferred Scripts (siehe index.html-Kommentar bei
  // registry.js/config.js) - SC.track ist hier bereits vollständig gesetzt.
  const TRACK_ID = (() => {
    try { return (window.SC && window.SC.track && window.SC.track.id && window.SC.track.id()) || "de-es"; }
    catch (e) { return "de-es"; }
  })();
  const TRACK_NS = TRACK_ID === "de-es" ? "" : TRACK_ID + ".";

  const PROGRESS_KEY = "spanischcard." + TRACK_NS + "progress.v2";
  const SETTINGS_KEY = "spanischcard." + TRACK_NS + "settings.v1";
  const USERCARDS_KEY = "spanischcard." + TRACK_NS + "usercards.v1";
  const GAMESTATS_KEY = "spanischcard." + TRACK_NS + "gamestats.v1";
  const TASKS_KEY = "spanischcard." + TRACK_NS + "tasks.v1"; // abonnierte Aufgaben (mehrere parallel)
  const FAVORITES_KEY = "spanischcard." + TRACK_NS + "favorites.v1"; // „Mi léxico": gemerkte Wörter/Sätze
```

Then, immediately after the existing `const KNOWN_KEYS = [...]` line (store.js:25), add the one-time legacy migration for already-productive non-`de-es` tracks (only `es-en` has real users today; `de-en` is brand new so this loop is a no-op for it):

```js
  const KNOWN_KEYS = [PROGRESS_KEY, SETTINGS_KEY, USERCARDS_KEY, GAMESTATS_KEY, TASKS_KEY, FAVORITES_KEY];

  // Einmalige Migration für bereits produktive Nicht-de-es-Nutzer (aktuell nur
  // es-en/ingles-pro/venue-en): vor diesem Fix lagen ihre Daten unter den
  // unpräfixierten de-es-Keys (die einzigen, die es damals gab). Für de-en
  // (neu, HelloAbroad) existieren keine Alt-Daten -> diese Schleife ist dort
  // ein reines No-Op (LEGACY_KEYS sind immer leer).
  if (TRACK_NS) {
    const LEGACY_KEYS = [
      "spanischcard.progress.v2", "spanischcard.settings.v1", "spanischcard.usercards.v1",
      "spanischcard.gamestats.v1", "spanischcard.tasks.v1", "spanischcard.favorites.v1",
    ];
    KNOWN_KEYS.forEach((key, i) => {
      try {
        if (localStorage.getItem(key) == null) {
          const legacy = localStorage.getItem(LEGACY_KEYS[i]);
          if (legacy != null) localStorage.setItem(key, legacy);
        }
      } catch (e) { /* localStorage gesperrt o.ä. – ohne Migration weiter, App läuft trotzdem */ }
    });
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/store.test.js`
Expected: PASS (all 3 tests). Then run: `npm test`
Expected: PASS (full suite green — confirms this change didn't regress anything `de-es`-related).

- [ ] **Step 5: Commit**

```bash
git add store.js test/store.test.js
git commit -m "fix(store): namespace storage keys by learn-track, migrate existing es-en users"
```

**Known limitation (documented, not silently dropped):** the IndexedDB backup mirror (`store.js:665-667`, DB name `holaruta-backup`) is NOT namespaced by this task — it stores one shared snapshot record per origin. Two tracks on the same device will only have the most-recently-mirrored track's data safely backed up in IndexedDB (the iOS "localStorage evicted after 7 days" safety net). This does not affect the live `localStorage` data (already correctly namespaced above), only the extra backup-of-backup. Track as a fast-follow if it becomes a real issue; out of scope for this MVP task.

---

### Task 3: New "flughafen" category + cards

**Files:**
- Modify: `data.js` (add one `CATEGORIES` entry + ~18 `CARDS` entries)

**Interfaces:**
- Produces: category id `"flughafen"` (group `"travel"`), card ids `fh01`-`fh18`, each with `{id, cat, lvl, de, en, es, tip?}` matching the existing card schema exactly (verified 100% `en` coverage elsewhere in `data.js`, this category keeps that invariant).
- Consumed by: `editions/registry.js`'s `hello-abroad.categoryAllowlist` (Task 1, already references `"flughafen"` by string) and by the existing (unmodified) `npm test` data-integrity checks (duplicate-ID check, cat/lvl-reference check) — no test changes needed here, the existing suite already covers new categories/cards automatically.

- [ ] **Step 1: Add the category**

Edit `data.js`, insert immediately after the `"grenze"` category line (data.js:61):

```js
    { id: "grenze",  label: "Behörden",   labelEn: "Officials", icon: "🛂", grad: ["#566B8A", "#6E86A3"], group: "travel" },
    { id: "flughafen", label: "Flughafen & Gepäck", labelEn: "Airport & Luggage", icon: "✈️", grad: ["#2F6B70", "#3E8388"], group: "travel" },
```

- [ ] **Step 2: Add the cards**

Insert a new contiguous block into the `CARDS` array (place it directly after the `notfall` block, i.e. after the `n15` card, data.js:472 — same convention as every other category's cards being grouped together):

```js
    // ---------- Flughafen & Gepäck (neu, HelloAbroad) ----------
    // fh09-fh13 portiert/adaptiert aus logistica.js:270-277 ("equipaje"-Sektion,
    // Airport & lost luggage) statt neu geschrieben (Content-Wiederverwendung).
    { id: "fh01", cat: "flughafen", lvl: 1, de: "Ich möchte einchecken", en: "I'd like to check in", es: "Quiero hacer el check-in" },
    { id: "fh02", cat: "flughafen", lvl: 1, de: "die Bordkarte", en: "the boarding pass", es: "la tarjeta de embarque" },
    { id: "fh03", cat: "flughafen", lvl: 1, de: "Wo ist Gate 12?", en: "Where is gate 12?", es: "¿Dónde está la puerta 12?" },
    { id: "fh04", cat: "flughafen", lvl: 1, de: "das Handgepäck", en: "the hand luggage / carry-on", es: "el equipaje de mano" },
    { id: "fh05", cat: "flughafen", lvl: 2, de: "Ich möchte diesen Koffer aufgeben", en: "I'd like to check this suitcase", es: "Quiero facturar esta maleta" },
    { id: "fh06", cat: "flughafen", lvl: 3, de: "Habe ich Übergepäck?", en: "Do I have excess baggage?", es: "¿Tengo exceso de equipaje?" },
    { id: "fh07", cat: "flughafen", lvl: 2, de: "Der Flug hat Verspätung", en: "The flight is delayed", es: "El vuelo está retrasado" },
    { id: "fh08", cat: "flughafen", lvl: 3, de: "Ich habe meinen Anschlussflug verpasst", en: "I missed my connecting flight", es: "Perdí mi vuelo de conexión" },
    { id: "fh09", cat: "flughafen", lvl: 2, de: "Mein Koffer ist nicht angekommen", en: "My suitcase didn't arrive", es: "Mi maleta no llegó" },
    { id: "fh10", cat: "flughafen", lvl: 3, de: "Ich habe diesen Rucksack aufgegeben und er ist nicht aufgetaucht", en: "I checked in this backpack and it didn't show up", es: "Facturé esta mochila y no apareció" },
    { id: "fh11", cat: "flughafen", lvl: 2, de: "Wo melde ich verlorenes Gepäck?", en: "Where do I report lost luggage?", es: "¿Dónde reporto el equipaje perdido?" },
    { id: "fh12", cat: "flughafen", lvl: 2, de: "Hier ist mein Gepäckschein", en: "Here's my baggage tag", es: "Aquí está mi talón de equipaje" },
    { id: "fh13", cat: "flughafen", lvl: 2, de: "Können Sie ihn mir zum Hotel schicken?", en: "Can you send it to my hotel?", es: "¿Me lo pueden enviar al hotel?" },
    { id: "fh14", cat: "flughafen", lvl: 1, de: "die Sicherheitskontrolle", en: "the security check", es: "el control de seguridad" },
    { id: "fh15", cat: "flughafen", lvl: 2, de: "Flüssigkeiten müssen in einen durchsichtigen Beutel", en: "Liquids must go in a clear bag", es: "Los líquidos deben ir en una bolsa transparente" },
    { id: "fh16", cat: "flughafen", lvl: 1, de: "Muss ich die Schuhe ausziehen?", en: "Do I need to take off my shoes?", es: "¿Tengo que quitarme los zapatos?" },
    { id: "fh17", cat: "flughafen", lvl: 1, de: "Ich habe nichts zu verzollen", en: "I have nothing to declare", es: "No tengo nada que declarar" },
    { id: "fh18", cat: "flughafen", lvl: 1, de: "Wo ist der Ausgang?", en: "Where is the exit?", es: "¿Dónde está la salida?" },
```

- [ ] **Step 3: Run the existing data-integrity tests**

Run: `npm test`
Expected: PASS — the existing suite already asserts no duplicate card IDs and that every `cat`/`lvl` reference an existing category/level (this is why no new test file is needed for this task; confirm by reading the relevant existing assertions if you want to see them, e.g. search `test/sc.test.js` for `"doppelte"`).

- [ ] **Step 4: Commit**

```bash
git add data.js
git commit -m "feat(data): add flughafen category (airport & luggage), ported from logistica.js equipaje"
```

---

### Task 4: `tracks` allowlist — add `"de-en"` to core Entdecken/search features

**Files:**
- Modify: `ui.js:140,141,143,146,153,155` (the `FEATURES` array)
- Modify: `app.js:6064,6065,6067,6068,6072,6074` (the `SEARCH_FEATURES` mirror array)

**Interfaces:**
- No new interfaces — this only widens existing `tracks: [...]` arrays on 6 already-existing feature entries so they don't disappear for the new `de-en` track. (Reminder: entries with NO `tracks` field default to `["de-es"]` only — ui.js:1095/app.js:6138 — so LatAm-only features stay correctly hidden for `de-en` automatically, no action needed for those.)

**Chosen subset (rationale):** of the entries already tagged `["de-es", "es-en"]`, these 6 generalize cleanly to a travel-English MVP and map to genuinely useful practice for the 10 HelloAbroad topics: `open-favorites` (saved words), `open-spickzettel` (survival phrases), `open-quiz-setup` (definitions quiz), `open-endless` (endless flashcard drill), `open-compras` (shopping-list practice), `open-precios` (hearing/typing prices — needs `speech`, already generic). Left out: `open-frases` (needs the `"frases"` module, which is Spanish-sentence-building-block content, not verified English-ready — defer), `open-dialogos`/`open-cuerpo`/`open-yesto`/`open-banderas` (roleplay/body-parts/picture-guess/flag-quiz — not part of the 10 MVP topics, skip for now).

- [ ] **Step 1: Update `ui.js` FEATURES array**

Edit `ui.js`, change these 6 lines (139-155 region) — each gets `"de-en"` appended to its existing `tracks` array:

```js
    { action: "open-favorites", tracks: ["de-es", "es-en", "de-en"],   icon: "lc:star", title: "Mi léxico",     subKey: "discover.subFavorites", sub: "Deine Favoriten als persönliches Lexikon – Lieblingswörter & -sätze griffbereit", grad: ["#B97C24", "#E9A23B"], group: "reference" },
    { action: "open-spickzettel", tracks: ["de-es", "es-en", "de-en"], icon: "lc:life-buoy", title: "Supervivencia",  subKey: "discover.subSupervivencia", sub: "Die wichtigsten Sätze sofort griffbereit", grad: ["#B5302A", "#CE463E"], group: "reference" },
    { action: "open-quiz-setup", tracks: ["de-es", "es-en", "de-en"],  icon: "lc:puzzle", title: "Definiciones",  subKey: "discover.subDefiniciones", sub: "Definition lesen, Begriff wählen",       grad: ["#3F7355", "#2F6B70"], group: "play" },
    { action: "open-endless", tracks: ["de-es", "es-en", "de-en"],     icon: "lc:infinity", title: "Vocabulario sin fin", subKey: "discover.subEndless", sub: "Karteikarten am Stück – alle Themen gemischt, ohne Rundenende", grad: ["#2E6E86", "#7048E8"], group: "practice" },
    { action: "open-precios",     tracks: ["de-es", "es-en", "de-en"], icon: "lc:banknote", title: "Precios al oído", subKey: "discover.subPrecios", sub: "Preise hören & eintippen – bis zu Millionenbeträgen", grad: ["#5E7D3A", "#76954E"], need: "speech", group: "play" },
    { action: "open-compras",     tracks: ["de-es", "es-en", "de-en"], icon: "lc:shopping-cart", title: "Lista de compras", subKey: "discover.subCompras", sub: "Supermarkt, Kleidung, Farmacia – Reisebedarf üben", grad: ["#3F7355", "#B97C24"], group: "practice" },
```

- [ ] **Step 2: Update `app.js` SEARCH_FEATURES mirror array**

Edit `app.js:6064,6065,6067,6068,6072,6074`, same 6 entries, same edit:

```js
    { action: "open-favorites",   icon: "lc:star", title: "Mi léxico",        subKey: "discover.subFavorites", tracks: ["de-es", "es-en", "de-en"] },
    { action: "open-spickzettel", icon: "lc:life-buoy", title: "Supervivencia",    subKey: "discover.subSupervivencia", tracks: ["de-es", "es-en", "de-en"] },
    { action: "open-quiz-setup",  icon: "lc:puzzle", title: "Definiciones",      subKey: "discover.subDefiniciones", tracks: ["de-es", "es-en", "de-en"] },
    { action: "open-endless",     icon: "lc:infinity", title: "Vocabulario sin fin", subKey: "discover.subEndless", tracks: ["de-es", "es-en", "de-en"] },
    { action: "open-precios",     icon: "lc:banknote", title: "Precios al oído",   subKey: "discover.subPrecios", need: "speech", tracks: ["de-es", "es-en", "de-en"] },
    { action: "open-compras",     icon: "lc:shopping-cart", title: "Lista de compras",  subKey: "discover.subCompras", tracks: ["de-es", "es-en", "de-en"] },
```

- [ ] **Step 3: Manual verification (app.js/ui.js are not Node-testable — no DOM in the test harness)**

Run: `npm test` (expect unchanged PASS — these files aren't loaded by the Node suite, so this only guards against you having broken something else while editing).

Then in a browser (e.g. open `index.html?edition=hello-abroad` locally): open the "Entdecken" tab and confirm exactly these 6 tiles are visible (Mi léxico, Supervivencia, Definiciones, Vocabulario sin fin, Precios al oído, Lista de compras) and no LatAm-only tiles (Jerga, Flirt, Bailar, Música, Info/Países, Historia, Modo hostal, etc.) appear. Also use the in-app search for one of the 6 (e.g. type "léxico") and confirm it's findable.

- [ ] **Step 4: Commit**

```bash
git add ui.js app.js
git commit -m "feat(hello-abroad): add de-en to the 6 core Entdecken/search features' tracks allowlist"
```

---

### Task 5: `categoryAllowlist` enforcement (Home, Search, Editor, Stats)

**Files:**
- Modify: `app.js:326` area (add `isCategoryAllowed` helper near `isLocals`)
- Modify: `app.js:413-414` (`scopeCards`)
- Modify: `app.js:558-560` (`homeVM`'s `visibleCats`)
- Modify: `app.js:6110-6130` (`buildSearchIndex`'s card loop + `searchCats`)
- Modify: `app.js:6501` (`editorVM`'s `categories`)

**Interfaces:**
- Produces: `isCategoryAllowed(catId): boolean` (private to app.js, not exported) — `true` when `SC.config.categoryAllowlist` is `null`/unset (preserves exact current behavior for every existing edition), else `true` only if `catId` is in the list.
- Consumes: `SC.config.categoryAllowlist` (from Task 1).

**Note:** `app.js` cannot be `require()`-d in the Node test harness (it references `document`/`window.location` at load time — unlike `config.js`/`store.js`/`data.js`, which are deliberately DOM-free). Verification for this task is manual/in-browser, matching the spec's own "Manuelle Verifikation im Browser" testing section — do not fabricate an automated test for this file.

- [ ] **Step 1: Add the `isCategoryAllowed` helper**

Edit `app.js`, right after the existing `isLocals` line (app.js:326):

```js
  const isLocals = () => { const t = trk(); return !!(t && t.id && t.id() === "es-en"); };
  // Kategorie-Filter fürs Lernen-Tab/Suche/Editor/Stats (siehe config.js
  // categoryAllowlist). null/unset -> alles erlaubt (unverändertes Verhalten
  // für jede bestehende Edition ohne categoryAllowlist).
  const isCategoryAllowed = (catId) => {
    const allow = window.SC.config && window.SC.config.categoryAllowlist;
    return !allow || allow.indexOf(catId) >= 0;
  };
```

- [ ] **Step 2: Enforce it in `scopeCards` (Stats/Badges/"all")**

Edit `app.js:413-414`, change:

```js
  const scopeCards = (scopeId) =>
    allCards().filter((c) => (scopeId === "all" || c.cat === scopeId) && matchesLevel(c) && matchesKind(c));
```

to:

```js
  const scopeCards = (scopeId) =>
    allCards().filter((c) => (scopeId === "all" ? isCategoryAllowed(c.cat) : c.cat === scopeId) && matchesLevel(c) && matchesKind(c));
```

- [ ] **Step 3: Enforce it in `homeVM`'s category tiles**

Edit `app.js:558-560`, change:

```js
    const visibleCats = isLocals()
      ? data.CATEGORIES.filter((c) => localsGroupSet().has(c.group))
      : data.CATEGORIES;
```

to:

```js
    const visibleCats = isLocals()
      ? data.CATEGORIES.filter((c) => localsGroupSet().has(c.group))
      : data.CATEGORIES.filter((c) => isCategoryAllowed(c.id));
```

- [ ] **Step 4: Enforce it in the search index**

Edit `app.js:6110-6119` (the vocab-card indexing loop), change:

```js
    allCards().forEach((c) => {
      const cat = categoryById(c.cat);
      idx.push({
```

to:

```js
    allCards().filter((c) => isCategoryAllowed(c.cat)).forEach((c) => {
      const cat = categoryById(c.cat);
      idx.push({
```

And edit `app.js:6122` (the category-deck indexing), change:

```js
    const searchCats = locals ? data.CATEGORIES.filter((c) => localsGroupSet().has(c.group)) : data.CATEGORIES;
```

to:

```js
    const searchCats = locals ? data.CATEGORIES.filter((c) => localsGroupSet().has(c.group)) : data.CATEGORIES.filter((c) => isCategoryAllowed(c.id));
```

- [ ] **Step 5: Enforce it in the own-cards editor's category dropdown**

Edit `app.js:6501` (`editorVM`), change:

```js
      categories: data.CATEGORIES.map((c) => ({ id: c.id, label: natk(c, "label"), icon: c.icon })),
```

to:

```js
      categories: data.CATEGORIES.filter((c) => isCategoryAllowed(c.id)).map((c) => ({ id: c.id, label: natk(c, "label"), icon: c.icon })),
```

- [ ] **Step 6: Manual verification in browser**

Run: `npm test` (expect unchanged PASS — guards against unrelated breakage; `app.js` itself isn't covered by this suite).

Then in a browser at `index.html?edition=hello-abroad`:
1. Lernen-Tab shows exactly the 16 allowed categories (basics, talk, flughafen, grenze, hotel, hostel, essen, trinken, compras, dinero, banco, verkehr, rumbo, auto, farmacia, notfall) and none of the other 55.
2. Search for a term only found in an excluded category (e.g. "bailar"/dancing) returns no card/category hit.
3. Own-cards editor's category `<select>` only lists the 16 allowed categories.
4. Study a few cards, check Statistik/Profil screen — overall progress numbers only reflect the 16 categories (compare against `index.html` with no `?edition=` param, where all 71 categories count).

- [ ] **Step 7: Commit**

```bash
git add app.js
git commit -m "feat(hello-abroad): enforce categoryAllowlist across home, search, editor, and stats"
```

---

### Task 6: PWA identity — manifest, icon, boot.js switch, redirect URL

**Files:**
- Create: `icon-hello-abroad.svg`
- Create: `manifest-hello-abroad.webmanifest`
- Create: `hello-abroad/index.html`
- Modify: `boot.js:34-35` (manifest link swap) and `index.html:35` area is NOT modified directly — instead `boot.js` gains a second dynamic swap for the `apple-touch-icon` link, see Step 3.

**Interfaces:**
- Produces: a fully distinct installable-PWA identity for `hello-abroad`, reachable at `moarci.github.io/holaRuta/hello-abroad/`.
- Consumes: `SC.config.edition` (already set at runtime by `editions/registry.js`'s existing `?edition=` mechanism — no new config plumbing needed here).

- [ ] **Step 1: Create the icon**

Create `icon-hello-abroad.svg` (mirrors the style/structure of the existing `icon.svg`, new petrol palette + speech-bubble motif for "Hello"):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2F6B70"/>
      <stop offset="1" stop-color="#3E8388"/>
    </linearGradient>
  </defs>
  <!-- Voller Hintergrund (maskable-sicher: Motiv in der 80%-Safe-Zone zentriert) -->
  <rect width="512" height="512" fill="url(#g)"/>
  <!-- Sprechblase: Reise-Gespräch im Ausland (HelloAbroad) -->
  <path d="M96 150 h320 a40 40 0 0 1 40 40 v140 a40 40 0 0 1 -40 40 h-186 l-64 62 v-62 h-70 a40 40 0 0 1 -40 -40 v-140 a40 40 0 0 1 40 -40 Z"
        fill="#FBF3E4"/>
  <text x="256" y="272" font-family="Bricolage Grotesque, Segoe UI, Arial, sans-serif"
        font-size="96" font-weight="800" fill="#1F4A4E" text-anchor="middle">Hi</text>
</svg>
```

- [ ] **Step 2: Rasterize the icon to the required PNG sizes**

The repo has no image-rasterization dependency (`package.json` only lists `esbuild`/`@supabase/supabase-js`) and the existing PNGs (`icon-180.png`, `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`) were produced outside the repo's build — there is no `svg → png` script to reuse. Use a browser to render and screenshot the SVG at each exact pixel size (e.g. via the Playwright MCP tools available in this environment: navigate to a tiny local wrapper HTML that renders `icon-hello-abroad.svg` at a fixed `width`/`height`, then take a screenshot clipped to that exact size):

1. Write a throwaway `scratch-icon-wrapper.html` (NOT committed — delete after use) with `<img src="icon-hello-abroad.svg" style="width:Npx;height:Npx;display:block">` and no margin/padding on `body`.
2. For N in `192`, `512`: navigate to the wrapper, resize the browser viewport to exactly `NxN`, screenshot, save as `icon-192-hello-abroad.png` / `icon-512-hello-abroad.png`.
3. For `180`: same, save as `icon-180-hello-abroad.png`.
4. Reuse the `512x512` screenshot as `icon-512-maskable-hello-abroad.png` (the SVG is already maskable-safe by design — full-bleed background, motif centered within the safe zone — same convention the existing `icon.svg`'s own comment documents).
5. Delete the throwaway wrapper HTML once all 4 PNGs are saved; confirm the 4 PNG files + the SVG exist at the repo root via `ls icon-*hello-abroad*`.

- [ ] **Step 3: Create the manifest**

Create `manifest-hello-abroad.webmanifest` (mirrors `manifest.webmanifest`'s structure; trimmed `shortcuts`/`screenshots` since those reference HolaRuta-specific content not relevant here):

```json
{
  "name": "HelloAbroad – Reiseenglisch",
  "short_name": "HelloAbroad",
  "description": "Reiseenglisch auffrischen für unterwegs – Karteikarten mit Spaced Repetition für Flughafen, Hotel, Restaurant, Einkaufen und Notfall. Funktioniert offline.",
  "lang": "de",
  "dir": "ltr",
  "id": "hello-abroad",
  "start_url": "./?edition=hello-abroad&source=pwa",
  "scope": ".",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#1F4A4E",
  "theme_color": "#1F4A4E",
  "categories": ["education", "travel"],
  "launch_handler": { "client_mode": "navigate-existing" },
  "handle_links": "preferred",
  "icons": [
    { "src": "icon-192-hello-abroad.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "icon-512-hello-abroad.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "icon-512-maskable-hello-abroad.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" },
    { "src": "icon-hello-abroad.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any" }
  ]
}
```

**Important correctness detail (found by reading the existing manifests, not by assumption):** `start_url` MUST include `?edition=hello-abroad` explicitly — `editions/registry.js`'s runtime edition selection (registry.js:171-179) reads `location.search`, and there is no persisted "last edition" anywhere. If `start_url` were just `"."` (like the base manifest), launching the installed icon from the home screen would open plain HolaRuta, not HelloAbroad. Also note `id: "hello-abroad"` is deliberately a **different** value than the base manifest's `id: "."` — this is what makes the OS treat it as a distinct installable app identity instead of "upgrading" the existing HolaRuta install.

- [ ] **Step 4: Extend `boot.js`'s dynamic link-swap for the edition (manifest AND apple-touch-icon)**

Edit `boot.js:25-37` (the theme-swap IIFE), change:

```js
(function () {
  window.__bootStart = Date.now(); // Startzeit für den In-App-Splash (Mindestdauer)
  try {
    var s = JSON.parse(localStorage.getItem("spanischcard.settings.v1") || "{}");
    var t = (s && (s.theme === "dark" || s.theme === "light")) ? s.theme
      : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = t;
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "dark" ? "#0E0907" : "#241510");
    var man = document.querySelector('link[rel="manifest"]');
    if (man) man.setAttribute("href", t === "dark" ? "manifest-dark.webmanifest" : "manifest.webmanifest");
  } catch (e) { /* localStorage gesperrt o.ä. – App startet hell */ }
})();
```

to:

```js
(function () {
  window.__bootStart = Date.now(); // Startzeit für den In-App-Splash (Mindestdauer)
  try {
    var s = JSON.parse(localStorage.getItem("spanischcard.settings.v1") || "{}");
    var t = (s && (s.theme === "dark" || s.theme === "light")) ? s.theme
      : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = t;
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "dark" ? "#0E0907" : "#241510");
    // Edition-Erkennung VOR config.js unmöglich (boot.js läuft zuerst, DOM-frei) -
    // liest darum direkt denselben ?edition=-Query-Param wie editions/registry.js.
    var isHelloAbroad = /(?:^|[?&])edition=hello-abroad(?:&|$)/.test(location.search);
    var man = document.querySelector('link[rel="manifest"]');
    if (man) man.setAttribute("href", isHelloAbroad ? "manifest-hello-abroad.webmanifest" : (t === "dark" ? "manifest-dark.webmanifest" : "manifest.webmanifest"));
    // apple-touch-icon ist NICHT Teil des Manifests (iOS liest es separat aus
    // index.html) - ohne diesen zweiten Swap würde "Zum Home-Bildschirm" auf
    // iOS weiterhin das HolaRuta-Icon zeigen.
    var appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (appleIcon && isHelloAbroad) appleIcon.setAttribute("href", "icon-180-hello-abroad.png");
  } catch (e) { /* localStorage gesperrt o.ä. – App startet hell */ }
})();
```

- [ ] **Step 5: Create the redirect folder**

Create `hello-abroad/index.html` (same pattern as the existing `en/index.html` redirect to `ingles-pro`):

```html
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HelloAbroad</title>
  <!-- Einfache, teilbare URL für HelloAbroad. Leitet auf die App mit der
       Edition "hello-abroad" weiter. Reiner Redirect: die App selbst liegt
       unter ../ (relative Asset-Pfade bleiben intakt). Bewusst OHNE
       Inline-Skript: der Meta-Refresh mit 0s erledigt die Weiterleitung und
       erlaubt eine CSP mit script-src 'none'. -->
  <link rel="canonical" href="../?edition=hello-abroad" />
  <meta name="robots" content="noindex, follow" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; script-src 'none'" />
  <meta http-equiv="refresh" content="0; url=../?edition=hello-abroad" />
  <style>
    html, body { height: 100%; margin: 0; }
    body { display: grid; place-items: center; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
           background: #1F4A4E; color: #fff; text-align: center; padding: 1.5rem; }
    a { color: #fff; }
  </style>
</head>
<body>
  <!-- Sichtbarer Fallback, falls der Meta-Refresh nicht greift (Reader-Modus o.ä.). -->
  <main>
    <p>HelloAbroad</p>
    <p><a href="../?edition=hello-abroad">Öffnen / Open →</a></p>
  </main>
</body>
</html>
```

- [ ] **Step 6: Manual verification**

In a browser: open `hello-abroad/index.html` locally, confirm it redirects to `?edition=hello-abroad` and the app shows "HelloAbroad" branding. Open dev tools → Application → Manifest, confirm it now shows the `manifest-hello-abroad.webmanifest` (name "HelloAbroad", id "hello-abroad", correct icons). If on a phone (or a mobile emulation profile), use "Add to Home Screen" and confirm the resulting icon/name is "HelloAbroad", not "HolaRuta" — and re-opening that home-screen icon lands back on the HelloAbroad edition (not plain HolaRuta), confirming the `start_url` fix from Step 3 actually works end-to-end.

- [ ] **Step 7: Commit**

```bash
git add icon-hello-abroad.svg manifest-hello-abroad.webmanifest hello-abroad/index.html boot.js icon-180-hello-abroad.png icon-192-hello-abroad.png icon-512-hello-abroad.png icon-512-maskable-hello-abroad.png
git commit -m "feat(hello-abroad): own installable PWA identity (manifest, icon, redirect URL)"
```

---

### Task 7: Final integration

**Files:** none new — verification only, run after Tasks 1-6 are all merged.

**Interfaces:** none — this task consumes everything produced above and confirms it works together.

- [ ] **Step 1: Full automated suite**

Run: `npm test`
Expected: PASS, 0 failures (existing suite + Task 1's 2 new tests + Task 2's 3 new tests, all green; new `flughafen` category/cards pass the existing data-integrity assertions automatically).

- [ ] **Step 2: Manual Definition-of-Done walkthrough**

Work through every checkbox in `docs/superpowers/specs/2026-07-18-helloabroad-design.md`'s "Definition of Done" section in a real browser, in order — most were already spot-verified per-task above, this is the final combined pass:
1. `?edition=hello-abroad` loads with "HelloAbroad" branding, petrol accent, German UI, no HolaRuta name visible anywhere in the UI chrome.
2. Study a card in each of the 16 allowed categories at least once; confirm the expected answer is checked against English (typos/case-insensitivity work, but no Spanish-specific leniency like accent-dropping incorrectly applies to English answers).
3. Study a `flughafen` card; confirm it behaves identically to any other category (SRS scheduling, speech playback in `en-US`, stats update).
4. Install as PWA (Steps 6 of Task 6) and independently install plain HolaRuta on the same device/browser profile; study a few cards in each; confirm progress does NOT bleed between them (Task 2's fix).
5. Confirm the "Entdecken" tab / search only surface the 6 core features from Task 4, nothing LatAm-specific.
6. Confirm `moarci.github.io/holaRuta/hello-abroad/` (once deployed) redirects correctly.

- [ ] **Step 3: Update spec status**

Edit `docs/superpowers/specs/2026-07-18-helloabroad-design.md`'s `**Status:**` line to record completion, e.g.:

```markdown
**Status:** Implementiert (Tasks 1-7 der Implementierungsplan-Datei
`docs/superpowers/plans/2026-07-18-helloabroad-implementation.md` abgeschlossen,
alle Tests grün, manuelle DoD-Verifikation durchgeführt).
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-07-18-helloabroad-design.md
git commit -m "docs: mark HelloAbroad spec as implemented"
```

---

## Self-Review Notes (from writing this plan)

- **Spec coverage:** every spec section has a task — track/edition/categoryAllowlist config (Task 1), storage-key fix (Task 2), flughafen content (Task 3), feature-gate correction (Task 4), categoryAllowlist enforcement (Task 5), PWA identity (Task 6), DoD/testing (Task 7). The spec's "Nicht im MVP" items (sync, extra a11y, pronunciation tips, travel-context sentences) correctly have NO task — they're intentionally deferred.
- **Type/name consistency check:** `isCategoryAllowed` (Task 5) is the one new function name introduced and reused nowhere else — verified no earlier task defines a conflicting or differently-named helper for the same concept. `TRACK_ID`/`TRACK_NS` (Task 2) are local consts inside `store.js`'s IIFE, no collision with any other module's globals (each module is its own closure).
- **No placeholders:** every step above has runnable code, not descriptions of code. The one spot that isn't a Node-runnable automated test (Tasks 4/5's `app.js`/`ui.js` changes) is explicitly justified (no DOM in the test harness) rather than glossed over, and a concrete manual verification procedure is given instead.
