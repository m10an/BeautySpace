/** Accessible native tool modal, independent of the navigation drawer. */
export function toolModal(dialog, opener) {
  let scroll = 0;
  const close = () => {
    dialog.close();
    document.documentElement.classList.remove("tool-open");
    window.scrollTo({ top: scroll, behavior: "auto" });
    opener?.focus({ preventScroll: true });
  };
  const open = () => {
    if (dialog.open) return;
    scroll = scrollY;
    document.documentElement.style.setProperty("--tool-scroll", `${-scroll}px`);
    dialog.showModal();
    document.documentElement.classList.add("tool-open");
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
