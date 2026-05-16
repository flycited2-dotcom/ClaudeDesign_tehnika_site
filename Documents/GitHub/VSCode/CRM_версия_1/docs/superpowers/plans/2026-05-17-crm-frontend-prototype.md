# CRM Frontend Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a visually polished, light-business-premium frontend prototype of the CRM system covering all screens and tabs from `crm_project_docs/07_UI_UX_SPEC.md`, with both role views (owner/manager) switchable in the UI, using mock data only. No backend.

**Architecture:** Multi-page static HTML site. Shared sidebar/topbar are HTML fragments injected by a tiny vanilla-JS shell loader. All visual tokens (palette, type, spacing, shadows) live in one CSS file and are consumed by every screen. Mock data is one synchronous JS object; widgets (`renderTable`, `renderKanban`, `renderKpiCard`, `renderBadge`, `renderAvatar`, `renderTabs`) render it identically across screens. Style-first build order: one reference screen locks the visual language; the remaining ~30 screens replicate the established components.

**Tech Stack:** Plain HTML, Tailwind CSS via CDN, vanilla JS, Google Fonts (Fraunces, Inter, JetBrains Mono), lucide icons via CDN, Chart.js via CDN (reports only). Existing `serve.mjs` for local dev (`node serve.mjs`, port 3000), existing `screenshot.mjs` for Puppeteer screenshots.

**Spec reference:** `docs/superpowers/specs/2026-05-17-crm-frontend-prototype-design.md` is the authoritative design source for tokens, layouts, content, and acceptance criteria. When this plan and the spec diverge, the spec wins — flag the discrepancy and fix the plan.

**TDD note:** This is a visual prototype with no automated tests. "Verify" steps mean run the local server, screenshot via `screenshot.mjs`, read the PNG with the Read tool, and check it visually against the acceptance criteria in each task. Per-screen acceptance always requires the per-screen checklist plus the global checklist in §7 of the spec.

**File path convention:** All paths in this plan are relative to the repo root `c:/Users/user/Documents/GitHub/VSCode/CRM_версия_1/`.

---

## Batch 0 — Foundation

No visual deliverable. Sets up tokens, base components, shell loader, mock data, and the screenshot harness. Must be complete before Batch 1.

### Task 0.1: Project skeleton and entry

**Files:**
- Create: `index.html`
- Create: `app/` (directory)
- Create: `app/shell/` (directory)
- Create: `app/shell/modals/` (directory)
- Create: `assets/css/` (directory)
- Create: `assets/js/` (directory)
- Create: `temporary screenshots/.gitkeep`

- [ ] **Step 1: Create directory tree**

```bash
mkdir -p app/shell/modals assets/css assets/js "temporary screenshots"
touch "temporary screenshots/.gitkeep"
```

- [ ] **Step 2: Create root redirect**

Write `index.html`:

```html
<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>CRM</title>
  <meta http-equiv="refresh" content="0; url=/app/dashboard-owner.html">
  <link rel="canonical" href="/app/dashboard-owner.html">
</head>
<body>
  <a href="/app/dashboard-owner.html">Перейти в CRM</a>
</body>
</html>
```

- [ ] **Step 3: Verify `serve.mjs` exists at repo root and start it**

Run: `node serve.mjs`
Expected: server log line like `Listening on http://localhost:3000`.
Leave running in background for the remainder of the plan. If a previous instance is already running, skip — do not start a second.

- [ ] **Step 4: Commit**

```bash
git add index.html app assets "temporary screenshots/.gitkeep"
git commit -m "scaffold: project tree and root redirect"
```

---

### Task 0.2: Design tokens (`tokens.css`)

**Files:**
- Create: `assets/css/tokens.css`

- [ ] **Step 1: Write `assets/css/tokens.css` verbatim**

```css
:root {
  --bg-app: #FAFAF7;
  --bg-surface: #FFFFFF;
  --bg-sidebar: #F5F4EF;
  --bg-hover: #EFEDE7;
  --border-subtle: #EBE9E2;
  --border-strong: #D9D6CC;

  --text-primary: #1C1B17;
  --text-secondary: #6B6862;
  --text-muted: #9C9890;
  --text-inverse: #FAFAF7;

  --accent: #1F4A3A;
  --accent-hover: #163528;
  --accent-soft: #E8EFEB;
  --accent-fg: #FFFFFF;

  --status-success-fg: #2F7D5C;
  --status-success-bg: #E6F1EB;
  --status-warning-fg: #B5841E;
  --status-warning-bg: #F7EFDC;
  --status-danger-fg:  #A8392E;
  --status-danger-bg:  #F4E4E1;
  --status-info-fg:    #3A5C8C;
  --status-info-bg:    #E6ECF4;
  --status-neutral-fg: #6B6862;
  --status-neutral-bg: #EFEDE7;

  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-pill: 999px;

  --shadow-sm: 0 1px 0 rgba(28,27,23,0.04), 0 1px 2px rgba(28,27,23,0.04);
  --shadow-md: 0 1px 0 rgba(28,27,23,0.04), 0 4px 12px -2px rgba(28,27,23,0.06), 0 12px 24px -8px rgba(28,27,23,0.05);
  --shadow-lg: 0 1px 0 rgba(28,27,23,0.04), 0 4px 12px -2px rgba(28,27,23,0.06), 0 12px 24px -8px rgba(28,27,23,0.05), 0 24px 48px -12px rgba(28,27,23,0.08);

  --font-serif: 'Fraunces', Georgia, serif;
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  --ease-spring: cubic-bezier(0.2, 0.8, 0.2, 1);
  --dur-fast: 150ms;
  --dur-med: 200ms;

  --sidebar-w: 248px;
  --sidebar-w-rail: 64px;
  --topbar-h: 64px;
  --content-max: 1440px;
}

html, body {
  background: var(--bg-app);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

body::before {
  content: "";
  position: fixed; inset: 0;
  pointer-events: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>");
  opacity: 0.025;
  z-index: 0;
}

* { box-sizing: border-box; }

::selection { background: var(--accent-soft); color: var(--accent-hover); }

a { color: inherit; text-decoration: none; }

button { font-family: inherit; cursor: pointer; }

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/css/tokens.css
git commit -m "tokens: palette, type, spacing, shadows, base reset"
```

---

### Task 0.3: Base component CSS (`app.css`)

**Files:**
- Create: `assets/css/app.css`

- [ ] **Step 1: Write `assets/css/app.css` verbatim**

```css
/* ---------- typography helpers ---------- */
.h-display { font-family: var(--font-serif); font-weight: 500; letter-spacing: -0.02em; line-height: 1.15; }
.h1 { font-size: 28px; }
.h2 { font-size: 22px; }
.h3 { font-size: 18px; }
.text-secondary { color: var(--text-secondary); }
.text-muted { color: var(--text-muted); }
.text-caps { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); font-weight: 500; }
.num { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }

/* ---------- surfaces ---------- */
.surface { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); }
.card { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); padding: var(--space-6); }
.card-flush { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); }

/* ---------- buttons ---------- */
.btn { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 14px; border-radius: var(--radius-md); font-weight: 500; font-size: 14px; transition: transform var(--dur-fast) var(--ease-spring), background var(--dur-fast) var(--ease-spring), box-shadow var(--dur-fast) var(--ease-spring); border: 1px solid transparent; white-space: nowrap; }
.btn:active { transform: translateY(1px); }
.btn-primary { background: var(--accent); color: var(--accent-fg); }
.btn-primary:hover { background: var(--accent-hover); }
.btn-secondary { background: var(--bg-surface); color: var(--text-primary); border-color: var(--border-strong); }
.btn-secondary:hover { background: var(--bg-hover); }
.btn-ghost { background: transparent; color: var(--text-secondary); }
.btn-ghost:hover { background: var(--bg-hover); color: var(--text-primary); }
.btn-icon { width: 36px; padding: 0; justify-content: center; }
.btn-sm { height: 28px; padding: 0 10px; font-size: 13px; }

/* ---------- inputs ---------- */
.input { height: 36px; padding: 0 12px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--bg-surface); font-size: 14px; color: var(--text-primary); transition: border var(--dur-fast) var(--ease-spring), box-shadow var(--dur-fast) var(--ease-spring); width: 100%; }
.input:hover { border-color: #BFBBAF; }
.input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.input-search { padding-left: 36px; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B6862' stroke-width='2'><circle cx='11' cy='11' r='7'/><path d='m20 20-3.5-3.5'/></svg>"); background-repeat: no-repeat; background-position: 12px center; }

/* ---------- badges ---------- */
.badge { display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 8px; border-radius: var(--radius-pill); font-size: 12px; font-weight: 500; }
.badge::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: 0.8; }
.badge--success { background: var(--status-success-bg); color: var(--status-success-fg); }
.badge--warning { background: var(--status-warning-bg); color: var(--status-warning-fg); }
.badge--danger  { background: var(--status-danger-bg);  color: var(--status-danger-fg); }
.badge--info    { background: var(--status-info-bg);    color: var(--status-info-fg); }
.badge--neutral { background: var(--status-neutral-bg); color: var(--status-neutral-fg); }
.badge--flat::before { display: none; }

/* ---------- table ---------- */
.table-app { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 14px; }
.table-app thead th { text-align: left; font-weight: 500; font-size: 12px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-muted); padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-surface); position: sticky; top: 0; }
.table-app tbody td { padding: 14px 16px; border-bottom: 1px solid var(--border-subtle); vertical-align: middle; }
.table-app tbody tr { transition: background var(--dur-fast) var(--ease-spring); position: relative; }
.table-app tbody tr:hover { background: var(--bg-hover); }
.table-app tbody tr:hover td:first-child { box-shadow: inset 2px 0 0 var(--accent); }
.table-app tbody tr:last-child td { border-bottom: none; }
.table-app .num-col { text-align: right; }

/* ---------- tabs ---------- */
.tab-bar { display: flex; gap: 4px; border-bottom: 1px solid var(--border-subtle); }
.tab { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; font-size: 14px; color: var(--text-secondary); border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color var(--dur-fast) var(--ease-spring), border-color var(--dur-fast) var(--ease-spring); }
.tab:hover { color: var(--text-primary); }
.tab.is-active { color: var(--text-primary); border-bottom-color: var(--accent); font-weight: 500; }

/* ---------- kanban ---------- */
.kanban { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 12px; }
.kanban-col { flex: 0 0 300px; background: var(--bg-sidebar); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.kanban-col header { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--text-secondary); padding: 4px 6px; }
.kanban-card { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); padding: 12px; cursor: grab; transition: transform var(--dur-fast) var(--ease-spring), box-shadow var(--dur-fast) var(--ease-spring); }
.kanban-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }

/* ---------- avatar ---------- */
.avatar { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; color: #FFF; font-size: 12px; font-weight: 600; letter-spacing: 0.02em; }
.avatar-sm { width: 24px; height: 24px; font-size: 10px; }
.avatar-lg { width: 48px; height: 48px; font-size: 16px; }

/* ---------- KPI card ---------- */
.kpi { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px 22px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 8px; min-height: 116px; }
.kpi-label { font-size: 13px; color: var(--text-secondary); }
.kpi-value { font-family: var(--font-serif); font-size: 36px; font-weight: 500; letter-spacing: -0.02em; line-height: 1; }
.kpi-delta { font-size: 12px; display: inline-flex; align-items: center; gap: 4px; }
.kpi-delta--up { color: var(--status-success-fg); }
.kpi-delta--down { color: var(--status-danger-fg); }

/* ---------- segmented control ---------- */
.segmented { display: inline-flex; padding: 3px; background: var(--bg-sidebar); border: 1px solid var(--border-subtle); border-radius: var(--radius-pill); }
.segmented button { border: 0; background: transparent; padding: 6px 14px; font-size: 13px; color: var(--text-secondary); border-radius: var(--radius-pill); transition: background var(--dur-fast) var(--ease-spring), color var(--dur-fast) var(--ease-spring), box-shadow var(--dur-fast) var(--ease-spring); }
.segmented button.is-active { background: var(--bg-surface); color: var(--text-primary); box-shadow: var(--shadow-sm); font-weight: 500; }

/* ---------- popover ---------- */
.popover { position: absolute; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); min-width: 240px; padding: 6px; z-index: 50; }
.popover-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: var(--radius-sm); color: var(--text-primary); font-size: 14px; }
.popover-item:hover { background: var(--bg-hover); }

/* ---------- empty state ---------- */
.empty { text-align: center; padding: 56px 24px; color: var(--text-secondary); }
.empty h3 { font-family: var(--font-serif); font-size: 20px; color: var(--text-primary); margin-bottom: 8px; }

/* ---------- layout ---------- */
.app-shell { display: grid; grid-template-columns: var(--sidebar-w) 1fr; min-height: 100vh; position: relative; z-index: 1; }
.app-sidebar { background: var(--bg-sidebar); border-right: 1px solid var(--border-subtle); position: sticky; top: 0; height: 100vh; overflow-y: auto; }
.app-main { display: flex; flex-direction: column; min-width: 0; }
.app-topbar { height: var(--topbar-h); border-bottom: 1px solid var(--border-subtle); background: var(--bg-app); position: sticky; top: 0; z-index: 10; display: flex; align-items: center; gap: 16px; padding: 0 32px; }
.app-content { padding: 32px 40px; max-width: var(--content-max); width: 100%; margin: 0 auto; }
.app-header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 24px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 24px; min-height: 80px; }

@media (max-width: 1280px) {
  .app-shell { grid-template-columns: var(--sidebar-w-rail) 1fr; }
  .app-sidebar.is-rail .sidebar-label { display: none; }
}
@media (max-width: 900px) {
  .app-shell { grid-template-columns: 1fr; }
  .app-sidebar { position: fixed; left: -100%; width: var(--sidebar-w); transition: left var(--dur-med) var(--ease-spring); z-index: 30; }
  .app-sidebar.is-open { left: 0; }
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/css/app.css
git commit -m "css: base components (buttons, table, kanban, kpi, tabs, popover, layout)"
```

---

### Task 0.4: Sidebar fragment

**Files:**
- Create: `app/shell/sidebar.html`

- [ ] **Step 1: Write `app/shell/sidebar.html`**

```html
<aside class="app-sidebar" id="appSidebar">
  <div class="px-5 h-16 flex items-center border-b" style="border-color: var(--border-subtle);">
    <div>
      <div class="h-display" style="font-size: 22px;">CRM</div>
      <div class="text-caps">ТД Северное Сияние</div>
    </div>
  </div>

  <nav class="px-3 py-4 flex flex-col gap-5">
    <div>
      <div class="text-caps px-3 mb-2 sidebar-label">Работа</div>
      <ul class="flex flex-col gap-1" data-nav-group>
        <li><a data-nav="dashboard" href="/app/dashboard-owner.html" class="sb-item"><i data-lucide="layout-dashboard"></i><span class="sidebar-label">Рабочий стол</span></a></li>
        <li><a data-nav="leads" href="/app/leads/list.html" class="sb-item"><i data-lucide="sparkles"></i><span class="sidebar-label">Лиды</span><span class="sb-count" data-count="leads-open"></span></a></li>
        <li><a data-nav="deals" href="/app/deals/kanban.html" class="sb-item"><i data-lucide="briefcase"></i><span class="sidebar-label">Сделки</span></a></li>
        <li><a data-nav="tasks" href="/app/tasks/my.html" class="sb-item"><i data-lucide="check-square"></i><span class="sidebar-label">Задачи</span><span class="sb-count" data-count="tasks-overdue"></span></a></li>
      </ul>
    </div>

    <div>
      <div class="text-caps px-3 mb-2 sidebar-label">Клиенты и продажи</div>
      <ul class="flex flex-col gap-1" data-nav-group>
        <li><a data-nav="clients" href="/app/clients/list.html" class="sb-item"><i data-lucide="users"></i><span class="sidebar-label">Клиенты</span></a></li>
        <li><a data-nav="offers" href="/app/offers/list.html" class="sb-item"><i data-lucide="file-text"></i><span class="sidebar-label">КП</span></a></li>
        <li><a data-nav="tenders" href="/app/tenders/list.html" class="sb-item"><i data-lucide="gavel"></i><span class="sidebar-label">Тендеры</span></a></li>
      </ul>
    </div>

    <div>
      <div class="text-caps px-3 mb-2 sidebar-label">Аналитика</div>
      <ul class="flex flex-col gap-1" data-nav-group>
        <li><a data-nav="reports" href="/app/reports/overview.html" class="sb-item"><i data-lucide="bar-chart-3"></i><span class="sidebar-label">Отчёты</span></a></li>
      </ul>
    </div>

    <div data-role="owner">
      <div class="text-caps px-3 mb-2 sidebar-label">Администрирование</div>
      <ul class="flex flex-col gap-1" data-nav-group>
        <li><a data-nav="employees" href="/app/employees/list.html" class="sb-item"><i data-lucide="user-cog"></i><span class="sidebar-label">Сотрудники</span></a></li>
        <li><a data-nav="settings" href="/app/settings/funnels.html" class="sb-item"><i data-lucide="settings"></i><span class="sidebar-label">Настройки</span></a></li>
      </ul>
    </div>
  </nav>

  <div class="mt-auto p-4">
    <div class="surface p-3">
      <div class="flex items-center gap-2 text-sm">
        <span class="w-2 h-2 rounded-full" style="background: var(--status-success-fg);"></span>
        <span class="text-secondary">На смене с 09:14</span>
      </div>
      <div class="mt-1 num text-sm">3 ч 26 мин</div>
      <button class="btn btn-ghost btn-sm mt-2 w-full justify-center">Завершить день</button>
    </div>
  </div>
</aside>

<style>
  .sb-item { display: flex; align-items: center; gap: 12px; height: 36px; padding: 0 12px; border-radius: var(--radius-md); color: var(--text-primary); font-size: 14px; transition: background var(--dur-fast) var(--ease-spring); position: relative; }
  .sb-item:hover { background: var(--bg-hover); }
  .sb-item.is-active { background: var(--accent-soft); color: var(--accent-hover); font-weight: 500; }
  .sb-item.is-active::before { content: ""; position: absolute; left: 0; top: 6px; bottom: 6px; width: 3px; border-radius: 2px; background: var(--accent); }
  .sb-item i { width: 18px; height: 18px; flex: 0 0 18px; }
  .sb-count { margin-left: auto; background: var(--status-danger-bg); color: var(--status-danger-fg); font-size: 11px; padding: 2px 7px; border-radius: var(--radius-pill); font-weight: 500; }
  .sb-count:empty { display: none; }
  .app-sidebar { display: flex; flex-direction: column; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add app/shell/sidebar.html
git commit -m "shell: sidebar fragment with menu groups, counters, day-status footer"
```

---

### Task 0.5: Topbar fragment

**Files:**
- Create: `app/shell/topbar.html`

- [ ] **Step 1: Write `app/shell/topbar.html`**

```html
<header class="app-topbar">
  <button class="btn btn-ghost btn-icon md:hidden" data-action="toggle-sidebar"><i data-lucide="menu"></i></button>

  <div class="h-display h3" data-page-title>Рабочий стол</div>

  <div class="flex-1 max-w-[480px] mx-6 relative">
    <input class="input input-search" placeholder="Найти клиента, сделку, КП, задачу…" data-global-search>
    <kbd class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted border px-1.5 py-0.5 rounded" style="border-color: var(--border-subtle);">⌘K</kbd>
  </div>

  <div class="ml-auto flex items-center gap-3">
    <div class="relative" data-create>
      <button class="btn btn-primary" data-action="open-create"><i data-lucide="plus"></i>Создать</button>
    </div>

    <button class="btn btn-ghost btn-icon relative" data-action="open-notifications">
      <i data-lucide="bell"></i>
      <span class="absolute top-2 right-2 w-2 h-2 rounded-full" style="background: var(--status-danger-fg);"></span>
    </button>

    <div class="segmented" data-role-switch>
      <button data-role-value="owner" class="is-active">Собственник</button>
      <button data-role-value="manager">Менеджер</button>
    </div>

    <button class="flex items-center gap-2" data-action="open-profile">
      <span class="avatar" data-user-avatar>АЦ</span>
    </button>
  </div>
</header>
```

- [ ] **Step 2: Commit**

```bash
git add app/shell/topbar.html
git commit -m "shell: topbar fragment with search, create CTA, role switch, profile"
```

---

### Task 0.6: Shell loader (`shell.js`)

**Files:**
- Create: `assets/js/shell.js`

- [ ] **Step 1: Write `assets/js/shell.js`**

```js
(function () {
  const ROLE_KEY = 'crm.role';
  const ROLES = { owner: { name: 'Анна Царёва', initials: 'АЦ', home: '/app/dashboard-owner.html' },
                  manager: { name: 'Иван Петров', initials: 'ИП', home: '/app/dashboard-manager.html' } };

  function getRole() { return localStorage.getItem(ROLE_KEY) || 'owner'; }
  function setRole(r) { localStorage.setItem(ROLE_KEY, r); }

  async function injectFragment(slot, url) {
    const html = await fetch(url).then(r => r.text());
    slot.outerHTML = html;
  }

  function markActiveNav(routeKey) {
    document.querySelectorAll('[data-nav]').forEach(a => {
      a.classList.toggle('is-active', a.dataset.nav === routeKey);
    });
  }

  function applyRoleVisibility(role) {
    document.querySelectorAll('[data-role]').forEach(el => {
      el.style.display = (el.dataset.role === role) ? '' : 'none';
    });
    const u = ROLES[role];
    const avatar = document.querySelector('[data-user-avatar]');
    if (avatar) avatar.textContent = u.initials;
    document.querySelectorAll('[data-role-value]').forEach(b => {
      b.classList.toggle('is-active', b.dataset.roleValue === role);
    });
  }

  function applyCounters() {
    if (!window.MOCK) return;
    const map = {
      'leads-open': window.MOCK.leads.filter(l => l.status === 'new' || l.status === 'in_work').length,
      'tasks-overdue': window.MOCK.tasks.filter(t => t.status === 'overdue').length,
    };
    document.querySelectorAll('[data-count]').forEach(el => {
      const v = map[el.dataset.count];
      el.textContent = v > 0 ? v : '';
    });
  }

  function wireRoleSwitch() {
    document.querySelectorAll('[data-role-value]').forEach(b => {
      b.addEventListener('click', () => {
        setRole(b.dataset.roleValue);
        location.href = ROLES[b.dataset.roleValue].home;
      });
    });
  }

  async function boot() {
    const sidebarSlot = document.querySelector('[data-shell="sidebar"]');
    const topbarSlot = document.querySelector('[data-shell="topbar"]');
    if (sidebarSlot) await injectFragment(sidebarSlot, '/app/shell/sidebar.html');
    if (topbarSlot) await injectFragment(topbarSlot, '/app/shell/topbar.html');

    const route = document.body.dataset.route;
    const pageTitle = document.body.dataset.title;
    if (route) markActiveNav(route);
    const titleEl = document.querySelector('[data-page-title]');
    if (titleEl && pageTitle) titleEl.textContent = pageTitle;

    applyRoleVisibility(getRole());
    applyCounters();
    wireRoleSwitch();

    if (window.lucide) window.lucide.createIcons();
  }

  document.addEventListener('DOMContentLoaded', boot);
  window.CRM = Object.assign(window.CRM || {}, { getRole, setRole, applyRoleVisibility });
})();
```

- [ ] **Step 2: Commit**

```bash
git add assets/js/shell.js
git commit -m "shell: vanilla JS loader (fragments, active nav, role visibility, counters)"
```

---

### Task 0.7: Relative date helper

**Files:**
- Create: `assets/js/relative-date.js`

- [ ] **Step 1: Write `assets/js/relative-date.js`**

```js
(function () {
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function formatRelative(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = d - now;
    const absMin = Math.round(Math.abs(diffMs) / 60000);
    const absHr = Math.round(absMin / 60);
    const isPast = diffMs < 0;

    if (absMin < 1) return 'только что';
    if (absMin < 60) return isPast ? `${absMin} мин назад` : `через ${absMin} мин`;
    if (absHr < 24 && d.toDateString() === now.toDateString()) {
      return isPast ? `${absHr} ч назад` : `сегодня в ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return `вчера в ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
    if (d.toDateString() === tomorrow.toDateString()) return `завтра ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const months = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
    return `${d.getDate()} ${months[d.getMonth()]} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function formatMoney(rub) {
    return rub.toLocaleString('ru-RU').replace(/,/g, ' ') + ' ₽';
  }

  function fromNowOffsetMin(min) { return new Date(Date.now() + min * 60000).toISOString(); }
  function fromNowOffsetHr(hr) { return fromNowOffsetMin(hr * 60); }
  function fromNowOffsetDay(d) { return fromNowOffsetHr(d * 24); }

  window.CRM = Object.assign(window.CRM || {}, { formatRelative, formatMoney, fromNowOffsetMin, fromNowOffsetHr, fromNowOffsetDay });
})();
```

- [ ] **Step 2: Commit**

```bash
git add assets/js/relative-date.js
git commit -m "util: relative date formatter, money formatter, offset helpers"
```

---

### Task 0.8: Mock data (`mock-data.js`)

**Files:**
- Create: `assets/js/mock-data.js`

- [ ] **Step 1: Write `assets/js/mock-data.js`**

The full file is a long mock dataset. It must populate `window.MOCK` with **exactly** the collections enumerated in spec §5 ("Коллекции"). Use the spec as the contract; the agent implementing this task generates realistic Russian content (8 users with realistic ФИО, 24 B2B clients with names like «ТД Северное Сияние», 40 contacts, 18 leads with statuses `new|in_work|qualified|rejected` and 3 leads carrying `created_at` between 20 and 90 min ago to trigger "without processing >15 min", 22 deals across 5 funnel stages from `crm_project_docs/04_BUSINESS_PROCESSES.md`, deal products, 35 tasks where 4 have `status: 'overdue'`, 12 offers across `draft|sent|viewed|accepted|rejected`, 6 tenders with 2 deadlines within 48 h, 15 messages, 8 notifications, 7 days of `workSessions`, an `activity(entityType, entityId)` function returning a chronological feed).

ID conventions: `CL-0001` clients, `LD-0001` leads, `DL-0001` deals, `TS-0001` tasks, `KP-0001` offers, `TN-0001` tenders, `USR-001` users. All dates as ISO strings generated relative to `Date.now()` using `CRM.fromNowOffsetMin/Hr/Day` defined in Task 0.7. All money in integer rubles.

Skeleton to start from:

```js
(function () {
  const now = Date.now();
  const min = m => new Date(now + m * 60000).toISOString();
  const hr  = h => min(h * 60);
  const day = d => hr(d * 24);

  const users = [
    { id: 'USR-001', name: 'Анна Царёва',    role: 'owner',   email: 'a.tsareva@ts.ru' },
    { id: 'USR-002', name: 'Дмитрий Лапин',  role: 'head_of_sales' },
    { id: 'USR-003', name: 'Иван Петров',    role: 'manager' },
    { id: 'USR-004', name: 'Ольга Соколова', role: 'manager' },
    { id: 'USR-005', name: 'Сергей Морозов', role: 'manager' },
    { id: 'USR-006', name: 'Юлия Белова',    role: 'manager' },
    { id: 'USR-007', name: 'Павел Кузнецов', role: 'tender_specialist' },
    { id: 'USR-008', name: 'Марина Орлова',  role: 'purchaser' },
  ];

  const clients = [
    { id: 'CL-0001', name: 'ТД Северное Сияние', type: 'company', responsible: 'USR-003',
      phone: '+7 495 712-08-44', email: 'orders@nordlight.ru', source: 'Сайт основной',
      status: 'active', dealsSum: 4820000, lastActivity: hr(-2) },
    // ...23 more, mix of company/individual/state, realistic names, varied sources and responsibles
  ];

  const leads = [
    { id: 'LD-0001', title: 'Заявка с сайта · Опт 200 ед.', source: 'Сайт opt',
      status: 'new', responsible: null, createdAt: min(-22), client: null, phone: '+7 916 ...', sum: 240000 },
    // ...17 more; ensure 3 leads have status 'new' AND createdAt older than 15 min
  ];

  // deals, tasks, offers, tenders, messages, notifications, workSessions, activity ...

  window.MOCK = { users, clients, contacts: [], leads, deals: [], dealProducts: [],
    tasks: [], offers: [], tenders: [], messages: [], notifications: [], workSessions: [],
    activity: function (entityType, entityId) { return []; }
  };
})();
```

Acceptance: opening browser console on any page that includes `mock-data.js` and typing `MOCK.leads.length` returns 18, `MOCK.deals.length` returns 22, `MOCK.tasks.filter(t=>t.status==='overdue').length` returns 4.

- [ ] **Step 2: Open `http://localhost:3000/index.html`, then in DevTools console run the three assertions above. They must all return the expected numbers.**

- [ ] **Step 3: Commit**

```bash
git add assets/js/mock-data.js
git commit -m "mock: full dataset (users, clients, leads, deals, tasks, offers, tenders, messages)"
```

---

### Task 0.9: Widgets (`widgets.js`)

**Files:**
- Create: `assets/js/widgets.js`

- [ ] **Step 1: Write `assets/js/widgets.js`**

```js
(function () {
  const PALETTE = ['#1F4A3A','#3A5C8C','#B5841E','#A8392E','#6B6862','#2F7D5C','#7A4B8A','#345E5A'];

  function avatarColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return PALETTE[h % PALETTE.length];
  }

  function initials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0,2).map(s => s[0].toUpperCase()).join('');
  }

  function renderAvatar(name, size) {
    const cls = size === 'sm' ? 'avatar avatar-sm' : size === 'lg' ? 'avatar avatar-lg' : 'avatar';
    return `<span class="${cls}" style="background:${avatarColor(name)}" title="${name}">${initials(name)}</span>`;
  }

  function renderBadge(status, label) {
    const map = { success:'badge--success', warning:'badge--warning', danger:'badge--danger', info:'badge--info', neutral:'badge--neutral' };
    return `<span class="badge ${map[status] || 'badge--neutral'}">${label}</span>`;
  }

  function renderKpiCard({ value, label, delta, trend }) {
    const trendCls = trend === 'up' ? 'kpi-delta--up' : trend === 'down' ? 'kpi-delta--down' : '';
    const arrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';
    const deltaHtml = delta ? `<div class="kpi-delta ${trendCls}"><span>${arrow}</span><span>${delta}</span></div>` : '';
    return `<div class="kpi"><div class="kpi-label">${label}</div><div class="kpi-value num">${value}</div>${deltaHtml}</div>`;
  }

  function renderTable(selector, { columns, rows, empty }) {
    const root = document.querySelector(selector);
    if (!root) return;
    if (!rows.length) {
      root.innerHTML = `<div class="empty"><h3>${empty?.title || 'Пока пусто'}</h3><p>${empty?.body || ''}</p></div>`;
      return;
    }
    const thead = columns.map(c => `<th class="${c.numeric ? 'num-col' : ''}">${c.label}</th>`).join('');
    const tbody = rows.map(r => {
      const tds = columns.map(c => {
        const v = typeof c.render === 'function' ? c.render(r) : r[c.key];
        return `<td class="${c.numeric ? 'num-col num' : ''}">${v == null ? '' : v}</td>`;
      }).join('');
      return `<tr>${tds}</tr>`;
    }).join('');
    root.innerHTML = `<table class="table-app"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
  }

  function renderKanban(selector, { columns, cardsByColumn, cardRenderer }) {
    const root = document.querySelector(selector);
    if (!root) return;
    root.classList.add('kanban');
    root.innerHTML = columns.map(col => {
      const cards = (cardsByColumn[col.id] || []).map(cardRenderer).join('');
      return `<section class="kanban-col">
        <header><span>${col.label}</span><span class="text-muted num">${(cardsByColumn[col.id]||[]).length}</span></header>
        ${cards}
      </section>`;
    }).join('');
  }

  function renderTabs(selector, { tabs, activeId, onChange }) {
    const root = document.querySelector(selector);
    if (!root) return;
    root.classList.add('tab-bar');
    root.innerHTML = tabs.map(t => `<a class="tab ${t.id === activeId ? 'is-active' : ''}" data-tab="${t.id}" href="${t.href || '#'}">${t.label}</a>`).join('');
    if (typeof onChange === 'function') {
      root.querySelectorAll('[data-tab]').forEach(el => el.addEventListener('click', e => {
        e.preventDefault();
        onChange(el.dataset.tab);
      }));
    }
  }

  window.CRM = Object.assign(window.CRM || {}, { renderAvatar, renderBadge, renderKpiCard, renderTable, renderKanban, renderTabs, initials, avatarColor });
})();
```

- [ ] **Step 2: Commit**

```bash
git add assets/js/widgets.js
git commit -m "widgets: renderAvatar/Badge/Kpi/Table/Kanban/Tabs"
```

---

### Task 0.10: Extend `screenshot.mjs` with resolution arg

**Files:**
- Read first: `screenshot.mjs` (existing in repo root)
- Modify: `screenshot.mjs`

- [ ] **Step 1: Read `screenshot.mjs`** with the Read tool to learn its current arg parsing and output filename logic.

- [ ] **Step 2: Add a third positional argument `resolution` accepting one of `desktop` (1920×1080), `compact` (1366×768), `tablet` (768×1024).** When omitted, default to `desktop`. The resolution suffix appends to the screenshot filename, e.g. `screenshot-7-clients-list-tablet.png`.

Implementation must:
- Map presets to `{ width, height }` pairs.
- Call `page.setViewport(...)` with the chosen pair before navigation.
- Pass `deviceScaleFactor: 2` for crisp screenshots.
- Wait for `networkidle0` and an additional 300 ms before screenshotting (lets fonts render).

- [ ] **Step 3: Verify**

Start at repo root with the server running:

```bash
node screenshot.mjs http://localhost:3000/index.html smoke desktop
```

Expected: file `temporary screenshots/screenshot-N-smoke-desktop.png` exists, 1920×1080.

- [ ] **Step 4: Commit**

```bash
git add screenshot.mjs
git commit -m "tools: screenshot.mjs accepts resolution preset (desktop/compact/tablet)"
```

---

### Task 0.11: Page boot template

**Files:**
- Create: `app/shell/_template.html` (reference only — not linked from anywhere)

- [ ] **Step 1: Write `app/shell/_template.html`** as the canonical page skeleton used by every screen in batches 1–6:

```html
<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>__TITLE__ · CRM</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/tokens.css">
  <link rel="stylesheet" href="/assets/css/app.css">
</head>
<body data-route="__ROUTE__" data-title="__TITLE__">
  <div class="app-shell">
    <div data-shell="sidebar"></div>
    <main class="app-main">
      <div data-shell="topbar"></div>
      <div class="app-content">
        <header class="app-header">
          <div>
            <h1 class="h-display h1">__TITLE__</h1>
            <p class="text-secondary">__SUBTITLE__</p>
          </div>
          <div class="flex items-center gap-2"><!-- page actions --></div>
        </header>

        <!-- PAGE CONTENT GOES HERE -->

      </div>
    </main>
  </div>

  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <script src="/assets/js/relative-date.js"></script>
  <script src="/assets/js/mock-data.js"></script>
  <script src="/assets/js/widgets.js"></script>
  <script src="/assets/js/shell.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add app/shell/_template.html
git commit -m "shell: page template used by every screen in subsequent batches"
```

---

## 🛑 CHECKPOINT — Batch 0 complete

Stop here. Confirm with the user that infrastructure (tokens, components, shell loader, mock data, widgets, screenshot tool, page template) is satisfactory before producing the first visual screen.

---

## Batch 1 — Reference screen: Owner dashboard ⭐

This is the screen that fixes the visual language for the entire prototype. Iterate here until the user explicitly approves the visual; only then proceed to Batch 2.

### Task 1.1: Build `dashboard-owner.html`

**Files:**
- Create: `app/dashboard-owner.html`

The page MUST use the `_template.html` skeleton from Task 0.11 with `__ROUTE__ = "dashboard"`, `__TITLE__ = "Рабочий стол"`, `__SUBTITLE__ = "Управленческая сводка · сегодня"`.

Sections inside `app-content`, in order:

1. **Hero strip** (`<section>` directly under `<header class="app-header">`):
   - Background: white surface, `border-radius: var(--radius-lg)`, padding 28px 32px, `box-shadow: var(--shadow-md)`.
   - Overlay radial gradient in top-right corner: `background: radial-gradient(circle at 100% 0%, var(--accent-soft) 0%, transparent 60%);` applied via an absolutely-positioned `::before` or a stacked div.
   - Left: greeting in Fraunces 28px ("Доброе утро, Анна"), short context line in secondary text ("Вторник, 17 мая · 8 проблемных зон требуют внимания").
   - Right: two compact metrics — «Активных сделок» с числом, «Сумма в работе» с суммой через `CRM.formatMoney`.

2. **KPI grid** — 7 cards using `CRM.renderKpiCard`, in a CSS grid `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))`, gap 16px:
   - new leads today (count from `MOCK.leads` where `createdAt` within today),
   - unprocessed leads (count from `MOCK.leads` where status `new`),
   - active deals (count from `MOCK.deals` where stage is not `won|lost`),
   - overdue tasks (count from `MOCK.tasks` where status `overdue`),
   - offers sent (count from `MOCK.offers` where status `sent`),
   - employees online (count from `MOCK.workSessions` for today),
   - tender deadlines <48h (count from `MOCK.tenders`).
   - Each card includes a meaningful `delta` and `trend` value derived from mock numbers (e.g. comparing to yesterday — fine to hardcode the delta string for prototype).

3. **Two-column row** (CSS grid `grid-template-columns: 2fr 1fr`, gap 24px):
   - Left: «Сотрудники сегодня» card. Title (Fraunces 18px) + a `renderTable` with the 9 columns from spec §4 ("Таблица сотрудников"). Rows from `MOCK.workSessions` joined with `MOCK.users`.
   - Right: «Уведомления» panel. Vertical list of last 6 from `MOCK.notifications`, each with status dot, title, secondary line, and relative time.

4. **«Проблемные зоны»** — four equal-width cards in a grid. Each card has a title (Fraunces 18px), a list of items with status badge, primary text, secondary timestamp via `CRM.formatRelative`. Lists, per spec §4: leads without owner, leads without processing >15 min, deals without movement >3 days, overdue tasks, offers without response >24 h, tenders <48 h. Group into the four cards (e.g. Leads / Deals / Offers & Tenders / Tasks — the agent decides grouping but cards must fit one row at 1920px and stack to 2×2 below 1280px).

Each card root must use `.card`. Section gap between hero / KPI grid / two-column row / problem zones: 24px.

- [ ] **Step 1: Build the page following the structure above.**

- [ ] **Step 2: Screenshot all three resolutions**

```bash
node screenshot.mjs http://localhost:3000/app/dashboard-owner.html dashboard-owner desktop
node screenshot.mjs http://localhost:3000/app/dashboard-owner.html dashboard-owner compact
node screenshot.mjs http://localhost:3000/app/dashboard-owner.html dashboard-owner tablet
```

- [ ] **Step 3: Read each PNG via the Read tool and run the visual-acceptance checklist**

Spec §7 global checklist + per-screen:
- [ ] Sidebar visible, "Рабочий стол" pill active with accent left bar.
- [ ] Topbar shows page title, search with `⌘K` chip, "Создать" CTA in deep green, role segmented control showing "Собственник" active, "АЦ" avatar.
- [ ] Hero card has serif greeting, radial gradient in top-right, two compact metric blocks at right.
- [ ] All 7 KPI numbers are serif Fraunces and use `tabular-nums`.
- [ ] Employees table uses `.table-app`, has the 9 columns from spec, rows have hover with accent left bar.
- [ ] Notifications panel shows status dots and relative timestamps.
- [ ] Problem-zone cards use semantic badges (no raw red/yellow hex).
- [ ] No `transition-all` anywhere (grep `transition-all app/dashboard-owner.html` returns nothing).
- [ ] No tailwind default brand colors (grep `indigo-\|blue-5\|blue-6\|green-5\|emerald-` returns nothing in `app/dashboard-owner.html`).
- [ ] All money values run through `CRM.formatMoney`.

- [ ] **Step 4: Iterate until visually clean**

Compare to the spec language for Notion/Stripe vibe. If proportions feel off (numbers too small, spacing too tight, shadow too harsh), fix and re-screenshot. Minimum two full screenshot passes.

- [ ] **Step 5: Commit**

```bash
git add app/dashboard-owner.html "temporary screenshots/"
git commit -m "screen: owner dashboard (reference screen — fixes visual language)"
```

---

## 🛑 CHECKPOINT — Batch 1 visual approval

**Hard stop.** Present the latest dashboard screenshots to the user. Do not proceed to Batch 2 until the user explicitly approves the visual language. After approval, any subsequent change to `tokens.css` or `app.css` triggers a regression re-screenshot of every existing screen (rule from spec §7).

---

## Batch 2 — Manager dashboard + Login

### Task 2.1: `dashboard-manager.html`

**Files:**
- Create: `app/dashboard-manager.html`

Use the template, `__ROUTE__ = "dashboard"`, `__TITLE__ = "Мой рабочий день"`, `__SUBTITLE__ = "Иван Петров · менеджер"`. Sections from spec §5: "Мои задачи на сегодня" (small list, max 6), "Просроченные задачи" (badge danger), "Новые лиды" (compact list with source chip), "Активные сделки" (kanban-style mini cards), "КП на контроле", "Последние сообщения". Right rail: "Быстрые действия" (5 buttons: создать клиента / сделку / задачу / КП / комментарий). Use `.card` and the same widget components as Batch 1 — no new visual primitives.

- [ ] Build the page, screenshot in 3 resolutions, walk the global checklist.
- [ ] Toggle the role segmented control to "Менеджер" in DevTools (`localStorage.setItem('crm.role','manager'); location.reload()`) and confirm the "Сотрудники"/"Настройки" menu items disappear and the home avatar shows "ИП".
- [ ] Commit `feat: manager dashboard`.

### Task 2.2: `login.html`

**Files:**
- Create: `app/login.html`

Standalone page — does NOT include the shell. Same head (Tailwind, fonts, tokens, app.css). Two-column layout: left 480px form (centered vertically) with serif heading «Войти в CRM», email + password inputs (`.input`), checkbox «Запомнить меня», primary button «Войти», ghost link «Забыли пароль?». Right column: gradient panel `background: linear-gradient(135deg, var(--accent-soft) 0%, var(--bg-app) 100%)` with a centered serif quote («Ни одна заявка не теряется. Один интерфейс для всей команды.») and small wordmark.

- [ ] Build, screenshot in 3 resolutions, commit.

---

## 🛑 CHECKPOINT — Batch 2 visual review

Stop. Show user. Proceed when approved.

---

## Batch 3 — List screens

For every task in this batch, the agent: (a) clones the template, sets `__ROUTE__` and `__TITLE__`, (b) writes a single `<div id="root"></div>` inside `app-content`, (c) populates it via the appropriate `CRM.render*` widget in an inline `<script>` at end-of-body, (d) wires page-specific filter controls in the page header zone (segmented controls, dropdowns — all using existing CSS primitives), (e) screenshots in 3 resolutions, (f) walks the global checklist + per-screen acceptance below, (g) commits with `feat: <screen>`.

### Task 3.1: `clients/list.html`

Route `clients`, title «Клиенты». Header right zone: segmented control «Все / Юр.лицо / Физ.лицо / Госы», dropdown «Ответственный», dropdown «Статус», dropdown «Источник», primary button «+ Клиент», secondary button «Импорт Excel».
Table columns from spec §6: название/ФИО, тип, телефон, email, ответственный, статус, последняя активность, сумма сделок (numeric, formatted via `CRM.formatMoney`).
Acceptance extras: ответственный column uses `renderAvatar` + name; статус uses `renderBadge`; «последняя активность» uses `formatRelative`.

### Task 3.2: `leads/list.html`

Route `leads`, title «Лиды». Header right: segmented «Список / Канбан» (linking to `kanban.html`), source/site/responsible/status/date filters, «+ Лид».
Table columns: ID chip, источник (icon+label), название, телефон, ответственный, статус (color-coded badge per spec §8: new=info, in_work=warning, qualified=success, rejected=neutral, +stale=danger), дата поступления (relative).
Acceptance extras: 3 leads must visibly display the **danger badge "Без обработки 22 мин"** (those that are `status: new` AND older than 15 min) — proves the business rule visually.

### Task 3.3: `leads/kanban.html`

Route `leads`, title «Лиды · канбан». Header right: segmented «Список / Канбан» (active=Канбан).
Use `CRM.renderKanban` with columns `[Новый, В работе, Квалифицирован, Отказ]`. Card content: ID chip · название · телефон · аватар ответственного · `formatRelative(createdAt)` · danger badge if stale.

### Task 3.4: `deals/kanban.html`

Route `deals`, title «Сделки». Header right: segmented «Канбан / Таблица / По клиентам», dropdowns «Воронка», «Направление», «Ответственный», «+ Сделка».
Kanban with 5 stages from `crm_project_docs/04_BUSINESS_PROCESSES.md`. Card content per spec §9: номер · клиент · сумма (mono, formatted) · аватар ответственного · `formatRelative(lastActionAt)` · badge danger if «overdue tasks» · count chip «N КП».

### Task 3.5: `deals/list.html`

Route `deals`, title «Сделки · таблица». Header right same as 3.4 (segmented set to Таблица).
Columns: ID, клиент, направление, воронка/этап, сумма, ответственный, дата создания, без движения (badge danger if true).

### Task 3.6: `deals/by-client.html`

Route `deals`, title «Сделки · по клиентам». Header right same family.
Rendering: grouped table — each client appears as a section header (`.h2`) followed by a nested table of their deals. Use `MOCK.deals` joined to `MOCK.clients`.

### Task 3.7–3.11: Tasks views

Files: `app/tasks/my.html`, `app/tasks/dept.html`, `app/tasks/all.html`, `app/tasks/kanban.html`, `app/tasks/calendar.html`. All route=`tasks`. Page-level segmented control «Мои / Отдел / Все / Канбан / Календарь» — same control on every file, only the active item differs and each option `href`s to the corresponding file.

- `my.html`, `dept.html`, `all.html`: same `.table-app` with columns ID, заголовок, исполнитель (avatar), постановщик, приоритет (badge: high=danger, normal=neutral, low=info), статус, дедлайн (relative, danger badge if overdue), связь (chip linking to client/deal/tender).
  - `my.html` filters tasks where `assignee === current user from role` (`USR-003` for manager / `USR-001` for owner — read role from `localStorage`).
  - `dept.html` filters to manager pool (USR-003..USR-006).
  - `all.html` no filter.
- `kanban.html`: columns `[Новая, В работе, На проверке, Выполнена, Просрочена]`. Reuse `renderKanban`.
- `calendar.html`: simple month grid (7 columns, current month). Each day cell shows up to 3 task chips colored by priority; «+N» overflow chip if more. CSS grid, no library.

### Task 3.12: `offers/list.html`

Route `offers`, title «КП». Header right: dropdowns «Статус», «Клиент», «Менеджер», «+ КП».
Columns: ID, клиент, сумма, менеджер, статус (badge: draft=neutral, sent=info, viewed=warning, accepted=success, rejected=danger), создано, отправлено, версия. Row action icons (eye/send/download) appearing on hover.

### Task 3.13: `tenders/list.html`

Route `tenders`, title «Тендеры». Header right: segmented «Список / Календарь», dropdowns «Статус», «Площадка», «+ Тендер».
Columns: ID, название, площадка, заказчик, сумма НМЦ, наш менеджер, дедлайн подачи (badge danger if <48 h), статус.

### Task 3.14: `tenders/calendar.html`

Route `tenders`, title «Тендеры · календарь». Same calendar grid as `tasks/calendar.html` but cells contain tender deadline chips colored by status; click goes to `tenders/card.html?id=...` (link only — card handled in Batch 4).

---

## 🛑 CHECKPOINT — Batch 3 review

Stop, present the list-screen gallery to user. Proceed when approved.

---

## Batch 4 — Entity cards

Per-task pattern same as Batch 3 (template + script-driven rendering + 3-resolution screenshots + commit). Cards introduce a left-content-right-actions layout — define this once in the first card and reuse.

### Task 4.1: `clients/card.html`

Route `clients`, title «Карточка клиента». Read client id from URL query (`?id=CL-0001`) or default to first.

Layout: full-width header strip with avatar (lg), name (Fraunces 28px), id chip, type badge, responsible row. Below it: two columns. Left (flex 1, min-width 0): horizontal tab bar via `CRM.renderTabs` with 8 tabs from spec §7 (Общее / Контакты / Сделки / КП / Задачи / Сообщения / Файлы / История). Active tab is driven by `#tab=` hash; switching just shows/hides 8 `<section data-tab-panel="…">` blocks. Right rail (320px fixed): "Быстрые действия" buttons (создать сделку / задачу / КП / отправить сообщение / загрузить файл) and a metadata card (created at, source, last activity).

Tab content sketches (each tab must be visually finished — no "TBD"):
- Общее: 2-column key-value list (ИНН, КПП, юр.адрес, фактический адрес, сегмент, теги).
- Контакты: small table from `MOCK.contacts` filtered by client.
- Сделки: nested `.table-app` from `MOCK.deals`.
- КП: nested table from `MOCK.offers`.
- Задачи: nested table from `MOCK.tasks` filtered by client.
- Сообщения: vertical chat-feed of `MOCK.messages` for this client. Bubbles aligned left/right by direction, channel chip (telegram/email/internal) in each.
- Файлы: grid of file cards (icon + filename + size + uploaded-by + relative time).
- История: vertical timeline of `MOCK.activity('client', id)` entries with a left rail dot and connector line.

Acceptance: switching `#tab=offers` in the address bar shows only the offers panel. Right rail sticks while scrolling left content. Empty tabs (e.g. no files) render the `.empty` block.

### Task 4.2: `deals/card.html`

Route `deals`, title «Карточка сделки». Read deal id from URL.

Header strip: deal number, client link (anchor to client card), funnel stage as horizontal stage indicator (use 5 small pills, current one filled with accent), sum (Fraunces 28px num), responsible avatar+name, close-button "Закрыть сделку" as ghost danger.

Below: same 2-column layout. Tabs from spec §10 (Обзор / Товары / КП / Задачи / Коммуникации / Файлы / История). Right rail action buttons from spec §10: «создать КП», «поставить задачу», «добавить товар», «добавить комментарий», «отправить сообщение». Greyed-out stage-2 buttons «запросить резерв в 1С», «выставить счет» with a small "Этап 2" badge.

Tab content sketches:
- Обзор: summary card with key fields + last activity timeline (compact).
- Товары: editable-looking table (qty inputs styled but non-functional), totals row at bottom (subtotal / НДС 20% / итого), all in mono tabular-nums.
- КП: list of offers for this deal with status badges and "Открыть PDF" link to `offers/view.html?id=…`.
- Задачи: filtered task list.
- Коммуникации: same chat-feed pattern as client card.
- Файлы: grid pattern from client card.
- История: timeline pattern from client card.

### Task 4.3: `offers/view.html`

Route `offers`, title «Просмотр КП». Read offer id from URL.

Two-column layout (NO tabs). Left ~720px: A4-proportioned card emulating the PDF — company header (logo placeholder block + requisites), client block, offer table (товары/qty/цена/сумма) in monospace, totals, footer signature block. Right rail: metadata (статус badge, версия N, создано, отправлено, открыто, действует до) + action buttons «Отправить email», «Отправить в Telegram», «Скачать PDF», «Создать версию», history accordion of previous versions.

### Task 4.4: `tenders/card.html`

Route `tenders`, title «Карточка тендера». Header strip with name, площадка chip, статус badge, дедлайн подачи with countdown (e.g. «До дедлайна: 1 д 14 ч», danger color if <48h). Two-column with tabs `[Обзор / Документы / Расчёт / Задачи / Результат]`.

- Обзор: НМЦ, заказчик, регион, ОКПД, ссылка на площадку (внешняя стрелка), описание.
- Документы: file grid.
- Расчёт: simple cost calculator table (себестоимость / маржа / итог), styled inputs but non-functional.
- Задачи: filtered task list.
- Результат: pending / won / lost states; if лотов >1 show per-lot result.

---

## 🛑 CHECKPOINT — Batch 4 review

Stop. Show user. Proceed when approved.

---

## Batch 5 — Reports, Employees, Settings (owner-only)

### Task 5.1–5.7: Reports

Files: `app/reports/overview.html`, `tasks.html`, `managers.html`, `offers.html`, `leads.html`, `deals.html`, `time.html`, `tenders.html`. Route=`reports`. Page-level segmented control across all 8 (overview + 7 sections).

Include Chart.js via CDN in each:
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
```

Chart styling rules — apply to **every** chart in these files via a shared `Chart.defaults` override placed inline at the top of each script block:
```js
Chart.defaults.color = '#6B6862';
Chart.defaults.font.family = "Inter, system-ui, sans-serif";
Chart.defaults.borderColor = '#EBE9E2';
```
Dataset color must be `--accent` (`#1F4A3A`), secondary series cycle through the status palette (`#3A5C8C`, `#B5841E`, `#A8392E`, `#2F7D5C`). No default Chart.js blue.

Each report page: 2–4 charts (bar, line, donut as fits the topic) + a supporting table. Numbers from `MOCK`. `overview.html` is a dashboard of 6 mini-charts.

### Task 5.8: `employees/list.html`

Route=`employees`, title «Сотрудники». Same column set as the owner dashboard employee table (spec §4) plus an "Действия" column (icon buttons). Rows from `MOCK.users` joined with `MOCK.workSessions` and counts from tasks/offers/deals. Click row → `card.html?id=…`.

### Task 5.9: `employees/card.html`

Route=`employees`, title «Карточка сотрудника». Header: avatar lg, name (Fraunces 28px), role chip, contacts. Tabs `[Обзор / Задачи / Сделки / КП / Время]`. Each tab uses already-defined widgets.

### Task 5.10–5.14: Settings

Files: `app/settings/funnels.html`, `offer-templates.html`, `lead-sources.html`, `site-tokens.html`, `integrations.html`. Route=`settings`. Same segmented control switching between the 5 files in the page header zone.

Each file: a `.card` with a relevant table + action buttons (`+ Добавить ...`). Forms styled but non-functional. `integrations.html` shows tiles for Telegram / Email / 1С / Сайты-вебхуки with connection status badges (Telegram=success, остальные=neutral with "Не подключено").

---

## 🛑 CHECKPOINT — Batch 5 review

Stop. Show user. Proceed when approved.

---

## Batch 6 — Overlays, empty states, 404

### Task 6.1: Create modals

**Files:**
- Create: `app/shell/modals/create-client.html`
- Create: `app/shell/modals/create-deal.html`
- Create: `app/shell/modals/create-task.html`
- Create: `app/shell/modals/create-offer.html`
- Modify: `assets/js/shell.js` (add `openModal(name)` + `closeModal()`, lazy-fetch fragment on first open, append to a `#modal-root` div appended to `<body>`, wire `data-action="open-create"` dropdown buttons).

Each modal fragment is a centered card (max-width 560px) with backdrop. Heading (Fraunces 22px), form (relevant inputs using `.input`, `.btn-primary` "Сохранить" + `.btn-ghost` "Отмена"), focus-trap not required (prototype), close on `Esc` and backdrop click.

- [ ] After implementation, on any page click "+ Создать" → "Клиент"; modal appears. Click backdrop; modal closes. Screenshot the modal open state on `dashboard-owner.html`.

### Task 6.2: Notifications popover + Profile popover

**Files:**
- Modify: `assets/js/shell.js`

Wire `data-action="open-notifications"` to a popover positioned below the bell button, content from `MOCK.notifications`. Wire `data-action="open-profile"` to a popover with «Профиль», «Настройки», «Выйти». Both popovers close on outside-click. Use `.popover` and `.popover-item` from `app.css`.

- [ ] Screenshot dashboard with notifications popover open.

### Task 6.3: Command palette (`⌘K`)

**Files:**
- Create: `app/shell/modals/command-palette.html`
- Modify: `assets/js/shell.js`

Listen for `cmd+k`/`ctrl+k`, open a centered top-aligned (top:120px) overlay with a large search input and grouped suggestions: Клиенты / Сделки / Лиды / Задачи / КП / Тендеры — filtered live from `MOCK`. Keyboard navigation arrows + Enter. Close on `Esc`.

- [ ] Screenshot `cmd+k` open with «север» typed; should show «ТД Северное Сияние».

### Task 6.4: Empty states audit

Go through every list-style screen from Batch 3 and the table tabs in Batch 4. For each, add a `data-empty` query param that hides all mock rows and triggers the widgets' empty state. Hit each URL with `?empty=1`, screenshot, confirm `.empty` block renders. (No code change to widgets — `mock-data.js` reads `?empty=1` and zeros out the relevant collection for that page only.)

### Task 6.5: Skeleton states

**Files:**
- Modify: `assets/css/app.css` — append `.skel { background: linear-gradient(90deg, var(--bg-hover) 0%, var(--bg-sidebar) 50%, var(--bg-hover) 100%); background-size: 200% 100%; animation: skel 1.2s linear infinite; border-radius: var(--radius-sm); }` and `@keyframes skel { from { background-position: 0 0 } to { background-position: -200% 0 } }`.
- Modify: `dashboard-owner.html`, `deals/kanban.html`, `clients/list.html` — wrap their initial render in a 600 ms `setTimeout` and show `.skel` placeholders (KPI value shimmer, table rows shimmer, kanban card shimmer) in the meantime, but only when URL has `?skeleton=1`.

- [ ] Screenshot all three with `?skeleton=1` to confirm shimmer renders.

### Task 6.6: `404.html`

**Files:**
- Create: `app/404.html`

Standalone (no shell). Centered Fraunces 48px «404», Inter secondary line «Страница не найдена», `.btn-primary` "На рабочий стол" linking to `/`. Background uses the accent radial gradient from the dashboard hero.

### Task 6.7: Final QA pass

- [ ] Run a grep over the whole `app/` and `assets/` tree for forbidden patterns:

```bash
grep -RnE "transition-all|indigo-|blue-5|blue-6|emerald-|green-5" app assets || echo OK
```
Expected output: `OK`.

- [ ] Re-screenshot the four headline screens (`dashboard-owner.html`, `dashboard-manager.html`, `deals/kanban.html`, `clients/card.html`) at `desktop` resolution as the final deliverable set. Commit them with `qa: final screenshots`.

- [ ] Commit any leftover changes:

```bash
git add -A
git commit -m "qa: final pass — empty states, skeletons, 404, lint"
```

---

## 🛑 FINAL CHECKPOINT

Run the demo flow with the user in the browser:
`login.html → dashboard-owner.html → switch role → dashboard-manager.html → switch back → deals/kanban.html → click deal → deals/card.html → "создать КП" → modal → close → back to dashboard`.

Project complete when the user confirms the demo flow looks good across the three resolutions.
