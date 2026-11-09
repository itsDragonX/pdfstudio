import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { mergePDFs } from './src/features/organise/services/mergeService.js';
import { normalizeToUint8Array } from './src/features/organise/services/pageOperations.js';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function createSamplePdf(name, text, count = 2) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= count; i++) {
    const page = doc.addPage([400, 400]);
    page.drawText(`${name} - Page ${i}: ${text}`, { x: 50, y: 350, size: 14, font, color: rgb(0.1, 0.1, 0.1) });
  }
  const bytes = await doc.save();
  return bytes;
}

async function run() {
  console.log('=== MERGE ROBUSTNESS & BUG VERIFICATION TEST ===\n');

  // 1. Create two test PDFs
  const pdf1Bytes = await createSamplePdf('PDF 1', 'Initial Doc', 2);
  const pdf2Bytes = await createSamplePdf('PDF 2', 'Week-2-Projects', 3);

  // 2. Simulate PDF.js parsing on PDF 1 (which used to detach the ArrayBuffer!)
  console.log('Test 1: Simulating PDF.js getDocument on PDF 1...');
  // Pass a slice to PDF.js as done in DocumentContext.jsx
  const sliceForPdfJs = pdf1Bytes.slice(0);
  const loadingTask = pdfjsLib.getDocument({ data: sliceForPdfJs });
  const pdfJsDoc = await loadingTask.promise;
  console.log(`✓ PDF.js loaded document with ${pdfJsDoc.numPages} pages`);
  console.log(`✓ Original pdf1Bytes byteLength after PDF.js: ${pdf1Bytes.byteLength} (must NOT be 0)`);
  if (pdf1Bytes.byteLength === 0) {
    throw new Error('FAIL: pdf1Bytes buffer was detached!');
  }

  // 3. Perform Merge 1: PDF 1 + PDF 2 -> Merged 1
  console.log('\nTest 2: Merging PDF 1 + PDF 2...');
  const merge1Input = [
    { name: 'current-document.pdf', bytes: pdf1Bytes, size: pdf1Bytes.byteLength },
    { name: 'Week-2-Projects.pdf', bytes: pdf2Bytes, size: pdf2Bytes.byteLength }
  ];
  const merge1Result = await mergePDFs(merge1Input, 'pdfstudio-merged-2026-11-08.pdf');
  console.log(`✓ Merge 1 succeeded: ${merge1Result.filename}, ${merge1Result.pageCount} pages, ${merge1Result.bytes.byteLength} bytes`);

  // 4. Simulate PDF.js parsing on the merged result (as DocumentContext does on load)
  console.log('\nTest 3: Simulating PDF.js loading on Merged 1 result...');
  const mergedSlice = merge1Result.bytes.slice(0);
  const loadingTask2 = pdfjsLib.getDocument({ data: mergedSlice });
  const pdfJsDoc2 = await loadingTask2.promise;
  console.log(`✓ PDF.js loaded merged doc with ${pdfJsDoc2.numPages} pages`);
  console.log(`✓ merge1Result.bytes byteLength: ${merge1Result.bytes.byteLength} (must NOT be 0)`);
  if (merge1Result.bytes.byteLength === 0) {
    throw new Error('FAIL: merge1Result.bytes buffer was detached!');
  }

  // 5. Perform Merge 2: Active Merged 1 doc + new PDF 3
  // THIS WAS THE EXACT FAILING SCENARIO FROM THE BUG REPORT:
  // "An existing active PDF named pdfstudio-merged-2026-11-08.pdf.
  //  A second PDF named Week-2-Projects.pdf.
  //  CURRENT ERROR: 'Failed to parse PDF document: No PDF header found'"
  console.log('\nTest 4: Merging active merged document with another new PDF (reproducing bug condition)...');
  const pdf3Bytes = await createSamplePdf('PDF 3', 'Third file', 2);
  const merge2Input = [
    { name: merge1Result.filename, bytes: merge1Result.bytes, size: merge1Result.bytes.byteLength, isCurrent: true },
    { name: 'Week-2-Projects.pdf', bytes: pdf3Bytes, size: pdf3Bytes.byteLength }
  ];
  const merge2Result = await mergePDFs(merge2Input, 'final-merged.pdf');
  console.log(`✓ Merge 2 succeeded without 'No PDF header found' error!`);
  console.log(`✓ Total pages: ${merge2Result.pageCount} (expected: 5 + 2 = 7)`);
  if (merge2Result.pageCount !== 7) {
    throw new Error(`FAIL: Expected 7 pages, got ${merge2Result.pageCount}`);
  }

  // 6. Test various input wrapper formats
  console.log('\nTest 5: Testing normalizeToUint8Array across formats...');
  // Plain Uint8Array
  const u1 = await normalizeToUint8Array(pdf1Bytes, 'test-uint8');
  if (u1.byteLength === 0) throw new Error('Uint8Array normalization failed');

  // ArrayBuffer
  const ab = pdf1Bytes.buffer.slice(pdf1Bytes.byteOffset, pdf1Bytes.byteOffset + pdf1Bytes.byteLength);
  const u2 = await normalizeToUint8Array(ab, 'test-arraybuffer');
  if (u2.byteLength === 0) throw new Error('ArrayBuffer normalization failed');

  // Object wrapper with .bytes
  const u3 = await normalizeToUint8Array({ bytes: pdf1Bytes }, 'test-obj-bytes');
  if (u3.byteLength === 0) throw new Error('Object.bytes normalization failed');

  // Object wrapper with .data
  const u4 = await normalizeToUint8Array({ data: ab }, 'test-obj-data');
  if (u4.byteLength === 0) throw new Error('Object.data normalization failed');

  // Empty buffer rejection
  let caughtEmpty = false;
  try {
    await normalizeToUint8Array(new Uint8Array(0), 'empty-test');
  } catch (e) {
    caughtEmpty = true;
    console.log(`✓ Gracefully caught empty input: "${e.message}"`);
  }
  if (!caughtEmpty) throw new Error('Empty buffer should have thrown an error');

  // Invalid non-PDF data rejection
  let caughtInvalid = false;
  try {
    await normalizeToUint8Array(new Uint8Array([1, 2, 3, 4, 5]), 'non-pdf-test');
  } catch (e) {
    caughtInvalid = true;
    console.log(`✓ Gracefully caught non-PDF data: "${e.message}"`);
  }
  if (!caughtInvalid) throw new Error('Non-PDF buffer should have thrown an error');

  console.log('\n=== ALL MERGE ROBUSTNESS TESTS PASSED (100%) ===\n');
}

run().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
