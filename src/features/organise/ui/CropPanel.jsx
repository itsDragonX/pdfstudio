import React, { useState, useEffect } from 'react';
import { 
  Crop, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Info 
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useOrganise } from '../hooks/useOrganise.js';

export default function CropPanel() {
  const { currentPage, numPages, pageDimensions, setActiveToolId } = useDocument();
  const { handleCrop, isProcessing, error, successMessage } = useOrganise();

  const currentDim = pageDimensions[currentPage - 1] || { width: 595, height: 842 };

  const [scope, setScope] = useState('current'); // 'current' | 'all'
  // Insets in points from each page edge
  const [insets, setInsets] = useState({
    top: 36, // 0.5 inch default
    bottom: 36,
    left: 36,
    right: 36
  });

  const [preset, setPreset] = useState('0.5in'); // 'none' | '0.5in' | '1in' | '10%' | 'custom'

  const applyPreset = (presetName) => {
    setPreset(presetName);
    const w = currentDim.width;
    const h = currentDim.height;

    if (presetName === 'none') {
      setInsets({ top: 0, bottom: 0, left: 0, right: 0 });
    } else if (presetName === '0.5in') {
      setInsets({ top: 36, bottom: 36, left: 36, right: 36 });
    } else if (presetName === '1in') {
      setInsets({ top: 72, bottom: 72, left: 72, right: 72 });
    } else if (presetName === '10%') {
      setInsets({
        top: Math.round(h * 0.1),
        bottom: Math.round(h * 0.1),
        left: Math.round(w * 0.1),
        right: Math.round(w * 0.1)
      });
    }
  };

  const handleInsetChange = (edge, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setPreset('custom');
    setInsets((prev) => ({ ...prev, [edge]: num }));
  };

  // Calculate resulting crop box in PDF coordinate space (origin at bottom-left)
  const cropBox = {
    x: insets.left,
    y: insets.bottom,
    width: Math.max(20, currentDim.width - insets.left - insets.right),
    height: Math.max(20, currentDim.height - insets.top - insets.bottom)
  };

  const isValidCrop = cropBox.width > 20 && cropBox.height > 20;

  const onExecuteCrop = async () => {
    if (!isValidCrop) return;
    const target = scope === 'all' ? 'all' : [currentPage];
    await handleCrop(target, cropBox);
  };

  const onReset = () => {
    applyPreset('none');
  };

  return (
    <div className="organise-tool-panel crop-panel">
      <div className="organise-panel-desc">
        Adjust page CropBox boundary to crop margins or focus content.
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

      {/* Scope Selector */}
      <div className="property-group">
        <label className="property-label">Apply Crop To</label>
        <div className="organise-segmented-control">
          <button type="button" className={`segmented-pill ${scope === 'current' ? 'active' : ''}`} onClick={() => setScope('current')}>Current ({currentPage})</button>
          <button type="button" className={`segmented-pill ${scope === 'all' ? 'active' : ''}`} onClick={() => setScope('all')}>All Pages ({numPages})</button>
        </div>
      </div>

      {/* Margin Presets */}
      <div className="property-group">
        <label className="property-label">Crop Margin Presets</label>
        <div className="range-presets-row">
          <button
            type="button"
            className={`chip-preset-btn ${preset === '0.5in' ? 'active-preset' : ''}`}
            onClick={() => applyPreset('0.5in')}
          >
            0.5" Margins
          </button>
          <button
            type="button"
            className={`chip-preset-btn ${preset === '1in' ? 'active-preset' : ''}`}
            onClick={() => applyPreset('1in')}
          >
            1.0" Margins
          </button>
          <button
            type="button"
            className={`chip-preset-btn ${preset === '10%' ? 'active-preset' : ''}`}
            onClick={() => applyPreset('10%')}
          >
            10% Trim
          </button>
          <button
            type="button"
            className={`chip-preset-btn ${preset === 'none' ? 'active-preset' : ''}`}
            onClick={() => applyPreset('none')}
          >
            Reset (0)
          </button>
        </div>
      </div>

      {/* Numeric Inset Controls */}
      <div className="property-group">
        <label className="property-label">Margin Insets (Points)</label>
        <div className="crop-insets-grid">
          <div className="inset-field">
            <span className="inset-label">Top</span>
            <input
              type="number"
              className="organise-input inset-input"
              value={insets.top}
              min={0}
              max={Math.floor(currentDim.height / 2)}
              onChange={(e) => handleInsetChange('top', e.target.value)}
            />
          </div>
          <div className="inset-field">
            <span className="inset-label">Bottom</span>
            <input
              type="number"
              className="organise-input inset-input"
              value={insets.bottom}
              min={0}
              max={Math.floor(currentDim.height / 2)}
              onChange={(e) => handleInsetChange('bottom', e.target.value)}
            />
          </div>
          <div className="inset-field">
            <span className="inset-label">Left</span>
            <input
              type="number"
              className="organise-input inset-input"
              value={insets.left}
              min={0}
              max={Math.floor(currentDim.width / 2)}
              onChange={(e) => handleInsetChange('left', e.target.value)}
            />
          </div>
          <div className="inset-field">
            <span className="inset-label">Right</span>
            <input
              type="number"
              className="organise-input inset-input"
              value={insets.right}
              min={0}
              max={Math.floor(currentDim.width / 2)}
              onChange={(e) => handleInsetChange('right', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Resulting Dimensions Box */}
      <div className="merge-summary-card">
        <div className="summary-row">
          <span>Original Size</span>
          <span>{Math.round(currentDim.width)} × {Math.round(currentDim.height)} pt</span>
        </div>
        <div className="summary-row">
          <span>Cropped Size</span>
          <strong>{Math.round(cropBox.width)} × {Math.round(cropBox.height)} pt</strong>
        </div>
      </div>

      {/* Crucial Security Note */}
      <div className="organise-notice-box crop-notice">
        <Info size={13} className="notice-icon" />
        <span>
          <strong>Notice:</strong> CropBox defines the visible/printed region. It does not securely delete underlying content outside the crop boundaries.
        </span>
      </div>

      {/* Action Buttons */}
      <div className="crop-actions-row">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onReset}
          disabled={isProcessing}
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>

        <button
          type="button"
          className="btn btn-primary flex-1 btn-organise-execute"
          onClick={onExecuteCrop}
          disabled={!isValidCrop || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 size={14} className="spin-icon" />
              <span>Applying Crop...</span>
            </>
          ) : (
            <>
              <Crop size={14} />
              <span>Apply Crop</span>
            </>
          )}
        </button>
      </div>

      <button
        type="button"
        className="btn btn-secondary btn-block"
        onClick={() => setActiveToolId(null)}
        disabled={isProcessing}
        style={{ marginTop: '8px' }}
      >
        Cancel
      </button>
    </div>
  );
}
