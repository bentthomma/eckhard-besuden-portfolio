/* ============================================================
   SCROLL-UI.JS — Progress bar, scroll-triggered reveals, dividers.
   Self-contained UI enhancements driven by scroll position.
   Depends on: GSAP, ScrollTrigger
   Exposes: window.ScrollUI
   ============================================================ */
(function () {
  'use strict';

  if (typeof gsap === 'undefined') {
    window.ScrollUI = { initProgressBar: function () {}, initReveals: function () {}, initDividers: function () {} };
    return;
  }

  function initProgressBar() {
    var bar = document.getElementById('scrollProgress');
    if (!bar) return;
    var barMax = 0;
    var barLastCalc = 0;
    gsap.ticker.add(function () {
      var now = Date.now();
      if (now - barLastCalc > 500) { barMax = document.body.scrollHeight - window.innerHeight; barLastCalc = now; }
      var ratio = barMax > 0 ? window.scrollY / barMax : 0;
      bar.style.transform = 'scaleX(' + ratio + ')';
    });
  }

  function initReveals() {
    var reduced = window.__reduced;
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

  function initDividers() {
    document.querySelectorAll('.section-divider').forEach(function (d) {
      ScrollTrigger.create({
        trigger: d, start: 'top 92%', once: true,
        onEnter: function () { d.classList.add('visible'); }
      });
    });
  }

  window.ScrollUI = {
    initProgressBar: initProgressBar,
    initReveals: initReveals,
    initDividers: initDividers
  };
})();
