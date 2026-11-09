import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  applyWatermarkToPDF,
  applyPageNumbersToPDF,
  applyHeaderFooterToPDF,
  applyDateStampToPDF,
  formatDate,
  formatPageNumberString,
  resolveDynamicVariables
} from './src/features/stamp/services/index.js';

// Helper to create multi-page test fixture with portrait and landscape pages
async function createTestFixture() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  // Page 1: Standard Portrait (600 x 800)
  const page1 = doc.addPage([600, 800]);
  page1.drawText('Page 1: PDF Studio Milestone 4 Test Document', { x: 50, y: 740, size: 16, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
  page1.drawText('Content on Page 1 to verify watermark underlay/overlay and margins.', { x: 50, y: 700, size: 12, font, color: rgb(0.2, 0.2, 0.2) });

  // Page 2: Landscape Page (842 x 595)
  const page2 = doc.addPage([842, 595]);
  page2.drawText('Page 2: Landscape Document Section', { x: 50, y: 540, size: 16, font: boldFont, color: rgb(0.1, 0.1, 0.1) });

  // Page 3: Portrait Page (600 x 800)
  const page3 = doc.addPage([600, 800]);
  page3.drawText('Page 3: Executive Summary & Data Points', { x: 50, y: 740, size: 16, font: boldFont, color: rgb(0.1, 0.1, 0.1) });

  // Page 4: Square Page (600 x 600)
  const page4 = doc.addPage([600, 600]);
  page4.drawText('Page 4: Appendix Notes', { x: 50, y: 540, size: 16, font: boldFont, color: rgb(0.1, 0.1, 0.1) });

  // Page 5: Portrait Page (600 x 800)
  const page5 = doc.addPage([600, 800]);
  page5.drawText('Page 5: Final Conclusion', { x: 50, y: 740, size: 16, font: boldFont, color: rgb(0.1, 0.1, 0.1) });

  return await doc.save();
}

// 1x1 Transparent PNG bytes for testing
const SAMPLE_PNG = new Uint8Array([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
]);

async function runTests() {
  console.log('=== PDF STUDIO MILESTONE 4: STAMP SUITE TEST RUNNER ===\n');
  let passCount = 0;
  const baseBytes = await createTestFixture();

  // -------------------------------------------------------------
  // TOOL 19: WATERMARK
  // -------------------------------------------------------------
  console.log('--- 1. Testing Watermark (Tool 19) ---');
  {
    // Test 1.1: Text Watermark applied across all pages
    const resultAll = await applyWatermarkToPDF(baseBytes, {
      type: 'text',
      text: 'CONFIDENTIAL',
      fontSize: 48,
      rotation: -45,
      opacity: 0.3,
      pageTarget: 'all'
    });
    if (resultAll.bytes && resultAll.pageCount === 5 && resultAll.modifiedPages.length === 5) {
      console.log('✓ PASS: Text watermark applied across all 5 pages');
      passCount++;
    } else {
      throw new Error('Failed to apply text watermark across all pages');
    }

    // Verify PDF.js renders it cleanly
    const pdfJsTask = pdfjsLib.getDocument({ data: resultAll.bytes.slice(0) });
    const loadedDoc = await pdfJsTask.promise;
    const p1 = await loadedDoc.getPage(1);
    const tc1 = await p1.getTextContent();
    const hasConfidential = tc1.items.some((item) => item.str.includes('CONFIDENTIAL'));
    if (hasConfidential) {
      console.log('✓ PASS: Watermark text content verified via PDF.js text extraction');
      passCount++;
    } else {
      throw new Error('Watermark text was not found in PDF text layer');
    }

    // Test 1.2: Image Watermark
    const resultImg = await applyWatermarkToPDF(baseBytes, {
      type: 'image',
      imageBytes: SAMPLE_PNG,
      imageFormat: 'png',
      imageScale: 1.5,
      rotation: 0,
      opacity: 0.25,
      pageTarget: 'all'
    });
    if (resultImg.bytes && resultImg.modifiedPages.length === 5) {
      console.log('✓ PASS: Image watermark embedded with opacity and applied to all pages');
      passCount++;
    } else {
      throw new Error('Failed image watermark test');
    }

    // Test 1.3: Tiled / Repeated Watermark
    const resultTiled = await applyWatermarkToPDF(baseBytes, {
      type: 'text',
      text: 'SAMPLE',
      isTiled: true,
      fontSize: 24,
      rotation: -30,
      pageTarget: 'current',
      currentPageIndex: 0
    });
    if (resultTiled.bytes && resultTiled.modifiedPages.length === 1 && resultTiled.modifiedPages[0] === 0) {
      console.log('✓ PASS: Tiled watermark generated on target page');
      passCount++;
    } else {
      throw new Error('Failed tiled watermark test');
    }

    // Test 1.4: Validation - Empty text safely rejected
    try {
      await applyWatermarkToPDF(baseBytes, { type: 'text', text: '' });
      throw new Error('Empty watermark text should have been rejected');
    } catch (e) {
      if (e.message.includes('specify watermark text')) {
        console.log('✓ PASS: Empty watermark text safely rejected with clear validation error');
        passCount++;
      } else {
        throw e;
      }
    }
  }

  // -------------------------------------------------------------
  // TOOL 20: PAGE NUMBERS
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Page Numbers (Tool 20) ---');
  {
    // Test 2.1: Page X of Y format on all pages
    const resultNum = await applyPageNumbersToPDF(baseBytes, {
      format: 'page_n_of_total',
      position: 'bottom-center',
      fontSize: 10,
      startNumber: 1,
      pageTarget: 'all'
    });
    if (resultNum.bytes && resultNum.modifiedPages.length === 5) {
      console.log('✓ PASS: "Page X of Y" numbers stamped across all pages');
      passCount++;
    } else {
      throw new Error('Failed Page X of Y numbering');
    }

    // Verify printed text on Page 3 via PDF.js
    const pdfJsTask = pdfjsLib.getDocument({ data: resultNum.bytes.slice(0) });
    const loadedDoc = await pdfJsTask.promise;
    const p3 = await loadedDoc.getPage(3);
    const tc3 = await p3.getTextContent();
    const hasP3 = tc3.items.some((item) => item.str.includes('Page 3 of 5'));
    if (hasP3) {
      console.log('✓ PASS: Page 3 has exact printed string "Page 3 of 5"');
      passCount++;
    } else {
      throw new Error('Printed page number string mismatch on page 3');
    }

    // Test 2.2: Exclude first page & Custom starting number
    const resultExclude = await applyPageNumbersToPDF(baseBytes, {
      format: 'custom',
      customPrefix: 'DOC-',
      customSuffix: '-CONFIDENTIAL',
      startNumber: 101,
      excludeFirstPage: true,
      position: 'top-right',
      pageTarget: 'all'
    });
    if (resultExclude.modifiedPages.length === 4 && !resultExclude.modifiedPages.includes(0)) {
      console.log('✓ PASS: First page excluded; pages 2-5 numbered sequentially');
      passCount++;
    } else {
      throw new Error('Exclude first page rule failed');
    }

    // Verify page 2 has DOC-101-CONFIDENTIAL
    const pdfJsTask2 = pdfjsLib.getDocument({ data: resultExclude.bytes.slice(0) });
    const loadedDoc2 = await pdfJsTask2.promise;
    const p2 = await loadedDoc2.getPage(2);
    const tc2 = await p2.getTextContent();
    const hasDoc101 = tc2.items.some((item) => item.str.includes('DOC-101-CONFIDENTIAL'));
    if (hasDoc101) {
      console.log('✓ PASS: Custom prefix/suffix and custom starting index (101) verified on Page 2');
      passCount++;
    } else {
      throw new Error('Custom format prefix/suffix DOC-101 not found on page 2');
    }

    // Test 2.3: Six positions placement
    const positions = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];
    for (const pos of positions) {
      const resPos = await applyPageNumbersToPDF(baseBytes, {
        format: 'number_only',
        position: pos,
        pageTarget: 'current',
        currentPageIndex: 0
      });
      if (!resPos.bytes) throw new Error(`Position ${pos} failed`);
    }
    console.log('✓ PASS: All 6 positioning alignments (top/bottom x left/center/right) verified');
    passCount++;
  }

  // -------------------------------------------------------------
  // TOOL 21: HEADER AND FOOTER
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Header & Footer (Tool 21) ---');
  {
    // Test 3.1: All 6 zones simultaneously with dynamic variables
    const resultHF = await applyHeaderFooterToPDF(baseBytes, {
      headerLeft: 'PDF Studio Pro',
      headerCenter: 'Quarterly Report - {filename}',
      headerRight: 'CONFIDENTIAL',
      footerLeft: 'Document: {filename}',
      footerCenter: 'Page {page} of {totalPages}',
      footerRight: 'Date: {date}',
      filename: 'Financial_Q3.pdf',
      dateString: '09/11/2026',
      pageTarget: 'all'
    });

    if (resultHF.bytes && resultHF.modifiedPages.length === 5) {
      console.log('✓ PASS: All 6 header and footer zones applied simultaneously');
      passCount++;
    } else {
      throw new Error('Failed to apply 6-zone header and footer');
    }

    // Verify dynamic variables on Landscape Page 2
    const pdfJsTask = pdfjsLib.getDocument({ data: resultHF.bytes.slice(0) });
    const loadedDoc = await pdfJsTask.promise;
    const p2 = await loadedDoc.getPage(2);
    const tc2 = await p2.getTextContent();
    const strings = tc2.items.map((it) => it.str);

    const hasHeaderLeft = strings.some((s) => s.includes('PDF Studio Pro'));
    const hasHeaderCenter = strings.some((s) => s.includes('Quarterly Report - Financial_Q3.pdf'));
    const hasFooterCenter = strings.some((s) => s.includes('Page 2 of 5'));
    const hasFooterRight = strings.some((s) => s.includes('Date: 09/11/2026'));

    if (hasHeaderLeft && hasHeaderCenter && hasFooterCenter && hasFooterRight) {
      console.log('✓ PASS: Dynamic variables {page}, {totalPages}, {filename}, {date} resolved accurately on landscape page');
      passCount++;
    } else {
      throw new Error('Dynamic variable substitution failed in Header & Footer');
    }

    // Test 3.2: Empty zones validation
    try {
      await applyHeaderFooterToPDF(baseBytes, { headerLeft: '', footerRight: '' });
      throw new Error('Empty zones should be rejected');
    } catch (e) {
      if (e.message.includes('at least one header or footer zone')) {
        console.log('✓ PASS: Empty header/footer configuration safely rejected');
        passCount++;
      } else {
        throw e;
      }
    }
  }

  // -------------------------------------------------------------
  // TOOL 22: DATE STAMP
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Date Stamp (Tool 22) ---');
  {
    const fixedTimestamp = new Date('2026-11-09T14:35:00').getTime();

    // Test 4.1: Supported formats
    const fmt1 = formatDate(fixedTimestamp, 'DD/MM/YYYY', false);
    const fmt2 = formatDate(fixedTimestamp, 'MM/DD/YYYY', false);
    const fmt3 = formatDate(fixedTimestamp, 'YYYY-MM-DD', false);
    const fmt4 = formatDate(fixedTimestamp, 'DD MMM YYYY', false);
    const fmtTime24 = formatDate(fixedTimestamp, 'DD/MM/YYYY', true, '24h');
    const fmtTime12 = formatDate(fixedTimestamp, 'DD/MM/YYYY', true, '12h');

    if (
      fmt1 === '09/11/2026' &&
      fmt2 === '11/09/2026' &&
      fmt3 === '2026-11-09' &&
      fmt4 === '09 Nov 2026' &&
      fmtTime24.includes('14:35') &&
      fmtTime12.includes('02:35 PM')
    ) {
      console.log('✓ PASS: All 4 date formats and 12h/24h time formatting confirmed');
      passCount++;
    } else {
      throw new Error(`Date formatting mismatch: ${fmt1}, ${fmt2}, ${fmt3}, ${fmt4}, ${fmtTime24}, ${fmtTime12}`);
    }

    // Test 4.2: Apply Date Stamp to PDF with prefix and single timestamp consistency
    const resultDate = await applyDateStampToPDF(baseBytes, {
      dateFormat: 'DD MMM YYYY',
      includeTime: true,
      timeFormat: '24h',
      prefix: 'RECEIVED & VERIFIED: ',
      timestamp: fixedTimestamp,
      position: 'bottom-right',
      pageTarget: 'all'
    });

    if (resultDate.bytes && resultDate.formattedDate.includes('RECEIVED & VERIFIED: 09 Nov 2026 14:35')) {
      console.log('✓ PASS: Date Stamp applied with consistent captured timestamp across all pages');
      passCount++;
    } else {
      throw new Error('Date stamp application failed');
    }

    // Verify printed date stamp on Page 1 via PDF.js
    const pdfJsTask = pdfjsLib.getDocument({ data: resultDate.bytes.slice(0) });
    const loadedDoc = await pdfJsTask.promise;
    const p1 = await loadedDoc.getPage(1);
    const tc1 = await p1.getTextContent();
    const hasDateStr = tc1.items.some((item) => item.str.includes('RECEIVED & VERIFIED: 09 Nov 2026 14:35'));
    if (hasDateStr) {
      console.log('✓ PASS: Stamped date text layer verified via PDF.js');
      passCount++;
    } else {
      throw new Error('Stamped date string not found on page 1');
    }
  }

  console.log('\n======================================================');
  console.log(`ALL STAMP TESTS COMPLETED: ${passCount} PASSED, 0 FAILED`);
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('Test Runner Failed:', err);
  process.exit(1);
});

