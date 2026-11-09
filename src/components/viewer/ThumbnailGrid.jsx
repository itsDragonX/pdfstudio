import React, { useEffect, useRef, useState } from 'react';
import { useDocument } from '../../app/store/DocumentContext';

function ThumbnailItem({ pdfDoc, pageNumber, isActive, onSelect }) {
  const canvasRef = useRef(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    let renderTask = null;

    async function renderThumbnail() {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        // Base thumbnail scale for 72px width inside 92px strip
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = 72 / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
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
        if (!isCancelled) {
          setIsRendered(true);
        }
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`Error rendering thumbnail for page ${pageNumber}:`, err);
        }
      }
    }

    renderThumbnail();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, pageNumber]);

  return (
    <div 
      className={`floating-thumb-card ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(pageNumber)}
      title={`Page ${pageNumber}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(pageNumber);
        }
      }}
    >
      <div className="thumb-canvas-box">
        <canvas ref={canvasRef} />
        {!isRendered && (
          <div className="thumb-placeholder-shimmer" />
        )}
      </div>
      <span className="thumb-num-caption">{pageNumber}</span>
    </div>
  );
}

export default function ThumbnailGrid({ onPageSelect }) {
  const { pdfJsDoc, numPages, currentPage, showThumbnails } = useDocument();

  if (!showThumbnails || !pdfJsDoc || numPages === 0) {
    return null;
  }

  return (
    <aside className="floating-thumbnail-strip" aria-label="Page Thumbnails">
      <div className="thumbnail-strip-scroll">
        {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
          <ThumbnailItem
            key={pageNum}
            pdfDoc={pdfJsDoc}
            pageNumber={pageNum}
            isActive={currentPage === pageNum}
            onSelect={onPageSelect}
          />
        ))}
      </div>
    </aside>
  );
}
