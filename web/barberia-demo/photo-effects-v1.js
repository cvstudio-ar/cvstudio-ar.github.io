(() => {
  const photo = document.querySelector('.showcase-photo');
  const motion = document.querySelector('.photo-motion');
  if (!photo || !motion) return;

  const mobile = window.matchMedia('(max-width: 700px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  function alignWithPhoto() {
    if (reduced.matches) {
      motion.classList.remove('is-ready');
      return;
    }
    const { width, height } = photo.getBoundingClientRect();
    if (!width || !height) return;
    const imageWidth = mobile.matches ? 1024 : 1672;
    const imageHeight = mobile.matches ? 1536 : 941;
    const scale = Math.max(width / imageWidth, height / imageHeight);
    const displayedWidth = imageWidth * scale;
    const displayedHeight = imageHeight * scale;
    const verticalAnchor = mobile.matches ? .5 : .43;
    motion.style.width = `${displayedWidth}px`;
    motion.style.height = `${displayedHeight}px`;
    motion.style.left = `${(width - displayedWidth) / 2}px`;
    motion.style.top = `${(height - displayedHeight) * verticalAnchor}px`;
    motion.classList.add('is-ready');
  }

  if ('ResizeObserver' in window) new ResizeObserver(alignWithPhoto).observe(photo);
  window.addEventListener('resize', alignWithPhoto, { passive: true });
  mobile.addEventListener?.('change', alignWithPhoto);
  reduced.addEventListener?.('change', alignWithPhoto);
  alignWithPhoto();
})();
