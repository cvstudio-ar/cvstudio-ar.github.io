'use strict';
window.BlindajeCalculator = (()=>{
  function calculate({age,retirementAge,monthly,annualRate}){
    if(![age,retirementAge,monthly,annualRate].every(Number.isFinite)||!Number.isInteger(age)||!Number.isInteger(retirementAge)||age<18||retirementAge>70||age>=retirementAge||monthly<0||monthly>25000||annualRate<0||annualRate>15)throw new Error('Parámetros fuera del rango de demostración.');
    const months=(retirementAge-age)*12;const rate=annualRate/100/12;
    const valueAt=n=>rate===0?monthly*n:monthly*Math.expm1(n*Math.log1p(rate))/rate;
    const contributions=monthly*months;const total=valueAt(months);
    const series=Array.from({length:retirementAge-age+1},(_,i)=>({year:i,contributions:monthly*i*12,total:valueAt(i*12)}));
    return{months,contributions,total,growth:total-contributions,monthlyDistribution:total/300,series};
  }
  return{calculate};
})();
