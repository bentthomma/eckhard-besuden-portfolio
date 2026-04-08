/* ============================================================
   CAROUSEL.JS — Featured-works carousel with 5-phase GSAP
   animation (lift, fly-off, empty wall, fly-in, land).

   Exposes: window.HomeCarousel
   ============================================================ */
(function () {
  'use strict';

  /* --------------------------------------------------------
     CONFIG
     -------------------------------------------------------- */
  var CONFIG = {
    DATA_URL: 'bilder-metadaten.json',
    FEATURED_FILES: [
      '2017-leningradervariante.jpg',
      '2020-seehasgrossultramarinblau2von10.jpg',
      '2018-abstraktesbild55.jpg',
      '2017-wolken.jpg',
      '2014-rehkitz.jpg',
      '2016-palette162.jpg',
      '2008-artbaseltableauii2von10.jpg'
    ],
    MAX_SLIDES: 8,
    AUTOPLAY_DELAY: 10000
  };

  /* --------------------------------------------------------
     STATE
     -------------------------------------------------------- */
  var viewport, track;
  var slides = [];
  var items = [];
  var currentIndex = 0;
  var autoplayTimer = null;
  var hasEntered = false;
  var isAnimating = false;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var entryObserver = null;
  var bidOpen = false;

  /* --------------------------------------------------------
     DATA LOADING
     -------------------------------------------------------- */
  function fetchData() {
    return fetch(CONFIG.DATA_URL).then(function (res) {
      if (!res.ok) throw new Error('Failed to load ' + CONFIG.DATA_URL);
      return res.json();
    });
  }

  function selectFeatured(allData) {
    var selected = [];
    var used = {};

    CONFIG.FEATURED_FILES.forEach(function (file) {
      var match = null;
      for (var i = 0; i < allData.length; i++) {
        if (allData[i].file === file) { match = allData[i]; break; }
      }
      if (match && !used[match.file]) {
        selected.push(match);
        used[match.file] = true;
      }
    });

    for (var i = 0; i < allData.length; i++) {
      if (selected.length >= CONFIG.MAX_SLIDES) break;
      if (!used[allData[i].file]) {
        selected.push(allData[i]);
        used[allData[i].file] = true;
      }
    }

    return selected;
  }

  /* --------------------------------------------------------
     HELPERS (delegating to Helpers API where possible)
     -------------------------------------------------------- */
  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function t(key, de, en) {
    if (window.Helpers && window.Helpers.translate) return window.Helpers.translate(key, de, en);
    var lang = document.documentElement.lang || 'de';
    return lang === 'en' ? en : de;
  }

  function getTitle(item) {
    return window.Helpers ? window.Helpers.getTitle(item) : (item.title_de || item.title_en || '');
  }

  function getTechnique(item) {
    return window.Helpers ? window.Helpers.getTechnique(item) : (item.technique_de || '');
  }

  function getCategory(item) {
    return window.Helpers ? window.Helpers.getCategory(item) : (item.category_de || '');
  }

  function getDimensions(item) {
    return window.Helpers ? window.Helpers.getDimensions(item) : (item.dimensions || '');
  }

  function resolvePath(p) {
    return window.Helpers ? window.Helpers.resolvePath(p) : (p || '');
  }

  /* --------------------------------------------------------
     SLIDE DOM GENERATION
     -------------------------------------------------------- */
  function metaRow(label, value) {
    return '<div class="carousel__plaque-row">' +
      '<span class="carousel__plaque-label">' + escapeHtml(label) + '</span>' +
      '<p class="carousel__plaque-value">' + (value ? escapeHtml(value) : '&mdash;') + '</p>' +
    '</div>';
  }

  function buildSlide(item, index) {
    var title = getTitle(item);
    var year = item.year ? String(item.year) : '';
    var technique = getTechnique(item);
    var dimensions = getDimensions(item);
    var category = getCategory(item);
    var loading = index < 2 ? 'eager' : 'lazy';

    var el = document.createElement('article');
    el.className = 'carousel__slide';
    el.setAttribute('data-index', index);
    el.setAttribute('aria-hidden', 'true');

    el.innerHTML =
      '<div class="carousel__scene">' +
        '<div class="carousel__artwork">' +
          '<div class="carousel__frame">' +
            '<img src="' + escapeHtml(resolvePath(item.path)) + '"' +
              ' alt="' + escapeHtml(title) + '"' +
              ' loading="' + loading + '"' +
              ' tabindex="0" role="button">' +
          '</div>' +
        '</div>' +
        '<div class="carousel__plaque" role="group" aria-label="' + escapeHtml(title) + '">' +
          '<div class="carousel__plaque-top">' +
            '<p class="carousel__plaque-artist">Eckhard Besuden</p>' +
            '<h3 class="carousel__plaque-title">' + escapeHtml(title || '\u2014') + '</h3>' +
          '</div>' +
          '<div class="carousel__plaque-meta">' +
            metaRow(t('detail_year', 'Jahr', 'Year'), year) +
            metaRow(t('detail_technique', 'Technik', 'Technique'), technique) +
            metaRow(t('detail_dimensions', 'Ma\u00dfe', 'Dimensions'), dimensions) +
            metaRow(t('detail_category', 'Kategorie', 'Category'), category) +
          '</div>' +
          '<div class="carousel__plaque-actions">' +
            '<button type="button" class="bid-btn">' + t('bid_btn', 'Kontakt aufnehmen', 'Get in Touch') + '</button>' +
          '</div>' +
          '<div class="carousel__plaque-bid" style="display:none"></div>' +
        '</div>' +
      '</div>';

    return el;
  }

  /* --------------------------------------------------------
     ACTIVE SLIDE STATE
     -------------------------------------------------------- */
  function setActiveSlide(index) {
    for (var i = 0; i < slides.length; i++) {
      var isActive = i === index;
      slides[i].classList.toggle('is-active', isActive);
      slides[i].setAttribute('aria-hidden', isActive ? 'false' : 'true');
      var plaque = slides[i].querySelector('.carousel__plaque');
      if (plaque) plaque.classList.toggle('is-visible', isActive);
    }
  }

  /* --------------------------------------------------------
     5-PHASE ANIMATION HELPERS
     -------------------------------------------------------- */
  function offscreenX(el, side) {
    var rect = el.getBoundingClientRect();
    if (side === 'left') return -(rect.left + rect.width + 100);
    return window.innerWidth - rect.left + 100;
  }

  function shadowState(el, s) {
    if (!el) return;
    if (s === 'flying') {
      el.style.filter = 'drop-shadow(0 30px 60px rgba(0,0,0,0.4))';
    } else if (s === 'lifted') {
      el.style.filter = 'drop-shadow(0 16px 40px rgba(0,0,0,0.3))';
    } else {
      el.style.filter = 'drop-shadow(0 6px 20px rgba(0,0,0,0.2))';
    }
  }

  /* --------------------------------------------------------
     AUTOPLAY
     -------------------------------------------------------- */
  function startAutoplay() {
    if (reducedMotion || items.length <= 1) return;
    clearAutoplay();
    autoplayTimer = setInterval(function () {
      if (!isAnimating) goTo(currentIndex + 1, 'next');
    }, CONFIG.AUTOPLAY_DELAY);
  }

  function clearAutoplay() {
    if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
  }

  /* --------------------------------------------------------
     goTo — 5-PHASE TRANSITION
     -------------------------------------------------------- */
  function goTo(index, direction) {
    if (isAnimating || items.length <= 1) return;
    var newIndex = ((index % items.length) + items.length) % items.length;
    if (newIndex === currentIndex) return;
    direction = direction || (newIndex > currentIndex ? 'next' : 'prev');

    isAnimating = true;
    clearAutoplay();

    var oldSlide = slides[currentIndex];
    var newSlide = slides[newIndex];
    var oldImg = oldSlide.querySelector('.carousel__frame img');
    var newImg = newSlide.querySelector('.carousel__frame img');
    var oldPlaque = oldSlide.querySelector('.carousel__plaque');
    var newPlaque = newSlide.querySelector('.carousel__plaque');

    var exitSide = direction === 'next' ? 'right' : 'left';
    var enterSide = direction === 'next' ? 'left' : 'right';
    var rotSign = direction === 'next' ? 1 : -1;

    /* Plaque animation: emerges from image direction via transform */
    var isSingleCol = window.innerWidth <= 1024;

    /* ---- Reduced-motion shortcut ---- */
    if (reducedMotion) {
      oldSlide.classList.remove('is-active');
      oldSlide.style.display = 'none';
      newSlide.classList.add('is-active');
      newSlide.style.display = '';
      gsap.set(newImg, { clearProps: 'all' });
      if (newPlaque) newPlaque.classList.add('is-visible');
      currentIndex = newIndex;
      oldSlide.setAttribute('aria-hidden', 'true');
      newSlide.setAttribute('aria-hidden', 'false');
      isAnimating = false;
      startAutoplay();
      return;
    }

    /* Prepare new slide (hidden until fly-in phase) */
    newSlide.style.display = '';
    newSlide.classList.add('is-active');
    gsap.set(newSlide, { opacity: 0 });
    var enterX = offscreenX(newImg, enterSide);
    gsap.set(newImg, { x: enterX, scale: 1.08, rotation: -rotSign * 0.6 });

    var tl = gsap.timeline({
      onComplete: function () {
        oldSlide.classList.remove('is-active');
        oldSlide.style.display = 'none';
        gsap.set(oldImg, { clearProps: 'all' });
        gsap.set(oldSlide, { clearProps: 'opacity' });
        gsap.set(newSlide, { clearProps: 'opacity' });

        currentIndex = newIndex;
        oldSlide.setAttribute('aria-hidden', 'true');
        newSlide.setAttribute('aria-hidden', 'false');

        isAnimating = false;
        startAutoplay();
      }
    });

    /* Phase 0: Plaque retreats behind image (z-index: artwork=2, plaque=1) */
    if (oldPlaque) {
      var outProps = isSingleCol
        ? { y: '-120%', duration: 0.5, ease: 'power2.in' }
        : { x: '-60%', duration: 0.5, ease: 'power2.in' };
      tl.to(oldPlaque, outProps, 0);
      tl.call(function () { oldPlaque.classList.remove('is-visible'); gsap.set(oldPlaque, { clearProps: 'all' }); oldPlaque.style.opacity = '0'; }, null, 0.5);
    }

    /* Phase 1: Lift-Off (1000ms) — starts AFTER plaque is gone */
    tl.to(oldImg, {
      scale: 1.05,
      rotation: rotSign * 0.25,
      duration: 1,
      ease: 'power1.out'
    }, 0.4);
    tl.call(function () { shadowState(oldImg, 'lifted'); }, null, 0.4);

    /* Phase 2: Fly-Off (1300ms) */
    var exitX = offscreenX(oldImg, exitSide);
    tl.to(oldImg, {
      x: exitX,
      scale: 1.08,
      rotation: rotSign * 0.5,
      duration: 1.3,
      ease: 'power3.in'
    });
    tl.call(function () { shadowState(oldImg, 'flying'); }, null, '<0.9');
    tl.to(oldImg, { opacity: 0, duration: 0.1 }, '-=0.2');

    /* Phase 3: Empty Wall (300ms pause) */
    tl.to({}, { duration: 0.3 });

    /* Phase 4: Fly-In (1600ms) */
    tl.set(newSlide, { opacity: 1 });
    tl.to(newImg, { opacity: 1, duration: 0.1 });
    tl.to(newImg, {
      x: 0,
      scale: 1.06,
      rotation: -rotSign * 0.3,
      duration: 1.6,
      ease: 'power3.out'
    }, '-=0.05');
    tl.call(function () { shadowState(newImg, 'lifted'); }, null, '-=0.8');

    /* Phase 5: Land (800ms) */
    tl.to(newImg, {
      scale: 1,
      rotation: 0,
      duration: 0.8,
      ease: 'power2.inOut'
    });
    tl.call(function () { shadowState(newImg, 'none'); }, null, '-=0.3');
    /* Plaque slides in after landing */
    if (newPlaque) {
      var inFrom = isSingleCol
        ? { opacity: 0, y: '-80%' }
        : { opacity: 0, x: '-40%' };
      var inTo = isSingleCol
        ? { opacity: 1, y: '0%', duration: 0.7, ease: 'power3.out' }
        : { opacity: 1, x: '0%', duration: 0.7, ease: 'power3.out' };
      tl.call(function () { newPlaque.classList.add('is-visible'); });
      tl.fromTo(newPlaque, inFrom, inTo);
    }
  }

  /* --------------------------------------------------------
     ENTRY ANIMATION — first painting flies in
     -------------------------------------------------------- */
  function enter() {
    if (hasEntered || !slides.length) return;
    hasEntered = true;

    var slide = slides[0];
    var img = slide.querySelector('.carousel__frame img');
    var plaque = slide.querySelector('.carousel__plaque');
    var pauseBtn = document.getElementById('carouselPause');

    if (reducedMotion || typeof gsap === 'undefined') {
      slide.classList.add('is-active');
      slide.style.display = '';
      if (plaque) plaque.classList.add('is-visible');
      if (pauseBtn) pauseBtn.classList.add('is-visible');
      startAutoplay();
      return;
    }

    /* Position off-screen right */
    var enterX = offscreenX(img, 'right');
    gsap.set(img, { x: enterX, scale: 1.1, rotation: 0.7, opacity: 0 });
    shadowState(img, 'flying');
    slide.classList.add('is-active');
    slide.style.display = '';

    var tl = gsap.timeline();

    /* Fade in */
    tl.to(img, { opacity: 1, duration: 0.1 });
    /* Fly in from right */
    tl.to(img, { x: 0, scale: 1.06, rotation: 0.35, duration: 1.6, ease: 'power3.out' }, '-=0.05');
    tl.call(function () { shadowState(img, 'lifted'); }, null, '-=0.6');
    /* Land */
    tl.to(img, { scale: 1, rotation: 0, duration: 0.8, ease: 'power2.inOut' });
    tl.call(function () { shadowState(img, 'none'); }, null, '-=0.3');
    /* Show plaque with clip-path reveal */
    tl.call(function () {
      if (plaque) plaque.classList.add('is-visible');
      startAutoplay();
    });
    if (plaque) {
      var entrySingleCol = window.innerWidth <= 1024;
      var eFrom = entrySingleCol ? { opacity: 0, y: '-80%' } : { opacity: 0, x: '-40%' };
      var eTo = entrySingleCol
        ? { opacity: 1, y: '0%', duration: 0.7, ease: 'power3.out' }
        : { opacity: 1, x: '0%', duration: 0.7, ease: 'power3.out' };
      tl.fromTo(plaque, eFrom, eTo, '-=0.3');
    }
  }

  /* --------------------------------------------------------
     VIEWPORT MEASUREMENT
     -------------------------------------------------------- */
  function measureViewport() {
    if (!viewport) return;
    var maxH = 0;
    for (var i = 0; i < slides.length; i++) {
      if (slides[i].classList.contains('is-active')) {
        maxH = Math.max(maxH, slides[i].scrollHeight);
      }
    }
    if (maxH > 0) viewport.style.minHeight = maxH + 'px';
  }

  /* --------------------------------------------------------
     MOBILE BID MODAL
     -------------------------------------------------------- */
  function openMobileBidModal(item) {
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
        popup.remove(); startAutoplay();
      }
    }

    backdrop.addEventListener('click', closeModal);
    if (controller && controller.closeBtn) {
      controller.closeBtn.addEventListener('click', closeModal);
    }

    if (typeof gsap !== 'undefined') {
      gsap.fromTo(card, { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out' });
    }
    clearAutoplay();
  }

  /* --------------------------------------------------------
     EVENT LISTENERS
     -------------------------------------------------------- */
  function initEventListeners() {
    if (!viewport) return;

    /* Hover / focus → pause autoplay */
    viewport.addEventListener('mouseenter', clearAutoplay);
    viewport.addEventListener('mouseleave', function () { startAutoplay(); });
    viewport.addEventListener('focusin', clearAutoplay);
    viewport.addEventListener('focusout', function () { startAutoplay(); });

    /* Swipe detection */
    var touchStartX = 0;
    var touchStartY = 0;
    viewport.addEventListener('touchstart', function (e) {
      if (!e.touches || !e.touches.length) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      clearAutoplay();
    }, { passive: true });

    viewport.addEventListener('touchend', function (e) {
      if (!e.changedTouches || !e.changedTouches.length) return;
      var deltaX = e.changedTouches[0].clientX - touchStartX;
      var deltaY = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        /* Swipe left = image goes left (prev), swipe right = image goes right (next) */
        if (deltaX > 0) {
          goTo(currentIndex + 1, 'next');
        } else {
          goTo(currentIndex - 1, 'prev');
        }
      } else {
        startAutoplay();
      }
    }, { passive: true });

    /* Keyboard navigation */
    document.addEventListener('keydown', function (e) {
      if (!hasEntered || isAnimating) return;
      /* Skip if an overlay is open */
      if (window.Gallery && window.Gallery.isOpen && window.Gallery.isOpen()) return;
      /* Only respond when carousel is in viewport */
      var rect = viewport.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(currentIndex + 1, 'next'); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(currentIndex - 1, 'prev'); }
    });

    /* Bid button click */
    viewport.addEventListener('click', function (e) {
      var bidBtn = e.target.closest('.bid-btn');
      if (!bidBtn) return;
      var slide = bidBtn.closest('.carousel__slide');
      if (!slide) return;
      var idx = parseInt(slide.getAttribute('data-index'), 10);
      if (isNaN(idx) || idx >= items.length) return;

      var item = items[idx];
      clearAutoplay();
      bidOpen = true;
      setTimeout(function () { bidOpen = false; }, 30000);

      /* Mobile/Tablet: use Gallery detail popup with bid */
      if (window.innerWidth <= 1024) {
        var img = slide.querySelector('.carousel__frame img');
        if (window.Gallery && typeof window.Gallery.openDetail === 'function') {
          window.Gallery.openDetail(items, idx, img, { showBid: true });
        }
        return;
      }

      /* Desktop: inline bid in plaque (as originally designed) */
      var bidContainer = slide.querySelector('.carousel__plaque-bid');
      var infoEls = slide.querySelector('.carousel__plaque-meta');
      var actionsEl = slide.querySelector('.carousel__plaque-actions');
      if (!bidContainer) return;

      var plaqueTop = slide.querySelector('.carousel__plaque-top');
      var controller = BidSystem.create(bidContainer, item);
      if (actionsEl) actionsEl.style.display = 'none';
      if (plaqueTop) plaqueTop.style.display = 'none';
      BidSystem.show(bidContainer, infoEls, function () {
        if (controller && controller.closeBtn) {
          controller.closeBtn.addEventListener('click', function () {
            BidSystem.hide(bidContainer, infoEls, function () {
              if (actionsEl) actionsEl.style.display = '';
              if (plaqueTop) {
                gsap.set(plaqueTop, { opacity: 0 });
                plaqueTop.style.display = '';
                gsap.to(plaqueTop, { opacity: 1, duration: 0.4, ease: 'power2.out' });
              }
              bidOpen = false;
              startAutoplay();
            });
          });
        }
      });
    });

    /* Image click → open detail overlay */
    viewport.addEventListener('click', function (e) {
      var img = e.target.closest('.carousel__frame img');
      if (img && window.Gallery && window.Gallery.openDetail) {
        var slide = img.closest('.carousel__slide');
        var idx = slide ? parseInt(slide.getAttribute('data-index'), 10) : 0;
        window.Gallery.openDetail(idx);
      }
    });



    /* Visibility change */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearAutoplay();
      else startAutoplay();
    });

    /* Language change → re-render slide text */
    document.addEventListener('langchange', function () {
      render();
    });

    /* "Zu allen Werken" link */
    var allWorksBtn = document.getElementById('carouselAllWorks');
    if (allWorksBtn) {
      allWorksBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var worksSection = document.getElementById('works');
        if (worksSection) worksSection.classList.remove('works--hidden');
        document.querySelectorAll('.works-gate-hidden').forEach(function (el) { el.classList.remove('works-gate-hidden'); });
        if (window.Gallery && window.Gallery.expand) window.Gallery.expand();
        if (window.Scroll && window.Scroll.navigateTo) window.Scroll.navigateTo('works');
      });
    }

    /* Resize */
    window.addEventListener('resize', measureViewport);

    /* Autoplay only when carousel is in viewport */
    if ('IntersectionObserver' in window) {
      var visObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { if (hasEntered && !bidOpen) startAutoplay(); }
          else { clearAutoplay(); }
        });
      }, { threshold: 0.1 });
      var carouselSection = document.getElementById('carousel');
      if (carouselSection) visObs.observe(carouselSection);
    }
  }

  /* --------------------------------------------------------
     ENTRY OBSERVER
     -------------------------------------------------------- */
  function initEntryObserver() {
    if (!viewport || !('IntersectionObserver' in window)) {
      if (!hasEntered && slides.length) enter();
      return;
    }

    entryObserver = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].intersectionRatio >= 0.35) {
          enter();
          entryObserver.disconnect();
          entryObserver = null;
          break;
        }
      }
    }, {
      threshold: [0.2, 0.35, 0.55]
    });

    entryObserver.observe(viewport);
  }

  /* --------------------------------------------------------
     RENDER — build / rebuild all slides into the DOM
     -------------------------------------------------------- */
  function render() {
    if (!track) return;
    track.innerHTML = '';
    slides = [];

    items.forEach(function (item, index) {
      var slide = buildSlide(item, index);
      slides.push(slide);
      track.appendChild(slide);
    });

    if (slides.length) {
      setActiveSlide(0);
      currentIndex = 0;
    }

    measureViewport();
  }

  /* --------------------------------------------------------
     INIT
     -------------------------------------------------------- */
  function init() {
    viewport = document.getElementById('carouselViewport');
    track = document.getElementById('carouselTrack');
    if (!viewport || !track) return;

    fetchData()
      .then(function (data) {
        items = selectFeatured(data || []);
        render();
        initEventListeners();
        initEntryObserver();

        /* Populate works count under carousel */
        var countEl = document.getElementById('carouselWorksCount');
        if (countEl && data) {
          var lang = document.documentElement.lang || 'de';
          countEl.textContent = data.length + (lang === 'en' ? ' works available' : ' Werke verf\u00fcgbar');
        }
      })
      .catch(function (err) {
        if (track) {
          track.innerHTML = '<p class="carousel__empty">' +
            t('home_featured_error', 'Vorschau konnte nicht geladen werden.', 'Preview could not be loaded.') +
            '</p>';
        }
      });
  }

  /* --------------------------------------------------------
     PUBLIC API
     -------------------------------------------------------- */
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

  /* --------------------------------------------------------
     BOOTSTRAP
     -------------------------------------------------------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
