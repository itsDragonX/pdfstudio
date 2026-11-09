import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  applyWatermarkToPDF,
  applyPageNumbersToPDF,
  applyHeaderFooterToPDF,
  applyDateStampToPDF
} from './src/features/stamp/services/index.js';

async function testExportWorkflow() {
  console.log('=== PDF STUDIO STAMP SUITE: EXPORT VERIFICATION TEST ===\n');

  // Create baseline 3-page document
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (let i = 1; i <= 3; i++) {
    const page = doc.addPage([595, 842]);
    page.drawText(`Base Content Page ${i}`, { x: 50, y: 750, size: 14, font, color: rgb(0, 0, 0) });
  }

  let currentBytes = await doc.save();

  // 1. Watermark
  console.log('Applying Watermark...');
  const res1 = await applyWatermarkToPDF(currentBytes, {
    type: 'text',
    text: 'STAMPED_CONFIDENTIAL',
    fontSize: 40,
    rotation: -45,
    opacity: 0.25,
    pageTarget: 'all'
  });
  currentBytes = res1.bytes;

  // 2. Page Numbers
  console.log('Applying Page Numbers...');
  const res2 = await applyPageNumbersToPDF(currentBytes, {
    format: 'page_n_of_total',
    position: 'bottom-center',
    pageTarget: 'all'
  });
  currentBytes = res2.bytes;

  // 3. Header & Footer
  console.log('Applying Header & Footer...');
  const res3 = await applyHeaderFooterToPDF(currentBytes, {
    headerLeft: 'HeaderLeftStudio',
    headerRight: 'HeaderRightAlpha',
    footerLeft: 'FooterLeftFile',
    pageTarget: 'all'
  });
  currentBytes = res3.bytes;

  // 4. Date Stamp
  console.log('Applying Date Stamp...');
  const res4 = await applyDateStampToPDF(currentBytes, {
    dateFormat: 'YYYY-MM-DD',
    prefix: 'STAMPED_ON: ',
    timestamp: new Date('2026-11-09T10:00:00'),
    position: 'bottom-right',
    pageTarget: 'all'
  });
  currentBytes = res4.bytes;

  // Save exported document to temporary file
  const exportPath = path.join(process.cwd(), '.tmp-exported-stamped.pdf');
  fs.writeFileSync(exportPath, currentBytes);
  console.log(`Saved exported PDF (${currentBytes.byteLength} bytes) to ${exportPath}`);

  // Reopen and inspect with PDF.js
  const reloaded = await pdfjsLib.getDocument({ data: currentBytes.slice(0) }).promise;
  console.log(`Reopened exported PDF: ${reloaded.numPages} pages found.`);

  if (reloaded.numPages !== 3) {
    throw new Error(`Expected 3 pages, found ${reloaded.numPages}`);
  }

  // Inspect page 1 text layer
  const page1 = await reloaded.getPage(1);
  const textContent = await page1.getTextContent();
  const strings = textContent.items.map((i) => i.str);

  console.log('Page 1 extracted text samples:', strings.filter((s) => s.trim().length > 0));

  const hasWatermark = strings.some((s) => s.includes('STAMPED_CONFIDENTIAL'));
  const hasPageNum = strings.some((s) => s.includes('Page 1 of 3'));
  const hasHeader = strings.some((s) => s.includes('HeaderLeftStudio'));
  const hasDate = strings.some((s) => s.includes('STAMPED_ON: 2026-11-09'));

  if (hasWatermark && hasPageNum && hasHeader && hasDate) {
    console.log('\n✓ PASS: All 4 stamp elements verified in exported PDF content stream!');
  } else {
    throw new Error(`Verification failed. Missing elements: watermark=${hasWatermark}, pageNum=${hasPageNum}, header=${hasHeader}, date=${hasDate}`);
  }

  // Clean up tmp file
  if (fs.existsSync(exportPath)) {
    fs.unlinkSync(exportPath);
  }

  console.log('\nEXPORT WORKFLOW TEST PASSED 100%!\n');
}

testExportWorkflow().catch((err) => {
  console.error('Export test failed:', err);
  process.exit(1);
});

