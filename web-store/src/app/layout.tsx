import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://climat-simf.ru"),
  title: {
    default: "БытТехОпт - техника, электроника и товары для дома под заказ",
    template: "%s | БытТехОпт",
  },
  description:
    "Интернет-магазин бытовой техники, электроники, климатического оборудования и товаров для дома с доставкой по Крыму, Херсонской и Запорожской областям.",
  keywords: [
    "БытТехОпт",
    "бытовая техника Симферополь",
    "электроника Крым",
    "климатическая техника",
    "доставка техники Херсонская область",
    "доставка техники Запорожская область",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "БытТехОпт - техника и электроника под заказ",
    description:
      "Большой каталог бытовой техники, электроники и товаров для дома. Доставка по Крыму, Херсонской и Запорожской областям, оплата при получении.",
    url: "/",
    siteName: "БытТехОпт",
    locale: "ru_RU",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${inter.variable} antialiased`}>
      <body className="app">
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
