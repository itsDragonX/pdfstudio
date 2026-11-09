import { useState, useCallback } from 'react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useEditContext } from '../context/EditContext.jsx';
import {
  addTextToPDF,
  addImageToPDF,
  addHighlightsToPDF,
  addStrokesToPDF,
  addShapesToPDF,
  addWhiteoutToPDF,
  applyPermanentRedaction,
  addSignatureToPDF,
  fillAcroForm
} from '../services/index.js';

export function useEdit() {
  const { docFile, pdfJsDoc, loadPDFBytes, setActiveToolId } = useDocument();
  const { targetPageIndex, editPayload, updateEditPayload } = useEditContext();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const showSuccess = useCallback((msg) => {
    setSuccessMessage(msg);
    setError(null);
    setTimeout(() => setSuccessMessage(null), 4000);
  }, []);

  /**
   * Helper that commits modified bytes to the document pipeline safely
   */
  const commitChanges = useCallback(
    async (operationPromise, successText) => {
      if (!docFile?.bytes) {
        throw new Error('No active document available.');
      }
      setIsProcessing(true);
      setError(null);
      try {
        const result = await operationPromise;
        await loadPDFBytes(result.bytes, docFile.name, result.bytes.byteLength, true);
        showSuccess(successText);
        setActiveToolId(null);
        return result;
      } catch (err) {
        console.error('Edit operation error:', err);
        setError(err.message || 'Operation failed.');
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [docFile, loadPDFBytes, setActiveToolId, showSuccess]
  );

  // 1. Add Text
  const handleApplyText = useCallback(async () => {
    return commitChanges(
      addTextToPDF(docFile.bytes, {
        pageIndex: targetPageIndex,
        text: editPayload.text,
        x: editPayload.x,
        y: editPayload.y,
        fontName: editPayload.fontName,
        fontSize: editPayload.fontSize,
        color: editPayload.color,
        alignment: editPayload.alignment,
        opacity: editPayload.opacity
      }),
      `Text successfully added to page ${targetPageIndex + 1}.`
    );
  }, [commitChanges, docFile, editPayload, targetPageIndex]);

  // 2. Add Image
  const handleApplyImage = useCallback(async () => {
    if (!editPayload.imageBytes) {
      setError('Please select an image file first.');
      return;
    }
    return commitChanges(
      addImageToPDF(docFile.bytes, {
        pageIndex: targetPageIndex,
        imageBytes: editPayload.imageBytes,
        format: editPayload.format || 'png',
        x: editPayload.x,
        y: editPayload.y,
        width: editPayload.width,
        height: editPayload.height,
        rotation: editPayload.rotation || 0,
        opacity: editPayload.opacity || 1.0
      }),
      `Image placed on page ${targetPageIndex + 1}.`
    );
  }, [commitChanges, docFile, editPayload, targetPageIndex]);

  // 3. Highlight
  const handleApplyHighlights = useCallback(async () => {
    if (!editPayload.highlights || editPayload.highlights.length === 0) {
      setError('Please drag on the page to create at least one highlight.');
      return;
    }
    return commitChanges(
      addHighlightsToPDF(docFile.bytes, {
        highlights: editPayload.highlights.map((h) => ({
          ...h,
          pageIndex: h.pageIndex ?? targetPageIndex
        }))
      }),
      `Highlights applied to page ${targetPageIndex + 1}.`
    );
  }, [commitChanges, docFile, editPayload, targetPageIndex]);

  // 4. Draw
  const handleApplyDraw = useCallback(async () => {
    if (!editPayload.strokes || editPayload.strokes.length === 0) {
      setError('Please draw at least one stroke on the page.');
      return;
    }
    return commitChanges(
      addStrokesToPDF(docFile.bytes, {
        strokes: editPayload.strokes.map((s) => ({
          ...s,
          pageIndex: s.pageIndex ?? targetPageIndex
        }))
      }),
      `Drawing strokes applied to page ${targetPageIndex + 1}.`
    );
  }, [commitChanges, docFile, editPayload, targetPageIndex]);

  // 5. Shapes
  const handleApplyShape = useCallback(async () => {
    return commitChanges(
      addShapesToPDF(docFile.bytes, {
        shapes: [
          {
            pageIndex: targetPageIndex,
            shapeType: editPayload.shapeType || 'rectangle',
            x: editPayload.x,
            y: editPayload.y,
            width: editPayload.width,
            height: editPayload.height,
            strokeColor: editPayload.strokeColor,
            strokeWidth: editPayload.strokeWidth,
            fillColor: editPayload.fillColor,
            opacity: editPayload.opacity
          }
        ]
      }),
      `${editPayload.shapeType || 'Shape'} placed on page ${targetPageIndex + 1}.`
    );
  }, [commitChanges, docFile, editPayload, targetPageIndex]);

  // 6. Whiteout
  const handleApplyWhiteout = useCallback(async () => {
    if (!editPayload.regions || editPayload.regions.length === 0) {
      setError('Please select at least one region to whiteout.');
      return;
    }
    return commitChanges(
      addWhiteoutToPDF(docFile.bytes, {
        regions: editPayload.regions.map((r) => ({
          ...r,
          pageIndex: r.pageIndex ?? targetPageIndex
        }))
      }),
      `Whiteout mask applied to page ${targetPageIndex + 1}.`
    );
  }, [commitChanges, docFile, editPayload, targetPageIndex]);

  // 7. Redact
  const handleApplyRedact = useCallback(async () => {
    if (!editPayload.regions || editPayload.regions.length === 0) {
      setError('Please select at least one redaction rectangle.');
      return;
    }
    return commitChanges(
      applyPermanentRedaction(
        docFile.bytes,
        {
          redactionTasks: [
            {
              pageIndex: targetPageIndex,
              regions: editPayload.regions
            }
          ]
        },
        pdfJsDoc
      ),
      `Permanent redaction burned into page ${targetPageIndex + 1}. Original text removed.`
    );
  }, [commitChanges, docFile, editPayload, pdfJsDoc, targetPageIndex]);

  // 8. Sign
  const handleApplySignature = useCallback(async () => {
    if (!editPayload.signatureData) {
      setError('Please draw, type, or upload a signature.');
      return;
    }
    return commitChanges(
      addSignatureToPDF(docFile.bytes, {
        pageIndex: targetPageIndex,
        signatureData: editPayload.signatureData,
        x: editPayload.x,
        y: editPayload.y,
        width: editPayload.width,
        height: editPayload.height
      }),
      `Visual signature placed on page ${targetPageIndex + 1}.`
    );
  }, [commitChanges, docFile, editPayload, targetPageIndex]);

  // 9. Fill Forms
  const handleApplyForm = useCallback(
    async (fieldValues, flatten = false) => {
      return commitChanges(
        fillAcroForm(docFile.bytes, {
          fieldValues,
          flatten
        }),
        `Form fields successfully saved${flatten ? ' and flattened' : ''}.`
      );
    },
    [commitChanges, docFile]
  );

  return {
    isProcessing,
    error,
    setError,
    successMessage,
    handleApplyText,
    handleApplyImage,
    handleApplyHighlights,
    handleApplyDraw,
    handleApplyShape,
    handleApplyWhiteout,
    handleApplyRedact,
    handleApplySignature,
    handleApplyForm
  };
}

