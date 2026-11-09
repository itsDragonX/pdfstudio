import { PDFDocument } from 'pdf-lib';

/**
 * Safely converts any supported PDF input (File, Blob, ArrayBuffer, Uint8Array,
 * IndexedDB record, or application wrapper) into an independent, non-empty Uint8Array.
 * Validates file size and the presence of the standard %PDF- header magic bytes.
 * @param {any} input - Raw PDF input
 * @param {string} [label='Document'] - Descriptive label for error reporting
 * @returns {Promise<Uint8Array>}
 */
export async function normalizeToUint8Array(input, label = 'Document') {
  if (input === null || input === undefined) {
    throw new Error(`Cannot load ${label}: input is empty or undefined.`);
  }

  let bytes = null;

  // 1. Unwrap application document objects (e.g. { bytes, file, data, buffer })
  if (
    typeof input === 'object' &&
    !(input instanceof Uint8Array) &&
    !(input instanceof ArrayBuffer) &&
    !(typeof Blob !== 'undefined' && input instanceof Blob)
  ) {
    const candidate = input.bytes || input.file || input.data || input.buffer;
    const name = input.name || label;
    if (candidate) {
      return normalizeToUint8Array(candidate, name);
    }
    throw new Error(`Unsupported document structure for "${label}". Expected a valid PDF buffer or File.`);
  }

  // 2. Handle File or Blob
  if (typeof Blob !== 'undefined' && input instanceof Blob) {
    if (input.size === 0) {
      throw new Error(`"${label}" is an empty file (0 bytes).`);
    }
    try {
      const buffer = await input.arrayBuffer();
      bytes = new Uint8Array(buffer);
    } catch (readErr) {
      throw new Error(`Failed to read data from "${label}": ${readErr.message}`);
    }
  }
  // 3. Handle ArrayBuffer
  else if (input instanceof ArrayBuffer) {
    if (input.byteLength === 0) {
      throw new Error(`"${label}" contains an empty ArrayBuffer (0 bytes).`);
    }
    bytes = new Uint8Array(input.slice(0));
  }
  // 4. Handle Uint8Array (or typed array)
  else if (input instanceof Uint8Array || ArrayBuffer.isView(input)) {
    if (input.byteLength === 0) {
      throw new Error(`"${label}" contains empty data (0 bytes).`);
    }
    // Make an independent copy to protect against external detached buffers
    bytes = new Uint8Array(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength));
  } else {
    throw new Error(`Cannot load "${label}": unsupported data type (${typeof input}).`);
  }

  // 5. Validate PDF Magic Header (%PDF-)
  // According to ISO 32000-1, %PDF- must appear in the first 1024 bytes of any valid PDF
  const limit = Math.min(bytes.byteLength, 1024);
  let hasPdfHeader = false;
  for (let i = 0; i <= limit - 5; i++) {
    if (
      bytes[i] === 0x25 && // %
      bytes[i + 1] === 0x50 && // P
      bytes[i + 2] === 0x44 && // D
      bytes[i + 3] === 0x46 && // F
      bytes[i + 4] === 0x2D    // -
    ) {
      hasPdfHeader = true;
      break;
    }
  }

  if (!hasPdfHeader) {
    throw new Error(`"${label}" is not a valid PDF file (missing "%PDF-" header).`);
  }

  return bytes;
}

/**
 * Safe loader for PDF documents with clear error handling for encrypted/unsupported files.
 * @param {any} input - Raw PDF input (Uint8Array, ArrayBuffer, Blob, File, or Document record)
 * @param {string} [label='Document'] - Descriptive label for error reporting
 * @returns {Promise<PDFDocument>}
 */
export async function safeLoadPDF(input, label = 'Document') {
  try {
    const uint8 = await normalizeToUint8Array(input, label);
    return await PDFDocument.load(uint8, { ignoreEncryption: false });
  } catch (error) {
    const msg = error?.message || '';
    if (msg.includes('encrypted') || msg.includes('password')) {
      throw new Error(`"${label}" is password-protected or encrypted. Encrypted PDFs are not supported.`);
    }
    if (msg.includes('missing "%PDF-" header') || msg.includes('No PDF header found')) {
      throw new Error(`"${label}" is not a valid PDF document (missing %PDF- header).`);
    }
    throw new Error(msg || `Failed to load "${label}".`);
  }
}

/**
 * Triggers a browser download for a Uint8Array or Blob.
 * @param {Uint8Array | Blob} data 
 * @param {string} filename 
 * @param {string} mimeType 
 */
export function triggerDownload(data, filename, mimeType = 'application/pdf') {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Parses and strictly validates a page range expression (e.g. "1-3, 5, 8-10").
 * @param {string} rangeStr - User input string
 * @param {number} totalPages - Total number of pages in the document
 * @returns {{ isValid: boolean, groups: Array<{ label: string, indices: number[], pageNumbers: number[] }>, error: string | null }}
 */
export function parsePageRanges(rangeStr, totalPages) {
  if (!rangeStr || typeof rangeStr !== 'string' || !rangeStr.trim()) {
    return { isValid: false, groups: [], error: 'Please enter at least one page or range.' };
  }

  const parts = rangeStr.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) {
    return { isValid: false, groups: [], error: 'Please enter a valid page range.' };
  }

  const groups = [];

  for (const part of parts) {
    // Check if it's a range like "1-3" or a single page like "5"
    if (part.includes('-')) {
      const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (!rangeMatch) {
        return { isValid: false, groups: [], error: `Invalid range format: "${part}". Use "1-3" or "5".` };
      }

      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);

      if (start < 1) {
        return { isValid: false, groups: [], error: `Start page must be at least 1 (got ${start}).` };
      }
      if (start > totalPages) {
        return { isValid: false, groups: [], error: `Start page ${start} exceeds total pages (${totalPages}).` };
      }
      if (end < start) {
        return { isValid: false, groups: [], error: `Range start (${start}) cannot be greater than end (${end}).` };
      }
      if (end > totalPages) {
        return { isValid: false, groups: [], error: `End page ${end} exceeds total pages (${totalPages}).` };
      }

      const indices = [];
      const pageNumbers = [];
      for (let p = start; p <= end; p++) {
        indices.push(p - 1); // 0-based index
        pageNumbers.push(p);
      }

      groups.push({
        label: `${start}-${end}`,
        indices,
        pageNumbers
      });
    } else {
      const pageMatch = part.match(/^(\d+)$/);
      if (!pageMatch) {
        return { isValid: false, groups: [], error: `Invalid page number: "${part}".` };
      }

      const pageNum = parseInt(pageMatch[1], 10);
      if (pageNum < 1) {
        return { isValid: false, groups: [], error: `Page number must be at least 1 (got ${pageNum}).` };
      }
      if (pageNum > totalPages) {
        return { isValid: false, groups: [], error: `Page ${pageNum} exceeds total pages (${totalPages}).` };
      }

      groups.push({
        label: `${pageNum}`,
        indices: [pageNum - 1],
        pageNumbers: [pageNum]
      });
    }
  }

  return { isValid: true, groups, error: null };
}

