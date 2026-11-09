import { normalizeToUint8Array } from '../../organise/services/pageOperations.js';
import { pdfjsLib, PDFJS_OFFLINE_CONFIG } from '../../../core/pdfjs-init.js';
import { reconstructPageText } from '../../convert/services/pdfToTextService.js';

/**
 * Normalizes text string for reliable difference comparison.
 */
export function normalizeTextForDiff(text = '') {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Compares two text strings and categorizes changes.
 */
export function compareTextStrings(textA = '', textB = '') {
  const normA = normalizeTextForDiff(textA);
  const normB = normalizeTextForDiff(textB);

  const isIdentical = normA === normB;
  const isScannedA = normA.length < 15;
  const isScannedB = normB.length < 15;

  return {
    isIdentical,
    isScannedA,
    isScannedB,
    lengthA: normA.length,
    lengthB: normB.length,
    charDelta: normB.length - normA.length
  };
}

/**
 * Performs pixel-by-pixel difference analysis on two canvas contexts.
 * Returns similarity percentage, difference count, and generates a visual diff overlay image.
 */
export function computeVisualDifference(canvasA, canvasB, width, height, threshold = 20) {
  // If canvas API is unavailable (e.g. headless Node), return fallback
  if (typeof document === 'undefined' || !canvasA || !canvasB) {
    return {
      similarity: 100,
      diffPixels: 0,
      totalPixels: width * height,
      hasVisualDiff: false,
      diffOverlayUrl: null
    };
  }

  const ctxA = canvasA.getContext('2d');
  const ctxB = canvasB.getContext('2d');

  const imgDataA = ctxA.getImageData(0, 0, width, height);
  const imgDataB = ctxB.getImageData(0, 0, width, height);

  const dataA = imgDataA.data;
  const dataB = imgDataB.data;

  // Output diff canvas
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width;
  diffCanvas.height = height;
  const diffCtx = diffCanvas.getContext('2d');
  const diffImgData = diffCtx.createImageData(width, height);
  const diffData = diffImgData.data;

  let diffPixels = 0;
  const totalPixels = width * height;

  for (let i = 0; i < dataA.length; i += 4) {
    const rA = dataA[i];
    const gA = dataA[i + 1];
    const bA = dataA[i + 2];

    const rB = dataB[i];
    const gB = dataB[i + 1];
    const bB = dataB[i + 2];

    // Calculate color distance
    const dist = (Math.abs(rA - rB) + Math.abs(gA - gB) + Math.abs(bA - bB)) / 3;

    if (dist > threshold) {
      diffPixels++;
      // Highlight difference in vibrant magenta/red
      diffData[i] = 255;     // R
      diffData[i + 1] = 45;  // G
      diffData[i + 2] = 85;  // B
      diffData[i + 3] = 220; // Alpha
    } else {
      // Fade matching background into translucent grayscale
      const gray = Math.round((rA * 0.299 + gA * 0.587 + bA * 0.114));
      diffData[i] = gray;
      diffData[i + 1] = gray;
      diffData[i + 2] = gray;
      diffData[i + 3] = 35; // Soft ghosted background
    }
  }

  diffCtx.putImageData(diffImgData, 0, 0);
  const diffOverlayUrl = diffCanvas.toDataURL('image/png');

  // Memory cleanup
  diffCanvas.width = 1;
  diffCanvas.height = 1;

  const diffRatio = diffPixels / totalPixels;
  const similarity = Math.max(0, Math.round((1 - diffRatio) * 1000) / 10);
  // Ignore negligible anti-aliasing noise (< 0.05% of page)
  const hasVisualDiff = diffRatio > 0.0005;

  return {
    similarity,
    diffPixels,
    totalPixels,
    hasVisualDiff,
    diffOverlayUrl
  };
}

/**
 * Compares two PDF documents page-by-page.
 * 
 * @param {Uint8Array | ArrayBuffer | Blob | File} pdfInputA - Document A (baseline)
 * @param {Uint8Array | ArrayBuffer | Blob | File} pdfInputB - Document B (comparison)
 * @param {object} options
 * @returns {Promise<{
 *   totalPagesA: number,
 *   totalPagesB: number,
 *   maxPages: number,
 *   pagesDiff: number,
 *   pages: Array<object>,
 *   summary: {
 *     identicalPages: number,
 *     visuallyDifferentPages: number,
 *     textDifferentPages: number,
 *     addedPages: number,
 *     removedPages: number,
 *     overallSimilarity: number
 *   }
 * }>}
 */
export async function comparePdfDocuments(pdfInputA, pdfInputB, options = {}) {
  const { onProgress, cancelToken, renderScale = 1.0 } = options;

  const rawBytesA = await normalizeToUint8Array(pdfInputA, 'Compare PDF A');
  const rawBytesB = await normalizeToUint8Array(pdfInputB, 'Compare PDF B');

  // Load both documents via PDF.js
  const docATask = pdfjsLib.getDocument({
    data: rawBytesA.slice(0),
    ...PDFJS_OFFLINE_CONFIG
  });
  const docBTask = pdfjsLib.getDocument({
    data: rawBytesB.slice(0),
    ...PDFJS_OFFLINE_CONFIG
  });

  const [pdfA, pdfB] = await Promise.all([docATask.promise, docBTask.promise]);

  const totalPagesA = pdfA.numPages;
  const totalPagesB = pdfB.numPages;
  const maxPages = Math.max(totalPagesA, totalPagesB);

  const pageResults = [];
  let totalSimilarity = 0;
  let visuallyDifferentCount = 0;
  let textDifferentCount = 0;
  let identicalCount = 0;
  let addedCount = 0;
  let removedCount = 0;

  for (let i = 0; i < maxPages; i++) {
    if (cancelToken?.aborted) {
      throw new Error('Comparison cancelled by user.');
    }

    const pageNum = i + 1;
    if (onProgress) {
      onProgress(pageNum, maxPages, `Comparing page ${pageNum} of ${maxPages}...`);
    }

    const hasPageA = i < totalPagesA;
    const hasPageB = i < totalPagesB;

    let pageA = null;
    let pageB = null;
    let textA = '';
    let textB = '';
    let previewA = null;
    let previewB = null;
    let diffOverlayUrl = null;
    let similarity = 100;
    let hasVisualDiff = false;
    let hasTextDiff = false;
    let status = 'identical';

    // 1. If page exists only in B (Added)
    if (!hasPageA && hasPageB) {
      pageB = await pdfB.getPage(pageNum);
      const textContentB = await pageB.getTextContent();
      textB = reconstructPageText(textContentB.items);

      if (typeof document !== 'undefined') {
        const viewportB = pageB.getViewport({ scale: renderScale });
        const canvasB = document.createElement('canvas');
        canvasB.width = Math.floor(viewportB.width);
        canvasB.height = Math.floor(viewportB.height);
        const ctxB = canvasB.getContext('2d');
        ctxB.fillStyle = '#FFFFFF';
        ctxB.fillRect(0, 0, canvasB.width, canvasB.height);
        await pageB.render({ canvasContext: ctxB, viewport: viewportB }).promise;
        previewB = canvasB.toDataURL('image/png');
        canvasB.width = 1;
        canvasB.height = 1;
      }

      status = 'added';
      similarity = 0;
      hasVisualDiff = true;
      hasTextDiff = true;
      addedCount++;
    }
    // 2. If page exists only in A (Removed)
    else if (hasPageA && !hasPageB) {
      pageA = await pdfA.getPage(pageNum);
      const textContentA = await pageA.getTextContent();
      textA = reconstructPageText(textContentA.items);

      if (typeof document !== 'undefined') {
        const viewportA = pageA.getViewport({ scale: renderScale });
        const canvasA = document.createElement('canvas');
        canvasA.width = Math.floor(viewportA.width);
        canvasA.height = Math.floor(viewportA.height);
        const ctxA = canvasA.getContext('2d');
        ctxA.fillStyle = '#FFFFFF';
        ctxA.fillRect(0, 0, canvasA.width, canvasA.height);
        await pageA.render({ canvasContext: ctxA, viewport: viewportA }).promise;
        previewA = canvasA.toDataURL('image/png');
        canvasA.width = 1;
        canvasA.height = 1;
      }

      status = 'removed';
      similarity = 0;
      hasVisualDiff = true;
      hasTextDiff = true;
      removedCount++;
    }
    // 3. Both pages exist: compare text and pixels
    else {
      pageA = await pdfA.getPage(pageNum);
      pageB = await pdfB.getPage(pageNum);

      // Text comparison
      const [textContentA, textContentB] = await Promise.all([
        pageA.getTextContent(),
        pageB.getTextContent()
      ]);
      textA = reconstructPageText(textContentA.items);
      textB = reconstructPageText(textContentB.items);

      const textDiff = compareTextStrings(textA, textB);
      hasTextDiff = !textDiff.isIdentical;
      if (hasTextDiff) textDifferentCount++;

      // Visual pixel comparison (if in browser DOM)
      if (typeof document !== 'undefined') {
        const viewportA = pageA.getViewport({ scale: renderScale });
        const viewportB = pageB.getViewport({ scale: renderScale });

        const maxW = Math.max(Math.floor(viewportA.width), Math.floor(viewportB.width));
        const maxH = Math.max(Math.floor(viewportA.height), Math.floor(viewportB.height));

        const canvasA = document.createElement('canvas');
        canvasA.width = maxW;
        canvasA.height = maxH;
        const ctxA = canvasA.getContext('2d');
        ctxA.fillStyle = '#FFFFFF';
        ctxA.fillRect(0, 0, maxW, maxH);
        await pageA.render({ canvasContext: ctxA, viewport: viewportA }).promise;

        const canvasB = document.createElement('canvas');
        canvasB.width = maxW;
        canvasB.height = maxH;
        const ctxB = canvasB.getContext('2d');
        ctxB.fillStyle = '#FFFFFF';
        ctxB.fillRect(0, 0, maxW, maxH);
        await pageB.render({ canvasContext: ctxB, viewport: viewportB }).promise;

        previewA = canvasA.toDataURL('image/png');
        previewB = canvasB.toDataURL('image/png');

        const visualDiff = computeVisualDifference(canvasA, canvasB, maxW, maxH);
        similarity = visualDiff.similarity;
        hasVisualDiff = visualDiff.hasVisualDiff;
        diffOverlayUrl = visualDiff.diffOverlayUrl;

        // Cleanup
        canvasA.width = 1;
        canvasA.height = 1;
        canvasB.width = 1;
        canvasB.height = 1;
      } else {
        // Fallback for Node test environment
        hasVisualDiff = hasTextDiff;
        similarity = hasTextDiff ? 85 : 100;
      }

      if (hasVisualDiff) {
        status = 'visually_different';
        visuallyDifferentCount++;
      } else if (hasTextDiff) {
        status = 'text_different';
      } else {
        status = 'identical';
        identicalCount++;
      }
    }

    totalSimilarity += similarity;

    pageResults.push({
      pageIndex: i,
      pageNumber: pageNum,
      status,
      similarity,
      hasVisualDiff,
      hasTextDiff,
      textA,
      textB,
      previewA,
      previewB,
      diffOverlayUrl
    });
  }

  const overallSimilarity = maxPages > 0 ? Math.round((totalSimilarity / maxPages) * 10) / 10 : 100;

  return {
    totalPagesA,
    totalPagesB,
    maxPages,
    pagesDiff: totalPagesB - totalPagesA,
    pages: pageResults,
    summary: {
      identicalPages: identicalCount,
      visuallyDifferentPages: visuallyDifferentCount,
      textDifferentPages: textDifferentCount,
      addedPages: addedCount,
      removedPages: removedCount,
      overallSimilarity
    }
  };
}

