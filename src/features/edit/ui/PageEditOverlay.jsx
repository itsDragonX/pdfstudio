import React, { useState, useRef, useCallback } from 'react';
import { 
  X, 
  Move, 
  CornerDownRight, 
  ShieldAlert,
  Eraser,
  Highlighter
} from 'lucide-react';
import { useEditContext } from '../context/EditContext.jsx';
import {
  eventToViewportPoint,
  viewportToPdfPoint,
  pdfToViewportPoint,
  pdfRectToScreenRect,
  screenRectToPdfRect
} from '../utils/coordinateConversion.js';

export default function PageEditOverlay({ pageNumber, viewport, pageElementRef }) {
  const { 
    isEditActive, 
    activeEditTool, 
    targetPageIndex, 
    setTargetPageIndex, 
    editPayload, 
    updateEditPayload 
  } = useEditContext();

  const pageIndex = pageNumber - 1;
  const isTargetPage = pageIndex === targetPageIndex;

  // Interaction tracking
  const [isDrawingDrag, setIsDrawingDrag] = useState(false);
  const [dragStart, setDragStart] = useState(null); // { vx, vy }
  const [dragCurrent, setDragCurrent] = useState(null); // { vx, vy }
  const [activeStroke, setActiveStroke] = useState([]); // [{ x, y }] in PDF points

  // Repositioning drag for single objects (text, image, sign)
  const [isRepositioning, setIsRepositioning] = useState(false);
  const repositionOffset = useRef({ dx: 0, dy: 0 });

  if (!isEditActive) return null;

  // If this page is not active target, render a click-to-select veil
  if (!isTargetPage) {
    return (
      <div 
        className="page-edit-inactive-veil"
        onClick={() => setTargetPageIndex(pageIndex)}
        title={`Click to edit Page ${pageNumber}`}
      >
        <span className="veil-pill">Click to Edit Page {pageNumber}</span>
      </div>
    );
  }

  // --- Pointer Down ---
  const handlePointerDown = (e) => {
    // Only respond to primary mouse button
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Prevent default scrolling on touch devices during drawing
    e.preventDefault();

    const { vx, vy } = eventToViewportPoint(e, pageElementRef.current);
    const pdfPt = viewportToPdfPoint(vx, vy, viewport);

    switch (activeEditTool) {
      case 'add-text': {
        // Place text box at clicked location (clamped to page)
        updateEditPayload({ x: pdfPt.x, y: pdfPt.y });
        break;
      }
      case 'add-image': {
        if (!editPayload.previewUrl) break;
        updateEditPayload({
          x: Math.max(0, pdfPt.x - (editPayload.width || 200) / 2),
          y: Math.max(0, pdfPt.y - (editPayload.height || 150) / 2)
        });
        break;
      }
      case 'sign': {
        if (!editPayload.previewUrl) break;
        updateEditPayload({
          x: Math.max(0, pdfPt.x - (editPayload.width || 180) / 2),
          y: Math.max(0, pdfPt.y - (editPayload.height || 60) / 2)
        });
        break;
      }
      case 'draw': {
        setIsDrawingDrag(true);
        setActiveStroke([pdfPt]);
        break;
      }
      case 'highlight':
      case 'whiteout':
      case 'redact':
      case 'shapes': {
        setIsDrawingDrag(true);
        setDragStart({ vx, vy });
        setDragCurrent({ vx, vy });
        break;
      }
      default:
        break;
    }
  };

  // --- Pointer Move ---
  const handlePointerMove = (e) => {
    if (!isDrawingDrag) return;
    e.preventDefault();

    const { vx, vy } = eventToViewportPoint(e, pageElementRef.current);

    if (activeEditTool === 'draw') {
      const pdfPt = viewportToPdfPoint(vx, vy, viewport);
      setActiveStroke((prev) => [...prev, pdfPt]);
    } else {
      setDragCurrent({ vx, vy });
    }
  };

  // --- Pointer Up ---
  const handlePointerUp = (e) => {
    if (!isDrawingDrag) return;
    e.preventDefault();
    setIsDrawingDrag(false);

    if (activeEditTool === 'draw') {
      if (activeStroke.length > 1) {
        const completed = {
          points: activeStroke,
          color: editPayload.color || '#000000',
          width: editPayload.width || 3,
          opacity: editPayload.opacity || 1.0,
          pageIndex
        };
        updateEditPayload((prev) => ({
          ...prev,
          strokes: [...(prev.strokes || []), completed]
        }));
      }
      setActiveStroke([]);
      return;
    }

    if (!dragStart || !dragCurrent) return;

    // Calculate box in screen pixels
    const minX = Math.min(dragStart.vx, dragCurrent.vx);
    const minY = Math.min(dragStart.vy, dragCurrent.vy);
    const w = Math.abs(dragCurrent.vx - dragStart.vx);
    const h = Math.abs(dragCurrent.vy - dragStart.vy);

    setDragStart(null);
    setDragCurrent(null);

    // Minimum drag threshold (5px) to avoid accidental micro-clicks
    if (w < 5 || h < 5) return;

    const pdfRect = screenRectToPdfRect({ left: minX, top: minY, width: w, height: h }, viewport);

    switch (activeEditTool) {
      case 'highlight': {
        const item = {
          x: pdfRect.x,
          y: pdfRect.y,
          width: pdfRect.width,
          height: pdfRect.height,
          color: editPayload.color || '#FFE033',
          opacity: editPayload.opacity || 0.35,
          pageIndex
        };
        updateEditPayload((prev) => ({
          ...prev,
          highlights: [...(prev.highlights || []), item]
        }));
        break;
      }
      case 'whiteout': {
        const item = {
          x: pdfRect.x,
          y: pdfRect.y,
          width: pdfRect.width,
          height: pdfRect.height,
          color: editPayload.color || '#FFFFFF',
          pageIndex
        };
        updateEditPayload((prev) => ({
          ...prev,
          regions: [...(prev.regions || []), item]
        }));
        break;
      }
      case 'redact': {
        const item = {
          x: pdfRect.x,
          y: pdfRect.y,
          width: pdfRect.width,
          height: pdfRect.height,
          pageIndex
        };
        updateEditPayload((prev) => ({
          ...prev,
          regions: [...(prev.regions || []), item]
        }));
        break;
      }
      case 'shapes': {
        updateEditPayload({
          x: pdfRect.x,
          y: pdfRect.y,
          width: pdfRect.width,
          height: pdfRect.height
        });
        break;
      }
      default:
        break;
    }
  };

  // --- Deletion Helpers ---
  const removeHighlight = (idx) => {
    updateEditPayload((prev) => {
      const items = [...(prev.highlights || [])];
      items.splice(idx, 1);
      return { ...prev, highlights: items };
    });
  };

  const removeWhiteout = (idx) => {
    updateEditPayload((prev) => {
      const items = [...(prev.regions || [])];
      items.splice(idx, 1);
      return { ...prev, regions: items };
    });
  };

  const removeRedaction = (idx) => {
    updateEditPayload((prev) => {
      const items = [...(prev.regions || [])];
      items.splice(idx, 1);
      return { ...prev, regions: items };
    });
  };

  // Convert an array of PDF points to SVG polyline string in viewport pixels
  const pointsToSvgString = (pts) => {
    if (!pts || pts.length === 0) return '';
    return pts
      .map((pt) => {
        const v = pdfToViewportPoint(pt.x, pt.y, viewport);
        return `${v.vx},${v.vy}`;
      })
      .join(' ');
  };

  // Drag-in-progress rectangle
  let activeDragRect = null;
  if (isDrawingDrag && dragStart && dragCurrent && activeEditTool !== 'draw') {
    const left = Math.min(dragStart.vx, dragCurrent.vx);
    const top = Math.min(dragStart.vy, dragCurrent.vy);
    const width = Math.abs(dragCurrent.vx - dragStart.vx);
    const height = Math.abs(dragCurrent.vy - dragStart.vy);
    activeDragRect = { left, top, width, height };
  }

  // --- RENDER VISUAL OVERLAYS ---

  // 1. Add Text Preview Box
  const renderTextPreview = () => {
    if (activeEditTool !== 'add-text') return null;
    const vPos = pdfToViewportPoint(editPayload.x ?? 100, editPayload.y ?? 650, viewport);
    const scale = viewport.scale || 1.0;
    const scaledFontSize = Math.max(10, Math.round((editPayload.fontSize || 18) * scale));

    return (
      <div
        className="canvas-interactive-element text-interactive-box"
        style={{
          left: `${vPos.vx}px`,
          top: `${vPos.vy}px`,
          fontFamily: editPayload.fontName || 'Helvetica, sans-serif',
          fontSize: `${scaledFontSize}px`,
          color: editPayload.color || '#007AFF',
          textAlign: editPayload.alignment || 'left',
          opacity: editPayload.opacity || 1.0
        }}
      >
        <div className="interactive-drag-handle" title="Drag to reposition">
          <Move size={12} />
          <span>Text Box</span>
        </div>
        <div className="interactive-text-body">
          {editPayload.text || 'Sample Text'}
        </div>
      </div>
    );
  };

  // 2. Add Image Preview Box
  const renderImagePreview = () => {
    if (activeEditTool !== 'add-image' || !editPayload.previewUrl) return null;
    const screenRect = pdfRectToScreenRect(
      {
        x: editPayload.x ?? 100,
        y: editPayload.y ?? 500,
        width: editPayload.width ?? 200,
        height: editPayload.height ?? 150
      },
      viewport
    );

    return (
      <div
        className="canvas-interactive-element image-interactive-box"
        style={{
          left: `${screenRect.left}px`,
          top: `${screenRect.top}px`,
          width: `${screenRect.width}px`,
          height: `${screenRect.height}px`,
          opacity: editPayload.opacity || 1.0
        }}
      >
        <div className="interactive-drag-handle">
          <Move size={12} />
          <span>Image</span>
        </div>
        <img
          src={editPayload.previewUrl}
          alt="Preview"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transform: `rotate(${editPayload.rotation || 0}deg)`,
            pointerEvents: 'none'
          }}
        />
      </div>
    );
  };

  // 3. Highlight Rectangles
  const renderHighlights = () => {
    const list = (editPayload.highlights || []).filter(
      (h) => (h.pageIndex ?? targetPageIndex) === pageIndex
    );

    return list.map((h, i) => {
      const screenRect = pdfRectToScreenRect(h, viewport);
      return (
        <div
          key={`highlight-${i}`}
          className="canvas-overlay-rect highlight-overlay-rect"
          style={{
            left: `${screenRect.left}px`,
            top: `${screenRect.top}px`,
            width: `${screenRect.width}px`,
            height: `${screenRect.height}px`,
            backgroundColor: h.color || '#FFE033',
            opacity: h.opacity || 0.35
          }}
        >
          <button
            type="button"
            className="canvas-remove-badge"
            onClick={(e) => {
              e.stopPropagation();
              removeHighlight(i);
            }}
            title="Remove Highlight"
            aria-label="Remove Highlight"
          >
            <X size={10} />
          </button>
        </div>
      );
    });
  };

  // 4. Drawing Strokes (SVG)
  const renderStrokes = () => {
    const completedStrokes = (editPayload.strokes || []).filter(
      (s) => (s.pageIndex ?? targetPageIndex) === pageIndex
    );

    return (
      <svg className="canvas-drawing-svg-layer" width={viewport.width} height={viewport.height}>
        {completedStrokes.map((s, idx) => (
          <polyline
            key={`stroke-${idx}`}
            points={pointsToSvgString(s.points)}
            stroke={s.color || '#000000'}
            strokeWidth={(s.width || 3) * viewport.scale}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={s.opacity || 1.0}
            fill="none"
          />
        ))}
        {/* Real-time active drawing stroke */}
        {isDrawingDrag && activeEditTool === 'draw' && activeStroke.length > 1 && (
          <polyline
            points={pointsToSvgString(activeStroke)}
            stroke={editPayload.color || '#000000'}
            strokeWidth={(editPayload.width || 3) * viewport.scale}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={editPayload.opacity || 1.0}
            fill="none"
          />
        )}
      </svg>
    );
  };

  // 5. Shapes Preview
  const renderShapePreview = () => {
    if (activeEditTool !== 'shapes') return null;
    const screenRect = pdfRectToScreenRect(
      {
        x: editPayload.x ?? 100,
        y: editPayload.y ?? 500,
        width: editPayload.width ?? 150,
        height: editPayload.height ?? 90
      },
      viewport
    );

    const shape = editPayload.shapeType || 'rectangle';
    const stroke = editPayload.strokeColor || '#007AFF';
    const strokeW = Math.max(1, (editPayload.strokeWidth || 2) * viewport.scale);
    const fill = editPayload.fillColor || 'transparent';
    const opacity = editPayload.opacity || 1.0;

    return (
      <svg 
        className="canvas-shape-preview-layer" 
        style={{
          position: 'absolute',
          left: `${screenRect.left}px`,
          top: `${screenRect.top}px`,
          width: `${screenRect.width}px`,
          height: `${screenRect.height}px`,
          pointerEvents: 'none',
          opacity
        }}
      >
        {shape === 'rectangle' && (
          <rect
            x={strokeW / 2}
            y={strokeW / 2}
            width={Math.max(1, screenRect.width - strokeW)}
            height={Math.max(1, screenRect.height - strokeW)}
            stroke={stroke}
            strokeWidth={strokeW}
            fill={fill}
            rx={2}
          />
        )}
        {shape === 'circle' && (
          <ellipse
            cx={screenRect.width / 2}
            cy={screenRect.height / 2}
            rx={Math.max(1, (screenRect.width - strokeW) / 2)}
            ry={Math.max(1, (screenRect.height - strokeW) / 2)}
            stroke={stroke}
            strokeWidth={strokeW}
            fill={fill}
          />
        )}
        {shape === 'line' && (
          <line
            x1={0}
            y1={0}
            x2={screenRect.width}
            y2={screenRect.height}
            stroke={stroke}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        )}
        {shape === 'arrow' && (
          <g>
            <defs>
              <marker
                id="arrowhead-preview"
                markerWidth="8"
                markerHeight="6"
                refX="6"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill={stroke} />
              </marker>
            </defs>
            <line
              x1={0}
              y1={0}
              x2={screenRect.width}
              y2={screenRect.height}
              stroke={stroke}
              strokeWidth={strokeW}
              strokeLinecap="round"
              markerEnd="url(#arrowhead-preview)"
            />
          </g>
        )}
      </svg>
    );
  };

  // 6. Whiteout Boxes
  const renderWhiteouts = () => {
    const list = (editPayload.regions || []).filter(
      (r) => activeEditTool === 'whiteout' && (r.pageIndex ?? targetPageIndex) === pageIndex
    );

    return list.map((r, i) => {
      const screenRect = pdfRectToScreenRect(r, viewport);
      return (
        <div
          key={`whiteout-${i}`}
          className="canvas-overlay-rect whiteout-overlay-rect"
          style={{
            left: `${screenRect.left}px`,
            top: `${screenRect.top}px`,
            width: `${screenRect.width}px`,
            height: `${screenRect.height}px`,
            backgroundColor: r.color || '#FFFFFF'
          }}
        >
          <button
            type="button"
            className="canvas-remove-badge"
            onClick={(e) => {
              e.stopPropagation();
              removeWhiteout(i);
            }}
            title="Remove Whiteout Mask"
            aria-label="Remove Whiteout"
          >
            <X size={10} />
          </button>
        </div>
      );
    });
  };

  // 7. Redaction Boxes
  const renderRedactions = () => {
    const list = (editPayload.regions || []).filter(
      (r) => activeEditTool === 'redact' && (r.pageIndex ?? targetPageIndex) === pageIndex
    );

    return list.map((r, i) => {
      const screenRect = pdfRectToScreenRect(r, viewport);
      return (
        <div
          key={`redact-${i}`}
          className="canvas-overlay-rect redact-overlay-rect"
          style={{
            left: `${screenRect.left}px`,
            top: `${screenRect.top}px`,
            width: `${screenRect.width}px`,
            height: `${screenRect.height}px`
          }}
        >
          <span className="redact-rect-label">REDACT</span>
          <button
            type="button"
            className="canvas-remove-badge"
            onClick={(e) => {
              e.stopPropagation();
              removeRedaction(i);
            }}
            title="Remove Redaction Box"
            aria-label="Remove Redaction"
          >
            <X size={10} />
          </button>
        </div>
      );
    });
  };

  // 8. Signature Preview Box
  const renderSignaturePreview = () => {
    if (activeEditTool !== 'sign' || !editPayload.previewUrl) return null;
    const screenRect = pdfRectToScreenRect(
      {
        x: editPayload.x ?? 150,
        y: editPayload.y ?? 200,
        width: editPayload.width ?? 180,
        height: editPayload.height ?? 60
      },
      viewport
    );

    return (
      <div
        className="canvas-interactive-element sign-interactive-box"
        style={{
          left: `${screenRect.left}px`,
          top: `${screenRect.top}px`,
          width: `${screenRect.width}px`,
          height: `${screenRect.height}px`
        }}
      >
        <div className="interactive-drag-handle">
          <Move size={12} />
          <span>Signature</span>
        </div>
        <img
          src={editPayload.previewUrl}
          alt="Signature"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none'
          }}
        />
      </div>
    );
  };

  return (
    <div
      className={`page-edit-overlay-container tool-${activeEditTool}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Visual Renderers */}
      {renderHighlights()}
      {renderStrokes()}
      {renderShapePreview()}
      {renderWhiteouts()}
      {renderRedactions()}
      {renderTextPreview()}
      {renderImagePreview()}
      {renderSignaturePreview()}

      {/* Dragging In Progress Indicator Rectangle */}
      {activeDragRect && (
        <div
          className={`active-drag-rect drag-mode-${activeEditTool}`}
          style={{
            left: `${activeDragRect.left}px`,
            top: `${activeDragRect.top}px`,
            width: `${activeDragRect.width}px`,
            height: `${activeDragRect.height}px`
          }}
        />
      )}
    </div>
  );
}

