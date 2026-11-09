import React from 'react';
import { 
  Highlighter, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Info 
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useEditContext } from '../context/EditContext.jsx';
import { useEdit } from '../hooks/useEdit.js';

const HIGHLIGHT_COLORS = [
  { hex: '#FFE033', name: 'Yellow' },
  { hex: '#5CD65C', name: 'Green' },
  { hex: '#33C5FF', name: 'Cyan' },
  { hex: '#FF66B2', name: 'Pink' },
  { hex: '#FFA633', name: 'Orange' },
  { hex: '#D488FF', name: 'Purple' }
];

export default function HighlightPanel() {
  const { numPages, setActiveToolId } = useDocument();
  const { targetPageIndex, setTargetPageIndex, editPayload, updateEditPayload } = useEditContext();
  const { handleApplyHighlights, isProcessing, error, successMessage } = useEdit();

  const color = editPayload.color ?? '#FFE033';
  const opacity = editPayload.opacity ?? 0.35;
  const highlights = editPayload.highlights ?? [];
  const pageHighlights = highlights.filter((h) => (h.pageIndex ?? targetPageIndex) === targetPageIndex);

  const handleClearHighlights = () => {
    updateEditPayload({
      highlights: highlights.filter((h) => (h.pageIndex ?? targetPageIndex) !== targetPageIndex)
    });
  };

  const handleRemoveOne = (index) => {
    const updated = [...highlights];
    const globalIdx = highlights.findIndex((h, i) => (h.pageIndex ?? targetPageIndex) === targetPageIndex && i === index);
    if (globalIdx !== -1) {
      updated.splice(globalIdx, 1);
      updateEditPayload({ highlights: updated });
    }
  };

  const onExecuteApply = async () => {
    try {
      await handleApplyHighlights();
    } catch {
      // Handled by hook
    }
  };

  return (
    <div className="organise-tool-panel edit-highlight-panel">
      <div className="organise-panel-desc">
        Click and drag across text to create translucent colored highlighter overlays.
      </div>

      {error && (
        <div className="organise-banner banner-error" role="alert">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="organise-banner banner-success" role="status">
          <CheckCircle2 size={14} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Target Page */}
      <div className="property-group">
        <label className="property-label" htmlFor="highlight-target-page">Target Page</label>
        <select 
          id="highlight-target-page"
          className="select-field"
          value={targetPageIndex}
          onChange={(e) => setTargetPageIndex(parseInt(e.target.value, 10))}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <option key={i} value={i}>
              Page {i + 1} of {numPages}
            </option>
          ))}
        </select>
      </div>

      {/* Highlighter Color Palette */}
      <div className="property-group">
        <label className="property-label">Highlighter Color</label>
        <div className="color-swatches-grid">
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              className={`color-swatch-circle highlight-swatch ${color === c.hex ? 'active' : ''}`}
              style={{ backgroundColor: c.hex }}
              onClick={() => updateEditPayload({ color: c.hex })}
              title={c.name}
              aria-label={`Highlight color ${c.name}`}
            />
          ))}
        </div>
      </div>

      {/* Opacity Slider */}
      <div className="property-group">
        <div className="property-label-row">
          <label className="property-label" htmlFor="highlight-opacity">Transparency</label>
          <span className="property-value-badge">{Math.round(opacity * 100)}%</span>
        </div>
        <input
          id="highlight-opacity"
          type="range"
          min="0.15"
          max="0.80"
          step="0.05"
          value={opacity}
          onChange={(e) => updateEditPayload({ opacity: parseFloat(e.target.value) })}
          className="slider-range"
        />
      </div>

      {/* Active Highlights on this page */}
      <div className="property-group">
        <div className="property-label-row">
          <label className="property-label">Page Highlights</label>
          <span className="badge-count-pill">{pageHighlights.length}</span>
        </div>

        {pageHighlights.length === 0 ? (
          <div className="organise-info-box">
            <Info size={13} className="info-icon" />
            <div className="info-text">
              Drag anywhere over page {targetPageIndex + 1} to create your first highlight box.
            </div>
          </div>
        ) : (
          <div className="edit-items-list">
            {pageHighlights.map((h, idx) => (
              <div key={idx} className="edit-item-row">
                <div 
                  className="edit-item-color-preview"
                  style={{ backgroundColor: h.color || color, opacity: h.opacity || opacity }}
                />
                <span className="edit-item-desc">
                  Highlight #{idx + 1} ({Math.round(h.width)}×{Math.round(h.height)} pt)
                </span>
                <button
                  type="button"
                  className="btn-icon-subtle text-danger"
                  onClick={() => handleRemoveOne(idx)}
                  title="Delete this highlight"
                  aria-label={`Delete highlight ${idx + 1}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleClearHighlights}
              style={{ marginTop: '6px' }}
            >
              Clear All Page Highlights
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="organise-action-footer">
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={onExecuteApply}
          disabled={isProcessing || pageHighlights.length === 0}
        >
          {isProcessing ? (
            <>
              <Loader2 size={14} className="spin-icon" />
              <span>Applying Highlights...</span>
            </>
          ) : (
            <>
              <Highlighter size={14} />
              <span>Apply {pageHighlights.length} Highlight{pageHighlights.length === 1 ? '' : 's'}</span>
            </>
          )}
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => setActiveToolId(null)}
          disabled={isProcessing}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

