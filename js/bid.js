/* ============================================================
   BID.JS — Consolidated bid system.
   Used by carousel plaque and gallery detail panel.
   Depends on: GSAP, Helpers, i18n
   Exposes: window.BidSystem
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'besuden_bids';

  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      console.warn('BidSystem: Could not read bids from localStorage', e);
      return [];
    }
  }

  function saveBid(bid) {
    try {
      var bids = getAll();
      bids.push(bid);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bids));
      return true;
    } catch (e) {
      console.warn('BidSystem: Could not save bid to localStorage', e);
      return false;
    }
  }

  function buildFormHTML() {
    var H = Helpers;
    return '' +
      '<button type="button" class="bid-form__close" aria-label="' +
        H.translate('bid_back', 'Zur\u00fcck', 'Back') + '">&times;</button>' +
      '<h3 class="bid-form__title">' +
        H.translate('bid_title', 'Kontakt aufnehmen', 'Get in Touch') + '</h3>' +
      '<form class="bid-form" novalidate>' +
        '<div class="bid-form__field"><label>' +
          H.translate('bid_name', 'Name', 'Name') +
          '</label><input type="text" name="name" required></div>' +
        '<div class="bid-form__field"><label>' +
          H.translate('bid_email', 'E-Mail', 'Email') +
          '</label><input type="email" name="email" required></div>' +
        '<div class="bid-form__field"><label>' +
          H.translate('bid_amount', 'Ihr Gebot (EUR)', 'Your Bid (EUR)') +
          '</label><input type="number" name="amount" min="1" required></div>' +
        '<div class="bid-form__field"><label>' +
          H.translate('bid_message', 'Nachricht', 'Message') +
          '</label><textarea name="message" rows="2"></textarea></div>' +
        '<button type="submit" class="bid-form__submit">' +
          H.translate('bid_submit', 'Gebot absenden', 'Submit bid') + '</button>' +
      '</form>' +
      '<div class="bid-form__success hidden"><p>' +
        H.translate('bid_success', 'Vielen Dank. Ihr Gebot wurde entgegengenommen.',
          'Thank you. Your bid has been received.') + '</p></div>' +
      '<div class="bid-form__error hidden"></div>';
  }

  function create(container, item) {
    if (!container) return null;
    container.innerHTML = buildFormHTML();

    var form = container.querySelector('form');
    var success = container.querySelector('.bid-form__success');
    var error = container.querySelector('.bid-form__error');
    var closeBtn = container.querySelector('.bid-form__close');

    var controller = {
      container: container,
      item: item,
      form: form,
      success: success,
      error: error,
      closeBtn: closeBtn
    };

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        doSubmit(controller);
      });
    }

    return controller;
  }

  function show(container, infoEl, onComplete) {
    if (typeof gsap === 'undefined' || window.__reduced) {
      if (infoEl) { infoEl.style.visibility = 'hidden'; infoEl.style.height = '0'; infoEl.style.overflow = 'hidden'; }
      container.style.display = '';
      container.style.opacity = '1';
      if (onComplete) onComplete();
      return;
    }

    if (infoEl) {
      gsap.to(infoEl.children, {
        opacity: 0, y: -10, stagger: 0.08, duration: 0.3, ease: 'power2.in',
        onComplete: function () {
          infoEl.style.visibility = 'hidden'; infoEl.style.position = 'absolute'; infoEl.style.pointerEvents = 'none';
          container.style.display = '';
          container.style.opacity = '1';
          gsap.fromTo(container.children,
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, stagger: 0.1, duration: 0.4, ease: 'power2.out',
              onComplete: onComplete || function () {} });
        }
      });
    } else {
      container.style.opacity = '1';
      gsap.fromTo(container.children,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.4, ease: 'power2.out',
          onComplete: onComplete || function () {} });
    }
  }

  function hide(container, infoEl, onComplete) {
    if (typeof gsap === 'undefined' || window.__reduced) {
      container.style.display = 'none';
      container.style.opacity = '0';
      if (infoEl) { infoEl.style.visibility = ''; infoEl.style.position = ''; infoEl.style.pointerEvents = ''; infoEl.style.height = ''; infoEl.style.overflow = ''; infoEl.style.opacity = '1'; }
      if (onComplete) onComplete();
      return;
    }

    gsap.to(container.children, {
      opacity: 0, y: -10, stagger: 0.08, duration: 0.3, ease: 'power2.in',
      onComplete: function () {
        container.style.display = 'none';
        container.style.opacity = '0';
        var form = container.querySelector('form');
        if (form) { form.reset(); form.style.display = ''; }
        var success = container.querySelector('.bid-form__success');
        if (success) success.classList.add('hidden');
        var error = container.querySelector('.bid-form__error');
        if (error) error.classList.add('hidden');

        if (infoEl) {
          infoEl.style.visibility = ''; infoEl.style.position = ''; infoEl.style.pointerEvents = '';
          gsap.fromTo(infoEl.children,
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, stagger: 0.1, duration: 0.4, ease: 'power2.out',
              onComplete: function () {
                Array.prototype.forEach.call(infoEl.children, function (child) {
                  gsap.set(child, { clearProps: 'opacity,y' });
                });
                if (onComplete) onComplete();
              }
            });
        } else {
          if (onComplete) onComplete();
        }
      }
    });
  }

  function doSubmit(controller) {
    var form = controller.form;
    var item = controller.item;
    var error = controller.error;
    var success = controller.success;

    if (error) error.classList.add('hidden');

    var name = form.querySelector('[name="name"]');
    var email = form.querySelector('[name="email"]');
    var amount = form.querySelector('[name="amount"]');
    var message = form.querySelector('[name="message"]');

    var nameVal = name ? name.value.trim() : '';
    var emailVal = email ? email.value.trim() : '';
    var amountVal = amount ? amount.value.trim() : '';
    var messageVal = message ? message.value.trim() : '';

    if (!nameVal || !emailVal || !amountVal) {
      if (error) {
        error.textContent = Helpers.translate('bid_error_required',
          'Bitte alle Pflichtfelder ausf\u00fcllen.',
          'Please fill in all required fields.');
        error.classList.remove('hidden');
      }
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      if (error) {
        error.textContent = Helpers.translate('bid_error_required',
          'Bitte eine g\u00fcltige E-Mail angeben.',
          'Please enter a valid email address.');
        error.classList.remove('hidden');
      }
      return;
    }

    var bid = {
      name: nameVal,
      email: emailVal,
      amount: amountVal,
      message: messageVal,
      file: item ? (item.file || '') : '',
      title: item ? Helpers.getTitle(item) : '',
      year: item ? (item.year || '') : '',
      timestamp: new Date().toISOString()
    };

    if (!saveBid(bid)) {
      error.textContent = Helpers.translate('bid_error_save', 'Speichern fehlgeschlagen.', 'Could not save.');
      error.classList.remove('hidden');
      return;
    }
    if (form) form.style.display = 'none';
    if (success) success.classList.remove('hidden');
  }

  window.BidSystem = {
    create: create,
    show: show,
    hide: hide,
    submit: doSubmit,
    getAll: getAll
  };
})();
