import { test, expect } from "@playwright/test";
import { settleScreenshotPaint } from "./visual.js";
test("screenshot readiness fails on ongoing geometry changes rather than hiding them", async ({
  page,
}) => {
  await page.setContent(
    '<div id="moving" style="position:fixed;left:10px;top:10px;width:40px;height:40px;background:#000"></div>',
  );
  await page.evaluate(() => {
    let x = 0;
    function move() {
      document.getElementById("moving").style.transform =
        `translateX(${++x}px)`;
      window.motion = requestAnimationFrame(move);
    }
    move();
  });
  try {
    await expect(
      settleScreenshotPaint(
        page,
        { animations: "disabled", caret: "hide", fullPage: true },
        4,
      ),
    ).rejects.toThrow("Page rendering did not settle");
  } finally {
    await page.evaluate(() => cancelAnimationFrame(window.motion));
  }
});

for (const [name, size, allowed] of [
  ["sparse one-level rounding", 1, true],
  ["palette drift", 100, false],
])
  test(`screenshot readiness distinguishes ${name}`, async ({ page }) => {
    await page.setContent(
      `<div id="sample" style="position:fixed;left:10px;top:10px;width:${size}px;height:${size}px;background:rgb(200,200,200)"></div>`,
    );
    let capture = 0;
    const alternating = {
      evaluate: page.evaluate.bind(page),
      screenshot: async (options) => {
        await page.evaluate(
          (value) => {
            document.getElementById("sample").style.backgroundColor =
              `rgb(${value},200,200)`;
          },
          200 + (++capture % 2),
        );
        return page.screenshot(options);
      },
    };
    const ready = settleScreenshotPaint(
      alternating,
      { animations: "disabled", caret: "hide", fullPage: true },
      4,
    );
    if (allowed) await expect(ready).resolves.toBeUndefined();
    else await expect(ready).rejects.toThrow("Page rendering did not settle");
  });
