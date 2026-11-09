import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  AlertCircle, 
  AlertTriangle, 
  FileCheck, 
  RefreshCw, 
  Layers, 
  Sparkles,
  Zap,
  Check
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useFinishContext } from '../context/FinishContext.jsx';
import { useFinish } from '../hooks/useFinish.js';
import { COMPRESSION_PRESETS } from '../services/compressService.js';

export default function CompressPanel() {
  const { docFile, numPages } = useDocument();
  const {
    compressionMethod,
    setCompressionMethod,
    compressResult,
    setCompressResult
  } = useFinishContext();

  const {
    isProcessing,
    progressMessage,
    progressPercent,
    error,
    setError,
    successMessage,
    handleCompress,
    downloadPdf
  } = useFinish();

  const [rasterAcknowledged, setRasterAcknowledged] = useState(false);

  const isRasterSelected = compressionMethod.startsWith('raster');
  const currentPreset = COMPRESSION_PRESETS.find((p) => p.id === compressionMethod) || COMPRESSION_PRESETS[0];

  const handleRunCompress = async () => {
    if (isRasterSelected && !rasterAcknowledged) {
      setError('Please acknowledge the rasterization warning before proceeding.');
      return;
    }
    try {
      await handleCompress();
    } catch {
      // Handled in hook
    }
  };

  const handleReset = () => {
    setCompressResult(null);
  };

  if (!docFile) {
    return (
      <div className="organise-tool-panel">
        <div className="banner-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={15} />
          <span>Please open a PDF document first to compress its file size.</span>
        </div>
      </div>
    );
  }

  const cleanDocName = (docFile.name || 'document').replace(/\.pdf$/i, '');
  const outputFilename = `${cleanDocName}_compressed.pdf`;

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
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, fontWeight: 500, color: 'var(--text-tertiary)' }}>
          <span>{numPages} {numPages === 1 ? 'page' : 'pages'}</span>
          <span>·</span>
          <span>{(docFile.size / 1024).toFixed(1)} KB</span>
        </div>
      </div>

      {/* COMPRESSION CONFIGURATION OR RESULT */}
      {!compressResult ? (
        <>
          {/* Method Selection */}
          <div className="property-group">
            <label className="property-label">Compression Strategy</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {COMPRESSION_PRESETS.map((preset) => {
                const isSelected = compressionMethod === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      setCompressionMethod(preset.id);
                      if (!preset.id.startsWith('raster')) setRasterAcknowledged(false);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--accent-subtle, rgba(0, 122, 255, 0.12))' : 'var(--surface-secondary)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {preset.name}
                      </span>
                      {preset.recommended && (
                        <span style={{ fontSize: '9px', fontWeight: 600, padding: '1px 5px', borderRadius: '4px', background: 'var(--accent)', color: '#FFFFFF' }}>
                          Recommended
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', lineHeight: '1.3' }}>
                      {preset.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rasterization Warning & Acknowledgment */}
          {isRasterSelected && (
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
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
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <AlertTriangle size={15} color="#FF9F0A" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', color: '#FF9F0A', marginBottom: '2px' }}>
                    Rasterization Notice
                  </strong>
                  High Compression re-renders pages into compressed JPEG images. Selectable text, bookmarks, form fields, and vector crispness will be flattened into raster pixels.
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '10.5px', marginTop: '2px' }}>
                <input
                  type="checkbox"
                  checked={rasterAcknowledged}
                  onChange={(e) => setRasterAcknowledged(e.target.checked)}
                  style={{ width: '14px', height: '14px', accentColor: 'var(--accent)' }}
                />
                <span>I understand and want to flatten pages to reduce file size</span>
              </label>
            </div>
          )}

          {/* Progress Bar */}
          {isProcessing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '6px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <span>{progressMessage || 'Compressing document...'}</span>
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

          {/* Compress Button */}
          <div className="organise-action-footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRunCompress}
              disabled={isProcessing || (isRasterSelected && !rasterAcknowledged)}
              style={{ width: '100%' }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  <span>Compressing PDF...</span>
                </>
              ) : (
                <>
                  <Zap size={14} />
                  <span>Compress Document</span>
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        /* RESULTS VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Comparison Card */}
          <div 
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: compressResult.savedBytes > 0 ? 'rgba(52, 199, 89, 0.1)' : 'var(--surface-secondary)',
              border: `1px solid ${compressResult.savedBytes > 0 ? 'rgba(52, 199, 89, 0.3)' : 'var(--border-subtle)'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={16} color="var(--success, #34C759)" />
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Compression Complete
                </span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleReset}
                style={{ height: '22px', fontSize: '10px', padding: '0 6px' }}
              >
                Compress Again
              </button>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
              <div style={{ padding: '8px', background: 'var(--surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '10px', display: 'block' }}>Original Size</span>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {(compressResult.originalSize / 1024).toFixed(1)} KB
                </strong>
              </div>

              <div style={{ padding: '8px', background: 'var(--surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '10px', display: 'block' }}>Compressed Size</span>
                <strong style={{ fontSize: '13px', color: 'var(--accent)' }}>
                  {(compressResult.outputSize / 1024).toFixed(1)} KB
                </strong>
              </div>
            </div>

            {/* Size Delta Banner */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                borderRadius: '6px',
                background: compressResult.savedBytes > 0 ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 159, 10, 0.12)',
                fontSize: '11px',
                fontWeight: 600,
                color: compressResult.savedBytes > 0 ? 'var(--success, #34C759)' : '#FF9F0A'
              }}
            >
              <span>{compressResult.savedBytes > 0 ? 'Space Saved:' : 'File Status:'}</span>
              <span>
                {compressResult.savedBytes > 0 
                  ? `-${compressResult.percentReduction}% (${(compressResult.savedBytes / 1024).toFixed(1)} KB)`
                  : (compressResult.isLarger ? 'Original was already more compact' : 'Identical file size')}
              </span>
            </div>

            {compressResult.isFlattened && (
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                * Pages have been re-encoded as high-efficiency JPEG images.
              </span>
            )}
          </div>

          {/* Download Action */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => downloadPdf(compressResult.bytes, outputFilename)}
            style={{ width: '100%', gap: '6px' }}
          >
            <Download size={14} />
            <span>Download Compressed PDF</span>
          </button>
        </div>
      )}
    </div>
  );
}

