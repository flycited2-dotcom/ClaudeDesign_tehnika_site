import { Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { deleteLeadAction, setLeadStatusAction } from "./actions";

export const dynamic = "force-dynamic";

const TYPE_LABEL = {
  CALLBACK: "Обратный звонок",
  QUOTE: "Запрос КП / опт-цены",
} as const;

const TYPE_BADGE = {
  CALLBACK: "adm-badge--active",
  QUOTE: "adm-badge--running",
} as const;

const SCOPE_LABEL: Record<string, string> = {
  b2b: "опт",
  gov: "госзаказ",
};

export default async function AdminLeadsPage() {
  await requireAdmin();

  const leads = await prisma.lead.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 300,
  });

  const newCount = leads.filter((lead) => lead.status === "NEW").length;

  return (
    <AdminShell title="Заявки (звонок / КП)">
      <div className="adm-section-head">
        <p className="adm-section-meta" style={{ maxWidth: 520 }}>
          Заявки на обратный звонок и КП сохраняются здесь, даже если Telegram-уведомление
          не доставлено. Дублируются в чат менеджера.
        </p>
        <div className="adm-section-right">
          <span className="adm-badge adm-badge--muted">Всего: {leads.length.toLocaleString("ru-RU")}</span>
          {newCount > 0 ? <span className="adm-badge adm-badge--new">Новых: {newCount.toLocaleString("ru-RU")}</span> : null}
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="adm-card" style={{ textAlign: "center", color: "var(--text-mute)", padding: 40 }}>
          Пока нет заявок. Они появятся, когда посетитель оставит обратный звонок или запросит КП.
        </div>
      ) : (
        <div className="grid gap-3">
          {leads.map((lead) => (
            <div key={lead.id} className="adm-card" style={lead.status === "HANDLED" ? { background: "rgba(255,255,255,0.42)" } : undefined}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`adm-badge ${TYPE_BADGE[lead.type]}`}>{TYPE_LABEL[lead.type]}</span>
                    {lead.scope ? (
                      <span className="adm-badge adm-badge--muted">{SCOPE_LABEL[lead.scope] ?? lead.scope}</span>
                    ) : null}
                    {lead.status === "HANDLED" ? <span className="adm-badge adm-badge--success">Обработана</span> : null}
                    <span className="text-xs" style={{ color: "var(--text-soft)" }}>{formatDateTime(lead.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-base font-bold" style={{ color: "var(--text)" }}>
                    {lead.name} · {lead.phone}
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-2)" }}>
                    {[
                      lead.company ? `Организация: ${lead.company}` : null,
                      lead.inn ? `ИНН ${lead.inn}` : null,
                      lead.email ? lead.email : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {lead.context ? (
                    <p className="text-xs" style={{ color: "var(--text-mute)" }}>
                      Товар/раздел: {lead.context}
                    </p>
                  ) : null}
                  {lead.comment ? (
                    <p className="mt-2 max-w-prose rounded-xl p-2 text-sm" style={{ background: "rgba(16,32,74,0.05)", color: "var(--text-2)" }}>
                      {lead.comment}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <form action={setLeadStatusAction}>
                    <input type="hidden" name="leadId" value={lead.id} />
                    <input type="hidden" name="status" value={lead.status === "NEW" ? "HANDLED" : "NEW"} />
                    <button type="submit" className={`adm-btn ${lead.status === "NEW" ? "adm-btn--primary" : "adm-btn--soft"}`}>
                      {lead.status === "NEW" ? "Отметить обработанной" : "Вернуть в новые"}
                    </button>
                  </form>
                  <form action={deleteLeadAction}>
                    <input type="hidden" name="leadId" value={lead.id} />
                    <ConfirmSubmitButton confirmText="Удалить заявку? Действие необратимо." className="adm-btn adm-btn--danger" >
                      <Trash2 size={15} aria-hidden />
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
