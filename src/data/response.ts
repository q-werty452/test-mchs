import type { ResourceUnit, EvacuationRoute, Shelter, Facility, ResourceKind, FacilityKind, ResourceState } from '../types';

interface R { id: string; name: string; kind: ResourceKind; terr: string; base: string; lon: number; lat: number; p: number; v: number; st: ResourceState; rd: number; cmd: string; }

const r: R[] = [
  { id: 'RU-01', name: 'ПСЧ-1 Джалал-Абад', kind: 'fire', terr: 'jalal-abad', base: 'ул. Ленина, 2', lon: 72.995, lat: 40.936, p: 42, v: 7, st: 'ready', rd: 4, cmd: 'м-р Токтосунов А.' },
  { id: 'RU-02', name: 'ПСЧ-4 Сузак', kind: 'fire', terr: 'suzak', base: 'с. Сузак', lon: 72.965, lat: 40.884, p: 28, v: 5, st: 'deployed', rd: 5, cmd: 'к-н Жээнбеков Р.' },
  { id: 'RU-03', name: 'АСО «Кара-Ункур»', kind: 'rescue', terr: 'suzak', base: 'с. Барпы', lon: 73.15, lat: 40.73, p: 24, v: 4, st: 'deployed', rd: 8, cmd: 'к-н Абдиев М.' },
  { id: 'RU-04', name: 'Инженерная группа ИГ-2', kind: 'engineering', terr: 'suzak', base: 'с. Сузак', lon: 72.97, lat: 40.878, p: 16, v: 6, st: 'deployed', rd: 22, cmd: 'ст. л-т Орозов Б.' },
  { id: 'RU-05', name: 'Бригада ЦСМ Сузак', kind: 'medical', terr: 'suzak', base: 'ЦСМ, с. Сузак', lon: 72.958, lat: 40.89, p: 12, v: 3, st: 'ready', rd: 7, cmd: 'Асанова Ч.' },
  { id: 'RU-06', name: 'Наряд ОВД Сузакского района', kind: 'police', terr: 'suzak', base: 'РОВД, с. Сузак', lon: 72.962, lat: 40.881, p: 18, v: 5, st: 'deployed', rd: 6, cmd: 'м-р Сыдыков К.' },
  { id: 'RU-07', name: 'ПСЧ-7 Базар-Коргон', kind: 'fire', terr: 'bazar-korgon', base: 'с. Базар-Коргон', lon: 72.752, lat: 41.041, p: 26, v: 4, st: 'ready', rd: 5, cmd: 'к-н Мурзаев Т.' },
  { id: 'RU-08', name: 'АСО «Арсланбоб»', kind: 'rescue', terr: 'bazar-korgon', base: 'с. Арсланбоб', lon: 72.943, lat: 41.331, p: 18, v: 3, st: 'ready', rd: 9, cmd: 'ст. л-т Кадыров Э.' },
  { id: 'RU-09', name: 'ПСЧ-9 Майлуу-Суу', kind: 'fire', terr: 'mailuu-suu', base: 'г. Майлуу-Суу', lon: 72.463, lat: 41.306, p: 22, v: 4, st: 'ready', rd: 4, cmd: 'к-н Исаков Н.' },
  { id: 'RU-10', name: 'АСО «Майлуу-Суу»', kind: 'rescue', terr: 'mailuu-suu', base: 'г. Майлуу-Суу', lon: 72.471, lat: 41.297, p: 20, v: 3, st: 'ready', rd: 6, cmd: 'м-р Бакиров Д.' },
  { id: 'RU-11', name: 'ПСЧ-12 Массы', kind: 'fire', terr: 'nooken', base: 'с. Массы', lon: 72.598, lat: 41.008, p: 24, v: 4, st: 'ready', rd: 6, cmd: 'к-н Эргешов А.' },
  { id: 'RU-12', name: 'Инженерная группа ИГ-5', kind: 'engineering', terr: 'nooken', base: 'пгт Шамалды-Сай', lon: 72.29, lat: 41.199, p: 14, v: 5, st: 'maintenance', rd: 45, cmd: 'ст. л-т Сарыбаев У.' },
  { id: 'RU-13', name: 'ПСЧ-15 Кербен', kind: 'fire', terr: 'aksy', base: 'г. Кербен', lon: 71.784, lat: 41.487, p: 20, v: 3, st: 'ready', rd: 7, cmd: 'к-н Асанбеков Ж.' },
  { id: 'RU-14', name: 'ПСЧ-18 Токтогул', kind: 'fire', terr: 'toktogul', base: 'г. Токтогул', lon: 72.938, lat: 41.874, p: 22, v: 4, st: 'ready', rd: 5, cmd: 'к-н Осмонов С.' },
  { id: 'RU-15', name: 'АСО «Ала-Бель»', kind: 'rescue', terr: 'toktogul', base: 'перевал Ала-Бель', lon: 72.56, lat: 42.04, p: 16, v: 4, st: 'ready', rd: 12, cmd: 'ст. л-т Бекболотов И.' },
  { id: 'RU-16', name: 'ПСЧ-21 Кара-Куль', kind: 'fire', terr: 'kara-kul', base: 'г. Кара-Куль', lon: 72.671, lat: 41.62, p: 18, v: 3, st: 'ready', rd: 4, cmd: 'к-н Дуйшенов А.' },
  { id: 'RU-17', name: 'Наряд ОВД г. Джалал-Абад', kind: 'police', terr: 'jalal-abad', base: 'ГОВД', lon: 73.002, lat: 40.932, p: 34, v: 8, st: 'ready', rd: 5, cmd: 'п-к Аскаров М.' },
  { id: 'RU-18', name: 'Бригада ОБЛ. больницы', kind: 'medical', terr: 'jalal-abad', base: 'Областная больница', lon: 72.988, lat: 40.945, p: 26, v: 6, st: 'ready', rd: 8, cmd: 'Нурланова Ж.' },
];

export const resources: ResourceUnit[] = r.map((x) => ({
  id: x.id, name: x.name, kind: x.kind, territory: x.terr, base: x.base,
  coords: [x.lon, x.lat], personnel: x.p, vehicles: x.v, state: x.st,
  readiness_min: x.rd, commander: x.cmd,
}));

export const shelters: Shelter[] = [
  { id: 'SH-01', name: 'ПВР «Школа № 4»', territory: 'suzak', coords: [72.972, 40.892], capacity: 320, occupied: 148, facilities: ['Отопление', 'Питание', 'Медпункт', 'Резервное питание'], responsible: 'Абдырахманова С.', phone: '+996 3722 5-14-08' },
  { id: 'SH-02', name: 'ПВР «Дом культуры Барпы»', territory: 'suzak', coords: [73.161, 40.744], capacity: 180, occupied: 96, facilities: ['Отопление', 'Питание'], responsible: 'Турдубаев К.', phone: '+996 3722 5-22-31' },
  { id: 'SH-03', name: 'ПВР «Спорткомплекс Кара-Алма»', territory: 'suzak', coords: [73.398, 40.808], capacity: 240, occupied: 0, facilities: ['Отопление', 'Медпункт'], responsible: 'Сатыбалдиев Э.', phone: '+996 3722 5-40-17' },
  { id: 'SH-04', name: 'ПВР «Школа № 1 Арсланбоб»', territory: 'bazar-korgon', coords: [72.951, 41.338], capacity: 260, occupied: 0, facilities: ['Отопление', 'Питание', 'Медпункт'], responsible: 'Кадырова Н.', phone: '+996 3736 4-11-52' },
  { id: 'SH-05', name: 'ПВР «Гимназия Майлуу-Суу»', territory: 'mailuu-suu', coords: [72.459, 41.313], capacity: 400, occupied: 0, facilities: ['Отопление', 'Питание', 'Медпункт', 'Резервное питание', 'Связь'], responsible: 'Исакова Г.', phone: '+996 3744 3-08-26' },
  { id: 'SH-06', name: 'ПВР «Дом культуры Массы»', territory: 'nooken', coords: [72.591, 41.012], capacity: 220, occupied: 0, facilities: ['Отопление', 'Питание'], responsible: 'Эргешов А.', phone: '+996 3734 2-19-44' },
];

export const routes: EvacuationRoute[] = [
  {
    id: 'ER-01', name: 'Барпы → ПВР «Дом культуры Барпы»', from_zone: 'Z-SZK-002', to_shelter: 'SH-02',
    path: [[73.186, 40.722], [73.178, 40.729], [73.171, 40.736], [73.165, 40.741], [73.161, 40.744]],
    length_km: 3.4, capacity_per_h: 900, condition: 'open', note: 'Основной маршрут, асфальт, освещение частичное.',
  },
  {
    id: 'ER-02', name: 'Барпы → ПВР «Школа № 4» (резервный)', from_zone: 'Z-SZK-002', to_shelter: 'SH-01',
    path: [[73.186, 40.722], [73.14, 40.74], [73.09, 40.77], [73.04, 40.83], [73.0, 40.868], [72.972, 40.892]],
    length_km: 24.8, capacity_per_h: 1400, condition: 'limited', note: 'Резервный маршрут. Мост на 9 км ограничен по нагрузке 12 т.',
  },
  {
    id: 'ER-03', name: 'Кара-Алма → ПВР «Спорткомплекс»', from_zone: 'Z-SZK-001', to_shelter: 'SH-03',
    path: [[73.424, 40.788], [73.416, 40.794], [73.408, 40.801], [73.398, 40.808]],
    length_km: 4.1, capacity_per_h: 700, condition: 'open', note: 'Подъездная дорога проходит вне контура оползня.',
  },
  {
    id: 'ER-04', name: 'Арсланбоб → ПВР «Школа № 1»', from_zone: 'Z-BKG-001', to_shelter: 'SH-04',
    path: [[72.938, 41.329], [72.943, 41.332], [72.948, 41.335], [72.951, 41.338]],
    length_km: 1.9, capacity_per_h: 1100, condition: 'open', note: 'Маршрут пересекает селелоток СЛ-06 по мосту.',
  },
  {
    id: 'ER-05', name: 'Майлуу-Суу, кварталы 3–5 → ПВР «Гимназия»', from_zone: 'Z-MLS-002', to_shelter: 'SH-05',
    path: [[72.478, 41.311], [72.472, 41.313], [72.466, 41.313], [72.459, 41.313]],
    length_km: 2.2, capacity_per_h: 1600, condition: 'open', note: 'Маршрут выведен из-под нависающего массива.',
  },
  {
    id: 'ER-06', name: 'Сакалды → ПВР «Дом культуры Массы»', from_zone: 'Z-NKN-002', to_shelter: 'SH-06',
    path: [[72.391, 41.158], [72.44, 41.12], [72.51, 41.07], [72.56, 41.03], [72.591, 41.012]],
    length_km: 21.3, capacity_per_h: 800, condition: 'open', note: 'Единственный маршрут, объезд отсутствует.',
  },
];

interface F { id: string; name: string; kind: FacilityKind; terr: string; lon: number; lat: number; cap: number; zone: string | null; resp: string; phone: string; }

const f: F[] = [
  { id: 'FC-01', name: 'Средняя школа № 12 им. Барпы', kind: 'school', terr: 'suzak', lon: 73.168, lat: 40.727, cap: 640, zone: 'Z-SZK-002', resp: 'Мамытова А.', phone: '+996 3722 5-33-19' },
  { id: 'FC-02', name: 'Детский сад «Умут»', kind: 'kindergarten', terr: 'suzak', lon: 73.174, lat: 40.731, cap: 120, zone: 'Z-SZK-002', resp: 'Осмонова Г.', phone: '+996 3722 5-33-42' },
  { id: 'FC-03', name: 'ЦСМ Сузакского района, филиал Барпы', kind: 'hospital', terr: 'suzak', lon: 73.163, lat: 40.735, cap: 45, zone: 'Z-SZK-002', resp: 'Асанова Ч.', phone: '+996 3722 5-30-71' },
  { id: 'FC-04', name: 'Средняя школа № 3 Кара-Алма', kind: 'school', terr: 'suzak', lon: 73.418, lat: 40.792, cap: 380, zone: 'Z-SZK-001', resp: 'Жусупов К.', phone: '+996 3722 5-41-02' },
  { id: 'FC-05', name: 'Водозабор «Кара-Ункур»', kind: 'water', terr: 'suzak', lon: 73.405, lat: 40.784, cap: 0, zone: 'Z-SZK-001', resp: 'МП «Сузак-Водоканал»', phone: '+996 3722 5-18-60' },
  { id: 'FC-06', name: 'Средняя школа № 1 Арсланбоб', kind: 'school', terr: 'bazar-korgon', lon: 72.951, lat: 41.338, cap: 720, zone: 'Z-BKG-001', resp: 'Кадырова Н.', phone: '+996 3736 4-11-52' },
  { id: 'FC-07', name: 'Котельная центрального квартала', kind: 'boiler', terr: 'mailuu-suu', lon: 72.468, lat: 41.315, cap: 0, zone: 'Z-MLS-003', resp: 'МП «Майлуу-Суу-Жылуулук»', phone: '+996 3744 3-12-04' },
  { id: 'FC-08', name: 'Городская больница Майлуу-Суу', kind: 'hospital', terr: 'mailuu-suu', lon: 72.474, lat: 41.309, cap: 180, zone: 'Z-MLS-002', resp: 'Бакирова Э.', phone: '+996 3744 3-05-18' },
  { id: 'FC-09', name: 'Средняя школа № 2 Сакалды', kind: 'school', terr: 'nooken', lon: 72.393, lat: 41.161, cap: 420, zone: 'Z-NKN-002', resp: 'Турдубаев Н.', phone: '+996 3734 2-24-90' },
  { id: 'FC-10', name: 'Айыл окмоту Сузакского района', kind: 'admin', terr: 'suzak', lon: 72.964, lat: 40.886, cap: 0, zone: null, resp: 'Сыдыков К.', phone: '+996 3722 5-10-00' },
  { id: 'FC-11', name: 'Средняя школа № 8 Шамалды-Сай', kind: 'school', terr: 'nooken', lon: 72.292, lat: 41.198, cap: 510, zone: 'Z-NKN-003', resp: 'Сарыбаева А.', phone: '+996 3734 2-31-15' },
  { id: 'FC-12', name: 'Водозабор Базар-Коргон', kind: 'water', terr: 'bazar-korgon', lon: 72.759, lat: 41.036, cap: 0, zone: 'Z-BKG-003', resp: 'МП «Водоканал»', phone: '+996 3736 4-08-33' },
];

export const facilities: Facility[] = f.map((x) => ({
  id: x.id, name: x.name, kind: x.kind, territory: x.terr,
  coords: [x.lon, x.lat], capacity: x.cap, in_zone: x.zone,
  responsible: x.resp, phone: x.phone,
}));
