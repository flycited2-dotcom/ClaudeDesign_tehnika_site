import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { getStoreSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getStoreSettings();

  return (
    <AdminShell title="Настройки">
      <SettingsForm
        settings={{
          markupPercent: settings.markupPercent,
          minMarkupRub: settings.minMarkupRub,
          priceMode: settings.priceMode,
          orderCreateEnabled: settings.orderCreateEnabled,
          telegramChatId: settings.telegramChatId,
        }}
      />
    </AdminShell>
  );
}
