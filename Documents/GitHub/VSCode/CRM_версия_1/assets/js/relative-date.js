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
    return rub.toLocaleString('ru-RU').replace(/,/g, ' ') + ' ₽';
  }

  function fromNowOffsetMin(min) { return new Date(Date.now() + min * 60000).toISOString(); }
  function fromNowOffsetHr(hr) { return fromNowOffsetMin(hr * 60); }
  function fromNowOffsetDay(d) { return fromNowOffsetHr(d * 24); }

  window.CRM = Object.assign(window.CRM || {}, { formatRelative, formatMoney, fromNowOffsetMin, fromNowOffsetHr, fromNowOffsetDay });
})();
