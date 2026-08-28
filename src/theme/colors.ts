/* Единственный источник цвета — CSS-переменные темы.
   В DOM они подставляются напрямую через var(); MapLibre принимает
   только конкретные значения, поэтому здесь они разрешаются в цвет. */

export type ThemeName = 'dark' | 'light';

const cache = new Map<string, string>();

/** Разрешает CSS-переменную темы в конкретный цвет. */
export function css(name: string): string {
  const hit = cache.get(name);
  if (hit) return hit;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const color = value || '#4cc2ff';
  cache.set(name, color);
  return color;
}

/** Вызывается при смене темы: значения переменных изменились. */
export function resetColorCache(): void {
  cache.clear();
}

export function levelHex(level: 1 | 2 | 3 | 4 | 5): string {
  return css(`--lvl-${level}`);
}
