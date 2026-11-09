import { StandardFonts } from 'pdf-lib';
import { safeLoadPDF } from '../../organise/services/pageOperations.js';
import { parseColorToPdfRgb } from '../utils/colorUtils.js';

/**
 * Adds custom styled text to a specified PDF page.
 * Supports multiline text, standard font families, alignment, color, and opacity.
 * 
 * @param {Uint8Array | ArrayBuffer} pdfInput - Source PDF bytes
 * @param {object} options
 * @param {number} options.pageIndex - 0-based page index
 * @param {string} options.text - Text string (supports \n for multiline)
 * @param {number} options.x - PDF user-space X coordinate
 * @param {number} options.y - PDF user-space Y coordinate (top baseline)
 * @param {string} [options.fontName='Helvetica'] - Standard font family name
 * @param {number} [options.fontSize=14] - Font size in points
 * @param {string} [options.color='#000000'] - Text color (hex)
 * @param {'left'|'center'|'right'} [options.alignment='left'] - Text alignment
 * @param {number} [options.opacity=1.0] - Opacity (0.0 to 1.0)
 * @param {number} [options.maxWidth] - Optional maximum bounding width for text wrap
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number }>}
 */
export async function addTextToPDF(pdfInput, options) {
  const {
    pageIndex = 0,
    text = '',
    x = 50,
    y = 500,
    fontName = 'Helvetica',
    fontSize = 14,
    color = '#000000',
    alignment = 'left',
    opacity = 1.0
  } = options || {};

  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('Please enter text to add.');
  }

  const doc = await safeLoadPDF(pdfInput, 'Add Text');
  const pages = doc.getPages();

  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new Error(`Invalid page target (${pageIndex + 1}). Document contains ${pages.length} pages.`);
  }

  const targetPage = pages[pageIndex];

  // Map font name to StandardFonts
  const fontKeyMap = {
    Helvetica: StandardFonts.Helvetica,
    HelveticaBold: StandardFonts.HelveticaBold,
    TimesRoman: StandardFonts.TimesRoman,
    Courier: StandardFonts.Courier
  };

  const embeddedFont = await doc.embedFont(fontKeyMap[fontName] || StandardFonts.Helvetica);
  const pdfColor = parseColorToPdfRgb(color);
  const safeOpacity = Math.max(0.05, Math.min(1.0, opacity));

  // Split lines
  const rawLines = text.split(/\r?\n/);
  const lineHeight = fontSize * 1.25;

  let currentY = y;

  for (const line of rawLines) {
    const lineWidth = embeddedFont.widthOfTextAtSize(line, fontSize);
    let lineX = x;

    if (alignment === 'center') {
      lineX = x - lineWidth / 2;
    } else if (alignment === 'right') {
      lineX = x - lineWidth;
    }

    targetPage.drawText(line, {
      x: lineX,
      y: currentY,
      size: fontSize,
      font: embeddedFont,
      color: pdfColor,
      opacity: safeOpacity
    });

    currentY -= lineHeight;
  }

  const modifiedBytes = await doc.save();
  return {
    bytes: modifiedBytes,
    pageCount: pages.length
  };
}

