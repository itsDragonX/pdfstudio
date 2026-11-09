import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { safeLoadPDF, parsePageRanges } from './pageOperations.js';

/**
 * Splits a PDF document by custom page ranges or by individual pages.
 * @param {Uint8Array | ArrayBuffer} sourceBytes - Source PDF bytes
 * @param {string} sourceFilename - Base name of the source PDF
 * @param {Object} options
 * @param {boolean} [options.splitEveryPage=false] - If true, split each page into its own PDF
 * @param {string} [options.rangeString=''] - Range syntax string (e.g. "1-3, 4-6")
 * @returns {Promise<{ isZip: boolean, zipBytes?: Uint8Array, zipFilename?: string, files: Array<{ filename: string, bytes: Uint8Array, pageCount: number }> }>}
 */
export async function splitPDF(sourceBytes, sourceFilename = 'document.pdf', options = {}) {
  const srcDoc = await safeLoadPDF(sourceBytes);
  const totalPages = srcDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('Cannot split an empty document.');
  }

  const baseName = sourceFilename.replace(/\.pdf$/i, '');
  let groups = [];

  if (options.splitEveryPage) {
    for (let p = 1; p <= totalPages; p++) {
      groups.push({
        label: `page_${p}`,
        indices: [p - 1],
        pageNumbers: [p]
      });
    }
  } else {
    const parseResult = parsePageRanges(options.rangeString, totalPages);
    if (!parseResult.isValid) {
      throw new Error(parseResult.error || 'Invalid page range specification.');
    }
    groups = parseResult.groups;
  }

  if (groups.length === 0) {
    throw new Error('No valid split ranges found.');
  }

  const generatedFiles = [];

  for (const group of groups) {
    const splitDoc = await PDFDocument.create();
    const copiedPages = await splitDoc.copyPages(srcDoc, group.indices);

    for (const page of copiedPages) {
      splitDoc.addPage(page);
    }

    const splitBytes = await splitDoc.save();
    const filename = `${baseName}_pages_${group.label}.pdf`;

    generatedFiles.push({
      filename,
      bytes: new Uint8Array(splitBytes),
      pageCount: group.indices.length
    });
  }

  // If only one file was produced, return it directly
  if (generatedFiles.length === 1) {
    return {
      isZip: false,
      files: generatedFiles
    };
  }

  // If multiple files produced, bundle into a ZIP archive
  const zip = new JSZip();
  for (const file of generatedFiles) {
    zip.file(file.filename, file.bytes);
  }

  const zipContent = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  const zipFilename = `${baseName}_split_pages.zip`;

  return {
    isZip: true,
    zipBytes: zipContent,
    zipFilename,
    files: generatedFiles
  };
}
