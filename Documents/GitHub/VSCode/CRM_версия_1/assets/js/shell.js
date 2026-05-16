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
