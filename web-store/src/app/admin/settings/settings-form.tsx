"use client";

import { useActionState } from "react";
import { saveSettingsAction, type AdminActionState } from "@/app/admin/actions";

type Settings = {
  markupPercent: number | string;
  minMarkupRub: number | string;
  priceMode: string;
  orderCreateEnabled: boolean;
  telegramChatId: string;
};

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(saveSettingsAction, {});

  return (
    <form action={action} className="adm-card" style={{ maxWidth: 720, display: "grid", gap: 16 }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="adm-field">
          <span className="adm-label">Процент наценки</span>
          <input name="markupPercent" defaultValue={settings.markupPercent} inputMode="decimal" />
        </label>
        <label className="adm-field">
          <span className="adm-label">Минимальная наценка, ₽</span>
          <input name="minMarkupRub" defaultValue={settings.minMarkupRub} inputMode="decimal" />
        </label>
      </div>
      <label className="adm-field">
        <span className="adm-label">Режим цены</span>
        <select name="priceMode" defaultValue={settings.priceMode}>
          <option value="formula">Формула наценки</option>
          <option value="rrp">Использовать РРЦ</option>
          <option value="not_below_rrp">Не ниже РРЦ</option>
          <option value="manual">Ручная цена</option>
        </select>
      </label>
      <label className="adm-field">
        <span className="adm-label">Автоотправка заказа поставщику</span>
        <select name="orderCreateEnabled" defaultValue={settings.orderCreateEnabled ? "true" : "false"}>
          <option value="false">Выключена</option>
          <option value="true">Включена</option>
        </select>
      </label>
      <label className="adm-field">
        <span className="adm-label">Telegram chat id</span>
        <input name="telegramChatId" defaultValue={settings.telegramChatId} />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="adm-btn adm-btn--primary">
          {pending ? "Сохраняем…" : "Сохранить"}
        </button>
        {state.ok ? (
          <span className="adm-feedback adm-feedback--ok" role="status" aria-live="polite">
            Сохранено
          </span>
        ) : null}
        {state.error ? (
          <span className="adm-feedback adm-feedback--err" role="status" aria-live="polite">
            {state.error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
