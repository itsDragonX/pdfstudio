import { safeLoadPDF } from './pageOperations.js';

const STANDARD_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612.0, height: 792.0 }
};

/**
 * Inserts a blank page into the document at a specified position.
 * @param {Uint8Array | ArrayBuffer} sourceBytes - Source PDF bytes
 * @param {Object} options
 * @param {number} [options.targetPage=1] - 1-based reference page number
 * @param {'before' | 'after' | 'start' | 'end'} [options.position='after'] - Placement relative to target
 * @param {'adjacent' | 'a4' | 'letter'} [options.preset='adjacent'] - Page size preset
 * @param {'portrait' | 'landscape' | 'match'} [options.orientation='match'] - Orientation
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number, insertedIndex: number }>}
 */
export async function insertBlankPage(sourceBytes, options = {}) {
  const doc = await safeLoadPDF(sourceBytes);
  const totalPages = doc.getPageCount();

  const targetPage = Math.max(1, Math.min(totalPages, options.targetPage || 1));
  const position = options.position || 'after';
  const preset = options.preset || 'adjacent';
  const orientation = options.orientation || 'match';

  let insertIndex;
  let refIndex = targetPage - 1;

  if (position === 'start') {
    insertIndex = 0;
    refIndex = 0;
  } else if (position === 'end') {
    insertIndex = totalPages;
    refIndex = Math.max(0, totalPages - 1);
  } else if (position === 'before') {
    insertIndex = targetPage - 1;
    refIndex = targetPage - 1;
  } else {
    // 'after'
    insertIndex = targetPage;
    refIndex = targetPage - 1;
  }

  // Determine width and height
  let width, height;

  if (preset === 'adjacent' && totalPages > 0) {
    const refPage = doc.getPage(refIndex);
    const size = refPage.getSize();
    width = size.width;
    height = size.height;
  } else {
    const std = STANDARD_SIZES[preset] || STANDARD_SIZES.a4;
    width = std.width;
    height = std.height;

    if (orientation === 'landscape' && width < height) {
      const tmp = width;
      width = height;
      height = tmp;
    } else if (orientation === 'portrait' && width > height) {
      const tmp = width;
      width = height;
      height = tmp;
    }
  }

  // Insert the blank page
  doc.insertPage(insertIndex, [width, height]);

  const updatedBytes = await doc.save();
  return {
    bytes: new Uint8Array(updatedBytes),
    pageCount: doc.getPageCount(),
    insertedIndex: insertIndex
  };
}
