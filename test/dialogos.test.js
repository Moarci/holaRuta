/*
 * dialogos.test.js – Integritätstests der Gesprächs-Simulationen (SC.dialogos).
 * Reine Daten, kein Browser nötig – window-Shim wie in frases.test.js.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = {};
require(path.join(__dirname, "..", "dialogos.js"));
const { dialogos } = globalThis.window.SC;
const { DIALOGOS_SCENARIOS, DIALOGOS } = dialogos;

test("Szenarien: eindeutige IDs, Pflichtfelder, gültige Stufe", () => {
  const ids = DIALOGOS_SCENARIOS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(DIALOGOS_SCENARIOS.length >= 8, `nur ${DIALOGOS_SCENARIOS.length} Szenarien`);
  DIALOGOS_SCENARIOS.forEach((s) => {
    assert.ok(s.title && s.icon && s.intro, `Felder fehlen: ${s.id}`);
    assert.ok([1, 2, 3].includes(s.lvl), `ungültige Stufe: ${s.id}`);
  });
});

test("Dialoge: eindeutige IDs, jede cat verweist auf ein Szenario", () => {
  const ids = DIALOGOS.map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length);
  const scn = new Set(DIALOGOS_SCENARIOS.map((s) => s.id));
  DIALOGOS.forEach((d) => {
    assert.ok(scn.has(d.cat), `unbekannte cat: ${d.cat} (${d.id})`);
    assert.ok(Array.isArray(d.turns) && d.turns.length >= 4, `zu kurz: ${d.id}`);
  });
});

test("Jedes Szenario hat mindestens einen Dialog", () => {
  DIALOGOS_SCENARIOS.forEach((s) => {
    const n = DIALOGOS.filter((d) => d.cat === s.id).length;
    assert.ok(n >= 1, `Szenario ${s.id} hat keinen Dialog`);
  });
});

test("Züge: npc hat es/de, user hat Anweisung + Musterantwort", () => {
  DIALOGOS.forEach((d) => {
    d.turns.forEach((t, i) => {
      const where = `${d.id}#${i}`;
      if (t.who === "npc") {
        assert.ok(t.es && t.de, `npc ohne es/de: ${where}`);
      } else if (t.who === "user") {
        assert.ok(["mc", "type"].includes(t.kind), `user ohne gültiges kind: ${where}`);
        assert.ok(t.de && t.de.length > 0, `user ohne Anweisung: ${where}`);
        assert.ok(t.solEs && t.solEs.length > 0, `user ohne solEs: ${where}`);
      } else {
        assert.fail(`ungültiges who: ${where}`);
      }
    });
  });
});

test("User-Züge: erklärender Hintergrund (why/whyEn) ist gesetzt", () => {
  DIALOGOS.forEach((d) => {
    d.turns.forEach((t, i) => {
      if (t.who !== "user") return;
      const where = `${d.id}#${i}`;
      assert.ok(typeof t.why === "string" && t.why.trim().length > 0, `why fehlt: ${where}`);
      assert.ok(typeof t.whyEn === "string" && t.whyEn.trim().length > 0, `whyEn fehlt: ${where}`);
    });
  });
});

test("MC-Züge: genau eine richtige Option, mindestens zwei Optionen", () => {
  DIALOGOS.forEach((d) => {
    d.turns.forEach((t, i) => {
      if (t.who !== "user" || t.kind !== "mc") return;
      assert.ok(Array.isArray(t.options) && t.options.length >= 2, `zu wenige Optionen: ${d.id}#${i}`);
      const correct = t.options.filter((o) => o.ok === true).length;
      assert.equal(correct, 1, `genau eine richtige Option erwartet: ${d.id}#${i} (hat ${correct})`);
      // Die richtige Option sollte der Musterantwort entsprechen.
      const ok = t.options.find((o) => o.ok);
      assert.equal(ok.es, t.solEs, `solEs != richtige Option: ${d.id}#${i}`);
    });
  });
});

test("Type-Züge: accept ist (falls gesetzt) ein nichtleeres String-Array", () => {
  DIALOGOS.forEach((d) => {
    d.turns.forEach((t, i) => {
      if (t.who !== "user" || t.kind !== "type") return;
      if (t.accept === undefined) return; // optional: solEs allein reicht
      assert.ok(Array.isArray(t.accept) && t.accept.length > 0, `accept leer: ${d.id}#${i}`);
      t.accept.forEach((a) => assert.ok(typeof a === "string" && a.length > 0, `accept-Eintrag leer: ${d.id}#${i}`));
    });
  });
});

test("Jeder Dialog hat mindestens einen user-Zug (sonst nichts zu tun)", () => {
  DIALOGOS.forEach((d) => {
    const users = d.turns.filter((t) => t.who === "user").length;
    assert.ok(users >= 1, `kein user-Zug: ${d.id}`);
  });
});
