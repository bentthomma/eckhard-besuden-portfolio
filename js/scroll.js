/* ============================================================
   SCROLL.JS — Section-fly state machine + text reveal

   Uses GSAP Observer (bundled in ScrollTrigger) for unified
   wheel + touch input with correct passive listener handling.

   States: hero | about | philosophy | free
   ============================================================ */

var Scroll = (function () {
  'use strict';

  if (typeof gsap === 'undefined') { return { init: function () {}, flyTo: function () {}, navigateTo: function () {} }; }
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  /* -- Constants -- */
  var SCROLL_SPEED = 0.0004;
  var FLY_DURATION = 1.2;
  var FLY_EASE = 'power3.inOut';
  var DELTA_CAP = 80;
  var COOLDOWN_MS = 400;
  var NAV_THRESHOLD = 80;
  var STAGGER_GAP = (window.TextReveal && window.TextReveal.STAGGER_GAP) || 0.004;
  var BACK_THRESHOLD = 0.05;
  var SNAP_DELAY = 400;
  var SNAP_OFF_DURATION = 2000;
  /* -- Mutable state -- */
  var state = 'hero';
  var flying = false;
  var cooldownUntil = 0;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -- Section registry -- */
  var sections = [];
  var navEl = null;
  var navWasScrolled = null;
  var navWasCarouselHidden = null;

  /* --------------------------------------------------------
     SECTION SETUP
     -------------------------------------------------------- */

  function findSection(id) {
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].id === id) return sections[i];
    }
    return null;
  }

  function initSections() {
    var defs = [
      { id: 'hero',       type: 'snap' },
      { id: 'about',      type: 'reveal' },
      { id: 'philosophy', type: 'reveal' },
      { id: 'carousel',   type: 'snap' },
      { id: 'works',      type: 'free' }
    ];

    sections = [];
    defs.forEach(function (def) {
      var el = document.getElementById(def.id);
      if (!el) return;
      var sec = { id: def.id, el: el, type: def.type };
      if (def.type === 'reveal' && !reduced) {
        sec.progress = 0;
        sec.dwellDone = false;
        sec.tl = buildRevealTimeline(el);
      }
      sections.push(sec);
    });
  }

  /* --------------------------------------------------------
     TEXT REVEAL — delegated to text-reveal.js
     -------------------------------------------------------- */
  var wrapChars = window.TextReveal ? window.TextReveal.wrapChars : function () { return []; };
  var buildRevealTimeline = window.TextReveal ? window.TextReveal.buildTimeline : function () { return null; };

  /* --------------------------------------------------------
     FLYTO — Animated scroll between sections
     -------------------------------------------------------- */

  function flyTo(targetId, cb) {
    var targetSec = findSection(targetId);
    if (flying || !targetSec) return;
    flying = true;

    var y = targetSec.el.offsetTop;

    /* Safety: unlock flying after FLY_DURATION + buffer in case onComplete/onInterrupt never fire */
    setTimeout(function () { flying = false; }, (FLY_DURATION * 1000) + 500);

    gsap.to(window, {
      scrollTo: { y: y, autoKill: false },
      duration: FLY_DURATION,
      ease: FLY_EASE,
      onInterrupt: function () {
        flying = false;
        cooldownUntil = Date.now() + COOLDOWN_MS;
      },
      onComplete: function () {
        if (flying) {
          state = targetSec.type === 'free' ? 'free' : targetSec.id;
        }

        syncNavState();
        flying = false;
        cooldownUntil = Date.now() + COOLDOWN_MS;

        if (targetSec.id === 'carousel' && window.HomeCarousel) {
          window.HomeCarousel.enter();
        }

        if (cb) cb();
      }
    });
  }

  /* --------------------------------------------------------
     WHEEL HANDLER — Desktop only. Direct, proven, reliable.
     preventDefault blocks native scroll in managed states.
     -------------------------------------------------------- */

  function onWheel(e) {
    if (flying) { e.preventDefault(); return; }
    if (Date.now() < cooldownUntil) { e.preventDefault(); return; }

    if (state !== 'free') e.preventDefault();

    if (Math.abs(e.deltaY) < 3) return;

    var down = e.deltaY > 0;

    switch (state) {
      case 'hero':
        if (down) flyTo('about');
        break;

      case 'about':
        handleRevealState('about', 'hero', 'philosophy', down, e.deltaY);
        break;

      case 'philosophy':
        handleRevealState('philosophy', 'about', 'carousel', down, e.deltaY);
        break;

      case 'carousel':
        e.preventDefault();
        if (down) flyTo('works');
        else flyTo('philosophy');
        break;

      case 'free':
        if (!down && window.scrollY <= findSection('carousel').el.offsetTop + findSection('carousel').el.offsetHeight + 200) {
          e.preventDefault();
          flyTo('carousel');
        }
        break;
    }
  }

  function updatePhilReveal(sec) {
    /* Drive philosophy image clip-path + scale with scroll progress */
    if (sec.id !== 'philosophy') return;
    var img = sec.el.querySelector('.phil-reveal');
    if (!img) return;
    var p = sec.progress; /* 0 → 1 */
    var inset = 15 * (1 - p);   /* 15% → 0% */
    var scale = 1.15 - (0.15 * p); /* 1.15 → 1 */
    gsap.set(img, { clipPath: 'inset(' + inset + '%)', scale: scale });
  }

  function handleRevealState(id, prevId, nextId, down, rawDelta) {
    var sec = findSection(id);
    if (!sec || !sec.tl) return;

    var delta = Math.min(Math.abs(rawDelta), DELTA_CAP) * SCROLL_SPEED;

    if (down) {
      if (sec.progress >= 1) {
        if (!sec.dwellDone) {
          sec.dwellDone = true;
          return;
        }
        flyTo(nextId);
      } else {
        sec.progress = Math.min(1, sec.progress + delta);
        sec.dwellDone = false;
        sec.tl.progress(sec.progress);
        updatePhilReveal(sec);
      }
    } else {
      if (sec.progress >= 1) {
        sec.dwellDone = false;
        flyTo(prevId);
      } else if (sec.progress < BACK_THRESHOLD) {
        flyTo(prevId);
      } else {
        sec.progress = Math.max(0, sec.progress - delta);
        sec.tl.progress(sec.progress);
        updatePhilReveal(sec);
      }
    }
  }


  /* --------------------------------------------------------
     NAV SCROLL STATE
     -------------------------------------------------------- */

  function syncNavState() {
    if (!navEl) return;

    var isScrolled = window.scrollY > NAV_THRESHOLD;
    var isCarouselHidden = !reduced && state === 'carousel';

    if (isScrolled !== navWasScrolled) {
      navEl.classList.toggle('nav--scrolled', isScrolled);
      navWasScrolled = isScrolled;
    }

    if (isCarouselHidden !== navWasCarouselHidden) {
      navEl.classList.toggle('nav--carousel-hidden', isCarouselHidden);
      navWasCarouselHidden = isCarouselHidden;
    }
  }

  function initNav() {
    navEl = document.getElementById('nav');
    if (!navEl) return;

    syncNavState();
    gsap.ticker.add(function () {
      syncNavState();
    });
  }

  /* --------------------------------------------------------
     SCROLL PROGRESS BAR
     -------------------------------------------------------- */

  /* --------------------------------------------------------
     SCROLL UI — delegated to scroll-ui.js
     -------------------------------------------------------- */
  var initProgressBar = window.ScrollUI ? window.ScrollUI.initProgressBar : function () {};
  var initReveals = window.ScrollUI ? window.ScrollUI.initReveals : function () {};
  var initDividers = window.ScrollUI ? window.ScrollUI.initDividers : function () {};

  /* --------------------------------------------------------
     MOBILE: Normal scroll + IntersectionObserver reveals
     No state machine, no preventDefault, no Observer.
     -------------------------------------------------------- */

  function initMobile() {
    initSections(); /* Needed for navigateTo() from nav links */
    initNav();
    initProgressBar();
    initReveals();
    initDividers();

    /* Text-reveals: scroll-driven per element */
    document.querySelectorAll('.text-reveal').forEach(function (item) {
      var spans = wrapChars(item);
      gsap.set(spans, { opacity: 0.1, y: 8 });
      gsap.to(spans, {
        opacity: 1, y: 0,
        stagger: STAGGER_GAP,
        duration: 0.5,
        ease: 'none',
        scrollTrigger: {
          trigger: item,
          start: 'top 90%',
          end: 'top 40%',
          scrub: true
        }
      });
    });

    /* Hide hero + nav when carousel comes into view */
    var heroEl = document.getElementById('hero');
    var navEl = document.getElementById('nav');
    var carouselEl = document.getElementById('carousel');
    if (carouselEl) {
      ScrollTrigger.create({
        trigger: carouselEl,
        start: 'top 95%',
        end: 'bottom 10%',
        onEnter: function () {
          if (heroEl) gsap.to(heroEl, { opacity: 0, duration: 0.5, onComplete: function () { heroEl.style.visibility = 'hidden'; } });
          if (navEl) gsap.to(navEl, { opacity: 0, duration: 0.4, onComplete: function () { navEl.style.pointerEvents = 'none'; } });
        },
        onLeave: function () {
          /* Past carousel — show nav again */
          if (navEl) { navEl.style.pointerEvents = ''; gsap.to(navEl, { opacity: 1, duration: 0.4 }); }
        },
        onEnterBack: function () {
          /* Back in carousel from below — hide nav */
          if (navEl) gsap.to(navEl, { opacity: 0, duration: 0.4, onComplete: function () { navEl.style.pointerEvents = 'none'; } });
        },
        onLeaveBack: function () {
          /* Above carousel — show everything */
          if (heroEl) { heroEl.style.visibility = ''; gsap.to(heroEl, { opacity: 1, duration: 0.5 }); }
          if (navEl) { navEl.style.pointerEvents = ''; gsap.to(navEl, { opacity: 1, duration: 0.4 }); }
        }
      });
    }

    /* Philosophy image: scroll-driven via ScrollTrigger */
    var philImg = document.querySelector('.phil-reveal');
    if (philImg) {
      gsap.set(philImg, { clipPath: 'inset(15%)', scale: 1.15 });
      ScrollTrigger.create({
        trigger: philImg,
        start: 'top 80%',
        end: 'bottom 20%',
        onUpdate: function (self) {
          var p = self.progress;
          gsap.set(philImg, { clipPath: 'inset(' + (15 * (1 - p)) + '%)', scale: 1.15 - (0.15 * p) });
        }
      });
    }

  }

  /* --------------------------------------------------------
     INIT — Desktop: state machine. Mobile: native scroll.
     -------------------------------------------------------- */

  /* Note: isMobile is sampled once at init. Changing device orientation or
     resizing across the mobile/desktop threshold requires a page reload.
     This is acceptable because the scroll state machine cannot be safely
     torn down and rebuilt at runtime. */
  var isMobile = (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches) || window.innerWidth < 768;

  function init() {
    if (reduced) {
      initSections();
      initReveals();
      initDividers();
      initNav();
      initProgressBar();
      document.querySelectorAll('.text-reveal').forEach(function (el) {
        el.style.opacity = '1';
      });
      var philImg = document.querySelector('.phil-reveal');
      if (philImg) gsap.set(philImg, { clipPath: 'inset(0%)', scale: 1 });
      return;
    }

    if (isMobile) {
      /* Mobile: pure native scroll + JS-based IntersectionObserver snap on carousel.
         No CSS scroll-snap — browser handles vertical scroll natively. */
      initMobile();

      /* Track state via ScrollTrigger for nav-hide */
      ['about', 'philosophy', 'carousel'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: 'top center',
          end: 'bottom center',
          onEnter: function () { state = id; syncNavState(); },
          onEnterBack: function () { state = id; syncNavState(); }
        });
      });
      return;
    }

    /* Desktop: full state machine */
    window.scrollTo(0, 0);
    initSections();
    initNav();
    initProgressBar();
    initReveals();
    initDividers();
    window.addEventListener('wheel', onWheel, { passive: false });
  }

  /* --------------------------------------------------------
     CAROUSEL SNAP (Mobile + Tablet, < 1200px)
     Runs after init() for non-desktop viewports.
     -------------------------------------------------------- */
  function initCarouselSnap() {
    if (reduced) return;
    if (window.innerWidth >= 1200) return;
    var snapEl = document.getElementById('carousel');
    if (!snapEl) return;

    var snapTimer = null;
    var snapOff = false;
    var lastY = window.scrollY;
    var dir = 'down';

    window.addEventListener('scroll', function () {
      dir = window.scrollY > lastY ? 'down' : 'up';
      lastY = window.scrollY;
    }, { passive: true });

    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (snapOff || dir === 'up') return;
        /* Only snap when scrolling INTO the carousel (top half entering viewport),
           not when already past it and scrolling further down */
        var secRect = snapEl.getBoundingClientRect();
        var pastSnap = secRect.bottom <= window.innerHeight + 50;
        if (pastSnap) return;

        if (entry.isIntersecting && entry.intersectionRatio > 0.3 && entry.intersectionRatio < 0.9) {
          clearTimeout(snapTimer);
          snapTimer = setTimeout(function () {
            if (snapOff || dir !== 'down') return;
            /* Re-check: user might have scrolled past during the delay */
            var r = snapEl.getBoundingClientRect();
            if (r.bottom <= window.innerHeight + 50) return;
            var targetY = window.scrollY + r.top + r.height - window.innerHeight;
            window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
          }, SNAP_DELAY);
        }
      });
    }, { threshold: [0.3, 0.5, 0.7, 0.9] }).observe(snapEl);

    /* Touch cancels pending snap */
    window.addEventListener('touchstart', function () { clearTimeout(snapTimer); }, { passive: true });
    window.addEventListener('touchmove', function () { clearTimeout(snapTimer); }, { passive: true });

    /* Nav links and Gallery expand disable snap temporarily */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function () {
        snapOff = true;
        clearTimeout(snapTimer);
        setTimeout(function () { snapOff = false; }, SNAP_OFF_DURATION);
      });
    });

    /* Disable snap when Gallery is expanded (user is browsing works) */
    var worksObserver = new MutationObserver(function () {
      var worksEl = document.getElementById('works');
      if (worksEl && !worksEl.classList.contains('works--hidden')) {
        snapOff = true;
        clearTimeout(snapTimer);
      }
    });
    var worksEl = document.getElementById('works');
    if (worksEl) worksObserver.observe(worksEl, { attributes: true, attributeFilter: ['class'] });
  }

  /* --------------------------------------------------------
     PUBLIC API
     -------------------------------------------------------- */

  function navigateTo(targetId) {
    var targetSec = findSection(targetId);
    if (!targetSec) return;

    /* Kill any in-flight scroll animation */
    gsap.killTweensOf(window);
    flying = false;

    for (var i = 0; i < sections.length; i++) {
      var sec = sections[i];
      if (sec.tl) { sec.progress = 1; sec.tl.progress(1); }
      if (sec.id === targetId) break;
    }
    /* On mobile/reduced: simple scroll instead of state-machine flyTo */
    if (isMobile || reduced) {
      /* Carousel: scroll to snap point (section bottom aligned with viewport bottom) */
      if (targetId === 'carousel') {
        var cRect = targetSec.el.getBoundingClientRect();
        var targetY = window.scrollY + cRect.top + cRect.height - window.innerHeight;
        window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      } else {
        targetSec.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      flyTo(targetId);
    }
  }

  /* Rebuild text-reveal timelines after language change */
  function rebuildReveals() {
    sections.forEach(function (sec) {
      if (sec.type === 'reveal' && sec.el) {
        if (sec.tl && sec.tl.isActive && sec.tl.isActive()) {
          sec.tl.progress(1);
        }
        var wasComplete = sec.progress >= 1;
        sec.tl = buildRevealTimeline(sec.el);
        if (wasComplete) {
          sec.progress = 1;
          sec.tl.progress(1);
        } else {
          sec.progress = 0;
        }
      }
    });
  }

  /* Listen for language changes */
  document.addEventListener('langchange', function () {
    if (!isMobile && !reduced) rebuildReveals();
  });

  /* Self-initialize on DOMContentLoaded */
  document.addEventListener('DOMContentLoaded', function () {
    init();
    initCarouselSnap();
  });

  return { init: init, flyTo: flyTo, navigateTo: navigateTo };

})();
