/*
 * auth-locale.test.js – parseLocale() aus api/_locale.js.
 *
 * Der Client schickt beim Confirm optional die UI-Sprache mit (net.confirm /
 * net.googleConfirm), damit sie in profile.locale landet. parseLocale ist die
 * serverseitige Whitelist dafür: nur "de"/"en"/"es", alles andere -> undefined
 * (dann bleibt profile.locale beim Upsert unangetastet). Der Helfer ist
 * bewusst dependency-frei (kein Supabase-Import) und darum ohne Env testbar –
 * gleiches Muster wie auth-google-start.test.js/_redirect.js.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const { parseLocale } = require(path.join(__dirname, "..", "api", "_locale.js"));

test("parseLocale: unterstützte Sprachen werden normalisiert durchgelassen", () => {
  assert.equal(parseLocale("es"), "es");
  assert.equal(parseLocale("de"), "de");
  assert.equal(parseLocale("en"), "en");
  assert.equal(parseLocale(" ES "), "es", "trimmt und lowercased");
});

test("parseLocale: alles andere -> undefined (Feld bleibt beim Upsert weg)", () => {
  assert.equal(parseLocale(""), undefined);
  assert.equal(parseLocale(undefined), undefined);
  assert.equal(parseLocale(null), undefined);
  assert.equal(parseLocale("pt"), undefined, "nicht unterstützte Sprache");
  assert.equal(parseLocale("es-CO"), undefined, "keine Regions-Varianten");
  assert.equal(parseLocale(42), undefined, "kein String");
  assert.equal(parseLocale({ toString: () => "es" }), undefined, "nur echte Strings");
});
