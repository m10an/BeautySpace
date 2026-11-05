import { expect } from "@playwright/test";
export async function goTo(page, name) {
  const dialog = page.locator("#navigationDialog");
  if (!(await dialog.isVisible())) await page.locator("#menuToggle").click();
  await page.locator(`[data-tab="${name}"]`).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator(`#${name}`)).toBeVisible();
}
export async function setTheme(page, theme) {
  const current = await page.locator("#themeToggle").getAttribute("data-theme");
  if (current !== theme) await page.locator("#themeToggle").click();
  await expect(page.locator("#themeToggle")).toHaveAttribute(
    "data-theme",
    theme,
  );
}

export async function openAdvanced(page) {
  if (!(await page.locator("#advancedCare").evaluate((el) => el.open)))
    await page.locator("#advancedCare summary").click();
}

// Walk the real interview UI; never bypass hidden stages with DOM mutations.
export async function interviewStep(page, target = 4) {
  await expect(page.locator("#aiProgress")).toContainText("Step ");
  const match = (await page.locator("#aiProgress").textContent()).match(
    /Step (\d)/,
  );
  let current = Number(match[1]) - 1;
  while (current !== target) {
    await page.locator(current < target ? "#aiNext" : "#aiBack").click();
    current += current < target ? 1 : -1;
    await expect(page.locator("#aiProgress")).toContainText(
      `Step ${current + 1} of 5`,
    );
  }
}
