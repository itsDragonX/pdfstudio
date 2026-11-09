import { useState, useCallback } from 'react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import {
  mergePDFs,
  splitPDF,
  reorderPages,
  rotatePages,
  deletePages,
  duplicatePages,
  extractPages,
  insertBlankPage,
  cropPages,
  triggerDownload
} from '../services/index.js';

export function useOrganise() {
  const {
    docFile,
    numPages,
    currentPage,
    setCurrentPage,
    loadPDFBytes,
    setActiveToolId
  } = useDocument();

  const [isProcessing, setIsProcessing] = useState(false);
  const [operationProgress, setOperationProgress] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  /**
   * Helper to clear banners after delay
   */
  const showSuccess = useCallback((msg) => {
    setSuccessMessage(msg);
    setError(null);
    setTimeout(() => setSuccessMessage(null), 5000);
  }, []);

  /**
   * 1. MERGE: Combines multiple PDFs and sets the result as the active document.
   */
  const handleMerge = useCallback(async (pdfFiles, outputName = 'merged-document.pdf') => {
    setIsProcessing(true);
    setOperationProgress('Merging PDF files...');
    setError(null);
    try {
      const result = await mergePDFs(pdfFiles, outputName);
      await loadPDFBytes(result.bytes, result.filename, result.bytes.byteLength, true);
      showSuccess(`Successfully merged ${pdfFiles.length} documents (${result.pageCount} total pages).`);
      setActiveToolId(null);
      return result;
    } catch (err) {
      console.error('Merge error:', err);
      setError(err.message || 'Failed to merge documents.');
      throw err;
    } finally {
      setIsProcessing(false);
      setOperationProgress('');
    }
  }, [loadPDFBytes, setActiveToolId, showSuccess]);

  /**
   * 2. SPLIT: Generates multiple outputs without modifying the current document.
   */
  const handleSplit = useCallback(async (options) => {
    if (!docFile?.bytes) return;
    setIsProcessing(true);
    setOperationProgress('Splitting document...');
    setError(null);
    try {
      const result = await splitPDF(docFile.bytes, docFile.name, options);
      if (result.isZip) {
        triggerDownload(result.zipBytes, result.zipFilename, 'application/zip');
        showSuccess(`Generated ${result.files.length} split documents in ${result.zipFilename}.`);
      } else if (result.files.length === 1) {
        triggerDownload(result.files[0].bytes, result.files[0].filename, 'application/pdf');
        showSuccess(`Downloaded split document ${result.files[0].filename}.`);
      }
      return result;
    } catch (err) {
      console.error('Split error:', err);
      setError(err.message || 'Failed to split document.');
      throw err;
    } finally {
      setIsProcessing(false);
      setOperationProgress('');
    }
  }, [docFile, showSuccess]);

  /**
   * 3. REORDER: Reorders pages and updates working document.
   */
  const handleReorder = useCallback(async (newPageOrder) => {
    if (!docFile?.bytes) return;
    setIsProcessing(true);
    setOperationProgress('Applying new page order...');
    setError(null);
    try {
      const result = await reorderPages(docFile.bytes, newPageOrder);
      await loadPDFBytes(result.bytes, docFile.name, result.bytes.byteLength, true);
      showSuccess('Page order successfully updated.');
      return result;
    } catch (err) {
      console.error('Reorder error:', err);
      setError(err.message || 'Failed to reorder pages.');
      throw err;
    } finally {
      setIsProcessing(false);
      setOperationProgress('');
    }
  }, [docFile, loadPDFBytes, showSuccess]);

  /**
   * 4. ROTATE: Rotates target pages and updates working document.
   */
  const handleRotate = useCallback(async (targetPages, angleDelta) => {
    if (!docFile?.bytes) return;
    setIsProcessing(true);
    setOperationProgress('Rotating pages...');
    setError(null);
    try {
      const result = await rotatePages(docFile.bytes, targetPages, angleDelta);
      await loadPDFBytes(result.bytes, docFile.name, result.bytes.byteLength, true);
      const scopeLabel = targetPages === 'all' ? 'All pages' : `Page ${Array.isArray(targetPages) ? targetPages.join(', ') : targetPages}`;
      showSuccess(`${scopeLabel} rotated by ${angleDelta > 0 ? `+${angleDelta}°` : `${angleDelta}°`}.`);
      return result;
    } catch (err) {
      console.error('Rotate error:', err);
      setError(err.message || 'Failed to rotate pages.');
      throw err;
    } finally {
      setIsProcessing(false);
      setOperationProgress('');
    }
  }, [docFile, loadPDFBytes, showSuccess]);

  /**
   * 5. DELETE: Removes selected pages and updates working document.
   */
  const handleDelete = useCallback(async (pageNumbersToDelete) => {
    if (!docFile?.bytes) return;
    setIsProcessing(true);
    setOperationProgress('Deleting pages...');
    setError(null);
    try {
      const result = await deletePages(docFile.bytes, pageNumbersToDelete);
      const newPage = Math.min(currentPage, result.pageCount);
      await loadPDFBytes(result.bytes, docFile.name, result.bytes.byteLength, true);
      setCurrentPage(newPage);
      showSuccess(`Deleted ${pageNumbersToDelete.length} ${pageNumbersToDelete.length === 1 ? 'page' : 'pages'}. ${result.pageCount} pages remaining.`);
      return result;
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete pages.');
      throw err;
    } finally {
      setIsProcessing(false);
      setOperationProgress('');
    }
  }, [docFile, currentPage, setCurrentPage, loadPDFBytes, showSuccess]);

  /**
   * 6. DUPLICATE: Clones selected pages adjacent to source.
   */
  const handleDuplicate = useCallback(async (pageNumbersToDuplicate) => {
    if (!docFile?.bytes) return;
    setIsProcessing(true);
    setOperationProgress('Duplicating pages...');
    setError(null);
    try {
      const result = await duplicatePages(docFile.bytes, pageNumbersToDuplicate);
      await loadPDFBytes(result.bytes, docFile.name, result.bytes.byteLength, true);
      showSuccess(`Duplicated ${pageNumbersToDuplicate.length} ${pageNumbersToDuplicate.length === 1 ? 'page' : 'pages'}. Total: ${result.pageCount} pages.`);
      return result;
    } catch (err) {
      console.error('Duplicate error:', err);
      setError(err.message || 'Failed to duplicate pages.');
      throw err;
    } finally {
      setIsProcessing(false);
      setOperationProgress('');
    }
  }, [docFile, loadPDFBytes, showSuccess]);

  /**
   * 7. EXTRACT: Downloads a new PDF with selected pages without altering original.
   */
  const handleExtract = useCallback(async (pageSelection) => {
    if (!docFile?.bytes) return;
    setIsProcessing(true);
    setOperationProgress('Extracting pages...');
    setError(null);
    try {
      const result = await extractPages(docFile.bytes, pageSelection, docFile.name);
      triggerDownload(result.bytes, result.filename, 'application/pdf');
      showSuccess(`Extracted ${result.pageCount} pages into "${result.filename}". Original document unchanged.`);
      return result;
    } catch (err) {
      console.error('Extract error:', err);
      setError(err.message || 'Failed to extract pages.');
      throw err;
    } finally {
      setIsProcessing(false);
      setOperationProgress('');
    }
  }, [docFile, showSuccess]);

  /**
   * 8. INSERT BLANK: Inserts a blank page into the document.
   */
  const handleInsertBlank = useCallback(async (options) => {
    if (!docFile?.bytes) return;
    setIsProcessing(true);
    setOperationProgress('Inserting blank page...');
    setError(null);
    try {
      const result = await insertBlankPage(docFile.bytes, {
        targetPage: currentPage,
        ...options
      });
      await loadPDFBytes(result.bytes, docFile.name, result.bytes.byteLength, true);
      setCurrentPage(result.insertedIndex + 1);
      showSuccess(`Inserted blank page at position ${result.insertedIndex + 1}. Total: ${result.pageCount} pages.`);
      return result;
    } catch (err) {
      console.error('Insert blank error:', err);
      setError(err.message || 'Failed to insert blank page.');
      throw err;
    } finally {
      setIsProcessing(false);
      setOperationProgress('');
    }
  }, [docFile, currentPage, setCurrentPage, loadPDFBytes, showSuccess]);

  /**
   * 9. CROP: Adjusts CropBox and updates working document.
   */
  const handleCrop = useCallback(async (targetPages, cropBox) => {
    if (!docFile?.bytes) return;
    setIsProcessing(true);
    setOperationProgress('Applying crop...');
    setError(null);
    try {
      const result = await cropPages(docFile.bytes, targetPages, cropBox);
      await loadPDFBytes(result.bytes, docFile.name, result.bytes.byteLength, true);
      showSuccess(`Crop applied successfully (${Math.round(result.appliedBox.width)} × ${Math.round(result.appliedBox.height)} pt).`);
      return result;
    } catch (err) {
      console.error('Crop error:', err);
      setError(err.message || 'Failed to crop page.');
      throw err;
    } finally {
      setIsProcessing(false);
      setOperationProgress('');
    }
  }, [docFile, loadPDFBytes, showSuccess]);

  return {
    isProcessing,
    operationProgress,
    error,
    setError,
    successMessage,
    handleMerge,
    handleSplit,
    handleReorder,
    handleRotate,
    handleDelete,
    handleDuplicate,
    handleExtract,
    handleInsertBlank,
    handleCrop
  };
}

