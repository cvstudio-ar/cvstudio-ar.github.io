(() => {
  'use strict';
  const canvas = document.querySelector('.hero-fireworks');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const hero = canvas.closest('.hero');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0, zones = [], frame = 0, last = 0, visible = true;
  const start = performance.now();
  const colors = ['#9ddfff', '#f0faff', '#d9caa5'];
  const seed = n => { const v = Math.sin(n * 79.7 + 4.2) * 12345.67; return v - Math.floor(v); };
  function resize() {
    const box = canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    width = box.width; height = box.height;
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    zones = [...hero.querySelectorAll('.hero-copy, .drone-message')].map(el => {
      const r = el.getBoundingClientRect();
      return { x: r.left - box.left - 12, y: r.top - box.top - 12, right: r.right - box.left + 12, bottom: r.bottom - box.top + 12 };
    });
  }
  const clearZone = (x, y) => !zones.some(z => x > z.x && x < z.right && y > z.y && y < z.bottom);
  function dot(x, y, radius, color, alpha) {
    ctx.globalAlpha = clearZone(x, y) ? alpha : alpha * .18; ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  }
  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    if (reduced.matches || !width || !height) return;
    const interval = 2200, current = Math.floor(time / interval);
    for (let index = Math.max(0, current - 1); index <= current; index++) {
      const age = time - index * interval;
      if (age > 3400) continue;
      const cx = width * (.12 + seed(index + 2) * .76);
      const cy = height * (.035 + seed(index + 45) * .065);
      const radius = Math.min(width < 600 ? 34 : 58, width * .09);
      const color = colors[index % colors.length];
      if (age < 800) {
        const progress = age / 800, y = height * .38 + (cy - height * .38) * progress;
        for (let tail = 0; tail < 8; tail++) dot(cx, y + tail * 3, 1, color, .65 * (1 - tail / 8));
      } else {
        const t = (age - 800) / 2600, spread = radius * (1 - Math.pow(1 - t, 3));
        const alpha = Math.pow(1 - t, 1.6) * .75;
        for (let i = 0; i < 60; i++) {
          const angle = i * Math.PI * 2 / 60, length = spread * (.65 + seed(i + index * 61) * .35);
          const x = cx + Math.cos(angle) * length, y = cy + Math.sin(angle) * length + 22 * t * t;
          dot(x, y, 1.05, color, alpha);
          dot(cx + Math.cos(angle) * length * .88, cy + Math.sin(angle) * length * .88 + 22 * t * t, .65, color, alpha * .4);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
  function tick(time) {
    frame = requestAnimationFrame(tick);
    if (!visible || document.hidden || time - last < 33) return;
    last = time; draw(time - start);
  }
  resize();
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }).observe(hero);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(resize);
  reduced.addEventListener('change', () => { ctx.clearRect(0, 0, width, height); });
  frame = requestAnimationFrame(tick);
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame));
  window.addEventListener('pageshow', e => { if (e.persisted) frame = requestAnimationFrame(tick); });
})();
