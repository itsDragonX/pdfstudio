import React from 'react';
import WatermarkPanel from './WatermarkPanel.jsx';
import PageNumbersPanel from './PageNumbersPanel.jsx';
import HeaderFooterPanel from './HeaderFooterPanel.jsx';
import DateStampPanel from './DateStampPanel.jsx';

export default function StampPanelContainer({ toolId }) {
  switch (toolId) {
    case 'watermark':
      return <WatermarkPanel />;
    case 'page-numbers':
      return <PageNumbersPanel />;
    case 'header-footer':
      return <HeaderFooterPanel />;
    case 'date-stamp':
      return <DateStampPanel />;
    default:
      return null;
  }
}

