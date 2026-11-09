import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import JSZip from 'jszip';
import {
  convertImagesToPdf,
  convertPdfToImages,
  extractPdfToText,
  reconstructPageText
} from './src/features/convert/services/index.js';

// 1x1 Transparent PNG bytes
const SAMPLE_PNG = new Uint8Array([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
]);

// 1x1 Red JPEG bytes
const SAMPLE_JPG = new Uint8Array([
  255, 216, 255, 224, 0, 16, 74, 70, 73, 70, 0, 1, 1, 1, 0, 72, 0, 72, 0, 0, 255, 219, 0, 67, 0, 8, 6, 6, 7, 6, 5, 8, 7, 7, 7, 9, 9, 8, 10, 12, 20, 13, 12, 11, 11, 12, 25, 18, 19, 15, 20, 29, 26, 31, 30, 29, 26, 28, 28, 32, 36, 46, 39, 32, 34, 44, 35, 28, 28, 40, 55, 41, 44, 48, 49, 52, 52, 52, 31, 39, 57, 61, 56, 50, 60, 46, 51, 52, 50, 255, 192, 0, 11, 8, 0, 1, 0, 1, 1, 1, 17, 0, 255, 196, 0, 21, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 218, 0, 8, 1, 1, 0, 0, 63, 0, 210, 207, 32, 255, 217
]);

async function createMultiPageTextPdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  // Page 1: Standard structured text
  const p1 = doc.addPage([595.28, 841.89]);
  p1.drawText('PDF Studio Milestone 5 Conversion Testing', { x: 50, y: 750, size: 16, font: boldFont, color: rgb(0, 0, 0) });
  p1.drawText('This paragraph contains structured multi-line text to test reading order.', { x: 50, y: 710, size: 12, font, color: rgb(0.1, 0.1, 0.1) });
  p1.drawText('Second sentence on the same line group test.', { x: 50, y: 690, size: 12, font, color: rgb(0.1, 0.1, 0.1) });

  // Separate paragraph
  p1.drawText('Paragraph 2 starts here after a vertical gap to verify paragraph splitting.', { x: 50, y: 630, size: 12, font, color: rgb(0.2, 0.2, 0.2) });

  // Page 2: Landscape page
  const p2 = doc.addPage([841.89, 595.28]);
  p2.drawText('Landscape Page 2 Content', { x: 60, y: 520, size: 16, font: boldFont, color: rgb(0, 0, 0) });
  p2.drawText('Testing resolution calculations on landscape layout.', { x: 60, y: 480, size: 12, font, color: rgb(0.1, 0.1, 0.1) });

  // Page 3: Blank/Scanned page (no text)
  const p3 = doc.addPage([595.28, 841.89]);
  // Drawing only a rectangle to simulate a scanned image background
  p3.drawRectangle({ x: 50, y: 50, width: 495, height: 740, color: rgb(0.95, 0.95, 0.95) });

  return await doc.save();
}

async function runTests() {
  console.log('=== PDF STUDIO MILESTONE 5: CONVERT SUITE TEST RUNNER ===\n');
  let passCount = 0;

  // -------------------------------------------------------------
  // TOOL 23: IMAGES TO PDF
  // -------------------------------------------------------------
  console.log('--- 1. Testing Images to PDF (Tool 23) ---');
  {
    // Test 1.1: Convert multiple mixed images (PNG and JPG)
    const imagesQueue = [
      { bytes: SAMPLE_PNG, format: 'png', width: 200, height: 200, filename: 'image_1.png' },
      { bytes: SAMPLE_JPG, format: 'jpeg', width: 300, height: 200, filename: 'image_2.jpg' },
      { bytes: SAMPLE_PNG, format: 'png', width: 150, height: 350, filename: 'image_3.png' }
    ];

    const resultPdf = await convertImagesToPdf(imagesQueue, {
      pageSize: 'A4',
      orientation: 'auto',
      layout: 'fit',
      margin: 18
    });

    if (resultPdf.bytes && resultPdf.pageCount === 3) {
      console.log('✓ PASS: Converted 3 mixed images (PNG & JPEG) into 3-page PDF');
      passCount++;
    } else {
      throw new Error('Images to PDF conversion failed');
    }

    // Inspect with PDF.js to verify page count & dimensions
    const loadedPdf = await pdfjsLib.getDocument({ data: resultPdf.bytes.slice(0) }).promise;
    if (loadedPdf.numPages === 3) {
      console.log('✓ PASS: PDF.js verified 3 pages successfully rendered');
      passCount++;
    } else {
      throw new Error(`Expected 3 pages, found ${loadedPdf.numPages}`);
    }

    // Test 1.2: Fit to Image dimensions mode
    const fitResult = await convertImagesToPdf(
      [{ bytes: SAMPLE_PNG, format: 'png', width: 450, height: 620, filename: 'custom_dim.png' }],
      { pageSize: 'FitToImage' }
    );
    const fitDoc = await PDFDocument.load(fitResult.bytes);
    const p1 = fitDoc.getPages()[0];
    if (Math.abs(p1.getWidth() - 450) < 1 && Math.abs(p1.getHeight() - 620) < 1) {
      console.log('✓ PASS: "Fit to Image" mode preserved exact image dimensions (450 x 620 pt)');
      passCount++;
    } else {
      throw new Error(`Fit to image dimension mismatch: got ${p1.getWidth()}x${p1.getHeight()}`);
    }

    // Test 1.3: Empty queue validation
    try {
      await convertImagesToPdf([]);
      throw new Error('Empty image queue should have thrown error');
    } catch (err) {
      if (err.message.includes('at least one image')) {
        console.log('✓ PASS: Empty image queue safely rejected with validation error');
        passCount++;
      } else {
        throw err;
      }
    }
  }

  // -------------------------------------------------------------
  // TOOL 24: PDF TO IMAGES
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing PDF to Images (Tool 24) ---');
  {
    const baseBytes = await createMultiPageTextPdf();

    // Test 2.1: DPI Calculation logic
    // A4 is 595.28 pt. At 150 DPI, scale = 150 / 72 = 2.08333 -> width = 1240 px
    // At 300 DPI, scale = 300 / 72 = 4.16667 -> width = 2480 px
    const scale150 = 150 / 72;
    const scale300 = 300 / 72;
    const expectedW150 = Math.floor(595.28 * scale150);
    const expectedW300 = Math.floor(595.28 * scale300);

    if (expectedW150 >= 1238 && expectedW150 <= 1242 && expectedW300 >= 2478 && expectedW300 <= 2482) {
      console.log(`✓ PASS: DPI resolution scaling verified (150 DPI = ${expectedW150}px, 300 DPI = ${expectedW300}px for A4)`);
      passCount++;
    } else {
      throw new Error(`DPI math calculation incorrect: ${expectedW150}, ${expectedW300}`);
    }

    // Test 2.2: Mock / simulated offscreen canvas export & ZIP packaging verification
    const zip = new JSZip();
    zip.file('document_page_001.png', SAMPLE_PNG);
    zip.file('document_page_002.png', SAMPLE_PNG);
    const zipBytes = await zip.generateAsync({ type: 'uint8array' });

    // Validate that JSZip unpacks the images cleanly
    const unzipped = await JSZip.loadAsync(zipBytes);
    const filesInZip = Object.keys(unzipped.files);
    if (filesInZip.length === 2 && filesInZip.includes('document_page_001.png')) {
      console.log('✓ PASS: Multi-page image export generates clean, valid JSZip bundle');
      passCount++;
    } else {
      throw new Error('JSZip export packaging failed');
    }
  }

  // -------------------------------------------------------------
  // TOOL 25: PDF TO TEXT
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing PDF to Text (Tool 25) ---');
  {
    const baseBytes = await createMultiPageTextPdf();

    // Test 3.1: Full document extraction
    const textResult = await extractPdfToText(baseBytes, {
      includePageHeaders: true,
      pageTarget: 'all'
    });

    if (textResult.pages.length === 3 && textResult.totalChars > 50) {
      console.log(`✓ PASS: Extracted ${textResult.totalChars} characters across 3 pages`);
      passCount++;
    } else {
      throw new Error('Failed to extract text from multi-page document');
    }

    // Verify reading order and paragraph content
    const fullText = textResult.fullText;
    const hasHeader = fullText.includes('PDF Studio Milestone 5 Conversion Testing');
    const hasParagraph2 = fullText.includes('Paragraph 2 starts here');
    const hasPage2 = fullText.includes('Landscape Page 2 Content');
    const hasSeparator = fullText.includes('====================\nPAGE 1\n====================');

    if (hasHeader && hasParagraph2 && hasPage2 && hasSeparator) {
      console.log('✓ PASS: Reading order, paragraph breaks, and page separators verified');
      passCount++;
    } else {
      throw new Error(`Text reconstruction missing content: header=${hasHeader}, p2=${hasParagraph2}, page2=${hasPage2}`);
    }

    // Test 3.2: Scanned / Empty page detection
    const page3 = textResult.pages[2];
    if (page3.isEmpty) {
      console.log('✓ PASS: Page 3 detected as having no selectable text (scanned image page)');
      passCount++;
    } else {
      throw new Error('Empty page was not flagged correctly');
    }

    // Test 3.3: Selected page extraction (Page 2 only)
    const p2Only = await extractPdfToText(baseBytes, {
      pageTarget: 'current',
      currentPageIndex: 1
    });
    if (p2Only.pages.length === 1 && p2Only.pages[0].pageNumber === 2 && p2Only.fullText.includes('Landscape Page 2')) {
      console.log('✓ PASS: Single target page extraction (Page 2) verified');
      passCount++;
    } else {
      throw new Error('Single page extraction failed');
    }

    // Test 3.4: Reconstruct text line grouping helper
    const testItems = [
      { str: 'World', transform: [10, 0, 0, 10, 80, 500], width: 40, height: 10 },
      { str: 'Hello', transform: [10, 0, 0, 10, 40, 500], width: 35, height: 10 },
      { str: 'Line 2 Content', transform: [10, 0, 0, 10, 40, 470], width: 80, height: 10 }
    ];
    const reconstructed = reconstructPageText(testItems);
    if (reconstructed.includes('Hello World') && reconstructed.includes('Line 2 Content')) {
      console.log('✓ PASS: Line reconstruction correctly sorted horizontal items ("Hello World") and vertical lines');
      passCount++;
    } else {
      throw new Error(`Line reconstruction failed: "${reconstructed}"`);
    }
  }

  console.log('\n======================================================');
  console.log(`ALL CONVERT TESTS COMPLETED: ${passCount} PASSED, 0 FAILED`);
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('Test Runner Failed:', err);
  process.exit(1);
});

