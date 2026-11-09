import React, { useState } from 'react';
import { 
  FilePlus2, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useOrganise } from '../hooks/useOrganise.js';

export default function InsertBlankPanel() {
  const { currentPage, numPages, setActiveToolId } = useDocument();
  const { handleInsertBlank, isProcessing, error, successMessage } = useOrganise();

  const [position, setPosition] = useState('after'); // 'after' | 'before' | 'start' | 'end'
  const [preset, setPreset] = useState('adjacent'); // 'adjacent' | 'a4' | 'letter'
  const [orientation, setOrientation] = useState('match'); // 'match' | 'portrait' | 'landscape'

  const onExecuteInsert = async () => {
    await handleInsertBlank({
      position,
      preset,
      orientation
    });
  };

  return (
    <div className="organise-tool-panel insert-blank-panel">
      <div className="organise-panel-desc">
        Insert a clean blank page with matching or standard dimensions.
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

      {/* Position */}
      <div className="property-group">
        <label className="property-label">Insert Position</label>
        <div className="organise-select-stack">
          <button
            type="button"
            className={`organise-radio-card ${position === 'after' ? 'active' : ''}`}
            onClick={() => setPosition('after')}
          >
            <span>After page {currentPage}</span>
          </button>
          <button
            type="button"
            className={`organise-radio-card ${position === 'before' ? 'active' : ''}`}
            onClick={() => setPosition('before')}
          >
            <span>Before page {currentPage}</span>
          </button>
          <button
            type="button"
            className={`organise-radio-card ${position === 'start' ? 'active' : ''}`}
            onClick={() => setPosition('start')}
          >
            <span>At beginning (Page 1)</span>
          </button>
          <button
            type="button"
            className={`organise-radio-card ${position === 'end' ? 'active' : ''}`}
            onClick={() => setPosition('end')}
          >
            <span>At end (Page {numPages + 1})</span>
          </button>
        </div>
      </div>

      {/* Page Size Preset */}
      <div className="property-group">
        <label className="property-label">Page Dimensions</label>
        <div className="organise-segmented-control">
          <button
            type="button"
            className={`segmented-pill ${preset === 'adjacent' ? 'active' : ''}`}
            onClick={() => setPreset('adjacent')}
          >
            Match Adjacent
          </button>
          <button
            type="button"
            className={`segmented-pill ${preset === 'a4' ? 'active' : ''}`}
            onClick={() => setPreset('a4')}
          >
            A4
          </button>
          <button
            type="button"
            className={`segmented-pill ${preset === 'letter' ? 'active' : ''}`}
            onClick={() => setPreset('letter')}
          >
            Letter
          </button>
        </div>
      </div>

      {/* Orientation (if preset is standard) */}
      {preset !== 'adjacent' && (
        <div className="property-group">
          <label className="property-label">Orientation</label>
          <div className="organise-segmented-control">
            <button
              type="button"
              className={`segmented-pill ${orientation === 'portrait' ? 'active' : ''}`}
              onClick={() => setOrientation('portrait')}
            >
              Portrait
            </button>
            <button
              type="button"
              className={`segmented-pill ${orientation === 'landscape' ? 'active' : ''}`}
              onClick={() => setOrientation('landscape')}
            >
              Landscape
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="organise-actions-stack">
        <button
          type="button"
          className="btn btn-primary btn-block btn-organise-execute"
          onClick={onExecuteInsert}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 size={14} className="spin-icon" />
              <span>Inserting Blank Page...</span>
            </>
          ) : (
            <>
              <FilePlus2 size={14} />
              <span>Insert Blank Page</span>
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

