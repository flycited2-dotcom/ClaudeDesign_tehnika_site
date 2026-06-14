"use client";

import Link from "next/link";

// Storefront error boundary. Catches render/query failures in any page segment
// (e.g. a DB pool timeout in /catalog/[slug] or /product/[slug]) and shows a
// branded recovery card instead of Next.js's bare "Application error" screen.
export default function StorefrontError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ maxWidth: 560, margin: "80px auto", padding: "0 20px" }}>
      <div className="glass" style={{ padding: 28, borderRadius: 22, textAlign: "center" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)" }}>Что-то пошло не так</h1>
        <p style={{ marginTop: 10, color: "var(--text-mute)", lineHeight: 1.5 }}>
          Не удалось загрузить страницу. Попробуйте обновить или вернитесь на главную — каталог большой,
          иногда страница готовится чуть дольше.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
          <button type="button" onClick={reset} className="btn btn-primary">
            Повторить
          </button>
          <Link href="/" className="btn btn-soft">
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
