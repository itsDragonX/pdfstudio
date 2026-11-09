import { PDFDocument } from 'pdf-lib';

/**
 * Safe loader for PDF documents with explicit error handling for encrypted files.
 * @param {Uint8Array | ArrayBuffer} bytes 
 * @returns {Promise<PDFDocument>}
 */
export async function loadPDFDocument(bytes) {
  try {
    return await PDFDocument.load(bytes, { ignoreEncryption: false });
  } catch (error) {
    const errorMsg = error?.message || '';
    if (errorMsg.includes('encrypted') || errorMsg.includes('password')) {
      throw new Error(
        'This document is password-protected or encrypted. Encrypted PDFs are not supported.'
      );
    }
    throw error;
  }
}

/**
 * Creates an empty PDF document.
 * @returns {Promise<PDFDocument>}
 */
export async function createEmptyPDFDocument() {
  return await PDFDocument.create();
}

