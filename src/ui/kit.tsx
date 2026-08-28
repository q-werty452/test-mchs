import type { ReactNode, CSSProperties } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import type { ThreatLevel } from '../types';
import { levelColor, levelLabel } from '../data/dicts';
import './kit.css';

/* ---------- Панель ---------- */

export function Panel({
  title, icon, actions, children, className = '', bodyClass = '', hud, style, flush,
}: {
  title?: string; icon?: IconName | string; actions?: ReactNode; children: ReactNode;
  className?: string; bodyClass?: string; hud?: boolean; style?: CSSProperties; flush?: boolean;
}) {
  return (
    <div className={`panel ${hud ? 'hud' : ''} ${className}`} style={style}>
      {title && (
        <div className="panel__head">
          {icon && <Icon name={icon} size={14} style={{ color: 'var(--text-faint)' }} />}
          <span className="panel__title">{title}</span>
          {actions && <div className="panel__actions">{actions}</div>}
        </div>
      )}
      <div className={`panel__body ${flush ? 'panel__body--tight' : ''} ${bodyClass}`}>{children}</div>
    </div>
  );
}

/* ---------- Кнопка ---------- */

export function Button({
  children, icon, variant = 'default', size, onClick, disabled, title, type = 'button', style,
}: {
  children?: ReactNode; icon?: IconName | string;
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  size?: 'sm'; onClick?: () => void; disabled?: boolean; title?: string;
  type?: 'button' | 'submit'; style?: CSSProperties;
}) {
  const cls = [
    'btn',
    variant !== 'default' ? `btn--${variant}` : '',
    size === 'sm' ? 'btn--sm' : '',
    !children ? 'btn--icon' : '',
  ].filter(Boolean).join(' ');

  return (
    <button className={cls} onClick={onClick} disabled={disabled} title={title} type={type} style={style}>
      {icon && <Icon name={icon} size={size === 'sm' ? 12 : 14} />}
      {children}
    </button>
  );
}

/* ---------- Значок ---------- */

export function Badge({
  children, color = 'var(--text-dim)', dot, live, icon,
}: {
  children: ReactNode; color?: string; dot?: boolean; live?: boolean; icon?: IconName | string;
}) {
  return (
    <span
      className={`badge ${dot ? 'badge--dot' : ''} ${live ? 'badge--live' : ''}`}
      style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)`, borderColor: `color-mix(in srgb, ${color} 32%, transparent)` }}
    >
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  );
}

/* ---------- Уровень угрозы ---------- */

export function Level({ value, showLabel, size = 'md' }: { value: ThreatLevel; showLabel?: boolean; size?: 'sm' | 'md' }) {
  const c = levelColor[value];
  return (
    <span className="row" style={{ gap: 7 }}>
      <span
        className="lvl"
        style={{
          color: c,
          background: `color-mix(in srgb, ${c} 14%, transparent)`,
          width: size === 'sm' ? 17 : 20,
          height: size === 'sm' ? 17 : 20,
          fontSize: size === 'sm' ? 10 : 11,
        }}
      >
        {value}
      </span>
      {showLabel && <span style={{ color: c, fontSize: 12, fontWeight: 500 }}>{levelLabel[value]}</span>}
    </span>
  );
}

export function LevelBar({ value }: { value: ThreatLevel }) {
  const c = levelColor[value];
  return (
    <span className="lvl-bar" style={{ color: c }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= value ? 'on' : ''} style={{ height: 4 + i * 2 }} />
      ))}
    </span>
  );
}

/* ---------- Плитка показателя ---------- */

export function Stat({
  label, value, unit, foot, accent, icon, trend,
}: {
  label: string; value: ReactNode; unit?: string; foot?: ReactNode;
  accent?: string; icon?: IconName | string; trend?: 'up' | 'down';
}) {
  return (
    <div className="stat">
      {accent && <span className="stat__accent" style={{ background: accent }} />}
      <div className="row">
        <span className="stat__label">{label}</span>
        {icon && <Icon name={icon} size={13} style={{ marginLeft: 'auto', color: 'var(--text-faint)' }} />}
      </div>
      <div className="row" style={{ alignItems: 'baseline', gap: 5 }}>
        <span className="stat__value" style={{ color: accent ?? 'var(--text)' }}>{value}</span>
        {unit && <span className="dim" style={{ fontSize: 11 }}>{unit}</span>}
        {trend && (
          <Icon
            name={trend === 'up' ? 'trendUp' : 'trendDown'}
            size={13}
            style={{ color: trend === 'up' ? 'var(--danger)' : 'var(--ok)', marginLeft: 2 }}
          />
        )}
      </div>
      {foot && <div className="stat__foot">{foot}</div>}
    </div>
  );
}

/* ---------- Сегменты ---------- */

export function Segmented<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: { value: T; label: string; icon?: IconName | string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.value} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.icon && <Icon name={o.icon} size={12} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Пустое состояние и загрузка ---------- */

export function Empty({ icon = 'info', text, hint }: { icon?: IconName | string; text: string; hint?: string }) {
  return (
    <div className="empty">
      <Icon name={icon} size={26} style={{ opacity: 0.5 }} />
      <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{text}</div>
      {hint && <div style={{ fontSize: 11.5, maxWidth: 320 }}>{hint}</div>}
    </div>
  );
}

export function Loading({ rows = 4, height = 34 }: { rows?: number; height?: number }) {
  return (
    <div className="col" style={{ gap: 6, padding: 2 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height, opacity: 1 - i * 0.13 }} />
      ))}
    </div>
  );
}

/* ---------- Список «ключ — значение» ---------- */

export function KV({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="kv">
      {items.map(([k, v], i) => (
        <div key={i} style={{ display: 'contents' }}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------- Полоса заполнения ---------- */

export function Meter({ value, max = 100, color = 'var(--accent)', height = 4 }: { value: number; max?: number; color?: string; height?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ height, background: 'var(--track)', borderRadius: height, overflow: 'hidden', width: '100%' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: height, transition: 'width 0.4s var(--ease)' }} />
    </div>
  );
}
