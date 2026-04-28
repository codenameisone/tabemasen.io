/**
 * tabemasen — App Logic
 * =====================
 * - Selection state management
 * - Live card preview rendering
 * - URL hash sync (read on load, write on change)
 * - localStorage persistence
 * - Copy link, Download PNG, Print
 */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────
  var state = {
    allergens: [],
    pattern:   null,
    severity:  'allergy',  // 'allergy' | 'severe'
    name:      '',
    customText:'',
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DOM refs (cached AFTER chips/patterns are built)
  // ─────────────────────────────────────────────────────────────────────────
  var els = {};

  function cacheEls() {
    els.allergenChips   = document.querySelectorAll('.chip[data-key]');
    els.patternBtns     = document.querySelectorAll('.pattern-btn[data-key]');
    els.severityToggle  = document.getElementById('severity-toggle');
    els.nameInput       = document.getElementById('name-input');
    els.customInput     = document.getElementById('custom-input');
    els.clearBtn        = document.getElementById('clear-btn');
    els.card            = document.getElementById('card');
    els.copyBtn         = document.getElementById('copy-btn');
    els.downloadBtn     = document.getElementById('download-btn');
    els.printBtn        = document.getElementById('print-btn');
    els.copyBtnText     = els.copyBtn.querySelector('.btn-text');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Build allergen chips (called once on init)
  // ─────────────────────────────────────────────────────────────────────────
  function buildAllergenChips() {
    var grid = document.querySelector('.chip-grid');
    if (!grid) return;

    CARD_DATA.allergens.forEach(function (allergen, index) {
      var chip = document.createElement('button');
      chip.type = 'button';
      // Mark Japan's 8 mandatory allergens (first 8) with a stronger border
      chip.className = 'chip' + (index < 8 ? ' chip--mandatory' : '');
      chip.dataset.key = allergen.key;
      chip.setAttribute('aria-pressed', 'false');
      chip.setAttribute('aria-label', allergen.english + ' (' + allergen.japanese + ')');
      chip.textContent = allergen.english;
      grid.appendChild(chip);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Build pattern buttons (called once on init)
  // ─────────────────────────────────────────────────────────────────────────
  function buildPatternButtons() {
    var list = document.querySelector('.pattern-list');
    if (!list) return;

    var noneBtn = document.createElement('button');
    noneBtn.type = 'button';
    noneBtn.className = 'pattern-btn pattern-btn--none';
    noneBtn.dataset.key = '';
    noneBtn.setAttribute('aria-pressed', 'true');
    noneBtn.textContent = CARD_DATA.ui.patternNone;
    list.appendChild(noneBtn);

    CARD_DATA.patterns.forEach(function (pattern) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pattern-btn';
      btn.dataset.key = pattern.key;
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', pattern.label_en);
      btn.textContent = pattern.label_en;
      list.appendChild(btn);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render the live card preview
  // ─────────────────────────────────────────────────────────────────────────
  function renderCard() {
    var cardEl = els.card;
    if (!cardEl) return;

    var lines = CARD_DATA.buildCard(state);

    var html = lines.map(function (line) {
      if (line.kind === 'blank') {
        return '<p class="card-line card-line--blank">&nbsp;</p>';
      }
      var escaped = line.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/\n/g, '<br>');
      return '<p class="card-line card-line--' + line.kind + '">' + escaped + '</p>';
    }).join('');

    cardEl.innerHTML = html;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Sync UI to state (called after any state change)
  // ─────────────────────────────────────────────────────────────────────────
  function syncUI() {
    els.allergenChips.forEach(function (chip) {
      var key = chip.dataset.key;
      var isSelected = state.allergens.indexOf(key) !== -1;
      chip.classList.toggle('chip--selected', isSelected);
      chip.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });

    els.patternBtns.forEach(function (btn) {
      var key = btn.dataset.key;
      var isSelected = (key === '' && state.pattern === null) ||
                       (key !== '' && key === state.pattern);
      btn.classList.toggle('pattern-btn--selected', isSelected);
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });

    if (els.severityToggle) els.severityToggle.checked = (state.severity === 'severe');

    if (els.nameInput)   els.nameInput.value   = state.name;
    if (els.customInput) els.customInput.value = state.customText;

    renderCard();
    updateHash();
    saveToStorage();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // URL hash
  // ─────────────────────────────────────────────────────────────────────────

  function encodeHash() {
    var parts = [];
    if (state.allergens.length > 0) parts.push('a=' + state.allergens.join(','));
    if (state.pattern)              parts.push('p=' + state.pattern);
    if (state.severity === 'severe') parts.push('s=severe');
    if (state.name)                 parts.push('n=' + encodeURIComponent(state.name));
    if (state.customText)           parts.push('c=' + encodeURIComponent(state.customText));
    // FIX: was joining with '&amp;' (HTML entity) which produced broken URLs.
    return parts.join('&');
  }

  function parseHash(hash) {
    var result = {
      allergens: [],
      pattern:   null,
      severity:  'allergy',
      name:      '',
      customText:'',
    };
    if (!hash || hash === '#') return result;

    var raw = hash.replace(/^#/, '');
    // Migration: handle any old &amp; entities still floating around in saved URLs.
    raw = raw.replace(/&amp;/g, '&');
    var pairs = raw.split('&');
    pairs.forEach(function (pair) {
      var idx = pair.indexOf('=');
      if (idx === -1) return;
      var key = pair.substring(0, idx);
      var val = decodeURIComponent(pair.substring(idx + 1));
      switch (key) {
        case 'a':
          if (val) result.allergens = val.split(',').filter(Boolean);
          break;
        case 'p':
          if (val) result.pattern = val;
          break;
        case 's':
          if (val === 'severe') result.severity = 'severe';
          break;
        case 'n':
          result.name = val;
          break;
        case 'c':
          result.customText = val;
          break;
      }
    });
    return result;
  }

  function updateHash() {
    var hash = encodeHash();
    history.replaceState(null, '', hash ? '#' + hash : window.location.pathname);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // localStorage
  // ─────────────────────────────────────────────────────────────────────────
  var STORAGE_KEY = 'tabemasenState_v1';

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        allergens: state.allergens,
        pattern:   state.pattern,
        severity:  state.severity,
        name:      state.name,
        customText:state.customText,
      }));
    } catch (e) { /* quota or private mode — fail silently */ }
  }

  function loadFromStorage() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // State mutation
  // ─────────────────────────────────────────────────────────────────────────

  function toggleAllergen(key) {
    var idx = state.allergens.indexOf(key);
    if (idx === -1) state.allergens.push(key);
    else state.allergens.splice(idx, 1);
  }

  function setPattern(key) { state.pattern = key === '' ? null : key; }
  function setSeverity(val) { state.severity = (val === 'severe') ? 'severe' : 'allergy'; }

  function clearState() {
    state.allergens = [];
    state.pattern   = null;
    state.severity  = 'allergy';
    state.name      = '';
    state.customText= '';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Event handlers
  // ─────────────────────────────────────────────────────────────────────────

  function onAllergenChipClick(e) {
    var chip = e.target.closest('.chip[data-key]');
    if (!chip) return;
    toggleAllergen(chip.dataset.key);
    syncUI();
  }

  function onPatternClick(e) {
    var btn = e.target.closest('.pattern-btn[data-key]');
    if (!btn) return;
    setPattern(btn.dataset.key);
    syncUI();
  }

  function onSeverityChange(e) {
    if (e.target.id !== 'severity-toggle') return;
    setSeverity(e.target.checked ? 'severe' : 'allergy');
    syncUI();
  }

  function onNameInput(e)   { state.name       = e.target.value; syncUI(); }
  function onCustomInput(e) { state.customText = e.target.value; syncUI(); }
  function onClearClick()   { clearState();                      syncUI(); }

  function onPanelToggle(e) {
    var btn = e.target.closest('.panel-toggle');
    if (!btn) return;
    var expanded = btn.getAttribute('aria-expanded') === 'true';
    var bodyId = btn.getAttribute('aria-controls');
    var body = document.getElementById(bodyId);
    btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    if (body) body.classList.toggle('hidden', expanded);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Copy link
  // ─────────────────────────────────────────────────────────────────────────
  var COPY_TIMEOUT = null;

  function onCopyClick() {
    var url = window.location.origin + window.location.pathname +
              (encodeHash() ? '#' + encodeHash() : '');

    var done = function () {
      els.copyBtnText.textContent = CARD_DATA.ui.btnCopied;
      els.copyBtn.classList.add('btn--success');
      if (COPY_TIMEOUT) clearTimeout(COPY_TIMEOUT);
      COPY_TIMEOUT = setTimeout(function () {
        els.copyBtnText.textContent = CARD_DATA.ui.btnCopyLink;
        els.copyBtn.classList.remove('btn--success');
        COPY_TIMEOUT = null;
      }, 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(function () {
        prompt('Copy this link:', url);
      });
    } else {
      prompt('Copy this link:', url);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Download PNG (lazy-aware of html2canvas)
  // ─────────────────────────────────────────────────────────────────────────
  function onDownloadClick() {
    var btn = els.downloadBtn;
    var btnText = btn.querySelector('.btn-text');
    var original = btnText.textContent;
    btn.disabled = true;
    btnText.textContent = 'Generating…';

    function doCapture() {
      if (typeof html2canvas === 'undefined') {
        setTimeout(doCapture, 100);
        return;
      }

      html2canvas(els.card, {
        scale: window.devicePixelRatio || 2,
        useCORS: true,
        backgroundColor: '#FBF8F1',
        logging: false,
      }).then(function (canvas) {
        btn.disabled = false;
        btnText.textContent = original;

        var link = document.createElement('a');
        var date = new Date().toISOString().substring(0, 10);
        link.download = 'tabemasen-' + date + '.png';
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }).catch(function (err) {
        btn.disabled = false;
        btnText.textContent = original;
        console.error('PNG export failed:', err);
        alert('Sorry, PNG download failed. Please try the screenshot button on your phone instead.');
      });
    }

    doCapture();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Print
  // ─────────────────────────────────────────────────────────────────────────
  function onPrintClick() { window.print(); }

  // ─────────────────────────────────────────────────────────────────────────
  // Init
  // ─────────────────────────────────────────────────────────────────────────
  function init() {
    // FIX: build chips & patterns BEFORE caching DOM refs.
    // querySelectorAll returns a static NodeList — caching before DOM
    // creation produced an empty list, so chips never updated visually.
    buildAllergenChips();
    buildPatternButtons();
    cacheEls();

    // Restore state — URL hash takes precedence, then localStorage
    var hasHash = window.location.hash && window.location.hash !== '#';
    if (hasHash) {
      var hashState = parseHash(window.location.hash);
      state.allergens = hashState.allergens;
      state.pattern   = hashState.pattern;
      state.severity  = hashState.severity;
      state.name      = hashState.name;
      state.customText= hashState.customText;
    } else {
      var stored = loadFromStorage();
      if (stored) {
        state.allergens = stored.allergens  || [];
        state.pattern   = stored.pattern    || null;
        state.severity  = stored.severity   || 'allergy';
        state.name      = stored.name       || '';
        state.customText= stored.customText || '';
      }
    }

    // Wire events (delegation where possible)
    document.querySelector('.chip-grid').addEventListener('click', onAllergenChipClick);
    document.querySelector('.pattern-list').addEventListener('click', onPatternClick);
    document.querySelector('.severity-options').addEventListener('change', onSeverityChange);

    if (els.nameInput)   els.nameInput.addEventListener('input', onNameInput);
    if (els.customInput) els.customInput.addEventListener('input', onCustomInput);

    els.clearBtn.addEventListener('click', onClearClick);
    els.copyBtn.addEventListener('click', onCopyClick);
    els.downloadBtn.addEventListener('click', onDownloadClick);
    els.printBtn.addEventListener('click', onPrintClick);

    document.querySelector('.selection-panel').addEventListener('click', onPanelToggle);

    syncUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());