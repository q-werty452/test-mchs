import type { StyleSpecification } from 'maplibre-gl';
import { css, type ThemeName } from '../theme/colors';

const STYLE_URL: Record<ThemeName, string> = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
};

/** Подложка на случай отсутствия сети: карта остаётся рабочей, теряется только детализация. */
function offlineStyle(theme: ThemeName): StyleSpecification {
  return {
    version: 8,
    sources: {},
    layers: [
      {
        id: 'bg',
        type: 'background',
        paint: { 'background-color': theme === 'dark' ? '#080c13' : '#e9edf2' },
      },
    ],
  };
}

/** Палитра подложки под каждую тему. */
const PALETTE: Record<ThemeName, Record<string, string>> = {
  dark: {
    background: '#070b11',
    waterFill: '#0d1f2e',
    waterLine: '#16374e',
    land: '#0b1219',
    building: '#141c26',
    roadMajor: '#2b3a4a',
    roadMinor: '#1b242e',
    boundary: '#33465a',
    label: '#8899ab',
    labelHalo: '#05080d',
  },
  light: {
    background: '#eef1f5',
    waterFill: '#cfdeea',
    waterLine: '#a8c4d8',
    land: '#e6ebf1',
    building: '#dde3ea',
    roadMajor: '#ffffff',
    roadMinor: '#f4f6f9',
    boundary: '#a9b6c3',
    label: '#5a6b7d',
    labelHalo: '#ffffff',
  },
};

/** Приводит палитру подложки к теме интерфейса. */
function tint(style: StyleSpecification, theme: ThemeName): StyleSpecification {
  const c = PALETTE[theme];

  for (const layer of style.layers) {
    const id = layer.id.toLowerCase();
    const paint = (layer as { paint?: Record<string, unknown> }).paint ?? {};

    if (layer.type === 'background') {
      paint['background-color'] = c.background;
    } else if (id.includes('water')) {
      if (layer.type === 'fill') paint['fill-color'] = c.waterFill;
      if (layer.type === 'line') paint['line-color'] = c.waterLine;
    } else if (id.includes('landcover') || id.includes('park') || id.includes('wood')) {
      if (layer.type === 'fill') { paint['fill-color'] = c.land; paint['fill-opacity'] = 0.6; }
    } else if (id.includes('building')) {
      if (layer.type === 'fill') { paint['fill-color'] = c.building; paint['fill-opacity'] = 0.55; }
    } else if (id.includes('road') || id.includes('bridge') || id.includes('tunnel')) {
      if (layer.type === 'line') {
        paint['line-color'] = id.includes('motorway') || id.includes('trunk') ? c.roadMajor : c.roadMinor;
      }
    } else if (id.includes('boundary') || id.includes('admin')) {
      if (layer.type === 'line') { paint['line-color'] = c.boundary; paint['line-opacity'] = 0.75; }
    } else if (id.includes('label') || id.includes('place')) {
      if (layer.type === 'symbol') {
        paint['text-color'] = c.label;
        paint['text-halo-color'] = c.labelHalo;
        paint['text-halo-width'] = 1.4;
      }
    }

    (layer as { paint?: Record<string, unknown> }).paint = paint;
  }
  return style;
}

/** Пытается загрузить онлайн-подложку; при неудаче отдаёт офлайн-вариант. */
export async function loadBasemap(theme: ThemeName): Promise<{ style: StyleSpecification; online: boolean }> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(STYLE_URL[theme], { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(String(res.status));
    const style = (await res.json()) as StyleSpecification;
    return { style: tint(style, theme), online: true };
  } catch {
    return { style: offlineStyle(theme), online: false };
  }
}

/** Диагональная штриховка для зон с просроченными данными. */
export function hatchImage(size = 10): ImageData {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = css('--hatch');
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-size, size); ctx.lineTo(size, -size);
  ctx.moveTo(0, size * 2); ctx.lineTo(size * 2, 0);
  ctx.stroke();
  return ctx.getImageData(0, 0, size, size);
}
