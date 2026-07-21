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