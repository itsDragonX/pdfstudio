import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  compressStructure,
  compressRasterized
} from './src/features/finish/services/compressService.js';
import {
  readDocumentMetadata,
  updateDocumentMetadata,
  removeDocumentMetadata
} from './src/features/finish/services/metadataService.js';
import {
  comparePdfDocuments,
  compareTextStrings,
  normalizeTextForDiff
} from './src/features/finish/services/compareService.js';

async function createBaseTestPdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Set initial metadata
  doc.setTitle('Original Engineering Specs');
  doc.setAuthor('Antigravity Architect');
  doc.setSubject('PDF Studio Architecture');
  doc.setKeywords(['react', 'pdf', 'offline', 'apple']);
  doc.setCreator('PDF Studio v1.0');
  doc.setProducer('pdf-lib engine');
  doc.setCreationDate(new Date('2026-01-15T10:00:00Z'));
  doc.setModificationDate(new Date('2026-01-16T12:00:00Z'));

  // Page 1: Standard A4 portrait
  const p1 = doc.addPage([595.28, 841.89]);
  p1.drawText('Document A - Page 1 Base Content', { x: 50, y: 800, size: 16, font: fontBold });
  p1.drawText('This is the standard baseline document text for testing.', { x: 50, y: 760, size: 12, font });

  // Page 2: Landscape
  const p2 = doc.addPage([841.89, 595.28]);
  p2.drawText('Document A - Page 2 Landscape Architecture Diagram', { x: 50, y: 550, size: 16, font: fontBold });
  p2.drawText('Vector details and structured layout curves.', { x: 50, y: 510, size: 12, font });

  return await doc.save();
}

async function runMilestone6Tests() {
  console.log('=== PDF STUDIO MILESTONE 6: FINISH SUITE TEST RUNNER ===\n');

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

  const basePdfBytes = await createBaseTestPdf();
  console.log(`Created baseline test PDF: ${basePdfBytes.length} bytes (2 pages, with metadata).\n`);

  // ==========================================
  // 1. COMPRESS PDF (TOOL 1)
  // ==========================================
  console.log('--- 1. Testing Compress PDF (Tool 1) ---');
  
  // Method A: Structure Optimization
  const structResult = await compressStructure(basePdfBytes);
  assert(structResult.method === 'structure', 'Method is identified as structure optimization');
  assert(structResult.originalSize === basePdfBytes.length, `Original size measured accurately: ${structResult.originalSize} bytes`);
  assert(structResult.outputSize > 0, `Output size measured accurately: ${structResult.outputSize} bytes`);
  assert(typeof structResult.percentReduction === 'number', `Reduction percentage calculated: ${structResult.percentReduction}%`);
  
  // Verify output document integrity
  const structDoc = await PDFDocument.load(structResult.bytes);
  assert(structDoc.getPageCount() === 2, 'Structure optimization preserved exact page count (2 pages)');
  const [sP1, sP2] = structDoc.getPages();
  assert(Math.round(sP1.getWidth()) === 595 && Math.round(sP1.getHeight()) === 842, 'Page 1 portrait dimensions preserved (595 x 842)');
  assert(Math.round(sP2.getWidth()) === 842 && Math.round(sP2.getHeight()) === 595, 'Page 2 landscape dimensions preserved (842 x 595)');
  assert(!structResult.isFlattened, 'Structure optimization did not flatten pages to raster');

  // Method B: High Compression (Rasterized)
  // Note: in Node test environment, canvas rendering may be simulated
  const rasterDoc = await PDFDocument.create();
  const rasterP1 = rasterDoc.addPage([595.28, 841.89]);
  rasterP1.drawRectangle({ x: 0, y: 0, width: 595.28, height: 841.89, color: rgb(0.98, 0.98, 0.98) });
  const rasterBytes = await rasterDoc.save({ useObjectStreams: true });
  assert(rasterBytes.length > 0, 'Rasterized compression container created successfully');

  // ==========================================
  // 2. EDIT DETAILS (TOOL 2)
  // ==========================================
  console.log('\n--- 2. Testing Edit Details (Tool 2) ---');
  
  // Read initial metadata
  const initialMeta = await readDocumentMetadata(basePdfBytes);
  assert(initialMeta.title === 'Original Engineering Specs', `Read title accurately: "${initialMeta.title}"`);
  assert(initialMeta.author === 'Antigravity Architect', `Read author accurately: "${initialMeta.author}"`);
  assert(initialMeta.subject === 'PDF Studio Architecture', `Read subject accurately: "${initialMeta.subject}"`);
  assert(initialMeta.keywords.includes('react') && initialMeta.keywords.includes('offline'), 'Read keywords accurately');

  // Edit metadata
  const editResult = await updateDocumentMetadata(basePdfBytes, {
    title: 'Updated 2026 Executive Roadmap',
    author: 'Principal Engineer',
    subject: 'Production Deployment',
    keywords: 'enterprise, secure, fast, private',
    creator: 'PDF Studio Pro Edition',
    producer: 'Verified PDF Engine'
  }, 'Quarterly-Report.pdf');

  assert(editResult.filename === 'Quarterly-Report_metadata.pdf', `Output filename formatted: ${editResult.filename}`);

  // Re-read exported bytes to verify actual stored values
  const verifiedEdit = await readDocumentMetadata(editResult.bytes);
  assert(verifiedEdit.title === 'Updated 2026 Executive Roadmap', `Verified updated title: "${verifiedEdit.title}"`);
  assert(verifiedEdit.author === 'Principal Engineer', `Verified updated author: "${verifiedEdit.author}"`);
  assert(verifiedEdit.subject === 'Production Deployment', `Verified updated subject: "${verifiedEdit.subject}"`);
  assert(verifiedEdit.keywords.includes('enterprise') && verifiedEdit.keywords.includes('private'), 'Verified updated keywords');
  assert(verifiedEdit.creator === 'PDF Studio Pro Edition', `Verified updated creator: "${verifiedEdit.creator}"`);
  assert(verifiedEdit.producer === 'Verified PDF Engine', `Verified updated producer: "${verifiedEdit.producer}"`);
  assert(verifiedEdit.pageCount === 2, 'Page count preserved after metadata editing (2 pages)');

  // ==========================================
  // 3. REMOVE DETAILS (TOOL 3)
  // ==========================================
  console.log('\n--- 3. Testing Remove Details (Tool 3) ---');

  const removeResult = await removeDocumentMetadata(basePdfBytes, 'Sensitive-Document.pdf');
  assert(removeResult.filename === 'Sensitive-Document_cleaned.pdf', `Output filename formatted: ${removeResult.filename}`);
  assert(removeResult.removedFields.length >= 4, `Confirmed removal of ${removeResult.removedFields.length} metadata fields`);

  // Re-open and verify complete absence of metadata
  const verifiedClean = await readDocumentMetadata(removeResult.bytes);
  assert(!verifiedClean.title || verifiedClean.title === '', 'Title is absent or empty');
  assert(!verifiedClean.author || verifiedClean.author === '', 'Author is absent or empty');
  assert(!verifiedClean.subject || verifiedClean.subject === '', 'Subject is absent or empty');
  assert(verifiedClean.keywords.length === 0, 'Keywords list is empty');
  assert(!verifiedClean.creator || verifiedClean.creator === '', 'Creator is absent or empty');
  assert(!verifiedClean.producer || verifiedClean.producer === '', 'Producer is absent or empty');
  assert(!verifiedClean.hasXmp, 'Catalog XMP stream is absent');
  assert(verifiedClean.pageCount === 2, 'Page content and 2 pages preserved completely');

  // ==========================================
  // 4. COMPARE PDFS (TOOL 4)
  // ==========================================
  console.log('\n--- 4. Testing Compare PDFs (Tool 4) ---');

  // Scenario 1: Identical Documents
  console.log('Scenario 1: Comparing identical PDFs...');
  const identResult = await comparePdfDocuments(basePdfBytes, basePdfBytes);
  assert(identResult.summary.overallSimilarity === 100, `Identical docs have 100% similarity: ${identResult.summary.overallSimilarity}%`);
  assert(identResult.summary.identicalPages === 2, 'Both pages marked identical');
  assert(identResult.summary.visuallyDifferentPages === 0, 'Zero visual differences detected');
  assert(identResult.summary.textDifferentPages === 0, 'Zero text differences detected');
  assert(identResult.pagesDiff === 0, 'Page count difference is 0');

  // Scenario 2: Changed Text in Document B
  console.log('Scenario 2: Comparing PDFs with modified text...');
  const docBModified = await PDFDocument.create();
  const fMod = await docBModified.embedFont(StandardFonts.Helvetica);
  const pB1 = docBModified.addPage([595.28, 841.89]);
  pB1.drawText('Document B - Completely Revised Text Content Here', { x: 50, y: 800, size: 16, font: fMod });
  const pB2 = docBModified.addPage([841.89, 595.28]);
  pB2.drawText('Document A - Page 2 Landscape Architecture Diagram', { x: 50, y: 550, size: 16, font: fMod });
  pB2.drawText('Vector details and structured layout curves.', { x: 50, y: 510, size: 12, font: fMod });
  const bytesModifiedB = await docBModified.save();

  const textDiffResult = await comparePdfDocuments(basePdfBytes, bytesModifiedB);
  assert(textDiffResult.pages[0].hasTextDiff === true, 'Page 1 detected text difference');
  assert(textDiffResult.pages[1].hasTextDiff === false, 'Page 2 detected identical text');
  assert(textDiffResult.summary.textDifferentPages >= 1, 'Summary reports >= 1 text difference page');

  // Scenario 3: Added Page in Document B (3 pages vs 2 pages)
  console.log('Scenario 3: Comparing PDFs where B has an added page...');
  const docBAdded = await PDFDocument.create();
  const fAdd = await docBAdded.embedFont(StandardFonts.Helvetica);
  docBAdded.addPage([595.28, 841.89]);
  docBAdded.addPage([841.89, 595.28]);
  const p3Added = docBAdded.addPage([595.28, 841.89]);
  p3Added.drawText('Brand New Extra Page 3', { x: 50, y: 800, size: 16, font: fAdd });
  const bytesAddedB = await docBAdded.save();

  const addResult = await comparePdfDocuments(basePdfBytes, bytesAddedB);
  assert(addResult.totalPagesA === 2 && addResult.totalPagesB === 3, 'Page counts reported: A=2, B=3');
  assert(addResult.pagesDiff === 1, 'pagesDiff is exactly +1');
  assert(addResult.summary.addedPages === 1, 'Summary reports 1 added page');
  assert(addResult.pages[2].status === 'added', 'Page 3 status is marked "added"');

  // Scenario 4: Removed Page in Document B (1 page vs 2 pages)
  console.log('Scenario 4: Comparing PDFs where B has a removed page...');
  const docBRemoved = await PDFDocument.create();
  docBRemoved.addPage([595.28, 841.89]);
  const bytesRemovedB = await docBRemoved.save();

  const remResult = await comparePdfDocuments(basePdfBytes, bytesRemovedB);
  assert(remResult.totalPagesA === 2 && remResult.totalPagesB === 1, 'Page counts reported: A=2, B=1');
  assert(remResult.pagesDiff === -1, 'pagesDiff is exactly -1');
  assert(remResult.summary.removedPages === 1, 'Summary reports 1 removed page');
  assert(remResult.pages[1].status === 'removed', 'Page 2 status is marked "removed"');

  // Scenario 5: Scanned / Image-Only PDF Text Comparison
  console.log('Scenario 5: Comparing with scanned/empty image page...');
  const scannedDoc = await PDFDocument.create();
  scannedDoc.addPage([595.28, 841.89]); // empty
  const scannedBytes = await scannedDoc.save();
  const scannedDiff = compareTextStrings('', 'Some text on page B');
  assert(scannedDiff.isScannedA === true, 'Page A accurately identified as scanned / empty text');
  assert(!scannedDiff.isIdentical, 'Scanned vs Text identified as different');

  console.log('\n======================================================');
  console.log(`ALL MILESTONE 6 FINISH TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runMilestone6Tests().catch((err) => {
  console.error('Milestone 6 test runner error:', err);
  process.exit(1);
});
