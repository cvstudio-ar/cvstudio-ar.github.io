(() => {
  'use strict';

  window.renderElianaPortfolio = function renderElianaPortfolio(p, helpers) {
    const { root, esc, icons } = helpers;
    const whatsapp = '5492964508024';
    const instagram = 'https://www.instagram.com/beauty.nails.by_eliana/';
    const waText = encodeURIComponent('Hola Eliana, vi tu portfolio profesional y quisiera consultar por un turno.');
    const nailIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4.5c0-1.4 1.1-2.5 2.5-2.5S13 3.1 13 4.5V12a4 4 0 0 1-8 0V7.5A2.5 2.5 0 0 1 7.5 5H8v7a1 1 0 0 0 2 0V4.5"/><path d="M14.5 7.5V14a5.5 5.5 0 0 1-11 0V9"/></svg>';
    const diamond = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 8 3-4h10l3 4-8 12z"/><path d="m4 8 8 12 8-12M7 4l5 16 5-16M4 8h16"/></svg>';
    const sparkle = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c.6 5.4 4.6 9.4 10 10-5.4.6-9.4 4.6-10 10-.6-5.4-4.6-9.4-10-10 5.4-.6 9.4-4.6 10-10Z"/><path d="M19 2c.2 1.8 1.2 2.8 3 3-1.8.2-2.8 1.2-3 3-.2-1.8-1.2-2.8-3-3 1.8-.2 2.8-1.2 3-3Z"/></svg>';

    document.title = 'Beauty Nails by Eliana · Portfolio profesional';
    root.className = 'eliana-site';
    root.innerHTML = `
      <div class="en-page">
        <div class="en-cosmos" aria-hidden="true"><canvas class="en-galaxy-canvas"></canvas><span class="en-nebula en-nebula-a"></span><span class="en-nebula en-nebula-b"></span><span class="en-constellation en-constellation-a"></span><span class="en-constellation en-constellation-b"></span><span class="en-space-orbit en-space-orbit-a"><i></i></span><span class="en-space-orbit en-space-orbit-b"><i></i></span><span class="en-space-orbit en-space-orbit-c"><i></i></span></div>
        <header class="en-header" id="enHeader">
          <a class="en-brand" href="#inicio" aria-label="Ir al inicio">
            <span class="en-brand-mark"><img src="/assets/portfolio/eliana/logo-beauty-nails.webp" alt="Logo Beauty Nails by Eliana"></span>
            <span><strong>BEAUTY NAILS</strong><em>by Eliana</em><small>MANICURA PROFESIONAL</small></span>
          </a>
          <nav class="en-nav" aria-label="Navegación principal">
            <a href="#inicio" data-target="inicio">${icons.home}<span>Inicio</span></a>
            <a href="#sobre-mi" data-target="sobre-mi">${icons.user}<span>Sobre mí</span></a>
            <a href="#trayectoria" data-target="trayectoria">${icons.star}<span>Trayectoria</span></a>
            <div class="en-signature"><small>BEAUTY PORTFOLIO</small><strong>Eliana</strong><i></i></div>
            <a href="#trabajos" data-target="trabajos">${diamond}<span>Trabajos</span></a>
            <a href="#contacto" data-target="contacto">${icons.phone}<span>Contacto</span></a>
          </nav>
          <a class="en-instagram" href="${instagram}" target="_blank" rel="noopener" aria-label="Instagram"><img src="/assets/icons/instagram-official.png" alt=""></a>
        </header>

        <main>
          <section class="en-hero en-section" id="inicio">
            <div class="en-stars" aria-hidden="true"></div>
            <div class="en-container en-hero-grid">
              <div class="en-hero-copy" data-reveal>
                <p class="en-eyebrow">BEAUTY PORTFOLIO · 2026</p>
                <h1>Diseños que realzan <span>tu belleza</span></h1>
                <p class="en-lead">Manicura profesional con atención personalizada, precisión técnica y una mirada creativa para que cada diseño refleje tu estilo.</p>
                <div class="en-actions">
                  <a class="en-btn en-btn-primary" href="#trabajos">Ver mis trabajos</a>
                  <a class="en-btn en-btn-outline" href="https://wa.me/${whatsapp}?text=${waText}" target="_blank" rel="noopener">Reservar turno</a>
                </div>
                <div class="en-metrics">
                  <article><strong>100%</strong><span>Atención personalizada</span></article>
                  <article><strong>Premium</strong><span>Productos y terminaciones</span></article>
                  <article><strong>Único</strong><span>Diseño para cada clienta</span></article>
                </div>
              </div>
              <div class="en-hero-art" data-reveal>
                <div class="en-orbit en-orbit-one"></div><div class="en-orbit en-orbit-two"></div>
                <figure class="en-photo en-photo-main"><img src="/assets/portfolio/eliana/hero-main-v237.webp?v=2.3.7" alt="Diseño de uñas en tonos celeste, plateado y detalles artísticos"></figure>
                <figure class="en-photo en-photo-side"><img src="/assets/portfolio/eliana/hero-front-v237.webp?v=2.3.7" alt="Diseño de uñas con francesa multicolor en tonos pastel"></figure>
                <span class="en-diamond">${diamond}</span>
                <span class="en-seal">PASIÓN · DEDICACIÓN · BELLEZA</span>
              </div>
            </div>
          </section>

          <section class="en-about en-section" id="sobre-mi">
            <div class="en-container">
              <div class="en-heading" data-reveal><p class="en-eyebrow">CONOCÉ MI ESENCIA</p><h2>Sobre <span>mí</span></h2><p>Una experiencia cuidada desde el primer momento hasta el último detalle.</p></div>
              <div class="en-about-grid">
                <article class="en-about-copy" data-reveal>
                  <h3>Hola, soy <span>Eliana</span> ♡</h3>
                  <p>Soy una profesional apasionada por el mundo de la belleza y el cuidado de las uñas. Mi objetivo es que cada clienta disfrute de un servicio cómodo, personalizado y realizado con dedicación.</p>
                  <p>Trabajo constantemente para perfeccionar mis técnicas y ofrecer diseños modernos, delicados y duraderos que acompañen la personalidad y el estilo de cada persona.</p>
                  <blockquote>“Cada detalle importa: una buena manicura también es una forma de expresión.”</blockquote>
                </article>
                <div class="en-about-visual" data-reveal>
                  <figure><img src="/assets/portfolio/eliana/sobre-mi-v238.webp?v=2.3.8" alt="Eliana, manicurista profesional, en su espacio de trabajo"></figure>
                </div>
              </div>
              <div class="en-values">
                <article data-reveal>${nailIcon}<h3>Atención personalizada</h3><p>Cada servicio se adapta a tus gustos y necesidades.</p></article>
                <article data-reveal>${diamond}<h3>Calidad profesional</h3><p>Productos seleccionados y técnicas de terminación premium.</p></article>
                <article data-reveal>${icons.star}<h3>Higiene y seguridad</h3><p>Protocolos de limpieza y cuidado en cada servicio.</p></article>
                <article data-reveal>${sparkle}<h3>Creatividad sin límites</h3><p>Diseños exclusivos pensados para destacar tu estilo.</p></article>
              </div>
            </div>
          </section>

          <section class="en-journey en-section" id="trayectoria">
            <div class="en-container">
              <div class="en-heading en-heading-center" data-reveal><p class="en-eyebrow">CRECIMIENTO PROFESIONAL</p><h2>Mi <span>trayectoria</span></h2><p>Técnica, creatividad y capacitación continua al servicio de resultados impecables.</p></div>
              <div class="en-journey-grid">
                <figure class="en-journey-image" data-reveal><img src="/assets/portfolio/eliana/trayectoria-v239.webp?v=2.3.9" alt="Eliana realizando un servicio profesional de manicura en su estudio"><span>DISEÑO · DETALLE · BELLEZA</span></figure>
                <div class="en-timeline" data-reveal>
                  <article><b>01</b><div><h3>Formación técnica</h3><p>Aprendizaje de bases de manicura, preparación, esmaltado y cuidado integral de la uña.</p></div></article>
                  <article><b>02</b><div><h3>Perfeccionamiento</h3><p>Actualización constante en tendencias, estructuras, nail art y terminaciones profesionales.</p></div></article>
                  <article><b>03</b><div><h3>Identidad propia</h3><p>Desarrollo de una propuesta estética delicada, moderna y reconocible.</p></div></article>
                  <article><b>04</b><div><h3>Experiencia personalizada</h3><p>Asesoramiento para crear diseños que combinen elegancia, comodidad y personalidad.</p></div></article>
                </div>
                <aside class="en-strengths en-training" data-reveal>
                  <h3>Mi capacitación</h3>
                  <ul>
                    <li>${nailIcon}<span><strong>Manicura rusa y correcto uso de torno/drill</strong></span></li>
                    <li>${diamond}<span><strong>Capping en polygel, gel, acrílico, bases y semipermanente</strong></span></li>
                    <li>${sparkle}<span><strong>Bioseguridad en manicura y pedicura</strong></span></li>
                    <li>${icons.star}<span><strong>Soft Gel y nail art</strong></span></li>
                    <li>${icons.user}<span><strong>Esmaltado semipermanente y nivelación</strong></span></li>
                  </ul>
                </aside>
              </div>
            </div>
          </section>

          <section class="en-services-strip" aria-label="Servicios de Beauty Nails by Eliana">
            <div class="en-services-title"><span></span><strong>Servicios</strong><span></span></div>
            <div class="en-services-marquee">
            <div class="en-services-fade en-services-fade-left" aria-hidden="true"></div>
            <div class="en-services-track">
              <div class="en-services-group">
                <span>Semipermanente</span><i>✦</i>
                <span>Capping</span><i>✦</i>
                <span>Soft Gel</span><i>✦</i>
                <span>Retiro con belleza de manos</span><i>✦</i>
                <span>Manicura rusa</span><i>✦</i>
                <span>Nail art</span><i>✦</i>
                <span>Nivelación</span><i>✦</i>
                <span>Bioseguridad</span><i>✦</i>
              </div>
              <div class="en-services-group" aria-hidden="true">
                <span>Semipermanente</span><i>✦</i>
                <span>Capping</span><i>✦</i>
                <span>Soft Gel</span><i>✦</i>
                <span>Retiro con belleza de manos</span><i>✦</i>
                <span>Manicura rusa</span><i>✦</i>
                <span>Nail art</span><i>✦</i>
                <span>Nivelación</span><i>✦</i>
                <span>Bioseguridad</span><i>✦</i>
              </div>
            </div>
            <div class="en-services-fade en-services-fade-right" aria-hidden="true"></div>
            </div>
          </section>

          <section class="en-work en-section" id="trabajos">
            <div class="en-container">
              <div class="en-heading" data-reveal><p class="en-eyebrow">SELECCIÓN DE DISEÑOS</p><h2>Mis <span>trabajos</span></h2><p>Ideas delicadas, modernas y personalizadas realizadas con dedicación en cada detalle.</p></div>
              <div class="en-gallery">
                <article class="en-work-card en-work-card-wide" data-reveal><img src="/assets/portfolio/eliana/work-french.webp?v=2.3.5" alt="Semipermanente en tono fucsia con brillo"><div><span>01</span><h3>Semipermanente</h3><p>Color intenso, brillo duradero y una terminación impecable que realza la belleza natural de tus uñas.</p></div></article>
                <article class="en-work-card en-work-card-tall" data-reveal><img src="/assets/portfolio/eliana/work-silver.webp?v=2.3.5" alt="Capping con diseño turquesa sobre uñas naturales"><div><span>02</span><h3>Capping con diseño en uñas naturales</h3><p>Refuerzo sobre la uña natural con brillo, color y detalles artísticos para un resultado resistente y único.</p></div></article>
                <article class="en-work-card" data-reveal><img src="/assets/portfolio/eliana/work-pink.webp?v=2.3.5" alt="Capping delicado en uñas cortas"><div><span>03</span><h3>Capping en uñas cortas</h3><p>Refuerzo delicado y natural para lucir uñas cortas prolijas, cómodas y con una terminación sofisticada.</p></div></article>
                <article class="en-work-card" data-reveal><img src="/assets/portfolio/eliana/work-blue.webp?v=2.3.5" alt="Semipermanente bordó con diseño animal print"><div><span>04</span><h3>Semipermanente con diseño</h3><p>Color y diseño personalizados con un acabado moderno, creativo y duradero.</p></div></article>
                <article class="en-work-card en-work-card-softgel" data-reveal><img src="/assets/portfolio/eliana/work-softgel.webp?v=2.3.5" alt="Extensiones Soft Gel en rosa, negro y detalles animal print"><div><span>05</span><h3>Sof Gel</h3><p>Extensiones Soft Gel con terminaciones naturales, livianas y resistentes. Una técnica moderna que combina comodidad, precisión y un acabado elegante.</p></div></article>
              </div>
              <div class="en-work-cta" data-reveal><span>${sparkle}</span><div><h3>¿Tenés una idea para tu próximo diseño?</h3><p>La transformamos juntas en una propuesta única y pensada para vos.</p></div><a class="en-btn en-btn-primary" href="https://wa.me/${whatsapp}?text=${waText}" target="_blank" rel="noopener">Quiero reservar</a></div>
            </div>
          </section>

          <section class="en-contact en-section" id="contacto">
            <div class="en-container en-contact-grid">
              <div class="en-contact-copy" data-reveal><p class="en-eyebrow">CADA DISEÑO COMIENZA CON UNA IDEA</p><h2>Creemos algo <span>hermoso</span></h2><p>Consultá disponibilidad, contame qué estilo te gusta y coordinemos tu próximo turno.</p><div class="en-contact-list"><a href="https://wa.me/${whatsapp}?text=${waText}" target="_blank" rel="noopener"><img src="/assets/icons/whatsapp-green.svg" alt=""><span><small>WhatsApp</small><strong>+54 9 2964 50 8024</strong></span></a><a href="${instagram}" target="_blank" rel="noopener"><img src="/assets/icons/instagram-official.png" alt=""><span><small>Instagram</small><strong>@beauty.nails.by_eliana</strong></span></a></div></div>
              <div class="en-contact-art" data-reveal>
                <figure><img src="/assets/portfolio/eliana/contacto-fondo-v239.webp?v=2.3.9" alt="Exhibidor profesional de esmaltes y productos de manicura"></figure>
                <div class="en-contact-panel">
                  <div class="en-contact-panel-top"><span class="en-panel-icon">${diamond}</span><span class="en-panel-tag">ATENCIÓN PERSONALIZADA</span></div>
                  <h3>Tu próximo diseño<br><em>empieza acá</em></h3>
                  <p>Contame qué estilo tenés en mente y coordinamos juntas una propuesta pensada para vos.</p>
                  <div class="en-panel-info"><span>Turnos programados</span><strong>Río Grande · Tierra del Fuego</strong></div>
                  <a class="en-panel-cta" href="https://wa.me/${whatsapp}?text=${waText}" target="_blank" rel="noopener"><img src="/assets/icons/whatsapp-green.svg" alt="">Solicitar disponibilidad</a>
                </div>
              </div>
            </div>
          </section>
        </main>
        <footer class="en-footer"><span>Beauty Nails by Eliana · Portfolio profesional</span><span>Desarrollado por <strong>CVStudio</strong></span></footer>
      </div>`;

    const header = document.getElementById('enHeader');
    const navLinks = [...root.querySelectorAll('[data-target]')];
    const sections = [...root.querySelectorAll('.en-section')];
    navLinks.forEach(link => link.addEventListener('click', () => {
      navLinks.forEach(item => item.classList.remove('is-active'));
      link.classList.add('is-active');
    }));
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => link.classList.toggle('is-active', link.dataset.target === entry.target.id));
      }
    }), { rootMargin: '-35% 0px -55%', threshold: 0 });
    sections.forEach(section => observer.observe(section));
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); reveal.unobserve(entry.target); }
    }), { threshold: .12 });
    root.querySelectorAll('[data-reveal]').forEach(el => reveal.observe(el));
    window.addEventListener('scroll', () => header.classList.toggle('is-scrolled', window.scrollY > 18), { passive: true });

    // Carrusel continuo de derecha a izquierda. El transform inline con prioridad
    // evita que reglas antiguas o ajustes de accesibilidad lo dejen detenido.
    const servicesTrack = root.querySelector('.en-services-track');
    const servicesGroup = root.querySelector('.en-services-group');
    if (servicesTrack && servicesGroup) {
      servicesTrack.classList.add('is-js-animated');
      servicesTrack.style.setProperty('animation', 'none', 'important');
      servicesTrack.style.setProperty('-webkit-animation', 'none', 'important');
      let offset = 0;
      let previous = performance.now();
      let groupWidth = 0;
      const speed = window.matchMedia('(max-width: 820px)').matches ? 42 : 34;
      const measure = () => {
        groupWidth = Math.max(1, servicesGroup.scrollWidth || servicesGroup.getBoundingClientRect().width);
      };
      measure();
      if ('ResizeObserver' in window) new ResizeObserver(measure).observe(servicesGroup);
      window.addEventListener('resize', measure, { passive: true });
      const animateServices = now => {
        const elapsed = Math.min((now - previous) / 1000, .1);
        previous = now;
        offset -= speed * elapsed;
        if (-offset >= groupWidth) offset += groupWidth;
        servicesTrack.style.setProperty('transform', `translate3d(${offset}px,0,0)`, 'important');
        requestAnimationFrame(animateServices);
      };
      requestAnimationFrame(animateServices);
    }

    // Universo orgánico: nebulosas, estrellas, constelaciones y satélites suaves.
    const galaxyCanvas = root.querySelector('.en-galaxy-canvas');
    if (galaxyCanvas) {
      const ctx = galaxyCanvas.getContext('2d', { alpha: true });
      let width = 0, height = 0, dpr = 1, lastFrame = 0;
      let stars = [], nodes = [], satellites = [];
      const random = (a, b) => a + Math.random() * (b - a);
      const rebuildGalaxy = () => {
        dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        width = window.innerWidth;
        height = window.innerHeight;
        galaxyCanvas.width = Math.round(width * dpr);
        galaxyCanvas.height = Math.round(height * dpr);
        galaxyCanvas.style.width = `${width}px`;
        galaxyCanvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const starCount = width < 700 ? 72 : 125;
        stars = Array.from({ length: starCount }, () => ({
          x: Math.random() * width, y: Math.random() * height,
          r: random(.35, 1.35), a: random(.18, .82), tw: random(.0006, .0022), p: random(0, Math.PI * 2),
          vx: random(-.008, .014), vy: random(.004, .02)
        }));
        nodes = Array.from({ length: width < 700 ? 6 : 9 }, () => ({ x: random(.08, .92) * width, y: random(.1, .9) * height }));
        satellites = [
          { cx: width * .24, cy: height * .32, rx: width * .16, ry: 42, t: 1.1, v: .000035 },
          { cx: width * .76, cy: height * .68, rx: width * .12, ry: 34, t: 3.7, v: -.000028 }
        ];
      };
      const drawNebula = (x, y, radius, color) => {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(.38, color.replace(/\.[0-9]+\)$/, '.10)'));
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath(); ctx.ellipse(x, y, radius, radius * .54, -.25, 0, Math.PI * 2); ctx.fill();
      };
      const drawGalaxy = time => {
        if (time - lastFrame < 33) { requestAnimationFrame(drawGalaxy); return; }
        lastFrame = time;
        ctx.clearRect(0, 0, width, height);
        const drift = time * .000018;
        drawNebula(width * (.22 + Math.sin(drift) * .025), height * .27, Math.max(width * .31, 250), 'rgba(154,55,222,.18)');
        drawNebula(width * (.76 + Math.cos(drift * .8) * .02), height * .62, Math.max(width * .28, 220), 'rgba(67,88,196,.15)');
        ctx.save();
        for (const star of stars) {
          star.x += star.vx; star.y += star.vy;
          if (star.x > width + 3) star.x = -3; if (star.x < -3) star.x = width + 3;
          if (star.y > height + 3) star.y = -3;
          const alpha = star.a * (.68 + .32 * Math.sin(time * star.tw + star.p));
          ctx.fillStyle = `rgba(245,225,255,${alpha})`;
          ctx.beginPath(); ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.strokeStyle = 'rgba(229,166,255,.105)'; ctx.lineWidth = .7;
        for (let i = 0; i < nodes.length - 1; i++) {
          if (i % 3 !== 2) { ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[i+1].x, nodes[i+1].y); ctx.stroke(); }
        }
        for (const n of nodes) { ctx.fillStyle='rgba(245,218,255,.36)'; ctx.beginPath(); ctx.arc(n.x,n.y,1.25,0,Math.PI*2); ctx.fill(); }
        for (const sat of satellites) {
          sat.t += sat.v * 33;
          ctx.strokeStyle='rgba(214,92,255,.07)'; ctx.lineWidth=.7; ctx.beginPath(); ctx.ellipse(sat.cx,sat.cy,sat.rx,sat.ry,-.18,0,Math.PI*2); ctx.stroke();
          const sx=sat.cx+Math.cos(sat.t)*sat.rx, sy=sat.cy+Math.sin(sat.t)*sat.ry;
          ctx.fillStyle='rgba(236,183,255,.72)'; ctx.shadowColor='rgba(214,92,255,.7)'; ctx.shadowBlur=8; ctx.fillRect(sx-2.2,sy-1.2,4.4,2.4); ctx.shadowBlur=0;
        }
        ctx.restore();
        requestAnimationFrame(drawGalaxy);
      };
      rebuildGalaxy();
      window.addEventListener('resize', rebuildGalaxy, { passive: true });
      requestAnimationFrame(drawGalaxy);
    }
  };
})();
