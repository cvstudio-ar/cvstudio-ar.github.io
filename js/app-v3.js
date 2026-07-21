/* =====================================================
   CVSTUDIO V3 — APLICACIÓN PRINCIPAL
===================================================== */

import "./hero-v3.js";
import "./video-modal-v3.js";
import "./animations-v3.js";

const root = document.documentElement;

const mobileQuery = window.matchMedia("(max-width: 700px)");
const reducedMotionQuery = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);

function updateExperienceMode() {
  root.classList.toggle("v3-mobile", mobileQuery.matches);
  root.classList.toggle(
    "v3-reduced-motion",
    reducedMotionQuery.matches
  );
}

updateExperienceMode();

mobileQuery.addEventListener?.("change", updateExperienceMode);
reducedMotionQuery.addEventListener?.(
  "change",
  updateExperienceMode
);

document.addEventListener("DOMContentLoaded", () => {
  root.classList.add("v3-ready");
});