/* ============================================================
   HELPERS.JS — Shared utilities for artwork data.
   Exposes: window.Helpers
   ============================================================ */
(function () {
  'use strict';

  function getLang() {
    return document.documentElement.lang || 'de';
  }

  function translate(key, fallbackDe, fallbackEn) {
    if (window.i18n && typeof window.i18n.t === 'function') return window.i18n.t(key);
    return getLang() === 'en' ? fallbackEn : fallbackDe;
  }

  function getTitle(item) {
    if (!item) return '';
    if (getLang() === 'en' && item.title_en) return item.title_en;
    return item.title_de || item.title_en || '';
  }

  function getTechnique(item) {
    if (!item) return '';
    if (getLang() === 'en' && item.technique_en) return item.technique_en;
    return item.technique_de || '';
  }

  function getCategory(item) {
    if (!item) return '';
    if (getLang() === 'en' && item.category_en) return item.category_en;
    return item.category_de || '';
  }

  function getDimensions(item) {
    if (!item) return '';
    if (item.dimensions) return item.dimensions;
    var match = item.file.match(/(\d{2,4})x(\d{2,4})/);
    if (match) return match[1] + ' \u00d7 ' + match[2] + ' cm';
    return '';
  }

  function getShortLabel(item) {
    var title = getTitle(item);
    var year = item.year ? item.year : '';
    if (title && year) return title + ', ' + year;
    return title || (year ? '' + year : '');
  }

  function resolvePath(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path) || /^\/\//.test(path) || path.charAt(0) === '/') return path;
    return path.replace(/^\/+/, '');
  }

  function isAvailable(item) {
    if (!item) return true;
    if (item.owner && item.owner !== '') return false;
    if (typeof item.available !== 'undefined') return item.available;
    return true;
  }

  var dataPromise = null;
  function fetchArtworkData(url) {
    if (!dataPromise) {
      dataPromise = fetch(url || 'bilder-metadaten.json').then(function (res) {
        if (!res.ok) throw new Error('Failed to load artwork data');
        return res.json();
      });
    }
    return dataPromise;
  }

  window.Helpers = {
    getLang: getLang,
    translate: translate,
    getTitle: getTitle,
    getTechnique: getTechnique,
    getCategory: getCategory,
    getDimensions: getDimensions,
    getShortLabel: getShortLabel,
    resolvePath: resolvePath,
    isAvailable: isAvailable,
    fetchArtworkData: fetchArtworkData
  };
})();
