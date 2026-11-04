import {
  escapeHtml as safeHtml,
  validateLegacyBackup,
  validDate,
  validateProcedure,
  procedureApplies,
  localDate,
} from "./lib/domain.js";
import { readCollection } from "./lib/storage.js";
// Preserve v1 localStorage key and task IDs to migrate existing checkmarks without clearing them.
const KEY = "girly-skincare-v1",
  defaults = {
    start: localDate(),
    nia: true,
    bep: true,
    dailyAz: false,
    checks: {},
    overrides: {},
    moods: {},
    customItems: [],
    customOverrides: {},
  };
let state;
let routineWritable = true;
try {
  state = localStorage.getItem(KEY)
    ? validateLegacyBackup(JSON.parse(localStorage.getItem(KEY)), defaults)
    : structuredClone(defaults);
} catch {
  routineWritable = false;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) localStorage.setItem(KEY + "-recovery-" + Date.now(), raw);
  } catch {}
  state = structuredClone(defaults);
  document.getElementById("appStatus").textContent =
    "Saved routine data could not be read. The original data is retained; export it before making changes.";
}
state.checks = state.checks || {};
state.overrides = state.overrides || {};
state.moods = state.moods || {};
state.customItems = Array.isArray(state.customItems) ? state.customItems : [];
state.customOverrides = state.customOverrides || {};
let persistedState = structuredClone(state);
const $ = (id) => document.getElementById(id),
  save = () => {
    if (!routineWritable) {
      alert(
        "Saved data could not be read. Restore a valid backup before saving changes.",
      );
      return false;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      persistedState = structuredClone(state);
      return true;
    } catch {
      state = structuredClone(persistedState);
      alert(
        "Could not save. Local storage is unavailable or full. Export a backup.",
      );
      return false;
    }
  };
const iso = localDate,
  parse = (s) => new Date(`${s}T12:00:00`),
  add = (s, n) => {
    let d = parse(s);
    d.setDate(d.getDate() + n);
    return iso(d);
  },
  daysBetween = (a, b) =>
    Math.round(
      (Date.UTC(
        ...a.split("-").map((v, i) => (i === 1 ? Number(v) - 1 : Number(v))),
      ) -
        Date.UTC(
          ...b.split("-").map((v, i) => (i === 1 ? Number(v) - 1 : Number(v))),
        )) /
        86400000,
    ),
  dow = (s) => (parse(s).getDay() + 6) % 7,
  dateFmt = (s) =>
    parse(s).toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
function planned(date) {
  let elapsed = daysBetween(date, state.start),
    week = Math.floor(elapsed / 7),
    a = [];
  if (elapsed < 0) return a;
  const wd = dow(date);
  let adap =
    week < 2
      ? wd === 5
      : week < 4
        ? [2, 5].includes(wd)
        : week < 6
          ? [0, 2, 5].includes(wd)
          : (elapsed - 42) % 2 === 0;
  if (adap) a.push("adap");
  let az =
    week < 2
      ? [1, 3].includes(wd)
      : week < 4
        ? [1, 4].includes(wd)
        : week < 6
          ? [1, 4, 6].includes(wd)
          : [1, 3, 6].includes(wd);
  if (state.dailyAz && week >= 8) az = !adap;
  if (az && !adap) a.push("azel");
  if (state.nia && wd === 4 && !adap && !az) a.push("nia");
  if (state.bep && wd === 6 && !adap && !az) a.push("bep");
  return a;
}
function actives(date) {
  return Object.prototype.hasOwnProperty.call(state.overrides, date)
    ? state.overrides[date]
    : planned(date);
}
const morning = [
  ["clean-am", "Gentle cleansing (as needed)"],
  ["toner-am", "Manyo Bifida toner"],
  ["purito-am", "Purito moisturizer"],
  ["spf", "SPF 50"],
];
function customPlanned(date) {
  return state.customItems
    .filter((x) => procedureApplies(x, date))
    .map((x) => x.id);
}
function customFor(date) {
  return Object.prototype.hasOwnProperty.call(state.customOverrides, date)
    ? state.customOverrides[date]
    : customPlanned(date);
}
function tasks(date) {
  let a = actives(date),
    am = [...morning],
    pm = [
      ["clean-pm", "Gentle cleansing"],
      ["toner-pm", "Manyo Bifida toner (if comfortable)"],
    ];
  if (a.includes("azel")) pm.push(["azel", "Azelaic acid 15%"]);
  if (a.includes("nia")) pm.push(["nia", "Niacinamide (optional)"]);
  if (a.includes("adap"))
    pm.push(["adap", "Adapalene (follow your clinician’s directions)"]);
  pm.push(["purito-pm", "Purito moisturizer"]);
  if (a.includes("bep"))
    pm.push(["bep", "Bepanthen Baby (optional, for dry areas)"]);
  for (const id of customFor(date)) {
    let item = state.customItems.find((x) => x.id === id);
    if (item) (item.time === "am" ? am : pm).push(["custom-" + id, item.name]);
  }
  return { am, pm };
}
let selected = iso(new Date()),
  month = new Date(
    parse(selected).getFullYear(),
    parse(selected).getMonth(),
    1,
  );
function routineHtml(date) {
  let html = "";
  const t = tasks(date);
  for (const [title, items] of [
    ["MORNING", t.am],
    ["EVENING", t.pm],
  ]) {
    html += `<div class="routine-title">${title}</div>`;
    for (const [id, label] of items) {
      const key = `${date}|${id}`,
        checked = !!state.checks[key];
      html += `<label class="task ${checked ? "checked" : ""}"><input type="checkbox" data-key="${safeHtml(key)}" ${checked ? "checked" : ""}><span>${safeHtml(label)}</span></label>`;
    }
  }
  return (
    html +
    '<p class="note">If your skin is irritated, pause actives. This sample plan does not replace advice from a dermatologist.</p>'
  );
}
function bindChecks(root) {
  root.querySelectorAll("input[data-key]").forEach(
    (el) =>
      (el.onchange = () => {
        state.checks[el.dataset.key] = el.checked;
        if (!save()) {
          el.checked = !el.checked;
          return;
        }
        render();
        const key = CSS.escape(el.dataset.key);
        root.querySelector(`input[data-key="${key}"]`)?.focus();
      }),
  );
}
function render() {
  let title = month.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  $("monthLabel").textContent = title.charAt(0).toUpperCase() + title.slice(1);
  let year = month.getFullYear(),
    mo = month.getMonth(),
    first = (new Date(year, mo, 1).getDay() + 6) % 7,
    count = new Date(year, mo + 1, 0).getDate(),
    html = "";
  for (let i = 0; i < first; i++) html += '<div class="cell blank"></div>';
  for (let day = 1; day <= count; day++) {
    const date = iso(new Date(year, mo, day)),
      a = actives(date),
      done = Object.entries(state.checks).filter(
        ([k, v]) => k.startsWith(date + "|") && v,
      ).length;
    html += `<button aria-label="${dateFmt(date)}${done ? `, ${done} completed` : ""}" aria-pressed="${date === selected}" class="cell ${date === selected ? "selected" : ""}" data-date="${date}"><span class="num">${day}</span><span class="marks">${a.map((x) => `<i class="dot ${x}"></i>`).join("")}</span>${done ? `<span class="done">✓ ${done}</span>` : ""}</button>`;
  }
  $("monthGrid").innerHTML = html;
  $("monthGrid")
    .querySelectorAll("[data-date]")
    .forEach(
      (el) =>
        (el.onclick = () => {
          selected = el.dataset.date;
          syncDate();
          render();
        }),
    );
  $("selectedLabel").textContent = dateFmt(selected);
  $("selectedRoutine").innerHTML = routineHtml(selected);
  $("todayRoutine").innerHTML = routineHtml(selected);
  bindChecks($("selectedRoutine"));
  bindChecks($("todayRoutine"));
  syncDate();
  renderEditor();
  renderCustom();
  window.dispatchEvent(new Event("beauty:date-selected"));
}
function syncDate() {
  $("dayPicker").value = selected;
}
function renderEditor() {
  let a = actives(selected);
  $("activeEditor").innerHTML = [
    ["adap", "Adapalene"],
    ["azel", "Azelaic acid 15%"],
    ["nia", "Niacinamide"],
    ["bep", "Bepanthen Baby"],
  ]
    .map(
      ([id, n]) =>
        `<label class="active-choice"><input type="checkbox" value="${id}" ${a.includes(id) ? "checked" : ""}> ${n}</label>`,
    )
    .join("");
}
$("prev").onclick = () => {
  month.setMonth(month.getMonth() - 1);
  render();
};
$("next").onclick = () => {
  month.setMonth(month.getMonth() + 1);
  render();
};
$("jumpToday").onclick = () => {
  selected = iso(new Date());
  month = new Date(
    parse(selected).getFullYear(),
    parse(selected).getMonth(),
    1,
  );
  render();
};
$("dayPicker").onchange = (e) => {
  if (!validDate(e.target.value)) return;
  selected = e.target.value;
  month = new Date(
    parse(selected).getFullYear(),
    parse(selected).getMonth(),
    1,
  );
  render();
};
// Section identities and legacy data are unchanged; the shell owns navigation UI.
export function activateSection(id) {
  const button = [...document.querySelectorAll(".tab")].find(
    (btn) => btn.dataset.tab === id,
  );
  if (!button) return;
  document
    .querySelectorAll(".tab")
    .forEach((btn) => btn.classList.toggle("active", btn === button));
  document
    .querySelectorAll(".screen")
    .forEach((screen) => screen.classList.toggle("hidden", screen.id !== id));
  if (id === "journal") {
    loadMood();
    renderPhotos();
  }
  if (id === "insights") renderStats();
  render();
}
$("saveDay").onclick = () => {
  const a = [...$("activeEditor").querySelectorAll("input:checked")].map(
    (x) => x.value,
  );
  if (
    a.includes("adap") &&
    a.includes("azel") &&
    !confirm(
      "Combining adapalene and azelaic acid may increase irritation. Save?",
    )
  )
    return;
  state.overrides[selected] = a;
  if (!save()) return;
  render();
};
$("clearDay").onclick = () => {
  delete state.overrides[selected];
  if (!save()) return;
  render();
};
function esc(x) {
  return String(x).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
let editingCustom = null;
function renderCustom() {
  $("customDateLabel").textContent = dateFmt(selected);
  $("customList").innerHTML = state.customItems.length
    ? state.customItems
        .map(
          (x) =>
            `<div class="custom-row"><div><strong>${esc(x.name)}</strong><small>${x.time === "am" ? "Morning" : "Evening"} · ${x.mode === "daily" ? "Daily" : x.mode === "once" ? dateFmt(x.once) : x.weekdays.map((i) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]).join(", ")}</small></div><button class="small" data-edit="${esc(x.id)}">Edit</button><button class="small" data-remove="${esc(x.id)}">Delete</button></div>`,
        )
        .join("")
    : '<p class="muted">No procedures added yet.</p>';
  $("customList")
    .querySelectorAll("[data-edit]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          const x = state.customItems.find((x) => x.id === b.dataset.edit);
          editingCustom = x.id;
          for (const [id, k] of [
            ["customName", "name"],
            ["customTime", "time"],
            ["customMode", "mode"],
            ["customOnce", "once"],
            ["customFrom", "from"],
            ["customUntil", "until"],
          ])
            $(id).value = x[k] || "";
          $("customWeekdays")
            .querySelectorAll("input")
            .forEach(
              (el) => (el.checked = x.weekdays.includes(Number(el.value))),
            );
          updateCustomMode();
          $("addCustom").textContent = "Save changes";
          $("cancelCustomEdit").classList.remove("hidden");
          if ($("advancedCare")) $("advancedCare").open = true;
          $("customName").focus();
        }),
    );
  $("customList")
    .querySelectorAll("[data-remove]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          if (
            !confirm(
              "Delete this procedure? Historical checkmarks will be retained in backups.",
            )
          )
            return;
          state.customItems = state.customItems.filter(
            (x) => x.id !== b.dataset.remove,
          );
          if (editingCustom === b.dataset.remove) cancelCustomEdit();
          for (const date in state.customOverrides)
            state.customOverrides[date] = state.customOverrides[date].filter(
              (id) => id !== b.dataset.remove,
            );
          if (!save()) return;
          render();
          $("customName").focus();
        }),
    );
  const active = customFor(selected);
  $("customDayEditor").innerHTML = state.customItems.length
    ? state.customItems
        .map(
          (x) =>
            `<label class="active-choice"><input type="checkbox" value="${esc(x.id)}" ${active.includes(x.id) ? "checked" : ""}> ${esc(x.name)}</label>`,
        )
        .join("")
    : '<p class="muted">Add a procedure above to customize this day.</p>';
}
function updateCustomMode() {
  let mode = $("customMode").value;
  $("customWeekdays").classList.toggle("hidden", mode !== "weekdays");
  $("customOnceWrap").classList.toggle("hidden", mode !== "once");
}
$("customMode").onchange = updateCustomMode;
updateCustomMode();
$("customFrom").value = selected;
$("customOnce").value = selected;
$("addCustom").onclick = () => {
  const name = $("customName").value.trim(),
    mode = $("customMode").value,
    weekdays = [...$("customWeekdays").querySelectorAll("input:checked")].map(
      (x) => Number(x.value),
    ),
    once = $("customOnce").value,
    from = $("customFrom").value || selected,
    until = $("customUntil").value;
  if (!name) return alert("Enter a product or procedure name.");
  if (mode === "weekdays" && !weekdays.length)
    return alert("Choose at least one weekday.");
  if (mode === "once" && !once) return alert("Choose a date.");
  if (mode !== "once" && until && until < from)
    return alert("The end date is before the start date.");
  const item = {
    id: editingCustom || crypto.randomUUID(),
    name: name.slice(0, 90),
    time: $("customTime").value,
    mode,
    weekdays,
    once,
    from,
    until,
  };
  try {
    validateProcedure(item);
  } catch (e) {
    return alert(e.message);
  }
  if (editingCustom)
    state.customItems = state.customItems.map((x) =>
      x.id === editingCustom ? item : x,
    );
  else state.customItems.push(item);
  if (!save()) return;
  cancelCustomEdit();
  render();
  $("appStatus").textContent = "Procedure saved";
};
function cancelCustomEdit() {
  editingCustom = null;
  $("customName").value = "";
  $("addCustom").textContent = "Add to calendar";
  $("cancelCustomEdit").classList.add("hidden");
}
$("cancelCustomEdit").onclick = cancelCustomEdit;
$("saveCustomDay").onclick = () => {
  state.customOverrides[selected] = [
    ...$("customDayEditor").querySelectorAll("input:checked"),
  ].map((x) => x.value);
  if (!save()) return;
  render();
};
$("resetCustomDay").onclick = () => {
  delete state.customOverrides[selected];
  if (!save()) return;
  render();
};
function showSettings() {
  $("startDate").value = state.start;
  $("useNia").checked = state.nia;
  $("useBep").checked = state.bep;
  $("dailyAz").checked = state.dailyAz;
}
showSettings();
$("saveSettings").onclick = () => {
  if (!validDate($("startDate").value)) return;
  state.start = $("startDate").value;
  state.nia = $("useNia").checked;
  state.bep = $("useBep").checked;
  state.dailyAz = $("dailyAz").checked;
  if (!save()) return;
  render();
  alert("Saved");
};
$("moodDate").value = selected;
$("moodDate").onchange = loadMood;
function loadMood() {
  let d = $("moodDate").value || selected,
    m = state.moods[d] || {};
  for (let k of ["inflamed", "comedones", "dryness", "irritation"])
    $(k).value = m[k] ?? "0";
  $("moodNote").value = m.note || "";
}
$("saveMood").onclick = () => {
  let d = $("moodDate").value;
  if (!validDate(d)) return;
  state.moods[d] = {
    inflamed: +$("inflamed").value,
    comedones: +$("comedones").value,
    dryness: +$("dryness").value,
    irritation: +$("irritation").value,
    note: $("moodNote").value.slice(0, 2000),
  };
  if (!save()) return;
  alert("Observation saved.");
};
// IndexedDB is used for photos to avoid localStorage size limits.
const DB = "beautycalendar-private-photos",
  STORE = "photos";
function dbOpen() {
  return new Promise((res, rej) => {
    if (!("indexedDB" in window)) return rej(Error("IndexedDB unavailable"));
    let r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () =>
      r.result.createObjectStore(STORE, { keyPath: "id" });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function photoAll() {
  let db = await dbOpen();
  return new Promise((res, rej) => {
    let tx = db.transaction(STORE, "readonly"),
      r = tx.objectStore(STORE).getAll();
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
    tx.oncomplete = () => db.close();
  });
}
async function photoPut(item) {
  let db = await dbOpen();
  return new Promise((res, rej) => {
    let tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(item);
    tx.oncomplete = () => {
      db.close();
      res();
    };
    tx.onerror = () => rej(tx.error);
  });
}
async function photoDelete(id) {
  let db = await dbOpen();
  return new Promise((res, rej) => {
    let tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => {
      db.close();
      res();
    };
    tx.onerror = () => rej(tx.error);
  });
}
async function renderPhotos() {
  const box = $("photoGallery");
  try {
    let photos = (await photoAll()).sort((a, b) => b.id.localeCompare(a.id));
    box.replaceChildren();
    if (!photos.length) {
      box.textContent = "No photos yet.";
      return;
    }
    for (const p of photos) {
      let card = document.createElement("div");
      card.className = "photo";
      let img = document.createElement("img");
      img.src = p.data;
      img.alt = "Skin progress photo";
      let meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = p.date;
      let btn = document.createElement("button");
      btn.textContent = "Delete photo";
      btn.onclick = async () => {
        if (confirm("Delete this photo?")) {
          await photoDelete(p.id);
          renderPhotos();
        }
      };
      meta.append(document.createElement("br"), btn);
      card.append(img, meta);
      box.append(card);
    }
  } catch {
    box.textContent = "Could not open local photo storage.";
  }
}
function compress(file) {
  return new Promise((res, rej) => {
    const image = new Image(),
      url = URL.createObjectURL(file);
    image.onload = () => {
      const scale = Math.min(1, 1400 / Math.max(image.width, image.height)),
        c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(image.width * scale));
      c.height = Math.max(1, Math.round(image.height * scale));
      c.getContext("2d").drawImage(image, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL("image/jpeg", 0.78));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      rej(Error("Could not open photo."));
    };
    image.src = url;
  });
}
$("photoInput").onchange = async (e) => {
  let file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) return alert("Choose an image.");
  try {
    let data = await compress(file);
    await photoPut({
      id: new Date().toISOString() + "-" + Math.random().toString(36).slice(2),
      date: $("moodDate").value || selected,
      data,
    });
    await renderPhotos();
    e.target.value = "";
  } catch {
    alert("Could not save the photo. Check available storage.");
  }
};
function renderStats() {
  let p = $("insightPeriod").value,
    now = iso(new Date()),
    start = p === "all" ? state.start : add(now, -Number(p) + 1),
    dates = [];
  for (let d = start; d <= now; d = add(d, 1)) {
    dates.push(d);
    if (dates.length > 3660) break;
  }
  let stats = { adap: 0, azel: 0, nia: 0, bep: 0 },
    done = 0,
    total = 0;
  for (let d of dates) {
    let t = tasks(d);
    for (let [k] of [...t.am, ...t.pm]) {
      total++;
      if (state.checks[d + "|" + k]) {
        done++;
        if (k in stats) stats[k]++;
      }
    }
  }
  let moodDates = Object.keys(state.moods).filter(
      (d) => d >= start && d <= now,
    ),
    average = (k) =>
      moodDates.length
        ? (
            moodDates.reduce((s, d) => s + Number(state.moods[d][k] || 0), 0) /
            moodDates.length
          ).toFixed(1)
        : "—";
  $("stats").innerHTML =
    `<div class="statsgrid"><div class="stat"><strong>${stats.adap}</strong><span>Adapalene · completed</span></div><div class="stat"><strong>${stats.azel}</strong><span>Азелаиновая · completed</span></div><div class="stat"><strong>${stats.nia}</strong><span>Niacinamide · completed</span></div><div class="stat"><strong>${Math.round((100 * done) / (total || 1))}%</strong><span>Routine completion</span></div></div><h3>Skin Mood</h3><p class="muted">Entries: ${moodDates.length}. Average dryness: ${average("dryness")}/3. Average irritation: ${average("irritation")}/3.</p><div class="bar"><span style="width:${Math.round((100 * done) / (total || 1))}%"></span></div>`;
}
$("insightPeriod").onchange = renderStats;
function downloadJson(obj) {
  let blob = new Blob([JSON.stringify(obj)], { type: "application/json" }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = "beautycalendar-private-backup-" + iso(new Date()) + ".json";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
$("exportBtn").onclick = async () => {
  try {
    let photos = await photoAll();
    downloadJson({
      version: 4,
      exportedAt: new Date().toISOString(),
      ...state,
      photos,
      products: await readCollection(),
      hair: hairState,
      prompts: JSON.parse(
        localStorage.getItem("beautyjournal-private-prompts-v1") || "[]",
      ),
    });
    alert("Backup prepared. Save the file in a safe place.");
  } catch {
    if (
      confirm(
        "Full backup unavailable. Export only the skincare routine without photos, products, hair or reflections? The full backup could not be created.",
      )
    )
      downloadJson({ version: 3, ...state, photos: [] });
  }
};
// Versioned backup import is registered in archive.js.
$("resetBtn").onclick = () => {
  if (
    confirm(
      "Clear all routine checkmarks? Photos and journal entries will remain.",
    )
  ) {
    state.checks = {};
    if (!save()) return;
    render();
  }
};
render();
loadMood();
if ("serviceWorker" in navigator && location.protocol.startsWith("http"))
  navigator.serviceWorker.register("./sw.js").catch(() => {});

// Independent hair journal. Does not alter legacy skincare data.
const HAIR_KEY = "beautycalendar-hair-v1";
let hairState,
  hairWritable = true;
try {
  const raw = localStorage.getItem(HAIR_KEY);
  hairState = raw ? JSON.parse(raw) : { items: [], checks: {} };
  if (
    !hairState ||
    !Array.isArray(hairState.items) ||
    !hairState.checks ||
    typeof hairState.checks !== "object" ||
    Array.isArray(hairState.checks)
  )
    throw Error("Invalid hair state");
  for (const x of hairState.items) {
    if (
      !x ||
      typeof x.id !== "string" ||
      !/^[\w-]+$/.test(x.id) ||
      typeof x.name !== "string" ||
      !Array.isArray(x.days) ||
      !["am", "pm"].includes(x.time) ||
      !["daily", "once", "weekly"].includes(x.freq) ||
      !validDate(x.date)
    )
      throw Error("Invalid hair procedure");
  }
} catch {
  hairState = { items: [], checks: {} };
  hairWritable = false;
  $("appStatus").textContent =
    "Saved hair data could not be read and has been retained. Restore a valid backup before editing hair care.";
}
let persistedHair = structuredClone(hairState);
const hairSave = () => {
  if (!hairWritable) {
    alert(
      "Saved hair data could not be read. Restore a valid backup before saving.",
    );
    return false;
  }
  try {
    localStorage.setItem(HAIR_KEY, JSON.stringify(hairState));
    persistedHair = structuredClone(hairState);
    return true;
  } catch {
    hairState = structuredClone(persistedHair);
    alert("Could not save. Local storage is unavailable or full.");
    return false;
  }
};
let editingHair = null;
let hairSelected = iso(new Date()),
  hairView = new Date();
hairView.setDate(1);
const hairWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
$("hairWeekChoices").innerHTML = hairWeek
  .map(
    (d, i) =>
      `<label><input type="checkbox" value="${i}" class="hairWeek"/>${d}</label>`,
  )
  .join("");
$("hairFreq").onchange = () =>
  $("hairWeekWrap").classList.toggle(
    "hidden",
    $("hairFreq").value !== "weekly",
  );
const hairApplies = (item, date) =>
  item.freq === "daily" ||
  (item.freq === "once" && item.date === date) ||
  (item.freq === "weekly" &&
    item.days.includes((new Date(date + "T12:00:00").getDay() + 6) % 7));
function renderHair() {
  const y = hairView.getFullYear(),
    m = hairView.getMonth();
  $("hairMonth").textContent = hairView.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const first = (new Date(y, m, 1).getDay() + 6) % 7,
    count = new Date(y, m + 1, 0).getDate();
  let html = hairWeek.map((d) => `<div class="weekday">${d}</div>`).join("");
  for (let i = 0; i < first; i++) html += "<div></div>";
  for (let day = 1; day <= count; day++) {
    const date = iso(new Date(y, m, day)),
      items = hairState.items.filter((x) => hairApplies(x, date));
    html += `<button aria-label="${dateFmt(date)}${items.length ? `, ${items.length} procedures` : ""}" aria-pressed="${hairSelected === date}" data-hairdate="${date}" class="${hairSelected === date ? "selected" : ""}">${day}${items.length ? '<span class="dot">●</span>' : ""}</button>`;
  }
  $("hairGrid").innerHTML = html;
  document.querySelectorAll("[data-hairdate]").forEach(
    (b) =>
      (b.onclick = () => {
        hairSelected = b.dataset.hairdate;
        renderHair();
      }),
  );
  $("hairDayPicker").value = hairSelected;
  $("hairDateTitle").textContent = new Date(
    hairSelected + "T12:00:00",
  ).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const items = hairState.items.filter((x) => hairApplies(x, hairSelected));
  $("hairTasks").innerHTML = items.length
    ? items
        .map(
          (x) =>
            `<label class="hair-task"><input type="checkbox" data-haircheck="${escapeHtml(x.id)}" ${hairState.checks[hairSelected + "|" + x.id] ? "checked" : ""}><span>${escapeHtml(x.name)} · ${x.time === "am" ? "morning" : "evening"}</span></label>`,
        )
        .join("")
    : '<p class="muted">No hair procedures for this day yet.</p>';
  document.querySelectorAll("[data-haircheck]").forEach(
    (el) =>
      (el.onchange = () => {
        hairState.checks[hairSelected + "|" + el.dataset.haircheck] =
          el.checked;
        if (!hairSave()) el.checked = !el.checked;
      }),
  );
  $("hairProducts").innerHTML = hairState.items
    .map(
      (x) =>
        `<div class="hair-product"><span>${escapeHtml(x.name)} · ${x.freq === "daily" ? "daily" : x.freq === "once" ? x.date : "by weekday"}</span><button data-hairedit="${escapeHtml(x.id)}">Edit</button><button data-hairremove="${escapeHtml(x.id)}">Delete</button></div>`,
    )
    .join("");
  document.querySelectorAll("[data-hairedit]").forEach(
    (el) =>
      (el.onclick = () => {
        const item = hairState.items.find((x) => x.id === el.dataset.hairedit);
        editingHair = item.id;
        $("hairName").value = item.name;
        $("hairTime").value = item.time;
        $("hairFreq").value = item.freq;
        if (item.freq === "once") hairSelected = item.date;
        hairView = new Date(
          parse(hairSelected).getFullYear(),
          parse(hairSelected).getMonth(),
          1,
        );
        renderHair();
        document
          .querySelectorAll(".hairWeek")
          .forEach((e) => (e.checked = item.days.includes(Number(e.value))));
        $("hairFreq").onchange();
        $("hairAdd").textContent = "Save changes";
        $("cancelHairEdit").classList.remove("hidden");
        $("hairName").focus();
      }),
  );
  document.querySelectorAll("[data-hairremove]").forEach(
    (el) =>
      (el.onclick = () => {
        if (!confirm("Delete this hair procedure?")) return;
        hairState.items = hairState.items.filter(
          (x) => x.id !== el.dataset.hairremove,
        );
        if (editingHair === el.dataset.hairremove) cancelHairEdit();
        if (!hairSave()) return;
        renderHair();
        $("hairName").focus();
      }),
  );
}
function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
$("hairDayPicker").onchange = (e) => {
  if (!validDate(e.target.value)) return;
  hairSelected = e.target.value;
  hairView = new Date(
    parse(hairSelected).getFullYear(),
    parse(hairSelected).getMonth(),
    1,
  );
  renderHair();
};
$("hairPrev").onclick = () => {
  hairView.setMonth(hairView.getMonth() - 1);
  renderHair();
};
$("hairNext").onclick = () => {
  hairView.setMonth(hairView.getMonth() + 1);
  renderHair();
};
$("hairAdd").onclick = () => {
  const name = $("hairName").value.trim(),
    freq = $("hairFreq").value,
    days = [...document.querySelectorAll(".hairWeek:checked")].map((x) =>
      Number(x.value),
    );
  if (!name) {
    alert("Enter a procedure name.");
    return;
  }
  if (freq === "weekly" && !days.length) {
    alert("Choose at least one weekday.");
    return;
  }
  const item = {
    id: editingHair || crypto.randomUUID(),
    name: name.slice(0, 90),
    time: $("hairTime").value,
    freq,
    date: hairSelected,
    days,
  };
  if (editingHair)
    hairState.items = hairState.items.map((x) =>
      x.id === editingHair ? item : x,
    );
  else hairState.items.push(item);
  if (!hairSave()) return;
  cancelHairEdit();
  renderHair();
};
renderHair();

// Inspiration: independent of skincare state; does not modify saved checkmarks.
(function () {
  let thoughts = [];
  let last = -1;
  const quote = document.getElementById("inspirationQuote"),
    idx = document.getElementById("quoteIndex"),
    cat = document.getElementById("quoteCategory");
  if (!quote) return;
  function next() {
    if (!thoughts.length) return;
    const groups = {
      calm: [0, 2, 11, 12, 13, 14, 17, 29, 37],
      boundaries: [3, 4, 8, 23, 26, 33, 36, 39],
      self: [5, 9, 10, 15, 18, 20, 30, 35, 38],
      growth: [1, 6, 7, 16, 19, 21, 22, 24, 25, 27, 28, 31, 32, 34],
    };
    let pool = thoughts
      .map((_, i) => i)
      .filter(
        (i) =>
          !cat ||
          cat.value === "all" ||
          (groups[cat.value] || []).includes(i % 40),
      );
    if (!pool.length) pool = thoughts.map((_, i) => i);
    let i = pool[Math.floor(Math.random() * pool.length)];
    if (i === last && pool.length > 1)
      i = pool[(pool.indexOf(i) + 1) % pool.length];
    last = i;
    quote.textContent = thoughts[i];
    idx.textContent =
      "REFLECTION " + String(i + 1).padStart(3, "0") + " / " + thoughts.length;
  }
  document.getElementById("nextInspiration").addEventListener("click", next);
  cat?.addEventListener("change", next);
  document
    .getElementById("copyInspiration")
    .addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(quote.textContent);
      } catch {}
    });
  fetch("./inspiration.json")
    .then((r) => {
      if (!r.ok) throw Error("offline");
      return r.json();
    })
    .then((data) => {
      thoughts = data;
      next();
    })
    .catch(() => {
      quote.textContent = "Your peace deserves space in every day.";
    });
})();

function cancelHairEdit() {
  editingHair = null;
  $("hairName").value = "";
  $("hairAdd").textContent = "Add to calendar";
  $("cancelHairEdit").classList.add("hidden");
}
$("cancelHairEdit").onclick = cancelHairEdit;

window.addEventListener("beauty:routines-added", () => {
  try {
    state = validateLegacyBackup(
      JSON.parse(localStorage.getItem(KEY)),
      defaults,
    );
    persistedState = structuredClone(state);
    render();
  } catch {
    $("appStatus").textContent =
      "The saved routine could not be refreshed. Export a backup before editing.";
  }
});

// Text-only, explicitly requested interview summary. No notes, photos or checks.
export function getRoutineInterviewSummary(start) {
  if (!validDate(start)) throw Error("Choose a valid start date.");
  const groups = { am: new Map(), pm: new Map() };
  for (let i = 0; i < 7; i++) {
    const date = add(start, i),
      day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][dow(date)];
    for (const time of ["am", "pm"])
      for (const [, label] of tasks(date)[time]) {
        const days = groups[time].get(label) || [];
        days.push(day);
        groups[time].set(label, days);
      }
  }
  return Object.fromEntries(
    ["am", "pm"].map((time) => [
      time,
      [...groups[time]]
        .map(([name, days]) => `${name}: ${days.join(", ")}`)
        .join("\n"),
    ]),
  );
}

export function getSelectedCalendarDate() {
  return selected;
}
