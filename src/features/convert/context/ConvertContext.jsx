import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';

const ConvertContext = createContext(null);

export function ConvertProvider({ children }) {
  const { activeCategory, activeToolId, currentPage, numPages, docFile } = useDocument();

  const isConvertActive = activeCategory === 'convert' && !!activeToolId;

  // Images to PDF Queue
  const [imagesQueue, setImagesQueue] = useState([]);
  const [imagesLayoutOptions, setImagesLayoutOptions] = useState({
    pageSize: 'A4',
    orientation: 'auto',
    layout: 'fit',
    margin: 18,
    backgroundColor: '#FFFFFF'
  });

  // PDF to Images Options & Generated Results
  const [pdfToImagesOptions, setPdfToImagesOptions] = useState({
    format: 'png',
    dpi: 150,
    jpegQuality: 0.85,
    pageTarget: 'all',
    rangeString: ''
  });
  const [pdfToImagesResult, setPdfToImagesResult] = useState(null);

  // PDF to Text Options & Extracted Result
  const [pdfToTextOptions, setPdfToTextOptions] = useState({
    pageTarget: 'all',
    rangeString: '',
    includePageHeaders: true
  });
  const [pdfToTextResult, setPdfToTextResult] = useState(null);

  // PDF to Word (.docx) Options, Analysis & Generated Result
  const [pdfToWordOptions, setPdfToWordOptions] = useState({
    pageTarget: 'all',
    rangeString: ''
  });
  const [pdfToWordAnalysis, setPdfToWordAnalysis] = useState(null);
  const [pdfToWordResult, setPdfToWordResult] = useState(null);

  // Reset results when tool changes
  useEffect(() => {
    if (activeCategory !== 'convert') {
      setPdfToImagesResult(null);
      setPdfToTextResult(null);
      setPdfToWordAnalysis(null);
      setPdfToWordResult(null);
    }
  }, [activeCategory, activeToolId]);

  const value = {
    isConvertActive,
    activeConvertTool: isConvertActive ? activeToolId : null,
    imagesQueue,
    setImagesQueue,
    imagesLayoutOptions,
    setImagesLayoutOptions,
    pdfToImagesOptions,
    setPdfToImagesOptions,
    pdfToImagesResult,
    setPdfToImagesResult,
    pdfToTextOptions,
    setPdfToTextOptions,
    pdfToTextResult,
    setPdfToTextResult,
    pdfToWordOptions,
    setPdfToWordOptions,
    pdfToWordAnalysis,
    setPdfToWordAnalysis,
    pdfToWordResult,
    setPdfToWordResult
  };

  return (
    <ConvertContext.Provider value={value}>
      {children}
    </ConvertContext.Provider>
  );
}

export function useConvertContext() {
  const context = useContext(ConvertContext);
  if (!context) {
    throw new Error('useConvertContext must be used within a ConvertProvider');
  }
  return context;
}

