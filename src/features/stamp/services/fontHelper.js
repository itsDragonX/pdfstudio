import { StandardFonts } from 'pdf-lib';

export const FONT_MAP = {
  Helvetica: StandardFonts.Helvetica,
  HelveticaBold: StandardFonts.HelveticaBold,
  TimesRoman: StandardFonts.TimesRoman,
  Courier: StandardFonts.Courier
};

/**
 * Embeds a standard PDF font into the document safely.
 * @param {import('pdf-lib').PDFDocument} doc
 * @param {string} fontName
 * @returns {Promise<import('pdf-lib').PDFFont>}
 */
export async function getStandardFont(doc, fontName = 'Helvetica') {
  const fontKey = FONT_MAP[fontName] || StandardFonts.Helvetica;
  return await doc.embedFont(fontKey);
}

