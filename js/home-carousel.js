/* ============================================================
   HOME-CAROUSEL.JS - Featured stage for the homepage
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
    AUTOPLAY_DELAY: 10000
  };
  var BID_STORAGE_KEY = 'besuden_bids';

  var motion = window.MotionEngine;
  var viewport;
  var track;
  var slides = [];
  var items = [];
  var currentIndex = 0;
  var autoplayTimer = null;
  var hasEntered = false;
  var isAnimating = false;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var overlayController;
  var entryObserver;

  function getLang() {
    return document.documentElement.lang || 'de';
  }

  function translate(key, fallbackDe, fallbackEn) {
    if (window.i18n && typeof window.i18n.t === 'function') return window.i18n.t(key);
    return getLang() === 'en' ? fallbackEn : fallbackDe;
  }

  function resolvePath(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path) || /^\/\//.test(path) || path.charAt(0) === '/') return path;
    return path.replace(/^\/+/, '');
  }

  function getTitle(item) {
    if (!item) return '';
    if (getLang() === 'en' && item.title_en) return item.title_en;
    return item.title_de || item.title_en || '';
  }

  function getCategory(item) {
    if (!item) return '';
    if (getLang() === 'en' && item.category_en) return item.category_en;
    return item.category_de || item.category_en || '';
  }

  function getTechnique(item) {
    if (!item) return '';
    if (getLang() === 'en' && item.technique_en) return item.technique_en;
    return item.technique_de || '';
  }

  function getDimensions(item) {
    if (!item) return '';
    if (item.dimensions) return item.dimensions;
    var match = item.file && item.file.match(/(\d{2,4})x(\d{2,4})/);
    if (match) return match[1] + ' x ' + match[2] + ' cm';
    return '';
  }

  function getShortLabel(item) {
    var title = getTitle(item);
    var year = item && item.year ? String(item.year) : '';
    if (title && year) return title + ', ' + year;
    return title || year;
  }

  function selectFeatured(data) {
    var selected = [];
    var used = {};

    CONFIG.FEATURED_FILES.forEach(function (file) {
      var match = data.find(function (item) {
        return item.file === file;
      });
      if (match && !used[match.file]) {
        selected.push(match);
        used[match.file] = true;
      }
    });

    data.forEach(function (item) {
      if (selected.length >= 8 || used[item.file]) return;
      selected.push(item);
      used[item.file] = true;
    });

    return selected;
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function createDetail(label, value) {
    return '' +
      '<div class="home-carousel__plaque-row">' +
        '<span class="home-carousel__plaque-label">' + escapeHtml(label) + '</span>' +
        '<p class="home-carousel__plaque-value">' + (value ? escapeHtml(value) : '&mdash;') + '</p>' +
      '</div>';
  }

  function createSlide(item, index) {
    var slide = document.createElement('article');
    var title = getTitle(item);
    var category = getCategory(item);
    var technique = getTechnique(item);
    var dimensions = getDimensions(item);
    var year = item.year ? String(item.year) : '';
    var loading = index < 2 ? 'eager' : 'lazy';
    var fetchPriority = index === 0 ? 'high' : 'auto';

    slide.className = 'home-carousel__slide';
    slide.setAttribute('data-index', index);
    slide.setAttribute('aria-hidden', 'true');

    slide.innerHTML = '' +
      '<div class="home-carousel__scene">' +
        '<div class="home-carousel__artwork">' +
          '<div class="home-carousel__frame">' +
            '<div class="home-carousel__frame-inner">' +
              '<img src="' + resolvePath(item.path) + '" alt="' + escapeHtml(title) + '" loading="' + loading + '" fetchpriority="' + fetchPriority + '" tabindex="0" role="button" aria-label="' + escapeHtml(title) + '">' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="home-carousel__plaque" role="group" aria-label="' + escapeHtml(title) + '">' +
          '<div class="home-carousel__plaque-top">' +
            '<p class="home-carousel__plaque-artist">Eckhard Besuden</p>' +
            '<h3 class="home-carousel__plaque-title">' + escapeHtml(title || '\u2014') + '</h3>' +
          '</div>' +
          '<div class="home-carousel__plaque-grid">' +
            createDetail(translate('detail_year', 'Jahr', 'Year'), year) +
            createDetail(translate('detail_technique', 'Technik', 'Technique'), technique) +
            createDetail(translate('detail_dimensions', 'Masse', 'Dimensions'), dimensions) +
            createDetail(translate('detail_category', 'Kategorie', 'Category'), category) +
          '</div>' +
          '<div class="home-carousel__plaque-footer">' +
            '<button type="button" class="home-carousel__bid-btn">' + (getLang() === 'en' ? 'Place Bid' : 'Gebot abgeben') + '</button>' +
          '</div>' +
          '<div class="home-carousel__plaque-bid" style="display:none">' +
            '<form class="home-carousel__bid-form" novalidate>' +
              '<div class="home-carousel__bid-field"><label>' + (getLang() === 'en' ? 'Name' : 'Name') + '</label><input type="text" name="name" required></div>' +
              '<div class="home-carousel__bid-field"><label>' + (getLang() === 'en' ? 'Email' : 'E-Mail') + '</label><input type="email" name="email" required></div>' +
              '<div class="home-carousel__bid-field"><label>' + (getLang() === 'en' ? 'Your Bid (EUR)' : 'Ihr Gebot (EUR)') + '</label><input type="number" name="amount" min="1" required></div>' +
              '<button type="submit" class="home-carousel__bid-submit">' + (getLang() === 'en' ? 'Submit' : 'Absenden') + '</button>' +
            '</form>' +
            '<button type="button" class="home-carousel__bid-back">&larr; ' + (getLang() === 'en' ? 'Back' : 'Zurueck') + '</button>' +
            '<div class="home-carousel__bid-success" style="display:none"><p>' + (getLang() === 'en' ? 'Thank you!' : 'Vielen Dank!') + '</p></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    return slide;
  }

  function showStaticSlide(index) {
    slides.forEach(function (slide, slideIndex) {
      var isActive = slideIndex === index;
      var image = slide.querySelector('.home-carousel__frame');
      var plaque = slide.querySelector('.home-carousel__plaque');
      slide.style.opacity = isActive ? '1' : '0';
      slide.style.pointerEvents = isActive ? 'auto' : 'none';
      if (image) {
        image.style.opacity = isActive ? '1' : '';
        image.style.transform = 'none';
      }
      if (plaque) {
        if (isActive) {
          plaque.classList.add('is-visible');
        } else {
          plaque.classList.remove('is-visible');
        }
      }
    });
    hasEntered = true;
    finalizeTransition(index);
  }

  function clearAutoplay() {
    if (!autoplayTimer) return;
    window.clearInterval(autoplayTimer);
    autoplayTimer = null;
  }

  function startAutoplay() {
    clearAutoplay();
    if (reducedMotion || !hasEntered || items.length <= 1) return;
    autoplayTimer = window.setInterval(function () {
      goTo(currentIndex + 1, 'next');
    }, CONFIG.AUTOPLAY_DELAY);
  }

  function setActiveSlide(index) {
    slides.forEach(function (slide, slideIndex) {
      var isActive = slideIndex === index;
      slide.classList.toggle('is-active', isActive);
      slide.classList.toggle('is-before', !isActive && slideIndex < index);
      slide.classList.toggle('is-after', !isActive && slideIndex > index);
      slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });
    currentIndex = index;
  }

  function setShadow(img, state) {
    if (!img) return;
    img.classList.remove('shadow--lifted', 'shadow--flying');
    if (state === 'lifted') img.classList.add('shadow--lifted');
    else if (state === 'flying') img.classList.add('shadow--flying');
  }

  /**
   * Compute the exact pixel offset needed to move an element fully
   * off-screen to the left or right.  Because the img sits inside
   * nested flex containers, vw / percentage values are unreliable.
   * Instead we measure the element's bounding rect and compute a
   * pixel distance that places its nearest edge past the viewport
   * edge, plus a comfortable margin so there is zero chance of a
   * partial-frame flash.
   */
  function offscreenX(el, dir) {
    var rect = el.getBoundingClientRect();
    var vw = window.innerWidth;
    var margin = 200;                      /* generous buffer — fully off-screen */
    if (dir === 'right') {
      /* Distance from the element's LEFT edge to the viewport RIGHT edge, + margin */
      return (vw - rect.left) + margin;
    }
    /* dir === 'left' */
    /* Distance from the element's RIGHT edge to the viewport LEFT edge, + margin */
    return -(rect.right + margin);
  }

  function hideAllSlidesExcept(keepIndex) {
    slides.forEach(function (s, i) {
      if (i !== keepIndex) {
        motion.set(s, { opacity: 0, pointerEvents: 'none' });
        s.classList.remove('is-active');
        s.setAttribute('aria-hidden', 'true');
        var plaque = s.querySelector('.home-carousel__plaque');
        if (plaque) plaque.classList.remove('is-visible');
      }
    });
  }

  function finalizeTransition(index) {
    var slide = slides[index];
    var img = slide ? slide.querySelector('.home-carousel__frame-inner img') : null;
    var plaque = slide ? slide.querySelector('.home-carousel__plaque') : null;
    if (img) {
      motion.set(img, { x: 0, scale: 1, rotation: 0, opacity: 1 });
      setShadow(img, null);
    }
    hideAllSlidesExcept(index);
    setActiveSlide(index);
    /* Plaque fades in via CSS transition after painting has landed */
    if (plaque) plaque.classList.add('is-visible');
    showPauseButton();
    isAnimating = false;
    startAutoplay();
  }

  /* ---- ENTRY: first painting flies in from off-screen ---- */
  function animateEntry(index) {
    var slide = slides[index];
    if (!slide) return;
    var img = slide.querySelector('.home-carousel__frame-inner img');
    if (!motion || !img) { showStaticSlide(index); return; }

    isAnimating = true;
    hasEntered = true;
    hideAllSlidesExcept(-1);

    /* Make slide visible so we can measure its img position,
       but keep the img itself invisible (opacity 0) and parked
       at x: 0 momentarily for an accurate bounding-rect read. */
    motion.set(slide, { opacity: 1, pointerEvents: 'auto' });
    motion.set(img, { x: 0, scale: 1, rotation: 0, opacity: 0 });

    /* Force a layout so getBoundingClientRect() returns the real
       centered position, then compute the pixel offset needed to
       place the image fully off-screen to the right. */
    var startX = offscreenX(img, 'right');

    motion.set(img, { x: startX, scale: 1.1, rotation: 0.7, opacity: 0 });
    setShadow(img, 'flying');

    var tl = motion.timeline({ onComplete: function () { finalizeTransition(index); } });

    /* Fade-in (quick — image is off-screen, so this just avoids a
       pop if rounding lets a sliver show)                          */
    tl.to(img, { opacity: 1, duration: 0.1 }, 0);

    /* Fly in from right — slow, deliberate deceleration              */
    tl.to(img, {
      x: 0, scale: 1.06, rotation: 0.35,
      duration: 1.6, ease: 'power3.out'
    }, 0.05);

    /* Shadow tightens as painting approaches the wall              */
    tl.call(function () { setShadow(img, 'lifted'); }, null, 1.0);

    /* Land on wall — gentle settle                                 */
    tl.to(img, {
      scale: 1, rotation: 0,
      duration: 0.8, ease: 'power2.inOut'
    }, 1.65);
    tl.call(function () { setShadow(img, null); }, null, 2.1);

    /* Small pause beat after landing (timeline ends ~1.4s,
       onComplete fires, finalizeTransition restores state)         */
  }

  /* ---- TRANSITION: lift off -> fly out -> new flies in -> land ---- */
  function animateTransition(nextIndex, direction) {
    if (!motion) { finalizeTransition(nextIndex); return; }

    var fromSlide = slides[currentIndex];
    var toSlide = slides[nextIndex];
    if (!fromSlide || !toSlide) return;

    var fromImg = fromSlide.querySelector('.home-carousel__frame-inner img');
    var toImg = toSlide.querySelector('.home-carousel__frame-inner img');
    var isNext = direction !== 'prev';
    var exitRot = isNext ? 0.5 : -0.5;
    var enterRot = isNext ? -0.6 : 0.6;

    isAnimating = true;

    /* Hide the outgoing plaque immediately so it doesn't float */
    var fromPlaque = fromSlide.querySelector('.home-carousel__plaque');
    if (fromPlaque) fromPlaque.classList.remove('is-visible');

    /* --- Compute pixel-perfect off-screen positions --- */

    /* fromImg is currently at x:0 (on-wall), so we can measure
       its rect directly to find the exit distance.              */
    var exitX = offscreenX(fromImg, isNext ? 'right' : 'left');

    /* For toImg, temporarily make its slide visible with the img
       at x:0 / opacity:0 so we can measure its centered rect,
       then compute the enter offset.                            */
    motion.set(toSlide, { opacity: 1, pointerEvents: 'none' });
    motion.set(toImg, { x: 0, scale: 1, rotation: 0, opacity: 0 });
    var enterX = offscreenX(toImg, isNext ? 'left' : 'right');

    /* Now park toImg at its off-screen start position */
    motion.set(toImg, { x: enterX, scale: 1.08, rotation: enterRot, opacity: 0 });
    motion.set(toSlide, { pointerEvents: 'auto' });
    setShadow(toImg, 'flying');

    var tl = motion.timeline({ onComplete: function () { finalizeTransition(nextIndex); } });

    /* ---- Phase 1: Slow lift off wall (0 -> 1.0s) ---- */
    tl.call(function () { setShadow(fromImg, 'lifted'); }, null, 0);
    tl.to(fromImg, {
      scale: 1.05, rotation: isNext ? 0.25 : -0.25,
      duration: 1.0, ease: 'power1.out'
    }, 0);

    /* ---- Phase 2: Fly off-screen (1.0 -> 2.3s) ---- */
    tl.call(function () { setShadow(fromImg, 'flying'); }, null, 0.9);
    tl.to(fromImg, {
      x: exitX, scale: 1.08, rotation: exitRot,
      duration: 1.3, ease: 'power3.in'
    }, 1.0);
    tl.to(fromImg, { opacity: 0, duration: 0.2 }, 2.1);

    /* ---- Phase 3: Empty wall beat (2.3 -> 2.6s) ---- */
    /* ~300ms of bare wall — a moment of stillness */

    /* ---- Phase 4: New painting enters (2.6 -> 4.2s) ---- */
    tl.to(toImg, { opacity: 1, duration: 0.1 }, 2.6);
    tl.to(toImg, {
      x: 0, scale: 1.06, rotation: 0.3 * (isNext ? -1 : 1),
      duration: 1.6, ease: 'power3.out'
    }, 2.6);
    tl.call(function () { setShadow(toImg, 'lifted'); }, null, 3.4);

    /* ---- Phase 5: Land on wall ---- */
    tl.to(toImg, {
      scale: 1, rotation: 0,
      duration: 0.8, ease: 'power2.inOut'
    }, 4.2);
    tl.call(function () { setShadow(toImg, null); }, null, 4.7);

    /* Timeline total ~5.0s.  onComplete fires -> finalizeTransition */
  }

  function goTo(index, direction) {
    if (!items.length || isAnimating) return;
    if (index < 0) index = items.length - 1;
    if (index >= items.length) index = 0;
    if (hasEntered && index === currentIndex) return;
    clearAutoplay();
    if (!hasEntered) {
      animateEntry(index);
      return;
    }
    animateTransition(index, direction || 'next');
  }

  function measureViewport() {
    if (!viewport) return;
    var maxHeight = 0;
    var worksSection = document.getElementById('works');
    var worksHeader = worksSection ? worksSection.querySelector('.home-carousel__header') : null;
    var availableHeight = 0;
    slides.forEach(function (slide) {
      maxHeight = Math.max(maxHeight, slide.scrollHeight);
    });
    if (worksSection && window.innerWidth >= 768) {
      availableHeight = worksSection.clientHeight - (worksHeader ? worksHeader.offsetHeight : 0) - 32;
    }
    if (maxHeight > 0 && availableHeight > 0) {
      viewport.style.height = Math.min(maxHeight, availableHeight) + 'px';
    } else if (maxHeight > 0) {
      viewport.style.height = maxHeight + 'px';
    }
  }

  function bindOverlay() {
    if (!window.ArtworkOverlay) return;
    overlayController = window.ArtworkOverlay.create({
      getItems: function () {
        return items;
      },
      getTitle: getTitle,
      getTechnique: getTechnique,
      getDimensions: getDimensions,
      getCategory: getCategory,
      getShortLabel: getShortLabel,
      resolvePath: resolvePath,
      hideNavigation: true,
      getSourceImage: function (index) {
        var slide = slides[index];
        return slide ? slide.querySelector('.home-carousel__frame-inner img') : null;
      },
      onAfterOpen: function () {
        clearAutoplay();
      },
      onAfterClose: function () {
        startAutoplay();
      }
    }).init();
  }

  function bindControls() {
    if (!viewport) return;

    viewport.addEventListener('mouseenter', clearAutoplay);
    viewport.addEventListener('mouseleave', startAutoplay);
    viewport.addEventListener('focusin', clearAutoplay);
    viewport.addEventListener('focusout', startAutoplay);

    viewport.addEventListener('click', function (event) {
      var bidButton = event.target.closest('.home-carousel__bid-btn');
      var bidBack = event.target.closest('.home-carousel__bid-back');
      var bidSubmit = event.target.closest('.home-carousel__bid-submit');
      var image = event.target.closest('.home-carousel__frame-inner img');
      var slide = event.target.closest('.home-carousel__slide');
      if (!slide) return;

      /* Bid button → expand plaque to show bid form */
      if (bidButton) {
        var plaque = slide.querySelector('.home-carousel__plaque');
        showBidForm(plaque, true);
        return;
      }

      /* Back button → collapse bid form back to info */
      if (bidBack) {
        var plaque2 = slide.querySelector('.home-carousel__plaque');
        showBidForm(plaque2, false);
        return;
      }

      /* Image click → open detail overlay */
      if (image) {
        var index = parseInt(slide.getAttribute('data-index'), 10);
        if (isNaN(index) || !overlayController) return;
        var sourceImage = slide.querySelector('.home-carousel__frame-inner img');
        if (!sourceImage) return;
        overlayController.open({
          index: index,
          sourceImage: sourceImage,
          startMode: 'detail'
        });
      }
    });

    /* Bid form submission */
    viewport.addEventListener('submit', function (event) {
      var form = event.target.closest('.home-carousel__bid-form');
      if (!form) return;
      event.preventDefault();
      var slide = form.closest('.home-carousel__slide');
      var index = slide ? parseInt(slide.getAttribute('data-index'), 10) : -1;
      var item = items[index];
      var data = { name: form.name.value, email: form.email.value, amount: form.amount.value, file: item ? item.file : '' };
      try {
        var bids = JSON.parse(localStorage.getItem(BID_STORAGE_KEY) || '[]');
        bids.push(data);
        localStorage.setItem(BID_STORAGE_KEY, JSON.stringify(bids));
      } catch (e) {}
      var success = form.parentElement.querySelector('.home-carousel__bid-success');
      form.style.display = 'none';
      if (success) success.style.display = '';
      setTimeout(function () {
        var plaque = slide.querySelector('.home-carousel__plaque');
        showBidForm(plaque, false);
        startAutoplay();
      }, 2500);
    });

    document.addEventListener('keydown', function (event) {
      if (!hasEntered || isAnimating) return;
      if (overlayController && overlayController.isOpen()) return;
      var works = document.getElementById('works');
      if (!works) return;
      var rect = works.getBoundingClientRect();
      if (rect.top > window.innerHeight || rect.bottom < 0) return;

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(currentIndex + 1, 'next');
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(currentIndex - 1, 'prev');
      }
    });

    var touchStartX = 0;
    var touchStartY = 0;
    viewport.addEventListener('touchstart', function (event) {
      if (!event.touches || !event.touches.length) return;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      clearAutoplay();
    }, { passive: true });

    viewport.addEventListener('touchend', function (event) {
      if (!event.changedTouches || !event.changedTouches.length) return;
      var deltaX = event.changedTouches[0].clientX - touchStartX;
      var deltaY = event.changedTouches[0].clientY - touchStartY;
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        goTo(currentIndex + (deltaX > 0 ? 1 : -1), deltaX > 0 ? 'next' : 'prev');
      } else {
        startAutoplay();
      }
    }, { passive: true });

    window.addEventListener('resize', measureViewport);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearAutoplay();
      else startAutoplay();
    });
    document.addEventListener('langchange', render);

    /* Pause / play button */
    var pauseBtn = document.getElementById('homeCarouselPause');
    var isPaused = false;
    if (pauseBtn) {
      pauseBtn.addEventListener('click', function () {
        isPaused = !isPaused;
        if (isPaused) {
          clearAutoplay();
          pauseBtn.classList.add('is-playing');
          pauseBtn.setAttribute('aria-label', translate('carousel_play', 'Weiterlaufen lassen', 'Resume autoplay'));
        } else {
          startAutoplay();
          pauseBtn.classList.remove('is-playing');
          pauseBtn.setAttribute('aria-label', translate('carousel_pause', 'Autoplay pausieren', 'Pause autoplay'));
        }
      });
      pauseBtn.setAttribute('aria-label', translate('carousel_pause', 'Autoplay pausieren', 'Pause autoplay'));
    }
  }

  var bidModal = null;

  function ensureBidModal() {
    if (bidModal) return bidModal;
    var el = document.createElement('div');
    el.className = 'bid-popup';
    el.innerHTML =
      '<div class="bid-popup__backdrop"></div>' +
      '<div class="bid-popup__card">' +
        '<button type="button" class="bid-popup__close">&times;</button>' +
        '<h3 class="bid-popup__title">' + (getLang() === 'en' ? 'Place a Bid' : 'Gebot abgeben') + '</h3>' +
        '<form class="bid-popup__form" novalidate>' +
          '<div class="bid-popup__field"><label>' + (getLang() === 'en' ? 'Name' : 'Name') + '</label><input type="text" name="name" required></div>' +
          '<div class="bid-popup__field"><label>' + (getLang() === 'en' ? 'Email' : 'E-Mail') + '</label><input type="email" name="email" required></div>' +
          '<div class="bid-popup__field"><label>' + (getLang() === 'en' ? 'Your Bid (EUR)' : 'Ihr Gebot (EUR)') + '</label><input type="number" name="amount" min="1" required></div>' +
          '<button type="submit" class="bid-popup__submit">' + (getLang() === 'en' ? 'Submit' : 'Absenden') + '</button>' +
        '</form>' +
        '<div class="bid-popup__success" style="display:none"><p>' + (getLang() === 'en' ? 'Thank you!' : 'Vielen Dank!') + '</p></div>' +
      '</div>';
    document.body.appendChild(el);
    bidModal = el;

    /* Close */
    el.querySelector('.bid-popup__backdrop').addEventListener('click', closeBidModal);
    el.querySelector('.bid-popup__close').addEventListener('click', closeBidModal);

    /* Submit */
    el.querySelector('.bid-popup__form').addEventListener('submit', function (e) {
      e.preventDefault();
      var form = e.target;
      var item = items[currentIndex];
      var data = { name: form.name.value, email: form.email.value, amount: form.amount.value, file: item ? item.file : '' };
      try {
        var bids = JSON.parse(localStorage.getItem(BID_STORAGE_KEY) || '[]');
        bids.push(data);
        localStorage.setItem(BID_STORAGE_KEY, JSON.stringify(bids));
      } catch (err) {}
      form.style.display = 'none';
      el.querySelector('.bid-popup__success').style.display = '';
      setTimeout(closeBidModal, 2000);
    });

    return el;
  }

  function openBidModal() {
    var el = ensureBidModal();
    var form = el.querySelector('.bid-popup__form');
    var success = el.querySelector('.bid-popup__success');
    if (form) { form.style.display = ''; form.reset(); }
    if (success) success.style.display = 'none';

    /* Set artwork title */
    var item = items[currentIndex];
    var title = item ? getTitle(item) : '';
    el.querySelector('.bid-popup__title').textContent = (getLang() === 'en' ? 'Bid on: ' : 'Gebot f\u00fcr: ') + (title || '\u2014');

    el.classList.add('is-open');
    clearAutoplay();
    if (motion) {
      motion.fromTo(el.querySelector('.bid-popup__card'),
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out' }
      );
    }
  }

  function closeBidModal() {
    if (!bidModal) return;
    if (motion) {
      motion.to(bidModal.querySelector('.bid-popup__card'),
        { opacity: 0, y: 20, duration: 0.25, ease: 'power2.in',
          onComplete: function () {
            bidModal.classList.remove('is-open');
            startAutoplay();
          }
        }
      );
    } else {
      bidModal.classList.remove('is-open');
      startAutoplay();
    }
  }

  function showBidForm(plaque, show) {
    /* On mobile: always use popup modal */
    if (window.innerWidth < 768) {
      if (show) openBidModal();
      else closeBidModal();
      return;
    }

    /* Desktop: inline in plaque */
    if (!plaque) return;
    var info = plaque.querySelector('.home-carousel__plaque-top');
    var grid = plaque.querySelector('.home-carousel__plaque-grid');
    var footer = plaque.querySelector('.home-carousel__plaque-footer');
    var bidPanel = plaque.querySelector('.home-carousel__plaque-bid');
    if (!bidPanel) return;

    var infoEls = [info, grid, footer].filter(Boolean);

    if (show) {
      clearAutoplay();
      infoEls.forEach(function (el) { el.style.display = 'none'; });
      bidPanel.style.display = '';
      var form = bidPanel.querySelector('.home-carousel__bid-form');
      var success = bidPanel.querySelector('.home-carousel__bid-success');
      if (form) { form.style.display = ''; form.reset(); }
      if (success) success.style.display = 'none';
      requestAnimationFrame(function () {
        var bidEls = bidPanel.querySelectorAll('.home-carousel__bid-field, .home-carousel__bid-submit, .home-carousel__bid-back');
        if (motion) {
          motion.fromTo(bidEls, { opacity: 0, y: 10 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.4, ease: 'power2.out' });
        }
      });
    } else {
      bidPanel.style.display = 'none';
      if (motion) motion.set(bidPanel, { clearProps: 'opacity,transform' });
      infoEls.forEach(function (el) { el.style.display = ''; });
      requestAnimationFrame(function () {
        if (motion) {
          motion.fromTo(infoEls, { opacity: 0, y: 8 }, { opacity: 1, y: 0, stagger: 0.12, duration: 0.4, ease: 'power2.out',
            onComplete: function () { infoEls.forEach(function (el) { if (motion) motion.set(el, { clearProps: 'opacity,transform' }); }); }
          });
        }
        startAutoplay();
      });
    }
  }

  function showPauseButton() {
    var btn = document.getElementById('homeCarouselPause');
    if (btn) btn.classList.add('is-visible');
  }

  function bindEntryObserver() {
    if (!viewport) return;
    if (entryObserver) entryObserver.disconnect();

    if (!('IntersectionObserver' in window)) {
      if (!hasEntered && items.length) window.HomeCarousel.enter();
      return;
    }

    entryObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.35) return;
        if (!hasEntered && items.length) window.HomeCarousel.enter();
      });
    }, {
      threshold: [0.2, 0.35, 0.55]
    });

    entryObserver.observe(viewport);
  }

  function render() {
    if (!track) return;
    var preservedIndex = Math.min(currentIndex, Math.max(items.length - 1, 0));
    clearAutoplay();
    hasEntered = false;
    isAnimating = false;
    track.innerHTML = '';
    slides = [];

    items.forEach(function (item, index) {
      var slide = createSlide(item, index);
      var image = slide.querySelector('img');
      if (image) {
        image.addEventListener('load', measureViewport, { once: true });
      }
      slides.push(slide);
      track.appendChild(slide);
    });

    currentIndex = preservedIndex;
    setActiveSlide(currentIndex);
    measureViewport();
    bindEntryObserver();

    if (reducedMotion || !motion) {
      showStaticSlide(currentIndex);
    }

    if (overlayController) overlayController.refresh();
  }

  function init() {
    viewport = document.getElementById('homeCarouselViewport');
    track = document.getElementById('homeCarouselTrack');

    if (!viewport || !track) return;

    bindOverlay();

    fetch(CONFIG.DATA_URL)
      .then(function (response) {
        if (!response.ok) throw new Error('Failed to load featured works');
        return response.json();
      })
      .then(function (data) {
        items = selectFeatured(data || []);
        render();
        bindControls();
      })
      .catch(function () {
        track.innerHTML = '<p class="gallery__empty">' + translate('home_featured_error', 'Vorschau konnte nicht geladen werden.', 'Preview could not be loaded.') + '</p>';
      });
  }

  window.HomeCarousel = {
    enter: function () {
      if (!items.length || isAnimating) return;
      if (hasEntered) {
        /* Already entered — just show plaque if missing */
        var slide = slides[currentIndex];
        var plaque = slide ? slide.querySelector('.home-carousel__plaque') : null;
        if (plaque && !plaque.classList.contains('is-visible')) {
          plaque.classList.add('is-visible');
        }
        showPauseButton();
        return;
      }
      goTo(currentIndex, 'next');
    },
    next: function () {
      goTo(currentIndex + 1, 'next');
    },
    prev: function () {
      goTo(currentIndex - 1, 'prev');
    },
    isFirst: function () {
      return currentIndex === 0;
    },
    isLast: function () {
      return currentIndex >= items.length - 1;
    },
    count: function () {
      return items.length;
    },
    isAnimating: function () {
      return isAnimating;
    },
    resetEntry: function () {
      hasEntered = false;
      clearAutoplay();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
