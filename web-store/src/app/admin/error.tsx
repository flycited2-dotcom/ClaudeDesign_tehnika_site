"use client";

import Link from "next/link";

// Admin error boundary. Admin server actions throw on bad input / missing rows
// (zod .parse, Prisma P2025); without this the operator hit a white screen and
// lost their place. Shows a recovery card scoped to the admin panel.
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ maxWidth: 560, margin: "40px auto", padding: "0 8px" }}>
      <div className="glass" style={{ padding: 24, borderRadius: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>Ошибка в админке</h1>
        <p style={{ marginTop: 10, color: "var(--text-mute)", lineHeight: 1.5 }}>
          Действие не удалось выполнить. Данные не изменены — попробуйте ещё раз или вернитесь к списку.
        </p>
        {error?.message ? (
          <pre
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              background: "rgba(0,0,0,0.04)",
              fontSize: 12,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: "var(--text-2)",
            }}
          >
            {error.message}
          </pre>
        ) : null}
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          <button type="button" onClick={reset} className="btn btn-primary">
            Повторить
          </button>
          <Link href="/admin" className="btn btn-soft">
            В обзор
          </Link>
        </div>
      </div>
    </div>
  );
}
