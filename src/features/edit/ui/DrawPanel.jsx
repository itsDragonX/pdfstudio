import React from 'react';
import { 
  PenTool, 
  RotateCcw, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Info,
  Minus,
  Plus
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useEditContext } from '../context/EditContext.jsx';
import { useEdit } from '../hooks/useEdit.js';

const PEN_COLORS = [
  '#000000',
  '#007AFF',
  '#FF3B30',
  '#34C759',
  '#FF9500',
  '#5856D6',
  '#AF52DE',
  '#FFFFFF'
];

export default function DrawPanel() {
  const { numPages, setActiveToolId } = useDocument();
  const { targetPageIndex, setTargetPageIndex, editPayload, updateEditPayload } = useEditContext();
  const { handleApplyDraw, isProcessing, error, successMessage } = useEdit();

  const color = editPayload.color ?? '#000000';
  const width = editPayload.width ?? 3;
  const opacity = editPayload.opacity ?? 1.0;
  const strokes = editPayload.strokes ?? [];
  const pageStrokes = strokes.filter((s) => (s.pageIndex ?? targetPageIndex) === targetPageIndex);

  const handleColorChange = (c) => {
    updateEditPayload({ color: c });
  };

  const handleWidthChange = (delta) => {
    const nextW = Math.max(1, Math.min(24, width + delta));
    updateEditPayload({ width: nextW });
  };

  const handleUndoStroke = () => {
    if (pageStrokes.length === 0) return;
    const lastIdx = strokes.map((s, i) => ({ s, i })).reverse().find(({ s }) => (s.pageIndex ?? targetPageIndex) === targetPageIndex)?.i;
    if (lastIdx !== undefined) {
      const updated = [...strokes];
      updated.splice(lastIdx, 1);
      updateEditPayload({ strokes: updated });
    }
  };

  const handleClearStrokes = () => {
    updateEditPayload({
      strokes: strokes.filter((s) => (s.pageIndex ?? targetPageIndex) !== targetPageIndex)
    });
  };

  const onExecuteApply = async () => {
    try {
      await handleApplyDraw();
    } catch {
      // Handled by hook
    }
  };

  return (
    <div className="organise-tool-panel edit-draw-panel">
      <div className="organise-panel-desc">
        Freehand pen drawing tool. Creates lightweight smooth vector lines on the page.
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
        <label className="property-label" htmlFor="draw-target-page">Target Page</label>
        <select 
          id="draw-target-page"
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

      {/* Stroke Color Palette */}
      <div className="property-group">
        <label className="property-label">Pen Color</label>
        <div className="color-swatches-grid">
          {PEN_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`color-swatch-circle ${color.toUpperCase() === c.toUpperCase() ? 'active' : ''}`}
              style={{ backgroundColor: c, border: c === '#FFFFFF' ? '1px solid #CCC' : undefined }}
              onClick={() => handleColorChange(c)}
              aria-label={`Select pen color ${c}`}
            />
          ))}
          <input
            type="color"
            value={color.startsWith('#') ? color : '#000000'}
            onChange={(e) => handleColorChange(e.target.value)}
            className="color-custom-input"
            title="Custom Color"
            aria-label="Custom Color Picker"
          />
        </div>
      </div>

      {/* Stroke Width Stepper */}
      <div className="property-group">
        <label className="property-label">Stroke Thickness</label>
        <div className="stepper-row">
          <button
            type="button"
            className="stepper-btn"
            onClick={() => handleWidthChange(-1)}
            disabled={width <= 1}
            aria-label="Decrease thickness"
          >
            <Minus size={14} />
          </button>
          <div className="draw-preview-line-box">
            <div 
              style={{ 
                height: `${width}px`, 
                backgroundColor: color, 
                borderRadius: '4px',
                width: '60px' 
              }} 
            />
            <span className="stepper-value">{width} px</span>
          </div>
          <button
            type="button"
            className="stepper-btn"
            onClick={() => handleWidthChange(1)}
            disabled={width >= 24}
            aria-label="Increase thickness"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Opacity */}
      <div className="property-group">
        <div className="property-label-row">
          <label className="property-label" htmlFor="draw-opacity">Opacity</label>
          <span className="property-value-badge">{Math.round(opacity * 100)}%</span>
        </div>
        <input
          id="draw-opacity"
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={opacity}
          onChange={(e) => updateEditPayload({ opacity: parseFloat(e.target.value) })}
          className="slider-range"
        />
      </div>

      {/* Stroke Count & Actions */}
      <div className="property-group">
        <div className="property-label-row">
          <label className="property-label">Drawn Strokes</label>
          <span className="badge-count-pill">{pageStrokes.length}</span>
        </div>

        {pageStrokes.length === 0 ? (
          <div className="organise-info-box">
            <Info size={13} className="info-icon" />
            <div className="info-text">
              Draw directly with your mouse or trackpad over page {targetPageIndex + 1}.
            </div>
          </div>
        ) : (
          <div className="button-group-row">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleUndoStroke}
              title="Undo last drawn stroke"
            >
              <RotateCcw size={13} />
              <span>Undo Last</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm text-danger"
              onClick={handleClearStrokes}
              title="Clear all strokes"
            >
              <Trash2 size={13} />
              <span>Clear Page</span>
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
          disabled={isProcessing || pageStrokes.length === 0}
        >
          {isProcessing ? (
            <>
              <Loader2 size={14} className="spin-icon" />
              <span>Saving Drawing...</span>
            </>
          ) : (
            <>
              <PenTool size={14} />
              <span>Apply {pageStrokes.length} Stroke{pageStrokes.length === 1 ? '' : 's'}</span>
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

