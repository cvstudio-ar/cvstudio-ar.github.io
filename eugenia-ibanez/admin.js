(() => {
  'use strict';
  const {initial, normalize, getData, saveData, clean} = window.EUGENIA;
  const $ = id => document.getElementById(id);
  const sessionKey = 'cvstudio_eugenia_ibanez_admin';
  const expectedDigest = 'b27a5db04441e59fd060b5ab67668b7b3da789a5044032384e86b9be224c6382';
  const titles = {general: 'Contenido principal', services: 'Servicios',
    contact: 'Contacto y redes', appearance: 'Apariencia e imágenes', backup: 'Exportación'};
  const fields = document.querySelectorAll('[data-field]');
  let state = getData();
  let activeTab = 'general';
  let timer;

  function notice(message, error = false) {
    const status = $('status');
    status.textContent = message;
    status.className = 'status show' + (error ? ' error' : '');
    clearTimeout(timer);
    timer = setTimeout(() => status.classList.remove('show'), 4200);
  }

  function showAuth() {
    const logged = Number(sessionStorage.getItem(sessionKey)) > Date.now();
    $('login-screen').hidden = logged;
    $('dashboard').hidden = !logged;
    if (logged) populate();
  }

  $('login-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const button = form.querySelector('button');
    button.disabled = true;
    const enc = new TextEncoder();
    try {
      const key = await crypto.subtle.importKey('raw', enc.encode(data.get('password')), 'PBKDF2', false, ['deriveBits']);
      const result = await crypto.subtle.deriveBits({
        name: 'PBKDF2', hash: 'SHA-256', iterations: 150000, salt: enc.encode('cvstudio-eugenia-preview-v1')
      }, key, 256);
      const digest = Array.from(new Uint8Array(result), b => b.toString(16).padStart(2, '0')).join('');
      if (data.get('user').trim() !== 'Admin' || digest !== expectedDigest) {
        $('login-error').textContent = 'Los datos ingresados no son correctos.';
        $('login-error').hidden = false;
        return;
      }
      sessionStorage.setItem(sessionKey, String(Date.now() + 4 * 60 * 60 * 1000));
      $('login-error').hidden = true;
      form.reset();
      state = getData();
      showAuth();
    } catch {
      $('login-error').textContent = 'Abrí el panel desde la dirección HTTPS de la demo para ingresar.';
      $('login-error').hidden = false;
    } finally {
      button.disabled = false;
    }
  });

  $('logout').addEventListener('click', () => {
    sessionStorage.removeItem(sessionKey);
    showAuth();
    $('login-form').elements.user.focus();
  });

  function changeTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.panel').forEach(panel => panel.hidden = panel.id !== 'panel-' + tab);
    document.querySelectorAll('[data-tab]').forEach(button => {
      const selected = button.dataset.tab === tab;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    $('section-title').textContent = titles[tab];
  }

  function collect() {
    for (const input of fields) state[input.dataset.field] = input.value.trim();
    state.palette = document.querySelector('[name=palette]:checked')?.value || initial.palette;
    state.services = Array.from(document.querySelectorAll('.service-edit'), card => ({
      name: card.querySelector('.service-name').value.trim(),
      description: card.querySelector('.service-desc').value.trim()
    }));
  }

  function updatePhoto() {
    $('cover-preview').src = state.cover;
    $('cover-preview').style.objectPosition = $('focus').value + '% center';
  }

  function renderServices() {
    $('service-editor').innerHTML = state.services.map((service, i) => `<div class="service-edit">
      <div class="service-edit-title"><b>Área ${i + 1}</b><button class="remove-service" type="button" data-index="${i}">Eliminar área ${i + 1}</button></div>
      <label>Nombre<input class="service-name" maxlength="65" value="${clean(service.name)}"></label>
      <label>Descripción<textarea class="service-desc" rows="2" maxlength="280">${clean(service.description)}</textarea></label>
    </div>`).join('');
  }

  function populate() {
    for (const input of fields) input.value = state[input.dataset.field] ?? '';
    document.querySelectorAll('[name=palette]').forEach(input => input.checked = input.value === state.palette);
    renderServices();
    changeTab(activeTab);
    updatePhoto();
  }

  $('admin-nav').addEventListener('click', event => {
    const button = event.target.closest('[data-tab]');
    if (button) changeTab(button.dataset.tab);
  });

  $('service-editor').addEventListener('click', event => {
    const button = event.target.closest('[data-index]');
    if (!button) return;
    collect();
    if (state.services.length <= 1) return notice('Conservá al menos un área de práctica.', true);
    state.services.splice(Number(button.dataset.index), 1);
    renderServices();
  });

  $('add-service').addEventListener('click', () => {
    collect();
    if (state.services.length >= 20) return notice('El máximo es 20 áreas.', true);
    state.services.push({name: '', description: ''});
    renderServices();
    [...document.querySelectorAll('.service-name')].at(-1).focus();
  });

  $('save').addEventListener('click', () => {
    collect();
    if (!state.business || !state.headline || !state.services.some(service => service.name)) {
      notice('Completá el nombre del estudio, el título de portada y al menos un área.', true);
      return;
    }
    try {
      saveData(state);
      state = getData();
      populate();
      notice('Cambios guardados en este navegador.');
    } catch {
      notice('El navegador no pudo guardar los cambios. Probá con una imagen más liviana.', true);
    }
  });

  $('focus').addEventListener('input', updatePhoto);
  $('reset-cover').addEventListener('click', () => {
    state.cover = initial.cover;
    $('focus').value = initial.focus;
    updatePhoto();
    notice('Portada original seleccionada. Guardá los cambios para aplicarla.');
  });

  $('cover-input').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 12e6) {
      notice('Elegí una imagen JPG, PNG o WebP de hasta 12 MB.', true);
      event.target.value = '';
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const ratio = Math.min(1, 1920 / img.naturalWidth, 1400 / img.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const photo = canvas.toDataURL('image/webp', .8);
      if (photo.length > 3000000) throw new Error('Imagen demasiado pesada');
      state.cover = photo;
      updatePhoto();
      notice('Imagen preparada. Guardá los cambios para aplicarla.');
    } catch {
      notice('No se pudo preparar la imagen. Probá con otro archivo.', true);
    } finally {
      URL.revokeObjectURL(url);
      event.target.value = '';
    }
  });

  $('export-json').addEventListener('click', () => {
    collect();
    const url = URL.createObjectURL(new Blob([JSON.stringify(normalize(state), null, 2)], {type: 'application/json'}));
    const download = document.createElement('a');
    download.href = url;
    download.download = 'estudio-ibanez-configuracion.json';
    download.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  $('import-json').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 4000000) throw new Error('Archivo demasiado pesado');
      const data = JSON.parse(await file.text());
      if (!data || Array.isArray(data) || typeof data.business !== 'string' || !Array.isArray(data.services)) {
        throw new Error('Configuración inválida');
      }
      state = normalize(data);
      populate();
      notice('Configuración importada. Guardá los cambios para aplicarla.');
    } catch {
      notice('El archivo no es una configuración válida.', true);
    } finally {
      event.target.value = '';
    }
  });

  $('reset-all').addEventListener('click', () => {
    if (!confirm('¿Restaurar la configuración original en este navegador?')) return;
    try {
      saveData(initial);
      state = getData();
      populate();
      notice('Configuración restaurada.');
    } catch {
      notice('El navegador no pudo guardar la configuración.', true);
    }
  });
  showAuth();
})();
