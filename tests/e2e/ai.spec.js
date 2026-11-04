import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { setTheme } from "./navigation.js";
test.use({ serviceWorkers: "block" });
const fixture = JSON.parse(readFileSync("tests/fixtures/ai-plan.json"));
async function open(page) {
  await page.goto("/");
  await page.locator("#aiLauncher").click();
  await expect(page.locator("#aiDialog")).toBeVisible();
}
async function mocks(page, plan = fixture, status = 200) {
  let requests = 0;
  const payloads = [];
  await page.route("**/runtime-config.json", (r) =>
    r.fulfill({
      json: {
        aiEndpoint: "https://ai.test.example/v1/routine-plan",
        turnstileSiteKey: "public-test-fixture",
      },
    }),
  );
  await page.route("https://ai.test.example/health", (r) =>
    r.fulfill({
      headers: { "Access-Control-Allow-Origin": "*" },
      json: { available: true },
    }),
  );
  await page.route(
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
    (r) =>
      r.fulfill({
        contentType: "application/javascript",
        body: "window.turnstile={render:(el,opts)=>{window.fixtureChallenge=opts.callback;opts.callback('synthetic-token');return 'fixture';},reset:()=>{}};",
      }),
  );
  await page.route("https://ai.test.example/v1/routine-plan", async (r) => {
    if (r.request().method() === "OPTIONS")
      return r.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "POST,OPTIONS",
        },
      });
    requests++;
    payloads.push(r.request().postDataJSON());
    await r.fulfill({
      status,
      headers: { "Access-Control-Allow-Origin": "*" },
      json: {
        plan: plan?.items
          ? {
              ...plan,
              items: plan.items.map((item) => ({
                ...item,
                from: r.request().postDataJSON().startDate,
              })),
            }
          : plan,
      },
    });
  });
  const count = () => requests;
  count.payloads = payloads;
  return count;
}
test("unconfigured AI is honest and manual builder remains usable", async ({
  page,
}) => {
  await open(page);
  await expect(page.locator("#aiStatus")).toContainText("not configured");
  await expect(page.locator("#aiSend")).toBeDisabled();
  await page.locator("#aiManual").click();
  await expect(page.locator("#routineBuilder")).toBeVisible();
});
test("AI request needs consent; proposal writes only after explicit reviewed confirmation", async ({
  page,
}) => {
  const count = await mocks(page);
  await open(page);
  await expect(page.locator("#aiSend")).toBeEnabled();
  await page.locator("#aiSend").click();
  await expect(page.locator("#aiStatus")).toContainText("consent");
  expect(count()).toBe(0);
  const before = await page.evaluate(() =>
    localStorage.getItem("girly-skincare-v1"),
  );
  await page.locator("#aiConsent").check();
  await expect(page.locator("#aiStatus")).toContainText(
    "Verification complete",
  );
  await page.locator("#aiSend").click();
  await expect(page.locator("#aiPreview")).toContainText(
    "Synthetic test proposal",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("girly-skincare-v1")),
  ).toBe(before);
  await expect(page.locator("#aiSave")).toBeDisabled();
  await page
    .locator('[data-ai-row] [data-field="name"]')
    .fill("Edited test cream");
  await page.locator("#aiReview").check();
  await page.locator("#aiSave").click();
  await expect(page.locator("#aiDialog")).not.toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("girly-skincare-v1")).customItems[0]
          .name,
    ),
  ).toContain("Edited test cream");
  expect(count()).toBe(1);
});
test("malformed AI response is rejected without calendar mutation", async ({
  page,
}) => {
  await mocks(page, { summary: "not a valid schema" });
  await open(page);
  await expect(page.locator("#aiSend")).toBeEnabled();
  await page.locator("#aiConsent").check();
  await expect(page.locator("#aiStatus")).toContainText(
    "Verification complete",
  );
  await page.locator("#aiSend").click();
  await expect(page.locator("#aiStatus")).toContainText("schema");
  await expect(page.locator("#aiSave")).toBeDisabled();
  expect(
    await page.evaluate(() => localStorage.getItem("girly-skincare-v1")),
  ).toBeNull();
});
test("red-flag symptoms pause requests; local overlap check is labeled rule-based", async ({
  page,
}) => {
  const count = await mocks(page);
  await open(page);
  await expect(page.locator("#aiSend")).toBeEnabled();
  await page.locator("#aiActives").fill("Retinol, Glycolic Acid");
  await expect(page.locator("#aiLocal")).toContainText(
    "may increase irritation",
  );
  await page.locator("#aiAlarm").check();
  await expect(page.locator("#aiMedical")).toBeVisible();
  await page.locator("#aiSend").click();
  expect(count()).toBe(0);
});
test("AI server limit is visible and no retry is made", async ({ page }) => {
  const count = await mocks(page, {}, 429);
  await open(page);
  await expect(page.locator("#aiSend")).toBeEnabled();
  await page.locator("#aiConsent").check();
  await expect(page.locator("#aiStatus")).toContainText(
    "Verification complete",
  );
  await page.locator("#aiSend").click();
  await expect(page.locator("#aiStatus")).toContainText("limit reached");
  expect(count()).toBe(1);
  await expect(page.locator("#aiSave")).toBeDisabled();
});
for (const theme of ["light", "dark"])
  test(`AI panel mobile accessibility ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto("/");
    await setTheme(page, theme);
    await page.locator("#aiLauncher").click();
    await expect(page.locator("#aiStatus")).toContainText("not configured");
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
test("copying current care excludes private journal data and does not save the proposed plan", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("ai-privacy-seed")) {
      localStorage.setItem("ai-privacy-seed", "1");
      localStorage.setItem(
        "girly-skincare-v1",
        JSON.stringify({
          start: "2026-01-01",
          checks: {},
          customItems: [],
          moods: { "2026-01-01": { note: "PRIVATE_JOURNAL_SENTINEL" } },
        }),
      );
    }
  });
  const count = await mocks(page);
  await open(page);
  await expect(page.locator("#aiSend")).toBeEnabled();
  const before = await page.evaluate(() =>
    localStorage.getItem("girly-skincare-v1"),
  );
  await page.locator("#aiCopySchedule").click();
  await expect(page.locator("#aiMorning")).toHaveValue(/SPF/);
  await page.locator("#aiConsent").check();
  await expect(page.locator("#aiStatus")).toContainText(
    "Verification complete",
  );
  await page.locator("#aiSend").click();
  await expect(page.locator("#aiPreview")).toContainText(
    "Synthetic test proposal",
  );
  expect(JSON.stringify(count.payloads)).not.toContain(
    "PRIVATE_JOURNAL_SENTINEL",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("girly-skincare-v1")),
  ).toBe(before);
});
