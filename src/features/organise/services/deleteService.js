import { safeLoadPDF } from './pageOperations.js';

/**
 * Deletes selected pages from a PDF document.
 * Enforces document safety: at least one page must always remain.
 * @param {Uint8Array | ArrayBuffer} sourceBytes - Source PDF bytes
 * @param {number[]} pageNumbersToDelete - Array of 1-based page numbers to delete
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number }>}
 */
export async function deletePages(sourceBytes, pageNumbersToDelete) {
  const doc = await safeLoadPDF(sourceBytes);
  const totalPages = doc.getPageCount();

  if (!Array.isArray(pageNumbersToDelete) || pageNumbersToDelete.length === 0) {
    throw new Error('Please select at least one page to delete.');
  }

  // Deduplicate and convert to 0-based indices
  const uniquePages = Array.from(new Set(pageNumbersToDelete));
  const validIndices = uniquePages
    .map((p) => p - 1)
    .filter((idx) => idx >= 0 && idx < totalPages);

  if (validIndices.length === 0) {
    throw new Error('No valid pages found to delete.');
  }

  if (validIndices.length >= totalPages) {
    throw new Error('Cannot delete all pages. A PDF document must retain at least one page.');
  }

  // Sort descending so higher page removals do not affect lower indices
  validIndices.sort((a, b) => b - a);

  for (const idx of validIndices) {
    doc.removePage(idx);
  }

  const remainingBytes = await doc.save();
  return {
    bytes: new Uint8Array(remainingBytes),
    pageCount: doc.getPageCount()
  };
}
