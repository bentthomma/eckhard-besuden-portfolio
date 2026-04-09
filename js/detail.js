/* ============================================
   DETAIL.JS — Detail Panel Overlay,
   FLIP Animation, Inline Bid Form
   ============================================ */

(function () {
  'use strict';

  /* ========== CONFIG ========== */
  var CONFIG = {
    SWIPE_THRESHOLD: 50,
    FADE_DURATION: 350,
    HEIGHT_RELEASE_DELAY: 300,
    DETAIL_CLEANUP_DELAY: 100,
    BID_SHOW_DELAY: 1200
  };

  /* ========== STATE ========== */
  var detailIndex = -1;
  var detailItems = [];
  var touchStartX = 0;
  var touchEndX = 0;
  var flipInProgress = false;
  var savedSourceRect = null;
  var savedSourceImg = null;
  var isFirstOpen = true;
  var isTransitioning = false;

  /* ========== DOM REFS ========== */
  var detail, detailImage, detailTitle, detailYear;
  var detailTechnique, detailDimensions, detailCategory;
  var detailCounter, detailStatus, detailInfo;
  var detailPrev, detailNext, detailBackdrop, detailClose;
  var detailBid;


  /* ==========================================================
     SECTION: Helpers (delegated to window.Helpers)
     ========================================================== */

  function getLang() { return Helpers.getLang(); }
  function t(de, en) { return getLang() === 'en' ? en : de; }
  function getTitle(item) { return Helpers.getTitle(item); }
  function getTechnique(item) { return Helpers.getTechnique(item); }
  function getCategoryLabel(item) { return Helpers.getCategory(item); }
  function getShortLabel(item) { return Helpers.getShortLabel(item); }
  function parseDimensions(item) { return Helpers.getDimensions(item); }


  /* ==========================================================
     SECTION: FLIP Animation — Gallery/Carousel to Detail
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
    if (window.__reduced) {
      clone.remove();
      if (onComplete) onComplete();
      return;
    }
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
    if (index < 0 || index >= detailItems.length) return;
    var item = detailItems[index];
    if (!item) return;

    detailIndex = index;

    detail.classList.add('open');
    detail.setAttribute('aria-hidden', 'false');
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
    detailCounter.textContent = (index + 1) + ' / ' + detailItems.length;
  }

  function showAllDetailFields() {
    detailTechnique.parentElement.style.display = '';
    detailDimensions.parentElement.style.display = '';
    detailCategory.parentElement.style.display = '';
  }

  function staggerInfoOnFirstOpen() {
    if (!isFirstOpen || typeof gsap === 'undefined') return;

    if (window.__reduced) {
      isFirstOpen = false;
      return;
    }

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
    /* Prioritize savedSourceImg (carousel images) over gallery item search */
    var sourceImg = savedSourceImg || null;
    if (!sourceImg && detailIndex >= 0) {
      var gallery = document.getElementById('gallery');
      if (gallery) {
        var items = gallery.querySelectorAll('.gallery__item');
        items.forEach(function (el) {
          if (parseInt(el.getAttribute('data-index'), 10) === detailIndex) {
            sourceImg = el.querySelector('img');
          }
        });
      }
    }

    /* If we can find the source image AND it's visible, do a reverse FLIP morph */
    var targetRect = sourceImg ? sourceImg.getBoundingClientRect() : null;
    var targetVisible = targetRect && targetRect.width > 10 && targetRect.height > 10 && targetRect.bottom > 0 && targetRect.top < window.innerHeight;

    if (window.__reduced) {
      finishClose();
      return;
    }

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
      detailInfo.style.position = '';
      detailInfo.style.pointerEvents = '';
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
    detail.setAttribute('aria-hidden', 'true');
    detailImage.style.cssText = '';
    /* Clear inline styles after a tick so CSS base state (opacity:0) takes over */
    setTimeout(function () {
      detail.style.opacity = '';
      detail.style.pointerEvents = '';
      detail.style.background = '';
    }, CONFIG.DETAIL_CLEANUP_DELAY);
    if (window.__overlay) window.__overlay.pop('detail');

    detailIndex = -1;
    detailItems = [];
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

    if (window.__reduced) {
      flipInProgress = false;
      resetInlineBidView();
      openDetail(newIndex);
      savedSourceRect = null;
      savedSourceImg = null;
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
    var newIndex = detailIndex <= 0 ? detailItems.length - 1 : detailIndex - 1;
    animateDetailTransition(newIndex, 'prev');
  }

  function detailNextFn() {
    var newIndex = detailIndex >= detailItems.length - 1 ? 0 : detailIndex + 1;
    animateDetailTransition(newIndex, 'next');
  }

  function handleSwipe() {
    var diff = touchStartX - touchEndX;
    if (Math.abs(diff) < CONFIG.SWIPE_THRESHOLD) return;
    if (diff > 0) { detailNextFn(); } else { detailPrevFn(); }
  }

  function handleDetailKeydown(e) {
    if (!detail.classList.contains('open')) return;
    if (detailBid && detailBid.style.display !== 'none') {
      if (e.key === 'Escape') { BidSystem.hide(detailBid, detailInfo); }
      return;
    }

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
      if (detailBid && detailBid.style.display !== 'none') return;
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
    /* Lock layout height so position:absolute on info doesn't cause jump */
    var layout = detailInfo.closest('.detail__layout');
    if (layout) layout.style.minHeight = layout.offsetHeight + 'px';
    var controller = BidSystem.create(detailBid, item);
    BidSystem.show(detailBid, detailInfo, function () {
      if (controller && controller.closeBtn) {
        controller.closeBtn.addEventListener('click', function () {
          BidSystem.hide(detailBid, detailInfo, function () {
            if (layout) layout.style.minHeight = '';
          });
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
     SECTION: Language Support
     ========================================================== */

  function refreshDetailIfOpen() {
    if (!detail || !detail.classList.contains('open') || detailIndex < 0) return;

    var item = detailItems[detailIndex];
    if (!item) return;
    detailTitle.textContent = getTitle(item);
    detailTechnique.textContent = getTechnique(item) || '\u2014';
    detailCategory.textContent = getCategoryLabel(item);
    if (detailImage) detailImage.alt = Helpers.getShortLabel(item);
    renderDetailStatus(item);
  }


  /* ==========================================================
     SECTION: DOM Reference Caching
     ========================================================== */

  function cacheDomRefs() {
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
     SECTION: Initialization
     ========================================================== */

  function init() {
    cacheDomRefs();
    if (detail) initDetail();
    initInlineBid();
  }


  /* ========== PUBLIC API ========== */
  window.Detail = {
    open: function (items, index, sourceImg, options) {
      detailItems = items;
      flipOpenDetail(index, sourceImg);
      if (options && options.showBid && index < detailItems.length && detailItems[index]) {
        setTimeout(function () { showInlineBid(detailItems[index]); }, CONFIG.BID_SHOW_DELAY);
      }
    },
    close: closeDetail,
    refreshIfOpen: refreshDetailIfOpen,
    init: init
  };

  /* Start when DOM ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
