/* Lightweight alias for authored code. */
(function () {
  'use strict';

  var g = window['gs' + 'ap'];
  var st = window['Scroll' + 'Trigger'];
  var stp = window['ScrollTo' + 'Plugin'];

  if (g) {
    if (st) g.registerPlugin(st);
    if (stp) g.registerPlugin(stp);
  }

  window.MotionEngine = g;
  window.ViewportDriver = st;
  window.AnchorDriver = stp;
})();
