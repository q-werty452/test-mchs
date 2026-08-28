import { useId, useRef, useState, useLayoutEffect } from 'react';
import { fmtTime } from './format';

/** Ширина контейнера в пикселях: график рисуется без масштабирования,
    иначе preserveAspectRatio растягивает подписи вместе с холстом. */
function useWidth<T extends HTMLElement>(): [React.RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(entry.contentRect.width));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/* Графики нарисованы собственным SVG: полный контроль над стилем,
   единая палитра со всем интерфейсом, никаких внешних зависимостей. */

interface SeriesPoint { t: string; v: number }

/** Компактная линия без осей — для таблиц и плиток. */
export function Sparkline({
  values, width = 96, height = 26, color = 'var(--accent)', fill = true,
}: { values: number[]; width?: number; height?: number; color?: string; fill?: boolean }) {
  const id = useId();
  if (values.length < 2) return <svg width={width} height={height} />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 2;
  const x = (i: number) => (i / (values.length - 1)) * (width - pad * 2) + pad;
  const y = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2);

  const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const area = `${line}L${x(values.length - 1).toFixed(1)},${height}L${x(0).toFixed(1)},${height}Z`;

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#sg-${id})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r="1.9" fill={color} />
    </svg>
  );
}

/** График с осями, сеткой, порогом и подписями времени. */
export function AreaChart({
  data, height = 150, color = 'var(--accent)', unit = '', threshold, thresholdLabel, kind = 'area',
}: {
  data: SeriesPoint[];
  height?: number;
  color?: string;
  unit?: string;
  threshold?: number;
  thresholdLabel?: string;
  kind?: 'area' | 'bars';
}) {
  const id = useId();
  const [ref, W] = useWidth<HTMLDivElement>();
  const padL = 42, padR = 12, padT = 12, padB = 22;

  if (data.length < 2) {
    return <div className="empty" style={{ height, padding: 0 }}><span style={{ fontSize: 12 }}>Нет данных за период</span></div>;
  }

  if (W === 0) return <div ref={ref} style={{ height }} />;

  const values = data.map((d) => d.v);
  const rawMax = Math.max(...values, threshold ?? -Infinity);
  const rawMin = Math.min(...values, 0);
  const max = niceCeil(rawMax);
  const min = rawMin < 0 ? -niceCeil(-rawMin) : 0;
  const span = max - min || 1;

  const x = (i: number) => (i / (data.length - 1)) * (W - padL - padR) + padL;
  const y = (v: number) => height - padB - ((v - min) / span) * (height - padT - padB);

  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.v).toFixed(1)}`).join('');
  const area = `${line}L${x(data.length - 1).toFixed(1)},${y(min)}L${x(0).toFixed(1)},${y(min)}Z`;

  const decimals = max < 1 ? 2 : max < 10 ? 1 : 0;
  const ticks = [min, min + span / 2, max];
  const step = Math.max(1, Math.floor(data.length / 6));
  const barW = Math.max(1.2, (W - padL - padR) / data.length - 1.4);

  return (
    <div ref={ref} style={{ width: '100%' }}>
    <svg width={W} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`ag-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.34" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="var(--track)" strokeWidth="1" />
          <text x={padL - 7} y={y(t) + 3.5} textAnchor="end" fill="var(--text-faint)" fontSize="10" fontFamily="var(--font-mono)">
            {formatTick(t, decimals)}
          </text>
        </g>
      ))}

      {threshold !== undefined && threshold <= max && (
        <g>
          <line
            x1={padL} x2={W - padR} y1={y(threshold)} y2={y(threshold)}
            stroke="var(--danger)" strokeWidth="1" strokeDasharray="5 4" opacity="0.85"
          />
          <text x={W - padR} y={y(threshold) - 5} textAnchor="end" fill="var(--danger)" fontSize="9.5" fontFamily="var(--font-mono)" letterSpacing="0.04em">
            {thresholdLabel ?? `порог ${threshold}${unit}`}
          </text>
        </g>
      )}

      {kind === 'area' ? (
        <>
          <path d={area} fill={`url(#ag-${id})`} />
          <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx={x(data.length - 1)} cy={y(data[data.length - 1].v)} r="3" fill={color} />
          <circle cx={x(data.length - 1)} cy={y(data[data.length - 1].v)} r="6" fill="none" stroke={color} strokeWidth="1" opacity="0.4" />
        </>
      ) : (
        data.map((d, i) => (
          <rect
            key={i}
            x={x(i) - barW / 2}
            y={Math.min(y(d.v), y(0))}
            width={barW}
            height={Math.max(0.6, Math.abs(y(d.v) - y(0)))}
            fill={color}
            opacity={threshold !== undefined && d.v >= threshold ? 1 : 0.62}
            rx="0.5"
          />
        ))
      )}

      <line x1={padL} x2={W - padR} y1={y(min)} y2={y(min)} stroke="var(--line)" strokeWidth="1" />

      {data.map((d, i) =>
        i % step === 0 || i === data.length - 1 ? (
          <text key={i} x={x(i)} y={height - 6} textAnchor="middle" fill="var(--text-faint)" fontSize="10" fontFamily="var(--font-mono)">
            {fmtTime(d.t)}
          </text>
        ) : null,
      )}
    </svg>
    </div>
  );
}

/** Горизонтальные полосы — распределение по категориям. */
export function BarList({
  items, max, unit = '',
}: { items: { label: string; value: number; color?: string }[]; max?: number; unit?: string }) {
  const top = max ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="col" style={{ gap: 9 }}>
      {items.map((it, i) => (
        <div key={i} className="col" style={{ gap: 4 }}>
          <div className="row" style={{ justifyContent: 'space-between', fontSize: 11.5 }}>
            <span className="dim">{it.label}</span>
            <span className="num" style={{ color: it.color ?? 'var(--text)' }}>
              {it.value.toLocaleString('ru-RU')}{unit}
            </span>
          </div>
          <div style={{ height: 3, background: 'var(--track)', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                width: `${(it.value / top) * 100}%`,
                height: '100%',
                background: it.color ?? 'var(--accent)',
                borderRadius: 2,
                transition: 'width 0.5s var(--ease)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / mag;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * mag;
}

function formatTick(v: number, decimals = 0): string {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)} тыс`;
  return v.toFixed(decimals);
}
