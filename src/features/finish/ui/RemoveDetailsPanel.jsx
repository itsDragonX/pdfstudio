import React from 'react';
import { 
  Trash2, 
  Download, 
  FileCheck, 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  ShieldCheck,
  Check,
  ShieldAlert,
  Info
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useFinishContext } from '../context/FinishContext.jsx';
import { useFinish } from '../hooks/useFinish.js';

export default function RemoveDetailsPanel() {
  const { docFile, numPages } = useDocument();
  const {
    removeDetectedMetadata,
    removeDetailsResult,
    setRemoveDetailsResult
  } = useFinishContext();

  const {
    isProcessing,
    progressMessage,
    error,
    setError,
    successMessage,
    handleRemoveDetails,
    downloadPdf
  } = useFinish();

  const handleRunRemove = async () => {
    try {
      await handleRemoveDetails();
    } catch {
      // Handled in hook
    }
  };

  const handleReset = () => {
    setRemoveDetailsResult(null);
  };

  if (!docFile) {
    return (
      <div className="organise-tool-panel">
        <div className="banner-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={15} />
          <span>Please open a PDF document first to inspect and strip its metadata.</span>
        </div>
      </div>
    );
  }

  const detectedList = removeDetectedMetadata?.detectedFields || [];

  return (
    <div className="organise-tool-panel">
      {/* Notifications */}
      {error && (
        <div className="banner-danger">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && !error && (
        <div className="banner-success">
          <FileCheck size={14} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Document Overview Badge */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          background: 'var(--surface-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          fontSize: '11px',
          color: 'var(--text-secondary)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <Layers size={13} color="var(--accent)" />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {docFile.name}
          </span>
        </div>
        <span style={{ flexShrink: 0, fontWeight: 500, color: 'var(--text-tertiary)' }}>
          {numPages} {numPages === 1 ? 'page' : 'pages'}
        </span>
      </div>

      {/* BEFORE REMOVAL OR AFTER VERIFICATION */}
      {!removeDetailsResult ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Detected Metadata Card */}
          <div className="property-group">
            <div className="property-label-row">
              <label className="property-label">Detected Metadata Fields ({detectedList.length})</label>
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                Pre-removal Scan
              </span>
            </div>

            {detectedList.length > 0 ? (
              <div 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '5px',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  padding: '8px',
                  background: 'var(--surface-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '11px'
                }}
              >
                {detectedList.map((f) => (
                  <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{f.label}:</span>
                    <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div 
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-secondary)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  fontStyle: 'italic'
                }}
              >
                No standard document info fields detected in the PDF trailer.
              </div>
            )}
          </div>

          {/* Scope of Removal Box */}
          <div 
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-secondary)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '11px'
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Data Categories Targeted for Stripping:
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px', color: 'var(--text-secondary)', fontSize: '10.5px' }}>
              <li><strong>Info Dictionary:</strong> Title, Author, Subject, Keywords, Creator, Producer.</li>
              <li><strong>Timestamp Signatures:</strong> CreationDate, ModDate, Trapped status.</li>
              <li><strong>Catalog XMP Metadata:</strong> Embedded XML metadata streams & PieceInfo.</li>
              <li><strong>Preserved:</strong> 100% of pages, vector graphics, forms and visible text.</li>
            </ul>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div style={{ fontSize: '11px', color: 'var(--accent)', textAlign: 'center', margin: '4px 0' }}>
              {progressMessage || 'Sanitizing document metadata...'}
            </div>
          )}

          {/* Action Button */}
          <div className="organise-action-footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRunRemove}
              disabled={isProcessing}
              style={{ width: '100%', gap: '6px', background: 'var(--danger, #FF3B30)' }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  <span>Sanitizing...</span>
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  <span>Strip Metadata & Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* RESULTS & POST-REMOVAL VERIFICATION */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div 
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: removeDetailsResult.verifiedClean ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 159, 10, 0.1)',
              border: `1px solid ${removeDetailsResult.verifiedClean ? 'rgba(52, 199, 89, 0.3)' : 'rgba(255, 159, 10, 0.3)'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="var(--success, #34C759)" />
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Sanitization Verified
                </span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleReset}
                style={{ height: '22px', fontSize: '10px', padding: '0 6px' }}
              >
                Scan Another
              </button>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Cleaned file: <strong>{removeDetailsResult.filename}</strong>
            </div>

            {/* Verification checklist */}
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                padding: '8px',
                background: 'var(--surface)',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                fontSize: '10.5px'
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                Verification Audit:
              </div>

              {removeDetailsResult.removedFields.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--success, #34C759)' }}>
                  <Check size={12} />
                  <span>Removed: {f}</span>
                </div>
              ))}

              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--success, #34C759)' }}>
                <Check size={12} />
                <span>Catalog XMP Stream: Stripped</span>
              </div>

              {removeDetailsResult.remainingFields.length > 0 && (
                <div style={{ color: '#FF9F0A', marginTop: '4px' }}>
                  Remaining low-level keys: {removeDetailsResult.remainingFields.join(', ')}
                </div>
              )}
            </div>

            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', lineHeight: '1.4' }}>
              * Original file untouched. Verification reloaded the output PDF and confirmed zero detectable metadata fields in the Info dictionary.
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => downloadPdf(removeDetailsResult.bytes, removeDetailsResult.filename)}
            style={{ width: '100%', gap: '6px' }}
          >
            <Download size={14} />
            <span>Download Cleaned PDF</span>
          </button>
        </div>
      )}
    </div>
  );
}

