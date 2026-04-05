# Architektur — Eckhard Besuden

> Technische Übersicht für Entwickler die das Projekt übernehmen.

## Stack

- **Vanilla JS** — kein Framework, kein Build-System
- **GSAP 3.12.7** — lokal in `js/vendor/` (kein CDN)
- **Fonts** — lokal in `assets/fonts/` (kein Google Fonts API)
- **Null externe Abhängigkeiten** — funktioniert komplett offline

## Modul-Übersicht

```
index.html
  ├── css/style.css          Einziges Stylesheet
  │
  ├── js/vendor/gsap.min.js  Animation Engine
  ├── js/vendor/ScrollTrigger.min.js
  ├── js/vendor/ScrollToPlugin.min.js
  │
  ├── js/i18n.js             Sprachsystem (DE/EN)
  ├── js/overlay.js          Scroll-Lock + Focus Trap
  ├── js/scroll.js           Scroll State Machine
  ├── js/loader.js           Osmo-Style Loader
  ├── js/nav.js              Navigation + Modals
  ├── js/interactions.js     Hover, Loupe, Fullscreen, etc.
  └── js/gallery.js          Galerie + Detail + Bid
```

## Script-Ladereihenfolge

Die Reihenfolge ist kritisch — jedes Modul hat Abhängigkeiten:

1. `gsap.min.js` — Basis
2. `ScrollTrigger.min.js` — braucht GSAP
3. `ScrollToPlugin.min.js` — braucht GSAP
4. `i18n.js` — unabhängig, setzt `window.i18n`
5. `overlay.js` — setzt `window.__overlay` + `window.__reduced`
6. `scroll.js` — braucht GSAP + ScrollTrigger, setzt `window.Scroll`
7. `loader.js` — braucht `window.__overlay`, `window.__reduced`
8. `nav.js` — braucht `window.__overlay`, `window.Scroll`
9. `interactions.js` — braucht GSAP, `window.__reduced`
10. `gallery.js` — braucht GSAP, `window.__overlay`, `window.i18n`

## Kommunikation zwischen Modulen

Kein Modul importiert ein anderes direkt. Kommunikation läuft über `window`:

| Symbol | Gesetzt von | Gelesen von |
|--------|------------|-------------|
| `window.__overlay` | overlay.js | loader.js, nav.js, gallery.js |
| `window.__reduced` | overlay.js | loader.js, interactions.js |
| `window.Scroll` | scroll.js | nav.js |
| `window.i18n` | i18n.js | gallery.js |

## Scroll-System (Desktop)

State Machine mit 4 Zuständen:

```
hero → about → philosophy → free (Gallery)
  ↑       ↑         ↑          |
  └───────┴─────────┴──────────┘ (Scroll-Up)
```

- `hero/about/philosophy`: `preventDefault` blockiert nativen Scroll. Wheel-Delta treibt Text-Reveal-Timeline.
- `free` (Gallery): Normaler Browser-Scroll. Scroll-Up am Top fliegt zurück zu Philosophy.
- `flyTo()` animiert Viewport-Wechsel per GSAP scrollTo.

## Scroll-System (Mobile)

Kein State Machine. Normaler Scroll + ScrollTrigger `scrub` für Text-Reveals.

## Overlay-System

Zentraler Stack in `overlay.js`:

```
pushOverlay('loader')     → body.overflow = hidden
pushOverlay('detail', el) → Focus Trap aktiviert
popOverlay('detail')      → Focus released
popOverlay('loader')      → body.overflow = '' (Stack leer)
```

Mehrere Overlays können gleichzeitig offen sein. Scroll wird erst freigegeben wenn ALLE geschlossen sind.

## Galerie-Datenfluss

```
bilder-metadaten.json
  → fetch()
  → allImages[]
  → applyFilters() → filteredImages[]
  → renderBatch() → createGalleryItem()
  → DOM: .gallery__item (role=button, tabindex=0)
  → Click/Enter → flipOpenDetail() → FLIP Clone → Detail Panel
  → Close → Reverse FLIP → finishClose()
```

## CSS-System

3-Tier Museum-Farbarchitektur:
- **Gallery Light** (`--gallery-bg: #F3F0EA`) — Seiten-Hintergrund
- **Artwork Stage** (`--stage-bg: #E8DDC9`) — Gallery-Section
- **Focus View** (`--focus-bg: #2B2925`) — Detail-Panel

Spacing-Skala: `0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3` rem

Transition-Skala: `0.3, 0.4, 0.5, 0.8, 1.2` Sekunden

Responsive: Desktop-First mit Breakpoints bei 1024px, 768px, 480px + Landscape.
