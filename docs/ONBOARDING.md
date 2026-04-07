# Developer Onboarding (30 minutes)

## Quick Start

```bash
cd "Eckhard Besuden"
python -m http.server 8080
# Open http://localhost:8080
```

## Project Structure

```
index.html          # Homepage (hero, about, philosophy, carousel)
gallery.html        # Gallery page (grid, filters, search, detail overlay)
bilder-metadaten.json  # 758 artworks metadata
css/
  style.css         # Import manifest (8 files)
  tokens.css        # Design tokens (colors, spacing, fonts)
  global.css        # Reset, body, utilities
  nav-hero.css      # Navigation + hero section
  sections.css      # About, philosophy, footer
  carousel.css      # Homepage carousel
  gallery.css       # Gallery grid + controls
  overlays.css      # Detail panel, modals, bid popup
  responsive.css    # All breakpoint overrides
js/
  runtime/          # GSAP (aliased as MotionEngine)
  overlay.js        # Scroll lock + focus trap stack
  i18n.js           # DE/EN translations
  artwork-overlay.js # Shared detail overlay + bid form
  scroll.js         # Scroll state machine + text reveals
  intro-sequence.js # Homepage intro animation
  nav.js            # Navigation + mobile menu + modals
  interactions.js   # Hover effects, loupe, fullscreen, back-to-top
  home-carousel.js  # Featured works carousel
  gallery.js        # Gallery grid, filters, search (paginated, 48/page)
```

## Key Concepts

- **No build step** — vanilla HTML/CSS/JS, served statically
- **GSAP aliased** — `gsap` → `MotionEngine`, `ScrollTrigger` → `ViewportDriver` (see docs/ARCHITECTURE.md)
- **i18n** — `data-i18n` attributes, switched via DE/EN buttons
- **Overlay stack** — `window.__overlay.push/pop` manages scroll lock + focus
- **Gallery pagination** — shows 48 items, "Load More" button for rest

## Common Tasks

### Add a new artwork
1. Save image to `assets/bilder/[category]/`
2. Add entry to `bilder-metadaten.json`
3. To feature in carousel: add filename to `CONFIG.FEATURED_FILES` in `home-carousel.js`

### Change a color
1. Edit `css/tokens.css` — change the CSS custom property
2. All consuming styles update automatically

### Add a translation
1. Open `js/i18n.js`
2. Add key to both `de` and `en` objects
3. Use `data-i18n="your_key"` in HTML

### Debug animations
- Check `window.MotionEngine` in console (should be the GSAP object)
- Check `window.HomeCarousel.isAnimating()` for stuck state
- `prefers-reduced-motion` disables all animations

## Validation

```bash
# Check JS syntax
for f in js/*.js; do node -c "$f"; done

# Check CSS brace balance
for f in css/*.css; do echo "$f: $(grep -o '{' $f | wc -l) / $(grep -o '}' $f | wc -l)"; done
```
