/*
 * editions/weroad.js – Beispiel-Edition „HolaRuta · WeRoad Colombia".
 *
 * REINE DATEN. Edition-Build:
 *   node build.js --edition=weroad   →   HolaRuta-weroad.html
 *
 * Hinweis: Logo/Name/URL eines Partners nur mit dessen Freigabe verwenden.
 */
window.SC = window.SC || {};
window.SC.editionConfig = {
  edition: "weroad",
  brandName: "HolaRuta · WeRoad Colombia",
  accent: { brand: "#E0533A", brandInk: "#B53C28" }, // kräftiges Coral
  partner: { name: "WeRoad Colombia" }, // url erst mit Partner-Freigabe
  defaultDestination: "Colombia",         // surft die Pre-Arrival-Kachel an
};
