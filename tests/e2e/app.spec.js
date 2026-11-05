import { goTo, setTheme, openAdvanced } from "./navigation.js";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
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
  "ipl",
  "settings",
  "ingredients",
  "products",
];
async function tab(page, name) {
  await goTo(page, name);
  await expect(page.locator(`#${name}`)).toBeVisible();
}
async function ready(page) {
  await page.goto("/");
  await expect(page.locator("#inciAnalyze")).toBeEnabled();
  await goTo(page, "calendar");
}
for (const width of [320, 375, 390, 430, 768, 1024, 1440])
  for (const theme of ["light", "dark"])
    test(`layout ${width}px ${theme}: all sections, long INCI`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await ready(page);
      await setTheme(page, theme);
      for (const section of sections) {
        await tab(page, section);
        if (section === "ingredients") {
          await page
            .locator("#inciInput")
            .fill(
              "Aqua, " +
                "VeryLongUnrecognizedIngredient".repeat(8) +
                ", Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine",
            );
          await page.locator("#inciAnalyze").click();
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${section} overflows`,
        ).toBeTruthy();
      }
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({
        path: testInfo.outputPath(`products-${width}-${theme}.png`),
        fullPage: true,
      });
      await tab(page, "ingredients");
      await page.screenshot({
        path: testInfo.outputPath(`ingredients-${width}-${theme}.png`),
        fullPage: true,
      });
    });
for (const width of [390, 1440])
  for (const theme of ["light", "dark"])
    test(`WCAG automated ${width}px ${theme}: all sections`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await ready(page);
      await setTheme(page, theme);
      for (const section of sections) {
        await tab(page, section);
        if (section === "ingredients") {
          await page.locator("#inciInput").fill("Aqua, Parfum");
          await page.locator("#inciAnalyze").click();
        }
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(results.violations, section).toEqual([]);
      }
    });
test("skin procedure CRUD, date selection and completion survive reload", async ({
  page,
}) => {
  await ready(page);
  await tab(page, "ritual");
  await page.locator("#dayPicker").fill("2027-02-28");
  await page.locator("#dayPicker").dispatchEvent("change");
  await openAdvanced(page);
  await page.locator("#customName").fill("<img src=x onerror=alert(1)> Mask");
  await page.locator("#customMode").selectOption("daily");
  await page.locator("#customFrom").fill("2027-02-01");
  await page.locator("#addCustom").click();
  await expect(page.locator("#customList")).toContainText("<img");
  await expect(page.locator("#customList img")).toHaveCount(0);
  await page.locator("#customList [data-edit]").click();
  await openAdvanced(page);
  await page.locator("#customName").fill("Evening mask");
  await page.locator("#addCustom").click();
  await page
    .locator("#todayRoutine label")
    .filter({ hasText: "Evening mask" })
    .locator("input")
    .check();
  await page.reload();
  await tab(page, "ritual");
  await page.locator("#dayPicker").fill("2027-02-28");
  await page.locator("#dayPicker").dispatchEvent("change");
  await expect(
    page
      .locator("#todayRoutine label")
      .filter({ hasText: "Evening mask" })
      .locator("input"),
  ).toBeChecked();
  page.on("dialog", (d) => d.accept());
  await page.locator("#customList [data-remove]").click();
  await expect(page.locator("#todayRoutine")).not.toContainText("Evening mask");
});
test("hair procedures can be edited, completed and deleted", async ({
  page,
}) => {
  await ready(page);
  await tab(page, "hair");
  await page.locator("#hairName").fill("Hair mask");
  await page.locator("#hairAdd").click();
  await page.locator("[data-hairedit]").click();
  await page.locator("#hairName").fill("New hair mask");
  await page.locator("#hairAdd").click();
  await page.locator("#hairTasks input").check();
  await page.reload();
  await tab(page, "hair");
  await expect(page.locator("#hairTasks input")).toBeChecked();
  page.on("dialog", (d) => d.accept());
  await page.locator("[data-hairremove]").click();
  await expect(page.locator("#hairProducts")).toBeEmpty();
});
test("product collection CRUD, photo, search and analysis persist", async ({
  page,
}) => {
  await ready(page);
  await tab(page, "products");
  await page.locator("#productName").fill("Barrier cream");
  await page.locator("#productBrand").fill("My brand");
  await page.locator("#productInci").fill("Aqua, Glycerin, Parfum");
  await page.locator("#productPhoto").setInputFiles("skin-editorial.jpg");
  await page.locator("#productSave").click();
  await expect(page.locator("#productFormStatus")).toContainText(
    "Product saved",
  );
  await expect(page.locator(".product-photo")).toBeVisible();
  await page.locator(".product-card summary").click();
  await expect(page.locator(".product-analysis")).toContainText("3 of 3");
  await expect(page.locator(".product-analysis")).toContainText(
    "not established",
  );
  await page.reload();
  await tab(page, "products");
  await expect(page.locator(".product-card")).toContainText("Barrier cream");
  await page.locator("#productSearch").fill("  MY   BRAND  ");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.locator("#productSearch").fill("absent");
  await expect(page.locator("#productList")).toContainText("No saved products");
  await page.locator("#productSearch").fill("");
  await page
    .locator(".product-card button")
    .filter({ hasText: "Edit" })
    .click();
  await page.locator("#productName").fill("Edited cream");
  await page.locator("#productRemovePhoto").check();
  await page.locator("#productSave").click();
  await expect(page.locator(".product-photo")).toHaveCount(0);
  await expect(page.locator(".product-card")).toContainText("Edited cream");
  page.on("dialog", (d) => d.accept());
  await page
    .locator(".product-card button")
    .filter({ hasText: "Delete" })
    .click();
  await expect(page.locator(".product-card")).toHaveCount(0);
});
test("ingredient search synonyms, partials, unknown state and XSS", async ({
  page,
}) => {
  await ready(page);
  await tab(page, "ingredients");
  await page.locator("#inciInput").fill("  wAtEr  ");
  await expect(page.locator("#ingredientMatches")).toContainText("Aqua");
  await page.locator("#inciInput").fill("hyaluron");
  await expect(page.locator("#ingredientMatches")).toContainText("Hyaluron");
  await page.locator("#inciInput").fill("<img src=x onerror=alert(1)>");
  await expect(page.locator("#ingredientStatus")).toContainText(
    "No ingredients",
  );
  await page.locator("#inciInput").fill("<img src=x onerror=alert(1)>, Parfum");
  await page.locator("#inciAnalyze").click();
  await expect(page.locator("#inciResults img")).toHaveCount(0);
  await expect(page.locator("#inciResults")).toContainText("1 of 2");
  await expect(page.locator("#inciResults")).toContainText("not established");
});
test("old skincare, hair and reflection keys survive upgrade", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (localStorage.getItem("seeded")) return;
    localStorage.setItem("seeded", "1");
    localStorage.setItem(
      "girly-skincare-v1",
      JSON.stringify({
        start: "2026-01-01",
        checks: { "2026-01-01|spf": true },
        customItems: [
          {
            id: "c-old",
            name: "Legacy step",
            time: "pm",
            mode: "daily",
            weekdays: [],
            from: "2026-01-01",
            until: "",
            once: "",
          },
        ],
        moods: { "2026-01-01": { note: "Legacy mood" } },
      }),
    );
    localStorage.setItem(
      "beautycalendar-hair-v1",
      JSON.stringify({
        items: [
          {
            id: "hair-old",
            name: "Legacy hair",
            time: "pm",
            freq: "daily",
            date: "2026-01-01",
            days: [],
          },
        ],
        checks: {},
      }),
    );
    localStorage.setItem(
      "beautyjournal-private-prompts-v1",
      JSON.stringify([
        {
          date: "1/1/2026",
          prompt: "Legacy question",
          answer: "Legacy reflection",
        },
      ]),
    );
  });
  await ready(page);
  await expect(page.locator("#selectedRoutine")).toContainText("Legacy step");
  await tab(page, "hair");
  await expect(page.locator("#hairProducts")).toContainText("Legacy hair");
  await tab(page, "prompts");
  await expect(page.locator("#promptEntries")).toContainText(
    "Legacy reflection",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("girly-skincare-v1")).checks[
            "2026-01-01|spf"
          ],
      ),
    )
    .toBe(true);
});
test("backup export includes all stores; valid restore and invalid rejection", async ({
  page,
}) => {
  await ready(page);
  await tab(page, "products");
  await page.locator("#productName").fill("Backup product");
  await page.locator("#productSave").click();
  await expect(page.locator("#productFormStatus")).toContainText(
    "Product saved",
  );
  await tab(page, "prompts");
  await page.locator("#promptAnswer").fill("Backup reflection");
  await page.locator("#savePromptEntry").click();
  await tab(page, "settings");
  page.on("dialog", (d) => d.accept());
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#exportBtn").click();
  const download = await downloadPromise;
  const data = JSON.parse(readFileSync(await download.path(), "utf8"));
  expect(data.version).toBe(4);
  expect(data.products[0].name).toBe("Backup product");
  expect(data.prompts[0].answer).toBe("Backup reflection");
  expect(data.hair).toBeTruthy();
  data.products[0].name = "Restored product";
  await page.locator("#importFile").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await expect(page.locator("#menuToggle")).toBeVisible();
  await tab(page, "products");
  await expect(page.locator(".product-card")).toContainText("Restored product");
  await tab(page, "settings");
  await page.locator("#importFile").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"start":"2026-02-30","checks":{}}'),
  });
  await expect(page.locator("#appStatus")).toContainText("not restored");
});
test("keyboard skip link, focus and theme persistence", async ({ page }) => {
  // Test a fresh arrival, before menu navigation intentionally focuses main.
  await page.goto("/");
  await expect(page.locator("#home")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await setTheme(page, "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
test("offline PWA shell includes modules and ingredient data", async ({
  page,
  context,
}) => {
  await ready(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#monthGrid button")).toHaveCount(
    new Date().getDate()
      ? new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          0,
        ).getDate()
      : 30,
  );
  await tab(page, "ingredients");
  await expect(page.locator("#inciAnalyze")).toBeEnabled();
  await page.locator("#inciInput").fill("Aqua, Glycerin");
  await page.locator("#inciAnalyze").click();
  await expect(page.locator("#inciResults")).toContainText("2 of 2");
  await tab(page, "products");
  await page.locator("#productName").fill("Offline cream");
  await page.locator("#productSave").click();
  await expect(page.locator("#productFormStatus")).toContainText(
    "Product saved",
  );
});
test("unavailable reference is explicit and disables analysis", async ({
  browser,
}) => {
  const context = await browser.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  await page.route("**/ingredients-db.json", (route) => route.abort());
  await page.goto("/");
  await tab(page, "ingredients");
  await expect(page.locator("#inciAnalyze")).toBeDisabled();
  await expect(page.locator("#ingredientStatus")).toContainText("unavailable");
  await context.close();
});
test("failed storage write never reports a saved product", async ({ page }) => {
  await ready(page);
  await tab(page, "products");
  await expect(page.locator("#productCount")).toContainText("0 of 0");
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = function () {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await page.locator("#productName").fill("Unsaved cream");
  await page.locator("#productSave").click();
  await expect(page.locator("#productFormStatus")).toContainText(
    "Could not save",
  );
  await expect(page.locator(".product-card")).toHaveCount(0);
});
test("no runtime JavaScript errors while switching sections", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  for (const name of sections) await tab(page, name);
  expect(errors).toEqual([]);
});

for (const timezoneId of ["Pacific/Kiritimati", "America/Los_Angeles"])
  test(`calendar day is local in ${timezoneId}`, async ({ browser }) => {
    const context = await browser.newContext({ timezoneId });
    const page = await context.newPage();
    await ready(page);
    const local = await page.evaluate(() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });
    await tab(page, "ritual");
    await expect(page.locator("#dayPicker")).toHaveValue(local);
    await context.close();
  });
test("routine completion preserves keyboard focus", async ({ page }) => {
  await ready(page);
  const input = page.locator("#selectedRoutine input").first();
  await input.focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#selectedRoutine input").first()).toBeChecked();
  await expect(page.locator("#selectedRoutine input").first()).toBeFocused();
});
test("one-off skin care can be scheduled before the recurring start date", async ({
  page,
}) => {
  await ready(page);
  await tab(page, "ritual");
  await openAdvanced(page);
  await page.locator("#customName").fill("One-off care");
  await page.locator("#customMode").selectOption("once");
  await page.locator("#customOnce").fill("2025-12-31");
  await page.locator("#addCustom").click();
  await page.locator("#dayPicker").fill("2025-12-31");
  await page.locator("#dayPicker").dispatchEvent("change");
  await expect(page.locator("#todayRoutine")).toContainText("One-off care");
});
test("progress photos are included in full backups", async ({ page }) => {
  await ready(page);
  await tab(page, "journal");
  await page.locator("#photoInput").setInputFiles("skin-editorial.jpg");
  await expect(page.locator("#photoGallery img")).toHaveCount(1);
  await page.reload();
  await tab(page, "journal");
  await expect(page.locator("#photoGallery img")).toHaveCount(1);
  await tab(page, "settings");
  page.on("dialog", (d) => d.accept());
  const pending = page.waitForEvent("download");
  await page.locator("#exportBtn").click();
  const download = await pending;
  const archive = JSON.parse(readFileSync(await download.path(), "utf8"));
  expect(archive.photos).toHaveLength(1);
  expect(archive.photos[0].data).toMatch(/^data:image\/jpeg;base64,/);
});
test("production artifact works under a GitHub Pages subpath", async ({
  page,
  context,
}) => {
  await page.goto("/dist/");
  await expect(page.locator("#inciAnalyze")).toBeEnabled();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await tab(page, "ingredients");
  await page.locator("#inciInput").fill("Aqua");
  await page.locator("#inciAnalyze").click();
  await expect(page.locator("#inciResults")).toContainText("1 of 1");
});

test("corrupt saved stores remain intact when edits are attempted", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (localStorage.getItem("corrupt-seeded")) return;
    localStorage.setItem("corrupt-seeded", "1");
    for (const key of [
      "girly-skincare-v1",
      "beautycalendar-hair-v1",
      "beautyjournal-private-prompts-v1",
    ])
      localStorage.setItem(key, "{broken");
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.accept());
  await ready(page);
  await tab(page, "ritual");
  await openAdvanced(page);
  await page.locator("#customName").fill("Do not overwrite");
  await page.locator("#customMode").selectOption("daily");
  await page.locator("#addCustom").click();
  await tab(page, "hair");
  await page.locator("#hairName").fill("Do not overwrite");
  await page.locator("#hairAdd").click();
  await tab(page, "prompts");
  await page.locator("#promptAnswer").fill("Do not overwrite");
  await page.locator("#savePromptEntry").click();
  for (const key of [
    "girly-skincare-v1",
    "beautycalendar-hair-v1",
    "beautyjournal-private-prompts-v1",
  ])
    expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(
      "{broken",
    );
  expect(errors).toEqual([]);
});
test("failed routine storage write restores unchecked state", async ({
  page,
}) => {
  await ready(page);
  page.on("dialog", (d) => d.accept());
  await page.evaluate(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await page.locator("#selectedRoutine input").first().click();
  await expect(
    page.locator("#selectedRoutine input").first(),
  ).not.toBeChecked();
});
