import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  FileText, 
  Upload, 
  Layers,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useOrganise } from '../hooks/useOrganise.js';
import { formatBytes } from '../../../utils/formatters.js';

export default function MergePanel() {
  const { docFile, numPages, setActiveToolId } = useDocument();
  const { handleMerge, isProcessing, error, successMessage } = useOrganise();

  const fileInputRef = useRef(null);

  // Initialise list with current document if available
  const [fileList, setFileList] = useState(() => {
    if (docFile?.bytes && docFile.bytes.byteLength > 0) {
      return [{
        id: 'current_doc',
        name: docFile.name || 'current-document.pdf',
        size: docFile.size || docFile.bytes.byteLength,
        pageCount: numPages,
        bytes: docFile.bytes.slice(0),
        isCurrent: true
      }];
    }
    return [];
  });

  const [outputName, setOutputName] = useState('merged-document.pdf');
  const [dragOver, setDragOver] = useState(false);

  const handleAddFiles = async (files) => {
    const newItems = [];
    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        continue;
      }
      try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        if (bytes.byteLength === 0) {
          console.warn('Skipping empty file:', file.name);
          continue;
        }
        // Quick estimate of page count via binary parsing or fallback
        newItems.push({
          id: `${file.name}_${Date.now()}_${Math.random()}`,
          name: file.name,
          size: file.size,
          bytes: bytes.slice(0),
          pageCount: null // will be resolved during merge
        });
      } catch (err) {
        console.warn('Failed to read file:', file.name, err);
      }
    }
    if (newItems.length > 0) {
      setFileList((prev) => [...prev, ...newItems]);
    }
  };

  const handleRemove = (id) => {
    setFileList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    setFileList((prev) => {
      const copy = [...prev];
      const tmp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = tmp;
      return copy;
    });
  };

  const handleMoveDown = (index) => {
    if (index >= fileList.length - 1) return;
    setFileList((prev) => {
      const copy = [...prev];
      const tmp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = tmp;
      return copy;
    });
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const onExecuteMerge = async () => {
    if (fileList.length < 2) return;
    await handleMerge(fileList, outputName);
  };

  const totalBytes = fileList.reduce((acc, curr) => acc + (curr.size || 0), 0);

  return (
    <div className="organise-tool-panel merge-panel">
      <div className="organise-panel-desc">
        Combine multiple PDF files into one continuous document. Drag to reorder.
      </div>

      {error && (
        <div className="organise-banner banner-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="organise-banner banner-success">
          <CheckCircle2 size={14} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* File Drop & Upload Area */}
      <div
        className={`merge-drop-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files) handleAddFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <Plus size={16} />
        <span>Add PDF Files</span>
        <span className="drop-hint">or drop files here</span>
      </div>

      {/* Selected Files List */}
      <div className="merge-file-list">
        {fileList.length === 0 ? (
          <div className="empty-subtext">No PDF files added yet. Add at least two.</div>
        ) : (
          fileList.map((file, idx) => (
            <div key={file.id} className="merge-file-row">
              <span className="file-seq-badge">{idx + 1}</span>
              <div className="merge-file-info">
                <span className="merge-file-name" title={file.name}>
                  {file.name}
                  {file.isCurrent && <span className="current-doc-pill">Current</span>}
                </span>
                <span className="merge-file-meta">
                  {formatBytes(file.size)}
                  {file.pageCount ? ` • ${file.pageCount} pages` : ''}
                </span>
              </div>
              <div className="merge-row-actions">
                <button
                  type="button"
                  className="btn-icon-subtle"
                  onClick={() => handleMoveUp(idx)}
                  disabled={idx === 0}
                  title="Move Up"
                >
                  <ChevronUp size={13} />
                </button>
                <button
                  type="button"
                  className="btn-icon-subtle"
                  onClick={() => handleMoveDown(idx)}
                  disabled={idx === fileList.length - 1}
                  title="Move Down"
                >
                  <ChevronDown size={13} />
                </button>
                <button
                  type="button"
                  className="btn-icon-subtle btn-remove"
                  onClick={() => handleRemove(file.id)}
                  title="Remove file"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Footer */}
      {fileList.length > 0 && (
        <div className="merge-summary-card">
          <div className="summary-row">
            <span>Documents</span>
            <strong>{fileList.length} files</strong>
          </div>
          <div className="summary-row">
            <span>Total Size</span>
            <strong>{formatBytes(totalBytes)}</strong>
          </div>
          <div className="summary-row">
            <span>Expected Total Pages</span>
            <strong>
              {(() => {
                const known = fileList.reduce((acc, f) => acc + (f.pageCount || 0), 0);
                const allKnown = fileList.every((f) => typeof f.pageCount === 'number');
                return allKnown ? `${known} pages` : `${known}+ pages`;
              })()}
            </strong>
          </div>
        </div>
      )}

      {/* Output Filename */}
      <div className="property-group">
        <label className="property-label">Output Filename</label>
        <input
          type="text"
          className="organise-input"
          value={outputName}
          onChange={(e) => setOutputName(e.target.value)}
          placeholder="merged-document.pdf"
        />
      </div>

      {/* Action Buttons */}
      <div className="organise-actions-stack">
        <button
          type="button"
          className="btn btn-primary btn-block btn-organise-execute"
          onClick={onExecuteMerge}
          disabled={isProcessing || fileList.length < 2}
        >
          {isProcessing ? (
            <>
              <Loader2 size={14} className="spin-icon" />
              <span>Merging Documents...</span>
            </>
          ) : (
            <>
              <Layers size={14} />
              <span>Merge {fileList.length} PDFs</span>
            </>
          )}
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => setActiveToolId(null)}
          disabled={isProcessing}
        >
          Cancel
        </button>
      </div>

      {fileList.length < 2 && (
        <span className="validation-helper text-center">Add at least 2 PDFs to enable merge.</span>
      )}
    </div>
  );
}

