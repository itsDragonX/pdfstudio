import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { pdfjsLib, PDFJS_OFFLINE_CONFIG } from '../../core/pdfjs-init';
import { saveActiveSession, loadActiveSession, addRecentFile } from '../../core/storage/documentStorage';

const DocumentContext = createContext(null);

export function DocumentProvider({ children }) {
  // Document State
  const [docFile, setDocFile] = useState(null); // { name, size, bytes }
  const [pdfJsDoc, setPdfJsDoc] = useState(null); // PDF.js document instance
  const [numPages, setNumPages] = useState(0);
  const [pageDimensions, setPageDimensions] = useState([]);

  // View State (Default fitMode to 'width' for larger preview proportions)
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  const [fitMode, setFitMode] = useState('width'); // 'width' | 'page' | 'custom'
  const [activeCategory, setActiveCategory] = useState('organise');
  const [activeToolId, setActiveToolId] = useState(null);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Status & Error
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  /**
   * Load PDF from a Uint8Array or ArrayBuffer
   */
  const loadPDFBytes = useCallback(async (bytes, name = 'document.pdf', size = 0, persist = true) => {
    setIsLoading(true);
    setStatusMessage('Loading PDF document...');
    setErrorMessage(null);

    try {
      // Validate Uint8Array
      const rawUint8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
      if (rawUint8.byteLength === 0) {
        throw new Error('PDF byte array is empty (0 bytes).');
      }
      // Clone an independent copy for React state & storage
      const uint8 = rawUint8.slice(0);
      const docSize = size || uint8.byteLength;

      // Pass a separate cloned slice to PDF.js because PDF.js transfers & detaches the buffer!
      const pdfJsData = uint8.slice(0);
      const loadingTask = pdfjsLib.getDocument({
        data: pdfJsData,
        ...PDFJS_OFFLINE_CONFIG
      });

      const loadedPdf = await loadingTask.promise;
      const pagesCount = loadedPdf.numPages;

      // Extract basic dimensions for all pages
      const dims = [];
      for (let i = 1; i <= pagesCount; i++) {
        const page = await loadedPdf.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        dims.push({
          pageNumber: i,
          width: viewport.width,
          height: viewport.height,
          aspectRatio: viewport.width / viewport.height
        });
      }

      setPdfJsDoc(loadedPdf);
      setNumPages(pagesCount);
      setPageDimensions(dims);
      setDocFile({ name, size: docSize, bytes: uint8.slice(0) });
      setCurrentPage(1);

      if (persist) {
        await saveActiveSession({
          name,
          size: docSize,
          bytes: uint8.slice(0),
          pageCount: pagesCount
        });
        await addRecentFile({
          name,
          size: docSize,
          pageCount: pagesCount
        });
      }

      setStatusMessage('');
    } catch (err) {
      console.error('Error loading PDF:', err);
      const isEncrypted = err?.message?.includes('password') || err?.name === 'PasswordException';
      setErrorMessage(
        isEncrypted
          ? 'Password-protected or encrypted PDFs cannot be opened.'
          : `Failed to open PDF: ${err?.message || 'Unknown error'}`
      );
      setPdfJsDoc(null);
      setNumPages(0);
      setDocFile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle file upload from HTML Input or Drag & Drop
   */
  const loadFromFile = useCallback(async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please select a valid PDF file.');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      await loadPDFBytes(new Uint8Array(buffer), file.name, file.size, true);
    } catch (err) {
      setErrorMessage(`Could not read file: ${err.message}`);
    }
  }, [loadPDFBytes]);

  /**
   * Close current document
   */
  const closeDocument = useCallback(() => {
    setDocFile(null);
    setPdfJsDoc(null);
    setNumPages(0);
    setPageDimensions([]);
    setCurrentPage(1);
    setErrorMessage(null);
  }, []);

  /**
   * Zoom controls
   */
  const zoomIn = useCallback(() => {
    setFitMode('custom');
    setZoom((prev) => Math.min(3.0, +(prev + 0.15).toFixed(2)));
  }, []);

  const zoomOut = useCallback(() => {
    setFitMode('custom');
    setZoom((prev) => Math.max(0.25, +(prev - 0.15).toFixed(2)));
  }, []);

  const resetZoom = useCallback(() => {
    setFitMode('custom');
    setZoom(1.0);
  }, []);

  const setFit = useCallback((mode) => {
    setFitMode(mode);
  }, []);

  // Try recovering previous session on initial mount
  useEffect(() => {
    let isMounted = true;
    async function restore() {
      const session = await loadActiveSession();
      if (isMounted && session?.bytes && session?.name) {
        await loadPDFBytes(session.bytes, session.name, session.size, false);
      }
    }
    restore();
    return () => { isMounted = false; };
  }, [loadPDFBytes]);

  const value = {
    docFile,
    pdfJsDoc,
    numPages,
    pageDimensions,
    currentPage,
    setCurrentPage,
    zoom,
    setZoom,
    fitMode,
    setFit,
    zoomIn,
    zoomOut,
    resetZoom,
    activeCategory,
    setActiveCategory,
    activeToolId,
    setActiveToolId,
    showThumbnails,
    setShowThumbnails,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isLoading,
    statusMessage,
    errorMessage,
    setErrorMessage,
    loadPDFBytes,
    loadFromFile,
    closeDocument
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
}
