(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.CVStudioMarketingInsights=api;
})(typeof window!=='undefined'?window:{},function(){
  'use strict';
  const number=x=>{const n=Number(x);return Number.isFinite(n)&&n>=0?n:0;};
  function analyze(campaigns,connected){
    if(!connected) return {connected:false,period:'Últimos 30 días',totals:null,rows:[],suggestions:[{level:'pending',title:'Conectar Meta Ads',text:'La lectura automática de campañas todavía no está disponible. Verificá la integración en el módulo Integraciones; no se muestran datos de ejemplo.'}]};
    const rows=(Array.isArray(campaigns)?campaigns:[]).filter(x=>x&&typeof x==='object').map(item=>{
      const spend=number(item.spend),impressions=number(item.impressions),clicks=number(item.clicks),reach=number(item.reach),results=number(item.results);
      const ctr=impressions>0?clicks/impressions*100:null;
      const cpc=clicks>0?spend/clicks:null;
      const cpr=results>0?spend/results:null;
      return {id:String(item.id||''),name:String(item.name||'Campaña sin nombre'),status:String(item.effective_status||item.status||'UNKNOWN'),spend,impressions,clicks,reach,results,ctr,cpc,cpr,objective:String(item.objective||'')};
    });
    const totals=rows.reduce((r,item)=>({spend:r.spend+item.spend,impressions:r.impressions+item.impressions,clicks:r.clicks+item.clicks,results:r.results+item.results}),{spend:0,impressions:0,clicks:0,results:0});
    totals.ctr=totals.impressions?totals.clicks/totals.impressions*100:null;
    totals.cpc=totals.clicks?totals.spend/totals.clicks:null;
    totals.cpr=totals.results?totals.spend/totals.results:null;
    const suggestions=[];
    if(rows.length===0){
      suggestions.push({level:'pending',title:'Sin campañas para analizar',text:'La conexión respondió, pero no devolvió campañas. Comprobá el período y la cuenta publicitaria.'});
    }else{
      for(const row of rows.filter(x=>x.status.toUpperCase()==='ACTIVE')){
        if(row.impressions>=1000 && row.clicks===0){
          suggestions.push({level:'review',title:'Revisar creatividad: '+row.name,text:'Alcanzó al menos 1.000 impresiones y no registra clics. Comprobá el anuncio, la segmentación y el objetivo antes de cambiar el presupuesto.'});
        }else if(row.impressions>=1000 && row.ctr!==null && row.ctr<0.8){
          suggestions.push({level:'review',title:'Revisar interés: '+row.name,text:'Su CTR es inferior a 0,8% con al menos 1.000 impresiones. Compará creatividades y públicos; es una señal orientativa, no un diagnóstico definitivo.'});
        }
        if(row.spend>0 && row.results===0 && row.clicks>=30){
          suggestions.push({level:'review',title:'Revisar resultados: '+row.name,text:'Registra gasto y al menos 30 clics, sin resultados reportados por Meta. Verificá el objetivo y la medición antes de sacar conclusiones.'});
        }
      }
      if(!suggestions.length){
        suggestions.push({level:'info',title:'Compará campañas y objetivos',text:'No hay señales suficientes en estas reglas para marcar un problema. Revisá el costo por resultado dentro de campañas con el mismo objetivo; los clics no equivalen a ventas.'});
      }
    }
    return {connected:true,period:'Últimos 30 días',totals,rows:rows.sort((a,b)=>b.spend-a.spend),suggestions:suggestions.slice(0,6)};
  }
  return {analyze};
});
