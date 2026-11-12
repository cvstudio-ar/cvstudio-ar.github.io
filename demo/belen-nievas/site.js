const settings = window.belenSettings;
const message = 'Hola, Belén. Vi tu web y quisiera consultar disponibilidad para un turno de nutrición. ¡Gracias!';
document.querySelectorAll('[data-wa]').forEach(link => {
  link.href = 'https://wa.me/' + settings.whatsapp + '?text=' + encodeURIComponent(message);
});
document.querySelectorAll('[data-social]').forEach(link => {
  const key = link.dataset.social;
  try {
    const url = new URL(settings[key]);
    if (url.protocol !== 'https:') return;
    if (key === 'otherUrl') {
      if (!settings.otherLabel.trim()) return;
      link.textContent = settings.otherLabel;
    }
    link.href = url.href;
    link.hidden = false;
  } catch {
    // Empty optional profiles stay hidden.
  }
});
document.querySelectorAll('[data-locations]').forEach(label => {
  label.textContent = settings.locations;
});

const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#nav');
menu.hidden = false;
function closeMenu() {
  menu.setAttribute('aria-expanded', 'false');
}
menu.addEventListener('click', () => {
  menu.setAttribute('aria-expanded', String(menu.getAttribute('aria-expanded') === 'false'));
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menu.focus();
  }
});
