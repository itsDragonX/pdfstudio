import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Generates an offline multi-page sample PDF for testing and demonstration.
 * @param {number} pageCount Number of sample pages to generate (default 3)
 * @returns {Promise<Uint8Array>}
 */
export async function generateSamplePDF(pageCount = 3) {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let i = 1; i <= pageCount; i++) {
    const page = pdfDoc.addPage([595.28, 841.89]); // Standard A4 points
    const { width, height } = page.getSize();

    // Header banner
    page.drawRectangle({
      x: 0,
      y: height - 60,
      width: width,
      height: 60,
      color: rgb(0.06, 0.09, 0.16) // #0f172a
    });

    page.drawText('PDF STUDIO — Offline Sample Document', {
      x: 40,
      y: height - 38,
      size: 16,
      font: helveticaBold,
      color: rgb(1, 1, 1)
    });

    // Page title
    page.drawText(`Page ${i} of ${pageCount}`, {
      x: 40,
      y: height - 110,
      size: 20,
      font: helveticaBold,
      color: rgb(0.88, 0.11, 0.28) // #e11d48
    });

    // Content body
    page.drawText('This sample document is generated locally inside PDF Studio on your device.', {
      x: 40,
      y: height - 150,
      size: 12,
      font: helvetica,
      color: rgb(0.2, 0.2, 0.2)
    });

    page.drawText('Key Architectural Verifications:', {
      x: 40,
      y: height - 190,
      size: 13,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1)
    });

    const checks = [
      '1. 100% Offline client-side rendering via PDF.js worker',
      '2. Fast multi-page canvas rendering with zoom & pan navigation',
      '3. Page thumbnail extraction and synchronized viewport scrolling',
      '4. Zero external network requests or remote API dependencies',
      '5. Built for private offline document manipulation and workflows'
    ];

    checks.forEach((checkText, idx) => {
      page.drawText(checkText, {
        x: 55,
        y: height - 220 - idx * 25,
        size: 11,
        font: timesRomanFont,
        color: rgb(0.25, 0.25, 0.3)
      });
    });

    // Footer
    page.drawLine({
      start: { x: 40, y: 50 },
      end: { x: width - 40, y: 50 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8)
    });

    page.drawText(`PDF Studio Client Engine • Confidential Test Sample • Page ${i}`, {
      x: 40,
      y: 35,
      size: 9,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5)
    });
  }

  return await pdfDoc.save();
}

