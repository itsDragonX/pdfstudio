import React, { useState } from 'react';
import { 
  Copy, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useOrganise } from '../hooks/useOrganise.js';

export default function DuplicatePanel() {
  const { numPages, currentPage, setActiveToolId } = useDocument();
  const { handleDuplicate, isProcessing, error, successMessage } = useOrganise();

  const [selectedPages, setSelectedPages] = useState([currentPage]);

  const togglePage = (p) => {
    setSelectedPages((prev) => {
      if (prev.includes(p)) {
        return prev.filter((x) => x !== p);
      }
      return [...prev, p].sort((a, b) => a - b);
    });
  };

  const selectCurrent = () => setSelectedPages([currentPage]);
  const selectAll = () => setSelectedPages(Array.from({ length: numPages }, (_, i) => i + 1));
  const deselectAll = () => setSelectedPages([]);

  const onExecuteDuplicate = async () => {
    if (selectedPages.length === 0) return;
    await handleDuplicate(selectedPages);
  };

  return (
    <div className="organise-tool-panel duplicate-panel">
      <div className="organise-panel-desc">
        Clone pages and insert duplicates immediately after their source pages.
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
          <strong>{selectedPages.length}</strong> {selectedPages.length === 1 ? 'page' : 'pages'} to duplicate
        </div>
        <div className="selection-quick-actions">
          <button type="button" className="btn-text-action" onClick={selectCurrent}>
            Current
          </button>
          <span className="dot-sep">•</span>
          <button type="button" className="btn-text-action" onClick={selectAll}>
            All
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
              className={`page-chip-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => togglePage(p)}
              title={`Page ${p}`}
            >
              {p}
            </button>
          );
        })}
      </div>

      <div className="organise-notice-box">
        <span>
          Each cloned page will preserve the exact content, dimensions, and orientation of its source page.
        </span>
      </div>

      {/* Action Buttons */}
      <div className="organise-actions-stack">
        <button
          type="button"
          className="btn btn-primary btn-block btn-organise-execute"
          onClick={onExecuteDuplicate}
          disabled={selectedPages.length === 0 || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 size={14} className="spin-icon" />
              <span>Duplicating Pages...</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Duplicate {selectedPages.length} {selectedPages.length === 1 ? 'Page' : 'Pages'}</span>
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

      {selectedPages.length === 0 && (
        <span className="validation-helper text-center">
          Select at least one page to duplicate.
        </span>
      )}
    </div>
  );
}

