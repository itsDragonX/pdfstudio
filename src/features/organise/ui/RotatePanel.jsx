import React, { useState } from 'react';
import { 
  RotateCw, 
  RotateCcw, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useOrganise } from '../hooks/useOrganise.js';

export default function RotatePanel() {
  const { numPages, currentPage, setActiveToolId } = useDocument();
  const { handleRotate, isProcessing, error, successMessage } = useOrganise();

  const [scope, setScope] = useState('current'); // 'current' | 'all' | 'custom'
  const [selectedPages, setSelectedPages] = useState([currentPage]);

  const togglePageSelection = (pageNum) => {
    setSelectedPages((prev) => {
      if (prev.includes(pageNum)) {
        return prev.filter((p) => p !== pageNum);
      }
      return [...prev, pageNum].sort((a, b) => a - b);
    });
  };

  const onExecuteRotate = async (delta) => {
    let target;
    if (scope === 'all') {
      target = 'all';
    } else if (scope === 'current') {
      target = [currentPage];
    } else {
      if (selectedPages.length === 0) return;
      target = selectedPages;
    }

    await handleRotate(target, delta);
  };

  return (
    <div className="organise-tool-panel rotate-panel">
      <div className="organise-panel-desc">
        Rotate pages in 90° increments. Rotation is permanently saved to the PDF.
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

      {/* Target Scope */}
      <div className="property-group">
        <label className="property-label">Pages to Rotate</label>
        <div className="organise-segmented-control">
          <button type="button" className={`segmented-pill ${scope === 'current' ? 'active' : ''}`} onClick={() => setScope('current')}>Current ({currentPage})</button>
          <button type="button" className={`segmented-pill ${scope === 'all' ? 'active' : ''}`} onClick={() => setScope('all')}>All ({numPages})</button>
          <button type="button" className={`segmented-pill ${scope === 'custom' ? 'active' : ''}`} onClick={() => setScope('custom')}>Select...</button>
        </div>
      </div>

      {/* Custom Page Selection Grid */}
      {scope === 'custom' && (
        <div className="property-group">
          <label className="property-label">Select Pages ({selectedPages.length} selected)</label>
          <div className="page-selection-chips-grid">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => {
              const isSelected = selectedPages.includes(p);
              return (
                <button
                  type="button"
                  key={p}
                  className={`page-chip-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => togglePageSelection(p)}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Rotation Action Buttons */}
      <div className="property-group">
        <label className="property-label">Rotation Angle</label>
        <div className="rotate-buttons-grid">
          <button
            type="button"
            className="btn btn-secondary rotate-action-btn"
            onClick={() => onExecuteRotate(90)}
            disabled={isProcessing || (scope === 'custom' && selectedPages.length === 0)}
          >
            <RotateCw size={18} />
            <span>90° Clockwise</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary rotate-action-btn"
            onClick={() => onExecuteRotate(-90)}
            disabled={isProcessing || (scope === 'custom' && selectedPages.length === 0)}
          >
            <RotateCcw size={18} />
            <span>90° Counter-CW</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary rotate-action-btn rotate-full-span"
            onClick={() => onExecuteRotate(180)}
            disabled={isProcessing || (scope === 'custom' && selectedPages.length === 0)}
          >
            <RefreshCw size={16} />
            <span>180° Flip</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-secondary btn-block"
        onClick={() => setActiveToolId(null)}
        disabled={isProcessing}
        style={{ marginTop: '12px' }}
      >
        Cancel
      </button>

      {isProcessing && (
        <div className="organise-loading-indicator">
          <Loader2 size={15} className="spin-icon" />
          <span>Applying rotation...</span>
        </div>
      )}
    </div>
  );
}
