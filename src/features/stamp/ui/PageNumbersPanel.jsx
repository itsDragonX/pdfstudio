import React from 'react';
import { Hash, AlertCircle } from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useStampContext } from '../context/StampContext.jsx';
import { useStamp } from '../hooks/useStamp.js';
import { PAGE_NUMBER_FORMATS, PAGE_NUMBER_POSITIONS } from '../services/pageNumberService.js';

const FONT_OPTIONS = [
  { id: 'Helvetica', label: 'Helvetica (Sans-Serif)' },
  { id: 'HelveticaBold', label: 'Helvetica Bold' },
  { id: 'TimesRoman', label: 'Times Roman (Serif)' },
  { id: 'Courier', label: 'Courier (Monospace)' }
];

const PRESET_COLORS = [
  '#000000', // Black
  '#333333', // Charcoal
  '#636366', // Dark Gray
  '#0A84FF', // Blue
  '#FF3B30', // Red
  '#34C759'  // Green
];

export default function PageNumbersPanel() {
  const { numPages, currentPage, setActiveToolId } = useDocument();
  const { stampPayload, updateStampPayload } = useStampContext();
  const { isProcessing, error, handleApplyPageNumbers } = useStamp();

  const handleSubmit = async () => {
    try {
      await handleApplyPageNumbers(stampPayload);
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

      {/* Numbering Format */}
      <div className="property-group">
        <label className="property-label" htmlFor="page-format-select">Format</label>
        <select
          id="page-format-select"
          className="select-field"
          value={stampPayload.format || 'page_n_of_total'}
          onChange={(e) => updateStampPayload({ format: e.target.value })}
        >
          {PAGE_NUMBER_FORMATS.map((f) => (
            <option key={f.id} value={f.id}>{f.label} ({f.example})</option>
          ))}
        </select>
      </div>

      {/* Custom Prefix & Suffix if Custom Format */}
      {stampPayload.format === 'custom' && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <div className="property-group" style={{ flex: 1 }}>
            <label className="property-label" htmlFor="custom-prefix-input">Prefix</label>
            <input
              id="custom-prefix-input"
              type="text"
              className="text-input"
              value={stampPayload.customPrefix || ''}
              onChange={(e) => updateStampPayload({ customPrefix: e.target.value })}
              placeholder="e.g. DOC-"
            />
          </div>
          <div className="property-group" style={{ flex: 1 }}>
            <label className="property-label" htmlFor="custom-suffix-input">Suffix</label>
            <input
              id="custom-suffix-input"
              type="text"
              className="text-input"
              value={stampPayload.customSuffix || ''}
              onChange={(e) => updateStampPayload({ customSuffix: e.target.value })}
              placeholder="e.g. -DRAFT"
            />
          </div>
        </div>
      )}

      {/* Starting Number */}
      <div className="property-group">
        <label className="property-label">Start Numbering From</label>
        <div className="stepper-row">
          <button
            type="button"
            className="stepper-btn"
            onClick={() => updateStampPayload({ startNumber: Math.max(1, (stampPayload.startNumber || 1) - 1) })}
          >
            -
          </button>
          <span className="stepper-value">{stampPayload.startNumber || 1}</span>
          <button
            type="button"
            className="stepper-btn"
            onClick={() => updateStampPayload({ startNumber: (stampPayload.startNumber || 1) + 1 })}
          >
            +
          </button>
        </div>
      </div>

      {/* Placement (6 positions) */}
      <div className="property-group">
        <label className="property-label" htmlFor="page-pos-select">Position</label>
        <select
          id="page-pos-select"
          className="select-field"
          value={stampPayload.position || 'bottom-center'}
          onChange={(e) => updateStampPayload({ position: e.target.value })}
        >
          {PAGE_NUMBER_POSITIONS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Typography */}
      <div className="property-group">
        <label className="property-label" htmlFor="page-font-select">Typography</label>
        <select
          id="page-font-select"
          className="select-field"
          value={stampPayload.fontName || 'Helvetica'}
          onChange={(e) => updateStampPayload({ fontName: e.target.value })}
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Font Size & Margin Steppers */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div className="property-group" style={{ flex: 1 }}>
          <label className="property-label">Font Size</label>
          <div className="stepper-row">
            <button
              type="button"
              className="stepper-btn"
              onClick={() => updateStampPayload({ fontSize: Math.max(8, (stampPayload.fontSize || 10) - 1) })}
            >
              -
            </button>
            <span className="stepper-value">{stampPayload.fontSize || 10} pt</span>
            <button
              type="button"
              className="stepper-btn"
              onClick={() => updateStampPayload({ fontSize: Math.min(24, (stampPayload.fontSize || 10) + 1) })}
            >
              +
            </button>
          </div>
        </div>

        <div className="property-group" style={{ flex: 1 }}>
          <label className="property-label">Edge Margin</label>
          <div className="stepper-row">
            <button
              type="button"
              className="stepper-btn"
              onClick={() => updateStampPayload({ margin: Math.max(14, (stampPayload.margin || 36) - 4) })}
            >
              -
            </button>
            <span className="stepper-value">{stampPayload.margin || 36} pt</span>
            <button
              type="button"
              className="stepper-btn"
              onClick={() => updateStampPayload({ margin: Math.min(72, (stampPayload.margin || 36) + 4) })}
            >
              +
            </button>
          </div>
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

      {/* Exclude First Page Option */}
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
            checked={!!stampPayload.excludeFirstPage}
            onChange={(e) => updateStampPayload({ excludeFirstPage: e.target.checked })}
          />
          <span>Exclude first page (cover page)</span>
        </label>
      </div>

      {/* Target Pages */}
      <div className="property-group">
        <label className="property-label" htmlFor="page-num-target-select">Apply To</label>
        <select
          id="page-num-target-select"
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
          <label className="property-label" htmlFor="page-num-range-input">Page Range</label>
          <input
            id="page-num-range-input"
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
          <Hash size={14} />
          <span>{isProcessing ? 'Adding...' : 'Apply Page Numbers'}</span>
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

