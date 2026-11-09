import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';

const EditContext = createContext(null);

export function EditProvider({ children }) {
  const { activeCategory, activeToolId, currentPage, numPages, pdfJsDoc } = useDocument();

  // Active target page index (0-based)
  const [targetPageIndex, setTargetPageIndex] = useState(0);

  // Sync with document current page
  useEffect(() => {
    if (currentPage >= 1 && currentPage <= numPages) {
      setTargetPageIndex(currentPage - 1);
    }
  }, [currentPage, numPages]);

  // In-progress edit payload
  const [editPayload, setEditPayload] = useState({});

  // Reset or initialize default payload when active tool changes
  useEffect(() => {
    if (activeCategory !== 'edit' || !activeToolId) {
      setEditPayload({});
      return;
    }

    switch (activeToolId) {
      case 'add-text':
        setEditPayload({
          text: 'Sample Text',
          fontName: 'Helvetica',
          fontSize: 18,
          color: '#007AFF',
          alignment: 'left',
          opacity: 1.0,
          x: 100,
          y: 650
        });
        break;
      case 'add-image':
        setEditPayload({
          imageBytes: null,
          format: 'png',
          previewUrl: '',
          width: 200,
          height: 150,
          x: 100,
          y: 500,
          rotation: 0,
          opacity: 1.0
        });
        break;
      case 'highlight':
        setEditPayload({
          color: '#FFE033',
          opacity: 0.35,
          highlights: []
        });
        break;
      case 'draw':
        setEditPayload({
          color: '#000000',
          width: 3,
          opacity: 1.0,
          strokes: []
        });
        break;
      case 'shapes':
        setEditPayload({
          shapeType: 'rectangle',
          strokeColor: '#007AFF',
          strokeWidth: 2,
          fillColor: null,
          opacity: 1.0,
          x: 100,
          y: 500,
          width: 150,
          height: 90
        });
        break;
      case 'whiteout':
        setEditPayload({
          color: '#FFFFFF',
          regions: []
        });
        break;
      case 'redact':
        setEditPayload({
          regions: []
        });
        break;
      case 'sign':
        setEditPayload({
          method: 'draw', // 'draw' | 'type' | 'upload'
          signatureData: null,
          previewUrl: '',
          x: 150,
          y: 200,
          width: 180,
          height: 60
        });
        break;
      case 'forms':
        setEditPayload({
          fieldValues: {},
          flatten: false
        });
        break;
      default:
        setEditPayload({});
    }
  }, [activeCategory, activeToolId]);

  const updateEditPayload = (updater) => {
    setEditPayload((prev) => (typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }));
  };

  const value = {
    targetPageIndex,
    setTargetPageIndex,
    editPayload,
    updateEditPayload,
    isEditActive: activeCategory === 'edit' && Boolean(activeToolId),
    activeEditTool: activeCategory === 'edit' ? activeToolId : null
  };

  return <EditContext.Provider value={value}>{children}</EditContext.Provider>;
}

export function useEditContext() {
  const context = useContext(EditContext);
  if (!context) {
    throw new Error('useEditContext must be used within an EditProvider');
  }
  return context;
}

