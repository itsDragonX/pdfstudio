import React, { useRef, useState } from 'react';
import { 
  FileText, 
  Upload, 
  AlertCircle, 
  FileCheck, 
  RefreshCw, 
  Layers, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Columns,
  Sparkles,
  GitCompare,
  Check,
  X
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useFinishContext } from '../context/FinishContext.jsx';
import { useFinish } from '../hooks/useFinish.js';
import { normalizeToUint8Array } from '../../organise/services/pageOperations.js';

export default function ComparePanel() {
  const { docFile } = useDocument();
  const fileInputARef = useRef(null);
  const fileInputBRef = useRef(null);

  const {
    compareFileA,
    setCompareFileA,
    compareFileB,
    setCompareFileB,
    compareResult,
    setCompareResult,
    selectedComparePage,
    setSelectedComparePage,
    compareViewMode,
    setCompareViewMode
  } = useFinishContext();

  const {
    isProcessing,
    progressMessage,
    progressPercent,
    error,
    setError,
    successMessage,
    handleCompare
  } = useFinish();

  // Handle uploading Document A
  const handleSelectFileA = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const bytes = await normalizeToUint8Array(file, 'Compare PDF A');
      setCompareFileA({
        name: file.name,
        size: file.size,
        bytes
      });
      setCompareResult(null);
    } catch (err) {
      setError(`Failed to read PDF A: ${err.message}`);
    } finally {
      if (fileInputARef.current) fileInputARef.current.value = '';
    }
  };

  // Handle uploading Document B
  const handleSelectFileB = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const bytes = await normalizeToUint8Array(file, 'Compare PDF B');
      setCompareFileB({
        name: file.name,
        size: file.size,
        bytes
      });
      setCompareResult(null);
    } catch (err) {
      setError(`Failed to read PDF B: ${err.message}`);
    } finally {
      if (fileInputBRef.current) fileInputBRef.current.value = '';
    }
  };

  const handleRunCompare = async () => {
    try {
      await handleCompare();
    } catch {
      // Handled in hook
    }
  };

  const handleReset = () => {
    setCompareResult(null);
  };

  const currentPageData = compareResult?.pages?.find(
    (p) => p.pageNumber === selectedComparePage
  ) || compareResult?.pages?.[0];

  return (
    <div className="organise-tool-panel">
      {/* Hidden file inputs */}
      <input
        ref={fileInputARef}
        type="file"
        accept="application/pdf"
        onChange={handleSelectFileA}
        style={{ display: 'none' }}
      />
      <input
        ref={fileInputBRef}
        type="file"
        accept="application/pdf"
        onChange={handleSelectFileB}
        style={{ display: 'none' }}
      />

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

      {/* DOCUMENT SELECTION CARDS (PDF A & PDF B) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* PDF A */}
        <div
          style={{
            padding: '8px 10px',
            background: 'var(--surface-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(0,122,255,0.1)' }}>
              PDF A
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {compareFileA?.name || 'No document selected'}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => fileInputARef.current?.click()}
            style={{ height: '22px', fontSize: '10px', padding: '0 6px', flexShrink: 0 }}
          >
            {compareFileA ? 'Change' : 'Select'}
          </button>
        </div>

        {/* PDF B */}
        <div
          style={{
            padding: '8px 10px',
            background: 'var(--surface-secondary)',
            border: `1px dashed ${compareFileB ? 'var(--border-subtle)' : 'var(--accent)'}`,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span style={{ fontWeight: 700, color: '#34C759', fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(52,199,89,0.1)' }}>
              PDF B
            </span>
            <span style={{ fontWeight: 600, color: compareFileB ? 'var(--text-primary)' : 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {compareFileB?.name || 'Select second PDF to compare'}
            </span>
          </div>

          <button
            type="button"
            className={`btn btn-sm ${compareFileB ? 'btn-ghost' : 'btn-secondary'}`}
            onClick={() => fileInputBRef.current?.click()}
            style={{ height: '22px', fontSize: '10px', padding: '0 6px', flexShrink: 0 }}
          >
            {compareFileB ? 'Change' : 'Choose File'}
          </button>
        </div>
      </div>

      {/* COMPARE ACTION / PROGRESS */}
      {!compareResult ? (
        <>
          {isProcessing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '6px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <span>{progressMessage || 'Rendering and analyzing pages...'}</span>
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

          <div className="organise-action-footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRunCompare}
              disabled={isProcessing || !compareFileA || !compareFileB}
              style={{ width: '100%', gap: '6px' }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  <span>Comparing Documents...</span>
                </>
              ) : (
                <>
                  <GitCompare size={14} />
                  <span>Compare Documents</span>
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        /* COMPARISON RESULTS DASHBOARD & PAGE VIEWER */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Summary Banner */}
          <div 
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-secondary)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Comparison Overview
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleReset}
                style={{ height: '22px', fontSize: '10px', padding: '0 6px' }}
              >
                New Compare
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '10.5px', color: 'var(--text-secondary)' }}>
              <div>
                <strong>{compareResult.summary.overallSimilarity}%</strong> similarity
              </div>
              <div>
                <strong>{compareResult.summary.identicalPages}</strong> unchanged
              </div>
              <div>
                <strong>{compareResult.summary.visuallyDifferentPages}</strong> visual diffs
              </div>
              <div>
                <strong>{compareResult.summary.textDifferentPages}</strong> text diffs
              </div>
              <div>
                <strong>{compareResult.totalPagesA}</strong> pages in A
              </div>
              <div>
                <strong>{compareResult.totalPagesB}</strong> pages in B
              </div>
            </div>
          </div>

          {/* Page Navigator */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '6px 8px',
              background: 'var(--surface-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <button
              type="button"
              className="stepper-btn"
              onClick={() => setSelectedComparePage((p) => Math.max(1, p - 1))}
              disabled={selectedComparePage <= 1}
              style={{ width: '24px', height: '24px' }}
            >
              <ChevronLeft size={14} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
              <span>Page {selectedComparePage} of {compareResult.maxPages}</span>
              {currentPageData && (
                <span
                  style={{
                    fontSize: '9.5px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    background: currentPageData.status === 'identical' 
                      ? 'rgba(52, 199, 89, 0.15)' 
                      : currentPageData.status === 'added'
                      ? 'rgba(0, 122, 255, 0.15)'
                      : currentPageData.status === 'removed'
                      ? 'rgba(142, 142, 147, 0.15)'
                      : 'rgba(255, 45, 85, 0.15)',
                    color: currentPageData.status === 'identical' 
                      ? '#34C759' 
                      : currentPageData.status === 'added'
                      ? '#007AFF'
                      : currentPageData.status === 'removed'
                      ? '#8E8E93'
                      : '#FF2D55'
                  }}
                >
                  {currentPageData.status === 'identical' && 'Identical'}
                  {currentPageData.status === 'visually_different' && `${currentPageData.similarity}% Match`}
                  {currentPageData.status === 'text_different' && 'Text Diff'}
                  {currentPageData.status === 'added' && 'Added in B'}
                  {currentPageData.status === 'removed' && 'Removed in B'}
                </span>
              )}
            </div>

            <button
              type="button"
              className="stepper-btn"
              onClick={() => setSelectedComparePage((p) => Math.min(compareResult.maxPages, p + 1))}
              disabled={selectedComparePage >= compareResult.maxPages}
              style={{ width: '24px', height: '24px' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-control-btn ${compareViewMode === 'sideBySide' ? 'active' : ''}`}
              onClick={() => setCompareViewMode('sideBySide')}
            >
              <span>Side-by-Side</span>
            </button>
            <button
              type="button"
              className={`segmented-control-btn ${compareViewMode === 'diff' ? 'active' : ''}`}
              onClick={() => setCompareViewMode('diff')}
            >
              <span>Diff Highlight</span>
            </button>
            <button
              type="button"
              className={`segmented-control-btn ${compareViewMode === 'text' ? 'active' : ''}`}
              onClick={() => setCompareViewMode('text')}
            >
              <span>Text Stream</span>
            </button>
          </div>

          {/* Main Visual Display Window */}
          <div
            style={{
              width: '100%',
              minHeight: '220px',
              maxHeight: '280px',
              overflowY: 'auto',
              padding: '8px',
              background: 'var(--surface-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {currentPageData ? (
              compareViewMode === 'sideBySide' ? (
                /* Side-by-Side Previews */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', height: '100%' }}>
                  {/* Doc A */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '9.5px', fontWeight: 600, color: 'var(--text-tertiary)' }}>PDF A (Baseline)</span>
                    <div style={{ width: '100%', height: '190px', background: '#FFFFFF', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
                      {currentPageData.previewA ? (
                        <img src={currentPageData.previewA} alt="Page A" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '10px', color: '#999' }}>Page absent</span>
                      )}
                    </div>
                  </div>

                  {/* Doc B */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '9.5px', fontWeight: 600, color: 'var(--text-tertiary)' }}>PDF B (Comparison)</span>
                    <div style={{ width: '100%', height: '190px', background: '#FFFFFF', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
                      {currentPageData.previewB ? (
                        <img src={currentPageData.previewB} alt="Page B" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '10px', color: '#999' }}>Page absent</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : compareViewMode === 'diff' ? (
                /* Difference Mask Highlight */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '100%' }}>
                  <span style={{ fontSize: '9.5px', fontWeight: 600, color: '#FF2D55' }}>
                    Visual Differences Highlight (Magenta pixels = changes)
                  </span>
                  <div style={{ width: '100%', height: '210px', background: '#1c1c1e', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
                    {currentPageData.diffOverlayUrl ? (
                      <img src={currentPageData.diffOverlayUrl} alt="Diff Overlay" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '10.5px', color: '#aaa' }}>No visual difference mask available</span>
                    )}
                  </div>
                </div>
              ) : (
                /* Text Comparison */
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10.5px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div style={{ padding: '6px', background: 'var(--surface)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      <strong style={{ display: 'block', marginBottom: '2px', color: 'var(--text-primary)' }}>Text from PDF A:</strong>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: '9.5px', maxHeight: '150px', overflowY: 'auto', color: 'var(--text-secondary)' }}>
                        {currentPageData.textA || '(No selectable text on page A)'}
                      </pre>
                    </div>

                    <div style={{ padding: '6px', background: 'var(--surface)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      <strong style={{ display: 'block', marginBottom: '2px', color: 'var(--text-primary)' }}>Text from PDF B:</strong>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: '9.5px', maxHeight: '150px', overflowY: 'auto', color: 'var(--text-secondary)' }}>
                        {currentPageData.textB || '(No selectable text on page B)'}
                      </pre>
                    </div>
                  </div>
                </div>
              )
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

