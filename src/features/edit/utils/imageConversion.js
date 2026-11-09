/**
 * Checks if a file or buffer is WebP format.
 * @param {File | Blob | Uint8Array} input
 * @returns {boolean}
 */
export function isWebP(input) {
  if (input instanceof File || input instanceof Blob) {
    if (input.type === 'image/webp' || input.name?.toLowerCase().endsWith('.webp')) {
      return true;
    }
  }
  if (input instanceof Uint8Array && input.byteLength >= 12) {
    // RIFF....WEBP magic bytes
    return (
      input[0] === 0x52 && input[1] === 0x49 && input[2] === 0x46 && input[3] === 0x46 &&
      input[8] === 0x57 && input[9] === 0x45 && input[10] === 0x42 && input[11] === 0x50
    );
  }
  return false;
}

/**
 * Converts a WebP File/Blob/Uint8Array to a PNG Uint8Array using the browser Canvas API.
 * Ensures genuine client-side conversion without external libraries.
 * @param {File | Blob | Uint8Array} input
 * @returns {Promise<{ bytes: Uint8Array, width: number, height: number, mimeType: 'image/png' }>}
 */
export async function convertWebPToPng(input) {
  return new Promise((resolve, reject) => {
    let blob;
    if (input instanceof Blob) {
      blob = input;
    } else {
      blob = new Blob([input], { type: 'image/webp' });
    }

    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(async (pngBlob) => {
          URL.revokeObjectURL(url);
          if (!pngBlob) {
            return reject(new Error('Failed to convert WebP image to PNG.'));
          }
          const buffer = await pngBlob.arrayBuffer();
          resolve({
            bytes: new Uint8Array(buffer),
            width: canvas.width,
            height: canvas.height,
            mimeType: 'image/png'
          });
        }, 'image/png');
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode WebP image data in browser.'));
    };

    img.src = url;
  });
}

/**
 * Normalizes an uploaded image (PNG, JPEG, WebP) into embedding-ready PNG or JPEG bytes.
 * @param {File | Blob} file
 * @returns {Promise<{ bytes: Uint8Array, format: 'png' | 'jpeg', width: number, height: number, dataUrl: string }>}
 */
export async function normalizeImageForPdf(file) {
  if (isWebP(file)) {
    const converted = await convertWebPToPng(file);
    const dataUrl = `data:image/png;base64,${bufferToBase64(converted.bytes)}`;
    return {
      bytes: converted.bytes,
      format: 'png',
      width: converted.width,
      height: converted.height,
      dataUrl
    };
  }

  // Standard PNG or JPEG
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const isPng = file.type === 'image/png' || file.name?.toLowerCase().endsWith('.png');
  const format = isPng ? 'png' : 'jpeg';

  // Read dimensions via browser Image
  const { width, height, dataUrl } = await getImageMetadata(file);

  return {
    bytes,
    format,
    width,
    height,
    dataUrl
  };
}

/**
 * Extracts natural image dimensions and data URL
 */
function getImageMetadata(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const meta = {
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        dataUrl: url
      };
      resolve(meta);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image "${file.name}".`));
    };
    img.src = url;
  });
}

function bufferToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

