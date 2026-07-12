# Landing Page "Mehr als Sprache"-Hooks: echte Karten Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 6 hand-written placeholder sentences in the landing page's `#why` "Kostprobe" hooks with real, shipped flashcards rendered as true flip cards (front/back, context panel, speak button) — visually and behaviorally identical to the app's real learning card.

**Architecture:** Extract the card-markup-building logic that already exists for the "Mehr an Bord" module strip (`landing.html`'s `render(mod)` function) into a small reusable top-level function `buildFlipCard(container, cardData, opts)`. Reuse it from both the existing module-strip code (no behavior change) and a rewritten version of the `#why`-hooks toggle script. Feed it a new hardcoded `WHY_CARDS` data object containing 6 real cards sourced from `data.js`/`contextdata.js`.

**Tech Stack:** Vanilla JS (no framework), inline `<script>` in `landing.html`, existing `styles.css`/`landing.css`. No build tooling except the existing `node scripts/build-landing-preview.mjs` static-HTML generator.

## Global Constraints

- Only `landing.html` and `landing.css` change (plus the generated `landing-preview.html`, regenerated not hand-edited). No changes to `ui.js`, `app.js`, `data.js`, `contextdata.js`, or any other real-app file.
- The existing "Mehr an Bord" module-chip widget's data, visible behavior, and output DOM must stay byte-for-byte equivalent after the refactor (pure extraction, not a rewrite).
- No new automated test setup is introduced (out of scope per the approved spec — the landing page has no existing test harness). Every task ends with an explicit manual browser-verification step instead of an automated test run.
- All 6 real card contents (question DE/EN, Spanish, pronunciation tip, situation, note) must be copied verbatim from `data.js`/`contextdata.js` — do not paraphrase.
- Reuse existing i18n keys (`card.hint`, `card.speakLabel`, `a11y.card`, `ctx.show`, `ctx.title`, `ctx.situation`, `ctx.note`, `card.lvl`, `card.lvl2`) already defined in `I18N.de`/`I18N.en`/`I18N.es` — do not add new ones for these.
- After all HTML/JS/CSS changes are done, regenerate `landing-preview.html` via `node scripts/build-landing-preview.mjs` as the final step.

---

## File Map

- **Modify `landing.html`:**
  - `moreModules` IIFE (currently lines 1433–1765): refactor `render(mod)` to call a new shared `buildFlipCard` function instead of inline markup building.
  - New top-level function `buildFlipCard(container, c, opts)`, placed immediately before the `moreModules` IIFE (~line 1432).
  - New top-level `var WHY_CARDS = {...}` object with 6 entries, placed immediately after `buildFlipCard`.
  - `#why` section markup (currently lines 720–844): each of the 6 `.lp-hook__sample` blocks (with the old `<p class="lp-hook__es">`/`<p class="lp-hook__gloss">`) replaced by an empty mount `<div class="lp-hook__sample lp-hook__cardwrap" hidden></div>`.
  - Hooks IIFE (currently lines 1767–1804): rewritten to build/cache a real flip card into the mount on first "Kostprobe" open, and rebuild it on language change.
  - `I18N.de`/`I18N.en`/`I18N.es` objects: remove the now-unused `why.*.es`, `why.*.m`, and `why.say` keys.
- **Modify `landing.css`:** replace the now-unused `.lp-hook__es*`/`.lp-hook__say*`/`.lp-hook__gloss` rules with compact flip-card sizing rules scoped to `.lp-hook`.
- **Regenerate `landing-preview.html`** via the existing build script (not hand-edited).

---

### Task 1: Extract shared `buildFlipCard` function (pure refactor, no behavior change)

**Files:**
- Modify: `landing.html:1611-1726` (the `render(mod)` function inside the `moreModules` IIFE)

**Interfaces:**
- Produces: `function buildFlipCard(container, c, opts)` — top-level function. `container` is a DOM element to fill (its `innerHTML` is replaced). `c` is a card object `{ de, en, es, tip, lvl, sit:{de,en}, note:{de,en} }`. `opts` is `{ lang: "de"|"en", catLabel: string, t: function(key), accent: string, speak: function(text) }`. No return value — it mutates `container` in place and wires all click/keydown listeners.
- Consumes: nothing from other tasks (this is the foundational task).

- [ ] **Step 1: Read the current `render(mod)` implementation to confirm line numbers before editing**

Open `landing.html` and confirm lines 1611–1726 still match:
```js
function render(mod) {
  var m = DATA[mod];
  if (!m) return;
  var l = lang();
  var cat = l === "en" ? m.cat[1] : m.cat[0];
  var hint = t("card.hint"), speakLbl = t("card.speakLabel"), flipLbl = t("a11y.card");
  var ctxLbl = t("ctx.show"), ctxTitle = t("ctx.title"), sitLbl = t("ctx.situation"), noteLbl = t("ctx.note");
  var fromCol = "color-mix(in srgb, " + currentAccent + " 84%, #241510)";
  strip.innerHTML = "";
  dotsWrap.innerHTML = "";
  m.ex.forEach(function (c, i) {
    ...
```
If line numbers have drifted, locate the function by searching for `function render(mod) {` and adjust the edit targets in the following steps accordingly — the surrounding code (not the line numbers) is what matters.

- [ ] **Step 2: Insert the new `buildFlipCard` function immediately before the `moreModules` IIFE**

Find this line (currently line 1432):
```js
    // ── „Mehr an Bord": Modul antippen -> Beispiele aufklappen & durchwischen ──
    (function moreModules() {
```

Insert the following new top-level function immediately **before** that comment/IIFE:

```js
    // ── Gemeinsame Karten-Bauweise: echte Flip-Karte (.flip/.face/.context-panel
    // aus styles.css) — genutzt von "Mehr an Bord" UND den "Mehr als Sprache"-
    // Kostproben, damit beide Widgets exakt dieselbe App-Karten-Optik zeigen.
    function buildFlipCard(container, c, opts) {
      var l = opts.lang, t = opts.t;
      var hint = t("card.hint"), speakLbl = t("card.speakLabel"), flipLbl = t("a11y.card");
      var ctxLbl = t("ctx.show"), ctxTitle = t("ctx.title"), sitLbl = t("ctx.situation"), noteLbl = t("ctx.note");
      var fromCol = "color-mix(in srgb, " + opts.accent + " 84%, #241510)";
      var lvl = t(c.lvl === 2 ? "card.lvl2" : "card.lvl");
      var front = l === "en" ? c.en : c.de;
      container.innerHTML =
        '<div class="flip" role="button" tabindex="0" aria-pressed="false">' +
          '<div class="flip__inner">' +
            '<div class="face face--front">' +
              '<span class="face__cat"></span>' +
              '<span class="lvl-badge"></span>' +
              '<div class="face__word"></div>' +
              '<span class="face__hint"></span>' +
            '</div>' +
            '<div class="face face--back">' +
              '<span class="face__cat"></span>' +
              '<span class="lvl-badge lvl-badge--on"></span>' +
              '<button class="cardbtn cardbtn--ctx is-on" type="button" aria-expanded="false">🧭</button>' +
              '<button class="cardbtn cardbtn--speak is-on" type="button">🔊</button>' +
              '<div class="face__word" lang="es"></div>' +
              '<div class="face__tip"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="context-panel lp-ctxpanel" hidden>' +
          '<h3 class="context-panel__title"></h3>' +
          '<div class="context-panel__line">' +
            '<p class="context-panel__es" lang="es"></p>' +
            '<p class="context-panel__de"></p>' +
          '</div>' +
          '<div class="context-panel__block">' +
            '<div class="context-panel__label context-panel__label--sit"></div>' +
            '<p class="context-panel__text context-panel__text--sit"></p>' +
          '</div>' +
          '<div class="context-panel__block">' +
            '<div class="context-panel__label context-panel__label--note"></div>' +
            '<p class="context-panel__text context-panel__text--note"></p>' +
          '</div>' +
        '</div>';
      var front_ = container.querySelector(".face--front");
      front_.querySelector(".face__cat").textContent = opts.catLabel;
      front_.querySelector(".lvl-badge").textContent = lvl;
      front_.querySelector(".face__word").textContent = front;
      front_.querySelector(".face__hint").textContent = hint;
      var back_ = container.querySelector(".face--back");
      back_.style.setProperty("--from", fromCol);
      back_.querySelector(".face__cat").textContent = opts.catLabel;
      back_.querySelector(".lvl-badge").textContent = lvl;
      back_.querySelector(".face__word").textContent = c.es;
      back_.querySelector(".face__tip").textContent = "🗣️ " + c.tip;
      var spk = back_.querySelector(".cardbtn--speak");
      spk.setAttribute("aria-label", speakLbl);
      spk.setAttribute("data-spk", c.es);
      spk.addEventListener("click", function (e) { e.stopPropagation(); opts.speak(c.es); });

      var panel = container.querySelector(".lp-ctxpanel");
      panel.querySelector(".context-panel__title").textContent = ctxTitle;
      panel.querySelector(".context-panel__es").textContent = c.es;
      panel.querySelector(".context-panel__de").textContent = front;
      panel.querySelector(".context-panel__label--sit").textContent = sitLbl;
      panel.querySelector(".context-panel__text--sit").textContent = c.sit ? c.sit[l] : "";
      panel.querySelector(".context-panel__label--note").textContent = noteLbl;
      panel.querySelector(".context-panel__text--note").textContent = c.note ? c.note[l] : "";
      var ctxBtn = back_.querySelector(".cardbtn--ctx");
      ctxBtn.setAttribute("aria-label", ctxLbl);
      ctxBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var willOpen = panel.hasAttribute("hidden");
        if (willOpen) panel.removeAttribute("hidden"); else panel.setAttribute("hidden", "");
        ctxBtn.classList.toggle("is-open", willOpen);
        ctxBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
      });
      function closeCtx() {
        panel.setAttribute("hidden", "");
        ctxBtn.classList.remove("is-open");
        ctxBtn.setAttribute("aria-expanded", "false");
      }

      var flip = container.querySelector(".flip");
      flip.setAttribute("aria-label", flipLbl);
      function doFlip() {
        var on = flip.classList.toggle("is-flipped");
        flip.setAttribute("aria-pressed", on ? "true" : "false");
        if (!on) closeCtx();
      }
      flip.addEventListener("click", function (e) { if (e.target.closest(".cardbtn")) return; doFlip(); });
      flip.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); doFlip(); }
      });
    }

```

- [ ] **Step 3: Replace the body of `render(mod)`'s `forEach` to call `buildFlipCard` instead of inline markup**

Replace the entire `m.ex.forEach(function (c, i) { ... });` block (currently lines 1623–1723, everything between `strip.innerHTML = ""; dotsWrap.innerHTML = "";` and `strip.scrollLeft = 0;`) with:

```js
        m.ex.forEach(function (c, i) {
          var slide = document.createElement("div");
          slide.className = "lp-mdslide";
          buildFlipCard(slide, c, { lang: l, catLabel: cat, t: t, accent: currentAccent, speak: speak });
          strip.appendChild(slide);

          var dot = document.createElement("button");
          dot.type = "button"; dot.className = "lp-dot" + (i === 0 ? " is-active" : "");
          dot.setAttribute("aria-label", t("more.pick") + " " + (i + 1));
          dot.addEventListener("click", function () {
            strip.scrollTo({ left: strip.clientWidth * i, behavior: reduce ? "auto" : "smooth" });
          });
          dotsWrap.appendChild(dot);
        });
```

The rest of `render(mod)` (the `var hint = ...` / `var ctxLbl = ...` lines above the `forEach`, and `strip.scrollLeft = 0; syncDots();` below it) stays unchanged — those still compute `cat` and clear `strip`/`dotsWrap` before the loop runs, exactly as before. Note that `hint`, `speakLbl`, `flipLbl`, `ctxLbl`, `ctxTitle`, `sitLbl`, `noteLbl`, `fromCol` are no longer used directly in `render(mod)` (they now live inside `buildFlipCard`) — it's fine to leave the now-unused `var` lines in place or remove them; removing them is cleaner:

Replace:
```js
        var l = lang();
        var cat = l === "en" ? m.cat[1] : m.cat[0];
        var hint = t("card.hint"), speakLbl = t("card.speakLabel"), flipLbl = t("a11y.card");
        var ctxLbl = t("ctx.show"), ctxTitle = t("ctx.title"), sitLbl = t("ctx.situation"), noteLbl = t("ctx.note");
        // Rückseite leicht abgedunkelt, damit die cremefarbene Schrift auf jeder
        // Modulfarbe (auch Amber) sicher lesbar bleibt.
        var fromCol = "color-mix(in srgb, " + currentAccent + " 84%, #241510)";
        strip.innerHTML = "";
        dotsWrap.innerHTML = "";
```
with:
```js
        var l = lang();
        var cat = l === "en" ? m.cat[1] : m.cat[0];
        strip.innerHTML = "";
        dotsWrap.innerHTML = "";
```

- [ ] **Step 4: Manual verification — "Mehr an Bord" widget unchanged**

Open `landing.html` directly in a browser (double-click the file, or serve the folder with any static server). Scroll to the "Mehr an Bord" module strip, click any chip (e.g. "Supervivencia"), and confirm:
- Three example cards appear in a swipeable strip, front side showing the German question.
- Clicking a card flips it to show the Spanish answer + pronunciation tip + 🔊/🧭 buttons.
- 🔊 speaks the Spanish sentence (if the browser supports speech synthesis).
- 🧭 opens the context panel showing Situation/Reisetipp text.
- Switching the page language (DE/EN buttons) and reopening the same chip shows translated content.

This must behave identically to how it did before this task — if anything differs, fix `buildFlipCard`/`render(mod)` before proceeding.

- [ ] **Step 5: Commit**

```bash
git add landing.html
git commit -m "refactor(landing): extract buildFlipCard from render(mod)"
```

---

### Task 2: Add `WHY_CARDS` data object with the 6 real cards

**Files:**
- Modify: `landing.html` (insert immediately after the `buildFlipCard` function added in Task 1, before the `moreModules` IIFE)

**Interfaces:**
- Consumes: none.
- Produces: top-level `var WHY_CARDS = { historia, culturas, respeto, salud, musica, conexion }`, each entry shaped `{ cat: [de, en], lvl: number, de: string, en: string, es: string, tip: string, sit: { de, en }, note: { de, en } }` — the same shape `buildFlipCard`'s `c` parameter expects (Task 1), plus a `cat` tuple consumed the same way `render(mod)` consumes `m.cat`. Keyed by the hooks' existing `data-hook` attribute values (`historia`, `culturas`, `respeto`, `salud`, `musica`, `conexion`) so Task 4 can look them up directly.

- [ ] **Step 1: Insert `WHY_CARDS` after `buildFlipCard`**

Immediately after the closing `}` of `buildFlipCard` (added in Task 1, Step 2) and before the `// ── „Mehr an Bord"...` comment, insert:

```js
    // Echte, ausgelieferte Karten aus dem HolaRuta-Kartendeck (data.js/
    // contextdata.js) — eine pro "Mehr als Sprache"-Kachel. Keine erfundenen
    // Sätze: Karten-IDs zur Nachvollziehbarkeit in Klammern.
    var WHY_CARDS = {
      historia: { cat: ["PERÚ", "PERU"], lvl: 2, // pe30
        de: "Diese Mauern sind noch von den Inka.", en: "These walls are still from the Incas.",
        es: "Estas paredes todavía son de los incas.",
        tip: "fugenlose Steinmauern in Cusco",
        sit: { de: "Beim Bummel durch Cuscos Altstadtgassen.", en: "Wandering Cusco's old-town lanes." },
        note: { de: "Berühmt: der zwölfeckige Stein in der Calle Hatun Rumiyoc.", en: "Famous: the twelve-angled stone on Calle Hatun Rumiyoc." } },
      culturas: { cat: ["CHILE", "CHILE"], lvl: 2, // cl07
        de: "Machen wir das sofort, ja?", en: "Let's do it right away, yeah?",
        es: "Hagámoslo al tiro, ¿ya?",
        tip: "„al tiro“ = sofort, auf der Stelle",
        sit: { de: "Beim Planen mit der Gruppe oder dem Guide.", en: "When planning with the group or guide." },
        note: { de: "„al tiro“ = sofort; „¿ya?“ ist ein freundliches „ok?“.", en: "'al tiro' = right away; '¿ya?' at the end is a friendly 'ok?'." } },
      respeto: { cat: ["COLOMBIA", "COLOMBIA"], lvl: 2, // md18
        de: "Bringen Sie mir bitte einen Tinto?", en: "Could you bring me a tinto, please?",
        es: "¿Me regala un tinto, por favor?",
        tip: "regalar = in Kolumbien höflich „geben/bringen“; tinto = kleiner schwarzer Kaffee (NICHT Rotwein!)",
        sit: { de: "Am Café oder beim Straßenverkäufer für den Koffein-Kick.", en: "At a café or from a street vendor for a caffeine kick." },
        note: { de: "regalar heißt hier höflich „bringen/geben“; Achtung: tinto ist kleiner schwarzer Kaffee, NICHT Rotwein.", en: "regalar here is a polite \"to bring/give\"; and note: tinto is a small black coffee, NOT red wine." } },
      salud: { cat: ["SALUD", "HEALTH"], lvl: 2, // fa14
        de: "Ich habe Höhenkrankheit.", en: "I have altitude sickness.",
        es: "Tengo soroche.",
        tip: "TEN-go so-RO-tche",
        sit: { de: "In den Anden.", en: "In the Andes." },
        note: { de: "„Soroche“ und „mal de altura“ meinen dasselbe.", en: "'Soroche' and 'mal de altura' both mean altitude sickness." } },
      musica: { cat: ["NOCHE", "NIGHTLIFE"], lvl: 2, // nl17
        de: "Spielen sie Salsa oder Reggaetón?", en: "Do they play salsa or reggaeton?",
        es: "¿Ponen salsa o reggaetón?",
        tip: "PO-nen SAL-sa o re-ge-TON",
        sit: { de: "Beim DJ nachfragen.", en: "Asking the DJ." },
        note: { de: "„Poner“ heißt hier Musik auflegen.", en: "'Poner' here means to play music." } },
      conexion: { cat: ["SOCIAL", "SOCIAL"], lvl: 2, // social13
        de: "Sollen wir Karten spielen?", en: "Shall we play cards?",
        es: "¿Jugamos a las cartas?",
        tip: "chu-GA-mos a las KAR-tas",
        sit: { de: "Beim Warten am Terminal oder an einem langen Reisetag.", en: "While waiting at the terminal or on a long travel day, to pass the time." },
        note: { de: "jugar a las cartas = Karten spielen; una carta = eine Spielkarte.", en: "jugar a las cartas = to play cards. A playing card is una carta, the deck la baraja." } }
    };

```

- [ ] **Step 2: Verify it parses**

Run a quick Node syntax check on the inline script by extracting it, or simply open `landing.html` in a browser and check the DevTools console for syntax errors (there should be none — the page should still load and the "Mehr an Bord" widget from Task 1 should still work). If you see a `SyntaxError`, check for unescaped straight double quotes inside the `tip`/`note` strings — the German quote marks used (`„`/`“`) are distinct Unicode characters from the ASCII `"` string delimiter, but the `respeto` note contains one literal English straight-quoted phrase (`\"to bring/give\"`) which is intentionally escaped with `\"` — keep that escaping.

- [ ] **Step 3: Commit**

```bash
git add landing.html
git commit -m "feat(landing): add WHY_CARDS real card data for the why-hooks"
```

---

### Task 3: Replace the 6 hook HTML sample blocks with mount points

**Files:**
- Modify: `landing.html:738-744, 757-763, 776-782, 795-801, 814-820, 833-839` (the six `.lp-hook__sample` blocks inside the `#why` section)

**Interfaces:**
- Consumes: none directly (Task 4 will query these mount points at runtime by class name).
- Produces: six `<div class="lp-hook__sample lp-hook__cardwrap" hidden></div>` elements, one per `.lp-hook article`, each a sibling of the existing `.lp-hook__peek` button within `.lp-hook__body`.

- [ ] **Step 1: Replace the "historia" hook's sample block**

Find (currently lines 738–744):
```html
              <div class="lp-hook__sample" hidden>
                <p class="lp-hook__es">
                  <button class="lp-hook__say" type="button" data-i18n-aria="why.say" aria-label="Satz vorlesen">🔊</button>
                  <span class="lp-hook__es-txt" data-i18n="why.historia.es">Los incas levantaron esto sin rueda ni hierro.</span>
                </p>
                <p class="lp-hook__gloss" data-i18n="why.historia.m">Ein Fakt, der jede Ruine zum Sprechen bringt.</p>
              </div>
```
Replace with:
```html
              <div class="lp-hook__sample lp-hook__cardwrap" hidden></div>
```

- [ ] **Step 2: Replace the "culturas" hook's sample block**

Find (currently lines 757–763):
```html
              <div class="lp-hook__sample" hidden>
                <p class="lp-hook__es">
                  <button class="lp-hook__say" type="button" data-i18n-aria="why.say" aria-label="Satz vorlesen">🔊</button>
                  <span class="lp-hook__es-txt" data-i18n="why.culturas.es">En Chile, «al tiro» quiere decir ahora mismo.</span>
                </p>
                <p class="lp-hook__gloss" data-i18n="why.culturas.m">Ein Wort — und du klingst wie von hier.</p>
              </div>
```
Replace with:
```html
              <div class="lp-hook__sample lp-hook__cardwrap" hidden></div>
```

- [ ] **Step 3: Replace the "respeto" hook's sample block**

Find (currently lines 776–782):
```html
              <div class="lp-hook__sample" hidden>
                <p class="lp-hook__es">
                  <button class="lp-hook__say" type="button" data-i18n-aria="why.say" aria-label="Satz vorlesen">🔊</button>
                  <span class="lp-hook__es-txt" data-i18n="why.respeto.es">¿Me regala la cuenta, porfa?</span>
                </p>
                <p class="lp-hook__gloss" data-i18n="why.respeto.m">So bittest du höflich — und wirst zum gern gesehenen Gast.</p>
              </div>
```
Replace with:
```html
              <div class="lp-hook__sample lp-hook__cardwrap" hidden></div>
```

- [ ] **Step 4: Replace the "salud" hook's sample block**

Find (currently lines 795–801):
```html
              <div class="lp-hook__sample" hidden>
                <p class="lp-hook__es">
                  <button class="lp-hook__say" type="button" data-i18n-aria="why.say" aria-label="Satz vorlesen">🔊</button>
                  <span class="lp-hook__es-txt" data-i18n="why.salud.es">Me pegó el soroche, el mal de altura.</span>
                </p>
                <p class="lp-hook__gloss" data-i18n="why.salud.m">Der Satz, der auf 4000 Metern zählt.</p>
              </div>
```
Replace with:
```html
              <div class="lp-hook__sample lp-hook__cardwrap" hidden></div>
```

- [ ] **Step 5: Replace the "musica" hook's sample block**

Find (currently lines 814–820):
```html
              <div class="lp-hook__sample" hidden>
                <p class="lp-hook__es">
                  <button class="lp-hook__say" type="button" data-i18n-aria="why.say" aria-label="Satz vorlesen">🔊</button>
                  <span class="lp-hook__es-txt" data-i18n="why.musica.es">Esta cumbia se la sabe todo el continente.</span>
                </p>
                <p class="lp-hook__gloss" data-i18n="why.musica.m">Kenn den Refrain — und du gehörst dazu.</p>
              </div>
```
Replace with:
```html
              <div class="lp-hook__sample lp-hook__cardwrap" hidden></div>
```

- [ ] **Step 6: Replace the "conexion" hook's sample block**

Find (currently lines 833–839):
```html
              <div class="lp-hook__sample" hidden>
                <p class="lp-hook__es">
                  <button class="lp-hook__say" type="button" data-i18n-aria="why.say" aria-label="Satz vorlesen">🔊</button>
                  <span class="lp-hook__es-txt" data-i18n="why.conexion.es">¿Jugamos una? La primera la pago yo.</span>
                </p>
                <p class="lp-hook__gloss" data-i18n="why.conexion.m">Ein Satz — und aus Fremden werden Freunde.</p>
              </div>
```
Replace with:
```html
              <div class="lp-hook__sample lp-hook__cardwrap" hidden></div>
```

- [ ] **Step 7: Manual verification — mounts present, no console errors**

Open `landing.html` in a browser, open DevTools console (expect no new errors — clicking "Kostprobe" will do nothing yet since Task 4 hasn't rewired the JS), and confirm via the Elements panel that each of the 6 `.lp-hook` articles now contains a `<div class="lp-hook__sample lp-hook__cardwrap" hidden></div>` with no children.

- [ ] **Step 8: Commit**

```bash
git add landing.html
git commit -m "refactor(landing): replace why-hook sample text with card mount points"
```

---

### Task 4: Rewrite the hooks IIFE to render real flip cards

**Files:**
- Modify: `landing.html:1767-1804` (the `// ── „Mehr als Sprache": Kostprobe-Aufklapper + Vorlesen ──` IIFE)

**Interfaces:**
- Consumes: `buildFlipCard(container, c, opts)` (Task 1), `WHY_CARDS` (Task 2), the `.lp-hook__cardwrap` mount points (Task 3), the global `I18N` object and `.lp-langbtn` elements (pre-existing).
- Produces: working "Kostprobe" toggle + real flip/context/speak interaction for all 6 hooks.

- [ ] **Step 1: Replace the entire hooks IIFE**

Find (currently lines 1767–1804):
```js
    // ── „Mehr als Sprache": Kostprobe-Aufklapper + Vorlesen ──
    // Jeder Hook lässt sich aufklappen und zeigt einen echten spanischen Reise-
    // Satz. Der 🔊-Knopf liest ihn in lateinamerikanischem Spanisch vor.
    (function () {
      var speaking = null;
      function speakES(text, btn) {
        try {
          if (!("speechSynthesis" in window)) return;
          var u = new SpeechSynthesisUtterance(text);
          u.lang = "es-419"; u.rate = 0.95;
          speechSynthesis.cancel();
          if (speaking) speaking.classList.remove("is-speaking");
          btn.classList.add("is-speaking"); speaking = btn;
          u.onend = u.onerror = function () {
            btn.classList.remove("is-speaking");
            if (speaking === btn) speaking = null;
          };
          speechSynthesis.speak(u);
        } catch (e) {}
      }
      document.querySelectorAll(".lp-hook").forEach(function (hook) {
        var peek = hook.querySelector(".lp-hook__peek");
        var sample = hook.querySelector(".lp-hook__sample");
        if (!peek || !sample) return;
        peek.addEventListener("click", function () {
          var open = peek.getAttribute("aria-expanded") === "true";
          peek.setAttribute("aria-expanded", open ? "false" : "true");
          if (open) { sample.setAttribute("hidden", ""); try { speechSynthesis.cancel(); } catch (e) {} }
          else sample.removeAttribute("hidden");
        });
        var say = hook.querySelector(".lp-hook__say");
        var txt = hook.querySelector(".lp-hook__es-txt");
        if (say && txt) say.addEventListener("click", function (e) {
          e.stopPropagation();
          speakES(txt.textContent, say);
        });
      });
    })();
```

Replace with:
```js
    // ── „Mehr als Sprache": Kostprobe-Aufklapper zeigt eine echte Flip-Karte ──
    // Jeder Hook lässt sich aufklappen und zeigt eine echte Karte aus dem
    // HolaRuta-Kartendeck (WHY_CARDS): Frage vorne, beim Umdrehen Spanisch +
    // Aussprache, 🔊 liest vor, 🧭 öffnet den Reise-Kontext — via buildFlipCard
    // dieselbe App-Karten-Optik wie bei "Mehr an Bord".
    (function () {
      function lang() { return document.documentElement.getAttribute("data-lang") === "en" ? "en" : "de"; }
      function t(key) { var d = I18N[lang()] || {}; return d[key] || key; }
      function speak(text) {
        try {
          if (!("speechSynthesis" in window)) return;
          var u = new SpeechSynthesisUtterance(text);
          u.lang = "es-419"; u.rate = 0.95;
          speechSynthesis.cancel(); speechSynthesis.speak(u);
        } catch (e) {}
      }
      document.querySelectorAll(".lp-hook").forEach(function (hook) {
        var key = hook.getAttribute("data-hook");
        var data = WHY_CARDS[key];
        var peek = hook.querySelector(".lp-hook__peek");
        var mount = hook.querySelector(".lp-hook__cardwrap");
        if (!peek || !mount || !data) return;
        var accentColor = (hook.style.getPropertyValue("--accent") || "").trim() || "var(--brand)";
        var built = false;
        function build() {
          var l = lang();
          var catLabel = l === "en" ? data.cat[1] : data.cat[0];
          buildFlipCard(mount, data, { lang: l, catLabel: catLabel, t: t, accent: accentColor, speak: speak });
          built = true;
        }
        peek.addEventListener("click", function () {
          var open = peek.getAttribute("aria-expanded") === "true";
          peek.setAttribute("aria-expanded", open ? "false" : "true");
          if (open) { mount.setAttribute("hidden", ""); try { speechSynthesis.cancel(); } catch (e) {} }
          else { if (!built) build(); mount.removeAttribute("hidden"); }
        });
        document.querySelectorAll(".lp-langbtn").forEach(function (b) {
          b.addEventListener("click", function () { if (built) build(); });
        });
      });
    })();
```

- [ ] **Step 2: Manual verification — all 6 hooks show real flip cards**

Open `landing.html` in a browser, scroll to the "Mehr als Sprache" section, and for **each of the 6 hooks** (Historia, Países & culturas, Buen viajero, Salud, Música, Conexión):
1. Click "Kostprobe" → a real flip card appears (front: German question, category badge, "Zum Umdrehen tippen" hint).
2. Click the card → it flips, showing the Spanish sentence, pronunciation tip, and 🔊/🧭 buttons.
3. Click 🧭 → the context panel opens below, showing "Situation" and "Reisetipp" text matching the table in the spec (e.g. Salud shows "In den Anden." / "„Soroche" und „mal de altura" meinen dasselbe.").
4. Click 🔊 → the Spanish sentence is read aloud (if the browser supports speech synthesis).
5. Click "Kostprobe" again → the card collapses; reopening shows the same card without rebuilding (still flipped state resets is acceptable — verify no console error).
6. Switch the page language to EN via the language switcher, reopen an already-opened hook → front/back/context text is now in English (e.g. Salud front: "I have altitude sickness.").
7. Resize the browser to a narrow (mobile) width (~375px) → the card fits inside its hook tile without horizontal overflow.

Check the DevTools console throughout — there must be no JS errors.

- [ ] **Step 3: Commit**

```bash
git add landing.html
git commit -m "feat(landing): render real flip cards in the why-hooks Kostprobe"
```

---

### Task 5: CSS — compact card sizing for `.lp-hook`, remove obsolete styles

**Files:**
- Modify: `landing.css:674-724` (the "Kostprobe" comment block and the `.lp-hook__es*`/`.lp-hook__say*`/`.lp-hook__gloss` rules, plus the reduced-motion block)

**Interfaces:**
- Consumes: the `.lp-hook`, `.lp-hook__cardwrap`, `.flip`, `.face`, `.lp-ctxpanel`, `.context-panel__title` class names used by Tasks 3–4 and the pre-existing `styles.css` card rules.
- Produces: no new class names consumed elsewhere — pure visual styling.

- [ ] **Step 1: Replace the "Kostprobe" CSS block**

Find (currently lines 674–724):
```css
/* „Kostprobe": jeder Hook lässt sich aufklappen und zeigt einen echten Reise-
   Satz auf Spanisch + Mini-Kontext. Macht die Behauptung der Kachel greifbar –
   du liest sofort, was das Modul kann, statt es nur versprochen zu bekommen.
   Der Satz erbt die Akzentfarbe der Kachel (--accent inline). */
.lp-hook__peek {
  display: inline-flex; align-items: center; gap: 7px; margin-top: 12px;
  appearance: none; -webkit-appearance: none; font: inherit; cursor: pointer;
  background: transparent; border: 0; padding: 4px 2px;
  font-size: 0.78rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
  color: color-mix(in srgb, var(--accent, var(--brand)) 74%, var(--ink));
  transition: color 0.16s ease, gap 0.16s ease;
}
.lp-hook__peek:hover { gap: 10px; color: color-mix(in srgb, var(--accent, var(--brand)) 92%, var(--ink)); }
.lp-hook__peek-chev {
  width: 7px; height: 7px; flex: none;
  border-right: 2px solid currentColor; border-bottom: 2px solid currentColor;
  transform: translateY(-1px) rotate(45deg);
  transition: transform 0.22s ease;
}
.lp-hook__peek[aria-expanded="true"] .lp-hook__peek-chev { transform: translateY(1px) rotate(-135deg); }
.lp-hook__sample {
  margin-top: 10px; padding: 13px 15px; border-radius: var(--r-md);
  background: color-mix(in srgb, var(--accent, var(--brand)) 9%, var(--card));
  border: 1.5px solid color-mix(in srgb, var(--accent, var(--brand)) 26%, var(--line));
  border-left: 3px solid var(--accent, var(--brand));
  animation: lp-more-in 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}
.lp-hook__es {
  display: flex; align-items: baseline; gap: 9px; margin: 0 0 5px;
  font-family: var(--font-display); font-weight: 700;
  font-size: 1.08rem; line-height: 1.3; color: var(--ink);
}
.lp-hook__es-txt { min-width: 0; }
.lp-hook__say {
  flex: none; appearance: none; -webkit-appearance: none; cursor: pointer;
  width: 30px; height: 30px; border-radius: 9px; font-size: 0.95rem; line-height: 1;
  display: inline-flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--accent, var(--brand)) 16%, var(--card));
  border: 1.5px solid color-mix(in srgb, var(--accent, var(--brand)) 34%, transparent);
  align-self: center; transition: transform 0.14s ease, background 0.14s ease;
}
.lp-hook__say:hover { transform: scale(1.08); background: color-mix(in srgb, var(--accent, var(--brand)) 26%, var(--card)); }
.lp-hook__say:active { transform: scale(0.94); }
.lp-hook__say.is-speaking { animation: lp-pulse 1.1s ease-out infinite; }
.lp-hook__gloss { margin: 0; font-size: 0.9rem; line-height: 1.45; color: var(--muted); font-style: italic; }
@media (prefers-reduced-motion: reduce) {
  .lp-hook, .lp-hook__ico, .lp-hook__peek, .lp-hook__peek-chev, .lp-hook__say { transition: none; }
  .lp-hook__sample { animation: none; }
  .lp-hook__say.is-speaking { animation: none; }
}
@media (hover: none) { .lp-hook:hover { transform: none; } }
```

Replace with:
```css
/* „Kostprobe": jeder Hook lässt sich aufklappen und zeigt eine echte Flip-
   Karte aus dem Kartendeck (WHY_CARDS, siehe landing.html). Macht die
   Behauptung der Kachel greifbar – du siehst sofort eine echte App-Karte,
   statt es nur versprochen zu bekommen. */
.lp-hook__peek {
  display: inline-flex; align-items: center; gap: 7px; margin-top: 12px;
  appearance: none; -webkit-appearance: none; font: inherit; cursor: pointer;
  background: transparent; border: 0; padding: 4px 2px;
  font-size: 0.78rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
  color: color-mix(in srgb, var(--accent, var(--brand)) 74%, var(--ink));
  transition: color 0.16s ease, gap 0.16s ease;
}
.lp-hook__peek:hover { gap: 10px; color: color-mix(in srgb, var(--accent, var(--brand)) 92%, var(--ink)); }
.lp-hook__peek-chev {
  width: 7px; height: 7px; flex: none;
  border-right: 2px solid currentColor; border-bottom: 2px solid currentColor;
  transform: translateY(-1px) rotate(45deg);
  transition: transform 0.22s ease;
}
.lp-hook__peek[aria-expanded="true"] .lp-hook__peek-chev { transform: translateY(1px) rotate(-135deg); }
.lp-hook__sample {
  margin-top: 12px;
  animation: lp-more-in 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}
/* Echte App-Karteikarte (.flip/.face/.cardbtn aus styles.css), kompakter als
   im Hero-Karussell – passt in die schmalere 2-Spalten-Kachel. */
.lp-hook .flip { width: 100%; }
.lp-hook .flip__inner { min-height: 236px; }
.lp-hook .face { padding: 40px 20px 22px; }
.lp-hook .face__word { font-size: 1.4rem; }
.lp-hook .face--back .face__word { font-size: 1.55rem; }
.lp-hook .lp-ctxpanel {
  margin-top: 14px;
  border-top: 3px solid color-mix(in srgb, var(--accent, var(--brand)) 70%, transparent);
}
.lp-hook .context-panel__title { color: color-mix(in srgb, var(--accent, var(--brand)) 60%, var(--ink)); }
@media (prefers-reduced-motion: reduce) {
  .lp-hook, .lp-hook__ico, .lp-hook__peek, .lp-hook__peek-chev { transition: none; }
  .lp-hook__sample { animation: none; }
}
@media (hover: none) { .lp-hook:hover { transform: none; } }
```

- [ ] **Step 2: Manual verification — visual check**

Reload `landing.html` in the browser, reopen a couple of "Kostprobe" cards, and confirm:
- The card fills the width of its hook tile, with reasonable spacing above/below (no huge empty gaps, no overflow).
- On mobile width (~375px, single-column `.lp-hooks` layout) the card is fully visible without horizontal scrolling.
- The context panel's accent-colored top border and title color match the hook's own accent color (e.g. purple for "Buen viajero", red for "Salud").

- [ ] **Step 3: Commit**

```bash
git add landing.css
git commit -m "style(landing): compact flip-card sizing for why-hooks, drop obsolete rules"
```

---

### Task 6: Remove now-unused i18n keys

**Files:**
- Modify: `landing.html` (three occurrences inside the inline `<script>`'s `I18N` object: the `I18N.de`, `I18N.en`, and `I18N.es` blocks)

**Interfaces:**
- Consumes: none.
- Produces: nothing consumed elsewhere — this only removes dead keys. The `why.taste` key (still used by the "Kostprobe" button label) and the `why.*.k`/`.t`/`.b` kicker/title/body keys (still used by the hook headings) are **not** touched.

- [ ] **Step 1: Remove the dead keys from `I18N.de`**

Find (currently lines 1101–1107):
```js
        "why.taste": "Kostprobe", "why.say": "Satz vorlesen",
        "why.historia.es": "Los incas levantaron esto sin rueda ni hierro.", "why.historia.m": "Ein Fakt, der jede Ruine zum Sprechen bringt.",
        "why.culturas.es": "En Chile, «al tiro» quiere decir ahora mismo.", "why.culturas.m": "Ein Wort — und du klingst wie von hier.",
        "why.respeto.es": "¿Me regala la cuenta, porfa?", "why.respeto.m": "So bittest du höflich — und wirst zum gern gesehenen Gast.",
        "why.salud.es": "Me pegó el soroche, el mal de altura.", "why.salud.m": "Der Satz, der auf 4000 Metern zählt.",
        "why.musica.es": "Esta cumbia se la sabe todo el continente.", "why.musica.m": "Kenn den Refrain — und du gehörst dazu.",
        "why.conexion.es": "¿Jugamos una? La primera la pago yo.", "why.conexion.m": "Ein Satz — und aus Fremden werden Freunde.",
```
Replace with:
```js
        "why.taste": "Kostprobe",
```

- [ ] **Step 2: Remove the dead keys from `I18N.en`**

Find (currently lines 1194–1200):
```js
        "why.taste": "Sample", "why.say": "Read aloud",
        "why.historia.es": "Los incas levantaron esto sin rueda ni hierro.", "why.historia.m": "A fact that makes every ruin speak.",
        "why.culturas.es": "En Chile, «al tiro» quiere decir ahora mismo.", "why.culturas.m": "One word — and you sound like a local.",
        "why.respeto.es": "¿Me regala la cuenta, porfa?", "why.respeto.m": "The polite way to ask — and be a welcome guest.",
        "why.salud.es": "Me pegó el soroche, el mal de altura.", "why.salud.m": "The sentence that counts at 4,000 metres.",
        "why.musica.es": "Esta cumbia se la sabe todo el continente.", "why.musica.m": "Know the chorus — and you belong.",
        "why.conexion.es": "¿Jugamos una? La primera la pago yo.", "why.conexion.m": "One line — and strangers become friends.",
```
Replace with:
```js
        "why.taste": "Sample",
```

- [ ] **Step 3: Remove the dead keys from `I18N.es`**

Find (currently lines 1287–1293):
```js
        "why.taste": "Muestra", "why.say": "Escuchar la frase",
        "why.historia.es": "Los incas levantaron esto sin rueda ni hierro.", "why.historia.m": "Un dato que hace hablar a cada ruina.",
        "why.culturas.es": "En Chile, «al tiro» quiere decir ahora mismo.", "why.culturas.m": "Una palabra — y suenas de acá.",
        "why.respeto.es": "¿Me regala la cuenta, porfa?", "why.respeto.m": "La forma amable de pedir — y caer bien.",
        "why.salud.es": "Me pegó el soroche, el mal de altura.", "why.salud.m": "La frase que importa a 4000 metros.",
        "why.musica.es": "Esta cumbia se la sabe todo el continente.", "why.musica.m": "Sábete el coro — y ya perteneces.",
        "why.conexion.es": "¿Jugamos una? La primera la pago yo.", "why.conexion.m": "Una frase — y los desconocidos se hacen amigos.",
```
Replace with:
```js
        "why.taste": "Muestra",
```

- [ ] **Step 4: Manual verification — no broken i18n**

Reload `landing.html`, switch through all 3 languages (DE/EN/ES) via the language switcher, and confirm the "Kostprobe"/"Sample"/"Muestra" button label still shows correctly on all 6 hooks, and no `data-i18n`/`data-i18n-aria` node in the page references a key that no longer exists (open DevTools console — `setLang` silently skips unknown keys, so there will be no error, but visually check no hook shows a raw key name like `why.historia.es` as text — since Task 3 already removed those nodes, this should be clean).

- [ ] **Step 5: Commit**

```bash
git add landing.html
git commit -m "chore(landing): remove unused why.*.es/.m/.say i18n keys"
```

---

### Task 7: Regenerate `landing-preview.html` and final end-to-end verification

**Files:**
- Regenerate: `landing-preview.html` (generated file, not hand-edited)

**Interfaces:**
- Consumes: the final state of `landing.html` from Tasks 1–6.
- Produces: nothing consumed by other tasks — this is the final step.

- [ ] **Step 1: Regenerate the preview file**

```bash
node scripts/build-landing-preview.mjs
```
Expected: command exits with status 0 and no error output.

- [ ] **Step 2: Confirm the diff only touches the expected region**

```bash
git diff --stat landing-preview.html
```
Expected: the file shows as modified (the generated `#why` section and inline script changed to match `landing.html`); no unrelated sections should show large diffs.

- [ ] **Step 3: Full manual regression pass**

Open `landing-preview.html` in a browser (this is what gets deployed) and repeat the checks from Task 4 Step 2 (all 6 hooks, all 3 languages, mobile width) plus:
- Confirm the "Mehr an Bord" module strip still works exactly as before (Task 1's regression check, now on the regenerated file).
- Confirm the Hero carousel (top of page) is unaffected (it uses its own static markup and `landing-carousel.js`, untouched by this plan).

- [ ] **Step 4: Commit**

```bash
git add landing-preview.html
git commit -m "chore(landing): regenerate landing-preview.html"
```

---

## Self-Review Notes

- **Spec coverage:** Kartenauswahl (Task 2) ✅, technischer Ansatz/`buildFlipCard`-Wiederverwendung (Task 1, 4) ✅, Hook-Markup-Umbau (Task 3) ✅, Kategorie-Badges (Task 2, `cat` field) ✅, i18n-Bereinigung (Task 6) ✅, Build-Schritt für `landing-preview.html` (Task 7) ✅, Out-of-Scope-Punkte (kein `ui.js`/`app.js`/`data.js` angefasst, kein neues Testsetup, "Mehr an Bord" unverändert) respected throughout.
- **Placeholder scan:** no TBD/TODO; every step contains literal code or literal manual-check instructions.
- **Type/name consistency:** `buildFlipCard(container, c, opts)` signature and `opts.{lang,catLabel,t,accent,speak}` shape used identically in Task 1 (definition + `render(mod)` call site) and Task 4 (hooks call site). `WHY_CARDS` keys (`historia`, `culturas`, `respeto`, `salud`, `musica`, `conexion`) match the `data-hook` attribute values already present in the existing HTML (verified against the current markup) and referenced identically in Task 4's `hook.getAttribute("data-hook")` lookup.
