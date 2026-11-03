import { test, expect } from "@playwright/test";
import { goTo } from "./navigation.js";
test("one INCI field recognizes common names from the licensed catalog", async ({
  page,
}) => {
  await page.goto("/");
  await goTo(page, "ingredients");
  await expect(page.locator("#inciAnalyze")).toBeEnabled();
  await expect(page.locator("#ingredients textarea")).toHaveCount(1);
  await expect(page.locator("#ingredientSearch")).toHaveCount(0);
  await page
    .locator("#inciInput")
    .fill("Vaseline, Olive Oil, Grape Seed Oil, 1,2-Hexanediol");
  await page.locator("#inciAnalyze").click();
  await expect(page.locator("#inciResults")).toContainText("4 of 4");
  await expect(page.locator("#inciResults")).toContainText(
    "Недостаточно данных",
  );
  await expect(page.locator(".inci-item")).toHaveCount(4);
  await page.locator("#inciInput").fill("grapeseed");
  await expect(page.locator("#ingredientMatches")).toContainText(
    "vitis vinifera seed oil",
  );
});
test("evidence loading failure never becomes a numeric zero score", async ({
  browser,
}) => {
  const context = await browser.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  await page.route("**/data/comedogenicity.json", (r) =>
    r.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.goto("/");
  await goTo(page, "ingredients");
  await expect(page.locator("#inciAnalyze")).toBeDisabled();
  await expect(page.locator("#inciResults")).toContainText("unavailable");
  await context.close();
});
