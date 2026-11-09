import JSZip from 'jszip';
import { safeLoadPDF, normalizeToUint8Array } from '../../organise/services/pageOperations.js';
import { pdfjsLib, PDFJS_OFFLINE_CONFIG } from '../../../core/pdfjs-init.js';
import { resolveTargetPageIndices } from '../../stamp/services/targetPagesHelper.js';

/**
 * Converts selected pages of a PDF document into high-resolution images (PNG or JPEG).
 * Produces individual image items and an optional bundled JSZip archive.
 * 
 * @param {Uint8Array | ArrayBuffer | Blob | File} pdfInput - Source PDF bytes
 * @param {object} options
 * @param {'png' | 'jpeg'} [options.format='png']
 * @param {number} [options.dpi=150] - Standard: 150, High: 300
 * @param {number} [options.jpegQuality=0.85] - 0.1 to 1.0
 * @param {string} [options.baseFilename='document']
 * @param {'all' | 'current' | 'selected' | 'range'} [options.pageTarget='all']
 * @param {number} [options.currentPageIndex=0]
 * @param {number[]} [options.selectedPageIndices=[]]
 * @param {string} [options.rangeString='']
 * @param {(current: number, total: number, message: string) => void} [options.onProgress]
 * @param {{ aborted: boolean }} [options.cancelToken]
 * @returns {Promise<{ images: Array<{ pageNumber: number, filename: string, bytes: Uint8Array, blob: Blob, dataUrl: string, width: number, height: number }>, zipBytes?: Uint8Array, zipFilename?: string }>}
 */
export async function convertPdfToImages(pdfInput, options = {}) {
  const {
    format = 'png',
    dpi = 150,
    jpegQuality = 0.85,
    baseFilename = 'document',
    onProgress,
    cancelToken
  } = options;

  const rawBytes = await normalizeToUint8Array(pdfInput, 'PDF to Images');

  // Load PDF with PDF.js
  const loadingTask = pdfjsLib.getDocument({
    data: rawBytes.slice(0),
    ...PDFJS_OFFLINE_CONFIG
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  if (totalPages === 0) {
    throw new Error('PDF document contains no pages.');
  }

  // Resolve target pages
  const targetIndices = resolveTargetPageIndices(options, totalPages);
  if (targetIndices.length === 0) {
    throw new Error('No target pages selected for conversion.');
  }

  // Calculate PDF.js scale: 72 points per inch
  const scale = dpi / 72;
  const cleanBaseName = baseFilename.replace(/\.pdf$/i, '');
  const isJpeg = format.toLowerCase() === 'jpeg' || format.toLowerCase() === 'jpg';
  const mimeType = isJpeg ? 'image/jpeg' : 'image/png';
  const ext = isJpeg ? 'jpg' : 'png';

  const images = [];
  const zip = new JSZip();

  for (let i = 0; i < targetIndices.length; i++) {
    if (cancelToken?.aborted) {
      throw new Error('Conversion cancelled by user.');
    }

    const pageIdx = targetIndices[i];
    const pageNumber = pageIdx + 1;

    if (onProgress) {
      onProgress(i + 1, targetIndices.length, `Rendering page ${pageNumber} (${i + 1} of ${targetIndices.length})...`);
    }

    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    // Create offscreen canvas with exact DPI resolution
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d', { alpha: !isJpeg });

    // For JPEG, fill white background to prevent dark transparent regions
    if (isJpeg) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const renderTask = page.render({
      canvasContext: ctx,
      viewport
    });

    await renderTask.promise;

    // Convert canvas to Blob & Uint8Array
    const { blob, bytes, dataUrl } = await new Promise((resolve, reject) => {
      canvas.toBlob(
        async (b) => {
          if (!b) return reject(new Error(`Failed to export page ${pageNumber} to image.`));
          const buffer = await b.arrayBuffer();
          const uint8 = new Uint8Array(buffer);
          const url = URL.createObjectURL(b);
          resolve({ blob: b, bytes: uint8, dataUrl: url });
        },
        mimeType,
        isJpeg ? jpegQuality : undefined
      );
    });

    const padDigits = totalPages > 99 ? 3 : 2;
    const pagePad = String(pageNumber).padStart(padDigits, '0');
    const filename = `${cleanBaseName}_page_${pagePad}.${ext}`;

    images.push({
      pageNumber,
      filename,
      bytes,
      blob,
      dataUrl,
      width: canvas.width,
      height: canvas.height
    });

    zip.file(filename, bytes);

    // Free canvas memory
    canvas.width = 0;
    canvas.height = 0;
  }

  // Generate ZIP bundle if more than 1 image or if requested
  let zipBytes = null;
  const zipFilename = `${cleanBaseName}_images_${dpi}dpi.zip`;
  if (images.length > 1) {
    if (onProgress) {
      onProgress(targetIndices.length, targetIndices.length, 'Packaging ZIP archive...');
    }
    zipBytes = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
  }

  return {
    images,
    zipBytes,
    zipFilename
  };
}

