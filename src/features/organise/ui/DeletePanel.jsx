import React, { useState } from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useOrganise } from '../hooks/useOrganise.js';

export default function DeletePanel() {
  const { numPages, currentPage, setActiveToolId } = useDocument();
  const { handleDelete, isProcessing, error, successMessage } = useOrganise();

  // Selected pages array (1-based)
  const [selectedPages, setSelectedPages] = useState([currentPage]);
  const [showConfirm, setShowConfirm] = useState(false);

  const togglePage = (p) => {
    setSelectedPages((prev) => {
      if (prev.includes(p)) {
        return prev.filter((x) => x !== p);
      }
      return [...prev, p].sort((a, b) => a - b);
    });
    setShowConfirm(false);
  };

  const selectCurrent = () => {
    setSelectedPages([currentPage]);
    setShowConfirm(false);
  };

  const selectAll = () => {
    setSelectedPages(Array.from({ length: numPages }, (_, i) => i + 1));
    setShowConfirm(false);
  };

  const deselectAll = () => {
    setSelectedPages([]);
    setShowConfirm(false);
  };

  const isAllSelected = selectedPages.length === numPages;
  const canDelete = selectedPages.length > 0 && selectedPages.length < numPages;

  const onConfirmDelete = async () => {
    if (!canDelete) return;
    await handleDelete(selectedPages);
    setShowConfirm(false);
  };

  return (
    <div className="organise-tool-panel delete-panel">
      <div className="organise-panel-desc">
        Select and remove unwanted pages from the document.
      </div>

      {error && (
        <div className="organise-banner banner-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="organise-banner banner-success">
          <CheckCircle2 size={14} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Selection Summary & Quick Buttons */}
      <div className="selection-header-row">
        <div className="selection-stats">
          <strong>{selectedPages.length}</strong> of {numPages} selected
        </div>
        <div className="selection-quick-actions">
          <button type="button" className="btn-text-action" onClick={selectCurrent}>
            Current
          </button>
          <span className="dot-sep">•</span>
          <button type="button" className="btn-text-action" onClick={deselectAll}>
            Clear
          </button>
        </div>
      </div>

      {/* Page Selection Chips */}
      <div className="page-selection-chips-grid">
        {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => {
          const isSelected = selectedPages.includes(p);
          return (
            <button
              type="button"
              key={p}
              className={`page-chip-btn delete-chip ${isSelected ? 'selected danger-chip' : ''}`}
              onClick={() => togglePage(p)}
              title={`Page ${p}`}
            >
              {p}
            </button>
          );
        })}
      </div>

      {/* Safety Guard Notice */}
      {isAllSelected && (
        <div className="organise-banner banner-warning">
          <AlertTriangle size={14} />
          <span>Cannot delete all pages. A PDF must retain at least one page.</span>
        </div>
      )}

      {canDelete && (
        <div className="organise-notice-box">
          <span>
            {numPages - selectedPages.length} {numPages - selectedPages.length === 1 ? 'page' : 'pages'} will remain in the document.
          </span>
        </div>
      )}

      {/* Delete / Confirmation */}
      {!showConfirm ? (
        <div className="organise-actions-stack">
          <button
            type="button"
            className="btn btn-danger btn-block btn-organise-execute"
            onClick={() => setShowConfirm(true)}
            disabled={!canDelete || isProcessing}
          >
            <Trash2 size={14} />
            <span>Delete {selectedPages.length} {selectedPages.length === 1 ? 'Page' : 'Pages'}</span>
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
      ) : (
        <div className="confirmation-card">
          <div className="confirmation-text">
            Permanently delete {selectedPages.length} {selectedPages.length === 1 ? 'page' : 'pages'}?
          </div>
          <div className="confirmation-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={onConfirmDelete}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={13} className="spin-icon" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Confirm Delete</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

