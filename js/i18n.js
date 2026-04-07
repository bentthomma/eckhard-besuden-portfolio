/* ============================================================
   i18n.js — Internationalization (DE / EN) for Eckhard Besuden
   Self-contained IIFE. Exposes window.i18n
   ============================================================ */
(function () {
  'use strict';

  /* ----------------------------------------------------------
     1. Translations
     ---------------------------------------------------------- */
  var translations = {
    de: {
      // Navigation
      nav_about: 'Über mich',
      nav_philosophy: 'Philosophie',
      nav_works: 'Werke',
      lang_de: 'DE',
      lang_en: 'EN',

      // Marquee
      marquee_text: 'KEINE REGELN\u2003\u2014\u2003KEINE TRICKS\u2003\u2014\u2003KEINE GESCHICHTE\u2003\u2014\u2003KEINE REGELN\u2003\u2014\u2003KEINE TRICKS\u2003\u2014\u2003KEINE GESCHICHTE\u2003\u2014\u2003',

      // Hero
      hero_name: 'E c k h a r d  B e s u d e n',
      hero_subtitle: 'Maler',
      hero_scroll: 'Scrollen',

      // About (Section 01)
      about_number: '01',
      about_title: 'Über mich',
      about_text_1:
        'Ich bin nur Autodidakt und deshalb wohl langsamer in meinen Bemühungen. Meine Ideen Künstler zu werden begannen, als ich Bilder von Peter Kuckei in Emden sah, sie endeten, als ich mich für die Hochschule der Künste in Berlin bewarb. Die HDK \u2014 aus meiner Sicht damals \u201Edie einzig wahre\u201C Hochschule der Künste \u2014 schickte mir meine Mappe mit einer Ablehnung zurück.',
      about_text_2:
        'Ich war damals offenkundig noch zu jung und nicht bescheiden genug, um eine Bewerbung einzureichen, die dem Anspruch Kunst zu sein, gerecht würde. Aus heutiger Sicht hatte die HDK Recht, ich bevorzugte mit meiner Eingabe die Sprezzatura und gab vor, künstlerisch tätig zu sein, mit dem Gegenteil von Mühe. Das wurde erkannt. Ich wurde verworfen. Wenige Dinge in meinem Leben waren mir peinlicher, ich habe mich nie wieder einer \u201Eoffiziellen\u201C Auswahl in Sachen Kunst gestellt. Für den Rest meines Lebens strenge ich mich mehr an.',
      about_text_3:
        'So wurde ich nur Maler und kein Künstler, aber malen muss ich eben.',
      about_born: 'geb. 27.01.1964, Allensbach am Bodensee',

      // Philosophy (Section 02)
      philosophy_number: '02',
      philosophy_quote:
        'Keine Regeln, keine Tricks, keine Geschichte, wir machen den Kopf frei',
      philosophy_title: 'Antideterminismus',
      philosophy_text_1:
        'Antideterminismus soll dazu führen, dass sich der Betrachter nur auf die reine Kraft der Malerei konzentrieren kann und muss. Wir befreien den Malakt von 150 Jahre alten Qualitätsmerkmalen.',
      philosophy_text_2:
        'Wir malen nicht neu, wir malen nicht authentisch, wir malen nicht antidekorativ. Unsere Vita ist autodidakter Dilettantismus. Wir malen mit totaler Beliebigkeit der Sujets und der Malweise. Lediglich um das Merkmal perfekte Technik kommt niemand herum.',
      philosophy_text_3:
        'Das Wichtige an der Arbeit ist nur noch das Bild. Jedes Bild erzählt eine Geschichte.',

      // Works (Section 03)
      works_number: '03',
      works_title: 'Werke',
      filter_all: 'Alle',
      filter_abstract: 'Abstrakt',
      filter_flowers: 'Blumen',
      filter_women: 'Frauen',
      filter_seascapes: 'Seebilder',
      filter_misc: 'Sonstige',
      filter_animals: 'Tiere',
      works_count: '{count} Werke',
      works_loaded: 'Alle Werke geladen',
      works_loading: 'Laden...',

      // Detail
      detail_fullscreen: 'Vollbild',

      // Lightbox (reserved — not yet used in live UI)
      lightbox_close: 'Schließen',
      lightbox_prev: 'Vorheriges Bild',
      lightbox_next: 'Nächstes Bild',
      lightbox_of: 'von',
      lightbox_oil: 'Öl auf Leinwand',
      lightbox_acrylic: 'Acryl auf Leinwand',
      lightbox_pastel: 'Ölpastell',
      lightbox_pencil: 'Buntstift auf Papier',
      lightbox_watercolor: 'Aquarell',
      lightbox_charcoal: 'Kohle auf Papier',
      lightbox_graphite: 'Grafitstift',
      lightbox_mixed: 'Mischtechnik',

      // Contact (reserved — not yet built as separate section)
      contact_number: '04',
      contact_title: 'Kontakt',
      contact_address:
        'Kapplerbergstr. 14, D-78476 Allensbach, Deutschland',
      contact_phone_label: 'Telefon',
      contact_email_label: 'E-Mail',

      // Footer
      footer_copyright: '\u00A9 2006 \u2013 2026 Eckhard Besuden',
      footer_privacy: 'Datenschutz',
      footer_imprint: 'Impressum',

      // Cookie Banner (reserved — not yet implemented)
      cookie_text:
        'Diese Website verwendet Cookies für grundlegende Funktionen.',
      cookie_accept: 'Akzeptieren',
      cookie_decline: 'Ablehnen',
      cookie_more: 'Mehr erfahren',

      // Accessibility / Screen Reader
      a11y_skip: 'Zum Inhalt springen',
      a11y_menu_open: 'Menü öffnen',
      a11y_menu_close: 'Menü schließen',
      a11y_gallery: 'Bildergalerie',
      a11y_filter: 'Bildkategorien',
      a11y_close: 'Schließen',
      a11y_prev: 'Vorheriges Bild',
      a11y_next: 'Nächstes Bild',
      a11y_fullscreen: 'Vollbild',
      a11y_back_to_works: 'Zum Anfang der Werke',
      a11y_detail: 'Werkdetails',

      // Privacy page
      privacy_title: 'Datenschutzerklärung',
      privacy_back: 'Zurück zur Startseite',

      // Search & Works display
      search_placeholder: 'Werk suchen...',
      works_showing: '{showing} von {total}',
      works_show_more: 'Mehr Werke anzeigen',

      // Detail panel
      detail_year: 'Jahr',
      detail_technique: 'Technik',
      detail_dimensions: 'Maße',
      detail_category: 'Kategorie',
      detail_owner: 'Gehört',
      detail_private: 'Privatbesitz',
      detail_available: 'Verfügbar',

      // Bid form
      bid_title: 'Kontakt aufnehmen',
      bid_work: 'Werk',
      bid_name: 'Name',
      bid_email: 'E-Mail',
      bid_phone: 'Telefon',
      bid_amount: 'Ihr Gebot (EUR)',
      bid_message: 'Nachricht',
      bid_submit: 'Absenden',
      bid_success: 'Vielen Dank. Ihre Anfrage wurde entgegengenommen.',
      bid_error_required: 'Bitte f\u00fcllen Sie alle Pflichtfelder aus.',
      bid_btn: 'Kontakt aufnehmen',

      // Carousel
      carousel_pause: 'Pause',
      carousel_play: 'Abspielen',
      home_featured_error: 'Vorschau konnte nicht geladen werden.',
      home_all_works: 'Zu allen Werken',
      a11y_featured_carousel: 'Ausgew\u00e4hlte Werke',

      // Gallery lazy-load
      gallery_show_all: 'Alle Werke anzeigen',
      gallery_count_available: '{count} Werke verf\u00fcgbar',

      // Bid extensions
      bid_back: 'Zur\u00fcck'
    },

    en: {
      // Navigation
      nav_about: 'About',
      nav_philosophy: 'Philosophy',
      nav_works: 'Works',
      lang_de: 'DE',
      lang_en: 'EN',

      // Marquee
      marquee_text: 'NO RULES\u2003\u2014\u2003NO TRICKS\u2003\u2014\u2003NO NARRATIVE\u2003\u2014\u2003NO RULES\u2003\u2014\u2003NO TRICKS\u2003\u2014\u2003NO NARRATIVE\u2003\u2014\u2003',

      // Hero
      hero_name: 'E c k h a r d  B e s u d e n',
      hero_subtitle: 'Painter',
      hero_scroll: 'Scroll',

      // About (Section 01)
      about_number: '01',
      about_title: 'About',
      about_text_1:
        'I am merely self-taught and therefore probably slower in my endeavors. My ideas of becoming an artist began when I saw paintings by Peter Kuckei in Emden; they ended when I applied to the Hochschule der K\u00FCnste in Berlin. The HDK \u2014 in my view at the time \u201Cthe only true\u201D academy of arts \u2014 sent my portfolio back with a rejection.',
      about_text_2:
        'I was evidently still too young and not humble enough to submit an application that would do justice to the claim of being art. In hindsight, the HDK was right \u2014 I favored sprezzatura in my submission and pretended to be artistically active with the opposite of effort. This was recognized. I was rejected. Few things in my life have embarrassed me more; I have never again submitted to an \u201Cofficial\u201D selection in matters of art. For the rest of my life, I will try harder.',
      about_text_3:
        'Thus I became merely a painter, not an artist \u2014 but paint I must.',
      about_born: 'born January 27, 1964, Allensbach am Bodensee',

      // Philosophy (Section 02)
      philosophy_number: '02',
      philosophy_quote:
        'No rules, no tricks, no narrative \u2014 we clear the mind',
      philosophy_title: 'Antideterminism',
      philosophy_text_1:
        'Antideterminism aims to allow the viewer to focus solely on the pure force of painting. We liberate the act of painting from 150-year-old quality criteria.',
      philosophy_text_2:
        'We do not paint anything new, we do not paint authentically, we do not paint anti-decoratively. Our vita is autodidactic dilettantism. We paint with total arbitrariness of subject and style. Only the criterion of perfect technique remains inescapable.',
      philosophy_text_3:
        'The only thing that matters in the work is the painting itself. Every painting tells a story.',

      // Works (Section 03)
      works_number: '03',
      works_title: 'Works',
      filter_all: 'All',
      filter_abstract: 'Abstract',
      filter_flowers: 'Flowers',
      filter_women: 'Women',
      filter_seascapes: 'Seascapes',
      filter_misc: 'Miscellaneous',
      filter_animals: 'Animals',
      works_count: '{count} Works',
      works_loaded: 'All works loaded',
      works_loading: 'Loading...',

      // Detail
      detail_fullscreen: 'Fullscreen',

      // Lightbox
      lightbox_close: 'Close',
      lightbox_prev: 'Previous image',
      lightbox_next: 'Next image',
      lightbox_of: 'of',
      lightbox_oil: 'Oil on canvas',
      lightbox_acrylic: 'Acrylic on canvas',
      lightbox_pastel: 'Oil pastel',
      lightbox_pencil: 'Colored pencil on paper',
      lightbox_watercolor: 'Watercolor',
      lightbox_charcoal: 'Charcoal on paper',
      lightbox_graphite: 'Graphite pencil',
      lightbox_mixed: 'Mixed media',

      // Contact (reserved — not yet built as separate section)
      contact_number: '04',
      contact_title: 'Contact',
      contact_address:
        'Kapplerbergstr. 14, D-78476 Allensbach, Germany',
      contact_phone_label: 'Phone',
      contact_email_label: 'Email',

      // Footer
      footer_copyright: '\u00A9 2006 \u2013 2026 Eckhard Besuden',
      footer_privacy: 'Privacy Policy',
      footer_imprint: 'Legal Notice',

      // Cookie Banner (reserved — not yet implemented)
      cookie_text:
        'This website uses cookies for basic functionality.',
      cookie_accept: 'Accept',
      cookie_decline: 'Decline',
      cookie_more: 'Learn more',

      // Accessibility / Screen Reader
      a11y_skip: 'Skip to content',
      a11y_menu_open: 'Open menu',
      a11y_menu_close: 'Close menu',
      a11y_gallery: 'Image gallery',
      a11y_filter: 'Image categories',
      a11y_close: 'Close',
      a11y_prev: 'Previous image',
      a11y_next: 'Next image',
      a11y_fullscreen: 'Fullscreen',
      a11y_back_to_works: 'Back to top of works',
      a11y_detail: 'Work details',

      // Privacy page
      privacy_title: 'Privacy Policy',
      privacy_back: 'Back to homepage',

      // Search & Works display
      search_placeholder: 'Search works...',
      works_showing: '{showing} of {total}',
      works_show_more: 'Show more works',

      // Detail panel
      detail_year: 'Year',
      detail_technique: 'Technique',
      detail_dimensions: 'Dimensions',
      detail_category: 'Category',
      detail_owner: 'Owned by',
      detail_private: 'Private collection',
      detail_available: 'Available',

      // Bid form
      bid_title: 'Get in Touch',
      bid_work: 'Work',
      bid_name: 'Name',
      bid_email: 'Email',
      bid_phone: 'Phone',
      bid_amount: 'Your bid (EUR)',
      bid_message: 'Message',
      bid_submit: 'Submit',
      bid_success: 'Thank you. Your inquiry has been received.',
      bid_error_required: 'Please fill in all required fields.',
      bid_btn: 'Get in Touch',

      // Carousel
      carousel_pause: 'Pause',
      carousel_play: 'Play',
      home_featured_error: 'Preview could not be loaded.',
      home_all_works: 'View all works',
      a11y_featured_carousel: 'Selected works',

      // Gallery lazy-load
      gallery_show_all: 'Show all works',
      gallery_count_available: '{count} works available',

      // Bid extensions
      bid_back: 'Back'
    }
  };

  /* ----------------------------------------------------------
     2. State
     ---------------------------------------------------------- */
  var currentLang = 'de';

  /* ----------------------------------------------------------
     3. Language detection
     ---------------------------------------------------------- */
  function detectLanguage() {
    // 1. Check localStorage
    var stored = null;
    try {
      stored = localStorage.getItem('lang');
    } catch (e) {
      /* storage unavailable */
    }
    if (stored === 'de' || stored === 'en') return stored;

    // 2. Check navigator.language
    if (typeof navigator !== 'undefined' && navigator.language) {
      if (navigator.language.toLowerCase().indexOf('de') === 0) return 'de';
      return 'en';
    }

    // 3. Default
    return 'de';
  }

  /* ----------------------------------------------------------
     4. Apply translations — setLanguage(lang)
     ---------------------------------------------------------- */
  function setLanguage(lang) {
    if (lang !== 'de' && lang !== 'en') lang = 'de';
    currentLang = lang;

    // Translate all elements with data-i18n
    var elements = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < elements.length; i++) {
      var key = elements[i].getAttribute('data-i18n');
      if (translations[lang][key] !== undefined) {
        elements[i].textContent = translations[lang][key];
      }
    }

    // Translate all elements with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (translations[lang][key]) el.placeholder = translations[lang][key];
    });

    // Translate all elements with data-i18n-aria (aria-label)
    document.querySelectorAll('[data-i18n-aria]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-aria');
      if (translations[lang][key]) el.setAttribute('aria-label', translations[lang][key]);
    });

    // Update <html lang="…"> and head meta
    document.documentElement.lang = lang;
    document.title = lang === 'en' ? 'Eckhard Besuden — Painter' : 'Eckhard Besuden — Maler';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = lang === 'en'
      ? 'Eckhard Besuden is a self-taught painter from Allensbach, Germany — abstract and figurative.'
      : 'Eckhard Besuden bezeichnet sich nicht als Künstler, da Autodidakt, aber als Maler, weil er einfach malen muss — abstrakt wie konkret.';
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = document.title;
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = lang === 'en' ? 'Abstract and figurative painting. Antideterminism.' : 'Abstrakte und konkrete Malerei. Antideterminismus.';

    // Persist choice
    try {
      localStorage.setItem('lang', lang);
    } catch (e) {
      /* storage unavailable */
    }

    // Toggle .active on language buttons
    var langBtns = document.querySelectorAll('.nav__lang-btn');
    for (var j = 0; j < langBtns.length; j++) {
      if (langBtns[j].getAttribute('data-lang') === lang) {
        langBtns[j].classList.add('active');
        langBtns[j].setAttribute('aria-pressed', 'true');
      } else {
        langBtns[j].classList.remove('active');
        langBtns[j].setAttribute('aria-pressed', 'false');
      }
    }

    // Dispatch custom event
    document.dispatchEvent(
      new CustomEvent('langchange', { detail: { lang: lang } })
    );
  }

  /* ----------------------------------------------------------
     5. Translation helper — t(key)
     ---------------------------------------------------------- */
  function t(key) {
    var dict = translations[currentLang];
    if (dict && dict[key] !== undefined) return dict[key];
    // Fallback to German
    if (translations.de[key] !== undefined) return translations.de[key];
    return key;
  }

  /* ----------------------------------------------------------
     6. Get current language
     ---------------------------------------------------------- */
  function getCurrentLang() {
    return currentLang;
  }

  /* ----------------------------------------------------------
     7. Bind language-switch buttons
     ---------------------------------------------------------- */
  function bindButtons() {
    var buttons = document.querySelectorAll('[data-lang]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function () {
        setLanguage(this.getAttribute('data-lang'));
      });
    }
  }

  /* ----------------------------------------------------------
     8. Init on DOMContentLoaded
     ---------------------------------------------------------- */
  function init() {
    currentLang = detectLanguage();
    bindButtons();
    setLanguage(currentLang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ----------------------------------------------------------
     9. Expose public API
     ---------------------------------------------------------- */
  window.i18n = {
    setLanguage: setLanguage,
    getCurrentLang: getCurrentLang,
    t: t
  };
})();
