# Architecture

## Single-Page Application

One `index.html` with sections: Intro → Hero → About → Philosophy → Carousel → Gallery → Footer

## Animation Engine

GSAP 3.x with ScrollTrigger and ScrollToPlugin (local vendor files, no CDN).

## Scroll State Machine (Desktop)

States: `hero | about | philosophy | carousel | free`

Desktop navigation stays visible in every committed state except `carousel`, where it is intentionally hidden to let the carousel read as an immersive stage.

- hero → about → philosophy: wheel-driven text-reveal (progress 0→1)
- philosophy → carousel: snap transition
- carousel: snap section (no scroll, navigate via autoplay/swipe/keyboard)
- carousel → works: snap transition
- works/footer: free scroll

Mobile: normal document scroll, ScrollTrigger-driven reveals.

## CSS Architecture

10 modular files imported via `style.css`:
- `tokens.css` — design tokens (colors, fonts, z-index, easings)
- `global.css` — reset, utilities, grain, scroll-progress
- `nav-hero.css` — navigation, hero, loader, marquee
- `sections.css` — about, philosophy layouts
- `carousel.css` — museum wall carousel
- `gallery.css` — image grid, filters, search
- `overlays.css` — detail panel, modals, bid forms
- `responsive.css` — breakpoints, reduced-motion
- `print.css` — print styles

## JavaScript Modules

All vanilla IIFEs, no bundler. Load order:

1. **Vendor:** gsap.min.js, ScrollTrigger.min.js, ScrollToPlugin.min.js
2. **Foundation:** helpers.js, i18n.js, overlay.js
3. **Systems:** bid.js, scroll.js, loader.js
4. **Features:** carousel.js, gallery.js, nav.js, interactions.js

### Key Modules

- `helpers.js` → `window.Helpers` — shared utilities (getLang, getTitle, etc.)
- `i18n.js` → `window.i18n` — DE/EN translations
- `overlay.js` → `window.__overlay` — scroll-lock + focus trap
- `bid.js` → `window.BidSystem` — consolidated bid form (used by carousel + gallery)
- `scroll.js` → `window.Scroll` — state machine + text-reveal
- `carousel.js` → `window.HomeCarousel` — 5-phase painting animation
- `gallery.js` → `window.Gallery` — lazy-loaded grid with detail panel

## Data

`bilder-metadaten.json` — 758 artwork entries with paths, categories, titles.
All images in `assets/bilder/{category}/`.

## Offline

Zero external runtime dependencies. All assets local.
