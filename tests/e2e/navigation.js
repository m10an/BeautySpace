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
