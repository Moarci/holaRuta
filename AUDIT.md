# HolaRuta — Audit & Review

> Hinweis: Die App hieß zum Audit-Zeitpunkt „SpanischCard" und wurde anschließend zu **HolaRuta**
> („Dein Reise-Spanisch für echte Situationen") umbenannt. Code-Pfade/Fundstellen gelten unverändert;
> der Single-File-Build heißt jetzt `HolaRuta.html`.

**Datum:** 2026-06-10 · **Umfang:** Code, Wörterbasis, UI, UX, A11y, PWA, Security, Performance
**Methodik:** 4 parallele spezialisierte Audit-Agents (statisch) + Live-Browser-Test (Playwright) zur Verifikation.
**Build:** Vanilla-JS PWA, `window.SC`-Module (IIFE), eigene SM-2-SRS, kein Framework, keine Tests.

> **Wichtig:** Mehrere statische Findings wurden im Live-Test **widerlegt** (siehe „Im Live-Test entkräftet"). Das Audit
> unterscheidet bewusst zwischen *real* und *theoretisch*, um keine Scheinprobleme zu „fixen".

---

## Gesamturteil

**Solide, durchdacht und überraschend sauber.** Keine CRITICALs: kein Crash, **kein exploitierbares XSS**, **keine falschen
spanischen Übersetzungen**. Architektur (entkoppelte Module, reine Funktionen, Immutability, Event-Delegation, graceful
degradation) ist für den Projektumfang vorbildlich. Die größten echten Lücken liegen in **Accessibility** (Fokus-Management,
`prefers-reduced-motion`, `aria-live`, Tap-Targets, Kontrast) und einigen **PWA-Detailfehlern** (theme-color-Mismatch,
Icon-`purpose`, Offline-Navigations-Fallback).

| Schweregrad | Anzahl (real) | Status |
|---|---|---|
| CRITICAL | 0 | ✅ |
| HIGH | 8 | ⚠️ beheben |
| MEDIUM | 11 | ℹ️ |
| LOW | 8 | 📝 |

**Live-verifizierte Fakten:** 419 Karten (nicht 437), 0 Duplikate, 0 fehlende Felder, 0 ¿¡-Mismatches, 0 Konsolen-Errors über die
gesamte Session. Persistenz, Flip, Type-Matcher (inkl. Akzent-/Slash-Toleranz), Rating, Fortschritt funktionieren korrekt.

---

## Im Live-Test ENTKRÄFTET (keine Aktion nötig)

Diese statisch gemeldeten Findings wurden durch direkte Browser-Tests als **False Positives** identifiziert:

| Gemeldet | Realität (live verifiziert) |
|---|---|
| Content HIGH: `b18,b19,h01,n04,v08…` brauchen `alt[]` für akzentlose Eingabe | **Falsch.** `matcher.normalize()` entfernt Akzente via NFD. `m.check('necesito un medico', b18)` → `correct: true`. Type-Mode akzeptiert akzentlose Eingaben bereits. |
| Security HIGH (S-1/S-3): `esc()` ohne Quote-Escaping → XSS | **Nicht exploitierbar.** User-Felder landen im **Text-Knoten** (verifiziert: 0 Handler-Elemente, kein Attribut-Breakout). `<`/`>` werden escaped. → auf MEDIUM (Defense-in-Depth) herabgestuft. |
| Code HIGH: Matcher Slash-Split `él/ella`-Problem | **Kein realer Fall.** Sweep über alle Karten mit `/` in `es`: jede Alternative matcht sich selbst, 0 Issues. |
| Code HIGH: SRS Ease-Floor auf GOOD-Pfad nicht angewandt | **Nur theoretisch** (greift nur bei korrumpiertem persistiertem `ease < 1.3`). → LOW. |
| Content: 437 Karten | **419 Karten** (Agents überzählten). Kein Produktfehler, nur Doku. |

---

## HIGH — beheben

### H1 · A11y: Kein `prefers-reduced-motion` *(verifiziert: keine Regel im CSS)*
`styles.css` hat keinen `@media (prefers-reduced-motion)`-Block. Der 0,55 s-3D-Flip (`styles.css:314`) und die `fade`-Animation
bei **jedem** Screen-Wechsel (`styles.css:101`) laufen immer — problematisch für vestibuläre Empfindlichkeit.
**Fix:** Reduced-Motion-Block am CSS-Ende, Flip auf sofortigen State-Swap reduzieren.

### H2 · A11y: Fokus geht bei jedem Render verloren *(verifiziert: `activeElement === BODY` nach Navigation)*
`render()` setzt `root.innerHTML` neu (`app.js:212`); der zuvor fokussierte Knoten wird zerstört, Fokus fällt auf `<body>`.
Tastatur-/Screenreader-Nutzer verlieren bei jeder Aktion ihre Position.
**Fix:** Nach Render Fokus auf logisches Ziel setzen (`.screen[tabindex="-1"].focus()` bzw. Karte/Back-Button).

### H3 · A11y: Keine `aria-live`-Regionen
Type-Ergebnis (✓/✗, `ui.js:211`) und Fortschrittszähler (`ui.js:130`) werden ohne Live-Region gerendert → kein Screenreader-Announcement.
**Fix:** Verdict in `role="status" aria-live="assertive"`, Zähler/Progress als `aria-live="polite"` bzw. `role="progressbar"`.

### H4 · PWA: theme-color-Mismatch *(verifiziert in Dateien)*
`manifest.webmanifest:11` `#6366f1` (Indigo) vs. `index.html:6` `#241510` (Braun). Farbsprung bei Installation.
**Fix:** Manifest auf `#241510` (Markenfarbe) angleichen.

### H5 · PWA: Icon-`purpose: "any maskable"` + nur SVG
`manifest.webmanifest:17` kombiniert `any maskable` in einem Eintrag; SVG ist für maskable auf Android unzuverlässig, keine PNG-Fallbacks.
**Fix:** Einträge trennen (`any` SVG + `maskable` 192/512 PNG).

### H6 · Touch: Mögliches Doppel-Rating (click + touch)
`touchend` ist `{ passive: true }` (`app.js:622`) → kann den synthetischen Klick nicht via `preventDefault` unterdrücken. Ein Swipe,
der über einem Rate-Button endet, kann `rate()` doppelt auslösen (Touch-Handler **und** Folge-Klick).
**Fix:** `touchHandled`-Flag setzen und in `onClick` früh aussteigen (oder Listener bei aktivem Swipe auf non-passive).

### H7 · A11y/Touch: Tap-Targets < 44px *(verifiziert: Level-Chips 34px, Segmente 41px)*
`.lvl`, `.schip`, `.fmtchip`, `.seg`, `.iconbtn--sm`, `.ed-del` unterschreiten 44px (WCAG 2.5.5 / Apple HIG).
**Fix:** `min-height:44px; display:inline-flex; align-items:center` für diese interaktiven Elemente.

### H8 · UX: Swipe-Gesten & Tastenkürzel nicht auffindbar
Reiches Interaktionsmodell (Swipe ←/↑/→, Tasten 1/2/3/Space/p), aber nur eine Hinweiszeile (`ui.js:169`). Rating-Swipes und `p`=Anhören sind unsichtbar.
**Fix:** Onboarding-/Info-Karte oder „?"-Button mit Geste-/Tasten-Legende; Swipe-Richtungen an Rate-Buttons andeuten.

---

## MEDIUM

| # | Bereich | Finding | Fundstelle | Fix |
|---|---|---|---|---|
| M1 | Security | `esc()` escaped kein `"`/`'` (Defense-in-Depth; aktuell nicht exploitierbar) | `ui.js:9` | `"`→`&quot;`, `'`→`&#39;` ergänzen |
| M2 | Security | `c.icon`/`vm.catIcon` ohne `esc()` interpoliert (6 Stellen; heute nur statische Daten) | `ui.js:51,127,343,406,429,493` | `esc()` anwenden / Kommentar |
| M3 | Robustheit | `localStorage`-JSON ohne Strukturvalidierung → Crash bei Korruption | `store.js:13` | Guards: progress=Objekt, userCards=Array gefiltert |
| M4 | PWA | Kein Offline-Navigations-Fallback; Google Fonts nie vom SW gecacht | `service-worker.js:45` | Navigate→`caches.match('./index.html')`; Fonts cachen oder lokal |
| M5 | PWA | Manifest ohne `id` → App-Identität an `start_url` gekoppelt | `manifest.webmanifest` | `id`/`scope` ergänzen |
| M6 | A11y | Kein `:focus-visible`-Stil; `-webkit-tap-highlight` entfernt | `styles.css:41` | globaler `:focus-visible`-Outline |
| M7 | A11y | `.flip` ist `<div data-action>` ohne Rolle/Tabindex/Name | `ui.js:161` | `role="button" tabindex="0" aria-label` |
| M8 | A11y | Kontrast: `--muted #8A7263` (~3,4:1) & `--faint` (~2,6:1) auf Creme < AA für Kleintext | `styles.css:14-15` | `--muted ~#6E5848`, `--faint ~#7A6452` |
| M9 | A11y | Type-Input ohne Label; Editor-Fehler ohne `aria-describedby`/`role=alert` | `ui.js:204,436` | Labels + Fehler-Assoziation |
| M10 | UX | „Nichts fällig" startet stillschweigend freie Übung bzw. fake „Done" bei 0 Karten | `app.js:230-237` | Echte Leerzustände unterscheiden |
| M11 | UX | Karte löschen ohne Bestätigung (irreversibel) | `app.js:408`,`ui.js:495` | Confirm/Undo |

Weitere MEDIUM: voller `innerHTML`-Re-Render je Aktion (Scroll-Reset, Fokus) `app.js:212`; zweite, kühle Status-Palette
(`#22c55e/#6366f1`) bricht warmes Token-System `ui.js:250-295`; AGAIN-Re-Queue geht bei Navigation mitten in der Session verloren `srs.js`/`app.js`.

---

## LOW

- `editorMsg` lebt außerhalb des `state`-Objekts (`app.js:367`) — Inkonsistenz zur Single-Source-of-Truth.
- `build.js`: inlined `</script>` würde Output zerbrechen (latent) `build.js:45`; `[^]*?` statt `[\s\S]*?` `build.js:32`.
- ID-Slug `z85000` bei Wert 85.500 (kosmetisch; Wert selbst korrekt).
- Aussprache-Tipps stilistisch: `diez`→`di-ES`, `vegetariano`→`…RI-a-no` (Diskussionssache, kein Fehler).
- `usercards.validate()` ohne Längenbegrenzung → stiller Quota-Verlust (`usercards.js:28`).
- `share.js` `payload.de/es` ohne Null-Guard → „null" auf Canvas (`share.js:170`).
- ~~Keine CSP-Meta in `index.html` (statische App; Defense-in-Depth).~~ **Erledigt:**
  `index.html` trägt inzwischen eine restriktive CSP-Meta (`script-src 'self'` ohne
  `'unsafe-inline'`; Inline-Boot-Skripte nach `boot.js` ausgelagert, nur der
  Single-File-Build patcht `'unsafe-inline'` zurück – siehe `build.js` + `test/csp.test.js`).
- Keine `app.js`-Modulteilung (628 Z.) — `actions/viewmodels/handlers`-Split empfohlen.

---

## Stärken (bewusst festgehalten)

- **Wörterbasis:** 419 Karten, durchgängig LatAm-korrekt (colectivo, vuelto, plata, chévere, chip, celular), Akzente/`ñ`/`¿¡` sauber,
  konsistentes Aussprache-Schema (yeísmo, seseo), gute `alt[]`/Slash-Mehrfachantworten. **Keine falschen Übersetzungen gefunden.**
- **Matcher:** akzent-, schreib- und satzzeichen-tolerant — live über alle Karten bestätigt.
- **Architektur:** reine, testbare Module (`srs`, `stats`, `matcher`), Immutability, Event-Delegation ohne Listener-Leaks, PWA-offline.
- **UX:** Flip/Type-Modi, Richtungswechsel, SRS-Scheduling, Stats, eigene Karten, Sharepics, TTS (LatAm-Stimmenwahl), Touch + Tastatur.

---

## Priorisierter Fix-Backlog

**Sofort umgesetzt (dieser Durchlauf) — sicher & hoher Wert:**
1. `prefers-reduced-motion`-Block (H1)
2. Fokus-Management nach Render (H2)
3. `aria-live` für Type-Ergebnis + Fortschritt (H3)
4. theme-color angleichen + Manifest `id`/Icon-`purpose` (H4, H5, M5)
5. Tap-Targets ≥44px (H7) + `:focus-visible` (M6)
6. `.flip` Rolle/Tabindex/Name (M7) + dekorative Emojis `aria-hidden` (H-Teil)
7. `esc()` Quote-Escaping (M1) + Icon-Interpolation (M2)
8. `store.js`-Strukturguards (M3)
9. `build.js` `</script>`-Escaping (LOW, latent) + Rebuild
10. SW Offline-Navigations-Fallback + Cache-Bump (M4)
11. Karte-löschen-Bestätigung (M11)
12. Kontrast `--muted`/`--faint` (M8)

**Später (größer / Diskussion):** `app.js`-Modulsplit; inkrementelles Rendering statt Full-`innerHTML`; Status-Palette an Tokens
binden; CSP; Onboarding-Overlay für Gesten (H8); Undo nach Rating; minimale Test-Suite (`srs`/`stats`/`matcher`).

**Bewusst NICHT geändert:** Wörterbasis-Inhalte (keine belegten Fehler; Risiko, korrekte Daten zu verschlechtern).
`alt[]`-Ergänzungen entfallen (Matcher löst Akzente bereits).

---

## Verifikation

- Statisch: `node --check *.js` grün; `node build.js` erzeugt `HolaRuta.html` fehlerfrei.
- Live (Playwright): Home, Flip (Space/Tap), Rating (Taste/Fortschritt), Type-Matcher (Akzent/Slash), Persistenz nach Reload,
  Editor + XSS-Probe, Stats — **0 Konsolen-Errors**.
- Nach den Fixes: Reduced-Motion, Fokus-Ziel, `aria-live`, Tap-Größen und Manifest erneut im Browser gegengeprüft.

---

## Nachtrag 2026-06-14 · Kontrast/A11y (WCAG)

Nach mehreren spezialisierten Parallel-Reviews wurde der Kontrast systematisch nachgezogen:

- **Interaktive Akzentflächen → WCAG AA in beiden Themes.** Solide `--brand`/`--ok`/`--muted`/`--easy`-Flächen
  mit hellem Text (`.cta`, Pre-Trip-Buttons, Hostel-Punktestand, Update-Banner, Schreiben-Button, Badge-Häkchen,
  `.schip.is-active` u. a.) nutzen jetzt das Token `--on-accent` (Light `#fff` ≥ 4.69:1, Dark `#241510` ≥ 5.30:1).
  Zuvor fiel heller Text im Dunkelmodus auf ~3:1 und cremefarbener Text im Hellmodus auf 4.25:1.
- **Hostel-Karten-Gradienten (`hm-card--*`)** vertieft, sodass auch der Kleintext (desc/meta) AA erreicht (4.64–4.68:1).

**Bewusst NICHT geändert (akzeptierte Designentscheidung):** Die **festen Kategorie- und Feature-Gradienten**
(Home-Kacheln, Entdecken-Buttons, Karteikarten-Rückseite, Einkaufszettel-Chips) behalten ihre bunte Erdton-Palette.
Auf den helleren Gradient-Stopps erreicht der hell **über**lagerte Text dort nicht durchgängig den Kleintext-Wert
(4.5:1) — gemessen verfehlen 23/24 Kategorie-Gradienten 4.5:1, 8 davon auch 3:1. Die bunte Palette ist Teil der
Marken-Identität; eine vollflächige Abdunklung würde sie stark verändern.

Betroffen ist konkret **Text, der auf diesen Gradienten liegt** — und das umfasst auch **Kleintext** und teils
**interaktive** Elemente, nicht nur große, dekorative Labels:

- **`.feat__sub`** (Untertitel der Entdecken-Buttons, 0.82rem) — interaktiv, auf den helleren `--to`-Stopps teils < 3:1.
- **Flashcard-Rückseite** (`.face__tip`/`.face__hint`/`.face__cat`) — Hinweis-/Kontext-Kleintext auf dem Kategorie-Gradienten.
- **`.sl-chip.is-active`** (Einkaufszettel-Rubrik) — heller Text auf Rubrik-Gradient.

*Nicht* betroffen: die Home-Kategorie-Kacheln (`.tile`) — deren Text steht auf `--card`, nicht auf dem Gradienten
(der erscheint nur in Icon-Feld/Leiste); `.tile__meta` erreicht ~6.5:1.

Die **soliden Akzent-Bedienelemente** (`.cta`, Pre-Trip-Buttons, Hostel-Punktestand, Update-Banner, `.schip` u. a.)
sind hingegen über das `--on-accent`-Token durchgängig AA (s. o.). Falls künftig strikte AA **auch** auf den
Gradienten gewünscht ist: Optionen sind Palette-Abdunklung der `--to`-Stopps, ein Text-Scrim hinter dem
Kleintext, oder large-text-only (3:1) für die 8 schwächsten Gradienten. Bis dahin **bewusst akzeptiert**.
