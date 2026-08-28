import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapView } from '../map/MapView';
import type { LayerVisibility, Selection } from '../map/MapView';
import { buildPoints } from '../map/geo';
import type { MapPoint } from '../map/geo';
import { api } from '../api/client';
import { useData, useApp } from '../state/app';
import { Icon } from '../ui/Icon';
import { Button, Badge, Level, KV, Meter } from '../ui/kit';
import { fmtCoord, fmtDate, fmtAgo, num } from '../ui/format';
import {
  hazardLabel, hazardIcon, levelColor, levelLabel, freshnessLabel, freshnessColor,
  conditionLabel, conditionColor, structureLabel, stationStatusLabel, stationStatusColor,
  resourceLabel, resourceStateLabel, facilityLabel, eventStatusLabel, eventStatusColor,
} from '../data/dicts';
import type { ThreatLevel, HazardType } from '../types';

const LAYER_DEFS: { key: keyof LayerVisibility; label: string; icon: string }[] = [
  { key: 'territories', label: 'Границы территорий', icon: 'grid' },
  { key: 'zones', label: 'Зоны риска', icon: 'zones' },
  { key: 'events', label: 'Очаги событий', icon: 'events' },
  { key: 'routes', label: 'Маршруты эвакуации', icon: 'route' },
  { key: 'shelters', label: 'Пункты размещения', icon: 'shelter' },
  { key: 'structures', label: 'Защитные сооружения', icon: 'structures' },
  { key: 'stations', label: 'Метеостанции', icon: 'station' },
  { key: 'resources', label: 'Силы и средства', icon: 'resources' },
  { key: 'facilities', label: 'Социальные объекты', icon: 'school' },
];

const HAZARDS: HazardType[] = ['landslide', 'mudflow', 'flood', 'avalanche', 'seismic', 'tailings', 'rockfall'];

/* Отступы под панели поверх карты: поиск и слои слева, карточка объекта справа */
const MAP_PADDING = { top: 80, bottom: 90, left: 540, right: 380 };

export function MapScreen() {
  const nav = useNavigate();
  const { inScope, roleId } = useApp();

  const { data: zones } = useData(() => api.getZones(), []);
  const { data: territories } = useData(() => api.getTerritories(), []);
  const { data: structures } = useData(() => api.getStructures(), []);
  const { data: stations } = useData(() => api.getStations(), []);
  const { data: resources } = useData(() => api.getResources(), []);
  const { data: shelters } = useData(() => api.getShelters(), []);
  const { data: facilities } = useData(() => api.getFacilities(), []);
  const { data: routes } = useData(() => api.getRoutes(), []);
  const { data: events } = useData(() => api.getEvents(), []);

  const [layers, setLayers] = useState<LayerVisibility>({
    territories: true, zones: true, routes: true, structures: true,
    stations: true, resources: false, shelters: true, facilities: false, events: true,
  });
  const [levelFilter, setLevelFilter] = useState<Set<ThreatLevel>>(new Set([1, 2, 3, 4, 5]));
  const [hazardFilter, setHazardFilter] = useState<Set<HazardType>>(new Set(HAZARDS));
  const [selection, setSelection] = useState<Selection | null>(null);
  const [cursor, setCursor] = useState<[number, number] | null>(null);
  const [focus, setFocus] = useState<{ coords: [number, number]; zoom?: number } | null>(null);
  const [query, setQuery] = useState('');
  const [online, setOnline] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);

  /* Данные с учётом роли и фильтров */
  const visibleZones = useMemo(
    () => (zones ?? []).filter((z) => inScope(z.territory) && levelFilter.has(z.level) && hazardFilter.has(z.hazard)),
    [zones, levelFilter, hazardFilter, inScope],
  );

  const visibleTerritories = useMemo(
    () => (territories ?? []).filter((t) => inScope(t.code)),
    [territories, inScope],
  );

  const points: MapPoint[] = useMemo(() => {
    if (!structures || !stations || !resources || !shelters || !facilities || !events) return [];
    const all = buildPoints({ structures, stations, resources, shelters, facilities, events });
    // Население не видит служебные ресурсы МЧС (п. 6.2 ТЗ)
    const filtered = roleId === 'public' || roleId === 'akim'
      ? all.filter((p) => p.kind !== 'resource')
      : all;
    return filtered.filter((p) => inScope(p.territory));
  }, [structures, stations, resources, shelters, facilities, events, inScope, roleId]);

  const visibleRoutes = useMemo(
    () => (routes ?? []).filter((r) => {
      const z = zones?.find((x) => x.id === r.from_zone);
      return z ? inScope(z.territory) : true;
    }),
    [routes, zones, inScope],
  );

  /* Первичный вид: вся подведомственная территория целиком */
  const initialFit = useMemo(
    () => (visibleTerritories.length ? visibleTerritories.flatMap((t) => t.geometry) : null),
    [visibleTerritories],
  );

  const toggle = useCallback((k: keyof LayerVisibility) => {
    setLayers((l) => ({ ...l, [k]: !l[k] }));
  }, []);

  const counts: Record<keyof LayerVisibility, number> = {
    territories: visibleTerritories.length,
    zones: visibleZones.length,
    routes: visibleRoutes.length,
    structures: points.filter((p) => p.kind === 'structure').length,
    stations: points.filter((p) => p.kind === 'station').length,
    resources: points.filter((p) => p.kind === 'resource').length,
    shelters: points.filter((p) => p.kind === 'shelter').length,
    facilities: points.filter((p) => p.kind === 'facility').length,
    events: points.filter((p) => p.kind === 'event').length,
  };

  /* Поиск */
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const out: { id: string; name: string; kind: string; icon: string; coords: [number, number]; sel: Selection }[] = [];
    for (const z of visibleZones) {
      if (z.name.toLowerCase().includes(q) || z.id.toLowerCase().includes(q) || z.settlement.toLowerCase().includes(q)) {
        out.push({ id: z.id, name: z.name, kind: hazardLabel[z.hazard], icon: hazardIcon[z.hazard], coords: z.centroid, sel: { kind: 'zone', id: z.id } });
      }
    }
    for (const p of points) {
      if (p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)) {
        out.push({ id: p.id, name: p.name, kind: p.meta, icon: p.icon, coords: p.coords, sel: { kind: p.kind, id: p.id } });
      }
    }
    for (const t of visibleTerritories) {
      if (t.name.toLowerCase().includes(q)) {
        out.push({ id: t.code, name: t.name, kind: 'Территория', icon: 'grid', coords: t.centroid, sel: { kind: 'territory', id: t.code } });
      }
    }
    return out.slice(0, 12);
  }, [query, visibleZones, points, visibleTerritories]);

  const selectAndFly = (sel: Selection, coords: [number, number], zoom = 12) => {
    setSelection(sel);
    setFocus({ coords, zoom });
    setPanelOpen(true);
    setQuery('');
  };

  return (
    <div className="page page--flush" style={{ position: 'relative' }}>
      <MapView
        zones={visibleZones}
        territories={visibleTerritories}
        routes={layers.routes ? visibleRoutes : []}
        points={points}
        layers={layers}
        selection={selection}
        onSelect={(s) => { setSelection(s); setPanelOpen(true); }}
        focus={focus}
        initialFit={initialFit}
        fitPadding={MAP_PADDING}
        onCursor={setCursor}
        onBasemap={setOnline}
      />

      {!online && (
        <div className="map-notice">
          <Icon name="alert" size={13} />
          Сеть недоступна: подложка не загружена. Зоны, объекты и данные отображаются в полном объёме.
        </div>
      )}

      {/* Поиск */}
      <div className="map-hud" style={{ top: 12, left: 12 }}>
        <div className="map-search" style={{ position: 'relative' }}>
          <Icon name="search" size={13} style={{ position: 'absolute', left: 9, top: 8, color: 'var(--text-faint)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск зоны, объекта, территории"
          />
        </div>
        {results.length > 0 && (
          <div className="map-results">
            {results.map((r) => (
              <div key={`${r.sel.kind}-${r.id}`} className="map-result" onClick={() => selectAndFly(r.sel, r.coords)}>
                <Icon name={r.icon} size={13} style={{ color: 'var(--text-faint)' }} />
                <div className="col" style={{ gap: 1, minWidth: 0 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>{r.kind}</span>
                </div>
                <span className="mono" style={{ marginLeft: 'auto', fontSize: 9.5, color: 'var(--text-faint)' }}>{r.id}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Слои и фильтры */}
      <div className="map-hud" style={{ top: 12, left: 284, width: 232 }}>
        <div className="map-legend" style={{ padding: '8px 6px' }}>
          <div className="label" style={{ padding: '2px 8px 6px' }}>Слои карты</div>
          {LAYER_DEFS.map((l) => (
            <div
              key={l.key}
              className={`layer-toggle ${layers[l.key] ? 'on' : ''}`}
              onClick={() => toggle(l.key)}
            >
              <span className="layer-toggle__box">{layers[l.key] && <Icon name="check" size={9} stroke={2.4} />}</span>
              <Icon name={l.icon} size={13} style={{ color: layers[l.key] ? 'var(--accent)' : 'var(--text-faint)' }} />
              <span>{l.label}</span>
              <span className="layer-toggle__n">{counts[l.key]}</span>
            </div>
          ))}

          <div className="divider" style={{ margin: '8px 8px' }} />
          <div className="label" style={{ padding: '0 8px 6px' }}>Уровень угрозы</div>
          <div className="row" style={{ gap: 4, padding: '0 8px 6px' }}>
            {([1, 2, 3, 4, 5] as ThreatLevel[]).map((lv) => {
              const on = levelFilter.has(lv);
              return (
                <button
                  key={lv}
                  onClick={() => setLevelFilter((s) => {
                    const n = new Set(s);
                    n.has(lv) ? n.delete(lv) : n.add(lv);
                    return n;
                  })}
                  title={levelLabel[lv]}
                  style={{
                    flex: 1, height: 22, cursor: 'pointer',
                    background: on ? `color-mix(in srgb, ${levelColor[lv]} 20%, transparent)` : 'transparent',
                    border: `1px solid ${on ? levelColor[lv] : 'var(--line)'}`,
                    borderRadius: 3,
                    color: on ? levelColor[lv] : 'var(--text-faint)',
                    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                  }}
                >
                  {lv}
                </button>
              );
            })}
          </div>

          <div className="label" style={{ padding: '4px 8px 6px' }}>Тип угрозы</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, padding: '0 8px 4px' }}>
            {HAZARDS.map((h) => {
              const on = hazardFilter.has(h);
              return (
                <button
                  key={h}
                  title={hazardLabel[h]}
                  onClick={() => setHazardFilter((s) => {
                    const n = new Set(s);
                    n.has(h) ? n.delete(h) : n.add(h);
                    return n;
                  })}
                  style={{
                    height: 26, cursor: 'pointer', display: 'grid', placeItems: 'center',
                    background: on ? 'var(--accent-dim)' : 'transparent',
                    border: `1px solid ${on ? 'var(--line-accent)' : 'var(--line)'}`,
                    borderRadius: 3,
                    color: on ? 'var(--accent)' : 'var(--text-faint)',
                  }}
                >
                  <Icon name={hazardIcon[h]} size={14} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Легенда */}
      <div className="map-hud" style={{ bottom: 42, left: 12 }}>
        <div className="map-legend">
          <div className="label" style={{ marginBottom: 6 }}>Уровень угрозы</div>
          {([5, 4, 3, 2, 1] as ThreatLevel[]).map((lv) => (
            <div className="legend-row" key={lv}>
              <span
                className="legend-swatch"
                style={{ color: levelColor[lv], background: `color-mix(in srgb, ${levelColor[lv]} 26%, transparent)` }}
              />
              <span className="mono" style={{ color: levelColor[lv] }}>{lv}</span>
              <span>{levelLabel[lv]}</span>
            </div>
          ))}
          <div className="divider" style={{ margin: '7px 0' }} />
          <div className="legend-row">
            <span
              className="legend-swatch"
              style={{
                color: 'var(--text-dim)',
                backgroundImage: 'repeating-linear-gradient(45deg, var(--hatch) 0 1px, transparent 1px 4px)',
              }}
            />
            <span>Данные просрочены</span>
          </div>
          <div className="legend-row">
            <span style={{ width: 14, borderTop: '2px dashed var(--ok)', flexShrink: 0 }} />
            <span>Маршрут эвакуации</span>
          </div>
          <div className="legend-row">
            <span style={{ width: 14, display: 'grid', placeItems: 'center', color: 'var(--danger)' }}>
              <Icon name="events" size={12} />
            </span>
            <span>Очаг события</span>
          </div>
        </div>
      </div>

      {/* Координаты */}
      <div className="map-hud" style={{ bottom: 12, left: 132 }}>
        <div className="map-coords">
          {cursor ? fmtCoord(cursor[0], cursor[1]) : 'наведите курсор на карту'}
        </div>
      </div>

      {/* Панель объекта */}
      {selection && panelOpen && (
        <ObjectPanel
          selection={selection}
          onClose={() => setPanelOpen(false)}
          onNavigate={nav}
          onFocus={(c) => setFocus({ coords: c, zoom: 13 })}
        />
      )}
    </div>
  );
}

/* ---------- Панель выбранного объекта ---------- */

function ObjectPanel({
  selection, onClose, onNavigate, onFocus,
}: {
  selection: Selection;
  onClose: () => void;
  onNavigate: (to: string) => void;
  onFocus: (c: [number, number]) => void;
}) {
  const { data: zones } = useData(() => api.getZones(), []);
  const { data: territories } = useData(() => api.getTerritories(), []);
  const { data: structures } = useData(() => api.getStructures(), []);
  const { data: stations } = useData(() => api.getStations(), []);
  const { data: resources } = useData(() => api.getResources(), []);
  const { data: shelters } = useData(() => api.getShelters(), []);
  const { data: facilities } = useData(() => api.getFacilities(), []);
  const { data: events } = useData(() => api.getEvents(), []);

  let head: { icon: string; color: string; title: string; sub: string } | null = null;
  let body: React.ReactNode = null;
  let foot: React.ReactNode = null;

  if (selection.kind === 'zone') {
    const z = zones?.find((x) => x.id === selection.id);
    if (!z) return null;
    head = { icon: hazardIcon[z.hazard], color: levelColor[z.level], title: z.name, sub: `${z.id} · ${hazardLabel[z.hazard]}` };
    body = (
      <>
        <div className="row" style={{ marginBottom: 12, gap: 8 }}>
          <Level value={z.level} showLabel />
          <div className="spacer" />
          <Badge color={freshnessColor[z.freshness]} dot>{freshnessLabel[z.freshness]}</Badge>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.65, marginBottom: 14 }}>{z.description}</p>
        <KV items={[
          ['Населённый пункт', z.settlement],
          ['Площадь', <span className="num">{num(z.area_ha)} га</span>],
          ['Население в зоне', <span className="num">{num(z.population_at_risk)} чел</span>],
          ['Домохозяйств', <span className="num">{num(z.households)}</span>],
          ['Источник', <span style={{ fontSize: 11.5 }}>{z.source}</span>],
          ['Владелец данных', <span style={{ fontSize: 11.5 }}>{z.owner}</span>],
          ['Версия', <span className="num">{z.version}</span>],
          ['Актуально на', <span>{fmtDate(z.actual_at)} <span className="faint">({fmtAgo(z.actual_at)})</span></span>],
        ]} />
        <div className="divider" />
        <div className="label" style={{ marginBottom: 7 }}>Мониторинг</div>
        <p style={{ fontSize: 11.5, color: 'var(--text-dim)', lineHeight: 1.6 }}>{z.monitoring}</p>
        {z.structures.length > 0 && (
          <>
            <div className="divider" />
            <div className="label" style={{ marginBottom: 7 }}>Защитные сооружения</div>
            {z.structures.map((sid) => {
              const s = structures?.find((x) => x.id === sid);
              if (!s) return null;
              return (
                <div key={sid} className="row" style={{ gap: 8, padding: '5px 0', fontSize: 11.5 }}>
                  <Icon name="structures" size={13} style={{ color: conditionColor[s.condition] }} />
                  <span>{s.name}</span>
                  <span className="spacer" />
                  <span className="num faint">{s.wear_pct} %</span>
                </div>
              );
            })}
          </>
        )}
        <div className="divider" />
        <div className="label" style={{ marginBottom: 7 }}>Документы ({z.docs.length})</div>
        {z.docs.map((d) => (
          <div key={d.id} className="row" style={{ gap: 8, padding: '4px 0', fontSize: 11.5 }}>
            <Icon name={d.kind === 'photo' ? 'image' : 'document'} size={13} style={{ color: 'var(--text-faint)' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</span>
            <span className="spacer" />
            <span className="num faint" style={{ fontSize: 10 }}>{d.size_kb} КБ</span>
          </div>
        ))}
      </>
    );
    foot = (
      <>
        <Button icon="external" variant="primary" onClick={() => onNavigate(`/zones/${z.id}`)}>Открыть карточку</Button>
        <Button icon="crosshair" onClick={() => onFocus(z.centroid)} title="Центрировать" />
      </>
    );
  }

  if (selection.kind === 'territory') {
    const t = territories?.find((x) => x.code === selection.id);
    if (!t) return null;
    const tz = zones?.filter((z) => z.territory === t.code) ?? [];
    head = { icon: 'grid', color: levelColor[t.threat], title: t.name, sub: `Административный центр: ${t.center}` };
    body = (
      <>
        <div className="row" style={{ marginBottom: 12, gap: 8 }}>
          <Level value={t.threat} showLabel />
          {t.pilot && <Badge color="var(--accent)">Пилотный район</Badge>}
        </div>
        <KV items={[
          ['Население', <span className="num">{num(t.population)} чел</span>],
          ['Населённых пунктов', <span className="num">{t.settlements}</span>],
          ['Площадь', <span className="num">{num(t.area_km2)} км²</span>],
          ['Зон риска', <span className="num">{tz.length}</span>],
        ]} />
        <div className="divider" />
        <div className="label" style={{ marginBottom: 7 }}>Зоны риска на территории</div>
        {tz.map((z) => (
          <div
            key={z.id}
            className="row"
            style={{ gap: 8, padding: '6px 0', fontSize: 11.5, cursor: 'pointer' }}
            onClick={() => onFocus(z.centroid)}
          >
            <Icon name={hazardIcon[z.hazard]} size={13} style={{ color: levelColor[z.level] }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{z.name}</span>
            <span className="spacer" />
            <Level value={z.level} size="sm" />
          </div>
        ))}
      </>
    );
  }

  if (selection.kind === 'event') {
    const e = events?.find((x) => x.id === selection.id);
    if (!e) return null;
    head = { icon: 'events', color: levelColor[e.level], title: e.title, sub: `${e.id} · ${e.settlement}` };
    body = (
      <>
        <div className="row" style={{ marginBottom: 12, gap: 8 }}>
          <Level value={e.level} showLabel />
          <div className="spacer" />
          <Badge color={eventStatusColor[e.status]} dot live={e.status === 'active'}>{eventStatusLabel[e.status]}</Badge>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.65, marginBottom: 14 }}>{e.summary}</p>
        <KV items={[
          ['Открыто', <span>{fmtDate(e.started_at)} <span className="faint">({fmtAgo(e.started_at)})</span></span>],
          ['Объявил', <span style={{ fontSize: 11.5 }}>{e.declared_by}</span>],
          ['В зоне поражения', <span className="num">{num(e.consequences.affected)} чел</span>],
          ['Отселено', <span className="num">{num(e.consequences.evacuated)} чел</span>],
          ['Действий', <span className="num">{e.actions.filter((a) => a.status === 'done').length} / {e.actions.length}</span>],
        ]} />
        {e.actions.length > 0 && (
          <>
            <div className="divider" />
            <div className="label" style={{ marginBottom: 7 }}>Выполнение плана действий</div>
            <Meter
              value={e.actions.filter((a) => a.status === 'done').length}
              max={e.actions.length}
              color={levelColor[e.level]}
              height={5}
            />
          </>
        )}
      </>
    );
    foot = <Button icon="external" variant="primary" onClick={() => onNavigate(`/events/${e.id}`)}>Открыть событие</Button>;
  }

  if (selection.kind === 'structure') {
    const s = structures?.find((x) => x.id === selection.id);
    if (!s) return null;
    head = { icon: 'structures', color: conditionColor[s.condition], title: s.name, sub: `${s.id} · ${structureLabel[s.kind]}` };
    body = (
      <>
        <div className="row" style={{ marginBottom: 12 }}>
          <Badge color={conditionColor[s.condition]} dot>{conditionLabel[s.condition]}</Badge>
        </div>
        <div className="label" style={{ marginBottom: 6 }}>Износ конструкции</div>
        <div className="row" style={{ gap: 9, marginBottom: 14 }}>
          <Meter value={s.wear_pct} color={conditionColor[s.condition]} height={5} />
          <span className="num" style={{ color: conditionColor[s.condition], fontSize: 12 }}>{s.wear_pct} %</span>
        </div>
        <KV items={[
          ['Год постройки', <span className="num">{s.built_year}</span>],
          ...(s.length_m ? [['Длина', <span className="num">{num(s.length_m)} м</span>] as [string, React.ReactNode]] : []),
          ...(s.height_m ? [['Высота', <span className="num">{s.height_m} м</span>] as [string, React.ReactNode]] : []),
          ...(s.capacity_m3s ? [['Расчётный расход', <span className="num">{s.capacity_m3s} м³/с</span>] as [string, React.ReactNode]] : []),
          ['Последний ремонт', s.last_repair ? fmtDate(s.last_repair) : '—'],
          ['Следующее обследование', <span style={{ color: new Date(s.next_inspection) < new Date() ? 'var(--danger)' : undefined }}>{fmtDate(s.next_inspection)}</span>],
          ['Балансодержатель', <span style={{ fontSize: 11.5 }}>{s.owner}</span>],
        ]} />
        <div className="divider" />
        <p style={{ fontSize: 11.5, color: 'var(--text-dim)', lineHeight: 1.6 }}>{s.note}</p>
      </>
    );
  }

  if (selection.kind === 'station') {
    const s = stations?.find((x) => x.id === selection.id);
    if (!s) return null;
    const last = s.series[s.series.length - 1];
    head = { icon: 'station', color: stationStatusColor[s.status], title: s.name, sub: `${s.id} · ${s.operator}` };
    body = (
      <>
        <div className="row" style={{ marginBottom: 12 }}>
          <Badge color={stationStatusColor[s.status]} dot live={s.status === 'online'}>{stationStatusLabel[s.status]}</Badge>
          <span className="spacer" />
          <span className="faint" style={{ fontSize: 11 }}>{fmtAgo(s.last_sync)}</span>
        </div>
        {last && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <Reading label="Осадки, час" value={`${last.precip_mm}`} unit="мм" />
            <Reading label="Уровень" value={`${last.level_cm}`} unit="см" />
            <Reading label="Температура" value={`${last.temp_c}`} unit="°C" />
            <Reading label="Влагонасыщение" value={`${last.soil_pct}`} unit="%" />
          </div>
        )}
        <KV items={[
          ['Высота', <span className="num">{num(s.altitude_m)} м</span>],
          ['Река', s.river ?? '—'],
          ['Интервал передачи', <span className="num">{s.interval_min} мин</span>],
          ['Точек в ряду', <span className="num">{s.series.length}</span>],
        ]} />
        {s.errors.length > 0 && (
          <>
            <div className="divider" />
            <div className="label" style={{ marginBottom: 7, color: 'var(--danger)' }}>Ошибки интеграции</div>
            {s.errors.map((e, i) => (
              <div key={i} className="row" style={{ gap: 7, padding: '3px 0', fontSize: 11.5, color: 'var(--text-dim)' }}>
                <Icon name="alert" size={12} style={{ color: 'var(--danger)', marginTop: 2 }} />
                <span>{e}</span>
              </div>
            ))}
          </>
        )}
      </>
    );
    foot = <Button icon="external" variant="primary" onClick={() => onNavigate('/weather')}>Открыть метеоданные</Button>;
  }

  if (selection.kind === 'resource') {
    const r = resources?.find((x) => x.id === selection.id);
    if (!r) return null;
    head = { icon: 'resources', color: r.state === 'deployed' ? 'var(--accent)' : 'var(--ok)', title: r.name, sub: `${r.id} · ${resourceLabel[r.kind]}` };
    body = (
      <>
        <div className="row" style={{ marginBottom: 12 }}>
          <Badge color={r.state === 'deployed' ? 'var(--accent)' : r.state === 'maintenance' ? 'var(--text-dim)' : 'var(--ok)'} dot>
            {resourceStateLabel[r.state]}
          </Badge>
        </div>
        <KV items={[
          ['Место дислокации', r.base],
          ['Личный состав', <span className="num">{r.personnel} чел</span>],
          ['Техника', <span className="num">{r.vehicles} ед</span>],
          ['Время готовности', <span className="num">{r.readiness_min} мин</span>],
          ['Руководитель', r.commander],
        ]} />
      </>
    );
  }

  if (selection.kind === 'shelter') {
    const s = shelters?.find((x) => x.id === selection.id);
    if (!s) return null;
    head = { icon: 'shelter', color: s.occupied > 0 ? 'var(--warn)' : 'var(--text-dim)', title: s.name, sub: `${s.id} · Пункт временного размещения` };
    body = (
      <>
        <div className="label" style={{ marginBottom: 6 }}>Заполнение</div>
        <div className="row" style={{ gap: 9, marginBottom: 14 }}>
          <Meter value={s.occupied} max={s.capacity} color={s.occupied > 0 ? 'var(--warn)' : 'var(--text-dim)'} height={5} />
          <span className="num" style={{ fontSize: 12 }}>{s.occupied} / {s.capacity}</span>
        </div>
        <KV items={[
          ['Ответственный', s.responsible],
          ['Телефон', <span className="num">{s.phone}</span>],
        ]} />
        <div className="divider" />
        <div className="label" style={{ marginBottom: 7 }}>Оснащение</div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 5 }}>
          {s.facilities.map((f) => <span className="tag" key={f}>{f}</span>)}
        </div>
      </>
    );
  }

  if (selection.kind === 'facility') {
    const f = facilities?.find((x) => x.id === selection.id);
    if (!f) return null;
    head = { icon: 'school', color: f.in_zone ? 'var(--lvl-3)' : 'var(--text-dim)', title: f.name, sub: `${f.id} · ${facilityLabel[f.kind]}` };
    body = (
      <KV items={[
        ['Вместимость', f.capacity ? <span className="num">{num(f.capacity)} чел</span> : '—'],
        ['В зоне риска', f.in_zone ?? 'вне зон'],
        ['Ответственный', f.responsible],
        ['Телефон', <span className="num">{f.phone}</span>],
      ]} />
    );
  }

  if (!head) return null;

  return (
    <div className="obj-panel">
      <div className="obj-panel__head">
        <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
          <span
            style={{
              width: 30, height: 30, display: 'grid', placeItems: 'center', flexShrink: 0,
              border: `1px solid ${head.color}`, borderRadius: 4, color: head.color,
              background: `color-mix(in srgb, ${head.color} 14%, transparent)`,
            }}
          >
            <Icon name={head.icon} size={16} />
          </span>
          <div className="col" style={{ gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{head.title}</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-faint)' }}>{head.sub}</span>
          </div>
          <Button icon="close" variant="ghost" size="sm" onClick={onClose} />
        </div>
      </div>
      <div className="obj-panel__body">{body}</div>
      {foot && <div className="obj-panel__foot">{foot}</div>}
    </div>
  );
}

function Reading({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div style={{ padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--line)', borderRadius: 4 }}>
      <div className="label" style={{ fontSize: 9 }}>{label}</div>
      <div className="row" style={{ alignItems: 'baseline', gap: 3, marginTop: 3 }}>
        <span className="num" style={{ fontSize: 17, fontWeight: 600 }}>{value}</span>
        <span className="faint" style={{ fontSize: 10 }}>{unit}</span>
      </div>
    </div>
  );
}
