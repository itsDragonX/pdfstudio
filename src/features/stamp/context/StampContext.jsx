import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { formatDate } from '../services/dateStampService.js';

const StampContext = createContext(null);

export function StampProvider({ children }) {
  const { activeCategory, activeToolId, currentPage, numPages, docFile } = useDocument();

  const isStampActive = activeCategory === 'stamp' && !!activeToolId;

  // Active target page index (0-based)
  const [targetPageIndex, setTargetPageIndex] = useState(0);

  // Sync with document current page
  useEffect(() => {
    if (currentPage >= 1 && currentPage <= numPages) {
      setTargetPageIndex(currentPage - 1);
    }
  }, [currentPage, numPages]);

  // Live in-progress stamp payload
  const [stampPayload, setStampPayload] = useState({});

  // Initialize payload defaults whenever active stamp tool changes
  useEffect(() => {
    if (activeCategory !== 'stamp' || !activeToolId) {
      setStampPayload({});
      return;
    }

    switch (activeToolId) {
      case 'watermark':
        setStampPayload({
          type: 'text',
          text: 'CONFIDENTIAL',
          fontName: 'HelveticaBold',
          fontSize: 48,
          color: '#FF3B30',
          opacity: 0.25,
          rotation: -45,
          position: 'center',
          isTiled: false,
          imageBytes: null,
          imageFormat: 'png',
          imagePreviewUrl: '',
          imageScale: 1.0,
          pageTarget: 'all',
          rangeString: '',
          excludeFirstPage: false
        });
        break;

      case 'page-numbers':
        setStampPayload({
          format: 'page_n_of_total',
          customPrefix: 'DOC-',
          customSuffix: '',
          startNumber: 1,
          position: 'bottom-center',
          fontName: 'Helvetica',
          fontSize: 10,
          color: '#333333',
          margin: 36,
          opacity: 1.0,
          pageTarget: 'all',
          rangeString: '',
          excludeFirstPage: false
        });
        break;

      case 'header-footer': {
        const now = new Date();
        const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
        setStampPayload({
          headerLeft: 'PDF Studio',
          headerCenter: '',
          headerRight: 'CONFIDENTIAL',
          footerLeft: '{filename}',
          footerCenter: 'Page {page} of {totalPages}',
          footerRight: '{date}',
          fontName: 'Helvetica',
          fontSize: 10,
          color: '#333333',
          margin: 36,
          opacity: 1.0,
          pageTarget: 'all',
          rangeString: '',
          excludeFirstPage: false,
          dateString: dateStr
        });
        break;
      }

      case 'date-stamp': {
        const capturedTime = Date.now();
        setStampPayload({
          dateFormat: 'DD/MM/YYYY',
          includeTime: false,
          timeFormat: '24h',
          prefix: '',
          timestamp: capturedTime,
          position: 'bottom-right',
          fontName: 'Helvetica',
          fontSize: 11,
          color: '#000000',
          opacity: 1.0,
          margin: 36,
          pageTarget: 'all',
          rangeString: '',
          excludeFirstPage: false
        });
        break;
      }

      default:
        setStampPayload({});
        break;
    }
  }, [activeCategory, activeToolId, docFile]);

  const updateStampPayload = (updates) => {
    setStampPayload((prev) => ({ ...prev, ...updates }));
  };

  const value = {
    isStampActive,
    activeStampTool: isStampActive ? activeToolId : null,
    targetPageIndex,
    setTargetPageIndex,
    stampPayload,
    setStampPayload,
    updateStampPayload
  };

  return (
    <StampContext.Provider value={value}>
      {children}
    </StampContext.Provider>
  );
}

export function useStampContext() {
  const context = useContext(StampContext);
  if (!context) {
    throw new Error('useStampContext must be used within a StampProvider');
  }
  return context;
}

