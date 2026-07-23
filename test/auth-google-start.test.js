/*
 * auth-google-start.test.js – Redirect-Härtung von /v1/auth/google/start.
 *
 * Sichert die sicherheitskritischen reinen Helfer safeRedirect()/allowedOrigins()
 * gegen Regressionen ab (Open-Redirect / Header-Vertrauen). Der HTTP-Handler selbst
 * braucht Supabase-Env und wird hier NICHT ausgeführt – die Helfer hängen als
 * Eigenschaften am Modul und sind ohne Env aufrufbar.
 *
 * Aufruf:  node --test
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

// Reine Redirect-Helfer (dependency-frei -> kein Supabase-Import im Test nötig).
const { allowedOrigins, safeRedirect } = require(path.join(__dirname, "..", "api", "_v1", "auth", "google", "_redirect.js"));

function req(headers, query) { return { headers: headers || {}, query: query || {} }; }

// Env um jeden Test herum sauber setzen/zurücksetzen (Helfer lesen process.env live).
function withEnv(value, fn) {
  const before = process.env.AUTH_REDIRECT_ORIGINS;
  if (value === undefined) delete process.env.AUTH_REDIRECT_ORIGINS;
  else process.env.AUTH_REDIRECT_ORIGINS = value;
  try { fn(); }
  finally { if (before === undefined) delete process.env.AUTH_REDIRECT_ORIGINS; else process.env.AUTH_REDIRECT_ORIGINS = before; }
}

test("allowedOrigins: Env-Allowlist hat Vorrang, wird getrimmt und ohne Trailing-Slash normalisiert", () => {
  withEnv(" https://holaruta.com/ , https://holaruta.de ", () => {
    // Selbst ein gefälschter Host-Header ändert nichts, wenn die Env gesetzt ist.
    assert.deepEqual(allowedOrigins(req({ "x-forwarded-host": "evil.example" })),
      ["https://holaruta.com", "https://holaruta.de"]);
  });
});

test("allowedOrigins: ohne Env aus x-forwarded-proto/host abgeleitet", () => {
  withEnv(undefined, () => {
    assert.deepEqual(allowedOrigins(req({ "x-forwarded-proto": "https", "x-forwarded-host": "holaruta.com" })),
      ["https://holaruta.com"]);
  });
});

test("safeRedirect: gültiges Same-Origin-Ziel auf /auth-callback.html wird akzeptiert (state-Query bleibt erhalten)", () => {
  withEnv("https://holaruta.com", () => {
    assert.equal(
      safeRedirect(req({}, { redirect: "https://holaruta.com/auth-callback.html?s=abc123" })),
      "https://holaruta.com/auth-callback.html?s=abc123",
    );
  });
});

test("safeRedirect: zusätzlicher UI-Sprach-Param (&l=) überlebt den Roundtrip (profile.locale beim Google-Weg)", () => {
  withEnv("https://holaruta.com", () => {
    assert.equal(
      safeRedirect(req({}, { redirect: "https://holaruta.com/auth-callback.html?s=abc123&l=es" })),
      "https://holaruta.com/auth-callback.html?s=abc123&l=es",
    );
  });
});

test("safeRedirect: fremde Origin wird abgewiesen -> Fallback auf erlaubten Default-Callback (kein Open-Redirect)", () => {
  withEnv("https://holaruta.com", () => {
    assert.equal(
      safeRedirect(req({}, { redirect: "https://evil.example/auth-callback.html?s=x" })),
      "https://holaruta.com/auth-callback.html",
    );
  });
});

test("safeRedirect: protokoll-relatives //evil.example zählt NICHT als Same-Origin -> Fallback", () => {
  withEnv("https://holaruta.com", () => {
    assert.equal(
      safeRedirect(req({}, { redirect: "//evil.example/auth-callback.html" })),
      "https://holaruta.com/auth-callback.html",
    );
  });
});

test("safeRedirect: richtige Origin, aber falscher Pfad -> Fallback auf /auth-callback.html", () => {
  withEnv("https://holaruta.com", () => {
    assert.equal(
      safeRedirect(req({}, { redirect: "https://holaruta.com/konto-uebernehmen" })),
      "https://holaruta.com/auth-callback.html",
    );
  });
});

test("safeRedirect: ohne erlaubte Origin (kein Env, kein Host) -> leeres Ziel", () => {
  withEnv(undefined, () => {
    assert.equal(safeRedirect(req({}, { redirect: "https://holaruta.com/auth-callback.html" })), "");
  });
});
