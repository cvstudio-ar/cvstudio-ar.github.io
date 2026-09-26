(() => {
  const field = document.querySelector('.ember-field');
  if (!field) return;

  const fragments = document.createDocumentFragment();
  const count = matchMedia('(max-width: 700px)').matches ? 17 : 27;
  for (let i = 0; i < count; i += 1) {
    const ember = document.createElement('span');
    ember.className = `ember${i % 3 === 0 ? ' ember--dim' : ''}`;
    ember.style.setProperty('--x', `${(i * 37.7 + 11) % 100}%`);
    ember.style.setProperty('--size', `${2 + (i * 7) % 4}px`);
    ember.style.setProperty('--duration', `${10 + (i * 11) % 9}s`);
    ember.style.setProperty('--delay', `${-((i * 13) % 18)}s`);
    ember.style.setProperty('--drift', `${((i * 19) % 90) - 45}px`);
    ember.style.setProperty('--sway', `${((i * 23) % 44) - 22}px`);
    ember.style.setProperty('--brightness', `${(0.27 + (i % 5) * 0.075).toFixed(3)}`);
    fragments.appendChild(ember);
  }
  field.appendChild(fragments);
})();
