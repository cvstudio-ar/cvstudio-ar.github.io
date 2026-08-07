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
          other.querySelector(".faq-question")?.setAttribute("aria-expanded", "false");
          const otherAnswer = other.querySelector(".faq-answer");
          if (otherAnswer) otherAnswer.style.maxHeight = null;
        });

        if (opening) {
          item.classList.add("is-open");
          question.setAttribute("aria-expanded", "true");
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


// === MODULO 5 · CRO AVANZADO ===
(() => {
  const backToTop = document.querySelector('.back-to-top');
  const progress = document.querySelector('.scroll-progress span');
  const updateScrollUI = () => {
    const top = window.scrollY || document.documentElement.scrollTop;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${max > 0 ? Math.min(100, (top / max) * 100) : 0}%`;
    if (backToTop) backToTop.classList.toggle('is-visible', top > 700);
  };
  updateScrollUI();
  window.addEventListener('scroll', updateScrollUI, { passive: true });
  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });

  const emit = (name, detail = {}) => {
    try { window.clarity?.('event', name); } catch (_) {}
    try { window.gtag?.('event', name, detail); } catch (_) {}
    window.dispatchEvent(new CustomEvent('cvstudio:conversion', { detail: { name, ...detail } }));
  };

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-cro-event], a[href*="wa.me"], [data-siac-open]');
    if (!target) return;
    const name = target.dataset.croEvent || (target.matches('a[href*="wa.me"]') ? 'whatsapp_click' : 'siac_open');
    emit(name, {
      label: (target.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
      service: target.dataset.service || '',
      location: target.closest('section')?.id || target.closest('section')?.className || 'global'
    });
  });

  document.querySelectorAll('.service-card a[data-service]').forEach(link => {
    link.addEventListener('click', () => {
      const service = link.dataset.service;
      const contactTitle = document.querySelector('#propuesta .contact-content h2');
      if (contactTitle && service) contactTitle.dataset.lastService = service;
    });
  });
})();


// === MÓDULO 7 · VISOR PREMIUM DE SERVICIOS Y PORTFOLIO ===
(() => {
  const modal = document.querySelector('.portfolio-premium-modal');
  if (!modal) return;

  const modalImage = modal.querySelector('.portfolio-premium-modal-image');
  const caption = modal.querySelector('.portfolio-premium-caption');
  const details = modal.querySelector('.service-modal-details');
  const title = modal.querySelector('.service-modal-title');
  const price = modal.querySelector('.service-modal-price');
  const content = modal.querySelector('.service-modal-content');
  const actions = modal.querySelector('.service-modal-actions');
  const closeButton = modal.querySelector('.portfolio-premium-close');
  let lastTrigger = null;

  const whatsappNumber = '5492964652318';
  const paymentWorkerUrl = 'https://cvstudio-contacto.cvpro-duccionesar.workers.dev';
  const list = (items) => `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
  const section = (heading, body) => `<section class="service-detail-section"><h3>${heading}</h3>${body}</section>`;
  const whatsappLink = (message, label = 'Consultar por WhatsApp') => {
    const href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    return `<a class="service-whatsapp-button" href="${href}" target="_blank" rel="noopener noreferrer" data-cro-event="service_whatsapp_click"><span aria-hidden="true">W</span>${label}</a>`;
  };

  const services = {
    'cv-profesional': {
      title: 'Actualización de CV Profesional',
      productId: 'cv-profesional',
      amount: 12000,
      price: '$12.000',
      intro: 'Transformamos tu currículum en una herramienta profesional, moderna y optimizada para procesos de selección.',
      includes: ['Diseño moderno y profesional.', 'Redacción optimizada.', 'Estructura clara y organizada.', 'Adaptación para sistemas ATS.', 'Optimización del perfil profesional.', 'Corrección ortográfica y de estilo.', 'Formato PDF listo para enviar.'],
      ideal: ['Personas que buscan trabajo.', 'Cambiar de empleo.', 'Actualizar un CV antiguo.', 'Primer empleo.', 'Profesionales.'],
      result: 'Un CV atractivo, profesional y preparado para destacar frente a reclutadores y empresas.',
      message: '¡Hola! Me interesa el servicio de Actualización de CV Profesional. Quisiera recibir más información y comenzar con mi currículum.'
    },
    'cv-freelance': {
      title: 'Currículum Freelance Profesional',
      productId: 'cv-freelance',
      amount: 16000,
      price: '$16.000',
      intro: 'Diseñamos un currículum pensado especialmente para trabajadores independientes, emprendedores y profesionales que ofrecen servicios.',
      includes: ['Diseño exclusivo.', 'Perfil profesional.', 'Servicios destacados.', 'Experiencia organizada.', 'Formación.', 'Herramientas.', 'Habilidades.', 'Idiomas.', 'Optimización visual.', 'PDF listo para compartir.'],
      ideal: ['Diseñadores.', 'Fotógrafos.', 'Community Managers.', 'Arquitectos.', 'Programadores.', 'Profesionales independientes.', 'Emprendedores.'],
      result: 'Una presentación profesional que genera confianza y transmite el valor de tus servicios.',
      message: '¡Hola! Me interesa el Currículum Freelance Profesional. Quisiera conocer el proceso y comenzar con mi CV.'
    },
    linkedin: {
      title: 'Perfil Profesional de LinkedIn',
      productId: 'linkedin',
      amount: 19000,
      price: '$19.000',
      intro: 'Creamos un perfil de LinkedIn completo, optimizado y diseñado para aumentar tu visibilidad profesional.',
      includes: ['Foto de perfil optimizada.', 'Portada personalizada.', 'Título profesional.', 'Acerca de mí.', 'Experiencia laboral.', 'Formación académica.', 'Aptitudes.', 'Optimización SEO para LinkedIn.', 'URL personalizada.'],
      ideal: ['Profesionales.', 'Ejecutivos.', 'Freelancers.', 'Personas en búsqueda laboral.', 'Emprendedores.'],
      result: 'Un perfil profesional preparado para captar la atención de empresas, reclutadores y clientes.',
      message: '¡Hola! Me interesa el servicio de Perfil Profesional de LinkedIn. Quisiera recibir más información.'
    },
    'combo-2-cv': {
      title: 'Combo 2 CV Profesionales',
      productId: 'combo-2-cv',
      amount: 20000,
      price: '$20.000',
      intro: 'Obtené dos currículums profesionales por un precio promocional.',
      choice: ['Dos personas distintas.', 'Dos CV para la misma persona con objetivos diferentes.'],
      includes: ['Diseño profesional.', 'Perfil optimizado.', 'Experiencia laboral.', 'Formación académica.', 'Habilidades.', 'Idiomas.', 'Optimización ATS.', 'PDF listo para enviar.'],
      ideal: ['Parejas.', 'Amigos.', 'Hermanos.', 'Familiares.', 'Dos perfiles distintos.', 'Un perfil general + uno específico para un puesto.'],
      result: 'Dos currículums completamente profesionales con un importante ahorro.',
      message: '¡Hola! Me interesa el Combo 2 CV Profesionales por $20.000. Quisiera recibir más información.'
    },
    'combo-cv-linkedin': {
      title: 'Combo CV + LinkedIn',
      productId: 'combo-cv-linkedin',
      amount: 25000,
      price: '$25.000',
      intro: 'La solución más completa para potenciar tu perfil profesional.',
      cvIncludes: ['Diseño moderno.', 'Redacción profesional.', 'Optimización ATS.', 'Perfil profesional.', 'Experiencia laboral.', 'Formación.', 'Habilidades.', 'Idiomas.'],
      linkedinIncludes: ['Foto optimizada.', 'Portada personalizada.', 'Título profesional.', 'Acerca de mí.', 'Experiencias.', 'Formación.', 'Aptitudes.', 'Optimización SEO.', 'URL personalizada.'],
      ideal: ['Personas en búsqueda laboral.', 'Profesionales.', 'Ejecutivos.', 'Cambio de empleo.', 'Mayor visibilidad.'],
      result: 'Una imagen profesional consistente tanto en tu CV como en LinkedIn.',
      message: '¡Hola! Me interesa el Combo CV Profesional + LinkedIn por $25.000. Quisiera comenzar con el servicio.'
    },
    'kit-marca': {
      title: 'Kit de Lanzamiento de Marca',
      price: 'Opciones desde $45.000',
      options: [
        {
          name: 'Opción 1 · Kit Emprendedor',
          price: '$45.000',
          includes: ['Logo profesional.', 'Identidad visual.', 'Portada para redes.', 'Foto de perfil.', 'Descripción comercial.', 'Miniaturas destacadas.', 'Flyers.', 'Plantillas para publicaciones.', 'Diseño para historias.', 'Manual básico de marca.'],
          ideal: ['Nuevos emprendimientos.', 'Comercios.', 'Profesionales independientes.', 'Marcas personales.'],
          result: 'Todo lo necesario para comenzar con una imagen profesional y coherente.',
          message: '¡Hola! Me interesa el Kit Emprendedor de lanzamiento de marca por $45.000. Quisiera recibir más información.'
        },
        {
          name: 'Opción 2 · Kit Emprendedor + Web',
          price: '$75.000',
          includes: ['Todo el Kit Emprendedor.', 'Página web personalizada.', 'Dominio propio (si el cliente lo contrata).', 'Formulario de contacto.', 'Botón de WhatsApp.', 'Adaptación para celulares.', 'Integración con redes sociales.', 'Optimización SEO básica.', 'Capacitación para el uso del sitio.'],
          ideal: ['Emprendedores que quieren vender más.', 'Empresas nuevas.', 'Profesionales.', 'Negocios locales.'],
          result: 'Una identidad profesional completa con presencia digital y sitio web propio listo para recibir consultas.',
          message: '¡Hola! Me interesa el Kit Emprendedor + Web Personalizada por $75.000. Quisiera recibir asesoramiento.'
        }
      ]
    }
  };

  const formatArs = (value) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(value || 0));
  const applyRemotePrices = async () => {
    try {
      const response = await fetch(paymentWorkerUrl, { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mercadopago-products', timestamp: Date.now() }) });
      const data = await response.json();
      if (!response.ok || !data.ok || !Array.isArray(data.products)) return;
      data.products.forEach((product) => {
        const service = services[product.product_id];
        if (!service) return;
        service.amount = Number(product.effective_price || product.unit_price);
        service.price = formatArs(service.amount);
        service.isTestPrice = Boolean(product.test_mode);
        const cards = document.querySelectorAll(`[data-service-id="${CSS.escape(product.product_id)}"]`);
        cards.forEach((card) => {
          const priceTag = card.querySelector('.testimonial-price strong, .service-price');
          if (priceTag) priceTag.textContent = service.price;
          card.toggleAttribute('data-test-price', service.isTestPrice);
        });
      });
    } catch (error) { console.warn('No se pudieron actualizar los precios comerciales.', error); }
  };
  applyRemotePrices();

  const renderService = (service) => {
    title.textContent = service.title;
    price.textContent = service.price;
    price.toggleAttribute('data-test-price', Boolean(service.isTestPrice));
    price.title = service.isTestPrice ? 'Precio temporal de prueba configurado desde el panel administrador' : '';
    let html = service.intro ? `<p class="service-modal-intro">${service.intro}</p>` : '';
    if (service.choice) html += section('Podés elegir', list(service.choice));
    if (service.includes) html += section('Incluye', list(service.includes));
    if (service.cvIncludes) html += section('CV Profesional incluye', list(service.cvIncludes));
    if (service.linkedinIncludes) html += section('LinkedIn incluye', list(service.linkedinIncludes));
    if (service.ideal) html += section('Ideal para', list(service.ideal));
    if (service.result) html += section('Resultado', `<p>${service.result}</p>`);

    if (service.options) {
      html += service.options.map((option) => `
        <section class="service-kit-option">
          <div class="service-kit-option-heading"><h3>${option.name}</h3><strong>${option.price}</strong></div>
          ${section('Incluye', list(option.includes))}
          ${section('Ideal para', list(option.ideal))}
          ${section('Resultado', `<p>${option.result}</p>`)}
          ${whatsappLink(option.message, `Consultar ${option.name.replace('Opción 1 · ', '').replace('Opción 2 · ', '')}`)}
        </section>`).join('');
    }
    content.innerHTML = html;
    const paymentButton = service.productId && service.amount
      ? `<button class="service-payment-button" type="button" data-payment-product="${service.productId}"><span aria-hidden="true">$</span>Contratar ahora</button>`
      : '';
    actions.innerHTML = `
      ${paymentButton}
      ${service.message ? whatsappLink(service.message) : ''}
      ${paymentButton ? `
        <form class="service-checkout-form" data-checkout-form hidden novalidate>
          <div class="service-checkout-heading">
            <div><span>Datos para tu pedido</span><strong>Completá la información antes de continuar</strong></div>
            <button type="button" class="service-checkout-close" data-checkout-close aria-label="Cerrar formulario">×</button>
          </div>
          <div class="service-checkout-grid">
            <label><span>Nombre y apellido</span><input name="customerName" autocomplete="name" maxlength="100" required placeholder="Ej.: Juan Pérez"></label>
            <label><span>Correo electrónico</span><input name="customerEmail" type="email" autocomplete="email" maxlength="160" required placeholder="nombre@correo.com"></label>
            <label class="service-checkout-phone"><span>WhatsApp</span><input name="customerPhone" inputmode="tel" autocomplete="tel" maxlength="40" required placeholder="Ej.: 11 2345 6789"></label>
          </div>
          <label class="service-checkout-consent"><input name="consent" type="checkbox" required><span>Acepto que CVStudio utilice estos datos para gestionar el pedido y comunicarse conmigo.</span></label>
          <div class="service-checkout-summary"><span>${service.title}</span><strong>${service.price}</strong></div>
          <button class="service-checkout-submit" type="submit"><span aria-hidden="true">$</span> Continuar a Mercado Pago</button>
          <p class="service-checkout-status" data-checkout-status aria-live="polite"></p>
        </form>
        <p class="service-payment-caption"><span aria-hidden="true">🔒</span> Pago seguro procesado por Mercado Pago</p>` : ''}
    `;
  };

  const customerStorageKey = 'cvstudio-checkout-customer';
  const readStoredCustomer = () => {
    try { return JSON.parse(localStorage.getItem(customerStorageKey) || '{}'); } catch (_) { return {}; }
  };
  const storeCustomer = (customer) => {
    try { localStorage.setItem(customerStorageKey, JSON.stringify(customer)); } catch (_) {}
  };

  actions.addEventListener('click', (event) => {
    const close = event.target.closest('[data-checkout-close]');
    if (close) {
      const form = close.closest('[data-checkout-form]');
      if (form) form.hidden = true;
      return;
    }
    const button = event.target.closest('[data-payment-product]');
    if (!button) return;
    const form = actions.querySelector('[data-checkout-form]');
    if (!form) return;
    form.dataset.productId = button.dataset.paymentProduct;
    const stored = readStoredCustomer();
    ['customerName','customerEmail','customerPhone'].forEach((name) => {
      if (form.elements[name] && !form.elements[name].value) form.elements[name].value = stored[name] || '';
    });
    form.hidden = false;
    requestAnimationFrame(() => form.elements.customerName?.focus());
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  actions.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-checkout-form]');
    if (!form) return;
    event.preventDefault();
    const status = form.querySelector('[data-checkout-status]');
    const submit = form.querySelector('.service-checkout-submit');
    const customer = {
      customerName: form.elements.customerName.value.trim(),
      customerEmail: form.elements.customerEmail.value.trim().toLowerCase(),
      customerPhone: form.elements.customerPhone.value.trim()
    };
    if (!form.reportValidity()) return;
    submit.disabled = true;
    submit.classList.add('is-loading');
    status.textContent = 'Creando tu pedido y preparando el pago…';
    status.classList.remove('is-error');
    storeCustomer(customer);
    try {
      const response = await fetch(paymentWorkerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mercadopago-create-preference',
          productId: form.dataset.productId,
          ...customer
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.initPoint) throw new Error(data.message || 'No se pudo iniciar el pago.');
      try {
        sessionStorage.setItem('cvstudio-last-order', JSON.stringify({ orderCode: data.orderCode, externalReference: data.externalReference, productId: form.dataset.productId }));
        window.gtag?.('event', 'begin_checkout', { item_id: form.dataset.productId, transaction_id: data.orderCode });
      } catch (_) {}
      window.location.assign(data.initPoint);
    } catch (error) {
      status.textContent = `${error.message} También podés comunicarte por WhatsApp.`;
      status.classList.add('is-error');
      submit.disabled = false;
      submit.classList.remove('is-loading');
    }
  });

  const openModal = (card) => {
    const src = card.dataset.portfolioSrc;
    if (!src) return;
    lastTrigger = card;
    modalImage.src = src;
    modalImage.alt = card.dataset.portfolioAlt || 'Proyecto de CVStudio';
    caption.textContent = card.dataset.portfolioAlt || '';

    const service = services[card.dataset.serviceId];
    if (service) {
      renderService(service);
      details.hidden = false;
      modal.classList.add('has-service-details');
    } else {
      details.hidden = true;
      title.textContent = '';
      price.textContent = '';
      content.innerHTML = '';
      actions.innerHTML = '';
      modal.classList.remove('has-service-details');
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('portfolio-modal-open');

    // Cada tarjeta debe abrir desde el inicio. En móviles, el modal completo
    // es el único contenedor desplazable para evitar bloqueos táctiles.
    modal.scrollTop = 0;
    const serviceScroll = modal.querySelector('.service-modal-scroll');
    if (serviceScroll) serviceScroll.scrollTop = 0;

    closeButton.focus({ preventScroll: true });
    const eventName = card.classList.contains('testimonial-premium-trigger') ? 'testimonial_image_open' : 'portfolio_project_open';
    try { window.gtag?.('event', eventName, { item: caption.textContent }); } catch (_) {}
    try { window.clarity?.('event', eventName); } catch (_) {}
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('portfolio-modal-open');
    modalImage.removeAttribute('src');
    lastTrigger?.focus();
  };

  document.querySelectorAll('.testimonial-premium-trigger[data-service-id]').forEach((card) => {
    if (!card.querySelector('.card-contract-cta')) {
      const cta = document.createElement('span');
      cta.className = 'card-contract-cta';
      cta.textContent = card.dataset.serviceId === 'kit-marca' ? 'Ver opciones' : 'Contratar ahora';
      card.appendChild(cta);
    }
  });

  document.querySelectorAll('.portfolio-premium-card, .testimonial-premium-trigger').forEach((card) => {
    card.addEventListener('click', () => openModal(card));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openModal(card);
      }
    });
  });

  closeButton.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
})();


// === v1.4.9 · FORMULARIO VINCULADO AL CLIENTE EXISTENTE ===
(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('solicitud') !== '1') return;

  const normalize = (value='') => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  const requested = normalize(params.get('servicio') || '');
  const selectedServiceName = (params.get('servicio_nombre') || '').trim();
  const selectedServicePrice = Number(params.get('precio') || 0);
  const clientName = (params.get('cliente') || '').trim();
  const linkedClientId = (params.get('cliente_id') || '').trim();
  const linkedRequestId = (params.get('solicitud_id') || '').trim();
  const clientPhone = (params.get('whatsapp') || '').trim();
  const clientEmail = (params.get('email') || '').trim();
  const clientCity = (params.get('localidad') || '').trim();
  const workerUrl = 'https://cvstudio-contacto.cvpro-duccionesar.workers.dev';

  const definitions = {
    'cv-profesional': {
      title: 'Formulario · CV Profesional', service: 'CV Profesional',
      intro: 'Completá la información principal para que podamos comenzar a trabajar en tu currículum.',
      fields: [
        ['puesto_objetivo','Puesto al que querés postularte','text','Ej.: Administrativo, logística, atención al cliente'],
        ['linkedin','LinkedIn (opcional)','url','https://www.linkedin.com/in/tu-perfil'],
        ['experiencia','Experiencia laboral','textarea','Por cada experiencia indicá empresa, puesto, desde/hasta y tareas principales'],
        ['educacion','Educación','textarea','Institución, título o nivel alcanzado y fechas'],
        ['cursos','Cursos y capacitaciones','textarea','Nombre del curso, institución y año'],
        ['licencias','Licencias y certificaciones','textarea','Licencias de conducir, matrículas o certificaciones'],
        ['movilidad','Movilidad propia','text','Sí / No. Podés aclarar tipo de vehículo'],
        ['observaciones','Observaciones','textarea','Disponibilidad, preferencias, información adicional o aclaraciones']
      ],
      smartFields: `
        <fieldset class="guided-smart wide" data-smart-group="cv_actual">
          <legend>¿Ya tenés un CV actual?</legend>
          <label class="guided-choice"><input type="radio" name="cv_actual" value="Sí, tengo un CV actual" required data-detail-label="CV actual"> Sí, tengo uno para enviar</label>
          <label class="guided-choice"><input type="radio" name="cv_actual" value="No, necesito crearlo desde cero" required data-detail-label="CV actual"> No, necesito que CVStudio lo cree desde cero</label>
          <div class="guided-conditional" data-show-when="cv_actual:Sí, tengo un CV actual" hidden>
            <label>¿Cómo lo vas a compartir?<input name="cv_envio" type="text" data-detail-label="Forma de envío del CV" placeholder="Ej.: lo adjunto por WhatsApp o lo envío por correo"></label>
          </div>
        </fieldset>`
    },
    'linkedin': {
      title: 'Formulario · Perfil completo de LinkedIn', service: 'Perfil completo de LinkedIn',
      intro: 'Contanos tu objetivo profesional y el enfoque que querés darle a tu perfil.',
      smartFields: `
        <fieldset class="guided-smart wide" data-smart-group="linkedin_actual">
          <legend>¿Ya tenés un perfil de LinkedIn?</legend>
          <label class="guided-choice"><input type="radio" name="linkedin_actual" value="Sí, ya tengo un perfil" required data-detail-label="Perfil de LinkedIn actual"> Sí, ya tengo un perfil</label>
          <label class="guided-choice"><input type="radio" name="linkedin_actual" value="No, crear perfil desde cero" required data-detail-label="Perfil de LinkedIn actual"> No, quiero que CVStudio lo cree desde cero</label>
          <div class="guided-conditional" data-show-when="linkedin_actual:Sí, ya tengo un perfil" hidden>
            <label>Enlace de LinkedIn actual<input name="perfil_actual" type="url" data-detail-label="Enlace de LinkedIn actual" placeholder="https://www.linkedin.com/in/tu-perfil"></label>
          </div>
          <p class="guided-smart-note" data-show-when="linkedin_actual:No, crear perfil desde cero" hidden>CVStudio creará y optimizará tu perfil de LinkedIn desde cero.</p>
        </fieldset>`,
      fields: [
        ['objetivo','Objetivo profesional','text','Puesto, sector o modalidad buscada'],
        ['experiencia','Experiencia que debe destacarse','textarea','Puestos, logros y responsabilidades'],
        ['especialidad','Especialidades y palabras clave','textarea','Áreas, herramientas y conocimientos'],
        ['observaciones','Observaciones','textarea','Cambios de rubro, trabajo remoto, preferencias']
      ]
    },
    'logo': {
      title: 'Formulario · Diseño de Logo', service: 'Diseño de Logo',
      intro: 'Necesitamos conocer la marca, el estilo y las aplicaciones principales del logo.',
      fields: [
        ['marca','Nombre de la marca','text','Nombre exacto que debe figurar'],
        ['actividad','Actividad o rubro','text','Ej.: estética, tecnología, indumentaria'],
        ['estilo','Estilo deseado','textarea','Moderno, minimalista, elegante, urbano, etc.'],
        ['colores','Colores preferidos o a evitar','text','Ej.: negro y dorado'],
        ['referencias','Referencias y usos','textarea','Competidores, ejemplos y dónde se utilizará']
      ],
      smartFields: `
        <fieldset class="guided-smart wide" data-smart-group="logo_actual">
          <legend>¿Ya tenés un logo?</legend>
          <label class="guided-choice"><input type="radio" name="logo_actual" value="Sí, tengo un logo actual" required data-detail-label="Logo actual"> Sí, tengo un logo actual</label>
          <label class="guided-choice"><input type="radio" name="logo_actual" value="No, crear uno nuevo" required data-detail-label="Logo actual"> No, necesito uno nuevo</label>
          <div class="guided-conditional" data-show-when="logo_actual:Sí, tengo un logo actual" hidden>
            <label>Referencia del logo actual<input name="logo_referencia" type="text" data-detail-label="Referencia del logo actual" placeholder="Ej.: lo adjunto por WhatsApp o comparto un enlace"></label>
          </div>
        </fieldset>`
    },
    'banner': {
      title: 'Formulario · Diseño de Banner', service: 'Diseño de Banner',
      intro: 'Indicá dónde se publicará, el mensaje y los recursos que debe incluir.',
      fields: [
        ['plataforma','Plataforma o destino','text','Facebook, LinkedIn, web, impresión, etc.'],
        ['medidas','Medidas requeridas','text','En píxeles o centímetros'],
        ['mensaje','Texto principal','textarea','Título, promoción, llamada a la acción'],
        ['estilo','Estilo y colores','textarea','Identidad visual, tono y referencias'],
        ['recursos','Imágenes, logo y datos de contacto','textarea','Describí qué materiales vas a enviar']
      ]
    },
    'flyer': {
      title: 'Formulario · Diseño de Flyer', service: 'Diseño de Flyer',
      intro: 'Completá los datos de la pieza y la información que debe comunicar.',
      fields: [
        ['objetivo','Objetivo del flyer','text','Promoción, evento, servicio, lanzamiento'],
        ['formato','Formato y destino','text','Historia, publicación, A4, WhatsApp, etc.'],
        ['contenido','Texto completo','textarea','Título, descripción, precio, fecha y CTA'],
        ['estilo','Estilo visual','textarea','Colores, referencias y tono deseado'],
        ['contacto','Datos de contacto','textarea','WhatsApp, redes, dirección o sitio web']
      ]
    },
    'diseno-web': {
      title: 'Formulario · Diseño Web', service: 'Diseño Web',
      intro: 'Contanos qué tipo de web necesitás y qué debe poder hacer.',
      fields: [
        ['proyecto','Nombre del proyecto o marca','text','Nombre comercial'],
        ['tipo','Tipo de sitio','text','Landing, portfolio, catálogo, institucional'],
        ['secciones','Secciones necesarias','textarea','Inicio, servicios, trabajos, contacto, etc.'],
        ['funciones','Funciones requeridas','textarea','WhatsApp, formularios, pagos, galería, reservas'],
        ['referencias','Estilo y referencias','textarea','Colores, webs de ejemplo y material disponible']
      ],
      smartFields: `
        <fieldset class="guided-smart wide">
          <legend>Material e infraestructura disponible</legend>
          ${['dominio','hosting','logo','textos','imagenes'].map(item => `<label class="guided-select-row"><span>${item.charAt(0).toUpperCase()+item.slice(1)}</span><select name="web_${item}" required data-detail-label="Web · ${item}"><option value="">Seleccionar</option><option value="Sí">Sí</option><option value="No">No</option><option value="No estoy seguro/a">No estoy seguro/a</option></select></label>`).join('')}
        </fieldset>`
    }
  };

  const aliases = {
    'perfil-completo-de-linkedin':'linkedin','linkedin-profesional':'linkedin','perfil-profesional-de-linkedin':'linkedin',
    'diseno-de-logo':'logo','logo-profesional':'logo',
    'diseno-de-banner':'banner','banner-profesional':'banner',
    'diseno-de-flyer':'flyer','flyer-profesional':'flyer',
    'web':'diseno-web','diseno-de-web':'diseno-web','pagina-web':'diseno-web','sitio-web':'diseno-web'
  };
  const key = definitions[requested] ? requested : aliases[requested];
  const config = definitions[key];
  if (!config) return;
  if (selectedServiceName) config.service = selectedServiceName;
  const formattedSelectedPrice = selectedServicePrice ? new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(selectedServicePrice) : '';
  if (formattedSelectedPrice) config.intro += ` Valor del servicio: ${formattedSelectedPrice}.`;

  const style = document.createElement('style');
  style.textContent = `
    .guided-request-overlay{position:fixed;inset:0;z-index:10050;background:rgba(4,9,20,.82);backdrop-filter:blur(12px);display:grid;place-items:center;padding:18px;overflow:auto}
    .guided-request-card{width:min(860px,100%);max-height:calc(100vh - 36px);overflow:auto;background:linear-gradient(160deg,#0c1831,#071022);border:1px solid rgba(255,255,255,.14);border-radius:24px;box-shadow:0 28px 90px rgba(0,0,0,.48);color:#fff}
    .guided-request-head{padding:28px 30px 20px;border-bottom:1px solid rgba(255,255,255,.1);position:relative}.guided-request-head small{color:#ffd23f;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.guided-request-head h2{margin:7px 42px 7px 0;font-size:clamp(25px,4vw,38px)}.guided-request-head p{margin:0;color:#b8c4d9;line-height:1.55}.guided-request-close{position:absolute;right:20px;top:20px;width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.07);color:#fff;font-size:25px;cursor:pointer}
    .guided-request-form{padding:24px 30px 30px}.guided-request-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.guided-request-grid label{display:grid;gap:7px;color:#dbe5f6;font-weight:700;font-size:14px}.guided-request-grid .wide{grid-column:1/-1}.guided-request-grid input,.guided-request-grid textarea{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.15);border-radius:12px;background:#fff;color:#172033;padding:12px 14px;font:inherit}.guided-request-grid textarea{min-height:105px;resize:vertical}.guided-smart{border:1px solid rgba(255,210,63,.32);border-radius:16px;padding:16px;display:grid;gap:11px;background:rgba(255,255,255,.035)}.guided-smart legend{padding:0 8px;color:#ffd23f;font-weight:850}.guided-choice{display:flex!important;grid-template-columns:auto 1fr!important;align-items:center;gap:10px!important;padding:10px 12px;border:1px solid rgba(255,255,255,.12);border-radius:11px;background:rgba(255,255,255,.04);cursor:pointer}.guided-choice input{width:auto!important;margin:0;accent-color:#ffd23f}.guided-conditional{margin-top:3px}.guided-smart-note{margin:2px 0 0;padding:11px 13px;border-radius:11px;background:rgba(53,211,143,.12);color:#a9f1c7;font-weight:750}.guided-select-row{display:grid!important;grid-template-columns:minmax(120px,1fr) minmax(170px,1fr)!important;align-items:center;gap:12px!important}.guided-select-row select{width:100%;border:1px solid rgba(255,255,255,.15);border-radius:12px;background:#fff;color:#172033;padding:12px 14px;font:inherit}.guided-request-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:22px;flex-wrap:wrap}.guided-request-actions button{border:0;border-radius:999px;padding:12px 20px;font-weight:850;cursor:pointer}.guided-request-submit{background:#ffd23f;color:#101827}.guided-request-cancel{background:rgba(255,255,255,.1);color:#fff}.guided-request-status{margin:16px 0 0;min-height:24px;color:#a9f1c7;font-weight:700}.guided-request-status.is-error{color:#ffaaa5}
    @media(max-width:680px){.guided-request-grid{grid-template-columns:1fr}.guided-request-grid .wide{grid-column:auto}.guided-request-head,.guided-request-form{padding-left:18px;padding-right:18px}}
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'guided-request-overlay';
  overlay.innerHTML = `<section class="guided-request-card" role="dialog" aria-modal="true" aria-labelledby="guidedRequestTitle">
    <header class="guided-request-head"><small>CVStudio · Solicitud guiada</small><h2 id="guidedRequestTitle">${config.title}</h2><p>${config.intro}</p><button class="guided-request-close" type="button" aria-label="Cerrar">×</button></header>
    <form class="guided-request-form" novalidate>
      <div class="guided-request-grid">
        <label>Nombre y apellido<input name="name" value="${clientName.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" required autocomplete="name"></label>
        <label>WhatsApp<input name="phone" value="${clientPhone.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" required autocomplete="tel" inputmode="tel" placeholder="Ej.: 11 2345 6789"></label>
        <label>Correo electrónico<input name="email" value="${clientEmail.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" type="email" required autocomplete="email" placeholder="nombre@correo.com"></label>
        <label>Localidad<input name="city" value="${clientCity.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" required autocomplete="address-level2" placeholder="Ej.: Córdoba Capital"></label>
        ${config.smartFields || ''}${config.fields.map(([name,label,type,placeholder])=>{const required=name==='linkedin'?'':' required';return `<label class="${type==='textarea'?'wide':''}">${label}${type==='textarea'?`<textarea name="${name}"${required} data-detail-label="${label}" placeholder="${placeholder}"></textarea>`:`<input name="${name}" type="${type}"${required} data-detail-label="${label}" placeholder="${placeholder}">`}</label>`}).join('')}
        <input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
      </div>
      <div class="guided-request-actions"><button type="button" class="guided-request-cancel">Volver a la web</button><button type="submit" class="guided-request-submit">Enviar solicitud</button></div>
      <p class="guided-request-status" aria-live="polite"></p>
    </form>
  </section>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const close = () => { overlay.remove(); document.body.style.overflow=''; const clean = new URL(window.location.href); clean.search=''; history.replaceState({},'',clean); };
  overlay.querySelector('.guided-request-close').addEventListener('click', close);
  overlay.querySelector('.guided-request-cancel').addEventListener('click', close);

  const form = overlay.querySelector('form');
  const refreshSmartFields = () => {
    overlay.querySelectorAll('[data-show-when]').forEach((block) => {
      const [fieldName, expected] = (block.dataset.showWhen || '').split(':');
      const checked = form.querySelector(`[name="${fieldName}"]:checked`);
      const show = checked?.value === expected;
      block.hidden = !show;
      block.querySelectorAll('input,textarea,select').forEach((field) => {
        field.disabled = !show;
        if (show && (field.name === 'perfil_actual')) field.required = true;
        else if (!show) { field.required = false; field.value = ''; }
      });
    });
  };
  form.addEventListener('change', refreshSmartFields);
  refreshSmartFields();
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const status = form.querySelector('.guided-request-status');
    const submit = form.querySelector('.guided-request-submit');
    submit.disabled = true; status.className='guided-request-status'; status.textContent='Enviando tu información…';
    const data = Object.fromEntries(new FormData(form).entries());
    const detailEntries = [...form.querySelectorAll('[data-detail-label]')].filter(el=>!el.disabled && (el.type !== 'radio' || el.checked)).map(el=>[el.name,el.dataset.detailLabel,el.value]);
    const details = detailEntries.map(([,label,value])=>`${label}: ${value || '—'}`).join('\n\n');
    const requestCode = `CVS-${Date.now()}`;
    try {
      const response = await fetch(workerUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        name:data.name,
        email:data.email,
        phone:data.phone,
        city:data.city,
        service:config.service,
        website:data.website||'',
        source: linkedClientId ? 'Formulario enviado desde panel' : 'Formulario web',
        clientId: linkedClientId,
        requestId: linkedRequestId,
        formData:Object.fromEntries(detailEntries.map(([field,label,value])=>[field,{label,value:value||''}])),
        message:`Código de solicitud: ${requestCode}

Servicio: ${config.service}
Precio: ${formattedSelectedPrice || 'Consultar'}
Localidad: ${data.city}

${details}`
      })});
      const result = await response.json().catch(()=>({}));
      if(!response.ok || !result.ok) throw new Error(result.message || 'No se pudo enviar la solicitud.');
      const recordStatus = result.updatedExistingRequest ? 'El formulario quedó incorporado a tu ficha existente.' : (result.existingClient ? 'La solicitud quedó vinculada a tu ficha existente.' : 'Se creó una nueva consulta.');
      status.textContent = `Solicitud enviada correctamente. ${recordStatus} Código: ${result.requestCode || requestCode}`;
      form.querySelectorAll('input,textarea,button').forEach(el=>el.disabled=true);
      setTimeout(close, 3200);
    } catch (error) {
      status.className='guided-request-status is-error'; status.textContent=`${error.message} Podés intentar nuevamente.`; submit.disabled=false;
    }
  });
  requestAnimationFrame(()=>form.elements.name?.focus());
})();
