const corsHeaders = origin => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Vary': 'Origin'
});

const json = (body, status = 200, origin = '*') => new Response(JSON.stringify(body), {
  status,
  headers: {...corsHeaders(origin), 'Content-Type': 'application/json; charset=utf-8'}
});

const clean = value => String(value || '').trim();
const usernameEmail = username => `${clean(username).toLowerCase()}@portfolios.cvstudio.local`;
const safeFileName = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 120) || 'archivo';

async function parseResponse(response) {
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) throw new Error(data?.message || data?.error_description || data?.hint || `Supabase ${response.status}`);
  return data;
}

async function sb(env, path, options = {}) {
  const response = await fetch(`${env.SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      ...(options.body instanceof ArrayBuffer || options.body instanceof Uint8Array ? {} : {'Content-Type': 'application/json'}),
      Prefer: options.prefer || 'return=representation',
      ...(options.headers || {})
    }
  });
  return parseResponse(response);
}

async function getAuthUser(request, env) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('Sesión requerida.');
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`}
  });
  const user = await response.json().catch(() => ({}));
  if (!response.ok || !user?.id) throw new Error('La sesión venció. Volvé a ingresar.');
  return user;
}

async function requireAdmin(request, env) {
  const user = await getAuthUser(request, env);
  const allowed = clean(env.ADMIN_EMAILS).toLowerCase().split(',').map(v => v.trim()).filter(Boolean);
  if (!allowed.includes(clean(user.email).toLowerCase())) throw new Error('Esta cuenta no tiene permisos para administrar portfolios.');
  return user;
}

async function requirePortfolioOwner(request, env) {
  const user = await getAuthUser(request, env);
  const rows = await sb(env, `/rest/v1/portfolio_clientes?auth_user_id=eq.${encodeURIComponent(user.id)}&select=*`, {method:'GET'});
  const portfolio = rows?.[0];
  if (!portfolio) throw new Error('No existe un portfolio asociado a esta cuenta.');
  if (portfolio.status === 'suspended') throw new Error('Este portfolio está suspendido. Contactá a CVStudio.');
  return {user, portfolio};
}

async function listClients(env) {
  return sb(env, '/rest/v1/portfolio_clientes?select=*&order=updated_at.desc', {method:'GET'});
}

async function createClient(body, env) {
  const username = clean(body.username).toLowerCase();
  const slug = clean(body.slug).toLowerCase();
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw new Error('Usuario inválido.');
  if (!/^[a-z0-9-]{3,80}$/.test(slug)) throw new Error('URL personalizada inválida.');
  if (clean(body.password).length < 10) throw new Error('La contraseña debe tener al menos 10 caracteres.');

  const auth = await sb(env, '/auth/v1/admin/users', {
    method:'POST',
    body: JSON.stringify({
      email: usernameEmail(username),
      password: body.password,
      email_confirm: true,
      user_metadata: {username, full_name: clean(body.fullName), account_type:'portfolio_client'}
    })
  });
  try {
    const rows = await sb(env, '/rest/v1/portfolio_clientes', {
      method:'POST',
      body: JSON.stringify({
        auth_user_id: auth.id,
        username,
        slug,
        full_name: clean(body.fullName),
        brand_name: clean(body.brandName) || null,
        contact_email: clean(body.contactEmail) || null,
        whatsapp: clean(body.whatsapp) || null,
        business_type: clean(body.businessType) || null,
        bio: clean(body.bio) || null,
        template_key: clean(body.templateKey) || 'creative',
        status: clean(body.status) || 'draft',
        settings: body.settings && typeof body.settings === 'object' ? body.settings : {}
      })
    });
    return rows?.[0];
  } catch (error) {
    await sb(env, `/auth/v1/admin/users/${auth.id}`, {method:'DELETE'}).catch(() => {});
    throw error;
  }
}

async function updateClient(body, env) {
  const allowed = ['status','template_key','full_name','brand_name','contact_email','whatsapp','business_type','bio','slug','settings'];
  const changes = Object.fromEntries(Object.entries(body.changes || {}).filter(([key]) => allowed.includes(key)));
  changes.updated_at = new Date().toISOString();
  const rows = await sb(env, `/rest/v1/portfolio_clientes?id=eq.${encodeURIComponent(body.portfolioId)}`, {method:'PATCH', body:JSON.stringify(changes)});
  return rows?.[0];
}

async function deleteClient(body, env) {
  const portfolioId = clean(body.portfolioId);
  if (!portfolioId) throw new Error('Falta el portfolio.');
  const rows = await sb(env, `/rest/v1/portfolio_clientes?id=eq.${encodeURIComponent(portfolioId)}&select=*`, {method:'GET'});
  const client = rows?.[0];
  if (!client) throw new Error('Portfolio no encontrado.');
  await sb(env, `/rest/v1/portfolio_proyectos?portfolio_id=eq.${encodeURIComponent(portfolioId)}`, {method:'DELETE', prefer:'return=minimal'});
  await sb(env, `/rest/v1/portfolio_clientes?id=eq.${encodeURIComponent(portfolioId)}`, {method:'DELETE', prefer:'return=minimal'});
  if (client.auth_user_id) await sb(env, `/auth/v1/admin/users/${client.auth_user_id}`, {method:'DELETE'}).catch(() => {});
  return {id:portfolioId, username:client.username, slug:client.slug};
}

async function resetPassword(body, env) {
  const rows = await sb(env, `/rest/v1/portfolio_clientes?id=eq.${encodeURIComponent(body.portfolioId)}&select=*`, {method:'GET'});
  const client = rows?.[0];
  if (!client) throw new Error('Portfolio no encontrado.');
  if (clean(body.password).length < 10) throw new Error('La contraseña debe tener al menos 10 caracteres.');
  await sb(env, `/auth/v1/admin/users/${client.auth_user_id}`, {method:'PUT', body:JSON.stringify({password: clean(body.password)})});
  return client;
}

async function listOwnProjects(portfolio, env) {
  return sb(env, `/rest/v1/portfolio_proyectos?portfolio_id=eq.${encodeURIComponent(portfolio.id)}&select=*&order=sort_order.asc,created_at.desc`, {method:'GET'});
}

async function updateOwnProfile(portfolio, body, env) {
  const allowed = ['full_name','brand_name','contact_email','whatsapp','business_type','bio','template_key','settings'];
  const changes = Object.fromEntries(Object.entries(body.changes || {}).filter(([key]) => allowed.includes(key)));
  if (changes.template_key && !['lens','atelier','studio','beauty','barber','tech','local','creative','professional','business','minimal'].includes(changes.template_key)) throw new Error('Plantilla inválida.');
  changes.updated_at = new Date().toISOString();
  const rows = await sb(env, `/rest/v1/portfolio_clientes?id=eq.${encodeURIComponent(portfolio.id)}`, {method:'PATCH', body:JSON.stringify(changes)});
  return rows?.[0];
}

async function saveOwnProject(portfolio, body, env) {
  const payload = {
    portfolio_id: portfolio.id,
    item_type: 'project',
    title: clean(body.title),
    category: clean(body.category) || null,
    description: clean(body.description) || null,
    cover_url: clean(body.coverUrl) || null,
    media: Array.isArray(body.media) ? body.media : [],
    is_visible: body.isVisible !== false,
    updated_at: new Date().toISOString()
  };
  if (!payload.title) throw new Error('El proyecto necesita un título.');
  if (body.projectId) {
    const rows = await sb(env, `/rest/v1/portfolio_proyectos?id=eq.${encodeURIComponent(body.projectId)}&portfolio_id=eq.${encodeURIComponent(portfolio.id)}`, {method:'PATCH', body:JSON.stringify(payload)});
    if (!rows?.[0]) throw new Error('Proyecto no encontrado.');
    return rows[0];
  }
  const rows = await sb(env, '/rest/v1/portfolio_proyectos', {method:'POST', body:JSON.stringify({...payload, sort_order: Number(body.sortOrder) || 0})});
  return rows?.[0];
}

async function saveOwnProduct(portfolio, body, env) {
  const priceMode = clean(body.priceMode) === 'price' ? 'price' : 'consult';
  const availability = ['available','last_units','coming_soon','sold_out'].includes(clean(body.availability)) ? clean(body.availability) : 'available';
  const rawPrice = body.price === null || body.price === '' ? null : Number(body.price);
  if (priceMode === 'price' && (!Number.isFinite(rawPrice) || rawPrice < 0)) throw new Error('Ingresá un precio válido.');
  const payload = {
    portfolio_id: portfolio.id,
    item_type: 'product',
    title: clean(body.title),
    category: clean(body.category) || 'Otros',
    description: clean(body.description) || null,
    cover_url: clean(body.coverUrl) || null,
    media: Array.isArray(body.media) ? body.media.slice(0, 6) : [],
    price: priceMode === 'price' ? rawPrice : null,
    price_mode: priceMode,
    availability,
    featured: body.featured === true,
    is_visible: body.isVisible !== false,
    updated_at: new Date().toISOString()
  };
  if (!payload.title) throw new Error('El producto necesita un nombre.');
  if (!payload.cover_url) throw new Error('El producto necesita una foto principal.');
  if (body.productId) {
    const rows = await sb(env, `/rest/v1/portfolio_proyectos?id=eq.${encodeURIComponent(body.productId)}&portfolio_id=eq.${encodeURIComponent(portfolio.id)}&item_type=eq.product`, {method:'PATCH', body:JSON.stringify(payload)});
    if (!rows?.[0]) throw new Error('Producto no encontrado.');
    return rows[0];
  }
  const rows = await sb(env, '/rest/v1/portfolio_proyectos', {method:'POST', body:JSON.stringify({...payload,sort_order:Number(body.sortOrder)||0})});
  return rows?.[0];
}

async function deleteOwnProduct(portfolio, body, env) {
  const productId = clean(body.productId);
  if (!productId) throw new Error('Falta el producto.');
  const rows = await sb(env, `/rest/v1/portfolio_proyectos?id=eq.${encodeURIComponent(productId)}&portfolio_id=eq.${encodeURIComponent(portfolio.id)}&item_type=eq.product&select=*`, {method:'GET'});
  if (!rows?.[0]) throw new Error('Producto no encontrado.');
  await sb(env, `/rest/v1/portfolio_proyectos?id=eq.${encodeURIComponent(productId)}&portfolio_id=eq.${encodeURIComponent(portfolio.id)}&item_type=eq.product`, {method:'DELETE',prefer:'return=minimal'});
  return rows[0];
}

async function deleteOwnProject(portfolio, body, env) {
  const projectId = clean(body.projectId);
  if (!projectId) throw new Error('Falta el proyecto.');
  const rows = await sb(env, `/rest/v1/portfolio_proyectos?id=eq.${encodeURIComponent(projectId)}&portfolio_id=eq.${encodeURIComponent(portfolio.id)}&select=*`, {method:'GET'});
  const project = rows?.[0];
  if (!project) throw new Error('Proyecto no encontrado.');
  await sb(env, `/rest/v1/portfolio_proyectos?id=eq.${encodeURIComponent(projectId)}&portfolio_id=eq.${encodeURIComponent(portfolio.id)}`, {method:'DELETE', prefer:'return=minimal'});
  return project;
}

async function uploadOwnMedia(portfolio, request, env) {
  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.includes('multipart/form-data')) throw new Error('La carga debe enviarse como formulario.');
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) throw new Error('Seleccioná una imagen.');
  const allowed = new Set(['image/jpeg','image/png','image/webp']);
  if (!allowed.has(file.type)) throw new Error('Formato no permitido. Usá JPG, PNG o WebP.');
  const maxBytes = Number(env.MAX_UPLOAD_BYTES || 10485760);
  if (file.size > maxBytes) throw new Error(`La imagen supera el máximo de ${Math.round(maxBytes / 1048576)} MB.`);
  const extension = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${portfolio.auth_user_id}/${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name.replace(/\.[^.]+$/, ''))}.${extension}`;
  const response = await fetch(`${env.SUPABASE_URL}/storage/v1/object/portfolio-media/${encodeURI(path)}`, {
    method:'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': file.type,
      'x-upsert': 'false'
    },
    body: await file.arrayBuffer()
  });
  await parseResponse(response);
  const publicUrl = `${env.SUPABASE_URL}/storage/v1/object/public/portfolio-media/${encodeURI(path)}`;
  return {path, publicUrl, type:file.type, size:file.size, name:file.name};
}

async function publicPortfolio(url, env) {
  const slug = clean(url.searchParams.get('slug')).toLowerCase();
  if (!slug) throw new Error('Falta la dirección del portfolio.');
  const rows = await sb(env, `/rest/v1/portfolio_clientes?slug=eq.${encodeURIComponent(slug)}&status=eq.active&select=id,slug,full_name,brand_name,contact_email,whatsapp,business_type,bio,template_key,settings,updated_at`, {method:'GET'});
  const portfolio = rows?.[0];
  if (!portfolio) return null;
  const projects = await sb(env, `/rest/v1/portfolio_proyectos?portfolio_id=eq.${portfolio.id}&is_visible=eq.true&select=id,title,description,category,cover_url,media,sort_order,item_type,price,price_mode,availability,featured&order=featured.desc,sort_order.asc,created_at.desc`, {method:'GET'});
  return {...portfolio, projects: projects || []};
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '*';
    if (request.method === 'OPTIONS') return new Response(null, {status:204, headers:corsHeaders(origin)});
    try {
      if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.SUPABASE_ANON_KEY) throw new Error('Faltan variables del Worker.');
      const url = new URL(request.url);
      if (request.method === 'GET' && url.pathname === '/health') return json({ok:true, service:'cvstudio-portfolios'}, 200, origin);
      if (request.method === 'GET' && url.pathname === '/api/public/portfolio') {
        const portfolio = await publicPortfolio(url, env);
        return portfolio ? json({ok:true, portfolio}, 200, origin) : json({ok:false, message:'Portfolio no disponible.'}, 404, origin);
      }
      if (request.method === 'POST' && url.pathname === '/api/client/upload') {
        const {portfolio} = await requirePortfolioOwner(request, env);
        return json({ok:true, file:await uploadOwnMedia(portfolio, request, env)}, 201, origin);
      }
      if (request.method !== 'POST') return json({ok:false, message:'Ruta no encontrada.'}, 404, origin);
      const body = await request.json().catch(() => ({}));

      if (url.pathname === '/api/admin') {
        await requireAdmin(request, env);
        if (body.action === 'portfolio-admin-list') return json({ok:true, clients:await listClients(env)}, 200, origin);
        if (body.action === 'portfolio-admin-create') return json({ok:true, client:await createClient(body, env)}, 201, origin);
        if (body.action === 'portfolio-admin-update') return json({ok:true, client:await updateClient(body, env)}, 200, origin);
        if (body.action === 'portfolio-admin-reset-password') return json({ok:true, client:await resetPassword(body, env)}, 200, origin);
        if (body.action === 'portfolio-admin-delete') return json({ok:true, deleted:await deleteClient(body, env)}, 200, origin);
        if (body.action === 'portfolio-admin-test') {
          const admin = await requireAdmin(request, env);
          const clients = await sb(env, '/rest/v1/portfolio_clientes?select=id&limit=1000', {method:'GET'});
          const projects = await sb(env, '/rest/v1/portfolio_proyectos?select=id&limit=1000', {method:'GET'});
          return json({ok:true, admin:{id:admin.id,email:admin.email}, database:{clients:clients?.length||0,projects:projects?.length||0}, checkedAt:new Date().toISOString()}, 200, origin);
        }
        return json({ok:false, message:'Acción administrativa no reconocida.'}, 400, origin);
      }

      if (url.pathname === '/api/client') {
        const {portfolio} = await requirePortfolioOwner(request, env);
        if (body.action === 'portfolio-client-load') return json({ok:true, portfolio, projects:await listOwnProjects(portfolio, env)}, 200, origin);
        if (body.action === 'portfolio-client-profile-update') return json({ok:true, portfolio:await updateOwnProfile(portfolio, body, env)}, 200, origin);
        if (body.action === 'portfolio-client-project-save') return json({ok:true, project:await saveOwnProject(portfolio, body, env)}, body.projectId ? 200 : 201, origin);
        if (body.action === 'portfolio-client-project-delete') return json({ok:true, project:await deleteOwnProject(portfolio, body, env)}, 200, origin);
        if (body.action === 'catalog-product-save') return json({ok:true, product:await saveOwnProduct(portfolio, body, env)}, body.productId ? 200 : 201, origin);
        if (body.action === 'catalog-product-delete') return json({ok:true, product:await deleteOwnProduct(portfolio, body, env)}, 200, origin);
        return json({ok:false, message:'Acción de cliente no reconocida.'}, 400, origin);
      }

      return json({ok:false, message:'Ruta no encontrada.'}, 404, origin);
    } catch (error) {
      const message = error?.message || 'Error interno.';
      const status = /sesión|permisos|suspendido/i.test(message) ? 401 : 400;
      return json({ok:false, message}, status, origin);
    }
  }
};
