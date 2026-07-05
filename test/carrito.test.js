/*
 * carrito.test.js – „El carrito" (Chicos que venden, loc-nino): die Lern-Inhalte
 * (Kategorien/Karten im Locals-Track) und das Verkaufs-Rollenspiel (SC.ventaRoleplay).
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

// Locals-Track aktiv setzen (wie Build/Runtime), damit die loc-nino-Karten im Korpus sind.
globalThis.window = globalThis.window || {};
require(path.join(__dirname, "..", "editions", "registry.js"));
window.SC.editionConfig = window.SC.editions["ingles-pro"];
require(path.join(__dirname, "..", "config.js"));
require(path.join(__dirname, "..", "data.js"));
require(path.join(__dirname, "..", "data.locals.js"));
require(path.join(__dirname, "..", "venta-roleplay.js"));
const { data, dataLocals, ventaRoleplay } = window.SC;

test("Inhalt: die vier loc-nino-Kategorien existieren mit Karten", () => {
  const wanted = ["carrito", "vender-nino", "precios-nino", "charla-nino"];
  const nino = dataLocals.CATEGORIES.filter((c) => c.group === "loc-nino").map((c) => c.id);
  assert.deepEqual(nino.sort(), wanted.slice().sort(), "genau die vier loc-nino-Kategorien");
  for (const id of wanted) {
    const cards = data.CARDS.filter((c) => c.cat === id);
    assert.ok(cards.length >= 8, `Kategorie ${id} hat genug Karten (${cards.length})`);
    for (const c of cards) {
      assert.ok(c.es && c.en, `${c.id} hat es+en`);
      assert.ok(c.tip && c.tip.length, `${c.id} hat eine Aussprachehilfe (tip)`);
    }
  }
});

test("Rollenspiel: SC.ventaRoleplay hat saubere Solo-Szenen", () => {
  assert.ok(ventaRoleplay && Array.isArray(ventaRoleplay.SCENES) && ventaRoleplay.SCENES.length >= 3);
  const ids = new Set();
  for (const s of ventaRoleplay.SCENES) {
    assert.ok(s.id && !ids.has(s.id), `Szene-Id eindeutig: ${s.id}`);
    ids.add(s.id);
    assert.ok(s.title && s.title.es && s.title.en, `${s.id}: title es/en`);
    assert.ok(Array.isArray(s.turns) && s.turns.length > 0, `${s.id}: hat Züge`);
    let userTurns = 0;
    for (const tn of s.turns) {
      if (tn.role === "npc") {
        assert.ok(tn.en && tn.es, `${s.id}: NPC-Zug hat en+es`);
      } else {
        userTurns++;
        assert.ok(tn.instr && tn.instr.es, `${s.id}: user-Zug hat spanische Anweisung`);
        assert.ok(!tn.instr.en || tn.instr.es, `${s.id}: Anweisung nie NUR englisch (verrät die Lösung)`);
        assert.ok(Array.isArray(tn.options) && tn.options.length === 3, `${s.id}: 3 Optionen`);
        const oks = tn.options.filter((o) => o.ok);
        assert.equal(oks.length, 1, `${s.id}: genau eine richtige Option`);
        assert.equal(tn.say, oks[0].t, `${s.id}: say == richtige Option (Modellzeile)`);
      }
    }
    assert.ok(userTurns > 0, `${s.id}: hat user-Züge`);
  }
});
