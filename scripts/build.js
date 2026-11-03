import { mkdirSync, copyFileSync, rmSync } from "node:fs";
const files = [
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
];
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist/lib", { recursive: true });
for (const name of files) copyFileSync(name, `dist/${name}`);
console.log(
  `Built ${files.length} static assets in dist/; no runtime dependencies.`,
);
