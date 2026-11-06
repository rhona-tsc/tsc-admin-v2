import test from 'node:test';
import assert from 'node:assert/strict';
import { originalSubmissionPairsReady, originalSubmissionTakes, originalStemSubmission } from './originalsSubmission.js';

const assets = ['one', 'two', 'three', 'wet', 'fifth'].map(id => ({ _id: id, kind: 'take_stem', state: 'active', reservationId: 'booking', originalName: `${id}.wav` }))
  .concat(['mix1', 'mix2', 'mix3'].map(id => ({ _id: id, kind: 'take_mixdown', state: 'active', reservationId: 'booking' })));
const submission = { reservationId: 'booking', stemAssetIds: ['one', 'two', 'three'], mixdownAssetIds: { one: 'mix1', two: 'mix2', three: 'mix3' }, wetStemAssetId: '' };

test('three stems produce three independent reviewable takes with their matching listening mixes', () => {
  assert.equal(originalSubmissionPairsReady(submission, assets), true);
  const takes = originalSubmissionTakes(submission, assets);
  assert.deepEqual(takes.map(take => [take.label, take.stemAssetIds, take.mixdownAssetId]), [
    ['one.wav', ['one'], 'mix1'], ['two.wav', ['two'], 'mix2'], ['three.wav', ['three'], 'mix3'],
  ]);
  // The owner can accept the second option without accepting either alternative.
  assert.equal(takes[1].stemAssetId, 'two');
});

test('explicit legacy mix-required validation checks each mix belongs to its reservation', () => {
  for (const mapping of [{ one: 'mix1', two: 'mix2' }, { one: 'mix1', two: 'mix1', three: 'mix3' }, { ...submission.mixdownAssetIds, two: 'one' }]) {
    assert.equal(originalSubmissionPairsReady({ ...submission, mixdownAssetIds: mapping }, assets, { listeningMixRequired: true }), false);
  }
  for (const change of [{ state: 'hidden' }, { reservationId: 'another' }]) {
    assert.equal(originalSubmissionPairsReady(submission, assets.map(asset => asset._id === 'mix2' ? { ...asset, ...change } : asset)), false);
  }
  assert.equal(originalSubmissionPairsReady({ ...submission, stemAssetIds: [] }, assets), false);
});

test('removing an option excludes its remembered mapping and effects remain with the first stem', () => {
  const changed = { ...submission, stemAssetIds: ['two', 'three'], wetStemAssetId: 'wet' };
  assert.equal(originalSubmissionPairsReady(changed, assets), true);
  const takes = originalSubmissionTakes(changed, assets);
  assert.equal(takes.length, 2);
  assert.equal(takes[0].wetStemAssetId, 'wet');
  assert.equal(takes[1].wetStemAssetId, undefined);
  assert.equal(originalSubmissionPairsReady({ ...submission, wetStemAssetId: 'wet' }, assets), true);
  assert.equal(originalSubmissionPairsReady({ ...changed, wetStemAssetId: 'two' }, assets), false);
});

test('foundation submissions can contain independent stems without listening mixes', () => {
  const first = { ...submission, mixdownAssetIds: {} };
  assert.equal(originalSubmissionPairsReady(first, assets, { listeningMixRequired: false }), true);
  assert.equal(originalSubmissionPairsReady(first, assets), true);
  assert.equal(originalSubmissionPairsReady(first, assets, { listeningMixRequired: true }), false);
  assert.deepEqual(originalSubmissionTakes(first, assets).map(take => take.mixdownAssetId), [null, null, null]);
});

test('optional foundation mixes still need valid, distinct, current-reservation uploads', () => {
  const first = { ...submission, mixdownAssetIds: { one: 'mix1' } };
  const options = { listeningMixRequired: false };
  assert.equal(originalSubmissionPairsReady(first, assets, options), true);
  assert.equal(originalSubmissionPairsReady({ ...first, mixdownAssetIds: { one: 'one' } }, assets, options), false);
  assert.equal(originalSubmissionPairsReady({ ...first, mixdownAssetIds: { one: 'mix1', two: 'mix1' } }, assets, options), false);
  assert.equal(originalSubmissionPairsReady(first, assets.map(asset => asset._id === 'mix1' ? { ...asset, reservationId: 'other' } : asset), options), false);
  assert.equal(originalSubmissionPairsReady({ ...first, stemAssetIds: [] }, assets, options), false);
  assert.equal(originalSubmissionPairsReady({ ...first, stemAssetIds: ['one','two','three','wet','fifth'] }, assets, options), false);
});


test('the current form submits stems alone and discards stale listening-mix selections', () => {
  const draft = { ...submission, stemAssetIds: ['one'], mixdownAssetIds: { one: 'missing-old-mix' } };
  const result = originalStemSubmission(draft, assets);
  assert.equal(result.ready, true); assert.equal(result.message, '');
  assert.equal(result.takes[0].stemAssetId, 'one'); assert.equal(result.takes[0].mixdownAssetId, null);
  assert.equal(draft.mixdownAssetIds.one, 'missing-old-mix');
  assert.equal(originalStemSubmission({ ...draft, mixdownAssetIds: undefined }, assets).ready, true);
});
test('an effects reference alone explains that a main stem must be selected, while a paired effects reference is valid', () => {
  const draft = { ...submission, stemAssetIds: [], wetStemAssetId: 'wet' };
  const blocked = originalStemSubmission(draft, assets);
  assert.equal(blocked.ready, false); assert.match(blocked.message, /Include at least one file/); assert.deepEqual(blocked.takes, []);
  const paired = originalStemSubmission({ ...draft, stemAssetIds: ['one'] }, assets);
  assert.equal(paired.ready, true); assert.equal(paired.takes[0].wetStemAssetId, 'wet'); assert.equal(paired.takes[0].mixdownAssetId, null);
});
test('stem-only submission still rejects missing, hidden, wrong-reservation or duplicate stems and excess files', () => {
  for (const draft of [{ ...submission, reservationId: '' }, { ...submission, stemAssetIds: ['missing'] }, { ...submission, stemAssetIds: ['one','one'] }, { ...submission, stemAssetIds: ['one','two','three','wet','fifth'] }]) {
    const result = originalStemSubmission(draft, assets); assert.equal(result.ready, false); assert.ok(result.message); assert.deepEqual(result.takes, []);
  }
  for (const change of [{ state: 'hidden' }, { reservationId: 'other' }]) assert.equal(originalStemSubmission(submission, assets.map(asset => asset._id === 'one' ? { ...asset, ...change } : asset)).ready, false);
  assert.equal(originalStemSubmission({ ...submission, wetStemAssetId: 'one', stemAssetIds: ['one'] }, assets).ready, false);
});

test('four stems allow two ideas with clean and effects versions, while a fifth is rejected', () => {
  const draft = { reservationId: 'booking', stemAssetIds: ['one','two','three','wet'], effectsByAssetId: { one:'without_effects',two:'with_effects',three:'without_effects',wet:'with_effects' } };
  const result=originalStemSubmission(draft,assets); assert.equal(result.ready,true); assert.equal(result.takes.length,4); assert.deepEqual(result.takes.map(take=>take.effects),['without_effects','with_effects','without_effects','with_effects']);
  assert.equal(originalStemSubmission({...draft,stemAssetIds:[...draft.stemAssetIds,'fifth']},assets).ready,false);
});
