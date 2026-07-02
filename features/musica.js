/*
 * features/musica.js  (SC.musicaSheet) – „Música": die großen Genres LatAms
 * (mit ES-Lesetraining + Spotify/Apple-Deep-Links), der Sound des gewählten
 * Reiselands (state.countryId wie Bebidas/Länderkunde), die Sätze zum
 * Reden/Tanzen und ein Glossar. Beide Deep-Link-Ziele werden aus EINER
 * Suchanfrage `q` gebaut, damit kein Link veraltet (keine toten Track-/
 * Playlist-IDs). Inhalte aus dem Content-Modul SC.musica (musica.js).
 *
 * Teil der app.js/ui.js-Zerlegung (Custom-Render-Screens, wie cronologia): VM
 * (Daten 1:1 durchgereicht, …En-Felder per localizeDeep überlagert; Länder-
 * Auswahl über ctx.state.countryId + ctx.countries/natk) und Render leben hier
 * zusammen; Controller-Dienste kommen per init(ctx). Der Opener (openMusica)
 * und der Länderwahl-Handler (data-action) bleiben im Controller.
 *
 * WICHTIG: Der Opener läuft über navAfterLoad("musica", …) – das Content-Modul
 * kann lazy nachgeladen werden und zur init-Zeit noch fehlen. Darum liest die
 * VM window.SC.musica LIVE statt ctx.musica (Konvention für lazy/optionale
 * Module, siehe featureCtx-Kommentar in app.js).
 *
 * Namensgebung: Content-Modul SC.musica (Daten), Feature-Modul SC.musicaSheet.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};
  const { esc, renderIcon, phraseGroups, moduleShareBtn, countryPicker, readingDetails, glossItem } = window.SC.view;
  const t = (key, vars) => window.t(key, vars);

  let ctx = null; // vom Controller injizierte Dienste (init)

  // ----- View-Modell -----
  function musicaVM() {
    const musica = window.SC.musica; // live: kann per navAfterLoad nachgeladen sein
    if (!musica) return { intro: "", genres: [], phrases: [], glossary: [], country: null, countryData: null, groups: [] };
    const en = ctx.i18n && ctx.i18n.getLang() === "en";
    const loc = (v) => (ctx.i18n ? ctx.i18n.localizeDeep(v) : v);
    const list = ctx.countries ? ctx.countries.LIST : [];
    const regions = ctx.countries ? ctx.countries.REGIONS : [];
    const country = list.find((c) => c.id === ctx.state.countryId) || list[0] || null;
    const groups = regions
      .map((region) => ({
        region,
        countries: list
          .filter((c) => c.region === region)
          .map((c) => ({ id: c.id, name: ctx.natk(c, "name"), flag: c.flag, selected: country && c.id === country.id })),
      }))
      .filter((g) => g.countries.length > 0);
    const cd = (country && musica.COUNTRY[country.id]) ? loc(musica.COUNTRY[country.id]) : null;
    return {
      intro: (en && musica.INTRO_EN) ? musica.INTRO_EN : musica.INTRO,
      genres: loc(musica.GENRES || []),
      phrases: loc(musica.PHRASES || []),
      glossary: loc(musica.GLOSSARY || []),
      country: country ? { id: country.id, name: ctx.natk(country, "name"), flag: country.flag } : null,
      countryData: cd,
      groups,
    };
  }

  // ----- Render -----
  function renderMusica(vm) {
    const spotifyUrl = (q) => `https://open.spotify.com/search/${encodeURIComponent(q || "")}`;
    const appleUrl = (q) => `https://music.apple.com/search?term=${encodeURIComponent(q || "")}`;
    const playLinks = (q) => `
      <div class="mus-links">
        <a class="mus-link mus-link--spotify" href="${esc(spotifyUrl(q))}" target="_blank" rel="noopener noreferrer">
          <span aria-hidden="true">▶</span> ${esc(t("discover.musOnSpotify"))}
        </a>
        <a class="mus-link mus-link--apple" href="${esc(appleUrl(q))}" target="_blank" rel="noopener noreferrer">
          <span aria-hidden="true">▶</span> ${esc(t("discover.musOnApple"))}
        </a>
      </div>`;

    // Ein Genre: aufklappbar wie bei Salud/Fotos, plus Künstler-Chips,
    // Deep-Links und spanisches Lesetraining.
    const genreBlock = (g) => {
      const reading = readingDetails(g);
      const artists = (g.artists || []).length
        ? `<div class="mus-artists"><span class="mus-artists__cap">${esc(t("discover.musArtists"))}</span><span class="mus-artists__chips">${
            g.artists.map((a) => `<span class="mus-artist">${esc(a)}</span>`).join("")
          }</span></div>`
        : "";
      return `
        <details class="knigge-topic mus-genre">
          <summary class="knigge-topic__head">
            <span class="knigge-topic__icon" aria-hidden="true">${renderIcon(g.icon)}</span>
            <span class="knigge-topic__title">${esc(g.name)}${g.origin ? `<span class="mus-genre__origin">${esc(g.origin)}</span>` : ""}</span>
            <span class="knigge-topic__chev" aria-hidden="true">▾</span>
          </summary>
          <div class="knigge-topic__body">
            ${g.desc ? `<p class="knigge-intro">${esc(g.desc)}</p>` : ""}
            ${artists}
            ${playLinks(g.q)}
            ${reading}
          </div>
        </details>`;
    };
    const genres = (vm.genres || []).map(genreBlock).join("");

    // „Sound deines Reiselands": Land wählen (wie Länderkunde/Bebidas) + eine Karte
    // mit typischem Stil, einem bekannten Künstler/Song und den zwei Deep-Links.
    const picker = (vm.groups && vm.groups.length) ? countryPicker(vm.groups) : "";
    const cd = vm.countryData;
    const soundCard = cd
      ? `<article class="mus-country">
           <div class="mus-country__head">
             <span class="mus-country__flag" aria-hidden="true">${vm.country ? vm.country.flag : "🎶"}</span>
             <div class="mus-country__meta">
               <div class="mus-country__genre">${esc(cd.genre)}</div>
               <div class="mus-country__song">${esc(cd.artist)} · „${esc(cd.song)}“</div>
             </div>
           </div>
           ${playLinks(cd.q)}
         </article>`
      : `<p class="hm-intro">${esc(t("discover.musNoCountry"))}</p>`;
    const sound = (picker || cd)
      ? `${picker}<p class="hm-intro">${esc(t("discover.musSoundHint"))}</p>${soundCard}`
      : "";

    // Wichtige Sätze: pro Thema eine zweispaltige Liste (es / de) – wie Fotos/Salud,
    // jeder Satz mit Stern → „Mi léxico".
    const phrases = phraseGroups(vm.phrases, { fav: ctx.isFavorite, cat: "musica" });

    const glossary = (vm.glossary || []).map(glossItem).join("");

    // Sprungmarken-Leiste (wie ft-nav): nur Chips für vorhandene Blöcke.
    const navItems = [
      sound && { id: "mus-sound", icon: "lc:map-pin", label: t("discover.musNavSound") },
      genres && { id: "mus-genres", icon: "lc:music", label: t("discover.musNavGenres") },
      phrases && { id: "mus-phrases", icon: "lc:message-circle", label: t("discover.musNavPhrases") },
      glossary && { id: "mus-words", icon: "lc:megaphone", label: t("discover.musNavWords") },
    ].filter(Boolean);
    const nav = navItems.length > 1
      ? `<nav class="mus-nav" aria-label="${esc(t("discover.musAreas"))}">${navItems.map((n) =>
          `<a class="mus-nav__chip" href="#${n.id}" data-action="scroll-to" data-target="${n.id}"><span aria-hidden="true">${renderIcon(n.icon)}</span> ${esc(n.label)}</a>`).join("")}</nav>`
      : "";

    return `
      <section class="screen">
        <div class="topbar">
          <button class="iconbtn" data-action="home" aria-label="${esc(t("common.backShort"))}">‹</button>
          <div class="topbar__title">${renderIcon("lc:music")} Música</div>
          <span></span>
        </div>
        <p class="pageintro">${esc(vm.intro)}</p>
        ${moduleShareBtn("musica")}
        ${nav}

        ${sound ? `<h2 class="rg-head" id="mus-sound">${esc(t("discover.musSound"))}</h2>${sound}` : ""}
        ${genres ? `<h2 class="rg-head" id="mus-genres">${esc(t("discover.musGenres"))}</h2><p class="hm-intro">${esc(t("discover.musGenresHint"))}</p>${genres}` : ""}
        ${phrases ? `<h2 class="rg-head" id="mus-phrases">${esc(t("discover.musPhrases"))}</h2>${phrases}` : ""}
        ${glossary ? `<h2 class="rg-head" id="mus-words">${esc(t("discover.musWords"))}</h2><ul class="rg-glosslist">${glossary}</ul>` : ""}
      </section>`;
  }

  window.SC.musicaSheet = {
    init(injected) { ctx = injected; },
    vm: musicaVM,
    screen: () => renderMusica(musicaVM()),
  };
})();
