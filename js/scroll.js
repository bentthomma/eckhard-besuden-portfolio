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
  var STAGGER_GAP = 0.008;
  var BLOCK_OVERLAP = '>-0.06';
  var BACK_THRESHOLD = 0.05;
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
      if (def.type === 'reveal') {
        sec.progress = 0;
        sec.dwellDone = false;
        sec.tl = buildRevealTimeline(el);
      }
      sections.push(sec);
    });
  }

  /* --------------------------------------------------------
     TEXT REVEAL TIMELINE
     -------------------------------------------------------- */

  function wrapChars(el) {
    var text = el.textContent;
    var words = text.split(/(\s+)/); /* split keeping whitespace */
    el.innerHTML = '';
    var inners = [];

    words.forEach(function (segment) {
      if (/^\s+$/.test(segment)) {
        el.appendChild(document.createTextNode(segment));
        return;
      }
      /* Wrap each word in an inline-block so it stays together */
      var wordWrap = document.createElement('span');
      wordWrap.className = 'word-wrap';
      for (var i = 0; i < segment.length; i++) {
        var wrap = document.createElement('span');
        wrap.className = 'char-wrap';
        var inner = document.createElement('span');
        inner.className = 'char-inner';
        inner.textContent = segment[i];
        wrap.appendChild(inner);
        wordWrap.appendChild(wrap);
        inners.push(inner);
      }
      el.appendChild(wordWrap);
    });

    return inners;
  }

  function buildRevealTimeline(sectionEl) {
    var items = sectionEl.querySelectorAll('.text-reveal');
    if (!items.length) return null;

    var tl = gsap.timeline({ paused: true });

    items.forEach(function (item, idx) {
      var spans = wrapChars(item);
      gsap.set(spans, { opacity: 0.1, y: 8 });
      tl.to(spans, {
        opacity: 1, y: 0,
        stagger: STAGGER_GAP,
        duration: 0.4,
        ease: 'power2.out'
      }, idx === 0 ? 0 : BLOCK_OVERLAP);
    });

    return tl;
  }

  /* --------------------------------------------------------
     FLYTO — Animated scroll between sections
     -------------------------------------------------------- */

  function flyTo(targetId, cb) {
    var targetSec = findSection(targetId);
    if (flying || !targetSec) return;
    flying = true;
    touchAccum = 0;

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

  function initProgressBar() {
    var bar = document.getElementById('scrollProgress');
    if (!bar) return;
    gsap.ticker.add(function () {
      var max = document.body.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = 'scaleX(' + ratio + ')';
    });
  }

  /* --------------------------------------------------------
     SCROLL-TRIGGERED REVEALS
     -------------------------------------------------------- */

  function initReveals() {
    if (reduced) {
      document.querySelectorAll('.reveal, .reveal-image').forEach(function (el) {
        el.classList.add('visible');
      });
      return;
    }

    document.querySelectorAll('.reveal').forEach(function (el) {
      ScrollTrigger.create({
        trigger: el, start: 'top 85%', once: true,
        onEnter: function () { el.classList.add('visible'); }
      });
    });

    document.querySelectorAll('.reveal-image').forEach(function (el) {
      ScrollTrigger.create({
        trigger: el, start: 'top 80%', once: true,
        onEnter: function () { el.classList.add('visible'); }
      });
    });
  }

  /* --------------------------------------------------------
     SECTION DIVIDERS
     -------------------------------------------------------- */

  function initDividers() {
    document.querySelectorAll('.section-divider').forEach(function (d) {
      ScrollTrigger.create({
        trigger: d, start: 'top 92%', once: true,
        onEnter: function () { d.classList.add('visible'); }
      });
    });
  }

  /* --------------------------------------------------------
     MOBILE: Normal scroll + IntersectionObserver reveals
     No state machine, no preventDefault, no Observer.
     -------------------------------------------------------- */

  function initMobile() {
    window.scrollTo(0, 0);
    initSections(); /* Needed for navigateTo() from nav links */
    initNav();
    initProgressBar();
    initReveals();
    initDividers();

    /* Word-split text-reveals, driven by scroll position via ScrollTrigger scrub */
    document.querySelectorAll('.text-reveal').forEach(function (item) {
      var spans = wrapChars(item);
      gsap.set(spans, { opacity: 0.1, y: 8 });

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: item,
          start: 'top 85%',
          end: 'top 30%',
          scrub: 0.5
        }
      });

      tl.to(spans, {
        opacity: 1, y: 0,
        stagger: STAGGER_GAP,
        duration: 1,
        ease: 'none'
      });
    });

    /* Hide hero + nav when carousel comes into view */
    var heroEl = document.getElementById('hero');
    var navEl = document.getElementById('nav');
    var carouselEl = document.getElementById('carousel');
    if (carouselEl) {
      ScrollTrigger.create({
        trigger: carouselEl,
        start: 'top 80%',
        onEnter: function () {
          if (heroEl) gsap.to(heroEl, { opacity: 0, duration: 0.5, onComplete: function () { heroEl.style.visibility = 'hidden'; } });
          if (navEl) gsap.to(navEl, { opacity: 0, y: -18, duration: 0.4, onComplete: function () { navEl.style.pointerEvents = 'none'; } });
        },
        onLeaveBack: function () {
          if (heroEl) { heroEl.style.visibility = ''; gsap.to(heroEl, { opacity: 1, duration: 0.5 }); }
          if (navEl) { navEl.style.pointerEvents = ''; gsap.to(navEl, { opacity: 1, y: 0, duration: 0.4 }); }
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

  var isMobile = (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches) || window.innerWidth < 768;

  /* --------------------------------------------------------
     TOUCH HANDLER — Mobile state machine input
     Converts touch swipes into deltaY for the state machine.
     -------------------------------------------------------- */
  var touchStartY = 0;
  var touchAccum = 0;
  var touchActive = false;

  function onTouchStart(e) {
    if (!e.touches || !e.touches.length) return;
    touchStartY = e.touches[0].clientY;
    touchAccum = 0;
    touchActive = true;
  }

  function onTouchMove(e) {
    if (!touchActive || !e.touches || !e.touches.length) return;
    if (flying || Date.now() < cooldownUntil) {
      e.preventDefault();
      return;
    }
    var currentY = e.touches[0].clientY;
    var deltaY = touchStartY - currentY; /* positive = scroll down */
    touchStartY = currentY;

    /* Only block native scroll for hero and carousel on mobile */
    if (state === 'hero' || state === 'carousel') {
      e.preventDefault();
    }

    if (Math.abs(deltaY) < 2) return;

    var down = deltaY > 0;

    switch (state) {
      case 'hero':
        touchAccum += Math.abs(deltaY);
        if (touchAccum > 15 && down) flyTo('about');
        break;
      case 'about':
      case 'philosophy':
        /* Native scroll — ScrollTrigger handles reveals */
        break;
      case 'carousel':
        touchAccum += Math.abs(deltaY);
        if (touchAccum > 40) {
          touchAccum = 0;
          if (down) flyTo('works');
          else flyTo('philosophy');
        }
        break;
      case 'free':
        if (!down && window.scrollY <= findSection('carousel').el.offsetTop + findSection('carousel').el.offsetHeight + 200) {
          e.preventDefault();
          flyTo('carousel');
        }
        break;
    }
  }

  function onTouchEnd() {
    touchActive = false;
    touchAccum = 0;
  }

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
      /* Mobile: native scroll + ScrollTrigger for about/philosophy,
         touch state-machine only for hero/carousel snapping */
      initMobile();
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd, { passive: true });

      /* Track state via ScrollTrigger so state-machine knows current section */
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
      gsap.to(window, { scrollTo: { y: targetSec.el.offsetTop, autoKill: false }, duration: 1, ease: 'power3.inOut' });
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
        sec.tl = buildRevealTimeline(sec.el);
        sec.progress = 0;
      }
    });
  }

  /* Listen for language changes */
  document.addEventListener('langchange', function () {
    if (!isMobile && !reduced) rebuildReveals();
  });

  /* Self-initialize on DOMContentLoaded */
  document.addEventListener('DOMContentLoaded', init);

  return { init: init, flyTo: flyTo, navigateTo: navigateTo };

})();
