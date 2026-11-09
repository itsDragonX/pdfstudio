import React from 'react';
import { 
  Square, 
  Circle, 
  Minus, 
  MoveRight, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Plus, 
  Crosshair,
  Ban
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useEditContext } from '../context/EditContext.jsx';
import { useEdit } from '../hooks/useEdit.js';

const SHAPES = [
  { id: 'rectangle', label: 'Rectangle', icon: Square },
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'line', label: 'Line', icon: Minus },
  { id: 'arrow', label: 'Arrow', icon: MoveRight }
];

const PRESET_STROKE_COLORS = [
  '#007AFF',
  '#FF3B30',
  '#34C759',
  '#FF9500',
  '#5856D6',
  '#000000',
  '#8E8E93'
];

const PRESET_FILL_COLORS = [
  '#007AFF',
  '#FF3B30',
  '#34C759',
  '#FF9500',
  '#FFE033',
  '#FFFFFF',
  '#000000'
];

export default function ShapesPanel() {
  const { numPages, setActiveToolId } = useDocument();
  const { targetPageIndex, setTargetPageIndex, editPayload, updateEditPayload } = useEditContext();
  const { handleApplyShape, isProcessing, error, successMessage } = useEdit();

  const shapeType = editPayload.shapeType ?? 'rectangle';
  const strokeColor = editPayload.strokeColor ?? '#007AFF';
  const strokeWidth = editPayload.strokeWidth ?? 2;
  const fillColor = editPayload.fillColor ?? null;
  const opacity = editPayload.opacity ?? 1.0;
  const x = Math.round(editPayload.x ?? 100);
  const y = Math.round(editPayload.y ?? 500);
  const width = Math.round(editPayload.width ?? 150);
  const height = Math.round(editPayload.height ?? 90);

  const handleShapeSelect = (type) => {
    updateEditPayload({ shapeType: type });
  };

  const handleStrokeWidthChange = (delta) => {
    const nextW = Math.max(1, Math.min(20, strokeWidth + delta));
    updateEditPayload({ strokeWidth: nextW });
  };

  const onExecuteApply = async () => {
    try {
      await handleApplyShape();
    } catch {
      // Handled by hook
    }
  };

  return (
    <div className="organise-tool-panel edit-shapes-panel">
      <div className="organise-panel-desc">
        Insert scalable vector shapes: rectangles, circles, lines and directional arrows.
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
        <label className="property-label" htmlFor="shape-target-page">Target Page</label>
        <select 
          id="shape-target-page"
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

      {/* Shape Selector */}
      <div className="property-group">
        <label className="property-label">Shape Type</label>
        <div className="organise-segmented-control shape-selector-control" role="group" aria-label="Shape type">
          {SHAPES.map((s) => {
            const Icon = s.icon;
            const isActive = shapeType === s.id;
            return (
              <button
                key={s.id}
                type="button"
                className={`segmented-pill ${isActive ? 'active' : ''}`}
                onClick={() => handleShapeSelect(s.id)}
                title={s.label}
                aria-label={s.label}
              >
                <Icon size={14} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stroke Color */}
      <div className="property-group">
        <label className="property-label">Stroke Color</label>
        <div className="color-swatches-grid">
          {PRESET_STROKE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`color-swatch-circle ${strokeColor.toUpperCase() === c.toUpperCase() ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => updateEditPayload({ strokeColor: c })}
              aria-label={`Stroke color ${c}`}
            />
          ))}
          <input
            type="color"
            value={strokeColor.startsWith('#') ? strokeColor : '#007AFF'}
            onChange={(e) => updateEditPayload({ strokeColor: e.target.value })}
            className="color-custom-input"
            title="Custom Stroke Color"
            aria-label="Custom Stroke Color"
          />
        </div>
      </div>

      {/* Stroke Width */}
      <div className="property-group">
        <label className="property-label">Stroke Thickness</label>
        <div className="stepper-row">
          <button
            type="button"
            className="stepper-btn"
            onClick={() => handleStrokeWidthChange(-1)}
            disabled={strokeWidth <= 1}
            aria-label="Decrease stroke thickness"
          >
            <Minus size={14} />
          </button>
          <span className="stepper-value">{strokeWidth} pt</span>
          <button
            type="button"
            className="stepper-btn"
            onClick={() => handleStrokeWidthChange(1)}
            disabled={strokeWidth >= 20}
            aria-label="Increase stroke thickness"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Fill Color (for Rectangle and Circle) */}
      {(shapeType === 'rectangle' || shapeType === 'circle') && (
        <div className="property-group">
          <label className="property-label">Fill Color</label>
          <div className="color-swatches-grid">
            {/* Transparent / None option */}
            <button
              type="button"
              className={`color-swatch-circle swatch-transparent ${fillColor === null ? 'active' : ''}`}
              onClick={() => updateEditPayload({ fillColor: null })}
              title="Transparent (No fill)"
              aria-label="Transparent fill"
            >
              <Ban size={13} className="text-muted" />
            </button>
            {PRESET_FILL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-swatch-circle ${fillColor?.toUpperCase() === c.toUpperCase() ? 'active' : ''}`}
                style={{ backgroundColor: c, border: c === '#FFFFFF' ? '1px solid #CCC' : undefined }}
                onClick={() => updateEditPayload({ fillColor: c })}
                aria-label={`Fill color ${c}`}
              />
            ))}
            <input
              type="color"
              value={fillColor?.startsWith('#') ? fillColor : '#007AFF'}
              onChange={(e) => updateEditPayload({ fillColor: e.target.value })}
              className="color-custom-input"
              title="Custom Fill Color"
              aria-label="Custom Fill Color"
            />
          </div>
        </div>
      )}

      {/* Opacity */}
      <div className="property-group">
        <div className="property-label-row">
          <label className="property-label" htmlFor="shape-opacity">Opacity</label>
          <span className="property-value-badge">{Math.round(opacity * 100)}%</span>
        </div>
        <input
          id="shape-opacity"
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={opacity}
          onChange={(e) => updateEditPayload({ opacity: parseFloat(e.target.value) })}
          className="slider-range"
        />
      </div>

      {/* Placement Info */}
      <div className="organise-info-box">
        <Crosshair size={13} className="info-icon" />
        <div className="info-text">
          <strong>Shape Bounds:</strong> {width} × {height} pt at ({x}, {y}). Click and drag on page {targetPageIndex + 1} to size and position.
        </div>
      </div>

      {/* Action Buttons */}
      <div className="organise-action-footer">
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={onExecuteApply}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 size={14} className="spin-icon" />
              <span>Applying Shape...</span>
            </>
          ) : (
            <>
              <Square size={14} />
              <span>Apply {shapeType} to Page {targetPageIndex + 1}</span>
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

