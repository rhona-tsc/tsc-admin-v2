import test from 'node:test';
import assert from 'node:assert/strict';
import { formatOriginalsDeadline } from './originalsDeadlines.js';

test('recording deadlines show a clear date, year and 24-hour UK time in winter', () => {
  assert.equal(formatOriginalsDeadline('2026-11-06T13:45:00Z'), 'Fri, 6 Nov 2026, 13:45 GMT');
});
test('summer deadlines use BST, regardless of the viewer device timezone', () => {
  assert.equal(formatOriginalsDeadline('2027-07-01T13:45:00Z'), 'Thu, 1 Jul 2027, 14:45 BST');
});
test('the repeated hour when UK clocks change is disambiguated by GMT/BST', () => {
  assert.match(formatOriginalsDeadline('2026-10-25T00:30:00Z'), /01:30 BST$/);
  assert.match(formatOriginalsDeadline('2026-10-25T01:30:00Z'), /01:30 GMT$/);
});
test('unconfirmed or malformed deadlines never display Invalid Date or an invented epoch', () => {
  for (const value of [null, undefined, '', 'invalid', 0]) assert.equal(formatOriginalsDeadline(value), '');
});
