import { toggleCategoryAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin-shell";
import { CatalogPager } from "@/components/catalog-pager";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminCategoriesPage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(first(params.page)) || 1);

  const [total, categories] = await Promise.all([
    prisma.category.count(),
    prisma.category.findMany({
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminShell title="Категории">
      <div className="adm-section-right" style={{ marginBottom: 14 }}>
        <span className="adm-badge adm-badge--muted">Всего: {total.toLocaleString("ru-RU")}</span>
      </div>

      <div className="adm-card" style={{ padding: 0, overflowX: "auto" }}>
        <table className="adm-table" style={{ tableLayout: "fixed", minWidth: 640 }}>
          <colgroup>
            <col />
            <col style={{ width: 130 }} />
            <col style={{ width: 280 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 130 }} />
          </colgroup>
          <thead>
            <tr>
              <th>Название</th>
              <th>External ID</th>
              <th>Slug</th>
              <th>Видимость</th>
              <th aria-hidden />
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="adm-cell-trunc font-semibold" title={category.name ?? undefined}>
                  {category.name}
                </td>
                <td className="adm-num" style={{ textAlign: "left", color: "var(--text-mute)" }}>
                  {category.externalId}
                </td>
                <td className="adm-cell-trunc" style={{ color: "var(--text-mute)", fontSize: 12.5 }} title={category.slug}>
                  {category.slug}
                </td>
                <td>
                  <span className={`adm-badge ${category.isVisible ? "adm-badge--success" : "adm-badge--muted"}`}>
                    {category.isVisible ? "виден" : "скрыт"}
                  </span>
                </td>
                <td className="adm-col-actions">
                  <form action={toggleCategoryAction}>
                    <input type="hidden" name="id" value={category.id} />
                    <input type="hidden" name="isVisible" value={category.isVisible ? "false" : "true"} />
                    <button className="adm-btn adm-btn--soft" style={{ height: 34, padding: "0 12px", fontSize: 13 }}>
                      {category.isVisible ? "Скрыть" : "Показать"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {!categories.length ? (
              <tr>
                <td colSpan={5} style={{ color: "var(--text-mute)", textAlign: "center", padding: "28px 14px" }}>
                  Категорий пока нет. Запустите синхронизацию.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <CatalogPager page={page} totalPages={totalPages} buildHref={(p) => `/admin/categories?page=${p}`} />
    </AdminShell>
  );
}
