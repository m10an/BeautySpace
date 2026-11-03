import {
  validateLegacyBackup,
  validateProduct,
  validDate,
} from "./lib/domain.js";
import { readCollection, writeCollection } from "./lib/storage.js";
const $ = (id) => document.getElementById(id);
const keys = [
  "girly-skincare-v1",
  "beautycalendar-hair-v1",
  "beautyjournal-private-prompts-v1",
];
function validateExtras(x) {
  if (x.products !== undefined) {
    if (!Array.isArray(x.products) || x.products.length > 1000)
      throw Error("Invalid collection");
    x.products.forEach((p) => {
      validateProduct(p);
      if (typeof p.id !== "string" || !/^[\w-]+$/.test(p.id))
        throw Error("Invalid product ID");
    });
    if (new Set(x.products.map((p) => p.id)).size !== x.products.length)
      throw Error("Duplicate product IDs");
  }
  if (x.hair !== undefined) {
    if (
      !x.hair ||
      !Array.isArray(x.hair.items) ||
      !x.hair.checks ||
      typeof x.hair.checks !== "object" ||
      Array.isArray(x.hair.checks)
    )
      throw Error("Invalid hair backup");
    for (const p of x.hair.items)
      if (
        typeof p.id !== "string" ||
        !/^[\w-]+$/.test(p.id) ||
        typeof p.name !== "string" ||
        p.name.length > 90 ||
        !validDate(p.date) ||
        !["am", "pm"].includes(p.time) ||
        !["daily", "weekly", "once"].includes(p.freq) ||
        !Array.isArray(p.days) ||
        p.days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)
      )
        throw Error("Invalid hair procedure");
  }
  if (
    x.prompts !== undefined &&
    (!Array.isArray(x.prompts) ||
      x.prompts.length > 200 ||
      x.prompts.some(
        (p) =>
          !p ||
          !["date", "prompt", "answer"].every(
            (k) => typeof p[k] === "string",
          ) ||
          p.answer.length > 10000,
      ))
  )
    throw Error("Invalid reflections");
  if (
    x.photos !== undefined &&
    (!Array.isArray(x.photos) ||
      x.photos.some(
        (p) =>
          !p ||
          typeof p.id !== "string" ||
          !validDate(p.date) ||
          typeof p.data !== "string" ||
          !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p.data),
      ))
  )
    throw Error("Invalid photos");
}
function openPhotos() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open("beautycalendar-private-photos", 1);
    r.onupgradeneeded = () =>
      r.result.createObjectStore("photos", { keyPath: "id" });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function mergePhotos(photos) {
  const db = await openPhotos();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readwrite");
    for (const p of photos) tx.objectStore("photos").put(p);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
$("importFile").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    if (file.size > 50 * 1024 * 1024)
      throw Error("Backup is larger than 50 MB.");
    const x = JSON.parse(await file.text());
    if (x.version !== undefined && ![3, 4].includes(x.version))
      throw Error("Unsupported backup version.");
    const state = validateLegacyBackup(x, {
      nia: true,
      bep: true,
      dailyAz: false,
    });
    validateExtras(x);
    if (
      !confirm(
        "Replace routine, collection and journal data present in this backup? Photos will be merged. Export a current backup first.",
      )
    )
      return;
    const old = keys.map((k) => localStorage.getItem(k)),
      oldProducts = await readCollection();
    try {
      if (x.products !== undefined) await writeCollection(x.products);
      localStorage.setItem(keys[0], JSON.stringify(state));
      if (x.hair !== undefined)
        localStorage.setItem(keys[1], JSON.stringify(x.hair));
      if (x.prompts !== undefined)
        localStorage.setItem(keys[2], JSON.stringify(x.prompts));
      await mergePhotos(x.photos || []);
    } catch (error) {
      try {
        for (let i = 0; i < keys.length; i++)
          old[i] === null
            ? localStorage.removeItem(keys[i])
            : localStorage.setItem(keys[i], old[i]);
        await writeCollection(oldProducts);
      } catch {
        throw Error(
          "Restore failed and rollback could not finish. Keep your exported backup.",
        );
      }
      throw error;
    }
    location.reload();
  } catch (error) {
    $("appStatus").textContent = `Backup not restored: ${error.message}`;
  } finally {
    e.target.value = "";
  }
};
