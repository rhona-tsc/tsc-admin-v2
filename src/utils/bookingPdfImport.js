export const MAX_ENCORE_DOCUMENTS = 8;
const MAX_PDF_BYTES = 15 * 1024 * 1024;

export function bookingPdfImportForm({ type, encoreFiles = [], contractFile, supportingFile }) {
  const files = type === 'encore' ? encoreFiles : [contractFile, supportingFile].filter(Boolean);
  if (!files.length || (type !== 'encore' && !contractFile)) {
    throw new Error(type === 'encore' ? 'Choose the Encore booking PDFs first.' : 'Choose a booking or contract PDF first.');
  }
  if (files.length > MAX_ENCORE_DOCUMENTS) throw new Error('Choose up to eight PDFs for one Encore booking.');
  if (files.some(file => file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name))) throw new Error('Please choose PDF files only.');
  if (files.some(file => file.size > MAX_PDF_BYTES)) throw new Error('Each PDF must be 15 MB or smaller.');
  const form = new FormData();
  if (type === 'encore') files.forEach(file => form.append('encoreDocuments', file));
  else {
    form.append('contract', contractFile);
    if (supportingFile) form.append('invoice', supportingFile);
  }
  return form;
}
