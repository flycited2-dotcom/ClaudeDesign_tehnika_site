import { OrderStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { updateOrderStatusAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { formatRub } from "@/lib/format";
import { orderStatusMeta } from "@/lib/order-status";
import { phoneHref } from "@/lib/storefront";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();
  const currentStatus = orderStatusMeta[order.status];
  const statusToneClasses = {
    red: "border-red-100 bg-red-50 text-red-800",
    amber: "border-amber-100 bg-amber-50 text-amber-800",
    blue: "border-sky-100 bg-sky-50 text-sky-800",
    green: "border-emerald-100 bg-emerald-50 text-emerald-800",
    zinc: "border-zinc-200 bg-zinc-50 text-zinc-700",
  };

  return (
    <AdminShell title={order.orderNumber}>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Состав заказа</h2>
          <div className="mt-4 divide-y divide-zinc-100">
            {order.items.map((item) => (
              <div key={item.id} className="grid gap-2 py-3 text-sm sm:grid-cols-[1fr_80px_120px]">
                <span>SKU {item.sku} · {item.name}</span>
                <span>{item.quantity} шт.</span>
                <strong>{formatRub(Number(item.total))}</strong>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-md bg-stone-50 p-4 text-right text-2xl font-black">{formatRub(Number(order.total))}</div>
        </div>
        <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusToneClasses[currentStatus.tone]}`}>
            {currentStatus.label}
          </span>
          <p className="mt-4 font-bold">{order.customerName}</p>
          <a href={phoneHref(order.phone)} className="mt-2 inline-flex h-10 items-center rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-teal-800">
            Позвонить: {order.phone}
          </a>
          {order.email ? <p className="text-sm text-zinc-600">{order.email}</p> : null}
          {order.comment ? <p className="mt-3 rounded-md bg-stone-50 p-3 text-sm text-zinc-600">{order.comment}</p> : null}
          <div className="mt-5 rounded-lg border border-zinc-200 bg-stone-50 p-4">
            <p className="text-sm font-bold text-zinc-950">План обработки</p>
            <div className="mt-3 grid gap-2 text-sm text-zinc-600">
              {[
                "Позвонить клиенту и подтвердить состав заявки.",
                "Проверить наличие у поставщика, цену и доставку под заказ 7 дней.",
                "Согласовать оплату и перевести заявку в следующий статус.",
              ].map((step) => (
                <div key={step} className="flex gap-2">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-teal-700" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
          <form action={updateOrderStatusAction} className="mt-5 grid gap-2">
            <input type="hidden" name="id" value={order.id} />
            <select name="status" defaultValue={order.status} className="h-10 rounded-lg border border-zinc-200 px-3 text-sm">
              {Object.values(OrderStatus).map((status) => (
                <option key={status} value={status}>
                  {orderStatusMeta[status].label}
                </option>
              ))}
            </select>
            <button className="h-10 rounded-lg bg-teal-700 text-sm font-bold text-white hover:bg-teal-800">Обновить статус</button>
          </form>
        </aside>
      </div>
    </AdminShell>
  );
}
