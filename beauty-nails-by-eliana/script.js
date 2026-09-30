/* Mantiene todo el diseño visible, sin ocultar secciones ni recortar contenido. */
(() => {
  'use strict';
  const page = document.getElementById('page');
  const viewport = document.getElementById('viewport');
  let pendingFrame;
  function fitPage() {
    const bounds = viewport.getBoundingClientRect();
    const styles = getComputedStyle(viewport);
    const width = bounds.width - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
    const height = bounds.height - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom);
    const mobile = width / height < 1.05;
    const designWidth = mobile ? 1080 : 1920;
    const designHeight = mobile ? 1920 : 1080;
    page.dataset.layout = mobile ? 'mobile' : 'desktop';
    page.style.setProperty('--page-scale', String(Math.min(width / designWidth, height / designHeight)));
  }
  function requestFit() {
    cancelAnimationFrame(pendingFrame);
    pendingFrame = requestAnimationFrame(fitPage);
  }
  window.addEventListener('resize', requestFit);
  window.visualViewport?.addEventListener('resize', requestFit);
  new ResizeObserver(requestFit).observe(viewport);
  fitPage();
})();
