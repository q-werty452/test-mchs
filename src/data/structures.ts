import type { ProtectiveStructure, StructureKind, StructureCondition } from '../types';
import { isoDays } from './_util';

interface S {
  id: string; name: string; kind: StructureKind; terr: string;
  lon: number; lat: number; year: number;
  len?: number; h?: number; cap?: number;
  cond: StructureCondition; wear: number;
  repair: number | null; insp: number; owner: string;
  protects: string[]; note: string;
}

const s: S[] = [
  { id: 'ST-004', name: 'Левобережная дамба Кара-Дарья Д-04', kind: 'dam', terr: 'suzak', lon: 72.94, lat: 40.866, year: 1987, len: 4200, h: 4.5, cap: 720, cond: 'satisfactory', wear: 46, repair: -640, insp: 40, owner: 'УМЧС по Джалал-Абадской области', protects: ['Z-SZK-003'], note: 'На участке 1,2–1,8 км отмечена фильтрация через тело дамбы.' },
  { id: 'ST-006', name: 'Селелоток Арсланбоб СЛ-06', kind: 'chute', terr: 'bazar-korgon', lon: 72.947, lat: 41.328, year: 1994, len: 1850, cap: 42, cond: 'limited', wear: 68, repair: -1180, insp: 12, owner: 'УМЧС по Джалал-Абадской области', protects: ['Z-BKG-001'], note: 'Пропускная способность снижена до 60 % расчётной из-за заиления нижней части.' },
  { id: 'ST-011', name: 'Селезадерживающий барьер Кёк-Арт Б-11', kind: 'barrier', terr: 'suzak', lon: 73.2, lat: 40.735, year: 2016, len: 180, h: 6, cap: 60, cond: 'good', wear: 18, repair: -410, insp: 74, owner: 'УМЧС по Джалал-Абадской области', protects: ['Z-SZK-002'], note: 'Накопительная ёмкость заполнена на 35 %, требуется очистка до начала сезона.' },
  { id: 'ST-014', name: 'Берегоукрепление р. Майлуу-Суу, участок 2', kind: 'wall', terr: 'mailuu-suu', lon: 72.466, lat: 41.318, year: 2009, len: 940, h: 3.2, cond: 'satisfactory', wear: 51, repair: -820, insp: 28, owner: 'Мэрия г. Майлуу-Суу', protects: ['Z-MLS-003'], note: 'Габионные конструкции, локальные просадки на 3 участках.' },
  { id: 'ST-017', name: 'Ограждающая дамба хвостохранилища № 3', kind: 'dam', terr: 'mailuu-suu', lon: 72.4505, lat: 41.2868, year: 1966, len: 320, h: 12, cond: 'limited', wear: 74, repair: -1540, insp: 5, owner: 'Госэкотехинспекция', protects: ['Z-MLS-001'], note: 'Объект особого контроля. Датчики смещения выведены на пульт круглосуточно.' },
  { id: 'ST-021', name: 'Отводной канал Массы К-21', kind: 'channel', terr: 'nooken', lon: 72.592, lat: 41.001, year: 1978, len: 6400, cap: 28, cond: 'satisfactory', wear: 57, repair: -520, insp: 51, owner: 'Ноокенская районная администрация', protects: ['Z-NKN-001'], note: 'Требуется очистка от наносов на участке 3–4 км.' },
  { id: 'ST-023', name: 'Дренажная система Сакалды', kind: 'channel', terr: 'nooken', lon: 72.394, lat: 41.157, year: 2019, len: 1200, cap: 6, cond: 'good', wear: 12, repair: null, insp: 96, owner: 'УМЧС по Джалал-Абадской области', protects: ['Z-NKN-002'], note: 'Введена в эксплуатацию в 2019 году, работает штатно.' },
  { id: 'ST-026', name: 'Противолавинная галерея Ала-Бель Г-26', kind: 'wall', terr: 'toktogul', lon: 72.556, lat: 42.048, year: 2004, len: 460, h: 7, cond: 'satisfactory', wear: 44, repair: -930, insp: 62, owner: 'Кыргызавтожол', protects: ['Z-TKG-002'], note: 'Перекрывает 3 из 12 лавиносборов участка.' },
  { id: 'ST-028', name: 'Дамба нижнего бьефа Кара-Куль Д-28', kind: 'dam', terr: 'kara-kul', lon: 72.7, lat: 41.603, year: 1982, len: 2800, h: 5.5, cap: 1100, cond: 'satisfactory', wear: 49, repair: -710, insp: 33, owner: 'ОАО «Электрические станции»', protects: ['Z-TKG-001'], note: 'Совместная эксплуатация с гидроэнергетической организацией.' },
  { id: 'ST-031', name: 'Подпорная стена Аюб-Тоо', kind: 'wall', terr: 'jalal-abad', lon: 73.03, lat: 40.955, year: 2013, len: 260, h: 4, cond: 'limited', wear: 62, repair: -880, insp: 16, owner: 'Мэрия г. Джалал-Абад', protects: ['Z-JLB-001'], note: 'Наклон верхней секции 4°, наблюдение усилено.' },
  { id: 'ST-034', name: 'Ливневый коллектор Джалал-Абад ЛК-34', kind: 'channel', terr: 'jalal-abad', lon: 72.993, lat: 40.93, year: 1975, len: 3800, cap: 9, cond: 'limited', wear: 71, repair: -1290, insp: 21, owner: 'МП «Тазалык»', protects: ['Z-JLB-002'], note: 'Проектная нагрузка ниже фактической интенсивности ливней.' },
  { id: 'ST-037', name: 'Насосная станция Сафед-Булан НС-37', kind: 'pumping', terr: 'suzak', lon: 73.615, lat: 40.703, year: 2011, cap: 3, cond: 'good', wear: 24, repair: -300, insp: 88, owner: 'Айыл окмоту Сузакского района', protects: ['Z-SZK-004'], note: 'Два насосных агрегата, резервное питание от дизель-генератора.' },
  { id: 'ST-040', name: 'Селелоток Шамалды-Сай СЛ-40', kind: 'chute', terr: 'nooken', lon: 72.295, lat: 41.196, year: 1989, len: 1100, cap: 24, cond: 'critical', wear: 86, repair: -2100, insp: -14, owner: 'УМЧС по Джалал-Абадской области', protects: ['Z-NKN-003'], note: 'Разрушение бетонного лотка на участке 400–650 м. Требуется капитальный ремонт.' },
  { id: 'ST-043', name: 'Дамба Кассан-Сай Д-43', kind: 'dam', terr: 'aksy', lon: 71.955, lat: 41.294, year: 1991, len: 1900, h: 3.8, cap: 340, cond: 'satisfactory', wear: 53, repair: -760, insp: 45, owner: 'УМЧС по Джалал-Абадской области', protects: ['Z-AKS-002'], note: 'Гребень дамбы требует подсыпки на участке 0,4–0,9 км.' },
  { id: 'ST-046', name: 'Противолавинные щиты Чапчыма', kind: 'barrier', terr: 'aksy', lon: 71.628, lat: 41.618, year: 2018, len: 640, h: 3.5, cond: 'good', wear: 15, repair: null, insp: 102, owner: 'Кыргызавтожол', protects: ['Z-AKS-003'], note: 'Снегоудерживающие щиты в зоне зарождения 4 лавиносборов.' },
  { id: 'ST-049', name: 'Отводной канал Ала-Бука К-49', kind: 'channel', terr: 'ala-buka', lon: 71.425, lat: 41.395, year: 1983, len: 2400, cap: 14, cond: 'satisfactory', wear: 58, repair: -670, insp: 37, owner: 'Ала-Букинская районная администрация', protects: ['Z-ALB-001'], note: 'Заиление в нижней части канала до 25 % сечения.' },
  { id: 'ST-052', name: 'Берегоукрепление Базар-Коргон БУ-52', kind: 'wall', terr: 'bazar-korgon', lon: 72.758, lat: 41.034, year: 2007, len: 1600, h: 2.8, cond: 'satisfactory', wear: 48, repair: -890, insp: 41, owner: 'Базар-Коргонская районная администрация', protects: ['Z-BKG-003'], note: 'Габионы, участок 0,8–1,1 км требует восстановления.' },
  { id: 'ST-055', name: 'Селезадерживающая плотина Терек-Сай П-55', kind: 'dam', terr: 'chatkal', lon: 71.325, lat: 41.715, year: 1996, len: 140, h: 8, cap: 45, cond: 'limited', wear: 69, repair: -1420, insp: 9, owner: 'УМЧС по Джалал-Абадской области', protects: ['Z-CHT-002'], note: 'Накопительная ёмкость заполнена на 78 %, требуется расчистка.' },
  { id: 'ST-058', name: 'Дренаж провалов Кок-Жангак ДР-58', kind: 'channel', terr: 'kok-jangak', lon: 73.203, lat: 40.941, year: 2015, len: 800, cap: 4, cond: 'satisfactory', wear: 38, repair: -450, insp: 58, owner: 'Мэрия г. Кок-Жангак', protects: ['Z-KKJ-001'], note: 'Отвод поверхностного стока от зон деформации.' },
  { id: 'ST-061', name: 'Подпорная стена Кербен-Север СТ-61', kind: 'wall', terr: 'aksy', lon: 71.792, lat: 41.507, year: 2010, len: 340, h: 3.6, cond: 'satisfactory', wear: 55, repair: -940, insp: 26, owner: 'УМЧС по Джалал-Абадской области', protects: ['Z-AKS-001'], note: 'Дренажные отверстия частично забиты, требуется прочистка.' },
  { id: 'ST-064', name: 'Каскад запруд Кара-Ункур З-64', kind: 'barrier', terr: 'suzak', lon: 73.41, lat: 40.795, year: 2021, len: 220, h: 4, cap: 30, cond: 'good', wear: 9, repair: null, insp: 110, owner: 'УМЧС по Джалал-Абадской области', protects: ['Z-SZK-001'], note: 'Три ступени запруд у подошвы оползневого склона.' },
];

export const structures: ProtectiveStructure[] = s.map((x) => ({
  id: x.id,
  name: x.name,
  kind: x.kind,
  territory: x.terr,
  coords: [x.lon, x.lat],
  built_year: x.year,
  length_m: x.len,
  height_m: x.h,
  capacity_m3s: x.cap,
  condition: x.cond,
  wear_pct: x.wear,
  last_repair: x.repair === null ? null : isoDays(x.repair),
  next_inspection: isoDays(x.insp),
  owner: x.owner,
  protects: x.protects,
  note: x.note,
}));

export const structureById = (id: string) => structures.find((x) => x.id === id);
