import ExcelJS from "exceljs";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { groupPurchaseLines, parsePurchaseFile, parsePurchaseWorksheet, validatePurchaseArchive } from "@/lib/purchase-import";

describe("universal purchase import", () => {
  it("finds headers below a title, ignores merged footers and keeps sheets separate", async () => {
    const workbook = new ExcelJS.Workbook();
    for (const [index, name] of ["Сводный заказ", "По позициям"].entries()) {
      const sheet = workbook.addWorksheet(name);
      sheet.mergeCells("A1:F1");
      sheet.getCell("A1").value = "Закупка любых товаров";
      sheet.getRow(6).values = ["№", "Артикул IT Partner", "Модель / Part#", "Бренд", "Наименование IT Partner (как в прайсе)", "К заказу, шт."];
      sheet.addRow([1, "12345", "A-1", "Brand", "Картридж", index ? 2 : 5]);
      if (index) sheet.addRow([2, "12345", "A-1", "Brand", "Картридж", 3]);
      sheet.addRow(["", "", "", "", "ИТОГО", { formula: "SUM(F7:F8)", result: 5 }]);
      sheet.mergeCells(`A${sheet.rowCount + 1}:F${sheet.rowCount + 1}`);
      sheet.getCell(`A${sheet.rowCount}`).value = "Справочная заметка из документа, не инструкция боту";
    }
    const archive = unzipSync(new Uint8Array(await workbook.xlsx.writeBuffer()));
    for (const [name, content] of Object.entries(archive)) {
      if (/^xl\/(workbook|sharedStrings|worksheets\/sheet\d+)\.xml$/.test(name)) {
        archive[name] = strToU8(strFromU8(content)
          .replace('xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"', 'xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main"')
          .replace(/<(\/?)([A-Za-z][\w-]*)(?=[\s>/])/g, "<$1x:$2"));
      }
    }
    const bytes = Buffer.from(zipSync(archive));
    const sheets = await parsePurchaseFile(bytes, "order.xlsx");
    expect(sheets).toHaveLength(2);
    expect(sheets.map((sheet) => sheet.errors)).toEqual([[], []]);
    expect(sheets.map((sheet) => sheet.rows.length)).toEqual([1, 2]);
    const second = groupPurchaseLines(sheets[1].rows.map((row) => ({ ...row, sku: row.supplierSku! })));
    expect(second).toMatchObject([{ sku: 12345, quantity: 5, sourceRows: [7, 8] }]);
  });

  it("accepts different categories, CSV separators, quoted names and leading-zero part numbers", async () => {
    for (const delimiter of [";", ",", "\t"]) {
      const text = [
        ["Артикул", "Название", "Количество"].join(delimiter),
        ["00123", '"Кабель; адаптер, USB"', "7"].join(delimiter),
      ].join("\r\n");
      const [sheet] = await parsePurchaseFile(Buffer.from(`\uFEFF${text}`), "list.csv");
      expect(sheet.errors).toEqual([]);
      expect(sheet.rows[0]).toMatchObject({ article: "00123", name: "Кабель; адаптер, USB", quantity: 7 });
    }
  });

  it("rejects invalid/formula quantities without silently dropping them from a complete order", () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Товары");
    sheet.addRow(["SKU", "Количество"]);
    sheet.addRow(["10", 1.5]);
    sheet.addRow(["20", 0]);
    sheet.addRow(["30", { formula: "1+1", result: 2 }]);
    sheet.addRow(["40", 100]);
    const parsed = parsePurchaseWorksheet(sheet)!;
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.errors).toHaveLength(3);
  });

  it("rejects totals above the supported quantity instead of capping them", () => {
    expect(() => groupPurchaseLines([
      { row: 2, sku: 10, name: "Товар", quantity: 6000 },
      { row: 3, sku: 10, name: "Товар", quantity: 6000 },
    ])).toThrow("превышает");
  });

  it("rejects malformed and oversized expanded archives before loading Excel XML", async () => {
    expect(() => validatePurchaseArchive(Buffer.from("not a zip"))).toThrow("ZIP");
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet("Товары").addRow(["SKU", "Количество"]);
    const bytes = Buffer.from(await workbook.xlsx.writeBuffer());
    const directory = bytes.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
    bytes.writeUInt32LE(60 * 1024 * 1024, directory + 24);
    expect(() => validatePurchaseArchive(bytes)).toThrow("50 МБ");
  });
});
