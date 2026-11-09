import { PDFDocument } from 'pdf-lib';
import { normalizeToUint8Array } from '../../organise/services/pageOperations.js';
import { pdfjsLib, PDFJS_OFFLINE_CONFIG } from '../../../core/pdfjs-init.js';

export const COMPRESSION_PRESETS = [
  {
    id: 'structure',
    name: 'Structure Optimization',
    desc: 'Cleans unused indirect objects and streams. 100% vector & selectable text preserved.',
    recommended: true
  },
  {
    id: 'raster-balanced',
    name: 'High Compression (Balanced)',
    desc: 'Re-encodes pages to 65% quality JPEG. High file reduction, flattens text & vectors.',
    quality: 0.65,
    dpi: 140
  },
  {
    id: 'raster-high',
    name: 'High Compression (High Quality)',
    desc: 'Re-encodes pages to 80% quality JPEG. Good visual fidelity, flattens text & vectors.',
    quality: 0.80,
    dpi: 150
  },
  {
    id: 'raster-compact',
    name: 'High Compression (Smaller File)',
    desc: 'Aggressive 45% quality JPEG. Maximum size reduction, flattens text & vectors.',
    quality: 0.45,
    dpi: 110
  }
];

/**
 * Method A: Structure Optimization
 * Strips unreferenced objects and repacks using object streams.
 * 100% lossless for text, vector curves, annotations and forms.
 */
export async function compressStructure(pdfInput, options = {}) {
  const { onProgress } = options;
  const rawBytes = await normalizeToUint8Array(pdfInput, 'Compress Structure');
  const originalSize = rawBytes.byteLength;

  if (onProgress) onProgress(1, 3, 'Loading PDF structure...');

  const pdfDoc = await PDFDocument.load(rawBytes, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();

  if (pageCount === 0) {
    throw new Error('PDF document contains no pages.');
  }

  if (onProgress) onProgress(2, 3, 'Optimizing object streams and unreferenced dictionaries...');

  // Save with object streams enabled
  const outputBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false
  });

  const outputSize = outputBytes.byteLength;
  const savedBytes = originalSize - outputSize;
  const percentReduction = Math.round((savedBytes / originalSize) * 1000) / 10;

  if (onProgress) onProgress(3, 3, 'Optimization complete.');

  return {
    bytes: outputBytes,
    originalSize,
    outputSize,
    savedBytes,
    percentReduction,
    method: 'structure',
    pageCount,
    isLarger: savedBytes < 0,
    isUnchanged: Math.abs(savedBytes) < 32,
    isFlattened: false
  };
}

/**
 * Method B: High Compression via Page Rasterization
 * Renders each page to high-quality JPEG and rebuilds clean PDF with pdf-lib.
 * Flattens vector/text content into raster images.
 */
export async function compressRasterized(pdfInput, options = {}) {
  const {
    quality = 0.65,
    dpi = 140,
    onProgress,
    cancelToken
  } = options;

  const rawBytes = await normalizeToUint8Array(pdfInput, 'Compress Rasterized');
  const originalSize = rawBytes.byteLength;

  // Load with PDF.js
  const loadingTask = pdfjsLib.getDocument({
    data: rawBytes.slice(0),
    ...PDFJS_OFFLINE_CONFIG
  });

  const sourcePdf = await loadingTask.promise;
  const pageCount = sourcePdf.numPages;

  if (pageCount === 0) {
    throw new Error('PDF document contains no pages.');
  }

  // Create clean destination PDF with pdf-lib
  const newPdf = await PDFDocument.create();
  const scale = dpi / 72;

  for (let i = 1; i <= pageCount; i++) {
    if (cancelToken?.aborted) {
      throw new Error('Compression cancelled by user.');
    }

    if (onProgress) {
      onProgress(i, pageCount + 1, `Rasterizing and re-encoding page ${i} of ${pageCount}...`);
    }

    const page = await sourcePdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const originalViewport = page.getViewport({ scale: 1.0 });

    // Offscreen canvas with solid white background
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise;

    // Convert canvas to JPEG bytes
    let jpegBytes;
    if (typeof canvas.toBlob === 'function') {
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
      jpegBytes = new Uint8Array(await blob.arrayBuffer());
    } else {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64 = dataUrl.split(',')[1];
      const binaryStr = atob(base64);
      jpegBytes = new Uint8Array(binaryStr.length);
      for (let k = 0; k < binaryStr.length; k++) {
        jpegBytes[k] = binaryStr.charCodeAt(k);
      }
    }

    // Embed JPEG into destination PDF
    const embeddedImg = await newPdf.embedJpg(jpegBytes);
    const newPage = newPdf.addPage([originalViewport.width, originalViewport.height]);

    newPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: originalViewport.width,
      height: originalViewport.height
    });

    // Cleanup canvas memory
    canvas.width = 1;
    canvas.height = 1;
  }

  if (onProgress) {
    onProgress(pageCount + 1, pageCount + 1, 'Serializing compressed PDF document...');
  }

  const outputBytes = await newPdf.save({
    useObjectStreams: true
  });

  const outputSize = outputBytes.byteLength;
  const savedBytes = originalSize - outputSize;
  const percentReduction = Math.round((savedBytes / originalSize) * 1000) / 10;

  return {
    bytes: outputBytes,
    originalSize,
    outputSize,
    savedBytes,
    percentReduction,
    method: 'rasterized',
    pageCount,
    isLarger: savedBytes < 0,
    isUnchanged: Math.abs(savedBytes) < 32,
    isFlattened: true
  };
}

/**
 * Unified compress entry point
 */
export async function compressPdf(pdfInput, options = {}) {
  const method = options.method || 'structure';
  if (method === 'structure') {
    return await compressStructure(pdfInput, options);
  } else {
    return await compressRasterized(pdfInput, options);
  }
}

