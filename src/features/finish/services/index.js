export {
  compressPdf,
  compressStructure,
  compressRasterized,
  COMPRESSION_PRESETS
} from './compressService.js';

export {
  readDocumentMetadata,
  updateDocumentMetadata,
  removeDocumentMetadata,
  formatDateForInput
} from './metadataService.js';

export {
  comparePdfDocuments,
  computeVisualDifference,
  compareTextStrings,
  normalizeTextForDiff
} from './compareService.js';

