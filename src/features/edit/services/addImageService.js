import { degrees } from 'pdf-lib';
import { safeLoadPDF } from '../../organise/services/pageOperations.js';
import { isWebP, convertWebPToPng } from '../utils/imageConversion.js';

/**
 * Embeds and draws an image (PNG, JPEG, WebP) on a specified PDF page.
 * 
 * @param {Uint8Array | ArrayBuffer} pdfInput - Source PDF bytes
 * @param {object} options
 * @param {number} options.pageIndex - 0-based page index
 * @param {Uint8Array | ArrayBuffer | File | Blob} options.imageBytes - Image data
 * @param {'png'|'jpeg'|'webp'} [options.format='png'] - Image format
 * @param {number} options.x - PDF user-space X
 * @param {number} options.y - PDF user-space Y
 * @param {number} options.width - Rendered width in points
 * @param {number} options.height - Rendered height in points
 * @param {number} [options.rotation=0] - Rotation angle in degrees
 * @param {number} [options.opacity=1.0] - Opacity
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number }>}
 */
export async function addImageToPDF(pdfInput, options) {
  const {
    pageIndex = 0,
    imageBytes,
    format = 'png',
    x = 100,
    y = 400,
    width = 200,
    height = 150,
    rotation = 0,
    opacity = 1.0
  } = options || {};

  if (!imageBytes || (imageBytes.byteLength !== undefined && imageBytes.byteLength === 0)) {
    throw new Error('Please select an image to add.');
  }

  const doc = await safeLoadPDF(pdfInput, 'Add Image');
  const pages = doc.getPages();

  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new Error(`Invalid page target (${pageIndex + 1}). Document contains ${pages.length} pages.`);
  }

  const targetPage = pages[pageIndex];

  let rawBytes = imageBytes;
  let imgFormat = format.toLowerCase();

  // Handle File/Blob input
  if (typeof Blob !== 'undefined' && imageBytes instanceof Blob) {
    if (isWebP(imageBytes)) {
      const converted = await convertWebPToPng(imageBytes);
      rawBytes = converted.bytes;
      imgFormat = 'png';
    } else {
      const buf = await imageBytes.arrayBuffer();
      rawBytes = new Uint8Array(buf);
      imgFormat = imageBytes.type?.includes('jpeg') || imageBytes.type?.includes('jpg') ? 'jpeg' : 'png';
    }
  } else if (isWebP(imageBytes)) {
    const converted = await convertWebPToPng(imageBytes);
    rawBytes = converted.bytes;
    imgFormat = 'png';
  }

  // Embed image
  let embeddedImage;
  try {
    if (imgFormat === 'jpeg' || imgFormat === 'jpg') {
      embeddedImage = await doc.embedJpg(rawBytes);
    } else {
      embeddedImage = await doc.embedPng(rawBytes);
    }
  } catch (embedErr) {
    // Attempt fallback to PNG if JPEG embed failed
    try {
      embeddedImage = await doc.embedPng(rawBytes);
    } catch {
      throw new Error(`Failed to embed image: ${embedErr.message}. Ensure it is a valid PNG, JPEG, or WebP.`);
    }
  }

  const safeOpacity = Math.max(0.05, Math.min(1.0, opacity));

  targetPage.drawImage(embeddedImage, {
    x,
    y,
    width: Math.max(10, width),
    height: Math.max(10, height),
    rotate: degrees(rotation || 0),
    opacity: safeOpacity
  });

  const modifiedBytes = await doc.save();
  return {
    bytes: modifiedBytes,
    pageCount: pages.length
  };
}

