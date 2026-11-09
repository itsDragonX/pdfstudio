import React from 'react';
import { X, FileText } from 'lucide-react';
import { useDocument } from '../../app/store/DocumentContext';
import { CATEGORIES } from './Sidebar';
import { TOOL_ICON_MAP } from '../home/ToolIcons';
import OrganisePanelContainer from '../../features/organise/ui/OrganisePanelContainer';
import EditPanelContainer from '../../features/edit/ui/EditPanelContainer';
import StampPanelContainer from '../../features/stamp/ui/StampPanelContainer';
import ConvertPanelContainer from '../../features/convert/ui/ConvertPanelContainer';
import FinishPanelContainer from '../../features/finish/ui/FinishPanelContainer';

export default function RightInspector() {
  const { activeCategory, activeToolId, setActiveToolId } = useDocument();

  if (!activeToolId) {
    return null;
  }

  const currentCategoryData = CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];
  const allTools = CATEGORIES.flatMap((c) => c.tools);
  const activeToolData = allTools.find((t) => t.id === activeToolId);
  const ToolIcon = activeToolData ? (TOOL_ICON_MAP[activeToolData.id] || FileText) : FileText;

  const isOrganise = activeCategory === 'organise';
  const isEdit = activeCategory === 'edit';
  const isStamp = activeCategory === 'stamp';
  const isConvert = activeCategory === 'convert';
  const isFinish = activeCategory === 'finish';

  const handleClose = () => {
    setActiveToolId(null);
  };

  return (
    <aside 
      className={`floating-inspector-panel category-${currentCategoryData.id}-scope`}
      aria-label={`${activeToolData?.name || 'Tool'} Properties Inspector`}
    >
      {/* Header */}
      <div className="inspector-header">
        <div className="inspector-header-info">
          <div className="inspector-icon-tile">
            <ToolIcon size={16} />
          </div>
          <div className="inspector-title-block">
            <h3 className="inspector-tool-title">{activeToolData?.name || 'Tool'}</h3>
            <span className="inspector-category-badge">{currentCategoryData.name}</span>
          </div>
        </div>

        <button
          type="button"
          className="btn-icon-subtle inspector-close-btn"
          onClick={handleClose}
          title="Close Inspector"
          aria-label="Close Inspector"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body with tool-specific panel */}
      <div className="inspector-scroll-body">
        {isOrganise ? (
          <OrganisePanelContainer toolId={activeToolId} />
        ) : isEdit ? (
          <EditPanelContainer toolId={activeToolId} />
        ) : isStamp ? (
          <StampPanelContainer toolId={activeToolId} />
        ) : isConvert ? (
          <ConvertPanelContainer toolId={activeToolId} />
        ) : isFinish ? (
          <FinishPanelContainer toolId={activeToolId} />
        ) : (
          <div className="inspector-placeholder">
            <div className="placeholder-icon-wrap">
              <ToolIcon size={28} />
            </div>
            <h4>{activeToolData?.name}</h4>
            <p>{activeToolData?.desc}</p>
            <div className="placeholder-status-pill">
              <span>{currentCategoryData.name} Suite</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleClose}
              style={{ marginTop: '12px' }}
            >
              <span>Back to Tools</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

