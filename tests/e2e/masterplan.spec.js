import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { goTo, interviewStep, setTheme } from "./navigation.js";
test("Home discovery, brand navigation and matching approved daily reading never write care data", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#home")).toBeVisible();
  await expect(page.locator("#homeQuote")).not.toBeEmpty();
  const before = await page.evaluate(() =>
    localStorage.getItem("girly-skincare-v1"),
  );
  await page.locator("[data-open-today]").click();
  await expect(page.locator("#calendar")).toBeVisible();
  await goTo(page, "inspiration");
  await expect(page.locator("#homeQuote")).toHaveText(
    await page.locator("#inspirationQuote").textContent(),
  );
  await page.locator("#homeLink").click();
  await expect(page.locator("#home")).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("girly-skincare-v1")),
  ).toBe(before);
});
test("AM/PM routine completion uses original check IDs and updates real progress across reload and Home", async ({
  page,
}) => {
  await page.goto("/");
  await goTo(page, "ritual");
  await page.locator("#todayRoutine input").first().check();
  const key = await page
    .locator("#todayRoutine input")
    .first()
    .getAttribute("data-key");
  await expect(page.locator("#routineProgressText")).toContainText("1 of");
  await page.locator('[data-routine-time="pm"]').click();
  await expect(
    page.locator('#todayRoutine .routine-group[data-time="pm"]'),
  ).toBeVisible();
  await expect(
    page.locator('#todayRoutine .routine-group[data-time="am"]'),
  ).not.toBeVisible();
  await page.reload();
  await goTo(page, "ritual");
  await expect(page.locator("#todayRoutine input").first()).toBeChecked();
  expect(
    await page.evaluate(
      (k) => JSON.parse(localStorage.getItem("girly-skincare-v1")).checks[k],
      key,
    ),
  ).toBe(true);
  await page.locator("#homeLink").click();
  await expect(page.locator("#homeCare")).toContainText("1 of");
});
test("month/week/list calendar views select real dates without changing saved schedules", async ({
  page,
}) => {
  await page.goto("/");
  await goTo(page, "calendar");
  const before = await page.evaluate(() =>
    localStorage.getItem("girly-skincare-v1"),
  );
  for (const [view, count] of [
    ["week", 7],
    ["list", 14],
  ]) {
    await page.locator(`[data-calendar-view="${view}"]`).click();
    await expect(page.locator("#calendarAgenda .agenda-date")).toHaveCount(
      count,
    );
    await page.locator("#calendarAgenda .agenda-date").nth(1).click();
    await expect(page.locator("#selectedRoutine")).toBeVisible();
    await expect(
      page.locator('#calendarAgenda .agenda-date[aria-pressed="true"]'),
    ).toBeFocused();
  }
  await page.locator('[data-calendar-view="month"]').click();
  await expect(page.locator("#monthGrid")).toBeVisible();
  await expect(page.locator("#calendarAgenda")).not.toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("girly-skincare-v1")),
  ).toBe(before);
});
test("product shelf filters real user entries and keeps INCI/edit/delete intact", async ({
  page,
}) => {
  await page.goto("/");
  await goTo(page, "products");
  await page.locator("#productName").fill("QA body lotion");
  await page.locator("#productCategory").selectOption("body");
  await page.locator("#productInci").fill("Aqua, Glycerin");
  await page.locator("#productSave").click();
  const card = page
    .locator(".product-card")
    .filter({ hasText: "QA body lotion" });
  await expect(card).toBeVisible();
  await expect(card.locator("img")).toHaveCount(0);
  await page.locator('[data-product-filter="hair"]').click();
  await expect(page.locator("#productList")).toContainText(
    "No saved products in this category",
  );
  await page.locator('[data-product-filter="body"]').click();
  await card.locator("summary").click();
  await expect(card.locator(".product-analysis")).toContainText("2 of 2");
  await card.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.locator("#productInci")).toHaveValue("Aqua, Glycerin");
  await page.locator("#productName").fill("QA edited lotion");
  await page.locator("#productSave").click();
  await page.reload();
  await goTo(page, "products");
  await expect(page.locator(".product-card")).toContainText("QA edited lotion");
  page.on("dialog", (d) => d.accept());
  await page
    .locator(".product-card")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(page.locator(".product-card")).toHaveCount(0);
});
test("consultant Back keeps answers, rejects a preview without mutation and exposes hidden invalid answers", async ({
  page,
}) => {
  await page.goto("/");
  await goTo(page, "consultant");
  await page.locator("#startConsultant").click();
  await interviewStep(page, 2);
  await page.locator("#aiMoisturizer").fill("My existing cream");
  await interviewStep(page, 1);
  await interviewStep(page, 2);
  await expect(page.locator("#aiMoisturizer")).toHaveValue("My existing cream");
  await interviewStep(page);
  await page.locator("#aiSend").click();
  await expect(
    page.locator('[data-ai-row="1"] [data-field="name"]'),
  ).toHaveValue("My existing cream");
  await page.locator("#aiReject").click();
  await expect(page.locator("#aiPreview")).toBeEmpty();
  expect(
    await page.evaluate(() => localStorage.getItem("girly-skincare-v1")),
  ).toBeNull();
  await interviewStep(page, 2);
  await page.locator("#aiMoisturizer").fill("   ");
  await page.locator("#aiNext").click();
  await expect(page.locator("#aiMoisturizer")).toBeFocused();
  await expect(page.locator("#aiMoisturizer-error")).not.toBeEmpty();
});
for (const theme of ["light", "dark"])
  test(`masterplan new surfaces accessibility ${theme}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await setTheme(page, theme);
    for (const route of ["home", "consultant", "ritual", "ipl", "products"]) {
      await goTo(page, route);
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      await info.attach(`${route}-axe`, {
        body: JSON.stringify(result),
        contentType: "application/json",
      });
      expect(result.violations, route).toEqual([]);
    }
  });
test("changing interview answers invalidates the former plan, including a newly reported alarm symptom", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#aiLauncher").click();
  await interviewStep(page);
  await page.locator("#aiSend").click();
  await expect(page.locator("#aiPreview")).not.toBeEmpty();
  await interviewStep(page, 1);
  await page.locator("#aiAlarm").check();
  await expect(page.locator("#aiMedical")).toBeVisible();
  await interviewStep(page);
  await expect(page.locator("#aiPreview")).toBeEmpty();
  await expect(page.locator("#aiSave")).toBeDisabled();
  await page.locator("#aiSend").click();
  await expect(page.locator("#aiPreview")).toContainText("Medical review");
  await expect(page.locator("#aiSave")).toBeDisabled();
  expect(
    await page.evaluate(() => localStorage.getItem("girly-skincare-v1")),
  ).toBeNull();
});
test("copying a calendar week invalidates a prior proposal until a new review", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#aiLauncher").click();
  await interviewStep(page);
  await page.locator("#aiSend").click();
  await expect(page.locator("#aiPreview")).not.toBeEmpty();
  await interviewStep(page, 2);
  await page.locator("#aiCopySchedule").click();
  await interviewStep(page);
  await expect(page.locator("#aiPreview")).toBeEmpty();
  await expect(page.locator("#aiSave")).toBeDisabled();
  expect(
    await page.evaluate(() => localStorage.getItem("girly-skincare-v1")),
  ).toBeNull();
  await page.locator("#aiSend").click();
  await expect(page.locator("#aiPreview")).not.toBeEmpty();
  await expect(page.locator("#aiReview")).not.toBeChecked();
});
test("builder draft resumes after reload and never writes calendar before confirmation", async ({
  page,
}) => {
  await page.goto("/");
  await goTo(page, "ritual");
  await page.locator("#openBuilder").click();
  await page.locator("#rbProduct").fill("QA saved moisturizer");
  await page.locator("#rbNext").click();
  await page.locator("#rbStep").selectOption("hydrate");
  await page.locator("#rbSaveDraft").click();
  await expect(page.locator("#rbStatus")).toContainText("Draft saved");
  expect(
    await page.evaluate(() => localStorage.getItem("girly-skincare-v1")),
  ).toBeNull();
  await page.locator("#routineBuilder [data-close]").click();
  await page.reload();
  await goTo(page, "ritual");
  await page.locator("#openBuilder").click();
  await page.locator("#rbResumeDraft").click();
  await expect(page.locator("#rbProgress")).toHaveText("Step 2 of 5");
  await page.locator("#rbBack").click();
  await expect(page.locator("#rbProduct")).toHaveValue("QA saved moisturizer");
  for (let i = 0; i < 4; i++) await page.locator("#rbNext").click();
  await expect(page.locator("#rbPreviewName")).toContainText(
    "QA saved moisturizer",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("girly-skincare-v1")),
  ).toBeNull();
  await page.locator("#rbConfirm").click();
  await expect(page.locator("#routineBuilder")).not.toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("girly-skincare-v1")).customItems
          .length,
    ),
  ).toBe(1);
});
test("confirmed care-step reordering preserves IDs, checkmarks and schedule details", async ({
  page,
}) => {
  await page.goto("/");
  await goTo(page, "ritual");
  await page.locator("#advancedCare summary").click();
  for (const name of ["QA first step", "QA second step"]) {
    await page.locator("#customName").fill(name);
    await page.locator("#customTime").selectOption("am");
    await page.locator("#customMode").selectOption("daily");
    await page.locator("#addCustom").click();
  }
  await page.locator("#todayRoutine input").first().check();
  const before = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("girly-skincare-v1")),
  );
  page.on("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Move earlier: QA second step", exact: true })
    .click();
  const after = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("girly-skincare-v1")),
  );
  expect(after.checks).toEqual(before.checks);
  expect(after.customItems).toEqual([...before.customItems].reverse());
  await page.reload();
  await goTo(page, "ritual");
  expect(
    (
      await page
        .locator('#todayRoutine .routine-group[data-time="am"] .task span')
        .allTextContents()
    ).slice(-2),
  ).toEqual(["QA second step", "QA first step"]);
});
