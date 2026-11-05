import test from 'node:test';
import assert from 'node:assert/strict';
import { sortRecordingProgress, recordingOrderError } from '../src/utils/originalsRecordingOrder.js';

test('recording progress puts approvals first, current round next, then numbered future roles', () => {
  const roles = [{ name: 'Vocal', recordingOrder: 3 }, { name: 'Bass', isCurrent: true, recordingOrder: 4 }, { name: 'Click', timingState: 'complete', recordingOrder: 1 }, { name: 'Keys', recordingOrder: 2 }, { name: 'Guitar' }];
  assert.deepEqual(sortRecordingProgress(roles).map(role => role.name), ['Click', 'Bass', 'Keys', 'Vocal', 'Guitar']);
  assert.equal(roles[0].name, 'Vocal');
});
test('recording order is optional, partial, unique and limited to whole numbers 1–30', () => {
  assert.equal(recordingOrderError([{ recordingOrder: '' }, {}, { recordingOrder: '3' }]), '');
  for (const roles of [[{ recordingOrder: 1 }, { recordingOrder: '1' }], [{ recordingOrder: 0 }], [{ recordingOrder: 31 }], [{ recordingOrder: 1.5 }]]) assert.ok(recordingOrderError(roles));
});
