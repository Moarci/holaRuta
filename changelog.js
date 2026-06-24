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
 * Payload: nur die jüngsten Einträge bleiben hier inline (die App zeigt ohnehin
 * nur `since(seenVersion)`). Der vollständige, zweisprachige Verlauf steht in
 * docs/CHANGELOG.md; nach dem Anwachsen erneut auslagern via
 * `node scripts/trim-changelog.mjs`.
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
      version: "1.118.0",
      date: "2026-06-24",
      title: "Café-Modul: Geschichte, Schädlinge & Export-Qualität",
      titleEn: "Café module: history, pests & export quality",
      items: [
        "📜 Neues Thema „Geschichte: wann der Kaffee kam“: Kaffee ist kein heimisches Gewächs – er kam erst im 18. Jahrhundert mit den Kolonialmächten, wurde im 19. Jahrhundert zum wichtigsten Exportgut (besiedelte die Berge, finanzierte Eisenbahnen & Städte, prägte die „Kaffeerepubliken“) und ist heute Identität (Paisaje Cultural Cafetero, UNESCO-Welterbe seit 2011).",
        "🐛 Neues Thema „Schädlinge & Krankheiten“: die „broca del café“ (Kaffeekirschenkäfer) kam aus Afrika über Brasilien (um 1913) nach ganz Lateinamerika; dazu der Kaffeerost „la roya“ (großer Ausbruch 2012/13) – beide steigen mit der Klimaerwärmung in immer höhere Lagen.",
        "📦 Neues Thema „Export & was im Land bleibt“: der beste Kaffee geht traditionell in den Export, im Land blieb oft die zweite Wahl („pasilla“, woraus der dünne „tinto“ wurde) – die Spezialitätenwelle bringt guten Kaffee heute zunehmend ins Land zurück.",
        "💬 Dazu eine neue Satzgruppe „Geschichte, Schädlinge & Qualität“ und passende Glossar-Begriffe (la broca, la roya, la pasilla, la exportación, el consumo interno …).",
      ],
      itemsEn: [
        "📜 New topic „History: when coffee arrived“: coffee isn't native – it came with the colonial powers in the 18th century, became the leading export in the 19th (settling the mountains, funding railways & cities, shaping the „coffee republics“), and today is identity (Paisaje Cultural Cafetero, UNESCO World Heritage since 2011).",
        "🐛 New topic „Pests & diseases“: the „broca del café“ (coffee berry borer) came from Africa via Brazil (around 1913) to all of Latin America; plus coffee leaf rust „la roya“ (big 2012/13 outbreak) – both climbing to ever higher elevations as the climate warms.",
        "📦 New topic „Export & what stays in the country“: the best coffee traditionally goes to export while the second choice stayed local („pasilla“, which became the thin „tinto“) – the specialty wave is now bringing good coffee back into the country.",
        "💬 Plus a new phrase group „History, pests & quality“ and matching glossary terms (la broca, la roya, la pasilla, la exportación, el consumo interno …).",
      ],
    },
    {
      version: "1.117.0",
      date: "2026-06-24",
      title: "Neu: Café de la región – Kaffeeanbau & -kultur",
      titleEn: "New: Café de la región – coffee growing & culture",
      items: [
        "☕ Neues Modul „Café de la región“: In weiten Teilen Lateinamerikas ist Kaffee Landschaft, Lebensunterhalt und Stolz. Das Modul erklärt aufklappbar, wie Kaffee wächst (Höhe, Schatten, Arabica vs. Robusta), die Ernte (cosecha, von Hand gepflückte cerezas), die Verarbeitung (lavado, honey, natural), Rösten & Mahlen, die Anbauregionen (kolumbianischer Eje Cafetero, Antigua & Huehuetenango, Tarrazú, Chiapas, Panamas Geisha), den Finca-Besuch und fairen Handel.",
        "📖 In jedem Thema ein spanisches Lesetraining mit antippbaren Vokabeln, Vokabel-Quiz und Schwierigkeits-Score (A2–B1).",
        "💬 Die Sätze als Karten (es/de/en, mit Kopier- und Stern-Knopf fürs „Mi léxico“): Kaffee bestellen (un tinto, sin azúcar), auf der Finca / Kaffeetour, über Geschmack reden (¿lavado, honey o natural?) und Bohnen kaufen & mitnehmen – plus Glossar (grano, cereza, cosecha, tueste, cata …) und ein „Finca-Besuch-Kit“.",
        "🔗 Per Deep-Link (?m=cafe) direkt aufrufbar, in Suche & Entdecken verdrahtet und offline verfügbar.",
      ],
      itemsEn: [
        "☕ New module „Café de la región“: across much of Latin America coffee is landscape, livelihood and pride. The module explains, in expandable topics, how coffee grows (altitude, shade, Arabica vs. Robusta), the harvest (cosecha, hand-picked cerezas), processing (washed, honey, natural), roasting & grinding, the growing regions (Colombia's Eje Cafetero, Antigua & Huehuetenango, Tarrazú, Chiapas, Panama's Geisha), visiting a farm and fair trade.",
        "📖 Every topic has Spanish reading practice with tappable vocab, a vocab quiz and a difficulty score (A2–B1).",
        "💬 The phrases as cards (es/de/en, with a copy and star button for „Mi léxico“): ordering coffee (un tinto, no sugar), on the farm / coffee tour, talking about taste (washed, honey or natural?) and buying & taking beans home – plus a glossary (grano, cereza, cosecha, tueste, cata …) and a „coffee-farm visit kit“.",
        "🔗 Reachable via deep link (?m=cafe), wired into Search & Discover and available offline.",
      ],
    },
    {
      version: "1.116.0",
      date: "2026-06-24",
      title: "Flaggen im Battle & Stern an den Flaggen-Sätzen",
      titleEn: "Flags in the Battle & a star on the flag phrases",
      items: [
        "🚩 Hostel-Battle: neue Szene „Herkunft & Flaggen“ – auf Deutsch ansagen, laut auf Spanisch antworten, zu Herkunft, Flaggen, Farben, Symbolen und Nationalität (z. B. „¿De qué país es esta bandera?“, „¿Qué significan los colores de tu bandera?“). Damit zahlt das Flaggen-Modul jetzt auch aufs Sprachduell zu zweit ein.",
        "⭐ Flaggen-Modul „Saber más“: die „wichtigen Sätze“ tragen jetzt – wie in allen anderen Reise-Modulen – einen Stern-Knopf. Ein Tipp legt den Satz (Spanisch + Übersetzung) in dein „Mi léxico“; erneut tippen nimmt ihn wieder heraus.",
      ],
      itemsEn: [
        "🚩 Hostel Battle: new scene „Origin & flags“ – say it in German, answer out loud in Spanish, about origin, flags, colours, symbols and nationality (e.g. „¿De qué país es esta bandera?“, „¿Qué significan los colores de tu bandera?“). The flag module now feeds the two-player language duel too.",
        "⭐ Flag module „Saber más“: the „key phrases“ now carry a star button – just like every other travel module. One tap saves the phrase (Spanish + translation) to your „Mi léxico“; tap again to remove it.",
      ],
    },
    {
      version: "1.115.0",
      date: "2026-06-24",
      title: "Ruta del día: vor allem Grundlagen statt fast nur Städte-/Länder-Sätze",
      titleEn: "Ruta del día: mostly basics instead of almost only city/country phrases",
      items: [
        "🗺️ Die tägliche Mini-Runde „Ruta del día“ bringt jetzt vor allem Grundlagen und allgemeine Module. Wer mehrere Länder/Städte aktiv hatte, bekam zuvor fast nur orts-/länderspezifische Sätze (Städte- & Länder-Packs), weil davon sehr viele fällig oder neu waren – pro Tagesrunde sind solche Karten jetzt gedeckelt (höchstens zwei), der Rest wird mit allgemeinen Karten gefüllt.",
        "🔁 Reihenfolge & Spaced Repetition bleiben unverändert (fällige vor neuen Karten). Sind zu wenige allgemeine Karten verfügbar (z. B. enger Stufen-Filter), rücken weitere ortsspezifische nach, damit die Runde voll bleibt.",
      ],
      itemsEn: [
        "🗺️ The daily mini-round „Ruta del día“ now brings mostly basics and general modules. With several countries/cities active you previously got almost only place-/country-specific sentences (city & country packs), because so many of them were due or new – per daily round such cards are now capped (at most two), and the rest is filled with general cards.",
        "🔁 Order & spaced repetition stay the same (due cards before new ones). If too few general cards are available (e.g. a narrow level filter), more place-specific ones step in so the round stays full.",
      ],
    },
    {
      version: "1.114.0",
      date: "2026-06-23",
      title: "Wichtige Sätze der Module mit einem Stern ins „Mi léxico“",
      titleEn: "Star the modules' key phrases straight into „Mi léxico“",
      items: [
        "⭐ Jeder „wichtige Satz“ in den Reise-Modulen (Viaja responsable, Salud y energía, Logística de viaje, Coqueteo y romance, Juegos de viaje, Jerga colombiana, Conoce tus derechos) hat jetzt einen Stern-Knopf: ein Tipp legt den Satz (Spanisch + Übersetzung) in dein persönliches Lexikon „Mi léxico“ – wie schon bei Karten und im Spickzettel.",
        "🔁 Der Stern ist ein Umschalter: erneut tippen nimmt den Satz wieder heraus. Der Merk-Zustand bleibt über Sprachwechsel und Neuaufbau der Seite erhalten.",
      ],
      itemsEn: [
        "⭐ Every „key phrase“ in the travel modules (Viaja responsable, Salud y energía, Logística de viaje, Coqueteo y romance, Juegos de viaje, Jerga colombiana, Conoce tus derechos) now has a star button: one tap saves the phrase (Spanish + translation) to your personal lexicon „Mi léxico“ – just like cards and the cheat sheet already do.",
        "🔁 The star is a toggle: tap again to remove the phrase. The saved state survives language switches and page re-renders.",
      ],
    },
    {
      version: "1.113.0",
      date: "2026-06-22",
      title: "Neu: Juegos de viaje – die Hostel-Spiele & die Sätze dazu",
      titleEn: "New: Juegos de viaje – hostel games & the phrases to play them",
      items: [
        "🎲 Neues Modul „Juegos de viaje“: Spiele sind der schnellste Weg, im Hostel Leute kennenzulernen. Recherchiert wurde, was Reisende wirklich spielen – die globalen Klassiker (UNO, Monopoly Deal, Presidente/Culo) und die in Lateinamerika allgegenwärtigen Spiele (Truco in Argentinien/Uruguay, Dudo/Perudo in den Anden, Cuarenta in Ecuador, Generala, Dominó in der Karibik) plus die Spiele ganz ohne Material (Yo nunca, Hombre lobo/Mafia).",
        "📖 Jedes Spiel kurz erklärt: aufklappbare „así se juega“-Schritte und typische Stolperfallen – bei Truco, Dudo und Dominó zusätzlich ein spanisches Lesetraining zur Spielkultur (antippbare Vokabeln & Quiz).",
        "💬 Die Sätze für den Tisch als Karten (es/de/en, mit Kopier-Knopf): mitspielen & vorschlagen (¿Me explicas las reglas?), am Tisch (Te toca, Roba una carta), gewinnen/verlieren (¿Otra ronda?), würfeln & wetten (¡Dudo!) und Eisbrecher mit Respekt – plus Glossar (baraja, comodín, cubilete, ficha …) und ein „Spiele-Kit für den Rucksack“.",
        "🔗 Per Deep-Link (?m=juegos) direkt aufrufbar, in Suche & Entdecken verdrahtet und offline verfügbar.",
      ],
      itemsEn: [
        "🎲 New module „Juegos de viaje“: games are the fastest way to meet people in a hostel. We researched what travellers actually play – the global classics (UNO, Monopoly Deal, President/Asshole) and the games that are everywhere in Latin America (Truco in Argentina/Uruguay, Dudo/Perudo in the Andes, Cuarenta in Ecuador, Generala, dominoes in the Caribbean) plus the games with no equipment at all (Never have I ever, Werewolf/Mafia).",
        "📖 Every game explained briefly: expandable „this is how you play“ steps and common pitfalls – Truco, Dudo and dominoes also get Spanish reading practice on the game's culture (tappable vocab & quiz).",
        "💬 The phrases for the table as cards (es/de/en, with a copy button): joining in & suggesting (¿Me explicas las reglas?), at the table (Te toca, Roba una carta), winning/losing (¿Otra ronda?), dice & bidding (¡Dudo!) and icebreakers with respect – plus a glossary (baraja, comodín, cubilete, ficha …) and a „games kit for your backpack“.",
        "🔗 Reachable via deep link (?m=juegos), wired into Search & Discover and available offline.",
      ],
    },
    {
      version: "1.112.0",
      date: "2026-06-22",
      title: "Arbeitsblätter: mehr Abwechslung & deutlich mehr Inhalt",
      titleEn: "Worksheets: more variety & a lot more content",
      items: [
        "🆕 Drei neue Übungstypen für mehr Abwechslung: „Multiple Choice“ (richtige spanische Antwort aus vier Optionen ankreuzen), „Artikel“ (el/la/los/las vor das Substantiv setzen) und „Buchstabensalat“ (gewürfelte Buchstaben zum richtigen Wort sortieren). Alle drei funktionieren im Lösungsblatt, im Übungsblatt mit Lösungsschlüssel UND am Handy zum Ausfüllen mit Selbstkontrolle.",
        "📈 Spürbar mehr Umfang: Jeder Baustein wurde aufgestockt. „Groß“ liefert jetzt über 180 Aufgaben, „XXL“ über 270 – ein echtes, mehrseitiges Übungsheft. Auch mehr Konjugationen (bis 34), Übersetzungen (bis 34), Zahlen/Preise (bis 28) und bis zu VIER komplette Dialoge.",
        "✍️ Zwei neue Schreibanlässe (Restaurant-Bestellung & Nachricht an eine neue Bekanntschaft) – im XXL-Heft jetzt bis zu fünf freie Schreibaufgaben.",
        "🖨️ Sauberer A4-Druck bei viel Inhalt: Lange Übungsabschnitte fließen jetzt über die Seiten, statt am Rand abgeschnitten zu werden – einzelne Aufgaben, Wortbänke und Schreibflächen bleiben dabei zusammen. Keine gestrandeten Überschriften oder Einzelzeilen mehr (Witwen/Waisen): Titel wandern immer mit ihrem Inhalt auf die nächste Seite.",
      ],
      itemsEn: [
        "🆕 Three new exercise types for more variety: “Multiple choice” (pick the correct Spanish answer from four options), “Articles” (put el/la/los/las in front of the noun) and “Word scramble” (unscramble the letters into the right word). All three work in the answer-key sheet, in the exercise sheet with answer key AND on your phone to fill in with self-check.",
        "📈 Noticeably more scope: every building block was boosted. “Large” now delivers over 180 tasks, “XXL” over 270 – a real multi-page workbook. Also more conjugations (up to 34), translations (up to 34), numbers/prices (up to 28) and up to FOUR complete dialogues.",
        "✍️ Two new writing prompts (ordering at a restaurant & a message to someone you just met) – up to five free-writing tasks in the XXL workbook.",
        "🖨️ Clean A4 printing with lots of content: long exercise sections now flow across pages instead of being cut off at the margin – individual tasks, word banks and writing areas stay together. No more stranded headings or single lines (widows/orphans): a title always moves to the next page together with its content.",
      ],
    },
    {
      version: "1.111.0",
      date: "2026-06-21",
      title: "Arbeitsblätter: mehr Übungen, A4-fertiges Layout & am Handy ausfüllbar",
      titleEn: "Worksheets: more exercises, print-ready A4 layout & fill in on your phone",
      items: [
        "📱 Neu: Variante „Am Handy ausfüllen“ – das Arbeitsblatt wird interaktiv. Tippe deine Antworten direkt in echte Eingabefelder, prüfe sie mit einem Knopf (richtig/falsch wird markiert) oder lass dir die Lösungen zeigen. Alles bleibt offline auf deinem Gerät.",
        "📈 Viel mehr Umfang & neue Übungstypen: ein vollwertiges mehrseitiges Heft mit ~125 Aufgaben (14 Zuordnungs-Paare, 18 Gegenteile, 14 Lückentexte, 18 Übersetzungen, 12 Satz-ordnen, 18 Konjugationen, 15 Zahlen/Preise, ZWEI komplette Dialoge, Landeskunde, 3 Schreibanlässe). Karten-Abschnitte füllen sich bei kleinen Zielen aus dem gesamten Reise-Wortschatz auf. Neu: „Gegenteile“ (Contrarios) und „Satz ordnen“ (Wortstellung).",
        "🖨️ Sauber auf A4: Layout und Abstände fürs Ausdrucken optimiert – kompaktere Typografie und bewusste Seitenumbrüche, damit mehr Übungen pro Seite passen und nichts unschön zerreißt.",
        "🗝️ Lösungsschlüssel getrennt: ist jetzt ein eigenes Blatt mit eigener Kopfzeile und lässt sich separat drucken („Übungsblatt drucken“ bzw. „Lösungsschlüssel drucken“) – ideal zum Austeilen ohne Lösungen.",
        "📏 Heftlänge wählbar: Standard, Groß oder XXL – du bestimmst selbst, wie viele Aufgaben pro Baustein im Heft landen (XXL schöpft die Quellen weitgehend aus).",
      ],
      itemsEn: [
        "📱 New: a „Fill in on phone“ variant – the worksheet becomes interactive. Type your answers straight into real input fields, check them with one tap (right/wrong gets highlighted) or reveal the solutions. Everything stays offline on your device.",
        "📈 Much more scope & new exercise types: a full multi-page workbook with ~125 tasks (14 matching pairs, 18 opposites, 14 gap-fills, 18 translations, 12 sentence-ordering, 18 conjugations, 15 numbers/prices, TWO complete dialogues, culture notes, 3 writing prompts). Card-based sections top up from the whole travel vocabulary when a target is small. New: “Opposites” (Contrarios) and “Put the sentence in order” (word order).",
        "🖨️ Clean on A4: layout and spacing optimised for printing – tighter typography and deliberate page breaks, so more exercises fit per page and nothing breaks awkwardly.",
        "🗝️ Separate answer key: it's now its own sheet with its own header and prints separately (“Print exercise sheet” vs. “Print answer key”) – perfect for handing out without the solutions.",
        "📏 Choose the workbook length: Standard, Large or XXL – you decide how many tasks per building block end up in the sheet (XXL taps the sources almost fully).",
      ],
    },
    {
      version: "1.110.0",
      date: "2026-06-20",
      title: "Mi léxico: Wörter & Sätze zu Favoriten machen – dein eigenes Lexikon",
      titleEn: "Mi léxico: save words & phrases as favourites – your own lexicon",
      items: [
        "⭐ Neu: „Mi léxico“ – tippe auf den Stern (direkt beim Lernen, auf der Karten-Detailseite, im Spickzettel oder im Lexikon), um Wörter und Sätze zu deinen Favoriten zu machen. So baust du dir dein eigenes kleines Lexikon mit dem, was für DICH wichtig ist – zum blitzschnellen Nachsehen, auch in Stresssituationen.",
        "✍️ Eigene Einträge: Du kannst auch ganz eigene Wörter und Sätze (mit Aussprache-Tipp) ins Lexikon tippen, die es als Karte gar nicht gibt.",
        "📲 Direkt griffbereit: „Mi léxico“ hat einen eigenen Homescreen-Shortcut (App-Icon gedrückt halten) und steht in Entdecken sowie im Profil. Favoriten wandern auch ins Backup (Export/Import).",
      ],
      itemsEn: [
        "⭐ New: „Mi léxico“ – tap the star (right while learning, on the card detail page, in the cheat sheet or inside the lexicon) to save words and phrases as favourites. Build your own little lexicon with what matters to YOU – for instant reference, even in stressful moments.",
        "✍️ Your own entries: you can also type in completely custom words and phrases (with a pronunciation tip) that don't exist as a card.",
        "📲 Always to hand: „Mi léxico“ has its own home-screen shortcut (long-press the app icon) and lives in Discover and your Profile. Favourites are included in the backup (export/import) too.",
      ],
    },
    {
      version: "1.109.0",
      date: "2026-06-20",
      title: "Coqueteo y romance: Sätze mit einem Tipp kopieren – und heißer flirten",
      titleEn: "Coqueteo y romance: copy phrases with one tap – and flirt hotter",
      items: [
        "📋 Im Modul „Coqueteo y romance“ hat jetzt jeder wichtige Satz einen Kopier-Knopf – ein Tipp legt den spanischen Satz in die Zwischenablage, ideal zum Weiterschicken per WhatsApp & Co.",
        "🔥 Mehr Feuer: neue Satzgruppe „Heißer werden – mit Konsens“ (von „No puedo dejar de mirarte“ über „¿Te animas a venir a mi habitación?“ bis „¿Está bien si te toco aquí?“), dazu kühnere Komplimente und passende Wörter im Glossar. Konsens bleibt der rote Faden.",
      ],
      itemsEn: [
        "📋 In the „Coqueteo y romance“ module every important phrase now has a copy button – one tap puts the Spanish line on your clipboard, perfect for sending it on via WhatsApp & co.",
        "🔥 More heat: a new phrase group „Turning up the heat – with consent“ (from „No puedo dejar de mirarte“ via „¿Te animas a venir a mi habitación?“ to „¿Está bien si te toco aquí?“), plus bolder compliments and matching glossary words. Consent stays the common thread.",
      ],
    },
    {
      version: "1.108.0",
      date: "2026-06-20",
      title: "Coqueteo y romance: Lernkarten, Lesetraining & ein Flirt-Dialog",
      titleEn: "Coqueteo y romance: flashcards, reading training & a flirting dialogue",
      items: [
        "💘 Neuer Lernbereich „Flirten & Romantik“ mit Karteikarten (Spaced Repetition) – von „¿Quieres bailar?“ über „¿Está bien si te doy un beso?“ bis zu klaren Grenzen wie „No, gracias, no me interesa.“ Jede Karte mit Beispielsatz, Reise-Kontext und eigenem Abzeichen „Corazón viajero“.",
        "📖 Das Entdecken-Modul „Coqueteo y romance“ hat jetzt in jedem Thema ein spanisches Lesetraining mit antippbaren Vokabeln und Mini-Quiz (wie bei Fotos und der Historia).",
        "💬 Neue Gesprächs-Simulation „Coquetear con respeto“ (Diálogos): jemanden auf einer Salsa-Nacht kennenlernen – ansprechen, Kompliment, Date vorschlagen, Kontakt tauschen und um einen Kuss bitten. Konsens als roter Faden.",
      ],
      itemsEn: [
        "💘 New study area „Flirting & Romance“ with flashcards (spaced repetition) – from „¿Quieres bailar?“ via „¿Está bien si te doy un beso?“ to clear boundaries like „No, gracias, no me interesa.“ Every card with an example sentence, travel context and its own „Corazón viajero“ badge.",
        "📖 The „Coqueteo y romance“ Discover module now has Spanish reading training in every topic, with tappable vocab and a mini-quiz (like Photos and the Historia).",
        "💬 New conversation simulation „Coquetear con respeto“ (Diálogos): meeting someone at a salsa night – an opening line, a compliment, suggesting a date, swapping contacts and asking for a kiss. Consent as the common thread.",
      ],
    },
    {
      version: "1.107.0",
      date: "2026-06-20",
      title: "Neues Modul „Coqueteo y romance“: flirten & daten mit Respekt",
      titleEn: "New module “Coqueteo y romance”: flirting & dating with respect",
      items: [
        "💘 Neues Entdecken-Modul fürs Kennenlernen unterwegs: entspannt ins Gespräch kommen, echte Komplimente machen, ein Date vorschlagen – und genauso ein Nein hören. Mit den spanischen Sätzen, einem Glossar, Tipps zur Dating-Kultur in Lateinamerika und einem Date- & Sicherheits-Kit. Grundregel überall: Respekt und Konsens. Auf Deutsch und Englisch, offline und teilbar.",
      ],
      itemsEn: [
        "💘 A new Discover module for meeting people on the road: ease into a conversation, give genuine compliments, suggest a date – and just as much, take a no. With the Spanish phrases, a glossary, notes on dating culture in Latin America and a dating & safety kit. The ground rule throughout: respect and consent. In German and English, offline and shareable.",
      ],
    },
    {
      version: "1.106.0",
      date: "2026-06-20",
      title: "Neues Modul „Bailar“: Tanzen in Lateinamerika mit Schritt-Diagrammen",
      titleEn: "New module “Bailar”: dancing in Latin America with step diagrams",
      items: [
        "💃 Unter „Entdecken“ gibt es jetzt „Bailar“: die wichtigsten Tänze (Salsa, Bachata, Merengue, Cumbia, Cha-cha-chá, Tango, Reggaetón) – jeweils mit einem stilisierten Schritt-Diagramm am Boden, dessen Fußabdrücke in Tanzreihenfolge aufleuchten (mit Play/Pause), dem Zählrhythmus, Tipps & typischen Fehlern, einem kurzen spanischen Lesetraining und Links zu Tutorial-Videos. Dazu die Sätze, um jemanden zum Tanzen aufzufordern, ein Tanz-Knigge und ein Glossar.",
      ],
      itemsEn: [
        "💃 “Discover” now has “Bailar”: the most important dances (salsa, bachata, merengue, cumbia, cha-cha-chá, tango, reggaetón) – each with a stylised step diagram on the floor whose footprints light up in dance order (with play/pause), the counting rhythm, tips & common mistakes, a short Spanish reading exercise and links to tutorial videos. Plus the phrases to ask someone to dance, dance etiquette and a glossary.",
      ],
    },
    {
      version: "1.105.0",
      date: "2026-06-20",
      title: "Modo profe stark verbessert: Niveau-Verteilung, Sortierung & CSV",
      titleEn: "Teacher mode boosted: level distribution, sorting & CSV",
      items: [
        "📊 Die Klassenübersicht zeigt jetzt eine Niveau-Verteilung – wie viele Schüler:innen auf welcher CEFR-Stufe stehen: die Basis für die schnelle Gruppeneinteilung.",
        "↕️ Die Klassentabelle lässt sich per Klick auf die Spaltenköpfe sortieren (Name, Gemeistert, Serie, Challenges, Pre-Trip, Niveau) – Standard ist jetzt nach Niveau.",
        "📄 Neuer CSV-Export der Klassenliste (offline, Excel-tauglich) fürs Schul-Archiv – mit optionalem Klassennamen im Dateinamen.",
        "🖨️ Optionaler Klassenname und ein Druck-Kopf (Name + Datum) machen den Ausdruck selbsterklärend; ein erneut importiertes Backup ersetzt jetzt den gleichnamigen Schüler statt eine Dublette anzulegen.",
        "🔗 Im Profil verlinkt der Partner-Hinweis der ECOS-/WeRoad-Edition jetzt direkt auf die Partner-Homepage.",
      ],
      itemsEn: [
        "📊 The class overview now shows a level distribution – how many students sit at each CEFR level: the basis for quickly forming groups.",
        "↕️ The class table can be sorted by clicking the column headers (name, mastered, streak, challenges, pre-trip, level) – the default is now by level.",
        "📄 New CSV export of the class list (offline, Excel-friendly) for the school archive – with an optional class name in the filename.",
        "🖨️ An optional class name and a print header (name + date) make the printout self-explanatory; re-importing a backup now replaces the student with the same name instead of creating a duplicate.",
        "🔗 In the profile, the partner credit of the ECOS/WeRoad edition now links directly to the partner's homepage.",
      ],
    },
    {
      version: "1.104.0",
      date: "2026-06-20",
      title: "Ruta-Pass-Stempel für „¿Y esto?“",
      titleEn: "Ruta-Pass badges for “¿Y esto?”",
      items: [
        "👀 Der neue Modus „¿Y esto?“ zahlt jetzt auf den Ruta-Pass ein: eigene Stempel-Gruppe mit „¿Y esto?“ (erste Runde), „Ojo entrenado“ (10 Runden) und „Todo a la vista“ (eine Runde, in der du jedes Bild wusstest).",
      ],
      itemsEn: [
        "👀 The new “¿Y esto?” mode now counts towards your Ruta-Pass: its own badge group with “¿Y esto?” (first round), “Trained eye” (10 rounds) and “Todo a la vista” (a round where you knew every picture).",
      ],
    },
    {
      version: "1.103.0",
      date: "2026-06-20",
      title: "Neuer Modus „¿Y esto?“ – Bild raten mit 3-2-1-Countdown",
      titleEn: "New mode “¿Y esto?” – guess the picture with a 3-2-1 countdown",
      items: [
        "👀 Neu unter Entdecken → Spielen: „¿Y esto?“. Ein Motiv erscheint groß, ein kurzer Countdown läuft (3 · 2 · 1) – überlege, wie es auf Spanisch heißt. Bei 0 wird das Wort samt Übersetzung aufgelöst, und du bewertest dich selbst („Wusste ich“ / „Noch nicht“). Sechs Themen (Comida, Bebidas, Animales, De viaje, Naturaleza, En casa) mit je 8+ Motiven – ganz ohne Fotos, also weiter komplett offline.",
      ],
      itemsEn: [
        "👀 New under Discover → Play: “¿Y esto?”. A picture appears, a short countdown runs (3 · 2 · 1) – think how it's called in Spanish. At 0 the word and its translation are revealed and you rate yourself (“I knew it” / “Not yet”). Six themes (food, drinks, animals, travel gear, nature, at home) with 8+ pictures each – no photos, so it stays fully offline.",
      ],
    },
    {
      version: "1.102.0",
      date: "2026-06-20",
      title: "Neues Modul „Música“: der Soundtrack Lateinamerikas",
      titleEn: "New “Música” module: the soundtrack of Latin America",
      items: [
        "🎵 Neues Modul „Música“: die großen Genres Lateinamerikas verständlich erklärt – von Cumbia, Salsa und Reggaetón über Tango und Mariachi bis Bachata und Anden-Folklore, jeweils mit ein paar Künstlern zum Reinhören und spanischem Lesetraining.",
        "▶️ Ein Tipp öffnet jedes Genre direkt in Spotify ODER Apple Music (Deep-Link – am Handy springt die jeweilige App auf). Dazu der typische Sound deines Reiselands: wähle dein Land und höre Künstler & Song mit einem Tap.",
        "💬 Plus die Sätze, um über Musik zu reden und tanzen zu gehen, und ein Glossar rund um Musik – wie gewohnt auf Deutsch/Englisch umschaltbar und über die Suche erreichbar.",
      ],
      itemsEn: [
        "🎵 New “Música” module: Latin America's big genres explained simply – from cumbia, salsa and reggaetón through tango and mariachi to bachata and Andean folklore, each with a few artists to sample and Spanish reading practice.",
        "▶️ One tap opens each genre straight in Spotify OR Apple Music (deep link – on your phone the matching app pops open). Plus the signature sound of your destination: pick your country and hear an artist & song with one tap.",
        "💬 And the phrases to talk about music and go dancing, plus a music glossary – switchable between German/English as usual and reachable from search.",
      ],
    },
    {
      version: "1.101.0",
      date: "2026-06-20",
      title: "Trip-Ziel als Reise-Zeitleiste (mehrere Länder nacheinander)",
      titleEn: "Trip goal as a travel timeline (several countries in a row)",
      items: [
        "🗺️ Das Trip-Ziel ist jetzt eine Zeitleiste: Mit dem Schnellwechsler hängst du Land für Land an deine Route an – z. B. zuerst El Salvador, dann Kolumbien, dann Peru. Ein schon getipptes Ziel wird dabei zum ersten Stopp (nichts geht verloren). Jeder Stopp lässt sich im Profil wieder entfernen, und die Pre-Arrival-Pakete erscheinen für alle Länder deiner Route.",
      ],
      itemsEn: [
        "🗺️ Your trip goal is now a timeline: the quick-switcher appends one country after another to your route – e.g. first El Salvador, then Colombia, then Peru. A destination you already typed becomes the first stop (nothing is lost). Each stop can be removed again in your profile, and the pre-arrival packs show up for every country on your route.",
      ],
    },
    {
      version: "1.100.0",
      date: "2026-06-19",
      title: "„Modul teilen“ jetzt auch beim HolaRuta Nivel-Test",
      titleEn: "“Share module” now also on the HolaRuta Nivel-Test",
      items: [
        "📤 Der ausführliche Nivel-Test lässt sich jetzt – wie die übrigen Module – direkt von seiner Startseite aus als „Modul teilen“ weiterempfehlen; der geteilte Link öffnet den Test beim Empfänger direkt.",
      ],
      itemsEn: [
        "📤 The in-depth Nivel-Test can now be recommended via “Share module” straight from its start page – just like the other modules; the shared link opens the test directly for the recipient.",
      ],
    },
    {
      version: "1.99.0",
      date: "2026-06-19",
      title: "Geteilte Ergebnis-Bilder öffnen jetzt direkt den passenden Test/das Modul",
      titleEn: "Shared result images now open the matching test/module directly",
      items: [
        "🔗 Teilst du dein Ergebnis vom Nivel-Test oder vom HolaRuta-Check, öffnet der Link unter dem Bild jetzt direkt den jeweiligen Test – statt nur die Startseite.",
        "🔗 Dasselbe gilt jetzt für die Historia-Lesetexte, die Reise-Tipps (Etiqueta, Regatear, Logística, Salud, Fotos) und die Länderkunde: ein Tap auf den geteilten Link landet direkt im passenden Modul.",
      ],
      itemsEn: [
        "🔗 When you share your result from the Nivel-Test or the HolaRuta-Check, the link below the image now opens that test directly – instead of just the home page.",
        "🔗 The same now applies to the Historia reading texts, the travel tips (etiquette, haggling, logistics, health, photos) and the country guide: tapping the shared link lands you right in the matching module.",
      ],
    },
    {
      version: "1.98.0",
      date: "2026-06-18",
      title: "Zwischenstufe „fast geschafft“ + klarerer Meisterungs-Fortschritt",
      titleEn: "“Almost there” stage + clearer mastery progress",
      items: [
        "🔥 Neue Zwischenstufe „fast geschafft“: Karten, die fast gemeistert sind, bekommen in der Statistik einen eigenen Punkt – so siehst du den Fortschritt, bevor die erste Karte als „gemeistert“ zählt.",
        "🏁 Eine Karte gilt jetzt etwas früher als „gemeistert“ (ab 5 statt 7 Tagen Wiederholungs-Abstand) und ein kurzer Hinweis in der Statistik erklärt, was „gemeistert“ bedeutet.",
        "✨ Kleinerer Schliff: In den Statistik-Filtern sitzt die Zahl jetzt mit sauberem Abstand neben dem Text (z. B. „Beantwortet 189“ statt „Beantwortet189“).",
      ],
      itemsEn: [
        "🔥 New “almost there” stage: cards that are close to mastered now get their own dot in the stats – so you can see progress before the first card counts as “mastered”.",
        "🏁 A card now counts as “mastered” a little sooner (a 5- instead of 7-day review gap), and a short note in the stats explains what “mastered” means.",
        "✨ Small polish: in the stats filters the number now sits with clean spacing next to the label (e.g. “Answered 189” instead of “Answered189”).",
      ],
    },
    {
      version: "1.97.0",
      date: "2026-06-18",
      title: "Aus „Ruta-Check“ wird „HolaRuta-Check“ + Dashboard-Erinnerung",
      titleEn: "“Ruta-Check” becomes “HolaRuta-Check” + dashboard reminder",
      items: [
        "🎯 Der Einstufungstest heißt jetzt überall einheitlich „HolaRuta-Check“ – in Entdecken, im Profil, im Onboarding und auf den Teilen-Bildern.",
        "📌 Solange du den HolaRuta-Check noch nicht gemacht hast, erscheint er als offene Aufgabe auf dem Dashboard – ein Tap startet ihn. Sobald er erledigt ist, verschwindet die Erinnerung von selbst.",
      ],
      itemsEn: [
        "🎯 The placement test is now consistently called the “HolaRuta-Check” everywhere – in Discover, your profile, onboarding and on the share images.",
        "📌 As long as you haven't taken the HolaRuta-Check, it shows up as an open task on your dashboard – one tap starts it. Once it's done, the reminder disappears on its own.",
      ],
    },
    {
      version: "1.96.0",
      date: "2026-06-18",
      title: "Onboarding: Name & Geschlecht zuerst, Ruta-Check nachholbar",
      titleEn: "Onboarding: name & gender first, Ruta-Check can be done later",
      items: [
        "🙋 Das Onboarding beginnt jetzt mit Name und Geschlecht – damit dich die App von Anfang an richtig anspricht. Das Geschlecht fließt in die Diálogos ein: Du sagst „No soy alérgica a nada“ oder „…alérgico“, und der Gesprächspartner spricht dich passend an („La veo perdida“). Beides ist jederzeit im Profil änderbar.",
        "🎯 Den Einstufungstest (Ruta-Check) kannst du beim Start überspringen. Er bleibt dann als „noch offen“ auf dem Dashboard sichtbar, bis du ihn nachgeholt hast – ein Tap startet ihn jederzeit.",
      ],
      itemsEn: [
        "🙋 Onboarding now starts with your name and gender – so the app addresses you correctly from the start. Gender flows into the Diálogos: you say „No soy alérgica a nada“ or „…alérgico“, and your conversation partner addresses you accordingly („La veo perdida“). You can change both anytime in your profile.",
        "🎯 You can skip the placement test (Ruta-Check) at the start. It then stays visible on the dashboard as “still open” until you complete it – one tap starts it anytime.",
      ],
    },
    {
      version: "1.95.0",
      date: "2026-06-18",
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
      version: "1.94.0",
      date: "2026-06-18",
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
      version: "1.93.0",
      date: "2026-06-18",
      title: "Erscheinungsbild im Stil deines Reiselands",
      titleEn: "Appearance in the style of your travel country",
      items: [
        "🎨 Das AM/PM-Schild im Profil zeigt jetzt das Tag- und Abendgetränk deines Reiselands statt allgemein Kaffee/Wein – dieselben Motive wie „Bebidas AM/PM“ (z. B. Pisco Sour für Peru, Mate & Malbec für Argentinien). Das aktive Hell/Dunkel-Schild leuchtet in der Landes-Akzentfarbe, der Block bekommt eine sanfte Tönung und der Begleittext wird zum Landesgruß („Buenos días“/„Buenas noches“). Wechselst du oben das Reiseland (Schnellwechsel), zieht das Erscheinungsbild sofort mit. Ohne gesetztes Reiseland bleibt der vertraute Kaffee/Wein-Standard.",
      ],
      itemsEn: [
        "🎨 The AM/PM sign in your profile now shows your travel country's morning and evening drink instead of generic coffee/wine – the same artwork as “Bebidas AM/PM” (e.g. Pisco Sour for Peru, Mate & Malbec for Argentina). The active light/dark sign glows in the country's accent colour, the block gets a soft tint, and the caption becomes the local greeting (“Buenos días”/“Buenas noches”). Switch the country up top (quick-switch) and the appearance follows along instantly. With no country set, the familiar coffee/wine default stays.",
      ],
    },
    {
      version: "1.92.0",
      date: "2026-06-17",
      title: "Trip-Ziel & Erscheinungsbild klarer bedienbar",
      titleEn: "Trip goal & appearance: clearer to use",
      items: [
        "🎯 Reiseland schnell wechseln: Unter dem Trip-Ziel im Profil gibt es jetzt eine Chip-Leiste mit den unterstützten Ländern. Ein Tap setzt das Reiseziel (Datum & Tagesziel bleiben) – und schaltet damit zugleich die passenden Pre-Arrival-Kacheln auf der Startseite um. Kein Öffnen des Formulars und Tippen mehr nötig.",
        "🗓️ Übersichtlichere Trip-Karte: Der Countdown („Noch 12 Tage bis …“ bzw. „Reisezeit!“) steht jetzt klar oben als Hauptzeile. Das tägliche Karten-Pensum ist als eigene, beschriftete Zeile mit Balken abgesetzt – so wirkt der Tagesbalken nicht mehr wie ein „Fortschritt bis zur Reise“.",
        "☕🍷 Hell/Dunkel direkt wählbar: Das AM/PM-Schild ist kein blinder Umschalter mehr. AM und PM sind je ein eigener Knopf – man tippt direkt die gewünschte Seite an (AM → hell, PM → dunkel). Tippt man die bereits aktive Seite, passiert nichts mehr.",
      ],
      itemsEn: [
        "🎯 Quick-switch country: Below the trip goal in your profile there's now a chip bar with the supported countries. One tap sets the destination (date & daily goal stay) – and switches the matching pre-arrival tiles on the home screen at the same time. No more opening the form and typing.",
        "🗓️ Clearer trip card: The countdown (“12 days to go until …” or “Travel time!”) is now the prominent top line. The daily card goal sits below as its own labelled row with a bar – so the daily bar no longer looks like “progress until the trip”.",
        "☕🍷 Pick light/dark directly: The AM/PM sign is no longer a blind toggle. AM and PM are each their own button – tap the side you want (AM → light, PM → dark). Tapping the already-active side now does nothing.",
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
    // Ältere Einträge bewusst NICHT mehr im ausgelieferten Bundle (Payload):
    // der vollständige, zweisprachige Verlauf steht in docs/CHANGELOG.md.
    // Neu generieren via: node scripts/trim-changelog.mjs
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
