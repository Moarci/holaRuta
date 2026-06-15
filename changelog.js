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
      version: "1.33.0",
      date: "2026-06-15",
      title: "Länderkunde: Bevölkerung, Politik & Wirtschaft",
      items: [
        "👥 Jedes Land unter „Países y culturas“ hat jetzt einen neuen Abschnitt „Land & Wirtschaft“: Einwohnerzahl, Altersstruktur, politische Regierungsform, wirtschaftliche Lage und wovon das Land hauptsächlich lebt – kompakt auf einen Blick.",
        "🔎 Die neuen Angaben fließen auch in die Suche ein und sind wie alle Länderinhalte auf Deutsch und Englisch verfügbar.",
      ],
    },
    {
      version: "1.32.0",
      date: "2026-06-15",
      title: "Geteilte Modul-Links öffnen direkt das Modul",
      items: [
        "🔗 Tippt jemand auf den Link unter einem „Modul teilen“-Sharepic, landet er jetzt direkt im empfohlenen Modul (z.B. Precios al oído) statt nur auf der Startseite – der Link trägt dafür eine Modul-Kennung (?m=…).",
      ],
    },
    {
      version: "1.31.1",
      date: "2026-06-15",
      title: "„Modul teilen“ besser sichtbar",
      items: [
        "📤 Der „Modul teilen“-Knopf erscheint jetzt in allen Entdecken-Modulen im selben auffälligen Orange wie bei „Historia de Sudamérica“ – vorher war er außerhalb von Historia unscheinbar grau und leicht zu übersehen.",
      ],
    },
    {
      version: "1.31.0",
      date: "2026-06-15",
      title: "„Modul teilen“ jetzt in allen Entdecken-Modulen",
      items: [
        "📤 Der „Modul teilen“-Knopf sitzt jetzt oben in jedem Entdecken-Modul – nicht mehr nur bei „Historia de Sudamérica“. Damit lässt sich jedes Modul (Supervivencia, Modo hostal, Definiciones, Frases flexibles, Diálogos, Regatear, Precios al oído, El Cuerpo, Lista de compras, Conjugación, Tiempos, Países y culturas, Etiqueta de viaje, Logística de viaje und Salud y energía) als Einladung weiterempfehlen.",
        "🎨 Jedes Sharepic ist auf sein Modul zugeschnitten: Icon, Titel und ein paar echte Highlights – je nach Modul Beispiel-Vokabeln, Themen- oder Szenenlisten – in 1:1 oder 9:16 (Story).",
      ],
    },
    {
      version: "1.30.0",
      date: "2026-06-15",
      title: "Historia de Centroamérica: die zweite große Geschichte",
      items: [
        "🌋 Neue Erklärseite unter Entdecken: die ganze Geschichte Mittelamerikas auf einen Blick – von den Maya über die spanische Eroberung und das Königreich Guatemala bis zu Morazáns Traum von Einheit, den Bürgerkriegen des Kalten Krieges und den sieben Republiken von heute.",
        "🕰️ Interaktiver Zeitstrahl: acht aufklappbare Epochen – die Welt der Maya, Conquista, Kolonialzeit, Unabhängigkeit 1821, die Föderation, Kaffee & Bananen, Bürgerkriege und der Weg bis heute. Jede Epoche mit Kernpunkten, Erklärung und (wo verfügbar) Bild.",
        "👤 Galerie der Protagonisten: Francisco Morazán, Augusto César Sandino, Óscar Romero, Rigoberta Menchú und José Figueres – mit Lebensdaten und Zitat.",
        "📰 „Heute: Lage & Spannungen“: aktuelle Themen verständlich erklärt – El Salvador unter Bukele, Nicaragua unter Ortega, der Panamakanal, Maras & Migration, Guatemalas Neuanfang und Costa Rica als stabile Ausnahme.",
        "📖 Komplett mit Lesetraining: jede Epoche, jeder Protagonist und jede „Heute“-Karte gibt es zusätzlich als spanischen Lesetext mit antippbaren Vokabeln, Wörterliste, Quiz, Schwierigkeits-Score und teilbarem Sharepic – genau wie bei „Historia de Sudamérica“.",
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
