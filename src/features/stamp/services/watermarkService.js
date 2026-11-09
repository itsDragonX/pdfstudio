import { degrees } from 'pdf-lib';
import { safeLoadPDF } from '../../organise/services/pageOperations.js';
import { parseColorToPdfRgb } from '../../edit/utils/colorUtils.js';
import { getStandardFont } from './fontHelper.js';
import { resolveTargetPageIndices } from './targetPagesHelper.js';

export const WATERMARK_PRESETS = [
  { id: 'confidential', label: 'CONFIDENTIAL', text: 'CONFIDENTIAL', color: '#FF3B30', rotation: -45 },
  { id: 'draft', label: 'DRAFT', text: 'DRAFT', color: '#8E8E93', rotation: -45 },
  { id: 'sample', label: 'SAMPLE', text: 'SAMPLE', color: '#0A84FF', rotation: -45 },
  { id: 'custom', label: 'CUSTOM', text: 'CUSTOM WATERMARK', color: '#FF9500', rotation: -45 }
];

/**
 * Calculates (x, y) lower-left anchor for drawing a rotated element such that
 * its bounding box center lands exactly at (cx, cy).
 * 
 * @param {number} cx - Target center X in PDF page points
 * @param {number} cy - Target center Y in PDF page points
 * @param {number} w - Width of unrotated element
 * @param {number} h - Height of unrotated element
 * @param {number} angleDeg - Rotation in degrees
 * @returns {{ x: number, y: number }}
 */
export function calculateRotatedAnchor(cx, cy, w, h, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const deltaX = (w / 2) * cos - (h / 2) * sin;
  const deltaY = (w / 2) * sin + (h / 2) * cos;

  return {
    x: +(cx - deltaX).toFixed(2),
    y: +(cy - deltaY).toFixed(2)
  };
}

/**
 * Calculates the center point (cx, cy) for standard positions on a page.
 * 
 * @param {string} position - 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom'
 * @param {number} pageWidth
 * @param {number} pageHeight
 * @param {number} elementWidth
 * @param {number} elementHeight
 * @param {number} [margin=40]
 * @param {number} [customX]
 * @param {number} [customY]
 * @returns {{ cx: number, cy: number }}
 */
export function calculateCenterPoint(position, pageWidth, pageHeight, elementWidth, elementHeight, margin = 40, customX, customY) {
  if (position === 'custom' && typeof customX === 'number' && typeof customY === 'number') {
    return { cx: customX, cy: customY };
  }

  const halfW = elementWidth / 2;
  const halfH = elementHeight / 2;

  switch (position) {
    case 'top-left':
      return { cx: margin + halfW, cy: pageHeight - margin - halfH };
    case 'top-right':
      return { cx: pageWidth - margin - halfW, cy: pageHeight - margin - halfH };
    case 'bottom-left':
      return { cx: margin + halfW, cy: margin + halfH };
    case 'bottom-right':
      return { cx: pageWidth - margin - halfW, cy: margin + halfH };
    case 'center':
    default:
      return { cx: pageWidth / 2, cy: pageHeight / 2 };
  }
}

/**
 * Applies a Text or Image Watermark to a PDF document.
 * 
 * @param {Uint8Array | ArrayBuffer | Blob | File} pdfInput - Source PDF bytes
 * @param {object} options
 * @param {'text' | 'image'} [options.type='text']
 * @param {string} [options.text='CONFIDENTIAL']
 * @param {string} [options.fontName='Helvetica']
 * @param {number} [options.fontSize=48]
 * @param {string} [options.color='#FF3B30']
 * @param {number} [options.opacity=0.25]
 * @param {number} [options.rotation=-45]
 * @param {string} [options.position='center']
 * @param {number} [options.customX]
 * @param {number} [options.customY]
 * @param {boolean} [options.isTiled=false]
 * @param {Uint8Array} [options.imageBytes]
 * @param {'png' | 'jpg'} [options.imageFormat='png']
 * @param {number} [options.imageScale=1.0]
 * @param {number} [options.imageWidth]
 * @param {number} [options.imageHeight]
 * @param {'all' | 'current' | 'selected' | 'range'} [options.pageTarget='all']
 * @param {number} [options.currentPageIndex=0]
 * @param {number[]} [options.selectedPageIndices=[]]
 * @param {string} [options.rangeString='']
 * @param {boolean} [options.excludeFirstPage=false]
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number, modifiedPages: number[] }>}
 */
export async function applyWatermarkToPDF(pdfInput, options = {}) {
  const {
    type = 'text',
    text = 'CONFIDENTIAL',
    fontName = 'Helvetica',
    fontSize = 48,
    color = '#FF3B30',
    opacity = 0.25,
    rotation = -45,
    position = 'center',
    customX,
    customY,
    isTiled = false,
    imageBytes,
    imageFormat = 'png',
    imageScale = 1.0,
    imageWidth,
    imageHeight
  } = options;

  if (type === 'text' && (!text || !text.trim())) {
    throw new Error('Please specify watermark text.');
  }

  if (type === 'image' && (!imageBytes || imageBytes.byteLength === 0)) {
    throw new Error('Please select a valid image file for the watermark.');
  }

  const doc = await safeLoadPDF(pdfInput, 'Watermark');
  const pages = doc.getPages();
  const totalPages = pages.length;

  if (totalPages === 0) {
    throw new Error('Document contains no pages.');
  }

  const targetIndices = resolveTargetPageIndices(options, totalPages);
  if (targetIndices.length === 0) {
    throw new Error('No target pages selected for watermark.');
  }

  const safeOpacity = Math.max(0.01, Math.min(1.0, opacity));
  const rotDegrees = degrees(rotation);

  // Prepare font or image
  let font = null;
  let embeddedImage = null;
  let finalWidth = 0;
  let finalHeight = 0;

  if (type === 'text') {
    font = await getStandardFont(doc, fontName);
    finalWidth = font.widthOfTextAtSize(text, fontSize);
    finalHeight = font.heightAtSize(fontSize);
  } else {
    // Embed PNG or JPG
    const isPng = imageFormat.toLowerCase() === 'png';
    try {
      embeddedImage = isPng
        ? await doc.embedPng(imageBytes)
        : await doc.embedJpg(imageBytes);
    } catch (embedErr) {
      // Fallback try the other format in case format was mislabeled
      try {
        embeddedImage = isPng
          ? await doc.embedJpg(imageBytes)
          : await doc.embedPng(imageBytes);
      } catch {
        throw new Error(`Failed to embed watermark image: ${embedErr.message}`);
      }
    }

    if (imageWidth && imageHeight) {
      finalWidth = imageWidth;
      finalHeight = imageHeight;
    } else {
      const scaled = embeddedImage.scale(imageScale || 1.0);
      finalWidth = scaled.width;
      finalHeight = scaled.height;
    }
  }

  const pdfColor = parseColorToPdfRgb(color);

  // Apply to target pages
  for (const pageIdx of targetIndices) {
    const page = pages[pageIdx];
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    if (isTiled) {
      // Grid of repeated watermarks
      const stepX = Math.max(160, finalWidth * 1.5);
      const stepY = Math.max(120, finalHeight * 2.5);
      const margin = 40;

      for (let cy = margin + finalHeight; cy < pageHeight - margin; cy += stepY) {
        for (let cx = margin + finalWidth / 2; cx < pageWidth - margin; cx += stepX) {
          const { x, y } = calculateRotatedAnchor(cx, cy, finalWidth, finalHeight, rotation);
          if (type === 'text') {
            page.drawText(text, {
              x,
              y,
              size: fontSize,
              font,
              color: pdfColor,
              opacity: safeOpacity,
              rotate: rotDegrees
            });
          } else {
            page.drawImage(embeddedImage, {
              x,
              y,
              width: finalWidth,
              height: finalHeight,
              opacity: safeOpacity,
              rotate: rotDegrees
            });
          }
        }
      }
    } else {
      // Single positioned watermark
      const { cx, cy } = calculateCenterPoint(
        position,
        pageWidth,
        pageHeight,
        finalWidth,
        finalHeight,
        40,
        customX,
        customY
      );

      const { x, y } = calculateRotatedAnchor(cx, cy, finalWidth, finalHeight, rotation);

      if (type === 'text') {
        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: pdfColor,
          opacity: safeOpacity,
          rotate: rotDegrees
        });
      } else {
        page.drawImage(embeddedImage, {
          x,
          y,
          width: finalWidth,
          height: finalHeight,
          opacity: safeOpacity,
          rotate: rotDegrees
        });
      }
    }
  }

  const modifiedBytes = await doc.save();
  return {
    bytes: modifiedBytes,
    pageCount: totalPages,
    modifiedPages: targetIndices
  };
}

