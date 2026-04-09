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
    AUTOPLAY_DELAY: 10000,
    BID_TIMEOUT: 30000
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
  var isInViewport = false;
  var activeTimeline = null;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var entryObserver = null;
  var bidOpen = false;
  var totalDataCount = 0;

  /* --------------------------------------------------------
     DATA LOADING
     -------------------------------------------------------- */
  function fetchData() {
    if (window.Helpers && window.Helpers.fetchArtworkData) {
      return window.Helpers.fetchArtworkData(CONFIG.DATA_URL);
    }
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

  function updateWorksCount() {
    var countEl = document.getElementById('carouselWorksCount');
    if (!countEl || !totalDataCount) return;
    var lang = document.documentElement.lang || 'de';
    countEl.textContent = totalDataCount + (lang === 'en' ? ' works available' : ' Werke verfügbar');
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

  function shadowState(el, s, dur) {
    if (!el) return;
    var d = dur || 0.6;
    if (s === 'flying') {
      gsap.to(el, { filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.45))', duration: d, ease: 'power2.out' });
    } else if (s === 'lifted') {
      gsap.to(el, { filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.35))', duration: d, ease: 'power2.inOut' });
    } else {
      gsap.to(el, { filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.25))', duration: d, ease: 'power2.inOut' });
    }
  }

  /* --------------------------------------------------------
     AUTOPLAY
     -------------------------------------------------------- */
  function startAutoplay() {
    if (reducedMotion || items.length <= 1 || !isInViewport || bidOpen) return;
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
    if (isAnimating || items.length <= 1 || !isInViewport) return;
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
        activeTimeline = null;
        startAutoplay();
      }
    });
    activeTimeline = tl;

    /* Phase 0: Plaque retreats behind image (z-index: artwork=2, plaque=1) */
    if (oldPlaque) {
      var outProps = isSingleCol
        ? { y: '-120%', duration: 0.5, ease: 'power2.in' }
        : { x: '-60%', duration: 0.5, ease: 'power2.in' };
      tl.to(oldPlaque, outProps, 0);
      tl.call(function () { oldPlaque.classList.remove('is-visible'); gsap.set(oldPlaque, { clearProps: 'all' }); }, null, 0.5);
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
    isInViewport = true;

    var slide = slides[0];
    var img = slide.querySelector('.carousel__frame img');
    var plaque = slide.querySelector('.carousel__plaque');

    if (reducedMotion || typeof gsap === 'undefined') {
      slide.classList.add('is-active');
      slide.style.display = '';
      if (plaque) plaque.classList.add('is-visible');
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
    /* Use available section space so align-content:center can work */
    var section = viewport.closest('.section--carousel');
    if (section) {
      var sectionH = section.clientHeight;
      var viewportTop = viewport.getBoundingClientRect().top - section.getBoundingClientRect().top;
      var cta = section.querySelector('.container--cta');
      var ctaH = cta ? cta.offsetHeight + 40 : 80;
      var available = sectionH - viewportTop - ctaH;
      if (available > maxH) maxH = available;
    }
    if (maxH > 0) viewport.style.minHeight = maxH + 'px';
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
      var detailEl = document.getElementById('detail');
      if (detailEl && detailEl.classList.contains('open')) return;
      /* Skip if focus is in a form field */
      var active = document.activeElement;
      var tag = active ? active.tagName : '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
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
      setTimeout(function () { bidOpen = false; }, CONFIG.BID_TIMEOUT);

      /* Mobile/Tablet: use Gallery detail popup with bid */
      if (window.innerWidth <= 1024) {
        var img = slide.querySelector('.carousel__frame img');
        if (window.Gallery && typeof window.Gallery.openDetail === 'function') {
          window.Gallery.openDetail(items, idx, img, { showBid: true });
        }
        return;
      }

      /* Desktop: inline bid in plaque — single gsap.timeline for clean sequencing */
      var bidContainer = slide.querySelector('.carousel__plaque-bid');
      var infoEls = slide.querySelector('.carousel__plaque-meta');
      var actionsEl = slide.querySelector('.carousel__plaque-actions');
      if (!bidContainer) return;

      var plaqueTop = slide.querySelector('.carousel__plaque-top');
      var plaqueEl = slide.querySelector('.carousel__plaque');
      var controller = BidSystem.create(bidContainer, item);

      /* Collect all visible plaque elements to fade out */
      var outTargets = [];
      if (plaqueTop) Array.prototype.push.apply(outTargets, Array.prototype.slice.call(plaqueTop.children));
      if (infoEls) Array.prototype.push.apply(outTargets, Array.prototype.slice.call(infoEls.children));
      if (actionsEl) outTargets.push(actionsEl);

      var openTl = gsap.timeline();

      /* Phase 1: fade out all plaque content together */
      openTl.to(outTargets, {
        opacity: 0, y: -10, stagger: 0.03, duration: 0.25, ease: 'power2.in'
      });

      /* Phase 2: swap — hide old content, switch alignment, show bid container */
      openTl.call(function () {
        if (plaqueTop) plaqueTop.style.display = 'none';
        if (infoEls) infoEls.style.display = 'none';
        if (actionsEl) actionsEl.style.display = 'none';
        if (plaqueEl) plaqueEl.classList.add('is-bid-open');
        bidContainer.style.display = '';
        bidContainer.style.opacity = '1';
      });

      /* Phase 3: fade in bid form */
      openTl.fromTo(bidContainer.children,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.4, ease: 'power2.out' }
      );

      /* Close handler */
      if (controller && controller.closeBtn) {
        controller.closeBtn.addEventListener('click', function () {
          var closeTl = gsap.timeline();

          /* Phase 1: fade out bid form */
          closeTl.to(bidContainer.children, {
            opacity: 0, y: -10, stagger: 0.03, duration: 0.25, ease: 'power2.in'
          });

          /* Phase 2: swap — hide bid, restore alignment, bring plaque content back into flow */
          closeTl.call(function () {
            bidContainer.style.display = 'none';
            bidContainer.style.opacity = '0';
            var form = bidContainer.querySelector('form');
            if (form) { form.reset(); form.style.display = ''; }
            var success = bidContainer.querySelector('.bid-form__success');
            if (success) success.classList.add('hidden');
            var error = bidContainer.querySelector('.bid-form__error');
            if (error) error.classList.add('hidden');

            if (plaqueEl) plaqueEl.classList.remove('is-bid-open');
            if (plaqueTop) plaqueTop.style.display = '';
            if (infoEls) { infoEls.style.display = ''; infoEls.style.visibility = ''; infoEls.style.position = ''; infoEls.style.pointerEvents = ''; }
            if (actionsEl) actionsEl.style.display = '';
          });

          /* Phase 3: fade in plaque content — plaqueTop first, then meta, then actions */
          var inTargets = [];
          if (plaqueTop) Array.prototype.push.apply(inTargets, Array.prototype.slice.call(plaqueTop.children));
          if (infoEls) Array.prototype.push.apply(inTargets, Array.prototype.slice.call(infoEls.children));
          if (actionsEl) inTargets.push(actionsEl);

          closeTl.fromTo(inTargets,
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, stagger: 0.06, duration: 0.4, ease: 'power2.out' }
          );

          /* Phase 4: cleanup */
          closeTl.call(function () {
            inTargets.forEach(function (el) { gsap.set(el, { clearProps: 'opacity,y' }); });
            bidOpen = false;
            startAutoplay();
          });
        });
      }
    });

    /* Image click → open detail overlay (same as gallery) */
    viewport.addEventListener('click', function (e) {
      var img = e.target.closest('.carousel__frame img');
      if (!img) return;
      var slide = img.closest('.carousel__slide');
      if (!slide) return;
      var idx = parseInt(slide.getAttribute('data-index'), 10);
      if (isNaN(idx) || idx >= items.length) return;
      clearAutoplay();
      bidOpen = true;
      if (window.Gallery && typeof window.Gallery.openDetail === 'function') {
        window.Gallery.openDetail(items, idx, img);
      }
      /* Reset bidOpen when detail closes so autoplay can resume (max 60s) */
      var resetAttempts = 0;
      var resetBid = function () {
        var d = document.getElementById('detail');
        if (!d || !d.classList.contains('open') || ++resetAttempts > 120) { bidOpen = false; startAutoplay(); }
        else { setTimeout(resetBid, 500); }
      };
      setTimeout(resetBid, 1000);
    });



    /* Visibility change */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearAutoplay();
      else startAutoplay();
    });

    /* Language change → update text in-place (preserve currentIndex) */
    document.addEventListener('langchange', function () {
      items.forEach(function (item, index) {
        var slide = slides[index];
        if (!slide) return;
        var titleEl = slide.querySelector('.carousel__plaque-title');
        if (titleEl) titleEl.textContent = Helpers.getTitle(item) || '\u2014';
        var artistEl = slide.querySelector('.carousel__plaque-artist');
        if (artistEl) artistEl.textContent = 'Eckhard Besuden';
        var metaRows = slide.querySelectorAll('.carousel__plaque-row');
        var labels = [
          t('detail_year', 'Jahr', 'Year'),
          t('detail_technique', 'Technik', 'Technique'),
          t('detail_dimensions', 'Ma\u00dfe', 'Dimensions'),
          t('detail_category', 'Kategorie', 'Category')
        ];
        var values = [
          item.year ? String(item.year) : '\u2014',
          Helpers.getTechnique(item) || '\u2014',
          Helpers.getDimensions(item) || '\u2014',
          Helpers.getCategory(item) || '\u2014'
        ];
        metaRows.forEach(function (row, i) {
          var labelEl = row.querySelector('.carousel__plaque-label');
          var valueEl = row.querySelector('.carousel__plaque-value');
          if (labelEl && labels[i] !== undefined) labelEl.textContent = labels[i];
          if (valueEl && values[i] !== undefined) valueEl.textContent = values[i];
        });
        var bidBtn = slide.querySelector('.bid-btn');
        if (bidBtn) bidBtn.textContent = t('bid_btn', 'Kontakt aufnehmen', 'Get in Touch');
        var img = slide.querySelector('.carousel__frame img');
        if (img) img.alt = Helpers.getTitle(item) || '';
      });
      updateWorksCount();
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
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (resizeTimer) return;
      resizeTimer = setTimeout(function () { resizeTimer = null; measureViewport(); }, 150);
    });

    /* Carousel only runs when in viewport — saves performance, prevents overlap bugs */
    if ('IntersectionObserver' in window) {
      var visObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            isInViewport = true;
            if (hasEntered && !bidOpen) startAutoplay();
          } else {
            isInViewport = false;
            clearAutoplay();
            /* Kill in-flight transition to prevent overlap */
            if (activeTimeline) {
              activeTimeline.progress(1);
              activeTimeline = null;
            }
          }
        });
      }, { threshold: 0.1 });
      var carouselSection = document.getElementById('carousel');
      if (carouselSection) visObs.observe(carouselSection);
    } else {
      /* Fallback: assume always visible if no IntersectionObserver */
      isInViewport = true;
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
        totalDataCount = data ? data.length : 0;
        updateWorksCount();
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
