import type {
  HazardType, StructureKind, StructureCondition, ThreatLevel, Channel,
  EventStatus, ActionStatus, ResourceKind, FacilityKind, DataFreshness,
  NotificationStatus, DeliveryState, StationStatus, ResourceState,
} from '../types';

export const hazardLabel: Record<HazardType, string> = {
  landslide: 'Оползень',
  mudflow: 'Сель',
  flood: 'Паводок',
  avalanche: 'Лавина',
  seismic: 'Сейсмика',
  tailings: 'Хвостохранилище',
  rockfall: 'Камнепад',
};

export const hazardIcon: Record<HazardType, string> = {
  landslide: 'landslide',
  mudflow: 'mudflow',
  flood: 'flood',
  avalanche: 'avalanche',
  seismic: 'seismic',
  tailings: 'tailings',
  rockfall: 'rockfall',
};

export const levelLabel: Record<ThreatLevel, string> = {
  1: 'Фоновый',
  2: 'Повышенный',
  3: 'Высокий',
  4: 'Критический',
  5: 'Чрезвычайный',
};

/* Цвета берутся из переменных темы: при переключении оформления
   значения меняются сами, дублировать палитру в коде не нужно. */
export const levelColor: Record<ThreatLevel, string> = {
  1: 'var(--lvl-1)',
  2: 'var(--lvl-2)',
  3: 'var(--lvl-3)',
  4: 'var(--lvl-4)',
  5: 'var(--lvl-5)',
};

export const structureLabel: Record<StructureKind, string> = {
  dam: 'Дамба',
  channel: 'Канал',
  chute: 'Селелоток',
  wall: 'Подпорная стена',
  barrier: 'Селезадерживающий барьер',
  pumping: 'Насосная станция',
};

export const conditionLabel: Record<StructureCondition, string> = {
  good: 'Исправно',
  satisfactory: 'Удовлетворительно',
  limited: 'Ограниченно работоспособно',
  critical: 'Аварийное',
};

export const conditionColor: Record<StructureCondition, string> = {
  good: 'var(--ok)',
  satisfactory: 'var(--warn)',
  limited: 'var(--lvl-3)',
  critical: 'var(--danger)',
};

export const freshnessLabel: Record<DataFreshness, string> = {
  actual: 'Актуально',
  aging: 'Требует обновления',
  overdue: 'Просрочено',
};

export const freshnessColor: Record<DataFreshness, string> = {
  actual: 'var(--ok)',
  aging: 'var(--warn)',
  overdue: 'var(--danger)',
};

export const channelLabel: Record<Channel, string> = {
  telegram: 'Telegram',
  sms: 'SMS',
  internal: 'Служебный канал',
  siren: 'Сирены оповещения',
  radio: 'Радиовещание',
};

export const eventStatusLabel: Record<EventStatus, string> = {
  monitoring: 'Наблюдение',
  active: 'Активное',
  contained: 'Локализовано',
  closed: 'Закрыто',
};

export const eventStatusColor: Record<EventStatus, string> = {
  monitoring: 'var(--warn)',
  active: 'var(--danger)',
  contained: 'var(--accent)',
  closed: 'var(--text-dim)',
};

export const actionStatusLabel: Record<ActionStatus, string> = {
  pending: 'Не начато',
  in_progress: 'Выполняется',
  done: 'Выполнено',
  overdue: 'Просрочено',
};

export const actionStatusColor: Record<ActionStatus, string> = {
  pending: 'var(--text-dim)',
  in_progress: 'var(--accent)',
  done: 'var(--ok)',
  overdue: 'var(--danger)',
};

export const resourceLabel: Record<ResourceKind, string> = {
  fire: 'Пожарно-спасательная часть',
  rescue: 'Аварийно-спасательный отряд',
  medical: 'Медицинская бригада',
  engineering: 'Инженерная техника',
  police: 'Наряд ОВД',
};

export const resourceStateLabel: Record<ResourceState, string> = {
  ready: 'В готовности',
  deployed: 'Задействовано',
  maintenance: 'Обслуживание',
};

export const facilityLabel: Record<FacilityKind, string> = {
  school: 'Школа',
  hospital: 'Больница',
  kindergarten: 'Детский сад',
  boiler: 'Котельная',
  water: 'Водозабор',
  admin: 'Административное здание',
};

export const notificationStatusLabel: Record<NotificationStatus, string> = {
  draft: 'Черновик',
  awaiting_approval: 'Ожидает подтверждения',
  approved: 'Подтверждено',
  sending: 'Отправляется',
  delivered: 'Доставлено',
  rejected: 'Отклонено',
};

export const notificationStatusColor: Record<NotificationStatus, string> = {
  draft: 'var(--text-dim)',
  awaiting_approval: 'var(--warn)',
  approved: 'var(--accent)',
  sending: 'var(--accent)',
  delivered: 'var(--ok)',
  rejected: 'var(--danger)',
};

export const deliveryStateLabel: Record<DeliveryState, string> = {
  queued: 'В очереди',
  sent: 'Отправлено',
  delivered: 'Доставлено',
  failed: 'Ошибка',
};

export const stationStatusLabel: Record<StationStatus, string> = {
  online: 'На связи',
  delayed: 'Задержка данных',
  offline: 'Нет связи',
};

export const stationStatusColor: Record<StationStatus, string> = {
  online: 'var(--ok)',
  delayed: 'var(--warn)',
  offline: 'var(--danger)',
};
