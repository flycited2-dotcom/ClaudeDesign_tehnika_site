import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { setLeadStatusAction } from "./actions";

export const dynamic = "force-dynamic";

const TYPE_LABEL = {
  CALLBACK: "Обратный звонок",
  QUOTE: "Запрос КП / опт-цены",
} as const;

const TYPE_TONE = {
  CALLBACK: "bg-sky-50 border-sky-200 text-sky-800",
  QUOTE: "bg-violet-50 border-violet-200 text-violet-800",
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
      <div className="grid gap-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-500">Новых заявок</p>
          <p className="mt-2 text-3xl font-black text-zinc-950">{newCount.toLocaleString("ru-RU")}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Заявки на обратный звонок и КП сохраняются здесь, даже если Telegram-уведомление
            не доставлено. Дублируются в чат менеджера.
          </p>
        </div>

        {leads.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
            Пока нет заявок. Они появятся, когда посетитель оставит обратный звонок или запросит КП.
          </p>
        ) : (
          <div className="grid gap-3">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className={`rounded-lg border bg-white p-4 shadow-sm ${
                  lead.status === "NEW" ? "border-zinc-300" : "border-zinc-200 opacity-70"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TYPE_TONE[lead.type]}`}>
                        {TYPE_LABEL[lead.type]}
                      </span>
                      {lead.scope ? (
                        <span className="text-xs font-semibold text-zinc-500">
                          {SCOPE_LABEL[lead.scope] ?? lead.scope}
                        </span>
                      ) : null}
                      {lead.status === "HANDLED" ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          Обработана
                        </span>
                      ) : null}
                      <span className="text-xs text-zinc-400">{formatDateTime(lead.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-base font-bold text-zinc-950">
                      {lead.name} · {lead.phone}
                    </p>
                    <p className="text-sm text-zinc-700">
                      {[
                        lead.company ? `Организация: ${lead.company}` : null,
                        lead.inn ? `ИНН ${lead.inn}` : null,
                        lead.email ? lead.email : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {lead.context ? (
                      <p className="text-xs text-zinc-500">Товар/раздел: {lead.context}</p>
                    ) : null}
                    {lead.comment ? (
                      <p className="mt-2 max-w-prose rounded-md bg-zinc-50 p-2 text-sm text-zinc-700">
                        {lead.comment}
                      </p>
                    ) : null}
                  </div>

                  <form action={setLeadStatusAction} className="shrink-0">
                    <input type="hidden" name="leadId" value={lead.id} />
                    <input type="hidden" name="status" value={lead.status === "NEW" ? "HANDLED" : "NEW"} />
                    <button
                      type="submit"
                      className={
                        lead.status === "NEW"
                          ? "rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
                          : "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                      }
                    >
                      {lead.status === "NEW" ? "Отметить обработанной" : "Вернуть в новые"}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
