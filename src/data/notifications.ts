import type { Notification, NotificationTemplate, DeliveryRecord } from '../types';
import { iso, isoDays } from './_util';

export const templates: NotificationTemplate[] = [
  {
    id: 'TPL-MUD-01', name: 'Сель. Угроза схода', hazard: 'mudflow', level: 4,
    channels: ['telegram', 'sms', 'internal'], audience: 'both',
    body:
      'ВНИМАНИЕ. МЧС Кыргызской Республики.\n' +
      'В районе {settlement} объявлен {level} уровень селевой опасности.\n' +
      'Не приближайтесь к руслам рек и селевым лоткам. Не пересекайте водотоки на транспорте.\n' +
      'При получении команды на эвакуацию следуйте по маршруту {route} в пункт временного размещения {shelter}.\n' +
      'Справочная служба: 112.',
    approved_by: 'Приказ УМЧС № 114 от 12.03.2026',
  },
  {
    id: 'TPL-LND-01', name: 'Оползень. Угроза активизации', hazard: 'landslide', level: 4,
    channels: ['telegram', 'sms', 'siren'], audience: 'both',
    body:
      'ВНИМАНИЕ. МЧС Кыргызской Республики.\n' +
      'В районе {settlement} зафиксирована активизация оползневого участка.\n' +
      'Покиньте здания, расположенные у подошвы склона. Не находитесь в зоне возможного смещения грунта.\n' +
      'Пункт временного размещения: {shelter}. Справочная служба: 112.',
    approved_by: 'Приказ УМЧС № 118 от 19.03.2026',
  },
  {
    id: 'TPL-FLD-01', name: 'Паводок. Превышение отметки', hazard: 'flood', level: 3,
    channels: ['telegram', 'sms'], audience: 'public',
    body:
      'ВНИМАНИЕ. МЧС Кыргызской Республики.\n' +
      'Уровень воды в реке у {settlement} превысил отметку предупреждения.\n' +
      'Уберите имущество и скот с пойменных участков. Не оставляйте детей без присмотра у воды.\n' +
      'Справочная служба: 112.',
    approved_by: 'Совместный регламент с Кыргызгидрометом от 04.02.2026',
  },
  {
    id: 'TPL-AVL-01', name: 'Лавина. Ограничение движения', hazard: 'avalanche', level: 4,
    channels: ['telegram', 'radio'], audience: 'public',
    body:
      'ВНИМАНИЕ. МЧС Кыргызской Республики.\n' +
      'На участке {settlement} объявлена лавинная опасность, движение транспорта ограничено.\n' +
      'Воздержитесь от поездок до снятия ограничения. Справочная служба: 112.',
    approved_by: 'Приказ УМЧС № 121 от 27.03.2026',
  },
  {
    id: 'TPL-STF-01', name: 'Служебное. Сбор оперативной группы', hazard: 'mudflow', level: 3,
    channels: ['internal'], audience: 'staff',
    body:
      'Служебное сообщение. Оперативной группе {org} прибыть к месту сбора.\n' +
      'Основание: событие {event}. Время готовности: {time}.',
    approved_by: 'Регламент ЦУКС',
  },
];

function d(
  id: string, channel: DeliveryRecord['channel'], target: string, recipients: number,
  state: DeliveryRecord['state'], sentH: number | null, delivered: number, failed: number, error?: string,
): DeliveryRecord {
  return { id, channel, target, recipients, state, sent_at: sentH === null ? null : iso(sentH), delivered, failed, error };
}

export const notifications: Notification[] = [
  {
    id: 'NT-2026-0411',
    template: 'TPL-MUD-01',
    event: 'EV-2026-0184',
    subject: 'Селевая опасность: с. Барпы, Сузакский район',
    body:
      'ВНИМАНИЕ. МЧС Кыргызской Республики.\n' +
      'В районе с. Барпы объявлен критический уровень селевой опасности.\n' +
      'Не приближайтесь к руслам рек и селевым лоткам. Не пересекайте водотоки на транспорте.\n' +
      'При получении команды на эвакуацию следуйте по маршруту «Барпы — Дом культуры Барпы» в пункт временного размещения ПВР «Дом культуры Барпы».\n' +
      'Справочная служба: 112.',
    audience: 'both',
    channels: ['telegram', 'sms', 'internal'],
    territory: 'suzak',
    status: 'delivered',
    created_at: iso(-8.7),
    created_by: 'Оператор ОДС Жумабаев А.',
    approved_at: iso(-8.4),
    approved_by: 'Начальник смены Сатыбалдиев Э.',
    recipients_total: 4127,
    deliveries: [
      d('DL-1', 'telegram', 'Канал «МЧС Джалал-Абад»', 2840, 'delivered', -8.35, 2840, 0),
      d('DL-2', 'sms', 'Абоненты в зоне Z-SZK-002', 1240, 'delivered', -8.3, 1191, 49, '49 номеров вне зоны обслуживания'),
      d('DL-3', 'internal', 'Служебный канал ЦУКС', 47, 'delivered', -8.38, 47, 0),
    ],
  },
  {
    id: 'NT-2026-0412',
    template: 'TPL-STF-01',
    event: 'EV-2026-0184',
    subject: 'Служебное: сбор инженерной группы ИГ-2',
    body:
      'Служебное сообщение. Оперативной группе Инженерная группа ИГ-2 прибыть к месту сбора.\n' +
      'Основание: событие EV-2026-0184. Время готовности: 30 минут.',
    audience: 'staff',
    channels: ['internal'],
    territory: 'suzak',
    status: 'delivered',
    created_at: iso(-7.1),
    created_by: 'Оператор ОДС Жумабаев А.',
    approved_at: iso(-7.05),
    approved_by: 'Начальник смены Сатыбалдиев Э.',
    recipients_total: 16,
    deliveries: [d('DL-4', 'internal', 'Инженерная группа ИГ-2', 16, 'delivered', -7.03, 16, 0)],
  },
  {
    id: 'NT-2026-0413',
    template: 'TPL-LND-01',
    event: 'EV-2026-0183',
    subject: 'Оползневая опасность: г. Майлуу-Суу',
    body:
      'ВНИМАНИЕ. МЧС Кыргызской Республики.\n' +
      'В районе г. Майлуу-Суу зафиксирована активизация оползневого участка.\n' +
      'Покиньте здания, расположенные у подошвы склона. Не находитесь в зоне возможного смещения грунта.\n' +
      'Пункт временного размещения: ПВР «Гимназия Майлуу-Суу». Справочная служба: 112.',
    audience: 'both',
    channels: ['telegram', 'sms', 'siren'],
    territory: 'mailuu-suu',
    status: 'awaiting_approval',
    created_at: iso(-1.6),
    created_by: 'Оператор ОДС Осмонова Г.',
    approved_at: null,
    approved_by: null,
    recipients_total: 3180,
    deliveries: [],
  },
  {
    id: 'NT-2026-0409',
    template: 'TPL-FLD-01',
    event: 'EV-2026-0181',
    subject: 'Паводковая обстановка: г. Кара-Куль',
    body:
      'ВНИМАНИЕ. МЧС Кыргызской Республики.\n' +
      'Уровень воды в реке у г. Кара-Куль превысил отметку предупреждения.\n' +
      'Уберите имущество и скот с пойменных участков. Не оставляйте детей без присмотра у воды.\n' +
      'Справочная служба: 112.',
    audience: 'public',
    channels: ['telegram', 'sms'],
    territory: 'kara-kul',
    status: 'delivered',
    created_at: isoDays(-3.8),
    created_by: 'Оператор ОДС Жумабаев А.',
    approved_at: isoDays(-3.78),
    approved_by: 'Начальник смены Сатыбалдиев Э.',
    recipients_total: 2210,
    deliveries: [
      d('DL-5', 'telegram', 'Канал «МЧС Джалал-Абад»', 1480, 'delivered', -91, 1480, 0),
      d('DL-6', 'sms', 'Абоненты г. Кара-Куль', 730, 'delivered', -91, 706, 24, '24 номера вне зоны обслуживания'),
    ],
  },
  {
    id: 'NT-2026-0405',
    template: 'TPL-AVL-01',
    event: null,
    subject: 'Ограничение движения: перевал Ала-Бель',
    body:
      'ВНИМАНИЕ. МЧС Кыргызской Республики.\n' +
      'На участке перевал Ала-Бель объявлена лавинная опасность, движение транспорта ограничено.\n' +
      'Воздержитесь от поездок до снятия ограничения. Справочная служба: 112.',
    audience: 'public',
    channels: ['telegram', 'radio'],
    territory: 'toktogul',
    status: 'rejected',
    created_at: isoDays(-9.2),
    created_by: 'Оператор ОДС Осмонова Г.',
    approved_at: null,
    approved_by: null,
    rejected_reason: 'Не подтверждено данными снеголавинной станции. Направлено на уточнение.',
    recipients_total: 0,
    deliveries: [],
  },
];

export const notificationById = (id: string) => notifications.find((n) => n.id === id);
