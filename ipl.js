import { readIPL, saveIPL, sessionStatus, planIPL } from "./lib/ipl.js";
import { localDate } from "./lib/domain.js";
import { getSelectedCalendarDate } from "./app.js?v=27";
const $ = (id) => document.getElementById(id);
let editing = "",
  proposal = null;
const tell = (text) => ($("iplStatus").textContent = text);
function read() {
  return readIPL();
}
function node(tag, text) {
  const el = document.createElement(tag);
  el.textContent = text;
  return el;
}
function render() {
  try {
    const state = read();
    for (const key of ["brand", "model", "instructions"])
      $("ipl" + key).value = state.device[key];
    const root = $("iplSessions");
    root.replaceChildren();
    const areas = new Map();
    for (const s of [...state.sessions].sort((a, b) =>
      a.date.localeCompare(b.date),
    )) {
      const counts = areas.get(s.area) || {
        completed: 0,
        planned: 0,
        missed: 0,
        cancelled: 0,
      };
      counts[sessionStatus(s)]++;
      areas.set(s.area, counts);
      const card = node("article", "");
      card.className = "panel";
      card.append(
        node("h3", s.area + " · " + s.date),
        node("p", sessionStatus(s)),
        node(
          "p",
          [s.settings, s.reaction, s.notes].filter(Boolean).join(" · "),
        ),
      );
      const edit = node("button", "Edit / postpone / cancel");
      edit.type = "button";
      edit.className = "subtle";
      edit.onclick = () => {
        editing = s.id;
        for (const k of [
          "date",
          "area",
          "settings",
          "reaction",
          "notes",
          "status",
        ])
          $("ipl" + k).value = s[k];
        $("ipldate").focus();
      };
      card.append(edit);
      root.append(card);
    }
    $("iplProgress").replaceChildren(
      ...[...areas].map(([area, c]) =>
        node(
          "p",
          `${area}: ${c.completed} completed · ${c.planned} upcoming · ${c.missed} missed · ${c.cancelled} cancelled`,
        ),
      ),
    );
    renderCalendar();
  } catch (e) {
    tell(
      "IPL data could not be read: " +
        e.message +
        " Existing data has been retained.",
    );
  }
}
function renderCalendar() {
  try {
    const date = getSelectedCalendarDate(),
      sessions = read().sessions.filter(
        (s) => s.date === date && s.status !== "cancelled",
      );
    $("iplCalendar").replaceChildren(
      ...sessions.map((s) =>
        node(
          "p",
          `IPL · ${s.area} · ${sessionStatus(s)} · ${s.settings || "Settings not recorded"}`,
        ),
      ),
    );
  } catch {
    $("iplCalendar").textContent = "IPL records unavailable.";
  }
}
$("iplDevice").onsubmit = (e) => {
  e.preventDefault();
  try {
    const state = read();
    state.device = Object.fromEntries(
      ["brand", "model", "instructions"].map((k) => [
        k,
        $("ipl" + k).value.trim(),
      ]),
    );
    if (!state.device.brand || !state.device.model)
      throw Error("Enter the exact device brand and model.");
    saveIPL(state, { confirmed: true });
    tell(
      "Device saved locally. Instructions link is not independently verified.",
    );
  } catch (e) {
    tell(e.message);
  }
};
$("iplForm").onsubmit = (e) => {
  e.preventDefault();
  try {
    const state = read();
    if (!state.device.model) throw Error("Register your exact device first.");
    const session = { id: editing || crypto.randomUUID() };
    for (const k of ["date", "area", "settings", "reaction", "notes", "status"])
      session[k] = $("ipl" + k).value.trim();
    const next = {
      ...state,
      sessions: [...state.sessions.filter((s) => s.id !== editing), session],
    };
    proposal = { session, editing }; // Validate before presenting, with no write.
    import("./lib/ipl.js").then(({ validateIPL }) => {
      try {
        validateIPL(next);
        $("iplPreview").textContent =
          `${session.date} · ${session.area} · ${session.status}. ${session.settings}. Manual entry; follow the exact device instructions. No treatment interval or setting is recommended by this app.`;
        $("iplConfirm").hidden = false;
      } catch (e) {
        proposal = null;
        tell(e.message);
      }
    });
  } catch (e) {
    tell(e.message);
  }
};
$("iplConfirm").onclick = () => {
  if (!proposal) return;
  try {
    const state = read();
    saveIPL(
      {
        ...state,
        sessions: [
          ...state.sessions.filter((s) => s.id !== proposal.editing),
          proposal.session,
        ],
      },
      { confirmed: true },
    );
    proposal = null;
    editing = "";
    $("iplConfirm").hidden = true;
    $("iplPreview").textContent = "";
    tell("IPL session saved to the calendar.");
    render();
  } catch (e) {
    tell("Not saved: " + e.message);
  }
};
$("iplForm").addEventListener("input", () => {
  proposal = null;
  $("iplConfirm").hidden = true;
});
$("iplNew").onclick = () => {
  editing = "";
  $("iplForm").reset();
  $("ipldate").value = localDate();
  proposal = null;
  $("iplConfirm").hidden = true;
};
$("iplPlan").onclick = () => {
  try {
    const state = read();
    planIPL({ brand: state.device.brand, model: state.device.model });
  } catch (e) {
    $("iplPlanningStatus").textContent =
      e.message +
      " The interview remains local. Your skincare AI endpoint cannot create IPL sessions.";
  }
};
$("iplAIEntry").onclick = () => {
  document.querySelector('[data-tab="ipl"]').click();
  $("iplPlanning").open = true;
  $("iplPlanning").scrollIntoView({ block: "start" });
};
$("iplExport").onclick = () => {
  try {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(read(), null, 2)], { type: "application/json" }),
    );
    const a = node("a", "");
    a.href = url;
    a.download = "beautyspace-ipl.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    tell(e.message);
  }
};
$("iplImport").onchange = async (e) => {
  try {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5000000) throw Error("Archive too large.");
    const incoming = JSON.parse(await file.text());
    const { validateIPL } = await import("./lib/ipl.js");
    validateIPL(incoming);
    if (
      !confirm(
        "Replace IPL records only with this archive? Export current IPL records first.",
      )
    )
      return;
    saveIPL(incoming, { confirmed: true });
    render();
    tell("IPL archive restored. Other stores are unchanged.");
  } catch (e) {
    tell("Restore failed: " + e.message);
  } finally {
    e.target.value = "";
  }
};
window.addEventListener("beauty:date-selected", renderCalendar);
$("ipldate").value = localDate();
render();
