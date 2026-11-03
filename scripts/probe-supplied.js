/** Optional diagnostic of unmodified legacy tests against the current build.
 * Known to fail on v2. Never used as a replacement for the v2 quality gate.
 */
import {
  mkdtempSync,
  mkdirSync,
  cpSync,
  symlinkSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
const root = resolve("."),
  original = join(root, "tests/supplied/original");
const probe = mkdtempSync(join(tmpdir(), "beautycalendar-legacy-probe-"));
const report = join(root, "test-results/supplied-probe");
mkdirSync(report, { recursive: true });
try {
  cpSync(join(root, "dist"), probe, { recursive: true });
  cpSync(join(original, "3-beautycalendar-tests/tests"), join(probe, "tests"), {
    recursive: true,
  });
  symlinkSync(join(root, "node_modules"), join(probe, "node_modules"), "dir");
  writeFileSync(
    join(probe, "package.json"),
    '{"name":"legacy-compatibility-probe","private":true}',
  );
  const config = readFileSync(
    join(original, "2-beautycalendar-playwright/playwright.config.cjs"),
    "utf8",
  )
    .replace(
      "command: 'npm run serve:test'",
      "command: 'node tests/server.cjs'",
    )
    .replace("video: 'retain-on-failure'", "video: 'off'");
  const configPath = join(probe, "playwright.config.cjs");
  writeFileSync(
    configPath,
    config +
      `\nmodule.exports.outputDir=${JSON.stringify(join(report, "browser"))};\nmodule.exports.reporter=[['list'],['json',{outputFile:${JSON.stringify(join(report, "results.json"))}}],['html',{outputFolder:${JSON.stringify(join(report, "html"))},open:'never'}]];\n`,
  );
  const unit = spawnSync(
    process.execPath,
    ["--test", "tests/unit/ingredients.test.cjs"],
    { cwd: probe, encoding: "utf8" },
  );
  writeFileSync(
    join(report, "unit.log"),
    (unit.stdout || "") + (unit.stderr || ""),
  );
  const browser = spawnSync(
    process.execPath,
    [
      join(root, "node_modules/@playwright/test/cli.js"),
      "test",
      "--config",
      configPath,
      "--project",
      "desktop-1440",
      "--grep",
      "aliases, case",
      "--timeout",
      "8000",
    ],
    {
      cwd: probe,
      encoding: "utf8",
      env: {
        ...process.env,
        PW_EXECUTABLE_PATH:
          process.env.CHROMIUM_PATH || process.env.PW_EXECUTABLE_PATH || "",
      },
    },
  );
  writeFileSync(
    join(report, "browser.log"),
    (browser.stdout || "") + (browser.stderr || ""),
  );
  const result = {
    note: "Original tests unchanged; execution config uses current dependencies, system-browser selector, no video and redirected reports.",
    unitExitCode: unit.status,
    browserProbeExitCode: browser.status,
    browserSelection:
      "1 legacy aliases scenario on desktop-1440; remaining original browser tests not executed",
  };
  writeFileSync(
    join(report, "summary.json"),
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(result);
  console.log("Reports: test-results/supplied-probe/");
  process.exitCode = unit.status ?? browser.status ?? 1;
  if (process.exitCode === 0) process.exitCode = browser.status ?? 1;
} finally {
  rmSync(probe, { recursive: true, force: true });
}
