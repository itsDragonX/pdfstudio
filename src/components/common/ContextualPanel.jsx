import React from 'react';
import { X, Sliders, ArrowLeft } from 'lucide-react';
import { useDocument } from '../../app/store/DocumentContext';
import OrganisePanelContainer from '../../features/organise/ui/OrganisePanelContainer';

export default function ContextualPanel() {
  const { 
    activeToolId, 
    setActiveToolId, 
    activeCategory,
    setIsToolDrawerOpen 
  } = useDocument();

  // If no active tool is selected, do not permanently occupy workspace space
  if (!activeToolId) {
    return null;
  }

  // Format tool title from id
  const toolTitle = activeToolId === 'blank'
    ? 'Insert Blank Page'
    : activeToolId
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

  const isOrganise = activeCategory === 'organise';

  const handleBackToTools = () => {
    setActiveToolId(null);
    setIsToolDrawerOpen(true);
  };

  const handleClose = () => {
    setActiveToolId(null);
    setIsToolDrawerOpen(false);
  };

  return (
    <aside className="contextual-properties-drawer" aria-label="Tool Properties">
      <div className="contextual-drawer-header">
        <button
          type="button"
          className="btn btn-ghost contextual-back-btn"
          onClick={handleBackToTools}
          title="Back to tools list"
          aria-label="Back to tools"
        >
          <ArrowLeft size={13} />
          <span>Tools</span>
        </button>

        <div className="contextual-header-title-box">
          <Sliders size={13} style={{ color: 'var(--accent)' }} />
          <span className="contextual-title">{toolTitle}</span>
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-icon btn-close-round"
          onClick={handleClose}
          title="Close Panel"
          aria-label="Close Panel"
        >
          <X size={14} />
        </button>
      </div>

      <div className="contextual-drawer-body">
        {isOrganise ? (
          <OrganisePanelContainer toolId={activeToolId} />
        ) : (
          <>
            <div className="property-group">
              <label className="property-label">Mode / Action</label>
              <div className="property-control-box">
                <span>Configuring {toolTitle}</span>
              </div>
            </div>

            <div className="property-group">
              <label className="property-label">Status</label>
              <div className="property-control-box property-status-box">
                <span className="status-live-dot" />
                <span>Ready for document editing</span>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
