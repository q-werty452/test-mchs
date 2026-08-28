import { useState, useMemo } from 'react';
import { api } from '../api/client';
import { useData, useApp } from '../state/app';
import { Button, Level, Badge } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { hazardLabel, hazardIcon, levelColor, levelLabel } from '../data/dicts';
import { territoryName } from '../data/territories';
import { num } from '../ui/format';
import type { ThreatLevel, HazardType } from '../types';
import './screens.css';

/** Создание события ЧС. Уровень и зона подставляются из реестра,
    решение принимает человек — расчётный движок даёт только основание. */
export function NewEventDialog({
  onClose, onCreated, presetZone,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
  presetZone?: string;
}) {
  const { actor, toast, inScope } = useApp();
  const { data: zones } = useData(() => api.getZones(), []);
  const { data: evals } = useData(() => api.getRuleEvaluations(), []);

  const available = useMemo(
    () => (zones ?? []).filter((z) => inScope(z.territory)).slice().sort((a, b) => b.level - a.level),
    [zones, inScope],
  );

  const [zoneId, setZoneId] = useState(presetZone ?? '');
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState<ThreatLevel>(3);
  const [summary, setSummary] = useState('');
  const [busy, setBusy] = useState(false);
  const [touchedTitle, setTouchedTitle] = useState(false);

  const zone = available.find((z) => z.id === zoneId);
  const triggered = (evals ?? []).filter((e) => e.triggered);

  const pickZone = (id: string) => {
    setZoneId(id);
    const z = available.find((x) => x.id === id);
    if (z) {
      setLevel(z.level);
      if (!touchedTitle) setTitle(`${hazardLabel[z.hazard]}: угроза в районе ${z.settlement}`);
      if (!summary) {
        setSummary(
          `Основание: данные мониторинга по зоне ${z.id}. ${z.description} ` +
          `В зоне возможного воздействия ${num(z.population_at_risk)} человек, ${num(z.households)} домохозяйств.`,
        );
      }
    }
  };

  const submit = async () => {
    if (!zone) return;
    setBusy(true);
    const res = await api.createEvent(
      {
        title: title.trim() || `${hazardLabel[zone.hazard]}: ${zone.settlement}`,
        hazard: zone.hazard as HazardType,
        level,
        territory: zone.territory,
        settlement: zone.settlement,
        zone: zone.id,
        coords: zone.centroid,
        summary: summary.trim(),
      },
      actor,
    );
    setBusy(false);
    if (res.ok && res.id) {
      toast('ok', `Событие ${res.id} открыто в статусе наблюдения. Запись внесена в журнал аудита.`);
      onCreated(res.id);
    } else {
      toast('err', res.reason ?? 'Создание события отклонено');
    }
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <Icon name="events" size={17} style={{ color: 'var(--accent)' }} />
          <div className="col" style={{ gap: 1 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Открытие события ЧС</span>
            <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>
              Решение принимает уполномоченный сотрудник. Расчёт правил даёт только основание.
            </span>
          </div>
          <div className="spacer" />
          <Button icon="close" variant="ghost" size="sm" onClick={onClose} />
        </div>

        <div className="modal__body">
          {triggered.length > 0 && (
            <div
              style={{
                padding: '10px 13px', marginBottom: 16,
                border: '1px solid var(--danger-line)', borderLeft: '2px solid var(--danger)',
                borderRadius: 4, background: 'var(--danger-soft)',
              }}
            >
              <div className="row" style={{ gap: 7, marginBottom: 7 }}>
                <Icon name="alert" size={13} style={{ color: 'var(--danger)' }} />
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--danger)' }}>
                  Сработавшие пороги на момент открытия
                </span>
              </div>
              {triggered.map((t, i) => (
                <div key={i} className="row" style={{ gap: 9, fontSize: 11, padding: '2px 0', color: 'var(--text-dim)' }}>
                  <span className="mono">{t.rule}</span>
                  <span className="faint">·</span>
                  <span className="mono">{t.station}</span>
                  <span className="spacer" />
                  {Object.entries(t.inputs).map(([k, v]) => (
                    <span key={k} className="tag">{k}: <span className="num" style={{ color: 'var(--danger)' }}>{v}</span></span>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="field" style={{ marginBottom: 14 }}>
            <span className="label">Зона риска — основание события</span>
            <select className="select" value={zoneId} onChange={(e) => pickZone(e.target.value)}>
              <option value="">— выберите зону из реестра —</option>
              {available.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.id} · {z.name} (уровень {z.level}, {territoryName(z.territory)})
                </option>
              ))}
            </select>
          </div>

          {zone && (
            <div
              className="row"
              style={{
                gap: 11, padding: '11px 13px', marginBottom: 16,
                border: '1px solid var(--line)', borderRadius: 4, background: 'var(--bg-input)',
              }}
            >
              <span
                style={{
                  width: 30, height: 30, display: 'grid', placeItems: 'center', flexShrink: 0,
                  border: `1px solid ${levelColor[zone.level]}`, borderRadius: 4, color: levelColor[zone.level],
                }}
              >
                <Icon name={hazardIcon[zone.hazard]} size={15} />
              </span>
              <div className="col" style={{ gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 12 }}>{zone.name}</span>
                <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>
                  {territoryName(zone.territory)}, {zone.settlement} · {num(zone.population_at_risk)} чел · {num(zone.households)} домохозяйств
                </span>
              </div>
              <div className="spacer" />
              <Badge color={levelColor[zone.level]}>текущий уровень {zone.level}</Badge>
            </div>
          )}

          <div className="field" style={{ marginBottom: 14 }}>
            <span className="label">Наименование события</span>
            <input
              className="input"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setTouchedTitle(true); }}
              placeholder="Например: Угроза схода селя в водосборе Кёк-Арт"
            />
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <span className="label">Уровень события</span>
            <div className="row" style={{ gap: 6 }}>
              {([1, 2, 3, 4, 5] as ThreatLevel[]).map((lv) => (
                <button
                  key={lv}
                  onClick={() => setLevel(lv)}
                  style={{
                    flex: 1, height: 40, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    background: lv === level ? `color-mix(in srgb, ${levelColor[lv]} 18%, transparent)` : 'var(--bg-input)',
                    border: `1px solid ${lv === level ? levelColor[lv] : 'var(--line)'}`,
                    borderRadius: 4, color: lv === level ? levelColor[lv] : 'var(--text-dim)',
                  }}
                >
                  <span className="num" style={{ fontSize: 13, fontWeight: 600 }}>{lv}</span>
                  <span style={{ fontSize: 9 }}>{levelLabel[lv]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="label">Обоснование и краткое описание обстановки</span>
            <textarea
              className="textarea"
              rows={5}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Основание открытия события, наблюдаемая обстановка, принятые меры"
            />
          </div>
        </div>

        <div className="modal__foot">
          <Icon name="info" size={13} style={{ color: 'var(--text-faint)' }} />
          <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>
            Событие открывается в статусе «наблюдение». Все действия фиксируются в журнале аудита.
          </span>
          <div className="spacer" />
          <Button onClick={onClose}>Отмена</Button>
          <Button variant="primary" icon="check" disabled={!zone || busy} onClick={submit}>
            {busy ? 'Открытие…' : 'Открыть событие'}
          </Button>
        </div>
      </div>
    </div>
  );
}
