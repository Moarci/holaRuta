/*
 * csp.test.js – Drift-Wächter für die gehärtete Content-Security-Policy.
 * Nutzt den in Node eingebauten Test-Runner – KEINE Dependencies.
 *
 * Aufruf:  node --test
 *
 * Abgesichert wird die Verdrahtung (die Laufzeit prüft scripts/e2e-verify.mjs:
 * Theme wirkt, Splash blendet aus, keine CSP-Verstöße in der Konsole):
 *   1. index.html enthält KEIN Inline-Skript mehr – alle <script> tragen src.
 *      Nur so darf script-src 'self' (ohne 'unsafe-inline') gesetzt sein.
 *   2. Die CSP-Meta erzwingt script-src 'self' ohne 'unsafe-inline'.
 *   3. boot.js ist parser-blockend (ohne defer) VOR dem Stylesheet verdrahtet –
 *      sonst blitzt die App im Dark Mode beim Kaltstart hell auf (Theme-FOUC).
 *   4. build.js patcht 'unsafe-inline' für den Single-File-Build zurück
 *      (dort sind ~50 Skripte inline eingebettet) – mit hartem Fehler bei Drift.
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(SRC, f), "utf8");

test("CSP: index.html enthält kein Inline-Skript (alle <script> mit src)", () => {
  const html = read("index.html");
  const inline = [...html.matchAll(/<script\b([^>]*)>/g)].filter((m) => !/\bsrc=/.test(m[1]));
  assert.equal(inline.length, 0,
    `index.html enthält ${inline.length} Inline-<script> – unter script-src 'self' geblockt (nach boot.js auslagern)`);
});

test("CSP: script-src 'self' ohne 'unsafe-inline' in der Meta", () => {
  const html = read("index.html");
  const m = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
  assert.ok(m, "index.html: CSP-Meta nicht gefunden");
  const scriptSrc = (m[1].match(/script-src ([^;]+)/) || [])[1] || "";
  assert.equal(scriptSrc.trim(), "'self'",
    `script-src ist "${scriptSrc.trim()}" statt "'self'" – Härtung aufgeweicht?`);
});

test("CSP: boot.js parser-blockend (ohne defer) VOR dem Stylesheet", () => {
  const html = read("index.html");
  const boot = html.match(/<script([^>]*)\bsrc="boot\.js"([^>]*)>/);
  assert.ok(boot, "index.html: <script src=\"boot.js\"> fehlt");
  assert.ok(!/\bdefer\b/.test(boot[1] + boot[2]),
    "boot.js darf KEIN defer tragen (Theme muss vor dem ersten Paint stehen)");
  const bootPos = html.indexOf('src="boot.js"');
  const cssPos = html.indexOf('rel="stylesheet"');
  assert.ok(cssPos > -1 && bootPos < cssPos, "boot.js muss VOR dem Stylesheet-Link stehen (Theme-FOUC)");
});

test("CSP: keine Inline-Event-Handler in gerenderten Templates (onerror= etc.)", () => {
  // Inline-Handler wie onerror="…" im per innerHTML gesetzten Markup werden
  // unter script-src 'self' geblockt (stille Fehlfunktion). Ausblende-Fallback
  // für Bilder läuft delegiert über data-img-fallback (error-Listener in app.js).
  const sw = read("service-worker.js");
  const assets = [...(sw.match(/const ASSETS\s*=\s*\[([\s\S]*?)\]/) || ["", ""])[1]
    .matchAll(/["']\.\/([^"']+\.js)["']/g)].map((m) => m[1]);
  const offenders = [];
  for (const f of assets) {
    if (!fs.existsSync(path.join(SRC, f))) continue;
    const src = read(f);
    for (const m of src.matchAll(/<[a-z][^<>]*\son[a-z]+=["']/gi)) offenders.push(`${f}: …${m[0].slice(-40)}`);
  }
  assert.deepEqual(offenders, [], `Inline-Event-Handler gefunden (CSP blockt sie):\n${offenders.join("\n")}`);
});

test("CSP: build.js patcht 'unsafe-inline' für den Single-File-Build zurück", () => {
  const build = read("build.js");
  assert.ok(build.includes(`html.replace("script-src 'self';", "script-src 'self' 'unsafe-inline';")`),
    "build.js: CSP-Patch für die Einzeldatei fehlt – HolaRuta.html bräche stumm");
  assert.ok(/CSP-Patch griff nicht/.test(build),
    "build.js: harter Fehler bei nicht greifendem CSP-Patch fehlt");
});
