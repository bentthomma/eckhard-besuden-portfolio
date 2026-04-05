# Eckhard Besuden — Maler

Portfolio-Website für den Maler Eckhard Besuden aus Allensbach am Bodensee.
One-Pager mit Osmo-Style Loader, Section-Scroll, Gallery mit 758 Werken, Detail-Panel mit Gebotsfunktion.

## Quick Start

```bash
npx serve .
```
Oder `index.html` direkt im Browser öffnen.

## Architektur

- **Vanilla JS** — kein Framework, kein Build-Prozess
- **GSAP 3.12.7** — Loader, ScrollTo, Scroll-Reveals (lokal in js/vendor/)
- **State Machine** — Section-Scroll (hero → about → philosophy → works)
- **i18n** — Client-side DE/EN mit `data-i18n` Attributen
- **Gallery** — CSS Grid (3/2 Spalten responsive), IntersectionObserver Reveals, FLIP Detail-Panel

## Dateistruktur

```
eckhard besuden/
├── index.html              Hauptseite
├── bilder-metadaten.json   Katalog aller 758 Werke
├── README.md
├── css/
│   └── style.css           Einziges Stylesheet (3-Tier Color System)
├── js/
│   ├── vendor/             GSAP 3.12.7 (lokal)
│   ├── overlay.js          Scroll-Lock State Manager + Focus Trap
│   ├── loader.js           Osmo-Style Loader Animation
│   ├── scroll.js           Scroll State Machine + Text Reveal
│   ├── nav.js              Navigation + Mobile Menu + Modals
│   ├── interactions.js     Magnetic Hover, Loupe, Fullscreen, Email
│   ├── gallery.js          Grid, Filter, Search, Detail, Bid-System
│   └── i18n.js             Deutsch/Englisch Übersetzungen
├── assets/
│   ├── fonts/              Cormorant Garamond + Inter (lokal)
│   └── bilder/
│       ├── abstrakt/       409 Werke
│       ├── tiere/          137 Werke
│       ├── frauen/          65 Werke
│       ├── seebilder/       59 Werke
│       ├── blumen/          44 Werke
│       ├── sonstige/        44 Werke
│       ├── schluesselwerke/ 10 Werke (Loader + Hero)
│       └── portrait/         5 Fotos
├── docs/                   Planungsdokumente, Style Guide
├── reference/              Osmo-Loader Referenz, Test-Dateien
└── backup/                 Timestamped Backups
```

## Farbsystem (3-Tier Museum Architecture)

| Tier | Variable | Hex | Verwendung |
|------|----------|-----|------------|
| Gallery Light | `--gallery-bg` | #F3F0EA | Seiten-Hintergrund, Navigation |
| Artwork Stage | `--stage-bg` | #E8DDC9 | Sections mit Bildern |
| Focus View | `--focus-bg` | #2B2925 | Detail-Panel, Fullscreen |

## Scroll-System

State Machine mit 4 Zuständen: `hero` → `about` → `philosophy` → `free`
- In `hero/about/philosophy`: `preventDefault` blockt nativen Scroll, `flyTo()` navigiert
- In `about/philosophy`: Wheel-Delta treibt Text-Reveal-Timeline vorwärts (nie rückwärts)
- In `free` (Werke): Normales Browser-Scrolling, Scroll-Up am Top fliegt zurück

## Deployment

1. `og:image` in index.html auf absolute URL mit Domain setzen
2. Favicon in `assets/favicon/` anlegen und `<link>` Tags ergänzen
3. Bilder optional zu WebP/AVIF konvertieren für Performance
