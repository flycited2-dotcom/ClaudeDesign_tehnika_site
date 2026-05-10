"use server";

import { OrderStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { loginAdmin, logoutAdmin, requireAdmin } from "@/lib/admin-auth";
import { parseManualProductAttributeLines } from "@/lib/admin-product-attributes";
import { prisma } from "@/lib/db";
import { syncItpCategories } from "@/lib/itp/categories";
import { syncItpImages } from "@/lib/itp/images";
import { syncItpPrices } from "@/lib/itp/prices";
import { syncItpProducts } from "@/lib/itp/products";
import { upsertSetting } from "@/lib/settings";

export type LoginState = {
  error?: string;
};

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const ok = await loginAdmin(email, password);

  if (!ok) {
    return { error: "Неверный логин или пароль администратора." };
  }

  redirect("/admin");
}

export async function logoutAction() {
  await logoutAdmin();
  redirect("/admin/login");
}

export async function runSyncAction(formData: FormData) {
  await requireAdmin();
  const type = String(formData.get("type") ?? "");

  if (type === "categories") await syncItpCategories();
  if (type === "products") await syncItpProducts();
  if (type === "prices") await syncItpPrices();
  if (type === "images") await syncItpImages();

  revalidatePath("/admin/sync");
  revalidatePath("/catalog");
}

const settingsSchema = z.object({
  markupPercent: z.coerce.number().min(0).max(500),
  minMarkupRub: z.coerce.number().min(0).max(100000),
  priceMode: z.enum(["formula", "rrp", "not_below_rrp", "manual"]),
  orderCreateEnabled: z.enum(["true", "false"]),
  telegramChatId: z.string().optional(),
});

export async function saveSettingsAction(formData: FormData) {
  await requireAdmin();
  const parsed = settingsSchema.parse(Object.fromEntries(formData));

  await Promise.all([
    upsertSetting("ITP_DEFAULT_MARKUP_PERCENT", String(parsed.markupPercent)),
    upsertSetting("ITP_MIN_PRICE_MARKUP_RUB", String(parsed.minMarkupRub)),
    upsertSetting("PRICE_MODE", parsed.priceMode),
    upsertSetting("ITP_ORDER_CREATE_ENABLED", parsed.orderCreateEnabled),
    upsertSetting("TELEGRAM_MANAGER_CHAT_ID", parsed.telegramChatId ?? ""),
  ]);

  revalidatePath("/admin/settings");
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const manualPriceRaw = String(formData.get("manualPrice") ?? "").trim();
  const manualAttributes = parseManualProductAttributeLines(String(formData.get("manualAttributes") ?? ""));

  const product = await prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id },
      data: {
        isVisible: formData.get("isVisible") === "on",
        name: String(formData.get("name") ?? "").trim() || null,
        seoTitle: String(formData.get("seoTitle") ?? "").trim() || null,
        seoDescription: String(formData.get("seoDescription") ?? "").trim() || null,
        description: String(formData.get("description") ?? "").trim() || null,
        manualPrice: manualPriceRaw ? new Prisma.Decimal(manualPriceRaw) : null,
      },
      select: {
        slug: true,
      },
    });

    await tx.productAttribute.deleteMany({
      where: {
        productId: id,
        source: "manual",
      },
    });

    if (manualAttributes.length) {
      await tx.productAttribute.createMany({
        data: manualAttributes.map((attribute) => ({
          productId: id,
          key: attribute.key,
          label: attribute.label,
          value: attribute.value,
          normalizedValue: attribute.normalizedValue,
          numericValue: attribute.numericValue,
          unit: attribute.unit,
          source: "manual",
        })),
      });
    }

    return updated;
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath(`/product/${product.slug}`);
  revalidatePath("/catalog");
}

export async function toggleCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const isVisible = formData.get("isVisible") === "true";

  await prisma.category.update({
    where: { id },
    data: { isVisible },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/catalog");
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as OrderStatus;

  if (!Object.values(OrderStatus).includes(status)) {
    throw new Error("Unknown order status.");
  }

  await prisma.order.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}
