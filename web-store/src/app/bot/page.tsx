import type { Metadata } from "next";
import { BotDemo } from "@/components/bot-demo";

export const metadata: Metadata = {
  title: "Telegram-агент по продажам",
  description:
    "Telegram-бот БытТехОпт: подбор техники, проверка наличия и цены, оформление заказа и КП прямо в чате. Передача живому менеджеру по сложным кейсам.",
  robots: { index: false, follow: false },
};

export default function BotPage() {
  return <BotDemo />;
}
