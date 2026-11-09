import { normalizeToUint8Array } from '../../organise/services/pageOperations.js';
import { pdfjsLib, PDFJS_OFFLINE_CONFIG } from '../../../core/pdfjs-init.js';
import { resolveTargetPageIndices } from '../../stamp/services/targetPagesHelper.js';

/**
 * Reconstructs natural reading lines from unordered PDF.js text items.
 * Uses baseline clustering, horizontal sorting, and spacing heuristics.
 * 
 * @param {Array<{ str: string, transform: number[], width: number, height: number }>} items
 * @returns {string} Reconstructed text for the page
 */
export function reconstructPageText(items = []) {
  if (!items || items.length === 0) return '';

  // Extract spatial coordinates for each text item
  const parsedItems = [];
  for (const item of items) {
    if (!item.str || typeof item.str !== 'string') continue;

    // transform is [scaleX, skewY, skewX, scaleY, tx, ty]
    // tx = x position from left, ty = y position from bottom
    const tx = item.transform ? item.transform[4] : 0;
    const ty = item.transform ? item.transform[5] : 0;
    const fontH = item.height || (item.transform ? Math.abs(item.transform[0]) : 10);

    parsedItems.push({
      str: item.str,
      x: tx,
      y: ty,
      width: item.width || 0,
      height: fontH
    });
  }

  if (parsedItems.length === 0) return '';

  // Group items into horizontal lines based on baseline Y proximity (tolerance ~4 points)
  const lineTolerance = 4.0;
  const lines = [];

  // Sort initially by Y descending (top to bottom)
  parsedItems.sort((a, b) => b.y - a.y);

  for (const item of parsedItems) {
    let matchedLine = lines.find((line) => Math.abs(line.y - item.y) <= lineTolerance);

    if (matchedLine) {
      matchedLine.items.push(item);
      // Update average line Y
      matchedLine.y = (matchedLine.y * (matchedLine.items.length - 1) + item.y) / matchedLine.items.length;
    } else {
      lines.push({
        y: item.y,
        height: item.height,
        items: [item]
      });
    }
  }

  // Sort lines top-to-bottom (descending Y in PDF coordinates)
  lines.sort((a, b) => b.y - a.y);

  // Within each line, sort items left-to-right (ascending X) and join words
  const resultParagraphs = [];
  let currentParagraph = [];
  let prevLineY = null;
  let avgLineHeight = 12;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    line.items.sort((a, b) => a.x - b.x);

    let lineText = '';
    for (let j = 0; j < line.items.length; j++) {
      const cur = line.items[j];
      if (j > 0) {
        const prev = line.items[j - 1];
        const gap = cur.x - (prev.x + prev.width);
        // If there is a visible gap and neither has spacing, insert space
        if (gap > 2.0 && !prev.str.endsWith(' ') && !cur.str.startsWith(' ')) {
          lineText += ' ';
        }
      }
      lineText += cur.str;
    }

    const trimmed = lineText.trim();
    if (!trimmed) continue;

    // Detect paragraph breaks based on vertical spacing between lines
    if (prevLineY !== null) {
      const lineGap = prevLineY - line.y;
      if (lineGap > (line.height || avgLineHeight) * 1.6) {
        // New paragraph detected
        if (currentParagraph.length > 0) {
          resultParagraphs.push(currentParagraph.join('\n'));
          currentParagraph = [];
        }
      }
    }

    currentParagraph.push(trimmed);
    prevLineY = line.y;
    avgLineHeight = line.height || avgLineHeight;
  }

  if (currentParagraph.length > 0) {
    resultParagraphs.push(currentParagraph.join('\n'));
  }

  return resultParagraphs.join('\n\n');
}

/**
 * Extracts structured text from selected pages of a PDF document.
 * 
 * @param {Uint8Array | ArrayBuffer | Blob | File} pdfInput - Source PDF bytes
 * @param {object} options
 * @param {'all' | 'current' | 'selected' | 'range'} [options.pageTarget='all']
 * @param {number} [options.currentPageIndex=0]
 * @param {number[]} [options.selectedPageIndices=[]]
 * @param {string} [options.rangeString='']
 * @param {boolean} [options.includePageHeaders=true] - Include "=== PAGE X ===" in combined output
 * @param {(current: number, total: number, message: string) => void} [options.onProgress]
 * @returns {Promise<{ fullText: string, pages: Array<{ pageNumber: number, text: string, charCount: number, isEmpty: boolean }>, totalChars: number, totalWords: number, isScannedOrEmpty: boolean }>}
 */
export async function extractPdfToText(pdfInput, options = {}) {
  const {
    includePageHeaders = true,
    onProgress
  } = options;

  const rawBytes = await normalizeToUint8Array(pdfInput, 'PDF to Text');

  const loadingTask = pdfjsLib.getDocument({
    data: rawBytes.slice(0),
    ...PDFJS_OFFLINE_CONFIG
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  if (totalPages === 0) {
    throw new Error('PDF document contains no pages.');
  }

  const targetIndices = resolveTargetPageIndices(options, totalPages);
  if (targetIndices.length === 0) {
    throw new Error('No target pages selected for text extraction.');
  }

  const pagesResult = [];
  let combinedParts = [];
  let totalChars = 0;

  for (let i = 0; i < targetIndices.length; i++) {
    const pageIdx = targetIndices[i];
    const pageNumber = pageIdx + 1;

    if (onProgress) {
      onProgress(i + 1, targetIndices.length, `Extracting text from page ${pageNumber} (${i + 1} of ${targetIndices.length})...`);
    }

    const page = await pdfDoc.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = reconstructPageText(textContent.items);

    const cleanLength = pageText.replace(/\s+/g, '').length;
    const isEmpty = cleanLength === 0;

    totalChars += cleanLength;

    pagesResult.push({
      pageNumber,
      text: pageText,
      charCount: pageText.length,
      isEmpty
    });

    if (includePageHeaders) {
      const header = `====================\nPAGE ${pageNumber}\n====================\n`;
      combinedParts.push(header + (isEmpty ? '[No selectable text on this page]\n' : pageText + '\n'));
    } else {
      if (!isEmpty) {
        combinedParts.push(pageText);
      }
    }
  }

  const fullText = combinedParts.join('\n');
  const totalWords = fullText.split(/\s+/).filter(Boolean).length;

  // Scanned or empty detection: if average characters per page is less than 15
  const avgChars = targetIndices.length > 0 ? totalChars / targetIndices.length : 0;
  const isScannedOrEmpty = avgChars < 15;

  return {
    fullText,
    pages: pagesResult,
    totalChars,
    totalWords,
    isScannedOrEmpty
  };
}

