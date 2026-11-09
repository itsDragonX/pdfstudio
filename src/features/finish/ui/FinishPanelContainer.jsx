import React from 'react';
import CompressPanel from './CompressPanel.jsx';
import EditDetailsPanel from './EditDetailsPanel.jsx';
import RemoveDetailsPanel from './RemoveDetailsPanel.jsx';
import ComparePanel from './ComparePanel.jsx';

export default function FinishPanelContainer({ toolId }) {
  switch (toolId) {
    case 'compress':
      return <CompressPanel />;
    case 'edit-details':
      return <EditDetailsPanel />;
    case 'remove-details':
      return <RemoveDetailsPanel />;
    case 'compare':
      return <ComparePanel />;
    default:
      return null;
  }
}

