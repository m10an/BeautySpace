/** Scroll-driven transforms only. No animation loop, layout reads or large blur filters. */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  function update() {
    frame = 0;
    const y = reduced.matches ? 0 : Math.min(Math.max(scrollY, 0), 900);
    root.style.setProperty("--depth-far", `${(-y * 0.025).toFixed(2)}px`);
    root.style.setProperty("--depth-near", `${(-y * 0.055).toFixed(2)}px`);
    root.style.setProperty(
      "--depth-image",
      `${(Math.min(y, 320) * 0.035).toFixed(2)}px`,
    );
  }
  function schedule() {
    if (!frame && !reduced.matches && !document.hidden)
      frame = requestAnimationFrame(update);
  }
  function preferenceChanged() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    update();
  }
  addEventListener("scroll", schedule, { passive: true });
  reduced.addEventListener("change", preferenceChanged);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) update();
  });
  update();
})();
