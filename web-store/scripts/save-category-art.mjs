import { readFile, writeFile, mkdir, rename, open, unlink } from "node:fs/promises";
import sharp from "sharp";

const [slug, source, replacedSource] = process.argv.slice(2);
if (!slug || !/^[a-z0-9-]+$/.test(slug) || !source) throw new Error("Usage: node scripts/save-category-art.mjs <slug> <source>");
const output = `public/static/category-cards/${slug}.webp`;
await mkdir("public/static/category-cards", { recursive: true });
const metadata = await sharp(source).metadata();
const stats = await sharp(source).stats();
const alpha = stats.channels[3];
if (!metadata.hasAlpha || !alpha || alpha.min !== 0 || alpha.max === 0)
  throw new Error(`Transparent background or visible subject missing: ${slug}`);
await sharp(source).resize(640, 640, { fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toFile(output);
const registryPath = "src/lib/generated-category-art.json";
// Concurrent generators share the registry; serialize both metadata updates.
await mkdir("output/category-art", { recursive: true });
const lockPath = "output/category-art/save.lock";
let lock;
for (let attempt = 0; attempt < 300; attempt++) {
  try {
    lock = await open(lockPath, "wx");
    await lock.writeFile(String(process.pid));
    break;
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const owner = Number(await readFile(lockPath, "utf8").catch(() => "0"));
    if (owner > 0) {
      try { process.kill(owner, 0); }
      catch (error) {
        if (error.code === "ESRCH") await unlink(lockPath).catch(() => {});
      }
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
if (!lock) throw new Error("Timed out waiting for the category registry lock");
try {
let registry = {};
try { registry = JSON.parse(await readFile(registryPath, "utf8")); }
catch (error) { if (error.code !== "ENOENT") throw error; }
registry[slug] = `/static/category-cards/${slug}.webp`;
await writeFile(`${registryPath}.tmp`, JSON.stringify(Object.fromEntries(Object.entries(registry).sort()), null, 2) + "\n");
await rename(`${registryPath}.tmp`, registryPath);
await mkdir("output/category-art", { recursive: true });
const progressPath = "output/category-art/generated.json";
let progress = {};
try { progress = JSON.parse(await readFile(progressPath, "utf8")); }
catch (error) { if (error.code !== "ENOENT") throw error; }
const previous = progress[slug];
const previousSources = [...new Set([...(previous?.previousSources ?? []), previous?.source, replacedSource]
  .filter(path => path && path !== source))];
progress[slug] = { source, output, savedAt: new Date().toISOString(), ...(previousSources.length ? { previousSources } : {}) };
await writeFile(`${progressPath}.tmp`, JSON.stringify(progress, null, 2) + "\n");
await rename(`${progressPath}.tmp`, progressPath);
} finally {
  await lock.close();
  await unlink(lockPath);
}
console.log(`${slug}: saved`);
