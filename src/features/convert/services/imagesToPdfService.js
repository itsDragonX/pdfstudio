import { PDFDocument } from 'pdf-lib';
import { parseColorToPdfRgb } from '../../edit/utils/colorUtils.js';

export const PAGE_SIZES = {
  A4: { width: 595.28, height: 841.89, label: 'A4 (210 × 297 mm)' },
  Letter: { width: 612.0, height: 792.0, label: 'Letter (8.5 × 11 in)' },
  FitToImage: { label: 'Fit to Image Dimensions' }
};

export const MARGIN_PRESETS = [
  { id: 'none', label: 'No Margin (0 pt)', value: 0 },
  { id: 'small', label: 'Small Margin (18 pt)', value: 18 },
  { id: 'medium', label: 'Medium Margin (36 pt)', value: 36 }
];

/**
 * Converts an ordered sequence of images into a multi-page PDF.
 * 
 * @param {Array<{ bytes: Uint8Array, format: 'png' | 'jpeg', width?: number, height?: number, filename?: string }>} images
 * @param {object} options
 * @param {'A4' | 'Letter' | 'FitToImage'} [options.pageSize='A4']
 * @param {'portrait' | 'landscape' | 'auto'} [options.orientation='auto']
 * @param {'fit' | 'fill'} [options.layout='fit']
 * @param {number} [options.margin=18]
 * @param {string} [options.backgroundColor='#FFFFFF']
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number }>}
 */
export async function convertImagesToPdf(images = [], options = {}) {
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error('Please select at least one image to convert.');
  }

  const {
    pageSize = 'A4',
    orientation = 'auto',
    layout = 'fit',
    margin = 18,
    backgroundColor = '#FFFFFF'
  } = options;

  const doc = await PDFDocument.create();

  for (let idx = 0; idx < images.length; idx++) {
    const item = images[idx];
    if (!item.bytes || item.bytes.byteLength === 0) {
      throw new Error(`Image ${idx + 1} (${item.filename || 'unnamed'}) contains no data.`);
    }

    // Embed PNG or JPEG
    let embeddedImg;
    const isPng = item.format === 'png';
    try {
      embeddedImg = isPng
        ? await doc.embedPng(item.bytes)
        : await doc.embedJpg(item.bytes);
    } catch (embedErr) {
      // Fallback: try the other format in case of header mismatch
      try {
        embeddedImg = isPng
          ? await doc.embedJpg(item.bytes)
          : await doc.embedPng(item.bytes);
      } catch {
        throw new Error(`Failed to decode image ${idx + 1} (${item.filename || 'unnamed'}): ${embedErr.message}`);
      }
    }

    const naturalWidth = item.width || embeddedImg.width;
    const naturalHeight = item.height || embeddedImg.height;

    // Calculate Page Dimensions
    let pageWidth, pageHeight;

    if (pageSize === 'FitToImage') {
      pageWidth = naturalWidth;
      pageHeight = naturalHeight;
    } else {
      const standard = PAGE_SIZES[pageSize] || PAGE_SIZES.A4;
      const baseW = standard.width;
      const baseH = standard.height;

      if (orientation === 'auto') {
        if (naturalWidth > naturalHeight) {
          // Image is landscape
          pageWidth = Math.max(baseW, baseH);
          pageHeight = Math.min(baseW, baseH);
        } else {
          // Image is portrait or square
          pageWidth = Math.min(baseW, baseH);
          pageHeight = Math.max(baseW, baseH);
        }
      } else if (orientation === 'landscape') {
        pageWidth = Math.max(baseW, baseH);
        pageHeight = Math.min(baseW, baseH);
      } else {
        pageWidth = Math.min(baseW, baseH);
        pageHeight = Math.max(baseW, baseH);
      }
    }

    const page = doc.addPage([pageWidth, pageHeight]);

    // Optional background fill
    if (backgroundColor && backgroundColor.toLowerCase() !== '#ffffff') {
      const bgColor = parseColorToPdfRgb(backgroundColor);
      page.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: bgColor
      });
    }

    // Calculate placement rectangle
    const effectiveMargin = pageSize === 'FitToImage' ? 0 : Math.max(0, margin);
    const availW = Math.max(10, pageWidth - 2 * effectiveMargin);
    const availH = Math.max(10, pageHeight - 2 * effectiveMargin);

    let drawW, drawH, drawX, drawY;

    if (layout === 'fill' && pageSize !== 'FitToImage') {
      // Scale to cover available area (may crop edges)
      const scale = Math.max(availW / naturalWidth, availH / naturalHeight);
      drawW = naturalWidth * scale;
      drawH = naturalHeight * scale;
      drawX = effectiveMargin + (availW - drawW) / 2;
      drawY = effectiveMargin + (availH - drawH) / 2;
    } else {
      // 'fit': entire image stays visible preserving aspect ratio
      const scale = Math.min(availW / naturalWidth, availH / naturalHeight, 1.0 * (pageSize === 'FitToImage' ? 1.0 : Infinity));
      drawW = naturalWidth * scale;
      drawH = naturalHeight * scale;
      drawX = effectiveMargin + (availW - drawW) / 2;
      drawY = effectiveMargin + (availH - drawH) / 2;
    }

    page.drawImage(embeddedImg, {
      x: +drawX.toFixed(2),
      y: +drawY.toFixed(2),
      width: +drawW.toFixed(2),
      height: +drawH.toFixed(2)
    });
  }

  const pdfBytes = await doc.save();
  return {
    bytes: pdfBytes,
    pageCount: images.length
  };
}

