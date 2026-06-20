/*
 * bailar.js  (SC.bailar) – Modul "Bailar": Tanzen in Lateinamerika.
 * REINE DATEN, keine Logik (wie fotografia.js / salud.js / logistica.js). Lädt vor
 * app.js und hängt sich an window.SC. Wird von ui.renderBailar gerendert.
 *
 * Idee: In Lateinamerika ist Tanzen kein Hobby, sondern Alltag und Sprache. Dieses
 * Modul erklärt die wichtigsten Tänze (Salsa, Bachata, Merengue, Cumbia,
 * Cha-cha-chá, Tango, Reggaetón) – jeweils mit einem stilisierten Schritt-Diagramm
 * am Boden (animierte Fußabdrücke, die der Reihenfolge des Grundschritts folgen),
 * dem Zählrhythmus, Tipps & typischen Fehlern, einem kleinen spanischen Lesetraining
 * und Verlinkungen zu Tutorial-Videos. Dazu die Sätze, um jemanden zum Tanzen
 * aufzufordern, ein Tanz-Knigge und ein Glossar. Durchgehend zweisprachig.
 *
 * Schemas:
 *   INTRO    : string (+ INTRO_EN) – kurze deutsche Einleitung über der Seite.
 *   DANCES   : [{ id, name, icon, accent, origin, level, compas, intro, count,
 *               view:{w,h}, steps:[{beat, foot:"L"|"R", x, y, rot?, tap?}],
 *               dos:[…], donts:[…], es:[Absatz], vocab:[{es,de,en,take}],
 *               videos:[{title, url, source}] }] (+ …En) – aufklappbare Tanz-Karten.
 *   PHRASES  : [{ id, icon, title, items:[{ es, de, en }] }] – nach Situation gruppiert.
 *   GLOSSARY : [{ es, de, en }] – Schlüsselwörter rund ums Tanzen.
 *   CHECKLIST: [{ icon, item, why }] – Tanz-Knigge / Pista-Etikette (+ …En).
 *
 * Schritt-Koordinaten (steps): Ursprung links oben, Diagramm-viewBox = view (Default
 * 200×260). x wächst nach rechts, y nach unten (kleines y = nach vorne/oben getanzt,
 * großes y = nach hinten). foot "L"=linker, "R"=rechter Fuß. rot = leichte Drehung
 * (Grad) für ein natürliches Bild. tap:true = Fuß tippt nur auf (kein Gewicht) und
 * wird hohl gezeichnet. beat = die angezeigte Zählzahl ("1","&","4" …). Die Reihen-
 * folge im Array IST die Tanzreihenfolge – die Animation läuft sie als Welle ab.
 *
 * Hinweis: Grundschritte und Zählweisen sind die gängige, vereinfachte Reise-
 * Variante zum Mitmachen – kein Wettbewerbsstandard. Stile und Zählungen variieren
 * je nach Region, Schule und Lied.
 */
(function () {
  "use strict";

  const INTRO =
    "In Lateinamerika ist Tanzen kein Hobby für Mutige, sondern Alltag und eine " +
    "eigene Sprache: auf jeder Fiesta, jeder Hochzeit, jedem Stadtfest wird " +
    "getanzt – und niemand erwartet Perfektion, nur dass du mitmachst. Hier lernst " +
    "du die wichtigsten Tänze mit ihrem Grundschritt: ein stilisiertes " +
    "Schritt-Diagramm zeigt dir die Fußabdrücke am Boden, die der Reihe nach " +
    "aufleuchten, dazu der Zählrhythmus, kleine Tipps und Links zu Tutorial-Videos. " +
    "Und natürlich die Sätze, um jemanden zum Tanzen aufzufordern – charmant und " +
    "ohne ins Fettnäpfchen zu treten.";

  const INTRO_EN =
    "In Latin America dancing isn't a hobby for the brave – it's everyday life and " +
    "a language of its own: every party, wedding and street fiesta is danced, and " +
    "nobody expects perfection, only that you join in. Here you'll learn the most " +
    "important dances with their basic step: a stylised step diagram shows the " +
    "footprints on the floor lighting up in sequence, plus the counting rhythm, " +
    "small tips and links to tutorial videos. And of course the phrases to ask " +
    "someone to dance – charmingly and without putting your foot in it.";

  // ---------- Die Tänze: Grundschritt-Diagramm, Rhythmus, Tipps, Video-Links ----------
  const DANCES = [
    {
      id: "salsa",
      name: "Salsa",
      icon: "🌶️",
      accent: "#C0392B",
      origin: "Kuba, Puerto Rico & Cali (Kolumbien) · überall in LatAm",
      originEn: "Cuba, Puerto Rico & Cali (Colombia) · all over Latin America",
      level: "A2",
      compas: "4/4 – acht Schläge; du trittst auf 1-2-3 und 5-6-7, auf 4 und 8 ist Pause.",
      compasEn: "4/4 – eight beats; you step on 1-2-3 and 5-6-7, with a pause on 4 and 8.",
      count: "1 · 2 · 3 · (4) · 5 · 6 · 7 · (8)",
      intro: "Der König der Tanzflächen. Der Grundschritt „adelante–atrás“ (vor–zurück) ist ein Schritt vor, Gewicht zurück, schließen – und dann dasselbe nach hinten. Wichtiger als die Füße ist, dass du den Beat auf der „1“ findest.",
      introEn: "The king of the dance floor. The basic step „adelante–atrás“ (forward–back) is a step forward, weight back, close – then the same going back. More important than your feet is finding the beat on the „1“.",
      steps: [
        { beat: "1", foot: "L", x: 74, y: 84, rot: -4 },
        { beat: "2", foot: "R", x: 124, y: 150, rot: 5 },
        { beat: "3", foot: "L", x: 80, y: 150, rot: -4 },
        { beat: "5", foot: "R", x: 126, y: 214, rot: 6 },
        { beat: "6", foot: "L", x: 76, y: 150, rot: -5 },
        { beat: "7", foot: "R", x: 122, y: 148, rot: 5 },
      ],
      dos: [
        "Finde zuerst die „1“: das ist der erste, betonte Schlag der Phrase – nicke ein paar Takte mit, bevor du losgehst.",
        "Kleine Schritte, Gewicht klar verlagern – Salsa lebt vom sauberen Gewichtswechsel, nicht von großen Schritten.",
        "Oberkörper ruhig, Knie leicht weich, Schritte aus den Füßen – die Hüfte folgt von allein.",
        "Auf 4 und 8 kurz „halten“ statt zu hetzen – die Pause gibt dem Schritt seinen Groove.",
      ],
      dosEn: [
        "Find the „1“ first: it's the first, accented beat of the phrase – nod along for a few bars before you start.",
        "Small steps, transfer your weight clearly – salsa lives on a clean weight change, not big steps.",
        "Upper body calm, knees softly bent, steps from the feet – the hips follow on their own.",
        "On 4 and 8 hold briefly instead of rushing – the pause gives the step its groove.",
      ],
      donts: [
        "Nicht auf die Füße starren – Kopf hoch, sonst verlierst du den Beat und deine Partnerin.",
        "Nicht hüpfen: Salsa gleitet, der Kopf bleibt auf gleicher Höhe.",
        "Nicht schneller werden, wenn du nervös wirst – lieber zum Beat zurückfinden.",
      ],
      dontsEn: [
        "Don't stare at your feet – head up, or you'll lose the beat and your partner.",
        "Don't bounce: salsa glides, your head stays at the same height.",
        "Don't speed up when you get nervous – find your way back to the beat instead.",
      ],
      es: [
        "La salsa se baila en *ocho* tiempos, pero solo das pasos en seis: uno-dos-tres y cinco-seis-siete. En el *cuatro* y el *ocho* haces una pequeña *pausa*.",
        "Lo más importante es encontrar el *ritmo* y empezar en el „uno“. Da pasos pequeños y cambia bien el *peso* de un pie al otro; la *cadera* se mueve sola.",
        "No mires los pies: levanta la cabeza, relaja los hombros y *disfruta*. Si te pierdes, espera al „uno“ y vuelve a entrar.",
      ],
      vocab: [
        { es: "ocho", de: "acht", en: "eight", take: false },
        { es: "cuatro", de: "vier", en: "four", take: false },
        { es: "pausa", de: "die Pause", en: "the pause", take: true },
        { es: "ritmo", de: "der Rhythmus", en: "the rhythm", take: true },
        { es: "peso", de: "das Gewicht", en: "the weight", take: true },
        { es: "cadera", de: "die Hüfte", en: "the hip", take: true },
        { es: "disfruta", de: "genieße (disfrutar)", en: "enjoy (disfrutar)", take: true },
      ],
      videos: [
        { title: "Salsa-Grundschritt – Tutorial (Anfänger)", url: "https://www.youtube.com/results?search_query=salsa+paso+basico+tutorial+principiantes", source: "YouTube" },
        { title: "Salsa zum Üben – Musik-Mix", url: "https://www.youtube.com/results?search_query=salsa+musica+para+practicar", source: "YouTube" },
      ],
    },
    {
      id: "bachata",
      name: "Bachata",
      icon: "💞",
      accent: "#B53A6E",
      origin: "Dominikanische Republik",
      originEn: "Dominican Republic",
      level: "A1",
      compas: "4/4 – seitlich: drei Schritte, dann ein „Tap“ mit Hüftpop auf 4 und 8.",
      compasEn: "4/4 – sideways: three steps, then a „tap“ with a hip pop on 4 and 8.",
      count: "1 · 2 · 3 · tap · 5 · 6 · 7 · tap",
      intro: "Der einfachste Einstieg – und einer der gefühlvollsten Tänze. Du gehst drei kleine Schritte nach rechts, tippst auf 4 mit der Hüfte an, dann dasselbe nach links. Genau dieses „Tap“ macht den typischen Hüft-Pop.",
      introEn: "The easiest way in – and one of the most soulful dances. You take three small steps to the right, tap on 4 with your hip, then the same to the left. That very „tap“ creates the signature hip pop.",
      steps: [
        { beat: "1", foot: "R", x: 138, y: 122, rot: 6 },
        { beat: "2", foot: "L", x: 104, y: 150, rot: -3 },
        { beat: "3", foot: "R", x: 148, y: 150, rot: 6 },
        { beat: "4", foot: "L", x: 126, y: 150, rot: 0, tap: true },
        { beat: "5", foot: "L", x: 60, y: 178, rot: -6 },
        { beat: "6", foot: "R", x: 96, y: 150, rot: 3 },
        { beat: "7", foot: "L", x: 52, y: 150, rot: -6 },
        { beat: "8", foot: "R", x: 74, y: 150, rot: 0, tap: true },
      ],
      dos: [
        "Klein und nah am Boden bleiben – Bachata ist eng und sanft, keine großen Schritte.",
        "Den „Tap“ auf 4 und 8 betonen: dort kippt die Hüfte zur Seite (der berühmte Pop).",
        "Knie weich halten, damit die Hüfte locker mitschwingen kann.",
        "Augenkontakt und entspannte Schultern – Bachata ist Nähe, nicht Akrobatik.",
      ],
      dosEn: [
        "Stay small and close to the floor – bachata is close and gentle, no big steps.",
        "Emphasise the „tap“ on 4 and 8: that's where the hip tips out (the famous pop).",
        "Keep your knees soft so the hips can swing along freely.",
        "Eye contact and relaxed shoulders – bachata is closeness, not acrobatics.",
      ],
      donts: [
        "Die Hüfte nicht erzwingen – sie kommt vom weichen Knie und Gewichtswechsel von selbst.",
        "Nicht mit steifem Oberkörper tanzen; locker bleiben.",
        "Bei „sensual“-Figuren nichts überstürzen – zuerst der saubere Grundschritt.",
      ],
      dontsEn: [
        "Don't force the hip – it comes naturally from a soft knee and weight change.",
        "Don't dance with a stiff upper body; stay loose.",
        "Don't rush „sensual“ moves – the clean basic step comes first.",
      ],
      es: [
        "La bachata se baila *de lado*: tres pasitos a la derecha y, en el cuatro, un *toque* con la cadera. Después, lo mismo hacia la *izquierda*.",
        "El secreto está en las *rodillas* blandas: así la *cadera* se mueve sola en cada „tap“. Mantén los pasos pequeños y el cuerpo *relajado*.",
        "Es el baile perfecto para empezar porque es lento y *cercano*. Mira a tu pareja, sonríe y déjate llevar por la música.",
      ],
      vocab: [
        { es: "de lado", de: "seitlich", en: "sideways", take: true },
        { es: "toque", de: "der Tipp / Antippen", en: "the tap", take: true },
        { es: "izquierda", de: "links", en: "left", take: true },
        { es: "rodillas", de: "die Knie", en: "the knees", take: true },
        { es: "cadera", de: "die Hüfte", en: "the hip", take: true },
        { es: "relajado", de: "entspannt", en: "relaxed", take: true },
        { es: "cercano", de: "nah, eng", en: "close", take: false },
      ],
      videos: [
        { title: "Bachata-Grundschritt – Tutorial (Anfänger)", url: "https://www.youtube.com/results?search_query=bachata+paso+basico+tutorial+principiantes", source: "YouTube" },
        { title: "Bachata zum Üben – Musik", url: "https://www.youtube.com/results?search_query=bachata+romantica+para+bailar", source: "YouTube" },
      ],
    },
    {
      id: "merengue",
      name: "Merengue",
      icon: "🥁",
      accent: "#C97A1E",
      origin: "Dominikanische Republik",
      originEn: "Dominican Republic",
      level: "A1",
      compas: "2/4 – auf jeden Schlag ein Schritt; die Hüfte pendelt mit jedem Tritt.",
      compasEn: "2/4 – one step on every beat; the hips swing with each step.",
      count: "1 · 2 · 3 · 4 (cada tiempo, un paso)",
      intro: "Der allereinfachste Tanz: marschiere auf der Stelle, ein Schritt pro Schlag – links, rechts, links, rechts. Bei jedem Tritt sinkt die eine Hüfte, die andere hebt sich. So entsteht das typische Hüftpendeln ganz von selbst.",
      introEn: "The simplest dance of all: march on the spot, one step per beat – left, right, left, right. With each step one hip drops and the other lifts. That's how the signature hip swing happens all by itself.",
      steps: [
        { beat: "1", foot: "R", x: 124, y: 108, rot: 7 },
        { beat: "2", foot: "L", x: 76, y: 150, rot: -7 },
        { beat: "3", foot: "R", x: 124, y: 152, rot: 7 },
        { beat: "4", foot: "L", x: 76, y: 196, rot: -7 },
      ],
      dos: [
        "Einfach auf der Stelle marschieren – jeder Schlag ist ein Schritt, mehr nicht.",
        "Beim Belasten eines Beins die Hüfte derselben Seite sinken lassen: das ist der ganze Trick.",
        "Im Paar kleine Drehungen einbauen – mit dem simplen Schritt kannst du dich überall im Kreis bewegen.",
        "Locker bleiben und mit den Schultern zur Musik nicken.",
      ],
      dosEn: [
        "Just march on the spot – every beat is one step, nothing more.",
        "When you load one leg, let the hip on that side drop: that's the whole trick.",
        "As a couple add small turns – with the simple step you can move in a circle anywhere.",
        "Stay loose and nod to the music with your shoulders.",
      ],
      donts: [
        "Nicht zu groß marschieren – kleine Schritte sehen sauberer aus.",
        "Die Hüfte nicht künstlich wackeln; sie kommt vom Beinwechsel.",
        "Nicht verkrampfen – Merengue soll Spaß machen, nicht exakt sein.",
      ],
      dontsEn: [
        "Don't march too big – small steps look cleaner.",
        "Don't wiggle the hips artificially; they come from the leg change.",
        "Don't tense up – merengue is meant to be fun, not exact.",
      ],
      es: [
        "El merengue es el baile más *fácil*: marchas en tu sitio, un paso en cada *tiempo*, izquierda y derecha.",
        "Cuando apoyas un pie, deja caer la *cadera* de ese lado. Así aparece el balanceo, sin pensarlo.",
        "Con este paso tan *sencillo* puedes girar y moverte por toda la *pista*. Relájate y *diviértete*.",
      ],
      vocab: [
        { es: "fácil", de: "leicht, einfach", en: "easy", take: true },
        { es: "tiempo", de: "der Schlag / Takt", en: "the beat", take: true },
        { es: "cadera", de: "die Hüfte", en: "the hip", take: true },
        { es: "sencillo", de: "einfach, schlicht", en: "simple", take: true },
        { es: "pista", de: "die Tanzfläche", en: "the dance floor", take: true },
        { es: "diviértete", de: "hab Spaß (divertirse)", en: "have fun (divertirse)", take: true },
      ],
      videos: [
        { title: "Merengue-Grundschritt – Tutorial", url: "https://www.youtube.com/results?search_query=merengue+paso+basico+tutorial", source: "YouTube" },
        { title: "Merengue zum Üben – Musik", url: "https://www.youtube.com/results?search_query=merengue+clasico+para+bailar", source: "YouTube" },
      ],
    },
    {
      id: "cumbia",
      name: "Cumbia",
      icon: "👒",
      accent: "#2E8B6F",
      origin: "Kolumbien · in ganz LatAm verbreitet (México, Perú, Argentina …)",
      originEn: "Colombia · spread across all of Latin America (Mexico, Peru, Argentina …)",
      level: "A2",
      compas: "4/4 – ein kleiner Schritt zurück, schließen, vor – wie ein sanftes Schreiten im Kreis.",
      compasEn: "4/4 – a small step back, close, forward – like a gentle stride in a circle.",
      count: "1 · 2 · 3 · 4 · 5 · 6 · 7 · 8",
      intro: "Cumbia tanzt man in Paaren im Kreis, mit einem leicht schlurfenden „arrastre“ (Ziehschritt). Ein Fuß tritt zurück, der andere bleibt, dann wieder zusammen – und das Ganze wandert im Kreis. Sehr bodenständig und leicht zu lernen.",
      introEn: "Cumbia is danced in couples moving in a circle, with a slightly shuffling „arrastre“ (drag step). One foot steps back, the other stays, then together again – and the whole thing travels in a circle. Very down-to-earth and easy to learn.",
      steps: [
        { beat: "1", foot: "R", x: 124, y: 202, rot: 7 },
        { beat: "2", foot: "L", x: 78, y: 150, rot: -4 },
        { beat: "3", foot: "R", x: 118, y: 150, rot: 5 },
        { beat: "4", foot: "L", x: 98, y: 150, rot: 0, tap: true },
        { beat: "5", foot: "L", x: 76, y: 202, rot: -7 },
        { beat: "6", foot: "R", x: 122, y: 150, rot: 4 },
        { beat: "7", foot: "L", x: 82, y: 150, rot: -5 },
        { beat: "8", foot: "R", x: 104, y: 150, rot: 0, tap: true },
      ],
      dos: [
        "Den Schritt leicht über den Boden ziehen („arrastrar“) statt ihn anzuheben – das gibt der Cumbia ihren Schlurf.",
        "Als Paar langsam gegen den Uhrzeigersinn im Kreis wandern.",
        "Oberkörper aufrecht, Bewegung kommt aus den Füßen und der Hüfte.",
        "Den Rhythmus der Trommel und der Güira (Schaber) suchen – darauf läuft der Schritt.",
      ],
      dosEn: [
        "Drag the step lightly over the floor („arrastrar“) instead of lifting it – that gives cumbia its shuffle.",
        "As a couple, travel slowly anticlockwise in a circle.",
        "Upper body upright, movement comes from the feet and hips.",
        "Find the rhythm of the drum and the güira (scraper) – the step rides on it.",
      ],
      donts: [
        "Nicht hüpfen oder stampfen – Cumbia gleitet sanft.",
        "Nicht stehen bleiben: der Reiz ist das gemeinsame Wandern im Kreis.",
        "Den Tap auf 4 und 8 nicht vergessen – er gibt dem Schritt seinen Wiegeschwung.",
      ],
      dontsEn: [
        "Don't hop or stomp – cumbia glides gently.",
        "Don't stand still: the charm is travelling together in a circle.",
        "Don't forget the tap on 4 and 8 – it gives the step its rocking swing.",
      ],
      es: [
        "La cumbia se baila en *pareja*, girando en *círculo*, con un paso que se *arrastra* suavemente por el suelo.",
        "Un pie va atrás, el otro se queda, y luego juntas otra vez. En el cuatro haces un pequeño *toque*, y repites hacia el otro lado.",
        "El cuerpo va *derecho* y el movimiento sale de los pies y la *cadera*. Sigue el ritmo del *tambor* y déjate llevar.",
      ],
      vocab: [
        { es: "pareja", de: "das Paar / Tanzpartner(in)", en: "couple / partner", take: true },
        { es: "círculo", de: "der Kreis", en: "the circle", take: true },
        { es: "arrastra", de: "zieht/schleift (arrastrar)", en: "drags (arrastrar)", take: true },
        { es: "toque", de: "der Tipp / Antippen", en: "the tap", take: true },
        { es: "derecho", de: "gerade, aufrecht", en: "straight, upright", take: false },
        { es: "cadera", de: "die Hüfte", en: "the hip", take: true },
        { es: "tambor", de: "die Trommel", en: "the drum", take: true },
      ],
      videos: [
        { title: "Cumbia-Grundschritt – Tutorial", url: "https://www.youtube.com/results?search_query=cumbia+paso+basico+tutorial", source: "YouTube" },
        { title: "Cumbia zum Üben – Musik", url: "https://www.youtube.com/results?search_query=cumbia+para+bailar+clasica", source: "YouTube" },
      ],
    },
    {
      id: "chachacha",
      name: "Cha-cha-chá",
      icon: "✨",
      accent: "#1F8AA8",
      origin: "Kuba",
      originEn: "Cuba",
      level: "B1",
      compas: "4/4 – zwei Schritte, dann drei schnelle: „cha-cha-chá“ auf 4-und-1.",
      compasEn: "4/4 – two steps, then three quick ones: „cha-cha-chá“ on 4-and-1.",
      count: "1 · 2 · 3 · & · 4 · 5 · 6 · 7 · & · 8",
      intro: "Spritziger Cousin der Salsa. Du brichst vor, ersetzt das Gewicht – und dann kommt das berühmte „cha-cha-chá“: drei schnelle Schrittchen am Platz. Genau dieses kleine Trippeln gibt dem Tanz seinen Namen und seinen Pep.",
      introEn: "Salsa's zesty cousin. You break forward, replace your weight – and then comes the famous „cha-cha-chá“: three quick little steps on the spot. That very shuffle gives the dance its name and its pep.",
      steps: [
        { beat: "1", foot: "L", x: 76, y: 88, rot: -4 },
        { beat: "2", foot: "R", x: 124, y: 150, rot: 5 },
        { beat: "3", foot: "L", x: 78, y: 150, rot: -4 },
        { beat: "&", foot: "R", x: 110, y: 150, rot: 3, tap: true },
        { beat: "4", foot: "L", x: 90, y: 150, rot: -3 },
        { beat: "5", foot: "R", x: 124, y: 214, rot: 6 },
        { beat: "6", foot: "L", x: 76, y: 150, rot: -4 },
        { beat: "7", foot: "R", x: 122, y: 150, rot: 5 },
        { beat: "&", foot: "L", x: 90, y: 150, rot: -3, tap: true },
        { beat: "8", foot: "R", x: 110, y: 150, rot: 3 },
      ],
      dos: [
        "Das „cha-cha-chá“ klein und schnell halten: drei winzige Schrittchen auf 4-&-1.",
        "Den Bruchschritt (1/5) klar setzen, dann sofort das Gewicht zurück (2/6).",
        "Knie und Knöchel federn lassen, Oberkörper bleibt aufrecht und ruhig.",
        "Erst langsam zählen „eins, zwei, cha-cha-chá“, dann zur Musik beschleunigen.",
      ],
      dosEn: [
        "Keep the „cha-cha-chá“ small and quick: three tiny steps on 4-&-1.",
        "Place the break step (1/5) clearly, then immediately bring the weight back (2/6).",
        "Let knees and ankles spring, upper body stays upright and calm.",
        "Count slowly at first „one, two, cha-cha-cha“, then speed up to the music.",
      ],
      donts: [
        "Die drei schnellen Schritte nicht zu groß machen – sonst kommst du aus dem Takt.",
        "Nicht vergessen, zwischen den Phrasen das Gewicht sauber zu wechseln.",
        "Nicht versteifen: der Pep kommt aus lockeren Knien.",
      ],
      dontsEn: [
        "Don't make the three quick steps too big – you'll fall out of time.",
        "Don't forget to change weight cleanly between phrases.",
        "Don't stiffen up: the pep comes from loose knees.",
      ],
      es: [
        "El cha-cha-chá es el *primo* alegre de la salsa. Das un paso adelante, cambias el *peso* y luego vienen tres pasitos *rápidos*: cha-cha-chá.",
        "Esos tres pasos van en „cuatro-y-uno“ y son muy *pequeños*. Cuenta despacio „uno, dos, cha-cha-chá“ y después sigue la música.",
        "Mantén las *rodillas* sueltas y el cuerpo *derecho*. El nombre del baile es el mismo sonido de esos tres pasitos.",
      ],
      vocab: [
        { es: "primo", de: "der Cousin", en: "the cousin", take: false },
        { es: "peso", de: "das Gewicht", en: "the weight", take: true },
        { es: "rápidos", de: "schnell", en: "quick", take: true },
        { es: "pequeños", de: "klein", en: "small", take: true },
        { es: "rodillas", de: "die Knie", en: "the knees", take: true },
        { es: "derecho", de: "gerade, aufrecht", en: "upright", take: false },
      ],
      videos: [
        { title: "Cha-cha-chá-Grundschritt – Tutorial", url: "https://www.youtube.com/results?search_query=cha+cha+cha+paso+basico+tutorial", source: "YouTube" },
        { title: "Cha-cha-chá zum Üben – Musik", url: "https://www.youtube.com/results?search_query=cha+cha+cha+cubano+para+bailar", source: "YouTube" },
      ],
    },
    {
      id: "tango",
      name: "Tango",
      icon: "🌹",
      accent: "#7A2E3A",
      origin: "Argentinien & Uruguay (Río de la Plata)",
      originEn: "Argentina & Uruguay (Río de la Plata)",
      level: "B1",
      compas: "4/4 – ruhige „caminata“ (Gehschritte) und der typische Kreuzschritt „la cruz“.",
      compasEn: "4/4 – calm „caminata“ (walking steps) and the signature cross step „la cruz“.",
      count: "lento · lento · lento · lento · la cruz",
      intro: "Eleganz und Spannung. Tango ist im Kern das „caminar“ – ruhiges, geerdetes Gehen im Paar, Brust an Brust. Aus den Gehschritten wächst die berühmte „cruz“, bei der die Folgende die Füße überkreuzt. Langsam, präzise, mit Pausen.",
      introEn: "Elegance and tension. At its core, tango is „caminar“ – calm, grounded walking as a couple, chest to chest. From the walking steps grows the famous „cruz“, where the follower crosses their feet. Slow, precise, with pauses.",
      steps: [
        { beat: "1", foot: "R", x: 124, y: 206, rot: 8 },
        { beat: "2", foot: "L", x: 66, y: 150, rot: -8 },
        { beat: "3", foot: "R", x: 122, y: 116, rot: 6 },
        { beat: "4", foot: "L", x: 82, y: 92, rot: -5 },
        { beat: "5", foot: "R", x: 116, y: 84, rot: 4 },
        { beat: "cruz", foot: "L", x: 100, y: 122, rot: 18 },
      ],
      dos: [
        "Aus der Brust führen/folgen, nicht aus den Armen – der Kontakt im Oberkörper hält das Paar zusammen.",
        "Schritte ruhig und vollständig „durchgehen“: erst ankommen, dann den nächsten setzen.",
        "Knie nah aneinander vorbei, Füße tief am Boden – Tango wirkt geerdet, nicht hüpfend.",
        "Pausen aushalten – im Tango ist Stille zwischen den Schritten Teil des Tanzes.",
      ],
      dosEn: [
        "Lead/follow from the chest, not the arms – upper-body contact holds the couple together.",
        "Walk the steps calmly and fully: arrive first, then place the next.",
        "Knees pass close together, feet low to the floor – tango looks grounded, not bouncy.",
        "Hold the pauses – in tango, the stillness between steps is part of the dance.",
      ],
      donts: [
        "Nicht mit den Armen schieben oder ziehen – die Verbindung kommt aus der Körpermitte.",
        "Nicht hetzen: lieber wenige, klare Schritte mit Spannung als viele hektische.",
        "Den Blick nicht auf den Boden senken – die Achse bleibt aufrecht.",
      ],
      dontsEn: [
        "Don't push or pull with your arms – the connection comes from your core.",
        "Don't rush: a few clear steps with tension beat many frantic ones.",
        "Don't drop your gaze to the floor – keep your axis upright.",
      ],
      es: [
        "El tango es, sobre todo, *caminar*: pasos lentos y *firmes* en pareja, pecho con pecho. La conexión sale del *torso*, no de los brazos.",
        "De la caminata nace „la *cruz“*, cuando se cruzan los pies. Todo es lento y *preciso*, con *pausas* que también son baile.",
        "Mantén el cuerpo *derecho*, las rodillas cerca y los pies bajos. El tango no salta: se desliza con elegancia y tensión.",
      ],
      vocab: [
        { es: "caminar", de: "gehen", en: "to walk", take: true },
        { es: "firmes", de: "fest, sicher", en: "firm", take: false },
        { es: "torso", de: "der Oberkörper", en: "the torso", take: true },
        { es: "cruz", de: "das Kreuz (Kreuzschritt)", en: "the cross (step)", take: true },
        { es: "preciso", de: "präzise", en: "precise", take: true },
        { es: "pausas", de: "die Pausen", en: "the pauses", take: true },
        { es: "derecho", de: "gerade, aufrecht", en: "upright", take: false },
      ],
      videos: [
        { title: "Tango-Caminata & Grundschritt – Tutorial", url: "https://www.youtube.com/results?search_query=tango+argentino+caminata+paso+basico+tutorial", source: "YouTube" },
        { title: "Tango zum Üben – Musik", url: "https://www.youtube.com/results?search_query=tango+argentino+para+bailar+musica", source: "YouTube" },
      ],
    },
    {
      id: "reggaeton",
      name: "Reggaetón (Perreo)",
      icon: "🔥",
      accent: "#5A3FB8",
      origin: "Puerto Rico · Panamá · heute überall im Club",
      originEn: "Puerto Rico · Panama · today everywhere in the club",
      level: "A2",
      compas: "Der „dembow“-Rhythmus: rhythmisches Wiegen, Gewicht von links nach rechts mit Hüft-Rebound.",
      compasEn: "The „dembow“ rhythm: a rhythmic sway, weight from left to right with a hip rebound.",
      count: "boom · ch · boom-chick (dembow)",
      intro: "Der Sound der modernen Fiesta. Reggaetón ist kein strenger Paartanz, sondern freies Wiegen auf dem „dembow“-Beat: Gewicht von einem Bein aufs andere, Knie locker, Hüfte schwingt mit. Such den stampfenden Beat – der Rest ist Lockerheit.",
      introEn: "The sound of the modern party. Reggaetón isn't a strict partner dance but a free sway on the „dembow“ beat: weight from one leg to the other, knees loose, hips swinging along. Find the thumping beat – the rest is just letting go.",
      steps: [
        { beat: "1", foot: "R", x: 130, y: 132, rot: 8 },
        { beat: "2", foot: "L", x: 70, y: 168, rot: -8 },
        { beat: "3", foot: "R", x: 130, y: 168, rot: 8 },
        { beat: "4", foot: "L", x: 70, y: 132, rot: -8 },
      ],
      dos: [
        "Den „dembow“-Beat suchen (das stampfende „boom-ch-boom-chick“) und das Gewicht im Takt von Bein zu Bein wiegen.",
        "Knie weich, Hüfte locker – die Bewegung ist eher Bounce als sauberer Schritt.",
        "Schultern und Arme locker mitnehmen, ganz entspannt bleiben.",
        "Klein anfangen: nur Gewicht links/rechts im Takt – Figuren kommen später von selbst.",
      ],
      dosEn: [
        "Find the „dembow“ beat (the thumping „boom-ch-boom-chick“) and rock your weight from leg to leg in time.",
        "Knees soft, hips loose – the movement is more of a bounce than a clean step.",
        "Let shoulders and arms come along loosely, stay totally relaxed.",
        "Start small: just weight left/right in time – moves come later on their own.",
      ],
      donts: [
        "Nicht steif stehen und „richtige“ Schritte suchen – Reggaetón ist freies Wiegen.",
        "Nicht übertreiben: im Club zählt der Groove, nicht die Akrobatik.",
        "Respektiere den Raum und das Gegenüber – Perreo nur mit klarem Einverständnis.",
      ],
      dontsEn: [
        "Don't stand stiff hunting for „correct“ steps – reggaetón is free swaying.",
        "Don't overdo it: in the club the groove matters, not acrobatics.",
        "Respect personal space and your partner – perreo only with clear consent.",
      ],
      es: [
        "El reggaetón no es un baile de pasos *fijos*: es *balanceo* libre sobre el ritmo „dembow“, ese „boom-ch-boom-chick“ que no para.",
        "Pasa el *peso* de una pierna a la otra, con las *rodillas* sueltas y la cadera relajada. Es más *rebote* que paso.",
        "Empieza pequeño y *disfruta*. Y recuerda: el perreo se baila siempre con *respeto* y permiso de la otra persona.",
      ],
      vocab: [
        { es: "fijos", de: "fest, festgelegt", en: "fixed", take: false },
        { es: "balanceo", de: "das Wiegen / Schaukeln", en: "the sway", take: true },
        { es: "peso", de: "das Gewicht", en: "the weight", take: true },
        { es: "rodillas", de: "die Knie", en: "the knees", take: true },
        { es: "rebote", de: "das Federn / der Rebound", en: "the bounce", take: true },
        { es: "disfruta", de: "genieße (disfrutar)", en: "enjoy", take: true },
        { es: "respeto", de: "der Respekt", en: "respect", take: true },
      ],
      videos: [
        { title: "Reggaetón / Perreo – Tutorial (Anfänger)", url: "https://www.youtube.com/results?search_query=reggaeton+perreo+tutorial+principiantes+paso+basico", source: "YouTube" },
        { title: "Reggaetón zum Üben – Musik", url: "https://www.youtube.com/results?search_query=reggaeton+para+bailar+mix", source: "YouTube" },
      ],
    },
  ];

  // ---------- Wichtige Sätze: auffordern, im Club, höflich pausieren ----------
  const PHRASES = [
    {
      id: "invitar",
      icon: "💃",
      title: "Jemanden zum Tanzen auffordern",
      titleEn: "Asking someone to dance",
      items: [
        { es: "¿Quieres bailar?", de: "Möchtest du tanzen?", en: "Do you want to dance?" },
        { es: "¿Bailamos?", de: "Tanzen wir?", en: "Shall we dance?" },
        { es: "¿Me concedes esta pieza?", de: "Schenkst du mir diesen Tanz? (charmant)", en: "May I have this dance? (charming)" },
        { es: "¿Te gusta bailar salsa?", de: "Tanzt du gern Salsa?", en: "Do you like dancing salsa?" },
        { es: "No bailo muy bien, pero lo intento.", de: "Ich tanze nicht so gut, aber ich versuch's.", en: "I don't dance very well, but I'll try." },
        { es: "¿Me enseñas el paso?", de: "Zeigst du mir den Schritt?", en: "Will you show me the step?" },
        { es: "Tú guías, yo te sigo.", de: "Du führst, ich folge dir.", en: "You lead, I'll follow." },
        { es: "¿Puedes ir un poco más despacio?", de: "Kannst du etwas langsamer machen?", en: "Can you go a little slower?" },
      ],
    },
    {
      id: "club",
      icon: "🎉",
      title: "Auf der Fiesta & im Club",
      titleEn: "At the party & in the club",
      items: [
        { es: "¡Vamos a la pista!", de: "Auf die Tanzfläche!", en: "Let's hit the dance floor!" },
        { es: "¡Qué buena música!", de: "Was für gute Musik!", en: "What great music!" },
        { es: "Esta canción me encanta.", de: "Dieses Lied liebe ich.", en: "I love this song." },
        { es: "¿Pedimos algo de tomar?", de: "Bestellen wir etwas zu trinken?", en: "Shall we order something to drink?" },
        { es: "¿Hay que pagar entrada?", de: "Muss man Eintritt zahlen?", en: "Is there a cover charge?" },
        { es: "¿A qué hora cierra?", de: "Wann macht es zu?", en: "What time does it close?" },
        { es: "¿Tocan música en vivo?", de: "Gibt es Live-Musik?", en: "Is there live music?" },
        { es: "¿Dónde hay un buen lugar para bailar?", de: "Wo gibt es einen guten Ort zum Tanzen?", en: "Where's a good place to dance?" },
      ],
    },
    {
      id: "pausa",
      icon: "🙏",
      title: "Höflich ablehnen, Pause & danke",
      titleEn: "Politely declining, a break & thanks",
      items: [
        { es: "Ahora no, gracias.", de: "Jetzt gerade nicht, danke.", en: "Not right now, thanks." },
        { es: "Quizás más tarde.", de: "Vielleicht später.", en: "Maybe later." },
        { es: "Necesito un descanso.", de: "Ich brauche eine Pause.", en: "I need a break." },
        { es: "Voy a tomar agua.", de: "Ich hol mir Wasser.", en: "I'm going to get some water." },
        { es: "Estoy un poco cansado/cansada.", de: "Ich bin etwas müde.", en: "I'm a bit tired." },
        { es: "¡Gracias por el baile!", de: "Danke für den Tanz!", en: "Thanks for the dance!" },
        { es: "Lo pasé muy bien.", de: "Ich hatte eine tolle Zeit.", en: "I had a great time." },
        { es: "¡Bailas muy bien!", de: "Du tanzt richtig gut!", en: "You dance really well!" },
      ],
    },
  ];

  // ---------- Glossar: Schlüsselwörter rund ums Tanzen ----------
  const GLOSSARY = [
    { es: "bailar", de: "tanzen", en: "to dance" },
    { es: "el baile", de: "der Tanz", en: "the dance" },
    { es: "el/la bailarín(a)", de: "der/die Tänzer(in)", en: "the dancer" },
    { es: "la pista (de baile)", de: "die Tanzfläche", en: "the dance floor" },
    { es: "el paso", de: "der Schritt", en: "the step" },
    { es: "el paso básico", de: "der Grundschritt", en: "the basic step" },
    { es: "la vuelta / dar una vuelta", de: "die Drehung / sich drehen", en: "the turn / to turn" },
    { es: "guiar", de: "führen", en: "to lead" },
    { es: "seguir", de: "folgen", en: "to follow" },
    { es: "la pareja", de: "der/die Tanzpartner(in)", en: "the partner" },
    { es: "el ritmo", de: "der Rhythmus", en: "the rhythm" },
    { es: "el compás", de: "der Takt", en: "the bar / time" },
    { es: "la cadera", de: "die Hüfte", en: "the hip" },
    { es: "mover las caderas", de: "die Hüften bewegen", en: "to move the hips" },
    { es: "el toque / tap", de: "der Fußtipp (ohne Gewicht)", en: "the tap (no weight)" },
    { es: "al ritmo / a tiempo", de: "im Takt", en: "in time / on beat" },
    { es: "la canción", de: "das Lied", en: "the song" },
    { es: "la música en vivo", de: "die Live-Musik", en: "live music" },
    { es: "la academia / clase de baile", de: "die Tanzschule / der Tanzkurs", en: "dance school / class" },
    { es: "¡qué rico bailas!", de: "wie schön du tanzt! (Lob)", en: "you dance so well! (praise)" },
  ];

  // ---------- Tanz-Knigge: Etikette auf der Pista (Icon + Sache + Warum) ----------
  const CHECKLIST = [
    { icon: "🤝", item: "Freundlich auffordern", itemEn: "Ask kindly", why: "Augenkontakt, ein Lächeln und eine kurze Frage. Ein „Nein, gracias“ ist völlig okay – nie drängen.", whyEn: "Eye contact, a smile and a short question. A „no, gracias“ is perfectly fine – never push." },
    { icon: "👟", item: "Bequeme Schuhe", itemEn: "Comfortable shoes", why: "Eine glatte Sohle dreht besser; im vollen Club keine offenen Zehen (es wird getreten).", whyEn: "A smooth sole turns better; no open toes in a crowded club (toes get stepped on)." },
    { icon: "🚿", item: "Frisch bleiben", itemEn: "Stay fresh", why: "Eng getanzt zählt Hygiene: Deo, ein Minz-Kaugummi und ein kleines Handtuch für die Stirn.", whyEn: "Dancing close, hygiene matters: deodorant, a mint and a small towel for your forehead." },
    { icon: "🧭", item: "Führen heißt einladen", itemEn: "Leading means inviting", why: "Sanfte, klare Signale statt Schieben. Die Folgende bestimmt das Tempo und die Nähe.", whyEn: "Gentle, clear signals instead of pushing. The follower sets the pace and the closeness." },
    { icon: "💧", item: "Trinken & Pausen", itemEn: "Water & breaks", why: "Zwischendurch Wasser, besonders in Höhe oder Hitze – Tanzen ist Sport.", whyEn: "Water between dances, especially at altitude or in heat – dancing is exercise." },
    { icon: "🙏", item: "Bedanken & begleiten", itemEn: "Thank & escort", why: "Nach dem Lied „¡Gracias!“ sagen und die Person zurück an den Rand begleiten – gehört zum guten Ton.", whyEn: "After the song say „¡Gracias!“ and walk the person back to the edge – it's good manners." },
    { icon: "📵", item: "Handy weg", itemEn: "Phone away", why: "Auf der Pista zählt der Moment – tanzen statt filmen. Frag, bevor du jemanden aufnimmst.", whyEn: "On the dance floor the moment counts – dance, don't film. Ask before recording anyone." },
  ];

  window.SC = window.SC || {};
  window.SC.bailar = { INTRO, INTRO_EN, DANCES, PHRASES, GLOSSARY, CHECKLIST };
})();
