import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  CookingPot,
  Droplet,
  Flame,
  Globe,
  type LucideIcon,
  MapPin,
  Microwave,
  Phone,
  Refrigerator,
  Settings,
  Settings2,
  ShieldCheck,
  Snowflake,
  UtensilsCrossed,
  WashingMachine,
  Wind,
  Wrench,
} from "lucide-react";
import { CallbackButton } from "@/components/callback-button";

export const metadata: Metadata = {
  title: "Сервис и установка",
  description:
    "Установка бытовой техники по всему Крыму силами своих мастеров, выезд в течение 24 часов, гарантия на работы 12 месяцев. Список авторизованных сервисных центров в Симферополе.",
  keywords: [
    "установка бытовой техники Симферополь",
    "установка стиральной машины Крым",
    "монтаж сплит-системы Симферополь",
    "авторизованный сервисный центр Крым",
  ],
};

type Install = { icon: LucideIcon; label: string; price: string };

const INSTALLATIONS: Install[] = [
  { icon: WashingMachine, label: "Стиральная машина", price: "от 2 500 ₽" },
  { icon: Refrigerator, label: "Холодильник", price: "от 2 500 ₽" },
  { icon: Flame, label: "Газовая плита", price: "от 2 500 ₽" },
  { icon: Snowflake, label: "Сплит-система", price: "от 8 000 ₽" },
  { icon: Microwave, label: "Духовка", price: "от 3 000 ₽" },
  { icon: CookingPot, label: "Варочная панель", price: "от 3 000 ₽" },
  { icon: UtensilsCrossed, label: "Посудомойка", price: "от 3 000 ₽" },
  { icon: Wind, label: "Вытяжка", price: "от 3 000 ₽" },
  { icon: Droplet, label: "Бойлер", price: "от 3 000 ₽" },
  { icon: Settings, label: "Сезонное обслуживание (ТО) кондиционеров", price: "от 2 000 ₽" },
];

type AscPhone = { label: string; tel: string };
type Asc = {
  name: string;
  address: string;
  phones: AscPhone[];
  site?: { label: string; href: string };
};

const ASC_LIST: Asc[] = [
  {
    name: "НК-Центр",
    address: "ул. Ладыгина, 21",
    phones: [
      { label: "+7 (978) 066-24-01", tel: "+79780662401" },
      { label: "+7 (3652) 54-45-73", tel: "+73652544573" },
    ],
    site: { label: "nk-center.ru", href: "https://nk-center.ru" },
  },
  {
    name: "СЦ Максимум",
    address: "ул. Генерала Васильева, 30",
    phones: [{ label: "+7 (978) 127-31-21", tel: "+79781273121" }],
  },
  {
    name: "Гарант Сервис",
    address: "ул. Дзюбанова, 49",
    phones: [{ label: "+7 (978) 722-74-79", tel: "+79787227479" }],
    site: { label: "garantsimf.ru", href: "https://garantsimf.ru" },
  },
];

const sectionStyle: React.CSSProperties = {
  marginTop: 28,
  padding: 28,
  borderRadius: 24,
};

const sectionHeadStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 14,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: "-0.01em",
};

const sectionIconStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
  borderRadius: 12,
  background: "rgba(79,125,255,.12)",
  color: "var(--accent-2)",
  flexShrink: 0,
};

export default function ServicePage() {
  return (
    <>
      <div className="bread">
        <Link href="/">Главная</Link>
        <span>›</span>
        <span>Сервис и установка</span>
      </div>

      <div className="section-head" style={{ margin: "6px 4px 18px" }}>
        <div>
          <h2>Сервис и установка</h2>
          <div className="meta">
            Гарантия, установка по Крыму, авторизованные сервисные центры
          </div>
        </div>
      </div>

      <section className="glass service-visual-hero">
        <div className="service-visual-copy">
          <span className="service-visual-kicker">
            <Wrench size={15} aria-hidden /> Свои мастера по всему Крыму
          </span>
          <h2>Установим и настроим технику</h2>
          <p>
            Выезд в течение 24 часов после заявки. Выполним монтаж аккуратно и дадим гарантию на работы 12 месяцев.
          </p>
          <CallbackButton variant="inline" className="btn btn-primary">
            Заказать установку
          </CallbackButton>
        </div>
        <div className="service-visual-media">
          <Image
            src="/static/section-visuals/service-installation.png"
            alt="Мастер устанавливает и обслуживает кондиционер"
            width={1672}
            height={941}
            priority
            sizes="(max-width: 760px) 92vw, 54vw"
          />
        </div>
      </section>

      {/* === Гарантия === */}
      <section className="glass" style={sectionStyle}>
        <div style={sectionHeadStyle}>
          <span style={sectionIconStyle}>
            <ShieldCheck size={22} />
          </span>
          <h3 style={sectionTitleStyle}>Гарантия от производителя</h3>
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.55, marginBottom: 10 }}>
          Вся техника, которую вы покупаете в БытТехОпт, продаётся с заводской
          гарантией. Обычно это 12 месяцев для мелкой бытовой техники и 24–36
          месяцев для крупной БТ и климатического оборудования — точный срок
          указан в гарантийном талоне производителя.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.55, marginBottom: 10 }}>
          Для гарантийного случая понадобятся: товарный чек или УПД,
          гарантийный талон производителя и описание неисправности.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--text-mute)" }}>
          Гарантийный ремонт выполняют авторизованные сервисные центры
          производителя — список проверенных СЦ в Симферополе ниже на этой
          странице.
        </p>
      </section>

      {/* === Установка === */}
      <section className="glass" style={sectionStyle}>
        <div style={sectionHeadStyle}>
          <span style={sectionIconStyle}>
            <Settings2 size={22} />
          </span>
          <h3 style={sectionTitleStyle}>Установка бытовой техники</h3>
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.55, marginBottom: 18 }}>
          Свои мастера, работаем по всему Крыму. Выезд в течение 24 часов после
          заявки. Гарантия на наши работы — 12 месяцев.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 14,
            marginBottom: 22,
          }}
        >
          {INSTALLATIONS.map(({ icon: Icon, label, price }) => (
            <div
              key={label}
              className="p-card"
              style={{
                padding: 18,
                display: "flex",
                alignItems: "center",
                gap: 14,
                height: "auto",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(255,255,255,.6)",
                  border: "1px solid var(--glass-stroke)",
                  color: "var(--accent-2)",
                  flexShrink: 0,
                }}
              >
                <Icon size={22} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "var(--text)",
                    marginTop: 2,
                  }}
                >
                  {price}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
          <CallbackButton variant="inline" className="btn btn-primary">
            Заказать услугу — обратный звонок
          </CallbackButton>
        </div>
      </section>

      {/* === Ремонт === */}
      <section className="glass" style={sectionStyle}>
        <div style={sectionHeadStyle}>
          <span style={sectionIconStyle}>
            <Wrench size={22} />
          </span>
          <h3 style={sectionTitleStyle}>Ремонт техники</h3>
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.55, marginBottom: 18 }}>
          Мы не занимаемся ремонтом самостоятельно — рекомендуем обращаться в
          авторизованные сервисные центры в Симферополе:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {ASC_LIST.map((asc) => (
            <div
              key={asc.name}
              style={{
                padding: 20,
                borderRadius: 16,
                background: "rgba(255,255,255,.55)",
                border: "1px solid var(--glass-stroke)",
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  marginBottom: 8,
                  color: "var(--text)",
                }}
              >
                {asc.name}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 6,
                  fontSize: 14,
                  color: "var(--text-2)",
                  marginBottom: 8,
                }}
              >
                <MapPin size={14} style={{ marginTop: 3, flexShrink: 0 }} />
                <span>{asc.address}</span>
              </div>
              <div
                style={{
                  display: "grid",
                  gap: 4,
                  fontSize: 14,
                  marginBottom: asc.site ? 8 : 0,
                }}
              >
                {asc.phones.map((p) => (
                  <a
                    key={p.tel}
                    href={`tel:${p.tel}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      color: "var(--accent-2)",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    <Phone size={14} />
                    {p.label}
                  </a>
                ))}
              </div>
              {asc.site && (
                <a
                  href={asc.site.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: "var(--text-mute)",
                    textDecoration: "none",
                  }}
                >
                  <Globe size={13} />
                  {asc.site.label}
                </a>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
