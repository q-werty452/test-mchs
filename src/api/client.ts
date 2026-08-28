/* Фасад доступа к данным.
   Сейчас читает демонстрационный мок из src/data и держит изменения в памяти.
   При переходе на рабочий backend меняется только этот файл:
   тела функций заменяются на fetch('/api/v1/...'), сигнатуры сохраняются. */

import type {
  RiskZone, ProtectiveStructure, WeatherStation, EmergencyEvent, Notification,
  AuditEntry, Territory, ResourceUnit, EvacuationRoute, Shelter, Facility,
  ThresholdRule, RuleEvaluation, Integration, AiAnswer, NotificationTemplate,
  ActionStatus, RoleId, DeliveryRecord, Channel, ThreatLevel, HazardType,
} from '../types';

import { territories } from '../data/territories';
import { zones as zonesSeed } from '../data/zones';
import { structures } from '../data/structures';
import { stations } from '../data/stations';
import { events as eventsSeed } from '../data/events';
import { notifications as notificationsSeed, templates } from '../data/notifications';
import { auditLog as auditSeed } from '../data/audit';
import { resources, routes, shelters, facilities } from '../data/response';
import { rules, evaluateRules } from '../data/rules';
import { integrations } from '../data/integrations';
import { askAi } from '../data/ai';
import { roles, roleById } from '../data/roles';
import { territoryName } from '../data/territories';

/* ---------- Изменяемое состояние стенда ---------- */

interface Store {
  zones: RiskZone[];
  events: EmergencyEvent[];
  notifications: Notification[];
  audit: AuditEntry[];
}

const store: Store = {
  zones: zonesSeed.map((z) => ({ ...z })),
  events: eventsSeed.map((e) => ({ ...e })),
  notifications: notificationsSeed.map((n) => ({ ...n })),
  audit: auditSeed.map((a) => ({ ...a })),
};

// связываем сооружения с зонами
for (const z of store.zones) {
  z.structures = structures.filter((s) => s.protects.includes(z.id)).map((s) => s.id);
}

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach((fn) => fn());
}

/* ---------- Имитация сети ---------- */

const delay = (min = 150, max = 400) =>
  new Promise<void>((r) => setTimeout(r, min + Math.random() * (max - min)));

let auditCounter = 9241;
let notificationCounter = 413;
let eventCounter = 184;

function nextRequestId() {
  return 'req_' + Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
}

function writeAudit(entry: Omit<AuditEntry, 'id' | 't' | 'ip' | 'request_id'>) {
  auditCounter += 1;
  store.audit.unshift({
    ...entry,
    id: `AU-${auditCounter}`,
    t: new Date().toISOString(),
    ip: '10.24.7.41',
    request_id: nextRequestId(),
  });
}

/* ---------- Справочники (изменений не бывает) ---------- */

export const api = {
  async getTerritories(): Promise<Territory[]> {
    await delay(80, 200);
    return territories;
  },

  async getRoles() {
    await delay(40, 100);
    return roles;
  },

  async getZones(): Promise<RiskZone[]> {
    await delay();
    return store.zones;
  },

  async getZone(id: string): Promise<RiskZone | undefined> {
    await delay(100, 250);
    return store.zones.find((z) => z.id === id);
  },

  async getStructures(): Promise<ProtectiveStructure[]> {
    await delay();
    return structures;
  },

  async getStations(): Promise<WeatherStation[]> {
    await delay();
    return stations;
  },

  async getEvents(): Promise<EmergencyEvent[]> {
    await delay();
    return store.events;
  },

  async getEvent(id: string): Promise<EmergencyEvent | undefined> {
    await delay(100, 250);
    return store.events.find((e) => e.id === id);
  },

  async getNotifications(): Promise<Notification[]> {
    await delay();
    return store.notifications;
  },

  async getTemplates(): Promise<NotificationTemplate[]> {
    await delay(80, 180);
    return templates;
  },

  async getAudit(): Promise<AuditEntry[]> {
    await delay();
    return store.audit;
  },

  async getResources(): Promise<ResourceUnit[]> {
    await delay();
    return resources;
  },

  async getRoutes(): Promise<EvacuationRoute[]> {
    await delay(100, 250);
    return routes;
  },

  async getShelters(): Promise<Shelter[]> {
    await delay(100, 250);
    return shelters;
  },

  async getFacilities(): Promise<Facility[]> {
    await delay(100, 250);
    return facilities;
  },

  async getRules(): Promise<ThresholdRule[]> {
    await delay(100, 250);
    return rules;
  },

  async getRuleEvaluations(): Promise<RuleEvaluation[]> {
    await delay(150, 300);
    return evaluateRules();
  },

  async getIntegrations(): Promise<Integration[]> {
    await delay(100, 250);
    return integrations;
  },

  /* ---------- Действия ---------- */

  /** Изменение уровня угрозы зоны. Проверка полномочий — на стороне backend. */
  async setZoneLevel(
    zoneId: string,
    level: ThreatLevel,
    actor: { name: string; role: RoleId; territories: string[] | null },
  ): Promise<{ ok: boolean; reason?: string }> {
    await delay(200, 450);
    const zone = store.zones.find((z) => z.id === zoneId);
    if (!zone) return { ok: false, reason: 'Зона не найдена' };

    const permitted =
      roleById(actor.role).can.includes('zone.edit') &&
      (actor.territories === null || actor.territories.includes(zone.territory));

    if (!permitted) {
      writeAudit({
        actor: actor.name, role: actor.role,
        action: 'Попытка изменения зоны вне полномочий',
        object: 'Зона риска', object_id: zoneId,
        field: 'level', old_value: String(zone.level), new_value: String(level),
        result: 'denied',
      });
      emit();
      return { ok: false, reason: 'Действие недоступно для текущей роли или территории' };
    }

    const old = zone.level;
    zone.level = level;
    writeAudit({
      actor: actor.name, role: actor.role,
      action: 'Изменение уровня угрозы зоны',
      object: 'Зона риска', object_id: zoneId,
      field: 'level', old_value: String(old), new_value: String(level),
      result: 'ok',
    });
    emit();
    return { ok: true };
  },

  async createEvent(
    input: {
      title: string; hazard: HazardType; level: ThreatLevel;
      territory: string; settlement: string; zone: string | null;
      coords: [number, number]; summary: string;
    },
    actor: { name: string; role: RoleId; territories: string[] | null },
  ): Promise<{ ok: boolean; id?: string; reason?: string }> {
    await delay(300, 600);

    const permitted =
      roleById(actor.role).can.includes('event.create') &&
      (actor.territories === null || actor.territories.includes(input.territory));

    if (!permitted) {
      writeAudit({
        actor: actor.name, role: actor.role,
        action: 'Попытка создания события вне полномочий',
        object: 'Событие', object_id: '—', result: 'denied',
      });
      emit();
      return { ok: false, reason: 'Создание события недоступно для текущей роли или территории' };
    }

    eventCounter += 1;
    const id = `EV-2026-${String(eventCounter).padStart(4, '0')}`;
    const now = new Date().toISOString();

    store.events.unshift({
      id,
      title: input.title,
      hazard: input.hazard,
      level: input.level,
      status: 'monitoring',
      territory: input.territory,
      settlement: input.settlement,
      zone: input.zone,
      coords: input.coords,
      started_at: now,
      closed_at: null,
      declared_by: actor.name,
      consequences: { affected: 0, evacuated: 0, injured: 0, fatalities: 0, houses_damaged: 0, roads_km: 0, damage_som_mln: 0 },
      actions: [],
      timeline: [{ t: now, actor: actor.name, kind: 'decision', text: `Открыто событие ${id}. Статус: наблюдение.` }],
      resources: [],
      summary: input.summary,
      report: null,
    });

    writeAudit({
      actor: actor.name, role: actor.role,
      action: 'Создание события', object: 'Событие', object_id: id, result: 'ok',
    });
    emit();
    return { ok: true, id };
  },

  async setActionStatus(
    eventId: string, actionId: string, status: ActionStatus,
    actor: { name: string; role: RoleId },
  ): Promise<void> {
    await delay(150, 350);
    const ev = store.events.find((e) => e.id === eventId);
    const act = ev?.actions.find((a) => a.id === actionId);
    if (!ev || !act) return;

    const old = act.status;
    act.status = status;
    act.completed_at = status === 'done' ? new Date().toISOString() : null;

    ev.timeline = [
      ...ev.timeline,
      {
        t: new Date().toISOString(),
        actor: actor.name,
        kind: 'operator',
        text: `Действие «${act.title}» переведено в статус «${status}».`,
      },
    ];

    writeAudit({
      actor: actor.name, role: actor.role,
      action: 'Изменение статуса действия', object: 'Событие', object_id: eventId,
      field: `actions.${actionId}.status`, old_value: old, new_value: status, result: 'ok',
    });
    emit();
  },

  async addAction(
    eventId: string,
    input: { title: string; assignee: string; org: string; dueHours: number },
    actor: { name: string; role: RoleId },
  ): Promise<void> {
    await delay(200, 400);
    const ev = store.events.find((e) => e.id === eventId);
    if (!ev) return;

    const id = `A-${String(ev.actions.length + 1).padStart(2, '0')}-N`;
    ev.actions = [
      ...ev.actions,
      {
        id, title: input.title, assignee: input.assignee, org: input.org,
        due: new Date(Date.now() + input.dueHours * 3600_000).toISOString(),
        status: 'pending', completed_at: null,
      },
    ];
    ev.timeline = [
      ...ev.timeline,
      { t: new Date().toISOString(), actor: actor.name, kind: 'operator', text: `Назначено действие «${input.title}» (${input.org}).` },
    ];

    writeAudit({
      actor: actor.name, role: actor.role,
      action: 'Назначение действия', object: 'Событие', object_id: eventId,
      field: 'actions', new_value: input.title, result: 'ok',
    });
    emit();
  },

  async setEventStatus(
    eventId: string, status: EmergencyEvent['status'],
    actor: { name: string; role: RoleId },
  ): Promise<{ ok: boolean; reason?: string }> {
    await delay(200, 450);
    const ev = store.events.find((e) => e.id === eventId);
    if (!ev) return { ok: false, reason: 'Событие не найдено' };

    if (status === 'closed' && !roleById(actor.role).can.includes('event.close')) {
      writeAudit({
        actor: actor.name, role: actor.role, action: 'Попытка закрытия события вне полномочий',
        object: 'Событие', object_id: eventId, result: 'denied',
      });
      emit();
      return { ok: false, reason: 'Закрытие события доступно только областному МЧС' };
    }

    const old = ev.status;
    ev.status = status;
    if (status === 'closed') ev.closed_at = new Date().toISOString();
    ev.timeline = [
      ...ev.timeline,
      { t: new Date().toISOString(), actor: actor.name, kind: 'decision', text: `Статус события изменён: ${old} → ${status}.` },
    ];

    writeAudit({
      actor: actor.name, role: actor.role, action: 'Изменение статуса события',
      object: 'Событие', object_id: eventId, field: 'status',
      old_value: old, new_value: status, result: 'ok',
    });
    emit();
    return { ok: true };
  },

  async createNotificationDraft(
    input: {
      templateId: string | null; subject: string; body: string;
      channels: Channel[]; audience: Notification['audience'];
      territory: string; event: string | null; recipients: number;
    },
    actor: { name: string; role: RoleId },
  ): Promise<{ ok: boolean; id?: string; reason?: string }> {
    await delay(300, 550);

    if (!roleById(actor.role).can.includes('notification.draft')) {
      writeAudit({
        actor: actor.name, role: actor.role, action: 'Попытка создания уведомления вне полномочий',
        object: 'Уведомление', object_id: '—', result: 'denied',
      });
      emit();
      return { ok: false, reason: 'Создание уведомлений недоступно для текущей роли' };
    }

    notificationCounter += 1;
    const id = `NT-2026-${String(notificationCounter).padStart(4, '0')}`;

    store.notifications.unshift({
      id,
      template: input.templateId,
      event: input.event,
      subject: input.subject,
      body: input.body,
      audience: input.audience,
      channels: input.channels,
      territory: input.territory,
      status: 'awaiting_approval',
      created_at: new Date().toISOString(),
      created_by: actor.name,
      approved_at: null,
      approved_by: null,
      recipients_total: input.recipients,
      deliveries: [],
    });

    writeAudit({
      actor: actor.name, role: actor.role, action: 'Создание черновика уведомления',
      object: 'Уведомление', object_id: id, result: 'ok',
    });
    emit();
    return { ok: true, id };
  },

  /** Подтверждение человеком — обязательное условие ТЗ (п. 3, п. 5.9). */
  async approveNotification(
    id: string,
    actor: { name: string; role: RoleId },
  ): Promise<{ ok: boolean; reason?: string }> {
    await delay(250, 500);
    const n = store.notifications.find((x) => x.id === id);
    if (!n) return { ok: false, reason: 'Уведомление не найдено' };

    if (!roleById(actor.role).can.includes('notification.approve')) {
      writeAudit({
        actor: actor.name, role: actor.role, action: 'Попытка подтверждения уведомления вне полномочий',
        object: 'Уведомление', object_id: id, result: 'denied',
      });
      emit();
      return { ok: false, reason: 'Подтверждение доступно только областному МЧС' };
    }

    n.status = 'sending';
    n.approved_at = new Date().toISOString();
    n.approved_by = actor.name;
    n.deliveries = n.channels.map((ch, i) => ({
      id: `DL-${id}-${i}`,
      channel: ch,
      target: deliveryTarget(ch, n.territory),
      recipients: channelRecipients(ch, n.recipients_total),
      state: 'queued' as const,
      sent_at: null,
      delivered: 0,
      failed: 0,
    }));

    writeAudit({
      actor: actor.name, role: actor.role, action: 'Подтверждение уведомления',
      object: 'Уведомление', object_id: id, field: 'status',
      old_value: 'awaiting_approval', new_value: 'approved', result: 'ok',
    });
    emit();

    runDelivery(n);
    return { ok: true };
  },

  async rejectNotification(
    id: string, reason: string,
    actor: { name: string; role: RoleId },
  ): Promise<{ ok: boolean; reason?: string }> {
    await delay(200, 400);
    const n = store.notifications.find((x) => x.id === id);
    if (!n) return { ok: false, reason: 'Уведомление не найдено' };

    if (!roleById(actor.role).can.includes('notification.approve')) {
      return { ok: false, reason: 'Отклонение доступно только областному МЧС' };
    }

    n.status = 'rejected';
    n.rejected_reason = reason;
    writeAudit({
      actor: actor.name, role: actor.role, action: 'Отклонение уведомления',
      object: 'Уведомление', object_id: id, field: 'status',
      old_value: 'awaiting_approval', new_value: 'rejected', result: 'ok',
    });
    emit();
    return { ok: true };
  },

  async ask(question: string, actor: { name: string; role: RoleId }): Promise<AiAnswer> {
    await delay(700, 1400);
    const answer = askAi(question);
    writeAudit({
      actor: actor.name, role: actor.role, action: 'Запрос к AI-помощнику',
      object: 'AI', object_id: answer.request_id, result: 'ok',
    });
    emit();
    return answer;
  },
};

/* ---------- Симуляция доставки ---------- */

function deliveryTarget(ch: Channel, territory: string): string {
  const name = territoryName(territory);
  switch (ch) {
    case 'telegram': return 'Канал «МЧС Джалал-Абад»';
    case 'sms': return `Абоненты в границах зоны, ${name}`;
    case 'internal': return 'Служебный канал ЦУКС';
    case 'siren': return `Сирены оповещения, ${name}`;
    case 'radio': return 'Радиовещание на территории района';
  }
}

/** Охват канала: у каждого канала своя доля от расчётной аудитории. */
function channelRecipients(ch: Channel, total: number): number {
  switch (ch) {
    case 'telegram': return Math.round(total * 0.46);
    case 'sms': return Math.round(total * 0.44);
    case 'internal': return 47;
    case 'siren': return total;
    case 'radio': return Math.round(total * 0.28);
  }
}

/** Статусы доставки заполняются постепенно — как в реальном журнале. */
function runDelivery(n: Notification) {
  n.deliveries.forEach((rec, i) => {
    setTimeout(() => {
      rec.state = 'sent';
      rec.sent_at = new Date().toISOString();
      emit();
    }, 700 + i * 500);

    setTimeout(() => {
      const failRate = rec.channel === 'sms' ? 0.04 : 0;
      rec.failed = Math.round(rec.recipients * failRate);
      rec.delivered = rec.recipients - rec.failed;
      rec.state = rec.failed > 0 ? 'delivered' : 'delivered';
      if (rec.failed > 0) rec.error = `${rec.failed} номеров вне зоны обслуживания`;
      emit();

      if (n.deliveries.every((d) => d.state === 'delivered' || d.state === 'failed')) {
        n.status = 'delivered';
        emit();
      }
    }, 2200 + i * 900);
  });
}

export { store };
