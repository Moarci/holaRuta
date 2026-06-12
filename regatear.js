/*
 * regatear.js  (SC.regatear) – Modul "Regatear: gut verhandeln & feilschen".
 * REINE DATEN, keine Logik (wie knigge.js / frases.js). Lädt vor app.js und
 * hängt sich an window.SC. Wird von ui.renderRegatear gerendert.
 *
 * Idee: auf Märkten in Lateinamerika ist Feilschen (regatear) normal und
 * erwünscht – aber es folgt Spielregeln. Das Modul erklärt erst die Taktik
 * (TIPS), gibt dann ein kleines Glossar (GLOSSARY) und die wichtigsten Sätze
 * nach Phasen (PHRASES) plus den Mengen-/Einheiten-Wortschatz (UNITS), zeigt
 * regionale Unterschiede (REGIONAL) und lässt zum Schluss anhand von
 * Rollenspielen (ROLEPLAYS) üben. Durchgängig LatAm-Spanisch.
 *
 * Schemas:
 *   INTRO    : string – kurze deutsche Einleitung über der Seite.
 *   TIPS     : [{ icon, title, intro, dos:[…], donts:[…] }]  – aufklappbar.
 *   GLOSSARY : [{ es, de }]  – Schlüsselwörter rund ums Feilschen.
 *   PHRASES  : [{ id, icon, title, items:[{ es, de }] }]  – nach Phase gruppiert.
 *   UNITS    : [{ es, de, ejemplo }]  – Maß-/Mengeneinheiten am Marktstand.
 *   REGIONAL : [{ flag, country, note }]  – kurze Besonderheit pro Land/Region.
 *   ROLEPLAYS: [{ id, title, level, roleA, roleB, situationDe, goalA, goalB,
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
    "freundlich und mit Spielregeln. Erst die Taktik, dann die Wörter und die " +
    "wichtigsten Sätze, regionale Unterschiede und zum Schluss üben im Rollenspiel.";

  // ---------- Erklärung: wie man gut verhandelt (aufklappbar, Knigge-Stil) ----------
  const TIPS = [
    {
      icon: "🤝",
      title: "Die Grundhaltung",
      intro: "Feilschen ist in Lateinamerika ein freundliches Spiel, kein Streit. Wer lächelt und höflich bleibt, bekommt den besseren Preis.",
      dos: [
        "Zuerst grüßen: „Buenos días“, ein kurzer Smalltalk öffnet jeden Stand.",
        "Mit Humor und Lächeln bleiben – Sympathie senkt den Preis mehr als Härte.",
        "Den Verkäufer freundlich ansprechen: „amigo/a“, „caballero“, „seño“, „jefe/a“ oder (in den Anden) „casero/a“.",
        "Realistisch bleiben: ein fairer Rabatt ist das Ziel, nicht der Ruin des Standes.",
      ],
      donts: [
        "Nicht aggressiv oder von oben herab auftreten – das blockiert sofort.",
        "Die Ware nicht schlechtmachen, um den Preis zu drücken; lieber sachlich bleiben.",
        "Nicht in Geschäften mit festen Preisen (Supermarkt, Apotheke, Kette) feilschen – dort heißt es „precio fijo“ und ist unüblich.",
      ],
    },
    {
      icon: "🎯",
      title: "Die Verhandlung führen",
      intro: "Der erste genannte Preis ist fast nie der letzte. Frag nach, biete weniger, treffe dich in der Mitte.",
      dos: [
        "Erst nach dem Preis fragen, bevor du Interesse zeigst: „¿A cuánto?“ / „¿A cómo?“",
        "Den ersten Preis nie sofort annehmen – freundlich stutzen: „Uy, está caro.“",
        "Ein Gegenangebot machen (Anker): biete etwa die Hälfte bis zwei Drittel.",
        "Nach dem tiefsten Preis fragen: „¿Cuánto es lo menos?“",
        "Bei Menge bündeln: „¿Y si llevo tres?“ – mehrere Stücke bringen Rabatt.",
        "Bar und passend zahlen anbieten: „En efectivo, ¿me lo deja en…?“",
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
        "In den Anden ruhig nach dem Extra fragen: „¿Me da la yapa?“ (eine kleine Dreingabe).",
        "Auch ohne Kauf nett bleiben: „Gracias, muy amable.“ – man sieht sich wieder.",
      ],
      donts: [
        "Nicht handeln, wenn du gar nicht kaufen willst – das gilt als unfair.",
        "Nach dem Handschlag-Preis nicht nochmal nachverhandeln – Wort gilt.",
        "Nicht beleidigt sein, wenn der Verkäufer Nein sagt; dann ist es sein letzter Preis.",
      ],
    },
    {
      icon: "🚕",
      title: "Taxi, Tuk-Tuk & Touren",
      intro: "Wo kein Taxameter läuft, wird der Preis vorher ausgemacht – nie erst am Ziel. Das vermeidet den „Touristenpreis“.",
      dos: [
        "Den Fahrpreis VOR dem Einsteigen aushandeln: „¿Cuánto me cobra al centro?“",
        "Eine Referenz nennen: „El otro me dijo treinta.“ – das drückt den Preis.",
        "Passend und in lokaler Währung zahlen; vorher fragen: „¿Tiene cambio?“",
        "Bei Touren den Preis pro Person und was inklusive ist klären: „¿Qué incluye?“",
      ],
      donts: [
        "Nicht ohne ausgemachten Preis einsteigen, wenn es kein Taxameter gibt.",
        "Nicht mit großem Schein zahlen wollen – „no tengo cambio“ kostet dich den Rest.",
        "Touren nicht blind beim ersten Anbieter buchen – zwei, drei Preise vergleichen.",
      ],
    },
  ];

  // ---------- Glossar: Schlüsselwörter rund ums Feilschen ----------
  const GLOSSARY = [
    { es: "regatear", de: "feilschen, handeln" },
    { es: "el regateo", de: "das Feilschen" },
    { es: "el descuento", de: "der Rabatt" },
    { es: "la rebaja", de: "die Preissenkung" },
    { es: "la oferta", de: "das (Sonder-)Angebot" },
    { es: "la ganga", de: "das Schnäppchen" },
    { es: "el precio fijo", de: "der Festpreis (kein Handeln)" },
    { es: "caro / barato", de: "teuer / billig" },
    { es: "en efectivo", de: "in bar" },
    { es: "el cambio / el vuelto", de: "das Wechselgeld" },
    { es: "la yapa / la ñapa", de: "kleine Gratis-Dreingabe (Anden / Karibik)" },
    { es: "el/la casero/a", de: "Stamm­kunde / -verkäufer (Anrede der Vertrautheit)" },
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
        { es: "¿Cuánto es lo menos?", de: "Was ist der tiefste Preis?" },
        { es: "¿Y si llevo dos?", de: "Und wenn ich zwei nehme?" },
        { es: "Si me lo deja en cien, me lo llevo ya.", de: "Wenn Sie es mir für hundert lassen, nehme ich es sofort." },
        { es: "Es lo que tengo, en efectivo.", de: "Das ist, was ich habe – in bar." },
      ],
    },
    {
      id: "cerrar",
      icon: "✅",
      title: "Abschluss",
      items: [
        { es: "Listo, me lo llevo.", de: "Abgemacht, ich nehme es." },
        { es: "Está bien, trato hecho.", de: "In Ordnung, abgemacht." },
        { es: "Lo voy a pensar, gracias.", de: "Ich überlege es mir, danke. (höfliches Weggehen)" },
        { es: "¿Me da la yapa?", de: "Geben Sie mir eine kleine Dreingabe? (Anden)" },
        { es: "Gracias, muy amable.", de: "Danke, sehr nett." },
      ],
    },
    {
      id: "pagar",
      icon: "💵",
      title: "Bezahlen & Wechselgeld",
      items: [
        { es: "¿Acepta tarjeta o solo efectivo?", de: "Nehmen Sie Karte oder nur bar?" },
        { es: "¿Cuánto es en total?", de: "Wie viel ist es insgesamt?" },
        { es: "¿Tiene cambio de cien?", de: "Haben Sie auf hundert raus?" },
        { es: "¿Me da el vuelto, por favor?", de: "Geben Sie mir das Wechselgeld, bitte?" },
        { es: "¿Me da una bolsa, por favor?", de: "Geben Sie mir eine Tüte, bitte?" },
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

  // ---------- Maß- & Mengeneinheiten (Wortschatz vom Marktstand) ----------
  const UNITS = [
    { es: "la unidad / la pieza", de: "das Stück (pieza eher in México)", ejemplo: "¿A cuánto la unidad?" },
    { es: "la docena", de: "das Dutzend (12 Stück)", ejemplo: "¿Cuánto cuesta la docena?" },
    { es: "la media docena", de: "das halbe Dutzend (6)", ejemplo: "Deme media docena." },
    { es: "el par", de: "das Paar (Schuhe, Socken)", ejemplo: "¿A cuánto el par?" },
    { es: "la libra", de: "das Pfund (≈ 454 g)", ejemplo: "¿Cuánto vale la libra?" },
    { es: "el kilo", de: "das Kilo(gramm)", ejemplo: "Un kilo de tomates, por favor." },
    { es: "el medio kilo", de: "das halbe Kilo", ejemplo: "Medio kilo de queso." },
    { es: "el cuarto", de: "das Viertel (≈ 250 g)", ejemplo: "Un cuarto de jamón." },
    { es: "el litro", de: "der Liter (Flüssiges)", ejemplo: "Un litro de jugo." },
    { es: "el montón / la pila", de: "das Häufchen (Marktportion)", ejemplo: "¿A cómo el montón?" },
    { es: "el atado / el manojo", de: "das Bündel (Kräuter, Gemüse)", ejemplo: "Un manojo de cilantro." },
    { es: "la bolsa", de: "die Tüte (als Menge)", ejemplo: "Una bolsa de naranjas." },
  ];

  // ---------- Regionale Unterschiede (kurz, eine Zeile je Land/Region) ----------
  const REGIONAL = [
    { flag: "🇲🇽", country: "México", note: "Auf Märkten und im „tianguis“ wird gehandelt, in Läden nicht. Typisch: „¿A cómo?“ und „¿Es lo menos?“." },
    { flag: "🇬🇹", country: "Guatemala", note: "Kunsthandwerksmärkte (Chichicastenango, Antigua) haben viel Spielraum – ruhig deutlich unter dem ersten Preis einsteigen." },
    { flag: "🇵🇪🇧🇴", country: "Perú & Bolivia", note: "Mit „casera/caserito“ ansprechen schafft Vertrauen; nach dem Kauf nach der „yapa“ (Dreingabe) fragen." },
    { flag: "🇨🇴", country: "Colombia", note: "Auf den „plazas de mercado“ wird gefeilscht: „¿Me hace una rebajita?“ – in Malls und Ketten nicht." },
    { flag: "🇦🇷", country: "Argentina", note: "Wegen der Inflation ändern sich Preise schnell; auf „ferias“ geht „¿Me hacés un precio?“, sonst eher Festpreise." },
    { flag: "🇨🇷", country: "Costa Rica", note: "Wenig Feilschen, Preise sind meist fix; auf der „feria del agricultor“ ist der Spielraum klein." },
    { flag: "🇨🇺", country: "Cuba", note: "Auf Märkten und privat wird verhandelt – aber auf „Touristenpreise“ achten und am besten den lokalen Preis erfragen." },
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
        { speaker: "A", de: "Abgemacht, ich nehme alles. Geben Sie mir eine Tüte, bitte?", es: "Trato hecho, me lo llevo todo. ¿Me da una bolsa, por favor?" },
        { speaker: "B", de: "Hier bitte. Das macht insgesamt fünfundvierzig.", es: "Aquí tienes. En total son cuarenta y cinco." },
        { speaker: "A", de: "Hier, in bar. Vielen Dank!", es: "Aquí está, en efectivo. ¡Muchas gracias!" },
        { speaker: "B", de: "Danke dir, schönen Tag noch!", es: "Gracias a ti, ¡que tengas buen día!" },
      ],
      usefulPhrases: ["¿A cómo está el kilo?", "¿A cuánto la unidad?", "la docena / media docena", "¿Y si llevo la docena completa?", "¿Me da una bolsa?", "Trato hecho, me lo llevo todo."],
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
        { speaker: "A", de: "Was ist der tiefste Preis, wenn ich bar zahle?", es: "¿Cuánto es lo menos, si pago en efectivo?" },
        { speaker: "B", de: "Wie viel willst du denn geben?", es: "¿Cuánto quieres dar?" },
        { speaker: "A", de: "Ich gebe dir vierzig, das ist, was ich habe.", es: "Te doy cuarenta, es lo que tengo." },
        { speaker: "B", de: "Nein, mein Freund, da verliere ich. Fünfzig.", es: "No, amigo, ahí pierdo. Cincuenta." },
        { speaker: "A", de: "Hmm… ich überlege es mir, danke.", es: "Mmm… lo voy a pensar, gracias." },
        { speaker: "B", de: "Warte, warte! Für fünfundvierzig sind wir uns einig.", es: "¡Espera, espera! En cuarenta y cinco nos arreglamos." },
        { speaker: "A", de: "Abgemacht, ich nehme sie. Vielen Dank!", es: "Trato hecho, me las llevo. ¡Muchas gracias!" },
        { speaker: "B", de: "Danke dir, viel Spaß damit!", es: "Gracias a ti, ¡que las disfrutes!" },
      ],
      usefulPhrases: ["¿Tienes chancletas?", "Está un poco caro.", "¿No me lo deja más barato?", "¿Cuánto es lo menos?", "Es lo que tengo.", "Lo voy a pensar, gracias.", "En cuarenta y cinco nos arreglamos."],
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
    {
      id: "rg04",
      title: "Taxipreis aushandeln",
      level: 2,
      roleA: "Reisender",
      roleB: "Taxifahrer",
      situationDe: "Am Busbahnhof gibt es kein Taxameter. Handle den Preis ins Zentrum aus, BEVOR du einsteigst, und kläre das Wechselgeld.",
      goalA: "Frag nach dem Preis ins Zentrum, finde ihn zu hoch, nenne eine Referenz, einig dich und kläre das Wechselgeld.",
      goalB: "Nenne einen Startpreis, begründe ihn, gib etwas nach und bestätige den Deal.",
      dialogue: [
        { speaker: "A", de: "Guten Tag, wie viel berechnen Sie mir ins Zentrum?", es: "Buenas, ¿cuánto me cobra al centro?" },
        { speaker: "B", de: "Ins Zentrum berechne ich Ihnen fünfzig.", es: "Al centro le cobro cincuenta." },
        { speaker: "A", de: "Oh, das kommt mir teuer vor. Der andere sagte mir dreißig.", es: "Uy, me parece caro. El otro me dijo treinta." },
        { speaker: "B", de: "Es ist weit und gerade ist viel Verkehr, mein Herr.", es: "Es que está lejos y ahorita hay mucho tráfico, señor." },
        { speaker: "A", de: "Lassen Sie es mir für fünfunddreißig?", es: "¿Me lo deja en treinta y cinco?" },
        { speaker: "B", de: "Vierzig, und wir fahren sofort los.", es: "Cuarenta, y salimos ya." },
        { speaker: "A", de: "In Ordnung, vierzig. Bringen Sie mich zu dieser Adresse?", es: "Está bien, cuarenta. ¿Me lleva a esta dirección?" },
        { speaker: "B", de: "Klar, steigen Sie ein. Haben Sie die genaue Adresse?", es: "Claro, suba. ¿Tiene la dirección exacta?" },
        { speaker: "A", de: "Ja, sie ist hier auf der Karte. Haben Sie auf hundert raus?", es: "Sí, está aquí en el mapa. ¿Tiene cambio de cien?" },
        { speaker: "B", de: "Ja, kein Problem. In zehn Minuten sind wir da.", es: "Sí, no hay problema. Llegamos en diez minutos." },
        { speaker: "A", de: "Perfekt, vielen Dank!", es: "Perfecto, ¡muchas gracias!" },
      ],
      usefulPhrases: ["¿Cuánto me cobra al centro?", "Me parece caro.", "El otro me dijo treinta.", "¿Me lo deja en treinta y cinco?", "¿Me lleva a esta dirección?", "¿Tiene cambio de cien?"],
    },
  ];

  window.SC = window.SC || {};
  window.SC.regatear = { INTRO, TIPS, GLOSSARY, PHRASES, UNITS, REGIONAL, ROLEPLAYS };
})();
