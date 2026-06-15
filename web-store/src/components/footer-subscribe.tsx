"use client";

import { useState } from "react";

/**
 * Footer newsletter field. There is no marketing backend, so instead of a dead
 * `action="#"` submit it opens a pre-filled email to the store mailbox — a real,
 * backend-free action. RSC-safe: receives only the target address as a string.
 */
export function FooterSubscribe({ email }: { email: string }) {
  const [value, setValue] = useState("");

  return (
    <form
      className="email-form"
      onSubmit={(event) => {
        event.preventDefault();
        const addr = value.trim();
        if (!addr) return;
        window.location.href =
          `mailto:${email}?subject=${encodeURIComponent("Подписка на акции и новинки")}` +
          `&body=${encodeURIComponent(`Прошу добавить мой e-mail в рассылку акций: ${addr}`)}`;
      }}
    >
      <input
        name="email"
        type="email"
        required
        placeholder="Ваш e-mail"
        aria-label="Ваш e-mail"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button type="submit">Подписаться</button>
    </form>
  );
}
