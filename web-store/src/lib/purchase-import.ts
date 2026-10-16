import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import { posix } from "node:path";
import { unzipSync } from "fflate";
import { XMLParser } from "fast-xml-parser";

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_LINES = 500;
export const MAX_IMPORT_QUANTITY = 10_000;

export type PurchaseRow = {
  row: number;
  supplierSku?: number;
  article?: string;
  name: string;
  brand?: string;
  quantity: number;
  note?: string;
};

export type PurchaseSheet = { name: string; rows: PurchaseRow[]; errors: string[] };
type Column = "sku" | "article" | "name" | "brand" | "quantity" | "note";

function normalized(value: string): string {
  return value.toLocaleLowerCase("ru-RU").replace(/ё/g, "е").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function header(value: string): Column | undefined {
  const text = normalized(value);
  if (/^(sku|код поставщика|артикул поставщика|код itp|артикул itp|артикул it partner|артикул i t p|артикул ит партнер|артикул it партнер)$/.test(text)) return "sku";
  if (/^(артикул|модель part|part|part number|part no|partnumber|модель|артикул производителя|модель артикул)$/.test(text)) return "article";
  if (/^(наименование.*|название.*|товар|товар по тз|номенклатура)$/.test(text)) return "name";
  if (/^(бренд|производитель|brand|vendor)$/.test(text)) return "brand";
  if (/^(количество.*|кол во.*|колво.*|к заказу.*|заказать.*|quantity|qty)$/.test(text)) return "quantity";
  if (/^(примечание|комментарий.*|note)$/.test(text)) return "note";
}

// ExcelJS never evaluates formulas. Do not treat cached formula results as
// authoritative purchasing inputs; formulas in summaries are skipped below.
function cellText(cell: ExcelJS.Cell): string {
  const value = cell.value;
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("formula" in value || "sharedFormula" in value) return "#FORMULA";
    if ("richText" in value) return value.richText.map((part) => part.text).join("").trim();
    if ("text" in value) return String(value.text).trim();
    return "";
  }
  return String(value).trim();
}

export function parsePurchaseWorksheet(sheet: ExcelJS.Worksheet): PurchaseSheet | null {
  let columns: Partial<Record<Column, number>> = {};
  let headerRow = 0;
  for (let rowNumber = 1; rowNumber <= Math.min(sheet.rowCount, 100); rowNumber += 1) {
    const candidate: Partial<Record<Column, number>> = {};
    const row = sheet.getRow(rowNumber);
    for (let index = 1; index <= Math.min(row.cellCount, 100); index += 1) {
      const kind = header(cellText(row.getCell(index)));
      if (kind && candidate[kind] === undefined) candidate[kind] = index;
    }
    if (candidate.quantity && (candidate.sku || candidate.article || candidate.name)) {
      columns = candidate;
      headerRow = rowNumber;
      break;
    }
  }
  if (!headerRow) return null;
  const result: PurchaseSheet = { name: sheet.name, rows: [], errors: [] };
  if (sheet.rowCount > 10_000) {
    result.errors.push("Лист содержит более 10 000 строк. Разделите файл.");
    return result;
  }
  for (let rowNumber = headerRow + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const read = (kind: Column) => columns[kind] ? cellText(row.getCell(columns[kind]!)) : "";
    const skuText = read("sku");
    const article = read("article");
    const name = read("name");
    const quantityText = read("quantity");
    const texts = [skuText, article, name];
    const mappedCells = [columns.sku, columns.article, columns.name, columns.quantity].filter((index): index is number => index !== undefined).map((index) => row.getCell(index));
    if (mappedCells.every((cell) => cell.isMerged) && new Set(mappedCells.map((cell) => cell.master.address)).size === 1) continue;
    if (texts.every((value) => !value)) {
      if (quantityText && quantityText !== "#FORMULA") result.errors.push(`Строка ${rowNumber}: количество без товара.`);
      continue;
    }
    if (texts.some((value) => /^(итого|всего|total|источник)(?:\s|:|$)/iu.test(value))) continue;
    // A repeated table header must not become a product.
    if (header(quantityText) === "quantity" && texts.some((value) => header(value))) continue;
    if (!/^\d+$/.test(quantityText) || !Number.isSafeInteger(Number(quantityText)) || Number(quantityText) <= 0 || Number(quantityText) > MAX_IMPORT_QUANTITY) {
      result.errors.push(`Строка ${rowNumber}: количество должно быть целым числом от 1 до ${MAX_IMPORT_QUANTITY}, без формул.`);
      continue;
    }
    if (skuText && (!/^\d+$/.test(skuText) || !Number.isSafeInteger(Number(skuText)) || Number(skuText) <= 0 || Number(skuText) > 2_147_483_647)) {
      result.errors.push(`Строка ${rowNumber}: некорректный SKU поставщика.`);
      continue;
    }
    if ([article, name].includes("#FORMULA")) {
      result.errors.push(`Строка ${rowNumber}: артикул и название должны быть значениями, без формул.`);
      continue;
    }
    result.rows.push({
      row: rowNumber,
      ...(skuText ? { supplierSku: Number(skuText) } : {}),
      ...(article ? { article: article.slice(0, 250) } : {}),
      name: name.slice(0, 1000),
      ...(read("brand") ? { brand: read("brand").slice(0, 200) } : {}),
      quantity: Number(quantityText),
      ...(read("note") ? { note: read("note").slice(0, 1000) } : {}),
    });
    if (result.rows.length > MAX_IMPORT_LINES) {
      result.errors.push(`На одном листе допускается до ${MAX_IMPORT_LINES} товарных строк.`);
      break;
    }
  }
  if (!result.rows.length && !result.errors.length) result.errors.push("На листе нет товаров.");
  return result;
}

// Inspect the ZIP directory before ExcelJS allocates uncompressed XML/shared
// strings. A small uploaded archive can otherwise expand to gigabytes.
export function validatePurchaseArchive(bytes: Buffer): void {
  let end = -1;
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65_557); offset -= 1) {
    if (bytes.readUInt32LE(offset) === 0x06054b50 && offset + 22 + bytes.readUInt16LE(offset + 20) === bytes.length) { end = offset; break; }
  }
  if (end < 0) throw new Error("Повреждённый XLSX: ZIP-каталог не найден.");
  const entries = bytes.readUInt16LE(end + 10);
  let offset = bytes.readUInt32LE(end + 16);
  const directoryEnd = offset + bytes.readUInt32LE(end + 12);
  if (entries > 2000 || directoryEnd > end || bytes.readUInt16LE(end + 4) !== 0 || bytes.readUInt16LE(end + 6) !== 0) throw new Error("Слишком сложный или неподдерживаемый XLSX.");
  let expanded = 0;
  for (let index = 0; index < entries; index += 1) {
    if (offset + 46 > directoryEnd || bytes.readUInt32LE(offset) !== 0x02014b50) throw new Error("Повреждённый ZIP-каталог XLSX.");
    expanded += bytes.readUInt32LE(offset + 24);
    if (expanded > 50 * 1024 * 1024) throw new Error("Распакованный XLSX превышает 50 МБ. Удалите лишние данные.");
    offset += 46 + bytes.readUInt16LE(offset + 28) + bytes.readUInt16LE(offset + 30) + bytes.readUInt16LE(offset + 32);
  }
  if (offset !== directoryEnd) throw new Error("Повреждённый ZIP-каталог XLSX.");
}

type XmlNode = Record<string, unknown>;
const nodes = (value: unknown): XmlNode[] => value === undefined ? [] : (Array.isArray(value) ? value : [value]) as XmlNode[];
function xmlText(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "object") return String(value);
  if (Array.isArray(value)) return value.map(xmlText).join("");
  const node = value as XmlNode;
  return xmlText(node["#text"]) + xmlText(node.t) + xmlText(node.r);
}

/** Read only purchasing values, without styles, images or external links.
 * Accepts both default and prefixed SpreadsheetML namespaces. ExcelJS's own
 * XLSX reader does not accept the valid x:workbook used by some exporters. */
function loadPurchaseXlsx(bytes: Buffer, workbook: ExcelJS.Workbook): void {
  const files = unzipSync(bytes, { filter: (entry) => /^xl\/(workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|worksheets\/[^/]+\.xml)$/.test(entry.name) });
  const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, parseTagValue: false, trimValues: false });
  const parse = (name: string): XmlNode => {
    if (!files[name]) throw new Error(`В XLSX отсутствует ${name}.`);
    const text = new TextDecoder("utf-8", { fatal: true }).decode(files[name]);
    if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error("DTD и пользовательские XML-сущности не поддерживаются.");
    return parser.parse(text) as XmlNode;
  };
  const metadata = parse("xl/workbook.xml").workbook as XmlNode;
  const relationships = nodes((parse("xl/_rels/workbook.xml.rels").Relationships as XmlNode)?.Relationship);
  const sharedStrings = files["xl/sharedStrings.xml"] ? nodes((parse("xl/sharedStrings.xml").sst as XmlNode)?.si).map(xmlText) : [];
  const sheetMetadata = nodes((metadata?.sheets as XmlNode)?.sheet);
  if (sheetMetadata.length > 20) throw new Error("В файле допускается не более 20 листов.");
  for (const meta of sheetMetadata) {
    if (meta["@_state"] && meta["@_state"] !== "visible") continue;
    const relationship = relationships.find((item) => item["@_Id"] === meta["@_id"]);
    if (!relationship || relationship["@_TargetMode"] === "External") throw new Error("Неверная ссылка на лист XLSX.");
    const target = String(relationship["@_Target"] ?? "");
    const path = target.startsWith("/") ? target.slice(1) : posix.normalize(posix.join("xl", target));
    if (!/^xl\/worksheets\/[^/]+\.xml$/.test(path)) throw new Error("Неподдерживаемая ссылка на лист XLSX.");
    const data = parse(path).worksheet as XmlNode;
    const sheet = workbook.addWorksheet(String(meta["@_name"]));
    let cellCount = 0;
    for (const row of nodes((data?.sheetData as XmlNode)?.row)) {
      for (const cell of nodes(row.c)) {
        const address = String(cell["@_r"] ?? "");
        if (!/^[A-Z]{1,3}\d+$/.test(address) || ++cellCount > 200_000) throw new Error("Слишком большой или повреждённый лист XLSX.");
        const destination = sheet.getCell(address);
        if (Number(destination.row) > 10_000 || Number(destination.col) > 100) throw new Error("Для импорта оставьте не более 10 000 строк и 100 колонок.");
        const raw = xmlText(cell.v);
        if (cell.f !== undefined) destination.value = { formula: "_import_formula_", result: raw };
        else if (cell["@_t"] === "s") {
          if (!/^\d+$/.test(raw) || sharedStrings[Number(raw)] === undefined) throw new Error("Некорректная ссылка на текст XLSX.");
          destination.value = sharedStrings[Number(raw)];
        } else if (cell["@_t"] === "inlineStr") destination.value = xmlText(cell.is);
        else destination.value = (!cell["@_t"] || cell["@_t"] === "n") && raw !== "" && Number.isFinite(Number(raw)) ? Number(raw) : raw;
      }
    }
    for (const merge of nodes((data?.mergeCells as XmlNode)?.mergeCell)) {
      const range = String(merge["@_ref"] ?? "");
      const match = range.match(/^([A-Z]{1,3})(\d+):([A-Z]{1,3})(\d+)$/);
      if (!match || Number(match[2]) !== Number(match[4])) continue;
      // Only horizontal banners matter when finding table rows. Avoid huge
      // formatting-only merges outside the bounded purchasing table.
      const first = sheet.getCell(`${match[1]}${match[2]}`);
      const last = sheet.getCell(`${match[3]}${match[4]}`);
      if (Number(first.row) <= 10_000 && Number(last.col) <= 100) sheet.mergeCells(range);
    }
  }
}

export async function parsePurchaseFile(bytes: Buffer, fileName: string): Promise<PurchaseSheet[]> {
  if (bytes.length > MAX_IMPORT_BYTES) throw new Error("Размер файла должен быть не более 5 МБ.");
  const workbook = new ExcelJS.Workbook();
  if (/\.xlsx$/i.test(fileName)) {
    validatePurchaseArchive(bytes);
    loadPurchaseXlsx(bytes, workbook);
  } else if (/\.csv$/i.test(fileName)) {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^\uFEFF/, "");
    const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? "";
    const counts = new Map([[";", 0], [",", 0], ["\t", 0]]);
    let quoted = false;
    for (let index = 0; index < firstLine.length; index += 1) {
      if (firstLine[index] === '"') {
        if (quoted && firstLine[index + 1] === '"') index += 1;
        else quoted = !quoted;
      } else if (!quoted && counts.has(firstLine[index])) counts.set(firstLine[index], counts.get(firstLine[index])! + 1);
    }
    const delimiter = [...counts].sort((a, b) => b[1] - a[1])[0][0];
    await workbook.csv.read(Readable.from([text]), { parserOptions: { delimiter }, map: (value) => value, sheetName: "CSV" });
  } else {
    throw new Error("Пришлите Excel .xlsx или CSV в UTF-8.");
  }
  if (workbook.worksheets.length > 20) throw new Error("В файле допускается не более 20 листов.");
  const sheets = workbook.worksheets.filter((sheet) => sheet.state === "visible").map(parsePurchaseWorksheet).filter((sheet): sheet is PurchaseSheet => sheet !== null);
  if (!sheets.length) throw new Error("Не найдена таблица: нужны колонки артикула/SKU или названия и количества.");
  return sheets;
}

export type ResolvedPurchaseLine = {
  sku: number;
  name: string;
  quantity: number;
  sourceRows: number[];
  notes: string[];
};

export function groupPurchaseLines(rows: Array<PurchaseRow & { sku: number; resolvedName?: string }>): ResolvedPurchaseLine[] {
  const grouped = new Map<number, ResolvedPurchaseLine>();
  for (const row of rows) {
    const line = grouped.get(row.sku) ?? { sku: row.sku, name: row.resolvedName || row.name || row.article || `SKU ${row.sku}`, quantity: 0, sourceRows: [], notes: [] };
    line.quantity += row.quantity;
    if (line.quantity > MAX_IMPORT_QUANTITY) throw new Error(`SKU ${row.sku}: суммарное количество превышает ${MAX_IMPORT_QUANTITY}.`);
    line.sourceRows.push(row.row);
    if (row.note && !line.notes.includes(row.note)) line.notes.push(row.note);
    grouped.set(row.sku, line);
  }
  return [...grouped.values()];
}
