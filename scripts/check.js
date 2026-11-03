import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { validateDatabase } from "../lib/domain.js";
for (const folder of [".", "lib", "scripts", "tests/unit", "tests/e2e"]) {
  for (const file of readdirSync(folder).filter((f) => f.endsWith(".js"))) {
    const r = spawnSync(process.execPath, ["--check", `${folder}/${file}`], {
      stdio: "inherit",
    });
    if (r.status !== 0) process.exit(r.status || 1);
  }
}
validateDatabase(JSON.parse(readFileSync("ingredients-db.json", "utf8")));
for (const name of ["inspiration.json", "manifest.webmanifest", "package.json"])
  JSON.parse(readFileSync(name, "utf8"));
console.log("Syntax, JSON and ingredient evidence contract passed.");
// Required resource check from the supplied workflow (CI must fail on missing files).
for (const file of [
  "index.html",
  "style.css",
  "app.js",
  "ingredients.js",
  "motion.js",
  "prompts.js",
  "sw.js",
  "ingredients-db.json",
  "inspiration.json",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "skin-editorial.jpg",
  "hair-editorial.jpg",
]) {
  if (!readFileSync(file).length)
    throw Error(`Empty application asset: ${file}`);
}
const { createHash } = await import("node:crypto");
const manifest = JSON.parse(
  readFileSync("tests/supplied/archive-manifest.json", "utf8"),
);
let verified = 0;
for (const archive of Object.values(manifest))
  for (const [file, hash] of Object.entries(archive.files)) {
    const bytes = readFileSync(`tests/supplied/original/${file}`);
    if (createHash("sha256").update(bytes).digest("hex") !== hash)
      throw Error(`Supplied original modified: ${file}`);
    verified++;
  }
console.log(
  `Verified ${verified} untouched supplied files and required application assets.`,
);
