import { readFile, mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const origin = "https://climat-simf.ru";
const art = JSON.parse(await readFile("output/category-art/deploy-registry.json", "utf8"));
const manifest = JSON.parse(await readFile("output/category-art/manifest.json", "utf8"));
const failures = [];
const paths = Object.values(art);
for (let i = 0; i < paths.length; i += 6) {
  await Promise.all(paths.slice(i, i + 6).map(async path => {
    try {
      const response = await fetch(origin + path, { signal: AbortSignal.timeout(20000) });
      const body = await response.arrayBuffer();
      if (!response.ok || !response.headers.get("content-type")?.startsWith("image/") || !body.byteLength)
        failures.push({ path, status: response.status() });
    } catch (error) { failures.push({ path, error: error.message }); }
  }));
}
console.log(JSON.stringify({ checkedImages: paths.length, failures }));
if (failures.length) throw new Error("Published images failed verification");
const parent = manifest.categories.find(c => c.slug === "vstraivaemaya-bytovaya-tehnika-9945");
const menu = await (await fetch(`${origin}/api/catalog/menu?parent=${parent.id}`, { signal: AbortSignal.timeout(20000) })).json();
if (!menu.categories?.length) throw new Error("Empty category menu");
for (const item of menu.categories) {
  if (art[item.slug] && item.image !== art[item.slug]) throw new Error(`Stale category illustration: ${item.slug}`);
}
console.log(JSON.stringify({ checkedCategoryImages: menu.categories.length }));
await mkdir("output/category-art/qa", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    await page.goto(`${origin}/catalog/${parent.slug}`, { waitUntil: "commit", timeout: 30000 });
    const hub = page.locator(".cat-hub");
    await hub.locator("img").first().waitFor({ timeout: 30000 });
    await hub.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const images = [...document.querySelectorAll(".cat-hub img")];
      return images.length > 0 && images.every(img => img.complete && img.naturalWidth > 0);
    }, { }, { timeout: 30000 });
    const layout = await hub.evaluate(el => ({
      images: el.querySelectorAll("img").length,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    if (layout.overflow) throw new Error("Horizontal overflow");
    await page.screenshot({ path: `output/category-art/qa/live-${width}.png`, timeout: 15000 });
    console.log(JSON.stringify({ width, ...layout }));
    await page.close();
  }
} finally { await browser.close(); }
