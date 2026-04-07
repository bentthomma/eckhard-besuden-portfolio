# Script Load Order

```html
<!-- Vendor (local, no CDN) -->
<script src="js/vendor/gsap.min.js"></script>
<script src="js/vendor/ScrollTrigger.min.js"></script>
<script src="js/vendor/ScrollToPlugin.min.js"></script>

<!-- Foundation -->
<script src="js/helpers.js"></script>
<script src="js/i18n.js"></script>
<script src="js/overlay.js"></script>

<!-- Systems -->
<script src="js/bid.js"></script>
<script src="js/scroll.js"></script>
<script src="js/loader.js"></script>

<!-- Features -->
<script src="js/carousel.js"></script>
<script src="js/gallery.js"></script>
<script src="js/nav.js"></script>
<script src="js/interactions.js"></script>
```

## Dependencies

- `helpers.js` → no dependencies
- `i18n.js` → no dependencies  
- `overlay.js` → gsap
- `bid.js` → gsap, Helpers
- `scroll.js` → gsap, ScrollTrigger, ScrollToPlugin
- `loader.js` → gsap, overlay.js
- `carousel.js` → gsap, Helpers, BidSystem, overlay.js
- `gallery.js` → gsap, Helpers, BidSystem, overlay.js
- `nav.js` → overlay.js, Scroll
- `interactions.js` → gsap
