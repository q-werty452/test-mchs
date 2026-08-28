import { useEffect, useRef, useState, useCallback, memo } from 'react';
import maplibregl from 'maplibre-gl';
import type { Map as MlMap, MapMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './map.css';

import { loadBasemap, hatchImage } from './basemap';
import { zonesFC, territoriesFC, territoryLabelsFC, routesFC, boundsOf } from './geo';
import type { MapPoint, PointKind } from './geo';
import type { RiskZone, Territory, EvacuationRoute } from '../types';
import { Icon } from '../ui/Icon';
import { css } from '../theme/colors';
import { useApp } from '../state/app';

export interface LayerVisibility {
  territories: boolean;
  zones: boolean;
  routes: boolean;
  structures: boolean;
  stations: boolean;
  resources: boolean;
  shelters: boolean;
  facilities: boolean;
  events: boolean;
}

export interface Selection { kind: 'zone' | 'territory' | PointKind; id: string }

interface Props {
  zones: RiskZone[];
  territories: Territory[];
  routes: EvacuationRoute[];
  points: MapPoint[];
  layers: LayerVisibility;
  selection: Selection | null;
  onSelect: (s: Selection | null) => void;
  focus?: { coords: [number, number]; zoom?: number } | null;
  fitTo?: [number, number][] | null;
  /** однократная подгонка вида под набор координат при первой загрузке */
  initialFit?: [number, number][] | null;
  fitPadding?: { top: number; bottom: number; left: number; right: number };
  onCursor?: (c: [number, number] | null) => void;
  onBasemap?: (online: boolean) => void;
}

const START = { center: [72.9, 41.3] as [number, number], zoom: 7.35, pitch: 26, bearing: -8 };

const DEFAULT_PADDING = { top: 70, bottom: 70, left: 70, right: 70 };

export function MapView({
  zones, territories, routes, points, layers, selection, onSelect, focus, fitTo,
  initialFit, fitPadding = DEFAULT_PADDING, onCursor, onBasemap,
}: Props) {
  const { theme } = useApp();
  const holder = useRef<HTMLDivElement>(null);
  const map = useRef<MlMap | null>(null);
  const fitDone = useRef(false);
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);
  const raf = useRef(0);

  /* --- Инициализация --- */
  useEffect(() => {
    if (!holder.current || map.current) return;
    let disposed = false;

    (async () => {
      const { style, online } = await loadBasemap(theme);
      if (disposed || !holder.current) return;
      onBasemap?.(online);

      const m = new maplibregl.Map({
        container: holder.current,
        style,
        center: START.center,
        zoom: START.zoom,
        pitch: START.pitch,
        bearing: START.bearing,
        attributionControl: online ? { compact: true } : false,
        maxZoom: 16,
        minZoom: 5.5,
        dragRotate: true,
      });

      m.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
      m.addControl(new maplibregl.ScaleControl({ maxWidth: 110, unit: 'metric' }), 'bottom-left');

      m.on('load', () => {
        if (disposed) return;
        try { m.addImage('hatch', hatchImage(), { pixelRatio: 2 }); } catch { /* уже добавлено */ }
        installLayers(m);
        map.current = m;
        setReady(true);
        bump();
      });

      const bump = () => {
        cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(() => setTick((t) => t + 1));
      };

      m.on('move', bump);
      m.on('zoom', bump);
      m.on('rotate', bump);
      m.on('resize', bump);

      m.on('mousemove', (e: MapMouseEvent) => onCursor?.([e.lngLat.lng, e.lngLat.lat]));
      m.on('mouseout', () => onCursor?.(null));

      // Ошибки подложки не должны оставаться незамеченными
      m.on('error', (e) => console.error('[map]', e?.error?.message ?? e));

      if (import.meta.env.DEV) {
        (window as unknown as { __map?: MlMap }).__map = m;
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf.current);
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --- Данные слоёв --- */
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    (m.getSource('zones') as maplibregl.GeoJSONSource | undefined)?.setData(zonesFC(zones));
  }, [zones, ready]);

  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    (m.getSource('terr') as maplibregl.GeoJSONSource | undefined)?.setData(territoriesFC(territories));
    (m.getSource('terr-labels') as maplibregl.GeoJSONSource | undefined)?.setData(territoryLabelsFC(territories));
  }, [territories, ready]);

  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    (m.getSource('routes') as maplibregl.GeoJSONSource | undefined)?.setData(routesFC(routes));
  }, [routes, ready]);

  /* --- Видимость --- */
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const set = (id: string, on: boolean) => {
      if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
    };
    set('terr-fill', layers.territories);
    set('terr-line', layers.territories);
    set('terr-label', layers.territories);
    set('zone-fill', layers.zones);
    set('zone-hatch', layers.zones);
    set('zone-glow', layers.zones);
    set('zone-line', layers.zones);
    set('zone-critical', layers.zones);
    set('route-casing', layers.routes);
    set('route-line', layers.routes);
  }, [layers, ready]);

  /* --- Выделение --- */
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const id = selection?.kind === 'zone' ? selection.id : '';
    if (m.getLayer('zone-selected')) {
      m.setFilter('zone-selected', ['==', ['get', 'id'], id]);
    }
  }, [selection, ready]);

  /* --- Пульсация критических зон --- */
  useEffect(() => {
    if (!ready) return;
    let frame = 0;
    const animate = () => {
      const m = map.current;
      if (m && m.getLayer('zone-critical')) {
        const t = (Date.now() % 2600) / 2600;
        const eased = Math.sin(t * Math.PI);
        m.setPaintProperty('zone-critical', 'line-width', 1.2 + eased * 3.4);
        m.setPaintProperty('zone-critical', 'line-opacity', 0.5 - eased * 0.36);
        m.setPaintProperty('zone-critical', 'line-blur', 1 + eased * 4);
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [ready]);

  /* --- Анимация штриха маршрутов --- */
  useEffect(() => {
    if (!ready) return;
    let frame = 0;
    const patterns = [[0, 4, 3, 0], [0.5, 4, 2.5, 0.5], [1, 4, 2, 1], [1.5, 4, 1.5, 1.5], [2, 4, 1, 2], [2.5, 4, 0.5, 2.5], [3, 4, 0, 3]];
    let i = 0;
    let last = 0;
    const animate = (t: number) => {
      if (t - last > 90) {
        last = t;
        const m = map.current;
        if (m && m.getLayer('route-line')) {
          m.setPaintProperty('route-line', 'line-dasharray', patterns[i % patterns.length]);
          i++;
        }
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [ready]);

  /* --- Перелёты --- */
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !focus) return;
    m.flyTo({ center: focus.coords, zoom: focus.zoom ?? 11.5, duration: 1500, curve: 1.35, essential: true });
  }, [focus, ready]);

  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !fitTo || fitTo.length === 0) return;
    m.fitBounds(boundsOf(fitTo), { padding: fitPadding, duration: 1300, maxZoom: 12 });
  }, [fitTo, ready, fitPadding]);

  /* Первичная подгонка под границы данных — выполняется один раз */
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || fitDone.current || !initialFit || initialFit.length === 0) return;
    fitDone.current = true;
    m.fitBounds(boundsOf(initialFit), { padding: fitPadding, duration: 0, maxZoom: 11 });
  }, [ready, initialFit, fitPadding]);

  /* --- Клики по полигонам --- */
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;

    const clickZone = (e: MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      const f = e.features?.[0];
      if (f) onSelect({ kind: 'zone', id: String(f.properties?.id) });
    };
    const clickTerr = (e: MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      const f = e.features?.[0];
      if (f) onSelect({ kind: 'territory', id: String(f.properties?.code) });
    };
    const enter = () => { m.getCanvas().style.cursor = 'pointer'; };
    const leave = () => { m.getCanvas().style.cursor = ''; };

    m.on('click', 'zone-fill', clickZone);
    m.on('click', 'terr-fill', clickTerr);
    m.on('mouseenter', 'zone-fill', enter);
    m.on('mouseleave', 'zone-fill', leave);

    return () => {
      m.off('click', 'zone-fill', clickZone);
      m.off('click', 'terr-fill', clickTerr);
      m.off('mouseenter', 'zone-fill', enter);
      m.off('mouseleave', 'zone-fill', leave);
    };
  }, [ready, onSelect]);

  const project = useCallback((c: [number, number]) => {
    const m = map.current;
    if (!m) return null;
    const p = m.project(c);
    // границы берём у контейнера: размеры холста зависят от devicePixelRatio
    const el = m.getContainer();
    if (p.x < -90 || p.y < -70 || p.x > el.clientWidth + 90 || p.y > el.clientHeight + 70) return null;
    return p;
  }, []);

  const visiblePoints = points.filter((p) => layerFor(p.kind, layers));

  return (
    <div className="mapwrap">
      <div ref={holder} style={{ position: 'absolute', inset: 0 }} />
      <div className="map-overlay">
        {ready && visiblePoints.map((p) => {
          const xy = project(p.coords);
          if (!xy) return null;
          return (
            <Marker
              key={`${p.kind}-${p.id}`}
              point={p}
              x={xy.x}
              y={xy.y}
              selected={selection?.kind === p.kind && selection.id === p.id}
              onClick={() => onSelect({ kind: p.kind, id: p.id })}
            />
          );
        })}
      </div>
      {/* tick используется для перерисовки маркеров при движении карты */}
      <span style={{ display: 'none' }}>{tick}</span>
    </div>
  );
}

function layerFor(kind: PointKind, l: LayerVisibility): boolean {
  switch (kind) {
    case 'structure': return l.structures;
    case 'station': return l.stations;
    case 'resource': return l.resources;
    case 'shelter': return l.shelters;
    case 'facility': return l.facilities;
    case 'event': return l.events;
  }
}

const Marker = memo(function Marker({
  point, x, y, selected, onClick,
}: { point: MapPoint; x: number; y: number; selected: boolean; onClick: () => void }) {
  const isEvent = point.kind === 'event';
  return (
    <div
      className={`mk ${isEvent ? 'mk--event mk--labeled' : ''} ${point.kind === 'facility' || point.kind === 'station' ? 'mk--sm' : ''} ${selected ? 'mk--selected' : ''}`}
      style={{ left: x, top: y, color: point.color, zIndex: isEvent ? 6 : selected ? 5 : 1 }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={point.name}
    >
      {isEvent && (
        <>
          <span className="mk__pulse" />
          <span className="mk__pulse mk__pulse--2" />
        </>
      )}
      <span className="mk__dot">
        <Icon name={point.icon} size={isEvent ? 15 : point.kind === 'facility' || point.kind === 'station' ? 10 : 13} />
      </span>
      <span className="mk__label">
        {point.name}
        <span style={{ color: 'var(--text-faint)', marginLeft: 6 }}>{point.meta}</span>
      </span>
    </div>
  );
});

/* ---------- Слои ---------- */

function installLayers(m: MlMap) {
  const empty: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

  m.addSource('terr', { type: 'geojson', data: empty });
  m.addSource('terr-labels', { type: 'geojson', data: empty });
  m.addSource('zones', { type: 'geojson', data: empty });
  m.addSource('routes', { type: 'geojson', data: empty });

  /* Территории */
  m.addLayer({
    id: 'terr-fill',
    type: 'fill',
    source: 'terr',
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0.09, 10, 0.035],
    },
  });

  m.addLayer({
    id: 'terr-line',
    type: 'line',
    source: 'terr',
    paint: {
      'line-color': ['get', 'color'],
      'line-width': ['case', ['==', ['get', 'pilot'], 1], 2, 1],
      'line-opacity': 0.55,
      'line-dasharray': ['case', ['==', ['get', 'kind'], 'city'], ['literal', [2, 2]], ['literal', [1, 0]]],
    },
  });

  m.addLayer({
    id: 'terr-label',
    type: 'symbol',
    source: 'terr-labels',
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 6, 9, 10, 12],
      'text-letter-spacing': 0.14,
      'text-allow-overlap': false,
      'text-max-width': 9,
    },
    paint: {
      'text-color': css('--map-label'),
      'text-halo-color': css('--halo'),
      'text-halo-width': 1.4,
    },
  });

  /* Зоны риска */
  m.addLayer({
    id: 'zone-fill',
    type: 'fill',
    source: 'zones',
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.26, 13, 0.16],
    },
  });

  m.addLayer({
    id: 'zone-hatch',
    type: 'fill',
    source: 'zones',
    filter: ['==', ['get', 'overdue'], 1],
    paint: { 'fill-pattern': 'hatch', 'fill-opacity': 0.28 },
  });

  m.addLayer({
    id: 'zone-glow',
    type: 'line',
    source: 'zones',
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 6,
      'line-blur': 5,
      'line-opacity': 0.32,
    },
  });

  m.addLayer({
    id: 'zone-line',
    type: 'line',
    source: 'zones',
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 1.4,
      'line-opacity': 0.95,
    },
  });

  m.addLayer({
    id: 'zone-critical',
    type: 'line',
    source: 'zones',
    filter: ['==', ['get', 'critical'], 1],
    paint: { 'line-color': ['get', 'color'], 'line-width': 2, 'line-opacity': 0.4, 'line-blur': 3 },
  });

  m.addLayer({
    id: 'zone-selected',
    type: 'line',
    source: 'zones',
    filter: ['==', ['get', 'id'], ''],
    paint: { 'line-color': css('--selected-outline'), 'line-width': 2.2, 'line-opacity': 0.9 },
  });

  /* Маршруты эвакуации */
  m.addLayer({
    id: 'route-casing',
    type: 'line',
    source: 'routes',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': css('--halo'), 'line-width': 6, 'line-opacity': 0.8 },
  });

  m.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'routes',
    layout: { 'line-cap': 'butt', 'line-join': 'round' },
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 2.4,
      'line-dasharray': [0, 4, 3, 0],
      'line-opacity': 0.95,
    },
  });
}
