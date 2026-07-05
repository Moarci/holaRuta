# HolaRuta · Medellín – die Locals-Variante für die Stadt

> Baut auf dem [Locals-Track](LOCALS.md) (`es-en`) auf: Einheimische lernen **Englisch**.
> Diese Variante ist eine **Medellín-gebrandete Edition** plus **stadtspezifische Module**
> für Paisas, die englischsprachige Tourist:innen bedienen, führen und beraten.

Öffnen:
```
https://…/holaRuta/?edition=medellin
```
oder als fest gebaute Datei:
```
node build.js --edition=medellin   →   HolaRuta-medellin.html
```

## Was die Variante ist

- **Edition `medellin`** (`editions/registry.js` + Anker `editions/medellin.js`):
  `track:"es-en"` (Frage = Spanisch, Antwort = Englisch, TTS en-US, UI ES/EN), Paisa-Grün
  als Akzent (Ciudad de la Eterna Primavera / Corredores Verdes). Selbstlernen –
  `taskTab`/`teacherTab` aus (wie `venue-en`). Reise-Inhalte bleiben im Locals-Track
  ausgeblendet.
- **Kategorie-Gruppe `loc-med`** (in `ui.js` `CATEGORY_GROUPS` ganz oben, i18n-Titel
  `home.catGroupLocMed` „Medellín"): erscheint **nur** im Locals-Track (im Reise-Track leer/aus).

## Die acht Module (Gruppe `loc-med`, je ~16 Karten)

| Kategorie-Id | Thema | Inhalt (Auszug) |
|---|---|---|
| `comuna13-en` | Comuna 13 | Grafitour, escaleras eléctricas, Transformationsgeschichte, Hip-Hop, Respekt vor Bewohner:innen |
| `metro-med-en` | Metro & Metrocable | Cívica-Karte, Línea A/B, Metrocable, Tranvía, „Cultura Metro" |
| `ambiente-med-en` | Medio ambiente | Corredores Verdes, Baumpflanzung, Luftqualität/pico y placa, Río Medellín, EPM, Recycling |
| `paisa-en` | Cultura paisa | Gastfreundschaft, parlache (parce, ¡qué nota!), tinto, sobremesa, arriero-Erbe |
| `comida-paisa-en` | Comida paisa | Bandeja paisa, arepa, mondongo, empanadas, buñuelo, mazamorra, jugos naturales |
| `guatape-en` | Guatapé & El Peñol | La Piedra (~740 escalones), embalse, zócalos, tour en lancha, Ausrüstung |
| `nomadas-en` | Nómadas & seguridad | El Poblado/Provenza, coworking, clima, „no dar papaya", Apps/Taxis, propina |
| `eventos-med-en` | Feria y eventos | Feria de las Flores, Desfile de Silleteros, Alumbrados, Día de las Velitas, Colombiamoda |

Karten-Schema wie im Locals-Track (`{ id:"loc-…", cat, lvl, es, en, tip, alt? }`); jede Karte
trägt zusätzlich einen englischen Beispielkontext in `contextdata.locals.js`
(`{ e, t, s, sEn, n, nEn }`). Schnellstart-Presets je Kategorie werden automatisch generiert.

## Kurs & Rollenspiele

- **`curso-medellin`** (`data.locals.js → PLANS`): 8-Wochen-Lehrgang (40 Etappen × 20 Karten),
  über die „Descubrir → Curso"-Chipleiste wählbar. Bogen: Bienvenida paisa → Moverse por la
  ciudad (Metro) → Comuna 13 & tours → Sabor paisa → Naturaleza & excursión → Ciudad verde →
  Nómadas & expats → Fiesta y cierre. Medellín-Modul-Etappen sind mit thematisch verwandten
  Bestandskarten auf 20 aufgefüllt (kollisionsfreie Prompts). `curso-en` bleibt der Default.
- **Diálogos** (`DLG_SCENARIOS`/`DLG`): vier Medellín-Rollenspiele – **Tour por la Comuna 13**
  (`lc:palette`), **En el Metrocable** (`lc:cable-car`), **Excursión a Guatapé** (`lc:mountain`)
  und **Corredores verdes** (`lc:trees`). NPC = Tourist (Englisch), Lernende:r antwortet Englisch.

## Tests

Abgedeckt durch die bestehenden Gates: `test/locals-track.test.js` (Gruppe `loc-med`,
Karten-/Preset-/Kurs-Integrität, Prompt-Dubletten je Set, Diálogos), `tools/audit-locals.js`
(`alt`-Struktur), `test/aussprache-tipps.test.js` (Tip-Zeichensatz), `test/ortografia-en.test.js`
(Eigennamen mit ñ – Peñol, buñuelo – in der Whitelist), `test/sc.test.js` (Editions-Registry).
Nach Datenänderung `node build.js` ausführen (stempelt den Service-Worker-Cache-Hash).
