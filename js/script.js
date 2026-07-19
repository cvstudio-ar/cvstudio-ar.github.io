"use strict";

const header = document.querySelector("#header");
const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".navigation");
const navigationLinks = document.querySelectorAll(".navigation a");
const revealElements = document.querySelectorAll(".reveal");
const faqItems = document.querySelectorAll(".faq-item");
const faqQuestions = document.querySelectorAll(".faq-question");
const currentYear = document.querySelector("#current-year");
const sections = document.querySelectorAll("main section[id]");

/* AÑO AUTOMÁTICO */

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

/* HEADER AL HACER SCROLL */

function updateHeader() {
  if (!header) return;

  header.classList.toggle("is-scrolled", window.scrollY > 25);
}

updateHeader();
window.addEventListener("scroll", updateHeader, {
  passive: true,
});

/* MENÚ MÓVIL */

function closeMenu() {
  if (!menuButton || !navigation) return;

  navigation.classList.remove("is-open");
  menuButton.classList.remove("is-open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Abrir menú");
  document.body.classList.remove("menu-open");
}

if (menuButton && navigation) {
  menuButton.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("is-open");

    menuButton.classList.toggle("is-open", isOpen);
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute(
      "aria-label",
      isOpen ? "Cerrar menú" : "Abrir menú"
    );

    document.body.classList.toggle("menu-open", isOpen);
  });

  navigationLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    const clickedNavigation = navigation.contains(event.target);
    const clickedButton = menuButton.contains(event.target);

    if (!clickedNavigation && !clickedButton) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) {
      closeMenu();
    }
  });
}

/* ANIMACIONES AL APARECER */

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px",
    }
  );

  revealElements.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
    revealObserver.observe(element);
  });
} else {
  revealElements.forEach((element) => {
    element.classList.add("is-visible");
  });
}

/* PREGUNTAS FRECUENTES */

faqQuestions.forEach((question) => {
  question.addEventListener("click", () => {
    const currentItem = question.closest(".faq-item");
    const currentAnswer = currentItem.querySelector(".faq-answer");
    const isOpen = currentItem.classList.contains("is-open");

    faqItems.forEach((item) => {
      const answer = item.querySelector(".faq-answer");

      item.classList.remove("is-open");
      answer.style.maxHeight = null;
    });

    if (!isOpen) {
      currentItem.classList.add("is-open");
      currentAnswer.style.maxHeight = `${currentAnswer.scrollHeight}px`;
    }
  });
});

/* NAVEGACIÓN ACTIVA SEGÚN LA SECCIÓN */

if ("IntersectionObserver" in window && sections.length > 0) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const sectionId = entry.target.getAttribute("id");

        navigationLinks.forEach((link) => {
          const linkTarget = link.getAttribute("href");

          link.classList.toggle(
            "is-active",
            linkTarget === `#${sectionId}`
          );
        });
      });
    },
    {
      threshold: 0.3,
      rootMargin: "-20% 0px -55% 0px",
    }
  );

  sections.forEach((section) => {
    sectionObserver.observe(section);
  });
}

/* CERRAR MENÚ CON ESCAPE */

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
  }
});