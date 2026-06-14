import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { formatRub } from "@/lib/format";

export const dynamic = "force-dynamic";

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
  const numericSku = Number(q);
  const products = await prisma.product.findMany({
    where: q
      ? {
          OR: [
            { supplierName: { contains: q, mode: "insensitive" } },
            { vendor: { contains: q, mode: "insensitive" } },
            { part: { contains: q, mode: "insensitive" } },
            ...(Number.isFinite(numericSku) ? [{ sku: numericSku }] : []),
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    take: 80,
  });

  return (
    <AdminShell title="Товары">
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="SKU, название, бренд, партномер" className="h-10 min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 text-sm" />
        <button className="h-10 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white">Найти</button>
      </form>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Название</th>
              <th className="px-4 py-3">Бренд</th>
              <th className="px-4 py-3">Цена</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3 font-semibold">{product.sku}</td>
                <td className="px-4 py-3">{product.name ?? product.supplierName}</td>
                <td className="px-4 py-3">{product.vendor ?? "-"}</td>
                <td className="px-4 py-3">{product.retailPrice ? formatRub(Number(product.retailPrice)) : "-"}</td>
                <td className="px-4 py-3">{product.isVisible ? "виден" : "скрыт"}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/products/${product.id}`} className="font-semibold text-teal-800 hover:text-teal-950">
                    Редактировать
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
