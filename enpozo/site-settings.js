'use strict';
(()=>{
const themes={green:['#153c43','#102f35'],blue:['#173d69','#102944'],graphite:['#343a40','#22272c'],black:['#161616','#070707']};
const icons={
 youtube:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 7c-.3-2-1.3-3-3-3H5C3.3 4 2.3 5 2 7v10c.3 2 1.3 3 3 3h14c1.7 0 2.7-1 3-3zM10 8l6 4-6 4z"/></svg>',
 facebook:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 21v-8h3l.5-4H14V7c0-1 .3-2 2-2h2V1.5c-.7-.1-1.9-.2-3-.2-3 0-5 1.8-5 5V9H7v4h3v8z"/></svg>',
 instagram:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.2"/></svg>',
 tiktok:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 2h3a5 5 0 0 0 4 4v3a9 9 0 0 1-4-1v8a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3z"/></svg>',
 whatsapp:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 11.5a9 9 0 0 1-13.6 7.7L3 21l1.8-4.3A9 9 0 1 1 21 11.5Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 7c.4-.4.7-.2 1 .4l1 2-1 1c.5 1.5 1.8 2.7 3.4 3.2l1-1 2 .9c.6.3.8.6.4 1-1 1.3-2 1.4-3.9.7C10.3 15.1 8 12.8 7.5 10.2 7.2 8.8 7.4 7.8 8 7Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>'
};
window.applySiteSettings=function(settings){
 if(!settings)return;
 const colors=themes[settings.theme]||themes.green;
 const style=document.documentElement.style;style.setProperty('--petrol',settings.primaryColor||colors[0]);style.setProperty('--petrol-dark',settings.primaryColor||colors[1]);
 const admin=document.body.classList.contains('admin-page');
 const resolve=url=>url?.startsWith('assets/')?(admin?'../':'')+url:url;
 if(settings.heroImage)style.setProperty('--hero-image',`url(${JSON.stringify(resolve(settings.heroImage))})`);
 if(settings.logoImage)document.querySelectorAll('.brand img').forEach(img=>{img.src=resolve(settings.logoImage);img.alt='Logo de la web';});
 window.CVSTUDIO_WHATSAPP=settings.whatsapp||'';
 if(settings.businessName){document.querySelectorAll('.brand span').forEach(el=>el.textContent=settings.businessName);document.title=settings.businessName+' | Propiedades';}
 if(admin)return;
 const locationText=[settings.address,settings.city,settings.province].filter(Boolean).join(' · ');
 let location=document.getElementById('business-location');if(!location){location=document.createElement('div');location.id='business-location';location.className='business-location';document.querySelector('.advisor-inner>div')?.append(location);}
 location.replaceChildren();location.hidden=!locationText&&!settings.mapsUrl;
 if(locationText){const title=document.createElement('strong');title.textContent='Ubicación de la inmobiliaria';const address=document.createElement('p');address.textContent=locationText;location.append(title,address);}
 if(settings.mapsUrl){const link=document.createElement('a');link.href=settings.mapsUrl;link.target='_blank';link.rel='noopener noreferrer';link.className='location-map';link.textContent='Cómo llegar ↗';location.append(link);}
 let email=document.getElementById('business-email');if(!email){email=document.createElement('a');email.id='business-email';document.querySelector('.footer-inner')?.append(email);}email.hidden=!settings.email;if(settings.email){email.textContent=settings.email;email.href='mailto:'+settings.email;}
 const footerLocation=document.getElementById('footer-location');if(footerLocation){footerLocation.textContent=locationText;footerLocation.hidden=!locationText;}

 const number=settings.whatsapp||'';
 document.querySelectorAll('a[href*="wa.me/"]').forEach(a=>{if(!number){a.hidden=true;return;}a.hidden=false;const url=new URL(a.href);url.pathname='/'+number;a.href=url.toString();});
 const contacts=document.querySelector('.footer-contacts');if(contacts){contacts.hidden=!number;const link=contacts.querySelector('a');if(link)link.textContent=number==='5492964652318'?'+54 9 2964 65-2318':'+'+number;}
 const group=document.getElementById('footer-socials'),links=document.getElementById('social-links');
 const configured=['facebook','instagram','tiktok','youtube','whatsapp'].map(key=>({key,url:key==='whatsapp'?(number?'https://wa.me/'+number:''):settings[key]||''})).filter(x=>x.url);
 if(group&&links){group.hidden=!configured.length;links.replaceChildren();for(const {key,url} of configured){const a=document.createElement('a');a.className='social-link';a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',key==='whatsapp'?'Contactar por WhatsApp':'Visitar nuestro perfil de '+key);a.title=key==='whatsapp'?'WhatsApp':key.charAt(0).toUpperCase()+key.slice(1);a.innerHTML=icons[key];links.append(a);}}
 const top=document.querySelector('.contact-top');if(top){top.hidden=!number&&!configured.length;if(!number&&configured.length){top.href=configured[0].url;top.target='_blank';top.rel='noopener noreferrer';}else{top.href='#contacto';top.removeAttribute('target');}}
};
})();
