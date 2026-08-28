import { useState, useMemo } from 'react';
import { api } from '../api/client';
import { useData } from '../state/app';
import { Panel, Badge, Level, Button, Loading, Empty, Stat, KV } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { fmtDate, num } from '../ui/format';
import { hazardLabel, hazardIcon, levelColor, levelLabel } from '../data/dicts';
import './screens.css';

export function Rules() {
  const { data: rules, loading } = useData(() => api.getRules(), []);
  const { data: evals } = useData(() => api.getRuleEvaluations(), []);
  const { data: stations } = useData(() => api.getStations(), []);
  const [sel, setSel] = useState<string | null>(null);

  const current = rules?.find((r) => r.id === sel) ?? rules?.[0] ?? null;
  const currentEvals = useMemo(
    () => (evals ?? []).filter((e) => e.rule === current?.id),
    [evals, current],
  );

  const triggered = (evals ?? []).filter((e) => e.triggered);
  const activeRules = (rules ?? []).filter((r) => r.active);

  if (loading) return <div className="page"><Loading rows={6} height={70} /></div>;

  return (
    <div className="page">
      <div
        className="row"
        style={{
          gap: 10, padding: '11px 14px', marginBottom: 12, alignItems: 'flex-start',
          border: '1px solid var(--line)', borderLeft: '2px solid var(--accent)',
          borderRadius: 5, background: 'var(--bg-panel)',
        }}
      >
        <Icon name="info" size={15} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
        <div className="col" style={{ gap: 3 }}>
          <span style={{ fontSize: 12.5, fontWeight: 500 }}>Расчёт выполняется детерминированным движком</span>
          <span style={{ fontSize: 11.5, color: 'var(--text-dim)', lineHeight: 1.6 }}>
            Языковая модель в расчёте уровней угрозы не участвует. Правила утверждены приказами, воспроизводимы
            и дают только основание — решение об открытии события и оповещении принимает уполномоченный сотрудник.
          </span>
        </div>
      </div>

      <div className="page__grid g4" style={{ marginBottom: 12 }}>
        <Stat label="Действующих правил" value={activeRules.length} icon="rules" foot={`${(rules ?? []).length - activeRules.length} отключено (не сезон)`} />
        <Stat label="Проверок выполнено" value={(evals ?? []).length} icon="activity" foot="по всем станциям на связи" />
        <Stat label="Порогов превышено" value={triggered.length} icon="alert" accent={triggered.length ? 'var(--danger)' : 'var(--ok)'} foot={triggered.map((t) => t.rule).join(', ') || 'нет'} />
        <Stat label="Станций в расчёте" value={new Set((evals ?? []).map((e) => e.station)).size} icon="station" foot="станции без связи исключены" />
      </div>

      <div className="page__grid" style={{ gridTemplateColumns: '380px 1fr', gap: 12, alignItems: 'start' }}>
        <Panel title="Реестр правил" icon="rules" hud flush>
          {(rules ?? []).map((r) => {
            const on = current?.id === r.id;
            const fired = triggered.some((t) => t.rule === r.id);
            return (
              <div
                key={r.id}
                onClick={() => setSel(r.id)}
                style={{
                  padding: '11px 13px', cursor: 'pointer',
                  borderBottom: '1px solid var(--line-soft)',
                  background: on ? 'var(--accent-dim)' : 'transparent',
                  borderLeft: `2px solid ${on ? 'var(--accent)' : 'transparent'}`,
                  opacity: r.active ? 1 : 0.55,
                }}
              >
                <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                  <Icon name={hazardIcon[r.hazard]} size={14} style={{ color: levelColor[r.level_if_true] }} />
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{r.id}</span>
                  <span className="spacer" />
                  {fired && <Badge color="var(--danger)" dot live>сработало</Badge>}
                  {!r.active && <Badge color="var(--text-faint)">отключено</Badge>}
                </div>
                <div style={{ fontSize: 12, marginBottom: 5 }}>{r.name}</div>
                <div
                  className="mono"
                  style={{
                    fontSize: 10.5, color: 'var(--text-faint)',
                    padding: '4px 7px', background: 'var(--bg-input)',
                    border: '1px solid var(--line)', borderRadius: 3,
                  }}
                >
                  {r.expression}
                </div>
              </div>
            );
          })}
        </Panel>

        {current && (
          <div className="col" style={{ gap: 12 }}>
            <Panel title="Условие и параметры" icon="settings" hud>
              <div className="row" style={{ gap: 11, marginBottom: 14, alignItems: 'flex-start' }}>
                <span
                  style={{
                    width: 34, height: 34, display: 'grid', placeItems: 'center', flexShrink: 0,
                    border: `1px solid ${levelColor[current.level_if_true]}`, borderRadius: 4,
                    color: levelColor[current.level_if_true],
                    background: `color-mix(in srgb, ${levelColor[current.level_if_true]} 12%, transparent)`,
                  }}
                >
                  <Icon name={hazardIcon[current.hazard]} size={17} />
                </span>
                <div className="col" style={{ gap: 3 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{current.name}</span>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>
                    {current.id} · {hazardLabel[current.hazard]}
                  </span>
                </div>
                <div className="spacer" />
                <div className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
                  <span className="label">Присваиваемый уровень</span>
                  <Level value={current.level_if_true} showLabel />
                </div>
              </div>

              <div
                className="mono"
                style={{
                  fontSize: 13, padding: '13px 15px', marginBottom: 14,
                  background: 'var(--bg-input)', border: '1px solid var(--line-accent)',
                  borderRadius: 4, color: 'var(--accent)', letterSpacing: '0.01em',
                }}
              >
                ЕСЛИ {current.expression} → уровень {current.level_if_true} ({levelLabel[current.level_if_true].toLowerCase()})
              </div>

              <div className="label" style={{ marginBottom: 8 }}>Утверждённые параметры</div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 100 }}>Обозначение</th>
                    <th>Наименование</th>
                    <th style={{ width: 110 }} className="r">Значение</th>
                    <th style={{ width: 70 }}>Ед. изм.</th>
                  </tr>
                </thead>
                <tbody>
                  {current.params.map((p) => (
                    <tr key={p.key}>
                      <td className="num" style={{ color: 'var(--accent)' }}>{p.key}</td>
                      <td>{p.label}</td>
                      <td className="r num" style={{ fontSize: 13, fontWeight: 600 }}>{p.value}</td>
                      <td style={{ color: 'var(--text-dim)' }}>{p.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="divider" />
              <KV items={[
                ['Основание', <span style={{ fontSize: 11.5 }}>{current.approved_by}</span>],
                ['Документ', <span style={{ fontSize: 11.5 }}>{current.doc}</span>],
                ['Утверждено', fmtDate(current.approved_at)],
                ['Состояние', current.active
                  ? <Badge color="var(--ok)" dot>Действует</Badge>
                  : <Badge color="var(--text-faint)">Отключено вне сезона</Badge>],
              ]} />
            </Panel>

            <Panel
              title={`Расчёт по станциям (${currentEvals.length})`}
              icon="activity"
              hud
              flush
              actions={<Badge color="var(--text-dim)">детерминированный расчёт, без LLM</Badge>}
            >
              {currentEvals.length === 0 ? (
                <Empty
                  icon="ban"
                  text="Правило не применяется к текущим данным"
                  hint={current.active
                    ? 'Нет станций с подходящим типом наблюдений или данные поступают отдельным потоком'
                    : 'Правило отключено вне сезона'}
                />
              ) : (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 90 }}>Станция</th>
                      <th style={{ width: 200 }}>Наименование</th>
                      <th>Входные значения</th>
                      <th style={{ width: 120 }}>Условие</th>
                      <th style={{ width: 90 }} className="r">Уровень</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEvals.map((e, i) => {
                      const st = stations?.find((s) => s.id === e.station);
                      return (
                        <tr key={i} style={e.triggered ? { background: 'var(--danger-soft)' } : undefined}>
                          <td className="num" style={{ color: 'var(--text-dim)' }}>{e.station}</td>
                          <td style={{ fontSize: 11.5 }}>{st?.name ?? '—'}</td>
                          <td>
                            <div className="row" style={{ gap: 7, flexWrap: 'wrap' }}>
                              {Object.entries(e.inputs).map(([k, v]) => {
                                const over = current.params.some((p) => v >= p.value);
                                return (
                                  <span className="tag" key={k}>
                                    {k}: <span className="num" style={{ color: over ? 'var(--danger)' : 'var(--text)' }}>{v}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td>
                            {e.triggered ? (
                              <Badge color="var(--danger)" dot>выполнено</Badge>
                            ) : (
                              <span className="row" style={{ gap: 6, fontSize: 11, color: 'var(--text-faint)' }}>
                                <Icon name="check" size={11} />не выполнено
                              </span>
                            )}
                          </td>
                          <td className="r">
                            {e.triggered ? <Level value={e.computed_level} size="sm" /> : <span className="faint">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}
