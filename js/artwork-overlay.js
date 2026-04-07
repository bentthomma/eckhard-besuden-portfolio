/* ============================================================
   ARTWORK-OVERLAY.JS - Shared artwork detail and bid overlay
   ============================================================ */

(function () {
  'use strict';

  function getLang() {
    return document.documentElement.lang || 'de';
  }

  function translate(key, fallbackDe, fallbackEn) {
    if (window.i18n && typeof window.i18n.t === 'function') {
      return window.i18n.t(key);
    }
    return getLang() === 'en' ? fallbackEn : fallbackDe;
  }

  function createArtworkOverlayController(options) {
    var settings = options || {};
    var motion = window.MotionEngine;
    var detail;
    var detailImage;
    var detailTitle;
    var detailYear;
    var detailTechnique;
    var detailDimensions;
    var detailCategory;
    var detailCounter;
    var detailInfo;
    var detailStatus;
    var detailLayout;
    var detailPrev;
    var detailNext;
    var detailBackdrop;
    var detailClose;
    var detailBid;
    var bidForm;
    var bidSuccess;
    var bidError;
    var bidBackBtn;
    var touchStartX = 0;
    var touchEndX = 0;
    var currentIndex = -1;
    var currentBidItem = null;
    var isOpen = false;
    var isTransitioning = false;
    var isBound = false;

    function getItems() {
      return typeof settings.getItems === 'function' ? (settings.getItems() || []) : [];
    }

    function getItem(index) {
      var items = getItems();
      return index >= 0 && index < items.length ? items[index] : null;
    }

    function getTitle(item) {
      return settings.getTitle ? settings.getTitle(item) : '';
    }

    function getTechnique(item) {
      return settings.getTechnique ? settings.getTechnique(item) : '';
    }

    function getDimensions(item) {
      return settings.getDimensions ? settings.getDimensions(item) : '';
    }

    function getCategory(item) {
      return settings.getCategory ? settings.getCategory(item) : '';
    }

    function getShortLabel(item) {
      if (settings.getShortLabel) return settings.getShortLabel(item);
      var title = getTitle(item);
      var year = item && item.year ? String(item.year) : '';
      if (title && year) return title + ', ' + year;
      return title || year;
    }

    function resolvePath(path) {
      return settings.resolvePath ? settings.resolvePath(path) : path;
    }

    function useNavigation() {
      return !settings.hideNavigation;
    }

    function cacheDom() {
      detail = document.getElementById('detail');
      detailImage = document.getElementById('detailImage');
      detailTitle = document.getElementById('detailTitle');
      detailYear = document.getElementById('detailYear');
      detailTechnique = document.getElementById('detailTechnique');
      detailDimensions = document.getElementById('detailDimensions');
      detailCategory = document.getElementById('detailCategory');
      detailCounter = document.getElementById('detailCounter');
      detailInfo = document.getElementById('detailInfo');
      detailStatus = document.getElementById('detailStatus');
      detailLayout = detail ? detail.querySelector('.detail__layout') : null;
      detailPrev = detail ? detail.querySelector('.detail__prev') : null;
      detailNext = detail ? detail.querySelector('.detail__next') : null;
      detailBackdrop = detail ? detail.querySelector('.detail__backdrop') : null;
      detailClose = detail ? detail.querySelector('.detail__close') : null;
    }

    function setFieldVisibility() {
      if (!detailTechnique || !detailDimensions || !detailCategory) return;
      if (detailTechnique.parentElement) detailTechnique.parentElement.style.display = '';
      if (detailDimensions.parentElement) detailDimensions.parentElement.style.display = '';
      if (detailCategory.parentElement) detailCategory.parentElement.style.display = '';
    }

    function updateNavVisibility() {
      if (detailPrev) detailPrev.style.display = useNavigation() ? '' : 'none';
      if (detailNext) detailNext.style.display = useNavigation() ? '' : 'none';
      if (detailCounter) detailCounter.style.display = useNavigation() ? '' : 'none';
    }

    function buildBidFormHtml() {
      return '' +
        '<button class="bid-form__close" id="bidBack" aria-label="' + translate('a11y_close', 'Schliessen', 'Close') + '">&times;</button>' +
        '<h2 class="detail__title">' + translate('bid_title', 'Gebot abgeben', 'Place a bid') + '</h2>' +
        '<form class="bid-form bid-form--inline" id="bidFormInline" novalidate>' +
          '<div class="bid-form__field"><label>' + translate('bid_name', 'Name', 'Name') + '</label><input type="text" name="name" required></div>' +
          '<div class="bid-form__field"><label>' + translate('bid_email', 'E-Mail', 'Email') + '</label><input type="email" name="email" required></div>' +
          '<div class="bid-form__field"><label>' + translate('bid_amount', 'Ihr Gebot (EUR)', 'Your bid (EUR)') + '</label><input type="number" name="amount" min="1" required></div>' +
          '<div class="bid-form__field"><label>' + translate('bid_message', 'Nachricht', 'Message') + '</label><textarea name="message" rows="2"></textarea></div>' +
          '<button type="submit" class="detail__bid-btn bid-form__submit">' + translate('bid_submit', 'Gebot absenden', 'Submit bid') + '</button>' +
        '</form>' +
        '<div class="bid-form__success hidden" id="bidSuccessInline"><p>' + translate('bid_success', 'Vielen Dank. Ihr Gebot wurde entgegengenommen.', 'Thank you. Your bid has been received.') + '</p></div>' +
        '<div class="bid-form__error hidden" id="bidErrorInline"></div>';
    }

    function bindBidUi() {
      if (!detailBid) return;
      bidForm = detailBid.querySelector('#bidFormInline');
      bidSuccess = detailBid.querySelector('#bidSuccessInline');
      bidError = detailBid.querySelector('#bidErrorInline');
      bidBackBtn = detailBid.querySelector('#bidBack');

      if (bidForm && !bidForm.dataset.bound) {
        bidForm.addEventListener('submit', handleBidSubmit);
        bidForm.dataset.bound = 'true';
      }

      if (bidBackBtn && !bidBackBtn.dataset.bound) {
        bidBackBtn.addEventListener('click', function (event) {
          event.stopPropagation();
          showDetail();
        });
        bidBackBtn.dataset.bound = 'true';
      }
    }

    function ensureBidPanel() {
      if (!detailInfo || !detailInfo.parentElement) return;
      detailBid = document.getElementById('detailBid');

      if (!detailBid) {
        detailBid = document.createElement('div');
        detailBid.id = 'detailBid';
        detailBid.className = 'detail__info';
        detailBid.style.display = 'none';
        detailBid.style.opacity = '0';
        detailInfo.parentElement.appendChild(detailBid);
      }

      detailBid.innerHTML = buildBidFormHtml();
      bindBidUi();
    }

    function renderStatus(item) {
      if (!detailStatus) return;
      detailStatus.innerHTML = '';

      var ownerLabel = document.createElement('span');
      ownerLabel.className = 'detail__label';
      ownerLabel.textContent = getLang() === 'en' ? 'Collection' : 'Besitz';
      detailStatus.appendChild(ownerLabel);

      var ownerValue = document.createElement('p');
      ownerValue.className = 'detail__owner-value';
      ownerValue.textContent = item && item.owner ? item.owner : translate('detail_available', 'Verfuegbar', 'Available');
      detailStatus.appendChild(ownerValue);

      var bidButton = document.createElement('button');
      bidButton.type = 'button';
      bidButton.className = 'detail__bid-btn';
      bidButton.textContent = translate('bid_title', 'Gebot abgeben', 'Place a bid');
      bidButton.addEventListener('click', function () {
        showBid();
      });
      detailStatus.appendChild(bidButton);
    }

    function populate(index) {
      var item = getItem(index);
      if (!item || !detailImage) return null;

      currentIndex = index;
      currentBidItem = item;
      detailImage.src = resolvePath(item.path);
      detailImage.alt = getShortLabel(item);
      if (detailTitle) detailTitle.textContent = getTitle(item);
      if (detailYear) detailYear.textContent = item.year ? String(item.year) : '\u2014';
      if (detailTechnique) detailTechnique.textContent = getTechnique(item) || '\u2014';
      if (detailDimensions) detailDimensions.textContent = getDimensions(item) || '\u2014';
      if (detailCategory) detailCategory.textContent = getCategory(item) || '\u2014';
      if (detailCounter) detailCounter.textContent = (index + 1) + ' / ' + getItems().length;
      renderStatus(item);
      setFieldVisibility();
      return item;
    }

    function createFlipClone(sourceImage) {
      var rect = sourceImage.getBoundingClientRect();
      var clone = document.createElement('img');
      clone.className = 'flip-clone';
      clone.src = sourceImage.src;
      clone.style.left = rect.left + 'px';
      clone.style.top = rect.top + 'px';
      clone.style.width = rect.width + 'px';
      clone.style.height = rect.height + 'px';
      return clone;
    }

    function resetPanels(immediate) {
      if (!detailInfo || !detailBid) return;
      if (bidForm) {
        bidForm.reset();
        bidForm.style.display = '';
      }
      if (bidSuccess) bidSuccess.classList.add('hidden');
      if (bidError) bidError.classList.add('hidden');

      if (immediate || !motion) {
        detailBid.style.display = 'none';
        detailBid.style.opacity = '0';
        detailInfo.style.display = '';
        detailInfo.style.opacity = '1';
        Array.prototype.forEach.call(detailInfo.children, function (child) {
          child.style.opacity = '1';
          child.style.transform = 'none';
        });
        Array.prototype.forEach.call(detailBid.children, function (child) {
          child.style.opacity = '1';
          child.style.transform = 'none';
        });
        return;
      }

      detailBid.style.display = 'none';
      detailBid.style.opacity = '0';
      detailInfo.style.display = '';
      Array.prototype.forEach.call(detailInfo.children, function (child) {
        motion.set(child, { opacity: 1, y: 0 });
      });
      Array.prototype.forEach.call(detailBid.children, function (child) {
        motion.set(child, { opacity: 1, y: 0 });
      });
    }

    function isBidVisible() {
      return !!(detailBid && detailBid.style.display !== 'none');
    }

    function showBid(immediate) {
      if (!detailInfo || !detailBid) return;
      if (bidForm) {
        bidForm.reset();
        bidForm.style.display = '';
      }
      if (bidSuccess) bidSuccess.classList.add('hidden');
      if (bidError) bidError.classList.add('hidden');

      if (immediate || !motion) {
        detailInfo.style.display = 'none';
        detailBid.style.display = '';
        detailBid.style.opacity = '1';
        detailBid.style.transform = 'none';
        return;
      }

      var infoChildren = detailInfo.children;
      motion.to(infoChildren, {
        opacity: 0,
        y: -10,
        stagger: 0.08,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: function () {
          detailInfo.style.display = 'none';
          detailBid.style.display = '';
          detailBid.style.opacity = '1';
          detailBid.style.transform = 'none';
          motion.fromTo(detailBid.children, {
            opacity: 0,
            y: 15
          }, {
            opacity: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.4,
            ease: 'power2.out'
          });
        }
      });
    }

    function showDetail(immediate) {
      if (!detailInfo || !detailBid) return;

      if (immediate || !motion) {
        detailBid.style.display = 'none';
        detailInfo.style.display = '';
        detailInfo.style.opacity = '1';
        return;
      }

      motion.to(detailBid.children, {
        opacity: 0,
        y: -10,
        stagger: 0.08,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: function () {
          detailBid.style.display = 'none';
          detailInfo.style.display = '';
          motion.fromTo(detailInfo.children, {
            opacity: 0,
            y: 15
          }, {
            opacity: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.4,
            ease: 'power2.out'
          });
        }
      });
    }

    function afterOpen(startMode) {
      if (!detail) return;
      isOpen = true;
      updateNavVisibility();
      if (startMode === 'bid') showBid(true);
      else showDetail(true);
      if (typeof settings.onAfterOpen === 'function') {
        settings.onAfterOpen(currentIndex, getItem(currentIndex), startMode);
      }
    }

    function open(config) {
      var payload = config || {};
      var sourceImage = payload.sourceImage || null;
      var item = populate(payload.index);

      if (!item || !detail) return;

      resetPanels(true);
      updateNavVisibility();

      if (window.__overlay) window.__overlay.push('detail', detail);
      detail.classList.add('open');

      if (!motion || !sourceImage) {
        afterOpen(payload.startMode || 'detail');
        return;
      }

      document.querySelectorAll('.flip-clone').forEach(function (clone) {
        clone.remove();
      });

      motion.killTweensOf(detail);
      motion.killTweensOf(detailImage);

      var clone = createFlipClone(sourceImage);
      document.body.appendChild(clone);
      detailImage.style.visibility = 'hidden';
      detailImage.style.opacity = '0';

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          var targetRect = detailImage.getBoundingClientRect();

          if (targetRect.width < 10 || targetRect.height < 10) {
            clone.remove();
            detailImage.style.visibility = '';
            detailImage.style.opacity = '1';
            afterOpen(payload.startMode || 'detail');
            return;
          }

          motion.to(clone, {
            left: targetRect.left,
            top: targetRect.top,
            width: targetRect.width,
            height: targetRect.height,
            duration: window.innerWidth < 768 ? 0.85 : 0.5,
            ease: 'power3.inOut',
            onComplete: function () {
              /* Show detail image under the clone but keep it transparent */
              detailImage.style.visibility = '';
              detailImage.style.opacity = '0';
              /* Parallel crossfade: fade clone out AND detail image in simultaneously */
              motion.to(clone, { opacity: 0, duration: 0.15, onComplete: function () { clone.remove(); } });
              motion.to(detailImage, { opacity: 1, duration: 0.15 });
              afterOpen(payload.startMode || 'detail');
              if (payload.startMode === 'bid') {
                motion.from(detailBid.children, {
                  opacity: 0,
                  y: 15,
                  stagger: 0.1,
                  duration: 0.45,
                  delay: 0.12,
                  ease: 'power2.out'
                });
              } else {
                motion.from(detailInfo.children, {
                  opacity: 0,
                  y: 15,
                  stagger: 0.12,
                  duration: 0.5,
                  delay: 0.12,
                  ease: 'power2.out'
                });
              }
            }
          });
        });
      });
    }

    function finishClose() {
      if (!detail) return;
      /* Force panel invisible immediately — no transition blink */
      detail.style.transition = 'none';
      detail.style.opacity = '0';
      detail.style.background = 'rgba(43,41,37,0)';
      detail.classList.remove('open');
      detailImage.style.visibility = 'hidden';
      detailImage.style.opacity = '0';
      detailImage.src = '';
      if (window.__overlay) window.__overlay.pop('detail');
      isOpen = false;
      isTransitioning = false;
      currentIndex = -1;
      currentBidItem = null;
      resetPanels(true);
      document.querySelectorAll('.flip-clone').forEach(function (clone) {
        clone.remove();
      });
      /* Restore transitions after a frame so they work on next open */
      requestAnimationFrame(function () {
        detail.style.transition = '';
        detail.style.opacity = '';
        detail.style.background = '';
      });
      if (typeof settings.onAfterClose === 'function') {
        settings.onAfterClose();
      }
    }

    function close() {
      if (!detail || !isOpen) return;
      var sourceImage = typeof settings.getSourceImage === 'function' ? settings.getSourceImage(currentIndex) : null;
      var sourceRect = sourceImage ? sourceImage.getBoundingClientRect() : null;
      var canFlipBack = sourceRect && sourceRect.width > 10 && sourceRect.height > 10 && sourceRect.bottom > 0 && sourceRect.top < window.innerHeight;

      if (!motion || !sourceImage || !canFlipBack || !detailImage.src) {
        if (motion) {
          motion.to(detail, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: finishClose
          });
        } else {
          finishClose();
        }
        return;
      }

      var detailRect = detailImage.getBoundingClientRect();
      var clone = document.createElement('img');
      clone.className = 'flip-clone';
      clone.src = detailImage.src;
      clone.style.left = detailRect.left + 'px';
      clone.style.top = detailRect.top + 'px';
      clone.style.width = detailRect.width + 'px';
      clone.style.height = detailRect.height + 'px';
      detailImage.style.visibility = 'hidden';
      detailImage.style.opacity = '0';
      document.body.appendChild(clone);
      motion.to(detail, { opacity: 0, duration: window.innerWidth < 768 ? 0.5 : 0.35, ease: 'power2.in' });
      motion.to(clone, {
        left: sourceRect.left,
        top: sourceRect.top,
        width: sourceRect.width,
        height: sourceRect.height,
        duration: window.innerWidth < 768 ? 0.8 : 0.5,
        ease: 'power3.inOut',
        onComplete: function () {
          clone.remove();
          finishClose();
        }
      });
    }

    function navigate(direction) {
      if (!useNavigation() || !detailLayout || isTransitioning || !isOpen) return;
      var items = getItems();
      if (!items.length) return;

      var nextIndex = currentIndex + direction;
      if (nextIndex < 0) nextIndex = items.length - 1;
      if (nextIndex >= items.length) nextIndex = 0;

      isTransitioning = true;

      if (isBidVisible()) {
        resetPanels(true);
      }

      if (typeof settings.onNavigate === 'function') {
        settings.onNavigate(nextIndex, direction);
      }

      if (!motion) {
        populate(nextIndex);
        resetPanels(true);
        isTransitioning = false;
        return;
      }

      var exitX = direction > 0 ? -80 : 80;
      var enterX = direction > 0 ? 80 : -80;

      motion.to(detailLayout, {
        x: exitX,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: function () {
          populate(nextIndex);
          resetPanels(true);
          motion.fromTo(detailLayout, {
            x: enterX,
            opacity: 0
          }, {
            x: 0,
            opacity: 1,
            duration: 0.4,
            ease: 'power2.out',
            onComplete: function () {
              isTransitioning = false;
            }
          });
        }
      });
    }

    function handleBidSubmit(event) {
      event.preventDefault();
      if (!bidForm || !currentBidItem) return;

      var nameInput = bidForm.querySelector('[name="name"]');
      var emailInput = bidForm.querySelector('[name="email"]');
      var amountInput = bidForm.querySelector('[name="amount"]');
      var messageInput = bidForm.querySelector('[name="message"]');
      if (!nameInput || !emailInput || !amountInput) return;

      var nameValue = nameInput.value.trim();
      var emailValue = emailInput.value.trim();
      var amountValue = amountInput.value.trim();

      if (bidError) bidError.classList.add('hidden');

      if (!nameValue || !emailValue || !amountValue) {
        if (bidError) {
          bidError.textContent = translate('bid_error_required', 'Bitte fuellen Sie alle Pflichtfelder aus.', 'Please fill in all required fields.');
          bidError.classList.remove('hidden');
        }
        return;
      }

      try {
        var bids = JSON.parse(localStorage.getItem('besuden_bids') || '[]');
        bids.push({
          work: getTitle(currentBidItem),
          year: currentBidItem.year || '',
          file: currentBidItem.file || '',
          name: nameValue,
          email: emailValue,
          amount: amountValue,
          message: messageInput ? messageInput.value.trim() : '',
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('besuden_bids', JSON.stringify(bids));
      } catch (error) {
        /* Storage unavailable. */
      }

      bidForm.style.display = 'none';
      if (bidSuccess) bidSuccess.classList.remove('hidden');
    }

    function refresh() {
      if (!detail) return;
      ensureBidPanel();
      updateNavVisibility();
      if (isOpen && currentIndex >= 0) {
        var keepBid = isBidVisible();
        populate(currentIndex);
        if (keepBid) showBid(true);
        else showDetail(true);
      }
    }

    function handleKeydown(event) {
      if (!isOpen) return;
      if (window.__overlay && window.__overlay.isOpen && window.__overlay.isOpen('image-fullscreen')) return;

      if (event.key === 'Escape') {
        close();
        return;
      }

      if (!useNavigation() || isBidVisible()) return;
      if (event.key === 'ArrowLeft') navigate(-1);
      if (event.key === 'ArrowRight') navigate(1);
    }

    function bind() {
      if (isBound || !detail) return;

      if (detailBackdrop) detailBackdrop.addEventListener('click', close);
      if (detailClose) {
        detailClose.addEventListener('click', function (event) {
          event.stopPropagation();
          close();
        });
      }
      if (detailPrev) {
        detailPrev.addEventListener('click', function (event) {
          event.stopPropagation();
          navigate(-1);
        });
      }
      if (detailNext) {
        detailNext.addEventListener('click', function (event) {
          event.stopPropagation();
          navigate(1);
        });
      }

      document.addEventListener('keydown', handleKeydown);

      detail.addEventListener('touchstart', function (event) {
        if (!useNavigation() || !event.changedTouches || !event.changedTouches.length) return;
        touchStartX = event.changedTouches[0].screenX;
      }, { passive: true });

      detail.addEventListener('touchend', function (event) {
        if (!useNavigation() || isBidVisible() || !event.changedTouches || !event.changedTouches.length) return;
        touchEndX = event.changedTouches[0].screenX;
        if (Math.abs(touchStartX - touchEndX) < 50) return;
        navigate(touchStartX > touchEndX ? 1 : -1);
      }, { passive: true });

      isBound = true;
    }

    function init() {
      cacheDom();
      if (!detail) return api;
      ensureBidPanel();
      updateNavVisibility();
      bind();
      return api;
    }

    var api = {
      init: init,
      open: open,
      showDetail: showDetail,
      showBid: showBid,
      close: close,
      refresh: refresh,
      isOpen: function () {
        return isOpen;
      },
      getCurrentIndex: function () {
        return currentIndex;
      }
    };

    return api;
  }

  window.ArtworkOverlay = {
    create: createArtworkOverlayController
  };
})();
