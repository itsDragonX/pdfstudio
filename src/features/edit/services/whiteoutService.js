import { safeLoadPDF } from '../../organise/services/pageOperations.js';
import { parseColorToPdfRgb } from '../utils/colorUtils.js';

/**
 * Adds opaque whiteout mask rectangles over areas of a PDF page.
 * Notice: This is visual concealment, not cryptographic/forensic redaction.
 * 
 * @param {Uint8Array | ArrayBuffer} pdfInput - Source PDF bytes
 * @param {object} options
 * @param {Array<{ pageIndex: number, x: number, y: number, width: number, height: number, color?: string }>} options.regions
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number }>}
 */
export async function addWhiteoutToPDF(pdfInput, options) {
  const { regions = [] } = options || {};

  if (!Array.isArray(regions) || regions.length === 0) {
    throw new Error('Please select at least one region to whiteout.');
  }

  const doc = await safeLoadPDF(pdfInput, 'Whiteout');
  const pages = doc.getPages();

  for (const r of regions) {
    const pageIndex = r.pageIndex ?? 0;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;

    const page = pages[pageIndex];
    const maskColor = parseColorToPdfRgb(r.color || '#FFFFFF');

    page.drawRectangle({
      x: r.x,
      y: r.y,
      width: Math.max(2, r.width),
      height: Math.max(2, r.height),
      color: maskColor,
      opacity: 1.0 // Strictly opaque
    });
  }

  const modifiedBytes = await doc.save();
  return {
    bytes: modifiedBytes,
    pageCount: pages.length
  };
}

