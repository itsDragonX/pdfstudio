import React, { useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  X, 
  Menu
} from 'lucide-react';
import { useDocument } from '../../app/store/DocumentContext';
import { formatBytes } from '../../utils/formatters';
import ThemeSelector from '../common/ThemeSelector';

export default function Header() {
  const { 
    docFile, 
    numPages, 
    loadFromFile, 
    closeDocument, 
    isLoading,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen
  } = useDocument();

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      loadFromFile(file);
      e.target.value = '';
    }
  };

  const handleExport = () => {
    if (!docFile || !docFile.bytes) return;
    const blob = new Blob([docFile.bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = docFile.name || 'document.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="app-header">
      <div className="header-left">
        {docFile && (
          <button 
            type="button"
            className="mobile-menu-btn"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            aria-label="Toggle navigation menu"
          >
            <Menu size={16} />
          </button>
        )}

        <div className="header-brand" onClick={closeDocument} title="PDF Studio Home">
          <div className="brand-symbol">
            <FileText size={15} />
          </div>
          <div className="brand-text-block">
            <span className="brand-name">PDF Studio</span>
            <span className="brand-tag">Desktop Edition</span>
          </div>
        </div>
      </div>

      <div className="header-center">
        {docFile && (
          <div className="document-meta-capsule" title={`${docFile.name} (${numPages} pages, ${formatBytes(docFile.size)})`}>
            <FileText size={12} className="doc-capsule-icon" />
            <span className="doc-capsule-name">{docFile.name}</span>
            <span className="doc-capsule-sep">•</span>
            <span className="doc-capsule-stat">{numPages} {numPages === 1 ? 'page' : 'pages'}</span>
            <span className="doc-capsule-sep">•</span>
            <span className="doc-capsule-stat">{formatBytes(docFile.size)}</span>
          </div>
        )}
      </div>

      <div className="header-right">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          style={{ display: 'none' }}
        />

        <ThemeSelector />

        <button 
          type="button"
          className="btn btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          title="Open a local PDF file"
        >
          <Upload size={13} />
          <span>Open PDF</span>
        </button>

        {docFile && (
          <button 
            type="button"
            className="btn btn-primary"
            onClick={handleExport}
            title="Export and download PDF"
            aria-label="Export PDF"
          >
            <Download size={13} />
            <span>Export</span>
          </button>
        )}

        {docFile && (
          <button 
            type="button"
            className="btn btn-ghost btn-icon btn-close-round"
            onClick={closeDocument}
            title="Close document"
            aria-label="Close document"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </header>
  );
}
