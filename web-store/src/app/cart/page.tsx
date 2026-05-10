import type { Metadata } from "next";
import { CartClient } from "@/app/cart/cart-client";

export const metadata: Metadata = {
  title: "Корзина",
  description: "Проверьте выбранные товары и оформите заказ в БытТехОпт.",
};

export default function CartPage() {
  return <CartClient />;
}
