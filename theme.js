// Apply before first paint. Storage is optional for browsing.
(() => {
  let mode = "system";
  try {
    mode = localStorage.getItem("beautycalendar-theme") || mode;
  } catch {}
  if (!["light", "dark", "system"].includes(mode)) mode = "system";
  document.documentElement.dataset.theme = mode;
})();
