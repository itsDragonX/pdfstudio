import React, { useState, useEffect } from 'react';
import { ShieldCheck, HardDrive, Cpu, AlertCircle } from 'lucide-react';
import { useDocument } from '../../app/store/DocumentContext';
import { formatBytes } from '../../utils/formatters';
import { getStorageEstimate } from '../../core/storage/documentStorage';

export default function StatusBar() {
  const { 
    docFile, 
    numPages, 
    currentPage, 
    pageDimensions, 
    statusMessage, 
    errorMessage 
  } = useDocument();

  const [storageUsage, setStorageUsage] = useState({ usage: 0, quota: 0 });

  useEffect(() => {
    async function checkQuota() {
      const est = await getStorageEstimate();
      setStorageUsage(est);
    }
    checkQuota();
  }, [docFile]);

  const currentPageDim = pageDimensions[currentPage - 1];
  const dimText = currentPageDim 
    ? `${Math.round(currentPageDim.width)} × ${Math.round(currentPageDim.height)} pt` 
    : '';

  return (
    <footer className="editor-statusbar">
      <div className="statusbar-left">
        {errorMessage ? (
          <div className="statusbar-entry" style={{ color: 'var(--danger)', fontWeight: 500 }}>
            <AlertCircle size={13} />
            <span>{errorMessage}</span>
          </div>
        ) : statusMessage ? (
          <div className="statusbar-entry" style={{ color: 'var(--accent)' }}>
            <Cpu size={13} className="spin-icon" />
            <span>{statusMessage}</span>
          </div>
        ) : docFile ? (
          <div className="statusbar-entry">
            <span>Page {currentPage} of {numPages}</span>
            {dimText && <span style={{ color: 'var(--text-tertiary)' }}>({dimText})</span>}
          </div>
        ) : (
          <div className="statusbar-entry">
            <span>Ready. Open a PDF to begin editing.</span>
          </div>
        )}
      </div>

      <div className="statusbar-right">
        {storageUsage.quota > 0 && (
          <div className="statusbar-entry" title="Local IndexedDB storage quota usage">
            <HardDrive size={13} />
            <span>Storage: {formatBytes(storageUsage.usage)} / {formatBytes(storageUsage.quota, 0)}</span>
          </div>
        )}

        <div className="statusbar-entry statusbar-privacy-tag" title="Local execution">
          <ShieldCheck size={13} />
          <span>Your documents stay on this device. Nothing is uploaded.</span>
        </div>
      </div>
    </footer>
  );
}
