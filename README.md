# Eckhard Besuden

Static portfolio site for the painter Eckhard Besuden. No build step, no framework.

## Tech

- HTML, CSS, vanilla JavaScript
- GSAP 3.x (ScrollTrigger, ScrollToPlugin) vendored in `js/vendor/`
- Data: `bilder-metadaten.json` (758 artworks)

## Run locally

```bash
python -m http.server 8000
```

Open `http://127.0.0.1:8000` — `file://` will not work because the gallery fetches JSON via `fetch()`.

## Project structure

```text
.
├── index.html                  Single-page entry point
├── bilder-metadaten.json       Artwork metadata (758 records)
├── css/
│   ├── style.css               Import hub (loads the three below)
│   ├── base.css                Tokens, reset, layout, all components
│   ├── carousel.css            Carousel-specific styles
│   └── gallery-extras.css      Lazy-load button states
├── js/
│   ├── vendor/
│   │   ├── gsap.min.js
│   │   ├── ScrollTrigger.min.js
│   │   └── ScrollToPlugin.min.js
│   ├── helpers.js              Shared utilities (translate, getTitle, etc.)
│   ├── i18n.js                 DE/EN translations, language switcher
│   ├── overlay.js              Scroll-lock and overlay stack manager
│   ├── bid.js                  Contact/bid modal form
│   ├── text-reveal.js          Character-by-character text animation
│   ├── scroll-ui.js            Progress bar, scroll reveals, dividers
│   ├── scroll.js               Desktop scroll state machine
│   ├── loader.js               Film-strip intro animation
│   ├── carousel.js             Featured-works carousel
│   ├── detail.js               Artwork detail panel + FLIP animations
│   ├── gallery.js              Works grid, filters, search
│   ├── nav.js                  Navigation bar behavior
│   └── interactions.js         Miscellaneous UI bindings
├── assets/
│   ├── bilder/                 Artwork images (by category)
│   └── fonts/                  Cormorant Garamond + Inter (woff2/ttf)
└── docs/
    ├── ARCHITECTURE.md
    ├── STYLE-GUIDE.md
    ├── SCRIPT-LOAD-ORDER.md
    └── I18N.md
```

## Architecture

Single-page site. Sections flow: Hero, About, Philosophy, Carousel, Works, Footer.

On desktop, `scroll.js` runs a state machine (`hero → about → philosophy → carousel → free`) that flies between sections with GSAP ScrollTo. On mobile, native scroll throughout; the carousel uses JS-based IntersectionObserver snapping (no CSS scroll-snap).

Modules communicate via `window.*` globals: `HomeCarousel`, `Gallery`, `BidSystem`, `i18n`, `Helpers`, `__overlay`.

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Style Guide](docs/STYLE-GUIDE.md)
- [Script Load Order](docs/SCRIPT-LOAD-ORDER.md)
- [Internationalization](docs/I18N.md)
