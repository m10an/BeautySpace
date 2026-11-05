import { test, expect } from "@playwright/test";
import { goTo } from "./navigation.js";
async function start(page) {
  await page.goto("/");
  await goTo(page, "ipl");
  await page.locator("#iplbrand").fill("Example");
  await page.locator("#iplmodel").fill("Exact model");
  await page.getByRole("button", { name: "Save device locally" }).click();
}
test("IPL confirmation, persistence, duplicate prevention and calendar integration", async ({
  page,
}) => {
  await start(page);
  await page.locator("#ipldate").fill("2026-01-01");
  await page.locator("#iplarea").fill("Legs");
  await page.locator("#iplsettings").fill("Recorded setting only");
  await page
    .getByRole("button", { name: "Preview session", exact: true })
    .click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("beautyspace-ipl-v1")).sessions.length,
    ),
  ).toBe(0);
  await page.locator("#iplConfirm").click();
  await expect(page.locator("#iplProgress")).toContainText("1 missed");
  await page.reload();
  await goTo(page, "ipl");
  await expect(page.locator("#iplSessions")).toContainText("Legs");
  await page.locator("#ipldate").fill("2026-01-01");
  await page.locator("#iplarea").fill("Legs");
  await page
    .getByRole("button", { name: "Preview session", exact: true })
    .click();
  await expect(page.locator("#iplStatus")).toContainText("already");
  await goTo(page, "ritual");
  await page.locator("#dayPicker").fill("2026-01-01");
  await goTo(page, "calendar");
  await expect(page.locator("#iplCalendar")).toContainText("IPL · Legs");
});
test("IPL edit, postponement and cancellation require a new confirmation", async ({
  page,
}) => {
  await start(page);
  await page.locator("#iplarea").fill("Arms");
  await page.locator("#ipldate").fill("2026-01-01");
  await page
    .getByRole("button", { name: "Preview session", exact: true })
    .click();
  await page.locator("#iplConfirm").click();
  await page.getByRole("button", { name: "Edit / postpone / cancel" }).click();
  await page.locator("#ipldate").fill("2027-01-01");
  await page.locator("#iplstatus").selectOption("cancelled");
  await page
    .getByRole("button", { name: "Preview session", exact: true })
    .click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("beautyspace-ipl-v1")).sessions[0].date,
    ),
  ).toBe("2026-01-01");
  await page.locator("#iplConfirm").click();
  await expect(page.locator("#iplSessions")).toContainText("cancelled");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("beautyspace-ipl-v1")).sessions.length,
    ),
  ).toBe(1);
});
test("unknown manufacturer guidance blocks IPL automation and AI entry opens local interview", async ({
  page,
}) => {
  await start(page);
  await goTo(page, "calendar");
  await page.locator("#aiLauncher").click();
  await page.locator("#aiOptions summary").click();
  await page.locator("#iplAIEntry").click();
  await expect(page.locator("#aiDialog")).not.toBeVisible();
  await expect(page.locator("#iplPlanning")).toHaveAttribute("open", "");
  await page.locator("#iplPlan").click();
  await expect(page.locator("#iplPlanningStatus")).toContainText("unavailable");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("beautyspace-ipl-v1")).sessions.length,
    ),
  ).toBe(0);
});
test("IPL remains local offline and corrupt records block planning without overwrite", async ({
  page,
  context,
}) => {
  await start(page);
  await context.setOffline(true);
  await page.locator("#iplarea").fill("Legs");
  await page.locator("#ipldate").fill("2026-01-01");
  await page
    .getByRole("button", { name: "Preview session", exact: true })
    .click();
  await page.locator("#iplConfirm").click();
  await expect(page.locator("#iplStatus")).toContainText("saved");
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.evaluate(() =>
    localStorage.setItem("beautyspace-ipl-v1", "{corrupt"),
  );
  await page.locator("#iplPlanning summary").click();
  await page.locator("#iplPlan").click();
  await expect(page.locator("#iplPlanningStatus")).toContainText("JSON");
  expect(
    await page.evaluate(() => localStorage.getItem("beautyspace-ipl-v1")),
  ).toBe("{corrupt");
  expect(errors).toEqual([]);
});
