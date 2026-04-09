/* ============================================================
   INTERACTIONS.JS — Magnetic hover, image loading, email,
   loupe zoom, fullscreen FLIP, back-to-top.
   All self-contained. No cross-file dependencies except gsap.
   ============================================================ */

(function () {
  'use strict';

  if (typeof gsap === 'undefined') return;
  var reduced = window.__reduced;

  /* ---- Magnetic Hover (Event Delegation) ---- */
  function initMagnetic() {
    if (reduced || (window.matchMedia && window.matchMedia('(hover: none)').matches)) return;
    var MAGNETIC = '.nav__link, .filter-btn, .cta, .footer__link, .detail__bid-btn';
    document.addEventListener('mousemove', function (e) {
      var el = e.target.closest(MAGNETIC);
      if (!el) return;
      var r = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.15, y: (e.clientY - r.top - r.height / 2) * 0.15, duration: 0.3, ease: 'power2.out' });
    });
    document.addEventListener('mouseleave', function (e) {
      if (!e.target || typeof e.target.closest !== 'function') return;
      var el = e.target.closest(MAGNETIC);
      if (!el) return;
      gsap.to(el, { x: 0, y: 0, duration: 0.4, ease: 'elastic.out(1,0.5)' });
    }, true);
  }

  /* ---- Image Lazy Loading ---- */
  function initImages() {
    document.querySelectorAll('.img-wrap img').forEach(function (img) {
      if (img.complete) img.classList.add('loaded');
      else img.addEventListener('load', function () { img.classList.add('loaded'); });
    });
  }

  /* ---- Email Obfuscation ---- */
  function initEmail() {
    var link = document.getElementById('emailLink');
    if (!link) return;
    var u = 'EckhardBesuden', d = 'web.de';
    link.href = 'mailto:' + u + '@' + d;
    link.textContent = u + '@' + d;
    document.querySelectorAll('.email-obf').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); window.location.href = 'mailto:' + u + '@' + d; });
    });
  }

  /* ---- Loupe Zoom ---- */
  function initLoupe() {
    var wrap = document.getElementById('detailImageWrap');
    var loupe = document.getElementById('detailLoupe');
    var img = document.getElementById('detailImage');
    if (!wrap || !loupe || !img || (window.matchMedia && window.matchMedia('(hover: none)').matches)) return;

    var ZOOM = 2.5, SIZE = 160, ready = false;
    new MutationObserver(function () {
      ready = false;
      if (img.complete && img.naturalWidth > 0) ready = true;
      else img.addEventListener('load', function () { ready = true; }, { once: true });
    }).observe(img, { attributes: true, attributeFilter: ['src'] });

    wrap.addEventListener('mousemove', function (e) {
      if (!document.querySelector('.detail.open') || !ready || !img.src) { loupe.style.opacity = '0'; return; }
      var r = img.getBoundingClientRect();
      if (!r.width) return;
      var x = e.clientX - r.left, y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) { loupe.style.opacity = '0'; return; }
      var wr = wrap.getBoundingClientRect();
      loupe.style.left = (e.clientX - wr.left) + 'px';
      loupe.style.top = (e.clientY - wr.top) + 'px';
      loupe.style.backgroundImage = 'url("' + img.src + '")';
      loupe.style.backgroundSize = (r.width * ZOOM) + 'px ' + (r.height * ZOOM) + 'px';
      loupe.style.backgroundPosition = -(x * ZOOM - SIZE / 2) + 'px ' + -(y * ZOOM - SIZE / 2) + 'px';
      loupe.style.opacity = '1';
    });
    wrap.addEventListener('mouseleave', function () { loupe.style.opacity = '0'; });
  }

  /* ---- Fullscreen FLIP ---- */
  function initFullscreen() {
    var btn = document.getElementById('detailFullscreenBtn');
    var overlay = document.getElementById('imageFullscreen');
    var fImg = document.getElementById('fullscreenImage');
    var close = overlay ? overlay.querySelector('.image-fullscreen__close') : null;
    var src = document.getElementById('detailImage');
    if (!btn || !overlay || !fImg || !src) return;

    var isMobile = (window.matchMedia && window.matchMedia('(hover: none)').matches) || window.innerWidth < 768;
    var activeClone = null;

    function openFullscreen() {
      if (activeClone) { activeClone.remove(); activeClone = null; }

      var srcRect = src.getBoundingClientRect();
      activeClone = document.createElement('img');
      activeClone.src = src.src;
      activeClone.className = 'flip-clone';
      activeClone.style.zIndex = '8500';
      activeClone.style.cursor = 'pointer';
      activeClone.style.touchAction = 'pinch-zoom';
      activeClone.addEventListener('click', function () { closeFullscreen(); });
      activeClone.style.left = srcRect.left + 'px';
      activeClone.style.top = srcRect.top + 'px';
      activeClone.style.width = srcRect.width + 'px';
      activeClone.style.height = srcRect.height + 'px';
      document.body.appendChild(activeClone);

      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var imgRatio = src.naturalWidth / src.naturalHeight;
      var maxW = vw * 0.95;
      var maxH = vh * 0.95;
      var finalW = Math.min(maxW, maxH * imgRatio);
      var finalH = finalW / imgRatio;

      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      if (window.__overlay) window.__overlay.push('fullscreen', overlay);
      fImg.style.display = 'none';

      if (reduced) {
        gsap.set(overlay, { opacity: 1 });
        gsap.set(activeClone, { left: (vw - finalW) / 2, top: (vh - finalH) / 2, width: finalW, height: finalH });
        return;
      }

      gsap.set(overlay, { opacity: 0 });
      gsap.to(overlay, { opacity: 1, duration: 0.6, ease: 'power2.out' });

      gsap.to(activeClone, {
        left: (vw - finalW) / 2,
        top: (vh - finalH) / 2,
        width: finalW,
        height: finalH,
        duration: isMobile ? 0.8 : 0.6,
        ease: 'power3.inOut'
      });
    }

    function closeFullscreen() {
      if (reduced) {
        if (activeClone) { activeClone.remove(); activeClone = null; }
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        if (window.__overlay) window.__overlay.pop('fullscreen');
        fImg.style.display = '';
        return;
      }
      var targetRect = src.getBoundingClientRect();
      var targetVisible = targetRect.width > 10 && targetRect.height > 10 && targetRect.bottom > 0 && targetRect.top < window.innerHeight;
      if (activeClone && targetVisible) {
        gsap.to(overlay, { opacity: 0, duration: 0.5, ease: 'power2.in' });
        gsap.to(activeClone, {
          left: targetRect.left, top: targetRect.top, width: targetRect.width, height: targetRect.height,
          duration: isMobile ? 0.7 : 0.5,
          ease: 'power3.inOut',
          onComplete: function () {
            if (activeClone) { activeClone.remove(); activeClone = null; }
            overlay.classList.remove('open');
            overlay.setAttribute('aria-hidden', 'true');
            if (window.__overlay) window.__overlay.pop('fullscreen');
            fImg.style.display = '';
          }
        });
      } else {
        if (activeClone) { activeClone.remove(); activeClone = null; }
        gsap.to(overlay, { opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: function () {
          overlay.classList.remove('open');
          overlay.setAttribute('aria-hidden', 'true');
          if (window.__overlay) window.__overlay.pop('fullscreen');
          fImg.style.display = '';
        }});
      }
    }

    btn.addEventListener('click', function (e) { e.stopPropagation(); openFullscreen(); });
    if (isMobile && src) src.addEventListener('click', function () { if (document.querySelector('.detail.open')) openFullscreen(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay || e.target === fImg) closeFullscreen(); });
    if (close) close.addEventListener('click', function (e) { e.stopPropagation(); closeFullscreen(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeFullscreen();
      if ((e.key === 'f' || e.key === 'F') && document.querySelector('.detail.open')) {
        e.preventDefault();
        if (overlay.classList.contains('open')) closeFullscreen(); else openFullscreen();
      }
    });
  }

  /* ---- Back to Top ---- */
  function initBackToTop() {
    var btn = document.getElementById('backToTop');
    var works = document.getElementById('works');
    if (!btn || !works) return;

    var worksTop = 0;
    gsap.ticker.add(function () {
      worksTop = works.offsetTop + 200;
      btn.classList.toggle('visible', window.scrollY > worksTop);
    });

    btn.addEventListener('click', function () {
      if (reduced) {
        window.scrollTo(0, works.offsetTop);
        return;
      }
      gsap.to(window, { scrollTo: { y: works.offsetTop, autoKill: false }, duration: 1, ease: 'power3.inOut' });
    });
  }

  /* ---- Init ---- */
  document.addEventListener('DOMContentLoaded', function () {
    initMagnetic();
    initImages();
    initEmail();
    initLoupe();
    initFullscreen();
    initBackToTop();
  });

})();
