import React, { useState, useRef, useEffect } from 'react';
import { 
  FileSignature, 
  PenTool, 
  Type, 
  Upload, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Crosshair,
  Info
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useEditContext } from '../context/EditContext.jsx';
import { useEdit } from '../hooks/useEdit.js';

export default function SignPanel() {
  const { numPages, setActiveToolId } = useDocument();
  const { targetPageIndex, setTargetPageIndex, editPayload, updateEditPayload } = useEditContext();
  const { handleApplySignature, isProcessing, error, setError, successMessage } = useEdit();

  const [activeTab, setActiveTab] = useState('draw'); // 'draw' | 'type' | 'upload'
  const [typedName, setTypedName] = useState('John Doe');
  const [cursiveStyle, setCursiveStyle] = useState('Dancing Script');

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const fileInputRef = useRef(null);

  const previewUrl = editPayload.previewUrl ?? '';
  const x = Math.round(editPayload.x ?? 150);
  const y = Math.round(editPayload.y ?? 200);
  const width = Math.round(editPayload.width ?? 180);
  const height = Math.round(editPayload.height ?? 60);

  // Setup drawing canvas
  useEffect(() => {
    if (activeTab !== 'draw' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
  }, [activeTab]);

  const startDraw = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    isDrawingRef.current = true;
  };

  const drawMove = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    updateEditPayload({
      signatureData: dataUrl,
      previewUrl: dataUrl,
      method: 'draw'
    });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateEditPayload({
      signatureData: null,
      previewUrl: ''
    });
  };

  // Type method: generate cursive PNG
  const renderTypedSignature = (name, style) => {
    const offscreen = document.createElement('canvas');
    offscreen.width = 400;
    offscreen.height = 120;
    const ctx = offscreen.getContext('2d');
    ctx.font = `italic 42px "${style}", "Brush Script MT", "Caveat", "Segoe Script", cursive`;
    ctx.fillStyle = '#0B2545';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(name, 200, 60);

    const dataUrl = offscreen.toDataURL('image/png');
    updateEditPayload({
      signatureData: dataUrl,
      previewUrl: dataUrl,
      method: 'type'
    });
  };

  useEffect(() => {
    if (activeTab === 'type') {
      renderTypedSignature(typedName, cursiveStyle);
    }
  }, [activeTab, typedName, cursiveStyle]);

  // Upload method
  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      setError('Please select a PNG or JPEG signature image.');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const url = URL.createObjectURL(file);
      updateEditPayload({
        signatureData: bytes,
        previewUrl: url,
        method: 'upload'
      });
    } catch (err) {
      setError('Failed to load signature file: ' + err.message);
    }
  };

  const onExecuteApply = async () => {
    try {
      await handleApplySignature();
    } catch {
      // Handled by hook
    }
  };

  return (
    <div className="organise-tool-panel edit-sign-panel">
      {/* Prominent Legal Notice */}
      <div className="organise-banner banner-info" role="note">
        <Info size={14} className="flex-shrink-0" />
        <div style={{ fontSize: '11px', lineHeight: '1.35' }}>
          <strong>Visual Signature Only:</strong> This places a visual signature stamp onto the PDF page. It is not a cryptographic X.509 digital certificate signature.
        </div>
      </div>

      {error && (
        <div className="organise-banner banner-error" role="alert">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="organise-banner banner-success" role="status">
          <CheckCircle2 size={14} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Target Page */}
      <div className="property-group">
        <label className="property-label" htmlFor="sign-target-page">Target Page</label>
        <select 
          id="sign-target-page"
          className="select-field"
          value={targetPageIndex}
          onChange={(e) => setTargetPageIndex(parseInt(e.target.value, 10))}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <option key={i} value={i}>
              Page {i + 1} of {numPages}
            </option>
          ))}
        </select>
      </div>

      {/* Method Tabs */}
      <div className="property-group">
        <label className="property-label">Creation Method</label>
        <div className="organise-segmented-control" role="tablist">
          <button
            type="button"
            className={`segmented-pill ${activeTab === 'draw' ? 'active' : ''}`}
            onClick={() => setActiveTab('draw')}
            role="tab"
            aria-selected={activeTab === 'draw'}
          >
            <PenTool size={13} />
            <span>Draw</span>
          </button>
          <button
            type="button"
            className={`segmented-pill ${activeTab === 'type' ? 'active' : ''}`}
            onClick={() => setActiveTab('type')}
            role="tab"
            aria-selected={activeTab === 'type'}
          >
            <Type size={13} />
            <span>Type</span>
          </button>
          <button
            type="button"
            className={`segmented-pill ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
            role="tab"
            aria-selected={activeTab === 'upload'}
          >
            <Upload size={13} />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Draw Pad */}
      {activeTab === 'draw' && (
        <div className="signature-pad-container">
          <div className="signature-canvas-wrap">
            <canvas
              ref={canvasRef}
              width={260}
              height={110}
              className="signature-canvas-pad"
              onMouseDown={startDraw}
              onMouseMove={drawMove}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={drawMove}
              onTouchEnd={endDraw}
            />
            <div className="signature-baseline-indicator" />
          </div>
          <div className="signature-pad-footer">
            <span className="signature-hint">Sign above the line</span>
            <button
              type="button"
              className="btn-icon-subtle"
              onClick={clearCanvas}
              title="Clear signature pad"
              aria-label="Clear pad"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Mode 2: Type Cursive */}
      {activeTab === 'type' && (
        <div className="signature-type-container">
          <div className="property-group">
            <label className="property-label" htmlFor="typed-name-input">Your Full Name</label>
            <input
              id="typed-name-input"
              type="text"
              className="input-field"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Type your name..."
            />
          </div>
          <div className="property-group">
            <label className="property-label" htmlFor="cursive-style-select">Cursive Calligraphy Style</label>
            <select
              id="cursive-style-select"
              className="select-field"
              value={cursiveStyle}
              onChange={(e) => setCursiveStyle(e.target.value)}
            >
              <option value="Dancing Script">Modern Flourish (Dancing Script)</option>
              <option value="Brush Script MT">Classic Formal (Brush Script)</option>
              <option value="Caveat">Casual Handwritten (Caveat)</option>
              <option value="Segoe Script">Executive Script (Segoe)</option>
            </select>
          </div>
          {previewUrl && (
            <div className="signature-typed-preview-box">
              <img src={previewUrl} alt="Signature Preview" className="signature-preview-img" />
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Upload Image */}
      {activeTab === 'upload' && (
        <div className="signature-upload-container">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            style={{ display: 'none' }}
            onChange={handleUploadFile}
          />
          {!previewUrl || editPayload.method !== 'upload' ? (
            <button
              type="button"
              className="file-drop-target"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={20} className="file-drop-icon" />
              <span className="file-drop-title">Upload Signature</span>
              <span className="file-drop-hint">Transparent PNG recommended</span>
            </button>
          ) : (
            <div className="signature-uploaded-preview">
              <img src={previewUrl} alt="Uploaded signature" className="signature-preview-img" />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fileInputRef.current?.click()}
                style={{ marginTop: '8px' }}
              >
                Choose Different File
              </button>
            </div>
          )}
        </div>
      )}

      {/* Placement Readout */}
      {previewUrl && (
        <div className="organise-info-box">
          <Crosshair size={13} className="info-icon" />
          <div className="info-text">
            <strong>Position:</strong> ({x}, {y}). Drag signature box on page {targetPageIndex + 1} to position.
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="organise-action-footer">
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={onExecuteApply}
          disabled={isProcessing || !editPayload.signatureData}
        >
          {isProcessing ? (
            <>
              <Loader2 size={14} className="spin-icon" />
              <span>Placing Signature...</span>
            </>
          ) : (
            <>
              <FileSignature size={14} />
              <span>Place Signature on Page {targetPageIndex + 1}</span>
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
    </div>
  );
}

