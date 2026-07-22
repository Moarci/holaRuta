# Freunde einladen per QR-Code & Link

Datum: 2026-07-22

## Problem

Freund:innen zur Tages-Rangliste hinzuzufügen erfordert heute, den Textcode
`HRF1.<base64>` zu kopieren, zu verschicken und beim Gegenüber in einen
`window.prompt` einzufügen. Das ist umständlich – besonders, wenn beide
nebeneinander sitzen.

## Ziel

Einladen ohne Code-Kopieren: ein QR-Code für „wir sitzen nebeneinander" und
derselbe Einladungslink zum Verschicken (WhatsApp, Mail).

## Entscheidungen

| Frage | Entscheidung |
| --- | --- |
| Szenario | QR **und** Einladungslink |
| Scannen | Nur native Kamera-App (kein In-App-Scanner, kein Decoder-Code) |
| Link-Inhalt | Bestehender `HRF1.`-Code – kein Backend-Change, kein neues Schema |
| Link öffnen | Nachfragen, dann hinzufügen (nicht stillschweigend) |
| UI | QR prominent, `HRF1.`-Text versteckt, manueller Weg als Fallback |
| QR-Erzeugung | Eigenes Modul `qr.js` + Tests (keine Runtime-Dependencies) |

## Architektur

### 1. `qr.js` – neues, entkoppeltes Modul (`window.SC.qr`)

Reiner Encoder, kein DOM, keine Abhängigkeiten:

- `matrix(text)` → `{ size, modules: boolean[][] }`
  Byte-Mode, ECC-Level M, kleinste passende Version (1–10), Reed-Solomon über
  GF(256), alle 8 Masken mit Penalty-Bewertung nach ISO/IEC 18004.
- `svg(text, opts)` → SVG-String: ein `<path>` in `currentColor` auf weißem
  Grund inkl. 4 Module Quiet-Zone, `shape-rendering="crispEdges"`, skaliert
  über `viewBox` (scharf in jeder Größe, kein Canvas, kein Base64).

Verdrahtung wie andere Module: `<script src="qr.js">` in `index.html` **vor**
`ui.js`/`app.js` und Eintrag in der ASSETS-Liste von `service-worker.js`.

### 2. Einladungslink

`socialInviteUrl()` in `app.js`:
`location.origin + location.pathname + "?amigo=" + encodeURIComponent(code)`
aus dem bereits geladenen `state.social.code`. Der Server versteht `HRF1.…`
bereits über `POST /v1/friends` – keine Backend-Änderung.

### 3. Link öffnen (Empfänger-Seite)

Beim Start liest der bestehende `urlParam("amigo")` den Code (deckt `?`- und
`#`-Form ab); `stripUrlParam("amigo")` räumt die Adresszeile auf.

- **Eingeloggt** → Freunde-Screen öffnen, Rückfrage „Einladung annehmen?" →
  `social.addFriend(code)` → Refresh + Toast.
- **Nicht eingeloggt** → Code in `state.social.pendingInvite` merken,
  Login-CTA zeigen; nach erfolgreichem Login automatisch einlösen.
- **Ungültig / eigener Code / unbekannt** → klare Meldung, kein stiller
  Fehlschlag.

### 4. UI (`ui.js` `renderSocial`)

Aus der Code-Karte wird eine Einladungskarte:

- QR-Code (SVG, ~180 px, `role="img"` + `aria-label`)
- `↗ Einladung teilen` (Web-Share mit Link, Fallback: Link kopieren)
- `⧉ Link kopieren`
- kleiner Textlink „Code manuell eingeben" (bisheriger Prompt-Weg)
- `＋ Freund:in hinzufügen` bleibt

Der `HRF1.`-Text ist nicht mehr sichtbar.

View-Model-Vertrag (`socialVM()` in `app.js`):
`{ …bisher, inviteUrl: string, inviteQr: string /* SVG oder "" */ }`
`ui.js` bekommt keine neue Abhängigkeit – der QR kommt fertig gerendert an.

Neue `data-action`-Werte: `social-share-invite`, `social-copy-link`.

### 5. i18n

Neue Keys unter `social.*` in `i18n.strings.js` (de + en):
`inviteCap`, `inviteHint`, `qrAlt`, `shareInvite`, `copyLink`, `linkCopied`,
`manualCode`, `inviteConfirm`, `inviteLoginNeeded`, `inviteBad`, `inviteSelf`,
`shareInviteMsg`. (`i18n.strings.es.js` enthält keinen `social`-Block – keine
Änderung nötig.)

### 6. Datenschutz

`datenschutz.html` §6: Hinweis auf Freundes-Codes um Einladungslink/QR
ergänzen – gleiche Daten, neuer Transportweg.

## Tests

- `test/qr.test.js`: Encoder gegen bekannte Referenz-Matrizen, Versions-/
  Kapazitätsauswahl, Format-Info-Bits, Maskenwahl, `svg()`-Struktur.
- `test/social.test.js` (Erweiterung): Bau der Invite-URL und Roundtrip
  `inviteUrl → urlParam → parseFriendCode`.

Alles `node --test`, keine Browser-Abhängigkeit.

## Nicht in diesem Umfang (YAGNI)

- Ablaufende/widerrufbare Einladungstoken (neue Tabelle, neue Endpunkte)
- In-App-QR-Scanner (BarcodeDetector) – die native Kamera genügt
- QR-Versionen > 10, ECC-Level außer M, Kanji-/Numeric-Modus
