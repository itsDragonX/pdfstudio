import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { readDocumentMetadata } from '../services/metadataService.js';

const FinishContext = createContext(null);

export function FinishProvider({ children }) {
  const { activeCategory, activeToolId, docFile } = useDocument();

  const isFinishActive = activeCategory === 'finish' && !!activeToolId;

  // 1. Compress State
  const [compressionMethod, setCompressionMethod] = useState('structure');
  const [compressResult, setCompressResult] = useState(null);
  const [showRasterWarning, setShowRasterWarning] = useState(false);

  // 2. Edit Details State
  const [editMetadataForm, setEditMetadataForm] = useState({
    title: '',
    author: '',
    subject: '',
    keywords: '',
    creator: '',
    producer: '',
    creationDate: '',
    modificationDate: ''
  });
  const [originalMetadata, setOriginalMetadata] = useState(null);
  const [editDetailsResult, setEditDetailsResult] = useState(null);

  // 3. Remove Details State
  const [removeDetectedMetadata, setRemoveDetectedMetadata] = useState(null);
  const [removeDetailsResult, setRemoveDetailsResult] = useState(null);

  // 4. Compare PDFs State
  const [compareFileA, setCompareFileA] = useState(null);
  const [compareFileB, setCompareFileB] = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [selectedComparePage, setSelectedComparePage] = useState(1);
  const [compareViewMode, setCompareViewMode] = useState('sideBySide'); // 'sideBySide' | 'diff' | 'text'

  // Initialize File A from open document if not set
  useEffect(() => {
    if (docFile?.bytes && !compareFileA) {
      setCompareFileA({
        name: docFile.name,
        size: docFile.size,
        bytes: docFile.bytes
      });
    }
  }, [docFile, compareFileA]);

  // Read metadata whenever docFile changes or tool activates
  useEffect(() => {
    if (!docFile?.bytes) return;

    if (activeToolId === 'edit-details' || activeToolId === 'remove-details') {
      readDocumentMetadata(docFile.bytes)
        .then((meta) => {
          setOriginalMetadata(meta);
          setRemoveDetectedMetadata(meta);
          setEditMetadataForm({
            title: meta.title,
            author: meta.author,
            subject: meta.subject,
            keywords: meta.keywordsString,
            creator: meta.creator,
            producer: meta.producer,
            creationDate: meta.creationDateFormatted,
            modificationDate: meta.modificationDateFormatted || new Date().toISOString().split('T')[0]
          });
        })
        .catch((err) => {
          console.warn('Failed to pre-read document metadata:', err);
        });
    }
  }, [docFile, activeToolId]);

  // Reset tool-specific results on tool switch
  useEffect(() => {
    setCompressResult(null);
    setEditDetailsResult(null);
    setRemoveDetailsResult(null);
  }, [activeToolId]);

  const value = {
    isFinishActive,
    activeFinishTool: isFinishActive ? activeToolId : null,
    // Compress
    compressionMethod,
    setCompressionMethod,
    compressResult,
    setCompressResult,
    showRasterWarning,
    setShowRasterWarning,
    // Edit Details
    editMetadataForm,
    setEditMetadataForm,
    originalMetadata,
    setOriginalMetadata,
    editDetailsResult,
    setEditDetailsResult,
    // Remove Details
    removeDetectedMetadata,
    setRemoveDetectedMetadata,
    removeDetailsResult,
    setRemoveDetailsResult,
    // Compare
    compareFileA,
    setCompareFileA,
    compareFileB,
    setCompareFileB,
    compareResult,
    setCompareResult,
    selectedComparePage,
    setSelectedComparePage,
    compareViewMode,
    setCompareViewMode
  };

  return (
    <FinishContext.Provider value={value}>
      {children}
    </FinishContext.Provider>
  );
}

export function useFinishContext() {
  const context = useContext(FinishContext);
  if (!context) {
    throw new Error('useFinishContext must be used within a FinishProvider');
  }
  return context;
}

