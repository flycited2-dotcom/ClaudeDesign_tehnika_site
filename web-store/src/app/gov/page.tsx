import type { Metadata } from "next";
import { ArrowRight, FileText, Phone } from "lucide-react";
import Link from "next/link";
import { AccountShell } from "@/components/account-shell";
import { QuoteRequestButton } from "@/components/quote-request-button";
import { RoleUpgradeRequestModal } from "@/components/role-upgrade-request-modal";
import { getCurrentUser, roleToStorefront } from "@/lib/auth";
import { storefront } from "@/lib/storefront";

export const metadata: Metadata = {
  title: "Госзаказчикам",
  description:
    "Поставки для государственных и муниципальных заказчиков по 44-ФЗ и 223-ФЗ. Подбор аналогов, документы, бюджетная отсрочка.",
};

export const dynamic = "force-dynamic";

const DOCUMENTS = [
  ["Выписка из ЕГРЮЛ", "По запросу"],
  ["Аккредитация поставщика", "По запросу"],
  ["Реестр исполненных контрактов", "По запросу"],
  ["Шаблон УПД", "По запросу"],
  ["Договор поставки (типовой)", "По запросу"],
];

export default async function GovPage() {
  const user = await getCurrentUser();
  const userRole = user ? roleToStorefront(user.role) : null;
  const isGovUser = userRole === "gov";
  const isB2CUser = userRole === "b2c";

  const heroCTA = !user ? (
    <Link
      href="/login?next=/gov"
      className="btn btn-soft btn-lg"
      style={{ background: "#fff", color: "var(--accent-2)" }}
    >
      Войти и запросить гос-статус <ArrowRight size={16} aria-hidden />
    </Link>
  ) : isB2CUser ? (
    <RoleUpgradeRequestModal
      requestedRole="gov"
      buttonLabel="Запросить гос-статус"
      buttonClassName="btn btn-soft btn-lg"
      buttonStyle={{ background: "#fff", color: "var(--accent-2)" }}
      defaultContact={user.name}
      defaultPhone={user.phone}
    />
  ) : (
    <QuoteRequestButton
      scope="gov"
      buttonLabel="Запросить КП по ТЗ"
      buttonClassName="btn btn-soft btn-lg"
      buttonStyle={{ background: "#fff", color: "var(--accent-2)" }}
    />
  );

  return (
    <>
      <div className="b2b-banner gov-banner">
        <div>
          <span className="b2b-pill">
            <FileText size={14} aria-hidden /> Госзакупки · 44-ФЗ / 223-ФЗ
          </span>
          <h2>
            Поставки для государственных
            <br />
            и муниципальных заказчиков
          </h2>
          <p>
            Работаем с заказчиками по 44-ФЗ и 223-ФЗ. Подбираем аналоги по ТЗ, готовим КП в течение
            рабочего дня, поставляем с УПД и СФ. Бюджетная отсрочка по согласованию.
          </p>
        </div>
        {heroCTA}
      </div>

      <AccountShell
        activeRole="gov"
        activeItem="dash"
        user={isGovUser ? { name: user!.name, orgName: user!.orgName, email: user!.email } : null}
      >
        <div className="acc-card">
          <h3>Возможности</h3>
          <div className="acc-stats">
            <div className="acc-stat">
              <div className="l">Время ответа на КП</div>
              <div className="v">до 1 дня</div>
              <div className="d">в рабочие часы</div>
            </div>
            <div className="acc-stat">
              <div className="l">Подбор аналогов</div>
              <div className="v">Да</div>
              <div className="d">по техническим характеристикам</div>
            </div>
            <div className="acc-stat">
              <div className="l">Документы</div>
              <div className="v">УПД / СФ</div>
              <div className="d">ЭДО по согласованию</div>
            </div>
            <div className="acc-stat">
              <div className="l">Регион</div>
              <div className="v" style={{ fontSize: 18 }}>{storefront.city}</div>
              <div className="d">{storefront.region}</div>
            </div>
          </div>
        </div>

        <div id="kp" className="acc-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <h3 style={{ margin: 0 }}>Запросить коммерческое предложение</h3>
            <QuoteRequestButton scope="gov" buttonLabel="+ Запрос КП" buttonClassName="btn btn-primary btn-sm" />
          </div>
          <p style={{ color: "var(--text-mute)", fontSize: 14, lineHeight: 1.6 }}>
            Опишите потребность или приложите файл ТЗ к запросу — менеджер ответит с КП и подтверждением сроков.
            Поддерживаем закупки по 44-ФЗ и 223-ФЗ, подбираем аналоги при отсутствии конкретной модели.
          </p>
        </div>

        <div id="docs" className="acc-card">
          <h3>Документы и аккредитации</h3>
          <p style={{ color: "var(--text-mute)", fontSize: 13, marginBottom: 14 }}>
            Полный пакет документов высылается по запросу после оформления заявки.
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            {DOCUMENTS.map(([name, sub]) => (
              <div key={name} className="doc-card">
                <div className="ic">
                  <FileText size={18} aria-hidden />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="nm">{name}</div>
                  <div className="sub">{sub}</div>
                </div>
                <QuoteRequestButton
                  scope="gov"
                  context={`Документ: ${name}`}
                  buttonLabel="Запросить"
                  buttonClassName="btn btn-soft btn-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <div id="manager" className="acc-card">
          <h3>Связь с куратором закупок</h3>
          <div
            style={{
              padding: 18,
              borderRadius: 16,
              background: "rgba(128,104,255,0.10)",
              border: "1px solid rgba(128,104,255,0.28)",
              display: "grid",
              gap: 12,
            }}
          >
            <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>
              Куратор закупок ответит в рабочее время ({storefront.hours}). Подберём аналоги, оформим КП и
              согласуем условия поставки.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <a href={`tel:${storefront.phones[0].replace(/[^\d+]/g, "")}`} className="btn btn-primary btn-sm">
                <Phone size={14} aria-hidden /> {storefront.phones[0]}
              </a>
              <a href={`mailto:${storefront.email}`} className="btn btn-soft btn-sm">
                {storefront.email}
              </a>
              <Link href="/catalog" className="btn btn-soft btn-sm">
                В каталог
              </Link>
            </div>
          </div>
        </div>
      </AccountShell>
    </>
  );
}
