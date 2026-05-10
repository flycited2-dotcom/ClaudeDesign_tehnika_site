import { describe, expect, it } from "vitest";
import { extractProductNameSpecs } from "@/lib/product-name-specs";

describe("extractProductNameSpecs", () => {
  it("extracts obvious climate specs from dehumidifier names", () => {
    expect(
      extractProductNameSpecs("Осушитель воздуха Ballu Vector BD-30L VT белый, 30 л/сутки, 4 л, очистка воздуха, гигростат"),
    ).toEqual([
      { label: "Производительность", value: "30 л/сутки" },
      { label: "Объем бака", value: "4 л" },
    ]);
  });

  it("extracts TV diagonal and resolution hints", () => {
    expect(extractProductNameSpecs('Телевизор Samsung UE55CU7100U 55" 4K UHD Smart TV')).toEqual([
      { label: "Диагональ", value: '55"' },
      { label: "Разрешение", value: "4K UHD" },
    ]);
  });

  it("extracts computer memory and storage hints", () => {
    expect(extractProductNameSpecs("Ноутбук Lenovo IdeaPad 15, 16 ГБ RAM, SSD 512 ГБ, Windows 11")).toEqual([
      { label: "Оперативная память", value: "16 ГБ" },
      { label: "Накопитель", value: "SSD 512 ГБ" },
    ]);
  });

  it("extracts power hints for garden equipment cards", () => {
    expect(extractProductNameSpecs("Снегоуборщик бензиновый Elitech ST 0762LE 7л.с.")).toEqual([
      { label: "Тип питания", value: "Бензиновый" },
      { label: "Мощность двигателя", value: "7 л.с." },
    ]);
  });

  it("extracts battery hints for cordless equipment cards", () => {
    expect(extractProductNameSpecs("Газонокосилка аккумуляторная Makita DLM538CT2, 36 В, 5 Ач")).toEqual([
      { label: "Тип питания", value: "Аккумуляторный" },
      { label: "Напряжение аккумулятора", value: "36 В" },
      { label: "Емкость аккумулятора", value: "5 Ач" },
    ]);
  });

  it("extracts electrical cable hints for product cards", () => {
    expect(extractProductNameSpecs("Кабель ВВГнг-LS 3х2,5 ГОСТ, бухта 100 м, белый")).toEqual([
      { label: "Тип электротовара", value: "Кабель" },
      { label: "Количество жил", value: "3 жилы" },
      { label: "Сечение кабеля", value: "2.5 мм²" },
      { label: "Длина", value: "100 м" },
    ]);
  });

  it("extracts processor hints for laptop cards", () => {
    expect(extractProductNameSpecs("Ноутбук ASUS VivoBook 15 Intel Core i5-1235U, 16 ГБ RAM, SSD 512 ГБ, HDMI, Wi-Fi")).toEqual([
      { label: "Оперативная память", value: "16 ГБ" },
      { label: "Накопитель", value: "SSD 512 ГБ" },
      { label: "Процессор", value: "Intel Core i5" },
      { label: "Модель процессора", value: "Intel Core i5-1235U" },
    ]);
  });

  it("does not invent specs for generic names", () => {
    expect(extractProductNameSpecs("Стиральная машина белая")).toEqual([]);
  });
});
