# HolaRuta · Inglés – der Locals-Track (Spanisch lernt Englisch)

> **Wettbewerb dieses Tracks:** siehe [WETTBEWERB-EN.md](WETTBEWERB-EN.md) (Gegencheck der
> englischseitigen Konkurrenz ELSA/Voxy/Dexway/… und abgeleitete Schritte).

Sprachschulen wie ECOS in Cartagena unterrichten nicht nur Reisende in Spanisch,
sondern auch **Einheimische in Englisch** (Kellner:innen, Rezeption, Guides, dazu
Alltag, Beruf, Schule/Prüfung). Dafür gibt es einen zweiten **Lern-Track**, der
dieselbe Engine wiederverwendet und nur die **Richtung umkehrt**.

Öffnen:
```
https://…/holaRuta/?edition=ingles-pro
```
oder als fest gebaute Datei:
```
node build.js --edition=ingles-pro   →   HolaRuta-ingles-pro.html
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
| Turismo y hostelería (`loc-hosp`) | meseros, recepción, guías, taxi, ventas, bar, playa, quejas y disculpas, comida típica, limpieza/housekeeping, spa y masajes, lancha e islas, salida/check-out, buceo y snorkel, senderismo, aeropuerto, alquiler de autos, museo y entradas |
| Día a día (`loc-dia`) | saludos, teléfono, direcciones, de compras, salud y farmacia, banco y dinero, transporte público, emergencias y seguridad, peluquería, alquiler y vivienda, el clima, domicilios, gimnasio, casa y servicios |
| Trabajo y negocios (`loc-trab`) | entrevista, oficina, atención al cliente, reunión, reseñas y redes, hoja de vida (CV), negociar, call-center/BPO, inglés para TI, videollamadas, ventas y pitch, finanzas y facturas, logística y envíos, RR. HH./feedback, networking, personal de salud (médicos/enfermeras) |
| Escuela y examen (`loc-esc`) | gramática, en clase, números y fechas, conectores, tiempos verbales, preposiciones, hacer preguntas, falsos amigos, pronunciación (minimalpaare), present perfect, artículos a/an/the, cantidades (much/many), verbos modales, phrasal verbs, comparar |
| Vocabulario por temas (`loc-voc`) | números, colores, familia, cuerpo, comida y bebida, frutas y verduras, animales, ropa, casa, cocina, ciudad, transporte, días y meses, clima, verbos comunes, adjetivos, profesiones, tecnología, naturaleza, emociones, escuela, deportes, salud, oficina, dinero y compras, viaje, la hora, baño, herramientas, música, formas, materiales, aves, vida marina, insectos, postres y dulces, especias y hierbas, medidas, direcciones, palabras de pregunta, pronombres, países, nacionalidades, belleza y cuidado, limpieza del hogar, emergencias, **palabras esenciales (núcleo)**, **verbos esenciales** |
| Vocabulario B2 / avanzado (`loc-b2`) | opinar y argumentar, acuerdo y desacuerdo, conectores avanzados, frecuencia y tiempo, emociones matizadas, personalidad, conceptos abstractos, colocaciones, mundo laboral, negocios y reuniones, finanzas, educación, phrasal verbs, verbos avanzados, adjetivos avanzados, sociedad y actualidad, medio ambiente, tecnología digital, salud y bienestar, viajes avanzado |

Die Gruppe **Vocabulario por temas (`loc-voc`)** ist eine reine **Vokabel-Sektion**
(Einzelwörter statt Service-Sätze): 48 Themen-Kategorien. Darin auch das **núcleo**
(`voc-nucleo` + `voc-acciones`): die häufigsten Funktions-/Kernwörter (Artikel,
Präpositionen, Konjunktionen, Hochfrequenz-Adverbien, Quantoren, Modale, Kernverben),
die in den thematischen Kategorien fehlen — das frequenzbasierte Fundament.

Die Gruppe **Vocabulario B2 / avanzado (`loc-b2`)** hebt den Wortschatz auf **Niveau B2**
(`lvl: 4` = „Experto"): 20 Kategorien mit fortgeschrittenem, abstrakterem und
diskursivem Vokabular (Meinung/Argumentation, Konnektoren, Kollokationen, phrasal
verbs, Arbeit/Wirtschaft, Gesellschaft/Umwelt …). Jede Karte trägt `es`/`en`/`tip`
plus einen vollen Beispielsatz-Kontext in `contextdata.locals.js`.

Aktuell **131 Kategorien · 2150 Karten** (ein Schnellstart-Preset je Kategorie).
Bedarfs-Aufstellung & Bauplan des Ausbaus: siehe [LOCALS-EXPANSION.md](LOCALS-EXPANSION.md).
Karten-Schema und Pflege wie in `data.js` (siehe [BAUPLAN.md](BAUPLAN.md)).

### Kurspläne „Semana 1–4"

`data.locals.js → PLANS` definiert **sieben** strukturierte 4-Wochen-Lehrgänge, die die
vorhandene `PRETRIP`-Etappen-Engine wiederverwenden; jede Woche bündelt ~8 Karten quer
durch die Kategorien zu einem Lernpfad, und die nächste Woche öffnet sich nach Abschluss
der aktuellen:
- **Curso de inglés** (`curso-en`) – Service-Basis → Orientieren → Verkaufen/Reklamation → Essen/Strand/Reseñas.
- **Curso pro: trabajo** (`curso-pro`) – Entrevista → Oficina/Teléfono → Atención al cliente → Reseñas/Números.
- **Curso día a día** (`curso-dia`) – Saludar/Llamar → Orientieren/Bewegen → Einkaufen/Bezahlen → Gesundheit/Wetter/Notfälle.
- **Curso call-center** (`curso-bpo`) – Saludar/Verifizieren → Zuhören/Halten → Lösen/Eskalieren → höflich Abschließen.
- **Curso inglés para TI** (`curso-tech`) – Standup/Status → Tickets/Code-Review → Meetings/Videollamadas → Entregas/Reportes.
- **Curso de gramática** (`curso-gram`) – Artículos/Cantidades → Tiempos/Present perfect → Modales/Phrasal verbs → Falsos amigos/Pronunciación.
- **Curso turismo avanzado** (`curso-tur-pro`) – Buceo/Senderismo → Aeropuerto/Mietwagen → Museo/Tour → Sicherheit/Notfälle auf Tour.
- **Curso esencial: las 1000 palabras más usadas** (`curso-esencial`) – die **frequenzbasierten** 966
  häufigsten Einzelwörter (núcleo + Grundwortschatz, ohne B2-Spezialvokabular), in vier Bändern nach
  Gebrauchshäufigkeit geordnet: las 250 más usadas → 251–500 → 501–750 → 751–1000. Die Reihenfolge
  stammt aus einem Frequenz-Ranking; mit ~1000 Kernwörtern erreicht man A2→B1 („etwas sprechen können").

Über die Chip-Leiste in „Descubrir → Curso" umschaltbar (`pretripVM` filtert im Locals-
Track auf `^curso`); im Reise-Track unverändert der bisherige Pre-Trip-Plan. Die Karten
laufen durch die normale (track-korrekte) Study-Engine.

### Diálogos-Rollenspiele (Local-Perspektive)

`data.locals.js → DIALOGOS_SCENARIOS/DIALOGOS` (gesetzt als `SC.dialogos`, sodass
`loadModule` nicht die Reise-Datei lädt; `dialogos.js` überspringt sich im Locals-Track).
Der **NPC ist ein Tourist und spricht Englisch** (`turn.en`, wird per englischer TTS
vorgelesen); Übersetzung & Handlungsanweisung stehen auf Spanisch (`turn.es`); der/die
Lernende antwortet auf Englisch (MC oder frei getippt, `solEs`/`options[].es`/`accept`
tragen die englische Musterantwort). Zwanzig Szenarien: Restaurant, Recepción, Tour,
Taxi, Mercado, Queja, Playa, Entrevista de trabajo, Llamada de servicio, Farmacia,
Check-out, Spa/Masaje, Lancha (Islas del Rosario), Banco, Peluquería sowie – aus dem
Erweiterungspack – **Briefing de buceo, Check-in de vuelo, Daily standup (TI), Demo
de ventas und En la consulta (clínica)**.

Die geteilte Engine (`features/dialogos-game.js`) wurde dafür track-fähig gemacht:
gesprochene Zeile = Lernsprache, Übersetzung/Anweisung = Muttersprache (Reise-Track
unverändert: NPC Spanisch, Übersetzung de/en).

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
