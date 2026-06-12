// Deep QA suite for the CRM prototype.
// Usage: node qa-deep-test.mjs   (server must be running on :3000)
// Writes results to docs/qa/deep-qa-results.json and prints a summary.
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:3000';
const results = [];

function rec(area, name, pass, details = '') {
  results.push({ area, name, pass: !!pass, details });
  console.log(`${pass ? 'PASS' : 'FAIL'} [${area}] ${name}${details ? ' — ' + details : ''}`);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// noise we don't count as page errors
const IGNORED_ERRORS = [
  /cdn\.tailwindcss\.com should not be used in production/i,
  /Tailwind CSS/i,
];
function realErrors(list) {
  return list.filter(e => !IGNORED_ERRORS.some(re => re.test(e)));
}

let browser;

async function newPage({ role = 'owner', width = 1440, height = 900 } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.evaluateOnNewDocument(r => localStorage.setItem('crm.role', r), role);
  page._errors = [];
  page.on('pageerror', e => page._errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') page._errors.push('console: ' + m.text()); });
  page.on('requestfailed', req => page._errors.push('reqfail: ' + req.url()));
  page.on('response', res => { if (res.status() >= 400) page._errors.push(`http ${res.status()}: ${res.url()}`); });
  return page;
}

async function go(page, url) {
  await page.goto(BASE + url, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(250);
}

// ─── 1. smoke: every page loads with shell, no errors ────────────────────────
const APP_PAGES = [
  '/app/dashboard-owner.html', '/app/dashboard-manager.html',
  '/app/leads/list.html', '/app/leads/kanban.html',
  '/app/clients/list.html',
  '/app/deals/kanban.html', '/app/deals/list.html', '/app/deals/by-client.html',
  '/app/tasks/my.html', '/app/tasks/dept.html', '/app/tasks/all.html', '/app/tasks/kanban.html', '/app/tasks/calendar.html',
  '/app/offers/list.html',
  '/app/tenders/list.html', '/app/tenders/calendar.html',
  '/app/employees/list.html',
  '/app/settings/funnels.html', '/app/settings/offer-templates.html', '/app/settings/lead-sources.html',
  '/app/settings/site-tokens.html', '/app/settings/integrations.html',
  '/app/reports/overview.html', '/app/reports/leads.html', '/app/reports/deals.html', '/app/reports/managers.html',
  '/app/reports/offers.html', '/app/reports/tasks.html', '/app/reports/tenders.html', '/app/reports/time.html',
];

async function smokeAll() {
  const page = await newPage();
  for (const url of APP_PAGES) {
    page._errors = [];
    try {
      await go(page, url);
      const shellOk = await page.evaluate(() =>
        !!document.querySelector('[data-nav]') && !!document.querySelector('[data-page-title]'));
      const errs = realErrors(page._errors);
      rec('smoke', `load ${url}`, shellOk && errs.length === 0,
        (!shellOk ? 'shell not injected; ' : '') + errs.slice(0, 3).join(' | '));
    } catch (e) {
      rec('smoke', `load ${url}`, false, e.message);
    }
  }
  // standalone pages
  for (const url of ['/app/login.html', '/app/404.html']) {
    page._errors = [];
    await go(page, url);
    const ok = await page.evaluate(() => document.body.innerText.length > 20);
    rec('smoke', `load ${url}`, ok && realErrors(page._errors).length === 0,
      realErrors(page._errors).slice(0, 3).join(' | '));
  }
  await page.close();
}

// ─── 2. cards open by id from mock ───────────────────────────────────────────
async function cards() {
  const page = await newPage();
  await go(page, '/app/clients/list.html');
  const ids = await page.evaluate(() => ({
    client: window.MOCK.clients[0].id,
    deal: window.MOCK.deals[0].id,
    offer: window.MOCK.offers[0].id,
    tender: window.MOCK.tenders[0].id,
    employee: window.MOCK.users[2].id,
  }));

  await go(page, `/app/clients/card.html?id=${ids.client}`);
  let tabs = await page.$$('.tab');
  rec('cards', 'client card renders with tabs', tabs.length >= 5, `tabs: ${tabs.length}`);
  if (tabs.length > 1) {
    await tabs[1].click(); await sleep(300);
    const active = await page.evaluate(() => document.querySelectorAll('.tab')[1]?.classList.contains('is-active'));
    rec('cards', 'client card tab switches', !!active);
  }

  page._errors = [];
  await go(page, `/app/deals/card.html?id=${ids.deal}`);
  const stage = await page.$('.stage-indicator');
  const dealTabs = await page.$$('.tab');
  rec('cards', 'deal card: stage indicator + tabs', !!stage && dealTabs.length >= 5,
    `tabs: ${dealTabs.length}, errors: ${realErrors(page._errors).slice(0,2).join('|')}`);

  await go(page, `/app/offers/view.html?id=${ids.offer}`);
  const kp = await page.$('.kp-page');
  rec('cards', 'offer view: A4 preview renders', !!kp);

  await go(page, `/app/tenders/card.html?id=${ids.tender}`);
  const tenderOk = await page.evaluate(() => document.body.innerText.includes('Тендер') && !!document.querySelector('.tab'));
  rec('cards', 'tender card renders', tenderOk);

  await go(page, `/app/employees/card.html?id=${ids.employee}`);
  const empOk = await page.evaluate(() => document.body.innerText.length > 200);
  rec('cards', 'employee card renders', empOk);
  await page.close();
  return ids;
}

// ─── 3. roles ─────────────────────────────────────────────────────────────────
async function roles() {
  const owner = await newPage({ role: 'owner' });
  await go(owner, '/app/dashboard-owner.html');
  const adminVisible = await owner.evaluate(() => {
    const el = document.querySelector('[data-role="owner"]');
    return el && el.style.display !== 'none';
  });
  rec('roles', 'owner sees admin nav (Сотрудники/Настройки)', adminVisible);
  const counters = await owner.evaluate(() => document.querySelector('[data-count="leads-open"]')?.textContent.trim());
  rec('roles', 'sidebar lead counter computed from mock', Number(counters) > 0, `value: ${counters}`);
  await owner.close();

  const mgr = await newPage({ role: 'manager' });
  await go(mgr, '/app/dashboard-manager.html');
  const adminHidden = await mgr.evaluate(() => {
    const el = document.querySelector('[data-role="owner"]');
    return el && el.style.display === 'none';
  });
  rec('roles', 'manager does not see admin nav', adminHidden);
  const avatar = await mgr.evaluate(() => document.querySelector('[data-user-avatar]')?.textContent.trim());
  rec('roles', 'manager avatar = МЕ (Морозова)', avatar === 'МЕ', `avatar: ${avatar}`);
  // role switch in topbar
  await mgr.click('[data-role-value="owner"]');
  await mgr.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  rec('roles', 'role switch navigates to owner dashboard', mgr.url().includes('dashboard-owner'));
  await mgr.close();
}

// ─── 4. topbar: create menu, notifications, profile, logout ──────────────────
async function topbar() {
  const page = await newPage();
  await go(page, '/app/clients/list.html');

  await page.click('[data-action="open-create"]');
  await sleep(300);
  const items = await page.$$eval('[data-create-item]', els => els.map(e => e.textContent.trim()));
  rec('topbar', 'create menu opens with 6 entities', items.length === 6, items.join(', '));

  // each create menu item opens its modal
  for (const modal of ['create-client', 'create-lead', 'create-deal', 'create-task', 'create-offer', 'create-tender']) {
    await go(page, `/app/clients/list.html?_modal=${modal}`);
    const ok = await page.waitForSelector(`.modal-backdrop.is-open[data-modal-name="${modal}"]`, { timeout: 5000 }).catch(() => null);
    rec('topbar', `modal ${modal} opens`, !!ok);
    if (ok) {
      await page.keyboard.press('Escape');
      await sleep(350);
      const closed = await page.evaluate(() => !document.querySelector('.modal-backdrop'));
      rec('topbar', `modal ${modal} closes by Esc`, closed);
    }
  }

  await go(page, '/app/clients/list.html');
  await page.click('[data-action="open-notifications"]');
  await sleep(400);
  const notifCount = await page.$$eval('#shell-notif-list .notif-item', els => els.length).catch(() => 0);
  rec('topbar', 'notifications popover shows items', notifCount > 0, `items: ${notifCount}`);

  // profile popover + logout
  await go(page, '/app/clients/list.html');
  await page.click('[data-action="open-profile"]');
  await sleep(300);
  const profileItems = await page.$$eval('[data-profile-action]', els => els.map(e => e.dataset.profileAction));
  rec('topbar', 'profile popover has Профиль/Настройки/Выйти', profileItems.join(',') === 'profile,settings,logout', profileItems.join(','));
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
    page.click('[data-profile-action="logout"]'),
  ]).catch(() => {});
  // role clearing can't be asserted here: the test harness re-seeds localStorage
  // on every navigation via evaluateOnNewDocument
  const onLogin = page.url().includes('/app/login.html');
  rec('topbar', 'logout → login page', onLogin, page.url());
  await page.close();
}

// ─── 5. command palette ───────────────────────────────────────────────────────
async function cmdk() {
  const page = await newPage();
  await go(page, '/app/dashboard-owner.html');
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyK');
  await page.keyboard.up('Control');
  const input = await page.waitForSelector('[data-cmdk-input]', { timeout: 5000 }).catch(() => null);
  rec('cmdk', 'Ctrl+K opens command palette', !!input);
  if (input) {
    const quick = await page.$$eval('[data-cmdk-action]', els => els.length);
    rec('cmdk', 'quick create actions listed', quick === 6, `actions: ${quick}`);
    await input.type('Газснаб');
    await sleep(400);
    const found = await page.evaluate(() => document.querySelector('[data-cmdk-results]')?.innerText.includes('Газснабсервис'));
    rec('cmdk', 'search finds client by name', !!found);
    const href = await page.$eval('.cmdk-item', el => el.getAttribute('href')).catch(() => null);
    rec('cmdk', 'search result links to client card', !!href && href.includes('/app/clients/card.html?id='), href || '');
  }
  await page.close();
}

// ─── 6. lists: rows render, row click opens card, '+' buttons ────────────────
async function lists() {
  const page = await newPage();
  const tables = [
    { url: '/app/leads/list.html', plus: 'create-lead', rowLink: false },
    { url: '/app/clients/list.html', plus: 'create-client', rowLink: '/app/clients/card.html?id=' },
    { url: '/app/deals/list.html', plus: 'create-deal', rowLink: '/app/deals/card.html?id=' },
    { url: '/app/offers/list.html', plus: 'create-offer', rowLink: '/app/offers/view.html?id=' },
    { url: '/app/tenders/list.html', plus: 'create-tender', rowLink: '/app/tenders/card.html?id=' },
  ];
  for (const t of tables) {
    await go(page, t.url);
    const rows = await page.$$eval('#table-root tbody tr', els => els.length).catch(() => 0);
    rec('lists', `${t.url} renders rows`, rows > 0, `rows: ${rows}`);

    const plusBtn = await page.$(`[data-action="open-modal"][data-modal="${t.plus}"]`);
    if (plusBtn) {
      await plusBtn.click();
      const opened = await page.waitForSelector(`.modal-backdrop.is-open[data-modal-name="${t.plus}"]`, { timeout: 5000 }).catch(() => null);
      rec('lists', `${t.url} '+' button opens ${t.plus}`, !!opened);
      await page.keyboard.press('Escape'); await sleep(300);
    } else {
      rec('lists', `${t.url} '+' button wired`, false, 'button not found');
    }

    if (t.rowLink) {
      const td = await page.$('#table-root tbody tr.row-link td:nth-child(2)');
      if (td) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
          td.click(),
        ]).catch(() => {});
        rec('lists', `${t.url} row click opens card`, page.url().includes(t.rowLink), page.url());
      } else {
        rec('lists', `${t.url} row click opens card`, false, 'no .row-link rows');
      }
    }
  }
  // kanbans
  for (const url of ['/app/leads/kanban.html', '/app/deals/kanban.html', '/app/tasks/kanban.html']) {
    await go(page, url);
    const cols = await page.$$eval('.kanban-col', els => els.length).catch(() => 0);
    const cardsN = await page.$$eval('.kanban-card', els => els.length).catch(() => 0);
    rec('lists', `${url} kanban renders`, cols >= 3 && cardsN > 0, `cols: ${cols}, cards: ${cardsN}`);
  }
  await page.close();
}

// ─── 7. calendars: month navigation ──────────────────────────────────────────
async function calendars() {
  const page = await newPage();
  for (const url of ['/app/tasks/calendar.html', '/app/tenders/calendar.html']) {
    await go(page, url);
    const before = await page.$eval('#month-nav-label', el => el.textContent.trim());
    await page.click('[data-cal-next]');
    await sleep(250);
    const after = await page.$eval('#month-nav-label', el => el.textContent.trim());
    await page.click('[data-cal-prev]');
    await page.click('[data-cal-prev]');
    await sleep(250);
    const back2 = await page.$eval('#month-nav-label', el => el.textContent.trim());
    rec('calendar', `${url} arrows switch month`, before !== after && back2 !== before && back2 !== after,
      `${before} → ${after} → ${back2}`);
    const cells = await page.$$eval('.cal-cell', els => els.length);
    rec('calendar', `${url} grid has 42 cells`, cells === 42, `cells: ${cells}`);
  }
  // tender chips link to cards
  await go(page, '/app/tenders/calendar.html');
  const chipHref = await page.$eval('a.cal-chip', el => el.getAttribute('href')).catch(() => null);
  rec('calendar', 'tender calendar chips link to card', !!chipHref && chipHref.includes('/app/tenders/card.html?id='), chipHref || 'no chips in current month');
  await page.close();
}

// ─── 8. empty / skeleton states ───────────────────────────────────────────────
async function emptyStates() {
  const page = await newPage();
  const cases = [
    { url: '/app/leads/list.html?empty=1', type: 'lead' },
    { url: '/app/clients/list.html?empty=1', type: 'client' },
    { url: '/app/deals/kanban.html?empty=1', type: 'deal' },
    { url: '/app/tasks/calendar.html?empty=1', type: 'task' },
  ];
  for (const c of cases) {
    await go(page, c.url);
    const btn = await page.$(`.empty [data-action="open-create"][data-type="${c.type}"]`);
    rec('empty', `${c.url} empty-state with CTA`, !!btn);
    if (btn) {
      await btn.click();
      const opened = await page.waitForSelector('.modal-backdrop.is-open', { timeout: 5000 }).catch(() => null);
      const modalName = opened ? await page.$eval('.modal-backdrop', el => el.dataset.modalName) : '';
      rec('empty', `${c.url} CTA opens create-${c.type}`, modalName === `create-${c.type}`, modalName);
      await page.keyboard.press('Escape'); await sleep(300);
    }
  }
  // skeletons are transient by design (600ms, then redirect to the data view) —
  // catch them right after load instead of waiting for network idle
  for (const url of ['/app/dashboard-owner.html?skeleton=1', '/app/clients/list.html?skeleton=1', '/app/deals/kanban.html?skeleton=1']) {
    await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const skel = await page.waitForSelector('.skel', { timeout: 8000 }).catch(() => null);
    const swapped = skel
      ? await page.waitForFunction(() => !location.search.includes('skeleton'), { timeout: 8000 }).then(() => true).catch(() => false)
      : false;
    rec('empty', `${url} shows skeletons, then swaps to data`, !!skel && swapped, skel ? 'shown + swapped' : 'no .skel nodes');
  }
  await page.close();
}

// ─── 9. reports: charts actually drawn ────────────────────────────────────────
async function reports() {
  const page = await newPage();
  for (const url of ['/app/reports/overview.html', '/app/reports/leads.html', '/app/reports/deals.html', '/app/reports/managers.html',
    '/app/reports/offers.html', '/app/reports/tasks.html', '/app/reports/tenders.html', '/app/reports/time.html']) {
    await go(page, url);
    await sleep(400);
    const res = await page.evaluate(() => {
      const canvases = [...document.querySelectorAll('canvas')];
      const attached = canvases.filter(c => window.Chart && window.Chart.getChart(c)).length;
      return { total: canvases.length, attached };
    });
    rec('reports', `${url} charts attached`, res.total > 0 && res.attached === res.total, `${res.attached}/${res.total}`);
  }
  await page.close();
}

// ─── 10. sources / integrations content ───────────────────────────────────────
async function sources() {
  const page = await newPage();
  await go(page, '/app/settings/lead-sources.html');
  const text = await page.evaluate(() => document.body.innerText);
  const expected = ['splihub.ru', 'splihome.ru', 'climat-simf.ru', 'Приложение SplitHub', 'Авито', 'Парсинг тендеров', 'Звонок входящий'];
  const missing = expected.filter(s => !text.includes(s));
  rec('sources', 'lead sources list = entry points', missing.length === 0, missing.length ? 'missing: ' + missing.join(', ') : '7/7');

  await go(page, '/app/settings/site-tokens.html');
  const text2 = await page.evaluate(() => document.body.innerText);
  const expected2 = ['splihub.ru', 'splihome.ru', 'climat-simf.ru', 'Приложение SplitHub', 'Авито', 'Парсинг тендеров'];
  const missing2 = expected2.filter(s => !text2.includes(s));
  const noOld = !/nordlight|landing-promo/.test(text2);
  rec('sources', 'site tokens: real sources, no demo domains', missing2.length === 0 && noOld, missing2.join(', ') || (noOld ? '6/6' : 'old domains remain'));

  await go(page, '/app/settings/integrations.html');
  const text3 = await page.evaluate(() => document.body.innerText);
  const expected3 = ['Google Диск', 'Gmail', 'Вебмейл', 'Парсинг отелей', 'База монтажников', 'Telegram'];
  const missing3 = expected3.filter(s => !text3.includes(s));
  rec('sources', 'integrations: drive, mail, parsers present', missing3.length === 0, missing3.join(', ') || '6/6');

  // leads list shows new source chips
  await go(page, '/app/leads/list.html');
  const chips = await page.evaluate(() => document.querySelector('#table-root').innerText);
  const anyOld = /Сайт основной|Сайт opt|Telegram-бот|ZakupKi/.test(chips);
  rec('sources', 'leads list uses new source names only', !anyOld && chips.includes('splihub.ru'), anyOld ? 'old names visible' : 'ok');
  await page.close();
}

// ─── 11. mobile: overflow + burger menu ───────────────────────────────────────
async function mobile() {
  const KEY_PAGES = ['/app/dashboard-owner.html', '/app/dashboard-manager.html', '/app/leads/list.html',
    '/app/deals/kanban.html', '/app/clients/list.html', '/app/tasks/calendar.html',
    '/app/reports/overview.html', '/app/settings/lead-sources.html', '/app/login.html'];
  const page = await newPage({ width: 390, height: 844 });
  for (const url of KEY_PAGES) {
    await go(page, url);
    const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    rec('mobile', `${url} no horizontal overflow @390`, m.sw <= m.iw + 2, `scrollWidth ${m.sw} vs ${m.iw}`);
  }
  // burger
  await go(page, '/app/dashboard-owner.html');
  const burgerVisible = await page.evaluate(() => {
    const b = document.querySelector('[data-action="toggle-sidebar"]');
    return b && getComputedStyle(b).display !== 'none';
  });
  rec('mobile', 'burger button visible @390', burgerVisible);
  await page.click('[data-action="toggle-sidebar"]');
  await sleep(400);
  const opened = await page.evaluate(() => document.getElementById('appSidebar')?.classList.contains('is-open') && !!document.querySelector('.sidebar-scrim'));
  rec('mobile', 'burger opens sidebar with scrim', !!opened);
  if (opened) {
    await page.click('.sidebar-scrim');
    await sleep(400);
    const closed = await page.evaluate(() => !document.getElementById('appSidebar')?.classList.contains('is-open'));
    rec('mobile', 'tap on scrim closes sidebar', closed);
  }
  // tablet breakpoint 768: burger must still be visible (sidebar is hidden there)
  await page.setViewport({ width: 768, height: 1024 });
  await go(page, '/app/dashboard-owner.html');
  const burger768 = await page.evaluate(() => {
    const b = document.querySelector('[data-action="toggle-sidebar"]');
    const sb = document.getElementById('appSidebar');
    const sidebarOff = sb && getComputedStyle(sb).position === 'fixed';
    return { burger: b && getComputedStyle(b).display !== 'none', sidebarOff };
  });
  rec('mobile', 'burger visible @768 when sidebar hidden', !burger768.sidebarOff || burger768.burger,
    JSON.stringify(burger768));
  await page.close();
}

// ─── 12. login + favicon + 404 ────────────────────────────────────────────────
async function misc() {
  const page = await newPage();
  const fav = await page.goto(BASE + '/favicon.ico');
  rec('misc', 'favicon.ico served', fav.status() === 200 && (await fav.buffer()).length > 100, `status ${fav.status()}`);

  await go(page, '/app/login.html');
  const btn = await page.$('.login-submit');
  rec('misc', 'login page renders submit button', !!btn);
  if (btn) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
      btn.click(),
    ]).catch(() => {});
    rec('misc', 'login button leads to dashboard (mock, no real auth — known stage-2 item)', page.url().includes('dashboard'), page.url());
  }

  await go(page, '/app/404.html');
  const e404 = await page.evaluate(() => document.body.innerText.includes('404'));
  rec('misc', '404 page renders', e404);
  await page.close();
}

// ─── main ─────────────────────────────────────────────────────────────────────
const bundled = path.join(__dirname, 'chromium', 'win64-1631798', 'chrome-win', 'chrome.exe');
browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  ...(fs.existsSync(bundled) ? { executablePath: bundled } : {}),
});

try {
  await smokeAll();
  await cards();
  await roles();
  await topbar();
  await cmdk();
  await lists();
  await calendars();
  await emptyStates();
  await reports();
  await sources();
  await mobile();
  await misc();
} finally {
  await browser.close();
}

const passed = results.filter(r => r.pass).length;
const failed = results.length - passed;
console.log(`\n──── TOTAL: ${results.length}, PASS: ${passed}, FAIL: ${failed} ────`);
for (const r of results.filter(r => !r.pass)) console.log(`  FAIL [${r.area}] ${r.name} — ${r.details}`);

fs.mkdirSync(path.join(__dirname, 'docs', 'qa'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'docs', 'qa', 'deep-qa-results.json'), JSON.stringify({ date: new Date().toISOString(), passed, failed, results }, null, 2));
process.exit(failed > 0 ? 1 : 0);
