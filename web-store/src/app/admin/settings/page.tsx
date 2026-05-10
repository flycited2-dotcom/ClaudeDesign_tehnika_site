import { saveSettingsAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { getStoreSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getStoreSettings();

  return (
    <AdminShell title="Настройки">
      <form action={saveSettingsAction} className="grid max-w-2xl gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Процент наценки
          <input name="markupPercent" defaultValue={settings.markupPercent} className="h-10 rounded-lg border border-zinc-200 px-3" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Минимальная наценка, руб.
          <input name="minMarkupRub" defaultValue={settings.minMarkupRub} className="h-10 rounded-lg border border-zinc-200 px-3" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Режим цены
          <select name="priceMode" defaultValue={settings.priceMode} className="h-10 rounded-lg border border-zinc-200 px-3">
            <option value="formula">Формула наценки</option>
            <option value="rrp">Использовать РРЦ</option>
            <option value="not_below_rrp">Не ниже РРЦ</option>
            <option value="manual">Ручная цена</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Автоотправка заказа поставщику
          <select name="orderCreateEnabled" defaultValue={settings.orderCreateEnabled ? "true" : "false"} className="h-10 rounded-lg border border-zinc-200 px-3">
            <option value="false">Выключена</option>
            <option value="true">Включена</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Telegram chat id
          <input name="telegramChatId" defaultValue={settings.telegramChatId} className="h-10 rounded-lg border border-zinc-200 px-3" />
        </label>
        <button className="h-11 rounded-lg bg-teal-700 text-sm font-bold text-white hover:bg-teal-800">Сохранить</button>
      </form>
    </AdminShell>
  );
}
