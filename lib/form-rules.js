import { validDate, normalize } from "./domain.js";
export function fieldError({
  value = "",
  required = false,
  type = "text",
  maxLength = -1,
  min = "",
  max = "",
}) {
  if (required && !value.trim())
    return "This field is required. Enter a value.";
  if (value && !value.trim())
    return "Enter meaningful text, or leave this optional field empty.";
  if (maxLength >= 0 && value.length > maxLength)
    return `Use at most ${maxLength} characters.`;
  if (value && type === "date" && !validDate(value))
    return "Choose a valid calendar date.";
  if (
    value &&
    type === "date" &&
    ((min && value < min) || (max && value > max))
  )
    return "Choose a date within the allowed range.";
  if (
    value &&
    type === "number" &&
    (!Number.isFinite(Number(value)) ||
      (min !== "" && Number(value) < Number(min)) ||
      (max !== "" && Number(value) > Number(max)))
  )
    return "Enter a number within the allowed range.";
  return "";
}
export function duplicateSchedule(items, item, ignoreId) {
  return items.some(
    (x) =>
      x.id !== ignoreId &&
      normalize(x.name) === normalize(item.name) &&
      x.time === item.time &&
      overlap(x, item),
  );
}
function active(item, date) {
  if (item.mode === "once") return item.once === date;
  if (date < item.from || (item.until && date > item.until)) return false;
  if (item.mode === "daily") return true;
  return item.weekdays.includes(
    (new Date(date + "T12:00:00Z").getUTCDay() + 6) % 7,
  );
}
function overlap(a, b) {
  if (a.mode === "once") return active(b, a.once);
  if (b.mode === "once") return active(a, b.once);
  const start = a.from > b.from ? a.from : b.from,
    end =
      (a.until || "9999-12-31") < (b.until || "9999-12-31")
        ? a.until || "9999-12-31"
        : b.until || "9999-12-31";
  if (start > end) return false;
  for (let i = 0; i < 7; i++) {
    const date = new Date(Date.parse(start + "T12:00:00Z") + i * 86400000)
      .toISOString()
      .slice(0, 10);
    if (date > end) return false;
    if (active(a, date) && active(b, date)) return true;
  }
  return false;
}
