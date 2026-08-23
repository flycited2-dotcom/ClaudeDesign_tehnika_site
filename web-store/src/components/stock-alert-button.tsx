"use client";

import { Bell, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { PhoneField } from "@/components/phone-field";
import { requestStockAlertAction, type StockAlertState } from "@/app/stock-alert/actions";

const initialState: StockAlertState = {};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-2)",
};

export function StockAlertButton({
  productContext,
  buttonClassName = "btn btn-soft",
  buttonStyle,
}: {
  productContext: string;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(requestStockAlertAction, initialState);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClassName} style={buttonStyle}>
        <Bell size={16} aria-hidden />
        Уведомить о поступлении
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Уведомить о поступлении"
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
                <Bell size={20} aria-hidden />
              </span>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>Уведомить о поступлении</h2>
                <p style={{ marginTop: 4, fontSize: 13, color: "var(--text-mute)" }}>
                  Оставьте телефон — менеджер свяжется, как только товар появится в наличии.
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
                Спасибо! Сообщим, как только товар появится в наличии.
              </div>
            ) : (
              <form action={action} style={{ marginTop: 20, display: "grid", gap: 12 }}>
                <input type="hidden" name="productContext" value={productContext} />
                <label style={labelStyle}>
                  Имя
                  <input className="input" name="customerName" required maxLength={120} style={{ height: 44 }} />
                </label>
                <label style={labelStyle}>
                  Телефон
                  <PhoneField required style={{ height: 44 }} />
                </label>
                <label style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--text-mute)", lineHeight: 1.5 }}>
                  <input
                    type="checkbox"
                    name="personalDataConsent"
                    required
                    style={{ marginTop: 2, accentColor: "var(--accent)" }}
                  />
                  <span>
                    Даю <Link href="/personal-data-consent" target="_blank" style={{ color: "var(--accent-2)", fontWeight: 700 }}>
                      согласие на обработку персональных данных
                    </Link>{" "}и ознакомлен с{" "}
                    <Link href="/privacy" target="_blank" style={{ color: "var(--accent-2)", fontWeight: 700 }}>Политикой</Link>.
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
                  {pending ? "Отправляем…" : "Уведомить меня"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
