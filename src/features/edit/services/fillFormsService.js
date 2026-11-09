import { 
  PDFTextField, 
  PDFCheckBox, 
  PDFRadioGroup, 
  PDFDropdown,
  PDFName
} from 'pdf-lib';
import { safeLoadPDF } from '../../organise/services/pageOperations.js';

/**
 * Checks if a PDF document contains an XFA form.
 * @param {import('pdf-lib').PDFDocument} doc
 * @returns {boolean}
 */
export function hasXFAForm(doc) {
  try {
    const acroForm = doc.catalog.lookupMaybe(PDFName.of('AcroForm'));
    if (acroForm && typeof acroForm.has === 'function') {
      return acroForm.has(PDFName.of('XFA'));
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Inspects a PDF and returns metadata about all standard AcroForm fields.
 * @param {Uint8Array | ArrayBuffer} pdfInput
 * @returns {Promise<{ isXfa: boolean, hasFields: boolean, fields: Array<{ name: string, type: 'text'|'checkbox'|'radio'|'dropdown'|'unknown', value: any, options?: string[], isReadOnly: boolean }> }>}
 */
export async function getAcroFormFields(pdfInput) {
  const doc = await safeLoadPDF(pdfInput, 'Inspect Forms');
  
  if (hasXFAForm(doc)) {
    return {
      isXfa: true,
      hasFields: false,
      fields: []
    };
  }

  const form = doc.getForm();
  const rawFields = form.getFields();

  if (!rawFields || rawFields.length === 0) {
    return {
      isXfa: false,
      hasFields: false,
      fields: []
    };
  }

  const result = [];

  for (const field of rawFields) {
    const name = field.getName();
    const isReadOnly = field.isReadOnly();
    let type = 'unknown';
    let value = '';
    let options = [];

    if (field instanceof PDFTextField) {
      type = 'text';
      value = field.getText() || '';
    } else if (field instanceof PDFCheckBox) {
      type = 'checkbox';
      value = field.isChecked();
    } else if (field instanceof PDFRadioGroup) {
      type = 'radio';
      options = field.getOptions();
      value = field.getSelected() || '';
    } else if (field instanceof PDFDropdown) {
      type = 'dropdown';
      options = field.getOptions();
      const selected = field.getSelected();
      value = selected && selected.length > 0 ? selected[0] : '';
    }

    result.push({
      name,
      type,
      value,
      options,
      isReadOnly
    });
  }

  return {
    isXfa: false,
    hasFields: result.length > 0,
    fields: result
  };
}

/**
 * Fills standard AcroForm fields and generates updated field appearances.
 * 
 * @param {Uint8Array | ArrayBuffer} pdfInput - Source PDF bytes
 * @param {object} options
 * @param {Record<string, any>} options.fieldValues - Map of field name to value
 * @param {boolean} [options.flatten=false] - Whether to flatten the form fields into static graphics
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number, modifiedFieldsCount: number }>}
 */
export async function fillAcroForm(pdfInput, options) {
  const { fieldValues = {}, flatten = false } = options || {};

  const doc = await safeLoadPDF(pdfInput, 'Fill Form');

  if (hasXFAForm(doc)) {
    throw new Error('This document contains an XFA form. Interactive editing of this form is not supported by PDF Studio.');
  }

  const form = doc.getForm();
  let modifiedCount = 0;

  for (const [name, val] of Object.entries(fieldValues)) {
    try {
      const field = form.getField(name);
      if (!field || field.isReadOnly()) continue;

      if (field instanceof PDFTextField) {
        field.setText(val !== null && val !== undefined ? String(val) : '');
        modifiedCount++;
      } else if (field instanceof PDFCheckBox) {
        if (val) {
          field.check();
        } else {
          field.uncheck();
        }
        modifiedCount++;
      } else if (field instanceof PDFRadioGroup) {
        if (val && field.getOptions().includes(String(val))) {
          field.select(String(val));
          modifiedCount++;
        }
      } else if (field instanceof PDFDropdown) {
        if (val && field.getOptions().includes(String(val))) {
          field.select(String(val));
          modifiedCount++;
        }
      }
    } catch (fieldErr) {
      console.warn(`Could not set field "${name}":`, fieldErr);
    }
  }

  // Update appearances so all standard viewers render the filled values
  try {
    form.updateFieldAppearances();
  } catch (appErr) {
    console.warn('Field appearance update note:', appErr);
  }

  // Optional flattening
  if (flatten) {
    try {
      form.flatten();
    } catch (flatErr) {
      console.warn('Form flattening note:', flatErr);
    }
  }

  const modifiedBytes = await doc.save();
  return {
    bytes: modifiedBytes,
    pageCount: doc.getPageCount(),
    modifiedFieldsCount: modifiedCount
  };
}

