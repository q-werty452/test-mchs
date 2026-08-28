import type { Integration } from '../types';
import { iso } from './_util';

export const integrations: Integration[] = [
  {
    id: 'INT-MCHS', name: 'Реестры МЧС', owner: 'УМЧС по Джалал-Абадской области',
    purpose: 'Зоны, события, сооружения, ресурсы и регламенты',
    state: 'ok', last_ok: iso(-0.1), latency_ms: 84, today_calls: 1246, today_errors: 0,
    note: 'Официальный владелец данных, формат утверждён.',
  },
  {
    id: 'INT-HYDRO', name: 'Кыргызгидромет', owner: 'Агентство по гидрометеорологии',
    purpose: 'Станции и временные ряды наблюдений',
    state: 'degraded', last_ok: iso(-0.3), latency_ms: 2140, today_calls: 3182, today_errors: 41,
    note: 'Повышенная задержка ответа. По станции МС-09 пропуски в ряду уровня.',
  },
  {
    id: 'INT-ADM', name: 'Администрации районов', owner: 'Районные администрации и айыл окмоту',
    purpose: 'Территории, объекты и ответственные лица',
    state: 'ok', last_ok: iso(-1.2), latency_ms: 310, today_calls: 208, today_errors: 1,
    note: 'Данные требуют проверки и утверждения перед публикацией.',
  },
  {
    id: 'INT-TG', name: 'Telegram Bot API', owner: 'Внешний сервис',
    purpose: 'Публичные и служебные уведомления',
    state: 'ok', last_ok: iso(-0.05), latency_ms: 176, today_calls: 94, today_errors: 0,
    note: 'Шаблоны согласованы, повторная отправка при ошибке — до 3 попыток.',
  },
  {
    id: 'INT-SMS', name: 'SMS-шлюз оператора связи', owner: 'Внешний сервис',
    purpose: 'Массовая рассылка по абонентам в зоне',
    state: 'degraded', last_ok: iso(-0.2), latency_ms: 890, today_calls: 2, today_errors: 0,
    note: 'Часть номеров вне зоны обслуживания, статусы доставки приходят с задержкой.',
  },
  {
    id: 'INT-AI', name: 'AI-сервис (внутренний API)', owner: 'Отдельный контур',
    purpose: 'Сводки, поиск похожих случаев, объяснения оператору',
    state: 'ok', last_ok: iso(-0.15), latency_ms: 1420, today_calls: 37, today_errors: 2,
    note: 'Прямого доступа к рабочей базе нет. Контекст передаётся backend-ом по внутреннему API.',
  },
  {
    id: 'INT-SEIS', name: 'Институт сейсмологии НАН КР', owner: 'НАН КР',
    purpose: 'Регистрация сейсмических событий',
    state: 'down', last_ok: iso(-31), latency_ms: 0, today_calls: 0, today_errors: 18,
    note: 'Тестовая среда недоступна. Работа по регламенту в ручном режиме.',
  },
];
