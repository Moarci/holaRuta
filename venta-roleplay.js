/*
 * venta-roleplay.js  (SC.ventaRoleplay) – „Vender a un turista": kindgerechte
 * Verkaufs-Rollenspiele für das Modul „El carrito" (Chicos que venden, loc-nino).
 * REINE DATEN, keine Logik – die Spiellogik lebt in features/carrito.js.
 *
 * Solo-Rollenspiel (kein Pass-and-play): der/die Turista (NPC) spricht Englisch
 * (mit spanischer Übersetzung), das Kind (user) wählt die richtige englische
 * Antwort aus drei Optionen. `say` = die Musterzeile (= die richtige Option), wird
 * in en-US vorgelesen. Anweisungen (instr) bleiben Spanisch/Deutsch – NIE Englisch,
 * damit die Lösung nicht verraten wird.
 *
 * Eager geladen (kleines Modul, wie venue-roleplay.js); im Reise-Track ungenutzt.
 */
(function () {
  "use strict";
  window.SC = window.SC || {};

  var SCENES = [
    {
      id: "helado",
      icon: "🍦",
      title: { es: "Vender un helado", en: "Sell an ice cream", de: "Ein Eis verkaufen" },
      turns: [
        { role: "npc", en: "Hello!", es: "¡Hola!" },
        { role: "user", say: "Hello! Would you like an ice cream?",
          instr: { es: "Saluda y ofrece un helado.", en: "Greet and offer an ice cream.", de: "Begrüße und biete ein Eis an." },
          options: [
            { t: "Hello! Would you like an ice cream?", ok: true },
            { t: "Go away, please.", ok: false },
            { t: "I don't have anything.", ok: false },
          ] },
        { role: "npc", en: "Sounds good. How much is it?", es: "Suena bien. ¿Cuánto cuesta?" },
        { role: "user", say: "It costs one dollar.",
          instr: { es: "Di que cuesta un dólar.", en: "Say it costs one dollar.", de: "Sag, es kostet einen Dollar." },
          options: [
            { t: "It costs one dollar.", ok: true },
            { t: "It costs one hundred dollars.", ok: false },
            { t: "I have no idea.", ok: false },
          ] },
        { role: "npc", en: "Okay, here are two dollars.", es: "Bien, aquí van dos dólares." },
        { role: "user", say: "Here is your change.",
          instr: { es: "Dale su vuelto.", en: "Give them their change.", de: "Gib ihnen ihr Wechselgeld." },
          options: [
            { t: "Here is your change.", ok: true },
            { t: "No change for you.", ok: false },
            { t: "Give me more money.", ok: false },
          ] },
        { role: "npc", en: "Thank you!", es: "¡Gracias!" },
        { role: "user", say: "Have a nice day!",
          instr: { es: "Despídete con amabilidad.", en: "Say a friendly goodbye.", de: "Verabschiede dich freundlich." },
          options: [
            { t: "Have a nice day!", ok: true },
            { t: "Never come back.", ok: false },
            { t: "The ice cream was fake.", ok: false },
          ] },
      ],
    },
    {
      id: "agua-fruta",
      icon: "💧",
      title: { es: "Agua y frutas", en: "Water & fruit", de: "Wasser & Obst" },
      turns: [
        { role: "npc", en: "It's so hot today.", es: "Hace mucho calor hoy." },
        { role: "user", say: "Water? Nice and cold.",
          instr: { es: "Ofrece agua bien fría.", en: "Offer nice cold water.", de: "Biete schön kaltes Wasser an." },
          options: [
            { t: "Water? Nice and cold.", ok: true },
            { t: "No water here.", ok: false },
            { t: "The sun is gone.", ok: false },
          ] },
        { role: "npc", en: "Great. Do you have fruit too?", es: "Genial. ¿También tiene fruta?" },
        { role: "user", say: "Fresh fruit, very sweet today.",
          instr: { es: "Di que la fruta está fresca y dulce.", en: "Say the fruit is fresh and sweet.", de: "Sag, das Obst ist frisch und süß." },
          options: [
            { t: "Fresh fruit, very sweet today.", ok: true },
            { t: "The fruit is very old.", ok: false },
            { t: "No, only shoes.", ok: false },
          ] },
        { role: "npc", en: "I'll take both. How much?", es: "Me llevo los dos. ¿Cuánto?" },
        { role: "user", say: "Two for one — a good deal!",
          instr: { es: "Ofrece dos por uno.", en: "Offer two for one.", de: "Biete zwei zum Preis von einem an." },
          options: [
            { t: "Two for one — a good deal!", ok: true },
            { t: "Ten thousand dollars.", ok: false },
            { t: "It is free forever.", ok: false },
          ] },
        { role: "npc", en: "Perfect, thanks!", es: "¡Perfecto, gracias!" },
        { role: "user", say: "Thanks for buying, enjoy!",
          instr: { es: "Agradece la compra.", en: "Thank them for buying.", de: "Bedanke dich für den Kauf." },
          options: [
            { t: "Thanks for buying, enjoy!", ok: true },
            { t: "Finally you paid.", ok: false },
            { t: "Give it back.", ok: false },
          ] },
      ],
    },
    {
      id: "charla",
      icon: "🗺️",
      title: { es: "Charlar con un turista", en: "Chat with a tourist", de: "Mit einem Touristen plaudern" },
      turns: [
        { role: "npc", en: "Good morning!", es: "¡Buenos días!" },
        { role: "user", say: "Good morning! Where are you from?",
          instr: { es: "Saluda y pregunta de dónde es.", en: "Greet and ask where they are from.", de: "Begrüße und frag, woher sie kommen." },
          options: [
            { t: "Good morning! Where are you from?", ok: true },
            { t: "Go home now.", ok: false },
            { t: "I am a car.", ok: false },
          ] },
        { role: "npc", en: "I'm from Canada. Nice city!", es: "Soy de Canadá. ¡Linda ciudad!" },
        { role: "user", say: "Welcome to my city!",
          instr: { es: "Dale la bienvenida a tu ciudad.", en: "Welcome them to your city.", de: "Heiße sie in deiner Stadt willkommen." },
          options: [
            { t: "Welcome to my city!", ok: true },
            { t: "This city is bad.", ok: false },
            { t: "You must leave.", ok: false },
          ] },
        { role: "npc", en: "Thank you! Any postcards?", es: "¡Gracias! ¿Tiene postales?" },
        { role: "user", say: "Postcards of the city, very pretty.",
          instr: { es: "Ofrece postales bonitas.", en: "Offer pretty postcards.", de: "Biete hübsche Postkarten an." },
          options: [
            { t: "Postcards of the city, very pretty.", ok: true },
            { t: "No postcards ever.", ok: false },
            { t: "Buy a bus instead.", ok: false },
          ] },
        { role: "npc", en: "I'll take two. Take care!", es: "Me llevo dos. ¡Cuídese!" },
        { role: "user", say: "Take care, safe travels!",
          instr: { es: "Despídete y desea buen viaje.", en: "Say goodbye and wish a safe trip.", de: "Verabschiede dich und wünsch gute Reise." },
          options: [
            { t: "Take care, safe travels!", ok: true },
            { t: "Never talk to me.", ok: false },
            { t: "Give me your bag.", ok: false },
          ] },
      ],
    },
  ];

  window.SC.ventaRoleplay = { SCENES: SCENES };
})();
