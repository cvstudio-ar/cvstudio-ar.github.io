/* =====================================================
   CVSTUDIO — ANIMACIONES PREMIUM AL HACER SCROLL
===================================================== */

document.documentElement.classList.add("scroll-ready");

document.addEventListener("DOMContentLoaded", () => {
  const mobilePerformanceMode =
  window.matchMedia("(max-width: 700px)").matches;

if (mobilePerformanceMode) {
  document.querySelectorAll(
    ".reveal, .reveal-left, .reveal-right"
  ).forEach((element) => {
    element.classList.add("is-visible");
  });

  return;
}
    const isMobile = window.matchMedia("(max-width: 700px)").matches;

  if (isMobile) {
    document.querySelectorAll(
      ".reveal, .reveal-left, .reveal-right"
    ).forEach((element) => {
      element.classList.add("is-visible");
    });

    return;
  }
  const elements = [...document.querySelectorAll(".reveal")];

  if (!elements.length) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reducedMotion || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  /* Retraso progresivo dentro de cada grupo */
  const groups = [
    ".portfolio-grid",
    "#proceso .process-list",
    ".benefits-grid",
    ".statistics-grid",
    ".testimonials-grid",
  ];

  groups.forEach((selector) => {
    const group = document.querySelector(selector);
    if (!group) return;

    const children = group.querySelectorAll(".reveal");

    children.forEach((element, index) => {
      const delay = Math.min(index * 110, 360);
      element.style.setProperty("--reveal-delay", `${delay}ms`);
    });
  });

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -70px 0px",
    }
  );

  elements.forEach((element) => {
    /*
      Los elementos que ya están visibles al cargar la página
      aparecen inmediatamente.
    */
    const rect = element.getBoundingClientRect();

    if (rect.top < window.innerHeight * 0.92) {
      element.classList.add("is-visible");
    } else {
      observer.observe(element);
    }
  });
});/* =====================================================
   CONTACTO — BENEFICIOS ESCALONADOS
===================================================== */

const contactSection = document.querySelector("#contacto");
const contactTrustItems = document.querySelectorAll(
  "#contacto .contact-trust-item"
);

if (contactSection && contactTrustItems.length) {
  const contactTrustObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        contactSection.classList.add("contact-benefits-visible");
      } else {
        contactSection.classList.remove("contact-benefits-visible");
      }
    },
    {
      threshold: 0.35
    }
  );

  contactTrustObserver.observe(contactSection);
}/* =====================================================
   CONTACTO — BENEFICIOS ESCALONADOS
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const contacto = document.querySelector("#contacto");

  if (!contacto) return;

  const observerContacto = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        contacto.classList.add("contact-benefits-visible");
      } else {
        contacto.classList.remove("contact-benefits-visible");
      }
    },
    {
      threshold: 0.4
    }
  );

  observerContacto.observe(contacto);
});