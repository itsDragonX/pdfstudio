import { safeLoadPDF } from '../../organise/services/pageOperations.js';
import { parseColorToPdfRgb } from '../../edit/utils/colorUtils.js';
import { getStandardFont } from './fontHelper.js';
import { resolveTargetPageIndices } from './targetPagesHelper.js';

export const HEADER_FOOTER_ZONES = [
  { id: 'headerLeft', label: 'Top Left (Header)', type: 'header', align: 'left' },
  { id: 'headerCenter', label: 'Top Center (Header)', type: 'header', align: 'center' },
  { id: 'headerRight', label: 'Top Right (Header)', type: 'header', align: 'right' },
  { id: 'footerLeft', label: 'Bottom Left (Footer)', type: 'footer', align: 'left' },
  { id: 'footerCenter', label: 'Bottom Center (Footer)', type: 'footer', align: 'center' },
  { id: 'footerRight', label: 'Bottom Right (Footer)', type: 'footer', align: 'right' }
];

/**
 * Replaces dynamic placeholders {page}, {totalPages}, {filename}, {date} with actual values.
 * 
 * @param {string} template
 * @param {object} context
 * @param {number} context.page - 1-based page number
 * @param {number} context.totalPages - Total document page count
 * @param {string} context.filename - Current PDF filename
 * @param {string} context.date - Formatted date string
 * @returns {string}
 */
export function resolveDynamicVariables(template, { page = 1, totalPages = 1, filename = 'document.pdf', date = '' }) {
  if (!template || typeof template !== 'string') return '';

  return template
    .replace(/\{page\}/gi, String(page))
    .replace(/\{totalPages\}/gi, String(totalPages))
    .replace(/\{filename\}/gi, filename || 'document.pdf')
    .replace(/\{date\}/gi, date || '');
}

/**
 * Applies 6-zone Header & Footer to a PDF document.
 * 
 * @param {Uint8Array | ArrayBuffer | Blob | File} pdfInput - Source PDF bytes
 * @param {object} options
 * @param {string} [options.headerLeft='']
 * @param {string} [options.headerCenter='']
 * @param {string} [options.headerRight='']
 * @param {string} [options.footerLeft='']
 * @param {string} [options.footerCenter='']
 * @param {string} [options.footerRight='']
 * @param {string} [options.fontName='Helvetica']
 * @param {number} [options.fontSize=10]
 * @param {string} [options.color='#333333']
 * @param {number} [options.margin=36]
 * @param {number} [options.opacity=1.0]
 * @param {string} [options.filename='document.pdf']
 * @param {string} [options.dateString] - Formatted date to use
 * @param {'all' | 'current' | 'selected' | 'range'} [options.pageTarget='all']
 * @param {number} [options.currentPageIndex=0]
 * @param {number[]} [options.selectedPageIndices=[]]
 * @param {string} [options.rangeString='']
 * @param {boolean} [options.excludeFirstPage=false]
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number, modifiedPages: number[] }>}
 */
export async function applyHeaderFooterToPDF(pdfInput, options = {}) {
  const {
    headerLeft = '',
    headerCenter = '',
    headerRight = '',
    footerLeft = '',
    footerCenter = '',
    footerRight = '',
    fontName = 'Helvetica',
    fontSize = 10,
    color = '#333333',
    margin = 36,
    opacity = 1.0,
    filename = 'document.pdf',
    dateString = ''
  } = options;

  // Check if at least one zone has text
  const hasContent = [
    headerLeft,
    headerCenter,
    headerRight,
    footerLeft,
    footerCenter,
    footerRight
  ].some((z) => z && z.trim().length > 0);

  if (!hasContent) {
    throw new Error('Please enter text into at least one header or footer zone.');
  }

  const doc = await safeLoadPDF(pdfInput, 'Header & Footer');
  const pages = doc.getPages();
  const totalPages = pages.length;

  if (totalPages === 0) {
    throw new Error('Document contains no pages.');
  }

  const targetIndices = resolveTargetPageIndices(options, totalPages);
  if (targetIndices.length === 0) {
    throw new Error('No target pages selected for header and footer.');
  }

  const font = await getStandardFont(doc, fontName);
  const pdfColor = parseColorToPdfRgb(color);
  const safeOpacity = Math.max(0.01, Math.min(1.0, opacity));

  // Determine standard current local date string if not passed
  let resolvedDate = dateString;
  if (!resolvedDate) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    resolvedDate = `${day}/${month}/${year}`;
  }

  // Stamp each target page
  for (const pageIdx of targetIndices) {
    const page = pages[pageIdx];
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();
    const pageNumber = pageIdx + 1;

    const context = {
      page: pageNumber,
      totalPages,
      filename,
      date: resolvedDate
    };

    const textHeight = font.heightAtSize(fontSize);

    // List of zones to draw for this page
    const zoneDraws = [
      { text: headerLeft, isHeader: true, align: 'left' },
      { text: headerCenter, isHeader: true, align: 'center' },
      { text: headerRight, isHeader: true, align: 'right' },
      { text: footerLeft, isHeader: false, align: 'left' },
      { text: footerCenter, isHeader: false, align: 'center' },
      { text: footerRight, isHeader: false, align: 'right' }
    ];

    for (const zone of zoneDraws) {
      if (!zone.text || !zone.text.trim()) continue;

      const renderedText = resolveDynamicVariables(zone.text, context);
      if (!renderedText) continue;

      const textWidth = font.widthOfTextAtSize(renderedText, fontSize);

      let x = margin;
      let y = zone.isHeader
        ? pageHeight - margin - textHeight
        : margin;

      if (zone.align === 'left') {
        x = margin;
      } else if (zone.align === 'right') {
        x = pageWidth - margin - textWidth;
      } else { // center
        x = (pageWidth - textWidth) / 2;
      }

      page.drawText(renderedText, {
        x: +x.toFixed(2),
        y: +y.toFixed(2),
        size: fontSize,
        font,
        color: pdfColor,
        opacity: safeOpacity
      });
    }
  }

  const modifiedBytes = await doc.save();
  return {
    bytes: modifiedBytes,
    pageCount: totalPages,
    modifiedPages: targetIndices
  };
}

