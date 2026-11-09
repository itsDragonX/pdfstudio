import React from 'react';
import ImagesToPdfPanel from './ImagesToPdfPanel.jsx';
import PdfToImagesPanel from './PdfToImagesPanel.jsx';
import PdfToTextPanel from './PdfToTextPanel.jsx';
import PdfToWordPanel from './PdfToWordPanel.jsx';

export default function ConvertPanelContainer({ toolId }) {
  switch (toolId) {
    case 'images-to-pdf':
      return <ImagesToPdfPanel />;
    case 'pdf-to-images':
      return <PdfToImagesPanel />;
    case 'pdf-to-text':
      return <PdfToTextPanel />;
    case 'pdf-to-word':
      return <PdfToWordPanel />;
    default:
      return null;
  }
}

