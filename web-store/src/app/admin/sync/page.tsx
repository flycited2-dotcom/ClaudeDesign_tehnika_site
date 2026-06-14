import { Play } from "lucide-react";
import { runSyncAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

function statusBadge(status: string): string {
  if (status === "success") return "adm-badge--success";
  if (status === "running") return "adm-badge--running";
  return "adm-badge--danger";
}

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
          <form key={type} action={runSyncAction} className="adm-card">
            <p className="font-bold" style={{ fontSize: 16, color: "var(--text)" }}>
              {title}
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-mute)" }}>
              {subtitle}
            </p>
            <input type="hidden" name="type" value={type} />
            <button className="adm-btn adm-btn--soft" style={{ marginTop: 16, width: "100%" }}>
              <Play size={15} aria-hidden />
              Запустить
            </button>
          </form>
        ))}
      </div>

      <div className="adm-section-head" style={{ marginTop: 28 }}>
        <h2>Журнал</h2>
      </div>
      <div className="adm-card" style={{ padding: 0, overflowX: "auto" }}>
        <table className="adm-table" style={{ tableLayout: "fixed", minWidth: 680 }}>
          <colgroup>
            <col style={{ width: 130 }} />
            <col style={{ width: 110 }} />
            <col />
            <col style={{ width: 170 }} />
          </colgroup>
          <thead>
            <tr>
              <th>Тип</th>
              <th>Статус</th>
              <th>Сообщение</th>
              <th>Когда</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="font-semibold">{log.type}</td>
                <td>
                  <span className={`adm-badge ${statusBadge(log.status)}`}>{log.status}</span>
                </td>
                <td className="adm-cell-trunc" style={{ color: "var(--text-2)" }} title={log.message ?? `${log.processed}/${log.total}`}>
                  {log.message ?? `${log.processed}/${log.total}`}
                </td>
                <td style={{ color: "var(--text-mute)" }}>{formatDateTime(log.startedAt)}</td>
              </tr>
            ))}
            {!logs.length ? (
              <tr>
                <td colSpan={4} style={{ color: "var(--text-mute)", textAlign: "center", padding: "28px 14px" }}>
                  Журнал пуст.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
