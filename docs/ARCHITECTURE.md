# Architecture

This repo is a static two-page site with shared UI controllers.

## Entry points

- `index.html`
  Homepage with hero, biography, philosophy, and featured works carousel.
- `gallery.html`
  Dedicated archive page with filters, search, and the shared detail overlay.

There is intentionally no SPA router anymore. Navigation between homepage and gallery is plain document navigation.

## Runtime layers

### 1. Vendor runtime

Files in `js/runtime/` are the minimal vendored motion runtime used by the authored scripts:

- `motion-core.min.js`
- `motion-aliases.js`

These files are treated as repository-local runtime dependencies. The repo does not currently contain a rebuild pipeline for them, so updates should be done deliberately and verified manually.

See `docs/RUNTIME-PROVENANCE.md` for the active version/provenance note, the exact authored contract, and the update checklist.

### 2. Authored controllers

- `js/i18n.js`
  Translation state, HTML text replacement, and document meta updates.
- `js/overlay.js`
  Overlay stack, scroll lock, and focus trap.
- `js/intro-sequence.js`
  Homepage intro handoff into the hero.
- `js/nav.js`
  Mobile navigation and legal modals.
- `js/scroll.js`
  Native-scroll enhancements: reveal observers, nav state, scroll progress, and homepage carousel entry trigger.
- `js/interactions.js`
  Email obfuscation, loupe, fullscreen image mode, and back-to-top behavior.
- `js/home-carousel.js`
  Featured works stage on the homepage.
- `js/gallery.js`
  Gallery page data load, grid rendering, filter logic, and search.
- `js/artwork-overlay.js`
  Shared artwork detail overlay used by both the homepage carousel and the gallery grid.

## Global contracts

The authored scripts are still vanilla IIFEs, so a few globals remain by design:

- `window.i18n`
- `window.__overlay`
- `window.__reduced`
- `window.HomeCarousel`
- `window.ArtworkOverlay`
- `window.Scroll`

These are the intended public surfaces. New global contracts should not be added casually.

## Styling layers

The stylesheet is split into reviewable layers:

- `css/tokens.css`
- `css/global.css`
- `css/nav-hero.css`
- `css/sections.css`
- `css/carousel.css`
- `css/gallery.css`
- `css/overlays.css`
- `css/responsive.css`

`css/style.css` is only the import manifest.

## Shared UI model

- The homepage carousel and the gallery grid both resolve works from `bilder-metadaten.json`.
- Both entry points open the same detail overlay controller.
- Bid interactions are placeholder client-side flows only and write to `localStorage["besuden_bids"]`.

## Change guidance

Prefer changes in this order:

1. Update content or markup.
2. Adjust the smallest relevant CSS layer.
3. Touch only the owning JS controller.
4. Run `python scripts/visual_smoke.py`.

If a change needs more than one JS controller, stop and check whether a hidden coupling should be simplified first.
