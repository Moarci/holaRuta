# Locals-Track · Erweiterungspack & Verbesserungen (Bedarfs-Aufstellung Südamerika)

Ziel: Wer in Südamerika kommt **wie** mit englischsprachigen Touristen oder
Arbeitskolleg:innen in Kontakt – und **welche Vokabeln, Sätze, Grammatik** braucht diese
Person? Anschließend gegen unseren Bestand (`data.locals.js`, Stand **38 Kategorien ·
514 Karten · 15 Diálogos · 3 Kurspläne**) gespiegelt, mit konkretem Erweiterungspack.

Leitprinzip bleibt **„Sinnhaftigkeit nie vergessen"**: nur real benötigte Sprache,
zugeschnitten auf die Rolle.

> **Umsetzungsstand:** Batch 1 (Beruf-Tiefe), Batch 2 (Grammatik-Packs), Batch 3
> (Tourismus-Nischen + Alltag/Expat-Dienste + 4 Diálogos) **und** die Qualitäts-
> Verbesserungen (Teil 3.7: `alt`-Varianten gegen Falsch-Negative, `lvl:3`-Progression)
> sind **umgesetzt** → **62 Kategorien · 804 Karten · 19 Diálogos · 7 Kurspläne**.
> Zusätzlich adversarialer Inhalts-Review aller ~290 neuen Karten + 4 Diálogos
> (1 HIGH behoben: „Is there any problem?" → „Are there any questions?"; mehrere LOW).
> `reunion-en`/`videocall-en` bleiben bewusst getrennt (komplementär, keine Dubletten —
> vom Review bestätigt). **Nachgezogen:** Nische Healthcare (`salud-pro-en`, 14 Karten +
> Diálogo „En la consulta") → **63 Kategorien · 818 Karten · 20 Diálogos · 7 Kurspläne**.
>
> **Aktueller Stand (2026-07):** Der Korpus ist seither weit über diesen Bauplan hinaus
> gewachsen — **131 Kategorien · 2844 Karten · 24 Diálogos · 9 Kurspläne** (u. a. die
> Vokabel-Sektion `loc-voc` und die B2-Gruppe `loc-b2`), mit komplettem Sign-off
> (siehe [LOCALS-SIGNOFF.md](LOCALS-SIGNOFF.md)). Maßgeblich für die Zähler ist der
> test-verankerte Stand in [LOCALS.md](LOCALS.md); **dieses Dokument ist ein
> historischer Bauplan-Snapshot**, kein laufend nachgezogenes Register.
> Offen/optional: weitere Diálogos je Cluster.

---

## Teil 1 — Aufstellung: Wer hat Kontakt, wer braucht was?

Drei große Kontaktwelten + die Sprachschul-Schiene. Pro Rolle: typischer Kontakt →
Sprachbedarf → Grammatik-Schwerpunkt.

### A) Tourismus / Gastgewerbe (Touristen als Gegenüber)

| Rolle | Kontakt | Vokabeln/Sätze | Grammatik-Fokus |
|---|---|---|---|
| Kellner:in / Restaurant | Bestellung, Empfehlung, Rechnung | Menü, Allergien, Zahlarten | Fragen, „would like", Höflichkeitsformen |
| Rezeption / Hotel | Check-in/out, Auskunft | Reservierung, Etage, Frühstück | Uhrzeit, Präpositionen (on/at), Modalverben |
| Housekeeping | Zimmer, Wäsche, Minibar | Handtücher, „may I…", Schilder | Modalverben (may/shall), Imperativ |
| Tour-Guide | Führung, Geschichte, Logistik | Treffpunkt, Daten, „follow me" | Vergangenheit (was/were), Mengenangaben |
| Taxi / Uber / Transfer | Ziel, Preis, Smalltalk | Strecke, Wechselgeld, Verkehr | „it's…", Zahlen, there is/are |
| Boots-/Lancha-Betreiber | Tour, Sicherheit | Schwimmweste, Abfahrt, Schnorcheln | Imperativ, Sicherheits-Modals (must) |
| Strand-Verkäufer:in | Liegen, Getränke, Massage | Preise, Angebote, Warnungen | „would you like", Mengen |
| Markt-/Kunsthandwerk-Verkäufer:in | Verkauf, Verhandlung | Größe, Material, Rabatt | Komparativ, „I'll…", Zahlen |
| Barkeeper:in | Bestellung, Empfehlung | Eis, Happy Hour, „cheers" | Fragen, Mengen |
| Spa / Masseur:in | Behandlung, Komfort | Druck, „lie down", Atmung | Imperativ, Komparativ (soft/firm) |
| **Tauch-/Schnorchel-Instruktor:in** ⟶ NEU | Briefing, Ausrüstung, Sicherheit | Tauchgang, Maske, Signale, Tiefe | Imperativ, must/can't, Sicherheits-Wenn-Sätze |
| **Abenteuer-/Trekking-Guide** ⟶ NEU | Wanderung, Höhe, Wetter | Ausrüstung, Höhenkrankheit, Tempo | Vergangenheit, Warnungen, Konditional |
| **Flughafen-/Airline-Bodenpersonal** ⟶ NEU | Check-in, Gepäck, Gate | Bordkarte, Übergepäck, Verspätung | Imperativ, Uhrzeit, Präpositionen |
| **Mietwagen-/Verleih-Agent:in** ⟶ NEU | Vertrag, Übergabe | Versicherung, Tank, Schaden | Modalverben, Konditional |
| **Museum/Ticket/Eintritt** ⟶ NEU | Tickets, Regeln, Auskunft | Öffnungszeiten, „no flash", Tour | Imperativ, Uhrzeit, Mengen |
| **Tour-Fotograf:in / Souvenir** ⟶ NEU | Fotoverkauf, Andenken | Pose, Druck, Preis | „would you like", Imperativ |
| **Weintour / Bodega** (Mendoza, Chile) ⟶ NEU | Verkostung, Verkauf | Rebsorte, Aroma, Flasche | Komparativ, Mengen, Beschreibung |
| **Ski-Instruktor:in** (Bariloche, Valle Nevado) ⟶ NEU | Unterricht, Sicherheit | Lift, Piste, Ausrüstung | Imperativ, Richtungen |

### B) Alltag / Expats & internationale Nachbarn (Englischsprachige im eigenen Umfeld)

| Rolle | Kontakt | Vokabeln/Sätze | Grammatik |
|---|---|---|---|
| Nachbar:in / Smalltalk | Begrüßung, Plausch | Vorstellung, Wetter, „take care" | Präsens, Fragen |
| Telefon/Service-Anruf | Auskunft, Termin | „hold the line", Nachricht | Höflichkeits-Modals |
| Wegauskunft | Orientierung | links/rechts, Blocks, „across from" | Imperativ, Präpositionen |
| Einkaufen (Kundensicht) | Laden, Kasse | Größe, Umtausch, Garantie | Fragen, can/could |
| Gesundheit/Apotheke | Symptome, Medizin | Schmerz, Rezept, Dosis | Präsens, „I have…" |
| Bank/Geld | Wechseln, ATM | Gebühr, Kurs, Beleg | Zahlen, Fragen |
| Öffentlicher Verkehr | Bus, Fahrkarte | Haltestelle, Tarif, Umsteigen | „does this…", Präpositionen |
| Notfall/Sicherheit | Hilfe, Polizei | Unfall, „stay calm", Krankenwagen | Imperativ, Present |
| Friseur:in/Barbier | Schnitt, Bart | „shorter", waschen, Länge | Komparativ, Imperativ |
| Vermieter:in / Airbnb-Host | Schlüssel, Regeln | Miete, Müll, Reparatur | Modals, Konditional („if … breaks") |
| Smalltalk Wetter | Plausch | heiß, Regen, Feuchtigkeit | „it's…", Präsens |
| **Lieferfahrer:in (Rappi/Uber)** ⟶ NEU | Übergabe, Adresse | „your order", Trinkgeld, Tor | Imperativ, Präpositionen |
| **Fitness-/Gym-Trainer:in** ⟶ NEU | Übungen, Anleitung | Wiederholungen, „keep going" | Imperativ, Zahlen |
| **Hausangestellte/Nanny (Expat-Familien)** ⟶ NEU | Haushalt, Kinder | Putzen, Essen, Zeitplan | Imperativ, Uhrzeit, Present |
| **Handwerker/Techniker (Internet, AC)** ⟶ NEU | Reparatur, Termin | Werkzeug, „it's fixed", morgen | Future, Konditional |
| **Immobilienmakler:in (Expat-Mieten)** ⟶ NEU | Besichtigung, Vertrag | Quadratmeter, Kaution, Lage | Komparativ, Modals |

### C) Beruf / Business (englischsprachige Kolleg:innen & Kund:innen) — größter Wachstumshebel

> Südamerika ist ein globaler **Nearshore-Hub**: Kolumbien, Argentinien, Peru und Uruguay
> haben riesige **Call-Center/BPO-** und **IT/Software-Branchen**, die täglich auf
> Englisch mit US-/UK-Kund:innen und -Teams arbeiten. Hier ist der Bedarf am tiefsten.

| Rolle | Kontakt | Vokabeln/Sätze | Grammatik |
|---|---|---|---|
| Jobinterview | Bewerbung | Erfahrung, Stärken, Verfügbarkeit | Present perfect, „I can…" |
| Büro/E-Mail | Korrespondenz | Anhang, „I look forward", Termin | Formelle Modals, Future |
| Kundenservice (allg.) | Anfrage, Lösung | „how may I help", Entschuldigung | Höflichkeits-Modals |
| Meeting | Besprechung | Agenda, „I agree", Bildschirm | Vorschläge (let's, shall) |
| Reseñas/Social | Bewertungen | „leave a review", taggen | Imperativ |
| Lebenslauf/Anschreiben | Bewerbung | Stärken, Referenzen | Present perfect |
| Verhandeln | Preis/Gehalt | „best offer", Rabatt, „deal" | Konditional, Komparativ |
| **Call-Center / BPO-Agent:in** ⟶ NEU | In-/Outbound-Calls | Skript, „bear with me", Eskalation, Verifizierung | Höflichkeits-Modals, Konditional, klare Fragen |
| **IT / Software (Nearshore-Dev)** ⟶ NEU | Standup, Ticket, Review | Deploy, Bug, „blocked", PR, Deadline | Present perfect/continuous, Future, Konditional |
| **Remote-Work / Video-Call-Etikette** ⟶ NEU | Zoom/Teams | „you're muted", „can you see my screen", „let's circle back" | Imperativ, Vorschläge |
| **Sales / Pitch / Präsentation** ⟶ NEU | Verkaufsgespräch | „our product helps…", Demo, Follow-up | Present, Future, Komparativ |
| **Finanzen/Buchhaltung** ⟶ NEU | Rechnungen, Reports | Rechnung, Frist, Zahlung, Budget | Zahlen, Datum, Modals |
| **Logistik/Export-Import (Handel mit USA)** ⟶ NEU | Bestellung, Versand | Zoll, Sendung, Tracking, Lieferzeit | Future, Präpositionen, Zahlen |
| **Healthcare-Profi (Medizintourismus, Expats)** ⟶ NEU | Patient:innen | Symptome erfragen, Anweisung, Beruhigung | Fragen, Imperativ, „you need to…" |
| **HR / Feedback / Performance** ⟶ NEU | Gespräche | Lob, Kritik, Ziele, „let's set a goal" | Konditional, Höflichkeit |
| **Networking / professioneller Smalltalk** ⟶ NEU | Events, LinkedIn | Vorstellen, „what do you do", Visitenkarte | Present, Fragen |

### D) Schule / Prüfung / Sprachschule (ECOS & Co.)

Das ist die **Lernmechanik-Schiene** – Grammatik & Prüfungssprache. Hier liegen die
größten *qualitativen* Lücken, weil Spanisch-Sprecher:innen typische L1-Interferenzen
haben, die wir gezielt adressieren können (siehe Teil 3, Grammatik-Packs).

| Bedarf | Warum kritisch für ES-Muttersprachler |
|---|---|
| Present perfect vs. past simple | gibt es im Spanischen anders → häufigster Fehler |
| Artikel a/an/the | Spanisch setzt Artikel anders → Auslassen/Übergebrauch |
| much/many, some/any, countable | „informations", „advices" sind klassische Fehler |
| Modalverben can/could/should/must/would | Höflichkeit & Nuancen |
| Phrasal verbs (check in, turn on, pick up) | im Beruf/Alltag allgegenwärtig, schwer zu erraten |
| **False friends / falsche Freunde** | embarrassed≠embarazada, actually≠actualmente … (Top-Nutzen) |
| **Aussprache-Minimalpaare** | ship/sheep, beach/…, live/leave – ES kennt kein /ɪ/ vs /iː/ |
| Komparativ/Superlativ | bigger, the best |
| Gerundium vs. Infinitiv | „I enjoy to work" ist falsch |
| Wortstellung / Adjektivposition | „a car red" → „a red car" |

### Regionale Hotspots (für spätere Editionen/Kurspläne)

- **Kolumbien** — Cartagena/Medellín-Tourismus **+ BPO/Call-Center** (Bogotá, Medellín, Barranquilla).
- **Peru** — Cusco/Machu-Picchu-Guides, Lima-Gastronomie, Amazonas-Lodges.
- **Ecuador** — **Galápagos-Naturguides (Englisch Pflicht!)**, Cuenca/Quito-Expat-Community.
- **Argentinien** — Buenos Aires (Tango/Tourismus **+ Tech/Remote/Freelance**), Mendoza-Wein, Patagonien-Trekking/Ski.
- **Chile** — Atacama, Torres del Paine, Valparaíso, Ski, **Bergbau** mit intl. Firmen.
- **Bolivien** — Uyuni, La Paz. **Uruguay** — Punta del Este + Tech/Remote.
- (Brasilien = Portugiesisch → außerhalb des ES-Tracks; eigener Track wäre nötig.)

---

## Teil 2 — Spiegelung gegen den Bestand

Bestand (38 Kat.): **loc-hosp** meseros, recepcion, guias, taxi-en, ventas, bar-en,
playa-en, quejas-en, platos-en, limpieza, spa-en, lancha-en, checkout-en · **loc-dia**
saludos-en, telefono, direcciones, compras-en, salud-en, dinero-en, transporte-en,
emergencias-en, peluqueria, vivienda, clima-en · **loc-trab** entrevista, oficina,
cliente-en, reunion-en, resenas-en, cv-en, negociacion · **loc-esc** gramatica-en,
examen, numeros-en, conectores-en, tiempos-en, preposiciones, preguntas-en.

**Legende:** ✓ gut abgedeckt · ⚠ teilweise (Ausbau/Schärfung sinnvoll) · ✗ Lücke.

| Bedarf | Status | Anmerkung |
|---|---|---|
| Restaurant/Bar/Hotel/Housekeeping/Spa/Strand/Markt/Taxi/Guide/Lancha/Check-out/Quejas/Platos | ✓ | Front-line Tourismus solide |
| Tauchen/Schnorcheln-Instruktion | ✗ | eigene Sicherheits-/Ausrüstungssprache |
| Trekking/Abenteuer-Guide (Höhe, Wetter) | ✗ | Inca Trail, Patagonien, Amazonas |
| Flughafen/Airline-Bodenpersonal | ✗ | Boarding, Gepäck, Gate |
| Mietwagen / Museum/Ticket / Weintour / Ski / Tour-Foto | ✗ | je eigene Mini-Domäne |
| Alltag (Saludos/Telefon/Wege/Compras/Salud/Dinero/Transporte/Notfall/Friseur/Vivienda/Clima) | ✓ | breit abgedeckt |
| Lieferfahrer / Gym / Nanny / Techniker / Makler | ✗ | wachsende Expat-Dienstleistungen |
| Jobinterview/Büro/Kundenservice/Meeting/Reseñas/CV/Negociar | ✓ | Business-Basis vorhanden |
| **Call-Center/BPO** | ⚠→✗ | nur generisches `cliente-en`; echter BPO-Wortschatz fehlt |
| **IT/Software (Nearshore)** | ✗ | größte Berufslücke gemessen am Markt |
| Remote/Video-Call-Etikette | ⚠ | ein paar Karten in `reunion-en`, kein eigener Block |
| Sales/Pitch, Finanzen, Logistik, HR/Feedback, Networking, Healthcare-Profi | ✗ | Business-Tiefe fehlt |
| Grammatik: to-be, WH, Zeiten, Präpositionen, Konnektoren, Zahlen | ✓ | Grundlagen da |
| **Present perfect vs. past** | ⚠ | in `tiempos-en` angerissen, kein Fokus-Block |
| **Artikel a/an/the** | ✗ | klassische ES-Lücke, nicht adressiert |
| **much/many/some/any, countable** | ✗ | fehlt |
| **Modalverben (Fokus)** | ⚠ | verteilt, kein eigener Block |
| **Phrasal verbs** | ✗ | fehlt komplett |
| **False friends** | ✗ | hoher Nutzen, fehlt |
| **Aussprache-Minimalpaare** | ✗ | für ES-Sprecher essenziell, fehlt |
| Komparativ/Superlativ, Gerund/Infinitiv, Wortstellung | ✗ | fehlt |
| Diálogos | ✓ (15) | Tourismus + erste Beruf; BPO/IT/Trekking fehlen |
| Kurspläne | ✓ (3) | Inglés, Pro-Trabajo, Día a día; BPO/Tech/Tourismus-Pro fehlen |

**Kernbefund:** Tourismus-Frontline und Alltag sind breit. Die zwei größten,
markt-relevantesten **Lücken** sind **(1) Beruf-Tiefe – v. a. BPO/Call-Center und
IT/Remote** und **(2) gezielte Grammatik gegen ES-L1-Interferenzen (Artikel, present
perfect, false friends, Minimalpaare, phrasal verbs)**. Dazu mehrere **Tourismus-Nischen**
(Tauchen, Trekking, Flughafen, Mietwagen …), die Sprachschulen als Spezialpakete
verkaufen können.

---

## Teil 3 — Erweiterungspack (detailliert, buildfertig)

Schema unverändert (`{id, cat, lvl, es, en, tip}`), Tip-Konvention wie gehabt
(/ð/→„d", /θ/→„z", „j"=/h/, betonte Silbe GROSS). Neue Kategorien fügen sich automatisch
in die 4 Gruppen, Presets werden auto-generiert (kein Code nötig). Zielgröße des
Vollausbaus: **+~360 Karten → ~870 Karten / ~58 Kategorien**, plus Grammatik-Packs,
Diálogos und Kurspläne.

### 3.1 Neue Kategorien — Beruf (`loc-trab`) — Top-Priorität

| Kat-Id | Titel (ES/EN) | ~Karten | Beispielkarten (es → en) |
|---|---|---|---|
| `bpo-en` | Call-center / BPO | 16 | „Gracias por llamar, ¿en qué puedo ayudarle?" → "Thank you for calling, how can I help you?" · „¿Me confirma su nombre completo?" → "Can you confirm your full name?" · „Un momento mientras reviso." → "One moment while I check." · „Lo transfiero con el área correspondiente." → "I'll transfer you to the right department." · „¿Hay algo más en lo que pueda ayudarle hoy?" → "Is there anything else I can help you with today?" |
| `tech-en` | Trabajo en TI / dev | 16 | „Estoy bloqueado con un error." → "I'm blocked by a bug." · „Subí el cambio, ¿lo revisas?" → "I pushed the change, can you review it?" · „Lo despliego a producción hoy." → "I'll deploy it to production today." · „¿Cuál es la fecha de entrega?" → "What's the deadline?" · „En el standup de hoy…" → "In today's standup…" |
| `videocall-en` | Videollamadas / remoto | 12 | „Tienes el micrófono apagado." → "You're on mute." · „¿Pueden ver mi pantalla?" → "Can you see my screen?" · „Se te corta." → "You're breaking up." · „Lo retomamos luego." → "Let's circle back to that." · „¿Me escuchan bien?" → "Can you hear me okay?" |
| `ventas-pro` | Ventas / presentar | 12 | „Nuestro producto le ahorra tiempo." → "Our product saves you time." · „¿Le muestro una demo?" → "Can I show you a demo?" · „Le hago seguimiento mañana." → "I'll follow up tomorrow." |
| `finanzas-en` | Finanzas / facturación | 12 | „La factura vence el viernes." → "The invoice is due on Friday." · „¿Cuál es el presupuesto?" → "What's the budget?" · „El pago está pendiente." → "The payment is pending." |
| `logistica-en` | Logística / envíos | 12 | „El pedido sale hoy." → "The order ships today." · „Aquí está el número de rastreo." → "Here's the tracking number." · „Pasó por la aduana." → "It cleared customs." |
| `feedback-en` | RR. HH. / feedback | 10 | „Buen trabajo esta semana." → "Great job this week." · „Pongámonos una meta." → "Let's set a goal." · „¿Cómo te sientes con tu carga?" → "How do you feel about your workload?" |
| `networking-en` | Networking | 10 | „¿A qué te dedicas?" → "What do you do?" (vorhanden in saludos – hier beruflich vertieft) · „Conectemos en LinkedIn." → "Let's connect on LinkedIn." · „Aquí tienes mi tarjeta." → "Here's my card." |

### 3.2 Neue Kategorien — Tourismus-Nischen (`loc-hosp`)

| Kat-Id | Titel | ~Karten | Beispiel |
|---|---|---|---|
| `buceo-en` | Buceo / snorkel | 12 | „Pónganse la máscara y las aletas." → "Put on your mask and fins." · „No contengan la respiración." → "Don't hold your breath." · „Sígame y manténganse cerca." → "Follow me and stay close." |
| `trekking-en` | Senderismo / aventura | 12 | „Tomen agua, estamos en altura." → "Drink water, we're at altitude." · „Vamos despacio." → "Let's take it slow." · „¿Trajeron impermeable?" → "Did you bring a rain jacket?" |
| `aeropuerto-en` | Aeropuerto / aerolínea | 12 | „¿Cuántas maletas registra?" → "How many bags are you checking?" · „Su vuelo sale por la puerta 12." → "Your flight leaves from gate 12." · „El vuelo está retrasado." → "The flight is delayed." |
| `alquiler-auto-en` | Alquiler de autos | 10 | „¿Incluye seguro?" → "Does it include insurance?" · „Devuélvalo con el tanque lleno." → "Return it with a full tank." · „Firme aquí, por favor." → "Sign here, please." |
| `museo-en` | Museo / entradas | 10 | „La entrada cuesta veinte mil." → "Admission is twenty thousand." · „No se permiten fotos con flash." → "No flash photography." · „El museo cierra a las cinco." → "The museum closes at five." |

### 3.3 Neue Kategorien — Alltag / Expat-Dienste (`loc-dia`)

| Kat-Id | Titel | ~Karten | Beispiel |
|---|---|---|---|
| `delivery-en` | Domicilios / repartidor | 10 | „Traigo su pedido." → "I have your order." · „¿Me abre el portón?" → "Can you open the gate?" · „Que lo disfrute." → "Enjoy your meal." |
| `gym-en` | Gimnasio / entrenador | 10 | „Diez repeticiones más." → "Ten more reps." · „Mantenga la espalda recta." → "Keep your back straight." · „¡Buen trabajo, siga así!" → "Great job, keep it up!" |
| `hogar-en` | Casa / niñera / técnico | 12 | „Ya está arreglado." → "It's fixed now." · „¿A qué hora recojo a los niños?" → "What time do I pick up the kids?" · „Necesito una herramienta." → "I need a tool." |

### 3.4 Grammatik-Packs (`loc-esc`) — höchster *qualitativer* Nutzen

Gezielt gegen typische ES→EN-Fehler. Format: Karte zeigt die ES-Regel/das Beispiel,
`en` die korrekte englische Form; `tip` Aussprache. Diese Packs sind der eigentliche
„Sprachschul-Mehrwert".

| Kat-Id | Titel | ~Karten | Inhalt / Beispiel |
|---|---|---|---|
| `falsos-amigos` | Falsche Freunde | 16 | „embarazada (≠embarrassed)" → "pregnant" · „actualmente (≠actually)" → "currently" · „asistir a (≠assist)" → "to attend" · „librería (≠library)" → "bookstore" · „sensible (≠sensible)" → "sensitive" · „carpeta (≠carpet)" → "folder" |
| `pronunciacion-en` | Aussprache-Paare | 14 | Minimalpaare mit Bedeutung: „beach / …" , „ship (barco) vs sheep (oveja)", „live (vivir) vs leave (irse)", „chip vs cheap", „it / eat" – `tip` zeigt /ɪ/ vs /iː/ |
| `perfecto-en` | Present perfect vs. pasado | 12 | „He vivido aquí 3 años (sigo aquí)" → "I have lived here for three years" · „Viví allí en 2019" → "I lived there in 2019" · „¿Alguna vez has…?" → "Have you ever…?" |
| `articulos-en` | Artikel a/an/the | 12 | „Soy profesor → I am a teacher" · „una hora → an hour" · „el sol → the sun" · „Me gusta el café (general) → I like coffee" |
| `cantidades-en` | much/many/some/any | 12 | „¿Cuánto dinero? → How much money?" · „¿Cuántas personas? → How many people?" · „algo de agua → some water" · „¿hay algún…? → is there any…?" · „información (incontable) → information" |
| `modales-en` | Modalverben | 12 | „¿Podría ayudarme? → Could you help me?" · „Deberías descansar → You should rest" · „Debo irme → I must go" · „¿Me prestas…? → Can I borrow…?" |
| `phrasal-en` | Phrasal verbs | 14 | „registrarse → check in" · „encender → turn on" · „recoger → pick up" · „apagar → turn off" · „averiarse → break down" · „buscar (en dicc.) → look up" |
| `comparar-en` | Komparativ/Superlativ | 10 | „más grande → bigger" · „el mejor → the best" · „tan caro como → as expensive as" · „peor → worse" |

### 3.5 Neue Diálogos (volle Bodies, NPC Englisch / ES-Übersetzung)

Passend zu den neuen Domänen, je 8 Turns (MC + type), Icons aus `icons.js` vorhanden:
- **Call-center (Inbound-Beschwerde)** – `lc:headphones` (Verifizierung → Problem → Lösung → Abschluss)
- **Tech-Standup** – `lc:briefcase` (oder neues Icon ergänzen; `lc:monitor`/`lc:laptop` existieren noch NICHT in `icons.js`) (Status → Blocker → nächster Schritt)
- **Tauch-Briefing** – `lc:waves` (Begrüßung → Sicherheit → Signale → los)
- **Flughafen-Check-in** – `lc:luggage`/`lc:plane` (Gepäck → Sitz → Gate)
- **Mietwagen-Übergabe** – `lc:car` (Versicherung → Tank → Unterschrift)
- **Sales-Demo / Pitch** – `lc:briefcase` (Bedarf → Demo → Follow-up)

→ Diálogos gesamt **15 → 21**. (Icon-Tokens vor Build in `icons.js` verifizieren.)

### 3.6 Neue Kurspläne (`PLANS`, scope `^curso…`)

- **`curso-bpo` „Curso call-center"** (4 Wochen): Begrüßung/Verifizierung → aktives Zuhören
  & Halten → Probleme lösen/eskalieren → Abschluss & Höflichkeit. (zieht aus `bpo-en`,
  `cliente-en`, `telefono`, `modales-en`)
- **`curso-tech` „Curso inglés para TI"** (4 Wochen): Standup/Status → Tickets & Code-Review
  → Meetings/Video-Calls → Deadlines/Reports. (`tech-en`, `videocall-en`, `reunion-en`,
  `perfecto-en`)
- **`curso-tur-pro` „Curso turismo avanzado"** (4 Wochen): Tauchen/Trekking → Flughafen/
  Mietwagen → Museum/Weintour → Notfälle/Sicherheit auf Tour.
- **`curso-gram` „Curso de gramática"** (4 Wochen): Artikel & Mengen → Zeiten/Present
  perfect → Modals & phrasal verbs → false friends & Aussprache.

### 3.7 Verbesserungen am Bestand (Qualität, nicht nur Menge)

1. **`cliente-en` schärfen**: ein paar generische Sätze sind sehr BPO-nah – nach Aufbau
   von `bpo-en` Dubletten prüfen und `cliente-en` klar auf „Ladentheke/Geschäft" fokussieren.
2. **`reunion-en` entflechten**: die Video-Call-Sätze („can you see my screen", „you cut
   out") nach `videocall-en` migrieren; `reunion-en` auf Gesprächsführung fokussieren.
3. **`tiempos-en` ergänzen**: Verweis-/Brückenkarten zu `perfecto-en` (kein Dublettenbau).
4. **`alt`-Felder nachrüsten**: gängige Antwort-Varianten (z. B. „restroom/bathroom/toilet",
   „check/bill") als `card.alt`, damit der Schreib-Modus großzügiger akzeptiert.
5. **Schwierigkeitsstufen (`lvl`) glätten**: einige neue Beruf-/Grammatik-Karten als `lvl:3`
   markieren (das Schema erlaubt 1–4, bisher nur 1–2 genutzt) → bessere Progression.
6. **Diálogos-Verzweigung** (optional, größer): aktuell linear; mittelfristig „mehrere
   akzeptable Wege" je Turn – das ist eine Engine-Erweiterung, kein reiner Content.

---

## Teil 4 — Empfohlene Reihenfolge & Umfang

Nach Markt-Hebel priorisiert, jeweils mit `npm test` + Strukturcheck + Build verifizierbar:

1. **Beruf-Tiefe (3.1)** – `bpo-en`, `tech-en`, `videocall-en` + Kurspläne `curso-bpo`,
   `curso-tech`. (Größter wirtschaftlicher Nutzen.) ~+50 Karten.
2. **Grammatik-Packs (3.4)** – `falsos-amigos`, `pronunciacion-en`, `perfecto-en`,
   `articulos-en`, `modales-en`, `phrasal-en` + `curso-gram`. (Größter Lern-Mehrwert.) ~+80 Karten.
3. **Restliche Beruf (3.1)** + **Verbesserungen (3.7)**. ~+50 Karten.
4. **Tourismus-Nischen (3.2)** + Diálogos (3.5) + `curso-tur-pro`. ~+60 Karten.
5. **Alltag/Expat-Dienste (3.3)** + restliche Mengen/Komparativ-Packs. ~+50 Karten.

Vollausbau-Ziel: **~870 Karten / ~58 Kategorien / 21 Diálogos / 7 Kurspläne** – rein
additive Daten in `data.locals.js`, plus Doku (`LOCALS.md`) und Build-Stempel.

> Diese Datei ist der buildfertige Bauplan. Umsetzung erfolgt batchweise (eine Domäne pro
> Commit, je verifiziert) – analog zum bisherigen Vorgehen.
