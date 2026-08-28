const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtDateShort(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getFullYear()).slice(2)}`;
}

export function fmtDateTime(iso: string): string {
  return `${fmtDateShort(iso)} ${fmtTime(iso)}`;
}

/** «3 часа назад», «через 2 дня» */
export function fmtAgo(iso: string, now = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const future = diff < 0;

  const mins = Math.round(abs / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return future ? `через ${mins} мин` : `${mins} мин назад`;

  const hours = Math.round(mins / 60);
  if (hours < 24) return future ? `через ${hours} ${plural(hours, 'час', 'часа', 'часов')}` : `${hours} ${plural(hours, 'час', 'часа', 'часов')} назад`;

  const days = Math.round(hours / 24);
  if (days < 45) return future ? `через ${days} ${plural(days, 'день', 'дня', 'дней')}` : `${days} ${plural(days, 'день', 'дня', 'дней')} назад`;

  const months = Math.round(days / 30);
  if (months < 18) return future ? `через ${months} мес` : `${months} мес назад`;

  const years = Math.round(days / 365);
  return future ? `через ${years} ${plural(years, 'год', 'года', 'лет')}` : `${years} ${plural(years, 'год', 'года', 'лет')} назад`;
}

export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

export function num(n: number): string {
  return n.toLocaleString('ru-RU').replace(/ /g, ' ');
}

export function fmtCoord(lon: number, lat: number): string {
  return `${lat.toFixed(4)}° N  ${lon.toFixed(4)}° E`;
}

export function daysBetween(iso: string, now = Date.now()): number {
  return Math.round((now - new Date(iso).getTime()) / 86400000);
}
