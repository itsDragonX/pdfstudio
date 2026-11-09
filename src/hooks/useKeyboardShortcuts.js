import { useEffect } from 'react';
import { useDocument } from '../app/store/DocumentContext';

export function useKeyboardShortcuts() {
  const {
    docFile,
    numPages,
    currentPage,
    setCurrentPage,
    zoomIn,
    zoomOut,
    resetZoom,
    showThumbnails,
    setShowThumbnails
  } = useDocument();

  useEffect(() => {
    function handleKeyDown(e) {
      // Don't trigger if user is typing into an input/textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        return;
      }

      // Zoom shortcuts: Ctrl + +, Ctrl + -, Ctrl + 0
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          zoomIn();
          return;
        }
        if (e.key === '-') {
          e.preventDefault();
          zoomOut();
          return;
        }
        if (e.key === '0') {
          e.preventDefault();
          resetZoom();
          return;
        }
      }

      if (!docFile || numPages === 0) return;

      // Page Navigation
      if (e.key === 'PageDown' || (e.key === 'ArrowRight' && !e.ctrlKey)) {
        e.preventDefault();
        setCurrentPage((p) => Math.min(numPages, p + 1));
      } else if (e.key === 'PageUp' || (e.key === 'ArrowLeft' && !e.ctrlKey)) {
        e.preventDefault();
        setCurrentPage((p) => Math.max(1, p - 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentPage(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentPage(numPages);
      } else if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey) {
        setShowThumbnails(!showThumbnails);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    docFile,
    numPages,
    currentPage,
    setCurrentPage,
    zoomIn,
    zoomOut,
    resetZoom,
    showThumbnails,
    setShowThumbnails
  ]);
}

