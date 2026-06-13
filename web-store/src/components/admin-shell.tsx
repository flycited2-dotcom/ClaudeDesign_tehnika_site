import { BarChart3, Boxes, ClipboardList, DatabaseZap, FileText, LogOut, PhoneCall, Settings, ShieldCheck, Tags } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";

const links = [
  ["/admin", "Обзор", BarChart3],
  ["/admin/products", "Товары", Boxes],
  ["/admin/categories", "Категории", Tags],
  ["/admin/orders", "Заказы", ClipboardList],
  ["/admin/leads", "Заявки (звонок/КП)", PhoneCall],
  ["/admin/role-requests", "Заявки на роли", ShieldCheck],
  ["/admin/sync", "Синхронизация", DatabaseZap],
  ["/admin/settings", "Настройки", Settings],
  ["/admin/logs", "Логи", FileText],
] as const;

export function AdminShell({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div
      className="admin-area"
      style={{
        display: "grid",
        gap: 24,
        gridTemplateColumns: "260px minmax(0, 1fr)",
        alignItems: "start",
      }}
    >
      <aside className="glass" style={{ padding: 16, borderRadius: 22, position: "sticky", top: 100 }}>
        <p
          style={{
            padding: "6px 12px",
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: "var(--text-mute)",
          }}
        >
          Админка
        </p>
        <nav style={{ display: "grid", gap: 2 }}>
          {links.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              className="f-row"
              style={{ margin: 0, gap: 12 }}
            >
              <Icon size={16} aria-hidden />
              <span style={{ flex: 1 }}>{label}</span>
            </Link>
          ))}
        </nav>
        <form
          action={logoutAction}
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.5)",
          }}
        >
          <button
            type="submit"
            className="f-row"
            style={{
              margin: 0,
              gap: 12,
              cursor: "pointer",
              color: "var(--text-mute)",
              border: 0,
              background: "none",
              width: "100%",
              textAlign: "left",
              font: "inherit",
            }}
          >
            <LogOut size={16} aria-hidden />
            <span style={{ flex: 1 }}>Выйти</span>
          </button>
        </form>
      </aside>

      <section style={{ minWidth: 0 }}>
        <h1
          style={{
            marginBottom: 24,
            fontSize: 30,
            fontWeight: 900,
            letterSpacing: "-0.01em",
            color: "var(--text)",
          }}
        >
          {title}
        </h1>
        {children}
      </section>
    </div>
  );
}
