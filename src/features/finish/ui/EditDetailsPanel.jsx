import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  FileCheck, 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  Calendar,
  Check,
  Tag
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useFinishContext } from '../context/FinishContext.jsx';
import { useFinish } from '../hooks/useFinish.js';

export default function EditDetailsPanel() {
  const { docFile, numPages } = useDocument();
  const {
    editMetadataForm,
    setEditMetadataForm,
    originalMetadata,
    editDetailsResult,
    setEditDetailsResult
  } = useFinishContext();

  const {
    isProcessing,
    progressMessage,
    error,
    setError,
    successMessage,
    handleUpdateDetails,
    downloadPdf
  } = useFinish();

  const handleFieldChange = (key, value) => {
    setEditMetadataForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSetDateNow = (key) => {
    const nowStr = new Date().toISOString().split('T')[0];
    handleFieldChange(key, nowStr);
  };

  const handleRunSave = async () => {
    try {
      await handleUpdateDetails();
    } catch {
      // Handled in hook
    }
  };

  const handleReset = () => {
    setEditDetailsResult(null);
  };

  if (!docFile) {
    return (
      <div className="organise-tool-panel">
        <div className="banner-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={15} />
          <span>Please open a PDF document first to view and edit its metadata details.</span>
        </div>
      </div>
    );
  }

  const cleanDocName = (docFile.name || 'document').replace(/\.pdf$/i, '');
  const outputFilename = `${cleanDocName}_metadata.pdf`;

  // Calculate modified fields count
  const modifiedCount = originalMetadata
    ? Object.keys(editMetadataForm).filter((k) => {
        if (k === 'keywords') return editMetadataForm.keywords !== (originalMetadata.keywordsString || '');
        if (k === 'creationDate') return editMetadataForm.creationDate !== (originalMetadata.creationDateFormatted || '');
        if (k === 'modificationDate') return false; // Always updated
        return editMetadataForm[k] !== (originalMetadata[k] || '');
      }).length
    : 0;

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

      {/* FORM FIELDS OR RESULT */}
      {!editDetailsResult ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Title */}
          <div className="property-group">
            <label className="property-label">Document Title</label>
            <input
              type="text"
              placeholder="e.g. Annual Financial Report"
              value={editMetadataForm.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className="text-input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Author */}
          <div className="property-group">
            <label className="property-label">Author / Creator Name</label>
            <input
              type="text"
              placeholder="e.g. Jane Doe"
              value={editMetadataForm.author}
              onChange={(e) => handleFieldChange('author', e.target.value)}
              className="text-input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Subject */}
          <div className="property-group">
            <label className="property-label">Subject</label>
            <input
              type="text"
              placeholder="e.g. Q4 Business Analysis"
              value={editMetadataForm.subject}
              onChange={(e) => handleFieldChange('subject', e.target.value)}
              className="text-input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Keywords */}
          <div className="property-group">
            <label className="property-label">Keywords (Comma-Separated)</label>
            <input
              type="text"
              placeholder="e.g. finance, 2026, audit, tax"
              value={editMetadataForm.keywords}
              onChange={(e) => handleFieldChange('keywords', e.target.value)}
              className="text-input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Creator Tool */}
          <div className="property-group">
            <label className="property-label">Creator Application</label>
            <input
              type="text"
              placeholder="e.g. PDF Studio Desktop"
              value={editMetadataForm.creator}
              onChange={(e) => handleFieldChange('creator', e.target.value)}
              className="text-input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Producer */}
          <div className="property-group">
            <label className="property-label">Producer (PDF Engine)</label>
            <input
              type="text"
              placeholder="e.g. pdf-lib / PDF Studio"
              value={editMetadataForm.producer}
              onChange={(e) => handleFieldChange('producer', e.target.value)}
              className="text-input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Dates: Creation & Modification */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="property-group">
              <div className="property-label-row">
                <label className="property-label">Creation Date</label>
                <button
                  type="button"
                  onClick={() => handleSetDateNow('creationDate')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '9.5px', cursor: 'pointer', padding: 0 }}
                >
                  Today
                </button>
              </div>
              <input
                type="date"
                value={editMetadataForm.creationDate}
                onChange={(e) => handleFieldChange('creationDate', e.target.value)}
                className="text-input"
                style={{ width: '100%', fontSize: '11px' }}
              />
            </div>

            <div className="property-group">
              <div className="property-label-row">
                <label className="property-label">Mod Date</label>
                <button
                  type="button"
                  onClick={() => handleSetDateNow('modificationDate')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '9.5px', cursor: 'pointer', padding: 0 }}
                >
                  Now
                </button>
              </div>
              <input
                type="date"
                value={editMetadataForm.modificationDate}
                onChange={(e) => handleFieldChange('modificationDate', e.target.value)}
                className="text-input"
                style={{ width: '100%', fontSize: '11px' }}
              />
            </div>
          </div>

          {/* Progress Message */}
          {isProcessing && (
            <div style={{ fontSize: '11px', color: 'var(--accent)', textAlign: 'center', margin: '4px 0' }}>
              {progressMessage || 'Saving metadata changes...'}
            </div>
          )}

          {/* Save Action */}
          <div className="organise-action-footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRunSave}
              disabled={isProcessing}
              style={{ width: '100%' }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  <span>Saving Metadata...</span>
                </>
              ) : (
                <>
                  <FileText size={14} />
                  <span>Save & Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* RESULTS VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div 
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(52, 199, 89, 0.1)',
              border: '1px solid rgba(52, 199, 89, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={16} color="var(--success, #34C759)" />
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Metadata Successfully Updated
                </span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleReset}
                style={{ height: '22px', fontSize: '10px', padding: '0 6px' }}
              >
                Edit Again
              </button>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Saved output: <strong>{editDetailsResult.filename}</strong>
            </div>

            {/* Verified Fields List */}
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                padding: '8px',
                background: 'var(--surface)',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                fontSize: '10.5px'
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                Verified Stored Values:
              </div>
              {editDetailsResult.verifiedMetadata?.detectedFields?.map((f) => (
                <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>{f.label}:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => downloadPdf(editDetailsResult.bytes, editDetailsResult.filename)}
            style={{ width: '100%', gap: '6px' }}
          >
            <Download size={14} />
            <span>Download Updated PDF</span>
          </button>
        </div>
      )}
    </div>
  );
}

