import { activateSection } from "./app.js?v=29";
import "./archive.js";
const $ = (id) => document.getElementById(id);
const toggle = $("menuToggle"),
  dialog = $("navigationDialog"),
  main = $("main");
const tabs = [...dialog.querySelectorAll("[data-tab]")];
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let closing = false,
  closeTimer,
  savedScroll = 0;
function syncTabs() {
  const id = document.querySelector("#nav .tab.active")?.dataset.tab;
  for (const link of document.querySelectorAll("[data-route]")) {
    if (link.dataset.route === id) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  for (const tab of tabs) {
    const active = tab.classList.contains("active");
    tab.setAttribute("aria-pressed", String(active));
    if (active) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  }
}
function openMenu() {
  if (dialog.open || closing) return;
  savedScroll = scrollY;
  document.documentElement.style.setProperty(
    "--scrollbar-gap",
    `${innerWidth - document.documentElement.clientWidth}px`,
  );
  document.documentElement.style.setProperty(
    "--scroll-lock",
    `${-savedScroll}px`,
  );
  dialog.showModal();
  toggle.setAttribute("aria-expanded", "true");
  document.documentElement.classList.add("menu-open");
  // Two frames let the off-canvas starting position paint before the transition.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (dialog.open && !closing) dialog.classList.add("is-open");
    }),
  );
}
function closeMenu(sectionChanged = false) {
  if (!dialog.open || closing) return;
  closing = true;
  dialog.classList.remove("is-open");
  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(closeTimer);
    dialog.removeEventListener("transitionend", onEnd);
    dialog.close();
    toggle.setAttribute("aria-expanded", "false");
    document.documentElement.classList.remove("menu-open");
    window.scrollTo({
      top: sectionChanged ? 0 : savedScroll,
      behavior: "auto",
    });
    closing = false;
    if (sectionChanged) {
      main.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "auto" });
    } else toggle.focus({ preventScroll: true });
  }
  function onEnd(event) {
    if (event.target === dialog && event.propertyName === "transform") finish();
  }
  if (reduced.matches) {
    finish();
    return;
  }
  dialog.addEventListener("transitionend", onEnd);
  closeTimer = setTimeout(finish, 360);
}
toggle.addEventListener("click", openMenu);
$("menuClose").addEventListener("click", () => closeMenu());
dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeMenu();
});
dialog.addEventListener("click", (event) => {
  const box = dialog.getBoundingClientRect();
  if (
    event.clientX < box.left ||
    event.clientX > box.right ||
    event.clientY < box.top ||
    event.clientY > box.bottom
  )
    closeMenu();
});
// Keep keyboard traversal within the panel, including browsers that otherwise
// move from the first/last modal control into browser chrome.
dialog.addEventListener("keydown", (event) => {
  if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey)
    return;
  const first = $("menuClose"),
    last = tabs.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
for (const tab of tabs)
  tab.addEventListener("click", () => {
    const label = tab.querySelector("span:nth-child(2)").textContent;
    activateSection(tab.dataset.tab);
    syncTabs();
    document.title = `${label} · TheBeauty Journal`;
    main.setAttribute("aria-label", label);
    closeMenu(true);
  });
activateSection("home");
syncTabs();
document.title = "Home · TheBeauty Journal";
main.setAttribute("aria-label", "Home");
window.addEventListener("beauty:section-changed", (event) => {
  syncTabs();
  const tab = tabs.find((x) => x.dataset.tab === event.detail);
  const label =
    tab?.querySelector("span:nth-child(2)")?.textContent || event.detail;
  document.title = `${label} · TheBeauty Journal`;
  main.setAttribute("aria-label", label);
});
document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-route]");
  if (!link) return;
  event.preventDefault();
  activateSection(link.dataset.route);
  main.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "auto" });
});
$("mobileMore").addEventListener("click", openMenu);
document.addEventListener("click", (event) => {
  if (event.target.closest("[data-help]")) $("helpButton").click();
});
const theme = $("themeToggle"),
  systemTheme = matchMedia("(prefers-color-scheme: dark)");
function currentTheme() {
  const mode = document.documentElement.dataset.theme;
  return mode === "system" ? (systemTheme.matches ? "dark" : "light") : mode;
}
function syncTheme() {
  const dark = currentTheme() === "dark";
  theme.dataset.theme = dark ? "dark" : "light";
  theme.setAttribute(
    "aria-label",
    `Switch to ${dark ? "light" : "dark"} theme`,
  );
  theme.setAttribute("aria-pressed", String(dark));
  document.querySelector('meta[name="theme-color"]').content = dark
    ? "#232426"
    : "#f8f8f3";
}
theme.addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("beautycalendar-theme", next);
  } catch {
    $("appStatus").textContent =
      "Theme changed for this session; storage is unavailable.";
  }
  syncTheme();
});
systemTheme.addEventListener("change", syncTheme);
syncTheme();
requestAnimationFrame(() =>
  document.documentElement.classList.add("theme-ready"),
);
// Telegram is an optional host integration; identity still requires server validation.
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
}

function goHome(event) {
  event.preventDefault();
  if (dialog.open) closeMenu(true);
  for (const modal of document.querySelectorAll("dialog[open]"))
    if (modal !== dialog) modal.dispatchEvent(new Event("beauty:close-dialog"));
  activateSection("home");
  syncTabs();
  document.title = "Home · TheBeauty Journal";
  main.setAttribute("aria-label", "Home");
  setTimeout(() => {
    main.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  }, 0);
}
document.addEventListener("click", (event) => {
  if (event.target.closest("#homeLink,[data-home]")) goHome(event);
});
function visualHeight() {
  const viewport = window.visualViewport;
  document.documentElement.style.setProperty(
    "--visual-height",
    `${viewport?.height || innerHeight}px`,
  );
  document.documentElement.style.setProperty(
    "--visual-top",
    `${viewport?.offsetTop || 0}px`,
  );
}
visualHeight();
window.visualViewport?.addEventListener("resize", visualHeight);
window.visualViewport?.addEventListener("scroll", visualHeight);
