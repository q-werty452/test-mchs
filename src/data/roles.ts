import type { Role } from '../types';

export const roles: Role[] = [
  {
    id: 'leadership',
    title: 'Руководство области',
    org: 'Полномочное представительство Правительства',
    access: 'Сводная информация по всей области',
    territories: null,
    can: ['ai.query', 'audit.view'],
  },
  {
    id: 'oblast_mchs',
    title: 'Областное МЧС',
    org: 'УМЧС по Джалал-Абадской области',
    access: 'Все районы, события, зоны, ресурсы, регламенты и отчёты',
    territories: null,
    can: [
      'zone.edit', 'event.create', 'event.close', 'notification.draft',
      'notification.approve', 'import.confirm', 'structure.edit', 'audit.view', 'ai.query',
    ],
  },
  {
    id: 'rayon_mchs',
    title: 'Районное МЧС',
    org: 'Сузакское РУ МЧС',
    access: 'Данные и действия в пределах назначенной территории',
    territories: ['suzak', 'jalal-abad'],
    can: ['zone.edit', 'event.create', 'notification.draft', 'structure.edit', 'ai.query'],
  },
  {
    id: 'akim',
    title: 'Аким / администрация',
    org: 'Айыл окмоту Сузакского района',
    access: 'Территориальная картина, задачи, уведомления и подтверждённые отчёты',
    territories: ['suzak'],
    can: ['ai.query'],
  },
  {
    id: 'operator',
    title: 'Оператор',
    org: 'Оперативно-дежурная смена ЦУКС',
    access: 'Ввод, проверка и обновление разрешённых данных',
    territories: null,
    can: ['zone.edit', 'event.create', 'notification.draft', 'import.confirm', 'ai.query'],
  },
  {
    id: 'public',
    title: 'Население',
    org: 'Публичный доступ',
    access: 'Только официально разрешённая публичная информация',
    territories: null,
    can: [],
  },
];

export const roleById = (id: string) => roles.find((r) => r.id === id) ?? roles[1];
