# Eckhard Besuden Portfolio — Carousel Merge Design Spec

**Datum:** 2026-04-07
**Status:** Approved
**Autor:** Claude Opus 4.6 + Benedikt Thomma

---

## 1. Zusammenfassung

Zusammenfuehrung der stabilen GitHub-Version (ohne Carousel, funktionierende GSAP-basierte Single-Page) mit dem Carousel-Feature der aktuellen Version. Ergebnis: eine einzelne `index.html` mit sauber integriertem Carousel, Lazy-Loading Gallery und konsolidiertem Bid-System.

**Kernentscheidungen:**
- GitHub-Stable als Basis (GSAP, ScrollTrigger, ScrollToPlugin, funktionierende State-Machine)
- Carousel neu auf GSAP implementiert (nicht MotionEngine portieren)
- Gallery lazy-loaded per Button-Klick (758 Bilder nicht vorladen)
- Bid-System in shared Modul konsolidiert
- Zero externe Laufzeit-Abhaengigkeiten (alles lokal, offline-faehig)
- gallery.html eliminiert (Single-Page)

---

## 2. Analyse: Unterschiede GitHub-Stable vs. Aktuelle Version

### 2.1 Architektur-Vergleich

| Aspekt | GitHub (stabil) | Aktuell (fehlerhaft) |
|--------|----------------|----------------------|
| Seiten | 1 (index.html) | 2 (index.html + gallery.html) |
| Animation Engine | GSAP 3.x (gsap, ScrollTrigger, ScrollToPlugin) | Custom MotionEngine (motion-core, viewport-driver, anchor-driver, motion-aliases) |
| Loader | loader.js — Film-Strip mit GSAP | intro-sequence.js — aehnlich, aber MotionEngine |
| Scroll | GSAP State-Machine (hero/about/philosophy/free) | Eigene State-Machine ohne GSAP, passive:false Wheel global |
| Gallery | Inline in index.html, alle Items mit loading="lazy" | Separate gallery.html, Pagination (48er Batches) |
| Carousel | Existiert nicht | home-carousel.js + carousel.css (856 + 297 Zeilen) |
| Detail/Bid | In gallery.js integriert (inline bid) | artwork-overlay.js — extrahiert, aber 3x dupliziert |
| CSS | 1 Datei (style.css, ~480 Zeilen) | 9 Dateien (tokens, global, nav-hero, carousel, gallery, overlays, sections, responsive, style.css) |
| Fonts | Nur TTF | TTF + WOFF2 |
| i18n | Vollstaendig, mit DE-Fallback bei fehlenden Keys | Erweitert, aber Fallback fehlt teilweise |

### 2.2 Was die GitHub-Version besser macht
- GSAP ist bewaehrt und dokumentiert — ScrollTrigger/ScrollToPlugin loesen passive-listener, scrub-animations, state-machine sauber
- Alles auf einer Seite — kein doppelter HTML-Boilerplate, keine duplizierten IDs
- Gallery inline — Filter, Suche, Detail-Panel, Bid-Form in einem Fluss
- Loader funktioniert sauber — Film-Strip nach Hero-Handoff in einer GSAP-Timeline
- Overlay/Focus-Trap simpler — ohne den komplexen Stack der aktuellen Version
- i18n hat korrekten DE-Fallback bei fehlenden Keys

### 2.3 Was die aktuelle Version beisteuert (zu uebernehmen)
- WOFF2-Fonts (deutlich schneller als nur TTF)
- Carousel als Featured-Section (gutes Feature, schlechte Implementierung)
- CSS-Aufteilung in Dateien (besser wartbar)
- Ausfuehrlichere responsive Breakpoints
- gallery-bg.png Museumswand-Hintergrund (als WebP zu konvertieren)

### 2.4 Daten-Analyse (bilder-metadaten.json)
- **758 Bilder** in 6 Kategorien (abstrakt, blumen, frauen, seebilder, sonstige, tiere)
- **Befuellte Felder:** file, path, category, category_de, category_en, title_de, year
- **Leere Felder:** title_en (alle ""), technique_de/en (alle ""), dimensions (alle ""), owner (nicht vorhanden)
- **Pfad-Format:** `assets/bilder/{category}/{filename}` — relativ, keine Thumbnails
- **Carousel Featured:** 7 kuratierte Dateien + 1 Filler = 8 Slides max

---

## 3. Seitenstruktur & Section-Flow

### 3.1 Seitenaufbau (index.html)

```
INTRO (Film-Strip Loader)       ← Aus GitHub-Stable
HERO (Vollbild, Ken Burns)      ← Aus GitHub-Stable
MARQUEE (Lauftext)              ← Aus GitHub-Stable
ABOUT (Editorial Grid)          ← Aus GitHub-Stable
PHILOSOPHY (Split-Screen)       ← Aus GitHub-Stable
CAROUSEL (Museumswand)          ← NEU — Featured Werke
GALLERY (Grid + Filter)         ← Aus GitHub-Stable, mit Lazy-Load
FOOTER                          ← Aus GitHub-Stable
```

### 3.2 Scroll State-Machine (Desktop)

```
States: hero | about | philosophy | carousel | free

hero        → wheel-down → flyTo(about)
about       → wheel: progress 0→1 (text-reveal), dann flyTo(philosophy)
            → wheel-up bei progress < 0.05 → flyTo(hero)
philosophy  → wheel: progress 0→1 (clip-path + text-reveal), dann flyTo(carousel)
            → wheel-up bei progress < 0.05 → flyTo(about)
carousel    → wheel-down → flyTo(works)        [snap, kein progress]
            → wheel-up  → flyTo(philosophy)     [snap, kein progress]
free        → normaler scroll
            → wheel-up am Top von #works → flyTo(carousel)
```

Carousel ist ein Snap-State ohne Progress-Scrubbing. Die Carousel-Navigation (Slide-Wechsel) passiert per Autoplay, Swipe, Klick oder Keyboard — nicht per Scroll-Wheel.

### 3.3 Mobile Verhalten

Normaler Document-Scroll. Alle Sections sind inline sichtbar. Text-Reveals per ScrollTrigger scrub. Philosophy-Image per ScrollTrigger clip-path. Carousel als normale Section (kein Snap). Gallery lazy per Button.

---

## 4. Carousel-Section

### 4.1 Visuelles Konzept

Die `gallery-bg.webp` (Museumsfoto mit Bank und grossem Holzrahmen) als Vollbild-Hintergrund. Gemaelde fliegen in den Rahmen ein, "haengen" dort mit Plaque-Infos, und fliegen beim Wechsel wieder raus. Galerie-Vibe wie in einem echten Museum.

### 4.2 DOM-Struktur

```html
<section class="section section--carousel" id="carousel">
  <!-- Museumswand-Hintergrund via CSS ::before (WebP + PNG Fallback) -->
  <!-- Gradient-Overlays via CSS ::after -->
  
  <div class="container">
    <span class="section__label" data-i18n="home_featured_label">Auswahl</span>
    <h2 class="section__title" data-i18n="home_featured_title">Ausgewaehlte Werke</h2>
    <p class="section__intro" data-i18n="home_featured_intro">
      Ein konzentrierter Blick auf zentrale Arbeiten.
    </p>
  </div>

  <div class="carousel" id="homeCarousel">
    <div class="carousel__viewport" id="carouselViewport">
      <div class="carousel__track" id="carouselTrack"
           aria-label="Ausgewaehlte Werke" data-i18n-aria="a11y_featured_carousel">
        <!-- Slides per JS generiert -->
      </div>
    </div>
    <button class="carousel__pause" id="carouselPause" type="button"
            aria-label="Pause" data-i18n-aria="carousel_pause">
      <svg><!-- pause/play icon --></svg>
    </button>
  </div>
  
  <div class="container">
    <a href="#works" class="carousel__all-works" data-i18n="home_all_works">
      Zu allen Werken
    </a>
  </div>
</section>
```

### 4.3 Slide-Struktur (generiert per JS)

```html
<article class="carousel__slide" data-index="0" aria-hidden="true|false">
  <div class="carousel__scene">
    <div class="carousel__artwork">
      <div class="carousel__frame">
        <img src="..." alt="..." loading="eager|lazy" fetchpriority="high|auto"
             tabindex="0" role="button" aria-label="Titel anzeigen">
      </div>
    </div>
    <div class="carousel__plaque" role="group" aria-label="Werkinfo">
      <div class="carousel__plaque-top">
        <p class="carousel__plaque-artist">Eckhard Besuden</p>
        <h3 class="carousel__plaque-title">Titel</h3>
      </div>
      <div class="carousel__plaque-meta">
        <div class="carousel__plaque-row">
          <span class="carousel__plaque-label" data-i18n="detail_year">Jahr</span>
          <p class="carousel__plaque-value">2020</p>
        </div>
        <!-- Technik, Masse, Kategorie analog -->
      </div>
      <div class="carousel__plaque-actions">
        <button type="button" class="bid-btn" data-i18n="bid_btn">Gebot abgeben</button>
      </div>
      <div class="carousel__plaque-bid" style="display:none">
        <!-- BidSystem.create() fuellt diesen Container -->
      </div>
    </div>
  </div>
</article>
```

### 4.4 Featured-Auswahl

7 kuratierte Dateien in fester Reihenfolge:
1. Bild4-2017LeningraderVariante.jpg
2. Bild2-2020Seehasgrossultramarinblau.jpg
3. 2018-abstraktesbild55.jpg
4. 2017-wolken.jpg
5. 2014-rehkitz.jpg
6. 2016-palette162.jpg
7. 2008-artbaseltableauii2von10.jpg

Plus 1 Filler aus verbleibenden Daten = 8 Slides max.
Erste 2 Slides: `loading="eager"`, `fetchpriority="high"`.
Rest: `loading="lazy"`, `fetchpriority="auto"`.

### 4.5 Animation: 5-Phasen GSAP-Timeline

Jeder Slide-Wechsel durchlaeuft diese 5 Phasen (~5 Sekunden total):

**Phase 1 — Lift-Off (0-1000ms):**
- Altes Plaque sofort hidden
- Bild: scale 1 nach 1.05, rotation 0 nach +/-0.25 rad
- Schatten: none nach "lifted" (drop-shadow 0 28px 80px rgba(0,0,0,0.32))
- Easing: power1.out
- Dauer: 1000ms

**Phase 2 — Fly-Off (1000-2300ms):**
- Bild: x nach offscreen (berechnet per offscreenX()), scale 1.05 nach 1.08, rotation +/-0.25 nach +/-0.5
- Schatten: "lifted" nach "flying" (drop-shadow 0 34px 100px rgba(0,0,0,0.42)) bei 900ms
- Opacity: 1 nach 0 bei 2100ms (100ms fade)
- Easing: power3.in
- Dauer: 1300ms

**Phase 3 — Empty Wall (2300-2600ms):**
- 300ms Pause — leere Museumswand sichtbar
- Kein Tween, nur Timing-Beat

**Phase 4 — Fly-In (2600-4200ms):**
- Neues Bild: Opacity 0 nach 1 (100ms), von gegenueberliegender Seite
- x: enterX nach 0, scale 1.08 nach 1.06, rotation -/+0.6 nach -/+0.3
- Schatten: "flying" nach "lifted" bei 3400ms
- Easing: power3.out
- Dauer: 1600ms

**Phase 5 — Land (4200-5000ms):**
- Bild: scale 1.06 nach 1, rotation nach 0
- Schatten: "lifted" nach none bei 4700ms
- Plaque fade-in (CSS transition: opacity 0 nach 1, translateY 18px nach 0, 450ms)
- Easing: power2.inOut
- Dauer: 800ms

### 4.6 Entry-Animation (erstes Bild)

Separater Flow beim ersten Betreten der Section (~2.5s):
1. Bild positioniert off-screen rechts (x: offscreenX, scale: 1.1, rotation: 0.7, opacity: 0)
2. Fade-in: opacity 0 nach 1 (100ms)
3. Fly-in von rechts: x nach 0, scale 1.1 nach 1.06, rotation 0.7 nach 0.35 (1600ms, power3.out)
4. Schatten-Wechsel: "flying" nach "lifted" bei 1000ms
5. Land: scale 1.06 nach 1, rotation 0.35 nach 0 (800ms, power2.inOut)
6. Schatten entfernt bei 2100ms
7. Plaque fade-in + Autoplay startet

Getriggert per IntersectionObserver (35% threshold).

### 4.7 Schatten-States

```css
/* Ruhend auf Wand */
.carousel__frame { box-shadow: var(--shadow-image); }

/* Lifted (nah an Wand, Phase 1/5) */
filter: drop-shadow(0 28px 80px rgba(0, 0, 0, 0.32));

/* Flying (weit von Wand, Phase 2/4) */
filter: drop-shadow(0 34px 100px rgba(0, 0, 0, 0.42));
```

### 4.8 Autoplay

- Intervall: 10.000ms
- Start: Nach Entry-Animation, wenn hasEntered && !reducedMotion && items.length > 1
- Pause bei: mouseenter, focusin, document.hidden, Bid-Form offen, overlay offen
- Resume bei: mouseleave, focusout, document.visible, Bid-Form geschlossen
- Pause-Button: Toggle-Button mit play/pause Icon-Wechsel

### 4.9 Navigation

- **Swipe:** deltaX > 50px, mehr horizontal als vertikal. Links-Swipe = vorwaerts (naechster), Rechts-Swipe = zurueck (korrigierte Richtung)
- **Keyboard:** ArrowRight = naechster, ArrowLeft = vorheriger. Nur aktiv wenn Carousel-Section im Viewport und kein Overlay offen.
- **Klick auf Bild:** Oeffnet Detail-Panel. Carousel uebergibt sein `items`-Array und `currentIndex` an die Detail-Logik in gallery.js. Gallery.js exponiert dafuer `openDetail(items, index, sourceImg)` — dieselbe Funktion die auch Gallery-Grid-Klicks nutzen. Prev/Next im Detail navigiert dann innerhalb des uebergebenen items-Array (Carousel: 8 Items, Gallery: bis zu 758).
- **Alle Guards:** isAnimating-Check verhindert Doppel-Navigation

### 4.10 Reduced Motion

Wenn `prefers-reduced-motion: reduce`:
- Kein Fly-In/Out, kein Rotation, kein Scale
- Simpler Crossfade: altes Bild opacity 1 nach 0 (300ms), neues Bild opacity 0 nach 1 (300ms)
- Kein Autoplay
- Alle Bilder statisch sichtbar

### 4.11 Public API

```javascript
window.HomeCarousel = {
  enter: function()       // Entry-Animation triggern
  next: function()        // Naechster Slide
  prev: function()        // Vorheriger Slide
  resetEntry: function()  // hasEntered zuruecksetzen
  isFirst: boolean        // getter
  isLast: boolean         // getter
  count: number           // getter
  isAnimating: boolean    // getter
}
```

---

## 5. Gallery Lazy-Loading

### 5.1 Drei Zustaende

**Collapsed (Initial):**
- Sichtbar: Section-Titel "Werke", Kurztext, Button "Alle Werke anzeigen (758)"
- Kein JSON-Fetch, kein Grid, keine Bilder, keine Filter
- Minimaler DOM-Footprint

**Loading:**
- Button wird zu Spinner/Disabled
- `fetch('bilder-metadaten.json')` laeuft
- Fehlerfall: Button zeigt Fehlermeldung, Retry moeglich

**Expanded:**
- Button verschwindet (fade-out)
- Filter-Bar + Suchfeld + Gallery-Grid erscheinen (fade-in mit Stagger)
- Alle 758 Items im DOM mit `loading="lazy"` auf Images
- Filter, Suche, Detail-Overlay voll funktional
- IntersectionObserver fuer Reveal-Animation neuer Items

### 5.2 Auto-Expand

Der "Zu allen Werken"-Link im Carousel:
1. Ruft `Scroll.navigateTo('works')` auf
2. Checkt `Gallery.isExpanded()`
3. Falls collapsed: Ruft `Gallery.expand()` auf
4. Gallery expandiert waehrend Scroll-Animation laeuft

### 5.3 Public API

```javascript
window.Gallery = {
  expand: function()      // Manueller Expand-Trigger
  isExpanded: function()  // Status-Check (boolean)
}
```

### 5.4 Detail-Panel

1:1 aus GitHub-Stable uebernommen:
- Dunkler Fullscreen-Overlay (rgba(43,41,37,0.97))
- FLIP-Animation: Gallery-Item nach Detail-Image morph
- Grid-Layout: 1.3fr (Bild) + 0.7fr (Info)
- Loupe-Zoom auf Desktop (nicht auf Touch-Geraeten)
- Fullscreen-Button mit FLIP-Animation
- Prev/Next Navigation (Klick, Swipe, Keyboard)
- Bid-Form via shared BidSystem Modul
- Escape schliesst, Backdrop-Klick schliesst

---

## 6. Bid-System (Konsolidiert)

### 6.1 Modul: bid.js nach window.BidSystem

Ein einziges Modul das von Carousel-Plaque und Gallery-Detail genutzt wird.

```javascript
window.BidSystem = {
  create: function(container, item)    // Generiert Form-HTML, bindet Events
  show: function(container, item)      // Zeigt Form mit Stagger-Animation
  hide: function(container, callback)  // Versteckt Form, ruft callback
  submit: function(item, formData)     // Validiert, speichert, zeigt Erfolg
  getAll: function()                   // Liest alle gespeicherten Gebote
}
```

### 6.2 Bid-Datenstruktur

```json
{
  "name": "Max Mustermann",
  "email": "max@example.com",
  "amount": "500",
  "message": "Optionale Nachricht",
  "file": "2017-wolken.jpg",
  "title": "Wolken",
  "year": 2017,
  "timestamp": "2026-04-07T14:30:00.000Z"
}
```

localStorage-Key: `besuden_bids` (einheitlich).

### 6.3 Verwendung

**Carousel-Plaque (Desktop >= 768px):**
- Klick "Gebot abgeben" → Info-Felder animieren raus (GSAP stagger), Bid-Form animiert rein
- Submit → Validierung → localStorage → Erfolgsmeldung (gruen)
- 2.5s Delay → Form schliesst, Info-Felder zurueck, Autoplay resumed
- Zurueck-Button → Form schliesst ohne Submit

**Carousel Mobile (< 768px):**
- Klick "Gebot abgeben" → Modal-Overlay oeffnet
- Backdrop + Card animate in (opacity, y, scale, 400ms power3.out)
- Submit → Erfolg → 2s Delay → Modal schliesst
- Backdrop-Klick oder X → Modal schliesst

**Gallery Detail-Panel:**
- Klick "Gebot abgeben" → Detail-Info animiert raus, Bid-Form animiert rein
- Gleicher Flow wie Carousel-Plaque Desktop
- Navigation (Prev/Next) waehrend Bid-Form offen → Form schliesst automatisch

### 6.4 Verbesserungen gegenueber aktuellem Stand

| Aspekt | Vorher | Nachher |
|--------|--------|---------|
| localStorage-Key | Inkonsistent (besuden_bids / bids) | Einheitlich besuden_bids |
| JSON.parse Fehler | Silent swallowed, Daten verloren | Try/catch mit console.warn, Fallback leeres Array |
| Erfolg vs Fehler visuell | Gleiche Farbe weiss | Erfolg: gruenlicher Ton, Fehler: roetlicher Ton |
| Labels | Hardcoded HTML-Strings | i18n-Keys, aktualisieren bei Sprachwechsel |
| Validierung | Nur "nicht leer" | Plus E-Mail-Format (HTML5 type="email") |
| Bid-Daten | name, email, amount, file | Plus message, title, year, timestamp |
| Code-Stellen | 3 Implementierungen | 1 Modul |

---

## 7. CSS-Architektur

### 7.1 Dateistruktur

```
css/
  style.css            Import-Hub (nur @import-Anweisungen)
  tokens.css           Farben, Fonts, Spacing, Easings, Z-Index-Map
  global.css           Reset, Body, Focus, Skip-Link, Grain, Scrollbar, Utilities
  nav-hero.css         Nav, Hamburger, Mobile-Menu, Hero, Marquee, Loader
  sections.css         About (Editorial Grid), Philosophy (Split-Screen)
  carousel.css         Carousel-Section, Plaque, Pause-Button, Slide-Szene
  gallery.css          Gallery Grid, Filter, Search, Collapsed/Expanded States
  overlays.css         Detail-Panel, Fullscreen, Modals, Bid-Form, Flip-Clone
  responsive.css       Alle Breakpoints (1024, 768, 560, 480, landscape)
  print.css            Print-Styles separat
```

### 7.2 Z-Index-Map (tokens.css)

```css
:root {
  --z-grain:        50;
  --z-back-to-top:  900;
  --z-nav:          1000;
  --z-scroll-bar:   1002;
  --z-modal:        5000;
  --z-detail:       6000;
  --z-flip-clone:   6500;
  --z-bid-modal:    7000;
  --z-fullscreen:   8000;
  --z-loader:       9999;
  --z-skip-link:    100;
}
```

### 7.3 Font-Loading

WOFF2 primaer, TTF Fallback, font-display: swap:
```css
@font-face {
  font-family: 'Cormorant Garamond';
  font-weight: 300;
  font-style: normal;
  font-display: swap;
  src: url('../assets/fonts/cormorant-garamond-300.woff2') format('woff2'),
       url('../assets/fonts/cormorant-garamond-300.ttf') format('truetype');
}
```

### 7.4 gallery-bg Konvertierung

gallery-bg.png (2.03 MB) konvertiert zu gallery-bg.webp (~300-400 KB).
CSS mit Fallback:
```css
.section--carousel::before {
  background-image: url('../assets/gallery-bg.png');
  background-image: image-set(
    url('../assets/gallery-bg.webp') type('image/webp'),
    url('../assets/gallery-bg.png') type('image/png')
  );
}
```

### 7.5 Kontrast-Fixes (WCAG AA)

| Element | Vorher | Nachher | Ratio |
|---------|--------|---------|-------|
| Plaque-Text | rgba(248,238,227,0.78) | rgba(248,238,227,0.92) | >= 4.5:1 |
| Detail-Counter | rgba(255,255,255,0.44) | rgba(255,255,255,0.7) | >= 4.5:1 |
| Bid-Form Labels | rgba(255,255,255,0.42) | rgba(255,255,255,0.75) | >= 4.5:1 |
| Bid Success | rgba(255,255,255,0.86) | rgba(160,210,170,0.9) | Visuell unterscheidbar |
| Bid Error | rgba(255,255,255,0.86) | rgba(220,160,155,0.9) | Visuell unterscheidbar |

---

## 8. JavaScript-Architektur

### 8.1 Dateistruktur & Ladereihenfolge

```html
<!-- Vendor (lokal, kein CDN) -->
<script src="js/vendor/gsap.min.js"></script>
<script src="js/vendor/ScrollTrigger.min.js"></script>
<script src="js/vendor/ScrollToPlugin.min.js"></script>

<!-- Foundation -->
<script src="js/helpers.js"></script>
<script src="js/i18n.js"></script>
<script src="js/overlay.js"></script>

<!-- Systeme -->
<script src="js/bid.js"></script>
<script src="js/scroll.js"></script>
<script src="js/loader.js"></script>

<!-- Features -->
<script src="js/carousel.js"></script>
<script src="js/gallery.js"></script>
<script src="js/nav.js"></script>
<script src="js/interactions.js"></script>
```

### 8.2 Modul-Abhaengigkeiten

```
helpers.js    → carousel.js, gallery.js, bid.js
i18n.js       → carousel.js, gallery.js, bid.js, nav.js
overlay.js    → carousel.js, gallery.js, loader.js, nav.js
bid.js        → carousel.js (Plaque-Bid), gallery.js (Detail-Bid)
scroll.js     → nav.js (navigateTo), carousel.js (State 'carousel')
GSAP          → alles ausser helpers.js, i18n.js
```

### 8.3 helpers.js (NEU) nach window.Helpers

Extrahiert aus 3 duplizierten Stellen:

```javascript
window.Helpers = {
  getLang: function()              // document.documentElement.lang || 'de'
  getTitle: function(item)         // Sprach-aware Titel
  getTechnique: function(item)     // Sprach-aware Technik
  getDimensions: function(item)    // dimensions-Feld oder Filename-Parse
  getCategory: function(item)      // Sprach-aware Kategorie
  getShortLabel: function(item)    // "Titel, Jahr"
  resolvePath: function(path)      // URL-Normalisierung
  isAvailable: function(item)      // Owner/Available-Check
  translate: function(key, de, en) // i18n mit Fallback
}
```

### 8.4 scroll.js — Erweitert

Neue State-Machine mit Carousel-State:

```
Section-Registry:
  { id: 'hero',       type: 'snap' }
  { id: 'about',      type: 'reveal' }
  { id: 'philosophy', type: 'reveal' }
  { id: 'carousel',   type: 'snap' }    ← NEU
  { id: 'works',      type: 'free' }

Carousel-State Verhalten:
  - Wheel-down → flyTo('works')
  - Wheel-up  → flyTo('philosophy')
  - Kein Progress-Scrubbing (kein deltaY-Accumulation)
  - preventDefault aktiv (kein nativer Scroll)

Free-State Rueckkehr:
  - Scroll-up am Top von #works → flyTo('carousel') (statt philosophy)
```

### 8.5 overlay.js — Erweitert

Aus GitHub-Stable, plus:
```javascript
window.__overlay = {
  push: function(id, el)  // Bestehend
  pop: function(id)       // Bestehend
  isOpen: function(id)    // NEU: boolean
  top: function()         // NEU: oberster Overlay-ID oder null
}
```
Fix: .isConnected Check bei focus-restore.

### 8.6 i18n.js — Neue Keys

```javascript
// Carousel
carousel_pause: 'Pause',
carousel_play: 'Abspielen',
home_featured_label: 'Auswahl',
home_featured_title: 'Ausgewaehlte Werke',
home_featured_intro: 'Ein konzentrierter Blick auf zentrale Arbeiten.',
home_featured_error: 'Vorschau konnte nicht geladen werden.',
home_all_works: 'Zu allen Werken',
a11y_featured_carousel: 'Ausgewaehlte Werke',

// Bid Erweiterung
bid_back: 'Zurueck',
bid_inquiry: 'Anfrage zu diesem Werk',

// Gallery Lazy-Load
gallery_show_all: 'Alle Werke anzeigen',
gallery_count_available: '{count} Werke verfuegbar',
```

### 8.7 Geloeschte Dateien

```
ENTFERNT:
  js/runtime/motion-core.min.js
  js/runtime/viewport-driver.min.js
  js/runtime/anchor-driver.min.js
  js/runtime/motion-aliases.js
  js/artwork-overlay.js
  js/home-carousel.js
  js/intro-sequence.js
  gallery.html
```

---

## 9. Offline-Garantie

**Harte Regel: Zero externe Abhaengigkeiten zur Laufzeit.**

Alles lokal:
- assets/fonts/*.woff2, *.ttf
- assets/bilder/**/*.jpg (758 Bilder)
- assets/gallery-bg.webp + .png Fallback
- js/vendor/gsap.min.js, ScrollTrigger.min.js, ScrollToPlugin.min.js
- bilder-metadaten.json
- Grain-SVG inline base64 in CSS

Kein:
- CDN-Links
- Google Fonts / Adobe Fonts
- Externe API-Calls
- Analytics / Tracking
- Externe Bild-Services
- iframe-Embeds

Test-Kriterium: `python -m http.server 8000` im Projektordner, Netzwerk auf "Offline" schalten nach initialem Load — Seite funktioniert vollstaendig (Carousel, Gallery, Bid, Modals).

---

## 10. Bekannte Bugs — Vollstaendige Fix-Liste

### 10.1 HTML/Struktur (8 Fixes)

| ID | Bug | Fix |
|----|-----|-----|
| H1 | aria-label="Menue" statt "Menü öffnen" | Korrekter Wert + data-i18n-aria="a11y_menu_open" |
| H2 | Hamburger fehlt type="button" | Hinzufuegen |
| H3 | Language-Buttons fehlt aria-pressed | aria-pressed="true/false" dynamisch |
| H4 | Kein noscript-Block | Aus GitHub-Stable uebernehmen |
| H5 | SVG viewBox/width Mismatch (18 vs 16) | viewBox="0 0 16 16" |
| H6 | Fehlende og:url Meta-Tags | Hinzufuegen |
| H7 | gallery.html als separate Seite | Eliminiert — Single-Page |
| H8 | Duplizierte IDs zwischen Seiten | Eliminiert durch Single-Page |

### 10.2 CSS (14 Fixes)

| ID | Bug | Fix |
|----|-----|-----|
| C1 | Plaque-Text Kontrast ~3:1 | Opacity 0.78 → 0.92 |
| C2 | Detail-Counter Kontrast ~2.5:1 | Opacity 0.44 → 0.7 |
| C3 | Bid-Label Kontrast ~2.2:1 | Opacity 0.42 → 0.75 |
| C4 | Bid Success/Error gleiche Farbe | Gruen vs Rot-Toene |
| C5 | Skip-Link z-index 10050 ueber Modals | var(--z-skip-link): 100 |
| C6 | text-wrap: balance kein Firefox | text-align: center Fallback |
| C7 | overflow: clip kein Safari-Fallback | overflow: hidden davor |
| C8 | Gallery-Overlay per Breakpoint statt hover | @media (hover: none) |
| C9 | Philosophy-Bild sprengt Viewport auf Tablets | min-height mit min() begrenzen |
| C10 | Detail max-height 74vh zu gross fuer Tablets | min(66vh, 40rem) |
| C11 | Loupe 160px fix, nicht responsiv | clamp(80px, 25vw, 160px) |
| C12 | prefers-reduced-motion incomplete | backdrop-filter: none ergaenzen |
| C13 | Plaque Transition Timing-Mix | Einheitlich var(--ease-standard) |
| C14 | gallery-bg.png 2 MB | → WebP ~300-400 KB |

### 10.3 JavaScript (13 Fixes)

| ID | Bug | Fix |
|----|-----|-----|
| J1 | Swipe-Richtung invertiert | deltaX > 0 ? -1 : 1 |
| J2 | Duplizierter Helper-Code (3 Dateien) | → helpers.js shared modul |
| J3 | Touch-Detection ontouchstart zu breit | matchMedia('(hover: none)') |
| J4 | MutationObserver nie disconnected (Leak) | disconnect() bei Detail-Close |
| J5 | passive:false Wheel global | Nur im managed State |
| J6 | wheelState Race Condition bei flyTo | Guard im onComplete-Callback |
| J7 | Language-Change killt Timeline mid-Animation | Check tl.isActive() vor kill() |
| J8 | localStorage Silent Fail bei Bid | Try/catch mit console.warn |
| J9 | i18n fehlende Keys geben Key-String zurueck | Fallback zu DE, dann Key |
| J10 | Doppelte Click-Handler auf Touch (Fullscreen) | Guard basierend auf Device-Type |
| J11 | MotionEngine Custom-Code | Komplett eliminiert, GSAP direkt |
| J12 | Flip-Animation doppeltes RAF Race Condition | GSAP .set() + single RAF |
| J13 | Focus-Restore auf disconnected Elements | .isConnected Check |

### 10.4 Verbesserungen (6)

| ID | Verbesserung |
|----|-------------|
| V1 | WOFF2-Fonts (kleinere Dateien) |
| V2 | CSS Custom Properties fuer z-index (dokumentierte Layer-Map) |
| V3 | Print-Stylesheet separat (sauberer) |
| V4 | Carousel "Zu allen Werken" → auto-expand Gallery |
| V5 | Bid-Daten vollstaendiger (+ message, title, year, timestamp) |
| V6 | E-Mail Validierung im Bid-Form (HTML5 + Pattern) |

---

## 11. Implementierungs-Reihenfolge

### Phase 1: Foundation (Stabile Basis)

```
1.1  Projektstruktur aufsetzen
     - GitHub-Stable Dateien als Basis kopieren
     - WOFF2-Fonts aus aktueller Version uebernehmen
     - GSAP vendor-Dateien verifizieren
     - Alte MotionEngine-Dateien nicht uebernehmen

1.2  CSS aufteilen & Tokens
     - style.css in 10 Dateien aufteilen
     - Z-Index-Map als CSS Custom Properties
     - Font-Loading mit WOFF2 + TTF Fallback
     - Kontrast-Fixes sofort einarbeiten

1.3  helpers.js + i18n.js
     - helpers.js aus duplizierten Stellen extrahieren
     - i18n.js aus GitHub-Stable + neue Carousel/Gallery/Bid Keys
     - DE-Fallback bei fehlenden Keys sicherstellen

1.4  overlay.js erweitern
     - isOpen(id) und top() hinzufuegen
     - .isConnected Check bei focus-restore
     - Bestehende push/pop API beibehalten
```

Checkpoint: Seite laeuft identisch zu GitHub-Stable (Hero → About → Philosophy → Gallery → Footer), nur sauberer strukturiert.

### Phase 2: Gallery Lazy-Load

```
2.1  Gallery HTML: Collapsed-State
     - Section-Titel, Kurztext, Button "Alle Werke anzeigen"
     - Filter-Bar und Grid initial hidden
     - Count-Anzeige "758 Werke verfuegbar"

2.2  Gallery JS: 3 Zustaende
     - State: collapsed / loading / expanded
     - Klick-Handler auf Button → fetch → render
     - Public API: Gallery.expand(), Gallery.isExpanded()
     - Auto-Expand wenn Carousel-Link geklickt

2.3  Gallery CSS: States
     - .gallery--collapsed: nur Button sichtbar
     - .gallery--loading: Spinner/disabled
     - .gallery--expanded: Grid + Filter + Suche
     - Transition zwischen States (fade)
```

Checkpoint: Gallery lazy-loaded. Button-Klick → Fetch → Grid erscheint. Filter, Suche, Detail funktionieren.

### Phase 3: Carousel

```
3.1  Carousel HTML-Section
     - Section zwischen Philosophy und Gallery in index.html
     - DOM-Struktur wie in Abschnitt 4.2 definiert
     - Platzhalter fuer JS-generierte Slides

3.2  carousel.css
     - Section-Layout mit Museumswand-Hintergrund
     - Plaque-Styling, Slide-Szene, Floating Controls
     - Responsive Breakpoints (1024, 768, 480)

3.3  carousel.js Kern
     - Data-Loading: fetch + selectFeatured
     - Slide-DOM-Generierung: buildSlide()
     - State: currentIndex, hasEntered, isAnimating
     - Viewport-Measurement: measureViewport()

3.4  carousel.js Animation
     - 5-Phasen GSAP-Timeline: buildTransitionTimeline()
     - Entry-Animation: buildEntryTimeline()
     - offscreenX() Berechnung
     - shadowState() Verwaltung
     - Reduced Motion: simpler Crossfade

3.5  carousel.js Interaktion
     - Autoplay: start/clear/pause-toggle
     - Touch: Swipe mit korrigierter Richtung
     - Keyboard: Arrow-Keys mit Viewport-Check
     - Klick auf Bild: Detail-Overlay oeffnen
     - Pause-Button: Toggle mit Icon-Wechsel

3.6  scroll.js erweitern
     - Neuer State 'carousel' (type: 'snap')
     - Wheel-Handler: carousel → works / philosophy
     - Free-State: scroll-up am Top → flyTo('carousel')
     - Mobile: Carousel als inline-Section (kein Snap)

3.7  gallery-bg.webp
     - PNG → WebP konvertieren (Qualitaet 75-80)
     - CSS image-set() mit PNG-Fallback
     - Originale PNG als Fallback behalten
```

Checkpoint: Carousel funktioniert komplett. 5-Phasen Animation, Autoplay, Swipe, Keyboard, Scroll-Integration.

### Phase 4: Bid-System

```
4.1  bid.js Modul
     - create(container, item): HTML generieren, Events binden
     - show(container, item): Form anzeigen mit Stagger
     - hide(container, callback): Form verstecken
     - submit(item, formData): Validierung + localStorage
     - getAll(): Alle Gebote lesen
     - i18n-Keys fuer alle Labels

4.2  Carousel-Plaque Integration
     - Desktop: bid.create() in Plaque-Container
     - Klick → bid.show() → Info animiert raus
     - Submit → Erfolg → 2.5s → bid.hide()
     - Zurueck → bid.hide()

4.3  Gallery-Detail Integration
     - bid.create() in Detail-Bid-Container
     - Gleicher Flow wie Carousel Desktop
     - Navigation waehrend Bid → bid.hide() automatisch

4.4  Mobile Bid-Modal
     - Modal-Overlay fuer Carousel unter 768px
     - bid.create() in Modal-Card
     - Backdrop-Klick / X → schliesst
     - Submit → Erfolg → 2s → schliesst
```

Checkpoint: Bid funktioniert an beiden Stellen. Einheitlicher Code, korrekte Validierung, visuelles Feedback.

### Phase 5: Bugfixes & Polish

```
5.1  CSS-Bugfixes
     - Alle C1-C14 Fixes anwenden
     - Responsive Issues (Tablet Philosophy, Detail max-height)
     - Browser-Fallbacks (overflow, text-wrap)

5.2  JS-Bugfixes
     - Alle J1-J13 Fixes anwenden
     - Touch-Detection, Observer-Leak, Race Conditions
     - Scroll State-Machine Guards

5.3  A11y-Fixes
     - Hamburger: aria-label + data-i18n-aria + type="button"
     - Language-Buttons: aria-pressed
     - Carousel: aria-hidden auf inaktiven Slides
     - Focus-Order durch alle interaktiven Elemente

5.4  Reduced Motion & Print
     - prefers-reduced-motion: backdrop-filter: none ergaenzen
     - Carousel: Crossfade statt Fly-Animation
     - Print: Carousel als statisches Grid, Gallery 4 Spalten

5.5  Cross-Browser Checkliste
     - Chrome, Firefox, Safari, Edge Desktop
     - Chrome Android, Safari iOS, Samsung Internet
     - Touch-Laptop Szenario (Loupe funktioniert)
```

Checkpoint: Alle 47 Punkte gefixt. WCAG AA Kontrast. Keyboard-navigierbar. Print-tauglich.

### Phase 6: Cleanup

```
6.1  Alte Dateien entfernen
     - js/runtime/ (MotionEngine komplett)
     - js/artwork-overlay.js
     - js/home-carousel.js
     - js/intro-sequence.js
     - gallery.html

6.2  _github-stable entfernen
     - Referenz-Ordner loeschen (nicht mehr noetig)

6.3  Docs aktualisieren
     - ARCHITECTURE.md: Neue Modulstruktur
     - SCRIPT-LOAD-ORDER.md: Neue Ladereihenfolge
     - DATA-CONTRACT.md: Verifizieren
     - Alte Carousel-Docs entfernen (CAROUSEL-STATES.md)

6.4  Finaler Commit
     - Sauberer Git-Status
     - Console: 0 Errors, 0 Warnings
     - Alle Tests aus Abschnitt 12 bestanden
```

---

## 12. Test-Strategie & Akzeptanzkriterien

### 12.1 Nach Phase 1 (Foundation)

```
[ ] python -m http.server 8000 → Seite laedt ohne Fehler
[ ] Console: 0 Errors, 0 Warnings
[ ] Loader-Animation spielt komplett durch → Hero sichtbar
[ ] Desktop Wheel: hero → about (text-reveal) → philosophy (clip-path) → works
[ ] Mobile Touch: Normaler Scroll, alle Sections sichtbar
[ ] Sprachwechsel DE/EN: Alle Texte aktualisieren
[ ] Modals (Datenschutz, Impressum): Oeffnen, Schliessen, Escape
[ ] Keyboard: Tab durch Nav-Links, Enter oeffnet Modal, Escape schliesst
[ ] prefers-reduced-motion: Keine Animationen, alle Inhalte sichtbar
[ ] Fonts laden korrekt (Cormorant fuer Titel, Inter fuer Body)
```

### 12.2 Nach Phase 2 (Gallery Lazy-Load)

```
[ ] Gallery-Section zeigt initial nur Titel + Button
[ ] Klick auf Button → Loading-State → Grid erscheint mit 758 Bildern
[ ] Bilder laden nur sichtbare (DevTools Network: nicht alle 758)
[ ] Filter-Buttons funktionieren (Alle, Abstrakt, Blumen, etc.)
[ ] Suche funktioniert (Debounce, leert bei leerem Input)
[ ] Klick auf Bild → Detail-Panel oeffnet (FLIP-Animation)
[ ] Detail: Prev/Next, Swipe, Keyboard
[ ] Detail: Loupe auf Desktop, nicht auf Touch
[ ] Detail: Fullscreen-Button
[ ] Sprachwechsel: Gallery-Labels aktualisieren
[ ] Back-to-Top Button erscheint beim Scrollen
```

### 12.3 Nach Phase 3 (Carousel)

```
[ ] Carousel-Section zwischen Philosophy und Gallery sichtbar
[ ] Museumswand-Hintergrund laedt (WebP)
[ ] 8 Slides geladen (7 featured + 1 filler)
[ ] Entry-Animation: Bild fliegt ein bei Section-Viewport-Entry
[ ] Autoplay: Alle 10s naechster Slide (5-Phasen komplett)
[ ] Autoplay pausiert bei: Hover, Focus, Tab-Hidden
[ ] Swipe: Links = vorwaerts, Rechts = zurueck
[ ] Keyboard: Arrows navigieren (nur wenn sichtbar)
[ ] Pause-Button: Toggle, Icon wechselt
[ ] Klick auf Bild → Detail-Panel
[ ] Plaque: Kuenstler, Titel, Jahr, Technik, Masse, Kategorie
[ ] Scroll Desktop: phil → carousel (snap) → works
[ ] Scroll Mobile: Carousel als inline-Section
[ ] "Zu allen Werken" → scrollt + expandiert Gallery
[ ] Reduced Motion: Crossfade statt Fly
[ ] 5-Phasen Timing korrekt
[ ] Schatten-Uebergaenge korrekt
```

### 12.4 Nach Phase 4 (Bid-System)

```
[ ] Carousel-Plaque: Gebot → Form erscheint
[ ] Carousel-Plaque: Zurueck → Form schliesst
[ ] Carousel-Plaque: Submit vollstaendig → Erfolg (gruen)
[ ] Carousel-Plaque: Submit unvollstaendig → Fehler (rot)
[ ] Carousel Mobile: Gebot → Modal oeffnet
[ ] Carousel Mobile: Submit → Erfolg → Modal schliesst
[ ] Gallery Detail: Gebot → gleicher Flow
[ ] localStorage: Gebote persistent, korrekte Struktur
[ ] localStorage: Fehler abgefangen
[ ] Sprachwechsel: Bid-Labels aktualisieren
[ ] Navigation waehrend Bid → Form schliesst
```

### 12.5 Nach Phase 5 (Polish)

```
CSS:
[ ] Plaque-Text Kontrast >= 4.5:1
[ ] Detail-Counter Kontrast >= 4.5:1
[ ] Bid-Labels Kontrast >= 4.5:1
[ ] Bid Success gruen, Error rot
[ ] Skip-Link unter Modals
[ ] Firefox: Titel umbricht sauber
[ ] Safari: Kein overflow-leak
[ ] Gallery-Overlay korrekt auf Touch vs Hover
[ ] Philosophy-Bild passt auf iPad Portrait
[ ] Detail-Bild passt auf Tablets

JavaScript:
[ ] Touch-Laptop: Loupe funktioniert
[ ] Detail 20x schnell oeffnen/schliessen → kein Leak
[ ] Sprachwechsel waehrend Animation → kein Sprung
[ ] Schnelles Prev/Next → kein Doppel-Slide
[ ] Tab wechseln/zurueck → Autoplay resumed

A11y:
[ ] Hamburger: korrekte aria-Attribute
[ ] Language-Buttons: aria-pressed
[ ] Carousel: aria-hidden auf inaktiven Slides
[ ] Tab-Navigation: Logische Reihenfolge
[ ] Screen Reader: Dialoge korrekt angekuendigt

Browser:
[ ] Chrome Desktop + Mobile
[ ] Firefox Desktop
[ ] Safari Desktop + iOS
[ ] Edge Desktop
[ ] Samsung Internet
[ ] Chrome Android
```

### 12.6 Nach Phase 6 (Cleanup)

```
[ ] Keine MotionEngine-Dateien im Projekt
[ ] Keine gallery.html
[ ] _github-stable entfernt
[ ] Console: 0 Errors, 0 Warnings
[ ] Keine externen URLs in HTML/CSS/JS
[ ] Git: Sauberer Commit
```

---

## 13. Risiken & Mitigationen

| Risiko | Wahrscheinlichkeit | Mitigation |
|--------|-------------------|------------|
| GSAP-Timeline Timing passt nicht zum Museumswand-Feeling | Mittel | Phase 3.4 ist isoliert. Timing-Werte sind Konstanten, leicht anpassbar. |
| gallery-bg.webp Konvertierung verliert Qualitaet | Niedrig | WebP Qualitaet 80+ testen. PNG bleibt als Fallback. |
| 758 DOM-Elemente bei Gallery-Expand verursachen Jank | Niedrig | GitHub-Stable beweist: funktioniert mit loading="lazy". IntersectionObserver fuer Reveal. |
| Scroll State-Machine mit 5 States wird fragil | Mittel | Carousel-State ist simpel (snap only, kein progress). Gruendlich testen. |
| Bid-Form Inline-Umschaltung in Plaque erzeugt Layout-Shift | Niedrig | Plaque-Container hat feste min-height. Bid-Form matched Layout. |
| Safari WebP image-set() Support | Niedrig | PNG-Fallback als erste Deklaration. Safari 16+ supportet image-set. |

---

*Ende der Design-Spec.*
