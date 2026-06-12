/*
 * regatear.js  (SC.regatear) – Modul "Regatear: gut verhandeln & feilschen".
 * REINE DATEN, keine Logik (wie knigge.js / frases.js). Lädt vor app.js und
 * hängt sich an window.SC. Wird von ui.renderRegatear gerendert.
 *
 * Idee: auf Märkten in Lateinamerika ist Feilschen (regatear) normal und
 * erwünscht – aber es folgt Spielregeln. Das Modul erklärt erst die Taktik
 * (TIPS), gibt dann die wichtigsten Sätze nach Phasen sortiert (PHRASES) und
 * den Mengen-/Einheiten-Wortschatz (UNITS), und lässt zum Schluss anhand von
 * Rollenspielen (ROLEPLAYS) üben. Durchgängig LatAm-Spanisch.
 *
 * Schemas:
 *   INTRO   : string – kurze deutsche Einleitung über der Seite.
 *   TIPS    : [{ icon, title, intro, dos:[…], donts:[…] }]  – aufklappbar.
 *   UNITS   : [{ es, de, ejemplo }]  – Maß-/Mengeneinheiten am Marktstand.
 *   PHRASES : [{ id, icon, title, items:[{ es, de }] }]  – nach Phase gruppiert.
 *   ROLEPLAYS: [{ id, title, situationDe, roleA, roleB, goalA, goalB,
 *                dialogue:[{ speaker:'A'|'B', es, de }], usefulPhrases:[es…] }]
 *
 * Hinweis: Preise/Bräuche sind Backpacker-Faustregeln, keine festen Regeln –
 * Ton und Gepflogenheiten unterscheiden sich von Land zu Land und von Stand zu
 * Stand. Im Zweifel zählt: freundlich bleiben, lächeln, fair handeln.
 */
(function () {
  "use strict";

  const INTRO =
    "Auf Märkten und bei Straßenständen ist Feilschen (regatear) normal – aber " +
    "freundlich und mit Spielregeln. Erst die Taktik, dann die wichtigsten Sätze, " +
    "dann üben im Rollenspiel.";

  // ---------- Erklärung: wie man gut verhandelt (aufklappbar, Knigge-Stil) ----------
  const TIPS = [
    {
      icon: "🤝",
      title: "Die Grundhaltung",
      intro: "Feilschen ist in Lateinamerika ein freundliches Spiel, kein Streit. Wer lächelt und höflich bleibt, bekommt den besseren Preis.",
      dos: [
        "Zuerst grüßen: „Buenos días“, ein kurzer Smalltalk öffnet jeden Stand.",
        "Mit Humor und Lächeln bleiben – Sympathie senkt den Preis mehr als Härte.",
        "Den Verkäufer mit „amigo/a“, „caballero“, „seño“ oder „jefe/a“ ansprechen.",
        "Realistisch bleiben: ein fairer Rabatt ist das Ziel, nicht der Ruin des Standes.",
      ],
      donts: [
        "Nicht aggressiv oder von oben herab auftreten – das blockiert sofort.",
        "Die Ware nicht schlechtmachen, um den Preis zu drücken; lieber sachlich bleiben.",
        "Nicht in Geschäften mit festen Preisen (Supermarkt, Apotheke) feilschen – dort ist es unüblich.",
      ],
    },
    {
      icon: "🎯",
      title: "Die Verhandlung führen",
      intro: "Der erste genannte Preis ist fast nie der letzte. Frag nach, biete weniger, treffe dich in der Mitte.",
      dos: [
        "Erst nach dem Preis fragen, bevor du Interesse zeigst: „¿A cuánto?“",
        "Den ersten Preis nie sofort annehmen – freundlich stutzen: „Uy, está caro.“",
        "Ein Gegenangebot machen (Anker): biete etwa die Hälfte bis zwei Drittel.",
        "Bei Menge bündeln: „¿Y si llevo tres?“ – mehrere Stücke bringen Rabatt.",
        "Bar und passend zahlen anbieten: „En efectivo, ¿me lo dejas en…?“",
      ],
      donts: [
        "Nicht das erste Gegenangebot als Endpreis sehen – es gibt ein Hin und Her.",
        "Nicht zu tief einsteigen, das wirkt respektlos; bleib im realistischen Rahmen.",
        "Den Preis nicht nennen, den DU zahlen willst, bevor er seinen genannt hat.",
      ],
    },
    {
      icon: "🚶",
      title: "Der Abschluss (und das Weggehen)",
      intro: "Weggehen ist die stärkste Taktik – oft kommt der bessere Preis erst dann. Und ein Nein ist auch okay.",
      dos: [
        "Wenn der Preis nicht stimmt, freundlich gehen: „Lo voy a pensar, gracias.“",
        "Oft ruft man dich zurück: „¡Espera, te lo dejo en…!“ – dann ist der Deal da.",
        "Beim Ja klar bestätigen: „Listo, me lo llevo.“ und passend bezahlen.",
        "Auch ohne Kauf nett bleiben: „Gracias, muy amable.“ – man sieht sich wieder.",
      ],
      donts: [
        "Nicht handeln, wenn du gar nicht kaufen willst – das gilt als unfair.",
        "Nach dem Handschlag-Preis nicht nochmal nachverhandeln – Wort gilt.",
        "Nicht beleidigt sein, wenn der Verkäufer Nein sagt; dann ist es sein letzter Preis.",
      ],
    },
  ];

  // ---------- Maß- & Mengeneinheiten (Wortschatz vom Marktstand) ----------
  const UNITS = [
    { es: "la unidad", de: "das Stück / die Einheit", ejemplo: "¿A cuánto la unidad?" },
    { es: "la docena", de: "das Dutzend (12 Stück)", ejemplo: "¿Cuánto cuesta la docena?" },
    { es: "la media docena", de: "das halbe Dutzend (6)", ejemplo: "Deme media docena." },
    { es: "la libra", de: "das Pfund (≈ 454 g)", ejemplo: "¿Cuánto vale la libra?" },
    { es: "el kilo", de: "das Kilo(gramm)", ejemplo: "Un kilo de tomates, por favor." },
    { es: "el medio kilo", de: "das halbe Kilo", ejemplo: "Medio kilo de queso." },
    { es: "el cuarto", de: "das Viertel(pfund/-kilo)", ejemplo: "Un cuarto de jamón." },
    { es: "el montón / la pila", de: "das Häufchen (Marktportion)", ejemplo: "¿A cómo el montón?" },
    { es: "el atado / el manojo", de: "das Bündel (Kräuter, Gemüse)", ejemplo: "Un manojo de cilantro." },
    { es: "la bolsa", de: "die Tüte (als Menge)", ejemplo: "Una bolsa de naranjas." },
  ];

  // ---------- Wichtige Sätze, nach Phase gruppiert ----------
  const PHRASES = [
    {
      id: "preguntar",
      icon: "💬",
      title: "Nach dem Preis fragen",
      items: [
        { es: "¿Cuánto cuesta?", de: "Wie viel kostet das?" },
        { es: "¿Cuánto vale?", de: "Was kostet es? (wörtl. „was ist es wert“)" },
        { es: "¿Qué precio tiene?", de: "Welchen Preis hat es?" },
        { es: "¿A cuánto la unidad?", de: "Wie viel das Stück?" },
        { es: "¿A cómo está el kilo?", de: "Wie teuer ist das Kilo gerade?" },
        { es: "¿Cuál es el precio por la libra?", de: "Wie ist der Preis pro Pfund?" },
        { es: "¿Cuánto por todo?", de: "Wie viel für alles zusammen?" },
      ],
    },
    {
      id: "regatear",
      icon: "🤏",
      title: "Feilschen & verhandeln",
      items: [
        { es: "Uy, está un poco caro.", de: "Oh, das ist ein bisschen teuer." },
        { es: "¿Me hace un descuento?", de: "Geben Sie mir einen Rabatt?" },
        { es: "¿En cuánto me lo deja?", de: "Für wie viel lassen Sie es mir?" },
        { es: "¿No me lo deja más barato?", de: "Geht es nicht günstiger?" },
        { es: "¿Y si llevo dos?", de: "Und wenn ich zwei nehme?" },
        { es: "Te doy cien y nos arreglamos.", de: "Ich gebe dir hundert, dann sind wir uns einig." },
        { es: "Es lo que tengo, en efectivo.", de: "Das ist, was ich habe – in bar." },
      ],
    },
    {
      id: "cerrar",
      icon: "✅",
      title: "Abschluss & Bezahlen",
      items: [
        { es: "Listo, me lo llevo.", de: "Abgemacht, ich nehme es." },
        { es: "Está bien, trato hecho.", de: "In Ordnung, abgemacht." },
        { es: "¿Acepta tarjeta o solo efectivo?", de: "Nehmen Sie Karte oder nur bar?" },
        { es: "¿Me da una bolsa, por favor?", de: "Geben Sie mir eine Tüte, bitte?" },
        { es: "Lo voy a pensar, gracias.", de: "Ich überlege es mir, danke. (höfliches Weggehen)" },
        { es: "Gracias, muy amable.", de: "Danke, sehr nett." },
      ],
    },
    {
      id: "buscar",
      icon: "🔎",
      title: "Finden & danach fragen",
      items: [
        { es: "Amigo, ¿hay chancletas?", de: "Freund, gibt es Flip-Flops?" },
        { es: "Amigo, ¿tienes chancletas?", de: "Freund, hast du Flip-Flops?" },
        { es: "¿Dónde venden chancletas?", de: "Wo verkaufen sie Flip-Flops?" },
        { es: "¿Dónde consigo unas chancletas?", de: "Wo bekomme ich Flip-Flops her?" },
        { es: "¿Tiene otra talla / otro color?", de: "Haben Sie eine andere Größe / Farbe?" },
        { es: "¿Me lo puede mostrar?", de: "Können Sie es mir zeigen?" },
      ],
    },
  ];

  // ---------- Rollenspiele zum Üben (Dialoge, wie data.ROLEPLAYS) ----------
  const ROLEPLAYS = [
    {
      id: "rg01",
      title: "Obst & Gemüse auf dem Markt",
      level: 1,
      roleA: "Reisender",
      roleB: "Marktverkäuferin",
      situationDe: "Du stehst am Obst- und Gemüsestand und willst Tomaten und Orangen kaufen. Frag nach Preis und Menge, bevor du dich entscheidest.",
      goalA: "Grüße, frag nach dem Preis pro Kilo bzw. Stück, kauf eine Menge und lass dir eine Tüte geben.",
      goalB: "Begrüße freundlich, nenne die Preise, biete bei mehr Menge einen kleinen Rabatt und pack ein.",
      dialogue: [
        { speaker: "A", de: "Guten Morgen! Wie viel kostet das Kilo Tomaten?", es: "¡Buenos días! ¿A cómo está el kilo de tomates?" },
        { speaker: "B", de: "Guten Morgen! Das Kilo kostet zwanzig.", es: "¡Buenos días! El kilo está a veinte." },
        { speaker: "A", de: "Und die Orangen, wie viel das Stück?", es: "¿Y las naranjas, a cuánto la unidad?" },
        { speaker: "B", de: "Drei pro Stück, oder das Dutzend für dreißig.", es: "A tres la unidad, o la docena a treinta." },
        { speaker: "A", de: "Gut. Geben Sie mir ein Kilo Tomaten und ein halbes Dutzend Orangen.", es: "Bien. Deme un kilo de tomates y media docena de naranjas." },
        { speaker: "B", de: "Sehr gern. Sonst noch etwas?", es: "Con mucho gusto. ¿Algo más?" },
        { speaker: "A", de: "Und wenn ich das ganze Dutzend Orangen nehme?", es: "¿Y si llevo la docena completa de naranjas?" },
        { speaker: "B", de: "Dann lasse ich dir das Dutzend für fünfundzwanzig.", es: "Entonces te dejo la docena en veinticinco." },
        { speaker: "A", de: "Abgemacht, das nehme ich. Geben Sie mir eine Tüte, bitte?", es: "Trato hecho, me lo llevo. ¿Me da una bolsa, por favor?" },
        { speaker: "B", de: "Hier bitte. Das macht insgesamt fünfundvierzig.", es: "Aquí tienes. En total son cuarenta y cinco." },
        { speaker: "A", de: "Hier, in bar. Vielen Dank!", es: "Aquí está, en efectivo. ¡Muchas gracias!" },
        { speaker: "B", de: "Danke dir, schönen Tag noch!", es: "Gracias a ti, ¡que tengas buen día!" },
      ],
      usefulPhrases: ["¿A cómo está el kilo?", "¿A cuánto la unidad?", "la docena / media docena", "¿Y si llevo la docena completa?", "¿Me da una bolsa?", "Trato hecho, me lo llevo."],
    },
    {
      id: "rg02",
      title: "Souvenir feilschen (chancletas)",
      level: 2,
      roleA: "Reisender",
      roleB: "Standverkäufer",
      situationDe: "Auf dem Kunsthandwerksmarkt suchst du Flip-Flops. Der erste Preis ist zu hoch – verhandle freundlich, notfalls geh ein Stück weg.",
      goalA: "Frag nach den Flip-Flops und dem Preis, finde ihn zu teuer, mach ein Gegenangebot und einig dich.",
      goalB: "Nenne einen Startpreis, wehr dich erst, gib dann etwas nach und mach den Deal.",
      dialogue: [
        { speaker: "A", de: "Hallo, Freund! Hast du Flip-Flops?", es: "¡Hola, amigo! ¿Tienes chancletas?" },
        { speaker: "B", de: "Klar! Diese hier sind sehr gut, achtzig das Paar.", es: "¡Claro! Estas son muy buenas, ochenta el par." },
        { speaker: "A", de: "Oh, das ist ein bisschen teuer. Geht es günstiger?", es: "Uy, está un poco caro. ¿No me lo deja más barato?" },
        { speaker: "B", de: "Es ist gute Qualität, mein Freund. Sechzig?", es: "Es buena calidad, amigo. ¿Sesenta?" },
        { speaker: "A", de: "Für wie viel lassen Sie es mir, wenn ich bar zahle?", es: "¿En cuánto me lo deja si pago en efectivo?" },
        { speaker: "B", de: "Wie viel willst du denn geben?", es: "¿Cuánto quieres dar?" },
        { speaker: "A", de: "Ich gebe dir vierzig, das ist, was ich habe.", es: "Te doy cuarenta, es lo que tengo." },
        { speaker: "B", de: "Nein, mein Freund, da verliere ich. Fünfzig.", es: "No, amigo, ahí pierdo. Cincuenta." },
        { speaker: "A", de: "Hmm… ich überlege es mir, danke.", es: "Mmm… lo voy a pensar, gracias." },
        { speaker: "B", de: "Warte, warte! Für fünfundvierzig sind wir uns einig.", es: "¡Espera, espera! En cuarenta y cinco nos arreglamos." },
        { speaker: "A", de: "Abgemacht, ich nehme sie. Vielen Dank!", es: "Trato hecho, me las llevo. ¡Muchas gracias!" },
        { speaker: "B", de: "Danke dir, viel Spaß damit!", es: "Gracias a ti, ¡que las disfrutes!" },
      ],
      usefulPhrases: ["¿Tienes chancletas?", "Está un poco caro.", "¿No me lo deja más barato?", "¿En cuánto me lo deja?", "Es lo que tengo.", "Lo voy a pensar, gracias.", "En cuarenta y cinco nos arreglamos."],
    },
    {
      id: "rg03",
      title: "Erst suchen, dann handeln",
      level: 2,
      roleA: "Reisender",
      roleB: "Verkäuferin",
      situationDe: "Du suchst einen Sonnenhut, weißt aber nicht, wo es ihn gibt. Frag dich durch, finde den Stand und handle einen Mengenrabatt aus.",
      goalA: "Frag, wo es Hüte gibt, lass dir zwei zeigen und handle einen Preis für beide zusammen aus.",
      goalB: "Zeig den Weg bzw. die Ware, nenne den Stückpreis und gib bei zwei Stück nach.",
      dialogue: [
        { speaker: "A", de: "Entschuldigung, wo bekomme ich einen Sonnenhut her?", es: "Disculpe, ¿dónde consigo un sombrero para el sol?" },
        { speaker: "B", de: "Hier bei mir, schau mal. Welche Farbe magst du?", es: "Aquí conmigo, mira. ¿De qué color lo quieres?" },
        { speaker: "A", de: "Können Sie mir den beigen und den braunen zeigen?", es: "¿Me puede mostrar el beige y el café?" },
        { speaker: "B", de: "Natürlich. Jeder kostet fünfzig.", es: "Por supuesto. Cada uno cuesta cincuenta." },
        { speaker: "A", de: "Und wenn ich beide nehme, was kosten sie zusammen?", es: "¿Y si llevo los dos, cuánto por todo?" },
        { speaker: "B", de: "Für beide… lasse ich dir neunzig.", es: "Por los dos… te los dejo en noventa." },
        { speaker: "A", de: "Geht es für achtzig, in bar?", es: "¿Me los deja en ochenta, en efectivo?" },
        { speaker: "B", de: "Na gut, weil du zwei nimmst: fünfundachtzig.", es: "Está bien, porque llevas dos: ochenta y cinco." },
        { speaker: "A", de: "Abgemacht, ich nehme beide. Geben Sie mir eine Tüte?", es: "Trato hecho, me llevo los dos. ¿Me da una bolsa?" },
        { speaker: "B", de: "Hier bitte. Danke für den Einkauf!", es: "Aquí tienes. ¡Gracias por tu compra!" },
        { speaker: "A", de: "Danke Ihnen, sehr nett!", es: "Gracias a usted, ¡muy amable!" },
      ],
      usefulPhrases: ["¿Dónde consigo…?", "¿Me puede mostrar…?", "¿Y si llevo los dos?", "¿Cuánto por todo?", "¿Me los deja en…?", "Trato hecho, me llevo los dos."],
    },
  ];

  window.SC = window.SC || {};
  window.SC.regatear = { INTRO, TIPS, UNITS, PHRASES, ROLEPLAYS };
})();
