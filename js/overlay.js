/* ============================================================
   OVERLAY.JS — Central scroll-lock + focus trap system.
   Must load before all other app JS (except vendor + i18n).
   Exposes: window.__overlay, window.__reduced
   ============================================================ */

(function () {
  'use strict';

  if (typeof gsap === 'undefined') return;

  /* Shared reduced-motion flag — other modules read window.__reduced */
  window.__reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Overlay Stack ---- */
  var overlayStack = [];

  function pushOverlay(id, el) {
    overlayStack.push(id);
    document.body.style.overflow = 'hidden';
    if (el) trapFocus(el);
  }

  function popOverlay(id) {
    overlayStack = overlayStack.filter(function (s) { return s !== id; });
    if (overlayStack.length === 0) document.body.style.overflow = '';
    releaseFocus();
  }

  /* ---- Focus Trap ---- */
  var focusTrapEl = null;
  var previousFocus = null;
  var FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function trapFocus(el) {
    previousFocus = document.activeElement;
    focusTrapEl = el;
    var first = el.querySelector(FOCUSABLE);
    if (first) first.focus();
    document.addEventListener('keydown', handleTrapKeydown);
  }

  function releaseFocus() {
    document.removeEventListener('keydown', handleTrapKeydown);
    if (previousFocus && previousFocus.focus) previousFocus.focus();
    focusTrapEl = null;
    previousFocus = null;
  }

  function handleTrapKeydown(e) {
    if (e.key !== 'Tab' || !focusTrapEl) return;
    var focusable = focusTrapEl.querySelectorAll(FOCUSABLE);
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  /* ---- Public API ---- */
  window.__overlay = { push: pushOverlay, pop: popOverlay };

  /* Lock scroll immediately for loader */
  document.addEventListener('DOMContentLoaded', function () {
    pushOverlay('loader');
  });

})();
