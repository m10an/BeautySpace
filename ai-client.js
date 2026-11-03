import { getRoutineInterviewSummary } from "./app.js?v=25";
import { toolModal } from "./lib/dialog.js";
import { validateAIPlan, reviewActives, aiSteps } from "./lib/ai-plan.js";
import {
  buildRoutineItem,
  appendCalendarItems,
  careSteps,
} from "./lib/routine-plan.js";
import { localDate } from "./lib/domain.js";
import { readCollection } from "./lib/storage.js";
const $ = (id) => document.getElementById(id),
  dialog = $("aiDialog"),
  modal = toolModal(dialog, $("aiLauncher"));
let config,
  available = false,
  busy = false,
  draft = null,
  controller,
  token = "",
  widget,
  scriptPromise;
const status = (text) => ($("aiStatus").textContent = text);
function endpoint(value) {
  const url = new URL(value, location.href);
  if (
    url.username ||
    url.password ||
    !["https:", "http:"].includes(url.protocol) ||
    (url.protocol === "http:" &&
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
  )
    throw Error("Use an HTTPS AI endpoint.");
  return url;
}
async function availability() {
  try {
    const response = await fetch("./runtime-config.json", {
      cache: "no-store",
    });
    if (!response.ok) throw Error();
    config = await response.json();
    if (!config.aiEndpoint || !config.turnstileSiteKey)
      throw Error("AI is not configured. Manual Routine Builder is available.");
    const url = endpoint(config.aiEndpoint);
    const health = await fetch(new URL("/health", url), {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
      credentials: "omit",
    });
    available = health.ok && (await health.json()).available === true;
    status(
      available
        ? "AI server available. Review what you share and give consent before requesting a plan."
        : "AI unavailable: the server is not configured or cannot accept requests. Use the manual builder.",
    );
  } catch (error) {
    available = false;
    status(error.message || "AI unavailable. Use the manual Routine Builder.");
  }
  $("aiSend").disabled = !available || busy;
}
function updateLocal() {
  const warnings = reviewActives(
    $("aiCurrent").value +
      " " +
      $("aiActives").value +
      " " +
      $("aiMorning").value +
      " " +
      $("aiEvening").value,
  );
  $("aiLocal").replaceChildren();
  for (const text of warnings) {
    const p = document.createElement("p");
    p.textContent = text;
    $("aiLocal").append(p);
  }
  $("aiMedical").hidden = !$("aiAlarm").checked;
}
$("aiCurrent").addEventListener("input", updateLocal);
$("aiActives").addEventListener("input", updateLocal);
$("aiAlarm").addEventListener("change", updateLocal);
function loadChallenge() {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise)
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = resolve;
      script.onerror = () => {
        scriptPromise = null;
        script.remove();
        reject(Error("Human verification could not load."));
      };
      document.head.append(script);
    });
  return scriptPromise;
}
async function challenge() {
  await loadChallenge();
  if (widget !== undefined) {
    window.turnstile.reset(widget);
    token = "";
    return;
  }
  widget = window.turnstile.render($("aiChallenge"), {
    sitekey: config.turnstileSiteKey,
    size: "compact",
    action: "beauty-routine",
    callback: (value) => {
      token = value;
      status("Verification complete. You can request one AI plan.");
    },
    "expired-callback": () => {
      token = "";
    },
    "error-callback": () => {
      token = "";
      status("Verification failed. Try again or use the manual builder.");
    },
  });
}
$("aiConsent").addEventListener("change", async () => {
  if ($("aiConsent").checked && available)
    try {
      await challenge();
    } catch (error) {
      status(error.message);
    }
});
$("aiLauncher").onclick = async () => {
  draft = null;
  $("aiPreview").replaceChildren();
  $("aiReview").checked = false;
  $("aiSave").disabled = true;
  $("aiConsent").checked = false;
  $("aiStart").value = localDate();
  available = false;
  $("aiSend").disabled = true;
  status("Checking AI availability…");
  modal.open();
  updateLocal();
  try {
    const products = await readCollection();
    $("aiCollection").replaceChildren();
    for (const p of products) {
      const label = document.createElement("label");
      label.className = "toggle";
      const check = document.createElement("input");
      check.type = "checkbox";
      check.dataset.name = p.name;
      check.dataset.inci = p.inci;
      label.append(check, document.createTextNode(p.name));
      $("aiCollection").append(label);
    }
  } catch {
    $("aiCollection").textContent =
      "Collection unavailable; enter product labels manually.";
  }
  await availability();
};
dialog.addEventListener("close", () => {
  controller?.abort();
  token = "";
  if (window.turnstile && widget !== undefined) window.turnstile.reset(widget);
});
$("aiCopyProducts").onclick = () => {
  const selected = [...$("aiCollection").querySelectorAll("input:checked")];
  const text = selected
    .map((el) => `${el.dataset.name}: ${el.dataset.inci}`)
    .join("\n\n");
  if (selected.length > 10 || text.length > 8000) {
    status(
      "Choose at most ten products and shorten the selected text to 8,000 characters.",
    );
    return;
  }
  $("aiCurrent").value = text;
  updateLocal();
};
$("aiManual").onclick = () => {
  modal.close();
  document.querySelector('[data-tab="ritual"]').click();
  $("openBuilder").scrollIntoView({ block: "center", behavior: "auto" });
  $("openBuilder").click();
};
function interview() {
  return {
    skinType: $("aiSkin").value,
    sensitivity: $("aiSensitivity").value,
    goals: [...dialog.querySelectorAll("#aiGoals input:checked")].map(
      (x) => x.value,
    ),
    currentProducts: $("aiCurrent").value,
    actives: $("aiActives").value,
    morning: $("aiMorning").value,
    evening: $("aiEvening").value,
    constraints: $("aiConstraints").value,
    preferences: $("aiPreferences").value,
    alarmSymptoms: $("aiAlarm").checked,
    startDate: $("aiStart").value,
    consent: $("aiConsent").checked,
    challengeToken: token,
  };
}
$("aiForm").addEventListener("submit", (e) => e.preventDefault());
$("aiSend").onclick = async () => {
  if (busy || !available) return;
  if ($("aiAlarm").checked) {
    updateLocal();
    status("Planning paused. Please follow the medical guidance above.");
    return;
  }
  if (!$("aiConsent").checked) {
    status("Please explicitly consent before sending interview text.");
    $("aiConsent").focus();
    return;
  }
  if (!token) {
    status("Complete human verification before requesting a plan.");
    return;
  }
  busy = true;
  $("aiSend").disabled = true;
  draft = null;
  $("aiPreview").replaceChildren();
  $("aiSave").disabled = true;
  $("aiReview").checked = false;
  controller = new AbortController();
  status("Requesting one plan… No calendar changes are being made.");
  try {
    const response = await fetch(endpoint(config.aiEndpoint), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify(interview()),
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]),
    });
    if (!response.ok) {
      const messages = {
        429: "Request limit reached. Wait before trying again; no automatic retry will occur.",
        422: "Planning paused. Seek medical advice for concerning symptoms.",
        503: "AI is not configured on the server.",
        403: "Verification or origin access was rejected.",
      };
      throw Error(
        messages[response.status] || "AI request failed. No plan was saved.",
      );
    }
    const body = await response.json();
    draft = validateAIPlan(body.plan);
    if (draft.items.some((item) => item.from < $("aiStart").value))
      throw Error("Plan starts before the requested date.");
    renderPlan();
    status(
      "Validated proposal ready. Edit and review it before adding anything to the calendar.",
    );
  } catch (error) {
    if (error.name !== "AbortError")
      status(
        error.name === "TimeoutError"
          ? "AI timed out. No plan was saved."
          : error.message,
      );
  } finally {
    busy = false;
    $("aiSend").disabled = !available;
    token = "";
    if (window.turnstile && widget !== undefined)
      window.turnstile.reset(widget);
  }
};
function label(text, control) {
  const node = document.createElement("label");
  node.className = "field";
  node.append(document.createTextNode(text), control);
  return node;
}
function renderPlan() {
  const root = $("aiPreview");
  root.replaceChildren();
  const heading = document.createElement("h3");
  heading.textContent = "Your proposed plan";
  const summary = document.createElement("p");
  summary.textContent = draft.summary;
  root.append(heading, summary);
  for (const text of [...draft.concerns, ...draft.limitations]) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = text;
    root.append(p);
  }
  if (draft.recommendMedical) {
    const p = document.createElement("p");
    p.textContent =
      "Medical review is recommended. This proposal cannot be added automatically.";
    root.append(p);
    return;
  }
  draft.items.forEach((item, i) => {
    const card = document.createElement("fieldset");
    card.className = "proposed-step";
    card.dataset.aiRow = String(i);
    const legend = document.createElement("legend");
    legend.textContent = `Proposed step ${i + 1}`;
    card.append(legend);
    const name = document.createElement("input");
    name.dataset.field = "name";
    name.value = item.name;
    name.maxLength = 70;
    card.append(label("Product / care name", name));
    for (const [key, options] of [
      ["step", aiSteps],
      ["time", ["am", "pm"]],
    ]) {
      const select = document.createElement("select");
      select.dataset.field = key;
      for (const value of options)
        select.add(
          new Option(
            key === "step"
              ? careSteps[value]
              : value === "am"
                ? "Morning"
                : "Evening",
            value,
          ),
        );
      select.value = item[key];
      card.append(label(key === "step" ? "Care step" : "Time of day", select));
    }
    const days = document.createElement("div");
    days.className = "weekdaychoices";
    for (let d = 0; d < 7; d++) {
      const l = document.createElement("label"),
        check = document.createElement("input");
      check.type = "checkbox";
      check.dataset.weekday = String(d);
      check.checked = item.weekdays.includes(d);
      l.append(
        check,
        document.createTextNode(
          ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d],
        ),
      );
      days.append(l);
    }
    card.append(days);
    for (const key of ["from", "until"]) {
      const date = document.createElement("input");
      date.type = "date";
      date.dataset.field = key;
      date.value = item[key] || "";
      card.append(
        label(key === "from" ? "Start date" : "End date (optional)", date),
      );
    }
    const reason = document.createElement("p");
    reason.className = "muted";
    reason.textContent = item.reason;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "subtle";
    remove.textContent = "Remove proposed step";
    remove.onclick = () => {
      card.remove();
      $("aiReview").checked = false;
      $("aiSave").disabled = true;
    };
    card.append(reason, remove);
    card.addEventListener("input", () => {
      $("aiReview").checked = false;
      $("aiSave").disabled = true;
    });
    root.append(card);
  });
}
$("aiReview").onchange = () => {
  $("aiSave").disabled =
    !$("aiReview").checked || !draft || draft.recommendMedical;
};
$("aiSave").onclick = () => {
  if (!$("aiReview").checked || !draft || draft.recommendMedical) return;
  try {
    const edited = structuredClone(draft);
    edited.items = [...$("aiPreview").querySelectorAll("[data-ai-row]")].map(
      (card) => {
        const item = structuredClone(draft.items[Number(card.dataset.aiRow)]);
        for (const input of card.querySelectorAll("[data-field]"))
          item[input.dataset.field] =
            input.dataset.field === "until" ? input.value || null : input.value;
        item.weekdays = [
          ...card.querySelectorAll("[data-weekday]:checked"),
        ].map((x) => Number(x.dataset.weekday));
        return item;
      },
    );
    const checked = validateAIPlan(edited);
    const items = checked.items.map((item) =>
      buildRoutineItem({
        product: item.name,
        step: item.step,
        time: item.time,
        weekdays: item.weekdays,
        from: item.from,
        until: item.until || "",
      }),
    );
    appendCalendarItems(items, { confirmed: true });
    window.dispatchEvent(new Event("beauty:routines-added"));
    $("aiSave").disabled = true;
    draft = null;
    $("appStatus").textContent =
      "Reviewed AI proposal added. Existing procedures were not removed.";
    modal.close();
  } catch (error) {
    status(`Plan not saved: ${error.message}`);
  }
};

for (const id of ["aiMorning", "aiEvening"])
  $(id).addEventListener("input", updateLocal);
$("aiCopySchedule").onclick = () => {
  try {
    const text = getRoutineInterviewSummary($("aiStart").value);
    if (text.am.length > 1600 || text.pm.length > 1600)
      throw Error(
        "The weekly summary is too long; enter only relevant steps manually.",
      );
    $("aiMorning").value = text.am;
    $("aiEvening").value = text.pm;
    updateLocal();
    status(
      "Weekly care copied into editable interview text. Nothing has been sent.",
    );
  } catch (error) {
    status(error.message);
  }
};
