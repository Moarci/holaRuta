/*
 * frases.js  (SC.frases) – "Frases flexibles" (Satzbaukasten). REINE DATEN.
 * Lädt vor app.js, hängt sich an window.SC (wie data.js). Keine Logik, kein I/O.
 *
 * Idee: einen Satzrahmen mit Lücke ("Necesito ___") zeigen und den passenden
 * spanischen Baustein für eine vorgegebene deutsche Bedeutung wählen lassen –
 * produktives Satzbauen statt bloßem Übersetzen. Durchgängig LatAm-Spanisch.
 *
 * Schema eines Rahmens:
 *   { id, frameEs (mit "___"), targetDe (vollständiger deutscher Zielsatz),
 *     slot:        { es, de }   – der korrekte Baustein,
 *     distractors: [{ es, de }] – plausible, aber falsche Bausteine }
 */
(function () {
  "use strict";

  const FRASES = [
    {
      id: "f01", frameEs: "Necesito ___.", targetDe: "Ich brauche einen Arzt.",
      slot: { es: "un médico", de: "einen Arzt" },
      distractors: [
        { es: "un taxi", de: "ein Taxi" },
        { es: "agua", de: "Wasser" },
        { es: "el baño", de: "die Toilette" },
      ],
    },
    {
      id: "f02", frameEs: "¿Dónde está ___?", targetDe: "Wo ist die Bushaltestelle?",
      slot: { es: "la parada", de: "die Haltestelle" },
      distractors: [
        { es: "el cajero", de: "der Geldautomat" },
        { es: "la salida", de: "der Ausgang" },
        { es: "el hostal", de: "das Hostel" },
      ],
    },
    {
      id: "f03", frameEs: "Quiero ___, por favor.", targetDe: "Ich möchte die Rechnung, bitte.",
      slot: { es: "la cuenta", de: "die Rechnung" },
      distractors: [
        { es: "un café", de: "einen Kaffee" },
        { es: "el menú", de: "die Speisekarte" },
        { es: "una cerveza", de: "ein Bier" },
      ],
    },
    {
      id: "f04", frameEs: "¿Cuánto cuesta ___?", targetDe: "Wie viel kostet das Ticket?",
      slot: { es: "el boleto", de: "das Ticket" },
      distractors: [
        { es: "la habitación", de: "das Zimmer" },
        { es: "la entrada", de: "der Eintritt" },
        { es: "el almuerzo", de: "das Mittagessen" },
      ],
    },
    {
      id: "f05", frameEs: "¿Tiene ___?", targetDe: "Haben Sie WLAN?",
      slot: { es: "wifi", de: "WLAN" },
      distractors: [
        { es: "cambio", de: "Wechselgeld" },
        { es: "una habitación", de: "ein Zimmer" },
        { es: "un mapa", de: "eine Karte" },
      ],
    },
    {
      id: "f06", frameEs: "Me gustaría ___.", targetDe: "Ich würde gern mit Karte bezahlen.",
      slot: { es: "pagar con tarjeta", de: "mit Karte bezahlen" },
      distractors: [
        { es: "reservar una cama", de: "ein Bett reservieren" },
        { es: "ver la habitación", de: "das Zimmer ansehen" },
        { es: "pedir la comida", de: "das Essen bestellen" },
      ],
    },
    {
      id: "f07", frameEs: "¿A qué hora ___?", targetDe: "Um wie viel Uhr fährt der Bus ab?",
      slot: { es: "sale el bus", de: "fährt der Bus ab" },
      distractors: [
        { es: "abren", de: "öffnen sie" },
        { es: "cierran", de: "schließen sie" },
        { es: "llega el colectivo", de: "kommt der Bus an" },
      ],
    },
    {
      id: "f08", frameEs: "¿Me puede ___?", targetDe: "Können Sie mir helfen?",
      slot: { es: "ayudar", de: "helfen" },
      distractors: [
        { es: "recomendar algo", de: "etwas empfehlen" },
        { es: "llamar un taxi", de: "ein Taxi rufen" },
        { es: "mostrar el camino", de: "den Weg zeigen" },
      ],
    },
  ];

  window.SC = window.SC || {};
  window.SC.frases = { FRASES };
})();
