(() => {
  const dialog = document.getElementById('detail-dialog');
  const title = document.getElementById('dialog-title');
  const panels = [...document.querySelectorAll('[data-panel-content]')];
  const close = dialog?.querySelector('.dialog-close');
  if (!dialog || !title || !close) return;

  document.querySelectorAll('[data-panel]').forEach(button => {
    button.addEventListener('click', () => {
      const selection = button.dataset.panel;
      panels.forEach(panel => { panel.hidden = panel.dataset.panelContent !== selection; });
      title.textContent = button.dataset.dialogTitle || 'Explorá el espacio';
      dialog.showModal();
    });
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
})();
