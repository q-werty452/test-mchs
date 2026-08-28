import { useState, useMemo } from 'react';
import { api } from '../api/client';
import { useData, useApp } from '../state/app';
import { Panel, Badge, Button, Loading, Empty, Stat, Segmented } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { fmtDateTime, fmtAgo } from '../ui/format';
import { roles } from '../data/roles';
import './screens.css';

const OBJECT_ICON: Record<string, string> = {
  'Зона риска': 'zones',
  'Событие': 'events',
  'Уведомление': 'notifications',
  'Защитное сооружение': 'structures',
  'Правило': 'rules',
  'AI': 'ai',
  'Импорт': 'download',
  'Ресурсы': 'resources',
};

export function Audit() {
  const { can } = useApp();
  const { data: log, loading } = useData(() => api.getAudit(), []);
  const [filter, setFilter] = useState<'all' | 'denied' | 'changes'>('all');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    let list = log ?? [];
    if (filter === 'denied') list = list.filter((e) => e.result === 'denied');
    if (filter === 'changes') list = list.filter((e) => e.field !== undefined);
    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter(
        (e) => e.actor.toLowerCase().includes(s) || e.action.toLowerCase().includes(s) ||
          e.object_id.toLowerCase().includes(s) || (e.field ?? '').toLowerCase().includes(s),
      );
    }
    return list;
  }, [log, filter, q]);

  const denied = (log ?? []).filter((e) => e.result === 'denied');
  const changes = (log ?? []).filter((e) => e.field !== undefined);

  if (!can('audit.view')) {
    return (
      <div className="page">
        <Empty icon="lock" text="Журнал аудита недоступен" hint="Просмотр журнала разрешён руководству области и областному МЧС" />
      </div>
    );
  }

  return (
    <div className="page page--flush" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="toolbar">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: `Все записи (${(log ?? []).length})` },
            { value: 'changes', label: `Изменения (${changes.length})` },
            { value: 'denied', label: `Отказы (${denied.length})` },
          ]}
        />
        <div className="search-box">
          <Icon name="search" size={13} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по пользователю, объекту, полю" />
        </div>
        <div className="spacer" />
        <Button icon="download">Выгрузить журнал</Button>
      </div>

      <div style={{ padding: 16, paddingBottom: 0 }}>
        <div className="page__grid g4" style={{ marginBottom: 12 }}>
          <Stat label="Записей в журнале" value={(log ?? []).length} icon="audit" foot="за отображаемый период" />
          <Stat label="Изменений значений" value={changes.length} icon="edit" foot="с фиксацией старого и нового" />
          <Stat label="Отказов в доступе" value={denied.length} icon="ban" accent={denied.length ? 'var(--danger)' : 'var(--ok)'} foot="попытки вне полномочий" />
          <Stat
            label="Последняя запись"
            value={log?.[0] ? fmtAgo(log[0].t) : '—'}
            icon="clock"
            foot={log?.[0]?.actor ?? ''}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', padding: '0 16px 16px' }}>
        <div className="panel scroll-y" style={{ height: '100%', overflow: 'auto' }}>
          {loading ? (
            <div style={{ padding: 14 }}><Loading rows={10} /></div>
          ) : rows.length === 0 ? (
            <Empty icon="search" text="Записей не найдено" />
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 76 }}>ID</th>
                  <th style={{ width: 130 }}>Время</th>
                  <th style={{ width: 210 }}>Пользователь</th>
                  <th style={{ width: 150 }}>Роль</th>
                  <th style={{ width: 230 }}>Действие</th>
                  <th style={{ width: 180 }}>Объект</th>
                  <th>Изменение</th>
                  <th style={{ width: 108 }}>IP</th>
                  <th style={{ width: 118 }}>Результат</th>
                  <th style={{ width: 118 }}>request_id</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => {
                  const role = roles.find((r) => r.id === e.role);
                  return (
                    <tr key={e.id} style={e.result === 'denied' ? { background: 'var(--danger-soft)' } : undefined}>
                      <td className="num" style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>{e.id}</td>
                      <td className="num" style={{ fontSize: 11 }}>{fmtDateTime(e.t)}</td>
                      <td style={{ fontSize: 11.5 }}>{e.actor}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-dim)' }}>{role?.title ?? e.role}</td>
                      <td style={{ fontSize: 11.5 }}>{e.action}</td>
                      <td>
                        <span className="row" style={{ gap: 7 }}>
                          <Icon name={OBJECT_ICON[e.object] ?? 'document'} size={12} style={{ color: 'var(--text-faint)' }} />
                          <span className="mono" style={{ fontSize: 10.5 }}>{e.object_id}</span>
                        </span>
                      </td>
                      <td>
                        {e.field ? (
                          <div className="row" style={{ gap: 7, fontSize: 10.5, flexWrap: 'wrap' }}>
                            <span className="mono" style={{ color: 'var(--text-faint)' }}>{e.field}</span>
                            <span
                              className="mono"
                              style={{
                                padding: '1px 5px', borderRadius: 2,
                                background: 'var(--danger-soft)', color: 'var(--danger-text)',
                                maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}
                            >
                              {e.old_value ?? '—'}
                            </span>
                            <Icon name="arrowRight" size={11} style={{ color: 'var(--text-faint)' }} />
                            <span
                              className="mono"
                              style={{
                                padding: '1px 5px', borderRadius: 2,
                                background: 'var(--ok-soft)', color: 'var(--ok-text)',
                                maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}
                            >
                              {e.new_value ?? '—'}
                            </span>
                          </div>
                        ) : (
                          <span className="faint" style={{ fontSize: 11 }}>—</span>
                        )}
                      </td>
                      <td className="num" style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>{e.ip}</td>
                      <td>
                        {e.result === 'ok' ? (
                          <Badge color="var(--ok)" dot>Выполнено</Badge>
                        ) : (
                          <Badge color="var(--danger)" dot>Отказано</Badge>
                        )}
                      </td>
                      <td className="num" style={{ fontSize: 10, color: 'var(--text-faint)' }}>{e.request_id}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
