import { api } from '../api/client';
import { useData } from '../state/app';
import { Panel, Badge, Loading, Empty, Stat, KV, Meter } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { fmtDateTime, fmtAgo, num } from '../ui/format';
import type { IntegrationState } from '../types';
import './screens.css';

const STATE: Record<IntegrationState, [string, string]> = {
  ok: ['Штатно', 'var(--ok)'],
  degraded: ['Деградация', 'var(--warn)'],
  down: ['Недоступно', 'var(--danger)'],
};

export function Integrations() {
  const { data: integrations, loading } = useData(() => api.getIntegrations(), []);

  if (loading) return <div className="page"><Loading rows={5} height={80} /></div>;

  const list = integrations ?? [];
  const ok = list.filter((i) => i.state === 'ok').length;
  const errors = list.reduce((a, i) => a + i.today_errors, 0);
  const calls = list.reduce((a, i) => a + i.today_calls, 0);

  return (
    <div className="page">
      <div className="page__grid g4" style={{ marginBottom: 12 }}>
        <Stat label="Источников подключено" value={list.length} icon="integrations" foot={`${ok} работают штатно`} />
        <Stat
          label="Недоступно"
          value={list.filter((i) => i.state === 'down').length}
          icon="ban"
          accent={list.some((i) => i.state === 'down') ? 'var(--danger)' : 'var(--ok)'}
          foot={list.filter((i) => i.state === 'down').map((i) => i.name).join(', ') || 'нет'}
        />
        <Stat label="Запросов за сутки" value={num(calls)} icon="activity" foot="по всем интеграциям" />
        <Stat label="Ошибок за сутки" value={num(errors)} icon="alert" accent={errors ? 'var(--warn)' : 'var(--ok)'} foot="учитываются в мониторинге" />
      </div>

      <div className="page__grid g2" style={{ alignItems: 'start' }}>
        {list.map((i) => {
          const [label, color] = STATE[i.state];
          const errRate = i.today_calls ? (i.today_errors / i.today_calls) * 100 : 0;
          return (
            <Panel key={i.id} title={i.name} icon="integrations" hud actions={<Badge color={color} dot live={i.state !== 'down'}>{label}</Badge>}>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.65, marginBottom: 13 }}>{i.purpose}</p>

              <div className="page__grid g2" style={{ gap: 8, marginBottom: 13 }}>
                <div style={{ padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--line)', borderRadius: 4 }}>
                  <div className="label" style={{ fontSize: 9 }}>Задержка ответа</div>
                  <div className="row" style={{ alignItems: 'baseline', gap: 3, marginTop: 3 }}>
                    <span className="num" style={{ fontSize: 16, fontWeight: 600, color: i.latency_ms > 1000 ? 'var(--warn)' : 'var(--text)' }}>
                      {i.latency_ms ? num(i.latency_ms) : '—'}
                    </span>
                    <span className="faint" style={{ fontSize: 10 }}>мс</span>
                  </div>
                </div>
                <div style={{ padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--line)', borderRadius: 4 }}>
                  <div className="label" style={{ fontSize: 9 }}>Доля ошибок</div>
                  <div className="row" style={{ alignItems: 'baseline', gap: 3, marginTop: 3 }}>
                    <span className="num" style={{ fontSize: 16, fontWeight: 600, color: errRate > 1 ? 'var(--danger)' : 'var(--text)' }}>
                      {errRate.toFixed(1)}
                    </span>
                    <span className="faint" style={{ fontSize: 10 }}>%</span>
                  </div>
                </div>
              </div>

              <KV items={[
                ['Владелец данных', <span style={{ fontSize: 11.5 }}>{i.owner}</span>],
                ['Последний успешный обмен', <span>{fmtDateTime(i.last_ok)} <span className="faint">({fmtAgo(i.last_ok)})</span></span>],
                ['Запросов за сутки', <span className="num">{num(i.today_calls)}</span>],
                ['Ошибок за сутки', <span className="num" style={{ color: i.today_errors ? 'var(--danger)' : undefined }}>{num(i.today_errors)}</span>],
              ]} />

              <div className="divider" />
              <div className="row" style={{ gap: 9, alignItems: 'flex-start' }}>
                <Icon name="info" size={13} style={{ color: 'var(--text-faint)', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 11.5, color: 'var(--text-dim)', lineHeight: 1.6 }}>{i.note}</span>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
