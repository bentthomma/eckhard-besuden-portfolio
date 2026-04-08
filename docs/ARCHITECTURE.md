# Architecture

## Single-Page Application

One `index.html` with sections: Intro → Hero → About → Philosophy → Carousel → Gallery → Footer

## Animation Engine

GSAP 3.x with ScrollTrigger and ScrollToPlugin (local vendor files, no CDN).

## Scroll Behavior

**Desktop:** GSAP state machine with wheel-driven section snapping.
States: `hero | about | philosophy | carousel | free`

- hero → about → philosophy: wheel-driven text-reveal (progress 0→1)
- philosophy → carousel: snap transition
- carousel: snap section (navigate via autoplay/swipe/keyboard)
- carousel → works: snap transition
- works/footer: free scroll

**Mobile/Tablet:** Native browser scroll with ScrollTrigger-driven reveals. JS-based carousel snap via IntersectionObserver (devices < 1200px).

## CSS Architecture

3 files imported via `style.css`:
- `base.css` — complete stable styles (reset, layout, nav, hero, sections, gallery, detail, modals, responsive, print)
- `carousel.css` — carousel section (museum wall, slides, plaque, animations, responsive)
- `gallery-extras.css` — gallery lazy-load button states, works-hidden utility

## JavaScript Modules

All vanilla IIFEs, no bundler. Load order:

1. **Vendor:** gsap.min.js, ScrollTrigger.min.js, ScrollToPlugin.min.js
2. **Foundation:** helpers.js, i18n.js, overlay.js
3. **Systems:** bid.js, scroll.js, loader.js
4. **Features:** carousel.js, gallery.js, nav.js, interactions.js

### Key Modules

- `helpers.js` → `window.Helpers` — shared artwork data utilities
- `i18n.js` → `window.i18n` — DE/EN translations
- `overlay.js` → `window.__overlay` — scroll-lock + focus trap
- `bid.js` → `window.BidSystem` — consolidated contact form
- `scroll.js` → `window.Scroll` — state machine + text-reveal + carousel snap
- `loader.js` — film-strip intro animation
- `carousel.js` → `window.HomeCarousel` — 5-phase painting animation
- `gallery.js` → `window.Gallery` — lazy-loaded grid with detail panel
- `nav.js` — navigation + legal modals
- `interactions.js` — magnetic hover, loupe, fullscreen, email, back-to-top

## Data

`bilder-metadaten.json` — 758 artwork entries with paths, categories, titles.
All images in `assets/bilder/{category}/`.

## Offline

Zero external runtime dependencies. All assets local (fonts, images, GSAP, JSON).
