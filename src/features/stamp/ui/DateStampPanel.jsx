import React from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useStampContext } from '../context/StampContext.jsx';
import { useStamp } from '../hooks/useStamp.js';
import { DATE_FORMATS, DATE_STAMP_POSITIONS, formatDate } from '../services/dateStampService.js';

const FONT_OPTIONS = [
  { id: 'Helvetica', label: 'Helvetica (Sans-Serif)' },
  { id: 'HelveticaBold', label: 'Helvetica Bold' },
  { id: 'TimesRoman', label: 'Times Roman (Serif)' },
  { id: 'Courier', label: 'Courier (Monospace)' }
];

const PRESET_COLORS = [
  '#000000',
  '#333333',
  '#636366',
  '#0A84FF',
  '#FF3B30',
  '#34C759',
  '#AF52DE'
];

export default function DateStampPanel() {
  const { numPages, currentPage, setActiveToolId } = useDocument();
  const { stampPayload, updateStampPayload } = useStampContext();
  const { isProcessing, error, handleApplyDateStamp } = useStamp();

  const previewDateString = formatDate(
    stampPayload.timestamp || Date.now(),
    stampPayload.dateFormat || 'DD/MM/YYYY',
    stampPayload.includeTime || false,
    stampPayload.timeFormat || '24h'
  );

  const fullPreviewText = stampPayload.prefix 
    ? `${stampPayload.prefix}${previewDateString}` 
    : previewDateString;

  const handleSubmit = async () => {
    try {
      await handleApplyDateStamp({
        ...stampPayload,
        timestamp: stampPayload.timestamp || Date.now()
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

      {/* Captured Date Live Preview Pill */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'var(--surface-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          fontSize: '12px',
          color: 'var(--text-primary)'
        }}
      >
        <Calendar size={14} color="var(--accent)" />
        <span style={{ fontWeight: 600 }}>{fullPreviewText}</span>
      </div>

      {/* Date Format */}
      <div className="property-group">
        <label className="property-label" htmlFor="date-format-select">Date Format</label>
        <select
          id="date-format-select"
          className="select-field"
          value={stampPayload.dateFormat || 'DD/MM/YYYY'}
          onChange={(e) => updateStampPayload({ dateFormat: e.target.value })}
        >
          {DATE_FORMATS.map((f) => (
            <option key={f.id} value={f.id}>{f.label} ({f.example})</option>
          ))}
        </select>
      </div>

      {/* Prefix */}
      <div className="property-group">
        <label className="property-label" htmlFor="date-prefix-input">Prefix (Optional)</label>
        <input
          id="date-prefix-input"
          type="text"
          className="text-input"
          value={stampPayload.prefix || ''}
          onChange={(e) => updateStampPayload({ prefix: e.target.value })}
          placeholder="e.g. RECEIVED: "
        />
      </div>

      {/* Include Time Toggle & Mode */}
      <div className="property-group">
        <label 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontSize: '11.5px', 
            cursor: 'pointer',
            userSelect: 'none',
            marginBottom: stampPayload.includeTime ? '6px' : '0'
          }}
        >
          <input
            type="checkbox"
            checked={!!stampPayload.includeTime}
            onChange={(e) => updateStampPayload({ includeTime: e.target.checked })}
          />
          <Clock size={13} color="var(--accent)" />
          <span>Include timestamp</span>
        </label>

        {stampPayload.includeTime && (
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-control-btn ${stampPayload.timeFormat !== '12h' ? 'active' : ''}`}
              onClick={() => updateStampPayload({ timeFormat: '24h' })}
            >
              <span>24-Hour (14:35)</span>
            </button>
            <button
              type="button"
              className={`segmented-control-btn ${stampPayload.timeFormat === '12h' ? 'active' : ''}`}
              onClick={() => updateStampPayload({ timeFormat: '12h' })}
            >
              <span>12-Hour (02:35 PM)</span>
            </button>
          </div>
        )}
      </div>

      {/* Position */}
      <div className="property-group">
        <label className="property-label" htmlFor="date-pos-select">Position</label>
        <select
          id="date-pos-select"
          className="select-field"
          value={stampPayload.position || 'bottom-right'}
          onChange={(e) => updateStampPayload({ position: e.target.value })}
        >
          {DATE_STAMP_POSITIONS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Typography */}
      <div className="property-group">
        <label className="property-label" htmlFor="date-font-select">Typography</label>
        <select
          id="date-font-select"
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
              onClick={() => updateStampPayload({ fontSize: Math.max(8, (stampPayload.fontSize || 11) - 1) })}
            >
              -
            </button>
            <span className="stepper-value">{stampPayload.fontSize || 11} pt</span>
            <button
              type="button"
              className="stepper-btn"
              onClick={() => updateStampPayload({ fontSize: Math.min(24, (stampPayload.fontSize || 11) + 1) })}
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

      {/* Opacity */}
      <div className="property-group">
        <div className="property-label-row">
          <label className="property-label">Opacity</label>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {Math.round((stampPayload.opacity ?? 1.0) * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={stampPayload.opacity ?? 1.0}
          onChange={(e) => updateStampPayload({ opacity: parseFloat(e.target.value) })}
        />
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

      {/* Exclude First Page */}
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
        <label className="property-label" htmlFor="date-target-select">Apply To</label>
        <select
          id="date-target-select"
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
          <label className="property-label" htmlFor="date-range-input">Page Range</label>
          <input
            id="date-range-input"
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
          <Calendar size={14} />
          <span>{isProcessing ? 'Stamping...' : 'Apply Date Stamp'}</span>
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

