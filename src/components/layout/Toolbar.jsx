import React from 'react';
import { 
  PanelLeft, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2
} from 'lucide-react';
import { useDocument } from '../../app/store/DocumentContext';

export default function Toolbar() {
  const { 
    docFile, 
    numPages, 
    currentPage, 
    setCurrentPage, 
    zoom, 
    zoomIn, 
    zoomOut, 
    resetZoom, 
    setFit, 
    fitMode,
    showThumbnails, 
    setShowThumbnails 
  } = useDocument();

  if (!docFile || numPages === 0) {
    return null;
  }

  const handlePageInput = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1 && val <= numPages) {
      setCurrentPage(val);
    }
  };

  return (
    <div className="floating-glass-pill-toolbar editor-toolbar" role="toolbar" aria-label="Document Viewport Controls">
      {/* Panel toggle */}
      <div className="toolbar-cluster">
        <button
          type="button"
          className={`btn-pill-icon ${showThumbnails ? 'active' : ''}`}
          onClick={() => setShowThumbnails(!showThumbnails)}
          title="Toggle Page Thumbnails (T)"
          aria-label="Toggle Page Thumbnails"
        >
          <PanelLeft size={14} />
        </button>
      </div>

      <div className="toolbar-pill-divider" />

      {/* Page Navigation */}
      <div className="toolbar-cluster">
        <button
          type="button"
          className="btn-pill-icon"
          onClick={() => setCurrentPage(1)}
          disabled={currentPage <= 1}
          title="First Page (Home)"
          aria-label="First Page"
        >
          <ChevronsLeft size={14} />
        </button>
        <button
          type="button"
          className="btn-pill-icon"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
          title="Previous Page (PageUp)"
          aria-label="Previous Page"
        >
          <ChevronLeft size={14} />
        </button>

        <div className="toolbar-page-capsule">
          <input
            type="number"
            className="page-num-input"
            value={currentPage}
            onChange={handlePageInput}
            min={1}
            max={numPages}
            aria-label="Current page number"
          />
          <span className="page-total-caption">/ {numPages}</span>
        </div>

        <button
          type="button"
          className="btn-pill-icon"
          onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
          disabled={currentPage >= numPages}
          title="Next Page (PageDown)"
          aria-label="Next Page"
        >
          <ChevronRight size={14} />
        </button>
        <button
          type="button"
          className="btn-pill-icon"
          onClick={() => setCurrentPage(numPages)}
          disabled={currentPage >= numPages}
          title="Last Page (End)"
          aria-label="Last Page"
        >
          <ChevronsRight size={14} />
        </button>
      </div>

      <div className="toolbar-pill-divider" />

      {/* Zoom & Viewport */}
      <div className="toolbar-cluster">
        <button
          type="button"
          className="btn-pill-icon"
          onClick={zoomOut}
          disabled={zoom <= 0.25}
          title="Zoom Out (Ctrl -)"
          aria-label="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>

        <button
          type="button"
          className="btn-pill-metric zoom-metric-button"
          onClick={resetZoom}
          title="Reset Zoom to 100% (Ctrl 0)"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          className="btn-pill-icon"
          onClick={zoomIn}
          disabled={zoom >= 3.0}
          title="Zoom In (Ctrl +)"
          aria-label="Zoom In"
        >
          <ZoomIn size={14} />
        </button>

        <button
          type="button"
          className={`btn-pill-icon ${fitMode === 'width' ? 'active' : ''}`}
          onClick={() => setFit('width')}
          title="Fit to Width"
          aria-label="Fit to Width"
        >
          <Maximize2 size={14} />
        </button>

        <button
          type="button"
          className={`btn-pill-icon ${fitMode === 'page' ? 'active' : ''}`}
          onClick={() => setFit('page')}
          title="Fit Entire Page"
          aria-label="Fit Entire Page"
        >
          <Minimize2 size={14} />
        </button>
      </div>
    </div>
  );
}
