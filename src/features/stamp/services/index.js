export { 
  applyWatermarkToPDF, 
  WATERMARK_PRESETS,
  calculateRotatedAnchor,
  calculateCenterPoint 
} from './watermarkService.js';

export { 
  applyPageNumbersToPDF, 
  PAGE_NUMBER_FORMATS, 
  PAGE_NUMBER_POSITIONS,
  formatPageNumberString 
} from './pageNumberService.js';

export { 
  applyHeaderFooterToPDF, 
  HEADER_FOOTER_ZONES, 
  resolveDynamicVariables 
} from './headerFooterService.js';

export { 
  applyDateStampToPDF, 
  DATE_FORMATS, 
  DATE_STAMP_POSITIONS, 
  formatDate 
} from './dateStampService.js';

export { resolveTargetPageIndices } from './targetPagesHelper.js';
export { getStandardFont, FONT_MAP } from './fontHelper.js';

