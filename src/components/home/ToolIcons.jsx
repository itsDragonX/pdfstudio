import React from 'react';

/**
 * 29 Handcrafted Apple-inspired Vector Illustrations for PDF Studio Tools
 * Style: 2px rounded strokes, duotone fills, subtle gradients, telling the story of each tool.
 */

// 1. Merge — Two pages converging into one
export function MergeIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="3" y="4" width="9" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.12" />
      <rect x="16" y="4" width="9" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.12" />
      <path d="M7.5 16v3a2 2 0 002 2h9a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14 18v6m0 0l-2-2m2 2l2-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 2. Split — Single page dividing along a dashed line
export function SplitIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="5" y="4" width="18" height="20" rx="2.5" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.08" />
      <line x1="14" y1="4" x2="14" y2="24" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2" />
      <path d="M10 14l-2.5 0m0 0l1.5-1.5m-1.5 1.5l1.5 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 14l2.5 0m0 0l-1.5-1.5m1.5 1.5l-1.5 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 3. Reorder — Stacked pages with vertical sequence arrows
export function ReorderIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="5" y="4" width="13" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.1" />
      <rect x="5" y="17" width="13" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.1" />
      <path d="M22 6v6m0 0l-2-2m2 2l2-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 22v-6m0 0l-2 2m2-2l2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 4. Rotate — Page with clockwise curved arrow
export function RotateIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="7" y="6" width="12" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.1" />
      <path d="M21 9a8 8 0 11-4-6.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M22 2.5v4.5h-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 5. Delete — Page with deletion badge
export function DeleteIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="5" y="4" width="13" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.08" />
      <circle cx="19" cy="19" r="6" stroke="currentColor" strokeWidth="1.8" fill="var(--surface)" />
      <line x1="16.5" y1="19" x2="21.5" y2="19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// 6. Duplicate — Tandem cloned pages
export function DuplicateIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="8" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.15" />
      <path d="M5 8v13a2 2 0 002 2h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 12h6m-3-3v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// 7. Extract — Page lifting out from a stack
export function ExtractIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="4" y="11" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.06" opacity="0.6" />
      <rect x="9" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.12" />
      <path d="M16 8l0-5m0 0l-2.5 2.5M16 3l2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 8. Insert Blank Page — Dashed outline with plus sign
export function InsertBlankIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="5" y="4" width="18" height="20" rx="2.5" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2" fill="currentColor" fillOpacity="0.04" />
      <circle cx="14" cy="14" r="4.5" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.12" />
      <line x1="14" y1="11.5" x2="14" y2="16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="11.5" y1="14" x2="16.5" y2="14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// 9. Crop — Page with photographic corner crop handles
export function CropIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="6" y="6" width="16" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.5" />
      <path d="M4 8h5v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 20h-5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 24v-5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 4v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 10. Add Text — Page with typography 'T' cursor
export function AddTextIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="5" y="4" width="18" height="20" rx="2.5" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.08" />
      <path d="M10 10h8m-4 0v9m-2 0h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 11. Add Image — Photo landscape with sun and mountain
export function AddImageIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="4" y="5" width="20" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.08" />
      <circle cx="9.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.2" />
      <path d="M4 19l6-6 4 4 5-5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 12. Highlight — Marker band glowing over text lines
export function HighlightIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="5" y="4" width="18" height="20" rx="2.5" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.08" />
      <rect x="8" y="11" width="12" height="5" rx="1.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.2" />
      <path d="M21 21l-3-3m0 0l3-5 3 3-5 3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 13. Draw — Smooth fountain pen bezier curve
export function DrawIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <path d="M6 21c4-1 6-7 10-6s3 5 7 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="6" cy="21" r="1.5" fill="currentColor" />
      <path d="M17 7l5 5-2 2-5-5 2-2z" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.15" />
      <path d="M15 9l-3 5 3-1 1-3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

// 14. Shapes — Geometric primitive shapes
export function ShapesIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="5" y="5" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.1" />
      <circle cx="18" cy="18" r="5.5" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
}

// 15. Whiteout — Correction tape erasing content
export function WhiteoutIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="5" y="4" width="18" height="20" rx="2.5" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.08" />
      <line x1="8" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <rect x="7" y="13" width="14" height="6" rx="2" fill="var(--surface)" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 1.5" />
    </svg>
  );
}

// 16. Redact — Permanent censor block
export function RedactIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="5" y="4" width="18" height="20" rx="2.5" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.08" />
      <rect x="8" y="9" width="12" height="4" rx="1" fill="currentColor" />
      <rect x="8" y="16" width="9" height="4" rx="1" fill="currentColor" />
    </svg>
  );
}

// 17. Sign — Signature flourish under pen
export function SignIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <path d="M5 21h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
      <path d="M6 18c2-2 3-5 5-4s1 5 3 4 3-7 5-6 1 5 3 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// 18. Fill Forms — Document with interactive form fields
export function FillFormsIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="5" y="4" width="18" height="20" rx="2.5" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.08" />
      <rect x="8" y="8" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.2" />
      <line x1="14" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="16" r="2" stroke="currentColor" strokeWidth="1.4" />
      <line x1="14" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// 19. Watermark — Diagonal watermark banner
export function WatermarkIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="5" y="4" width="18" height="20" rx="2.5" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.08" />
      <path d="M5 20L20 5" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2" />
      <text x="7" y="16" fill="currentColor" fontSize="7" fontWeight="600" opacity="0.5" transform="rotate(-40 7 16)" letterSpacing="1">DRAFT</text>
    </svg>
  );
}

// 20. Page Numbers — Page counter badge
export function PageNumbersIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="5" y="4" width="18" height="20" rx="2.5" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.08" />
      <rect x="10" y="18" width="8" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.2" />
      <text x="14" y="21.2" fill="currentColor" fontSize="4.5" fontWeight="700" textAnchor="middle">1 / 4</text>
    </svg>
  );
}

// 21. Header & Footer — Top and bottom boundary margins
export function HeaderFooterIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="5" y="4" width="18" height="20" rx="2.5" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.08" />
      <rect x="7" y="6" width="14" height="3" rx="1" fill="currentColor" fillOpacity="0.25" />
      <rect x="7" y="19" width="14" height="3" rx="1" fill="currentColor" fillOpacity="0.25" />
    </svg>
  );
}

// 22. Date Stamp — Calendar stamp with check
export function DateStampIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="5" y="6" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.08" />
      <line x1="5" y1="11" x2="23" y2="11" stroke="currentColor" strokeWidth="1.6" />
      <line x1="9" y1="4" x2="9" y2="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="19" y1="4" x2="19" y2="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="14" cy="17" r="3.5" stroke="currentColor" strokeWidth="1.4" fill="var(--surface)" />
      <path d="M14 15.5v1.5l1 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// 23. Images to PDF — Pictures converting to PDF
export function ImagesToPdfIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="3" y="6" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.12" />
      <circle cx="5.5" cy="8.5" r="1" fill="currentColor" />
      <path d="M13.5 11h3m0 0l-1.5-1.5m1.5 1.5l-1.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="18" y="5" width="8" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

// 24. PDF to Images — PDF exporting into photo tiles
export function PdfToImagesIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="3" y="5" width="8" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.2" />
      <path d="M12.5 11h3m0 0l-1.5-1.5m1.5 1.5l-1.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="17" y="6" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.12" />
      <circle cx="19.5" cy="8.5" r="1" fill="currentColor" />
    </svg>
  );
}

// 25. PDF to Text — PDF extracting structured text
export function PdfToTextIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="4" y="5" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.1" />
      <line x1="17" y1="8" x2="24" y2="8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="17" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="17" y1="16" x2="22" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="17" y1="20" x2="20" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// 26. Compress — Compression vice arrows reducing size
export function CompressIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="7" y="5" width="14" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.08" />
      <path d="M3 14h4m0 0l-1.5-1.5M7 14l-1.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25 14h-4m0 0l1.5-1.5M21 14l1.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="11" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="18" x2="15" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// 27. Edit Details — Metadata tag with edit pencil
export function EditDetailsIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <path d="M5 7a2 2 0 012-2h8l7 7v9a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.08" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
      <path d="M14 16l4-4 2 2-4 4h-2v-2z" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

// 28. Remove Details — Metadata tag being wiped / stripped
export function RemoveDetailsIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <path d="M5 7a2 2 0 012-2h8l7 7v9a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.08" />
      <line x1="12" y1="14" x2="18" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="18" y1="14" x2="12" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// 29. Compare Two PDFs — Side-by-side diff overlay
export function CompareIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="3" y="5" width="10" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.08" />
      <rect x="15" y="5" width="10" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.15" />
      <line x1="6" y1="9" x2="10" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="18" y1="9" x2="22" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="1.5 1.5" />
      <line x1="6" y1="13" x2="10" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="18" y1="13" x2="22" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// Additional Convert Tool: PDF to Word — Document with Word typography & badge
export function PdfToWordIcon({ className = '', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <path d="M6 5a2 2 0 012-2h8l6 6v14a2 2 0 01-2 2H8a2 2 0 01-2-2V5z" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.08" />
      <path d="M16 3v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 14.5l1.2 4.5 1.5-3.2 1.5 3.2 1.2-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="9.5" y1="21.5" x2="18.5" y2="21.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// Map tool ID to its respective custom SVG icon component
export const TOOL_ICON_MAP = {
  'merge': MergeIcon,
  'split': SplitIcon,
  'reorder': ReorderIcon,
  'rotate': RotateIcon,
  'delete': DeleteIcon,
  'duplicate': DuplicateIcon,
  'extract': ExtractIcon,
  'blank': InsertBlankIcon,
  'crop': CropIcon,
  'add-text': AddTextIcon,
  'add-image': AddImageIcon,
  'highlight': HighlightIcon,
  'draw': DrawIcon,
  'shapes': ShapesIcon,
  'whiteout': WhiteoutIcon,
  'redact': RedactIcon,
  'sign': SignIcon,
  'forms': FillFormsIcon,
  'watermark': WatermarkIcon,
  'page-numbers': PageNumbersIcon,
  'header-footer': HeaderFooterIcon,
  'date-stamp': DateStampIcon,
  'images-to-pdf': ImagesToPdfIcon,
  'pdf-to-images': PdfToImagesIcon,
  'pdf-to-text': PdfToTextIcon,
  'pdf-to-word': PdfToWordIcon,
  'compress': CompressIcon,
  'edit-details': EditDetailsIcon,
  'remove-details': RemoveDetailsIcon,
  'compare': CompareIcon,
};

