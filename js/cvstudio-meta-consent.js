(() => {
  'use strict';
  // Optional measurement: Meta Pixel, Google Analytics and Microsoft Clarity.
  // None of these third-party tools may load before affirmative consent.
  const PIXEL_ID = '1486370042926294';
  const STORAGE_KEY = 'cvstudio_measurement_consent_v1';
  const GA_ID = 'G-BJW9DQGWXV';
  const CLARITY_ID = 'xs8qlx3zqn';
  const ALLOWED_HOSTS = new Set(['cvstudio.com.ar', 'www.cvstudio.com.ar']);
  const META_URL = 'https://connect.facebook.net/en_US/fbevents.js';
  if (!ALLOWED_HOSTS.has(location.hostname)) return;

  let choice = null;
  try { choice = localStorage.getItem(STORAGE_KEY); } catch {}
  let initialized = false;
  let clickListenerAdded = false;
  function initAnalytics() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.append(script);
  }
  function initClarity() {
    // The Clarity loader is created only after consent, not in the page HTML.
    window.clarity = window.clarity || function () {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.clarity.ms/tag/' + CLARITY_ID;
    document.head.append(script);
  }

  function persist(value) {
    choice = value;
    try { localStorage.setItem(STORAGE_KEY, value); } catch {}
    document.getElementById('cvMetaConsent')?.remove();
    if (value === 'accepted') activate();
    else if (initialized) location.reload(); // Stop an already loaded third-party script.
  }

  function track(eventName, category) {
    if (!initialized || choice !== 'accepted' || typeof window.fbq !== 'function') return false;
    if (!['ViewContent', 'Contact'].includes(eventName)) return false;
    if (!['webs', 'cv_linkedin', 'whatsapp'].includes(category)) return false;
    window.fbq('track', eventName, { content_category: category });
    return true;
  }

  function clicks() {
    if (clickListenerAdded) return;
    clickListenerAdded = true;
    document.addEventListener('click', (event) => {
      if (choice !== 'accepted') return;
      const anchor = event.target.closest?.('a[href]');
      if (!anchor) return;
      let url;
      try { url = new URL(anchor.href, location.href); } catch { return; }
      if (['wa.me', 'api.whatsapp.com', 'web.whatsapp.com'].includes(url.hostname)) {
        track('Contact', 'whatsapp');
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'whatsapp_click', { contact_method: 'whatsapp' });
        }
      } else if (url.origin === location.origin) {
        if (/^\/otros-servicios\/?/.test(url.pathname)) track('ViewContent', 'webs');
        else if (/^\/(cv-profesional|cv-freelance|linkedin-profesional|cv-linkedin|dos-cv-profesionales|preparacion-entrevistas)\/?/.test(url.pathname)) {
          track('ViewContent', 'cv_linkedin');
        }
      }
    }, { passive: true });
  }

  function activate() {
    if (initialized || choice !== 'accepted') return;
    initialized = true;
    // Official Meta Pixel browser bootstrap. No noscript beacon: consent is required.
    !function(f,b,e,v,n,t,s) {
      if (f.fbq) return;
      n=f.fbq=function(){n.callMethod ? n.callMethod.apply(n,arguments) : n.queue.push(arguments)};
      if(!f._fbq) f._fbq=n;
      n.push=n; n.loaded=true; n.version='2.0'; n.queue=[];
      t=b.createElement(e); t.async=true; t.src=v;
      s=b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t,s);
    }(window,document,'script',META_URL);
    if (typeof window.fbq === 'function') {
      window.fbq('init', PIXEL_ID);
      window.fbq('track', 'PageView');
    }
    initAnalytics();
    initClarity();
    clicks();
  }

  function prompt() {
    if (document.getElementById('cvMetaConsent')) return;
    const panel = document.createElement('aside');
    panel.id = 'cvMetaConsent';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'Preferencias de medición');
    Object.assign(panel.style, {
      position:'fixed',bottom:'48px',left:'16px',right:'16px',margin:'auto',
      maxWidth:'500px',maxHeight:'min(70vh, 390px)',overflowY:'auto',boxSizing:'border-box',background:'#10192e',color:'#fff',padding:'18px',
      border:'1px solid #53617d',borderRadius:'14px',zIndex:'2147483000',
      font:'14px/1.5 system-ui,sans-serif',boxShadow:'0 12px 42px #0008'
    });
    const heading = document.createElement('strong');
    heading.textContent = 'Estadísticas y medición (opcional)';
    const description = document.createElement('p');
    description.textContent = 'Solo si aceptás, utilizaremos Meta Pixel, Google Analytics y Microsoft Clarity para medir visitas, clics y mejorar nuestros servicios. Clarity también puede registrar interacciones de navegación. Podés rechazarlo y seguir usando la web normalmente.';
    Object.assign(description.style,{margin:'10px 0',fontSize:'13px'});
    const buttons = document.createElement('div');
    Object.assign(buttons.style,{display:'flex',gap:'10px',flexWrap:'wrap'});
    for (const [label, value] of [['Rechazar', 'rejected'], ['Aceptar medición', 'accepted']]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      Object.assign(button.style,{padding:'9px 14px',borderRadius:'9px',border:'1px solid #b5c8ce',cursor:'pointer',
        background:value==='accepted'?'#ffd45c':'#20334a',color:value==='accepted'?'#111':'#fff',fontWeight:'700'});
      button.addEventListener('click',()=>persist(value));
      buttons.append(button);
    }
    panel.append(heading, description, buttons);
    document.body.append(panel);
  }

  function preferences() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Privacidad y estadísticas';
    btn.setAttribute('aria-label', 'Cambiar consentimiento de medición');
    Object.assign(btn.style,{position:'fixed',left:'10px',bottom:'8px',zIndex:'2147482999',
      font:'11px system-ui,sans-serif',background:'#fff',color:'#15223b',
      border:'1px solid #8997a7',borderRadius:'8px',padding:'5px 9px',cursor:'pointer'});
    btn.addEventListener('click',prompt);
    document.body.append(btn);
  }

  document.addEventListener('DOMContentLoaded', () => {
    preferences();
    if (choice === 'accepted') activate();
    else if (choice !== 'rejected') prompt();
  }, { once: true });
})();
