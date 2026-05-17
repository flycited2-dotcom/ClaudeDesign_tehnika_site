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

  function renderNotifList(selector, notifications, limit) {
    const root = document.querySelector(selector);
    if (!root) return;
    const severityColor = {
      info:    'var(--status-info-fg)',
      success: 'var(--status-success-fg)',
      warning: 'var(--status-warning-fg)',
      danger:  'var(--status-danger-fg)',
      neutral: 'var(--status-neutral-fg)',
    };
    const cap = limit !== undefined ? limit : 6;
    const sorted = [...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, cap);
    root.innerHTML = sorted.map(n => `
      <div class="notif-item">
        <div class="notif-dot" style="background:${severityColor[n.severity] || severityColor.neutral};"></div>
        <div class="notif-body">
          <div class="notif-title">${n.title}</div>
          <div class="notif-text">${n.body}</div>
        </div>
        <div class="notif-ts">${window.CRM.formatRelative(n.createdAt)}</div>
      </div>
    `).join('');
  }

  function renderProblemItem(badge, text, ts) {
    return `
      <div class="problem-item">
        <div style="flex-shrink:0;">${badge}</div>
        <div class="problem-item-text" title="${text}">${text}</div>
        <div class="problem-item-ts">${window.CRM.formatRelative(ts)}</div>
      </div>
    `;
  }

  function renderProblemCard(title, items, cap) {
    const limit = cap !== undefined ? cap : 5;
    const shown = items.slice(0, limit);
    const extra = items.length - shown.length;
    return `
      <div class="card">
        <div class="problem-card-title">${title}</div>
        ${shown.map(i => renderProblemItem(
          window.CRM.renderBadge(i.severity, i.label),
          i.text,
          i.ts
        )).join('')}
        ${shown.length === 0 ? '<p style="font-size:13px;color:var(--text-muted);">Нет проблем</p>' : ''}
        ${extra > 0 ? `<div class="problem-more">… +${extra} ещё</div>` : ''}
      </div>
    `;
  }

  window.CRM = Object.assign(window.CRM || {}, { renderAvatar, renderBadge, renderKpiCard, renderTable, renderKanban, renderTabs, renderNotifList, renderProblemItem, renderProblemCard, initials, avatarColor });
})();
