# LOCALS-SIGNOFF — Muttersprachler-Freigabe des Englisch-Korpus

Tracker für den systematischen Sign-off der **2844 Englisch-Lernkarten + Kontext**
des Locals-Tracks (Edition `ingles-pro`, Track `es-en`: Spanischsprecher lernen
Englisch). Schließt das in [RISIKO.md](RISIKO.md) **R13** und
[WETTBEWERB-EN.md](WETTBEWERB-EN.md) benannte Risiko „fehlendes Muttersprachler-
Sign-off" – der als marketing-tragend eingestufte Punkt.

Quelle der Wahrheit für den Freigabe-Fortschritt. Karten/Kontext liegen in
`data.locals.js` und `contextdata.locals.js`.

## Status-Legende

| Symbol | EN-Lint | Sign-off |
| --- | --- | --- |
| ⬜ | offen | offen |
| 🟡 | Linter clean (s. u.) | inhaltlich offen |
| ✅ | Linter clean | muttersprachlich freigegeben |

## Deterministische Gates (laufen schon, vor jedem inhaltlichen Review)

- `npm test` → `test/ortografia-en.test.js` (EN-Orthografie: Leerzeichen, Klammern,
  Spanisch-Zeichen ¿¡ñ, Satzanfang-Großschreibung), `test/aussprache-tipps.test.js`
  (tip-Format: Abdeckung, Zeichensatz/kein IPA), `test/locals-track.test.js`
  (Struktur, 1:1-Kontext-Kopplung, In-Session-Dubletten-Freiheit).
- `node tools/audit-locals.js --strict` (`alt`-Struktur + Ambiguität) — sowie
  `--candidates` als Arbeitsliste fürs `alt`-Synonym-Feature.

## Vier Review-Dimensionen je Karte (inhaltlicher Sign-off)

1. **Übersetzungstreue** `es ↔ en`: bedeutet die englische Antwort genau die
   spanische Frage? (LatAm-Spanisch als Ausgangssprache.)
2. **Idiomatik/Natürlichkeit** von `en` und `context.egLearn`: echtes, arbeitsalltags-
   nahes Englisch, nicht schulisch/wörtlich übersetzt.
3. **Aussprache-Tipp** `tip`: phonetisch korrekt für Spanischsprecher
   (`/θ/→z`, `/ð/→d`, Betonung in GROSSBUCHSTABEN), keine erfundene Lautschrift.
4. **Situation/Tipp** (`s`/`sEn`, `n`/`nEn`): faktisch richtig, ES- und EN-Variante
   konsistent, kein widersprüchlicher Grammatik-„Regel"-Mythos.

## Gate-Flip je freigegebener Kategorie

Sobald eine Kategorie inhaltlich freigegeben **und** Linter-clean ist:
Whitelist-Einträge der betroffenen Karten in `ortografia-en`/`aussprache-tipps`
leeren bzw. – wenn eine ganze Gruppe durch ist – dort `STRICT=true` schalten.
So wird der Sign-off dauerhaft test-verankert (Regression = roter Test).

## Priorisierung (empfohlene Reihenfolge)

- **Stufe 1 — marketing-tragend:** `loc-hosp` (Tourismus/Hostelería) + `loc-trab` (Arbeit/BPO/Tech)
- **Stufe 2 — Alltag/Schule:** `loc-dia` (Día a día) + `loc-esc` (Escuela y examen)
- **Stufe 3 — Wortlisten:** `loc-voc` (Vocabulario por temas)
- **Stufe 4 — Fortgeschritten:** `loc-b2` (Vocabulario B2)

---

## Stufe 1 — marketing-tragend
<!-- ROWS:loc-hosp+loc-trab -->

### Tourismus & Hostelería (`loc-hosp`) — 18 Kategorien · 432 Karten · Stufe ✅ (Sign-off: 5 Befunde behoben)
| Kategorie | Karten | EN-Lint | Sign-off |
| --- | --- | --- | --- |
| En el restaurante (`meseros`) | 24 | ✅ | ✅ |
| En la recepción (`recepcion`) | 24 | ✅ | ✅ |
| Tours y guías (`guias`) | 24 | ✅ | ✅ |
| Taxi y transporte (`taxi-en`) | 24 | ✅ | ✅ |
| Ventas y mercado (`ventas`) | 24 | ✅ | ✅ |
| En el bar (`bar-en`) | 24 | ✅ | ✅ |
| En la playa (`playa-en`) | 24 | ✅ | ✅ |
| Quejas y disculpas (`quejas-en`) | 24 | ✅ | ✅ |
| Comida típica (`platos-en`) | 24 | ✅ | ✅ |
| Limpieza y pisos (`limpieza`) | 24 | ✅ | ✅ |
| Spa y masajes (`spa-en`) | 24 | ✅ | ✅ |
| Lancha e islas (`lancha-en`) | 24 | ✅ | ✅ |
| Salida y check-out (`checkout-en`) | 24 | ✅ | ✅ |
| Buceo y snorkel (`buceo-en`) | 24 | ✅ | ✅ |
| Senderismo (`trekking-en`) | 24 | ✅ | ✅ |
| Aeropuerto (`aeropuerto-en`) | 24 | ✅ | ✅ |
| Alquiler de autos (`alquiler-auto-en`) | 24 | ✅ | ✅ |
| Museo y entradas (`museo-en`) | 24 | ✅ | ✅ |

### Trabajo & negocios (`loc-trab`) — 16 Kategorien · 384 Karten · Stufe ✅ (Sign-off: 16 Befunde behoben)
| Kategorie | Karten | EN-Lint | Sign-off |
| --- | --- | --- | --- |
| Entrevista de trabajo (`entrevista`) | 24 | ✅ | ✅ |
| Oficina y correos (`oficina`) | 24 | ✅ | ✅ |
| Atención al cliente (`cliente-en`) | 24 | ✅ | ✅ |
| En la reunión (`reunion-en`) | 24 | ✅ | ✅ |
| Reseñas y redes (`resenas-en`) | 24 | ✅ | ✅ |
| Hoja de vida (`cv-en`) | 24 | ✅ | ✅ |
| Negociar (`negociacion`) | 24 | ✅ | ✅ |
| Call-center / BPO (`bpo-en`) | 24 | ✅ | ✅ |
| Inglés para TI (`tech-en`) | 24 | ✅ | ✅ |
| Videollamadas (`videocall-en`) | 24 | ✅ | ✅ |
| Ventas y pitch (`ventas-pro`) | 24 | ✅ | ✅ |
| Finanzas y facturas (`finanzas-en`) | 24 | ✅ | ✅ |
| Logística y envíos (`logistica-en`) | 24 | ✅ | ✅ |
| RR. HH. y feedback (`feedback-en`) | 24 | ✅ | ✅ |
| Networking (`networking-en`) | 24 | ✅ | ✅ |
| Personal de salud (`salud-pro-en`) | 24 | ✅ | ✅ |

## Stufe 2 — Alltag/Schule

### Día a día (`loc-dia`) — 14 Kategorien · 336 Karten · Stufe ✅ (Sign-off: 8 Befunde behoben)
| Kategorie | Karten | EN-Lint | Sign-off |
| --- | --- | --- | --- |
| Saludos y charla (`saludos-en`) | 24 | ✅ | ✅ |
| Por teléfono (`telefono`) | 24 | ✅ | ✅ |
| Dar direcciones (`direcciones`) | 24 | ✅ | ✅ |
| De compras (`compras-en`) | 24 | ✅ | ✅ |
| Salud y farmacia (`salud-en`) | 24 | ✅ | ✅ |
| Banco y dinero (`dinero-en`) | 24 | ✅ | ✅ |
| Transporte público (`transporte-en`) | 24 | ✅ | ✅ |
| Emergencias y seguridad (`emergencias-en`) | 24 | ✅ | ✅ |
| Peluquería (`peluqueria`) | 24 | ✅ | ✅ |
| Alquiler y vivienda (`vivienda`) | 24 | ✅ | ✅ |
| El clima (`clima-en`) | 24 | ✅ | ✅ |
| Domicilios (`delivery-en`) | 24 | ✅ | ✅ |
| Gimnasio (`gym-en`) | 24 | ✅ | ✅ |
| Casa y servicios (`hogar-en`) | 24 | ✅ | ✅ |

### Escuela y examen (`loc-esc`) — 15 Kategorien · 360 Karten · Stufe ✅ (Sign-off: 7 Befunde behoben)
| Kategorie | Karten | EN-Lint | Sign-off |
| --- | --- | --- | --- |
| Gramática básica (`gramatica-en`) | 24 | ✅ | ✅ |
| En clase (`examen`) | 24 | ✅ | ✅ |
| Números y fechas (`numeros-en`) | 24 | ✅ | ✅ |
| Conectores útiles (`conectores-en`) | 24 | ✅ | ✅ |
| Tiempos verbales (`tiempos-en`) | 24 | ✅ | ✅ |
| Preposiciones (`preposiciones`) | 24 | ✅ | ✅ |
| Hacer preguntas (`preguntas-en`) | 24 | ✅ | ✅ |
| Falsos amigos (`falsos-amigos`) | 24 | ✅ | ✅ |
| Pronunciación (`pronunciacion-en`) | 24 | ✅ | ✅ |
| Present perfect (`perfecto-en`) | 24 | ✅ | ✅ |
| Artículos a/an/the (`articulos-en`) | 24 | ✅ | ✅ |
| Cantidades (`cantidades-en`) | 24 | ✅ | ✅ |
| Verbos modales (`modales-en`) | 24 | ✅ | ✅ |
| Phrasal verbs (`phrasal-en`) | 24 | ✅ | ✅ |
| Comparar (`comparar-en`) | 24 | ✅ | ✅ |

## Stufe 3 — Wortlisten

### Vocabulario por temas (`loc-voc`) — 48 Kategorien · 966 Karten · Stufe ✅ (Sign-off: 37 Befunde + 1 Disambiguierung)
| Kategorie | Karten | EN-Lint | Sign-off |
| --- | --- | --- | --- |
| Números (`voc-numeros`) | 26 | ✅ | ✅ |
| Colores (`voc-colores`) | 16 | ✅ | ✅ |
| La familia (`voc-familia`) | 18 | ✅ | ✅ |
| El cuerpo (`voc-cuerpo`) | 20 | ✅ | ✅ |
| Comida y bebida (`voc-comida`) | 20 | ✅ | ✅ |
| Frutas y verduras (`voc-frutas`) | 18 | ✅ | ✅ |
| Animales (`voc-animales`) | 20 | ✅ | ✅ |
| La ropa (`voc-ropa`) | 18 | ✅ | ✅ |
| La casa (`voc-casa`) | 18 | ✅ | ✅ |
| La cocina (`voc-cocina`) | 16 | ✅ | ✅ |
| En la ciudad (`voc-ciudad`) | 20 | ✅ | ✅ |
| Transporte (`voc-transporte`) | 16 | ✅ | ✅ |
| Días y meses (`voc-dias`) | 19 | ✅ | ✅ |
| El clima (`voc-clima`) | 17 | ✅ | ✅ |
| Verbos comunes (`voc-verbos`) | 24 | ✅ | ✅ |
| Adjetivos (`voc-adjetivos`) | 20 | ✅ | ✅ |
| Profesiones (`voc-profesiones`) | 20 | ✅ | ✅ |
| Tecnología (`voc-tecnologia`) | 18 | ✅ | ✅ |
| Naturaleza (`voc-naturaleza`) | 18 | ✅ | ✅ |
| Emociones (`voc-emociones`) | 16 | ✅ | ✅ |
| La escuela (`voc-escuela`) | 16 | ✅ | ✅ |
| Deportes (`voc-deportes`) | 16 | ✅ | ✅ |
| Salud (`voc-salud`) | 16 | ✅ | ✅ |
| La oficina (`voc-oficina`) | 16 | ✅ | ✅ |
| Dinero y compras (`voc-dinero`) | 16 | ✅ | ✅ |
| De viaje (`voc-viaje`) | 18 | ✅ | ✅ |
| La hora (`voc-tiempo`) | 16 | ✅ | ✅ |
| El baño (`voc-bano`) | 16 | ✅ | ✅ |
| Herramientas (`voc-herramientas`) | 16 | ✅ | ✅ |
| Música (`voc-musica`) | 16 | ✅ | ✅ |
| Formas (`voc-formas`) | 16 | ✅ | ✅ |
| Materiales (`voc-materiales`) | 16 | ✅ | ✅ |
| Aves (`voc-aves`) | 16 | ✅ | ✅ |
| Vida marina (`voc-marvida`) | 16 | ✅ | ✅ |
| Insectos (`voc-insectos`) | 16 | ✅ | ✅ |
| Postres y dulces (`voc-postres`) | 16 | ✅ | ✅ |
| Especias y hierbas (`voc-especias`) | 16 | ✅ | ✅ |
| Medidas (`voc-medidas`) | 16 | ✅ | ✅ |
| Direcciones (`voc-direcciones`) | 16 | ✅ | ✅ |
| Palabras de pregunta (`voc-preguntas`) | 16 | ✅ | ✅ |
| Pronombres (`voc-pronombres`) | 16 | ✅ | ✅ |
| Países (`voc-paises`) | 16 | ✅ | ✅ |
| Nacionalidades (`voc-nacionalidades`) | 16 | ✅ | ✅ |
| Belleza y cuidado (`voc-belleza`) | 16 | ✅ | ✅ |
| Limpieza del hogar (`voc-limpieza`) | 16 | ✅ | ✅ |
| Emergencias (`voc-emergencias`) | 16 | ✅ | ✅ |
| Palabras esenciales (`voc-nucleo`) | 120 | ✅ | ✅ |
| Verbos esenciales (`voc-acciones`) | 50 | ✅ | ✅ |

## Stufe 4 — Fortgeschritten

### Vocabulario B2 (`loc-b2`) — 20 Kategorien · 366 Karten · Stufe —
| Kategorie | Karten | EN-Lint | Sign-off |
| --- | --- | --- | --- |
| Opinar y argumentar (`b2-opiniones`) | 18 | ⬜ | ⬜ |
| Acuerdo y desacuerdo (`b2-debate`) | 18 | ⬜ | ⬜ |
| Conectores avanzados (`b2-conectores`) | 18 | ⬜ | ⬜ |
| Frecuencia y tiempo (`b2-tiempo`) | 18 | ⬜ | ⬜ |
| Emociones matizadas (`b2-emociones`) | 18 | ⬜ | ⬜ |
| Personalidad (`b2-personalidad`) | 18 | ⬜ | ⬜ |
| Conceptos abstractos (`b2-abstracto`) | 18 | ⬜ | ⬜ |
| Colocaciones (`b2-colocaciones`) | 18 | ⬜ | ⬜ |
| Mundo laboral (`b2-trabajo`) | 18 | ⬜ | ⬜ |
| Negocios y reuniones (`b2-negocios`) | 18 | ⬜ | ⬜ |
| Finanzas personales (`b2-dinero`) | 18 | ⬜ | ⬜ |
| Educación (`b2-educacion`) | 18 | ⬜ | ⬜ |
| Phrasal verbs (`b2-phrasal`) | 20 | ⬜ | ⬜ |
| Verbos avanzados (`b2-verbos`) | 20 | ⬜ | ⬜ |
| Adjetivos avanzados (`b2-adjetivos`) | 20 | ⬜ | ⬜ |
| Sociedad y actualidad (`b2-sociedad`) | 18 | ⬜ | ⬜ |
| Medio ambiente (`b2-medioambiente`) | 18 | ⬜ | ⬜ |
| Tecnología digital (`b2-tecnologia`) | 18 | ⬜ | ⬜ |
| Salud y bienestar (`b2-salud`) | 18 | ⬜ | ⬜ |
| Viajes avanzado (`b2-viajes`) | 18 | ⬜ | ⬜ |
