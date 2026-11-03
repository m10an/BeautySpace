import { test, expect } from "@playwright/test";
import { goTo } from "./navigation.js";
async function open(page) {
  await page.goto("/");
  await goTo(page, "ritual");
  await page.locator("#openBuilder").click();
  await expect(page.locator("#routineBuilder")).toBeVisible();
}
async function preview(page) {
  await page.locator('[data-preset="moisture"]').click();
  await page.locator("#rbProduct").fill("Preview cream");
  for (let i = 0; i < 4; i++) await page.locator("#rbNext").click();
  await expect(page.locator("#rbPreviewName")).toContainText("Preview cream");
}
test("five-step builder writes only after confirmation and updates the live calendar", async ({
  page,
}) => {
  await open(page);
  const before = await page.evaluate(() =>
    localStorage.getItem("girly-skincare-v1"),
  );
  await preview(page);
  expect(
    await page.evaluate(() => localStorage.getItem("girly-skincare-v1")),
  ).toBe(before);
  await page.locator("#rbConfirm").click();
  await expect(page.locator("#routineBuilder")).not.toBeVisible();
  await expect(page.locator("#customList")).toContainText("Preview cream");
  await goTo(page, "calendar");
  await expect(page.locator("#selectedRoutine")).toContainText("Preview cream");
  await page.reload();
  await expect(page.locator("#selectedRoutine")).toContainText("Preview cream");
});
test("copying a schedule is an editable draft and cancellation does not save", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("copy-seed")) {
      localStorage.setItem("copy-seed", "1");
      localStorage.setItem(
        "girly-skincare-v1",
        JSON.stringify({
          start: "2026-01-01",
          checks: {},
          customItems: [
            {
              id: "copy-source",
              name: "Moisturize · Original cream",
              time: "am",
              mode: "weekdays",
              weekdays: [1, 5],
              from: "2026-01-01",
              until: "",
              once: "",
            },
          ],
        }),
      );
    }
  });
  await open(page);
  await page.locator("#rbCopy").selectOption("copy-source");
  await expect(page.locator("#rbProduct")).toHaveValue("Original cream");
  for (let i = 0; i < 4; i++) await page.locator("#rbNext").click();
  await expect(page.locator("#rbPreviewSchedule")).toContainText(
    "Morning · Tue, Sat",
  );
  await page.keyboard.press("Escape");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("girly-skincare-v1")).customItems
          .length,
    ),
  ).toBe(1);
});
test("failed builder save is visible and never claims success", async ({
  page,
}) => {
  await open(page);
  await preview(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw Error("Quota");
    };
  });
  await page.locator("#rbConfirm").click();
  await expect(page.locator("#rbStatus")).toContainText("Could not save");
  await expect(page.locator("#routineBuilder")).toBeVisible();
});
