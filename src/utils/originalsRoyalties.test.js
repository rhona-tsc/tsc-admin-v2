import test from 'node:test';
import assert from 'node:assert/strict';
import { plannedMasterShares, royaltyAmount, royaltyColor, streamsForAnnualIncome, remainingMasterRoyaltyPool, royaltyIllustrationAmount } from './originalsRoyalties.js';
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

test('master illustration excludes TSC from the bar and shares 100% of the remaining pool', () => {
  const pool = remainingMasterRoyaltyPool(plannedMasterShares([{ name: 'Vocal' }, { name: 'Keys' }]));
  assert.equal(pool.tscPercent, 20);
  assert.equal(pool.remainingPercent, 80);
  assert.deepEqual(pool.shares.map(({ role, percent }) => ({ role, percent })), [
    { role: 'Project owner', percent: 25 }, { role: 'Vocal', percent: 25 }, { role: 'Keys', percent: 25 },
    { role: 'Mix producer', percent: 12.5 }, { role: 'Mastering engineer', percent: 12.5 },
  ]);
});
test('normalising any number of planned roles preserves a 50% contributor pool and leaves the source credits intact', () => {
  for (const count of [0, 1, 3, 9, 20]) {
    const source = plannedMasterShares(Array.from({ length: count }, (_, i) => ({ name: `Role ${i}` })));
    const before = JSON.stringify(source), pool = remainingMasterRoyaltyPool(source);
    assert.ok(Math.abs(pool.shares.reduce((sum, share) => sum + share.percent, 0) - 100) < 1e-9);
    assert.ok(Math.abs(pool.shares.filter(share => !['Project owner', 'Mix producer', 'Mastering engineer'].includes(share.role)).reduce((sum, share) => sum + share.percent, 0) - 50) < 1e-9);
    assert.equal(JSON.stringify(source), before);
  }
});
test('annual illustrations deduct TSC once then apply the remaining-pool percentage without increasing payouts', () => {
  const full = plannedMasterShares([{ name: 'Vocal' }, { name: 'Keys' }]);
  const pool = remainingMasterRoyaltyPool(full);
  for (const share of pool.shares) {
    const original = full.find(item => item.role === share.role);
    assert.equal(royaltyIllustrationAmount({ annualIncome: 1000, share, remainingPercent: pool.remainingPercent }), royaltyAmount(1000, original.percent));
  }
  assert.equal(royaltyIllustrationAmount({ annualIncome: 1000, share: pool.shares[0] }), 200);
  assert.equal(royaltyIllustrationAmount({ annualIncome: 1000, share: pool.shares.at(-1) }), 100);
  assert.equal(royaltyIllustrationAmount({ annualIncome: 1000, share: full[0] }), 200);
});
test('approved and final six-decimal credit allocations retain currency-equivalent annual amounts', () => {
  const full = plannedMasterShares(Array.from({ length: 7 }, (_, i) => ({ name: `Role ${i}` }))).map(share => ({ ...share, percent: Number(share.percent.toFixed(6)) }));
  const pool = remainingMasterRoyaltyPool(full);
  assert.ok(Math.abs(pool.shares.reduce((sum, share) => sum + share.percent, 0) - 100) < 1e-9);
  for (const share of pool.shares) {
    const original = full.find(item => item.role === share.role);
    assert.equal(royaltyIllustrationAmount({ annualIncome: 1000000000, share }).toFixed(2), royaltyAmount(1000000000, original.percent).toFixed(2));
  }
});
test('songwriting income is not reduced by the separate master management share', () => {
  assert.equal(royaltyIllustrationAmount({ annualIncome: 1000, share: { role: 'Songwriter — Vocal', percent: 50 }, pool: 'composition' }), 500);
});
test('empty or invalid display data never creates a TSC chart row or mutates persisted credits', () => {
  assert.deepEqual(remainingMasterRoyaltyPool().shares, []);
  assert.deepEqual(remainingMasterRoyaltyPool([{ role: 'TSC', percent: 20 }, { role: 'Invalid', percent: NaN }]).shares, []);
});
