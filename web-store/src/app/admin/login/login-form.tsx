"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Email
        <input name="email" type="email" required className="h-11 rounded-lg border border-zinc-200 px-3 text-zinc-950" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Пароль
        <input name="password" type="password" required className="h-11 rounded-lg border border-zinc-200 px-3 text-zinc-950" />
      </label>
      {state.error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p> : null}
      <button disabled={pending} className="h-11 rounded-lg bg-zinc-950 text-sm font-bold text-white hover:bg-teal-800 disabled:bg-zinc-300">
        {pending ? "Проверяем..." : "Войти"}
      </button>
    </form>
  );
}
