import {
  dailyInspiration,
  validateInspirations,
  nextReadingDelay,
} from "./lib/inspiration.js?v=28";
import { localDate } from "./lib/domain.js";
const $ = (id) => document.getElementById(id);
let collection = null,
  current = null,
  midnightTimer;
function scheduleMidnight() {
  clearTimeout(midnightTimer);
  midnightTimer = setTimeout(() => {
    render();
    scheduleMidnight();
  }, nextReadingDelay());
}
function unavailable(message) {
  current = null;
  $("inspirationQuote").textContent = "";
  $("quoteAttribution").textContent = "";
  $("quoteCitation").textContent = "";
  $("inspirationStatus").textContent = message;
  $("copyInspiration").disabled = true;
}
function render() {
  try {
    current = dailyInspiration(collection, localDate());
    $("quoteIndex").textContent = "DAILY READING · " + localDate();
    if (!current) {
      unavailable(
        "No approved excerpts are available. No substitute quotations are shown.",
      );
      return;
    }
    $("inspirationQuote").textContent = current.text;
    $("quoteAttribution").textContent =
      `Attributed to ${current.attributedAuthor}`;
    $("quoteCitation").textContent =
      `Supplied PDF · page ${current.sourcePage} of ${collection.source.pageCount} · short excerpt`;
    $("inspirationStatus").textContent =
      `One reading for today · ${collection.quotes.length} source-checked excerpts in rotation.`;
    $("copyInspiration").disabled = false;
  } catch {
    unavailable(
      "The approved collection could not be verified. No substitute quotations are shown.",
    );
  }
}
fetch("./inspiration.json?v=28")
  .then((response) => {
    if (!response.ok) throw Error("Collection unavailable");
    return response.json();
  })
  .then((data) => {
    collection = validateInspirations(data);
    render();
    scheduleMidnight();
  })
  .catch(() =>
    unavailable(
      "The approved collection could not be loaded. Reopen online to cache it for offline reading; no substitute quotations are shown.",
    ),
  );
$("copyInspiration").onclick = async () => {
  if (!current) return;
  try {
    await navigator.clipboard.writeText(
      `${current.text} — attributed to ${current.attributedAuthor} (supplied PDF, p. ${current.sourcePage}; historical authorship not independently verified)`,
    );
  } catch {
    $("inspirationStatus").textContent =
      "Clipboard unavailable. Select the displayed excerpt to copy it.";
  }
};
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && collection) {
    render();
    scheduleMidnight();
  }
});
