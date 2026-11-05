import { validDate, localDate } from "./domain.js";
export function calendarDays(start, length = 7) {
  if (
    !validDate(start) ||
    !Number.isInteger(length) ||
    length < 1 ||
    length > 31
  )
    throw Error("Invalid calendar range.");
  const date = new Date(`${start}T12:00:00`);
  return Array.from({ length }, (_, i) => {
    const d = new Date(date);
    d.setDate(d.getDate() + i);
    return localDate(d);
  });
}
export function completion(snapshot) {
  const items = [...snapshot.am, ...snapshot.pm];
  const done = items.filter((x) => x.done).length;
  return {
    done,
    total: items.length,
    percent: items.length ? Math.round((done / items.length) * 100) : 0,
  };
}
export function upcomingSessions(sessions, today) {
  if (!validDate(today)) throw Error("Invalid current date.");
  return sessions
    .filter((s) => s.status === "planned" && s.date >= today)
    .sort(
      (a, b) => a.date.localeCompare(b.date) || a.area.localeCompare(b.area),
    );
}
