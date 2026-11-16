(() => {
  'use strict';
  // Meta Pixel for CVStudio. Consent is granted by cvstudio-marketing-consent.js.
  // Never load Meta's script or send events before an affirmative opt-in.
  const PIXEL_ID = '1486370042926294';
  const ALLOWED_HOSTS = new Set(['cvstudio.com.ar', 'www.cvstudio.com.ar']);
  let enabled = false;
  let bound = false;
  const allowed = () => ALLOWED_HOSTS.has(location.hostname);
  const consented = () => window.CVStudioCampaignAttribution?.isAnalyticsEnabled?.() === true;
  function event(name, details) {
    if (!enabled || !consented() || typeof window.fbq !== 'function') return false;
    const supported = ['ViewContent', 'Contact', 'Lead'];
    if (!supported.includes(name)) return false;
    const clean = {};
    if (details?.content_category && /^[a-z_-]{1,40}$/i.test(details.content_category)) {
      clean.content_category = details.content_category;
    }
    window.fbq('track', name, clean);
    return true;
  }
  function bindClicks() {
    if (bound) return;
    bound = true;
    document.addEventListener('click', (e) => {
      if (!enabled || !consented()) return;
      const link = e.target.closest?.('a[href]');
      if (!link) return;
      let url;
      try { url = new URL(link.href, location.href); } catch { return; }
      if (['wa.me', 'api.whatsapp.com', 'web.whatsapp.com'].includes(url.hostname)) {
        event('Contact', { content_category: 'whatsapp' });
      } else if (url.origin === location.origin &&
                 (/^\/(?:otros-servicios|cv-profesional|cv-freelance|linkedin-profesional|cv-linkedin|dos-cv-profesionales|preparacion-entrevistas)\//.test(url.pathname))) {
        event('ViewContent', { content_category: url.pathname.startsWith('/otros-servicios') ? 'webs' : 'cv_linkedin' });
      }
    }, { passive: true });
  }
  function enable() {
    if (!allowed() || !consented() || enabled) return false;
    enabled = true;
    // Official Meta Pixel bootstrap, without the noscript image (which would bypass consent).
    !function(f,b,e,v,n,t,s){
      if(f.fbq) return;
      n=f.fbq=function(){n.callMethod ? n.callMethod.apply(n,arguments) : n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=true;n.version='2.0';n.queue=[];
      t=b.createElement(e);t.async=true;t.src=v;
      s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);
    }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
    bindClicks();
    return true;
  }
  window.CVStudioMarketingPixel = { enable, track: event };
})();
