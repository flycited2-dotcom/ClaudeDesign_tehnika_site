"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createQuickOrder, type QuickOrderState } from "@/app/product/[slug]/quick-order-actions";

const initialState: QuickOrderState = {};

export function QuickOrderForm({
  sku,
  quantity,
  sourceUrl,
  disabled,
  compact = false,
}: {
  sku: number;
  quantity: number;
  sourceUrl: string;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(createQuickOrder, initialState);

  const wrapperStyle: React.CSSProperties = compact
    ? { display: "grid", gap: 8 }
    : {
        display: "grid",
        gap: 12,
        padding: 18,
        borderRadius: 18,
        background: "rgba(255,255,255,0.5)",
        border: "1px solid var(--glass-stroke)",
      };

  return (
    <form action={action} style={wrapperStyle}>
      <input type="hidden" name="sku" value={sku} />
      <input type="hidden" name="quantity" value={quantity} />
      <input type="hidden" name="sourceUrl" value={sourceUrl} />
      {!compact ? (
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Быстрый заказ</p>
          <p style={{ marginTop: 4, fontSize: 12, lineHeight: 1.5, color: "var(--text-mute)" }}>
            Оставьте телефон, менеджер подтвердит наличие, цену и доставку 7 дней.
          </p>
        </div>
      ) : null}
      <div
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: compact ? "1fr 1fr" : "1fr",
        }}
      >
        <input className="input" name="customerName" required placeholder="Имя" style={{ height: 42 }} />
        <input className="input" name="phone" required placeholder="Телефон" inputMode="tel" style={{ height: 42 }} />
      </div>
      {!compact ? (
        <textarea
          name="comment"
          rows={2}
          placeholder="Комментарий"
          className="input"
          style={{ height: "auto", padding: "10px 14px", lineHeight: 1.5 }}
        />
      ) : null}
      <label
        style={{
          display: "flex",
          gap: 8,
          fontSize: 12,
          lineHeight: 1.5,
          color: "var(--text-mute)",
          cursor: "pointer",
        }}
      >
        <input
          name="personalDataConsent"
          required
          type="checkbox"
          style={{ marginTop: 2, accentColor: "var(--accent)" }}
        />
        <span>
          Согласен на обработку данных.{" "}
          <Link
            href="/privacy"
            target="_blank"
            style={{ fontWeight: 700, color: "var(--accent-2)" }}
          >
            Политика
          </Link>
        </span>
      </label>
      {state.error ? (
        <p
          style={{
            padding: 8,
            borderRadius: 10,
            background: "rgba(255,90,90,0.12)",
            color: "#a33",
            fontSize: 12,
          }}
        >
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={disabled || pending}
        className={"btn btn-soft" + (compact ? " btn-sm" : "")}
        style={{
          width: "100%",
          opacity: disabled || pending ? 0.6 : 1,
          cursor: disabled || pending ? "not-allowed" : "pointer",
        }}
      >
        {pending ? "Отправляем..." : "Быстрый заказ"}
      </button>
    </form>
  );
}
