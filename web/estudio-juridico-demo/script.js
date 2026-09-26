(() => {
  const dialog = document.getElementById('detail-dialog');
  const title = document.getElementById('dialog-title');
  const panels = [...document.querySelectorAll('[data-panel-content]')];
  const close = dialog?.querySelector('.dialog-close');
  if (!dialog || !title || !close) return;
  document.querySelectorAll('[data-panel]').forEach(button => button.addEventListener('click', () => {
    panels.forEach(panel => { panel.hidden = panel.dataset.panelContent !== button.dataset.panel; });
    title.textContent = button.dataset.dialogTitle || 'Conocé el estudio';
    dialog.showModal();
  }));
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
})();
