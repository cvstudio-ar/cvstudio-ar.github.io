(() => {
  "use strict";

  const header = document.querySelector("#header");

  if (!header) {
    return;
  }

  function updateHeader() {
    header.classList.toggle("is-scrolled", window.scrollY > 30);
  }

  window.addEventListener("scroll", updateHeader, {
    passive: true,
  });

  updateHeader();

  const links = [
    ...header.querySelectorAll('.navigation a[href^="#"]'),
  ];

  const sections = links
    .map((link) => {
      const selector = link.getAttribute("href");

      try {
        return document.querySelector(selector);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              second.intersectionRatio - first.intersectionRatio
          )[0];

        if (!visible) {
          return;
        }

        links.forEach((link) => {
          link.classList.toggle(
            "is-active",
            link.getAttribute("href") === `#${visible.target.id}`
          );
        });
      },
      {
        rootMargin: "-28% 0px -58% 0px",
        threshold: [0.1, 0.25, 0.5],
      }
    );

    sections.forEach((section) => {
      observer.observe(section);
    });
  }
})();