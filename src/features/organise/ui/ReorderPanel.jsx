import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowUpDown, 
  RotateCcw, 
  ChevronUp, 
  ChevronDown, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  GripVertical
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useOrganise } from '../hooks/useOrganise.js';

/**
 * Mini Canvas thumbnail component for each reorder card
 */
function MiniPageThumbnail({ pdfDoc, pageNumber }) {
  const canvasRef = useRef(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let renderTask = null;

    async function drawThumbnail() {
      if (!pdfDoc || !canvasRef.current) return;
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelled) return;

        const unscaledViewport = page.getViewport({ scale: 1 });
        const targetWidth = 44; // Compact preview width for sidebar
        const scale = targetWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.scale(dpr, dpr);

        renderTask = page.render({
          canvasContext: context,
          viewport: viewport
        });

        await renderTask.promise;
        if (!cancelled) {
          setRendered(true);
        }
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`Thumbnail render error for page ${pageNumber}:`, err);
        }
      }
    }

    drawThumbnail();

    return () => {
      cancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, pageNumber]);

  return (
    <div className="mini-thumb-canvas-box">
      <canvas ref={canvasRef} />
      {!rendered && <div className="mini-thumb-placeholder" />}
    </div>
  );
}

export default function ReorderPanel() {
  const { numPages, pdfJsDoc, currentPage, setCurrentPage, setActiveToolId } = useDocument();
  const { handleReorder, isProcessing, error, successMessage } = useOrganise();

  // State: array of original 1-based page numbers in current working order
  const [pageOrder, setPageOrder] = useState(() =>
    Array.from({ length: numPages }, (_, i) => i + 1)
  );

  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  useEffect(() => {
    setPageOrder(Array.from({ length: numPages }, (_, i) => i + 1));
  }, [numPages]);

  const isModified = pageOrder.some((pageNum, idx) => pageNum !== idx + 1);

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    setPageOrder((prev) => {
      const copy = [...prev];
      const tmp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = tmp;
      return copy;
    });
  };

  const handleMoveDown = (index) => {
    if (index >= pageOrder.length - 1) return;
    setPageOrder((prev) => {
      const copy = [...prev];
      const tmp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = tmp;
      return copy;
    });
  };

  const handleReset = () => {
    setPageOrder(Array.from({ length: numPages }, (_, i) => i + 1));
  };

  const handleReverse = () => {
    setPageOrder((prev) => [...prev].reverse());
  };

  const onExecuteReorder = async () => {
    if (!isModified) return;
    await handleReorder(pageOrder);
  };

  // Drag and Drop handlers
  const onDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch {
      // Ignore fallback
    }
  };

  const onDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const onDrop = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    setPageOrder((prev) => {
      const copy = [...prev];
      const movedItem = copy.splice(draggedIdx, 1)[0];
      copy.splice(index, 0, movedItem);
      return copy;
    });

    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const onDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="organise-tool-panel reorder-panel">
      <div className="organise-panel-desc">
        Drag and drop page cards or use controls to arrange document page sequence.
      </div>

      {error && (
        <div className="organise-banner banner-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="organise-banner banner-success">
          <CheckCircle2 size={14} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Quick Toolbar */}
      <div className="reorder-toolbar-actions">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleReverse}
          title="Reverse current sequence"
        >
          <ArrowUpDown size={12} />
          <span>Reverse Order</span>
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={handleReset}
          disabled={!isModified}
          title="Reset to original order"
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>
      </div>

      {/* Pages Sequence List with Visual Page Previews */}
      <div className="reorder-pages-container">
        <div className="reorder-list">
          {pageOrder.map((originalPageNum, index) => {
            const isTarget = currentPage === originalPageNum;
            const isBeingDragged = draggedIdx === index;
            const isDropTarget = dragOverIdx === index;

            return (
              <div
                key={`page-${originalPageNum}-${index}`}
                draggable={!isProcessing}
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDrop={(e) => onDrop(e, index)}
                onDragEnd={onDragEnd}
                className={`reorder-item-card ${isTarget ? 'is-active-page' : ''} ${
                  isBeingDragged ? 'is-dragging' : ''
                } ${isDropTarget ? 'is-drag-target' : ''}`}
                onClick={() => setCurrentPage(originalPageNum)}
                title={`Drag to reorder Page ${originalPageNum}`}
              >
                <div className="reorder-drag-grip" title="Drag to reorder">
                  <GripVertical size={13} />
                </div>

                <div className="reorder-pos-box">
                  <span className="reorder-pos-badge">{index + 1}</span>
                </div>

                <MiniPageThumbnail pdfDoc={pdfJsDoc} pageNumber={originalPageNum} />

                <div className="reorder-page-title">
                  <span className="reorder-page-num">Page {originalPageNum}</span>
                  {originalPageNum !== index + 1 && (
                    <span className="shifted-tag">was {originalPageNum}</span>
                  )}
                </div>

                <div className="reorder-item-controls" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="btn-icon-subtle"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0 || isProcessing}
                    title="Move Earlier"
                    aria-label={`Move page ${originalPageNum} up`}
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon-subtle"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === pageOrder.length - 1 || isProcessing}
                    title="Move Later"
                    aria-label={`Move page ${originalPageNum} down`}
                  >
                    <ChevronDown size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="organise-actions-stack">
        <button
          type="button"
          className="btn btn-primary btn-block btn-organise-execute"
          onClick={onExecuteReorder}
          disabled={isProcessing || !isModified}
        >
          {isProcessing ? (
            <>
              <Loader2 size={14} className="spin-icon" />
              <span>Applying Changes...</span>
            </>
          ) : (
            <>
              <Check size={14} />
              <span>Apply Changes</span>
            </>
          )}
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => setActiveToolId(null)}
          disabled={isProcessing}
        >
          Cancel
        </button>
      </div>

      {!isModified && (
        <span className="validation-helper text-center">
          Drag cards or use arrows above to change page sequence.
        </span>
      )}
    </div>
  );
}
