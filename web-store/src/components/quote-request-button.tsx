"use client";

import { FileText, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { PhoneField } from "@/components/phone-field";
import { requestQuoteAction, type QuoteState } from "@/app/quote/actions";

const initialState: QuoteState = {};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-2)",
};

export function QuoteRequestButton({
  scope,
  context,
  buttonLabel,
  buttonClassName = "btn btn-primary",
  buttonStyle,
}: {
  scope: "b2b" | "gov";
  context?: string;
  buttonLabel?: string;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(requestQuoteAction, initialState);

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

  const title = scope === "b2b" ? "Запросить опт-цену" : "Запросить КП";
  const sub =
    scope === "b2b"
      ? "Менеджер уточнит наличие, опт-цену и условия по объёму."
      : "Подготовим коммерческое предложение по 44-ФЗ / 223-ФЗ.";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClassName}
        style={buttonStyle}
      >
        <FileText size={16} aria-hidden />
        {buttonLabel ?? title}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={title}
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
            style={{ width: "min(520px, 100%)", padding: 28, borderRadius: 24, position: "relative" }}
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

            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{title}</h2>
            <p style={{ marginTop: 6, color: "var(--text-mute)", fontSize: 13, lineHeight: 1.5 }}>{sub}</p>

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
                Спасибо! Заявка принята. Менеджер свяжется с вами.
              </div>
            ) : (
              <form action={action} style={{ marginTop: 20, display: "grid", gap: 12 }}>
                <input type="hidden" name="scope" value={scope} />
                {context && <input type="hidden" name="context" value={context} />}
                <label style={labelStyle}>
                  Имя
                  <input className="input" name="customerName" required maxLength={120} style={{ height: 44 }} />
                </label>
                <label style={labelStyle}>
                  Организация
                  <input
                    className="input"
                    name="companyName"
                    placeholder="ООО / ИП / Орган власти"
                    maxLength={160}
                    style={{ height: 44 }}
                  />
                </label>
                <label style={labelStyle}>
                  ИНН
                  <input
                    className="input"
                    name="inn"
                    inputMode="numeric"
                    maxLength={20}
                    placeholder="10 или 12 цифр"
                    style={{ height: 44 }}
                  />
                </label>
                <label style={labelStyle}>
                  Телефон
                  <PhoneField required style={{ height: 44 }} />
                </label>
                <label style={labelStyle}>
                  Email
                  <input className="input" name="email" type="email" maxLength={160} style={{ height: 44 }} />
                </label>
                <label style={labelStyle}>
                  Комментарий
                  <textarea
                    className="input"
                    name="comment"
                    rows={3}
                    maxLength={800}
                    placeholder={scope === "gov" ? "Объёмы, сроки, требования по 44-ФЗ / 223-ФЗ" : "Объёмы, регионы, особые условия"}
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
                  {pending ? "Отправляем…" : "Отправить заявку"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
