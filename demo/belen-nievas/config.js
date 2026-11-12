window.belenDefaults = {
  whatsapp: '5491153426093',
  facebook: 'https://web.facebook.com/mbnievas',
  locations: 'Tigre · San Fernando · Pacheco'
};
window.belenSettings = (() => {
  try {
    return { ...window.belenDefaults, ...JSON.parse(localStorage.getItem('belen-nievas-demo') || '{}') };
  } catch {
    return { ...window.belenDefaults };
  }
})();
