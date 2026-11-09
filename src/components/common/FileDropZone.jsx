import React, { useState, useEffect, useRef } from 'react';
import { 
  FileUp, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Layers, 
  Edit3, 
  Stamp, 
  RefreshCw, 
  CheckCircle2, 
  FileText 
} from 'lucide-react';
import { useDocument } from '../../app/store/DocumentContext';
import { generateSamplePDF } from '../../utils/samplePdf';
import { getRecentFiles } from '../../core/storage/documentStorage';
import { formatBytes, formatDate } from '../../utils/formatters';

export default function FileDropZone() {
  const { loadFromFile, loadPDFBytes, isLoading } = useDocument();
  const [isDragOver, setIsDragOver] = useState(false);
  const [recentFiles, setRecentFiles] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchRecents() {
      const recents = await getRecentFiles();
      setRecentFiles(recents);
    }
    fetchRecents();
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      loadFromFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      loadFromFile(file);
      e.target.value = '';
    }
  };

  const handleLoadSample = async (pageCount = 3) => {
    try {
      const bytes = await generateSamplePDF(pageCount);
      await loadPDFBytes(bytes, 'sample-document.pdf', bytes.byteLength, true);
    } catch (err) {
      console.error('Failed to create sample PDF:', err);
    }
  };

  return (
    <div className="home-screen-container">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        style={{ display: 'none' }}
      />

      {/* Welcome Hero */}
      <div className="welcome-hero">
        <div className="hero-privacy-pill">
          <ShieldCheck size={14} />
          <span>PDFs processed locally · No PDF uploads</span>
        </div>
        <h1 className="hero-title">Professional PDF Suite</h1>
        <p className="hero-subtitle">
          Organise, edit, stamp, convert and finish your PDF documents directly on your device.
          No accounts, no cloud uploads, and zero tracking.
        </p>
      </div>

      {/* Prominent Upload / Drag-and-Drop Card */}
      <div 
        className={`upload-dropzone-card ${isDragOver ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="dropzone-icon-bubble">
          <FileUp size={32} />
        </div>

        <h2 className="dropzone-main-text">Drop your PDF here, or click to browse</h2>
        <p className="dropzone-helper-text">
          Supports any standard PDF document · Fast client-side rendering
        </p>

        <div className="dropzone-button-row" onClick={(e) => e.stopPropagation()}>
          <button 
            className="btn btn-primary btn-lg"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <FileUp size={18} />
            <span>Select PDF File</span>
          </button>

          <button 
            className="btn btn-secondary btn-lg"
            onClick={() => handleLoadSample(3)}
            disabled={isLoading}
          >
            <Sparkles size={18} />
            <span>Load 3-Page Sample</span>
          </button>
        </div>

        <div className="dropzone-privacy-guarantee">
          <ShieldCheck size={16} />
          <span>
            Privacy guaranteed: Uploaded PDFs and document history remain entirely local to your browser in IndexedDB.
          </span>
        </div>
      </div>

      {/* Quick-Access Feature Suites Grid */}
      <section className="feature-suites-section" aria-label="PDF Studio Suites">
        <h3 className="section-label">29 Built-in Tools Across 5 Categories</h3>
        <div className="feature-suites-grid">
          <div className="feature-suite-card">
            <div className="suite-card-top">
              <div className="suite-card-title-group">
                <div className="suite-icon-wrap organise">
                  <Layers size={16} />
                </div>
                <h4 className="suite-title">Organise</h4>
              </div>
              <span className="suite-pill">9 Tools</span>
            </div>
            <p className="suite-tools-summary">
              Merge, Split, Reorder, Rotate, Delete, Duplicate, Extract, Blank Page, Crop
            </p>
          </div>

          <div className="feature-suite-card">
            <div className="suite-card-top">
              <div className="suite-card-title-group">
                <div className="suite-icon-wrap edit">
                  <Edit3 size={16} />
                </div>
                <h4 className="suite-title">Edit</h4>
              </div>
              <span className="suite-pill">9 Tools</span>
            </div>
            <p className="suite-tools-summary">
              Add Text, Add Image, Highlight, Draw, Shapes, Whiteout, Redact, Sign, Fill Forms
            </p>
          </div>

          <div className="feature-suite-card">
            <div className="suite-card-top">
              <div className="suite-card-title-group">
                <div className="suite-icon-wrap stamp">
                  <Stamp size={16} />
                </div>
                <h4 className="suite-title">Stamp</h4>
              </div>
              <span className="suite-pill">4 Tools</span>
            </div>
            <p className="suite-tools-summary">
              Watermark, Page Numbers, Header & Footer, Date Stamp
            </p>
          </div>

          <div className="feature-suite-card">
            <div className="suite-card-top">
              <div className="suite-card-title-group">
                <div className="suite-icon-wrap convert">
                  <RefreshCw size={16} />
                </div>
                <h4 className="suite-title">Convert</h4>
              </div>
              <span className="suite-pill">3 Tools</span>
            </div>
            <p className="suite-tools-summary">
              Images to PDF, PDF to Images, PDF to Text
            </p>
          </div>

          <div className="feature-suite-card">
            <div className="suite-card-top">
              <div className="suite-card-title-group">
                <div className="suite-icon-wrap finish">
                  <CheckCircle2 size={16} />
                </div>
                <h4 className="suite-title">Finish</h4>
              </div>
              <span className="suite-pill">4 Tools</span>
            </div>
            <p className="suite-tools-summary">
              Compress, Edit Details, Remove Details, Compare Two PDFs
            </p>
          </div>
        </div>
      </section>

      {/* Recent Documents Section */}
      {recentFiles.length > 0 && (
        <section className="recent-docs-section" aria-label="Recent Documents">
          <h3 className="section-label">Recent Documents (Stored Locally)</h3>
          <div className="recent-cards-grid">
            {recentFiles.map((file) => (
              <div 
                key={file.id} 
                className="recent-doc-card"
                onClick={() => fileInputRef.current?.click()}
                title={`Open ${file.name}`}
              >
                <div className="recent-file-icon">
                  <FileText size={18} />
                </div>
                <div className="recent-text-group">
                  <span className="recent-file-name">{file.name}</span>
                  <span className="recent-file-details">
                    {file.pageCount ? `${file.pageCount} pages · ` : ''}
                    {formatBytes(file.size)} · {formatDate(file.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
