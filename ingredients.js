import {
  analyzeInci,
  searchIngredients,
  validateDatabase,
  escapeHtml as esc,
} from "./lib/domain.js";
const $ = (id) => document.getElementById(id);
import {
  combineReference,
  validateNames,
  validateEvidence,
} from "./lib/inci-reference.js";
async function json(path) {
  const r = await fetch(path);
  if (!r.ok) throw Error("Reference unavailable");
  return r.json();
}
let evidence = { version: 1, sources: {}, ratings: [] };
export const referenceReady = Promise.all([
  json("./ingredients-db.json"),
  json("./data/ingredient-names.json"),
  json("./data/comedogenicity.json"),
]).then(([legacy, names, ratings]) => {
  validateDatabase(legacy);
  validateNames(names);
  evidence = validateEvidence(ratings);
  return combineReference(names, legacy);
});
export function analyzeReference(input, db) {
  return analyzeInci(input, db, evidence);
}
export function analysisHtml(result) {
  if (!result.total) return "<p>Paste an INCI list to begin.</p>";
  return `<h3>Ingredient overview</h3><p>${result.matched} of ${result.total} names matched the local reference.</p>
    <figure class="analysis-chart"><figcaption>Reference coverage — counts, not a risk score</figcaption><div class="coverage-track" role="img" aria-label="${result.matched} matched and ${result.unknown} unrecognized ingredients"><span style="width:${(100 * result.matched) / result.total}%"></span></div><dl class="analysis-counts"><div><dt>Matched</dt><dd>${result.matched}</dd></div><div><dt>Unrecognized</dt><dd>${result.unknown}</dd></div><div><dt>With verified numeric rating</dt><dd>${result.rated}</dd></div></dl></figure>
    <p class="evidence-note"><strong>Comedogenicity: not established.</strong> Numeric values appear only with attributable evidence. Missing evidence does not mean zero risk. Ingredient lists cannot predict a finished product’s effect on your skin. Concentrations, formula, exposure and individual response matter. Fragrance sensitivity is a separate concern.</p>
    ${result.entries
      .map(
        ({ name, ingredient: d, rating }) =>
          `<article class="inci-item"><div class="inci-item-head"><strong>${esc(name)}</strong><span>${esc(d?.category || "Unrecognized")}</span></div><p>${esc(d?.note || "Not in this limited reference. Unknown does not mean unsafe or safe.")}</p><p class="muted">${
            rating
              ? `Comedogenicity: ${rating.score}/5 · evidence ${esc(rating.confidence)} · ${esc(rating.model)} study · ${esc(rating.concentration)} · ${esc(rating.method)}. ${rating.sourceIds
                  .map((id) => {
                    const source = evidence.sources[id];
                    return source
                      ? `<a href="${esc(source.url)}" rel="noopener noreferrer" target="_blank">${esc(source.title)}</a>`
                      : "";
                  })
                  .join(" · ")}`
              : `<span lang="ru">Недостаточно данных</span> · Insufficient evidence`
          }</p>${d?.cautions.map((text) => `<p class="caution">${esc(text)}</p>`).join("") || ""}</article>`,
      )
      .join("")}`;
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
      `${db.length.toLocaleString("en-US")} ingredient names available. Paste an INCI list or search a name.`;
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
    output.innerHTML = analysisHtml(analyzeReference(input.value, db));
  } catch (e) {
    output.textContent = e.message;
  }
});
$("inciClear").addEventListener("click", () => {
  input.value = "";
  $("ingredientMatches").replaceChildren();
  output.classList.add("hidden");
  input.focus();
});
input.addEventListener("input", (e) => {
  output.classList.add("hidden");
  const text = e.target.value;
  const results = /[,;\n]/.test(text) ? [] : searchIngredients(text, db);
  const root = $("ingredientMatches");
  root.replaceChildren();
  $("ingredientStatus").textContent = !loaded
    ? "Reference unavailable."
    : !e.target.value.trim()
      ? "Enter a name to search."
      : results.length
        ? `${results.length} matching ingredients`
        : "No ingredients found. Try an INCI name or synonym.";
  for (const d of results.slice(0, 8)) {
    const article = document.createElement("article");
    article.className = "inci-item";
    const heading = document.createElement("h4");
    heading.textContent = d.name;
    const text = document.createElement("p");
    text.textContent = d.note;
    const rating = document.createElement("p");
    rating.className = "muted";
    rating.textContent = "Недостаточно данных · Insufficient evidence";
    rating.lang = "ru";
    const pick = document.createElement("button");
    pick.className = "subtle";
    pick.type = "button";
    pick.textContent = "Use " + d.name;
    pick.onclick = () => {
      input.value = d.name;
      root.replaceChildren();
      $("inciAnalyze").click();
    };
    article.append(heading, text, rating, pick);
    root.append(article);
  }
});
