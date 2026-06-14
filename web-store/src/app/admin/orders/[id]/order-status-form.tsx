"use client";

import { useActionState } from "react";
import { updateOrderStatusAction, type AdminActionState } from "@/app/admin/actions";

export function OrderStatusForm({
  orderId,
  currentStatus,
  statuses,
}: {
  orderId: string;
  currentStatus: string;
  statuses: { value: string; label: string }[];
}) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(updateOrderStatusAction, {});

  return (
    <form action={action} className="grid gap-2" style={{ marginTop: 20 }}>
      <input type="hidden" name="id" value={orderId} />
      <label className="adm-field">
        <span className="adm-label">Статус заказа</span>
        <select name="status" defaultValue={currentStatus}>
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={pending} className="adm-btn adm-btn--primary" style={{ width: "100%" }}>
        {pending ? "Обновляем…" : "Обновить статус"}
      </button>
      {state.ok ? (
        <span className="adm-feedback adm-feedback--ok" role="status" aria-live="polite">
          Статус обновлён
        </span>
      ) : null}
      {state.error ? (
        <span className="adm-feedback adm-feedback--err" role="status" aria-live="polite">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
