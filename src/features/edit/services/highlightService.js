import { safeLoadPDF } from '../../organise/services/pageOperations.js';
import { parseColorToPdfRgb } from '../utils/colorUtils.js';

/**
 * Adds one or more translucent highlight boxes over text on PDF pages.
 * 
 * @param {Uint8Array | ArrayBuffer} pdfInput - Source PDF bytes
 * @param {object} options
 * @param {Array<{ pageIndex: number, x: number, y: number, width: number, height: number, color?: string, opacity?: number }>} options.highlights
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number }>}
 */
export async function addHighlightsToPDF(pdfInput, options) {
  const { highlights = [] } = options || {};

  if (!Array.isArray(highlights) || highlights.length === 0) {
    throw new Error('Please select at least one region to highlight.');
  }

  const doc = await safeLoadPDF(pdfInput, 'Highlight');
  const pages = doc.getPages();

  for (const h of highlights) {
    const pageIndex = h.pageIndex ?? 0;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;

    const page = pages[pageIndex];
    const pdfColor = parseColorToPdfRgb(h.color || '#FFE033'); // Default yellow
    const opacity = h.opacity !== undefined ? Math.max(0.1, Math.min(0.8, h.opacity)) : 0.35;

    page.drawRectangle({
      x: h.x,
      y: h.y,
      width: Math.max(4, h.width),
      height: Math.max(4, h.height),
      color: pdfColor,
      opacity
    });
  }

  const modifiedBytes = await doc.save();
  return {
    bytes: modifiedBytes,
    pageCount: pages.length
  };
}

