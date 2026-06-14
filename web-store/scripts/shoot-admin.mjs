// Headless visual QA for the admin panel: logs in and screenshots each section
// at desktop + mobile widths. Uses the system Edge (channel: msedge) so no
// chromium download is needed. Creds + base come from env.
//
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... SHOOT_OUT=shots SHOOT_TAG=before \
//     node scripts/shoot-admin.mjs
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.SHOOT_BASE || "https://climat-simf.ru";
const EMAIL = process.env.ADMIN_EMAIL || "";
const PASSWORD = process.env.ADMIN_PASSWORD || "";
const OUT = process.env.SHOOT_OUT || "shots";
const TAG = process.env.SHOOT_TAG || "admin";
const ONLY = process.env.SHOOT_ONLY; // optional: comma list of page names

const allPages = [
  ["overview", "/admin"],
  ["products", "/admin/products"],
  ["orders", "/admin/orders"],
  ["leads", "/admin/leads"],
  ["role-requests", "/admin/role-requests"],
  ["settings", "/admin/settings"],
  ["categories", "/admin/categories"],
  ["sync", "/admin/sync"],
  ["logs", "/admin/logs"],
];
const pages = ONLY ? allPages.filter(([n]) => ONLY.split(",").includes(n)) : allPages;

const viewports = [
  ["desktop", 1366, 900],
  ["mobile", 390, 844],
];

mkdirSync(OUT, { recursive: true });

// Prefer a system browser (no download). Fall back to a bundled chromium if one
// was installed via `npx playwright install chromium`.
async function launchBrowser() {
  for (const channel of ["msedge", "chrome"]) {
    try {
      return await chromium.launch({ channel });
    } catch {
      // try next
    }
  }
  return chromium.launch();
}

const browser = await launchBrowser();
try {
  for (const [vpName, w, h] of viewports) {
    const context = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await context.newPage();

    await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.fill('input[name="email"]', EMAIL);
    await page.fill('input[name="password"]', PASSWORD);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(3500); // let the server action set the cookie + redirect

    for (const [name, path] of pages) {
      try {
        await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${OUT}/${TAG}-${vpName}-${name}.png`, fullPage: true });
        console.log("shot", vpName, name);
      } catch (e) {
        console.log("FAIL", vpName, name, e.message);
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}
console.log("done");
