import test from 'node:test';
import assert from 'node:assert/strict';
import { plannedMasterShares, royaltyAmount } from './originalsRoyalties.js';
test('planned contributor pool stays at 40% and all allocations total 100%', () => {
  for (const roles of [[], [{ name: '' }], [{ name: 'Keys' }], [{ name: 'Keys' }, { name: 'Bass' }, { name: 'Vocals' }]]) {
    const shares = plannedMasterShares(roles);
    assert.ok(Math.abs(shares.reduce((sum, share) => sum + share.percent, 0) - 100) < 1e-9);
    assert.equal(shares.at(-1).percent, 10);
  }
  assert.equal(plannedMasterShares([{ name: 'Keys' }, { name: 'Bass' }])[2].percent, 20);
});
test('income examples apply only the selected percentage and handle cleared or invalid assumptions', () => {
  assert.equal(royaltyAmount(1000, 20), 200);
  assert.equal(royaltyAmount(10000, 10), 1000);
  for (const value of ['', -5, 'invalid', Infinity]) assert.equal(royaltyAmount(value, 20), 0);
});
