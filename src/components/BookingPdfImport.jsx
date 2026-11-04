import { useState } from 'react';
import { bookingPdfImportForm } from '../utils/bookingPdfImport.js';

export default function BookingPdfImport({ importing, onPreview }) {
  const [type, setType] = useState('contract');
  const [encoreFiles, setEncoreFiles] = useState([]);
  const [contractFile, setContractFile] = useState(null);
  const [supportingFile, setSupportingFile] = useState(null);
  const [error, setError] = useState('');
  const canPreview = type === 'encore' ? encoreFiles.length > 0 : Boolean(contractFile);

  const preview = () => {
    try {
      const form = bookingPdfImportForm({ type, encoreFiles, contractFile, supportingFile });
      setError('');
      onPreview(form);
    } catch (cause) {
      setError(cause.message);
    }
  };

  return <section className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3" aria-labelledby="booking-pdf-heading">
    <h2 id="booking-pdf-heading" className="mb-2 text-sm font-semibold text-blue-950">Import a booking from PDFs</h2>
    <label className="mb-3 flex max-w-xs flex-col gap-1 text-xs text-gray-700">
      Booking PDF type
      <select value={type} disabled={importing} onChange={event => { setType(event.target.value); setError(''); }} className="rounded border bg-white px-2 py-2 text-sm">
        <option value="contract">Contract / other agency</option>
        <option value="encore">Encore booking</option>
      </select>
    </label>
    <div className="flex flex-wrap items-end gap-3">
      {type === 'encore' ? <div className="w-full min-w-0 sm:w-auto sm:flex-1">
        <p id="encore-pdf-help" className="mb-2 text-sm text-blue-950">Select the booking overview, booking accepted email and any conversation PDFs together. Up to eight PDFs for one booking, 15 MB each.</p>
        <label className="flex flex-col gap-1 text-xs text-gray-700">
          Encore booking PDFs
          <input type="file" multiple accept="application/pdf,.pdf" disabled={importing} aria-describedby="encore-pdf-help" onChange={event => { setEncoreFiles(Array.from(event.target.files || [])); setError(''); }} />
        </label>
        {encoreFiles.length > 0 && <ul className="mt-2 space-y-1 text-xs text-gray-700">{encoreFiles.map((file, index) => <li key={`${file.name}-${index}`} className="break-words">{file.name}</li>)}</ul>}
      </div> : <>
        <label className="flex flex-col gap-1 text-xs text-gray-700">Booking or contract PDF
          <input type="file" accept="application/pdf,.pdf" disabled={importing} onChange={event => { setContractFile(event.target.files?.[0] || null); setError(''); }} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-700">Supporting email or invoice PDF (optional)
          <input type="file" accept="application/pdf,.pdf" disabled={importing} onChange={event => { setSupportingFile(event.target.files?.[0] || null); setError(''); }} />
        </label>
      </>}
      <button type="button" className="w-full rounded bg-blue-700 px-4 py-2 text-sm text-white disabled:opacity-50 sm:w-auto" disabled={!canPreview || importing} onClick={preview}>{importing ? 'Reading PDFs…' : 'Preview imported booking'}</button>
    </div>
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    <p className="mt-2 text-xs text-blue-900">Nothing is saved until you review the form and choose Add. Conversation requests and quoted extras are kept in notes for review.</p>
  </section>;
}
