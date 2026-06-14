/*
 * search.js  (SC.search) – Such-Kern: normalisieren, indexieren, ranken.
 * REINE FUNKTIONEN (keine Daten, kein DOM). Der Controller (app.js) baut aus
 * data.js/countries.js/… eine flache Liste durchsuchbarer Einträge und lässt
 * sie hier ranken; die Such-Ansicht (ui.renderSearch) zeigt das Ergebnis.
 *
 * Nachsichtig wie der Antwort-Matcher: Groß-/Kleinschreibung und Akzente egal
 * („nino" findet „niño", „mexico" findet „México"). Mehrere Tokens werden
 * UND-verknüpft (alle müssen vorkommen).
 *
 * Datenformat eines Eintrags (vom Controller gebaut):
 *   { hay, title, … beliebige weitere Anzeige-/Navigationsfelder }
 *     hay   = vorab normalisierter Such-Heuhaufen (search.haystack(...))
 *     title = Anzeigetitel (für den Anfangstreffer-Bonus, roh – wird hier normalisiert)
 */
(function () {
  "use strict";

  // Klein schreiben + Akzente entfernen (NFD spaltet Kombizeichen ab, die dann
  // wegfallen). Bewusst simpler als matcher.normalize: hier zählt breites Finden,
  // Satzzeichen im Heuhaufen stören die Teilstring-Suche nicht.
  function normalize(str) {
    return String(str == null ? "" : str)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }

  // Beliebig verschachtelte Teile (Strings, Arrays, null) zu EINEM normalisierten
  // Heuhaufen-String zusammenziehen. Leere/fehlende Werte fallen still weg, damit
  // der Aufrufer optionale …En-Felder bedenkenlos mitgeben kann.
  function haystack(parts) {
    const out = [];
    const add = (v) => {
      if (v == null) return;
      if (Array.isArray(v)) { v.forEach(add); return; }
      const s = String(v).trim();
      if (s) out.push(s);
    };
    add(parts);
    return normalize(out.join(" "));
  }

  // Suchbegriff in Tokens zerlegen (Leerzeichen-getrennt, normalisiert).
  function tokenize(query) {
    return normalize(String(query == null ? "" : query).trim())
      .split(/\s+/)
      .filter(Boolean);
  }

  // Bewertet einen Eintrag gegen die Tokens. ALLE Tokens müssen im Heuhaufen
  // vorkommen (sonst Infinity = kein Treffer). Kleinere Punktzahl = besser:
  // frühe Vorkommen zählen weniger, ein Titel-Anfangstreffer bekommt einen großen
  // Bonus (negativ!). Deshalb ist Infinity das EINZIGE „nicht gefunden"-Signal –
  // 0 oder negativ sind gültige (gute) Punktzahlen.
  function score(item, tokens) {
    if (!tokens.length) return Infinity;
    let s = 0;
    for (let i = 0; i < tokens.length; i++) {
      const pos = item.hay.indexOf(tokens[i]);
      if (pos === -1) return Infinity;
      s += pos;
    }
    if (normalize(item.title).indexOf(tokens[0]) === 0) s -= 1000;
    return s;
  }

  // Liste ranken: matchende Einträge nach Punktzahl aufsteigend (beste zuerst).
  // Stabil bei Gleichstand (Original-Reihenfolge bleibt) – verhindert „springende"
  // Trefferlisten beim Tippen. Gibt die Einträge selbst zurück (mit .score ergänzt).
  function rank(items, query) {
    const tokens = tokenize(query);
    if (!tokens.length) return [];
    const hits = [];
    for (let i = 0; i < items.length; i++) {
      const sc = score(items[i], tokens);
      if (Number.isFinite(sc)) hits.push({ item: items[i], sc: sc, i: i });
    }
    hits.sort((a, b) => (a.sc - b.sc) || (a.i - b.i));
    return hits.map((h) => h.item);
  }

  window.SC = window.SC || {};
  window.SC.search = { normalize, haystack, tokenize, score, rank };
})();
