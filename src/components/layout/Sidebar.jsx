import React, { useState } from 'react';
import { 
  Layers, 
  Edit3, 
  Stamp, 
  RefreshCw, 
  CheckCircle2,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useDocument } from '../../app/store/DocumentContext';
import { TOOL_ICON_MAP } from '../home/ToolIcons';

export const CATEGORIES = [
  {
    id: 'organise',
    name: 'Organise',
    icon: Layers,
    description: 'Document structure, layout and ordering',
    tools: [
      { id: 'merge', name: 'Merge', desc: 'Combine multiple PDFs into one document' },
      { id: 'split', name: 'Split', desc: 'Divide by page ranges or extract single pages' },
      { id: 'reorder', name: 'Reorder', desc: 'Drag-and-drop visual page sequencing' },
      { id: 'rotate', name: 'Rotate', desc: 'Rotate selected pages in 90° increments' },
      { id: 'delete', name: 'Delete', desc: 'Remove unwanted pages from document' },
      { id: 'duplicate', name: 'Duplicate', desc: 'Clone selected pages into document' },
      { id: 'extract', name: 'Extract pages', desc: 'Save selected pages as a new PDF' },
      { id: 'blank', name: 'Insert blank page', desc: 'Add blank page with matching dimensions' },
      { id: 'crop', name: 'Crop', desc: 'Adjust visual CropBox/MediaBox boundaries' }
    ]
  },
  {
    id: 'edit',
    name: 'Edit',
    icon: Edit3,
    description: 'Annotations, vectors, forms and markup',
    tools: [
      { id: 'add-text', name: 'Add text', desc: 'Overlay custom styled text boxes' },
      { id: 'add-image', name: 'Add image', desc: 'Insert PNG/JPG images with transform handles' },
      { id: 'highlight', name: 'Highlight', desc: 'Semi-transparent color overlays' },
      { id: 'draw', name: 'Draw', desc: 'Smooth freehand vector pen via SVG path' },
      { id: 'shapes', name: 'Shapes', desc: 'Rectangles, circles, lines and arrows' },
      { id: 'whiteout', name: 'Whiteout', desc: 'Visual knockout background mask' },
      { id: 'redact', name: 'Redact', desc: 'Permanent raster burn-in to new PDF' },
      { id: 'sign', name: 'Sign', desc: 'Visual drawn, typed, or uploaded signature' },
      { id: 'forms', name: 'Fill forms', desc: 'Fill interactive standard AcroForms' }
    ]
  },
  {
    id: 'stamp',
    name: 'Stamp',
    icon: Stamp,
    description: 'Watermarks, headers, footers and numbering',
    tools: [
      { id: 'watermark', name: 'Watermark', desc: 'Diagonal/horizontal text or image overlay' },
      { id: 'page-numbers', name: 'Page numbers', desc: 'Dynamic Page X of Y numbering' },
      { id: 'header-footer', name: 'Header and footer', desc: '6-zone document headers and footers' },
      { id: 'date-stamp', name: 'Date stamp', desc: 'Formatted current local date/time stamp' }
    ]
  },
  {
    id: 'convert',
    name: 'Convert',
    icon: RefreshCw,
    description: 'Document format transformations',
    tools: [
      { id: 'images-to-pdf', name: 'Images to PDF', desc: 'Convert JPG/PNG/WebP to PDF document' },
      { id: 'pdf-to-images', name: 'PDF to images', desc: 'High-DPI page export to PNG/JPG or ZIP' },
      { id: 'pdf-to-text', name: 'PDF to text', desc: 'Extract structured text stream with line breaks' },
      { id: 'pdf-to-word', name: 'PDF to Word', desc: 'Convert text-based PDF to editable Word document (.docx)' }
    ]
  },
  {
    id: 'finish',
    name: 'Finish',
    icon: CheckCircle2,
    description: 'Optimization, metadata and comparison',
    tools: [
      { id: 'compress', name: 'Compress', desc: 'Page rasterization & JPEG re-encode' },
      { id: 'edit-details', name: 'Edit details', desc: 'Update Document Info Dictionary metadata' },
      { id: 'remove-details', name: 'Remove details', desc: 'Strip Info Dictionary and Catalog XMP' },
      { id: 'compare', name: 'Compare two PDFs', desc: 'Visual difference and diff overlay' }
    ]
  }
];

export default function Sidebar() {
  const { 
    activeCategory, 
    setActiveCategory, 
    activeToolId, 
    setActiveToolId,
    isMobileSidebarOpen, 
    setIsMobileSidebarOpen 
  } = useDocument();

  // Local state to collapse panel to icons only
  const [isCollapsed, setIsCollapsed] = useState(false);

  const currentCategoryData = CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
    setActiveToolId(null);
  };

  const handleToolClick = (toolId) => {
    setActiveToolId(toolId);
    if (isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  };

  return (
    <>
      <div 
        className={`sidebar-backdrop ${isMobileSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      <aside 
        className={`unified-tools-panel ${isCollapsed ? 'panel-collapsed' : ''} ${isMobileSidebarOpen ? 'mobile-open' : ''} category-${currentCategoryData.id}-scope`}
        aria-label="PDF Studio Tools Navigation"
      >
        {/* Top: 5 Category Icons in a Segmented Glass Track */}
        <div className="category-segmented-track" role="tablist" aria-label="Tool Categories">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                type="button"
                key={cat.id}
                className={`category-rail-btn category-${cat.id} ${isActive ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat.id)}
                title={`${cat.name} (${cat.tools.length} tools)`}
                aria-label={cat.name}
                aria-selected={isActive}
                role="tab"
              >
                <Icon size={16} strokeWidth={1.9} />
              </button>
            );
          })}
        </div>

        {/* Category Header */}
        <div className="unified-panel-header">
          {!isCollapsed && (
            <div className="header-titles-group">
              <h3 className="tool-subpanel-title">{currentCategoryData.name}</h3>
              <span className="tool-subpanel-badge">{currentCategoryData.tools.length} Tools</span>
            </div>
          )}

          <button
            type="button"
            className="panel-collapse-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand panel' : 'Collapse to icons'}
            aria-label={isCollapsed ? 'Expand panel' : 'Collapse to icons'}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Tool List */}
        <div className="unified-tools-list">
          {currentCategoryData.tools.map((tool) => {
            const ToolIconComponent = TOOL_ICON_MAP[tool.id] || FileText;
            const isActiveTool = activeToolId === tool.id;
            const isNonActiveSuite = false;

            return (
              <div
                key={tool.id}
                className={`tool-subpanel-row ${isActiveTool ? 'active' : ''}`}
                onClick={() => handleToolClick(tool.id)}
                title={`${tool.name}: ${tool.desc}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToolClick(tool.id);
                  }
                }}
              >
                <div className="tool-row-icon-tile">
                  <ToolIconComponent size={16} />
                </div>

                {!isCollapsed && (
                  <span className="tool-row-name">{tool.name}</span>
                )}

                {!isCollapsed && isNonActiveSuite && (
                  <span className="tool-quiet-dot" title="Coming soon" />
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}
