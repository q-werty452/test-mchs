import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useData, useApp } from '../state/app';
import { Panel, Badge, Level, Button, Loading, Empty, KV, Stat, Meter } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { MapView } from '../map/MapView';
import { buildPoints } from '../map/geo';
import { fmtDate, fmtAgo, num, daysBetween } from '../ui/format';
import {
  hazardLabel, hazardIcon, levelColor, levelLabel, freshnessLabel, freshnessColor,
  conditionLabel, conditionColor, structureLabel,
} from '../data/dicts';
import { territoryName } from '../data/territories';
import type { ThreatLevel } from '../types';
import './screens.css';

const DOC_KIND: Record<string, string> = {
  act: 'Акт', order: 'Приказ', map: 'Картосхема', photo: 'Фотофиксация',
  report: 'Отчёт', protocol: 'Протокол',
};

const ACCESS_LABEL: Record<string, string> = {
  public: 'Открытый', internal: 'Служебный', restricted: 'Ограниченный',
};

export function ZoneDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { can, inScope, actor, toast } = useApp();

  const { data: zone, loading } = useData(() => api.getZone(id), [id]);
  const { data: structures } = useData(() => api.getStructures(), []);
  const { data: events } = useData(() => api.getEvents(), []);
  const { data: facilities } = useData(() => api.getFacilities(), []);
  const { data: routes } = useData(() => api.getRoutes(), []);
  const [busy, setBusy] = useState(false);

  const zoneEvents = useMemo(
    () => (events ?? []).filter((e) => e.zone === id).sort((a, b) => +new Date(b.started_at) - +new Date(a.started_at)),
    [events, id],
  );

  const zoneStructures = useMemo(
    () => (structures ?? []).filter((s) => s.protects.includes(id)),
    [structures, id],
  );

  const zoneFacilities = useMemo(
    () => (facilities ?? []).filter((f) => f.in_zone === id),
    [facilities, id],
  );

  const zoneRoutes = useMemo(() => (routes ?? []).filter((r) => r.from_zone === id), [routes, id]);

  const points = useMemo(() => {
    if (!zone) return [];
    return buildPoints({
      structures: zoneStructures,
      stations: [],
      resources: [],
      shelters: [],
      facilities: zoneFacilities,
      events: zoneEvents.filter((e) => e.status !== 'closed'),
    });
  }, [zone, zoneStructures, zoneFacilities, zoneEvents]);

  if (loading) return <div className="page"><Loading rows={6} height={70} /></div>;
  if (!zone) return <div className="page"><Empty icon="ban" text="Зона не найдена" hint={`Идентификатор ${id} отсутствует в реестре`} /></div>;

  const editable = can('zone.edit') && inScope(zone.territory);

  const changeLevel = async (lv: ThreatLevel) => {
    setBusy(true);
    const res = await api.setZoneLevel(zone.id, lv, actor);
    setBusy(false);
    if (res.ok) toast('ok', `Уровень угрозы зоны ${zone.id} изменён на ${lv}. Действие записано в журнал аудита.`);
    else toast('err', res.reason ?? 'Действие отклонено');
  };

  const damage = zoneEvents.reduce((a, e) => a + e.consequences.damage_som_mln, 0);

  return (
    <div className="page">
      {/* --- Заголовок --- */}
      <div className="row" style={{ gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
        <Button icon="chevronLeft" variant="ghost" onClick={() => nav('/zones')} title="К реестру" />
        <span
          style={{
            width: 40, height: 40, display: 'grid', placeItems: 'center', flexShrink: 0,
            border: `1px solid ${levelColor[zone.level]}`, borderRadius: 5, color: levelColor[zone.level],
            background: `color-mix(in srgb, ${levelColor[zone.level]} 12%, transparent)`,
          }}
        >
          <Icon name={hazardIcon[zone.hazard]} size={20} />
        </span>
        <div className="col" style={{ gap: 3 }}>
          <h2 style={{ fontSize: 17 }}>{zone.name}</h2>
          <div className="row" style={{ gap: 9 }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>{zone.id}</span>
            <span className="faint">·</span>
            <span style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{hazardLabel[zone.hazard]}</span>
            <span className="faint">·</span>
            <span style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{territoryName(zone.territory)}, {zone.settlement}</span>
          </div>
        </div>
        <div className="spacer" />
        <div className="row" style={{ gap: 8 }}>
          <Badge color={freshnessColor[zone.freshness]} dot>{freshnessLabel[zone.freshness]}</Badge>
          <Badge color={zone.status === 'approved' ? 'var(--ok)' : 'var(--warn)'}>
            {zone.status === 'approved' ? 'Утверждено' : zone.status === 'review' ? 'На проверке' : 'Черновик'}
          </Badge>
          <Button icon="map" onClick={() => nav('/map')}>Показать на карте</Button>
        </div>
      </div>

      {/* --- Показатели --- */}
      <div className="page__grid g5" style={{ marginBottom: 12 }}>
        <Stat label="Уровень угрозы" value={zone.level} accent={levelColor[zone.level]} foot={levelLabel[zone.level]} icon="alert" />
        <Stat label="Население в зоне" value={num(zone.population_at_risk)} unit="чел" foot={`${num(zone.households)} домохозяйств`} icon="users" />
        <Stat label="Площадь" value={num(zone.area_ha)} unit="га" foot={`${zoneStructures.length} защитных сооружений`} icon="zones" />
        <Stat
          label="Событий в истории"
          value={zoneEvents.length}
          foot={damage > 0 ? `ущерб ${damage.toFixed(1)} млн сом` : 'ущерб не зафиксирован'}
          icon="history"
        />
        <Stat
          label="Данные подтверждены"
          value={daysBetween(zone.actual_at)}
          unit="дн назад"
          accent={freshnessColor[zone.freshness]}
          foot={fmtDate(zone.actual_at)}
          icon="clock"
        />
      </div>

      <div className="page__grid" style={{ gridTemplateColumns: '1fr 420px', gap: 12, alignItems: 'start' }}>
        <div className="col" style={{ gap: 12 }}>
          {/* --- Карта участка --- */}
          <Panel title="Геометрия участка" icon="map" hud flush>
            <div style={{ height: 320 }}>
              <MapView
                zones={[zone]}
                territories={[]}
                routes={zoneRoutes}
                points={points}
                layers={{
                  territories: false, zones: true, routes: true, structures: true,
                  stations: false, resources: false, shelters: false, facilities: true, events: true,
                }}
                selection={{ kind: 'zone', id: zone.id }}
                onSelect={() => {}}
                fitTo={zone.geometry}
              />
            </div>
          </Panel>

          {/* --- Описание --- */}
          <Panel title="Характеристика участка" icon="document" hud>
            <p style={{ fontSize: 12.5, lineHeight: 1.75, color: 'var(--text-dim)', marginBottom: 14 }}>
              {zone.description}
            </p>
            <div className="label" style={{ marginBottom: 6 }}>Организация мониторинга</div>
            <p style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--text-dim)' }}>{zone.monitoring}</p>
          </Panel>

          {/* --- Обследования --- */}
          <Panel title={`Обследования (${zone.surveys.length})`} icon="list" hud flush>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 120 }}>Дата</th>
                  <th style={{ width: 220 }}>Организация</th>
                  <th>Результат</th>
                  <th style={{ width: 150 }}>Обследование провёл</th>
                </tr>
              </thead>
              <tbody>
                {zone.surveys.map((s, i) => (
                  <tr key={i}>
                    <td className="num" style={{ fontSize: 11 }}>{fmtDate(s.date)}</td>
                    <td style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{s.org}</td>
                    <td style={{ fontSize: 11.5 }}>{s.result}</td>
                    <td style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{s.inspector}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          {/* --- История событий --- */}
          <Panel title={`История событий (${zoneEvents.length})`} icon="history" hud flush>
            {zoneEvents.length === 0 ? (
              <Empty icon="check" text="Событий по участку не зарегистрировано" />
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 128 }}>Событие</th>
                    <th>Наименование</th>
                    <th style={{ width: 110 }}>Начало</th>
                    <th style={{ width: 84 }} className="r">Отселено</th>
                    <th style={{ width: 96 }} className="r">Ущерб, млн</th>
                    <th style={{ width: 44 }} />
                  </tr>
                </thead>
                <tbody>
                  {zoneEvents.map((e) => (
                    <tr key={e.id} className="clickable" onClick={() => nav(`/events/${e.id}`)}>
                      <td className="num" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{e.id}</td>
                      <td>
                        <span className="row" style={{ gap: 7 }}>
                          <Level value={e.level} size="sm" />
                          {e.title}
                        </span>
                      </td>
                      <td className="num" style={{ fontSize: 11 }}>{fmtDate(e.started_at)}</td>
                      <td className="r num">{num(e.consequences.evacuated)}</td>
                      <td className="r num" style={{ color: e.consequences.damage_som_mln > 0 ? 'var(--lvl-3)' : 'var(--text-faint)' }}>
                        {e.consequences.damage_som_mln.toFixed(1)}
                      </td>
                      <td><Icon name="chevronRight" size={13} style={{ color: 'var(--text-faint)' }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>

        {/* --- Правая колонка --- */}
        <div className="col" style={{ gap: 12 }}>
          <Panel title="Учётные сведения" icon="document" hud>
            <KV items={[
              ['Источник данных', <span style={{ fontSize: 11.5 }}>{zone.source}</span>],
              ['Владелец данных', <span style={{ fontSize: 11.5 }}>{zone.owner}</span>],
              ['Версия записи', <span className="num">{zone.version}</span>],
              ['Актуально на', <span>{fmtDate(zone.actual_at)} <span className="faint">({fmtAgo(zone.actual_at)})</span></span>],
              ['Статус записи', zone.status === 'approved' ? 'Утверждено' : zone.status === 'review' ? 'На проверке' : 'Черновик'],
              ['Координаты центра', <span className="num" style={{ fontSize: 11 }}>{zone.centroid[1].toFixed(4)}, {zone.centroid[0].toFixed(4)}</span>],
            ]} />
          </Panel>

          {/* --- Управление уровнем --- */}
          <Panel title="Уровень угрозы" icon="alert" hud>
            <div className="row" style={{ gap: 10, marginBottom: 12 }}>
              <Level value={zone.level} showLabel />
            </div>
            {editable ? (
              <>
                <div className="label" style={{ marginBottom: 7 }}>Изменить уровень</div>
                <div className="row" style={{ gap: 5 }}>
                  {([1, 2, 3, 4, 5] as ThreatLevel[]).map((lv) => (
                    <button
                      key={lv}
                      disabled={busy || lv === zone.level}
                      onClick={() => changeLevel(lv)}
                      style={{
                        flex: 1, height: 30, cursor: lv === zone.level ? 'default' : 'pointer',
                        background: lv === zone.level ? `color-mix(in srgb, ${levelColor[lv]} 22%, transparent)` : 'var(--bg-input)',
                        border: `1px solid ${lv === zone.level ? levelColor[lv] : 'var(--line)'}`,
                        borderRadius: 3, color: lv === zone.level ? levelColor[lv] : 'var(--text-dim)',
                        fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
                        opacity: busy ? 0.5 : 1,
                      }}
                    >
                      {lv}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 9, lineHeight: 1.5 }}>
                  Изменение фиксируется в журнале аудита с указанием пользователя, времени, старого и нового значения.
                </p>
              </>
            ) : (
              <div className="row" style={{ gap: 8, fontSize: 11.5, color: 'var(--text-faint)' }}>
                <Icon name="lock" size={13} />
                <span>Изменение уровня недоступно для текущей роли или территории</span>
              </div>
            )}
          </Panel>

          {/* --- Защитные сооружения --- */}
          <Panel title={`Защитные сооружения (${zoneStructures.length})`} icon="structures" hud>
            {zoneStructures.length === 0 ? (
              <Empty icon="ban" text="Сооружения не числятся" hint="Участок не прикрыт инженерной защитой" />
            ) : (
              zoneStructures.map((s) => (
                <div key={s.id} className="col" style={{ gap: 5, padding: '8px 0', borderBottom: '1px solid var(--line-soft)' }}>
                  <div className="row" style={{ gap: 8 }}>
                    <Icon name="structures" size={14} style={{ color: conditionColor[s.condition] }} />
                    <span style={{ fontSize: 12 }}>{s.name}</span>
                    <span className="spacer" />
                    <Badge color={conditionColor[s.condition]}>{conditionLabel[s.condition]}</Badge>
                  </div>
                  <div className="row" style={{ gap: 9, paddingLeft: 22 }}>
                    <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>{structureLabel[s.kind]} · {s.built_year}</span>
                    <span className="spacer" />
                    <div style={{ width: 60 }}><Meter value={s.wear_pct} color={conditionColor[s.condition]} height={3} /></div>
                    <span className="num" style={{ fontSize: 10.5, color: conditionColor[s.condition] }}>{s.wear_pct}%</span>
                  </div>
                </div>
              ))
            )}
          </Panel>

          {/* --- Социальные объекты --- */}
          {zoneFacilities.length > 0 && (
            <Panel title={`Социальные объекты в зоне (${zoneFacilities.length})`} icon="school" hud>
              {zoneFacilities.map((f) => (
                <div key={f.id} className="row" style={{ gap: 9, padding: '6px 0', borderBottom: '1px solid var(--line-soft)' }}>
                  <Icon name="school" size={13} style={{ color: 'var(--lvl-3)' }} />
                  <div className="col" style={{ gap: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 11.5 }}>{f.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>{f.responsible} · {f.phone}</span>
                  </div>
                  <span className="spacer" />
                  {f.capacity > 0 && <span className="num" style={{ fontSize: 11 }}>{num(f.capacity)}</span>}
                </div>
              ))}
            </Panel>
          )}

          {/* --- Документы --- */}
          <Panel title={`Документы (${zone.docs.length})`} icon="document" hud>
            {zone.docs.map((d) => (
              <div key={d.id} className="row" style={{ gap: 9, padding: '7px 0', borderBottom: '1px solid var(--line-soft)' }}>
                <Icon name={d.kind === 'photo' ? 'image' : 'document'} size={14} style={{ color: 'var(--text-faint)' }} />
                <div className="col" style={{ gap: 1, minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                    {DOC_KIND[d.kind]} · {fmtDate(d.date)} · {ACCESS_LABEL[d.access]}
                  </span>
                </div>
                <span className="num faint" style={{ fontSize: 10 }}>{num(d.size_kb)} КБ</span>
                <Icon name="download" size={13} style={{ color: 'var(--text-faint)' }} />
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}
