import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  Gem,
  Mail,
  MapPin,
  Percent,
  Phone,
  Play,
  Shield,
  ShoppingCart,
  Sparkles,
  Truck,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Coffee } from "@/components/art/coffee";
import { CallbackButton } from "@/components/callback-button";
import { GlassProductCard } from "@/components/glass-product-card";
import { getHomeSnapshot } from "@/lib/catalog";
import { phoneHref, storefront } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "БытТехОпт - бытовая техника, электроника и товары для дома",
  description:
    "Закажите бытовую технику, электронику, климатическое оборудование и товары для дома с доставкой по Крыму, Херсонской и Запорожской областям. Оплата при получении.",
};

async function loadHome() {
  try {
    return await getHomeSnapshot();
  } catch {
    return { categories: [], products: [] };
  }
}

const RU_NUMBER = new Intl.NumberFormat("ru-RU");

const RECOMMENDED_COUNT = 8;

const CATEGORY_ART_BY_SLUG: Record<string, string> = {
  "bytovaya-tehnika-9839": "/static/category-cards/bytovaya-tehnika.png",
  "dacha-sad-i-ogorod-11038": "/static/category-cards/dacha-sad-i-ogorod.png?v=2",
  "detskie-tovary-11173": "/static/category-cards/detskie-tovary.png",
  "dosug-i-razvlecheniya-11714": "/static/category-cards/dosug-i-razvlecheniya.png",
  "zapchasti-12719": "/static/category-cards/zapchasti.png",
  "kompyuternaya-tehnika-9975": "/static/category-cards/kompyuternaya-tehnika.png",
};

// getHomeSnapshot returns a wide, category-balanced pool. This page is
// force-dynamic, so it runs per request — rotate a random window of products
// out of the pool each time so "Рекомендуемые товары" keeps changing positions
// and groups on every reload instead of showing the same 8 for months. The
// pool is already round-robin ordered across top categories, so any contiguous
// window spans different groups (мелкая/крупная бытовая, инструмент, электроника).
function pickRecommended<T>(pool: T[], count: number): T[] {
  if (pool.length <= count) return pool;
  const start = Math.floor(Math.random() * pool.length);
  return Array.from({ length: count }, (_, i) => pool[(start + i) % pool.length]);
}

export default async function Home() {
  const { categories, products } = await loadHome();
  const featuredCategories = categories.slice(0, 6);
  const recommendedProducts = pickRecommended(products, RECOMMENDED_COUNT);

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <span className="hero-eyebrow">
            <Sparkles size={16} aria-hidden /> Весенняя коллекция · Скидки до 35%
          </span>
          <h1>
            Техника,
            <br />
            которая
            <br />
            <span className="grad">вдохновляет</span>
          </h1>
          <p className="hero-sub">
            Современные решения
            <br />
            для вашего дома и бизнеса в Крыму
          </p>
          <div className="hero-actions">
            <Link href="/catalog" className="btn btn-primary btn-lg">
              В каталог <ArrowRight size={18} aria-hidden />
            </Link>
            <a className="video-link" href="#how-order">
              <span className="play">
                <Play size={16} aria-hidden />
              </span>{" "}
              Как мы работаем
            </a>
          </div>
        </div>

        <div className="hero-product">
          <div className="hero-stage">
            <Image
              className="hero-stage-image"
              src="/static/home/hero-fridge-coffee.png"
              alt="Современный холодильник и автоматическая кофемашина в светлой кухне"
              fill
              preload
              sizes="(max-width: 760px) calc(100vw - 72px), (max-width: 1180px) calc(100vw - 120px), 52vw"
            />
          </div>

          <div className="feature-float float-1">
            <div className="ic">
              <Gem size={20} aria-hidden />
            </div>
            Премиальное
            <br />
            качество
          </div>
          <div className="feature-float float-2">
            <div className="ic">
              <Shield size={20} aria-hidden />
            </div>
            Официальная
            <br />
            гарантия
          </div>
          <div className="feature-float float-4">
            <span className="num">0%</span>
            <div>
              Рассрочка
              <br />
              без переплат
            </div>
          </div>
        </div>
      </section>

      <div className="section-head">
        <div>
          <h2>Каталог по категориям</h2>
          <div className="meta">
            Более 8 500 моделей в наличии — от крупной техники до умного дома
          </div>
        </div>
        <Link className="right" href="/catalog">
          Все категории <ArrowRight size={16} aria-hidden />
        </Link>
      </div>

      <div className="cat-grid">
        {featuredCategories.map((category) => (
          <Link key={category.id} href={`/catalog/${category.slug}`} className="cat-card">
            <div>
              <h3>{category.name}</h3>
              <div className="cnt">
                {RU_NUMBER.format(category.productCount)} моделей
              </div>
            </div>
            <div className="cat-art" aria-hidden>
              {CATEGORY_ART_BY_SLUG[category.slug] ? (
                <Image
                  className="cat-art-image"
                  src={CATEGORY_ART_BY_SLUG[category.slug]}
                  alt=""
                  fill
                  sizes="(max-width: 760px) 42vw, (max-width: 1180px) 20vw, 10vw"
                />
              ) : (
                <span className="cat-art-mono">{category.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="circle-arrow">
              <ArrowRight size={16} aria-hidden />
            </div>
          </Link>
        ))}
      </div>

      <div className="promo-grid">
        <div className="promo-card promo-weekly">
          <span className="badge">Выбор недели</span>
          <h3>Кофемашина DeLonghi Dinamica Plus</h3>
          <ul className="feat-list">
            <li>Идеальный эспрессо и капучино</li>
            <li>Сенсорное управление</li>
            <li>Автоматическая очистка</li>
          </ul>
          <div className="price-row">
            <span className="price">79 990 ₽</span>
            <span className="old">94 990 ₽</span>
          </div>
          <div className="promo-cta">
            <Link href="/catalog" className="btn btn-soft btn-sm">
              Подробнее
            </Link>
            <Link href="/cart" className="cta-soft" aria-label="В корзину">
              <ShoppingCart size={18} aria-hidden />
            </Link>
          </div>
          <div className="weekly-art">
            <Coffee size={210} />
          </div>
        </div>

        <div className="promo-card promo-smart">
          <span className="badge">Умный дом</span>
          <h3>
            Умный дом
            <br />в одном касании
          </h3>
          <p
            style={{
              marginTop: 18,
              opacity: 0.85,
              fontSize: 14,
              lineHeight: 1.5,
              maxWidth: 280,
            }}
          >
            Управляйте техникой со смартфона из любой точки мира
          </p>
          <div className="promo-cta">
            <Link href="/catalog" className="btn btn-soft btn-sm">
              Подробнее
            </Link>
          </div>
          <div className="smart-phone">
            <div className="sp-screen">
              <div className="head">
                <span>Мой дом</span>
                <span>3 устр.</span>
              </div>
              <div className="sp-tile" />
              <div className="sp-tile" />
              <div className="sp-tile" />
              <div className="sp-tile" />
              <div className="sp-tile" />
              <div className="sp-tile" />
            </div>
          </div>
        </div>
      </div>

      <section id="how-order" className="glass" style={{ padding: 32, borderRadius: 24, marginTop: 18 }}>
        <div className="section-head" style={{ marginBottom: 18 }}>
          <div>
            <h2>Как мы работаем</h2>
            <div className="meta">Без сложных шагов — заявка, подтверждение, доставка, оплата при получении</div>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {[
            { num: "1", title: "Выберите товар", text: "Используйте каталог, поиск или фильтры. Добавьте в корзину или оставьте заявку из карточки." },
            { num: "2", title: "Отправьте заявку", text: "Имя и телефон — достаточно. Email и комментарий по желанию." },
            { num: "3", title: "Менеджер подтверждает", text: "Проверим наличие у поставщика, согласуем цену и срок доставки 7 дней." },
            { num: "4", title: "Получаете заказ", text: "Доставим по Крыму и новым регионам. Оплата при получении после подтверждения." },
          ].map((step) => (
            <div
              key={step.num}
              style={{
                padding: 18,
                borderRadius: 16,
                background: "rgba(255,255,255,0.5)",
                border: "1px solid var(--glass-stroke)",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background: "linear-gradient(135deg,#75a2ff,#426dff)",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 14,
                }}
              >
                {step.num}
              </span>
              <h3 style={{ marginTop: 12, fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{step.title}</h3>
              <p style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5, color: "var(--text-2)" }}>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {recommendedProducts.length > 0 && (
        <>
          <div className="section-head">
            <div>
              <h2>Рекомендуемые товары</h2>
              <div className="meta">Подборка обновляется — доставим по Крыму и новым регионам</div>
            </div>
            <Link className="right" href="/catalog">
              Смотреть каталог <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <div className="product-grid">
            {recommendedProducts.map((product) => (
              <GlassProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}

      <div className="trust">
        <div className="trust-card">
          <div className="ic">
            <Truck size={20} aria-hidden />
          </div>
          <div>
            <h4>Быстрая доставка</h4>
            <p>Доставим заказ в кратчайшие сроки по Крыму и новым регионам</p>
          </div>
        </div>
        <div className="trust-card">
          <div className="ic">
            <Shield size={20} aria-hidden />
          </div>
          <div>
            <h4>Официальная гарантия</h4>
            <p>Гарантия от производителя на всю представленную технику</p>
          </div>
        </div>
        <div className="trust-card">
          <div className="ic">
            <Wrench size={20} aria-hidden />
          </div>
          <div>
            <h4>Сервис и поддержка</h4>
            <p>Профессиональная техническая поддержка и ремонт</p>
          </div>
        </div>
        <div className="trust-card">
          <div className="ic">
            <Percent size={20} aria-hidden />
          </div>
          <div>
            <h4>Выгодная рассрочка</h4>
            <p>Покупайте сейчас — платите потом, без процентов</p>
          </div>
        </div>
      </div>

      <section
        id="contacts"
        className="glass-strong home-contacts"
        style={{
          padding: 32,
          borderRadius: 28,
          marginTop: 18,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "var(--accent-2)",
            }}
          >
            Контакты
          </p>
          <h2 style={{ marginTop: 6, fontSize: 28, fontWeight: 900, color: "var(--text)" }}>
            Позвоните или закажите обратный звонок
          </h2>
          <p style={{ marginTop: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
            Менеджер ответит в рабочее время ({storefront.hours}). Подберём аналог, посчитаем доставку,
            подтвердим срок 7 дней.
          </p>
          <div style={{ marginTop: 18, display: "grid", gap: 10, fontSize: 14, color: "var(--text-2)" }}>
            {storefront.phones.map((phone) => (
              <a
                key={phone}
                href={phoneHref(phone)}
                style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "inherit", fontWeight: 700 }}
              >
                <Phone size={16} aria-hidden style={{ color: "var(--accent-2)" }} />
                {phone}
              </a>
            ))}
            <a
              href={`mailto:${storefront.email}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "inherit" }}
            >
              <Mail size={16} aria-hidden style={{ color: "var(--accent-2)" }} />
              {storefront.email}
            </a>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <MapPin size={16} aria-hidden style={{ color: "var(--accent-2)" }} />
              {storefront.region}
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <CheckCircle2 size={16} aria-hidden style={{ color: "#1ea866" }} />
              {storefront.hours}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gap: 12,
            justifyItems: "center",
            padding: 24,
            borderRadius: 20,
            background: "rgba(255,255,255,0.5)",
            border: "1px solid var(--glass-stroke)",
          }}
        >
          <p style={{ fontWeight: 700, color: "var(--text)", textAlign: "center" }}>
            Оставьте телефон — перезвоним
          </p>
          <CallbackButton variant="inline" className="btn btn-primary btn-lg">
            Заказать обратный звонок
          </CallbackButton>
          <Link
            href="/checkout"
            className="btn btn-soft"
            style={{ width: "100%", justifyContent: "center" }}
          >
            Оформить заявку
          </Link>
        </div>
      </section>
    </>
  );
}
