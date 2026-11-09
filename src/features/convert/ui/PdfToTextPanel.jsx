import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  AlertCircle, 
  AlertTriangle, 
  RefreshCw, 
  Layers,
  Sparkles
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useConvertContext } from '../context/ConvertContext.jsx';
import { useConvert } from '../hooks/useConvert.js';

export default function PdfToTextPanel() {
  const { docFile, currentPage, numPages } = useDocument();
  const {
    pdfToTextOptions,
    setPdfToTextOptions,
    pdfToTextResult,
    setPdfToTextResult
  } = useConvertContext();

  const {
    isProcessing,
    progressMessage,
    error,
    setError,
    successMessage,
    handleExtractPdfToText,
    handleDownloadText
  } = useConvert();

  const [rangeInput, setRangeInput] = useState(pdfToTextOptions.rangeString || '');
  const [copied, setCopied] = useState(false);

  // Handle page target change
  const handlePageTargetChange = (target) => {
    setPdfToTextOptions((prev) => ({ ...prev, pageTarget: target }));
  };

  // Run text extraction
  const handleRunExtraction = async () => {
    if (!docFile?.bytes) {
      setError('Please open a PDF document first.');
      return;
    }

    try {
      await handleExtractPdfToText({
        ...pdfToTextOptions,
        rangeString: rangeInput
      });
    } catch {
      // Error handled in hook
    }
  };

  // Copy full extracted text to clipboard
  const handleCopyText = async () => {
    if (!pdfToTextResult?.fullText) return;
    try {
      await navigator.clipboard.writeText(pdfToTextResult.fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      setError('Could not copy to clipboard.');
    }
  };

  // Reset to re-extract
  const handleReset = () => {
    setPdfToTextResult(null);
  };

  if (!docFile) {
    return (
      <div className="organise-tool-panel">
        <div className="banner-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={15} />
          <span>Please open a PDF document first to extract its text stream.</span>
        </div>
      </div>
    );
  }

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
          <FileText size={14} />
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

      {/* MAIN VIEW: Configuration OR Results */}
      {!pdfToTextResult ? (
        <>
          {/* Target Pages */}
          <div className="property-group">
            <label className="property-label">Target Pages</label>
            <div className="segmented-control">
              <button
                type="button"
                className={`segmented-control-btn ${pdfToTextOptions.pageTarget === 'all' ? 'active' : ''}`}
                onClick={() => handlePageTargetChange('all')}
              >
                <span>All ({numPages})</span>
              </button>
              <button
                type="button"
                className={`segmented-control-btn ${pdfToTextOptions.pageTarget === 'current' ? 'active' : ''}`}
                onClick={() => handlePageTargetChange('current')}
              >
                <span>Current ({currentPage})</span>
              </button>
              <button
                type="button"
                className={`segmented-control-btn ${pdfToTextOptions.pageTarget === 'range' ? 'active' : ''}`}
                onClick={() => handlePageTargetChange('range')}
              >
                <span>Custom</span>
              </button>
            </div>

            {/* Range input */}
            {pdfToTextOptions.pageTarget === 'range' && (
              <div style={{ marginTop: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. 1-3, 5, 7-9"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  className="text-input"
                  style={{ width: '100%' }}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                  Enter page numbers or ranges separated by commas
                </span>
              </div>
            )}
          </div>

          {/* Options: Include Page Separators */}
          <div className="property-group">
            <label 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                cursor: 'pointer',
                fontSize: '12px',
                color: 'var(--text-primary)',
                userSelect: 'none'
              }}
            >
              <input
                type="checkbox"
                checked={pdfToTextOptions.includePageHeaders}
                onChange={(e) => setPdfToTextOptions((prev) => ({ ...prev, includePageHeaders: e.target.checked }))}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
              />
              <span>Include page headers (e.g. === PAGE 1 ===)</span>
            </label>
          </div>

          {/* Progress / Status */}
          {isProcessing && (
            <div style={{ fontSize: '11px', color: 'var(--accent)', textAlign: 'center', margin: '8px 0' }}>
              {progressMessage || 'Extracting structured text stream...'}
            </div>
          )}

          {/* Action Footer */}
          <div className="organise-action-footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRunExtraction}
              disabled={isProcessing}
              style={{ width: '100%' }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  <span>Extracting Text...</span>
                </>
              ) : (
                <>
                  <FileText size={14} />
                  <span>Extract Text Stream</span>
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        /* RESULTS VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Summary / Stats Bar */}
          <div 
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-secondary)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Extraction Summary
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleReset}
                style={{ height: '24px', fontSize: '10.5px', padding: '0 6px' }}
              >
                Re-extract
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <div>
                <strong>{pdfToTextResult.totalWords.toLocaleString()}</strong> words
              </div>
              <div>
                <strong>{pdfToTextResult.totalChars.toLocaleString()}</strong> characters
              </div>
              <div>
                <strong>{pdfToTextResult.pages.length}</strong> {pdfToTextResult.pages.length === 1 ? 'page' : 'pages'}
              </div>
            </div>
          </div>

          {/* Scanned / Empty PDF Warning Alert */}
          {pdfToTextResult.isScannedOrEmpty && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 159, 10, 0.12)',
                border: '1px solid rgba(255, 159, 10, 0.3)',
                color: 'var(--text-primary)',
                fontSize: '11px',
                lineHeight: '1.4'
              }}
            >
              <AlertTriangle size={15} color="#FF9F0A" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: '#FF9F0A', marginBottom: '2px' }}>
                  Minimal Selectable Text Detected
                </strong>
                This document may contain scanned images, photos, or rasterized artwork without an embedded OCR text stream.
              </div>
            </div>
          )}

          {/* Action Row: Copy & Download */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCopyText}
              disabled={!pdfToTextResult.fullText}
              style={{ flex: 1, height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {copied ? (
                <>
                  <Check size={14} color="var(--success, #34C759)" />
                  <span style={{ color: 'var(--success, #34C759)' }}>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => handleDownloadText(pdfToTextResult.fullText, docFile.name)}
              disabled={!pdfToTextResult.fullText}
              style={{ flex: 1, height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Download size={14} />
              <span>Download TXT</span>
            </button>
          </div>

          {/* Text Content Preview Container */}
          <div className="property-group">
            <div className="property-label-row">
              <label className="property-label">Extracted Content Preview</label>
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                UTF-8 Plain Text
              </span>
            </div>

            <div
              style={{
                width: '100%',
                maxHeight: '260px',
                overflowY: 'auto',
                padding: '10px 12px',
                background: 'var(--surface-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '11px',
                lineHeight: '1.5',
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                userSelect: 'text'
              }}
            >
              {pdfToTextResult.fullText || (
                <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                  (No readable text found on the target pages)
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

