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

const STATUS_BADGE = {
  PENDING: "adm-badge--new",
  APPROVED: "adm-badge--success",
  REJECTED: "adm-badge--danger",
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
      <div className="adm-section-head">
        <p className="adm-section-meta" style={{ maxWidth: 520 }}>
          Одобрение меняет роль пользователя в БД, копирует реквизиты и шлёт email-уведомление.
        </p>
        <div className="adm-section-right">
          <span className="adm-badge adm-badge--muted">Всего: {requests.length.toLocaleString("ru-RU")}</span>
          {pendingCount > 0 ? <span className="adm-badge adm-badge--new">На рассмотрении: {pendingCount.toLocaleString("ru-RU")}</span> : null}
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="adm-card" style={{ textAlign: "center", color: "var(--text-mute)", padding: 40 }}>
          Пока нет ни одной заявки. Они появятся, когда залогиненный b2c-пользователь
          оставит запрос на странице /b2b или /gov.
        </div>
      ) : (
        <div className="grid gap-3">
          {requests.map((r) => (
            <div key={r.id} className="adm-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`adm-badge ${STATUS_BADGE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                    <span className="adm-badge adm-badge--muted">→ {ROLE_LABEL[r.requestedRole]}</span>
                    <span className="text-xs" style={{ color: "var(--text-soft)" }}>{formatDateTime(r.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-base font-bold" style={{ color: "var(--text)" }}>
                    {r.orgName}
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-2)" }}>
                    {r.contactPerson} · {r.phone}
                    {r.inn ? ` · ИНН ${r.inn}` : ""}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-mute)" }}>
                    Пользователь: {r.user.email}
                    {r.user.name ? ` (${r.user.name})` : ""} · текущая роль: {ROLE_LABEL[r.user.role]}
                  </p>
                  {r.note && (
                    <p className="mt-2 max-w-prose rounded-xl p-2 text-sm" style={{ background: "rgba(16,32,74,0.05)", color: "var(--text-2)" }}>
                      {r.note}
                    </p>
                  )}
                  {r.reviewNote && r.status !== "PENDING" && (
                    <p className="mt-2 text-xs" style={{ color: "var(--text-mute)" }}>
                      Комментарий админа: {r.reviewNote}
                      {r.reviewedBy ? ` · ${r.reviewedBy}` : ""}
                      {r.reviewedAt ? ` · ${formatDateTime(r.reviewedAt)}` : ""}
                    </p>
                  )}
                </div>

                {r.status === "PENDING" && (
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-start">
                    <form action={approveRoleUpgradeAction}>
                      <input type="hidden" name="requestId" value={r.id} />
                      <button type="submit" className="adm-btn adm-btn--primary">
                        Одобрить
                      </button>
                    </form>
                    <form action={rejectRoleUpgradeAction} className="flex gap-2">
                      <input type="hidden" name="requestId" value={r.id} />
                      <input name="reviewNote" type="text" placeholder="Причина отказа" className="adm-input" style={{ minWidth: 180, height: 42 }} />
                      <button type="submit" className="adm-btn adm-btn--danger">
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
    </AdminShell>
  );
}
