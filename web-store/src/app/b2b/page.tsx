import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Building2, FileText, Phone } from "lucide-react";
import Link from "next/link";
import { AccountShell } from "@/components/account-shell";
import { LeadHistoryList } from "@/components/lead-history-list";
import { QuoteRequestButton } from "@/components/quote-request-button";
import { RoleUpgradeRequestModal } from "@/components/role-upgrade-request-modal";
import { getCurrentUser, roleToStorefront } from "@/lib/auth";
import { getLeadsForUser } from "@/lib/leads";
import { getRolePricingConfig } from "@/lib/role-pricing";
import { storefront } from "@/lib/storefront";

export const metadata: Metadata = {
  title: "Оптовикам",
  description:
    "Опт для бизнеса: оптовые цены, прайс-листы, отсрочка платежа и личный менеджер в магазине БытТехОпт.",
};

export const dynamic = "force-dynamic";

const PRICELISTS = [
  { name: "Полный прайс · опт", sub: "XLSX · обновляется ежедневно по запросу" },
  { name: "Климатика · опт", sub: "PDF · кондиционеры, сплит-системы, осушители" },
  { name: "Крупная БТ · опт от 5 шт", sub: "XLSX · холодильники, стиральные машины, плиты" },
  { name: "Компьютеры · корпоративный", sub: "PDF · ноутбуки, мониторы, периферия" },
];

export default async function B2BPage() {
  const pricing = getRolePricingConfig();
  const user = await getCurrentUser();
  const userRole = user ? roleToStorefront(user.role) : null;
  const isB2BUser = userRole === "b2b";
  const isB2CUser = userRole === "b2c";
  const leads = isB2BUser && user ? await getLeadsForUser(user.id) : [];

  const heroCTA = !user ? (
    <Link
      href="/login?next=/b2b"
      className="btn btn-soft btn-lg"
      style={{ background: "#fff", color: "var(--accent-2)" }}
    >
      Войти и запросить опт-статус <ArrowRight size={16} aria-hidden />
    </Link>
  ) : isB2CUser ? (
    <RoleUpgradeRequestModal
      requestedRole="b2b"
      buttonLabel="Запросить опт-статус"
      buttonClassName="btn btn-soft btn-lg"
      buttonStyle={{ background: "#fff", color: "var(--accent-2)" }}
      defaultContact={user.name}
      defaultPhone={user.phone}
    />
  ) : (
    <QuoteRequestButton
      scope="b2b"
      buttonLabel="Запросить КП"
      buttonClassName="btn btn-soft btn-lg"
      buttonStyle={{ background: "#fff", color: "var(--accent-2)" }}
    />
  );

  return (
    <>
      <div className="b2b-banner b2b-banner-illustrated">
        <div className="b2b-banner-copy">
          <span className="b2b-pill">
            <Building2 size={14} aria-hidden /> B2B · Оптовое направление
          </span>
          <h2>
            Опт для бизнеса:
            <br />
            цены, отсрочка, личный менеджер
          </h2>
          <p>
            Оптовые цены при заказе от {pricing.b2bMinQuantity} шт., доступ к прайс-листам, формирование КП за минуты,
            отсрочка платежа по договору. Персональный менеджер на всех этапах сделки.
          </p>
          <div className="b2b-banner-action">{heroCTA}</div>
        </div>
        <div className="b2b-banner-media">
          <Image
            src="/static/section-visuals/b2b-wholesale.png"
            alt="Оптовая поставка бытовой техники для бизнеса"
            width={1536}
            height={1024}
            priority
            sizes="(max-width: 760px) 92vw, 46vw"
          />
        </div>
      </div>

      <AccountShell
        activeRole="b2b"
        activeItem="dash"
        user={isB2BUser ? { name: user!.name, orgName: user!.orgName, email: user!.email } : null}
      >
        <div className="acc-card">
          <h3>Сводка</h3>
          <div className="acc-stats">
            <div className="acc-stat">
              <div className="l">Опт-скидка</div>
              <div className="v">{pricing.b2bDiscountPercent}%</div>
              <div className="d">базовая, точная — после согласования</div>
            </div>
            <div className="acc-stat">
              <div className="l">Минимальный заказ</div>
              <div className="v">{pricing.b2bMinQuantity} шт</div>
              <div className="d">для опт-цены</div>
            </div>
            <div className="acc-stat">
              <div className="l">Среднее время ответа</div>
              <div className="v">2-4 ч</div>
              <div className="d">в рабочие дни</div>
            </div>
            <div className="acc-stat">
              <div className="l">Регион</div>
              <div className="v" style={{ fontSize: 18 }}>{storefront.city}</div>
              <div className="d">{storefront.region}</div>
            </div>
          </div>
        </div>

        <div id="kp" className="acc-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
            <h3 style={{ margin: 0 }}>Коммерческое предложение</h3>
            <QuoteRequestButton
              scope="b2b"
              buttonLabel="+ Запросить КП"
              buttonClassName="btn btn-primary btn-sm"
            />
          </div>
          <p style={{ color: "var(--text-mute)", fontSize: 14, lineHeight: 1.6 }}>
            Оставьте заявку с описанием объёма и позиций — менеджер пришлёт КП в ответ. Подтверждение цены, сроков и
            условий отгрузки происходит индивидуально.
          </p>
          {isB2BUser && <LeadHistoryList leads={leads} />}
        </div>

        <div id="prices" className="acc-card">
          <h3>Прайс-листы</h3>
          <p style={{ color: "var(--text-mute)", fontSize: 13, marginBottom: 14 }}>
            Актуальные прайс-листы высылает менеджер после оформления опт-аккаунта.
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            {PRICELISTS.map((d) => (
              <div key={d.name} className="doc-card">
                <div className="ic">
                  <FileText size={18} aria-hidden />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="nm">{d.name}</div>
                  <div className="sub">{d.sub}</div>
                </div>
                <QuoteRequestButton
                  scope="b2b"
                  context={`Прайс-лист: ${d.name}`}
                  buttonLabel="Запросить"
                  buttonClassName="btn btn-soft btn-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <div id="manager" className="acc-card">
          <h3>Связь с менеджером</h3>
          <div
            style={{
              padding: 18,
              borderRadius: 16,
              background: "rgba(79,125,255,0.08)",
              border: "1px solid rgba(79,125,255,0.22)",
              display: "grid",
              gap: 12,
            }}
          >
            <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>
              Свяжитесь с нами любым удобным способом — менеджер ответит в рабочее время ({storefront.hours}).
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <a href={`tel:${storefront.phones[0].replace(/[^\d+]/g, "")}`} className="btn btn-primary btn-sm">
                <Phone size={14} aria-hidden /> {storefront.phones[0]}
              </a>
              <a href={`mailto:${storefront.email}`} className="btn btn-soft btn-sm">
                {storefront.email}
              </a>
              <Link href="/catalog" className="btn btn-soft btn-sm">
                В каталог <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </AccountShell>
    </>
  );
}
