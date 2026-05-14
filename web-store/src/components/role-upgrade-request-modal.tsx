"use client";

import { useState } from "react";
import { requestRoleUpgradeAction } from "@/app/role-request/actions";

export function RoleUpgradeRequestModal({
  requestedRole,
  buttonLabel,
  buttonClassName = "btn btn-soft btn-lg",
  buttonStyle,
  defaultContact,
  defaultPhone,
}: {
  requestedRole: "b2b" | "gov";
  buttonLabel: string;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
  defaultContact?: string | null;
  defaultPhone?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "submitting" }
    | { status: "ok"; message: string }
    | { status: "error"; error: string }
  >({ status: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("requestedRole", requestedRole);
    setState({ status: "submitting" });
    const result = await requestRoleUpgradeAction(data);
    if (result.ok) {
      setState({ status: "ok", message: result.message });
      form.reset();
    } else {
      setState({ status: "error", error: result.error });
    }
  }

  const title =
    requestedRole === "b2b"
      ? "Запрос статуса опт-клиента"
      : "Запрос статуса госзаказчика";
  const helper =
    requestedRole === "b2b"
      ? "Менеджер свяжется с вами в рабочее время и подтвердит оптовые условия."
      : "Менеджер свяжется с вами для аккредитации в качестве госзаказчика (44-ФЗ / 223-ФЗ).";

  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        style={buttonStyle}
        onClick={() => {
          setOpen(true);
          setState({ status: "idle" });
        }}
      >
        {buttonLabel}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,20,30,0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass"
            style={{
              maxWidth: 520,
              width: "100%",
              padding: 24,
              borderRadius: 22,
              background: "var(--glass-bg-3)",
              display: "grid",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10 }}>
              <div>
                <h3 style={{ margin: 0 }}>{title}</h3>
                <p style={{ marginTop: 6, fontSize: 13, color: "var(--text-mute)", lineHeight: 1.5 }}>
                  {helper}
                </p>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="Закрыть"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>

            {state.status === "ok" ? (
              <div
                role="status"
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: "rgba(70,180,120,0.10)",
                  border: "1px solid rgba(70,180,120,0.30)",
                  color: "#2a6a44",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {state.message}
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>Название организации*</span>
                  <input name="orgName" type="text" required className="input" placeholder="ООО «Дельта-Сервис»" />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>ИНН</span>
                  <input name="inn" type="text" inputMode="numeric" className="input" placeholder="7701234567" />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>Контактное лицо*</span>
                  <input
                    name="contactPerson"
                    type="text"
                    required
                    className="input"
                    placeholder="Алексей Иванов"
                    defaultValue={defaultContact ?? ""}
                  />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>Телефон*</span>
                  <input
                    name="phone"
                    type="tel"
                    required
                    className="input"
                    placeholder="+7 978 000-00-00"
                    defaultValue={defaultPhone ?? ""}
                  />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>Комментарий</span>
                  <textarea
                    name="note"
                    rows={3}
                    className="input"
                    placeholder="Объём, ассортимент, особые условия"
                    style={{ resize: "vertical", minHeight: 80 }}
                  />
                </label>

                {state.status === "error" && (
                  <div
                    role="alert"
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      background: "rgba(220,80,80,0.10)",
                      border: "1px solid rgba(220,80,80,0.30)",
                      color: "#9b2a2a",
                      fontSize: 13,
                    }}
                  >
                    {state.error}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                  <button
                    type="button"
                    className="btn btn-soft"
                    onClick={() => setOpen(false)}
                    disabled={state.status === "submitting"}
                  >
                    Отмена
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={state.status === "submitting"}>
                    {state.status === "submitting" ? "Отправляем…" : "Отправить заявку"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
