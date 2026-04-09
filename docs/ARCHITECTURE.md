# Architecture

## Single-page layout

One HTML file (`index.html`) with five content sections identified by ID:

| Section      | ID            | Purpose                              |
|-------------|---------------|--------------------------------------|
| Hero        | `#hero`       | Full-viewport splash with portrait   |
| About       | `#about`      | Biography text + photo               |
| Philosophy  | `#philosophy` | Antideterminism statement            |
| Carousel    | `#carousel`   | Curated featured works               |
| Works       | `#works`      | Full gallery grid (lazy-loaded)      |

Footer, detail panel, fullscreen overlay, and legal modals sit outside `<main>`.

## Scroll behavior

**Desktop** -- `scroll.js` implements a state machine with five states:
`hero | about | philosophy | carousel | free`. GSAP `ScrollToPlugin` flies between sections on wheel/touch input. The `about` and `philosophy` states drive character-by-character text reveal timelines (implemented in `text-reveal.js`) before advancing. Progress bar, scroll reveals, and divider animations live in `scroll-ui.js`. Once past the carousel the page enters `free` state with native scrolling.

**Mobile** -- Native scroll throughout. The carousel uses JS-based IntersectionObserver snapping (no CSS scroll-snap).

## Animation engine

GSAP 3.x with two plugins:
- **ScrollTrigger** -- reveal animations, nav state changes, progress bar
- **ScrollToPlugin** -- programmatic section-to-section fly transitions

All three files are vendored in `js/vendor/` (no CDN dependency).

## Module communication

Scripts attach to `window.*` globals rather than using ES modules:

| Global             | Source         | Role                                |
|-------------------|----------------|-------------------------------------|
| `window.Helpers`  | helpers.js     | Translation, title/technique getters |
| `window.i18n`     | i18n.js        | Language state, `t()` lookup, `setLanguage()` |
| `window.__overlay`| overlay.js     | Scroll-lock stack for modals/panels |
| `window.__reduced`| overlay.js     | `prefers-reduced-motion` flag       |
| `window.HomeCarousel` | carousel.js | Carousel public API                 |
| `window.Gallery`  | gallery.js     | Gallery grid, filter, search API    |
| `window.Detail`   | detail.js      | Artwork detail panel + FLIP API     |
| `window.BidSystem`| bid.js         | Bid modal opener                    |
| `window.Scroll`   | scroll.js      | `flyTo()`, `navigateTo()` for nav   |

## CSS architecture

`style.css` is an import hub that loads three stylesheets in order:
1. **base.css** -- tokens, reset, typography, all component styles (consolidated)
2. **carousel.css** -- carousel-specific layout and animation
3. **gallery-extras.css** -- lazy-load expand button states

## Data

`bilder-metadaten.json` -- 758 artwork entries with paths, categories, titles (DE/EN).
All images in `assets/bilder/{category}/`. Fetched at runtime by `gallery.js` and `carousel.js`.

## Offline

Zero external runtime dependencies. All assets local (fonts, images, GSAP, JSON).
