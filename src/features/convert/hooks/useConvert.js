import { useState, useCallback } from 'react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useConvertContext } from '../context/ConvertContext.jsx';
import {
  convertImagesToPdf,
  convertPdfToImages,
  extractPdfToText,
  analyzePdfForWord,
  convertPdfToWord
} from '../services/index.js';
import { triggerDownload } from '../../organise/services/pageOperations.js';

export function useConvert() {
  const {
    docFile,
    currentPage,
    loadPDFBytes,
    setActiveToolId
  } = useDocument();

  const {
    imagesQueue,
    setImagesQueue,
    setPdfToImagesResult,
    setPdfToTextResult,
    setPdfToWordAnalysis,
    setPdfToWordResult
  } = useConvertContext();

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
   * 1. IMAGES TO PDF
   */
  const handleConvertImagesToPdf = useCallback(async (options, openInApp = false) => {
    if (!imagesQueue || imagesQueue.length === 0) {
      setError('Please add at least one image to convert.');
      return;
    }

    setIsProcessing(true);
    setProgressMessage('Generating PDF from images...');
    setError(null);

    try {
      const result = await convertImagesToPdf(imagesQueue, options);
      const filename = options.outputFilename || 'converted-images.pdf';

      if (openInApp) {
        await loadPDFBytes(result.bytes, filename, result.bytes.byteLength, true);
        showSuccess(`Converted ${result.pageCount} images and opened in PDF Studio.`);
        setActiveToolId(null);
      } else {
        triggerDownload(result.bytes, filename, 'application/pdf');
        showSuccess(`Successfully converted and downloaded ${filename} (${result.pageCount} pages).`);
      }

      return result;
    } catch (err) {
      console.error('Images to PDF error:', err);
      setError(err.message || 'Failed to convert images to PDF.');
      throw err;
    } finally {
      setIsProcessing(false);
      setProgressMessage('');
    }
  }, [imagesQueue, loadPDFBytes, setActiveToolId, showSuccess]);

  /**
   * 2. PDF TO IMAGES
   */
  const handleConvertPdfToImages = useCallback(async (options, customPdfBytes) => {
    const bytesToUse = customPdfBytes || docFile?.bytes;
    if (!bytesToUse) {
      setError('No active PDF loaded to convert.');
      return;
    }

    setIsProcessing(true);
    setProgressMessage('Rendering PDF pages to images...');
    setProgressPercent(0);
    setError(null);
    setPdfToImagesResult(null);

    try {
      const baseFilename = options.baseFilename || docFile?.name || 'document';
      const result = await convertPdfToImages(bytesToUse, {
        ...options,
        baseFilename,
        currentPageIndex: currentPage - 1,
        onProgress: (cur, total, msg) => {
          setProgressMessage(msg);
          setProgressPercent(Math.round((cur / total) * 100));
        }
      });

      setPdfToImagesResult(result);
      showSuccess(`Successfully exported ${result.images.length} image(s).`);
      return result;
    } catch (err) {
      console.error('PDF to Images error:', err);
      setError(err.message || 'Failed to convert PDF to images.');
      throw err;
    } finally {
      setIsProcessing(false);
      setProgressMessage('');
      setProgressPercent(0);
    }
  }, [docFile, currentPage, setPdfToImagesResult, showSuccess]);

  /**
   * 3. PDF TO TEXT
   */
  const handleExtractPdfToText = useCallback(async (options, customPdfBytes) => {
    const bytesToUse = customPdfBytes || docFile?.bytes;
    if (!bytesToUse) {
      setError('No active PDF loaded.');
      return;
    }

    setIsProcessing(true);
    setProgressMessage('Extracting text content...');
    setError(null);
    setPdfToTextResult(null);

    try {
      const result = await extractPdfToText(bytesToUse, {
        ...options,
        currentPageIndex: currentPage - 1,
        onProgress: (cur, total, msg) => {
          setProgressMessage(msg);
        }
      });

      setPdfToTextResult(result);
      if (result.isScannedOrEmpty) {
        showSuccess('Extraction complete. Note: Minimal selectable text was detected.');
      } else {
        showSuccess(`Extracted ${result.totalChars} characters (${result.totalWords} words).`);
      }
      return result;
    } catch (err) {
      console.error('PDF to Text error:', err);
      setError(err.message || 'Failed to extract text from PDF.');
      throw err;
    } finally {
      setIsProcessing(false);
      setProgressMessage('');
    }
  }, [docFile, currentPage, setPdfToTextResult, showSuccess]);

  /**
   * Download text as UTF-8 TXT file
   */
  const handleDownloadText = useCallback((fullText, baseName = 'document') => {
    if (!fullText) return;
    const cleanName = baseName.replace(/\.pdf$/i, '');
    const filename = `${cleanName}_extracted_text.txt`;
    triggerDownload(fullText, filename, 'text/plain;charset=utf-8');
    showSuccess(`Downloaded ${filename}.`);
  }, [showSuccess]);

  /**
   * Download ZIP bundle of images
   */
  const handleDownloadZip = useCallback((zipBytes, zipFilename = 'document_images.zip') => {
    if (!zipBytes) return;
    triggerDownload(zipBytes, zipFilename, 'application/zip');
    showSuccess(`Downloaded ${zipFilename}.`);
  }, [showSuccess]);

  /**
   * 4. ANALYZE PDF FOR WORD (.DOCX)
   */
  const handleAnalyzePdfForWord = useCallback(async (options, customPdfBytes) => {
    const bytesToUse = customPdfBytes || docFile?.bytes;
    if (!bytesToUse) {
      setError('No active PDF loaded.');
      return;
    }

    setIsProcessing(true);
    setProgressMessage('Analyzing document structure...');
    setError(null);

    try {
      const analysis = await analyzePdfForWord(bytesToUse, {
        ...options,
        currentPageIndex: currentPage - 1,
        onProgress: (cur, total, msg) => {
          setProgressMessage(msg);
          setProgressPercent(Math.round((cur / total) * 100));
        }
      });

      setPdfToWordAnalysis(analysis);
      if (analysis.summary.scannedPages.length > 0) {
        showSuccess(`Analyzed ${analysis.pages.length} pages. Note: Scanned content detected on page(s) ${analysis.summary.scannedPages.join(', ')}.`);
      } else {
        showSuccess(`Analyzed ${analysis.pages.length} pages: ${analysis.summary.paragraphsCount} paragraphs, ${analysis.summary.headingsCount} headings.`);
      }
      return analysis;
    } catch (err) {
      console.error('PDF to Word analysis error:', err);
      setError(err.message || 'Failed to analyze PDF document.');
      throw err;
    } finally {
      setIsProcessing(false);
      setProgressMessage('');
      setProgressPercent(0);
    }
  }, [docFile, currentPage, setPdfToWordAnalysis, showSuccess]);

  /**
   * 5. CONVERT PDF TO WORD (.DOCX)
   */
  const handleConvertPdfToWord = useCallback(async (options, customPdfBytes) => {
    const bytesToUse = customPdfBytes || docFile?.bytes;
    if (!bytesToUse) {
      setError('No active PDF loaded.');
      return;
    }

    setIsProcessing(true);
    setProgressMessage('Converting PDF to Microsoft Word (.docx)...');
    setError(null);

    try {
      const baseFilename = options.baseFilename || docFile?.name || 'document';
      const result = await convertPdfToWord(bytesToUse, {
        ...options,
        baseFilename,
        currentPageIndex: currentPage - 1,
        onProgress: (cur, total, msg) => {
          setProgressMessage(msg);
          setProgressPercent(Math.round((cur / total) * 100));
        }
      });

      setPdfToWordResult(result);
      
      // Auto-trigger download
      triggerDownload(
        result.bytes,
        result.filename,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );

      showSuccess(`Successfully converted and downloaded ${result.filename}!`);
      return result;
    } catch (err) {
      console.error('PDF to Word conversion error:', err);
      setError(err.message || 'Failed to convert PDF to Word document.');
      throw err;
    } finally {
      setIsProcessing(false);
      setProgressMessage('');
      setProgressPercent(0);
    }
  }, [docFile, currentPage, setPdfToWordResult, showSuccess]);

  /**
   * Download DOCX file again
   */
  const handleDownloadDocx = useCallback((bytes, filename = 'document_converted.docx') => {
    if (!bytes) return;
    triggerDownload(
      bytes,
      filename,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    showSuccess(`Downloaded ${filename}.`);
  }, [showSuccess]);

  return {
    isProcessing,
    progressMessage,
    progressPercent,
    error,
    setError,
    successMessage,
    handleConvertImagesToPdf,
    handleConvertPdfToImages,
    handleExtractPdfToText,
    handleDownloadText,
    handleDownloadZip,
    handleAnalyzePdfForWord,
    handleConvertPdfToWord,
    handleDownloadDocx
  };
}

