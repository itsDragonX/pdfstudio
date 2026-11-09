/**
 * Coordinate Conversion Utilities for PDF Studio
 * Bridges the gap between:
 * 1. Screen / Browser pointer coordinates (top-left origin, Y downwards)
 * 2. PDF.js Viewport coordinates (scaled, rotated, Y downwards)
 * 3. PDF User-Space coordinates in pdf-lib (unscaled, bottom-left origin, Y upwards in 72 DPI points)
 */

/**
 * Converts a browser mouse/pointer event on a page wrapper element into viewport coordinates.
 * @param {MouseEvent | PointerEvent | { clientX: number, clientY: number }} event
 * @param {HTMLElement} pageElement - The container DOM element (e.g. #page-wrapper-1)
 * @returns {{ vx: number, vy: number }}
 */
export function eventToViewportPoint(event, pageElement) {
  if (!pageElement) return { vx: 0, vy: 0 };
  const rect = pageElement.getBoundingClientRect();
  const vx = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
  const vy = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
  return { vx, vy };
}

/**
 * Converts Viewport coordinates (screen pixels on canvas) to PDF User Space coordinates (pdf-lib points).
 * Leverages PDF.js viewport.convertToPdfPoint for 100% rotation & CropBox accuracy.
 * @param {number} vx - Viewport X
 * @param {number} vy - Viewport Y
 * @param {any} viewport - PDF.js PageViewport object
 * @returns {{ x: number, y: number }} PDF user-space coordinates
 */
export function viewportToPdfPoint(vx, vy, viewport) {
  if (!viewport || typeof viewport.convertToPdfPoint !== 'function') {
    // Fallback if viewport is unavailable
    return { x: vx, y: vy };
  }
  const [pdfX, pdfY] = viewport.convertToPdfPoint(vx, vy);
  return {
    x: +pdfX.toFixed(2),
    y: +pdfY.toFixed(2)
  };
}

/**
 * Converts PDF User Space coordinates (pdf-lib points) to Viewport coordinates (screen pixels).
 * @param {number} pdfX
 * @param {number} pdfY
 * @param {any} viewport - PDF.js PageViewport object
 * @returns {{ vx: number, vy: number }}
 */
export function pdfToViewportPoint(pdfX, pdfY, viewport) {
  if (!viewport || typeof viewport.convertToViewportPoint !== 'function') {
    return { vx: pdfX, vy: pdfY };
  }
  const [vx, vy] = viewport.convertToViewportPoint(pdfX, pdfY);
  return {
    vx: +vx.toFixed(2),
    vy: +vy.toFixed(2)
  };
}

/**
 * Converts a bounding box in PDF User Space { x, y, width, height }
 * to a screen-space rectangle { left, top, width, height } for rendering HTML/SVG overlays.
 * @param {{ x: number, y: number, width: number, height: number }} pdfRect
 * @param {any} viewport - PDF.js PageViewport object
 * @returns {{ left: number, top: number, width: number, height: number }}
 */
export function pdfRectToScreenRect(pdfRect, viewport) {
  if (!viewport || typeof viewport.convertToViewportPoint !== 'function') {
    return { left: pdfRect.x, top: pdfRect.y, width: pdfRect.width, height: pdfRect.height };
  }

  // PDF user space: (x, y) is bottom-left, (x + width, y + height) is top-right
  const [vx1, vy1] = viewport.convertToViewportPoint(pdfRect.x, pdfRect.y + pdfRect.height);
  const [vx2, vy2] = viewport.convertToViewportPoint(pdfRect.x + pdfRect.width, pdfRect.y);

  const left = Math.min(vx1, vx2);
  const top = Math.min(vy1, vy2);
  const width = Math.abs(vx2 - vx1);
  const height = Math.abs(vy2 - vy1);

  return {
    left: +left.toFixed(2),
    top: +top.toFixed(2),
    width: +width.toFixed(2),
    height: +height.toFixed(2)
  };
}

/**
 * Converts a screen-space rectangle { left, top, width, height }
 * back to PDF User Space { x, y, width, height } for passing to pdf-lib operations.
 * @param {{ left: number, top: number, width: number, height: number }} screenRect
 * @param {any} viewport - PDF.js PageViewport object
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function screenRectToPdfRect(screenRect, viewport) {
  if (!viewport || typeof viewport.convertToPdfPoint !== 'function') {
    return { x: screenRect.left, y: screenRect.top, width: screenRect.width, height: screenRect.height };
  }

  // Top-left in screen
  const [p1X, p1Y] = viewport.convertToPdfPoint(screenRect.left, screenRect.top);
  // Bottom-right in screen
  const [p2X, p2Y] = viewport.convertToPdfPoint(
    screenRect.left + screenRect.width,
    screenRect.top + screenRect.height
  );

  const x = Math.min(p1X, p2X);
  const y = Math.min(p1Y, p2Y);
  const width = Math.abs(p2X - p1X);
  const height = Math.abs(p2Y - p1Y);

  return {
    x: +x.toFixed(2),
    y: +y.toFixed(2),
    width: +width.toFixed(2),
    height: +height.toFixed(2)
  };
}

