const dialog = document.querySelector('#detail-dialog');
const dialogTitle = document.querySelector('#dialog-title');
const closeButton = dialog.querySelector('.dialog-close');
let triggerButton = null;

document.querySelectorAll('.demo-action[data-panel]').forEach((button) => {
  button.addEventListener('click', () => {
    triggerButton = button;
    button.classList.add('is-pressed');
    window.setTimeout(() => button.classList.remove('is-pressed'), 280);
    const panelName = button.dataset.panel;
    dialog.querySelectorAll('[data-panel-content]').forEach((panel) => {
      panel.hidden = panel.dataset.panelContent !== panelName;
    });
    dialogTitle.textContent = button.dataset.dialogTitle || 'Explorá la barbería';
    dialog.showModal();
    closeButton.focus();
  });
});

closeButton.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener('close', () => triggerButton?.focus());
