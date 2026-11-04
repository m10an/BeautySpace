/** Accessible native tool modal, independent of the navigation drawer. */
export function toolModal(dialog, opener) {
  let scroll = 0,
    active = false;
  const restore = () => {
    if (!active) return;
    active = false;
    if (document.querySelector("dialog.tool-dialog[open]")) return;
    document.documentElement.classList.remove("tool-open");
    window.scrollTo({ top: scroll, behavior: "auto" });
    opener?.focus({ preventScroll: true });
  };
  const close = () => {
    dialog.close();
    restore();
  };
  dialog.addEventListener("close", restore);
  dialog.addEventListener("beauty:close-dialog", close);
  const open = () => {
    if (dialog.open) return;
    scroll = scrollY;
    document.documentElement.style.setProperty("--tool-scroll", `${-scroll}px`);
    active = true;
    document.documentElement.classList.add("tool-open");
    dialog.showModal();
    dialog.scrollTop = 0;
  };
  dialog.querySelector("[data-close]").addEventListener("click", close);
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    close();
  });
  dialog.addEventListener("click", (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      close();
  });
  dialog.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const controls = [
      ...dialog.querySelectorAll("button,input,select,textarea,a[href]"),
    ].filter((x) => !x.disabled && x.getClientRects().length);
    const first = controls[0],
      last = controls.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  return { open, close };
}
