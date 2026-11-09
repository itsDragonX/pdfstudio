import React, { useRef } from 'react';
import { 
  Upload, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  FileText, 
  Image as ImageIcon, 
  AlertCircle, 
  ExternalLink, 
  Download,
  Plus
} from 'lucide-react';
import { useConvertContext } from '../context/ConvertContext.jsx';
import { useConvert } from '../hooks/useConvert.js';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { PAGE_SIZES, MARGIN_PRESETS } from '../services/imagesToPdfService.js';
import { normalizeImageForPdf } from '../../edit/utils/imageConversion.js';

export default function ImagesToPdfPanel() {
  const fileInputRef = useRef(null);
  const { setActiveToolId } = useDocument();
  const { 
    imagesQueue, 
    setImagesQueue, 
    imagesLayoutOptions, 
    setImagesLayoutOptions 
  } = useConvertContext();

  const { 
    isProcessing, 
    progressMessage, 
    error, 
    setError, 
    handleConvertImagesToPdf 
  } = useConvert();

  // Handle Image File Selection (supports multiple, PNG, JPEG, WebP)
  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError(null);
    try {
      const newItems = [];
      for (const file of files) {
        const normalized = await normalizeImageForPdf(file);
        newItems.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          filename: file.name,
          size: file.size,
          bytes: normalized.bytes,
          format: normalized.format,
          width: normalized.width,
          height: normalized.height,
          previewUrl: normalized.dataUrl
        });
      }
      setImagesQueue((prev) => [...prev, ...newItems]);
    } catch (err) {
      setError(`Failed to process image: ${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Move item up in sequence
  const handleMoveUp = (index) => {
    if (index <= 0) return;
    setImagesQueue((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  // Move item down in sequence
  const handleMoveDown = (index) => {
    if (index >= imagesQueue.length - 1) return;
    setImagesQueue((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  // Remove individual item
  const handleRemove = (id) => {
    setImagesQueue((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear all
  const handleClear = () => {
    setImagesQueue([]);
  };

  const handleExecute = async (openInStudio = false) => {
    try {
      await handleConvertImagesToPdf({
        ...imagesLayoutOptions,
        outputFilename: 'converted-images.pdf'
      }, openInStudio);
    } catch {
      // Error handled in hook
    }
  };

  return (
    <div className="organise-tool-panel">
      {error && (
        <div className="banner-danger">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        multiple
        onChange={handleFilesSelected}
        style={{ display: 'none' }}
      />

      {/* Upload Drop Zone / Add Button */}
      {imagesQueue.length === 0 ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '28px 14px',
            border: '1.5px dashed var(--border-strong)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface-secondary)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            gap: '8px'
          }}
        >
          <Upload size={24} color="var(--accent)" />
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Select Images to Convert
          </span>
          <span style={{ fontSize: '10.5px', color: 'var(--text-tertiary)' }}>
            JPG, PNG, WebP (select one or multiple)
          </span>
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fileInputRef.current?.click()}
            style={{ height: '28px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus size={13} />
            <span>Add More Images</span>
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleClear}
            style={{ height: '28px', fontSize: '11px', color: 'var(--danger)' }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Reorderable Image Queue List */}
      {imagesQueue.length > 0 && (
        <div className="property-group">
          <div className="property-label-row">
            <label className="property-label">Images Queue ({imagesQueue.length})</label>
            <span style={{ fontSize: '10.5px', color: 'var(--text-tertiary)' }}>
              Page 1 to {imagesQueue.length}
            </span>
          </div>

          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '6px', 
              maxHeight: '190px', 
              overflowY: 'auto',
              paddingRight: '2px'
            }}
          >
            {imagesQueue.map((item, index) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  background: 'var(--surface-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                {/* Thumbnail */}
                <div 
                  style={{
                    width: '36px',
                    height: '36px',
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
                  <img src={item.previewUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {index + 1}. {item.filename}
                  </span>
                  <span style={{ fontSize: '9.5px', color: 'var(--text-tertiary)' }}>
                    {item.width} × {item.height} px · {(item.size / 1024).toFixed(0)} KB
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    style={{ width: '22px', height: '22px' }}
                    title="Move Up"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === imagesQueue.length - 1}
                    style={{ width: '22px', height: '22px' }}
                    title="Move Down"
                  >
                    <ChevronDown size={13} />
                  </button>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleRemove(item.id)}
                    style={{ width: '22px', height: '22px', color: 'var(--danger)' }}
                    title="Remove"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Page Size & Layout Controls */}
      <div className="property-group">
        <label className="property-label" htmlFor="page-size-select">Page Size</label>
        <select
          id="page-size-select"
          className="select-field"
          value={imagesLayoutOptions.pageSize}
          onChange={(e) => setImagesLayoutOptions((prev) => ({ ...prev, pageSize: e.target.value }))}
        >
          <option value="A4">A4 (210 × 297 mm)</option>
          <option value="Letter">Letter (8.5 × 11 in)</option>
          <option value="FitToImage">Fit to Image Dimensions</option>
        </select>
      </div>

      {/* Orientation & Layout Mode */}
      {imagesLayoutOptions.pageSize !== 'FitToImage' && (
        <>
          <div className="property-group">
            <label className="property-label">Orientation</label>
            <div className="segmented-control">
              {['auto', 'portrait', 'landscape'].map((ori) => (
                <button
                  key={ori}
                  type="button"
                  className={`segmented-control-btn ${imagesLayoutOptions.orientation === ori ? 'active' : ''}`}
                  onClick={() => setImagesLayoutOptions((prev) => ({ ...prev, orientation: ori }))}
                  style={{ textTransform: 'capitalize' }}
                >
                  <span>{ori}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="property-group">
            <label className="property-label">Fit / Fill</label>
            <div className="segmented-control">
              <button
                type="button"
                className={`segmented-control-btn ${imagesLayoutOptions.layout === 'fit' ? 'active' : ''}`}
                onClick={() => setImagesLayoutOptions((prev) => ({ ...prev, layout: 'fit' }))}
              >
                <span>Fit to Page (No Crop)</span>
              </button>
              <button
                type="button"
                className={`segmented-control-btn ${imagesLayoutOptions.layout === 'fill' ? 'active' : ''}`}
                onClick={() => setImagesLayoutOptions((prev) => ({ ...prev, layout: 'fill' }))}
              >
                <span>Fill Page</span>
              </button>
            </div>
          </div>

          {/* Margins */}
          <div className="property-group">
            <label className="property-label">Margins</label>
            <div className="segmented-control">
              {MARGIN_PRESETS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`segmented-control-btn ${imagesLayoutOptions.margin === m.value ? 'active' : ''}`}
                  onClick={() => setImagesLayoutOptions((prev) => ({ ...prev, margin: m.value }))}
                >
                  <span>{m.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Summary Box */}
      {imagesQueue.length > 0 && (
        <div className="organise-info-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Total Images:</span>
            <strong>{imagesQueue.length}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Expected PDF Pages:</span>
            <strong>{imagesQueue.length}</strong>
          </div>
        </div>
      )}

      {/* Progress Message */}
      {isProcessing && (
        <div style={{ fontSize: '11px', color: 'var(--accent)', textAlign: 'center' }}>
          {progressMessage || 'Processing images...'}
        </div>
      )}

      {/* Action Footer */}
      <div className="organise-action-footer">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => handleExecute(false)}
          disabled={isProcessing || imagesQueue.length === 0}
        >
          <Download size={14} />
          <span>Download PDF</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => handleExecute(true)}
          disabled={isProcessing || imagesQueue.length === 0}
          title="Convert and open in PDF Studio editor"
        >
          <ExternalLink size={14} />
          <span>Open in Studio</span>
        </button>
      </div>
    </div>
  );
}

