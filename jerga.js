/*
 * jerga.js  (SC.jerga) – Modul "Jerga colombiana: Slang verstehen & mitreden".
 * REINE DATEN, keine Logik (wie logistica.js / salud.js / knigge.js). Lädt vor
 * app.js und hängt sich an window.SC. Wird von ui.renderJerga gerendert, das
 * dieselbe Sheet-Darstellung wie ui.renderSalud nutzt (gleiches Schema).
 *
 * Idee: Im Hostel, beim Parche und auf der Straße hört man als Erstes nicht das
 * Schulbuch-Spanisch, sondern Slang – „parce", „chévere", „bacano", „una luca".
 * Wer die wichtigsten Wörter kennt, versteht den Smalltalk und kann selbst locker
 * mitreden. Das Modul erklärt erst, WIE man Slang sinnvoll einsetzt (Register,
 * Vorsicht bei derben Wörtern), dann die Wörter nach Situation, plus ein
 * Schnell-Glossar zum Nachschlagen. Schwerpunkt Kolumbien, mit Hinweisen, was
 * anderswo in LatAm anders heißt.
 *
 * Schemas (identisch zu salud.js, damit ui sie 1:1 rendern kann):
 *   INTRO    : string (+ INTRO_EN) – kurze deutsche Einleitung über der Seite.
 *   TOPICS   : [{ icon, title, intro, dos:[…], donts:[…] }] – aufklappbar (+ …En).
 *   PHRASES  : [{ id, icon, title, items:[{ es, de, en }] }] – nach Thema gruppiert.
 *   GLOSSARY : [{ es, de, en }]  – Schnell-Nachschlage-Liste der wichtigsten Wörter.
 * (Kein CHECKLIST – Slang braucht keine Packliste; leere Abschnitte fallen weg.)
 *
 * Hinweis: Slang ist lebendig und regional. Die Übersetzungen geben den Sinn
 * wieder, nicht jede lokale Nuance. Im Zweifel zuhören, wie es vor Ort benutzt wird.
 */
(function () {
  "use strict";

  const INTRO =
    "Im Hostel und auf der Straße hörst du zuerst Slang, nicht Schulbuch-Spanisch. " +
    "Wer „parce“, „chévere“ und „una luca“ versteht, kommt im Smalltalk sofort mit " +
    "und wirkt nahbar. Erst, wie du Slang locker und passend einsetzt, dann die " +
    "wichtigsten Wörter nach Situation – Schwerpunkt Kolumbien, mit Hinweisen, was " +
    "anderswo anders heißt.";

  const INTRO_EN =
    "In the hostel and on the street you'll hear slang first, not textbook Spanish. " +
    "If you get „parce“, „chévere“ and „una luca“, you'll keep up with the small talk " +
    "right away and come across as approachable. First how to use slang naturally and " +
    "appropriately, then the key words by situation – focused on Colombia, with notes " +
    "on what's different elsewhere.";

  // ---------- Erklärung: Slang sinnvoll einsetzen (aufklappbar, Knigge-Stil) ----------
  const TOPICS = [
    {
      icon: "🤙",
      title: "Slang richtig einsetzen",
      titleEn: "Using slang the right way",
      intro: "Slang macht dich nahbar – aber nur, wenn er zur Situation passt. Mit Gleichaltrigen im Hostel ja, beim Beamten oder bei älteren Leuten lieber höflich und neutral.",
      introEn: "Slang makes you approachable – but only when it fits the situation. With peers in the hostel, sure; with an official or older people, better to stay polite and neutral.",
      dos: [
        "Erst zuhören, wie die Locals ein Wort benutzen, dann selbst ausprobieren.",
        "Slang unter jungen Leuten, im Hostel und beim Ausgehen – da gehört er hin.",
        "„Parce“ ist freundlich und alltäglich – gut, um locker ins Gespräch zu kommen.",
        "Ein, zwei Slang-Wörter natürlich einstreuen wirkt besser als ein ganzer Schwall.",
        "Im Zweifel fragen: „¿Qué significa …?“ – Locals erklären gern ihren Slang.",
      ],
      dosEn: [
        "First listen to how locals use a word, then try it yourself.",
        "Slang among young people, in the hostel and when going out – that's where it belongs.",
        "„Parce“ is friendly and everyday – great for breaking the ice casually.",
        "Dropping in one or two slang words naturally works better than a whole barrage.",
        "When unsure, ask: „¿Qué significa …?“ – locals love explaining their slang.",
      ],
      donts: [
        "Slang nicht bei Behörden, Polizei oder in formellen Situationen benutzen.",
        "Derbe oder vulgäre Wörter (z. B. „chimba“, „berraco“) nicht nachplappern, bevor du den Ton sicher triffst.",
        "Nicht jedes Wort 1:1 aus einem anderen Land übernehmen – Slang ist regional.",
        "Slang nicht überdosieren – sonst klingt es aufgesetzt statt locker.",
      ],
      dontsEn: [
        "Don't use slang with officials, police or in formal situations.",
        "Don't parrot crude or vulgar words (e.g. „chimba“, „berraco“) before you're sure of the tone.",
        "Don't carry every word 1:1 from one country to another – slang is regional.",
        "Don't overdo the slang – otherwise it sounds forced rather than relaxed.",
      ],
    },
    {
      icon: "🌎",
      title: "Regional verschieden",
      titleEn: "It varies by region",
      intro: "Dasselbe Gefühl, andere Wörter: Was in Kolumbien „chévere“ ist, heißt anderswo „bacán“, „padre“ oder „copado“. Ein „Kumpel“ ist mal „parce“, mal „pana“, „güey“ oder „weón“.",
      introEn: "Same vibe, different words: what's „chévere“ in Colombia is „bacán“, „padre“ or „copado“ elsewhere. A „mate“ is „parce“ here, „pana“, „güey“ or „weón“ there.",
      dos: [
        "„Cool“: chévere/bacano (CO), bacán (PE/CL), padre/chido (MX), copado (AR).",
        "„Kumpel“: parce (CO), pana (VE/EC), güey (MX), weón (CL), boludo (AR, unter Freunden).",
        "„Geld“: plata (fast überall), lana (MX), guita (AR).",
        "Im neuen Land kurz nachfragen, welches Wort hier üblich ist.",
      ],
      dosEn: [
        "„Cool“: chévere/bacano (CO), bacán (PE/CL), padre/chido (MX), copado (AR).",
        "„Mate“: parce (CO), pana (VE/EC), güey (MX), weón (CL), boludo (AR, among friends).",
        "„Money“: plata (almost everywhere), lana (MX), guita (AR).",
        "In a new country, just ask which word is common there.",
      ],
      donts: [
        "„Weón“ (CL) oder „boludo“ (AR) nicht bei Fremden benutzen – unter Freunden okay, sonst schnell beleidigend.",
        "Kolumbianischen Slang nicht automatisch in Mexiko oder Argentinien erwarten.",
      ],
      dontsEn: [
        "Don't use „weón“ (CL) or „boludo“ (AR) with strangers – fine among friends, otherwise quickly offensive.",
        "Don't expect Colombian slang to work automatically in Mexico or Argentina.",
      ],
    },
  ];

  // ---------- Wichtige Slang-Wörter, nach Situation gruppiert ----------
  const PHRASES = [
    {
      id: "parche",
      icon: "🧑‍🤝‍🧑",
      title: "Leute & Parche",
      titleEn: "People & hanging out",
      items: [
        { es: "parce / parcero", de: "Kumpel, Alter (freundliche Anrede)", en: "mate, buddy (friendly address)" },
        { es: "el parche", de: "die Clique / der Treffpunkt zum Abhängen", en: "the crew / the hangout spot" },
        { es: "parchar", de: "abhängen, chillen", en: "to hang out, chill" },
        { es: "¿Qué más?", de: "Na, wie geht's? (typischer Gruß in CO)", en: "What's up? (typical CO greeting)" },
        { es: "¿Bien o qué?", de: "Alles gut bei dir?", en: "All good with you?" },
        { es: "el man / la vieja", de: "der Typ / die Frau (umgangssprachlich)", en: "the guy / the woman (colloquial)" },
      ],
    },
    {
      id: "bueno",
      icon: "👍",
      title: "Gut, cool & geil",
      titleEn: "Good, cool & great",
      items: [
        { es: "chévere", de: "cool, super, klasse", en: "cool, great, awesome" },
        { es: "bacano / bacán", de: "richtig cool, geil", en: "really cool, awesome" },
        { es: "¡Qué chimba!", de: "Wie geil! (sehr umgangssprachlich, Vorsicht)", en: "How awesome! (very colloquial, careful)" },
        { es: "una nota", de: "klasse, eine Wucht (Sache/Person)", en: "great, a blast (thing/person)" },
        { es: "brutal / una chimba", de: "der Hammer, mega", en: "amazing, killer" },
        { es: "está muy bueno", de: "das ist richtig gut", en: "that's really good" },
      ],
    },
    {
      id: "fiesta",
      icon: "🎉",
      title: "Feiern & ausgehen",
      titleEn: "Partying & going out",
      items: [
        { es: "la rumba", de: "die Party, das Feiern", en: "the party, partying" },
        { es: "rumbear", de: "feiern gehen, abtanzen", en: "to party, go out dancing" },
        { es: "el guaro", de: "Aguardiente (Anis-Schnaps, das Nationalgetränk)", en: "aguardiente (anise liquor, the national drink)" },
        { es: "estar prendido", de: "angeheitert sein", en: "to be tipsy" },
        { es: "el guayabo", de: "der Kater (nach der Party)", en: "the hangover" },
        { es: "¡Vamos de rumba!", de: "Lass uns feiern gehen!", en: "Let's go party!" },
      ],
    },
    {
      id: "plata",
      icon: "💵",
      title: "Geld & Preise",
      titleEn: "Money & prices",
      items: [
        { es: "la plata", de: "das Geld", en: "money" },
        { es: "una luca", de: "1.000 Pesos", en: "1,000 pesos" },
        { es: "cinco lucas", de: "5.000 Pesos", en: "5,000 pesos" },
        { es: "un billete", de: "ein Geldschein / viel Geld", en: "a banknote / a lot of money" },
        { es: "está caro / barato", de: "das ist teuer / billig", en: "that's expensive / cheap" },
        { es: "estoy pelado/a", de: "ich bin blank, pleite", en: "I'm broke" },
      ],
    },
    {
      id: "cuidado",
      icon: "⚠️",
      title: "Vorsicht & Situationen",
      titleEn: "Careful & situations",
      items: [
        { es: "¡Qué pena!", de: "Wie peinlich! / Entschuldige! (sehr häufig in CO)", en: "How embarrassing! / Sorry! (very common in CO)" },
        { es: "dar papaya", de: "sich angreifbar machen, leichtsinnig sein", en: "to make yourself an easy target, be careless" },
        { es: "estar pilas / ponerse pilas", de: "aufpassen / sich ranhalten", en: "to be alert / get a move on" },
        { es: "un parado / una vuelta", de: "eine Sache / ein Plan", en: "a thing / an errand-plan" },
        { es: "paila", de: "Mist, das war's (etwas ist schiefgegangen)", en: "damn, that's it (something went wrong)" },
        { es: "berraco/a", de: "krass / hart im Nehmen (kontextabhängig)", en: "tough / impressive (context-dependent)" },
      ],
    },
  ];

  // ---------- Schnell-Glossar (kompakt zum Nachschlagen) ----------
  const GLOSSARY = [
    { es: "parce", de: "Kumpel", en: "mate" },
    { es: "chévere", de: "cool", en: "cool" },
    { es: "bacano", de: "richtig cool", en: "really cool" },
    { es: "la rumba", de: "die Party", en: "the party" },
    { es: "el guaro", de: "Aguardiente", en: "aguardiente" },
    { es: "la plata", de: "Geld", en: "money" },
    { es: "una luca", de: "1.000 Pesos", en: "1,000 pesos" },
    { es: "¡Qué pena!", de: "Wie peinlich! / Sorry!", en: "How embarrassing! / Sorry!" },
    { es: "dar papaya", de: "sich angreifbar machen", en: "to make yourself a target" },
    { es: "estar pilas", de: "aufpassen", en: "to be alert" },
    { es: "paila", de: "Mist, das war's", en: "damn, that's it" },
    { es: "el man", de: "der Typ", en: "the guy" },
    { es: "estoy pelado", de: "ich bin pleite", en: "I'm broke" },
    { es: "¿Qué más?", de: "Na, wie geht's?", en: "what's up?" },
  ];

  window.SC = window.SC || {};
  window.SC.jerga = { INTRO, INTRO_EN, TOPICS, PHRASES, GLOSSARY };
})();
