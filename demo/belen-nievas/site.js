const settings = window.belenSettings;
const message = 'Hola, Belén. Vi tu web y quisiera consultar disponibilidad para un turno de nutrición. ¡Gracias!';
document.querySelectorAll('[data-wa]').forEach(link => {
  link.href = 'https://wa.me/' + settings.whatsapp + '?text=' + encodeURIComponent(message);
});
document.querySelectorAll('[data-facebook]').forEach(link => {
  const url = new URL(settings.facebook, location.href);
  if (url.protocol === 'https:') link.href = url.href;
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
