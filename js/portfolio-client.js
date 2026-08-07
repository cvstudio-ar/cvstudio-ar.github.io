(() => {
  'use strict';
  const db = window.cvstudioSupabase;
  const worker = String(window.CVSTUDIO_PORTFOLIO_WORKER_URL || '').replace(/\/$/, '');
  const $ = id => document.getElementById(id);
  const usernameEmail = username => `${String(username || '').trim().toLowerCase()}@portfolios.cvstudio.local`;
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  let portfolio = null;
  let projects = [];
  let selectedImageFile = null;
  let selectedSlideFiles = [];
  let selectedSlideSections = [];
  let editingMedia = [];
  let editingCoverSection = 'inicio';
  let selectedLogoFile = null;
  let selectedTemplate = 'lens';
  let selectedPalette = 'gold';
  let themeColors = null;
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
    $('themeTab').hidden = name !== 'theme';
    $('settingsTab').hidden = name !== 'settings';
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
      projects = Array.isArray(result.projects) ? result.projects : [];
      renderProfile();
      renderProjects();
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
    $('saveThemeButton').addEventListener('click', saveTheme);
    ['themeAccent','themeBackground','themeText','themeFont','themeGlow','themeLightMode','themeShowHeader','themeShowSocials','themeShowWhatsapp','themeAmbientTrack'].forEach(id => $(id).addEventListener('input', () => { updateThemePreview(); markDirty(); }));
    document.querySelectorAll('[data-close-project]').forEach(button => button.addEventListener('click', closeProject));
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
