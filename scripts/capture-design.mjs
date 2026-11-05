// Disposable, reproducible review screenshots; never connects to a live user store.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
const phase = process.argv[2];
if (!["before", "after"].includes(phase)) throw Error("Use before or after");
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--no-sandbox"],
});
const records = [];
const routes = [
  "home",
  "calendar",
  "ritual",
  "products",
  "ingredients",
  "consultant",
  "ipl",
  "journal",
  "hair",
  "insights",
  "inspiration",
  "prompts",
  "settings",
];
const dir = `docs/previews/masterplan/${phase}`;
mkdirSync(dir, { recursive: true });
for (const [device, width, height] of [
  ["desktop", 1440, 1000],
  ["mobile", 390, 844],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "reduce",
    colorScheme: "light",
    timezoneId: "UTC",
  });
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date("2026-11-04T12:00:00Z"));
  await page.goto("http://127.0.0.1:8000/");
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  async function close() {
    for (const d of await page.locator("dialog[open]").all())
      await d.dispatchEvent("beauty:close-dialog");
    await page.keyboard.press("Escape");
  }
  async function route(id) {
    await close();
    const exists = await page.locator(`#${id}.screen`).count();
    if (id === "consultant" && !exists) {
      await page.locator("#aiLauncher").click();
      return "Existing launcher dialog; landing route absent";
    }
    if (!exists) id = "calendar";
    await page.locator("#menuToggle").click();
    await page.locator(`#nav [data-tab="${id}"]`).click();
    await page.waitForFunction(
      () => !document.querySelector("#navigationDialog").open,
    );
    await page.evaluate(() => scrollTo(0, 0));
    return id;
  }
  for (const id of routes) {
    const rendered = await route(id);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images]
          .filter((x) => x.loading !== "lazy")
          .map((x) => x.decode().catch(() => {})),
      );
    });
    const path = `${dir}/${id}-${device}.png`;
    await page.screenshot({ path, fullPage: true, animations: "disabled" });
    records.push({ page: id, device, path, rendered, emptyData: true });
  }
  for (const name of ["help", "builder", "interview", "recommendation"]) {
    await route("ritual");
    if (name === "help") await page.locator("#helpButton").click();
    else if (name === "builder") await page.locator("#openBuilder").click();
    else {
      await page.locator("#aiLauncher").click();
      if (name === "recommendation") {
        while (await page.locator("#aiNext").isVisible())
          await page.locator("#aiNext").click();
        await page.locator("#aiSend").click();
      }
    }
    const path = `${dir}/${name}-${device}.png`;
    await page.screenshot({ path, animations: "disabled" });
    records.push({ page: name, device, path, emptyData: true });
  }
  await context.close();
}
await browser.close();
writeFileSync(
  `${dir}/manifest.json`,
  JSON.stringify(
    {
      phase,
      date: "2026-11-04",
      note: "Fresh disposable profile, no real user data. Missing before Home maps to Calendar; missing Consultant landing maps to existing interview.",
      screenshots: records,
    },
    null,
    2,
  ) + "\n",
);
console.log(`Captured ${records.length} ${phase} screenshots.`);
