import test from 'node:test';
import assert from 'node:assert/strict';
import { enquiryClientEmailError } from './enquiryClientEmail.js';

test('Encore accepts no client email but rejects a malformed supplied address', () => {
  assert.equal(enquiryClientEmailError(' Encore ', '  '), '');
  assert.ok(enquiryClientEmailError('Encore', 'not-an-email'));
  assert.equal(enquiryClientEmailError('Encore', 'client@example.com'), '');
});
test('other enquiry sources still require a valid email', () => {
  for (const source of ['Direct', 'Entertainment Nation', '']) {
    assert.ok(enquiryClientEmailError(source, ''));
    assert.equal(enquiryClientEmailError(source, 'client@example.com'), '');
  }
});
