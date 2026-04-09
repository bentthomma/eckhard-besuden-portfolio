/* ============================================================
   NAV.JS — Desktop/mobile navigation + legal modals.
   Depends on: overlay.js (window.__overlay), scroll.js (Scroll)
   ============================================================ */

(function () {
  'use strict';

  function initNav() {
    var hamburger = document.getElementById('hamburger');
    var mobileMenu = document.getElementById('mobileMenu');
    if (!hamburger || !mobileMenu) return;

    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-controls', 'mobileMenu');
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      var isOpen = mobileMenu.classList.contains('open');
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      mobileMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      if (isOpen) window.__overlay.push('mobile-menu', mobileMenu); else window.__overlay.pop('mobile-menu');
    });
    mobileMenu.querySelectorAll('.mobile-menu__link').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
        window.__overlay.pop('mobile-menu');
      });
    });

    /* Anchor links — navigate via scroll state machine */
    document.querySelectorAll('a[href^="#"]:not([href="#main"])').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        if (!href || href === '#') return;
        e.preventDefault();
        var id = href.replace('#', '');

        if (id === 'works') {
          var worksEl = document.getElementById('works');
          if (worksEl) worksEl.classList.remove('works--hidden');
          document.querySelectorAll('.works-gate-hidden').forEach(function (el) { el.classList.remove('works-gate-hidden'); });
          if (window.Gallery && window.Gallery.expand) window.Gallery.expand();
        }

        if (id && typeof Scroll !== 'undefined' && Scroll.navigateTo) Scroll.navigateTo(id);
      });
    });
  }

  function initModals() {
    [{ btn: 'privacyBtn', modal: 'privacyModal' }, { btn: 'imprintBtn', modal: 'imprintModal' }].forEach(function (p) {
      var btn = document.getElementById(p.btn), modal = document.getElementById(p.modal);
      if (!btn || !modal) return;
      var bd = modal.querySelector('.modal__backdrop'), cl = modal.querySelector('.modal__close');
      btn.addEventListener('click', function () { modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); window.__overlay.push(p.modal, modal); });
      [bd, cl].forEach(function (el) { if (el) el.addEventListener('click', function () { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); window.__overlay.pop(p.modal); }); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      /* Close mobile menu on Escape */
      var mobileMenu = document.getElementById('mobileMenu');
      var hamburger = document.querySelector('.nav__hamburger');
      if (mobileMenu && mobileMenu.classList.contains('open')) {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
        window.__overlay.pop('mobile-menu');
        return;
      }
      if (document.querySelector('.detail.open')) return;
      document.querySelectorAll('.modal.open').forEach(function (m) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); window.__overlay.pop(m.id); });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initModals();
  });

})();
