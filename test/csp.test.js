/*
 * csp.test.js – Drift-Wächter für die gehärtete Content-Security-Policy.
 * Nutzt den in Node eingebauten Test-Runner – KEINE Dependencies.
 *
 * Aufruf:  node --test
 *
 * Abgesichert wird die Verdrahtung (die Laufzeit prüft scripts/e2e-verify.mjs:
 * Theme wirkt, Splash blendet aus, keine CSP-Verstöße in der Konsole):
 *   1. index.html enthält KEIN Inline-Skript mehr – alle <script> tragen src,
 *      außer reinen Datenblöcken (type="application/ld+json" für strukturierte
 *      Daten; laut HTML-Spec kein ausführbares Skript, daher CSP-unabhängig).
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
const { readAssets } = require("../swversion.js");

const SRC = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(SRC, f), "utf8");

test("CSP: index.html enthält kein Inline-Skript (alle <script> mit src, außer reine Datenblöcke)", () => {
  const html = read("index.html");
  // Inline-<script> = ein Öffnungs-Tag OHNE src=. Bewusst per String-Scan
  // (indexOf, case-insensitiv über eine Kleinschreib-Kopie) statt eines
  // HTML-Tag-Filter-Regex: ein solcher Regex triggert js/bad-tag-filter (CodeQL)
  // und übersieht z. B. <SCRIPT> in Großschreibung. An jedem „<script" bis zum
  // nächsten „>" schauen, ob das Öffnungs-Tag ein src-Attribut trägt.
  //
  // Ausnahme: <script type="application/ld+json"> (strukturierte Daten). Laut
  // HTML-Spec ist das KEIN "script element", das ausgeführt wird, sondern ein
  // reiner Datenblock – Browser wenden script-src-CSP nicht darauf an (siehe
  // MDN/CSP3 §script-src, "script elements ... which are not blocked by the
  // policy" schließt Nicht-JS-Typen aus). script-src 'self' ohne
  // 'unsafe-inline' bleibt dadurch unverändert wirksam gegen echten Inline-JS.
  const hay = html.toLowerCase();
  const inline = [];
  for (let i = hay.indexOf("<script"); i !== -1; i = hay.indexOf("<script", i + 7)) {
    // Zeichen direkt nach "<script" muss Tag-Grenze sein (Whitespace/>/), sonst
    // ist es ein anderer Tag/Text wie "<scripting" – kein Inline-Skript.
    const after = hay[i + 7];
    if (after && !/[\s>/]/.test(after)) continue;
    const gt = hay.indexOf(">", i);
    const openTag = hay.slice(i, gt === -1 ? hay.length : gt);
    if (/\bsrc\s*=/.test(openTag)) continue;
    if (/type\s*=\s*["']application\/ld\+json["']/.test(openTag)) continue;
    inline.push(html.slice(i, i + 40));
  }
  assert.equal(inline.length, 0,
    `index.html enthält ${inline.length} Inline-<script> – unter script-src 'self' geblockt (nach boot.js auslagern):\n${inline.join("\n")}`);
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
  // Inline-Handler wie onerror=… im per innerHTML gesetzten Markup werden unter
  // script-src 'self' geblockt (stille Fehlfunktion). Ausblende-Fallback für
  // Bilder läuft delegiert über data-img-fallback (error-Listener in app.js).
  // readAssets() (swversion.js, eine Quelle der Wahrheit) statt eigener ASSETS-
  // Regex: wirft bei kaputter/umbenannter Liste HART, statt still 0 Dateien zu
  // prüfen (dann wäre der Wächter wirkungslos grün). index.html wird mitgescannt.
  const targets = ["index.html", ...readAssets().filter((f) => /\.js$/.test(f))];
  // KEIN Quote-Zwang nach '=': auch unquoted Handler (onerror=hide(this)) sind
  // legales HTML und würden von der CSP geblockt – die Vor-CSP-Schreibweise.
  const RE = /<[a-z][^<>]*\son[a-z]+\s*=/gi;
  const offenders = [];
  for (const f of targets) {
    if (!fs.existsSync(path.join(SRC, f))) continue;
    for (const m of read(f).matchAll(RE)) offenders.push(`${f}: …${m[0].slice(-50)}`);
  }
  assert.deepEqual(offenders, [], `Inline-Event-Handler gefunden (CSP blockt sie):\n${offenders.join("\n")}`);
});

test("CSP: build.js patcht 'unsafe-inline' für den Single-File-Build zurück (auf die Meta geankert)", () => {
  const build = read("build.js");
  // Der Patch muss auf das CSP-Meta-Tag geankert sein (nicht bloß erstes
  // Vorkommen im ganzen Dokument), sonst könnte ein eingebetteter Kommentar mit
  // demselben String die Direktive fehlleiten → stumme weiße Seite.
  assert.ok(/Content-Security-Policy[^]*?script-src 'self';/.test(build),
    "build.js: CSP-Patch ist nicht auf das CSP-Meta-Tag geankert (Fehlleitung durch Kommentare möglich)");
  assert.ok(build.includes("'self' 'unsafe-inline';"),
    "build.js: CSP-Patch fügt 'unsafe-inline' nicht zurück – HolaRuta.html bräche stumm");
  assert.ok(/CSP-Patch griff nicht/.test(build),
    "build.js: harter Fehler bei nicht greifendem CSP-Patch fehlt");
});
