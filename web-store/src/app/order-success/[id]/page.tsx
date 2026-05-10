import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearCart } from "@/app/order-success/clear-cart";
import { prisma } from "@/lib/db";
import { formatRub } from "@/lib/format";
import { buildCustomerOrderSteps } from "@/lib/order-status";
import { phoneHref, storefront } from "@/lib/storefront";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrderSuccessPage({ params }: Props) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    notFound();
  }
  const steps = buildCustomerOrderSteps();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <ClearCart />
      <div className="rounded-lg border border-emerald-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Заказ создан</p>
        <h1 className="mt-2 text-3xl font-black text-zinc-950">{order.orderNumber}</h1>
        <p className="mt-3 text-zinc-600">
          Спасибо за заявку. Менеджер свяжется с вами, подтвердит наличие у поставщика, доставку под заказ 7 дней и детали получения.
        </p>
        <div className="mt-6 divide-y divide-zinc-100">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 py-3 text-sm">
              <span>
                SKU {item.sku} · {item.name} x {item.quantity}
                <span className="mt-1 block text-xs text-emerald-700">Доставка под заказ 7 дней</span>
              </span>
              <strong>{formatRub(Number(item.total))}</strong>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between rounded-md bg-stone-50 p-4">
          <span className="font-semibold">Итого</span>
          <span className="text-2xl font-black">{formatRub(Number(order.total))}</span>
        </div>
        <div className="mt-6 rounded-lg border border-zinc-200 bg-stone-50 p-4">
          <h2 className="text-lg font-bold text-zinc-950">Что дальше</h2>
          <div className="mt-4 grid gap-3">
            {steps.map((step, index) => (
              <div key={step.title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 text-sm">
                <span className="flex size-7 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">{index + 1}</span>
                <span>
                  <strong className="block text-zinc-950">{step.title}</strong>
                  <span className="mt-1 block leading-5 text-zinc-600">{step.description}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/catalog" className="inline-flex h-11 items-center rounded-lg bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800">
            Вернуться в каталог
          </Link>
          <a href={phoneHref(storefront.phones[0])} className="inline-flex h-11 items-center rounded-lg border border-zinc-200 px-5 text-sm font-semibold text-zinc-800 hover:border-teal-200 hover:text-teal-800">
            Позвонить менеджеру
          </a>
        </div>
      </div>
    </div>
  );
}
