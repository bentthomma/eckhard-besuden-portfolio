/* ============================================
   GALLERY.JS — CSS Grid Gallery, Filters, Search
   ============================================ */

(function () {
  'use strict';

  /* ========== CONFIG ========== */
  var CONFIG = {
    DATA_URL: 'bilder-metadaten.json',
    DEBOUNCE: 300,
    FADE_DURATION: 350,
    HEIGHT_RELEASE_DELAY: 300,
    BATCH_SIZE: 60
  };

  /* ========== STATE ========== */
  var allImages = [];
  var filteredImages = [];
  var loadedCount = 0;
  var currentCategory = 'all';
  var searchTerm = '';
  var isLoading = false;
  var debounceTimer = null;

  /* ========== LAZY-LOAD STATE ========== */
  var galleryState = 'collapsed';
  var expandBtn, collapsedEl, expandedEl;

  /* ========== DOM REFS ========== */
  var gallery, countEl, searchInput, filterBtns;


  /* ==========================================================
     SECTION: Helpers
     ========================================================== */

  function getLang() { return Helpers.getLang(); }
  function t(de, en) { return getLang() === 'en' ? en : de; }
  function getShortLabel(item) { return Helpers.getShortLabel(item); }


  /* ==========================================================
     SECTION: Data Fetching
     ========================================================== */

  function fetchImageData() {
    var p = (window.Helpers && window.Helpers.fetchArtworkData)
      ? window.Helpers.fetchArtworkData(CONFIG.DATA_URL)
      : fetch(CONFIG.DATA_URL).then(function (res) {
          if (!res.ok) throw new Error('Failed to load ' + CONFIG.DATA_URL);
          return res.json();
        });
    return p.then(function (data) {
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

    function openThis() { if (window.Detail) window.Detail.open(filteredImages, index, div.querySelector('img')); }
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

    /* Remove previous load-more button */
    var existingMore = gallery.querySelector('.gallery__load-more');
    if (existingMore) existingMore.remove();

    /* Load items in batches for performance. loading="lazy" on images
       ensures only visible ones download. IntersectionObserver handles reveal. */
    var end = Math.min(loadedCount + CONFIG.BATCH_SIZE, filteredImages.length);

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

    /* Show "Load more" if items remain */
    if (loadedCount < filteredImages.length) {
      var loadMoreBtn = document.createElement('button');
      loadMoreBtn.className = 'gallery__load-more';
      loadMoreBtn.textContent = t('Mehr laden', 'Load more');
      loadMoreBtn.addEventListener('click', function () {
        loadMoreBtn.remove();
        renderBatch();
      });
      gallery.appendChild(loadMoreBtn);
    }
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

  function revealWithObserver(elements) {
    if (window.__reduced) {
      elements.forEach(function (el) { el.style.opacity = '1'; });
      return;
    }
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
        setTimeout(releaseGalleryHeight, CONFIG.HEIGHT_RELEASE_DELAY);
    }, CONFIG.FADE_DURATION);
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

    searchInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        searchTerm = searchInput.value;
        applyFilters();
      }, CONFIG.DEBOUNCE);
    });
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
    if (window.Detail) window.Detail.refreshIfOpen();
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
        updateSearchPlaceholder();

        if (typeof gsap !== 'undefined' && expandedEl) {
          var controls = expandedEl.querySelector('.gallery-controls');
          if (controls) {
            if (window.__reduced) {
              controls.style.opacity = '1';
            } else {
              gsap.fromTo(controls, { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
            }
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
      if (window.Detail && externalItems && typeof index === 'number') {
        window.Detail.open(externalItems, index, sourceImg, options);
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
