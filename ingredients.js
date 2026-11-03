import {
  analyzeInci,
  searchIngredients,
  validateDatabase,
  escapeHtml as esc,
} from "./lib/domain.js";
const $ = (id) => document.getElementById(id);
export const referenceReady = fetch("./ingredients-db.json")
  .then((r) => {
    if (!r.ok) throw Error("Reference unavailable");
    return r.json();
  })
  .then(validateDatabase);
export function analysisHtml(result) {
  if (!result.total) return "<p>Paste an INCI list to begin.</p>";
  return `<h3>Ingredient overview</h3><p>${result.matched} of ${result.total} names matched the local reference.</p>
    <figure class="analysis-chart"><figcaption>Reference coverage — counts, not a risk score</figcaption><div class="coverage-track" role="img" aria-label="${result.matched} matched and ${result.unknown} unrecognized ingredients"><span style="width:${(100 * result.matched) / result.total}%"></span></div><dl class="analysis-counts"><div><dt>Matched</dt><dd>${result.matched}</dd></div><div><dt>Unrecognized</dt><dd>${result.unknown}</dd></div><div><dt>With verified numeric rating</dt><dd>0</dd></div></dl></figure>
    <p class="evidence-note"><strong>Comedogenicity: not established.</strong> This reference contains no attributable numeric ratings. Missing evidence does not mean zero risk. Ingredient lists cannot predict a finished product’s effect on your skin. Concentrations, formula, exposure and individual response matter. Fragrance sensitivity is a separate concern.</p>
    ${result.entries.map(({ name, ingredient: d }) => `<article class="inci-item"><div class="inci-item-head"><strong>${esc(name)}</strong><span>${esc(d?.category || "Unrecognized")}</span></div><p>${esc(d?.note || "Not in this limited reference. Unknown does not mean unsafe or safe.")}</p><p class="muted">Comedogenicity: no verified rating</p>${d?.cautions.map((text) => `<p class="caution">${esc(text)}</p>`).join("") || ""}</article>`).join("")}`;
}
const input = $("inciInput"),
  output = $("inciResults");
let db = [],
  loaded = false;
$("inciAnalyze").disabled = true;
referenceReady
  .then((data) => {
    db = data;
    loaded = true;
    $("inciAnalyze").disabled = false;
    $("ingredientStatus").textContent =
      `${db.length} entries available. Enter a name to search.`;
  })
  .catch(() => {
    $("ingredientStatus").textContent =
      "Ingredient reference unavailable. Reconnect and reload to try again.";
    output.classList.remove("hidden");
    output.textContent =
      "Analysis unavailable: the local reference could not be loaded.";
  });
$("inciAnalyze").addEventListener("click", () => {
  output.classList.remove("hidden");
  try {
    if (!loaded) throw Error("Wait for the ingredient reference.");
    output.innerHTML = analysisHtml(analyzeInci(input.value, db));
  } catch (e) {
    output.textContent = e.message;
  }
});
$("inciClear").addEventListener("click", () => {
  input.value = "";
  output.classList.add("hidden");
  input.focus();
});
$("ingredientSearch").addEventListener("input", (e) => {
  const results = searchIngredients(e.target.value, db);
  const root = $("ingredientMatches");
  root.replaceChildren();
  $("ingredientStatus").textContent = !loaded
    ? "Reference unavailable."
    : !e.target.value.trim()
      ? "Enter a name to search."
      : results.length
        ? `${results.length} matching ingredients`
        : "No ingredients found. Try an INCI name or synonym.";
  for (const d of results) {
    const article = document.createElement("article");
    article.className = "inci-item";
    const heading = document.createElement("h4");
    heading.textContent = d.name;
    const text = document.createElement("p");
    text.textContent = d.note;
    const rating = document.createElement("p");
    rating.className = "muted";
    rating.textContent = "Comedogenicity: no verified rating";
    article.append(heading, text, rating);
    root.append(article);
  }
});
