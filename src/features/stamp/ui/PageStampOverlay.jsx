import React from 'react';
import { useStampContext } from '../context/StampContext.jsx';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { formatPageNumberString } from '../services/pageNumberService.js';
import { resolveDynamicVariables } from '../services/headerFooterService.js';
import { formatDate } from '../services/dateStampService.js';
import { parsePageRanges } from '../../organise/services/pageOperations.js';

export default function PageStampOverlay({ pageNumber, viewport, pageElementRef }) {
  const { isStampActive, activeStampTool, stampPayload } = useStampContext();
  const { numPages, currentPage, docFile } = useDocument();

  if (!isStampActive || !viewport) return null;

  const pageIndex = pageNumber - 1;

  // Determine if this page should display the live preview
  const {
    pageTarget = 'all',
    rangeString = '',
    excludeFirstPage = false
  } = stampPayload;

  if (excludeFirstPage && pageNumber === 1) {
    return null;
  }

  let isPageTargeted = true;
  if (pageTarget === 'current') {
    isPageTargeted = pageNumber === currentPage;
  } else if (pageTarget === 'range' && rangeString.trim()) {
    try {
      const parsed = parsePageRanges(rangeString, numPages);
      if (parsed.isValid && parsed.groups) {
        const set = new Set();
        parsed.groups.forEach((g) => g.indices.forEach((idx) => set.add(idx)));
        isPageTargeted = set.has(pageIndex);
      }
    } catch {
      isPageTargeted = false;
    }
  }

  if (!isPageTargeted) return null;

  const scale = viewport.scale || 1.0;
  const viewWidth = viewport.width;
  const viewHeight = viewport.height;

  // -------------------------------------------------------------
  // 1. WATERMARK PREVIEW
  // -------------------------------------------------------------
  if (activeStampTool === 'watermark') {
    const {
      type = 'text',
      text = 'CONFIDENTIAL',
      fontSize = 48,
      color = '#FF3B30',
      opacity = 0.25,
      rotation = -45,
      position = 'center',
      isTiled = false,
      imagePreviewUrl,
      imageScale = 1.0
    } = stampPayload;

    const scaledFontSize = Math.max(10, Math.round(fontSize * scale));
    const safeOpacity = Math.max(0.05, Math.min(1.0, opacity));

    const getCenterCoord = (pos) => {
      const margin = 40 * scale;
      switch (pos) {
        case 'top-left': return { cx: margin + 80 * scale, cy: margin + 40 * scale };
        case 'top-right': return { cx: viewWidth - margin - 80 * scale, cy: margin + 40 * scale };
        case 'bottom-left': return { cx: margin + 80 * scale, cy: viewHeight - margin - 40 * scale };
        case 'bottom-right': return { cx: viewWidth - margin - 80 * scale, cy: viewHeight - margin - 40 * scale };
        case 'center':
        default:
          return { cx: viewWidth / 2, cy: viewHeight / 2 };
      }
    };

    if (isTiled) {
      // Tiled grid preview
      const stepX = Math.max(140 * scale, 180 * scale);
      const stepY = Math.max(100 * scale, 140 * scale);
      const points = [];

      for (let cy = 80 * scale; cy < viewHeight - 60 * scale; cy += stepY) {
        for (let cx = 80 * scale; cx < viewWidth - 60 * scale; cx += stepX) {
          points.push({ cx, cy });
        }
      }

      return (
        <div className="page-stamp-overlay-layer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 12 }}>
          {points.map((pt, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${pt.cx}px`,
                top: `${pt.cy}px`,
                transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                opacity: safeOpacity,
                color,
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontSize: `${Math.round(scaledFontSize * 0.7)}px`,
                fontWeight: 700,
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
                userSelect: 'none'
              }}
            >
              {type === 'image' && imagePreviewUrl ? (
                <img src={imagePreviewUrl} alt="" style={{ height: `${Math.round(40 * scale * imageScale)}px`, objectFit: 'contain' }} />
              ) : (
                text
              )}
            </div>
          ))}
        </div>
      );
    }

    // Single centered / positioned watermark
    const { cx, cy } = getCenterCoord(position);

    return (
      <div className="page-stamp-overlay-layer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 12 }}>
        <div
          style={{
            position: 'absolute',
            left: `${cx}px`,
            top: `${cy}px`,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            opacity: safeOpacity,
            color,
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: `${scaledFontSize}px`,
            fontWeight: 700,
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            textShadow: '0 0 1px rgba(0, 0, 0, 0.05)'
          }}
        >
          {type === 'image' && imagePreviewUrl ? (
            <img 
              src={imagePreviewUrl} 
              alt="Watermark" 
              style={{ 
                maxHeight: `${Math.round(180 * scale * imageScale)}px`, 
                maxWidth: `${Math.round(280 * scale * imageScale)}px`, 
                objectFit: 'contain' 
              }} 
            />
          ) : (
            text
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. PAGE NUMBERS PREVIEW
  // -------------------------------------------------------------
  if (activeStampTool === 'page-numbers') {
    const {
      format = 'page_n_of_total',
      customPrefix = '',
      customSuffix = '',
      startNumber = 1,
      position = 'bottom-center',
      fontSize = 10,
      color = '#333333',
      margin = 36,
      opacity = 1.0
    } = stampPayload;

    const totalDisplayPages = excludeFirstPage ? Math.max(1, numPages - 1) : numPages;
    const displayNum = Math.max(1, pageIndex - (excludeFirstPage ? 1 : 0) + startNumber);

    const printedString = formatPageNumberString({
      format,
      displayNum,
      totalDisplayPages,
      customPrefix,
      customSuffix
    });

    const scaledMargin = Math.round(margin * scale);
    const scaledFontSize = Math.max(8, Math.round(fontSize * scale));

    const posStyle = {
      position: 'absolute',
      fontFamily: 'Helvetica, Arial, sans-serif',
      fontSize: `${scaledFontSize}px`,
      color,
      opacity,
      pointerEvents: 'none',
      userSelect: 'none',
      whiteSpace: 'nowrap',
      zIndex: 12
    };

    if (position.startsWith('top')) {
      posStyle.top = `${scaledMargin}px`;
    } else {
      posStyle.bottom = `${scaledMargin}px`;
    }

    if (position.endsWith('left')) {
      posStyle.left = `${scaledMargin}px`;
    } else if (position.endsWith('right')) {
      posStyle.right = `${scaledMargin}px`;
    } else {
      posStyle.left = '50%';
      posStyle.transform = 'translateX(-50%)';
    }

    return (
      <div className="page-stamp-overlay-layer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={posStyle}>{printedString}</div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. HEADER & FOOTER PREVIEW
  // -------------------------------------------------------------
  if (activeStampTool === 'header-footer') {
    const {
      headerLeft = '',
      headerCenter = '',
      headerRight = '',
      footerLeft = '',
      footerCenter = '',
      footerRight = '',
      fontSize = 10,
      color = '#333333',
      margin = 36,
      opacity = 1.0,
      dateString = ''
    } = stampPayload;

    const context = {
      page: pageNumber,
      totalPages: numPages,
      filename: docFile?.name || 'document.pdf',
      date: dateString || '09/11/2026'
    };

    const scaledMargin = Math.round(margin * scale);
    const scaledFontSize = Math.max(8, Math.round(fontSize * scale));

    const baseItemStyle = {
      position: 'absolute',
      fontFamily: 'Helvetica, Arial, sans-serif',
      fontSize: `${scaledFontSize}px`,
      color,
      opacity,
      userSelect: 'none',
      whiteSpace: 'nowrap'
    };

    return (
      <div className="page-stamp-overlay-layer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 12 }}>
        {/* Header Zones */}
        {headerLeft && (
          <div style={{ ...baseItemStyle, top: `${scaledMargin}px`, left: `${scaledMargin}px` }}>
            {resolveDynamicVariables(headerLeft, context)}
          </div>
        )}
        {headerCenter && (
          <div style={{ ...baseItemStyle, top: `${scaledMargin}px`, left: '50%', transform: 'translateX(-50%)' }}>
            {resolveDynamicVariables(headerCenter, context)}
          </div>
        )}
        {headerRight && (
          <div style={{ ...baseItemStyle, top: `${scaledMargin}px`, right: `${scaledMargin}px` }}>
            {resolveDynamicVariables(headerRight, context)}
          </div>
        )}

        {/* Footer Zones */}
        {footerLeft && (
          <div style={{ ...baseItemStyle, bottom: `${scaledMargin}px`, left: `${scaledMargin}px` }}>
            {resolveDynamicVariables(footerLeft, context)}
          </div>
        )}
        {footerCenter && (
          <div style={{ ...baseItemStyle, bottom: `${scaledMargin}px`, left: '50%', transform: 'translateX(-50%)' }}>
            {resolveDynamicVariables(footerCenter, context)}
          </div>
        )}
        {footerRight && (
          <div style={{ ...baseItemStyle, bottom: `${scaledMargin}px`, right: `${scaledMargin}px` }}>
            {resolveDynamicVariables(footerRight, context)}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. DATE STAMP PREVIEW
  // -------------------------------------------------------------
  if (activeStampTool === 'date-stamp') {
    const {
      dateFormat = 'DD/MM/YYYY',
      includeTime = false,
      timeFormat = '24h',
      prefix = '',
      timestamp = Date.now(),
      position = 'bottom-right',
      fontSize = 11,
      color = '#000000',
      opacity = 1.0,
      margin = 36
    } = stampPayload;

    const formattedDate = formatDate(timestamp, dateFormat, includeTime, timeFormat);
    const stampText = prefix ? `${prefix}${formattedDate}` : formattedDate;

    const scaledMargin = Math.round(margin * scale);
    const scaledFontSize = Math.max(8, Math.round(fontSize * scale));

    const posStyle = {
      position: 'absolute',
      fontFamily: 'Helvetica, Arial, sans-serif',
      fontSize: `${scaledFontSize}px`,
      color,
      opacity,
      pointerEvents: 'none',
      userSelect: 'none',
      whiteSpace: 'nowrap',
      zIndex: 12
    };

    if (position.startsWith('top')) {
      posStyle.top = `${scaledMargin}px`;
    } else {
      posStyle.bottom = `${scaledMargin}px`;
    }

    if (position.endsWith('left')) {
      posStyle.left = `${scaledMargin}px`;
    } else if (position.endsWith('right')) {
      posStyle.right = `${scaledMargin}px`;
    } else {
      posStyle.left = '50%';
      posStyle.transform = 'translateX(-50%)';
    }

    return (
      <div className="page-stamp-overlay-layer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={posStyle}>{stampText}</div>
      </div>
    );
  }

  return null;
}

