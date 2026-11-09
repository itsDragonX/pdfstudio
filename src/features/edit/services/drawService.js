import { safeLoadPDF } from '../../organise/services/pageOperations.js';
import { parseColorToPdfRgb } from '../utils/colorUtils.js';

/**
 * Draws vector pen strokes onto PDF pages.
 * 
 * @param {Uint8Array | ArrayBuffer} pdfInput - Source PDF bytes
 * @param {object} options
 * @param {Array<{ pageIndex: number, points: Array<{ x: number, y: number }>, color?: string, width?: number, opacity?: number }>} options.strokes
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number }>}
 */
export async function addStrokesToPDF(pdfInput, options) {
  const { strokes = [] } = options || {};

  if (!Array.isArray(strokes) || strokes.length === 0) {
    throw new Error('No drawing strokes provided to apply.');
  }

  const doc = await safeLoadPDF(pdfInput, 'Draw');
  const pages = doc.getPages();

  for (const stroke of strokes) {
    const pageIndex = stroke.pageIndex ?? 0;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;

    const page = pages[pageIndex];
    const points = stroke.points || [];
    if (points.length < 2) {
      // Single point dot
      if (points.length === 1) {
        const pt = points[0];
        const radius = (stroke.width || 2) / 2;
        page.drawCircle({
          x: pt.x,
          y: pt.y,
          size: Math.max(1, radius),
          color: parseColorToPdfRgb(stroke.color || '#000000'),
          opacity: stroke.opacity || 1.0
        });
      }
      continue;
    }

    const strokeColor = parseColorToPdfRgb(stroke.color || '#000000');
    const strokeWidth = Math.max(0.5, Math.min(24, stroke.width || 2));
    const opacity = stroke.opacity !== undefined ? Math.max(0.1, Math.min(1.0, stroke.opacity)) : 1.0;

    // Connect sequential points as vector line segments
    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];

      page.drawLine({
        start: { x: p1.x, y: p1.y },
        end: { x: p2.x, y: p2.y },
        thickness: strokeWidth,
        color: strokeColor,
        opacity
      });
    }
  }

  const modifiedBytes = await doc.save();
  return {
    bytes: modifiedBytes,
    pageCount: pages.length
  };
}

