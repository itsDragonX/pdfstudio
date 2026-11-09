import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDocument } from '../../app/store/DocumentContext';
import PageEditOverlay from '../../features/edit/ui/PageEditOverlay';
import PageStampOverlay from '../../features/stamp/ui/PageStampOverlay';

function PageView({ pdfDoc, pageNumber, scale, onVisible }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isRendered, setIsRendered] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 595, height: 842 });
  const [pageViewport, setPageViewport] = useState(null);

  // Intersection observer to track current visible page
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            onVisible(pageNumber);
          }
        });
      },
      { threshold: [0.5] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNumber, onVisible]);

  // Render the page canvas
  useEffect(() => {
    let isCancelled = false;
    let renderTask = null;

    async function renderPage() {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale });
        setDimensions({ width: viewport.width, height: viewport.height });
        setPageViewport(viewport);

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
          console.warn(`Error rendering page ${pageNumber}:`, err);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, pageNumber, scale]);

  return (
    <div 
      id={`page-wrapper-${pageNumber}`}
      ref={containerRef} 
      className="pdf-sheet-card"
      style={{
        width: `${Math.floor(dimensions.width)}px`,
        minHeight: `${Math.floor(dimensions.height)}px`
      }}
    >
      <canvas ref={canvasRef} />
      {pageViewport && (
        <>
          <PageEditOverlay
            pageNumber={pageNumber}
            viewport={pageViewport}
            pageElementRef={containerRef}
          />
          <PageStampOverlay
            pageNumber={pageNumber}
            viewport={pageViewport}
            pageElementRef={containerRef}
          />
        </>
      )}
      {!isRendered && (
        <div 
          className="pdf-sheet-loading"
          style={{ width: `${Math.floor(dimensions.width)}px`, height: `${Math.floor(dimensions.height)}px` }}
        >
          <span>Rendering Page {pageNumber}...</span>
        </div>
      )}
    </div>
  );
}

export default function PDFCanvasViewer() {
  const { 
    pdfJsDoc, 
    numPages, 
    currentPage, 
    setCurrentPage, 
    zoom, 
    setZoom, 
    fitMode 
  } = useDocument();

  const viewerContainerRef = useRef(null);
  const [effectiveScale, setEffectiveScale] = useState(zoom);

  // Calculate fit mode scale
  useEffect(() => {
    async function calculateFitScale() {
      if (!pdfJsDoc || !viewerContainerRef.current) return;

      if (fitMode === 'custom') {
        setEffectiveScale(zoom);
        return;
      }

      try {
        const page = await pdfJsDoc.getPage(currentPage || 1);
        const unscaledViewport = page.getViewport({ scale: 1 });
        const container = viewerContainerRef.current;
        const isMobile = window.innerWidth <= 640;
        const horizontalPadding = isMobile ? 24 : 64;
        const verticalPadding = 48;

        if (fitMode === 'width') {
          const availWidth = Math.max(200, container.clientWidth - horizontalPadding);
          const calculated = Math.max(0.25, Math.min(3.0, availWidth / unscaledViewport.width));
          setEffectiveScale(+calculated.toFixed(2));
          setZoom(+calculated.toFixed(2));
        } else if (fitMode === 'page') {
          const availHeight = Math.max(200, container.clientHeight - verticalPadding);
          const availWidth = Math.max(200, container.clientWidth - horizontalPadding);
          const scaleH = availHeight / unscaledViewport.height;
          const scaleW = availWidth / unscaledViewport.width;
          const calculated = Math.max(0.25, Math.min(3.0, Math.min(scaleH, scaleW)));
          setEffectiveScale(+calculated.toFixed(2));
          setZoom(+calculated.toFixed(2));
        }
      } catch (err) {
        console.warn('Fit scale calculation error:', err);
      }
    }

    calculateFitScale();

    const handleResize = () => {
      if (fitMode !== 'custom') {
        calculateFitScale();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pdfJsDoc, currentPage, fitMode, zoom, setZoom]);

  const handlePageVisible = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
  }, [setCurrentPage]);

  if (!pdfJsDoc || numPages === 0) {
    return null;
  }

  return (
    <main className="pdf-canvas-container pdf-scroll-viewport" ref={viewerContainerRef}>
      <div className="pdf-pages-track">
        {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
          <PageView
            key={`${pdfJsDoc.fingerprint || 'doc'}-page-${pageNum}`}
            pdfDoc={pdfJsDoc}
            pageNumber={pageNum}
            scale={effectiveScale}
            onVisible={handlePageVisible}
          />
        ))}
      </div>
    </main>
  );
}
