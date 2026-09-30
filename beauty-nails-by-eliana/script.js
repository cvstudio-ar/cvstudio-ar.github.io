/* Adapta la altura a la pantalla visible, incluidas las barras del navegador móvil. */
(() => {
  'use strict';
  let pending;
  function updateViewport() {
    const visual = window.visualViewport;
    // Conserva el zoom elegido por el visitante.
    if (visual && Math.abs(visual.scale - 1) > .01) return;
    const height = visual ? visual.height : window.innerHeight;
    document.documentElement.style.setProperty('--viewport-height', `${height}px`);
  }
  function scheduleUpdate() {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(updateViewport);
  }
  window.addEventListener('resize', scheduleUpdate);
  window.visualViewport?.addEventListener('resize', scheduleUpdate);
  window.addEventListener('pageshow', scheduleUpdate);
  updateViewport();
})();
