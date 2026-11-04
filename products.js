import { normalize, validateProduct, analyzeInci } from "./lib/domain.js";
import { readCollection, writeCollection } from "./lib/storage.js";
import { referenceReady, analysisHtml } from "./ingredients.js?v=22";
const $ = (id) => document.getElementById(id);
let products = [],
  editing = null,
  busy = false,
  available = false;
function message(text) {
  $("productFormStatus").textContent = text;
}
function reset() {
  editing = null;
  $("productForm").reset();
  $("productFormTitle").textContent = "Add a product";
  $("productSave").textContent = "Save product";
  $("productCancel").classList.add("hidden");
}
function button(text, action) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "subtle";
  b.textContent = text;
  b.onclick = action;
  return b;
}
async function render() {
  const term = normalize($("productSearch").value);
  const visible = products.filter((p) =>
    normalize([p.name, p.brand, p.category, p.inci].join(" ")).includes(term),
  );
  $("productCount").textContent = available
    ? `${visible.length} of ${products.length} saved products`
    : "Collection unavailable.";
  const list = $("productList");
  list.replaceChildren();
  if (!visible.length) {
    list.textContent = available
      ? term
        ? "No saved products match your search."
        : "Your shelf is empty. Add your first product above."
      : "Could not open local storage. No data has been removed.";
    return;
  }
  for (const product of visible) {
    const card = document.createElement("article");
    card.className = "panel product-card";
    const title = document.createElement("h3");
    title.textContent = product.name;
    const brand = document.createElement("p");
    brand.className = "muted";
    brand.textContent = `${product.brand || "No brand"} · ${product.category}`;
    card.append(title, brand);
    if (product.photo) {
      const img = document.createElement("img");
      img.src = product.photo;
      img.alt = `${product.name} product photo`;
      img.className = "product-photo";
      img.loading = "lazy";
      card.append(img);
    }
    const actions = document.createElement("div");
    actions.className = "product-actions";
    actions.append(
      button("Edit", () => {
        editing = product.id;
        $("productName").value = product.name;
        $("productBrand").value = product.brand;
        $("productCategory").value = product.category;
        $("productInci").value = product.inci;
        $("productPhoto").value = "";
        $("productRemovePhoto").checked = false;
        $("productFormTitle").textContent = "Edit product";
        $("productSave").textContent = "Save changes";
        $("productCancel").classList.remove("hidden");
        message("Editing " + product.name);
        $("productName").focus();
      }),
      button("Delete", async () => {
        if (busy || !confirm(`Delete “${product.name}” from your collection?`))
          return;
        busy = true;
        try {
          const next = products.filter((p) => p.id !== product.id);
          await writeCollection(next);
          products = next;
          if (editing === product.id) reset();
          render();
          message("Product deleted.");
          $("productSearch").focus();
        } catch {
          message("Could not delete: local storage is unavailable.");
        } finally {
          busy = false;
        }
      }),
    );
    card.append(actions);
    const details = document.createElement("details"),
      summary = document.createElement("summary");
    summary.textContent = "INCI & analysis";
    details.append(summary);
    const analysis = document.createElement("div");
    analysis.className = "product-analysis";
    details.append(analysis);
    details.addEventListener("toggle", async () => {
      if (!details.open || analysis.childNodes.length) return;
      try {
        const db = await referenceReady;
        analysis.innerHTML = analysisHtml(analyzeInci(product.inci, db));
      } catch {
        analysis.textContent =
          "Ingredient reference unavailable. Your saved product is retained.";
      }
    });
    card.append(details);
    list.append(card);
  }
}
async function preparePhoto(file) {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 10 * 1024 * 1024
  )
    throw Error("Use a JPEG, PNG or WebP photo up to 10 MB.");
  const image = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1000 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally {
    image.close();
  }
}
$("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (busy || !available) return;
  busy = true;
  $("productSave").disabled = true;
  try {
    const previous = products.find((p) => p.id === editing);
    let photo = $("productRemovePhoto").checked
      ? null
      : previous?.photo || null;
    if ($("productPhoto").files[0])
      photo = await preparePhoto($("productPhoto").files[0]);
    const item = validateProduct({
      id: editing || crypto.randomUUID(),
      name: $("productName").value.trim(),
      brand: $("productBrand").value.trim(),
      category: $("productCategory").value,
      inci: $("productInci").value.trim(),
      photo,
    });
    const next = editing
      ? products.map((p) => (p.id === editing ? item : p))
      : [...products, item];
    await writeCollection(next);
    products = next;
    reset();
    render();
    message("Product saved on this device.");
  } catch (e) {
    message(`Could not save. ${e.message}`);
  } finally {
    busy = false;
    $("productSave").disabled = false;
  }
});
$("productCancel").onclick = () => {
  reset();
  message("Edit cancelled.");
};
$("productSearch").addEventListener("input", render);
readCollection()
  .then((items) => {
    if (!Array.isArray(items)) throw Error("Invalid collection");
    items.forEach(validateProduct);
    products = items;
    available = true;
    render();
  })
  .catch(() => {
    message("Could not read your collection. Existing data was retained.");
    $("productSave").disabled = true;
    render();
  });
