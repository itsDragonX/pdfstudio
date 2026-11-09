import { safeLoadPDF } from '../../organise/services/pageOperations.js';
import { parseColorToPdfRgb } from '../../edit/utils/colorUtils.js';
import { getStandardFont } from './fontHelper.js';
import { resolveTargetPageIndices } from './targetPagesHelper.js';

export const PAGE_NUMBER_FORMATS = [
  { id: 'number_only', label: '1, 2, 3...', example: '1' },
  { id: 'page_n', label: 'Page 1, Page 2...', example: 'Page 1' },
  { id: 'page_n_of_total', label: 'Page 1 of 25', example: 'Page 1 of 25' },
  { id: 'n_of_total', label: '1 / 25', example: '1 / 25' },
  { id: 'custom', label: 'Custom (Prefix / Suffix)', example: 'DOC-001' }
];

export const PAGE_NUMBER_POSITIONS = [
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-center', label: 'Top Center' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-center', label: 'Bottom Center' },
  { id: 'bottom-right', label: 'Bottom Right' }
];

/**
 * Formats the printed page number string.
 * 
 * @param {object} options
 * @param {string} options.format
 * @param {number} options.displayNum
 * @param {number} options.totalDisplayPages
 * @param {string} [options.customPrefix='']
 * @param {string} [options.customSuffix='']
 * @returns {string}
 */
export function formatPageNumberString({
  format = 'page_n_of_total',
  displayNum = 1,
  totalDisplayPages = 1,
  customPrefix = '',
  customSuffix = ''
}) {
  switch (format) {
    case 'number_only':
      return `${displayNum}`;
    case 'page_n':
      return `Page ${displayNum}`;
    case 'n_of_total':
      return `${displayNum} / ${totalDisplayPages}`;
    case 'custom':
      return `${customPrefix}${displayNum}${customSuffix}`;
    case 'page_n_of_total':
    default:
      return `Page ${displayNum} of ${totalDisplayPages}`;
  }
}

/**
 * Applies Page Numbers to a PDF document.
 * 
 * @param {Uint8Array | ArrayBuffer | Blob | File} pdfInput - Source PDF bytes
 * @param {object} options
 * @param {string} [options.format='page_n_of_total']
 * @param {string} [options.customPrefix='']
 * @param {string} [options.customSuffix='']
 * @param {number} [options.startNumber=1]
 * @param {string} [options.position='bottom-center']
 * @param {string} [options.fontName='Helvetica']
 * @param {number} [options.fontSize=10]
 * @param {string} [options.color='#333333']
 * @param {number} [options.margin=36]
 * @param {number} [options.opacity=1.0]
 * @param {'all' | 'current' | 'selected' | 'range'} [options.pageTarget='all']
 * @param {number} [options.currentPageIndex=0]
 * @param {number[]} [options.selectedPageIndices=[]]
 * @param {string} [options.rangeString='']
 * @param {boolean} [options.excludeFirstPage=false]
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number, modifiedPages: number[] }>}
 */
export async function applyPageNumbersToPDF(pdfInput, options = {}) {
  const {
    format = 'page_n_of_total',
    customPrefix = '',
    customSuffix = '',
    startNumber = 1,
    position = 'bottom-center',
    fontName = 'Helvetica',
    fontSize = 10,
    color = '#333333',
    margin = 36,
    opacity = 1.0,
    excludeFirstPage = false
  } = options;

  const doc = await safeLoadPDF(pdfInput, 'Page Numbers');
  const pages = doc.getPages();
  const totalPages = pages.length;

  if (totalPages === 0) {
    throw new Error('Document contains no pages.');
  }

  const targetIndices = resolveTargetPageIndices(options, totalPages);
  if (targetIndices.length === 0) {
    throw new Error('No target pages selected for page numbering.');
  }

  const font = await getStandardFont(doc, fontName);
  const pdfColor = parseColorToPdfRgb(color);
  const safeOpacity = Math.max(0.01, Math.min(1.0, opacity));

  // Determine total display pages for X of Y format
  const totalDisplayPages = excludeFirstPage ? Math.max(1, totalPages - 1) : totalPages;

  // Stamping each target page
  for (let idx = 0; idx < targetIndices.length; idx++) {
    const pageIdx = targetIndices[idx];
    const page = pages[pageIdx];

    // Compute printed number: if numbering sequential, index in target list offset by startNumber
    // Or if respecting document order, pageIdx - (excludeFirstPage ? 1 : 0) + startNumber
    const displayNum = Math.max(1, pageIdx - (excludeFirstPage ? 1 : 0) + startNumber);

    const text = formatPageNumberString({
      format,
      displayNum,
      totalDisplayPages,
      customPrefix,
      customSuffix
    });

    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    // Calculate (x, y) based on position
    let x = margin;
    let y = margin;

    // Vertical placement
    if (position.startsWith('top')) {
      y = pageHeight - margin - textHeight;
    } else {
      y = margin;
    }

    // Horizontal placement
    if (position.endsWith('left')) {
      x = margin;
    } else if (position.endsWith('right')) {
      x = pageWidth - margin - textWidth;
    } else { // center
      x = (pageWidth - textWidth) / 2;
    }

    page.drawText(text, {
      x: +x.toFixed(2),
      y: +y.toFixed(2),
      size: fontSize,
      font,
      color: pdfColor,
      opacity: safeOpacity
    });
  }

  const modifiedBytes = await doc.save();
  return {
    bytes: modifiedBytes,
    pageCount: totalPages,
    modifiedPages: targetIndices
  };
}

