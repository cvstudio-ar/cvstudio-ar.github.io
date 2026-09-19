(() => {
  'use strict';
  const isMobile = () => matchMedia('(max-width: 900px)').matches;
  const hasVisibleOverlay = () => Boolean(document.querySelector(
    '.portfolio-premium-modal.is-open, .siac-modal.is-open, [aria-modal="true"]:not([aria-hidden="true"]):not([hidden])'
  ));
  const restoreScroll = () => {
    if (!isMobile() || hasVisibleOverlay()) return;
    document.documentElement.style.removeProperty('overflow');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('position');
    document.body.style.removeProperty('height');
    document.body.style.removeProperty('top');
    if (!document.querySelector('.mobile-menu.is-open, .nav-menu.is-open')) document.body.classList.remove('menu-open');
  };
  addEventListener('pageshow', restoreScroll, { passive: true });
  addEventListener('orientationchange', () => setTimeout(restoreScroll, 180), { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) restoreScroll(); }, { passive: true });
  document.addEventListener('touchend', () => setTimeout(restoreScroll, 0), { passive: true });
})();
