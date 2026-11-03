"use strict";
(() => {
  const scene = document.querySelector("[data-parallax-scene]");
  if (!scene || !("requestAnimationFrame" in window)) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let ticking = false;
  function update() {
    ticking = false;
    if (reduced.matches) {
      scene.style.setProperty("--parallax-media", "0px");
      scene.style.setProperty("--parallax-copy", "0px");
      return;
    }
    const r = scene.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    const delta = Math.max(
      -1,
      Math.min(
        1,
        (window.innerHeight * 0.5 - (r.top + r.height * 0.5)) /
          window.innerHeight,
      ),
    );
    scene.style.setProperty("--parallax-media", (delta * 22).toFixed(1) + "px");
    scene.style.setProperty("--parallax-copy", (-delta * 11).toFixed(1) + "px");
  }
  function schedule() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  reduced.addEventListener?.("change", schedule);
  update();
})();
