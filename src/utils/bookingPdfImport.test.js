import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingPdfImportForm } from './bookingPdfImport.js';
const pdf = name => new File(['%PDF-1.4\ntest'], name, { type: 'application/pdf' });

test('Encore sends all five documents together and excludes the other import fields', () => {
  const files = ['overview', 'accepted', 'inbox1', 'inbox2', 'inbox3'].map(name => pdf(`${name}.pdf`));
  const form = bookingPdfImportForm({ type: 'encore', encoreFiles: files, contractFile: pdf('old.pdf') });
  assert.equal(form.getAll('encoreDocuments').length, 5);
  assert.equal(form.get('contract'), null);
  assert.equal(form.get('invoice'), null);
});

test('ordinary contract imports retain the existing two-field upload', () => {
  const form = bookingPdfImportForm({ type: 'contract', contractFile: pdf('contract.pdf'), supportingFile: pdf('supporting.pdf') });
  assert.equal(form.get('contract').name, 'contract.pdf');
  assert.equal(form.get('invoice').name, 'supporting.pdf');
  assert.equal(form.get('encoreDocuments'), null);
});

test('validates selection, count, file size and PDF type before sending', () => {
  assert.throws(() => bookingPdfImportForm({ type: 'encore' }), /Choose the Encore/);
  assert.throws(() => bookingPdfImportForm({ type: 'contract', supportingFile: pdf('support.pdf') }), /Choose a booking/);
  assert.throws(() => bookingPdfImportForm({ type: 'encore', encoreFiles: Array.from({ length: 9 }, () => pdf('test.pdf')) }), /up to eight/);
  assert.throws(() => bookingPdfImportForm({ type: 'encore', encoreFiles: [new File(['image'], 'image.png', { type: 'image/png' })] }), /PDF files only/);
  assert.throws(() => bookingPdfImportForm({ type: 'encore', encoreFiles: [new File([new Uint8Array(15 * 1024 * 1024 + 1)], 'large.pdf', { type: 'application/pdf' })] }), /15 MB/);
});
