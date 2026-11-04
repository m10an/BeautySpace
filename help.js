import { toolModal } from "./lib/dialog.js";
const $ = (id) => document.getElementById(id),
  modal = toolModal($("helpDialog"), $("helpButton"));
const steps = [
  [
    "Home & calendar",
    "Open the brand/title or Menu → Calendar. Choose a date to review AM/PM care and IPL records; mark completed skincare steps. Saved records stay on this device.",
  ],
  [
    "Skincare & Hair",
    "Find Ritual and Hair in the menu. Use the existing editors for recurring or one-off care. Review dates and weekdays; edits preserve existing history.",
  ],
  [
    "Products & INCI",
    "Menu → My Products saves your own shelf, not a global catalog. Enter a name, optional label details and INCI, then Save. Open INCI & analysis or use Ingredient Check for the full list. Unknown evidence is not a safety score.",
  ],
  [
    "Routine builder",
    "Menu → Ritual → Build a routine. Choose a product, care step, weekdays and AM/PM. Presets and copied schedules are drafts. Only the final confirmation adds care; Close cancels.",
  ],
  [
    "Free consultant",
    "Use the sparkle Beauty AI button. The free local guide uses explicit rules, not generative AI, and sends nothing. Enter optional products and habits, create a preview, edit or reject it, then explicitly confirm calendar additions. Hosted AI stays disabled unless separately configured and consented to; it may have costs.",
  ],
  [
    "IPL tracker",
    "Menu → IPL Tracker. Register your exact device, record an area/date and settings used, then Preview → Confirm & Add to Calendar. Edit to postpone or cancel. Device-specific automated treatment planning is unavailable without reviewed instructions; no universal intervals are suggested.",
  ],
  [
    "Data, privacy & recovery",
    "Menu → More → Backup & restore exports the journal; IPL has a separate archive in its section. Export both before changing browsers. Offline manual tools keep working after caching. Errors retain entered values; check marked fields and retry. Severe symptoms need medical care, not an app plan.",
  ],
];
let index = 0;
function show() {
  const [title, text] = steps[index];
  $("helpTitle").textContent = title;
  $("helpContent").textContent = text;
  $("helpProgress").textContent = `Step ${index + 1} of ${steps.length}`;
  $("helpPrevious").disabled = index === 0;
  $("helpNext").textContent = index === steps.length - 1 ? "Done" : "→";
  $("helpNext").setAttribute(
    "aria-label",
    index === steps.length - 1 ? "Finish tutorial" : "Next tutorial step",
  );
}
$("helpButton").onclick = () => {
  index = 0;
  show();
  modal.open();
};
$("helpNext").onclick = () => {
  if (index === steps.length - 1) modal.close();
  else {
    index++;
    show();
  }
};
$("helpPrevious").onclick = () => {
  index = Math.max(0, index - 1);
  show();
};
$("helpSkip").onclick = modal.close;
