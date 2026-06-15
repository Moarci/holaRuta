/*
 * changelog.js  (SC.changelog) – Versionsstand & Änderungsverlauf.
 *
 * Eine einzige Quelle der Wahrheit für „welche Version ist das" und „was hat
 * sich geändert". Der Controller (app.js) merkt sich die zuletzt gesehene
 * Version im Speicher; weicht sie beim Start von VERSION ab, blendet die App
 * einen Hinweis ein, WAS neu ist und WIE man aktuell bleibt.
 *
 * Pflege: bei jeder veröffentlichten Änderung oben einen neuen Eintrag
 * ergänzen (NEUESTE zuerst). Den Service-Worker-Cache muss man NICHT mehr von
 * Hand hochzählen – `node build.js` stempelt CACHE_VERSION automatisch aus dem
 * Inhalts-Hash der Assets (siehe swversion.js).
 *
 * Öffentlich (window.SC.changelog):
 *   VERSION         – aktuelle App-Version (= neuester entries-Eintrag)
 *   entries         – Verlauf, NEUESTE zuerst: { version, date, title, items[] }
 *   since(seen)     – Einträge, die neuer sind als die zuletzt gesehene Version
 */
(function () {
  "use strict";

  // NEUESTE zuerst. entries[0].version ist die aktuelle App-Version.
  const entries = [
    {
      version: "1.54.0",
      date: "2026-06-15",
      title: "Gebrandeter Einstiegslink: direkt ins Onboarding, mit Partner-Logo",
      items: [
        "🔗 Eine Schule oder Partnerfirma kann jetzt EINEN Link verschicken, der die App direkt im Onboarding öffnet – inkl. Reiseziel und Ruta-Check. Parameter: ?start=onboarding (und ?edition=… fürs Branding).",
        "🎨 Branding per Link: ?edition=ecos bzw. ?edition=weroad öffnet die App in den Farben, mit Namen und Logo des Partners – ohne eine eigene Datei zu verteilen. Eine fest gebaute Edition lässt sich per URL nicht überschreiben.",
        "🏷️ Das Partner-Logo erscheint beim ersten Start (Onboarding) oben – nicht nur im Profil.",
      ],
    },
    {
      version: "1.53.0",
      date: "2026-06-15",
      title: "Ruta-Check: fairere Einstufung + Qualitäts-Hinweis",
      items: [
        "🧠 Genauere Einstufung: Wer im adaptiven Test schwere Fragen richtig löst, wird jetzt nicht mehr durch ein paar Treffer-Fehlversuche unter Wert eingestuft – das demonstrierte Niveau zählt mit (IRT-artig).",
        "🛡️ Neuer Zuverlässigkeits-Hinweis am Ende: erkennt sehr schnelles Klicken oder wahlloses Raten und schlägt eine ruhige Wiederholung vor; viele ehrliche „weiß nicht“ werden positiv eingeordnet. Fließt NICHT in den Score, nur als Einordnung.",
        "📊 Der Fortschrittsbalken füllt sich nun bis 100 %.",
      ],
    },
    {
      version: "1.52.0",
      date: "2026-06-15",
      title: "Modo profe wandert in den Tarea-Reiter (Editionen) + Ruta-Check-Feinschliff",
      items: [
        "🧑‍🏫 In Schul-/Reise-Editionen gibt es jetzt EINEN „Tarea“-Reiter statt zwei: Modo profe hängt direkt im Tarea-Bereich mit drin (ein Tipp weiter), die untere Navigation bleibt aufgeräumt.",
        "🔧 Review-Fixes am Ruta-Check: der Zurück-Pfeil während des Onboarding-Tests schließt das Onboarding jetzt sauber ab (vorher konnte es erneut erscheinen), Doppeltipp auf eine Antwort wird abgefangen, und der Test-Zustand wird beim Verlassen ordentlich gelöst.",
        "🗣️ Inhaltliche Korrektur zweier Testfragen (eindeutige Höflichkeitsform statt Mehrdeutigkeit; mehr akzeptierte Schreibweisen bei einer freien Antwort).",
      ],
    },
    {
      version: "1.51.0",
      date: "2026-06-15",
      title: "Ruta-Check wird adaptiv – und Teil des Onboardings",
      items: [
        "🪜 Der Ruta-Check passt sich jetzt an: Wer richtig antwortet, bekommt schwerere Fragen, wer danebenliegt oder „weiß nicht“ wählt, leichtere – so landet die Einstufung schneller und genauer beim echten Niveau (A0 bis B1−). Zum Schluss kommen die freien Antworten.",
        "🧭 Beim allerersten Start führt das Onboarding direkt durch den Test (mit „Später“-Option) – nach dem Reiseziel kommt der Ruta-Check, damit die Einstufung tatsächlich gemacht wird.",
        "🎚️ Neue ganz leichte (A0) und fordernde (B1) Fragen geben der Anpassung Spielraum; die Grammatik bleibt dosiert (Deckel ~30 %).",
      ],
    },
    {
      version: "1.50.0",
      date: "2026-06-15",
      title: "Ruta-Check: kurzer, reisepraktischer Einstufungstest",
      items: [
        "🎯 Neuer „Ruta-Check“ unter Entdecken: 24 Fragen in echten Reisesituationen (Verstehen, Reagieren, Wortschatz) plus dosiert Konjugation & Zeiten (~30 %) – Kommunikation steht im Vordergrund, nicht trockene Grammatik.",
        "🤷 Jede Frage hat „Ich weiß es nicht“ – ehrliches Nichtwissen statt Raten. Das macht die Einstufung fairer und genauer.",
        "📊 Am Ende ein Profil statt nur einer Note: Startlevel (A0–B1−), Trefferquote, „weiß-nicht“-Anteil, Tempo und eine Aufschlüsselung nach Bereichen – plus ein Hinweis, ob jemand kommunikativ oder grammatikalisch stärker ist.",
        "🧑‍🏫 Das Ergebnis erscheint im „Modo profe“ als eigene Spalte (Level · Score), sobald ein Schüler sein Backup teilt – hilfreich für die Gruppenzuteilung.",
      ],
    },
    {
      version: "1.49.0",
      date: "2026-06-15",
      title: "Zugewiesenes Reiseziel ist fix + Kopieren/Einfügen funktioniert mobil",
      items: [
        "🎯 Öffnet ein Lernender eine zugewiesene Pre-Trip-Aufgabe, ist das Reiseziel jetzt fest auf das vom Lehrer gewählte Land gestellt – es erscheint nur dieses (z. B. Mexiko), nicht mehr die ganze Länder-Auswahl mit Kolumbien vorausgewählt.",
        "📋 Kopieren klappt jetzt auch in der heruntergeladenen Einzeldatei/WebView (per execCommand statt nur moderner Zwischenablage-API) – mit „✓ Kopiert!“ statt „mit Strg+C kopieren“.",
        "📥 „Einfügen“ holt den Code, wo der Browser es erlaubt; sonst springt der Cursor ins Feld mit dem Hinweis, lang zu tippen und „Einfügen“ zu wählen – statt wirkungslos zu sein.",
      ],
    },
    {
      version: "1.48.0",
      date: "2026-06-15",
      title: "Editionen: Modo profe & Tarea als eigene Reiter, raus aus Entdecken",
      items: [
        "🧑‍🏫 In Schul-/Reise-Editionen (ECOS, WeRoad) bekommt jetzt auch „Modo profe“ einen eigenen Reiter in der unteren Navigation – neben „Tarea“.",
        "🧭 Beide sind dort nicht mehr doppelt als Kachel unter „Entdecken“ – das hält die Navigation aufgeräumt. Im Standard-HolaRuta bleibt alles wie gehabt (beide als Kachel, keine Extra-Reiter).",
      ],
    },
    {
      version: "1.47.0",
      date: "2026-06-15",
      title: "Aufgaben erstellen: Auswahl bleibt stehen + klares Kopieren/Einfügen",
      items: [
        "🎯 Im „Modo profe“ bleibt das gewählte Aufgaben-Ziel (Land/Paket), der Titel und die Frist jetzt nach „Code erzeugen“ stehen – vorher sprang die Auswahl zurück auf das erste Land.",
        "🧾 Unter dem erzeugten Code steht jetzt im Klartext, wofür er ist (z. B. „Code für: Pre-Trip-Plan: Peru“) – so siehst du sofort, dass deine Auswahl übernommen wurde.",
        "📋 Kopieren bestätigt mit einem kurzen „✓ Kopiert!“ direkt am Knopf; auf der Lernenden-Seite gibt es einen „Einfügen“-Knopf, der den Code aus der Zwischenablage holt – beides mit sichtbarer Rückmeldung.",
      ],
    },
    {
      version: "1.46.0",
      date: "2026-06-15",
      title: "Nach der Etappe zurück zum Plan – und ein eigener „Tarea“-Reiter",
      items: [
        "🧭 Schließt du eine Pre-Trip-Etappe oder eine zugewiesene Aufgabe ab, führt der Fertig-Screen jetzt direkt dorthin zurück (zum Pre-Trip-Plan bzw. zur Aufgabe) – die nächste Etappe ist sofort sichtbar, statt ganz zur Übersicht oder in die Statistik zu springen.",
        "📝 Schul- und Reise-Editionen (ECOS, WeRoad) bekommen einen eigenen „Tarea“-Reiter in der unteren Navigation, damit Aufgaben-Codes mit einem Tap erreichbar sind.",
      ],
    },
    {
      version: "1.45.0",
      date: "2026-06-15",
      title: "Optionale Cloud-Sync – Fundament für Schul-/Partner-Editionen",
      items: [
        "☁️ Optionale, opt-in Cloud-Sync: passwortlos anmelden und den Fortschritt geräteübergreifend zusammenführen. Standard bleibt komplett offline – ohne Edition und ohne Login gibt es keinerlei Netzwerk.",
        "🔀 Verlustarmes Zusammenführen (Mengen werden vereint, Zähler aufs Maximum gezogen, Karten nach Lernfortschritt) als reine, getestete Funktion. Als Beispiel für die ECOS- und WeRoad-Edition vorverdrahtet; ein lokaler Mock-Server liegt für Demos bei.",
      ],
    },
    {
      version: "1.44.0",
      date: "2026-06-15",
      title: "Aufgaben teilen: Zuweisung per Code – ganz ohne Konto",
      items: [
        "📝 Lehrkräfte und Reiseleiter können unter „Modo profe“ eine Aufgabe erstellen – ein Pre-Trip-Plan, ein Pre-Arrival-Paket oder ein ganzes Reise-Paket, optional mit Titel und Frist – und sie als kurzen Code teilen (WhatsApp, Mail, QR).",
        "🎯 Lernende öffnen unter „Tarea“ den Code und werden direkt in die zugewiesene Übung geführt. Komplett offline, ohne Konto und ohne Server.",
      ],
    },
    {
      version: "1.43.0",
      date: "2026-06-15",
      title: "Modo profe: Klassenübersicht für Lehrkräfte & Reiseleiter",
      items: [
        "🧑‍🏫 Neuer „Modo profe“ unter Entdecken: Schüler exportieren ihren Fortschritt im Profil als Backup-Datei, du importierst die Dateien und bekommst eine Klassenübersicht – gemeisterte Karten, Destination-Pakete, Pre-Trip-Etappen, Challenges und Lern-Serie pro Person.",
        "🔒 Komplett offline und ohne Konto: die Schülerdaten bleiben nur in dieser Sitzung, nichts wird gespeichert oder gesendet, dein eigener Fortschritt bleibt unangetastet. Druckbar für die Unterlagen.",
      ],
    },
    {
      version: "1.42.0",
      date: "2026-06-15",
      title: "Drei neue Reise-Pakete: Argentinien, Chile & Bolivien",
      items: [
        "🇦🇷 Neuer Bereich „Argentinien“ mit 40 Karten: Buenos Aires (Tango, San Telmo), Patagonien (Perito Moreno, Fitz Roy, Ushuaia), Iguazú und Mendoza – mit rioplatense Voseo (che, dale, bárbaro), Asado, Mate und Wechselkurs-Tipps.",
        "🇨🇱 Neuer Bereich „Chile“ mit 40 Karten: Santiago, Valparaíso, Atacama (Valle de la Luna, El Tatio) und Torres del Paine – mit Chilenismen (cachái, bacán, al tiro, po), Completo, Once und Pisco.",
        "🇧🇴 Neuer Bereich „Bolivien“ mit 40 Karten: La Paz (Teleférico, Hexenmarkt), Salar de Uyuni, Titicaca, Potosí und Sucre – mit Aymara-Gruß (Kamisaraki), Höhe/soroche, Cholita, Trufi und Salteña.",
        "🗓️ Alle drei auch im Pre-Trip-Plan wählbar, je mit Pre-Arrival-Kachel und zwei Real-Life-Mutproben.",
      ],
    },
    {
      version: "1.41.0",
      date: "2026-06-15",
      title: "Zwei neue Reise-Pakete: Ecuador & Guatemala",
      items: [
        "🇪🇨 Neuer Bereich „Ecuador“ mit 40 Karten: Quito & Mitad del Mundo, Otavalo-Markt, Cotopaxi & Quilotoa, Baños, Amazonas/Tena (+ Galápagos-Verlängerung) – mit US-Dollar-Hinweis und Anden-Slang (achachay, ¿qué fue?, Alli puncha).",
        "🇬🇹 Neuer Bereich „Guatemala“ mit 40 Karten: Antigua, Lago de Atitlán, Chichicastenango-Markt, Tikal/Flores, Acatenango/Fuego, Semuc Champey – mit Quetzal, Chicken Bus/Tuk-Tuk und Maya-Kultur (Saqʼarik, chapín, chilero).",
        "🗓️ Beide auch im Pre-Trip-Plan wählbar, je mit Pre-Arrival-Kachel und zwei Real-Life-Mutproben.",
      ],
    },
    {
      version: "1.40.0",
      date: "2026-06-15",
      title: "Pre-Trip-Plan jetzt für vier Reiseziele",
      items: [
        "🗓️ Der Pre-Trip-Plan deckt jetzt Kolumbien, Peru, Mexiko und Costa Rica ab – wähle dein Reiseziel oben über die Chips. Jedes Ziel hat seine eigenen 7 Etappen mit kuratierten Karten und Real-Life-Mutprobe.",
        "🧳 Der Fortschritt wird je Reiseziel getrennt gespeichert; den Stempel „Reisefertig“ gibt es, sobald du einen kompletten Plan geschafft hast. Bestehender Kolumbien-Fortschritt bleibt erhalten.",
        "🎯 Welches Ziel vorausgewählt ist, richtet sich nach deinem Trip-Ziel (z. B. „Cusco“ → Peru).",
      ],
    },
    {
      version: "1.39.0",
      date: "2026-06-15",
      title: "Zwei neue Reise-Pakete: Mexiko & Costa Rica",
      items: [
        "🇲🇽 Neuer Bereich „Mexiko“ mit 41 Karten entlang der „Mexiko 360°“-Route: CDMX, Teotihuacán, Oaxaca (Mezcal, chapulines), Chiapas (Sumidero-Canyon, San Cristóbal, Palenque) und Yucatán (Cenoten, Chichén Itzá, Tulum, Bacalar) – mit Día de Muertos und mexikanischem Slang (¿mande?, ¡órale!, ¡aguas!, chido).",
        "🇨🇷 Neuer Bereich „Costa Rica“ mit 40 Karten: San José, Karibik (Tortuguero, Puerto Viejo, Bribri-Kakao), Arenal/Río Celeste, Monteverde (Nebelwald, Canopy), Manuel Antonio – mit Wildlife (perezoso, tucán), Tico-Slang (pura vida, mae, tuanis) und gallo pinto/casado.",
        "🇲🇽🇨🇷 Pre-Arrival-Kacheln für Mexiko und Costa Rica plus vier neue Real-Life-Mutproben.",
      ],
    },
    {
      version: "1.38.0",
      date: "2026-06-15",
      title: "Pre-Arrival Peru: die wichtigsten Sätze auf einen Tap",
      items: [
        "🇵🇪 Neue Dashboard-Kachel „Pre-Arrival Peru“ – ein Tap startet die 20 wichtigsten Sätze für die Ankunft (Gruß, Taxi, Höhe & Kokatee, Geld, Essen, Sicherheit). Erscheint automatisch, wenn dein Trip-Ziel Peru meint (Lima, Cusco, Machu Picchu …).",
      ],
    },
    {
      version: "1.37.0",
      date: "2026-06-15",
      title: "Neues Reise-Paket: Peru (Cusco, Machu Picchu & Anden)",
      items: [
        "🇵🇪 Neuer Bereich „Peru“ mit 45 ortsspezifischen Karten entlang der klassischen Route: Lima, Höhe & Kokatee (soroche), Arequipa & Colca-Canyon (Kondore), Titicacasee/Puno (schwimmende Inseln), Cusco & Heiliges Tal, Machu Picchu, Regenbogenberg – mit Reise-Kontext für jede Karte.",
        "🍽️ Inklusive Essen & Kultur: Ceviche, Lomo Saltado, Pisco Sour, Cuy, Chicha Morada, Alpaka-Markt, Soles handeln und ein Quechua-Gruß (¡Allillanchu!).",
        "🚪 Zwei neue Real-Life-Mutproben (Peru-Spezial): Ceviche bestellen und nach Kokatee gegen die Höhe fragen.",
      ],
    },
    {
      version: "1.36.0",
      date: "2026-06-15",
      title: "Kolumbien-Paket: Kaffeeregion ergänzt (Salento & Valle del Cocora)",
      items: [
        "☕ 14 neue Kolumbien-Karten für die Kaffeezone: nach Salento kommen, der Willys-Jeep ins Valle del Cocora, Wachspalmen, Kaffeetour & -verkostung auf der Finca, Forelle (trucha), Aussichtspunkte, Kolibris und ein Tejo-Abend.",
        "🗺️ Damit hat jede typische Kolumbien-Reisestation (Bogotá, Kaffeeregion, Medellín, Karibikküste, Cartagena) ihr eigenes Reise-Vokabular – mit Kontext für jede Karte.",
        "🚪 Neue Real-Life-Mutprobe: auf einer Finca nach einer Kaffeetour fragen.",
      ],
    },
    {
      version: "1.35.0",
      date: "2026-06-15",
      title: "Bessere Lesbarkeit im Dunkelmodus",
      items: [
        "🌙 Knöpfe und Badges mit farbiger Fläche (z. B. „Lernrunde starten“, Pre-Trip-Etappen, Hostel-Punktestand) bekommen im Dunkelmodus dunklen statt hellen Text – jetzt durchgängig WCAG-AA-konform lesbar.",
      ],
    },
    {
      version: "1.34.0",
      date: "2026-06-15",
      title: "Pre-Trip-Plan: in 7 Etappen reisefertig",
      items: [
        "🗓️ Neuer Pre-Trip-Plan unter Entdecken: ein geordneter, mehrtägiger Onboarding-Pfad für Kolumbien (Begrüßung, Taxi, Unterkunft, Essen, Geld, Unterwegs, Ausgehen) – die nächste Etappe öffnet sich, sobald du die aktuelle geschafft hast.",
        "🚪 Jede Etappe mit kuratierten Karten und einer passenden Real-Life-Mutprobe.",
        "🧳 Neuer Ruta-Pass-Stempel „Reisefertig“, wenn alle 7 Etappen geschafft sind.",
      ],
    },
    {
      version: "1.33.0",
      date: "2026-06-15",
      title: "Coordinator-Schnellstart: 5-Minuten-Icebreaker",
      items: [
        "⚡ Neue Karte im Modo Hostal: „5-Minuten-Icebreaker“ startet auf einen Tap eine kurze 6-Runden-Kennenlern-Battle – ganz ohne Setup.",
        "🧑‍🏫 Gedacht für Reiseleiter, Hostel-Personal und Lehrkräfte, die einer Gruppe in Sekunden eine Sprach-Aktivität geben wollen.",
      ],
    },
    {
      version: "1.32.0",
      date: "2026-06-15",
      title: "Mehr Real-Life Challenges: 30 statt 10",
      items: [
        "🚪 20 neue Real-Life Challenges (jetzt 30) – Essen bestellen, Preis fragen, nach dem Weg fragen, Gruppen-Icebreaker, Apotheke, plus Kolumbien-Spezial (Tinto bestellen, ¿quiubo? begrüßen, Tanzschritt lernen).",
        "🗣️ Neuer Ruta-Pass-Stempel „Straßen-Spanisch“ für 10 abgehakte Challenges.",
        "🎯 Ideal als Unterrichts-/Gruppenaufgabe: kleine Mutproben, die vom Klassenzimmer in echte Situationen führen.",
      ],
    },
    {
      version: "1.31.0",
      date: "2026-06-15",
      title: "Pre-Arrival-Preset: die wichtigsten Sätze auf einen Tap",
      items: [
        "🇨🇴 Neue Dashboard-Kachel „Pre-Arrival Kolumbien“ – ein Tap startet die 20 wichtigsten Sätze für die Ankunft (Begrüßung, Taxi, Unterkunft, Essen, Geld, Sicherheit).",
        "🎯 Kuratierte, benannte Karten-Auswahl statt freiem Filter – ideal zur Reisevorbereitung oder als Einstieg für Sprachschüler und Reisegruppen.",
      ],
    },
    {
      version: "1.30.0",
      date: "2026-06-15",
      title: "Kolumbien-Paket: 75 ortsspezifische Reise-Karten",
      items: [
        "🇨🇴 Neuer Bereich „Kolumbien“ mit 75 Karten für echte Situationen in Cartagena, Medellín, Bogotá und an der Karibikküste – mit Reise-Kontext für jede Karte.",
        "🗺️ Von Flughafen-Taxi, Unterkunft und Islas-del-Rosario-Boot über Bandeja Paisa, Tinto und Aguardiente bis zu kolumbianischem Slang (parce, bacano, a la orden, ¡de una!) und Salsa-/Champeta-Abenden.",
        "🎒 Erstes Destination-Pack – Grundlage für Sprachschul-, Gruppenreise- und Hostel-Angebote.",
      ],
    },
    {
      version: "1.29.0",
      date: "2026-06-15",
      title: "Historia-Modul als Ganzes teilen",
      items: [
        "📤 Neues Sharepic auf Modul-Ebene: „Historia de Sudamérica“ lässt sich jetzt komplett weiterempfehlen – ein Bild mit Modulname, Einleitung und einem Zeitstrahl-Teaser der Epochen, in 1:1 oder 9:16 (Story). Der „Modul teilen“-Knopf sitzt oben direkt unter der Bereichs-Navigation.",
      ],
    },
    {
      version: "1.28.0",
      date: "2026-06-15",
      title: "Historia de Sudamérica: die große Geschichte",
      items: [
        "📜 Neue Erklärseite unter Entdecken (und als Banner in „Países y culturas“): die ganze Geschichte Südamerikas auf einen Blick – von den Inka über die spanische Eroberung und die Kolonialzeit bis zu Bolívar, San Martín und der Unabhängigkeit.",
        "🕰️ Interaktiver Zeitstrahl: sieben aufklappbare Epochen – Hochkulturen, Conquista, Vizekönigreiche & Silber, der Funke (Napoleon & die Junten), der Freiheitskampf, die Abspaltung in viele Nationen und der Weg bis heute. Jede Epoche mit Bild von Wikimedia, Kernpunkten und Erklärung.",
        "👤 Galerie der Protagonisten: Bolívar, San Martín, Sucre, O’Higgins, Manuela Sáenz und Atahualpa – mit Porträt, Lebensdaten und Zitat.",
        "📰 „Heute: Lage & Spannungen“: aktuelle Konflikte verständlich erklärt – Venezuela-Krise & Massenflucht, Grenzstreit um Essequibo, Boliviens Meereszugang, Kolumbiens Friedensprozess, Perus politische Dauerkrise, Argentiniens Kurswechsel, Amazonas & indigene Rechte und der Darién.",
        "📖 Lesetraining auf Spanisch: jede Epoche gibt es zusätzlich als spanischen Lesetext. Schwierige Wörter sind markiert – antippen zeigt die Übersetzung. Pro Text eine Wörterliste zum schnellen Nachschlagen, sauber getrennt in „lohnt sich mitzunehmen“ und „nicht so wichtig“.",
        "📊 Schwierigkeits-Score (CEFR A1–C1) pro Text zur Selbst-Einstufung, plus „Ganze Übersetzung anzeigen“ und ein teilbares Sharepic von Text & Wörterliste.",
        "🧩 Mini-Quiz pro Epoche: spanisches Wort lesen, die richtige Übersetzung antippen – mit sofortiger Rückmeldung (richtig/falsch).",
        "📖 Lesetraining jetzt überall: auch jede Protagonisten- und jede „Heute“-Karte hat einen aufklappbaren spanischen Lesetext mit antippbaren Vokabeln, Wörterliste und Sharepic.",
        "💡 „¿Sabías que…?“-Häppchen und durchgängig zweisprachig (Deutsch/Englisch).",
      ],
    },
    {
      version: "1.27.0",
      date: "2026-06-14",
      title: "Suche & sauberes Scrollen",
      items: [
        "🔍 Neue Suche: Tippe oben auf „Suchen …“ (im Lernen- und Entdecken-Reiter) und finde gezielt, was du brauchst – Vokabelkarten, ganze Themen und Übungen unter „Übungen“, Länderkunde, Reise-Knigge, Logística und Salud unter „Informationen“. Sucht auf Deutsch wie Spanisch und ist nachsichtig mit Akzenten („nino“ findet „niño“, „mexico“ findet „México“).",
        "🧭 Treffer führen direkt ans Ziel: Eine Karte öffnet ihre Detailseite (mit ‹ zurück zur Suche), ein Thema startet die Lernrunde, ein Land öffnet die Länderkunde gleich beim richtigen Eintrag.",
        "⬆️ Sauberes Scrollen beim Wechsel: Öffnest du aus einer weiter unten gescrollten Liste eine Kategorie oder Übung, beginnt die neue Seite jetzt zuverlässig oben – statt die alte Scroll-Position zu erben.",
        "🎒 Salud y energía erweitert: neuer Tipp-Block „Ausflüge & lange Fahrten“ – immer etwas Zucker am Körper (Kreislauf!), eigener Proviant trotz „Verpflegung inklusive“, Mini-Reiseapotheke (Schmerz- & Reisetablette, Pflaster – für Frauen besonders wichtig) und etwas Langärmliges gegen eiskalte Bus-Klimaanlagen. Dazu passende Apotheken-Sätze und Begriffe.",
      ],
    },
    {
      version: "1.26.0",
      date: "2026-06-14",
      title: "Salud y energía: gesund & fit unterwegs",
      items: [
        "🥗 Neues Entdecken-Modul fürs Gesundbleiben auf der Straße: ausgewogen essen statt nur Streetfood (Protein, Ballaststoffe, Vitamine gezielt holen), Frühstück selbst machen – Porridge mit Proteinpulver & Früchten, ganz ohne Küche.",
        "💧 Günstig & mit Geschmack trinken: Zero-Sirup und Elektrolytpulver (suero) peppen billiges Wasser auf, sparen Geld und gleichen das Schwitzen aus. Dazu Tipps zu Bauch & Verdauung, Sonne/Höhe/Mücken und Bewegung – plus ein „Gesund-unterwegs-Kit“.",
        "💬 Mit den passenden Sätzen als Karten: gesund einkaufen, gesünder bestellen („a la plancha, no frito“), nach Yoga & Gym-Tagespass fragen und in der Apotheke nach suero, Sonnencreme & Co. fragen.",
        "🏋️ In Bewegung bleiben ohne Studio-Abo: manche Hostels bieten Yoga, in größeren Städten gibt es im Gym oft einen günstigen Tagespass – ein gutes Erlebnis, weil dort die Locals trainieren.",
        "📅 Logística de viaje ergänzt: Tipp zum Vorausplanen – beliebte Hostels und knappe Plätze in der Hochsaison früher buchen.",
      ],
    },
    {
      version: "1.25.0",
      date: "2026-06-14",
      title: "Logística de viaje: clever & sicher ankommen",
      items: [
        "🧳 Neues Modul unter Entdecken: die praktischen Handgriffe, die kein Sprachkurs lehrt – SIM-Karte (chip) kaufen & online sein, Geld wechseln und am cajero abheben (ohne teure Umrechnung), Geld & Wertsachen auf mehrere Gepäckstücke aufteilen, das Gepäck per Tracker (AirTag & Co.) im Blick behalten.",
        "✈️ Handgepäck-Notfallset als Packliste: das Wichtigste – Medikamente, Wechselwäsche, Hygiene, Powerbank, Dokumente – kommt ins Handgepäck, falls der große Rucksack später (oder gar nicht) ankommt.",
        "💬 Dazu die passenden Sätze als Karten: nach SIM, Geld und verlorenem Gepäck fragen – jeweils auf Spanisch mit Übersetzung.",
      ],
    },
    {
      version: "1.24.0",
      date: "2026-06-13",
      title: "Trip-Ziel: gleich zu Beginn gesetzt, im Profil verwaltet",
      items: [
        "🧭 Beim allerersten Start fragt dich HolaRuta jetzt nach deinem Trip-Ziel – Reisedatum und Tagespensum sind in einem Schritt gesetzt (oder per „Später“ übersprungen).",
        "🎯 Das Dashboard bleibt ruhig: Die Trip-Karte mit Countdown erscheint nur noch, wenn ein Ziel gesetzt ist. Ein Tap darauf führt direkt zur Verwaltung.",
        "👤 Anlegen, Ändern und Löschen des Trip-Ziels wohnt jetzt gebündelt im Profil-Reiter.",
      ],
    },
    {
      version: "1.23.0",
      date: "2026-06-13",
      title: "Aufgeräumte Einstellungen & automatische Updates",
      items: [
        "⚙️ Die Einstellungen sind aufgeräumt: Die Stufen-Auswahl (Alle, A1, A2, B1) liegt jetzt direkt auf dem Dashboard – die änderst du ja laufend beim Lernen. Sprache, Modus, Richtung und Sprechtempo wohnen gebündelt im Profil-Reiter.",
        "✨ Neue Versionen kommen jetzt von allein an: Sobald eine bereitsteht, erscheint unten ein „Neue Version – jetzt laden“-Banner. Ein Tap lädt die App frisch – du musst sie dafür nicht mehr ganz schließen.",
      ],
    },
    {
      version: "1.22.0",
      date: "2026-06-13",
      title: "Zurück-Wischen führt zurück, statt die App zu schließen",
      items: [
        "↩️ Die Zurück-Geste (Wischen vom Bildschirmrand bzw. die Zurück-Taste) bringt dich jetzt Schritt für Schritt eine Ebene höher – aus einer Übung zurück zur Auswahl und von dort aufs Dashboard – statt die App sofort zu schließen.",
        "🏠 Erst wenn du wieder auf dem Dashboard bist, verlässt die nächste Zurück-Geste die App. Offene Einblendungen (z. B. der Spickzettel-Großbildschirm oder der Update-Hinweis) schließt Zurück zuerst.",
      ],
    },
    {
      version: "1.21.0",
      date: "2026-06-13",
      title: "Wochentage: je ein Tag, eine Karte",
      items: [
        "📅 Die Wochentage stecken nicht mehr gebündelt in drei Karten (Montag/Dienstag, Mittwoch/Donnerstag, Freitag/Samstag/Sonntag), sondern haben jede einen eigenen Eintrag – von lunes bis domingo. So lernst (und prüfst) du jeden Tag wirklich einzeln, statt mit einem Wort eine ganze Gruppe „richtig“ abzuhaken.",
        "🧭 Jeder Wochentag bekommt einen eigenen Reise-Kontext mit Beispielsatz und Tipp.",
      ],
    },
    {
      version: "1.20.0",
      date: "2026-06-12",
      title: "Diálogos: längere Gespräche & runderer Ablauf",
      items: [
        "💬 Alle Diálogos sind jetzt deutlich länger – aus drei kurzen Wortwechseln werden vollständige Gespräche mit sieben bis neun Repliken: einchecken samt Zimmerwahl und Frühstücksfrage, im Taxi plaudern, auf dem Markt richtig feilschen, an der Grenze Schritt für Schritt durch die Kontrolle.",
        "🧭 Neu: Schrittanzeige über dem Verlauf („Schritt 4 von 17“) – so siehst du jederzeit, wie weit das Gespräch noch geht.",
        "👇 Der gerade aktive Zug rückt automatisch ins Bild, und beim Frei-Tippen springt der Cursor direkt ins Feld – kein Scrollen und kein Extra-Tipp mehr nötig.",
        "💡 Neu: „Tipp anzeigen“ beim Selbst-Tippen blendet die Musterantwort als Hilfe ein, wenn du mal nicht weiterweißt.",
      ],
    },
    {
      version: "1.19.0",
      date: "2026-06-12",
      title: "Diálogos, Conjugador, Sprechtempo & Trip-Ziel",
      items: [
        "💬 Neu: Diálogos – spiel echte Reisegespräche Zug für Zug durch (Hotel-Check-in, Restaurant, Busticket, Taxi, Markt, Apotheke, Hostel, Grenze, Notfall, Wegfrage). Die Gegenseite spricht, du antwortest per Auswahl oder tippst die Schlüsselsätze selbst.",
        "🔁 Neu: Conjugador – Verben aktiv konjugieren statt nur lesen: „ir – wir“ → tippe „vamos“. Zwei Stufen (nur regelmäßige Muster oder mit unregelmäßigen Reiseverben), mit Punktestand. Auf der Conjugación-Seite startbar.",
        "🐢 Neu: Sprechtempo wählbar (Langsam · Normal · Schnell) in den Einstellungen – langsamer zum Nachsprechen, schneller fürs echte Busbahnhof-Tempo. Gilt für Hören, Precios und Diálogos.",
        "🎯 Neu: Trip-Ziel – setz dein Reisedatum und ein Tagesziel; die Startseite zeigt Countdown und „X/Y heute“. Stärkt die Lern-Serie bis zur Abreise.",
      ],
    },
    {
      version: "1.18.0",
      date: "2026-06-12",
      title: "Sharepics: App-Link zum Mitlernen",
      items: [
        "🔗 Jedes geteilte Bild zeigt jetzt unten die App-Adresse (moarci.github.io/holaRuta) in Link-Optik – so sieht jede:r sofort, wo es die App gibt.",
        "👉 Beim Teilen per Handy steht der echte, anklickbare Link „Jetzt mitlernen“ im Begleittext – in WhatsApp, Telegram & Co. direkt antippbar. (Ein PNG selbst kann keinen klickbaren Link enthalten.)",
      ],
    },
    {
      version: "1.17.0",
      date: "2026-06-12",
      title: "Ruta-Pass: Stempel als Sharepic teilen",
      items: [
        "🎖️ Jeden freigeschalteten Stempel kannst du jetzt direkt aus dem Ruta-Pass als Bild teilen – über den neuen „📤 Teilen“-Knopf auf der Stempel-Kachel.",
        "Das Sharepic zeigt deinen Stempel wie einen echten Reisestempel im Pass: großes Medaillon mit Emoji, Name, Freischalt-Text und deinem Sammelstand – in 1:1 oder 9:16 (Story).",
      ],
    },
    {
      version: "1.16.0",
      date: "2026-06-12",
      title: "Spickzettel: bessere Auswahl, Großanzeige & Sprungleiste",
      items: [
        "🆘 Die Sätze sind jetzt kuratiert statt „die ersten der Kategorie“: Bei Notfall stehen „Hilfe!“, „Necesito un médico“ und „Llame a la policía“ ganz oben, bei Wegbeschreibung echte Survival-Fragen wie „¿Cómo llego al centro?“ statt nur Vokabeln.",
        "👁️ Satz antippen zeigt ihn bildschirmfüllend in Riesenschrift – zum Herzeigen, wenn Reden nicht reicht. Tippen daneben (oder Escape) schließt wieder.",
        "🧭 Neue Sprungleiste oben: ein Tipp auf Notfall, Grundlagen, Wegbeschreibung oder Geld springt direkt zum Bereich.",
        "Jeder Satz erscheint höchstens einmal auf dem Zettel – auch wenn er in mehreren Bereichen passt.",
      ],
    },
    {
      version: "1.15.0",
      date: "2026-06-12",
      title: "Einkaufszettel: echtes Abhaken + Fragen fürs Geschäft",
      items: [
        "✅ Der Einkaufszettel funktioniert jetzt wie eine echte Liste: Über das Kästchen links hakst du ab, was erledigt ist – und nimmst das Häkchen jederzeit wieder zurück. Vorher ließ sich ein Wort nur antippen, aber nicht mehr abwählen.",
        "Antippen und Abhaken sind getrennt: Ein Wort aufklappen (Aussprache, Reisetipp, Vorlesen) hakt es nicht mehr automatisch ab – so kannst du nachschlagen, ohne die Liste durcheinanderzubringen.",
        "🗣️ Neu zu jedem Wort zwei gebrauchsfertige Fragen fürs Geschäft – ob sie es haben («¿Tienen …?») und wo man es findet («¿Dónde puedo encontrar …?») – mit Übersetzung und 🔊 zum Vorlesen.",
      ],
    },
    {
      version: "1.14.0",
      date: "2026-06-12",
      title: "Regatear: gut verhandeln & feilschen",
      items: [
        "🤝 Neuer Bereich unter Entdecken: „Regatear“ – wie man auf Märkten und an Straßenständen freundlich und richtig verhandelt.",
        "📖 Erklärung der Taktik in vier aufklappbaren Blöcken: Grundhaltung, die Verhandlung führen, der Abschluss (Weggehen als Taktik) und Taxi, Tuk-Tuk & Touren (Preis vorher aushandeln).",
        "🗣️ Glossar der Feilsch-Wörter (regatear, el descuento, la rebaja, precio fijo, la yapa/ñapa, el/la casero/a …).",
        "💬 Die wichtigsten Sätze nach Phasen sortiert: Preis erfragen (¿A cuánto la unidad?), feilschen (¿Cuánto es lo menos?), abschließen (Trato hecho), bezahlen & Wechselgeld (¿Tiene cambio de cien?) und etwas finden (¿Dónde consigo…?).",
        "⚖️ Mengen & Einheiten vom Marktstand: unidad/pieza, docena, par, libra, kilo, litro, montón, manojo … – jeweils mit Beispielsatz.",
        "🌎 Regionale Unterschiede von Land zu Land: México, Guatemala, Perú & Bolivia (la yapa), Colombia, Argentina, Costa Rica und Cuba.",
        "🎭 Vier Rollenspiele zum Üben: Obst & Gemüse, Souvenir feilschen (chancletas), erst suchen dann handeln und Taxipreis aushandeln – Dialoge zum lauten Durchspielen zu zweit.",
      ],
    },
    {
      version: "1.13.0",
      date: "2026-06-12",
      title: "Karten überspringen: nicht jede Karte muss durch",
      items: [
        "⏭️ Neuer „Überspringen“-Button beim Lernen: Wer eine Karte gerade nicht machen will, nimmt sie ohne Bewertung aus der Sitzung – so muss niemand jede Karte durchziehen.",
        "Überspringen zählt nicht als „gewusst“: Der Lernstand (SRS) bleibt unangetastet, die Karte ist beim nächsten Mal wieder fällig.",
        "Funktioniert in allen drei Modi (🃏 Karteikarte, ✍️ Schreiben, 👂 Hören) – am Schreibtisch geht es auch per Taste „s“.",
      ],
    },
    {
      version: "1.12.0",
      date: "2026-06-12",
      title: "Gegenteile: Antonym-Paare lernen",
      items: [
        "↔️ Neuer Lernbereich „Gegenteile“ mit 26 Antonym-Paaren: groß – klein, teuer – billig, offen – geschlossen, früh – spät, hell – dunkel … – reisetauglich und LatAm-korrekt.",
        "Funktioniert in allen drei Modi (🃏 Karteikarte, ✍️ Schreiben, 👂 Hören) und in beiden Richtungen (DE→ES und ES→DE) – beim Schreiben zählt jede Seite des Paares.",
        "Jede Karte mit Aussprache-Tipp und 🧭 Reise-Kontext: ein echter Satz, der beide Gegenteile gegenüberstellt (z. B. „El bus sale temprano y llega tarde.“).",
      ],
    },
    {
      version: "1.11.0",
      date: "2026-06-12",
      title: "Precios al oído: deutlich mehr & größere Preise",
      items: [
        "💵 Der Preis-Hörtrainer erzeugt Beträge jetzt frisch in jeder Runde, statt aus einer Handvoll fester Karten zu ziehen – beliebig viele, abwechslungsreiche und auch richtig krumme Preise.",
        "🇨🇴 Große Zahlen wie im echten Reisealltag: Vorab wählst du ein Land/Währung – Kolumbien (Pesos in Millionenhöhe), Chile, Argentinien, Costa Rica, Mexiko, Peru und Guatemala – jeweils grammatisch sauber gesprochen (un millón quinientos mil, veintiún mil, „de pesos“ nur bei vollen Millionen …).",
        "🎚️ Drei Schwierigkeitsstufen je Land: von Kleingeld (Kaffee, Snacks) über den Alltag (Essen, Hostel, kurze Fahrten) bis zu großen Beträgen (Fernbus, Tour, Miete).",
        "Tippen bleibt entspannt: Punkte, Leerzeichen und Währungszeichen werden ignoriert – nur die Ziffern zählen.",
        "🤑 Neuer Ruta-Pass-Stempel „Millonario de oído“ für eine fehlerfreie Runde auf der Stufe „Große Beträge“.",
      ],
    },
    {
      version: "1.10.1",
      date: "2026-06-12",
      title: "Reise-Knigge: Toilettenpapier-Regel",
      items: [
        "🚽 Neu im Reise-Knigge (Kultur & Etikette): Toilettenpapier gehört in vielen Ländern in den Mülleimer (papelera) neben der Toilette, nicht ins WC – die Rohre sind oft zu eng (Schild: „No arrojar papeles ni toallas sanitarias“).",
        "Ecuador-Akzent ergänzt: Hinweis auf die papelera statt WC.",
      ],
    },
    {
      version: "1.10.0",
      date: "2026-06-12",
      title: "Reise-Knigge: Verhalten unterwegs",
      items: [
        "🧭 Neuer Bereich unter Entdecken: „Reise-Knigge“ mit DOs & Don'ts zum Verhalten auf Reisen – Hostel & Dorm, Bus & Transport, Gruppen & Leute sowie Kultur & Etikette.",
        "Praktische Faustregeln: Nachtruhe im Schlafsaal, Licht/Lärm, Wertsachen im Bus, wie man unterwegs auf Leute zugeht, Trinkgeld und Begrüßung.",
        "Pro Land Besonderheiten („Akzente“) für alle 19 Länder – z. B. „chicken buses“ in Guatemala, Voseo & Mate-Etikette in Argentinien, „pura vida“ in Costa Rica oder casas particulares in Kuba.",
        "Das gewählte Land ist mit der Länderkunde verknüpft: einmal auswählen, überall passend.",
      ],
    },
    {
      version: "1.9.0",
      date: "2026-06-12",
      title: "Einkaufszettel: interaktiv für Supermarkt, Kleidung & Farmacia",
      items: [
        "🛒 Neu unter Entdecken: „Einkaufszettel“ – dein Reisebedarf auf Spanisch in drei Rubriken (Supermercado, Ropa, Farmacia).",
        "Tippe an, was du brauchst: Wort, Aussprache und Reisetipp erscheinen, das Wort wird vorgelesen und auf dem Zettel abgehakt (bleibt gemerkt).",
        "Danach prüfst du dich im kurzen Quiz: „Du brauchst …“ → das passende spanische Wort wählen, mit Auswertung.",
        "LatAm-korrekt: curitas, medias, lentes de sol, repelente & Co. – plus Klassiker wie Klopapier, Sonnencreme und „algo para la diarrea“.",
      ],
    },
    {
      version: "1.8.0",
      date: "2026-06-12",
      title: "Zeiten: neuer Bereich + große Erklärseite",
      items: [
        "Neuer Lernbereich „⏳ Zeiten“ mit 66 Karten: echte Reisesätze in Vergangenheit, Gegenwart und Zukunft (Llegué ayer, Ya he comido, Voy a tomar el bus, Llegaré mañana …), dazu die Verlaufsform (Estoy comiendo), Imperativ-Bitten (Dígame, Tráigame la cuenta), „es gibt“ (¿Hay wifi?) und höfliche Bitten (Querría, ¿Podría?).",
        "Neu unter Entdecken: „Tiempos“ erklärt ausführlich und durchweg reisebezogen, wie die spanischen Zeitformen funktionieren – ein Verb (tomar) wandert durch alle Zeiten; jede Zeitform mit Bildungs-Rezept, Signalwörtern und mehreren Reise-Beispielen. Dazu die Verlaufsform (estar + Gerundio), der Vergleich Indefinido vs. Imperfecto, die häufigsten unregelmäßigen Vergangenheiten und Partizipien, der Imperativ, „hay/había/habrá“, eine Situations-Zuordnung, häufige Stolperfallen und drei Reisedialoge. Von dort geht es mit „Jetzt üben“ direkt in die Karten.",
        "LatAm-tauglich: Fokus auf indefinido fürs Erzählen und „ir a + Infinitiv“ als einfacher Zukunfts-Trick.",
        "Neuer Ruta-Pass-Stempel „Maestro del Tiempo“ für 80 % gemeisterte Zeiten-Karten.",
      ],
    },
    {
      version: "1.7.0",
      date: "2026-06-12",
      title: "Frases flexibles: Themen & viel mehr Sätze",
      items: [
        "🧱 Frases flexibles deutlich ausgebaut: 49 Satzrahmen (statt 8) in 7 Reise-Themen – En la ruta, En el hostal, Comida y bebida, Compras y dinero, Salud y emergencias, Conocer gente und Orientarse.",
        "Neue Themen-Auswahl vor der Runde (wie bei Definiciones): wähle eine Situation – oder „🎲 Gemischt“ für alle Sätze quer durch.",
        "Neuer Ruta-Pass-Stempel „🏛️ Constructor experto“: schließe jedes Thema mindestens einmal ab.",
      ],
    },
    {
      version: "1.6.0",
      date: "2026-06-12",
      title: "Konjugieren: neuer Bereich + Erklärseite",
      items: [
        "Neuer Lernbereich „🔁 Konjugieren“ mit 42 Karten: die Präsens-Formen der wichtigsten Reiseverben (ir, estar, ser, tener, poder, querer, seguir, doblar …) – genau das, was man z. B. für Wegbeschreibungen braucht.",
        "Neu unter Entdecken: „Conjugación“ erklärt kurz und reisetauglich, wie spanische Verben gebeugt werden – Personen, die drei regelmäßigen Muster (-ar/-er/-ir), die wichtigsten unregelmäßigen Verben und ein Wegbeschreibungs-Dialog. Von dort geht es mit „Jetzt üben“ direkt in die neuen Karten.",
        "LatAm-korrekt: Tabellen mit ustedes statt vosotros.",
        "Neuer Ruta-Pass-Stempel „Verbo-Virtuose“ für 80 % gemeisterte Konjugieren-Karten.",
      ],
    },
    {
      version: "1.5.0",
      date: "2026-06-12",
      title: "Hören, Spickzettel, Precios, Satzbaukasten & Ruta del día",
      items: [
        "👂 Neuer Lernmodus „Hören“: Die App spricht die spanische Antwort vor, du tippst, was du hörst – trainiert das Verstehen von echtem LatAm-Spanisch (nur wenn dein Gerät Sprachausgabe kann).",
        "🆘 Spickzettel: Die wichtigsten Sätze (Notfall, Grundlagen, Wegbeschreibung, Geld) sofort groß und vorgelesen – schnell nachschlagen, ohne zu lernen.",
        "💵 Precios al oído: Hör einen Preis auf Spanisch und tippe die Zahl – Übung fürs Verstehen gesprochener Beträge am Busbahnhof.",
        "🧱 Frases flexibles: Satzbaukasten – fülle die Lücke im Satzrahmen mit dem passenden Baustein.",
        "🗺️ Ruta del día: ein Tap für eine kurze Tagesrunde quer durch alle Themen – plus eine Streckenkarte deines Fortschritts in der Statistik.",
      ],
    },
    {
      version: "1.4.3",
      date: "2026-06-12",
      title: "Battle: fairer, mehr Inhalt, Stichrunde",
      items: [
        "15 neue Battle-Aufgaben (jetzt 45) und jede Aufgabe hat eine Schwierigkeits-Stufe (A1/A2/B1), die während der Runde angezeigt wird.",
        "Faire Verteilung: A und B bekommen pro Runden-Paar etwa gleich schwere Aufgaben, und die Schwierigkeit steigert sich über das Battle.",
        "Keine sofortigen Wiederholungen mehr: zuletzt gespielte Aufgaben werden über mehrere Battles gemieden.",
        "Optionale Spielernamen – sie erscheinen im Punktestand, am Zug und in der Auswertung.",
        "Stichrunde bei Gleichstand: zwei Extra-Runden küren doch noch einen Sieger.",
        "Die Szenen-Auswahl zeigt jetzt die echte Rundenzahl der gewählten Länge statt nur der Aufgabenzahl.",
      ],
    },
    {
      version: "1.4.2",
      date: "2026-06-12",
      title: "Battle klarer erklärt",
      items: [
        "Hostel Battle: Vor dem Start steht jetzt ein kurzer „So läuft ein Battle“-Ablauf in vier Schritten (zu zweit, antworten, bewerten, abwechseln) – aufklappbar und beim ersten Mal offen. Damit ist sofort klar, dass man zu zweit spielt, das Handy reihum weitergibt und der Mitspieler mit ✅/😬/❌ bewertet.",
      ],
    },
    {
      version: "1.4.1",
      date: "2026-06-12",
      title: "Modus klarer benannt",
      items: [
        "„Sprechen“ heißt jetzt „🃏 Karteikarte“ – ehrlicher, denn hier gibt es keine Prüfung: du denkst oder sagst die Antwort, drehst um und bewertest dich selbst (wie eine echte Karteikarte). Geprüft wird nur im Modus „Schreiben“.",
      ],
    },
    {
      version: "1.4.0",
      date: "2026-06-12",
      title: "Update-Hinweis",
      items: [
        "Neu: Nach einem Update zeigt HolaRuta beim nächsten Öffnen kurz, was sich geändert hat – und wie du immer die neueste Version bekommst.",
      ],
    },
    {
      version: "1.3.0",
      date: "2026-06-11",
      title: "Hostel Mode, Quiz & Farben",
      items: [
        "Hostel Mode: Battle & Rollenspiele zum Üben zu zweit.",
        "Definiciones: neues Zuordnen-Quiz.",
        "Farben mit echtem Farbfeld und 576 Karten in 20 Bereichen.",
      ],
    },
  ];

  const VERSION = entries.length ? entries[0].version : "0";

  // Alle Einträge, die NEUER sind als die zuletzt gesehene Version (NEUESTE
  // zuerst). Unbekannte/ältere Vorversion (nicht im Verlauf) -> nur das
  // Neueste zeigen, damit der Hinweis nie leer und nie überfrachtet ist.
  function since(seen) {
    if (!seen) return [];
    const idx = entries.findIndex((e) => e.version === seen);
    if (idx === -1) return entries.length ? [entries[0]] : [];
    return entries.slice(0, idx);
  }

  window.SC = window.SC || {};
  window.SC.changelog = { VERSION, entries, since };
})();
