# Iter 14 — Real /bot landing (phone-mockup + 5 scenarios)

**Дата:** 2026-05-16
**Статус:** Утверждён к реализации (брейнсторм 2026-05-16, 4/4 вопросов закрыты)
**Референс:** `design-template/unzipped/screen-bot.jsx` (180 строк, готовая разметка)
**Зависимый коммит:** `b4d9e47` (Iter 13 — текущая stub `/bot/page.tsx`)

## Цель

Заменить заглушку `/bot` на полноценный лендинг Telegram-агента по образцу
шаблона: hero + список capabilities + QR-карточка + интерактивный phone-mockup
с переключателем 5 сценариев диалога.

CSS-классы (`.bot-frame`, `.bot-side`, `.bot-cap`, `.tg-phone`, `.tg-screen`,
`.tg-msg`, `.tg-card`, `.tg-buttons`, `.tg-quick`, `.tg-voice`, `.qr-card`,
`.tg-input-bar`, ...) уже присутствуют в `src/styles/glass-template.css`
(45 матчей) — портирование стилей не требуется.

## Решения брейнсторма

| Вопрос | Решение |
| --- | --- |
| QR + Telegram-привязка | **Плейсхолдер `@buttehopt_bot`** (как в шаблоне; в комменте помечено, что мок). |
| Набор сценариев | **Все 5:** Поиск / Голос / Сравнение / Тендер / Заказ. |
| Иконки | **lucide-react** (уже подключён) с маппингом 14 имён. |
| Архитектура | **Server page + client island.** Page — `metadata` и контейнер; `<BotDemo />` — client component с `useState`. |

## Архитектура

### Файлы

#### 1. `src/app/bot/page.tsx` — ПЕРЕПИСАТЬ (server)

- Удалить заглушку (bread + section-head + glass-карточка).
- `metadata`: оставить `robots: { index: false, follow: false }`, обновить
  `title` и `description` под реальный контент.
- Render: `<BotDemo />` напрямую в RSC-границе (client island, без props).

Структура страницы рендерится внутри `<BotDemo />` — page остаётся тонкой
обёрткой ради metadata + RSC-границы.

#### 2. `src/components/bot-demo.tsx` — НОВЫЙ (client)

`"use client"`. Содержит ВЕСЬ лендинг (левая колонка + phone-mockup) — это
единый интерактивный блок, переключатель и mockup меняются вместе.

**Структура:**

```
<section className="bot-frame" data-screen-label="Bot">
  <div className="bot-side">
    <span className="b2b-pill"><Bot /> AI-агент по продажам</span>
    <h2>Менеджер по продажам, который не спит и знает весь склад наизусть</h2>
    <p className="sub">…</p>
    <div className="bot-cap">
      {CAPABILITIES.map(({ icon: Icon, label }) => (
        <div className="bot-cap-row"><span className="ic"><Icon size={16}/></span>{label}</div>
      ))}
    </div>
    <div className="qr-card">
      <div className="qr" />
      <div>
        <div className="nm">@buttehopt_bot</div>
        <div className="meta">t.me/buttehopt_bot</div>
        <button className="btn btn-sm btn-primary">Открыть в Telegram</button>
      </div>
    </div>
    <div style={...}>
      <div>Сценарий диалога</div>
      {TG_PRESETS.map(p => (
        <button className={"f-row" + (scenario===p.id ? " on" : "")} onClick={() => setScenario(p.id)}>
          <span className="box">{scenario===p.id && <Check />}</span>
          <span>{p.title}</span>
        </button>
      ))}
    </div>
  </div>
  <div>
    <div className="tg-phone">
      <div className="tg-screen">
        <div className="tg-status">…</div>
        <div className="tg-header">…</div>
        <div className="tg-body" key={scenario}>
          <div className="tg-day">Сегодня</div>
          {cur.msgs.map((m, i) => <TgMsg key={i} m={m} />)}
        </div>
        <div className="tg-input-bar">…</div>
      </div>
    </div>
  </div>
</section>
```

**`<TgMsg m={...} />`** — внутренний компонент-роутер по `m.who`:
- `me` text → `<div className="tg-msg tg-me">{text}<span className="time">14:31</span></div>`
- `me` voice → `<div className="tg-msg tg-me"><div className="tg-voice">[play][wave bars][dur]</div>…</div>`
  - Voice-wave: массив высот `useMemo`-зафиксированный (`4 + (Math.sin(i*1.4)+1)*8 + (i%5)*2` для i=0..23), чтобы не пересчитывать на каждый render.
- `bot` text → `<div className="tg-msg tg-bot">{text.split("\n").map(l => <div>{l || " "}</div>)}<span className="time">14:32</span></div>`
- `card` → `<div className="tg-card">…img / nm / specs / price / stock</div>`
- `buttons` → `<div className="tg-buttons">{btns.map(([l, full]) => <div className={"tg-btn" + (full?" full":"")}>{l}</div>)}</div>`
- `quick` → `<div className="tg-quick">{btns.map(b => <span className="q">{b}</span>)}</div>`

**Данные:**
- `CAPABILITIES`: 8 строк `{ icon, label }`.
- `TG_PRESETS`: 5 объектов `{ id, title, msgs }`, ~60 строк JSX-данных
  (порт из `screen-bot.jsx:3-55`).

**Иконки (lucide-react mapping):**

| Шаблон | lucide |
| --- | --- |
| `bot` | `Bot` |
| `search` | `Search` |
| `sliders` | `SlidersHorizontal` |
| `compare` | `ArrowLeftRight` |
| `check` | `Check` |
| `receipt` | `ReceiptText` |
| `doc` | `FileText` |
| `mic` | `Mic` |
| `headset` | `Headphones` |
| `chev-left` | `ChevronLeft` |
| `phone` | `Phone` |
| `more` | `MoreHorizontal` |
| `paperclip` | `Paperclip` |
| `play` | `Play` |

### Файлы, которые НЕ трогаем

- `src/styles/glass-template.css` — все нужные классы там, не правим.
- `src/app/globals.css` — никаких новых стилей.
- `src/components/site-screen-bar.tsx` — уже корректно подсвечивает `/bot`.

## Verification

1. `npm run lint` — без ошибок/warning'ов. `useMemo` для voice-wave должен пройти `react-hooks/exhaustive-deps`.
2. `npm run test` — 134/134. Без новых тестов: phone-mockup — чисто визуальный компонент без бизнес-логики.
3. `npm run build` — успешно. Page = server, BotDemo = client, инстанциация без function-prop → RSC-граница чистая.
4. Локально `npm run dev`:
   - `curl -s http://localhost:3000/bot | grep bot-frame` — есть.
   - В браузере: hero виден, переключатель сценариев меняет диалог в phone-mockup, voice-wave рендерится, карточки товаров отображаются, ScreenBar внизу подсвечивает «Telegram-агент».
5. Deploy + prod-smoke: `/bot` → 200, HTML содержит `bot-frame` и `tg-phone`.
6. HANDOFF entry.

## Риски и ловушки

- **CSS-классы.** Все 45 матчей `.bot-*`/`.tg-*` уже в нашем `glass-template.css`. Если в браузере найдём недостающий класс — копируем из `design-template/unzipped/styles.css` в `globals.css` override (НЕ в glass-template.css).
- **Voice-wave determinism.** `Math.sin` — детерминирован, не должен ломать SSR/hydration. Тем не менее, кладём в `useMemo` чтобы массив не пересоздавался каждый render.
- **`key={scenario}` на `tg-body`** — заставляет React перемонтировать тело при смене сценария (это нужно для триггера CSS-анимации появления, если она есть в шаблоне).
- **Размер компонента.** ~250 строк (60 строк TG_PRESETS + 80 строк TgMsg + 80 строк layout + 30 строк boilerplate). Это много, но единый интерактивный блок — разделять не нужно (см. karpathy: не плодим преждевременных абстракций).

## Что НЕ входит

- Реальный Telegram bot API / webhook.
- Реальный QR-код (`<div className="qr">` пустой div как в шаблоне).
- Реальная привязка к боту (`@buttehopt_bot` — мок-username).
- CTA «Открыть в Telegram» как `href` — оставляем кнопкой без href (как в шаблоне), активируется когда появится реальный username.
