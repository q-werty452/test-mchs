import { useState, useMemo } from 'react';
import { api } from '../api/client';
import { useData, useApp } from '../state/app';
import { Panel, Badge, Button, Loading, Empty, Stat, KV, Meter, Segmented } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { MapView } from '../map/MapView';
import { buildPoints } from '../map/geo';
import { BarList } from '../ui/charts';
import { num, plural } from '../ui/format';
import { resourceLabel, resourceStateLabel } from '../data/dicts';
import { territoryName } from '../data/territories';
import './screens.css';

const RESOURCE_ICON: Record<string, string> = {
  fire: 'fire', rescue: 'rescue', medical: 'medical', engineering: 'engineering', police: 'police',
};

const ROUTE_CONDITION: Record<string, [string, string]> = {
  open: ['Открыт', 'var(--ok)'],
  limited: ['Ограниченно проходим', 'var(--warn)'],
  blocked: ['Перекрыт', 'var(--danger)'],
};

export function Resources() {
  const { inScope, roleId } = useApp();
  const { data: resources, loading } = useData(() => api.getResources(), []);
  const { data: routes } = useData(() => api.getRoutes(), []);
  const { data: shelters } = useData(() => api.getShelters(), []);
  const { data: zones } = useData(() => api.getZones(), []);

  const [tab, setTab] = useState<'units' | 'routes' | 'shelters'>('units');

  const restricted = roleId === 'public' || roleId === 'akim';

  const units = useMemo(() => (resources ?? []).filter((r) => inScope(r.territory)), [resources, inScope]);
  const myShelters = useMemo(() => (shelters ?? []).filter((s) => inScope(s.territory)), [shelters, inScope]);
  const myRoutes = useMemo(() => {
    return (routes ?? []).filter((r) => {
      const z = zones?.find((x) => x.id === r.from_zone);
      return z ? inScope(z.territory) : true;
    });
  }, [routes, zones, inScope]);

  const points = useMemo(() => {
    if (!resources || !shelters) return [];
    return buildPoints({
      structures: [], stations: [], resources: restricted ? [] : units,
      shelters: myShelters, facilities: [], events: [],
    });
  }, [resources, shelters, units, myShelters, restricted]);

  const ready = units.filter((u) => u.state === 'ready');
  const deployed = units.filter((u) => u.state === 'deployed');
  const personnel = units.reduce((a, u) => a + u.personnel, 0);
  const vehicles = units.reduce((a, u) => a + u.vehicles, 0);
  const shelterCapacity = myShelters.reduce((a, s) => a + s.capacity, 0);
  const shelterOccupied = myShelters.reduce((a, s) => a + s.occupied, 0);

  const byKind = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of units) m.set(u.kind, (m.get(u.kind) ?? 0) + u.personnel);
    return Array.from(m.entries())
      .map(([k, v]) => ({ label: resourceLabel[k as keyof typeof resourceLabel], value: v }))
      .sort((a, b) => b.value - a.value);
  }, [units]);

  if (loading) return <div className="page"><Loading rows={6} height={70} /></div>;

  return (
    <div className="page">
      {restricted && (
        <div
          className="row"
          style={{
            gap: 9, padding: '10px 13px', marginBottom: 12,
            border: '1px solid var(--warn-line)', borderLeft: '2px solid var(--warn)',
            borderRadius: 4, background: 'var(--warn-soft)',
          }}
        >
          <Icon name="lock" size={14} style={{ color: 'var(--warn)' }} />
          <span style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
            Служебные силы и средства МЧС скрыты для текущей роли. Доступны маршруты эвакуации и пункты размещения.
          </span>
        </div>
      )}

      <div className="page__grid g4" style={{ marginBottom: 12 }}>
        <Stat
          label="Подразделений"
          value={restricted ? '—' : units.length}
          icon="resources"
          foot={restricted ? 'скрыто для роли' : `${ready.length} в готовности, ${deployed.length} задействовано`}
        />
        <Stat
          label="Личный состав"
          value={restricted ? '—' : num(personnel)}
          unit={restricted ? '' : 'чел'}
          icon="users"
          foot={restricted ? 'скрыто для роли' : `${vehicles} единиц техники`}
        />
        <Stat
          label="Пункты размещения"
          value={myShelters.length}
          icon="shelter"
          foot={`вместимость ${num(shelterCapacity)} чел`}
        />
        <Stat
          label="Размещено"
          value={num(shelterOccupied)}
          unit="чел"
          icon="user"
          accent={shelterOccupied ? 'var(--warn)' : 'var(--ok)'}
          foot={shelterCapacity ? `заполнение ${Math.round((shelterOccupied / shelterCapacity) * 100)} %` : ''}
        />
      </div>

      <div className="page__grid" style={{ gridTemplateColumns: '1fr 480px', gap: 12, alignItems: 'start' }}>
        <div className="col" style={{ gap: 12 }}>
          <Panel title="" hud flush>
            <div className="panel__head">
              <Segmented
                value={tab}
                onChange={setTab}
                options={[
                  { value: 'units', label: `Силы и средства (${restricted ? 0 : units.length})`, icon: 'resources' },
                  { value: 'routes', label: `Маршруты (${myRoutes.length})`, icon: 'route' },
                  { value: 'shelters', label: `ПВР (${myShelters.length})`, icon: 'shelter' },
                ]}
              />
            </div>

            {tab === 'units' && (
              restricted ? (
                <Empty icon="lock" text="Данные скрыты" hint="Служебные ресурсы МЧС недоступны для текущей роли" />
              ) : (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 66 }}>ID</th>
                      <th>Подразделение</th>
                      <th style={{ width: 210 }}>Тип</th>
                      <th style={{ width: 165 }}>Территория</th>
                      <th style={{ width: 74 }} className="r">Л/с</th>
                      <th style={{ width: 74 }} className="r">Техника</th>
                      <th style={{ width: 84 }} className="r">Готовн.</th>
                      <th style={{ width: 150 }}>Состояние</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((u) => (
                      <tr key={u.id}>
                        <td className="num" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{u.id}</td>
                        <td>
                          <div className="col" style={{ gap: 2 }}>
                            <span className="row" style={{ gap: 7 }}>
                              <Icon
                                name={RESOURCE_ICON[u.kind]}
                                size={13}
                                style={{ color: u.state === 'deployed' ? 'var(--accent)' : 'var(--ok)' }}
                              />
                              {u.name}
                            </span>
                            <span style={{ fontSize: 10.5, color: 'var(--text-faint)', paddingLeft: 20 }}>
                              {u.base} · {u.commander}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{resourceLabel[u.kind]}</td>
                        <td style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{territoryName(u.territory)}</td>
                        <td className="r num">{u.personnel}</td>
                        <td className="r num" style={{ color: 'var(--text-dim)' }}>{u.vehicles}</td>
                        <td className="r num" style={{ color: u.readiness_min > 20 ? 'var(--warn)' : 'var(--text-dim)' }}>
                          {u.readiness_min} мин
                        </td>
                        <td>
                          <Badge
                            color={u.state === 'deployed' ? 'var(--accent)' : u.state === 'maintenance' ? 'var(--text-dim)' : 'var(--ok)'}
                            dot
                            live={u.state === 'deployed'}
                          >
                            {resourceStateLabel[u.state]}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {tab === 'routes' && (
              myRoutes.length === 0 ? (
                <Empty icon="route" text="Маршруты не заданы" />
              ) : (
                <div style={{ padding: 14 }}>
                  {myRoutes.map((r) => {
                    const [label, color] = ROUTE_CONDITION[r.condition];
                    const shelter = myShelters.find((s) => s.id === r.to_shelter);
                    return (
                      <div
                        key={r.id}
                        className="col"
                        style={{
                          gap: 8, padding: '12px 14px', marginBottom: 8,
                          border: '1px solid var(--line)', borderLeft: `2px solid ${color}`,
                          borderRadius: 4, background: 'var(--bg-input)',
                        }}
                      >
                        <div className="row" style={{ gap: 9 }}>
                          <Icon name="route" size={15} style={{ color }} />
                          <span style={{ fontSize: 12.5, fontWeight: 500 }}>{r.name}</span>
                          <span className="spacer" />
                          <Badge color={color} dot>{label}</Badge>
                        </div>
                        <div className="row" style={{ gap: 14, fontSize: 11, color: 'var(--text-faint)', flexWrap: 'wrap' }}>
                          <span className="mono">{r.id}</span>
                          <span className="row" style={{ gap: 4 }}>
                            <Icon name="zones" size={11} />из зоны {r.from_zone}
                          </span>
                          <span className="row" style={{ gap: 4 }}>
                            <Icon name="shelter" size={11} />{shelter?.name ?? r.to_shelter}
                          </span>
                          <span className="num">{r.length_km} км</span>
                          <span className="num">пропускная способность {num(r.capacity_per_h)} чел/ч</span>
                        </div>
                        <span style={{ fontSize: 11.5, color: 'var(--text-dim)', lineHeight: 1.55 }}>{r.note}</span>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {tab === 'shelters' && (
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 66 }}>ID</th>
                    <th>Пункт временного размещения</th>
                    <th style={{ width: 165 }}>Территория</th>
                    <th style={{ width: 180 }}>Заполнение</th>
                    <th style={{ width: 210 }}>Оснащение</th>
                    <th style={{ width: 190 }}>Ответственный</th>
                  </tr>
                </thead>
                <tbody>
                  {myShelters.map((s) => (
                    <tr key={s.id}>
                      <td className="num" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{s.id}</td>
                      <td>
                        <span className="row" style={{ gap: 7 }}>
                          <Icon name="shelter" size={13} style={{ color: s.occupied ? 'var(--warn)' : 'var(--text-faint)' }} />
                          {s.name}
                        </span>
                      </td>
                      <td style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{territoryName(s.territory)}</td>
                      <td>
                        <div className="row" style={{ gap: 8 }}>
                          <Meter value={s.occupied} max={s.capacity} color={s.occupied ? 'var(--warn)' : 'var(--text-dim)'} height={3} />
                          <span className="num" style={{ fontSize: 11, width: 58, textAlign: 'right' }}>
                            {s.occupied}/{s.capacity}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                          {s.facilities.map((f) => <span className="tag" key={f} style={{ fontSize: 9.5 }}>{f}</span>)}
                        </div>
                      </td>
                      <td>
                        <div className="col" style={{ gap: 1 }}>
                          <span style={{ fontSize: 11.5 }}>{s.responsible}</span>
                          <span className="num" style={{ fontSize: 10, color: 'var(--text-faint)' }}>{s.phone}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>

        <div className="col" style={{ gap: 12 }}>
          <Panel title="Дислокация" icon="map" hud flush>
            <div style={{ height: 340 }}>
              <MapView
                zones={[]}
                territories={[]}
                routes={myRoutes}
                points={points}
                layers={{
                  territories: false, zones: false, routes: true, structures: false,
                  stations: false, resources: !restricted, shelters: true, facilities: false, events: false,
                }}
                selection={null}
                onSelect={() => {}}
                fitTo={points.map((p) => p.coords)}
              />
            </div>
          </Panel>

          {!restricted && (
            <Panel title="Личный состав по типам" icon="users" hud>
              <BarList items={byKind} unit=" чел" />
            </Panel>
          )}

          <Panel title="Готовность к реагированию" icon="activity" hud>
            <KV items={[
              ['Подразделений в готовности', <span className="num" style={{ color: 'var(--ok)' }}>{restricted ? '—' : ready.length}</span>],
              ['Задействовано', <span className="num" style={{ color: 'var(--accent)' }}>{restricted ? '—' : deployed.length}</span>],
              ['На обслуживании', <span className="num" style={{ color: 'var(--text-dim)' }}>{restricted ? '—' : units.filter((u) => u.state === 'maintenance').length}</span>],
              ['Среднее время готовности', <span className="num">{restricted || units.length === 0 ? '—' : `${Math.round(units.reduce((a, u) => a + u.readiness_min, 0) / units.length)} мин`}</span>],
              ['Свободных мест в ПВР', <span className="num">{num(shelterCapacity - shelterOccupied)}</span>],
              ['Маршрутов открыто', <span className="num">{myRoutes.filter((r) => r.condition === 'open').length} из {myRoutes.length}</span>],
            ]} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
