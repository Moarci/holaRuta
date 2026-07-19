/*
 * badges.js  (SC.badges) – "Mein Ruta-Pass": Stempel/Erfolge fürs Reise-Lernen.
 * REINE FUNKTIONEN + REINE DATEN, kennt weder UI noch Speicher.
 *
 * Idee: Badges fühlen sich an wie kleine Reisestempel im Pass. Sie belohnen
 * nicht nur "viel gelernt", sondern verschiedene Arten von Fortschritt:
 * Lernmenge, Regelmäßigkeit (Streak), Kategorien-Meisterschaft und Spezielles.
 *
 * Datenfluss:  progress + counters --buildMetrics--> metrics --evaluate--> Liste
 *
 * Ein Badge ist reine Beschreibung. Ob es freigeschaltet ist, ergibt sich aus
 * einer Metrik (metric) und einer Schwelle (threshold) – so bleibt die Logik
 * generisch und neue Badges sind nur ein Eintrag im Array.
 *
 * type:
 *   "counter"         – metrics[metric] >= threshold (z.B. cardsReviewed >= 50)
 *   "flag"            – metrics[metric] === true (z.B. nightOwl)
 *   "categoryMastery" – Anteil gemeisterter Karten einer Kategorie >= threshold
 *   "allReviewed"     – alle Karten mindestens einmal gelernt (Schwelle = Gesamt)
 *
 * Optionale Felder:
 *   secret  – Badge wird als "???" angezeigt, solange es nicht freigeschaltet ist.
 */
(function () {
  "use strict";

  // "Gemeistert" ist die Wahrheit aus stats.js (SC.stats.statusOf). Wir greifen
  // darauf zu, statt die Regel zu duplizieren – so können Statistik und Ruta-Pass
  // nie auseinanderlaufen. Der Fallback greift nur, falls stats (noch) nicht
  // geladen ist (Graceful Degradation, eigenständig testbar); er nimmt die
  // Schwelle aus stats, wenn vorhanden, sonst den synchron gehaltenen Default.
  const MASTERED_DAYS_FALLBACK = 5;
  function isMastered(r) {
    const st = window.SC && window.SC.stats;
    if (st && st.statusOf) return st.statusOf(r) === "mastered";
    const days = (st && st.MASTERED_DAYS) || MASTERED_DAYS_FALLBACK;
    return (r.seen || 0) > 0 && (r.interval || 0) >= days;
  }

  // Gruppen für die Anzeige im Ruta-Pass.
  const GROUPS = [
    { id: "learning", label: "Lernreise",   labelEn: "Learning journey", icon: "🧭" },
    { id: "streak",   label: "Dranbleiben", labelEn: "Keeping it up", icon: "🔥" },
    { id: "category", label: "Bereiche",    labelEn: "Topics", icon: "🗂️" },
    { id: "context",  label: "Reise-Kontext", labelEn: "Travel context", icon: "🧭" },
    { id: "hostel",   label: "Modo hostal", labelEn: "Modo hostal", icon: "🛏️" },
    { id: "quiz",     label: "Definiciones", labelEn: "Definiciones", icon: "🧩" },
    { id: "yesto",    label: "¿Y esto?",    labelEn: "¿Y esto?", icon: "👀" },
    { id: "construir",label: "Satzbaukasten", labelEn: "Sentence builder", icon: "🧱" },
    { id: "banderas", label: "Banderas",     labelEn: "Flags", icon: "🚩" },
    { id: "listening",label: "Hören",       labelEn: "Listening", icon: "👂" },
    { id: "cuerpo",   label: "El Cuerpo",   labelEn: "El Cuerpo", icon: "🧍" },
    { id: "reallife", label: "Mutproben",   labelEn: "Dares", icon: "🚪" },
    { id: "special",  label: "Spezial",     labelEn: "Special", icon: "✨" },
  ];

  // Kategorie-Badges (80 % einer Kategorie gemeistert). Reise-/Hostel-Namen im
  // HolaRuta-Stil. Die category-Id muss einer Kategorie in data.js entsprechen.
  const CATEGORY_BADGES = [
    { category: "basics",  icon: "💬", name: "Erste Worte",         nameEn: "First words",          description: "Meistere 80 % der Grundlagen-Karten.", descriptionEn: "Master 80% of the basics cards." },
    { category: "zahlen",  icon: "🔢", name: "Zahlen-Zähmer",       nameEn: "Number tamer",         description: "Meistere 80 % der Zahlen-Karten.", descriptionEn: "Master 80% of the numbers cards." },
    { category: "essen",   icon: "🌮", name: "Taco Tactician",      nameEn: "Taco Tactician",       description: "Meistere 80 % der Essen-Karten.", descriptionEn: "Master 80% of the food cards." },
    { category: "trinken", icon: "🥤", name: "Agua, por favor",     nameEn: "Agua, por favor",      description: "Meistere 80 % der Trinken-Karten.", descriptionEn: "Master 80% of the drinks cards." },
    { category: "hotel",   icon: "🔑", name: "Check-in Champion",    nameEn: "Check-in Champion",    description: "Meistere 80 % der Hotel-Karten.", descriptionEn: "Master 80% of the hotel cards." },
    { category: "hostel",  icon: "🛏️", name: "Dorm Diplomat",        nameEn: "Dorm Diplomat",        description: "Meistere 80 % der Hostel-Karten.", descriptionEn: "Master 80% of the hostel cards." },
    { category: "social",  icon: "👋", name: "Neue Bekanntschaften", nameEn: "New acquaintances",    description: "Meistere 80 % der Social-Karten.", descriptionEn: "Master 80% of the social cards." },
    { category: "coqueteo", icon: "💘", name: "Corazón viajero",     nameEn: "Travelling heart",     description: "Meistere 80 % der Flirt-&-Romantik-Karten.", descriptionEn: "Master 80% of the flirting & romance cards." },
    { category: "verkehr", icon: "🚌", name: "Busbahnhof-Boss",     nameEn: "Bus station boss",     description: "Meistere 80 % der Verkehr-Karten.", descriptionEn: "Master 80% of the transport cards." },
    { category: "compras", icon: "🛍️", name: "Markt-Meister",       nameEn: "Market master",        description: "Meistere 80 % der Einkaufen-Karten.", descriptionEn: "Master 80% of the shopping cards." },
    { category: "dinero",  icon: "💵", name: "Peso-Profi",          nameEn: "Peso pro",             description: "Meistere 80 % der Geld-Karten.", descriptionEn: "Master 80% of the money cards." },
    { category: "notfall", icon: "🆘", name: "Calm in Chaos",       nameEn: "Calm in Chaos",        description: "Meistere 80 % der Notfall-Karten.", descriptionEn: "Master 80% of the emergency cards." },
    { category: "zeit",    icon: "⏰", name: "Pünktlich auf Ruta",   nameEn: "On time on the Ruta",  description: "Meistere 80 % der Zeit-Karten.", descriptionEn: "Master 80% of the time cards." },
    { category: "talk",    icon: "🤝", name: "Conversation Starter", nameEn: "Conversation Starter", description: "Meistere 80 % der Smalltalk-Karten.", descriptionEn: "Master 80% of the small talk cards." },
    { category: "alltag",  icon: "🏙️", name: "Alltags-Held",        nameEn: "Everyday hero",        description: "Meistere 80 % der Alltag-Karten.", descriptionEn: "Master 80% of the everyday cards." },
    { category: "frases",  icon: "🙋", name: "Satz-Sammler",        nameEn: "Phrase collector",     description: "Meistere 80 % der Sätze-Karten.", descriptionEn: "Master 80% of the phrases cards." },
    { category: "grenze",  icon: "🛂", name: "Grenzgänger",         nameEn: "Border crosser",       description: "Meistere 80 % der Behörden-Karten.", descriptionEn: "Master 80% of the officialdom cards." },
    { category: "reise",   icon: "🚐", name: "Roadtrip-Ready",      nameEn: "Roadtrip-Ready",       description: "Meistere 80 % der Busreise-Karten.", descriptionEn: "Master 80% of the bus travel cards." },
    { category: "ropa",    icon: "👕", name: "Style auf Ruta",      nameEn: "Style on the Ruta",    description: "Meistere 80 % der Kleidung-&-Schmuck-Karten.", descriptionEn: "Master 80% of the clothing & jewellery cards." },
    { category: "rumbo",   icon: "🧭", name: "Wegfinder",           nameEn: "Wayfinder",            description: "Meistere 80 % der Wegbeschreibung-Karten.", descriptionEn: "Master 80% of the directions cards." },
    { category: "verbos",  icon: "🔁", name: "Verbo-Virtuose",      nameEn: "Verb virtuoso",        description: "Meistere 80 % der Konjugieren-Karten.", descriptionEn: "Master 80% of the conjugation cards." },
    { category: "tiempos", icon: "⏳", name: "Maestro del Tiempo",  nameEn: "Maestro del Tiempo",   description: "Meistere 80 % der Zeiten-Karten.", descriptionEn: "Master 80% of the tenses cards." },
  ].map((b) => Object.assign({
    id: "cat_" + b.category,
    group: "category",
    type: "categoryMastery",
    threshold: 0.8,
    unlockedText: "Du kommst in diesem Bereich sprachlich klar. 🎒",
    unlockedTextEn: "You can hold your own in this area. 🎒",
  }, b));

  const BADGES = [
    // ---------- Lernreise (Lernmenge) ----------
    { id: "first_steps",     group: "learning", icon: "👣", name: "Erste Schritte",        nameEn: "First steps",          type: "counter", metric: "cardsReviewed", threshold: 1,
      description: "Lerne deine erste Karte.",            descriptionEn: "Learn your first card.",            unlockedText: "Dein erster Schritt auf der Ruta ist gemacht.", unlockedTextEn: "You've taken your first step on the Ruta." },
    { id: "ten_cards",       group: "learning", icon: "🎒", name: "10 Wörter im Rucksack",  nameEn: "10 words in the backpack", type: "counter", metric: "cardsReviewed", threshold: 10,
      description: "Lerne 10 verschiedene Karten.",       descriptionEn: "Learn 10 different cards.",          unlockedText: "Dein Reise-Spanisch kommt in Fahrt.", unlockedTextEn: "Your travel Spanish is picking up speed." },
    { id: "fifty_cards",     group: "learning", icon: "📘", name: "Halber Reiseführer",     nameEn: "Half a guidebook",     type: "counter", metric: "cardsReviewed", threshold: 50,
      description: "Lerne 50 verschiedene Karten.",       descriptionEn: "Learn 50 different cards.",          unlockedText: "Genug Spanisch für viele Alltagssituationen.", unlockedTextEn: "Enough Spanish for plenty of everyday situations." },
    { id: "hundred_cards",   group: "learning", icon: "🧭", name: "Ruta Rookie",            nameEn: "Ruta Rookie",          type: "counter", metric: "cardsReviewed", threshold: 100,
      description: "Lerne 100 verschiedene Karten.",      descriptionEn: "Learn 100 different cards.",         unlockedText: "Du findest dich sprachlich unterwegs zurecht.", unlockedTextEn: "You can find your way around in the language on the road." },
    { id: "twohundred_cards",group: "learning", icon: "🧠", name: "Backpack Brain",         nameEn: "Backpack Brain",       type: "counter", metric: "cardsReviewed", threshold: 200,
      description: "Lerne 200 verschiedene Karten.",      descriptionEn: "Learn 200 different cards.",         unlockedText: "Dein Kopf ist offiziell reisefertig gepackt.", unlockedTextEn: "Your head is officially packed and travel-ready." },
    { id: "all_cards",       group: "learning", icon: "🌎", name: "HolaRuta Legend",        nameEn: "HolaRuta Legend",      type: "allReviewed",
      description: "Lerne alle Karten mindestens einmal.", descriptionEn: "Learn every card at least once.",   unlockedText: "Du hast das komplette Reise-Deck durchgespielt.", unlockedTextEn: "You've worked through the entire travel deck." },
    { id: "master_10",       group: "learning", icon: "🏅", name: "Erste Meisterschaft",    nameEn: "First mastery",        type: "counter", metric: "cardsMastered", threshold: 10,
      description: "Meistere 10 Karten (Intervall ≥ 5 Tage).", descriptionEn: "Master 10 cards (interval ≥ 5 days).", unlockedText: "Zehn Karten sitzen langfristig. Stark!", unlockedTextEn: "Ten cards locked in for the long run. Nice!" },
    { id: "master_50",       group: "learning", icon: "🏆", name: "Routinier",              nameEn: "Old hand",             type: "counter", metric: "cardsMastered", threshold: 50,
      description: "Meistere 50 Karten.",                 descriptionEn: "Master 50 cards.",                  unlockedText: "Ein halbes Hundert Karten sitzt fest.", unlockedTextEn: "Half a hundred cards firmly in place." },

    // ---------- Dranbleiben (Streak) ----------
    { id: "streak_3",  group: "streak", icon: "🗓️", name: "Drei-Tage-Trip",     nameEn: "Three-day trip",     type: "counter", metric: "longestStreak", threshold: 3,
      description: "Lerne 3 Tage in Folge.",   descriptionEn: "Learn 3 days in a row.",   unlockedText: "Drei Tage am Stück auf Ruta geblieben.", unlockedTextEn: "Three days on the Ruta without a break." },
    { id: "streak_7",  group: "streak", icon: "🚐", name: "Eine Woche unterwegs", nameEn: "A week on the road", type: "counter", metric: "longestStreak", threshold: 7,
      description: "Lerne 7 Tage in Folge.",   descriptionEn: "Learn 7 days in a row.",   unlockedText: "Eine Woche Reise-Spanisch durchgezogen.", unlockedTextEn: "A whole week of travel Spanish, done." },
    { id: "streak_14", group: "streak", icon: "🛏️", name: "Reise-Routine",       nameEn: "Travel routine",     type: "counter", metric: "longestStreak", threshold: 14,
      description: "Lerne 14 Tage in Folge.",  descriptionEn: "Learn 14 days in a row.",  unlockedText: "Spanisch ist Teil deiner Reiseroutine.", unlockedTextEn: "Spanish is part of your travel routine now." },
    { id: "streak_30", group: "streak", icon: "🔥", name: "Ruta Ritual",         nameEn: "Ruta Ritual",        type: "counter", metric: "longestStreak", threshold: 30,
      description: "Lerne 30 Tage in Folge.",  descriptionEn: "Learn 30 days in a row.",  unlockedText: "Aus Lernen ist eine echte Gewohnheit geworden.", unlockedTextEn: "Learning has turned into a real habit." },
    { id: "ruta_dia_first", group: "streak", icon: "🗺️", name: "Ruta del día",   nameEn: "Ruta del día",       type: "counter", metric: "rutaDays", threshold: 1,
      description: "Starte deine erste Ruta del día.", descriptionEn: "Start your first Ruta del día.", unlockedText: "Dein täglicher Mini-Plan ist gesetzt.", unlockedTextEn: "Your daily mini-plan is set." },
    { id: "pretrip_done",   group: "streak", icon: "🧳", name: "Reisefertig",     nameEn: "Trip-ready",         type: "counter", metric: "pretripDaysDone", threshold: 7,
      description: "Schließe alle 7 Etappen des Pre-Trip-Plans ab.", descriptionEn: "Complete all 7 stages of the pre-trip plan.", unlockedText: "Vorbereitet wie ein Profi – jetzt kann die Reise kommen.", unlockedTextEn: "Prepared like a pro – bring on the trip." },
    { id: "ruta_dia_7",     group: "streak", icon: "🥾", name: "Sieben Etappen",  nameEn: "Seven stages",       type: "counter", metric: "rutaDays", threshold: 7,
      description: "Mache an 7 Tagen eine Ruta del día.", descriptionEn: "Do a Ruta del día on 7 days.", unlockedText: "Sieben tägliche Etappen – die Reise läuft.", unlockedTextEn: "Seven daily stages – the journey's rolling." },

    // ---------- Bereiche (Kategorie-Meisterschaft) ----------
    ...CATEGORY_BADGES,

    // ---------- Reise-Kontext (🧭 Kontext-Button) ----------
    { id: "context_first", group: "context", icon: "💡", name: "Erster Aha-Moment", nameEn: "First aha moment",  type: "counter", metric: "contextCardsViewed", threshold: 1,
      description: "Öffne deinen ersten Reise-Kontext.",   descriptionEn: "Open your first travel context.",   unlockedText: "Du siehst, wie ein Satz unterwegs wirklich verwendet wird.", unlockedTextEn: "You can see how a phrase is really used on the road." },
    { id: "context_10",    group: "context", icon: "🧭", name: "Kontext-Kompass",   nameEn: "Context compass",   type: "counter", metric: "contextCardsViewed", threshold: 10,
      description: "Sieh dir den Kontext von 10 Karten an.", descriptionEn: "View the context of 10 cards.",   unlockedText: "Du lernst nicht nur Wörter, sondern echte Reisesituationen.", unlockedTextEn: "You're learning not just words, but real travel situations." },
    { id: "context_25",    group: "context", icon: "🌎", name: "Real-Life Ready",   nameEn: "Real-Life Ready",   type: "counter", metric: "contextCardsViewed", threshold: 25,
      description: "Sieh dir den Kontext von 25 Karten an.", descriptionEn: "View the context of 25 cards.",   unlockedText: "Du verstehst immer besser, wie Spanisch unterwegs klingt.", unlockedTextEn: "You're getting a better and better feel for how Spanish sounds on the road." },

    // ---------- Hostel Mode (Üben zu zweit) ----------
    { id: "battle_first",   group: "hostel", icon: "⚔️", name: "First Duel",        nameEn: "First Duel",        type: "counter", metric: "battlesPlayed", threshold: 1,
      description: "Spiele dein erstes Hostel Battle.", descriptionEn: "Play your first Hostel Battle.", unlockedText: "Dein erstes Sprachduell ist geschafft.", unlockedTextEn: "Your first language duel is done." },
    { id: "battle_win",     group: "hostel", icon: "🏆", name: "Dorm Champion",      nameEn: "Dorm Champion",     type: "counter", metric: "battlesWon", threshold: 1,
      description: "Gewinne ein Battle (klarer Sieger).", descriptionEn: "Win a battle (clear winner).", unlockedText: "Du hast dich im Hostel Battle durchgesetzt.", unlockedTextEn: "You came out on top in the Hostel Battle." },
    { id: "battle_10",      group: "hostel", icon: "🎒", name: "Battle Backpacker",  nameEn: "Battle Backpacker", type: "counter", metric: "battlesPlayed", threshold: 10,
      description: "Spiele 10 Battles.",               descriptionEn: "Play 10 battles.",               unlockedText: "Schon durch viele Sprachduelle gekämpft.", unlockedTextEn: "You've fought your way through plenty of language duels." },
    { id: "battle_perfect", group: "hostel", icon: "✅", name: "Perfect Check-in",   nameEn: "Perfect Check-in",  type: "counter", metric: "perfectBattles", threshold: 1,
      description: "Beende ein Battle ohne Fehler (volle Punktzahl).", descriptionEn: "Finish a battle without mistakes (full marks).", unlockedText: "Sauber durchgezogen – keine Aussetzer.", unlockedTextEn: "Pulled off cleanly – no slip-ups." },
    { id: "battle_comeback",group: "hostel", icon: "🔁", name: "Comeback Kid",       nameEn: "Comeback Kid",      type: "counter", metric: "comebacks", threshold: 1,
      description: "Gewinne ein Battle nach Rückstand.", descriptionEn: "Win a battle after falling behind.", unlockedText: "Erst gestolpert, dann gewonnen.", unlockedTextEn: "Stumbled first, then won." },
    { id: "roleplay_first", group: "hostel", icon: "🎭", name: "First Scene",        nameEn: "First Scene",       type: "counter", metric: "roleplaysCompleted", threshold: 1,
      description: "Spiele dein erstes Rollenspiel.",  descriptionEn: "Play your first role-play.",     unlockedText: "Dein erstes Gespräch laut durchgespielt.", unlockedTextEn: "You've played out your first conversation out loud." },
    { id: "roleplay_5",     group: "hostel", icon: "🎬", name: "Scene Collector",    nameEn: "Scene Collector",   type: "counter", metric: "roleplaysCompleted", threshold: 5,
      description: "Spiele 5 verschiedene Rollenspiele.", descriptionEn: "Play 5 different role-plays.", unlockedText: "Viele echte Reisesituationen trainiert.", unlockedTextEn: "Trained on plenty of real travel situations." },

    // ---------- Definiciones (Zuordnen-Quiz) ----------
    { id: "quiz_first",   group: "quiz", icon: "🧩", name: "Erste Zuordnung",   nameEn: "First match",     type: "counter", metric: "quizzesPlayed", threshold: 1,
      description: "Schließe dein erstes Definiciones-Quiz ab.", descriptionEn: "Complete your first Definiciones quiz.", unlockedText: "Du lernst Wörter jetzt auch über ihre Bedeutung.", unlockedTextEn: "You're now learning words through their meaning too." },
    { id: "quiz_10",      group: "quiz", icon: "📖", name: "Wort-Detektiv",     nameEn: "Word detective",  type: "counter", metric: "quizzesPlayed", threshold: 10,
      description: "Schließe 10 Definiciones-Quizze ab.",       descriptionEn: "Complete 10 Definiciones quizzes.",      unlockedText: "Du erkennst Begriffe an ihrer Beschreibung – stark.", unlockedTextEn: "You can spot terms from their description – nice work." },
    { id: "quiz_perfect", group: "quiz", icon: "💯", name: "Sin errores",       nameEn: "Sin errores",     type: "counter", metric: "quizzesPerfect", threshold: 1,
      description: "Beende ein Quiz ohne Fehler.",              descriptionEn: "Finish a quiz without mistakes.",        unlockedText: "Fehlerfrei durchgespielt – alles richtig zugeordnet.", unlockedTextEn: "Played through flawlessly – everything matched correctly." },

    // ---------- ¿Y esto? (Bild-Vokabel-Modus mit Countdown) ----------
    { id: "yesto_first",   group: "yesto", icon: "👀", name: "¿Y esto?",          nameEn: "¿Y esto?",          type: "counter", metric: "yestoPlayed", threshold: 1,
      description: "Schließe deine erste ¿Y-esto?-Runde ab.", descriptionEn: "Complete your first ¿Y esto? round.", unlockedText: "Du erkennst Wörter jetzt auch übers Bild – richtig gut.", unlockedTextEn: "You're recognising words from the picture now – nicely done." },
    { id: "yesto_10",      group: "yesto", icon: "🖼️", name: "Ojo entrenado",      nameEn: "Trained eye",       type: "counter", metric: "yestoPlayed", threshold: 10,
      description: "Schließe 10 ¿Y-esto?-Runden ab.",        descriptionEn: "Complete 10 ¿Y esto? rounds.",        unlockedText: "Bild gesehen, Wort parat – dein Auge ist trainiert.", unlockedTextEn: "Picture seen, word ready – your eye is trained." },
    { id: "yesto_perfect", group: "yesto", icon: "💯", name: "Todo a la vista",    nameEn: "Todo a la vista",   type: "counter", metric: "yestoPerfect", threshold: 1,
      description: "Beende eine ¿Y-esto?-Runde, in der du jedes Bild wusstest.", descriptionEn: "Finish a ¿Y esto? round where you knew every picture.", unlockedText: "Jedes Motiv auf Anhieb gewusst – glasklar.", unlockedTextEn: "Knew every picture straight away – crystal clear." },

    // ---------- Satzbaukasten (Frases flexibles) ----------
    { id: "frases_first",   group: "construir", icon: "🧱", name: "Erster Baustein",   nameEn: "First building block", type: "counter", metric: "frasesPlayed", threshold: 1,
      description: "Schließe deine erste Satzbaukasten-Runde ab.", descriptionEn: "Complete your first sentence builder round.", unlockedText: "Du baust Sätze jetzt selbst zusammen, statt nur zu übersetzen.", unlockedTextEn: "You're now building sentences yourself instead of just translating." },
    { id: "frases_10",      group: "construir", icon: "🏗️", name: "Satz-Architekt",    nameEn: "Sentence architect",   type: "counter", metric: "frasesPlayed", threshold: 10,
      description: "Schließe 10 Satzbaukasten-Runden ab.",        descriptionEn: "Complete 10 sentence builder rounds.",       unlockedText: "Aus Bausteinen werden flüssige Reisesätze.", unlockedTextEn: "Building blocks turn into fluent travel sentences." },
    { id: "frases_perfect", group: "construir", icon: "💯", name: "Construcción perfecta", nameEn: "Construcción perfecta", type: "counter", metric: "frasesPerfect", threshold: 1,
      description: "Beende eine Runde ohne Fehler.",              descriptionEn: "Finish a round without mistakes.",          unlockedText: "Jede Lücke richtig gefüllt – sauber gebaut.", unlockedTextEn: "Every gap filled correctly – cleanly built." },
    { id: "frases_themes",  group: "construir", icon: "🏛️", name: "Constructor experto",  nameEn: "Constructor experto",  type: "counter", metric: "frasesThemesCompleted", threshold: 7,
      description: "Schließe jedes Frases-Thema mindestens einmal ab.", descriptionEn: "Complete every Frases theme at least once.", unlockedText: "Von der Busfahrt bis zum Smalltalk – jede Reise-Situation gebaut.", unlockedTextEn: "From the bus ride to small talk – every travel situation built." },

    // ---------- Banderas (Flaggen-Quiz) ----------
    { id: "banderas_first",   group: "banderas", icon: "🚩", name: "Primera bandera",     nameEn: "First flag",       type: "counter", metric: "banderasPlayed", threshold: 1,
      description: "Schließe deine erste Banderas-Runde ab.", descriptionEn: "Complete your first Banderas round.", unlockedText: "Du erkennst die ersten Flaggen Lateinamerikas.", unlockedTextEn: "You're recognising your first Latin American flags." },
    { id: "banderas_10",      group: "banderas", icon: "🌎", name: "Geógrafo",            nameEn: "Geographer",       type: "counter", metric: "banderasPlayed", threshold: 10,
      description: "Schließe 10 Banderas-Runden ab.",        descriptionEn: "Complete 10 Banderas rounds.",        unlockedText: "Farben, Sterne, Sonnen – du liest Flaggen wie eine Landkarte.", unlockedTextEn: "Colours, stars, suns – you read flags like a map." },
    { id: "banderas_perfect", group: "banderas", icon: "💯", name: "Bandera perfecta",    nameEn: "Bandera perfecta", type: "counter", metric: "banderasPerfect", threshold: 1,
      description: "Beende eine Banderas-Runde ohne Fehler.", descriptionEn: "Finish a Banderas round without mistakes.", unlockedText: "Jede Flagge auf Anhieb richtig zugeordnet.", unlockedTextEn: "Matched every flag correctly on the first try." },
    { id: "banderas_sets",    group: "banderas", icon: "🗺️", name: "Cartógrafo",          nameEn: "Cartographer",     type: "counter", metric: "banderasSetsCompleted", threshold: 3,
      description: "Spiele alle drei Banderas-Runden (Sudamérica, Centroamérica, Mix).", descriptionEn: "Play all three Banderas rounds (South America, Central America, mix).", unlockedText: "Von den Anden bis zur Karibik – jede Region einmal gespielt.", unlockedTextEn: "From the Andes to the Caribbean – every region played once." },

    // ---------- Hören (Escuchar & Precios) ----------
    { id: "listen_first", group: "listening", icon: "👂", name: "Primer oído",        nameEn: "Primer oído",        type: "counter", metric: "listenReviews", threshold: 1,
      description: "Lerne deine erste Karte im Hör-Modus.",   descriptionEn: "Learn your first card in listening mode.", unlockedText: "Du trainierst jetzt auch dein Ohr für echtes LatAm-Spanisch.", unlockedTextEn: "You're now training your ear for real LatAm Spanish too." },
    { id: "listen_25",    group: "listening", icon: "🎧", name: "Buen oído",          nameEn: "Buen oído",          type: "counter", metric: "listenReviews", threshold: 25,
      description: "Bewerte 25 Karten im Hör-Modus.",         descriptionEn: "Rate 25 cards in listening mode.",       unlockedText: "Gesprochenes Spanisch zu verstehen fällt dir spürbar leichter.", unlockedTextEn: "Understanding spoken Spanish is noticeably easier for you." },
    { id: "precios_first",group: "listening", icon: "💵", name: "Oído para precios",  nameEn: "Oído para precios",  type: "counter", metric: "preciosPlayed", threshold: 1,
      description: "Schließe deine erste Preis-Hörrunde ab.", descriptionEn: "Complete your first price listening round.", unlockedText: "Preise am Busbahnhof verlieren ihren Schrecken.", unlockedTextEn: "Prices at the bus station lose their terror." },
    { id: "precios_perfect",group: "listening", icon: "💯", name: "Sin perder un peso", nameEn: "Sin perder un peso", type: "counter", metric: "preciosPerfect", threshold: 1,
      description: "Beende eine Preis-Hörrunde ohne Fehler.", descriptionEn: "Finish a price listening round without mistakes.", unlockedText: "Jeden Betrag richtig gehört – kein Wechselgeld-Fehler mehr.", unlockedTextEn: "Heard every amount right – no more change mix-ups." },
    { id: "precios_millon",group: "listening", icon: "🤑", name: "Millonario de oído", nameEn: "Millonario de oído", type: "counter", metric: "preciosMillon", threshold: 1,
      description: "Meistere eine Runde „Große Beträge“ fehlerfrei (z. B. kolumbianische Millionenpreise).", descriptionEn: "Master a „Big amounts“ round flawlessly (e.g. Colombian million-peso prices).", unlockedText: "Selbst „un millón quinientos mil“ tippst du jetzt ohne Zögern.", unlockedTextEn: "Even „un millón quinientos mil“ you type without hesitation now." },

    // ---------- Mutproben (Real-Life Challenges) ----------
    { id: "challenge_first", group: "reallife", icon: "💬", name: "Mutiger erster Satz", nameEn: "Brave first sentence", type: "counter", metric: "challengesCompleted", threshold: 1,
      description: "Hake deine erste Real-Life Challenge ab.", descriptionEn: "Tick off your first Real-Life Challenge.", unlockedText: "Du hast Spanisch nicht nur gelernt, sondern benutzt.", unlockedTextEn: "You didn't just learn Spanish, you used it." },
    { id: "challenge_5",     group: "reallife", icon: "🚪", name: "Comfort Zone Exit",   nameEn: "Comfort Zone Exit",   type: "counter", metric: "challengesCompleted", threshold: 5,
      description: "Hake 5 Real-Life Challenges ab.", descriptionEn: "Tick off 5 Real-Life Challenges.", unlockedText: "Raus aus der App, rein ins echte Sprechen.", unlockedTextEn: "Out of the app and into real speaking." },
    { id: "challenge_10",    group: "reallife", icon: "🗣️", name: "Straßen-Spanisch",     nameEn: "Street Spanish",      type: "counter", metric: "challengesCompleted", threshold: 10,
      description: "Hake 10 Real-Life Challenges ab.", descriptionEn: "Tick off 10 Real-Life Challenges.", unlockedText: "Zehn echte Gespräche – das ist gelebtes Spanisch.", unlockedTextEn: "Ten real conversations – that's Spanish in the wild." },

    // ---------- El Cuerpo (interaktive Körperkarte) ----------
    { id: "cuerpo_first", group: "cuerpo", icon: "👆", name: "Primer toque",   nameEn: "Primer toque",    type: "counter", metric: "bodyPartsExplored", threshold: 1,
      description: "Tippe dein erstes Körperteil an.", descriptionEn: "Tap your first body part.", unlockedText: "Du erkundest den Körper jetzt auf Spanisch.", unlockedTextEn: "You're exploring the body in Spanish now." },
    { id: "cuerpo_10",    group: "cuerpo", icon: "🦴", name: "Anatomista",     nameEn: "Anatomista",      type: "counter", metric: "bodyPartsExplored", threshold: 10,
      description: "Erkunde 10 verschiedene Körperteile.", descriptionEn: "Explore 10 different body parts.", unlockedText: "Halber Körper sitzt – beim Arzt zeigst du jetzt mit Worten.", unlockedTextEn: "Half the body down – at the doctor's you can point with words now." },
    { id: "cuerpo_all",   group: "cuerpo", icon: "🧍", name: "Cuerpo completo", nameEn: "Cuerpo completo", type: "counter", metric: "bodyPartsExplored", threshold: 20,
      description: "Erkunde alle Körperteile auf der Karte.", descriptionEn: "Explore every body part on the map.", unlockedText: "Von «la cabeza» bis «los pies» – alles erkundet.", unlockedTextEn: "From «la cabeza» to «los pies» – all explored." },

    // ---------- Spezial ----------
    { id: "night_owl",  group: "special", icon: "🌙", name: "Midnight Español",         nameEn: "Midnight Español",       type: "flag", metric: "nightOwl", secret: true,
      description: "Lerne nach 22 Uhr.",        descriptionEn: "Learn after 10 pm.",      unlockedText: "Noch schnell ein bisschen Spanisch vor dem Schlafen.", unlockedTextEn: "A quick bit of Spanish before bed." },
    { id: "early_bird", group: "special", icon: "☕", name: "Café con Vocabulario",     nameEn: "Café con Vocabulario",   type: "flag", metric: "earlyBird", secret: true,
      description: "Lerne vor 9 Uhr.",          descriptionEn: "Learn before 9 am.",      unlockedText: "Spanisch gelernt, bevor der Tag richtig losging.", unlockedTextEn: "Learned Spanish before the day had properly started." },
    { id: "many_again", group: "special", icon: "🔁", name: "Nochmal ist kein Scheitern", nameEn: "Again is not failure",   type: "counter", metric: "againPresses", threshold: 20,
      description: "Drücke 20× „Otra vez“.",    descriptionEn: "Press „Otra vez“ 20 times.", unlockedText: "Du hast weitergemacht, obwohl es nicht sofort saß.", unlockedTextEn: "You kept going even when it didn't click straight away." },
    { id: "persistent", group: "special", icon: "💪", name: "Drangeblieben",            nameEn: "Stuck with it",          type: "counter", metric: "totalReviews", threshold: 500,
      description: "Sammle 500 Bewertungen.",   descriptionEn: "Collect 500 reviews.",    unlockedText: "Fünfhundert Bewertungen – das ist Ausdauer.", unlockedTextEn: "Five hundred reviews – that's stamina." },
  ];

  const BY_ID = BADGES.reduce((acc, b) => { acc[b.id] = b; return acc; }, {});

  // ===================================================================
  // LOCALS-TRACK (es-en, Englisch lernen): eigene Badge-Welt OHNE Reise-
  // Metaphern. Reise-Edition bleibt 1:1 erhalten – die Auswahl erfolgt zur
  // Laufzeit über den aktiven Track (isLocalsTrack), nicht beim Laden.
  // ===================================================================
  const LOC_GROUPS = [
    { id: "learning", label: "Fortschritt", labelEn: "Progress",      icon: "🧭" },
    { id: "streak",   label: "Dranbleiben", labelEn: "Keeping it up", icon: "🔥" },
    { id: "category", label: "Bereiche",    labelEn: "Topics",        icon: "🗂️" },
    { id: "context",  label: "Kontext",     labelEn: "Context",       icon: "💡" },
    { id: "special",  label: "Spezial",     labelEn: "Special",       icon: "✨" },
  ];
  // Kategorie-Badges für den Locals-Track: an echte loc-Kategorien gekoppelt,
  // Job-/Alltags-Englisch statt Reise. category-Id = cat einer loc-Karte.
  const LOC_CATEGORY_BADGES = [
    { category: "saludos-en",       icon: "👋", name: "Smalltalk-Starter",  nameEn: "Small talk starter", description: "Meistere 80 % der Saludos-Karten.",        descriptionEn: "Master 80% of the greetings cards." },
    { category: "meseros",          icon: "🍽️", name: "Service-Profi",      nameEn: "Service pro",        description: "Meistere 80 % der Restaurant-Karten.",     descriptionEn: "Master 80% of the restaurant cards." },
    { category: "bpo-en",           icon: "🎧", name: "Call-Center-Profi",   nameEn: "Call-center pro",    description: "Meistere 80 % der Call-Center-Karten.",    descriptionEn: "Master 80% of the call-center cards." },
    { category: "tech-en",          icon: "💻", name: "Tech-Englisch",       nameEn: "Tech English",       description: "Meistere 80 % der Tech-Karten.",           descriptionEn: "Master 80% of the tech cards." },
    { category: "entrevista",       icon: "💼", name: "Interview-bereit",    nameEn: "Interview-ready",    description: "Meistere 80 % der Interview-Karten.",      descriptionEn: "Master 80% of the interview cards." },
    { category: "cliente-en",       icon: "🤝", name: "Kundenliebling",      nameEn: "Customer-service star", description: "Meistere 80 % der Kundenservice-Karten.", descriptionEn: "Master 80% of the customer-service cards." },
    { category: "oficina",          icon: "🖥️", name: "Büro-Englisch",       nameEn: "Office English",     description: "Meistere 80 % der Büro-Karten.",           descriptionEn: "Master 80% of the office cards." },
    { category: "direcciones",      icon: "🗺️", name: "Wegweiser",           nameEn: "Wayfinder",          description: "Meistere 80 % der Wegbeschreibung-Karten.", descriptionEn: "Master 80% of the directions cards." },
    { category: "dinero-en",        icon: "💵", name: "Geld & Bank",         nameEn: "Money & bank",       description: "Meistere 80 % der Geld-Karten.",           descriptionEn: "Master 80% of the money cards." },
    { category: "gramatica-en",     icon: "📐", name: "Grammatik-Grundlagen", nameEn: "Grammar basics",    description: "Meistere 80 % der Grammatik-Karten.",      descriptionEn: "Master 80% of the grammar cards." },
    { category: "numeros-en",       icon: "🔢", name: "Zahlen & Daten",      nameEn: "Numbers & dates",    description: "Meistere 80 % der Zahlen-Karten.",         descriptionEn: "Master 80% of the numbers cards." },
    { category: "pronunciacion-en", icon: "🔊", name: "Klare Aussprache",    nameEn: "Clear pronunciation", description: "Meistere 80 % der Aussprache-Karten.",    descriptionEn: "Master 80% of the pronunciation cards." },
  ].map((b) => Object.assign({
    id: "cat_" + b.category, group: "category", type: "categoryMastery", threshold: 0.8,
    unlockedText: "Du kommst in diesem Bereich klar. 👍", unlockedTextEn: "You can hold your own in this area. 👍",
  }, b));
  // Re-thematisierte Texte (Job/Alltag-Englisch) für die im Locals-Track sichtbaren
  // Standard-Badges. Nur die abweichenden Felder; der Rest wird vom Original geerbt.
  const LOC_OVERRIDES = {
    first_steps:     { name: "Erste Worte",        nameEn: "First words",        description: "Lerne deine erste Karte.",       descriptionEn: "Learn your first card.",        unlockedText: "Dein erster Schritt ins Englische ist gemacht.", unlockedTextEn: "You've taken your first step into English." },
    ten_cards:       { icon: "📒", name: "10 Vokabeln",  nameEn: "10 words learned",  description: "Lerne 10 verschiedene Karten.",  descriptionEn: "Learn 10 different cards.",     unlockedText: "Dein Englisch nimmt Fahrt auf.", unlockedTextEn: "Your English is picking up speed." },
    fifty_cards:     { icon: "📗", name: "50 Vokabeln",  nameEn: "50 words learned",  description: "Lerne 50 verschiedene Karten.",  descriptionEn: "Learn 50 different cards.",     unlockedText: "Genug Englisch für viele Alltagssituationen.", unlockedTextEn: "Enough English for plenty of everyday situations." },
    hundred_cards:   { icon: "📚", name: "100 Vokabeln", nameEn: "100 words learned", description: "Lerne 100 verschiedene Karten.", descriptionEn: "Learn 100 different cards.",    unlockedText: "Du kommst im Job sprachlich gut zurecht.", unlockedTextEn: "You can hold your own at work." },
    twohundred_cards:{ name: "200 Vokabeln", nameEn: "200 words learned", description: "Lerne 200 verschiedene Karten.", descriptionEn: "Learn 200 different cards.",    unlockedText: "Ein solider englischer Wortschatz steht.", unlockedTextEn: "A solid English vocabulary is in place." },
    all_cards:       { name: "Alle Karten gesehen", nameEn: "Whole deck learned", description: "Lerne alle Karten mindestens einmal.", descriptionEn: "Learn every card at least once.", unlockedText: "Du hast das komplette Deck durchgearbeitet.", unlockedTextEn: "You've worked through the entire deck." },
    streak_3:        { name: "Drei Tage am Stück", nameEn: "Three days in a row", unlockedText: "Drei Tage ohne Pause gelernt.", unlockedTextEn: "Three days of learning without a break." },
    streak_7:        { name: "Eine Woche dran",  nameEn: "A week of practice", unlockedText: "Eine ganze Woche Englisch durchgezogen.", unlockedTextEn: "A whole week of English, done." },
    streak_14:       { icon: "📆", name: "Zwei Wochen Routine", nameEn: "Two-week routine", unlockedText: "Englisch ist Teil deines Tages geworden.", unlockedTextEn: "English has become part of your day." },
    streak_30:       { name: "Tägliche Gewohnheit", nameEn: "Daily habit", unlockedText: "Aus Lernen ist eine echte Gewohnheit geworden.", unlockedTextEn: "Learning has turned into a real habit." },
    ruta_dia_first:  { name: "Tagesplan gestartet", nameEn: "Daily plan started", description: "Starte deinen ersten Tagesplan.", descriptionEn: "Start your first daily plan.", unlockedText: "Dein täglicher Mini-Plan steht.", unlockedTextEn: "Your daily mini-plan is set." },
    ruta_dia_7:      { icon: "📅", name: "Sieben Tagespläne", nameEn: "Seven daily plans", description: "Mach an 7 Tagen einen Tagesplan.", descriptionEn: "Do a daily plan on 7 days.", unlockedText: "Sieben tägliche Einheiten – stark dran.", unlockedTextEn: "Seven daily sessions – great consistency." },
    pretrip_done:    { icon: "🎓", name: "Lernpfad-Meilenstein", nameEn: "Learning-path milestone", description: "Schließe 7 Teile deines Lernpfads ab.", descriptionEn: "Complete 7 parts of your learning path.", unlockedText: "Sieben Etappen im Lernpfad geschafft.", unlockedTextEn: "Seven parts of your learning path done." },
    context_first:   { name: "Erster Aha-Moment", nameEn: "First aha moment", description: "Öffne deinen ersten Kontext.", descriptionEn: "Open your first context.", unlockedText: "Du siehst, wie ein Satz im Alltag wirklich benutzt wird.", unlockedTextEn: "You can see how a phrase is really used in real life." },
    context_10:      { icon: "💡", name: "Kontext-Kenner", nameEn: "Context connoisseur", description: "Sieh dir den Kontext von 10 Karten an.", descriptionEn: "View the context of 10 cards.", unlockedText: "Du lernst nicht nur Wörter, sondern echte Situationen.", unlockedTextEn: "You're learning not just words, but real situations." },
    context_25:      { icon: "🌐", name: "Bereit für echte Gespräche", nameEn: "Ready for real conversations", description: "Sieh dir den Kontext von 25 Karten an.", descriptionEn: "View the context of 25 cards.", unlockedText: "Du verstehst immer besser, wie Englisch im Alltag klingt.", unlockedTextEn: "You're getting a better feel for how English sounds in real life." },
    night_owl:       { name: "Englisch um Mitternacht", nameEn: "Midnight English", unlockedText: "Noch schnell etwas Englisch vor dem Schlafen.", unlockedTextEn: "A quick bit of English before bed." },
    early_bird:      { name: "Englisch zum Kaffee", nameEn: "English with coffee", unlockedText: "Englisch gelernt, bevor der Tag losging.", unlockedTextEn: "Learned English before the day started." },
  };
  // Aktive Badge-Welt für den Locals-Track: Reise-Spielmodus-Gruppen raus
  // (banderas/cuerpo/listening/yesto/construir/quiz/hostel/reallife – Features,
  // die es im Locals-Track nicht gibt), Kategorie-Badges ersetzt, Texte überlagert.
  const LOC_KEEP_GROUPS = { learning: 1, streak: 1, context: 1, special: 1 };
  const LOC_BADGES = BADGES
    .filter((b) => b.group !== "category" && LOC_KEEP_GROUPS[b.group])
    .map((b) => (LOC_OVERRIDES[b.id] ? Object.assign({}, b, LOC_OVERRIDES[b.id]) : b))
    .concat(LOC_CATEGORY_BADGES);
  const LOC_BY_ID = LOC_BADGES.reduce((acc, b) => { acc[b.id] = b; return acc; }, {});

  // ===================================================================
  // HELLOABROAD-TRACK (de-en, Reise-Englisch lernen): eigene Badge-Welt
  // für Deutsche, die fürs Reisen ENGLISCH lernen. Wie beim Locals-Track
  // wird sie zur Laufzeit über window.SC.track (isDeEnTrack) gewählt; die
  // reise-spanische Default-Welt (BADGES) bleibt unangetastet.
  //
  // Zwei Korrekturen gegenüber der Default-Welt:
  //  1) KEIN Spanisch/LatAm: die Reise-Welt trägt spanische Badge-Namen
  //     („¿Y esto?", „Primer oído", „Peso-Profi" …) und LatAm-Bezüge
  //     („Reise-Spanisch", „Flaggen Lateinamerikas") – in einer Deutsch→
  //     Englisch-App ein Fremdkörper. Hier deutsch/englisch neu betextet.
  //  2) NUR erreichbare Features: HelloAbroad (Discover-Tracks, siehe
  //     ui.js/app.js) bietet Satzbaukasten, „Was ist das?", Preise-Hören
  //     und die Körperkarte – ABER kein Modo hostal (Battle/Rollenspiel),
  //     keine Definiciones, keine Banderas, keine Ruta del día / Pre-Trip.
  //     Deren Badges würden ewig gesperrt bleiben – also raus.
  // ===================================================================
  const DEEN_GROUPS = [
    { id: "learning", label: "Lernreise",     labelEn: "Learning journey", icon: "🧭" },
    { id: "streak",   label: "Dranbleiben",   labelEn: "Keeping it up",    icon: "🔥" },
    { id: "category", label: "Bereiche",      labelEn: "Topics",           icon: "🗂️" },
    { id: "context",  label: "Reise-Kontext", labelEn: "Travel context",   icon: "🧭" },
    { id: "construir",label: "Satzbaukasten", labelEn: "Sentence builder", icon: "🧱" },
    { id: "yesto",    label: "Was ist das?",  labelEn: "What's this?",      icon: "👀" },
    { id: "listening",label: "Hören",         labelEn: "Listening",         icon: "👂" },
    { id: "cuerpo",   label: "Körper",        labelEn: "The body",          icon: "🧍" },
    { id: "special",  label: "Spezial",       labelEn: "Special",           icon: "✨" },
  ];
  // Kategorie-Badges an die HelloAbroad-categoryAllowlist gekoppelt (siehe
  // editions/registry.js). Jede erlaubte Kategorie bekommt ein Reward – auch
  // die in der Reise-Welt bisher badgelosen (flughafen/banco/auto/farmacia).
  // Keine peso-/taco-Bezüge: generisches Reise-Englisch. category-Id = data.js-cat.
  const DEEN_CATEGORY_BADGES = [
    { category: "basics",    icon: "💬", name: "Erste Worte",        nameEn: "First words",        description: "Meistere 80 % der Grundlagen-Karten.",   descriptionEn: "Master 80% of the basics cards." },
    { category: "talk",      icon: "🤝", name: "Smalltalk-Starter",  nameEn: "Small talk starter", description: "Meistere 80 % der Smalltalk-Karten.",    descriptionEn: "Master 80% of the small talk cards." },
    { category: "flughafen", icon: "✈️", name: "Flughafen-Profi",    nameEn: "Airport pro",        description: "Meistere 80 % der Flughafen-Karten.",    descriptionEn: "Master 80% of the airport cards." },
    { category: "grenze",    icon: "🛂", name: "Grenzgänger",        nameEn: "Border crosser",     description: "Meistere 80 % der Behörden-Karten.",     descriptionEn: "Master 80% of the officialdom cards." },
    { category: "hotel",     icon: "🔑", name: "Check-in-Champion",  nameEn: "Check-in champion",  description: "Meistere 80 % der Hotel-Karten.",        descriptionEn: "Master 80% of the hotel cards." },
    { category: "hostel",    icon: "🛏️", name: "Hostel-Held",        nameEn: "Hostel hero",        description: "Meistere 80 % der Hostel-Karten.",       descriptionEn: "Master 80% of the hostel cards." },
    { category: "essen",     icon: "🍽️", name: "Menü-Meister",       nameEn: "Menu master",        description: "Meistere 80 % der Essen-Karten.",        descriptionEn: "Master 80% of the food cards." },
    { category: "trinken",   icon: "🥤", name: "Runde geht auf mich", nameEn: "Drinks are on me",  description: "Meistere 80 % der Trinken-Karten.",      descriptionEn: "Master 80% of the drinks cards." },
    { category: "compras",   icon: "🛍️", name: "Einkaufs-Profi",     nameEn: "Shopping pro",       description: "Meistere 80 % der Einkaufen-Karten.",    descriptionEn: "Master 80% of the shopping cards." },
    { category: "dinero",    icon: "💵", name: "Geld-Profi",         nameEn: "Money pro",          description: "Meistere 80 % der Geld-Karten.",         descriptionEn: "Master 80% of the money cards." },
    { category: "banco",     icon: "🏧", name: "Bank-Basics",        nameEn: "Bank basics",        description: "Meistere 80 % der Bank-Karten.",         descriptionEn: "Master 80% of the bank cards." },
    { category: "verkehr",   icon: "🚌", name: "Unterwegs-Profi",    nameEn: "Getting-around pro", description: "Meistere 80 % der Verkehr-Karten.",      descriptionEn: "Master 80% of the transport cards." },
    { category: "rumbo",     icon: "🧭", name: "Wegfinder",          nameEn: "Wayfinder",          description: "Meistere 80 % der Wegbeschreibung-Karten.", descriptionEn: "Master 80% of the directions cards." },
    { category: "auto",      icon: "🚗", name: "Mietwagen-Meister",  nameEn: "Rental-car master",  description: "Meistere 80 % der Auto-Karten.",         descriptionEn: "Master 80% of the car cards." },
    { category: "farmacia",  icon: "💊", name: "Apotheken-Held",     nameEn: "Pharmacy hero",      description: "Meistere 80 % der Apotheken-Karten.",    descriptionEn: "Master 80% of the pharmacy cards." },
    { category: "notfall",   icon: "🆘", name: "Ruhe im Chaos",      nameEn: "Calm in chaos",      description: "Meistere 80 % der Notfall-Karten.",      descriptionEn: "Master 80% of the emergency cards." },
  ].map((b) => Object.assign({
    id: "cat_" + b.category, group: "category", type: "categoryMastery", threshold: 0.8,
    unlockedText: "Du kommst in diesem Bereich klar. 🎒", unlockedTextEn: "You can hold your own in this area. 🎒",
  }, b));
  // Neu betextete Standard-Badges für den HelloAbroad-Track: nur die abweichenden
  // Felder (Rest wird vom Original geerbt). Ziel: kein Spanisch, kein „HolaRuta"/
  // „Ruta"-Marken- oder LatAm-Bezug – stattdessen Reise-Englisch/„unterwegs".
  const DEEN_OVERRIDES = {
    // Lernreise
    first_steps:     { unlockedText: "Dein erster Schritt unterwegs ist gemacht.", unlockedTextEn: "You've taken your first step on the road." },
    ten_cards:       { unlockedText: "Dein Reise-Englisch kommt in Fahrt.", unlockedTextEn: "Your travel English is picking up speed." },
    fifty_cards:     { unlockedText: "Genug Englisch für viele Alltagssituationen.", unlockedTextEn: "Enough English for plenty of everyday situations." },
    hundred_cards:   { name: "Reise-Rookie", nameEn: "Travel rookie", unlockedText: "Du findest dich sprachlich unterwegs zurecht.", unlockedTextEn: "You can find your way around in the language on the road." },
    all_cards:       { name: "HelloAbroad Legend", nameEn: "HelloAbroad Legend", unlockedText: "Du hast das komplette Reise-Deck durchgespielt.", unlockedTextEn: "You've worked through the entire travel deck." },
    // Dranbleiben
    streak_3:        { unlockedText: "Drei Tage am Stück drangeblieben.", unlockedTextEn: "Three days in a row without a break." },
    streak_7:        { unlockedText: "Eine Woche Reise-Englisch durchgezogen.", unlockedTextEn: "A whole week of travel English, done." },
    streak_14:       { unlockedText: "Englisch ist Teil deiner Reiseroutine.", unlockedTextEn: "English is part of your travel routine now." },
    streak_30:       { name: "Reise-Ritual", nameEn: "Travel ritual", unlockedText: "Aus Lernen ist eine echte Gewohnheit geworden.", unlockedTextEn: "Learning has turned into a real habit." },
    // Reise-Kontext
    context_25:      { unlockedText: "Du verstehst immer besser, wie Englisch unterwegs klingt.", unlockedTextEn: "You're getting a better and better feel for how English sounds on the road." },
    // Satzbaukasten
    frases_perfect:  { name: "Perfekt gebaut", nameEn: "Perfectly built" },
    frases_themes:   { name: "Bau-Experte", nameEn: "Master builder", description: "Schließe jedes Satzbaukasten-Thema mindestens einmal ab.", descriptionEn: "Complete every sentence builder theme at least once." },
    // Was ist das?
    yesto_first:     { name: "Was ist das?", nameEn: "What's this?", description: "Schließe deine erste „Was ist das?“-Runde ab.", descriptionEn: "Complete your first What's this? round." },
    yesto_10:        { name: "Geschultes Auge", nameEn: "Trained eye", description: "Schließe 10 „Was ist das?“-Runden ab.", descriptionEn: "Complete 10 What's this? rounds." },
    yesto_perfect:   { name: "Alles im Blick", nameEn: "All in sight", description: "Beende eine „Was ist das?“-Runde, in der du jedes Bild wusstest.", descriptionEn: "Finish a What's this? round where you knew every picture." },
    // Hören
    listen_first:    { name: "Erstes Hören", nameEn: "First listen", unlockedText: "Du trainierst jetzt auch dein Ohr für echtes Reise-Englisch.", unlockedTextEn: "You're now training your ear for real spoken English too." },
    listen_25:       { name: "Gutes Ohr", nameEn: "Good ear", unlockedText: "Gesprochenes Englisch zu verstehen fällt dir spürbar leichter.", unlockedTextEn: "Understanding spoken English is noticeably easier for you." },
    precios_first:   { name: "Preis-Gehör", nameEn: "Ear for prices" },
    precios_perfect: { name: "Kein Cent verloren", nameEn: "Not a penny lost" },
    // Körper
    cuerpo_first:    { name: "Erster Tipp", nameEn: "First tap", unlockedText: "Du erkundest den Körper jetzt auf Englisch.", unlockedTextEn: "You're exploring the body in English now." },
    cuerpo_10:       { name: "Anatom", nameEn: "Anatomist" },
    cuerpo_all:      { name: "Ganzer Körper", nameEn: "Whole body", unlockedText: "Vom Kopf bis zu den Füßen – alles erkundet.", unlockedTextEn: "From head to toe – all explored." },
    // Spezial
    night_owl:       { name: "Mitternachts-Englisch", nameEn: "Midnight English", unlockedText: "Noch schnell ein bisschen Englisch vor dem Schlafen.", unlockedTextEn: "A quick bit of English before bed." },
    early_bird:      { name: "Vokabeln zum Kaffee", nameEn: "Vocab with coffee", unlockedText: "Englisch gelernt, bevor der Tag richtig losging.", unlockedTextEn: "Learned English before the day had properly started." },
    many_again:      { description: "Drücke 20× „Nochmal“.", descriptionEn: "Press „Again“ 20 times." },
  };
  // Aktive Badge-Welt für HelloAbroad: reise-spanische Spielmodi ohne de-en-Feature
  // raus (hostel/quiz/banderas/reallife) und einzelne, im de-en-Track nicht
  // erreichbare Badges (Ruta del día, Pre-Trip, „Große Beträge") gestrichen.
  const DEEN_KEEP_GROUPS = { learning: 1, streak: 1, context: 1, construir: 1, yesto: 1, listening: 1, cuerpo: 1, special: 1 };
  const DEEN_DROP_IDS = { ruta_dia_first: 1, ruta_dia_7: 1, pretrip_done: 1, precios_millon: 1 };
  const DEEN_BADGES = BADGES
    .filter((b) => b.group !== "category" && DEEN_KEEP_GROUPS[b.group] && !DEEN_DROP_IDS[b.id])
    .map((b) => (DEEN_OVERRIDES[b.id] ? Object.assign({}, b, DEEN_OVERRIDES[b.id]) : b))
    .concat(DEEN_CATEGORY_BADGES);
  const DEEN_BY_ID = DEEN_BADGES.reduce((acc, b) => { acc[b.id] = b; return acc; }, {});

  function isLocalsTrack() {
    return !!(window.SC && window.SC.track && window.SC.track.id && window.SC.track.id() === "es-en");
  }
  // HelloAbroad-Track (de-en). Schließt sich mit isLocalsTrack (es-en) gegenseitig aus.
  function isDeEnTrack() {
    return !!(window.SC && window.SC.track && window.SC.track.id && window.SC.track.id() === "de-en");
  }
  function activeBadges() { return isLocalsTrack() ? LOC_BADGES : isDeEnTrack() ? DEEN_BADGES : BADGES; }
  function activeById(id) { return (isLocalsTrack() ? LOC_BY_ID : isDeEnTrack() ? DEEN_BY_ID : BY_ID)[id] || null; }
  function groups() { return isLocalsTrack() ? LOC_GROUPS : isDeEnTrack() ? DEEN_GROUPS : GROUPS; }

  const byId = (id) => activeById(id);

  // Schlanker Reader für die Belohnungs-Inszenierung (celebrate.js): zu einer
  // Badge-Id nur das, was der Fertig-Screen braucht – Icon + Namen (de/en, die
  // Lokalisierung übernimmt der Aufrufer via i18n.natKey). Unbekannte Id -> null.
  function badgeMeta(id) {
    const b = activeById(id);
    if (!b) return null;
    return { id: b.id, icon: b.icon, name: b.name, nameEn: b.nameEn || b.name };
  }

  // Pre-Trip: meiste abgeschlossene Etappen innerhalb EINES Plans. Verträgt beide
  // Formate: neu (verschachtelt { scope: { day: true } }) und alt-flach ({ day: true }).
  function pretripMaxDays(pt) {
    if (!pt || typeof pt !== "object") return 0;
    const vals = Object.values(pt);
    if (!vals.length) return 0;
    if (vals.every((v) => v && typeof v === "object")) {
      return Math.max.apply(null, vals.map((m) => Object.keys(m).length));
    }
    return Object.keys(pt).length; // alt-flaches Format = ein Plan
  }

  // ----- Metriken aus Lernfortschritt + Zählern ableiten (rein) -----
  // cards    : vollständige Kartenliste (eingebaut + eigene)
  // progress : Map cardId -> Lern-Datensatz
  // counters : persistierte Spiel-Zähler (Streak, Tageszeit, "Nochmal", …)
  function buildMetrics(cards, progress, counters) {
    const prog = progress || {};
    const c = counters || {};
    let cardsReviewed = 0, cardsMastered = 0;
    const catTotal = {}, catMastered = {};

    cards.forEach((card) => {
      const r = prog[card.id] || {};
      const seen = r.seen || 0;
      const mastered = isMastered(r);
      catTotal[card.cat] = (catTotal[card.cat] || 0) + 1;
      if (seen > 0) cardsReviewed++;
      if (mastered) { cardsMastered++; catMastered[card.cat] = (catMastered[card.cat] || 0) + 1; }
    });

    const categoryMastery = {};
    Object.keys(catTotal).forEach((cat) => {
      categoryMastery[cat] = catTotal[cat] ? (catMastered[cat] || 0) / catTotal[cat] : 0;
    });

    return {
      cardsReviewed,
      cardsMastered,
      totalCards: cards.length,
      totalReviews: c.reviews || 0,
      dailyStreak: c.dailyStreak || 0,
      longestStreak: c.longestStreak || 0,
      againPresses: c.againPresses || 0,
      nightOwl: !!c.nightOwl,
      earlyBird: !!c.earlyBird,
      // Hostel Mode: Battle-Zähler direkt, Rollenspiele als distinkte Anzahl.
      battlesPlayed: c.battlesPlayed || 0,
      battlesWon: c.battlesWon || 0,
      perfectBattles: c.perfectBattles || 0,
      comebacks: c.comebacks || 0,
      roleplaysCompleted: c.roleplaysSeen ? Object.keys(c.roleplaysSeen).length : 0,
      challengesCompleted: c.challengesDone ? Object.keys(c.challengesDone).length : 0,
      // Definiciones: abgeschlossene und fehlerfreie Quiz-Runden.
      quizzesPlayed: c.quizzesPlayed || 0,
      quizzesPerfect: c.quizzesPerfect || 0,
      // ¿Y esto?: abgeschlossene und „alles gewusst"-Runden (Bild-Vokabel-Modus).
      yestoPlayed: c.yestoPlayed || 0,
      yestoPerfect: c.yestoPerfect || 0,
      // Frases flexibles (Satzbaukasten): abgeschlossene und fehlerfreie Runden
      // sowie distinkt abgeschlossene Themen (für den "Alle Themen"-Badge).
      frasesPlayed: c.frasesPlayed || 0,
      frasesPerfect: c.frasesPerfect || 0,
      frasesThemesCompleted: c.frasesThemesDone ? Object.keys(c.frasesThemesDone).length : 0,
      // Banderas (Flaggen-Quiz): abgeschlossene und fehlerfreie Runden.
      banderasPlayed: c.banderasPlayed || 0,
      banderasPerfect: c.banderasPerfect || 0,
      banderasSetsCompleted: c.banderasSetsDone ? Object.keys(c.banderasSetsDone).length : 0,
      // Hören: im Hör-Modus bewertete Karten + Preis-Hörtrainer-Runden.
      listenReviews: c.listenReviews || 0,
      preciosPlayed: c.preciosPlayed || 0,
      preciosPerfect: c.preciosPerfect || 0,
      preciosMillon: c.preciosMillon || 0,
      // Ruta del día: distinkte Tage mit gestarteter täglicher Mini-Runde.
      rutaDays: c.rutaDays ? Object.keys(c.rutaDays).length : 0,
      pretripDaysDone: pretripMaxDays(c.pretripDays),
      // Reise-Kontext: distinkt geöffnete Kontext-Karten (für die 🧭-Badges).
      contextCardsViewed: c.contextCardsSeen ? Object.keys(c.contextCardsSeen).length : 0,
      // El Cuerpo: distinkt angetippte Körperteile (für die 🧍-Badges).
      bodyPartsExplored: c.bodyPartsSeen ? Object.keys(c.bodyPartsSeen).length : 0,
      categoryMastery,
      categoryTotals: catTotal,
    };
  }

  // Aktueller Wert einer Badge-Metrik (für Fortschrittsanzeige).
  function valueOf(badge, m) {
    switch (badge.type) {
      case "counter":         return m[badge.metric] || 0;
      case "flag":            return m[badge.metric] ? 1 : 0;
      case "categoryMastery": return (m.categoryMastery && m.categoryMastery[badge.category]) || 0;
      case "allReviewed":     return m.cardsReviewed || 0;
      default:                return 0;
    }
  }

  // Zielwert/Schwelle einer Badge-Metrik.
  function targetOf(badge, m) {
    switch (badge.type) {
      case "flag":            return 1;
      case "categoryMastery": return badge.threshold;
      case "allReviewed":     return m.totalCards || 0;
      default:                return badge.threshold;
    }
  }

  // Ist das Badge erreicht?
  function isSatisfied(badge, m) {
    if (badge.type === "categoryMastery") {
      const tot = m.categoryTotals ? m.categoryTotals[badge.category] : 0;
      return !!tot && valueOf(badge, m) >= badge.threshold;
    }
    if (badge.type === "allReviewed") {
      const t = targetOf(badge, m);
      return t > 0 && valueOf(badge, m) >= t;
    }
    return valueOf(badge, m) >= targetOf(badge, m);
  }

  // Fortschritt 0..1 (für den Balken bei noch nicht erreichten Badges).
  function progressOf(badge, m) {
    const t = targetOf(badge, m);
    if (!t) return 0;
    return Math.max(0, Math.min(1, valueOf(badge, m) / t));
  }

  // Ids aller aktuell erfüllten Badges (für die Freischalt-Erkennung).
  function satisfiedIds(m) {
    return activeBadges().filter((b) => isSatisfied(b, m)).map((b) => b.id);
  }

  // Vollständige Auswertung für die UI. unlocked = Map id -> Zeitstempel.
  // Ein Badge gilt als freigeschaltet, sobald es erfüllt ist ODER bereits in der
  // unlocked-Map steht (Freischaltung bleibt erhalten, auch wenn sich Werte ändern).
  function evaluate(m, unlocked) {
    const u = unlocked || {};
    return activeBadges().map((b) => {
      const satisfied = isSatisfied(b, m);
      const value = valueOf(b, m);
      const target = targetOf(b, m);
      return Object.assign({}, b, {
        satisfied,
        unlocked: satisfied || !!u[b.id],
        value,
        target,
        progress: progressOf(b, m),
        unlockedAt: u[b.id] || null,
      });
    });
  }

  window.SC = window.SC || {};
  // Schlanke öffentliche API – die Auswertungs-Helfer (valueOf/targetOf/…) bleiben
  // modul-intern.
  window.SC.badges = {
    GROUPS,
    groups,
    byId,
    badgeMeta,
    buildMetrics,
    evaluate,
    satisfiedIds,
  };
})();
