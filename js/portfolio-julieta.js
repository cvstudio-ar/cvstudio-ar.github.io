(() => {
  'use strict';

  window.renderJulietaPortfolio = function renderJulietaPortfolio(p, helpers) {
    const { root, esc, safeUrl, icons } = helpers;
    const settings = p.settings || {};
    const colors = Array.isArray(settings.colors) ? settings.colors : ['#f5c84c', '#050506', '#f7f2ea'];
    const brand = esc(p.brand_name || p.full_name || 'followdigital.juli');
    const business = esc(p.business_type || 'Fotografía y comunicación digital');
    const logo = '/assets/portfolio/julieta/follow-digital-logo.jpg';
    const instagram = safeUrl(settings.instagram || '');
    const facebook = safeUrl(settings.facebook || '');
    const whatsapp = String(p.whatsapp || '3493511052').replace(/\D/g, '');
    const waText = encodeURIComponent('Hola Julieta, vi tu portfolio profesional y quisiera conversar sobre un proyecto.');

    document.title = `${p.brand_name || p.full_name || 'Julieta Ferrari'} · Portfolio profesional`;
    root.className = 'julieta-site';
    root.style.setProperty('--accent', colors[0] || '#f5c84c');
    root.style.setProperty('--dark', colors[1] || '#050506');
    root.style.setProperty('--light', colors[2] || '#f7f2ea');

    const navItems = [
      ['inicio', 'Inicio', icons.home],
      ['sobre-mi', 'Sobre mí', icons.user],
      ['servicios', 'Servicios', icons.briefcase],
      ['proyectos', 'Proyectos', icons.folder],
      ['experiencia', 'Experiencia', icons.star],
      ['contacto', 'Contacto', icons.phone]
    ];

    root.innerHTML = `
      <div class="jp-page">
        <header class="jp-header" id="jpHeader">
          <a class="jp-identity" href="#inicio" aria-label="Ir al inicio">
            ${logo ? `<img src="${esc(logo)}" alt="Logo de ${brand}">` : `<span class="jp-logo-fallback">JF</span>`}
            <span><strong>${brand}</strong><small>MARKETING</small><em>${business}</em></span>
          </a>
          <nav class="jp-nav" aria-label="Navegación principal">
            ${navItems.slice(0,3).map(([id,label,icon]) => `<a href="#${id}" data-target="${id}">${icon}<span>${label}</span></a>`).join('')}
            <div class="jp-signature"><small>PORTFOLIO</small><strong>FollowDigital</strong><i></i></div>
            ${navItems.slice(3).map(([id,label,icon]) => `<a href="#${id}" data-target="${id}">${icon}<span>${label}</span></a>`).join('')}
          </nav>
          <div class="jp-socials">
            ${instagram ? `<a href="${esc(instagram)}" target="_blank" rel="noopener" aria-label="Instagram"><img src="/assets/icons/instagram-official.png" alt=""></a>` : ''}
            ${facebook ? `<a href="${esc(facebook)}" target="_blank" rel="noopener" aria-label="Facebook"><img src="/assets/icons/facebook-official.png" alt=""></a>` : ''}
          </div>
        </header>

        <main>
          <section class="jp-hero jp-section" id="inicio">
            <div class="jp-hero-glow"></div>
            <div class="jp-container jp-hero-grid">
              <div class="jp-hero-copy" data-reveal>
                <p class="jp-kicker">Portfolio profesional</p>
                <h1>Soy <span>Julieta Ferrari</span></h1>
                <p class="jp-professions">Comunicadora Digital · Fotógrafa Profesional · Creadora de Contenido</p>
                <div class="jp-rule"></div>
                <p class="jp-lead">Transformo ideas en imágenes que comunican, conectan y fortalecen la identidad de personas, marcas e instituciones.</p>
                <div class="jp-actions">
                  <a class="jp-btn jp-btn-primary" href="#proyectos">Ver proyectos</a>
                  <a class="jp-btn jp-btn-ghost" href="https://wa.me/${whatsapp}?text=${waText}" target="_blank" rel="noopener">Trabajemos juntos</a>
                </div>
                <div class="jp-mini-gallery" aria-label="Muestra de trabajos">
                  <img src="/assets/portfolio/julieta/about-portrait.jpg" alt="Retrato creativo con flores">
                  <img src="/assets/portfolio/julieta/training-main.jpg" alt="Retrato profesional al aire libre">
                  <img src="/assets/portfolio/julieta/hero-cat.jpg" alt="Fotografía del gato sobre textiles artesanales">
                </div>
              </div>
              <div class="jp-hero-visual" data-reveal>
                <div class="jp-orbit"></div>
                <img class="jp-hero-person" src="/assets/portfolio/julieta/hero-julieta-transparent.png" alt="Julieta Ferrari con una cámara fotográfica">
                <span class="jp-hero-badge">Fotografía<br>con propósito</span>
              </div>
            </div>
          </section>

          <section class="jp-about jp-section" id="sobre-mi">
            <div class="jp-container">
              <div class="jp-section-heading" data-reveal>
                <p class="jp-kicker">Perfil profesional</p>
                <h2>Sobre <span>mí</span></h2>
                <p>Creatividad, planificación y una mirada estratégica aplicadas a cada historia.</p>
              </div>
              <div class="jp-about-grid">
                <article class="jp-about-copy jp-card" data-reveal>
                  <p>Soy Comunicadora Digital y Fotógrafa, especializada en la creación de contenido visual y estrategias de comunicación para marcas, emprendimientos e instituciones.</p>
                  <p>Mi trabajo combina creatividad, planificación y una mirada estratégica para desarrollar proyectos que transmitan identidad, generen conexión y fortalezcan la presencia de cada cliente.</p>
                  <p>Creo en el poder de las imágenes para contar historias, comunicar ideas y crear experiencias que perduren en el tiempo.</p>
                  <blockquote>“Comunicar no es solo mostrar una imagen: es transmitir una historia con identidad, emoción y propósito.”</blockquote>
                </article>
                <div class="jp-about-images" data-reveal>
                  <figure class="jp-image-card jp-image-card-tall"><img src="/assets/portfolio/julieta/about-portrait.jpg" alt="Producción fotográfica creativa"><figcaption>Producción visual y dirección creativa</figcaption></figure>
                  <figure class="jp-image-card"><img src="/assets/portfolio/julieta/about-work.jpg" alt="Julieta trabajando en edición y comunicación"><figcaption>Planificación, edición y entrega final</figcaption></figure>
                </div>
              </div>
            </div>
          </section>

          <section class="jp-services jp-section" id="servicios">
            <div class="jp-container">
              <div class="jp-section-heading jp-heading-light" data-reveal>
                <p class="jp-kicker">Más que fotografías</p>
                <h2>Historias que <span>conectan</span></h2>
                <p>Cada proyecto representa una oportunidad para capturar momentos, transmitir emociones y construir una comunicación visual auténtica.</p>
              </div>
              <div class="jp-service-grid">
                <article class="jp-service-card" data-reveal>
                  <img src="/assets/portfolio/julieta/service-photo.jpg" alt="Book fotográfico profesional">
                  <div><span>01</span><h3>Fotografía</h3><ul><li>Books</li><li>Fotografía de producto</li><li>Fotografía comercial</li><li>Fotografía institucional</li><li>Cobertura periodística</li></ul></div>
                </article>
                <article class="jp-service-card" data-reveal>
                  <img src="/assets/portfolio/julieta/service-events.jpg" alt="Cobertura fotográfica de eventos deportivos">
                  <div><span>02</span><h3>Cobertura de eventos</h3><ul><li>Eventos deportivos</li><li>Eventos culturales</li><li>Eventos sociales</li><li>Cobertura en tiempo real</li><li>Fotografía documental</li></ul></div>
                </article>
                <article class="jp-service-card" data-reveal>
                  <img src="/assets/portfolio/julieta/service-lifestyle.jpg" alt="Retratos y fotografía lifestyle">
                  <div><span>03</span><h3>Retratos & Lifestyle</h3><ul><li>Sesiones familiares</li><li>Books infantiles</li><li>Retratos profesionales</li><li>Fotografía lifestyle</li><li>Momentos espontáneos</li></ul></div>
                </article>
              </div>
            </div>
          </section>

          <section class="jp-projects jp-section" id="proyectos">
            <div class="jp-container">
              <div class="jp-section-heading" data-reveal>
                <p class="jp-kicker">Selección de trabajos</p>
                <h2>Proyectos <span>destacados</span></h2>
                <p>Comunicación digital, fotografía y producción de contenidos para marcas, instituciones y eventos.</p>
              </div>
              <div class="jp-project-feature" data-reveal>
                <img src="/assets/portfolio/julieta/experience-boy.jpg" alt="Fotografía documental infantil">
                <div><p class="jp-kicker">Comunicación digital · Fotografía · Contenidos</p><h3>Imágenes que cuentan una historia</h3><p>Proyectos desarrollados de manera integral: desde la idea y la planificación hasta la producción, edición y publicación, preservando una identidad visual coherente.</p></div>
              </div>
              <div class="jp-project-list">
                <article data-reveal><strong>Vital Gym</strong><span>Gestión de redes, contenido y desarrollo web.</span></article>
                <article data-reveal><strong>Fiesta Nacional de la Bagna Cauda</strong><span>Cobertura fotográfica y difusión.</span></article>
                <article data-reveal><strong>Follow Digital</strong><span>Fotografía, redes y comunicación para proyectos artísticos.</span></article>
                <article data-reveal><strong>Feria de Emprendedores Humberto Primo</strong><span>Producción fotográfica y comunicación digital.</span></article>
                <article data-reveal><strong>Feria Raíces Italianas</strong><span>Cobertura fotográfica y contenido para difusión digital.</span></article>
              </div>
            </div>
          </section>

          <section class="jp-experience jp-section" id="experiencia">
            <div class="jp-container jp-experience-grid">
              <div class="jp-experience-copy" data-reveal>
                <p class="jp-kicker">Freelance · 2017 — Actualidad</p>
                <h2>Experiencia <span>freelance</span></h2>
                <p>Desde 2017 desarrollo proyectos de comunicación digital, fotografía y producción de contenidos para marcas, emprendimientos, organizaciones y eventos.</p>
                <ul class="jp-check-list"><li>Estrategia de comunicación digital</li><li>Gestión y planificación de contenidos</li><li>Producción visual, audiovisual y escrita</li><li>Fotografía comercial, social e institucional</li><li>Dirección creativa y producción de sesiones</li><li>Cobertura de eventos y contenidos informativos</li></ul>
              </div>
              <div class="jp-training" data-reveal>
                <h3>Formación & herramientas</h3>
                <div class="jp-training-card jp-training-main"><img src="/assets/portfolio/julieta/training-main.jpg" alt="Formación profesional en fotografía"><div><strong>Formación profesional</strong><p>Asistente en Marketing y Comunicación Digital — Loopian, 2025</p><p>Fotografía Digital y Profesional — Fundación ATILRA, 2021</p><p>Fotografía y Periodismo Digital — Loopian, 2017–2018</p></div></div>
                <div class="jp-training-pair">
                  <div class="jp-training-card"><img src="/assets/portfolio/julieta/training-extra.jpg" alt="Capacitaciones complementarias"><div><strong>Capacitaciones</strong><p>Iluminación · Técnica fotográfica · Diseño gráfico · Edición de imágenes · Gestión de redes sociales · Redacción digital</p></div></div>
                  <div class="jp-training-card"><img src="/assets/portfolio/julieta/training-tools.jpg" alt="Herramientas profesionales"><div><strong>Herramientas</strong><p>Adobe Photoshop · Edición y retoque · Plataformas sociales · Cámara réflex y equipo fotográfico</p></div></div>
                </div>
              </div>
            </div>
          </section>

          <section class="jp-contact jp-section" id="contacto">
            <div class="jp-container jp-contact-grid">
              <div class="jp-contact-copy" data-reveal>
                <p class="jp-kicker">Cada proyecto comienza con una conversación</p>
                <h2>Trabajemos <span>juntos</span></h2>
                <p class="jp-contact-lead"><strong>¿Tenés una marca, un proyecto o una historia que querés comunicar?</strong><br>Estoy disponible para colaborar con emprendimientos, empresas, instituciones y organizaciones que busquen fortalecer su identidad y presencia digital mediante fotografía profesional, contenido estratégico y comunicación visual.</p>
                <div class="jp-contact-cards">
                  <a href="https://wa.me/${whatsapp}?text=${waText}" target="_blank" rel="noopener"><span class="jp-contact-icon jp-contact-icon-wa"><img src="/assets/icons/social-official/whatsapp.svg" alt=""></span><div><small>WhatsApp</small><strong>+54 9 3493 511052</strong></div></a>
                  <a href="mailto:julio796@hotmail.com"><span class="jp-contact-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v14H3z"/><path d="m3 6 9 7 9-7"/></svg></span><div><small>Email</small><strong>julio796@hotmail.com</strong></div></a>
                  ${instagram ? `<a href="${esc(instagram)}" target="_blank" rel="noopener"><span class="jp-contact-icon"><img src="/assets/icons/instagram-official.png" alt=""></span><div><small>Instagram</small><strong>@followdigital.juli</strong></div></a>` : ''}
                  <div><span class="jp-contact-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></span><div><small>Ubicación</small><strong>Humberto Primo, Santa Fe</strong></div></div>
                </div>
              </div>
              <div class="jp-contact-visual" data-reveal><div class="jp-contact-glow"></div><img src="/assets/portfolio/julieta/contact-julieta.jpg" alt="Julieta Ferrari realizando una fotografía"></div>
            </div>
          </section>
        </main>

        <a class="jp-floating-wa" href="https://wa.me/${whatsapp}?text=${waText}" target="_blank" rel="noopener" aria-label="Contactar por WhatsApp"><img src="/assets/icons/social-official/whatsapp.svg" alt=""></a>
        <footer class="jp-footer"><p>Portfolio profesional de Julieta Ferrari</p><a href="https://cvstudio.com.ar">Desarrollado por CVStudio</a></footer>
      </div>`;

    const header = document.getElementById('jpHeader');
    const links = [...root.querySelectorAll('.jp-nav a[data-target]')];
    const sections = links.map(link => document.getElementById(link.dataset.target)).filter(Boolean);

    function setActive(id) {
      links.forEach(link => link.classList.toggle('is-active', link.dataset.target === id));
    }

    links.forEach(link => link.addEventListener('click', event => {
      event.preventDefault();
      const target = document.getElementById(link.dataset.target);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    const sectionObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: '-28% 0px -58% 0px', threshold: [0.05, 0.25, 0.55] });
    sections.forEach(section => sectionObserver.observe(section));

    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    root.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

    window.addEventListener('scroll', () => {
      header.classList.toggle('is-compact', window.scrollY > 40);
      header.classList.remove('is-hidden');
    }, { passive: true });

    setActive('inicio');
  };
})();
