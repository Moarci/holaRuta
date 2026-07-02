/*
 * features/fotografia.js  (SC.fotosSheet) – „Fotos y videos": praktische Tipps
 * (Topics mit DOs/Don'ts + spanisches Lesetraining wie in der Historia), Sätze
 * zum Bitten/Platz-Machen, der Teilen-Block (AirDrop/Quick Share) plus Foto-Apps
 * (Mymories, mit eingebetteter SVG-Illustration – funktioniert offline), Glossar
 * und Kit. Inhalte aus dem Content-Modul SC.fotografia (fotografia.js).
 *
 * Teil der app.js/ui.js-Zerlegung (Custom-Render-Screens, wie cronologia): VM
 * (Daten 1:1 durchgereicht, …En-Felder per localizeDeep überlagert) und Render
 * leben hier zusammen; Controller-Dienste (i18n) kommen per init(ctx). Der
 * Opener (openFotos) bleibt im Controller.
 *
 * WICHTIG: Der Opener läuft über navAfterLoad("fotografia", …) – das Content-
 * Modul kann lazy nachgeladen werden und zur init-Zeit noch fehlen. Darum liest
 * die VM window.SC.fotografia LIVE statt ctx.fotografia (Konvention für
 * lazy/optionale Module, siehe featureCtx-Kommentar in app.js).
 *
 * Namensgebung: Content-Modul SC.fotografia (Daten), Feature-Modul SC.fotosSheet
 * (Screen-Key "fotos").
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const { esc, renderIcon, levelMeta, readingBlock, tipsShareBtn, phraseGroups, moduleShareBtn } = window.SC.view;
  const t = (key, vars) => window.t(key, vars);

  let ctx = null; // vom Controller injizierte Dienste (init)

  // ----- View-Modell -----
  function fotosVM() {
    const fotografia = window.SC.fotografia; // live: kann per navAfterLoad nachgeladen sein
    if (!fotografia) return { intro: "", topics: [], phrases: [], sharing: null, apps: [], glossary: [], checklist: [] };
    const en = ctx.i18n && ctx.i18n.getLang() === "en";
    const loc = (v) => (ctx.i18n ? ctx.i18n.localizeDeep(v) : v);
    return {
      intro: (en && fotografia.INTRO_EN) ? fotografia.INTRO_EN : fotografia.INTRO,
      topics: loc(fotografia.TOPICS || []),
      phrases: loc(fotografia.PHRASES || []),
      sharing: fotografia.SHARING ? loc(fotografia.SHARING) : null,
      apps: loc(fotografia.APPS || []),
      glossary: loc(fotografia.GLOSSARY || []),
      checklist: loc(fotografia.CHECKLIST || []),
    };
  }

  // ----- Render -----
  // Eine kleine, eingebettete SVG-Illustration als „Bild" – funktioniert offline.
  const MYMORIES_SVG =
    '<svg class="foto-app__art" viewBox="0 0 120 96" role="img" aria-label="Mymories" focusable="false">' +
      '<defs><linearGradient id="ffg" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#C25A45"/><stop offset="1" stop-color="#5A4FA8"/></linearGradient></defs>' +
      '<rect x="2" y="2" width="116" height="92" rx="12" fill="url(#ffg)"/>' +
      '<rect x="18" y="14" width="50" height="68" rx="8" fill="#fff"/>' +
      '<rect x="24" y="22" width="17" height="17" rx="2.5" fill="#C25A45"/>' +
      '<rect x="45" y="22" width="17" height="17" rx="2.5" fill="#E7A33E"/>' +
      '<rect x="24" y="43" width="17" height="17" rx="2.5" fill="#5A4FA8"/>' +
      '<rect x="45" y="43" width="17" height="17" rx="2.5" fill="#2F8E5B"/>' +
      '<rect x="24" y="64" width="38" height="10" rx="3" fill="#E7E2F2"/>' +
      '<rect x="74" y="40" width="34" height="34" rx="6" fill="#fff"/>' +
      '<g fill="#27224A">' +
      '<rect x="79" y="45" width="7" height="7"/><rect x="96" y="45" width="7" height="7"/>' +
      '<rect x="79" y="62" width="7" height="7"/><rect x="89" y="55" width="5" height="5"/>' +
      '<rect x="96" y="62" width="7" height="7"/><rect x="89" y="45" width="3" height="3"/></g>' +
      '<circle cx="92" cy="24" r="13" fill="#fff"/>' +
      '<text x="92" y="29" font-size="14" text-anchor="middle" fill="#C25A45">📷</text>' +
    '</svg>';

  function renderFotos(vm) {
    const liList = (items, cls, marker) => {
      // Marker als role="img" mit Label, damit Screenreader „Empfohlen/Vermeiden"
      // hören – sonst sind DO- und Don't-Liste nur über Emoji+Farbe unterscheidbar.
      const srLabel = cls === "knigge-do" ? t("discover.kniggeDo") : t("discover.kniggeDont");
      return (items || [])
        .map((x) => `<li class="${cls}"><span class="knigge-mark" role="img" aria-label="${esc(srLabel)}">${marker}</span>${esc(x)}</li>`)
        .join("");
    };

    // Ein Thema: aufklappbar wie bei Knigge/Salud, plus spanisches Lesetraining.
    const topicBlock = (tp, i) => {
      const lvl = levelMeta(tp.level);
      const reading = (tp.es && tp.es.length)
        ? `<details class="hist-read">
             <summary class="hist-read__sum">${renderIcon("lc:book-open")} ${esc(t("discover.histReadToggle"))}${lvl ? `<span class="hist-read__lvl hist-lvl--${esc(lvl.code)}">${esc(lvl.code)}</span>` : ""}<span class="hist-read__chev" aria-hidden="true">▾</span></summary>
             <div class="hist-read__body">${readingBlock({ es: tp.es, vocab: tp.vocab, level: tp.level, quiz: true })}</div>
           </details>`
        : "";
      return `
        <details class="knigge-topic">
          <summary class="knigge-topic__head">
            <span class="knigge-topic__icon" aria-hidden="true">${renderIcon(tp.icon)}</span>
            <span class="knigge-topic__title">${esc(tp.title)}</span>
            <span class="knigge-topic__chev" aria-hidden="true">▾</span>
          </summary>
          <div class="knigge-topic__body">
            ${tp.intro ? `<p class="knigge-intro">${esc(tp.intro)}</p>` : ""}
            ${tp.dos && tp.dos.length ? `<ul class="knigge-list">${liList(tp.dos, "knigge-do", "✅")}</ul>` : ""}
            ${tp.donts && tp.donts.length ? `<ul class="knigge-list">${liList(tp.donts, "knigge-dont", "🚫")}</ul>` : ""}
            ${reading}
            ${tipsShareBtn("fotos", i)}
          </div>
        </details>`;
    };
    const topics = (vm.topics || []).map(topicBlock).join("");

    // Wichtige Sätze: pro Thema eine zweispaltige Liste (es / de) – wie Salud,
    // jeder Satz mit Stern → „Mi léxico" (Schnappschuss am Stern).
    const phrases = phraseGroups(vm.phrases, { fav: ctx.isFavorite, cat: "fotos" });

    // Teilen-Block: AirDrop / Quick Share (Erklärung + DOs/Don'ts).
    const sh = vm.sharing;
    const sharing = sh
      ? `<p class="hm-intro">${esc(sh.intro)}</p>
         ${sh.dos && sh.dos.length ? `<ul class="knigge-list">${liList(sh.dos, "knigge-do", "✅")}</ul>` : ""}
         ${sh.donts && sh.donts.length ? `<ul class="knigge-list">${liList(sh.donts, "knigge-dont", "🚫")}</ul>` : ""}`
      : "";

    // Foto-Apps: Karte mit Bild (SVG), Erklärung und Link (z. B. Mymories).
    const appCard = (a) => {
      const bullets = (a.bullets || []).length
        ? `<ul class="foto-app__bullets">${a.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`
        : "";
      const linkLabel = (a.url || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
      return `
        <article class="foto-app">
          <div class="foto-app__media" aria-hidden="false">${MYMORIES_SVG}</div>
          <div class="foto-app__body">
            <h3 class="foto-app__name">${esc(a.name)}${a.platform ? ` <span class="foto-app__plat">${esc(a.platform)}</span>` : ""}</h3>
            <p class="foto-app__desc">${esc(a.desc)}</p>
            ${bullets}
            ${a.url ? `<a class="foto-app__link" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${renderIcon("lc:link")} ${esc(linkLabel)}</a>` : ""}
          </div>
        </article>`;
    };
    const apps = (vm.apps || []).map(appCard).join("");

    const glossary = (vm.glossary || []).map((g) => `
      <li class="rg-gloss">
        <span class="rg-gloss__es" lang="es">${esc(g.es)}</span>
        <span class="rg-gloss__de">${esc(g.de)}</span>
      </li>`).join("");

    const checklist = (vm.checklist || []).map((c) => `
      <li class="rg-region">
        <span class="rg-region__flag" aria-hidden="true">${renderIcon(c.icon)}</span>
        <span class="rg-region__body">
          <span class="rg-region__country">${esc(c.item)}</span>
          <span class="rg-region__note">${esc(c.why)}</span>
        </span>
      </li>`).join("");

    // Sprungmarken-Leiste (wie hist-nav/sz-nav): die Seite ist lang, ein Tipp
    // springt direkt zum Abschnitt. Nur Chips für tatsächlich vorhandene Blöcke.
    const navItems = [
      topics && { id: "ft-tips", icon: "lc:target", label: t("discover.ftNavTips") },
      phrases && { id: "ft-phrases", icon: "lc:message-circle", label: t("discover.ftNavPhrases") },
      sharing && { id: "ft-share", icon: "lc:upload", label: t("discover.ftNavShare") },
      apps && { id: "ft-apps", icon: "lc:smartphone", label: t("discover.ftNavApps") },
      glossary && { id: "ft-words", icon: "lc:megaphone", label: t("discover.ftNavWords") },
      (vm.checklist && vm.checklist.length) && { id: "ft-kit", icon: "lc:backpack", label: t("discover.ftNavKit") },
    ].filter(Boolean);
    const nav = navItems.length > 1
      ? `<nav class="ft-nav" aria-label="${esc(t("discover.ftAreas"))}">${navItems.map((n) =>
          `<a class="ft-nav__chip" href="#${n.id}" data-action="scroll-to" data-target="${n.id}"><span aria-hidden="true">${renderIcon(n.icon)}</span> ${esc(n.label)}</a>`).join("")}</nav>`
      : "";

    return `
      <section class="screen">
        <div class="topbar">
          <button class="iconbtn" data-action="home" aria-label="${esc(t("common.backShort"))}">‹</button>
          <div class="topbar__title">${renderIcon("lc:camera")} Fotos y videos</div>
          <span></span>
        </div>
        <p class="pageintro">${esc(vm.intro)}</p>
        ${moduleShareBtn("fotos")}
        ${nav}

        ${topics ? `<h2 class="rg-head" id="ft-tips">${esc(t("discover.ftTips"))}</h2>${topics}` : ""}
        ${phrases ? `<h2 class="rg-head" id="ft-phrases">${esc(t("discover.ftPhrases"))}</h2>${phrases}` : ""}
        ${sharing ? `<h2 class="rg-head" id="ft-share">${esc(t("discover.ftShare"))}</h2>${sharing}` : ""}
        ${apps ? `<h2 class="rg-head" id="ft-apps">${esc(t("discover.ftApps"))}</h2><p class="hm-intro">${esc(t("discover.ftAppsHint"))}</p>${apps}` : ""}
        ${glossary ? `<h2 class="rg-head" id="ft-words">${esc(t("discover.ftWords"))}</h2><ul class="rg-glosslist">${glossary}</ul>` : ""}
        ${(vm.checklist && vm.checklist.length)
          ? `<h2 class="rg-head" id="ft-kit">${esc(t("discover.ftChecklist"))}</h2>
             <p class="hm-intro">${esc(t("discover.ftChecklistHint"))}</p>
             <ul class="rg-regions">${checklist}</ul>`
          : ""}
      </section>`;
  }

  window.SC.fotosSheet = {
    init(injected) { ctx = injected; },
    vm: fotosVM,
    screen: () => renderFotos(fotosVM()),
  };
})();
