import { PDFDocument } from 'pdf-lib';
import { safeLoadPDF } from './pageOperations.js';

/**
 * Duplicates selected pages, inserting each duplicate immediately after its source page.
 * @param {Uint8Array | ArrayBuffer} sourceBytes - Source PDF bytes
 * @param {number[]} pageNumbersToDuplicate - Array of 1-based page numbers to duplicate
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number }>}
 */
export async function duplicatePages(sourceBytes, pageNumbersToDuplicate) {
  const srcDoc = await safeLoadPDF(sourceBytes);
  const totalPages = srcDoc.getPageCount();

  if (!Array.isArray(pageNumbersToDuplicate) || pageNumbersToDuplicate.length === 0) {
    throw new Error('Please select at least one page to duplicate.');
  }

  const duplicateSet = new Set(pageNumbersToDuplicate);
  const targetIndices = [];

  for (let p = 1; p <= totalPages; p++) {
    targetIndices.push(p - 1);
    if (duplicateSet.has(p)) {
      targetIndices.push(p - 1); // Insert duplicate immediately after
    }
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, targetIndices);

  for (const page of copiedPages) {
    newDoc.addPage(page);
  }

  const duplicatedBytes = await newDoc.save();
  return {
    bytes: new Uint8Array(duplicatedBytes),
    pageCount: newDoc.getPageCount()
  };
}
