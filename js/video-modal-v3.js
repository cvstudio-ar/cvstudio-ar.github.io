/* =====================================================
   CVSTUDIO V3 — MODAL CINEMATOGRÁFICO
===================================================== */

(() => {
  "use strict";

  const modal = document.querySelector("#video-modal-v3");
  const openButton = document.querySelector("[data-video-open]");
  const closeButtons = document.querySelectorAll("[data-video-close]");
  const player = modal?.querySelector(".video-modal-v3-player");
  const source = player?.querySelector("source[data-src]");

  if (!modal || !openButton || !player || !source) return;

  let previouslyFocusedElement = null;

  function loadVideo() {
    if (source.src) return;

    source.src = source.dataset.src;
    player.load();
  }

  async function openModal() {
    previouslyFocusedElement = document.activeElement;

    loadVideo();

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("video-modal-open");

    try {
      player.muted = false;
      await player.play();
    } catch (error) {
      console.log(error);
    }

    modal.querySelector(".video-modal-v3-close")?.focus();
  }

  function closeModal() {
    player.pause();
    player.currentTime = 0;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("video-modal-open");

    previouslyFocusedElement?.focus();
  }

  openButton.addEventListener("click", openModal);

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (!modal.classList.contains("is-open")) return;

    if (event.key === "Escape") {
      closeModal();
    }
  });
})();