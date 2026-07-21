/* =====================================================
   CVSTUDIO — BRILLO QUE SIGUE EL CURSOR
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const interactiveCards = document.querySelectorAll(
    ".project-card, #proceso .process-item, .section.benefits .benefit-card"
  );

  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    return;
  }

  interactiveCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--mouse-x", "50%");
      card.style.setProperty("--mouse-y", "50%");
    });
  });
 
  });