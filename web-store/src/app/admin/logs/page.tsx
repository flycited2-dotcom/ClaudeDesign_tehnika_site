import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  await requireAdmin();
  const logs = await prisma.syncLog.findMany({
    orderBy: { startedAt: "desc" },
    take: 100,
  });

  return (
    <AdminShell title="Логи">
      <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white shadow-sm">
        {logs.map((log) => (
          <details key={log.id} className="p-4">
            <summary className="cursor-pointer text-sm">
              <span className="font-semibold">{log.type}</span> · {log.status} · {formatDateTime(log.startedAt)}
            </summary>
            <pre className="mt-3 overflow-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-100">
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
        {!logs.length ? <p className="p-6 text-sm text-zinc-500">Логов пока нет.</p> : null}
      </div>
    </AdminShell>
  );
}
