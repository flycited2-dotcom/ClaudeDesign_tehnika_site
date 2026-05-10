import { toggleCategoryAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await prisma.category.findMany({
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
    take: 300,
  });

  return (
    <AdminShell title="Категории">
      <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white shadow-sm">
        {categories.map((category) => (
          <div key={category.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div>
              <p className="font-semibold text-zinc-950">{category.name}</p>
              <p className="mt-1 text-xs text-zinc-500">External ID {category.externalId} · {category.slug}</p>
            </div>
            <form action={toggleCategoryAction}>
              <input type="hidden" name="id" value={category.id} />
              <input type="hidden" name="isVisible" value={category.isVisible ? "false" : "true"} />
              <button className="h-9 rounded-lg border border-zinc-200 px-3 text-sm font-semibold hover:bg-stone-50">
                {category.isVisible ? "Скрыть" : "Показать"}
              </button>
            </form>
          </div>
        ))}
        {!categories.length ? <p className="p-6 text-sm text-zinc-500">Категорий пока нет. Запустите синхронизацию.</p> : null}
      </div>
    </AdminShell>
  );
}
