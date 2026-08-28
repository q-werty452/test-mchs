import type { ReactNode, CSSProperties } from 'react';

/* Контурные иконки 24×24, stroke: currentColor.
   Эмодзи в интерфейсе не используются. */

const P: Record<string, ReactNode> = {
  /* --- Навигация --- */
  dashboard: <><rect x="3" y="3" width="7" height="8" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="11" width="7" height="10" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>,
  map: <><path d="M9 4 3 6.5v13.5L9 17.5m0-13.5 6 2.5m-6-2.5v13.5m6-11 6-2.5V17.5L15 20m0-13.5V20m0 0-6-2.5" /></>,
  zones: <><path d="M12 3 20.5 8v8L12 21 3.5 16V8L12 3Z" /><path d="M12 8.5 16.5 11v4L12 17.5 7.5 15v-4L12 8.5Z" opacity=".55" /></>,
  structures: <><path d="M4 20h16" /><path d="M6 20V10l6-4.5 6 4.5v10" /><path d="M9.5 20v-5h5v5" /></>,
  events: <><path d="M12 4.5 21 19.5H3L12 4.5Z" /><path d="M12 10v4" /><path d="M12 17.2v.2" /></>,
  notifications: <><path d="M18 9a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16S18 14 18 9Z" /><path d="M10.3 19a2 2 0 0 0 3.4 0" /></>,
  weather: <><path d="M7 15.5a4 4 0 0 1 .6-7.96 5.5 5.5 0 0 1 10.5 1.6A3.6 3.6 0 0 1 17.5 15.5Z" /><path d="M8.5 18.5 7.5 21M12 18.5 11 21M15.5 18.5 14.5 21" /></>,
  rules: <><path d="M4 7h6M14 7h6M4 12h10M18 12h2M4 17h3M11 17h9" /><circle cx="12" cy="7" r="2" /><circle cx="16" cy="12" r="2" /><circle cx="9" cy="17" r="2" /></>,
  resources: <><path d="M2.5 16.5V7.5h10.5v9" /><path d="M13 10.5h4l4 3.5v2.5h-8" /><circle cx="6.5" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /><path d="M8.5 17.5h6.5" /></>,
  ai: <><rect x="6" y="6" width="12" height="12" rx="2.5" /><path d="M9.5 9.5h5v5h-5z" opacity=".55" /><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" /></>,
  audit: <><path d="M5 4h11l3 3v13H5z" /><path d="M8 10h8M8 13.5h8M8 17h5" /></>,
  integrations: <><path d="M9 3v6M15 3v6" /><path d="M6.5 9h11v3.5a5.5 5.5 0 0 1-11 0Z" /><path d="M12 18v3" /></>,
  history: <><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" /><path d="M3 4v5h5" /><path d="M12 8v4.5l3 1.8" /></>,

  /* --- Типы угроз --- */
  landslide: <><path d="M3 19h18" /><path d="M3 19 9 9l4 4 3-3.5 5 9.5" /><path d="m9 9 2.5 2" opacity=".6" /><circle cx="16.5" cy="14" r="1.2" /><circle cx="13" cy="16" r="1" /></>,
  mudflow: <><path d="M3 8.5c2.5-2 4.5 2 7 0s4.5 2 7 0 3.5 1 4 1.2" /><path d="M3 13c2.5-2 4.5 2 7 0s4.5 2 7 0 3.5 1 4 1.2" /><path d="M3 17.5c2.5-2 4.5 2 7 0s4.5 2 7 0 3.5 1 4 1.2" /><circle cx="7" cy="5" r="1.1" /><circle cx="15" cy="4.5" r="1.4" /></>,
  flood: <><path d="M3 15c2.5-2 4.5 2 7 0s4.5 2 7 0 3.5 1 4 1.2" /><path d="M3 19c2.5-2 4.5 2 7 0s4.5 2 7 0 3.5 1 4 1.2" /><path d="M7 11V6l4-2 4 2v5" /><path d="M11 11V7.5" opacity=".6" /></>,
  avalanche: <><path d="M2.5 20h19" /><path d="M4 20 12 5l8 15" /><path d="M9 12.5c1.5 1.5 3 .5 4.5 1.5s2.5.5 3.5 1" opacity=".7" /><circle cx="9.5" cy="16.5" r="1" /><circle cx="13.5" cy="17.5" r="1.2" /></>,
  seismic: <><path d="M2.5 12h4l2-5 3 10 3-8 2 3h5" /></>,
  tailings: <><path d="M3 19h18" /><path d="M5 19v-6l7-4 7 4v6" /><path d="M9 19v-4h6v4" /><path d="M12 5.5V3" /><circle cx="12" cy="2.5" r="1" /></>,
  rockfall: <><path d="M3.5 20h17" /><path d="M4 20 8 6" /><path d="M8 6 20 20" opacity=".35" /><path d="m10.5 9.5 2.5 1.8-1 2.7-2.8-.6Z" /><path d="m15 14 2.2 1.5-.8 2.4-2.6-.5Z" /><path d="m6.5 12.5 1.8 1.3-.7 2-2-.4Z" /></>,

  /* --- Объекты --- */
  station: <><path d="M12 12v9" /><circle cx="12" cy="9.5" r="2" /><path d="M7.8 13.7a6 6 0 0 1 0-8.4M16.2 5.3a6 6 0 0 1 0 8.4" /><path d="M5 16.5a9.5 9.5 0 0 1 0-14M19 2.5a9.5 9.5 0 0 1 0 14" opacity=".5" /></>,
  school: <><path d="M3 20h18" /><path d="M5 20V9.5l7-4 7 4V20" /><path d="M10 20v-5h4v5" /><path d="M9.5 11.5h5" /></>,
  hospital: <><rect x="4" y="6" width="16" height="14" rx="1.5" /><path d="M12 9.5v7M8.5 13h7" /><path d="M9 6V3.5h6V6" /></>,
  kindergarten: <><circle cx="12" cy="8" r="3" /><path d="M5 20v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" /><path d="M9.5 8.5h.01M14.5 8.5h.01" /></>,
  boiler: <><rect x="6" y="4" width="12" height="16" rx="2" /><path d="M9.5 9h5M9.5 13h5" /><path d="M12 20v2" /><path d="M12 4V2" /></>,
  water: <><path d="M12 3.5s6 6.2 6 10a6 6 0 0 1-12 0c0-3.8 6-10 6-10Z" /><path d="M9.5 14a2.6 2.6 0 0 0 2.5 2.5" opacity=".6" /></>,
  admin: <><path d="M3 20h18" /><path d="M4.5 20V9l7.5-4.5L19.5 9v11" /><path d="M8.5 20v-6h7v6" /><path d="M4.5 9h15" /></>,
  shelter: <><path d="M3.5 11 12 4l8.5 7" /><path d="M5.5 9.8V20h13V9.8" /><path d="M10 20v-5h4v5" /></>,
  route: <><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.5 6h4.5a3.5 3.5 0 0 1 0 7h-3a3.5 3.5 0 0 0 0 5h5.5" strokeDasharray="3 2.5" /></>,
  fire: <><path d="M12 21c3.6 0 6-2.4 6-5.6 0-4.4-4.4-6-4.4-9.4 0 0-3.6 1.6-3.6 5 0 1.4.7 2.2.7 2.2s-1.6-.4-2.4-2C7.2 12.6 6 14 6 15.4 6 18.6 8.4 21 12 21Z" /></>,
  rescue: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.5" /><path d="m6.2 6.2 3.4 3.4M14.4 14.4l3.4 3.4M17.8 6.2l-3.4 3.4M9.6 14.4l-3.4 3.4" /></>,
  medical: <><path d="M12 4.5h0a2 2 0 0 1 2 2v3h3a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-3v3a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2v-3H7a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2h3v-3a2 2 0 0 1 2-2Z" /></>,
  engineering: <><path d="M14.5 5.5a4 4 0 0 0-5.3 5.3L4 16v4h4l5.2-5.2a4 4 0 0 0 5.3-5.3l-2.8 2.8-2.5-2.5Z" /></>,
  police: <><path d="M12 3 5 6v6c0 4.2 3 7.4 7 9 4-1.6 7-4.8 7-9V6l-7-3Z" /><path d="m9.5 12 1.8 1.8 3.4-3.6" /></>,

  /* --- Управление --- */
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  filter: <><path d="M4 6h16l-6 7v5.5l-4 2V13Z" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3.5 12.5 8.5 4.7 8.5-4.7" /><path d="m3.5 16.8 8.5 4.7 8.5-4.7" opacity=".5" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  check: <><path d="m5 12.5 4.5 4.5L19 7" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  minus: <><path d="M5 12h14" /></>,
  chevronRight: <><path d="m9 5 7 7-7 7" /></>,
  chevronLeft: <><path d="m15 5-7 7 7 7" /></>,
  chevronDown: <><path d="m5 9 7 7 7-7" /></>,
  chevronUp: <><path d="m5 15 7-7 7 7" /></>,
  arrowRight: <><path d="M4 12h15" /><path d="m13 6 6 6-6 6" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5.2l3.4 2" /></>,
  calendar: <><rect x="3.5" y="5.5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8.5 3v5M15.5 3v5" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3 19.5a6 6 0 0 1 12 0" /><path d="M16 5.5a3.2 3.2 0 0 1 0 6.4" /><path d="M17.5 13.6a6 6 0 0 1 3.5 5.9" /></>,
  shield: <><path d="M12 3 5 6v6c0 4.2 3 7.4 7 9 4-1.6 7-4.8 7-9V6l-7-3Z" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M4 4.5 20 20.5" /><path d="M9.7 6.1A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.8" /><path d="M6.5 8.2A17 17 0 0 0 2.5 12S6 18.5 12 18.5a9.5 9.5 0 0 0 3.4-.6" /><path d="M10 10.2a2.9 2.9 0 0 0 4 4" /></>,
  download: <><path d="M12 3.5v11" /><path d="m7.5 10.5 4.5 4.5 4.5-4.5" /><path d="M4.5 19.5h15" /></>,
  refresh: <><path d="M20 12a8 8 0 1 1-2.4-5.7" /><path d="M20.5 4v4.5H16" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11.2v5" /><path d="M12 8.2v.2" /></>,
  alert: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5.2" /><path d="M12 16.2v.2" /></>,
  ban: <><circle cx="12" cy="12" r="8.5" /><path d="m6.2 6.2 11.6 11.6" /></>,
  crosshair: <><circle cx="12" cy="12" r="7.5" /><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4" /><circle cx="12" cy="12" r="1.8" /></>,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></>,
  activity: <><path d="M2.5 12h4.5l2.5-7 4.5 14 2.5-7h5" /></>,
  document: <><path d="M6 3.5h7l5 5v12H6z" /><path d="M13 3.5v5h5" /><path d="M9 13h6M9 16.5h4" /></>,
  image: <><rect x="3.5" y="5" width="17" height="14" rx="2" /><circle cx="9" cy="10" r="1.8" /><path d="m4.5 17 5-4.5 4 3.5 3-2.5 3.5 3" /></>,
  telegram: <><path d="M21 4.5 2.8 11.4l5.5 1.8L20 6l-9.6 9.5v4l3-3.7 5 3.7Z" /></>,
  message: <><path d="M4 5.5h16v11H9l-5 4Z" /><path d="M8 9.5h8M8 12.5h5" /></>,
  siren: <><path d="M6 19.5v-5a6 6 0 0 1 12 0v5" /><path d="M4 19.5h16" /><path d="M12 4V2" /><path d="M18.5 6.5 20 5M5.5 6.5 4 5" /></>,
  radio: <><circle cx="12" cy="14" r="3" /><path d="M8.4 9.2a5 5 0 0 0 0 7.1M15.6 16.3a5 5 0 0 0 0-7.1" /><path d="M5.6 6.4a9 9 0 0 0 0 12.7M18.4 19.1a9 9 0 0 0 0-12.7" opacity=".5" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2 2M7.3 16.7l-2 2M18.7 18.7l-2-2M7.3 7.3l-2-2" /></>,
  edit: <><path d="M4 20h4l10-10-4-4L4 16Z" /><path d="m13.5 6.5 4 4" /></>,
  external: <><path d="M14 4h6v6" /><path d="M20 4 11 13" /><path d="M18 14v5.5H4.5V6H10" /></>,
  trendUp: <><path d="m3.5 16.5 5.5-5.5 3.5 3.5L20.5 7" /><path d="M15.5 7h5v5" /></>,
  trendDown: <><path d="m3.5 7.5 5.5 5.5 3.5-3.5L20.5 17" /><path d="M15.5 17h5v-5" /></>,
  play: <><path d="M7.5 4.5 19 12 7.5 19.5Z" /></>,
  send: <><path d="M21 3 10.5 13.5" /><path d="M21 3 14.5 21l-4-7.5L3 9.5Z" /></>,
  flag: <><path d="M5.5 21V3.5" /><path d="M5.5 4.5h11l-2 3.5 2 3.5h-11" /></>,
  pin: <><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></>,
  grid: <><path d="M3.5 9h17M3.5 15h17M9 3.5v17M15 3.5v17" /><rect x="3.5" y="3.5" width="17" height="17" rx="2" /></>,
  list: <><path d="M8 6.5h12M8 12h12M8 17.5h12" /><path d="M4 6.5h.01M4 12h.01M4 17.5h.01" /></>,
};

export type IconName = keyof typeof P;

interface Props {
  name: IconName | string;
  size?: number;
  stroke?: number;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 16, stroke = 1.5, className, style }: Props) {
  const body = P[name as IconName] ?? P.info;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0, display: 'block', ...style }}
      aria-hidden="true"
    >
      {body}
    </svg>
  );
}

export const iconNames = Object.keys(P);
