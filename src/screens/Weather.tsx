import { useState, useMemo } from 'react';
import { api } from '../api/client';
import { useData, useApp } from '../state/app';
import { Panel, Badge, Button, Loading, Empty, Stat, KV, Segmented } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { AreaChart, Sparkline } from '../ui/charts';
import { fmtDateTime, fmtAgo, num } from '../ui/format';
import { stationStatusLabel, stationStatusColor } from '../data/dicts';
import { territoryName } from '../data/territories';
import { precipSum, lastMeasurement } from '../data/stations';
import './screens.css';

type Metric = 'precip_mm' | 'level_cm' | 'soil_pct' | 'temp_c' | 'wind_ms';

const METRICS: { key: Metric; label: string; unit: string; color: string; kind: 'area' | 'bars'; threshold?: number }[] = [
  { key: 'precip_mm', label: 'Осадки', unit: 'мм/ч', color: 'var(--accent)', kind: 'bars' },
  { key: 'level_cm', label: 'Уровень воды', unit: 'см', color: 'var(--accent)', kind: 'area', threshold: 150 },
  { key: 'soil_pct', label: 'Влагонасыщение грунта', unit: '%', color: 'var(--warn)', kind: 'area', threshold: 72 },
  { key: 'temp_c', label: 'Температура', unit: '°C', color: 'var(--lvl-3)', kind: 'area' },
  { key: 'wind_ms', label: 'Ветер', unit: 'м/с', color: 'var(--text-dim)', kind: 'area' },
];

export function Weather() {
  const { inScope } = useApp();
  const { data: stations, loading } = useData(() => api.getStations(), []);
  const { data: integrations } = useData(() => api.getIntegrations(), []);

  const [sel, setSel] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>('precip_mm');
  const [hours, setHours] = useState<24 | 48 | 72>(48);

  const list = useMemo(() => (stations ?? []).filter((s) => inScope(s.territory)), [stations, inScope]);
  const current = list.find((s) => s.id === sel) ?? list[0] ?? null;

  const online = list.filter((s) => s.status === 'online').length;
  const problems = list.filter((s) => s.status !== 'online');
  const hydro = integrations?.find((i) => i.id === 'INT-HYDRO');

  const shown: Metric = current && !current.river && metric === 'level_cm' ? 'precip_mm' : metric;

  const chartData = useMemo(() => {
    if (!current) return [];
    return current.series.slice(-hours).map((m) => ({ t: m.t, v: m[shown] as number }));
  }, [current, shown, hours]);

  const m = METRICS.find((x) => x.key === shown)!;

  if (loading) return <div className="page"><Loading rows={6} height={70} /></div>;

  return (
    <div className="page">
      <div className="page__grid g4" style={{ marginBottom: 12 }}>
        <Stat label="Станций на связи" value={`${online}/${list.length}`} icon="station" accent={online === list.length ? 'var(--ok)' : 'var(--warn)'} foot="передают данные штатно" />
        <Stat
          label="Проблемные станции"
          value={problems.length}
          icon="alert"
          accent={problems.length ? 'var(--danger)' : 'var(--ok)'}
          foot={problems.map((p) => p.id).join(', ') || 'нет'}
        />
        <Stat
          label="Максимум осадков за 12 ч"
          value={Math.max(0, ...list.map((s) => precipSum(s, 12))).toFixed(1)}
          unit="мм"
          icon="weather"
          accent={list.some((s) => precipSum(s, 12) >= 30) ? 'var(--danger)' : 'var(--accent)'}
          foot="порог правила R-MUD-02: 30 мм"
        />
        <Stat
          label="Интеграция Кыргызгидромет"
          value={hydro?.state === 'ok' ? 'Штатно' : hydro?.state === 'degraded' ? 'Деградация' : 'Недоступно'}
          icon="integrations"
          accent={hydro?.state === 'ok' ? 'var(--ok)' : hydro?.state === 'degraded' ? 'var(--warn)' : 'var(--danger)'}
          foot={hydro ? `${num(hydro.today_errors)} ошибок за сутки` : ''}
        />
      </div>

      <div className="page__grid" style={{ gridTemplateColumns: '340px 1fr', gap: 12, alignItems: 'start' }}>
        {/* --- Список станций --- */}
        <Panel title={`Метеостанции (${list.length})`} icon="station" hud flush>
          {list.map((s) => {
            const last = lastMeasurement(s);
            const p12 = precipSum(s, 12);
            const on = current?.id === s.id;
            return (
              <div
                key={s.id}
                onClick={() => setSel(s.id)}
                style={{
                  padding: '11px 13px', cursor: 'pointer',
                  borderBottom: '1px solid var(--line-soft)',
                  background: on ? 'var(--accent-dim)' : 'transparent',
                  borderLeft: `2px solid ${on ? 'var(--accent)' : 'transparent'}`,
                }}
              >
                <div className="row" style={{ gap: 8, marginBottom: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: stationStatusColor[s.status], flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, fontWeight: on ? 600 : 400 }}>{s.name}</span>
                  <span className="spacer" />
                  <span className="mono" style={{ fontSize: 10, color: 'var(--text-faint)' }}>{s.id}</span>
                </div>
                <div className="row" style={{ gap: 8, fontSize: 10.5, color: 'var(--text-faint)', marginBottom: 6 }}>
                  <span>{territoryName(s.territory)}</span>
                  <span>·</span>
                  <span>{fmtAgo(s.last_sync)}</span>
                </div>
                <div className="row" style={{ gap: 9 }}>
                  {s.series.length > 1 && (
                    <Sparkline
                      values={s.series.slice(-24).map((x) => x.precip_mm)}
                      color={p12 >= 30 ? 'var(--danger)' : 'var(--accent)'}
                      width={110}
                      height={20}
                    />
                  )}
                  <span className="spacer" />
                  {last && (
                    <>
                      <span className="num" style={{ fontSize: 11, color: p12 >= 30 ? 'var(--danger)' : 'var(--text-dim)' }}>
                        {p12} мм/12ч
                      </span>
                      {s.river && (
                        <span className="num" style={{ fontSize: 11, color: last.level_cm >= 150 ? 'var(--warn)' : 'var(--text-faint)' }}>
                          {last.level_cm} см
                        </span>
                      )}
                    </>
                  )}
                </div>
                {s.errors.length > 0 && (
                  <div className="row" style={{ gap: 5, marginTop: 6, fontSize: 10, color: 'var(--danger)' }}>
                    <Icon name="alert" size={10} />
                    {s.errors.length} {s.errors.length === 1 ? 'ошибка' : 'ошибки'} интеграции
                  </div>
                )}
              </div>
            );
          })}
        </Panel>

        {/* --- График --- */}
        <div className="col" style={{ gap: 12 }}>
          {!current ? (
            <Panel><Empty icon="station" text="Станции недоступны для текущей роли" /></Panel>
          ) : (
            <>
              <Panel title="" hud flush>
                <div className="panel__head">
                  <Icon name="station" size={14} style={{ color: stationStatusColor[current.status] }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{current.name}</span>
                  <Badge color={stationStatusColor[current.status]} dot live={current.status === 'online'}>
                    {stationStatusLabel[current.status]}
                  </Badge>
                  <div className="panel__actions">
                    <Segmented
                      value={String(hours) as '24' | '48' | '72'}
                      onChange={(v) => setHours(Number(v) as 24 | 48 | 72)}
                      options={[{ value: '24', label: '24 ч' }, { value: '48', label: '48 ч' }, { value: '72', label: '72 ч' }]}
                    />
                  </div>
                </div>

                <div style={{ padding: '12px 14px 0' }}>
                  <div className="row" style={{ gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                    {METRICS.filter((x) => x.key !== 'level_cm' || current.river).map((x) => {
                      const on = x.key === shown;
                      const last = lastMeasurement(current);
                      return (
                        <button
                          key={x.key}
                          onClick={() => setMetric(x.key)}
                          style={{
                            flex: 1, minWidth: 118, padding: '9px 11px', cursor: 'pointer', textAlign: 'left',
                            background: on ? 'var(--bg-elevated)' : 'var(--bg-input)',
                            border: `1px solid ${on ? x.color : 'var(--line)'}`,
                            borderRadius: 4,
                          }}
                        >
                          <div className="label" style={{ fontSize: 9 }}>{x.label}</div>
                          <div className="row" style={{ alignItems: 'baseline', gap: 3, marginTop: 3 }}>
                            <span className="num" style={{ fontSize: 15, fontWeight: 600, color: on ? x.color : 'var(--text)' }}>
                              {last ? (last[x.key] as number) : '—'}
                            </span>
                            <span className="faint" style={{ fontSize: 9.5 }}>{x.unit}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ padding: '0 14px 14px' }}>
                  <AreaChart
                    data={chartData}
                    height={210}
                    color={m.color}
                    unit={m.unit}
                    kind={m.kind}
                    threshold={m.threshold}
                    thresholdLabel={m.threshold ? `порог ${m.threshold} ${m.unit}` : undefined}
                  />
                </div>
              </Panel>

              <div className="page__grid g2" style={{ alignItems: 'start' }}>
                <Panel title="Паспорт станции" icon="document" hud>
                  <KV items={[
                    ['Идентификатор', <span className="mono">{current.id}</span>],
                    ['Территория', territoryName(current.territory)],
                    ['Высота над уровнем моря', <span className="num">{num(current.altitude_m)} м</span>],
                    ['Река / створ', current.river ?? '—'],
                    ['Оператор', current.operator],
                    ['Интервал передачи', <span className="num">{current.interval_min} мин</span>],
                    ['Последний пакет', <span>{fmtDateTime(current.last_sync)} <span className="faint">({fmtAgo(current.last_sync)})</span></span>],
                    ['Точек в ряду', <span className="num">{current.series.length}</span>],
                    ['Осадки за 6 / 12 / 72 ч', (
                      <span className="num">
                        {precipSum(current, 6)} / {precipSum(current, 12)} / {precipSum(current, 72)} мм
                      </span>
                    )],
                  ]} />
                </Panel>

                <Panel title="Качество данных" icon="alert" hud>
                  {current.errors.length === 0 ? (
                    <Empty icon="check" text="Ошибок не зафиксировано" hint="Ряд полный, задержек передачи нет" />
                  ) : (
                    current.errors.map((e, i) => (
                      <div
                        key={i}
                        className="row"
                        style={{
                          gap: 9, padding: '9px 11px', marginBottom: 7, alignItems: 'flex-start',
                          border: '1px solid var(--danger-line)', borderLeft: '2px solid var(--danger)',
                          borderRadius: 4, background: 'var(--danger-soft)',
                        }}
                      >
                        <Icon name="alert" size={13} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
                        <span style={{ fontSize: 11.5, color: 'var(--text-dim)', lineHeight: 1.55 }}>{e}</span>
                      </div>
                    ))
                  )}

                  {hydro && (
                    <>
                      <div className="divider" />
                      <div className="label" style={{ marginBottom: 7 }}>Состояние интеграции</div>
                      <KV items={[
                        ['Источник', hydro.name],
                        ['Задержка ответа', <span className="num" style={{ color: hydro.latency_ms > 1000 ? 'var(--warn)' : undefined }}>{num(hydro.latency_ms)} мс</span>],
                        ['Запросов за сутки', <span className="num">{num(hydro.today_calls)}</span>],
                        ['Ошибок за сутки', <span className="num" style={{ color: hydro.today_errors ? 'var(--danger)' : undefined }}>{num(hydro.today_errors)}</span>],
                      ]} />
                    </>
                  )}
                </Panel>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
