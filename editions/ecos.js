/*
 * editions/ecos.js – Beispiel-Edition „HolaRuta · ECOS" (Cartagena).
 *
 * REINE DATEN. Wird vom Edition-Build vor config.js eingebunden:
 *   node build.js --edition=ecos   →   HolaRuta-ecos.html
 *
 * Hinweis: Logo/Name/URL eines Partners nur mit dessen Freigabe verwenden.
 * Bis dahin neutral co-branded (Akzentfarbe + „· ECOS"-Textzusatz, ohne Logo).
 */
window.SC = window.SC || {};
window.SC.editionConfig = {
  edition: "ecos",
  brandName: "HolaRuta · ECOS",
  accent: { brand: "#1F7A8C", brandInk: "#155C69", theme: "#0F2A31" }, // Karibik-Teal
  partner: { name: "ECOS · Cartagena" }, // url erst mit Partner-Freigabe
  defaultDestination: "Cartagena",        // surft die Pre-Arrival-Kachel an
};
