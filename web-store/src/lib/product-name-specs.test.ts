import { describe, expect, it } from "vitest";
import { extractProductNameSpecs } from "@/lib/product-name-specs";

describe("extractProductNameSpecs", () => {
  it("extracts obvious climate specs from dehumidifier names", () => {
    const specs = extractProductNameSpecs("Осушитель воздуха Ballu Vector BD-30L VT белый, 30 л/сутки, 4 л, очистка воздуха, гигростат");
    expect(specs).toContainEqual({ label: "Производительность", value: "30 л/сутки" });
    expect(specs).toContainEqual({ label: "Объем бака", value: "4 л" });
  });

  it("extracts TV diagonal, resolution and Smart TV", () => {
    const specs = extractProductNameSpecs('Телевизор Samsung UE55CU7100U 55" 4K UHD Smart TV');
    expect(specs).toContainEqual({ label: "Диагональ", value: '55"' });
    expect(specs).toContainEqual({ label: "Разрешение", value: "4K UHD" });
    expect(specs).toContainEqual({ label: "Smart TV", value: "Да" });
  });

  it("extracts computer memory and storage hints", () => {
    const specs = extractProductNameSpecs("Ноутбук Lenovo IdeaPad 15, 16 ГБ RAM, SSD 512 ГБ, Windows 11");
    expect(specs).toContainEqual({ label: "Оперативная память", value: "16 ГБ" });
    expect(specs).toContainEqual({ label: "Тип накопителя", value: "SSD" });
    expect(specs).toContainEqual({ label: "Объем накопителя", value: "512 ГБ" });
  });

  it("extracts power hints for garden equipment cards", () => {
    const specs = extractProductNameSpecs("Снегоуборщик бензиновый Elitech ST 0762LE 7л.с.");
    expect(specs).toContainEqual({ label: "Тип питания", value: "Бензиновый" });
    expect(specs).toContainEqual({ label: "Мощность двигателя", value: "7 л.с." });
  });

  it("extracts battery hints for cordless equipment cards", () => {
    const specs = extractProductNameSpecs("Газонокосилка аккумуляторная Makita DLM538CT2, 36 В, 5 Ач");
    expect(specs).toContainEqual({ label: "Тип питания", value: "Аккумуляторный" });
    expect(specs).toContainEqual({ label: "Напряжение аккумулятора", value: "36 В" });
    expect(specs).toContainEqual({ label: "Емкость аккумулятора", value: "5 Ач" });
  });

  it("extracts electrical cable hints for product cards", () => {
    const specs = extractProductNameSpecs("Кабель ВВГнг-LS 3х2,5 ГОСТ, бухта 100 м, белый");
    expect(specs).toContainEqual({ label: "Тип электротовара", value: "Кабель" });
    expect(specs).toContainEqual({ label: "Количество жил", value: "3 жилы" });
    expect(specs).toContainEqual({ label: "Сечение кабеля", value: "2.5 мм²" });
  });

  it("extracts dishwasher specs (programs, place settings, installation)", () => {
    const specs = extractProductNameSpecs("Встраиваемая посудомоечная машина Bosch SPV2IKX01Q 45см., Класс A-A-A; 5 прогр., 9 компл. посуды");
    expect(specs).toContainEqual({ label: "Установка", value: "Встраиваемая" });
    expect(specs).toContainEqual({ label: "Количество программ", value: "5 программ" });
    expect(specs).toContainEqual({ label: "Комплектов посуды", value: "9 компл." });
  });

  it("does not tag Smart TV from the word смартфон on non-TV products", () => {
    const specs = extractProductNameSpecs("Посудомоечная машина Bosch удаленный запуск через приложение на смартфоне");
    expect(specs).not.toContainEqual({ label: "Smart TV", value: "Да" });
  });

  it("does not invent specs for generic names", () => {
    expect(extractProductNameSpecs("Стиральная машина")).toEqual([]);
  });
});
