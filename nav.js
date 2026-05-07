/**
 * tabemasen — site navigation
 * Mobile hamburger toggle: aria state, focus first item on open,
 * trap Tab inside the panel while open, close on outside click,
 * Esc, link click, or crossing into desktop breakpoint.
 */
(function () {
  var toggle = document.querySelector('.site-nav__toggle');
  var panel  = document.querySelector('.site-nav__panel');
  if (!toggle || !panel) return;

  var open = false;
  var mq = window.matchMedia('(min-width: 768px)');

  function focusables() {
    return Array.prototype.slice.call(
      panel.querySelectorAll('a[href]:not([aria-disabled="true"])')
    );
  }

  function setOpen(next) {
    open = next;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    panel.setAttribute('aria-hidden', String(!open));
    if (open) {
      var first = focusables()[0];
      if (first) first.focus();
    }
  }

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    setOpen(!open);
  });

  document.addEventListener('click', function (e) {
    if (!open) return;
    if (panel.contains(e.target) || toggle.contains(e.target)) return;
    setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (!open) return;
    if (e.key === 'Escape') {
      setOpen(false);
      toggle.focus();
      return;
    }
    if (e.key === 'Tab') {
      var items = focusables();
      if (!items.length) return;
      var first = items[0];
      var last  = items[items.length - 1];
      var active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        toggle.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        toggle.focus();
      }
    }
  });

  panel.addEventListener('click', function (e) {
    var link = e.target.closest('a');
    if (open && link && link.getAttribute('aria-disabled') !== 'true') {
      setOpen(false);
    }
  });

  mq.addEventListener('change', function (e) {
    if (e.matches && open) setOpen(false);
  });
})();
