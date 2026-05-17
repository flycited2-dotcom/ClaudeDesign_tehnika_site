(function () {
  'use strict';

  const now = Date.now();
  const min = m => new Date(now + m * 60000).toISOString();
  const hr  = h => min(h * 60);
  const day = d => hr(d * 24);

  // ─── USERS ────────────────────────────────────────────────────────────────
  const users = [
    { id: 'USR-001', name: 'Царёва Анна Игоревна',      role: 'owner',             email: 'tsareva@crm.ru',       phone: '+7 495 100-01-01', hireDate: '2020-01-15' },
    { id: 'USR-002', name: 'Лапин Дмитрий Сергеевич',   role: 'head_of_sales',     email: 'lapin@crm.ru',         phone: '+7 495 100-01-02', hireDate: '2020-03-10' },
    { id: 'USR-003', name: 'Морозова Екатерина Павловна',role: 'manager',           email: 'morozova@crm.ru',      phone: '+7 495 100-01-03', hireDate: '2021-06-01' },
    { id: 'USR-004', name: 'Васильев Илья Романович',   role: 'manager',           email: 'vasiliev@crm.ru',      phone: '+7 495 100-01-04', hireDate: '2021-09-15' },
    { id: 'USR-005', name: 'Захарова Ольга Николаевна', role: 'manager',           email: 'zakharova@crm.ru',     phone: '+7 495 100-01-05', hireDate: '2022-02-28' },
    { id: 'USR-006', name: 'Тихонов Андрей Витальевич', role: 'manager',           email: 'tikhonov@crm.ru',      phone: '+7 495 100-01-06', hireDate: '2022-07-11' },
    { id: 'USR-007', name: 'Беляева Светлана Юрьевна',  role: 'tender_specialist', email: 'belyaeva@crm.ru',      phone: '+7 495 100-01-07', hireDate: '2023-01-09' },
    { id: 'USR-008', name: 'Громов Павел Александрович', role: 'purchaser',         email: 'gromov@crm.ru',        phone: '+7 495 100-01-08', hireDate: '2023-04-03' },
  ];

  // ─── CLIENTS ──────────────────────────────────────────────────────────────
  const clients = [
    { id: 'CL-0001', name: 'ТД Северное Сияние',         type: 'company',    inn: '7701234567',   kpp: '770101001', legalAddress: 'г. Москва, ул. Ленина, д. 5', factAddress: 'г. Москва, ул. Ленина, д. 5', phone: '+7 495 200-01-01', email: 'info@sevsiyanie.ru',   source: 'Сайт основной',      responsible: 'USR-003', status: 'active',   segment: 'Опт',     tags: ['постоянный','опт'],        dealsSum: 3800000, lastActivity: day(-1),  createdAt: day(-180) },
    { id: 'CL-0002', name: 'Промлогистик-Урал',           type: 'company',    inn: '6674321098',   kpp: '667401001', legalAddress: 'г. Екатеринбург, пр. Ленина, 56', factAddress: 'г. Екатеринбург, пр. Ленина, 56', phone: '+7 343 200-02-02', email: 'contact@promlogural.ru', source: 'Звонок входящий',   responsible: 'USR-004', status: 'active',   segment: 'Опт',     tags: ['опт','логистика'],         dealsSum: 2100000, lastActivity: day(-3),  createdAt: day(-210) },
    { id: 'CL-0003', name: 'ГБУЗ ГКБ №67',               type: 'state',      inn: '7709876543',   kpp: '770901001', legalAddress: 'г. Москва, ул. Садовая, 12', factAddress: 'г. Москва, ул. Садовая, 12', phone: '+7 495 200-03-03', email: 'gkb67@mos.ru',         source: 'Тендерная площадка ZakupKi', responsible: 'USR-007', status: 'active',   segment: 'Тендеры', tags: ['гос','тендер'],            dealsSum: 5600000, lastActivity: day(-2),  createdAt: day(-365) },
    { id: 'CL-0004', name: 'ИП Корнилова О.А.',           type: 'individual', inn: '501234567890', kpp: null,        legalAddress: 'г. Краснодар, ул. Красная, 88', factAddress: 'г. Краснодар, ул. Красная, 88', phone: '+7 861 200-04-04', email: 'kornilova@mail.ru',    source: 'Сайт opt',           responsible: 'USR-005', status: 'prospect', segment: 'Розница', tags: ['новый'],                   dealsSum: 0,       lastActivity: day(-10), createdAt: day(-30)  },
    { id: 'CL-0005', name: 'АО Стройсервис',              type: 'company',    inn: '5010987654',   kpp: '501001001', legalAddress: 'г. Подольск, ул. Строителей, 1', factAddress: 'г. Подольск, ул. Строителей, 1', phone: '+7 496 200-05-05', email: 'info@stroiserv.ru',    source: 'Звонок входящий',   responsible: 'USR-003', status: 'active',   segment: 'Тендеры', tags: ['строительство','тендер'],  dealsSum: 4200000, lastActivity: day(-4),  createdAt: day(-300) },
    { id: 'CL-0006', name: 'ООО Балтэнерго',              type: 'company',    inn: '7801122334',   kpp: '780101001', legalAddress: 'г. Санкт-Петербург, пр. Невский, 100', factAddress: 'г. Санкт-Петербург, пр. Невский, 100', phone: '+7 812 200-06-06', email: 'balt@baltenergo.ru',   source: 'Telegram-бот',       responsible: 'USR-004', status: 'active',   segment: 'Опт',     tags: ['энергетика','опт'],        dealsSum: 1750000, lastActivity: day(-1),  createdAt: day(-150) },
    { id: 'CL-0007', name: 'ТОО МедТехника Плюс',         type: 'company',    inn: '7703344556',   kpp: '770301001', legalAddress: 'г. Москва, ул. Профсоюзная, 33', factAddress: 'г. Москва, ул. Профсоюзная, 33', phone: '+7 495 200-07-07', email: 'med@medtech.ru',       source: 'Сайт основной',      responsible: 'USR-006', status: 'active',   segment: 'Тендеры', tags: ['медицина','тендер'],        dealsSum: 890000,  lastActivity: day(-7),  createdAt: day(-200) },
    { id: 'CL-0008', name: 'ЗАО Агропромторг',            type: 'company',    inn: '6320445566',   kpp: '632001001', legalAddress: 'г. Самара, ул. Советская, 21', factAddress: 'г. Самара, ул. Советская, 21', phone: '+7 846 200-08-08', email: 'agro@agropromtorg.ru', source: 'Звонок входящий',   responsible: 'USR-005', status: 'active',   segment: 'Опт',     tags: ['агро','опт'],              dealsSum: 2300000, lastActivity: day(-5),  createdAt: day(-260) },
    { id: 'CL-0009', name: 'ООО НефтехимСнаб',            type: 'company',    inn: '7727556677',   kpp: '772701001', legalAddress: 'г. Москва, Варшавское ш., 9', factAddress: 'г. Москва, Варшавское ш., 9', phone: '+7 495 200-09-09', email: 'ncs@nchsnab.ru',       source: 'Сайт opt',           responsible: 'USR-004', status: 'active',   segment: 'Опт',     tags: ['химия','опт'],             dealsSum: 3100000, lastActivity: day(-2),  createdAt: day(-400) },
    { id: 'CL-0010', name: 'МБОУ СОШ №15 г. Тулы',       type: 'state',      inn: '7101667788',   kpp: '710101001', legalAddress: 'г. Тула, ул. Первомайская, 15', factAddress: 'г. Тула, ул. Первомайская, 15', phone: '+7 487 200-10-10', email: 'school15@tula.edu',    source: 'Тендерная площадка ZakupKi', responsible: 'USR-007', status: 'prospect', segment: 'Тендеры', tags: ['гос','образование'],        dealsSum: 120000,  lastActivity: day(-14), createdAt: day(-45)  },
    { id: 'CL-0011', name: 'ИП Семёнов В.Г.',             type: 'individual', inn: '772377889900', kpp: null,        legalAddress: 'г. Москва, ул. Арбат, 10', factAddress: 'г. Москва, ул. Арбат, 10', phone: '+7 495 200-11-11', email: 'semenov@yandex.ru',    source: 'Telegram-бот',       responsible: 'USR-006', status: 'inactive', segment: 'Розница', tags: ['малый бизнес'],            dealsSum: 480000,  lastActivity: day(-60), createdAt: day(-500) },
    { id: 'CL-0012', name: 'ООО Техностандарт',           type: 'company',    inn: '5047889900',   kpp: '504701001', legalAddress: 'г. Мытищи, ул. Промышленная, 7', factAddress: 'г. Мытищи, ул. Промышленная, 7', phone: '+7 495 200-12-12', email: 'info@techstandard.ru', source: 'Сайт основной',      responsible: 'USR-003', status: 'active',   segment: 'Опт',     tags: ['оборудование','опт'],      dealsSum: 1900000, lastActivity: day(-3),  createdAt: day(-190) },
    { id: 'CL-0013', name: 'ГКУ Центр занятости Москвы',  type: 'state',      inn: '7723990011',   kpp: '772301001', legalAddress: 'г. Москва, ул. Тверская, 50', factAddress: 'г. Москва, ул. Тверская, 50', phone: '+7 495 200-13-13', email: 'czm@mos.ru',           source: 'Тендерная площадка ZakupKi', responsible: 'USR-007', status: 'active',   segment: 'Тендеры', tags: ['гос','тендер'],            dealsSum: 780000,  lastActivity: day(-6),  createdAt: day(-280) },
    { id: 'CL-0014', name: 'ООО СтройМаш',                type: 'company',    inn: '6671001122',   kpp: '667101001', legalAddress: 'г. Екатеринбург, ул. Малышева, 40', factAddress: 'г. Екатеринбург, ул. Малышева, 40', phone: '+7 343 200-14-14', email: 'stroymash@ural.ru',    source: 'Звонок входящий',   responsible: 'USR-005', status: 'active',   segment: 'Опт',     tags: ['строительство'],           dealsSum: 2700000, lastActivity: day(-1),  createdAt: day(-320) },
    { id: 'CL-0015', name: 'ПАО Газснабсервис',           type: 'company',    inn: '7736111223',   kpp: '773601001', legalAddress: 'г. Москва, Ленинградский пр., 80', factAddress: 'г. Москва, Ленинградский пр., 80', phone: '+7 495 200-15-15', email: 'gss@gazsnab.ru',       source: 'Сайт opt',           responsible: 'USR-004', status: 'active',   segment: 'Опт',     tags: ['газ','опт','ключевой'],    dealsSum: 6100000, lastActivity: day(-1),  createdAt: day(-600) },
    { id: 'CL-0016', name: 'ИП Луговой Р.Н.',             type: 'individual', inn: '500911223344', kpp: null,        legalAddress: 'г. Казань, ул. Баумана, 5', factAddress: 'г. Казань, ул. Баумана, 5', phone: '+7 843 200-16-16', email: 'lugovoi@gmail.com',    source: 'Сайт основной',      responsible: 'USR-006', status: 'prospect', segment: 'Розница', tags: ['новый'],                   dealsSum: 0,       lastActivity: day(-20), createdAt: day(-20)  },
    { id: 'CL-0017', name: 'АО Уральская торговая компания', type: 'company', inn: '6662233445',   kpp: '666201001', legalAddress: 'г. Пермь, ул. Ленина, 58', factAddress: 'г. Пермь, ул. Ленина, 58', phone: '+7 342 200-17-17', email: 'utk@utcompany.ru',     source: 'Звонок входящий',   responsible: 'USR-003', status: 'active',   segment: 'Опт',     tags: ['опт'],                     dealsSum: 1350000, lastActivity: day(-8),  createdAt: day(-240) },
    { id: 'CL-0018', name: 'ООО Экотранспорт',            type: 'company',    inn: '7801334556',   kpp: '780101002', legalAddress: 'г. Санкт-Петербург, ул. Заставская, 14', factAddress: 'г. Санкт-Петербург, ул. Заставская, 14', phone: '+7 812 200-18-18', email: 'eco@ecotrans.ru',      source: 'Telegram-бот',       responsible: 'USR-005', status: 'active',   segment: 'Опт',     tags: ['транспорт','опт'],         dealsSum: 970000,  lastActivity: day(-4),  createdAt: day(-170) },
    { id: 'CL-0019', name: 'ФГУП НИИ Технологий',         type: 'state',      inn: '7702445667',   kpp: '770201001', legalAddress: 'г. Москва, ул. Академика Королёва, 3', factAddress: 'г. Москва, ул. Академика Королёва, 3', phone: '+7 495 200-19-19', email: 'niit@niit.ru',         source: 'Тендерная площадка ZakupKi', responsible: 'USR-007', status: 'active',   segment: 'Тендеры', tags: ['гос','наука'],             dealsSum: 3400000, lastActivity: day(-3),  createdAt: day(-450) },
    { id: 'CL-0020', name: 'ООО РусХолод',                type: 'company',    inn: '5027556778',   kpp: '502701001', legalAddress: 'г. Красногорск, ул. Речная, 3', factAddress: 'г. Красногорск, ул. Речная, 3', phone: '+7 495 200-20-20', email: 'info@rusholod.ru',     source: 'Сайт opt',           responsible: 'USR-004', status: 'active',   segment: 'Опт',     tags: ['холодильное'],             dealsSum: 1620000, lastActivity: day(-5),  createdAt: day(-130) },
    { id: 'CL-0021', name: 'ИП Петрова М.С.',             type: 'individual', inn: '771156778901', kpp: null,        legalAddress: 'г. Москва, ул. Митинская, 22', factAddress: 'г. Москва, ул. Митинская, 22', phone: '+7 495 200-21-21', email: 'petrova.ms@inbox.ru',  source: 'Telegram-бот',       responsible: 'USR-006', status: 'prospect', segment: 'Розница', tags: ['новый','розница'],         dealsSum: 0,       lastActivity: day(-5),  createdAt: day(-15)  },
    { id: 'CL-0022', name: 'ООО ТехноПром',               type: 'company',    inn: '7710667889',   kpp: '771001001', legalAddress: 'г. Москва, Каширское ш., 17', factAddress: 'г. Москва, Каширское ш., 17', phone: '+7 495 200-22-22', email: 'tp@technoprom.ru',     source: 'Сайт основной',      responsible: 'USR-003', status: 'inactive', segment: 'Опт',     tags: ['приостановлен'],           dealsSum: 560000,  lastActivity: day(-90), createdAt: day(-700) },
    { id: 'CL-0023', name: 'ГАУ Спортивная школа №3',     type: 'state',      inn: '7707778900',   kpp: '770701001', legalAddress: 'г. Москва, ул. Беговая, 7', factAddress: 'г. Москва, ул. Беговая, 7', phone: '+7 495 200-23-23', email: 'sport3@mos.ru',        source: 'Тендерная площадка ZakupKi', responsible: 'USR-007', status: 'prospect', segment: 'Тендеры', tags: ['гос','спорт'],             dealsSum: 0,       lastActivity: day(-12), createdAt: day(-25)  },
    { id: 'CL-0024', name: 'ООО Альфа-Трейд',             type: 'company',    inn: '7727889011',   kpp: '772701002', legalAddress: 'г. Москва, ул. Маросейка, 9', factAddress: 'г. Москва, ул. Маросейка, 9', phone: '+7 495 200-24-24', email: 'info@alfatrade.ru',    source: 'Звонок входящий',   responsible: 'USR-005', status: 'active',   segment: 'Розница', tags: ['розница'],                 dealsSum: 840000,  lastActivity: day(-2),  createdAt: day(-110) },
  ];

  // ─── CONTACTS ─────────────────────────────────────────────────────────────
  const contacts = [
    { id: 'CT-0001', clientId: 'CL-0001', name: 'Борисов Игорь Михайлович',     position: 'Директор',               phone: '+7 495 300-01-01', email: 'borisov@sevsiyanie.ru' },
    { id: 'CT-0002', clientId: 'CL-0001', name: 'Селиверстова Наталья Юрьевна', position: 'Главный бухгалтер',      phone: '+7 495 300-01-02', email: 'sn@sevsiyanie.ru' },
    { id: 'CT-0003', clientId: 'CL-0002', name: 'Овчинников Василий Петрович',  position: 'Коммерческий директор',  phone: '+7 343 300-02-01', email: 'ovchinnikov@promlogural.ru' },
    { id: 'CT-0004', clientId: 'CL-0002', name: 'Кузьмина Людмила Геннадьевна', position: 'Менеджер по закупкам',   phone: '+7 343 300-02-02', email: 'kuzmina@promlogural.ru' },
    { id: 'CT-0005', clientId: 'CL-0003', name: 'Архипов Сергей Владимирович',  position: 'Заместитель главврача',  phone: '+7 495 300-03-01', email: 'arkhipov@gkb67.ru' },
    { id: 'CT-0006', clientId: 'CL-0003', name: 'Тарасова Ирина Сергеевна',     position: 'Специалист по тендерам', phone: '+7 495 300-03-02', email: 'tarasova@gkb67.ru' },
    { id: 'CT-0007', clientId: 'CL-0004', name: 'Корнилова Ольга Александровна',position: 'Индивидуальный предприниматель', phone: '+7 861 300-04-01', email: 'kornilova@mail.ru' },
    { id: 'CT-0008', clientId: 'CL-0005', name: 'Зотов Михаил Олегович',        position: 'Генеральный директор',   phone: '+7 496 300-05-01', email: 'zotov@stroiserv.ru' },
    { id: 'CT-0009', clientId: 'CL-0005', name: 'Ковалёва Анастасия Романовна', position: 'Руководитель тендерного отдела', phone: '+7 496 300-05-02', email: 'kovaleva@stroiserv.ru' },
    { id: 'CT-0010', clientId: 'CL-0006', name: 'Савельев Денис Константинович',position: 'Директор по продажам',   phone: '+7 812 300-06-01', email: 'savelyev@baltenergo.ru' },
    { id: 'CT-0011', clientId: 'CL-0006', name: 'Орлова Виктория Павловна',     position: 'Офис-менеджер',          phone: '+7 812 300-06-02', email: 'orlova@baltenergo.ru' },
    { id: 'CT-0012', clientId: 'CL-0007', name: 'Мельников Артём Дмитриевич',   position: 'Технический директор',   phone: '+7 495 300-07-01', email: 'melnikov@medtech.ru' },
    { id: 'CT-0013', clientId: 'CL-0008', name: 'Рябов Николай Фёдорович',      position: 'Директор',               phone: '+7 846 300-08-01', email: 'ryabov@agropromtorg.ru' },
    { id: 'CT-0014', clientId: 'CL-0008', name: 'Блинова Тамара Алексеевна',    position: 'Бухгалтер',              phone: '+7 846 300-08-02', email: 'blinova@agropromtorg.ru' },
    { id: 'CT-0015', clientId: 'CL-0009', name: 'Поляков Роман Викторович',     position: 'Коммерческий директор',  phone: '+7 495 300-09-01', email: 'polyakov@nchsnab.ru' },
    { id: 'CT-0016', clientId: 'CL-0010', name: 'Дроздова Елена Николаевна',    position: 'Завуч',                  phone: '+7 487 300-10-01', email: 'drozdova@school15tula.ru' },
    { id: 'CT-0017', clientId: 'CL-0011', name: 'Семёнов Владимир Григорьевич', position: 'ИП',                     phone: '+7 495 300-11-01', email: 'semenov@yandex.ru' },
    { id: 'CT-0018', clientId: 'CL-0012', name: 'Козловский Игорь Алексеевич',  position: 'Руководитель отдела снабжения', phone: '+7 495 300-12-01', email: 'kozlovsky@techstandard.ru' },
    { id: 'CT-0019', clientId: 'CL-0012', name: 'Фёдорова Юлия Вадимовна',      position: 'Менеджер',               phone: '+7 495 300-12-02', email: 'fedorova@techstandard.ru' },
    { id: 'CT-0020', clientId: 'CL-0013', name: 'Никитин Борис Олегович',       position: 'Руководитель АХО',        phone: '+7 495 300-13-01', email: 'nikitin@czm.mos.ru' },
    { id: 'CT-0021', clientId: 'CL-0014', name: 'Лебедева Светлана Анатольевна',position: 'Коммерческий директор',  phone: '+7 343 300-14-01', email: 'lebedeva@stroymash.ru' },
    { id: 'CT-0022', clientId: 'CL-0015', name: 'Горбунов Алексей Сергеевич',   position: 'Директор по закупкам',   phone: '+7 495 300-15-01', email: 'gorbunov@gazsnab.ru' },
    { id: 'CT-0023', clientId: 'CL-0015', name: 'Соколова Марина Ивановна',     position: 'Финансовый директор',    phone: '+7 495 300-15-02', email: 'sokolova@gazsnab.ru' },
    { id: 'CT-0024', clientId: 'CL-0016', name: 'Луговой Руслан Николаевич',    position: 'ИП',                     phone: '+7 843 300-16-01', email: 'lugovoi@gmail.com' },
    { id: 'CT-0025', clientId: 'CL-0017', name: 'Щербаков Пётр Иванович',       position: 'Генеральный директор',   phone: '+7 342 300-17-01', email: 'scherbakov@utcompany.ru' },
    { id: 'CT-0026', clientId: 'CL-0017', name: 'Носова Галина Сергеевна',      position: 'Секретарь',              phone: '+7 342 300-17-02', email: 'nosova@utcompany.ru' },
    { id: 'CT-0027', clientId: 'CL-0018', name: 'Власов Дмитрий Евгеньевич',    position: 'Директор',               phone: '+7 812 300-18-01', email: 'vlasov@ecotrans.ru' },
    { id: 'CT-0028', clientId: 'CL-0019', name: 'Егорова Ксения Борисовна',     position: 'Заместитель директора',  phone: '+7 495 300-19-01', email: 'egorova@niit.ru' },
    { id: 'CT-0029', clientId: 'CL-0019', name: 'Сидоров Евгений Анатольевич',  position: 'Специалист по контрактам', phone: '+7 495 300-19-02', email: 'sidorov@niit.ru' },
    { id: 'CT-0030', clientId: 'CL-0020', name: 'Антонов Сергей Леонидович',    position: 'Коммерческий директор',  phone: '+7 495 300-20-01', email: 'antonov@rusholod.ru' },
    { id: 'CT-0031', clientId: 'CL-0021', name: 'Петрова Мария Сергеевна',      position: 'ИП',                     phone: '+7 495 300-21-01', email: 'petrova.ms@inbox.ru' },
    { id: 'CT-0032', clientId: 'CL-0022', name: 'Громова Наталья Вячеславовна', position: 'Менеджер по продажам',   phone: '+7 495 300-22-01', email: 'gromova@technoprom.ru' },
    { id: 'CT-0033', clientId: 'CL-0023', name: 'Калинин Александр Олегович',   position: 'Директор',               phone: '+7 495 300-23-01', email: 'kalinin@sport3.ru' },
    { id: 'CT-0034', clientId: 'CL-0024', name: 'Ушакова Валентина Игоревна',   position: 'Менеджер по закупкам',   phone: '+7 495 300-24-01', email: 'ushakova@alfatrade.ru' },
    { id: 'CT-0035', clientId: 'CL-0001', name: 'Ларионов Артём Семёнович',     position: 'Менеджер по снабжению',  phone: '+7 495 300-01-03', email: 'larionov@sevsiyanie.ru' },
    { id: 'CT-0036', clientId: 'CL-0009', name: 'Воронцова Алина Павловна',     position: 'Менеджер',               phone: '+7 495 300-09-02', email: 'vorontsova@nchsnab.ru' },
    { id: 'CT-0037', clientId: 'CL-0014', name: 'Попов Артём Геннадьевич',      position: 'Инженер',                phone: '+7 343 300-14-02', email: 'popov@stroymash.ru' },
    { id: 'CT-0038', clientId: 'CL-0015', name: 'Кириллов Дмитрий Олегович',   position: 'Технолог',               phone: '+7 495 300-15-03', email: 'kirillov@gazsnab.ru' },
    { id: 'CT-0039', clientId: 'CL-0005', name: 'Чернова Ольга Петровна',       position: 'Бухгалтер',              phone: '+7 496 300-05-03', email: 'chernova@stroiserv.ru' },
    { id: 'CT-0040', clientId: 'CL-0003', name: 'Мамонтов Кирилл Юрьевич',     position: 'Юрист',                  phone: '+7 495 300-03-03', email: 'mamontov@gkb67.ru' },
  ];

  // ─── LEADS ────────────────────────────────────────────────────────────────
  // 3 leads: status 'new', createdAt between 20 and 90 minutes ago
  const leads = [
    { id: 'LD-0001', title: 'Поставка насосного оборудования',      source: 'Сайт основной',              status: 'new',       responsible: null,      createdAt: min(-25), clientCandidate: 'ООО РусНасос',           phone: '+7 495 400-01-01', email: 'info@rusnasoc.ru',   sum: 350000,  utm: { source: 'google', medium: 'cpc', campaign: 'pumps-2026' } },
    { id: 'LD-0002', title: 'Запрос на оптовую поставку СИЗ',       source: 'Сайт opt',                   status: 'new',       responsible: null,      createdAt: min(-47), clientCandidate: 'ИП Дроздов А.В.',        phone: '+7 903 400-02-02', email: 'drozdov.av@mail.ru', sum: null,    utm: { source: 'yandex', medium: 'cpc', campaign: 'opt-siz' } },
    { id: 'LD-0003', title: 'Тендер на поставку медикаментов',       source: 'Тендерная площадка ZakupKi', status: 'new',       responsible: null,      createdAt: min(-72), clientCandidate: 'ГБУЗ Клиника №5',        phone: '+7 495 400-03-03', email: 'zakup@klinika5.ru',  sum: 870000,  utm: { source: 'zakupki', medium: 'tender', campaign: null } },
    { id: 'LD-0004', title: 'Запрос КП на строительные материалы',   source: 'Звонок входящий',            status: 'in_work',   responsible: 'USR-003', createdAt: day(-2),  clientCandidate: 'ООО СтройПартнёр',       phone: '+7 495 400-04-04', email: null,                 sum: 220000,  utm: {} },
    { id: 'LD-0005', title: 'Интерес к поставке холодильников',      source: 'Telegram-бот',               status: 'in_work',   responsible: 'USR-004', createdAt: day(-3),  clientCandidate: 'ТД Морозко',             phone: '+7 812 400-05-05', email: 'info@morozko.ru',    sum: 180000,  utm: { source: 'telegram', medium: 'bot', campaign: null } },
    { id: 'LD-0006', title: 'Оптовый заказ метизов',                 source: 'Сайт opt',                   status: 'in_work',   responsible: 'USR-005', createdAt: day(-1),  clientCandidate: 'ООО МеталлТрейд',        phone: '+7 343 400-06-06', email: 'metal@mttrade.ru',   sum: 95000,   utm: { source: 'yandex', medium: 'organic', campaign: null } },
    { id: 'LD-0007', title: 'Поставка офисной мебели по тендеру',    source: 'Тендерная площадка ZakupKi', status: 'qualified', responsible: 'USR-007', createdAt: day(-5),  clientCandidate: 'МКУ Администрация р-на', phone: '+7 495 400-07-07', email: 'mku@admin.ru',       sum: 630000,  utm: { source: 'zakupki', medium: 'tender', campaign: null } },
    { id: 'LD-0008', title: 'Реализация спецодежды',                 source: 'Сайт основной',              status: 'qualified', responsible: 'USR-003', createdAt: day(-4),  clientCandidate: 'ООО ЗащитаТруд',         phone: '+7 846 400-08-08', email: 'info@zaschitrud.ru', sum: 210000,  utm: { source: 'google', medium: 'cpc', campaign: 'clothing' } },
    { id: 'LD-0009', title: 'Запрос на сервисное обслуживание',      source: 'Звонок входящий',            status: 'qualified', responsible: 'USR-006', createdAt: day(-6),  clientCandidate: 'АО ЛесМаш',             phone: '+7 812 400-09-09', email: 'lesmash@lm.ru',      sum: 140000,  utm: {} },
    { id: 'LD-0010', title: 'Поставка химических реактивов',         source: 'Сайт opt',                   status: 'qualified', responsible: 'USR-004', createdAt: day(-7),  clientCandidate: 'НПО ХимСинтез',          phone: '+7 495 400-10-10', email: 'khim@npohim.ru',     sum: 475000,  utm: { source: 'yandex', medium: 'cpc', campaign: 'chem-2026' } },
    { id: 'LD-0011', title: 'Поставка запчастей для спецтехники',    source: 'Telegram-бот',               status: 'in_work',   responsible: 'USR-005', createdAt: day(-2),  clientCandidate: 'ООО АвтоСпецТехника',    phone: '+7 343 400-11-11', email: 'ast@ast-ural.ru',    sum: 320000,  utm: { source: 'telegram', medium: 'bot', campaign: null } },
    { id: 'LD-0012', title: 'Запрос на поставку кабельной продукции', source: 'Сайт основной',             status: 'in_work',   responsible: 'USR-006', createdAt: day(-1),  clientCandidate: 'ООО ЭлектроМонтаж',      phone: '+7 495 400-12-12', email: 'em@electromontaj.ru', sum: 560000, utm: { source: 'google', medium: 'organic', campaign: null } },
    { id: 'LD-0013', title: 'Оптовые закупки продовольствия',        source: 'Звонок входящий',            status: 'rejected',  responsible: 'USR-003', createdAt: day(-10), clientCandidate: 'ООО ПродСнаб',           phone: '+7 846 400-13-13', email: null,                 sum: null,    utm: {} },
    { id: 'LD-0014', title: 'Поставка стройматериалов для дачи',     source: 'Сайт основной',              status: 'rejected',  responsible: 'USR-004', createdAt: day(-8),  clientCandidate: 'Физлицо Щукин И.О.',     phone: '+7 916 400-14-14', email: 'shchukin@mail.ru',   sum: 15000,   utm: { source: 'google', medium: 'cpc', campaign: 'diy' } },
    { id: 'LD-0015', title: 'Тендер: медоборудование для поликлиники',source: 'Тендерная площадка ZakupKi',status: 'qualified', responsible: 'USR-007', createdAt: day(-9),  clientCandidate: 'ГБУЗ Поликлиника №102', phone: '+7 495 400-15-15', email: 'zakup@pk102.ru',     sum: 1200000, utm: { source: 'zakupki', medium: 'tender', campaign: null } },
    { id: 'LD-0016', title: 'Запрос КП: складское оборудование',     source: 'Сайт opt',                   status: 'in_work',   responsible: 'USR-005', createdAt: day(-3),  clientCandidate: 'ООО ЛогистикПро',        phone: '+7 495 400-16-16', email: 'log@logpro.ru',      sum: 780000,  utm: { source: 'yandex', medium: 'cpc', campaign: 'sklad' } },
    { id: 'LD-0017', title: 'Поставка инвентаря для школьного спорт. зала', source: 'Тендерная площадка ZakupKi', status: 'qualified', responsible: 'USR-007', createdAt: day(-11), clientCandidate: 'МБОУ СОШ №31',    phone: '+7 487 400-17-17', email: 'school31@tula.edu',  sum: 95000,   utm: { source: 'zakupki', medium: 'tender', campaign: null } },
    { id: 'LD-0018', title: 'Поставка канцтоваров для офиса',        source: 'Сайт основной',              status: 'rejected',  responsible: 'USR-006', createdAt: day(-15), clientCandidate: 'ООО СервисОфис',         phone: '+7 495 400-18-18', email: 'soffice@serv.ru',    sum: 28000,   utm: { source: 'google', medium: 'cpc', campaign: 'office' } },
  ];

  // ─── DEALS ────────────────────────────────────────────────────────────────
  // Distribution: new=3, qualified=4, offer_sent=5, negotiation=5, won=3, lost=2
  // At least 2 deals not in won/lost have lastActionAt older than 3 days
  const deals = [
    { id: 'DL-0001', number: 'СД-2026-0001', title: 'Поставка насосного оборудования',      clientId: 'CL-0009', stage: 'new',          direction: 'Опт',     funnel: 'Основная', responsible: 'USR-004', amount: 350000,  createdAt: day(-2),   lastActionAt: day(-2),   hasOverdueTasks: false, offersCount: 0 },
    { id: 'DL-0002', number: 'СД-2026-0002', title: 'Оптовая поставка СИЗ',                 clientId: 'CL-0008', stage: 'new',          direction: 'Опт',     funnel: 'Основная', responsible: 'USR-005', amount: 210000,  createdAt: day(-1),   lastActionAt: day(-1),   hasOverdueTasks: false, offersCount: 0 },
    { id: 'DL-0003', number: 'СД-2026-0003', title: 'Поставка запчастей для спецтехники',   clientId: 'CL-0014', stage: 'new',          direction: 'Опт',     funnel: 'Основная', responsible: 'USR-006', amount: 320000,  createdAt: day(-3),   lastActionAt: day(-3),   hasOverdueTasks: false, offersCount: 0 },
    { id: 'DL-0004', number: 'СД-2026-0004', title: 'Поставка офисной мебели',              clientId: 'CL-0013', stage: 'qualified',    direction: 'Тендеры', funnel: 'Основная', responsible: 'USR-007', amount: 630000,  createdAt: day(-7),   lastActionAt: day(-4),   hasOverdueTasks: false, offersCount: 0 },
    { id: 'DL-0005', number: 'СД-2026-0005', title: 'Поставка спецодежды',                  clientId: 'CL-0001', stage: 'qualified',    direction: 'Опт',     funnel: 'Основная', responsible: 'USR-003', amount: 215000,  createdAt: day(-8),   lastActionAt: day(-5),   hasOverdueTasks: false, offersCount: 1 },
    { id: 'DL-0006', number: 'СД-2026-0006', title: 'Сервисное обслуживание оборудования',  clientId: 'CL-0006', stage: 'qualified',    direction: 'Розница', funnel: 'Основная', responsible: 'USR-004', amount: 140000,  createdAt: day(-10),  lastActionAt: day(-4),   hasOverdueTasks: true,  offersCount: 1 },
    // stale deals (lastActionAt > 3 days) — 2 required
    { id: 'DL-0007', number: 'СД-2026-0007', title: 'Поставка химических реактивов',        clientId: 'CL-0009', stage: 'qualified',    direction: 'Опт',     funnel: 'Основная', responsible: 'USR-004', amount: 475000,  createdAt: day(-14),  lastActionAt: day(-7),   hasOverdueTasks: false, offersCount: 1 },
    { id: 'DL-0008', number: 'СД-2026-0008', title: 'Поставка кабельной продукции',         clientId: 'CL-0015', stage: 'offer_sent',   direction: 'Опт',     funnel: 'Основная', responsible: 'USR-006', amount: 560000,  createdAt: day(-15),  lastActionAt: day(-5),   hasOverdueTasks: false, offersCount: 2 },
    { id: 'DL-0009', number: 'СД-2026-0009', title: 'Складское оборудование (опт)',          clientId: 'CL-0012', stage: 'offer_sent',   direction: 'Опт',     funnel: 'Основная', responsible: 'USR-003', amount: 780000,  createdAt: day(-12),  lastActionAt: day(-3),   hasOverdueTasks: true,  offersCount: 1 },
    { id: 'DL-0010', number: 'СД-2026-0010', title: 'Поставка холодильного оборудования',   clientId: 'CL-0020', stage: 'offer_sent',   direction: 'Опт',     funnel: 'Основная', responsible: 'USR-004', amount: 1620000, createdAt: day(-18),  lastActionAt: day(-2),   hasOverdueTasks: false, offersCount: 2 },
    // stale deal #2
    { id: 'DL-0011', number: 'СД-2026-0011', title: 'Тендер: медикаменты для поликлиники',  clientId: 'CL-0003', stage: 'offer_sent',   direction: 'Тендеры', funnel: 'Основная', responsible: 'USR-007', amount: 1200000, createdAt: day(-20),  lastActionAt: day(-9),   hasOverdueTasks: false, offersCount: 3 },
    { id: 'DL-0012', number: 'СД-2026-0012', title: 'Поставка строительных материалов',     clientId: 'CL-0005', stage: 'offer_sent',   direction: 'Опт',     funnel: 'Основная', responsible: 'USR-005', amount: 2300000, createdAt: day(-22),  lastActionAt: day(-4),   hasOverdueTasks: false, offersCount: 2 },
    { id: 'DL-0013', number: 'СД-2026-0013', title: 'Поставка насосного оборудования (2)',  clientId: 'CL-0015', stage: 'negotiation',  direction: 'Опт',     funnel: 'Основная', responsible: 'USR-006', amount: 4200000, createdAt: day(-30),  lastActionAt: day(-1),   hasOverdueTasks: false, offersCount: 3 },
    { id: 'DL-0014', number: 'СД-2026-0014', title: 'Оптовая поставка электроматериалов',   clientId: 'CL-0006', stage: 'negotiation',  direction: 'Опт',     funnel: 'Основная', responsible: 'USR-004', amount: 1750000, createdAt: day(-25),  lastActionAt: day(-2),   hasOverdueTasks: false, offersCount: 2 },
    { id: 'DL-0015', number: 'СД-2026-0015', title: 'Поставка агрохимии',                   clientId: 'CL-0008', stage: 'negotiation',  direction: 'Опт',     funnel: 'Основная', responsible: 'USR-005', amount: 980000,  createdAt: day(-28),  lastActionAt: day(-3),   hasOverdueTasks: true,  offersCount: 2 },
    { id: 'DL-0016', number: 'СД-2026-0016', title: 'Поставка медтехники (гос. закупка)',   clientId: 'CL-0007', stage: 'negotiation',  direction: 'Тендеры', funnel: 'Основная', responsible: 'USR-007', amount: 890000,  createdAt: day(-32),  lastActionAt: day(-2),   hasOverdueTasks: false, offersCount: 3 },
    { id: 'DL-0017', number: 'СД-2026-0017', title: 'Поставка продовольственных товаров',   clientId: 'CL-0019', stage: 'negotiation',  direction: 'Тендеры', funnel: 'Основная', responsible: 'USR-007', amount: 3400000, createdAt: day(-35),  lastActionAt: day(-1),   hasOverdueTasks: false, offersCount: 2 },
    { id: 'DL-0018', number: 'СД-2026-0018', title: 'Поставка нефтехимии (контракт)',       clientId: 'CL-0009', stage: 'won',          direction: 'Опт',     funnel: 'Основная', responsible: 'USR-004', amount: 3100000, createdAt: day(-60),  lastActionAt: day(-10),  hasOverdueTasks: false, offersCount: 2 },
    { id: 'DL-0019', number: 'СД-2026-0019', title: 'Поставка газового оборудования',       clientId: 'CL-0015', stage: 'won',          direction: 'Опт',     funnel: 'Основная', responsible: 'USR-006', amount: 2900000, createdAt: day(-55),  lastActionAt: day(-15),  hasOverdueTasks: false, offersCount: 3 },
    { id: 'DL-0020', number: 'СД-2026-0020', title: 'Тендер: обслуживание объектов ГКУ',   clientId: 'CL-0013', stage: 'won',          direction: 'Тендеры', funnel: 'Основная', responsible: 'USR-007', amount: 780000,  createdAt: day(-45),  lastActionAt: day(-20),  hasOverdueTasks: false, offersCount: 1 },
    { id: 'DL-0021', number: 'СД-2026-0021', title: 'Поставка стройматериалов (отказ)',     clientId: 'CL-0005', stage: 'lost',         direction: 'Опт',     funnel: 'Основная', responsible: 'USR-003', amount: 560000,  createdAt: day(-40),  lastActionAt: day(-25),  hasOverdueTasks: false, offersCount: 1 },
    { id: 'DL-0022', number: 'СД-2026-0022', title: 'Поставка канцтоваров (отказ цена)',    clientId: 'CL-0024', stage: 'lost',         direction: 'Розница', funnel: 'Основная', responsible: 'USR-005', amount: 80000,   createdAt: day(-50),  lastActionAt: day(-30),  hasOverdueTasks: false, offersCount: 2 },
  ];

  // ─── DEAL PRODUCTS ────────────────────────────────────────────────────────
  const dealProducts = [
    { id: 'DP-0001', dealId: 'DL-0001', sku: 'NAS-001', name: 'Насос центробежный ЦНС-60',      qty: 2,  unit: 'шт', price: 85000,  sum: 170000 },
    { id: 'DP-0002', dealId: 'DL-0001', sku: 'NAS-002', name: 'Арматура запорная Ду50',          qty: 10, unit: 'шт', price: 4500,   sum: 45000  },
    { id: 'DP-0003', dealId: 'DL-0001', sku: 'MON-001', name: 'Монтажный комплект',              qty: 2,  unit: 'шт', price: 12000,  sum: 24000  },

    { id: 'DP-0004', dealId: 'DL-0002', sku: 'SIZ-001', name: 'Каска строительная',              qty: 50, unit: 'шт', price: 850,    sum: 42500  },
    { id: 'DP-0005', dealId: 'DL-0002', sku: 'SIZ-002', name: 'Перчатки КЩС (пара)',             qty: 200,unit: 'шт', price: 180,    sum: 36000  },
    { id: 'DP-0006', dealId: 'DL-0002', sku: 'SIZ-003', name: 'Жилет сигнальный',               qty: 100,unit: 'шт', price: 350,    sum: 35000  },

    { id: 'DP-0007', dealId: 'DL-0003', sku: 'ZCH-001', name: 'Фильтр гидравлический ФС-250',   qty: 4,  unit: 'шт', price: 18500,  sum: 74000  },
    { id: 'DP-0008', dealId: 'DL-0003', sku: 'ZCH-002', name: 'Цилиндр гидравлический ЦГ-80',  qty: 2,  unit: 'шт', price: 67000,  sum: 134000 },
    { id: 'DP-0009', dealId: 'DL-0003', sku: 'ZCH-003', name: 'Масло гидравлическое ВМГЗ',      qty: 100,unit: 'кг', price: 220,    sum: 22000  },

    { id: 'DP-0010', dealId: 'DL-0004', sku: 'MBL-001', name: 'Стол письменный 1800×900',       qty: 10, unit: 'шт', price: 12500,  sum: 125000 },
    { id: 'DP-0011', dealId: 'DL-0004', sku: 'MBL-002', name: 'Кресло руководителя',            qty: 3,  unit: 'шт', price: 22000,  sum: 66000  },
    { id: 'DP-0012', dealId: 'DL-0004', sku: 'MBL-003', name: 'Тумба подкатная',                qty: 10, unit: 'шт', price: 6800,   sum: 68000  },

    { id: 'DP-0013', dealId: 'DL-0005', sku: 'SPO-001', name: 'Комбинезон рабочий (XL)',        qty: 30, unit: 'шт', price: 1800,   sum: 54000  },
    { id: 'DP-0014', dealId: 'DL-0005', sku: 'SPO-002', name: 'Ботинки защитные (42)',          qty: 30, unit: 'шт', price: 3200,   sum: 96000  },

    { id: 'DP-0015', dealId: 'DL-0006', sku: 'SRV-001', name: 'ТО холодильного агрегата',       qty: 3,  unit: 'шт', price: 18000,  sum: 54000  },
    { id: 'DP-0016', dealId: 'DL-0006', sku: 'SRV-002', name: 'Замена хладагента R134a',        qty: 6,  unit: 'кг', price: 2800,   sum: 16800  },

    { id: 'DP-0017', dealId: 'DL-0007', sku: 'KHM-001', name: 'Реактив аналитический ЧДА',     qty: 20, unit: 'кг', price: 4500,   sum: 90000  },
    { id: 'DP-0018', dealId: 'DL-0007', sku: 'KHM-002', name: 'Кислота серная техническая',    qty: 500,unit: 'кг', price: 48,     sum: 24000  },
    { id: 'DP-0019', dealId: 'DL-0007', sku: 'KHM-003', name: 'Растворитель нефрас С2-80/120', qty: 200,unit: 'кг', price: 95,     sum: 19000  },

    { id: 'DP-0020', dealId: 'DL-0008', sku: 'KBL-001', name: 'Кабель ВВГнг-LS 3×2,5',        qty: 500,unit: 'м',  price: 85,     sum: 42500  },
    { id: 'DP-0021', dealId: 'DL-0008', sku: 'KBL-002', name: 'Кабель ВБбШв 4×35',            qty: 200,unit: 'м',  price: 420,    sum: 84000  },
    { id: 'DP-0022', dealId: 'DL-0008', sku: 'KBL-003', name: 'Гофра ПВХ 20мм',               qty: 1000,unit: 'м', price: 18,     sum: 18000  },

    { id: 'DP-0023', dealId: 'DL-0009', sku: 'SKL-001', name: 'Стеллаж металлический СТ-120',  qty: 20, unit: 'шт', price: 14500,  sum: 290000 },
    { id: 'DP-0024', dealId: 'DL-0009', sku: 'SKL-002', name: 'Паллетный стеллаж ПС-3000',    qty: 10, unit: 'шт', price: 28000,  sum: 280000 },
    { id: 'DP-0025', dealId: 'DL-0009', sku: 'SKL-003', name: 'Ящик архивный пластик.',        qty: 100,unit: 'шт', price: 320,    sum: 32000  },

    { id: 'DP-0026', dealId: 'DL-0010', sku: 'HLD-001', name: 'Витрина холодильная VS-1500',   qty: 5,  unit: 'шт', price: 185000, sum: 925000 },
    { id: 'DP-0027', dealId: 'DL-0010', sku: 'HLD-002', name: 'Морозильный ларь МЛ-300',       qty: 6,  unit: 'шт', price: 52000,  sum: 312000 },
    { id: 'DP-0028', dealId: 'DL-0010', sku: 'HLD-003', name: 'Холодильник медицинский ХМ-80', qty: 2,  unit: 'шт', price: 48000,  sum: 96000  },

    { id: 'DP-0029', dealId: 'DL-0011', sku: 'MED-001', name: 'Антибиотики (упак.)',            qty: 500,unit: 'шт', price: 350,    sum: 175000 },
    { id: 'DP-0030', dealId: 'DL-0011', sku: 'MED-002', name: 'Перевязочный материал',         qty: 200,unit: 'шт', price: 280,    sum: 56000  },
    { id: 'DP-0031', dealId: 'DL-0011', sku: 'MED-003', name: 'Шприцы 10мл (коробка)',         qty: 100,unit: 'шт', price: 480,    sum: 48000  },
    { id: 'DP-0032', dealId: 'DL-0011', sku: 'MED-004', name: 'Инфузионные растворы',          qty: 300,unit: 'шт', price: 190,    sum: 57000  },

    { id: 'DP-0033', dealId: 'DL-0012', sku: 'STR-001', name: 'Цемент М400 (мешок 50 кг)',     qty: 500,unit: 'шт', price: 480,    sum: 240000 },
    { id: 'DP-0034', dealId: 'DL-0012', sku: 'STR-002', name: 'Кирпич рядовой М150',           qty: 10000,unit:'шт',price: 14,     sum: 140000 },
    { id: 'DP-0035', dealId: 'DL-0012', sku: 'STR-003', name: 'Арматура А500С ∅12мм',         qty: 2000,unit: 'кг',price: 75,     sum: 150000 },

    { id: 'DP-0036', dealId: 'DL-0013', sku: 'NAS-010', name: 'Насосная станция ВС-100',       qty: 8,  unit: 'шт', price: 285000, sum: 2280000},
    { id: 'DP-0037', dealId: 'DL-0013', sku: 'NAS-011', name: 'Шкаф управления ШУ-100',        qty: 8,  unit: 'шт', price: 95000,  sum: 760000 },
    { id: 'DP-0038', dealId: 'DL-0013', sku: 'NAS-012', name: 'Монтаж и ПНР (компл.)',         qty: 8,  unit: 'шт', price: 45000,  sum: 360000 },

    { id: 'DP-0039', dealId: 'DL-0014', sku: 'ELM-001', name: 'Автомат защитный ВА88-32',     qty: 50, unit: 'шт', price: 1800,   sum: 90000  },
    { id: 'DP-0040', dealId: 'DL-0014', sku: 'ELM-002', name: 'Электрощит ЩО-90',             qty: 5,  unit: 'шт', price: 42000,  sum: 210000 },
    { id: 'DP-0041', dealId: 'DL-0014', sku: 'ELM-003', name: 'Провод СИП-4 2×16',            qty: 300,unit: 'м',  price: 110,    sum: 33000  },

    { id: 'DP-0042', dealId: 'DL-0015', sku: 'AGR-001', name: 'Гербицид Раундап (канистра)',   qty: 100,unit: 'шт', price: 2800,   sum: 280000 },
    { id: 'DP-0043', dealId: 'DL-0015', sku: 'AGR-002', name: 'Удобрение азотное (мешок)',     qty: 200,unit: 'шт', price: 1450,   sum: 290000 },
    { id: 'DP-0044', dealId: 'DL-0015', sku: 'AGR-003', name: 'Фунгицид Фалькон',             qty: 50, unit: 'шт', price: 3400,   sum: 170000 },

    { id: 'DP-0045', dealId: 'DL-0016', sku: 'MDS-001', name: 'Аппарат УЗИ портативный',      qty: 1,  unit: 'шт', price: 480000, sum: 480000 },
    { id: 'DP-0046', dealId: 'DL-0016', sku: 'MDS-002', name: 'Коагулятор хирургический',     qty: 2,  unit: 'шт', price: 85000,  sum: 170000 },

    { id: 'DP-0047', dealId: 'DL-0017', sku: 'PDV-001', name: 'Крупа гречневая (мешок 50 кг)',qty: 500,unit: 'шт', price: 2200,   sum: 1100000},
    { id: 'DP-0048', dealId: 'DL-0017', sku: 'PDV-002', name: 'Масло подсолнечное (л)',       qty: 2000,unit:'шт', price: 120,    sum: 240000 },
    { id: 'DP-0049', dealId: 'DL-0017', sku: 'PDV-003', name: 'Сахар-песок (мешок 50 кг)',    qty: 400,unit: 'шт', price: 2600,   sum: 1040000},

    { id: 'DP-0050', dealId: 'DL-0018', sku: 'NCH-001', name: 'Нефтяной растворитель НРС-150',qty: 5000,unit:'кг', price: 95,     sum: 475000 },
    { id: 'DP-0051', dealId: 'DL-0018', sku: 'NCH-002', name: 'Масло трансформаторное Т-1500',qty: 2000,unit:'кг', price: 140,    sum: 280000 },
    { id: 'DP-0052', dealId: 'DL-0018', sku: 'NCH-003', name: 'Битум строительный БН 90/10',  qty: 10000,unit:'кг',price: 38,     sum: 380000 },
  ];

  // ─── TASKS ────────────────────────────────────────────────────────────────
  // Exactly 4 overdue
  const tasks = [
    { id: 'TS-0001', title: 'Подготовить КП для ПАО Газснабсервис',         assignee: 'USR-006', creator: 'USR-002', priority: 'high',   status: 'overdue',  deadline: day(-3),  createdAt: day(-10), doneAt: null,      relatedType: 'deal',   relatedId: 'DL-0013', comments: 2 },
    { id: 'TS-0002', title: 'Согласовать договор с ООО НефтехимСнаб',       assignee: 'USR-004', creator: 'USR-002', priority: 'high',   status: 'overdue',  deadline: day(-5),  createdAt: day(-12), doneAt: null,      relatedType: 'deal',   relatedId: 'DL-0007', comments: 4 },
    { id: 'TS-0003', title: 'Выставить счёт ГБУЗ ГКБ №67',                  assignee: 'USR-007', creator: 'USR-001', priority: 'high',   status: 'overdue',  deadline: day(-2),  createdAt: day(-8),  doneAt: null,      relatedType: 'deal',   relatedId: 'DL-0011', comments: 1 },
    { id: 'TS-0004', title: 'Позвонить клиенту ИП Корнилова (follow-up)',   assignee: 'USR-005', creator: 'USR-003', priority: 'normal', status: 'overdue',  deadline: day(-1),  createdAt: day(-5),  doneAt: null,      relatedType: 'client', relatedId: 'CL-0004', comments: 0 },
    { id: 'TS-0005', title: 'Отправить договор АО Стройсервис',             assignee: 'USR-003', creator: 'USR-002', priority: 'high',   status: 'in_work',  deadline: day(1),   createdAt: day(-3),  doneAt: null,      relatedType: 'deal',   relatedId: 'DL-0012', comments: 3 },
    { id: 'TS-0006', title: 'Запросить ТЗ у МКУ Администрация р-на',       assignee: 'USR-007', creator: 'USR-002', priority: 'normal', status: 'in_work',  deadline: day(2),   createdAt: day(-2),  doneAt: null,      relatedType: 'deal',   relatedId: 'DL-0004', comments: 1 },
    { id: 'TS-0007', title: 'Провести замер на объекте ООО ЭкоТранспорт',  assignee: 'USR-005', creator: 'USR-005', priority: 'normal', status: 'in_work',  deadline: day(3),   createdAt: day(-1),  doneAt: null,      relatedType: 'client', relatedId: 'CL-0018', comments: 0 },
    { id: 'TS-0008', title: 'Сформировать спецификацию для ДЛ-0009',        assignee: 'USR-003', creator: 'USR-003', priority: 'normal', status: 'new',      deadline: day(2),   createdAt: day(-1),  doneAt: null,      relatedType: 'deal',   relatedId: 'DL-0009', comments: 0 },
    { id: 'TS-0009', title: 'Подготовить документы к тендеру ZakupKi',      assignee: 'USR-007', creator: 'USR-001', priority: 'high',   status: 'new',      deadline: day(1),   createdAt: day(-2),  doneAt: null,      relatedType: 'tender', relatedId: 'TN-0001', comments: 2 },
    { id: 'TS-0010', title: 'Провести сверку с бухгалтерией ООО Балтэнерго',assignee: 'USR-004', creator: 'USR-002', priority: 'low',    status: 'new',      deadline: day(5),   createdAt: day(-1),  doneAt: null,      relatedType: 'client', relatedId: 'CL-0006', comments: 0 },
    { id: 'TS-0011', title: 'Отправить КП по складскому оборудованию',      assignee: 'USR-003', creator: 'USR-002', priority: 'high',   status: 'review',   deadline: day(1),   createdAt: day(-3),  doneAt: null,      relatedType: 'deal',   relatedId: 'DL-0009', comments: 5 },
    { id: 'TS-0012', title: 'Проверить технические условия по ДЛ-0010',     assignee: 'USR-004', creator: 'USR-004', priority: 'normal', status: 'review',   deadline: day(2),   createdAt: day(-4),  doneAt: null,      relatedType: 'deal',   relatedId: 'DL-0010', comments: 2 },
    { id: 'TS-0013', title: 'Обновить карточку клиента ГКУ ЦЗМ',           assignee: 'USR-007', creator: 'USR-001', priority: 'low',    status: 'in_work',  deadline: day(7),   createdAt: day(-2),  doneAt: null,      relatedType: 'client', relatedId: 'CL-0013', comments: 0 },
    { id: 'TS-0014', title: 'Получить банковскую гарантию для тендера',     assignee: 'USR-007', creator: 'USR-001', priority: 'high',   status: 'in_work',  deadline: hr(36),   createdAt: day(-3),  doneAt: null,      relatedType: 'tender', relatedId: 'TN-0002', comments: 3 },
    { id: 'TS-0015', title: 'Проверить статус оплаты ДЛ-0018',             assignee: 'USR-004', creator: 'USR-002', priority: 'normal', status: 'done',     deadline: day(-5),  createdAt: day(-8),  doneAt: day(-5),   relatedType: 'deal',   relatedId: 'DL-0018', comments: 1 },
    { id: 'TS-0016', title: 'Заключить доп. соглашение с ПАО Газснабсервис',assignee: 'USR-006', creator: 'USR-001', priority: 'high',   status: 'done',     deadline: day(-10), createdAt: day(-15), doneAt: day(-10),  relatedType: 'deal',   relatedId: 'DL-0019', comments: 2 },
    { id: 'TS-0017', title: 'Выслать реквизиты ООО Альфа-Трейд',           assignee: 'USR-005', creator: 'USR-005', priority: 'low',    status: 'done',     deadline: day(-3),  createdAt: day(-6),  doneAt: day(-4),   relatedType: 'client', relatedId: 'CL-0024', comments: 0 },
    { id: 'TS-0018', title: 'Согласовать план-график поставки ДЛ-0017',    assignee: 'USR-007', creator: 'USR-002', priority: 'high',   status: 'in_work',  deadline: day(2),   createdAt: day(-4),  doneAt: null,      relatedType: 'deal',   relatedId: 'DL-0017', comments: 4 },
    { id: 'TS-0019', title: 'Уточнить объёмы заказа у ООО РусХолод',       assignee: 'USR-004', creator: 'USR-004', priority: 'normal', status: 'new',      deadline: day(4),   createdAt: day(-1),  doneAt: null,      relatedType: 'deal',   relatedId: 'DL-0010', comments: 0 },
    { id: 'TS-0020', title: 'Подготовить технический паспорт продукции',   assignee: 'USR-008', creator: 'USR-002', priority: 'normal', status: 'in_work',  deadline: day(5),   createdAt: day(-3),  doneAt: null,      relatedType: null,     relatedId: null,       comments: 1 },
    { id: 'TS-0021', title: 'Запросить сертификаты соответствия',           assignee: 'USR-008', creator: 'USR-003', priority: 'normal', status: 'new',      deadline: day(6),   createdAt: day(-1),  doneAt: null,      relatedType: null,     relatedId: null,       comments: 0 },
    { id: 'TS-0022', title: 'Позвонить в РТС-Тендер по статусу заявки',    assignee: 'USR-007', creator: 'USR-007', priority: 'high',   status: 'in_work',  deadline: hr(20),   createdAt: day(-1),  doneAt: null,      relatedType: 'tender', relatedId: 'TN-0003', comments: 2 },
    { id: 'TS-0023', title: 'Обработать входящий лид с ZakupKi',            assignee: 'USR-003', creator: 'USR-001', priority: 'high',   status: 'new',      deadline: hr(4),    createdAt: min(-47), doneAt: null,      relatedType: null,     relatedId: null,       comments: 0 },
    { id: 'TS-0024', title: 'Подготовить отчёт по воронке продаж за неделю',assignee: 'USR-002', creator: 'USR-001', priority: 'normal', status: 'in_work',  deadline: day(1),   createdAt: day(-2),  doneAt: null,      relatedType: null,     relatedId: null,       comments: 3 },
    { id: 'TS-0025', title: 'Провести встречу с командой по ДЛ-0013',      assignee: 'USR-002', creator: 'USR-001', priority: 'normal', status: 'done',     deadline: day(-1),  createdAt: day(-4),  doneAt: day(-1),   relatedType: 'deal',   relatedId: 'DL-0013', comments: 7 },
    { id: 'TS-0026', title: 'Оплата поставщику (аванс) ДЛ-0019',          assignee: 'USR-008', creator: 'USR-001', priority: 'high',   status: 'done',     deadline: day(-15), createdAt: day(-17), doneAt: day(-15),  relatedType: 'deal',   relatedId: 'DL-0019', comments: 0 },
    { id: 'TS-0027', title: 'Заполнить карточку нового лида LD-0003',       assignee: 'USR-007', creator: 'USR-001', priority: 'high',   status: 'new',      deadline: hr(2),    createdAt: min(-72), doneAt: null,      relatedType: null,     relatedId: null,       comments: 0 },
    { id: 'TS-0028', title: 'Согласовать скидку с директором для ДЛ-0015', assignee: 'USR-002', creator: 'USR-005', priority: 'normal', status: 'review',   deadline: day(1),   createdAt: day(-2),  doneAt: null,      relatedType: 'deal',   relatedId: 'DL-0015', comments: 3 },
    { id: 'TS-0029', title: 'Выгрузить список контактов для рассылки',      assignee: 'USR-003', creator: 'USR-002', priority: 'low',    status: 'in_work',  deadline: day(3),   createdAt: day(-1),  doneAt: null,      relatedType: null,     relatedId: null,       comments: 1 },
    { id: 'TS-0030', title: 'Проверить наличие товара на складе (ДЛ-0012)',assignee: 'USR-008', creator: 'USR-003', priority: 'high',   status: 'in_work',  deadline: hr(12),   createdAt: day(-1),  doneAt: null,      relatedType: 'deal',   relatedId: 'DL-0012', comments: 2 },
    { id: 'TS-0031', title: 'Обновить ценовое предложение для ДЛ-0008',    assignee: 'USR-006', creator: 'USR-002', priority: 'normal', status: 'in_work',  deadline: day(2),   createdAt: day(-2),  doneAt: null,      relatedType: 'deal',   relatedId: 'DL-0008', comments: 1 },
    { id: 'TS-0032', title: 'Проверить документы от ООО ТехноПром',        assignee: 'USR-003', creator: 'USR-003', priority: 'low',    status: 'done',     deadline: day(-20), createdAt: day(-25), doneAt: day(-20),  relatedType: 'client', relatedId: 'CL-0022', comments: 0 },
    { id: 'TS-0033', title: 'Подготовить акт выполненных работ (ДЛ-0020)', assignee: 'USR-007', creator: 'USR-001', priority: 'normal', status: 'done',     deadline: day(-18), createdAt: day(-22), doneAt: day(-18),  relatedType: 'deal',   relatedId: 'DL-0020', comments: 1 },
    { id: 'TS-0034', title: 'Внести данные в реестр тендеров TN-0005',     assignee: 'USR-007', creator: 'USR-007', priority: 'normal', status: 'in_work',  deadline: day(4),   createdAt: day(-2),  doneAt: null,      relatedType: 'tender', relatedId: 'TN-0005', comments: 0 },
    { id: 'TS-0035', title: 'Связаться с логистом по отгрузке ДЛ-0018',   assignee: 'USR-004', creator: 'USR-004', priority: 'normal', status: 'done',     deadline: day(-8),  createdAt: day(-10), doneAt: day(-9),   relatedType: 'deal',   relatedId: 'DL-0018', comments: 2 },
  ];

  // ─── OFFERS ───────────────────────────────────────────────────────────────
  // Distribution: draft=2, sent=4, viewed=3, accepted=2, rejected=1
  const offers = [
    { id: 'KP-0001', number: 'КП-2026-0038', clientId: 'CL-0002', dealId: 'DL-0003',  manager: 'USR-004', amount: 320000,  vatIncluded: true,  status: 'draft',    createdAt: day(-1),   sentAt: null,      viewedAt: null,     validUntil: day(29),  version: 1 },
    { id: 'KP-0002', number: 'КП-2026-0039', clientId: 'CL-0012', dealId: 'DL-0009',  manager: 'USR-003', amount: 780000,  vatIncluded: true,  status: 'draft',    createdAt: day(-2),   sentAt: null,      viewedAt: null,     validUntil: day(28),  version: 1 },
    { id: 'KP-0003', number: 'КП-2026-0040', clientId: 'CL-0001', dealId: 'DL-0005',  manager: 'USR-003', amount: 215000,  vatIncluded: false, status: 'sent',     createdAt: day(-5),   sentAt: day(-4),   viewedAt: null,     validUntil: day(26),  version: 1 },
    { id: 'KP-0004', number: 'КП-2026-0041', clientId: 'CL-0020', dealId: 'DL-0010',  manager: 'USR-004', amount: 1620000, vatIncluded: true,  status: 'sent',     createdAt: day(-7),   sentAt: day(-6),   viewedAt: null,     validUntil: day(24),  version: 2 },
    { id: 'KP-0005', number: 'КП-2026-0042', clientId: 'CL-0015', dealId: 'DL-0008',  manager: 'USR-006', amount: 560000,  vatIncluded: true,  status: 'sent',     createdAt: day(-10),  sentAt: day(-9),   viewedAt: null,     validUntil: day(21),  version: 1 },
    { id: 'KP-0006', number: 'КП-2026-0043', clientId: 'CL-0005', dealId: 'DL-0012',  manager: 'USR-005', amount: 2300000, vatIncluded: true,  status: 'sent',     createdAt: day(-12),  sentAt: day(-11),  viewedAt: null,     validUntil: day(19),  version: 2 },
    { id: 'KP-0007', number: 'КП-2026-0044', clientId: 'CL-0009', dealId: 'DL-0007',  manager: 'USR-004', amount: 475000,  vatIncluded: false, status: 'viewed',   createdAt: day(-14),  sentAt: day(-13),  viewedAt: day(-10), validUntil: day(17),  version: 1 },
    { id: 'KP-0008', number: 'КП-2026-0045', clientId: 'CL-0006', dealId: 'DL-0014',  manager: 'USR-004', amount: 1750000, vatIncluded: true,  status: 'viewed',   createdAt: day(-16),  sentAt: day(-15),  viewedAt: day(-12), validUntil: day(15),  version: 3 },
    { id: 'KP-0009', number: 'КП-2026-0046', clientId: 'CL-0008', dealId: 'DL-0015',  manager: 'USR-005', amount: 980000,  vatIncluded: true,  status: 'viewed',   createdAt: day(-18),  sentAt: day(-17),  viewedAt: day(-14), validUntil: day(13),  version: 2 },
    { id: 'KP-0010', number: 'КП-2026-0047', clientId: 'CL-0009', dealId: 'DL-0018',  manager: 'USR-004', amount: 3100000, vatIncluded: true,  status: 'accepted', createdAt: day(-62),  sentAt: day(-61),  viewedAt: day(-58), validUntil: day(-32), version: 2 },
    { id: 'KP-0011', number: 'КП-2026-0048', clientId: 'CL-0015', dealId: 'DL-0019',  manager: 'USR-006', amount: 2900000, vatIncluded: true,  status: 'accepted', createdAt: day(-57),  sentAt: day(-56),  viewedAt: day(-53), validUntil: day(-27), version: 3 },
    { id: 'KP-0012', number: 'КП-2026-0049', clientId: 'CL-0005', dealId: 'DL-0021',  manager: 'USR-003', amount: 560000,  vatIncluded: false, status: 'rejected', createdAt: day(-42),  sentAt: day(-41),  viewedAt: day(-39), validUntil: day(-12), version: 1 },
  ];

  // ─── TENDERS ──────────────────────────────────────────────────────────────
  // At least 2 not in won/lost with deadlineSubmit within next 48h
  const tenders = [
    { id: 'TN-0001', title: 'Поставка медицинских расходных материалов',        platform: 'ZakupKi',       customer: 'ГБУЗ ГКБ №67',                 region: 'г. Москва',           nmcAmount: 1200000, deadlineSubmit: hr(18),   deadlineExecution: day(60),  manager: 'USR-007', status: 'preparing',  lots: 2 },
    { id: 'TN-0002', title: 'Поставка оборудования для учебного класса',         platform: 'РТС-Тендер',    customer: 'МБОУ СОШ №15 г. Тулы',         region: 'Тульская обл.',       nmcAmount: 350000,  deadlineSubmit: hr(40),   deadlineExecution: day(45),  manager: 'USR-007', status: 'preparing',  lots: 1 },
    { id: 'TN-0003', title: 'Техническое обслуживание инженерных систем',        platform: 'РТС-Тендер',    customer: 'ГКУ Центр занятости Москвы',    region: 'г. Москва',           nmcAmount: 780000,  deadlineSubmit: day(5),   deadlineExecution: day(180), manager: 'USR-007', status: 'submitted',  lots: 3 },
    { id: 'TN-0004', title: 'Поставка продовольственных товаров (гос. контракт)',platform: 'Сбербанк-АСТ',  customer: 'ФГУП НИИ Технологий',           region: 'г. Москва',           nmcAmount: 3400000, deadlineSubmit: day(12),  deadlineExecution: day(90),  manager: 'USR-007', status: 'searching',  lots: 5 },
    { id: 'TN-0005', title: 'Обслуживание спортивных объектов',                  platform: 'ZakupKi',       customer: 'ГАУ Спортивная школа №3',       region: 'г. Москва',           nmcAmount: 480000,  deadlineSubmit: day(8),   deadlineExecution: day(120), manager: 'USR-007', status: 'searching',  lots: 1 },
    { id: 'TN-0006', title: 'Поставка мебели для административных помещений',    platform: 'Сбербанк-АСТ',  customer: 'МКУ Администрация Центрального р-на', region: 'г. Казань',    nmcAmount: 630000,  deadlineSubmit: day(-5),  deadlineExecution: day(30),  manager: 'USR-007', status: 'won',        lots: 2 },
  ];

  // ─── MESSAGES ─────────────────────────────────────────────────────────────
  const messages = [
    { id: 'MSG-001', clientId: 'CL-0015', dealId: 'DL-0013', channel: 'telegram',  direction: 'in',  author: 'Горбунов Алексей Сергеевич',   text: 'Добрый день! Когда можем ожидать финальное КП по насосным станциям? Нам нужно закрыть бюджет до конца месяца.',        sentAt: min(-15)  },
    { id: 'MSG-002', clientId: 'CL-0015', dealId: 'DL-0013', channel: 'telegram',  direction: 'out', author: 'USR-006',                       text: 'Алексей Сергеевич, добрый день! Подготовим КП сегодня до 18:00, вышлю на почту и сюда в Telegram.',                     sentAt: min(-12)  },
    { id: 'MSG-003', clientId: 'CL-0003', dealId: 'DL-0011', channel: 'email',     direction: 'in',  author: 'Тарасова Ирина Сергеевна',      text: 'Здравствуйте! Направляем техническое задание на поставку медикаментов, пожалуйста подтвердите получение.',               sentAt: hr(-3)    },
    { id: 'MSG-004', clientId: 'CL-0003', dealId: 'DL-0011', channel: 'email',     direction: 'out', author: 'USR-007',                       text: 'Ирина Сергеевна, добрый день! ТЗ получили, изучаем. Ответим в течение 2 рабочих дней.',                                  sentAt: hr(-2)    },
    { id: 'MSG-005', clientId: 'CL-0009', dealId: 'DL-0018', channel: 'email',     direction: 'out', author: 'USR-004',                       text: 'Направляем закрывающие документы по контракту СД-2026-0018: акт, счёт-фактура, УПД. Просим подписать и вернуть.',      sentAt: hr(-5)    },
    { id: 'MSG-006', clientId: 'CL-0008', dealId: 'DL-0015', channel: 'whatsapp',  direction: 'in',  author: 'Рябов Николай Фёдорович',       text: 'Андрей, привет! Скидка в 5% согласована директором, можете готовить договор.',                                         sentAt: hr(-6)    },
    { id: 'MSG-007', clientId: 'CL-0008', dealId: 'DL-0015', channel: 'whatsapp',  direction: 'out', author: 'USR-005',                       text: 'Николай Фёдорович, отлично! Договор подготовим завтра утром, вышлю на согласование.',                                    sentAt: hr(-6)    },
    { id: 'MSG-008', clientId: 'CL-0006', dealId: 'DL-0014', channel: 'telegram',  direction: 'in',  author: 'Савельев Денис Константинович', text: 'Илья, проверили ваше КП — всё устраивает. Можем ли мы обсудить условия рассрочки платежа?',                             sentAt: hr(-8)    },
    { id: 'MSG-009', clientId: 'CL-0006', dealId: null,      channel: 'internal',  direction: 'out', author: 'USR-004',                       text: 'Дмитрий, клиент ООО Балтэнерго спрашивает про рассрочку — как мы обычно даём? Можем 30/70?',                             sentAt: hr(-8)    },
    { id: 'MSG-010', clientId: 'CL-0001', dealId: 'DL-0005', channel: 'email',     direction: 'in',  author: 'Борисов Игорь Михайлович',      text: 'Уважаемые коллеги, просим рассмотреть возможность увеличения объёма партии спецодежды на 20 единиц.',                   sentAt: hr(-10)   },
    { id: 'MSG-011', clientId: 'CL-0005', dealId: 'DL-0012', channel: 'email',     direction: 'out', author: 'USR-003',                       text: 'Михаил Олегович, направляем обновлённую спецификацию по стройматериалам с учётом актуальных цен поставщика.',           sentAt: hr(-12)   },
    { id: 'MSG-012', clientId: 'CL-0013', dealId: null,      channel: 'telegram',  direction: 'in',  author: 'Никитин Борис Олегович',        text: 'Добрый день! Уточните пожалуйста статус нашего тендерного предложения по техническому обслуживанию.',                     sentAt: day(-1)   },
    { id: 'MSG-013', clientId: 'CL-0014', dealId: 'DL-0003', channel: 'whatsapp',  direction: 'out', author: 'USR-006',                       text: 'Светлана Анатольевна, добрый день! Напоминаю — ждём вашего решения по запчастям, предложение действует до пятницы.',     sentAt: day(-1)   },
    { id: 'MSG-014', clientId: 'CL-0019', dealId: 'DL-0017', channel: 'email',     direction: 'in',  author: 'Егорова Ксения Борисовна',      text: 'Пришлите, пожалуйста, заверенные копии сертификатов качества на всю продуктовую группу по государственному контракту.',  sentAt: day(-2)   },
    { id: 'MSG-015', clientId: 'CL-0007', dealId: 'DL-0016', channel: 'email',     direction: 'out', author: 'USR-007',                       text: 'Артём Дмитриевич, направляем финальный проект контракта на медицинское оборудование. Просим рассмотреть в течение 3 дней.', sentAt: day(-2) },
  ];

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────────
  const notifications = [
    { id: 'NTF-001', type: 'lead.created',        title: 'Новый лид с сайта',                     body: 'Получен новый лид «Поставка насосного оборудования» — требует обработки.',          createdAt: min(-25), readAt: null,     severity: 'warning' },
    { id: 'NTF-002', type: 'lead.created',        title: 'Новый лид из Telegram-бота',            body: 'Получен запрос на оптовую поставку СИЗ от ИП Дроздов А.В. — без ответственного.', createdAt: min(-47), readAt: null,     severity: 'warning' },
    { id: 'NTF-003', type: 'task.overdue',        title: 'Просроченная задача',                   body: 'Задача «Согласовать договор с ООО НефтехимСнаб» просрочена на 5 дней.',             createdAt: day(-5),  readAt: null,     severity: 'danger'  },
    { id: 'NTF-004', type: 'offer.viewed',        title: 'КП просмотрено клиентом',               body: 'Клиент ООО НефтехимСнаб открыл коммерческое предложение КП-2026-0044.',            createdAt: day(-10), readAt: day(-9),  severity: 'info'    },
    { id: 'NTF-005', type: 'deal.stage_changed',  title: 'Сделка перешла на следующий этап',      body: 'Сделка СД-2026-0018 «Поставка нефтехимии» переведена в статус «Выигран».',         createdAt: day(-10), readAt: day(-10), severity: 'success' },
    { id: 'NTF-006', type: 'tender.deadline_near',title: 'Срок подачи тендера истекает',          body: 'Тендер TN-0001 «Медрасходники ГБУЗ ГКБ №67» — срок подачи через 18 часов!',       createdAt: hr(-2),   readAt: null,     severity: 'danger'  },
    { id: 'NTF-007', type: 'message.received',    title: 'Новое сообщение от клиента',            body: 'Горбунов Алексей (ПАО Газснабсервис) написал в Telegram про финальное КП.',        createdAt: min(-15), readAt: null,     severity: 'info'    },
    { id: 'NTF-008', type: 'offer.sent',          title: 'КП отправлено клиенту',                 body: 'Коммерческое предложение КП-2026-0043 отправлено клиенту АО Стройсервис.',         createdAt: day(-11), readAt: day(-11), severity: 'success' },
  ];

  // ─── WORK SESSIONS ────────────────────────────────────────────────────────
  // ~40 rows: 8 users × ~5 weekdays, today rows with null logoutAt for ~6 users
  const workSessions = (function () {
    const rows = [];
    let idx = 1;
    const userIds = ['USR-001','USR-002','USR-003','USR-004','USR-005','USR-006','USR-007','USR-008'];

    // Helper: find last N weekdays (including today if weekday)
    function lastWeekdays(n) {
      const days = [];
      let cursor = new Date(now);
      while (days.length < n) {
        const dow = cursor.getDay();
        if (dow !== 0 && dow !== 6) days.push(new Date(cursor));
        cursor.setDate(cursor.getDate() - 1);
      }
      return days;
    }

    const weekdays = lastWeekdays(7);
    const todayStr = weekdays[0].toISOString().slice(0, 10);

    const onlineUsers = new Set(['USR-001','USR-002','USR-003','USR-004','USR-005','USR-006']);

    // Login/logout minute variants per user index (0-7)
    const loginMins   = [0, 15, 30, 0, 15, 30, 0, 15];
    const logoutMins  = [0, 30, 0, 45, 15, 0, 30, 0];

    for (const wd of weekdays) {
      const dateStr = wd.toISOString().slice(0, 10);
      const isToday = dateStr === todayStr;

      for (let ui = 0; ui < userIds.length; ui++) {
        const uid = userIds[ui];
        // Alternate login 08/09 and logout 17/18 by user index and day-of-month
        const dayNum   = parseInt(dateStr.slice(8), 10);
        const loginHour  = 8  + ((ui + dayNum) % 2);  // 8 or 9
        const logoutHour = 17 + ((ui + dayNum + 1) % 2); // 17 or 18
        const lmin = loginMins[ui];
        const omin = logoutMins[ui];

        const loginAt = new Date(dateStr + 'T' + String(loginHour).padStart(2,'0') + ':' + String(lmin).padStart(2,'0') + ':00');

        const isOnlineToday = isToday && onlineUsers.has(uid);
        let logoutAt = null;
        let hoursWorked;

        if (!isOnlineToday) {
          const lo = new Date(dateStr + 'T' + String(logoutHour).padStart(2,'0') + ':' + String(omin).padStart(2,'0') + ':00');
          logoutAt = lo.toISOString();
          hoursWorked = parseFloat(((lo.getTime() - loginAt.getTime()) / 3600000).toFixed(1));
        } else {
          hoursWorked = parseFloat(((now - loginAt.getTime()) / 3600000).toFixed(1));
        }

        rows.push({
          id: 'WS-' + String(idx).padStart(4, '0'),
          userId: uid,
          date: dateStr,
          loginAt: loginAt.toISOString(),
          logoutAt,
          hoursWorked,
          tasksDone:    1 + ((ui + dayNum) % 5),
          tasksOverdue: (idx % 7 === 0) ? 1 : 0,
          offersSent:   (idx % 5 === 0) ? 1 : 0,
          activeDeals:  3 + (ui % 4),
        });
        idx++;
      }
    }
    return rows;
  }());

  // ─── ACTIVITY FUNCTION ────────────────────────────────────────────────────
  function activity(entityType, entityId) {
    const kinds = ['note','status_change','call','email','task_created','offer_sent'];
    const actors = ['USR-003','USR-004','USR-005','USR-006','USR-007','USR-002'];
    const texts = {
      note:          ['Добавлена заметка: клиент подтвердил интерес к предложению.', 'Примечание: требуется дополнительное согласование с юристом.', 'Внутренняя пометка: клиент просил перезвонить в среду.'],
      status_change: ['Статус изменён на «В работе».', 'Сделка переведена на этап «КП отправлено».', 'Статус сделки обновлён на «Переговоры».'],
      call:          ['Проведён звонок с клиентом, обсудили условия поставки.', 'Исходящий звонок — клиент подтвердил получение КП.', 'Входящий звонок: клиент запросил корректировку спецификации.'],
      email:         ['Отправлено письмо с коммерческим предложением.', 'Получен ответ от клиента с вопросами по договору.', 'Выслана уточнённая спецификация по запросу клиента.'],
      task_created:  ['Создана задача «Согласовать условия оплаты».', 'Поставлена задача на подготовку документов.', 'Создана задача «Провести встречу с руководством клиента».'],
      offer_sent:    ['Направлено КП клиенту на сумму 450 000 руб.', 'Выслано обновлённое КП с учётом замечаний.', 'КП отправлено на согласование со стороны клиента.'],
    };

    // Simple deterministic hash from id string
    let h = 0;
    const seed = entityType + entityId;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
    if (h < 0) h = -h;

    const entries = [];
    for (let i = 0; i < 8; i++) {
      const kind = kinds[(h + i * 7) % kinds.length];
      const actor = actors[(h + i * 3) % actors.length];
      const textArr = texts[kind];
      const text = textArr[(h + i) % textArr.length];
      const daysAgo = (i + 1) * 2 + ((h + i) % 3);
      entries.push({
        id:    entityType + '-act-' + (i + 1),
        at:    day(-daysAgo),
        actor,
        kind,
        text,
      });
    }
    return entries;
  }

  // ─── EXPORT ───────────────────────────────────────────────────────────────
  window.MOCK = {
    users,
    clients,
    contacts,
    leads,
    deals,
    dealProducts,
    tasks,
    offers,
    tenders,
    messages,
    notifications,
    workSessions,
    activity,
  };
}());
