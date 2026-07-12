# Landing Page "Mehr als Sprache"-Hooks: echte Karten statt Platzhalter

## Problem

Die 6 "Kostprobe"-Kacheln in der `#why`-Sektion von `landing.html` ("Mehr als Sprache: Du lernst nicht nur Spanisch. Du verstehst den Kontinent.") zeigen aktuell frei erfundene, teils generische Beispielsätze in einer simplen Zwei-Zeilen-Textbox (Spanisch + deutsche Glosse, kein Kontext, keine Aussprache, kein Karten-Design). Das widerspricht dem Anspruch der Seite, echte App-Inhalte zu zeigen — und ist optisch inkonsistent mit dem Smartphone-Mockup direkt darüber, das echte Flip-Karten mit Kontext-Panel zeigt.

## Ziel

Alle 6 Hook-Kacheln (`historia`, `culturas`, `respeto`, `salud`, `musica`, `conexion`) zeigen bei Klick auf "Kostprobe" eine **echte, aus der App-Kartendatenbank stammende Flip-Karte** — Frage vorne, beim Umdrehen Spanisch + Ausspracheklammer, Vorlesen-Button, aufklappbares Reise-Kontext-Panel (Situation + Notiz) — visuell identisch zur echten Lernkarte (`ui.js` `flipBody`/`contextPanel`, gestylt über `styles.css`).

## Kartenauswahl

Alle sechs sind reale, ausgelieferte Karten aus `data.js`/`contextdata.js` (nicht erfunden), ausgewählt nach thematischer Passung und Aussagekraft:

| Kachel | Karten-ID | Kategorie-Badge (DE/EN) | Frage (DE) | Spanisch | Tipp (DE) | Situation (DE) | Notiz (DE) |
|---|---|---|---|---|---|---|---|
| Historia | `pe30` | PERÚ / PERU | Diese Mauern sind noch von den Inka. | Estas paredes todavía son de los incas. | fugenlose Steinmauern in Cusco | Beim Bummel durch Cuscos Altstadtgassen. | Berühmt: der zwölfeckige Stein in der Calle Hatun Rumiyoc. |
| Culturas | `cl07` | CHILE / CHILE | Machen wir das sofort, ja? | Hagámoslo al tiro, ¿ya? | „al tiro" = sofort, auf der Stelle | Beim Planen mit der Gruppe oder dem Guide. | „al tiro" = sofort; „¿ya?" ist ein freundliches „ok?". |
| Respeto | `md18` | COLOMBIA / COLOMBIA | Bringen Sie mir bitte einen Tinto? | ¿Me regala un tinto, por favor? | regalar = in Kolumbien höflich „geben/bringen"; tinto = kleiner schwarzer Kaffee (NICHT Rotwein!) | Am Café oder beim Straßenverkäufer für den Koffein-Kick. | regalar heißt hier höflich „bringen/geben"; Achtung: tinto ≠ Rotwein. |
| Salud | `fa14` | SALUD / HEALTH | Ich habe Höhenkrankheit. | Tengo soroche. | TEN-go so-RO-tche | In den Anden. | „Soroche" und „mal de altura" meinen dasselbe. |
| Música | `nl17` | NOCHE / NIGHTLIFE | Spielen sie Salsa oder Reggaetón? | ¿Ponen salsa o reggaetón? | PO-nen SAL-sa o re-ge-TON | Beim DJ nachfragen. | „Poner" heißt hier Musik auflegen. |
| Conexión | `social13` | SOCIAL / SOCIAL | Sollen wir Karten spielen? | ¿Jugamos a las cartas? | chu-GA-mos a las KAR-tas | Beim Warten am Terminal oder an einem langen Reisetag. | jugar a las cartas = Karten spielen; una carta = eine Spielkarte. |

Englische Feldinhalte (Frage, Tipp, Situation, Notiz), direkt aus `data.js`/`contextdata.js` übernommen:

| Kachel | Frage (EN) | Tipp (EN) | Situation (EN) | Notiz (EN) |
|---|---|---|---|---|
| Historia (`pe30`) | These walls are still from the Incas. | the seamless stone walls in Cusco | Wandering Cusco's old-town lanes. | Famous: the twelve-angled stone on Calle Hatun Rumiyoc. |
| Culturas (`cl07`) | Let's do it right away, yeah? | 'al tiro' = right away, immediately | When planning with the group or guide. | 'al tiro' = right away; '¿ya?' at the end is a friendly 'ok?'. |
| Respeto (`md18`) | Could you bring me a tinto, please? | regalar = polite "to give/bring" in Colombia; tinto = small black coffee (NOT red wine!) | At a café or from a street vendor for a caffeine kick. | regalar here is a polite "to bring/give"; and note: tinto is a small black coffee, NOT red wine. |
| Salud (`fa14`) | I have altitude sickness. | TEN-go so-RO-tche | In the Andes. | 'Soroche' and 'mal de altura' both mean altitude sickness. |
| Música (`nl17`) | Do they play salsa or reggaeton? | PO-nen SAL-sa o re-ge-TON | Asking the DJ. | 'Poner' here means to play music. |
| Conexión (`social13`) | Shall we play cards? | chu-GA-mos a las KAR-tas | While waiting at the terminal or on a long travel day, to pass the time. | jugar a las cartas = to play cards. A playing card is una carta, the deck la baraja. |

**Spanisch-UI (Feldkonvention):** Card-Felder (Frage, Tipp, Situation, Notiz) werden — wie im bestehenden `DATA[mod].ex[i]`-Muster der "Mehr an Bord"-Karten — nur in `de`/`en` gepflegt, nicht zusätzlich in `es`. Bei UI-Sprache Spanisch fällt die Kartenvorderseite wie bisher auf `de` zurück (`render(mod)`: `l === "en" ? c.en : c.de`); Situation/Notiz bleiben dann leer. Das ist ein bestehendes, bewusst unverändertes Verhalten der wiederverwendeten Komponente, keine Neuerung dieses Umbaus.

## Technischer Ansatz

Die Seite hat bereits die richtige Bauform: die "Mehr an Bord"-Module (`landing.html:1611–1726`, Funktion `render(mod)`) erzeugen `.flip / .face--front / .face--back / .context-panel`-Markup, das 1:1 mit `styles.css` gestylt ist — visuell identisch zur echten App-Karteikarte.

1. **Kartendaten**: Neues `WHY_CARDS`-Objekt in `landing.html`, ein Eintrag pro Hook, exakt gleiche Form wie die bestehenden `DATA[mod].ex[i]`-Einträge: `{ cat:[de,en], de, en, es, tip, tipEn, lvl, sit:{de,en}, note:{de,en} }`. Keine Kopplung an `data.js`/`app.js` — die Landingpage bleibt bewusst eigenständig (bestehendes, bewusstes Muster laut Code-Kommentaren in `landing.css`/`landing-carousel.js`).
2. **Kartenerzeugung**: Die Markup-Erzeugung aus `render(mod)` (Zeilen ~1628–1661 und die Feld-Befüllung/Event-Wiring ~1662–1713) wird in eine kleine wiederverwendbare Funktion extrahiert (z. B. `buildFlipCard(container, cardData, lang)`), die sowohl von den "Mehr an Bord"-Chips als auch von den 6 "why"-Hooks genutzt wird. Vermeidet Doppelcode/Drift zwischen beiden Kartenwidgets.
3. **Hook-Markup**: Jede `.lp-hook__sample` (aktuell die Zwei-Zeilen-Textbox, `landing.html:738–744` etc.) wird durch einen Container ersetzt, der beim Öffnen per `buildFlipCard(...)` befüllt wird (lazy, beim ersten Aufklappen — kein unnötiger Umbau für nicht geöffnete Karten).
4. **Interaktion**: Der bestehende "Kostprobe"-Peek-Button (`landing.html:1787–1804`) bleibt für Auf-/Zuklappen bestehen (progressive disclosure). Neu: Klick/Tap auf die sichtbare Karte dreht sie um (wie in der App); 🔊 liest den spanischen Satz vor (bestehende `speak()`-Logik wiederverwenden statt der hook-eigenen `speakES`); 🧭 klappt das Kontext-Panel auf.
5. **i18n**: Die bestehenden `.k/.t/.b`-Schlüssel (Kicker/Titel/Fließtext) in `I18N.de/en/es` bleiben unverändert. Die alten `.es`/`.m`-Schlüssel entfallen zugunsten der reichhaltigeren `WHY_CARDS`-Struktur (Übersetzung dort, konsistent mit dem "Mehr an Bord"-Muster, das ebenfalls keine `I18N.*`-Einträge für seine Karteninhalte nutzt).
6. **Build**: `landing-preview.html` ist generiert (Kopfzeile: "GENERIERT aus landing.html – nicht von Hand bearbeiten"). Nach den Änderungen an `landing.html` wird `node scripts/build-landing-preview.mjs` ausgeführt, um es zu synchronisieren. Es wird nicht von Hand editiert.

## Kategorie-Badges

Kurzes zweisprachiges Label pro Karte, analog zum bestehenden `DATA[mod].cat`-Muster: `PERÚ/PERU`, `CHILE/CHILE`, `COLOMBIA/COLOMBIA`, `SALUD/HEALTH`, `NOCHE/NIGHTLIFE`, `SOCIAL/SOCIAL`.

## Out of Scope

- Keine Änderung an der echten App (`ui.js`, `data.js`, `app.js`) — nur an der Landingpage.
- Keine Änderung an den bestehenden "Mehr an Bord"-Chips-Inhalten selbst (nur Extraktion der gemeinsam genutzten Rendering-Funktion, ihr Verhalten/ihre Kartendaten bleiben unverändert).
- Kein neues automatisiertes Test-Setup für die Landingpage (dort bislang keine Tests vorhanden); manuelle Verifikation im Browser (Flip, Kontext, Vorlesen, alle 3 Sprachen, Mobile-Breite) reicht für diesen Scope.

## Risiken / offene Punkte

- Das Vorlesen (`speak()`/`speakES()`) existiert aktuell doppelt (Hero-Karussell + Hooks) mit leicht unterschiedlicher Implementierung; bei der Extraktion wird eine gemeinsame Funktion genutzt, um Verhalten zu vereinheitlichen — geringes Risiko einer sichtbaren Verhaltensänderung beim Vorlesen (z. B. Abbrechen einer laufenden Sprachausgabe).
- Die 6 Kacheln zeigen nach dem Umbau spürbar mehr Inhalt beim Aufklappen (volle Karte statt zwei Zeilen) — Layout-Auswirkung (Kartenhöhe, Abstand zu Nachbarkacheln) wird im Review geprüft.
