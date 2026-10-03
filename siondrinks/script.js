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
  const musicLabel = document.getElementById('music-label');
  const musicStatus = document.getElementById('music-status');
  let player = null;
  let ready = false;
  let desiredPlaying = false;
  let loading = false;
  let loadTimer = null;
  function status(message = '') {
    musicStatus.textContent = message;
    musicStatus.hidden = !message;
  }
  function updateButton(playing) {
    musicToggle.setAttribute('aria-pressed', String(playing));
    musicLabel.textContent = playing ? 'Pausar música' : 'Activar música';
    musicToggle.querySelector('.play-icon').textContent = playing ? 'Ⅱ' : '▶';
  }
  function failed(message) {
    clearTimeout(loadTimer);
    desiredPlaying = false;
    loading = false;
    updateButton(false);
    status(message);
  }
  function createPlayer() {
    if (player) return;
    player = new window.YT.Player('music-player', {
      host: 'https://www.youtube-nocookie.com',
      width: 320,
      height: 200,
      videoId: 'i34pFNr42mc',
      playerVars: { playsinline: 1, controls: 0, rel: 0, origin: window.location.origin },
      events: {
        onReady(event) {
          clearTimeout(loadTimer);
          ready = true;
          loading = false;
          const iframe = event.target.getIframe();
          iframe.setAttribute('tabindex', '-1');
          iframe.setAttribute('aria-hidden', 'true');
          iframe.setAttribute('allow', 'autoplay; encrypted-media');
          event.target.setVolume(55);
          if (desiredPlaying) event.target.playVideo();
        },
        onStateChange(event) {
          if (event.data === 1) { updateButton(true); status(); }
          else if (event.data === 2 || event.data === 0) {
            desiredPlaying = false;
            updateButton(false);
          }
        },
        onAutoplayBlocked() {
          failed('Tocá Activar música otra vez para iniciar la reproducción.');
        },
        onError() {
          failed('No se pudo reproducir la música de YouTube. Intentá nuevamente.');
        }
      }
    });
  }
  musicToggle.addEventListener('click', () => {
    if (loading) {
      desiredPlaying = !desiredPlaying;
      musicLabel.textContent = desiredPlaying ? 'Cargando música…' : 'Activar música';
      return;
    }
    status();
    if (ready) {
      desiredPlaying = !desiredPlaying;
      if (desiredPlaying) player.playVideo();
      else { player.pauseVideo(); updateButton(false); }
      return;
    }
    desiredPlaying = true;
    loading = true;
    musicLabel.textContent = 'Cargando música…';
    loadTimer = setTimeout(() => failed('La música no pudo cargarse. Revisá tu conexión e intentá nuevamente.'), 15000);
    if (window.YT?.Player) { createPlayer(); return; }
    window.onYouTubeIframeAPIReady = createPlayer;
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => {
      script.remove();
      failed('La música no pudo cargarse. Intentá nuevamente.');
    };
    document.head.append(script);
  });
})();
