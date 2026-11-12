const form = document.querySelector('#settings-form');
const saveStatus = document.querySelector('#status');
for (const [name, value] of Object.entries(window.belenSettings)) {
  const field = form.elements.namedItem(name);
  if (field) field.value = value;
}
const coverPreview = document.querySelector('#cover-preview');
const coverStatus = document.querySelector('#cover-status');
const coverFile = document.querySelector('#cover-file');
let cover = window.belenSettings.cover;
let imageSelection = 0;
let loadingCover = false;

function showCover() {
  coverPreview.src = cover || 'assets/portada.webp';
}
showCover();
coverFile.addEventListener('change', async () => {
  const file = coverFile.files[0];
  if (!file) return;
  const selection = ++imageSelection;
  loadingCover = true;
  coverStatus.textContent = 'Preparando imagen…';
  let image;
  try {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw Error();
    image = await createImageBitmap(file);
    if (selection !== imageSelection) return;
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    cover = canvas.toDataURL('image/webp', .84);
    showCover();
    coverStatus.textContent = 'Imagen lista. Guardá la vista previa para aplicarla.';
  } catch {
    if (selection === imageSelection) coverStatus.textContent = 'No se pudo leer la imagen. Elegí un archivo JPG, PNG o WebP.';
  } finally {
    image?.close();
    if (selection === imageSelection) loadingCover = false;
  }
});
document.querySelector('#reset-cover').addEventListener('click', () => {
  imageSelection++;
  loadingCover = false;
  cover = '';
  coverFile.value = '';
  showCover();
  coverStatus.textContent = 'Portada original seleccionada.';
});
form.addEventListener('invalid', event => {
  const section = event.target.closest('details');
  if (section) section.open = true;
}, true);
function readSettings() {
  if (loadingCover) {
    saveStatus.textContent = 'Esperá a que termine de cargar la portada.';
    return null;
  }
  form.querySelectorAll('input[type=url]').forEach(field => {
    field.setCustomValidity(!field.value || field.value.startsWith('https://') ? '' : 'Ingresá una dirección que empiece con https://.');
  });
  const other = form.elements.otherLabel;
  other.setCustomValidity(form.elements.otherUrl.value && !other.value.trim() ? 'Ingresá un nombre para este enlace.' : '');
  return form.reportValidity() ? { ...Object.fromEntries(new FormData(form)), cover } : null;
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
    saveStatus.textContent = 'Vista previa guardada en este navegador.';
  } catch {
    saveStatus.textContent = 'Este navegador no pudo guardar la vista previa. Podés descargar la configuración.';
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
