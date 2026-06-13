import type { LucideIcon } from "lucide-react";
import { ArrowLeftRight, Heart, LogOut, User } from "lucide-react";
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

// Only destinations that actually exist. The earlier sidebars linked to hash
// anchors (#orders, #kp, #docs, …) for sections that were never built, so those
// items scrolled nowhere. Favorites/compare are shared client storage and work
// for every role, so all three cabinets share the same working nav.
const COMMON_ITEMS: Omit<SidebarItem, "id">[] = [
  { href: "/favorites", label: "Избранное", icon: Heart },
  { href: "/compare", label: "Сравнение", icon: ArrowLeftRight },
];

const itemsByRole: Record<StorefrontRole, SidebarItem[]> = {
  b2c: [
    { id: "dash", href: "/account", label: "Кабинет", icon: User },
    { id: "favs", ...COMMON_ITEMS[0] },
    { id: "compare", ...COMMON_ITEMS[1] },
  ],
  b2b: [
    { id: "dash", href: "/b2b", label: "Кабинет", icon: User },
    { id: "favs", ...COMMON_ITEMS[0] },
    { id: "compare", ...COMMON_ITEMS[1] },
  ],
  gov: [
    { id: "dash", href: "/gov", label: "Кабинет", icon: User },
    { id: "favs", ...COMMON_ITEMS[0] },
    { id: "compare", ...COMMON_ITEMS[1] },
  ],
};

const titleByRole: Record<StorefrontRole, string> = {
  b2c: "Личный кабинет",
  b2b: "Кабинет оптовика",
  gov: "Кабинет госзаказчика",
};

function initialsFor({
  role,
  userName,
  orgName,
}: {
  role: StorefrontRole;
  userName: string | null;
  orgName: string | null;
}): string {
  const source = orgName ?? userName ?? "";
  const cleaned = source.replace(/^ООО\s*[«"]?/i, "").replace(/[»"]/g, "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1 && words[0].length >= 2) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return role === "gov" ? "ГЗ" : role === "b2b" ? "ОП" : "Г";
}

export function AccountShell({
  activeRole,
  activeItem,
  user,
  children,
}: {
  activeRole: StorefrontRole;
  activeItem: string;
  user?: {
    name: string | null;
    orgName: string | null;
    email: string | null;
  } | null;
  children: React.ReactNode;
}) {
  const items = itemsByRole[activeRole];
  const baseSubtitle =
    activeRole === "b2b"
      ? "Опт · 44-ФЗ / 223-ФЗ"
      : activeRole === "gov"
      ? "Госзакупки · 44-ФЗ / 223-ФЗ"
      : ROLE_LABELS.b2c;

  const displayName = user?.orgName?.trim()
    ? user.orgName
    : user?.name?.trim()
    ? user.name
    : user?.email ?? "Гость";
  const subtitle = user?.email ? user.email : baseSubtitle;
  const avatarText = user
    ? initialsFor({ role: activeRole, userName: user.name, orgName: user.orgName })
    : activeRole === "gov"
    ? "ГЗ"
    : activeRole === "b2b"
    ? "ОП"
    : "Г";

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
            <div className="acc-avatar">{avatarText}</div>
            <div>
              <div className="acc-name">{displayName}</div>
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
            {user && (
              <a href="/logout" style={{ color: "var(--text-mute)" }}>
                <LogOut size={16} aria-hidden />
                Выйти
              </a>
            )}
          </nav>
        </aside>

        <div className="acc-content">{children}</div>
      </div>
    </>
  );
}
