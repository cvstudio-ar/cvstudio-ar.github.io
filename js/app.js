/* CVStudio — aplicación única y definitiva. */


"use strict";

(() => {
  const root = document.documentElement;
  const mobileQuery = window.matchMedia("(max-width: 700px)");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function updateMode() {
    root.classList.toggle("v3-mobile", mobileQuery.matches);
    root.classList.toggle("mobile-performance-v3", mobileQuery.matches);
    root.classList.toggle("v3-reduced-motion", reducedMotionQuery.matches);
  }

  updateMode();
  mobileQuery.addEventListener?.("change", updateMode);
  reducedMotionQuery.addEventListener?.("change", updateMode);

  document.addEventListener("DOMContentLoaded", () => {
    root.classList.add("v3-ready");

    const header = document.querySelector("#header");
    const menuButton = document.querySelector(".menu-button");
    const navigation = document.querySelector(".navigation");
    const navigationLinks = [...document.querySelectorAll(".navigation a")];
    const faqItems = [...document.querySelectorAll(".faq-item")];
    const revealElements = [...document.querySelectorAll(".reveal")];

    function updateHeader() {
      header?.classList.toggle("is-scrolled", window.scrollY > 25);
    }

    function closeMenu() {
      if (!menuButton || !navigation) return;
      navigation.classList.remove("is-open");
      menuButton.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Abrir menú");
      document.body.classList.remove("menu-open");
    }

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    if (menuButton && navigation) {
      menuButton.addEventListener("click", () => {
        const open = navigation.classList.toggle("is-open");
        menuButton.classList.toggle("is-open", open);
        menuButton.setAttribute("aria-expanded", String(open));
        menuButton.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
        document.body.classList.toggle("menu-open", open);
      });

      navigationLinks.forEach((link) => link.addEventListener("click", closeMenu));

      document.addEventListener("click", (event) => {
        if (!navigation.contains(event.target) && !menuButton.contains(event.target)) {
          closeMenu();
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMenu();
      });
    }

    faqItems.forEach((item) => {
      const question = item.querySelector(".faq-question");
      const answer = item.querySelector(".faq-answer");
      if (!question || !answer) return;

      question.addEventListener("click", () => {
        const opening = !item.classList.contains("is-open");

        faqItems.forEach((other) => {
          other.classList.remove("is-open");
          const otherAnswer = other.querySelector(".faq-answer");
          if (otherAnswer) otherAnswer.style.maxHeight = null;
        });

        if (opening) {
          item.classList.add("is-open");
          answer.style.maxHeight = `${answer.scrollHeight}px`;
        }
      });
    });

    const mobile = mobileQuery.matches;
    const reduced = reducedMotionQuery.matches;

    if (mobile || reduced || !("IntersectionObserver" in window)) {
      revealElements.forEach((element) => element.classList.add("is-visible"));
    } else {
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );

      revealElements.forEach((element, index) => {
        element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
        revealObserver.observe(element);
      });
    }

    const sections = [...document.querySelectorAll("main section[id]")];
    if (!mobile && "IntersectionObserver" in window && sections.length) {
      const sectionObserver = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

          if (!visible) return;

          navigationLinks.forEach((link) => {
            link.classList.toggle(
              "is-active",
              link.getAttribute("href") === `#${visible.target.id}`
            );
          });
        },
        { rootMargin: "-28% 0px -58% 0px", threshold: [0.1, 0.25, 0.5] }
      );

      sections.forEach((section) => sectionObserver.observe(section));
    }
  });
})();


/* ===== Interacción del Hero (solo escritorio) ===== */
/* =====================================================
   CVSTUDIO V3 — HERO INTERACTIVO
===================================================== */

(() => {
  "use strict";

  const scene = document.querySelector(".hero-v3-scene");
  const stage = document.querySelector(".hero-v3-stage");
  const screen = document.querySelector(".hero-v3-screen");

  if (!scene || !stage || !screen) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const mobileMode = window.matchMedia("(max-width: 700px)").matches;

  if (reducedMotion || mobileMode) return;

  let frameId = null;
  let targetRotateX = 0;
  let targetRotateY = 0;
  let currentRotateX = 0;
  let currentRotateY = 0;

  function renderTilt() {
    currentRotateX += (targetRotateX - currentRotateX) * 0.1;
    currentRotateY += (targetRotateY - currentRotateY) * 0.1;

    stage.style.setProperty(
      "--hero-v3-rotate-x",
      `${currentRotateX.toFixed(2)}deg`
    );

    stage.style.setProperty(
      "--hero-v3-rotate-y",
      `${currentRotateY.toFixed(2)}deg`
    );

    const moving =
      Math.abs(targetRotateX - currentRotateX) > 0.02 ||
      Math.abs(targetRotateY - currentRotateY) > 0.02;

    if (moving) {
      frameId = requestAnimationFrame(renderTilt);
    } else {
      frameId = null;
    }
  }

  function requestRender() {
    if (!frameId) {
      frameId = requestAnimationFrame(renderTilt);
    }
  }

  scene.addEventListener(
    "pointermove",
    (event) => {
      const bounds = scene.getBoundingClientRect();

      const relativeX =
        (event.clientX - bounds.left) / bounds.width - 0.5;

      const relativeY =
        (event.clientY - bounds.top) / bounds.height - 0.5;

      targetRotateY = relativeX * 8;
      targetRotateX = relativeY * -6;

      requestRender();
    },
    { passive: true }
  );

  scene.addEventListener("pointerleave", () => {
    targetRotateX = 0;
    targetRotateY = 0;
    requestRender();
  });
})();

/* ===== Ecosistema digital definitivo ===== */
(() => {
  "use strict";

  const mobile = window.matchMedia("(max-width: 700px)").matches;
  const reduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduced) return;

  const desktopBrands = [
    ["instagram.svg", "Instagram", "mid"],
    ["facebook.svg", "Facebook", "far"],
    ["tiktok.svg", "TikTok", "near"],
    ["linkedin.svg", "LinkedIn", "far"],
    ["x.svg", "X", "mid"],
    ["whatsapp.svg", "WhatsApp", "near"],
    ["gmail.svg", "Gmail", "far"],
    ["kick.svg", "Kick", "mid"],
    ["openai.svg", "OpenAI", "far"],
    ["youtube.svg", "YouTube", "near"],
    ["snapchat.svg", "Snapchat", "mid"],
    ["twitch.svg", "Twitch", "far"],
    ["discord.svg", "Discord", "mid"],
    ["canva.svg", "Canva", "far"]
  ];

  const mobileBrands = [
    ["instagram.svg", "Instagram", "mid"],
    ["facebook.svg", "Facebook", "far"],
    ["tiktok.svg", "TikTok", "near"],
    ["linkedin.svg", "LinkedIn", "mid"]
  ];

  const activeBrands = mobile ? mobileBrands : desktopBrands;

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createBackground() {
    if (document.querySelector(".cv-digital-background")) return;

    const layer = document.createElement("div");
    layer.className = "cv-digital-background";
    layer.setAttribute("aria-hidden", "true");

    const signature = document.createElement("span");
    signature.className = "cv-digital-signature";
    signature.textContent = "CVStudio";
    layer.appendChild(signature);

    activeBrands.forEach(([file, name, depth], index) => {
      const item = document.createElement("span");

      item.className = `cv-digital-logo cv-depth-${depth}`;

      item.style.setProperty(
        "--cv-top",
        `${random(8, 90).toFixed(1)}%`
      );

      item.style.setProperty(
        "--cv-size",
        mobile
          ? `${random(38, 48).toFixed(0)}px`
          : `${random(
              depth === "near" ? 58 : depth === "mid" ? 42 : 30,
              depth === "near" ? 78 : depth === "mid" ? 60 : 46
            ).toFixed(0)}px`
      );

      item.style.setProperty(
        "--cv-duration",
        mobile
          ? `${random(34, 44).toFixed(1)}s`
          : `${random(21, 37).toFixed(1)}s`
      );

      item.style.setProperty(
        "--cv-delay",
        `${(-random(0, 32)).toFixed(1)}s`
      );

      item.style.setProperty(
        "--cv-rotate",
        `${random(-12, 12).toFixed(1)}deg`
      );

      item.style.setProperty(
        "--cv-opacity",
        mobile
          ? `${random(0.18, 0.28).toFixed(2)}`
          : `${random(0.22, 0.52).toFixed(2)}`
      );

      const img = document.createElement("img");
      img.src = `assets/icons/${file}`;
      img.alt = "";
      img.width = 64;
      img.height = 64;
      img.decoding = "async";
      img.loading = index < 4 ? "eager" : "lazy";

      item.title = name;
      item.appendChild(img);
      layer.appendChild(item);
    });

    if (!mobile) {
      for (let index = 0; index < 34; index += 1) {
        const particle = document.createElement("i");

        particle.style.setProperty(
          "--cv-particle-top",
          `${random(2, 98).toFixed(1)}%`
        );

        particle.style.setProperty(
          "--cv-particle-size",
          `${random(2, 4.5).toFixed(1)}px`
        );

        particle.style.setProperty(
          "--cv-particle-duration",
          `${random(17, 31).toFixed(1)}s`
        );

        particle.style.setProperty(
          "--cv-particle-delay",
          `${(-random(0, 30)).toFixed(1)}s`
        );

        layer.appendChild(particle);
      }
    }

    document.body.appendChild(layer);

    if (!mobile) {
      let frame = null;
      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;

      function render() {
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;

        layer.style.setProperty(
          "--cv-pointer-x",
          `${currentX.toFixed(2)}px`
        );

        layer.style.setProperty(
          "--cv-pointer-y",
          `${currentY.toFixed(2)}px`
        );

        const moving =
          Math.abs(targetX - currentX) > 0.03 ||
          Math.abs(targetY - currentY) > 0.03;

        if (moving) {
          frame = requestAnimationFrame(render);
        } else {
          frame = null;
        }
      }

      window.addEventListener(
        "pointermove",
        (event) => {
          targetX =
            (event.clientX / window.innerWidth - 0.5) * 30;

          targetY =
            (event.clientY / window.innerHeight - 0.5) * 20;

          if (!frame) {
            frame = requestAnimationFrame(render);
          }
        },
        { passive: true }
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      createBackground,
      { once: true }
    );
  } else {
    createBackground();
  }
})();
/* =====================================================
   CONTADORES ANIMADOS — PC Y CELULAR
===================================================== */

(() => {
  "use strict";

  function initializeCounters() {
    const counters = document.querySelectorAll(".js-counter");

    if (!counters.length) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    function showFinalValue(counter) {
      const suffix = counter.dataset.suffix || "";

      if (counter.dataset.rangeStart && counter.dataset.rangeEnd) {
        counter.textContent =
          `${counter.dataset.rangeStart}–${counter.dataset.rangeEnd}${suffix}`;
        return;
      }

      counter.textContent =
        `${counter.dataset.target || 0}${suffix}`;
    }

    function animateCounter(counter) {
      if (counter.dataset.animated === "true") return;

      counter.dataset.animated = "true";

      if (reducedMotion) {
        showFinalValue(counter);
        return;
      }

      const duration = 1500;
      const startTime = performance.now();
      const suffix = counter.dataset.suffix || "";

      const rangeStart = Number(counter.dataset.rangeStart);
      const rangeEnd = Number(counter.dataset.rangeEnd);
      const target = Number(counter.dataset.target);

      function easeOutCubic(progress) {
        return 1 - Math.pow(1 - progress, 3);
      }

      function update(currentTime) {
        const progress = Math.min(
          (currentTime - startTime) / duration,
          1
        );

        const easedProgress = easeOutCubic(progress);

        if (
          Number.isFinite(rangeStart) &&
          Number.isFinite(rangeEnd)
        ) {
          const currentStart = Math.round(
            rangeStart * easedProgress
          );

          const currentEnd = Math.round(
            rangeEnd * easedProgress
          );

          counter.textContent =
            `${currentStart}–${currentEnd}${suffix}`;
        } else {
          const currentValue = Math.round(
            target * easedProgress
          );

          counter.textContent =
            `${currentValue}${suffix}`;
        }

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          showFinalValue(counter);
        }
      }

      requestAnimationFrame(update);
    }

    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCounter);
      return;
    }

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          animateCounter(entry.target);
          currentObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.45
      }
    );

    counters.forEach((counter) => {
      observer.observe(counter);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeCounters,
      { once: true }
    );
  } else {
    initializeCounters();
  }
})();

/* =====================================================
   MÉTODO CVSTUDIO V2 — MOTOR POR ESCENAS
===================================================== */
(() => {
  "use strict";
  const lab = document.querySelector("[data-cv-lab]");
  if (!lab) return;

  const steps = [...lab.querySelectorAll("[data-step]")];
  const label = lab.querySelector(".cv-stage-label");
  const title = lab.querySelector(".cv-stage-copy h3");
  const text = lab.querySelector(".cv-stage-copy p");
  const list = lab.querySelector(".cv-stage-copy ul");
  const replay = lab.querySelector("[data-cv-replay]");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const content = [
    ["01 · CV recibido","Partimos de una base correcta.","Conservamos los datos reales y analizamos qué debe ganar claridad, jerarquía y presencia.",["Información original","Sin inventar experiencia","Diagnóstico inicial"]],
    ["02 · Organización","La información encuentra su lugar.","Reubicamos contacto, habilidades, estudios y experiencia. En esta etapa solo cambia la estructura: todavía no aplicamos diseño ni alteramos la redacción.",["Bloques reubicados","Orden de lectura","Estructura definida"]],
    ["03 · Diseño","La información empieza a tener identidad.","Incorporamos la fotografía optimizada, la paleta, las columnas, la jerarquía tipográfica y los recursos visuales del diseño profesional.",["Foto optimizada","Jerarquía visual","Diseño funcional"]],
    ["04 · Redacción","La experiencia empieza a comunicar valor.","Reescribimos el perfil y desarrollamos funciones, habilidades e información adicional sin inventar datos. Mirá cómo el contenido se redacta dentro del documento.",["Perfil fortalecido","Funciones desarrolladas","Redacción profesional"]],
    ["05 · CVStudio","Revisamos, validamos y firmamos el trabajo.","Aplicamos el control final de CVStudio: coherencia, lectura, presentación y terminación. El sello confirma que el documento está listo.",["Control de calidad","Firma CVStudio","Listo para entregar"]],
    ["06 · Resultado real","El mismo perfil. Una presentación completamente diferente.","El proceso finaliza con el CV profesional real diseñado por CVStudio, respetando su estructura, redacción y acabado definitivo.",["Diseño final real","Contenido profesionalizado","Abrir CV completo"]]
  ];

  const durations = [4200, 5600, 6200, 9200, 5800, 0];
  let current = 1;
  let timer = null;
  let typingTimer = null;
  let started = false;

  const typeTargets = [
    lab.querySelector(".cv-profile .cv-copy-final"),
    ...lab.querySelectorAll(".cv-experience .cv-copy-final li"),
    ...lab.querySelectorAll(".cv-skills-final li"),
    lab.querySelector(".cv-additional p")
  ].filter(Boolean);
  const originalText = new Map(typeTargets.map(el => [el, el.textContent.trim()]));

  function stopTyping() {
    clearTimeout(typingTimer);
    typeTargets.forEach(el => el.classList.remove("is-typing"));
  }

  function restoreFinalText() {
    stopTyping();
    typeTargets.forEach(el => { el.textContent = originalText.get(el); });
  }

  function runTypewriter() {
    stopTyping();
    typeTargets.forEach(el => { el.textContent = ""; });
    let targetIndex = 0;
    let charIndex = 0;

    const tick = () => {
      if (current !== 4 || targetIndex >= typeTargets.length) {
        typeTargets.forEach(el => el.classList.remove("is-typing"));
        return;
      }
      const el = typeTargets[targetIndex];
      const value = originalText.get(el);
      typeTargets.forEach(node => node.classList.remove("is-typing"));
      el.classList.add("is-typing");
      const chunk = value.length > 120 ? 4 : value.length > 60 ? 3 : 2;
      charIndex = Math.min(value.length, charIndex + chunk);
      el.textContent = value.slice(0, charIndex);
      if (charIndex >= value.length) {
        el.classList.remove("is-typing");
        targetIndex += 1;
        charIndex = 0;
        typingTimer = setTimeout(tick, 70);
      } else {
        typingTimer = setTimeout(tick, 20);
      }
    };
    typingTimer = setTimeout(tick, 350);
  }

  function render(step) {
    current = step;
    clearTimeout(timer);
    if (step !== 4) restoreFinalText();

    lab.dataset.state = String(step);
    lab.style.setProperty("--step", step);
    steps.forEach((button, index) => {
      button.classList.toggle("is-active", index + 1 === step);
      button.classList.toggle("is-complete", index + 1 < step);
    });

    const [l, t, p, items] = content[step - 1];
    label.textContent = l;
    title.textContent = t;
    text.textContent = p;
    list.innerHTML = items.map(item => `<li>${item}</li>`).join("");

    if (step === 4 && !reduced) runTypewriter();
  }

  function schedule() {
    clearTimeout(timer);
    if (current >= 6 || reduced) return;
    timer = setTimeout(() => {
      render(current + 1);
      schedule();
    }, durations[current - 1]);
  }

  function start() {
    started = true;
    render(1);
    if (reduced) render(6);
    else schedule();
  }

  steps.forEach(button => button.addEventListener("click", () => {
    clearTimeout(timer);
    render(Number(button.dataset.step));
  }));
  replay.addEventListener("click", start);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting) && !started) {
        start();
        observer.disconnect();
      }
    }, { threshold: .32 });
    observer.observe(lab);
  } else {
    start();
  }
})();
