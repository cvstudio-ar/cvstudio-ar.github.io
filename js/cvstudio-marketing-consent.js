(() => {
  'use strict';
  // Solo analítica opcional: no envía datos personales ni estados de pago al navegador.
  const GA_ID='G-BJW9DQGWXV';
  const CONSENT_KEY='cvstudio_analytics_consent_v1';
  const CAMPAIGN_KEY='cvstudio_campaign_session_v1';
  let consent=null;
  try { consent=localStorage.getItem(CONSENT_KEY); } catch {}
  let loaded=false;
  function loadAnalytics(){
    if(loaded||consent!=='accepted')return;
    loaded=true;
    window.CVStudioMarketingPixel?.enable?.();
    window.dataLayer=window.dataLayer||[];
    window.gtag=function(){window.dataLayer.push(arguments)};
    window.gtag('js',new Date());
    window.gtag('config',GA_ID,{anonymize_ip:true});
    const script=document.createElement('script');
    script.async=true;
    script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(GA_ID);
    document.head.append(script);
  }
  const campaignKeys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
  function rememberCampaign(){
    if(consent!=='accepted')return;
    const query=new URLSearchParams(location.search);
    const result={};
    for(const key of campaignKeys){
      const value=(query.get(key)||'').trim();
      if(value&&value.length<=120&&/^[a-z0-9 _.:/-]+$/i.test(value))result[key]=value;
    }
    if(Object.keys(result).length){
      try{sessionStorage.setItem(CAMPAIGN_KEY,JSON.stringify(result))}catch{}
    }
  }
  let clickTrackingBound=false;
  function tracking(){
    if(clickTrackingBound)return;
    if(consent!=='accepted'||typeof window.gtag!=='function')return;
    if(document.documentElement.dataset.cvstudioPage==='webs'){
      clickTrackingBound=true;
      document.addEventListener('click',event=>{
        const link=event.target.closest('a[href]');
        if(!link)return;
        let url;
        try{url=new URL(link.href,location.href)}catch{return}
        if(!['wa.me','api.whatsapp.com','web.whatsapp.com'].includes(url.hostname))return;
        window.gtag('event','whatsapp_click',{page_path:location.pathname,service_group:'webs_personalizadas'});
      });
    }
  }
  function save(choice){
    consent=choice;
    try{localStorage.setItem(CONSENT_KEY,choice)}catch{}
    document.getElementById('cvAnalyticsNotice')?.remove();
    if(choice==='accepted'){rememberCampaign();loadAnalytics();tracking()}
    else{
      try{sessionStorage.removeItem(CAMPAIGN_KEY)}catch{}
      // Una vez cargada una biblioteca de terceros, recargar detiene sus rastreadores activos.
      if(loaded)location.reload();
    }
  }
  function notice(){
    const root=document.createElement('aside');
    root.id='cvAnalyticsNotice';
    root.setAttribute('role','region');
    root.setAttribute('aria-label','Preferencias de medición');
    Object.assign(root.style,{position:'fixed',zIndex:'99999',bottom:'16px',left:'16px',right:'16px',maxWidth:'600px',margin:'auto',background:'#102332',color:'#fff',padding:'18px 20px',borderRadius:'15px',boxShadow:'0 14px 42px #0005',fontFamily:'system-ui,sans-serif'});
    const title=document.createElement('strong');title.textContent='Estadísticas opcionales';
    const text=document.createElement('p');
    text.textContent='Con tu permiso usamos Google Analytics para conocer el uso de nuestra web y mejorar nuestros servicios. Podés rechazarlo y seguir navegando normalmente.';
    Object.assign(text.style,{fontSize:'13px',lineHeight:'1.55',margin:'8px 0 14px'});
    const actions=document.createElement('div');
    Object.assign(actions.style,{display:'flex',gap:'8px',flexWrap:'wrap'});
    const make=(label,choice)=>{
      const button=document.createElement('button');button.type='button';button.textContent=label;
      Object.assign(button.style,{border:'1px solid #b5c8ce',borderRadius:'9px',padding:'9px 14px',fontWeight:'600',cursor:'pointer',background:choice==='accepted'?'#c8e9db':'transparent',color:choice==='accepted'?'#102332':'#fff'});
      button.addEventListener('click',()=>save(choice));return button;
    };
    actions.append(make('Rechazar','rejected'),make('Aceptar estadísticas','accepted'));
    root.append(title,text,actions);
    document.body.append(root);
  }
  function preferences(){
    const button=document.createElement('button');button.type='button';
    button.textContent='Privacidad y estadísticas';button.setAttribute('aria-label','Configurar estadísticas');
    Object.assign(button.style,{position:'fixed',left:'10px',bottom:'8px',zIndex:'9990',fontSize:'11px',borderRadius:'8px',border:'1px solid #b5c8ce',padding:'4px 8px',background:'#fff',color:'#204b44',cursor:'pointer'});
    button.addEventListener('click',()=>notice());
    document.body.append(button);
  }
  window.CVStudioCampaignAttribution={
    getCampaign(){
      if(consent!=='accepted')return null;
      try{return JSON.parse(sessionStorage.getItem(CAMPAIGN_KEY)||'null')}catch{return null}
    },
    isAnalyticsEnabled:()=>consent==='accepted',
    track(name,params={}){
      if(consent!=='accepted'||!loaded||typeof window.gtag!=='function')return false;
      const valid=['web_plan_selected','web_configurator_started','web_checkout_started','web_checkout_created','web_request_prepared','whatsapp_click'];
      if(!valid.includes(name))return false;
      const filtered={};
      for(const key of ['service_group','product_id','payment_provider','payment_stage','currency','source_page']){
        const value=params[key];
        if(typeof value==='string'&&value.length<=80&&/^[a-z0-9_-]+$/i.test(value))filtered[key]=value;
      }
      window.gtag('event',name,filtered);
      return true;
    }
  };
  document.addEventListener('DOMContentLoaded',()=>{
    preferences();
    if(consent==='accepted'){rememberCampaign();loadAnalytics();tracking()}
    else if(consent!=='rejected')notice();

  },{once:true});
})();