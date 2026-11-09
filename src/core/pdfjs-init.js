import * as pdfjsLib from 'pdfjs-dist';

// Resolve asset base URL dynamically so the application works seamlessly
// whether hosted at the domain root, a GitHub Pages subpath (/repo-name/), or locally.
const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${normalizedBase}pdf.worker.min.mjs`;
}

export const PDFJS_OFFLINE_CONFIG = {
  cMapUrl: `${normalizedBase}cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `${normalizedBase}standard_fonts/`
};

export default pdfjsLib;
export { pdfjsLib };
