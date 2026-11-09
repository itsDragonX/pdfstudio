import { useState, useCallback } from 'react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useFinishContext } from '../context/FinishContext.jsx';
import {
  compressPdf,
  updateDocumentMetadata,
  removeDocumentMetadata,
  comparePdfDocuments
} from '../services/index.js';
import { triggerDownload } from '../../organise/services/pageOperations.js';

export function useFinish() {
  const { docFile, loadPDFBytes, setActiveToolId } = useDocument();
  const {
    compressionMethod,
    setCompressResult,
    editMetadataForm,
    setEditDetailsResult,
    setRemoveDetailsResult,
    compareFileA,
    compareFileB,
    setCompareResult
  } = useFinishContext();

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const showSuccess = useCallback((msg) => {
    setSuccessMessage(msg);
    setError(null);
    setTimeout(() => setSuccessMessage(null), 5000);
  }, []);

  /**
   * 1. COMPRESS PDF
   */
  const handleCompress = useCallback(async (customOptions = {}) => {
    if (!docFile?.bytes) {
      setError('No active PDF loaded.');
      return;
    }

    setIsProcessing(true);
    setProgressMessage('Compressing document...');
    setError(null);

    try {
      const isRaster = compressionMethod.startsWith('raster');
      let quality = 0.65;
      let dpi = 140;

      if (compressionMethod === 'raster-high') {
        quality = 0.80;
        dpi = 150;
      } else if (compressionMethod === 'raster-compact') {
        quality = 0.45;
        dpi = 110;
      }

      const result = await compressPdf(docFile.bytes, {
        method: isRaster ? 'rasterized' : 'structure',
        quality,
        dpi,
        onProgress: (cur, total, msg) => {
          setProgressMessage(msg);
          setProgressPercent(Math.round((cur / total) * 100));
        },
        ...customOptions
      });

      setCompressResult(result);

      if (result.savedBytes > 0) {
        showSuccess(`Compressed by ${result.percentReduction}% (saved ${(result.savedBytes / 1024).toFixed(1)} KB).`);
      } else {
        showSuccess(`Optimization complete (${result.isLarger ? 'No size reduction possible; original was already optimal' : 'File size unchanged'}).`);
      }

      return result;
    } catch (err) {
      console.error('Compression error:', err);
      setError(err.message || 'Failed to compress PDF.');
      throw err;
    } finally {
      setIsProcessing(false);
      setProgressMessage('');
      setProgressPercent(0);
    }
  }, [docFile, compressionMethod, setCompressResult, showSuccess]);

  /**
   * 2. EDIT DETAILS
   */
  const handleUpdateDetails = useCallback(async (formOverrides = {}) => {
    if (!docFile?.bytes) {
      setError('No active PDF loaded.');
      return;
    }

    setIsProcessing(true);
    setProgressMessage('Updating document metadata...');
    setError(null);

    try {
      const formToUse = { ...editMetadataForm, ...formOverrides };
      const result = await updateDocumentMetadata(docFile.bytes, formToUse, docFile.name);

      setEditDetailsResult(result);
      showSuccess(`Metadata updated successfully! Saved as ${result.filename}.`);

      // Automatically trigger download
      triggerDownload(result.bytes, result.filename, 'application/pdf');

      return result;
    } catch (err) {
      console.error('Update metadata error:', err);
      setError(err.message || 'Failed to update metadata.');
      throw err;
    } finally {
      setIsProcessing(false);
      setProgressMessage('');
    }
  }, [docFile, editMetadataForm, setEditDetailsResult, showSuccess]);

  /**
   * 3. REMOVE DETAILS
   */
  const handleRemoveDetails = useCallback(async () => {
    if (!docFile?.bytes) {
      setError('No active PDF loaded.');
      return;
    }

    setIsProcessing(true);
    setProgressMessage('Removing all document metadata...');
    setError(null);

    try {
      const result = await removeDocumentMetadata(docFile.bytes, docFile.name);

      setRemoveDetailsResult(result);
      showSuccess(`Metadata stripped! Cleaned file saved as ${result.filename}.`);

      // Automatically trigger download
      triggerDownload(result.bytes, result.filename, 'application/pdf');

      return result;
    } catch (err) {
      console.error('Remove metadata error:', err);
      setError(err.message || 'Failed to remove metadata.');
      throw err;
    } finally {
      setIsProcessing(false);
      setProgressMessage('');
    }
  }, [docFile, setRemoveDetailsResult, showSuccess]);

  /**
   * 4. COMPARE DOCUMENTS
   */
  const handleCompare = useCallback(async () => {
    if (!compareFileA?.bytes || !compareFileB?.bytes) {
      setError('Please select both PDF A and PDF B to compare.');
      return;
    }

    setIsProcessing(true);
    setProgressMessage('Comparing documents...');
    setError(null);

    try {
      const result = await comparePdfDocuments(compareFileA.bytes, compareFileB.bytes, {
        onProgress: (cur, total, msg) => {
          setProgressMessage(msg);
          setProgressPercent(Math.round((cur / total) * 100));
        }
      });

      setCompareResult(result);
      showSuccess(`Comparison complete! Overall similarity: ${result.summary.overallSimilarity}%.`);
      return result;
    } catch (err) {
      console.error('Comparison error:', err);
      setError(err.message || 'Failed to compare PDF documents.');
      throw err;
    } finally {
      setIsProcessing(false);
      setProgressMessage('');
      setProgressPercent(0);
    }
  }, [compareFileA, compareFileB, setCompareResult, showSuccess]);

  /**
   * Download helper
   */
  const downloadPdf = useCallback((bytes, filename) => {
    if (!bytes) return;
    triggerDownload(bytes, filename, 'application/pdf');
    showSuccess(`Downloaded ${filename}.`);
  }, [showSuccess]);

  return {
    isProcessing,
    progressMessage,
    progressPercent,
    error,
    setError,
    successMessage,
    handleCompress,
    handleUpdateDetails,
    handleRemoveDetails,
    handleCompare,
    downloadPdf
  };
}

