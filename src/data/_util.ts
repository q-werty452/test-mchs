/** Детерминированный генератор: одни и те же данные при каждом запуске. */
export function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

export function hashCode(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Неправильный полигон вокруг точки — «пятно» зоны риска. */
export function blob(
  lon: number,
  lat: number,
  rx: number,
  ry: number,
  seed: string,
  points = 11,
): [number, number][] {
  const rnd = seeded(hashCode(seed));
  const ring: [number, number][] = [];
  const skew = 0.6 + rnd() * 0.8;
  const rot = rnd() * Math.PI;
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2 + rot;
    const k = 0.62 + rnd() * 0.62;
    const x = Math.cos(a) * rx * k;
    const y = Math.sin(a) * ry * k * skew;
    ring.push([
      +(lon + x * Math.cos(rot) - y * Math.sin(rot)).toFixed(5),
      +(lat + x * Math.sin(rot) * 0.5 + y * Math.cos(rot)).toFixed(5),
    ]);
  }
  return ring;
}

/** Базовое «сейчас» демо-стенда — фиксировано, чтобы данные были воспроизводимы. */
export const NOW = new Date('2026-08-23T09:40:00+06:00');

export function iso(offsetHours: number, base: Date = NOW): string {
  return new Date(base.getTime() + offsetHours * 3600_000).toISOString();
}

export function isoDays(offsetDays: number, base: Date = NOW): string {
  return iso(offsetDays * 24, base);
}

export function pick<T>(arr: readonly T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)];
}
