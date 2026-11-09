import React, { useRef } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  RotateCw, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Crosshair,
  Trash2
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useEditContext } from '../context/EditContext.jsx';
import { useEdit } from '../hooks/useEdit.js';

export default function AddImagePanel() {
  const { numPages, setActiveToolId } = useDocument();
  const { targetPageIndex, setTargetPageIndex, editPayload, updateEditPayload } = useEditContext();
  const { handleApplyImage, isProcessing, error, setError, successMessage } = useEdit();
  const fileInputRef = useRef(null);

  const previewUrl = editPayload.previewUrl ?? '';
  const width = Math.round(editPayload.width ?? 200);
  const height = Math.round(editPayload.height ?? 150);
  const rotation = editPayload.rotation ?? 0;
  const opacity = editPayload.opacity ?? 1.0;
  const x = Math.round(editPayload.x ?? 100);
  const y = Math.round(editPayload.y ?? 500);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/)) {
      setError('Please select a valid image file (PNG, JPG, or WebP).');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const url = URL.createObjectURL(file);

      // Measure natural dimensions
      const img = new Image();
      img.onload = () => {
        let initW = img.naturalWidth || 200;
        let initH = img.naturalHeight || 150;

        // Scale down if extremely large
        const maxDim = 300;
        if (initW > maxDim || initH > maxDim) {
          const ratio = Math.min(maxDim / initW, maxDim / initH);
          initW = Math.round(initW * ratio);
          initH = Math.round(initH * ratio);
        }

        updateEditPayload({
          imageBytes: bytes,
          format: file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpeg',
          previewUrl: url,
          fileName: file.name,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          width: initW,
          height: initH
        });
      };
      img.src = url;
    } catch (err) {
      setError('Failed to read image file: ' + err.message);
    }
  };

  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    updateEditPayload({ rotation: nextRot });
  };

  const handleRemoveImage = () => {
    updateEditPayload({
      imageBytes: null,
      previewUrl: '',
      fileName: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleWidthChange = (e) => {
    const newW = Math.max(20, Math.min(800, parseInt(e.target.value, 10) || 50));
    const ratio = (editPayload.naturalHeight && editPayload.naturalWidth) 
      ? editPayload.naturalHeight / editPayload.naturalWidth 
      : height / width;
    updateEditPayload({
      width: newW,
      height: Math.round(newW * ratio)
    });
  };

  const onExecuteApply = async () => {
    try {
      await handleApplyImage();
    } catch {
      // Error handled by hook
    }
  };

  return (
    <div className="organise-tool-panel edit-image-panel">
      <div className="organise-panel-desc">
        Insert and place images (PNG, JPEG, WebP) directly onto any document page.
      </div>

      {error && (
        <div className="organise-banner banner-error" role="alert">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="organise-banner banner-success" role="status">
          <CheckCircle2 size={14} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Target Page */}
      <div className="property-group">
        <label className="property-label" htmlFor="image-target-page">Target Page</label>
        <select 
          id="image-target-page"
          className="select-field"
          value={targetPageIndex}
          onChange={(e) => setTargetPageIndex(parseInt(e.target.value, 10))}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <option key={i} value={i}>
              Page {i + 1} of {numPages}
            </option>
          ))}
        </select>
      </div>

      {/* Image File Selection */}
      <div className="property-group">
        <label className="property-label">Image Source</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          id="image-file-upload-input"
        />

        {!previewUrl ? (
          <button
            type="button"
            className="file-drop-target"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={20} className="file-drop-icon" />
            <span className="file-drop-title">Select Image File</span>
            <span className="file-drop-hint">Supports PNG, JPEG, WebP</span>
          </button>
        ) : (
          <div className="image-preview-card">
            <div className="image-preview-thumb-box">
              <img 
                src={previewUrl} 
                alt="Selected" 
                style={{ transform: `rotate(${rotation}deg)` }}
                className="image-preview-thumb"
              />
            </div>
            <div className="image-preview-meta">
              <span className="image-preview-filename">{editPayload.fileName || 'image.png'}</span>
              <span className="image-preview-dim">{width} × {height} pt</span>
              <div className="image-preview-actions">
                <button
                  type="button"
                  className="btn-icon-subtle"
                  onClick={handleRotate}
                  title="Rotate image 90°"
                  aria-label="Rotate 90 degrees"
                >
                  <RotateCw size={14} />
                </button>
                <button
                  type="button"
                  className="btn-icon-subtle text-danger"
                  onClick={handleRemoveImage}
                  title="Remove image"
                  aria-label="Remove image"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Size Controls */}
      {previewUrl && (
        <>
          <div className="property-group">
            <div className="property-label-row">
              <label className="property-label" htmlFor="image-width-slider">Display Width</label>
              <span className="property-value-badge">{width} pt</span>
            </div>
            <input
              id="image-width-slider"
              type="range"
              min="40"
              max="500"
              step="5"
              value={width}
              onChange={handleWidthChange}
              className="slider-range"
            />
          </div>

          <div className="property-group">
            <div className="property-label-row">
              <label className="property-label" htmlFor="image-opacity-slider">Opacity</label>
              <span className="property-value-badge">{Math.round(opacity * 100)}%</span>
            </div>
            <input
              id="image-opacity-slider"
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={(e) => updateEditPayload({ opacity: parseFloat(e.target.value) })}
              className="slider-range"
            />
          </div>

          <div className="organise-info-box">
            <Crosshair size={13} className="info-icon" />
            <div className="info-text">
              <strong>Position:</strong> (X: {x}, Y: {y}). Drag the image on page {targetPageIndex + 1} to position.
            </div>
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="organise-action-footer">
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={onExecuteApply}
          disabled={isProcessing || !editPayload.imageBytes}
        >
          {isProcessing ? (
            <>
              <Loader2 size={14} className="spin-icon" />
              <span>Embedding Image...</span>
            </>
          ) : (
            <>
              <ImageIcon size={14} />
              <span>Apply Image to Page {targetPageIndex + 1}</span>
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

