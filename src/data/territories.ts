import type { Territory } from '../types';

/** Малый контур для города областного значения. */
function cityRing(lon: number, lat: number, r = 0.045): [number, number][] {
  const ring: [number, number][] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const k = 0.86 + ((i * 37) % 11) / 40; // детерминированная неровность
    ring.push([+(lon + Math.cos(a) * r * 1.35 * k).toFixed(4), +(lat + Math.sin(a) * r * k).toFixed(4)]);
  }
  return ring;
}

/* ВНИМАНИЕ: геометрия упрощена и является демонстрационной.
   При загрузке официальных GIS-данных заменяется целиком. */

export const territories: Territory[] = [
  {
    code: 'suzak',
    name: 'Сузакский район',
    kind: 'rayon',
    center: 'Сузак',
    population: 289400,
    settlements: 63,
    area_km2: 3132,
    threat: 4,
    pilot: true,
    centroid: [73.05, 40.85],
    geometry: [
      [72.55, 40.88], [72.75, 40.98], [72.95, 40.92], [73.20, 41.00],
      [73.60, 41.05], [73.80, 40.85], [73.60, 40.62], [73.10, 40.58], [72.75, 40.68],
    ],
  },
  {
    code: 'bazar-korgon',
    name: 'Базар-Коргонский район',
    kind: 'rayon',
    center: 'Базар-Коргон',
    population: 152800,
    settlements: 41,
    area_km2: 1734,
    threat: 3,
    centroid: [72.95, 41.18],
    geometry: [
      [72.65, 41.20], [72.65, 41.45], [73.10, 41.45], [73.35, 41.30],
      [73.20, 41.00], [72.95, 40.92], [72.75, 40.98],
    ],
  },
  {
    code: 'nooken',
    name: 'Ноокенский район',
    kind: 'rayon',
    center: 'Массы',
    population: 137200,
    settlements: 34,
    area_km2: 1156,
    threat: 3,
    centroid: [72.42, 41.05],
    geometry: [
      [72.10, 41.10], [72.40, 41.28], [72.65, 41.20], [72.75, 40.98],
      [72.55, 40.88], [72.25, 40.92], [72.05, 41.00],
    ],
  },
  {
    code: 'aksy',
    name: 'Аксыйский район',
    kind: 'rayon',
    center: 'Кербен',
    population: 118600,
    settlements: 38,
    area_km2: 4283,
    threat: 3,
    centroid: [72.00, 41.35],
    geometry: [
      [71.60, 41.15], [71.90, 41.30], [71.85, 41.55], [72.20, 41.70],
      [72.45, 41.55], [72.40, 41.28], [72.10, 41.10], [71.80, 41.05],
    ],
  },
  {
    code: 'ala-buka',
    name: 'Ала-Букинский район',
    kind: 'rayon',
    center: 'Ала-Бука',
    population: 96300,
    settlements: 29,
    area_km2: 3016,
    threat: 2,
    centroid: [71.40, 41.32],
    geometry: [
      [70.92, 41.30], [71.05, 41.58], [71.40, 41.50], [71.85, 41.55],
      [71.90, 41.30], [71.60, 41.15], [71.20, 41.10], [70.95, 41.18],
    ],
  },
  {
    code: 'toktogul',
    name: 'Токтогульский район',
    kind: 'rayon',
    center: 'Токтогул',
    population: 92700,
    settlements: 31,
    area_km2: 7284,
    threat: 4,
    centroid: [72.90, 41.78],
    geometry: [
      [72.20, 41.70], [72.30, 42.05], [72.90, 42.15], [73.45, 41.95],
      [73.55, 41.60], [73.10, 41.45], [72.65, 41.45], [72.45, 41.55],
    ],
  },
  {
    code: 'chatkal',
    name: 'Чаткальский район',
    kind: 'rayon',
    center: 'Каныш-Кыя',
    population: 24100,
    settlements: 17,
    area_km2: 7154,
    threat: 3,
    centroid: [71.55, 41.85],
    geometry: [
      [70.95, 41.75], [71.25, 42.05], [71.75, 42.15], [72.15, 41.95],
      [72.20, 41.70], [71.85, 41.55], [71.40, 41.50], [71.05, 41.58],
    ],
  },
  {
    code: 'toguz-toro',
    name: 'Тогуз-Тороуский район',
    kind: 'rayon',
    center: 'Казарман',
    population: 26800,
    settlements: 14,
    area_km2: 5152,
    threat: 2,
    centroid: [74.00, 41.45],
    geometry: [
      [73.55, 41.60], [73.45, 41.95], [74.10, 41.85], [74.55, 41.55],
      [74.50, 41.15], [74.05, 40.95], [73.60, 41.05], [73.35, 41.30],
    ],
  },

  /* --- Города областного значения --- */
  {
    code: 'jalal-abad',
    name: 'город Джалал-Абад',
    kind: 'city',
    center: 'Джалал-Абад',
    population: 123800,
    settlements: 1,
    area_km2: 88,
    threat: 3,
    centroid: [73.0, 40.933],
    geometry: cityRing(73.0, 40.933, 0.052),
  },
  {
    code: 'mailuu-suu',
    name: 'город Майлуу-Суу',
    kind: 'city',
    center: 'Майлуу-Суу',
    population: 25400,
    settlements: 1,
    area_km2: 34,
    threat: 5,
    centroid: [72.468, 41.302],
    geometry: cityRing(72.468, 41.302, 0.034),
  },
  {
    code: 'kara-kul',
    name: 'город Кара-Куль',
    kind: 'city',
    center: 'Кара-Куль',
    population: 22900,
    settlements: 1,
    area_km2: 26,
    threat: 4,
    centroid: [72.668, 41.617],
    geometry: cityRing(72.668, 41.617, 0.03),
  },
  {
    code: 'tash-kumyr',
    name: 'город Таш-Кумыр',
    kind: 'city',
    center: 'Таш-Кумыр',
    population: 21700,
    settlements: 1,
    area_km2: 29,
    threat: 3,
    centroid: [72.219, 41.344],
    geometry: cityRing(72.219, 41.344, 0.03),
  },
  {
    code: 'kok-jangak',
    name: 'город Кок-Жангак',
    kind: 'city',
    center: 'Кок-Жангак',
    population: 11300,
    settlements: 1,
    area_km2: 18,
    threat: 4,
    centroid: [73.201, 40.937],
    geometry: cityRing(73.201, 40.937, 0.026),
  },
];

export const territoryByCode = (code: string) => territories.find((t) => t.code === code);
export const territoryName = (code: string) => territoryByCode(code)?.name ?? code;
