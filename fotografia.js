/*
 * fotografia.js  (SC.fotografia) – Modul "Fotos & Videos: tolle Reisebilder".
 * REINE DATEN, keine Logik (wie salud.js / logistica.js / historia.js). Lädt vor
 * app.js und hängt sich an window.SC. Wird von ui.renderFotos gerendert.
 *
 * Idee: Die schönsten Reiseerinnerungen stecken in Fotos und Videos – aber gute
 * Bilder entstehen nicht zufällig. Das Modul erklärt verständlich, worauf es
 * ankommt: Motiv & Bildaufbau, Kameraeinstellungen, Licht, Posen und Video. Dazu
 * die Sätze, um andere höflich um ein Foto zu bitten oder kurz um Platz – und ein
 * eigener Block zum Teilen (AirDrop, Quick Share und seit 2026 beides zusammen)
 * sowie Apps wie Mymories. Durchgehend zweisprachig + spanisches Lesetraining mit
 * antippbaren Vokabeln (wie in der Historia).
 *
 * Schemas:
 *   INTRO    : string (+ INTRO_EN) – kurze deutsche Einleitung über der Seite.
 *   TOPICS   : [{ icon, title, intro, dos:[…], donts:[…], es:[Absatz], vocab:[{es,de,en,take}],
 *               level }] – aufklappbar; es/vocab speisen das Lesetraining (+ …En).
 *   PHRASES  : [{ id, icon, title, items:[{ es, de, en }] }] – nach Thema gruppiert.
 *   SHARING  : { intro, dos:[…], donts:[…] } (+ …En) – Block "Bilder teilen".
 *   APPS     : [{ name, url, platform, desc, bullets:[…] }] (+ …En) – Foto-Sharing-Apps.
 *   GLOSSARY : [{ es, de, en }] – Schlüsselwörter rund ums Fotografieren.
 *   CHECKLIST: [{ icon, item, why }] – "Foto-Kit" (+ …En).
 *
 * Hinweis: Faustregeln aus der Reisepraxis – keine technische Norm. Geräte und
 * App-Funktionen ändern sich; im Zweifel zählt, was auf deinem Handy steht.
 */
(function () {
  "use strict";

  const INTRO =
    "Die schönsten Erinnerungen stecken in Fotos und Videos – und tolle Bilder " +
    "macht man mit ein paar einfachen Handgriffen, nicht mit der teuersten Kamera. " +
    "Hier lernst du, worauf es ankommt: Motiv und Bildaufbau, die richtigen " +
    "Einstellungen, das beste Licht und natürliche Posen. Dazu die Sätze, um " +
    "andere um ein Foto zu bitten oder kurz um Platz – und am Ende, wie du deine " +
    "Bilder teilst (AirDrop, Quick Share, Apps wie Mymories).";

  const INTRO_EN =
    "Your best memories live in photos and videos – and great shots come from a " +
    "few simple habits, not the most expensive camera. Here you'll learn what " +
    "matters: subject and composition, the right settings, the best light and " +
    "natural poses. Plus the phrases to ask others for a photo or to step aside " +
    "for a moment – and finally, how to share your shots (AirDrop, Quick Share, " +
    "apps like Mymories).";

  // ---------- Erklärung: tolle Reisebilder (aufklappbar, mit ES-Lesetraining) ----------
  const TOPICS = [
    {
      icon: "🎯",
      title: "Motiv & Bildaufbau",
      titleEn: "Subject & composition",
      intro: "Ein gutes Bild hat eine klare Hauptsache und einen aufgeräumten Aufbau. Bevor du auslöst, frag dich kurz: Was ist hier eigentlich das Motiv – und stört irgendwas drumherum?",
      introEn: "A good photo has one clear subject and a tidy composition. Before you press the shutter, ask yourself: what's actually the subject here – and is anything around it getting in the way?",
      dos: [
        "Drittelregel: Schalte das Raster (Gitter) ein und setze das Motiv auf eine Linie oder einen Schnittpunkt – nicht stur in die Mitte.",
        "Tiefe schaffen: etwas in den Vordergrund nehmen (Blumen, eine Mauer, Steine), dann wirkt das Bild räumlich.",
        "Führende Linien nutzen: Straße, Fluss, Geländer oder Mauer, die das Auge ins Bild ziehen.",
        "Natürliche Rahmen suchen: Torbogen, Fenster, überhängende Äste rahmen das Motiv ein.",
        "Den Horizont gerade halten und vorher kurz aufräumen, was am Rand stört.",
        "Auf Augenhöhe des Motivs gehen: bei Kindern und Tieren in die Hocke.",
      ],
      dosEn: [
        "Rule of thirds: switch on the grid and place the subject on a line or intersection – not dead centre.",
        "Create depth: put something in the foreground (flowers, a wall, stones) so the image feels three-dimensional.",
        "Use leading lines: a road, river, railing or wall that pulls the eye into the frame.",
        "Look for natural frames: an archway, window or overhanging branches frame the subject.",
        "Keep the horizon level and quickly clear away anything distracting at the edges.",
        "Get down to your subject's eye level: crouch for children and animals.",
      ],
      donts: [
        "Nicht alles mittig und winzig mit viel leerem Himmel drumherum.",
        "Nicht zu viel ins Bild quetschen – ein Motiv reicht meist.",
        "Keinen schiefen Horizont stehen lassen.",
        "Keine Laternenmasten oder Äste „aus dem Kopf wachsen“ lassen – einen Schritt zur Seite.",
      ],
      dontsEn: [
        "Don't put everything centred and tiny with lots of empty sky around it.",
        "Don't cram too much into the frame – one subject is usually enough.",
        "Don't leave a crooked horizon.",
        "Don't let lampposts or branches „grow out of someone's head“ – take a step to the side.",
      ],
      es: [
        "Antes de tomar la foto, pregúntate qué es el *motivo* y mira si hay algo que *estorba* alrededor. Una buena foto tiene una sola cosa principal y un *fondo* limpio.",
        "Activa la *cuadrícula* en la cámara y coloca el motivo sobre una línea, no siempre en el centro. Busca líneas que guíen la mirada —una calle, un río, una *baranda*— y pon algo en *primer plano* para dar profundidad.",
        "Mantén el *horizonte* derecho y, si puedes, agáchate para ponerte a la altura de los niños o los animales. A veces, dar un paso a un lado cambia toda la foto.",
      ],
      vocab: [
        { es: "motivo", de: "das Motiv", en: "the subject", take: true },
        { es: "estorba", de: "stört (estorbar)", en: "gets in the way (estorbar)", take: true },
        { es: "fondo", de: "der Hintergrund", en: "the background", take: true },
        { es: "cuadrícula", de: "das Raster, Gitter", en: "the grid", take: true },
        { es: "baranda", de: "das Geländer", en: "the railing", take: false },
        { es: "primer plano", de: "der Vordergrund", en: "the foreground", take: true },
        { es: "horizonte", de: "der Horizont", en: "the horizon", take: true },
      ],
      level: "A2",
    },
    {
      icon: "⚙️",
      title: "Kameraeinstellungen",
      titleEn: "Camera settings",
      intro: "Du brauchst keine teure Kamera – aber ein paar Einstellungen am Handy machen sofort einen Unterschied. Das Meiste stellst du einmal ein und vergisst es dann.",
      introEn: "You don't need an expensive camera – but a few phone settings make an instant difference. Most of it you set once and then forget.",
      dos: [
        "Raster/Gitter dauerhaft einschalten – hilft beim geraden Ausrichten und bei der Drittelregel.",
        "HDR aktivieren: holt bei hohem Kontrast (heller Himmel, dunkler Schatten) beide Bereiche heraus.",
        "Auf das Motiv tippen, um scharf zu stellen – dann Fokus/Belichtung sperren (lange gedrückt halten).",
        "Helligkeit per Wischen anpassen (Sonne-Symbol), wenn das Bild zu hell oder zu dunkel ist.",
        "Nachtmodus bei wenig Licht – Handy ruhig halten, bis die Aufnahme fertig ist.",
        "Lieber näher hingehen als digital zoomen; die Linse vorher kurz sauber wischen.",
        "Serienbild (Auslöser gedrückt halten) für Bewegung – später das beste Bild wählen.",
      ],
      dosEn: [
        "Keep the grid switched on – it helps with levelling and the rule of thirds.",
        "Turn on HDR: in high contrast (bright sky, dark shadow) it brings out both areas.",
        "Tap the subject to focus – then lock focus/exposure (press and hold).",
        "Adjust brightness by swiping (the sun icon) if the shot is too bright or too dark.",
        "Use night mode in low light – hold the phone steady until the shot finishes.",
        "Step closer rather than using digital zoom; give the lens a quick wipe first.",
        "Burst mode (hold the shutter) for movement – pick the best frame afterwards.",
      ],
      donts: [
        "Nicht digital zoomen – das Bild wird matschig; lieber zu Fuß näher ran.",
        "Nicht mit der schmutzigen, fettigen Linse fotografieren (verwaschene Bilder).",
        "Den Blitz nicht aus der Ferne benutzen – er reicht nur ein, zwei Meter.",
        "Nicht im falschen Seitenverhältnis knipsen, wenn du schon weißt, wofür das Bild ist.",
      ],
      dontsEn: [
        "Don't use digital zoom – the image turns mushy; walk closer instead.",
        "Don't shoot with a dirty, greasy lens (hazy photos).",
        "Don't use the flash from a distance – it only reaches a metre or two.",
        "Don't shoot in the wrong aspect ratio if you already know what the photo is for.",
      ],
      es: [
        "No necesitas una cámara cara: con el *celular* ya puedes hacer fotos muy buenas. Activa la cuadrícula, toca la pantalla para *enfocar* y mantén presionado para *bloquear* el foco y la luz.",
        "Si el cielo está muy claro y la sombra muy oscura, activa el HDR. Cuando hay poca luz, usa el *modo nocturno* y mantén el teléfono quieto. Limpia la *lente* antes de disparar.",
        "Un consejo de oro: no uses el *zoom* digital, mejor acércate caminando. Y para algo en movimiento, mantén el dedo en el *disparador* para hacer muchas fotos seguidas.",
      ],
      vocab: [
        { es: "celular", de: "das Handy", en: "the mobile phone", take: true },
        { es: "enfocar", de: "scharf stellen", en: "to focus", take: true },
        { es: "bloquear", de: "sperren", en: "to lock", take: true },
        { es: "modo nocturno", de: "der Nachtmodus", en: "night mode", take: true },
        { es: "lente", de: "die Linse, das Objektiv", en: "the lens", take: true },
        { es: "zoom", de: "der (digitale) Zoom", en: "the zoom", take: false },
        { es: "disparador", de: "der Auslöser", en: "the shutter", take: true },
      ],
      level: "A2",
    },
    {
      icon: "🌅",
      title: "Licht – der wichtigste Trick",
      titleEn: "Light – the most important trick",
      intro: "Licht macht das Foto, nicht die Kamera. Dieselbe Szene sieht morgens, mittags und abends völlig anders aus. Wer auf das Licht achtet, macht sofort bessere Bilder.",
      introEn: "Light makes the photo, not the camera. The same scene looks completely different in the morning, at noon and in the evening. Pay attention to the light and your photos improve at once.",
      dos: [
        "Goldene Stunde nutzen: kurz nach Sonnenaufgang und kurz vor Sonnenuntergang – weiches, warmes Licht.",
        "Für Porträts weiches Licht suchen: in den Schatten gehen oder an einen hellen, aber nicht prallen Platz.",
        "Sonne seitlich oder hinter dir: dann liegt das Motiv schön im Licht.",
        "Gegenlicht bewusst für Silhouetten und leuchtende Konturen einsetzen.",
        "Blaue Stunde (kurz nach Sonnenuntergang) für Städte und Lichter – sehr stimmungsvoll.",
        "Bei hartem Mittagslicht in den Schatten wechseln – dort sind Gesichter gleichmäßig ausgeleuchtet.",
      ],
      dosEn: [
        "Use the golden hour: just after sunrise and just before sunset – soft, warm light.",
        "For portraits, look for soft light: move into shade or to a bright but not glaring spot.",
        "Sun to the side or behind you: then the subject sits nicely in the light.",
        "Use backlight deliberately for silhouettes and glowing outlines.",
        "Blue hour (just after sunset) for cities and lights – very atmospheric.",
        "In harsh midday light, switch to shade – faces are lit evenly there.",
      ],
      donts: [
        "Kein hartes Mittagslicht für Porträts – es macht harte Schatten und zusammengekniffene Augen.",
        "Nicht gegen die Sonne fotografieren, wenn du keine Silhouette willst (Motiv wird dunkel).",
        "Mischlicht meiden (Neon + Tageslicht) – die Farben werden seltsam.",
        "Nicht mit Blitz gegen die Stimmung des Lichts ankämpfen.",
      ],
      dontsEn: [
        "Don't use harsh midday light for portraits – it creates hard shadows and squinting eyes.",
        "Don't shoot into the sun unless you want a silhouette (the subject goes dark).",
        "Avoid mixed light (neon + daylight) – the colours go strange.",
        "Don't fight the mood of the light with the flash.",
      ],
      es: [
        "La *luz* es lo más importante de una foto, más que la cámara. La mejor luz es la de la *hora dorada*: justo después del amanecer y poco antes del *atardecer*, cuando es suave y cálida.",
        "Para los retratos, busca *sombra* o una luz suave; el sol fuerte del mediodía marca sombras duras en la cara. Pon el sol a un lado o detrás de ti para iluminar bien el motivo.",
        "Si pones el sol *detrás* del motivo, sale una *silueta*. Y después del atardecer llega la „hora azul“, perfecta para fotos de la ciudad con luces.",
      ],
      vocab: [
        { es: "luz", de: "das Licht", en: "the light", take: true },
        { es: "hora dorada", de: "die goldene Stunde", en: "the golden hour", take: true },
        { es: "atardecer", de: "der Sonnenuntergang", en: "the sunset", take: true },
        { es: "sombra", de: "der Schatten", en: "the shadow / shade", take: true },
        { es: "detrás", de: "hinter", en: "behind", take: false },
        { es: "silueta", de: "die Silhouette", en: "the silhouette", take: false },
      ],
      level: "B1",
    },
    {
      icon: "🧍",
      title: "Posen & Menschen fotografieren",
      titleEn: "Poses & photographing people",
      intro: "Vor der Kamera fühlen sich die meisten steif. Mit ein paar kleinen Kniffen wirken Personen sofort lockerer und natürlicher – auf dem Foto sieht man den Unterschied sofort.",
      introEn: "In front of the camera most people feel stiff. With a few small tricks, people instantly look more relaxed and natural – and you can see the difference straight away.",
      dos: [
        "Bewegung reinbringen: gehen, lachen, sich umdrehen, mit den Haaren spielen – nicht erstarrt posieren.",
        "Hände beschäftigen: eine Tasse, den Hut, die Tasche oder die Jacke halten.",
        "Den Blick mal von der Kamera weg richten – wirkt natürlich und erzählt eine kleine Geschichte.",
        "Leicht von schräg oben fotografieren – schmeichelhafter als von unten.",
        "Das Gewicht auf ein Bein verlagern, Schultern leicht drehen – nicht frontal wie beim Passfoto.",
        "Mit der Umgebung interagieren (an die Mauer lehnen, auf die Aussicht schauen) und mehrere Bilder machen.",
        "Genug Abstand für Ganzkörperbilder lassen – Füße nicht abschneiden.",
      ],
      dosEn: [
        "Add movement: walk, laugh, turn around, play with your hair – don't pose frozen.",
        "Keep hands busy: hold a cup, your hat, your bag or jacket.",
        "Sometimes look away from the camera – it feels natural and tells a little story.",
        "Shoot slightly from above – more flattering than from below.",
        "Shift your weight onto one leg, turn the shoulders slightly – not square-on like a passport photo.",
        "Interact with the surroundings (lean on the wall, look at the view) and take several shots.",
        "Leave enough distance for full-body shots – don't cut off the feet.",
      ],
      donts: [
        "Nicht steif und frontal in die Kamera starren wie beim Passbild.",
        "Die Arme nicht stramm an den Körper pressen – das wirkt verkrampft.",
        "Nicht von unten fotografieren (Doppelkinn, Nasenlöcher).",
        "Nicht mit Weitwinkel zu nah ans Gesicht – das verzerrt die Proportionen.",
      ],
      dontsEn: [
        "Don't stare stiffly and square-on into the camera like a passport photo.",
        "Don't press your arms tight against your body – it looks tense.",
        "Don't shoot from below (double chin, nostrils).",
        "Don't get a wide-angle lens too close to a face – it distorts the proportions.",
      ],
      es: [
        "Casi todos se ponen *tiesos* delante de la cámara. El truco es moverse: caminar, *reír*, girarse o jugar con el pelo. Así la *pose* se ve natural.",
        "Dale algo que hacer a las *manos* —una taza, el sombrero, la mochila— y mira a veces hacia otro lado, no siempre a la cámara. Apoya el peso en una pierna y gira un poco los *hombros*.",
        "Fotografía un poquito desde *arriba*, nunca desde abajo, y deja espacio para que salga el cuerpo entero. Haz varias fotos: casi siempre una sale perfecta.",
      ],
      vocab: [
        { es: "tiesos", de: "steif", en: "stiff", take: true },
        { es: "reír", de: "lachen", en: "to laugh", take: true },
        { es: "pose", de: "die Pose", en: "the pose", take: true },
        { es: "manos", de: "die Hände", en: "the hands", take: false },
        { es: "hombros", de: "die Schultern", en: "the shoulders", take: true },
        { es: "arriba", de: "oben", en: "above / up", take: false },
      ],
      level: "B1",
    },
    {
      icon: "🎥",
      title: "Videos drehen",
      titleEn: "Shooting video",
      intro: "Video lebt von ruhiger Hand und kurzen Szenen. Lieber viele kurze, stabile Clips als ein langes Gewackel – beim Schneiden bist du dann froh über jede ruhige Aufnahme.",
      introEn: "Video lives on a steady hand and short scenes. Better many short, stable clips than one long wobble – when editing you'll be grateful for every steady shot.",
      dos: [
        "Handy mit beiden Händen halten und die Ellbogen anlegen – oder an einer Wand/Geländer abstützen.",
        "Langsame, ruhige Schwenks – sanft mit dem ganzen Körper drehen, nicht aus dem Handgelenk.",
        "Kurze Clips drehen (5–10 Sekunden je Szene) statt minutenlang durchlaufen lassen.",
        "Format nach Ziel wählen: quer für YouTube/Fernseher, hochkant für Reels/TikTok/Stories.",
        "Vorher überlegen, was du zeigen willst, und das Motiv ruhig einfangen.",
        "Originalton/Atmosphäre mit aufnehmen – Stimmen, Markt, Wellen geben Stimmung.",
        "Mini-Stativ oder Gorillapod nutzen, wo es geht; auf Akku und Speicher achten.",
      ],
      dosEn: [
        "Hold the phone with both hands and tuck in your elbows – or brace against a wall/railing.",
        "Slow, steady pans – turn gently with your whole body, not from the wrist.",
        "Shoot short clips (5–10 seconds per scene) instead of letting it run for minutes.",
        "Choose the format for its purpose: landscape for YouTube/TV, vertical for Reels/TikTok/Stories.",
        "Think first about what you want to show, then capture the subject calmly.",
        "Record the natural sound/atmosphere too – voices, market, waves set the mood.",
        "Use a mini tripod or Gorillapod where you can; watch the battery and storage.",
      ],
      donts: [
        "Nicht wild schwenken und ständig digital zoomen – das macht schwindelig.",
        "Nicht hochkant für YouTube/Fernseher drehen, wenn es vermeidbar ist.",
        "Nicht laufend filmen ohne Stabilisierung – das Bild wackelt unbrauchbar.",
        "Speicher und Akku nicht vergessen – Video frisst beides schnell.",
      ],
      dontsEn: [
        "Don't pan wildly and constantly use digital zoom – it makes people dizzy.",
        "Don't shoot vertically for YouTube/TV if you can avoid it.",
        "Don't film while walking without stabilisation – the picture wobbles uselessly.",
        "Don't forget storage and battery – video eats both quickly.",
      ],
      es: [
        "Para *grabar* un buen video, sujeta el celular con las dos manos y pega los codos al cuerpo, o apóyate en una *pared*. Mueve la cámara despacio, sin sacudidas.",
        "Graba *clips* cortos, de cinco a diez segundos cada uno, en vez de un video larguísimo. Elige el formato: *horizontal* para YouTube y *vertical* para historias y reels.",
        "Graba también el *sonido* del lugar —las voces, el mar, el mercado— porque le da mucha vida. Y lleva un *trípode* pequeño si puedes.",
      ],
      vocab: [
        { es: "grabar", de: "aufnehmen, filmen", en: "to record/film", take: true },
        { es: "pared", de: "die Wand", en: "the wall", take: true },
        { es: "clips", de: "die Clips", en: "the clips", take: false },
        { es: "horizontal", de: "quer", en: "landscape", take: true },
        { es: "vertical", de: "hochkant", en: "vertical/portrait", take: true },
        { es: "sonido", de: "der Ton, das Geräusch", en: "the sound", take: true },
        { es: "trípode", de: "das Stativ", en: "the tripod", take: false },
      ],
      level: "B1",
    },
  ];

  // ---------- Wichtige Sätze: andere um Fotos bitten / höflich um Platz ----------
  const PHRASES = [
    {
      id: "pedir",
      icon: "📸",
      title: "Jemanden bitten, ein Foto zu machen",
      titleEn: "Asking someone to take a photo",
      items: [
        { es: "¿Me puedes tomar una foto, por favor?", de: "Kannst du ein Foto von mir machen, bitte?", en: "Can you take a photo of me, please?" },
        { es: "¿Nos puedes tomar una foto a los dos?", de: "Kannst du ein Foto von uns beiden machen?", en: "Can you take a photo of the two of us?" },
        { es: "¿Podría sacarnos una foto, por favor?", de: "Könnten Sie ein Foto von uns machen, bitte?", en: "Could you take a photo of us, please?" },
        { es: "Solo tienes que apretar aquí.", de: "Du musst nur hier drücken.", en: "You just have to press here." },
        { es: "¿Puedes tomar otra, por favor?", de: "Kannst du noch eine machen, bitte?", en: "Can you take another one, please?" },
        { es: "Una vertical y una horizontal, por favor.", de: "Eine hochkant und eine quer, bitte.", en: "One vertical and one landscape, please." },
        { es: "¿La puedes tomar desde más lejos?", de: "Kannst du von etwas weiter weg fotografieren? (mehr drauf)", en: "Can you take it from a bit further away?" },
        { es: "Salió movida, ¿la repetimos?", de: "Sie ist verwackelt, machen wir sie nochmal?", en: "It came out blurry, shall we redo it?" },
        { es: "¡Quedó genial, muchas gracias!", de: "Ist super geworden, vielen Dank!", en: "It turned out great, thank you so much!" },
      ],
    },
    {
      id: "paso",
      icon: "🙏",
      title: "Höflich um Platz bitten",
      titleEn: "Politely asking for space",
      items: [
        { es: "Disculpa, ¿te puedes correr un momentito?", de: "Entschuldige, kannst du dich kurz zur Seite stellen?", en: "Excuse me, could you move over for a moment?" },
        { es: "¿Te importaría apartarte un segundo para la foto?", de: "Würde es dir etwas ausmachen, kurz aus dem Bild zu gehen?", en: "Would you mind stepping aside a second for the photo?" },
        { es: "Perdón, ¿puedo pasar para tomar la foto?", de: "Entschuldigung, darf ich kurz durch fürs Foto?", en: "Sorry, may I get through to take the photo?" },
        { es: "¿Nos dejas un momentito para la foto?", de: "Gibst du uns kurz einen Moment fürs Foto?", en: "Could you give us a moment for the photo?" },
        { es: "Es solo un segundo, gracias.", de: "Es ist nur eine Sekunde, danke.", en: "It's just a second, thanks." },
        { es: "Gracias, muy amable.", de: "Danke, sehr nett.", en: "Thank you, very kind." },
      ],
    },
    {
      id: "permiso",
      icon: "🤝",
      title: "Selbst anbieten & um Erlaubnis fragen",
      titleEn: "Offering yourself & asking permission",
      items: [
        { es: "¿Quieres que les tome una foto?", de: "Soll ich ein Foto von euch machen?", en: "Would you like me to take a photo of you (all)?" },
        { es: "¿Te tomo una a ti también?", de: "Mach ich auch eine von dir?", en: "Shall I take one of you too?" },
        { es: "¿Puedo tomarte una foto?", de: "Darf ich ein Foto von dir machen?", en: "May I take a photo of you?" },
        { es: "¿Se pueden tomar fotos aquí?", de: "Darf man hier fotografieren?", en: "Are photos allowed here?" },
        { es: "¿Está bien si grabo un video?", de: "Ist es in Ordnung, wenn ich ein Video mache?", en: "Is it okay if I record a video?" },
        { es: "¿Me la puedes mandar por favor?", de: "Kannst du sie mir bitte schicken?", en: "Can you send it to me, please?" },
        { es: "¿Me etiquetas en la foto?", de: "Markierst du mich auf dem Foto?", en: "Will you tag me in the photo?" },
      ],
    },
  ];

  // ---------- Bilder teilen: AirDrop, Quick Share & Co. ----------
  const SHARING = {
    intro:
      "Du hast tolle Bilder gemacht – jetzt teilen, am besten in voller Qualität (nicht über Chat-Apps, die alles kleinrechnen). Apple-Geräte nutzen dafür AirDrop, Android-Geräte Quick Share. Das Beste: Seit 2026 funktioniert beides zusammen – neuere Android-Handys (z. B. Pixel 9/10, Samsung Galaxy S26 und weitere) teilen jetzt direkt mit iPhones und umgekehrt.",
    introEn:
      "You've taken great shots – now share them, ideally in full quality (not via chat apps that shrink everything). Apple devices use AirDrop, Android devices use Quick Share. The best part: since 2026 the two work together – newer Android phones (e.g. Pixel 9/10, Samsung Galaxy S26 and more) now share directly with iPhones and vice versa.",
    dos: [
      "AirDrop (Apple): im Kontrollzentrum auf „Kontakte“ oder „Jeden für 10 Minuten“ stellen, Foto antippen → Teilen → AirDrop → Gerät auswählen.",
      "Quick Share (Android): Foto öffnen → Teilen → Quick Share → das Gerät in der Nähe auswählen.",
      "iPhone ↔ Android (neu seit 2026): einfach Quick Share bzw. AirDrop nutzen – neuere Geräte erkennen sich gegenseitig; den Empfang auf dem anderen Handy bestätigen.",
      "Immer in Originalauflösung senden, damit nichts komprimiert wird.",
      "Für eine ganze Reisegruppe lieber ein geteiltes Album oder eine App nutzen (siehe unten).",
      "Funktioniert ohne mobiles Internet (über Bluetooth + WLAN direkt zwischen den Geräten).",
    ],
    dosEn: [
      "AirDrop (Apple): in Control Centre set it to „Contacts“ or „Everyone for 10 minutes“, tap the photo → Share → AirDrop → choose the device.",
      "Quick Share (Android): open the photo → Share → Quick Share → pick the nearby device.",
      "iPhone ↔ Android (new since 2026): just use Quick Share or AirDrop – newer devices detect each other; confirm receiving on the other phone.",
      "Always send at original resolution so nothing gets compressed.",
      "For a whole travel group, use a shared album or an app instead (see below).",
      "Works without mobile data (directly between devices over Bluetooth + Wi-Fi).",
    ],
    donts: [
      "AirDrop nicht dauerhaft auf „Jeden“ lassen – nur kurz zum Teilen, dann zurück auf „Kontakte“.",
      "In vollen Bussen/Plätzen keine unbekannten AirDrop-/Quick-Share-Anfragen annehmen.",
      "Nicht standardmäßig über WhatsApp/Telegram senden, wenn die Qualität zählt (die komprimieren stark).",
      "Nicht vergessen, dass beim direkten Teilen beide Geräte nah beieinander und entsperrt sein müssen.",
    ],
    dontsEn: [
      "Don't leave AirDrop on „Everyone“ permanently – only briefly to share, then back to „Contacts“.",
      "On crowded buses/squares, don't accept unknown AirDrop/Quick Share requests.",
      "Don't send via WhatsApp/Telegram by default when quality matters (they compress heavily).",
      "Don't forget that for direct sharing both devices must be close together and unlocked.",
    ],
  };

  // ---------- Foto-Sharing-Apps (Name, Link, Erklärung; Bild = SVG in ui.renderFotos) ----------
  const APPS = [
    {
      id: "mymories",
      name: "Mymories",
      url: "https://mymories.de",
      platform: "iOS & Android · mymories.de",
      desc:
        "Mymories sammelt alle Urlaubs- und Reisefotos einer Gruppe an einem Ort – in voller Qualität, ohne WhatsApp-Chaos und ohne komprimierte Bilder. Du erstellst in Sekunden ein „Event“ für deine Reise, teilst einen Event-Code oder QR-Code, und alle laden ihre Fotos und Videos live hoch. Telefonnummern muss niemand austauschen, und Gäste können sogar per Weblink ohne App-Installation beitragen. Die Basis ist kostenlos.",
      descEn:
        "Mymories collects a group's holiday and travel photos in one place – in full quality, with no WhatsApp chaos and no compressed images. You create an „event“ for your trip in seconds, share an event code or QR code, and everyone uploads their photos and videos live. Nobody needs to swap phone numbers, and guests can even join via a web link without installing the app. The basics are free.",
      bullets: [
        "📷 Alle Fotos in Originalqualität an einem Ort",
        "🔗 Beitreten per Event-Code oder QR-Code – ohne Telefonnummern",
        "🌐 Auch per Weblink ohne App nutzbar (für Gäste)",
        "🆓 Basis kostenlos – iOS & Android",
      ],
      bulletsEn: [
        "📷 All photos in original quality in one place",
        "🔗 Join via event code or QR code – no phone numbers needed",
        "🌐 Usable via web link without the app (for guests)",
        "🆓 Free basics – iOS & Android",
      ],
    },
  ];

  // ---------- Glossar: Schlüsselwörter rund ums Fotografieren ----------
  const GLOSSARY = [
    { es: "la foto / sacar una foto", de: "das Foto / ein Foto machen", en: "the photo / to take a photo" },
    { es: "tomar una foto", de: "ein Foto machen (LatAm)", en: "to take a photo (LatAm)" },
    { es: "grabar un video", de: "ein Video aufnehmen", en: "to record a video" },
    { es: "la cámara", de: "die Kamera", en: "the camera" },
    { es: "la lente", de: "die Linse / das Objektiv", en: "the lens" },
    { es: "el enfoque / enfocar", de: "der Fokus / scharf stellen", en: "focus / to focus" },
    { es: "el flash", de: "der Blitz", en: "the flash" },
    { es: "la luz / la sombra", de: "das Licht / der Schatten", en: "light / shadow" },
    { es: "el fondo", de: "der Hintergrund", en: "the background" },
    { es: "el primer plano", de: "der Vordergrund / die Nahaufnahme", en: "the foreground / close-up" },
    { es: "el encuadre", de: "der Bildausschnitt", en: "the framing" },
    { es: "la pose", de: "die Pose", en: "the pose" },
    { es: "vertical / horizontal", de: "hochkant / quer", en: "vertical / landscape" },
    { es: "la foto salió movida", de: "das Foto ist verwackelt", en: "the photo came out blurry" },
    { es: "compartir", de: "teilen", en: "to share" },
    { es: "¿me la mandas?", de: "schickst du sie mir?", en: "will you send it to me?" },
    { es: "correrse / apartarse", de: "zur Seite gehen", en: "to move aside" },
    { es: "el trípode", de: "das Stativ", en: "the tripod" },
  ];

  // ---------- „Foto-Kit": kleine Packliste (Icon + Sache + Warum) ----------
  const CHECKLIST = [
    { icon: "🧽", item: "Mikrofasertuch", itemEn: "Microfibre cloth", why: "Saubere Linse = scharfe Fotos – die Linse verschmiert in der Hosentasche ständig.", whyEn: "A clean lens = sharp photos – the lens smears constantly in your pocket." },
    { icon: "🔋", item: "Powerbank", itemEn: "Power bank", why: "Fotos und vor allem Video leeren den Akku schnell – unterwegs gibt es selten eine Steckdose.", whyEn: "Photos and especially video drain the battery fast – there's rarely a socket on the road." },
    { icon: "🦾", item: "Mini-Stativ / Gorillapod", itemEn: "Mini tripod / Gorillapod", why: "Für Selfies, Gruppenbilder, Nachtaufnahmen und ruhiges Video.", whyEn: "For selfies, group shots, night shots and steady video." },
    { icon: "📡", item: "Bluetooth-Auslöser", itemEn: "Bluetooth shutter remote", why: "Gruppenfoto ohne Hektik und Langzeitaufnahmen ganz ohne Wackeln.", whyEn: "Group photos without the rush and long exposures with no wobble." },
    { icon: "☁️", item: "Cloud-Backup (Google Fotos/iCloud)", itemEn: "Cloud backup (Google Photos/iCloud)", why: "Bilder sichern, falls das Handy verloren geht – und Speicher freihalten.", whyEn: "Back up your shots in case the phone is lost – and keep storage free." },
    { icon: "💾", item: "Genug Speicher / SD-Karte", itemEn: "Enough storage / SD card", why: "Video frisst Platz – ein volles Handy verpasst genau den schönsten Moment.", whyEn: "Video eats space – a full phone misses exactly the best moment." },
    { icon: "📱", item: "Schutztuch / Zip-Tüte", itemEn: "Protective cloth / zip bag", why: "Staub, Sand und Regen schützen Linse und Handy unterwegs.", whyEn: "Protects the lens and phone from dust, sand and rain on the road." },
  ];

  window.SC = window.SC || {};
  window.SC.fotografia = { INTRO, INTRO_EN, TOPICS, PHRASES, SHARING, APPS, GLOSSARY, CHECKLIST };
})();
