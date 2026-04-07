# Carousel Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the stable GitHub base (GSAP, single-page, working scroll state-machine) with a cleanly reimplemented carousel feature, lazy-loading gallery, and consolidated bid system.

**Architecture:** GitHub-Stable (`_github-stable/`) provides the foundation — GSAP-based scroll state-machine, film-strip loader, gallery with detail panel. We add a carousel section (5-phase painting animation on GSAP), convert gallery to lazy-load-on-click, extract shared helpers and bid logic into dedicated modules. All vanilla IIFEs, no bundler, zero external runtime dependencies.

**Tech Stack:** HTML5, CSS3 (Custom Properties, Grid, Flexbox), JavaScript ES5 IIFEs, GSAP 3.x (local vendor), bilder-metadaten.json (758 images)

**Spec:** `docs/2026-04-07-carousel-merge-design.md`

**Reference codebase:** `_github-stable/` (stable GitHub clone, read-only reference)

---

## File Map

### Files to CREATE (new)

| File | Responsibility |
|------|---------------|
| `css/tokens.css` | CSS custom properties: colors, fonts, spacing, easings, z-index map |
| `css/global.css` | Reset, body, focus styles, skip-link, grain overlay, scrollbar, utilities |
| `css/nav-hero.css` | Nav, hamburger, mobile-menu, hero section, marquee, loader styles |
| `css/sections.css` | About (editorial grid), philosophy (split-screen) layout |
| `css/carousel.css` | Carousel section, plaque, pause button, slide scene, museum wall bg |
| `css/gallery.css` | Gallery grid, filter buttons, search, collapsed/expanded states |
| `css/overlays.css` | Detail panel, fullscreen overlay, modals, bid form, flip-clone |
| `css/responsive.css` | All breakpoints: 1024px, 768px, 560px, 480px, landscape, reduced-motion |
| `css/print.css` | Print-specific styles |
| `js/helpers.js` | Shared utilities: getLang, getTitle, getTechnique, getDimensions, etc. |
| `js/bid.js` | Consolidated bid system: create, show, hide, submit, getAll |
| `js/carousel.js` | Carousel: data loading, slide generation, 5-phase GSAP animation, autoplay, swipe |
| `assets/gallery-bg.webp` | Converted museum wall background (~300-400 KB) |

### Files to MODIFY (from `_github-stable/` as base)

| File | Changes |
|------|---------|
| `css/style.css` | Replace content with @import hub for all CSS files |
| `index.html` | Add carousel section, modify gallery to collapsed state, update script tags, add WOFF2 fonts, fix a11y attributes |
| `js/i18n.js` | Add carousel/gallery/bid translation keys |
| `js/overlay.js` | Add isOpen(), top() methods, .isConnected focus-restore check |
| `js/scroll.js` | Add 'carousel' state to state-machine, update free-state return target |
| `js/gallery.js` | Add collapsed/loading/expanded states, public API, accept external items for detail |
| `js/nav.js` | Fix aria attributes, add type="button", improve hamburger label |
| `js/interactions.js` | Fix touch detection, MutationObserver leak, responsive loupe |
| `js/loader.js` | Minor: update class names if needed (verify 1:1 from stable) |

### Files to DELETE (after all phases complete)

| File | Reason |
|------|--------|
| `js/runtime/motion-core.min.js` | Replaced by GSAP |
| `js/runtime/viewport-driver.min.js` | Replaced by ScrollTrigger |
| `js/runtime/anchor-driver.min.js` | Replaced by ScrollToPlugin |
| `js/runtime/motion-aliases.js` | Replaced by GSAP |
| `js/artwork-overlay.js` | Logic moved back into gallery.js |
| `js/home-carousel.js` | Replaced by carousel.js |
| `js/intro-sequence.js` | Replaced by loader.js |
| `gallery.html` | Eliminated (single-page) |
| `_github-stable/` | Reference folder, no longer needed |

---

## Phase 1: Foundation

### Task 1.1: Copy stable base and set up project structure

**Files:**
- Overwrite: `index.html` (from `_github-stable/index.html`)
- Overwrite: `js/i18n.js` (from `_github-stable/js/i18n.js`)
- Overwrite: `js/overlay.js` (from `_github-stable/js/overlay.js`)
- Overwrite: `js/scroll.js` (from `_github-stable/js/scroll.js`)
- Overwrite: `js/loader.js` (from `_github-stable/js/loader.js`)
- Overwrite: `js/nav.js` (from `_github-stable/js/nav.js`)
- Overwrite: `js/interactions.js` (from `_github-stable/js/interactions.js`)
- Overwrite: `js/gallery.js` (from `_github-stable/js/gallery.js`)
- Verify: `js/vendor/gsap.min.js`, `js/vendor/ScrollTrigger.min.js`, `js/vendor/ScrollToPlugin.min.js` exist
- Verify: `assets/fonts/*.woff2` files exist (from current version)
- Verify: `bilder-metadaten.json` exists
- Verify: `assets/gallery-bg.png` exists

- [ ] **Step 1: Copy all JS files from _github-stable**

```bash
cp _github-stable/js/i18n.js js/i18n.js
cp _github-stable/js/overlay.js js/overlay.js
cp _github-stable/js/scroll.js js/scroll.js
cp _github-stable/js/loader.js js/loader.js
cp _github-stable/js/nav.js js/nav.js
cp _github-stable/js/interactions.js js/interactions.js
cp _github-stable/js/gallery.js js/gallery.js
```

- [ ] **Step 2: Copy index.html from _github-stable**

```bash
cp _github-stable/index.html index.html
```

- [ ] **Step 3: Copy GSAP vendor files from _github-stable**

```bash
mkdir -p js/vendor
cp _github-stable/js/vendor/gsap.min.js js/vendor/gsap.min.js
cp _github-stable/js/vendor/ScrollTrigger.min.js js/vendor/ScrollTrigger.min.js
cp _github-stable/js/vendor/ScrollToPlugin.min.js js/vendor/ScrollToPlugin.min.js
```

- [ ] **Step 4: Verify WOFF2 fonts exist**

Check that these files exist (they come from the current version, not _github-stable):
```
assets/fonts/cormorant-garamond-300.woff2
assets/fonts/cormorant-garamond-300i.woff2
assets/fonts/cormorant-garamond-400.woff2
assets/fonts/inter-300.woff2
assets/fonts/inter-400.woff2
```
If any are missing, they need to be obtained before proceeding.

- [ ] **Step 5: Verify the site loads**

Run: `python -m http.server 8000` in the project root.
Open `http://localhost:8000` in Chrome.
Expected: Stable site loads — loader animation, hero, about, philosophy, gallery, footer. Console: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: restore stable GitHub base as foundation for carousel merge"
```

---

### Task 1.2: Create CSS tokens file

**Files:**
- Create: `css/tokens.css`

This file contains all CSS custom properties: colors, fonts, spacing, easings, z-index layers. Extracted from `_github-stable/css/style.css` lines 24-47 (color tokens) plus new z-index map and easing tokens.

- [ ] **Step 1: Create tokens.css**

```css
/* ============================================
   TOKENS.CSS — Design tokens: colors, fonts, spacing, easings, z-index
   ============================================ */

/* ---------- LOCAL FONTS ---------- */
@font-face {
  font-family: 'Cormorant Garamond';
  font-weight: 300;
  font-style: normal;
  font-display: swap;
  src: url('../assets/fonts/cormorant-garamond-300.woff2') format('woff2'),
       url('../assets/fonts/cormorant-garamond-300.ttf') format('truetype');
}
@font-face {
  font-family: 'Cormorant Garamond';
  font-weight: 300;
  font-style: italic;
  font-display: swap;
  src: url('../assets/fonts/cormorant-garamond-300i.woff2') format('woff2'),
       url('../assets/fonts/cormorant-garamond-300i.ttf') format('truetype');
}
@font-face {
  font-family: 'Cormorant Garamond';
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url('../assets/fonts/cormorant-garamond-400.woff2') format('woff2'),
       url('../assets/fonts/cormorant-garamond-400.ttf') format('truetype');
}
@font-face {
  font-family: 'Inter';
  font-weight: 300;
  font-style: normal;
  font-display: swap;
  src: url('../assets/fonts/inter-300.woff2') format('woff2'),
       url('../assets/fonts/inter-300.ttf') format('truetype');
}
@font-face {
  font-family: 'Inter';
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url('../assets/fonts/inter-400.woff2') format('woff2'),
       url('../assets/fonts/inter-400.ttf') format('truetype');
}

/* ---------- COLOR TOKENS ---------- */
:root {
  /* Gallery Light — warm soft neutral, the "room" */
  --gallery-bg: #F3F0EA;

  /* Artwork Stage — warm parchment, museum wall behind paintings */
  --stage-bg: #E8DDC9;

  /* Focus View — dark premium stage for single works */
  --focus-bg: #2B2925;

  /* Wood — dark warm brown for carousel section */
  --wood-bg: #2d160f;

  /* Text — never pure black, warm near-black */
  --text: #1F1E1B;

  /* Secondary text — muted warm (min 4.5:1 on --gallery-bg) */
  --text-muted: #635F5D;

  /* Borders — extremely fine, barely there */
  --border: rgba(31, 30, 27, 0.08);

  /* Accent tones */
  --silver: #BFBAB8;
  --charcoal: #403E3D;
  --ink: #0D0D0D;

  /* Bid feedback */
  --bid-success: rgba(160, 210, 170, 0.9);
  --bid-error: rgba(220, 160, 155, 0.9);

  /* ---------- Z-INDEX MAP ---------- */
  --z-grain: 50;
  --z-back-to-top: 900;
  --z-mobile-menu: 990;
  --z-nav: 1000;
  --z-scroll-bar: 1002;
  --z-modal: 5000;
  --z-detail: 6000;
  --z-flip-clone: 6500;
  --z-bid-modal: 7000;
  --z-fullscreen: 8000;
  --z-loader: 9999;
  --z-skip-link: 100;

  /* ---------- EASINGS ---------- */
  --ease-standard: cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

  /* ---------- SHADOWS ---------- */
  --shadow-image: 0 4px 24px rgba(0, 0, 0, 0.18);
  --shadow-lifted: drop-shadow(0 28px 80px rgba(0, 0, 0, 0.32));
  --shadow-flying: drop-shadow(0 34px 100px rgba(0, 0, 0, 0.42));
}
```

- [ ] **Step 2: Verify file created**

Open `css/tokens.css` and confirm all tokens are present: 5 font-faces, color tokens, z-index map, easings, shadows.

- [ ] **Step 3: Commit**

```bash
git add css/tokens.css
git commit -m "feat: add CSS design tokens (colors, fonts, z-index, easings)"
```

---

### Task 1.3: Split style.css into CSS modules

**Files:**
- Create: `css/global.css`
- Create: `css/nav-hero.css`
- Create: `css/sections.css`
- Create: `css/gallery.css`
- Create: `css/overlays.css`
- Create: `css/responsive.css`
- Create: `css/print.css`
- Modify: `css/style.css` (replace with @import hub)

The source material is `_github-stable/css/style.css`. Read it completely and split by responsibility. Apply the bug fixes from the spec (C1-C14) as you go. Replace magic z-index numbers with `var(--z-*)` tokens.

This is a large task. The agent should:
1. Read `_github-stable/css/style.css` in full
2. Create each CSS file with the corresponding sections
3. Replace `css/style.css` with import statements
4. Verify the site still looks identical

- [ ] **Step 1: Read the full stable style.css to understand all sections**

Read `_github-stable/css/style.css` completely. Note where each section starts:
- Lines 1-10: Fonts (→ tokens.css, already done)
- Lines 12-47: Color tokens (→ tokens.css, already done)
- Lines 49-68: Reset, base, focus, scrollbar hide (→ global.css)
- Lines 70-72: Skip link (→ global.css)
- Lines 74-97: Loader, grain, scroll-progress, section-divider (→ global.css for grain/progress/divider, nav-hero.css for loader)
- Lines 99+: Nav, hero, marquee (→ nav-hero.css)
- Sections layout (→ sections.css)
- Gallery grid (→ gallery.css)
- Detail panel, modals, bid (→ overlays.css)
- Responsive/media queries (→ responsive.css)
- Print (→ print.css)

- [ ] **Step 2: Create global.css**

Extract from stable style.css: reset, body, `img/video/a/button/address` resets, `::selection`, `.hidden`, `.sr-only`, `:focus-visible`, scrollbar hide, skip-link, grain overlay, scroll-progress bar, section-divider, text-reveal word-wrap, reveal/reveal-image animations.

Apply fixes:
- Skip-link z-index: use `var(--z-skip-link)` (was 10000, now 100)
- Add `text-align: center` fallback before any `text-wrap: balance` usage
- Grain overlay: keep as-is (inline SVG base64)

- [ ] **Step 3: Create nav-hero.css**

Extract from stable style.css: `.crisp-header` (loader), `.crisp-loader*` (all loader classes), `.nav`, `.nav--scrolled`, `.nav--ready`, `.nav__logo`, `.nav__links`, `.nav__link`, `.nav__right`, `.nav__lang*`, `.nav__hamburger*`, `.mobile-menu*`, `.hero`, `.hero__media`, `.hero__overlay`, `.hero__content`, `.hero__title`, `.hero__subtitle`, `.hero__contact-*`, `.hero__scroll*`, `@keyframes kenBurns`, `@keyframes scroll-line`, `.marquee*`, `@keyframes marquee`.

Replace z-index magic numbers with `var(--z-*)` tokens.

- [ ] **Step 4: Create sections.css**

Extract from stable style.css: `.section`, `.section--warm`, `.section--clean`, `.section--philosophy`, `.container`, `.section__title`, `.editorial-grid*`, `.caption`, `.about-born`, `.philosophy-layout*`, `.phil-reveal`, `.body-text*`.

- [ ] **Step 5: Create gallery.css**

Extract from stable style.css: `.gallery-controls`, `.gallery-filter`, `.filter-btn*`, `.gallery-search*`, `.gallery`, `.gallery__item*`, `.gallery__loading`, `.gallery__empty`, `.gallery-more`, `.gallery-count`, `.back-to-top*`, `.fading-out`.

Add new classes for lazy-load states:
```css
/* Gallery lazy-load states */
.gallery-collapsed { text-align: center; padding: 3rem 0; }
.gallery-collapsed__btn {
  display: inline-block;
  padding: 0.85rem 2rem;
  border: 1px solid var(--text);
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 400;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  background: none;
  color: var(--text);
  transition: background 0.3s ease, color 0.3s ease;
}
.gallery-collapsed__btn:hover {
  background: var(--text);
  color: var(--gallery-bg);
}
.gallery-collapsed__btn:disabled {
  opacity: 0.5;
  cursor: wait;
}
.gallery-collapsed__count {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}
```

- [ ] **Step 6: Create overlays.css**

Extract from stable style.css: `.detail`, `.detail.open`, `.detail__backdrop`, `.detail__close`, `.detail__counter`, `.detail__prev`, `.detail__next`, `.detail__layout`, `.detail__image-col`, `.detail__image-wrap`, `.detail__image`, `.detail__loupe`, `.detail__fullscreen-btn`, `.detail__info`, `.detail__title`, `.detail__meta`, `.detail__field`, `.detail__label`, `.detail__divider`, `.detail__status`, `.detail__bid-btn`, `.detail__owner-value`, `.flip-clone`, `.image-fullscreen*`, `.modal*`, `.bid-form*`, `.bid-modal*`.

Apply contrast fixes (spec C1-C4):
- Detail counter: `color: rgba(255, 255, 255, 0.7)` (was 0.44)
- Bid-form labels: `color: rgba(255, 255, 255, 0.75)` (was 0.42)
- Bid success: `color: var(--bid-success)` (was same white as error)
- Bid error: `color: var(--bid-error)` (was same white as success)

Replace z-index magic numbers with `var(--z-*)` tokens.

- [ ] **Step 7: Create responsive.css**

Extract from stable style.css: all `@media` queries. Organize by breakpoint:
```css
/* 1024px */ @media (max-width: 1024px) { ... }
/* 768px */  @media (max-width: 768px) { ... }
/* 560px */  @media (max-width: 560px) { ... }
/* 480px */  @media (max-width: 480px) { ... }
/* Landscape */ @media (max-height: 500px) and (orientation: landscape) { ... }
/* Hover */  @media (hover: none) { ... }
/* Reduced Motion */ @media (prefers-reduced-motion: reduce) { ... }
```

Apply fixes:
- C8: Gallery overlay — use `@media (hover: none)` instead of width breakpoint
- C9: Philosophy image — add `max-height: min(clamp(22rem, 52vw, 34rem), 70vh)` at 1024px
- C10: Detail image — `max-height: min(66vh, 40rem)` at 768px
- C11: Loupe — `width: clamp(80px, 25vw, 160px); height: clamp(80px, 25vw, 160px)` at all sizes
- C12: Reduced motion — add `backdrop-filter: none !important; -webkit-backdrop-filter: none !important;`

- [ ] **Step 8: Create print.css**

```css
/* ============================================
   PRINT.CSS — Print-specific styles
   ============================================ */
@media print {
  .nav, .crisp-header, .grain, .scroll-progress, .detail,
  .mobile-menu, .modal, .marquee, .hero__scroll, .back-to-top,
  .carousel__pause, .bid-btn, .gallery-filter, .gallery-search { display: none !important; }

  .hero { height: auto; min-height: 0; }
  .hero__media { position: relative; height: 300px; animation: none !important; }
  .hero__overlay { display: none; }
  .hero__content { position: relative; color: var(--text); }
  .hero__title { font-size: 2rem; color: var(--text); }
  .hero__contact-left, .hero__contact-right { position: relative; opacity: 1 !important; color: var(--text); }

  body { background: #fff; color: #000; }
  .section { padding: 40px 20px; break-inside: avoid; }
  .gallery { grid-template-columns: repeat(4, 1fr) !important; }
  .gallery__item-overlay { display: none; }

  .carousel__slide { break-inside: avoid; page-break-inside: avoid; }
}
```

- [ ] **Step 9: Replace style.css with import hub**

```css
/* ============================================
   STYLE.CSS — Import hub
   ============================================ */
@import 'tokens.css';
@import 'global.css';
@import 'nav-hero.css';
@import 'sections.css';
@import 'carousel.css';
@import 'gallery.css';
@import 'overlays.css';
@import 'responsive.css';
@import 'print.css';
```

Note: `carousel.css` will be created in Phase 3. For now, that import will 404 silently — CSS @import of missing files does not cause errors. Alternatively, create an empty `css/carousel.css` placeholder.

- [ ] **Step 10: Create empty carousel.css placeholder**

```css
/* ============================================
   CAROUSEL.CSS — Carousel section styles (Phase 3)
   ============================================ */
```

- [ ] **Step 11: Verify the site looks identical**

Run: `python -m http.server 8000`, open in Chrome.
Expected: Site looks exactly like before the CSS split. No visual regressions. Console: 0 CSS errors.
Check: Loader, hero, about, philosophy, gallery, detail panel, modals, mobile menu at 375px width.

- [ ] **Step 12: Commit**

```bash
git add css/
git commit -m "refactor: split style.css into modular CSS files with bug fixes"
```

---

### Task 1.4: Create helpers.js

**Files:**
- Create: `js/helpers.js`

Shared utility functions extracted from the duplicated code in gallery.js, and to be used by carousel.js and bid.js.

- [ ] **Step 1: Create helpers.js**

```javascript
/* ============================================================
   HELPERS.JS — Shared utilities for artwork data.
   Exposes: window.Helpers
   ============================================================ */
(function () {
  'use strict';

  function getLang() {
    return document.documentElement.lang || 'de';
  }

  function translate(key, fallbackDe, fallbackEn) {
    if (window.i18n && typeof window.i18n.t === 'function') return window.i18n.t(key);
    return getLang() === 'en' ? fallbackEn : fallbackDe;
  }

  function getTitle(item) {
    if (!item) return '';
    if (getLang() === 'en' && item.title_en) return item.title_en;
    return item.title_de || item.title_en || '';
  }

  function getTechnique(item) {
    if (!item) return '';
    if (getLang() === 'en' && item.technique_en) return item.technique_en;
    return item.technique_de || '';
  }

  function getCategory(item) {
    if (!item) return '';
    if (getLang() === 'en' && item.category_en) return item.category_en;
    return item.category_de || '';
  }

  function getDimensions(item) {
    if (!item) return '';
    if (item.dimensions) return item.dimensions;
    var match = item.file.match(/(\d{2,4})x(\d{2,4})/);
    if (match) return match[1] + ' \u00d7 ' + match[2] + ' cm';
    return '';
  }

  function getShortLabel(item) {
    var title = getTitle(item);
    var year = item.year ? item.year : '';
    if (title && year) return title + ', ' + year;
    return title || (year ? '' + year : '');
  }

  function resolvePath(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path) || /^\/\//.test(path) || path.charAt(0) === '/') return path;
    return path.replace(/^\/+/, '');
  }

  function isAvailable(item) {
    if (!item) return true;
    if (item.owner && item.owner !== '') return false;
    if (typeof item.available !== 'undefined') return item.available;
    return true;
  }

  window.Helpers = {
    getLang: getLang,
    translate: translate,
    getTitle: getTitle,
    getTechnique: getTechnique,
    getCategory: getCategory,
    getDimensions: getDimensions,
    getShortLabel: getShortLabel,
    resolvePath: resolvePath,
    isAvailable: isAvailable
  };
})();
```

- [ ] **Step 2: Add helpers.js to index.html script tags**

In `index.html`, add `helpers.js` right after the vendor scripts and before `i18n.js`:

```html
<script src="js/vendor/gsap.min.js"></script>
<script src="js/vendor/ScrollTrigger.min.js"></script>
<script src="js/vendor/ScrollToPlugin.min.js"></script>
<script src="js/helpers.js"></script>
<script src="js/i18n.js"></script>
```

- [ ] **Step 3: Verify no console errors**

Reload the page. Console should show 0 errors. Type `Helpers.getLang()` in console — should return `'de'`.

- [ ] **Step 4: Commit**

```bash
git add js/helpers.js index.html
git commit -m "feat: add shared helpers module (getLang, getTitle, etc.)"
```

---

### Task 1.5: Extend i18n.js with new keys

**Files:**
- Modify: `js/i18n.js`

Add carousel, gallery lazy-load, and bid translation keys. The base is already the GitHub-stable version (copied in Task 1.1).

- [ ] **Step 1: Add new DE keys after existing `bid_btn` key**

Open `js/i18n.js`. Find the `de` translations object. After the last existing key, add:

```javascript
      // Carousel
      carousel_pause: 'Pause',
      carousel_play: 'Abspielen',
      home_featured_label: 'Auswahl',
      home_featured_title: 'Ausgew\u00e4hlte Werke',
      home_featured_intro: 'Ein konzentrierter Blick auf zentrale Arbeiten. Die vollst\u00e4ndige Auswahl liegt weiter unten.',
      home_featured_error: 'Vorschau konnte nicht geladen werden.',
      home_all_works: 'Zu allen Werken',
      a11y_featured_carousel: 'Ausgew\u00e4hlte Werke',

      // Gallery lazy-load
      gallery_show_all: 'Alle Werke anzeigen',
      gallery_count_available: '{count} Werke verf\u00fcgbar',

      // Bid extensions
      bid_back: 'Zur\u00fcck',
```

- [ ] **Step 2: Add corresponding EN keys**

In the `en` translations object, add after the last existing key:

```javascript
      // Carousel
      carousel_pause: 'Pause',
      carousel_play: 'Play',
      home_featured_label: 'Selection',
      home_featured_title: 'Selected Works',
      home_featured_intro: 'A focused look at key paintings. The full collection is below.',
      home_featured_error: 'Preview could not be loaded.',
      home_all_works: 'View all works',
      a11y_featured_carousel: 'Selected works',

      // Gallery lazy-load
      gallery_show_all: 'Show all works',
      gallery_count_available: '{count} works available',

      // Bid extensions
      bid_back: 'Back',
```

- [ ] **Step 3: Verify translations work**

Reload page. In console: `i18n.t('home_featured_title')` should return `'Ausgewählte Werke'`. Switch to EN, same call should return `'Selected Works'`.

- [ ] **Step 4: Commit**

```bash
git add js/i18n.js
git commit -m "feat: add carousel, gallery lazy-load, and bid i18n keys"
```

---

### Task 1.6: Extend overlay.js

**Files:**
- Modify: `js/overlay.js`

Add `isOpen(id)`, `top()` methods and `.isConnected` safety check.

- [ ] **Step 1: Add isOpen and top methods**

In `js/overlay.js`, find the public API line:
```javascript
window.__overlay = { push: pushOverlay, pop: popOverlay };
```

Replace it with:
```javascript
  function isOpen(id) {
    return overlayStack.indexOf(id) !== -1;
  }

  function top() {
    return overlayStack.length > 0 ? overlayStack[overlayStack.length - 1] : null;
  }

  window.__overlay = { push: pushOverlay, pop: popOverlay, isOpen: isOpen, top: top };
```

- [ ] **Step 2: Add .isConnected check in releaseFocus**

Find the `releaseFocus` function:
```javascript
  function releaseFocus() {
    document.removeEventListener('keydown', handleTrapKeydown);
    if (previousFocus && previousFocus.focus) previousFocus.focus();
    focusTrapEl = null;
    previousFocus = null;
  }
```

Replace with:
```javascript
  function releaseFocus() {
    document.removeEventListener('keydown', handleTrapKeydown);
    if (previousFocus && previousFocus.focus && previousFocus.isConnected) {
      previousFocus.focus();
    }
    focusTrapEl = null;
    previousFocus = null;
  }
```

- [ ] **Step 3: Verify**

Reload. Console: `__overlay.isOpen('loader')` should return `false` (loader already popped). `__overlay.top()` should return `null`.

- [ ] **Step 4: Commit**

```bash
git add js/overlay.js
git commit -m "feat: add isOpen/top to overlay system, fix focus-restore safety"
```

---

### Task 1.7: Phase 1 verification checkpoint

- [ ] **Step 1: Full page test**

Run `python -m http.server 8000`. Open Chrome. Test:
- Loader plays, hero appears
- Desktop wheel: hero → about (text reveal) → philosophy (clip-path) → works (free scroll)
- Gallery loads all 758 images with lazy loading
- Click image → detail panel with FLIP animation
- Detail: prev/next arrows, swipe, escape closes
- Modals: Datenschutz, Impressum open and close
- Language switch DE/EN: all text updates
- Console: 0 errors, 0 warnings
- Mobile (375px): Normal scroll, hamburger menu works

- [ ] **Step 2: Commit checkpoint**

```bash
git add -A
git commit -m "checkpoint: Phase 1 complete — stable foundation with CSS modules"
```

---

## Phase 2: Gallery Lazy-Load

### Task 2.1: Modify index.html gallery section to collapsed state

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace gallery section HTML**

Find the works section in `index.html` (starts with `<section class="section section--clean" id="works">`). Replace it with:

```html
  <!-- ========== WORKS ========== -->
  <section class="section section--clean" id="works">
    <div class="container">

      <h2 class="section__title reveal" data-i18n="works_title">Werke</h2>

      <!-- Collapsed state (initial) -->
      <div class="gallery-collapsed" id="galleryCollapsed">
        <button class="gallery-collapsed__btn" id="galleryExpandBtn" type="button"
                data-i18n="gallery_show_all">Alle Werke anzeigen</button>
        <p class="gallery-collapsed__count" id="galleryCollapsedCount"
           data-i18n="gallery_count_available">758 Werke verf&uuml;gbar</p>
      </div>

      <!-- Expanded state (hidden until expand) -->
      <div class="gallery-expanded" id="galleryExpanded" style="display:none">
        <div class="gallery-controls reveal">
          <div class="gallery-filter" id="galleryFilter" role="group"
               aria-label="Bildkategorien" data-i18n-aria="a11y_filter">
            <button class="filter-btn active" data-category="all" type="button"
                    aria-pressed="true" data-i18n="filter_all">Alle</button>
            <button class="filter-btn" data-category="abstrakt" type="button"
                    aria-pressed="false" data-i18n="filter_abstract">Abstrakt</button>
            <button class="filter-btn" data-category="blumen" type="button"
                    aria-pressed="false" data-i18n="filter_flowers">Blumen</button>
            <button class="filter-btn" data-category="frauen" type="button"
                    aria-pressed="false" data-i18n="filter_women">Frauen</button>
            <button class="filter-btn" data-category="seebilder" type="button"
                    aria-pressed="false" data-i18n="filter_seascapes">Seebilder</button>
            <button class="filter-btn" data-category="sonstige" type="button"
                    aria-pressed="false" data-i18n="filter_misc">Sonstige</button>
            <button class="filter-btn" data-category="tiere" type="button"
                    aria-pressed="false" data-i18n="filter_animals">Tiere</button>
          </div>
          <div class="gallery-search">
            <label for="gallerySearch" class="sr-only"
                   data-i18n="search_placeholder">Werk suchen</label>
            <input type="text" class="gallery-search__input" id="gallerySearch"
                   placeholder="Werk suchen..." data-i18n-placeholder="search_placeholder"
                   autocomplete="off">
          </div>
        </div>

        <div class="gallery" id="gallery" aria-label="Bildergalerie"
             data-i18n-aria="a11y_gallery">
        </div>

        <div class="gallery-more" id="galleryMore">
          <p class="gallery-count" id="galleryCount"></p>
        </div>
      </div>
    </div>
  </section>
```

- [ ] **Step 2: Verify collapsed state shows**

Reload page. Gallery section should show "Werke" title + "Alle Werke anzeigen" button + "758 Werke verfügbar" count. No images visible. Button does nothing yet.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: gallery section with collapsed initial state"
```

---

### Task 2.2: Modify gallery.js for lazy-load states

**Files:**
- Modify: `js/gallery.js`

The base gallery.js (from GitHub-stable) auto-fetches data on DOMContentLoaded. We need to change it to wait for button click.

- [ ] **Step 1: Add state management and public API to gallery.js**

This is a significant rewrite of the init flow. Open `js/gallery.js`.

At the top of the IIFE (after `var debounceTimer = null;`), add:

```javascript
  /* Lazy-load state: 'collapsed' | 'loading' | 'expanded' */
  var galleryState = 'collapsed';
  var expandBtn, collapsedEl, expandedEl;
```

Find the `init()` function. Replace it entirely with:

```javascript
  function init() {
    cacheDomRefs();
    if (!document.getElementById('galleryCollapsed')) {
      /* Fallback: no collapsed state in HTML, behave like before */
      if (!gallery) return;
      initRevealObserver();
      fetchAndExpand();
      return;
    }

    expandBtn = document.getElementById('galleryExpandBtn');
    collapsedEl = document.getElementById('galleryCollapsed');
    expandedEl = document.getElementById('galleryExpanded');

    if (expandBtn) {
      expandBtn.addEventListener('click', function () { expand(); });
    }

    initLanguageObserver();
  }

  function expand() {
    if (galleryState !== 'collapsed') return;
    galleryState = 'loading';
    if (expandBtn) {
      expandBtn.disabled = true;
      expandBtn.textContent = Helpers.translate('works_loading', 'Laden...', 'Loading...');
    }
    fetchAndExpand();
  }

  function fetchAndExpand() {
    fetchImageData()
      .then(function () {
        galleryState = 'expanded';
        if (collapsedEl) {
          collapsedEl.style.display = 'none';
        }
        if (expandedEl) {
          expandedEl.style.display = '';
        }
        if (!gallery) {
          gallery = document.getElementById('gallery');
        }
        initRevealObserver();
        renderBatch();
        updateCount();
        bindFilterButtons();
        initSearch();
        if (detail) initDetail();
        initInlineBid();
        updateSearchPlaceholder();

        /* Stagger reveal for filter bar */
        if (typeof gsap !== 'undefined') {
          var controls = expandedEl ? expandedEl.querySelector('.gallery-controls') : null;
          if (controls) {
            gsap.fromTo(controls, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
          }
        }
      })
      .catch(function (err) {
        console.error('Gallery: Could not load image data.', err);
        galleryState = 'collapsed';
        if (expandBtn) {
          expandBtn.disabled = false;
          expandBtn.textContent = Helpers.translate('home_featured_error', 'Fehler — erneut versuchen', 'Error — try again');
        }
      });
  }
```

At the bottom of the IIFE, before the closing `})();`, add the public API:

```javascript
  window.Gallery = {
    expand: function () { expand(); },
    isExpanded: function () { return galleryState === 'expanded'; },
    openDetail: function (items, index, sourceImg) {
      if (galleryState !== 'expanded') {
        expand();
      }
      /* External callers (carousel) can open detail with their own items */
      if (items && typeof index === 'number') {
        filteredImages = items;
        flipOpenDetail(index, sourceImg);
      }
    }
  };
```

- [ ] **Step 2: Update gallery.js helper functions to use Helpers module**

Find the local `getLang`, `t`, `getTitle`, `getTechnique`, `getCategoryLabel`, `getShortLabel`, `parseDimensions`, `isAvailable` functions at the top of gallery.js. Replace them all with delegations to `window.Helpers`:

```javascript
  function getLang() { return Helpers.getLang(); }
  function t(de, en) { return getLang() === 'en' ? en : de; }
  function getTitle(item) { return Helpers.getTitle(item); }
  function getTechnique(item) { return Helpers.getTechnique(item); }
  function getCategoryLabel(item) { return Helpers.getCategory(item); }
  function getShortLabel(item) { return Helpers.getShortLabel(item); }
  function parseDimensions(item) { return Helpers.getDimensions(item); }
  function isAvailable(item) { return Helpers.isAvailable(item); }
```

- [ ] **Step 3: Verify lazy-load works**

Reload page. Gallery should show collapsed button. Click "Alle Werke anzeigen" — should fetch data, show grid. Filter and search should work. Detail panel should open on image click.

- [ ] **Step 4: Commit**

```bash
git add js/gallery.js
git commit -m "feat: gallery lazy-load with collapsed/loading/expanded states"
```

---

### Task 2.3: Phase 2 verification checkpoint

- [ ] **Step 1: Full test**

- Gallery section shows "Alle Werke anzeigen" button initially
- Click → Loading state → Grid appears with images
- DevTools Network: images load lazily (not all 758 at once)
- Filter buttons work (Alle, Abstrakt, etc.)
- Search works (type, debounce, results filter)
- Click image → Detail panel opens (FLIP animation)
- Detail: prev/next, swipe, keyboard (←/→/Esc)
- Detail: Loupe on desktop hover
- Detail: Fullscreen button works
- Language switch: button text, filter labels, detail labels update
- Back-to-top button appears on scroll
- Console: 0 errors

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "checkpoint: Phase 2 complete — gallery lazy-loading"
```

---

## Phase 3: Carousel

### Task 3.1: Add carousel section HTML to index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Insert carousel section after philosophy**

In `index.html`, find `<div class="section-divider"></div>` that appears right before the works section. Insert the carousel section before it:

```html
  <div class="section-divider"></div>

  <!-- ========== CAROUSEL (Featured Works) ========== -->
  <section class="section section--carousel" id="carousel">
    <div class="container">
      <span class="section__label" data-i18n="home_featured_label">Auswahl</span>
      <h2 class="section__title" data-i18n="home_featured_title">Ausgew&auml;hlte Werke</h2>
      <p class="section__intro" data-i18n="home_featured_intro">Ein konzentrierter Blick auf zentrale Arbeiten. Die vollst&auml;ndige Auswahl liegt weiter unten.</p>
    </div>

    <div class="carousel" id="homeCarousel">
      <div class="carousel__viewport" id="carouselViewport">
        <div class="carousel__track" id="carouselTrack"
             aria-label="Ausgew&auml;hlte Werke" data-i18n-aria="a11y_featured_carousel">
        </div>
      </div>
      <button class="carousel__pause" id="carouselPause" type="button"
              aria-label="Pause" data-i18n-aria="carousel_pause" style="display:none">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <rect x="1" y="1" width="4" height="12"/>
          <rect x="9" y="1" width="4" height="12"/>
        </svg>
      </button>
    </div>

    <div class="container" style="text-align:center; margin-top:1.5rem;">
      <a href="#works" class="carousel__all-works" id="carouselAllWorks"
         data-i18n="home_all_works">Zu allen Werken</a>
    </div>
  </section>

  <div class="section-divider"></div>

  <!-- ========== WORKS ========== -->
```

- [ ] **Step 2: Add carousel.js script tag**

In `index.html`, find the script tags. Add `carousel.js` and `bid.js` (placeholder) in the correct order:

```html
<script src="js/vendor/gsap.min.js"></script>
<script src="js/vendor/ScrollTrigger.min.js"></script>
<script src="js/vendor/ScrollToPlugin.min.js"></script>
<script src="js/helpers.js"></script>
<script src="js/i18n.js"></script>
<script src="js/overlay.js"></script>
<script src="js/bid.js"></script>
<script src="js/scroll.js"></script>
<script src="js/loader.js"></script>
<script src="js/carousel.js"></script>
<script src="js/gallery.js"></script>
<script src="js/nav.js"></script>
<script src="js/interactions.js"></script>
```

- [ ] **Step 3: Create empty bid.js placeholder**

```javascript
/* ============================================================
   BID.JS — Consolidated bid system (Phase 4)
   Exposes: window.BidSystem
   ============================================================ */
(function () {
  'use strict';
  window.BidSystem = {
    create: function () {},
    show: function () {},
    hide: function () {},
    submit: function () {},
    getAll: function () { return []; }
  };
})();
```

- [ ] **Step 4: Verify**

Reload. Carousel section should appear (empty, just title text) between philosophy and works. No console errors.

- [ ] **Step 5: Commit**

```bash
git add index.html js/bid.js
git commit -m "feat: add carousel section HTML and script loading order"
```

---

### Task 3.2: Create carousel.css

**Files:**
- Modify: `css/carousel.css` (replace placeholder)

This is the full carousel styling: section background, slide layout, plaque, pause button, floating controls.

- [ ] **Step 1: Write carousel.css**

The agent should create the full carousel CSS based on the design spec (Section 4) and the analysis of the current version's carousel.css. Key elements:

- `.section--carousel`: Full viewport height, position relative, overflow hidden
- `::before` pseudo-element: gallery-bg.webp background with gradient overlay
- `::after` pseudo-element: edge vignette gradients
- `.carousel`: Relative, centered
- `.carousel__viewport`: Overflow hidden, centered
- `.carousel__track`: Flex container for slides
- `.carousel__slide`: Absolute positioned, opacity controlled by JS
- `.carousel__scene`: Grid layout — artwork left, plaque right
- `.carousel__artwork` / `.carousel__frame`: Image container with shadow
- `.carousel__plaque*`: Museum-style info card (Cormorant font for title, Inter for labels)
- `.carousel__pause`: Circular floating button with frosted glass
- `.carousel__all-works`: Centered link at bottom
- Plaque text contrast: `rgba(248, 238, 227, 0.92)` (fix C1)
- Plaque transition: uniform `var(--ease-standard)` (fix C13)
- `overflow: hidden; overflow: clip;` for Safari fallback (fix C7)

The CSS should be approximately 250-300 lines. Use `var(--z-*)` tokens for all z-indices. Use `var(--ease-standard)` for transitions. Use `var(--shadow-*)` for shadows.

The exact CSS is too large to include inline here. The implementing agent should reference `_github-stable/` (no carousel CSS exists there) and the current version's `css/carousel.css` for the visual approach, then write it clean with the token system and bug fixes applied.

- [ ] **Step 2: Verify section has background**

Reload. Carousel section should show the museum wall background (currently still .png until WebP conversion in Task 3.7). Section title visible.

- [ ] **Step 3: Commit**

```bash
git add css/carousel.css
git commit -m "feat: carousel CSS with museum wall layout and plaque styling"
```

---

### Task 3.3: Create carousel.js — Core (data loading, slide generation, state)

**Files:**
- Create: `js/carousel.js`

This task covers: IIFE setup, config, data fetching, featured selection, slide DOM generation, state variables, viewport measurement. No animation yet.

- [ ] **Step 1: Write carousel.js core**

```javascript
/* ============================================================
   CAROUSEL.JS — Featured artwork carousel for homepage.
   Depends on: GSAP, Helpers, BidSystem, overlay.js
   Exposes: window.HomeCarousel
   ============================================================ */
(function () {
  'use strict';

  var CONFIG = {
    DATA_URL: 'bilder-metadaten.json',
    FEATURED_FILES: [
      'Bild4-2017LeningraderVariante.jpg',
      'Bild2-2020Seehasgrossultramarinblau.jpg',
      '2018-abstraktesbild55.jpg',
      '2017-wolken.jpg',
      '2014-rehkitz.jpg',
      '2016-palette162.jpg',
      '2008-artbaseltableauii2von10.jpg'
    ],
    MAX_SLIDES: 8,
    AUTOPLAY_DELAY: 10000
  };

  /* State */
  var viewport, track;
  var slides = [];
  var items = [];
  var currentIndex = 0;
  var autoplayTimer = null;
  var hasEntered = false;
  var isAnimating = false;
  var isPaused = false;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var entryObserver = null;

  /* --- Data Loading --- */

  function fetchData() {
    return fetch(CONFIG.DATA_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load ' + CONFIG.DATA_URL);
        return res.json();
      });
  }

  function selectFeatured(allData) {
    var selected = [];
    /* First: curated picks in order */
    CONFIG.FEATURED_FILES.forEach(function (filename) {
      for (var i = 0; i < allData.length; i++) {
        if (allData[i].file === filename) {
          selected.push(allData[i]);
          break;
        }
      }
    });
    /* Fill remaining slots */
    if (selected.length < CONFIG.MAX_SLIDES) {
      var selectedFiles = selected.map(function (s) { return s.file; });
      for (var j = 0; j < allData.length && selected.length < CONFIG.MAX_SLIDES; j++) {
        if (selectedFiles.indexOf(allData[j].file) === -1) {
          selected.push(allData[j]);
        }
      }
    }
    return selected;
  }

  /* --- Slide DOM Generation --- */

  function buildSlide(item, index) {
    var H = Helpers;
    var article = document.createElement('article');
    article.className = 'carousel__slide';
    article.setAttribute('data-index', index);
    article.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');

    var scene = document.createElement('div');
    scene.className = 'carousel__scene';

    /* Artwork */
    var artwork = document.createElement('div');
    artwork.className = 'carousel__artwork';
    var frame = document.createElement('div');
    frame.className = 'carousel__frame';
    var img = document.createElement('img');
    img.src = H.resolvePath(item.path);
    img.alt = H.getShortLabel(item);
    img.loading = index < 2 ? 'eager' : 'lazy';
    if (index === 0) img.fetchPriority = 'high';
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', H.getTitle(item));
    frame.appendChild(img);
    artwork.appendChild(frame);

    /* Plaque */
    var plaque = document.createElement('div');
    plaque.className = 'carousel__plaque';
    plaque.setAttribute('role', 'group');
    plaque.setAttribute('aria-label', H.getTitle(item));

    var plaqueTop = document.createElement('div');
    plaqueTop.className = 'carousel__plaque-top';
    var artist = document.createElement('p');
    artist.className = 'carousel__plaque-artist';
    artist.textContent = 'Eckhard Besuden';
    var title = document.createElement('h3');
    title.className = 'carousel__plaque-title';
    title.textContent = H.getTitle(item);
    plaqueTop.appendChild(artist);
    plaqueTop.appendChild(title);

    var meta = document.createElement('div');
    meta.className = 'carousel__plaque-meta';

    var fields = [
      { key: 'detail_year', de: 'Jahr', en: 'Year', value: item.year || '' },
      { key: 'detail_technique', de: 'Technik', en: 'Technique', value: H.getTechnique(item) || '\u2014' },
      { key: 'detail_dimensions', de: 'Ma\u00dfe', en: 'Dimensions', value: H.getDimensions(item) || '\u2014' },
      { key: 'detail_category', de: 'Kategorie', en: 'Category', value: H.getCategory(item) }
    ];

    fields.forEach(function (f) {
      var row = document.createElement('div');
      row.className = 'carousel__plaque-row';
      var label = document.createElement('span');
      label.className = 'carousel__plaque-label';
      label.setAttribute('data-i18n', f.key);
      label.textContent = H.translate(f.key, f.de, f.en);
      var val = document.createElement('p');
      val.className = 'carousel__plaque-value';
      val.textContent = f.value;
      row.appendChild(label);
      row.appendChild(val);
      meta.appendChild(row);
    });

    var actions = document.createElement('div');
    actions.className = 'carousel__plaque-actions';
    var bidBtn = document.createElement('button');
    bidBtn.type = 'button';
    bidBtn.className = 'bid-btn';
    bidBtn.setAttribute('data-i18n', 'bid_btn');
    bidBtn.textContent = H.translate('bid_btn', 'Gebot abgeben', 'Place a bid');
    actions.appendChild(bidBtn);

    var bidContainer = document.createElement('div');
    bidContainer.className = 'carousel__plaque-bid';
    bidContainer.style.display = 'none';

    plaque.appendChild(plaqueTop);
    plaque.appendChild(meta);
    plaque.appendChild(actions);
    plaque.appendChild(bidContainer);

    scene.appendChild(artwork);
    scene.appendChild(plaque);
    article.appendChild(scene);

    return article;
  }

  /* --- Viewport & Layout --- */

  function measureViewport() {
    if (!viewport) return;
    /* Let CSS handle sizing — just ensure viewport is visible */
  }

  function setActiveSlide(index) {
    slides.forEach(function (slide, i) {
      var isActive = i === index;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });
    currentIndex = index;

    /* Show/hide plaque */
    slides.forEach(function (slide, i) {
      var plaque = slide.querySelector('.carousel__plaque');
      if (plaque) {
        plaque.classList.toggle('is-visible', i === index);
      }
    });
  }

  /* --- Init --- */

  function init() {
    viewport = document.getElementById('carouselViewport');
    track = document.getElementById('carouselTrack');
    if (!viewport || !track) return;

    fetchData()
      .then(function (allData) {
        items = selectFeatured(allData);
        if (!items.length) return;

        items.forEach(function (item, i) {
          var slide = buildSlide(item, i);
          track.appendChild(slide);
          slides.push(slide);
        });

        setActiveSlide(0);
        measureViewport();
        initEntryObserver();
        initEventListeners();
      })
      .catch(function (err) {
        console.error('Carousel: Could not load data.', err);
        var errorEl = document.createElement('p');
        errorEl.style.cssText = 'text-align:center;opacity:0.5;padding:3rem 0;color:#fff;';
        errorEl.textContent = Helpers.translate('home_featured_error', 'Vorschau konnte nicht geladen werden.', 'Preview could not be loaded.');
        viewport.appendChild(errorEl);
      });
  }

  /* --- Entry Observer --- */

  function initEntryObserver() {
    if (hasEntered) return;
    entryObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          enter();
          if (entryObserver) entryObserver.disconnect();
        }
      });
    }, { threshold: [0.2, 0.35, 0.55] });
    entryObserver.observe(viewport);
  }

  function enter() {
    if (hasEntered) return;
    hasEntered = true;
    /* Animation will be added in Task 3.4 */
    /* For now, just make first slide visible and start autoplay */
    if (!reducedMotion) startAutoplay();
  }

  /* --- Autoplay --- */

  function startAutoplay() {
    if (isPaused || reducedMotion || items.length <= 1) return;
    clearAutoplay();
    autoplayTimer = setInterval(function () {
      if (!isAnimating && !isPaused) {
        goTo(currentIndex + 1, 'next');
      }
    }, CONFIG.AUTOPLAY_DELAY);
  }

  function clearAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  /* --- Navigation --- */

  function goTo(index, direction) {
    if (isAnimating || items.length <= 1) return;
    var newIndex = ((index % items.length) + items.length) % items.length;
    if (newIndex === currentIndex) return;

    direction = direction || (newIndex > currentIndex ? 'next' : 'prev');

    /* Animation placeholder — Task 3.4 will add the 5-phase timeline */
    setActiveSlide(newIndex);
    clearAutoplay();
    startAutoplay();
  }

  /* --- Event Listeners --- */

  function initEventListeners() {
    /* Pause on hover/focus */
    viewport.addEventListener('mouseenter', function () { clearAutoplay(); });
    viewport.addEventListener('mouseleave', function () { startAutoplay(); });
    viewport.addEventListener('focusin', function () { clearAutoplay(); });
    viewport.addEventListener('focusout', function () { startAutoplay(); });

    /* Touch swipe */
    var touchStartX = 0, touchStartY = 0;
    viewport.addEventListener('touchstart', function (e) {
      if (e.changedTouches && e.changedTouches.length) {
        touchStartX = e.changedTouches[0].clientX;
        touchStartY = e.changedTouches[0].clientY;
      }
      clearAutoplay();
    }, { passive: true });

    viewport.addEventListener('touchend', function (e) {
      if (!e.changedTouches || !e.changedTouches.length) return;
      var deltaX = e.changedTouches[0].clientX - touchStartX;
      var deltaY = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        /* FIXED (J1): Left swipe = forward, right swipe = back */
        goTo(currentIndex + (deltaX > 0 ? -1 : 1), deltaX > 0 ? 'prev' : 'next');
      } else {
        startAutoplay();
      }
    }, { passive: true });

    /* Keyboard */
    document.addEventListener('keydown', function (e) {
      if (!hasEntered) return;
      if (window.__overlay && window.__overlay.top()) return;
      /* Only respond if carousel is in viewport */
      var rect = viewport.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      if (e.key === 'ArrowRight') { goTo(currentIndex + 1, 'next'); }
      else if (e.key === 'ArrowLeft') { goTo(currentIndex - 1, 'prev'); }
    });

    /* Image click → open detail */
    viewport.addEventListener('click', function (e) {
      var img = e.target.closest('.carousel__frame img');
      if (!img) return;
      var slide = img.closest('.carousel__slide');
      if (!slide) return;
      var idx = parseInt(slide.getAttribute('data-index'), 10);
      if (isNaN(idx)) return;
      clearAutoplay();
      if (window.Gallery && typeof window.Gallery.openDetail === 'function') {
        window.Gallery.openDetail(items, idx, img);
      }
    });

    /* Pause button */
    var pauseBtn = document.getElementById('carouselPause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', function () {
        isPaused = !isPaused;
        pauseBtn.classList.toggle('is-playing', isPaused);
        if (isPaused) {
          clearAutoplay();
          pauseBtn.setAttribute('aria-label', Helpers.translate('carousel_play', 'Abspielen', 'Play'));
        } else {
          startAutoplay();
          pauseBtn.setAttribute('aria-label', Helpers.translate('carousel_pause', 'Pause', 'Pause'));
        }
      });
    }

    /* Visibility change */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearAutoplay();
      else if (!isPaused) startAutoplay();
    });

    /* Language change */
    document.addEventListener('langchange', function () { render(); });

    /* "Zu allen Werken" link */
    var allWorksLink = document.getElementById('carouselAllWorks');
    if (allWorksLink) {
      allWorksLink.addEventListener('click', function (e) {
        e.preventDefault();
        if (window.Gallery && !window.Gallery.isExpanded()) {
          window.Gallery.expand();
        }
        if (typeof Scroll !== 'undefined' && Scroll.navigateTo) {
          Scroll.navigateTo('works');
        }
      });
    }

    /* Window resize */
    window.addEventListener('resize', measureViewport);
  }

  function render() {
    /* Re-render slide content for language change */
    slides.forEach(function (slide, i) {
      if (i >= items.length) return;
      var item = items[i];
      var title = slide.querySelector('.carousel__plaque-title');
      if (title) title.textContent = Helpers.getTitle(item);
      var labels = slide.querySelectorAll('[data-i18n]');
      labels.forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        if (window.i18n && window.i18n.t) el.textContent = window.i18n.t(key);
      });
      /* Update plaque values */
      var values = slide.querySelectorAll('.carousel__plaque-value');
      if (values[0]) values[0].textContent = item.year || '';
      if (values[1]) values[1].textContent = Helpers.getTechnique(item) || '\u2014';
      if (values[2]) values[2].textContent = Helpers.getDimensions(item) || '\u2014';
      if (values[3]) values[3].textContent = Helpers.getCategory(item);
    });
  }

  /* --- Public API --- */

  window.HomeCarousel = {
    enter: function () { enter(); },
    next: function () { goTo(currentIndex + 1, 'next'); },
    prev: function () { goTo(currentIndex - 1, 'prev'); },
    resetEntry: function () { hasEntered = false; },
    get isFirst() { return currentIndex === 0; },
    get isLast() { return currentIndex >= items.length - 1; },
    get count() { return items.length; },
    get isAnimating() { return isAnimating; }
  };

  /* --- Start --- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

- [ ] **Step 2: Verify carousel loads data and shows slides**

Reload. Carousel section should show 8 slides (only first visible). Title and plaque info visible. Autoplay cycles slides (currently without animation — just instant switch).

- [ ] **Step 3: Commit**

```bash
git add js/carousel.js
git commit -m "feat: carousel core — data loading, slide generation, state management"
```

---

### Task 3.4: Carousel 5-phase GSAP animation

**Files:**
- Modify: `js/carousel.js`

Add the 5-phase timeline animation to the `goTo()` function. Add entry animation to `enter()`. Add shadow state management.

This is the most complex task. The implementing agent must:

1. Add `offscreenX(el, side)` function that calculates how far left/right an element needs to move to be off-screen
2. Add `shadowState(el, state)` function that applies none/lifted/flying shadow
3. Replace the `goTo()` placeholder with a full GSAP timeline that implements the 5 phases from the spec (Section 4.5)
4. Replace the `enter()` placeholder with the entry animation from spec (Section 4.6)
5. Add reduced-motion fallback (simple crossfade)
6. Set `isAnimating = true` at timeline start, `false` at timeline end
7. Show/hide pause button after first entry

Key timing from the spec:
- Phase 1 Lift-Off: 1000ms, power1.out
- Phase 2 Fly-Off: 1300ms, power3.in
- Phase 3 Empty Wall: 300ms pause
- Phase 4 Fly-In: 1600ms, power3.out
- Phase 5 Land: 800ms, power2.inOut
- Entry: 2500ms total (100ms fade + 1600ms fly + 800ms land)

The exact GSAP code is approximately 150-200 lines. The implementing agent should write it based on these specifications and the detailed analysis in the design spec.

- [ ] **Step 1: Add helper functions (offscreenX, shadowState) to carousel.js**

- [ ] **Step 2: Replace goTo() with 5-phase GSAP timeline**

- [ ] **Step 3: Replace enter() with entry animation**

- [ ] **Step 4: Add reduced-motion crossfade fallback**

- [ ] **Step 5: Show pause button after entry**

- [ ] **Step 6: Verify animations**

Reload. First slide should fly in from right when carousel enters viewport. Autoplay should trigger 5-phase animation every 10s. Pause button should appear. Swipe and keyboard should trigger animations.

- [ ] **Step 7: Commit**

```bash
git add js/carousel.js
git commit -m "feat: carousel 5-phase GSAP animation (lift, fly, wall, enter, land)"
```

---

### Task 3.5: Extend scroll.js with carousel state

**Files:**
- Modify: `js/scroll.js`

- [ ] **Step 1: Add carousel to section definitions**

In `js/scroll.js`, find the `initSections()` function and the `defs` array:
```javascript
    var defs = [
      { id: 'hero',       type: 'snap' },
      { id: 'about',      type: 'reveal' },
      { id: 'philosophy', type: 'reveal' },
      { id: 'works',      type: 'free' }
    ];
```

Replace with:
```javascript
    var defs = [
      { id: 'hero',       type: 'snap' },
      { id: 'about',      type: 'reveal' },
      { id: 'philosophy', type: 'reveal' },
      { id: 'carousel',   type: 'snap' },
      { id: 'works',      type: 'free' }
    ];
```

- [ ] **Step 2: Add carousel case to wheel handler**

In the `onWheel` function, find the `switch (state)` block. Add a carousel case before the `free` case:

```javascript
      case 'carousel':
        e.preventDefault();
        if (down) flyTo('works');
        else flyTo('philosophy');
        break;
```

- [ ] **Step 3: Update philosophy → carousel transition**

Find the `handleRevealState` call for philosophy. Currently it transitions to `'works'`:
```javascript
      case 'philosophy':
        handleRevealState('philosophy', 'about', 'works', down, e.deltaY);
        break;
```

Change to:
```javascript
      case 'philosophy':
        handleRevealState('philosophy', 'about', 'carousel', down, e.deltaY);
        break;
```

- [ ] **Step 4: Update free state return target**

In the `free` case, change the flyTo target from `'philosophy'` to `'carousel'`:
```javascript
      case 'free':
        if (!down && window.scrollY <= findSection('works').el.offsetTop + 5) {
          e.preventDefault();
          flyTo('carousel');
        }
        break;
```

- [ ] **Step 5: Update flyTo callback for carousel state**

In the `flyTo` function's `onComplete`, the state is set like this:
```javascript
state = targetSec.type === 'free' ? 'free' : targetSec.id;
```

This already works — carousel's id is 'carousel' and type is 'snap', so state will be set to 'carousel'. No change needed.

- [ ] **Step 6: Trigger carousel entry when flying to it**

In the `flyTo` function's `onComplete` callback, add:
```javascript
        if (targetSec.id === 'carousel' && window.HomeCarousel) {
          window.HomeCarousel.enter();
        }
```

- [ ] **Step 7: Verify scroll state machine**

Reload. Desktop wheel: hero → about → philosophy → carousel (snap) → works (free scroll). At top of works, scroll up → back to carousel. Carousel entry animation triggers on arrival.

- [ ] **Step 8: Commit**

```bash
git add js/scroll.js
git commit -m "feat: add carousel state to scroll state-machine"
```

---

### Task 3.6: Convert gallery-bg.png to WebP

**Files:**
- Create: `assets/gallery-bg.webp`
- Modify: `css/carousel.css` (background-image declaration)

- [ ] **Step 1: Convert PNG to WebP**

Use an image conversion tool. If `cwebp` is available:
```bash
cwebp -q 80 assets/gallery-bg.png -o assets/gallery-bg.webp
```

If `cwebp` is not available, use Python with Pillow:
```bash
python -c "from PIL import Image; img = Image.open('assets/gallery-bg.png'); img.save('assets/gallery-bg.webp', 'WebP', quality=80)"
```

If neither works, use an online converter or skip this step and keep the PNG. The CSS already has PNG as fallback.

- [ ] **Step 2: Verify WebP file size**

```bash
ls -la assets/gallery-bg.webp
```
Expected: 200-500 KB (vs 2 MB for PNG).

- [ ] **Step 3: Update carousel.css background**

Ensure the `::before` pseudo-element in carousel.css has the WebP with PNG fallback:
```css
.section--carousel::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(15, 7, 4, 0.3), rgba(15, 7, 4, 0.06) 26%, rgba(15, 7, 4, 0.28) 100%),
    url('../assets/gallery-bg.png') center 54% / cover no-repeat;
  background:
    linear-gradient(180deg, rgba(15, 7, 4, 0.3), rgba(15, 7, 4, 0.06) 26%, rgba(15, 7, 4, 0.28) 100%),
    image-set(
      url('../assets/gallery-bg.webp') type('image/webp'),
      url('../assets/gallery-bg.png') type('image/png')
    ) center 54% / cover no-repeat;
  opacity: 0.98;
}
```

- [ ] **Step 4: Commit**

```bash
git add assets/gallery-bg.webp css/carousel.css
git commit -m "perf: convert gallery-bg.png to WebP (2MB → ~400KB)"
```

---

### Task 3.7: Phase 3 verification checkpoint

- [ ] **Step 1: Full carousel test**

- Carousel section visible between philosophy and gallery
- Museum wall background loads (WebP or PNG)
- 8 slides loaded (7 featured + 1 filler)
- Entry animation: first painting flies in from right
- Autoplay: every 10s, 5-phase animation plays
- Autoplay pauses on hover, focus, tab-hidden
- Swipe: left = forward, right = back (natural direction)
- Keyboard arrows work (only when carousel in viewport)
- Pause button: click toggles, icon changes
- Click painting → detail panel opens
- Plaque shows: artist, title, year, technique, dimensions, category
- "Zu allen Werken" scrolls to works + expands gallery
- Desktop scroll: philosophy → carousel (snap) → works
- Mobile: carousel is inline, scrollable
- Reduced motion: simple crossfade, no fly animation
- Console: 0 errors

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "checkpoint: Phase 3 complete — carousel with 5-phase animation"
```

---

## Phase 4: Bid System

### Task 4.1: Write bid.js module

**Files:**
- Modify: `js/bid.js` (replace placeholder)

- [ ] **Step 1: Write the full bid.js module**

```javascript
/* ============================================================
   BID.JS — Consolidated bid system.
   Used by carousel plaque and gallery detail panel.
   Depends on: GSAP, Helpers, i18n
   Exposes: window.BidSystem
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'besuden_bids';

  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      console.warn('BidSystem: Could not read bids from localStorage', e);
      return [];
    }
  }

  function saveBid(bid) {
    try {
      var bids = getAll();
      bids.push(bid);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bids));
      return true;
    } catch (e) {
      console.warn('BidSystem: Could not save bid to localStorage', e);
      return false;
    }
  }

  function buildFormHTML() {
    var H = Helpers;
    return '' +
      '<button type="button" class="bid-form__close" aria-label="' +
        H.translate('bid_back', 'Zur\u00fcck', 'Back') + '">&times;</button>' +
      '<h3 class="bid-form__title">' +
        H.translate('bid_title', 'Gebot abgeben', 'Place a bid') + '</h3>' +
      '<form class="bid-form" novalidate>' +
        '<div class="bid-form__field"><label>' +
          H.translate('bid_name', 'Name', 'Name') +
          '</label><input type="text" name="name" required></div>' +
        '<div class="bid-form__field"><label>' +
          H.translate('bid_email', 'E-Mail', 'Email') +
          '</label><input type="email" name="email" required></div>' +
        '<div class="bid-form__field"><label>' +
          H.translate('bid_amount', 'Ihr Gebot (EUR)', 'Your Bid (EUR)') +
          '</label><input type="number" name="amount" min="1" required></div>' +
        '<div class="bid-form__field"><label>' +
          H.translate('bid_message', 'Nachricht', 'Message') +
          '</label><textarea name="message" rows="2"></textarea></div>' +
        '<button type="submit" class="bid-form__submit">' +
          H.translate('bid_submit', 'Gebot absenden', 'Submit bid') + '</button>' +
      '</form>' +
      '<div class="bid-form__success hidden"><p>' +
        H.translate('bid_success', 'Vielen Dank. Ihr Gebot wurde entgegengenommen.',
          'Thank you. Your bid has been received.') + '</p></div>' +
      '<div class="bid-form__error hidden"></div>';
  }

  function create(container, item) {
    if (!container) return null;
    container.innerHTML = buildFormHTML();

    var form = container.querySelector('form');
    var success = container.querySelector('.bid-form__success');
    var error = container.querySelector('.bid-form__error');
    var closeBtn = container.querySelector('.bid-form__close');

    var controller = {
      container: container,
      item: item,
      form: form,
      success: success,
      error: error,
      closeBtn: closeBtn
    };

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        submit(controller);
      });
    }

    return controller;
  }

  function show(container, infoEl, onComplete) {
    container.style.display = '';
    if (typeof gsap === 'undefined') {
      container.style.opacity = '1';
      if (infoEl) infoEl.style.display = 'none';
      if (onComplete) onComplete();
      return;
    }

    /* Animate info out, bid in */
    if (infoEl) {
      gsap.to(infoEl.children, {
        opacity: 0, y: -10, stagger: 0.08, duration: 0.3, ease: 'power2.in',
        onComplete: function () {
          infoEl.style.display = 'none';
          container.style.opacity = '1';
          gsap.fromTo(container.children,
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, stagger: 0.1, duration: 0.4, ease: 'power2.out',
              onComplete: onComplete || function () {} });
        }
      });
    } else {
      container.style.opacity = '1';
      gsap.fromTo(container.children,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.4, ease: 'power2.out',
          onComplete: onComplete || function () {} });
    }
  }

  function hide(container, infoEl, onComplete) {
    if (typeof gsap === 'undefined') {
      container.style.display = 'none';
      container.style.opacity = '0';
      if (infoEl) {
        infoEl.style.display = '';
        infoEl.style.opacity = '1';
      }
      if (onComplete) onComplete();
      return;
    }

    gsap.to(container.children, {
      opacity: 0, y: -10, stagger: 0.08, duration: 0.3, ease: 'power2.in',
      onComplete: function () {
        container.style.display = 'none';
        container.style.opacity = '0';
        /* Reset form */
        var form = container.querySelector('form');
        if (form) { form.reset(); form.style.display = ''; }
        var success = container.querySelector('.bid-form__success');
        if (success) success.classList.add('hidden');
        var error = container.querySelector('.bid-form__error');
        if (error) error.classList.add('hidden');

        if (infoEl) {
          infoEl.style.display = '';
          gsap.fromTo(infoEl.children,
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, stagger: 0.1, duration: 0.4, ease: 'power2.out',
              onComplete: function () {
                /* Clear inline styles */
                Array.prototype.forEach.call(infoEl.children, function (child) {
                  gsap.set(child, { clearProps: 'opacity,y' });
                });
                if (onComplete) onComplete();
              }
            });
        } else {
          if (onComplete) onComplete();
        }
      }
    });
  }

  function submit(controller) {
    var form = controller.form;
    var item = controller.item;
    var error = controller.error;
    var success = controller.success;

    if (error) error.classList.add('hidden');

    var name = form.querySelector('[name="name"]');
    var email = form.querySelector('[name="email"]');
    var amount = form.querySelector('[name="amount"]');
    var message = form.querySelector('[name="message"]');

    var nameVal = name ? name.value.trim() : '';
    var emailVal = email ? email.value.trim() : '';
    var amountVal = amount ? amount.value.trim() : '';
    var messageVal = message ? message.value.trim() : '';

    if (!nameVal || !emailVal || !amountVal) {
      if (error) {
        error.textContent = Helpers.translate('bid_error_required',
          'Bitte alle Pflichtfelder ausf\u00fcllen.',
          'Please fill in all required fields.');
        error.classList.remove('hidden');
      }
      return;
    }

    /* Basic email format check */
    if (emailVal.indexOf('@') === -1 || emailVal.indexOf('.') === -1) {
      if (error) {
        error.textContent = Helpers.translate('bid_error_required',
          'Bitte eine g\u00fcltige E-Mail angeben.',
          'Please enter a valid email address.');
        error.classList.remove('hidden');
      }
      return;
    }

    var bid = {
      name: nameVal,
      email: emailVal,
      amount: amountVal,
      message: messageVal,
      file: item ? (item.file || '') : '',
      title: item ? Helpers.getTitle(item) : '',
      year: item ? (item.year || '') : '',
      timestamp: new Date().toISOString()
    };

    saveBid(bid);

    if (form) form.style.display = 'none';
    if (success) success.classList.remove('hidden');
  }

  window.BidSystem = {
    create: create,
    show: show,
    hide: hide,
    submit: submit,
    getAll: getAll
  };
})();
```

- [ ] **Step 2: Verify module loads**

Reload. Console: `BidSystem.getAll()` should return `[]` (or previous bids). No errors.

- [ ] **Step 3: Commit**

```bash
git add js/bid.js
git commit -m "feat: consolidated bid system module"
```

---

### Task 4.2: Integrate BidSystem into carousel

**Files:**
- Modify: `js/carousel.js`

- [ ] **Step 1: Add bid button click handler**

In `carousel.js`, inside the `initEventListeners()` function, add a click handler for bid buttons. Find the existing viewport click handler for images and add before or after it:

```javascript
    /* Bid button click */
    viewport.addEventListener('click', function (e) {
      var bidBtn = e.target.closest('.bid-btn');
      if (!bidBtn) return;
      var slide = bidBtn.closest('.carousel__slide');
      if (!slide) return;
      var idx = parseInt(slide.getAttribute('data-index'), 10);
      if (isNaN(idx) || idx >= items.length) return;

      var item = items[idx];
      var bidContainer = slide.querySelector('.carousel__plaque-bid');
      var infoEls = slide.querySelector('.carousel__plaque-meta');
      var actionsEl = slide.querySelector('.carousel__plaque-actions');

      if (!bidContainer) return;

      /* Check mobile vs desktop */
      if (window.innerWidth < 768) {
        openMobileBidModal(item);
        return;
      }

      /* Desktop inline bid */
      clearAutoplay();
      var controller = BidSystem.create(bidContainer, item);
      if (actionsEl) actionsEl.style.display = 'none';
      BidSystem.show(bidContainer, infoEls, function () {
        /* Attach close handler */
        if (controller && controller.closeBtn) {
          controller.closeBtn.addEventListener('click', function () {
            BidSystem.hide(bidContainer, infoEls, function () {
              if (actionsEl) actionsEl.style.display = '';
              startAutoplay();
            });
          });
        }
      });
    });
```

- [ ] **Step 2: Add mobile bid modal function**

Add this function inside the IIFE:

```javascript
  function openMobileBidModal(item) {
    /* Create modal overlay */
    var existing = document.querySelector('.bid-popup');
    if (existing) existing.remove();

    var popup = document.createElement('div');
    popup.className = 'bid-popup';

    var backdrop = document.createElement('div');
    backdrop.className = 'bid-popup__backdrop';

    var card = document.createElement('div');
    card.className = 'bid-popup__card';

    popup.appendChild(backdrop);
    popup.appendChild(card);
    document.body.appendChild(popup);

    var controller = BidSystem.create(card, item);

    function closeModal() {
      if (typeof gsap !== 'undefined') {
        gsap.to(card, { opacity: 0, y: 20, duration: 0.25, ease: 'power2.in',
          onComplete: function () { popup.remove(); startAutoplay(); }
        });
      } else {
        popup.remove();
        startAutoplay();
      }
    }

    backdrop.addEventListener('click', closeModal);
    if (controller && controller.closeBtn) {
      controller.closeBtn.addEventListener('click', closeModal);
    }

    /* Animate in */
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(card, { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out' });
    }

    clearAutoplay();
  }
```

- [ ] **Step 3: Verify bid in carousel**

Reload. Click "Gebot abgeben" on carousel plaque:
- Desktop: form replaces info fields with animation
- Mobile (resize to 375px): modal opens
- Submit with all fields → success message
- Back/close → returns to info

- [ ] **Step 4: Commit**

```bash
git add js/carousel.js
git commit -m "feat: integrate bid system into carousel (desktop inline + mobile modal)"
```

---

### Task 4.3: Integrate BidSystem into gallery detail

**Files:**
- Modify: `js/gallery.js`

- [ ] **Step 1: Update initInlineBid to use BidSystem**

Find the `initInlineBid()` function in gallery.js. Replace the `buildBidFormHTML()` call and bid logic with `BidSystem.create()`.

Replace `initInlineBid` with:

```javascript
  function initInlineBid() {
    detailInfo = document.getElementById('detailInfo');
    if (!detailInfo) return;

    var parent = detailInfo.parentElement;
    detailBid = document.getElementById('detailBid');

    if (!detailBid) {
      detailBid = document.createElement('div');
      detailBid.id = 'detailBid';
      detailBid.className = 'detail__info';
      detailBid.style.display = 'none';
      detailBid.style.opacity = '0';
      parent.appendChild(detailBid);
    }
  }

  function showInlineBid(item) {
    if (!detailInfo || !detailBid) return;
    var controller = BidSystem.create(detailBid, item);
    BidSystem.show(detailBid, detailInfo, function () {
      if (controller && controller.closeBtn) {
        controller.closeBtn.addEventListener('click', function () {
          BidSystem.hide(detailBid, detailInfo);
        });
      }
    });
  }
```

Also update `renderDetailStatus` to call `showInlineBid`:

```javascript
  function renderDetailStatus(item) {
    detailStatus.innerHTML = '';
    var ownerLabel = document.createElement('span');
    ownerLabel.className = 'detail__label';
    ownerLabel.textContent = t('Besitz', 'Collection');
    detailStatus.appendChild(ownerLabel);

    var ownerValue = document.createElement('p');
    ownerValue.className = 'detail__owner-value';
    ownerValue.textContent = Helpers.isAvailable(item)
      ? t('Verf\u00fcgbar', 'Available')
      : (item.owner || '');
    detailStatus.appendChild(ownerValue);

    var bidBtn = document.createElement('button');
    bidBtn.className = 'detail__bid-btn';
    bidBtn.type = 'button';
    bidBtn.textContent = t('Gebot abgeben', 'Place Bid');
    bidBtn.addEventListener('click', function () { showInlineBid(item); });
    detailStatus.appendChild(bidBtn);
  }
```

Update `resetInlineBidView` to use BidSystem:

```javascript
  function resetInlineBidView() {
    if (detailBid && detailBid.style.display !== 'none') {
      detailBid.style.display = 'none';
      detailBid.style.opacity = '0';
    }
    if (detailInfo) {
      detailInfo.style.display = '';
      detailInfo.style.opacity = '1';
      if (typeof gsap !== 'undefined') {
        Array.prototype.forEach.call(detailInfo.children, function (child) {
          gsap.set(child, { opacity: 1, y: 0 });
        });
      }
    }
  }
```

Remove the old `buildBidFormHTML`, `handleBidSubmit`, `saveBidToStorage`, `hideInlineBid` functions (they're now in bid.js).

- [ ] **Step 2: Verify bid in gallery detail**

Click a gallery image → detail panel. Click "Gebot abgeben" → form appears. Submit → success. Close detail, reopen → info view restored.

- [ ] **Step 3: Commit**

```bash
git add js/gallery.js
git commit -m "feat: integrate consolidated bid system into gallery detail panel"
```

---

### Task 4.4: Phase 4 verification checkpoint

- [ ] **Step 1: Full bid system test**

- Carousel plaque: "Gebot" → form, submit → success (green), back → info returns
- Carousel mobile: "Gebot" → modal, submit → success → modal closes
- Gallery detail: "Gebot" → form, submit → success, back → info returns
- localStorage: `JSON.parse(localStorage.getItem('besuden_bids'))` shows correct bid objects
- Language switch: all bid labels update
- Navigate prev/next while bid open → bid form closes cleanly
- Console: 0 errors

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "checkpoint: Phase 4 complete — consolidated bid system"
```

---

## Phase 5: Bugfixes & Polish

### Task 5.1: Fix nav.js accessibility

**Files:**
- Modify: `js/nav.js`
- Modify: `index.html`

- [ ] **Step 1: Fix hamburger aria-label in index.html**

Find:
```html
<button class="nav__hamburger" id="hamburger" aria-label="Menu">
```
Replace with:
```html
<button class="nav__hamburger" id="hamburger" type="button"
        aria-label="Men&uuml; &ouml;ffnen" data-i18n-aria="a11y_menu_open">
```

- [ ] **Step 2: Add aria-pressed to language buttons in nav.js**

In `js/nav.js`, find where language buttons are toggled (or add to `initNav`). After each language switch, update aria-pressed:

In `js/i18n.js`, find the section where language buttons get `.active` toggled. Add after the class toggle:
```javascript
      if (langBtns[j].getAttribute('data-lang') === lang) {
        langBtns[j].classList.add('active');
        langBtns[j].setAttribute('aria-pressed', 'true');
      } else {
        langBtns[j].classList.remove('active');
        langBtns[j].setAttribute('aria-pressed', 'false');
      }
```

- [ ] **Step 3: Commit**

```bash
git add js/nav.js js/i18n.js index.html
git commit -m "fix: hamburger aria-label, type=button, language aria-pressed"
```

---

### Task 5.2: Fix interactions.js bugs

**Files:**
- Modify: `js/interactions.js`

- [ ] **Step 1: Fix touch detection (J3)**

Find all occurrences of `'ontouchstart' in window` in interactions.js. Replace with:
```javascript
window.matchMedia && window.matchMedia('(hover: none)').matches
```

This affects `initMagnetic()`, `initLoupe()`, and `initFullscreen()`.

- [ ] **Step 2: Fix MutationObserver leak (J4)**

In `initLoupe()`, the MutationObserver is never disconnected. Store it and add cleanup:

After `new MutationObserver(...)`, store reference:
```javascript
    var loupeObserver = new MutationObserver(function () { /* existing code */ });
    loupeObserver.observe(img, { attributes: true, attributeFilter: ['src'] });
```

Add a cleanup function that disconnects when detail closes. The simplest approach: listen for detail close and disconnect:
```javascript
    /* Disconnect observer when detail closes */
    var detailEl = document.getElementById('detail');
    if (detailEl) {
      new MutationObserver(function () {
        if (!detailEl.classList.contains('open')) {
          ready = false;
          loupe.style.opacity = '0';
        }
      }).observe(detailEl, { attributes: true, attributeFilter: ['class'] });
    }
```

- [ ] **Step 3: Commit**

```bash
git add js/interactions.js
git commit -m "fix: touch detection uses hover media query, loupe observer cleanup"
```

---

### Task 5.3: Fix scroll.js race conditions

**Files:**
- Modify: `js/scroll.js`

- [ ] **Step 1: Add state guard in flyTo onComplete (J6)**

In the `flyTo` function, find the `onComplete` callback:
```javascript
      onComplete: function () {
        state = targetSec.type === 'free' ? 'free' : targetSec.id;
```

Add a guard:
```javascript
      onComplete: function () {
        /* Guard: only update state if we haven't been interrupted */
        if (flying) {
          state = targetSec.type === 'free' ? 'free' : targetSec.id;
        }
```

- [ ] **Step 2: Fix language change killing active timelines (J7)**

In `rebuildReveals`, check if timeline is active before killing:

```javascript
  function rebuildReveals() {
    sections.forEach(function (sec) {
      if (sec.type === 'reveal' && sec.el) {
        if (sec.tl && sec.tl.isActive && sec.tl.isActive()) {
          sec.tl.progress(1);
        }
        sec.tl = buildRevealTimeline(sec.el);
        sec.progress = 0;
      }
    });
  }
```

- [ ] **Step 3: Commit**

```bash
git add js/scroll.js
git commit -m "fix: scroll state-machine race conditions and timeline rebuild safety"
```

---

### Task 5.4: Phase 5 verification and final polish

- [ ] **Step 1: Run through all test checklists from spec Section 12.5**

CSS, JavaScript, A11y, and Browser checks. Fix anything that fails.

- [ ] **Step 2: Commit all remaining fixes**

```bash
git add -A
git commit -m "checkpoint: Phase 5 complete — all bugfixes and polish applied"
```

---

## Phase 6: Cleanup

### Task 6.1: Remove obsolete files

**Files:**
- Delete: `js/runtime/motion-core.min.js`
- Delete: `js/runtime/viewport-driver.min.js`
- Delete: `js/runtime/anchor-driver.min.js`
- Delete: `js/runtime/motion-aliases.js`
- Delete: `js/runtime/` (directory)
- Delete: `js/artwork-overlay.js`
- Delete: `js/home-carousel.js`
- Delete: `js/intro-sequence.js`
- Delete: `gallery.html`

- [ ] **Step 1: Remove files**

```bash
rm -rf js/runtime/
rm js/artwork-overlay.js js/home-carousel.js js/intro-sequence.js
rm gallery.html
```

- [ ] **Step 2: Verify nothing breaks**

Reload. All features still work. Console: 0 errors referencing removed files.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "cleanup: remove MotionEngine, artwork-overlay, intro-sequence, gallery.html"
```

---

### Task 6.2: Remove _github-stable reference folder

- [ ] **Step 1: Remove folder**

```bash
rm -rf _github-stable/
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "cleanup: remove _github-stable reference folder"
```

---

### Task 6.3: Update documentation

**Files:**
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/SCRIPT-LOAD-ORDER.md`
- Delete: `docs/CAROUSEL-STATES.md` (obsolete)

- [ ] **Step 1: Update ARCHITECTURE.md**

Rewrite to reflect new architecture: single page, GSAP-based, CSS modules, shared helpers, consolidated bid system, lazy gallery.

- [ ] **Step 2: Update SCRIPT-LOAD-ORDER.md**

Update to reflect new load order:
```
Vendor: gsap.min.js → ScrollTrigger.min.js → ScrollToPlugin.min.js
Foundation: helpers.js → i18n.js → overlay.js
Systems: bid.js → scroll.js → loader.js
Features: carousel.js → gallery.js → nav.js → interactions.js
```

- [ ] **Step 3: Remove obsolete docs**

```bash
rm docs/CAROUSEL-STATES.md
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: update architecture and script load order for carousel merge"
```

---

### Task 6.4: Final verification and commit

- [ ] **Step 1: Full site test**

Run through ALL test checklists from spec Section 12 (12.1 through 12.6). Every checkbox must pass.

- [ ] **Step 2: Verify offline**

Start server, load page fully, then set browser to offline mode (DevTools → Network → Offline). Navigate through all sections — everything works except the initial `bilder-metadaten.json` fetch (which already loaded).

- [ ] **Step 3: Verify console is clean**

Console: 0 errors, 0 warnings.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: carousel merge complete — single-page with GSAP carousel, lazy gallery, consolidated bids

Merges stable GitHub base with carousel feature:
- 5-phase painting animation (lift, fly, wall, enter, land)
- Gallery lazy-loads on button click (758 images)
- Consolidated bid system (one module, two integration points)
- 47 bug fixes (CSS contrast, JS race conditions, a11y)
- Zero external runtime dependencies
- WOFF2 fonts, WebP background, CSS custom properties

See docs/2026-04-07-carousel-merge-design.md for full spec."
```

---

*End of implementation plan. 6 phases, 19 tasks, ~80 steps.*
