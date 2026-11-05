import { visualDifference } from "./visual.js";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { goTo, setTheme } from "./navigation.js";
const sizes = [320, 375, 390, 430, 768, 1024, 1440];
const sections = [
  "home",
  "consultant",
  "calendar",
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
];
async function ready(page) {
  await page.goto("/");
  await expect(page.locator("#themeToggle")).toHaveAttribute(
    "data-theme",
    /light|dark/,
  );
}
for (const width of sizes)
  for (const theme of ["light", "dark"])
    test(`editorial ${width}px ${theme}: Home entry, calendar, menu controls and layout`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 844 });
      await ready(page);
      await setTheme(page, theme);
      await expect(page.locator("#home")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const brand = await page.locator(".home-hero h1").evaluate((heading) => {
        const range = document.createRange();
        const text = [...heading.childNodes].find(
          (node) =>
            node.nodeType === Node.TEXT_NODE &&
            node.textContent.includes("TheBeauty"),
        );
        const start = text.textContent.indexOf("TheBeauty");
        range.setStart(text, start);
        range.setEnd(text, start + "TheBeauty".length);
        const lines = [...range.getClientRects()];
        const box = heading.closest(".home-hero-copy").getBoundingClientRect();
        return {
          lines: lines.length,
          fits: lines.every((r) => r.left >= box.left && r.right <= box.right),
        };
      });
      expect(brand.lines).toBe(1);
      expect(brand.fits).toBe(true);
      await goTo(page, "calendar");
      await expect(page.locator("#calendar")).toBeVisible();
      await expect(page.locator(".screen:visible")).toHaveCount(1);
      await expect(page.locator("#navigationDialog")).not.toBeVisible();
      await expect(page.locator("[data-tab]:visible")).toHaveCount(0);
      await expect(
        page.locator("#themeSelect,.utility-bar,.hero-mark,.editorialhero"),
      ).toHaveCount(0);
      const controls = await page
        .locator(".app-header .icon-button")
        .evaluateAll((nodes) =>
          nodes.map((n) => {
            const r = n.getBoundingClientRect();
            return {
              left: r.left,
              right: r.right,
              width: r.width,
              height: r.height,
            };
          }),
        );
      expect(controls[0].width).toBeGreaterThanOrEqual(44);
      expect(controls[1].height).toBeGreaterThanOrEqual(44);
      expect(controls[0].right).toBeLessThan(controls[1].left);
      if (width < 1100) {
        const labels = await page
          .locator(".mobile-navigation a,.mobile-navigation button")
          .evaluateAll((items) =>
            items.map((item) => {
              const range = document.createRange();
              range.selectNodeContents(item);
              const lines = [...range.getClientRects()];
              const box = item.getBoundingClientRect();
              return {
                width: box.width,
                height: box.height,
                lines: lines.length,
                fits: lines.every(
                  (r) => r.left >= box.left && r.right <= box.right,
                ),
              };
            }),
          );
        for (const label of labels) {
          expect(label.width).toBeGreaterThanOrEqual(44);
          expect(label.height).toBeGreaterThanOrEqual(44);
          expect(label.lines).toBe(1);
          expect(label.fits).toBe(true);
        }
      }
      const views = await page
        .locator(".calendar-toolbar .segmented")
        .boundingBox();
      const edit = await page
        .locator(".calendar-toolbar .text-link")
        .boundingBox();
      expect(views.y).toBe(edit.y);
      expect(views.x + views.width).toBeLessThan(edit.x);
      expect(edit.height).toBeGreaterThanOrEqual(44);
      const calendar = await page.locator("#monthGrid").boundingBox();
      expect(calendar.y).toBeLessThan(400);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: info.outputPath(`calendar-${width}-${theme}.png`),
        animations: "disabled",
      });
      await page.locator("#menuToggle").click();
      await expect(
        page.getByRole("dialog", { name: "The journal." }),
      ).toBeVisible();
      await expect(page.locator("#menuToggle")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      await expect(page.locator("#nav .tab")).toHaveCount(13);
      const menu = page.locator("#navigationDialog");
      await expect(menu).toHaveClass(/is-open/);
      const menuStyle = await menu.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          filter: s.backdropFilter || s.webkitBackdropFilter,
          scroll: el.scrollWidth,
          width: el.clientWidth,
        };
      });
      expect(menuStyle.filter).toContain("blur");
      expect(menuStyle.scroll).toBeLessThanOrEqual(menuStyle.width);
      await page.screenshot({
        path: info.outputPath(`drawer-${width}-${theme}.png`),
        animations: "disabled",
      });
      await page.keyboard.press("Escape");
      await expect(menu).not.toBeVisible();
      await expect(page.locator("#menuToggle")).toBeFocused();
      await page.locator("#menuToggle").click();
      await page.locator("#menuClose").click();
      await expect(menu).not.toBeVisible();
      await page.locator("#menuToggle").click();
      await expect(menu).toHaveClass(/is-open/);
      // Coordinate clicks must wait for the panel transform to settle.
      await expect
        .poll(async () => Math.round((await menu.boundingBox()).x))
        .toBe(0);
      const rect = await menu.boundingBox();
      await page.mouse.click(
        rect.x + rect.width + (width - rect.width) / 2,
        400,
      );
      await expect(menu).not.toBeVisible();
      await expect(page.locator("#menuToggle")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });
test("keyboard focus stays inside modal and every section is reachable", async ({
  page,
}) => {
  await ready(page);
  await page.locator("#menuToggle").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#menuClose")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator('[data-tab="settings"]')).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#menuClose")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#navigationDialog")).not.toBeVisible();
  for (const section of sections) {
    await goTo(page, section);
    await expect(page.locator("main")).toBeFocused();
    await expect(page.locator(`[data-tab="${section}"]`)).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.locator(".screen:visible")).toHaveCount(1);
  }
  await page.reload();
  await expect(page.locator("#home")).toBeVisible();
  await expect(page).toHaveTitle("Home · TheBeauty Journal");
});
for (const theme of ["light", "dark"])
  test(`open drawer WCAG audit ${theme}`, async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await ready(page);
    await setTheme(page, theme);
    await page.locator("#menuToggle").click();
    await expect(page.locator("#navigationDialog")).toHaveClass(/is-open/);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    await info.attach("drawer-axe", {
      body: JSON.stringify({
        violations: result.violations,
        incomplete: result.incomplete,
      }),
      contentType: "application/json",
    });
    expect(result.violations).toEqual([]);
  });
test("theme button remembers choice, supports legacy system setting and has an accessible action", async ({
  browser,
}) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  await page.addInitScript(() => {
    if (!localStorage.getItem("theme-seeded")) {
      localStorage.setItem("theme-seeded", "yes");
      localStorage.setItem("beautycalendar-theme", "system");
    }
  });
  await ready(page);
  await expect(page.locator("#themeToggle")).toHaveAttribute(
    "data-theme",
    "dark",
  );
  await expect(
    page.getByRole("button", { name: "Switch to light theme" }),
  ).toBeVisible();
  await page.locator("#themeToggle").click();
  await expect(page.locator("#themeToggle")).toHaveAttribute(
    "data-theme",
    "light",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(
    await page.evaluate(() => localStorage.getItem("beautycalendar-theme")),
  ).toBe("light");
  await context.close();
});
test("theme remains usable when localStorage writes fail", async ({ page }) => {
  await ready(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException("Storage blocked", "SecurityError");
    };
  });
  await page.locator("#themeToggle").click();
  await expect(page.locator("#appStatus")).toContainText("for this session");
  await expect(page.locator("#themeToggle")).toHaveAttribute(
    "data-theme",
    "dark",
  );
});
test("scroll layers move at different rates; reduced motion resets and disables them", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 390, height: 740 });
  await ready(page);
  await page.evaluate(() => scrollTo(0, 300));
  await expect
    .poll(() =>
      page.evaluate(() =>
        parseFloat(
          document.documentElement.style.getPropertyValue("--depth-near"),
        ),
      ),
    )
    .toBeLessThan(0);
  const offsets = await page.evaluate(() =>
    ["--depth-far", "--depth-near"].map((key) =>
      parseFloat(document.documentElement.style.getPropertyValue(key)),
    ),
  );
  expect(offsets[0]).not.toEqual(offsets[1]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      page.evaluate(() =>
        document.documentElement.style.getPropertyValue("--depth-near"),
      ),
    )
    .toBe("0.00px");
  await page.evaluate(() => scrollTo(0, 500));
  expect(
    await page
      .locator(".ambient-far")
      .evaluate((el) => getComputedStyle(el).transform),
  ).toBe("none");
  await page.locator("#menuToggle").click();
  expect(
    await page
      .locator("#navigationDialog")
      .evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe("0s");
  await page.keyboard.press("Escape");
  await expect(page.locator("#navigationDialog")).not.toBeVisible();
});
test("drawer locks background scroll and closing restores the original position", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 740 });
  await ready(page);
  await page.evaluate(() => scrollTo(0, 360));
  const before = await page.evaluate(() => scrollY);
  const trigger = await page.locator("#menuToggle").boundingBox();
  await page.mouse.click(
    trigger.x + trigger.width / 2,
    trigger.y + trigger.height / 2,
  );
  await expect(page.locator("html")).toHaveClass(/menu-open/);
  const top = await page
    .locator("body")
    .evaluate((el) => getComputedStyle(el).top);
  expect(parseFloat(top)).toBe(-before);
  await page.mouse.wheel(0, 500);
  await page.keyboard.press("Escape");
  await expect(page.locator("#navigationDialog")).not.toBeVisible();
  expect(await page.evaluate(() => scrollY)).toBe(before);
});
test("landscape phone keeps every menu destination accessible without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 740, height: 320 });
  await ready(page);
  await goTo(page, "settings");
  await expect(page.locator("#settings")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("visual comparison distinguishes sparse rounding from pixel shifts and palette changes", async ({
  page,
}) => {
  const images = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext("2d");
    const snapshot = () => canvas.toDataURL("image/png").split(",")[1];
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 100, 100);
    const white = snapshot();
    ctx.fillStyle = "rgb(254,255,255)";
    ctx.fillRect(0, 0, 1, 1);
    const sparse = snapshot();
    ctx.fillStyle = "rgb(254,255,255)";
    ctx.fillRect(0, 0, 100, 100);
    const palette = snapshot();
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = "black";
    ctx.fillRect(10, 10, 10, 10);
    const first = snapshot();
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = "black";
    ctx.fillRect(11, 10, 10, 10);
    const shifted = snapshot();
    return { white, sparse, palette, first, shifted };
  });
  const diff = (a, b) =>
    visualDifference(
      page,
      Buffer.from(images[a], "base64"),
      Buffer.from(images[b], "base64"),
    );
  expect(await diff("white", "white")).toMatchObject({
    maxChannelDelta: 0,
    changedRatio: 0,
  });
  expect(await diff("white", "sparse")).toMatchObject({
    maxChannelDelta: 1,
    changedRatio: 0.0001,
  });
  expect((await diff("white", "palette")).changedRatio).toBe(1);
  expect((await diff("first", "shifted")).maxChannelDelta).toBe(255);
});
