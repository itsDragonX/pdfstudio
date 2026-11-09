import React from 'react';
import { 
  Eraser, 
  Trash2, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Info 
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useEditContext } from '../context/EditContext.jsx';
import { useEdit } from '../hooks/useEdit.js';

const WHITEOUT_COLORS = [
  { hex: '#FFFFFF', name: 'Pure White (Default)' },
  { hex: '#F8F9FA', name: 'Paper White' },
  { hex: '#F4EFEA', name: 'Warm Cream' },
  { hex: '#E5E5EA', name: 'Light Grey' }
];

export default function WhiteoutPanel() {
  const { numPages, setActiveToolId } = useDocument();
  const { targetPageIndex, setTargetPageIndex, editPayload, updateEditPayload } = useEditContext();
  const { handleApplyWhiteout, isProcessing, error, successMessage } = useEdit();

  const color = editPayload.color ?? '#FFFFFF';
  const regions = editPayload.regions ?? [];
  const pageRegions = regions.filter((r) => (r.pageIndex ?? targetPageIndex) === targetPageIndex);

  const handleClearRegions = () => {
    updateEditPayload({
      regions: regions.filter((r) => (r.pageIndex ?? targetPageIndex) !== targetPageIndex)
    });
  };

  const handleRemoveOne = (index) => {
    const updated = [...regions];
    const globalIdx = regions.findIndex((r, i) => (r.pageIndex ?? targetPageIndex) === targetPageIndex && i === index);
    if (globalIdx !== -1) {
      updated.splice(globalIdx, 1);
      updateEditPayload({ regions: updated });
    }
  };

  const onExecuteApply = async () => {
    try {
      await handleApplyWhiteout();
    } catch {
      // Handled by hook
    }
  };

  return (
    <div className="organise-tool-panel edit-whiteout-panel">
      {/* Prominent Legal/Security Notice */}
      <div className="organise-banner banner-warning" role="alert">
        <AlertTriangle size={15} className="flex-shrink-0" />
        <div style={{ fontSize: '11px', lineHeight: '1.35' }}>
          <strong>Visual Concealment Only:</strong> Whiteout draws an opaque overlay. The underlying text remains in the PDF stream and can still be searched or extracted. For permanent security removal, use the <strong>Redact</strong> tool.
        </div>
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
        <label className="property-label" htmlFor="whiteout-target-page">Target Page</label>
        <select 
          id="whiteout-target-page"
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

      {/* Mask Color */}
      <div className="property-group">
        <label className="property-label">Knockout Color</label>
        <div className="color-swatches-grid">
          {WHITEOUT_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              className={`color-swatch-circle ${color.toUpperCase() === c.hex.toUpperCase() ? 'active' : ''}`}
              style={{ backgroundColor: c.hex, border: '1px solid #CCC' }}
              onClick={() => updateEditPayload({ color: c.hex })}
              title={c.name}
              aria-label={c.name}
            />
          ))}
          <input
            type="color"
            value={color.startsWith('#') ? color : '#FFFFFF'}
            onChange={(e) => updateEditPayload({ color: e.target.value })}
            className="color-custom-input"
            title="Custom Knockout Color"
            aria-label="Custom Knockout Color"
          />
        </div>
      </div>

      {/* Region List */}
      <div className="property-group">
        <div className="property-label-row">
          <label className="property-label">Whiteout Regions</label>
          <span className="badge-count-pill">{pageRegions.length}</span>
        </div>

        {pageRegions.length === 0 ? (
          <div className="organise-info-box">
            <Info size={13} className="info-icon" />
            <div className="info-text">
              Drag anywhere over page {targetPageIndex + 1} to draw an opaque knockout box.
            </div>
          </div>
        ) : (
          <div className="edit-items-list">
            {pageRegions.map((r, idx) => (
              <div key={idx} className="edit-item-row">
                <div 
                  className="edit-item-color-preview"
                  style={{ backgroundColor: r.color || color, border: '1px solid #DDD' }}
                />
                <span className="edit-item-desc">
                  Mask #{idx + 1} ({Math.round(r.width)}×{Math.round(r.height)} pt)
                </span>
                <button
                  type="button"
                  className="btn-icon-subtle text-danger"
                  onClick={() => handleRemoveOne(idx)}
                  title="Remove this mask"
                  aria-label={`Remove mask ${idx + 1}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleClearRegions}
              style={{ marginTop: '6px' }}
            >
              Clear All Page Masks
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
          disabled={isProcessing || pageRegions.length === 0}
        >
          {isProcessing ? (
            <>
              <Loader2 size={14} className="spin-icon" />
              <span>Applying Whiteout...</span>
            </>
          ) : (
            <>
              <Eraser size={14} />
              <span>Apply {pageRegions.length} Mask{pageRegions.length === 1 ? '' : 's'} to Page {targetPageIndex + 1}</span>
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

