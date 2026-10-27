/* ==========================================================================
   Yuxuan Lin — academic homepage
   Progressive enhancement only: every part of the page reads fine without JS.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------------------------------------------------------------- theme */
  var toggle = document.querySelector('[data-theme-toggle]');

  function paintToggle() {
    if (!toggle) return;
    var dark = root.dataset.theme === 'dark';
    toggle.setAttribute('aria-pressed', String(dark));
    toggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#14161a' : '#fdfcf9');
  }

  if (toggle) {
    paintToggle();
    toggle.addEventListener('click', function () {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
      paintToggle();
    });
  }

  /* ------------------------------------------------------- section spy */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));

  // Watch every section that either navigation lists (deduplicated, document order).
  var sections = [];
  navLinks.concat(tocLinks).forEach(function (a) {
    var el = document.querySelector(a.getAttribute('href'));
    if (el && sections.indexOf(el) === -1) sections.push(el);
  });

  function markActive(id) {
    navLinks.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
    });
    tocLinks.forEach(function (a) {
      a.classList.toggle('is-current', a.getAttribute('href') === '#' + id);
    });
  }

  if (sections.length) {
    var pending = false;

    function updateActive() {
      pending = false;
      var line = (parseInt(getComputedStyle(root).getPropertyValue('--topbar-h'), 10) || 62) + 28;
      var current = null;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].getBoundingClientRect().top - line <= 0) current = sections[i];
      }
      if (window.scrollY < 80) current = null;
      markActive(current ? current.id : '');
    }

    function onScroll() {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(updateActive);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateActive();
  }

  /* -------------------------------------------------- publication filter */
  var filterBar = document.querySelector('.filters');
  var pubs = Array.prototype.slice.call(document.querySelectorAll('.pub'));
  var groups = Array.prototype.slice.call(document.querySelectorAll('[data-year-group]'));
  var counter = document.querySelector('.pub-count');
  var empty = document.querySelector('.pub-empty');

  function applyFilter(type) {
    var shown = 0;
    pubs.forEach(function (pub) {
      var match = type === 'all' || pub.dataset.type === type;
      pub.hidden = !match;
      if (match) shown++;
    });

    groups.forEach(function (group) {
      var visible = group.querySelectorAll('.pub:not([hidden])').length;
      group.classList.toggle('is-empty', visible === 0);
    });

    if (counter) counter.textContent = shown + (shown === 1 ? ' item' : ' items');
    if (empty) empty.hidden = shown !== 0;
  }

  if (filterBar) {
    filterBar.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-filter]');
      if (!button) return;
      filterBar.querySelectorAll('button[data-filter]').forEach(function (b) {
        var active = b === button;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      applyFilter(button.dataset.filter);
    });
    applyFilter('all');
  }

  /* ------------------------------------------------------ BibTeX export */
  var toast = document.querySelector('.toast');
  var toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    requestAnimationFrame(function () { toast.classList.add('is-visible'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
      setTimeout(function () { toast.hidden = true; }, 220);
    }, 1900);
  }

  function legacyCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(
        function () { return true; },
        function () { return legacyCopy(text); }
      );
    }
    return Promise.resolve(legacyCopy(text));
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('.bib[data-bibtex]');
    if (!button) return;

    copyText(button.dataset.bibtex).then(function (ok) {
      showToast(ok ? 'BibTeX copied to clipboard' : 'Copy failed — select the text manually');
      if (!ok) return;
      button.classList.add('is-copied');
      var label = button.textContent;
      button.textContent = 'Copied';
      setTimeout(function () {
        button.classList.remove('is-copied');
        button.textContent = label;
      }, 1600);
    });
  });

  /* -------------------------------------------------------- footer year */
  document.querySelectorAll('[data-year]').forEach(function (node) {
    node.textContent = new Date().getFullYear();
  });
})();
