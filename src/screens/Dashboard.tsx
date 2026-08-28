import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useData, useApp } from '../state/app';
import { Panel, Stat, Badge, Level, LevelBar, Button, Loading, Empty, Meter } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { Sparkline, BarList } from '../ui/charts';
import { fmtAgo, fmtDateTime, num, daysBetween, plural } from '../ui/format';
import {
  levelColor, levelLabel, hazardLabel, hazardIcon, eventStatusLabel, eventStatusColor,
  freshnessColor, stationStatusColor, stationStatusLabel,
} from '../data/dicts';
import { precipSum } from '../data/stations';
import './screens.css';

export function Dashboard() {
  const nav = useNavigate();
  const { inScope } = useApp();

  const { data: zones, loading: lz } = useData(() => api.getZones(), []);
  const { data: events } = useData(() => api.getEvents(), []);
  const { data: territories } = useData(() => api.getTerritories(), []);
  const { data: stations } = useData(() => api.getStations(), []);
  const { data: notifications } = useData(() => api.getNotifications(), []);
  const { data: structures } = useData(() => api.getStructures(), []);
  const { data: evals } = useData(() => api.getRuleEvaluations(), []);

  const myZones = useMemo(() => (zones ?? []).filter((z) => inScope(z.territory)), [zones, inScope]);
  const myEvents = useMemo(() => (events ?? []).filter((e) => inScope(e.territory)), [events, inScope]);
  const myTerr = useMemo(() => (territories ?? []).filter((t) => inScope(t.code)), [territories, inScope]);

  const open = myEvents.filter((e) => e.status === 'active' || e.status === 'monitoring');
  const active = myEvents.filter((e) => e.status === 'active');
  const critical = myZones.filter((z) => z.level >= 4);
  const overdue = myZones.filter((z) => z.freshness === 'overdue');
  const aging = myZones.filter((z) => z.freshness === 'aging');
  const pending = (notifications ?? []).filter((n) => n.status === 'awaiting_approval' && inScope(n.territory));
  const atRisk = myZones.reduce((a, z) => a + z.population_at_risk, 0);
  const triggered = (evals ?? []).filter((e) => e.triggered);
  const badStructures = (structures ?? []).filter((s) => inScope(s.territory) && (s.condition === 'critical' || s.condition === 'limited'));

  if (lz) return <div className="page"><Loading rows={6} height={80} /></div>;

  return (
    <div className="page">
      {/* --- Показатели --- */}
      <div className="page__grid g5" style={{ marginBottom: 12 }}>
        <Stat
          label="Активных событий"
          value={active.length}
          icon="events"
          accent={active.length ? 'var(--danger)' : 'var(--ok)'}
          foot={open.length > active.length ? `ещё ${open.length - active.length} в наблюдении` : 'событий в наблюдении нет'}
        />
        <Stat
          label="Зон уровня 4–5"
          value={critical.length}
          icon="zones"
          accent={critical.length ? 'var(--lvl-4)' : 'var(--ok)'}
          foot={`всего зон: ${myZones.length}`}
        />
        <Stat
          label="Население в зонах"
          value={num(atRisk)}
          unit="чел"
          icon="users"
          foot={`${myTerr.length} ${plural(myTerr.length, 'территория', 'территории', 'территорий')}`}
        />
        <Stat
          label="Просрочено данных"
          value={overdue.length}
          icon="clock"
          accent={overdue.length ? 'var(--danger)' : 'var(--ok)'}
          foot={`требуют обновления: ${aging.length}`}
        />
        <Stat
          label="Ждут подтверждения"
          value={pending.length}
          icon="notifications"
          accent={pending.length ? 'var(--warn)' : 'var(--text-dim)'}
          foot="уведомления"
        />
      </div>

      <div className="page__grid" style={{ gridTemplateColumns: '1fr 1fr 380px', gap: 12, alignItems: 'start' }}>
        {/* --- Обстановка по территориям --- */}
        <Panel
          title="Обстановка по территориям"
          icon="grid"
          hud
          actions={<Button size="sm" variant="ghost" icon="map" onClick={() => nav('/map')}>На карту</Button>}
        >
          {myTerr
            .slice()
            .sort((a, b) => b.threat - a.threat || b.population - a.population)
            .map((t) => {
              const tz = myZones.filter((z) => z.territory === t.code);
              const tev = open.filter((e) => e.territory === t.code);
              return (
                <div className="terr-row" key={t.code} onClick={() => nav('/map')}>
                  <div className="col" style={{ gap: 2, minWidth: 0 }}>
                    <span className="row" style={{ gap: 6, fontSize: 12.5 }}>
                      {t.name}
                      {t.pilot && <span className="tag" style={{ color: 'var(--accent)', borderColor: 'var(--line-accent)' }}>Pilot</span>}
                    </span>
                    <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>
                      {num(t.population)} чел · {tz.length} {plural(tz.length, 'зона', 'зоны', 'зон')}
                      {tev.length > 0 && <span style={{ color: 'var(--danger)' }}> · {tev.length} событ.</span>}
                    </span>
                  </div>
                  <LevelBar value={t.threat} />
                  <span style={{ fontSize: 11, color: levelColor[t.threat] }}>{levelLabel[t.threat]}</span>
                  <Level value={t.threat} size="sm" />
                </div>
              );
            })}
        </Panel>

        {/* --- Открытые события --- */}
        <Panel
          title="Открытые события"
          icon="events"
          hud
          actions={<Button size="sm" variant="ghost" icon="list" onClick={() => nav('/events')}>Все события</Button>}
        >
          {open.length === 0 ? (
            <Empty icon="check" text="Открытых событий нет" hint="Все зарегистрированные события закрыты" />
          ) : (
            <div className="col" style={{ gap: 8 }}>
              {open.map((e) => {
                const done = e.actions.filter((a) => a.status === 'done').length;
                const overdueActions = e.actions.filter((a) => a.status === 'overdue').length;
                return (
                  <div key={e.id} className="card" onClick={() => nav(`/events/${e.id}`)}>
                    <span className="card__icon" style={{ color: levelColor[e.level] }}>
                      <Icon name={hazardIcon[e.hazard]} size={15} />
                    </span>
                    <div className="col" style={{ gap: 4, minWidth: 0, flex: 1 }}>
                      <div className="row" style={{ gap: 7 }}>
                        <span className="card__title">{e.title}</span>
                        <span className="spacer" />
                        <Badge color={eventStatusColor[e.status]} dot live={e.status === 'active'}>
                          {eventStatusLabel[e.status]}
                        </Badge>
                      </div>
                      <span className="card__meta">
                        {e.id} · {e.settlement} · {fmtAgo(e.started_at)}
                      </span>
                      {e.actions.length > 0 && (
                        <div className="row" style={{ gap: 8, marginTop: 3 }}>
                          <Meter value={done} max={e.actions.length} color={levelColor[e.level]} height={3} />
                          <span className="num" style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                            {done}/{e.actions.length}
                          </span>
                          {overdueActions > 0 && (
                            <span className="row" style={{ gap: 3, fontSize: 10, color: 'var(--danger)' }}>
                              <Icon name="clock" size={10} />{overdueActions}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        {/* --- Правый столбец --- */}
        <div className="col" style={{ gap: 12 }}>
          <Panel title="Сработавшие правила" icon="rules" hud>
            {triggered.length === 0 ? (
              <Empty icon="check" text="Порогов не превышено" />
            ) : (
              <div className="col" style={{ gap: 8 }}>
                {triggered.map((t, i) => {
                  const st = stations?.find((s) => s.id === t.station);
                  return (
                    <div
                      key={i}
                      className="card"
                      style={{ borderColor: 'var(--danger-line)' }}
                      onClick={() => nav('/rules')}
                    >
                      <span className="card__icon" style={{ color: levelColor[t.computed_level] }}>
                        <Icon name="alert" size={15} />
                      </span>
                      <div className="col" style={{ gap: 3, minWidth: 0 }}>
                        <span className="card__title">{t.rule}</span>
                        <span className="card__meta">{st?.name ?? t.station}</span>
                        <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                          {Object.entries(t.inputs).map(([k, v]) => (
                            <span key={k} className="tag">
                              {k}: <span className="num" style={{ color: 'var(--danger)' }}>{v}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel title="Свежесть данных" icon="clock" hud>
            <BarList
              items={[
                { label: 'Актуальные', value: myZones.filter((z) => z.freshness === 'actual').length, color: 'var(--ok)' },
                { label: 'Требуют обновления', value: aging.length, color: 'var(--warn)' },
                { label: 'Просрочены', value: overdue.length, color: 'var(--danger)' },
              ]}
              max={myZones.length}
            />
            {overdue.length > 0 && (
              <>
                <div className="divider" />
                {overdue.map((z) => (
                  <div
                    key={z.id}
                    className="row"
                    style={{ gap: 8, padding: '5px 0', fontSize: 11.5, cursor: 'pointer' }}
                    onClick={() => nav(`/zones/${z.id}`)}
                  >
                    <Icon name={hazardIcon[z.hazard]} size={13} style={{ color: freshnessColor[z.freshness] }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{z.name}</span>
                    <span className="spacer" />
                    <span className="num" style={{ fontSize: 10, color: 'var(--danger)' }}>
                      {daysBetween(z.actual_at)} дн
                    </span>
                  </div>
                ))}
              </>
            )}
          </Panel>
        </div>
      </div>

      {/* --- Нижний ряд --- */}
      <div className="page__grid g3" style={{ marginTop: 12, alignItems: 'start' }}>
        <Panel
          title="Метеостанции"
          icon="station"
          hud
          actions={<Button size="sm" variant="ghost" icon="external" onClick={() => nav('/weather')}>Подробно</Button>}
        >
          {(stations ?? []).filter((s) => inScope(s.territory)).map((s) => {
            const p12 = precipSum(s, 12);
            const values = s.series.slice(-24).map((m) => m.precip_mm);
            return (
              <div key={s.id} className="row" style={{ gap: 10, padding: '7px 0', borderBottom: '1px solid var(--line-soft)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: stationStatusColor[s.status], flexShrink: 0 }} />
                <div className="col" style={{ gap: 1, minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: 12 }}>{s.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                    {stationStatusLabel[s.status]} · {fmtAgo(s.last_sync)}
                  </span>
                </div>
                {values.length > 1 && <Sparkline values={values} color={p12 >= 30 ? 'var(--danger)' : 'var(--accent)'} width={80} height={22} />}
                <div className="col" style={{ alignItems: 'flex-end', gap: 1, width: 62 }}>
                  <span className="num" style={{ fontSize: 12, color: p12 >= 30 ? 'var(--danger)' : 'var(--text)' }}>{p12} мм</span>
                  <span style={{ fontSize: 9, color: 'var(--text-faint)' }}>за 12 ч</span>
                </div>
              </div>
            );
          })}
        </Panel>

        <Panel
          title="Сооружения, требующие внимания"
          icon="structures"
          hud
          actions={<Button size="sm" variant="ghost" icon="external" onClick={() => nav('/structures')}>Все</Button>}
        >
          {badStructures.length === 0 ? (
            <Empty icon="check" text="Все сооружения в исправном состоянии" />
          ) : (
            badStructures.map((s) => (
              <div key={s.id} className="row" style={{ gap: 10, padding: '7px 0', borderBottom: '1px solid var(--line-soft)' }}>
                <Icon name="structures" size={14} style={{ color: s.condition === 'critical' ? 'var(--danger)' : 'var(--lvl-3)' }} />
                <div className="col" style={{ gap: 1, minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>{s.id} · {s.owner}</span>
                </div>
                <div style={{ width: 60 }}>
                  <Meter value={s.wear_pct} color={s.condition === 'critical' ? 'var(--danger)' : 'var(--lvl-3)'} height={3} />
                </div>
                <span className="num" style={{ fontSize: 11, width: 34, textAlign: 'right', color: s.condition === 'critical' ? 'var(--danger)' : 'var(--lvl-3)' }}>
                  {s.wear_pct}%
                </span>
              </div>
            ))
          )}
        </Panel>

        <Panel
          title="Уведомления, ожидающие подтверждения"
          icon="notifications"
          hud
          actions={<Button size="sm" variant="ghost" icon="external" onClick={() => nav('/notifications')}>Открыть</Button>}
        >
          {pending.length === 0 ? (
            <Empty icon="check" text="Подтверждений не требуется" />
          ) : (
            <div className="col" style={{ gap: 8 }}>
              {pending.map((n) => (
                <div key={n.id} className="card" onClick={() => nav('/notifications')}>
                  <span className="card__icon" style={{ color: 'var(--warn)' }}><Icon name="notifications" size={15} /></span>
                  <div className="col" style={{ gap: 3, minWidth: 0 }}>
                    <span className="card__title">{n.subject}</span>
                    <span className="card__meta">{n.id} · {num(n.recipients_total)} получателей · {fmtDateTime(n.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
