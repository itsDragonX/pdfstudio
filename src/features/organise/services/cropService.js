import { safeLoadPDF } from './pageOperations.js';

/**
 * Applies a CropBox to selected pages in the PDF document.
 * Note: Modifying CropBox changes the visible/rendered region in PDF viewers without erasing underlying objects.
 * @param {Uint8Array | ArrayBuffer} sourceBytes - Source PDF bytes
 * @param {number[] | 'all'} targetPageNumbers - Array of 1-based page numbers or 'all'
 * @param {{ x: number, y: number, width: number, height: number }} cropBox - CropBox coordinates in PDF user points (bottom-left origin)
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number, appliedBox: { x: number, y: number, width: number, height: number } }>}
 */
export async function cropPages(sourceBytes, targetPageNumbers, cropBox) {
  const doc = await safeLoadPDF(sourceBytes);
  const totalPages = doc.getPageCount();

  if (!cropBox || cropBox.width <= 0 || cropBox.height <= 0) {
    throw new Error('Invalid crop dimensions: width and height must be greater than zero.');
  }

  let indicesToCrop = [];
  if (targetPageNumbers === 'all') {
    indicesToCrop = doc.getPageIndices();
  } else if (Array.isArray(targetPageNumbers)) {
    indicesToCrop = targetPageNumbers
      .map((p) => p - 1)
      .filter((idx) => idx >= 0 && idx < totalPages);
  } else if (typeof targetPageNumbers === 'number') {
    const idx = targetPageNumbers - 1;
    if (idx >= 0 && idx < totalPages) {
      indicesToCrop = [idx];
    }
  }

  if (indicesToCrop.length === 0) {
    throw new Error('No valid pages selected for crop.');
  }

  for (const idx of indicesToCrop) {
    const page = doc.getPage(idx);
    const mediaBox = page.getMediaBox();

    // Clamp crop values within MediaBox boundaries
    const safeX = Math.max(mediaBox.x, Math.min(mediaBox.x + mediaBox.width, cropBox.x));
    const safeY = Math.max(mediaBox.y, Math.min(mediaBox.y + mediaBox.height, cropBox.y));
    const safeWidth = Math.max(10, Math.min(mediaBox.width - (safeX - mediaBox.x), cropBox.width));
    const safeHeight = Math.max(10, Math.min(mediaBox.height - (safeY - mediaBox.y), cropBox.height));

    page.setCropBox(safeX, safeY, safeWidth, safeHeight);
  }

  const croppedBytes = await doc.save();
  return {
    bytes: new Uint8Array(croppedBytes),
    pageCount: doc.getPageCount(),
    appliedBox: {
      x: cropBox.x,
      y: cropBox.y,
      width: cropBox.width,
      height: cropBox.height
    }
  };
}
