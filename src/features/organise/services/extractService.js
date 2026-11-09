import { PDFDocument } from 'pdf-lib';
import { safeLoadPDF, parsePageRanges } from './pageOperations.js';

/**
 * Extracts specified pages into a new independent PDF document.
 * @param {Uint8Array | ArrayBuffer} sourceBytes - Source PDF bytes
 * @param {number[] | string} pageSelection - Array of 1-based page numbers or range expression ("1-3, 5")
 * @param {string} [sourceFilename='document.pdf'] - Original filename for naming
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number, filename: string }>}
 */
export async function extractPages(sourceBytes, pageSelection, sourceFilename = 'document.pdf') {
  const srcDoc = await safeLoadPDF(sourceBytes);
  const totalPages = srcDoc.getPageCount();

  let indicesToExtract = [];

  if (typeof pageSelection === 'string') {
    const parseRes = parsePageRanges(pageSelection, totalPages);
    if (!parseRes.isValid) {
      throw new Error(parseRes.error || 'Invalid page range specification.');
    }
    // Collect all indices in order
    const set = new Set();
    for (const group of parseRes.groups) {
      for (const idx of group.indices) {
        if (!set.has(idx)) {
          set.add(idx);
          indicesToExtract.push(idx);
        }
      }
    }
  } else if (Array.isArray(pageSelection)) {
    indicesToExtract = pageSelection
      .map((p) => p - 1)
      .filter((idx) => idx >= 0 && idx < totalPages);
  }

  if (indicesToExtract.length === 0) {
    throw new Error('Please select at least one page to extract.');
  }

  const extractedDoc = await PDFDocument.create();
  const copiedPages = await extractedDoc.copyPages(srcDoc, indicesToExtract);

  for (const page of copiedPages) {
    extractedDoc.addPage(page);
  }

  const extractedBytes = await extractedDoc.save();
  const baseName = sourceFilename.replace(/\.pdf$/i, '');
  const filename = `${baseName}_extracted.pdf`;

  return {
    bytes: new Uint8Array(extractedBytes),
    pageCount: extractedDoc.getPageCount(),
    filename
  };
}
