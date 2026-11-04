import { mkdirSync, copyFileSync, rmSync, cpSync } from "node:fs";
const files = [
  "forms.js",
  "help.js",
  "inspiration.js",
  "lib/free-consultant.js",
  "lib/form-rules.js",
  "lib/inspiration.js",
  "ipl.js",
  "lib/ipl.js",
  "builder.js",
  "lib/routine-plan.js",
  "lib/dialog.js",
  "ai-client.js",
  "runtime-config.json",
  "lib/ai-plan.js",
  "index.html",
  "style.css",
  "app.js",
  "ingredients.js",
  "motion.js",
  "prompts.js",
  "products.js",
  "theme.js",
  "shell.js",
  "archive.js",
  "sw.js",
  "manifest.webmanifest",
  "ingredients-db.json",
  "inspiration.json",
  "skin-editorial.jpg",
  "hair-editorial.jpg",
  "icon-192.png",
  "icon-512.png",
  "lib/domain.js",
  "lib/storage.js",
  "lib/inci-reference.js",
];
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist/lib", { recursive: true });
for (const name of files) copyFileSync(name, `dist/${name}`);
cpSync("assets", "dist/assets", { recursive: true });
cpSync("data", "dist/data", { recursive: true });
console.log(
  `Built ${files.length} static assets in dist/; no runtime dependencies.`,
);
