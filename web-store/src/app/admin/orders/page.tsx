import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { formatDateTime, formatRub } from "@/lib/format";
import { orderStatusMeta } from "@/lib/order-status";
import { phoneHref } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const statusToneClasses = {
    red: "bg-red-50 text-red-800",
    amber: "bg-amber-50 text-amber-800",
    blue: "bg-sky-50 text-sky-800",
    green: "bg-emerald-50 text-emerald-800",
    zinc: "bg-zinc-100 text-zinc-700",
  };

  return (
    <AdminShell title="Заказы">
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Номер</th>
              <th className="px-4 py-3">Клиент</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Сумма</th>
              <th className="px-4 py-3">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-semibold text-teal-800 hover:text-teal-950">
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-950">{order.customerName}</div>
                  <a href={phoneHref(order.phone)} className="text-xs font-semibold text-teal-800 hover:text-teal-950">
                    {order.phone}
                  </a>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusToneClasses[orderStatusMeta[order.status].tone]}`}>
                    {orderStatusMeta[order.status].label}
                  </span>
                </td>
                <td className="px-4 py-3">{formatRub(Number(order.total))}</td>
                <td className="px-4 py-3">{formatDateTime(order.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
