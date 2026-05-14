"use client";

import { useState } from "react";
import { requestMagicLinkAction } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "submitting" }
    | { status: "ok"; message: string }
    | { status: "error"; error: string }
  >({ status: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setState({ status: "submitting" });
    const result = await requestMagicLinkAction(formData);
    if (result.ok) {
      setState({ status: "ok", message: result.message });
      form.reset();
    } else {
      setState({ status: "error", error: result.error });
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
      {next && <input type="hidden" name="next" value={next} />}
      <label style={{ display: "grid", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input"
          placeholder="you@company.ru"
          disabled={state.status === "submitting"}
        />
      </label>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={state.status === "submitting"}
      >
        {state.status === "submitting" ? "Отправляем…" : "Отправить ссылку для входа"}
      </button>

      {state.status === "ok" && (
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
      )}
      {state.status === "error" && (
        <div
          role="alert"
          style={{
            padding: 14,
            borderRadius: 12,
            background: "rgba(220,80,80,0.10)",
            border: "1px solid rgba(220,80,80,0.30)",
            color: "#9b2a2a",
            fontSize: 14,
          }}
        >
          {state.error}
        </div>
      )}

      <p style={{ fontSize: 12, color: "var(--text-mute)", lineHeight: 1.5 }}>
        Без пароля. На указанный email придёт одноразовая ссылка — действует 15 минут. Никому её не пересылайте.
      </p>
    </form>
  );
}
