import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse CLI arguments
const url = process.argv[2];
const label = process.argv[3] || '';
const resolution = process.argv[4] || 'desktop';

// Validate required argument
if (!url) {
  console.error('Usage: node screenshot.mjs <url> [label] [resolution]');
  process.exit(1);
}

// Resolution presets
const resolutions = {
  desktop: { width: 1920, height: 1080, fullPage: false },
  compact: { width: 1366, height: 768, fullPage: true },
  tablet: { width: 768, height: 1024, fullPage: true },
};

if (!resolutions[resolution]) {
  console.error(`Invalid resolution: ${resolution}. Must be one of: desktop, compact, tablet`);
  process.exit(1);
}

const screenshotDir = path.join(__dirname, 'temporary screenshots');

// Ensure screenshot directory exists
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// Find the next screenshot number
function getNextScreenshotNumber() {
  const files = fs.readdirSync(screenshotDir);
  let maxNum = 0;
  files.forEach((file) => {
    const match = file.match(/^screenshot-(\d+)/);
    if (match) {
      maxNum = Math.max(maxNum, parseInt(match[1], 10));
    }
  });
  return maxNum + 1;
}

// Build filename
function buildFilename() {
  const num = getNextScreenshotNumber();
  let filename = `screenshot-${num}`;
  if (label) {
    filename += `-${label}`;
  }
  if (resolution !== 'desktop') {
    filename += `-${resolution}`;
  }
  filename += '.png';
  return filename;
}

async function takeScreenshot() {
  let browser;
  try {
    // Launch browser with google-chrome or chromium
    let executablePath = process.env.CHROME_BIN || process.env.CHROMIUM_BIN;

    // If no explicit path, try bundled chromium location
    if (!executablePath) {
      const bundledChromium = path.join(__dirname, 'chromium', 'win64-1631798', 'chrome-win', 'chrome.exe');
      if (fs.existsSync(bundledChromium)) {
        executablePath = bundledChromium;
      }
    }

    const launchArgs = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };

    if (executablePath) {
      launchArgs.executablePath = executablePath;
    }

    browser = await puppeteer.launch(launchArgs);
    const page = await browser.newPage();

    // Set viewport
    const resConfig = resolutions[resolution];
    await page.setViewport({
      width: resConfig.width,
      height: resConfig.height,
      deviceScaleFactor: 2,
    });

    // Navigate to URL
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for font rendering
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Take screenshot
    const filename = buildFilename();
    const filePath = path.join(screenshotDir, filename);

    await page.screenshot({
      path: filePath,
      fullPage: resConfig.fullPage,
    });

    // Output the relative path
    console.log(`./${path.relative(process.cwd(), filePath)}`);

    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

takeScreenshot();
