import React from 'react';
import AddTextPanel from './AddTextPanel.jsx';
import AddImagePanel from './AddImagePanel.jsx';
import HighlightPanel from './HighlightPanel.jsx';
import DrawPanel from './DrawPanel.jsx';
import ShapesPanel from './ShapesPanel.jsx';
import WhiteoutPanel from './WhiteoutPanel.jsx';
import RedactPanel from './RedactPanel.jsx';
import SignPanel from './SignPanel.jsx';
import FillFormsPanel from './FillFormsPanel.jsx';

export default function EditPanelContainer({ toolId }) {
  switch (toolId) {
    case 'add-text':
      return <AddTextPanel />;
    case 'add-image':
      return <AddImagePanel />;
    case 'highlight':
      return <HighlightPanel />;
    case 'draw':
      return <DrawPanel />;
    case 'shapes':
      return <ShapesPanel />;
    case 'whiteout':
      return <WhiteoutPanel />;
    case 'redact':
      return <RedactPanel />;
    case 'sign':
      return <SignPanel />;
    case 'forms':
      return <FillFormsPanel />;
    default:
      return null;
  }
}

