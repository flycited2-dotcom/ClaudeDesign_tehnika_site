import { runSyncAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminSyncPage() {
  await requireAdmin();
  const logs = await prisma.syncLog.findMany({ orderBy: { startedAt: "desc" }, take: 20 });

  return (
    <AdminShell title="Синхронизация">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["categories", "Категории", "catalog_tree_9.json"],
          ["products", "Товары", "products_9.json"],
          ["prices", "Цены и остатки", "get_active_products"],
          ["images", "Изображения", "read_new metadata"],
        ].map(([type, title, subtitle]) => (
          <form key={type} action={runSyncAction} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <input type="hidden" name="type" value={type} />
            <p className="text-lg font-bold text-zinc-950">{title}</p>
            <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
            <button className="mt-5 h-10 w-full rounded-lg bg-zinc-950 text-sm font-semibold text-white hover:bg-teal-800">Запустить</button>
          </form>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-950">Журнал</h2>
        <div className="mt-4 divide-y divide-zinc-100">
          {logs.map((log) => (
            <div key={log.id} className="grid gap-2 py-3 text-sm md:grid-cols-[120px_100px_1fr_160px]">
              <span className="font-semibold">{log.type}</span>
              <span>{log.status}</span>
              <span className="text-zinc-600">{log.message ?? `${log.processed}/${log.total}`}</span>
              <span className="text-zinc-500">{formatDateTime(log.startedAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
