import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useData, useApp } from '../state/app';
import { Panel, Badge, Level, Button, Loading, Empty, KV, Stat, Meter, Segmented } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { MapView } from '../map/MapView';
import { buildPoints } from '../map/geo';
import { NotificationDialog } from './NotificationDialog';
import { fmtDate, fmtDateTime, fmtTime, fmtAgo, num } from '../ui/format';
import {
  hazardLabel, hazardIcon, levelColor, levelLabel, eventStatusLabel, eventStatusColor,
  actionStatusLabel, actionStatusColor, resourceLabel, notificationStatusLabel, notificationStatusColor,
} from '../data/dicts';
import { territoryName } from '../data/territories';
import type { ActionStatus, EventStatus } from '../types';
import './screens.css';

export function EventDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { can, actor, toast } = useApp();

  const { data: event, loading } = useData(() => api.getEvent(id), [id]);
  const { data: zones } = useData(() => api.getZones(), []);
  const { data: resources } = useData(() => api.getResources(), []);
  const { data: notifications } = useData(() => api.getNotifications(), []);
  const { data: routes } = useData(() => api.getRoutes(), []);
  const { data: shelters } = useData(() => api.getShelters(), []);

  const [tab, setTab] = useState<'plan' | 'timeline'>('plan');
  const [dialog, setDialog] = useState(false);
  const [addForm, setAddForm] = useState(false);
  const [newAction, setNewAction] = useState({ title: '', assignee: '', org: '', dueHours: 6 });
  const [busy, setBusy] = useState(false);

  const zone = zones?.find((z) => z.id === event?.zone);
  const eventNotifications = useMemo(
    () => (notifications ?? []).filter((n) => n.event === id),
    [notifications, id],
  );
  const eventResources = useMemo(
    () => (resources ?? []).filter((r) => event?.resources.includes(r.id)),
    [resources, event],
  );
  const eventRoutes = useMemo(
    () => (routes ?? []).filter((r) => r.from_zone === event?.zone),
    [routes, event],
  );

  const points = useMemo(() => {
    if (!event) return [];
    return buildPoints({
      structures: [],
      stations: [],
      resources: eventResources,
      shelters: (shelters ?? []).filter((s) => eventRoutes.some((r) => r.to_shelter === s.id)),
      facilities: [],
      events: [event],
    });
  }, [event, eventResources, shelters, eventRoutes]);

  if (loading) return <div className="page"><Loading rows={6} height={70} /></div>;
  if (!event) return <div className="page"><Empty icon="ban" text="Событие не найдено" hint={`Идентификатор ${id} отсутствует в реестре`} /></div>;

  const done = event.actions.filter((a) => a.status === 'done').length;
  const overdue = event.actions.filter((a) => a.status === 'overdue').length;
  const closed = event.status === 'closed';

  const cycleStatus = async (actionId: string, current: ActionStatus) => {
    const next: ActionStatus =
      current === 'pending' ? 'in_progress' : current === 'in_progress' ? 'done' : current === 'overdue' ? 'done' : 'pending';
    await api.setActionStatus(event.id, actionId, next, actor);
    toast('ok', `Статус действия обновлён: ${actionStatusLabel[next]}`);
  };

  const changeEventStatus = async (s: EventStatus) => {
    setBusy(true);
    const res = await api.setEventStatus(event.id, s, actor);
    setBusy(false);
    if (res.ok) toast('ok', `Статус события изменён: ${eventStatusLabel[s]}`);
    else toast('err', res.reason ?? 'Действие отклонено');
  };

  const addAction = async () => {
    if (!newAction.title.trim()) return;
    setBusy(true);
    await api.addAction(event.id, newAction, actor);
    setBusy(false);
    setNewAction({ title: '', assignee: '', org: '', dueHours: 6 });
    setAddForm(false);
    toast('ok', 'Действие назначено и внесено в план');
  };

  return (
    <div className="page">
      {/* --- Заголовок --- */}
      <div className="row" style={{ gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
        <Button icon="chevronLeft" variant="ghost" onClick={() => nav('/events')} title="К списку событий" />
        <span
          style={{
            position: 'relative',
            width: 40, height: 40, display: 'grid', placeItems: 'center', flexShrink: 0,
            border: `1px solid ${levelColor[event.level]}`, borderRadius: 5, color: levelColor[event.level],
            background: `color-mix(in srgb, ${levelColor[event.level]} 12%, transparent)`,
          }}
        >
          <Icon name={hazardIcon[event.hazard]} size={20} />
          {event.status === 'active' && (
            <span
              style={{
                position: 'absolute', inset: -1, borderRadius: 5,
                border: `1px solid ${levelColor[event.level]}`,
                animation: 'pulse-ring 2.4s ease-out infinite',
              }}
            />
          )}
        </span>
        <div className="col" style={{ gap: 3 }}>
          <h2 style={{ fontSize: 17 }}>{event.title}</h2>
          <div className="row" style={{ gap: 9, flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>{event.id}</span>
            <span className="faint">·</span>
            <span style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{hazardLabel[event.hazard]}</span>
            <span className="faint">·</span>
            <span style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{territoryName(event.territory)}, {event.settlement}</span>
            <span className="faint">·</span>
            <span style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>открыто {fmtDateTime(event.started_at)}</span>
          </div>
        </div>
        <div className="spacer" />
        <div className="row" style={{ gap: 8 }}>
          <Level value={event.level} showLabel />
          <Badge color={eventStatusColor[event.status]} dot live={event.status === 'active'}>
            {eventStatusLabel[event.status]}
          </Badge>
        </div>
      </div>

      {/* --- Панель действий --- */}
      {!closed && (
        <div
          className="row"
          style={{
            gap: 8, marginBottom: 14, padding: '10px 14px',
            border: '1px solid var(--line)', borderRadius: 5, background: 'var(--bg-panel)',
            flexWrap: 'wrap',
          }}
        >
          <span className="label">Управление событием</span>
          <div className="divider" style={{ width: 1, height: 18, margin: '0 4px' }} />

          {event.status === 'monitoring' && (
            <Button icon="alert" variant="danger" disabled={busy} onClick={() => changeEventStatus('active')}>
              Перевести в активную фазу
            </Button>
          )}
          {event.status === 'active' && (
            <Button icon="shield" disabled={busy} onClick={() => changeEventStatus('contained')}>
              Локализовано
            </Button>
          )}
          {(event.status === 'contained' || event.status === 'active') && (
            <Button icon="check" disabled={busy || !can('event.close')} title={can('event.close') ? '' : 'Закрытие доступно только областному МЧС'} onClick={() => changeEventStatus('closed')}>
              Закрыть событие
            </Button>
          )}

          <div className="spacer" />

          <Button
            icon="notifications"
            variant="primary"
            disabled={!can('notification.draft')}
            title={can('notification.draft') ? '' : 'Недоступно для текущей роли'}
            onClick={() => setDialog(true)}
          >
            Сформировать уведомление
          </Button>
          <Button icon="map" onClick={() => nav('/map')}>Показать на карте</Button>
        </div>
      )}

      {/* --- Показатели --- */}
      <div className="page__grid g5" style={{ marginBottom: 12 }}>
        <Stat label="В зоне воздействия" value={num(event.consequences.affected)} unit="чел" icon="users" foot={zone ? `зона ${zone.id}` : 'зона не указана'} />
        <Stat label="Отселено" value={num(event.consequences.evacuated)} unit="чел" icon="shelter" accent={event.consequences.evacuated ? 'var(--warn)' : undefined} foot="в пункты размещения" />
        <Stat
          label="План действий"
          value={`${done}/${event.actions.length}`}
          icon="list"
          accent={overdue > 0 ? 'var(--danger)' : done === event.actions.length && event.actions.length > 0 ? 'var(--ok)' : undefined}
          foot={overdue > 0 ? `${overdue} просрочено` : 'выполнено в срок'}
        />
        <Stat label="Задействовано сил" value={eventResources.length} icon="resources" foot={`${eventResources.reduce((a, r) => a + r.personnel, 0)} чел личного состава`} />
        <Stat label="Уведомлений" value={eventNotifications.length} icon="notifications" foot={`${eventNotifications.filter((n) => n.status === 'delivered').length} доставлено`} />
      </div>

      <div className="page__grid" style={{ gridTemplateColumns: '1fr 420px', gap: 12, alignItems: 'start' }}>
        <div className="col" style={{ gap: 12 }}>
          {/* --- План действий / хронология --- */}
          <Panel
            title=""
            hud
            flush
          >
            <div className="panel__head">
              <Segmented
                value={tab}
                onChange={setTab}
                options={[
                  { value: 'plan', label: `План действий (${event.actions.length})`, icon: 'list' },
                  { value: 'timeline', label: `Хронология (${event.timeline.length})`, icon: 'history' },
                ]}
              />
              <div className="panel__actions">
                {tab === 'plan' && !closed && (
                  <Button size="sm" icon="plus" onClick={() => setAddForm((v) => !v)}>Назначить действие</Button>
                )}
              </div>
            </div>

            <div style={{ padding: 14 }}>
              {tab === 'plan' ? (
                <>
                  {addForm && (
                    <div
                      className="col"
                      style={{
                        gap: 9, padding: 13, marginBottom: 12,
                        border: '1px solid var(--line-accent)', borderRadius: 5, background: 'var(--bg-input)',
                      }}
                    >
                      <span className="label">Новое действие</span>
                      <input
                        className="input"
                        placeholder="Содержание действия"
                        value={newAction.title}
                        onChange={(e) => setNewAction({ ...newAction, title: e.target.value })}
                      />
                      <div className="row" style={{ gap: 8 }}>
                        <input
                          className="input"
                          placeholder="Ответственный"
                          value={newAction.assignee}
                          onChange={(e) => setNewAction({ ...newAction, assignee: e.target.value })}
                        />
                        <input
                          className="input"
                          placeholder="Организация"
                          value={newAction.org}
                          onChange={(e) => setNewAction({ ...newAction, org: e.target.value })}
                        />
                        <select
                          className="select"
                          style={{ width: 130 }}
                          value={newAction.dueHours}
                          onChange={(e) => setNewAction({ ...newAction, dueHours: Number(e.target.value) })}
                        >
                          <option value={2}>Срок: 2 ч</option>
                          <option value={6}>Срок: 6 ч</option>
                          <option value={12}>Срок: 12 ч</option>
                          <option value={24}>Срок: 24 ч</option>
                        </select>
                      </div>
                      <div className="row" style={{ gap: 7 }}>
                        <Button variant="primary" icon="check" disabled={busy || !newAction.title.trim()} onClick={addAction}>
                          Назначить
                        </Button>
                        <Button onClick={() => setAddForm(false)}>Отмена</Button>
                      </div>
                    </div>
                  )}

                  {event.actions.length === 0 ? (
                    <Empty icon="list" text="План действий не сформирован" hint="Назначьте действия и ответственных исполнителей" />
                  ) : (
                    event.actions.map((a) => (
                      <div
                        key={a.id}
                        className="action-row"
                        style={{ borderLeftColor: actionStatusColor[a.status] }}
                      >
                        <button
                          onClick={() => !closed && cycleStatus(a.id, a.status)}
                          title={closed ? 'Событие закрыто' : 'Изменить статус'}
                          style={{
                            width: 20, height: 20, flexShrink: 0, cursor: closed ? 'default' : 'pointer',
                            display: 'grid', placeItems: 'center', borderRadius: 3,
                            border: `1px solid ${actionStatusColor[a.status]}`,
                            background: a.status === 'done' ? actionStatusColor[a.status] : 'transparent',
                            color: a.status === 'done' ? 'var(--bg-panel)' : actionStatusColor[a.status],
                          }}
                        >
                          {a.status === 'done' && <Icon name="check" size={11} stroke={2.6} />}
                          {a.status === 'in_progress' && <Icon name="play" size={9} />}
                          {a.status === 'overdue' && <Icon name="clock" size={11} />}
                        </button>

                        <div className="col" style={{ gap: 3, minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: 12.5, textDecoration: a.status === 'done' ? 'line-through' : 'none', color: a.status === 'done' ? 'var(--text-dim)' : 'var(--text)' }}>
                            {a.title}
                          </span>
                          <div className="row" style={{ gap: 10, fontSize: 10.5, color: 'var(--text-faint)', flexWrap: 'wrap' }}>
                            <span className="mono">{a.id}</span>
                            <span className="row" style={{ gap: 4 }}><Icon name="user" size={10} />{a.assignee}</span>
                            <span>{a.org}</span>
                            <span className="row" style={{ gap: 4, color: a.status === 'overdue' ? 'var(--danger)' : undefined }}>
                              <Icon name="clock" size={10} />срок {fmtDateTime(a.due)}
                            </span>
                            {a.completed_at && (
                              <span className="row" style={{ gap: 4, color: 'var(--ok)' }}>
                                <Icon name="check" size={10} />{fmtDateTime(a.completed_at)}
                              </span>
                            )}
                          </div>
                          {a.note && (
                            <span style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>{a.note}</span>
                          )}
                        </div>

                        <Badge color={actionStatusColor[a.status]}>{actionStatusLabel[a.status]}</Badge>
                      </div>
                    ))
                  )}

                  {event.actions.length > 0 && (
                    <div className="row" style={{ gap: 10, marginTop: 12 }}>
                      <span className="label">Выполнение</span>
                      <Meter value={done} max={event.actions.length} color={overdue > 0 ? 'var(--warn)' : 'var(--ok)'} height={5} />
                      <span className="num" style={{ fontSize: 12 }}>{Math.round((done / event.actions.length) * 100)} %</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="tl">
                  {event.timeline.slice().reverse().map((t, i) => (
                    <div key={i} className={`tl-item tl-item--${t.kind}`}>
                      <div className="row" style={{ gap: 9 }}>
                        <span className="tl-time">{fmtDateTime(t.t)}</span>
                        <span className="tl-actor">{t.actor}</span>
                      </div>
                      <div className="tl-text">{t.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>

          {/* --- Карта --- */}
          <Panel title="Обстановка в районе события" icon="map" hud flush>
            <div style={{ height: 300 }}>
              <MapView
                zones={zone ? [zone] : []}
                territories={[]}
                routes={eventRoutes}
                points={points}
                layers={{
                  territories: false, zones: true, routes: true, structures: false,
                  stations: false, resources: true, shelters: true, facilities: false, events: true,
                }}
                selection={null}
                onSelect={() => {}}
                focus={{ coords: event.coords, zoom: 11.5 }}
              />
            </div>
          </Panel>
        </div>

        {/* --- Правая колонка --- */}
        <div className="col" style={{ gap: 12 }}>
          <Panel title="Обстановка" icon="info" hud>
            <p style={{ fontSize: 12.5, lineHeight: 1.75, color: 'var(--text-dim)' }}>{event.summary}</p>
            <div className="divider" />
            <KV items={[
              ['Открыто', <span>{fmtDateTime(event.started_at)} <span className="faint">({fmtAgo(event.started_at)})</span></span>],
              ['Объявил', <span style={{ fontSize: 11.5 }}>{event.declared_by}</span>],
              ...(event.closed_at ? [['Закрыто', fmtDateTime(event.closed_at)] as [string, React.ReactNode]] : []),
              ['Зона риска', zone ? (
                <span
                  className="row"
                  style={{ gap: 6, cursor: 'pointer', color: 'var(--accent)' }}
                  onClick={() => nav(`/zones/${zone.id}`)}
                >
                  {zone.id}<Icon name="external" size={11} />
                </span>
              ) : '—'],
              ...(event.report ? [['Отчёт', <span style={{ fontSize: 11.5 }}>{event.report}</span>] as [string, React.ReactNode]] : []),
            ]} />
          </Panel>

          <Panel title="Последствия" icon="alert" hud>
            <div className="page__grid g2" style={{ gap: 8 }}>
              <Fact label="В зоне" value={num(event.consequences.affected)} unit="чел" />
              <Fact label="Отселено" value={num(event.consequences.evacuated)} unit="чел" color={event.consequences.evacuated ? 'var(--warn)' : undefined} />
              <Fact label="Пострадало" value={String(event.consequences.injured)} unit="чел" color={event.consequences.injured ? 'var(--lvl-3)' : undefined} />
              <Fact label="Погибло" value={String(event.consequences.fatalities)} unit="чел" color={event.consequences.fatalities ? 'var(--danger)' : undefined} />
              <Fact label="Домов повреждено" value={String(event.consequences.houses_damaged)} unit="ед" />
              <Fact label="Дорог" value={event.consequences.roads_km.toFixed(1)} unit="км" />
            </div>
            {event.consequences.damage_som_mln > 0 && (
              <>
                <div className="divider" />
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="label">Оценка ущерба</span>
                  <span className="num" style={{ fontSize: 15, color: 'var(--lvl-3)' }}>
                    {event.consequences.damage_som_mln.toFixed(1)} млн сом
                  </span>
                </div>
              </>
            )}
          </Panel>

          <Panel title={`Задействованные силы (${eventResources.length})`} icon="resources" hud>
            {eventResources.length === 0 ? (
              <Empty icon="ban" text="Силы не задействованы" />
            ) : (
              eventResources.map((r) => (
                <div key={r.id} className="row" style={{ gap: 9, padding: '7px 0', borderBottom: '1px solid var(--line-soft)' }}>
                  <Icon name="resources" size={14} style={{ color: r.state === 'deployed' ? 'var(--accent)' : 'var(--ok)' }} />
                  <div className="col" style={{ gap: 1, minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: 11.5 }}>{r.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>{resourceLabel[r.kind]} · {r.commander}</span>
                  </div>
                  <span className="num" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{r.personnel} чел</span>
                </div>
              ))
            )}
          </Panel>

          <Panel
            title={`Уведомления по событию (${eventNotifications.length})`}
            icon="notifications"
            hud
            actions={<Button size="sm" variant="ghost" icon="external" onClick={() => nav('/notifications')}>Журнал</Button>}
          >
            {eventNotifications.length === 0 ? (
              <Empty icon="notifications" text="Уведомлений не формировалось" hint="Сформируйте черновик по утверждённому шаблону" />
            ) : (
              eventNotifications.map((n) => (
                <div
                  key={n.id}
                  className="col"
                  style={{ gap: 4, padding: '8px 0', borderBottom: '1px solid var(--line-soft)', cursor: 'pointer' }}
                  onClick={() => nav('/notifications')}
                >
                  <div className="row" style={{ gap: 8 }}>
                    <span style={{ fontSize: 11.5, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.subject}
                    </span>
                    <span className="spacer" />
                    <Badge color={notificationStatusColor[n.status]} dot>{notificationStatusLabel[n.status]}</Badge>
                  </div>
                  <div className="row" style={{ gap: 9, fontSize: 10, color: 'var(--text-faint)' }}>
                    <span className="mono">{n.id}</span>
                    <span>{num(n.recipients_total)} получателей</span>
                    <span>{fmtTime(n.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </Panel>
        </div>
      </div>

      {dialog && <NotificationDialog event={event} onClose={() => setDialog(false)} />}
    </div>
  );
}

function Fact({ label, value, unit, color }: { label: string; value: string; unit: string; color?: string }) {
  return (
    <div style={{ padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--line)', borderRadius: 4 }}>
      <div className="label" style={{ fontSize: 9 }}>{label}</div>
      <div className="row" style={{ alignItems: 'baseline', gap: 3, marginTop: 3 }}>
        <span className="num" style={{ fontSize: 16, fontWeight: 600, color: color ?? 'var(--text)' }}>{value}</span>
        <span className="faint" style={{ fontSize: 10 }}>{unit}</span>
      </div>
    </div>
  );
}
