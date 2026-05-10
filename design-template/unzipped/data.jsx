/* Catalog data, mock orders, etc. */

const CATEGORIES = [
  { id:"big",      name:"Крупная бытовая\nтехника",     count:"1 240 моделей", art:"REF-BIG" },
  { id:"small",    name:"Мелкая бытовая\nтехника",      count:"2 180 моделей", art:"REF-SMALL" },
  { id:"climate",  name:"Климатическая\nтехника",       count:"640 моделей",   art:"REF-CLIM" },
  { id:"comp",     name:"Компьютеры\nи комплектующие",  count:"1 540 моделей", art:"REF-COMP" },
  { id:"gadgets",  name:"Электроника\nи гаджеты",       count:"3 100 моделей", art:"REF-GADG" },
  { id:"smart",    name:"Умный дом",                    count:"380 моделей",   art:"REF-SMRT" },
];

const PRODUCTS = [
  { id:1, brand:"Bosch", name:"Холодильник Bosch KGN39VL24R Side-by-Side", cat:"big", kind:"fridge",
    price:79990, old:99990, b2b:71990, stock:"high", city:"Симферополь",
    tags:["sale"], specs:["No Frost","452 л","A++"] },
  { id:2, brand:"LG", name:"Стиральная машина LG F2H5HS6S 7 кг инверторная", cat:"big", kind:"washer",
    price:42990, old:49990, b2b:38900, stock:"high",
    tags:["hot"], specs:["7 кг","1200 об/мин","Steam"] },
  { id:3, brand:"DeLonghi", name:"Кофемашина DeLonghi Dinamica Plus автомат", cat:"small", kind:"coffee",
    price:79990, old:94990, b2b:72990, stock:"low",
    tags:["sale","new"], specs:["автомат","капучинатор","сенсор"] },
  { id:4, brand:"Samsung", name:"Кондиционер Samsung WindFree Avant 12 BTU", cat:"climate", kind:"ac",
    price:54990, old:62990, b2b:49900, stock:"high",
    tags:[], specs:["12000 BTU","инвертор","Wi-Fi"] },
  { id:5, brand:"Apple", name:"MacBook Air 15\" M3 16/512 GB Silver", cat:"comp", kind:"tv",
    price:144990, old:154990, b2b:138990, stock:"low",
    tags:["new"], specs:["M3","16 ГБ","512 ГБ"] },
  { id:6, brand:"Sony", name:"Наушники Sony WH-1000XM5 беспроводные", cat:"gadgets", kind:"vacuum",
    price:32990, old:38990, b2b:29990, stock:"high",
    tags:["hot"], specs:["ANC","30 ч","BT 5.2"] },
  { id:7, brand:"Dyson", name:"Пылесос Dyson V15 Detect Absolute", cat:"small", kind:"vacuum",
    price:89990, old:99990, b2b:81900, stock:"high",
    tags:[], specs:["вертикальный","60 мин","HEPA"] },
  { id:8, brand:"Yandex", name:"Колонка Яндекс Станция Макс с Алисой", cat:"smart", kind:"kettle",
    price:24990, old:29990, b2b:22500, stock:"high",
    tags:["sale"], specs:["Zigbee","65 Вт","HDMI"] },
  { id:9, brand:"Mitsubishi", name:"Сплит-система Mitsubishi Heavy SRK35 9 BTU", cat:"climate", kind:"ac",
    price:69990, b2b:64900, stock:"low",
    tags:[], specs:["9000 BTU","инвертор","-15°C"] },
  { id:10, brand:"Bosch", name:"Посудомоечная машина Bosch SMS44DW01R 60см", cat:"big", kind:"washer",
    price:48990, old:54990, b2b:44900, stock:"high",
    tags:[], specs:["60 см","13 комплектов","A+"] },
  { id:11, brand:"Xiaomi", name:"Робот-пылесос Xiaomi S20+ Mop сухая+влажная", cat:"smart", kind:"vacuum",
    price:29990, old:34990, b2b:27500, stock:"high",
    tags:["new"], specs:["LiDAR","5200 мАч","30 Вт"] },
  { id:12, brand:"Philips", name:"Телевизор Philips 55PUS8108 55\" 4K Ambilight", cat:"gadgets", kind:"tv",
    price:64990, old:74990, b2b:59900, stock:"high",
    tags:["sale"], specs:["55\"","4K","Ambilight"] },
];

const FILTERS = {
  brands:[
    { name:"Bosch", count:48, on:true }, { name:"LG", count:62 },
    { name:"Samsung", count:74, on:true }, { name:"Sony", count:31 },
    { name:"Philips", count:28 }, { name:"Apple", count:15 },
    { name:"Xiaomi", count:42 }, { name:"DeLonghi", count:19 },
  ],
  cats:[
    { name:"Холодильники", count:124 }, { name:"Стиральные машины", count:98 },
    { name:"Кофемашины", count:42 }, { name:"Пылесосы", count:67 },
    { name:"Микроволновки", count:38 }, { name:"Посудомойки", count:45 },
  ],
};

const ORDERS = [
  { id:"БТО-2024-0184", date:"03.05.2026", total:"79 990 ₽", status:"new",   statusText:"Принят",      items:1 },
  { id:"БТО-2024-0177", date:"28.04.2026", total:"122 480 ₽", status:"prog", statusText:"В доставке",  items:3 },
  { id:"БТО-2024-0151", date:"12.04.2026", total:"54 990 ₽", status:"done",  statusText:"Получен",     items:1 },
  { id:"БТО-2024-0098", date:"21.03.2026", total:"234 970 ₽", status:"done", statusText:"Получен",     items:5 },
  { id:"БТО-2024-0042", date:"08.02.2026", total:"19 990 ₽", status:"canc",  statusText:"Отменён",     items:1 },
];

const KP_LIST = [
  { id:"КП-3104", date:"30.04.2026", subj:"Холодильное оборудование, 12 поз.", status:"prog", statusText:"На рассмотрении" },
  { id:"КП-3088", date:"24.04.2026", subj:"Климатические системы для офиса, 8 поз.", status:"done", statusText:"Договор подписан" },
  { id:"КП-3071", date:"18.04.2026", subj:"Компьютерная техника по 44-ФЗ, 24 поз.", status:"new", statusText:"Новый запрос" },
];

const SPECS_FULL = [
  ["section","Общие"],
  ["Тип","Side-by-Side"],
  ["Цвет","Inox"],
  ["Размеры (Ш×Г×В)","91 × 71 × 178 см"],
  ["Вес","99 кг"],
  ["Класс энергопотребления","A++"],
  ["section","Холодильное отделение"],
  ["Объём","452 л"],
  ["Тип управления","электронный"],
  ["No Frost","Да"],
  ["Зона свежести","Есть"],
  ["section","Морозильное отделение"],
  ["Объём","104 л"],
  ["Заморозка","быстрая"],
  ["Время сохр. холода","18 ч"],
  ["section","Дополнительно"],
  ["Дисплей","сенсорный"],
  ["Антибактериальное покрытие","Да"],
  ["Уровень шума","42 дБ"],
  ["Гарантия","24 месяца"],
];

window.SHOP = { CATEGORIES, PRODUCTS, FILTERS, ORDERS, KP_LIST, SPECS_FULL };
