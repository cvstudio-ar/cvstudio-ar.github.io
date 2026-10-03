(() => {
  'use strict';
  const whatsappBase = 'https://wa.me/5491163734430';
  const greeting = '¡Hola Federico! Te escribo para consultarte sobre tus servicios de Siondrinks.';
  document.querySelectorAll('[data-whatsapp]').forEach(link => {
    const service = link.dataset.service;
    link.href = `${whatsappBase}?text=${encodeURIComponent(service ? `¡Hola Federico! Te escribo para consultarte sobre ${service}.` : greeting)}`;
  });

  const dialogs = [...document.querySelectorAll('dialog')];
  let returnFocus = null;
  function openPanel(id, trigger) {
    const panel = document.getElementById(id);
    if (!panel || !(panel instanceof HTMLDialogElement)) return;
    // Keep the original page button as the focus target when navigating between panels.
    if (!dialogs.some(dialog => dialog.open)) returnFocus = trigger;
    dialogs.forEach(dialog => { if (dialog.open) dialog.close(); });
    panel.showModal();
    panel.scrollTop = 0;
    panel.querySelector('[data-close]')?.focus({ preventScroll: true });
  }
  document.querySelectorAll('[data-open]').forEach(button => {
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', button.dataset.open);
    button.addEventListener('click', () => openPanel(button.dataset.open, button));
  });
  function closePanel(panel) {
    panel.close();
    returnFocus?.focus({ preventScroll: true });
  }
  dialogs.forEach(panel => {
    panel.querySelectorAll('[data-close]').forEach(button => {
      button.addEventListener('click', () => closePanel(panel));
    });
    panel.addEventListener('cancel', event => {
      event.preventDefault();
      closePanel(panel);
    });
    let beganOnBackdrop = false;
    const isBackdrop = event => {
      const rect = panel.getBoundingClientRect();
      return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    };
    panel.addEventListener('pointerdown', event => { beganOnBackdrop = isBackdrop(event); });
    panel.addEventListener('click', event => {
      if (event.target === panel && beganOnBackdrop && isBackdrop(event)) closePanel(panel);
    });
  });

  const images = [
    { src: 'assets/egresados.webp', caption: 'Fiestas de egresados', alt: 'Propuesta Siondrinks para fiestas de egresados' },
    { src: 'assets/barras-dj.webp', caption: 'Barras móviles + DJ', alt: 'Presentación de barras móviles, coctelería y DJ de Siondrinks' },
    { src: 'assets/dj-original.webp', caption: 'El ritmo de tu fiesta', alt: 'DJ frente a su consola entre luces y humo' }
  ];
  let galleryIndex = 0;
  function showImage(index) {
    galleryIndex = (index + images.length) % images.length;
    const item = images[galleryIndex];
    const photo = document.getElementById('gallery-image');
    photo.src = item.src;
    photo.alt = item.alt;
    document.getElementById('gallery-caption').textContent = item.caption;
    document.getElementById('gallery-count').textContent = `${galleryIndex + 1} / ${images.length}`;
    document.querySelectorAll('[data-gallery]').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.gallery) === galleryIndex));
    });
  }
  document.getElementById('gallery-prev').addEventListener('click', () => showImage(galleryIndex - 1));
  document.getElementById('gallery-next').addEventListener('click', () => showImage(galleryIndex + 1));
  document.querySelectorAll('[data-gallery]').forEach(button => {
    button.addEventListener('click', () => showImage(Number(button.dataset.gallery)));
  });
  document.getElementById('galeria').addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); showImage(galleryIndex - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showImage(galleryIndex + 1); }
  });

  const dateInput = document.getElementById('event-date');
  const today = new Date();
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  dateInput.min = localDate;
  document.getElementById('quote-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const [year, month, day] = String(data.get('fecha')).split('-');
    const fields = [
      `¡Hola Federico! Soy ${String(data.get('nombre')).trim()}. Te escribo desde la web de Siondrinks para consultar por mi evento.`,
      '',
      `Evento: ${data.get('evento')}`,
      `Fecha: ${day}/${month}/${year}`,
      `Servicio: ${data.get('servicio')}`
    ];
    if (data.get('invitados')) fields.push(`Invitados aproximados: ${data.get('invitados')}`);
    if (String(data.get('lugar')).trim()) fields.push(`Lugar o zona: ${String(data.get('lugar')).trim()}`);
    if (String(data.get('mensaje')).trim()) fields.push('', String(data.get('mensaje')).trim());
    // Open in the same tab so mobile popup blockers cannot silently discard the inquiry.
    window.location.assign(`${whatsappBase}?text=${encodeURIComponent(fields.join('\n'))}`);
  });

  const musicToggle = document.getElementById('music-toggle');
  const musicTray = document.getElementById('music-tray');
  const musicPlayer = document.getElementById('music-player');
  function stopMusic() {
    musicPlayer.replaceChildren();
    musicTray.hidden = true;
    musicToggle.setAttribute('aria-expanded', 'false');
    document.getElementById('music-label').textContent = 'Activar música';
  }
  musicToggle.addEventListener('click', () => {
    if (!musicTray.hidden) { stopMusic(); return; }
    const iframe = document.createElement('iframe');
    iframe.title = 'Jamaican (Bam Bam) de HUGEL y SOLTO · Reproductor de YouTube';
    iframe.src = 'https://www.youtube-nocookie.com/embed/i34pFNr42mc?autoplay=1&playsinline=1&rel=0';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    musicPlayer.append(iframe);
    musicTray.hidden = false;
    musicToggle.setAttribute('aria-expanded', 'true');
    document.getElementById('music-label').textContent = 'Cerrar música';
  });
  document.getElementById('music-close').addEventListener('click', () => { stopMusic(); musicToggle.focus(); });
})();
