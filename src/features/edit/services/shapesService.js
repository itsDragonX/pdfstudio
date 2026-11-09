import { safeLoadPDF } from '../../organise/services/pageOperations.js';
import { parseColorToPdfRgb } from '../utils/colorUtils.js';

/**
 * Adds vector geometric shapes (Rectangle, Circle/Ellipse, Line, Arrow) to PDF pages.
 * 
 * @param {Uint8Array | ArrayBuffer} pdfInput - Source PDF bytes
 * @param {object} options
 * @param {Array<{ pageIndex: number, shapeType: 'rectangle'|'circle'|'line'|'arrow', x: number, y: number, width: number, height: number, strokeColor?: string, strokeWidth?: number, fillColor?: string|null, opacity?: number }>} options.shapes
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number }>}
 */
export async function addShapesToPDF(pdfInput, options) {
  const { shapes = [] } = options || {};

  if (!Array.isArray(shapes) || shapes.length === 0) {
    throw new Error('Please select or create at least one shape.');
  }

  const doc = await safeLoadPDF(pdfInput, 'Shapes');
  const pages = doc.getPages();

  for (const s of shapes) {
    const pageIndex = s.pageIndex ?? 0;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;

    const page = pages[pageIndex];
    const strokeWidth = s.strokeWidth !== undefined ? Math.max(0.5, s.strokeWidth) : 2;
    const strokeColor = s.strokeColor ? parseColorToPdfRgb(s.strokeColor) : undefined;
    const fillColor = s.fillColor ? parseColorToPdfRgb(s.fillColor) : undefined;
    const opacity = s.opacity !== undefined ? Math.max(0.05, Math.min(1.0, s.opacity)) : 1.0;

    const shapeType = s.shapeType || 'rectangle';

    if (shapeType === 'rectangle') {
      page.drawRectangle({
        x: s.x,
        y: s.y,
        width: Math.max(2, Math.abs(s.width)),
        height: Math.max(2, Math.abs(s.height)),
        borderColor: strokeColor,
        borderWidth: strokeColor ? strokeWidth : 0,
        color: fillColor,
        opacity
      });
    } else if (shapeType === 'circle') {
      const rx = Math.max(1, Math.abs(s.width) / 2);
      const ry = Math.max(1, Math.abs(s.height) / 2);
      page.drawEllipse({
        x: s.x + rx,
        y: s.y + ry,
        xScale: rx,
        yScale: ry,
        borderColor: strokeColor,
        borderWidth: strokeColor ? strokeWidth : 0,
        color: fillColor,
        opacity
      });
    } else if (shapeType === 'line') {
      page.drawLine({
        start: { x: s.x, y: s.y },
        end: { x: s.x + s.width, y: s.y + s.height },
        thickness: strokeWidth,
        color: strokeColor || parseColorToPdfRgb('#000000'),
        opacity
      });
    } else if (shapeType === 'arrow') {
      const startX = s.x;
      const startY = s.y;
      const endX = s.x + s.width;
      const endY = s.y + s.height;

      const arrowColor = strokeColor || parseColorToPdfRgb('#000000');

      // 1. Draw shaft
      page.drawLine({
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
        thickness: strokeWidth,
        color: arrowColor,
        opacity
      });

      // 2. Draw arrowhead
      const dx = endX - startX;
      const dy = endY - startY;
      const angle = Math.atan2(dy, dx);
      const headLength = Math.max(10, strokeWidth * 3.5);
      const headAngle = Math.PI / 6; // 30 degrees

      const arrowPoint1 = {
        x: endX - headLength * Math.cos(angle - headAngle),
        y: endY - headLength * Math.sin(angle - headAngle)
      };

      const arrowPoint2 = {
        x: endX - headLength * Math.cos(angle + headAngle),
        y: endY - headLength * Math.sin(angle + headAngle)
      };

      page.drawLine({
        start: { x: endX, y: endY },
        end: arrowPoint1,
        thickness: strokeWidth,
        color: arrowColor,
        opacity
      });

      page.drawLine({
        start: { x: endX, y: endY },
        end: arrowPoint2,
        thickness: strokeWidth,
        color: arrowColor,
        opacity
      });
    }
  }

  const modifiedBytes = await doc.save();
  return {
    bytes: modifiedBytes,
    pageCount: pages.length
  };
}

