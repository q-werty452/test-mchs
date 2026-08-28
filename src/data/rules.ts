import type { ThresholdRule, RuleEvaluation, ThreatLevel } from '../types';
import { isoDays, iso } from './_util';
import { stations, precipSum, lastMeasurement } from './stations';

/* Раздел 5.8 ТЗ: утверждённые пороги и расчётный движок БЕЗ участия LLM.
   Правила детерминированы, воспроизводимы и имеют документ-основание. */

export const rules: ThresholdRule[] = [
  {
    id: 'R-MUD-02', hazard: 'mudflow', name: 'Сель. Угроза схода по осадкам и влагонасыщению',
    expression: 'осадки_12ч ≥ P12 И влагонасыщение ≥ SOIL',
    params: [
      { key: 'P12', label: 'Осадки за 12 часов', value: 30, unit: 'мм' },
      { key: 'SOIL', label: 'Влагонасыщение грунта', value: 72, unit: '%' },
    ],
    level_if_true: 4,
    approved_by: 'Приказ УМЧС по Джалал-Абадской области № 114 от 12.03.2026',
    approved_at: isoDays(-164),
    doc: 'Регламент определения уровней селевой опасности',
    active: true,
  },
  {
    id: 'R-MUD-01', hazard: 'mudflow', name: 'Сель. Повышенная готовность',
    expression: 'осадки_6ч ≥ P6',
    params: [{ key: 'P6', label: 'Осадки за 6 часов', value: 18, unit: 'мм' }],
    level_if_true: 3,
    approved_by: 'Приказ УМЧС по Джалал-Абадской области № 114 от 12.03.2026',
    approved_at: isoDays(-164),
    doc: 'Регламент определения уровней селевой опасности',
    active: true,
  },
  {
    id: 'R-FLD-03', hazard: 'flood', name: 'Паводок. Превышение отметки предупреждения',
    expression: 'уровень ≥ H_warn',
    params: [{ key: 'H_warn', label: 'Отметка предупреждения', value: 150, unit: 'см' }],
    level_if_true: 3,
    approved_by: 'Совместный регламент с Кыргызгидрометом от 04.02.2026',
    approved_at: isoDays(-200),
    doc: 'Регламент гидрологического оповещения',
    active: true,
  },
  {
    id: 'R-FLD-04', hazard: 'flood', name: 'Паводок. Отметка опасного явления',
    expression: 'уровень ≥ H_danger',
    params: [{ key: 'H_danger', label: 'Отметка опасного явления', value: 210, unit: 'см' }],
    level_if_true: 4,
    approved_by: 'Совместный регламент с Кыргызгидрометом от 04.02.2026',
    approved_at: isoDays(-200),
    doc: 'Регламент гидрологического оповещения',
    active: true,
  },
  {
    id: 'R-LND-02', hazard: 'landslide', name: 'Оползень. Прирост смещения выше нормы',
    expression: 'смещение_сут ≥ D_norm И осадки_72ч ≥ P72',
    params: [
      { key: 'D_norm', label: 'Суточный прирост смещения', value: 3, unit: 'мм' },
      { key: 'P72', label: 'Осадки за 72 часа', value: 45, unit: 'мм' },
    ],
    level_if_true: 4,
    approved_by: 'Приказ УМЧС по Джалал-Абадской области № 118 от 19.03.2026',
    approved_at: isoDays(-157),
    doc: 'Регламент мониторинга оползневых участков',
    active: true,
  },
  {
    id: 'R-AVL-01', hazard: 'avalanche', name: 'Лавина. Прирост снежного покрова',
    expression: 'прирост_снега_24ч ≥ S24 И температура ≥ T',
    params: [
      { key: 'S24', label: 'Прирост снежного покрова', value: 25, unit: 'см' },
      { key: 'T', label: 'Температура воздуха', value: -3, unit: '°C' },
    ],
    level_if_true: 4,
    approved_by: 'Приказ УМЧС по Джалал-Абадской области № 121 от 27.03.2026',
    approved_at: isoDays(-149),
    doc: 'Регламент оценки лавинной опасности',
    active: false,
  },
  {
    id: 'R-SEI-01', hazard: 'seismic', name: 'Сейсмика. Регистрация толчка',
    expression: 'магнитуда ≥ M',
    params: [{ key: 'M', label: 'Магнитуда', value: 4.5, unit: '' }],
    level_if_true: 3,
    approved_by: 'Соглашение с Институтом сейсмологии НАН КР от 15.01.2026',
    approved_at: isoDays(-220),
    doc: 'Регламент сейсмического оповещения',
    active: true,
  },
];

export const ruleById = (id: string) => rules.find((r) => r.id === id);

/** Детерминированный расчёт: одни и те же входы дают один и тот же результат. */
export function evaluateRules(): RuleEvaluation[] {
  const out: RuleEvaluation[] = [];

  for (const st of stations) {
    const last = lastMeasurement(st);
    if (!last || st.status === 'offline') continue;

    const p6 = precipSum(st, 6);
    const p12 = precipSum(st, 12);
    const p72 = precipSum(st, 72);

    for (const rule of rules) {
      if (!rule.active) continue;
      const p = Object.fromEntries(rule.params.map((x) => [x.key, x.value]));
      let triggered = false;
      let inputs: Record<string, number> = {};

      switch (rule.id) {
        case 'R-MUD-02':
          inputs = { 'осадки_12ч': p12, 'влагонасыщение': last.soil_pct };
          triggered = p12 >= p.P12 && last.soil_pct >= p.SOIL;
          break;
        case 'R-MUD-01':
          inputs = { 'осадки_6ч': p6 };
          triggered = p6 >= p.P6;
          break;
        case 'R-FLD-03':
          if (!st.river) continue;
          inputs = { 'уровень': last.level_cm };
          triggered = last.level_cm >= p.H_warn;
          break;
        case 'R-FLD-04':
          if (!st.river) continue;
          inputs = { 'уровень': last.level_cm };
          triggered = last.level_cm >= p.H_danger;
          break;
        case 'R-LND-02':
          inputs = { 'осадки_72ч': p72, 'смещение_сут': 0 };
          triggered = false;   // данные инклинометров поступают отдельным потоком
          break;
        default:
          continue;
      }

      out.push({
        rule: rule.id,
        station: st.id,
        inputs,
        triggered,
        computed_level: (triggered ? rule.level_if_true : 1) as ThreatLevel,
        at: iso(0),
      });
    }
  }
  return out;
}
