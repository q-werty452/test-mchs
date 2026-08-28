import {
  createContext, useContext, useState, useCallback, useEffect, useMemo, useRef,
  type ReactNode,
} from 'react';
import type { RoleId, Permission } from '../types';
import { roles, roleById } from '../data/roles';
import { subscribe } from '../api/client';
import { Icon } from '../ui/Icon';
import { resetColorCache, type ThemeName } from '../theme/colors';

/* ---------- Текущая роль и полномочия ---------- */

const OPERATOR_NAMES: Record<RoleId, string> = {
  leadership: 'Полпред Абдыкадыров Б.',
  oblast_mchs: 'Начальник смены Сатыбалдиев Э.',
  rayon_mchs: 'к-н Абдиев М.',
  akim: 'Абдырахманова С.',
  operator: 'Оператор ОДС Жумабаев А.',
  public: 'Публичный доступ',
};

export interface Actor {
  name: string;
  role: RoleId;
  territories: string[] | null;
}

interface Toast { id: number; kind: 'ok' | 'err' | 'info'; text: string }

const THEME_KEY = 'tj.theme';

function readTheme(): ThemeName {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // приватный режим или запрет на хранилище — используем оформление по умолчанию
  }
  return 'dark';
}

interface AppState {
  roleId: RoleId;
  setRoleId: (r: RoleId) => void;
  actor: Actor;
  can: (p: Permission) => boolean;
  /** доступна ли территория текущей роли */
  inScope: (territory: string) => boolean;
  toast: (kind: Toast['kind'], text: string) => void;
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  version: number;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [roleId, setRoleId] = useState<RoleId>('oblast_mchs');
  const [theme, setTheme] = useState<ThemeName>(readTheme);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [version, setVersion] = useState(0);
  const nextId = useRef(1);

  // подписка на изменения хранилища данных
  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);

  // оформление применяется к корню документа; цвета карты пересчитываются
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    resetColorCache();
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // выбор не сохранится, интерфейс от этого не страдает
    }
  }, [theme]);

  const role = roleById(roleId);

  const actor = useMemo<Actor>(
    () => ({ name: OPERATOR_NAMES[roleId], role: roleId, territories: role.territories }),
    [roleId, role.territories],
  );

  const can = useCallback((p: Permission) => role.can.includes(p), [role]);

  const inScope = useCallback(
    (territory: string) => role.territories === null || role.territories.includes(territory),
    [role.territories],
  );

  const toast = useCallback((kind: Toast['kind'], text: string) => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5200);
  }, []);

  const value = useMemo(
    () => ({ roleId, setRoleId, actor, can, inScope, toast, theme, setTheme, version }),
    [roleId, actor, can, inScope, toast, theme, version],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.kind}`}>
            <Icon
              name={t.kind === 'ok' ? 'check' : t.kind === 'err' ? 'ban' : 'info'}
              size={14}
              style={{
                marginTop: 1,
                color: t.kind === 'ok' ? 'var(--ok)' : t.kind === 'err' ? 'var(--danger)' : 'var(--accent)',
              }}
            />
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp вне AppProvider');
  return ctx;
}

export { roles, OPERATOR_NAMES };

/* ---------- Загрузка данных через фасад ---------- */

export function useData<T>(loader: () => Promise<T>, deps: unknown[] = []): { data: T | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { version } = useApp();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loader()
      .then((d) => { if (alive) { setData(d); setError(null); } })
      .catch((e) => { if (alive) setError(String(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  return { data, loading, error };
}
