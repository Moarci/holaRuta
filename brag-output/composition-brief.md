# Hyperframes Composition Brief: HolaRuta

## Objective
Create a short launch-style brag video for HolaRuta — a quiet premium product film in the app's own visual identity.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: vertical — 1080x1920
- Duration: 20 seconds

## Source Material
- Project root: `c:\Users\marce\Documents\GitHub\SpanischCard`
- Primary files read: `index.html`, `landing.html`, `styles.css`, `package.json`, `data.js`
- Product name: HolaRuta
- Tagline / strongest claim: „Sprich Spanisch, bevor der Bus kommt." (hero); „Reise-Spanisch für echte Situationen." (tagline)
- Key UI or visual moment to recreate: the cream flashcard on the dark-brown app frame — front „Wie viel kostet das?" flipping to „¿Cuánto cuesta?" with pronunciation tip „KUAN-to KUES-ta"; area chips (Bus · Essen · Geld · Notfall); SRS rating row (Nochmal · Gut · Einfach); the terracotta→amber map-pin logo with „¿?"
- Copy that must appear verbatim:
  - „Sprich Spanisch, bevor der Bus kommt."
  - „Wie viel kostet das?" → „¿Cuánto cuesta?" (tip: „KUAN-to KUES-ta")
  - „Nochmal · Gut · Einfach"
  - „2.293 Karten · 72 Bereiche · offline · 0 €"
  - „HolaRuta — Reise-Spanisch für echte Situationen." + `holaruta.com`

## Creative Direction
- Tone preset: polished
- Creative direction: quiet premium product film — warm terracotta identity, confidence through restraint
- Interpretation: 4 scenes, longer holds, soft crossfades (0.6–0.8s), light-to-medium type weight, generous spacing; the product's own copy does the talking; no aggressive motion.
- Angle: **The sentence is ready before the bus is.** No classroom Spanish, no account, no subscription — the exact phrase at the exact moment. The centerpiece is the real product loop: pick a situation, flip the card, rate it honestly.
- Hook: hero line on dark brown, two beat-aligned text arrivals: „Sprich Spanisch," / „bevor der Bus kommt." (line 2 in terracotta), eyebrow `REISE-SPANISCH FÜR LATEINAMERIKA` above.
- Outro / punchline: gradient map-pin logo → „HolaRuta" → „Reise-Spanisch für echte Situationen." → small `holaruta.com`. Music fades, hold, silence.
- Avoid:
  - Generic SaaS language (nothing invented; only the app's real copy)
  - Abstract filler visuals
  - Unrelated visual redesign (stay inside the terracotta/cream/brown identity)

## Visual Identity
- Background (hook/outro, outer frame): `#241510`
- App column: `#FBF3E4`; cards/tiles: `#FFFDF6`
- Text: cream `#FBF3E4` on dark; ink `#2D1B12` on light
- Accent: terracotta `#C2502E` (on dark use `#E06A40`); logo gradient `#C2502E → #E9A23B`
- Display font: Bricolage Grotesque (600–800) — self-hosted in project at `fonts/bricolage-grotesque-600-800-latin.woff2`; fallback: bold geometric sans
- Body font: Instrument Sans (400–700) — `fonts/instrument-sans-400-700-latin.woff2`; fallback: clean sans
- Visual references from the project: app bar with gradient logo + „HolaRuta" wordmark (the „Ruta" span in terracotta), thin top stripe, cream column on brown frame (design signature), map-pin logo SVG (`icon.svg` — gradient rect, cream pin path, „¿?" text)

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Hook: the hero line — 4.0s — eyebrow + „Sprich Spanisch," / „bevor der Bus kommt." (reads ≥1.2s each)
2. The card flow — 7.0s — app frame, 4 area chips one-by-one, tap „Geld", card front „Wie viel kostet das?", flip at 8.74s to „¿Cuánto cuesta?" + tip
3. Rate it + the numbers — 5.0s — rating row at 13.11s, tap „Gut", then 3 fact items sequential (~1.09s apart), all stay on screen
4. Outro — 4.0s — logo at 17.47s, wordmark, tagline, `holaruta.com`, music fade

## Audio
- Audio role: warm bed, professional restraint
- Audio arc: bed enters at 0s (0.3s fade-in), unchanged through scenes 1–3, fades out over the final ~1.5s into a silent hold.
- Music: `assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`
- Music treatment: volume 0.30–0.35 (bed, never foreground); fade-out under the final logo hold.
- Music cue guidance: bundled preset copied to `assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json` (+ `.md`). Tempo ~109.96 BPM, grid ~0.545s. Strong-cue locks (max 3): **8.74s** card flip, **13.11s** rating row, **17.47s** logo. Hook lines on beat-grid points ~1.64s / ~3.27s (±0.10s). Sequential fact items every other beat (~14.20s / ~15.29s), each ≥0.9s settled.
- Audio-reactive treatment: none — polished restraint; motion follows the storyboard, not the waveform. (Documented choice, not an extraction failure.)
- Audio-coupled moments:
  - Scene 2 card flip (8.74s) — one soft card sound
  - Scene 3 „Gut" tap (~13.6s) — one soft click/tap
  - Scene 4 logo settle (17.47s) — optional single gentle accent
- SFX selection guidance: sparse, motion-matched, polished posture (2–3 SFX total). Card families (`casino/card-place-*`, `card-slide-*`) fit the flip; `interface/click_*` or `ui/click*` fit the tap; `interface/bong_001` or `interface/drop_001` fit the logo settle. Volumes 0.55–0.70.
- SFX analysis guidance: `~/.claude/skills/brag/assets/sfx/sfx-analysis.md` — prefer low high-frequency-risk files for these polished moments.
- Exact SFX choice: Hyperframes chooses filenames, timestamps, density, and volume based on the implemented animation.
- Audio files: chosen music + Hyperframes-selected SFX are copied into `brag-output/composition/assets/`.

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — `hyperframes-core` (composition contract + `data-*` timing), `hyperframes-animation` (motion), `hyperframes-creative` (design spec, beats, audio-reactive), `hyperframes-keyframes` (seek-safe keyframes), and `hyperframes-cli` (lint/check/render). /brag is its own workflow: do not enter the `hyperframes` entry-point intent interview and do not route into its generic promo / launch-video workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Show at least one real UI, copy, or visual element from the source project.
- Keep all text readable in the final render.
- Keep the video within 15-25 seconds.
- Include the planned music/SFX layer unless audio was explicitly disabled or documented as intentionally silent.
- Treat `/brag` audio notes as guidance, not a fixed cue sheet. Choose SFX after the visual animation exists.
- Treat music cue metadata as optional timing hints. Hyperframes decides exact animation timing and should ignore cues that hurt readability, scene pacing, or the product story.
- Major reveals may move toward nearby strong cues within about 0.15s. Smaller entrances may align to nearby beat points within about 0.10s. Use only 1-3 strong cue locks in a 15-25s video unless the edit clearly benefits from more.
- Use SFX to support motion and interaction: card sounds for card-like reveals, short announcement cues for major payoffs, key/click sounds for text or user actions, and restraint when the edit is already busy.
- Honor planned music treatment such as fade-outs, ducking, beat-aligned reveals, or letting a final SFX ring over the music, using the best Hyperframes-supported implementation.
- Use local assets for audio and any required runtime/media dependencies when possible.
- Run `hyperframes check` before render — it is brag's single gate.
