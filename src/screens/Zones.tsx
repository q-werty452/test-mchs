import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useData, useApp } from '../state/app';
import { Badge, Level, Button, Loading, Empty, Segmented } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { fmtDate, fmtAgo, num, daysBetween } from '../ui/format';
import { hazardLabel, hazardIcon, levelColor, freshnessLabel, freshnessColor } from '../data/dicts';
import { territoryName } from '../data/territories';
import type { ThreatLevel, HazardType, DataFreshness } from '../types';
import './screens.css';

type SortKey = 'level' | 'name' | 'population' | 'actual';

export function Zones() {
  const nav = useNavigate();
  const { inScope } = useApp();
  const { data: zones, loading } = useData(() => api.getZones(), []);

  const [q, setQ] = useState('');
  const [hazard, setHazard] = useState<HazardType | 'all'>('all');
  const [level, setLevel] = useState<ThreatLevel | 'all'>('all');
  const [fresh, setFresh] = useState<DataFreshness | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('level');

  const rows = useMemo(() => {
    let list = (zones ?? []).filter((z) => inScope(z.territory));
    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter(
        (z) => z.name.toLowerCase().includes(s) || z.id.toLowerCase().includes(s) ||
          z.settlement.toLowerCase().includes(s) || z.source.toLowerCase().includes(s),
      );
    }
    if (hazard !== 'all') list = list.filter((z) => z.hazard === hazard);
    if (level !== 'all') list = list.filter((z) => z.level === level);
    if (fresh !== 'all') list = list.filter((z) => z.freshness === fresh);

    return list.slice().sort((a, b) => {
      switch (sort) {
        case 'name': return a.name.localeCompare(b.name, 'ru');
        case 'population': return b.population_at_risk - a.population_at_risk;
        case 'actual': return new Date(a.actual_at).getTime() - new Date(b.actual_at).getTime();
        default: return b.level - a.level || b.population_at_risk - a.population_at_risk;
      }
    });
  }, [zones, q, hazard, level, fresh, sort, inScope]);

  const hazards = useMemo(
    () => Array.from(new Set((zones ?? []).map((z) => z.hazard))),
    [zones],
  );

  return (
    <div className="page page--flush" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="toolbar">
        <div className="search-box">
          <Icon name="search" size={13} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по названию, ID, источнику" />
        </div>

        <select className="select" style={{ width: 170 }} value={hazard} onChange={(e) => setHazard(e.target.value as HazardType | 'all')}>
          <option value="all">Все типы угроз</option>
          {hazards.map((h) => <option key={h} value={h}>{hazardLabel[h]}</option>)}
        </select>

        <select className="select" style={{ width: 150 }} value={level} onChange={(e) => setLevel(e.target.value === 'all' ? 'all' : (Number(e.target.value) as ThreatLevel))}>
          <option value="all">Все уровни</option>
          {[5, 4, 3, 2, 1].map((l) => <option key={l} value={l}>Уровень {l}</option>)}
        </select>

        <select className="select" style={{ width: 190 }} value={fresh} onChange={(e) => setFresh(e.target.value as DataFreshness | 'all')}>
          <option value="all">Любая свежесть данных</option>
          <option value="actual">Актуально</option>
          <option value="aging">Требует обновления</option>
          <option value="overdue">Просрочено</option>
        </select>

        <div className="spacer" />

        <Segmented
          value={sort}
          onChange={setSort}
          options={[
            { value: 'level', label: 'Уровень' },
            { value: 'population', label: 'Население' },
            { value: 'actual', label: 'Давность' },
            { value: 'name', label: 'Название' },
          ]}
        />
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>
          {rows.length} / {(zones ?? []).filter((z) => inScope(z.territory)).length}
        </span>
      </div>

      <div className="scroll-y" style={{ flex: 1 }}>
        {loading ? (
          <div style={{ padding: 16 }}><Loading rows={8} /></div>
        ) : rows.length === 0 ? (
          <Empty icon="search" text="Ничего не найдено" hint="Измените условия фильтра или строку поиска" />
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 96 }}>Идентификатор</th>
                <th>Наименование</th>
                <th style={{ width: 130 }}>Тип угрозы</th>
                <th style={{ width: 76 }}>Уровень</th>
                <th style={{ width: 180 }}>Территория</th>
                <th style={{ width: 110 }} className="r">Население</th>
                <th style={{ width: 84 }} className="r">Площадь, га</th>
                <th style={{ width: 180 }}>Актуальность</th>
                <th style={{ width: 44 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((z) => (
                <tr key={z.id} className="clickable" onClick={() => nav(`/zones/${z.id}`)}>
                  <td className="num" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{z.id}</td>
                  <td>
                    <div className="col" style={{ gap: 2 }}>
                      <span>{z.name}</span>
                      <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>{z.settlement}</span>
                    </div>
                  </td>
                  <td>
                    <span className="row" style={{ gap: 6, color: levelColor[z.level] }}>
                      <Icon name={hazardIcon[z.hazard]} size={14} />
                      <span style={{ color: 'var(--text-dim)', fontSize: 11.5 }}>{hazardLabel[z.hazard]}</span>
                    </span>
                  </td>
                  <td><Level value={z.level} size="sm" /></td>
                  <td style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{territoryName(z.territory)}</td>
                  <td className="r num">{num(z.population_at_risk)}</td>
                  <td className="r num" style={{ color: 'var(--text-dim)' }}>{num(z.area_ha)}</td>
                  <td>
                    <div className="row" style={{ gap: 7 }}>
                      <Badge color={freshnessColor[z.freshness]} dot>{freshnessLabel[z.freshness]}</Badge>
                      <span className="num" style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                        {daysBetween(z.actual_at)} дн
                      </span>
                    </div>
                  </td>
                  <td><Icon name="chevronRight" size={13} style={{ color: 'var(--text-faint)' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
