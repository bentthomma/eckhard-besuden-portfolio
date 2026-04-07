/* ============================================================
   INTRO-SEQUENCE.JS - Film strip intro animation.
   Picks a random hero image, animates the strip, hands off to hero.
   Depends on: overlay.js (window.__overlay, window.__reduced)
   ============================================================ */

(function () {
  'use strict';

  var motion = window.MotionEngine;
  var reduced = window.__reduced;
  var hashRestored = false;

  function restoreHashTarget() {
    var hash = window.location.hash;
    var target;

    if (hashRestored || !hash || hash.length < 2 || hash === '#hero') return;

    target = document.getElementById(hash.slice(1));
    if (!target) return;

    hashRestored = true;
    window.requestAnimationFrame(function () {
      target.scrollIntoView({
        behavior: reduced ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  }

  function applyVisibleState(el, opacityValue) {
    if (!el) return;
    if (motion) {
      motion.set(el, { opacity: opacityValue, y: 0 });
      return;
    }
    el.style.opacity = String(opacityValue);
    el.style.transform = 'none';
  }

  function revealStaticHero(container, heroName, heroMedia, subtitle, scrollInd, contactL, contactR) {
    if (container) container.remove();
    if (window.__overlay) window.__overlay.pop('intro');

    [heroName, heroMedia, subtitle, scrollInd, contactL, contactR].forEach(function (el) {
      applyVisibleState(el, 1);
    });

    if (heroMedia) heroMedia.classList.add('is--active');

    document.querySelectorAll('.nav__logo, .nav__link, .nav__lang-btn, .nav__lang-sep').forEach(function (el) {
      var opacityValue = el.classList.contains('nav__lang-btn') && !el.classList.contains('active')
        ? 0.45
        : (el.classList.contains('nav__lang-sep') ? 0.45 : 1);
      applyVisibleState(el, opacityValue);
    });

    var nav = document.getElementById('nav');
    if (nav) nav.classList.add('nav--ready');

    var overlay = document.querySelector('.hero__overlay');
    if (overlay) {
      if (motion) motion.set(overlay, { opacity: 1 });
      else overlay.style.opacity = '1';
    }

    restoreHashTarget();
  }

  function initIntroSequence() {
    window.scrollTo(0, 0);
    var container = document.getElementById('introStage');
    var heroName = document.getElementById('heroName');
    var heroMedia = document.querySelector('.hero__media');
    var subtitle = document.querySelector('.hero__subtitle');
    var scrollInd = document.querySelector('.hero__scroll');
    var contactL = document.querySelector('.hero__contact-left');
    var contactR = document.querySelector('.hero__contact-right');

    if (!container || reduced || !motion) {
      revealStaticHero(container, heroName, heroMedia, subtitle, scrollInd, contactL, contactR);
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

    container.querySelectorAll('.intro-strip__group.is--relative .intro-strip__cover-img').forEach(function (img, i) { if (i < strip.length) img.src = strip[i]; });
    container.querySelectorAll('.intro-strip__group.is--duplicate .intro-strip__cover-img').forEach(function (img, i) { if (i < strip.length) img.src = strip[i]; });

    if (heroMedia) {
      heroMedia.src = chosenHero;
      heroMedia.alt = 'Eckhard Besuden - Malerei';
    }

    /* ---- Timeline ---- */
    var revealImages = container.querySelectorAll('.intro-strip__group > *');
    var isScaleUp = container.querySelectorAll('.intro-strip__media');
    var isScaleDown = container.querySelectorAll('.intro-strip__media .is--scale-down');
    var isRadius = container.querySelectorAll('.intro-strip__media.is--scaling.is--radius');

    var tl = motion.timeline({ defaults: { ease: 'expo.inOut' } });
    var finished = false;

    function finishIntro(killTimeline) {
      if (finished) return;
      finished = true;
      if (killTimeline && tl && tl.kill) tl.kill();
      if (container && container.parentNode) container.remove();
      window.__overlay.pop('intro');
      [heroName, heroMedia, subtitle, scrollInd, contactL, contactR].forEach(function (el) {
        if (el) motion.set(el, { opacity: 1, y: 0 });
      });
      if (heroMedia) heroMedia.classList.add('is--active');
      if (overlay) motion.set(overlay, { opacity: 1 });
      navItems.forEach(function (el) {
        if (el.classList.contains('nav__lang-btn')) {
          motion.set(el, { opacity: el.classList.contains('active') ? 1 : 0.45, y: 0 });
          return;
        }
        if (el.classList.contains('nav__lang-sep')) {
          motion.set(el, { opacity: 0.45, y: 0 });
          return;
        }
        motion.set(el, { opacity: 1, y: 0 });
      });
      var nav = document.getElementById('nav');
      if (nav) nav.classList.add('nav--ready');
      restoreHashTarget();
    }

    if (revealImages.length) {
      tl.fromTo(revealImages, { xPercent: 500 }, { xPercent: -500, duration: 1.7, stagger: 0.05 });
    }
    if (isScaleDown.length) {
      tl.to(isScaleDown, {
        scale: 0.5, duration: 1.35,
        stagger: { each: 0.05, from: 'edges', ease: 'none' },
        onComplete: function () { if (isRadius) isRadius.forEach(function (el) { el.classList.remove('is--radius'); }); }
      }, '-=0.1');
    }
    if (isScaleUp.length) {
      tl.fromTo(isScaleUp, { width: '10em', height: '10em' }, { width: window.innerWidth + 'px', height: window.innerHeight + 'px', duration: 1.4 }, '< 0.35');
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
    if (navItems.length) motion.set(navItems, { y: -12 });

    /* Intro image → hero handoff */
    tl.add(function () {
      var introImg = container.querySelector('.intro-strip__media.is--scaling .intro-strip__cover-img');
      var heroSection = document.querySelector('.hero');
      if (introImg && heroSection) {
        motion.set(introImg, { clearProps: 'all' });
        introImg.style.cssText = '';
        introImg.className = 'hero__media';
        introImg.style.opacity = '1';
        if (heroMedia && heroMedia.parentNode) heroMedia.parentNode.removeChild(heroMedia);
        heroSection.insertBefore(introImg, heroSection.firstChild);
        heroMedia = introImg;
      }
      if (container && container.parentNode) container.remove();
      window.__overlay.pop('intro');
      finished = true;
    });

    tl.add(function () { if (heroMedia) heroMedia.classList.add('is--active'); }, '+=0.12');

    if (overlay) tl.to(overlay, { opacity: 1, duration: 1.2, ease: 'power1.in' }, '-=0.1');
    tl.to(heroName, { opacity: 1, duration: 0.65 }, '-=1.05');
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
        y: 0, stagger: 0.12, duration: 0.55,
        onComplete: function () {
          navItems.forEach(function (el) {
            if (el.classList.contains('nav__lang-btn')) motion.set(el, { clearProps: 'opacity' });
          });
          document.getElementById('nav').classList.add('nav--ready');
          restoreHashTarget();
        }
      }, '-=1.15');
    }

    container.addEventListener('click', function () {
      finishIntro(true);
    }, { once: true });

    container.addEventListener('touchend', function () {
      finishIntro(true);
    }, { passive: true, once: true });

    setTimeout(function () {
      finishIntro(true);
    }, 6000);
  }

  document.addEventListener('DOMContentLoaded', initIntroSequence);

})();
