(() => {
  'use strict';
  const host = document.querySelector('.drone-message');
  if (!host) return;
  const canvas = host.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const messages = [['Gracias por todo,', 'Capi'], ['Por siempre', 'Messi'], ['Te queremos']];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sample = document.createElement('canvas');
  sample.width = 360; sample.height = 160;
  const painter = sample.getContext('2d', { willReadFrequently: true });
  let startedAt = 0;
  let formations = [], width = 360, height = 160, frame = 0, visible = true, last = 0;
  const ease = t => t * t * (3 - 2 * t);
  const seed = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  function build() {
    formations = messages.map(lines => {
      painter.clearRect(0, 0, 360, 160);
      painter.font = '700 36px Poppins, sans-serif';
      painter.textAlign = 'center'; painter.textBaseline = 'middle'; painter.fillStyle = '#fff';
      lines.forEach((line, i) => painter.fillText(line, 180, lines.length === 1 ? 80 : 57 + i * 47, 330));
      const pixels = painter.getImageData(0, 0, 360, 160).data, points = [];
      for (let y = 10; y < 150; y += 3) for (let x = 10; x < 350; x += 3) {
        if (pixels[(y * 360 + x) * 4 + 3] > 100) points.push({ x, y });
      }
      return points;
    });
    resize();
  }
  function resize() {
    const box = host.getBoundingClientRect(), ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = box.width; height = box.height;
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(0);
  }
  function draw(time) {
    if (!formations.length || !width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const duration = 9800, cycle = reduced.matches ? 0 : Math.floor(time / duration) % messages.length;
    const phase = reduced.matches ? 0 : time % duration;
    const points = formations[cycle], next = formations[(cycle + 1) % messages.length];
    const count = phase > 8200 ? Math.max(points.length, next.length) : points.length;
    const scale = Math.min(width / 360, height / 160), ox = (width - 360 * scale) / 2, oy = (height - 160 * scale) / 2;
    // A faint continuous letter shape keeps the dotted formation readable on small screens.
    const labelAlpha = phase <= 8200 ? .68 : phase < 8900 ? .68 * (1 - (phase - 8200) / 700) : .68 * ((phase - 8900) / 900);
    const labelLines = phase < 8900 ? messages[cycle] : messages[(cycle + 1) % messages.length];
    ctx.save(); ctx.translate(ox, oy); ctx.scale(scale, scale);
    ctx.globalAlpha = labelAlpha; ctx.fillStyle = '#c4edff';
    ctx.font = '700 36px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    labelLines.forEach((line, i) => ctx.fillText(line, 180, labelLines.length === 1 ? 80 : 57 + i * 47, 330));
    ctx.restore();
    for (let i = 0; i < count; i++) {
      const from = points[i % points.length], to = next[i % next.length];
      let x = from.x, y = from.y;
      const sx = 10 + seed(i + 1) * 340, sy = 10 + seed(i + 401) * 140;
      if (phase > 8200 && phase <= 8900) { const t = ease((phase - 8200) / 700); x += (sx - x) * t; y += (sy - y) * t; }
      else if (phase > 8900) { const t = ease((phase - 8900) / 900); x = sx + (to.x - sx) * t; y = sy + (to.y - sy) * t; }
      const shimmer = reduced.matches ? 1 : .8 + .2 * Math.sin(time / 650 + i * 1.7);
      ctx.globalAlpha = shimmer; ctx.fillStyle = i % 3 === 0 ? '#f2fbff' : '#8bd8ff';
      ctx.shadowColor = '#5dc9ff'; ctx.shadowBlur = 2.5 * scale;
      ctx.beginPath(); ctx.arc(ox + x * scale, oy + y * scale, Math.max(.7, .95 * scale), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }
  function tick(time) {
    frame = requestAnimationFrame(tick);
    if (!visible || document.hidden || reduced.matches || time - last < 33) return;
    last = time; draw(time - startedAt);
  }
  const start = () => { startedAt = performance.now(); build(); host.classList.add('is-ready'); frame = requestAnimationFrame(tick); };
  const ready = document.fonts ? document.fonts.ready : Promise.resolve();
  ready.then(start).catch(() => {});
  new ResizeObserver(() => resize()).observe(host);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }).observe(host);
  reduced.addEventListener('change', () => draw(0));
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame));
  window.addEventListener('pageshow', e => { if (e.persisted) frame = requestAnimationFrame(tick); });
})();
