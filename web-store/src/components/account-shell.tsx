import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Building2,
  FileText,
  HeadphonesIcon,
  Heart,
  LogOut,
  MapPin,
  Package,
  Receipt,
  Settings,
  User,
} from "lucide-react";
import Link from "next/link";
import { storefront } from "@/lib/storefront";
import { ROLE_LABELS, type StorefrontRole } from "@/lib/use-role";

type SidebarItem = {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  count?: string;
};

const itemsByRole: Record<StorefrontRole, SidebarItem[]> = {
  b2c: [
    { id: "dash", href: "/account", label: "Кабинет", icon: User },
    { id: "orders", href: "/account#orders", label: "Мои заказы", icon: Package },
    { id: "favs", href: "/favorites", label: "Избранное", icon: Heart },
    { id: "compare", href: "/compare", label: "Сравнение", icon: ArrowLeftRight },
    { id: "addr", href: "/account#addresses", label: "Адреса доставки", icon: MapPin },
    { id: "settings", href: "/account#settings", label: "Настройки", icon: Settings },
  ],
  b2b: [
    { id: "dash", href: "/b2b", label: "Кабинет", icon: User },
    { id: "orders", href: "/b2b#orders", label: "Заказы", icon: Package },
    { id: "kp", href: "/b2b#kp", label: "Коммерческие предложения", icon: FileText },
    { id: "prices", href: "/b2b#prices", label: "Прайс-листы", icon: Receipt },
    { id: "manager", href: "/b2b#manager", label: "Личный менеджер", icon: HeadphonesIcon },
    { id: "docs", href: "/b2b#docs", label: "Документы", icon: FileText },
    { id: "company", href: "/b2b#company", label: "Реквизиты", icon: Building2 },
  ],
  gov: [
    { id: "dash", href: "/gov", label: "Кабинет", icon: User },
    { id: "tenders", href: "/gov#tenders", label: "Тендеры и закупки", icon: FileText },
    { id: "kp", href: "/gov#kp", label: "Запросы КП", icon: Receipt },
    { id: "contracts", href: "/gov#contracts", label: "Договоры", icon: FileText },
    { id: "specs", href: "/gov#specs", label: "Спецификации", icon: FileText },
    { id: "manager", href: "/gov#manager", label: "Куратор закупок", icon: HeadphonesIcon },
    { id: "company", href: "/gov#company", label: "Организация", icon: Building2 },
  ],
};

const titleByRole: Record<StorefrontRole, string> = {
  b2c: "Личный кабинет",
  b2b: "Кабинет оптовика",
  gov: "Кабинет госзаказчика",
};

export function AccountShell({
  activeRole,
  activeItem,
  children,
}: {
  activeRole: StorefrontRole;
  activeItem: string;
  children: React.ReactNode;
}) {
  const items = itemsByRole[activeRole];
  const subtitle =
    activeRole === "b2b"
      ? "Опт · 44-ФЗ / 223-ФЗ"
      : activeRole === "gov"
      ? "Госзакупки · 44-ФЗ / 223-ФЗ"
      : ROLE_LABELS.b2c;

  return (
    <>
      <div className="bread">
        <Link href="/">Главная</Link>
        <span>›</span>
        <span>{titleByRole[activeRole]}</span>
      </div>

      <div className="acc-layout">
        <aside className="acc-sidebar">
          <div className="acc-user">
            <div className="acc-avatar">{activeRole === "gov" ? "ГЗ" : activeRole === "b2b" ? "ОП" : "Г"}</div>
            <div>
              <div className="acc-name">Гость</div>
              <div className="acc-meta">{subtitle}</div>
            </div>
          </div>
          <nav className="acc-nav">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.id} href={item.href} className={item.id === activeItem ? "on" : ""}>
                  <Icon size={16} aria-hidden />
                  {item.label}
                  {item.count && <span className="cnt">{item.count}</span>}
                </Link>
              );
            })}
            <a
              href={`tel:${storefront.phones[0].replace(/[^\d+]/g, "")}`}
              style={{ marginTop: 14, color: "var(--text-mute)" }}
            >
              <LogOut size={16} aria-hidden />
              Связаться с менеджером
            </a>
          </nav>
        </aside>

        <div className="acc-content">{children}</div>
      </div>
    </>
  );
}
