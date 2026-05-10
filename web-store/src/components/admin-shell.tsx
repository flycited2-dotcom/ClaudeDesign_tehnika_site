import { BarChart3, Boxes, ClipboardList, DatabaseZap, FileText, LogOut, Settings, Tags } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";

const links = [
  ["/admin", "Обзор", BarChart3],
  ["/admin/products", "Товары", Boxes],
  ["/admin/categories", "Категории", Tags],
  ["/admin/orders", "Заказы", ClipboardList],
  ["/admin/sync", "Синхронизация", DatabaseZap],
  ["/admin/settings", "Настройки", Settings],
  ["/admin/logs", "Логи", FileText],
] as const;

export function AdminShell({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
      <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
        <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-zinc-500">Админка</p>
        <nav className="space-y-1">
          {links.map(([href, label, Icon]) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-stone-100 hover:text-zinc-950">
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className="mt-4 border-t border-zinc-100 pt-3">
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-zinc-500 hover:bg-red-50 hover:text-red-700">
            <LogOut className="size-4" aria-hidden />
            Выйти
          </button>
        </form>
      </aside>

      <section className="min-w-0">
        <h1 className="mb-6 text-3xl font-black tracking-normal text-zinc-950">{title}</h1>
        {children}
      </section>
    </div>
  );
}
