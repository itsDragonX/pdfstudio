# PDF Studio

> **Professional Offline-First Client-Side PDF Suite**  
> *Target Platform:* Windows 10/11 & Modern Web Browsers  
> *Privacy Posture:* **PDFs processed locally · No PDF uploads**

PDF Studio is a high-performance, offline-first PDF application built with React, Vite, PDF.js, and `pdf-lib`. All PDF rendering, parsing, and manipulation occur directly within the user's browser on their local machine.

---

## 🔒 Privacy & Local Processing Architecture

- **Zero Cloud Processing:** PDF documents are never uploaded to any remote server, cloud API, or third-party service.
- **Client-Side Engine:** All PDF operations execute via WebAssembly and JavaScript in the local browser sandbox.
- **Local Persistence:** Active session state and recent document metadata are stored strictly on the user's device using browser IndexedDB.
- **No Accounts / No Telemetry:** No user registration, tracking cookies, or external analytics.

---

## 🛠️ The 29 Built-in Tools (5 Categories)

PDF Studio is organized into 5 core suites containing exactly 29 tools:

### 1. Organise (9 Tools)
1. **Merge:** Combine multiple PDF files into a single unified document.
2. **Split:** Divide a document by custom page ranges or extract single pages.
3. **Reorder:** Drag-and-drop visual page sequencing.
4. **Rotate:** Rotate selected pages in 90° clockwise increments.
5. **Delete:** Remove unwanted pages from the document structure.
6. **Duplicate:** Clone selected pages and insert them at target positions.
7. **Extract pages:** Save designated page subsets as a standalone PDF.
8. **Insert blank page:** Add blank pages with matching dimensions.
9. **Crop:** Adjust visual `CropBox` and `MediaBox` boundaries without re-encoding vector data.

### 2. Edit (9 Tools)
10. **Add text:** Overlay custom text boxes with font, size, alignment, and color selection.
11. **Add image:** Insert local PNG/JPG images with visual scaling and transform handles.
12. **Highlight:** Draw semi-transparent color overlays over text regions.
13. **Draw:** Smooth freehand vector pen with stroke width and color options.
14. **Shapes:** Insert rectangles, circles, lines, and arrows.
15. **Whiteout:** Visual knockout background mask to cover unwanted elements.
16. **Redact:** Permanent raster burn-in to a new PDF document, completely omitting original vector and text streams.
17. **Sign:** Place visual hand-drawn, typed cursive, or uploaded signature images.
18. **Fill forms:** Read and populate interactive standard AcroForm fields (with unsupported warnings for Adobe dynamic XFA forms).

### 3. Stamp (4 Tools)
19. **Watermark:** Apply diagonal or horizontal text/image watermarks across pages.
20. **Page numbers:** Dynamic `Page X of Y` numbering across 6 standard header/footer positions.
21. **Header and footer:** 6-zone document headers and footers with customizable variables.
22. **Date stamp:** Injects formatted current local timestamp onto target pages.

### 4. Convert (3 Tools + 1 Bonus Tool)
23. **Images to PDF:** Convert sets of JPG, PNG, or WebP images into a multi-page PDF.
24. **PDF to images:** Render high-DPI page images (PNG/JPEG) for individual download or ZIP archive.
25. **PDF to text:** Extract structured raw text streams with reading-order line breaks.
26. **PDF to Word (.docx) [Additional Feature]:** Convert text-based PDFs into genuine editable Microsoft Word (.docx) documents with headings, paragraphs, and lists.

### 5. Finish (4 Tools)
27. **Compress:** Structure optimization (`useObjectStreams`) and high-efficiency JPEG page rasterization.
28. **Edit details:** Modify standard Document Information Dictionary metadata (`Title`, `Author`, etc.).
29. **Remove details:** Strip Document Info Dictionary and root Catalog `/Metadata` (XMP) stream.
30. **Compare two PDFs:** Side-by-side synchronized document viewer with visual difference overlay and text diffs.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+ or v22 LTS)
- npm (v9+ or v10+)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/pdfstudio.git
cd pdfstudio

# Install dependencies
npm install
```

### Running the Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Running Automated Test Runners
PDF Studio includes comprehensive headless test suites covering all milestones:
```bash
# Run Milestone 1 (Document Viewer & Persistence)
node test-milestone1.mjs

# Run Milestone 2 (Organise Suite — 9 tools)
node test-milestone2.mjs

# Run Milestone 3 (Edit Suite — 9 tools)
node test-milestone3.mjs

# Run Milestone 4 (Stamp Suite — 4 tools)
node test-milestone4.mjs

# Run Milestone 5 (Convert Suite — 3 tools)
node test-milestone5.mjs

# Run Additional Feature (PDF to Word DOCX conversion)
node test-additional-pdf-to-word.mjs

# Run Milestone 6 (Finish Suite — 4 tools)
node test-milestone6.mjs
```

### Windows Shortcut
On Windows, you can also launch the app by double-clicking `start.bat`.

### Building for Production
```bash
npm run build
```
The compiled, production-ready static assets will be output to the `dist/` directory.

---

## 🌐 GitHub Pages Deployment

PDF Studio is designed for static hosting on **GitHub Pages**:
- No backend server required.
- Automatically configured via the included GitHub Actions workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### Deployment Steps:
1. Push the code to your GitHub repository's `main` branch.
2. In your repository on GitHub, navigate to **Settings** → **Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. The workflow will automatically build and deploy the application to `https://<username>.github.io/<repository-name>/`.

---

## 📦 Offline PWA Operation

PDF Studio is configured as a **Progressive Web App (PWA)** using `vite-plugin-pwa`:
- All application JavaScript, CSS, HTML, and assets are precached by a Service Worker (`sw.js`).
- The PDF.js Web Worker (`pdf.worker.min.mjs`), CMaps, and standard fallback fonts are bundled locally.
- After the initial visit, the application functions **100% offline** with no internet connection required.

---

## 📄 License

MIT License. Designed and built as an offline-first document workstation.

