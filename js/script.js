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
});/* PORTFOLIO LIGHTBOX */

const portfolioButtons = document.querySelectorAll(".portfolio-button");
const portfolioLightbox = document.querySelector("#portfolio-lightbox");
const lightboxImage = document.querySelector(".lightbox-image");
const lightboxTitle = document.querySelector(".lightbox-title");
const lightboxClose = document.querySelector(".lightbox-close");

portfolioButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!portfolioLightbox) return;

    lightboxImage.src = button.dataset.image;
    lightboxImage.alt = button.dataset.title;
    lightboxTitle.textContent = button.dataset.title;

    portfolioLightbox.classList.add("is-open");
    portfolioLightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("menu-open");
  });
});

function closePortfolioLightbox() {
  if (!portfolioLightbox) return;

  portfolioLightbox.classList.remove("is-open");
  portfolioLightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("menu-open");
}

if (lightboxClose) {
  lightboxClose.addEventListener("click", closePortfolioLightbox);
}

if (portfolioLightbox) {
  portfolioLightbox.addEventListener("click", (event) => {
    if (event.target === portfolioLightbox) {
      closePortfolioLightbox();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePortfolioLightbox();
  }
});/* ==================================================
   GRÁFICA ANIMADA DE CRECIMIENTO
================================================== */

(() => {
  const canvas = document.getElementById("growth-canvas");

  if (!canvas) return;

  const context = canvas.getContext("2d");

  if (!context) return;

  let width = 0;
  let height = 0;
  let animationFrame = 0;
  let time = 0;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion) return;

  function resizeCanvas() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function drawGrid() {
    const gridSize = width < 650 ? 70 : 90;

    context.save();
    context.strokeStyle = "rgba(255, 255, 255, 0.025)";
    context.lineWidth = 1;

    for (let x = 0; x <= width; x += gridSize) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }

    for (let y = 0; y <= height; y += gridSize) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    context.restore();
  }

  function createPoints() {
    const numberOfPoints = width < 650 ? 8 : 13;
    const points = [];

    for (let index = 0; index < numberOfPoints; index += 1) {
      const progress = index / (numberOfPoints - 1);

      const x = progress * width;

      const baseY =
        height * 0.82 -
        progress * height * 0.54;

      const wave =
        Math.sin(progress * 8 + time * 0.012) * 22 +
        Math.cos(progress * 5 + time * 0.008) * 12;

      points.push({
        x,
        y: baseY + wave
      });
    }

    return points;
  }

  function drawArea(points) {
    const gradient = context.createLinearGradient(
      0,
      height * 0.25,
      0,
      height
    );

    gradient.addColorStop(0, "rgba(117, 100, 255, 0.16)");
    gradient.addColorStop(0.55, "rgba(43, 220, 200, 0.06)");
    gradient.addColorStop(1, "rgba(11, 16, 32, 0)");

    context.save();
    context.beginPath();
    context.moveTo(points[0].x, height);

    points.forEach((point) => {
      context.lineTo(point.x, point.y);
    });

    context.lineTo(points[points.length - 1].x, height);
    context.closePath();

    context.fillStyle = gradient;
    context.fill();
    context.restore();
  }

  function drawBars(points) {
    context.save();

    points.forEach((point, index) => {
      if (index % 2 !== 0) return;

      const pulse =
        0.82 +
        Math.sin(time * 0.018 + index) * 0.08;

      const barWidth = width < 650 ? 12 : 18;
      const barHeight = Math.max(
        35,
        (height - point.y) * 0.45 * pulse
      );

      const gradient = context.createLinearGradient(
        0,
        point.y,
        0,
        point.y + barHeight
      );

      gradient.addColorStop(
        0,
        "rgba(43, 220, 200, 0.18)"
      );

      gradient.addColorStop(
        1,
        "rgba(117, 100, 255, 0.025)"
      );

      context.fillStyle = gradient;

      context.fillRect(
        point.x - barWidth / 2,
        height - barHeight,
        barWidth,
        barHeight
      );
    });

    context.restore();
  }

  function drawLine(points) {
    const gradient = context.createLinearGradient(
      0,
      height,
      width,
      0
    );

    gradient.addColorStop(0, "#7564ff");
    gradient.addColorStop(0.55, "#9a84ff");
    gradient.addColorStop(1, "#2bdcc8");

    context.save();

    context.beginPath();

    points.forEach((point, index) => {
      if (index === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    });

    context.strokeStyle = gradient;
    context.lineWidth = width < 650 ? 2.5 : 3;
    context.lineJoin = "round";
    context.lineCap = "round";

    context.shadowColor = "rgba(117, 100, 255, 0.35)";
    context.shadowBlur = 12;

    context.stroke();
    context.restore();
  }

  function drawPoints(points) {
    context.save();

    points.forEach((point, index) => {
      if (index % 2 !== 0) return;

      const pulse =
        1 +
        Math.sin(time * 0.03 + index) * 0.25;

      context.beginPath();

      context.arc(
        point.x,
        point.y,
        3.5 * pulse,
        0,
        Math.PI * 2
      );

      context.fillStyle =
        "rgba(43, 220, 200, 0.72)";

      context.shadowColor =
        "rgba(43, 220, 200, 0.45)";

      context.shadowBlur = 10;
      context.fill();
    });

    context.restore();
  }

  function drawArrow(points) {
    const lastPoint = points[points.length - 1];

    context.save();

    context.translate(lastPoint.x - 18, lastPoint.y + 8);
    context.rotate(-0.65);

    context.beginPath();
    context.moveTo(0, -8);
    context.lineTo(18, 0);
    context.lineTo(0, 8);
    context.closePath();

    context.fillStyle = "rgba(43, 220, 200, 0.65)";
    context.shadowColor = "rgba(43, 220, 200, 0.35)";
    context.shadowBlur = 12;
    context.fill();

    context.restore();
  }

  function animate() {
    context.clearRect(0, 0, width, height);

    drawGrid();

    const points = createPoints();

    drawBars(points);
    drawArea(points);
    drawLine(points);
    drawPoints(points);
    drawArrow(points);

    time += 1;

    animationFrame = window.requestAnimationFrame(animate);
  }

  resizeCanvas();
  animate();

  window.addEventListener("resize", resizeCanvas);

  window.addEventListener("beforeunload", () => {
    window.cancelAnimationFrame(animationFrame);
  });
})();