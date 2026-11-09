import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  mergePDFs,
  splitPDF,
  reorderPages,
  rotatePages,
  deletePages,
  duplicatePages,
  extractPages,
  insertBlankPage,
  cropPages,
  parsePageRanges
} from './src/features/organise/services/index.js';

/**
 * Helper: generates a verifiable test PDF with identifiable page text, sizes, and orientations.
 * @param {number} numPages 
 * @param {string} prefix 
 * @returns {Promise<Uint8Array>}
 */
async function createFixturePDF(numPages = 5, prefix = 'TEST DOCUMENT PAGE') {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (let i = 1; i <= numPages; i++) {
    // Alternate dimensions to test mixed page sizes: A4 standard vs landscape
    const isLandscape = i % 2 === 0;
    const width = isLandscape ? 842 : 595;
    const height = isLandscape ? 595 : 842;

    const page = pdfDoc.addPage([width, height]);
    const text = `${prefix} ${i}`;
    page.drawText(text, {
      x: 50,
      y: height - 100,
      size: 24,
      font,
      color: rgb(0.1, 0.1, 0.2)
    });
  }

  return await pdfDoc.save();
}

/**
 * Helper: extracts text from all pages using PDF.js to verify actual content ordering.
 * @param {Uint8Array} bytes 
 * @returns {Promise<string[]>}
 */
async function extractAllPageTexts(bytes) {
  const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
  const texts = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const str = content.items.map((item) => item.str).join(' ').trim();
    texts.push(str);
  }
  return texts;
}

async function runTests() {
  console.log('=== PDF STUDIO MILESTONE 2: ORGANISE TEST SUITE ===\n');
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

  try {
    // -------------------------------------------------------------
    // 1. MERGE PDF TEST
    // -------------------------------------------------------------
    console.log('--- 1. Testing Merge PDF ---');
    const docA = await createFixturePDF(2, 'DOC_A PAGE');
    const docB = await createFixturePDF(3, 'DOC_B PAGE');

    const mergeResult = await mergePDFs([
      { name: 'docA.pdf', bytes: docA },
      { name: 'docB.pdf', bytes: docB }
    ]);

    assert(mergeResult.pageCount === 5, 'Merged PDF has exact expected page count (2 + 3 = 5)');
    const mergedTexts = await extractAllPageTexts(mergeResult.bytes);
    assert(
      mergedTexts[0].includes('DOC_A PAGE 1') &&
      mergedTexts[1].includes('DOC_A PAGE 2') &&
      mergedTexts[2].includes('DOC_B PAGE 1') &&
      mergedTexts[4].includes('DOC_B PAGE 3'),
      'Merged pages maintain exact sequential order and content integrity'
    );

    // Merge error handling (< 2 files)
    try {
      await mergePDFs([{ name: 'solo.pdf', bytes: docA }]);
      assert(false, 'Merge should reject fewer than 2 files');
    } catch (e) {
      assert(true, 'Merge gracefully rejects fewer than 2 input files');
    }

    // -------------------------------------------------------------
    // 2. SPLIT PDF TEST
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Split PDF ---');
    const baseFixture = await createFixturePDF(6, 'PAGE');

    // Test Range parsing
    const rangeRes = parsePageRanges('1-2, 3-4, 5-6', 6);
    assert(rangeRes.isValid && rangeRes.groups.length === 3, 'Range parser correctly segments "1-2, 3-4, 5-6"');

    // Test Invalid Ranges
    const invalidRange = parsePageRanges('1-8', 6);
    assert(!invalidRange.isValid, 'Range parser rejects out-of-bounds page range "1-8" for 6-page doc');
    const invalidFormat = parsePageRanges('foo-bar', 6);
    assert(!invalidFormat.isValid, 'Range parser rejects non-numeric range "foo-bar"');

    // Execute Split with custom ranges
    const splitResult = await splitPDF(baseFixture, 'base.pdf', {
      rangeString: '1-3, 4-6'
    });

    assert(splitResult.isZip === true, 'Multi-part split generates a ZIP bundle');
    assert(splitResult.files.length === 2, 'Split produced exactly 2 output PDFs');
    assert(splitResult.files[0].pageCount === 3, 'First output PDF contains 3 pages');
    assert(splitResult.files[1].pageCount === 3, 'Second output PDF contains 3 pages');

    const splitPart1Texts = await extractAllPageTexts(splitResult.files[0].bytes);
    const splitPart2Texts = await extractAllPageTexts(splitResult.files[1].bytes);
    assert(
      splitPart1Texts[0].includes('PAGE 1') && splitPart1Texts[2].includes('PAGE 3'),
      'First split PDF contains pages 1, 2, 3'
    );
    assert(
      splitPart2Texts[0].includes('PAGE 4') && splitPart2Texts[2].includes('PAGE 6'),
      'Second split PDF contains pages 4, 5, 6'
    );

    // Test Split Every Page
    const splitEveryResult = await splitPDF(baseFixture, 'base.pdf', { splitEveryPage: true });
    assert(splitEveryResult.files.length === 6, 'Split every page generates exactly 6 single-page files');

    // -------------------------------------------------------------
    // 3. REORDER PAGES TEST
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Reorder Pages ---');
    const reorderFixture = await createFixturePDF(5, 'ORDER PAGE');
    // Move page 5 to position 1: [5, 1, 2, 3, 4]
    const reorderResult = await reorderPages(reorderFixture, [5, 1, 2, 3, 4]);
    assert(reorderResult.pageCount === 5, 'Reordered PDF preserves total page count');

    const reorderedTexts = await extractAllPageTexts(reorderResult.bytes);
    assert(reorderedTexts[0].includes('ORDER PAGE 5'), 'Page 5 is now at position 1');
    assert(reorderedTexts[1].includes('ORDER PAGE 1'), 'Page 1 is now at position 2');
    assert(reorderedTexts[4].includes('ORDER PAGE 4'), 'Page 4 is now at position 5');

    // Reorder validation (duplicate/missing)
    try {
      await reorderPages(reorderFixture, [1, 2, 2, 4, 5]);
      assert(false, 'Reorder should reject duplicate page indices');
    } catch (e) {
      assert(true, 'Reorder rejects invalid permutations with duplicates');
    }

    // -------------------------------------------------------------
    // 4. ROTATE PAGES TEST
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Rotate Pages ---');
    const rotateFixture = await createFixturePDF(3, 'ROTATE PAGE');

    // Rotate page 1 by 90° clockwise
    const rotateResult = await rotatePages(rotateFixture, [1], 90);
    const pdfDocRot = await PDFDocument.load(rotateResult.bytes);
    const p1Rotation = pdfDocRot.getPage(0).getRotation().angle;
    assert(p1Rotation === 90, 'Page 1 rotation metadata is exactly 90 degrees');

    // Rotate page 1 by another 90° clockwise (total 180°)
    const rotateResult2 = await rotatePages(rotateResult.bytes, [1], 90);
    const pdfDocRot2 = await PDFDocument.load(rotateResult2.bytes);
    assert(pdfDocRot2.getPage(0).getRotation().angle === 180, 'Cumulative rotation normalizes to 180 degrees');

    // Rotate all pages by 90° counterclockwise (-90)
    const rotateAllResult = await rotatePages(rotateFixture, 'all', -90);
    const pdfDocAllRot = await PDFDocument.load(rotateAllResult.bytes);
    const allRotated = pdfDocAllRot.getPageIndices().every(
      (idx) => pdfDocAllRot.getPage(idx).getRotation().angle === 270
    );
    assert(allRotated, 'Rotate "all" correctly normalizes -90° to 270° on all pages');

    // -------------------------------------------------------------
    // 5. DELETE PAGES TEST
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Delete Pages ---');
    const deleteFixture = await createFixturePDF(5, 'DELETE PAGE');

    // Delete pages 2 and 4
    const deleteResult = await deletePages(deleteFixture, [2, 4]);
    assert(deleteResult.pageCount === 3, 'Page count decreased by 2 (5 - 2 = 3)');

    const deleteTexts = await extractAllPageTexts(deleteResult.bytes);
    assert(
      deleteTexts[0].includes('DELETE PAGE 1') &&
      deleteTexts[1].includes('DELETE PAGE 3') &&
      deleteTexts[2].includes('DELETE PAGE 5'),
      'Remaining pages are exactly 1, 3, 5 with correct order'
    );

    // Safety check: Cannot delete all pages
    try {
      await deletePages(deleteFixture, [1, 2, 3, 4, 5]);
      assert(false, 'Should prevent deleting all pages');
    } catch (e) {
      assert(true, 'Safety check successfully blocks deleting 100% of pages');
    }

    // -------------------------------------------------------------
    // 6. DUPLICATE PAGES TEST
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Duplicate Pages ---');
    const dupFixture = await createFixturePDF(3, 'DUP PAGE');

    // Duplicate page 2
    const dupResult = await duplicatePages(dupFixture, [2]);
    assert(dupResult.pageCount === 4, 'Duplicating 1 page increases page count to 4');

    const dupTexts = await extractAllPageTexts(dupResult.bytes);
    assert(
      dupTexts[0].includes('DUP PAGE 1') &&
      dupTexts[1].includes('DUP PAGE 2') &&
      dupTexts[2].includes('DUP PAGE 2') &&
      dupTexts[3].includes('DUP PAGE 3'),
      'Duplicate page is placed immediately adjacent to source page 2'
    );

    // -------------------------------------------------------------
    // 7. EXTRACT PAGES TEST
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Extract Pages ---');
    const extractFixture = await createFixturePDF(8, 'LARGE PAGE');

    // Extract pages 2, 5, 7
    const extractResult = await extractPages(extractFixture, [2, 5, 7], 'original.pdf');
    assert(extractResult.pageCount === 3, 'Extracted document contains exactly 3 pages');
    assert(extractResult.filename === 'original_extracted.pdf', 'Naming convention follows original_extracted.pdf');

    const extractTexts = await extractAllPageTexts(extractResult.bytes);
    assert(
      extractTexts[0].includes('LARGE PAGE 2') &&
      extractTexts[1].includes('LARGE PAGE 5') &&
      extractTexts[2].includes('LARGE PAGE 7'),
      'Extracted pages preserve relative ordering and exact content'
    );

    // -------------------------------------------------------------
    // 8. INSERT BLANK PAGE TEST
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing Insert Blank Page ---');
    const insertFixture = await createFixturePDF(3, 'INSERT PAGE');

    // Insert before page 2
    const insertBeforeRes = await insertBlankPage(insertFixture, {
      targetPage: 2,
      position: 'before',
      preset: 'adjacent'
    });

    assert(insertBeforeRes.pageCount === 4, 'Inserted page increases total count to 4');
    const insertTexts = await extractAllPageTexts(insertBeforeRes.bytes);
    assert(insertTexts[0].includes('INSERT PAGE 1'), 'Page 1 remains original');
    assert(insertTexts[1] === '', 'Page 2 is a genuine empty blank page');
    assert(insertTexts[2].includes('INSERT PAGE 2'), 'Original page 2 shifted to page 3');

    // Test A4 Landscape insertion at end
    const insertLandscapeRes = await insertBlankPage(insertFixture, {
      position: 'end',
      preset: 'a4',
      orientation: 'landscape'
    });
    const loadedDoc = await PDFDocument.load(insertLandscapeRes.bytes);
    const lastPage = loadedDoc.getPage(loadedDoc.getPageCount() - 1);
    const { width, height } = lastPage.getSize();
    assert(width > height, 'Inserted landscape A4 page has width > height');

    // -------------------------------------------------------------
    // 9. CROP PDF TEST
    // -------------------------------------------------------------
    console.log('\n--- 9. Testing Crop PDF ---');
    const cropFixture = await createFixturePDF(2, 'CROP PAGE');

    // Crop page 1: standard MediaBox is 595 x 842. Crop to x: 50, y: 50, width: 300, height: 400
    const cropResult = await cropPages(cropFixture, [1], {
      x: 50,
      y: 50,
      width: 300,
      height: 400
    });

    const cropDoc = await PDFDocument.load(cropResult.bytes);
    const croppedPage1 = cropDoc.getPage(0);
    const cBox = croppedPage1.getCropBox();
    const mBox = croppedPage1.getMediaBox();

    assert(cBox.x === 50 && cBox.y === 50, 'CropBox origin applied correctly');
    assert(cBox.width === 300 && cBox.height === 400, 'CropBox dimensions applied accurately');
    assert(mBox.width === 595 && mBox.height === 842, 'MediaBox boundaries retained intact');

    // -------------------------------------------------------------
    // 10. LARGE DOCUMENT STRESS TEST (~50 pages)
    // -------------------------------------------------------------
    console.log('\n--- 10. Testing Large Document Performance (~50 pages) ---');
    const largeDoc = await createFixturePDF(50, 'STRESS PAGE');
    const t0 = Date.now();
    const rotated50 = await rotatePages(largeDoc, 'all', 90);
    const t1 = Date.now();
    assert(rotated50.pageCount === 50, `50-page document processed in ${t1 - t0}ms`);

    // -------------------------------------------------------------
    // 11. SINGLE-PAGE DOCUMENT EDGE CASE
    // -------------------------------------------------------------
    console.log('\n--- 11. Testing Single-Page Document Edge Cases ---');
    const singleDoc = await createFixturePDF(1, 'SOLO PAGE');
    const dupSingle = await duplicatePages(singleDoc, [1]);
    assert(dupSingle.pageCount === 2, 'Single-page document successfully duplicated to 2 pages');

    console.log('\n======================================================');
    console.log(`ALL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();

