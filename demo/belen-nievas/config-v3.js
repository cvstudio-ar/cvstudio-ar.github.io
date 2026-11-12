window.belenDefaults = {
  whatsapp: '5491153426093',
  facebook: 'https://web.facebook.com/mbnievas',
  instagram: '',
  tiktok: '',
  youtube: '',
  otherLabel: '',
  otherUrl: '',
  theme: "oliva",
  cover: "",
  heroTitle: "Nutrición a",
  heroAccent: "tu medida",
  heroText: "Consultas nutricionales y evaluación de la composición corporal, con un plan adaptado a tu salud y tu rutina.",
  card1Title: "Consulta nutricional",
  card1Text: "Revisamos tus hábitos, tus horarios y tus objetivos. A partir de la consulta preparo un plan alimentario adaptado a tu día a día.",
  card2Title: "Bioimpedancia",
  card2Text: "Evaluación de la composición corporal con un informe que recibís por WhatsApp en el momento.",
  card3Title: "Seguimiento nutricional",
  card3Text: "En los controles revisamos cómo te fue con el plan, qué pudiste incorporar y qué ajustes necesitás para seguir.",
  servicesTitle: "Cómo podemos trabajar",
  aboutTitle: "María Belén Nievas",
  bioTitle: "Conocé tu composición corporal",
  contactTitle: "Coordiná tu consulta",
  aboutText: "Trabajo en nutrición clínica y atiendo en centros médicos de Zona Norte. En consulta busco que las recomendaciones se adapten a tus necesidades, tus horarios y tu manera de comer.",
  bioText: "El informe reúne estimaciones de masa muscular, grasa corporal y agua corporal. Lo recibís por WhatsApp en el momento de la evaluación.",
  contactText: "Escribime para consultar la sede y los horarios disponibles.",
  locations: 'Tigre · San Fernando · Pacheco'
};
window.belenSettings = (() => {
  try {
    return { ...window.belenDefaults, ...JSON.parse(localStorage.getItem('belen-nievas-demo') || '{}') };
  } catch {
    return { ...window.belenDefaults };
  }
})();
