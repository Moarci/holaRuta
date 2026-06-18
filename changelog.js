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
      version: "1.93.0",
      date: "2026-06-17",
      title: "Modo profe: Bundles – ein Link, mehrere Aufgaben",
      titleEn: "Teacher mode: bundles – one link, several tasks",
      items: [
        "📦 Neu im Lehrer-/Reiseleiter-Modus: Bundles. Statt für eine Reisevorbereitung mehrere Links einzeln zu bauen, stellst du jetzt mehrere Ziele zu EINEM teilbaren Link zusammen – ein Antippen abonniert bei den Lernenden alle Aufgaben auf einmal (sie laufen wie gewohnt parallel).",
        "🎯 Fertige Vorlagen in vier Gruppen: „Reiseziel-Komplett“ (Plan + Pre-Arrival + Notfall & Geld – automatisch für ALLE Reiseziele, aktuell 33), „Kurs & Lehrplan“ (Wochen 1–3 + Grammatik-Block), „Alltags-Situationen“ (Restaurant, Markt, Unterwegs, Unterkunft, Ausgehen, Strand) und „Sicherheit & Orga“ (Survival-Set, Gesundheit, Ankommen). Mehrere Bundles UND einzelne Ziele lassen sich frei kombinieren (nochmal tippen entfernt ein Bundle wieder) – oder komplett eigene Bundles per Mehrfachauswahl bauen.",
        "🔗 Bundle-Codes (HRB1.…) funktionieren über denselben Link/Code-Weg wie Einzelaufgaben – Einfügen, Eingabefeld und geteilte Links erkennen beides automatisch. Eine Auswahl = weiterhin eine einzelne Aufgabe (abwärtskompatibel).",
      ],
      itemsEn: [
        "📦 New in teacher / tour-guide mode: bundles. Instead of building several links one by one for a trip prep, you now combine multiple targets into ONE shareable link – a single tap subscribes learners to all tasks at once (they run in parallel as usual).",
        "🎯 Ready-made templates in four groups: “Destination complete” (plan + pre-arrival + emergency & money – generated for EVERY destination, currently 33), “Course & syllabus” (weeks 1–3 + a grammar block), “Everyday situations” (restaurant, market, transport, accommodation, going out, beach) and “Safety & admin” (survival kit, health, arrival). Multiple bundles AND individual targets combine freely (tap again to remove a bundle) – or build entirely custom bundles via multi-select.",
        "🔗 Bundle codes (HRB1.…) work over the same link/code path as single tasks – pasting, the input field and shared links detect both automatically. A single selection still creates one individual task (backward compatible).",
      ],
    },
    {
      version: "1.92.0",
      date: "2026-06-17",
      title: "Modo profe: Ziel-Auswahl als erklärtes Modal statt Dropdown",
      titleEn: "Teacher mode: target selection as an explained modal, not a dropdown",
      items: [
        "🎯 Im Lehrer-/Reiseleiter-Modus (und im Aktivitätsblatt) lief die Ziel-Auswahl bisher über ein nüchternes System-Dropdown – auf dem Handy eine endlose Radiobutton-Liste ohne jede Erklärung. Jetzt öffnet ein Tipp auf das Ziel-Feld ein aufgeräumtes Modal: die drei Gruppen „Pre-Trip-Pläne“, „Pre-Arrival-Pakete“ und „Ganzes Paket (üben)“ stehen klar getrennt, jede mit einer kurzen Erklärung, WAS sie ist und WANN du sie als Lehrkraft/Reiseleitung wählen solltest. Die aktuelle Auswahl wird direkt im Feld angezeigt, ein Häkchen markiert das gewählte Ziel.",
      ],
      itemsEn: [
        "🎯 In teacher / tour-guide mode (and on the activity sheet) the target selection used to be a plain system dropdown – on a phone an endless radio-button list with no explanation at all. Now tapping the target field opens a tidy modal: the three groups “Pre-trip plans”, “Pre-arrival packs” and “Whole pack (practice)” are clearly separated, each with a short note on WHAT it is and WHEN you should pick it as a teacher/guide. The current choice shows right in the field, and a checkmark marks the selected target.",
      ],
    },
    {
      version: "1.91.0",
      date: "2026-06-17",
      title: "Bebidas AM/PM: Tag- und Abendgetränk pro Land",
      titleEn: "Bebidas AM/PM: morning and evening drink per country",
      items: [
        "☕ Neu im Entdecken-Reiter: „Bebidas AM/PM“. Ein doppelseitiges Emaille-Schild zeigt fürs gewählte Reiseland das typische Morgengetränk (AM) und Abendgetränk (PM) – von Café de olla & Mezcal in México über Mate & Malbec in Argentinien bis Tereré & Caña in Paraguay. Tippen schaltet um: Dampf steigt nur morgens, das Glas füllt sich erst abends. Das Land kommt aus derselben Auswahl wie die Länderkunde – per Dropdown direkt wechselbar. Alle 19 Länder abgedeckt.",
      ],
      itemsEn: [
        "☕ New in the Discover tab: “Bebidas AM/PM”. A double-sided enamel sign shows the typical morning drink (AM) and evening drink (PM) for your chosen country – from Café de olla & Mezcal in Mexico through Mate & Malbec in Argentina to Tereré & Caña in Paraguay. Tap to switch: steam only rises in the morning, the glass fills up only in the evening. The country comes from the same picker as the country guide – switch it right from the dropdown. All 19 countries covered.",
      ],
    },
    {
      version: "1.90.1",
      date: "2026-06-17",
      title: "„Dein Fortschritt“: echte Lern-Verteilung statt leerem Balken",
      titleEn: "“Your progress”: real learning split instead of an empty bar",
      items: [
        "📊 Der Fortschritts-Überblick (Start- und Profil-Reiter) zeigte nur die „gemeistert“-Quote – eine Karte gilt erst ab einem Wiederhol-Abstand von 7+ Tagen als gemeistert. Wer gerade erst losgelegt hat, sah deshalb „0 von … · 0 %“ mit leerem Balken, obwohl längst Karten gelernt waren – das wirkte wie ein Fehler. Jetzt zeigt ein gestapelter Balken mit Legende die echte Verteilung: gemeistert / am Lernen / neu.",
      ],
      itemsEn: [
        "📊 The progress overview (Home and Profile tabs) only showed the “mastered” share – a card counts as mastered once it isn’t due again for 7+ days. So anyone who had just started saw “0 of … · 0 %” with an empty bar even after learning plenty of cards, which looked broken. A stacked bar with a legend now shows the real split: mastered / learning / new.",
      ],
    },
    {
      version: "1.90.0",
      date: "2026-06-17",
      title: "Neuer „Start“-Reiter: Dashboard aufgeräumt, Themen mit Sprungmarken",
      titleEn: "New “Home” tab: tidier dashboard, topics with quick-jumps",
      items: [
        "🏠 Die Startseite ist jetzt ein eigener „Start“-Reiter und zeigt fokussiert das Wichtigste für heute: deine Serie, den Haupt-Knopf zum Loslegen, „Weiter mit …“, die Ruta del día – und einen eigenen Abschnitt „Für deine Reise“ (Countdown + Pre-Arrival-Pakete), der nur bei passendem Ziel erscheint. Dazu ein kurzer Fortschritts-Überblick.",
        "🎒 Der „Lernen“-Reiter zeigt nur noch die Themen – mit einer klebrigen Sprungmarken-Leiste pro Themen-Gruppe (Grundlagen, Grammatik, Leute & Alltag, Essen & Einkaufen, Unterwegs, Reiseziele): ein Tipp springt direkt hin, die aktuelle Gruppe wird beim Scrollen hervorgehoben. Kein endloses Scrollen mehr.",
        "↩️ Die Zurück-Geste führt jetzt aus „Lernen“, „Entdecken“ oder „Profil“ erst zurück auf „Start“ und schließt die App erst von dort – stufenweise statt mit einem Wisch hinaus.",
      ],
      itemsEn: [
        "🏠 The home screen is now its own “Home” tab, focused on what matters today: your streak, the main start button, “Carry on with …”, the Ruta del día – plus a dedicated “For your trip” section (countdown + pre-arrival packs) that only appears when a destination fits. Topped off with a short progress overview.",
        "🎒 The “Learn” tab now shows just the topics – with a sticky quick-jump bar per topic group (Basics, Grammar, People & everyday, Food & shopping, Getting around, Destinations): one tap jumps straight there and the current group is highlighted as you scroll. No more endless scrolling.",
        "↩️ The back gesture now takes you from “Learn”, “Discover” or “Profile” back to “Home” first, and only leaves the app from there – step by step instead of one swipe out.",
      ],
    },
    {
      version: "1.89.0",
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
      version: "1.88.0",
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
      version: "1.87.0",
      date: "2026-06-17",
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
      version: "1.86.0",
      date: "2026-06-16",
      title: "Tiempos: der einfache Vergangenheits-Trick",
      titleEn: "Tiempos: the simple past-tense trick",
      items: [
        "🪄 Die Zeiten-Erklärseite (Tiempos) hat jetzt ganz oben einen eigenen „Vergangenheits-Trick“: he + Partizip – das genaue Gegenstück zum Zukunfts-Trick „voy a + Infinitiv“. Du beugst nur das kleine haber, das Hauptverb bleibt fest – damit redest du fast jedes Verb in der Vergangenheit los, lange bevor du alle Endungen kannst.",
        "🇩🇪🇬🇧 Mit Mini-Vergleich (Zukunft ↔ Vergangenheit), Formen, Bildungs-Rezept, Reise-Beispielen und einem ehrlichen Hinweis zum LatAm-Indefinido – auf Deutsch und Englisch.",
        "🛠️ Außerdem behoben: Die Tiempos-Seite öffnete sich seit der Sprachumstellung gar nicht mehr (ein interner Fehler beim Aufbau) – sie funktioniert wieder vollständig.",
      ],
      itemsEn: [
        "🪄 The tenses explainer page (Tiempos) now has its own “past-tense trick” right at the top: he + Partizip – the exact counterpart to the future trick “voy a + Infinitiv”. You only conjugate the little haber, the main verb stays fixed – so you can talk about almost any verb in the past long before you know all the endings.",
        "🇩🇪🇬🇧 With a mini comparison (future ↔ past), forms, a formation recipe, travel examples and an honest note on the LatAm Indefinido – in German and English.",
        "🛠️ Also fixed: since the language switch the Tiempos page no longer opened at all (an internal error while building it) – it works fully again.",
      ],
    },
    {
      version: "1.85.0",
      date: "2026-06-16",
      title: "Diálogos: Hintergrund zu „Besser so“",
      titleEn: "Diálogos: background on “Better like this”",
      items: [
        "💡 Wenn in den Diálogos beim „Besser so“ die Musterantwort gezeigt wird, gibt es jetzt zu jeder Antwort einen kurzen Hintergrund – warum sie so lautet (Grammatik, Wortschatz oder Höflichkeit). Er sitzt direkt darunter und lässt sich zum Lesen aufklappen.",
        "🇩🇪🇬🇧 Die Erklärungen sind auf Deutsch und Englisch verfügbar und stören nicht beim schnellen Weiterspielen – aufklappen nur, wenn du magst.",
      ],
      itemsEn: [
        "💡 When the model answer is shown in the Diálogos under “Better like this”, there is now a short background for each answer – why it reads the way it does (grammar, vocabulary or politeness). It sits right below and can be expanded to read.",
        "🇩🇪🇬🇧 The explanations are available in German and English and don't get in the way of quickly playing on – expand them only if you want to.",
      ],
    },
    {
      version: "1.84.0",
      date: "2026-06-16",
      title: "Drei neue Themenblöcke: Friseur & Beauty, Sport & Fitness, Arbeiten & Freiwilligenarbeit",
      titleEn: "Three new topic blocks: Hairdresser & Beauty, Sport & Fitness, Work & Volunteering",
      items: [
        "💇 Friseur & Beauty: Termin, Schnitt & Spitzen, Färben & Strähnen, Augenbrauen, Wachsen, Maniküre & Pediküre, Massage & Spa – 24 Karten.",
        "🏃 Sport & Fitness: Fitnessstudio & Tagespass, Kurse, Laufen, Fahrrad mieten, Fußballspiel, mitspielen, Umkleide & Muskelkater – 24 Karten.",
        "💼 Arbeiten & Freiwilligenarbeit: Voluntariado, Mithilfe gegen Unterkunft, Stunden & Aufgaben, Probetag, Visum, Digitalnomade & Coworking – 24 Karten.",
        "🗣️ Jede Karte mit Aussprache-Hilfe und Reise-Kontext (Beispielsatz, Situation, Tipp – DE & EN); einsortiert in Unterwegs bzw. Menschen.",
      ],
      itemsEn: [
        "💇 Hairdresser & Beauty: appointment, cut & ends, coloring & highlights, eyebrows, waxing, manicure & pedicure, massage & spa – 24 cards.",
        "🏃 Sport & Fitness: gym & day pass, classes, running, renting a bike, a football match, joining in, locker room & sore muscles – 24 cards.",
        "💼 Work & Volunteering: Voluntariado, helping out in exchange for accommodation, hours & tasks, a trial day, visa, digital nomad & coworking – 24 cards.",
        "🗣️ Each card with pronunciation help and travel context (example sentence, situation, tip – DE & EN); filed under Out and about or People respectively.",
      ],
    },
    {
      version: "1.83.0",
      date: "2026-06-16",
      title: "Vier neue Themenblöcke: Geldautomat & Bank, Post & Versand, Kinder & Familie, Vegetarisch & Allergien",
      titleEn: "Four new topic blocks: ATM & Bank, Post & Shipping, Kids & Family, Vegetarian & Allergies",
      items: [
        "🏧 Geldautomat & Bank: Geld abheben, Gebühren, Karte gesperrt/eingezogen, Geld wechseln, Wechselkurs, kleine Scheine – 24 Karten.",
        "📮 Post & Versand: Paket & Postkarte schicken, Briefmarken, Porto nach Europa, Laufzeit, Zoll & Inhalt, Sendungsverfolgung – 24 Karten.",
        "👨‍👩‍👧‍👦 Kinder & Familie: mit Kindern reisen, Familienzimmer & Extrabett, Kinderstuhl, Kindermenü, Windeln, Ermäßigung – 24 Karten.",
        "🥗 Vegetarisch & Allergien: vegetarisch/vegan, ohne Fleisch, Allergie gegen …, glutenfrei, laktosefrei, Zutaten, nicht scharf – 24 Karten.",
        "🗣️ Jede Karte mit Aussprache-Hilfe und Reise-Kontext (Beispielsatz, Situation, Tipp – DE & EN); einsortiert in Essen & Geld, Unterwegs bzw. Menschen.",
      ],
      itemsEn: [
        "🏧 ATM & Bank: withdrawing money, fees, card blocked/swallowed, changing money, exchange rate, small notes – 24 cards.",
        "📮 Post & Shipping: sending a parcel & postcard, stamps, postage to Europe, delivery time, customs & contents, tracking – 24 cards.",
        "👨‍👩‍👧‍👦 Kids & Family: traveling with kids, family room & extra bed, high chair, kids' menu, diapers, discount – 24 cards.",
        "🥗 Vegetarian & Allergies: vegetarian/vegan, without meat, allergic to …, gluten-free, lactose-free, ingredients, not spicy – 24 cards.",
        "🗣️ Each card with pronunciation help and travel context (example sentence, situation, tip – DE & EN); filed under Food & Money, Out and about or People respectively.",
      ],
    },
    {
      version: "1.82.0",
      date: "2026-06-16",
      title: "Vier neue Themenblöcke: Strand & Wassersport, Nachtleben, Wetter, Mietwagen",
      titleEn: "Four new topic blocks: Beach & Water Sports, Nightlife, Weather, Rental Car",
      items: [
        "🏖️ Strand & Wassersport: schwimmen, Strömung & rote Flagge, Surfen, Schnorcheln, Boot, Sonnenschutz, Ausrüstung leihen – 24 Karten.",
        "🎉 Nachtleben: Bar & Club, Eintritt, Drinks bestellen, tanzen, die Rechnung, sicher mit dem Taxi heim – 24 Karten.",
        "🌦️ Wetter: heute Wetter, Regen & Regenzeit, Temperatur, Wind & Sturm, beste Reisezeit, Jacke nötig? – 24 Karten.",
        "🚗 Mietwagen: Auto mieten, Versicherung, Tankstelle, Kaution, Maut, Parken, Reifenpanne, Polizeikontrolle – 24 Karten.",
        "🗣️ Jede Karte mit Aussprache-Hilfe und Reise-Kontext (Beispielsatz, Situation, Tipp – DE & EN); einsortiert in Unterwegs, Menschen bzw. Grundlagen.",
      ],
      itemsEn: [
        "🏖️ Beach & Water Sports: swimming, current & red flag, surfing, snorkeling, boat, sun protection, renting gear – 24 cards.",
        "🎉 Nightlife: bar & club, entry, ordering drinks, dancing, the bill, getting home safely by taxi – 24 cards.",
        "🌦️ Weather: today's weather, rain & rainy season, temperature, wind & storm, best time to travel, do I need a jacket? – 24 cards.",
        "🚗 Rental Car: renting a car, insurance, gas station, deposit, toll, parking, flat tire, police check – 24 cards.",
        "🗣️ Each card with pronunciation help and travel context (example sentence, situation, tip – DE & EN); filed under Out and about, People or Basics respectively.",
      ],
    },
    {
      version: "1.81.0",
      date: "2026-06-16",
      title: "Vier neue Themenblöcke: Apotheke & Arzt, Touren & Outdoor, SIM & Internet, Wäsche & Services",
      titleEn: "Four new topic blocks: Pharmacy & Doctor, Tours & Outdoor, SIM & Internet, Laundry & Services",
      items: [
        "🩺 Apotheke & Arzt: Apotheke, rezeptfreie Medikamente, Magen/Durchfall, Höhenkrankheit, Symptome, Rezept & Versicherung – 24 Karten.",
        "🥾 Touren & Outdoor: Touren buchen, Inklusivleistungen, Abholung, Schwierigkeit, Wandern, Tauchen, Ausrüstung mieten, Treffpunkt – 24 Karten.",
        "📱 SIM & Internet: SIM/Chip kaufen, Datenpaket, Aufladen (recarga), WLAN-Passwort, Empfang, Hotspot, Akku laden – 24 Karten.",
        "🧺 Wäsche & Services: Lavandería pro Kilo, wann fertig, Reinigung, Friseur, Schuster, Schlüsseldienst, Gepäckaufbewahrung – 24 Karten.",
        "🗣️ Jede Karte mit Aussprache-Hilfe und Reise-Kontext (Beispielsatz, Situation, Tipp – DE & EN); einsortiert in die Gruppe „Unterwegs“.",
      ],
      itemsEn: [
        "🩺 Pharmacy & Doctor: pharmacy, over-the-counter medication, stomach/diarrhea, altitude sickness, symptoms, prescription & insurance – 24 cards.",
        "🥾 Tours & Outdoor: booking tours, what's included, pickup, difficulty, hiking, diving, renting gear, meeting point – 24 cards.",
        "📱 SIM & Internet: buying a SIM/chip, data package, topping up (recarga), Wi-Fi password, signal, hotspot, charging the battery – 24 cards.",
        "🧺 Laundry & Services: Lavandería by the kilo, when it's ready, dry cleaning, hairdresser, shoe repair, locksmith, luggage storage – 24 cards.",
        "🗣️ Each card with pronunciation help and travel context (example sentence, situation, tip – DE & EN); filed under the “Out and about” group.",
      ],
    },
    {
      version: "1.80.0",
      date: "2026-06-16",
      title: "Vier neue Stadt-Packs: Torres del Paine, Pucón, Copacabana & Sucre",
      titleEn: "Four new city packs: Torres del Paine, Pucón, Copacabana & Sucre",
      items: [
        "🏕️ Torres del Paine / Puerto Natales (Chile): W-Trek & O-Circuit, Refugios, CONAF, Wind & Wetter, Guanacos – 32 Karten.",
        "🌋 Pucón (Chile): Vulkan Villarrica, Thermalquellen, Huerquehue, Rafting am Trancura, Mapuche-Kultur – 32 Karten.",
        "⛵ Copacabana & Titicacasee (Bolivien): Isla del Sol, Boote, Trucha, Cerro Calvario, Auto-Segnung, Höhe – 32 Karten.",
        "🦕 Sucre (Bolivien): weiße Kolonialstadt & Spanischschulen, Plaza 25 de Mayo, Cal Orck'o (Dino-Spuren), Tarabuco-Markt – 32 Karten.",
        "🗓️ Jede Stadt mit echtem Reise-Kontext, 7-Etappen-Pre-Trip-Plan (thematische Challenges), zuweisbarem „Pre-Arrival“-Paket und Dashboard-Kachel.",
      ],
      itemsEn: [
        "🏕️ Torres del Paine / Puerto Natales (Chile): W-Trek & O-Circuit, refugios, CONAF, wind & weather, guanacos – 32 cards.",
        "🌋 Pucón (Chile): Villarrica volcano, hot springs, Huerquehue, rafting on the Trancura, Mapuche culture – 32 cards.",
        "⛵ Copacabana & Lake Titicaca (Bolivia): Isla del Sol, boats, trucha, Cerro Calvario, car blessing, altitude – 32 cards.",
        "🦕 Sucre (Bolivia): white colonial city & Spanish schools, Plaza 25 de Mayo, Cal Orck'o (dino footprints), Tarabuco market – 32 cards.",
        "🗓️ Each city with real travel context, a 7-stage Pre-Trip plan (thematic challenges), an assignable “Pre-Arrival” package and a dashboard tile.",
      ],
    },
    {
      version: "1.79.0",
      date: "2026-06-16",
      title: "Fünf neue Stadt-Packs: Santiago, Valparaíso, Atacama, La Paz & Uyuni",
      titleEn: "Five new city packs: Santiago, Valparaíso, Atacama, La Paz & Uyuni",
      items: [
        "🏙️ Santiago & 🎨 Valparaíso (Chile): Metro/Bip!, cerros & ascensores, Streetart, Mercado Central, Completos – chilenisches Spanisch (cachái, po, bacán), je 32 Karten.",
        "🏜️ San Pedro de Atacama (Chile): Valle de la Luna, Geysire El Tatio, Sternenhimmel, Altiplano-Lagunen, Höhe & Wüste – 32 Karten.",
        "🚡 La Paz & 🧂 Uyuni (Bolivien): Teleférico, Höhe ~3.600 m+ & Coca-Tee, Hexenmarkt, Death Road, Salar de Uyuni, Zugfriedhof – 32 Karten je Stadt.",
        "🗓️ Jede Stadt mit echtem Reise-Kontext, 7-Etappen-Pre-Trip-Plan (thematisch passende Challenges), zuweisbarem „Pre-Arrival“-Paket und Dashboard-Kachel. Chile & Bolivien haben damit erstmals eigene Stadt-Packs.",
      ],
      itemsEn: [
        "🏙️ Santiago & 🎨 Valparaíso (Chile): Metro/Bip!, cerros & ascensores, street art, Mercado Central, Completos – Chilean Spanish (cachái, po, bacán), 32 cards each.",
        "🏜️ San Pedro de Atacama (Chile): Valle de la Luna, El Tatio geysers, starry sky, Altiplano lagoons, altitude & desert – 32 cards.",
        "🚡 La Paz & 🧂 Uyuni (Bolivia): Teleférico, altitude ~3,600 m+ & coca tea, witches' market, Death Road, Salar de Uyuni, train cemetery – 32 cards per city.",
        "🗓️ Each city with real travel context, a 7-stage Pre-Trip plan (thematically fitting challenges), an assignable “Pre-Arrival” package and a dashboard tile. Chile & Bolivia now have their own city packs for the first time.",
      ],
    },
    {
      version: "1.78.0",
      date: "2026-06-16",
      title: "Acht neue Stadt-Packs: Lima, Arequipa, Mendoza, Bariloche, Oaxaca, Mérida, La Fortuna & Monteverde",
      titleEn: "Eight new city packs: Lima, Arequipa, Mendoza, Bariloche, Oaxaca, Mérida, La Fortuna & Monteverde",
      items: [
        "🌊 Lima & 🏛️ Arequipa (Peru): Küche & Ceviche, Costa Verde, Colca-Canyon, Santa Catalina, Vulkane – je 32 Karten.",
        "🍷 Mendoza & 🏞️ Bariloche (Argentinien): Malbec-Bodegas, Asado, Patagonien-Seen, Circuito Chico, Schokolade – Rioplatense mit „vos“, je 32 Karten.",
        "💀 Oaxaca & 🛕 Mérida/Yucatán (Mexiko): Mole & Mezcal, Monte Albán, Cenoten, Maya-Ruinen, cochinita pibil – je 32 Karten.",
        "🌋 La Fortuna/Arenal & 🌿 Monteverde (Costa Rica): Vulkan & Thermalquellen, Nebelwald, Canopy, Hängebrücken – tico-Spanisch (pura vida), je 32 Karten.",
        "🗓️ Jede Stadt mit echtem Reise-Kontext, 7-Etappen-Pre-Trip-Plan, zuweisbarem „Pre-Arrival“-Paket und Dashboard-Kachel.",
      ],
      itemsEn: [
        "🌊 Lima & 🏛️ Arequipa (Peru): cuisine & ceviche, Costa Verde, Colca Canyon, Santa Catalina, volcanoes – 32 cards each.",
        "🍷 Mendoza & 🏞️ Bariloche (Argentina): Malbec bodegas, asado, Patagonian lakes, Circuito Chico, chocolate – Rioplatense with “vos”, 32 cards each.",
        "💀 Oaxaca & 🛕 Mérida/Yucatán (Mexico): mole & mezcal, Monte Albán, cenotes, Maya ruins, cochinita pibil – 32 cards each.",
        "🌋 La Fortuna/Arenal & 🌿 Monteverde (Costa Rica): volcano & hot springs, cloud forest, canopy, hanging bridges – tico Spanish (pura vida), 32 cards each.",
        "🗓️ Each city with real travel context, a 7-stage Pre-Trip plan, an assignable “Pre-Arrival” package and a dashboard tile.",
      ],
    },
    {
      version: "1.77.0",
      date: "2026-06-16",
      title: "Vier neue Stadt-Packs: CDMX, Antigua, Buenos Aires, Quito",
      titleEn: "Four new city packs: CDMX, Antigua, Buenos Aires, Quito",
      items: [
        "🏙️ Mexiko-Stadt (CDMX): Metro & Metrobús, Tacos al pastor, Teotihuacán, Xochimilco, Lucha Libre, Casa Azul, chilango-Slang – 34 Karten.",
        "🌋 Antigua (Guatemala): Vulkanwanderungen (Acatenango/Pacaya), Sprachschule & Gastfamilie, Atitlán-Shuttle, Chicken Bus, Markt & Kaffee – 35 Karten.",
        "💃 Buenos Aires: Rioplatense-Spanisch mit „vos“, SUBE/Subte/Colectivo, Parrilla & Asado, Mate, Tango, Porteño-Slang – 34 Karten.",
        "🏔️ Quito (Ecuador): Höhe ~2.850 m, UNESCO-Altstadt, TelefériQo, Mitad del Mundo, Otavalo & Cotopaxi, und der Hinweis: Ecuador zahlt mit US-Dollar – 34 Karten.",
        "🗓️ Jede Stadt mit echtem Reise-Kontext, einem 7-Etappen-Pre-Trip-Plan, einem zuweisbaren „Pre-Arrival“-Paket und passender Dashboard-Kachel.",
      ],
      itemsEn: [
        "🏙️ Mexico City (CDMX): Metro & Metrobús, tacos al pastor, Teotihuacán, Xochimilco, Lucha Libre, Casa Azul, chilango slang – 34 cards.",
        "🌋 Antigua (Guatemala): volcano hikes (Acatenango/Pacaya), language school & host family, Atitlán shuttle, Chicken Bus, market & coffee – 35 cards.",
        "💃 Buenos Aires: Rioplatense Spanish with “vos”, SUBE/Subte/Colectivo, Parrilla & Asado, mate, tango, Porteño slang – 34 cards.",
        "🏔️ Quito (Ecuador): altitude ~2,850 m, UNESCO old town, TelefériQo, Mitad del Mundo, Otavalo & Cotopaxi, and the note: Ecuador pays with US dollars – 34 cards.",
        "🗓️ Each city with real travel context, a 7-stage Pre-Trip plan, an assignable “Pre-Arrival” package and a matching dashboard tile.",
      ],
    },
    {
      version: "1.76.0",
      date: "2026-06-15",
      title: "Neuer Stadt-Pack: Cusco ⛰️",
      titleEn: "New city pack: Cusco ⛰️",
      items: [
        "⛰️ Neuer Cusco-Pack mit 34 reisepraktischen Karten – von Höhe & soroche (mate de coca) über Plaza de Armas, San Blas und Sacsayhuamán, das Heilige Tal und die komplette Machu-Picchu-Logistik (Zug, Bus, Tickets) bis zu Anden-Küche (cuy, chicha morada), Markt San Pedro, Quechua-Grüßen (Allillanchu, Sulpayki) und Höhen-Tagestrips (Vinicunca). Jede Karte mit echtem Reise-Kontext.",
        "🗓️ Dazu ein 7-Etappen-Pre-Trip-Plan „Cusco“ und ein zuweisbares „Pre-Arrival: Cusco“-Paket; die Dashboard-Kachel erscheint bei Cusco-Bezug.",
      ],
      itemsEn: [
        "⛰️ New Cusco pack with 34 travel-practical cards – from altitude & soroche (mate de coca) through Plaza de Armas, San Blas and Sacsayhuamán, the Sacred Valley and the complete Machu Picchu logistics (train, bus, tickets) to Andean cuisine (cuy, chicha morada), San Pedro market, Quechua greetings (Allillanchu, Sulpayki) and high-altitude day trips (Vinicunca). Each card with real travel context.",
        "🗓️ Plus a 7-stage Pre-Trip plan “Cusco” and an assignable “Pre-Arrival: Cusco” package; the dashboard tile appears when Cusco is relevant.",
      ],
    },
    {
      version: "1.75.0",
      date: "2026-06-15",
      title: "Neuer Stadt-Pack: Medellín 🌆",
      titleEn: "New city pack: Medellín 🌆",
      items: [
        "🌆 Neuer Medellín-Pack mit 34 reisepraktischen Karten – vom Flughafen über Metro & Metrocable, die Viertel (El Poblado, Laureles, Comuna 13) und Paisa-Kultur/-Sprache (parce, pues, „¿Bien o qué?“) bis zu Paisa-Küche (bandeja paisa, tinto), Tagestrips (Guatapé, El Peñol) und Alltag/Sicherheit (Nequi, „no dar papaya“). Jede Karte mit echtem Reise-Kontext.",
        "🗓️ Dazu ein 7-Etappen-Pre-Trip-Plan „Medellín“ und ein zuweisbares „Pre-Arrival: Medellín“-Paket; die Dashboard-Kachel erscheint bei Medellín-Bezug.",
        "✍️ Nach Review: „tinto bestellen“ kolumbianischer formuliert („¿Me regala…?“), Reggaetón-Hinweis entschärft und ein Niveau korrigiert.",
      ],
      itemsEn: [
        "🌆 New Medellín pack with 34 travel-practical cards – from the airport through Metro & Metrocable, the neighborhoods (El Poblado, Laureles, Comuna 13) and Paisa culture/language (parce, pues, “¿Bien o qué?”) to Paisa cuisine (bandeja paisa, tinto), day trips (Guatapé, El Peñol) and everyday life/safety (Nequi, “no dar papaya”). Each card with real travel context.",
        "🗓️ Plus a 7-stage Pre-Trip plan “Medellín” and an assignable “Pre-Arrival: Medellín” package; the dashboard tile appears when Medellín is relevant.",
        "✍️ After review: “ordering a tinto” phrased more Colombian (“¿Me regala…?”), the reggaetón note toned down and one level corrected.",
      ],
    },
    {
      version: "1.74.0",
      date: "2026-06-15",
      title: "Aktivitätsblatt: Review-Feinschliff",
      titleEn: "Activity sheet: review polish",
      items: [
        "🖨️ Beim Drucken werden schwebende Hinweise (Toasts, Update-Banner) jetzt zuverlässig ausgeblendet – sie landen nicht mehr auf dem PDF.",
        "📝 Das Blatt hat jetzt einen Aussprache-Hinweis (Karte in der App antippen) und eine Notizfläche für die Leitung; klarere Überschriften.",
      ],
      itemsEn: [
        "🖨️ When printing, floating notices (toasts, update banners) are now reliably hidden – they no longer end up on the PDF.",
        "📝 The sheet now has a pronunciation note (tap the card in the app) and a notes area for the leader; clearer headings.",
      ],
    },
    {
      version: "1.73.0",
      date: "2026-06-15",
      title: "Druckbares Aktivitätsblatt für Lehrkraft & Reiseleitung 📄",
      titleEn: "Printable activity sheet for teachers & tour leaders 📄",
      items: [
        "📄 Neu im Modo profe: „Aktivitätsblatt erstellen“ – ein druckfertiges Unterrichts-/Aktivitätsblatt zu jedem Ziel (Pre-Trip-Plan, Pre-Arrival-Paket oder Kategorie), wahlweise das ganze Ziel oder eine einzelne Etappe.",
        "🖨️ Das Blatt enthält Lernziel, Stundenrezept (Lernen → Kontext → Rollenspiel → Real-Life Challenge), den Wortschatz mit Reisetipps je Karte, die passende Real-Life Challenge sowie den Aufgaben-Code + Link zum Selbst-Abonnieren. Über „Drucken“ als PDF speicherbar.",
      ],
      itemsEn: [
        "📄 New in Modo profe: “Create activity sheet” – a print-ready lesson/activity sheet for any destination (Pre-Trip plan, Pre-Arrival package or category), either the whole destination or a single stage.",
        "🖨️ The sheet contains the learning objective, lesson recipe (Learn → Context → Role-play → Real-Life Challenge), the vocabulary with travel tips per card, the matching Real-Life Challenge plus the task code + link to subscribe yourself. Can be saved as a PDF via “Print”.",
      ],
    },
    {
      version: "1.72.0",
      date: "2026-06-15",
      title: "Cartagena-Pack: Review-Feinschliff & Dashboard-Kachel",
      titleEn: "Cartagena pack: review polish & dashboard tile",
      items: [
        "🏖️ Zwei Karten ergänzt: Eintritt zum Castillo San Felipe (das Wahrzeichen) und „Nehmen Sie Karte oder nur Bargeld?“ – jetzt 34 Cartagena-Karten.",
        "🏠 Die „Pre-Arrival Cartagena“-Kachel erscheint nun auf der Startseite, sobald dein Reiseziel Cartagena meint – und der Cartagena-Pre-Trip-Plan wird passend vorgeschlagen.",
        "✍️ Sprachlicher Feinschliff (Gastfamilie-Satz, Aussprache von „wifi“, Hafensteuer-Begriff) und ein Niveau korrigiert.",
        "🧪 Zwei neue Tests sichern künftig die englische Übersetzung neuer Pack-Karten und die Dashboard-Verdrahtung der Pre-Arrival-Pakete ab.",
      ],
      itemsEn: [
        "🏖️ Two cards added: entry to Castillo San Felipe (the landmark) and “Do you take card or cash only?” – now 34 Cartagena cards.",
        "🏠 The “Pre-Arrival Cartagena” tile now appears on the home page as soon as your destination means Cartagena – and the Cartagena Pre-Trip plan is suggested accordingly.",
        "✍️ Linguistic polish (host family sentence, pronunciation of “wifi”, port tax term) and one level corrected.",
        "🧪 Two new tests will safeguard the English translation of new pack cards and the dashboard wiring of the Pre-Arrival packages going forward.",
      ],
    },
    {
      version: "1.71.0",
      date: "2026-06-15",
      title: "Neuer Stadt-Pack: Cartagena 🏖️",
      titleEn: "New city pack: Cartagena 🏖️",
      items: [
        "🏖️ Neuer Cartagena-Pack mit 32 reisepraktischen Karten – vom Flughafen-Taxi nach Getsemaní über die Gastfamilie und die Altstadt bis zu lokalem Essen (arepa de huevo, menú del día), Strand, Islas del Rosario, Salsa und den Bussen nach Santa Marta/Tayrona. Jede Karte mit echtem Reise-Kontext.",
        "🗓️ Dazu ein 7-Etappen-Pre-Trip-Plan „Cartagena“ (Ankunft → Gastfamilie → Altstadt → Essen → Strand → Islas → Salsa & Tagestrips) und ein zuweisbares „Pre-Arrival: Cartagena“-Paket.",
        "🧑‍🏫 Lehrkraft/Reiseleitung können Cartagena – Plan, Pre-Arrival-Paket oder ganze Kategorie – direkt als Aufgabe zuweisen.",
      ],
      itemsEn: [
        "🏖️ New Cartagena pack with 32 travel-practical cards – from the airport taxi to Getsemaní through the host family and the old town to local food (arepa de huevo, menú del día), beach, Islas del Rosario, salsa and the buses to Santa Marta/Tayrona. Each card with real travel context.",
        "🗓️ Plus a 7-stage Pre-Trip plan “Cartagena” (arrival → host family → old town → food → beach → Islas → salsa & day trips) and an assignable “Pre-Arrival: Cartagena” package.",
        "🧑‍🏫 Teachers/tour leaders can assign Cartagena – plan, Pre-Arrival package or whole category – directly as a task.",
      ],
    },
    {
      version: "1.70.0",
      date: "2026-06-15",
      title: "Politur: Paste-Hinweis & Barrierearmut",
      titleEn: "Polish: paste note & accessibility",
      items: [
        "📋 Fügst du einen Text ein, der wie ein Aufgaben-Code aussieht (HRT1.…) sich aber nicht lesen lässt, bekommst du jetzt einen kurzen Hinweis – statt dass nichts passiert. Bei normalem Text bleibt das Einfügen weiterhin still.",
        "♿ Ruta-Check: Der Fortschritt („Frage 3 von 12“) wird Screenreadern jetzt beim Weiterblättern angesagt, und die Antwort-Knöpfe sind als zusammengehörige Auswahl ausgezeichnet.",
        "♿ Pre-Trip: Ein zugewiesenes, festgelegtes Reiseziel wird Screenreadern klar als solches benannt.",
        "🛠️ Eine entfernte Aufgabe gilt erst dann als entfernt, wenn das Speichern wirklich geklappt hat (sonst kurzer Hinweis) – konsistent zum Hinzufügen.",
      ],
      itemsEn: [
        "📋 If you paste text that looks like a task code (HRT1.…) but can't be read, you now get a short note – instead of nothing happening. With normal text, pasting stays silent as before.",
        "♿ Ruta-Check: progress (“Question 3 of 12”) is now announced to screen readers as you advance, and the answer buttons are marked up as a group of choices that belong together.",
        "♿ Pre-Trip: an assigned, fixed destination is clearly named as such to screen readers.",
        "🛠️ A removed task counts as removed only once saving has actually worked (otherwise a short note) – consistent with adding.",
      ],
    },
    {
      version: "1.69.0",
      date: "2026-06-15",
      title: "Angefangene Aufgaben heben sich ab",
      titleEn: "Started tasks stand out",
      items: [
        "⏳ Aufgaben, die du schon begonnen hast, sind in der Tarea-Liste jetzt klar zu erkennen – mit Terrakotta-Akzent, „Angefangen“-Abzeichen und einer Fortschrittsleiste, die den Füllstand zeigt. So unterscheiden sie sich auf einen Blick von noch nicht begonnenen und von erledigten Aufgaben.",
      ],
      itemsEn: [
        "⏳ Tasks you've already begun are now clearly recognizable in the Tarea list – with a terracotta accent, a “Started” badge and a progress bar showing how full it is. So at a glance they differ from tasks not yet begun and from completed ones.",
      ],
    },
    {
      version: "1.68.0",
      date: "2026-06-15",
      title: "Aufgaben-Fortschritt sichtbar + Feinschliff (Review-Block)",
      titleEn: "Task progress visible + polish (review block)",
      items: [
        "📊 Offene Aufgaben zeigen jetzt ihren Fortschritt als „12/40 gelernt“ (bzw. „3/7 Etappen“) – in der Tarea-Liste und auf der Pre-Arrival-Kachel. So sieht man den Teilfortschritt, nicht nur erledigt/offen.",
        "💡 Unter den Aufgaben-Knöpfen erklärt jetzt ein fester Hinweis „Einfügen“ vs. „Aufgabe hinzufügen“ – statt nur als flüchtige Meldung.",
        "♿ Barrierearmut & Klarheit: „Erledigt“ wird Screenreadern angesagt, und ein Tooltip stellt klar, dass erledigt „alle Karten einmal gelernt“ heißt (nicht zwingend schon gemeistert).",
        "🛠️ Empty-State nennt jetzt Lehrkraft UND Reiseleitung; kleinere Politur (Badge-Kontrast); Startseite rechnet den Paket-Status nur noch für sichtbare Kacheln (schneller).",
      ],
      itemsEn: [
        "📊 Open tasks now show their progress as “12/40 learned” (or “3/7 stages”) – in the Tarea list and on the Pre-Arrival tile. So you can see partial progress, not just done/open.",
        "💡 Below the task buttons, a fixed note now explains “Paste” vs. “Add task” – instead of only as a fleeting message.",
        "♿ Accessibility & clarity: “Done” is announced to screen readers, and a tooltip clarifies that done means “every card learned once” (not necessarily mastered yet).",
        "🛠️ The empty state now names both teacher AND tour leader; minor polish (badge contrast); the home page now computes the package status only for visible tiles (faster).",
      ],
    },
    {
      version: "1.67.0",
      date: "2026-06-15",
      title: "Pre-Arrival-Kachel zeigt „geschafft“",
      titleEn: "Pre-Arrival tile shows “done”",
      items: [
        "✅ Die Pre-Arrival-Kachel auf der Startseite ist jetzt klar als erledigt markiert, sobald du alle Ankunfts-Sätze einmal gelernt hast – mit Häkchen, grünem „geschafft“-Abzeichen und grüner Optik, genau wie bei „Ruta del día“. Antippbar bleibt sie zum Wiederholen.",
      ],
      itemsEn: [
        "✅ The Pre-Arrival tile on the home page is now clearly marked as completed once you've learned all arrival sentences once – with a checkmark, a green “done” badge and green styling, just like “Ruta del día”. It stays tappable for review.",
      ],
    },
    {
      version: "1.66.0",
      date: "2026-06-15",
      title: "Absolvierte Aufgaben werden als erledigt markiert",
      titleEn: "Completed tasks are marked as done",
      items: [
        "✅ Hast du eine zugewiesene Aufgabe geschafft, ist sie in der Tarea-Liste jetzt klar als erledigt markiert: grünes Häkchen, „Erledigt“-Abzeichen und grüner Rahmen; aus „Starten“ wird „Wiederholen“. Erledigt heißt: beim Pre-Trip-Plan alle Etappen geschafft, beim Pre-Arrival/ganzen Paket alle Karten mindestens einmal gelernt.",
      ],
      itemsEn: [
        "✅ Once you've completed an assigned task, it's now clearly marked as done in the Tarea list: green checkmark, “Done” badge and green frame; “Start” becomes “Repeat”. Done means: for a Pre-Trip plan all stages completed, for a Pre-Arrival/whole package all cards learned at least once.",
      ],
    },
    {
      version: "1.65.0",
      date: "2026-06-15",
      title: "Editions-Footer: sauberer Text-Credit statt Platzhalter-Logo",
      titleEn: "Edition footer: clean text credit instead of placeholder logo",
      items: [
        "🏷️ Das nachgebaute Platzhalter-Logo wirkte klein und billig. Der Profil-Footer zeigt jetzt den Partnernamen klar in der Markenfarbe (großzügig, zentriert) mit dezentem „mit HolaRuta“ darunter. Sobald ein echtes, freigegebenes Logo hinterlegt wird, erscheint es automatisch als Bild.",
      ],
      itemsEn: [
        "🏷️ The rebuilt placeholder logo looked small and cheap. The profile footer now shows the partner name clearly in the brand color (generous, centered) with a subtle “with HolaRuta” underneath. As soon as a real, approved logo is added, it appears automatically as an image.",
      ],
    },
    {
      version: "1.64.0",
      date: "2026-06-15",
      title: "Aufgaben-Code einfügen funktioniert jetzt überall",
      titleEn: "Pasting a task code now works everywhere",
      items: [
        "📥 Einen Aufgaben-Code ins Feld einfügen abonniert die Aufgabe jetzt SOFORT – auch in der heruntergeladenen Einzeldatei/WebView, wo das Lesen der Zwischenablage gesperrt ist. Kein extra „Hinzufügen“-Tipp nötig (der mit offener Tastatur oft nur die Tastatur schloss).",
        "🔢 Mehrere verschiedene Kurse landen damit zuverlässig in der Liste; ein identischer Code wird (wie gehabt) nicht doppelt aufgenommen.",
      ],
      itemsEn: [
        "📥 Pasting a task code into the field now subscribes to the task IMMEDIATELY – even in the downloaded single file/WebView, where reading the clipboard is blocked. No extra “Add” tap needed (which, with the keyboard open, often only closed the keyboard).",
        "🔢 Several different courses thus reliably end up in the list; an identical code is (as before) not added twice.",
      ],
    },
    {
      version: "1.63.0",
      date: "2026-06-15",
      title: "Editions-Credit aufgeräumt (Logo + „mit HolaRuta“)",
      titleEn: "Edition credit cleaned up (logo + “with HolaRuta”)",
      items: [
        "🏷️ Der Co-Branding-Hinweis im Profil zeigt jetzt sauber zentriert das Partner-Logo (bzw. den Namen) und darunter ein dezentes „mit HolaRuta“ – statt den Partnernamen doppelt (er steckte schon im App-Namen).",
      ],
      itemsEn: [
        "🏷️ The co-branding note in the profile now shows the partner logo (or name) neatly centered, with a subtle “with HolaRuta” underneath – instead of the partner name twice (it was already in the app name).",
      ],
    },
    {
      version: "1.62.0",
      date: "2026-06-15",
      title: "Länderkunde: Bevölkerung, Politik & Wirtschaft",
      titleEn: "Country facts: population, politics & economy",
      items: [
        "👥 Jedes Land unter „Países y culturas“ hat jetzt einen neuen Abschnitt „Land & Wirtschaft“: Einwohnerzahl, Altersstruktur, politische Regierungsform, wirtschaftliche Lage und wovon das Land hauptsächlich lebt – mit aktuellen Werten (Stand 2025) kompakt auf einen Blick.",
        "🔎 Die neuen Angaben fließen auch in die Suche ein und sind wie alle Länderinhalte auf Deutsch und Englisch verfügbar.",
      ],
      itemsEn: [
        "👥 Every country under “Países y culturas” now has a new “Country & economy” section: population, age structure, political form of government, economic situation and what the country mainly lives on – with current figures (as of 2025) compactly at a glance.",
        "🔎 The new information also feeds into the search and, like all country content, is available in German and English.",
      ],
    },
    {
      version: "1.61.0",
      date: "2026-06-15",
      title: "Geteilte Modul-Links öffnen direkt das Modul",
      titleEn: "Shared module links open the module directly",
      items: [
        "🔗 Tippt jemand auf den Link unter einem „Modul teilen“-Sharepic, landet er jetzt direkt im empfohlenen Modul (z.B. Precios al oído) statt nur auf der Startseite – der Link trägt dafür eine Modul-Kennung (?m=…).",
      ],
      itemsEn: [
        "🔗 When someone taps the link under a “Share module” sharepic, they now land directly in the recommended module (e.g. Precios al oído) instead of just on the home page – the link carries a module identifier (?m=…) for that.",
      ],
    },
    {
      version: "1.60.0",
      date: "2026-06-15",
      title: "„Modul teilen“ besser sichtbar",
      titleEn: "“Share module” more visible",
      items: [
        "📤 Der „Modul teilen“-Knopf erscheint jetzt in allen Entdecken-Modulen im selben auffälligen Orange wie bei „Historia de Sudamérica“ – vorher war er außerhalb von Historia unscheinbar grau und leicht zu übersehen.",
      ],
      itemsEn: [
        "📤 The “Share module” button now appears in all Discover modules in the same eye-catching orange as in “Historia de Sudamérica” – before, outside of Historia it was an inconspicuous gray and easy to miss.",
      ],
    },
    {
      version: "1.59.0",
      date: "2026-06-15",
      title: "„Modul teilen“ jetzt in allen Entdecken-Modulen",
      titleEn: "“Share module” now in all Discover modules",
      items: [
        "📤 Der „Modul teilen“-Knopf sitzt jetzt oben in jedem Entdecken-Modul – nicht mehr nur bei „Historia de Sudamérica“. Damit lässt sich jedes Modul (Supervivencia, Modo hostal, Definiciones, Frases flexibles, Diálogos, Regatear, Precios al oído, El Cuerpo, Lista de compras, Conjugación, Tiempos, Países y culturas, Etiqueta de viaje, Logística de viaje und Salud y energía) als Einladung weiterempfehlen.",
        "🎨 Jedes Sharepic ist auf sein Modul zugeschnitten: Icon, Titel und ein paar echte Highlights – je nach Modul Beispiel-Vokabeln, Themen- oder Szenenlisten – in 1:1 oder 9:16 (Story).",
      ],
      itemsEn: [
        "📤 The “Share module” button now sits at the top of every Discover module – no longer only in “Historia de Sudamérica”. This lets you recommend any module (Supervivencia, Modo hostal, Definiciones, Frases flexibles, Diálogos, Regatear, Precios al oído, El Cuerpo, Lista de compras, Conjugación, Tiempos, Países y culturas, Etiqueta de viaje, Logística de viaje and Salud y energía) as an invitation.",
        "🎨 Each sharepic is tailored to its module: icon, title and a few real highlights – depending on the module example vocabulary, topic or scene lists – in 1:1 or 9:16 (Story).",
      ],
    },
    {
      version: "1.58.0",
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
        "🌋 New explainer page under Discover: the whole history of Central America at a glance – from the Maya through the Spanish conquest and the Kingdom of Guatemala to Morazán's dream of unity, the civil wars of the Cold War and today's seven republics.",
        "🕰️ Interactive timeline: eight expandable eras – the world of the Maya, Conquista, colonial era, Independence 1821, the Federation, coffee & bananas, civil wars and the path to today. Each era with key points, explanation and (where available) an image.",
        "👤 Gallery of protagonists: Francisco Morazán, Augusto César Sandino, Óscar Romero, Rigoberta Menchú and José Figueres – with life dates and a quote.",
        "📰 “Today: situation & tensions”: current topics explained understandably – El Salvador under Bukele, Nicaragua under Ortega, the Panama Canal, Maras & migration, Guatemala's fresh start and Costa Rica as the stable exception.",
        "📖 Complete with reading practice: each era, each protagonist and each “Today” card is also available as a Spanish reading text with tappable vocabulary, word list, quiz, difficulty score and shareable sharepic – just like in “Historia de Sudamérica”.",
      ],
    },
    {
      version: "1.57.0",
      date: "2026-06-15",
      title: "Klarere Onboarding-Überschrift",
      titleEn: "Clearer onboarding heading",
      items: [
        "🧭 Der Erststart heißt jetzt „Reisefertig in zwei Schritten“ (Reiseziel + kurzer Einstufungstest) statt der etwas verspielten Frage – sachlicher, gerade für Schul-Editionen, und sagt vorab, was kommt.",
      ],
      itemsEn: [
        "🧭 The first launch is now called “Travel-ready in two steps” (destination + a short placement test) instead of the slightly playful question – more matter-of-fact, especially for school editions, and it says up front what's coming.",
      ],
    },
    {
      version: "1.56.0",
      date: "2026-06-15",
      title: "Abnahme-Politur: Onboarding, Aufgaben-Robustheit & klarere Texte",
      titleEn: "Acceptance polish: onboarding, task robustness & clearer texts",
      items: [
        "🧭 Behoben: Wer beim ersten Start das Reiseziel übersprang und den Ruta-Check abbrach, bekam das Onboarding beim nächsten Mal erneut – jetzt gilt es zuverlässig als erledigt.",
        "🧱 Robuster: Aufgaben-Liste mit Obergrenze und ehrlichem Hinweis, falls der Speicher voll ist (statt still zu scheitern); abgelaufene Fristen werden jetzt klar als „Frist abgelaufen“ markiert.",
        "✍️ Klarere Texte: „mehrere Aufgaben parallel“ und „Link vs. Code“ werden zur richtigen Zeit erklärt; Aufgaben-Liste bleibt-gespeichert-Hinweis; durchgängig „Reiseleitung“; ein englischer Plural-Tippfehler korrigiert. Aufgeräumte, ungenutzte Texte entfernt.",
      ],
      itemsEn: [
        "🧭 Fixed: anyone who skipped the destination on first launch and aborted the Ruta-Check got the onboarding again next time – now it reliably counts as completed.",
        "🧱 More robust: task list with an upper limit and an honest note if storage is full (instead of failing silently); expired deadlines are now clearly marked as “Deadline expired”.",
        "✍️ Clearer texts: “several tasks in parallel” and “link vs. code” are explained at the right time; a “task list stays saved” note; consistently “tour leader”; an English plural typo fixed. Cleaned up unused texts removed.",
      ],
    },
    {
      version: "1.55.0",
      date: "2026-06-15",
      title: "Mehrere Aufgaben parallel – per Link teilbar & abonnierbar",
      titleEn: "Several tasks in parallel – shareable & subscribable via link",
      items: [
        "📋 Lernende können jetzt MEHRERE Aufgaben gleichzeitig haben: die Tarea-Seite zeigt eine Liste deiner abonnierten Aufgaben, jede einzeln startbar und entfernbar – und sie bleiben gespeichert (auch nach dem Neuladen).",
        "🔗 Lehrkräfte/Reiseleitung teilen eine Aufgabe jetzt als Link („Link kopieren“): ein Tipp darauf abonniert sie direkt – kein Einfügen nötig. Der Code funktioniert weiter zum manuellen Hinzufügen.",
        "🧷 Aufgaben reisen im Backup mit (für die Lehreransicht/das eigene Gerät).",
      ],
      itemsEn: [
        "📋 Learners can now have MULTIPLE tasks at the same time: the Tarea page shows a list of your subscribed tasks, each individually startable and removable – and they stay saved (even after reloading).",
        "🔗 Teachers/tour leaders now share a task as a link (“Copy link”): a tap on it subscribes directly – no pasting needed. The code still works for adding manually.",
        "🧷 Tasks travel along in the backup (for the teacher view/your own device).",
      ],
    },
    {
      version: "1.54.0",
      date: "2026-06-15",
      title: "Gebrandeter Einstiegslink: direkt ins Onboarding, mit Partner-Logo",
      titleEn: "Branded entry link: straight into onboarding, with partner logo",
      items: [
        "🔗 Eine Schule oder Partnerfirma kann jetzt EINEN Link verschicken, der die App direkt im Onboarding öffnet – inkl. Reiseziel und Ruta-Check. Parameter: ?start=onboarding (und ?edition=… fürs Branding).",
        "🎨 Branding per Link: ?edition=ecos bzw. ?edition=weroad öffnet die App in den Farben, mit Namen und Logo des Partners – ohne eine eigene Datei zu verteilen. Eine fest gebaute Edition lässt sich per URL nicht überschreiben.",
        "🏷️ Das Partner-Logo erscheint beim ersten Start (Onboarding) oben – nicht nur im Profil.",
      ],
      itemsEn: [
        "🔗 A school or partner company can now send ONE link that opens the app directly in onboarding – including destination and Ruta-Check. Parameter: ?start=onboarding (and ?edition=… for branding).",
        "🎨 Branding via link: ?edition=ecos or ?edition=weroad opens the app in the partner's colors, name and logo – without distributing a separate file. A hard-built edition cannot be overridden via URL.",
        "🏷️ The partner logo appears at the top on first launch (onboarding) – not only in the profile.",
      ],
    },
    {
      version: "1.53.0",
      date: "2026-06-15",
      title: "Ruta-Check: fairere Einstufung + Qualitäts-Hinweis",
      titleEn: "Ruta-Check: fairer placement + quality note",
      items: [
        "🧠 Genauere Einstufung: Wer im adaptiven Test schwere Fragen richtig löst, wird jetzt nicht mehr durch ein paar Treffer-Fehlversuche unter Wert eingestuft – das demonstrierte Niveau zählt mit (IRT-artig).",
        "🛡️ Neuer Zuverlässigkeits-Hinweis am Ende: erkennt sehr schnelles Klicken oder wahlloses Raten und schlägt eine ruhige Wiederholung vor; viele ehrliche „weiß nicht“ werden positiv eingeordnet. Fließt NICHT in den Score, nur als Einordnung.",
        "📊 Der Fortschrittsbalken füllt sich nun bis 100 %.",
      ],
      itemsEn: [
        "🧠 More accurate placement: anyone who solves hard questions correctly in the adaptive test is no longer placed below their worth by a few hit-or-miss attempts – the demonstrated level counts too (IRT-like).",
        "🛡️ New reliability note at the end: it detects very fast clicking or random guessing and suggests a calm retry; many honest “don't know” answers are scored positively. Does NOT feed into the score, only as context.",
        "📊 The progress bar now fills up to 100%.",
      ],
    },
    {
      version: "1.52.0",
      date: "2026-06-15",
      title: "Modo profe wandert in den Tarea-Reiter (Editionen) + Ruta-Check-Feinschliff",
      titleEn: "Modo profe moves into the Tarea tab (editions) + Ruta-Check polish",
      items: [
        "🧑‍🏫 In Schul-/Reise-Editionen gibt es jetzt EINEN „Tarea“-Reiter statt zwei: Modo profe hängt direkt im Tarea-Bereich mit drin (ein Tipp weiter), die untere Navigation bleibt aufgeräumt.",
        "🔧 Review-Fixes am Ruta-Check: der Zurück-Pfeil während des Onboarding-Tests schließt das Onboarding jetzt sauber ab (vorher konnte es erneut erscheinen), Doppeltipp auf eine Antwort wird abgefangen, und der Test-Zustand wird beim Verlassen ordentlich gelöst.",
        "🗣️ Inhaltliche Korrektur zweier Testfragen (eindeutige Höflichkeitsform statt Mehrdeutigkeit; mehr akzeptierte Schreibweisen bei einer freien Antwort).",
      ],
      itemsEn: [
        "🧑‍🏫 In school/travel editions there is now ONE “Tarea” tab instead of two: Modo profe is included directly in the Tarea area (one tap further), keeping the bottom navigation tidy.",
        "🔧 Review fixes for the Ruta-Check: the back arrow during the onboarding test now cleanly completes the onboarding (before it could reappear), a double-tap on an answer is caught, and the test state is properly cleared on exit.",
        "🗣️ Content correction of two test questions (an unambiguous polite form instead of ambiguity; more accepted spellings for a free answer).",
      ],
    },
    {
      version: "1.51.0",
      date: "2026-06-15",
      title: "Ruta-Check wird adaptiv – und Teil des Onboardings",
      titleEn: "Ruta-Check becomes adaptive – and part of onboarding",
      items: [
        "🪜 Der Ruta-Check passt sich jetzt an: Wer richtig antwortet, bekommt schwerere Fragen, wer danebenliegt oder „weiß nicht“ wählt, leichtere – so landet die Einstufung schneller und genauer beim echten Niveau (A0 bis B1−). Zum Schluss kommen die freien Antworten.",
        "🧭 Beim allerersten Start führt das Onboarding direkt durch den Test (mit „Später“-Option) – nach dem Reiseziel kommt der Ruta-Check, damit die Einstufung tatsächlich gemacht wird.",
        "🎚️ Neue ganz leichte (A0) und fordernde (B1) Fragen geben der Anpassung Spielraum; die Grammatik bleibt dosiert (Deckel ~30 %).",
      ],
      itemsEn: [
        "🪜 The Ruta-Check now adapts: those who answer correctly get harder questions, those who get it wrong or choose “don't know” get easier ones – so the placement lands at the real level (A0 to B1−) faster and more accurately. The free answers come at the end.",
        "🧭 On the very first launch, onboarding leads directly through the test (with a “Later” option) – after the destination comes the Ruta-Check, so the placement actually gets done.",
        "🎚️ New very easy (A0) and demanding (B1) questions give the adaptation room to maneuver; grammar stays measured (cap ~30%).",
      ],
    },
    {
      version: "1.50.0",
      date: "2026-06-15",
      title: "Ruta-Check: kurzer, reisepraktischer Einstufungstest",
      titleEn: "Ruta-Check: short, travel-practical placement test",
      items: [
        "🎯 Neuer „Ruta-Check“ unter Entdecken: 24 Fragen in echten Reisesituationen (Verstehen, Reagieren, Wortschatz) plus dosiert Konjugation & Zeiten (~30 %) – Kommunikation steht im Vordergrund, nicht trockene Grammatik.",
        "🤷 Jede Frage hat „Ich weiß es nicht“ – ehrliches Nichtwissen statt Raten. Das macht die Einstufung fairer und genauer.",
        "📊 Am Ende ein Profil statt nur einer Note: Startlevel (A0–B1−), Trefferquote, „weiß-nicht“-Anteil, Tempo und eine Aufschlüsselung nach Bereichen – plus ein Hinweis, ob jemand kommunikativ oder grammatikalisch stärker ist.",
        "🧑‍🏫 Das Ergebnis erscheint im „Modo profe“ als eigene Spalte (Level · Score), sobald ein Schüler sein Backup teilt – hilfreich für die Gruppenzuteilung.",
      ],
      itemsEn: [
        "🎯 New “Ruta-Check” under Discover: 24 questions in real travel situations (understanding, reacting, vocabulary) plus measured conjugation & tenses (~30%) – communication is the priority, not dry grammar.",
        "🤷 Every question has “I don't know” – honest not-knowing instead of guessing. This makes the placement fairer and more accurate.",
        "📊 At the end a profile instead of just a grade: starting level (A0–B1−), hit rate, “don't know” share, pace and a breakdown by area – plus a note on whether someone is stronger communicatively or grammatically.",
        "🧑‍🏫 The result appears in “Modo profe” as its own column (Level · Score) as soon as a student shares their backup – helpful for group assignment.",
      ],
    },
    {
      version: "1.49.0",
      date: "2026-06-15",
      title: "Zugewiesenes Reiseziel ist fix + Kopieren/Einfügen funktioniert mobil",
      titleEn: "Assigned destination is fixed + copy/paste works on mobile",
      items: [
        "🎯 Öffnet ein Lernender eine zugewiesene Pre-Trip-Aufgabe, ist das Reiseziel jetzt fest auf das vom Lehrer gewählte Land gestellt – es erscheint nur dieses (z. B. Mexiko), nicht mehr die ganze Länder-Auswahl mit Kolumbien vorausgewählt.",
        "📋 Kopieren klappt jetzt auch in der heruntergeladenen Einzeldatei/WebView (per execCommand statt nur moderner Zwischenablage-API) – mit „✓ Kopiert!“ statt „mit Strg+C kopieren“.",
        "📥 „Einfügen“ holt den Code, wo der Browser es erlaubt; sonst springt der Cursor ins Feld mit dem Hinweis, lang zu tippen und „Einfügen“ zu wählen – statt wirkungslos zu sein.",
      ],
      itemsEn: [
        "🎯 When a learner opens an assigned Pre-Trip task, the destination is now fixed to the country chosen by the teacher – only that one appears (e.g. Mexico), no longer the whole country selection with Colombia preselected.",
        "📋 Copying now also works in the downloaded single file/WebView (via execCommand instead of only the modern clipboard API) – with “✓ Copied!” instead of “copy with Ctrl+C”.",
        "📥 “Paste” fetches the code where the browser allows it; otherwise the cursor jumps into the field with a note to long-press and choose “Paste” – instead of being ineffective.",
      ],
    },
    {
      version: "1.48.0",
      date: "2026-06-15",
      title: "Editionen: Modo profe & Tarea als eigene Reiter, raus aus Entdecken",
      titleEn: "Editions: Modo profe & Tarea as their own tabs, out of Discover",
      items: [
        "🧑‍🏫 In Schul-/Reise-Editionen (ECOS, WeRoad) bekommt jetzt auch „Modo profe“ einen eigenen Reiter in der unteren Navigation – neben „Tarea“.",
        "🧭 Beide sind dort nicht mehr doppelt als Kachel unter „Entdecken“ – das hält die Navigation aufgeräumt. Im Standard-HolaRuta bleibt alles wie gehabt (beide als Kachel, keine Extra-Reiter).",
      ],
      itemsEn: [
        "🧑‍🏫 In school/travel editions (ECOS, WeRoad), “Modo profe” now also gets its own tab in the bottom navigation – next to “Tarea”.",
        "🧭 Both are no longer duplicated there as a tile under “Discover” – this keeps the navigation tidy. In the standard HolaRuta everything stays as before (both as a tile, no extra tabs).",
      ],
    },
    {
      version: "1.47.0",
      date: "2026-06-15",
      title: "Aufgaben erstellen: Auswahl bleibt stehen + klares Kopieren/Einfügen",
      titleEn: "Creating tasks: selection stays + clear copy/paste",
      items: [
        "🎯 Im „Modo profe“ bleibt das gewählte Aufgaben-Ziel (Land/Paket), der Titel und die Frist jetzt nach „Code erzeugen“ stehen – vorher sprang die Auswahl zurück auf das erste Land.",
        "🧾 Unter dem erzeugten Code steht jetzt im Klartext, wofür er ist (z. B. „Code für: Pre-Trip-Plan: Peru“) – so siehst du sofort, dass deine Auswahl übernommen wurde.",
        "📋 Kopieren bestätigt mit einem kurzen „✓ Kopiert!“ direkt am Knopf; auf der Lernenden-Seite gibt es einen „Einfügen“-Knopf, der den Code aus der Zwischenablage holt – beides mit sichtbarer Rückmeldung.",
      ],
      itemsEn: [
        "🎯 In “Modo profe” the chosen task target (country/package), the title and the deadline now stay after “Generate code” – before, the selection jumped back to the first country.",
        "🧾 Below the generated code it now states in plain text what it's for (e.g. “Code for: Pre-Trip plan: Peru”) – so you immediately see that your selection was applied.",
        "📋 Copying confirms with a brief “✓ Copied!” right at the button; on the learner page there is a “Paste” button that fetches the code from the clipboard – both with visible feedback.",
      ],
    },
    {
      version: "1.46.0",
      date: "2026-06-15",
      title: "Nach der Etappe zurück zum Plan – und ein eigener „Tarea“-Reiter",
      titleEn: "After the stage, back to the plan – and a dedicated “Tarea” tab",
      items: [
        "🧭 Schließt du eine Pre-Trip-Etappe oder eine zugewiesene Aufgabe ab, führt der Fertig-Screen jetzt direkt dorthin zurück (zum Pre-Trip-Plan bzw. zur Aufgabe) – die nächste Etappe ist sofort sichtbar, statt ganz zur Übersicht oder in die Statistik zu springen.",
        "📝 Schul- und Reise-Editionen (ECOS, WeRoad) bekommen einen eigenen „Tarea“-Reiter in der unteren Navigation, damit Aufgaben-Codes mit einem Tap erreichbar sind.",
      ],
      itemsEn: [
        "🧭 When you complete a Pre-Trip stage or an assigned task, the finish screen now leads directly back there (to the Pre-Trip plan or the task) – the next stage is immediately visible, instead of jumping all the way to the overview or into the statistics.",
        "📝 School and travel editions (ECOS, WeRoad) get a dedicated “Tarea” tab in the bottom navigation, so task codes are reachable with a single tap.",
      ],
    },
    {
      version: "1.45.0",
      date: "2026-06-15",
      title: "Optionale Cloud-Sync – Fundament für Schul-/Partner-Editionen",
      titleEn: "Optional cloud sync – foundation for school/partner editions",
      items: [
        "☁️ Optionale, opt-in Cloud-Sync: passwortlos anmelden und den Fortschritt geräteübergreifend zusammenführen. Standard bleibt komplett offline – ohne Edition und ohne Login gibt es keinerlei Netzwerk.",
        "🔀 Verlustarmes Zusammenführen (Mengen werden vereint, Zähler aufs Maximum gezogen, Karten nach Lernfortschritt) als reine, getestete Funktion. Als Beispiel für die ECOS- und WeRoad-Edition vorverdrahtet; ein lokaler Mock-Server liegt für Demos bei.",
      ],
      itemsEn: [
        "☁️ Optional, opt-in cloud sync: sign in passwordless and merge your progress across devices. The default stays completely offline – without an edition and without login there is no networking whatsoever.",
        "🔀 Low-loss merging (sets are united, counters pulled to the maximum, cards by learning progress) as a pure, tested function. Pre-wired as an example for the ECOS and WeRoad edition; a local mock server is included for demos.",
      ],
    },
    {
      version: "1.44.0",
      date: "2026-06-15",
      title: "Aufgaben teilen: Zuweisung per Code – ganz ohne Konto",
      titleEn: "Share tasks: assignment via code – completely without an account",
      items: [
        "📝 Lehrkräfte und Reiseleiter können unter „Modo profe“ eine Aufgabe erstellen – ein Pre-Trip-Plan, ein Pre-Arrival-Paket oder ein ganzes Reise-Paket, optional mit Titel und Frist – und sie als kurzen Code teilen (WhatsApp, Mail, QR).",
        "🎯 Lernende öffnen unter „Tarea“ den Code und werden direkt in die zugewiesene Übung geführt. Komplett offline, ohne Konto und ohne Server.",
      ],
      itemsEn: [
        "📝 Teachers and tour leaders can create a task under “Modo profe” – a Pre-Trip plan, a Pre-Arrival package or a whole travel package, optionally with a title and deadline – and share it as a short code (WhatsApp, mail, QR).",
        "🎯 Learners open the code under “Tarea” and are led directly into the assigned exercise. Completely offline, without an account and without a server.",
      ],
    },
    {
      version: "1.43.0",
      date: "2026-06-15",
      title: "Modo profe: Klassenübersicht für Lehrkräfte & Reiseleiter",
      titleEn: "Modo profe: class overview for teachers & tour leaders",
      items: [
        "🧑‍🏫 Neuer „Modo profe“ unter Entdecken: Schüler exportieren ihren Fortschritt im Profil als Backup-Datei, du importierst die Dateien und bekommst eine Klassenübersicht – gemeisterte Karten, Destination-Pakete, Pre-Trip-Etappen, Challenges und Lern-Serie pro Person.",
        "🔒 Komplett offline und ohne Konto: die Schülerdaten bleiben nur in dieser Sitzung, nichts wird gespeichert oder gesendet, dein eigener Fortschritt bleibt unangetastet. Druckbar für die Unterlagen.",
      ],
      itemsEn: [
        "🧑‍🏫 New “Modo profe” under Discover: students export their progress in the profile as a backup file, you import the files and get a class overview – mastered cards, destination packages, Pre-Trip stages, challenges and learning streak per person.",
        "🔒 Completely offline and without an account: the student data stays only in this session, nothing is saved or sent, your own progress stays untouched. Printable for your records.",
      ],
    },
    {
      version: "1.42.0",
      date: "2026-06-15",
      title: "Drei neue Reise-Pakete: Argentinien, Chile & Bolivien",
      titleEn: "Three new travel packs: Argentina, Chile & Bolivia",
      items: [
        "🇦🇷 Neuer Bereich „Argentinien“ mit 40 Karten: Buenos Aires (Tango, San Telmo), Patagonien (Perito Moreno, Fitz Roy, Ushuaia), Iguazú und Mendoza – mit rioplatense Voseo (che, dale, bárbaro), Asado, Mate und Wechselkurs-Tipps.",
        "🇨🇱 Neuer Bereich „Chile“ mit 40 Karten: Santiago, Valparaíso, Atacama (Valle de la Luna, El Tatio) und Torres del Paine – mit Chilenismen (cachái, bacán, al tiro, po), Completo, Once und Pisco.",
        "🇧🇴 Neuer Bereich „Bolivien“ mit 40 Karten: La Paz (Teleférico, Hexenmarkt), Salar de Uyuni, Titicaca, Potosí und Sucre – mit Aymara-Gruß (Kamisaraki), Höhe/soroche, Cholita, Trufi und Salteña.",
        "🗓️ Alle drei auch im Pre-Trip-Plan wählbar, je mit Pre-Arrival-Kachel und zwei Real-Life-Mutproben.",
      ],
      itemsEn: [
        "🇦🇷 New section “Argentina” with 40 cards: Buenos Aires (tango, San Telmo), Patagonia (Perito Moreno, Fitz Roy, Ushuaia), Iguazú and Mendoza – with rioplatense voseo (che, dale, bárbaro), asado, mate and exchange-rate tips.",
        "🇨🇱 New section “Chile” with 40 cards: Santiago, Valparaíso, Atacama (Valle de la Luna, El Tatio) and Torres del Paine – with Chileanisms (cachái, bacán, al tiro, po), completo, once and pisco.",
        "🇧🇴 New section “Bolivia” with 40 cards: La Paz (Teleférico, witches' market), Salar de Uyuni, Titicaca, Potosí and Sucre – with an Aymara greeting (Kamisaraki), altitude/soroche, cholita, trufi and salteña.",
        "🗓️ All three are also selectable in the Pre-Trip plan, each with a Pre-Arrival tile and two Real-Life challenges.",
      ],
    },
    {
      version: "1.41.0",
      date: "2026-06-15",
      title: "Zwei neue Reise-Pakete: Ecuador & Guatemala",
      titleEn: "Two new travel packs: Ecuador & Guatemala",
      items: [
        "🇪🇨 Neuer Bereich „Ecuador“ mit 40 Karten: Quito & Mitad del Mundo, Otavalo-Markt, Cotopaxi & Quilotoa, Baños, Amazonas/Tena (+ Galápagos-Verlängerung) – mit US-Dollar-Hinweis und Anden-Slang (achachay, ¿qué fue?, Alli puncha).",
        "🇬🇹 Neuer Bereich „Guatemala“ mit 40 Karten: Antigua, Lago de Atitlán, Chichicastenango-Markt, Tikal/Flores, Acatenango/Fuego, Semuc Champey – mit Quetzal, Chicken Bus/Tuk-Tuk und Maya-Kultur (Saqʼarik, chapín, chilero).",
        "🗓️ Beide auch im Pre-Trip-Plan wählbar, je mit Pre-Arrival-Kachel und zwei Real-Life-Mutproben.",
      ],
      itemsEn: [
        "🇪🇨 New section “Ecuador” with 40 cards: Quito & Mitad del Mundo, Otavalo market, Cotopaxi & Quilotoa, Baños, Amazon/Tena (+ Galápagos extension) – with a US-dollar note and Andean slang (achachay, ¿qué fue?, Alli puncha).",
        "🇬🇹 New section “Guatemala” with 40 cards: Antigua, Lago de Atitlán, Chichicastenango market, Tikal/Flores, Acatenango/Fuego, Semuc Champey – with the quetzal, chicken bus/tuk-tuk and Maya culture (Saqʼarik, chapín, chilero).",
        "🗓️ Both are also selectable in the Pre-Trip plan, each with a Pre-Arrival tile and two Real-Life challenges.",
      ],
    },
    {
      version: "1.40.0",
      date: "2026-06-15",
      title: "Pre-Trip-Plan jetzt für vier Reiseziele",
      titleEn: "Pre-Trip plan now for four destinations",
      items: [
        "🗓️ Der Pre-Trip-Plan deckt jetzt Kolumbien, Peru, Mexiko und Costa Rica ab – wähle dein Reiseziel oben über die Chips. Jedes Ziel hat seine eigenen 7 Etappen mit kuratierten Karten und Real-Life-Mutprobe.",
        "🧳 Der Fortschritt wird je Reiseziel getrennt gespeichert; den Stempel „Reisefertig“ gibt es, sobald du einen kompletten Plan geschafft hast. Bestehender Kolumbien-Fortschritt bleibt erhalten.",
        "🎯 Welches Ziel vorausgewählt ist, richtet sich nach deinem Trip-Ziel (z. B. „Cusco“ → Peru).",
      ],
      itemsEn: [
        "🗓️ The Pre-Trip plan now covers Colombia, Peru, Mexico and Costa Rica – pick your destination at the top using the chips. Each destination has its own 7 stages with curated cards and a Real-Life challenge.",
        "🧳 Progress is saved separately per destination; you earn the “Travel-ready” stamp as soon as you complete a full plan. Existing Colombia progress is preserved.",
        "🎯 Which destination is pre-selected depends on your trip goal (e.g. “Cusco” → Peru).",
      ],
    },
    {
      version: "1.39.0",
      date: "2026-06-15",
      title: "Zwei neue Reise-Pakete: Mexiko & Costa Rica",
      titleEn: "Two new travel packs: Mexico & Costa Rica",
      items: [
        "🇲🇽 Neuer Bereich „Mexiko“ mit 41 Karten entlang der „Mexiko 360°“-Route: CDMX, Teotihuacán, Oaxaca (Mezcal, chapulines), Chiapas (Sumidero-Canyon, San Cristóbal, Palenque) und Yucatán (Cenoten, Chichén Itzá, Tulum, Bacalar) – mit Día de Muertos und mexikanischem Slang (¿mande?, ¡órale!, ¡aguas!, chido).",
        "🇨🇷 Neuer Bereich „Costa Rica“ mit 40 Karten: San José, Karibik (Tortuguero, Puerto Viejo, Bribri-Kakao), Arenal/Río Celeste, Monteverde (Nebelwald, Canopy), Manuel Antonio – mit Wildlife (perezoso, tucán), Tico-Slang (pura vida, mae, tuanis) und gallo pinto/casado.",
        "🇲🇽🇨🇷 Pre-Arrival-Kacheln für Mexiko und Costa Rica plus vier neue Real-Life-Mutproben.",
      ],
      itemsEn: [
        "🇲🇽 New section “Mexico” with 41 cards along the “Mexico 360°” route: CDMX, Teotihuacán, Oaxaca (mezcal, chapulines), Chiapas (Sumidero Canyon, San Cristóbal, Palenque) and Yucatán (cenotes, Chichén Itzá, Tulum, Bacalar) – with Día de Muertos and Mexican slang (¿mande?, ¡órale!, ¡aguas!, chido).",
        "🇨🇷 New section “Costa Rica” with 40 cards: San José, the Caribbean (Tortuguero, Puerto Viejo, Bribri cacao), Arenal/Río Celeste, Monteverde (cloud forest, canopy), Manuel Antonio – with wildlife (perezoso, tucán), tico slang (pura vida, mae, tuanis) and gallo pinto/casado.",
        "🇲🇽🇨🇷 Pre-Arrival tiles for Mexico and Costa Rica plus four new Real-Life challenges.",
      ],
    },
    {
      version: "1.38.0",
      date: "2026-06-15",
      title: "Pre-Arrival Peru: die wichtigsten Sätze auf einen Tap",
      titleEn: "Pre-Arrival Peru: the most important phrases in one tap",
      items: [
        "🇵🇪 Neue Dashboard-Kachel „Pre-Arrival Peru“ – ein Tap startet die 20 wichtigsten Sätze für die Ankunft (Gruß, Taxi, Höhe & Kokatee, Geld, Essen, Sicherheit). Erscheint automatisch, wenn dein Trip-Ziel Peru meint (Lima, Cusco, Machu Picchu …).",
      ],
      itemsEn: [
        "🇵🇪 New dashboard tile “Pre-Arrival Peru” – one tap starts the 20 most important phrases for arrival (greeting, taxi, altitude & coca tea, money, food, safety). It appears automatically when your trip goal means Peru (Lima, Cusco, Machu Picchu …).",
      ],
    },
    {
      version: "1.37.0",
      date: "2026-06-15",
      title: "Neues Reise-Paket: Peru (Cusco, Machu Picchu & Anden)",
      titleEn: "New travel pack: Peru (Cusco, Machu Picchu & the Andes)",
      items: [
        "🇵🇪 Neuer Bereich „Peru“ mit 45 ortsspezifischen Karten entlang der klassischen Route: Lima, Höhe & Kokatee (soroche), Arequipa & Colca-Canyon (Kondore), Titicacasee/Puno (schwimmende Inseln), Cusco & Heiliges Tal, Machu Picchu, Regenbogenberg – mit Reise-Kontext für jede Karte.",
        "🍽️ Inklusive Essen & Kultur: Ceviche, Lomo Saltado, Pisco Sour, Cuy, Chicha Morada, Alpaka-Markt, Soles handeln und ein Quechua-Gruß (¡Allillanchu!).",
        "🚪 Zwei neue Real-Life-Mutproben (Peru-Spezial): Ceviche bestellen und nach Kokatee gegen die Höhe fragen.",
      ],
      itemsEn: [
        "🇵🇪 New section “Peru” with 45 location-specific cards along the classic route: Lima, altitude & coca tea (soroche), Arequipa & Colca Canyon (condors), Lake Titicaca/Puno (floating islands), Cusco & the Sacred Valley, Machu Picchu, the Rainbow Mountain – with travel context for every card.",
        "🍽️ Including food & culture: ceviche, lomo saltado, pisco sour, cuy, chicha morada, alpaca market, haggling over soles and a Quechua greeting (¡Allillanchu!).",
        "🚪 Two new Real-Life challenges (Peru special): ordering ceviche and asking for coca tea against the altitude.",
      ],
    },
    {
      version: "1.36.0",
      date: "2026-06-15",
      title: "Kolumbien-Paket: Kaffeeregion ergänzt (Salento & Valle del Cocora)",
      titleEn: "Colombia pack: coffee region added (Salento & Valle del Cocora)",
      items: [
        "☕ 14 neue Kolumbien-Karten für die Kaffeezone: nach Salento kommen, der Willys-Jeep ins Valle del Cocora, Wachspalmen, Kaffeetour & -verkostung auf der Finca, Forelle (trucha), Aussichtspunkte, Kolibris und ein Tejo-Abend.",
        "🗺️ Damit hat jede typische Kolumbien-Reisestation (Bogotá, Kaffeeregion, Medellín, Karibikküste, Cartagena) ihr eigenes Reise-Vokabular – mit Kontext für jede Karte.",
        "🚪 Neue Real-Life-Mutprobe: auf einer Finca nach einer Kaffeetour fragen.",
      ],
      itemsEn: [
        "☕ 14 new Colombia cards for the coffee zone: getting to Salento, the Willys jeep into the Valle del Cocora, wax palms, a coffee tour & tasting on the finca, trout (trucha), viewpoints, hummingbirds and a tejo evening.",
        "🗺️ With this, every typical Colombia travel stop (Bogotá, coffee region, Medellín, Caribbean coast, Cartagena) has its own travel vocabulary – with context for every card.",
        "🚪 New Real-Life challenge: asking about a coffee tour on a finca.",
      ],
    },
    {
      version: "1.35.0",
      date: "2026-06-15",
      title: "Bessere Lesbarkeit im Dunkelmodus",
      titleEn: "Better readability in dark mode",
      items: [
        "🌙 Knöpfe und Badges mit farbiger Fläche (z. B. „Lernrunde starten“, Pre-Trip-Etappen, Hostel-Punktestand) bekommen im Dunkelmodus dunklen statt hellen Text – jetzt durchgängig WCAG-AA-konform lesbar.",
      ],
      itemsEn: [
        "🌙 Buttons and badges with a colored fill (e.g. “Start learning round”, Pre-Trip stages, hostel score) now get dark instead of light text in dark mode – now consistently readable to WCAG-AA standard.",
      ],
    },
    {
      version: "1.34.0",
      date: "2026-06-15",
      title: "Pre-Trip-Plan: in 7 Etappen reisefertig",
      titleEn: "Pre-Trip plan: travel-ready in 7 stages",
      items: [
        "🗓️ Neuer Pre-Trip-Plan unter Entdecken: ein geordneter, mehrtägiger Onboarding-Pfad für Kolumbien (Begrüßung, Taxi, Unterkunft, Essen, Geld, Unterwegs, Ausgehen) – die nächste Etappe öffnet sich, sobald du die aktuelle geschafft hast.",
        "🚪 Jede Etappe mit kuratierten Karten und einer passenden Real-Life-Mutprobe.",
        "🧳 Neuer Ruta-Pass-Stempel „Reisefertig“, wenn alle 7 Etappen geschafft sind.",
      ],
      itemsEn: [
        "🗓️ New Pre-Trip plan under Discover: an ordered, multi-day onboarding path for Colombia (greeting, taxi, accommodation, food, money, getting around, going out) – the next stage opens once you've completed the current one.",
        "🚪 Each stage with curated cards and a matching Real-Life challenge.",
        "🧳 New Ruta-Pass stamp “Travel-ready” when all 7 stages are done.",
      ],
    },
    {
      version: "1.33.0",
      date: "2026-06-15",
      title: "Coordinator-Schnellstart: 5-Minuten-Icebreaker",
      titleEn: "Coordinator quick start: 5-minute icebreaker",
      items: [
        "⚡ Neue Karte im Modo Hostal: „5-Minuten-Icebreaker“ startet auf einen Tap eine kurze 6-Runden-Kennenlern-Battle – ganz ohne Setup.",
        "🧑‍🏫 Gedacht für Reiseleiter, Hostel-Personal und Lehrkräfte, die einer Gruppe in Sekunden eine Sprach-Aktivität geben wollen.",
      ],
      itemsEn: [
        "⚡ New card in Modo hostal: “5-minute icebreaker” starts a short 6-round getting-to-know-you battle in one tap – no setup at all.",
        "🧑‍🏫 Meant for tour leaders, hostel staff and teachers who want to give a group a language activity in seconds.",
      ],
    },
    {
      version: "1.32.0",
      date: "2026-06-15",
      title: "Mehr Real-Life Challenges: 30 statt 10",
      titleEn: "More Real-Life Challenges: 30 instead of 10",
      items: [
        "🚪 20 neue Real-Life Challenges (jetzt 30) – Essen bestellen, Preis fragen, nach dem Weg fragen, Gruppen-Icebreaker, Apotheke, plus Kolumbien-Spezial (Tinto bestellen, ¿quiubo? begrüßen, Tanzschritt lernen).",
        "🗣️ Neuer Ruta-Pass-Stempel „Straßen-Spanisch“ für 10 abgehakte Challenges.",
        "🎯 Ideal als Unterrichts-/Gruppenaufgabe: kleine Mutproben, die vom Klassenzimmer in echte Situationen führen.",
      ],
      itemsEn: [
        "🚪 20 new Real-Life Challenges (now 30) – ordering food, asking the price, asking for directions, group icebreakers, the pharmacy, plus Colombia specials (ordering a tinto, greeting with ¿quiubo?, learning a dance step).",
        "🗣️ New Ruta-Pass stamp “Street Spanish” for 10 completed challenges.",
        "🎯 Ideal as a classroom/group task: small challenges that lead from the classroom into real situations.",
      ],
    },
    {
      version: "1.31.0",
      date: "2026-06-15",
      title: "Pre-Arrival-Preset: die wichtigsten Sätze auf einen Tap",
      titleEn: "Pre-Arrival preset: the most important phrases in one tap",
      items: [
        "🇨🇴 Neue Dashboard-Kachel „Pre-Arrival Kolumbien“ – ein Tap startet die 20 wichtigsten Sätze für die Ankunft (Begrüßung, Taxi, Unterkunft, Essen, Geld, Sicherheit).",
        "🎯 Kuratierte, benannte Karten-Auswahl statt freiem Filter – ideal zur Reisevorbereitung oder als Einstieg für Sprachschüler und Reisegruppen.",
      ],
      itemsEn: [
        "🇨🇴 New dashboard tile “Pre-Arrival Colombia” – one tap starts the 20 most important phrases for arrival (greeting, taxi, accommodation, food, money, safety).",
        "🎯 A curated, named selection of cards instead of a free filter – ideal for trip preparation or as a starting point for language students and travel groups.",
      ],
    },
    {
      version: "1.30.0",
      date: "2026-06-15",
      title: "Kolumbien-Paket: 75 ortsspezifische Reise-Karten",
      titleEn: "Colombia pack: 75 location-specific travel cards",
      items: [
        "🇨🇴 Neuer Bereich „Kolumbien“ mit 75 Karten für echte Situationen in Cartagena, Medellín, Bogotá und an der Karibikküste – mit Reise-Kontext für jede Karte.",
        "🗺️ Von Flughafen-Taxi, Unterkunft und Islas-del-Rosario-Boot über Bandeja Paisa, Tinto und Aguardiente bis zu kolumbianischem Slang (parce, bacano, a la orden, ¡de una!) und Salsa-/Champeta-Abenden.",
        "🎒 Erstes Destination-Pack – Grundlage für Sprachschul-, Gruppenreise- und Hostel-Angebote.",
      ],
      itemsEn: [
        "🇨🇴 New section “Colombia” with 75 cards for real situations in Cartagena, Medellín, Bogotá and on the Caribbean coast – with travel context for every card.",
        "🗺️ From airport taxi, accommodation and the Islas del Rosario boat to bandeja paisa, tinto and aguardiente, all the way to Colombian slang (parce, bacano, a la orden, ¡de una!) and salsa/champeta nights.",
        "🎒 First destination pack – the foundation for language-school, group-travel and hostel offerings.",
      ],
    },
    {
      version: "1.29.0",
      date: "2026-06-15",
      title: "Historia-Modul als Ganzes teilen",
      titleEn: "Share the Historia module as a whole",
      items: [
        "📤 Neues Sharepic auf Modul-Ebene: „Historia de Sudamérica“ lässt sich jetzt komplett weiterempfehlen – ein Bild mit Modulname, Einleitung und einem Zeitstrahl-Teaser der Epochen, in 1:1 oder 9:16 (Story). Der „Modul teilen“-Knopf sitzt oben direkt unter der Bereichs-Navigation.",
      ],
      itemsEn: [
        "📤 New module-level sharepic: “Historia de Sudamérica” can now be recommended in full – an image with the module name, intro and a timeline teaser of the eras, in 1:1 or 9:16 (Story). The “Share module” button sits at the top, right below the section navigation.",
      ],
    },
    {
      version: "1.28.0",
      date: "2026-06-15",
      title: "Historia de Sudamérica: die große Geschichte",
      titleEn: "Historia de Sudamérica: the big story",
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
        "📜 New explainer page under Discover (and as a banner in “Países y culturas”): the whole history of South America at a glance – from the Inca through the Spanish conquest and the colonial era to Bolívar, San Martín and independence.",
        "🕰️ Interactive timeline: seven expandable eras – advanced civilizations, the Conquista, the viceroyalties & silver, the spark (Napoleon & the juntas), the fight for freedom, the split into many nations and the path to today. Each era with an image from Wikimedia, key points and an explanation.",
        "👤 Gallery of the protagonists: Bolívar, San Martín, Sucre, O'Higgins, Manuela Sáenz and Atahualpa – with portrait, dates of life and a quote.",
        "📰 “Today: situation & tensions”: current conflicts explained clearly – the Venezuela crisis & mass exodus, the border dispute over Essequibo, Bolivia's access to the sea, Colombia's peace process, Peru's permanent political crisis, Argentina's change of course, the Amazon & indigenous rights and the Darién.",
        "📖 Reading practice in Spanish: each era also comes as a Spanish reading text. Difficult words are marked – tap to see the translation. Each text has a word list for quick reference, neatly split into “worth taking along” and “not so important”.",
        "📊 A difficulty score (CEFR A1–C1) per text for self-assessment, plus “Show full translation” and a shareable sharepic of the text & word list.",
        "🧩 Mini-quiz per era: read the Spanish word, tap the correct translation – with instant feedback (right/wrong).",
        "📖 Reading practice now everywhere: each protagonist and each “Today” card also has an expandable Spanish reading text with tappable vocabulary, a word list and a sharepic.",
        "💡 “¿Sabías que…?” snippets and bilingual throughout (German/English).",
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
        "🔍 New search: tap “Search …” at the top (in the Learn and Discover tabs) and find exactly what you need – vocabulary cards, whole topics and exercises under “Exercises”, country facts, travel etiquette, Logística and Salud under “Information”. It searches in both German and Spanish and is forgiving with accents (“nino” finds “niño”, “mexico” finds “México”).",
        "🧭 Hits lead straight to the target: a card opens its detail page (with ‹ back to the search), a topic starts the learning round, a country opens the country facts right at the correct entry.",
        "⬆️ Clean scrolling when switching: if you open a category or exercise from a list scrolled further down, the new page now reliably starts at the top – instead of inheriting the old scroll position.",
        "🎒 Salud y energía expanded: new tip block “Excursions & long rides” – always keep some sugar on you (circulation!), bring your own snacks despite “meals included”, a mini travel first-aid kit (painkiller & travel-sickness tablet, plasters – especially important for women) and something long-sleeved against ice-cold bus air conditioning. Plus matching pharmacy phrases and terms.",
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
        "🥗 New Discover module for staying healthy on the road: eating a balanced diet instead of just street food (getting protein, fiber, vitamins on purpose), making your own breakfast – porridge with protein powder & fruit, with no kitchen at all.",
        "💧 Drinking cheaply & with flavor: zero syrup and electrolyte powder (suero) liven up cheap water, save money and make up for the sweating. Plus tips on stomach & digestion, sun/altitude/mosquitoes and exercise – plus a “healthy-on-the-road kit”.",
        "💬 With the matching phrases as cards: shopping healthily, ordering healthier (“a la plancha, no frito”), asking about yoga & a gym day pass and asking at the pharmacy for suero, sunscreen & co.",
        "🏋️ Staying active without a studio membership: some hostels offer yoga, and in bigger cities the gym often has a cheap day pass – a good experience, because that's where the locals train.",
        "📅 Logística de viaje expanded: a tip on planning ahead – book popular hostels and scarce spots earlier in high season.",
      ],
    },
    {
      version: "1.25.0",
      date: "2026-06-14",
      title: "Logística de viaje: clever & sicher ankommen",
      titleEn: "Logística de viaje: arrive smart & safe",
      items: [
        "🧳 Neues Modul unter Entdecken: die praktischen Handgriffe, die kein Sprachkurs lehrt – SIM-Karte (chip) kaufen & online sein, Geld wechseln und am cajero abheben (ohne teure Umrechnung), Geld & Wertsachen auf mehrere Gepäckstücke aufteilen, das Gepäck per Tracker (AirTag & Co.) im Blick behalten.",
        "✈️ Handgepäck-Notfallset als Packliste: das Wichtigste – Medikamente, Wechselwäsche, Hygiene, Powerbank, Dokumente – kommt ins Handgepäck, falls der große Rucksack später (oder gar nicht) ankommt.",
        "💬 Dazu die passenden Sätze als Karten: nach SIM, Geld und verlorenem Gepäck fragen – jeweils auf Spanisch mit Übersetzung.",
      ],
      itemsEn: [
        "🧳 New module under Discover: the practical know-how no language course teaches – buying a SIM card (chip) & getting online, changing money and withdrawing at the cajero (without expensive conversion), splitting money & valuables across several bags, keeping an eye on your luggage with a tracker (AirTag & co.).",
        "✈️ A carry-on emergency kit as a packing list: the essentials – medication, a change of clothes, hygiene, a power bank, documents – go in your carry-on, in case the big backpack arrives later (or not at all).",
        "💬 Plus the matching phrases as cards: asking about a SIM, money and lost luggage – each in Spanish with translation.",
      ],
    },
    {
      version: "1.24.0",
      date: "2026-06-13",
      title: "Trip-Ziel: gleich zu Beginn gesetzt, im Profil verwaltet",
      titleEn: "Trip goal: set right at the start, managed in the profile",
      items: [
        "🧭 Beim allerersten Start fragt dich HolaRuta jetzt nach deinem Trip-Ziel – Reisedatum und Tagespensum sind in einem Schritt gesetzt (oder per „Später“ übersprungen).",
        "🎯 Das Dashboard bleibt ruhig: Die Trip-Karte mit Countdown erscheint nur noch, wenn ein Ziel gesetzt ist. Ein Tap darauf führt direkt zur Verwaltung.",
        "👤 Anlegen, Ändern und Löschen des Trip-Ziels wohnt jetzt gebündelt im Profil-Reiter.",
      ],
      itemsEn: [
        "🧭 On the very first launch, HolaRuta now asks for your trip goal – travel date and daily target are set in one step (or skipped with “Later”).",
        "🎯 The dashboard stays calm: the trip card with countdown now only appears when a goal is set. One tap on it leads straight to management.",
        "👤 Creating, changing and deleting the trip goal now lives bundled together in the Profile tab.",
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
        "⚙️ The settings are tidied up: the level selector (All, A1, A2, B1) now sits directly on the dashboard – after all, you change it constantly while learning. Language, mode, direction and speaking speed live bundled together in the Profile tab.",
        "✨ New versions now arrive on their own: as soon as one is ready, a “New version – load now” banner appears at the bottom. One tap reloads the app fresh – you no longer have to close it completely for that.",
      ],
    },
    {
      version: "1.22.0",
      date: "2026-06-13",
      title: "Zurück-Wischen führt zurück, statt die App zu schließen",
      titleEn: "Swiping back goes back, instead of closing the app",
      items: [
        "↩️ Die Zurück-Geste (Wischen vom Bildschirmrand bzw. die Zurück-Taste) bringt dich jetzt Schritt für Schritt eine Ebene höher – aus einer Übung zurück zur Auswahl und von dort aufs Dashboard – statt die App sofort zu schließen.",
        "🏠 Erst wenn du wieder auf dem Dashboard bist, verlässt die nächste Zurück-Geste die App. Offene Einblendungen (z. B. der Spickzettel-Großbildschirm oder der Update-Hinweis) schließt Zurück zuerst.",
      ],
      itemsEn: [
        "↩️ The back gesture (swiping from the screen edge or the back button) now takes you up one level step by step – from an exercise back to the selection and from there to the dashboard – instead of immediately closing the app.",
        "🏠 Only once you're back on the dashboard does the next back gesture leave the app. Open overlays (e.g. the full-screen cheat sheet or the update notice) are closed by Back first.",
      ],
    },
    {
      version: "1.21.0",
      date: "2026-06-13",
      title: "Wochentage: je ein Tag, eine Karte",
      titleEn: "Days of the week: one day, one card each",
      items: [
        "📅 Die Wochentage stecken nicht mehr gebündelt in drei Karten (Montag/Dienstag, Mittwoch/Donnerstag, Freitag/Samstag/Sonntag), sondern haben jede einen eigenen Eintrag – von lunes bis domingo. So lernst (und prüfst) du jeden Tag wirklich einzeln, statt mit einem Wort eine ganze Gruppe „richtig“ abzuhaken.",
        "🧭 Jeder Wochentag bekommt einen eigenen Reise-Kontext mit Beispielsatz und Tipp.",
      ],
      itemsEn: [
        "📅 The days of the week are no longer bundled into three cards (Monday/Tuesday, Wednesday/Thursday, Friday/Saturday/Sunday) but each have their own entry – from lunes to domingo. That way you really learn (and test) each day individually, instead of marking a whole group as “correct” with a single word.",
        "🧭 Each day of the week gets its own travel context with an example sentence and a tip.",
      ],
    },
    {
      version: "1.20.0",
      date: "2026-06-12",
      title: "Diálogos: längere Gespräche & runderer Ablauf",
      titleEn: "Diálogos: longer conversations & a smoother flow",
      items: [
        "💬 Alle Diálogos sind jetzt deutlich länger – aus drei kurzen Wortwechseln werden vollständige Gespräche mit sieben bis neun Repliken: einchecken samt Zimmerwahl und Frühstücksfrage, im Taxi plaudern, auf dem Markt richtig feilschen, an der Grenze Schritt für Schritt durch die Kontrolle.",
        "🧭 Neu: Schrittanzeige über dem Verlauf („Schritt 4 von 17“) – so siehst du jederzeit, wie weit das Gespräch noch geht.",
        "👇 Der gerade aktive Zug rückt automatisch ins Bild, und beim Frei-Tippen springt der Cursor direkt ins Feld – kein Scrollen und kein Extra-Tipp mehr nötig.",
        "💡 Neu: „Tipp anzeigen“ beim Selbst-Tippen blendet die Musterantwort als Hilfe ein, wenn du mal nicht weiterweißt.",
      ],
      itemsEn: [
        "💬 All Diálogos are now noticeably longer – three short exchanges become full conversations with seven to nine lines: checking in including room choice and the breakfast question, chatting in the taxi, haggling properly at the market, going step by step through border control.",
        "🧭 New: a step indicator above the conversation (“Step 4 of 17”) – so you can always see how far the conversation still has to go.",
        "👇 The currently active turn automatically scrolls into view, and when typing freely the cursor jumps straight into the field – no more scrolling and no extra tap needed.",
        "💡 New: “Show hint” when typing yourself reveals the model answer as help when you're stuck.",
      ],
    },
    {
      version: "1.19.0",
      date: "2026-06-12",
      title: "Diálogos, Conjugador, Sprechtempo & Trip-Ziel",
      titleEn: "Diálogos, Conjugador, speaking speed & trip goal",
      items: [
        "💬 Neu: Diálogos – spiel echte Reisegespräche Zug für Zug durch (Hotel-Check-in, Restaurant, Busticket, Taxi, Markt, Apotheke, Hostel, Grenze, Notfall, Wegfrage). Die Gegenseite spricht, du antwortest per Auswahl oder tippst die Schlüsselsätze selbst.",
        "🔁 Neu: Conjugador – Verben aktiv konjugieren statt nur lesen: „ir – wir“ → tippe „vamos“. Zwei Stufen (nur regelmäßige Muster oder mit unregelmäßigen Reiseverben), mit Punktestand. Auf der Conjugación-Seite startbar.",
        "🐢 Neu: Sprechtempo wählbar (Langsam · Normal · Schnell) in den Einstellungen – langsamer zum Nachsprechen, schneller fürs echte Busbahnhof-Tempo. Gilt für Hören, Precios und Diálogos.",
        "🎯 Neu: Trip-Ziel – setz dein Reisedatum und ein Tagesziel; die Startseite zeigt Countdown und „X/Y heute“. Stärkt die Lern-Serie bis zur Abreise.",
      ],
      itemsEn: [
        "💬 New: Diálogos – play through real travel conversations turn by turn (hotel check-in, restaurant, bus ticket, taxi, market, pharmacy, hostel, border, emergency, asking for directions). The other side speaks, you reply by choosing an option or type the key phrases yourself.",
        "🔁 New: Conjugador – actively conjugate verbs instead of just reading: “ir – we” → type “vamos”. Two levels (regular patterns only, or with irregular travel verbs), with a score. Can be started from the Conjugación page.",
        "🐢 New: selectable speaking speed (Slow · Normal · Fast) in the settings – slower for repeating after it, faster for real bus-station pace. Applies to Listening, Precios and Diálogos.",
        "🎯 New: trip goal – set your travel date and a daily target; the home page shows a countdown and “X/Y today”. Strengthens the learning streak until departure.",
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
        "👉 When sharing from a phone, the real, clickable “Learn along now” link is in the accompanying text – directly tappable in WhatsApp, Telegram & co. (A PNG itself can't contain a clickable link.)",
      ],
    },
    {
      version: "1.17.0",
      date: "2026-06-12",
      title: "Ruta-Pass: Stempel als Sharepic teilen",
      titleEn: "Ruta-Pass: share stamps as a sharepic",
      items: [
        "🎖️ Jeden freigeschalteten Stempel kannst du jetzt direkt aus dem Ruta-Pass als Bild teilen – über den neuen „📤 Teilen“-Knopf auf der Stempel-Kachel.",
        "Das Sharepic zeigt deinen Stempel wie einen echten Reisestempel im Pass: großes Medaillon mit Emoji, Name, Freischalt-Text und deinem Sammelstand – in 1:1 oder 9:16 (Story).",
      ],
      itemsEn: [
        "🎖️ You can now share each unlocked stamp directly from the Ruta-Pass as an image – via the new “📤 Share” button on the stamp tile.",
        "The sharepic shows your stamp like a real travel stamp in the pass: a big medallion with emoji, name, unlock text and your collection count – in 1:1 or 9:16 (Story).",
      ],
    },
    {
      version: "1.16.0",
      date: "2026-06-12",
      title: "Spickzettel: bessere Auswahl, Großanzeige & Sprungleiste",
      titleEn: "Cheat sheet: better selection, large display & jump bar",
      items: [
        "🆘 Die Sätze sind jetzt kuratiert statt „die ersten der Kategorie“: Bei Notfall stehen „Hilfe!“, „Necesito un médico“ und „Llame a la policía“ ganz oben, bei Wegbeschreibung echte Survival-Fragen wie „¿Cómo llego al centro?“ statt nur Vokabeln.",
        "👁️ Satz antippen zeigt ihn bildschirmfüllend in Riesenschrift – zum Herzeigen, wenn Reden nicht reicht. Tippen daneben (oder Escape) schließt wieder.",
        "🧭 Neue Sprungleiste oben: ein Tipp auf Notfall, Grundlagen, Wegbeschreibung oder Geld springt direkt zum Bereich.",
        "Jeder Satz erscheint höchstens einmal auf dem Zettel – auch wenn er in mehreren Bereichen passt.",
      ],
      itemsEn: [
        "🆘 The phrases are now curated instead of “the first ones in the category”: for Emergency, “Help!”, “Necesito un médico” and “Llame a la policía” are at the top; for Directions, real survival questions like “¿Cómo llego al centro?” instead of just vocabulary.",
        "👁️ Tapping a phrase shows it full-screen in giant letters – to hold up when talking isn't enough. Tapping next to it (or Escape) closes it again.",
        "🧭 New jump bar at the top: one tap on Emergency, Basics, Directions or Money jumps straight to that section.",
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
        "✅ The shopping list now works like a real list: using the box on the left you check off what's done – and you can undo the check at any time. Before, a word could only be tapped but not unchecked.",
        "Tapping and checking off are separate: expanding a word (pronunciation, travel tip, read-aloud) no longer checks it off automatically – so you can look things up without messing up the list.",
        "🗣️ New for each word, two ready-to-use questions for the shop – whether they have it («¿Tienen …?») and where to find it («¿Dónde puedo encontrar …?») – with translation and 🔊 to read aloud.",
      ],
    },
    {
      version: "1.14.0",
      date: "2026-06-12",
      title: "Regatear: gut verhandeln & feilschen",
      titleEn: "Regatear: negotiate & haggle well",
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
        "📖 The tactics explained in four expandable blocks: the basic attitude, leading the negotiation, closing the deal (walking away as a tactic) and taxi, tuk-tuk & tours (negotiate the price up front).",
        "🗣️ Glossary of haggling words (regatear, el descuento, la rebaja, precio fijo, la yapa/ñapa, el/la casero/a …).",
        "💬 The most important phrases sorted by phase: asking the price (¿A cuánto la unidad?), haggling (¿Cuánto es lo menos?), closing (Trato hecho), paying & change (¿Tiene cambio de cien?) and finding something (¿Dónde consigo…?).",
        "⚖️ Quantities & units from the market stall: unidad/pieza, docena, par, libra, kilo, litro, montón, manojo … – each with an example sentence.",
        "🌎 Regional differences from country to country: México, Guatemala, Perú & Bolivia (la yapa), Colombia, Argentina, Costa Rica and Cuba.",
        "🎭 Four role-plays for practice: fruit & veg, haggling over a souvenir (chancletas), search first then bargain, and negotiating a taxi fare – dialogues to play out loud in pairs.",
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
        "⏭️ New “Skip” button while learning: anyone who doesn't want to do a card right now removes it from the session without a rating – so no one has to push through every card.",
        "Skipping doesn't count as “known”: the learning state (SRS) stays untouched, and the card is due again next time.",
        "Works in all three modes (🃏 Flashcard, ✍️ Writing, 👂 Listening) – at the desk you can also use the “s” key.",
      ],
    },
    {
      version: "1.12.0",
      date: "2026-06-12",
      title: "Gegenteile: Antonym-Paare lernen",
      titleEn: "Opposites: learn antonym pairs",
      items: [
        "↔️ Neuer Lernbereich „Gegenteile“ mit 26 Antonym-Paaren: groß – klein, teuer – billig, offen – geschlossen, früh – spät, hell – dunkel … – reisetauglich und LatAm-korrekt.",
        "Funktioniert in allen drei Modi (🃏 Karteikarte, ✍️ Schreiben, 👂 Hören) und in beiden Richtungen (DE→ES und ES→DE) – beim Schreiben zählt jede Seite des Paares.",
        "Jede Karte mit Aussprache-Tipp und 🧭 Reise-Kontext: ein echter Satz, der beide Gegenteile gegenüberstellt (z. B. „El bus sale temprano y llega tarde.“).",
      ],
      itemsEn: [
        "↔️ New learning section “Opposites” with 26 antonym pairs: big – small, expensive – cheap, open – closed, early – late, light – dark … – travel-ready and LatAm-correct.",
        "Works in all three modes (🃏 Flashcard, ✍️ Writing, 👂 Listening) and in both directions (DE→ES and ES→DE) – when writing, each side of the pair counts.",
        "Each card with a pronunciation tip and 🧭 travel context: a real sentence that contrasts both opposites (e.g. “El bus sale temprano y llega tarde.”).",
      ],
    },
    {
      version: "1.11.0",
      date: "2026-06-12",
      title: "Precios al oído: deutlich mehr & größere Preise",
      titleEn: "Precios al oído: many more & larger prices",
      items: [
        "💵 Der Preis-Hörtrainer erzeugt Beträge jetzt frisch in jeder Runde, statt aus einer Handvoll fester Karten zu ziehen – beliebig viele, abwechslungsreiche und auch richtig krumme Preise.",
        "🇨🇴 Große Zahlen wie im echten Reisealltag: Vorab wählst du ein Land/Währung – Kolumbien (Pesos in Millionenhöhe), Chile, Argentinien, Costa Rica, Mexiko, Peru und Guatemala – jeweils grammatisch sauber gesprochen (un millón quinientos mil, veintiún mil, „de pesos“ nur bei vollen Millionen …).",
        "🎚️ Drei Schwierigkeitsstufen je Land: von Kleingeld (Kaffee, Snacks) über den Alltag (Essen, Hostel, kurze Fahrten) bis zu großen Beträgen (Fernbus, Tour, Miete).",
        "Tippen bleibt entspannt: Punkte, Leerzeichen und Währungszeichen werden ignoriert – nur die Ziffern zählen.",
        "🤑 Neuer Ruta-Pass-Stempel „Millonario de oído“ für eine fehlerfreie Runde auf der Stufe „Große Beträge“.",
      ],
      itemsEn: [
        "💵 The price-listening trainer now generates amounts fresh in every round, instead of drawing from a handful of fixed cards – any number of varied and even properly odd prices.",
        "🇨🇴 Big numbers as in real travel life: you first pick a country/currency – Colombia (pesos in the millions), Chile, Argentina, Costa Rica, Mexico, Peru and Guatemala – each spoken grammatically correctly (un millón quinientos mil, veintiún mil, “de pesos” only for full millions …).",
        "🎚️ Three difficulty levels per country: from small change (coffee, snacks) through everyday amounts (food, hostel, short rides) to big sums (long-distance bus, tour, rent).",
        "Typing stays relaxed: dots, spaces and currency symbols are ignored – only the digits count.",
        "🤑 New Ruta-Pass stamp “Millonario de oído” for a flawless round on the “Big amounts” level.",
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
        "🚽 New in travel etiquette (culture & etiquette): in many countries toilet paper goes in the bin (papelera) next to the toilet, not in the WC – the pipes are often too narrow (sign: “No arrojar papeles ni toallas sanitarias”).",
        "Ecuador accent added: a note about the papelera instead of the WC.",
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
        "🧭 New section under Discover: “Travel etiquette” with do's & don'ts for behavior while traveling – hostel & dorm, bus & transport, groups & people as well as culture & etiquette.",
        "Practical rules of thumb: quiet hours in the dorm, light/noise, valuables on the bus, how to approach people on the road, tipping and greetings.",
        "Per-country specifics (“accents”) for all 19 countries – e.g. “chicken buses” in Guatemala, voseo & mate etiquette in Argentina, “pura vida” in Costa Rica or casas particulares in Cuba.",
        "The chosen country is linked to the country facts: select once, fitting everywhere.",
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
        "🛒 New under Discover: “Shopping list” – your travel needs in Spanish in three categories (Supermercado, Ropa, Farmacia).",
        "Tap what you need: the word, pronunciation and travel tip appear, the word is read aloud and checked off on the list (stays remembered).",
        "Afterwards you test yourself in a short quiz: “You need …” → choose the matching Spanish word, with evaluation.",
        "LatAm-correct: curitas, medias, lentes de sol, repelente & co. – plus classics like toilet paper, sunscreen and “algo para la diarrea”.",
      ],
    },
    {
      version: "1.8.0",
      date: "2026-06-12",
      title: "Zeiten: neuer Bereich + große Erklärseite",
      titleEn: "Tenses: new section + big explainer page",
      items: [
        "Neuer Lernbereich „⏳ Zeiten“ mit 66 Karten: echte Reisesätze in Vergangenheit, Gegenwart und Zukunft (Llegué ayer, Ya he comido, Voy a tomar el bus, Llegaré mañana …), dazu die Verlaufsform (Estoy comiendo), Imperativ-Bitten (Dígame, Tráigame la cuenta), „es gibt“ (¿Hay wifi?) und höfliche Bitten (Querría, ¿Podría?).",
        "Neu unter Entdecken: „Tiempos“ erklärt ausführlich und durchweg reisebezogen, wie die spanischen Zeitformen funktionieren – ein Verb (tomar) wandert durch alle Zeiten; jede Zeitform mit Bildungs-Rezept, Signalwörtern und mehreren Reise-Beispielen. Dazu die Verlaufsform (estar + Gerundio), der Vergleich Indefinido vs. Imperfecto, die häufigsten unregelmäßigen Vergangenheiten und Partizipien, der Imperativ, „hay/había/habrá“, eine Situations-Zuordnung, häufige Stolperfallen und drei Reisedialoge. Von dort geht es mit „Jetzt üben“ direkt in die Karten.",
        "LatAm-tauglich: Fokus auf indefinido fürs Erzählen und „ir a + Infinitiv“ als einfacher Zukunfts-Trick.",
        "Neuer Ruta-Pass-Stempel „Maestro del Tiempo“ für 80 % gemeisterte Zeiten-Karten.",
      ],
      itemsEn: [
        "New learning section “⏳ Tenses” with 66 cards: real travel sentences in the past, present and future (Llegué ayer, Ya he comido, Voy a tomar el bus, Llegaré mañana …), plus the continuous form (Estoy comiendo), imperative requests (Dígame, Tráigame la cuenta), “there is” (¿Hay wifi?) and polite requests (Querría, ¿Podría?).",
        "New under Discover: “Tiempos” explains in detail and consistently travel-related how the Spanish tenses work – one verb (tomar) travels through all the tenses; each tense with a formation recipe, signal words and several travel examples. Plus the continuous form (estar + Gerundio), the comparison Indefinido vs. Imperfecto, the most common irregular pasts and participles, the imperative, “hay/había/habrá”, a situation-matching exercise, common pitfalls and three travel dialogues. From there, “Practice now” takes you straight into the cards.",
        "LatAm-suitable: a focus on indefinido for narrating and “ir a + Infinitiv” as a simple future trick.",
        "New Ruta-Pass stamp “Maestro del Tiempo” for 80% mastered tense cards.",
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
        "🧱 Frases flexibles greatly expanded: 49 sentence frames (instead of 8) across 7 travel topics – En la ruta, En el hostal, Comida y bebida, Compras y dinero, Salud y emergencias, Conocer gente and Orientarse.",
        "New topic selection before the round (as in Definiciones): pick a situation – or “🎲 Mixed” for all sentences across the board.",
        "New Ruta-Pass stamp “🏛️ Constructor experto”: complete each topic at least once.",
      ],
    },
    {
      version: "1.6.0",
      date: "2026-06-12",
      title: "Konjugieren: neuer Bereich + Erklärseite",
      titleEn: "Conjugating: new section + explainer page",
      items: [
        "Neuer Lernbereich „🔁 Konjugieren“ mit 42 Karten: die Präsens-Formen der wichtigsten Reiseverben (ir, estar, ser, tener, poder, querer, seguir, doblar …) – genau das, was man z. B. für Wegbeschreibungen braucht.",
        "Neu unter Entdecken: „Conjugación“ erklärt kurz und reisetauglich, wie spanische Verben gebeugt werden – Personen, die drei regelmäßigen Muster (-ar/-er/-ir), die wichtigsten unregelmäßigen Verben und ein Wegbeschreibungs-Dialog. Von dort geht es mit „Jetzt üben“ direkt in die neuen Karten.",
        "LatAm-korrekt: Tabellen mit ustedes statt vosotros.",
        "Neuer Ruta-Pass-Stempel „Verbo-Virtuose“ für 80 % gemeisterte Konjugieren-Karten.",
      ],
      itemsEn: [
        "New learning section “🔁 Conjugating” with 42 cards: the present-tense forms of the most important travel verbs (ir, estar, ser, tener, poder, querer, seguir, doblar …) – exactly what you need for directions, for example.",
        "New under Discover: “Conjugación” explains briefly and travel-ready how Spanish verbs are conjugated – persons, the three regular patterns (-ar/-er/-ir), the most important irregular verbs and a directions dialogue. From there, “Practice now” takes you straight into the new cards.",
        "LatAm-correct: tables with ustedes instead of vosotros.",
        "New Ruta-Pass stamp “Verbo-Virtuose” for 80% mastered conjugating cards.",
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
        "👂 New learning mode “Listening”: the app speaks the Spanish answer aloud, you type what you hear – trains your comprehension of real LatAm Spanish (only if your device can do speech output).",
        "🆘 Cheat sheet: the most important phrases (emergency, basics, directions, money) instantly large and read aloud – quick to look up, without learning.",
        "💵 Precios al oído: hear a price in Spanish and type the number – practice for understanding spoken amounts at the bus station.",
        "🧱 Frases flexibles: sentence builder – fill the gap in the sentence frame with the matching building block.",
        "🗺️ Ruta del día: one tap for a short daily round across all topics – plus a route map of your progress in the statistics.",
      ],
    },
    {
      version: "1.4.3",
      date: "2026-06-12",
      title: "Battle: fairer, mehr Inhalt, Stichrunde",
      titleEn: "Battle: fairer, more content, tiebreaker round",
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
        "Optional player names – they appear in the score, on the turn and in the evaluation.",
        "Tiebreaker round on a tie: two extra rounds determine a winner after all.",
        "The scene selection now shows the real number of rounds for the chosen length instead of just the number of tasks.",
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
        "Hostel Battle: before the start there's now a short “How a battle works” walkthrough in four steps (in pairs, answer, rate, take turns) – expandable and open the first time. This makes it immediately clear that you play in pairs, pass the phone around and your partner rates with ✅/😬/❌.",
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
        "“Speaking” is now called “🃏 Flashcard” – more honest, because there's no test here: you think or say the answer, flip it over and rate yourself (like a real flashcard). Testing only happens in the “Writing” mode.",
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
        "New: after an update, HolaRuta briefly shows what has changed the next time you open it – and how you always get the latest version.",
      ],
    },
    {
      version: "1.3.0",
      date: "2026-06-11",
      title: "Hostel Mode, Quiz & Farben",
      titleEn: "Hostel Mode, quiz & colors",
      items: [
        "Hostel Mode: Battle & Rollenspiele zum Üben zu zweit.",
        "Definiciones: neues Zuordnen-Quiz.",
        "Farben mit echtem Farbfeld und 576 Karten in 20 Bereichen.",
      ],
      itemsEn: [
        "Hostel Mode: battle & role-plays to practice in pairs.",
        "Definiciones: new matching quiz.",
        "Colors with a real color swatch and 576 cards in 20 sections.",
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
