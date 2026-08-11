(() => {
  'use strict';
  const db = window.cvstudioSupabase;
  const worker = String(window.CVSTUDIO_PORTFOLIO_WORKER_URL || '').replace(/\/$/, '');
  const $ = id => document.getElementById(id);
  const usernameEmail = username => `${String(username || '').trim().toLowerCase()}@portfolios.cvstudio.local`;
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  let portfolio = null;
  let projects = [];
  let products = [];
  let catalogMode = false;
  let selectedImageFile = null;
  let selectedSlideFiles = [];
  let selectedSlideSections = [];
  let editingMedia = [];
  let editingCoverSection = 'inicio';
  let selectedLogoFile = null;
  let selectedTemplate = 'lens';
  let selectedPalette = 'gold';
  let themeColors = null;
  let selectedProductImage = null;
  let selectedProductGallery = [];
  let editingProductMedia = [];
  const themes = [
    ['lens','LENS','Fotografía'],['atelier','ATELIER','Ropa y moda'],['studio','STUDIO','Edición y creatividad'],['beauty','BEAUTY','Manicura y estética'],['barber','BARBER','Barbería'],['tech','TECH','Tecnología'],['local','LOCAL','Servicios y comercios']
  ];
  const palettes = {gold:['#f4bd28','#07101b','#f7f9fd'],rose:['#eaa0b8','#190f18','#fff7fb'],ocean:['#40b8d8','#07151c','#eefcff'],forest:['#74b88a','#09140e','#f2fff5'],violet:['#a78bfa','#100c1c','#fbf9ff'],mono:['#ffffff','#090909','#f5f5f5']};

  async function currentSession() {
    if (!db) throw new Error('Supabase no está configurado.');
    const {data:{session}} = await db.auth.getSession();
    return session;
  }

  async function api(action, payload = {}) {
    const session = await currentSession();
    if (!session) throw new Error('La sesión venció. Volvé a ingresar.');
    const response = await fetch(`${worker}/api/client`, {
      method:'POST',
      headers:{'Content-Type':'application/json', Authorization:`Bearer ${session.access_token}`},
      body:JSON.stringify({action, ...payload})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.message || 'No se pudo completar la operación.');
    return data;
  }

  async function uploadFile(file) {
    const session = await currentSession();
    if (!session) throw new Error('La sesión venció. Volvé a ingresar.');
    const form = new FormData();
    form.append('file', file, file.name);
    const response = await fetch(`${worker}/api/client/upload`, {method:'POST', headers:{Authorization:`Bearer ${session.access_token}`}, body:form});
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.message || 'No se pudo subir la imagen.');
    return data.file;
  }

  async function optimizeCatalogImage(file) {
    if (!file || !file.type.startsWith('image/')) return file;
    try {
      const bitmap = await createImageBitmap(file);
      const maxSide = 1800;
      const ratio = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * ratio));
      const height = Math.max(1, Math.round(bitmap.height * ratio));
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d',{alpha:false}).drawImage(bitmap,0,0,width,height);
      bitmap.close?.();
      const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/webp',.88));
      if (!blob) return file;
      return new File([blob],`${file.name.replace(/\.[^.]+$/,'') || 'producto'}.webp`,{type:'image/webp'});
    } catch (_) { return file; }
  }

  function initLogin() {
    const form = $('clientLoginForm');
    if (!form) return;
    currentSession().then(session => { if (session) location.replace('/cliente-panel/'); }).catch(() => {});
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const message = $('clientLoginMessage');
      const button = $('clientLoginButton');
      message.textContent = 'Ingresando…';
      message.className = 'message';
      button.disabled = true;
      try {
        const {error} = await db.auth.signInWithPassword({email:usernameEmail($('clientUsername').value), password:$('clientPassword').value});
        if (error) throw error;
        location.replace('/cliente-panel/');
      } catch {
        message.textContent = 'Usuario o contraseña incorrectos.';
        message.className = 'message error';
        button.disabled = false;
      }
    });
  }

  function renderProfile() {
    $('headerClientName').textContent = portfolio.brand_name || portfolio.full_name;
    $('dashboardTitle').textContent = portfolio.brand_name || portfolio.full_name;
    $('dashboardSubtitle').textContent = portfolio.business_type || 'Actualizá tus datos y cargá nuevos trabajos.';
    $('portfolioStatusBadge').textContent = portfolio.status === 'active' ? 'Activo' : portfolio.status === 'suspended' ? 'Suspendido' : 'Borrador';
    const publicUrl = `${location.origin}/${portfolio.slug}`;
    $('viewPublicPortfolio').href = publicUrl;
    $('settingsPublicUrl').href = publicUrl;
    $('settingsPublicUrl').textContent = publicUrl;
    $('profileFullName').value = portfolio.full_name || '';
    $('profileBrandName').value = portfolio.brand_name || '';
    $('profileBusinessType').value = portfolio.business_type || '';
    $('profileWhatsapp').value = portfolio.whatsapp || '';
    $('profileEmail').value = portfolio.contact_email || '';
    $('profileInstagram').value = portfolio.settings?.instagram || '';
    $('profileFacebook').value = portfolio.settings?.facebook || '';
    $('profileLogoPreview').src = portfolio.settings?.logoUrl || '';
    $('profileLogoPreview').style.visibility = portfolio.settings?.logoUrl ? 'visible' : 'hidden';
    $('profileTemplate').value = portfolio.template_key || 'lens';
    selectedTemplate = portfolio.template_key || 'lens';
    selectedPalette = portfolio.settings?.palette || 'gold';
    themeColors = Array.isArray(portfolio.settings?.colors) ? [...portfolio.settings.colors] : [...(palettes[selectedPalette] || palettes.gold)];
    renderThemeStudio();
    $('profileBio').value = portfolio.bio || '';
    catalogMode = portfolio.slug === 'bazar-casa-morita' || portfolio.template_key === 'local' || portfolio.settings?.portalMode === 'catalog';
    document.body.classList.toggle('catalog-client-mode', catalogMode);
    $('productsNav').hidden = !catalogMode;
    $('projectsNav').hidden = catalogMode;
    $('themeNav').hidden = catalogMode;
    $('templateField').hidden = catalogMode;
    $('portalEyebrow').textContent = catalogMode ? 'Mi comercio' : 'Mi espacio profesional';
    $('profileNav').textContent = catalogMode ? 'Mi comercio' : 'Mi perfil';
    $('profileHeading').textContent = catalogMode ? 'Información del comercio' : 'Información del portfolio';
    $('profileDescription').textContent = catalogMode ? 'Estos datos acompañan tu catálogo y facilitan las consultas.' : 'Actualizá los datos visibles de tu espacio.';
    if (catalogMode) $('dashboardSubtitle').textContent = 'Administrá tus productos, fotografías y datos comerciales.';
  }

  const availabilityLabel = value => ({available:'Disponible',last_units:'Últimas unidades',coming_soon:'Próximamente',sold_out:'Agotado'}[value] || 'Disponible');
  const money = value => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Number(value || 0));

  function renderProducts() {
    const box = $('productList');
    if (!box) return;
    $('productTotal').textContent = products.length;
    $('productPublished').textContent = products.filter(item => item.is_visible).length;
    $('productFeatured').textContent = products.filter(item => item.featured).length;
    if (!products.length) {
      box.innerHTML = '<div class="catalog-empty"><span>＋</span><h3>Tu catálogo está listo para empezar</h3><p>Agregá el primer producto con sus fotos, precio y disponibilidad.</p><button type="button" data-empty-product>Agregar producto</button></div>';
      box.querySelector('[data-empty-product]')?.addEventListener('click', () => openProduct());
      return;
    }
    box.innerHTML = products.map(item => `<article class="product-admin-card ${item.is_visible?'':'is-hidden'}">
      <div class="product-admin-media">${item.cover_url ? `<img src="${esc(item.cover_url)}" alt="${esc(item.title)}">` : '<span>Sin foto</span>'}${item.featured?'<b>Destacado</b>':''}</div>
      <div class="product-admin-copy"><div><small>${esc(item.category || 'Producto')}</small><h3>${esc(item.title)}</h3></div><p>${item.price_mode === 'price' ? money(item.price) : 'Consultar precio'} · ${availabilityLabel(item.availability)}</p><span class="product-visibility ${item.is_visible?'is-public':'is-draft'}">${item.is_visible?'Publicado':'Oculto'}</span><div class="product-admin-actions"><button type="button" class="secondary" data-edit-product="${esc(item.id)}">Editar</button><button type="button" class="secondary danger" data-delete-product="${esc(item.id)}">Eliminar</button></div></div>
    </article>`).join('');
    box.querySelectorAll('[data-edit-product]').forEach(button => button.addEventListener('click', () => openProduct(products.find(item => item.id === button.dataset.editProduct))));
    box.querySelectorAll('[data-delete-product]').forEach(button => button.addEventListener('click', () => removeProduct(button.dataset.deleteProduct)));
  }

  function renderProjects() {
    const box = $('projectList');
    if (!projects.length) {
      box.innerHTML = '<div class="public-empty" style="padding:45px 20px"><h3>Todavía no cargaste trabajos</h3><p>Creá tu primer proyecto para empezar a construir el portfolio.</p></div>';
      return;
    }
    box.innerHTML = projects.map(project => `<article class="project-row" data-project-id="${esc(project.id)}">
      ${project.cover_url ? `<img src="${esc(project.cover_url)}" alt="${esc(project.title)}">` : '<div class="project-placeholder">Sin imagen</div>'}
      <div><span class="eyebrow">${esc(project.category || 'Proyecto')}</span><h3>${esc(project.title)}</h3><p>${esc(project.description || 'Sin descripción.')}</p><small>${project.is_visible ? 'Visible públicamente' : 'Oculto'}</small></div>
      <div class="project-actions"><button type="button" class="secondary" data-edit-project="${esc(project.id)}">Editar</button><button type="button" class="secondary danger" data-delete-project="${esc(project.id)}">Eliminar</button></div>
    </article>`).join('');
    box.querySelectorAll('[data-edit-project]').forEach(button => button.addEventListener('click', () => openProject(projects.find(p => p.id === button.dataset.editProject))));
    box.querySelectorAll('[data-delete-project]').forEach(button => button.addEventListener('click', () => removeProject(button.dataset.deleteProject)));
  }

  function showTab(name) {
    document.querySelectorAll('[data-client-tab]').forEach(button => button.classList.toggle('is-active', button.dataset.clientTab === name));
    $('profileTab').hidden = name !== 'profile';
    $('projectsTab').hidden = name !== 'projects';
    $('productsTab').hidden = name !== 'products';
    $('themeTab').hidden = name !== 'theme';
    $('settingsTab').hidden = name !== 'settings';
  }

  function renderProductGalleryPreview() {
    const box = $('productGalleryPreview');
    if (!box) return;
    box.innerHTML = [
      ...editingProductMedia.map((item,index) => `<figure><img src="${esc(item.url || item)}" alt="Foto adicional"><button type="button" data-remove-existing-product="${index}" aria-label="Quitar foto">×</button></figure>`),
      ...selectedProductGallery.map((file,index) => `<figure><img src="${esc(file._previewUrl)}" alt="Nueva foto"><button type="button" data-remove-new-product="${index}" aria-label="Quitar foto">×</button></figure>`)
    ].join('');
    box.querySelectorAll('[data-remove-existing-product]').forEach(button => button.addEventListener('click', () => { editingProductMedia.splice(Number(button.dataset.removeExistingProduct),1); renderProductGalleryPreview(); }));
    box.querySelectorAll('[data-remove-new-product]').forEach(button => button.addEventListener('click', () => { selectedProductGallery.splice(Number(button.dataset.removeNewProduct),1); renderProductGalleryPreview(); }));
  }

  function openProduct(item = null) {
    $('productForm').reset();
    $('productId').value = item?.id || '';
    $('productModalTitle').textContent = item ? 'Editar producto' : 'Nuevo producto';
    $('productTitle').value = item?.title || '';
    $('productCategory').value = item?.category || 'Cocina';
    $('productDescription').value = item?.description || '';
    $('productPriceMode').value = item?.price_mode || 'consult';
    $('productPrice').value = item?.price || '';
    $('productPrice').disabled = $('productPriceMode').value !== 'price';
    $('productAvailability').value = item?.availability || 'available';
    $('productFeaturedInput').checked = Boolean(item?.featured);
    $('productVisibleInput').checked = item ? item.is_visible !== false : true;
    $('productImagePreview').src = item?.cover_url || '';
    $('productImagePreview').hidden = !item?.cover_url;
    editingProductMedia = Array.isArray(item?.media) ? item.media.filter(media => !(media && media.isCover)).map(media => typeof media === 'string' ? {url:media} : media) : [];
    selectedProductImage = null;
    selectedProductGallery = [];
    renderProductGalleryPreview();
    $('productFormMessage').textContent = '';
    $('productModal').hidden = false;
  }

  function closeProduct() { $('productModal').hidden = true; selectedProductImage = null; selectedProductGallery = []; editingProductMedia = []; }

  async function removeProduct(id) {
    if (!confirm('¿Eliminar este producto del catálogo?')) return;
    const message = $('productsMessage');
    try {
      message.textContent = 'Eliminando producto…';
      await api('catalog-product-delete',{productId:id});
      products = products.filter(item => item.id !== id);
      renderProducts();
      message.textContent = 'Producto eliminado.';
    } catch (error) { message.textContent = error.message; }
  }


  function renderThemeStudio() {
    const settings = portfolio?.settings || {};
    const colors = themeColors || settings.colors || palettes[selectedPalette] || palettes.gold;
    $('themeAccent').value = colors[0]; $('themeBackground').value = colors[1]; $('themeText').value = colors[2];
    $('themeFont').value = settings.fontStyle || 'elegant';
    $('themeGlow').value = Number(settings.glowIntensity ?? 40);
    if ($('themeLightMode')) $('themeLightMode').value = settings.lightMode || 'ambilight';
    $('themeGlowValue').textContent = `${$('themeGlow').value}%`;
    $('themeShowHeader').checked = settings.showHeader !== false;
    $('themeShowSocials').checked = settings.showSocials !== false;
    $('themeShowWhatsapp').checked = settings.showWhatsapp !== false;
    if ($('themeAmbientTrack')) $('themeAmbientTrack').value = settings.ambientTrack || 'none';
    $('themeTemplateGrid').innerHTML = themes.map(([key,name,use]) => `<button type="button" class="theme-option ${selectedTemplate===key?'is-selected':''}" data-theme-template="${key}"><strong>${name}</strong><span>${use}</span></button>`).join('');
    $('themePaletteGrid').innerHTML = Object.entries(palettes).map(([key,values]) => `<button type="button" class="palette-option ${selectedPalette===key?'is-selected':''}" data-theme-palette="${key}" aria-label="Paleta ${key}">${values.map(color=>`<i style="background:${color}"></i>`).join('')}</button>`).join('');
    $('themeTemplateGrid').querySelectorAll('[data-theme-template]').forEach(btn => btn.addEventListener('click',()=>{ selectedTemplate=btn.dataset.themeTemplate; renderThemeStudio(); updateThemePreview(); }));
    $('themePaletteGrid').querySelectorAll('[data-theme-palette]').forEach(btn => btn.addEventListener('click',()=>{ selectedPalette=btn.dataset.themePalette; const c=palettes[selectedPalette]; themeColors=[...c]; renderThemeStudio(); updateThemePreview(); }));
    updateThemePreview();
  }

  function updateThemePreview() {
    const preview = $('themePreview'); if (!preview || !portfolio) return;
    themeColors=[$('themeAccent').value,$('themeBackground').value,$('themeText').value];
    preview.style.setProperty('--preview-accent',themeColors[0]);
    preview.style.setProperty('--preview-bg',themeColors[1]);
    preview.style.setProperty('--preview-text',themeColors[2]);
    preview.style.setProperty('--preview-glow', `${Number($('themeGlow').value || 40) / 100}`);
    preview.dataset.font = $('themeFont').value;
    $('themeGlowValue').textContent = `${$('themeGlow').value}%`;
    const logoUrl = $('profileLogoPreview')?.src || portfolio.settings?.logoUrl || '';
    const first = projects.find(project => project.cover_url) || {};
    const brand = $('profileBrandName')?.value.trim() || $('profileFullName')?.value.trim() || portfolio.brand_name || portfolio.full_name || 'Tu marca';
    const business = $('profileBusinessType')?.value.trim() || portfolio.business_type || 'Portfolio profesional';
    preview.innerHTML = `${$('themeShowHeader').checked ? `<div class="mini-shell-header"><div class="mini-brand">${logoUrl && !logoUrl.endsWith('/') ? `<img src="${esc(logoUrl)}" alt="">` : `<i>${esc(brand.slice(0,2).toUpperCase())}</i>`}<span>${esc(brand)}</span></div><span class="mini-menu">SOBRE MÍ · SERVICIOS · PROYECTO · EXPERIENCIA</span>${$('themeShowSocials').checked ? '<span class="mini-socials">● ●</span>' : ''}</div>` : ''}<div class="mini-stage premium-v4-preview" style="${first.cover_url?`background-image:url('${esc(first.cover_url)}')`:''}"><b>${esc(first.title || 'FUSION')}</b></div>`;
  }

  async function saveTheme() {
    const message=$('themeMessage'); message.textContent='Guardando diseño…';
    try {
      const colors=themeColors || [$('themeAccent').value,$('themeBackground').value,$('themeText').value];
      const settings={...(portfolio.settings||{}),palette:selectedPalette,colors,instagram:$('profileInstagram').value.trim()||null,facebook:$('profileFacebook').value.trim()||null,fontStyle:$('themeFont').value,glowIntensity:Number($('themeGlow').value),showHeader:$('themeShowHeader').checked,showSocials:$('themeShowSocials').checked,showWhatsapp:$('themeShowWhatsapp').checked,lightMode:$('themeLightMode')?.value||'ambilight',ambientTrack:$('themeAmbientTrack')?.value||'none'};
      const result=await api('portfolio-client-profile-update',{changes:{template_key:selectedTemplate,settings}});
      portfolio=result.portfolio; $('profileTemplate').value=selectedTemplate; message.textContent='Diseño guardado y aplicado al portfolio.'; document.body.dataset.saveState='saved'; $('saveThemeButton').textContent='Cambios guardados';
    } catch(error){message.textContent=error.message;}
  }

  const sectionOptions = (selected='proyecto') => [['inicio','Inicio'],['sobre-mi','Sobre mí'],['servicios','Servicios'],['proyecto','Proyecto'],['experiencia','Experiencia'],['contacto','Contacto']].map(([v,l])=>`<option value="${v}" ${v===selected?'selected':''}>${l}</option>`).join('');

  function mediaItem(item, fallback='proyecto') {
    if (typeof item === 'string') return {url:item, section:fallback};
    return {url:item?.url||item?.publicUrl||item?.src||'', section:item?.section||fallback};
  }

  function renderSlideDestinations() {
    const preview=$('projectSlidesPreview');
    const existing=editingMedia.map((item,idx)=>`<figure class="destination-slide" data-existing-index="${idx}"><img src="${esc(item.url)}" alt="Diapositiva ${idx+2}"><figcaption>${String(idx+2).padStart(2,'0')}</figcaption><label>Destino<select data-existing-section="${idx}">${sectionOptions(item.section)}</select></label></figure>`).join('');
    const fresh=selectedSlideFiles.map((file,idx)=>`<figure class="destination-slide is-new" data-new-index="${idx}"><img src="${esc(file._previewUrl||'')}" alt="Nueva diapositiva"><figcaption>NUEVA</figcaption><label>Destino<select data-new-section="${idx}">${sectionOptions(selectedSlideSections[idx]||'proyecto')}</select></label></figure>`).join('');
    preview.innerHTML=existing+fresh;
    preview.querySelectorAll('[data-existing-section]').forEach(sel=>sel.addEventListener('change',()=>{editingMedia[Number(sel.dataset.existingSection)].section=sel.value;}));
    preview.querySelectorAll('[data-new-section]').forEach(sel=>sel.addEventListener('change',()=>{selectedSlideSections[Number(sel.dataset.newSection)]=sel.value;}));
  }

  function openProject(project = null) {
    $('projectForm').reset();
    $('projectId').value = project?.id || '';
    $('projectModalTitle').textContent = project ? 'Editar proyecto' : 'Nuevo proyecto';
    $('projectTitle').value = project?.title || '';
    $('projectVisible').checked = project ? project.is_visible !== false : true;
    const fallback=String(project?.category||'proyecto').toLowerCase();
    const normalized=['inicio','sobre-mi','servicios','proyecto','experiencia','contacto'].includes(fallback)?fallback:'proyecto';
    const rawMedia=Array.isArray(project?.media)?project.media:[];
    const coverMeta=rawMedia.find(x=>typeof x==='object'&&x?.isCover);
    editingCoverSection=coverMeta?.section||normalized||'inicio';
    $('projectCoverSection').value=editingCoverSection;
    $('projectImagePreview').hidden = !project?.cover_url;
    $('projectImagePreview').src = project?.cover_url || '';
    editingMedia=rawMedia.filter(x=>!(typeof x==='object'&&x?.isCover)).map(x=>mediaItem(x,normalized)).filter(x=>x.url);
    selectedImageFile = null;
    selectedSlideFiles = [];
    selectedSlideSections = [];
    renderSlideDestinations();
    $('projectFormMessage').textContent = '';
    $('projectModal').hidden = false;
  }

  function closeProject() { $('projectModal').hidden = true; selectedImageFile = null; selectedSlideFiles = []; selectedSlideSections=[]; editingMedia=[]; }

  async function removeProject(id) {
    if (!confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.')) return;
    const message = $('projectsMessage');
    try {
      message.textContent = 'Eliminando proyecto…';
      await api('portfolio-client-project-delete', {projectId:id});
      projects = projects.filter(project => project.id !== id);
      renderProjects();
      message.textContent = 'Proyecto eliminado.';
    } catch (error) { message.textContent = error.message; }
  }

  async function initPanel() {
    if (!$('clientProfileForm')) return;
    try {
      const result = await api('portfolio-client-load');
      portfolio = result.portfolio;
      const records = Array.isArray(result.projects) ? result.projects : [];
      products = records.filter(item => item.item_type === 'product');
      projects = records.filter(item => item.item_type !== 'product');
      renderProfile();
      renderProjects();
      renderProducts();
      const publicUrl = `${location.origin}/${portfolio.slug}`;
      if ($('catalogPreviewButton')) $('catalogPreviewButton').href = publicUrl;
    } catch (error) {
      alert(error.message);
      await db.auth.signOut().catch(() => {});
      location.replace('/clientes/');
      return;
    }

    document.querySelectorAll('[data-client-tab]').forEach(button => button.addEventListener('click', () => showTab(button.dataset.clientTab)));

    const markDirty = () => { document.body.dataset.saveState='dirty'; const b=$('saveThemeButton'); if(b) b.textContent='Guardar cambios'; };
    document.querySelectorAll('[data-preview-device]').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('[data-preview-device]').forEach(x=>x.classList.toggle('is-active',x===button));
      $('themePreview').dataset.device=button.dataset.previewDevice;
    }));

    $('clientLogout').addEventListener('click', async () => { await db.auth.signOut(); location.replace('/clientes/'); });
    $('clientProfileForm').addEventListener('submit', async event => {
      event.preventDefault();
      const message = $('profileMessage');
      message.textContent = 'Guardando…';
      try {
        let logoUrl = portfolio.settings?.logoUrl || null;
        if (selectedLogoFile) {
          message.textContent = 'Subiendo logo…';
          const uploadedLogo = await uploadFile(selectedLogoFile);
          logoUrl = uploadedLogo.publicUrl;
        }
        const settings = {...(portfolio.settings||{}),logoUrl,instagram:$('profileInstagram').value.trim()||null,facebook:$('profileFacebook').value.trim()||null};
        const result = await api('portfolio-client-profile-update', {changes:{
          full_name:$('profileFullName').value.trim(), brand_name:$('profileBrandName').value.trim() || null,
          business_type:$('profileBusinessType').value.trim() || null, whatsapp:$('profileWhatsapp').value.trim() || null,
          contact_email:$('profileEmail').value.trim() || null, template_key:$('profileTemplate').value,
          bio:$('profileBio').value.trim() || null, settings
        }});
        portfolio = result.portfolio;
        selectedLogoFile = null;
        renderProfile();
        message.textContent = 'Cambios guardados.';
      } catch (error) { message.textContent = error.message; }
    });
    ['profileFullName','profileBrandName','profileBusinessType','profileBio','profileInstagram','profileFacebook'].forEach(id => $(id)?.addEventListener('input', updateThemePreview));
    $('profileLogo').addEventListener('change', event => {
      selectedLogoFile = event.target.files?.[0] || null;
      if (!selectedLogoFile) return;
      if (selectedLogoFile.size > 10 * 1024 * 1024) { $('profileMessage').textContent='El logo supera los 10 MB.'; event.target.value=''; selectedLogoFile=null; return; }
      $('profileLogoPreview').src = URL.createObjectURL(selectedLogoFile);
      $('profileLogoPreview').style.visibility='visible';
      updateThemePreview();
    });
    $('openProjectModal').addEventListener('click', () => openProject());
    $('openProductModal')?.addEventListener('click', () => openProduct());
    $('saveThemeButton').addEventListener('click', saveTheme);
    ['themeAccent','themeBackground','themeText','themeFont','themeGlow','themeLightMode','themeShowHeader','themeShowSocials','themeShowWhatsapp','themeAmbientTrack'].forEach(id => $(id)?.addEventListener('input', () => { updateThemePreview(); markDirty(); }));
    document.querySelectorAll('[data-close-project]').forEach(button => button.addEventListener('click', closeProject));
    document.querySelectorAll('[data-close-product]').forEach(button => button.addEventListener('click', closeProduct));
    $('productPriceMode')?.addEventListener('change', () => { $('productPrice').disabled = $('productPriceMode').value !== 'price'; if ($('productPrice').disabled) $('productPrice').value=''; });
    $('productImage')?.addEventListener('change', event => {
      selectedProductImage = event.target.files?.[0] || null;
      if (!selectedProductImage) return;
      if (selectedProductImage.size > 10*1024*1024) { $('productFormMessage').textContent='La imagen supera los 10 MB.'; event.target.value=''; selectedProductImage=null; return; }
      $('productImagePreview').src = URL.createObjectURL(selectedProductImage);
      $('productImagePreview').hidden = false;
      $('productFormMessage').textContent = 'Foto principal preparada.';
    });
    $('productGallery')?.addEventListener('change', event => {
      const files = Array.from(event.target.files || []).slice(0,Math.max(0,5-editingProductMedia.length-selectedProductGallery.length));
      files.forEach(file => { if (file.size <= 10*1024*1024) { file._previewUrl=URL.createObjectURL(file); selectedProductGallery.push(file); } });
      event.target.value=''; renderProductGalleryPreview();
    });
    $('productForm')?.addEventListener('submit', async event => {
      event.preventDefault();
      const button=$('saveProductButton'), message=$('productFormMessage'); button.disabled=true;
      try {
        const existing=products.find(item=>item.id===$('productId').value);
        let coverUrl=existing?.cover_url || null;
        if(selectedProductImage){message.textContent='Optimizando y subiendo foto principal…';coverUrl=(await uploadFile(await optimizeCatalogImage(selectedProductImage))).publicUrl;}
        const media=[...editingProductMedia];
        for(let i=0;i<selectedProductGallery.length;i++){message.textContent=`Optimizando y subiendo foto ${i+1} de ${selectedProductGallery.length}…`;const uploaded=await uploadFile(await optimizeCatalogImage(selectedProductGallery[i]));media.push({url:uploaded.publicUrl});}
        if(!coverUrl) throw new Error('Seleccioná una foto principal para el producto.');
        message.textContent='Guardando producto…';
        const result=await api('catalog-product-save',{productId:$('productId').value||null,title:$('productTitle').value.trim(),category:$('productCategory').value,description:$('productDescription').value.trim(),priceMode:$('productPriceMode').value,price:$('productPrice').value||null,availability:$('productAvailability').value,featured:$('productFeaturedInput').checked,isVisible:$('productVisibleInput').checked,coverUrl,media:[{url:coverUrl,isCover:true},...media]});
        const index=products.findIndex(item=>item.id===result.product.id); if(index>=0) products[index]=result.product; else products.unshift(result.product);
        renderProducts();closeProduct();$('productsMessage').textContent='Producto guardado y catálogo actualizado.';
      } catch(error){message.textContent=error.message;} finally{button.disabled=false;}
    });
    $('projectCoverSection').addEventListener('change',()=>{editingCoverSection=$('projectCoverSection').value;});
    $('projectImage').addEventListener('change', event => {
      selectedImageFile = event.target.files?.[0] || null;
      if (!selectedImageFile) return;
      if (selectedImageFile.size > 10 * 1024 * 1024) { $('projectFormMessage').textContent = 'La imagen supera los 10 MB.'; event.target.value = ''; selectedImageFile = null; return; }
      const objectUrl = URL.createObjectURL(selectedImageFile);
      const probe = new Image();
      probe.onload = () => {
        if (probe.naturalWidth !== 1920 || probe.naturalHeight !== 1080) {
          $('projectFormMessage').textContent = `La imagen mide ${probe.naturalWidth} × ${probe.naturalHeight}. Debe ser exactamente 1920 × 1080 px.`;
          event.target.value=''; selectedImageFile=null; $('projectImagePreview').hidden=true; URL.revokeObjectURL(objectUrl); return;
        }
        $('projectFormMessage').textContent = 'Resolución correcta: 1920 × 1080 px.';
        $('projectImagePreview').src = objectUrl; $('projectImagePreview').hidden = false;
      };
      probe.onerror=()=>{ $('projectFormMessage').textContent='No se pudo leer la imagen.'; selectedImageFile=null; event.target.value=''; URL.revokeObjectURL(objectUrl); };
      probe.src=objectUrl;
    });
    $('projectSlides').addEventListener('change', event => {
      const incoming=Array.from(event.target.files||[]);
      if(!incoming.length) return;
      let pending=incoming.length, invalid=false;
      incoming.forEach(file=>{
        if(file.size>10*1024*1024){invalid=true;pending--;return;}
        const objectUrl=URL.createObjectURL(file), probe=new Image();
        probe.onload=()=>{
          if(probe.naturalWidth!==1920||probe.naturalHeight!==1080){invalid=true;$('projectFormMessage').textContent=`${file.name} mide ${probe.naturalWidth} × ${probe.naturalHeight}. Todas deben ser 1920 × 1080 px.`;URL.revokeObjectURL(objectUrl);}
          else {file._previewUrl=objectUrl;selectedSlideFiles.push(file);selectedSlideSections.push('proyecto');}
          pending--; if(!pending){renderSlideDestinations();event.target.value='';if(!invalid)$('projectFormMessage').textContent=`${selectedSlideFiles.length} diapositiva(s) nueva(s) preparada(s). Elegí el destino de cada una.`;}
        };
        probe.onerror=()=>{invalid=true;pending--;URL.revokeObjectURL(objectUrl);if(!pending)renderSlideDestinations();};probe.src=objectUrl;
      });
    });

    $('projectForm').addEventListener('submit', async event => {
      event.preventDefault();
      const button = $('saveProjectButton');
      const message = $('projectFormMessage');
      button.disabled = true;
      try {
        const existingProject = projects.find(p => p.id === $('projectId').value);
        let coverUrl = existingProject?.cover_url || null;
        let media = editingMedia.map(item=>({url:item.url,section:item.section}));
        if (selectedImageFile) {
          message.textContent = 'Subiendo portada…';
          const uploaded = await uploadFile(selectedImageFile);
          coverUrl = uploaded.publicUrl;
        }
        if (selectedSlideFiles.length) {
          for (let i=0;i<selectedSlideFiles.length;i++) {
            message.textContent = `Subiendo diapositiva ${i+1} de ${selectedSlideFiles.length}…`;
            const uploaded = await uploadFile(selectedSlideFiles[i]);
            media.push({url:uploaded.publicUrl,section:selectedSlideSections[i]||'proyecto'});
          }
        }
        message.textContent = 'Guardando proyecto…';
        const result = await api('portfolio-client-project-save', {
          projectId:$('projectId').value || null,
          title:$('projectTitle').value.trim(), category:$('projectCoverSection').value,
          description:'', coverUrl, media:[{url:coverUrl,section:$('projectCoverSection').value,isCover:true},...media],
          isVisible:$('projectVisible').checked
        });
        const index = projects.findIndex(p => p.id === result.project.id);
        if (index >= 0) projects[index] = result.project; else projects.unshift(result.project);
        renderProjects();
        updateThemePreview();
        closeProject();
        $('projectsMessage').textContent = 'Proyecto guardado.';
      } catch (error) { message.textContent = error.message; } finally { button.disabled = false; }
    });
    $('passwordForm').addEventListener('submit', async event => {
      event.preventDefault();
      const message = $('passwordMessage');
      const password = $('newPassword').value;
      message.textContent = 'Actualizando contraseña…';
      const {error} = await db.auth.updateUser({password});
      message.textContent = error ? error.message : 'Contraseña actualizada.';
      if (!error) event.target.reset();
    });
  }

  initLogin();
  initPanel();
})();
