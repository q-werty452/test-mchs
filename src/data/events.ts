import type { EmergencyEvent, HazardType, ThreatLevel, EventStatus, EventAction, TimelineEntry } from '../types';
import { iso, isoDays } from './_util';

/* --- Активное событие: сквозной сценарий демонстрации --- */

const activeActions: EventAction[] = [
  { id: 'A-01', title: 'Выставить наблюдательный пост в створе моста', assignee: 'к-н Абдиев М.', org: 'АСО «Кара-Ункур»', due: iso(-9), status: 'done', completed_at: iso(-9.4), note: 'Пост выставлен, связь установлена.' },
  { id: 'A-02', title: 'Проверить пропускную способность барьера Б-11', assignee: 'ст. л-т Орозов Б.', org: 'Инженерная группа ИГ-2', due: iso(-6), status: 'done', completed_at: iso(-6.7), note: 'Накопительная ёмкость заполнена на 35 %, расчистка не требуется.' },
  { id: 'A-03', title: 'Оповестить руководителей социальных объектов в зоне', assignee: 'Абдырахманова С.', org: 'Айыл окмоту Сузакского района', due: iso(-4), status: 'done', completed_at: iso(-4.2), note: 'Оповещены 3 объекта: школа № 12, детский сад «Умут», филиал ЦСМ.' },
  { id: 'A-04', title: 'Развернуть ПВР «Дом культуры Барпы»', assignee: 'Турдубаев К.', org: 'Айыл окмоту Сузакского района', due: iso(-1), status: 'in_progress', completed_at: null, note: 'Размещено 96 человек из 180 мест.' },
  { id: 'A-05', title: 'Организовать подвоз питьевой воды в ПВР', assignee: 'Сыдыков К.', org: 'Районная администрация', due: iso(2), status: 'in_progress', completed_at: null },
  { id: 'A-06', title: 'Ограничить движение по участку 14–19 км', assignee: 'м-р Сыдыков К.', org: 'ОВД Сузакского района', due: iso(-2), status: 'done', completed_at: iso(-2.5), note: 'Выставлены посты на обоих концах участка.' },
  { id: 'A-07', title: 'Провести обход жилой застройки нижней террасы', assignee: 'к-н Жээнбеков Р.', org: 'ПСЧ-4 Сузак', due: iso(-3), status: 'overdue', completed_at: null, note: 'Не выполнено в срок: расчёт задействован на разборе завала.' },
  { id: 'A-08', title: 'Подготовить донесение в областное УМЧС', assignee: 'Оператор ОДС', org: 'ЦУКС', due: iso(4), status: 'pending', completed_at: null },
];

const activeTimeline: TimelineEntry[] = [
  { t: iso(-14.2), actor: 'Система', kind: 'system', text: 'Правило R-MUD-02 сработало по станции МС-04: осадки за 12 ч — 40,0 мм при пороге 30,0 мм, влагонасыщение грунта 88 % при пороге 72 %.' },
  { t: iso(-13.8), actor: 'Оператор ОДС Жумабаев А.', kind: 'operator', text: 'Уровень угрозы по зоне Z-SZK-002 повышен с 3 до 4. Основание: расчёт движка правил + данные гидропоста.' },
  { t: iso(-13.5), actor: 'Оператор ОДС Жумабаев А.', kind: 'decision', text: 'Открыто событие EV-2026-0184. Статус: наблюдение.' },
  { t: iso(-12.1), actor: 'АСО «Кара-Ункур»', kind: 'field', text: 'Наблюдательный пост в створе моста выставлен. Уровень в русле 118 см, помутнение потока.' },
  { t: iso(-9.6), actor: 'Система', kind: 'system', text: 'Уровень в створе КА-07 достиг 164 см. Превышение отметки предупреждения (150 см).' },
  { t: iso(-9.2), actor: 'Начальник смены Сатыбалдиев Э.', kind: 'decision', text: 'Статус события изменён: наблюдение → активное.' },
  { t: iso(-8.7), actor: 'Оператор ОДС Жумабаев А.', kind: 'notification', text: 'Сформирован черновик уведомления NT-2026-0411 по шаблону «Сель. Угроза схода».' },
  { t: iso(-8.4), actor: 'Начальник смены Сатыбалдиев Э.', kind: 'notification', text: 'Уведомление NT-2026-0411 подтверждено и передано на доставку: Telegram, SMS, служебный канал.' },
  { t: iso(-6.7), actor: 'Инженерная группа ИГ-2', kind: 'field', text: 'Обследование барьера Б-11: заполнение 35 %, конструкция без повреждений.' },
  { t: iso(-4.2), actor: 'Айыл окмоту', kind: 'field', text: 'Руководители трёх социальных объектов оповещены, дети выведены из зоны.' },
  { t: iso(-2.5), actor: 'ОВД Сузакского района', kind: 'field', text: 'Движение по участку 14–19 км ограничено, выставлены посты.' },
  { t: iso(-1.3), actor: 'Айыл окмоту', kind: 'field', text: 'Развёртывание ПВР «Дом культуры Барпы». Размещено 96 человек.' },
  { t: iso(-0.4), actor: 'Система', kind: 'system', text: 'Данные МС-04 обновлены: осадки за последний час 2,1 мм, интенсивность снижается.' },
];

const active: EmergencyEvent = {
  id: 'EV-2026-0184',
  title: 'Угроза схода селя в водосборе Кёк-Арт',
  hazard: 'mudflow',
  level: 4,
  status: 'active',
  territory: 'suzak',
  settlement: 'с. Барпы',
  zone: 'Z-SZK-002',
  coords: [73.18, 40.72],
  started_at: iso(-13.5),
  closed_at: null,
  declared_by: 'Начальник смены ЦУКС Сатыбалдиев Э.',
  consequences: {
    affected: 3120, evacuated: 96, injured: 0, fatalities: 0,
    houses_damaged: 0, roads_km: 5.2, damage_som_mln: 0,
  },
  actions: activeActions,
  timeline: activeTimeline,
  resources: ['RU-02', 'RU-03', 'RU-04', 'RU-06'],
  summary:
    'Интенсивные осадки в водосборе Кёк-Арт привели к превышению порога правила R-MUD-02. ' +
    'Уровень в контрольном створе выше отметки предупреждения. Проведено частичное отселение, ' +
    'ограничено движение по участку дороги, развёрнут пункт временного размещения.',
  report: null,
};

/* --- Наблюдение --- */

const monitoring: EmergencyEvent[] = [
  {
    id: 'EV-2026-0183', title: 'Активизация оползня «Тектоник»', hazard: 'landslide', level: 4,
    status: 'monitoring', territory: 'mailuu-suu', settlement: 'г. Майлуу-Суу', zone: 'Z-MLS-002',
    coords: [72.478, 41.311], started_at: isoDays(-2.4), closed_at: null,
    declared_by: 'Областное УМЧС',
    consequences: { affected: 2650, evacuated: 0, injured: 0, fatalities: 0, houses_damaged: 0, roads_km: 0, damage_som_mln: 0 },
    actions: [
      { id: 'A-11', title: 'Учащённый съём показаний датчиков смещения', assignee: 'Бакиров Д.', org: 'АСО «Майлуу-Суу»', due: iso(6), status: 'in_progress', completed_at: null },
      { id: 'A-12', title: 'Подготовить ПВР «Гимназия» к приёму', assignee: 'Исакова Г.', org: 'Мэрия г. Майлуу-Суу', due: iso(12), status: 'pending', completed_at: null },
    ],
    timeline: [
      { t: isoDays(-2.4), actor: 'Система', kind: 'system', text: 'Датчик смещения ТК-2 зафиксировал прирост 4,2 мм за сутки при норме 1,0 мм.' },
      { t: isoDays(-2.3), actor: 'Оператор ОДС', kind: 'decision', text: 'Открыто событие в статусе наблюдения.' },
      { t: isoDays(-0.6), actor: 'АСО «Майлуу-Суу»', kind: 'field', text: 'Визуальный осмотр: новых трещин отрыва не выявлено.' },
    ],
    resources: ['RU-10'],
    summary: 'Прирост смещений нависающего массива выше суточной нормы. Эвакуация не объявлялась, ведётся усиленный мониторинг.',
    report: null,
  },
  {
    id: 'EV-2026-0181', title: 'Подъём уровня в нижнем бьефе Токтогульской ГЭС', hazard: 'flood', level: 3,
    status: 'monitoring', territory: 'kara-kul', settlement: 'г. Кара-Куль', zone: 'Z-TKG-001',
    coords: [72.71, 41.6], started_at: isoDays(-4.1), closed_at: null,
    declared_by: 'Областное УМЧС',
    consequences: { affected: 6400, evacuated: 0, injured: 0, fatalities: 0, houses_damaged: 0, roads_km: 0, damage_som_mln: 0 },
    actions: [
      { id: 'A-21', title: 'Согласовать график попусков с эксплуатирующей организацией', assignee: 'Дуйшенов А.', org: 'ПСЧ-21 Кара-Куль', due: iso(-20), status: 'done', completed_at: iso(-22) },
      { id: 'A-22', title: 'Контроль отметок уровня в нижнем бьефе', assignee: 'Дуйшенов А.', org: 'ПСЧ-21 Кара-Куль', due: iso(18), status: 'in_progress', completed_at: null },
    ],
    timeline: [
      { t: isoDays(-4.1), actor: 'ОАО «Электрические станции»', kind: 'system', text: 'Уведомление о плановом увеличении попусков до 620 м³/с.' },
      { t: isoDays(-3.9), actor: 'Оператор ОДС', kind: 'decision', text: 'Открыто событие в статусе наблюдения.' },
    ],
    resources: ['RU-16'],
    summary: 'Плановое увеличение попусков. Отметки в пределах допустимых, режим согласован.',
    report: null,
  },
];

/* --- Исторические события --- */

interface H {
  id: string; title: string; hazard: HazardType; level: ThreatLevel; terr: string;
  settlement: string; zone: string | null; lon: number; lat: number;
  startDays: number; durDays: number;
  c: [number, number, number, number, number, number, number];  // affected, evac, injured, fatal, houses, roads, damage
  summary: string;
}

const hist: H[] = [
  { id: 'EV-2026-0142', title: 'Сход селя в водосборе Арсланбоб', hazard: 'mudflow', level: 4, terr: 'bazar-korgon', settlement: 'с. Арсланбоб', zone: 'Z-BKG-001', lon: 72.945, lat: 41.335, startDays: -94, durDays: 6, c: [2980, 340, 4, 0, 22, 3.1, 18.4], summary: 'Сход селя объёмом около 40 тыс. м³ после ливня. Повреждено 22 дома, перекрыт участок дороги. Селелоток СЛ-06 принял часть объёма.' },
  { id: 'EV-2026-0118', title: 'Паводок на р. Кара-Дарья', hazard: 'flood', level: 3, terr: 'suzak', settlement: 'с. Сузак', zone: 'Z-SZK-003', lon: 72.96, lat: 40.87, startDays: -128, durDays: 9, c: [5760, 210, 1, 0, 41, 6.8, 24.9], summary: 'Подтопление пойменных участков при расходе 690 м³/с. Дамба Д-04 удержала основной напор, отмечена фильтрация.' },
  { id: 'EV-2026-0091', title: 'Активизация оползня «Сакалды»', hazard: 'landslide', level: 4, terr: 'nooken', settlement: 'с. Сакалды', zone: 'Z-NKN-002', lon: 72.39, lat: 41.16, startDays: -163, durDays: 14, c: [1360, 128, 0, 0, 9, 1.2, 11.6], summary: 'Смещение головной части оползня на 1,4 м. Отселено 34 двора, разрушений жилого фонда не допущено.' },
  { id: 'EV-2026-0044', title: 'Сход лавины на перевале Ала-Бель', hazard: 'avalanche', level: 4, terr: 'toktogul', settlement: 'участок 174 км', zone: 'Z-TKG-002', lon: 72.55, lat: 42.05, startDays: -212, durDays: 2, c: [0, 0, 2, 0, 0, 0.4, 3.2], summary: 'Сход лавины объёмом 65 тыс. м³ на трассу Бишкек — Ош. Движение восстановлено через 31 час.' },
  { id: 'EV-2025-0338', title: 'Ливневое подтопление центра Джалал-Абада', hazard: 'flood', level: 3, terr: 'jalal-abad', settlement: 'г. Джалал-Абад', zone: 'Z-JLB-002', lon: 72.99, lat: 40.928, startDays: -287, durDays: 3, c: [8600, 0, 0, 0, 64, 4.2, 9.8], summary: 'Ливень интенсивностью 34 мм/ч. Коллектор ЛК-34 не справился с нагрузкой, подтоплено 64 домовладения.' },
  { id: 'EV-2025-0291', title: 'Провал грунта в Кок-Жангаке', hazard: 'landslide', level: 4, terr: 'kok-jangak', settlement: 'г. Кок-Жангак', zone: 'Z-KKJ-001', lon: 73.2, lat: 40.94, startDays: -334, durDays: 21, c: [1480, 48, 1, 0, 6, 0.3, 7.1], summary: 'Провал над отработанной выработкой диаметром 11 м. Отселено 12 дворов, участок огорожен.' },
  { id: 'EV-2025-0206', title: 'Сель в водосборе Кёк-Арт', hazard: 'mudflow', level: 4, terr: 'suzak', settlement: 'с. Барпы', zone: 'Z-SZK-002', lon: 73.18, lat: 40.72, startDays: -412, durDays: 8, c: [3120, 420, 6, 1, 31, 5.4, 29.7], summary: 'Наиболее тяжёлое событие сезона: сель объёмом около 70 тыс. м³. Один погибший, повреждён мост.' },
  { id: 'EV-2025-0157', title: 'Паводок на р. Кассан-Сай', hazard: 'flood', level: 3, terr: 'aksy', settlement: 'с. Кызыл-Туу', zone: 'Z-AKS-002', lon: 71.95, lat: 41.29, startDays: -468, durDays: 5, c: [2140, 86, 0, 0, 18, 2.6, 8.3], summary: 'Аварийный сброс из водохранилища при интенсивном снеготаянии. Дамба Д-43 повреждена локально.' },
  { id: 'EV-2024-0402', title: 'Землетрясение, интенсивность 5 баллов', hazard: 'seismic', level: 3, terr: 'bazar-korgon', settlement: 'с. Базар-Коргон', zone: 'Z-BKG-004', lon: 72.86, lat: 41.13, startDays: -604, durDays: 4, c: [18600, 0, 9, 0, 112, 0, 21.4], summary: 'Толчок магнитудой 4,8. Повреждения саманных построек, обрушений не зафиксировано.' },
  { id: 'EV-2024-0311', title: 'Оползень на трассе Сузак — Кара-Алма', hazard: 'landslide', level: 3, terr: 'suzak', settlement: 'участок 17 км', zone: 'Z-SZK-006', lon: 73.24, lat: 40.76, startDays: -689, durDays: 6, c: [0, 0, 0, 0, 0, 1.8, 4.6], summary: 'Смещение грунта перекрыло проезжую часть на 60 м. Движение восстановлено на четвёртые сутки.' },
  { id: 'EV-2024-0188', title: 'Прорыв селелотка Шамалды-Сай', hazard: 'mudflow', level: 4, terr: 'nooken', settlement: 'пгт Шамалды-Сай', zone: 'Z-NKN-003', lon: 72.29, lat: 41.2, startDays: -798, durDays: 11, c: [1720, 240, 3, 0, 27, 2.9, 16.2], summary: 'Разрушение бетонного лотка СЛ-40 на участке 400–650 м, вынос материала в жилую застройку.' },
  { id: 'EV-2023-0421', title: 'Подтопление в низовьях Сафед-Булан', hazard: 'flood', level: 2, terr: 'suzak', settlement: 'с. Сафед-Булан', zone: 'Z-SZK-004', lon: 73.62, lat: 40.7, startDays: -1012, durDays: 16, c: [940, 0, 0, 0, 14, 0.6, 3.4], summary: 'Подъём грунтовых вод в период орошения. Введена в работу насосная станция НС-37.' },
];

const historical: EmergencyEvent[] = hist.map((h) => ({
  id: h.id,
  title: h.title,
  hazard: h.hazard,
  level: h.level,
  status: 'closed' as EventStatus,
  territory: h.terr,
  settlement: h.settlement,
  zone: h.zone,
  coords: [h.lon, h.lat],
  started_at: isoDays(h.startDays),
  closed_at: isoDays(h.startDays + h.durDays),
  declared_by: 'Областное УМЧС',
  consequences: {
    affected: h.c[0], evacuated: h.c[1], injured: h.c[2], fatalities: h.c[3],
    houses_damaged: h.c[4], roads_km: h.c[5], damage_som_mln: h.c[6],
  },
  actions: [],
  timeline: [
    { t: isoDays(h.startDays), actor: 'Система', kind: 'system', text: 'Событие зарегистрировано.' },
    { t: isoDays(h.startDays + h.durDays), actor: 'Областное УМЧС', kind: 'decision', text: 'Событие закрыто, отчёт утверждён.' },
  ],
  resources: [],
  summary: h.summary,
  report: `Отчёт по событию ${h.id}, утверждён областным УМЧС`,
}));

export const events: EmergencyEvent[] = [active, ...monitoring, ...historical];
export const eventById = (id: string) => events.find((e) => e.id === id);
export const activeEventId = active.id;
