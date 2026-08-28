import { useState, useMemo, useEffect } from 'react';
import { api } from '../api/client';
import { useData, useApp } from '../state/app';
import { Button, Badge } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { channelLabel, hazardLabel, levelLabel } from '../data/dicts';
import { territoryName } from '../data/territories';
import { num } from '../ui/format';
import type { Channel, EmergencyEvent } from '../types';
import './screens.css';

const CHANNEL_ICON: Record<Channel, string> = {
  telegram: 'telegram', sms: 'message', internal: 'shield', siren: 'siren', radio: 'radio',
};

/** Черновик уведомления по утверждённому шаблону.
    Отправка возможна только после подтверждения человеком (п. 3 и 5.9 ТЗ). */
export function NotificationDialog({
  event, onClose, onCreated,
}: {
  event?: EmergencyEvent;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const { actor, toast } = useApp();
  const { data: templates } = useData(() => api.getTemplates(), []);
  const { data: zones } = useData(() => api.getZones(), []);
  const { data: routes } = useData(() => api.getRoutes(), []);
  const { data: shelters } = useData(() => api.getShelters(), []);

  const [templateId, setTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [audience, setAudience] = useState<'public' | 'staff' | 'both'>('both');
  const [busy, setBusy] = useState(false);

  const zone = zones?.find((z) => z.id === event?.zone);
  const route = routes?.find((r) => r.from_zone === event?.zone);
  const shelter = shelters?.find((s) => s.id === route?.to_shelter);

  const recipients = useMemo(() => {
    if (!zone) return 500;
    const base = Math.round(zone.population_at_risk * 0.62);
    return audience === 'staff' ? 47 : audience === 'public' ? base : base + 47;
  }, [zone, audience]);

  /* Автоподбор шаблона по типу и уровню события */
  useEffect(() => {
    if (!templates || !event || templateId) return;
    const match =
      templates.find((t) => t.hazard === event.hazard && t.level === event.level) ??
      templates.find((t) => t.hazard === event.hazard);
    if (match) applyTemplate(match.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates, event]);

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const t = templates?.find((x) => x.id === id);
    if (!t) return;
    setChannels(t.channels);
    setAudience(t.audience);
    setSubject(
      event
        ? `${hazardLabel[t.hazard]}: ${event.settlement}, ${territoryName(event.territory)}`
        : `${hazardLabel[t.hazard]}: оповещение населения`,
    );
    setBody(
      t.body
        .replace('{settlement}', event?.settlement ?? '{settlement}')
        .replace('{level}', event ? levelLabel[event.level].toLowerCase() : '{level}')
        .replace('{route}', route ? `«${route.name}»` : '{route}')
        .replace('{shelter}', shelter?.name ?? '{shelter}')
        .replace('{org}', 'оперативной группы')
        .replace('{event}', event?.id ?? '{event}')
        .replace('{time}', '30 минут'),
    );
  };

  const toggleChannel = (c: Channel) => {
    setChannels((list) => (list.includes(c) ? list.filter((x) => x !== c) : [...list, c]));
  };

  const submit = async () => {
    setBusy(true);
    const res = await api.createNotificationDraft(
      {
        templateId: templateId || null,
        subject,
        body,
        channels,
        audience,
        territory: event?.territory ?? 'suzak',
        event: event?.id ?? null,
        recipients,
      },
      actor,
    );
    setBusy(false);
    if (res.ok && res.id) {
      toast('ok', `Черновик ${res.id} создан и передан на подтверждение. Отправка без подтверждения невозможна.`);
      onCreated?.(res.id);
      onClose();
    } else {
      toast('err', res.reason ?? 'Создание черновика отклонено');
    }
  };

  const valid = subject.trim().length > 3 && body.trim().length > 10 && channels.length > 0;

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <Icon name="notifications" size={17} style={{ color: 'var(--accent)' }} />
          <div className="col" style={{ gap: 1 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Черновик уведомления</span>
            <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>
              Текст формируется по утверждённому шаблону и уходит на подтверждение
            </span>
          </div>
          <div className="spacer" />
          <Button icon="close" variant="ghost" size="sm" onClick={onClose} />
        </div>

        <div className="modal__body">
          <div className="steps" style={{ marginBottom: 18 }}>
            <div className="step step--on"><span className="step__n">1</span>Черновик</div>
            <div className="step"><span className="step__n">2</span>Подтверждение</div>
            <div className="step"><span className="step__n">3</span>Доставка</div>
            <div className="step"><span className="step__n">4</span>Журнал статусов</div>
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <span className="label">Утверждённый шаблон</span>
            <select className="select" value={templateId} onChange={(e) => applyTemplate(e.target.value)}>
              <option value="">— выберите шаблон —</option>
              {(templates ?? []).map((t) => (
                <option key={t.id} value={t.id}>{t.name} · {hazardLabel[t.hazard]} · уровень {t.level}</option>
              ))}
            </select>
            {templateId && (
              <span style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 3 }}>
                Основание шаблона: {templates?.find((t) => t.id === templateId)?.approved_by}
              </span>
            )}
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <span className="label">Тема</span>
            <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Краткая тема сообщения" />
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <span className="label">Текст сообщения</span>
            <textarea className="textarea" rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
            <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>
              {body.length} символов · SMS будет разбито на {Math.max(1, Math.ceil(body.length / 70))} частей
            </span>
          </div>

          <div className="page__grid g2" style={{ gap: 14 }}>
            <div className="field">
              <span className="label">Каналы доставки</span>
              <div className="col" style={{ gap: 4 }}>
                {(['telegram', 'sms', 'internal', 'siren', 'radio'] as Channel[]).map((c) => (
                  <div
                    key={c}
                    className={`layer-toggle ${channels.includes(c) ? 'on' : ''}`}
                    onClick={() => toggleChannel(c)}
                  >
                    <span className="layer-toggle__box">{channels.includes(c) && <Icon name="check" size={9} stroke={2.4} />}</span>
                    <Icon name={CHANNEL_ICON[c]} size={13} style={{ color: channels.includes(c) ? 'var(--accent)' : 'var(--text-faint)' }} />
                    <span>{channelLabel[c]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="col" style={{ gap: 14 }}>
              <div className="field">
                <span className="label">Аудитория</span>
                <select className="select" value={audience} onChange={(e) => setAudience(e.target.value as typeof audience)}>
                  <option value="both">Население и служебные адресаты</option>
                  <option value="public">Только население</option>
                  <option value="staff">Только служебные адресаты</option>
                </select>
              </div>

              <div
                style={{
                  padding: '11px 13px', border: '1px solid var(--line)',
                  borderRadius: 4, background: 'var(--bg-input)',
                }}
              >
                <div className="label" style={{ marginBottom: 6 }}>Расчёт охвата</div>
                <div className="row" style={{ alignItems: 'baseline', gap: 5 }}>
                  <span className="num" style={{ fontSize: 20, fontWeight: 600 }}>{num(recipients)}</span>
                  <span className="dim" style={{ fontSize: 11 }}>получателей</span>
                </div>
                {zone && (
                  <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>
                    По зоне {zone.id}: {num(zone.population_at_risk)} чел в границах
                  </span>
                )}
              </div>
            </div>
          </div>

          {event && (
            <div className="row" style={{ gap: 8, marginTop: 14 }}>
              <Badge color="var(--accent)" icon="events">Привязано к событию {event.id}</Badge>
              <Badge color="var(--text-dim)" icon="grid">{territoryName(event.territory)}</Badge>
            </div>
          )}
        </div>

        <div className="modal__foot">
          <Icon name="lock" size={13} style={{ color: 'var(--warn)' }} />
          <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>
            Черновик не отправляется автоматически: требуется подтверждение уполномоченного сотрудника.
          </span>
          <div className="spacer" />
          <Button onClick={onClose}>Отмена</Button>
          <Button variant="primary" icon="send" disabled={!valid || busy} onClick={submit}>
            {busy ? 'Сохранение…' : 'Передать на подтверждение'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { CHANNEL_ICON };
