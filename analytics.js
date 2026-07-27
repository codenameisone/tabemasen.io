/**
 * tabemasen — GoatCounter event tracking
 * ======================================
 * Exposes window.tabemasenTrack(name) and auto-tracks clicks on any element
 * carrying a data-gc-event attribute.
 *
 * Two things drive the design here:
 *
 * 1. GoatCounter stores an event's *name* in the path column — the page it
 *    fired from is NOT recorded. Every name has to carry its own context:
 *    `cta-vegan-hero`, never a bare `cta-click`.
 *
 * 2. Never pass card content into an event name. Allergens, the name field
 *    and the custom text are health data. GoatCounter's default path is
 *    pathname + search, which excludes the hash, so card state stays out of
 *    analytics on its own — keep it that way. Names are hardcoded strings or
 *    values validated against a known list; nothing is read from user input.
 */
(function () {
  'use strict';

  // count.js is loaded async and is blocked outright for a fair share of
  // visitors, so window.goatcounter may not exist when we're called — the
  // arrival events in app.js fire at DOMContentLoaded and routinely lose that
  // race. Hold events briefly and flush once the script lands.
  var pending = [];
  var timer   = null;
  var tries   = 0;

  function ready() {
    return !!(window.goatcounter && typeof window.goatcounter.count === 'function');
  }

  function send(name) {
    window.goatcounter.count({ path: name, title: name, event: true });
  }

  function flush() {
    while (pending.length && ready()) send(pending.shift());
    if (!pending.length && timer) { clearInterval(timer); timer = null; }
  }

  function track(name) {
    if (!name) return;
    if (ready()) { send(name); return; }
    if (pending.length >= 20) return;   // blocked or broken — stop accumulating
    pending.push(name);
    if (timer) return;
    timer = setInterval(function () {
      // ~4s of grace, then drop. Better to lose an event than poll forever
      // against an ad blocker that will never let count.js through.
      if (++tries > 40) { clearInterval(timer); timer = null; pending.length = 0; return; }
      flush();
    }, 100);
  }

  window.tabemasenTrack = track;

  // Delegated so new CTAs only need the attribute, no wiring.
  document.addEventListener('click', function (e) {
    if (!e.target || !e.target.closest) return;
    var el = e.target.closest('[data-gc-event]');
    if (el) track(el.getAttribute('data-gc-event'));
  });
})();
