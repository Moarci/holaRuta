/*
 * derechos.js  (SC.derechos) – Modul "Conoce tus derechos: ruhig & sicher bleiben".
 * REINE DATEN, keine Logik (wie salud.js / logistica.js / knigge.js). Lädt vor
 * app.js und hängt sich an window.SC. Wird von ui.renderDerechos gerendert, das
 * dieselbe Sheet-Darstellung wie ui.renderSalud nutzt (gleiches Schema).
 *
 * Idee: Die allermeisten Reisen verlaufen ohne jeden Ärger. Aber wenn doch mal
 * eine Polizeikontrolle, eine Verwechslung oder eine Festnahme passiert, hilft
 * es enorm, ein paar ruhige Sätze parat zu haben: nach einem Anwalt fragen, die
 * Botschaft/das Konsulat verständigen, nichts unterschreiben, was man nicht
 * versteht. Das Modul gibt Orientierung und die wichtigsten Sätze auf Spanisch –
 * damit man im Stress sachlich und höflich bleibt.
 *
 * WICHTIG – kein Rechtsrat: Dies ist eine allgemeine Reise-Orientierung, KEINE
 * juristische Beratung. Gesetze und Abläufe unterscheiden sich je Land. Drogen
 * sind in ganz Lateinamerika illegal und werden teils hart bestraft. Im Ernstfall
 * zählt die offizielle Hilfe deiner Botschaft/deines Konsulats und ein Anwalt.
 *
 * Schemas (identisch zu salud.js, damit ui sie 1:1 rendern kann):
 *   INTRO    : string (+ INTRO_EN) – kurze deutsche Einleitung über der Seite.
 *   TOPICS   : [{ icon, title, intro, dos:[…], donts:[…] }] – aufklappbar (+ …En).
 *   PHRASES  : [{ id, icon, title, items:[{ es, de, en }] }] – nach Thema gruppiert.
 *   GLOSSARY : [{ es, de, en }]  – Schlüsselwörter rund um Polizei, Recht & Konsulat.
 *   CHECKLIST: [{ icon, item, why }] – „Im-Notfall-vorbereitet-Kit" (+ …En).
 */
(function () {
  "use strict";

  const INTRO =
    "Fast jede Reise läuft ohne Ärger. Falls aber doch mal eine Kontrolle oder " +
    "Festnahme passiert, helfen ein paar ruhige Sätze: nach einem Anwalt fragen, " +
    "die Botschaft verständigen, nichts unterschreiben, was du nicht verstehst. " +
    "Erst die Orientierung, dann die Sätze. Allgemeine Reise-Info, kein Rechtsrat – " +
    "Gesetze unterscheiden sich je Land, Drogen sind überall illegal.";

  const INTRO_EN =
    "Almost every trip goes smoothly. But if you ever face a police check or an " +
    "arrest, a few calm phrases help: ask for a lawyer, contact your embassy, sign " +
    "nothing you don't understand. First the orientation, then the phrases. General " +
    "travel info, not legal advice – laws vary by country, and drugs are illegal " +
    "everywhere.";

  // ---------- Erklärung: ruhig & sicher bleiben (aufklappbar, Knigge-Stil) ----------
  const TOPICS = [
    {
      icon: "🚓",
      title: "Wenn die Polizei dich kontrolliert",
      titleEn: "If the police stop you",
      intro: "Kontrollen sind in vielen Ländern normal. Bleib ruhig und höflich, zeig (eine Kopie von) deinem Ausweis und frag freundlich nach dem Grund.",
      introEn: "Checks are normal in many countries. Stay calm and polite, show (a copy of) your ID and politely ask the reason.",
      dos: [
        "Ruhig und höflich bleiben, Hände sichtbar, keine hektischen Bewegungen.",
        "Nach dem Grund fragen: „¿Por qué me detiene?“",
        "Eine Kopie/Foto von Pass und Visum zeigen; das Original sicher verwahren.",
        "Wenn du wenig Spanisch sprichst, sag es klar: „No hablo bien español.“",
        "Im Zweifel um einen Dolmetscher und um Kontakt zur Botschaft bitten.",
      ],
      dosEn: [
        "Stay calm and polite, hands visible, no sudden movements.",
        "Ask the reason: „¿Por qué me detiene?“",
        "Show a copy/photo of your passport and visa; keep the original safe.",
        "If your Spanish is limited, say so clearly: „No hablo bien español.“",
        "When unsure, ask for an interpreter and to contact your embassy.",
      ],
      donts: [
        "Nicht weglaufen, schubsen oder laut werden – das macht alles schlimmer.",
        "Keine Bestechung anbieten; geht ein Beamter darauf zu, höflich und ruhig bleiben.",
        "Nicht aggressiv diskutieren oder filmen ohne zu fragen – kann eskalieren.",
        "Keine Aussagen unterschreiben, die du nicht verstehst.",
      ],
      dontsEn: [
        "Don't run, push or shout – it only makes things worse.",
        "Don't offer a bribe; if an officer pushes for one, stay polite and calm.",
        "Don't argue aggressively or film without asking – it can escalate.",
        "Don't sign statements you don't understand.",
      ],
    },
    {
      icon: "⚖️",
      title: "Wenn du festgehalten wirst",
      titleEn: "If you're detained",
      intro: "Wirst du festgehalten, hast du in vielen Ländern das Recht, einen Anwalt und deine Botschaft zu kontaktieren. Sag ruhig, dass du das möchtest – und warte, bevor du etwas unterschreibst.",
      introEn: "If you're detained, in many countries you have the right to contact a lawyer and your embassy. Calmly say that you want to – and wait before signing anything.",
      dos: [
        "Klar sagen: „Quiero hablar con un abogado.“ (Ich will mit einem Anwalt sprechen.)",
        "Auf Kontakt zur Botschaft/zum Konsulat bestehen: „Quiero contactar a mi embajada.“",
        "Höflich, knapp und ehrlich bleiben; im Zweifel auf Anwalt/Dolmetscher warten.",
        "Dir Namen, Dienststelle und Grund notieren (oder merken).",
        "Familie/Freunde informieren lassen, wo du bist.",
      ],
      dosEn: [
        "State clearly: „Quiero hablar con un abogado.“ (I want to speak to a lawyer.)",
        "Insist on contacting your embassy/consulate: „Quiero contactar a mi embajada.“",
        "Stay polite, brief and honest; when unsure, wait for a lawyer/interpreter.",
        "Note (or memorise) names, the station and the reason.",
        "Have family/friends told where you are.",
      ],
      donts: [
        "Nichts unterschreiben, was du nicht vollständig verstehst: „No voy a firmar nada que no entienda.“",
        "Keine Aussage ohne Anwalt machen, wenn es ernst ist.",
        "Den Pass nicht dauerhaft aus der Hand geben, ohne eine Quittung/Begründung.",
        "Nicht lügen oder Beweise verstecken – das verschlimmert die Lage.",
      ],
      dontsEn: [
        "Don't sign anything you don't fully understand: „No voy a firmar nada que no entienda.“",
        "Don't give a statement without a lawyer if it's serious.",
        "Don't hand over your passport permanently without a receipt/reason.",
        "Don't lie or hide evidence – it makes things worse.",
      ],
    },
    {
      icon: "🚫",
      title: "Drogen & die Gesetze",
      titleEn: "Drugs & the law",
      intro: "Drogen sind in ganz Lateinamerika illegal – auch dort, wo Konsum geduldet wirkt. Strafen reichen je nach Land und Menge bis zu langer Haft. Das Risiko ist es nie wert.",
      introEn: "Drugs are illegal across Latin America – even where use seems tolerated. Penalties range up to long prison terms depending on country and amount. The risk is never worth it.",
      dos: [
        "Finger weg – egal, was andere Reisende erzählen.",
        "Lokale Gesetze respektieren; im Zweifel offizielle Quellen deiner Botschaft prüfen.",
        "Auf dein Gepäck achten und nie etwas für Fremde transportieren.",
        "Bei Reisewarnungen und unsicheren Gegenden informiert bleiben.",
      ],
      dosEn: [
        "Stay away – no matter what other travellers say.",
        "Respect local laws; when unsure, check your embassy's official guidance.",
        "Watch your luggage and never carry anything for strangers.",
        "Stay informed about travel advisories and unsafe areas.",
      ],
      donts: [
        "Niemals Drogen kaufen, tragen oder über Grenzen bringen.",
        "Kein Gepäck für andere mitnehmen, auch keine „Geschenke“.",
        "Dich nicht auf „hier ist das kein Problem“ verlassen – das stimmt rechtlich nicht.",
      ],
      dontsEn: [
        "Never buy, carry or move drugs across borders.",
        "Don't carry luggage for others, not even „gifts“.",
        "Don't rely on „it's no problem here“ – legally that's not true.",
      ],
    },
    {
      icon: "🛂",
      title: "Grenze & Migration",
      titleEn: "Border & immigration",
      intro: "An der Grenze und am Flughafen entscheidet sich, wie lange und wie sauber du im Land bist. Stempel prüfen, Aufenthalt nicht überziehen, Nachweise parat haben.",
      introEn: "At the border and airport, your legal stay is decided. Check your stamp, don't overstay, and have your proof ready.",
      dos: [
        "Einreisestempel sofort prüfen: richtiges Datum und erlaubte Tage?",
        "Weiter-/Rückflug oder Reiseplan zeigen können, wenn gefragt.",
        "Adresse der ersten Unterkunft parat haben (ein Hostel reicht).",
        "Vor der Reise klären, ob du ein Visum brauchst und wie lange du bleiben darfst.",
      ],
      dosEn: [
        "Check your entry stamp right away: correct date and number of days allowed?",
        "Be able to show an onward/return ticket or travel plan if asked.",
        "Have the address of your first accommodation ready (a hostel is fine).",
        "Before the trip, check whether you need a visa and how long you may stay.",
      ],
      donts: [
        "Den erlaubten Aufenthalt nicht überziehen – das gibt Strafen bei der Ausreise.",
        "Keine falschen Angaben zum Reisegrund machen.",
        "Den Einreisestempel nicht ungeprüft lassen – fehlt er, gibt es später Ärger.",
      ],
      dontsEn: [
        "Don't overstay your permitted time – it leads to fines on departure.",
        "Don't give false information about the purpose of your trip.",
        "Don't leave without checking your entry stamp – if it's missing, trouble follows.",
      ],
    },
    {
      icon: "🕵️",
      title: "Häufige Maschen erkennen",
      titleEn: "Spotting common scams",
      intro: "Die meisten Probleme sind keine Festnahmen, sondern Tricks: falsche „Polizisten“, manipulierte Taxameter, der Geldautomat mit versteckter Kamera. Ruhig bleiben und auf Nummer sicher gehen.",
      introEn: "Most problems aren't arrests but tricks: fake „police“, rigged taxi meters, the ATM with a hidden camera. Stay calm and play it safe.",
      dos: [
        "Bei angeblichen Zivil-Polizisten nach Dienstausweis fragen und zur Wache vorschlagen.",
        "Taxis per App rufen oder den Festpreis vorab vereinbaren.",
        "Geld nur an Automaten in Banken oder Malls abheben, die PIN verdecken.",
        "Bei „Hilfe“-Angeboten am Automaten höflich ablehnen und weitergehen.",
      ],
      dosEn: [
        "If plainclothes „police“ stop you, ask for ID and suggest going to the station.",
        "Order taxis via an app or agree the fixed price in advance.",
        "Withdraw cash only at ATMs inside banks or malls, and cover your PIN.",
        "Politely decline „help“ offers at the ATM and walk on.",
      ],
      donts: [
        "Fremden nie deine Karte, PIN oder das Handy zum „Helfen“ geben.",
        "Nicht ins Privatauto eines angeblichen Beamten steigen.",
        "Getränke und Essen von Fremden nicht annehmen (Betäubungsrisiko).",
      ],
      dontsEn: [
        "Never give strangers your card, PIN or phone to „help“.",
        "Don't get into the private car of a supposed official.",
        "Don't accept drinks or food from strangers (risk of being drugged).",
      ],
    },
  ];

  // ---------- Wichtige Sätze, nach Situation gruppiert ----------
  const PHRASES = [
    {
      id: "control",
      icon: "🚓",
      title: "Bei der Kontrolle",
      titleEn: "During a check",
      items: [
        { es: "¿Por qué me detiene?", de: "Warum halten Sie mich auf?", en: "Why are you stopping me?" },
        { es: "Aquí tiene una copia de mi pasaporte.", de: "Hier ist eine Kopie meines Passes.", en: "Here's a copy of my passport." },
        { es: "No hablo bien español.", de: "Ich spreche nicht gut Spanisch.", en: "I don't speak Spanish well." },
        { es: "¿Necesito un traductor, por favor?", de: "Kann ich bitte einen Dolmetscher bekommen?", en: "Can I have an interpreter, please?" },
        { es: "Soy turista, estoy de viaje.", de: "Ich bin Tourist und auf Reisen.", en: "I'm a tourist, I'm travelling." },
      ],
    },
    {
      id: "derechos",
      icon: "⚖️",
      title: "Deine Rechte einfordern",
      titleEn: "Asserting your rights",
      items: [
        { es: "Quiero hablar con un abogado.", de: "Ich möchte mit einem Anwalt sprechen.", en: "I want to speak to a lawyer." },
        { es: "Quiero contactar a mi embajada.", de: "Ich möchte meine Botschaft kontaktieren.", en: "I want to contact my embassy." },
        { es: "Quiero contactar a mi consulado.", de: "Ich möchte mein Konsulat kontaktieren.", en: "I want to contact my consulate." },
        { es: "No voy a firmar nada que no entienda.", de: "Ich unterschreibe nichts, was ich nicht verstehe.", en: "I won't sign anything I don't understand." },
        { es: "¿Estoy detenido/a?", de: "Bin ich festgenommen?", en: "Am I under arrest?" },
        { es: "¿Puedo llamar a alguien?", de: "Darf ich jemanden anrufen?", en: "May I call someone?" },
      ],
    },
    {
      id: "ayuda",
      icon: "🆘",
      title: "Hilfe & Notfall",
      titleEn: "Help & emergency",
      items: [
        { es: "Necesito ayuda, por favor.", de: "Ich brauche Hilfe, bitte.", en: "I need help, please." },
        { es: "Quiero hacer una denuncia.", de: "Ich möchte Anzeige erstatten.", en: "I want to file a report." },
        { es: "Me robaron mis cosas.", de: "Mir wurden meine Sachen gestohlen.", en: "My things were stolen." },
        { es: "¿Dónde está la estación de policía?", de: "Wo ist die Polizeiwache?", en: "Where is the police station?" },
        { es: "Por favor, avise a mi embajada.", de: "Bitte benachrichtigen Sie meine Botschaft.", en: "Please notify my embassy." },
      ],
    },
    {
      id: "migracion",
      icon: "🛂",
      title: "An der Grenze",
      titleEn: "At the border",
      items: [
        { es: "Vengo de turismo.", de: "Ich bin als Tourist hier.", en: "I'm here as a tourist." },
        { es: "¿Cuántos días me puedo quedar?", de: "Wie viele Tage darf ich bleiben?", en: "How many days may I stay?" },
        { es: "¿Necesito visa?", de: "Brauche ich ein Visum?", en: "Do I need a visa?" },
        { es: "Me quedo dos semanas.", de: "Ich bleibe zwei Wochen.", en: "I'm staying two weeks." },
        { es: "¿Me sella el pasaporte, por favor?", de: "Stempeln Sie bitte meinen Pass?", en: "Could you stamp my passport, please?" },
        { es: "Me hospedo en un hostal.", de: "Ich wohne in einem Hostel.", en: "I'm staying at a hostel." },
      ],
    },
    {
      id: "estafas",
      icon: "🚕",
      title: "Bei Tricks & Taxi",
      titleEn: "With scams & taxis",
      items: [
        { es: "Prefiero pagar con el taxímetro.", de: "Ich zahle lieber nach Taxameter.", en: "I'd rather pay by the meter." },
        { es: "¿Me muestra su identificación, por favor?", de: "Zeigen Sie mir bitte Ihren Ausweis?", en: "Could you show me your ID, please?" },
        { es: "No, gracias, estoy bien.", de: "Nein danke, alles gut.", en: "No thanks, I'm fine." },
        { es: "Mejor vamos a la estación de policía.", de: "Gehen wir lieber zur Polizeiwache.", en: "Let's go to the police station instead." },
        { es: "Pedí un taxi por aplicación.", de: "Ich habe ein Taxi per App bestellt.", en: "I ordered a taxi via an app." },
      ],
    },
  ];

  // ---------- Schlüsselwörter (Polizei, Recht, Konsulat) ----------
  const GLOSSARY = [
    { es: "el abogado / la abogada", de: "der Anwalt / die Anwältin", en: "the lawyer" },
    { es: "la embajada", de: "die Botschaft", en: "the embassy" },
    { es: "el consulado", de: "das Konsulat", en: "the consulate" },
    { es: "la policía", de: "die Polizei", en: "the police" },
    { es: "detenido/a", de: "festgenommen", en: "detained / arrested" },
    { es: "la denuncia", de: "die Anzeige", en: "the report / complaint" },
    { es: "el pasaporte", de: "der Reisepass", en: "the passport" },
    { es: "firmar", de: "unterschreiben", en: "to sign" },
    { es: "el traductor / intérprete", de: "der Dolmetscher", en: "the interpreter" },
    { es: "el soborno", de: "die Bestechung", en: "the bribe" },
    { es: "los derechos", de: "die Rechte", en: "the rights" },
    { es: "la multa", de: "das Bußgeld / die Strafe", en: "the fine" },
    { es: "la frontera", de: "die Grenze", en: "the border" },
    { es: "migración", de: "die Einwanderungsbehörde", en: "immigration" },
    { es: "la visa", de: "das Visum", en: "the visa" },
    { es: "el sello", de: "der Stempel", en: "the stamp" },
    { es: "el taxímetro", de: "das Taxameter", en: "the taxi meter" },
    { es: "la estafa", de: "der Betrug / die Masche", en: "the scam" },
    { es: "el retén", de: "die Kontrollstelle (Straße)", en: "the road checkpoint" },
    { es: "el comprobante", de: "der Beleg / die Quittung", en: "the receipt / proof" },
  ];

  // ---------- Im-Notfall-vorbereitet-Kit ----------
  const CHECKLIST = [
    {
      icon: "📄",
      item: "Passkopie & Visum (Foto am Handy + Papier)",
      itemEn: "Passport & visa copy (photo on phone + paper)",
      why: "Bei Kontrollen reicht oft eine Kopie; das Original bleibt sicher im Hostel.",
      whyEn: "A copy is often enough at checks; the original stays safe in the hostel.",
    },
    {
      icon: "☎️",
      item: "Nummer & Adresse deiner Botschaft/Konsulat",
      itemEn: "Number & address of your embassy/consulate",
      why: "Im Ernstfall die wichtigste Anlaufstelle – vorher speichern, auch offline.",
      whyEn: "The key contact in an emergency – save it beforehand, offline too.",
    },
    {
      icon: "🆘",
      item: "Örtliche Notrufnummer (z. B. 123 in Kolumbien)",
      itemEn: "Local emergency number (e.g. 123 in Colombia)",
      why: "Notrufnummern unterscheiden sich je Land – vor der Ankunft nachsehen.",
      whyEn: "Emergency numbers vary by country – look them up before arrival.",
    },
    {
      icon: "👥",
      item: "Vertrauensperson zu Hause informiert",
      itemEn: "A trusted person back home kept in the loop",
      why: "Jemand sollte deine grobe Route kennen und im Notfall handeln können.",
      whyEn: "Someone should know your rough route and be able to act in an emergency.",
    },
    {
      icon: "🛡️",
      item: "Reise- & Auslandskrankenversicherung",
      itemEn: "Travel & health insurance",
      why: "Deckt Notfälle ab und nennt oft eine 24/7-Hotline für Hilfe.",
      whyEn: "Covers emergencies and often gives a 24/7 hotline for help.",
    },
    {
      icon: "💳",
      item: "Notfall-Bargeld & Zweitkarte getrennt verwahren",
      itemEn: "Emergency cash & a backup card stored separately",
      why: "Wird eine Karte gesperrt oder gestohlen, bleibst du zahlungsfähig.",
      whyEn: "If a card is blocked or stolen, you can still pay.",
    },
  ];

  window.SC = window.SC || {};
  window.SC.derechos = { INTRO, INTRO_EN, TOPICS, PHRASES, GLOSSARY, CHECKLIST };
})();
