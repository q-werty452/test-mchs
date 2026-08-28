import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useData, useApp } from '../state/app';
import { Panel, Badge, Level, Button, Loading, Empty, Segmented, Stat, Meter } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { BarList } from '../ui/charts';
import { fmtDate, fmtAgo, num, plural } from '../ui/format';
import {
  hazardLabel, hazardIcon, levelColor, eventStatusLabel, eventStatusColor,
} from '../data/dicts';
import { territoryName } from '../data/territories';
import { NewEventDialog } from './NewEventDialog';
import type { EventStatus } from '../types';
import './screens.css';

export function Events() {
  const nav = useNavigate();
  const { inScope, can } = useApp();
  const { data: events, loading } = useData(() => api.getEvents(), []);

  const [tab, setTab] = useState<'open' | 'closed' | 'all'>('open');
  const [q, setQ] = useState('');
  const [dialog, setDialog] = useState(false);

  const all = useMemo(() => (events ?? []).filter((e) => inScope(e.territory)), [events, inScope]);

  const rows = useMemo(() => {
    let list = all;
    if (tab === 'open') list = list.filter((e) => e.status !== 'closed');
    if (tab === 'closed') list = list.filter((e) => e.status === 'closed');
    const s = q.trim().toLowerCase();
    if (s) list = list.filter((e) => e.title.toLowerCase().includes(s) || e.id.toLowerCase().includes(s) || e.settlement.toLowerCase().includes(s));
    return list.slice().sort((a, b) => +new Date(b.started_at) - +new Date(a.started_at));
  }, [all, tab, q]);

  const open = all.filter((e) => e.status !== 'closed');
  const closed = all.filter((e) => e.status === 'closed');
  const totalDamage = closed.reduce((a, e) => a + e.consequences.damage_som_mln, 0);
  const totalEvacuated = all.reduce((a, e) => a + e.consequences.evacuated, 0);

  const byHazard = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of all) m.set(e.hazard, (m.get(e.hazard) ?? 0) + 1);
    return Array.from(m.entries())
      .map(([k, v]) => ({ label: hazardLabel[k as keyof typeof hazardLabel], value: v }))
      .sort((a, b) => b.value - a.value);
  }, [all]);

  return (
    <div className="page page--flush" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="toolbar">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'open', label: `Открытые (${open.length})` },
            { value: 'closed', label: `Закрытые (${closed.length})` },
            { value: 'all', label: 'Все' },
          ]}
        />
        <div className="search-box">
          <Icon name="search" size={13} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по названию, ID, населённому пункту" />
        </div>
        <div className="spacer" />
        <Button
          icon="plus"
          variant="primary"
          disabled={!can('event.create')}
          title={can('event.create') ? 'Открыть новое событие' : 'Недоступно для текущей роли'}
          onClick={() => setDialog(true)}
        >
          Создать событие
        </Button>
      </div>

      <div className="scroll-y" style={{ flex: 1, padding: 16 }}>
        <div className="page__grid g4" style={{ marginBottom: 12 }}>
          <Stat label="Открытых событий" value={open.length} icon="events" accent={open.some((e) => e.status === 'active') ? 'var(--danger)' : 'var(--warn)'} foot={`${open.filter((e) => e.status === 'active').length} в активной фазе`} />
          <Stat label="Закрыто за период" value={closed.length} icon="check" foot="с отчётами и подтверждениями" />
          <Stat label="Отселено всего" value={num(totalEvacuated)} unit="чел" icon="users" foot="по всем событиям в реестре" />
          <Stat label="Ущерб по закрытым" value={totalDamage.toFixed(1)} unit="млн сом" icon="activity" accent="var(--lvl-3)" foot="суммарно" />
        </div>

        <div className="page__grid" style={{ gridTemplateColumns: '1fr 320px', gap: 12, alignItems: 'start' }}>
          <div className="col" style={{ gap: 10 }}>
            {loading ? (
              <Loading rows={6} height={72} />
            ) : rows.length === 0 ? (
              <Panel><Empty icon="search" text="Событий не найдено" /></Panel>
            ) : (
              rows.map((e) => {
                const done = e.actions.filter((a) => a.status === 'done').length;
                const overdue = e.actions.filter((a) => a.status === 'overdue').length;
                return (
                  <div key={e.id} className="card" onClick={() => nav(`/events/${e.id}`)} style={{ padding: '13px 15px' }}>
                    <span className="card__icon" style={{ color: levelColor[e.level], width: 34, height: 34 }}>
                      <Icon name={hazardIcon[e.hazard]} size={17} />
                    </span>
                    <div className="col" style={{ gap: 6, minWidth: 0, flex: 1 }}>
                      <div className="row" style={{ gap: 9 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 500 }}>{e.title}</span>
                        <Level value={e.level} size="sm" />
                        <span className="spacer" />
                        <Badge color={eventStatusColor[e.status]} dot live={e.status === 'active'}>
                          {eventStatusLabel[e.status]}
                        </Badge>
                      </div>

                      <div className="row" style={{ gap: 12, fontSize: 11, color: 'var(--text-faint)', flexWrap: 'wrap' }}>
                        <span className="mono">{e.id}</span>
                        <span>{hazardLabel[e.hazard]}</span>
                        <span>{territoryName(e.territory)}, {e.settlement}</span>
                        <span className="row" style={{ gap: 4 }}>
                          <Icon name="clock" size={11} />
                          {fmtDate(e.started_at)} · {fmtAgo(e.started_at)}
                        </span>
                        {e.closed_at && (
                          <span className="row" style={{ gap: 4, color: 'var(--ok)' }}>
                            <Icon name="check" size={11} />закрыто {fmtDate(e.closed_at)}
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: 11.5, color: 'var(--text-dim)', lineHeight: 1.6 }}>{e.summary}</p>

                      <div className="row" style={{ gap: 14, fontSize: 11, flexWrap: 'wrap' }}>
                        {e.consequences.affected > 0 && (
                          <span className="row" style={{ gap: 5, color: 'var(--text-dim)' }}>
                            <Icon name="users" size={11} />
                            <span className="num">{num(e.consequences.affected)}</span> в зоне
                          </span>
                        )}
                        {e.consequences.evacuated > 0 && (
                          <span className="row" style={{ gap: 5, color: 'var(--warn)' }}>
                            <Icon name="shelter" size={11} />
                            <span className="num">{num(e.consequences.evacuated)}</span> отселено
                          </span>
                        )}
                        {e.consequences.fatalities > 0 && (
                          <span className="row" style={{ gap: 5, color: 'var(--danger)' }}>
                            <Icon name="alert" size={11} />
                            <span className="num">{e.consequences.fatalities}</span> погибших
                          </span>
                        )}
                        {e.consequences.damage_som_mln > 0 && (
                          <span className="row" style={{ gap: 5, color: 'var(--lvl-3)' }}>
                            <span className="num">{e.consequences.damage_som_mln.toFixed(1)}</span> млн сом
                          </span>
                        )}
                        {e.actions.length > 0 && (
                          <span className="row" style={{ gap: 7, marginLeft: 'auto', minWidth: 140 }}>
                            <Meter value={done} max={e.actions.length} color={levelColor[e.level]} height={3} />
                            <span className="num" style={{ fontSize: 10, color: 'var(--text-faint)' }}>{done}/{e.actions.length}</span>
                            {overdue > 0 && (
                              <span className="row" style={{ gap: 3, fontSize: 10, color: 'var(--danger)' }}>
                                <Icon name="clock" size={10} />{overdue}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <Icon name="chevronRight" size={15} style={{ color: 'var(--text-faint)', alignSelf: 'center' }} />
                  </div>
                );
              })
            )}
          </div>

          <div className="col" style={{ gap: 12 }}>
            <Panel title="Распределение по типу угрозы" icon="activity" hud>
              <BarList items={byHazard} />
            </Panel>
            <Panel title="Последствия по реестру" icon="alert" hud>
              <BarList
                items={[
                  { label: 'Отселено, чел', value: totalEvacuated, color: 'var(--warn)' },
                  { label: 'Повреждено домов', value: all.reduce((a, e) => a + e.consequences.houses_damaged, 0), color: 'var(--lvl-3)' },
                  { label: 'Пострадало, чел', value: all.reduce((a, e) => a + e.consequences.injured, 0), color: 'var(--danger)' },
                  { label: 'Погибших', value: all.reduce((a, e) => a + e.consequences.fatalities, 0), color: 'var(--lvl-5)' },
                ]}
              />
              <div className="divider" />
              <div className="row" style={{ justifyContent: 'space-between', fontSize: 11.5 }}>
                <span className="dim">Дорог повреждено</span>
                <span className="num">{all.reduce((a, e) => a + e.consequences.roads_km, 0).toFixed(1)} км</span>
              </div>
            </Panel>
          </div>
        </div>
      </div>

      {dialog && <NewEventDialog onClose={() => setDialog(false)} onCreated={(id: string) => { setDialog(false); nav(`/events/${id}`); }} />}
    </div>
  );
}
