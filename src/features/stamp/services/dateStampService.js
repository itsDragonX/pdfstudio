import { safeLoadPDF } from '../../organise/services/pageOperations.js';
import { parseColorToPdfRgb } from '../../edit/utils/colorUtils.js';
import { getStandardFont } from './fontHelper.js';
import { resolveTargetPageIndices } from './targetPagesHelper.js';

export const DATE_FORMATS = [
  { id: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '09/11/2026' },
  { id: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '11/09/2026' },
  { id: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2026-11-09' },
  { id: 'DD MMM YYYY', label: 'DD MMM YYYY', example: '09 Nov 2026' }
];

export const DATE_STAMP_POSITIONS = [
  { id: 'bottom-right', label: 'Bottom Right' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-center', label: 'Bottom Center' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-center', label: 'Top Center' },
  { id: 'custom', label: 'Custom Placement' }
];

/**
 * Formats a Date object into specified format string with optional time.
 * 
 * @param {Date | number} dateInput
 * @param {string} [format='DD/MM/YYYY']
 * @param {boolean} [includeTime=false]
 * @param {'24h' | '12h'} [timeFormat='24h']
 * @returns {string}
 */
export function formatDate(dateInput, format = 'DD/MM/YYYY', includeTime = false, timeFormat = '24h') {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput || Date.now());
  const day = String(d.getDate()).padStart(2, '0');
  const monthNum = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthShort = monthsShort[d.getMonth()];

  let datePart = '';
  switch (format) {
    case 'MM/DD/YYYY':
      datePart = `${monthNum}/${day}/${year}`;
      break;
    case 'YYYY-MM-DD':
      datePart = `${year}-${monthNum}-${day}`;
      break;
    case 'DD MMM YYYY':
      datePart = `${day} ${monthShort} ${year}`;
      break;
    case 'DD/MM/YYYY':
    default:
      datePart = `${day}/${monthNum}/${year}`;
      break;
  }

  if (!includeTime) return datePart;

  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  let timePart = '';

  if (timeFormat === '12h') {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    timePart = `${String(h12).padStart(2, '0')}:${minutes} ${ampm}`;
  } else {
    timePart = `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  return `${datePart} ${timePart}`;
}

/**
 * Applies a Date Stamp to a PDF document.
 * 
 * @param {Uint8Array | ArrayBuffer | Blob | File} pdfInput - Source PDF bytes
 * @param {object} options
 * @param {string} [options.dateFormat='DD/MM/YYYY']
 * @param {boolean} [options.includeTime=false]
 * @param {'24h' | '12h'} [options.timeFormat='24h']
 * @param {string} [options.prefix='']
 * @param {Date | number} [options.timestamp] - Capture once to use across all pages
 * @param {string} [options.position='bottom-right']
 * @param {number} [options.customX]
 * @param {number} [options.customY]
 * @param {string} [options.fontName='Helvetica']
 * @param {number} [options.fontSize=11]
 * @param {string} [options.color='#000000']
 * @param {number} [options.opacity=1.0]
 * @param {number} [options.margin=36]
 * @param {'all' | 'current' | 'selected' | 'range'} [options.pageTarget='all']
 * @param {number} [options.currentPageIndex=0]
 * @param {number[]} [options.selectedPageIndices=[]]
 * @param {string} [options.rangeString='']
 * @param {boolean} [options.excludeFirstPage=false]
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number, modifiedPages: number[], formattedDate: string }>}
 */
export async function applyDateStampToPDF(pdfInput, options = {}) {
  const {
    dateFormat = 'DD/MM/YYYY',
    includeTime = false,
    timeFormat = '24h',
    prefix = '',
    timestamp = Date.now(),
    position = 'bottom-right',
    customX,
    customY,
    fontName = 'Helvetica',
    fontSize = 11,
    color = '#000000',
    opacity = 1.0,
    margin = 36
  } = options;

  const doc = await safeLoadPDF(pdfInput, 'Date Stamp');
  const pages = doc.getPages();
  const totalPages = pages.length;

  if (totalPages === 0) {
    throw new Error('Document contains no pages.');
  }

  const targetIndices = resolveTargetPageIndices(options, totalPages);
  if (targetIndices.length === 0) {
    throw new Error('No target pages selected for date stamp.');
  }

  const font = await getStandardFont(doc, fontName);
  const pdfColor = parseColorToPdfRgb(color);
  const safeOpacity = Math.max(0.01, Math.min(1.0, opacity));

  // Capture the date ONCE and format it consistently
  const capturedDateObj = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const formattedRaw = formatDate(capturedDateObj, dateFormat, includeTime, timeFormat);
  const stampText = prefix ? `${prefix}${formattedRaw}` : formattedRaw;

  const textWidth = font.widthOfTextAtSize(stampText, fontSize);
  const textHeight = font.heightAtSize(fontSize);

  // Apply identical formatted date stamp across all target pages
  for (const pageIdx of targetIndices) {
    const page = pages[pageIdx];
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    let x = margin;
    let y = margin;

    if (position === 'custom' && typeof customX === 'number' && typeof customY === 'number') {
      x = customX;
      y = customY;
    } else {
      // Standard positions
      if (position.startsWith('top')) {
        y = pageHeight - margin - textHeight;
      } else {
        y = margin;
      }

      if (position.endsWith('left')) {
        x = margin;
      } else if (position.endsWith('right')) {
        x = pageWidth - margin - textWidth;
      } else { // center
        x = (pageWidth - textWidth) / 2;
      }
    }

    page.drawText(stampText, {
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
    modifiedPages: targetIndices,
    formattedDate: stampText
  };
}

