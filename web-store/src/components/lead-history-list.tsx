import type { LeadStatus } from "@prisma/client";

const LEAD_STATUS: Record<LeadStatus, { label: string; cls: string }> = {
  NEW: { label: "Новая", cls: "status-new" },
  HANDLED: { label: "Обработана", cls: "status-done" },
};

export type LeadHistoryItem = {
  id: string;
  status: LeadStatus;
  context: string | null;
  createdAt: Date;
};

export function LeadHistoryList({ leads }: { leads: LeadHistoryItem[] }) {
  return (
    <div style={{ marginTop: 16 }}>
      <h4 style={{ margin: "0 0 10px", fontSize: 14 }}>История заявок</h4>
      {leads.length === 0 ? (
        <p style={{ color: "var(--text-mute)", fontSize: 13 }}>Заявок пока нет.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {leads.map((lead) => {
            const s = LEAD_STATUS[lead.status];
            return (
              <div
                key={lead.id}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 10,
                  padding: 12,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid var(--glass-stroke)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>
                    {lead.context || "Заявка на КП"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
                    {new Date(lead.createdAt).toLocaleDateString("ru-RU")}
                  </div>
                </div>
                <span className={`status-pill ${s.cls}`}>{s.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
