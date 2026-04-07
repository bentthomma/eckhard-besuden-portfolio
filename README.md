# Eckhard Besuden

Static portfolio site for the painter Eckhard Besuden.

The repo now runs as a simple two-page website:

- `index.html` is the editorial homepage.
- `gallery.html` is the dedicated works archive.

There is no build step and no framework. The site is intentionally small, but it still has a clear runtime structure, a content contract, and a repeatable smoke-test flow.

## Run locally

Use a local HTTP server. Direct `file://` loading is not a supported workflow because the gallery reads `bilder-metadaten.json` via `fetch()`.

```bash
python -m http.server 4173
```

Open:

- `http://127.0.0.1:4173/index.html`
- `http://127.0.0.1:4173/gallery.html`

## Smoke check

The fastest repo-native browser check is:

```bash
python scripts/visual_smoke.py
```

To also capture the current reference surfaces as screenshots:

```bash
python scripts/visual_smoke.py --screenshots
```

Manual spot checks are still useful before shipping changes:

1. Homepage loads, intro clears, hero nav becomes usable.
2. `#about`, `#philosophy`, and `#works` anchors land on readable content.
3. Gallery title, filters, and search render cleanly on mobile and desktop.
4. Gallery search and category filters still update the grid.
5. Artwork detail overlay opens from both the homepage carousel and the gallery grid.
6. Legal modals, mobile menu, fullscreen image mode, and language switch still work.
7. Back-to-top is visible after the works section and returns to the hero.
8. Console stays clean apart from expected local dev noise.

## Project structure

```text
.
|-- index.html
|-- gallery.html
|-- bilder-metadaten.json
|-- css/
|   |-- style.css
|   |-- tokens.css
|   |-- global.css
|   |-- nav-hero.css
|   |-- sections.css
|   |-- carousel.css
|   |-- gallery.css
|   |-- overlays.css
|   `-- responsive.css
|-- js/
|   |-- runtime/
|   |-- i18n.js
|   |-- overlay.js
|   |-- intro-sequence.js
|   |-- nav.js
|   |-- scroll.js
|   |-- interactions.js
|   |-- home-carousel.js
|   |-- gallery.js
|   `-- artwork-overlay.js
|-- assets/
|-- scripts/
|   `-- visual_smoke.py
`-- docs/
```

## Architecture summary

- `overlay.js` owns scroll locking and focus trapping for modal-like UI.
- `scroll.js` keeps scroll native and only adds reveal, nav-state, progress, and carousel-entry behavior.
- `home-carousel.js` owns the homepage featured-works stage.
- `gallery.js` owns the standalone gallery page grid, filters, and search.
- `artwork-overlay.js` is the shared work-detail controller used by both entry points.
- `i18n.js` is the single translation source for visible UI copy.

The files under `js/runtime/` are vendored motion runtime files used by the authored modules. They are treated as checked-in runtime dependencies. If they need to be updated, replace them deliberately and rerun the smoke checks above.

`docs/RUNTIME-PROVENANCE.md` is the source of truth for the active runtime contract and the update procedure for `js/runtime/`.

## Data and content

`bilder-metadaten.json` is the canonical works dataset. See `docs/DATA-CONTRACT.md` for expected fields and update rules.

## Quality tracking

The current consolidated frontend improvement list lives in `WORLD_CLASS_BACKLOG.md`.

## Known implementation choices

- Bid actions are placeholder flows only. They currently store draft submissions in `localStorage["besuden_bids"]`.
- The homepage carousel is intentionally separate from the gallery archive. The homepage shows a curated subset; the gallery page is the full browsing surface.
- Styling is split into layered CSS files so layout, components, overlays, and responsive rules can be reviewed independently.
