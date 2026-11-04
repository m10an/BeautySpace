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
