/*
 * musica.js  (SC.musica) – Modul „Música: der Soundtrack Lateinamerikas".
 * REINE DATEN, keine Logik (wie salud.js / fotografia.js / historia.js). Lädt vor
 * app.js und hängt sich an window.SC. Wird von ui.renderMusica gerendert.
 *
 * Idee: Musik ist in Lateinamerika überall – im Bus, auf dem Markt, in der
 * Hostel-Bar. Wer die großen Genres und ein paar Künstler kennt, versteht das
 * Land besser und hat sofort Gesprächsstoff. Das Modul erklärt verständlich die
 * wichtigsten Stile (Cumbia, Salsa, Reggaetón, Tango, Mariachi …), nennt je ein
 * paar Künstler zum Reinhören und verlinkt jeden Stil per Deep-Link direkt nach
 * Spotify UND Apple Music. Dazu: der typische Sound deines Reiselands (hängt am
 * gewählten Land der Reise, state.countryId – wie Bebidas), die Sätze, um über
 * Musik zu reden und tanzen zu gehen, und ein Glossar. Durchgehend zweisprachig
 * + spanisches Lesetraining mit antippbaren Vokabeln (wie in der Historia).
 *
 * Deep-Links: Wir speichern pro Eintrag nur eine Suchanfrage `q` (Genre bzw.
 * Künstler). ui.renderMusica baut daraus die robusten Universal-Links
 *   Spotify : https://open.spotify.com/search/<q>
 *   Apple   : https://music.apple.com/search?term=<q>
 * Auf dem Handy öffnen diese Links direkt die jeweilige App (sonst den Browser);
 * weil es Such-Links sind, veralten sie nicht (keine toten Track-/Playlist-IDs).
 *
 * Schemas:
 *   INTRO    : string (+ INTRO_EN) – kurze deutsche Einleitung über der Seite.
 *   GENRES   : [{ icon, name, origin, desc, artists:[…], q, es:[Absatz],
 *               vocab:[{es,de,en,take}], level }] (+ …En) – aufklappbar; es/vocab
 *               speisen das Lesetraining. `q` = Spotify/Apple-Suchanfrage.
 *   COUNTRY  : { <countryId>: { genre, song, artist, q } } (+ …En) – „Sound deines
 *               Reiselands"; countryId wie in countries.js / bebidas.js.
 *   PHRASES  : [{ id, icon, title, items:[{ es, de, en }] }] (+ titleEn) – nach Thema.
 *   GLOSSARY : [{ es, de, en }] – Schlüsselwörter rund um Musik.
 *
 * Hinweis: Stile und Künstler sind eine reisepraktische Auswahl, keine
 * Musikwissenschaft – Lateinamerika hat unendlich viel mehr zu bieten.
 */
(function () {
  "use strict";

  const INTRO =
    "In Lateinamerika ist Musik überall – im Sammeltaxi, auf dem Markt, in der " +
    "Hostel-Bar und auf jeder Familienfeier. Wer die großen Stile kennt und ein " +
    "paar Künstler nennen kann, versteht das Land besser und hat sofort " +
    "Gesprächsstoff. Hier lernst du die wichtigsten Genres von Cumbia bis " +
    "Reggaetón, hörst per Tipp direkt in Spotify oder Apple Music rein – und " +
    "findest den typischen Sound deines Reiselands.";

  const INTRO_EN =
    "In Latin America music is everywhere – in the shared taxi, at the market, in " +
    "the hostel bar and at every family party. Knowing the big styles and being " +
    "able to name a few artists helps you understand a country and gives you " +
    "instant conversation. Here you'll learn the key genres from cumbia to " +
    "reggaetón, listen straight away in Spotify or Apple Music with one tap – and " +
    "find the signature sound of your destination.";

  // ---------- Die großen Genres (aufklappbar, mit ES-Lesetraining + Deep-Links) ----------
  const GENRES = [
    {
      icon: "lc:music",
      name: "Cumbia",
      origin: "Kolumbien · ganz Lateinamerika",
      originEn: "Colombia · all of Latin America",
      desc: "Der vielleicht lateinamerikanischste Rhythmus überhaupt: An der Karibikküste Kolumbiens entstanden, hat die Cumbia jedes Land erobert und sich überall neu eingefärbt – die mexikanische „cumbia sonidera“ klingt anders als die argentinische „cumbia villera“. Tanzbar, gut gelaunt, läuft auf jeder Feier.",
      descEn: "Maybe the most pan-Latin rhythm of all: born on Colombia's Caribbean coast, cumbia has conquered every country and reinvented itself everywhere – Mexican “cumbia sonidera” sounds different from Argentine “cumbia villera”. Danceable, upbeat, playing at every party.",
      artists: ["Los Ángeles Azules", "Carlos Vives", "Totó la Momposina", "Celso Piña"],
      q: "cumbia",
      es: [
        "La cumbia nació en la costa caribeña de Colombia y hoy se baila en todo el continente. Cada país tiene su propia versión, así que el mismo *ritmo* suena distinto en México, en Perú o en Argentina.",
        "Es una música muy *alegre* y fácil de *bailar*: en cualquier *fiesta* alguien va a poner una cumbia y todos se levantan.",
      ],
      vocab: [
        { es: "ritmo", de: "der Rhythmus", en: "the rhythm", take: true },
        { es: "alegre", de: "fröhlich", en: "cheerful", take: true },
        { es: "bailar", de: "tanzen", en: "to dance", take: true },
        { es: "fiesta", de: "die Feier / Party", en: "the party", take: true },
      ],
      level: "A2",
    },
    {
      icon: "lc:music",
      name: "Salsa",
      origin: "Kuba · Puerto Rico · New York",
      originEn: "Cuba · Puerto Rico · New York",
      desc: "Aus kubanischem Son und Mambo in den Vierteln New Yorks zur Salsa geformt – heißes Bläser-Feuerwerk und der König der Tanzflächen von Cali bis Havanna. In Kolumbiens Cali wird sie besonders schnell und virtuos getanzt.",
      descEn: "Forged from Cuban son and mambo in the barrios of New York – a blazing horn-driven sound and the king of dance floors from Cali to Havana. In Cali, Colombia, it's danced especially fast and virtuosically.",
      artists: ["Héctor Lavoe", "Celia Cruz", "Rubén Blades", "Marc Anthony"],
      q: "salsa",
      es: [
        "La salsa mezcla el *son cubano* con el jazz de Nueva York. Tiene un *ritmo* rápido y muchos instrumentos de viento que llenan la *pista de baile*.",
        "Si no sabes bailar, no te preocupes: pide que alguien te enseñe unos *pasos* básicos y déjate llevar.",
      ],
      vocab: [
        { es: "son cubano", de: "der kubanische Son", en: "Cuban son", take: true },
        { es: "ritmo", de: "der Rhythmus", en: "the rhythm", take: true },
        { es: "pista de baile", de: "die Tanzfläche", en: "the dance floor", take: true },
        { es: "pasos", de: "die (Tanz-)Schritte", en: "the steps", take: true },
      ],
      level: "A2",
    },
    {
      icon: "lc:flame",
      name: "Reggaetón",
      origin: "Puerto Rico · weltweit",
      originEn: "Puerto Rico · worldwide",
      desc: "Der Sound der jungen Generation: aus Puerto Rico und Panama gestartet, heute der meistgehörte Stil im spanischsprachigen Raum und längst weltweit Nummer eins. Der „dembow“-Beat läuft in jedem Club – und bei Bad Bunny füllt er Stadien.",
      descEn: "The sound of the young generation: started in Puerto Rico and Panama, today the most-streamed style in the Spanish-speaking world and long since a global number one. The “dembow” beat plays in every club – and with Bad Bunny it fills stadiums.",
      artists: ["Bad Bunny", "Daddy Yankee", "Ivy Queen", "Don Omar"],
      q: "reggaeton",
      es: [
        "El reggaetón es el género más escuchado entre los *jóvenes*. Su base es el ritmo dembow, que se repite en casi todas las *canciones*.",
        "Vas a oírlo en los buses, en la playa y en cada *discoteca*; muchas de las palabras son *jerga* local, así que es buena práctica para el oído.",
      ],
      vocab: [
        { es: "jóvenes", de: "die jungen Leute", en: "young people", take: true },
        { es: "canciones", de: "die Lieder", en: "the songs", take: true },
        { es: "discoteca", de: "der Club / die Disco", en: "the club", take: true },
        { es: "jerga", de: "der Slang", en: "the slang", take: true },
      ],
      level: "A2",
    },
    {
      icon: "lc:footprints",
      name: "Tango",
      origin: "Argentinien · Uruguay (Río de la Plata)",
      originEn: "Argentina · Uruguay (Río de la Plata)",
      desc: "Melancholisch, elegant und unverkennbar: am Río de la Plata zwischen Buenos Aires und Montevideo geboren. Carlos Gardel machte ihn weltberühmt, Astor Piazzolla brachte ihn in den Konzertsaal. In Buenos Aires kannst du eine „milonga“ (Tango-Abend) besuchen.",
      descEn: "Melancholic, elegant and unmistakable: born on the Río de la Plata between Buenos Aires and Montevideo. Carlos Gardel made it world-famous, Astor Piazzolla brought it to the concert hall. In Buenos Aires you can visit a “milonga” (a tango evening).",
      artists: ["Carlos Gardel", "Astor Piazzolla", "Aníbal Troilo"],
      q: "tango argentino",
      es: [
        "El tango nació hace más de cien años en los *barrios* del puerto, entre Buenos Aires y Montevideo. Es una música *melancólica*, con bandoneón, y también un baile de *pareja* muy elegante.",
        "En Buenos Aires puedes ir a una milonga para ver bailar a la gente; no hace falta saber, mirar ya es un *espectáculo*.",
      ],
      vocab: [
        { es: "barrios", de: "die Stadtviertel", en: "the neighbourhoods", take: true },
        { es: "melancólica", de: "melancholisch / wehmütig", en: "melancholic", take: true },
        { es: "pareja", de: "das Paar", en: "the couple / partner", take: true },
        { es: "espectáculo", de: "die Show / das Schauspiel", en: "the show", take: true },
      ],
      level: "B1",
    },
    {
      icon: "lc:music",
      name: "Mariachi & Ranchera",
      origin: "Mexiko",
      originEn: "Mexico",
      desc: "Trompeten, Geigen und Gitarren in charakteristischen Anzügen – und Lieder über Liebe, Heimat und Herzschmerz, die ganze Tische mitsingen. Die Ranchera ist die mexikanische Gefühlshymne schlechthin; zum Geburtstag spielt man „Las Mañanitas“.",
      descEn: "Trumpets, violins and guitars in their distinctive suits – and songs about love, homeland and heartbreak that whole tables sing along to. The ranchera is Mexico's emotional anthem par excellence; for a birthday people play “Las Mañanitas”.",
      artists: ["Vicente Fernández", "Lila Downs", "Ángela Aguilar", "Javier Solís"],
      q: "mariachi ranchera",
      es: [
        "El mariachi es un grupo con trompetas, violines y guitarras que toca *rancheras*: canciones sobre el amor, la *tierra* y el *corazón* roto.",
        "En los cumpleaños es típico cantar „Las Mañanitas“, y en muchas plazas puedes contratar a un mariachi para una *serenata*.",
      ],
      vocab: [
        { es: "rancheras", de: "Rancheras (mexikanische Lieder)", en: "rancheras (Mexican songs)", take: true },
        { es: "tierra", de: "die Heimat / das Land", en: "the homeland / land", take: true },
        { es: "corazón", de: "das Herz", en: "the heart", take: true },
        { es: "serenata", de: "das Ständchen", en: "the serenade", take: true },
      ],
      level: "B1",
    },
    {
      icon: "lc:guitar",
      name: "Vallenato",
      origin: "Kolumbien (Karibikküste)",
      originEn: "Colombia (Caribbean coast)",
      desc: "Erzählende Lieder rund ums Akkordeon, aus dem Norden Kolumbiens. Vom Marktstand bis ins Stadion: Carlos Vives modernisierte den Stil, Silvestre Dangond füllt heute Arenen. Im Kern stehen Geschichten – das Akkordeon trägt sie.",
      descEn: "Storytelling songs built around the accordion, from northern Colombia. From the market stall to the stadium: Carlos Vives modernised the style, Silvestre Dangond fills arenas today. At its heart are stories – the accordion carries them.",
      artists: ["Carlos Vives", "Diomedes Díaz", "Silvestre Dangond"],
      q: "vallenato",
      es: [
        "El vallenato viene del norte de Colombia y se reconoce enseguida por el *acordeón*. Cada canción *cuenta* una *historia* de amor, de pueblo o de la vida diaria.",
        "Carlos Vives lo hizo famoso en todo el mundo mezclándolo con pop; hoy llena estadios y suena en cada *pueblo* de la costa.",
      ],
      vocab: [
        { es: "acordeón", de: "das Akkordeon", en: "the accordion", take: true },
        { es: "cuenta", de: "erzählt (contar)", en: "tells (contar)", take: true },
        { es: "historia", de: "die Geschichte", en: "the story", take: true },
        { es: "pueblo", de: "das Dorf / die Kleinstadt", en: "the town/village", take: true },
      ],
      level: "B1",
    },
    {
      icon: "lc:palmtree",
      name: "Bachata & Merengue",
      origin: "Dominikanische Republik",
      originEn: "Dominican Republic",
      desc: "Zwei Exportschlager der Karibik: Merengue ist schnell, fröhlich und zum Hüftschwung gemacht; Bachata ist langsamer, romantisch und gerade weltweit ein Riesenhit. Romeo Santos und Juan Luis Guerra haben sie auf die ganz großen Bühnen gebracht.",
      descEn: "Two Caribbean export hits: merengue is fast, joyful and made for swinging hips; bachata is slower, romantic and currently a worldwide smash. Romeo Santos and Juan Luis Guerra brought them to the very biggest stages.",
      artists: ["Juan Luis Guerra", "Romeo Santos", "Aventura", "Prince Royce"],
      q: "bachata merengue",
      es: [
        "El merengue es rápido y muy alegre; la bachata es más *lenta* y *romántica*, perfecta para bailar bien *juntos*.",
        "Las dos vienen de la República Dominicana y hoy se escuchan en todo el mundo; muchas canciones hablan de *amor* y de desamor.",
      ],
      vocab: [
        { es: "lenta", de: "langsam", en: "slow", take: true },
        { es: "romántica", de: "romantisch", en: "romantic", take: true },
        { es: "juntos", de: "zusammen", en: "together", take: true },
        { es: "amor", de: "die Liebe", en: "love", take: true },
      ],
      level: "A2",
    },
    {
      icon: "lc:mountain",
      name: "Folklore andino & Nueva canción",
      origin: "Anden · Chile · Bolivien · Peru",
      originEn: "Andes · Chile · Bolivia · Peru",
      desc: "Panflöten (zampoña), Charango und klare Stimmen: die Musik der Anden. Eng damit verbunden ist die „nueva canción“ – poetische, oft politische Lieder von Violeta Parra und Víctor Jara. „Gracias a la vida“ kennt der ganze Kontinent.",
      descEn: "Panpipes (zampoña), charango and clear voices: the music of the Andes. Closely tied to it is “nueva canción” – poetic, often political songs by Violeta Parra and Víctor Jara. The whole continent knows “Gracias a la vida”.",
      artists: ["Violeta Parra", "Víctor Jara", "Inti-Illimani", "Los Kjarkas"],
      q: "folklore andino nueva cancion",
      es: [
        "En los Andes la música usa instrumentos como la *zampoña* (flauta de pan) y el *charango*. Las canciones hablan de la *montaña*, la gente y la vida del campo.",
        "La „nueva canción“ de Violeta Parra y Víctor Jara añadió *letras* poéticas y sociales; „Gracias a la vida“ es famosa en todo el continente.",
      ],
      vocab: [
        { es: "zampoña", de: "die Panflöte", en: "the panpipes", take: true },
        { es: "charango", de: "der Charango (kleine Andengitarre)", en: "the charango (small Andean guitar)", take: true },
        { es: "montaña", de: "der Berg", en: "the mountain", take: true },
        { es: "letras", de: "die (Lied-)Texte", en: "the lyrics", take: true },
      ],
      level: "B1",
    },
    {
      icon: "lc:guitar",
      name: "Rock en español & Latin Pop",
      origin: "Ganz Lateinamerika",
      originEn: "All of Latin America",
      desc: "Vom argentinischen Rock (Soda Stereo) über mexikanischen Alternative (Café Tacvba) bis zum globalen Latin Pop von Shakira, Juanes und Mon Laferte. Die Lieder, die du im Café und im Radio hörst – gut zum Mitlernen, weil die Texte klar sind.",
      descEn: "From Argentine rock (Soda Stereo) through Mexican alternative (Café Tacvba) to the global Latin pop of Shakira, Juanes and Mon Laferte. The songs you'll hear in cafés and on the radio – great for learning, because the lyrics are clear.",
      artists: ["Soda Stereo", "Café Tacvba", "Shakira", "Mon Laferte"],
      q: "rock en español",
      es: [
        "El rock en español y el pop latino son perfectos para *aprender*, porque la *letra* se entiende bien y se queda en la cabeza.",
        "Busca a artistas como Shakira o Soda Stereo, escucha una y otra vez tu canción *favorita* e intenta cantar el *estribillo*.",
      ],
      vocab: [
        { es: "aprender", de: "lernen", en: "to learn", take: true },
        { es: "letra", de: "der (Lied-)Text", en: "the lyrics", take: true },
        { es: "favorita", de: "Lieblings-", en: "favourite", take: true },
        { es: "estribillo", de: "der Refrain", en: "the chorus", take: true },
      ],
      level: "A2",
    },
  ];

  // ---------- Sound deines Reiselands (countryId wie countries.js / bebidas.js) ----------
  // Pro Land ein typischer Stil + ein bekannter Künstler/Song als Einstieg. `q`
  // speist denselben Spotify-/Apple-Deep-Link wie die Genres.
  const COUNTRY = {
    mexico:      { genre: "Mariachi & Ranchera", genreEn: "Mariachi & ranchera", artist: "Vicente Fernández", song: "Volver, Volver", q: "mariachi vicente fernandez" },
    guatemala:   { genre: "Marimba", genreEn: "Marimba", artist: "Marimba guatemalteca", song: "Luna de Xelajú", q: "marimba guatemalteca" },
    honduras:    { genre: "Punta (Garífuna)", genreEn: "Punta (Garífuna)", artist: "Banda Blanca", song: "Sopa de Caracol", q: "punta hondureña banda blanca" },
    elsalvador:  { genre: "Cumbia salvadoreña", genreEn: "Salvadoran cumbia", artist: "Los Hermanos Flores", song: "El Carbonero", q: "cumbia salvadoreña hermanos flores" },
    nicaragua:   { genre: "Son nica & Palo de Mayo", genreEn: "Son nica & Palo de Mayo", artist: "Carlos Mejía Godoy", song: "Son tus perjúmenes mujer", q: "carlos mejia godoy nicaragua" },
    costarica:   { genre: "Calypso limonense", genreEn: "Limón calypso", artist: "Walter Ferguson", song: "Cabin in the Wata", q: "calypso limonense costa rica" },
    panama:      { genre: "Salsa & Reggae en español", genreEn: "Salsa & Spanish reggae", artist: "Rubén Blades", song: "Pedro Navaja", q: "ruben blades panama" },
    cuba:        { genre: "Son cubano & Salsa", genreEn: "Cuban son & salsa", artist: "Buena Vista Social Club", song: "Chan Chan", q: "son cubano buena vista social club" },
    "republica-dominicana": { genre: "Bachata & Merengue", genreEn: "Bachata & merengue", artist: "Juan Luis Guerra", song: "Bachata Rosa", q: "bachata merengue juan luis guerra" },
    "puerto-rico": { genre: "Reggaetón & Salsa", genreEn: "Reggaetón & salsa", artist: "Bad Bunny", song: "Tití Me Preguntó", q: "reggaeton puerto rico bad bunny" },
    colombia:    { genre: "Cumbia & Vallenato", genreEn: "Cumbia & vallenato", artist: "Carlos Vives", song: "La Tierra del Olvido", q: "vallenato cumbia colombia carlos vives" },
    venezuela:   { genre: "Joropo & Gaita", genreEn: "Joropo & gaita", artist: "Simón Díaz", song: "Caballo Viejo", q: "joropo venezolano simon diaz" },
    ecuador:     { genre: "Pasillo", genreEn: "Pasillo", artist: "Julio Jaramillo", song: "Nuestro Juramento", q: "pasillo ecuatoriano julio jaramillo" },
    peru:        { genre: "Vals criollo & Huayno", genreEn: "Creole waltz & huayno", artist: "Chabuca Granda", song: "La Flor de la Canela", q: "vals criollo peruano chabuca granda" },
    bolivia:     { genre: "Folklore andino & Caporales", genreEn: "Andean folklore & caporales", artist: "Los Kjarkas", song: "Llorando se fue", q: "los kjarkas bolivia folklore andino" },
    chile:       { genre: "Cueca & Nueva canción", genreEn: "Cueca & nueva canción", artist: "Violeta Parra", song: "Gracias a la Vida", q: "cueca chilena violeta parra" },
    argentina:   { genre: "Tango & Folklore", genreEn: "Tango & folklore", artist: "Carlos Gardel", song: "Mi Buenos Aires Querido", q: "tango argentino carlos gardel" },
    uruguay:     { genre: "Candombe & Tango", genreEn: "Candombe & tango", artist: "Jaime Roos", song: "Brindis por Pierrot", q: "candombe uruguayo jaime roos" },
    paraguay:    { genre: "Guarania & Polca", genreEn: "Guarania & polka", artist: "José Asunción Flores", song: "India", q: "guarania paraguaya jose asuncion flores" },
  };

  // ---------- Sätze: über Musik reden, tanzen gehen, auf der Feier ----------
  const PHRASES = [
    {
      id: "mus-talk",
      icon: "lc:megaphone",
      title: "Über Musik reden",
      titleEn: "Talking about music",
      items: [
        { es: "¿Qué música te gusta?", de: "Welche Musik magst du?", en: "What music do you like?" },
        { es: "Me encanta la cumbia.", de: "Ich liebe Cumbia.", en: "I love cumbia." },
        { es: "¿Cómo se llama esta canción?", de: "Wie heißt dieses Lied?", en: "What's this song called?" },
        { es: "¿Quién canta?", de: "Wer singt das?", en: "Who's singing?" },
        { es: "¿Me pasas la lista de reproducción?", de: "Schickst du mir die Playlist?", en: "Can you send me the playlist?" },
        { es: "Esta canción está buenísima.", de: "Dieser Song ist mega.", en: "This song is amazing." },
      ],
    },
    {
      id: "mus-dance",
      icon: "lc:footprints",
      title: "Tanzen gehen & Live-Musik",
      titleEn: "Going dancing & live music",
      items: [
        { es: "¿Vamos a bailar?", de: "Gehen wir tanzen?", en: "Shall we go dancing?" },
        { es: "No sé bailar salsa, ¿me enseñas?", de: "Ich kann keine Salsa, bringst du es mir bei?", en: "I can't dance salsa, will you teach me?" },
        { es: "¿Dónde hay música en vivo?", de: "Wo gibt es Live-Musik?", en: "Where is there live music?" },
        { es: "¿Hay un concierto esta noche?", de: "Gibt es heute Abend ein Konzert?", en: "Is there a concert tonight?" },
        { es: "¿Cuánto cuesta la entrada?", de: "Was kostet der Eintritt?", en: "How much is the ticket?" },
      ],
    },
    {
      id: "mus-party",
      icon: "lc:party-popper",
      title: "Auf der Feier",
      titleEn: "At the party",
      items: [
        { es: "¿Pones algo de reggaetón?", de: "Legst du was Reggaetón auf?", en: "Can you play some reggaetón?" },
        { es: "¡Sube el volumen!", de: "Mach lauter!", en: "Turn it up!" },
        { es: "Esta es mi canción favorita.", de: "Das ist mein Lieblingslied.", en: "This is my favourite song." },
        { es: "¿Bailamos la próxima?", de: "Tanzen wir den nächsten?", en: "Shall we dance the next one?" },
      ],
    },
  ];

  // ---------- Glossar: Schlüsselwörter rund um Musik ----------
  const GLOSSARY = [
    { es: "la canción", de: "das Lied", en: "the song" },
    { es: "el/la cantante", de: "der/die Sänger:in", en: "the singer" },
    { es: "la banda / el grupo", de: "die Band / die Gruppe", en: "the band / group" },
    { es: "la letra", de: "der Liedtext", en: "the lyrics" },
    { es: "el estribillo", de: "der Refrain", en: "the chorus" },
    { es: "el ritmo", de: "der Rhythmus", en: "the rhythm" },
    { es: "el género", de: "das Genre", en: "the genre" },
    { es: "bailar", de: "tanzen", en: "to dance" },
    { es: "cantar", de: "singen", en: "to sing" },
    { es: "el concierto", de: "das Konzert", en: "the concert" },
    { es: "en vivo / en directo", de: "live", en: "live" },
    { es: "la lista de reproducción", de: "die Playlist", en: "the playlist" },
    { es: "el éxito", de: "der Hit", en: "the hit" },
    { es: "la guitarra", de: "die Gitarre", en: "the guitar" },
    { es: "el acordeón", de: "das Akkordeon", en: "the accordion" },
    { es: "la batería", de: "das Schlagzeug", en: "the drums" },
  ];

  window.SC = window.SC || {};
  window.SC.musica = { INTRO, INTRO_EN, GENRES, COUNTRY, PHRASES, GLOSSARY };
})();
