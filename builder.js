import {
  readBuilderDraft,
  saveBuilderDraft,
  BUILDER_DRAFT_KEY,
} from "./lib/builder-draft.js";
import {
  buildRoutineItem,
  appendCalendarItems,
  scheduleText,
} from "./lib/routine-plan.js";
import { readCollection } from "./lib/storage.js";
import { localDate } from "./lib/domain.js";
import { toolModal } from "./lib/dialog.js";
const $ = (id) => document.getElementById(id),
  dialog = $("routineBuilder"),
  modal = toolModal(dialog, $("openBuilder"));
let step = 0,
  preview = null;
const fields = [...dialog.querySelectorAll("[data-step]")];
function days() {
  return [...dialog.querySelectorAll("#rbDays input:checked")].map((x) =>
    Number(x.value),
  );
}
function setDays(value) {
  dialog
    .querySelectorAll("#rbDays input")
    .forEach((el) => (el.checked = value.includes(Number(el.value))));
}
function draft() {
  return {
    product: $("rbProduct").value,
    step: $("rbStep").value,
    weekdays: days(),
    time: $("rbTime").value,
    from: $("rbFrom").value,
    until: $("rbUntil").value,
  };
}
function show() {
  fields.forEach((f, i) => (f.hidden = i !== step));
  $("rbProgress").textContent = `Step ${step + 1} of 5`;
  $("rbBack").hidden = step === 0;
  $("rbNext").hidden = step === 4;
  $("rbConfirm").hidden = step !== 4;
  const control = fields[step].querySelector("input,select,button");
  control?.focus();
}
function next() {
  try {
    if (step === 0 && !$("rbProduct").value.trim())
      throw Error("Enter a product name or choose from your collection.");
    if (step === 2 && !days().length)
      throw Error("Choose at least one weekday.");
    if (step === 3) {
      preview = buildRoutineItem(draft());
      $("rbPreviewName").textContent = preview.name;
      $("rbPreviewSchedule").textContent = scheduleText(preview);
    }
    $("rbStatus").textContent = "";
    step = Math.min(4, step + 1);
    show();
  } catch (e) {
    $("rbStatus").textContent = e.message;
    fields[step].querySelector("input,select")?.focus();
  }
}
let savedDraft = null;
function refreshDraft() {
  try {
    savedDraft = readBuilderDraft();
  } catch {
    savedDraft = null;
    $("rbStatus").textContent =
      "The saved draft could not be read. Its original record is retained; your calendar is unchanged.";
  }
  $("rbResumeDraft").hidden = !savedDraft;
  $("rbDiscardDraft").hidden = !savedDraft;
}
$("rbSaveDraft").onclick = () => {
  try {
    savedDraft = saveBuilderDraft({ version: 1, stage: step, fields: draft() });
    $("rbResumeDraft").hidden = false;
    $("rbDiscardDraft").hidden = false;
    $("rbStatus").textContent =
      "Draft saved on this device. Nothing was added to your calendar.";
  } catch (e) {
    $("rbStatus").textContent = "Draft not saved: " + e.message;
  }
};
$("rbResumeDraft").onclick = () => {
  if (!savedDraft) return;
  const f = savedDraft.fields;
  for (const [id, key] of [
    ["rbProduct", "product"],
    ["rbStep", "step"],
    ["rbTime", "time"],
    ["rbFrom", "from"],
    ["rbUntil", "until"],
  ])
    $(id).value = f[key];
  setDays(f.weekdays);
  step = savedDraft.stage;
  preview = null;
  if (step === 4) {
    try {
      preview = buildRoutineItem(draft());
      $("rbPreviewName").textContent = preview.name;
      $("rbPreviewSchedule").textContent = scheduleText(preview);
    } catch {
      step = 0;
    }
  }
  $("rbStatus").textContent =
    "Saved draft resumed. Review it before adding anything to your calendar.";
  show();
};
$("rbDiscardDraft").onclick = () => {
  if (
    !confirm(
      "Discard the saved builder draft? Current fields and all calendar records will stay in place.",
    )
  )
    return;
  try {
    localStorage.removeItem(BUILDER_DRAFT_KEY);
    savedDraft = null;
    refreshDraft();
    $("rbStatus").textContent =
      "Saved draft discarded. Calendar and current fields are unchanged.";
  } catch {
    $("rbStatus").textContent =
      "Could not discard the draft. The original record is retained.";
  }
};
$("openBuilder").onclick = async () => {
  step = 0;
  preview = null;
  $("rbProduct").value = "";
  $("rbStep").value = "hydrate";
  $("rbTime").value = "pm";
  $("rbFrom").value = $("dayPicker").value || localDate();
  $("rbUntil").value = "";
  setDays([0, 1, 2, 3, 4, 5, 6]);
  $("rbConfirm").disabled = false;
  $("rbStatus").textContent = "";
  refreshDraft();
  modal.open();
  show();
  try {
    const products = await readCollection();
    $("rbCollection").replaceChildren(
      new Option("Choose a saved product…", ""),
    );
    products.forEach((p) =>
      $("rbCollection").add(
        new Option(`${p.brand ? p.brand + " · " : ""}${p.name}`, p.name),
      ),
    );
  } catch {
    $("rbStatus").textContent =
      "Collection unavailable. You can still type a product name.";
  }
  try {
    const state = JSON.parse(localStorage.getItem("girly-skincare-v1") || "{}");
    $("rbCopy").replaceChildren(new Option("Copy a recurring schedule…", ""));
    (state.customItems || [])
      .filter((x) => x.mode !== "once")
      .forEach((x) => $("rbCopy").add(new Option(x.name, x.id)));
  } catch {}
};
$("rbCollection").onchange = (e) => {
  if (e.target.value) $("rbProduct").value = e.target.value;
};
$("rbCopy").onchange = (e) => {
  const state = JSON.parse(localStorage.getItem("girly-skincare-v1") || "{}"),
    item = state.customItems?.find((x) => x.id === e.target.value);
  if (!item) return;
  const labels = {
    Cleanse: "cleanse",
    Tone: "tone",
    Moisturize: "hydrate",
    Treatment: "treat",
    SPF: "protect",
    Care: "other",
  };
  const split = item.name.split(" · ");
  if (split.length > 1 && labels[split[0]]) {
    $("rbStep").value = labels[split.shift()];
    $("rbProduct").value = split.join(" · ");
  } else $("rbProduct").value = item.name;
  $("rbTime").value = item.time;
  setDays(item.mode === "daily" ? [0, 1, 2, 3, 4, 5, 6] : item.weekdays);
  $("rbStatus").textContent =
    "Schedule copied into this draft. The original is unchanged.";
};
for (const button of dialog.querySelectorAll("[data-preset]"))
  button.onclick = () => {
    const preset = {
      moisture: {
        product: "Moisturizer",
        step: "hydrate",
        time: "pm",
        days: [0, 1, 2, 3, 4, 5, 6],
      },
      spf: {
        product: "Sunscreen",
        step: "protect",
        time: "am",
        days: [0, 1, 2, 3, 4, 5, 6],
      },
      gentle: {
        product: "My treatment",
        step: "treat",
        time: "pm",
        days: [0, 3],
      },
    }[button.dataset.preset];
    $("rbProduct").value = preset.product;
    $("rbStep").value = preset.step;
    $("rbTime").value = preset.time;
    setDays(preset.days);
    $("rbStatus").textContent =
      "Preset applied to your draft. Review every step before saving.";
  };
$("rbNext").onclick = next;
$("rbBack").onclick = () => {
  step = Math.max(0, step - 1);
  $("rbStatus").textContent = "";
  show();
};
$("rbEdit").onclick = () => {
  step = 0;
  show();
};
$("rbConfirm").onclick = () => {
  if (!preview || $("rbConfirm").disabled) return;
  try {
    $("rbConfirm").disabled = true;
    appendCalendarItems([preview], { confirmed: true });
    window.dispatchEvent(new Event("beauty:routines-added"));
    $("appStatus").textContent =
      "Routine added. Existing care and checkmarks were retained.";
    modal.close();
  } catch (e) {
    $("rbConfirm").disabled = false;
    $("rbStatus").textContent = `Could not save: ${e.message}`;
  }
};
