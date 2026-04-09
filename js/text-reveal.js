/* ============================================================
   TEXT-REVEAL.JS — Character-by-character text reveal system.
   Pure functions: no shared state, no side effects.
   Depends on: GSAP
   Exposes: window.TextReveal
   ============================================================ */
(function () {
  'use strict';

  if (typeof gsap === 'undefined') {
    window.TextReveal = { wrapChars: function () { return []; }, buildTimeline: function () { return null; } };
    return;
  }

  var STAGGER_GAP = 0.004;
  var BLOCK_OVERLAP = '>-0.06';

  function wrapChars(el) {
    var text = el.textContent;
    var words = text.split(/(\s+)/);
    el.innerHTML = '';
    var inners = [];

    words.forEach(function (segment) {
      if (/^\s+$/.test(segment)) {
        el.appendChild(document.createTextNode(segment));
        return;
      }
      var wordWrap = document.createElement('span');
      wordWrap.className = 'word-wrap';
      for (var i = 0; i < segment.length; i++) {
        var wrap = document.createElement('span');
        wrap.className = 'char-wrap';
        var inner = document.createElement('span');
        inner.className = 'char-inner';
        inner.textContent = segment[i];
        wrap.appendChild(inner);
        wordWrap.appendChild(wrap);
        inners.push(inner);
      }
      el.appendChild(wordWrap);
    });

    return inners;
  }

  function buildTimeline(sectionEl) {
    var items = sectionEl.querySelectorAll('.text-reveal');
    if (!items.length) return null;

    var tl = gsap.timeline({ paused: true });

    items.forEach(function (item, idx) {
      var spans = wrapChars(item);
      gsap.set(spans, { opacity: 0.1, y: 8 });
      tl.to(spans, {
        opacity: 1, y: 0,
        stagger: STAGGER_GAP,
        duration: 0.4,
        ease: 'power2.out'
      }, idx === 0 ? 0 : BLOCK_OVERLAP);
    });

    return tl;
  }

  window.TextReveal = {
    wrapChars: wrapChars,
    buildTimeline: buildTimeline,
    STAGGER_GAP: STAGGER_GAP
  };
})();
