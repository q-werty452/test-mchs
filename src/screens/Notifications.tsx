import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useData, useApp } from '../state/app';
import { Panel, Badge, Button, Loading, Empty, Stat, Meter, Segmented, KV } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { NotificationDialog, CHANNEL_ICON } from './NotificationDialog';
import { fmtDateTime, fmtTime, fmtAgo, num } from '../ui/format';
import {
  channelLabel, notificationStatusLabel, notificationStatusColor, deliveryStateLabel,
} from '../data/dicts';
import { territoryName } from '../data/territories';
import type { Notification, DeliveryState } from '../types';
import './screens.css';

const DELIVERY_COLOR: Record<DeliveryState, string> = {
  queued: 'var(--text-dim)', sent: 'var(--accent)', delivered: 'var(--ok)', failed: 'var(--danger)',
};

const AUDIENCE: Record<string, string> = {
  public: 'Население', staff: 'Служебные адресаты', both: 'Население и служебные адресаты',
};

export function Notifications() {
  const nav = useNavigate();
  const { can, actor, toast, inScope } = useApp();
  const { data: notifications, loading } = useData(() => api.getNotifications(), []);

  const [tab, setTab] = useState<'pending' | 'all' | 'delivered'>('all');
  const [sel, setSel] = useState<string | null>(null);
  const [dialog, setDialog] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const all = useMemo(
    () => (notifications ?? []).filter((n) => inScope(n.territory)),
    [notifications, inScope],
  );

  const rows = useMemo(() => {
    let list = all;
    if (tab === 'pending') list = list.filter((n) => n.status === 'awaiting_approval');
    if (tab === 'delivered') list = list.filter((n) => n.status === 'delivered' || n.status === 'sending');
    return list.slice().sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }, [all, tab]);

  const current = all.find((n) => n.id === sel) ?? rows[0] ?? null;
  const pending = all.filter((n) => n.status === 'awaiting_approval');
  const totalDelivered = all.reduce((a, n) => a + n.deliveries.reduce((b, d) => b + d.delivered, 0), 0);
  const totalFailed = all.reduce((a, n) => a + n.deliveries.reduce((b, d) => b + d.failed, 0), 0);

  const approve = async (n: Notification) => {
    setBusy(true);
    const res = await api.approveNotification(n.id, actor);
    setBusy(false);
    if (res.ok) toast('ok', `Уведомление ${n.id} подтверждено. Доставка запущена, статусы фиксируются в журнале.`);
    else toast('err', res.reason ?? 'Подтверждение отклонено');
  };

  const reject = async (n: Notification) => {
    if (!rejectReason.trim()) return;
    setBusy(true);
    const res = await api.rejectNotification(n.id, rejectReason.trim(), actor);
    setBusy(false);
    setRejectMode(false);
    setRejectReason('');
    if (res.ok) toast('info', `Уведомление ${n.id} отклонено. Причина сохранена в журнале аудита.`);
    else toast('err', res.reason ?? 'Действие отклонено');
  };

  const stepOf = (n: Notification) =>
    n.status === 'draft' ? 1
      : n.status === 'awaiting_approval' ? 2
        : n.status === 'rejected' ? 2
          : n.status === 'sending' ? 3 : 4;

  return (
    <div className="page page--flush" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="toolbar">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'all', label: `Все (${all.length})` },
            { value: 'pending', label: `Ожидают подтверждения (${pending.length})` },
            { value: 'delivered', label: 'Доставленные' },
          ]}
        />
        <div className="spacer" />
        <Button
          icon="plus"
          variant="primary"
          disabled={!can('notification.draft')}
          title={can('notification.draft') ? '' : 'Недоступно для текущей роли'}
          onClick={() => setDialog(true)}
        >
          Создать уведомление
        </Button>
      </div>

      <div style={{ padding: 16, paddingBottom: 0 }}>
        <div className="page__grid g4" style={{ marginBottom: 12 }}>
          <Stat label="Ожидают подтверждения" value={pending.length} icon="lock" accent={pending.length ? 'var(--warn)' : 'var(--ok)'} foot="без подтверждения не отправляются" />
          <Stat label="Доставлено сообщений" value={num(totalDelivered)} icon="check" accent="var(--ok)" foot="по всем каналам" />
          <Stat label="Ошибок доставки" value={num(totalFailed)} icon="alert" accent={totalFailed ? 'var(--danger)' : 'var(--ok)'} foot="номера вне зоны обслуживания" />
          <Stat label="Всего уведомлений" value={all.length} icon="notifications" foot={`${all.filter((n) => n.status === 'rejected').length} отклонено`} />
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'grid', gridTemplateColumns: '400px 1fr', gap: 12, padding: '0 16px 16px' }}>
        {/* --- Список --- */}
        <div className="col scroll-y" style={{ gap: 8 }}>
          {loading ? (
            <Loading rows={5} height={70} />
          ) : rows.length === 0 ? (
            <Panel><Empty icon="notifications" text="Уведомлений нет" /></Panel>
          ) : (
            rows.map((n) => (
              <div
                key={n.id}
                className={`card ${current?.id === n.id ? 'card--on' : ''}`}
                onClick={() => { setSel(n.id); setRejectMode(false); }}
              >
                <span className="card__icon" style={{ color: notificationStatusColor[n.status] }}>
                  <Icon name="notifications" size={15} />
                </span>
                <div className="col" style={{ gap: 5, minWidth: 0, flex: 1 }}>
                  <div className="row" style={{ gap: 7 }}>
                    <span className="card__title" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.subject}
                    </span>
                  </div>
                  <div className="row" style={{ gap: 7 }}>
                    <Badge color={notificationStatusColor[n.status]} dot live={n.status === 'sending'}>
                      {notificationStatusLabel[n.status]}
                    </Badge>
                    <span className="spacer" />
                    <span className="card__meta">{fmtAgo(n.created_at)}</span>
                  </div>
                  <div className="row" style={{ gap: 8, fontSize: 10, color: 'var(--text-faint)' }}>
                    <span className="mono">{n.id}</span>
                    <span>{num(n.recipients_total)} получ.</span>
                    <span className="row" style={{ gap: 4 }}>
                      {n.channels.map((c) => <Icon key={c} name={CHANNEL_ICON[c]} size={11} />)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* --- Карточка --- */}
        <div className="col scroll-y" style={{ gap: 12 }}>
          {!current ? (
            <Panel><Empty icon="notifications" text="Выберите уведомление" /></Panel>
          ) : (
            <>
              <Panel title="Прохождение уведомления" icon="activity" hud>
                <div className="steps" style={{ marginBottom: 14 }}>
                  {['Черновик', 'Подтверждение', 'Доставка', 'Журнал статусов'].map((s, i) => {
                    const step = stepOf(current);
                    const isRejected = current.status === 'rejected' && i === 1;
                    return (
                      <div
                        key={s}
                        className={`step ${i + 1 === step && !isRejected ? 'step--on' : ''} ${i + 1 < step ? 'step--done' : ''}`}
                        style={isRejected ? { color: 'var(--danger)', borderColor: 'var(--danger-line)', background: 'var(--danger-soft)' } : undefined}
                      >
                        <span className="step__n">{i + 1 < step ? <Icon name="check" size={8} stroke={3} /> : i + 1}</span>
                        {isRejected ? 'Отклонено' : s}
                      </div>
                    );
                  })}
                </div>

                <KV items={[
                  ['Тема', current.subject],
                  ['Создано', <span>{fmtDateTime(current.created_at)} <span className="faint">· {current.created_by}</span></span>],
                  ['Подтверждено', current.approved_at
                    ? <span>{fmtDateTime(current.approved_at)} <span className="faint">· {current.approved_by}</span></span>
                    : <span className="faint">не подтверждено</span>],
                  ['Аудитория', AUDIENCE[current.audience]],
                  ['Территория', territoryName(current.territory)],
                  ['Получателей', <span className="num">{num(current.recipients_total)}</span>],
                  ...(current.event ? [['Событие', (
                    <span className="row" style={{ gap: 6, cursor: 'pointer', color: 'var(--accent)' }} onClick={() => nav(`/events/${current.event}`)}>
                      {current.event}<Icon name="external" size={11} />
                    </span>
                  )] as [string, React.ReactNode]] : []),
                  ...(current.template ? [['Шаблон', <span className="mono" style={{ fontSize: 11 }}>{current.template}</span>] as [string, React.ReactNode]] : []),
                ]} />

                {current.rejected_reason && (
                  <div
                    style={{
                      marginTop: 12, padding: '9px 12px',
                      border: '1px solid var(--danger-line)', borderLeft: '2px solid var(--danger)',
                      borderRadius: 4, background: 'var(--danger-soft)', fontSize: 11.5,
                    }}
                  >
                    <span className="label" style={{ color: 'var(--danger)' }}>Причина отклонения</span>
                    <p style={{ marginTop: 4, color: 'var(--text-dim)', lineHeight: 1.6 }}>{current.rejected_reason}</p>
                  </div>
                )}
              </Panel>

              <Panel title="Текст сообщения" icon="message" hud>
                <pre
                  style={{
                    margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11.5, lineHeight: 1.75,
                    whiteSpace: 'pre-wrap', color: 'var(--text)',
                    padding: 13, background: 'var(--bg-input)', border: '1px solid var(--line)', borderRadius: 4,
                  }}
                >
                  {current.body}
                </pre>
                <div className="row" style={{ gap: 7, marginTop: 10, flexWrap: 'wrap' }}>
                  {current.channels.map((c) => (
                    <span className="tag" key={c}>
                      <Icon name={CHANNEL_ICON[c]} size={11} />{channelLabel[c]}
                    </span>
                  ))}
                </div>
              </Panel>

              {/* --- Подтверждение --- */}
              {current.status === 'awaiting_approval' && (
                <Panel title="Подтверждение отправки" icon="lock" hud>
                  <div
                    className="row"
                    style={{
                      gap: 9, padding: '10px 13px', marginBottom: 12,
                      border: '1px solid var(--warn-line)', borderLeft: '2px solid var(--warn)',
                      borderRadius: 4, background: 'var(--warn-soft)',
                    }}
                  >
                    <Icon name="alert" size={14} style={{ color: 'var(--warn)', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 11.5, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                      Сообщение будет доставлено {num(current.recipients_total)} получателям по каналам:{' '}
                      {current.channels.map((c) => channelLabel[c]).join(', ')}. Действие необратимо и фиксируется в журнале аудита.
                    </span>
                  </div>

                  {rejectMode ? (
                    <div className="col" style={{ gap: 9 }}>
                      <div className="field">
                        <span className="label">Причина отклонения</span>
                        <textarea
                          className="textarea"
                          rows={3}
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Например: не подтверждено данными наблюдений, направлено на уточнение"
                        />
                      </div>
                      <div className="row" style={{ gap: 7 }}>
                        <Button variant="danger" icon="ban" disabled={busy || !rejectReason.trim()} onClick={() => reject(current)}>
                          Отклонить
                        </Button>
                        <Button onClick={() => setRejectMode(false)}>Отмена</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="row" style={{ gap: 8 }}>
                      <Button
                        variant="primary"
                        icon="send"
                        disabled={busy || !can('notification.approve')}
                        title={can('notification.approve') ? '' : 'Подтверждение доступно только областному МЧС'}
                        onClick={() => approve(current)}
                      >
                        {busy ? 'Обработка…' : 'Подтвердить и отправить'}
                      </Button>
                      <Button
                        variant="danger"
                        icon="ban"
                        disabled={!can('notification.approve')}
                        onClick={() => setRejectMode(true)}
                      >
                        Отклонить
                      </Button>
                      {!can('notification.approve') && (
                        <span className="row" style={{ gap: 6, fontSize: 11, color: 'var(--text-faint)' }}>
                          <Icon name="lock" size={12} />
                          Текущая роль не имеет полномочий на подтверждение
                        </span>
                      )}
                    </div>
                  )}
                </Panel>
              )}

              {/* --- Журнал доставки --- */}
              <Panel
                title={`Журнал доставки (${current.deliveries.length})`}
                icon="list"
                hud
                flush
                actions={current.status === 'sending' ? <Badge color="var(--accent)" dot live>Идёт отправка</Badge> : undefined}
              >
                {current.deliveries.length === 0 ? (
                  <Empty
                    icon="clock"
                    text="Доставка не начиналась"
                    hint={current.status === 'rejected' ? 'Уведомление отклонено' : 'Ожидается подтверждение уполномоченного сотрудника'}
                  />
                ) : (
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th style={{ width: 150 }}>Канал</th>
                        <th>Адресат</th>
                        <th style={{ width: 90 }} className="r">Получателей</th>
                        <th style={{ width: 150 }}>Доставлено</th>
                        <th style={{ width: 130 }}>Статус</th>
                        <th style={{ width: 80 }}>Время</th>
                      </tr>
                    </thead>
                    <tbody>
                      {current.deliveries.map((d) => (
                        <tr key={d.id}>
                          <td>
                            <span className="row" style={{ gap: 7 }}>
                              <Icon name={CHANNEL_ICON[d.channel]} size={13} style={{ color: DELIVERY_COLOR[d.state] }} />
                              {channelLabel[d.channel]}
                            </span>
                          </td>
                          <td style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
                            {d.target}
                            {d.error && (
                              <div style={{ fontSize: 10.5, color: 'var(--danger)', marginTop: 2 }}>{d.error}</div>
                            )}
                          </td>
                          <td className="r num">{num(d.recipients)}</td>
                          <td>
                            <div className="row" style={{ gap: 8 }}>
                              <Meter value={d.delivered} max={d.recipients} color={DELIVERY_COLOR[d.state]} height={3} />
                              <span className="num" style={{ fontSize: 10.5, width: 42, textAlign: 'right' }}>{num(d.delivered)}</span>
                            </div>
                            {d.failed > 0 && (
                              <span className="num" style={{ fontSize: 10, color: 'var(--danger)' }}>ошибок: {d.failed}</span>
                            )}
                          </td>
                          <td>
                            <Badge color={DELIVERY_COLOR[d.state]} dot live={d.state === 'sent' || d.state === 'queued'}>
                              {deliveryStateLabel[d.state]}
                            </Badge>
                          </td>
                          <td className="num" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                            {d.sent_at ? fmtTime(d.sent_at) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Panel>
            </>
          )}
        </div>
      </div>

      {dialog && <NotificationDialog onClose={() => setDialog(false)} onCreated={(id: string) => setSel(id)} />}
    </div>
  );
}
