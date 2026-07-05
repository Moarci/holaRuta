/*
 * jugar.js  (SC.jugar) – „¡A jugar en inglés!": kindgerechte Zwei-Spieler-Spiele
 * & Gesprächs-Impulse für den Locals-Track (Kinder üben Englisch miteinander).
 * REINE DATEN, keine Logik – die Spiellogik lebt in features/jugar.js.
 *
 * LOKAL & OFFLINE by design: zwei Kinder spielen abwechselnd auf EINEM Gerät
 * (Pass-and-play). Kein Konto, kein Netz, keine Fremden, keine personenbezogenen
 * Daten. Ein Kind kann eine Runde per „Modul teilen"-Link/QR (?m=jugar) an einen
 * Freund schicken, damit sie sich in echt verabreden und zusammen üben.
 *
 * Spiel-Schema:
 *   { id, icon, title{es,en,de}, howto{es,en,de}, turns:[ {who:"A"|"B",
 *     prompt{es,en,de} (Anweisung in der Muttersprache), say (englischer
 *     Modellsatz, ___ = eigenes Wort einsetzen), tip (Aussprache)} ] }
 * Die Anweisung (prompt) bleibt Spanisch/Deutsch; der englische Modellsatz (say)
 * ist die zu übende Zeile.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};

  var GAMES = [
    {
      id: "presentate",
      icon: "🙋",
      title: { es: "Preséntate", en: "Introduce yourself", de: "Stell dich vor" },
      howto: { es: "Túrnense: uno pregunta, el otro responde en inglés.", en: "Take turns: one asks, the other answers in English.", de: "Wechselt euch ab: einer fragt, der andere antwortet auf Englisch." },
      turns: [
        { who: "A", prompt: { es: "Saluda y di tu nombre.", en: "Say hello and your name.", de: "Grüße und sag deinen Namen." }, say: "Hello! My name is ___.", tip: "je-LÓU mái néim is" },
        { who: "B", prompt: { es: "Responde y di tu nombre.", en: "Answer and say your name.", de: "Antworte und sag deinen Namen." }, say: "Hi! I'm ___.", tip: "jái áim" },
        { who: "A", prompt: { es: "Pregunta cuántos años tiene.", en: "Ask how old they are.", de: "Frag, wie alt sie sind." }, say: "How old are you?", tip: "jáo óuld ar yu" },
        { who: "B", prompt: { es: "Di tu edad.", en: "Say your age.", de: "Sag dein Alter." }, say: "I'm ___ years old.", tip: "áim ... yírs óuld" },
        { who: "A", prompt: { es: "Pregunta de dónde es.", en: "Ask where they are from.", de: "Frag, woher sie kommen." }, say: "Where are you from?", tip: "wér ar yu from" },
        { who: "B", prompt: { es: "Di de dónde eres.", en: "Say where you are from.", de: "Sag, woher du kommst." }, say: "I'm from ___.", tip: "áim from" },
      ],
    },
    {
      id: "megusta",
      icon: "💚",
      title: { es: "¿Qué te gusta?", en: "What do you like?", de: "Was magst du?" },
      howto: { es: "Pregúntense qué les gusta y respondan en inglés.", en: "Ask each other what you like and answer in English.", de: "Fragt euch, was ihr mögt, und antwortet auf Englisch." },
      turns: [
        { who: "A", prompt: { es: "Pregunta qué le gusta.", en: "Ask what they like.", de: "Frag, was sie mögen." }, say: "What do you like?", tip: "wat du yu láik" },
        { who: "B", prompt: { es: "Di algo que te gusta.", en: "Say something you like.", de: "Sag etwas, das du magst." }, say: "I like ___.", tip: "ái láik" },
        { who: "A", prompt: { es: "Pregunta su color favorito.", en: "Ask their favorite color.", de: "Frag nach der Lieblingsfarbe." }, say: "What's your favorite color?", tip: "wats yor FÉI-vrit CÓ-lor" },
        { who: "B", prompt: { es: "Di tu color favorito.", en: "Say your favorite color.", de: "Sag deine Lieblingsfarbe." }, say: "My favorite color is ___.", tip: "mái FÉI-vrit CÓ-lor is" },
        { who: "A", prompt: { es: "Pregunta su comida favorita.", en: "Ask their favorite food.", de: "Frag nach dem Lieblingsessen." }, say: "What's your favorite food?", tip: "wats yor FÉI-vrit fud" },
        { who: "B", prompt: { es: "Di tu comida favorita.", en: "Say your favorite food.", de: "Sag dein Lieblingsessen." }, say: "My favorite food is ___.", tip: "mái FÉI-vrit fud is" },
      ],
    },
    {
      id: "veoveo",
      icon: "👀",
      title: { es: "Veo, veo", en: "I spy", de: "Ich sehe was" },
      howto: { es: "Uno ve algo y da una pista; el otro adivina en inglés.", en: "One sees something and gives a clue; the other guesses in English.", de: "Einer sieht etwas und gibt einen Hinweis; der andere rät auf Englisch." },
      turns: [
        { who: "A", prompt: { es: "Empieza: di de qué color es.", en: "Start: say what color it is.", de: "Beginne: sag, welche Farbe es hat." }, say: "I spy something ___.", tip: "ái spái SÓM-zing" },
        { who: "B", prompt: { es: "Adivina qué cosa es.", en: "Guess what it is.", de: "Rate, was es ist." }, say: "Is it the ___?", tip: "is it de" },
        { who: "A", prompt: { es: "Di si acertó o no.", en: "Say if they got it or not.", de: "Sag, ob sie richtig lagen." }, say: "Yes! / No, try again.", tip: "yes / nóu trái a-GUÉN" },
        { who: "B", prompt: { es: "Ahora te toca: da tu pista.", en: "Now your turn: give your clue.", de: "Jetzt du: gib deinen Hinweis." }, say: "I spy something ___.", tip: "ái spái SÓM-zing" },
        { who: "A", prompt: { es: "Adivina la cosa.", en: "Guess the thing.", de: "Rate das Ding." }, say: "Is it the ___?", tip: "is it de" },
        { who: "B", prompt: { es: "Responde con alegría.", en: "Answer cheerfully.", de: "Antworte fröhlich." }, say: "Yes, you got it!", tip: "yes yu gat it" },
      ],
    },
    {
      id: "numeros",
      icon: "🔢",
      title: { es: "Números y turnos", en: "Numbers & turns", de: "Zahlen & Runden" },
      howto: { es: "Cuenten por turnos y practiquen los números en inglés.", en: "Count in turns and practise numbers in English.", de: "Zählt abwechselnd und übt die Zahlen auf Englisch." },
      turns: [
        { who: "A", prompt: { es: "Cuenta hasta cinco.", en: "Count to five.", de: "Zähl bis fünf." }, say: "One, two, three, four, five.", tip: "uán tu zri for fáiv" },
        { who: "B", prompt: { es: "Sigue: de seis a diez.", en: "Keep going: six to ten.", de: "Mach weiter: sechs bis zehn." }, say: "Six, seven, eight, nine, ten.", tip: "six SÉ-ven éit náin ten" },
        { who: "A", prompt: { es: "Muestra algo y pregunta el número.", en: "Show something and ask the number.", de: "Zeig etwas und frag die Zahl." }, say: "How many are there?", tip: "jáo MÉ-ni ar der" },
        { who: "B", prompt: { es: "Responde con el número.", en: "Answer with the number.", de: "Antworte mit der Zahl." }, say: "There are ___.", tip: "der ar" },
        { who: "A", prompt: { es: "Di tu número favorito.", en: "Say your favorite number.", de: "Sag deine Lieblingszahl." }, say: "My favorite number is ___.", tip: "mái FÉI-vrit NÓM-ber is" },
        { who: "B", prompt: { es: "Choca esos cinco.", en: "Give a high five.", de: "Gib ein High five." }, say: "High five!", tip: "jái fáiv" },
      ],
    },
  ];

  window.SC.jugar = { GAMES: GAMES };
})();
