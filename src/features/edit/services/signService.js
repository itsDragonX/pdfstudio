import { safeLoadPDF } from '../../organise/services/pageOperations.js';

/**
 * Adds a visual signature image (drawn, typed cursive, or uploaded PNG) to a PDF page.
 * Notice: This is a visual signature only, not a cryptographic X.509 digital signature.
 * 
 * @param {Uint8Array | ArrayBuffer} pdfInput - Source PDF bytes
 * @param {object} options
 * @param {number} options.pageIndex - 0-based page index
 * @param {Uint8Array | string} options.signatureData - PNG Uint8Array or data URL
 * @param {number} options.x - PDF user-space X
 * @param {number} options.y - PDF user-space Y
 * @param {number} options.width - Rendered width in points
 * @param {number} options.height - Rendered height in points
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number }>}
 */
export async function addSignatureToPDF(pdfInput, options) {
  const {
    pageIndex = 0,
    signatureData,
    x = 100,
    y = 200,
    width = 180,
    height = 60
  } = options || {};

  if (!signatureData) {
    throw new Error('Please create or upload a signature first.');
  }

  const doc = await safeLoadPDF(pdfInput, 'Sign');
  const pages = doc.getPages();

  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new Error(`Invalid page target (${pageIndex + 1}). Document contains ${pages.length} pages.`);
  }

  const targetPage = pages[pageIndex];

  let pngBytes;
  if (typeof signatureData === 'string' && signatureData.startsWith('data:image/')) {
    // Base64 data URL
    const base64Data = signatureData.split(',')[1];
    const binary = atob(base64Data);
    pngBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      pngBytes[i] = binary.charCodeAt(i);
    }
  } else if (signatureData instanceof Uint8Array) {
    pngBytes = signatureData;
  } else {
    throw new Error('Unsupported signature data format.');
  }

  // Embed signature as PNG
  const embeddedSig = await doc.embedPng(pngBytes);

  targetPage.drawImage(embeddedSig, {
    x,
    y,
    width: Math.max(20, width),
    height: Math.max(10, height)
  });

  const modifiedBytes = await doc.save();
  return {
    bytes: modifiedBytes,
    pageCount: pages.length
  };
}

