import { degrees } from 'pdf-lib';
import { safeLoadPDF } from './pageOperations.js';

/**
 * Rotates target pages by a delta angle (+90, -90, 180).
 * Preserves existing rotation and normalizes to [0, 90, 180, 270].
 * @param {Uint8Array | ArrayBuffer} sourceBytes - Source PDF bytes
 * @param {number[] | 'all'} targetPageNumbers - Array of 1-based page numbers or 'all'
 * @param {number} angleDelta - Rotation delta in degrees (+90, -90, 180)
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number }>}
 */
export async function rotatePages(sourceBytes, targetPageNumbers, angleDelta) {
  const doc = await safeLoadPDF(sourceBytes);
  const totalPages = doc.getPageCount();

  if (totalPages === 0) {
    throw new Error('Cannot rotate an empty document.');
  }

  let indicesToRotate = [];
  if (targetPageNumbers === 'all') {
    indicesToRotate = doc.getPageIndices();
  } else if (Array.isArray(targetPageNumbers)) {
    indicesToRotate = targetPageNumbers
      .map((p) => p - 1)
      .filter((idx) => idx >= 0 && idx < totalPages);
  } else if (typeof targetPageNumbers === 'number') {
    const idx = targetPageNumbers - 1;
    if (idx >= 0 && idx < totalPages) {
      indicesToRotate = [idx];
    }
  }

  if (indicesToRotate.length === 0) {
    throw new Error('No valid pages selected for rotation.');
  }

  for (const idx of indicesToRotate) {
    const page = doc.getPage(idx);
    const currentAngle = page.getRotation().angle || 0;

    let newAngle = (currentAngle + angleDelta) % 360;
    if (newAngle < 0) newAngle += 360;

    // Normalise to nearest standard 90-degree quadrant
    newAngle = Math.round(newAngle / 90) * 90 % 360;

    page.setRotation(degrees(newAngle));
  }

  const rotatedBytes = await doc.save();
  return {
    bytes: new Uint8Array(rotatedBytes),
    pageCount: doc.getPageCount()
  };
}
