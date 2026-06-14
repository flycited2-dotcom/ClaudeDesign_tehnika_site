import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { AdminShell } from "@/components/admin-shell";
import { CatalogPager } from "@/components/catalog-pager";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { formatRub } from "@/lib/format";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminProductsPage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;
  const q = first(params.q);
  const page = Math.max(1, Number(first(params.page)) || 1);
  const numericSku = Number(q);

  const where: Prisma.ProductWhereInput | undefined = q
    ? {
        OR: [
          { supplierName: { contains: q, mode: "insensitive" } },
          { vendor: { contains: q, mode: "insensitive" } },
          { part: { contains: q, mode: "insensitive" } },
          ...(Number.isFinite(numericSku) ? [{ sku: numericSku }] : []),
        ],
      }
    : undefined;

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildHref = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/admin/products?${qs}` : "/admin/products";
  };

  return (
    <AdminShell title="Товары">
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="SKU, название, бренд, партномер" className="adm-input" style={{ flex: 1, minWidth: 0 }} />
        <button className="adm-btn adm-btn--primary">Найти</button>
      </form>

      <div className="adm-section-right" style={{ marginBottom: 14 }}>
        <span className="adm-badge adm-badge--muted">
          {q ? `Найдено: ${total.toLocaleString("ru-RU")}` : `Всего: ${total.toLocaleString("ru-RU")}`}
        </span>
      </div>

      <div className="adm-card" style={{ padding: 0, overflowX: "auto" }}>
        <table className="adm-table" style={{ tableLayout: "fixed", minWidth: 720 }}>
          <colgroup>
            <col style={{ width: 92 }} />
            <col />
            <col style={{ width: 160 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 104 }} />
            <col style={{ width: 132 }} />
          </colgroup>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Название</th>
              <th>Бренд</th>
              <th className="adm-num">Цена</th>
              <th>Статус</th>
              <th aria-hidden />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td className="font-semibold adm-num" style={{ textAlign: "left" }}>
                  {product.sku}
                </td>
                <td className="adm-cell-trunc" title={product.name ?? product.supplierName ?? undefined}>
                  {product.name ?? product.supplierName}
                </td>
                <td className="adm-cell-trunc" style={{ color: "var(--text-2)" }} title={product.vendor ?? undefined}>
                  {product.vendor ?? "—"}
                </td>
                <td className="adm-num">{product.retailPrice ? formatRub(Number(product.retailPrice)) : "—"}</td>
                <td>
                  <span className={`adm-badge ${product.isVisible ? "adm-badge--success" : "adm-badge--muted"}`}>
                    {product.isVisible ? "виден" : "скрыт"}
                  </span>
                </td>
                <td className="adm-col-actions">
                  <Link href={`/admin/products/${product.id}`} className="adm-btn adm-btn--soft" style={{ height: 34, padding: "0 12px", fontSize: 13 }}>
                    Изменить
                  </Link>
                </td>
              </tr>
            ))}
            {!products.length ? (
              <tr>
                <td colSpan={6} style={{ color: "var(--text-mute)", textAlign: "center", padding: "28px 14px" }}>
                  Ничего не найдено.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <CatalogPager page={page} totalPages={totalPages} buildHref={buildHref} />
    </AdminShell>
  );
}
