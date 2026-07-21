/* =====================================================
   CVSTUDIO V3 — ECOSISTEMA DIGITAL
===================================================== */

(() => {
  "use strict";

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reducedMotion) return;

  const mobileMode = window.matchMedia("(max-width: 700px)").matches;

  const brands = [
    { name: "Instagram", icon: "assets/icons/instagram.svg", className: "brand-instagram", depth: "mid" },
    { name: "Facebook", icon: "assets/icons/facebook.svg", className: "brand-facebook", depth: "far" },
    { name: "TikTok", icon: "assets/icons/tiktok.svg", className: "brand-tiktok", depth: "near" },
    { name: "LinkedIn", icon: "assets/icons/linkedin.svg", className: "brand-linkedin", depth: "far" },
    { name: "X", icon: "assets/icons/x.svg", className: "brand-x", depth: "mid" },
    { name: "WhatsApp", icon: "assets/icons/whatsapp.svg", className: "brand-whatsapp", depth: "near" },
    { name: "Gmail", icon: "assets/icons/gmail.svg", className: "brand-gmail", depth: "far" },
    { name: "Kick", icon: "assets/icons/kick.svg", className: "brand-kick", depth: "mid" },
    { name: "OpenAI", icon: "assets/icons/openai.svg", className: "brand-openai", depth: "far" },
    { name: "YouTube", icon: "assets/icons/youtube.svg", className: "brand-youtube", depth: "near" },
    { name: "Snapchat", icon: "assets/icons/snapchat.svg", className: "brand-snapchat", depth: "mid" },
    { name: "Pinterest", icon: "assets/icons/pinterest.svg", className: "brand-pinterest", depth: "far" },
    { name: "Twitch", icon: "assets/icons/twitch.svg", className: "brand-twitch", depth: "mid" },
    { name: "GitHub", icon: "assets/icons/github.svg", className: "brand-github", depth: "far" },
    { name: "Discord", icon: "assets/icons/discord.svg", className: "brand-discord", depth: "mid" },
    { name: "Canva", icon: "assets/icons/canva.svg", className: "brand-canva", depth: "far" },
    { name: "Mercado Pago", icon: "assets/icons/mercadopago.svg", className: "brand-mercadopago", depth: "mid" }
  ];

  const windLayer = document.createElement("div");
  windLayer.className = "digital-wind-v3";
  windLayer.setAttribute("aria-hidden", "true");

  const particleLayer = document.createElement("div");
  particleLayer.className = "digital-particles-v3";
  particleLayer.setAttribute("aria-hidden", "true");

  const atmosphereLayer = document.createElement("div");
  atmosphereLayer.className = "digital-atmosphere-v3";
  atmosphereLayer.setAttribute("aria-hidden", "true");

  const signature = document.createElement("div");
  signature.className = "digital-signature-v3";
  signature.textContent = "CVStudio";
  signature.setAttribute("aria-hidden", "true");

  document.body.append(
    atmosphereLayer,
    windLayer,
    particleLayer,
    signature
  );

  /* Entrada cinematográfica una sola vez por carga */
  document.documentElement.classList.add("digital-intro-v3");

  window.setTimeout(() => {
    document.documentElement.classList.remove("digital-intro-v3");
    document.documentElement.classList.add("digital-intro-finished-v3");
  }, mobileMode ? 1400 : 2200);

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  const amount = mobileMode ? 5 : brands.length;

  brands.slice(0, amount).forEach((brand, index) => {
    const item = document.createElement("span");

    item.className =
      `digital-brand-v3 ${brand.className} depth-${brand.depth}`;

    item.dataset.windIndex = String(index);
    item.setAttribute("title", brand.name);

    const image = document.createElement("img");
    image.src = brand.icon;
    image.alt = "";
    image.width = 64;
    image.height = 64;
    image.loading = "lazy";
    image.decoding = "async";

    item.appendChild(image);

    const duration =
      brand.depth === "near"
        ? randomBetween(15, 21)
        : brand.depth === "mid"
          ? randomBetween(21, 29)
          : randomBetween(28, 38);

    const size =
      brand.depth === "near"
        ? randomBetween(58, 82)
        : brand.depth === "mid"
          ? randomBetween(42, 64)
          : randomBetween(30, 48);

    item.style.setProperty(
      "--wind-top",
      `${randomBetween(7, 90).toFixed(1)}%`
    );

    item.style.setProperty("--wind-size", `${size.toFixed(0)}px`);

    item.style.setProperty(
      "--wind-duration",
      `${duration.toFixed(1)}s`
    );

    item.style.setProperty(
      "--wind-delay",
      `${(-duration * Math.random()).toFixed(1)}s`
    );

    item.style.setProperty(
      "--wind-rotation",
      `${randomBetween(-18, 18).toFixed(1)}deg`
    );

    item.style.setProperty(
      "--wind-opacity",
      `${randomBetween(
        brand.depth === "far" ? 0.08 : 0.16,
        brand.depth === "near" ? 0.34 : 0.24
      ).toFixed(2)}`
    );

    item.style.setProperty(
      "--brand-pulse-delay",
      `${randomBetween(0, 9).toFixed(1)}s`
    );

    item.style.setProperty(
      "--brand-pulse-duration",
      `${randomBetween(7, 13).toFixed(1)}s`
    );

    windLayer.appendChild(item);
  });

  const particleAmount = mobileMode ? 16 : 52;

  for (let index = 0; index < particleAmount; index += 1) {
    const particle = document.createElement("i");
    const duration = randomBetween(12, 28);

    particle.style.setProperty(
      "--particle-top",
      `${randomBetween(2, 98).toFixed(1)}%`
    );

    particle.style.setProperty(
      "--particle-size",
      `${randomBetween(1, 3.2).toFixed(1)}px`
    );

    particle.style.setProperty(
      "--particle-duration",
      `${duration.toFixed(1)}s`
    );

    particle.style.setProperty(
      "--particle-delay",
      `${(-duration * Math.random()).toFixed(1)}s`
    );

    particle.style.setProperty(
      "--particle-opacity",
      `${randomBetween(0.12, 0.5).toFixed(2)}`
    );

    particleLayer.appendChild(particle);
  }

if (!mobileMode) {
    const cursorLight = document.createElement("div");
cursorLight.className = "cursor-light-v3";
cursorLight.setAttribute("aria-hidden", "true");
document.body.appendChild(cursorLight);
  let frameId = null;

  let targetX = 0;
  let targetY = 0;

  let currentX = 0;
  let currentY = 0;

  let pointerClientX = window.innerWidth / 2;
  let pointerClientY = window.innerHeight / 2;

  function renderPointerEffect() {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;

    windLayer.style.setProperty(
      "--pointer-x",
      `${currentX.toFixed(2)}px`
    );

    windLayer.style.setProperty(
      "--pointer-y",
      `${currentY.toFixed(2)}px`
    );
    cursorLight.style.setProperty(
  "--cursor-light-x",
  `${pointerClientX}px`
);

cursorLight.style.setProperty(
  "--cursor-light-y",
  `${pointerClientY}px`
);

    const stillMoving =
      Math.abs(targetX - currentX) > 0.03 ||
      Math.abs(targetY - currentY) > 0.03;

    if (stillMoving) {
      frameId = requestAnimationFrame(renderPointerEffect);
    } else {
      frameId = null;
    }
  }

  function requestRender() {
    if (!frameId) {
      frameId = requestAnimationFrame(renderPointerEffect);
    }
  }

  window.addEventListener(
    "pointermove",
    (event) => {
        pointerClientX = event.clientX;
pointerClientY = event.clientY;
      const normalizedX =
        event.clientX / window.innerWidth - 0.5;

      const normalizedY =
        event.clientY / window.innerHeight - 0.5;

      targetX = normalizedX * 34;
      targetY = normalizedY * 24;

      requestRender();
    },
    { passive: true }
  );

  document.documentElement.addEventListener(
    "mouseleave",
    () => {
      targetX = 0;
      targetY = 0;
      requestRender();
    }
  );
}
})();