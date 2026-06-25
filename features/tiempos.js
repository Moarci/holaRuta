/*
 * features/tiempos.js  (SC.tiempos) – „Tiempos": ausführliche, reisebezogene
 * Zeitformen-Erklärseite. Zeitstrahl, die wichtigsten Zeitformen als aufklappbare
 * Karten (Bildungs-Rezept, Signalwörter, Beispiele), Verlaufsformen, Indefinido-
 * vs-Imperfecto, unregelmäßige Vergangenheit & Partizipien, Imperativ, „hay“,
 * Situations-Zuordnung, Stolperfallen, Signalwörter und Reisedialoge. Inhalte aus
 * data.TENSES; unten ein CTA in die Übungskarten (normale open-category-Aktion).
 *
 * Teil der app.js/ui.js-Zerlegung (Welle D, Info-Screens). Reine Erklärseite ohne
 * eigenen State: VM (loc(data.TENSES) + Kartenzahl) und Render leben hier zusammen;
 * Controller-Dienste kommen per init(ctx). Der „Jetzt üben"-Button und die Sprung-
 * marken nutzen die generischen Aktionen open-category/scroll-to (app.js); der
 * Opener (openTiempos) bleibt im Controller (Shortcut-Map + Entdecken-Kachel).
 * Der Themenblock-Baustein sect() ist geteilt und kommt aus SC.view.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const { esc, renderIcon, hmTopbar, moduleShareBtn, sect } = window.SC.view;

  let ctx = null; // vom Controller injizierte Dienste (init)

  const loc = (v) => (ctx.i18n ? ctx.i18n.localizeDeep(v) : v);

  // ----- View-Modell -----
  // Statische Zeitformen-Erklärung (Inhalte: data.TENSES). Wie bei Conjugación
  // springt der „Jetzt üben"-Button per normaler open-category-Aktion in die
  // Übungskarten der Kategorie „tiempos".
  function tiemposVM() {
    return {
      guide: loc(ctx.data.TENSES),
      cardCount: ctx.data.CARDS.filter((c) => c.cat === "tiempos").length,
    };
  }

  // ----- Render -----
  function renderTiempos(vm) {
    const g = vm.guide;
    // `t` wird unten als g.timeline gebunden – darum den globalen Übersetzer hier als tt sichern.
    const tt = window.t;

    // Eine Zeit-Tabelle: Person links (gemeinsame tableLabels), Form rechts –
    // dieselbe Datenform wie bei der Konjugation.
    const table = (forms) => `
      <ul class="cj-table">
        ${forms.map((f, i) => `<li class="cj-row"><span class="cj-row__p" lang="es">${esc(g.tableLabels[i])}</span><span class="cj-row__f" lang="es">${esc(f)}</span></li>`).join("")}
      </ul>`;

    // Zeitstrahl: ein Verb (ich-Form) in drei Zeiten – als kompakte Wortliste.
    const t = g.timeline;
    const timelineRows = t.rows
      .map((r) => `
        <li class="cinfo-word">
          <span class="cinfo-word__de">${esc(r.when)}</span>
          <span class="cinfo-word__es" lang="es">${esc(r.es)}</span>
          <span class="cinfo-word__de">${esc(r.de)}</span>
        </li>`)
      .join("");
    const timeline = `
      <p class="cinfo-text cj-note">${esc(t.verb)}</p>
      <ul class="cinfo-words">${timelineRows}</ul>
      <p class="cinfo-text cj-note">${esc(t.note)}</p>`;

    // Kleiner Helfer: Beispiel-/Dialogzeilen (spanisch + deutsch) als Blöcke.
    const lines = (arr) => arr
      .map((l) => `
        <div class="context-panel__line">
          <p class="context-panel__es" lang="es">${esc(l.es)}</p>
          <p class="context-panel__de">${esc(l.de)}</p>
        </div>`)
      .join("");

    // Die einzelnen Zeitformen als aufklappbare Karten (wie die unregelmäßigen
    // Verben): Kopf = Zeitname + Kurzbeschreibung, aufgeklappt die Formen-
    // Tabelle, das Bildungs-Rezept, Signalwörter, ein „Wann?“-Hinweis und
    // mehrere Reise-Beispielsätze.
    const tenseBlocks = g.tenses
      .map((te) => `
        <details class="cinfo-dish">
          <summary class="cinfo-dish__head">
            <span class="cinfo-dish__heart">
              <span class="cinfo-dish__name" lang="es">${esc(te.name)}</span>
              <span class="cinfo-dish__desc">${esc(te.de)}</span>
            </span>
            <span class="cinfo-dish__chev" aria-hidden="true">▾</span>
          </summary>
          <div class="cinfo-dish__body">
            ${table(te.forms)}
            <p class="cj-verb__like"><strong>${esc(tt("discover.tiBuild"))}</strong> ${esc(te.recipe)}</p>
            <p class="cj-verb__like"><strong>${esc(tt("discover.tiSignals"))}</strong> <span lang="es">${esc(te.signals)}</span></p>
            <p class="cj-verb__like"><strong>${esc(tt("discover.tiWhen"))}</strong> ${esc(te.when)}</p>
            ${lines(te.examples)}
          </div>
        </details>`)
      .join("");

    // Kleiner Helfer: Wortpaar-Liste (spanisch fett links, deutsch rechts) –
    // für Gerundien, Partizipien, Imperativ-, hay- und Signalwort-Listen.
    const pairList = (rows, esKey, deKey) => `
      <ul class="cinfo-words">
        ${rows.map((r) => `<li class="cinfo-word"><span class="cinfo-word__es" lang="es">${esc(r[esKey])}</span><span class="cinfo-word__de">${esc(r[deKey])}</span></li>`).join("")}
      </ul>`;

    // Der einfache Vergangenheits-Trick: he + Partizip – Spiegel zu „voy a + Infinitiv".
    // Mini-Vergleich (Zukunft ↔ Vergangenheit), Formen-Tabelle, Bildungs-Rezept, Beispiele.
    const ep = g.easyPast;
    const easyPast = `
      <p class="cinfo-text">${esc(ep.intro)}</p>
      ${pairList(ep.mirror, "es", "de")}
      ${table(ep.forms)}
      <p class="cj-verb__like"><strong>${esc(tt("discover.tiBuild"))}</strong> ${esc(ep.recipe)}</p>
      ${lines(ep.examples)}
      <p class="cinfo-text cj-note">${esc(ep.note)}</p>`;

    // estar + Gerundio: Formen-Tabelle + unregelmäßige Gerundien + Beispiele.
    const c = g.continuous;
    const continuous = `
      <p class="cinfo-text">${esc(c.intro)}</p>
      ${table(c.forms)}
      ${pairList(c.gerunds.map((x) => ({ es: x.inf + " → " + x.ger, de: x.de })), "es", "de")}
      ${lines(c.examples)}
      <p class="cinfo-text cj-note">${esc(c.note)}</p>`;

    // estaba + Gerundio: derselbe Gerundio-Trick rückwärts – estar in der
    // Vergangenheit. Mini-Vergleich (jetzt ↔ damals), Formen-Tabelle, Beispiele.
    const pc = g.pastContinuous;
    const pastContinuous = `
      <p class="cinfo-text">${esc(pc.intro)}</p>
      ${pairList(pc.mirror, "es", "de")}
      ${table(pc.forms)}
      ${lines(pc.examples)}
      <p class="cinfo-text cj-note">${esc(pc.note)}</p>`;

    // acabar de + Infinitiv: „gerade eben getan" – kompakter Block (Intro,
    // Beispielpaare, Hinweis), wie hay/scenarios. Schließt an die Gerundio-Tricks an.
    const ad = g.acabarDe;
    const acabarDe = `
      <p class="cinfo-text">${esc(ad.intro)}</p>
      ${pairList(ad.rows, "es", "de")}
      <p class="cinfo-text cj-note">${esc(ad.note)}</p>`;

    // Indefinido vs. Imperfecto: zwei Spalten-Blöcke mit Stichpunkten + ein
    // kombinierter Beispielsatz (Ereignis vor Hintergrund).
    const iv = g.indefVsImperf;
    const ivCol = (col) => `
      <div class="cj-verb">
        <h4 class="cj-verb__h">${esc(col.label)}</h4>
        <ul class="cinfo-words">${col.points.map((p) => `<li class="cinfo-word"><span class="cinfo-word__es" lang="es">${esc(p)}</span></li>`).join("")}</ul>
      </div>`;
    const indefVsImperf = `
      <p class="cinfo-text">${esc(iv.intro)}</p>
      <div class="cj-verbs">${ivCol(iv.indef)}${ivCol(iv.imperf)}</div>
      ${lines([iv.combined])}
      <p class="cinfo-text cj-note">${esc(iv.note)}</p>`;

    // Reise-Situationen: Beispiel-Satz links, Zuordnung zur Zeitform rechts.
    const sc = g.scenarios;
    const scenarios = `
      <p class="cinfo-text">${esc(sc.intro)}</p>
      ${pairList(sc.rows, "es", "de")}
      <p class="cinfo-text cj-note">${esc(sc.note)}</p>`;

    // Stolperfallen: falsch (durchgestrichen) → richtig, plus Erklärung.
    const pf = g.pitfalls;
    const pitfallRows = pf.rows
      .map((r) => `
        <li class="cinfo-word cj-pitfall">
          <span class="cj-pitfall__pair"><span class="cj-pitfall__wrong" lang="es">${esc(r.wrong)}</span> <span class="cj-pitfall__arrow" aria-hidden="true">→</span> <span class="cj-pitfall__right" lang="es">${esc(r.right)}</span></span>
          <span class="cinfo-word__de">${esc(r.de)}</span>
        </li>`)
      .join("");
    const pitfalls = `
      <p class="cinfo-text">${esc(pf.intro)}</p>
      <ul class="cinfo-words">${pitfallRows}</ul>
      <p class="cinfo-text cj-note">${esc(pf.note)}</p>`;

    // Pretéritos fuertes: je Verb ein kleiner Block mit Überschrift + Tabelle.
    const sp = g.strongPast;
    const strongPastBlocks = sp.verbs
      .map((v) => `
        <div class="cj-verb">
          <h4 class="cj-verb__h" lang="es">${esc(v.verb)} <span class="cinfo-dish__desc">· ${esc(v.de)}</span></h4>
          ${table(v.forms)}
        </div>`)
      .join("");
    const strongPast = `
      <p class="cinfo-text">${esc(sp.intro)}</p>
      <div class="cj-verbs">${strongPastBlocks}</div>
      <p class="cinfo-text cj-note">${esc(sp.note)}</p>`;

    // Unregelmäßige Partizipien: Infinitiv → Partizip, deutsche Bedeutung.
    const pp = g.participles;
    const participles = `
      <p class="cinfo-text">${esc(pp.intro)}</p>
      ${pairList(pp.rows.map((x) => ({ es: x.inf + " → " + x.part, de: x.de })), "es", "de")}
      <p class="cinfo-text cj-note">${esc(pp.note)}</p>`;

    // Imperativo & hay: schlichte Wortpaar-Listen mit Hinweis.
    const im = g.imperative;
    const imperative = `
      <p class="cinfo-text">${esc(im.intro)}</p>
      ${pairList(im.rows, "es", "de")}
      <p class="cinfo-text cj-note">${esc(im.note)}</p>`;

    const hy = g.hay;
    const hayBlock = `
      <p class="cinfo-text">${esc(hy.intro)}</p>
      ${pairList(hy.rows, "es", "de")}
      <p class="cinfo-text cj-note">${esc(hy.note)}</p>`;

    const signalRows = g.signals
      .map((s) => `<li class="cinfo-word"><span class="cinfo-word__es" lang="es">${esc(s.es)}</span><span class="cinfo-word__de">${esc(s.de)}</span></li>`)
      .join("");

    // Reisedialoge: der Drei-Zeiten-Dialog plus die beiden themed Dialoge
    // (Rückblick & Pläne) – jeder mit Titel, Zeilen und Mini-Hinweis.
    const allDialogs = [g.example].concat(g.dialogs || []);
    const dialogsHtml = allDialogs
      .map((d) => `
        <div class="cj-dialog">
          <h4 class="cj-verb__h" lang="es">${esc(d.title)}</h4>
          ${lines(d.lines)}
          <p class="cinfo-text cj-note">${esc(d.note)}</p>
        </div>`)
      .join("");

    // Alle Abschnitte EINMAL definiert (eine Quelle der Wahrheit). Ein Abschnitt
    // mit id + nav (Kurzlabel) ist per Sprungmarke erreichbar; ohne nav erscheint
    // er nur im Fließtext. Reihenfolge der Sprungleiste = Reihenfolge der Seite.
    const sections = [
      { icon: "lc:arrow-left-right", title: t.title, body: timeline },
      { icon: "lc:wand-sparkles", title: ep.title, body: easyPast, id: "ti-tricks", nav: tt("discover.tiNavTricks") },
      { icon: "lc:clock", title: tt("discover.tiTenses"), body: `<div class="cinfo-dishes">${tenseBlocks}</div><p class="cinfo-text cj-note">${esc(g.tensesNote)}</p>`, id: "ti-tenses", nav: tt("discover.tiNavTenses") },
      { icon: "lc:play", title: c.title, body: continuous, id: "ti-continuous", nav: tt("discover.tiNavContinuous") },
      { icon: "lc:rewind", title: pc.title, body: pastContinuous },
      { icon: "lc:timer", title: ad.title, body: acabarDe },
      { icon: "lc:scale", title: iv.title, body: indefVsImperf, id: "ti-compare", nav: tt("discover.tiNavCompare") },
      { icon: "lc:biceps-flexed", title: sp.title, body: strongPast, id: "ti-irregular", nav: tt("discover.tiNavIrregular") },
      { icon: "lc:puzzle", title: pp.title, body: participles },
      { icon: "lc:megaphone", title: im.title, body: imperative, id: "ti-commands", nav: tt("discover.tiNavCommands") },
      { icon: "lc:package", title: hy.title, body: hayBlock },
      { icon: "lc:luggage", title: sc.title, body: scenarios, id: "ti-practice", nav: tt("discover.tiNavPractice") },
      { icon: "lc:alert-triangle", title: pf.title, body: pitfalls },
      { icon: "lc:key", title: tt("discover.tiSignalWords"), body: `<ul class="cinfo-words">${signalRows}</ul><p class="cinfo-text cj-note">${esc(g.signalsNote)}</p>` },
      { icon: "lc:compass", title: tt("discover.tiDialogs"), body: dialogsHtml, id: "ti-dialogs", nav: tt("discover.tiNavDialogs") },
    ];

    // Sprungmarken-Leiste (wie hist-nav/sz-nav): bei dieser langen Erklärseite
    // springt man direkt zu den Hauptlandmarken, statt endlos zu scrollen.
    const tiNav = `
      <nav class="ti-nav" aria-label="${esc(tt("discover.tiNavLabel"))}">
        ${sections.filter((s) => s.id && s.nav).map((s) => `<a class="ti-nav__chip" href="#${s.id}" data-action="scroll-to" data-target="${s.id}">${renderIcon(s.icon)} ${esc(s.nav)}</a>`).join("")}
      </nav>`;

    return `
      <section class="screen">
        ${hmTopbar("⏳ Tiempos", "home")}
        <p class="hm-intro">${esc(g.intro)}</p>
        ${moduleShareBtn("tiempos")}
        ${tiNav}

        ${sections.map((s) => sect(s.icon, s.title, s.body, s.id)).join("")}

        <button class="cta cj-cta" data-action="open-category" data-id="tiempos">
          ${esc(tt("discover.tiPracticeTenses"))} <span class="cta__count">${esc(tt("home.tileCards", { n: vm.cardCount }))}</span>
        </button>
      </section>`;
  }

  window.SC.tiempos = {
    init(injected) { ctx = injected; },
    vm: tiemposVM,
    // SCREENS-Eintrag (app.js delegiert).
    screen: () => renderTiempos(tiemposVM()),
  };
})();
