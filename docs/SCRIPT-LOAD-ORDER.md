# Script Load Order

Scripts load synchronously at the bottom of `<body>`. Order is critical.

## index.html

```
motion-core.min.js      → window.gsap (GSAP 3.12 with ScrollTrigger + ScrollToPlugin)
motion-aliases.js       → window.MotionEngine, window.ViewportDriver, window.AnchorDriver
i18n.js                 → window.i18n
overlay.js              → window.__overlay, window.__reduced
artwork-overlay.js      → window.ArtworkOverlay (requires __overlay, MotionEngine)
scroll.js               → window.Scroll (requires MotionEngine, ViewportDriver, AnchorDriver)
intro-sequence.js       → (requires MotionEngine, __overlay, __reduced)
nav.js                  → (requires __overlay, Scroll)
interactions.js         → (requires MotionEngine, AnchorDriver, __reduced)
home-carousel.js        → window.HomeCarousel (requires MotionEngine, ArtworkOverlay, Scroll)
```

## gallery.html

Same as above minus: scroll.js, intro-sequence.js, home-carousel.js.
Adds: gallery.js → window.Gallery (requires MotionEngine, ArtworkOverlay)

## Rules

- Runtime files must load first (GSAP before aliases before consumers)
- overlay.js before any overlay consumer
- scroll.js before home-carousel.js (carousel waits for scroll entry)
- Never reorder without checking the dependency chain above
