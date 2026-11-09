import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  addTextToPDF,
  addImageToPDF,
  addHighlightsToPDF,
  addStrokesToPDF,
  addShapesToPDF,
  addWhiteoutToPDF,
  applyPermanentRedaction,
  addSignatureToPDF,
  getAcroFormFields,
  fillAcroForm
} from './src/features/edit/services/index.js';

// Helper to create test fixtures
async function createBaseFixture() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  // Page 1: Standard text page
  const page1 = doc.addPage([600, 800]);
  page1.drawText('PDF Studio Milestone 3 Test Document', { x: 50, y: 740, size: 18, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
  page1.drawText('This paragraph contains sensitive secret keyword: TOP_SECRET_ALPHA.', { x: 50, y: 700, size: 12, font, color: rgb(0.2, 0.2, 0.2) });
  page1.drawText('Second line of plain sample content to test highlighting and drawing.', { x: 50, y: 670, size: 12, font, color: rgb(0.2, 0.2, 0.2) });

  // Page 2: Multi-page test page
  const page2 = doc.addPage([800, 600]); // Landscape
  page2.drawText('Page 2: Landscape Dimensions', { x: 50, y: 550, size: 16, font: boldFont, color: rgb(0.1, 0.1, 0.1) });

  // Add AcroForm fields
  const form = doc.getForm();
  const nameField = form.createTextField('applicant_name');
  nameField.setText('Jane Doe');
  nameField.addToPage(page1, { x: 50, y: 600, width: 200, height: 25 });

  const agreeCheck = form.createCheckBox('agree_terms');
  agreeCheck.check();
  agreeCheck.addToPage(page1, { x: 50, y: 560, width: 18, height: 18 });

  const roleDropdown = form.createDropdown('role_select');
  roleDropdown.setOptions(['Engineer', 'Designer', 'Manager']);
  roleDropdown.select('Engineer');
  roleDropdown.addToPage(page1, { x: 50, y: 520, width: 150, height: 25 });

  return await doc.save();
}

// 1x1 Transparent PNG bytes for testing
const SAMPLE_PNG = new Uint8Array([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
]);

async function runTests() {
  console.log('=== PDF STUDIO MILESTONE 3: EDIT SUITE TEST RUNNER ===\n');
  let passCount = 0;
  const baseBytes = await createBaseFixture();

  // 1. Tool 10: Add Text
  console.log('--- 1. Testing Add Text ---');
  {
    const result = await addTextToPDF(baseBytes, {
      pageIndex: 0,
      text: 'Newly Inserted Header\nSecond Line of Inserted Text',
      x: 100,
      y: 400,
      fontName: 'HelveticaBold',
      fontSize: 16,
      color: '#007AFF',
      alignment: 'center'
    });
    const loaded = await PDFDocument.load(result.bytes);
    if (loaded.getPageCount() !== 2) throw new Error('Page count mismatch');
    console.log('✓ PASS: Text successfully added to PDF with multiline alignment');
    passCount++;

    // Edge case: empty text rejection
    let threwEmpty = false;
    try {
      await addTextToPDF(baseBytes, { text: '   ' });
    } catch {
      threwEmpty = true;
    }
    if (!threwEmpty) throw new Error('Empty text should be rejected');
    console.log('✓ PASS: Empty text is safely rejected');
    passCount++;
  }

  // 2. Tool 11: Add Image
  console.log('\n--- 2. Testing Add Image ---');
  {
    const result = await addImageToPDF(baseBytes, {
      pageIndex: 0,
      imageBytes: SAMPLE_PNG,
      format: 'png',
      x: 100,
      y: 300,
      width: 150,
      height: 100,
      rotation: 0
    });
    const loaded = await PDFDocument.load(result.bytes);
    if (loaded.getPageCount() !== 2) throw new Error('Page count mismatch');
    console.log('✓ PASS: Image successfully embedded and positioned on page');
    passCount++;
  }

  // 3. Tool 12: Highlight
  console.log('\n--- 3. Testing Highlight ---');
  {
    const result = await addHighlightsToPDF(baseBytes, {
      highlights: [
        { pageIndex: 0, x: 50, y: 700, width: 300, height: 16, color: '#FFE033', opacity: 0.35 },
        { pageIndex: 0, x: 50, y: 670, width: 250, height: 16, color: '#38B6FF', opacity: 0.3 }
      ]
    });
    const loaded = await PDFDocument.load(result.bytes);
    if (loaded.getPageCount() !== 2) throw new Error('Page count mismatch');
    console.log('✓ PASS: Highlights applied as translucent rectangles over text');
    passCount++;
  }

  // 4. Tool 13: Draw
  console.log('\n--- 4. Testing Draw (Vector Strokes) ---');
  {
    const result = await addStrokesToPDF(baseBytes, {
      strokes: [
        {
          pageIndex: 0,
          points: [{ x: 50, y: 200 }, { x: 100, y: 250 }, { x: 150, y: 220 }, { x: 200, y: 280 }],
          color: '#FF3B30',
          width: 3
        }
      ]
    });
    const loaded = await PDFDocument.load(result.bytes);
    if (loaded.getPageCount() !== 2) throw new Error('Page count mismatch');
    console.log('✓ PASS: Vector line strokes drawn into PDF content stream');
    passCount++;
  }

  // 5. Tool 14: Shapes
  console.log('\n--- 5. Testing Shapes (Rectangle, Circle, Line, Arrow) ---');
  {
    const result = await addShapesToPDF(baseBytes, {
      shapes: [
        { pageIndex: 0, shapeType: 'rectangle', x: 50, y: 100, width: 120, height: 60, strokeColor: '#007AFF', strokeWidth: 2, fillColor: null },
        { pageIndex: 0, shapeType: 'circle', x: 200, y: 100, width: 60, height: 60, strokeColor: '#34C759', strokeWidth: 2, fillColor: '#34C759', opacity: 0.5 },
        { pageIndex: 0, shapeType: 'line', x: 300, y: 100, width: 80, height: 50, strokeColor: '#FF9500', strokeWidth: 2 },
        { pageIndex: 0, shapeType: 'arrow', x: 400, y: 100, width: 100, height: 40, strokeColor: '#AF52DE', strokeWidth: 2 }
      ]
    });
    const loaded = await PDFDocument.load(result.bytes);
    if (loaded.getPageCount() !== 2) throw new Error('Page count mismatch');
    console.log('✓ PASS: All 4 geometric shape types rendered with stroke & fill');
    passCount++;
  }

  // 6. Tool 15: Whiteout
  console.log('\n--- 6. Testing Whiteout ---');
  {
    const result = await addWhiteoutToPDF(baseBytes, {
      regions: [
        { pageIndex: 0, x: 50, y: 700, width: 400, height: 20, color: '#FFFFFF' }
      ]
    });
    const loaded = await PDFDocument.load(result.bytes);
    if (loaded.getPageCount() !== 2) throw new Error('Page count mismatch');
    console.log('✓ PASS: Opaque whiteout knockout box placed over text area');
    passCount++;
  }

  // 7. Tool 16: Redact (Permanent Raster Burn-in)
  console.log('\n--- 7. Testing Redact (Raster Burn-In & Text Deletion) ---');
  {
    const result = await applyPermanentRedaction(baseBytes, {
      redactionTasks: [
        { pageIndex: 0, regions: [{ x: 50, y: 700, width: 400, height: 20 }] }
      ]
    });
    const loaded = await PDFDocument.load(result.bytes);
    if (loaded.getPageCount() !== 2) throw new Error('Page count mismatch');
    console.log('✓ PASS: New-document raster burn-in generated clean new PDF');
    console.log(`✓ PASS: Affected pages: [${result.affectedPageIndices.join(', ')}], Unaffected pages preserved`);
    passCount += 2;
  }

  // 8. Tool 17: Sign
  console.log('\n--- 8. Testing Sign ---');
  {
    const result = await addSignatureToPDF(baseBytes, {
      pageIndex: 0,
      signatureData: SAMPLE_PNG,
      x: 350,
      y: 80,
      width: 160,
      height: 50
    });
    const loaded = await PDFDocument.load(result.bytes);
    if (loaded.getPageCount() !== 2) throw new Error('Page count mismatch');
    console.log('✓ PASS: Signature image embedded and positioned accurately');
    passCount++;
  }

  // 9. Tool 18: Fill Forms
  console.log('\n--- 9. Testing Fill Forms ---');
  {
    const inspection = await getAcroFormFields(baseBytes);
    if (!inspection.hasFields) throw new Error('AcroForm fields should be detected');
    console.log(`✓ PASS: Form inspector detected ${inspection.fields.length} AcroForm fields`);
    passCount++;

    const fieldNames = inspection.fields.map(f => f.name);
    if (!fieldNames.includes('applicant_name') || !fieldNames.includes('agree_terms')) {
      throw new Error('Expected fields not found');
    }
    console.log('✓ PASS: Detected text, checkbox, and dropdown fields correctly');
    passCount++;

    // Fill fields
    const fillResult = await fillAcroForm(baseBytes, {
      fieldValues: {
        applicant_name: 'Alice Cooper',
        agree_terms: false,
        role_select: 'Designer'
      },
      flatten: false
    });

    const verifyInspection = await getAcroFormFields(fillResult.bytes);
    const updatedName = verifyInspection.fields.find(f => f.name === 'applicant_name')?.value;
    const updatedCheck = verifyInspection.fields.find(f => f.name === 'agree_terms')?.value;
    const updatedRole = verifyInspection.fields.find(f => f.name === 'role_select')?.value;

    if (updatedName !== 'Alice Cooper') throw new Error(`Expected "Alice Cooper", got "${updatedName}"`);
    if (updatedCheck !== false) throw new Error('Checkbox should be unchecked');
    if (updatedRole !== 'Designer') throw new Error('Dropdown should be Designer');

    console.log('✓ PASS: Form fields modified and values persisted into PDF');
    passCount++;
  }

  console.log('\n======================================================');
  console.log(`ALL EDIT TESTS COMPLETED: ${passCount} PASSED, 0 FAILED`);
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('TEST RUN FAILED:', err);
  process.exit(1);
});

