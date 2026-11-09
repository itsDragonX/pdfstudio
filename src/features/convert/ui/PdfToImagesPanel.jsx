import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  Download, 
  Archive, 
  FileCheck, 
  AlertCircle, 
  RefreshCw, 
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useConvertContext } from '../context/ConvertContext.jsx';
import { useConvert } from '../hooks/useConvert.js';
import { triggerDownload } from '../../organise/services/pageOperations.js';

export default function PdfToImagesPanel() {
  const { docFile, currentPage, numPages, setActiveToolId } = useDocument();
  const { 
    pdfToImagesOptions, 
    setPdfToImagesOptions,
    pdfToImagesResult,
    setPdfToImagesResult
  } = useConvertContext();

  const {
    isProcessing,
    progressMessage,
    progressPercent,
    error,
    setError,
    successMessage,
    handleConvertPdfToImages,
    handleDownloadZip
  } = useConvert();

  const [rangeInput, setRangeInput] = useState(pdfToImagesOptions.rangeString || '');

  // Handle format change
  const handleFormatChange = (fmt) => {
    setPdfToImagesOptions((prev) => ({ ...prev, format: fmt }));
  };

  // Handle DPI change
  const handleDpiChange = (dpi) => {
    setPdfToImagesOptions((prev) => ({ ...prev, dpi }));
  };

  // Handle page target change
  const handlePageTargetChange = (target) => {
    setPdfToImagesOptions((prev) => ({ ...prev, pageTarget: target }));
  };

  // Run conversion
  const handleRunConversion = async () => {
    if (!docFile?.bytes) {
      setError('Please open a PDF document first.');
      return;
    }

    try {
      await handleConvertPdfToImages({
        ...pdfToImagesOptions,
        rangeString: rangeInput,
        baseFilename: docFile.name || 'document'
      });
    } catch {
      // Error is caught & stored in useConvert hook
    }
  };

  // Download single image
  const handleDownloadSingle = (img) => {
    const mime = pdfToImagesOptions.format === 'jpeg' ? 'image/jpeg' : 'image/png';
    triggerDownload(img.bytes, img.filename, mime);
  };

  // Reset results to configure again
  const handleReset = () => {
    setPdfToImagesResult(null);
  };

  if (!docFile) {
    return (
      <div className="organise-tool-panel">
        <div className="banner-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={15} />
          <span>Please open a PDF document first to convert its pages into images.</span>
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

      {/* MAIN VIEW: Configuration OR Results */}
      {!pdfToImagesResult ? (
        <>
          {/* Format Selection (PNG vs JPEG) */}
          <div className="property-group">
            <label className="property-label">Image Format</label>
            <div className="segmented-control">
              <button
                type="button"
                className={`segmented-control-btn ${pdfToImagesOptions.format === 'png' ? 'active' : ''}`}
                onClick={() => handleFormatChange('png')}
              >
                <span>PNG (Lossless)</span>
              </button>
              <button
                type="button"
                className={`segmented-control-btn ${pdfToImagesOptions.format === 'jpeg' ? 'active' : ''}`}
                onClick={() => handleFormatChange('jpeg')}
              >
                <span>JPEG (Standard)</span>
              </button>
            </div>
          </div>

          {/* JPEG Quality Slider (only for JPEG) */}
          {pdfToImagesOptions.format === 'jpeg' && (
            <div className="property-group">
              <div className="property-label-row">
                <label className="property-label">JPEG Quality</label>
                <span className="property-value-badge">
                  {Math.round((pdfToImagesOptions.jpegQuality ?? 0.85) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={pdfToImagesOptions.jpegQuality ?? 0.85}
                onChange={(e) => setPdfToImagesOptions((prev) => ({ ...prev, jpegQuality: parseFloat(e.target.value) }))}
                className="slider-range"
              />
            </div>
          )}

          {/* Resolution / DPI */}
          <div className="property-group">
            <label className="property-label">Resolution / Quality</label>
            <div className="segmented-control">
              <button
                type="button"
                className={`segmented-control-btn ${pdfToImagesOptions.dpi === 150 ? 'active' : ''}`}
                onClick={() => handleDpiChange(150)}
              >
                <span>150 DPI (Screen / Web)</span>
              </button>
              <button
                type="button"
                className={`segmented-control-btn ${pdfToImagesOptions.dpi === 300 ? 'active' : ''}`}
                onClick={() => handleDpiChange(300)}
              >
                <span>300 DPI (High Res / Print)</span>
              </button>
            </div>
          </div>

          {/* Page Targeting */}
          <div className="property-group">
            <label className="property-label">Target Pages</label>
            <div className="segmented-control">
              <button
                type="button"
                className={`segmented-control-btn ${pdfToImagesOptions.pageTarget === 'all' ? 'active' : ''}`}
                onClick={() => handlePageTargetChange('all')}
              >
                <span>All ({numPages})</span>
              </button>
              <button
                type="button"
                className={`segmented-control-btn ${pdfToImagesOptions.pageTarget === 'current' ? 'active' : ''}`}
                onClick={() => handlePageTargetChange('current')}
              >
                <span>Current ({currentPage})</span>
              </button>
              <button
                type="button"
                className={`segmented-control-btn ${pdfToImagesOptions.pageTarget === 'range' ? 'active' : ''}`}
                onClick={() => handlePageTargetChange('range')}
              >
                <span>Custom</span>
              </button>
            </div>

            {/* Custom Range Input */}
            {pdfToImagesOptions.pageTarget === 'range' && (
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

          {/* Progress Indicator */}
          {isProcessing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <span>{progressMessage || 'Rendering pages...'}</span>
                <span>{progressPercent}%</span>
              </div>
              <div style={{ height: '5px', width: '100%', background: 'var(--surface-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${progressPercent}%`, 
                    background: 'var(--accent)', 
                    transition: 'width 0.2s ease' 
                  }} 
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="organise-action-footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRunConversion}
              disabled={isProcessing}
              style={{ width: '100%' }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  <span>Converting Pages...</span>
                </>
              ) : (
                <>
                  <ImageIcon size={14} />
                  <span>Export Pages to Images</span>
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        /* RESULTS VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Summary Banner */}
          <div 
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(52, 199, 89, 0.1)',
              border: '1px solid rgba(52, 199, 89, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Ready to Download
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                {pdfToImagesResult.images.length} image{pdfToImagesResult.images.length === 1 ? '' : 's'} exported at {pdfToImagesOptions.dpi} DPI ({pdfToImagesOptions.format.toUpperCase()})
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleReset}
              style={{ height: '26px', fontSize: '11px', padding: '0 8px' }}
            >
              Convert Again
            </button>
          </div>

          {/* Download All (ZIP) button if multiple images */}
          {pdfToImagesResult.zipBytes && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleDownloadZip(pdfToImagesResult.zipBytes, pdfToImagesResult.zipFilename)}
              style={{ width: '100%', gap: '8px' }}
            >
              <Archive size={15} />
              <span>Download All as ZIP ({pdfToImagesResult.images.length} files)</span>
            </button>
          )}

          {/* Individual Image Gallery / List */}
          <div className="property-group">
            <label className="property-label">Exported Images</label>
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px',
                maxHeight: '260px',
                overflowY: 'auto',
                paddingRight: '2px'
              }}
            >
              {pdfToImagesResult.images.map((img) => (
                <div
                  key={img.pageNumber}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    background: 'var(--surface-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      background: '#FFFFFF',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <img 
                      src={img.dataUrl} 
                      alt={`Page ${img.pageNumber}`} 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {img.filename}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                      Page {img.pageNumber} · {img.width} × {img.height} px · {(img.bytes.byteLength / 1024).toFixed(0)} KB
                    </span>
                  </div>

                  {/* Single Download Button */}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDownloadSingle(img)}
                    style={{ height: '28px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Download this image"
                  >
                    <Download size={13} />
                    <span>Save</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

