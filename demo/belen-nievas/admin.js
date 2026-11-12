const form = document.querySelector('form');
const status = document.querySelector('#status');
for (const [name, value] of Object.entries(window.belenSettings)) {
  const field = form.elements.namedItem(name);
  if (field) field.value = value;
}
function readSettings() {
  const facebook = form.elements.facebook;
  facebook.setCustomValidity(facebook.value.startsWith('https://') ? '' : 'Ingresá una dirección que empiece con https://.');
  return form.reportValidity() ? Object.fromEntries(new FormData(form)) : null;
}
form.elements.facebook.addEventListener('input', event => event.target.setCustomValidity(''));
form.addEventListener('submit', event => {
  event.preventDefault();
  const settings = readSettings();
  if (!settings) return;
  try {
    localStorage.setItem('belen-nievas-demo', JSON.stringify(settings));
    status.textContent = 'Vista previa guardada en este navegador.';
  } catch {
    status.textContent = 'Este navegador no pudo guardar la vista previa. Podés descargar la configuración.';
  }
});
document.querySelector('#export').addEventListener('click', () => {
  const settings = readSettings();
  if (!settings) return;
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'belen-configuracion.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
