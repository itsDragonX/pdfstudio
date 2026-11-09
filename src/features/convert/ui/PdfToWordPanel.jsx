import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  FileCheck, 
  AlertCircle, 
  AlertTriangle, 
  RefreshCw, 
  Layers,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  FileCode2,
  Check
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useConvertContext } from '../context/ConvertContext.jsx';
import { useConvert } from '../hooks/useConvert.js';

export default function PdfToWordPanel() {
  const { docFile, currentPage, numPages } = useDocument();
  const {
    pdfToWordOptions,
    setPdfToWordOptions,
    pdfToWordAnalysis,
    setPdfToWordAnalysis,
    pdfToWordResult,
    setPdfToWordResult
  } = useConvertContext();

  const {
    isProcessing,
    progressMessage,
    progressPercent,
    error,
    setError,
    successMessage,
    handleAnalyzePdfForWord,
    handleConvertPdfToWord,
    handleDownloadDocx
  } = useConvert();

  const [rangeInput, setRangeInput] = useState(pdfToWordOptions.rangeString || '');
  const [showLimitations, setShowLimitations] = useState(false);
  const [activeTab, setActiveTab] = useState('structure'); // 'structure' | 'raw'

  // Handle page target change
  const handlePageTargetChange = (target) => {
    setPdfToWordOptions((prev) => ({ ...prev, pageTarget: target }));
  };

  // Run analysis
  const handleRunAnalysis = async () => {
    if (!docFile?.bytes) {
      setError('Please open a PDF document first.');
      return;
    }

    try {
      await handleAnalyzePdfForWord({
        ...pdfToWordOptions,
        rangeString: rangeInput
      });
    } catch {
      // Error handled in hook
    }
  };

  // Run conversion
  const handleRunConversion = async () => {
    if (!docFile?.bytes) {
      setError('Please open a PDF document first.');
      return;
    }

    try {
      await handleConvertPdfToWord({
        ...pdfToWordOptions,
        rangeString: rangeInput,
        baseFilename: docFile.name || 'document',
        precomputedAnalysis: pdfToWordAnalysis
      });
    } catch {
      // Error handled in hook
    }
  };

  // Reset to re-analyze
  const handleReset = () => {
    setPdfToWordAnalysis(null);
    setPdfToWordResult(null);
  };

  if (!docFile) {
    return (
      <div className="organise-tool-panel">
        <div className="banner-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={15} />
          <span>Please open a PDF document first to convert it into a Microsoft Word (.docx) document.</span>
        </div>
      </div>
    );
  }

  const cleanDocName = (docFile.name || 'document').replace(/\.pdf$/i, '');
  const expectedDocxName = `${cleanDocName}_converted.docx`;

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

      {/* TARGET PAGES */}
      <div className="property-group">
        <label className="property-label">Target Pages</label>
        <div className="segmented-control">
          <button
            type="button"
            className={`segmented-control-btn ${pdfToWordOptions.pageTarget === 'all' ? 'active' : ''}`}
            onClick={() => handlePageTargetChange('all')}
          >
            <span>All ({numPages})</span>
          </button>
          <button
            type="button"
            className={`segmented-control-btn ${pdfToWordOptions.pageTarget === 'current' ? 'active' : ''}`}
            onClick={() => handlePageTargetChange('current')}
          >
            <span>Current ({currentPage})</span>
          </button>
          <button
            type="button"
            className={`segmented-control-btn ${pdfToWordOptions.pageTarget === 'range' ? 'active' : ''}`}
            onClick={() => handlePageTargetChange('range')}
          >
            <span>Custom</span>
          </button>
        </div>

        {/* Custom Range Input */}
        {pdfToWordOptions.pageTarget === 'range' && (
          <div style={{ marginTop: '8px' }}>
            <input
              type="text"
              placeholder="e.g. 1-3, 5, 7-9"
              value={rangeInput}
              onChange={(e) => setRangeInput(e.target.value)}
              className="text-input"
              style={{ width: '100%' }}
            />
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
              Enter page numbers or ranges separated by commas
            </span>
          </div>
        )}
      </div>

      {/* FORMATTING LIMITATIONS ACCORDION */}
      <div
        style={{
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--surface-secondary)',
          overflow: 'hidden'
        }}
      >
        <button
          type="button"
          onClick={() => setShowLimitations(!showLimitations)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '11px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Info size={13} color="var(--accent)" />
            <span>Conversion Capabilities & Limits</span>
          </span>
          {showLimitations ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {showLimitations && (
          <div
            style={{
              padding: '8px 10px 10px',
              fontSize: '10.5px',
              lineHeight: '1.45',
              color: 'var(--text-tertiary)',
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li><strong>Editable Text:</strong> Generates native Word paragraphs, headings (H1/H2/H3), and bullet lists.</li>
              <li><strong>Layout Heuristics:</strong> Multi-column layouts are reconstructed in reading order. Complex floating sidebars may be re-sequenced.</li>
              <li><strong>Tables:</strong> Tabular data is retained in structured lines; full Word tables may require manual adjustment.</li>
              <li><strong>Typography:</strong> Exact embedded font glyphs are converted to clean standard Word typography (Calibri / Arial).</li>
              <li><strong>Scanned Documents:</strong> PDFs without a text layer require OCR before editable conversion.</li>
            </ul>
          </div>
        )}
      </div>

      {/* ANALYSIS SUMMARY & PREVIEW (IF ANALYZED) */}
      {pdfToWordAnalysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Summary Box */}
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
                Document Structure Analysis
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleReset}
                style={{ height: '22px', fontSize: '10px', padding: '0 6px' }}
              >
                Reset
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '10.5px', color: 'var(--text-secondary)' }}>
              <div>
                <strong>{pdfToWordAnalysis.summary.totalWords.toLocaleString()}</strong> words
              </div>
              <div>
                <strong>{pdfToWordAnalysis.summary.headingsCount}</strong> headings
              </div>
              <div>
                <strong>{pdfToWordAnalysis.summary.paragraphsCount}</strong> paragraphs
              </div>
              <div>
                <strong>{pdfToWordAnalysis.summary.listsCount}</strong> lists
              </div>
              <div>
                <strong>{pdfToWordAnalysis.selectedPagesCount}</strong> pages
              </div>
              <div>
                <strong>{pdfToWordAnalysis.medianBodySize} pt</strong> body font
              </div>
            </div>
          </div>

          {/* Scanned Pages Warning */}
          {pdfToWordAnalysis.summary.scannedPages.length > 0 && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'flex-start',
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
              <AlertTriangle size={15} color="#FF9F0A" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: '#FF9F0A', marginBottom: '2px' }}>
                  Scanned Image Page Detected
                </strong>
                Page(s) {pdfToWordAnalysis.summary.scannedPages.join(', ')} appear to contain scanned images rather than selectable text. OCR is not currently available in PDF Studio.
              </div>
            </div>
          )}

          {/* Preview Tabs */}
          <div className="property-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="property-label" style={{ margin: 0 }}>Structure Preview</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'structure' ? 'btn-secondary' : 'btn-ghost'}`}
                  onClick={() => setActiveTab('structure')}
                  style={{ height: '22px', fontSize: '10px', padding: '0 8px' }}
                >
                  Structure
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'raw' ? 'btn-secondary' : 'btn-ghost'}`}
                  onClick={() => setActiveTab('raw')}
                  style={{ height: '22px', fontSize: '10px', padding: '0 8px' }}
                >
                  Raw Stream
                </button>
              </div>
            </div>

            {/* Preview Body */}
            <div
              style={{
                width: '100%',
                maxHeight: '190px',
                overflowY: 'auto',
                padding: '10px 12px',
                background: 'var(--surface-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                fontSize: '11px',
                lineHeight: '1.5',
                color: 'var(--text-primary)'
              }}
            >
              {activeTab === 'structure' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pdfToWordAnalysis.pages.map((p) => (
                    <div key={p.pageNumber} style={{ borderBottom: '1px dashed var(--border-subtle)', paddingBottom: '6px' }}>
                      <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        Page {p.pageNumber}
                      </div>

                      {p.isScanned ? (
                        <div style={{ fontStyle: 'italic', color: 'var(--text-tertiary)', fontSize: '10.5px' }}>
                          (Scanned image page — minimal text detected)
                        </div>
                      ) : (
                        p.elements.map((el, idx) => {
                          if (el.type === 'heading-1') {
                            return (
                              <div key={idx} style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0' }}>
                                [H1] {el.text}
                              </div>
                            );
                          }
                          if (el.type === 'heading-2') {
                            return (
                              <div key={idx} style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', margin: '3px 0' }}>
                                [H2] {el.text}
                              </div>
                            );
                          }
                          if (el.type === 'heading-3') {
                            return (
                              <div key={idx} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', margin: '2px 0' }}>
                                [H3] {el.text}
                              </div>
                            );
                          }
                          if (el.type === 'list-item') {
                            return (
                              <div key={idx} style={{ paddingLeft: '12px', color: 'var(--text-secondary)', fontSize: '10.5px' }}>
                                • {el.runs.map(r => r.text).join('')}
                              </div>
                            );
                          }
                          return (
                            <div key={idx} style={{ color: 'var(--text-secondary)', fontSize: '10.5px', margin: '2px 0' }}>
                              {el.runs.map(r => r.text).join('')}
                            </div>
                          );
                        })
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '10px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {pdfToWordAnalysis.pages.map(p => `--- PAGE ${p.pageNumber} ---\n${p.text}`).join('\n\n')}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONVERSION COMPLETED RESULT */}
      {pdfToWordResult && (
        <div 
          style={{
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(52, 199, 89, 0.1)',
            border: '1px solid rgba(52, 199, 89, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} color="var(--success, #34C759)" />
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Converted to Word (.docx)
              </span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
              {(pdfToWordResult.bytes.byteLength / 1024).toFixed(1)} KB
            </span>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
            File: <strong>{pdfToWordResult.filename}</strong>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleDownloadDocx(pdfToWordResult.bytes, pdfToWordResult.filename)}
            style={{ width: '100%', gap: '6px', height: '32px' }}
          >
            <Download size={14} />
            <span>Download DOCX Document</span>
          </button>
        </div>
      )}

      {/* PROGRESS BAR */}
      {isProcessing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '4px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <span>{progressMessage || 'Processing...'}</span>
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

      {/* ACTION FOOTER */}
      <div className="organise-action-footer">
        {!pdfToWordAnalysis ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleRunAnalysis}
            disabled={isProcessing}
            style={{ width: '100%' }}
          >
            <Sparkles size={14} />
            <span>Analyze Document Structure</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleRunConversion}
            disabled={isProcessing}
            style={{ width: '100%' }}
          >
            {isProcessing ? (
              <>
                <RefreshCw size={14} className="spin" />
                <span>Converting to Word...</span>
              </>
            ) : (
              <>
                <FileText size={14} />
                <span>Convert & Download DOCX</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

