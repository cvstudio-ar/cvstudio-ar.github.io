/* CVStudio SIAC · Configuración de Supabase
   Pegá únicamente la Publishable key. Nunca uses aquí la Secret key. */
window.CVSTUDIO_SUPABASE_URL = 'https://eqepkoegzyqklpxkrkhm.supabase.co';
window.CVSTUDIO_SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZXBrb2Vnenlxa2xweGtya2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NTc1MzcsImV4cCI6MjEwMDQzMzUzN30.dy-gMZJRMTQyr--kCq5JsEaDzazcDXFUkxQdiLQBFx8';

window.cvstudioSupabaseReady = Boolean(
  window.supabase &&
  window.CVSTUDIO_SUPABASE_URL &&
  window.CVSTUDIO_SUPABASE_PUBLISHABLE_KEY &&
  !window.CVSTUDIO_SUPABASE_PUBLISHABLE_KEY.includes('PEGAR_AQUI')
);

window.cvstudioSupabase = window.cvstudioSupabaseReady
  ? window.supabase.createClient(
      window.CVSTUDIO_SUPABASE_URL,
      window.CVSTUDIO_SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: true, autoRefreshToken: true } }
    )
  : null;
