/*
 * landing-icons.test.js – wacht über das Icon-Sprite der Landing-Pages.
 * Die lpi-*-Symbole in landing*.html übernehmen ihre Geometrie 1:1 aus
 * icons.js (SC.icon, vendored Lucide); dieser Test hält beide Quellen im
 * Gleichstand und prüft, dass jede <use>-Referenz auf ein Symbol derselben
 * Seite zeigt (ein Tippfehler rendert sonst still ein leeres Icon).
 * Nutzt den Node-Test-Runner – keine Dependencies.
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..");
const PAGES = [
  "landing.html",
  "landing-hostel.html",
  "landing-schule.html",
  "landing-reiseanbieter.html",
  "landing-locals.html",
];

// icons.js nicht ausführen (Browser-Modul), sondern die PATHS-Literale lesen.
const iconsSrc = fs.readFileSync(path.join(SRC, "icons.js"), "utf8");
const PATHS = {};
for (const m of iconsSrc.matchAll(/"([a-z0-9-]+)":\s*'([^']*)'/g)) PATHS[m[1]] = m[2];

// Bewusst handgezeichnete Icons ohne Lucide-Pendant in icons.js.
const HAND_DRAWN = new Set(["cards", "sliders", "wifi-off", "gift", "qr"]);

const SYMBOL_RX = /<symbol id="lpi-([a-z0-9-]+)"[^>]*>(.*?)<\/symbol>/gs;
const USE_RX = /<use href="#lpi-([a-z0-9-]+)"\/>/g;

test("icons.js: PATHS gefunden (Parser-Wächter)", () => {
  assert.ok(Object.keys(PATHS).length > 100, "PATHS aus icons.js unerwartet klein – Format geändert?");
});

for (const page of PAGES) {
  const html = fs.readFileSync(path.join(SRC, page), "utf8");
  const symbols = new Map();
  for (const m of html.matchAll(SYMBOL_RX)) symbols.set(m[1], m[2]);

  test(`${page}: Sprite vorhanden und jede use-Referenz löst auf`, () => {
    assert.ok(symbols.size > 0, "kein lpi-Sprite gefunden");
    const used = new Set();
    for (const m of html.matchAll(USE_RX)) used.add(m[1]);
    assert.ok(used.size > 0, "keine lpi-Referenzen gefunden");
    for (const name of used) assert.ok(symbols.has(name), `use #lpi-${name} ohne Symbol auf der Seite`);
    for (const name of symbols.keys()) assert.ok(used.has(name), `Symbol lpi-${name} wird nicht genutzt (tote Bytes)`);
  });

  test(`${page}: Symbol-Geometrie stimmt mit icons.js überein`, () => {
    for (const [name, inner] of symbols) {
      if (HAND_DRAWN.has(name)) {
        assert.ok(!PATHS[name], `lpi-${name} ist als handgezeichnet markiert, existiert aber in icons.js – von dort übernehmen`);
        continue;
      }
      assert.ok(PATHS[name], `lpi-${name} weder in icons.js noch als handgezeichnet bekannt`);
      assert.equal(inner, PATHS[name], `lpi-${name} weicht von icons.js ab – Geometrie dort pflegen und Sprite angleichen`);
    }
  });

  test(`${page}: Icon-Instanzen sind selbsttragend dimensioniert (1em)`, () => {
    // Ohne width/height fiele ein Icon bei HTML/CSS-Cache-Versatz auf die
    // 300x150-Default-Größe zurück und sprengte die Kacheln.
    const bare = html.match(/<svg aria-hidden="true"><use href="#lpi-/);
    assert.equal(bare, null, "lpi-Instanz ohne width/height=\"1em\" gefunden");
  });
}
