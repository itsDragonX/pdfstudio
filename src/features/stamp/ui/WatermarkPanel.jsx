import React, { useState } from 'react';
import { 
  Stamp, 
  Upload, 
  RotateCw, 
  Grid, 
  Image as ImageIcon, 
  Type, 
  AlertCircle, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useStampContext } from '../context/StampContext.jsx';
import { useStamp } from '../hooks/useStamp.js';
import { WATERMARK_PRESETS } from '../services/watermarkService.js';
import { FONT_MAP } from '../services/fontHelper.js';

const FONT_OPTIONS = [
  { id: 'Helvetica', label: 'Helvetica (Sans-Serif)' },
  { id: 'HelveticaBold', label: 'Helvetica Bold' },
  { id: 'TimesRoman', label: 'Times Roman (Serif)' },
  { id: 'Courier', label: 'Courier (Monospace)' }
];

const PRESET_COLORS = [
  '#FF3B30', // Red (Confidential)
  '#8E8E93', // Gray (Draft)
  '#0A84FF', // Blue (Sample)
  '#FF9500', // Orange (Custom)
  '#AF52DE', // Purple
  '#000000', // Black
  '#34C759'  // Green
];

const POSITIONS = [
  { id: 'center', label: 'Center (Default)' },
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-right', label: 'Bottom Right' }
];

export default function WatermarkPanel() {
  const { numPages, currentPage, setActiveToolId } = useDocument();
  const { stampPayload, updateStampPayload } = useStampContext();
  const { isProcessing, error, setError, handleApplyWatermark } = useStamp();

  const [activeTab, setActiveTab] = useState(stampPayload.type || 'text');
  const [selectedPreset, setSelectedPreset] = useState('confidential');

  // Handle Preset Selection
  const handleSelectPreset = (presetId) => {
    setSelectedPreset(presetId);
    const preset = WATERMARK_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      updateStampPayload({
        text: preset.text,
        color: preset.color,
        rotation: preset.rotation
      });
    }
  };

  // Handle Image Upload with WebP conversion
  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const isWebp = file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp');
      
      if (isWebp) {
        // Convert WebP to PNG via canvas
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(async (blob) => {
            const buffer = await blob.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            updateStampPayload({
              imageBytes: bytes,
              imageFormat: 'png',
              imagePreviewUrl: canvas.toDataURL('image/png'),
              imageWidth: img.width,
              imageHeight: img.height
            });
            URL.revokeObjectURL(objectUrl);
          }, 'image/png');
        };
        img.src = objectUrl;
      } else {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const format = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
        const previewUrl = URL.createObjectURL(file);

        // Read natural dimensions
        const img = new Image();
        img.onload = () => {
          updateStampPayload({
            imageBytes: bytes,
            imageFormat: format,
            imagePreviewUrl: previewUrl,
            imageWidth: img.width,
            imageHeight: img.height
          });
        };
        img.src = previewUrl;
      }
    } catch (err) {
      setError(`Failed to read image: ${err.message}`);
    }
  };

  const handleSubmit = async () => {
    try {
      await handleApplyWatermark({
        ...stampPayload,
        type: activeTab
      });
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

      {/* Mode Switcher: Text vs Image */}
      <div className="segmented-control" role="tablist">
        <button
          type="button"
          className={`segmented-control-btn ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('text');
            updateStampPayload({ type: 'text' });
          }}
          role="tab"
          aria-selected={activeTab === 'text'}
        >
          <Type size={13} />
          <span>Text Watermark</span>
        </button>
        <button
          type="button"
          className={`segmented-control-btn ${activeTab === 'image' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('image');
            updateStampPayload({ type: 'image' });
          }}
          role="tab"
          aria-selected={activeTab === 'image'}
        >
          <ImageIcon size={13} />
          <span>Image Watermark</span>
        </button>
      </div>

      {activeTab === 'text' ? (
        <>
          {/* Quick Presets */}
          <div className="property-group">
            <label className="property-label">Presets</label>
            <div className="segmented-control" style={{ flexWrap: 'wrap' }}>
              {WATERMARK_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`segmented-control-btn ${selectedPreset === p.id ? 'active' : ''}`}
                  onClick={() => handleSelectPreset(p.id)}
                  style={{ fontSize: '10.5px' }}
                >
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Watermark Text */}
          <div className="property-group">
            <label className="property-label" htmlFor="watermark-text-input">Watermark Text</label>
            <input
              id="watermark-text-input"
              type="text"
              className="text-input"
              value={stampPayload.text || ''}
              onChange={(e) => updateStampPayload({ text: e.target.value })}
              placeholder="e.g. CONFIDENTIAL"
            />
          </div>

          {/* Typography */}
          <div className="property-group">
            <label className="property-label" htmlFor="watermark-font-select">Typography</label>
            <select
              id="watermark-font-select"
              className="select-field"
              value={stampPayload.fontName || 'HelveticaBold'}
              onChange={(e) => updateStampPayload({ fontName: e.target.value })}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div className="property-group">
            <label className="property-label">Font Size</label>
            <div className="stepper-row">
              <button
                type="button"
                className="stepper-btn"
                onClick={() => updateStampPayload({ fontSize: Math.max(12, (stampPayload.fontSize || 48) - 4) })}
              >
                -
              </button>
              <span className="stepper-value">{stampPayload.fontSize || 48} pt</span>
              <button
                type="button"
                className="stepper-btn"
                onClick={() => updateStampPayload({ fontSize: Math.min(120, (stampPayload.fontSize || 48) + 4) })}
              >
                +
              </button>
            </div>
          </div>

          {/* Color */}
          <div className="property-group">
            <label className="property-label">Text Color</label>
            <div className="color-swatches-grid">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch-circle ${stampPayload.color === c ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => updateStampPayload({ color: c })}
                  title={c}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Image Watermark Controls */
        <>
          <div className="property-group">
            <label className="property-label">Watermark Image</label>
            <input
              id="watermark-img-upload"
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleImageFile}
              style={{ display: 'none' }}
            />
            {stampPayload.imagePreviewUrl ? (
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '10px',
                  background: 'var(--surface-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  gap: '8px'
                }}
              >
                <img 
                  src={stampPayload.imagePreviewUrl} 
                  alt="Watermark Preview" 
                  style={{ maxHeight: '70px', maxWidth: '100%', objectFit: 'contain' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => document.getElementById('watermark-img-upload')?.click()}
                  style={{ height: '28px', fontSize: '11px' }}
                >
                  Change Image
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => document.getElementById('watermark-img-upload')?.click()}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '18px 10px',
                  border: '1.5px dashed var(--border-strong)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-secondary)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  gap: '6px'
                }}
              >
                <Upload size={20} color="var(--accent)" />
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Upload Image
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                  PNG (transparency), JPEG, WebP
                </span>
              </button>
            )}
          </div>

          {/* Image Scale */}
          <div className="property-group">
            <div className="property-label-row">
              <label className="property-label">Scale</label>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {Math.round((stampPayload.imageScale || 1.0) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.05"
              value={stampPayload.imageScale || 1.0}
              onChange={(e) => updateStampPayload({ imageScale: parseFloat(e.target.value) })}
            />
          </div>
        </>
      )}

      {/* Shared Controls: Opacity, Rotation, Position, Tiling, Target Pages */}
      <div className="property-group">
        <div className="property-label-row">
          <label className="property-label">Opacity</label>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {Math.round((stampPayload.opacity ?? 0.25) * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0.05"
          max="1.0"
          step="0.05"
          value={stampPayload.opacity ?? 0.25}
          onChange={(e) => updateStampPayload({ opacity: parseFloat(e.target.value) })}
        />
      </div>

      {/* Rotation */}
      <div className="property-group">
        <div className="property-label-row">
          <label className="property-label">Rotation</label>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {stampPayload.rotation ?? -45}°
          </span>
        </div>
        <div className="segmented-control" style={{ marginBottom: '6px' }}>
          {[-45, 0, 45, 90].map((deg) => (
            <button
              key={deg}
              type="button"
              className={`segmented-control-btn ${stampPayload.rotation === deg ? 'active' : ''}`}
              onClick={() => updateStampPayload({ rotation: deg })}
            >
              <span>{deg}°</span>
            </button>
          ))}
        </div>
        <input
          type="range"
          min="-90"
          max="90"
          step="5"
          value={stampPayload.rotation ?? -45}
          onChange={(e) => updateStampPayload({ rotation: parseInt(e.target.value, 10) })}
        />
      </div>

      {/* Position */}
      <div className="property-group">
        <label className="property-label" htmlFor="watermark-pos-select">Position</label>
        <select
          id="watermark-pos-select"
          className="select-field"
          value={stampPayload.position || 'center'}
          onChange={(e) => updateStampPayload({ position: e.target.value })}
        >
          {POSITIONS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Tiling Option */}
      <div className="property-group">
        <label 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontSize: '11.5px', 
            cursor: 'pointer',
            userSelect: 'none' 
          }}
        >
          <input
            type="checkbox"
            checked={!!stampPayload.isTiled}
            onChange={(e) => updateStampPayload({ isTiled: e.target.checked })}
          />
          <Grid size={13} color="var(--accent)" />
          <span>Tile / repeat across entire page</span>
        </label>
      </div>

      {/* Page Target Selection */}
      <div className="property-group">
        <label className="property-label" htmlFor="watermark-target-select">Apply To</label>
        <select
          id="watermark-target-select"
          className="select-field"
          value={stampPayload.pageTarget || 'all'}
          onChange={(e) => updateStampPayload({ pageTarget: e.target.value })}
        >
          <option value="all">All Pages ({numPages})</option>
          <option value="current">Current Page ({currentPage})</option>
          <option value="range">Page Range (e.g. 1-3, 5)</option>
        </select>
      </div>

      {stampPayload.pageTarget === 'range' && (
        <div className="property-group">
          <label className="property-label" htmlFor="watermark-range-input">Page Range</label>
          <input
            id="watermark-range-input"
            type="text"
            className="text-input"
            value={stampPayload.rangeString || ''}
            onChange={(e) => updateStampPayload({ rangeString: e.target.value })}
            placeholder="e.g. 1-3, 5"
          />
        </div>
      )}

      {/* Action Footer */}
      <div className="organise-action-footer">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={isProcessing}
        >
          <Stamp size={14} />
          <span>{isProcessing ? 'Applying...' : 'Apply Watermark'}</span>
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setActiveToolId(null)}
          disabled={isProcessing}
        >
          <span>Cancel</span>
        </button>
      </div>
    </div>
  );
}

