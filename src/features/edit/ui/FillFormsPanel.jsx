import React, { useState, useEffect } from 'react';
import { 
  FormInput, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Info, 
  AlertTriangle,
  RotateCcw,
  Check
} from 'lucide-react';
import { useDocument } from '../../../app/store/DocumentContext.jsx';
import { useEdit } from '../hooks/useEdit.js';
import { getAcroFormFields } from '../services/fillFormsService.js';

export default function FillFormsPanel() {
  const { docFile, setActiveToolId } = useDocument();
  const { handleApplyForm, isProcessing, error, successMessage } = useEdit();

  const [isLoadingFields, setIsLoadingFields] = useState(true);
  const [formMeta, setFormMeta] = useState({ isXfa: false, hasFields: false, fields: [] });
  const [fieldValues, setFieldValues] = useState({});
  const [flatten, setFlatten] = useState(false);

  // Inspect form fields on mount or when docFile changes
  useEffect(() => {
    let isCancelled = false;

    async function inspect() {
      if (!docFile?.bytes) {
        setIsLoadingFields(false);
        return;
      }
      setIsLoadingFields(true);
      try {
        const meta = await getAcroFormFields(docFile.bytes);
        if (!isCancelled) {
          setFormMeta(meta);
          // Initialize field values
          const initial = {};
          meta.fields.forEach((f) => {
            initial[f.name] = f.value ?? (f.type === 'checkbox' ? false : '');
          });
          setFieldValues(initial);
        }
      } catch (err) {
        console.warn('Form inspection error:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingFields(false);
        }
      }
    }

    inspect();
    return () => {
      isCancelled = true;
    };
  }, [docFile?.bytes]);

  const handleTextChange = (name, val) => {
    setFieldValues((prev) => ({ ...prev, [name]: val }));
  };

  const handleCheckboxChange = (name, checked) => {
    setFieldValues((prev) => ({ ...prev, [name]: checked }));
  };

  const handleRadioChange = (name, val) => {
    setFieldValues((prev) => ({ ...prev, [name]: val }));
  };

  const handleResetForm = () => {
    const reset = {};
    formMeta.fields.forEach((f) => {
      reset[f.name] = f.value ?? (f.type === 'checkbox' ? false : '');
    });
    setFieldValues(reset);
  };

  const onExecuteSave = async () => {
    try {
      await handleApplyForm(fieldValues, flatten);
    } catch {
      // Handled by hook
    }
  };

  return (
    <div className="organise-tool-panel edit-forms-panel">
      <div className="organise-panel-desc">
        Inspect and fill standard interactive PDF AcroForms.
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

      {/* Loading State */}
      {isLoadingFields && (
        <div className="loading-state-container">
          <Loader2 size={18} className="spin-icon text-muted" />
          <span className="text-secondary" style={{ fontSize: '12px' }}>Scanning document for form fields...</span>
        </div>
      )}

      {/* XFA Warning */}
      {!isLoadingFields && formMeta.isXfa && (
        <div className="organise-banner banner-warning" role="alert">
          <AlertTriangle size={15} className="flex-shrink-0" />
          <div style={{ fontSize: '11px', lineHeight: '1.35' }}>
            <strong>Dynamic XFA Form Detected:</strong> This PDF uses proprietary Adobe XML Forms Architecture (XFA). Standard PDF AcroForm filling is not supported for dynamic XFA documents.
          </div>
        </div>
      )}

      {/* Empty State: No form fields */}
      {!isLoadingFields && !formMeta.isXfa && !formMeta.hasFields && (
        <div className="form-empty-state">
          <div className="form-empty-icon-wrap">
            <FormInput size={24} />
          </div>
          <span className="form-empty-title">No Interactive Fields Found</span>
          <p className="form-empty-desc">
            This document does not contain fillable AcroForm fields. If you need to add text to this PDF, you can use the <strong>Add Text</strong> tool.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveToolId('add-text')}
          >
            Switch to Add Text Tool
          </button>
        </div>
      )}

      {/* Form Fields List */}
      {!isLoadingFields && !formMeta.isXfa && formMeta.hasFields && (
        <div className="form-fields-container">
          <div className="form-fields-header">
            <span className="form-fields-count">{formMeta.fields.length} Fillable Fields</span>
            <button
              type="button"
              className="btn-icon-subtle"
              onClick={handleResetForm}
              title="Reset fields to original values"
              aria-label="Reset fields"
            >
              <RotateCcw size={12} />
            </button>
          </div>

          <div className="form-fields-scroll-list">
            {formMeta.fields.map((field) => {
              const val = fieldValues[field.name];

              return (
                <div key={field.name} className="form-field-card">
                  <div className="form-field-meta">
                    <span className="form-field-label" title={field.name}>{field.name}</span>
                    <span className="form-field-type-badge">{field.type}</span>
                  </div>

                  {field.type === 'text' && (
                    <input
                      type="text"
                      className="input-field form-interactive-input"
                      value={val ?? ''}
                      onChange={(e) => handleTextChange(field.name, e.target.value)}
                      placeholder={`Enter ${field.name}...`}
                    />
                  )}

                  {field.type === 'checkbox' && (
                    <label className="checkbox-custom-label">
                      <input
                        type="checkbox"
                        checked={Boolean(val)}
                        onChange={(e) => handleCheckboxChange(field.name, e.target.checked)}
                      />
                      <span className="checkbox-text">Checked</span>
                    </label>
                  )}

                  {field.type === 'dropdown' && (
                    <select
                      className="select-field"
                      value={val ?? ''}
                      onChange={(e) => handleTextChange(field.name, e.target.value)}
                    >
                      {(field.options || []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === 'radio' && (
                    <div className="radio-group-options">
                      {(field.options || []).map((opt) => (
                        <label key={opt} className="radio-option-label">
                          <input
                            type="radio"
                            name={field.name}
                            value={opt}
                            checked={val === opt}
                            onChange={() => handleRadioChange(field.name, opt)}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Flatten Option */}
          <div className="form-flatten-option">
            <label className="checkbox-custom-label">
              <input
                type="checkbox"
                checked={flatten}
                onChange={(e) => setFlatten(e.target.checked)}
              />
              <span className="checkbox-text" style={{ fontSize: '11.5px' }}>
                Flatten form fields into permanent page graphics (read-only)
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="organise-action-footer">
        {!isLoadingFields && formMeta.hasFields && (
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={onExecuteSave}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 size={14} className="spin-icon" />
                <span>Saving Form Values...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Save Form Changes</span>
              </>
            )}
          </button>
        )}

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

