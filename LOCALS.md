# LocalRuta – der Locals-Track (Spanisch lernt Englisch)

Sprachschulen wie ECOS in Cartagena unterrichten nicht nur Reisende in Spanisch,
sondern auch **Einheimische in Englisch** (Kellner:innen, Rezeption, Guides, dazu
Alltag, Beruf, Schule/Prüfung). Dafür gibt es einen zweiten **Lern-Track**, der
dieselbe Engine wiederverwendet und nur die **Richtung umkehrt**.

Öffnen:
```
https://…/holaRuta/?edition=cartagena-locals
```
oder als fest gebaute Datei:
```
node build.js --edition=cartagena-locals   →   HolaRuta-cartagena-locals.html
```

## Was der Track umdreht

| Aspekt | Reise-Track (Standard) | Locals-Track (`es-en`) |
|---|---|---|
| Lernsprache (Antwort) | Spanisch (`card.es`) | **Englisch (`card.en`)** |
| Muttersprache / Frage | Deutsch/Englisch (nach UI) | **immer Spanisch (`card.es`)** |
| UI-Sprachen | DE / EN | **ES / EN** |
| Sprachausgabe (TTS) | LatAm-Spanisch | **Englisch (en-US)** |
| Bewertung (Schreiben) | spanisch-tolerant (Akzente, Flexion) | **englisch-tolerant** (Artikel `the/a/an` optional) |

Technisch steckt das in einem **Track-Begriff** (`config.js` → `SC.track`):
`learnLang`, `nativeLangs`, `cardNativeLang` (fixe L1 der Frage) und `ttsLocale`.
Der Standard-Track `de-es` bildet das bisherige Verhalten 1:1 ab – **ohne Edition
ändert sich nichts**.

## Architektur-Stützen (statt Spezial-Code)

- **`SC.track.learnText(card)`** – Pendant zu `i18n.nativeText(card)` für die
  GELERNTE Seite. App/Matcher/Speech lesen die Antwort nie mehr als festes `card.es`.
- **`matcher.check(input, card, "learn")`** – das Feld `"learn"` löst auf `learnLang`
  auf; `card.alt` = Alternativen der gelernten Antwort; die englische Artikel-Toleranz
  greift bei `learnLang === "en"`, die spanischen Flexionsregeln nur bei `=== "es"`.
- **`cardNative(card)`** (app.js) – die Frage bleibt im Locals-Track immer Spanisch,
  auch wenn die Oberfläche auf Englisch steht.
- **i18n** – dritte UI-Sprache `es`; `register(area, de, en, es)` bzw. die ergänzende
  Datei `i18n.strings.es.js` (`registerLang`). Fehlt ein spanischer Schlüssel, fällt
  `t()` über **es → en → de** zurück (für ein ES/EN-Publikum besser als Deutsch).

## Inhalt

`data.locals.js` (reine Daten, hängt nur im Locals-Track an `SC.data` an):
`es` = Frage, `en` = gelernte Antwort, `tip` = englische Aussprachehilfe für
Spanisch-Sprecher; Kategorie-Labels in `labelEs`/`labelEn`. Vier Themen-Gruppen:

| Gruppe | Kategorien |
|---|---|
| Turismo y hostelería (`loc-hosp`) | meseros, recepción, guías, taxi, ventas |
| Día a día (`loc-dia`) | saludos, teléfono, direcciones |
| Trabajo y negocios (`loc-trab`) | entrevista, oficina |
| Escuela y examen (`loc-esc`) | gramática, en clase |

Karten-Schema und Pflege wie in `data.js` (siehe [BAUPLAN.md](BAUPLAN.md)).

## Fokussierte Edition (Reise-Inhalte ausgeblendet)

Im Locals-Track zeigt die App **nur** die Locals-Inhalte – die Reise-Inhalte bleiben
im Korpus (damit keine Reise-Code-Pfade brechen), sind aber unsichtbar:
- `allCards()` liefert im Locals-Track nur Locals-Karten → Study/Ruta/Suche/Badges/
  Stats sind fokussiert.
- Die Startseite zeigt nur die vier Locals-Kategorie-Gruppen.
- „Entdecken" zeigt nur sprachunabhängige Features (Mi léxico); die spanisch-
  spezifischen Reise-Features (Precios, Conjugación, Diálogos, Jerga, Länder/
  Geschichte …) sind ausgeblendet.
- Onboarding überspringt im Locals-Track den „Reiseziel"-Schritt und den spanischen
  Ruta-Check.

> Funktioniert auch ohne neuen Inhalt: Da jede Bestandskarte `es`+`en` trägt, läuft
> der umgekehrte Track sofort auf dem vorhandenen Korpus; `data.locals.js` ergänzt die
> arbeitsweltnahen Themen.

## Korrektheits-Schliffe (umgesetzt)

- **Onboarding**: Der spanische Ruta-Check (Einstufungstest) wird im Locals-Track
  übersprungen (`openPlacement` → direkt ins Dashboard), statt einen sinnlosen
  Spanisch-Test anzuzeigen.
- **OS-Spracherkennung** ist track-aware: ein spanisches Gerät startet die Locals-
  Edition auf Spanisch (früher kannte die Erkennung nur de/en).
- **Reise-Karten-Tipps unterdrückt**: Studiert man im Locals-Track eine Bestands-
  (Reise-)Karte, wird ihr spanischer Aussprache-Tipp (mit deutschem Klammertext)
  ausgeblendet; nur Locals-Karten (`loc-…`) zeigen ihren englischen Tipp.
- **Sharepic & Mi-léxico-Üben** track-korrekt: das geteilte Bild zeigt die englische
  Antwort unter dem richtigen Label (statt fest „ESPAÑOL"); Satz-/eigene Favoriten
  werden beim Üben korrekt auf die Track-Sprachfelder gemappt (keine leere Antwort).
- **Matcher** prüft die `ES→native`-Richtung gegen Spanisch, auch bei englischer UI.

## Nächste Schritte (offen)

- Weitere Content-Cluster: **Alltag/Conversación**, **Beruf/Negocios**,
  **Escuela/Examen** (je Kategorien + Presets + Kurspläne + Diálogos).
- Vollständige spanische UI (aktuell Kern-Namespaces; Rest fällt auf Englisch zurück).
- **Reise-Inhalte im Locals-Home fokussieren**: Aktuell erscheinen unter den Locals-
  Kategorien auch alle Reise-Kategorien (reversiert lauffähig, aber thematisch fremd).
  Geplant: rein spanisch-spezifische Reise-Features/-Kategorien (Precios, Conjugación,
  Jerga, Destinos, Länder/Geschichte …) im Locals-Track über die Edition-Sichtbarkeit
  ausblenden.
- `lang`-Attribute auf Sekundär-Screens (Karten-Detail, Statistik, Favoriten-Liste,
  Spickzettel) folgen noch fest `es`; für reine a11y/Aussprache nachziehen.
- Eigenes englisches Tippfehler-Korpus & ES-Parität im i18n-Test ausbauen.

Tests: `test/locals-track.test.js` (Track, Matcher-Englisch, TTS-Locale, ES-UI,
Content-Integrität). Browser-Smoke siehe E2E-Muster in `scripts/`.
