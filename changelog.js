/*
 * changelog.js  (SC.changelog) – Versionsstand & Änderungsverlauf.
 *
 * Eine einzige Quelle der Wahrheit für „welche Version ist das" und „was hat
 * sich geändert". Der Controller (app.js) merkt sich die zuletzt gesehene
 * Version im Speicher; weicht sie beim Start von VERSION ab, blendet die App
 * einen Hinweis ein, WAS neu ist und WIE man aktuell bleibt.
 *
 * Pflege: bei jeder veröffentlichten Änderung oben einen neuen Eintrag
 * ergänzen (NEUESTE zuerst). Jeder Eintrag trägt sein englisches Pendant direkt
 * mit: titleEn und itemsEn (gleiche Reihenfolge/Länge wie items). app.js
 * lokalisiert die Einträge beim Anzeigen per i18n.localizeDeep, sodass der
 * „Was ist neu?"-Hinweis der UI-Sprache folgt. Den Service-Worker-Cache muss
 * man NICHT mehr von Hand hochzählen – `node build.js` stempelt CACHE_VERSION
 * automatisch aus dem Inhalts-Hash der Assets (siehe swversion.js).
 *
 * Öffentlich (window.SC.changelog):
 *   VERSION         – aktuelle App-Version (= neuester entries-Eintrag)
 *   entries         – Verlauf, NEUESTE zuerst:
 *                     { version, date, title, titleEn, items[], itemsEn[] }
 *   since(seen)     – Einträge, die neuer sind als die zuletzt gesehene Version
 */
(function () {
  "use strict";

  // NEUESTE zuerst. entries[0].version ist die aktuelle App-Version.
  const entries = [
    {
      version: "1.38.0",
      date: "2026-06-17",
      title: "Conjugación: Erklärseite jetzt auch auf Englisch",
      titleEn: "Conjugación: explanation page now in English too",
      items: [
        "🇬🇧 Die Konjugations-Erklärseite (Conjugación) war im englischen Modus noch komplett deutsch (Einleitung, Muster „-ar/-er/-ir“, unregelmäßige Verben, Merkhilfen und der Wegbeschreibungs-Dialog). Jetzt ist die ganze Seite sauber zweisprachig.",
        "✨ Bei den unregelmäßigen Verben stand außerdem – wie zuvor auf der Tiempos-Seite – die Übersetzung doppelt; der spanische Begriff bleibt jetzt stehen, die Bedeutung darunter wechselt mit der Sprache.",
      ],
      itemsEn: [
        "🇬🇧 The conjugation explanation page (Conjugación) was still entirely German in English mode (intro, the “-ar/-er/-ir” patterns, irregular verbs, memory aids and the directions dialogue). The whole page is now properly bilingual.",
        "✨ With the irregular verbs the translation also appeared twice – just as on the Tiempos page before; the Spanish term now stays put and the meaning below it switches with the language.",
      ],
    },
    {
      version: "1.37.0",
      date: "2026-06-17",
      title: "Tiempos: Schnellsprung-Navigation & Feinschliff",
      titleEn: "Tiempos: quick-jump navigation & polish",
      items: [
        "🧭 Die lange Zeiten-Seite (Tiempos) hat oben jetzt eine Sprungmarken-Leiste: ein Tipp bringt dich direkt zu Zeitformen, Tricks, Verlaufsform, Indef./Imperf., Unregelmäßig, Befehlen, Praxis oder Dialogen – kein endloses Scrollen mehr.",
        "🇬🇧 Englisch-Korrekturen auf der Tiempos-Seite: Bei den Zeitform-Karten und den unregelmäßigen Verben stand die Beschreibung doppelt (und der spanische Begriff fehlte); beim Vergleich „Indefinido oder Imperfecto“ waren die Stichpunkte noch auf Deutsch. Beides ist jetzt sauber übersetzt.",
      ],
      itemsEn: [
        "🧭 The long tenses page (Tiempos) now has a jump-link bar at the top: one tap takes you straight to tenses, tricks, the continuous form, Indef./Imperf., irregulars, commands, practice or dialogues – no more endless scrolling.",
        "🇬🇧 English fixes on the Tiempos page: on the tense cards and the irregular verbs the description appeared twice (and the Spanish term was missing); in the “Indefinido or Imperfecto” comparison the bullet points were still in German. Both are now properly translated.",
      ],
    },
    {
      version: "1.36.0",
      date: "2026-06-16",
      title: "Tiempos: Vergangenheits-Trick mit dem Gerundium",
      titleEn: "Tiempos: past-tense trick with the gerund",
      items: [
        "⏪ Neuer Abschnitt auf der Zeiten-Seite (Tiempos) direkt nach „Gerade jetzt: estar + Gerundio“: der Gerundio-Trick rückwärts. „estaba + Gerundio“ (z.B. „Estaba esperando el bus“) sagt, was in einem Moment der Vergangenheit gerade lief – das Gerundio bleibt gleich, nur estar wandert in die Vergangenheit.",
        "🇩🇪🇬🇧 Mit Mini-Vergleich (jetzt ↔ damals), Formen-Tabelle, Reise-Beispielen (Hintergrund + Ereignis im Indefinido) und einer Notiz zur Abgrenzung „estuve + Gerundio“ – auf Deutsch und Englisch.",
        "🃏 Dazu zwei neue Übungskarten im Bereich Tiempos zum „estaba + Gerundio“-Trick.",
      ],
      itemsEn: [
        "⏪ New section on the tenses page (Tiempos) right after “Right now: estar + Gerundio”: the gerund trick in reverse. “estaba + Gerundio” (e.g. “Estaba esperando el bus”) says what was going on at a moment in the past – the gerund stays the same, only estar moves into the past.",
        "🇩🇪🇬🇧 With a mini comparison (now ↔ back then), a forms table, travel examples (background + event in the indefinido) and a note distinguishing “estuve + Gerundio” – in German and English.",
        "🃏 Plus two new practice cards in the Tiempos section for the “estaba + Gerundio” trick.",
      ],
    },
    {
      version: "1.35.0",
      date: "2026-06-16",
      title: "Tiempos: der einfache Vergangenheits-Trick",
      titleEn: "Tiempos: the easy past-tense trick",
      items: [
        "🪄 Die Zeiten-Erklärseite (Tiempos) hat jetzt ganz oben einen eigenen „Vergangenheits-Trick“: he + Partizip – das genaue Gegenstück zum Zukunfts-Trick „voy a + Infinitiv“. Du beugst nur das kleine haber, das Hauptverb bleibt fest – damit redest du fast jedes Verb in der Vergangenheit los, lange bevor du alle Endungen kannst.",
        "🇩🇪🇬🇧 Mit Mini-Vergleich (Zukunft ↔ Vergangenheit), Formen, Bildungs-Rezept, Reise-Beispielen und einem ehrlichen Hinweis zum LatAm-Indefinido – auf Deutsch und Englisch.",
        "🛠️ Außerdem behoben: Die Tiempos-Seite öffnete sich seit der Sprachumstellung gar nicht mehr (ein interner Fehler beim Aufbau) – sie funktioniert wieder vollständig.",
      ],
      itemsEn: [
        "🪄 The tenses explanation page (Tiempos) now has its own “past-tense trick” right at the top: he + participle – the exact counterpart to the future trick “voy a + infinitive”. You only conjugate the little haber, the main verb stays fixed – so you can talk about almost any verb in the past long before you know all the endings.",
        "🇩🇪🇬🇧 With a mini comparison (future ↔ past), forms, a how-to recipe, travel examples and an honest note about the Latin American indefinido – in German and English.",
        "🛠️ Also fixed: since the language switch the Tiempos page wouldn’t open at all (an internal error while building it) – it works fully again.",
      ],
    },
    {
      version: "1.34.0",
      date: "2026-06-15",
      title: "Diálogos: Hintergrund zu „Besser so“",
      titleEn: "Diálogos: background for the “Better this way” answers",
      items: [
        "💡 Wenn in den Diálogos beim „Besser so“ die Musterantwort gezeigt wird, gibt es jetzt zu jeder Antwort einen kurzen Hintergrund – warum sie so lautet (Grammatik, Wortschatz oder Höflichkeit). Er sitzt direkt darunter und lässt sich zum Lesen aufklappen.",
        "🇩🇪🇬🇧 Die Erklärungen sind auf Deutsch und Englisch verfügbar und stören nicht beim schnellen Weiterspielen – aufklappen nur, wenn du magst.",
      ],
      itemsEn: [
        "💡 When the model answer is shown in the Diálogos “Better this way” step, every answer now comes with a short background – why it’s phrased that way (grammar, vocabulary or politeness). It sits right below and expands for reading.",
        "🇩🇪🇬🇧 The explanations are available in German and English and don’t get in the way of playing on quickly – expand them only if you want to.",
      ],
    },
    {
      version: "1.33.0",
      date: "2026-06-15",
      title: "Länderkunde: Bevölkerung, Politik & Wirtschaft",
      titleEn: "Country guide: population, politics & economy",
      items: [
        "👥 Jedes Land unter „Países y culturas“ hat jetzt einen neuen Abschnitt „Land & Wirtschaft“: Einwohnerzahl, Altersstruktur, politische Regierungsform, wirtschaftliche Lage und wovon das Land hauptsächlich lebt – mit aktuellen Werten (Stand 2025) kompakt auf einen Blick.",
        "🔎 Die neuen Angaben fließen auch in die Suche ein und sind wie alle Länderinhalte auf Deutsch und Englisch verfügbar.",
      ],
      itemsEn: [
        "👥 Every country under “Países y culturas” now has a new “Country & economy” section: population, age structure, form of government, economic situation and what the country mainly lives on – with up-to-date figures (as of 2025) compactly at a glance.",
        "🔎 The new details also feed into the search and, like all country content, are available in German and English.",
      ],
    },
    {
      version: "1.32.0",
      date: "2026-06-15",
      title: "Geteilte Modul-Links öffnen direkt das Modul",
      titleEn: "Shared module links open the module directly",
      items: [
        "🔗 Tippt jemand auf den Link unter einem „Modul teilen“-Sharepic, landet er jetzt direkt im empfohlenen Modul (z.B. Precios al oído) statt nur auf der Startseite – der Link trägt dafür eine Modul-Kennung (?m=…).",
      ],
      itemsEn: [
        "🔗 If someone taps the link under a “Share module” sharepic, they now land directly in the recommended module (e.g. Precios al oído) instead of just on the home page – the link carries a module ID for that (?m=…).",
      ],
    },
    {
      version: "1.31.1",
      date: "2026-06-15",
      title: "„Modul teilen“ besser sichtbar",
      titleEn: "“Share module” more visible",
      items: [
        "📤 Der „Modul teilen“-Knopf erscheint jetzt in allen Entdecken-Modulen im selben auffälligen Orange wie bei „Historia de Sudamérica“ – vorher war er außerhalb von Historia unscheinbar grau und leicht zu übersehen.",
      ],
      itemsEn: [
        "📤 The “Share module” button now appears in all Discover modules in the same eye-catching orange as in “Historia de Sudamérica” – previously, outside of Historia, it was an inconspicuous grey and easy to miss.",
      ],
    },
    {
      version: "1.31.0",
      date: "2026-06-15",
      title: "„Modul teilen“ jetzt in allen Entdecken-Modulen",
      titleEn: "“Share module” now in all Discover modules",
      items: [
        "📤 Der „Modul teilen“-Knopf sitzt jetzt oben in jedem Entdecken-Modul – nicht mehr nur bei „Historia de Sudamérica“. Damit lässt sich jedes Modul (Supervivencia, Modo hostal, Definiciones, Frases flexibles, Diálogos, Regatear, Precios al oído, El Cuerpo, Lista de compras, Conjugación, Tiempos, Países y culturas, Etiqueta de viaje, Logística de viaje und Salud y energía) als Einladung weiterempfehlen.",
        "🎨 Jedes Sharepic ist auf sein Modul zugeschnitten: Icon, Titel und ein paar echte Highlights – je nach Modul Beispiel-Vokabeln, Themen- oder Szenenlisten – in 1:1 oder 9:16 (Story).",
      ],
      itemsEn: [
        "📤 The “Share module” button now sits at the top of every Discover module – no longer only in “Historia de Sudamérica”. This lets you recommend any module (Supervivencia, Modo hostal, Definiciones, Frases flexibles, Diálogos, Regatear, Precios al oído, El Cuerpo, Lista de compras, Conjugación, Tiempos, Países y culturas, Etiqueta de viaje, Logística de viaje and Salud y energía) as an invitation.",
        "🎨 Each sharepic is tailored to its module: icon, title and a few real highlights – depending on the module, example vocabulary, topic or scene lists – in 1:1 or 9:16 (story).",
      ],
    },
    {
      version: "1.30.0",
      date: "2026-06-15",
      title: "Historia de Centroamérica: die zweite große Geschichte",
      titleEn: "Historia de Centroamérica: the second great history",
      items: [
        "🌋 Neue Erklärseite unter Entdecken: die ganze Geschichte Mittelamerikas auf einen Blick – von den Maya über die spanische Eroberung und das Königreich Guatemala bis zu Morazáns Traum von Einheit, den Bürgerkriegen des Kalten Krieges und den sieben Republiken von heute.",
        "🕰️ Interaktiver Zeitstrahl: acht aufklappbare Epochen – die Welt der Maya, Conquista, Kolonialzeit, Unabhängigkeit 1821, die Föderation, Kaffee & Bananen, Bürgerkriege und der Weg bis heute. Jede Epoche mit Kernpunkten, Erklärung und (wo verfügbar) Bild.",
        "👤 Galerie der Protagonisten: Francisco Morazán, Augusto César Sandino, Óscar Romero, Rigoberta Menchú und José Figueres – mit Lebensdaten und Zitat.",
        "📰 „Heute: Lage & Spannungen“: aktuelle Themen verständlich erklärt – El Salvador unter Bukele, Nicaragua unter Ortega, der Panamakanal, Maras & Migration, Guatemalas Neuanfang und Costa Rica als stabile Ausnahme.",
        "📖 Komplett mit Lesetraining: jede Epoche, jeder Protagonist und jede „Heute“-Karte gibt es zusätzlich als spanischen Lesetext mit antippbaren Vokabeln, Wörterliste, Quiz, Schwierigkeits-Score und teilbarem Sharepic – genau wie bei „Historia de Sudamérica“.",
      ],
      itemsEn: [
        "🌋 New explanation page under Discover: the whole history of Central America at a glance – from the Maya through the Spanish conquest and the Kingdom of Guatemala to Morazán’s dream of unity, the civil wars of the Cold War and today’s seven republics.",
        "🕰️ Interactive timeline: eight expandable eras – the world of the Maya, the Conquista, the colonial period, independence in 1821, the federation, coffee & bananas, civil wars and the path to today. Each era with key points, an explanation and (where available) an image.",
        "👤 Gallery of protagonists: Francisco Morazán, Augusto César Sandino, Óscar Romero, Rigoberta Menchú and José Figueres – with life dates and a quote.",
        "📰 “Today: situation & tensions”: current topics explained clearly – El Salvador under Bukele, Nicaragua under Ortega, the Panama Canal, the maras & migration, Guatemala’s fresh start and Costa Rica as the stable exception.",
        "📖 Complete with reading practice: every era, every protagonist and every “Today” card also comes as a Spanish reading text with tappable vocabulary, a word list, a quiz, a difficulty score and a shareable sharepic – just like in “Historia de Sudamérica”.",
      ],
    },
    {
      version: "1.29.0",
      date: "2026-06-15",
      title: "Historia-Modul als Ganzes teilen",
      titleEn: "Share the whole Historia module",
      items: [
        "📤 Neues Sharepic auf Modul-Ebene: „Historia de Sudamérica“ lässt sich jetzt komplett weiterempfehlen – ein Bild mit Modulname, Einleitung und einem Zeitstrahl-Teaser der Epochen, in 1:1 oder 9:16 (Story). Der „Modul teilen“-Knopf sitzt oben direkt unter der Bereichs-Navigation.",
      ],
      itemsEn: [
        "📤 New module-level sharepic: “Historia de Sudamérica” can now be recommended as a whole – an image with the module name, intro and a timeline teaser of the eras, in 1:1 or 9:16 (story). The “Share module” button sits at the top, right under the section navigation.",
      ],
    },
    {
      version: "1.28.0",
      date: "2026-06-15",
      title: "Historia de Sudamérica: die große Geschichte",
      titleEn: "Historia de Sudamérica: the great history",
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
      itemsEn: [
        "📜 New explanation page under Discover (and as a banner in “Países y culturas”): the whole history of South America at a glance – from the Inca through the Spanish conquest and the colonial period to Bolívar, San Martín and independence.",
        "🕰️ Interactive timeline: seven expandable eras – advanced civilisations, the Conquista, the viceroyalties & silver, the spark (Napoleon & the juntas), the fight for freedom, the split into many nations and the path to today. Each era with an image from Wikimedia, key points and an explanation.",
        "👤 Gallery of protagonists: Bolívar, San Martín, Sucre, O’Higgins, Manuela Sáenz and Atahualpa – with a portrait, life dates and a quote.",
        "📰 “Today: situation & tensions”: current conflicts explained clearly – the Venezuela crisis & mass exodus, the Essequibo border dispute, Bolivia’s access to the sea, Colombia’s peace process, Peru’s permanent political crisis, Argentina’s change of course, the Amazon & indigenous rights and the Darién.",
        "📖 Reading practice in Spanish: every era also comes as a Spanish reading text. Difficult words are marked – tap to see the translation. Each text has a word list for quick reference, neatly split into “worth taking with you” and “not so important”.",
        "📊 A difficulty score (CEFR A1–C1) per text for self-assessment, plus “Show full translation” and a shareable sharepic of the text & word list.",
        "🧩 Mini quiz per era: read the Spanish word, tap the right translation – with instant feedback (right/wrong).",
        "📖 Reading practice everywhere now: every protagonist and every “Today” card also has an expandable Spanish reading text with tappable vocabulary, a word list and a sharepic.",
        "💡 “¿Sabías que…?” tidbits and bilingual throughout (German/English).",
      ],
    },
    {
      version: "1.27.0",
      date: "2026-06-14",
      title: "Suche & sauberes Scrollen",
      titleEn: "Search & clean scrolling",
      items: [
        "🔍 Neue Suche: Tippe oben auf „Suchen …“ (im Lernen- und Entdecken-Reiter) und finde gezielt, was du brauchst – Vokabelkarten, ganze Themen und Übungen unter „Übungen“, Länderkunde, Reise-Knigge, Logística und Salud unter „Informationen“. Sucht auf Deutsch wie Spanisch und ist nachsichtig mit Akzenten („nino“ findet „niño“, „mexico“ findet „México“).",
        "🧭 Treffer führen direkt ans Ziel: Eine Karte öffnet ihre Detailseite (mit ‹ zurück zur Suche), ein Thema startet die Lernrunde, ein Land öffnet die Länderkunde gleich beim richtigen Eintrag.",
        "⬆️ Sauberes Scrollen beim Wechsel: Öffnest du aus einer weiter unten gescrollten Liste eine Kategorie oder Übung, beginnt die neue Seite jetzt zuverlässig oben – statt die alte Scroll-Position zu erben.",
        "🎒 Salud y energía erweitert: neuer Tipp-Block „Ausflüge & lange Fahrten“ – immer etwas Zucker am Körper (Kreislauf!), eigener Proviant trotz „Verpflegung inklusive“, Mini-Reiseapotheke (Schmerz- & Reisetablette, Pflaster – für Frauen besonders wichtig) und etwas Langärmliges gegen eiskalte Bus-Klimaanlagen. Dazu passende Apotheken-Sätze und Begriffe.",
      ],
      itemsEn: [
        "🔍 New search: tap “Search …” at the top (in the Learn and Discover tabs) and find exactly what you need – vocabulary cards, whole topics and exercises under “Exercises”, the country guide, travel etiquette, Logística and Salud under “Information”. It searches in German and Spanish and is forgiving with accents (“nino” finds “niño”, “mexico” finds “México”).",
        "🧭 Results take you straight there: a card opens its detail page (with ‹ back to the search), a topic starts the learning round, a country opens the country guide right at the correct entry.",
        "⬆️ Clean scrolling when switching: if you open a category or exercise from a list you had scrolled down in, the new page now reliably starts at the top – instead of inheriting the old scroll position.",
        "🎒 Salud y energía expanded: new tip block “Excursions & long rides” – always keep some sugar on you (circulation!), your own snacks despite “meals included”, a mini first-aid kit (painkiller & travel-sickness pill, plasters – especially important for women) and something long-sleeved against ice-cold bus air conditioning. Plus matching pharmacy phrases and terms.",
      ],
    },
    {
      version: "1.26.0",
      date: "2026-06-14",
      title: "Salud y energía: gesund & fit unterwegs",
      titleEn: "Salud y energía: healthy & fit on the road",
      items: [
        "🥗 Neues Entdecken-Modul fürs Gesundbleiben auf der Straße: ausgewogen essen statt nur Streetfood (Protein, Ballaststoffe, Vitamine gezielt holen), Frühstück selbst machen – Porridge mit Proteinpulver & Früchten, ganz ohne Küche.",
        "💧 Günstig & mit Geschmack trinken: Zero-Sirup und Elektrolytpulver (suero) peppen billiges Wasser auf, sparen Geld und gleichen das Schwitzen aus. Dazu Tipps zu Bauch & Verdauung, Sonne/Höhe/Mücken und Bewegung – plus ein „Gesund-unterwegs-Kit“.",
        "💬 Mit den passenden Sätzen als Karten: gesund einkaufen, gesünder bestellen („a la plancha, no frito“), nach Yoga & Gym-Tagespass fragen und in der Apotheke nach suero, Sonnencreme & Co. fragen.",
        "🏋️ In Bewegung bleiben ohne Studio-Abo: manche Hostels bieten Yoga, in größeren Städten gibt es im Gym oft einen günstigen Tagespass – ein gutes Erlebnis, weil dort die Locals trainieren.",
        "📅 Logística de viaje ergänzt: Tipp zum Vorausplanen – beliebte Hostels und knappe Plätze in der Hochsaison früher buchen.",
      ],
      itemsEn: [
        "🥗 New Discover module for staying healthy on the road: eating a balanced diet instead of just street food (getting protein, fibre and vitamins on purpose), making your own breakfast – porridge with protein powder & fruit, with no kitchen at all.",
        "💧 Drinking cheaply & with flavour: zero-calorie syrup and electrolyte powder (suero) pep up cheap water, save money and make up for sweating. Plus tips on stomach & digestion, sun/altitude/mosquitoes and exercise – along with a “stay-healthy travel kit”.",
        "💬 With the matching phrases as cards: shopping healthily, ordering more healthily (“a la plancha, no frito”), asking about yoga & a gym day pass and asking at the pharmacy for suero, sunscreen & co.",
        "🏋️ Staying active without a gym membership: some hostels offer yoga, and in bigger cities the gym often has a cheap day pass – a nice experience, because that’s where the locals train.",
        "📅 Logística de viaje extended: a tip on planning ahead – book popular hostels and scarce spots earlier in high season.",
      ],
    },
    {
      version: "1.25.0",
      date: "2026-06-14",
      title: "Logística de viaje: clever & sicher ankommen",
      titleEn: "Logística de viaje: arriving smartly & safely",
      items: [
        "🧳 Neues Modul unter Entdecken: die praktischen Handgriffe, die kein Sprachkurs lehrt – SIM-Karte (chip) kaufen & online sein, Geld wechseln und am cajero abheben (ohne teure Umrechnung), Geld & Wertsachen auf mehrere Gepäckstücke aufteilen, das Gepäck per Tracker (AirTag & Co.) im Blick behalten.",
        "✈️ Handgepäck-Notfallset als Packliste: das Wichtigste – Medikamente, Wechselwäsche, Hygiene, Powerbank, Dokumente – kommt ins Handgepäck, falls der große Rucksack später (oder gar nicht) ankommt.",
        "💬 Dazu die passenden Sätze als Karten: nach SIM, Geld und verlorenem Gepäck fragen – jeweils auf Spanisch mit Übersetzung.",
      ],
      itemsEn: [
        "🧳 New module under Discover: the practical moves no language course teaches – buying a SIM card (chip) & getting online, changing money and withdrawing at the cajero (without expensive conversion), splitting money & valuables across several bags, keeping an eye on your luggage with a tracker (AirTag & co.).",
        "✈️ Carry-on emergency set as a packing list: the essentials – medication, a change of clothes, toiletries, a power bank, documents – go in your carry-on in case the big backpack arrives later (or not at all).",
        "💬 Plus the matching phrases as cards: asking about a SIM, money and lost luggage – each in Spanish with a translation.",
      ],
    },
    {
      version: "1.24.0",
      date: "2026-06-13",
      title: "Trip-Ziel: gleich zu Beginn gesetzt, im Profil verwaltet",
      titleEn: "Trip goal: set right at the start, managed in your profile",
      items: [
        "🧭 Beim allerersten Start fragt dich HolaRuta jetzt nach deinem Trip-Ziel – Reisedatum und Tagespensum sind in einem Schritt gesetzt (oder per „Später“ übersprungen).",
        "🎯 Das Dashboard bleibt ruhig: Die Trip-Karte mit Countdown erscheint nur noch, wenn ein Ziel gesetzt ist. Ein Tap darauf führt direkt zur Verwaltung.",
        "👤 Anlegen, Ändern und Löschen des Trip-Ziels wohnt jetzt gebündelt im Profil-Reiter.",
      ],
      itemsEn: [
        "🧭 On the very first launch HolaRuta now asks for your trip goal – travel date and daily target are set in one step (or skipped via “Later”).",
        "🎯 The dashboard stays calm: the trip card with the countdown only appears when a goal is set. A tap on it takes you straight to managing it.",
        "👤 Creating, changing and deleting the trip goal now lives together in the Profile tab.",
      ],
    },
    {
      version: "1.23.0",
      date: "2026-06-13",
      title: "Aufgeräumte Einstellungen & automatische Updates",
      titleEn: "Tidied-up settings & automatic updates",
      items: [
        "⚙️ Die Einstellungen sind aufgeräumt: Die Stufen-Auswahl (Alle, A1, A2, B1) liegt jetzt direkt auf dem Dashboard – die änderst du ja laufend beim Lernen. Sprache, Modus, Richtung und Sprechtempo wohnen gebündelt im Profil-Reiter.",
        "✨ Neue Versionen kommen jetzt von allein an: Sobald eine bereitsteht, erscheint unten ein „Neue Version – jetzt laden“-Banner. Ein Tap lädt die App frisch – du musst sie dafür nicht mehr ganz schließen.",
      ],
      itemsEn: [
        "⚙️ The settings are tidied up: the level selector (All, A1, A2, B1) now sits right on the dashboard – after all, you change it constantly while learning. Language, mode, direction and speech speed live together in the Profile tab.",
        "✨ New versions now arrive on their own: as soon as one is ready, a “New version – load now” banner appears at the bottom. One tap reloads the app fresh – you no longer have to close it completely.",
      ],
    },
    {
      version: "1.22.0",
      date: "2026-06-13",
      title: "Zurück-Wischen führt zurück, statt die App zu schließen",
      titleEn: "Swiping back goes back instead of closing the app",
      items: [
        "↩️ Die Zurück-Geste (Wischen vom Bildschirmrand bzw. die Zurück-Taste) bringt dich jetzt Schritt für Schritt eine Ebene höher – aus einer Übung zurück zur Auswahl und von dort aufs Dashboard – statt die App sofort zu schließen.",
        "🏠 Erst wenn du wieder auf dem Dashboard bist, verlässt die nächste Zurück-Geste die App. Offene Einblendungen (z. B. der Spickzettel-Großbildschirm oder der Update-Hinweis) schließt Zurück zuerst.",
      ],
      itemsEn: [
        "↩️ The back gesture (swiping from the edge of the screen, or the back button) now takes you up one level at a time – from an exercise back to the selection and from there to the dashboard – instead of closing the app right away.",
        "🏠 Only once you’re back on the dashboard does the next back gesture leave the app. Open overlays (e.g. the cheat-sheet full screen or the update notice) are closed by Back first.",
      ],
    },
    {
      version: "1.21.0",
      date: "2026-06-13",
      title: "Wochentage: je ein Tag, eine Karte",
      titleEn: "Weekdays: one day, one card each",
      items: [
        "📅 Die Wochentage stecken nicht mehr gebündelt in drei Karten (Montag/Dienstag, Mittwoch/Donnerstag, Freitag/Samstag/Sonntag), sondern haben jede einen eigenen Eintrag – von lunes bis domingo. So lernst (und prüfst) du jeden Tag wirklich einzeln, statt mit einem Wort eine ganze Gruppe „richtig“ abzuhaken.",
        "🧭 Jeder Wochentag bekommt einen eigenen Reise-Kontext mit Beispielsatz und Tipp.",
      ],
      itemsEn: [
        "📅 The weekdays are no longer bundled into three cards (Monday/Tuesday, Wednesday/Thursday, Friday/Saturday/Sunday) but each has its own entry – from lunes to domingo. So you really learn (and test) each day individually, instead of ticking off a whole group as “correct” with a single word.",
        "🧭 Each weekday gets its own travel context with an example sentence and a tip.",
      ],
    },
    {
      version: "1.20.0",
      date: "2026-06-12",
      title: "Diálogos: längere Gespräche & runderer Ablauf",
      titleEn: "Diálogos: longer conversations & smoother flow",
      items: [
        "💬 Alle Diálogos sind jetzt deutlich länger – aus drei kurzen Wortwechseln werden vollständige Gespräche mit sieben bis neun Repliken: einchecken samt Zimmerwahl und Frühstücksfrage, im Taxi plaudern, auf dem Markt richtig feilschen, an der Grenze Schritt für Schritt durch die Kontrolle.",
        "🧭 Neu: Schrittanzeige über dem Verlauf („Schritt 4 von 17“) – so siehst du jederzeit, wie weit das Gespräch noch geht.",
        "👇 Der gerade aktive Zug rückt automatisch ins Bild, und beim Frei-Tippen springt der Cursor direkt ins Feld – kein Scrollen und kein Extra-Tipp mehr nötig.",
        "💡 Neu: „Tipp anzeigen“ beim Selbst-Tippen blendet die Musterantwort als Hilfe ein, wenn du mal nicht weiterweißt.",
      ],
      itemsEn: [
        "💬 All Diálogos are now noticeably longer – three short exchanges become full conversations of seven to nine lines: checking in with room choice and a breakfast question, chatting in the taxi, really haggling at the market, going through the border check step by step.",
        "🧭 New: a step indicator above the conversation (“Step 4 of 17”) – so you can always see how far the conversation still goes.",
        "👇 The currently active turn scrolls into view automatically, and when typing freely the cursor jumps straight into the field – no scrolling and no extra tap needed.",
        "💡 New: “Show hint” while typing yourself reveals the model answer as help when you’re stuck.",
      ],
    },
    {
      version: "1.19.0",
      date: "2026-06-12",
      title: "Diálogos, Conjugador, Sprechtempo & Trip-Ziel",
      titleEn: "Diálogos, Conjugador, speech speed & trip goal",
      items: [
        "💬 Neu: Diálogos – spiel echte Reisegespräche Zug für Zug durch (Hotel-Check-in, Restaurant, Busticket, Taxi, Markt, Apotheke, Hostel, Grenze, Notfall, Wegfrage). Die Gegenseite spricht, du antwortest per Auswahl oder tippst die Schlüsselsätze selbst.",
        "🔁 Neu: Conjugador – Verben aktiv konjugieren statt nur lesen: „ir – wir“ → tippe „vamos“. Zwei Stufen (nur regelmäßige Muster oder mit unregelmäßigen Reiseverben), mit Punktestand. Auf der Conjugación-Seite startbar.",
        "🐢 Neu: Sprechtempo wählbar (Langsam · Normal · Schnell) in den Einstellungen – langsamer zum Nachsprechen, schneller fürs echte Busbahnhof-Tempo. Gilt für Hören, Precios und Diálogos.",
        "🎯 Neu: Trip-Ziel – setz dein Reisedatum und ein Tagesziel; die Startseite zeigt Countdown und „X/Y heute“. Stärkt die Lern-Serie bis zur Abreise.",
      ],
      itemsEn: [
        "💬 New: Diálogos – play through real travel conversations turn by turn (hotel check-in, restaurant, bus ticket, taxi, market, pharmacy, hostel, border, emergency, asking directions). The other side speaks, you reply by choice or type the key sentences yourself.",
        "🔁 New: Conjugador – conjugate verbs actively instead of just reading: “ir – we” → type “vamos”. Two levels (regular patterns only, or with irregular travel verbs), with a score. Can be started from the Conjugación page.",
        "🐢 New: speech speed selectable (Slow · Normal · Fast) in the settings – slower for repeating after, faster for real bus-station pace. Applies to Listening, Precios and Diálogos.",
        "🎯 New: trip goal – set your travel date and a daily target; the home page shows a countdown and “X/Y today”. Strengthens your learning streak until departure.",
      ],
    },
    {
      version: "1.18.0",
      date: "2026-06-12",
      title: "Sharepics: App-Link zum Mitlernen",
      titleEn: "Sharepics: app link to learn along",
      items: [
        "🔗 Jedes geteilte Bild zeigt jetzt unten die App-Adresse (moarci.github.io/holaRuta) in Link-Optik – so sieht jede:r sofort, wo es die App gibt.",
        "👉 Beim Teilen per Handy steht der echte, anklickbare Link „Jetzt mitlernen“ im Begleittext – in WhatsApp, Telegram & Co. direkt antippbar. (Ein PNG selbst kann keinen klickbaren Link enthalten.)",
      ],
      itemsEn: [
        "🔗 Every shared image now shows the app address (moarci.github.io/holaRuta) at the bottom in link style – so everyone immediately sees where to get the app.",
        "👉 When sharing from a phone, the real, clickable link “Learn along now” is in the accompanying text – directly tappable in WhatsApp, Telegram & co. (A PNG itself can’t contain a clickable link.)",
      ],
    },
    {
      version: "1.17.0",
      date: "2026-06-12",
      title: "Ruta-Pass: Stempel als Sharepic teilen",
      titleEn: "Ruta pass: share stamps as a sharepic",
      items: [
        "🎖️ Jeden freigeschalteten Stempel kannst du jetzt direkt aus dem Ruta-Pass als Bild teilen – über den neuen „📤 Teilen“-Knopf auf der Stempel-Kachel.",
        "Das Sharepic zeigt deinen Stempel wie einen echten Reisestempel im Pass: großes Medaillon mit Emoji, Name, Freischalt-Text und deinem Sammelstand – in 1:1 oder 9:16 (Story).",
      ],
      itemsEn: [
        "🎖️ You can now share every unlocked stamp as an image straight from the Ruta pass – via the new “📤 Share” button on the stamp tile.",
        "The sharepic shows your stamp like a real travel stamp in a passport: a large medallion with an emoji, the name, the unlock text and your collection progress – in 1:1 or 9:16 (story).",
      ],
    },
    {
      version: "1.16.0",
      date: "2026-06-12",
      title: "Spickzettel: bessere Auswahl, Großanzeige & Sprungleiste",
      titleEn: "Cheat sheet: better selection, big display & jump bar",
      items: [
        "🆘 Die Sätze sind jetzt kuratiert statt „die ersten der Kategorie“: Bei Notfall stehen „Hilfe!“, „Necesito un médico“ und „Llame a la policía“ ganz oben, bei Wegbeschreibung echte Survival-Fragen wie „¿Cómo llego al centro?“ statt nur Vokabeln.",
        "👁️ Satz antippen zeigt ihn bildschirmfüllend in Riesenschrift – zum Herzeigen, wenn Reden nicht reicht. Tippen daneben (oder Escape) schließt wieder.",
        "🧭 Neue Sprungleiste oben: ein Tipp auf Notfall, Grundlagen, Wegbeschreibung oder Geld springt direkt zum Bereich.",
        "Jeder Satz erscheint höchstens einmal auf dem Zettel – auch wenn er in mehreren Bereichen passt.",
      ],
      itemsEn: [
        "🆘 The phrases are now curated instead of “the first ones in the category”: for Emergency, “Hilfe!”, “Necesito un médico” and “Llame a la policía” are right at the top, and for Directions, real survival questions like “¿Cómo llego al centro?” instead of just vocabulary.",
        "👁️ Tapping a phrase shows it full-screen in giant type – to show someone when talking isn’t enough. Tapping beside it (or Escape) closes it again.",
        "🧭 New jump bar at the top: a tap on Emergency, Basics, Directions or Money jumps straight to that section.",
        "Each phrase appears at most once on the sheet – even if it fits in several sections.",
      ],
    },
    {
      version: "1.15.0",
      date: "2026-06-12",
      title: "Einkaufszettel: echtes Abhaken + Fragen fürs Geschäft",
      titleEn: "Shopping list: real check-off + questions for the shop",
      items: [
        "✅ Der Einkaufszettel funktioniert jetzt wie eine echte Liste: Über das Kästchen links hakst du ab, was erledigt ist – und nimmst das Häkchen jederzeit wieder zurück. Vorher ließ sich ein Wort nur antippen, aber nicht mehr abwählen.",
        "Antippen und Abhaken sind getrennt: Ein Wort aufklappen (Aussprache, Reisetipp, Vorlesen) hakt es nicht mehr automatisch ab – so kannst du nachschlagen, ohne die Liste durcheinanderzubringen.",
        "🗣️ Neu zu jedem Wort zwei gebrauchsfertige Fragen fürs Geschäft – ob sie es haben («¿Tienen …?») und wo man es findet («¿Dónde puedo encontrar …?») – mit Übersetzung und 🔊 zum Vorlesen.",
      ],
      itemsEn: [
        "✅ The shopping list now works like a real list: with the box on the left you tick off what’s done – and untick it again at any time. Previously you could only tap a word but not deselect it.",
        "Tapping and ticking off are separate: expanding a word (pronunciation, travel tip, read aloud) no longer ticks it off automatically – so you can look things up without messing up the list.",
        "🗣️ New for every word: two ready-to-use questions for the shop – whether they have it («¿Tienen …?») and where to find it («¿Dónde puedo encontrar …?») – with a translation and 🔊 to read it aloud.",
      ],
    },
    {
      version: "1.14.0",
      date: "2026-06-12",
      title: "Regatear: gut verhandeln & feilschen",
      titleEn: "Regatear: negotiating & haggling well",
      items: [
        "🤝 Neuer Bereich unter Entdecken: „Regatear“ – wie man auf Märkten und an Straßenständen freundlich und richtig verhandelt.",
        "📖 Erklärung der Taktik in vier aufklappbaren Blöcken: Grundhaltung, die Verhandlung führen, der Abschluss (Weggehen als Taktik) und Taxi, Tuk-Tuk & Touren (Preis vorher aushandeln).",
        "🗣️ Glossar der Feilsch-Wörter (regatear, el descuento, la rebaja, precio fijo, la yapa/ñapa, el/la casero/a …).",
        "💬 Die wichtigsten Sätze nach Phasen sortiert: Preis erfragen (¿A cuánto la unidad?), feilschen (¿Cuánto es lo menos?), abschließen (Trato hecho), bezahlen & Wechselgeld (¿Tiene cambio de cien?) und etwas finden (¿Dónde consigo…?).",
        "⚖️ Mengen & Einheiten vom Marktstand: unidad/pieza, docena, par, libra, kilo, litro, montón, manojo … – jeweils mit Beispielsatz.",
        "🌎 Regionale Unterschiede von Land zu Land: México, Guatemala, Perú & Bolivia (la yapa), Colombia, Argentina, Costa Rica und Cuba.",
        "🎭 Vier Rollenspiele zum Üben: Obst & Gemüse, Souvenir feilschen (chancletas), erst suchen dann handeln und Taxipreis aushandeln – Dialoge zum lauten Durchspielen zu zweit.",
      ],
      itemsEn: [
        "🤝 New section under Discover: “Regatear” – how to negotiate politely and properly at markets and street stalls.",
        "📖 The tactics explained in four expandable blocks: the right attitude, leading the negotiation, closing the deal (walking away as a tactic) and taxis, tuk-tuks & tours (negotiating the price up front).",
        "🗣️ A glossary of haggling words (regatear, el descuento, la rebaja, precio fijo, la yapa/ñapa, el/la casero/a …).",
        "💬 The key phrases sorted by phase: asking the price (¿A cuánto la unidad?), haggling (¿Cuánto es lo menos?), closing (Trato hecho), paying & change (¿Tiene cambio de cien?) and finding something (¿Dónde consigo…?).",
        "⚖️ Quantities & units from the market stall: unidad/pieza, docena, par, libra, kilo, litro, montón, manojo … – each with an example sentence.",
        "🌎 Regional differences from country to country: México, Guatemala, Perú & Bolivia (la yapa), Colombia, Argentina, Costa Rica and Cuba.",
        "🎭 Four role-plays to practise: fruit & vegetables, haggling for a souvenir (chancletas), search first then bargain, and negotiating a taxi fare – dialogues to play out loud in pairs.",
      ],
    },
    {
      version: "1.13.0",
      date: "2026-06-12",
      title: "Karten überspringen: nicht jede Karte muss durch",
      titleEn: "Skip cards: not every card has to be done",
      items: [
        "⏭️ Neuer „Überspringen“-Button beim Lernen: Wer eine Karte gerade nicht machen will, nimmt sie ohne Bewertung aus der Sitzung – so muss niemand jede Karte durchziehen.",
        "Überspringen zählt nicht als „gewusst“: Der Lernstand (SRS) bleibt unangetastet, die Karte ist beim nächsten Mal wieder fällig.",
        "Funktioniert in allen drei Modi (🃏 Karteikarte, ✍️ Schreiben, 👂 Hören) – am Schreibtisch geht es auch per Taste „s“.",
      ],
      itemsEn: [
        "⏭️ New “Skip” button while learning: if you don’t want to do a card right now, you remove it from the session without a rating – so nobody has to push through every card.",
        "Skipping doesn’t count as “known”: your learning progress (SRS) stays untouched and the card is due again next time.",
        "Works in all three modes (🃏 Flashcard, ✍️ Writing, 👂 Listening) – at a desk you can also use the “s” key.",
      ],
    },
    {
      version: "1.12.0",
      date: "2026-06-12",
      title: "Gegenteile: Antonym-Paare lernen",
      titleEn: "Opposites: learning antonym pairs",
      items: [
        "↔️ Neuer Lernbereich „Gegenteile“ mit 26 Antonym-Paaren: groß – klein, teuer – billig, offen – geschlossen, früh – spät, hell – dunkel … – reisetauglich und LatAm-korrekt.",
        "Funktioniert in allen drei Modi (🃏 Karteikarte, ✍️ Schreiben, 👂 Hören) und in beiden Richtungen (DE→ES und ES→DE) – beim Schreiben zählt jede Seite des Paares.",
        "Jede Karte mit Aussprache-Tipp und 🧭 Reise-Kontext: ein echter Satz, der beide Gegenteile gegenüberstellt (z. B. „El bus sale temprano y llega tarde.“).",
      ],
      itemsEn: [
        "↔️ New learning section “Opposites” with 26 antonym pairs: big – small, expensive – cheap, open – closed, early – late, light – dark … – travel-ready and Latin-America-correct.",
        "Works in all three modes (🃏 Flashcard, ✍️ Writing, 👂 Listening) and in both directions (DE→ES and ES→DE) – in Writing mode each side of the pair counts.",
        "Every card with a pronunciation tip and 🧭 travel context: a real sentence that contrasts both opposites (e.g. “El bus sale temprano y llega tarde.”).",
      ],
    },
    {
      version: "1.11.0",
      date: "2026-06-12",
      title: "Precios al oído: deutlich mehr & größere Preise",
      titleEn: "Precios al oído: many more & bigger prices",
      items: [
        "💵 Der Preis-Hörtrainer erzeugt Beträge jetzt frisch in jeder Runde, statt aus einer Handvoll fester Karten zu ziehen – beliebig viele, abwechslungsreiche und auch richtig krumme Preise.",
        "🇨🇴 Große Zahlen wie im echten Reisealltag: Vorab wählst du ein Land/Währung – Kolumbien (Pesos in Millionenhöhe), Chile, Argentinien, Costa Rica, Mexiko, Peru und Guatemala – jeweils grammatisch sauber gesprochen (un millón quinientos mil, veintiún mil, „de pesos“ nur bei vollen Millionen …).",
        "🎚️ Drei Schwierigkeitsstufen je Land: von Kleingeld (Kaffee, Snacks) über den Alltag (Essen, Hostel, kurze Fahrten) bis zu großen Beträgen (Fernbus, Tour, Miete).",
        "Tippen bleibt entspannt: Punkte, Leerzeichen und Währungszeichen werden ignoriert – nur die Ziffern zählen.",
        "🤑 Neuer Ruta-Pass-Stempel „Millonario de oído“ für eine fehlerfreie Runde auf der Stufe „Große Beträge“.",
      ],
      itemsEn: [
        "💵 The price-listening trainer now generates amounts fresh each round instead of drawing from a handful of fixed cards – any number of varied and properly odd prices.",
        "🇨🇴 Big numbers like in real travel life: you pick a country/currency up front – Colombia (pesos in the millions), Chile, Argentina, Costa Rica, Mexico, Peru and Guatemala – each spoken with correct grammar (un millón quinientos mil, veintiún mil, “de pesos” only for full millions …).",
        "🎚️ Three difficulty levels per country: from small change (coffee, snacks) through everyday amounts (meals, hostel, short rides) to large sums (long-distance bus, tour, rent).",
        "Typing stays relaxed: dots, spaces and currency symbols are ignored – only the digits count.",
        "🤑 New Ruta-pass stamp “Millonario de oído” for a flawless round on the “Large amounts” level.",
      ],
    },
    {
      version: "1.10.1",
      date: "2026-06-12",
      title: "Reise-Knigge: Toilettenpapier-Regel",
      titleEn: "Travel etiquette: the toilet-paper rule",
      items: [
        "🚽 Neu im Reise-Knigge (Kultur & Etikette): Toilettenpapier gehört in vielen Ländern in den Mülleimer (papelera) neben der Toilette, nicht ins WC – die Rohre sind oft zu eng (Schild: „No arrojar papeles ni toallas sanitarias“).",
        "Ecuador-Akzent ergänzt: Hinweis auf die papelera statt WC.",
      ],
      itemsEn: [
        "🚽 New in travel etiquette (culture & etiquette): in many countries toilet paper goes in the bin (papelera) next to the toilet, not down the loo – the pipes are often too narrow (sign: “No arrojar papeles ni toallas sanitarias”).",
        "Ecuador note added: a reminder to use the papelera instead of the toilet.",
      ],
    },
    {
      version: "1.10.0",
      date: "2026-06-12",
      title: "Reise-Knigge: Verhalten unterwegs",
      titleEn: "Travel etiquette: how to behave on the road",
      items: [
        "🧭 Neuer Bereich unter Entdecken: „Reise-Knigge“ mit DOs & Don'ts zum Verhalten auf Reisen – Hostel & Dorm, Bus & Transport, Gruppen & Leute sowie Kultur & Etikette.",
        "Praktische Faustregeln: Nachtruhe im Schlafsaal, Licht/Lärm, Wertsachen im Bus, wie man unterwegs auf Leute zugeht, Trinkgeld und Begrüßung.",
        "Pro Land Besonderheiten („Akzente“) für alle 19 Länder – z. B. „chicken buses“ in Guatemala, Voseo & Mate-Etikette in Argentinien, „pura vida“ in Costa Rica oder casas particulares in Kuba.",
        "Das gewählte Land ist mit der Länderkunde verknüpft: einmal auswählen, überall passend.",
      ],
      itemsEn: [
        "🧭 New section under Discover: “Travel etiquette” with dos & don'ts for behaviour while travelling – hostel & dorm, bus & transport, groups & people, and culture & etiquette.",
        "Practical rules of thumb: quiet hours in the dorm, light/noise, valuables on the bus, how to approach people while travelling, tipping and greetings.",
        "Country-specific notes (“accents”) for all 19 countries – e.g. “chicken buses” in Guatemala, voseo & mate etiquette in Argentina, “pura vida” in Costa Rica or casas particulares in Cuba.",
        "The selected country is linked to the country guide: choose once, and it fits everywhere.",
      ],
    },
    {
      version: "1.9.0",
      date: "2026-06-12",
      title: "Einkaufszettel: interaktiv für Supermarkt, Kleidung & Farmacia",
      titleEn: "Shopping list: interactive for supermarket, clothing & farmacia",
      items: [
        "🛒 Neu unter Entdecken: „Einkaufszettel“ – dein Reisebedarf auf Spanisch in drei Rubriken (Supermercado, Ropa, Farmacia).",
        "Tippe an, was du brauchst: Wort, Aussprache und Reisetipp erscheinen, das Wort wird vorgelesen und auf dem Zettel abgehakt (bleibt gemerkt).",
        "Danach prüfst du dich im kurzen Quiz: „Du brauchst …“ → das passende spanische Wort wählen, mit Auswertung.",
        "LatAm-korrekt: curitas, medias, lentes de sol, repelente & Co. – plus Klassiker wie Klopapier, Sonnencreme und „algo para la diarrea“.",
      ],
      itemsEn: [
        "🛒 New under Discover: “Shopping list” – your travel essentials in Spanish in three categories (Supermercado, Ropa, Farmacia).",
        "Tap what you need: the word, pronunciation and travel tip appear, the word is read aloud and ticked off on the list (and remembered).",
        "Then you test yourself in a short quiz: “You need …” → choose the matching Spanish word, with scoring.",
        "Latin-America-correct: curitas, medias, lentes de sol, repelente & co. – plus classics like toilet paper, sunscreen and “algo para la diarrea”.",
      ],
    },
    {
      version: "1.8.0",
      date: "2026-06-12",
      title: "Zeiten: neuer Bereich + große Erklärseite",
      titleEn: "Tenses: new section + big explanation page",
      items: [
        "Neuer Lernbereich „⏳ Zeiten“ mit 66 Karten: echte Reisesätze in Vergangenheit, Gegenwart und Zukunft (Llegué ayer, Ya he comido, Voy a tomar el bus, Llegaré mañana …), dazu die Verlaufsform (Estoy comiendo), Imperativ-Bitten (Dígame, Tráigame la cuenta), „es gibt“ (¿Hay wifi?) und höfliche Bitten (Querría, ¿Podría?).",
        "Neu unter Entdecken: „Tiempos“ erklärt ausführlich und durchweg reisebezogen, wie die spanischen Zeitformen funktionieren – ein Verb (tomar) wandert durch alle Zeiten; jede Zeitform mit Bildungs-Rezept, Signalwörtern und mehreren Reise-Beispielen. Dazu die Verlaufsform (estar + Gerundio), der Vergleich Indefinido vs. Imperfecto, die häufigsten unregelmäßigen Vergangenheiten und Partizipien, der Imperativ, „hay/había/habrá“, eine Situations-Zuordnung, häufige Stolperfallen und drei Reisedialoge. Von dort geht es mit „Jetzt üben“ direkt in die Karten.",
        "LatAm-tauglich: Fokus auf indefinido fürs Erzählen und „ir a + Infinitiv“ als einfacher Zukunfts-Trick.",
        "Neuer Ruta-Pass-Stempel „Maestro del Tiempo“ für 80 % gemeisterte Zeiten-Karten.",
      ],
      itemsEn: [
        "New learning section “⏳ Tenses” with 66 cards: real travel sentences in the past, present and future (Llegué ayer, Ya he comido, Voy a tomar el bus, Llegaré mañana …), plus the continuous form (Estoy comiendo), imperative requests (Dígame, Tráigame la cuenta), “there is” (¿Hay wifi?) and polite requests (Querría, ¿Podría?).",
        "New under Discover: “Tiempos” explains in detail and throughout in a travel context how the Spanish tenses work – one verb (tomar) travels through all tenses; each tense with a how-to recipe, signal words and several travel examples. Plus the continuous form (estar + Gerundio), the comparison Indefinido vs. Imperfecto, the most common irregular pasts and participles, the imperative, “hay/había/habrá”, a situation-matching exercise, common pitfalls and three travel dialogues. From there “Practise now” takes you straight into the cards.",
        "Latin-America-ready: a focus on the indefinido for storytelling and “ir a + infinitive” as an easy future trick.",
        "New Ruta-pass stamp “Maestro del Tiempo” for 80% mastered tense cards.",
      ],
    },
    {
      version: "1.7.0",
      date: "2026-06-12",
      title: "Frases flexibles: Themen & viel mehr Sätze",
      titleEn: "Frases flexibles: topics & many more sentences",
      items: [
        "🧱 Frases flexibles deutlich ausgebaut: 49 Satzrahmen (statt 8) in 7 Reise-Themen – En la ruta, En el hostal, Comida y bebida, Compras y dinero, Salud y emergencias, Conocer gente und Orientarse.",
        "Neue Themen-Auswahl vor der Runde (wie bei Definiciones): wähle eine Situation – oder „🎲 Gemischt“ für alle Sätze quer durch.",
        "Neuer Ruta-Pass-Stempel „🏛️ Constructor experto“: schließe jedes Thema mindestens einmal ab.",
      ],
      itemsEn: [
        "🧱 Frases flexibles greatly expanded: 49 sentence frames (instead of 8) in 7 travel topics – En la ruta, En el hostal, Comida y bebida, Compras y dinero, Salud y emergencias, Conocer gente and Orientarse.",
        "New topic selection before the round (like in Definiciones): choose a situation – or “🎲 Mixed” for all sentences across the board.",
        "New Ruta-pass stamp “🏛️ Constructor experto”: complete every topic at least once.",
      ],
    },
    {
      version: "1.6.0",
      date: "2026-06-12",
      title: "Konjugieren: neuer Bereich + Erklärseite",
      titleEn: "Conjugating: new section + explanation page",
      items: [
        "Neuer Lernbereich „🔁 Konjugieren“ mit 42 Karten: die Präsens-Formen der wichtigsten Reiseverben (ir, estar, ser, tener, poder, querer, seguir, doblar …) – genau das, was man z. B. für Wegbeschreibungen braucht.",
        "Neu unter Entdecken: „Conjugación“ erklärt kurz und reisetauglich, wie spanische Verben gebeugt werden – Personen, die drei regelmäßigen Muster (-ar/-er/-ir), die wichtigsten unregelmäßigen Verben und ein Wegbeschreibungs-Dialog. Von dort geht es mit „Jetzt üben“ direkt in die neuen Karten.",
        "LatAm-korrekt: Tabellen mit ustedes statt vosotros.",
        "Neuer Ruta-Pass-Stempel „Verbo-Virtuose“ für 80 % gemeisterte Konjugieren-Karten.",
      ],
      itemsEn: [
        "New learning section “🔁 Conjugating” with 42 cards: the present-tense forms of the most important travel verbs (ir, estar, ser, tener, poder, querer, seguir, doblar …) – exactly what you need for directions, for example.",
        "New under Discover: “Conjugación” briefly and travel-readily explains how Spanish verbs are conjugated – persons, the three regular patterns (-ar/-er/-ir), the most important irregular verbs and a directions dialogue. From there “Practise now” takes you straight into the new cards.",
        "Latin-America-correct: tables with ustedes instead of vosotros.",
        "New Ruta-pass stamp “Verbo-Virtuose” for 80% mastered conjugation cards.",
      ],
    },
    {
      version: "1.5.0",
      date: "2026-06-12",
      title: "Hören, Spickzettel, Precios, Satzbaukasten & Ruta del día",
      titleEn: "Listening, cheat sheet, Precios, sentence builder & Ruta del día",
      items: [
        "👂 Neuer Lernmodus „Hören“: Die App spricht die spanische Antwort vor, du tippst, was du hörst – trainiert das Verstehen von echtem LatAm-Spanisch (nur wenn dein Gerät Sprachausgabe kann).",
        "🆘 Spickzettel: Die wichtigsten Sätze (Notfall, Grundlagen, Wegbeschreibung, Geld) sofort groß und vorgelesen – schnell nachschlagen, ohne zu lernen.",
        "💵 Precios al oído: Hör einen Preis auf Spanisch und tippe die Zahl – Übung fürs Verstehen gesprochener Beträge am Busbahnhof.",
        "🧱 Frases flexibles: Satzbaukasten – fülle die Lücke im Satzrahmen mit dem passenden Baustein.",
        "🗺️ Ruta del día: ein Tap für eine kurze Tagesrunde quer durch alle Themen – plus eine Streckenkarte deines Fortschritts in der Statistik.",
      ],
      itemsEn: [
        "👂 New learning mode “Listening”: the app speaks the Spanish answer aloud, you type what you hear – training your understanding of real Latin American Spanish (only if your device can do speech output).",
        "🆘 Cheat sheet: the most important phrases (emergency, basics, directions, money) instantly big and read aloud – look things up quickly, without studying.",
        "💵 Precios al oído: hear a price in Spanish and type the number – practice for understanding spoken amounts at the bus station.",
        "🧱 Frases flexibles: a sentence builder – fill the gap in the sentence frame with the matching building block.",
        "🗺️ Ruta del día: one tap for a short daily round across all topics – plus a route map of your progress in the statistics.",
      ],
    },
    {
      version: "1.4.3",
      date: "2026-06-12",
      title: "Battle: fairer, mehr Inhalt, Stichrunde",
      titleEn: "Battle: fairer, more content, tiebreaker",
      items: [
        "15 neue Battle-Aufgaben (jetzt 45) und jede Aufgabe hat eine Schwierigkeits-Stufe (A1/A2/B1), die während der Runde angezeigt wird.",
        "Faire Verteilung: A und B bekommen pro Runden-Paar etwa gleich schwere Aufgaben, und die Schwierigkeit steigert sich über das Battle.",
        "Keine sofortigen Wiederholungen mehr: zuletzt gespielte Aufgaben werden über mehrere Battles gemieden.",
        "Optionale Spielernamen – sie erscheinen im Punktestand, am Zug und in der Auswertung.",
        "Stichrunde bei Gleichstand: zwei Extra-Runden küren doch noch einen Sieger.",
        "Die Szenen-Auswahl zeigt jetzt die echte Rundenzahl der gewählten Länge statt nur der Aufgabenzahl.",
      ],
      itemsEn: [
        "15 new battle tasks (now 45) and each task has a difficulty level (A1/A2/B1) shown during the round.",
        "Fair distribution: A and B get roughly equally hard tasks per round pair, and the difficulty ramps up over the battle.",
        "No more immediate repeats: recently played tasks are avoided across several battles.",
        "Optional player names – they appear in the score, on each turn and in the results.",
        "Tiebreaker on a draw: two extra rounds still crown a winner.",
        "The scene selection now shows the real number of rounds for the chosen length instead of just the task count.",
      ],
    },
    {
      version: "1.4.2",
      date: "2026-06-12",
      title: "Battle klarer erklärt",
      titleEn: "Battle explained more clearly",
      items: [
        "Hostel Battle: Vor dem Start steht jetzt ein kurzer „So läuft ein Battle“-Ablauf in vier Schritten (zu zweit, antworten, bewerten, abwechseln) – aufklappbar und beim ersten Mal offen. Damit ist sofort klar, dass man zu zweit spielt, das Handy reihum weitergibt und der Mitspieler mit ✅/😬/❌ bewertet.",
      ],
      itemsEn: [
        "Hostel Battle: before the start there’s now a short “How a battle works” rundown in four steps (in pairs, answer, rate, take turns) – expandable and open the first time. This makes it immediately clear that you play in pairs, pass the phone around and your partner rates with ✅/😬/❌.",
      ],
    },
    {
      version: "1.4.1",
      date: "2026-06-12",
      title: "Modus klarer benannt",
      titleEn: "Mode named more clearly",
      items: [
        "„Sprechen“ heißt jetzt „🃏 Karteikarte“ – ehrlicher, denn hier gibt es keine Prüfung: du denkst oder sagst die Antwort, drehst um und bewertest dich selbst (wie eine echte Karteikarte). Geprüft wird nur im Modus „Schreiben“.",
      ],
      itemsEn: [
        "“Speaking” is now called “🃏 Flashcard” – more honest, because there’s no checking here: you think or say the answer, flip the card and rate yourself (like a real flashcard). Checking only happens in “Writing” mode.",
      ],
    },
    {
      version: "1.4.0",
      date: "2026-06-12",
      title: "Update-Hinweis",
      titleEn: "Update notice",
      items: [
        "Neu: Nach einem Update zeigt HolaRuta beim nächsten Öffnen kurz, was sich geändert hat – und wie du immer die neueste Version bekommst.",
      ],
      itemsEn: [
        "New: after an update, HolaRuta briefly shows what changed the next time you open it – and how to always get the latest version.",
      ],
    },
    {
      version: "1.3.0",
      date: "2026-06-11",
      title: "Hostel Mode, Quiz & Farben",
      titleEn: "Hostel Mode, quiz & colours",
      items: [
        "Hostel Mode: Battle & Rollenspiele zum Üben zu zweit.",
        "Definiciones: neues Zuordnen-Quiz.",
        "Farben mit echtem Farbfeld und 576 Karten in 20 Bereichen.",
      ],
      itemsEn: [
        "Hostel Mode: battle & role-plays to practise in pairs.",
        "Definiciones: a new matching quiz.",
        "Colours with a real colour swatch and 576 cards in 20 sections.",
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
