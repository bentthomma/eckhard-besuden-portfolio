# Script Load Order

Before any body scripts, an **inline `<script>` in `<head>`** (index.html line 18) runs:

```js
history.scrollRestoration = 'manual'; window.scrollTo(0, 0);
```

This prevents the browser from restoring a mid-page scroll position on reload, ensuring the loader animation always starts from the top.

---

All 16 scripts load synchronously at the end of `<body>` in index.html. Order matters because later scripts depend on globals set by earlier ones.

| #  | File                              | Purpose                                          |
|----|-----------------------------------|--------------------------------------------------|
| 1  | `js/vendor/gsap.min.js`           | GSAP core animation engine                       |
| 2  | `js/vendor/ScrollTrigger.min.js`  | Scroll-driven animation plugin                   |
| 3  | `js/vendor/ScrollToPlugin.min.js` | Programmatic scroll-to plugin                    |
| 4  | `js/helpers.js`                   | Shared utilities: translate, getTitle, resolvePath |
| 5  | `js/i18n.js`                      | DE/EN dictionaries, language switcher, exposes `window.i18n` |
| 6  | `js/overlay.js`                   | Scroll-lock stack, reduced-motion flag (`window.__overlay`, `window.__reduced`) |
| 7  | `js/bid.js`                       | Contact/bid modal form, exposes `window.BidSystem` |
| 8  | `js/text-reveal.js`               | Character-by-character text animation (extracted from scroll.js) |
| 9  | `js/scroll-ui.js`                 | Progress bar, scroll reveals, dividers (extracted from scroll.js) |
| 10 | `js/scroll.js`                    | Desktop scroll state machine, section fly transitions |
| 11 | `js/loader.js`                    | Film-strip intro animation, hero image bootstrap |
| 12 | `js/carousel.js`                  | Featured-works carousel, exposes `window.HomeCarousel` |
| 13 | `js/detail.js`                    | Artwork detail panel, FLIP animations (extracted from gallery.js) |
| 14 | `js/gallery.js`                   | Works grid, filters, search, exposes `window.Gallery` |
| 15 | `js/nav.js`                       | Nav bar scroll state, hamburger menu, mobile menu |
| 16 | `js/interactions.js`              | Email obfuscation, back-to-top, miscellaneous UI |

## Dependencies

- `helpers.js` -- no dependencies
- `i18n.js` -- no dependencies
- `overlay.js` -- gsap
- `bid.js` -- gsap, Helpers
- `text-reveal.js` -- gsap
- `scroll-ui.js` -- gsap, ScrollTrigger
- `scroll.js` -- gsap, ScrollTrigger, ScrollToPlugin, text-reveal.js, scroll-ui.js
- `loader.js` -- gsap, overlay.js
- `carousel.js` -- gsap, Helpers, BidSystem, overlay.js
- `detail.js` -- gsap, Helpers, BidSystem, overlay.js
- `gallery.js` -- gsap, Helpers, BidSystem, overlay.js, detail.js
- `nav.js` -- overlay.js, Scroll
- `interactions.js` -- gsap
