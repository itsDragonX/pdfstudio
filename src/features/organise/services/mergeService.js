import { PDFDocument } from 'pdf-lib';
import { safeLoadPDF } from './pageOperations.js';

/**
 * Merges multiple PDF documents in the specified order.
 * @param {Array<{ name: string, bytes: Uint8Array | ArrayBuffer }>} pdfFiles - List of PDF files to merge in order
 * @param {string} [outputName='merged-document.pdf'] - Name for the merged output
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number, filename: string }>}
 */
export async function mergePDFs(pdfFiles, outputName = 'merged-document.pdf') {
  if (!pdfFiles || pdfFiles.length < 2) {
    throw new Error('At least two PDF documents are required to perform a merge.');
  }

  const mergedDoc = await PDFDocument.create();

  for (let i = 0; i < pdfFiles.length; i++) {
    const file = pdfFiles[i];
    const fileLabel = file?.name || `Document ${i + 1}`;

    const srcDoc = await safeLoadPDF(file, fileLabel);
    const pageIndices = srcDoc.getPageIndices();
    if (pageIndices.length === 0) {
      console.warn(`File "${fileLabel}" has 0 pages, skipping.`);
      continue;
    }

    const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);
    for (const page of copiedPages) {
      mergedDoc.addPage(page);
    }
  }

  if (mergedDoc.getPageCount() === 0) {
    throw new Error('Merged document contains no pages.');
  }

  const mergedBytes = await mergedDoc.save();
  return {
    bytes: new Uint8Array(mergedBytes),
    pageCount: mergedDoc.getPageCount(),
    filename: outputName
  };
}
