(function () {
  const ROLE_KEY = 'crm.role';
  const ROLES = { owner:   { id: 'USR-001', name: 'Анна Царёва',              initials: 'АЦ', home: '/app/dashboard-owner.html' },
                  manager: { id: 'USR-003', name: 'Морозова Екатерина',         initials: 'МЕ', home: '/app/dashboard-manager.html' } };

  function getRole() { return localStorage.getItem(ROLE_KEY) || 'owner'; }
  function setRole(r) { localStorage.setItem(ROLE_KEY, r); }

  function logout() {
    localStorage.removeItem(ROLE_KEY);
    location.href = '/app/login.html';
  }

  // ─── MOBILE SIDEBAR ────────────────────────────────────────────────────────

  let sidebarScrim = null;

  function closeSidebar() {
    const sb = document.getElementById('appSidebar');
    if (sb) sb.classList.remove('is-open');
    if (sidebarScrim) {
      const sc = sidebarScrim;
      sidebarScrim = null;
      sc.classList.remove('is-show');
      setTimeout(() => sc.remove(), 260);
    }
  }

  function toggleSidebar() {
    const sb = document.getElementById('appSidebar');
    if (!sb) return;
    if (sb.classList.contains('is-open')) { closeSidebar(); return; }
    sb.classList.add('is-open');
    sidebarScrim = document.createElement('div');
    sidebarScrim.className = 'sidebar-scrim';
    sidebarScrim.addEventListener('click', closeSidebar);
    document.body.appendChild(sidebarScrim);
    requestAnimationFrame(() => { if (sidebarScrim) sidebarScrim.classList.add('is-show'); });
  }

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

  // ─── MODAL SYSTEM ──────────────────────────────────────────────────────────

  const modalCache = {};
  let activeBackdrop = null;
  let escHandler = null;

  async function loadModal(name) {
    if (!modalCache[name]) {
      modalCache[name] = await fetch(`/app/shell/modals/${name}.html`).then(r => r.text());
    }
    return modalCache[name];
  }

  function getModalRoot() {
    let root = document.getElementById('modal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'modal-root';
      document.body.appendChild(root);
    }
    return root;
  }

  function closeModal() {
    if (!activeBackdrop) return;
    const bd = activeBackdrop;
    activeBackdrop = null;
    bd.classList.remove('is-open');
    if (escHandler) {
      document.removeEventListener('keydown', escHandler);
      escHandler = null;
    }
    setTimeout(() => { bd.remove(); }, 260);
  }

  async function openModal(name) {
    // close any existing modal first
    if (activeBackdrop) closeModal();

    const html = await loadModal(name);
    const isCmdk = name === 'command-palette';

    const bd = document.createElement('div');
    bd.className = 'modal-backdrop' + (isCmdk ? ' is-cmdk' : '');
    bd.setAttribute('data-modal-name', name);
    bd.innerHTML = html;

    getModalRoot().appendChild(bd);
    activeBackdrop = bd;

    // wire close buttons
    bd.querySelectorAll('[data-modal-close]').forEach(el => {
      el.addEventListener('click', closeModal);
    });

    // backdrop click to close (but not clicks on the modal shell itself)
    bd.addEventListener('click', e => {
      if (e.target === bd) closeModal();
    });

    // Escape key
    escHandler = e => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', escHandler);

    // run lucide on the new fragment
    if (window.lucide) window.lucide.createIcons({ el: bd });

    // cmd-k specific wiring
    if (isCmdk) {
      const input = bd.querySelector('[data-cmdk-input]');
      const results = bd.querySelector('[data-cmdk-results]');
      if (input && results) {
        renderCmdkResults(results, '');
        if (window.lucide) window.lucide.createIcons({ el: results });
        input.addEventListener('input', () => {
          renderCmdkResults(results, input.value.trim());
          if (window.lucide) window.lucide.createIcons({ el: results });
        });
        input.addEventListener('keydown', e => {
          handleCmdkArrows(e, results);
        });
        // focus the input
        requestAnimationFrame(() => input.focus());
      }
    }

    // animate open on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { bd.classList.add('is-open'); });
    });
  }

  // ─── COMMAND PALETTE LOGIC ────────────────────────────────────────────────

  const CREATE_ACTIONS = [
    { label: 'Новый клиент',  icon: 'users',        modal: 'create-client' },
    { label: 'Новый лид',     icon: 'zap',          modal: 'create-lead' },
    { label: 'Новая сделка',  icon: 'handshake',    modal: 'create-deal' },
    { label: 'Новая задача',  icon: 'check-square', modal: 'create-task' },
    { label: 'Новое КП',      icon: 'file-text',    modal: 'create-offer' },
    { label: 'Новый тендер',  icon: 'gavel',        modal: 'create-tender' },
  ];

  function renderCmdkResults(container, query) {
    const q = query.toLowerCase();

    if (!q) {
      // Quick actions
      const items = CREATE_ACTIONS.map(a => {
        const href = a.modal ? '#' : '#';
        return `<a href="${href}" class="cmdk-item" data-cmdk-action="${a.modal || ''}" style="text-decoration:none; color: inherit;">
          <i data-lucide="${a.icon}" style="width:14px;height:14px;color:var(--text-muted);"></i>
          <span>${a.label}</span>
        </a>`;
      }).join('');
      container.innerHTML = `<div class="cmdk-group-title">Быстрые действия</div>${items}`;

      container.querySelectorAll('[data-cmdk-action]').forEach(el => {
        el.addEventListener('click', e => {
          e.preventDefault();
          const modalName = el.dataset.cmdkAction;
          closeModal();
          if (modalName) setTimeout(() => openModal(modalName), 50);
        });
      });
      return;
    }

    const M = window.MOCK;
    if (!M) { container.innerHTML = ''; return; }

    const groups = [];

    // Clients
    const clients = M.clients.filter(c => c.name.toLowerCase().includes(q)).slice(0, 6);
    if (clients.length) {
      groups.push(`<div class="cmdk-group-title">Клиенты</div>` +
        clients.map(c => `<a href="/app/clients/card.html?id=${c.id}" class="cmdk-item" style="text-decoration:none; color:inherit;">
          <i data-lucide="users" style="width:14px;height:14px;color:var(--text-muted);"></i>
          <span>${c.name}</span>
          <span class="id-chip">${c.id}</span>
        </a>`).join(''));
    }

    // Deals
    const deals = M.deals.filter(d => d.title.toLowerCase().includes(q) || d.number.toLowerCase().includes(q)).slice(0, 6);
    if (deals.length) {
      groups.push(`<div class="cmdk-group-title">Сделки</div>` +
        deals.map(d => `<a href="/app/deals/card.html?id=${d.id}" class="cmdk-item" style="text-decoration:none; color:inherit;">
          <i data-lucide="handshake" style="width:14px;height:14px;color:var(--text-muted);"></i>
          <span>${d.title}</span>
          <span class="id-chip">${d.number}</span>
        </a>`).join(''));
    }

    // Leads
    const leads = M.leads.filter(l => l.title.toLowerCase().includes(q)).slice(0, 6);
    if (leads.length) {
      groups.push(`<div class="cmdk-group-title">Лиды</div>` +
        leads.map(l => `<a href="#" class="cmdk-item" style="text-decoration:none; color:inherit;">
          <i data-lucide="zap" style="width:14px;height:14px;color:var(--text-muted);"></i>
          <span>${l.title}</span>
          <span class="id-chip">${l.id}</span>
        </a>`).join(''));
    }

    // Offers
    const offers = M.offers.filter(o => o.number.toLowerCase().includes(q)).slice(0, 6);
    if (offers.length) {
      groups.push(`<div class="cmdk-group-title">КП</div>` +
        offers.map(o => `<a href="#" class="cmdk-item" style="text-decoration:none; color:inherit;">
          <i data-lucide="file-text" style="width:14px;height:14px;color:var(--text-muted);"></i>
          <span>${o.number}</span>
          <span class="id-chip">${o.id}</span>
        </a>`).join(''));
    }

    // Tenders
    const tenders = M.tenders.filter(t => t.title.toLowerCase().includes(q)).slice(0, 6);
    if (tenders.length) {
      groups.push(`<div class="cmdk-group-title">Тендеры</div>` +
        tenders.map(t => `<a href="#" class="cmdk-item" style="text-decoration:none; color:inherit;">
          <i data-lucide="landmark" style="width:14px;height:14px;color:var(--text-muted);"></i>
          <span>${t.title}</span>
          <span class="id-chip">${t.id}</span>
        </a>`).join(''));
    }

    // Tasks
    const tasks = M.tasks.filter(t => t.title.toLowerCase().includes(q)).slice(0, 6);
    if (tasks.length) {
      groups.push(`<div class="cmdk-group-title">Задачи</div>` +
        tasks.map(t => `<a href="#" class="cmdk-item" style="text-decoration:none; color:inherit;">
          <i data-lucide="check-square" style="width:14px;height:14px;color:var(--text-muted);"></i>
          <span>${t.title}</span>
          <span class="id-chip">${t.id}</span>
        </a>`).join(''));
    }

    container.innerHTML = groups.length
      ? groups.join('')
      : `<div style="padding: var(--space-6); text-align:center; color:var(--text-muted); font-size:14px;">Ничего не найдено</div>`;
  }

  function handleCmdkArrows(e, container) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter') return;
    e.preventDefault();
    const items = [...container.querySelectorAll('.cmdk-item')];
    if (!items.length) return;
    const focused = container.querySelector('.cmdk-item.is-focus');
    let idx = focused ? items.indexOf(focused) : -1;
    if (e.key === 'ArrowDown') idx = Math.min(idx + 1, items.length - 1);
    if (e.key === 'ArrowUp')   idx = Math.max(idx - 1, 0);
    if (e.key === 'Enter' && focused) { focused.click(); return; }
    items.forEach(i => i.classList.remove('is-focus'));
    if (idx >= 0) items[idx].classList.add('is-focus');
  }

  // ─── POPOVER HELPER ────────────────────────────────────────────────────────

  let activePopover = null;
  let popoverOutsideHandler = null;

  function closePopover() {
    if (!activePopover) return;
    activePopover.remove();
    activePopover = null;
    if (popoverOutsideHandler) {
      document.removeEventListener('click', popoverOutsideHandler, true);
      popoverOutsideHandler = null;
    }
  }

  function openPopover(anchor, contentHTML, opts = {}) {
    closePopover();

    const pop = document.createElement('div');
    pop.className = 'popover';
    pop.innerHTML = contentHTML;

    // position relative to anchor's parent (which must be position:relative)
    const parent = anchor.closest('[data-create], [data-notif-wrap], [data-profile-wrap]') || anchor.parentElement;
    parent.style.position = 'relative';
    parent.appendChild(pop);
    activePopover = pop;

    // align: default left-align below anchor
    pop.style.top = (anchor.offsetHeight + 6) + 'px';
    pop.style.right = opts.alignRight ? '0' : 'auto';
    pop.style.left  = opts.alignRight ? 'auto' : '0';

    // close on outside click
    setTimeout(() => {
      popoverOutsideHandler = e => {
        if (!pop.contains(e.target) && e.target !== anchor) closePopover();
      };
      document.addEventListener('click', popoverOutsideHandler, true);
    }, 0);

    if (window.lucide) window.lucide.createIcons({ el: pop });
    return pop;
  }

  // ─── CREATE DROPDOWN ───────────────────────────────────────────────────────

  const CREATE_MENU = [
    { label: 'Клиент',  icon: 'users',        modal: 'create-client' },
    { label: 'Лид',     icon: 'zap',          modal: 'create-lead' },
    { label: 'Сделка',  icon: 'handshake',    modal: 'create-deal' },
    { label: 'Задача',  icon: 'check-square', modal: 'create-task' },
    { label: 'КП',      icon: 'file-text',    modal: 'create-offer' },
    { label: 'Тендер',  icon: 'gavel',        modal: 'create-tender' },
  ];

  // entity type → create modal (used by page-level buttons and empty-states)
  const CREATE_TYPE_MODAL = {
    client: 'create-client',
    lead:   'create-lead',
    deal:   'create-deal',
    task:   'create-task',
    offer:  'create-offer',
    tender: 'create-tender',
  };

  function openCreateMenu(anchor) {
    const html = CREATE_MENU.map(item => `
      <button class="popover-item" data-create-item="${item.modal || ''}">
        <i data-lucide="${item.icon}" style="width:16px;height:16px;color:var(--text-muted);"></i>
        ${item.label}
      </button>
    `).join('');

    const pop = openPopover(anchor, html, { alignRight: false });

    pop.querySelectorAll('[data-create-item]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalName = btn.dataset.createItem;
        closePopover();
        if (modalName) openModal(modalName);
      });
    });
  }

  // ─── NOTIFICATIONS POPOVER ─────────────────────────────────────────────────

  function openNotificationsPopover(anchor) {
    const header = `<div style="padding: 10px 12px 6px; font-size:13px; font-weight:600; color:var(--text-primary); border-bottom: 1px solid var(--border-subtle); margin-bottom:4px;">Уведомления</div>`;
    const listDiv = `<div id="shell-notif-list" class="notif-list" style="min-width:320px;max-height:400px;overflow-y:auto;"></div>`;
    const footer = `<div style="padding:6px 4px 2px;border-top:1px solid var(--border-subtle);margin-top:4px;"><button class="btn btn-ghost" style="width:100%;justify-content:center;font-size:13px;">Все уведомления</button></div>`;

    const wrap = anchor.closest('[data-notif-wrap]') || (() => {
      const w = document.createElement('div');
      w.setAttribute('data-notif-wrap', '');
      w.style.cssText = 'position:relative;display:inline-flex;';
      anchor.parentNode.insertBefore(w, anchor);
      w.appendChild(anchor);
      return w;
    })();

    openPopover(anchor, header + listDiv + footer, { alignRight: true });

    if (window.CRM && window.CRM.renderNotifList && window.MOCK) {
      window.CRM.renderNotifList('#shell-notif-list', window.MOCK.notifications, 6);
    }
  }

  // ─── PROFILE POPOVER ───────────────────────────────────────────────────────

  function openProfilePopover(anchor) {
    const user = ROLES[getRole()];
    const items = [
      { icon: 'user-circle', label: 'Профиль',   danger: false, action: 'profile'  },
      { icon: 'settings',    label: 'Настройки', danger: false, action: 'settings' },
      { icon: 'log-out',     label: 'Выйти',     danger: true,  action: 'logout'   },
    ];
    const html = items.map(it => `
      <button class="popover-item" data-profile-action="${it.action}" ${it.danger ? `style="color:var(--status-danger-fg);"` : ''}>
        <i data-lucide="${it.icon}" style="width:16px;height:16px;${it.danger ? 'color:var(--status-danger-fg);' : 'color:var(--text-muted);'}"></i>
        ${it.label}
      </button>
    `).join('');

    const wrap = anchor.closest('[data-profile-wrap]') || (() => {
      const w = document.createElement('div');
      w.setAttribute('data-profile-wrap', '');
      w.style.cssText = 'position:relative;display:inline-flex;';
      anchor.parentNode.insertBefore(w, anchor);
      w.appendChild(anchor);
      return w;
    })();

    const pop = openPopover(anchor, html, { alignRight: true });

    pop.querySelectorAll('[data-profile-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.profileAction;
        closePopover();
        if (action === 'logout')   logout();
        if (action === 'profile')  location.href = `/app/employees/card.html?id=${user.id}`;
        if (action === 'settings') location.href = '/app/settings/funnels.html';
      });
    });
  }

  // ─── TOPBAR ACTION WIRING ─────────────────────────────────────────────────

  function wireTopbarActions() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;

      if (action === 'toggle-sidebar') {
        e.stopPropagation();
        toggleSidebar();
      }

      if (action === 'open-modal' && btn.dataset.modal) {
        openModal(btn.dataset.modal);
      }

      if (action === 'open-create') {
        e.stopPropagation();
        // empty-state buttons carry data-type → open the matching modal directly
        const direct = CREATE_TYPE_MODAL[btn.dataset.type];
        if (direct) { openModal(direct); return; }
        if (activePopover && btn.parentElement.contains(activePopover)) {
          closePopover();
        } else {
          openCreateMenu(btn);
        }
      }

      if (action === 'open-notifications') {
        e.stopPropagation();
        if (activePopover) { closePopover(); return; }
        openNotificationsPopover(btn);
      }

      if (action === 'open-profile') {
        e.stopPropagation();
        if (activePopover) { closePopover(); return; }
        openProfilePopover(btn);
      }
    });
  }

  // ─── GLOBAL ⌘K HANDLER ────────────────────────────────────────────────────

  function wireCommandPalette() {
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openModal('command-palette');
      }
    });

    // Wire the search input in the topbar to open palette on click/focus
    document.addEventListener('click', e => {
      if (e.target.closest('[data-global-search]')) {
        openModal('command-palette');
      }
    });
  }

  // ─── _modal URL PARAM (screenshots) ────────────────────────────────────────

  function checkUrlModalParam() {
    const params = new URLSearchParams(location.search);
    const name = params.get('_modal');
    if (name) setTimeout(() => openModal(name), 400);
  }

  // ─── BOOT ──────────────────────────────────────────────────────────────────

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
    wireTopbarActions();
    wireCommandPalette();
    checkUrlModalParam();

    if (window.lucide) window.lucide.createIcons();
  }

  document.addEventListener('DOMContentLoaded', boot);
  window.CRM = Object.assign(window.CRM || {}, { getRole, setRole, applyRoleVisibility, openModal, closeModal, logout });
})();
