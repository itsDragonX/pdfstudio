import { parsePageRanges } from '../../organise/services/pageOperations.js';

/**
 * Resolves target page indices (0-based) based on pageTarget mode and exclusion rules.
 * 
 * @param {object} options
 * @param {'all' | 'current' | 'selected' | 'range'} [options.pageTarget='all']
 * @param {number} [options.currentPageIndex=0]
 * @param {number[]} [options.selectedPageIndices=[]]
 * @param {string} [options.rangeString='']
 * @param {boolean} [options.excludeFirstPage=false]
 * @param {number} totalPages
 * @returns {number[]} Array of 0-based page indices
 */
export function resolveTargetPageIndices(options = {}, totalPages = 1) {
  const {
    pageTarget = 'all',
    currentPageIndex = 0,
    selectedPageIndices = [],
    rangeString = '',
    excludeFirstPage = false
  } = options;

  let indices = [];

  switch (pageTarget) {
    case 'current':
      if (currentPageIndex >= 0 && currentPageIndex < totalPages) {
        indices = [currentPageIndex];
      }
      break;

    case 'selected':
      if (Array.isArray(selectedPageIndices) && selectedPageIndices.length > 0) {
        indices = selectedPageIndices.filter((idx) => idx >= 0 && idx < totalPages);
      }
      break;

    case 'range':
      if (rangeString && rangeString.trim()) {
        const parsed = parsePageRanges(rangeString, totalPages);
        if (parsed.isValid && parsed.groups) {
          const set = new Set();
          for (const g of parsed.groups) {
            for (const idx of g.indices) {
              set.add(idx);
            }
          }
          indices = Array.from(set).sort((a, b) => a - b);
        } else {
          throw new Error(parsed.error || 'Invalid page range specified.');
        }
      }
      break;

    case 'all':
    default:
      indices = Array.from({ length: totalPages }, (_, i) => i);
      break;
  }

  // Filter out duplicate or out-of-bounds indices
  indices = Array.from(new Set(indices)).filter((idx) => idx >= 0 && idx < totalPages);

  // Apply excludeFirstPage rule: page 0 (physical page 1) is excluded
  if (excludeFirstPage) {
    indices = indices.filter((idx) => idx !== 0);
  }

  return indices;
}

