import { ArrowLeft, BarChart3, Boxes, ClipboardList, DatabaseZap, FileText, LogOut, PhoneCall, Settings, ShieldCheck, Tags } from "lucide-react";
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
    <div className="adm-content" style={{ margin: "0 auto" }}>
      <header className="glass-strong adm-topbar">
        <span className="adm-topbar-brand">
          БытТехОпт
          <span className="adm-topbar-tag">Админ-панель</span>
        </span>
        <Link href="/" className="adm-topbar-link">
          <ArrowLeft size={16} aria-hidden />
          <span>На сайт</span>
        </Link>
      </header>

      <div className="admin-area">
        <aside className="glass admin-aside">
        <p className="admin-aside-label">Админка</p>
        <nav className="admin-nav">
          {links.map(([href, label, Icon]) => (
            <Link key={href} href={href} className="admin-nav-link">
              <Icon size={16} aria-hidden />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className="admin-logout-form">
          <button type="submit" className="admin-nav-link admin-logout">
            <LogOut size={16} aria-hidden />
            <span>Выйти</span>
          </button>
        </form>
      </aside>

        <section className="admin-main">
          <h1 className="admin-title">{title}</h1>
          {children}
        </section>
      </div>
    </div>
  );
}
