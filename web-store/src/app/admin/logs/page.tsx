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

export default async function AdminLogsPage() {
  await requireAdmin();
  const logs = await prisma.syncLog.findMany({
    orderBy: { startedAt: "desc" },
    take: 100,
  });

  return (
    <AdminShell title="Логи">
      <div className="adm-card" style={{ padding: 8 }}>
        {logs.map((log) => (
          <details key={log.id} style={{ borderBottom: "1px solid rgba(33,52,108,0.1)" }}>
            <summary
              className="flex cursor-pointer flex-wrap items-center gap-3 px-3 py-2.5 text-sm"
              style={{ listStyle: "none" }}
            >
              <span className={`adm-badge ${statusBadge(log.status)}`}>{log.status}</span>
              <span className="font-semibold" style={{ color: "var(--text)" }}>
                {log.type}
              </span>
              <span style={{ color: "var(--text-mute)", marginLeft: "auto" }}>{formatDateTime(log.startedAt)}</span>
            </summary>
            <pre
              className="mt-1 mb-2 overflow-auto rounded-xl p-3 text-xs"
              style={{ background: "rgba(16,32,74,0.06)", color: "var(--text-2)" }}
            >
              {JSON.stringify(
                {
                  message: log.message,
                  total: log.total,
                  processed: log.processed,
                  failed: log.failed,
                  commandId: log.commandId,
                  payload: log.payload,
                  finishedAt: log.finishedAt,
                },
                null,
                2,
              )}
            </pre>
          </details>
        ))}
        {!logs.length ? (
          <p className="px-3 py-6 text-sm" style={{ color: "var(--text-mute)" }}>
            Логов пока нет.
          </p>
        ) : null}
      </div>
    </AdminShell>
  );
}
