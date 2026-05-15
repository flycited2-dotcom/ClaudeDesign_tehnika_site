import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { approveRoleUpgradeAction, rejectRoleUpgradeAction } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL = {
  PENDING: "На рассмотрении",
  APPROVED: "Одобрено",
  REJECTED: "Отклонено",
} as const;

const STATUS_TONE = {
  PENDING: "bg-amber-50 border-amber-200 text-amber-800",
  APPROVED: "bg-emerald-50 border-emerald-200 text-emerald-800",
  REJECTED: "bg-rose-50 border-rose-200 text-rose-800",
} as const;

const ROLE_LABEL = {
  B2C: "Розница",
  B2B: "Опт",
  GOV: "Госзаказчик",
} as const;

export default async function AdminRoleRequestsPage() {
  await requireAdmin();

  const requests = await prisma.roleUpgradeRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { user: { select: { email: true, name: true, role: true } } },
    take: 200,
  });

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <AdminShell title="Заявки на роли">
      <div className="grid gap-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-500">Заявок на рассмотрении</p>
          <p className="mt-2 text-3xl font-black text-zinc-950">{pendingCount.toLocaleString("ru-RU")}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Одобрение меняет роль пользователя в БД, копирует реквизиты и шлёт email-уведомление.
          </p>
        </div>

        {requests.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
            Пока нет ни одной заявки. Они появятся, когда залогиненный b2c-пользователь
            оставит запрос на странице /b2b или /gov.
          </p>
        ) : (
          <div className="grid gap-3">
            {requests.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[r.status]}`}
                      >
                        {STATUS_LABEL[r.status]}
                      </span>
                      <span className="text-xs font-semibold text-zinc-500">
                        → {ROLE_LABEL[r.requestedRole]}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {formatDateTime(r.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-base font-bold text-zinc-950">{r.orgName}</p>
                    <p className="text-sm text-zinc-700">
                      {r.contactPerson} · {r.phone}
                      {r.inn ? ` · ИНН ${r.inn}` : ""}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Пользователь: {r.user.email}
                      {r.user.name ? ` (${r.user.name})` : ""} ·
                      текущая роль: {ROLE_LABEL[r.user.role]}
                    </p>
                    {r.note && (
                      <p className="mt-2 max-w-prose rounded-md bg-zinc-50 p-2 text-sm text-zinc-700">
                        {r.note}
                      </p>
                    )}
                    {r.reviewNote && r.status !== "PENDING" && (
                      <p className="mt-2 text-xs text-zinc-500">
                        Комментарий админа: {r.reviewNote}
                        {r.reviewedBy ? ` · ${r.reviewedBy}` : ""}
                        {r.reviewedAt ? ` · ${formatDateTime(r.reviewedAt)}` : ""}
                      </p>
                    )}
                  </div>

                  {r.status === "PENDING" && (
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                      <form action={approveRoleUpgradeAction}>
                        <input type="hidden" name="requestId" value={r.id} />
                        <button
                          type="submit"
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          Одобрить
                        </button>
                      </form>
                      <form action={rejectRoleUpgradeAction} className="flex gap-2">
                        <input type="hidden" name="requestId" value={r.id} />
                        <input
                          name="reviewNote"
                          type="text"
                          placeholder="Причина отказа"
                          className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
                          style={{ minWidth: 180 }}
                        />
                        <button
                          type="submit"
                          className="rounded-md border border-rose-300 bg-white px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Отклонить
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
