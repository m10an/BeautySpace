import { visualDifference } from "./visual.js";
import { goTo, setTheme } from "./navigation.js";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync, existsSync } from "node:fs";
const fixture = JSON.parse(
  readFileSync(
    new URL("../fixtures/supplied-ingredients-v2.json", import.meta.url),
  ),
);
const tabs = [
  "calendar",
  "hair",
  "ritual",
  "journal",
  "insights",
  "inspiration",
  "prompts",
  "settings",
  "ingredients",
  "products",
];
async function prepare(page) {
  await page.clock.setFixedTime(new Date("2026-11-03T12:00:00Z"));
  await page.route(
    /https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)\//,
    (r) => r.abort(),
  );
  await page.route("**/ingredients-db.json", (r) =>
    r.fulfill({ json: fixture }),
  );
  await page.goto("/");
  await expect(page.locator("#inciAnalyze")).toBeEnabled();
  await goTo(page, "ingredients");
  await page.evaluate(() => document.fonts.ready);
}
async function analyze(page, input) {
  await page.locator("#inciInput").fill(input);
  await page.locator("#inciAnalyze").click();
}
test.describe("Supplied scenarios adapted to v2", () => {
  test.use({
    serviceWorkers: "block",
    reducedMotion: "reduce",
    locale: "en-US",
    timezoneId: "UTC",
    colorScheme: "light",
  });
  test.beforeEach(async ({ page }) => prepare(page));
  for (const [name, input, counts, width] of [
    [
      "one third recognized",
      "Aqua, Unknown One, Unknown Two",
      "1 of 3",
      33.33333333333333,
    ],
    [
      "two thirds recognized",
      "Aqua, Parfum, Unknown",
      "2 of 3",
      66.66666666666666,
    ],
    [
      "unknown counted in denominator",
      "Aqua, Parfum, Mystery",
      "2 of 3",
      66.66666666666666,
    ],
    ["all unknown", "Unlisted product", "0 of 1", 0],
    [
      "all fragrances recognized, zero verified ratings",
      "Parfum, Limonene",
      "2 of 2",
      100,
    ],
  ])
    test(`coverage chart: ${name}`, async ({ page }) => {
      await analyze(page, input);
      await expect(page.locator("#inciResults")).toContainText(counts);
      await expect(page.locator("#inciResults")).toContainText(
        "Comedogenicity: not established",
      );
      const fill = page.locator(".coverage-track span"),
        track = page.locator(".coverage-track");
      expect(
        await fill.evaluate((el) => parseFloat(el.style.width)),
      ).toBeCloseTo(width, 4); // CSSOM serializes percentages to ~6 significant digits.
      const fillBox = await fill.boundingBox(),
        trackBox = await track.boundingBox();
      // Account for the track's two 1px borders. Counts and geometric widths agree.
      expect(
        Math.abs(fillBox.width - ((trackBox.width - 2) * width) / 100),
      ).toBeLessThanOrEqual(1);
    });
  test("aliases, numbering, separators, clear and empty inputs", async ({
    page,
  }) => {
    await analyze(page, "Ingredients: 1. WATER;2) Fragrance\n3. nIaCiNaMiDe.");
    await expect(page.locator("#inciResults")).toContainText("3 of 3");
    await page.locator("#inciClear").click();
    await expect(page.locator("#inciInput")).toHaveValue("");
    await expect(page.locator("#inciResults")).toBeHidden();
    await expect(page.locator("#inciInput")).toBeFocused();
    for (const text of ["", " ;,\n ", "Ingredients:"]) {
      await analyze(page, text);
      await expect(page.locator("#inciResults")).toHaveText(
        "Paste an INCI list to begin.",
      );
    }
  });
  test("200 accepted; 201 rejected without silently excluding a fragrance", async ({
    page,
  }) => {
    await analyze(page, Array(200).fill("Aqua").join(","));
    await expect(page.locator(".inci-item")).toHaveCount(200);
    await analyze(page, Array(200).fill("Aqua").concat("Parfum").join(","));
    await expect(page.locator("#inciResults")).toHaveText(
      "Use up to 200 ingredients.",
    );
    await expect(page.locator(".inci-item")).toHaveCount(0);
  });
  test("settings, moods, hair and reflections retain unrelated storage", async ({
    page,
  }) => {
    await page.evaluate(() => localStorage.setItem("qa-unrelated", "keep-me"));
    page.on("dialog", (d) => d.accept());
    await goTo(page, "settings");
    await page.locator("#startDate").fill("2026-10-01");
    await page.locator("#useNia").uncheck();
    await page.locator("#saveSettings").click();
    await goTo(page, "journal");
    await page.locator("#inflamed").selectOption("2");
    await page.locator("#moodNote").fill("Supplied scenario mood");
    await page.locator("#saveMood").click();
    await goTo(page, "hair");
    await page.locator("#hairName").fill("Supplied scenario mask");
    await page.locator("#hairAdd").click();
    await goTo(page, "prompts");
    await page.locator("#promptAnswer").fill("Supplied scenario reflection");
    await page.locator("#savePromptEntry").click();
    const before = await page.evaluate(() => ({ ...localStorage }));
    await page.reload();
    expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(before);
    await goTo(page, "settings");
    await expect(page.locator("#startDate")).toHaveValue("2026-10-01");
    await expect(page.locator("#useNia")).not.toBeChecked();
    await goTo(page, "journal");
    await expect(page.locator("#inflamed")).toHaveValue("2");
    await expect(page.locator("#moodNote")).toHaveValue(
      "Supplied scenario mood",
    );
    await goTo(page, "hair");
    await expect(page.locator("#hairProducts")).toContainText(
      "Supplied scenario mask",
    );
    await goTo(page, "prompts");
    await expect(page.locator("#promptEntries")).toContainText(
      "Supplied scenario reflection",
    );
  });
  test("delayed reference cannot produce a premature zero-match report", async ({
    page,
  }) => {
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    let intercepted;
    const arrived = new Promise((resolve) => (intercepted = resolve));
    await page.route("**/ingredients-db.json", async (route) => {
      intercepted();
      await gate;
      await route.fulfill({ json: fixture });
    });
    try {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await arrived;
      await goTo(page, "ingredients");
      await page.locator("#inciInput").fill("Aqua");
      await expect(page.locator("#inciAnalyze")).toBeDisabled();
      await expect(page.locator("#inciResults")).toBeHidden();
    } finally {
      release();
    }
    await expect(page.locator("#inciAnalyze")).toBeEnabled();
    await page.locator("#inciAnalyze").click();
    await expect(page.locator("#inciResults")).toContainText("1 of 1");
  });
  test("font stylesheet is declared in head and fallbacks remain valid offline", async ({
    page,
  }) => {
    const fonts = page.locator(
      'head link[rel="stylesheet"][href*="fonts.googleapis.com"]',
    );
    await expect(fonts).toHaveCount(1);
    expect(await fonts.getAttribute("href")).toContain("GFS+Didot");
    expect(
      await page
        .locator("body")
        .evaluate((el) => getComputedStyle(el).fontFamily),
    ).toContain("system-ui");
    expect(
      await page
        .locator(".ingredient-hero h2")
        .evaluate((el) => getComputedStyle(el).fontFamily),
    ).toContain("GFS Didot");
    expect(
      await page.evaluate(() =>
        [...document.styleSheets].flatMap((sheet) => {
          try {
            return [...sheet.cssRules]
              .filter((rule) => rule.type === CSSRule.IMPORT_RULE)
              .map((rule) => rule.href);
          } catch {
            return [];
          }
        }),
      ),
    ).toEqual([]);
  });
  for (const width of [320, 390, 768, 1440])
    test.describe(`${width}px`, () => {
      test.use({
        viewport: { width, height: width < 500 ? 844 : 1024 },
        isMobile: width < 500,
        hasTouch: width < 500,
      });
      test("@audit geometry: viewport, centering, seven columns and no control overlaps", async ({
        page,
      }, info) => {
        const findings = [];
        for (const theme of ["light", "dark"]) {
          await setTheme(page, theme);
          for (const tab of tabs) {
            await goTo(page, tab);
            if (tab === "ingredients")
              await analyze(
                page,
                "Aqua, Parfum, " + "VeryLongUnknownIngredient".repeat(12),
              );
            const errors = await page.evaluate((tab) => {
              const errors = [],
                width = document.documentElement.clientWidth,
                app = document.querySelector(".app").getBoundingClientRect();
              if (document.documentElement.scrollWidth > width + 1)
                errors.push("Horizontal document overflow");
              if (Math.abs(app.left - (width - app.right)) > 1)
                errors.push("App not centered");
              const root = document.getElementById(tab),
                visible = (el) =>
                  el.getClientRects().length &&
                  getComputedStyle(el).visibility !== "hidden";
              for (const el of root.querySelectorAll(
                "button,input,select,textarea,.panel,.inci-item-head,strong",
              )) {
                if (!visible(el)) continue;
                const box = el.getBoundingClientRect();
                if (box.left < -1 || box.right > width + 1)
                  errors.push(
                    `Outside viewport: ${el.id || el.className || el.tagName}`,
                  );
              }
              const controls = [
                ...root.querySelectorAll("button,input,select,textarea"),
              ].filter(visible);
              for (let i = 0; i < controls.length; i++)
                for (let j = i + 1; j < controls.length; j++) {
                  const a = controls[i].getBoundingClientRect(),
                    b = controls[j].getBoundingClientRect();
                  if (
                    Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 &&
                    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2
                  )
                    errors.push(
                      `Overlap: ${controls[i].id} / ${controls[j].id}`,
                    );
                }
              const grid = root.querySelector(".monthgrid,.hair-grid");
              if (
                grid &&
                getComputedStyle(grid).gridTemplateColumns.split(" ").length !==
                  7
              )
                errors.push("Calendar must have seven columns");
              return errors;
            }, tab);
            findings.push(
              ...errors.map((message) => ({ theme, tab, message })),
            );
          }
        }
        await info.attach("layout-findings", {
          body: JSON.stringify(findings, null, 2),
          contentType: "application/json",
        });
        expect(findings).toEqual([]);
      });
      test("@audit axe all screens retains incomplete findings for manual review", async ({
        page,
      }, info) => {
        const reports = [];
        for (const tab of tabs) {
          await goTo(page, tab);
          if (tab === "ingredients") await analyze(page, "Aqua, Parfum");
          const result = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
            .analyze();
          reports.push({
            tab,
            violations: result.violations,
            incomplete: result.incomplete,
          });
        }
        await info.attach("axe-results", {
          body: JSON.stringify(reports, null, 2),
          contentType: "application/json",
        });
        expect(
          reports.flatMap((r) =>
            r.violations.map((v) => ({
              tab: r.tab,
              id: v.id,
              targets: v.nodes.map((n) => n.target),
            })),
          ),
        ).toEqual([]);
      });
      test("@audit repeat-render stability with fonts blocked", async ({
        page,
      }, info) => {
        await page.evaluate(async () => {
          document.activeElement?.blur();
          scrollTo(0, 0);
          await Promise.all(
            [...document.images].map((i) => i.decode().catch(() => {})),
          );
        });
        const options = {
          animations: "disabled",
          caret: "hide",
          fullPage: true,
        };
        const first = await page.screenshot(options);
        await info.attach("first-render", {
          body: first,
          contentType: "image/png",
        });
        await page.evaluate(
          () =>
            new Promise((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(resolve)),
            ),
        );
        const second = await page.screenshot(options);
        await info.attach("current-render", {
          body: second,
          contentType: "image/png",
        });
        const difference = await visualDifference(page, first, second);
        await info.attach("render-pixel-difference", {
          body: JSON.stringify(difference),
          contentType: "application/json",
        });
        expect(difference.sameSize).toBe(true);
        expect(difference.maxChannelDelta).toBeLessThanOrEqual(1);
        expect(difference.changedRatio).toBeLessThanOrEqual(0.0001);
      });
      test("@audit @baseline reviewer-approved visual baseline", async ({
        page,
      }, info) => {
        test.skip(
          !existsSync(info.snapshotPath("ingredients.png")),
          "No reviewer-approved baseline supplied; never generate or approve one automatically.",
        );
        await expect(page).toHaveScreenshot("ingredients.png", {
          animations: "disabled",
          caret: "hide",
          fullPage: true,
        });
      });
    });
});
