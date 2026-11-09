import React from 'react';
import MergePanel from './MergePanel.jsx';
import SplitPanel from './SplitPanel.jsx';
import ReorderPanel from './ReorderPanel.jsx';
import RotatePanel from './RotatePanel.jsx';
import DeletePanel from './DeletePanel.jsx';
import DuplicatePanel from './DuplicatePanel.jsx';
import ExtractPanel from './ExtractPanel.jsx';
import InsertBlankPanel from './InsertBlankPanel.jsx';
import CropPanel from './CropPanel.jsx';

export default function OrganisePanelContainer({ toolId }) {
  switch (toolId) {
    case 'merge':
      return <MergePanel />;
    case 'split':
      return <SplitPanel />;
    case 'reorder':
      return <ReorderPanel />;
    case 'rotate':
      return <RotatePanel />;
    case 'delete':
      return <DeletePanel />;
    case 'duplicate':
      return <DuplicatePanel />;
    case 'extract':
      return <ExtractPanel />;
    case 'blank':
      return <InsertBlankPanel />;
    case 'crop':
      return <CropPanel />;
    default:
      return null;
  }
}

