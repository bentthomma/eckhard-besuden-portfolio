/* ============================================================
   LOADER.JS — Osmo-style film strip loader animation.
   Picks random hero image, animates strip, hands off to hero.
   Depends on: overlay.js (window.__overlay, window.__reduced)
   ============================================================ */

(function () {
  'use strict';

  if (typeof gsap === 'undefined') return;
  var reduced = window.__reduced;

  function initLoader() {
    var container = document.getElementById('loader');
    var heroName = document.getElementById('heroName');
    var heroMedia = document.querySelector('.hero__media');
    var subtitle = document.querySelector('.hero__subtitle');
    var scrollInd = document.querySelector('.hero__scroll');
    var contactL = document.querySelector('.hero__contact-left');
    var contactR = document.querySelector('.hero__contact-right');

    if (!container || reduced) {
      if (container) container.remove();
      window.__overlay.pop('loader');
      [heroName, heroMedia, subtitle, scrollInd, contactL, contactR].forEach(function (el) {
        if (el) gsap.set(el, { opacity: 1, y: 0 });
      });
      document.querySelectorAll('.nav__logo, .nav__link, .nav__lang-btn, .nav__lang-sep').forEach(function (el) {
        gsap.set(el, { opacity: 1, y: 0 });
      });
      var nav = document.getElementById('nav');
      if (nav) nav.classList.add('nav--ready');
      var overlay = document.querySelector('.hero__overlay');
      if (overlay) gsap.set(overlay, { opacity: 1 });
      return;
    }

    /* Image pool — 15 diverse paintings across categories */
    var ALL_IMAGES = [
      'assets/bilder/schluesselwerke/01.jpg',
      'assets/bilder/schluesselwerke/02.jpg',
      'assets/bilder/schluesselwerke/03.jpg',
      'assets/bilder/schluesselwerke/04.jpg',
      'assets/bilder/schluesselwerke/05.jpg',
      'assets/bilder/schluesselwerke/06.jpg',
      'assets/bilder/schluesselwerke/Bild4-2017LeningraderVariante.jpg',
      'assets/bilder/schluesselwerke/Bild2-2020Seehasgrossultramarinblau.jpg',
      'assets/bilder/abstrakt/2018-abstraktesbild55.jpg',
      'assets/bilder/abstrakt/2016-palette162.jpg',
      'assets/bilder/abstrakt/2010-abstraktesbild38.jpg',
      'assets/bilder/seebilder/2017-wolken.jpg',
      'assets/bilder/seebilder/2012-eismeer.jpg',
      'assets/bilder/tiere/2014-rehkitz.jpg',
      'assets/bilder/tiere/2008-artbaseltableauii2von10.jpg'
    ];

    var HERO_POOL = [
      'assets/bilder/schluesselwerke/01.jpg',
      'assets/bilder/schluesselwerke/02.jpg',
      'assets/bilder/schluesselwerke/04.jpg',
      'assets/bilder/schluesselwerke/05.jpg',
      'assets/bilder/schluesselwerke/Bild4-2017LeningraderVariante.jpg',
      'assets/bilder/abstrakt/2018-abstraktesbild55.jpg',
      'assets/bilder/abstrakt/2016-palette162.jpg',
      'assets/bilder/seebilder/2017-wolken.jpg'
    ];

    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
      }
      return a;
    }

    var recentHeroes = [];
    try { recentHeroes = JSON.parse(localStorage.getItem('recentHeroes') || '[]'); } catch (e) {}
    var heroPool = HERO_POOL.filter(function (src) { return recentHeroes.indexOf(src) === -1; });
    if (!heroPool.length) heroPool = HERO_POOL;
    var chosenHero = heroPool[Math.floor(Math.random() * heroPool.length)];
    recentHeroes.push(chosenHero);
    if (recentHeroes.length > 2) recentHeroes = recentHeroes.slice(-2);
    try { localStorage.setItem('recentHeroes', JSON.stringify(recentHeroes)); } catch (e) {}

    var others = shuffle(ALL_IMAGES.filter(function (p) { return p !== chosenHero; }));
    var strip = [others[0], others[1], chosenHero, others[2], others[3]];

    container.querySelectorAll('.crisp-loader__group.is--relative .crisp-loader__cover-img').forEach(function (img, i) { if (i < strip.length) img.src = strip[i]; });
    container.querySelectorAll('.crisp-loader__group.is--duplicate .crisp-loader__cover-img').forEach(function (img, i) { if (i < strip.length) img.src = strip[i]; });

    if (heroMedia) {
      heroMedia.src = chosenHero;
      heroMedia.alt = 'Eckhard Besuden — Malerei';
    }

    /* ---- Timeline ---- */
    var revealImages = container.querySelectorAll('.crisp-loader__group > *');
    var isScaleUp = container.querySelectorAll('.crisp-loader__media');
    var isScaleDown = container.querySelectorAll('.crisp-loader__media .is--scale-down');
    var isRadius = container.querySelectorAll('.crisp-loader__media.is--scaling.is--radius');

    var tl = gsap.timeline({ defaults: { ease: 'expo.inOut' } });

    if (revealImages.length) {
      tl.fromTo(revealImages, { xPercent: 500 }, { xPercent: -500, duration: 2.5, stagger: 0.05 });
    }
    if (isScaleDown.length) {
      tl.to(isScaleDown, {
        scale: 0.5, duration: 2,
        stagger: { each: 0.05, from: 'edges', ease: 'none' },
        onComplete: function () { if (isRadius) isRadius.forEach(function (el) { el.classList.remove('is--radius'); }); }
      }, '-=0.1');
    }
    if (isScaleUp.length) {
      tl.fromTo(isScaleUp, { width: '10em', height: '10em' }, { width: window.innerWidth + 'px', height: window.innerHeight + 'px', duration: 2 }, '< 0.5');
    }

    /* Hero elements for reveal */
    var overlay = document.querySelector('.hero__overlay');
    var navItems = [];
    var logo = document.querySelector('.nav__logo');
    if (logo) navItems.push(logo);
    document.querySelectorAll('.nav__link').forEach(function (l) { navItems.push(l); });
    var sep = document.querySelector('.nav__lang-sep');
    if (sep) navItems.push(sep);
    document.querySelectorAll('.nav__lang-btn').forEach(function (b) { navItems.push(b); });
    var hamburger = document.querySelector('.nav__hamburger');
    if (hamburger) navItems.push(hamburger);
    if (navItems.length) gsap.set(navItems, { opacity: 0, y: -12 });

    /* Loader image → hero handoff */
    tl.add(function () {
      var loaderImg = container.querySelector('.crisp-loader__media.is--scaling .crisp-loader__cover-img');
      var heroSection = document.querySelector('.hero');
      if (loaderImg && heroSection) {
        gsap.set(loaderImg, { clearProps: 'all' });
        loaderImg.style.cssText = '';
        loaderImg.className = 'hero__media';
        loaderImg.style.opacity = '1';
        if (heroMedia && heroMedia.parentNode) heroMedia.parentNode.removeChild(heroMedia);
        heroSection.insertBefore(loaderImg, heroSection.firstChild);
        heroMedia = loaderImg;
      }
      container.remove();
      window.__overlay.pop('loader');
    });

    tl.add(function () { if (heroMedia) heroMedia.classList.add('is--active'); }, '+=0.3');

    if (overlay) tl.to(overlay, { opacity: 1, duration: 2, ease: 'power1.in' }, '-=0.1');
    tl.to(heroName, { opacity: 1, duration: 0.8 }, '-=1.5');
    tl.to(subtitle, { opacity: 1, y: 0, duration: 0.6 }, '-=0.4');
    if (contactL) tl.to(contactL, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3');
    if (contactR) tl.to(contactR, { opacity: 1, y: 0, duration: 0.5 }, '-=0.4');
    if (scrollInd) tl.to(scrollInd, { opacity: 1, duration: 0.4 }, '-=0.2');

    if (navItems.length) {
      tl.to(navItems, {
        opacity: function (i) {
          var el = navItems[i];
          if (el.classList.contains('nav__lang-btn')) return el.classList.contains('active') ? 1 : 0.4;
          if (el.classList.contains('nav__lang-sep')) return 0.3;
          return 1;
        },
        y: 0, stagger: 0.08, duration: 0.5,
        onComplete: function () {
          navItems.forEach(function (el) {
            if (el.classList.contains('nav__lang-btn')) gsap.set(el, { clearProps: 'opacity' });
          });
          document.getElementById('nav').classList.add('nav--ready');
        }
      }, '-=0.3');
    }

    /* Safety timeout */
    var safetyItems = navItems.slice();
    setTimeout(function () {
      if (container && container.parentNode) {
        container.remove();
        window.__overlay.pop('loader');
      }
      [heroName, heroMedia, subtitle, scrollInd, contactL, contactR, overlay].forEach(function (el) {
        if (el) gsap.set(el, { opacity: 1, y: 0 });
      });
      safetyItems.forEach(function (el) { gsap.set(el, { opacity: 1, y: 0 }); });
      var nav = document.getElementById('nav');
      if (nav) nav.classList.add('nav--ready');
    }, 10000);
  }

  document.addEventListener('DOMContentLoaded', initLoader);

})();
