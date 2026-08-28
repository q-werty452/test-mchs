import type {
  RiskZone, Territory, EvacuationRoute, ProtectiveStructure, WeatherStation,
  ResourceUnit, Shelter, Facility, EmergencyEvent,
} from '../types';
import { levelColor, conditionColor, stationStatusColor } from '../data/dicts';
import { css, levelHex } from '../theme/colors';

/* Маркеры — обычный DOM, им подходит var(); слои MapLibre принимают
   только конкретные цвета, поэтому для них переменные разрешаются через css(). */

export type PointKind = 'structure' | 'station' | 'resource' | 'shelter' | 'facility' | 'event';

export interface MapPoint {
  id: string;
  kind: PointKind;
  name: string;
  coords: [number, number];
  color: string;
  icon: string;
  territory: string;
  /** подписывать постоянно, а не только при наведении */
  prominent?: boolean;
  meta: string;
}

const resourceIcon: Record<string, string> = {
  fire: 'fire', rescue: 'rescue', medical: 'medical', engineering: 'engineering', police: 'police',
};

const facilityIcon: Record<string, string> = {
  school: 'school', hospital: 'hospital', kindergarten: 'kindergarten',
  boiler: 'boiler', water: 'water', admin: 'admin',
};

export function buildPoints(src: {
  structures: ProtectiveStructure[];
  stations: WeatherStation[];
  resources: ResourceUnit[];
  shelters: Shelter[];
  facilities: Facility[];
  events: EmergencyEvent[];
}): MapPoint[] {
  const out: MapPoint[] = [];

  for (const s of src.structures) {
    out.push({
      id: s.id, kind: 'structure', name: s.name, coords: s.coords,
      color: conditionColor[s.condition], icon: 'structures', territory: s.territory,
      meta: `Износ ${s.wear_pct} %`,
    });
  }

  for (const s of src.stations) {
    out.push({
      id: s.id, kind: 'station', name: s.name, coords: s.coords,
      color: stationStatusColor[s.status], icon: 'station', territory: s.territory,
      meta: `${s.altitude_m} м${s.river ? ` · ${s.river}` : ''}`,
    });
  }

  for (const r of src.resources) {
    out.push({
      id: r.id, kind: 'resource', name: r.name, coords: r.coords,
      color: r.state === 'deployed' ? 'var(--accent)' : r.state === 'maintenance' ? 'var(--text-dim)' : 'var(--ok)',
      icon: resourceIcon[r.kind] ?? 'resources', territory: r.territory,
      meta: `${r.personnel} чел · ${r.vehicles} ед`,
    });
  }

  for (const s of src.shelters) {
    out.push({
      id: s.id, kind: 'shelter', name: s.name, coords: s.coords,
      color: s.occupied > 0 ? 'var(--warn)' : 'var(--text-dim)', icon: 'shelter', territory: s.territory,
      meta: `${s.occupied} / ${s.capacity}`,
    });
  }

  for (const f of src.facilities) {
    out.push({
      id: f.id, kind: 'facility', name: f.name, coords: f.coords,
      color: f.in_zone ? 'var(--lvl-3)' : 'var(--text-dim)', icon: facilityIcon[f.kind] ?? 'admin', territory: f.territory,
      meta: f.in_zone ? `В зоне ${f.in_zone}` : 'Вне зон риска',
    });
  }

  for (const e of src.events) {
    if (e.status === 'closed') continue;
    out.push({
      id: e.id, kind: 'event', name: e.title, coords: e.coords,
      color: levelColor[e.level], icon: 'events', territory: e.territory,
      prominent: true,
      meta: e.settlement,
    });
  }

  return out;
}

/* ---------- GeoJSON ---------- */

type FC = GeoJSON.FeatureCollection;

export function zonesFC(zones: RiskZone[]): FC {
  return {
    type: 'FeatureCollection',
    features: zones.map((z) => ({
      type: 'Feature',
      id: numericId(z.id),
      properties: {
        id: z.id,
        name: z.name,
        level: z.level,
        hazard: z.hazard,
        territory: z.territory,
        color: levelHex(z.level),
        overdue: z.freshness === 'overdue' ? 1 : 0,
        critical: z.level >= 4 ? 1 : 0,
      },
      geometry: { type: 'Polygon', coordinates: [closeRing(z.geometry)] },
    })),
  };
}

export function territoriesFC(list: Territory[]): FC {
  return {
    type: 'FeatureCollection',
    features: list.map((t) => ({
      type: 'Feature',
      id: numericId(t.code),
      properties: {
        code: t.code, name: t.name, threat: t.threat, kind: t.kind,
        color: levelHex(t.threat), pilot: t.pilot ? 1 : 0,
      },
      geometry: { type: 'Polygon', coordinates: [closeRing(t.geometry)] },
    })),
  };
}

export function territoryLabelsFC(list: Territory[]): FC {
  return {
    type: 'FeatureCollection',
    features: list.map((t) => ({
      type: 'Feature',
      properties: { name: t.name.replace(/^(город|.*?район)\s?/i, (m) => m).toUpperCase(), kind: t.kind },
      geometry: { type: 'Point', coordinates: t.centroid },
    })),
  };
}

export function routesFC(list: EvacuationRoute[]): FC {
  return {
    type: 'FeatureCollection',
    features: list.map((r) => ({
      type: 'Feature',
      properties: {
        id: r.id, name: r.name, condition: r.condition,
        color: r.condition === 'open' ? css('--ok') : r.condition === 'limited' ? css('--warn') : css('--danger'),
      },
      geometry: { type: 'LineString', coordinates: r.path },
    })),
  };
}

function closeRing(ring: [number, number][]): [number, number][] {
  if (ring.length === 0) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  return first[0] === last[0] && first[1] === last[1] ? ring : [...ring, first];
}

function numericId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Границы набора координат для fitBounds. */
export function boundsOf(coords: [number, number][]): [[number, number], [number, number]] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of coords) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return [[minX, minY], [maxX, maxY]];
}
