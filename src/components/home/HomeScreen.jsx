import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowUp, 
  Sparkles, 
  ShieldCheck, 
  FileText,
  ArrowRight,
  Layers,
  Edit3,
  Stamp,
  RefreshCw,
  CheckCircle2,
  Inbox
} from 'lucide-react';
import { useDocument } from '../../app/store/DocumentContext';
import { generateSamplePDF } from '../../utils/samplePdf';
import { getRecentFiles } from '../../core/storage/documentStorage';
import { formatBytes, formatDate } from '../../utils/formatters';
import { CATEGORIES } from '../layout/Sidebar';
import { TOOL_ICON_MAP } from './ToolIcons';

// Category icon map for the segmented control
const CATEGORY_HEADER_ICONS = {
  organise: Layers,
  edit: Edit3,
  stamp: Stamp,
  convert: RefreshCw,
  finish: CheckCircle2
};

export default function HomeScreen() {
  const { loadFromFile, loadPDFBytes, isLoading } = useDocument();
  const [isDragOver, setIsDragOver] = useState(false);
  const [recentFiles, setRecentFiles] = useState([]);
  const [selectedDiscoveryCat, setSelectedDiscoveryCat] = useState('organise');
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

  const activeCatData = CATEGORIES.find((c) => c.id === selectedDiscoveryCat) || CATEGORIES[0];

  return (
    <div className="home-showcase-wrapper">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        style={{ display: 'none' }}
      />

      {/* Ambient Drifting Mesh Background (visionOS / macOS Glass Canvas) */}
      <div className="ambient-mesh-canvas" aria-hidden="true" />

      <div className="home-showcase-container">
        {/* Hero Section */}
        <section className="home-welcome-section animate-fade-in">
          <h1 className="home-headline">Your documents. Your workspace.</h1>
          <p className="home-subhead">
            Everything you need to work with PDFs. Beautifully simple. Entirely on your device.
          </p>
        </section>

        {/* Hero Floating Frosted Glass Drop Zone */}
        <div
          className={`home-upload-card ${isDragOver ? 'dragover' : ''} animate-fade-in-delayed`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          aria-label="Upload PDF by dropping or browsing"
        >
          <div className="upload-icon-circle">
            <ArrowUp size={24} strokeWidth={2.2} className="floating-arrow-icon" />
          </div>

          <h2 className="upload-card-title">Drop your PDF here, or click to browse</h2>
          <p className="upload-card-subtitle">
            Client-side parsing & rendering · Instant local processing
          </p>

          <div className="upload-action-row" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="btn btn-primary btn-lg upload-primary-cta"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <ArrowUp size={16} strokeWidth={2.2} />
              <span>Select PDF File</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-lg upload-secondary-cta"
              onClick={() => handleLoadSample(3)}
              disabled={isLoading}
            >
              <Sparkles size={16} />
              <span>Try Sample</span>
            </button>
          </div>
        </div>

        {/* Privacy Assurance Pill */}
        <div className="home-privacy-statement animate-fade-in-delayed">
          <ShieldCheck size={14} className="privacy-shield-icon" />
          <span>Your documents stay on this device. Nothing is uploaded.</span>
        </div>

        {/* Feature Discovery Showcase with Segmented Control */}
        <section className="home-feature-showcase" aria-label="Feature Showcase">
          <div className="showcase-header-row">
            <span className="section-caption">Explore 29 Tools Across 5 Categories</span>
          </div>
          
          {/* iOS-Style Glass Segmented Control */}
          <div className="category-discovery-tabs-track" role="tablist">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedDiscoveryCat === cat.id;
              const HeaderIcon = CATEGORY_HEADER_ICONS[cat.id] || Layers;
              return (
                <button
                  type="button"
                  key={cat.id}
                  role="tab"
                  className={`category-discovery-tab ${isSelected ? 'active' : ''} category-${cat.id}`}
                  onClick={() => setSelectedDiscoveryCat(cat.id)}
                  aria-selected={isSelected}
                  tabIndex={0}
                >
                  <HeaderIcon size={14} className="tab-cat-icon" />
                  <span className="tab-cat-name">{cat.name}</span>
                  <span className="tab-cat-count">{cat.tools.length}</span>
                </button>
              );
            })}
          </div>

          {/* Category Tools Preview Showcase Glass Panel */}
          <div className={`discovery-preview-box category-${activeCatData.id}-scope`}>
            <div className="discovery-preview-header">
              <div className="discovery-header-left">
                <span className="discovery-header-title">{activeCatData.name}</span>
                <span className="discovery-header-desc">{activeCatData.description}</span>
              </div>
              <span className="discovery-header-badge">{activeCatData.tools.length} Tools</span>
            </div>

            <div className="discovery-tools-grid">
              {activeCatData.tools.map((t, idx) => {
                const IconComponent = TOOL_ICON_MAP[t.id] || FileText;
                return (
                  <div key={t.id} className="discovery-tool-card" title={`${t.name}: ${t.desc}`}>
                    <div className="tool-tile-icon-box">
                      <IconComponent size={24} className="tool-custom-svg" />
                    </div>
                    <div className="tool-card-content">
                      <div className="tool-card-title-row">
                        <span className="tool-card-name">{t.name}</span>
                        <span className="tool-card-num">{String(idx + 1).padStart(2, '0')}</span>
                      </div>
                      <p className="tool-card-desc">{t.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Recent Documents Section */}
        <section className="home-recent-section" aria-label="Recent Documents">
          <div className="showcase-header-row">
            <span className="section-caption">Recent Documents (Saved Locally)</span>
          </div>

          <div className="recent-glass-container">
            {recentFiles.length > 0 ? (
              <div className="recent-rows-list">
                {recentFiles.map((file) => (
                  <div
                    key={file.id}
                    className="recent-file-row"
                    onClick={() => fileInputRef.current?.click()}
                    title={`Open ${file.name}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    <div className="recent-row-left">
                      <div className="recent-icon-tile">
                        <FileText size={16} className="recent-file-icon" />
                      </div>
                      <div className="recent-name-block">
                        <span className="recent-row-name">{file.name}</span>
                        <span className="recent-row-meta">
                          {file.pageCount ? `${file.pageCount} ${file.pageCount === 1 ? 'page' : 'pages'} · ` : ''}
                          {formatBytes(file.size)} · {formatDate(file.timestamp)}
                        </span>
                      </div>
                    </div>
                    <div className="recent-row-right">
                      <span className="recent-open-pill">
                        <span>Open</span>
                        <ArrowRight size={12} className="recent-row-arrow" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="recent-empty-state">
                <div className="empty-state-tile">
                  <Inbox size={22} strokeWidth={1.6} />
                </div>
                <span className="empty-state-title">No recent documents</span>
                <span className="empty-state-subtitle">Documents you open are saved safely in your browser's private local storage.</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
