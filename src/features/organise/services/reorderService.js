import { PDFDocument } from 'pdf-lib';
import { safeLoadPDF } from './pageOperations.js';

/**
 * Reorders pages in a PDF document according to the provided sequence.
 * @param {Uint8Array | ArrayBuffer} sourceBytes - Source PDF bytes
 * @param {number[]} newPageOrder - Array of 1-based page numbers in the new order (e.g. [3, 1, 2, 4])
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number }>}
 */
export async function reorderPages(sourceBytes, newPageOrder) {
  const srcDoc = await safeLoadPDF(sourceBytes);
  const totalPages = srcDoc.getPageCount();

  if (!Array.isArray(newPageOrder) || newPageOrder.length !== totalPages) {
    throw new Error(`Invalid page order: expected ${totalPages} pages, got ${newPageOrder?.length || 0}.`);
  }

  // Validate that newPageOrder is a valid permutation of [1..totalPages]
  const seen = new Set();
  const indices = [];

  for (const pageNum of newPageOrder) {
    if (typeof pageNum !== 'number' || pageNum < 1 || pageNum > totalPages) {
      throw new Error(`Invalid page number in sequence: ${pageNum}.`);
    }
    if (seen.has(pageNum)) {
      throw new Error(`Duplicate page number in sequence: ${pageNum}.`);
    }
    seen.add(pageNum);
    indices.push(pageNum - 1); // 0-based index for copyPages
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, indices);

  for (const page of copiedPages) {
    newDoc.addPage(page);
  }

  const reorderedBytes = await newDoc.save();
  return {
    bytes: new Uint8Array(reorderedBytes),
    pageCount: newDoc.getPageCount()
  };
}
