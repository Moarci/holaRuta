/*
 * medellin.js  (SC.medellin) – Inhalt der zwei Medellín-Discover-Info-Module des
 * Locals-Tracks (Paisas lernen Englisch). REINE DATEN, keine Logik.
 *
 * Zwei thematische Module (je 4 der 8 loc-med-Themen):
 *   ciudad – „Descubre Medellín": Comuna 13, Metro & Metrocable, medio ambiente,
 *            nómadas & seguridad (die Stadt, ihre Wandlung, Mobilität, Sicherheit).
 *   paisa  – „Cultura y sabor paisa": cultura paisa, comida paisa, feria & eventos,
 *            Guatapé & El Peñol (Kultur, Essen, Feste, Ausflug).
 *
 * Hier steht NUR das Neue: informative Themen-Texte (intro/…En, dos/donts/tips)
 * und ein Paisa-Glossar. Die „wichtigen Sätze" NICHT hier – die zieht das Feature-
 * Modul (features/medellin.js) LIVE aus den vorhandenen loc-med-Karten (jedes TOPIC
 * trägt dazu `cat` = seine Kategorie-Id). So bleibt es EINE Quelle der Wahrheit.
 *
 * Schema pro TOPIC: { cat, icon, title/titleEn, intro/introEn, dos/dosEn,
 *   donts/dontsEn, tips/tipsEn }. Kein spanisches Lesetraining (es/vocab/level):
 *   die Lernenden sind Spanisch-Muttersprachler. localizeDeep überlagert die …En-
 *   Felder für die englische UI. Eager geladen; im Reise-Track ungenutzt.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};

  // ---------- Modul 1: „Descubre Medellín" (die Stadt) ----------
  var CIUDAD = {
    INTRO: "Medellín, la ciudad de la eterna primavera: de un pasado difícil a un referente mundial de transformación, movilidad e innovación social. Aquí tienes lo esencial para contarla en inglés, con orgullo y con datos.",
    INTRO_EN: "Medellín, the city of eternal spring: from a hard past to a global reference for transformation, mobility and social innovation. Here's the essentials to tell its story in English, with pride and with facts.",
    TOPICS: [
      {
        cat: "comuna13-en", icon: "lc:palette",
        title: "Comuna 13", titleEn: "Comuna 13",
        intro: "La Comuna 13 fue uno de los barrios más golpeados por la violencia y hoy es un símbolo mundial de transformación. Sus escaleras eléctricas al aire libre —las primeras del mundo en un barrio popular, inauguradas en 2011— conectan la ladera, y cada grafiti del Grafitour cuenta una historia real. El hip-hop, el rap y el breakdance son el alma del barrio: los jóvenes cambiaron las balas por el arte.",
        introEn: "Comuna 13 was one of the neighborhoods hardest hit by violence, and today it's a global symbol of transformation. Its outdoor escalators — the first in the world built in a low-income neighborhood, opened in 2011 — connect the hillside, and every graffiti on the Grafitour tells a real story. Hip-hop, rap and breakdancing are the soul of the barrio: the young people traded bullets for art.",
        dos: ["Cuenta la transformación del barrio con orgullo y esperanza.", "Anima a los visitantes a apoyar a los artistas locales comprándoles algo."],
        dosEn: ["Tell the neighborhood's transformation with pride and hope.", "Encourage visitors to support local artists by buying something."],
        donts: ["No romantices la violencia; el foco es el arte y la comunidad.", "Recuerda que aquí vive gente de verdad: pide respeto con las fotos."],
        dontsEn: ["Don't romanticize the violence; the focus is art and community.", "Remember real people live here: ask for respect when taking photos."],
        tips: ["Lleva agua, protector solar y zapatos cómodos: se camina bastante y hay sol fuerte."],
        tipsEn: ["Bring water, sunscreen and comfortable shoes: there's lots of walking and strong sun."],
      },
      {
        cat: "metro-med-en", icon: "lc:cable-car",
        title: "Metro y Metrocable", titleEn: "Metro & Metrocable",
        intro: "El Metro de Medellín es el único de Colombia y un orgullo paisa. Se paga con la tarjeta Cívica y todo está integrado: los transbordos entre las líneas de tren, el Metrocable (los cables que suben a los barrios de ladera) y el Tranvía son gratis. La 'Cultura Metro' es un pacto de limpieza, orden y respeto que la ciudad cuida con cariño.",
        introEn: "The Medellín Metro is the only one in Colombia and a source of paisa pride. You pay with the Cívica card and everything is integrated: transfers between the train lines, the Metrocable (the gondolas up to the hillside neighborhoods) and the Tram are free. 'Cultura Metro' is a pact of cleanliness, order and respect the city treasures.",
        dos: ["Explica cómo comprar y recargar la Cívica y dónde hacer transbordo.", "Recomienda el Metrocable por la vista y para llegar a la Comuna 13 (Línea J)."],
        dosEn: ["Explain how to buy and top up the Cívica card and where to transfer.", "Recommend the Metrocable for the view and to reach Comuna 13 (Line J)."],
        tips: ["Recuérdales la 'Cultura Metro': hacer fila, ceder el asiento y no comer ni beber a bordo."],
        tipsEn: ["Remind them of 'Cultura Metro': queue, give up your seat, and don't eat or drink on board."],
      },
      {
        cat: "ambiente-med-en", icon: "lc:trees",
        title: "Medio ambiente", titleEn: "Environment",
        intro: "Medellín se ha reinventado en verde. Los Corredores Verdes —franjas de árboles y plantas a lo largo de avenidas y quebradas— bajaron la temperatura de la ciudad unos dos grados y dieron aire más limpio. El agua de la llave es potable (rellena tu botella), el Metro es eléctrico, hay bicis públicas (EnCicla) y el 'pico y placa' reduce el tráfico y la contaminación.",
        introEn: "Medellín has reinvented itself in green. The Green Corridors — strips of trees and plants along avenues and streams — lowered the city's temperature by about two degrees and gave cleaner air. Tap water is safe (refill your bottle), the Metro is electric, there are public bikes (EnCicla), and 'pico y placa' cuts traffic and pollution.",
        dos: ["Invita a rellenar la botella con agua de la llave en vez de comprar plástico.", "Recomienda el Jardín Botánico y el Parque Arví como pulmones verdes."],
        dosEn: ["Invite them to refill their bottle with tap water instead of buying plastic.", "Recommend the Botanical Garden and Parque Arví as the city's green lungs."],
        tips: ["En temporada seca la calidad del aire puede bajar: menciona las alertas y el 'pico y placa'."],
        tipsEn: ["In the dry season air quality can drop: mention the alerts and 'pico y placa'."],
      },
      {
        cat: "nomadas-en", icon: "lc:map-pin",
        title: "Nómadas y seguridad", titleEn: "Nomads & safety",
        intro: "Medellín es un imán para nómadas digitales: clima primaveral todo el año, cafés y vida nocturna en El Poblado y Provenza, barrios más tranquilos como Laureles o Envigado, y coworkings con buen internet. La regla de oro de seguridad es 'no dar papaya': no mostrar cosas de valor, guardar el celular y, de noche, pedir un Uber, DiDi o Cabify en vez de caminar.",
        introEn: "Medellín is a magnet for digital nomads: spring-like weather all year, cafes and nightlife in El Poblado and Provenza, calmer neighborhoods like Laureles or Envigado, and coworking spaces with good internet. The golden safety rule is 'no dar papaya': don't flaunt valuables, keep your phone away, and at night order an Uber, DiDi or Cabify instead of walking.",
        dos: ["Sugiere el barrio según el plan: Provenza para salir, Laureles para caminar tranquilo.", "Explica 'no dar papaya' con cariño, como un consejo local, no como un susto."],
        dosEn: ["Suggest the neighborhood by plan: Provenza to go out, Laureles for a calm walk.", "Explain 'no dar papaya' warmly, as local advice, not as a scare."],
        tips: ["Lleva sombrilla: por la tarde suele llover. Y saca plata en cajeros dentro de centros comerciales o bancos."],
        tipsEn: ["Carry an umbrella: it usually rains in the afternoon. And withdraw cash at ATMs inside malls or banks."],
      },
    ],
    GLOSSARY: [
      { es: "Cívica", de: "the rechargeable card to ride the whole Metro system" },
      { es: "Metrocable", de: "the cable-car gondolas that climb to the hillside neighborhoods" },
      { es: "Cultura Metro", de: "the unwritten pact of cleanliness, order and respect on the Metro" },
      { es: "Corredores Verdes", de: "the Green Corridors of trees that cooled and cleaned the city" },
      { es: "pico y placa", de: "a driving restriction by plate number to cut traffic and pollution" },
      { es: "EPM", de: "the public utility providing water and clean hydropower energy" },
      { es: "no dar papaya", de: "\"don't give papaya\": don't flaunt valuables / don't make yourself a target" },
    ],
  };

  // ---------- Modul 2: „Cultura y sabor paisa" (Kultur & Region) ----------
  var PAISA = {
    INTRO: "Lo paisa se vive en la mesa, en la calle y en la fiesta: calidez, buena comida y tradiciones que valen oro. Aquí tienes lo esencial para compartirlo en inglés con quien te visita.",
    INTRO_EN: "Being paisa is lived at the table, on the street and at the festival: warmth, great food and traditions worth their weight in gold. Here's the essentials to share it in English with your visitors.",
    TOPICS: [
      {
        cat: "paisa-en", icon: "lc:heart",
        title: "Cultura paisa", titleEn: "Paisa culture",
        intro: "El paisa es cálido, hospitalario y berraco (trabajador y echado pa'lante). Hablamos con parlache: 'parce' es amigo, '¡qué nota!' o 'bacano' es genial, y 'hágale' o 'de una' es un sí con energía. Tomamos 'tinto' (café negro pequeño) a toda hora y disfrutamos la 'sobremesa', esa charla larga en la mesa después de comer. Todo viene de los arrieros, nuestros antepasados muleros de la montaña.",
        introEn: "Paisas are warm, hospitable and 'berraco' (hard-working and go-getting). We speak 'parlache' slang: 'parce' means friend, 'qué nota' or 'bacano' means great, and 'hágale' or 'de una' is an energetic yes. We drink 'tinto' (small black coffee) all day and love the 'sobremesa', the long chat at the table after eating. It all comes from the 'arrieros', our muleteer ancestors from the mountains.",
        dos: ["Enseña un par de expresiones paisas y su significado; a los turistas les encanta.", "Explica que 'mi amor' o 'mijo' son puro cariño, no confianza excesiva."],
        dosEn: ["Teach a couple of paisa expressions and their meaning; tourists love it.", "Explain that 'mi amor' or 'mijo' are pure warmth, not over-familiarity."],
        tips: ["Aclara que el slang fuerte (p. ej. '¡qué chimba!') es para amigos, no para toda ocasión."],
        tipsEn: ["Clarify that strong slang (e.g. 'qué chimba') is for friends, not every occasion."],
      },
      {
        cat: "comida-paisa-en", icon: "lc:utensils",
        title: "Comida paisa", titleEn: "Paisa food",
        intro: "El plato insignia es la bandeja paisa: frijoles, arroz, carne molida, chicharrón, huevo frito, chorizo, plátano maduro, aguacate y arepa, todo en un solo plato enorme. La arepa paisa es delgada, sin relleno. Prueba también el sancocho, el mondongo, los buñuelos y la mazamorra. La comida paisa no es picante: el ají va aparte, para que cada quien lo dosifique.",
        introEn: "The flagship dish is the bandeja paisa: beans, rice, ground beef, crispy pork belly, a fried egg, chorizo, sweet plantain, avocado and an arepa — all on one huge plate. The paisa arepa is thin and plain, with no filling. Try also sancocho, mondongo, buñuelos and mazamorra. Paisa food isn't spicy: the ají comes on the side, so everyone adds their own.",
        dos: ["Recomienda la bandeja paisa a quien venga con mucha hambre (¡es enorme!).", "Pregunta por restricciones o alergias antes de sugerir un plato."],
        dosEn: ["Recommend the bandeja paisa to anyone really hungry (it's huge!).", "Ask about restrictions or allergies before suggesting a dish."],
        tips: ["Ofrece un jugo natural (lulo, maracuyá, mango) y un tinto para acompañar."],
        tipsEn: ["Offer a fresh fruit juice (lulo, passion fruit, mango) and a tinto alongside."],
      },
      {
        cat: "eventos-med-en", icon: "lc:party-popper",
        title: "Feria y eventos", titleEn: "Festivals & events",
        intro: "La fiesta mayor es la Feria de las Flores, en agosto: diez días de flores, música y desfiles. El corazón es el Desfile de Silleteros, donde los campesinos de Santa Elena cargan a la espalda enormes 'silletas' de flores, una tradición de generaciones. En diciembre brillan los Alumbrados sobre el río y el Día de las Velitas (7 de diciembre) abre la Navidad. En julio, Colombiamoda viste la ciudad de moda.",
        introEn: "The main event is the Feria de las Flores (Flower Festival) in August: ten days of flowers, music and parades. Its heart is the Desfile de Silleteros, where farmers from Santa Elena carry huge flower 'silletas' on their backs, a tradition spanning generations. In December the Alumbrados light up the river and the Day of the Little Candles (December 7th) opens Christmas. In July, Colombiamoda dresses the city in fashion.",
        dos: ["Recomienda reservar hotel con anticipación: en la Feria la ciudad se llena.", "Sugiere subir a Santa Elena a ver cómo se cultivan las flores y se arman las silletas."],
        dosEn: ["Recommend booking a hotel well ahead: the city fills up during the Feria.", "Suggest going up to Santa Elena to see how flowers are grown and silletas are built."],
        tips: ["Para el desfile: llega temprano por un buen lugar; es gratis y muy familiar."],
        tipsEn: ["For the parade: arrive early for a good spot; it's free and very family-friendly."],
      },
      {
        cat: "guatape-en", icon: "lc:mountain",
        title: "Guatapé y El Peñol", titleEn: "Guatapé & El Peñol",
        intro: "A unas dos horas de Medellín está Guatapé, el mejor paseo de un día. La Piedra del Peñol es un monolito gigante de unos 200 metros: se sube por una escalera de unos 740 escalones metida en la grieta, y arriba espera una vista increíble del embalse lleno de islas. El pueblo de Guatapé es famoso por sus 'zócalos' de colores, y un paseo en lancha completa el plan.",
        introEn: "About two hours from Medellín lies Guatapé, the best day trip. La Piedra del Peñol is a giant 200-meter monolith: you climb it on a staircase of about 740 steps set into the crack, and at the top an incredible view of the island-filled reservoir awaits. The town of Guatapé is famous for its colorful 'zócalos', and a boat tour rounds out the plan.",
        dos: ["Avisa lo del clima y el esfuerzo: zapatos cómodos, agua y protector solar.", "Cuenta que el embalse inundó el viejo Peñol (bajo el agua quedaron sus ruinas)."],
        dosEn: ["Warn about the climate and effort: comfortable shoes, water and sunscreen.", "Tell them the reservoir flooded old El Peñol (its ruins lie beneath the water)."],
        tips: ["Sube la escalera a tu propio ritmo, sin prisa. Hay que pagar una entrada para la piedra."],
        tipsEn: ["Climb the staircase at your own pace, no rush. There's an admission fee for the rock."],
      },
    ],
    GLOSSARY: [
      { es: "parce / parcero", de: "buddy, friend — the classic paisa way to address someone" },
      { es: "tinto", de: "a small black coffee (no milk), drunk all day long" },
      { es: "sobremesa", de: "the relaxed after-meal chat, still sitting at the table" },
      { es: "berraquera", de: "grit and drive; a 'berraco' is a tough, determined person" },
      { es: "bandeja paisa", de: "the huge traditional platter with beans, rice, pork and more" },
      { es: "silletas / silleteros", de: "the flower arrangements and the farmers who carry them in the parade" },
      { es: "zócalos", de: "the painted relief panels along the lower walls of Guatapé's houses" },
      { es: "La Piedra del Peñol", de: "the giant monolith near Guatapé you climb by ~740 steps" },
    ],
  };

  window.SC.medellin = { ciudad: CIUDAD, paisa: PAISA };
})();
