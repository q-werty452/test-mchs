import type { WeatherStation, Measurement, StationStatus } from '../types';
import { seeded, hashCode, iso, NOW } from './_util';

interface SSpec {
  id: string; name: string; terr: string; lon: number; lat: number;
  alt: number; river: string | null; status: StationStatus;
  lastSyncH: number; interval: number; operator: string;
  base: { precip: number; temp: number; level: number; wind: number; soil: number };
  /** сценарий: нарастание осадков в последние часы */
  surge?: boolean;
  errors?: string[];
}

const specs: SSpec[] = [
  {
    id: 'MS-01', name: 'МС «Джалал-Абад»', terr: 'jalal-abad', lon: 72.99, lat: 40.94,
    alt: 763, river: null, status: 'online', lastSyncH: -0.4, interval: 60,
    operator: 'Кыргызгидромет', base: { precip: 0.3, temp: 27, level: 0, wind: 2.4, soil: 38 },
  },
  {
    id: 'MS-02', name: 'МС «Арсланбоб»', terr: 'bazar-korgon', lon: 72.94, lat: 41.34,
    alt: 1618, river: 'Кара-Ункур', status: 'online', lastSyncH: -0.6, interval: 60,
    operator: 'Кыргызгидромет', base: { precip: 0.9, temp: 19, level: 84, wind: 3.1, soil: 52 },
  },
  {
    id: 'MS-04', name: 'МС «Кёк-Арт»', terr: 'suzak', lon: 73.19, lat: 40.74,
    alt: 1204, river: 'Кёк-Арт', status: 'online', lastSyncH: -0.3, interval: 60,
    operator: 'Кыргызгидромет', base: { precip: 1.1, temp: 21, level: 96, wind: 2.8, soil: 58 },
    surge: true,
  },
  {
    id: 'MS-06', name: 'МС «Майлуу-Суу»', terr: 'mailuu-suu', lon: 72.47, lat: 41.3,
    alt: 1042, river: 'Майлуу-Суу', status: 'online', lastSyncH: -0.5, interval: 60,
    operator: 'Кыргызгидромет', base: { precip: 0.7, temp: 23, level: 71, wind: 2.2, soil: 47 },
  },
  {
    id: 'MS-09', name: 'МС «Токтогул»', terr: 'toktogul', lon: 72.94, lat: 41.87,
    alt: 1050, river: 'Нарын', status: 'delayed', lastSyncH: -7.2, interval: 60,
    operator: 'Кыргызгидромет', base: { precip: 0.4, temp: 24, level: 142, wind: 3.6, soil: 34 },
    errors: ['Задержка передачи: последний пакет получен 7 ч назад', 'Пропуски в ряду уровня: 4 значения'],
  },
  {
    id: 'MS-12', name: 'МС «Каныш-Кыя»', terr: 'chatkal', lon: 71.55, lat: 41.86,
    alt: 1836, river: 'Чаткал', status: 'offline', lastSyncH: -41, interval: 180,
    operator: 'Кыргызгидромет', base: { precip: 0.5, temp: 16, level: 63, wind: 4.1, soil: 41 },
    errors: ['Нет связи с 21.08.2026 16:40', 'Канал передачи данных недоступен', 'Данные за 41 час отсутствуют'],
  },
  {
    id: 'MS-15', name: 'МС «Кербен»', terr: 'aksy', lon: 71.78, lat: 41.49,
    alt: 1120, river: 'Кассан-Сай', status: 'online', lastSyncH: -0.7, interval: 60,
    operator: 'Кыргызгидромет', base: { precip: 0.2, temp: 25, level: 58, wind: 2.6, soil: 31 },
  },
];

const HOURS = 72;

/* Профиль осадков сценарной станции: атмосферный фронт, прошедший над водосбором.
   Значения подобраны так, чтобы сумма за 12 часов совпадала с описанием события
   EV-2026-0184 (38,4 мм) и превышала порог правила R-MUD-02 (30 мм). */
const SURGE: number[] = [
  0.3, 0.7, 1.2, 1.8, 2.6, 3.4, 4.2, 5.0, 5.2, 4.3, 3.4, 2.6, 1.9, 1.3,
];

function buildSeries(spec: SSpec): Measurement[] {
  const rnd = seeded(hashCode(spec.id));
  const out: Measurement[] = [];
  let level = spec.base.level;
  let soil = spec.base.soil;

  for (let i = HOURS - 1; i >= 0; i--) {
    const hoursAgo = -i;
    const hourOfDay = new Date(NOW.getTime() + hoursAgo * 3600_000).getHours();
    const dayCycle = Math.cos(((hourOfDay - 15) / 24) * Math.PI * 2);

    let precip = Math.max(0, spec.base.precip * (rnd() * 1.4 - 0.5));
    if (spec.surge) {
      if (i < SURGE.length) precip += SURGE[SURGE.length - 1 - i];
      else if (i < 26) precip += 0.4 + rnd() * 0.8;
    }
    precip = +precip.toFixed(1);

    // Влагонасыщение растёт с осадками и медленно отдаёт влагу
    soil = Math.min(98, Math.max(12, soil + precip * 0.62 - 0.16));

    // Уровень реагирует на осадки и спадает к меженному значению
    level = Math.max(0, level + precip * 3.2 - (level - spec.base.level) * 0.075 + (rnd() - 0.5) * 1.4);

    out.push({
      t: iso(hoursAgo),
      precip_mm: precip,
      temp_c: +(spec.base.temp + dayCycle * 5.5 + (rnd() - 0.5) * 1.6 - (spec.surge && i < 14 ? 4.2 : 0)).toFixed(1),
      level_cm: +level.toFixed(0),
      wind_ms: +Math.max(0.2, spec.base.wind + (rnd() - 0.4) * 2.2 + (spec.surge && i < 14 ? 2.2 : 0)).toFixed(1),
      soil_pct: +soil.toFixed(0),
    });
  }

  // Станция без связи: ряд обрывается на последнем принятом пакете
  if (spec.status === 'offline') return out.slice(0, HOURS - 41);
  if (spec.status === 'delayed') return out.slice(0, HOURS - 7);
  return out;
}

export const stations: WeatherStation[] = specs.map((s) => ({
  id: s.id,
  name: s.name,
  territory: s.terr,
  coords: [s.lon, s.lat],
  altitude_m: s.alt,
  river: s.river,
  status: s.status,
  last_sync: iso(s.lastSyncH),
  interval_min: s.interval,
  operator: s.operator,
  series: buildSeries(s),
  errors: s.errors ?? [],
}));

export const stationById = (id: string) => stations.find((s) => s.id === id);

/** Сумма осадков за последние N часов — вход детерминированного движка правил. */
export function precipSum(st: WeatherStation, hours: number): number {
  return +st.series.slice(-hours).reduce((a, m) => a + m.precip_mm, 0).toFixed(1);
}

export function lastMeasurement(st: WeatherStation): Measurement | undefined {
  return st.series[st.series.length - 1];
}
