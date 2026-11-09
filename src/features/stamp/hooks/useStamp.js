import { useState, useCallback } from 'react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import {
  applyWatermarkToPDF,
  applyPageNumbersToPDF,
  applyHeaderFooterToPDF,
  applyDateStampToPDF
} from '../services/index.js';

export function useStamp() {
  const {
    docFile,
    numPages,
    currentPage,
    loadPDFBytes,
    setActiveToolId
  } = useDocument();

  const [isProcessing, setIsProcessing] = useState(false);
  const [operationProgress, setOperationProgress] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const showSuccess = useCallback((msg) => {
    setSuccessMessage(msg);
    setError(null);
    setTimeout(() => setSuccessMessage(null), 5000);
  }, []);

  /**
   * 1. WATERMARK
   */
  const handleApplyWatermark = useCallback(async (options) => {
    if (!docFile?.bytes) {
      setError('No active PDF loaded.');
      return;
    }

    setIsProcessing(true);
    setOperationProgress('Applying watermark to document...');
    setError(null);

    try {
      const result = await applyWatermarkToPDF(docFile.bytes, {
        ...options,
        currentPageIndex: currentPage - 1
      });

      await loadPDFBytes(result.bytes, docFile.name, result.bytes.byteLength, true);
      showSuccess(`Watermark applied to ${result.modifiedPages.length} page(s).`);
      setActiveToolId(null);
      return result;
    } catch (err) {
      console.error('Watermark error:', err);
      setError(err.message || 'Failed to apply watermark.');
      throw err;
    } finally {
      setIsProcessing(false);
      setOperationProgress('');
    }
  }, [docFile, currentPage, loadPDFBytes, setActiveToolId, showSuccess]);

  /**
   * 2. PAGE NUMBERS
   */
  const handleApplyPageNumbers = useCallback(async (options) => {
    if (!docFile?.bytes) {
      setError('No active PDF loaded.');
      return;
    }

    setIsProcessing(true);
    setOperationProgress('Adding page numbers...');
    setError(null);

    try {
      const result = await applyPageNumbersToPDF(docFile.bytes, {
        ...options,
        currentPageIndex: currentPage - 1
      });

      await loadPDFBytes(result.bytes, docFile.name, result.bytes.byteLength, true);
      showSuccess(`Page numbers added to ${result.modifiedPages.length} page(s).`);
      setActiveToolId(null);
      return result;
    } catch (err) {
      console.error('Page numbers error:', err);
      setError(err.message || 'Failed to add page numbers.');
      throw err;
    } finally {
      setIsProcessing(false);
      setOperationProgress('');
    }
  }, [docFile, currentPage, loadPDFBytes, setActiveToolId, showSuccess]);

  /**
   * 3. HEADER & FOOTER
   */
  const handleApplyHeaderFooter = useCallback(async (options) => {
    if (!docFile?.bytes) {
      setError('No active PDF loaded.');
      return;
    }

    setIsProcessing(true);
    setOperationProgress('Applying header and footer...');
    setError(null);

    try {
      const result = await applyHeaderFooterToPDF(docFile.bytes, {
        ...options,
        filename: docFile.name,
        currentPageIndex: currentPage - 1
      });

      await loadPDFBytes(result.bytes, docFile.name, result.bytes.byteLength, true);
      showSuccess(`Header and footer applied to ${result.modifiedPages.length} page(s).`);
      setActiveToolId(null);
      return result;
    } catch (err) {
      console.error('Header & Footer error:', err);
      setError(err.message || 'Failed to apply header and footer.');
      throw err;
    } finally {
      setIsProcessing(false);
      setOperationProgress('');
    }
  }, [docFile, currentPage, loadPDFBytes, setActiveToolId, showSuccess]);

  /**
   * 4. DATE STAMP
   */
  const handleApplyDateStamp = useCallback(async (options) => {
    if (!docFile?.bytes) {
      setError('No active PDF loaded.');
      return;
    }

    setIsProcessing(true);
    setOperationProgress('Stamping date and time...');
    setError(null);

    try {
      const result = await applyDateStampToPDF(docFile.bytes, {
        ...options,
        currentPageIndex: currentPage - 1
      });

      await loadPDFBytes(result.bytes, docFile.name, result.bytes.byteLength, true);
      showSuccess(`Date stamp applied to ${result.modifiedPages.length} page(s).`);
      setActiveToolId(null);
      return result;
    } catch (err) {
      console.error('Date Stamp error:', err);
      setError(err.message || 'Failed to apply date stamp.');
      throw err;
    } finally {
      setIsProcessing(false);
      setOperationProgress('');
    }
  }, [docFile, currentPage, loadPDFBytes, setActiveToolId, showSuccess]);

  return {
    isProcessing,
    operationProgress,
    error,
    setError,
    successMessage,
    handleApplyWatermark,
    handleApplyPageNumbers,
    handleApplyHeaderFooter,
    handleApplyDateStamp
  };
}

