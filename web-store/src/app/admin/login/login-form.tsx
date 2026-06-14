"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} style={{ display: "grid", gap: 14 }}>
      <label className="adm-field">
        <span className="adm-label">Email</span>
        <input name="email" type="email" required autoComplete="username" />
      </label>
      <label className="adm-field">
        <span className="adm-label">Пароль</span>
        <input name="password" type="password" required autoComplete="current-password" />
      </label>
      {state.error ? <p className="adm-feedback adm-feedback--err">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="adm-btn adm-btn--primary" style={{ marginTop: 4 }}>
        {pending ? "Проверяем..." : "Войти"}
      </button>
    </form>
  );
}
