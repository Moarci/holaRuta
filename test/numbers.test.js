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

test("numbers.toWords: außerhalb der Domäne (≥ 1e9) wird geklemmt, nie 'undefined'", () => {
  // Definiert ist 0 … 999.999.999; größere Werte klemmen auf das Maximum.
  const max = numbers.toWords(999999999);
  assert.ok(max && !/undefined/.test(max), "Maximalwert ist ein definiertes Zahlwort");
  for (const v of [1e9, 5e9, 1234567890, Number.MAX_SAFE_INTEGER]) {
    const w = numbers.toWords(v);
    assert.ok(typeof w === "string" && w.length > 0 && !/undefined/.test(w), `toWords(${v}) ist definiert: ${w}`);
    assert.equal(w, max, `toWords(${v}) ist auf das Domänen-Maximum geklemmt`);
  }
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

// ---------- tierFor: exakte Stufen-Spannen (Schutz der Datenliterale) ----------
// Hartkodierte Erwartung je Währung/Stufe – fängt JEDE versehentliche Änderung
// eines min/max/step/fine-Literals in CURRENCIES (sonst „still" mutierbar).
test("numbers.tierFor: liefert exakt die gepflegten Spannen je Währung", () => {
  const EXPECT = {
    CO: [{ min: 500, max: 20000, step: 500 }, { min: 10000, max: 200000, step: 1000, fine: 500 }, { min: 100000, max: 5000000, step: 10000, fine: 1000 }],
    CL: [{ min: 300, max: 15000, step: 100 }, { min: 5000, max: 150000, step: 1000, fine: 500 }, { min: 100000, max: 8000000, step: 10000, fine: 1000 }],
    AR: [{ min: 500, max: 20000, step: 100 }, { min: 10000, max: 300000, step: 1000, fine: 500 }, { min: 100000, max: 9000000, step: 10000, fine: 1000 }],
    CR: [{ min: 100, max: 5000, step: 100 }, { min: 1000, max: 50000, step: 500, fine: 100 }, { min: 25000, max: 2000000, step: 1000, fine: 500 }],
    MX: [{ min: 5, max: 200, step: 5 }, { min: 50, max: 2000, step: 10, fine: 5 }, { min: 500, max: 50000, step: 100, fine: 50 }],
    PE: [{ min: 2, max: 100, step: 1 }, { min: 20, max: 500, step: 5 }, { min: 100, max: 9000, step: 10, fine: 5 }],
    GT: [{ min: 5, max: 150, step: 5 }, { min: 50, max: 1500, step: 10 }, { min: 300, max: 40000, step: 100, fine: 50 }],
  };
  for (const key of numbers.CURRENCY_ORDER) {
    for (let lvl = 1; lvl <= 3; lvl++) {
      assert.deepEqual(numbers.tierFor(key, lvl), EXPECT[key][lvl - 1], `${key} L${lvl}`);
    }
  }
});

// tierFor klemmt die Stufe 1-basiert: <1 -> erste, >max -> letzte, ungültig -> 1.
test("numbers.tierFor: Stufe wird 1-basiert auf [0 .. letzte] geklemmt", () => {
  const co = numbers.currency("CO");
  assert.deepEqual(numbers.tierFor("CO", 1), co.levels[0]); // genau 1 -> Index 0
  assert.deepEqual(numbers.tierFor("CO", 2), co.levels[1]);
  assert.deepEqual(numbers.tierFor("CO", 3), co.levels[2]); // genau 3 -> Index 2 (letzte)
  assert.deepEqual(numbers.tierFor("CO", 0), co.levels[0]); // unter 1 -> erste
  assert.deepEqual(numbers.tierFor("CO", -5), co.levels[0]);
  assert.deepEqual(numbers.tierFor("CO", 99), co.levels[2]); // über max -> letzte
  assert.deepEqual(numbers.tierFor("CO", undefined), co.levels[0]); // Default 1 -> erste
  // String-Währung wird zur Definition aufgelöst (gleiches Objekt wie currency())
  assert.equal(numbers.tierFor("CO", 2), co.levels[1]);
});

// randInt schließt die Obergrenze ein (a + floor(rnd*(b-a+1))): bei rnd≈1 muss
// der Höchstwert der Spanne fallen – sonst wäre das Spannen-Maximum unerreichbar.
test("numbers.randomPrice: erreicht bei rnd≈1 das Spannen-Maximum", () => {
  const orig = Math.random;
  Math.random = () => 0.9999999;
  try {
    // CO L1 = {min:500,max:20000,step:500}: lo=1, hi=40 -> 40*500 = 20000 (=max)
    assert.equal(numbers.randomPrice("CO", 1).value, 20000);
    // PE L1 = {min:2,max:100,step:1}: lo=2, hi=100 -> 100
    assert.equal(numbers.randomPrice("PE", 1).value, 100);
  } finally { Math.random = orig; }
});

// An der 0,5-Grenze nimmt der Generator den GROBEN Schritt (`random() < 0.5`
// ist ausschließend). Deterministisch über einen Math.random-Stub geprüft – der
// feine vs. grobe Schritt liefert hier nachweislich verschiedene Beträge.
test("numbers.randomPrice: bei random()===0.5 gilt der grobe Schritt (< ist exklusiv)", () => {
  const orig = Math.random;
  Math.random = () => 0.5;
  try {
    // CR L3 = {min:25000,max:2000000,step:1000,fine:500}: grob -> 1.013.000,
    // fein würde 1.012.500 ergeben (anderer Schritt, dadurch unterscheidbar).
    assert.equal(numbers.randomPrice("CR", 3).value, 1013000);
  } finally { Math.random = orig; }
});

test("numbers.amount: ungültiger/0-Betrag fällt auf 0 zurück (nicht auf 1)", () => {
  const peso = { one: "peso", many: "pesos" };
  assert.equal(numbers.amount(0, peso), "cero pesos");   // 0 bleibt 0, NICHT "un peso"
  assert.equal(numbers.amount("abc", peso), "cero pesos"); // Müll -> 0
});

test("numbers.LEVELS: drei Stufen mit den Ids 1,2,3", () => {
  assert.deepEqual(numbers.LEVELS.map((l) => l.id), [1, 2, 3]);
});

test("numbers.makeItem: String-Währungsschlüssel wird zur Definition aufgelöst", () => {
  const item = numbers.makeItem(1000, "CO"); // String statt Objekt
  assert.equal(item.code, "COP");
  assert.equal(item.currencyKey, "CO");
  assert.equal(item.symbol, "$");
});

// buildRound versucht „hartnäckig" (bis zu n*40 Versuche), distinkte Werte zu
// sammeln. Deterministisch über den rng-Parameter: erscheint der 5. distinkte
// Wert erst spät, muss das großzügige Budget ihn dennoch einsammeln (n+40 wäre
// zu knapp). Sichert den Guard-Faktor n*40 ab.
test("numbers.buildRound: sammelt distinkte Werte bis zum n*40-Budget ein", () => {
  // GT L1 = {min:5,max:150,step:5}: idx 1..30 -> Wert idx*5. r so wählen, dass
  // floor(r*30)=idx-1. Die ersten 4 distinkten Werte früh, der 5. erst bei Versuch 100.
  const R = (idx) => (idx - 0.5) / 30;
  let k = 0;
  const rng = () => {
    k += 1;
    if (k === 1) return R(1);
    if (k === 2) return R(2);
    if (k === 3) return R(3);
    if (k === 4) return R(4);
    if (k === 100) return R(5); // 5. distinkter Wert erst spät (n+40=45 würde ihn verpassen)
    return R(1);                 // sonst Wiederholung des ersten Werts
  };
  const round = numbers.buildRound("GT", 1, 5, rng);
  assert.equal(round.length, 5);
  assert.equal(new Set(round.map((r) => r.value)).size, 5); // alle 5 distinkt
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

// Determinismus-Seam: mit injiziertem rng (fester Seed) ist die Runde reproduzierbar.
test("numbers.buildRound: deterministisch mit injiziertem rng", () => {
  const seeded = () => { let a = 987654 >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const a = numbers.buildRound("CO", 2, 6, seeded());
  const b = numbers.buildRound("CO", 2, 6, seeded());
  assert.deepEqual(a, b, "gleicher Seed muss identische Beträge liefern");
  assert.equal(a.length, 6);
});
