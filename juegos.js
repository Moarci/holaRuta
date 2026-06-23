/*
 * juegos.js  (SC.juegos) – Modul "Juegos de viaje: Hostel-Spiele & die Sätze dazu".
 * REINE DATEN, keine Logik (wie salud.js / logistica.js / flirt.js). Lädt vor
 * app.js und hängt sich an window.SC. Wird von ui.renderJuegos gerendert, das
 * dieselbe Info-Modul-Sheet-Darstellung (moduleSheet) wie Salud/Logística/Flirt
 * nutzt – gleiches Schema, kein neuer Renderer.
 *
 * Idee: Spiele sind DER Eisbrecher im Hostel und am Strand. Überall liegt ein
 * UNO-Deck, jemand bringt Monopoly Deal mit, und in den Anden kreist der
 * Würfelbecher (Dudo). Wer mitspielt, lernt Leute kennen – und wer ein paar
 * spanische Sätze für den Tisch kann, spielt mit Locals statt nur mit anderen
 * Backpackern. Recherchiert wurde, was Reisende wirklich spielen: die globalen
 * Klassiker (UNO, Monopoly Deal, Presidente) plus die in Lateinamerika
 * allgegenwärtigen Spiele (Truco in Argentinien/Uruguay, Dudo/Perudo in den
 * Anden, Cuarenta in Ecuador, Generala, Dominó in der Karibik) und die Spiele
 * ganz ohne Material (Yo nunca, Hombre lobo/Mafia).
 *
 * Schemas (identisch zu salud.js/flirt.js, damit ui sie 1:1 rendern kann):
 *   INTRO    : string (+ INTRO_EN) – kurze deutsche Einleitung über der Seite.
 *   TOPICS   : [{ icon, title, intro, dos:[…], donts:[…], tips:[…] }] – aufklappbar
 *              (+ …En); dos = „así se juega“ (Spielablauf), donts = typische
 *              Stolperfallen, tips = recherchierte Strategie-/Profi-Tipps (💡), mit
 *              denen HolaRuta-Nutzer in der Runde einen echten Vorteil haben.
 *              Einige Spiele tragen zusätzlich ein spanisches Lesetraining
 *              (es/vocab/level) – die LatAm-Kultur hinter dem Spiel.
 *   PHRASES  : [{ id, icon, title, items:[{ es, de, en }] }] – Sätze für den Tisch.
 *   GLOSSARY : [{ es, de, en }]  – Schlüsselwörter rund um Karten, Würfel & Tisch.
 *   CHECKLIST: [{ icon, item, why }] – „Spiele-Kit für den Rucksack“ (+ …En).
 *
 * Hinweis: Manche dieser Spiele werden als Trinkspiele gespielt. Das Modul rahmt
 * sie bewusst als soziale Spiele, weist auf Konsens und eine alkoholfreie Option
 * hin und macht keinen Alkohol zur Bedingung.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};

  const INTRO =
    "Spiele sind der schnellste Weg, im Hostel Leute kennenzulernen: Karten, " +
    "Würfel oder ein Gruppenspiel – und schon sitzt man in einer Runde. Hier die " +
    "Spiele, die Reisende wirklich spielen (von UNO bis Truco), kurz erklärt, " +
    "plus die spanischen Sätze für den Tisch, damit du mit Locals mitspielst und " +
    "nicht nur mit anderen Backpackern.";

  const INTRO_EN =
    "Games are the fastest way to meet people in a hostel: cards, dice or a group " +
    "game – and you're in a circle. Here are the games travellers actually play " +
    "(from UNO to Truco), explained briefly, plus the Spanish phrases for the table " +
    "so you play with locals, not just with other backpackers.";

  // ---------- Die Spiele (aufklappbar, Knigge-/Salud-Stil) ----------
  const TOPICS = [
    {
      icon: "🎴",
      title: "UNO – der globale Eisbrecher",
      titleEn: "UNO – the global icebreaker",
      intro: "2–10 Spieler, eine Runde dauert ~10 Minuten, und gefühlt liegt in jedem Hostel ein (zerfleddertes) Deck. Jeder kennt es – perfekt, um schnell eine Runde zusammenzubekommen.",
      introEn: "2–10 players, a round takes ~10 minutes, and just about every hostel has a (battered) deck lying around. Everyone knows it – perfect for getting a round going fast.",
      dos: [
        "Ziel: als Erster alle Karten loswerden.",
        "Reihum eine Karte ablegen, die in Farbe ODER Zahl zur obersten Karte passt.",
        "Aktionskarten: +2 (Ziehen), Reversa (Richtung dreht), Salta (nächster setzt aus), Comodín (Farbe wählen), Comodín +4.",
        "Hast du nur noch eine Karte, laut „¡UNO!“ rufen – sonst 2 Strafkarten.",
        "Keine passende Karte? Eine vom Stapel ziehen.",
      ],
      dosEn: [
        "Goal: be the first to get rid of all your cards.",
        "Take turns playing a card that matches the top card by colour OR number.",
        "Action cards: +2 (draw), Reverse (turns direction), Skip (next player misses a turn), Wild (pick a colour), Wild +4.",
        "Down to one card? Shout „¡UNO!“ out loud – or take 2 penalty cards.",
        "No matching card? Draw one from the pile.",
      ],
      donts: [
        "Hausregeln nicht als „echte“ Regeln annehmen: Stapeln von +2/+4, „Jump-in“ oder 7/0-Tausch sind inoffiziell – vorher klären.",
        "Offiziell darfst du +4 nur spielen, wenn du KEINE farblich passende Karte hast.",
        "Das „¡UNO!“-Rufen nicht vergessen – sonst wird's teuer.",
      ],
      dontsEn: [
        "Don't treat house rules as the „real“ rules: stacking +2/+4, „jump-in“ or 7/0 swaps are unofficial – agree them up front.",
        "Officially you may only play +4 when you have NO card matching the colour.",
        "Don't forget to call „¡UNO!“ – or it gets expensive.",
      ],
      tips: [
        "Heb dir Comodín und +4 bis zum Schluss auf: Ruft ein Gegner „¡UNO!“, wechselst du die Farbe und drückst ihm Strafkarten auf.",
        "Wirf hohe Zahlenkarten zuerst ab – bleibst du auf einer 9 sitzen, kostet sie beim Punktezählen viel mehr als eine 1.",
        "Achte auf die Farbe, die ein Gegner ständig meidet (er zieht oder wechselt) – die hat er wahrscheinlich nicht; spiel sie gezielt.",
        "Hat der Nächste nur noch eine Karte, spiel Salta, Reversa oder +2 – dann kommt er gar nicht zum Ablegen.",
        "Im Duell zu zweit bringen dir Salta und Reversa sofort wieder den Zug – praktisch ein Doppelzug.",
      ],
      tipsEn: [
        "Save your Wild and +4 for the very end: when an opponent calls „¡UNO!“, switch the colour and load them with penalty cards.",
        "Dump high number cards first – getting stuck with a 9 costs far more than a 1 when points are tallied.",
        "Watch the colour an opponent keeps avoiding (they draw or change it) – they probably don't have it; play it on purpose.",
        "If the next player is down to one card, play Skip, Reverse or +2 so they never get to lay it.",
        "Heads-up (two players), Skip and Reverse hand you the turn straight back – effectively a double move.",
      ],
    },
    {
      icon: "🏠",
      title: "Monopoly Deal – Monopoly in 15 Minuten",
      titleEn: "Monopoly Deal – Monopoly in 15 minutes",
      intro: "Die ganze Monopoly-Laune als schnelles Kartenspiel, ohne winzige Häuschen, die im Rucksack verloren gehen. 2–5 Spieler, eine Partie ist in 15–20 Minuten durch.",
      introEn: "All the Monopoly fun as a fast card game, without tiny houses getting lost in your backpack. 2–5 players, a game is over in 15–20 minutes.",
      dos: [
        "Ziel: 3 vollständige Farb-Sets (Eigentums-Sätze) vor dir auslegen.",
        "Pro Zug spielst du bis zu 3 Karten – als Geld, als Eigentum oder als Aktion.",
        "Aktionskarten: Miete kassieren, „Deal Breaker“ (komplettes Set klauen), „¡No, gracias!“ (eine Aktion blocken), Geburtstag (jeder zahlt), Schuldeneintreiber.",
        "Keine Karten mehr auf der Hand? Du ziehst 5 statt 2.",
      ],
      dosEn: [
        "Goal: lay out 3 complete colour sets (property sets) in front of you.",
        "Each turn you play up to 3 cards – as money, as property or as an action.",
        "Action cards: collect rent, „Deal Breaker“ (steal a whole set), „Just Say No“ (block an action), birthday (everyone pays), debt collector.",
        "No cards left in hand? You draw 5 instead of 2.",
      ],
      donts: [
        "Geld auf der Bank zählt NICHT als Eigentums-Set – du brauchst echte Farb-Sätze.",
        "Heb dir ein „¡No, gracias!“ für den großen Klau („Deal Breaker“) auf.",
        "Verheize nicht alle starken Aktionskarten als Geld.",
      ],
      dontsEn: [
        "Money in the bank does NOT count as a property set – you need real colour sets.",
        "Save a „Just Say No“ for the big steal („Deal Breaker“).",
        "Don't burn all your strong action cards as money.",
      ],
      tips: [
        "Spiel „Pass Go“ früh aus – mehr Handkarten heißt mehr Optionen in jedem Zug.",
        "Halt immer ein „¡No, gracias!“ in der Hinterhand, vor allem gegen „Deal Breaker“ – ein geklautes Komplettset entscheidet die Partie.",
        "Leg deinen eigenen „Deal Breaker“ erst, wenn ein Gegner ein vollständiges Set hat – dann schnappst du dir den größten Brocken.",
        "Verteile deinen Wert: Geld auf der Bank ist durch Miete und Schulden angreifbar – behalt lieber schlagkräftige Aktionskarten.",
        "Beende den Zug nie mit mehr als 7 Karten, sonst musst du abwerfen – zahl vorher schwache Aktionskarten als Geld ein.",
        "Zweifarbige Wildcard-Grundstücke flexibel halten und erst dort einsetzen, wo dir genau eine Farbe zum Set fehlt.",
      ],
      tipsEn: [
        "Play „Pass Go“ early – more cards in hand means more options every turn.",
        "Always keep a „Just Say No“ in reserve, especially against „Deal Breaker“ – losing a complete set decides the game.",
        "Hold your own „Deal Breaker“ until an opponent has a full set – then you grab the biggest prize.",
        "Spread your value: money in the bank is exposed to rent and debt – better to keep punchy action cards.",
        "Never end a turn with more than 7 cards or you must discard – bank weak action cards as money first.",
        "Keep two-colour wild properties flexible and play them on the set where you're missing exactly one colour.",
      ],
    },
    {
      icon: "👑",
      title: "El Presidente (Culo / Asshole)",
      titleEn: "President (Asshole / Culo)",
      intro: "Der Backpacker-Klassiker weltweit: ein Rangspiel mit normalem Deck, 4–8 Spieler, schnell und lustig. Wird oft als Trinkspiel gespielt – funktioniert genauso gut ohne.",
      introEn: "The worldwide backpacker classic: a ranking game with a normal deck, 4–8 players, fast and funny. Often played as a drinking game – works just as well without.",
      dos: [
        "Ziel: zuerst alle Karten ablegen.",
        "Reihum legst du eine höhere Karte (oder gleich viele gleiche) auf den Stapel; wer nicht kann/will, passt.",
        "Wer zuerst leer ist, wird „Presidente“, der Letzte „Culo“/„Asshole“.",
        "Nächste Runde: der Culo gibt dem Presidente seine 2 besten Karten, der Presidente zwei beliebige zurück. Sitzordnung nach Rang.",
      ],
      dosEn: [
        "Goal: be the first to play out all your cards.",
        "Take turns placing a higher card (or the same number of equal cards) on the pile; if you can't or won't, you pass.",
        "First one empty becomes „President“, the last is the „Asshole“/„Culo“.",
        "Next round: the Asshole gives the President their 2 best cards, the President gives any 2 back. Seating by rank.",
      ],
      donts: [
        "Kartenwert-Reihenfolge vorher klären (oft ist die 2 die höchste) – sie variiert je Runde/Region.",
        "Sonderregeln ansagen, bevor es losgeht (z. B. 8 löscht den Stapel, Doppel).",
        "Als Trinkspiel: Tempo und Grenzen respektieren, immer eine alkoholfreie Option.",
      ],
      dontsEn: [
        "Agree the card ranking first (the 2 is often highest) – it varies by group/region.",
        "Announce special rules before you start (e.g. an 8 clears the pile, doubles).",
        "As a drinking game: respect pace and limits, always a non-alcoholic option.",
      ],
      tips: [
        "Behalte deine höchsten Karten (oft die 2): Wer den Stapel mit ihnen abräumt, darf neu eröffnen und seine unbequemen Karten loswerden.",
        "Wenn alle passen, beginnst du frei – das ist der Moment, deine einzelnen niedrigen Karten abzustoßen.",
        "Heb Paare und Drillinge auf, um die Einzelkarten-Serien der Gegner zu brechen, statt sie früh zu verheizen.",
        "Merk dir, wer schon viele hohe Karten gespielt hat – danach setzen sich deine mittleren Karten plötzlich durch.",
        "Als Presidente gibst du deine zwei schwächsten Karten ab – nutze den Tausch, um gezielt ein Paar zu vervollständigen.",
      ],
      tipsEn: [
        "Hold your highest cards (often the 2): clearing the pile with them lets you reopen and unload your awkward cards.",
        "When everyone passes you lead freely – that's the moment to shed your stray low cards.",
        "Keep pairs and triples to break opponents' singles runs instead of burning them early.",
        "Track who has already spent their high cards – after that, your mid cards suddenly get through.",
        "As President you hand over your two weakest cards – use the swap to complete a pair on purpose.",
      ],
    },
    {
      icon: "🃏",
      title: "Truco (Argentinien · Uruguay)",
      titleEn: "Truco (Argentina · Uruguay)",
      intro: "Das Kartenspiel des Südens, mit der baraja española (40 Karten). 2, 4 oder 6 Spieler in Teams. Es lebt vom Bluffen, vom Wetten („¡Truco!“ – „¡Quiero!“) und von heimlichen Zeichen (señas) zum Partner.",
      introEn: "The card game of the south, with the baraja española (40 cards). 2, 4 or 6 players in teams. It thrives on bluffing, betting („¡Truco!“ – „¡Quiero!“) and secret signs (señas) to your partner.",
      dos: [
        "Spanisches 40-Karten-Blatt: 1–7 plus Sota, Caballo und Rey (eine 8 und 9 gibt es darin gar nicht). Die Kartenrangfolge ist eigen (1 de espada ist die höchste).",
        "Jeder bekommt 3 Karten; es gewinnt, wer 2 der 3 Stiche („manos“) holt.",
        "Punkte erhöhen: „Truco“ sagen → Gegner antwortet „Quiero“ (angenommen) oder „No quiero“ (aufgegeben).",
        "„Envido“ zählt die Punkte auf der Hand am Rundenanfang. Gespielt wird bis 30 (oder 15) Punkte.",
      ],
      dosEn: [
        "A 40-card Spanish deck: 1–7 plus Sota, Caballo and Rey (there is no 8 or 9 in it at all). The card ranking is its own thing (the 1 of swords is the highest).",
        "Each player gets 3 cards; you win by taking 2 of the 3 tricks („manos“).",
        "Raising the stakes: say „Truco“ → opponent answers „Quiero“ (accepted) or „No quiero“ (folded).",
        "„Envido“ counts the points in your hand at the start of the round. You play to 30 (or 15) points.",
      ],
      donts: [
        "Señas (Zeichen zum Partner) gehören dazu – aber nur fair, wenn der Gegner die Spielart kennt; vorher ansagen.",
        "Nicht ohne die (unintuitive) Kartenrangordnung starten – ein Spickzettel hilft enorm.",
        "Regionale Varianten klären (con flor / sin flor), sonst zählt jeder anders.",
      ],
      dontsEn: [
        "Señas (signs to your partner) are part of it – but only fair if the opponent knows the style; agree it first.",
        "Don't start without the (unintuitive) card ranking – a cheat sheet helps a lot.",
        "Clarify regional variants (con flor / sin flor), or everyone scores differently.",
      ],
      tips: [
        "Lern die vier „matas“ auswendig: 1 de espada, 1 de basto, 7 de espada, 7 de oro – sie schlagen alles andere und gewinnen dir die wichtigen Stiche.",
        "Truco lebt vom Bluff: Sag ab und zu „¡Truco!“ mit schwacher Hand – gibt der Gegner auf, gewinnst du ohne gute Karten.",
        "Envido blitzschnell rechnen: zwei Karten gleicher Farbe = 20 + ihre Augen (Sota/Caballo/Rey zählen 0) – so weißt du sofort, ob du ansagst.",
        "Spiel deine stärkste Karte oft erst in der zweiten Hand: Gewinnst du die erste knapp, kontrollierst du den Rest der Runde.",
        "Der größte Vorteil sind feste señas mit dem Partner (z. B. Augenbrauen hoch = as de espada) – vorher absprechen und unauffällig geben.",
      ],
      tipsEn: [
        "Memorise the four „matas“: 1 of swords, 1 of clubs, 7 of swords, 7 of coins – they beat everything else and win you the key tricks.",
        "Truco thrives on bluffing: occasionally call „¡Truco!“ on a weak hand – if the opponent folds, you win with nothing.",
        "Count envido instantly: two cards of the same suit = 20 + their pips (Sota/Caballo/Rey count 0) – so you know at once whether to call.",
        "Often save your strongest card for the second hand: win the first narrowly and you control the rest of the round.",
        "Your biggest edge is fixed señas with your partner (e.g. raised eyebrows = ace of swords) – agree them first and signal subtly.",
      ],
      level: "B1",
      es: [
        "El *truco* es mucho más que un juego de *cartas* en Argentina y Uruguay: es una excusa para sentarse en *ronda*, *mentir* con cara seria y cantar los puntos en voz alta.",
        "Lo que lo hace único son las *señas*: con un gesto de cejas o de boca le avisás a tu *compañero* qué cartas tenés, sin que el rival se dé cuenta.",
      ],
      vocab: [
        { es: "truco", de: "Truco (Kartenspiel)", en: "Truco (card game)", take: false },
        { es: "cartas", de: "Karten", en: "cards", take: true },
        { es: "ronda", de: "Runde/Kreis", en: "round/circle", take: true },
        { es: "mentir", de: "lügen", en: "to lie", take: true },
        { es: "señas", de: "Zeichen, Signale", en: "signs, signals", take: true },
        { es: "compañero", de: "Partner, Mitspieler", en: "partner, teammate", take: true },
      ],
    },
    {
      icon: "🎲",
      title: "Dudo / Perudo / Cacho (die Anden)",
      titleEn: "Dudo / Perudo / Cacho (the Andes)",
      intro: "Das Lügen-Würfelspiel der Anden – in Peru, Bolivien und Chile fast überall. Jeder hat 5 Würfel und einen Becher (cubilete); es geht ums Bluffen und ums „¡Dudo!“ (ich zweifle).",
      introEn: "The lying dice game of the Andes – nearly everywhere in Peru, Bolivia and Chile. Everyone has 5 dice and a cup (cubilete); it's about bluffing and calling „¡Dudo!“ (I doubt it).",
      dos: [
        "Alle würfeln verdeckt unter dem Becher und schauen heimlich.",
        "Reihum erhöht man das Gebot: „cuatro cincos“ = mindestens 4 der Würfel (aller Spieler) zeigen die 5.",
        "Die 1 (as) ist Joker und zählt für jede Zahl.",
        "Zweifelst du das Gebot an, rufst du „¡Dudo!“ – dann wird aufgedeckt: lag der Bieter zu hoch, verliert er einen Würfel, sonst du.",
        "Wer alle Würfel verliert, scheidet aus; der Letzte mit Würfeln gewinnt.",
      ],
      dosEn: [
        "Everyone rolls hidden under the cup and peeks secretly.",
        "Take turns raising the bid: „cuatro cincos“ = at least 4 of the dice (across all players) show a 5.",
        "The 1 (as) is wild and counts as any number.",
        "Doubt the bid? Shout „¡Dudo!“ – then reveal: if the bidder was too high, they lose a die, otherwise you do.",
        "Lose all your dice and you're out; the last player with dice wins.",
      ],
      donts: [
        "Becher nicht zu früh heben – der Bluff ist der ganze Spaß.",
        "Die Joker-Regel und den „as“-Übergang vorher klären (was passiert, wenn Einsen geboten werden).",
        "„Calzo“ (Gebot ist exakt richtig) nur nutzen, wenn ihr diese Zusatzregel spielt.",
      ],
      dontsEn: [
        "Don't lift the cup too early – the bluff is the whole point.",
        "Agree the wild rule and the „as“ switch up front (what happens once ones are bid).",
        "Use „Calzo“ (the bid is exactly right) only if you play that extra rule.",
      ],
      tips: [
        "Faustregel: Bei N Würfeln im Spiel zeigt im Schnitt rund N/3 eine bestimmte Zahl (Einsen als Joker mitgezählt). Gebote weit darüber kannst du getrost anzweifeln.",
        "Nimm deine eigenen Würfel als Anker: Hast du selbst drei Fünfen, ist „cuatro cincos“ fast sicher – erhöh ruhig.",
        "Zähl mit, wie viele Würfel noch im Spiel sind – je weniger, desto riskanter wird jedes hohe Gebot.",
        "Bluff früh nur in kleinen Schritten; heb die großen Sprünge auf, wenn die Gegner unter Druck stehen.",
        "Spielt ihr mit „calzo“: ansagen, wenn du das Gebot für exakt richtig hältst – triffst du, gewinnst du sogar einen Würfel zurück.",
      ],
      tipsEn: [
        "Rule of thumb: with N dice in play, on average about N/3 show a given number (counting aces as wild). Bids well above that are safe to doubt.",
        "Anchor on your own dice: if you already hold three fives, „cuatro cincos“ is nearly certain – raise away.",
        "Keep count of how many dice are still in play – the fewer there are, the riskier every high bid becomes.",
        "Bluff in small steps early; save the big jumps for when opponents are under pressure.",
        "If you play „calzo“: call it when you think the bid is exactly right – land it and you even win a die back.",
      ],
      level: "A2",
      es: [
        "En los Andes —Perú, Bolivia y Chile— el *dudo* se juega con cinco *dados* y un *cubilete* en casi cualquier *bar*.",
        "Cada jugador *miente* sobre cuántos dados muestran un número, hasta que alguien grita «¡dudo!» y se levantan los cubiletes.",
      ],
      vocab: [
        { es: "dudo", de: "„ich zweifle“ (Würfelspiel)", en: "„I doubt“ (dice game)", take: false },
        { es: "dados", de: "Würfel", en: "dice", take: true },
        { es: "cubilete", de: "Würfelbecher", en: "dice cup", take: true },
        { es: "bar", de: "Bar, Kneipe", en: "bar", take: false },
        { es: "miente", de: "(er/sie) lügt", en: "lies", take: true },
      ],
    },
    {
      icon: "🇪🇨",
      title: "Cuarenta (Ecuador)",
      titleEn: "Cuarenta (Ecuador)",
      intro: "Ecuadors Nationalkartenspiel – „die Vierzig“. 2 oder 4 Spieler (in Teams), mit spanischem Blatt ohne 8, 9 und 10. Ziel: als Erster 40 Punkte zu erreichen.",
      introEn: "Ecuador's national card game – „the forty“. 2 or 4 players (in teams), Spanish deck without 8, 9 and 10. Goal: be the first to 40 points.",
      dos: [
        "Karten vom Tisch „fangen“: eine gleiche Zahl auf der Hand fängt die offene Karte (caer).",
        "Aufeinanderfolgende Reihen einsammeln und Karten so abräumen.",
        "Den ganzen Tisch leerfegen heißt „limpia“ und bringt Bonuspunkte; das Fangen der zuletzt gelegten Karte ist „caída“.",
        "Am Ende jeder Runde Punkte zählen, bis ein Team 40 hat.",
      ],
      dosEn: [
        "„Catch“ cards from the table: a matching number in your hand catches the face-up card (caer).",
        "Pick up consecutive runs and clear cards that way.",
        "Sweeping the whole table is a „limpia“ and scores bonus points; catching the last card played is a „caída“.",
        "Count points at the end of each round, until a team reaches 40.",
      ],
      donts: [
        "Nicht mit 8, 9 und 10 spielen – die sind im Cuarenta-Blatt raus.",
        "Fang- und Reihen-Regel mit der Runde abstimmen, sie überrascht Neulinge.",
        "Punkte laufend mitschreiben, sonst gibt es Streit beim Zählen.",
      ],
      dontsEn: [
        "Don't play with 8, 9 and 10 – they're out of the Cuarenta deck.",
        "Agree the catching and run rules with the group; they surprise newcomers.",
        "Keep score as you go, or counting ends in arguments.",
      ],
      tips: [
        "Merk dir, welche Karten schon gefangen wurden – wer mitzählt, weiß genau, welche „caídas“ noch möglich sind.",
        "Halt eine Karte zurück, die exakt die zuletzt gelegte fängt („caída“) – das bringt am Rundenende sichere Extrapunkte.",
        "Achte auf Reihen (escaleras) auf dem Tisch: Eine passende Karte räumt mehrere auf einmal ab („limpia“) und gibt Bonus.",
        "Im Team keine Karte legen, mit der der Gegner sofort eine „caída“ machen kann – sonst schenkst du ihm Punkte.",
      ],
      tipsEn: [
        "Remember which cards have already been caught – tracking it tells you exactly which „caídas“ are still possible.",
        "Hold back a card that catches the very last one played („caída“) – that's guaranteed bonus points at round's end.",
        "Watch for runs (escaleras) on the table: a matching card sweeps several at once („limpia“) for a bonus.",
        "In a team, don't lay a card that lets the opponent make an instant „caída“ – you'd be handing them points.",
      ],
    },
    {
      icon: "🎲",
      title: "Generala – Südamerikas Yahtzee",
      titleEn: "Generala – South America's Yahtzee",
      intro: "Das Würfelspiel für Strand, Pool und nach dem Abendessen. 2+ Spieler, 5 Würfel, bis zu 3 Würfe pro Zug – nur Zettel und Stift dazu.",
      introEn: "The dice game for the beach, the pool and after dinner. 2+ players, 5 dice, up to 3 rolls per turn – just pen and paper to go with it.",
      dos: [
        "Kombinationen sammeln: 1er bis 6er, Escalera (Straße), Full, Póker (4 gleiche), Generala (5 gleiche).",
        "Bis zu 3 Würfe pro Zug; zwischendurch beliebige Würfel liegen lassen.",
        "Jede Kategorie nur einmal eintragen – clever wählen, wenn nichts passt.",
        "Eine „Generala servida“ (5 gleiche im ersten Wurf) gewinnt oft sofort die Partie.",
      ],
      dosEn: [
        "Collect combinations: 1s to 6s, Escalera (straight), Full house, Póker (4 of a kind), Generala (5 of a kind).",
        "Up to 3 rolls per turn; keep any dice you like in between.",
        "Each category is filled in only once – choose cleverly when nothing fits.",
        "A „Generala servida“ (5 of a kind on the first roll) often wins the game outright.",
      ],
      donts: [
        "„Servida“ (in einem Wurf) vs. „gebaut“ (über mehrere Würfe) klären – meist gibt es dafür Bonuspunkte.",
        "Keine Kategorie doppelt nutzen.",
        "Ohne Zettel verliert man den Überblick – immer mitschreiben.",
      ],
      dontsEn: [
        "Clarify „servida“ (in one roll) vs. „built“ (over several rolls) – there are usually bonus points for it.",
        "Don't use a category twice.",
        "Without a scoresheet you lose track – always write it down.",
      ],
      tips: [
        "Geh in den ersten Würfen auf die großen Kombinationen (Generala, Póker, Full) – sie bringen die meisten Punkte.",
        "Misslingt der Wurf, „opfere“ ihn in eine kleine Kategorie (deine 1er) statt eine wertvolle zu verschenken.",
        "Behalte immer die Würfel, die zur höchsten noch offenen Kategorie passen, und würfle den Rest neu.",
        "Hast du schon drei oder vier Gleiche im ersten Wurf, riskier den Rest auf eine „Generala servida“ – die gewinnt oft sofort die Partie.",
      ],
      tipsEn: [
        "On your first rolls, aim for the big combinations (Generala, Póker, Full) – they score the most.",
        "If a turn flops, „sacrifice“ it into a low category (your 1s) instead of wasting a valuable one.",
        "Always keep the dice that fit your highest still-open category and re-roll the rest.",
        "With three or four of a kind already on the first roll, gamble the rest on a „Generala servida“ – it often wins outright.",
      ],
    },
    {
      icon: "🎲",
      title: "Dominó (die Karibik)",
      titleEn: "Dominoes (the Caribbean)",
      intro: "Das Spiel der Karibik – in Kuba, der Dominikanischen Republik und Puerto Rico auf jeder Straßenecke. Meist 4 Spieler in 2 Teams, laut, schnell und mit viel Leidenschaft.",
      introEn: "The game of the Caribbean – on every street corner in Cuba, the Dominican Republic and Puerto Rico. Usually 4 players in 2 teams, loud, fast and full of passion.",
      dos: [
        "Jeder zieht Steine (fichas); wer den höchsten Doppelstein hat, beginnt.",
        "Reihum eine passende Zahl anlegen; wer nicht anlegen kann, passt („paso“).",
        "Wer zuerst alle Steine los ist, gewinnt – oder bei blockiertem Spiel, wer die wenigsten Augen hält.",
        "Die Augen der Gegner werden zusammengezählt; meist spielt man bis 100 oder 200 Punkte.",
      ],
      dosEn: [
        "Everyone draws tiles (fichas); whoever has the highest double starts.",
        "Take turns matching a number; if you can't play, you pass („paso“).",
        "First to get rid of all tiles wins – or, if the game is blocked, whoever holds the fewest pips.",
        "The opponents' pips are added up; you usually play to 100 or 200 points.",
      ],
      donts: [
        "Steine niemandem zeigen – im Team zählt verdeckte Information.",
        "Doble-Seis vs. Doble-Nueve (Set-Größe) vorher klären.",
        "Lautstärke gehört dazu – aber nicht im stillen Schlafsaal mitten in der Nacht.",
      ],
      dontsEn: [
        "Don't show your tiles to anyone – in a team, hidden information matters.",
        "Agree double-six vs. double-nine (set size) up front.",
        "The noise is part of it – but not in a quiet dorm in the middle of the night.",
      ],
      tips: [
        "Merk dir, bei welcher Zahl jemand passt („paso“) – die Zahl hat er nicht; spiel sie gezielt, um ihn auszubremsen.",
        "Spiel die Zahl, von der du die meisten Steine hast – so kontrollierst du, an welchen Enden es weitergeht.",
        "Im Team nie den Partner blockieren: Lass das Ende offen, das er bedienen kann.",
        "Heb deinen Doppelstein für den richtigen Moment auf, um das Tempo zu bestimmen statt darauf sitzenzubleiben.",
        "Zähl die Augen mit – bei blockiertem Spiel gewinnt, wer am wenigsten auf der Hand hält.",
      ],
      tipsEn: [
        "Note which number a player passes on („paso“) – they don't have it; play it deliberately to stall them.",
        "Lead the number you hold the most of – that way you control which ends stay open.",
        "In a team, never block your partner: leave open the end they can serve.",
        "Save your double for the right moment to dictate the tempo, rather than getting stuck with it.",
        "Keep a running pip count – if the game blocks, whoever holds the fewest pips wins.",
      ],
      level: "A2",
      es: [
        "En el *Caribe* —Cuba, Puerto Rico y República Dominicana— el *dominó* se juega en la calle, sobre una *mesa* y con mucho *ruido*.",
        "Cuatro jugadores en dos *equipos* colocan las *fichas* por turnos; el primero que se queda sin fichas gana la *partida*.",
      ],
      vocab: [
        { es: "Caribe", de: "Karibik", en: "Caribbean", take: false },
        { es: "dominó", de: "Domino", en: "dominoes", take: false },
        { es: "mesa", de: "Tisch", en: "table", take: true },
        { es: "ruido", de: "Lärm", en: "noise", take: true },
        { es: "equipos", de: "Mannschaften, Teams", en: "teams", take: true },
        { es: "fichas", de: "Spielsteine", en: "tiles, pieces", take: true },
        { es: "partida", de: "Partie", en: "game, match", take: true },
      ],
    },
    {
      icon: "🙊",
      title: "Yo nunca · Verdad o reto",
      titleEn: "Never have I ever · Truth or dare",
      intro: "Die Eisbrecher ganz ohne Material. „Yo nunca“ (Never have I ever) und „Verdad o reto“ (Wahrheit oder Pflicht) bringen eine frische Hostel-Runde in Minuten zum Reden und Lachen.",
      introEn: "The icebreakers with no equipment at all. „Yo nunca“ (Never have I ever) and „Verdad o reto“ (Truth or dare) get a fresh hostel circle talking and laughing in minutes.",
      dos: [
        "Yo nunca: reihum sagt jemand „Yo nunca he…“ + etwas; wer es getan hat, zeigt einen Finger (oder trinkt einen Schluck).",
        "Verdad o reto: Wahrheit beantworten oder eine harmlose Aufgabe erfüllen.",
        "Auf Spanisch spielen – so übst du echte Sätze und lernst gleichzeitig Leute kennen.",
        "Leichte, lustige Fragen wählen, damit alle mitmachen können.",
      ],
      dosEn: [
        "Never have I ever: take turns saying „Yo nunca he…“ + something; whoever has done it puts a finger down (or takes a sip).",
        "Truth or dare: answer a truth or do a harmless dare.",
        "Play in Spanish – you practise real sentences and meet people at the same time.",
        "Pick light, funny prompts so everyone can join in.",
      ],
      donts: [
        "Grenzen respektieren – niemanden bloßstellen oder unter Druck setzen.",
        "Konsens vor jeder „reto“ (Aufgabe); ein „Nein“ wird akzeptiert.",
        "Beim Trinken: immer eine alkoholfreie Option, kein Zwang.",
      ],
      dontsEn: [
        "Respect boundaries – don't expose or pressure anyone.",
        "Consent before every „dare“; a „no“ is accepted.",
        "If drinking: always a non-alcoholic option, never forced.",
      ],
      tips: [
        "Leg dir vorab 3–4 lockere „Yo nunca he…“-Sätze auf Spanisch zurecht – wer flüssig dran ist, gibt der Runde den Ton an.",
        "Reise-Themen ziehen immer („Yo nunca he dormido en un aeropuerto“) – sie bringen Geschichten und neue Bekanntschaften.",
        "Bei „verdad o reto“ machbare Mini-Aufgaben vorschlagen – so bleibt die Runde locker und alle machen mit.",
        "Hör genau zu: Die Antworten sind die besten Gesprächsaufhänger für danach – dein eigentlicher Vorteil im Hostel.",
      ],
      tipsEn: [
        "Prepare 3–4 light „Yo nunca he…“ lines in Spanish in advance – being fluent on your turn sets the tone for the circle.",
        "Travel prompts always land („Yo nunca he dormido en un aeropuerto“) – they spark stories and new friendships.",
        "For „truth or dare“, suggest doable mini-dares – it keeps the circle relaxed and everyone joining in.",
        "Listen closely: the answers are your best conversation openers afterwards – the real edge in a hostel.",
      ],
    },
    {
      icon: "🐺",
      title: "Hombre lobo / Mafia",
      titleEn: "Werewolf / Mafia",
      intro: "Das große Gruppenspiel für laue Hostel-Abende: 8–18 Spieler, Werwölfe gegen das Dorf, und ein Spielleiter (moderador), der durch Nacht und Tag führt. Braucht nur ein paar Kärtchen oder eine App.",
      introEn: "The big group game for warm hostel evenings: 8–18 players, werewolves against the village, and a moderator who guides through night and day. Needs only a few cards or an app.",
      dos: [
        "Rollen verdeckt verteilen: Werwölfe, Dorfbewohner und Sonderrollen (Seherin, Arzt).",
        "„Nachts“ wählen die Wölfe heimlich ein Opfer; „tags“ diskutiert das Dorf und lyncht einen Verdächtigen.",
        "Ziel: die jeweils andere Seite vollständig ausschalten.",
        "Der moderador erzählt die Geschichte und hält den Ablauf zusammen.",
      ],
      dosEn: [
        "Hand out roles face down: werewolves, villagers and special roles (seer, doctor).",
        "At „night“ the wolves secretly pick a victim; by „day“ the village debates and lynches a suspect.",
        "Goal: completely eliminate the other side.",
        "The moderator narrates the story and keeps the flow together.",
      ],
      donts: [
        "Der Spielleiter spielt nicht mit – er bleibt neutral.",
        "Tote reden nicht mehr und verraten ihre Rolle nicht.",
        "Die Diskussion ist der Kern – nicht zu schnell abstimmen, sonst ist es vorbei, bevor es spannend wird.",
      ],
      dontsEn: [
        "The moderator doesn't play – they stay neutral.",
        "The dead don't talk and don't reveal their role.",
        "The debate is the heart of it – don't vote too quickly, or it's over before it gets exciting.",
      ],
      tips: [
        "Als Werwolf: bleib ruhig, rede aktiv mit und beschuldige selbstbewusst einen Unschuldigen – Wölfe, die sich verstecken, fallen am ehesten auf.",
        "Als Dorf: achte auf Abstimmungsmuster – wer immer mit der Mehrheit geht oder auffällig schweigt, ist verdächtig.",
        "Als Seherin: gib dein Wissen dosiert preis – outest du dich zu früh, bist du das erste Opfer der nächsten Nacht.",
        "Lies Körpersprache und Redetempo statt nur die Worte – beim Hombre lobo gewinnt, wer Menschen liest.",
      ],
      tipsEn: [
        "As a werewolf: stay calm, talk actively and confidently accuse an innocent – wolves who hide get spotted first.",
        "As the village: watch the voting patterns – anyone who always follows the majority or stays oddly quiet is suspect.",
        "As the seer: reveal your knowledge in small doses – out yourself too early and you're the next night's first victim.",
        "Read body language and speech pace, not just words – in Werewolf, whoever reads people best wins.",
      ],
    },
  ];

  // ---------- Wichtige Sätze für den Tisch (nach Thema gruppiert) ----------
  const PHRASES = [
    {
      id: "proponer",
      icon: "🤝",
      title: "Mitspielen & vorschlagen",
      titleEn: "Joining in & suggesting a game",
      items: [
        { es: "¿Jugamos a las cartas?", de: "Spielen wir Karten?", en: "Shall we play cards?" },
        { es: "¿Puedo jugar con ustedes?", de: "Kann ich mitspielen?", en: "Can I join you?" },
        { es: "¿Cuántos jugamos?", de: "Zu wievielt spielen wir?", en: "How many are we playing?" },
        { es: "¿Me explicas las reglas?", de: "Erklärst du mir die Regeln?", en: "Can you explain the rules?" },
        { es: "¿De qué va el juego?", de: "Worum geht es im Spiel?", en: "What's the game about?" },
        { es: "Soy nuevo en esto, ten paciencia.", de: "Ich bin neu darin, hab Geduld.", en: "I'm new to this, bear with me." },
      ],
    },
    {
      id: "mesa",
      icon: "🔄",
      title: "Am Tisch & Spielablauf",
      titleEn: "At the table & taking turns",
      items: [
        { es: "Te toca.", de: "Du bist dran.", en: "It's your turn." },
        { es: "Me toca a mí.", de: "Ich bin dran.", en: "It's my turn." },
        { es: "Reparte tú.", de: "Du gibst (die Karten).", en: "You deal." },
        { es: "Baraja las cartas.", de: "Misch die Karten.", en: "Shuffle the cards." },
        { es: "Roba una carta.", de: "Zieh eine Karte.", en: "Draw a card." },
        { es: "Paso / Me paso.", de: "Ich passe.", en: "I pass." },
        { es: "¿Cuántas cartas repartimos?", de: "Wie viele Karten geben wir?", en: "How many cards do we deal?" },
      ],
    },
    {
      id: "ganar",
      icon: "🏆",
      title: "Gewinnen, verlieren, fair play",
      titleEn: "Winning, losing, fair play",
      items: [
        { es: "¡Gané!", de: "Ich habe gewonnen!", en: "I won!" },
        { es: "Ganaste, bien jugado.", de: "Du hast gewonnen, gut gespielt.", en: "You won, well played." },
        { es: "Es un empate.", de: "Es steht unentschieden.", en: "It's a tie." },
        { es: "¿Quién va ganando?", de: "Wer führt gerade?", en: "Who's winning?" },
        { es: "¿Otra ronda?", de: "Noch eine Runde?", en: "Another round?" },
        { es: "¡Buena partida!", de: "Gutes Spiel!", en: "Good game!" },
      ],
    },
    {
      id: "dados",
      icon: "🎲",
      title: "Würfeln & wetten (Dudo, Generala)",
      titleEn: "Dice & bidding (Dudo, Generala)",
      items: [
        { es: "Te toca tirar.", de: "Du bist mit Würfeln dran.", en: "It's your roll." },
        { es: "¡Dudo!", de: "Ich zweifle! (Dudo)", en: "I doubt it!" },
        { es: "Subo la apuesta.", de: "Ich erhöhe das Gebot.", en: "I raise the bid." },
        { es: "Cuatro cincos.", de: "Vier Fünfen.", en: "Four fives." },
        { es: "¿Lo anoto o lo guardo?", de: "Eintragen oder behalten?", en: "Do I score it or keep it?" },
        { es: "Me quedo con estos dados.", de: "Ich behalte diese Würfel.", en: "I'm keeping these dice." },
      ],
    },
    {
      id: "ambiente",
      icon: "🍻",
      title: "Stimmung & Eisbrecher (mit Respekt)",
      titleEn: "Vibe & icebreakers (with respect)",
      items: [
        { es: "¿Jugamos algo para romper el hielo?", de: "Spielen wir was zum Auflockern?", en: "Shall we play an icebreaker?" },
        { es: "Yo no bebo, ¿jugamos sin alcohol?", de: "Ich trinke nicht – ohne Alkohol?", en: "I don't drink – can we play without alcohol?" },
        { es: "El que pierde, reparte.", de: "Wer verliert, gibt die Karten.", en: "Whoever loses deals." },
        { es: "Sin presión, solo por diversión.", de: "Ohne Druck, nur zum Spaß.", en: "No pressure, just for fun." },
        { es: "Yo nunca he viajado solo.", de: "Ich bin noch nie allein gereist.", en: "Never have I ever travelled alone." },
        { es: "¿Verdad o reto?", de: "Wahrheit oder Pflicht?", en: "Truth or dare?" },
      ],
    },
  ];

  // ---------- Glossar: Wörter rund um Karten, Würfel & Tisch ----------
  const GLOSSARY = [
    { es: "la baraja", de: "das Kartenspiel (Deck)", en: "the deck of cards" },
    { es: "la carta", de: "die (Spiel-)Karte", en: "the (playing) card" },
    { es: "el mazo", de: "der Stapel, der Talon", en: "the pile, the stock" },
    { es: "repartir", de: "austeilen, geben", en: "to deal" },
    { es: "barajar", de: "mischen", en: "to shuffle" },
    { es: "el turno", de: "der Zug, die Reihe", en: "the turn" },
    { es: "la ronda", de: "die Runde", en: "the round" },
    { es: "la partida", de: "die Partie", en: "the game, the match" },
    { es: "el comodín", de: "der Joker, die Wildcard", en: "the wildcard, the joker" },
    { es: "robar", de: "ziehen (eine Karte)", en: "to draw (a card)" },
    { es: "descartar", de: "abwerfen", en: "to discard" },
    { es: "la mano", de: "das Blatt (Handkarten)", en: "the hand" },
    { es: "el triunfo", de: "der Trumpf", en: "the trump" },
    { es: "los dados", de: "die Würfel", en: "the dice" },
    { es: "el cubilete", de: "der Würfelbecher", en: "the dice cup" },
    { es: "la ficha", de: "der Spielstein, der Chip", en: "the tile, the chip" },
    { es: "el tablero", de: "das Spielbrett", en: "the board" },
    { es: "apostar", de: "wetten, setzen", en: "to bet" },
    { es: "hacer trampa", de: "mogeln, schummeln", en: "to cheat" },
    { es: "el empate", de: "das Unentschieden", en: "the tie, the draw" },
  ];

  // ---------- „Spiele-Kit für den Rucksack“ ----------
  const CHECKLIST = [
    {
      icon: "🎴",
      item: "UNO-Deck",
      itemEn: "UNO deck",
      why: "Der universelle Eisbrecher – jeder kennt es, winzig und leicht.",
      whyEn: "The universal icebreaker – everyone knows it, tiny and light.",
    },
    {
      icon: "🃏",
      item: "Normales/spanisches Kartendeck (baraja)",
      itemEn: "A normal/Spanish deck of cards (baraja)",
      why: "Für Presidente, Truco, Cuarenta & Dutzende Spiele – das vielseitigste Teil im Rucksack.",
      whyEn: "For Presidente, Truco, Cuarenta & dozens of games – the most versatile thing in your pack.",
    },
    {
      icon: "🏠",
      item: "Monopoly Deal",
      itemEn: "Monopoly Deal",
      why: "Volle Monopoly-Laune in 15 Minuten, ganz ohne lose Teile.",
      whyEn: "Full Monopoly fun in 15 minutes, with no loose pieces.",
    },
    {
      icon: "🎲",
      item: "5 Würfel + kleiner Becher",
      itemEn: "5 dice + a small cup",
      why: "Für Dudo/Perudo und Generala – winzig im Gepäck, riesiger Spaßfaktor.",
      whyEn: "For Dudo/Perudo and Generala – tiny in your bag, huge fun.",
    },
    {
      icon: "🎲",
      item: "Mini-Dominó-Set",
      itemEn: "Travel domino set",
      why: "Türöffner in der Karibik, wo Dominó Kult ist.",
      whyEn: "A door-opener in the Caribbean, where dominoes are a cult.",
    },
    {
      icon: "📝",
      item: "Stift & kleiner Block",
      itemEn: "Pen & a small notepad",
      why: "Punkte für Generala/Truco zählen – und neue Spielregeln notieren.",
      whyEn: "To keep score for Generala/Truco – and jot down new rules.",
    },
    {
      icon: "📱",
      item: "Offline-Spiele-App",
      itemEn: "An offline games app",
      why: "Werwolf-Moderator, Kartenregeln & Solo-Spiele, auch ohne Netz.",
      whyEn: "Werewolf moderator, card rules & solo games, even with no signal.",
    },
  ];

  window.SC.juegos = { INTRO, INTRO_EN, TOPICS, PHRASES, GLOSSARY, CHECKLIST };
})();
