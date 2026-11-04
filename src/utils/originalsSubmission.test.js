import test from 'node:test';
import assert from 'node:assert/strict';
import { originalSubmissionPairsReady, originalSubmissionTakes } from './originalsSubmission.js';

const assets = ['one', 'two', 'three', 'wet'].map(id => ({ _id: id, kind: 'take_stem', state: 'active', reservationId: 'booking', originalName: `${id}.wav` }))
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

test('every selected stem needs its own active mix owned by the same reservation', () => {
  for (const mapping of [{ one: 'mix1', two: 'mix2' }, { one: 'mix1', two: 'mix1', three: 'mix3' }, { ...submission.mixdownAssetIds, two: 'one' }]) {
    assert.equal(originalSubmissionPairsReady({ ...submission, mixdownAssetIds: mapping }, assets), false);
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
  assert.equal(originalSubmissionPairsReady({ ...submission, wetStemAssetId: 'wet' }, assets), false);
  assert.equal(originalSubmissionPairsReady({ ...changed, wetStemAssetId: 'two' }, assets), false);
});
