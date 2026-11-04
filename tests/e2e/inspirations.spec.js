import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { goTo } from "./navigation.js";
import { dailyInspiration } from "../../lib/inspiration.js";
const data = JSON.parse(readFileSync("inspiration.json"));
test.use({ timezoneId: "UTC", reducedMotion: "reduce" });
async function expectReading(page, date) {
  const q = dailyInspiration(data, date);
  await expect(page.locator("#inspirationQuote")).toHaveText(q.text);
  await expect(page.locator("#quoteAttribution")).toHaveText(
    "Attributed to " + q.attributedAuthor,
  );
  await expect(page.locator("#quoteCitation")).toContainText(
    `page ${q.sourcePage} of 6`,
  );
  await expect(page.locator("#copyInspiration")).toBeEnabled();
  return q;
}
async function controlled(page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", resolve, {
          once: true,
        }),
      );
  });
}
test("all ten daily readings originate from the reviewed PDF selection and remain stable on reload", async ({
  page,
}) => {
  for (let day = 1; day <= data.quotes.length; day++) {
    const date = `2026-11-${String(day).padStart(2, "0")}`;
    await page.clock.setFixedTime(new Date(date + "T12:00:00Z"));
    await page.goto("/");
    await goTo(page, "inspiration");
    await expectReading(page, date);
  }
  await page.reload();
  await goTo(page, "inspiration");
  await expectReading(page, "2026-11-10");
  await expect(page.locator("#nextInspiration,#quoteCategory")).toHaveCount(0);
});
test("approved excerpt, attribution and source page survive an offline PWA reload", async ({
  page,
  context,
}) => {
  await page.clock.setFixedTime(new Date("2026-11-04T12:00:00Z"));
  await page.goto("/");
  await goTo(page, "inspiration");
  await expectReading(page, "2026-11-04");
  await controlled(page);
  await context.setOffline(true);
  await page.reload();
  await goTo(page, "inspiration");
  await expectReading(page, "2026-11-04");
});
test("the reading rolls over at local midnight without a reload or network", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-11-04T12:00:00Z") });
  await page.goto("/");
  await goTo(page, "inspiration");
  await expectReading(page, "2026-11-04");
  await controlled(page);
  await context.setOffline(true);
  await page.clock.fastForward(12 * 60 * 60 * 1000 + 1000);
  await expectReading(page, "2026-11-05");
});
test.describe("source failure recovery", () => {
  test.use({ serviceWorkers: "block" });
  for (const failure of ["unavailable", "foreign"])
    test(`source ${failure} never shows invented quotations or stale attributions`, async ({
      page,
    }) => {
      await page.route("**/inspiration.json*", (route) =>
        failure === "unavailable"
          ? route.abort()
          : route.fulfill({
              json: { ...data, source: { ...data.source, file: "other.pdf" } },
            }),
      );
      await page.goto("/");
      await goTo(page, "inspiration");
      await expect(page.locator("#inspirationStatus")).toContainText(
        "no substitute quotations",
      );
      await expect(page.locator("#inspirationQuote")).toBeEmpty();
      await expect(page.locator("#quoteAttribution")).toBeEmpty();
      await expect(page.locator("#quoteCitation")).toBeEmpty();
      await expect(page.locator("#copyInspiration")).toBeDisabled();
    });
});
