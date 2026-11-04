import { localDate } from "./lib/domain.js";
import { fieldError } from "./lib/form-rules.js";
let sequence = 0;
const examples = {
  productName: "e.g. Daily moisturizer",
  productBrand: "e.g. The brand on your label",
  customName: "e.g. Hydrating mask",
  hairName: "e.g. Nourishing hair mask",
  rbProduct: "e.g. My daily moisturizer",
  aiCurrent: "e.g. Product name: Aqua, Glycerin, …",
  aiActives: "e.g. Retinol, glycolic acid; leave blank if unsure",
  aiMorning: "e.g. Cleanser, moisturizer, sunscreen",
  aiEvening: "e.g. Cleanser, moisturizer",
  aiPreferences: "e.g. Fragrance-free; keep the routine short",
  iplbrand: "e.g. Brand printed on your device",
  iplmodel: "e.g. Exact model code on the device label",
  iplinstructions: "e.g. Official manual URL and edition",
  iplsettings: "e.g. Setting recorded from your session; not advice",
  iplreaction: "e.g. What you noticed after the session",
  iplnotes: "e.g. Area details or a reason for postponing",
};
function setup(root = document) {
  for (const form of root.querySelectorAll("form")) form.noValidate = true;
  for (const el of root.querySelectorAll("input,textarea,select")) {
    if (!el.id) el.id = "field-" + ++sequence;
    if (examples[el.id] && !el.placeholder) el.placeholder = examples[el.id];
    if (["text", "textarea"].includes(el.type) && el.maxLength < 0)
      el.maxLength = el.tagName === "TEXTAREA" ? 2000 : 200;
    if (el.required) {
      const group = el.closest("form,fieldset,section");
      if (group && !group.querySelector(".required-note")) {
        const note = document.createElement("p");
        note.className = "required-note";
        note.textContent =
          "Fields marked * are required. Other fields are optional.";
        group.append(note);
      }
      const label = el.labels?.[0];
      if (label && !label.querySelector(".required-mark")) {
        const mark = document.createElement("span");
        mark.className = "required-mark";
        mark.textContent = " *";
        mark.setAttribute("aria-hidden", "true");
        const text = [...label.childNodes].find(
          (node) => node.nodeType === 3 && node.textContent.trim(),
        );
        if (text) {
          const caption = document.createElement("span");
          caption.className = "field-caption";
          label.insertBefore(caption, text);
          caption.append(text, mark);
        } else label.insertBefore(mark, el);
      }
      el.setAttribute("aria-required", "true");
    }
  }
}
export function showFieldError(el, message) {
  if (!el) return;
  let error = document.getElementById(el.id + "-error");
  if (!error) {
    error = document.createElement("span");
    error.id = el.id + "-error";
    error.className = "field-error";
    el.insertAdjacentElement("afterend", error);
    const desc = new Set(
      (el.getAttribute("aria-describedby") || "").split(" ").filter(Boolean),
    );
    desc.add(error.id);
    el.setAttribute("aria-describedby", [...desc].join(" "));
  }
  error.textContent = message;
  el.setAttribute("aria-invalid", message ? "true" : "false");
}
export function validateFields(root, controls) {
  const elements =
    controls ||
    [...root.querySelectorAll("input,textarea,select")].filter(
      (el) =>
        !el.disabled &&
        el.getClientRects().length &&
        !["checkbox", "radio", "file"].includes(el.type),
    );
  let first = null;
  for (const el of elements) {
    const message = fieldError({
      value: el.value,
      required: el.required,
      type: el.type,
      maxLength: el.maxLength ?? -1,
      min: el.min || "",
      max: el.max || "",
    });
    showFieldError(el, message);
    if (message && !first) first = el;
  }
  for (const [from, until] of [
    ["customFrom", "customUntil"],
    ["hairFrom", "hairUntil"],
    ["rbFrom", "rbUntil"],
  ]) {
    const a = document.getElementById(from),
      b = document.getElementById(until);
    if (elements.includes(b) && a?.value && b.value && b.value < a.value) {
      showFieldError(b, "The end date must be on or after the start date.");
      first ||= b;
    }
  }
  if (
    root.id === "iplForm" &&
    document.getElementById("iplstatus").value === "completed" &&
    document.getElementById("ipldate").value > localDate()
  ) {
    const date = document.getElementById("ipldate");
    showFieldError(date, "A future session cannot be marked completed.");
    first ||= date;
  }
  for (const card of root.querySelectorAll("[data-ai-row]")) {
    const a = card.querySelector('[data-field="from"]'),
      b = card.querySelector('[data-field="until"]');
    if (a?.value && b?.value && b.value < a.value) {
      showFieldError(b, "The end date must be on or after the start date.");
      first ||= b;
    }
  }
  if (first) {
    first.focus({ preventScroll: true });
    first.scrollIntoView({ block: "nearest", behavior: "auto" });
  }
  return !first;
}
setup();
window.addEventListener("beauty:form-refresh", () => setup());
document.addEventListener(
  "submit",
  (event) => {
    if (!validateFields(event.target)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },
  true,
);
const actions = {
  addCustom: ["customName", "customFrom", "customUntil"],
  hairAdd: ["hairName", "hairFrom", "hairUntil"],
  rbNext: null,
  aiSend: null,
  saveMood: [
    "moodDate",
    "moodNote",
    "inflamed",
    "comedones",
    "dryness",
    "irritation",
  ],
  saveSettings: ["startDate"],
  savePromptEntry: ["promptAnswer"],
};
document.addEventListener(
  "click",
  (event) => {
    const button = event.target.closest("button");
    if (!button || !Object.hasOwn(actions, button.id)) return;
    let root = button.closest("dialog") || document,
      controls;
    if (actions[button.id])
      controls = actions[button.id]
        .map((id) => document.getElementById(id))
        .filter(Boolean);
    if (button.id === "rbNext")
      controls = [
        ...root.querySelectorAll(
          "[data-step]:not([hidden]) input,[data-step]:not([hidden]) select",
        ),
      ].filter((el) => !["checkbox", "radio"].includes(el.type));
    if (button.id === "aiSend") root = document.getElementById("aiForm");
    if (!validateFields(root, controls)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },
  true,
);
document.addEventListener("focusout", (event) => {
  const el = event.target;
  if (
    el.matches?.("input,textarea,select") &&
    el.getAttribute("aria-invalid") === "true"
  )
    showFieldError(
      el,
      fieldError({
        value: el.value,
        required: el.required,
        type: el.type,
        maxLength: el.maxLength ?? -1,
      }),
    );
});

document.addEventListener(
  "change",
  (event) => {
    const el = event.target;
    if (el.matches?.('input[type="date"]')) {
      const message = fieldError({
        value: el.value,
        required: el.required,
        type: "date",
        min: el.min,
        max: el.max,
      });
      showFieldError(el, message);
      if (message) {
        event.stopImmediatePropagation();
        el.focus({ preventScroll: true });
      }
    }
  },
  true,
);
