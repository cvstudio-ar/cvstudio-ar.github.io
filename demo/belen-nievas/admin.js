const form = document.querySelector('#settings-form');
const status = document.querySelector('#status');
for (const [name, value] of Object.entries(window.belenSettings)) {
  const field = form.elements.namedItem(name);
  if (field) field.value = value;
}
function readSettings() {
  form.querySelectorAll('input[type=url]').forEach(field => {
    field.setCustomValidity(!field.value || field.value.startsWith('https://') ? '' : 'Ingresá una dirección que empiece con https://.');
  });
  const other = form.elements.otherLabel;
  other.setCustomValidity(form.elements.otherUrl.value && !other.value.trim() ? 'Ingresá un nombre para este enlace.' : '');
  return form.reportValidity() ? Object.fromEntries(new FormData(form)) : null;
}
form.addEventListener('input', event => {
  event.target.setCustomValidity('');
  form.elements.otherLabel.setCustomValidity('');
});
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
