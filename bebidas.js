/*
 * bebidas.js – „Bebidas AM/PM": pro Land ein Tag-/Abend-Getränk.
 *
 * Reines Datenmodul (keine Logik, kein DOM): Für jedes Land der Länderkunde
 * (countries.js, gleiche id) das typische Morgengetränk (AM) und das typische
 * Abendgetränk (PM). Der Reise-Knigge & Co. lesen das gewählte Land aus
 * state.countryId – dieses Modul liefert die passenden Getränke dazu, sodass die
 * AM/PM-Tafel immer das Land der Reise zeigt.
 *
 * Felder pro Land:
 *   accent  – Akzentfarbe der Tafel (Schein + Eyebrow), aus der Übersicht.
 *   am.name – Name des Morgengetränks; am.art – Becher-Form ("cup"|"mate"|"olla").
 *   am.cold – true: kein Dampf (kalt getrunken, z. B. Tereré).
 *   pm.name – Name des Abendgetränks; pm.art – Glas-Form ("highball"|"coupe"|"wine").
 *   pm.liquid – Füllfarbe des Glases.
 *   greet   – [Morgengruß, Abendgruß] in der Landessprache.
 *
 * Die SVG-Formen werden in ui.js aus art + liquid gebaut (drei Becher, drei
 * Gläser) – so bleibt die Tafel pixelgleich zu den Entwürfen, ohne 19 SVGs.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};

  // Region-Label für die Eyebrow – aus country.region (Deutsch) ins spanische
  // Reise-Vokabular der Entwürfe übersetzt.
  const REGION_LABEL = {
    Mittelamerika: "México y Centroamérica",
    Karibik: "El Caribe",
    "Südamerika": "Sudamérica",
  };

  // id = countries.js-id. Reihenfolge wie in der Länderkunde.
  const BEBIDAS = {
    mexico:      { accent: "#2E7A4A", am: { name: "Café de olla", art: "olla" },  pm: { name: "Mezcal",        art: "coupe",    liquid: "#C98A3A" }, greet: ["Buenos días", "Buenas noches"] },
    guatemala:   { accent: "#4A90B8", am: { name: "Café",         art: "cup" },   pm: { name: "Ron Zacapa",    art: "highball", liquid: "#9A4E1E" }, greet: ["Buenos días", "Buenas noches"] },
    honduras:    { accent: "#2A6FB0", am: { name: "Café",         art: "cup" },   pm: { name: "Ron",           art: "highball", liquid: "#9A4E1E" }, greet: ["Buenos días", "Buenas noches"] },
    elsalvador:  { accent: "#2A6FB0", am: { name: "Café",         art: "cup" },   pm: { name: "Pilsener",      art: "highball", liquid: "#E0B23A" }, greet: ["Buenos días", "Buenas noches"] },
    nicaragua:   { accent: "#2A6FB0", am: { name: "Café",         art: "cup" },   pm: { name: "Flor de Caña",  art: "highball", liquid: "#B5793A" }, greet: ["Buenos días", "Buenas noches"] },
    costarica:   { accent: "#2A4FA0", am: { name: "Café chorreado", art: "cup" }, pm: { name: "Guaro",         art: "coupe",    liquid: "#E2DCC2" }, greet: ["Buenos días", "Buenas noches"] },
    panama:      { accent: "#2A4FB0", am: { name: "Café",         art: "cup" },   pm: { name: "Seco Herrerano", art: "coupe",   liquid: "#E2DCC2" }, greet: ["Buenos días", "Buenas noches"] },
    cuba:        { accent: "#2A6FB0", am: { name: "Cafecito",     art: "cup" },   pm: { name: "Mojito",        art: "highball", liquid: "#C7DDA8" }, greet: ["Buenos días", "Buenas noches"] },
    "republica-dominicana": { accent: "#2A4FB0", am: { name: "Café", art: "cup" }, pm: { name: "Ron Brugal",  art: "highball", liquid: "#9A4E1E" }, greet: ["Buenos días", "Buenas noches"] },
    "puerto-rico": { accent: "#2A6FB0", am: { name: "Café",       art: "cup" },   pm: { name: "Piña Colada",   art: "highball", liquid: "#E8E0C8" }, greet: ["Buenos días", "Buenas noches"] },
    colombia:    { accent: "#E0B53A", am: { name: "Tinto",        art: "cup" },   pm: { name: "Aguardiente",   art: "coupe",    liquid: "#DCE4DA" }, greet: ["Buenos días", "Buenas noches"] },
    venezuela:   { accent: "#B8862E", am: { name: "Guayoyo",      art: "cup" },   pm: { name: "Ron",           art: "highball", liquid: "#A85A2A" }, greet: ["Buenos días", "Buenas noches"] },
    ecuador:     { accent: "#C49A2E", am: { name: "Café",         art: "cup" },   pm: { name: "Canelazo",      art: "highball", liquid: "#C97A2E" }, greet: ["Buenos días", "Buenas noches"] },
    peru:        { accent: "#C0392B", am: { name: "Café",         art: "cup" },   pm: { name: "Pisco Sour",    art: "highball", liquid: "#E8DAA0" }, greet: ["Buenos días", "Buenas noches"] },
    bolivia:     { accent: "#2E7A4A", am: { name: "Api",          art: "olla" },  pm: { name: "Singani",       art: "coupe",    liquid: "#E2DCC2" }, greet: ["Buenos días", "Buenas noches"] },
    chile:       { accent: "#2A4FA0", am: { name: "Café",         art: "cup" },   pm: { name: "Terremoto",     art: "highball", liquid: "#E6DCA6" }, greet: ["Buenos días", "Buenas noches"] },
    argentina:   { accent: "#4A90B8", am: { name: "Mate",         art: "mate" },  pm: { name: "Malbec",        art: "wine",     liquid: "#6E2A33" }, greet: ["Buen día", "Buenas noches"] },
    uruguay:     { accent: "#3F7FB0", am: { name: "Mate",         art: "mate" },  pm: { name: "Tannat",        art: "wine",     liquid: "#5A2230" }, greet: ["Buen día", "Buenas noches"] },
    paraguay:    { accent: "#C0392B", am: { name: "Tereré",       art: "mate", cold: true }, pm: { name: "Caña", art: "highball", liquid: "#C99A4A" }, greet: ["Buenos días", "Buenas noches"] },
  };

  window.SC.bebidas = { BEBIDAS, REGION_LABEL };
})();
