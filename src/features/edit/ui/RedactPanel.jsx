import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Info,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useEditContext } from '../context/EditContext.jsx';
import { useEdit } from '../hooks/useEdit.js';

export default function RedactPanel() {
  const { numPages, setActiveToolId } = useDocument();
  const { targetPageIndex, setTargetPageIndex, editPayload, updateEditPayload } = useEditContext();
  const { handleApplyRedact, isProcessing, error, successMessage } = useEdit();

  const [confirmOpen, setConfirmOpen] = useState(false);

  const regions = editPayload.regions ?? [];
  const pageRegions = regions.filter((r) => (r.pageIndex ?? targetPageIndex) === targetPageIndex);

  const handleClearRegions = () => {
    updateEditPayload({
      regions: regions.filter((r) => (r.pageIndex ?? targetPageIndex) !== targetPageIndex)
    });
    setConfirmOpen(false);
  };

  const handleRemoveOne = (index) => {
    const updated = [...regions];
    const globalIdx = regions.findIndex((r, i) => (r.pageIndex ?? targetPageIndex) === targetPageIndex && i === index);
    if (globalIdx !== -1) {
      updated.splice(globalIdx, 1);
      updateEditPayload({ regions: updated });
    }
    if (pageRegions.length <= 1) {
      setConfirmOpen(false);
    }
  };

  const onExecuteRedact = async () => {
    try {
      setConfirmOpen(false);
      await handleApplyRedact();
    } catch {
      // Handled by hook
    }
  };

  return (
    <div className="organise-tool-panel edit-redact-panel">
      {/* High-visibility security banner */}
      <div className="organise-banner banner-danger" role="alert">
        <ShieldAlert size={16} className="flex-shrink-0" />
        <div style={{ fontSize: '11px', lineHeight: '1.35' }}>
          <strong>Genuine Permanent Redaction:</strong> Affected pages are re-rasterized at high-DPI into a fresh PDF. Original text streams and fonts are destroyed and cannot be recovered or searched.
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
        <label className="property-label" htmlFor="redact-target-page">Target Page</label>
        <select 
          id="redact-target-page"
          className="select-field"
          value={targetPageIndex}
          onChange={(e) => {
            setTargetPageIndex(parseInt(e.target.value, 10));
            setConfirmOpen(false);
          }}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <option key={i} value={i}>
              Page {i + 1} of {numPages}
            </option>
          ))}
        </select>
      </div>

      {/* Redaction Regions List */}
      <div className="property-group">
        <div className="property-label-row">
          <label className="property-label">Marked for Redaction</label>
          <span className="badge-count-pill badge-danger-count">{pageRegions.length}</span>
        </div>

        {pageRegions.length === 0 ? (
          <div className="organise-info-box">
            <Info size={13} className="info-icon" />
            <div className="info-text">
              Click and drag over sensitive content on page {targetPageIndex + 1} to mark redaction boxes.
            </div>
          </div>
        ) : (
          <div className="edit-items-list">
            {pageRegions.map((r, idx) => (
              <div key={idx} className="edit-item-row redact-item-row">
                <div className="redact-box-swatch" />
                <span className="edit-item-desc">
                  Redact #{idx + 1} ({Math.round(r.width)}×{Math.round(r.height)} pt)
                </span>
                <button
                  type="button"
                  className="btn-icon-subtle text-danger"
                  onClick={() => handleRemoveOne(idx)}
                  title="Remove this redaction box"
                  aria-label={`Remove redaction box ${idx + 1}`}
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
              Clear All Marks on Page {targetPageIndex + 1}
            </button>
          </div>
        )}
      </div>

      {/* Irreversible Confirmation Dialog Card */}
      {confirmOpen && (
        <div className="redaction-confirm-card" role="dialog" aria-label="Confirm Redaction">
          <div className="confirm-header">
            <AlertTriangle size={15} className="text-danger flex-shrink-0" />
            <span className="confirm-title">Confirm Irreversible Redaction</span>
          </div>
          <p className="confirm-body">
            This will permanently burn black pixels over {pageRegions.length} region{pageRegions.length === 1 ? '' : 's'} on page {targetPageIndex + 1} and purge underlying text. Unaffected pages will keep original vector text.
          </p>
          <div className="confirm-actions">
            <button
              type="button"
              className="btn btn-danger btn-sm btn-block"
              onClick={onExecuteRedact}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={13} className="spin-icon" />
                  <span>Burning In Redaction...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={13} />
                  <span>Yes, Burn In Redaction</span>
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm btn-block"
              onClick={() => setConfirmOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="organise-action-footer">
        {!confirmOpen && (
          <button
            type="button"
            className="btn btn-danger btn-block"
            onClick={() => setConfirmOpen(true)}
            disabled={isProcessing || pageRegions.length === 0}
          >
            <ShieldAlert size={14} />
            <span>Apply Redaction to Page {targetPageIndex + 1}</span>
          </button>
        )}

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

