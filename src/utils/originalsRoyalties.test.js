import test from 'node:test';
import assert from 'node:assert/strict';
import { plannedMasterShares, royaltyAmount, royaltyColor, streamsForAnnualIncome } from './originalsRoyalties.js';
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

test('fixed royalty roles retain distinct colours when contributor roles are added or reordered', () => {
  const roles = ['Vocal', 'Guitar', 'Bass', 'Keys', 'Drums'].map(name => ({ name }));
  const shares = plannedMasterShares(roles);
  assert.equal(new Set(shares.map(share => royaltyColor(share.role, roles))).size, shares.length);
  for (const role of ['Project owner', 'Mix producer', 'Mastering engineer']) assert.equal(royaltyColor(role, roles), royaltyColor(role, [...roles, { name: 'Strings' }]));
  assert.equal(royaltyColor('Songwriter — Bass', roles), royaltyColor('Bass', roles));
});
test('annual streaming illustrations divide the whole recording pool by the editable assumption', () => {
  assert.equal(streamsForAnnualIncome(100, 0.004), 25000);
  assert.equal(streamsForAnnualIncome(1000, 0.004), 250000);
  assert.equal(streamsForAnnualIncome(10000, 0.004), 2500000);
  assert.equal(streamsForAnnualIncome(100, 0.003), 33334);
  assert.equal(streamsForAnnualIncome(0, 0.004), 0);
  for (const rate of ['', 0, -1, 'invalid', Infinity]) assert.equal(streamsForAnnualIncome(100, rate), null);
});
