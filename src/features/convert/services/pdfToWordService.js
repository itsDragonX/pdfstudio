import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  PageBreak
} from 'docx';
import { normalizeToUint8Array } from '../../organise/services/pageOperations.js';
import { pdfjsLib, PDFJS_OFFLINE_CONFIG } from '../../../core/pdfjs-init.js';
import { resolveTargetPageIndices } from '../../stamp/services/targetPagesHelper.js';

/**
 * Heuristically detects whether a font name signifies bold styling.
 */
function isBoldFont(fontName = '') {
  return /bold|black|heavy|w[789]|semi-?bold/i.test(fontName);
}

/**
 * Heuristically detects whether a font name signifies italic/oblique styling.
 */
function isItalicFont(fontName = '') {
  return /italic|oblique|slanted/i.test(fontName);
}

/**
 * Detects if a text string is a list bullet or numbered list item.
 */
function detectListPrefix(text = '') {
  const trimmed = text.trim();
  // Bullet characters: •, ⁃, –, -, *, ▪, ▫, ◦
  const bulletMatch = trimmed.match(/^[•⁃–\*\-▪▫◦]\s*(.*)$/);
  if (bulletMatch) {
    return { isList: true, type: 'bullet', content: bulletMatch[1].trim() };
  }
  // Numbered or lettered lists: 1., 1), a., a), i., (1)
  const numberedMatch = trimmed.match(/^(\(?\d+[\.\)]|\(?[a-zA-Z][\.\)]|\(?[ivxIVX]+[\.\)])\s+(.*)$/);
  if (numberedMatch) {
    return { isList: true, type: 'numbered', prefix: numberedMatch[1], content: numberedMatch[2].trim() };
  }
  return { isList: false, content: text };
}

/**
 * Clusters text items on a page into natural reading lines and detects columns.
 */
function clusterPageLines(items = [], viewportWidth = 600) {
  if (!items || items.length === 0) return [];

  // Parse raw text items
  const parsed = [];
  for (const item of items) {
    if (!item.str || typeof item.str !== 'string') continue;

    const tx = item.transform ? item.transform[4] : 0;
    const ty = item.transform ? item.transform[5] : 0;
    const fontH = item.height || (item.transform ? Math.abs(item.transform[0]) : 11);
    const fontName = item.fontName || '';

    parsed.push({
      str: item.str,
      x: tx,
      y: ty,
      width: item.width || 0,
      height: fontH,
      fontSize: Math.round(fontH),
      isBold: isBoldFont(fontName),
      isItalic: isItalicFont(fontName),
      hasEOL: Boolean(item.hasEOL)
    });
  }

  if (parsed.length === 0) return [];

  // Check for multi-column layout (e.g. 2 distinct columns with central gutter)
  const midX = viewportWidth / 2;
  const leftColItems = [];
  const rightColItems = [];
  let multiColDetected = false;

  // Find X boundaries
  const xs = parsed.map(p => p.x).sort((a, b) => a - b);
  const minX = xs[0];
  const maxX = xs[xs.length - 1];

  // If page width is wide enough and text spans across center with clear left/right clustering
  if (maxX - minX > 280 && viewportWidth >= 400) {
    const leftSide = parsed.filter(p => p.x < midX - 25);
    const rightSide = parsed.filter(p => p.x > midX + 25);
    const centerSpan = parsed.filter(p => p.x >= midX - 25 && p.x <= midX + 25);

    // If both columns have significant items and center gutter is relatively clear
    if (leftSide.length > 8 && rightSide.length > 8 && centerSpan.length < (leftSide.length + rightSide.length) * 0.15) {
      multiColDetected = true;
      leftColItems.push(...leftSide);
      rightColItems.push(...rightSide);
    }
  }

  const processItemsToLines = (colItems) => {
    // Sort descending by Y (top to bottom)
    colItems.sort((a, b) => b.y - a.y);
    const lineTolerance = 3.5;
    const lines = [];

    for (const it of colItems) {
      let matched = lines.find(l => Math.abs(l.y - it.y) <= lineTolerance);
      if (matched) {
        matched.items.push(it);
        matched.y = (matched.y * (matched.items.length - 1) + it.y) / matched.items.length;
      } else {
        lines.push({
          y: it.y,
          height: it.height,
          items: [it]
        });
      }
    }

    // Sort lines top to bottom
    lines.sort((a, b) => b.y - a.y);

    // Sort items within each line left-to-right (ascending X) and group into styled runs
    const finalLines = [];
    for (const line of lines) {
      line.items.sort((a, b) => a.x - b.x);

      const runs = [];
      let fullLineText = '';

      for (let j = 0; j < line.items.length; j++) {
        const cur = line.items[j];
        if (j > 0) {
          const prev = line.items[j - 1];
          const gap = cur.x - (prev.x + prev.width);
          if (gap > 2.0 && !prev.str.endsWith(' ') && !cur.str.startsWith(' ')) {
            runs.push({ text: ' ', isBold: false, isItalic: false, fontSize: cur.fontSize });
            fullLineText += ' ';
          }
        }

        runs.push({
          text: cur.str,
          isBold: cur.isBold,
          isItalic: cur.isItalic,
          fontSize: cur.fontSize
        });
        fullLineText += cur.str;
      }

      const trimmedText = fullLineText.trim();
      if (!trimmedText) continue;

      // Calculate average font size of the line
      const totalSize = line.items.reduce((acc, it) => acc + it.fontSize, 0);
      const avgFontSize = Math.round(totalSize / line.items.length);
      const isMostlyBold = line.items.filter(it => it.isBold).length >= line.items.length * 0.6;

      finalLines.push({
        y: line.y,
        height: line.height,
        text: trimmedText,
        runs,
        fontSize: avgFontSize,
        isBold: isMostlyBold
      });
    }

    return finalLines;
  };

  if (multiColDetected) {
    const leftLines = processItemsToLines(leftColItems);
    const rightLines = processItemsToLines(rightColItems);
    return [...leftLines, ...rightLines];
  }

  return processItemsToLines(parsed);
}

/**
 * Analyzes pages of a PDF document for Word (.docx) conversion.
 * 
 * @param {Uint8Array | ArrayBuffer | Blob | File} pdfInput
 * @param {object} options
 * @returns {Promise<{
 *   totalPages: number,
 *   selectedPagesCount: number,
 *   pages: Array<{ pageNumber: number, elements: Array<any>, isScanned: boolean, charCount: number, text: string }>,
 *   summary: { totalWords: number, totalChars: number, headingsCount: number, paragraphsCount: number, listsCount: number, scannedPages: number[] }
 * }>}
 */
export async function analyzePdfForWord(pdfInput, options = {}) {
  const { onProgress } = options;
  const rawBytes = await normalizeToUint8Array(pdfInput, 'PDF to Word Analysis');

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
    throw new Error('No target pages selected for conversion.');
  }

  const analyzedPages = [];
  const allFontSizes = [];

  // Pass 1: Extract text items and viewport dimensions for target pages
  for (let i = 0; i < targetIndices.length; i++) {
    const pageIdx = targetIndices[i];
    const pageNum = pageIdx + 1;

    if (onProgress) {
      onProgress(i + 1, targetIndices.length, `Analyzing page ${pageNum} (${i + 1} of ${targetIndices.length})...`);
    }

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent({ includeMarkedContent: true });

    const rawLines = clusterPageLines(textContent.items, viewport.width);
    const pageText = rawLines.map(l => l.text).join('\n');
    const charCount = pageText.replace(/\s/g, '').length;

    // Detect if page contains minimal selectable text (likely scanned)
    const isScanned = charCount < 15 || rawLines.length === 0;

    for (const line of rawLines) {
      allFontSizes.push(line.fontSize);
    }

    analyzedPages.push({
      pageNumber: pageNum,
      width: viewport.width,
      height: viewport.height,
      rawLines,
      isScanned,
      charCount,
      text: pageText
    });
  }

  // Calculate median body font size across document
  allFontSizes.sort((a, b) => a - b);
  const medianBodySize = allFontSizes.length > 0
    ? allFontSizes[Math.floor(allFontSizes.length / 2)]
    : 11;

  let totalWords = 0;
  let totalChars = 0;
  let headingsCount = 0;
  let paragraphsCount = 0;
  let listsCount = 0;
  const scannedPages = [];

  // Pass 2: Structure Classification (Headings, Paragraphs, Lists)
  for (const page of analyzedPages) {
    if (page.isScanned) {
      scannedPages.push(page.pageNumber);
    }

    totalChars += page.charCount;
    totalWords += page.text.split(/\s+/).filter(Boolean).length;

    const elements = [];
    const lines = page.rawLines;

    let currentParaRuns = [];
    let prevLineY = null;
    let avgLineH = 12;

    const flushParagraph = () => {
      if (currentParaRuns.length > 0) {
        elements.push({
          type: 'paragraph',
          runs: currentParaRuns
        });
        paragraphsCount++;
        currentParaRuns = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check Heading 1: significantly larger font or title
      if (line.fontSize >= Math.max(16, medianBodySize * 1.5) && line.text.length < 120) {
        flushParagraph();
        elements.push({
          type: 'heading-1',
          text: line.text,
          runs: line.runs
        });
        headingsCount++;
        prevLineY = null;
        continue;
      }

      // Check Heading 2: noticeably larger font or bold section header
      if (line.fontSize >= Math.max(13, medianBodySize * 1.25) && line.text.length < 120) {
        flushParagraph();
        elements.push({
          type: 'heading-2',
          text: line.text,
          runs: line.runs
        });
        headingsCount++;
        prevLineY = null;
        continue;
      }

      // Check Heading 3: bold header with standard or slightly larger font
      if (line.isBold && line.fontSize >= medianBodySize && line.text.length < 90 && !line.text.endsWith('.')) {
        flushParagraph();
        elements.push({
          type: 'heading-3',
          text: line.text,
          runs: line.runs
        });
        headingsCount++;
        prevLineY = null;
        continue;
      }

      // Check List Item
      const listInfo = detectListPrefix(line.text);
      if (listInfo.isList) {
        flushParagraph();
        elements.push({
          type: 'list-item',
          listType: listInfo.type,
          prefix: listInfo.prefix,
          content: listInfo.content,
          runs: line.runs
        });
        listsCount++;
        prevLineY = null;
        continue;
      }

      // Regular Paragraph Flow
      if (prevLineY !== null) {
        const lineGap = prevLineY - line.y;
        // Large gap between lines indicates a new paragraph
        if (lineGap > (line.height || avgLineH) * 1.65) {
          flushParagraph();
        } else {
          // Continuous paragraph: insert inter-line space
          currentParaRuns.push({ text: ' ', isBold: false, isItalic: false, fontSize: line.fontSize });
        }
      }

      currentParaRuns.push(...line.runs);
      prevLineY = line.y;
      avgLineH = line.height || avgLineH;
    }

    flushParagraph();
    page.elements = elements;
  }

  return {
    totalPages,
    selectedPagesCount: targetIndices.length,
    medianBodySize,
    pages: analyzedPages,
    summary: {
      totalWords,
      totalChars,
      headingsCount,
      paragraphsCount,
      listsCount,
      scannedPages
    }
  };
}

/**
 * Converts a PDF document into an editable Microsoft Word (.docx) document.
 * 
 * @param {Uint8Array | ArrayBuffer | Blob | File} pdfInput
 * @param {object} options
 * @returns {Promise<{
 *   blob: Blob,
 *   bytes: Uint8Array,
 *   filename: string,
 *   summary: object
 * }>}
 */
export async function convertPdfToWord(pdfInput, options = {}) {
  const {
    baseFilename = 'document',
    onProgress
  } = options;

  // Run analysis if not already pre-analyzed
  const analysis = options.precomputedAnalysis || await analyzePdfForWord(pdfInput, {
    ...options,
    onProgress: (cur, tot, msg) => {
      if (onProgress) onProgress(cur, tot * 2, msg);
    }
  });

  if (analysis.pages.length === 0) {
    throw new Error('No valid pages found to convert.');
  }

  // If ALL pages are scanned/empty, surface clear warning
  if (analysis.summary.scannedPages.length === analysis.pages.length) {
    throw new Error('This document appears to contain scanned images rather than selectable text. OCR is not currently available in PDF Studio.');
  }

  if (onProgress) {
    onProgress(analysis.pages.length + 1, analysis.pages.length * 2, 'Generating Word (.docx) document structure...');
  }

  const docxChildren = [];

  // Standard margins: 1 inch = 1440 twips
  const standardMargin = {
    top: 1440,
    bottom: 1440,
    left: 1440,
    right: 1440
  };

  for (let pIdx = 0; pIdx < analysis.pages.length; pIdx++) {
    const page = analysis.pages[pIdx];

    // Page Break between pages (starting from page 2)
    if (pIdx > 0) {
      docxChildren.push(
        new Paragraph({
          children: [new PageBreak()]
        })
      );
    }

    // If page is scanned/empty, add informative placeholder
    if (page.isScanned) {
      docxChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `[Page ${page.pageNumber}: This page appears to contain scanned images rather than selectable text. OCR is not currently available in PDF Studio.]`,
              italics: true,
              color: '888888',
              size: 20 // 10pt
            })
          ],
          spacing: { after: 200 }
        })
      );
      continue;
    }

    // Process elements
    for (const elem of page.elements) {
      switch (elem.type) {
        case 'heading-1':
          docxChildren.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: elem.runs.map(r => new TextRun({
                text: r.text,
                bold: true,
                size: Math.max(32, Math.round((r.fontSize || 18) * 2)) // >= 16pt
              })),
              spacing: { before: 240, after: 120 }
            })
          );
          break;

        case 'heading-2':
          docxChildren.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: elem.runs.map(r => new TextRun({
                text: r.text,
                bold: true,
                size: Math.max(26, Math.round((r.fontSize || 14) * 2)) // >= 13pt
              })),
              spacing: { before: 200, after: 100 }
            })
          );
          break;

        case 'heading-3':
          docxChildren.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_3,
              children: elem.runs.map(r => new TextRun({
                text: r.text,
                bold: true,
                size: Math.max(22, Math.round((r.fontSize || 12) * 2))
              })),
              spacing: { before: 160, after: 80 }
            })
          );
          break;

        case 'list-item':
          docxChildren.push(
            new Paragraph({
              bullet: { level: 0 },
              children: elem.runs.map(r => new TextRun({
                text: r.text,
                bold: r.isBold,
                italics: r.isItalic,
                size: Math.round((r.fontSize || analysis.medianBodySize || 11) * 2)
              })),
              spacing: { after: 80 }
            })
          );
          break;

        case 'paragraph':
        default:
          docxChildren.push(
            new Paragraph({
              children: elem.runs.map(r => new TextRun({
                text: r.text,
                bold: r.isBold,
                italics: r.isItalic,
                size: Math.round((r.fontSize || analysis.medianBodySize || 11) * 2)
              })),
              spacing: { after: 140, line: 276 } // 1.15 line height
            })
          );
          break;
      }
    }
  }

  // Create docx Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: standardMargin
          }
        },
        children: docxChildren
      }
    ]
  });

  if (onProgress) {
    onProgress(analysis.pages.length * 2, analysis.pages.length * 2, 'Packaging DOCX file...');
  }

  // Generate output bytes & blob
  let bytes;
  let blob = null;

  if (typeof Packer.toBlob === 'function') {
    try {
      blob = await Packer.toBlob(doc);
      bytes = new Uint8Array(await blob.arrayBuffer());
    } catch {
      // Fallback to toBuffer if in Node or browser without toBlob
      const buf = await Packer.toBuffer(doc);
      bytes = new Uint8Array(buf);
      if (typeof Blob !== 'undefined') {
        blob = new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
      }
    }
  } else {
    const buf = await Packer.toBuffer(doc);
    bytes = new Uint8Array(buf);
    if (typeof Blob !== 'undefined') {
      blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
    }
  }

  const cleanBase = baseFilename.replace(/\.pdf$/i, '');
  const filename = `${cleanBase}_converted.docx`;

  return {
    blob,
    bytes,
    filename,
    summary: analysis.summary
  };
}

