import React, { useState, useMemo } from 'react';
import { 
  Scissors, 
  Archive, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Sparkles
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useOrganise } from '../hooks/useOrganise.js';
import { parsePageRanges } from '../services/pageOperations.js';

export default function SplitPanel() {
  const { docFile, numPages, setActiveToolId } = useDocument();
  const { handleSplit, isProcessing, error, successMessage } = useOrganise();

  const [mode, setMode] = useState('ranges'); // 'ranges' | 'every'
  const [rangeStr, setRangeStr] = useState(() => {
    if (numPages <= 2) return '1, 2';
    const mid = Math.ceil(numPages / 2);
    return `1-${mid}, ${mid + 1}-${numPages}`;
  });

  // Live validation
  const validation = useMemo(() => {
    if (mode === 'every') {
      return { isValid: true, groups: Array.from({ length: numPages }, (_, i) => ({ label: `page_${i + 1}`, indices: [i] })), error: null };
    }
    return parsePageRanges(rangeStr, numPages);
  }, [mode, rangeStr, numPages]);

  const onExecuteSplit = async () => {
    if (!validation.isValid) return;
    await handleSplit({
      splitEveryPage: mode === 'every',
      rangeString: rangeStr
    });
  };

  return (
    <div className="organise-tool-panel split-panel">
      <div className="organise-panel-desc">
        Divide document into multiple PDFs by page ranges or into single pages.
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

      {/* Mode Selector */}
      <div className="property-group">
        <label className="property-label">Split Mode</label>
        <div className="organise-segmented-control">
          <button
            type="button"
            className={`segmented-pill ${mode === 'ranges' ? 'active' : ''}`}
            onClick={() => setMode('ranges')}
          >
            Custom Ranges
          </button>
          <button
            type="button"
            className={`segmented-pill ${mode === 'every' ? 'active' : ''}`}
            onClick={() => setMode('every')}
          >
            Split Every Page
          </button>
        </div>
      </div>

      {mode === 'ranges' ? (
        <>
          <div className="property-group">
            <label className="property-label">Range Expression</label>
            <input
              type="text"
              className={`organise-input ${!validation.isValid && rangeStr ? 'input-error' : ''}`}
              value={rangeStr}
              onChange={(e) => setRangeStr(e.target.value)}
              placeholder="e.g. 1-3, 4-6 or 1, 3, 5"
            />
            {!validation.isValid && (
              <span className="validation-error-text">{validation.error}</span>
            )}
            <span className="validation-helper">
              Syntax: <code>1-3, 4-6</code> or <code>1, 3, 5</code> (Total: {numPages} pages)
            </span>
          </div>

          {/* Quick presets */}
          <div className="range-presets-row">
            <span className="preset-label">Presets:</span>
            {numPages >= 2 && (
              <button
                type="button"
                className="chip-preset-btn"
                onClick={() => {
                  const m = Math.ceil(numPages / 2);
                  setRangeStr(`1-${m}, ${m + 1}-${numPages}`);
                }}
              >
                Halves (1-{Math.ceil(numPages / 2)})
              </button>
            )}
            <button
              type="button"
              className="chip-preset-btn"
              onClick={() => setRangeStr(Array.from({ length: numPages }, (_, i) => `${i + 1}`).join(', '))}
            >
              All Separate
            </button>
          </div>

          {/* Group Previews */}
          {validation.isValid && validation.groups.length > 0 && (
            <div className="split-groups-preview">
              <label className="property-label">Resulting Files ({validation.groups.length})</label>
              <div className="groups-chips-list">
                {validation.groups.map((grp, i) => (
                  <div key={grp.label + i} className="group-chip">
                    <FileText size={12} />
                    <span className="group-label">Pages {grp.label}</span>
                    <span className="group-count">({grp.indices.length} {grp.indices.length === 1 ? 'page' : 'pages'})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="split-info-box">
          <Archive size={16} />
          <div className="split-info-text">
            <strong>{numPages} Individual PDFs</strong>
            <span>Each page will be saved as a separate PDF and packaged into a ZIP file.</span>
          </div>
        </div>
      )}

      {/* Safety Notice */}
      <div className="organise-notice-box">
        <span>The original working document will remain open and unmodified.</span>
      </div>

      {/* Action Buttons */}
      <div className="organise-actions-stack">
        <button
          type="button"
          className="btn btn-primary btn-block btn-organise-execute"
          onClick={onExecuteSplit}
          disabled={isProcessing || !validation.isValid}
        >
          {isProcessing ? (
            <>
              <Loader2 size={14} className="spin-icon" />
              <span>Splitting PDF...</span>
            </>
          ) : (
            <>
              <Scissors size={14} />
              <span>Split Document ({validation.groups?.length || 0} files)</span>
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

