/*
 * numbers.test.js – Tests des Zahl→Wort-Wandlers und des Preis-Generators
 * (SC.numbers). Reine Logik, kein Browser nötig – window-Shim wie in sc.test.js.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = {};
require(path.join(__dirname, "..", "numbers.js"));
const { numbers } = globalThis.window.SC;

// ---------- toWords: Grundzahlen ----------
test("numbers.toWords: Einer, Teens & die Einwort-Zwanziger (mit Akzent)", () => {
  assert.equal(numbers.toWords(0), "cero");
  assert.equal(numbers.toWords(1), "uno");
  assert.equal(numbers.toWords(15), "quince");
  assert.equal(numbers.toWords(16), "dieciséis");
  assert.equal(numbers.toWords(21), "veintiuno");
  assert.equal(numbers.toWords(22), "veintidós");
  assert.equal(numbers.toWords(29), "veintinueve");
});

test("numbers.toWords: ab 31 'Zehner y Einer'", () => {
  assert.equal(numbers.toWords(30), "treinta");
  assert.equal(numbers.toWords(31), "treinta y uno");
  assert.equal(numbers.toWords(45), "cuarenta y cinco");
  assert.equal(numbers.toWords(99), "noventa y nueve");
});

test("numbers.toWords: Hunderter inkl. cien/ciento und Unregelmäßige", () => {
  assert.equal(numbers.toWords(100), "cien");                 // genau 100
  assert.equal(numbers.toWords(101), "ciento uno");           // ab 101: ciento …
  assert.equal(numbers.toWords(150), "ciento cincuenta");
  assert.equal(numbers.toWords(200), "doscientos");
  assert.equal(numbers.toWords(500), "quinientos");           // unregelmäßig
  assert.equal(numbers.toWords(700), "setecientos");          // unregelmäßig
  assert.equal(numbers.toWords(900), "novecientos");          // unregelmäßig
  assert.equal(numbers.toWords(999), "novecientos noventa y nueve");
});

test("numbers.toWords: Tausender – 'mil' nie als 'un mil', Apokope vor mil", () => {
  assert.equal(numbers.toWords(1000), "mil");
  assert.equal(numbers.toWords(2000), "dos mil");
  assert.equal(numbers.toWords(1500), "mil quinientos");
  assert.equal(numbers.toWords(21000), "veintiún mil");       // Apokope vor 'mil'
  assert.equal(numbers.toWords(31000), "treinta y un mil");
  assert.equal(numbers.toWords(100000), "cien mil");          // nicht 'ciento mil'
  assert.equal(numbers.toWords(150000), "ciento cincuenta mil");
  assert.equal(numbers.toWords(200000), "doscientos mil");
});

test("numbers.toWords: große Beträge (Kolumbien-Größenordnung)", () => {
  assert.equal(numbers.toWords(1000000), "un millón");        // mit 'un'
  assert.equal(numbers.toWords(2000000), "dos millones");
  assert.equal(numbers.toWords(1500000), "un millón quinientos mil");
  assert.equal(numbers.toWords(1250000), "un millón doscientos cincuenta mil");
  assert.equal(numbers.toWords(2347000), "dos millones trescientos cuarenta y siete mil");
  assert.equal(numbers.toWords(21000000), "veintiún millones"); // Apokope vor 'millones'
  assert.equal(numbers.toWords(5000000), "cinco millones");
});

// ---------- amount: Preisangabe mit Währung ----------
test("numbers.amount: Singular/Plural & Apokope vor dem Nomen", () => {
  const peso = { one: "peso", many: "pesos" };
  assert.equal(numbers.amount(1, peso), "un peso");            // genau 1: Singular
  assert.equal(numbers.amount(2, peso), "dos pesos");
  assert.equal(numbers.amount(21, peso), "veintiún pesos");    // Apokope, plural
  assert.equal(numbers.amount(31, peso), "treinta y un pesos");
  assert.equal(numbers.amount(101, peso), "ciento un pesos");
});

test("numbers.amount: 'de'-Regel nur bei vollen Millionen", () => {
  const peso = { one: "peso", many: "pesos" };
  assert.equal(numbers.amount(1000000, peso), "un millón de pesos");
  assert.equal(numbers.amount(2000000, peso), "dos millones de pesos");
  assert.equal(numbers.amount(1500000, peso), "un millón quinientos mil pesos"); // ohne 'de'
  assert.equal(numbers.amount(3500000, peso), "tres millones quinientos mil pesos");
});

test("numbers.amount: andere Währungen mit eigener Pluralform", () => {
  const sol = { one: "sol", many: "soles" };
  const colon = { one: "colón", many: "colones" };
  const quetzal = { one: "quetzal", many: "quetzales" };
  assert.equal(numbers.amount(1, sol), "un sol");
  assert.equal(numbers.amount(21, sol), "veintiún soles");
  assert.equal(numbers.amount(1, colon), "un colón");
  assert.equal(numbers.amount(2000000, colon), "dos millones de colones");
  assert.equal(numbers.amount(1, quetzal), "un quetzal");
  assert.equal(numbers.amount(40, quetzal), "cuarenta quetzales");
});

// ---------- format: Tausenderpunkte ----------
test("numbers.format: Punkt-Tausendertrennung", () => {
  assert.equal(numbers.format(500), "500");
  assert.equal(numbers.format(1000), "1.000");
  assert.equal(numbers.format(1250000), "1.250.000");
});

// ---------- Generator: realistische Beträge in Spanne & Schritt ----------
test("numbers.randomPrice: bleibt in der Spanne und folgt dem Schritt", () => {
  for (const key of numbers.CURRENCY_ORDER) {
    for (let lvl = 1; lvl <= 3; lvl++) {
      const tier = numbers.tierFor(key, lvl);
      for (let i = 0; i < 200; i++) {
        const p = numbers.randomPrice(key, lvl);
        assert.ok(p.value >= tier.min && p.value <= tier.max,
          `${key} L${lvl}: ${p.value} außerhalb [${tier.min}, ${tier.max}]`);
        const step = (lvl >= 3 && tier.fine) ? tier.fine : tier.step;
        assert.equal(p.value % step, 0, `${key} L${lvl}: ${p.value} kein Vielfaches von ${step}`);
        // Generiertes Objekt ist konsistent: Ziffern und Wörter passen zum Wert.
        assert.equal(p.digits, numbers.format(p.value));
        assert.ok(p.es.length > 0);
      }
    }
  }
});

test("numbers.buildRound: liefert die gewünschte Anzahl, möglichst distinkt", () => {
  const round = numbers.buildRound("CO", 3, 10);
  assert.equal(round.length, 10);
  const distinct = new Set(round.map((r) => r.value));
  // Bei der großen COP-Spanne (L3) praktisch immer 10 verschiedene Werte.
  assert.equal(distinct.size, 10);
  round.forEach((r) => assert.match(r.es, /pesos|peso/));
});

test("numbers.currencyList: Kolumbien steht als Aushängeschild vorn", () => {
  const list = numbers.currencyList();
  assert.ok(list.length >= 5);
  assert.equal(list[0].key, "CO");
  list.forEach((c) => {
    assert.ok(c.flag && c.name && c.one && c.many);
    assert.equal(c.levels.length, 3);
  });
});

// ---------- Gegenprobe: deckt sich mit den festen Karten in data.js ----------
test("numbers.toWords: stimmt mit den gepflegten Zahlen-Karten überein", () => {
  // window-Shim mit data.js erneut laden würde Module mischen; wir prüfen daher
  // nur eine repräsentative, fest verdrahtete Stichprobe (Quelle: data.js).
  const expect = {
    58: "cincuenta y ocho",
    365: "trescientos sesenta y cinco",
    999: "novecientos noventa y nueve",
    2025: "dos mil veinticinco",
    25000: "veinticinco mil",
    850000: "ochocientos cincuenta mil",
    1500000: "un millón quinientos mil",
    3500000: "tres millones quinientos mil",
  };
  Object.entries(expect).forEach(([n, words]) => {
    assert.equal(numbers.toWords(Number(n)), words, `toWords(${n})`);
  });
});
