"use client";

import { Phone, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useActionState } from "react";
import { requestCallbackAction, type CallbackState } from "@/app/callback/actions";

const initialState: CallbackState = {};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-2)",
};

export function CallbackButton({
  variant = "header",
  className,
  children,
}: {
  variant?: "header" | "inline";
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(requestCallbackAction, initialState);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
        style={
          variant === "header"
            ? {
                display: "block",
                marginTop: 4,
                background: 0,
                border: 0,
                padding: 0,
                cursor: "pointer",
                color: "var(--accent-2)",
                fontSize: "11.5px",
                fontWeight: 700,
                textAlign: "left",
                fontFamily: "inherit",
                lineHeight: "inherit",
              }
            : undefined
        }
      >
        {children ?? "Обратный звонок →"}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Заказ обратного звонка"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 220,
            background: "rgba(11,20,70,0.55)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="glass-strong"
            style={{ width: "min(460px, 100%)", padding: 28, borderRadius: 24, position: "relative" }}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Закрыть"
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                width: 36,
                height: 36,
                borderRadius: 999,
                background: "rgba(33,52,108,0.06)",
                border: 0,
                color: "var(--text-mute)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} aria-hidden />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: "linear-gradient(135deg,#75a2ff,#426dff)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <Phone size={20} aria-hidden />
              </span>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>Обратный звонок</h2>
                <p style={{ marginTop: 4, fontSize: 13, color: "var(--text-mute)" }}>
                  Менеджер перезвонит в течение рабочего времени.
                </p>
              </div>
            </div>

            {state.ok ? (
              <div
                style={{
                  marginTop: 22,
                  padding: 18,
                  borderRadius: 16,
                  background: "rgba(34,221,136,0.14)",
                  color: "#0e6b3a",
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                Спасибо! Менеджер перезвонит на указанный номер.
              </div>
            ) : (
              <form action={action} style={{ marginTop: 20, display: "grid", gap: 12 }}>
                <label style={labelStyle}>
                  Имя
                  <input className="input" name="customerName" required maxLength={120} style={{ height: 44 }} />
                </label>
                <label style={labelStyle}>
                  Телефон
                  <input
                    className="input"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    required
                    maxLength={40}
                    placeholder="+7 …"
                    style={{ height: 44 }}
                  />
                </label>
                <label style={labelStyle}>
                  Комментарий (необязательно)
                  <textarea
                    className="input"
                    name="comment"
                    rows={2}
                    maxLength={500}
                    style={{ height: "auto", padding: "10px 14px", lineHeight: 1.5 }}
                  />
                </label>
                <label style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--text-mute)", lineHeight: 1.5 }}>
                  <input
                    type="checkbox"
                    name="personalDataConsent"
                    required
                    style={{ marginTop: 2, accentColor: "var(--accent)" }}
                  />
                  <span>
                    Согласен на обработку данных.{" "}
                    <Link href="/privacy" target="_blank" style={{ color: "var(--accent-2)", fontWeight: 700 }}>
                      Политика
                    </Link>
                  </span>
                </label>
                {state.error && (
                  <p
                    style={{
                      padding: 10,
                      borderRadius: 12,
                      background: "rgba(255,90,90,0.12)",
                      color: "#a33",
                      fontSize: 13,
                    }}
                  >
                    {state.error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={pending}
                  className="btn btn-primary"
                  style={{ width: "100%", opacity: pending ? 0.7 : 1 }}
                >
                  {pending ? "Отправляем…" : "Заказать звонок"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
