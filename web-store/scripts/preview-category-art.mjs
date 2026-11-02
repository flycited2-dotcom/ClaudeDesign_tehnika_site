import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const recent = process.argv.includes("--recent");
const sourceDir = !recent ? process.argv[2] : undefined;
const progress = Object.values(JSON.parse(await readFile("output/category-art/generated.json", "utf8")));
const saved = progress.flatMap(v => [v.source, ...(v.previousSources ?? [])].map(p => path.basename(p)));
const files = recent ? progress.slice(-20).map(v => v.output) : sourceDir
  ? (await readdir(sourceDir)).filter(n => n.endsWith(".png") && !saved.includes(n)).map(n => path.join(sourceDir, n))
  : Object.values(JSON.parse(await readFile("src/lib/generated-category-art.json", "utf8"))).map(p => `public${p}`);
await writeFile("output/category-art/preview-files.json", JSON.stringify(files, null, 2));
const items = await Promise.all(files.map(async (source, i) => {
  const label = Buffer.from(`<svg width="220" height="25"><text x="10" y="18" font-size="16">${i}: ${path.basename(source).slice(0, 22)}</text></svg>`);
  const input = await sharp(source).resize(220, 205, {fit:"contain",background:"#eef4ff"})
    .extend({bottom:25,background:"#fff"}).composite([{input:label,left:0,top:205}]).png().toBuffer();
  return {input,left:(i%4)*230,top:Math.floor(i/4)*240};
}));
if (items.length) await sharp({create:{width:920,height:Math.ceil(items.length/4)*240,channels:4,background:"#eef4ff"}})
  .composite(items).png().toFile("output/category-art/preview-sheet.png");
console.log(`${files.length} images previewed`);
