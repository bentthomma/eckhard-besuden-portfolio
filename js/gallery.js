/* ============================================
   GALLERY.JS — CSS Grid Gallery, Filters, Search,
   Detail Panel, Inline Bid Form
   ============================================ */

(function () {
  'use strict';

  /* ========== CONFIG ========== */
  var CONFIG = {
    DATA_URL: 'bilder-metadaten.json',
    DEBOUNCE: 300,
    SWIPE_THRESHOLD: 50
  };

  /* ========== STATE ========== */
  var allImages = [];
  var filteredImages = [];
  var loadedCount = 0;
  var currentCategory = 'all';
  var searchTerm = '';
  var isLoading = false;
  var debounceTimer = null;

  /* Detail state */
  var detailIndex = -1;
  var touchStartX = 0;
  var touchEndX = 0;
  var flipInProgress = false;
  var savedSourceRect = null;
  var savedSourceImg = null;
  var isFirstOpen = true;
  var isTransitioning = false;
  var currentBidItem = null;

  /* ========== LAZY-LOAD STATE ========== */
  var galleryState = 'collapsed';
  var expandBtn, collapsedEl, expandedEl;

  /* ========== DOM REFS ========== */
  var gallery, countEl, searchInput, filterBtns;
  var detail, detailImage, detailTitle, detailYear;
  var detailTechnique, detailDimensions, detailCategory;
  var detailCounter, detailStatus, detailInfo;
  var detailPrev, detailNext, detailBackdrop, detailClose;
  var detailBid, bidBackBtn, bidForm, bidSuccess, bidError;


  /* ==========================================================
     SECTION: Helpers
     ========================================================== */

  function getLang() { return Helpers.getLang(); }
  function t(de, en) { return getLang() === 'en' ? en : de; }
  function getTitle(item) { return Helpers.getTitle(item); }
  function getTechnique(item) { return Helpers.getTechnique(item); }
  function getCategoryLabel(item) { return Helpers.getCategory(item); }
  function getShortLabel(item) { return Helpers.getShortLabel(item); }
  function parseDimensions(item) { return Helpers.getDimensions(item); }
  function isAvailable(item) { return Helpers.isAvailable(item); }


  /* ==========================================================
     SECTION: Data Fetching
     ========================================================== */

  function fetchImageData() {
    return fetch(CONFIG.DATA_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load ' + CONFIG.DATA_URL);
        return res.json();
      })
      .then(function (data) {
        allImages = data;
        filteredImages = data.slice();
      });
  }




  /* ==========================================================
     SECTION: Gallery Item Creation
     ========================================================== */

  function createGalleryItem(item, index) {
    var div = document.createElement('div');
    div.className = 'gallery__item';
    div.setAttribute('data-category', item.category);
    div.setAttribute('data-index', index);
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', getShortLabel(item));

    var img = document.createElement('img');
    img.src = item.path;
    img.alt = getShortLabel(item);
    img.loading = 'lazy';

    var overlay = document.createElement('div');
    overlay.className = 'gallery__item-overlay';
    var span = document.createElement('span');
    span.textContent = getShortLabel(item);
    overlay.appendChild(span);

    div.appendChild(img);
    div.appendChild(overlay);

    function openThis() { flipOpenDetail(index, div.querySelector('img')); }
    div.addEventListener('click', openThis);
    div.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openThis(); } });

    return div;
  }


  /* ==========================================================
     SECTION: Render Batch
     ========================================================== */

  function renderBatch() {
    if (isLoading) return;

    /* Remove loading indicator */
    var loadingEl = gallery.querySelector('.gallery__loading');
    if (loadingEl) loadingEl.remove();

    /* Empty state */
    if (filteredImages.length === 0) {
      gallery.innerHTML = '<p class="gallery__empty">' + t('Keine Werke gefunden.', 'No works found.') + '</p>';
      return;
    }

    if (loadedCount >= filteredImages.length) return;

    isLoading = true;

    /* Load ALL remaining items at once. CSS columns needs all items
       present to calculate layout correctly. loading="lazy" on images
       ensures only visible ones actually download. The IntersectionObserver
       handles the visual reveal as the user scrolls. */
    var end = filteredImages.length;

    var fragment = document.createDocumentFragment();
    var newEls = [];

    for (var i = loadedCount; i < end; i++) {
      var el = createGalleryItem(filteredImages[i], i);
      fragment.appendChild(el);
      newEls.push(el);
    }

    gallery.appendChild(fragment);
    revealWithObserver(newEls);

    loadedCount = end;
    isLoading = false;

    updateCount();
  }

  /* ==========================================================
     SECTION: Reveal System (IntersectionObserver)

     Why not ScrollTrigger: The scroll state machine uses
     preventDefault + GSAP scrollTo, which causes ScrollTrigger
     to fire all instances simultaneously during flyTo transitions.
     IntersectionObserver is native and doesn't have this problem.
     ========================================================== */

  var observer = null;

  function initRevealObserver() {
    if (observer) observer.disconnect();

    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          entry.target.style.opacity = '1';
          entry.target.style.transition = 'opacity 0.5s ease';
        }
      });
    }, { threshold: 0.1 });
  }

  function revealWithStagger(elements) {
    /* Hide immediately, wait for columns layout, then stagger in */
    elements.forEach(function (el) { el.style.opacity = '0'; });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        gsap.fromTo(elements,
          { opacity: 0, y: 35 },
          { opacity: 1, y: 0, stagger: 0.08, duration: 0.6, ease: 'power2.out' }
        );
      });
    });
  }

  function revealWithObserver(elements) {
    elements.forEach(function (el) {
      el.style.opacity = '0';
      if (observer) observer.observe(el);
    });
  }


  /* ==========================================================
     SECTION: Count + More Button
     ========================================================== */

  function updateCount() {
    if (!countEl) return;
    var shown = Math.min(loadedCount, filteredImages.length);
    var total = filteredImages.length;
    var label = t('Werke', 'Works');

    if (shown >= total) {
      countEl.textContent = total + ' ' + label;
    } else {
      countEl.textContent = shown + ' ' + t('von', 'of') + ' ' + total + ' ' + label;
    }
  }



  /* ==========================================================
     SECTION: Filtering + Search
     ========================================================== */

  function applyFilters() {
    var cat = currentCategory;
    var term = searchTerm.toLowerCase().trim();

    filteredImages = allImages.filter(function (item) {
      var matchCat = (cat === 'all') || (item.category === cat);
      if (!matchCat) return false;
      if (!term) return true;
      var titleDe = (item.title_de || '').toLowerCase();
      var titleEn = (item.title_en || '').toLowerCase();
      return titleDe.indexOf(term) !== -1 || titleEn.indexOf(term) !== -1;
    });

    lockGalleryHeight();
    initRevealObserver();
    fadeOutAndRerender();
  }

  function lockGalleryHeight() {
    gallery.style.minHeight = gallery.offsetHeight + 'px';
  }

  function releaseGalleryHeight() {
    gallery.style.minHeight = '';
  }

  function fadeOutAndRerender() {
    gallery.classList.add('fading-out');

    setTimeout(function () {
      gallery.innerHTML = '';
      gallery.classList.remove('fading-out');
      loadedCount = 0;

      /* Re-init observer so it's fresh for new items */
      initRevealObserver();

      renderBatch();
      updateCount();
        setTimeout(releaseGalleryHeight, 300);
    }, 350);
  }

  function applyCategory(category) {
    currentCategory = category;
    updateFilterButtons(category);
    applyFilters();
  }

  function updateFilterButtons(category) {
    filterBtns.forEach(function (btn) {
      var isActive = btn.getAttribute('data-category') === category;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }


  /* ==========================================================
     SECTION: Search
     ========================================================== */

  function initSearch() {
    if (!searchInput) return;

    searchInput.addEventListener('keyup', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        searchTerm = searchInput.value;
        applyFilters();
      }, CONFIG.DEBOUNCE);
    });
  }


  /* ==========================================================
     SECTION: FLIP Animation — Gallery to Detail
     ========================================================== */

  function flipOpenDetail(index, sourceImg) {
    // FULL RESET before anything else
    gsap.killTweensOf(detail);
    gsap.killTweensOf(detailImage);
    document.querySelectorAll('.flip-clone').forEach(function(c) { c.remove(); });
    detail.style.cssText = '';
    detailImage.style.cssText = '';
    flipInProgress = false;
    isTransitioning = false;

    if (!sourceImg || typeof gsap === 'undefined') {
      openDetail(index);
      return;
    }

    flipInProgress = true;

    var srcRect = sourceImg.getBoundingClientRect();
    savedSourceRect = { left: srcRect.left, top: srcRect.top, width: srcRect.width, height: srcRect.height };
    savedSourceImg = sourceImg;

    var clone = createFlipClone(sourceImg, srcRect);
    document.body.appendChild(clone);

    detailImage.style.visibility = 'hidden';
    detailImage.style.opacity = '0';
    detailImage.src = sourceImg.src;
    openDetail(index);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var imgRect = detailImage.getBoundingClientRect();

        if (imgRect.width < 10 || imgRect.height < 10) {
          clone.remove();
          detailImage.style.visibility = '';
          detailImage.style.opacity = '1';
          flipInProgress = false;
          return;
        }

        animateFlipClone(clone, imgRect, function () {
          detailImage.style.transition = 'none';
          detailImage.style.visibility = '';
          detailImage.style.opacity = '1';
          clone.remove();
          flipInProgress = false;
          requestAnimationFrame(function () {
            detailImage.style.transition = '';
          });
        });
      });
    });
  }

  function createFlipClone(sourceImg, rect) {
    var clone = document.createElement('img');
    clone.src = sourceImg.src;
    clone.className = 'flip-clone';
    clone.style.left = rect.left + 'px';
    clone.style.top = rect.top + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    return clone;
  }

  function animateFlipClone(clone, targetRect, onComplete) {
    var isMobile = window.innerWidth < 768;
    gsap.to(clone, {
      left: targetRect.left,
      top: targetRect.top,
      width: targetRect.width,
      height: targetRect.height,
      duration: isMobile ? 0.9 : 0.5,
      ease: 'power3.inOut',
      onComplete: onComplete
    });
  }


  /* ==========================================================
     SECTION: Detail Panel
     ========================================================== */

  function openDetail(index) {
    if (index < 0 || index >= filteredImages.length) return;
    var item = filteredImages[index];
    if (!item) return;

    detailIndex = index;

    detail.classList.add('open');
    if (window.__overlay) window.__overlay.push('detail', detail);

    setDetailImage(item);
    setDetailText(item);
    setDetailCounter(index);
    renderDetailStatus(item);

    showAllDetailFields();
    staggerInfoOnFirstOpen();
  }

  function setDetailImage(item) {
    detailImage.style.opacity = '0';
    detailImage.alt = getShortLabel(item);

    if (!flipInProgress) {
      detailImage.src = item.path;
      if (detailImage.complete && detailImage.naturalWidth > 0) {
        detailImage.style.opacity = '1';
      } else {
        detailImage.onload = function () { detailImage.style.opacity = '1'; };
      }
    }
  }

  function setDetailText(item) {
    detailTitle.textContent = getTitle(item);
    detailYear.textContent = item.year || '';
    detailTechnique.textContent = getTechnique(item) || '\u2014';
    detailDimensions.textContent = parseDimensions(item) || '\u2014';
    detailCategory.textContent = getCategoryLabel(item);
  }

  function setDetailCounter(index) {
    detailCounter.textContent = (index + 1) + ' / ' + filteredImages.length;
  }

  function showAllDetailFields() {
    detailTechnique.parentElement.style.display = '';
    detailDimensions.parentElement.style.display = '';
    detailCategory.parentElement.style.display = '';
  }

  function staggerInfoOnFirstOpen() {
    if (!isFirstOpen || typeof gsap === 'undefined') return;

    gsap.from(
      [detailTitle, detailYear, detailTechnique, detailDimensions, detailCategory, detailStatus],
      { opacity: 0, y: 15, stagger: 0.15, duration: 0.6, ease: 'power2.out', delay: 0.5 }
    );
    isFirstOpen = false;
  }

  function renderDetailStatus(item) {
    detailStatus.innerHTML = '';

    var ownerLabel = document.createElement('span');
    ownerLabel.className = 'detail__label';
    ownerLabel.textContent = t('Besitz', 'Collection');
    detailStatus.appendChild(ownerLabel);

    var ownerValue = document.createElement('p');
    ownerValue.className = 'detail__owner-value';
    ownerValue.textContent = (item.owner && item.owner !== '')
      ? item.owner
      : t('Verf\u00fcgbar', 'Available');
    detailStatus.appendChild(ownerValue);

    var bidBtn = document.createElement('button');
    bidBtn.className = 'detail__bid-btn';
    bidBtn.textContent = t('Kontakt aufnehmen', 'Get in Touch');
    bidBtn.addEventListener('click', function () { showInlineBid(item); });
    detailStatus.appendChild(bidBtn);
  }


  /* ==========================================================
     SECTION: Close Detail
     ========================================================== */

  function closeDetail() {
    /* Find the gallery item that matches the CURRENT detailIndex (not the original) */
    var targetItem = null;
    if (detailIndex >= 0) {
      var items = gallery.querySelectorAll('.gallery__item');
      items.forEach(function (el) {
        if (parseInt(el.getAttribute('data-index'), 10) === detailIndex) targetItem = el;
      });
    }

    var sourceImg = targetItem ? targetItem.querySelector('img') : null;

    /* If we can find the gallery item AND it's visible, do a reverse FLIP morph */
    var targetRect = sourceImg ? sourceImg.getBoundingClientRect() : null;
    var targetVisible = targetRect && targetRect.width > 10 && targetRect.height > 10 && targetRect.bottom > 0 && targetRect.top < window.innerHeight;

    if (sourceImg && targetVisible && detailImage.src && typeof gsap !== 'undefined') {
      var detailRect = detailImage.getBoundingClientRect();

      /* Create clone at detail image position */
      var clone = document.createElement('img');
      clone.src = detailImage.src;
      clone.className = 'flip-clone';
      clone.style.left = detailRect.left + 'px';
      clone.style.top = detailRect.top + 'px';
      clone.style.width = detailRect.width + 'px';
      clone.style.height = detailRect.height + 'px';
      document.body.appendChild(clone);

      /* Morph clone to gallery position */
      var flipDuration = window.innerWidth < 768 ? 0.9 : 0.8;

      /* Fade detail background — match clone duration so stage stays dark */
      gsap.to(detail, { opacity: 0, duration: flipDuration, ease: 'power2.in' });
      gsap.to(clone, {
        left: targetRect.left,
        top: targetRect.top,
        width: targetRect.width,
        height: targetRect.height,
        duration: flipDuration,
        ease: 'power3.inOut',
        onComplete: function () {
          clone.remove();
          finishClose();
        }
      });
    } else {
      /* Fallback: simple fade */
      gsap.to(detail, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: finishClose
      });
    }
  }

  function resetInlineBidView() {
    if (detailBid && detailBid.style.display !== 'none') {
      detailBid.style.display = 'none';
      detailBid.style.opacity = '0';
    }
    if (detailInfo) {
      detailInfo.style.display = '';
      detailInfo.style.visibility = '';
      detailInfo.style.height = '';
      detailInfo.style.overflow = '';
      detailInfo.style.opacity = '1';
      if (typeof gsap !== 'undefined') {
        Array.prototype.forEach.call(detailInfo.children, function (child) {
          gsap.set(child, { opacity: 1, y: 0 });
        });
      }
    }
  }

  function finishClose() {
    // Kill any running GSAP tweens on detail elements
    gsap.killTweensOf(detail);
    gsap.killTweensOf(detailImage);

    /* Ensure invisible before class removal */
    detail.style.opacity = '0';
    detail.style.pointerEvents = 'none';
    detail.classList.remove('open');
    detailImage.style.cssText = '';
    /* Clear inline styles after a tick so CSS base state (opacity:0) takes over */
    setTimeout(function () {
      detail.style.opacity = '';
      detail.style.pointerEvents = '';
      detail.style.background = '';
    }, 100);
    if (window.__overlay) window.__overlay.pop('detail');

    detailIndex = -1;
    detailImage.src = '';
    savedSourceRect = null;
    savedSourceImg = null;
    flipInProgress = false;
    isTransitioning = false;
    isFirstOpen = true;

    if (detailPrev) detailPrev.style.display = '';
    if (detailNext) detailNext.style.display = '';

    // Remove any stale clones
    document.querySelectorAll('.flip-clone').forEach(function(c) { c.remove(); });

    // Reset bid view
    resetInlineBidView();
  }



  /* ==========================================================
     SECTION: Detail Navigation (Prev/Next/Swipe)
     ========================================================== */

  function animateDetailTransition(newIndex, direction) {
    if (isTransitioning) return;
    var layout = detail.querySelector('.detail__layout');
    if (!layout || typeof gsap === 'undefined') {
      openDetail(newIndex);
      return;
    }

    isTransitioning = true;
    var outX = direction === 'next' ? -80 : 80;
    var inX = direction === 'next' ? 80 : -80;

    gsap.to(layout, {
      x: outX, opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: function () {
        flipInProgress = false;
        /* Auto-return from bid view to info view on navigation */
        resetInlineBidView();
        openDetail(newIndex);
        savedSourceRect = null;
        savedSourceImg = null;

        gsap.fromTo(layout,
          { x: inX, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out',
            onComplete: function () { isTransitioning = false; }
          }
        );
      }
    });
  }

  function detailPrevFn() {
    var newIndex = detailIndex <= 0 ? filteredImages.length - 1 : detailIndex - 1;
    animateDetailTransition(newIndex, 'prev');
  }

  function detailNextFn() {
    var newIndex = detailIndex >= filteredImages.length - 1 ? 0 : detailIndex + 1;
    animateDetailTransition(newIndex, 'next');
  }

  function handleSwipe() {
    var diff = touchStartX - touchEndX;
    if (Math.abs(diff) < CONFIG.SWIPE_THRESHOLD) return;
    if (diff > 0) { detailNextFn(); } else { detailPrevFn(); }
  }

  function handleDetailKeydown(e) {
    if (!detail.classList.contains('open')) return;
    if (detailBid && detailBid.style.display !== 'none') return;

    switch (e.key) {
      case 'Escape': closeDetail(); break;
      case 'ArrowLeft': detailPrevFn(); break;
      case 'ArrowRight': detailNextFn(); break;
    }
  }

  function initDetail() {
    detailClose = detail.querySelector('.detail__close');
    if (detailClose) {
      detailClose.addEventListener('click', function (e) { e.stopPropagation(); closeDetail(); });
    }

    detailBackdrop = detail.querySelector('.detail__backdrop');
    if (detailBackdrop) {
      detailBackdrop.addEventListener('click', closeDetail);
    }

    detailPrev = detail.querySelector('.detail__prev');
    detailNext = detail.querySelector('.detail__next');
    if (detailPrev) detailPrev.addEventListener('click', function (e) { e.stopPropagation(); detailPrevFn(); });
    if (detailNext) detailNext.addEventListener('click', function (e) { e.stopPropagation(); detailNextFn(); });

    document.addEventListener('keydown', handleDetailKeydown);

    var touchStartY = 0;
    detail.addEventListener('touchstart', function (e) {
      if (e.changedTouches && e.changedTouches.length) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      }
    }, { passive: true });

    detail.addEventListener('touchend', function (e) {
      if (e.changedTouches && e.changedTouches.length) {
        touchEndX = e.changedTouches[0].screenX;
        var deltaY = Math.abs(e.changedTouches[0].screenY - touchStartY);
        var deltaX = Math.abs(touchEndX - touchStartX);
        /* Only trigger swipe if horizontal intent is dominant */
        if (deltaX > deltaY) handleSwipe();
      }
    }, { passive: true });
  }


  /* ==========================================================
     SECTION: Inline Bid System
     ========================================================== */

  function showInlineBid(item) {
    if (!detailInfo || !detailBid) return;
    var controller = BidSystem.create(detailBid, item);
    BidSystem.show(detailBid, detailInfo, function () {
      if (controller && controller.closeBtn) {
        controller.closeBtn.addEventListener('click', function () {
          BidSystem.hide(detailBid, detailInfo);
        });
      }
    });
  }


  function initInlineBid() {
    detailInfo = document.getElementById('detailInfo');
    if (!detailInfo) return;
    var parent = detailInfo.parentElement;
    detailBid = document.getElementById('detailBid');
    if (!detailBid) {
      detailBid = document.createElement('div');
      detailBid.id = 'detailBid';
      detailBid.className = 'detail__info';
      detailBid.style.display = 'none';
      detailBid.style.opacity = '0';
      parent.appendChild(detailBid);
    }
  }




  /* ==========================================================
     SECTION: Language Observer
     ========================================================== */

  function initLanguageObserver() {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.type === 'attributes' && m.attributeName === 'lang') {
          onLanguageChange();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang']
    });
  }

  function onLanguageChange() {
    refreshOverlayLabels();
    refreshDetailIfOpen();
    updateCount();
    updateSearchPlaceholder();
  }

  function refreshOverlayLabels() {
    if (gallery.classList.contains('fading-out')) return;

    var items = gallery.querySelectorAll('.gallery__item');
    items.forEach(function (el) {
      var idx = parseInt(el.getAttribute('data-index'), 10);
      if (isNaN(idx) || idx >= filteredImages.length) return;
      var item = filteredImages[idx];
      var span = el.querySelector('.gallery__item-overlay span');
      var img = el.querySelector('img');
      var label = getShortLabel(item);
      if (span) span.textContent = label;
      if (img) img.alt = label;
      el.setAttribute('aria-label', label);
    });
  }

  function refreshDetailIfOpen() {
    if (!detail.classList.contains('open') || detailIndex < 0) return;

    var item = filteredImages[detailIndex];
    detailTitle.textContent = getTitle(item);
    detailTechnique.textContent = getTechnique(item);
    detailCategory.textContent = getCategoryLabel(item);
    renderDetailStatus(item);
  }

  function updateSearchPlaceholder() {
    if (!searchInput) return;
    var key = searchInput.getAttribute('data-i18n-placeholder');
    if (!key) return;

    if (typeof window.i18n !== 'undefined' && window.i18n.t) {
      searchInput.setAttribute('placeholder', window.i18n.t(key));
    } else if (key === 'search_placeholder') {
      searchInput.setAttribute('placeholder', t('Suche nach Titel\u2026', 'Search by title\u2026'));
    }
  }


  /* ==========================================================
     SECTION: DOM Reference Caching
     ========================================================== */

  function cacheDomRefs() {
    gallery          = document.getElementById('gallery');
    countEl          = document.getElementById('galleryCount');

    searchInput      = document.getElementById('gallerySearch');
    filterBtns       = document.querySelectorAll('.filter-btn');
    detail           = document.getElementById('detail');
    detailImage      = document.getElementById('detailImage');
    detailTitle      = document.getElementById('detailTitle');
    detailYear       = document.getElementById('detailYear');
    detailTechnique  = document.getElementById('detailTechnique');
    detailDimensions = document.getElementById('detailDimensions');
    detailCategory   = document.getElementById('detailCategory');
    detailCounter    = document.getElementById('detailCounter');
    detailStatus     = document.getElementById('detailStatus');
    detailInfo       = document.getElementById('detailInfo');
  }


  /* ==========================================================
     SECTION: Event Binding
     ========================================================== */


  function bindFilterButtons() {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.getAttribute('data-category');
        if (cat !== currentCategory) {
          applyCategory(cat);
        }
      });
    });
  }


  /* ==========================================================
     SECTION: Initialization
     ========================================================== */

  function init() {
    cacheDomRefs();

    expandBtn = document.getElementById('galleryExpandBtn');
    collapsedEl = document.getElementById('galleryCollapsed');
    expandedEl = document.getElementById('galleryExpanded');

    if (expandBtn) {
      expandBtn.addEventListener('click', function () { expand(); });
    }

    /* If no collapsed state exists (fallback), auto-expand */
    if (!collapsedEl) {
      if (!gallery) return;
      initRevealObserver();
      fetchAndExpand();
      return;
    }

    initLanguageObserver();
  }

  function expand() {
    if (galleryState !== 'collapsed') return;
    galleryState = 'loading';
    if (expandBtn) {
      expandBtn.disabled = true;
      expandBtn.textContent = Helpers.translate('works_loading', 'Laden...', 'Loading...');
    }
    fetchAndExpand();
  }

  function fetchAndExpand() {
    fetchImageData()
      .then(function () {
        galleryState = 'expanded';
        if (collapsedEl) collapsedEl.style.display = 'none';
        if (expandedEl) expandedEl.classList.remove('gallery-expanded--hidden');
        if (!gallery) gallery = document.getElementById('gallery');

        initRevealObserver();
        renderBatch();
        updateCount();
        bindFilterButtons();
        initSearch();
        if (detail) initDetail();
        initInlineBid();
        updateSearchPlaceholder();

        if (typeof gsap !== 'undefined' && expandedEl) {
          var controls = expandedEl.querySelector('.gallery-controls');
          if (controls) {
            gsap.fromTo(controls, { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
          }
        }
      })
      .catch(function (err) {
        console.error('Gallery: Could not load image data.', err);
        galleryState = 'collapsed';
        if (expandBtn) {
          expandBtn.disabled = false;
          expandBtn.textContent = Helpers.translate('home_featured_error',
            'Fehler — erneut versuchen', 'Error — try again');
        }
      });
  }

  /* ========== PUBLIC API ========== */
  window.Gallery = {
    expand: function () { expand(); },
    isExpanded: function () { return galleryState === 'expanded'; },
    openDetail: function (externalItems, index, sourceImg, options) {
      if (galleryState !== 'expanded') expand();
      if (externalItems && typeof index === 'number') {
        filteredImages = externalItems;
        flipOpenDetail(index, sourceImg);
        if (options && options.showBid && filteredImages[index]) {
          /* Show bid form immediately — skip detail info stagger */
          setTimeout(function () { showInlineBid(filteredImages[index]); }, 1200);
        }
      }
    }
  };

  /* Start when DOM ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
