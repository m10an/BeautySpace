import { dailyInspiration, validateInspirations } from "./lib/inspiration.js";
import { localDate } from "./lib/domain.js";
const $ = (id) => document.getElementById(id);
let collection = null,
  current = null;
function render() {
  try {
    current = dailyInspiration(collection, localDate());
    $("inspirationQuote").textContent = current?.text || "";
    $("quoteAttribution").textContent = current
      ? `Attributed to ${current.attributedAuthor} · supplied PDF, page ${current.sourcePage}. Attribution reproduced from the page; not independently verified.`
      : "";
    $("inspirationStatus").textContent = current
      ? "Today’s approved short excerpt. The same reading stays throughout the day, including offline."
      : "No approved PDF excerpts available. Please supply the source PDF; no substitute quotations are shown.";
    $("copyInspiration").disabled = !current;
    $("quoteIndex").textContent = "DAILY READING · " + localDate();
  } catch {
    $("inspirationQuote").textContent = "";
    $("inspirationStatus").textContent =
      "Approved source unavailable. No substitute quotations are shown.";
    $("copyInspiration").disabled = true;
  }
}
fetch("./inspiration.json")
  .then((r) => {
    if (!r.ok) throw Error();
    return r.json();
  })
  .then((data) => {
    collection = validateInspirations(data);
    render();
  })
  .catch(() => {
    collection = {
      version: 1,
      source: { file: "Buddhism Quotes (2755 quotes).pdf" },
      quotes: [],
    };
    render();
  });
$("copyInspiration").onclick = async () => {
  if (current)
    try {
      await navigator.clipboard.writeText(
        current.text +
          " — attributed to " +
          current.attributedAuthor +
          " (supplied PDF, p. " +
          current.sourcePage +
          ")",
      );
    } catch {
      $("inspirationStatus").textContent =
        "Clipboard unavailable. Select the displayed excerpt to copy it.";
    }
};
setInterval(() => {
  if (collection) render();
}, 60000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && collection) render();
});
