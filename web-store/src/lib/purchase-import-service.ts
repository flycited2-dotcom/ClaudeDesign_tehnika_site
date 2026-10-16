import { prisma } from "@/lib/db";
import { getItpActiveProducts } from "@/lib/itp/orders";
import type { ItpActiveProduct } from "@/lib/itp/types";
import { groupPurchaseLines, type PurchaseRow, type PurchaseSheet, type ResolvedPurchaseLine } from "@/lib/purchase-import";
import { supplierQtyLabel } from "@/lib/stock-monitor";

export async function resolvePurchaseSheet(sheet: PurchaseSheet): Promise<ResolvedPurchaseLine[]> {
  if (sheet.errors.length) throw new Error(sheet.errors.slice(0, 10).join("\n"));
  const resolved: Array<PurchaseRow & { sku: number; resolvedName?: string }> = [];
  const errors: string[] = [];
  for (const row of sheet.rows) {
    // An explicit supplier SKU is authoritative even if the local catalog has
    // not synchronized it yet. The supplier validates the SKU when adding it.
    if (row.supplierSku) {
      resolved.push({ ...row, sku: row.supplierSku });
      continue;
    }
    const identifier = row.article || row.name;
    const candidates = await prisma.product.findMany({
      where: {
        ...(row.brand ? { vendor: { equals: row.brand, mode: "insensitive" } } : {}),
        OR: row.article ? [
          { part: { equals: identifier, mode: "insensitive" } },
          ...(/^\d+$/.test(identifier) && Number(identifier) <= 2_147_483_647 ? [{ sku: Number(identifier) }] : []),
        ] : [
          { supplierName: { equals: identifier, mode: "insensitive" } },
          { name: { equals: identifier, mode: "insensitive" } },
        ],
      },
      select: { sku: true, name: true, supplierName: true },
      take: 2,
    });
    if (candidates.length !== 1) {
      errors.push(`Строка ${row.row}: ${candidates.length ? "неоднозначный товар" : "товар не найден"} (${identifier.slice(0, 100)}). Укажите точный SKU в колонке «Артикул поставщика».`);
      continue;
    }
    resolved.push({ ...row, sku: candidates[0].sku, resolvedName: candidates[0].name || candidates[0].supplierName });
  }
  if (errors.length) throw new Error(errors.slice(0, 10).join("\n"));
  return groupPurchaseLines(resolved);
}

export async function purchaseAvailability(lines: ResolvedPurchaseLine[]): Promise<{ products: ItpActiveProduct[]; error?: string }> {
  try {
    return { products: await getItpActiveProducts(lines.map((line) => line.sku)) };
  } catch {
    // The owner's workflow permits ordering the full list even when a stock
    // check is unavailable. Do not expose supplier authentication errors.
    return { products: [], error: "Проверка цен и остатков недоступна. Заказ сохранит все исходные количества." };
  }
}

function csvCell(value: string | number): string {
  let text = String(value);
  // Supplier names and spreadsheet notes are untrusted text, never formulas.
  if (/^\s*[=+\-@]|^[\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function purchaseReportCsv(lines: ResolvedPurchaseLine[], products: ItpActiveProduct[], checkError?: string): Buffer {
  const bySku = new Map(products.map((product) => [product.sku, product]));
  const rows: Array<Array<string | number>> = [["SKU I-T-P", "Наименование", "К заказу, шт.", "Текущая цена, руб.", "Сумма, руб.", "Остаток API", "Точное количество API", "Ближайший склад", "Точно на ближайшем складе", "Срок, дней", "Кратность API", "Строки исходного листа", "Примечания"]];
  for (const line of lines) {
    const active = bySku.get(line.sku);
    const price = active && Number.isFinite(active.price) && active.price > 0 ? active.price : undefined;
    rows.push([
      line.sku, line.name, line.quantity,
      price === undefined ? "" : price.toFixed(2).replace(".", ","),
      price === undefined ? "" : (price * line.quantity).toFixed(2).replace(".", ","),
      checkError ? "Проверка недоступна" : active ? supplierQtyLabel(active.qty) : "Нет в ответе активных товаров API",
      active?.real_qty ?? "", active ? supplierQtyLabel(active.nearest_logistic_center_qty) : "",
      active?.nearest_logistic_center_real_qty ?? "", active?.delivery_days ?? "", active?.multiplicity ?? "",
      line.sourceRows.join(", "), line.notes.join(" | "),
    ]);
  }
  return Buffer.from(`\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\r\n")}`, "utf8");
}
