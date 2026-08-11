(() => {
  'use strict';
  const button = document.querySelector('.cm-menu');
  const nav = document.querySelector('.cm-header nav');
  const worker = String(window.CVSTUDIO_PORTFOLIO_WORKER_URL || '').replace(/\/$/, '');
  const box = document.getElementById('catalogProducts');
  const modal = document.getElementById('catalogProductModal');
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]));
  const money = value => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Number(value || 0));
  const availability = value => ({available:'Disponible',last_units:'Últimas unidades',coming_soon:'Próximamente',sold_out:'Agotado'}[value] || 'Disponible');
  let commerce = null;

  if (button && nav) {
    button.addEventListener('click', () => { const open = nav.classList.toggle('is-open'); button.setAttribute('aria-expanded', String(open)); });
    nav.addEventListener('click', event => { if (event.target.closest('a')) { nav.classList.remove('is-open'); button.setAttribute('aria-expanded', 'false'); } });
  }

  function contactUrl(product) {
    const phone = String(commerce?.whatsapp || '').replace(/\D/g,'');
    const message = encodeURIComponent(`Hola, consulto por ${product.title} publicado en el catálogo de Casa Morita.`);
    if (phone) return `https://wa.me/${phone}?text=${message}`;
    return commerce?.settings?.instagram || 'https://www.instagram.com/bazarcasamorita/';
  }

  function productMedia(product) {
    const media = Array.isArray(product.media) ? product.media.map(item => typeof item === 'string' ? item : item?.url).filter(Boolean) : [];
    return [...new Set([product.cover_url,...media].filter(Boolean))];
  }

  function openProduct(product) {
    if (!modal) return;
    const images = productMedia(product);
    document.getElementById('catalogModalGallery').innerHTML = images.map((url,index) => `<img src="${esc(url)}" alt="${esc(product.title)}${index ? ` · foto ${index+1}` : ''}">`).join('');
    document.getElementById('catalogModalCategory').textContent = product.category || 'Producto';
    document.getElementById('catalogModalTitle').textContent = product.title;
    document.getElementById('catalogModalDescription').textContent = product.description || 'Consultanos para conocer todos los detalles.';
    document.getElementById('catalogModalPrice').textContent = product.price_mode === 'price' ? money(product.price) : 'Consultar precio';
    document.getElementById('catalogModalAvailability').textContent = availability(product.availability);
    document.getElementById('catalogModalContact').href = contactUrl(product);
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeProduct() { if (!modal) return; modal.hidden = true; document.body.style.overflow = ''; }
  document.querySelectorAll('[data-close-catalog-product]').forEach(node => node.addEventListener('click', closeProduct));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal && !modal.hidden) closeProduct(); });

  function renderProducts(products) {
    if (!box || !products.length) return;
    box.classList.add('has-live-products');
    box.innerHTML = products.map((product,index) => `<article class="cm-live-product ${product.featured?'is-featured':''}" data-live-product="${index}" tabindex="0" role="button" aria-label="Ver ${esc(product.title)}">
      <div class="cm-live-product-media"><img src="${esc(product.cover_url)}" alt="${esc(product.title)}" loading="lazy">${product.featured?'<span>Selección especial</span>':''}<i>${availability(product.availability)}</i></div>
      <div class="cm-live-product-copy"><small>${esc(product.category || 'Casa Morita')}</small><h3>${esc(product.title)}</h3><p>${esc(product.description || 'Conocé todos los detalles y opciones disponibles.')}</p><div><strong>${product.price_mode === 'price' ? money(product.price) : 'Consultar precio'}</strong><b>Ver producto →</b></div></div>
    </article>`).join('');
    box.querySelectorAll('[data-live-product]').forEach(card => {
      const open = () => openProduct(products[Number(card.dataset.liveProduct)]);
      card.addEventListener('click', open);
      card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
    });
  }

  async function loadCatalog() {
    if (!worker || !box) return;
    try {
      const response = await fetch(`${worker}/api/public/portfolio?slug=bazar-casa-morita`,{cache:'no-store'});
      const data = await response.json();
      if (!response.ok || !data?.portfolio) return;
      commerce = data.portfolio;
      const products = (commerce.projects || []).filter(item => item.item_type === 'product');
      renderProducts(products);
    } catch (error) { console.warn('[Casa Morita] Catálogo demostrativo activo:', error); }
  }

  loadCatalog();
})();
