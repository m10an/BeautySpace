const select = document.getElementById("themeSelect");
select.value = document.documentElement.dataset.theme;
select.onchange = () => {
  document.documentElement.dataset.theme = select.value;
  try {
    localStorage.setItem("beautycalendar-theme", select.value);
  } catch {
    document.getElementById("appStatus").textContent =
      "Theme changed for this session; storage is unavailable.";
  }
};
const tabs = [...document.querySelectorAll("[data-tab]")];
function syncTabs() {
  for (const tab of tabs)
    tab.setAttribute("aria-pressed", String(tab.classList.contains("active")));
}
for (const tab of tabs)
  tab.addEventListener("click", () => {
    syncTabs();
    document.title = `${tab.textContent} · Beautycalendar`;
  });
syncTabs();
// Telegram is an optional host integration; identity is never trusted without server validation.
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
}
import "./archive.js";
