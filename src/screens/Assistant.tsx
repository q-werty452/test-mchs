import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useApp } from '../state/app';
import { Panel, Badge, Button, Empty, KV, Meter } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { fmtTime, num } from '../ui/format';
import { suggestedQuestions, AI_MODEL } from '../data/ai';
import type { AiAnswer } from '../types';
import './screens.css';

interface Turn { q: string; a: AiAnswer | null }

const SOURCE_ICON: Record<string, string> = {
  zone: 'zones', event: 'events', doc: 'document', station: 'station', rule: 'rules',
};

export function Assistant() {
  const nav = useNavigate();
  const { actor, can, toast } = useApp();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [turns, busy]);

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text || busy) return;
    if (!can('ai.query')) {
      toast('err', 'Обращение к помощнику недоступно для текущей роли');
      return;
    }
    setQ('');
    setBusy(true);
    setTurns((t) => [...t, { q: text, a: null }]);
    const answer = await api.ask(text, actor);
    setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, a: answer } : x)));
    setBusy(false);
  };

  const openSource = (kind: string, id: string) => {
    if (kind === 'zone') nav(`/zones/${id}`);
    else if (kind === 'event') nav(`/events/${id}`);
    else if (kind === 'station') nav('/weather');
    else if (kind === 'rule') nav('/rules');
  };

  return (
    <div className="page page--flush" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 12, padding: 16, overflow: 'hidden' }}>
      {/* --- Диалог --- */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="panel__head">
          <Icon name="ai" size={14} style={{ color: 'var(--accent)' }} />
          <span className="panel__title">AI-помощник оператора</span>
          <div className="panel__actions">
            <Badge color="var(--text-dim)" icon="lock">действий не выполняет</Badge>
            {turns.length > 0 && (
              <Button size="sm" variant="ghost" icon="refresh" onClick={() => setTurns([])}>Очистить</Button>
            )}
          </div>
        </div>

        <div ref={scroller} className="scroll-y" style={{ flex: 1, padding: 16 }}>
          {turns.length === 0 ? (
            <div className="col" style={{ gap: 16, alignItems: 'center', paddingTop: 40 }}>
              <Icon name="ai" size={34} style={{ color: 'var(--text-faint)', opacity: 0.6 }} />
              <div className="col" style={{ gap: 5, alignItems: 'center', maxWidth: 460, textAlign: 'center' }}>
                <span style={{ fontSize: 13.5, color: 'var(--text-dim)' }}>
                  Помощник отвечает только по переданному контексту
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--text-faint)', lineHeight: 1.6 }}>
                  Прямого доступа к рабочей базе у него нет. Каждый ответ сопровождается источниками
                  и уровнем уверенности; при низкой уверенности решение передаётся сотруднику.
                </span>
              </div>
              <div className="col" style={{ gap: 6, width: '100%', maxWidth: 560, marginTop: 10 }}>
                <span className="label" style={{ textAlign: 'center', marginBottom: 4 }}>Примеры запросов</span>
                {suggestedQuestions.map((s) => (
                  <div
                    key={s}
                    className="row"
                    style={{
                      gap: 9, padding: '9px 13px', cursor: 'pointer', fontSize: 12,
                      border: '1px solid var(--line)', borderRadius: 4, background: 'var(--bg-input)',
                      transition: 'border-color .14s, background .14s',
                    }}
                    onClick={() => ask(s)}
                  >
                    <Icon name="search" size={13} style={{ color: 'var(--text-faint)' }} />
                    <span>{s}</span>
                    <span className="spacer" />
                    <Icon name="arrowRight" size={13} style={{ color: 'var(--text-faint)' }} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="col" style={{ gap: 14 }}>
              {turns.map((t, i) => (
                <div key={i} className="col" style={{ gap: 10 }}>
                  <div className="ai-msg ai-msg--q">{t.q}</div>

                  {!t.a ? (
                    <div className="ai-msg ai-msg--a">
                      <div className="row" style={{ gap: 9, color: 'var(--text-dim)' }}>
                        <Icon name="refresh" size={14} style={{ animation: 'spin 1.1s linear infinite' }} />
                        Формирование ответа по переданному контексту…
                      </div>
                    </div>
                  ) : (
                    <div className="col" style={{ gap: 8 }}>
                      <div className="ai-msg ai-msg--a" style={t.a.handoff ? { borderLeftColor: 'var(--warn)' } : undefined}>
                        {t.a.answer}
                      </div>

                      {t.a.handoff && (
                        <div
                          className="row"
                          style={{
                            gap: 9, padding: '9px 13px',
                            border: '1px solid var(--warn-line)', borderLeft: '2px solid var(--warn)',
                            borderRadius: 4, background: 'var(--warn-soft)',
                          }}
                        >
                          <Icon name="user" size={14} style={{ color: 'var(--warn)', flexShrink: 0 }} />
                          <span style={{ fontSize: 11.5, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                            Уверенность ниже порога. Запрос передан ответственному сотруднику — решение принимает человек.
                          </span>
                        </div>
                      )}

                      {t.a.sources.length > 0 && (
                        <div className="col" style={{ gap: 6 }}>
                          <span className="label">Источники ответа</span>
                          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                            {t.a.sources.map((s) => (
                              <span key={s.id} className="src-chip" onClick={() => openSource(s.kind, s.id)}>
                                <Icon name={SOURCE_ICON[s.kind] ?? 'document'} size={11} />
                                <span className="mono">{s.id}</span>
                                <span style={{ color: 'var(--text-faint)' }}>{s.title}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="row" style={{ gap: 12, fontSize: 10, color: 'var(--text-faint)', flexWrap: 'wrap' }}>
                        <span className="mono">{t.a.request_id}</span>
                        <span>{t.a.model}</span>
                        <span className="row" style={{ gap: 5 }}>
                          уверенность
                          <span style={{ width: 46, display: 'inline-block' }}>
                            <Meter
                              value={t.a.confidence * 100}
                              color={t.a.confidence >= 0.75 ? 'var(--ok)' : t.a.confidence >= 0.6 ? 'var(--warn)' : 'var(--danger)'}
                              height={3}
                            />
                          </span>
                          <span className="num">{Math.round(t.a.confidence * 100)} %</span>
                        </span>
                        <span className="num">{num(t.a.latency_ms)} мс</span>
                        <span className="num">{fmtTime(t.a.at)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: 12, borderTop: '1px solid var(--line)' }}>
          <div className="row" style={{ gap: 8 }}>
            <input
              className="input"
              style={{ height: 34 }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') ask(q); }}
              placeholder="Запрос к помощнику: сводка, похожие случаи, объяснение расчёта"
              disabled={busy}
            />
            <Button variant="primary" icon="send" disabled={busy || !q.trim()} onClick={() => ask(q)}>
              Отправить
            </Button>
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 6, display: 'block' }}>
            Все обращения и ответы журналируются с учётом требований конфиденциальности.
          </span>
        </div>
      </div>

      {/* --- Ограничения --- */}
      <div className="col scroll-y" style={{ gap: 12 }}>
        <Panel title="Ограничения помощника" icon="lock" hud>
          <div className="col" style={{ gap: 9 }}>
            {[
              'Не изменяет уровень угрозы',
              'Не открывает и не закрывает события',
              'Не отправляет уведомления',
              'Не имеет прямого доступа к рабочей базе',
            ].map((t) => (
              <div key={t} className="row" style={{ gap: 9, fontSize: 11.5, color: 'var(--text-dim)' }}>
                <Icon name="ban" size={13} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                <span>{t}</span>
              </div>
            ))}
            <div className="divider" />
            {[
              'Каждый ответ содержит источники',
              'Указывается уверенность и версия модели',
              'При низкой уверенности — передача сотруднику',
              'Все запросы журналируются',
            ].map((t) => (
              <div key={t} className="row" style={{ gap: 9, fontSize: 11.5, color: 'var(--text-dim)' }}>
                <Icon name="check" size={13} style={{ color: 'var(--ok)', flexShrink: 0 }} />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Контур размещения" icon="integrations" hud>
          <KV items={[
            ['Версия модели', <span className="mono" style={{ fontSize: 10.5 }}>{AI_MODEL}</span>],
            ['Размещение', 'Отдельно от Django backend'],
            ['Доступ к БД', <span style={{ color: 'var(--danger)' }}>отсутствует</span>],
            ['Передача контекста', 'Внутренний API, минимально необходимый срез'],
            ['Порог передачи сотруднику', <span className="num">60 %</span>],
          ]} />
        </Panel>

        <Panel title="Запросы в этой сессии" icon="history" hud>
          {turns.length === 0 ? (
            <Empty icon="history" text="Обращений не было" />
          ) : (
            turns.filter((t) => t.a).map((t, i) => (
              <div key={i} className="col" style={{ gap: 3, padding: '7px 0', borderBottom: '1px solid var(--line-soft)' }}>
                <span style={{ fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.q}</span>
                <div className="row" style={{ gap: 8, fontSize: 10, color: 'var(--text-faint)' }}>
                  <span className="mono">{t.a!.request_id}</span>
                  <span
                    className="num"
                    style={{ color: t.a!.confidence >= 0.75 ? 'var(--ok)' : t.a!.confidence >= 0.6 ? 'var(--warn)' : 'var(--danger)' }}
                  >
                    {Math.round(t.a!.confidence * 100)} %
                  </span>
                  <span className="spacer" />
                  <span>{t.a!.sources.length} источн.</span>
                </div>
              </div>
            ))
          )}
        </Panel>
      </div>
    </div>
  );
}
