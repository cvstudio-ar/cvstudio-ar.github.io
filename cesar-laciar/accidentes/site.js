(function () {
  'use strict';
  var config = window.LACIAR && typeof window.LACIAR.getData === 'function' ? window.LACIAR.getData() : {};
  var rawPhone = String(config.whatsapp || '5491138267865');
  var digits = rawPhone.replace(/\D/g, '');
  var message = 'Hola Dr. Laciar, vengo de Google. Tuve un accidente de tránsito y quisiera hacer una consulta';
  var whatsappHref = digits ? 'https://wa.me/' + digits + '?text=' + encodeURIComponent(message) : '';
  document.querySelectorAll('[data-whatsapp]').forEach(function (link) {
    if (whatsappHref) link.href = whatsappHref;
    else { link.removeAttribute('href'); link.setAttribute('aria-disabled', 'true'); }
    link.addEventListener('click', function () {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({event:'whatsapp_click',page_type:'landing_accidentes',click_id:link.id});
    });
  });
  var phone = String(config.phone || '+54 9 11 3826-7865');
  document.querySelectorAll('[data-phone]').forEach(function (link) {
    link.href = 'tel:' + phone.replace(/[^\d+]/g, '');
    if (link.id === 'contact-phone') link.textContent = phone;
  });
  document.getElementById('current-year').textContent = new Date().getFullYear();
})();