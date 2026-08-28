import type { RiskZone, HazardType, ThreatLevel, DataFreshness, Survey, DocRef } from '../types';
import { blob, seeded, hashCode, isoDays, pick } from './_util';

interface ZoneSpec {
  id: string;
  name: string;
  hazard: HazardType;
  level: ThreatLevel;
  terr: string;
  settlement: string;
  lon: number;
  lat: number;
  rx: number;
  ry: number;
  area: number;
  pop: number;
  hh: number;
  source: string;
  owner: string;
  fresh: DataFreshness;
  actualDays: number;   // сколько дней назад подтверждены данные
  desc: string;
  mon: string;
  status?: 'approved' | 'draft' | 'review';
}

/* ВНИМАНИЕ: все сведения ниже — демонстрационные. */

const specs: ZoneSpec[] = [
  {
    id: 'Z-SZK-001', name: 'Оползневой склон «Кара-Ункур-3»', hazard: 'landslide', level: 4,
    terr: 'suzak', settlement: 'с. Кара-Алма', lon: 73.42, lat: 40.79, rx: 0.045, ry: 0.03,
    area: 214, pop: 1840, hh: 372, source: 'Инженерно-геологическое обследование № 41/2026',
    owner: 'УМЧС по Джалал-Абадской области', fresh: 'actual', actualDays: 12,
    desc: 'Активный блоковый оползень на правом борту долины Кара-Ункур. Смещение головной части 0,9 м за сезон, у подошвы — жилая застройка нижней террасы.',
    mon: 'Реперная сеть 8 точек, обход раз в 10 суток, автоматический инклинометр КУ-2.',
  },
  {
    id: 'Z-SZK-002', name: 'Селевой водосбор Кёк-Арт', hazard: 'mudflow', level: 4,
    terr: 'suzak', settlement: 'с. Барпы', lon: 73.18, lat: 40.72, rx: 0.06, ry: 0.028,
    area: 386, pop: 3120, hh: 640, source: 'Паспорт селеопасного участка КА-07',
    owner: 'УМЧС по Джалал-Абадской области', fresh: 'actual', actualDays: 5,
    desc: 'Водосбор площадью 38,6 км² с высокой водосборной ёмкостью. Конус выноса перекрывает подъездную дорогу к трём населённым пунктам.',
    mon: 'Метеостанция MS-04, датчик уровня в створе моста, визуальный контроль в паводковый период.',
  },
  {
    id: 'Z-SZK-003', name: 'Пойма р. Кара-Дарья, участок Сузак', hazard: 'flood', level: 3,
    terr: 'suzak', settlement: 'с. Сузак', lon: 72.96, lat: 40.87, rx: 0.075, ry: 0.022,
    area: 512, pop: 5760, hh: 1180, source: 'Гидрологический паспорт створа КД-11',
    owner: 'Кыргызгидромет', fresh: 'aging', actualDays: 96,
    desc: 'Затапливаемая пойма при расходе выше 640 м³/с. Защита — левобережная дамба Д-04, износ 46 %.',
    mon: 'Гидропост КД-11, передача данных каждые 3 часа.',
  },
  {
    id: 'Z-SZK-004', name: 'Подтопление низовий Сафед-Булан', hazard: 'flood', level: 2,
    terr: 'suzak', settlement: 'с. Сафед-Булан', lon: 73.62, lat: 40.7, rx: 0.04, ry: 0.02,
    area: 168, pop: 940, hh: 205, source: 'Обследование айыл окмоту, акт от 14.05.2026',
    owner: 'Айыл окмоту Сузакского района', fresh: 'actual', actualDays: 31,
    desc: 'Подтопление приусадебных участков грунтовыми водами в период интенсивного орошения.',
    mon: 'Замеры уровня в 4 наблюдательных скважинах, раз в декаду.',
  },
  {
    id: 'Z-SZK-005', name: 'Оползень «Ак-Терек», верхняя ступень', hazard: 'landslide', level: 3,
    terr: 'suzak', settlement: 'с. Ак-Терек', lon: 73.3, lat: 40.66, rx: 0.032, ry: 0.024,
    area: 96, pop: 620, hh: 128, source: 'Инженерно-геологическое обследование № 18/2025',
    owner: 'УМЧС по Джалал-Абадской области', fresh: 'aging', actualDays: 141,
    desc: 'Медленный оползень-поток, скорость смещения 0,2 м/год. Угроза автодороге местного значения.',
    mon: 'Реперная сеть 5 точек, обход раз в месяц.',
  },
  {
    id: 'Z-SZK-006', name: 'Камнепадный участок трассы Сузак — Кара-Алма', hazard: 'rockfall', level: 3,
    terr: 'suzak', settlement: 'участок 14–19 км', lon: 73.24, lat: 40.76, rx: 0.05, ry: 0.012,
    area: 42, pop: 0, hh: 0, source: 'Акт обследования Кыргызавтожол № 7-Д',
    owner: 'Кыргызавтожол', fresh: 'actual', actualDays: 22,
    desc: 'Скальный откос высотой до 40 м с выветрелыми блоками. Три схода за последние 18 месяцев.',
    mon: 'Визуальный осмотр дорожной службой два раза в месяц.',
  },
  {
    id: 'Z-MLS-001', name: 'Хвостохранилище № 3', hazard: 'tailings', level: 5,
    terr: 'mailuu-suu', settlement: 'г. Майлуу-Суу', lon: 72.452, lat: 41.288, rx: 0.016, ry: 0.011,
    area: 34, pop: 4200, hh: 890, source: 'Государственный реестр объектов хвостового хозяйства',
    owner: 'Госэкотехинспекция', fresh: 'actual', actualDays: 8,
    desc: 'Хвостохранилище на левом борту долины. Оползневой массив выше по склону создаёт риск разрушения ограждающей дамбы и выноса материала в русло.',
    mon: 'Датчики смещения дамбы, отбор проб воды раз в месяц, круглосуточная охрана.',
  },
  {
    id: 'Z-MLS-002', name: 'Оползень «Тектоник», нависающий массив', hazard: 'landslide', level: 5,
    terr: 'mailuu-suu', settlement: 'г. Майлуу-Суу', lon: 72.478, lat: 41.311, rx: 0.019, ry: 0.014,
    area: 58, pop: 2650, hh: 540, source: 'Инженерно-геологическое обследование № 3/2026',
    owner: 'УМЧС по Джалал-Абадской области', fresh: 'actual', actualDays: 3,
    desc: 'Массив объёмом около 1,2 млн м³ над жилым кварталом и участком русла. При сходе возможно перекрытие реки с образованием подпрудного озера.',
    mon: 'Автоматический мониторинг смещений (4 датчика), передача данных каждый час.',
  },
  {
    id: 'Z-MLS-003', name: 'Русло р. Майлуу-Суу, городской участок', hazard: 'flood', level: 4,
    terr: 'mailuu-suu', settlement: 'г. Майлуу-Суу', lon: 72.465, lat: 41.32, rx: 0.03, ry: 0.009,
    area: 76, pop: 3400, hh: 720, source: 'Гидрологический паспорт створа МС-02',
    owner: 'Кыргызгидромет', fresh: 'actual', actualDays: 14,
    desc: 'Стеснённое русло в черте города, берегоукрепление на 60 % длины участка отсутствует.',
    mon: 'Гидропост МС-02, автоматическая передача уровня каждый час.',
  },
  {
    id: 'Z-BKG-001', name: 'Селевой конус Арсланбоб', hazard: 'mudflow', level: 4,
    terr: 'bazar-korgon', settlement: 'с. Арсланбоб', lon: 72.945, lat: 41.335, rx: 0.038, ry: 0.026,
    area: 224, pop: 2980, hh: 610, source: 'Паспорт селеопасного участка АБ-02',
    owner: 'УМЧС по Джалал-Абадской области', fresh: 'actual', actualDays: 19,
    desc: 'Конус выноса с уклоном 9°, застройка в средней части конуса. Селелоток СЛ-06 пропускает 60 % расчётного расхода.',
    mon: 'Метеостанция MS-02, датчик уровня, дежурный наблюдатель в паводковый период.',
  },
  {
    id: 'Z-BKG-002', name: 'Оползневой участок «Кызыл-Ункур»', hazard: 'landslide', level: 3,
    terr: 'bazar-korgon', settlement: 'с. Кызыл-Ункур', lon: 73.08, lat: 41.28, rx: 0.034, ry: 0.024,
    area: 132, pop: 1140, hh: 246, source: 'Инженерно-геологическое обследование № 22/2025',
    owner: 'УМЧС по Джалал-Абадской области', fresh: 'aging', actualDays: 118,
    desc: 'Оползень-оплывина по контакту суглинков и коренных пород, активизируется после длительных дождей.',
    mon: 'Реперная сеть 6 точек, обход раз в две недели.',
  },
  {
    id: 'Z-BKG-003', name: 'Пойма р. Кара-Ункур у Базар-Коргона', hazard: 'flood', level: 3,
    terr: 'bazar-korgon', settlement: 'с. Базар-Коргон', lon: 72.755, lat: 41.038, rx: 0.055, ry: 0.018,
    area: 298, pop: 4120, hh: 860, source: 'Гидрологический паспорт створа КУ-05',
    owner: 'Кыргызгидромет', fresh: 'actual', actualDays: 27,
    desc: 'Пойменные земли и приусадебные участки, затапливаемые при расходе выше 210 м³/с.',
    mon: 'Гидропост КУ-05, передача каждые 3 часа.',
  },
  {
    id: 'Z-BKG-004', name: 'Сейсмоопасный участок Базар-Коргонского разлома', hazard: 'seismic', level: 3,
    terr: 'bazar-korgon', settlement: 'с. Базар-Коргон', lon: 72.86, lat: 41.13, rx: 0.09, ry: 0.03,
    area: 940, pop: 18600, hh: 3900, source: 'Карта сейсмического районирования, лист K-42',
    owner: 'Институт сейсмологии НАН КР', fresh: 'aging', actualDays: 210,
    desc: 'Полоса вдоль активного разлома, расчётная интенсивность 8 баллов. Значительная часть жилого фонда — саманные постройки.',
    mon: 'Сейсмостанция сети НАН КР, паспортизация зданий по графику.',
  },
  {
    id: 'Z-NKN-001', name: 'Подтопление Массы — Шайдан', hazard: 'flood', level: 3,
    terr: 'nooken', settlement: 'с. Массы', lon: 72.585, lat: 41.005, rx: 0.05, ry: 0.02,
    area: 276, pop: 3480, hh: 730, source: 'Обследование районной администрации, акт 09/2026',
    owner: 'Ноокенская районная администрация', fresh: 'actual', actualDays: 24,
    desc: 'Подъём грунтовых вод в результате фильтрации из оросительной сети, подтопление подвалов и фундаментов.',
    mon: 'Сеть из 9 наблюдательных скважин, замеры раз в декаду.',
  },
  {
    id: 'Z-NKN-002', name: 'Оползень «Сакалды»', hazard: 'landslide', level: 4,
    terr: 'nooken', settlement: 'с. Сакалды', lon: 72.39, lat: 41.16, rx: 0.03, ry: 0.022,
    area: 118, pop: 1360, hh: 288, source: 'Инженерно-геологическое обследование № 12/2026',
    owner: 'УМЧС по Джалал-Абадской области', fresh: 'actual', actualDays: 16,
    desc: 'Оползневой цирк с двумя ступенями срыва. В зоне возможного смещения — 34 жилых дома.',
    mon: 'Реперная сеть 7 точек, обход раз в 10 суток.',
  },
  {
    id: 'Z-NKN-003', name: 'Селевой водосбор Шамалды-Сай', hazard: 'mudflow', level: 3,
    terr: 'nooken', settlement: 'пгт Шамалды-Сай', lon: 72.29, lat: 41.2, rx: 0.036, ry: 0.02,
    area: 164, pop: 1720, hh: 366, source: 'Паспорт селеопасного участка ШС-01',
    owner: 'УМЧС по Джалал-Абадской области', fresh: 'overdue', actualDays: 402,
    desc: 'Водосбор с крутыми бортами, накопление рыхлообломочного материала в русле выше посёлка.',
    mon: 'Обследование не проводилось с прошлого сезона, данные требуют подтверждения.',
    status: 'review',
  },
  {
    id: 'Z-AKS-001', name: 'Оползневой массив «Кербен-Север»', hazard: 'landslide', level: 3,
    terr: 'aksy', settlement: 'г. Кербен', lon: 71.79, lat: 41.51, rx: 0.036, ry: 0.026,
    area: 152, pop: 980, hh: 214, source: 'Инженерно-геологическое обследование № 27/2025',
    owner: 'УМЧС по Джалал-Абадской области', fresh: 'aging', actualDays: 132,
    desc: 'Склон крутизной 22° с признаками активизации: трещины отрыва длиной до 70 м.',
    mon: 'Реперная сеть 5 точек, обход раз в месяц.',
  },
  {
    id: 'Z-AKS-002', name: 'Пойма р. Кассан-Сай', hazard: 'flood', level: 3,
    terr: 'aksy', settlement: 'с. Кызыл-Туу', lon: 71.95, lat: 41.29, rx: 0.06, ry: 0.018,
    area: 244, pop: 2140, hh: 452, source: 'Гидрологический паспорт створа КС-03',
    owner: 'Кыргызгидромет', fresh: 'actual', actualDays: 29,
    desc: 'Паводковая пойма ниже Кассан-Сайского водохранилища, риск при аварийных сбросах.',
    mon: 'Гидропост КС-03, согласование режима сбросов с эксплуатирующей организацией.',
  },
  {
    id: 'Z-AKS-003', name: 'Лавиноопасный участок перевала Чапчыма', hazard: 'avalanche', level: 4,
    terr: 'aksy', settlement: 'участок 41–48 км', lon: 71.63, lat: 41.62, rx: 0.045, ry: 0.016,
    area: 88, pop: 0, hh: 0, source: 'Паспорт лавиноопасного участка ЧП-02',
    owner: 'Кыргызавтожол', fresh: 'actual', actualDays: 18,
    desc: 'Семь лавиносборов над участком дороги. Расчётный объём наибольшего 120 тыс. м³.',
    mon: 'Снегомерная съёмка в зимний период, оценка лавинной опасности раз в 5 суток.',
  },
  {
    id: 'Z-ALB-001', name: 'Селевой водосбор Ала-Бука', hazard: 'mudflow', level: 3,
    terr: 'ala-buka', settlement: 'с. Ала-Бука', lon: 71.42, lat: 41.4, rx: 0.042, ry: 0.024,
    area: 198, pop: 1580, hh: 342, source: 'Паспорт селеопасного участка АЛ-04',
    owner: 'УМЧС по Джалал-Абадской области', fresh: 'aging', actualDays: 152,
    desc: 'Селевой водосбор с преобладанием дождевого питания, сход возможен при осадках выше 30 мм за 12 ч.',
    mon: 'Метеопост, визуальный контроль в паводковый период.',
  },
  {
    id: 'Z-ALB-002', name: 'Оползневой склон «Кёк-Серек»', hazard: 'landslide', level: 2,
    terr: 'ala-buka', settlement: 'с. Кёк-Серек', lon: 71.19, lat: 41.31, rx: 0.03, ry: 0.02,
    area: 84, pop: 460, hh: 98, source: 'Обследование айыл окмоту, акт от 02.04.2026',
    owner: 'Айыл окмоту Ала-Букинского района', fresh: 'actual', actualDays: 44,
    desc: 'Стабилизировавшийся оползень, возможна активизация при переувлажнении.',
    mon: 'Визуальный осмотр раз в квартал.',
  },
  {
    id: 'Z-TKG-001', name: 'Нижний бьеф Токтогульской ГЭС', hazard: 'flood', level: 4,
    terr: 'toktogul', settlement: 'г. Кара-Куль', lon: 72.71, lat: 41.6, rx: 0.05, ry: 0.02,
    area: 312, pop: 6400, hh: 1350, source: 'Регламент взаимодействия с эксплуатирующей организацией',
    owner: 'ОАО «Электрические станции»', fresh: 'actual', actualDays: 11,
    desc: 'Зона возможного затопления при аварийных попусках. Расчётное время добегания волны до жилой застройки — 38 минут.',
    mon: 'Данные о режиме работы ГЭС, автоматический контроль уровня в нижнем бьефе.',
  },
  {
    id: 'Z-TKG-002', name: 'Лавиноопасный участок перевала Ала-Бель', hazard: 'avalanche', level: 4,
    terr: 'toktogul', settlement: 'участок 168–181 км', lon: 72.55, lat: 42.05, rx: 0.07, ry: 0.02,
    area: 186, pop: 0, hh: 0, source: 'Паспорт лавиноопасного участка АБ-11',
    owner: 'Кыргызавтожол', fresh: 'actual', actualDays: 7,
    desc: 'Двенадцать лавиносборов над трассой Бишкек — Ош. Ежегодно фиксируется от 4 до 9 сходов.',
    mon: 'Снеголавинная станция, оценка опасности ежесуточно в зимний период.',
  },
  {
    id: 'Z-TKG-003', name: 'Оползневой борт Токтогульского водохранилища', hazard: 'landslide', level: 3,
    terr: 'toktogul', settlement: 'с. Кетмен-Тёбё', lon: 73.05, lat: 41.83, rx: 0.055, ry: 0.026,
    area: 268, pop: 720, hh: 164, source: 'Инженерно-геологическое обследование № 9/2025',
    owner: 'УМЧС по Джалал-Абадской области', fresh: 'aging', actualDays: 168,
    desc: 'Переработка берега при сработке водохранилища, отступание бровки до 1,5 м в год.',
    mon: 'Съёмка бровки раз в полугодие.',
  },
  {
    id: 'Z-TKG-004', name: 'Сейсмоопасный узел Токтогул', hazard: 'seismic', level: 4,
    terr: 'toktogul', settlement: 'г. Токтогул', lon: 72.94, lat: 41.87, rx: 0.08, ry: 0.035,
    area: 810, pop: 21400, hh: 4600, source: 'Карта сейсмического районирования, лист K-43',
    owner: 'Институт сейсмологии НАН КР', fresh: 'actual', actualDays: 62,
    desc: 'Расчётная интенсивность 9 баллов, вблизи крупного гидротехнического сооружения.',
    mon: 'Сейсмостанция «Токтогул», непрерывная регистрация.',
  },
  {
    id: 'Z-CHT-001', name: 'Лавиноопасный участок Чаткальской долины', hazard: 'avalanche', level: 3,
    terr: 'chatkal', settlement: 'с. Каныш-Кыя', lon: 71.55, lat: 41.86, rx: 0.06, ry: 0.024,
    area: 214, pop: 380, hh: 84, source: 'Паспорт лавиноопасного участка ЧТ-03',
    owner: 'УМЧС по Джалал-Абадской области', fresh: 'aging', actualDays: 176,
    desc: 'Лавинные очаги над единственной дорогой в долину. При сходе — изоляция населённых пунктов.',
    mon: 'Снегомерная съёмка, связь с айыл окмоту.',
  },
  {
    id: 'Z-CHT-002', name: 'Селевой водосбор Терек-Сай', hazard: 'mudflow', level: 3,
    terr: 'chatkal', settlement: 'пгт Терек-Сай', lon: 71.32, lat: 41.72, rx: 0.038, ry: 0.022,
    area: 148, pop: 640, hh: 142, source: 'Паспорт селеопасного участка ТС-01',
    owner: 'УМЧС по Джалал-Абадской области', fresh: 'overdue', actualDays: 468,
    desc: 'Водосбор с горнорудными отвалами в верхней части, повышенное содержание твёрдой фазы.',
    mon: 'Данные устарели, требуется повторное обследование.',
    status: 'review',
  },
  {
    id: 'Z-TGT-001', name: 'Пойма р. Нарын у Казармана', hazard: 'flood', level: 2,
    terr: 'toguz-toro', settlement: 'с. Казарман', lon: 74.05, lat: 41.4, rx: 0.06, ry: 0.018,
    area: 224, pop: 1240, hh: 268, source: 'Гидрологический паспорт створа НР-08',
    owner: 'Кыргызгидромет', fresh: 'actual', actualDays: 36,
    desc: 'Затопление пойменных сенокосов и части приусадебных участков в период половодья.',
    mon: 'Гидропост НР-08, передача каждые 6 часов.',
  },
  {
    id: 'Z-JLB-001', name: 'Оползневой склон «Аюб-Тоо»', hazard: 'landslide', level: 3,
    terr: 'jalal-abad', settlement: 'г. Джалал-Абад', lon: 73.028, lat: 40.958, rx: 0.022, ry: 0.016,
    area: 74, pop: 2240, hh: 470, source: 'Инженерно-геологическое обследование № 31/2026',
    owner: 'Мэрия г. Джалал-Абад', fresh: 'actual', actualDays: 21,
    desc: 'Склон над жилым массивом, подрезан при индивидуальной застройке. Дренаж отсутствует.',
    mon: 'Реперная сеть 4 точки, обход раз в две недели.',
  },
  {
    id: 'Z-JLB-002', name: 'Ливневое подтопление центра города', hazard: 'flood', level: 3,
    terr: 'jalal-abad', settlement: 'г. Джалал-Абад', lon: 72.99, lat: 40.928, rx: 0.03, ry: 0.014,
    area: 118, pop: 8600, hh: 1820, source: 'Обследование МП «Тазалык», акт 06/2026',
    owner: 'Мэрия г. Джалал-Абад', fresh: 'actual', actualDays: 33,
    desc: 'Ливневая канализация рассчитана на осадки 18 мм/ч, фактические ливни превышают норму.',
    mon: 'Контроль пропускной способности коллекторов перед сезоном дождей.',
  },
  {
    id: 'Z-KKJ-001', name: 'Провалы горных выработок Кок-Жангак', hazard: 'landslide', level: 4,
    terr: 'kok-jangak', settlement: 'г. Кок-Жангак', lon: 73.2, lat: 40.94, rx: 0.024, ry: 0.017,
    area: 96, pop: 1480, hh: 320, source: 'Реестр отработанных горных выработок',
    owner: 'Госгортехнадзор', fresh: 'aging', actualDays: 124,
    desc: 'Деформации земной поверхности над отработанными угольными выработками, зафиксировано 11 провалов.',
    mon: 'Нивелирование по профилям раз в полугодие.',
  },
];

const inspectors = [
  'Абдырахманов Т.', 'Осмонова Г.', 'Жусупов К.', 'Мамытова А.', 'Турдубаев Н.', 'Сатыбалдиев Э.',
];
const surveyResults = [
  'Активизация не выявлена, параметры в пределах прошлого замера',
  'Зафиксировано смещение реперов, требуется учащённый контроль',
  'Появились новые трещины отрыва, уровень угрозы подтверждён',
  'Состояние стабильное, рекомендован плановый контроль',
  'Отмечено переувлажнение грунта, рекомендовано устройство дренажа',
];

function buildSurveys(spec: ZoneSpec): Survey[] {
  const rnd = seeded(hashCode(spec.id + 's'));
  const n = 2 + Math.floor(rnd() * 3);
  const out: Survey[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      date: isoDays(-(spec.actualDays + i * (60 + Math.floor(rnd() * 90)))),
      org: spec.owner,
      result: pick(surveyResults, rnd),
      inspector: pick(inspectors, rnd),
    });
  }
  return out;
}

function buildDocs(spec: ZoneSpec): DocRef[] {
  const rnd = seeded(hashCode(spec.id + 'd'));
  const base: DocRef[] = [
    {
      id: `${spec.id}-DOC-1`,
      title: `Паспорт зоны риска ${spec.id}`,
      kind: 'act',
      date: isoDays(-spec.actualDays),
      size_kb: 180 + Math.floor(rnd() * 900),
      access: 'internal',
    },
    {
      id: `${spec.id}-DOC-2`,
      title: 'Картографическая схема границ участка',
      kind: 'map',
      date: isoDays(-spec.actualDays - 4),
      size_kb: 900 + Math.floor(rnd() * 3200),
      access: 'internal',
    },
  ];
  if (spec.level >= 4) {
    base.push({
      id: `${spec.id}-DOC-3`,
      title: 'Протокол заседания комиссии по ЧС',
      kind: 'protocol',
      date: isoDays(-Math.floor(spec.actualDays / 2)),
      size_kb: 120 + Math.floor(rnd() * 300),
      access: 'restricted',
    });
  }
  base.push({
    id: `${spec.id}-DOC-4`,
    title: 'Фотофиксация участка',
    kind: 'photo',
    date: isoDays(-spec.actualDays + 1),
    size_kb: 1400 + Math.floor(rnd() * 4600),
    access: 'internal',
  });
  return base;
}

export const zones: RiskZone[] = specs.map((s) => ({
  id: s.id,
  name: s.name,
  hazard: s.hazard,
  level: s.level,
  territory: s.terr,
  settlement: s.settlement,
  geometry: blob(s.lon, s.lat, s.rx, s.ry, s.id),
  centroid: [s.lon, s.lat],
  area_ha: s.area,
  population_at_risk: s.pop,
  households: s.hh,
  source: s.source,
  owner: s.owner,
  version: `v${1 + (hashCode(s.id) % 4)}.${hashCode(s.id) % 9}`,
  actual_at: isoDays(-s.actualDays),
  freshness: s.fresh,
  status: s.status ?? 'approved',
  surveys: buildSurveys(s),
  docs: buildDocs(s),
  description: s.desc,
  monitoring: s.mon,
  structures: [],
}));

export const zoneById = (id: string) => zones.find((z) => z.id === id);
