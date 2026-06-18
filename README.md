<div align="center">

# 🌶️ HolaRuta

**Dein Reise-Spanisch für echte Situationen — Karteikarten mit Spaced Repetition für Bus, Hotel, Essen, Geld, Notfall und Smalltalk.**

**v1.98.0** — 2278 Karten · 71 Bereiche · 3 Lernmodi (Karteikarte · Schreiben · **Hören**) · **Ruta-Check** (reisepraktischer Einstufungstest mit „weiß ich nicht“ & Niveau-Profil) · **Suche** (Karten, Übungen & Informationen) · **Historia de Sudamérica** (interaktiver Zeitstrahl: Inka, Conquista, Bolívar & heute — mit **spanischem Lesetraining** in jedem Text, antippbaren Vokabeln, **Vokabel-Quiz**, Schwierigkeits-Score & Sharepic) · **Historia de Centroamérica** (eigener Zeitstrahl: Maya, Morazán, Bürgerkriege & heute — mit demselben Lesetraining, Quiz & Sharepic) · **Modul teilen** (Deep-Link öffnet das Modul direkt) · **Spickzettel mit Großanzeige** · Regatear (gut verhandeln) · **Logística de viaje** (SIM, Geld, Gepäck & Tracker) · **Salud y energía** (gesund & fit unterwegs) · Gegenteile (Contrarios) · Konjugieren (Conjugación) & Zeiten (Tiempos) mit Erklärseite · Einkaufszettel · El Cuerpo · **Precios al oído** (generative Preise in 7 Währungen, bis zu Millionenbeträgen) · Frases flexibles (49 Sätze in 7 Themen) · Karten überspringen · Ruta del día · Pre-Trip-Plan · Pre-Arrival-Pakete · Hostel Mode · Coordinator-Schnellstart · Modo profe (Lehrer-Übersicht) · Tarea (Aufgaben-Codes, per Link teilbar) · Cloud-Sync (opt-in) · Homescreen-Shortcuts · Definiciones · Spaced Repetition · Offline · Null Dependencies

[![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-ES2017-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](#-tech-stack)
[![PWA](https://img.shields.io/badge/PWA-installierbar_&_offline-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](#-offline--pwa)
[![Dependencies](https://img.shields.io/badge/Runtime_Dependencies-0-3F7355?style=flat-square)](#-architektur)
[![Tests](https://img.shields.io/badge/Tests-285_passing-brightgreen?style=flat-square&logo=nodedotjs&logoColor=white)](#-tests)
[![Karten](https://img.shields.io/badge/Karten-2278-C2502E?style=flat-square)](#datenmodell)
[![Sprache](https://img.shields.io/badge/Spanisch-LatAm-B97C24?style=flat-square)](#-die-w%C3%B6rterbasis)
[![License](https://img.shields.io/badge/License-Privat-red?style=flat-square)](#-lizenz)

Schnell lernen · Großzügig prüfen · Komplett mit dem Daumen · Spricht Spanisch vor · Funktioniert ohne Netz

### ▶️ [**Live öffnen → moarci.github.io/holaRuta**](https://moarci.github.io/holaRuta/)

*Direkt im Browser starten — nichts installieren. Auf dem Handy „Zum Startbildschirm hinzufügen" tippen, und HolaRuta liegt als offline-fähige App auf dem Homescreen.*

**[🚀 Schnellstart](#-schnellstart)** &nbsp;|&nbsp; **[🏗 Architektur](#-architektur)** &nbsp;|&nbsp; **[🧠 Spaced Repetition](#-spaced-repetition-sm-2)** &nbsp;|&nbsp; **[🔍 Audit](AUDIT.md)**

<details>
<summary><b>Inhaltsverzeichnis</b></summary>

- [Überblick](#überblick)
- [Screenshots](#-screenshots)
- [Features](#-features)
- [Die Wörterbasis](#-die-wörterbasis)
- [Architektur](#-architektur)
- [Schnellstart](#-schnellstart)
- [Single-File-Build](#-single-file-build)
- [Datenmodell](#datenmodell)
- [Spaced Repetition (SM-2)](#-spaced-repetition-sm-2)
- [Ruta-Pass (Badges)](#️-ruta-pass-badges)
- [Antwort-Matcher](#-antwort-matcher)
- [Offline & PWA](#-offline--pwa)
- [Tech Stack](#-tech-stack)
- [Design-Prinzipien](#-design-prinzipien)
- [Tests](#-tests)
- [Projektstatus](#-projektstatus)
- [Lizenz](#-lizenz)

</details>

</div>

---

## Überblick

**HolaRuta** ist eine Lernkarten-PWA für Survival-Spanisch beim Backpacking durch Lateinamerika. Kein Schulbuch-Spanisch, sondern genau die Sätze, die man am Busbahnhof, an der Grenze, im Hostel und beim Essen wirklich braucht — durchgängig **LatAm-korrekt** (colectivo, vuelto, plata, chévere, celular).

Die App ist eine **einzige statische Web-App ohne Build-Zwang und ohne Runtime-Dependencies**. Sie läuft im Browser, lässt sich als App installieren und funktioniert komplett **offline**. Der gesamte Lernfortschritt bleibt lokal auf dem Gerät — kein Konto, kein Server, kein Tracking.

**Kernversprechen:** In Sekunden eine Karte lernen, großzügig getippte Antworten prüfen, mit dem Daumen durch die Sitzung wischen — und nur das wiederholen, was wirklich fällig ist.

**Kernprinzipien:**

- **Null Dependencies** — Reines Vanilla JS. Kein Framework, kein Bundler, kein `node_modules` zur Laufzeit. Nur Module, die sich an `window.SC` hängen.
- **Reine Funktionen im Kern** — `srs`, `matcher` und `stats` kennen weder UI noch Speicher. Sie nehmen Zustand + Eingabe und geben **neuen** Zustand zurück (Immutability durchgängig).
- **Offline first** — Service Worker cacht die komplette App. Einmal geladen, läuft sie ohne Netz weiter.
- **Privacy by Design** — Fortschritt, Einstellungen und eigene Karten leben ausschließlich im `localStorage`. Es verlässt nichts das Gerät.
- **Graceful Degradation** — Kein `localStorage`? Kein TTS? Kein Service Worker? Die App läuft trotzdem, nur ohne das jeweilige Extra.

---

## 📸 Screenshots

<div align="center">

| Startseite | Karteikarte (Flip) | Antwort aufgedeckt |
|:----------:|:---------------:|:------------------:|
| <img src="docs/screenshots/home.png" width="250" alt="Startseite mit 15 Bereichen, Modus-, Richtungs- und Stufen-Auswahl"> | <img src="docs/screenshots/study-flip.png" width="250" alt="Lernkarte im Karteikarte-Modus, Frageseite"> | <img src="docs/screenshots/study-flip-revealed.png" width="250" alt="Aufgedeckte Karte mit Aussprache und Bewertungs-Buttons"> |

| Schreiben (Type) | Antwort geprüft | Statistik |
|:----------------:|:---------------:|:---------:|
| <img src="docs/screenshots/study-type.png" width="250" alt="Schreiben-Modus mit Eingabefeld"> | <img src="docs/screenshots/study-type-result.png" width="250" alt="Geprüfte Antwort, großzügiger Matcher zeigt Richtig"> | <img src="docs/screenshots/stats.png" width="250" alt="Statistik mit Trefferquote, gemeistert/schwierig und Kartenliste"> |

| Karten-Detail | Eigene Karten | Länderkunde |
|:-------------:|:-------------:|:-----------:|
| <img src="docs/screenshots/card-detail.png" width="250" alt="Detailseite einer Karte mit Verlauf und Kennzahlen"> | <img src="docs/screenshots/editor.png" width="250" alt="Editor für eigene Karten"> | <img src="docs/screenshots/info.png" width="250" alt="Länderkunde mit Hauptstadt, Geschichte, Sprache, Essen und Trinken"> |

</div>

> Erdton-Palette im Lateinamerika-Look, 3D-Flip-Animation, komplett mit dem Daumen bedienbar.

---

## ✨ Features

| Bereich | Feature | Details |
|---|---|---|
| **Lernmodus** | Karteikarte (Flip) | Karte antippen / Space → 3D-Flip zeigt die Antwort, dann selbst bewerten (keine Prüfung) |
| **Lernmodus** | Schreiben (Type) | Antwort tippen → großzügiger Matcher prüft (akzent- & satzzeichen-tolerant) |
| **Lernmodus** | Hören (Escuchar) 👂 | Die App spricht die spanische Antwort vor (Dictado), du tippst das Gehörte – trainiert das Hörverstehen für echtes LatAm-Spanisch. Nur bei TTS-Support |
| **Schnellzugriff** | Spickzettel 🆘 | Die kritischsten Sätze (Notfall, Grundlagen, Wegbeschreibung, Geld) kuratiert, sofort da und auf Tipp vorgelesen – mit Sprungleiste und bildschirmfüllender Großanzeige zum Herzeigen. Reines Nachschlagen, ohne Lernen |
| **Hörtrainer** | Precios al oído 💵 | Die App sagt einen Betrag auf Spanisch, du tippst die Zahl. Beträge werden pro Runde frisch erzeugt (eigener Zahl→Wort-Wandler, `numbers.js`) – wähle Land/Währung (🇨🇴 Kolumbien, 🇨🇱 Chile, 🇦🇷 Argentinien, 🇨🇷 Costa Rica, 🇲🇽 Mexiko, 🇵🇪 Peru, 🇬🇹 Guatemala) und eine von drei Schwierigkeitsstufen – von Kleingeld bis zu kolumbianischen Millionenpreisen. Grammatisch sauber (un millón quinientos mil, veintiún mil, „de pesos" nur bei vollen Millionen), mit Score |
| **Satzbaukasten** | Frases flexibles 🧱 | Satzrahmen mit Lücke („Necesito ___"), passenden Baustein wählen – produktives Satzbauen statt bloßem Übersetzen (Multiple Choice). 49 Sätze in 7 Reise-Themen, wählbar vorab oder „🎲 Gemischt" |
| **Tagesrunde** | Ruta del día 🗺️ | Ein Tap für eine kurze, kategorienübergreifende Tagesrunde (bevorzugt fällige, sonst neue Karten) – stärkt die Lern-Serie |
| **Onboarding-Pfad** | Pre-Trip-Plan 🗓️ | Mehrtägiger, geordneter Vorbereitungs-Pfad **je Reiseziel** (Kolumbien · Peru · Mexiko · Costa Rica · Ecuador · Guatemala), wählbar über Reiseziel-Chips; je 7 Etappen (Begrüßung, Taxi/Ankunft, Unterkunft/Höhe, Essen, Geld/Markt, Unterwegs, Ausgehen). Jede Etappe = kuratierte Karten + Real-Life-Mutprobe; die nächste öffnet sich nach Abschluss der aktuellen, Fortschritt je Ziel getrennt. Stempel „Reisefertig" für einen kompletten Plan |
| **Richtung** | DE→ES / ES→DE | Lernrichtung jederzeit umschaltbar, wird gemerkt |
| **Spaced Repetition** | Eigene SM-2-Engine | 3-Tasten-Bewertung (Nochmal / Gut / Einfach), Intervall- & Ease-Berechnung |
| **Stufen-Filter** | A1 / A2 / B1 | Mehrfachauswahl der Schwierigkeitsstufen, kombinierbar mit Bereich |
| **71 Bereiche** | Themen-Kategorien & Reiseziele | Grundlagen, Zahlen, Essen, Trinken, Hotel, Hostel, Social, Verkehr, Einkaufen, Geld, Notfall, Friseur & Beauty, Sport & Fitness, Arbeiten & Freiwilligenarbeit, Geldautomat & Bank, Post & Versand, Kinder & Familie, Vegetarisch & Allergien, Strand & Wassersport, Nachtleben, Wetter, Mietwagen, Apotheke & Arzt, Touren & Outdoor, SIM & Internet, Wäsche & Services, Zeit, Smalltalk, Alltag, Sätze, Behörden, Busreise, Kleidung & Schmuck, Wegbeschreibung, Konjugieren, Zeiten, Farben, Gegenteile, **Kolumbien**, **Cartagena**, **Medellín**, **Cusco**, **Mexiko-Stadt**, **Antigua**, **Buenos Aires**, **Quito**, **Lima**, **Arequipa**, **Mendoza**, **Bariloche**, **Oaxaca**, **Mérida**, **La Fortuna / Arenal**, **Monteverde**, **Santiago**, **Valparaíso**, **Atacama**, **La Paz**, **Uyuni**, **Torres del Paine**, **Pucón**, **Copacabana**, **Sucre**, **Peru**, **Mexiko**, **Costa Rica**, **Ecuador**, **Guatemala**, **Argentinien**, **Chile**, **Bolivien** |
| **Gegenteile** | Antonym-Paare ↔️ | Eigener Bereich mit 26 Gegensatzpaaren (*grande – pequeño*, *caro – barato*, *abierto – cerrado*, *temprano – tarde* …). Frage und Antwort sind jeweils das ganze Paar, mit „–“ getrennt — so lernt man beide Wörter im Kontrast. Funktioniert in allen 3 Lernmodi und beiden Richtungen; im Schreiben-Modus zählt jede Seite des Paares |
| **Farben** | Interaktives Farbfeld 🎨 | Eigener Bereich für alle wichtigen Farben (LatAm: café, celeste, morado …): Auf der Antwortseite erscheint die **echte Farbe als Farbfeld** — Farbe sehen statt nur übersetzen. Funktioniert in Karteikarte & Schreiben und auf der Karten-Detailseite |
| **Hostel Mode** | Üben zu zweit 🛏️ | **Battle** (45 Aufgaben mit Schwierigkeits-Stufen; Ansage auf Deutsch, laut auf Spanisch antworten, Mitspieler bewertet 2/1/0; wählbare Länge 6/10/20 Runden, faire Aufgabenverteilung, optionale Spielernamen, Stichrunde bei Gleichstand) & **Rollenspiele** (kurze Dialoge mit verteilten Rollen) — plus Real-Life-Challenge als Bonus |
| **Coordinator** | 5-Minuten-Icebreaker ⚡ | Schnellstart im Modo Hostal: ein Tap startet ohne Setup eine kurze 6-Runden-Kennenlern-Battle — für Reiseleiter, Hostel-Personal und Lehrkräfte, die einer Gruppe sofort eine Sprach-Aktivität geben wollen |
| **Konjugieren** | Verben + Erklärseite 🔁 | Eigener Bereich mit 42 Karten zu den Präsens-Formen der wichtigsten Reiseverben (ir, estar, ser, tener, poder, querer, seguir, doblar …) — Grundlage z. B. für Wegbeschreibungen. Dazu unter Entdecken die Erklärseite **Conjugación**: Personen, die drei regelmäßigen Muster (-ar/-er/-ir), wichtige unregelmäßige Verben und ein Wegbeschreibungs-Dialog, LatAm-korrekt mit *ustedes* statt *vosotros* — mit „Jetzt üben"-Sprung direkt in die Karten |
| **Definiciones** | Zuordnen-Quiz 🧩 | Eigenständiges Modul im Stil eines Lehrbuch-Arbeitsblatts: **spanische Definition lesen, passenden Begriff aus mehreren Optionen wählen** — mit sofortiger Rückmeldung, Fortschrittsbalken und Auswertung. Themen-Listen (*En la ciudad*, *En la ruta* mit Backpacker-Orten, *La comida*); lernt Wörter über ihre Bedeutung statt nur per Übersetzung. Zahlt auf den Ruta-Pass ein |
| **Einkaufszettel** | Interaktive Liste 🛒 | Reisebedarf in drei Rubriken (**Supermercado · Ropa · Farmacia**): Item antippen → spanisches Wort, Aussprache und Reisetipp erscheinen, das Wort wird vorgelesen; dazu zwei **fertige Fragen fürs Geschäft** (ob sie es haben — *¿Tienen …?* — und wo man es findet — *¿Dónde puedo encontrar …?*) mit Übersetzung und 🔊. Über das Kästchen links **abhaken** (und jederzeit wieder zurücknehmen), Fortschritt bleibt gemerkt. Danach ein **kurzes Quiz** über dieselbe Rubrik („Du brauchst …" → richtiges Wort wählen). LatAm-korrekt (*curitas, medias, lentes de sol, repelente*) inkl. Reise-Klassiker wie Klopapier, Sonnencreme & „algo para la diarrea" |
| **Reise-Kontext** | 🧭 Kontext-Button | Runder Button unten links auf der Antwortkarte (Pendant zum 🔊): klappt einen Block mit echtem Reisesatz, typischer Situation und kurzem Reisetipp auf — für **alle 2278 Karten**. Zeigt, *wie* man den Ausdruck unterwegs wirklich benutzt (statt nur zu übersetzen); Zahlen bekommen praktischen Preis-/Mengen-Kontext |
| **Statistik** | Lern-Auswertung | Trefferquote, gemeistert / schwierig / neu, **Streckenkarte** (Fortschritt als Bus-Route), sortierte Kartenliste, Detailseite je Karte |
| **Ruta-Pass** | Badges / Reisestempel 🎖️ | Sammelbare Stempel für Lernmenge, Lern-Serie (Streak), Bereichs-Meisterschaft & Spezielles — inkl. Geheim-Stempel und Freischalt-Einblendung |
| **Eigene Karten** | Editor | Eigene Vokabeln anlegen — erscheinen überall ohne Sonderbehandlung |
| **Dark Mode** | Fürs Hostel-Bett 🌙 | Warmer, augenschonender Nachtmodus per 🌙/☀️-Schalter; folgt sonst der System-Vorliebe, Wahl wird gemerkt |
| **Sprachausgabe** | TTS (Web Speech API) | Spricht die spanische Antwort vor, bevorzugt eine LatAm-Stimme |
| **Sharepics** | Canvas-Bildgenerator | Karte oder Fortschritt als teilbares PNG (1:1 Feed oder 9:16 Story) |
| **Länderkunde** | 19 Länder | Hauptstadt, Geschichte, Sprache, typische Wörter, Essen, Trinken & Reisetipp |
| **Historia de Sudamérica** | Geschichts-Erklärseite 📜 | Interaktiver Zeitstrahl (7 Epochen: Hochkulturen → Conquista → Kolonialzeit → Freiheitskampf → Bolívar → Abspaltung → heute), Galerie der Protagonisten (Bolívar, San Martín, Sucre, O'Higgins, Manuela Sáenz, Atahualpa) und „Heute: Lage & Spannungen“ (Venezuela, Essequibo, Bolivien–Chile, Kolumbien, Peru, Argentinien, Amazonas, Darién) — mit Wikimedia-Bildern, zweisprachig |
| **Lesetraining (Historia)** | Spanisch lesen 📖 | Jeder Text (alle 7 Epochen, 6 Protagonisten & 8 „Heute“-Karten) zusätzlich als spanischer Lesetext mit antippbaren Schwierigkeitswörtern (Übersetzung im Popover), Wörterliste pro Text (getrennt in „mitnehmen“ / „nicht so wichtig“), CEFR-Schwierigkeitsscore (A1–C1) zur Selbst-Einstufung, „Ganze Übersetzung“ und Sharepic von Text & Wörterliste |
| **Quiz zum Text** | Vokabel-Mini-Quiz 🧩 | Pro Epoche ein kurzes Selbsttest-Quiz (spanisches Wort → richtige Übersetzung antippen) mit sofortiger Richtig/Falsch-Rückmeldung, direkt am Lesetext |
| **Reise-Knigge** | Verhalten unterwegs 🧭 | DOs & Don'ts für Hostel, Bus, Gruppen und Kultur — mit landesspezifischen Akzenten für alle 19 Länder (mit der Länderkunde verknüpft) |
| **Logística de viaje** | Clever & sicher ankommen 🧳 | Die praktischen Handgriffe, die kein Sprachkurs lehrt: **SIM-Karte (chip) kaufen & online sein**, **Geld wechseln und am cajero abheben** (ohne teure Umrechnung), **Geld & Wertsachen auf mehrere Gepäckstücke aufteilen**, das Gepäck per **Tracker (AirTag & Co.)** im Blick behalten, beim Fliegen das **Handgepäck-Notfallset** packen (Medikamente, Wechselwäsche, Hygiene, Powerbank, Dokumente) und in der Hochsaison **beliebte Hostels vorausplanen**. Pro Thema aufklappbare DOs & Don'ts, die passenden **Sätze als Karten** (es/de) und eine Packliste |
| **Salud y energía** | Gesund & fit unterwegs 🥗 | Lange auf der Straße bleibt nur, wer auf den Körper achtet: **ausgewogen essen statt nur Streetfood** (Protein, Ballaststoffe, Vitamine), **Frühstück selbst machen** – Porridge mit Proteinpulver & Früchten ganz ohne Küche, **günstig & mit Geschmack trinken** (Zero-Sirup, Elektrolytpulver/suero), **Bauch & Verdauung**, **Sonne, Höhe & Mücken** und **in Bewegung bleiben**. Mit aufklappbaren DOs & Don'ts, den **Sätzen als Karten** fürs Einkaufen, Bestellen (*a la plancha, no frito*) und die Apotheke, sowie einem **Gesund-unterwegs-Kit** |
| **Regatear** | Gut verhandeln 🤝 | Wie man auf Märkten freundlich feilscht: **Erklärung** der Taktik in 4 Blöcken (Grundhaltung, Verhandlung führen, Abschluss & Weggehen, Taxi/Touren), **Glossar** der Feilsch-Wörter (*regatear, la rebaja, precio fijo, la yapa*), die **wichtigsten Sätze** nach Phasen (*¿A cuánto la unidad?*, *¿Cuánto es lo menos?*, *Trato hecho*, *¿Tiene cambio?*), **Mengen & Einheiten** (unidad, docena, par, libra, kilo, litro, manojo …), **regionale Unterschiede** (México, Guatemala, Perú/Bolivia, Colombia, Argentina, Costa Rica, Cuba) und vier **Rollenspiele** zum lauten Üben (Obst & Gemüse, Souvenir feilschen, erst suchen dann handeln, Taxipreis aushandeln) |
| **Touch + Tastatur** | Vollständige Bedienung | Wischgesten (←/↑/→), Tasten 1/2/3/Space/p, Haptik-Feedback wo verfügbar |
| **PWA** | Installierbar & offline | Service Worker, Manifest, Homescreen-Icon, App-Shell-Fallback |
| **Accessibility** | A11y-Maßnahmen | Fokus-Management nach Render, `aria-live`-Regionen, `prefers-reduced-motion`, ≥44px Tap-Targets |

---

## 🌎 Die Wörterbasis

**2278 Karten · 71 Bereiche · 3 Stufen — durchgängig auf lateinamerikanisches Spanisch ausgelegt.**

Die Inhalte sind das Herz der App und wurden in einem [4-Agenten-Audit](AUDIT.md) live im Browser gegengeprüft: **0 Duplikate, 0 fehlende Felder, 0 ¿¡-Mismatches, keine falschen Übersetzungen**.

| Eigenschaft | Umsetzung |
|---|---|
| **LatAm-Vokabular** | `colectivo`, `vuelto`, `plata`, `chévere`, `chip`, `celular` statt Spanien-Spanisch |
| **Aussprache-Tipps** | Konsistentes Schema mit Betonung (z.B. „OH-la", „BUE-nos DI-as"), berücksichtigt yeísmo & seseo |
| **Mehrfachantworten** | Gültige Alternativen mit `/` getrennt (`Adiós / Chau`) oder explizit per `alt[]` |
| **Korrekte Akzentuierung** | Akzente, `ñ` und `¿¡`-Paare durchgängig sauber gesetzt |

**Verteilung der Karten je Bereich:**

| Bereich | Karten | Bereich | Karten | Bereich | Karten |
|---|---:|---|---:|---|---:|
| Zahlen | 110 | **Kolumbien** | **89** | Zeiten | 68 |
| Wegbeschreibung | 65 | Essen | 59 | **Peru** | **45** |
| Konjugieren | 42 | **Mexiko** | **41** | **Argentinien** | **40** |
| **Bolivien** | **40** | **Chile** | **40** | **Costa Rica** | **40** |
| **Ecuador** | **40** | **Guatemala** | **40** | Kleidung & Schmuck | 37 |
| **Antigua** | **35** | **Buenos Aires** | **34** | **Cartagena** | **34** |
| **Cusco** | **34** | **Medellín** | **34** | **Mexiko-Stadt** | **34** |
| **Quito** | **34** | **Arequipa** | **32** | **Atacama** | **32** |
| **Bariloche** | **32** | **Copacabana** | **32** | Einkaufen | 32 |
| **La Fortuna / Arenal** | **32** | **La Paz** | **32** | **Lima** | **32** |
| **Mendoza** | **32** | **Mérida** | **32** | **Monteverde** | **32** |
| **Oaxaca** | **32** | **Pucón** | **32** | **Santiago** | **32** |
| **Sucre** | **32** | **Torres del Paine** | **32** | **Uyuni** | **32** |
| **Valparaíso** | **32** | Sätze | 30 | Gegenteile | 26 |
| Apotheke & Arzt | 24 | Arbeiten & Freiwilligenarbeit | 24 | Farben | 24 |
| Friseur & Beauty | 24 | Geldautomat & Bank | 24 | Kinder & Familie | 24 |
| Mietwagen | 24 | Nachtleben | 24 | Post & Versand | 24 |
| SIM & Internet | 24 | Sport & Fitness | 24 | Strand & Wassersport | 24 |
| Touren & Outdoor | 24 | Vegetarisch & Allergien | 24 | Verkehr | 24 |
| Wäsche & Services | 24 | Wetter | 24 | Hotel | 23 |
| Smalltalk | 22 | Grundlagen | 21 | Behörden | 20 |
| Busreise | 20 | Zeit | 16 | Alltag | 15 |
| Notfall | 15 | Social | 14 | Trinken | 14 |
| Geld | 13 | Hostel | 10 |  |   |

> Hinzu kommen die **Hostel-Mode-Daten** (`BATTLES`, `ROLEPLAYS`, `CHALLENGES`) für das Üben zu zweit — separate Arrays, die nicht in die Kartenzählung eingehen.

---

## 🏗 Architektur

HolaRuta ist eine **klassische, entkoppelte Vanilla-JS-App**: jede Datei ist ein IIFE-Modul, das sich an einen gemeinsamen `window.SC`-Namespace hängt. Die Lade-Reihenfolge in [index.html](index.html) spiegelt den Datenfluss wider — erst Daten & Logik, dann View, zuletzt Controller.

### Datenfluss

```
data / countries   →   srs / matcher / stats   →   app (Controller)   →   ui   →   DOM
   (reine Daten)        (reine Funktionen)          (State + Events)     (HTML)
                                  ↑                        ↓
                              store  ←──  localStorage (Fortschritt, Einstellungen, eigene Karten)
```

### Module

```
SpanischCard/
├── index.html          # App-Shell + Modul-Ladereihenfolge
├── styles.css          # Komplettes Design (Erdton-Palette, 3D-Flip, Responsive)
│
├── data.js        SC.data       # Modell: 71 Kategorien, 3 Stufen, 2278 Karten + Hostel-Mode- & Definiciones-Daten (REINE DATEN)
├── contextdata.js SC.contextData # Reise-Kontext-Inhalte je Karte ({e,d,s,n}) – REINE DATEN
├── numbers.js     SC.numbers    # Zahl→spanisches Wort + Preis-Generator (Precios al oído, 7 Währungen) – REINE FUNKTIONEN
├── context.js     SC.context    # hängt Kontext an die Karten (Zahlen generiert) – REINE FUNKTIONEN
├── countries.js   SC.countries  # Länderkunde: 19 Länder in 3 Regionen
├── historia.js    SC.historia   # Historia de Sudamérica: Zeitstrahl, Protagonisten, aktuelle Spannungen (REINE DATEN)
├── historiaCentro.js SC.historiaCentro # Historia de Centroamérica: Maya, Morazán, Bürgerkriege & heute (REINE DATEN)
├── frases.js      SC.frases     # Satzbaukasten: Satzrahmen + Bausteine (REINE DATEN)
├── regatear.js    SC.regatear   # Regatear: Verhandeln-Taktik, Sätze, Einheiten, Rollenspiele (REINE DATEN)
├── logistica.js   SC.logistica  # Logística de viaje: SIM, Geld, Gepäck-Tracker, Handgepäck-Notfallset, Planung (REINE DATEN)
├── salud.js       SC.salud      # Salud y energía: Essen, Trinken, Bauch, Sonne/Höhe, Bewegung (REINE DATEN)
│
├── srs.js         SC.srs        # Spaced Repetition (SM-2) — REINE FUNKTIONEN
├── matcher.js     SC.matcher    # Antwortprüfung, akzent-/satzzeichen-tolerant — REINE FUNKTIONEN
├── placement.js   SC.placement  # Ruta-Check: Fragenkatalog + Bewertung/Level-Logik — REINE DATEN + FUNKTIONEN
├── assessment.js  SC.assessment # HolaRuta Nivel-Test: ausführlicher Einstufungstest (A0–C1), Variante „Extremo" mit Hörverstehen — REINE DATEN + FUNKTIONEN
├── search.js      SC.search     # Suche über Karten, Übungen & Informationen — REINE FUNKTIONEN
├── stats.js       SC.stats      # Auswertung pro Karte & gesamt — REINE FUNKTIONEN
├── badges.js      SC.badges     # Ruta-Pass: Badge-Definitionen + Auswertung — REINE FUNKTIONEN
│
├── store.js       SC.store      # Persistenz — kapselt localStorage komplett weg
├── sync.js        SC.sync       # Optionale, opt-in Cloud-Sync: reine Merge-Funktionen + dünner Adapter (BACKEND.md)
├── usercards.js   SC.userCards  # Eigene Karten (anlegen/löschen/validieren)
├── speech.js      SC.speech     # Sprachausgabe via Web Speech API (LatAm-Stimme)
├── share.js       SC.share      # Sharepic-Generator (Canvas → PNG, Web Share API)
│
├── ui.js          SC.ui         # Views: Zustand → HTML-String (renderHome/Study/Stats/…)
├── app.js         SC.app        # Controller: State, View-Modelle, Event-Delegation
│
├── build.js                     # Erzeugt die Einzeldatei HolaRuta.html
├── service-worker.js            # Offline-Cache (Cache-first + App-Shell-Fallback)
├── manifest.webmanifest         # PWA-Manifest (Name, Icons, Theme)
├── icon.svg                     # App-Icon
│
├── test/                        # 285 Tests in 25 Dateien (node:test, keine Dependencies)
└── AUDIT.md                     # Vollständiges Code-/UX-/A11y-/Security-Audit
```

### Architektur-Entscheidungen

| Entscheidung | Begründung |
|---|---|
| **Kein Framework, kein Bundler** | Maximale Langlebigkeit & Portabilität. Die App ist in 10 Jahren noch ladbar. |
| **`window.SC`-IIFE-Module** | Klare Trennung ohne Build-Step; jedes Modul hat eine einzige Verantwortung. |
| **Reine Logik (`srs`/`matcher`/`stats`)** | Kennt weder DOM noch `localStorage` → trivial test- & wiederverwendbar. |
| **Immutability durchgängig** | Funktionen geben **neue** Objekte zurück, mutieren nie das Original — keine versteckten Seiteneffekte. |
| **Event-Delegation** | Ein einziger Listener auf `#app`; Buttons tragen `data-action`. Keine Listener-Leaks beim Re-Render. |
| **Single Source of Truth** | Ein `state`-Objekt im Controller; jede Aktion → `render()`. |

> **Randbedingung GitHub Pages:** Alle Pages-Projekte eines GitHub-Accounts laufen unter derselben Origin (`https://<user>.github.io`) und teilen sich damit `localStorage` und Speicher-Quota. Jedes andere dort gehostete Projekt kann HolaRutas gespeicherte Daten lesen oder überschreiben, und der gemeinsame Speicherplatz zahlt auf dasselbe Quota ein. Die `spanischcard.*`-Schlüsselpräfixe vermeiden versehentliche Kollisionen, ersetzen aber keine echte Isolation.

---

## 🚀 Schnellstart

HolaRuta braucht **keine Installation und keinen Build**. Es ist statisches HTML/CSS/JS.

### Variante A — einfach öffnen (Einzeldatei)

```bash
# HolaRuta.html ist die fertige, eigenständige Version (alles eingebettet).
# Nicht im Repo eingecheckt: einmal `node build.js` ausführen ODER von
# https://moarci.github.io/holaRuta/HolaRuta.html laden.
# Dann Doppelklick — läuft offline, ohne Server.
```

> **Hinweis:** In der Einzeldatei sind PWA-Features (Service Worker, Installation) deaktiviert, da `file://` keinen Service Worker erlaubt. Für die volle PWA siehe Variante B.

### Variante B — als PWA lokal servieren (volle Funktion)

```bash
# Beliebiger statischer Server im Projektordner, z.B.:
npx serve .
#  →  http://localhost:3000

# Alternativ Python:
python -m http.server 3000
```

Im Browser öffnen → die App registriert den Service Worker, wird offline-fähig und lässt sich über „Zum Startbildschirm hinzufügen" installieren.

### Variante C — als PWA online (GitHub Pages)

Für die App auf dem **Android-Startbildschirm**, ohne die Datei je wieder zu suchen:

1. In **Settings → Pages** als Quelle **„GitHub Actions"** wählen (einmalig). Der Workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) veröffentlicht den Projektordner bei jedem Push auf `main`.
2. Die ausgespielte Adresse (`https://<user>.github.io/holaRuta/`) einmal auf dem Handy öffnen.
3. Im Profil-Reiter auf **„📲 App installieren"** tippen (Android) bzw. der dort eingeblendeten **iOS-Anleitung** folgen.

Danach liegt HolaRuta als eigenes App-Icon auf dem Startbildschirm – ein Tipp startet die App, offline-fähig, kein Datei-Suchen mehr.

### Voraussetzungen

| Zweck | Anforderung |
|---|---|
| App nutzen | Moderner Browser (Chrome, Safari, Firefox, Edge) |
| Tests / Build | Node.js ≥ 18 (nur für `node --test` und `node build.js`) |

> Es gibt **keine** Laufzeit-Abhängigkeiten. `package.json` enthält nur zwei Scripts (`test`, `build`) und keinerlei `dependencies`.

---

## 📦 Single-File-Build

Quelle der Wahrheit sind immer die **Module**. [build.js](build.js) fügt sie zu einer versandfertigen Einzeldatei zusammen:

```bash
node build.js
#  ✓ HolaRuta.html erzeugt.
#    Eingebettet: styles.css, data.js, countries.js, srs.js, …
```

**Was der Build tut:**

- Bettet `styles.css` als `<style>` ein
- Bettet jedes `<script src="…">` als Inline-`<script>` ein (in Ladereihenfolge)
- Escaped `</script>` im Code, damit der HTML-Parser nicht stolpert
- Entfernt PWA-Verweise (Manifest/Icon lösen unter `file://` nicht auf)
- Externe Links (Google Fonts) bleiben unverändert

> **Wichtig:** `HolaRuta.html` ist ein **Ergebnis** des Builds, wird nie von Hand bearbeitet und ist **nicht im Repo eingecheckt** (`.gitignore`). CI baut sie beim Deploy frisch und stellt sie unter `https://moarci.github.io/holaRuta/HolaRuta.html` bereit.

### Co-Branding-Editionen

Für Partner (Sprachschulen, Reiseanbieter, Hostels) lässt sich eine **Edition** bauen — gleiche App, nur mit Akzentfarbe, App-Name, dezentem Credit und vorbelegtem Reiseziel:

```bash
node build.js --edition=ecos     #  ✓ HolaRuta-ecos.html   (Karibik-Teal · „· ECOS“ · Cartagena)
node build.js --edition=weroad   #  ✓ HolaRuta-weroad.html (Coral · „· WeRoad Colombia“)
```

Alle Editionen liegen zentral in [`editions/registry.js`](editions/registry.js) (Quelle der Wahrheit: Name, Akzent, Partner, Logo, Default-Ziel, Reiter); [config.js](config.js) merged sie über die Standardwerte. Ohne Edition entsteht das pure HolaRuta — **der Default bleibt unangetastet** (graceful). Sichtbar werden Akzentfarbe (`--brand`/`--brand-ink`, wirkt in Hell & Dunkel), Tab-Titel, ein dezenter Appbar-Zusatz (`· ECOS`), Partner-Logo (Profil + Onboarding) und der Profil-Credit; der Hell/Dunkel-Rahmen (`--page`/`theme-color`) bleibt unangetastet. Die `HolaRuta-*.html`-Editionen sind reproduzierbare Build-Ausgaben und nicht eingecheckt.

**Teilbarer Link (ohne eigenen Build):** Auf der gehosteten App wählt der Parameter `?edition=<id>` die Edition zur Laufzeit, `?start=onboarding` startet direkt das Onboarding (inkl. Ruta-Check). So verschickt eine Schule/Partnerfirma EINEN gebrandeten Einstiegslink:

```
https://moarci.github.io/holaRuta/?edition=ecos&start=onboarding
```

Eine fest gebaute Edition (`--edition=…`) kann per URL **nicht** überschrieben werden.

> Logo/Name eines Partners nur mit dessen Freigabe verwenden; bis dahin neutral co-branded (Farbe + Textzusatz, ohne Logo). Auf GitHub Pages teilen sich Editionen derselben Origin den `localStorage` — echte Trennung erst bei eigenem Deploy/Domain.

---

## Datenmodell

Alles Persistente liegt im `localStorage` — sauber versioniert und durch Strukturwächter gegen Korruption abgesichert ([store.js](store.js)).

| Key | Inhalt |
|---|---|
| `spanischcard.progress.v2` | Lernfortschritt pro Karte (SRS-Zustand + Statistik-Felder) |
| `spanischcard.settings.v1` | Einstellungen (Modus, Richtung, Stufen-Filter, Share-Format, Theme, letzte Kategorie, Einstellungs-Panel auf/zu) |
| `spanischcard.usercards.v1` | Vom Nutzer angelegte eigene Karten |
| `spanischcard.gamestats.v1` | Ruta-Pass: Spiel-Zähler (Streak, Tageszeit-Marken, „Nochmal“, Hostel-Mode-Battles & -Rollenspiele, Definiciones-Quizze, Hör-Reviews, Precios- & Frases-Runden, Ruta-del-día-Tage, geöffnete Reise-Kontexte) + freigeschaltete Badges |

### Karte

```js
{ id: "b18", cat: "notfall", lvl: 2, de: "Ich brauche einen Arzt",
  es: "Necesito un médico", tip: "ne-ce-SI-to un ME-di-co", alt?: [...],
  context?: { sentenceEs, sentenceDe, situation, note } }
```

| Feld | Bedeutung |
|---|---|
| `cat` | Kategorie-Id (eine von 19) |
| `lvl` | Stufe: `1` Einsteiger (A1) · `2` Mittel (A2) · `3` Fortgeschritten (B1) |
| `de` | Frage (Deutsch) |
| `es` | Antwort (Spanisch); mehrere gültige Antworten mit `/` getrennt |
| `tip` | Aussprache-/Merkhinweis (optional) |
| `alt` | Explizite Liste akzeptierter Tipp-Antworten (optional) |
| `context` | Reise-Kontext (optional): `sentenceEs`/`sentenceDe` (echter Beispielsatz), `situation` (wann nutzt man das?), `note` (kurzer Reisetipp). Per **🧭 Kontext**-Button aufklappbar |

### Lernzustand pro Karte (`progress[id]`)

```js
{ ease: 2.5, interval: 6, due: 1717977600000, reps: 3,   // SRS
  seen: 4, again: 1, good: 2, easy: 1, lapses: 0,         // Statistik
  firstAt, lastAt, firstRating: "good", history: "gage" } // Verlauf
```

### Kartenstatus (abgeleitet)

| Status | Bedingung |
|---|---|
| **new** | Noch nie bewertet |
| **learning** | Bewertet, Intervall < 5 Tage |
| **firming** | „Fast geschafft" — am Lernen, aber Intervall ≥ 3 Tage (Teilmenge von *learning*; nur Anzeige) |
| **mastered** | Intervall ≥ 5 Tage |
| **hard** | ≥ 2× gesehen und Trefferquote < 60 % |
| **firstTry** | Auf Anhieb gewusst — erste Bewertung Gut/Einfach und nie „Nochmal" |

---

## 🧠 Spaced Repetition (SM-2)

[srs.js](srs.js) implementiert eine vereinfachte **SM-2**-Engine als reine, immutable Funktion: `review(state, rating) → newState`.

| Bewertung | Wirkung |
|---|---|
| **Nochmal** (`again`) | `ease − 0.2` (min. 1.3), Intervall → 0, in ~1 Min. erneut in derselben Sitzung |
| **Gut** (`good`) | rep 0 → 1 Tag · rep 1 → 3 Tage · danach `interval × ease` |
| **Einfach** (`easy`) | `ease + 0.15`, rep 0 → 3 Tage · rep 1 → 6 Tage · danach `interval × ease` |

- **Ease-Grenzen:** `1.3 ≤ ease ≤ 3.0`
- **Fälligkeit:** `isDue` ist `true`, sobald `due ≤ jetzt` (neue Karten sind sofort fällig)
- **Re-Queue:** „Nochmal" hängt die Karte ans Ende der laufenden Sitzung

Bei Sitzungsstart wählt der Controller alle **fälligen** Karten im gewählten Bereich/Stufen-Filter. Ist nichts fällig, startet automatisch **freies Üben** über alle Karten des Bereichs. Eine Runde umfasst höchstens **20 Karten** – der Rest bleibt fällig und kommt in der nächsten Runde dran.

---

## 🎖️ Ruta-Pass (Badges)

[badges.js](badges.js) ist eine **reine Daten-/Funktionsschicht** im Stil von `srs`/`stats`: sie kennt weder DOM noch Speicher. Ein Badge ist nur eine Beschreibung; ob es freigeschaltet ist, ergibt sich generisch aus einer **Metrik + Schwelle**.

```
progress + gamestats  →  buildMetrics()  →  metrics  →  evaluate()  →  Stempel-Liste
```

| Badge-Typ | Bedeutung |
|---|---|
| `counter` | `metrics[metric] ≥ threshold` (z.B. 50 gelernte Karten, Streak ≥ 7) |
| `flag` | Ein Ereignis ist eingetreten (z.B. nach 22 Uhr gelernt) |
| `categoryMastery` | ≥ 80 % der Karten eines Bereichs gemeistert |
| `allReviewed` | Alle Karten mindestens einmal gelernt |

**Gruppen:** Lernreise (Lernmenge), Dranbleiben (Streak), Bereiche (je Kategorie ein Stempel — inkl. **Hostel** & **Social**), **Reise-Kontext** (geöffnete 🧭-Kontexte: *Erster Aha-Moment* → *Kontext-Kompass* → *Real-Life Ready*), **Hostel Mode** (Battle & Rollenspiele), **Definiciones** (abgeschlossene & fehlerfreie Zuordnen-Quizze), **Mutproben** (Real-Life Challenges) und Spezial (inkl. **Geheim-Stempel**, die erst nach Freischaltung sichtbar werden).

Der **Hostel Mode** zahlt direkt auf den Pass ein: ein beendetes Battle schaltet *First Duel* frei, ein klarer Sieg *Dorm Champion*, eine fehlerfreie Partie *Perfect Check-in*, ein Sieg nach Rückstand *Comeback Kid*; gespielte Rollenspiele füllen *First Scene* und *Scene Collector*. Hakst du die **Real-Life Challenge** nach einem Battle als „geschafft“ ab, zahlt das auf *Mutiger erster Satz*, *Comfort Zone Exit* und *Straßen-Spanisch* ein (47 Challenges im Pool). Gezählt wird in denselben `gamestats` (battlesPlayed/-Won/perfect/comebacks, distinkte Rollenspiele & Challenges).

- **Tracking:** Beim Bewerten bucht der Controller einen kleinen Satz Spiel-Zähler in `gamestats` (Gesamt-Bewertungen, Lern-Serie/Streak, Tageszeit-Marken, „Nochmal“-Drücke) und schaltet erfüllte Badges frei.
- **Freischaltung bleibt erhalten:** Einmal vergeben, bleibt ein Stempel im Pass — auch wenn sich abgeleitete Werte später ändern. Eine kurze Glückwunsch-Einblendung zeigt frische Stempel.
- **Bestandsnutzer:** Beim Start werden bereits erfüllte Badges still nachgetragen (kein Einblendungs-Stau).
- **Konsistenz:** „Fortschritt zurücksetzen“ löscht auch Streak & Stempel.

---

## 🔍 Antwort-Matcher

Der Schreiben-Modus prüft Eingaben **großzügig** ([matcher.js](matcher.js)) — Lernende sollen am Inhalt scheitern, nicht an Tippfehlern:

```js
matcher.check("necesito un medico", card)   // → { correct: true, … }
```

Normalisiert wird über:

- **Groß-/Kleinschreibung** → egal (`MEDICO` = `médico`)
- **Akzente** → egal, via NFD-Zerlegung (`médico` = `medico`)
- **Satzzeichen** → entfernt (`¿`, `?`, `¡`, `!`, `.`, `,`, `;`, `:`)
- **Mehrfach-Leerzeichen** → auf eines reduziert
- **Mehrfachantworten** → jede `/`-Alternative bzw. jeder `alt[]`-Eintrag matcht eigenständig

---

## 📲 Offline & PWA

[service-worker.js](service-worker.js) macht HolaRuta zur installierbaren, offline-fähigen App:

- **Strategie:** *Cache-first* für die App-Shell — startet sofort, auch ohne Netz
- **Versionierung:** `CACHE_VERSION` = Inhalts-Hash der Assets, automatisch von `node build.js` gestempelt (nie von Hand) → ändert sich eine ausgelieferte Datei, wird der alte Cache beim Aktivieren entfernt und frische Inhalte geladen. Ein Test (`test/sw-version.test.js`) + der CI-Drift-Check blockieren einen veralteten Cache.
- **Navigations-Fallback:** Bei Seitenaufrufen ohne Treffer liefert der SW `index.html` statt eines Netzwerkfehlers
- **Manifest:** Standalone-Display, Portrait, Markenfarbe `#241510`, Kategorien `education` + `travel`

---

## ⚙️ Tech Stack

| Schicht | Technologie | Begründung |
|---|---|---|
| **Sprache** | Vanilla JavaScript (ES2017) | Keine Transpilation nötig, läuft überall, altert nicht |
| **UI** | Eigenes String-Rendering → `innerHTML` | Kein Virtual DOM, kein Framework-Overhead |
| **State** | Ein `state`-Objekt + `render()` | Vorhersehbar, debugbar, minimal |
| **Styling** | Handgeschriebenes CSS | Erdton-Palette, CSS Custom Properties, 3D-Flip, Responsive |
| **Persistenz** | `localStorage` (gekapselt in `store`) | Kein Backend, volle Datenhoheit beim Nutzer |
| **Sprachausgabe** | Web Speech API (`SpeechSynthesis`) | Eingebaut, keine Dependency, LatAm-Stimmenwahl |
| **Sharepics** | Canvas 2D | Generiert PNGs für Web Share API ohne Server |
| **Offline** | Service Worker + Web App Manifest | Installierbare PWA |
| **Tests** | `node:test` (eingebaut) | Null Test-Dependencies |
| **Schriften** | Bricolage Grotesque + Instrument Sans | Mit System-Font-Fallback offline |

**Laufzeit-Dependencies: 0.** &nbsp;|&nbsp; **Build-Dependencies: 0.** &nbsp;|&nbsp; **Test-Dependencies: 0.**

---

## 🎯 Design-Prinzipien

| # | Regel | Begründung |
|---|---|---|
| 1 | **Reine Daten getrennt von reiner Logik** | `data`/`countries` enthalten keine Logik; `srs`/`matcher`/`stats` enthalten keine Daten oder I/O. |
| 2 | **Immutability** | Funktionen geben neue Objekte zurück (`Object.assign({}, …)`), mutieren nie das Original. |
| 3 | **Graceful Degradation** | Jede optionale Fähigkeit (TTS, Share, SW, localStorage) wird geprüft, bevor sie genutzt wird. |
| 4 | **Single Source of Truth** | Ein `state`; jede Aktion endet in `render()`. Kein verstreuter UI-Zustand. |
| 5 | **Inhalte sind heilig** | Die Wörterbasis wird nur mit Beleg geändert — keine „Verbesserung" auf Verdacht. |
| 6 | **A11y by Default** | Fokus nach Render gesetzt, `aria-live` für Ergebnisse, Reduced-Motion respektiert, Tap-Targets ≥ 44px. |

---

## 🧪 Tests

Die testbare Kernlogik (`srs`, `matcher`, `stats`) ist vollständig von DOM und Speicher entkoppelt und wird mit dem **eingebauten Node-Test-Runner** geprüft — ohne jede Dependency.

```bash
npm test            # bzw. node --test
#  ℹ tests 285
#  ℹ pass 285
#  ℹ fail 0
```

Statische Prüfung:

```bash
node --check *.js   # Syntax-Check aller Module
node build.js       # Build muss fehlerfrei durchlaufen
```

Zusätzlich wurde die App in einem **Live-Browser-Audit** (Playwright) end-to-end gegengeprüft: Home, Flip, Rating, Type-Matcher, Persistenz nach Reload, Editor, XSS-Probe, Statistik — **0 Konsolen-Errors**. Details in [AUDIT.md](AUDIT.md).

---

## 📊 Projektstatus

| Kennzahl | Wert |
|---|---|
| Karten | 2278 |
| Bereiche / Kategorien | 32 |
| Stufen | 3 (A1, A2, B1) |
| Länderkunde | 19 Länder, 3 Regionen |
| JS-Module | 32 (`SC.*`) |
| Tests | 285 (alle grün) |
| Laufzeit-Dependencies | 0 |
| Code-Audit | abgeschlossen — 0 CRITICAL ([AUDIT.md](AUDIT.md)) |

**Audit-Ergebnis (Stand 2026-06-10):** Keine CRITICALs — kein Crash, kein exploitierbares XSS, keine falschen Übersetzungen. Schwerpunkte der Nacharbeit lagen in **Accessibility** und **PWA-Details**; die wichtigsten Fixes sind umgesetzt.

---

## 🏫 Für Schulen, Reisen & Hostels

Druckfertige Anleitungen (DE · EN · ES) für den Einsatz in Sprachschulen, auf Gruppenreisen und in Hostels liegen unter [`docs/anleitungen/`](docs/anleitungen/index.html) — im Browser öffnen, Sprache wählen, per **Strg/Cmd + P → „Als PDF speichern“** ausdrucken:

- **[Für den Unterricht](docs/anleitungen/lehrer.html)** — Stundenaufbau + 10 Stunden-Rezepte für Lehrkräfte.
- **[Für Reiseleiter](docs/anleitungen/coordinator.html)** — kleine Gruppen-Aktivitäten, in Sekunden startklar.
- **[Hostel-Aushang „Spanish Night“](docs/anleitungen/hostel.html)** — Poster mit **echtem QR-Code** für den Common Room.

**Go-to-Market** unter [`docs/pitch/`](docs/pitch/index.html):
- **[Pitch-One-Pager](docs/pitch/index.html)** (DE·EN·ES) — die versendbare „schick mir was"-Seite mit Live-Demo-QR.
- **[WeRoad-Colombia-Proposal](docs/pitch/weroad-colombia.html)** (DE·EN) — ausgearbeitetes Gruppenreise-Beispiel: Route↔Inhalt, 3-Phasen-Modell, Coordinator-Playbook, Preise, Pilot.
- **[Outreach-Anschreiben](docs/pitch/anschreiben.md)** — copy-paste, je Zielgruppe (Schule/Hostel/Reiseleiter), DE·EN·ES.
- **[Zielkunden-Fahrplan](docs/pitch/zielkunden.md)** — priorisierte Kontaktliste + Vorgehen.

> Hintergrund & Vertriebsstrategie: [MARKT.md](MARKT.md) · technische Roadmap: [BAUPLAN.md](BAUPLAN.md) · optionales Stufe-3-Backend (Spec): [BACKEND.md](BACKEND.md).

---

## 🤝 Beitragen

- **Neue Karte:** ans passende Array in [data.js](data.js) anhängen (`lvl` nicht vergessen).
- **Neue Kategorie:** oben in `CATEGORIES` ergänzen.
- **Logik geändert?** `node --test` muss grün bleiben.
- **Vor dem Versand:** `node build.js` ausführen — `HolaRuta.html` nie von Hand editieren.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`).

---

## 📄 Lizenz

Privates Projekt — alle Rechte vorbehalten.
Keine Nutzung, Vervielfältigung oder Verbreitung ohne ausdrückliche Genehmigung.

---

<div align="center">

**HolaRuta** — Reise-Spanisch für echte Situationen. 🌶️

</div>
