(() => {
  'use strict';
  const scene = document.querySelector('.intro-scene');
  const button = document.querySelector('.hero-motion-toggle');
  if (!scene || !button) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false;
  let visible = true;
  function update() {
    scene.classList.toggle('light-stopped', paused || reduced.matches || !visible || document.hidden);
    button.hidden = reduced.matches;
    button.setAttribute('aria-pressed', String(paused));
    button.setAttribute('aria-label', paused ? 'Reanudar luz del fondo' : 'Pausar luz del fondo');
    button.title = paused ? 'Reanudar luz' : 'Pausar luz';
    button.textContent = paused ? '▷' : 'Ⅱ';
  }
  button.addEventListener('click', () => { paused = !paused; update(); });
  document.addEventListener('visibilitychange', update);
  reduced.addEventListener('change', update);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(scene);
  }
  update();
})();
