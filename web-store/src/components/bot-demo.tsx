"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Bot,
  Check,
  ChevronLeft,
  FileText,
  Headphones,
  Mic,
  MoreHorizontal,
  Paperclip,
  Phone,
  Play,
  ReceiptText,
  Search,
  SlidersHorizontal,
} from "lucide-react";

// @buttehopt_bot — мок-username, реальный bot подключим позже одной правкой констант.
const BOT_USERNAME = "buttehopt_bot";

type MsgMe = { who: "me"; text?: string; voice?: number };
type MsgBot = { who: "bot"; text: string };
type MsgCard = {
  who: "card";
  img: string;
  nm: string;
  specs: string;
  price: string;
  stock: string;
};
type MsgButtons = { who: "buttons"; btns: [string, boolean][] };
type MsgQuick = { who: "quick"; btns: string[] };
type Msg = MsgMe | MsgBot | MsgCard | MsgButtons | MsgQuick;

type Preset = { id: string; title: string; msgs: Msg[] };

const TG_PRESETS: Preset[] = [
  {
    id: "search",
    title: "Поиск товара",
    msgs: [
      { who: "me", text: "Нужен холодильник Side-by-Side, бюджет до 130 тыс." },
      {
        who: "bot",
        text: "Подобрал 3 варианта в наличии на ваших складах. Сравнить?",
      },
      {
        who: "card",
        img: "Samsung RS66A · 591 л",
        nm: "Samsung RS66A8100B1",
        specs: "Side-by-Side · No Frost · 591 л · A+",
        price: "118 990 ₽",
        stock: "● На складе в Симферополе — 4 шт",
      },
      {
        who: "buttons",
        btns: [
          ["В корзину", true],
          ["Характеристики", false],
          ["Сравнить", false],
          ["Передать менеджеру", false],
        ],
      },
    ],
  },
  {
    id: "voice",
    title: "Голосовой запрос",
    msgs: [
      { who: "me", voice: 8 },
      {
        who: "bot",
        text: "Распознал: «Сплит-система на спальню 18 м², инверторная, тихая». Уточню — какой бюджет рассматриваете?",
      },
      {
        who: "quick",
        btns: ["до 35 000 ₽", "35–50 тыс.", "50–80 тыс.", "не важно"],
      },
      { who: "me", text: "до 50 тыс." },
      {
        who: "bot",
        text: "Лучший выбор по соотношению цены и шума — Haier Lightera HSU-09. Уровень шума 19 дБ, инвертор, гарантия 3 года.",
      },
    ],
  },
  {
    id: "compare",
    title: "Сравнение моделей",
    msgs: [
      { who: "me", text: "Чем Bosch SMS44GI01R лучше Beko BDFN15422W?" },
      {
        who: "bot",
        text: "Коротко по главному:\n\n• Сушка: Bosch — конденсационная A, Beko — A.\n• Шум: Bosch 48 дБ, Beko 49 дБ.\n• Программ: Bosch — 6 (есть «½ загрузки»), Beko — 5.\n• Цена: Bosch 47 990 ₽, Beko 39 990 ₽.\n\nДля семьи 3–4 человека и шумоизоляции — Bosch. Если приоритет цена/качество — Beko.",
      },
      {
        who: "buttons",
        btns: [
          ["Купить Bosch", true],
          ["Купить Beko", true],
          ["Подробное сравнение", false],
          ["Менеджер", false],
        ],
      },
    ],
  },
  {
    id: "tender",
    title: "Подбор под тендер",
    msgs: [
      {
        who: "me",
        text: "Подготовь спецификацию для тендера: 24 моноблока 23–24″, бюджет 850 000 ₽, гарантия 3 года, по 44-ФЗ.",
      },
      {
        who: "bot",
        text: "Принял. Подбираю по ОКПД2 26.20.15.000. Соответствие требованиям:",
      },
      {
        who: "card",
        img: "Lenovo · моноблок 23.8″",
        nm: "Lenovo IdeaCentre 3 24IAP7",
        specs: "Intel i5-1235U · 16 ГБ · 512 ГБ SSD · IPS 23.8″ · Win 11 Pro",
        price: "29 990 ₽ × 24 = 719 760 ₽",
        stock: "● Под заказ от поставщика, 7 дней",
      },
      {
        who: "buttons",
        btns: [
          ["Сформировать КП (PDF)", true],
          ["Скачать спецификацию", false],
          ["Запросить договор", false],
          ["Менеджер по тендерам", false],
        ],
      },
    ],
  },
  {
    id: "order",
    title: "Оформление заказа",
    msgs: [
      { who: "me", text: "Хочу оформить выбранную стиральную машину" },
      {
        who: "bot",
        text: "В корзине:\n• Bosch WAJ20180ME — 39 990 ₽\n• Доставка по Симферополю — 0 ₽\n\nИтого: 39 990 ₽",
      },
      {
        who: "buttons",
        btns: [
          ["Подтвердить", true],
          ["Изменить", false],
          ["Добавить услугу установки (+1 990 ₽)", false],
          ["Передать менеджеру", false],
        ],
      },
      { who: "me", text: "Подтверждаю" },
      {
        who: "bot",
        text: "Заказ №24817 принят. Доставка завтра, 4 мая, 10:00–14:00. Оплата при получении наличными. Курьер свяжется за час.",
      },
    ],
  },
];

const CAPABILITIES: { icon: typeof Search; label: string }[] = [
  { icon: Search, label: "Поиск по названию и параметрам" },
  { icon: SlidersHorizontal, label: "Подбор по бюджету и сценарию" },
  { icon: ArrowLeftRight, label: "Сравнение моделей" },
  { icon: Check, label: "Проверка наличия и цены онлайн" },
  { icon: ReceiptText, label: "Оформление заказа в чате" },
  { icon: FileText, label: "КП и спецификации для юрлиц / тендеров" },
  { icon: Mic, label: "Голосовые запросы" },
  { icon: Headphones, label: "Мгновенная передача менеджеру" },
];

function TgMsg({ m, voiceBars }: { m: Msg; voiceBars: number[] }) {
  if (m.who === "bot") {
    return (
      <div className="tg-msg tg-bot">
        {m.text.split("\n").map((l, i) => (
          <div key={i}>{l || " "}</div>
        ))}
        <span className="time">14:32</span>
      </div>
    );
  }
  if (m.who === "me") {
    if (m.voice) {
      return (
        <div className="tg-msg tg-me" style={{ minWidth: 240 }}>
          <div className="tg-voice">
            <span className="play">
              <Play size={12} />
            </span>
            <span className="wave">
              {voiceBars.map((h, i) => (
                <i key={i} style={{ height: h }} />
              ))}
            </span>
            <span className="dur">0:0{m.voice}</span>
          </div>
          <span className="time">14:31</span>
        </div>
      );
    }
    return (
      <div className="tg-msg tg-me">
        {m.text}
        <span className="time">14:31</span>
      </div>
    );
  }
  if (m.who === "card") {
    return (
      <div className="tg-card">
        <div className="img">{m.img}</div>
        <div className="body">
          <div className="nm">{m.nm}</div>
          <div className="specs">{m.specs}</div>
          <div className="price">{m.price}</div>
          <div className="stock">{m.stock}</div>
        </div>
      </div>
    );
  }
  if (m.who === "buttons") {
    return (
      <div className="tg-buttons" style={{ marginTop: -4 }}>
        {m.btns.map(([l, full], i) => (
          <div key={i} className={"tg-btn" + (full ? " full" : "")}>
            {l}
          </div>
        ))}
      </div>
    );
  }
  if (m.who === "quick") {
    return (
      <div className="tg-quick">
        {m.btns.map((b, i) => (
          <span key={i} className="q">
            {b}
          </span>
        ))}
      </div>
    );
  }
  return null;
}

export function BotDemo() {
  const [scenario, setScenario] = useState<string>("search");
  const cur = TG_PRESETS.find((p) => p.id === scenario) ?? TG_PRESETS[0];

  const voiceBars = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) =>
        Math.round(4 + (Math.sin(i * 1.4) + 1) * 8 + (i % 5) * 2),
      ),
    [],
  );

  return (
    <section className="bot-frame" data-screen-label="Bot">
      <div className="bot-side">
        <span
          className="b2b-pill"
          style={{
            background: "rgba(79,125,255,.18)",
            color: "var(--accent-2)",
            borderColor: "rgba(79,125,255,.35)",
          }}
        >
          <Bot size={14} /> AI-агент по продажам
        </span>
        <h2>
          Менеджер по продажам, который не спит и знает весь склад наизусть
        </h2>
        <p className="sub">
          Подключите Telegram-бота — клиент получает консультацию 24/7, видит
          наличие, сравнивает модели, оформляет заказ и КП за минуты, а сложные
          кейсы плавно передаются живому менеджеру.
        </p>

        <div className="bot-cap">
          {CAPABILITIES.map(({ icon: Icon, label }) => (
            <div className="bot-cap-row" key={label}>
              <span className="ic">
                <Icon size={16} />
              </span>
              {label}
            </div>
          ))}
        </div>

        <div className="qr-card">
          <div className="qr" />
          <div>
            <div className="nm">@{BOT_USERNAME}</div>
            <div className="meta">t.me/{BOT_USERNAME}</div>
            <div style={{ marginTop: 8 }}>
              <button type="button" className="btn btn-sm btn-primary">
                Открыть в Telegram
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 24,
            padding: 14,
            borderRadius: 14,
            background: "rgba(255,255,255,.5)",
            border: "1px solid var(--glass-stroke)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "var(--text-mute)",
              fontWeight: 700,
              letterSpacing: ".05em",
              textTransform: "uppercase",
            }}
          >
            Сценарий диалога
          </div>
          <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
            {TG_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={"f-row" + (scenario === p.id ? " on" : "")}
                onClick={() => setScenario(p.id)}
                style={{ cursor: "pointer" }}
              >
                <span className="box">
                  {scenario === p.id && <Check size={12} strokeWidth={2.6} />}
                </span>
                <span style={{ fontWeight: 600 }}>{p.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="tg-phone">
          <div className="tg-screen">
            <div className="tg-status">
              <span>9:41</span>
              <span>● ● ● 5G ▮</span>
            </div>
            <div className="tg-header">
              <span className="tg-back">
                <ChevronLeft size={20} />
              </span>
              <span className="tg-avatar">БТ</span>
              <div className="tg-meta">
                <div className="nm">БытТехОпт · Агент продаж</div>
                <div className="st">в сети · отвечает за 3 сек</div>
              </div>
              <div className="tg-actions">
                <Phone size={20} />
                <MoreHorizontal size={20} />
              </div>
            </div>
            <div className="tg-body" key={scenario}>
              <div className="tg-day">Сегодня</div>
              {cur.msgs.map((m, i) => (
                <TgMsg key={i} m={m} voiceBars={voiceBars} />
              ))}
            </div>
            <div className="tg-input-bar">
              <Paperclip size={20} />
              <div className="tg-input">Сообщение...</div>
              <span className="tg-mic">
                <Mic size={18} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
