import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, roleToStorefront } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Вход в личный кабинет",
  description: "Вход в кабинет БытТехОпт по email — без пароля, одноразовая ссылка.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ROLE_HOME: Record<"b2c" | "b2b" | "gov", string> = {
  b2c: "/account",
  b2b: "/b2b",
  gov: "/gov",
};

const ERROR_LABELS: Record<string, string> = {
  missing_token: "В ссылке нет токена. Запросите вход ещё раз.",
  not_found: "Ссылка не распознана. Возможно, она устарела.",
  expired: "Срок действия ссылки истёк (15 минут). Запросите новую.",
  already_used: "Ссылка уже использовалась. Запросите новую.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  const { next, error } = await searchParams;
  const safeNext = typeof next === "string" && next.startsWith("/") ? next : undefined;
  const errorMessage = typeof error === "string" ? ERROR_LABELS[error] : null;

  if (user) {
    redirect(safeNext ?? ROLE_HOME[roleToStorefront(user.role)]);
  }

  return (
    <>
      <div className="bread">
        <a href="/">Главная</a>
        <span>›</span>
        <span>Вход</span>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div className="acc-card">
          <h3 style={{ marginBottom: 6 }}>Вход в личный кабинет</h3>
          <p style={{ color: "var(--text-mute)", fontSize: 14, lineHeight: 1.5, marginBottom: 18 }}>
            Один email — один кабинет. Подтвердите вход по ссылке из письма, и доступ откроется сразу:
            заказы, КП и опт-цены — в зависимости от вашего статуса.
          </p>
          {errorMessage && (
            <div
              role="alert"
              style={{
                marginBottom: 14,
                padding: 14,
                borderRadius: 12,
                background: "rgba(220,80,80,0.10)",
                border: "1px solid rgba(220,80,80,0.30)",
                color: "#9b2a2a",
                fontSize: 14,
              }}
            >
              {errorMessage}
            </div>
          )}
          <LoginForm next={safeNext} />
        </div>
      </div>
    </>
  );
}
