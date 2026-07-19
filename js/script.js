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

/* =========================================================
   FONDO PREMIUM ANIMADO — CRECIMIENTO Y RESULTADOS
========================================================= */

(() => {
  const canvas = document.getElementById("growth-canvas");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let animationFrame = null;
  let time = 0;

  const isMobile = () => window.innerWidth <= 650;

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;

    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function drawGrid() {
    const gridSize = isMobile() ? 72 : 88;

    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.018)";

    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  function buildGrowthPoints(config) {
    const total = isMobile() ? 8 : 14;
    const points = [];

    for (let index = 0; index < total; index += 1) {
      const progress = index / (total - 1);

      const x = progress * width;

      const upwardTrend =
        height * config.startHeight -
        progress * height * config.growth;

      const wave =
        Math.sin(
          progress * config.frequency +
          time * config.speed +
          config.phase
        ) * config.amplitude;

      const secondaryWave =
        Math.cos(
          progress * (config.frequency * 0.55) +
          time * (config.speed * 0.65)
        ) * (config.amplitude * 0.35);

      points.push({
        x,
        y: upwardTrend + wave + secondaryWave
      });
    }

    return points;
  }

  function drawArea(points, colorStart, colorEnd) {
    const gradient = ctx.createLinearGradient(
      0,
      height * 0.2,
      0,
      height
    );

    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);

    ctx.save();
    ctx.beginPath();

    ctx.moveTo(points[0].x, height);

    points.forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });

    ctx.lineTo(points[points.length - 1].x, height);
    ctx.closePath();

    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  }

  function drawSmoothLine(
    points,
    colorStart,
    colorMiddle,
    colorEnd,
    lineWidth,
    glowColor
  ) {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);

    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(0.55, colorMiddle);
    gradient.addColorStop(1, colorEnd);

    ctx.save();
    ctx.beginPath();

    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
        return;
      }

      const previous = points[index - 1];

      const controlX = (previous.x + point.x) / 2;

      ctx.bezierCurveTo(
        controlX,
        previous.y,
        controlX,
        point.y,
        point.x,
        point.y
      );
    });

    ctx.strokeStyle = gradient;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = isMobile() ? 2 : 4;

    ctx.stroke();
    ctx.restore();
  }

  function drawBars(points) {
    ctx.save();

    const barWidth = isMobile() ? 10 : 14;

    points.forEach((point, index) => {
      if (index % 2 !== 0) return;

      const pulse =
        0.88 +
        Math.sin(time * 0.016 + index * 0.8) * 0.09;

      const barHeight = Math.max(
        32,
        (height - point.y) * 0.34 * pulse
      );

      const gradient = ctx.createLinearGradient(
        0,
        height - barHeight,
        0,
        height
      );

      gradient.addColorStop(
        0,
        "rgba(43,220,200,0.10)"
      );

      gradient.addColorStop(
        0.5,
        "rgba(117,100,255,0.055)"
      );

      gradient.addColorStop(
        1,
        "rgba(117,100,255,0)"
      );

      ctx.fillStyle = gradient;

      ctx.fillRect(
        point.x - barWidth / 2,
        height - barHeight,
        barWidth,
        barHeight
      );
    });

    ctx.restore();
  }

  function drawMovingParticles(points, color, offset) {
    const totalParticles = isMobile() ? 2 : 4;

    ctx.save();

    for (let index = 0; index < totalParticles; index += 1) {
      const progress =
        (
          time * 0.0018 +
          index / totalParticles +
          offset
        ) % 1;

      const scaled = progress * (points.length - 1);
      const pointIndex = Math.floor(scaled);
      const nextIndex = Math.min(
        pointIndex + 1,
        points.length - 1
      );

      const localProgress = scaled - pointIndex;

      const current = points[pointIndex];
      const next = points[nextIndex];

      const x =
        current.x +
        (next.x - current.x) * localProgress;

      const y =
        current.y +
        (next.y - current.y) * localProgress;

      ctx.beginPath();
      ctx.arc(x, y, isMobile() ? 2 : 2.6, 0, Math.PI * 2);

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 5;

      ctx.fill();
    }

    ctx.restore();
  }

  function drawTrendArrow(points) {
    const last = points[points.length - 1];

    ctx.save();

    ctx.translate(last.x - 10, last.y + 3);
    ctx.rotate(-0.55);

    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(15, 0);
    ctx.lineTo(0, 6);
    ctx.closePath();

    ctx.fillStyle = "rgba(43,220,200,0.26)";
    ctx.shadowColor = "rgba(43,220,200,0.15)";
    ctx.shadowBlur = 3;

    ctx.fill();
    ctx.restore();
  }

  function drawBackgroundGlow() {
    const glow = ctx.createRadialGradient(
      width * 0.75,
      height * 0.55,
      0,
      width * 0.75,
      height * 0.55,
      width * 0.55
    );

    glow.addColorStop(
      0,
      "rgba(43,220,200,0.035)"
    );

    glow.addColorStop(
      0.45,
      "rgba(117,100,255,0.025)"
    );

    glow.addColorStop(
      1,
      "rgba(11,16,32,0)"
    );

    ctx.save();
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    drawBackgroundGlow();
    drawGrid();

    const mainLine = buildGrowthPoints({
      startHeight: 0.82,
      growth: 0.55,
      frequency: 8,
      amplitude: isMobile() ? 10 : 17,
      speed: 0.009,
      phase: 0
    });

    const secondaryLine = buildGrowthPoints({
      startHeight: 0.9,
      growth: 0.4,
      frequency: 7,
      amplitude: isMobile() ? 7 : 12,
      speed: 0.007,
      phase: 1.8
    });

    const tertiaryLine = buildGrowthPoints({
      startHeight: 0.74,
      growth: 0.3,
      frequency: 9,
      amplitude: isMobile() ? 5 : 9,
      speed: 0.006,
      phase: 3.1
    });

    drawBars(mainLine);

    drawArea(
      mainLine,
      "rgba(117,100,255,0.045)",
      "rgba(11,16,32,0)"
    );

    drawSmoothLine(
      secondaryLine,
      "rgba(117,100,255,0.08)",
      "rgba(154,132,255,0.10)",
      "rgba(43,220,200,0.08)",
      isMobile() ? 0.7 : 1,
      "rgba(117,100,255,0.08)"
    );

    drawSmoothLine(
      tertiaryLine,
      "rgba(43,220,200,0.045)",
      "rgba(117,100,255,0.06)",
      "rgba(43,220,200,0.07)",
      isMobile() ? 0.6 : 0.85,
      "rgba(43,220,200,0.06)"
    );

    drawSmoothLine(
      mainLine,
      "rgba(117,100,255,0.16)",
      "rgba(154,132,255,0.20)",
      "rgba(43,220,200,0.17)",
      isMobile() ? 1.15 : 1.7,
      "rgba(117,100,255,0.12)"
    );

    drawMovingParticles(
      mainLine,
      "rgba(43,220,200,0.35)",
      0
    );

    drawMovingParticles(
      secondaryLine,
      "rgba(154,132,255,0.24)",
      0.35
    );

    drawTrendArrow(mainLine);

    time += 1;

    animationFrame = window.requestAnimationFrame(animate);
  }

  function startAnimation() {
    resizeCanvas();

    if (reducedMotion) {
      drawBackgroundGlow();
      drawGrid();

      const staticLine = buildGrowthPoints({
        startHeight: 0.82,
        growth: 0.55,
        frequency: 8,
        amplitude: 12,
        speed: 0,
        phase: 0
      });

      drawBars(staticLine);

      drawSmoothLine(
        staticLine,
        "rgba(117,100,255,0.14)",
        "rgba(154,132,255,0.18)",
        "rgba(43,220,200,0.15)",
        1.5,
        "rgba(117,100,255,0.08)"
      );

      return;
    }

    animate();
  }

  window.addEventListener("resize", resizeCanvas);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(animationFrame);
      return;
    }

    animationFrame = window.requestAnimationFrame(animate);
  });

  startAnimation();
})();