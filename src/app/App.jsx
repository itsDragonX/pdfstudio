import React from 'react';
import { useDocument } from './store/DocumentContext';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Toolbar from '../components/layout/Toolbar';
import StatusBar from '../components/layout/StatusBar';
import ThumbnailGrid from '../components/viewer/ThumbnailGrid';
import PDFCanvasViewer from '../components/viewer/PDFCanvasViewer';
import RightInspector from '../components/layout/RightInspector';
import HomeScreen from '../components/home/HomeScreen';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

function AppContent() {
  const { docFile, setCurrentPage } = useDocument();

  // Attach keyboard shortcuts
  useKeyboardShortcuts();

  const handleSelectPage = (pageNum) => {
    setCurrentPage(pageNum);
    const targetEl = document.getElementById(`page-wrapper-${pageNum}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="app-shell">
      {/* Ambient Drifting Mesh Canvas Background across the entire app */}
      <div className="ambient-mesh-canvas" aria-hidden="true" />

      <Header />

      {docFile ? (
        /* Full PDF Editor Floating Glass Workspace */
        <div className="editor-workspace-shell">
          {/* 1. Left Panel: Unified Category & Tool Navigation (~260px) */}
          <Sidebar />

          {/* 2. Slim Thumbnails Strip (~92px) */}
          <ThumbnailGrid onPageSelect={handleSelectPage} />

          {/* 3. Canvas Area: The Star (~28px radius stage with centered floating glass pill toolbar) */}
          <div className="editor-center-stage">
            <Toolbar />
            <PDFCanvasViewer />
          </div>

          {/* 4. Right Inspector: Active Tool Workspace (~280-310px) */}
          <RightInspector />
        </div>
      ) : (
        /* Clean Showcase Home Screen */
        <HomeScreen />
      )}

      {docFile && <StatusBar />}
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
