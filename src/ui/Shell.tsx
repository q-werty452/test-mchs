import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { useApp, useData, roles } from '../state/app';
import { api } from '../api/client';
import { fmtTime, fmtDateShort } from './format';
import './shell.css';

interface NavDef { to: string; label: string; icon: IconName; end?: boolean }

const GROUPS: { label: string; items: NavDef[] }[] = [
  {
    label: 'Обстановка',
    items: [
      { to: '/', label: 'Дашборд области', icon: 'dashboard', end: true },
      { to: '/map', label: 'Оперативная карта', icon: 'map' },
    ],
  },
  {
    label: 'Реестры',
    items: [
      { to: '/zones', label: 'Зоны риска', icon: 'zones' },
      { to: '/structures', label: 'Защитные сооружения', icon: 'structures' },
      { to: '/events', label: 'События ЧС', icon: 'events' },
    ],
  },
  {
    label: 'Оперативная работа',
    items: [
      { to: '/notifications', label: 'Уведомления', icon: 'notifications' },
      { to: '/resources', label: 'Реагирование', icon: 'resources' },
    ],
  },
  {
    label: 'Данные',
    items: [
      { to: '/weather', label: 'Метеоданные', icon: 'weather' },
      { to: '/rules', label: 'Пороги и правила', icon: 'rules' },
      { to: '/integrations', label: 'Интеграции', icon: 'integrations' },
    ],
  },
  {
    label: 'Служебное',
    items: [
      { to: '/ai', label: 'AI-помощник', icon: 'ai' },
      { to: '/audit', label: 'Журнал аудита', icon: 'audit' },
    ],
  },
];

const TITLES: Record<string, [string, string]> = {
  '/': ['Дашборд области', 'Сводная оперативная обстановка по Джалал-Абадской области'],
  '/map': ['Оперативная карта', 'Зоны риска, силы и средства, маршруты эвакуации'],
  '/zones': ['Зоны риска', 'Реестр учтённых зон с источниками и документами'],
  '/structures': ['Защитные сооружения', 'Дамбы, каналы, лотки: состояние и обслуживание'],
  '/events': ['События ЧС', 'Текущие события и хронология прошедших'],
  '/notifications': ['Уведомления', 'Черновик, подтверждение, доставка и журнал статусов'],
  '/weather': ['Метеоданные', 'Станции, временные ряды, свежесть и ошибки интеграции'],
  '/rules': ['Пороги и правила', 'Утверждённые уровни угрозы и детерминированный расчёт'],
  '/resources': ['Реагирование', 'Ресурсы, маршруты эвакуации и пункты размещения'],
  '/ai': ['AI-помощник', 'Сводки и поиск с обязательным указанием источников'],
  '/audit': ['Журнал аудита', 'История критических действий пользователей'],
  '/integrations': ['Интеграции', 'Внешние источники данных и каналы доставки'],
};

export function Shell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const base = '/' + (loc.pathname.split('/')[1] ?? '');
  const [title, sub] = TITLES[base === '/' ? '/' : base] ?? ['Туруктуу Жалалабад', ''];

  const { data: events } = useData(() => api.getEvents(), []);
  const { data: notifications } = useData(() => api.getNotifications(), []);

  const activeEvents = events?.filter((e) => e.status === 'active' || e.status === 'monitoring').length ?? 0;
  const pendingNotifications = notifications?.filter((n) => n.status === 'awaiting_approval').length ?? 0;

  const counts: Record<string, { n: number; alarm?: boolean }> = {
    '/events': { n: activeEvents, alarm: (events?.some((e) => e.status === 'active')) ?? false },
    '/notifications': { n: pendingNotifications, alarm: pendingNotifications > 0 },
  };

  return (
    <div className="shell">
      <aside className="side">
        <div className="side__brand">
          <span className="side__mark"><Icon name="shield" size={15} /></span>
          <div className="col">
            <span className="side__name">ТУРУКТУУ ЖАЛАЛАБАД</span>
            <span className="side__sub">УМЧС · Джалал-Абад</span>
          </div>
        </div>

        <nav className="side__nav">
          {GROUPS.map((g) => (
            <div className="side__group" key={g.label}>
              <div className="side__group-label">{g.label}</div>
              {g.items.map((it) => {
                const c = counts[it.to];
                return (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    end={it.end}
                    className={({ isActive }) => `nav-item ${isActive ? 'on' : ''}`}
                    title={it.label}
                  >
                    <Icon name={it.icon} size={15} />
                    <span>{it.label}</span>
                    {c && c.n > 0 && <span className={`nav-item__count ${c.alarm ? 'alarm' : ''}`}>{c.n}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="side__foot">
          <div className="row" style={{ gap: 7, fontSize: 10.5, color: 'var(--text-faint)' }}>
            <Icon name="info" size={12} />
            <span>Pilot · Сузакский район</span>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="head">
          <div className="col">
            <span className="head__title">{title}</span>
            <span className="head__sub">{sub}</span>
          </div>

          <span className="demo-flag">
            <Icon name="alert" size={11} />
            Демо-данные · не для оперативного использования
          </span>

          <div className="spacer" />
          <Clock />
          <RoleSwitcher />
        </header>

        <div className="content">{children}</div>
      </div>
    </div>
  );
}

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const iso = now.toISOString();
  return (
    <div className="col" style={{ alignItems: 'flex-end', lineHeight: 1.25 }}>
      <span className="clock" style={{ fontSize: 13, color: 'var(--text)' }}>
        {fmtTime(iso)}
        <span style={{ color: 'var(--text-faint)' }}>:{String(now.getSeconds()).padStart(2, '0')}</span>
      </span>
      <span className="clock" style={{ fontSize: 9.5 }}>{fmtDateShort(iso)} · UTC+6</span>
    </div>
  );
}

function RoleSwitcher() {
  const { roleId, setRoleId } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = roles.find((r) => r.id === roleId)!;

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="role-btn" onClick={() => setOpen((o) => !o)}>
        <Icon name="user" size={15} style={{ color: 'var(--accent)' }} />
        <div className="col" style={{ alignItems: 'flex-start' }}>
          <span className="role-btn__name">{current.title}</span>
          <span className="role-btn__org">
            {current.territories === null ? 'Вся область' : `${current.territories.length} территории`}
          </span>
        </div>
        <Icon name="chevronDown" size={13} style={{ color: 'var(--text-faint)' }} />
      </button>

      {open && (
        <div className="role-menu">
          <div style={{ padding: '9px 12px', borderBottom: '1px solid var(--line)' }}>
            <div className="label">Роль и территориальные полномочия</div>
          </div>
          {roles.map((r) => (
            <div
              key={r.id}
              className={`role-menu__item ${r.id === roleId ? 'on' : ''}`}
              onClick={() => { setRoleId(r.id); setOpen(false); }}
            >
              <Icon
                name={r.id === roleId ? 'check' : 'user'}
                size={14}
                style={{ marginTop: 2, color: r.id === roleId ? 'var(--accent)' : 'var(--text-faint)' }}
              />
              <div className="col" style={{ gap: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{r.title}</span>
                <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>{r.org}</span>
                <span style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 2 }}>{r.access}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
