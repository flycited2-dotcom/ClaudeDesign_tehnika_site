import { chromium } from "playwright";
import { readFile, mkdir } from "node:fs/promises";

const manifest = JSON.parse(await readFile("output/category-art/manifest.json", "utf8"));
const art = JSON.parse(await readFile("src/lib/generated-category-art.json", "utf8"));
const fixtures = manifest.categories.filter(c => art[c.slug]).slice(0, 8).map(c => ({
  id: c.id, slug: c.slug, name: c.name, productCount: c.productCount,
  hasChildren: !c.leaf, description: "", image: art[c.slug],
}));
const browser = await chromium.launch({ headless: true, channel: "chrome" });
await mkdir("output/category-art/qa", { recursive: true });
try {
  for (const viewport of [{ width: 1440, height: 1100 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/api/catalog/menu*", route => route.fulfill({json:{categories:fixtures}}));
    await page.goto("http://localhost:3010/catalog", {waitUntil:"networkidle"});
    await page.locator(".cat-hub-tile").first().waitFor();
    await page.locator(".cat-hub").scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.querySelectorAll(".cat-hub img")].every(img => img.complete && img.naturalWidth > 0));
    const layout = await page.locator(".cat-hub").evaluate(el => ({
      display: getComputedStyle(el).display,
      columns: getComputedStyle(el).gridTemplateColumns,
      count: el.querySelectorAll(".cat-hub-tile").length,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      links: [...el.querySelectorAll("a")].every(a => a.getAttribute("href").startsWith("/catalog/")),
    }));
    if (errors.length || layout.overflow || !layout.links || layout.count !== fixtures.length)
      throw new Error(JSON.stringify({viewport,layout,errors}));
    await page.screenshot({path:`output/category-art/qa/catalog-${viewport.width}.png`});
    console.log(JSON.stringify({viewport,layout,errors}));
    await page.close();
  }
} finally { await browser.close(); }
