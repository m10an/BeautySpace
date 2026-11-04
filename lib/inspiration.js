import { validDate } from "./domain.js";
export function validateInspirations(data) {
  if (
    !data ||
    data.version !== 1 ||
    data.source?.file !== "Buddhism Quotes (2755 quotes).pdf" ||
    !Array.isArray(data.quotes)
  )
    throw Error("Unapproved inspiration source.");
  if (
    data.quotes.length &&
    (!/^[a-f0-9]{64}$/.test(data.source.sha256 || "") ||
      !Number.isInteger(data.source.pageCount) ||
      data.source.pageCount < 1 ||
      data.source.status !== "reviewed")
  )
    throw Error(
      "The supplied PDF must be reviewed before publishing excerpts.",
    );
  const ids = new Set(),
    texts = new Set();
  for (const q of data.quotes) {
    if (
      !q ||
      typeof q.id !== "string" ||
      ids.has(q.id) ||
      typeof q.text !== "string" ||
      !q.text.trim() ||
      q.text.length > 240 ||
      texts.has(q.text) ||
      typeof q.attributedAuthor !== "string" ||
      !q.attributedAuthor.trim() ||
      !Number.isInteger(q.sourcePage) ||
      q.sourcePage < 1 ||
      q.sourcePage > data.source.pageCount ||
      q.sourceSha256 !== data.source.sha256 ||
      q.reviewed !== true
    )
      throw Error("Invalid or unreviewed PDF excerpt.");
    ids.add(q.id);
    texts.add(q.text);
  }
  return data;
}
export function dailyInspiration(data, date) {
  validateInspirations(data);
  if (!validDate(date)) throw Error("Invalid reading date.");
  if (!data.quotes.length) return null;
  return data.quotes[
    Math.floor(Date.parse(date + "T12:00:00Z") / 86400000) % data.quotes.length
  ];
}

/** Schedule the next local midnight using calendar dates, including DST days. */
export function nextReadingDelay(now = new Date()) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime()))
    throw Error("Invalid reading clock.");
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  return Math.max(1, midnight.getTime() - now.getTime());
}
