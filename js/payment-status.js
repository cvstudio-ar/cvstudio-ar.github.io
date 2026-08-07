(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  const order = params.get('pedido') || params.get('external_reference') || '';
  const paymentId = params.get('payment_id') || params.get('collection_id') || '';
  const status = params.get('status') || params.get('collection_status') || '';
  const set = (id,value) => { const el=document.getElementById(id); if(el && value){el.textContent=value; el.closest('.order-item')?.removeAttribute('hidden');} };
  set('orderCode', order);
  set('paymentId', paymentId);
  set('paymentStatus', ({approved:'Aprobado',pending:'Pendiente',in_process:'En proceso',rejected:'No aprobado'}[status] || status));
  document.querySelectorAll('[data-order-param]').forEach(link => {
    if(!order) return;
    const url=new URL(link.href); url.searchParams.set('pedido',order); link.href=url.toString();
  });
  const wa=document.querySelector('[data-whatsapp]');
  if(wa && order){wa.href=`https://wa.me/5492964652318?text=${encodeURIComponent(`Hola CVStudio, necesito ayuda con el pedido ${order}.`)}`;}
})();
