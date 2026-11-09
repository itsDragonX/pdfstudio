import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { analyzePdfForWord, convertPdfToWord } from './src/features/convert/services/pdfToWordService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createRichTestPdf() {
  const doc = await PDFDocument.create();
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  // PAGE 1: Standard A4 with Title, H2, Paragraphs, Lists, and Unicode/Symbols
  const page1 = doc.addPage([595.28, 841.89]);
  let y = 800;

  // Title / Heading 1
  page1.drawText('Quarterly Engineering Report 2026', {
    x: 50,
    y: y,
    size: 20,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.2)
  });
  y -= 35;

  // Heading 2
  page1.drawText('Executive Summary', {
    x: 50,
    y: y,
    size: 14,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.4)
  });
  y -= 25;

  // Paragraph 1
  page1.drawText('This document describes the modern architecture of the PDF Studio client application.', {
    x: 50,
    y: y,
    size: 11,
    font: fontRegular,
    color: rgb(0, 0, 0)
  });
  y -= 16;
  page1.drawText('It operates entirely offline in modern browsers without external dependencies or cloud conversion.', {
    x: 50,
    y: y,
    size: 11,
    font: fontRegular,
    color: rgb(0, 0, 0)
  });
  y -= 28;

  // Heading 3
  page1.drawText('Core Architectural Objectives', {
    x: 50,
    y: y,
    size: 12,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2)
  });
  y -= 22;

  // Bullet Lists
  const bullets = [
    '• Client-side PDF parsing using PDF.js text matrix extraction',
    '• High-performance vector stamping, editing and form filling',
    '• Pure client-side DOCX serialization via docx package'
  ];
  for (const b of bullets) {
    page1.drawText(b, {
      x: 50,
      y: y,
      size: 11,
      font: fontRegular,
      color: rgb(0.1, 0.1, 0.1)
    });
    y -= 18;
  }
  y -= 10;

  // Numbered Lists
  const numbered = [
    '1. Extraction of glyph metrics and baseline coordinates',
    '2. Reading order clustering and multi-column sorting',
    '3. Structural paragraph and heading reconstruction'
  ];
  for (const n of numbered) {
    page1.drawText(n, {
      x: 50,
      y: y,
      size: 11,
      font: fontRegular,
      color: rgb(0.1, 0.1, 0.1)
    });
    y -= 18;
  }
  y -= 15;

  // Unicode text line
  page1.drawText('Unicode preservation check: Cafe Munich, Uber-cool, 2026 Studio Inc.', {
    x: 50,
    y: y,
    size: 10,
    font: fontItalic,
    color: rgb(0.3, 0.3, 0.3)
  });

  // PAGE 2: Landscape Page with Tables and Multi-Column Layout
  const page2 = doc.addPage([841.89, 595.28]); // Landscape
  y = 540;

  page2.drawText('Performance Benchmarks & Two-Column Notes', {
    x: 50,
    y: y,
    size: 18,
    font: fontBold,
    color: rgb(0, 0, 0)
  });
  y -= 35;

  // Tabular structured data lines
  page2.drawText('Module Name              Throughput        P99 Latency', {
    x: 50,
    y: y,
    size: 11,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2)
  });
  y -= 18;
  page2.drawText('PDF Renderer             120 pages/sec     8.2 ms', {
    x: 50,
    y: y,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3)
  });
  y -= 16;
  page2.drawText('DOCX Generator           45 docs/sec       14.5 ms', {
    x: 50,
    y: y,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3)
  });
  y -= 16;
  page2.drawText('Zip Archiver             350 files/sec     2.1 ms', {
    x: 50,
    y: y,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3)
  });
  y -= 35;

  // Two columns
  // Column 1 (Left: X=50)
  page2.drawText('Left Column: Architecture', { x: 50, y: y, size: 12, font: fontBold });
  page2.drawText('The client utilizes Web Workers for CPU-heavy parsing.', { x: 50, y: y - 18, size: 10, font: fontRegular });
  page2.drawText('Rendering is isolated from the React state update loop.', { x: 50, y: y - 34, size: 10, font: fontRegular });

  // Column 2 (Right: X=450)
  page2.drawText('Right Column: Privacy & Security', { x: 450, y: y, size: 12, font: fontBold });
  page2.drawText('Zero bytes of document data leave the local browser environment.', { x: 450, y: y - 18, size: 10, font: fontRegular });
  page2.drawText('Documents survive refresh through client-side IndexedDB cache.', { x: 450, y: y - 34, size: 10, font: fontRegular });

  // PAGE 3: Empty / Scanned Page (Image simulation, 0 text items)
  const page3 = doc.addPage([595.28, 841.89]);
  // Draw only vector shapes and graphics, NO text
  page3.drawRectangle({
    x: 50,
    y: 200,
    width: 495,
    height: 440,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 2,
    color: rgb(0.95, 0.95, 0.95)
  });

  return await doc.save();
}

async function runTests() {
  console.log('=== PDF STUDIO: ADDITIONAL CONVERT TOOL — PDF TO WORD (.DOCX) TEST RUNNER ===\n');

  const pdfBytes = await createRichTestPdf();
  console.log(`Generated synthetic test PDF: ${pdfBytes.length} bytes (3 pages: 1 portrait, 1 landscape, 1 scanned).\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${message}`);
      failed++;
    }
  }

  // --- TEST 1: Analysis Engine ---
  console.log('--- 1. Testing Document Structure Analysis ---');
  const analysis = await analyzePdfForWord(pdfBytes, { pageTarget: 'all' });

  assert(analysis.totalPages === 3, 'Analysis accurately detected 3 pages');
  assert(analysis.summary.headingsCount >= 3, `Detected ${analysis.summary.headingsCount} headings (expected >= 3)`);
  assert(analysis.summary.listsCount >= 4, `Detected ${analysis.summary.listsCount} list items (expected >= 4)`);
  assert(analysis.summary.paragraphsCount >= 4, `Detected ${analysis.summary.paragraphsCount} paragraphs (expected >= 4)`);
  assert(analysis.summary.scannedPages.includes(3), 'Page 3 correctly flagged as scanned / image-only (minimal selectable text)');
  assert(!analysis.summary.scannedPages.includes(1), 'Page 1 correctly identified as selectable text');
  assert(analysis.summary.totalWords > 80, `Extracted ${analysis.summary.totalWords} words across document`);

  // --- TEST 2: Full Document Conversion to DOCX ---
  console.log('\n--- 2. Testing Full Document DOCX Conversion ---');
  const result = await convertPdfToWord(pdfBytes, {
    pageTarget: 'all',
    baseFilename: 'Quarterly-Engineering-Report.pdf'
  });

  assert(result.filename === 'Quarterly-Engineering-Report_converted.docx', `Filename is formatted as expected: ${result.filename}`);
  assert(result.bytes instanceof Uint8Array && result.bytes.length > 5000, `Generated valid DOCX buffer of ${result.bytes.length} bytes`);

  // --- TEST 3: DOCX XML Verification & Structural Integrity ---
  console.log('\n--- 3. Verifying DOCX Internal XML Structure via JSZip ---');
  const zip = await JSZip.loadAsync(result.bytes);
  assert(zip.file('word/document.xml') !== null, 'DOCX package contains word/document.xml');
  assert(zip.file('[Content_Types].xml') !== null, 'DOCX package contains [Content_Types].xml');
  assert(zip.file('word/_rels/document.xml.rels') !== null, 'DOCX package contains document relationships');

  const docXml = await zip.file('word/document.xml').async('text');

  assert(docXml.includes('Quarterly Engineering Report 2026'), 'Document XML contains Title / Heading 1 text');
  assert(docXml.includes('Executive Summary'), 'Document XML contains Heading 2 text');
  assert(docXml.includes('PDF Studio client application'), 'Document XML contains body paragraph content');
  assert(docXml.includes('Client-side PDF parsing using PDF.js'), 'Document XML contains bullet list items');
  assert(docXml.includes('Extraction of glyph metrics and baseline coordinates'), 'Document XML contains numbered list items');
  assert(docXml.includes('Performance Benchmarks'), 'Document XML contains Page 2 content');
  assert(docXml.includes('w:type="page"'), 'Document XML contains page breaks between document pages');
  assert(docXml.includes('scanned images rather than selectable text'), 'Document XML contains honest scanned page notice for Page 3');
  assert(docXml.includes('w:b'), 'Document XML contains bold run styling tags (<w:b/>)');

  // --- TEST 4: Page Range Selection ---
  console.log('\n--- 4. Testing Page Range Targeting ---');
  const rangeResult = await convertPdfToWord(pdfBytes, {
    pageTarget: 'range',
    rangeString: '1, 2',
    baseFilename: 'Report-Pages-1-2.pdf'
  });

  const rangeZip = await JSZip.loadAsync(rangeResult.bytes);
  const rangeXml = await rangeZip.file('word/document.xml').async('text');
  assert(rangeXml.includes('Quarterly Engineering Report 2026'), 'Range document contains Page 1');
  assert(rangeXml.includes('Performance Benchmarks'), 'Range document contains Page 2');
  assert(!rangeXml.includes('scanned images rather than selectable text'), 'Page 3 correctly excluded from range conversion');

  // --- TEST 5: Scanned Page Rejection Safety ---
  console.log('\n--- 5. Testing Scanned Document Error Handling ---');
  let scannedErrorCaught = false;
  try {
    await convertPdfToWord(pdfBytes, {
      pageTarget: 'range',
      rangeString: '3' // Target only the scanned page
    });
  } catch (err) {
    scannedErrorCaught = true;
    assert(err.message.includes('scanned images rather than selectable text'), `Error message honestly alerts user: "${err.message}"`);
  }
  assert(scannedErrorCaught, 'Attempting to convert 100% scanned selection safely throws helpful error rather than generating an empty document');

  // --- TEST 6: Single Page Conversion ---
  console.log('\n--- 6. Testing Single Page Conversion ---');
  const singleResult = await convertPdfToWord(pdfBytes, {
    pageTarget: 'current',
    currentPageIndex: 0,
    baseFilename: 'Cover.pdf'
  });
  const singleZip = await JSZip.loadAsync(singleResult.bytes);
  const singleXml = await singleZip.file('word/document.xml').async('text');
  assert(singleXml.includes('Quarterly Engineering Report 2026'), 'Single page conversion contains Page 1 content');
  assert(!singleXml.includes('w:type="page"'), 'Single page document contains no unnecessary page breaks');

  console.log('\n======================================================');
  console.log(`ALL PDF TO WORD TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner failure:', err);
  process.exit(1);
});
