/*
 * flirt.js  (SC.flirt) – Modul "Coqueteo y romance: flirten & verlieben unterwegs".
 * REINE DATEN, keine Logik (wie logistica.js / salud.js / knigge.js). Lädt vor
 * app.js und hängt sich an window.SC. Wird von ui.renderFlirt gerendert, das
 * dieselbe Sheet-Darstellung wie ui.renderSalud/ui.renderLogistica nutzt
 * (gleiches Schema: Topics, Sätze, Glossar, Checkliste).
 *
 * Idee: Unterwegs lernt man Leute kennen – im Hostel, auf der Tour, beim
 * Tanzen. Dieses Modul gibt die spanischen Sätze und das Benehmen dazu:
 * entspannt ins Gespräch kommen, echte Komplimente machen, ein Date vorschlagen,
 * Interesse zeigen UND ein Nein hören – respektvoll, auf Augenhöhe, mit Konsens
 * als Grundregel. Dazu, wie Daten in Lateinamerika oft läuft (Tempo, Familie,
 * Regionales) und wie man beim Kennenlernen auf sich aufpasst. Durchgängig
 * LatAm-Spanisch.
 *
 * Schemas (identisch zu salud.js/logistica.js, damit ui sie 1:1 rendern kann):
 *   INTRO    : string (+ INTRO_EN) – kurze deutsche Einleitung über der Seite.
 *   TOPICS   : [{ icon, title, intro, dos:[…], donts:[…] }] – aufklappbar (+ …En).
 *   PHRASES  : [{ id, icon, title, items:[{ es, de, en }] }] – nach Thema gruppiert.
 *   GLOSSARY : [{ es, de, en }]  – Schlüsselwörter rund ums Flirten & Daten.
 *   CHECKLIST: [{ icon, item, why }] – „Date- & Sicherheits-Kit" (+ …En).
 *
 * Haltung: Flirten ist ein Angebot, kein Anspruch. Ein „nein", ein „no" oder
 * Desinteresse wird akzeptiert – sofort und ohne Diskussion. Beim ersten Treffen
 * an einem öffentlichen Ort verabreden und jemandem Bescheid geben, wo man ist.
 */
(function () {
  "use strict";

  const INTRO =
    "Unterwegs lernt man ständig Leute kennen – im Hostel, auf der Tour, beim " +
    "Tanzen. Hier sind die Sätze und das Benehmen zum Flirten auf Spanisch: " +
    "entspannt ins Gespräch kommen, echte Komplimente machen, ein Date " +
    "vorschlagen – und genauso ein Nein hören. Grundregel ist immer Respekt und " +
    "Konsens: Flirten ist ein Angebot, kein Anspruch. Erst die Tipps, dann die " +
    "Sätze, das Glossar und ein kleines Date- & Sicherheits-Kit.";

  const INTRO_EN =
    "On the road you meet people all the time – in the hostel, on a tour, out " +
    "dancing. Here are the phrases and the manners for flirting in Spanish: ease " +
    "into a conversation, give genuine compliments, suggest a date – and just as " +
    "much, take a no. The ground rule is always respect and consent: flirting is " +
    "an offer, not a claim. First the tips, then the phrases, the glossary and a " +
    "small dating & safety kit.";

  // ---------- Erklärung: flirten & daten unterwegs (aufklappbar, Knigge-Stil) ----------
  const TOPICS = [
    {
      icon: "👋",
      title: "Entspannt ins Gespräch kommen",
      titleEn: "Easing into a conversation",
      intro: "Der erste Satz muss nicht clever sein – er muss nur freundlich und echt sein. Eine kleine Frage zur Situation wirkt natürlicher als eine einstudierte Anmachzeile.",
      introEn: "The first line doesn't have to be clever – it just has to be friendly and real. A small question about the situation feels more natural than a rehearsed pick-up line.",
      dos: [
        "Mit der Situation anfangen: „¿De dónde eres?“, „¿Qué recomiendas por aquí?“ – einfach und offen.",
        "Lächeln, Augenkontakt, ein lockerer Ton – die Stimmung zählt mehr als der perfekte Satz.",
        "Echtes Interesse zeigen: zuhören und nachfragen, statt nur über sich selbst zu reden.",
        "Ein bisschen Spanisch wagen – ein charmanter Fehler bricht oft das Eis.",
        "Den Anlass nutzen: Hostel-Küche, Tour, Bus, Tanzfläche – gemeinsamer Moment = leichter Einstieg.",
      ],
      dosEn: [
        "Start with the situation: „¿De dónde eres?“, „¿Qué recomiendas por aquí?“ – simple and open.",
        "A smile, eye contact, a relaxed tone – the vibe matters more than the perfect line.",
        "Show genuine interest: listen and ask follow-ups instead of just talking about yourself.",
        "Dare to use a bit of Spanish – a charming mistake often breaks the ice.",
        "Use the setting: hostel kitchen, tour, bus, dance floor – a shared moment makes it easy to start.",
      ],
      donts: [
        "Keine plumpen Anmachsprüche oder Kommentare über den Körper – das wirkt aufdringlich.",
        "Nicht in den persönlichen Raum drängen; etwas Abstand lassen, bis klar ist, dass es passt.",
        "Nicht weiterbohren, wenn jemand kurz angebunden ist oder weggeht – Signal verstanden, Thema durch.",
        "Nicht so tun, als wärst du wer anders – Ehrlichkeit kommt besser an als eine Rolle.",
      ],
      dontsEn: [
        "No crude pick-up lines or comments about someone's body – it comes across as pushy.",
        "Don't crowd their personal space; keep a little distance until it's clear it's welcome.",
        "Don't keep pushing if someone is short with you or walks away – signal received, topic closed.",
        "Don't pretend to be someone you're not – honesty lands better than an act.",
      ],
      es: [
        "En un hostal o en una fiesta es fácil *empezar* una conversación: una pregunta sencilla sobre el lugar funciona mejor que una frase *ensayada*. Sonríe, mira a los ojos y habla con calma.",
        "Muestra interés de verdad: *escucha* y haz preguntas en vez de hablar solo de ti. Si la otra persona contesta corto o se *aleja*, capta la señal y cambia de tema.",
      ],
      vocab: [
        { es: "empezar", de: "anfangen, beginnen", en: "to start", take: true },
        { es: "ensayada", de: "einstudiert (ensayar)", en: "rehearsed (ensayar)", take: false },
        { es: "escucha", de: "hör zu (escuchar)", en: "listen (escuchar)", take: true },
        { es: "aleja", de: "entfernt sich (alejarse)", en: "moves away (alejarse)", take: true },
      ],
      level: "A2",
    },
    {
      icon: "😊",
      title: "Komplimente, die ankommen",
      titleEn: "Compliments that land",
      intro: "Ein gutes Kompliment ist konkret, ehrlich und nicht aufdringlich. Lieber etwas zur Person sagen (Lachen, Energie, Geschmack) als nur zum Aussehen.",
      introEn: "A good compliment is specific, honest and not pushy. Better to mention the person (their laugh, energy, taste) than just looks.",
      dos: [
        "Konkret loben: „Me encanta tu energía“ statt nur „eres guapa/guapo“.",
        "Auf eine Sache eingehen, die ihr gerade erlebt: ihr Lachen, ihre Geschichte, ihre Musik.",
        "Ein Kompliment, dann weiterreden – nicht abwarten, ob es „wirkt“.",
        "Den Ton an die Stimmung anpassen: leicht und verspielt, nicht schwer und drängend.",
      ],
      dosEn: [
        "Be specific: „Me encanta tu energía“ rather than just „you're pretty/handsome“.",
        "Pick up on something happening right now: their laugh, their story, their music.",
        "Give one compliment, then keep talking – don't wait to see if it „works“.",
        "Match the tone to the mood: light and playful, not heavy and insistent.",
      ],
      donts: [
        "Keine aufdringlichen oder anzüglichen Komplimente – das macht es schnell unangenehm.",
        "Nicht in einer Tour Komplimente aneinanderreihen; eines, das echt ist, reicht.",
        "Nicht enttäuscht reagieren, wenn ein Kompliment nur höflich quittiert wird.",
      ],
      dontsEn: [
        "No pushy or suggestive compliments – it gets uncomfortable fast.",
        "Don't stack compliment after compliment; one that's genuine is enough.",
        "Don't react with disappointment if a compliment only gets a polite reply.",
      ],
      es: [
        "Un buen *piropo* es concreto y sincero: mejor hablar de la energía o la sonrisa de alguien que solo del *aspecto*. Di el cumplido y sigue la conversación con naturalidad.",
        "No *exageres* con diez cumplidos seguidos; uno honesto *vale* más. Y si la persona solo responde con cortesía, no pasa nada.",
      ],
      vocab: [
        { es: "piropo", de: "das (Flirt-)Kompliment", en: "flirty compliment", take: true },
        { es: "aspecto", de: "das Aussehen", en: "looks, appearance", take: true },
        { es: "exageres", de: "übertreib (exagerar)", en: "overdo it (exagerar)", take: false },
        { es: "vale", de: "ist wert (valer)", en: "is worth (valer)", take: true },
      ],
      level: "A2",
    },
    {
      icon: "🤝",
      title: "Respekt & Konsens: Signale lesen",
      titleEn: "Respect & consent: reading the signals",
      intro: "Die wichtigste Regel beim Flirten: auf das Gegenüber achten. Interesse zeigt sich beidseitig – fehlt es auf einer Seite, ist Schluss. Ein Nein gilt sofort, ohne Diskussion.",
      introEn: "The most important rule in flirting: pay attention to the other person. Interest is mutual – if it's missing on one side, it's over. A no counts immediately, no discussion.",
      dos: [
        "Auf Körpersprache achten: zugewandt, lacht mit, bleibt = gutes Zeichen; abgewandt, knapp, sucht den Ausgang = besser Abstand.",
        "Direkt und freundlich fragen, ob etwas okay ist: „¿Te gustaría…?“, „¿Está bien si…?“.",
        "Ein „no“, „ahora no“ oder „estoy con alguien“ sofort akzeptieren – freundlich bleiben, Thema wechseln oder gehen.",
        "Auch selbst klar sein: Wenn du kein Interesse hast, ist ein ehrliches, höfliches Nein völlig okay.",
        "Im Zweifel lieber einmal zu viel nachfragen als zu wenig.",
      ],
      dosEn: [
        "Read body language: turned toward you, laughing along, staying = good sign; turned away, short answers, eyeing the exit = give space.",
        "Ask directly and kindly whether something is okay: „¿Te gustaría…?“, „¿Está bien si…?“.",
        "Accept a „no“, „not now“ or „I'm with someone“ at once – stay friendly, change the subject or move on.",
        "Be clear yourself too: if you're not interested, an honest, polite no is completely fine.",
        "When in doubt, ask once too often rather than once too little.",
      ],
      donts: [
        "Ein Nein nicht als „Spiel“ deuten oder „überzeugen“ wollen – nein heißt nein.",
        "Nicht weitermachen, nur weil keiner ausdrücklich „Stopp“ sagt – fehlendes Ja ist kein Ja.",
        "Niemanden bedrängen, festhalten oder verfolgen – auch nicht „aus Spaß“.",
        "Alkohol ist kein Freibrief: Wer stark betrunken ist, kann nicht zustimmen.",
      ],
      dontsEn: [
        "Don't read a no as a „game“ or try to „convince“ – no means no.",
        "Don't carry on just because no one explicitly says „stop“ – the absence of a yes is not a yes.",
        "Never corner, hold onto or follow anyone – not even „for fun“.",
        "Alcohol is not a free pass: someone very drunk can't consent.",
      ],
      es: [
        "La regla más importante al coquetear es el *consentimiento*: el interés tiene que ser de los dos. Pregunta con confianza si algo está bien: „¿Te *molesta* si me siento aquí?“.",
        "Si escuchas un „no“, un „ahora no“ o „estoy con alguien“, *acéptalo* enseguida, sin insistir. Un „no“ no es un juego, y nadie puede dar permiso si está muy *borracho*.",
      ],
      vocab: [
        { es: "consentimiento", de: "die Zustimmung, der Konsens", en: "consent", take: true },
        { es: "molesta", de: "stört (molestar)", en: "bothers (molestar)", take: true },
        { es: "acéptalo", de: "akzeptier es (aceptar)", en: "accept it (aceptar)", take: true },
        { es: "borracho", de: "betrunken", en: "drunk", take: true },
      ],
      level: "B1",
    },
    {
      icon: "☕",
      title: "Vom Flirt zum Date",
      titleEn: "From flirting to a date",
      intro: "Läuft es gut, schlag etwas Konkretes und Lockeres vor – ein Kaffee, ein Spaziergang, gemeinsam tanzen. Ein erstes Treffen tagsüber oder an einem belebten Ort nimmt beiden den Druck.",
      introEn: "If it's going well, suggest something concrete and low-key – a coffee, a walk, dancing together. A first meeting in daytime or somewhere busy takes the pressure off both of you.",
      dos: [
        "Konkret vorschlagen: „¿Tomamos un café mañana?“ statt vagem „sehen wir uns mal“.",
        "Etwas Einfaches, Öffentliches wählen: Café, Markt, Mirador, Salsa-Abend.",
        "Einen Ausweg lassen: „si quieres“, „sin compromiso“ – kein Druck.",
        "Kontakt tauschen, ohne zu drängen – WhatsApp/Instagram, wenn beide wollen.",
        "Pünktlich sein und es entspannt halten; ein Date ist kein Verhör.",
      ],
      dosEn: [
        "Make it concrete: „¿Tomamos un café mañana?“ instead of a vague „let's hang out sometime“.",
        "Pick something simple and public: a café, a market, a viewpoint, a salsa night.",
        "Leave an easy out: „si quieres“, „sin compromiso“ – no pressure.",
        "Swap contacts without pushing – WhatsApp/Instagram if you both want to.",
        "Be on time and keep it relaxed; a date is not an interrogation.",
      ],
      donts: [
        "Nicht gleich beim ersten Treffen auf etwas Privates/Abgelegenes drängen.",
        "Nicht mit zehn Nachrichten nachfassen, wenn keine Antwort kommt – ein „kein Interesse“ ist auch eine Antwort.",
        "Pläne nicht überladen; ein kurzer, lockerer Treff ist besser als ein Mammutprogramm.",
      ],
      dontsEn: [
        "Don't push for somewhere private/secluded on the very first meeting.",
        "Don't follow up with ten messages if there's no reply – „not interested“ is an answer too.",
        "Don't overload the plan; a short, easy meet beats a marathon itinerary.",
      ],
      es: [
        "Si todo va bien, *propón* algo concreto y tranquilo: un café, un paseo o salir a *bailar*. Una primera cita de día o en un sitio con gente quita presión a los dos.",
        "Deja siempre una *salida* fácil: „si quieres“, „sin compromiso“. Intercambia el contacto solo si ambos *quieren*, sin presionar.",
      ],
      vocab: [
        { es: "propón", de: "schlag vor (proponer)", en: "suggest (proponer)", take: true },
        { es: "bailar", de: "tanzen", en: "to dance", take: true },
        { es: "salida", de: "der Ausweg, Ausgang", en: "the way out", take: true },
        { es: "quieren", de: "(sie) wollen (querer)", en: "they want (querer)", take: true },
      ],
      level: "A2",
    },
    {
      icon: "🌎",
      title: "Dating-Kultur in Lateinamerika",
      titleEn: "Dating culture in Latin America",
      intro: "Daten läuft je nach Land und Person unterschiedlich. Vieles ist warmherzig und direkt, manches förmlicher als zu Hause. Ein paar Faustregeln helfen – aber jede Person ist anders.",
      introEn: "Dating varies by country and person. A lot is warm and direct, some of it more formal than back home. A few rules of thumb help – but everyone is different.",
      dos: [
        "Mit Wärme rechnen: Begrüßungs-Wange-Küsschen (un beso en la mejilla) ist vielerorts normal und unverfänglich.",
        "Komplimente und Charme gehören dazu – „piropos“ können nett sein, solange sie respektvoll bleiben.",
        "Familie und Freundeskreis sind oft wichtig; gut dazustehen zählt viel.",
        "Tempo der anderen Person folgen: mancherorts wird länger „kennengelernt“, bevor es ernst wird.",
        "Spanisch (auch holprig) wird fast immer geschätzt – es zeigt echtes Interesse.",
      ],
      dosEn: [
        "Expect warmth: a greeting kiss on the cheek (un beso en la mejilla) is normal and harmless in many places.",
        "Compliments and charm are part of it – „piropos“ can be sweet as long as they stay respectful.",
        "Family and friends often matter a lot; making a good impression counts.",
        "Follow the other person's pace: in some places there's a longer „getting to know“ before things get serious.",
        "Spanish (even clumsy) is almost always appreciated – it shows real interest.",
      ],
      donts: [
        "Klischees nicht zur Erwartung machen – nicht jede/r tanzt, flirtet oder will dasselbe.",
        "Aufdringliche „piropos“ auf der Straße sind kein Flirten, sondern Belästigung – nicht nachmachen.",
        "Eine kurze Urlaubsromanze nicht als selbstverständlich voraussetzen.",
        "Nicht annehmen, dass Offenheit oder Herzlichkeit automatisch romantisches Interesse bedeutet.",
      ],
      dontsEn: [
        "Don't turn clichés into expectations – not everyone dances, flirts or wants the same thing.",
        "Pushy „piropos“ shouted in the street aren't flirting, they're harassment – don't copy them.",
        "Don't assume a holiday fling is a given.",
        "Don't assume that openness or warmth automatically means romantic interest.",
      ],
      es: [
        "En Latinoamérica el trato suele ser *cálido*: un beso en la mejilla al saludar es normal en muchos sitios y no significa nada *romántico*. Los cumplidos y el coqueteo son parte del trato.",
        "La familia y los amigos muchas veces *importan* mucho. Sigue el *ritmo* de la otra persona: en algunos lugares la gente se conoce con calma antes de algo serio.",
      ],
      vocab: [
        { es: "cálido", de: "warm, herzlich", en: "warm", take: true },
        { es: "romántico", de: "romantisch", en: "romantic", take: true },
        { es: "importan", de: "sind wichtig (importar)", en: "matter (importar)", take: true },
        { es: "ritmo", de: "das Tempo, der Rhythmus", en: "the pace, rhythm", take: true },
      ],
      level: "B1",
    },
    {
      icon: "🛡️",
      title: "Sicher daten unterwegs",
      titleEn: "Dating safely on the road",
      intro: "Beim Kennenlernen in einem fremden Land lohnt sich etwas Vorsicht – für alle, besonders allein Reisende. Ein paar einfache Gewohnheiten machen ein Date entspannt und sicher.",
      introEn: "Meeting new people in a foreign country is worth a little caution – for everyone, especially solo travellers. A few simple habits keep a date relaxed and safe.",
      dos: [
        "Erstes Treffen an einem öffentlichen, belebten Ort – Café, Plaza, Bar mit Leuten.",
        "Jemandem aus dem Hostel sagen, mit wem du wo bist und wann du zurück bist; Standort teilen.",
        "Eigenes Getränk im Blick behalten und selbst bestellen/holen.",
        "Eigenes Geld, eigenes Handy, eigener Heimweg/Taxi – unabhängig bleiben.",
        "Auf das Bauchgefühl hören: Stimmt etwas nicht, höflich gehen – eine Ausrede ist erlaubt.",
        "Safer Sex: Kondome dabeihaben und benutzen.",
      ],
      dosEn: [
        "First meeting in a public, busy place – a café, a plaza, a bar with people around.",
        "Tell someone at the hostel who you're with, where and when you'll be back; share your location.",
        "Keep an eye on your own drink and order/fetch it yourself.",
        "Your own money, your own phone, your own way home/taxi – stay independent.",
        "Trust your gut: if something feels off, leave politely – an excuse is allowed.",
        "Safer sex: carry condoms and use them.",
      ],
      donts: [
        "Beim ersten Date nicht ins Auto/Zimmer von fast Fremden steigen.",
        "Keine Getränke von Unbekannten annehmen, die du nicht selbst kommen siehst.",
        "Hostel-Name, Zimmernummer oder Reisepläne nicht zu früh ausplaudern.",
        "Dich nicht zu Alkohol/Drogen oder irgendetwas drängen lassen – dein Nein zählt genauso.",
        "Wertsachen und Dokumente nicht offen herumliegen lassen.",
      ],
      dontsEn: [
        "On a first date, don't get into the car/room of near-strangers.",
        "Don't accept drinks from strangers that you didn't see arrive.",
        "Don't give away your hostel name, room number or travel plans too soon.",
        "Don't let yourself be pushed into alcohol/drugs or anything else – your no counts just as much.",
        "Don't leave valuables and documents lying out in the open.",
      ],
      es: [
        "Para una primera cita, elige un lugar *público* y con gente. Dile a alguien del hostal con quién estás y a qué hora *vuelves*; comparte tu ubicación.",
        "Cuida tu *bebida* y pídela tú mismo. Si algo no te da buena *espina*, vete con calma: una excusa siempre vale, y tu „no“ cuenta igual.",
      ],
      vocab: [
        { es: "público", de: "öffentlich", en: "public", take: true },
        { es: "vuelves", de: "du kehrst zurück (volver)", en: "you come back (volver)", take: true },
        { es: "bebida", de: "das Getränk", en: "the drink", take: true },
        { es: "espina", de: "ungutes Gefühl (mala espina)", en: "a bad feeling (mala espina)", take: false },
      ],
      level: "A2",
    },
  ];

  // ---------- Wichtige Sätze, nach Thema gruppiert (es / de / en) ----------
  const PHRASES = [
    {
      id: "abrir",
      icon: "👋",
      title: "Ins Gespräch kommen",
      titleEn: "Starting a conversation",
      items: [
        { es: "Hola, ¿qué tal?", de: "Hallo, wie geht's?", en: "Hi, how's it going?" },
        { es: "¿De dónde eres?", de: "Woher kommst du?", en: "Where are you from?" },
        { es: "¿Estás viajando solo/sola?", de: "Reist du allein?", en: "Are you travelling alone?" },
        { es: "¿Qué me recomiendas por aquí?", de: "Was empfiehlst du mir hier in der Gegend?", en: "What do you recommend around here?" },
        { es: "¿Te puedo invitar a un café?", de: "Darf ich dich auf einen Kaffee einladen?", en: "Can I buy you a coffee?" },
        { es: "¿Está libre este asiento?", de: "Ist dieser Platz frei?", en: "Is this seat free?" },
        { es: "Perdona que te moleste, ¿hablas inglés o español?", de: "Entschuldige die Störung – sprichst du Englisch oder Spanisch?", en: "Sorry to bother you – do you speak English or Spanish?" },
        { es: "¿Vienes mucho por aquí?", de: "Bist du öfter hier?", en: "Do you come here often?" },
      ],
    },
    {
      id: "piropos",
      icon: "😊",
      title: "Komplimente & nett sein",
      titleEn: "Compliments & being nice",
      items: [
        { es: "Me encanta tu energía.", de: "Ich mag deine Energie.", en: "I love your energy." },
        { es: "Tienes una sonrisa muy linda.", de: "Du hast ein sehr schönes Lächeln.", en: "You have a really lovely smile." },
        { es: "Me gusta cómo piensas.", de: "Mir gefällt, wie du denkst.", en: "I like the way you think." },
        { es: "Me gusta mucho hablar contigo.", de: "Ich rede sehr gern mit dir.", en: "I really enjoy talking with you." },
        { es: "Eres muy divertido/divertida.", de: "Du bist sehr lustig.", en: "You're really fun." },
        { es: "Qué buen gusto tienes para la música.", de: "Du hast einen guten Musikgeschmack.", en: "You've got great taste in music." },
        { es: "Me haces reír mucho.", de: "Du bringst mich oft zum Lachen.", en: "You make me laugh a lot." },
        { es: "Estás guapísimo/guapísima esta noche.", de: "Du siehst heute Abend umwerfend aus.", en: "You look absolutely gorgeous tonight." },
        { es: "Tienes unos ojos increíbles.", de: "Du hast unglaubliche Augen.", en: "You have such incredible eyes." },
        { es: "Me encanta tu sonrisa, me distrae.", de: "Ich liebe dein Lächeln, es lenkt mich total ab.", en: "I love your smile, it's so distracting." },
      ],
    },
    {
      id: "cita",
      icon: "☕",
      title: "Ein Date vorschlagen",
      titleEn: "Suggesting a date",
      items: [
        { es: "¿Te gustaría salir a tomar algo?", de: "Hast du Lust, etwas trinken zu gehen?", en: "Would you like to go out for a drink?" },
        { es: "¿Tomamos un café mañana?", de: "Trinken wir morgen einen Kaffee?", en: "Shall we get a coffee tomorrow?" },
        { es: "¿Quieres que demos una vuelta?", de: "Wollen wir eine Runde spazieren?", en: "Do you want to go for a stroll?" },
        { es: "¿Te animas a bailar esta noche?", de: "Hast du Lust, heute Abend tanzen zu gehen?", en: "Are you up for dancing tonight?" },
        { es: "Sin compromiso, solo si tú quieres.", de: "Ganz unverbindlich, nur wenn du Lust hast.", en: "No pressure, only if you want to." },
        { es: "¿Me das tu WhatsApp / Instagram?", de: "Gibst du mir dein WhatsApp / Instagram?", en: "Can I have your WhatsApp / Instagram?" },
        { es: "¿Cuándo te viene bien?", de: "Wann passt es dir?", en: "When works for you?" },
        { es: "Te escribo y vemos, ¿va?", de: "Ich schreib dir und wir schauen, okay?", en: "I'll text you and we'll see, okay?" },
      ],
    },
    {
      id: "limites",
      icon: "💬",
      title: "Interesse zeigen & Grenzen setzen",
      titleEn: "Showing interest & setting boundaries",
      items: [
        { es: "Me gustas.", de: "Ich mag dich / Ich steh auf dich.", en: "I like you." },
        { es: "¿Está bien si te doy un beso?", de: "Ist es okay, wenn ich dich küsse?", en: "Is it okay if I kiss you?" },
        { es: "¿Te sientes cómodo/cómoda?", de: "Fühlst du dich wohl?", en: "Are you comfortable?" },
        { es: "Vamos despacio, ¿te parece?", de: "Lass uns langsam machen, einverstanden?", en: "Let's take it slow, sounds good?" },
        { es: "Me caes muy bien, pero solo como amigo/amiga.", de: "Ich mag dich sehr, aber nur als Freund/Freundin.", en: "I really like you, but only as a friend." },
        { es: "No, gracias. No estoy interesado/interesada.", de: "Nein, danke. Ich habe kein Interesse.", en: "No, thanks. I'm not interested." },
        { es: "Estoy con alguien.", de: "Ich bin vergeben.", en: "I'm with someone." },
        { es: "Prefiero que no, gracias.", de: "Mir wäre lieber nicht, danke.", en: "I'd rather not, thanks." },
        { es: "Déjame en paz, por favor.", de: "Lass mich bitte in Ruhe.", en: "Please leave me alone." },
      ],
    },
    {
      id: "subir",
      icon: "🔥",
      title: "Heißer werden – mit Konsens",
      titleEn: "Turning up the heat – with consent",
      items: [
        { es: "Me encantas.", de: "Ich steh total auf dich.", en: "I'm really into you." },
        { es: "No puedo dejar de mirarte.", de: "Ich kann nicht aufhören, dich anzusehen.", en: "I can't stop looking at you." },
        { es: "Me muero por besarte.", de: "Ich brenne darauf, dich zu küssen.", en: "I'm dying to kiss you." },
        { es: "Me pones nervioso/nerviosa, en el buen sentido.", de: "Du machst mich nervös – im guten Sinn.", en: "You make me nervous, in the best way." },
        { es: "¿Quieres que sigamos esto en un lugar más tranquilo?", de: "Wollen wir das woanders ungestörter weitermachen?", en: "Want to take this somewhere quieter?" },
        { es: "¿Te animas a venir a mi habitación?", de: "Hast du Lust, mit auf mein Zimmer zu kommen?", en: "Do you feel like coming back to my room?" },
        { es: "Me gustas muchísimo… ¿sientes lo mismo?", de: "Ich steh wahnsinnig auf dich … geht's dir genauso?", en: "I'm so into you… do you feel the same?" },
        { es: "¿Está bien si te toco aquí?", de: "Ist es okay, wenn ich dich hier berühre?", en: "Is it okay if I touch you here?" },
        { es: "Dime qué te gusta.", de: "Sag mir, was dir gefällt.", en: "Tell me what you like." },
        { es: "Solo si tú quieres; sin prisa.", de: "Nur wenn du auch willst; ganz ohne Eile.", en: "Only if you want to; no rush at all." },
        { es: "Tengo muchas ganas de ti.", de: "Ich begehre dich sehr.", en: "I want you so much." },
      ],
    },
    {
      id: "despues",
      icon: "📱",
      title: "Kontakt & danach",
      titleEn: "Staying in touch & afterwards",
      items: [
        { es: "Lo pasé muy bien contigo.", de: "Ich hatte eine sehr schöne Zeit mit dir.", en: "I had a really good time with you." },
        { es: "Me encantaría verte otra vez.", de: "Ich würde dich gern wiedersehen.", en: "I'd love to see you again." },
        { es: "¿Te escribo mañana?", de: "Schreib ich dir morgen?", en: "Shall I text you tomorrow?" },
        { es: "Te extraño un poco.", de: "Du fehlst mir ein bisschen.", en: "I miss you a little." },
        { es: "Sigo de viaje, pero me gustó conocerte.", de: "Ich reise weiter, aber ich habe dich gern kennengelernt.", en: "I'm moving on with my trip, but it was nice meeting you." },
        { es: "Mantengámonos en contacto.", de: "Lass uns in Kontakt bleiben.", en: "Let's stay in touch." },
        { es: "¿Tienes condones? / Tengo condones.", de: "Hast du Kondome? / Ich habe Kondome.", en: "Do you have condoms? / I have condoms." },
      ],
    },
  ];

  // ---------- Glossar: Schlüsselwörter rund ums Flirten & Daten ----------
  const GLOSSARY = [
    { es: "coquetear / conquistar a alguien", de: "flirten / jemanden erobern", en: "to flirt / to win someone over" },
    { es: "una cita", de: "ein Date / eine Verabredung", en: "a date" },
    { es: "salir con alguien", de: "mit jemandem ausgehen / daten", en: "to go out with / to date someone" },
    { es: "el piropo", de: "das (Flirt-)Kompliment", en: "a flirty compliment" },
    { es: "guapo/a · lindo/a · bonito/a", de: "hübsch / gutaussehend / schön", en: "handsome / cute / pretty" },
    { es: "me gustas", de: "ich mag dich / ich steh auf dich", en: "I like you (romantically)" },
    { es: "un beso", de: "ein Kuss / ein Wangenküsschen", en: "a kiss" },
    { es: "abrazar / el abrazo", de: "umarmen / die Umarmung", en: "to hug / a hug" },
    { es: "el novio / la novia", de: "der Freund / die Freundin (Beziehung)", en: "boyfriend / girlfriend" },
    { es: "soltero/a", de: "Single / ungebunden", en: "single" },
    { es: "estar con alguien", de: "vergeben sein / mit jemandem zusammen sein", en: "to be with someone / taken" },
    { es: "el amor", de: "die Liebe", en: "love" },
    { es: "enamorarse", de: "sich verlieben", en: "to fall in love" },
    { es: "el cariño", de: "die Zuneigung / Zärtlichkeit", en: "affection / fondness" },
    { es: "el consentimiento", de: "die Zustimmung / der Konsens", en: "consent" },
    { es: "sin compromiso", de: "unverbindlich / ohne Verpflichtung", en: "no strings attached" },
    { es: "el rechazo / rechazar", de: "die Zurückweisung / ablehnen", en: "rejection / to reject" },
    { es: "no estoy interesado/a", de: "ich habe kein Interesse", en: "I'm not interested" },
    { es: "déjame en paz", de: "lass mich in Ruhe", en: "leave me alone" },
    { es: "el condón / el preservativo", de: "das Kondom", en: "condom" },
    { es: "un amorío / una aventura", de: "eine lockere Affäre / ein Abenteuer", en: "a fling / a casual thing" },
    { es: "el flechazo", de: "die Liebe auf den ersten Blick", en: "love at first sight" },
    { es: "tener ganas (de alguien)", de: "Lust haben / jemanden begehren", en: "to be into / to want someone" },
    { es: "el deseo / desear", de: "das Verlangen / begehren", en: "desire / to desire" },
    { es: "una noche juntos", de: "eine gemeinsame Nacht", en: "a night together" },
    { es: "calentón/calentona · caliente", de: "angeturnt / heiß (umgangssprachlich)", en: "turned on / hot (colloquial)" },
  ];

  // ---------- „Date- & Sicherheits-Kit": kleine Liste (Icon + Sache + Warum) ----------
  const CHECKLIST = [
    { icon: "📍", item: "Standort geteilt", itemEn: "Location shared", why: "Jemandem aus dem Hostel sagen, wo du bist und wann du zurück bist – kurz den Live-Standort teilen.", whyEn: "Tell someone at the hostel where you are and when you'll be back – share your live location briefly." },
    { icon: "📱", item: "Geladenes Handy + Taxi-App", itemEn: "Charged phone + taxi app", why: "Eigener Heimweg, jederzeit erreichbar; eine Ride-App (Uber/DiDi/Cabify) erspart das Verhandeln nachts.", whyEn: "Your own way home, reachable any time; a ride app (Uber/DiDi/Cabify) saves haggling at night." },
    { icon: "🛡️", item: "Kondome", itemEn: "Condoms", why: "Safer Sex liegt bei dir – verlass dich nicht darauf, dass die andere Person welche dabeihat.", whyEn: "Safer sex is on you – don't rely on the other person to have any." },
    { icon: "💵", item: "Eigenes Geld für den Heimweg", itemEn: "Your own cash for getting home", why: "Etwas Bargeld extra, damit du jederzeit unabhängig gehen kannst – ohne auf jemanden angewiesen zu sein.", whyEn: "A little spare cash so you can leave independently any time – without depending on anyone." },
    { icon: "🥤", item: "Getränk im Blick", itemEn: "Eyes on your drink", why: "Selbst bestellen, nie unbeaufsichtigt stehen lassen – schützt vor K.-o.-Tropfen.", whyEn: "Order it yourself, never leave it unattended – guards against spiked drinks." },
    { icon: "🗺️", item: "Öffentlicher Treffpunkt", itemEn: "A public meeting spot", why: "Erstes Date an einem belebten Ort (Café, Plaza, Bar) statt irgendwo abgelegen.", whyEn: "First date somewhere busy (a café, plaza, bar) rather than somewhere secluded." },
    { icon: "🧠", item: "Bauchgefühl + Ausrede parat", itemEn: "Your gut + an exit line", why: "Stimmt etwas nicht, darfst du jederzeit höflich gehen – „mañana madrugo“ reicht als Grund.", whyEn: "If something feels off, you can leave politely any time – „I've got an early start“ is reason enough." },
    { icon: "🆔", item: "Doku im Hostel-Locker", itemEn: "Documents in the hostel locker", why: "Pass und Reserve-Karte sicher verstaut; nur das Nötigste mitnehmen.", whyEn: "Passport and a backup card stowed safely; take only what you need." },
  ];

  window.SC = window.SC || {};
  window.SC.flirt = { INTRO, INTRO_EN, TOPICS, PHRASES, GLOSSARY, CHECKLIST };
})();
