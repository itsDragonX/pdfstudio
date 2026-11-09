import React, { useState } from 'react';
import { Layers, AlertCircle, FileText, Calendar, Hash } from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useStampContext } from '../context/StampContext.jsx';
import { useStamp } from '../hooks/useStamp.js';

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
  '#34C759'
];

export default function HeaderFooterPanel() {
  const { numPages, currentPage, setActiveToolId } = useDocument();
  const { stampPayload, updateStampPayload } = useStampContext();
  const { isProcessing, error, handleApplyHeaderFooter } = useStamp();

  const [activeFocusedZone, setActiveFocusedZone] = useState('footerCenter');

  const insertVariable = (varString) => {
    const currentVal = stampPayload[activeFocusedZone] || '';
    updateStampPayload({
      [activeFocusedZone]: currentVal ? `${currentVal} ${varString}` : varString
    });
  };

  const handleSubmit = async () => {
    try {
      await handleApplyHeaderFooter(stampPayload);
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

      {/* Dynamic Variable Helper Chips */}
      <div className="property-group">
        <label className="property-label">Insert Dynamic Variables</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {[
            { tag: '{page}', label: 'Page #' },
            { tag: '{totalPages}', label: 'Total Pages' },
            { tag: '{filename}', label: 'Filename' },
            { tag: '{date}', label: 'Date' }
          ].map((v) => (
            <button
              key={v.tag}
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => insertVariable(v.tag)}
              title={`Insert ${v.tag} into ${activeFocusedZone}`}
              style={{ fontSize: '10.5px', padding: '3px 8px', height: '26px' }}
            >
              <code>{v.tag}</code>
            </button>
          ))}
        </div>
      </div>

      {/* Header Zones (Top) */}
      <div className="property-group">
        <label className="property-label" style={{ color: 'var(--accent)' }}>Header Zones (Top)</label>
        
        {/* Top Left */}
        <input
          type="text"
          className="text-input"
          style={{ marginBottom: '5px' }}
          value={stampPayload.headerLeft || ''}
          onChange={(e) => updateStampPayload({ headerLeft: e.target.value })}
          onFocus={() => setActiveFocusedZone('headerLeft')}
          placeholder="Top Left (e.g. PDF Studio)"
        />

        {/* Top Center */}
        <input
          type="text"
          className="text-input"
          style={{ marginBottom: '5px' }}
          value={stampPayload.headerCenter || ''}
          onChange={(e) => updateStampPayload({ headerCenter: e.target.value })}
          onFocus={() => setActiveFocusedZone('headerCenter')}
          placeholder="Top Center (e.g. Confidential Report)"
        />

        {/* Top Right */}
        <input
          type="text"
          className="text-input"
          value={stampPayload.headerRight || ''}
          onChange={(e) => updateStampPayload({ headerRight: e.target.value })}
          onFocus={() => setActiveFocusedZone('headerRight')}
          placeholder="Top Right (e.g. DRAFT)"
        />
      </div>

      {/* Footer Zones (Bottom) */}
      <div className="property-group">
        <label className="property-label" style={{ color: 'var(--accent)' }}>Footer Zones (Bottom)</label>

        {/* Bottom Left */}
        <input
          type="text"
          className="text-input"
          style={{ marginBottom: '5px' }}
          value={stampPayload.footerLeft || ''}
          onChange={(e) => updateStampPayload({ footerLeft: e.target.value })}
          onFocus={() => setActiveFocusedZone('footerLeft')}
          placeholder="Bottom Left (e.g. {filename})"
        />

        {/* Bottom Center */}
        <input
          type="text"
          className="text-input"
          style={{ marginBottom: '5px' }}
          value={stampPayload.footerCenter || ''}
          onChange={(e) => updateStampPayload({ footerCenter: e.target.value })}
          onFocus={() => setActiveFocusedZone('footerCenter')}
          placeholder="Bottom Center (e.g. Page {page} of {totalPages})"
        />

        {/* Bottom Right */}
        <input
          type="text"
          className="text-input"
          value={stampPayload.footerRight || ''}
          onChange={(e) => updateStampPayload({ footerRight: e.target.value })}
          onFocus={() => setActiveFocusedZone('footerRight')}
          placeholder="Bottom Right (e.g. {date})"
        />
      </div>

      {/* Typography */}
      <div className="property-group">
        <label className="property-label" htmlFor="hf-font-select">Typography</label>
        <select
          id="hf-font-select"
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
              onClick={() => updateStampPayload({ fontSize: Math.max(7, (stampPayload.fontSize || 10) - 1) })}
            >
              -
            </button>
            <span className="stepper-value">{stampPayload.fontSize || 10} pt</span>
            <button
              type="button"
              className="stepper-btn"
              onClick={() => updateStampPayload({ fontSize: Math.min(20, (stampPayload.fontSize || 10) + 1) })}
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
        <label className="property-label" htmlFor="hf-target-select">Apply To</label>
        <select
          id="hf-target-select"
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
          <label className="property-label" htmlFor="hf-range-input">Page Range</label>
          <input
            id="hf-range-input"
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
          <Layers size={14} />
          <span>{isProcessing ? 'Applying...' : 'Apply Header & Footer'}</span>
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

