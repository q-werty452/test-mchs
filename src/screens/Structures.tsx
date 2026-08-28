import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useData, useApp } from '../state/app';
import { Panel, Badge, Button, Loading, Empty, Meter, Stat, KV } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { fmtDate, num, daysBetween } from '../ui/format';
import { conditionLabel, conditionColor, structureLabel } from '../data/dicts';
import { territoryName } from '../data/territories';
import type { StructureCondition } from '../types';
import './screens.css';

export function Structures() {
  const nav = useNavigate();
  const { inScope } = useApp();
  const { data: structures, loading } = useData(() => api.getStructures(), []);
  const { data: zones } = useData(() => api.getZones(), []);

  const [q, setQ] = useState('');
  const [cond, setCond] = useState<StructureCondition | 'all'>('all');
  const [sel, setSel] = useState<string | null>(null);

  const rows = useMemo(() => {
    let list = (structures ?? []).filter((s) => inScope(s.territory));
    const s = q.trim().toLowerCase();
    if (s) list = list.filter((x) => x.name.toLowerCase().includes(s) || x.id.toLowerCase().includes(s) || x.owner.toLowerCase().includes(s));
    if (cond !== 'all') list = list.filter((x) => x.condition === cond);
    return list.slice().sort((a, b) => b.wear_pct - a.wear_pct);
  }, [structures, q, cond, inScope]);

  const all = (structures ?? []).filter((s) => inScope(s.territory));
  const critical = all.filter((s) => s.condition === 'critical');
  const overdueInspection = all.filter((s) => new Date(s.next_inspection) < new Date());
  const avgWear = all.length ? Math.round(all.reduce((a, s) => a + s.wear_pct, 0) / all.length) : 0;

  const current = rows.find((s) => s.id === sel) ?? null;

  return (
    <div className="page page--flush" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="toolbar">
        <div className="search-box">
          <Icon name="search" size={13} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по названию, ID, балансодержателю" />
        </div>
        <select className="select" style={{ width: 220 }} value={cond} onChange={(e) => setCond(e.target.value as StructureCondition | 'all')}>
          <option value="all">Любое состояние</option>
          <option value="good">Исправно</option>
          <option value="satisfactory">Удовлетворительно</option>
          <option value="limited">Ограниченно работоспособно</option>
          <option value="critical">Аварийное</option>
        </select>
        <div className="spacer" />
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>{rows.length} / {all.length}</span>
      </div>

      <div style={{ padding: 16, paddingBottom: 0 }}>
        <div className="page__grid g4" style={{ marginBottom: 12 }}>
          <Stat label="Всего сооружений" value={all.length} icon="structures" foot="на подведомственной территории" />
          <Stat label="В аварийном состоянии" value={critical.length} icon="alert" accent={critical.length ? 'var(--danger)' : 'var(--ok)'} foot="требуют капитального ремонта" />
          <Stat label="Средний износ" value={avgWear} unit="%" icon="activity" accent={avgWear > 55 ? 'var(--lvl-3)' : 'var(--ok)'} foot="по всем объектам" />
          <Stat label="Просрочено обследований" value={overdueInspection.length} icon="clock" accent={overdueInspection.length ? 'var(--warn)' : 'var(--ok)'} foot="по графику контроля" />
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'grid', gridTemplateColumns: current ? '1fr 380px' : '1fr', gap: 12, padding: '0 16px 16px' }}>
        <div className="panel scroll-y" style={{ overflow: 'auto' }}>
          {loading ? (
            <div style={{ padding: 14 }}><Loading rows={8} /></div>
          ) : rows.length === 0 ? (
            <Empty icon="search" text="Ничего не найдено" />
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 78 }}>ID</th>
                  <th>Наименование</th>
                  <th style={{ width: 170 }}>Тип</th>
                  <th style={{ width: 180 }}>Территория</th>
                  <th style={{ width: 64 }} className="r">Год</th>
                  <th style={{ width: 150 }}>Износ</th>
                  <th style={{ width: 190 }}>Состояние</th>
                  <th style={{ width: 130 }}>Обследование</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const late = new Date(s.next_inspection) < new Date();
                  return (
                    <tr
                      key={s.id}
                      className={`clickable ${sel === s.id ? 'selected' : ''}`}
                      onClick={() => setSel(sel === s.id ? null : s.id)}
                    >
                      <td className="num" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{s.id}</td>
                      <td>{s.name}</td>
                      <td style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{structureLabel[s.kind]}</td>
                      <td style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{territoryName(s.territory)}</td>
                      <td className="r num" style={{ color: 'var(--text-dim)' }}>{s.built_year}</td>
                      <td>
                        <div className="row" style={{ gap: 8 }}>
                          <Meter value={s.wear_pct} color={conditionColor[s.condition]} height={3} />
                          <span className="num" style={{ fontSize: 11, width: 30, color: conditionColor[s.condition] }}>{s.wear_pct}%</span>
                        </div>
                      </td>
                      <td><Badge color={conditionColor[s.condition]} dot>{conditionLabel[s.condition]}</Badge></td>
                      <td>
                        <span className="num" style={{ fontSize: 11, color: late ? 'var(--danger)' : 'var(--text-dim)' }}>
                          {late ? `просрочено ${Math.abs(daysBetween(s.next_inspection))} дн` : fmtDate(s.next_inspection)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {current && (
          <div className="col scroll-y" style={{ gap: 12 }}>
            <Panel
              title="Карточка сооружения"
              icon="structures"
              hud
              actions={<Button size="sm" variant="ghost" icon="close" onClick={() => setSel(null)} />}
            >
              <div className="row" style={{ gap: 10, marginBottom: 13, alignItems: 'flex-start' }}>
                <span
                  style={{
                    width: 32, height: 32, display: 'grid', placeItems: 'center', flexShrink: 0,
                    border: `1px solid ${conditionColor[current.condition]}`, borderRadius: 4,
                    color: conditionColor[current.condition],
                    background: `color-mix(in srgb, ${conditionColor[current.condition]} 12%, transparent)`,
                  }}
                >
                  <Icon name="structures" size={17} />
                </span>
                <div className="col" style={{ gap: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{current.name}</span>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>
                    {current.id} · {structureLabel[current.kind]}
                  </span>
                </div>
              </div>

              <div className="label" style={{ marginBottom: 6 }}>Износ конструкции</div>
              <div className="row" style={{ gap: 10, marginBottom: 14 }}>
                <Meter value={current.wear_pct} color={conditionColor[current.condition]} height={6} />
                <span className="num" style={{ fontSize: 14, fontWeight: 600, color: conditionColor[current.condition] }}>
                  {current.wear_pct}%
                </span>
              </div>

              <KV items={[
                ['Состояние', <Badge color={conditionColor[current.condition]} dot>{conditionLabel[current.condition]}</Badge>],
                ['Год постройки', <span className="num">{current.built_year}</span>],
                ...(current.length_m ? [['Длина', <span className="num">{num(current.length_m)} м</span>] as [string, React.ReactNode]] : []),
                ...(current.height_m ? [['Высота', <span className="num">{current.height_m} м</span>] as [string, React.ReactNode]] : []),
                ...(current.capacity_m3s ? [['Расчётный расход', <span className="num">{current.capacity_m3s} м³/с</span>] as [string, React.ReactNode]] : []),
                ['Последний ремонт', current.last_repair ? fmtDate(current.last_repair) : 'не проводился'],
                ['Следующее обследование', (
                  <span className="num" style={{ color: new Date(current.next_inspection) < new Date() ? 'var(--danger)' : undefined }}>
                    {fmtDate(current.next_inspection)}
                  </span>
                )],
                ['Балансодержатель', <span style={{ fontSize: 11.5 }}>{current.owner}</span>],
                ['Территория', territoryName(current.territory)],
              ]} />

              <div className="divider" />
              <div className="label" style={{ marginBottom: 6 }}>Примечание</div>
              <p style={{ fontSize: 11.5, lineHeight: 1.65, color: 'var(--text-dim)' }}>{current.note}</p>
            </Panel>

            <Panel title="Прикрываемые зоны риска" icon="zones" hud>
              {current.protects.length === 0 ? (
                <Empty icon="ban" text="Связей не задано" />
              ) : (
                current.protects.map((zid) => {
                  const z = zones?.find((x) => x.id === zid);
                  if (!z) return null;
                  return (
                    <div
                      key={zid}
                      className="row"
                      style={{ gap: 9, padding: '7px 0', cursor: 'pointer', borderBottom: '1px solid var(--line-soft)' }}
                      onClick={() => nav(`/zones/${zid}`)}
                    >
                      <Icon name="zones" size={14} style={{ color: 'var(--text-faint)' }} />
                      <div className="col" style={{ gap: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 11.5 }}>{z.name}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                          {num(z.population_at_risk)} чел в зоне
                        </span>
                      </div>
                      <span className="spacer" />
                      <Icon name="chevronRight" size={13} style={{ color: 'var(--text-faint)' }} />
                    </div>
                  );
                })
              )}
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}
