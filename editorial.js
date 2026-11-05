import {
  getEditorialSnapshot,
  getSelectedCalendarDate,
  selectCalendarDate,
  activateSection,
} from "./app.js?v=29";
import { localDate } from "./lib/domain.js";
import { readIPL, sessionStatus } from "./lib/ipl.js";
import { calendarDays, completion, upcomingSessions } from "./lib/editorial.js";
const $ = (id) => document.getElementById(id);
let view = "month";
function element(tag, text, className) {
  const e = document.createElement(tag);
  e.textContent = text;
  if (className) e.className = className;
  return e;
}
function readable(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function sessions() {
  try {
    return readIPL().sessions;
  } catch {
    return null;
  }
}
function today() {
  selectCalendarDate(localDate());
  activateSection("calendar");
  document.getElementById("main").focus({ preventScroll: true });
  scrollTo({ top: 0, behavior: "auto" });
}
document
  .querySelectorAll("[data-open-today]")
  .forEach((x) => x.addEventListener("click", today));
$("routineBuildShortcut").onclick = () => $("openBuilder").click();
$("startConsultant").onclick = () => $("aiLauncher").click();
function render() {
  const date = localDate(),
    snapshot = getEditorialSnapshot(date),
    selected = getEditorialSnapshot(getSelectedCalendarDate());
  $("homeDate").textContent = new Date(`${date}T12:00:00`).toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric", year: "numeric" },
  );
  $("homeCare").replaceChildren(
    ...["am", "pm"].map((time) => {
      const items = snapshot[time],
        article = element("article", "", `panel home-care-${time}`),
        c = completion({ am: items, pm: [] });
      article.append(
        element(
          "span",
          time === "am" ? "01 / MORNING" : "02 / EVENING",
          "eyebrow",
        ),
        element("h3", time === "am" ? "Begin softly." : "End with care."),
        element("p", `${c.done} of ${c.total} steps complete`),
      );
      const ul = element("ul", "");
      for (const item of items.slice(0, 3)) ul.append(element("li", item.name));
      article.append(ul);
      const link = element("a", "Review your steps", "text-link");
      link.href = "#ritual";
      link.dataset.route = "ritual";
      link.addEventListener("click", () => selectCalendarDate(date));
      article.append(link);
      return article;
    }),
  );
  const c = completion(selected);
  $("routineProgressPercent").textContent = `${c.percent}%`;
  $("routineProgressRing").style.strokeDasharray = `${c.percent * 3.393} 339.3`;
  $("routineProgressLabel").textContent =
    `${c.done} of ${c.total} steps completed for ${readable(selected.date)}`;
  $("routineProgressText").textContent =
    `${c.done} of ${c.total} steps complete · ${readable(selected.date)}`;
  const all = sessions(),
    next = all && upcomingSessions(all, date)[0];
  $("homeIPL").replaceChildren(
    element(
      "p",
      all === null
        ? "IPL records unavailable. Existing data is retained."
        : next
          ? `${next.area} · ${readable(next.date)}`
          : "No upcoming sessions. Log dates from your exact device instructions.",
    ),
  );
  const observation = snapshot.observations[0];
  $("homeObservation").replaceChildren(
    element(
      "p",
      observation
        ? `${readable(observation.date)} · ${observation.note?.slice(0, 160) || "Observation recorded."}`
        : "Your next observation begins here. Nothing to compare, nothing to rush.",
    ),
  );
  let history = $("observationHistory");
  if (!history) {
    history = element("div", "", "panel");
    history.id = "observationHistory";
    $("journal").append(history);
  }
  history.replaceChildren(element("h2", "Your observations"));
  if (!snapshot.observations.length)
    history.append(
      element("p", "No observations yet. Save your first note above.", "muted"),
    );
  for (const record of snapshot.observations) {
    const row = element("article", "", "observation-entry");
    row.append(
      element("h3", readable(record.date)),
      element("p", record.note || "Observation recorded."),
      element(
        "p",
        `Dryness ${record.dryness} · Irritation ${record.irritation} · Inflammation ${record.inflamed} · Comedones ${record.comedones}`,
        "muted",
      ),
    );
    const edit = element("button", "Review observation", "subtle");
    edit.type = "button";
    edit.onclick = () => {
      $("moodDate").value = record.date;
      $("moodDate").dispatchEvent(new Event("change", { bubbles: true }));
      $("moodNote").focus();
    };
    row.append(edit);
    history.append(row);
  }
  for (const cell of document.querySelectorAll("#monthGrid [data-date]")) {
    cell.querySelectorAll(".ipl-mark").forEach((x) => x.remove());
    cell.setAttribute(
      "aria-label",
      cell.getAttribute("aria-label").replace(/, \d+ IPL sessions?$/, ""),
    );
    const matched =
      all?.filter(
        (s) => s.date === cell.dataset.date && s.status !== "cancelled",
      ) || [];
    if (matched.length) {
      const dot = element("i", "", "dot ipl-mark");
      dot.setAttribute("aria-hidden", "true");
      cell.querySelector(".marks").append(dot);
      cell.setAttribute(
        "aria-label",
        cell.getAttribute("aria-label") +
          `, ${matched.length} IPL session${matched.length > 1 ? "s" : ""}`,
      );
    }
  }
  renderAgenda();
}
function renderAgenda() {
  const root = $("calendarAgenda");
  root.replaceChildren();
  root.hidden = view === "month";
  for (const e of document.querySelectorAll(
    ".calendar-sheet > .weekdays,#monthGrid",
  ))
    e.hidden = view !== "month";
  if (view === "month") return;
  const start = getSelectedCalendarDate();
  const dates = calendarDays(start, view === "week" ? 7 : 14),
    all = sessions();
  const controls = element("div", "", "agenda-controls");
  for (const [text, offset] of [
    ["← Previous", -dates.length],
    ["Next →", dates.length],
  ]) {
    const b = element("button", text, "subtle");
    b.type = "button";
    b.dataset.agendaMove = offset < 0 ? "previous" : "next";
    b.onclick = () => {
      const d = new Date(`${start}T12:00:00`);
      d.setDate(d.getDate() + offset);
      selectCalendarDate(localDate(d));
      document
        .querySelector(
          `[data-agenda-move="${offset < 0 ? "previous" : "next"}"]`,
        )
        ?.focus({ preventScroll: true });
    };
    controls.append(b);
  }
  root.append(
    element(
      "p",
      `${view === "week" ? "Seven" : "Fourteen"} days from ${readable(start)}`,
      "muted",
    ),
    controls,
  );
  for (const date of dates) {
    const data = getEditorialSnapshot(date),
      row = element("div", "", "agenda-day"),
      b = element("button", readable(date), "agenda-date");
    b.type = "button";
    b.setAttribute("aria-pressed", String(date === getSelectedCalendarDate()));
    b.onclick = () => {
      selectCalendarDate(date);
      document
        .querySelector('#calendarAgenda [aria-pressed="true"]')
        ?.focus({ preventScroll: true });
    };
    row.append(
      b,
      element(
        "p",
        `${data.am.length} morning · ${data.pm.length} evening steps`,
      ),
    );
    for (const s of all?.filter(
      (x) => x.date === date && x.status !== "cancelled",
    ) || [])
      row.append(
        element("p", `IPL · ${s.area} · ${sessionStatus(s)}`, "agenda-ipl"),
      );
    root.append(row);
  }
}
for (const b of document.querySelectorAll("[data-calendar-view]"))
  b.addEventListener("click", () => {
    view = b.dataset.calendarView;
    document
      .querySelectorAll("[data-calendar-view]")
      .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    renderAgenda();
  });
for (const b of document.querySelectorAll("[data-routine-time]"))
  b.addEventListener("click", () => {
    $("todayRoutine").dataset.time = b.dataset.routineTime;
    document
      .querySelectorAll("[data-routine-time]")
      .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  });
window.addEventListener("beauty:date-selected", render);
window.addEventListener("beauty:ipl-updated", render);
window.addEventListener("beauty:observation-saved", render);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) render();
});
render();
