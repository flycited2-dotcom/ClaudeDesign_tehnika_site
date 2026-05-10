import type { Metadata } from "next";
import {
  ArrowRight,
  Gem,
  Percent,
  Play,
  Shield,
  ShoppingCart,
  Sparkles,
  Truck,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { Coffee } from "@/components/art/coffee";
import { Fridge } from "@/components/art/fridge";
import { getHomeSnapshot } from "@/lib/catalog";

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

export default async function Home() {
  const { categories } = await loadHome();
  const featuredCategories = categories.slice(0, 6);

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
            <a className="video-link" href="#">
              <span className="play">
                <Play size={16} aria-hidden />
              </span>{" "}
              Смотреть видео
            </a>
          </div>
        </div>

        <div className="hero-product">
          <div className="hero-stage">
            <Fridge size={300} />
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
    </>
  );
}
