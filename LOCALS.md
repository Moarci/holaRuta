# HolaRuta · Inglés – der Locals-Track (Spanisch lernt Englisch)

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
| Turismo y hostelería (`loc-hosp`) | meseros, recepción, guías, taxi, ventas, bar, playa, quejas y disculpas, comida típica |
| Día a día (`loc-dia`) | saludos, teléfono, direcciones, de compras, salud y farmacia, banco y dinero, transporte público, emergencias y seguridad |
| Trabajo y negocios (`loc-trab`) | entrevista, oficina, atención al cliente, reunión, reseñas y redes |
| Escuela y examen (`loc-esc`) | gramática, en clase, números y fechas, conectores |

Aktuell **26 Kategorien · 262 Karten** (ein Schnellstart-Preset je Kategorie).
Karten-Schema und Pflege wie in `data.js` (siehe [BAUPLAN.md](BAUPLAN.md)).

### Kursplan „Semana 1–4"

`data.locals.js → PLANS` definiert einen strukturierten 4-Wochen-Lehrgang (scope
`curso-en`), der die vorhandene `PRETRIP`-Etappen-Engine wiederverwendet: jede Woche
bündelt ~8 Karten quer durch die Kategorien zu einem Lernpfad (Service-Basis →
Orientieren → Verkaufen/Reklamation → Essen/Strand/Reseñas). Die nächste Woche öffnet
sich nach Abschluss der aktuellen. Erreichbar über „Descubrir → Curso · Semana 1–4";
im Reise-Track unverändert der bisherige Pre-Trip-Plan. Die Karten laufen durch die
normale (track-korrekte) Study-Engine.

> Diálogos-Rollenspiele aus Local-Perspektive sind als nächster Schritt vorgesehen –
> sie brauchen einen Umbau der stark reise-codierten Diálogos-Turn-Engine (NPC-Sprache,
> TTS-Richtung) und sind daher bewusst noch nicht enthalten.

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

- Weitere Kurspläne/Diálogos je Cluster (analog `PRETRIP`/`dialogos.js`).
- Spanische Übersetzung der rein reise-spezifischen Namespaces (Arbeitsblätter,
  Einstufungstests, Hostel/Battle, 30 Pre-Arrival-Städte) – aktuell EN-Rückfall,
  im Locals-Track ohnehin ausgeblendet, daher niedrige Priorität.
- Eigenes englisches Tippfehler-Korpus & ES-Parität im i18n-Test ausbauen.

## Spanische UI & a11y (umgesetzt)

- **ES-Übersetzung** der im Locals-Track sichtbaren Oberflächen in
  `i18n.strings.es.js`: Inicio/Aprender, Ajustes & Estadísticas (Perfil),
  Búsqueda, Mi léxico, Tarea, Modo profe sowie die geteilten Bausteine – mit für
  Locals gespiegelten Feldern (Editor/Favoriten: Frage = español, Antwort = inglés)
  und einem an Locals angepassten Onboarding. Reine Reise-Namespaces (Arbeitsblätter,
  Einstufungstests, Hostel/Battle, 30 Pre-Arrival-Städte …) bleiben auf der
  EN-Rückfallkette – sie sind im Locals-Track ohnehin ausgeblendet.
- **`lang`-Attribute** auf den geteilten Sekundär-Screens (Statistik, Karten-Detail,
  Mi léxico) folgen jetzt der gelernten Sprache (`learnLangCode()`); die reise-
  spezifischen Feature-Screens bleiben `lang="es"` (dort korrekt, in Locals verborgen).
- **Profil fokussiert**: Trip-Ziel-Karte und die spanischen Einstufungstests
  (HolaRuta-Check / Nivel-Test) sind im Locals-Track ausgeblendet.

Tests: `test/locals-track.test.js` (Track, Matcher-Englisch, TTS-Locale, ES-UI,
Content-Integrität). Browser-Smoke siehe E2E-Muster in `scripts/`.
