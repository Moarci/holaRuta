# Mitwirken an HolaRuta

Kurz & praktisch — die wenigen Konventionen, die das Projekt einfach, schnell
und konfliktarm halten. (Solo-Projekt, aber die Disziplin zahlt sich aus.)

## Workflow

- **Nicht direkt auf `main` pushen.** `main` ist geschützt (erforderlicher
  Status-Check **`test`**) und wird bei jedem Merge automatisch nach
  GitHub Pages deployt.
- **Kleine, kurzlebige Branches, häufig mergen.** Ein Branch = ein Thema.
  Große, lang lebende Branches vermeiden — die erzeugen genau die Merge-,
  Versions- und Stückelungs-Not, die wir einmal hatten.
- Pro Änderung: Branch von `main` → PR → grüner `test`-Check → Merge.

## Tests & Build

- `node --test` **muss grün bleiben** — läuft lokal und als PR-Gate.
- **Kein Runtime-Build:** Die App ist rohes HTML/CSS/JS. `index.html` direkt
  öffnen genügt; die Module hängen sich an `window.SC`.
- **Generierte Artefakte:**
  - `HolaRuta.html` (eigenständige Versand-Einzeldatei) ist **nicht
    eingecheckt** (`.gitignore`) — CI baut sie beim Deploy und stellt sie unter
    `https://moarci.github.io/holaRuta/HolaRuta.html` bereit. Lokal bei Bedarf
    `node build.js`.
  - `service-worker.js` trägt die gestempelte `CACHE_VERSION`. Wenn du Assets
    änderst: `node build.js` ausführen und das aktualisierte
    `service-worker.js` **mitcommitten** (der `test`-Job prüft den Sync).
  - `sitemap.xml`, `robots.txt`, `llms.txt` und `seo/geo-manifest.json` sind
    Ausgaben der GEO/SEO-Pipeline ([`scripts/geo/`](scripts/geo/), siehe
    README-Abschnitt „SEO & GEO") — nie von Hand editieren. Änderst du
    `data.js`, `countries.js` oder `data.locals.js`, regeneriert
    `node build.js --dist` sie automatisch; die aktualisierten Dateien
    **mitcommitten**.

## Inhalte (Karten)

- **Neue Karte:** ans passende Array in [`data.js`](data.js) anhängen (`lvl`
  nicht vergessen), den Reise-Kontext nach [`contextdata.js`](contextdata.js).
- **Neue Kategorie:** oben in `CATEGORIES` ergänzen — sie erscheint automatisch
  im Raster ihrer Gruppe (datengetrieben, kein Sonderfall-Code).
- **Anführungszeichen-Konvention:** Deutsch `„…“`, Englisch `'…'` (bzw. `“…”`
  in i18n-UI-Strings), Spanisch `'…'`. Keine deutschen Quotes in englischen
  Feldern.
- Die Auto-Checks der Test-Suite sichern die Qualität: 0 ID-Dubletten,
  100 % Kontext-Abdeckung, ausgewogene `¿?`/`¡!`.

## Versionierung & Changelog

- **[`changelog.js`](changelog.js) ist die einzige Quelle der Wahrheit** für die
  Version: `entries[0].version` ist die App-Version (`SC.changelog.VERSION`).
- Neue Einträge **oben** einfügen, **datumsabsteigend** und **zweisprachig**
  (`title`+`titleEn`, `items`+`itemsEn` gleich lang) — ein Test erzwingt das.
- Ein **konsistentes SemVer-Schema** sauber fortführen (eine Linie, nicht
  divergieren lassen). `package.json`-Version = `changelog.VERSION` halten.

## Commits

- [Conventional Commits](https://www.conventionalcommits.org/):
  `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `build:`, `ci:`.
