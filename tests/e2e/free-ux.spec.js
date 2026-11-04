import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { goTo } from "./navigation.js";
test("Help is always available, has all real topics, closes with Escape and restores focus", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#helpButton").click();
  for (let i = 1; i <= 7; i++) {
    await expect(page.locator("#helpProgress")).toHaveText(`Step ${i} of 7`);
    if (i < 7) await page.locator("#helpNext").click();
  }
  await expect(page.locator("#helpContent")).toContainText("separate archive");
  await page.locator("#helpPrevious").click();
  await expect(page.locator("#helpTitle")).toHaveText("IPL tracker");
  await page.keyboard.press("Escape");
  await expect(page.locator("#helpButton")).toBeFocused();
  await goTo(page, "products");
  await page.locator("#helpButton").click();
  await expect(page.locator("#helpProgress")).toHaveText("Step 1 of 7");
  await page.locator("#helpSkip").click();
  await expect(page.locator("#helpDialog")).not.toBeVisible();
});
test("brand returns home from every section, including the consultant, without changing data", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("keep-sentinel", "private"));
  for (const screen of [
    "hair",
    "ritual",
    "journal",
    "insights",
    "inspiration",
    "prompts",
    "products",
    "ingredients",
    "ipl",
    "settings",
  ]) {
    await goTo(page, screen);
    await page.locator("#homeLink").click();
    await expect(page.locator("#calendar")).toBeVisible();
  }
  await page.locator("#aiLauncher").click();
  await page.locator("#aiDialog [data-home]").click();
  await expect(page.locator("#aiDialog")).not.toBeVisible();
  await expect(page.locator("#calendar")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("keep-sentinel"))).toBe(
    "private",
  );
});
test("free consultant works offline without requests, previews edits and confirms calendar append", async ({
  page,
  context,
}) => {
  const requests = [];
  page.on("request", (r) => {
    if (/openai|cloudflare|runtime-config/.test(r.url()))
      requests.push(r.url());
  });
  await page.goto("/");
  await page.locator("#aiLauncher").click();
  await expect(page.locator("#aiStatus")).toContainText("Free local");
  await context.setOffline(true);
  await page.locator("#aiMoisturizer").fill("My existing cream");
  await page.locator("#aiSend").click();
  await expect(page.locator("#aiPreview")).toContainText(
    "Free local routine draft",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("girly-skincare-v1")),
  ).toBeNull();
  await page
    .locator('[data-ai-row="0"] [data-field="name"]')
    .fill("My edited cleanser");
  await page.locator("#aiReview").check();
  await page.locator("#aiSave").click();
  await expect(page.locator("#aiDialog")).not.toBeVisible();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("girly-skincare-v1")),
  );
  expect(state.customItems).toHaveLength(4);
  expect(state.customItems[0].name).toContain("My edited cleanser");
  expect(requests).toEqual([]);
});
test("required and whitespace-only fields produce inline errors, retain values and focus the field", async ({
  page,
}) => {
  await page.goto("/");
  await goTo(page, "products");
  await page.locator("#productName").fill("   ");
  await page.locator("#productSave").click();
  await expect(page.locator("#productName")).toBeFocused();
  await expect(page.locator("#productName-error")).toContainText("required");
  await expect(page.locator("#productName")).toHaveValue("   ");
  await expect(page.locator("#productName")).toHaveAttribute(
    "aria-required",
    "true",
  );
  await expect(
    page.locator("label").filter({ has: page.locator("#productName") }),
  ).toContainText("*");
  await page.locator("#aiLauncher").click();
  await page.locator("#aiStart").fill("");
  await page.locator("#aiSend").click();
  await expect(page.locator("#aiStart")).toBeFocused();
  await expect(page.locator("#aiPreview")).toBeEmpty();
});
test("medical symptoms pause free planning and recommendations cannot be saved", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#aiLauncher").click();
  await page.locator("#aiAlarm").check();
  await page.locator("#aiSend").click();
  await expect(page.locator("#aiPreview")).toContainText("medical");
  await expect(page.locator("#aiSave")).toBeDisabled();
  expect(
    await page.evaluate(() => localStorage.getItem("girly-skincare-v1")),
  ).toBeNull();
});
test("mobile consultant has one scroll container and stable heading through keyboard-sized viewport changes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => scrollTo(0, 300));
  await page.locator("#aiLauncher").click();
  await expect(page.locator("#aiStatus")).toContainText("Free local");
  const before = await page.locator("#aiDialog .tool-heading").boundingBox();
  await page.locator("#aiContent").evaluate((el) => (el.scrollTop = 700));
  const after = await page.locator("#aiDialog .tool-heading").boundingBox();
  expect(after.y).toBeCloseTo(before.y, 0);
  expect(await page.locator("#aiDialog").evaluate((el) => el.scrollTop)).toBe(
    0,
  );
  await page.setViewportSize({ width: 390, height: 440 });
  await page.locator("#aiPreferences").focus();
  await expect
    .poll(() =>
      page
        .locator("#aiDialog")
        .evaluate((el) => el.getBoundingClientRect().bottom <= innerHeight),
    )
    .toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.keyboard.press("Escape");
  await expect(page.locator("html")).not.toHaveClass(/tool-open/);
});
test("inspirations display exclusively the approved dataset or a truthful empty state", async ({
  page,
}) => {
  const data = JSON.parse(readFileSync("inspiration.json"));
  await page.goto("/");
  await goTo(page, "inspiration");
  if (!data.quotes.length) {
    await expect(page.locator("#inspirationStatus")).toContainText(
      "No approved PDF",
    );
    await expect(page.locator("#inspirationQuote")).toBeEmpty();
    await expect(page.locator("#copyInspiration")).toBeDisabled();
  } else {
    const text = await page.locator("#inspirationQuote").textContent();
    expect(data.quotes.some((q) => q.text === text)).toBe(true);
  }
  await expect(page.locator("#nextInspiration,#quoteCategory")).toHaveCount(0);
});

test("every editable field has an accessible label and text fields have explicit length bounds", async ({
  page,
}) => {
  await page.goto("/");
  const missing = await page
    .locator("input,textarea,select")
    .evaluateAll((els) =>
      els
        .filter((e) => e.type !== "hidden")
        .flatMap((e) => {
          const issues = [];
          if (
            !(
              e.labels?.length ||
              e.getAttribute("aria-label") ||
              e.getAttribute("aria-labelledby")
            )
          )
            issues.push(e.id + ": missing label");
          if (["text", "textarea"].includes(e.type) && e.maxLength < 0)
            issues.push(e.id + ": no text length bound");
          return issues;
        }),
    );
  expect(missing).toEqual([]);
});
test("free guide rejects a second overlapping calendar addition and does not replace existing care", async ({
  page,
}) => {
  await page.goto("/");
  for (let i = 0; i < 2; i++) {
    await page.locator("#aiLauncher").click();
    await page.locator("#aiSend").click();
    await expect(page.locator("#aiPreview")).toContainText("Free local");
    await page.locator("#aiReview").check();
    await page.locator("#aiSave").click();
    if (i === 0) await expect(page.locator("#aiDialog")).not.toBeVisible();
  }
  await expect(page.locator("#aiStatus")).toContainText("already exists");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("girly-skincare-v1")).customItems
          .length,
    ),
  ).toBe(4);
});
test("free guide refuses to turn a named active treatment into a daily moisturizer schedule", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#aiLauncher").click();
  await page.locator("#aiMoisturizer").fill("Retinol cream");
  await page.locator("#aiSend").click();
  await expect(page.locator("#aiMoisturizer-error")).toContainText(
    "active treatment",
  );
  await expect(page.locator("#aiMoisturizer")).toBeFocused();
  await expect(page.locator("#aiPreview")).toBeEmpty();
});
