/*
 * shortcuts.test.js – Drift-Wächter für Homescreen-Shortcuts.
 * Nutzt den in Node eingebauten Test-Runner – KEINE Dependencies.
 *
 * Aufruf:  node --test
 *
 * Prüft, dass jeder Manifest-Shortcut auf ein Ziel zeigt, das app.js wirklich
 * öffnen kann (?a=<aktion> bzw. ?m=<modul>), und dass alle von Shortcuts
 * referenzierten Icons existieren UND im Service-Worker-Precache stehen (sonst
 * funktionieren sie offline nicht).
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(SRC, f), "utf8");
const normalize = (p) => p.replace(/^\.\//, "");
const isLocal = (p) => !/^(https?:)?\/\//i.test(p) && !/^data:/i.test(p);

const manifest = JSON.parse(read("manifest.webmanifest"));
const appjs = read("app.js");

// ASSETS-Liste aus dem Service Worker ziehen (wie sw-assets.test.js).
function swAssets() {
  const m = read("service-worker.js").match(/const ASSETS\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(m, "service-worker.js: ASSETS-Liste nicht gefunden");
  return new Set([...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => normalize(x[1])));
}
const assetSet = swAssets();

// Steht <slug> als Schlüssel in einer der Opener-/Aktions-Maps in app.js?
function hasOpener(slug) {
  const re = new RegExp('(^|[\\s{,])(?:"' + slug + '"|' + slug + ')\\s*:', "m");
  return re.test(appjs);
}

// Ziel-Slug eines Shortcut-URLs lesen: ./?a=ruta -> {kind:"a", slug:"ruta"}
function targetOf(url) {
  const q = url.split("?")[1] || "";
  const params = new URLSearchParams(q);
  if (params.get("a")) return { kind: "a", slug: params.get("a") };
  if (params.get("m")) return { kind: "m", slug: params.get("m") };
  return null;
}

test("Manifest hat eine nicht-leere shortcuts-Liste", () => {
  assert.ok(Array.isArray(manifest.shortcuts) && manifest.shortcuts.length > 0,
    "manifest.shortcuts fehlt oder ist leer");
});

test("Jeder Shortcut hat Name + relativen url + öffenbares Ziel", () => {
  for (const sc of manifest.shortcuts) {
    assert.ok(sc.name, `Shortcut ohne name: ${JSON.stringify(sc)}`);
    assert.ok(typeof sc.url === "string" && sc.url.startsWith("./"),
      `Shortcut "${sc.name}": url muss relativ ("./…") sein, ist "${sc.url}"`);
    const t = targetOf(sc.url);
    assert.ok(t, `Shortcut "${sc.name}": url "${sc.url}" hat kein ?a=/?m= Ziel`);
    assert.ok(hasOpener(t.slug),
      `Shortcut "${sc.name}": app.js kann "${t.slug}" nicht öffnen (Opener/Aktion fehlt)`);
  }
});

test("Jedes Shortcut-Icon existiert und ist im SW-Precache", () => {
  for (const sc of manifest.shortcuts) {
    for (const ic of sc.icons || []) {
      if (!isLocal(ic.src)) continue;
      const ref = normalize(ic.src);
      assert.ok(fs.existsSync(path.join(SRC, ref)), `Shortcut-Icon "${ref}" existiert nicht`);
      assert.ok(assetSet.has(ref), `Shortcut-Icon "${ref}" fehlt im SW-Precache (offline kaputt)`);
    }
  }
});
