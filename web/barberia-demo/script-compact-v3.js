const toast = document.querySelector('.demo-toast');
let toastTimer;

document.querySelectorAll('.demo-action').forEach((button) => {
  button.addEventListener('click', () => {
    button.classList.remove('is-pressed');
    void button.offsetWidth;
    button.classList.add('is-pressed');
    window.setTimeout(() => button.classList.remove('is-pressed'), 330);
    toast.textContent = button.dataset.demoMessage || 'Vista demostrativa · La función se configura para cada negocio.';
    toast.classList.add('visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 3200);
  });
});
