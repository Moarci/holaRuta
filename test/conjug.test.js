/*
 * conjug.test.js – Tests des Konjugations-Drill-Generators (SC.conjug).
 * Reine Logik, kein Browser nötig – window-Shim wie in numbers.test.js.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = {};
require(path.join(__dirname, "..", "conjug.js"));
const { conjug } = globalThis.window.SC;

// Kleines, in sich geschlossenes Fixture im Format von data.CONJUGATION.
const FIX = {
  persons: [
    { es: "yo", de: "ich" },
    { es: "tú", de: "du" },
    { es: "él / ella / usted", de: "er / sie / Sie" },
    { es: "nosotros / nosotras", de: "wir" },
    { es: "ustedes / ellos / ellas", de: "ihr & sie" },
  ],
  regular: [
    { title: "-ar · doblar (abbiegen)", forms: ["doblo", "doblas", "dobla", "doblamos", "doblan"] },
    { title: "-er · comer (essen)", forms: ["como", "comes", "come", "comemos", "comen"] },
    { title: "-ir · vivir (wohnen)", forms: ["vivo", "vives", "vive", "vivimos", "viven"] },
  ],
  irregular: [
    { verb: "ir", verbDe: "gehen", forms: ["voy", "vas", "va", "vamos", "van"] },
    { verb: "estar", verbDe: "sein", forms: ["estoy", "estás", "está", "estamos", "están"] },
  ],
};

test("infinitiveFromTitle: zieht den Infinitiv aus dem Muster-Titel", () => {
  assert.equal(conjug.infinitiveFromTitle("-ar · doblar (abbiegen)"), "doblar");
  assert.equal(conjug.infinitiveFromTitle("-ir · vivir (wohnen)"), "vivir");
  // Fällt auf den ganzen Titel zurück, wenn das Format abweicht.
  assert.equal(conjug.infinitiveFromTitle("seltsam"), "seltsam");
});

test("verbPool: Stufe 1 = nur regelmäßige, Stufe 2 = + unregelmäßige", () => {
  assert.equal(conjug.verbPool(FIX, 1).length, 3);
  assert.equal(conjug.verbPool(FIX, 2).length, 5);
});

test("poolSize: Verben × Personen", () => {
  assert.equal(conjug.poolSize(FIX, 1), 3 * 5);
  assert.equal(conjug.poolSize(FIX, 2), 5 * 5);
});

test("buildRound: liefert genau count Items mit konsistenten Feldern", () => {
  const round = conjug.buildRound(FIX, 2, 10);
  assert.equal(round.length, 10);
  for (const it of round) {
    assert.ok(typeof it.verb === "string" && it.verb.length > 0);
    assert.ok(typeof it.personEs === "string" && it.personEs.length > 0);
    assert.ok(typeof it.personDe === "string" && it.personDe.length > 0);
    assert.ok(typeof it.answer === "string" && it.answer.length > 0);
  }
});

test("buildRound: jede answer ist die echte Form des gezogenen Verbs/der Person", () => {
  const round = conjug.buildRound(FIX, 2, 30);
  // Verb-Lookup über alle Pools (Infinitiv bzw. verb).
  const byVerb = {};
  conjug.verbPool(FIX, 2).forEach((v) => { byVerb[v.verb] = v; });
  for (const it of round) {
    const v = byVerb[it.verb];
    assert.ok(v, `unbekanntes Verb ${it.verb}`);
    const pi = FIX.persons.findIndex((p) => p.es === it.personEs);
    assert.ok(pi >= 0, `unbekannte Person ${it.personEs}`);
    assert.equal(it.answer, v.forms[pi]);
  }
});

test("buildRound: vermeidet exakte Verb×Person-Dubletten solange möglich", () => {
  // Stufe 1 hat 15 mögliche Kombinationen -> 12 angeforderte müssen distinkt sein.
  const round = conjug.buildRound(FIX, 1, 12);
  const keys = new Set(round.map((it) => it.verb + "#" + it.personEs));
  assert.equal(keys.size, 12);
});

test("buildRound: füllt mit Wiederholung auf, wenn die Stufe zu klein ist", () => {
  // Stufe 1 hat nur 15 Kombinationen -> 20 angefordert: trotzdem 20 Items.
  const round = conjug.buildRound(FIX, 1, 20);
  assert.equal(round.length, 20);
});

test("buildRound: leere/kaputte Daten ergeben eine leere Runde (kein Crash)", () => {
  assert.deepEqual(conjug.buildRound(null, 1, 10), []);
  assert.deepEqual(conjug.buildRound({}, 1, 10), []);
});
