import React from 'react';
import { 
  Type, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Plus, 
  Minus,
  Crosshair
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useEditContext } from '../context/EditContext.jsx';
import { useEdit } from '../hooks/useEdit.js';

const FONT_OPTIONS = [
  { id: 'Helvetica', label: 'Helvetica (Sans-Serif)' },
  { id: 'HelveticaBold', label: 'Helvetica Bold' },
  { id: 'TimesRoman', label: 'Times Roman (Serif)' },
  { id: 'Courier', label: 'Courier (Monospace)' }
];

const PRESET_COLORS = [
  '#000000',
  '#333333',
  '#007AFF',
  '#5856D6',
  '#AF52DE',
  '#FF3B30',
  '#34C759',
  '#FF9500'
];

export default function AddTextPanel() {
  const { numPages, setActiveToolId } = useDocument();
  const { targetPageIndex, setTargetPageIndex, editPayload, updateEditPayload } = useEditContext();
  const { handleApplyText, isProcessing, error, successMessage } = useEdit();

  const text = editPayload.text ?? 'Sample Text';
  const fontName = editPayload.fontName ?? 'Helvetica';
  const fontSize = editPayload.fontSize ?? 18;
  const color = editPayload.color ?? '#007AFF';
  const alignment = editPayload.alignment ?? 'left';
  const opacity = editPayload.opacity ?? 1.0;
  const x = Math.round(editPayload.x ?? 100);
  const y = Math.round(editPayload.y ?? 650);

  const handleTextChange = (e) => {
    updateEditPayload({ text: e.target.value });
  };

  const handleFontChange = (e) => {
    updateEditPayload({ fontName: e.target.value });
  };

  const handleFontSizeChange = (delta) => {
    const nextSize = Math.max(8, Math.min(96, fontSize + delta));
    updateEditPayload({ fontSize: nextSize });
  };

  const handleColorSelect = (c) => {
    updateEditPayload({ color: c });
  };

  const handleAlignmentChange = (align) => {
    updateEditPayload({ alignment: align });
  };

  const handleOpacityChange = (e) => {
    updateEditPayload({ opacity: parseFloat(e.target.value) });
  };

  const handlePageChange = (e) => {
    const pageIdx = parseInt(e.target.value, 10);
    setTargetPageIndex(pageIdx);
  };

  const onExecuteApply = async () => {
    try {
      await handleApplyText();
    } catch {
      // Error handled by hook
    }
  };

  return (
    <div className="organise-tool-panel edit-text-panel">
      <div className="organise-panel-desc">
        Add custom styled multiline text anywhere on the document page.
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
        <label className="property-label" htmlFor="text-target-page">Target Page</label>
        <select 
          id="text-target-page"
          className="select-field"
          value={targetPageIndex}
          onChange={handlePageChange}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <option key={i} value={i}>
              Page {i + 1} of {numPages}
            </option>
          ))}
        </select>
      </div>

      {/* Text Input */}
      <div className="property-group">
        <label className="property-label" htmlFor="text-content-input">Text Content</label>
        <textarea
          id="text-content-input"
          className="input-textarea"
          rows={3}
          value={text}
          onChange={handleTextChange}
          placeholder="Enter text here..."
        />
      </div>

      {/* Font Family */}
      <div className="property-group">
        <label className="property-label" htmlFor="text-font-family">Typography</label>
        <select
          id="text-font-family"
          className="select-field"
          value={fontName}
          onChange={handleFontChange}
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Font Size & Stepper */}
      <div className="property-group">
        <label className="property-label">Font Size</label>
        <div className="stepper-row">
          <button
            type="button"
            className="stepper-btn"
            onClick={() => handleFontSizeChange(-2)}
            disabled={fontSize <= 8}
            aria-label="Decrease font size"
          >
            <Minus size={14} />
          </button>
          <span className="stepper-value">{fontSize} pt</span>
          <button
            type="button"
            className="stepper-btn"
            onClick={() => handleFontSizeChange(2)}
            disabled={fontSize >= 96}
            aria-label="Increase font size"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Alignment */}
      <div className="property-group">
        <label className="property-label">Text Alignment</label>
        <div className="organise-segmented-control" role="group" aria-label="Alignment">
          <button
            type="button"
            className={`segmented-pill ${alignment === 'left' ? 'active' : ''}`}
            onClick={() => handleAlignmentChange('left')}
            aria-label="Align left"
          >
            <AlignLeft size={13} />
            <span>Left</span>
          </button>
          <button
            type="button"
            className={`segmented-pill ${alignment === 'center' ? 'active' : ''}`}
            onClick={() => handleAlignmentChange('center')}
            aria-label="Align center"
          >
            <AlignCenter size={13} />
            <span>Center</span>
          </button>
          <button
            type="button"
            className={`segmented-pill ${alignment === 'right' ? 'active' : ''}`}
            onClick={() => handleAlignmentChange('right')}
            aria-label="Align right"
          >
            <AlignRight size={13} />
            <span>Right</span>
          </button>
        </div>
      </div>

      {/* Color Swatches */}
      <div className="property-group">
        <label className="property-label">Text Color</label>
        <div className="color-swatches-grid">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`color-swatch-circle ${color.toUpperCase() === c.toUpperCase() ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => handleColorSelect(c)}
              aria-label={`Select color ${c}`}
            />
          ))}
          <input
            type="color"
            value={color.startsWith('#') ? color : '#007AFF'}
            onChange={(e) => handleColorSelect(e.target.value)}
            className="color-custom-input"
            title="Custom Color"
            aria-label="Custom Color Picker"
          />
        </div>
      </div>

      {/* Opacity Slider */}
      <div className="property-group">
        <div className="property-label-row">
          <label className="property-label" htmlFor="text-opacity">Opacity</label>
          <span className="property-value-badge">{Math.round(opacity * 100)}%</span>
        </div>
        <input
          id="text-opacity"
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={opacity}
          onChange={handleOpacityChange}
          className="slider-range"
        />
      </div>

      {/* Placement Hint */}
      <div className="organise-info-box">
        <Crosshair size={13} className="info-icon" />
        <div className="info-text">
          <strong>Placement:</strong> (X: {x}, Y: {y}). Click or drag on page {targetPageIndex + 1} to position text box.
        </div>
      </div>

      {/* Action Buttons */}
      <div className="organise-action-footer">
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={onExecuteApply}
          disabled={isProcessing || !text.trim()}
        >
          {isProcessing ? (
            <>
              <Loader2 size={14} className="spin-icon" />
              <span>Placing Text...</span>
            </>
          ) : (
            <>
              <Type size={14} />
              <span>Apply Text to Page {targetPageIndex + 1}</span>
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

