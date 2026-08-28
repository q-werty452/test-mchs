/* Доменная модель по ТЗ «Туруктуу Жалалабад» (разделы 4–9).
   Типы описывают целевую систему; сейчас их наполняет мок из src/data. */

/* ---------- 4. Пользователи и роли ---------- */

export type RoleId =
  | 'leadership'      // Руководство области
  | 'oblast_mchs'     // Областное МЧС
  | 'rayon_mchs'      // Районное МЧС
  | 'akim'            // Аким / администрация
  | 'operator'        // Оператор
  | 'public';         // Население

export interface Role {
  id: RoleId;
  title: string;
  org: string;
  access: string;
  /** null — вся область; иначе коды доступных территорий */
  territories: string[] | null;
  can: Permission[];
}

export type Permission =
  | 'zone.edit'
  | 'event.create'
  | 'event.close'
  | 'notification.draft'
  | 'notification.approve'
  | 'import.confirm'
  | 'structure.edit'
  | 'audit.view'
  | 'ai.query';

/* ---------- 5.1 Территории и организации ---------- */

export type TerritoryKind = 'rayon' | 'city';

export interface Territory {
  code: string;
  name: string;
  kind: TerritoryKind;
  center: string;            // административный центр
  population: number;
  settlements: number;
  area_km2: number;
  /** уровень угрозы 1..5, рассчитан детерминированным движком */
  threat: ThreatLevel;
  geometry: [number, number][];  // упрощённый контур
  centroid: [number, number];
  pilot?: boolean;
}

/* ---------- 5.2 Зоны риска ---------- */

export type HazardType =
  | 'landslide'   // оползень
  | 'mudflow'     // сель
  | 'flood'       // паводок
  | 'avalanche'   // лавина
  | 'seismic'     // сейсмика
  | 'tailings'    // хвостохранилище
  | 'rockfall';   // камнепад

export type ThreatLevel = 1 | 2 | 3 | 4 | 5;

export type DataFreshness = 'actual' | 'aging' | 'overdue';

export interface Survey {
  date: string;
  org: string;
  result: string;
  inspector: string;
}

export interface DocRef {
  id: string;
  title: string;
  kind: 'act' | 'order' | 'map' | 'photo' | 'report' | 'protocol';
  date: string;
  size_kb: number;
  access: 'public' | 'internal' | 'restricted';
}

export interface RiskZone {
  id: string;
  name: string;
  hazard: HazardType;
  level: ThreatLevel;
  territory: string;
  settlement: string;
  geometry: [number, number][];
  centroid: [number, number];
  area_ha: number;
  population_at_risk: number;
  households: number;
  /** 5.10 источник и владелец данных */
  source: string;
  owner: string;
  version: string;
  actual_at: string;
  freshness: DataFreshness;
  status: 'approved' | 'draft' | 'review';
  surveys: Survey[];
  docs: DocRef[];
  description: string;
  monitoring: string;
  structures: string[];   // id защитных сооружений
}

/* ---------- 5.4 Защитные сооружения ---------- */

export type StructureKind = 'dam' | 'channel' | 'chute' | 'wall' | 'barrier' | 'pumping';

export type StructureCondition = 'good' | 'satisfactory' | 'limited' | 'critical';

export interface ProtectiveStructure {
  id: string;
  name: string;
  kind: StructureKind;
  territory: string;
  coords: [number, number];
  built_year: number;
  length_m?: number;
  height_m?: number;
  capacity_m3s?: number;
  condition: StructureCondition;
  wear_pct: number;
  last_repair: string | null;
  next_inspection: string;
  owner: string;
  protects: string[];   // id зон
  note: string;
}

/* ---------- 5.5 Метеоданные ---------- */

export type StationStatus = 'online' | 'delayed' | 'offline';

export interface Measurement {
  t: string;             // ISO-время
  precip_mm: number;     // осадки за час
  temp_c: number;
  level_cm: number;      // уровень реки
  wind_ms: number;
  soil_pct: number;      // влагонасыщение грунта
}

export interface WeatherStation {
  id: string;
  name: string;
  territory: string;
  coords: [number, number];
  altitude_m: number;
  river: string | null;
  status: StationStatus;
  last_sync: string;
  interval_min: number;
  operator: string;
  series: Measurement[];
  errors: string[];
}

/* ---------- 5.6 Население и объекты ---------- */

export type FacilityKind = 'school' | 'hospital' | 'kindergarten' | 'boiler' | 'water' | 'admin';

export interface Facility {
  id: string;
  name: string;
  kind: FacilityKind;
  territory: string;
  coords: [number, number];
  capacity: number;
  in_zone: string | null;   // id зоны риска
  responsible: string;
  phone: string;
}

/* ---------- 5.7 Реагирование ---------- */

export type ResourceKind = 'fire' | 'rescue' | 'medical' | 'engineering' | 'police';

export type ResourceState = 'ready' | 'deployed' | 'maintenance';

export interface ResourceUnit {
  id: string;
  name: string;
  kind: ResourceKind;
  territory: string;
  base: string;
  coords: [number, number];
  personnel: number;
  vehicles: number;
  state: ResourceState;
  readiness_min: number;
  commander: string;
}

export interface EvacuationRoute {
  id: string;
  name: string;
  from_zone: string;
  to_shelter: string;
  path: [number, number][];
  length_km: number;
  capacity_per_h: number;
  condition: 'open' | 'limited' | 'blocked';
  note: string;
}

export interface Shelter {
  id: string;
  name: string;
  territory: string;
  coords: [number, number];
  capacity: number;
  occupied: number;
  facilities: string[];
  responsible: string;
  phone: string;
}

/* ---------- 5.3 Исторические события и текущие ЧС ---------- */

export type EventStatus = 'monitoring' | 'active' | 'contained' | 'closed';

export type ActionStatus = 'pending' | 'in_progress' | 'done' | 'overdue';

export interface EventAction {
  id: string;
  title: string;
  assignee: string;
  org: string;
  due: string;
  status: ActionStatus;
  completed_at: string | null;
  note?: string;
}

export interface TimelineEntry {
  t: string;
  actor: string;
  text: string;
  kind: 'system' | 'operator' | 'field' | 'decision' | 'notification';
}

export interface Consequences {
  affected: number;
  evacuated: number;
  injured: number;
  fatalities: number;
  houses_damaged: number;
  roads_km: number;
  damage_som_mln: number;
}

export interface EmergencyEvent {
  id: string;
  title: string;
  hazard: HazardType;
  level: ThreatLevel;
  status: EventStatus;
  territory: string;
  settlement: string;
  zone: string | null;
  coords: [number, number];
  started_at: string;
  closed_at: string | null;
  declared_by: string;
  consequences: Consequences;
  actions: EventAction[];
  timeline: TimelineEntry[];
  resources: string[];
  summary: string;
  report: string | null;
}

/* ---------- 5.8 Угрозы и правила ---------- */

export interface ThresholdRule {
  id: string;
  hazard: HazardType;
  name: string;
  /** формула в человекочитаемом виде — движок детерминированный, без LLM */
  expression: string;
  params: { key: string; label: string; value: number; unit: string }[];
  level_if_true: ThreatLevel;
  approved_by: string;
  approved_at: string;
  doc: string;
  active: boolean;
}

export interface RuleEvaluation {
  rule: string;
  station: string;
  inputs: Record<string, number>;
  triggered: boolean;
  computed_level: ThreatLevel;
  at: string;
}

/* ---------- 5.9 Уведомления ---------- */

export type Channel = 'telegram' | 'sms' | 'internal' | 'siren' | 'radio';

export type NotificationStatus =
  | 'draft'
  | 'awaiting_approval'
  | 'approved'
  | 'sending'
  | 'delivered'
  | 'rejected';

export type DeliveryState = 'queued' | 'sent' | 'delivered' | 'failed';

export interface DeliveryRecord {
  id: string;
  channel: Channel;
  target: string;
  recipients: number;
  state: DeliveryState;
  sent_at: string | null;
  delivered: number;
  failed: number;
  error?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  hazard: HazardType;
  level: ThreatLevel;
  channels: Channel[];
  audience: 'public' | 'staff' | 'both';
  body: string;   // с плейсхолдерами {settlement}, {level}, ...
  approved_by: string;
}

export interface Notification {
  id: string;
  template: string | null;
  event: string | null;
  subject: string;
  body: string;
  audience: 'public' | 'staff' | 'both';
  channels: Channel[];
  territory: string;
  status: NotificationStatus;
  created_at: string;
  created_by: string;
  approved_at: string | null;
  approved_by: string | null;
  rejected_reason?: string;
  deliveries: DeliveryRecord[];
  recipients_total: number;
}

/* ---------- 5.10 Документы и аудит ---------- */

export interface AuditEntry {
  id: string;
  t: string;
  actor: string;
  role: RoleId;
  action: string;
  object: string;
  object_id: string;
  field?: string;
  old_value?: string;
  new_value?: string;
  ip: string;
  result: 'ok' | 'denied';
  request_id: string;
}

/* ---------- 5.11 AI-помощник (раздел 8) ---------- */

export interface AiSource {
  kind: 'zone' | 'event' | 'doc' | 'station' | 'rule';
  id: string;
  title: string;
}

export interface AiAnswer {
  request_id: string;
  model: string;
  question: string;
  answer: string;
  confidence: number;          // 0..1
  sources: AiSource[];
  handoff: boolean;            // низкая уверенность → решение сотруднику
  latency_ms: number;
  at: string;
}

/* ---------- 9. Интеграции ---------- */

export type IntegrationState = 'ok' | 'degraded' | 'down';

export interface Integration {
  id: string;
  name: string;
  owner: string;
  purpose: string;
  state: IntegrationState;
  last_ok: string;
  latency_ms: number;
  today_calls: number;
  today_errors: number;
  note: string;
}
