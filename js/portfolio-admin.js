(() => {
  'use strict';

  const WORKER_URL = window.CVSTUDIO_PORTFOLIO_WORKER_URL;
  const db = window.cvstudioSupabase;
  const $ = id => document.getElementById(id);
  const tabs = [...document.querySelectorAll('[data-admin-module]')];
  const conversationsModule = $('conversationsModule');
  const portfoliosModule = $('portfoliosModule');
  const testsModule = $('testsModule');
  const paymentsModule = $('paymentsModule');
  const createModal = $('portfolioCreateModal');
  const credentialsModal = $('portfolioCredentialsModal');
  const createForm = $('portfolioCreateForm');
  const clientsBox = $('portfolioClients');
  const statsBox = $('portfolioStats');
  const panelMessage = $('portfolioPanelMessage');
  const search = $('portfolioSearch');
  const statusFilter = $('portfolioStatusFilter');
  let clients = [];
  let lastCredentials = null;
  let loadedOnce = false;

  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]));
  const normalizeUsername = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9._-]+/g, '').slice(0, 40);
  const normalizeSlug = value => String(value || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  const statusLabel = value => ({active:'Activo',draft:'Borrador',suspended:'Suspendido'}[value] || value || 'Borrador');
  const templateLabel = value => ({lens:'LENS / Fotografía',atelier:'ATELIER / Moda',studio:'STUDIO / Creativos',beauty:'BEAUTY / Estética',barber:'BARBER / Barbería',tech:'TECH / Tecnología',local:'LOCAL / Comercios',creative:'Creativa / visual',professional:'Profesional / consultor',business:'Emprendimiento / comercio',minimal:'Minimalista'}[value] || value || 'Sin definir');

  function showModule(name) {
    const portfolios = name === 'portfolios';
    const tests = name === 'tests';
    const payments = name === 'payments';
    conversationsModule.hidden = portfolios || tests || payments;
    portfoliosModule.hidden = !portfolios;
    testsModule.hidden = !tests;
    if (paymentsModule) paymentsModule.hidden = !payments;
    tabs.forEach(tab => tab.classList.toggle('is-active', tab.dataset.adminModule === name));
    if (portfolios && !loadedOnce) loadClients();
    if (payments) document.dispatchEvent(new CustomEvent('cvstudio:payments-open'));
  }

  async function api(action, payload = {}) {
    const { data: { session } } = await db.auth.getSession();
    if (!session?.access_token) throw new Error('La sesión administrativa venció. Volvé a ingresar.');
    const response = await fetch(`${WORKER_URL}/api/admin`, {
      method: 'POST',
      headers: {'Content-Type':'application/json', Authorization:`Bearer ${session.access_token}`},
      body: JSON.stringify({action, ...payload})
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.message || 'No se pudo completar la operación.');
    return result;
  }

  function renderStats() {
    const total = clients.length;
    const active = clients.filter(c => c.status === 'active').length;
    const draft = clients.filter(c => c.status === 'draft').length;
    const suspended = clients.filter(c => c.status === 'suspended').length;
    statsBox.innerHTML = [
      ['Total', total], ['Activos', active], ['Borradores', draft], ['Suspendidos', suspended]
    ].map(([label, value]) => `<article class="portfolio-stat"><span>${label}</span><strong>${value}</strong></article>`).join('');
  }

  function filteredClients() {
    const term = search.value.trim().toLowerCase();
    const state = statusFilter.value;
    return clients.filter(client => {
      const haystack = [client.full_name, client.brand_name, client.username, client.slug, client.business_type].join(' ').toLowerCase();
      return (!term || haystack.includes(term)) && (!state || client.status === state);
    });
  }

  function renderClients() {
    renderStats();
    const rows = filteredClients();
    if (!rows.length) {
      clientsBox.innerHTML = `<div class="portfolio-empty">${clients.length ? 'No hay portfolios que coincidan con la búsqueda.' : 'Todavía no creaste ningún portfolio de cliente.'}</div>`;
      return;
    }
    clientsBox.innerHTML = rows.map(client => {
      const publicUrl = `https://cvstudio.com.ar/${client.slug}`;
      const clientLoginUrl = 'https://cvstudio.com.ar/clientes/';
      return `<article class="portfolio-client-card" data-portfolio-id="${esc(client.id)}">
        <header class="portfolio-client-head">
          <div><h2>${esc(client.brand_name || client.full_name)}</h2><p>${esc(client.full_name)} · @${esc(client.username)}</p></div>
          <span class="portfolio-status" data-status="${esc(client.status)}">${esc(statusLabel(client.status))}</span>
        </header>
        <div class="portfolio-client-grid">
          <div><span>URL pública</span><a href="${esc(publicUrl)}" target="_blank" rel="noopener">cvstudio.com.ar/${esc(client.slug)}</a></div>
          <div><span>Plantilla</span><strong>${esc(templateLabel(client.template_key))}</strong></div>
          <div><span>Actividad</span><strong>${esc(client.business_type || 'Sin definir')}</strong></div>
          <div><span>WhatsApp</span><strong>${esc(client.whatsapp || 'Sin definir')}</strong></div>
        </div>
        <div class="portfolio-client-actions">
          <select class="portfolio-inline-select" data-portfolio-status="${esc(client.id)}" aria-label="Estado de ${esc(client.full_name)}">
            <option value="draft" ${client.status==='draft'?'selected':''}>Borrador</option>
            <option value="active" ${client.status==='active'?'selected':''}>Activo</option>
            <option value="suspended" ${client.status==='suspended'?'selected':''}>Suspendido</option>
          </select>
          <button type="button" class="secondary-button" data-copy-url="${esc(publicUrl)}">Copiar portfolio</button>
          <button type="button" class="secondary-button" data-copy-client-access="${esc(clientLoginUrl)}">Copiar acceso cliente</button>
          <button type="button" class="secondary-button" data-reset-password="${esc(client.id)}" data-username="${esc(client.username)}">Nueva contraseña</button>
          <a href="${esc(clientLoginUrl)}" target="_blank" rel="noopener">Abrir panel cliente</a>
          <a href="${esc(publicUrl)}" target="_blank" rel="noopener">Ver portfolio</a>
          <button type="button" class="danger-button" data-delete-portfolio="${esc(client.id)}" data-client-name="${esc(client.brand_name || client.full_name)}">Eliminar cliente</button>
        </div>
      </article>`;
    }).join('');

    clientsBox.querySelectorAll('[data-portfolio-status]').forEach(select => {
      select.addEventListener('change', async () => {
        const oldValue = clients.find(c => c.id === select.dataset.portfolioStatus)?.status;
        select.disabled = true;
        try {
          await api('portfolio-admin-update', {portfolioId: select.dataset.portfolioStatus, changes: {status: select.value}});
          const client = clients.find(c => c.id === select.dataset.portfolioStatus);
          if (client) client.status = select.value;
          renderClients();
        } catch (error) {
          select.value = oldValue || 'draft';
          panelMessage.textContent = error.message;
        } finally {
          select.disabled = false;
        }
      });
    });
    clientsBox.querySelectorAll('[data-copy-url]').forEach(button => button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(button.dataset.copyUrl);
      const original = button.textContent;
      button.textContent = 'Enlace copiado';
      setTimeout(() => button.textContent = original, 1400);
    }));
    clientsBox.querySelectorAll('[data-copy-client-access]').forEach(button => button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(button.dataset.copyClientAccess);
      const original = button.textContent;
      button.textContent = 'Acceso copiado';
      setTimeout(() => button.textContent = original, 1400);
    }));
    clientsBox.querySelectorAll('[data-delete-portfolio]').forEach(button => button.addEventListener('click', async () => {
      const clientName = button.dataset.clientName || 'este cliente';
      const firstConfirm = confirm(`Vas a eliminar permanentemente ${clientName}, sus proyectos y su acceso. ¿Querés continuar?`);
      if (!firstConfirm) return;
      const typed = prompt(`Para confirmar, escribí ELIMINAR:`);
      if (typed !== 'ELIMINAR') {
        panelMessage.textContent = 'Eliminación cancelada: la confirmación no coincide.';
        return;
      }
      button.disabled = true;
      const original = button.textContent;
      button.textContent = 'Eliminando…';
      try {
        await api('portfolio-admin-delete', {portfolioId: button.dataset.deletePortfolio});
        clients = clients.filter(c => c.id !== button.dataset.deletePortfolio);
        panelMessage.textContent = `${clientName} fue eliminado correctamente.`;
        renderClients();
      } catch (error) {
        panelMessage.textContent = error.message;
        button.disabled = false;
        button.textContent = original;
      }
    }));

    clientsBox.querySelectorAll('[data-reset-password]').forEach(button => button.addEventListener('click', async () => {
      const password = generatePassword();
      if (!confirm(`Se generará una nueva contraseña para @${button.dataset.username}. ¿Continuar?`)) return;
      button.disabled = true;
      try {
        const result = await api('portfolio-admin-reset-password', {portfolioId: button.dataset.resetPassword, password});
        showCredentials({username: result.client.username, password, publicUrl:`https://cvstudio.com.ar/${result.client.slug}`, loginUrl:'https://cvstudio.com.ar/clientes/'});
      } catch (error) {
        panelMessage.textContent = error.message;
      } finally { button.disabled = false; }
    }));
  }

  async function loadClients() {
    loadedOnce = true;
    panelMessage.textContent = 'Cargando portfolios…';
    clientsBox.innerHTML = '<div class="portfolio-empty">Cargando…</div>';
    try {
      const result = await api('portfolio-admin-list');
      clients = Array.isArray(result.clients) ? result.clients : [];
      panelMessage.textContent = '';
      renderClients();
    } catch (error) {
      clients = [];
      panelMessage.textContent = error.message;
      clientsBox.innerHTML = '<div class="portfolio-empty">No se pudo cargar el módulo. Verificá que el SQL y el Worker de portfolios estén instalados.</div>';
      renderStats();
    }
  }


  function setTestState(key, state, detail) {
    const status = $(`test${key}Status`);
    const detailNode = $(`test${key}Detail`);
    const card = document.querySelector(`[data-test-card="${key.toLowerCase()}"]`);
    status.textContent = state === 'ok' ? 'Correcto' : state === 'running' ? 'Probando…' : 'Error';
    detailNode.textContent = detail;
    card.dataset.state = state;
  }

  function appendTestLog(label, data) {
    const log = $('adminTestLog');
    const stamp = new Date().toLocaleTimeString('es-AR');
    const text = `[${stamp}] ${label}\n${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}\n\n`;
    log.textContent = log.textContent === 'Todavía no se ejecutaron pruebas.' ? text : log.textContent + text;
    log.scrollTop = log.scrollHeight;
  }

  async function runAdminTests() {
    const button = $('runAdminTests');
    button.disabled = true;
    ['Worker','Auth','Supabase'].forEach(key => setTestState(key, 'running', 'Ejecutando prueba…'));
    try {
      const response = await fetch(`${WORKER_URL}/health`, {cache:'no-store'});
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.message || `HTTP ${response.status}`);
      setTestState('Worker', 'ok', `${data.service || 'Servicio'} disponible.`);
      appendTestLog('WORKER /health', data);
    } catch (error) { setTestState('Worker', 'error', error.message); appendTestLog('WORKER ERROR', error.message); }
    try {
      const result = await api('portfolio-admin-test');
      setTestState('Auth', 'ok', `Administrador validado: ${result.admin?.email || 'sesión activa'}.`);
      setTestState('Supabase', 'ok', `${result.database?.clients ?? 0} clientes y ${result.database?.projects ?? 0} proyectos accesibles.`);
      appendTestLog('ADMIN + SUPABASE', result);
    } catch (error) {
      setTestState('Auth', 'error', error.message);
      setTestState('Supabase', 'error', 'No fue posible completar la consulta autenticada.');
      appendTestLog('ADMIN TEST ERROR', error.message);
    } finally { button.disabled = false; }
  }

  function generatePassword() {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const nums = '23456789';
    const symbols = '!@#$%';
    const all = upper + lower + nums + symbols;
    const pick = chars => chars[crypto.getRandomValues(new Uint32Array(1))[0] % chars.length];
    let password = pick(upper) + pick(lower) + pick(nums) + pick(symbols);
    while (password.length < 14) password += pick(all);
    return [...password].sort(() => crypto.getRandomValues(new Uint32Array(1))[0] / 2**32 - .5).join('');
  }

  function openCreate() {
    createForm.reset();
    $('portfolioInitialStatus').value = 'draft';
    $('portfolioTemplate').value = 'creative';
    $('portfolioPassword').value = generatePassword();
    $('portfolioSlugPreview').textContent = 'cliente';
    $('portfolioCreateMessage').textContent = '';
    createModal.hidden = false;
    setTimeout(() => $('portfolioFullName').focus(), 50);
  }
  function closeCreate() { createModal.hidden = true; }
  function closeCredentials() { credentialsModal.hidden = true; }

  function showCredentials(data) {
    lastCredentials = data;
    $('credentialUsername').textContent = data.username;
    $('credentialPassword').textContent = data.password;
    $('credentialLoginUrl').innerHTML = `<a href="${esc(data.loginUrl)}" target="_blank" rel="noopener">${esc(data.loginUrl)}</a>`;
    $('credentialPublicUrl').innerHTML = `<a href="${esc(data.publicUrl)}" target="_blank" rel="noopener">${esc(data.publicUrl)}</a>`;
    credentialsModal.hidden = false;
  }

  tabs.forEach(tab => tab.addEventListener('click', () => showModule(tab.dataset.adminModule)));
  $('openPortfolioCreate').addEventListener('click', openCreate);
  $('refreshPortfolios').addEventListener('click', loadClients);
  $('runAdminTests').addEventListener('click', runAdminTests);
  $('clearAdminTestLog').addEventListener('click', () => $('adminTestLog').textContent = 'Todavía no se ejecutaron pruebas.');
  search.addEventListener('input', renderClients);
  statusFilter.addEventListener('change', renderClients);
  document.querySelectorAll('[data-close-portfolio-create]').forEach(el => el.addEventListener('click', closeCreate));
  document.querySelectorAll('[data-close-portfolio-credentials]').forEach(el => el.addEventListener('click', closeCredentials));

  $('portfolioFullName').addEventListener('input', event => {
    if (!$('portfolioUsername').dataset.touched) $('portfolioUsername').value = normalizeUsername(event.target.value.replace(/\s+/g, '.'));
    if (!$('portfolioSlug').dataset.touched) {
      $('portfolioSlug').value = normalizeSlug(event.target.value);
      $('portfolioSlugPreview').textContent = $('portfolioSlug').value || 'cliente';
    }
  });
  $('portfolioUsername').addEventListener('input', event => { event.target.dataset.touched = '1'; event.target.value = normalizeUsername(event.target.value); });
  $('portfolioSlug').addEventListener('input', event => { event.target.dataset.touched = '1'; event.target.value = normalizeSlug(event.target.value); $('portfolioSlugPreview').textContent = event.target.value || 'cliente'; });

  createForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = $('createPortfolioClient');
    const message = $('portfolioCreateMessage');
    const payload = {
      fullName: $('portfolioFullName').value.trim(),
      brandName: $('portfolioBrandName').value.trim(),
      username: normalizeUsername($('portfolioUsername').value),
      slug: normalizeSlug($('portfolioSlug').value),
      contactEmail: $('portfolioContactEmail').value.trim(),
      whatsapp: $('portfolioWhatsapp').value.trim(),
      businessType: $('portfolioBusinessType').value.trim(),
      templateKey: $('portfolioTemplate').value,
      status: $('portfolioInitialStatus').value,
      password: $('portfolioPassword').value,
      bio: $('portfolioBio').value.trim(),
      settings:{instagram:$('portfolioInstagram').value.trim()||null,facebook:$('portfolioFacebook').value.trim()||null,logoUrl:$('portfolioLogoUrl').value.trim()||null,palette:'custom',colors:[$('portfolioNeonColor').value,'#07070b','#f7f7fa'],fontStyle:$('portfolioFontStyle').value,glowIntensity:Number($('portfolioGlowIntensity').value),showHeader:true,showSocials:true,showThumbs:true,showCounter:true,showArrows:true,showWhatsapp:true} 
    };
    button.disabled = true;
    message.textContent = 'Creando usuario y portfolio…';
    try {
      const result = await api('portfolio-admin-create', payload);
      clients.unshift(result.client);
      renderClients();
      closeCreate();
      showCredentials({username: result.client.username, password: payload.password, loginUrl:'https://cvstudio.com.ar/clientes/', publicUrl:`https://cvstudio.com.ar/${result.client.slug}`});
    } catch (error) {
      message.textContent = error.message;
    } finally { button.disabled = false; }
  });

  $('copyPortfolioCredentials').addEventListener('click', async () => {
    if (!lastCredentials) return;
    const text = `Acceso a tu portfolio CVStudio\nUsuario: ${lastCredentials.username}\nContraseña inicial: ${lastCredentials.password}\nIngresar: ${lastCredentials.loginUrl}\nPortfolio: ${lastCredentials.publicUrl}`;
    await navigator.clipboard.writeText(text);
    $('copyPortfolioCredentials').textContent = 'Datos copiados';
    setTimeout(() => $('copyPortfolioCredentials').textContent = 'Copiar datos', 1500);
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!credentialsModal.hidden) closeCredentials();
    else if (!createModal.hidden) closeCreate();
  });
})();
