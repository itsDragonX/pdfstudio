import { rgb } from 'pdf-lib';

/**
 * Parses a hex color string (#RGB, #RRGGBB) or rgb object into pdf-lib normalized rgb (0.0 to 1.0).
 * @param {string | { r: number, g: number, b: number }} color
 * @returns {import('pdf-lib').RGB}
 */
export function parseColorToPdfRgb(color) {
  if (!color) return rgb(0, 0, 0);

  if (typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color) {
    const r = color.r > 1 ? color.r / 255 : color.r;
    const g = color.g > 1 ? color.g / 255 : color.g;
    const b = color.b > 1 ? color.b / 255 : color.b;
    return rgb(r, g, b);
  }

  if (typeof color === 'string') {
    let hex = color.replace(/^#/, '').trim();
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return rgb(r, g, b);
    }
  }

  return rgb(0, 0, 0);
}

/**
 * Converts a hex string to standard 0-255 CSS rgb object.
 * @param {string} hex
 * @returns {{ r: number, g: number, b: number }}
 */
export function hexToRgb255(hex) {
  if (!hex) return { r: 0, g: 0, b: 0 };
  let h = hex.replace(/^#/, '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length === 6) {
    return {
      r: parseInt(h.slice(0, 2), 16) || 0,
      g: parseInt(h.slice(2, 4), 16) || 0,
      b: parseInt(h.slice(4, 6), 16) || 0
    };
  }
  return { r: 0, g: 0, b: 0 };
}

/**
 * Standard palette presets for text and shapes
 */
export const STANDARD_PALETTE = [
  '#000000',
  '#1C1C1E',
  '#636366',
  '#8E8E93',
  '#007AFF',
  '#34C759',
  '#FF9500',
  '#FF3B30',
  '#AF52DE',
  '#FFFFFF'
];

/**
 * Standard highlight palette (translucent highlighter shades)
 */
export const HIGHLIGHT_PALETTE = [
  { name: 'Yellow', hex: '#FFE033' },
  { name: 'Green', hex: '#70E000' },
  { name: 'Blue', hex: '#38B6FF' },
  { name: 'Pink', hex: '#FF5499' },
  { name: 'Orange', hex: '#FF9E00' }
];

