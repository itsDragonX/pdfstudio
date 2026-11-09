import { PDFDocument, PDFName } from 'pdf-lib';
import { normalizeToUint8Array } from '../../organise/services/pageOperations.js';

/**
 * Format a Date object to YYYY-MM-DD string for input[type="date"]
 */
export function formatDateForInput(date) {
  if (!date || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Reads all standard Info dictionary fields and XMP presence from a PDF document.
 * 
 * @param {Uint8Array | ArrayBuffer | Blob | File} pdfInput
 * @returns {Promise<{
 *   title: string,
 *   author: string,
 *   subject: string,
 *   keywords: string[],
 *   keywordsString: string,
 *   creator: string,
 *   producer: string,
 *   creationDate: Date | null,
 *   creationDateFormatted: string,
 *   modificationDate: Date | null,
 *   modificationDateFormatted: string,
 *   hasXmp: boolean,
 *   detectedFields: Array<{ key: string, label: string, value: string }>,
 *   pageCount: number,
 *   fileSize: number
 * }>}
 */
export async function readDocumentMetadata(pdfInput) {
  const rawBytes = await normalizeToUint8Array(pdfInput, 'Read Document Metadata');
  const pdfDoc = await PDFDocument.load(rawBytes, { updateMetadata: false, ignoreEncryption: true });

  const title = pdfDoc.getTitle() || '';
  const author = pdfDoc.getAuthor() || '';
  const subject = pdfDoc.getSubject() || '';
  const rawKeywords = pdfDoc.getKeywords();
  const keywords = Array.isArray(rawKeywords)
    ? rawKeywords
    : (typeof rawKeywords === 'string' && rawKeywords.trim() ? rawKeywords.split(/[,;\s]+/).filter(Boolean) : []);
  const keywordsString = Array.isArray(rawKeywords) ? rawKeywords.join(', ') : (rawKeywords || '');
  const creator = pdfDoc.getCreator() || '';
  const producer = pdfDoc.getProducer() || '';
  const creationDate = pdfDoc.getCreationDate() || null;
  const modificationDate = pdfDoc.getModificationDate() || null;

  // Check XMP stream in catalog
  let hasXmp = false;
  try {
    const catalogRef = pdfDoc.context.trailerInfo?.Root;
    if (catalogRef) {
      const catalog = pdfDoc.context.lookup(catalogRef);
      if (catalog && typeof catalog.has === 'function') {
        hasXmp = catalog.has(PDFName.of('Metadata'));
      }
    }
  } catch {
    hasXmp = false;
  }

  const detectedFields = [];
  if (title) detectedFields.push({ key: 'title', label: 'Title', value: title });
  if (author) detectedFields.push({ key: 'author', label: 'Author', value: author });
  if (subject) detectedFields.push({ key: 'subject', label: 'Subject', value: subject });
  if (keywords.length > 0) detectedFields.push({ key: 'keywords', label: 'Keywords', value: keywordsString });
  if (creator) detectedFields.push({ key: 'creator', label: 'Creator', value: creator });
  if (producer) detectedFields.push({ key: 'producer', label: 'Producer', value: producer });
  if (creationDate) detectedFields.push({ key: 'creationDate', label: 'Creation Date', value: creationDate.toLocaleString() });
  if (modificationDate) detectedFields.push({ key: 'modificationDate', label: 'Modification Date', value: modificationDate.toLocaleString() });
  if (hasXmp) detectedFields.push({ key: 'xmp', label: 'XMP Metadata Stream', value: 'Embedded XML' });

  return {
    title,
    author,
    subject,
    keywords,
    keywordsString,
    creator,
    producer,
    creationDate,
    creationDateFormatted: formatDateForInput(creationDate),
    modificationDate,
    modificationDateFormatted: formatDateForInput(modificationDate),
    hasXmp,
    detectedFields,
    pageCount: pdfDoc.getPageCount(),
    fileSize: rawBytes.byteLength
  };
}

/**
 * Updates metadata fields in the PDF document and verifies persistence.
 * 
 * @param {Uint8Array | ArrayBuffer | Blob | File} pdfInput
 * @param {object} updates
 * @returns {Promise<{
 *   bytes: Uint8Array,
 *   updatedMetadata: object,
 *   verifiedMetadata: object,
 *   filename: string
 * }>}
 */
export async function updateDocumentMetadata(pdfInput, updates = {}, baseFilename = 'document.pdf') {
  const rawBytes = await normalizeToUint8Array(pdfInput, 'Update Document Metadata');
  const pdfDoc = await PDFDocument.load(rawBytes, { updateMetadata: false, ignoreEncryption: true });

  if (updates.title !== undefined) pdfDoc.setTitle(updates.title);
  if (updates.author !== undefined) pdfDoc.setAuthor(updates.author);
  if (updates.subject !== undefined) pdfDoc.setSubject(updates.subject);

  if (updates.keywords !== undefined) {
    const kws = Array.isArray(updates.keywords)
      ? updates.keywords
      : updates.keywords.split(',').map((s) => s.trim()).filter(Boolean);
    pdfDoc.setKeywords(kws);
  }

  if (updates.creator !== undefined) pdfDoc.setCreator(updates.creator);
  if (updates.producer !== undefined) pdfDoc.setProducer(updates.producer);

  if (updates.creationDate) {
    const d = new Date(updates.creationDate);
    if (!isNaN(d.getTime())) pdfDoc.setCreationDate(d);
  }

  // Always update modification date to current timestamp
  if (updates.modificationDate) {
    const d = new Date(updates.modificationDate);
    if (!isNaN(d.getTime())) pdfDoc.setModificationDate(d);
  } else {
    pdfDoc.setModificationDate(new Date());
  }

  const outputBytes = await pdfDoc.save({ useObjectStreams: true });

  // Post-save verification: reload output and read metadata
  const verifiedMetadata = await readDocumentMetadata(outputBytes);

  const cleanBase = baseFilename.replace(/\.pdf$/i, '');
  const filename = `${cleanBase}_metadata.pdf`;

  return {
    bytes: outputBytes,
    updatedMetadata: updates,
    verifiedMetadata,
    filename
  };
}

/**
 * Completely strips all standard Info dictionary fields and Catalog XMP streams.
 * Re-reads and verifies absence of all metadata.
 * 
 * @param {Uint8Array | ArrayBuffer | Blob | File} pdfInput
 * @returns {Promise<{
 *   bytes: Uint8Array,
 *   originalDetected: Array<{ key: string, label: string, value: string }>,
 *   verifiedClean: boolean,
 *   removedFields: string[],
 *   remainingFields: string[],
 *   filename: string
 * }>}
 */
export async function removeDocumentMetadata(pdfInput, baseFilename = 'document.pdf') {
  const rawBytes = await normalizeToUint8Array(pdfInput, 'Remove Document Metadata');

  // Read pre-removal state
  const beforeState = await readDocumentMetadata(rawBytes);

  const pdfDoc = await PDFDocument.load(rawBytes, { updateMetadata: false, ignoreEncryption: true });

  // 1. High-level setters to empty strings / arrays
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setSubject('');
  pdfDoc.setKeywords([]);
  pdfDoc.setCreator('');
  pdfDoc.setProducer('');

  // 2. Low-level Info dictionary wiping
  try {
    const infoRef = pdfDoc.context.trailerInfo?.Info;
    if (infoRef) {
      const infoDict = pdfDoc.context.lookup(infoRef);
      if (infoDict && typeof infoDict.delete === 'function') {
        infoDict.delete(PDFName.of('Title'));
        infoDict.delete(PDFName.of('Author'));
        infoDict.delete(PDFName.of('Subject'));
        infoDict.delete(PDFName.of('Keywords'));
        infoDict.delete(PDFName.of('Creator'));
        infoDict.delete(PDFName.of('Producer'));
        infoDict.delete(PDFName.of('CreationDate'));
        infoDict.delete(PDFName.of('ModDate'));
        infoDict.delete(PDFName.of('Trapped'));
      }
    }
    // Delete Info reference completely from trailer dictionary
    if (pdfDoc.context.trailerInfo) {
      delete pdfDoc.context.trailerInfo.Info;
    }
  } catch (err) {
    console.warn('Low-level Info dictionary clearing warning:', err);
  }

  // 3. Low-level Catalog XMP metadata deletion
  try {
    const catalogRef = pdfDoc.context.trailerInfo?.Root;
    if (catalogRef) {
      const catalog = pdfDoc.context.lookup(catalogRef);
      if (catalog && typeof catalog.delete === 'function') {
        catalog.delete(PDFName.of('Metadata'));
        catalog.delete(PDFName.of('PieceInfo'));
      }
    }
  } catch (err) {
    console.warn('Low-level XMP catalog clearing warning:', err);
  }

  const outputBytes = await pdfDoc.save({ useObjectStreams: true });

  // 4. Post-removal verification: reload and inspect
  const afterState = await readDocumentMetadata(outputBytes);

  const removedFields = [];
  const remainingFields = [];

  for (const field of beforeState.detectedFields) {
    const afterMatch = afterState.detectedFields.find((f) => f.key === field.key);
    if (!afterMatch || !afterMatch.value || afterMatch.value.trim() === '') {
      removedFields.push(field.label);
    } else {
      remainingFields.push(field.label);
    }
  }

  const verifiedClean = remainingFields.length === 0;

  const cleanBase = baseFilename.replace(/\.pdf$/i, '');
  const filename = `${cleanBase}_cleaned.pdf`;

  return {
    bytes: outputBytes,
    originalDetected: beforeState.detectedFields,
    verifiedClean,
    removedFields,
    remainingFields,
    afterState,
    filename
  };
}
