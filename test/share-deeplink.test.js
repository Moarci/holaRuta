/*
 * share-deeplink.test.js – Drift-Wächter für Sharepic-Deep-Links.
 * Nutzt den in Node eingebauten Test-Runner – KEINE Dependencies.
 *
 * Aufruf:  node --test
 *
 * Hintergrund: Jedes Sharepic kann im Begleittext einen Deep-Link (?m=<slug>)
 * tragen (payload.moduleSlug), damit ein angetippter Link nicht auf Home, sondern
 * direkt im passenden Modul/Test landet (Nivel-Test, HolaRuta-Check, Historia,
 * Reise-Tipps, Länderkunde …). Dieser Test stellt sicher, dass jeder fest
 * verdrahtete moduleSlug AUCH einen Opener im Deep-Link-Router hat – sonst führt
 * der geteilte Link ins Leere bzw. auf die Startseite.
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..");
const appjs = fs.readFileSync(path.join(SRC, "app.js"), "utf8");

// Schlüssel eines flachen Objekt-Literals aus app.js ziehen (bis zur ersten
// "};"-Zeile). Genügt für die hier geprüften Maps (keine verschachtelten Blöcke).
function objectKeys(label) {
  const start = appjs.indexOf(label);
  assert.ok(start >= 0, `app.js: "${label}" nicht gefunden`);
  const rest = appjs.slice(start + label.length);
  const endMatch = rest.match(/\n\s*};/);
  assert.ok(endMatch, `app.js: Ende von "${label}" nicht gefunden`);
  const body = rest.slice(0, endMatch.index);
  const keys = [];
  for (const m of body.matchAll(/^\s*(?:"([\w-]+)"|([\w-]+))\s*:/gm)) keys.push(m[1] || m[2]);
  return keys;
}

const openerSlugs = new Set(objectKeys("const openers = {"));

// Jeden fest verdrahteten moduleSlug-String aus app.js sammeln
// (moduleSlug: "nivel-test", moduleSlug: state.x ? "a" : "b", …). Identifier-Werte
// (moduleSlug: cat / id) werden separat über ihre Quell-Map geprüft.
function literalModuleSlugs() {
  const out = new Set();
  for (const m of appjs.matchAll(/moduleSlug:\s*([^,\n]+?)(?:,|\n)/g)) {
    let expr = m[1];
    // Bei einem Ternär (cond ? a : b) nur die Wert-Zweige betrachten, damit ein
    // Vergleichs-Literal in der Bedingung (=== "centro") nicht als Slug zählt.
    const q = expr.indexOf("?");
    if (q >= 0) expr = expr.slice(q + 1);
    for (const s of expr.matchAll(/"([\w-]+)"/g)) out.add(s[1]);
  }
  return [...out];
}

test("openers-Router hat Einträge", () => {
  assert.ok(openerSlugs.size > 0, "openers: keine Slugs gefunden");
});

test("Jeder fest verdrahtete Sharepic-moduleSlug ist per ?m= deeplinkbar", () => {
  const slugs = literalModuleSlugs();
  assert.ok(slugs.length > 0, "Keine moduleSlug-Literale gefunden");
  // Die neuen Ergebnis-/Inhalts-Sharepics müssen mit dabei sein (sonst stiller Verlust).
  for (const expect of ["nivel-test", "ruta-check", "paises", "historia", "historia-centro"]) {
    assert.ok(slugs.includes(expect), `Erwarteter Deep-Link-Slug "${expect}" fehlt in app.js`);
  }
  for (const slug of slugs) {
    assert.ok(openerSlugs.has(slug),
      `Sharepic verlinkt per ?m=${slug}, aber der Deep-Link-Router hat keinen Opener – führt auf Home`);
  }
});

// shareTips() reicht die Kategorie (TIPS_META-Schlüssel) als moduleSlug durch –
// jede Kategorie muss daher öffenbar sein.
test("Jede Reise-Tipps-Kategorie (TIPS_META) ist per ?m= deeplinkbar", () => {
  const cats = objectKeys("const TIPS_META = {");
  assert.ok(cats.length > 0, "TIPS_META: keine Kategorien gefunden");
  for (const cat of cats) {
    assert.ok(openerSlugs.has(cat),
      `Reise-Tipp "${cat}" ist teilbar (TIPS_META), aber ?m=${cat} hat keinen Opener`);
  }
});

// Sicherheits-Regressionsschutz (CodeQL js/unvalidated-dynamic-method-call):
// Der Deep-Link-Router darf einen URL-gesteuerten Slug NUR auf EIGENE Map-Keys
// dispatchen. Ohne hasOwnProperty-Guard träfe z. B. ?m=toString / ?a=constructor
// eine geerbte Object.prototype-Methode und riefe sie als „Opener" auf.
test("Deep-Link-Dispatch nur über eigene Keys (hasOwnProperty-Guard)", () => {
  assert.match(appjs, /hasOwnProperty\.call\(actions,\s*aSlug\)/,
    "actions-Dispatch (?a=) ohne hasOwnProperty-Guard");
  assert.match(appjs, /hasOwnProperty\.call\(openers,\s*slug\)/,
    "openers-Dispatch (?m=) ohne hasOwnProperty-Guard");
  // Die alten ungeschützten Direktzugriffe dürfen NICHT zurückkehren.
  assert.doesNotMatch(appjs, /if\s*\(aSlug\s*&&\s*actions\[aSlug\]\)/,
    "alter ungeschützter actions[aSlug]-Truthy-Check wieder da");
});
