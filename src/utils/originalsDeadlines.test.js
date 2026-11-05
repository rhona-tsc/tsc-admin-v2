import test from 'node:test';
import assert from 'node:assert/strict';
import { formatOriginalsDeadline, originalsRoleDeadlineRange } from './originalsDeadlines.js';

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


test('role deadline range uses actual earliest and latest active expiries, regardless of seat order', () => {
  const slots = [
    { slotNumber: 1, state: 'active', expectedBy: '2026-11-08T10:00:00Z' },
    { slotNumber: 2, state: 'active', expectedBy: '2026-11-06T13:00:00Z' },
    { slotNumber: 3, state: 'active', expectedBy: '2026-11-07T12:00:00Z' },
  ];
  assert.deepEqual(originalsRoleDeadlineRange(slots), { earliest: '2026-11-06T13:00:00Z', latest: '2026-11-08T10:00:00Z', count: 3 });
  assert.equal(slots[0].slotNumber, 1);
});
test('submitted, released and invalid slots never affect the outstanding deadline range', () => {
  const active = { state: 'active', expectedBy: '2026-11-06T13:00:00Z' };
  assert.deepEqual(originalsRoleDeadlineRange([active, { state: 'submitted', expectedBy: '2026-12-01T12:00:00Z' }, { state: 'released', expectedBy: '2026-11-05T12:00:00Z' }, { state: 'active', expectedBy: null }, { state: 'active', expectedBy: 'invalid' }]), { earliest: active.expectedBy, latest: active.expectedBy, count: 1 });
  assert.equal(originalsRoleDeadlineRange(), null);
  assert.equal(originalsRoleDeadlineRange([{ state: 'submitted', expectedBy: null }]), null);
});
test('deadline range preserves actual time ordering across a UK clock change', () => {
  const range = originalsRoleDeadlineRange([{ state: 'active', expectedBy: '2026-10-25T01:30:00Z' }, { state: 'active', expectedBy: '2026-10-25T00:45:00Z' }]);
  assert.match(formatOriginalsDeadline(range.earliest), /01:45 BST$/);
  assert.match(formatOriginalsDeadline(range.latest), /01:30 GMT$/);
});
